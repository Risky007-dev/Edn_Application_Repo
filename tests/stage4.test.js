/**
 * STAGE 4 AUTOMATED VERIFICATION SUITE
 * Tests AWS Storage Driver against injected mock clients (DynamoDB, S3, SES),
 * validates exact storage record shape identity between local and AWS drivers,
 * asserts presigned POST conditions and S3 prefixes, and performs a zero-network
 * smoke test verifying construction from environment variables.
 */

const { AwsDriver } = require('../src/shared/storage/awsDriver');
const localDriver = require('../src/shared/storage/localDriver');

function assert(description, condition) {
  if (!condition) {
    console.error(`  ✗ FAIL: ${description}`);
    throw new Error(`Assertion failed: ${description}`);
  }
  console.log(`  ✓ ${description}`);
}

async function runStage4Tests() {
  console.log('================================================================');
  console.log('       STAGE 4 AUTOMATED VERIFICATION SUITE                     ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function testAssert(desc, cond) {
    try {
      assert(desc, cond);
      passed++;
    } catch (err) {
      failed++;
      throw err;
    }
  }

  // --- 1. AWS Driver Zero-Network Smoke Test (No Injected Clients) ---
  console.log('--- 1. AWS Driver Zero-Network Smoke Test (No Injected Clients) ---');
  const savedEnv = { ...process.env };
  try {
    process.env.STORAGE_DRIVER = 'aws';
    process.env.AWS_REGION = 'us-east-2';
    process.env.DYNAMODB_TABLE_NAME = 'tutortime-submissions-smoke-test';
    process.env.UPLOADS_BUCKET_NAME = 'tutortime-uploads-smoke-bucket';

    // Construct without injected clients or options; initiates 0 network calls
    const smokeDriver = new AwsDriver();

    testAssert('AwsDriver constructs without error using default SDK clients', !!smokeDriver);
    testAssert('AwsDriver resolves region from environment', smokeDriver.region === 'us-east-2');
    testAssert('AwsDriver resolves tableName from environment', smokeDriver.tableName === 'tutortime-submissions-smoke-test');
    testAssert('AwsDriver resolves bucketName from environment', smokeDriver.bucketName === 'tutortime-uploads-smoke-bucket');
    testAssert('AwsDriver initializes dynamoClient instance', !!smokeDriver.dynamoClient);
    testAssert('AwsDriver initializes docClient instance', !!smokeDriver.docClient);
    testAssert('AwsDriver initializes s3Client instance', !!smokeDriver.s3Client);
    testAssert('AwsDriver initializes sesClient instance', !!smokeDriver.sesClient);
  } finally {
    process.env = savedEnv;
  }

  // --- 2. AWS Driver DynamoDB Injection & Exact Item Shape ---
  console.log('\n--- 2. AWS Driver DynamoDB Injection & Exact Item Shape ---');
  const sentDynamoCommands = [];
  const fakeDocClient = {
    send: async (cmd) => {
      sentDynamoCommands.push(cmd);
      return { Count: 1 };
    }
  };

  const testTableName = 'tutortime-submissions-production-test';
  const awsDriverInstance = new AwsDriver({
    tableName: testTableName,
    bucketName: 'tutortime-cv-uploads-test',
    region: 'us-east-2',
    docClient: fakeDocClient
  });

  const testPayload = {
    schoolName: 'Anguilla Island Academy',
    contactPerson: 'Sarah Connor',
    email: 'sconnor@example.edu',
    phone: '+1 264 497 1234',
    estimatedStudentCount: 45
  };

  const savedAwsItem = await awsDriverInstance.saveSubmission('SCHOOL_ENQUIRY', testPayload);

  testAssert('saveSubmission dispatches command to injected DynamoDB DocumentClient', sentDynamoCommands.length === 1);
  const putCommand = sentDynamoCommands[0];
  testAssert('PutCommand uses TableName from configuration/env', putCommand.input.TableName === testTableName);

  const writtenItem = putCommand.input.Item;
  testAssert('Written item has formType partition key', writtenItem.formType === 'SCHOOL_ENQUIRY');
  testAssert('Written item has createdAt#id sort key', typeof writtenItem['createdAt#id'] === 'string' && writtenItem['createdAt#id'].includes('#'));
  testAssert('Written item has unique id', typeof writtenItem.id === 'string' && writtenItem.id.length > 0);
  testAssert('Written item has createdAt ISO timestamp', !isNaN(Date.parse(writtenItem.createdAt)));
  testAssert('Written item has status PENDING_REVIEW', writtenItem.status === 'PENDING_REVIEW');
  testAssert('Personal field schoolName stored at top level', writtenItem.schoolName === 'Anguilla Island Academy');
  testAssert('Personal field contactPerson stored at top level', writtenItem.contactPerson === 'Sarah Connor');
  testAssert('Personal field email stored at top level', writtenItem.email === 'sconnor@example.edu');
  testAssert('Personal field phone stored at top level', writtenItem.phone === '+1 264 497 1234');
  testAssert('Numeric field estimatedStudentCount stored at top level', writtenItem.estimatedStudentCount === 45);
  testAssert('NO duplicated payload copy exists on written item', writtenItem.payload === undefined);

  // --- 3. Record Shape Identity Between Local & AWS Drivers ---
  console.log('\n--- 3. Record Shape Identity Between Local & AWS Drivers ---');
  const savedLocalItem = await localDriver.saveSubmission('SCHOOL_ENQUIRY', testPayload);

  const awsKeys = Object.keys(savedAwsItem).sort();
  const localKeys = Object.keys(savedLocalItem).sort();

  testAssert('Local driver and AWS driver store the exact same top-level keys', JSON.stringify(awsKeys) === JSON.stringify(localKeys));
  testAssert('Local driver does NOT contain duplicated payload property', savedLocalItem.payload === undefined);
  testAssert('Every personal field is stored ONCE across both drivers', 
    savedLocalItem.email === testPayload.email && 
    savedAwsItem.email === testPayload.email && 
    !('payload' in savedLocalItem) && 
    !('payload' in savedAwsItem)
  );

  // --- 4. S3 cv-uploads/ Prefix & Presigned POST Conditions ---
  console.log('\n--- 4. S3 cv-uploads/ Prefix & Presigned POST Conditions ---');
  let presignedPostArgs = null;
  const fakeCreatePresignedPost = async (client, args) => {
    presignedPostArgs = args;
    return {
      url: `https://${args.Bucket}.s3.us-east-2.amazonaws.com`,
      fields: {
        key: args.Key,
        'Content-Type': args.Fields['Content-Type'],
        policy: 'fake-policy',
        'x-amz-signature': 'fake-signature'
      }
    };
  };

  const s3DriverInstance = new AwsDriver({
    bucketName: 'tutortime-cv-uploads-test',
    region: 'us-east-2',
    createPresignedPostFn: fakeCreatePresignedPost
  });

  const presignedResult = await s3DriverInstance.createUploadPresignedPost('John_Doe_CV.pdf', 'application/pdf');

  testAssert('Presigned POST destination URL matches bucket', presignedResult.url.includes('tutortime-cv-uploads-test'));
  testAssert('Presigned S3 key starts with cv-uploads/ prefix', presignedResult.key.startsWith('cv-uploads/'));
  testAssert('Presigned S3 key preserves sanitized filename', presignedResult.key.endsWith('_John_Doe_CV.pdf'));
  testAssert('createPresignedPost was called with target bucket', presignedPostArgs && presignedPostArgs.Bucket === 'tutortime-cv-uploads-test');
  
  // Assert conditions
  const conditions = presignedPostArgs.Conditions;
  const lengthRangeCondition = conditions.find(c => Array.isArray(c) && c[0] === 'content-length-range');
  testAssert('Condition includes content-length-range 1 to 5242880 (5MB)', 
    lengthRangeCondition && lengthRangeCondition[1] === 1 && lengthRangeCondition[2] === 5242880
  );

  const contentTypeCondition = conditions.find(c => typeof c === 'object' && c['Content-Type'] === 'application/pdf');
  testAssert('Condition enforces Content-Type application/pdf', !!contentTypeCondition);

  // --- 5. SESv2 Email Dispatch With Injected Client ---
  console.log('\n--- 5. SESv2 Email Dispatch With Injected Client ---');
  const sentSesCommands = [];
  const fakeSesClient = {
    send: async (cmd) => {
      sentSesCommands.push(cmd);
      return { MessageId: 'fake-msg-0001' };
    }
  };

  process.env.SENDER_EMAIL = 'notifications@tutortime.example';
  const sesDriverInstance = new AwsDriver({
    sesClient: fakeSesClient
  });

  const emailResult = await sesDriverInstance.sendNotificationEmail(
    'admin@tutortime.example',
    'New Application Received',
    '<p>Application details</p>'
  );

  testAssert('sendNotificationEmail dispatches command to injected SES client', sentSesCommands.length === 1);
  const sesCommandInput = sentSesCommands[0].input;
  testAssert('SES command uses configured sender email', sesCommandInput.FromEmailAddress === 'notifications@tutortime.example');
  testAssert('SES command delivers to recipient', sesCommandInput.Destination.ToAddresses[0] === 'admin@tutortime.example');
  testAssert('SES returns message ID', emailResult.messageId === 'fake-msg-0001');

  console.log('================================================================');
  console.log(`STAGE 4 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');
}

runStage4Tests().catch(err => {
  console.error('Fatal error in Stage 4 test suite:', err);
  process.exit(1);
});
