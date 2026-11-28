/**
 * Deployment Readiness & CloudFormation Architecture Verification Suite
 * 100% local & offline (zero AWS calls, zero live emails, zero live AI calls).
 * Verifies all 7 pre-deployment fixes, Lambda+CloudFront compatibility,
 * DynamoDB newsletter + chatbot atomic counter, CSP S3 connect-src,
 * logger token redaction, X-Origin-Verify gate, and CFN template hygiene.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const { buildConnectSrc } = require('../src/shared/middleware/security');
const { sanitizeLogPath } = require('../src/shared/middleware/logger');
const { AwsDriver, computeExpireAt } = require('../src/shared/storage/awsDriver');
const localDriver = require('../src/shared/storage/localDriver');
const { isCheckinHost, getEffectiveHost } = require('../src/portal/router');
const {
  handleChat,
  setInjectedClient,
  setDailyCounterDocClientForTests,
  resetDailyCounterForTests
} = require('../src/shared/chatbot/chatController');

const REPO_ROOT = path.join(__dirname, '..');
let passed = 0;
let failed = 0;

function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${name}${detail ? ` (${detail})` : ''}`);
    failed++;
  }
}

function httpRequest(port, reqPath, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path: reqPath,
      method: 'GET',
      headers
    }, (res) => {
      let body = '';
      res.on('data', (d) => { body += d; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

function waitForHealth(port, maxRetries = 40) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const tick = () => {
      http.get(`http://127.0.0.1:${port}/health`, (res) => {
        res.resume();
        if (res.statusCode === 200) return resolve();
        retry();
      }).on('error', retry);
    };
    const retry = () => {
      retries++;
      if (retries >= maxRetries) reject(new Error(`Server failed to start on ${port}`));
      else setTimeout(tick, 150);
    };
    tick();
  });
}

async function run() {
  console.log('================================================================');
  console.log('   DEPLOYMENT READINESS & LAMBDA+CLOUDFRONT TEST SUITE          ');
  console.log('================================================================\n');

  const savedEnv = { ...process.env };

  try {
    // --- 1. Dockerfile, .dockerignore, .gitignore & Legacy Hygiene ---
    console.log('--- 1. Container & Repo Hygiene ---');
    const dockerfile = fs.readFileSync(path.join(REPO_ROOT, 'Dockerfile'), 'utf8');
    const dockerignore = fs.readFileSync(path.join(REPO_ROOT, '.dockerignore'), 'utf8');
    const gitignore = fs.readFileSync(path.join(REPO_ROOT, '.gitignore'), 'utf8');
    const ecsOtel = fs.readFileSync(path.join(REPO_ROOT, 'ecs-task-definition-with-otel.json'), 'utf8');
    const ecsPlain = fs.readFileSync(path.join(REPO_ROOT, 'ecs-task-definition.json'), 'utf8');

    check('Dockerfile includes AWS Lambda Web Adapter binary',
      dockerfile.includes('/opt/extensions/lambda-adapter') &&
      (dockerfile.includes('aws-lambda-adapter') || dockerfile.includes('aws-lambda-web-adapter')));
    check('Dockerfile copies docs so /privacy works in containers', /COPY\s+docs(\/legal)?\s+\.\/docs(\/legal)?/.test(dockerfile));
    check('Dockerfile does NOT copy .env or .env.example into container', !/\.env/.test(dockerfile));
    check('Dockerfile runs as non-root USER node', /^USER\s+node/m.test(dockerfile));
    check('Dockerfile uses npm ci --omit=dev', dockerfile.includes('npm ci --omit=dev'));
    check('.gitignore does NOT ignore package-lock.json', !/^package-lock\.json$/m.test(gitignore));
    check('.dockerignore keeps docs/legal/*.md while excluding infra & root docs',
      dockerignore.includes('!docs/legal/*.md') && dockerignore.includes('infra'));
    check('No hardcoded 12-digit AWS Account ID remains in ecs-task-definition-with-otel.json', !/[0-9]{12}/.test(ecsOtel));
    check('Legacy SENDER_PASSWORD secret removed from ecs-task-definition.json', !ecsPlain.includes('SENDER_PASSWORD'));

    // --- 2. CSP Dynamic S3 connect-src ---
    console.log('\n--- 2. Helmet CSP S3 connect-src ---');
    const cspLocal = buildConnectSrc({ UPLOADS_BUCKET_NAME: '', AWS_REGION: 'us-east-2' });
    check('CSP connect-src is ["\'self\'"] when UPLOADS_BUCKET_NAME is empty',
      cspLocal.length === 1 && cspLocal[0] === "'self'");

    const cspAws = buildConnectSrc({
      UPLOADS_BUCKET_NAME: 'tutortime-production-infra-uploadsbucket-s0sf7c8ntwfh',
      AWS_REGION: 'us-east-2'
    });
    check('CSP connect-src permits regional and global S3 presigned POST URLs when bucket configured',
      cspAws.includes("'self'") &&
      cspAws.includes('https://tutortime-production-infra-uploadsbucket-s0sf7c8ntwfh.s3.us-east-2.amazonaws.com') &&
      cspAws.includes('https://tutortime-production-infra-uploadsbucket-s0sf7c8ntwfh.s3.amazonaws.com'));

    const cspInvalid = buildConnectSrc({ UPLOADS_BUCKET_NAME: 'bad bucket; script-src *', AWS_REGION: 'us-east-2' });
    check('CSP connect-src rejects malformed bucket names safely', cspInvalid.length === 1);

    // --- 3. Logger Parent Token & Query String Redaction ---
    console.log('\n--- 3. Logger Zero-PII Path Redaction ---');
    check('sanitizeLogPath redacts /p/<token> bearer links',
      sanitizeLogPath('/p/SuperSecret256BitTokenXYZ?month=2026-11') === '/p/[redacted]');
    check('sanitizeLogPath redacts nested /p/<token>/subpath links',
      sanitizeLogPath('/p/SuperSecret256BitTokenXYZ/details') === '/p/[redacted]/details');
    check('sanitizeLogPath strips query params from /book?rcSubject=Mathematics',
      sanitizeLogPath('/book?rcSubject=Mathematics&rcScore=9') === '/book');
    check('sanitizeLogPath preserves normal routes untouched',
      sanitizeLogPath('/services/popcorn-math') === '/services/popcorn-math');

    // --- 4. X-Forwarded-Host & PORTAL_HOST Routing (CloudFront -> Lambda) ---
    console.log('\n--- 4. CloudFront X-Forwarded-Host & PORTAL_HOST Routing ---');
    process.env.TRUST_PROXY = 'false';
    process.env.PORTAL_HOST = 'checkin.tutortime.ai';
    check('Without TRUST_PROXY, X-Forwarded-Host is ignored (spoof protection)',
      !isCheckinHost({ headers: { host: 'tutortime.ai', 'x-forwarded-host': 'checkin.tutortime.ai' } }));

    process.env.TRUST_PROXY = '1';
    check('With TRUST_PROXY=1, X-Forwarded-Host=checkin.tutortime.ai routes to portal',
      isCheckinHost({ headers: { host: 'abc123.lambda-url.us-east-2.on.aws', 'x-forwarded-host': 'checkin.tutortime.ai' } }));
    check('getEffectiveHost extracts lowercase host without port from X-Forwarded-Host',
      getEffectiveHost({ headers: { host: 'lambda.on.aws', 'x-forwarded-host': 'Checkin.TutorTime.AI:443, edge.net' } }) === 'checkin.tutortime.ai');

    process.env.PORTAL_HOST = 'checkin-staging.tutortime.ai';
    check('Custom PORTAL_HOST supports staging portal subdomain checkin-staging.tutortime.ai',
      isCheckinHost({ headers: { host: 'lambda.on.aws', 'x-forwarded-host': 'checkin-staging.tutortime.ai' } }) &&
      !isCheckinHost({ headers: { host: 'lambda.on.aws', 'x-forwarded-host': 'staging.tutortime.ai' } }));

    // --- 5. DynamoDB TTL & Newsletter Subscriber Storage (Mocked) ---
    console.log('\n--- 5. DynamoDB TTL & Newsletter Subscribers ---');
    const fixedDate = new Date('2026-11-26T00:00:00.000Z');
    const baseEpoch = Math.floor(fixedDate.getTime() / 1000);
    check('computeExpireAt sets 180 days for PRESENTER_APPLICATION',
      computeExpireAt('PRESENTER_APPLICATION', fixedDate) === baseEpoch + 180 * 86400);
    check('computeExpireAt sets 730 days for SCHOOL_ENQUIRY',
      computeExpireAt('SCHOOL_ENQUIRY', fixedDate) === baseEpoch + 730 * 86400);
    check('computeExpireAt sets 365 days default for BOOK_CONSULTATION',
      computeExpireAt('BOOK_CONSULTATION', fixedDate) === baseEpoch + 365 * 86400);
    check('localDriver.computeExpireAt matches awsDriver.computeExpireAt',
      localDriver.computeExpireAt('PRESENTER_APPLICATION', fixedDate) === computeExpireAt('PRESENTER_APPLICATION', fixedDate));

    const mockSubDb = new Map();
    let scanCalls = 0;
    const mockSubDocClient = {
      async send(cmd) {
        const name = cmd.constructor.name;
        if (name === 'PutCommand') {
          const email = cmd.input.Item.email;
          if (cmd.input.ConditionExpression && mockSubDb.has(email)) {
            const err = new Error('Conditional check failed');
            err.name = 'ConditionalCheckFailedException';
            throw err;
          }
          mockSubDb.set(email, cmd.input.Item);
          return {};
        }
        if (name === 'ScanCommand') {
          scanCalls++;
          const all = Array.from(mockSubDb.values());
          if (!cmd.input.ExclusiveStartKey && all.length > 1) {
            return { Items: [all[0]], LastEvaluatedKey: { email: all[0].email } };
          }
          return { Items: all.length > 1 ? all.slice(1) : all };
        }
        throw new Error(`Unexpected DynamoDB command: ${name}`);
      }
    };

    const awsSubDriver = new AwsDriver({
      subscribersTableName: 'popcorn-maths-subscribers',
      docClient: mockSubDocClient
    });

    const sub1 = await awsSubDriver.addSubscriber('ParentOne@Example.com');
    check('AwsDriver.addSubscriber inserts normalized lowercase email into DynamoDB',
      sub1.created === true && sub1.duplicate === false && sub1.subscriber.email === 'parentone@example.com');

    const subDup = await awsSubDriver.addSubscriber('parentone@example.com');
    check('AwsDriver.addSubscriber detects duplicate via ConditionalCheckFailedException',
      subDup.created === false && subDup.duplicate === true);

    await awsSubDriver.addSubscriber('parenttwo@example.com');
    const listed = await awsSubDriver.listSubscribers();
    check('AwsDriver.listSubscribers paginates LastEvaluatedKey cleanly',
      listed.length === 2 && scanCalls === 2);

    // --- 6. DynamoDB Atomic Daily Chatbot Cap (Lambda Multi-Instance Safe) ---
    console.log('\n--- 6. DynamoDB Atomic Daily Chatbot Cap ---');
    let ddbChatCount = 0;
    process.env.CHATBOT_DAILY_REQUEST_CAP = '2';
    process.env.STORAGE_DRIVER = 'aws';
    process.env.DYNAMODB_TABLE_NAME = 'tutortime-submissions';
    setDailyCounterDocClientForTests({
      async send(cmd) {
        assert.strictEqual(cmd.constructor.name, 'UpdateCommand');
        assert.strictEqual(cmd.input.Key.formType, 'SYSTEM_COUNTER');
        assert.ok(cmd.input.Key['createdAt#id'].startsWith('CHATBOT_DAILY#'));
        const cap = cmd.input.ExpressionAttributeValues[':cap'];
        if (ddbChatCount >= cap) {
          const err = new Error('Cap reached');
          err.name = 'ConditionalCheckFailedException';
          throw err;
        }
        ddbChatCount++;
        return { Attributes: { requestCount: ddbChatCount } };
      }
    });
    setInjectedClient({
      messages: {
        create: async () => ({ content: [{ type: 'text', text: 'Hello from mock Claude!' }] })
      }
    });
    resetDailyCounterForTests();

    const makeMockRes = () => ({
      statusCode: 200,
      body: null,
      status(c) { this.statusCode = c; return this; },
      json(b) { this.body = b; return this; }
    });

    const r1 = makeMockRes();
    await handleChat({ body: { message: 'Question 1' } }, r1);
    const r2 = makeMockRes();
    await handleChat({ body: { message: 'Question 2' } }, r2);
    const r3 = makeMockRes();
    await handleChat({ body: { message: 'Question 3' } }, r3);

    check('Atomic DynamoDB counter permits requests within cap (1 & 2 -> HTTP 200)',
      r1.statusCode === 200 && r2.statusCode === 200 && ddbChatCount === 2);
    check('Atomic DynamoDB counter blocks 3rd request with HTTP 429',
      r3.statusCode === 429 && r3.body && r3.body.error.includes('daily limit'));

    setDailyCounterDocClientForTests(null);
    setInjectedClient(null);

    // --- 7. Live Server X-Origin-Verify Gate & Staging SITE_NOINDEX ---
    console.log('\n--- 7. Server X-Origin-Verify Gate, CSP S3 Header & Staging NoIndex ---');
    const TEST_PORT = 5029;
    const serverProc = spawn(process.execPath, [path.join(REPO_ROOT, 'server.js')], {
      env: {
        ...savedEnv,
        PORT: String(TEST_PORT),
        STORAGE_DRIVER: 'local',
        EMAIL_DRIVER: 'mock',
        TRUST_PROXY: '1',
        PORTAL_HOST: 'checkin-staging.tutortime.ai',
        SITE_NOINDEX: 'true',
        UPLOADS_BUCKET_NAME: 'tutortime-staging-uploads-test',
        AWS_REGION: 'us-east-2',
        ORIGIN_VERIFY_SECRET: 'super-secret-cf-header-2026'
      },
      stdio: 'ignore'
    });

    try {
      await waitForHealth(TEST_PORT);

      const healthRes = await httpRequest(TEST_PORT, '/health');
      check('GET /health bypasses X-Origin-Verify for AWS Lambda Web Adapter readiness probe',
        healthRes.status === 200);

      const blockedRes = await httpRequest(TEST_PORT, '/');
      check('GET / without X-Origin-Verify returns HTTP 403 Forbidden', blockedRes.status === 403);

      const wrongSecretRes = await httpRequest(TEST_PORT, '/', { 'X-Origin-Verify': 'wrong-secret' });
      check('GET / with wrong X-Origin-Verify returns HTTP 403 Forbidden', wrongSecretRes.status === 403);

      const allowedRes = await httpRequest(TEST_PORT, '/', { 'X-Origin-Verify': 'super-secret-cf-header-2026' });
      check('GET / with valid X-Origin-Verify returns HTTP 200', allowedRes.status === 200);
      check('Live CSP header includes configured S3 bucket URL',
        String(allowedRes.headers['content-security-policy'] || '').includes('https://tutortime-staging-uploads-test.s3.us-east-2.amazonaws.com'));

      const robotsRes = await httpRequest(TEST_PORT, '/robots.txt', { 'X-Origin-Verify': 'super-secret-cf-header-2026' });
      check('SITE_NOINDEX=true forces Disallow: / on /robots.txt',
        robotsRes.status === 200 && robotsRes.body.includes('Disallow: /'));

      const portalViaXfh = await httpRequest(TEST_PORT, '/', {
        'X-Origin-Verify': 'super-secret-cf-header-2026',
        'X-Forwarded-Host': 'checkin-staging.tutortime.ai'
      });
      check('CloudFront X-Forwarded-Host routes checkin-staging.tutortime.ai / -> 302 /login',
        portalViaXfh.status === 302 && portalViaXfh.headers.location === '/login');
    } finally {
      serverProc.kill('SIGINT');
    }

    // --- 8. CloudFormation Templates & Parameter Files Integrity ---
    console.log('\n--- 8. CloudFormation Stacks & Params Integrity ---');
    const cfnFiles = [
      'infra/01-data-stack.yaml',
      'infra/02-security-cicd-stack.yaml',
      'infra/03a-edge-cert-stack.yaml',
      'infra/03b-app-stack.yaml',
      'infra/04-ops-budget-stack.yaml',
      'infra/tutortime-stack.yaml'
    ];
    for (const rel of cfnFiles) {
      const text = fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');
      check(`${rel} exists with AWSTemplateFormatVersion and zero hardcoded account IDs`,
        text.includes("AWSTemplateFormatVersion: '2010-09-09'") && !/arn:aws:[^:]+:[^:]*:[0-9]{12}:/.test(text));
    }

    const appStackYaml = fs.readFileSync(path.join(REPO_ROOT, 'infra/03b-app-stack.yaml'), 'utf8');
    check('03b-app-stack.yaml configures Lambda container + Function URL + CloudFront + 302 Popcorn redirect',
      appStackYaml.includes('AWS::Lambda::Function') &&
      appStackYaml.includes('AWS::Lambda::Url') &&
      appStackYaml.includes('AWS::CloudFront::Distribution') &&
      appStackYaml.includes('AWS::CloudFront::Function') &&
      appStackYaml.includes('Default: 302') &&
      appStackYaml.includes('https://tutortime.ai/services/popcorn-math'));
    check('03b-app-stack.yaml grants BOTH Function URL permissions (InvokeFunctionUrl + InvokeFunction InvokedViaFunctionUrl)',
      appStackYaml.includes('Action: lambda:InvokeFunctionUrl') &&
      appStackYaml.includes('FunctionUrlAuthType: NONE') &&
      appStackYaml.includes('Action: lambda:InvokeFunction') &&
      appStackYaml.includes('InvokedViaFunctionUrl: true'));
    check('03b-app-stack.yaml passes ANTHROPIC_API_KEY_SECRET_ARN and removes CloudFormation dynamic ref for anthropic-api-key',
      appStackYaml.includes('ANTHROPIC_API_KEY_SECRET_ARN:') &&
      !appStackYaml.includes('anthropic-api-key:SecretString'));

    const securityStackYaml = fs.readFileSync(path.join(REPO_ROOT, 'infra/02-security-cicd-stack.yaml'), 'utf8');
    check('02-security-cicd-stack.yaml grants lambda.amazonaws.com least-privilege ECR pull policy and scopes GitHubDeployRole trust strictly to refs/heads/main',
      securityStackYaml.includes('LambdaECRImageRetrievalPolicy') &&
      securityStackYaml.includes('Service: lambda.amazonaws.com') &&
      securityStackYaml.includes('ecr:BatchGetImage') &&
      securityStackYaml.includes('ecr:GetDownloadUrlForLayer') &&
      securityStackYaml.includes("token.actions.githubusercontent.com:sub: !Sub 'repo:${GitHubRepository}:ref:refs/heads/main'") &&
      !securityStackYaml.includes('StringLike:') &&
      !securityStackYaml.includes('environment:production') &&
      !securityStackYaml.includes('environment:staging') &&
      securityStackYaml.includes('cloudfront:CreateInvalidation') &&
      securityStackYaml.includes('cloudfront:GetInvalidation') &&
      securityStackYaml.includes('dynamodb:UpdateTimeToLive') &&
      !securityStackYaml.includes('dynamodb:DeleteTable') &&
      !securityStackYaml.includes('s3:DeleteBucket'));

    const ciWorkflowYaml = fs.readFileSync(path.join(REPO_ROOT, '.github/workflows/ci-deploy.yml'), 'utf8');
    check('ci-deploy.yml deploys directly to production on push to main with zero staging jobs, zero GitHub environments, pinned trivy-action SHA, secret OPS_ALERT_EMAIL, data change-set guard, CF invalidation, and auto-rollback',
      !ciWorkflowYaml.includes('deploy-staging') &&
      !/^\s+environment:/m.test(ciWorkflowYaml) &&
      ciWorkflowYaml.includes('aquasecurity/trivy-action@ed142fd0673e97e23eac54620cfb913e5ce36c25') &&
      ciWorkflowYaml.includes('secrets.OPS_ALERT_EMAIL') &&
      !ciWorkflowYaml.includes('vars.OPS_ALERT_EMAIL') &&
      ciWorkflowYaml.includes('tutortime-production-deploy') &&
      ciWorkflowYaml.includes('create-change-set') &&
      ciWorkflowYaml.includes('create-invalidation') &&
      ciWorkflowYaml.includes('FIRST DEPLOY FAILED') &&
      ciWorkflowYaml.includes('PREV_TAG'));

    const prodParams = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'infra/params/production.json'), 'utf8'));
    check('Production params safely update existing tutortime-production-infra with LambdaReservedConcurrency=0 and DNS cutover flags false',
      prodParams.dataStack.stackName === 'tutortime-production-infra' &&
      prodParams.dataStack.parameters.CreatePortalTable === 'false' &&
      prodParams.dataStack.parameters.CreateSubscribersTable === 'false' &&
      prodParams.appStack.parameters.LambdaReservedConcurrency === '0' &&
      prodParams.appStack.parameters.PopcornRedirectStatusCode === '302' &&
      prodParams.appStack.parameters.ManageNewSubdomainDnsRecords === 'false' &&
      prodParams.appStack.parameters.ManageLiveDnsRecords === 'false');
    check('No OTel lab template exists (per owner approval)',
      !fs.existsSync(path.join(REPO_ROOT, 'infra/optional-ecs-otel-lab.yaml')));
  } finally {
    process.env = savedEnv;
  }

  console.log('\n================================================================');
  console.log(`DEPLOYMENT READINESS RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error('Fatal error in deployment_readiness test suite:', err);
  process.exit(1);
});
