/**
 * AWS Production Storage Driver
 * Connects to Amazon DynamoDB, Amazon S3, and Amazon SESv2 using AWS SDK v3.
 * Supports dependency injection for testing without cloud credentials.
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client } = require('@aws-sdk/client-s3');
const { createPresignedPost } = require('@aws-sdk/s3-presigned-post');
const { SESv2Client, SendEmailCommand } = require('@aws-sdk/client-sesv2');
const path = require('path');

class AwsDriver {
  constructor(options = {}) {
    this.region = options.region || process.env.AWS_REGION || 'us-east-2';
    this.tableName = options.tableName || process.env.DYNAMODB_TABLE_NAME || 'tutortime-submissions';
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
    // Key fields, metadata, and form fields at top level (each stored once)
    const item = {
      formType,
      'createdAt#id': `${now}#${id}`,
      id,
      createdAt: now,
      status: 'PENDING_REVIEW',
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
module.exports = defaultInstance;
