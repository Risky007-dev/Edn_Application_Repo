/**
 * AWS Production Storage Driver
 * Connects to Amazon DynamoDB (submissions + newsletter subscribers),
 * Amazon S3 (presigned POST CV uploads), and Amazon SESv2 using AWS SDK v3.
 * Supports dependency injection for testing without cloud credentials.
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client } = require('@aws-sdk/client-s3');
const { createPresignedPost } = require('@aws-sdk/s3-presigned-post');
const { SESv2Client, SendEmailCommand } = require('@aws-sdk/client-sesv2');
const path = require('path');
const { computeSubmissionExpireAt } = require('./retention');

class AwsDriver {
  constructor(options = {}) {
    this.region = options.region || process.env.AWS_REGION || 'us-east-2';
    this.tableName = options.tableName || process.env.DYNAMODB_TABLE_NAME || 'tutortime-submissions';
    this.subscribersTableName = options.subscribersTableName || process.env.SUBSCRIBERS_TABLE_NAME || 'popcorn-maths-subscribers';
    this.bucketName = options.bucketName || process.env.UPLOADS_BUCKET_NAME || '';

    // Injected or default AWS clients
    this.dynamoClient = options.dynamoClient || new DynamoDBClient({ region: this.region });
    this.docClient = options.docClient || DynamoDBDocumentClient.from(this.dynamoClient);
    this.s3Client = options.s3Client || new S3Client({ region: this.region });
    this.sesClient = options.sesClient || new SESv2Client({ region: this.region });
    this.createPresignedPostFn = options.createPresignedPostFn || createPresignedPost;
  }

  generateId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
  }

  async saveSubmission(formType, payload) {
    const id = this.generateId();
    const now = new Date().toISOString();

    // Canonical uniform record shape: identical to local driver
    // Key fields, metadata, TTL expireAt, and form fields at top level (each stored once)
    const item = {
      formType,
      'createdAt#id': `${now}#${id}`,
      id,
      createdAt: now,
      status: 'PENDING_REVIEW',
      expireAt: computeSubmissionExpireAt(formType, now),
      ...payload
    };

    const command = new PutCommand({
      TableName: this.tableName,
      Item: item
    });

    await this.docClient.send(command);
    return item;
  }

  async getSubmissionCount(formType) {
    if (!formType) return 0;
    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'formType = :ft',
      ExpressionAttributeValues: {
        ':ft': formType
      },
      Select: 'COUNT'
    });
    const result = await this.docClient.send(command);
    return result.Count || 0;
  }

  async addSubscriber(email) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const subscriber = {
      email: cleanEmail,
      subscribedAt: new Date().toISOString(),
      confirmed: false
    };

    try {
      await this.docClient.send(new PutCommand({
        TableName: this.subscribersTableName,
        Item: subscriber,
        ConditionExpression: 'attribute_not_exists(email)'
      }));
      return { created: true, duplicate: false, subscriber };
    } catch (err) {
      if (err && (err.name === 'ConditionalCheckFailedException' || err.__type === 'com.amazonaws.dynamodb.v20120810#ConditionalCheckFailedException')) {
        return { created: false, duplicate: true };
      }
      throw err;
    }
  }

  async listSubscribers() {
    const items = [];
    let exclusiveStartKey;
    do {
      const result = await this.docClient.send(new ScanCommand({
        TableName: this.subscribersTableName,
        ...(exclusiveStartKey ? { ExclusiveStartKey: exclusiveStartKey } : {})
      }));
      if (Array.isArray(result.Items)) {
        for (const item of result.Items) {
          items.push({
            email: item.email,
            subscribedAt: item.subscribedAt,
            confirmed: Boolean(item.confirmed)
          });
        }
      }
      exclusiveStartKey = result.LastEvaluatedKey;
    } while (exclusiveStartKey);

    return items.sort((a, b) => String(a.subscribedAt || '').localeCompare(String(b.subscribedAt || '')));
  }

  async createUploadPresignedPost(filename, mimeType = 'application/pdf') {
    if (!this.bucketName) {
      throw new Error('UPLOADS_BUCKET_NAME environment variable is not configured');
    }

    const id = this.generateId();
    const sanitized = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const now = new Date();
    const key = `cv-uploads/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${id}_${sanitized}`;

    const presignedPost = await this.createPresignedPostFn(this.s3Client, {
      Bucket: this.bucketName,
      Key: key,
      Conditions: [
        ['content-length-range', 1, 5242880], // 1 byte to 5 MB
        { 'Content-Type': mimeType }
      ],
      Fields: {
        'Content-Type': mimeType
      },
      Expires: 300 // 5 minutes
    });

    return {
      url: presignedPost.url,
      fields: presignedPost.fields,
      key,
      maxSizeBytes: 5242880
    };
  }

  async sendNotificationEmail(to, subject, bodyHtml) {
    const sender = process.env.SENDER_EMAIL;
    if (!sender) {
      console.warn('[AWS SES] SENDER_EMAIL not set, skipping notification dispatch');
      return { skipped: true };
    }

    const command = new SendEmailCommand({
      FromEmailAddress: sender,
      Destination: {
        ToAddresses: [to]
      },
      Content: {
        Simple: {
          Subject: { Data: subject },
          Body: {
            Html: { Data: bodyHtml }
          }
        }
      }
    });

    const response = await this.sesClient.send(command);
    return { success: true, messageId: response.MessageId };
  }
}

const defaultInstance = new AwsDriver();
defaultInstance.AwsDriver = AwsDriver;
defaultInstance.computeExpireAt = (formType, dateOrIso) =>
  computeSubmissionExpireAt(formType, dateOrIso instanceof Date ? dateOrIso.toISOString() : dateOrIso);
module.exports = defaultInstance;
