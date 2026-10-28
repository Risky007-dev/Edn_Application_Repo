/**
 * Stage 1 Automated Test Suite
 * Self-contained: runs on an isolated test port with dedicated temporary DATA_DIR
 * and temporary subscribers DB file, ensuring zero mutation of production files.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const TEST_PORT = 5002;
const TEST_DIR = path.join(__dirname, 'temp_test_env');
const TEST_DATA_DIR = path.join(TEST_DIR, 'data');
const TEST_SUBSCRIBERS_FILE = path.join(TEST_DIR, 'subscribers_test.json');
const TEST_ADMIN_KEY = 'test-secret-admin-key-2026';

// Prepare clean temporary test directory
if (fs.existsSync(TEST_DIR)) {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(TEST_DATA_DIR, { recursive: true });

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
          json
        });
      });
    });

    req.on('error', reject);

    if (postData) {
      if (typeof postData === 'object') {
        req.setHeader('Content-Type', 'application/json');
        req.write(JSON.stringify(postData));
      } else {
        req.write(postData);
      }
    }
    req.end();
  });
}

function waitForServer(port, maxRetries = 40) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    let lastErr = '';
    const check = () => {
      const req = http.get(`http://127.0.0.1:${port}/`, (res) => {
        resolve();
      });
      req.on('error', (err) => {
        lastErr = err.message;
        retries++;
        if (retries >= maxRetries) {
          reject(new Error(`Server failed to start on port ${port} after ${maxRetries} retries: ${lastErr}`));
        } else {
          setTimeout(check, 250);
        }
      });
    };
    check();
  });
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('       STAGE 1 AUTOMATED VERIFICATION SUITE (ISOLATED)          ');
  console.log('================================================================\n');
  console.log(`Test Port: ${TEST_PORT}`);
  console.log(`Isolated DATA_DIR: ${TEST_DATA_DIR}`);
  console.log(`Isolated Subscribers File: ${TEST_SUBSCRIBERS_FILE}\n`);

  // Spawn isolated server process
  const serverProc = spawn(process.execPath, [path.join(__dirname, '../server.js')], {
    env: {
      ...process.env,
      PORT: String(TEST_PORT),
      DATA_DIR: TEST_DATA_DIR,
      SUBSCRIBERS_DB_FILE: TEST_SUBSCRIBERS_FILE,
      ADMIN_API_KEY: TEST_ADMIN_KEY,
      STORAGE_DRIVER: 'local',
      FORM_RATE_LIMIT_MAX: '50'
    },
    stdio: 'pipe'
  });

  let serverStderr = '';
  let serverStdout = '';
  serverProc.stderr.on('data', (d) => { serverStderr += d.toString(); });
  serverProc.stdout.on('data', (d) => { serverStdout += d.toString(); });

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  try {
    await waitForServer(TEST_PORT);

    // 1. Core Pages & Security Middleware
    console.log('--- 1. Core Pages & Security Middleware ---');
    const resHome = await request({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: '/',
      method: 'GET',
      headers: { 'x-amzn-trace-id': 'Root=1-671e-00000001' }
    });
    assert(resHome.statusCode === 200, 'GET / returns HTTP 200');
    assert(resHome.headers['x-content-type-options'] === 'nosniff', 'Helmet nosniff header present');
    assert(!!resHome.headers['content-security-policy'], 'Helmet CSP header present');
    assert(resHome.body.includes('Tutor Time with Teacher Cassie'), 'Homepage contains brand title');
    assert(resHome.body.includes('Popcorn Math'), 'Homepage contains Popcorn Math brand name');
    assert(!resHome.body.includes('2026-12-01'), 'Invented countdown date removed');

    const resIndexHtml = await request({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: '/index.html',
      method: 'GET'
    });
    assert(resIndexHtml.statusCode === 200, 'GET /index.html returns HTTP 200');

    // 2. Allowlisted Services Routing
    console.log('\n--- 2. Allowlisted /services/:slug Routing ---');
    const slugs = [
      { slug: 'traditional-tutoring', name: 'Personalised Tutoring & Academic Support' },
      { slug: 'concierge', name: 'Concierge Academic Coaching' },
      { slug: 'popcorn-maths', name: 'Popcorn Math' },
      { slug: 'specialist-support', name: 'Individualised Learning Support' }
    ];

    for (const item of slugs) {
      const resSlug = await request({
        hostname: 'localhost',
        port: TEST_PORT,
        path: `/services/${item.slug}`,
        method: 'GET'
      });
      assert(resSlug.statusCode === 200, `GET /services/${item.slug} returns HTTP 200`);
      assert(resSlug.body.includes(item.name), `GET /services/${item.slug} displays canonical name "${item.name}"`);
    }

    const resInvalidSlug = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/services/unauthorized-slug-exploit',
      method: 'GET'
    });
    assert(resInvalidSlug.statusCode === 404, 'GET /services/invalid-slug returns HTTP 404');

    // 3. Static Files Restriction & Path Traversal Security
    console.log('\n--- 3. Static File Lockdown & Traversal Security (Required 404s) ---');
    const resFlask = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/flasktest.py',
      method: 'GET'
    });
    assert(resFlask.statusCode === 404, 'GET /flasktest.py returns HTTP 404');

    const resWebXml = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/WEB-INF/web.xml',
      method: 'GET'
    });
    assert(resWebXml.statusCode === 404, 'GET /WEB-INF/web.xml returns HTTP 404');

    const resPom = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/pom.xml',
      method: 'GET'
    });
    assert(resPom.statusCode === 404, 'GET /pom.xml returns HTTP 404');

    const resEncodedTraversal = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/services/..%2fpackage.json',
      method: 'GET'
    });
    assert(resEncodedTraversal.statusCode === 404, 'GET /services/..%2fpackage.json (encoded traversal) returns HTTP 404');

    const resDotDotTraversal = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/services/%2e%2e%2findex.html',
      method: 'GET'
    });
    assert(resDotDotTraversal.statusCode === 404, 'GET /services/%2e%2e%2findex.html (encoded %2e%2e) returns HTTP 404');

    // 4. Brand Info Endpoint
    console.log('\n--- 4. Brand Info Endpoint (/api/brand-info) ---');
    const resBrand = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/brand-info',
      method: 'GET'
    });
    assert(resBrand.statusCode === 200, 'GET /api/brand-info returns HTTP 200');
    assert(resBrand.json && resBrand.json.platformLogo === '/assets/logos/TT_logo.jpg', 'Platform logo configured correctly');
    assert(resBrand.json && resBrand.json.services['popcorn-maths'].name === 'Popcorn Math', 'Canonical Popcorn Math name confirmed');
    assert(resBrand.json && resBrand.json.whatsapp !== undefined, 'WhatsApp contact metadata present');

    // 5. Presigned POST Protocol for Uploads
    console.log('\n--- 5. Presigned POST Protocol (@aws-sdk/s3-presigned-post) ---');
    const resPresignValid = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/uploads/presign',
      method: 'POST'
    }, { filename: 'candidate_cv.pdf' });

    assert(resPresignValid.statusCode === 200, 'POST /api/uploads/presign (PDF) returns HTTP 200');
    assert(resPresignValid.json && resPresignValid.json.maxSizeBytes === 5242880, 'Presigned POST enforces 5 MB max size');
    assert(resPresignValid.json && !!resPresignValid.json.fields, 'Presigned POST fields returned');
    assert(resPresignValid.json && !!resPresignValid.json.url, 'Presigned POST destination URL returned');

    const resPresignInvalid = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/uploads/presign',
      method: 'POST'
    }, { filename: 'malicious.exe' });
    assert(resPresignInvalid.statusCode === 400, 'POST /api/uploads/presign (non-PDF) rejected with HTTP 400');

    const resMockUpload = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/uploads/mock-post',
      method: 'POST'
    }, 'simulated-multipart-payload');
    assert(resMockUpload.statusCode === 204, 'POST /api/uploads/mock-post (local driver) returns HTTP 204 No Content');

    // 6. Form Submissions Pipeline & Isolated Storage
    console.log('\n--- 6. Form Pipeline & Isolated Storage ---');
    const testPresenterPayload = {
      fullName: 'Jane Doe',
      email: 'jane.presenter@example.com',
      phone: '+1-264-555-0144',
      location: 'The Valley, Anguilla',
      ageConfirmation: true,
      educationalBackground: 'B.Sc. Mathematics & Education',
      experienceWithChildren: '3 years youth club tutor',
      mathConfidence: 5,
      availability: 'Weekdays & Saturdays',
      preferredRole: 'Lead Presenter',
      whyPopcornMath: 'Passionate about making math fun and accessible for young learners.',
      cvFileKey: resPresignValid.json ? resPresignValid.json.key : 'cv-uploads/local/test_cv.pdf',
      _gotcha: '',
      consent: true
    };

    const resPresenter = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/forms/presenter-application',
      method: 'POST'
    }, testPresenterPayload);

    assert(resPresenter.statusCode === 201, 'POST /api/forms/presenter-application returns HTTP 201 Created');
    assert(resPresenter.json && !!resPresenter.json.id, 'Submission received unique record ID');

    // Verify written to isolated TEST_DATA_DIR
    const testSubmissionsFile = path.join(TEST_DATA_DIR, 'tutortime-submissions.json');
    assert(fs.existsSync(testSubmissionsFile), 'Isolated tutortime-submissions.json created');
    const savedData = JSON.parse(fs.readFileSync(testSubmissionsFile, 'utf8'));
    const savedRecord = savedData.submissions.find(s => s.id === resPresenter.json.id);
    assert(!!savedRecord, 'Submission record persisted in isolated test directory');

    // Bot honeypot test
    console.log('\n--- 7. Security Honeypot Mitigation ---');
    const botPayload = {
      ...testPresenterPayload,
      fullName: 'Spam Bot 3000',
      email: 'bot@spam.ru',
      _gotcha: 'http://spam-link.ru'
    };
    const submissionsCountBefore = savedData.submissions.length;

    const resBot = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/forms/presenter-application',
      method: 'POST'
    }, botPayload);

    assert(resBot.statusCode === 200, 'Honeypot-triggered submission silently returns HTTP 200');
    const savedDataAfter = JSON.parse(fs.readFileSync(testSubmissionsFile, 'utf8'));
    assert(savedDataAfter.submissions.length === submissionsCountBefore, 'Bot submission was silently dropped (NOT stored)');

    // 8. Other Form Handlers
    console.log('\n--- 8. Consultation Booking & Learning Needs ---');
    const resBooking = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/forms/book-consultation',
      method: 'POST'
    }, {
      parentName: 'Marcus Smith',
      email: 'marcus.smith@example.com',
      phone: '+1-264-555-0182',
      studentYearGroup: 'Upper Primary (Ages 8-10)',
      serviceInterest: 'traditional-tutoring',
      message: 'Looking for math curriculum support ahead of term exams.',
      _gotcha: '',
      consent: true
    });
    assert(resBooking.statusCode === 201, 'POST /api/forms/book-consultation returns HTTP 201');

    const resLearning = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/forms/learning-needs',
      method: 'POST'
    }, {
      parentName: 'Sarah Jenkins',
      email: 'sarah.j@example.com',
      phone: '+1-264-555-0199',
      studentYearGroup: 'Early Primary (Ages 5-7)',
      learningStrengths: 'Creative, visual learner, excellent memory',
      areasRequiringSupport: ['Executive Functioning', 'Focus Routines'],
      academicGoals: 'Develop independent study habits and structured task completion.',
      preferredLearningEnvironment: 'Calm, quiet 1-on-1 setting',
      _gotcha: '',
      consent: true
    });
    assert(resLearning.statusCode === 201, 'POST /api/forms/learning-needs returns HTTP 201');

    // 9. Metrics Endpoint Security (X-Admin-Key Authentication)
    console.log('\n--- 9. Metrics Endpoint Security (/api/metrics) ---');
    const resMetricsNoKey = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/metrics',
      method: 'GET'
    });
    assert(resMetricsNoKey.statusCode === 404, 'GET /api/metrics WITHOUT key returns HTTP 404');

    const resMetricsWrongKey = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/metrics',
      method: 'GET',
      headers: { 'x-admin-key': 'incorrect-key' }
    });
    assert(resMetricsWrongKey.statusCode === 404, 'GET /api/metrics with WRONG key returns HTTP 404');

    const resMetricsValidKey = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/metrics',
      method: 'GET',
      headers: { 'x-admin-key': TEST_ADMIN_KEY }
    });
    assert(resMetricsValidKey.statusCode === 200, 'GET /api/metrics with VALID X-Admin-Key returns HTTP 200');
    assert(resMetricsValidKey.json && resMetricsValidKey.json.driver === 'local', 'Metrics reports local driver');
    assert(resMetricsValidKey.json && resMetricsValidKey.json.submissions['presenter-application'] >= 1, 'Metrics tracks form submissions');

    // 10. Preserved Endpoints (/subscribe and /subscribers)
    console.log('\n--- 10. Preserved Endpoints (/subscribe and /subscribers) ---');
    const testSubscribeEmail = `isolated_user_${Date.now()}@example.com`;
    const resSubscribe = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/subscribe',
      method: 'POST'
    }, { email: testSubscribeEmail });

    assert(resSubscribe.statusCode === 201 || resSubscribe.statusCode === 409, 'POST /subscribe behaves as expected (HTTP 201/409)');
    assert(resSubscribe.json && resSubscribe.json.success === true, 'POST /subscribe success response verified');

    // Verify subscriber was written to isolated TEST_SUBSCRIBERS_FILE
    assert(fs.existsSync(TEST_SUBSCRIBERS_FILE), 'Isolated subscribers file created');
    const savedSubscribers = JSON.parse(fs.readFileSync(TEST_SUBSCRIBERS_FILE, 'utf8'));
    assert(savedSubscribers.subscribers.some(s => s.email === testSubscribeEmail), 'Subscriber written to isolated test file (real file untouched)');

    const resSubscribers = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/subscribers',
      method: 'GET'
    });
    assert(resSubscribers.statusCode === 200, 'GET /subscribers returns HTTP 200');
    assert(resSubscribers.json && typeof resSubscribers.json.total === 'number', 'GET /subscribers reports total count');

    console.log('\n================================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

  } catch (err) {
    console.error('Fatal test error:', err);
    if (serverStderr) console.error('Server STDERR:', serverStderr);
    if (serverStdout) console.error('Server STDOUT:', serverStdout);
    failed++;
  } finally {
    // Terminate test server process
    serverProc.kill('SIGINT');

    // Clean up temporary test files
    try {
      if (fs.existsSync(TEST_DIR)) {
        fs.rmSync(TEST_DIR, { recursive: true, force: true });
      }
    } catch (_) {}

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

runTestSuite();
