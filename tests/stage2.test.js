/**
 * Stage 2 Comprehensive Automated Test Suite
 * Fully self-contained: Runs on an isolated test port with dedicated temporary DATA_DIR
 * and temporary subscribers DB file, ensuring zero mutation of production files.
 *
 * Verifies:
 * - All Phase 1 pages return 200 and contain their canonical names.
 * - Legacy paths (/flasktest.py, /WEB-INF/web.xml, PDFs, traversal) return 404.
 * - Every image path returns 200 with real HTTP requests.
 * - All 5 forms validate successfully (201 created & stored).
 * - Validation errors (missing consent, bad email, missing 18+ check, oversized fields, unknown fields, non-PDF presign) return 400.
 * - Honeypot returns 200 silently without storing anything.
 * - 6th form submission within rate limit window returns 429.
 * - CV flow works end-to-end with the local driver.
 * - Server log output is captured and verified to contain zero submitted PII (email, phone).
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const TEST_PORT = 5003;
const TEST_DIR = path.join(__dirname, 'temp_test_stage2_env');
const TEST_DATA_DIR = path.join(TEST_DIR, 'data');
const TEST_SUBSCRIBERS_FILE = path.join(TEST_DIR, 'subscribers_test.json');
const TEST_ADMIN_KEY = 'test-secret-stage2-key';

// Clean temporary test directory
if (fs.existsSync(TEST_DIR)) {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(TEST_DATA_DIR, { recursive: true });

function request(options, postData = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: options.path || '/',
      method: options.method || 'GET',
      headers: { ...options.headers, ...headers }
    };

    const req = http.request(reqOptions, (res) => {
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

function waitForServer(port, maxRetries = 25) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const check = () => {
      const req = http.get(`http://127.0.0.1:${port}/`, () => {
        resolve();
      });
      req.on('error', () => {
        retries++;
        if (retries >= maxRetries) {
          reject(new Error(`Server failed to start on port ${port} after ${maxRetries} retries`));
        } else {
          setTimeout(check, 200);
        }
      });
    };
    check();
  });
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('       STAGE 2 AUTOMATED VERIFICATION SUITE (ISOLATED)          ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(desc, condition) {
    if (condition) {
      console.log(`  ✓ ${desc}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${desc}`);
      failed++;
    }
  }

  // Capture server output to test zero PII logging
  let serverLogs = '';

  const serverEnv = {
    ...process.env,
    PORT: String(TEST_PORT),
    DATA_DIR: TEST_DATA_DIR,
    SUBSCRIBERS_DB_FILE: TEST_SUBSCRIBERS_FILE,
    ADMIN_API_KEY: TEST_ADMIN_KEY,
    FORM_RATE_LIMIT_MAX: '5',
    TRUST_PROXY: 'true',
    SEND_CONFIRMATIONS: 'false',
    WHATSAPP_PHONE_NUMBER: '+1 (264) 555-0199',
    NODE_ENV: 'test'
  };

  const serverProcess = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: serverEnv,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  serverProcess.stdout.on('data', data => { serverLogs += data.toString(); });
  serverProcess.stderr.on('data', data => { serverLogs += data.toString(); });

  try {
    await waitForServer(TEST_PORT);
    console.log(`Server started successfully on port ${TEST_PORT}.\n`);

    // -------------------------------------------------------------
    // PART 1: Page Routes & Canonical Names (HTTP 200)
    // -------------------------------------------------------------
    console.log('--- TEST GROUP 1: Page Routes & Canonical Names ---');
    const pages = [
      { path: '/', canonical: 'Tutor Time with Teacher Cassie' },
      { path: '/services/traditional-tutoring', canonical: 'Personalised Tutoring' },
      { path: '/services/concierge', canonical: 'Concierge Academic Coaching' },
      { path: '/services/popcorn-maths', canonical: 'Popcorn Math' },
      { path: '/services/specialist-support', canonical: 'Individualised Learning Support' },
      { path: '/popcorn-maths/presenter', canonical: 'Become a Popcorn Math Presenter' },
      { path: '/book', canonical: 'Book a Consultation' },
      { path: '/contact', canonical: 'Contact Us' },
      { path: '/faq', canonical: 'Frequently Asked Questions' },
      { path: '/about', canonical: 'About Tutor Time' }
    ];

    for (const page of pages) {
      const res = await request({ path: page.path });
      assert(`${page.path} returns HTTP 200`, res.statusCode === 200);
      assert(`${page.path} contains canonical name "${page.canonical}"`, res.body.includes(page.canonical));
    }

    // -------------------------------------------------------------
    // PART 2: Blocked / Legacy / Path Traversal Routes (HTTP 404)
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 2: Security & Blocked Legacy Routes ---');
    const blockedPaths = [
      '/assets/logos/Popcorn1.pdf',
      '/assets/logos/TT_1.pdf',
      '/assets/logos/TT_3.pdf',
      '/assets/logos/popcornmaths2.pdf',
      '/flasktest.py',
      '/WEB-INF/web.xml',
      '/pom.xml',
      '/services/..%2findex.html',
      '/services/%2e%2e/index.html',
      '/unknown-route-123'
    ];

    for (const bPath of blockedPaths) {
      const res = await request({ path: bPath });
      assert(`${bPath} returns HTTP 404`, res.statusCode === 404);
    }

    // -------------------------------------------------------------
    // PART 3: Image Paths Real Requests & Status Codes (HTTP 200)
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 3: Image Paths Real Verification ---');
    const imagePaths = [
      '/assets/logos/popcorn-math-logo.png',
      '/assets/logos/tutor-time-logo.png',
      '/assets/icons/favicon-32x32.png',
      '/assets/icons/apple-touch-icon-180x180.png',
      '/assets/icons/icon-512x512.png',
      '/favicon.png',
      '/favicon.ico'
    ];

    for (const img of imagePaths) {
      const res = await request({ path: img });
      assert(`${img} returns HTTP 200`, res.statusCode === 200);
      assert(`${img} returns image content-type`, res.headers['content-type'] && res.headers['content-type'].includes('image'));
    }

    // -------------------------------------------------------------
    // PART 4: Form Validation & Persistence Across All 5 Forms
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 4: Form Pipeline & Validation ---');

    // 4.1 Valid book-consultation
    const resBook = await request({ path: '/api/forms/book-consultation', method: 'POST' }, {
      parentName: 'Jane Doe',
      email: 'jane.doe@example.com',
      phone: '+1 (264) 555-0144',
      studentYearGroup: 'Upper Primary',
      serviceInterest: 'One-on-One Tutoring',
      additionalNotes: 'Interested in math and science support',
      consent: true
    }, { 'X-Forwarded-For': '10.0.0.1' });
    assert('POST /api/forms/book-consultation returns 201', resBook.statusCode === 201);
    assert('book-consultation returns record ID', resBook.json && !!resBook.json.id);

    // 4.2 Valid concierge-application
    const resConcierge = await request({ path: '/api/forms/concierge-application', method: 'POST' }, {
      parentName: 'Robert Smith',
      email: 'robert.smith@example.com',
      phone: '+1 (264) 555-0188',
      studentYearGroup: 'Secondary',
      academicGoals: 'Executive academic organization and examination prep for GCSEs',
      preferredSchedule: 'Weekday evenings',
      consent: true
    }, { 'X-Forwarded-For': '10.0.0.2' });
    assert('POST /api/forms/concierge-application returns 201', resConcierge.statusCode === 201);

    // 4.3 Valid presenter-application
    const resPresenter = await request({ path: '/api/forms/presenter-application', method: 'POST' }, {
      fullName: 'Alex Johnson',
      email: 'alex.j@example.com',
      phone: '+1 (264) 555-0122',
      location: 'Anguilla',
      ageConfirmation: true,
      educationalBackground: 'BSc in Mathematics and Education',
      experienceWithChildren: '3 years primary youth workshop facilitation',
      mathConfidence: 'High',
      availability: 'Weekends and school holidays',
      preferredRole: 'Presenter',
      whyPopcornMath: 'Passionate about making mathematics interactive and energetic for young minds',
      consent: true
    }, { 'X-Forwarded-For': '10.0.0.3' });
    assert('POST /api/forms/presenter-application returns 201', resPresenter.statusCode === 201);

    // 4.4 Valid learning-needs (Specialist support)
    const resLearning = await request({ path: '/api/forms/learning-needs', method: 'POST' }, {
      parentName: 'Sarah Miller',
      email: 'sarah.m@example.com',
      phone: '+1 (264) 555-0166',
      studentYearGroup: 'Early Primary',
      learningStrengths: 'Visual reasoning and creative storytelling',
      areasForSupport: 'Structured routines, task chunking, executive functioning',
      preferredLearningEnvironment: 'Quiet space with visual aids',
      consent: true
    }, { 'X-Forwarded-For': '10.0.0.4' });
    assert('POST /api/forms/learning-needs returns 201', resLearning.statusCode === 201);

    // 4.5 Valid contact
    const resContact = await request({ path: '/api/forms/contact', method: 'POST' }, {
      fullName: 'David Brown',
      email: 'david.b@example.com',
      phone: '+1 (264) 555-0111',
      subject: 'School Partnership Enquiry',
      message: 'We are interested in bringing Popcorn Math to our school term schedule.',
      consent: true
    }, { 'X-Forwarded-For': '10.0.0.5' });
    assert('POST /api/forms/contact returns 201', resContact.statusCode === 201);

    // Verify persistence in local file storage
    const submissionsFile = path.join(TEST_DATA_DIR, 'tutortime-submissions.json');
    assert('Submissions data file exists in test DATA_DIR', fs.existsSync(submissionsFile));
    const savedData = JSON.parse(fs.readFileSync(submissionsFile, 'utf8'));
    assert('All 5 valid submissions persisted to local storage', savedData.submissions.length === 5);

    // -------------------------------------------------------------
    // PART 5: Error Handling & Security Rejections (HTTP 400 & 200)
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 5: Error Rejections & Edge Cases ---');

    // 5.1 Missing consent -> 400
    const resNoConsent = await request({ path: '/api/forms/contact', method: 'POST' }, {
      fullName: 'David Brown',
      email: 'david.b@example.com',
      subject: 'Hello',
      message: 'Test message',
      consent: false
    }, { 'X-Forwarded-For': '10.0.0.6' });
    assert('Missing consent returns HTTP 400', resNoConsent.statusCode === 400);

    // 5.2 Invalid email -> 400
    const resBadEmail = await request({ path: '/api/forms/contact', method: 'POST' }, {
      fullName: 'David Brown',
      email: 'not-an-email',
      subject: 'Hello',
      message: 'Test message',
      consent: true
    }, { 'X-Forwarded-For': '10.0.0.7' });
    assert('Invalid email returns HTTP 400', resBadEmail.statusCode === 400);

    // 5.3 Missing 18+ confirmation on presenter form -> 400
    const resNo18 = await request({ path: '/api/forms/presenter-application', method: 'POST' }, {
      fullName: 'Alex Johnson',
      email: 'alex.j@example.com',
      phone: '+1 (264) 555-0122',
      location: 'Anguilla',
      ageConfirmation: false, // missing
      educationalBackground: 'BSc in Mathematics',
      experienceWithChildren: 'Youth tutoring',
      availability: 'Weekends',
      whyPopcornMath: 'Love mathematics',
      consent: true
    }, { 'X-Forwarded-For': '10.0.0.8' });
    assert('Missing 18+ age confirmation returns HTTP 400', resNo18.statusCode === 400);

    // 5.4 Unknown fields rejection -> 400
    const resUnknown = await request({ path: '/api/forms/contact', method: 'POST' }, {
      fullName: 'David Brown',
      email: 'david.b@example.com',
      subject: 'Hello',
      message: 'Test message',
      consent: true,
      hackerField: 'injection'
    }, { 'X-Forwarded-For': '10.0.0.9' });
    assert('Unknown fields return HTTP 400', resUnknown.statusCode === 400);
    assert('Unknown field error message returned', resUnknown.body.includes('Unknown field: hackerField'));

    // 5.5 Oversized fields -> 400
    const resOversized = await request({ path: '/api/forms/contact', method: 'POST' }, {
      fullName: 'A'.repeat(105), // max 100
      email: 'david.b@example.com',
      subject: 'Hello',
      message: 'Test message',
      consent: true
    }, { 'X-Forwarded-For': '10.0.0.10' });
    assert('Oversized field returns HTTP 400', resOversized.statusCode === 400);

    // 5.6 Non-PDF presign request -> 400
    const resBadPresign = await request({ path: '/api/uploads/presign', method: 'POST' }, {
      filename: 'malicious.exe'
    });
    assert('Non-PDF presign request returns HTTP 400', resBadPresign.statusCode === 400);

    // 5.7 Honeypot submission -> 200 silently, stores nothing
    const countBeforeHoneypot = JSON.parse(fs.readFileSync(submissionsFile, 'utf8')).submissions.length;
    const resHoneypot = await request({ path: '/api/forms/contact', method: 'POST' }, {
      fullName: 'Bot User',
      email: 'bot@example.com',
      subject: 'Spam Offer',
      message: 'Buy cheap things now',
      consent: true,
      _gotcha: 'http://spam.ru'
    }, { 'X-Forwarded-For': '10.0.0.11' });
    assert('Honeypot submission returns HTTP 200 silently', resHoneypot.statusCode === 200);
    const countAfterHoneypot = JSON.parse(fs.readFileSync(submissionsFile, 'utf8')).submissions.length;
    assert('Honeypot submission dropped (nothing stored)', countBeforeHoneypot === countAfterHoneypot);

    // -------------------------------------------------------------
    // PART 6: CV Flow End-to-End with Local Driver
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 6: CV Upload Flow End-to-End ---');
    // Step A: Presign
    const resCvPresign = await request({ path: '/api/uploads/presign', method: 'POST' }, {
      filename: 'Cassie_Candidate_CV.pdf'
    });
    assert('Valid PDF presign returns HTTP 200', resCvPresign.statusCode === 200);
    assert('Presign returns upload URL and key', resCvPresign.json && resCvPresign.json.url && resCvPresign.json.key);

    // Step B: Post to mock-post upload URL
    const resMockUpload = await request({ path: resCvPresign.json.url, method: 'POST' }, 'dummy pdf binary data');
    assert('Mock post upload returns HTTP 204', resMockUpload.statusCode === 204);

    // Step C: Submit form with cvUploadKey
    const resCvForm = await request({ path: '/api/forms/presenter-application', method: 'POST' }, {
      fullName: 'Taylor Morgan',
      email: 'taylor.m@example.com',
      phone: '+1 (264) 555-0133',
      location: 'Anguilla',
      ageConfirmation: true,
      educationalBackground: 'BA Education',
      experienceWithChildren: '5 years tutoring',
      mathConfidence: 'Moderate',
      availability: 'Flexible',
      preferredRole: 'Assistant Presenter',
      whyPopcornMath: 'Excited to support mathematics workshops',
      cvUploadKey: resCvPresign.json.key,
      consent: true
    }, { 'X-Forwarded-For': '10.0.0.12' });
    assert('Presenter form with cvUploadKey returns HTTP 201', resCvForm.statusCode === 201);

    const savedWithCv = JSON.parse(fs.readFileSync(submissionsFile, 'utf8')).submissions.pop();
    assert('Persisted record contains cvUploadKey', savedWithCv.cvUploadKey === resCvPresign.json.key);

    // -------------------------------------------------------------
    // PART 7: Rate Limiting (5 per 15 min -> 6th returns 429)
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 7: Form Rate Limiting ---');
    const RATE_IP = '192.168.100.50';
    let rateStatus = null;

    // Send 5 submissions from the same IP (max limit)
    for (let i = 1; i <= 5; i++) {
      const r = await request({ path: '/api/forms/contact', method: 'POST' }, {
        fullName: `User ${i}`,
        email: `user${i}@example.com`,
        subject: `Enquiry ${i}`,
        message: 'Valid enquiry message',
        consent: true
      }, { 'X-Forwarded-For': RATE_IP });
      if (i === 1) assert('1st submission from IP returns 201', r.statusCode === 201);
    }

    // 6th submission from the same IP must be rate-limited (HTTP 429)
    const resRateLimit = await request({ path: '/api/forms/contact', method: 'POST' }, {
      fullName: 'User 6',
      email: 'user6@example.com',
      subject: 'Enquiry 6',
      message: 'Valid enquiry message',
      consent: true
    }, { 'X-Forwarded-For': RATE_IP });

    assert('6th submission within window returns HTTP 429', resRateLimit.statusCode === 429);

    // -------------------------------------------------------------
    // PART 8: Zero PII in Server Logs Assertion
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 8: Zero PII Logging Verification ---');
    const secretEmail = 'classified-applicant-9876@example.com';
    const secretPhone = '+1-264-987-6543';

    await request({ path: '/api/forms/contact', method: 'POST' }, {
      fullName: 'Secret Applicant',
      email: secretEmail,
      phone: secretPhone,
      subject: 'Confidential enquiry',
      message: 'Testing zero log exposure',
      consent: true
    }, { 'X-Forwarded-For': '10.0.0.99' });

    // Allow slight delay for log flushing
    await new Promise(r => setTimeout(r, 200));

    assert('Secret email does NOT appear in captured server logs', !serverLogs.includes(secretEmail));
    assert('Secret phone does NOT appear in captured server logs', !serverLogs.includes(secretPhone));

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n================================================================');
    console.log(`STAGE 2 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

  } finally {
    serverProcess.kill('SIGTERM');
    // Clean up temporary environment
    if (fs.existsSync(TEST_DIR)) {
      try { fs.rmSync(TEST_DIR, { recursive: true, force: true }); } catch (_) {}
    }
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
