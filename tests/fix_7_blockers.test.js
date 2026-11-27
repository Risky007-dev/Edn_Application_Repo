/**
 * Automated Verification Suite for the 7 Packaging, Security, Persistence & AWS Blueprint Fixes
 * Runs 100% locally with temp directories and mocked AWS SDK clients (zero live cloud calls).
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const express = require('express');

const ROOT = path.join(__dirname, '..');

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

function httpGet(server, reqPath, headers = {}) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const req = http.request({
      hostname: '127.0.0.1',
      port: addr.port,
      path: reqPath,
      method: 'GET',
      headers
    }, (res) => {
      let body = '';
      res.on('data', c => { body += c; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('================================================================');
  console.log('   FIX VERIFICATION SUITE (7 PACKAGING, SECURITY & AWS FIXES)   ');
  console.log('================================================================\n');

  const savedEnv = { ...process.env };
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tt-fix7-'));

  try {
    // --- 1. Container Packaging & No Default Admin Password ---
    console.log('--- 1. Dockerfile, .dockerignore & .env.example ---');
    const dockerfile = fs.readFileSync(path.join(ROOT, 'Dockerfile'), 'utf8');
    const dockerignore = fs.readFileSync(path.join(ROOT, '.dockerignore'), 'utf8');
    const envExample = fs.readFileSync(path.join(ROOT, '.env.example'), 'utf8');

    check('Dockerfile copies docs/legal for runtime /privacy rendering', /COPY\s+docs\/legal\s+\.\/docs\/legal/.test(dockerfile));
    check('Dockerfile copies seed-kashamar.js script', dockerfile.includes('COPY scripts/seed-kashamar.js ./scripts/'));
    check('Dockerfile does NOT copy .env or .env.example into container image',
      !/^\s*COPY\b[^\r\n]*\.env/im.test(dockerfile) && !dockerfile.includes('.env.example'));
    check('Dockerfile uses npm ci --omit=dev and non-root USER node',
      dockerfile.includes('npm ci --omit=dev') && /\bUSER\s+node\b/.test(dockerfile));
    check('.dockerignore excludes .env*, infra, and *.md while re-including !docs/legal/*.md',
      dockerignore.includes('.env.*') &&
      !dockerignore.includes('!.env.example') &&
      dockerignore.includes('infra') &&
      dockerignore.includes('!docs/legal/*.md'));
    check('.env.example leaves ADMIN_API_KEY blank (no hardcoded default password)',
      /^ADMIN_API_KEY=\s*$/m.test(envExample) && !envExample.includes('local-dev-admin-key-2026'));

    // --- 2. Lockfile Tracking for Deterministic CI Builds ---
    console.log('\n--- 2. Lockfile (.gitignore & package-lock.json) ---');
    const gitignore = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8');
    const pkgJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    const lockJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'package-lock.json'), 'utf8'));

    check('.gitignore does not exclude package-lock.json',
      !gitignore.split(/\r?\n/).some(line => line.trim() === 'package-lock.json'));
    check('package-lock.json is valid lockfileVersion >= 2 covering package.json dependencies',
      lockJson.lockfileVersion >= 2 &&
      lockJson.packages &&
      lockJson.packages[''] &&
      Object.keys(pkgJson.dependencies).every(dep => Boolean(lockJson.packages[''].dependencies[dep])));

    // --- 3. Browser CSP Allowance for Direct S3 Presigned Uploads ---
    console.log('\n--- 3. Helmet CSP connect-src for S3 CV Uploads ---');
    const { helmetMiddleware, buildConnectSrc } = require('../src/shared/middleware/security');

    delete process.env.UPLOADS_BUCKET_NAME;
    check('connect-src defaults strictly to ["\'self\'"] when UPLOADS_BUCKET_NAME is unset',
      JSON.stringify(buildConnectSrc({ UPLOADS_BUCKET_NAME: '' })) === JSON.stringify(["'self'"]));

    process.env.UPLOADS_BUCKET_NAME = 'tutortime-test-uploads-bucket';
    process.env.AWS_REGION = 'us-east-2';
    const sourcesWithBucket = buildConnectSrc(process.env);
    check('connect-src includes configured regional and global S3 bucket origins',
      sourcesWithBucket.includes('https://tutortime-test-uploads-bucket.s3.us-east-2.amazonaws.com') &&
      sourcesWithBucket.includes('https://tutortime-test-uploads-bucket.s3.amazonaws.com'));

    const cspApp = express();
    cspApp.use(helmetMiddleware);
    cspApp.get('/csp-check', (req, res) => res.send('ok'));
    const cspServer = await new Promise(r => { const s = cspApp.listen(0, '127.0.0.1', () => r(s)); });
    try {
      const cspRes = await httpGet(cspServer, '/csp-check');
      const cspHeader = cspRes.headers['content-security-policy'] || '';
      check('HTTP response Content-Security-Policy header includes S3 upload bucket origin',
        cspHeader.includes('https://tutortime-test-uploads-bucket.s3.us-east-2.amazonaws.com'));
    } finally {
      cspServer.close();
    }

    // --- 4. Durable Subscriber Persistence & Submission Retention TTL ---
    console.log('\n--- 4. Newsletter Subscriber Storage & Retention TTL ---');
    process.env.STORAGE_DRIVER = 'local';
    process.env.DATA_DIR = path.join(tmpDir, 'data');
    process.env.SUBSCRIBERS_DB_FILE = path.join(tmpDir, 'subscribers.json');

    const localDriver = require('../src/shared/storage/localDriver');
    const { AwsDriver, computeExpireAt } = require('../src/shared/storage/awsDriver');

    const firstSub = await localDriver.addSubscriber('Parent@example.invalid');
    const dupSub = await localDriver.addSubscriber('parent@example.invalid');
    const allLocalSubs = await localDriver.listSubscribers();
    check('LocalDriver addSubscriber normalizes email, persists record, and flags duplicates',
      firstSub.created === true && firstSub.duplicate === false &&
      dupSub.created === false && dupSub.duplicate === true &&
      allLocalSubs.length === 1 && allLocalSubs[0].email === 'parent@example.invalid');

    const dynamoSent = [];
    const mockSubDb = {
      send: async (cmd) => {
        dynamoSent.push(cmd);
        const cname = cmd.constructor.name;
        if (cname === 'PutCommand') {
          if (cmd.input.ConditionExpression && cmd.input.Item.email === 'existing@example.invalid') {
            const err = new Error('Conditional check failed');
            err.name = 'ConditionalCheckFailedException';
            throw err;
          }
          return {};
        }
        if (cname === 'ScanCommand') {
          if (!cmd.input.ExclusiveStartKey) {
            return {
              Items: [{ email: 'a@example.invalid', subscribedAt: '2026-11-26T01:00:00Z', confirmed: false }],
              LastEvaluatedKey: { email: 'a@example.invalid' }
            };
          }
          return {
            Items: [{ email: 'b@example.invalid', subscribedAt: '2026-11-26T02:00:00Z', confirmed: false }]
          };
        }
        return {};
      }
    };

    const awsSubDriver = new AwsDriver({
      tableName: 'tutortime-submissions-test',
      subscribersTableName: 'tutortime-subscribers-test',
      docClient: mockSubDb
    });

    const awsNewSub = await awsSubDriver.addSubscriber('newparent@example.invalid');
    const awsDupSub = await awsSubDriver.addSubscriber('existing@example.invalid');
    const awsListedSubs = await awsSubDriver.listSubscribers();
    check('AwsDriver addSubscriber uses ConditionExpression attribute_not_exists(email) & handles duplicates',
      awsNewSub.created === true && awsNewSub.duplicate === false &&
      awsDupSub.created === false && awsDupSub.duplicate === true &&
      dynamoSent[0].input.TableName === 'tutortime-subscribers-test' &&
      dynamoSent[0].input.ConditionExpression === 'attribute_not_exists(email)');
    check('AwsDriver listSubscribers paginates ScanCommand results cleanly',
      awsListedSubs.length === 2 && awsListedSubs[0].email === 'a@example.invalid' && awsListedSubs[1].email === 'b@example.invalid');

    const nowIso = '2026-11-26T00:00:00.000Z';
    const baseEpoch = Math.floor(Date.parse(nowIso) / 1000);
    check('Retention helper enforces 180d presenter / 365d parent / 730d school TTL',
      computeExpireAt('PRESENTER_APPLICATION', nowIso) === baseEpoch + 180 * 86400 &&
      computeExpireAt('BOOK_CONSULTATION', nowIso) === baseEpoch + 365 * 86400 &&
      computeExpireAt('SCHOOL_ENQUIRY', nowIso) === baseEpoch + 730 * 86400);

    // --- 5. AWS Blueprint & Practice/Staging Support ---
    console.log('\n--- 5. AWS Blueprint (infra/) & Staging Support ---');
    const stackYaml = fs.readFileSync(path.join(ROOT, 'infra/tutortime-stack.yaml'), 'utf8');
    const runbookMd = fs.readFileSync(path.join(ROOT, 'infra/OWNER_RUNBOOK.md'), 'utf8');

    check('tutortime-stack.yaml parameterizes and exports PortalTableName & SubscribersTableName',
      stackYaml.includes('PortalTableName:') &&
      stackYaml.includes('SubscribersTableName:') &&
      stackYaml.includes('HasPortalTableName:') &&
      stackYaml.includes('tutortime-portal-${EnvironmentName}') &&
      stackYaml.includes("Name: !Sub '${AWS::StackName}-PortalTableName'") &&
      stackYaml.includes("Name: !Sub '${AWS::StackName}-SubscribersTableName'"));
    check('tutortime-stack.yaml grants ses:GetAccount, ses:GetEmailIdentity & multi-identity SES support',
      stackYaml.includes('ses:GetAccount') &&
      stackYaml.includes('ses:GetEmailIdentity') &&
      stackYaml.includes('AdditionalSesIdentityArns:') &&
      stackYaml.includes('AdditionalCorsOrigin:'));
    check('tutortime-stack.yaml enables DynamoDB TTL expireAt on SubmissionsTable and aligns CVRetentionDays=180',
      stackYaml.includes('AttributeName: expireAt') &&
      stackYaml.includes('Default: 180') &&
      !runbookMd.includes('set to `90` days'));

    const { isCheckinHost } = require('../src/portal/router');
    process.env.TRUST_PROXY = '1';
    process.env.PORTAL_HOST = 'checkin-staging.tutortime.ai,checkin.tutortime.ai';
    check('isCheckinHost supports staging & comma-separated portal domains via PORTAL_HOST',
      isCheckinHost({ headers: { host: 'checkin-staging.tutortime.ai' } }) &&
      isCheckinHost({ headers: { host: 'checkin.tutortime.ai' } }) &&
      !isCheckinHost({ headers: { host: 'staging.tutortime.ai' } }));

    // --- 6. Parent Private Link Redaction & Referrer Policy ---
    console.log('\n--- 6. Parent Private Link Log Redaction & Referrer-Policy ---');
    const requestLogger = require('../src/shared/middleware/logger');
    check('sanitizeLogPath redacts /p/<token> and strips query strings',
      requestLogger.sanitizeLogPath('/p/SecretToken_Abc123456?month=2026-11') === '/p/[redacted]' &&
      requestLogger.sanitizeLogPath('/book?rcScore=9') === '/book');

    const { createPortalRouters } = require('../src/portal/router');
    const { LocalPortalStore } = require('../src/portal/portalStore');
    const { hashToken } = require('../src/portal/auth');
    process.env.PORTAL_DATA_FILE = path.join(tmpDir, 'portal.json');
    const pStore = new LocalPortalStore();
    const secretToken = 'parent_secret_token_9876543210abcdef';
    await pStore.saveStudent({
      studentId: 'stu_logtest',
      name: 'Log Safe Student',
      parentName: 'Test Guardian',
      parentEmail: 'guardian@example.invalid',
      pricePerSession: 50,
      archived: false,
      parentToken: secretToken,
      parentTokenHash: hashToken(secretToken)
    });

    const capturedLogs = [];
    const origConsoleLog = console.log;
    const logApp = express();
    logApp.use(requestLogger);
    const { parentRouter } = createPortalRouters({ store: pStore });
    logApp.use('/p', parentRouter);
    const logServer = await new Promise(r => { const s = logApp.listen(0, '127.0.0.1', () => r(s)); });
    try {
      console.log = (msg) => { capturedLogs.push(String(msg)); };
      const parentRes = await httpGet(logServer, `/p/${secretToken}?month=2026-11`);
      console.log = origConsoleLog;

      const joinedLogs = capturedLogs.join('\n');
      check('GET /p/:token sets Referrer-Policy: no-referrer and X-Robots-Tag: noindex',
        parentRes.status === 200 &&
        parentRes.headers['referrer-policy'] === 'no-referrer' &&
        String(parentRes.headers['x-robots-tag']).includes('noindex'));
      check('Request logger records /p/[redacted] with zero token or query string leakage',
        joinedLogs.includes('"/p/[redacted]"') &&
        !joinedLogs.includes(secretToken) &&
        !joinedLogs.includes('month=2026-11'));
    } finally {
      console.log = origConsoleLog;
      logServer.close();
    }

    // --- 7. Legacy Config Account ID & Old Email Password Scrubbing ---
    console.log('\n--- 7. Legacy Config & Account ID / SENDER_PASSWORD Scrubbing ---');
    const filesToScan = [
      'Dockerfile',
      'ecs-task-definition.json',
      'ecs-task-definition-with-otel.json',
      'deploy-to-ecs.ps1',
      'deploy-to-ecs.sh',
      'AWS_ECS_DEPLOYMENT.md',
      'infra/tutortime-stack.yaml',
      'infra/01-data-stack.yaml',
      'infra/02-security-cicd-stack.yaml',
      'infra/03a-edge-cert-stack.yaml',
      'infra/03b-app-stack.yaml',
      'infra/04-ops-budget-stack.yaml',
      'infra/params/production.json',
      'infra/params/staging.json'
    ];

    let hasLeakedAccount = false;
    let hasOldPassword = false;
    for (const rel of filesToScan) {
      const txt = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      if (/arn:aws:[^:]+:[^:]*:[0-9]{12}:|[0-9]{12}\.dkr\.ecr\./.test(txt)) hasLeakedAccount = rel;
      if (/create-secret[^\n]*sender-password/i.test(txt) || txt.includes('your-app-password') || /"name":\s*"SENDER_PASSWORD"/.test(txt)) {
        hasOldPassword = rel;
      }
      if (rel.endsWith('.json')) {
        JSON.parse(txt);
      }
    }
    check('Zero hardcoded 12-digit AWS account IDs across all deployment/infra files', !hasLeakedAccount, hasLeakedAccount || '');
    check('Zero legacy SENDER_PASSWORD / Gmail app-password settings across deployment files', !hasOldPassword, hasOldPassword || '');
  } finally {
    process.env = savedEnv;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  console.log('\n================================================================');
  console.log(`FIX VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
