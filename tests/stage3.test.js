/**
 * Stage 3 Comprehensive Automated Test Suite
 * Covers TT-13, TT-14, TT-15, TT-16, Testimonials config, and strict CSP/Storage boundaries.
 * Fully self-contained: Runs on isolated test port 5004 with temporary DATA_DIR.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const config = require('../src/shared/config');
const {
  getAllQuestions,
  getRoundQuestions,
  checkAnswer,
  isRoundComplete
} = require('../src/shared/game/popcornGame');
const {
  YEAR_GROUPS,
  SUPPORT_WANTED,
  LEVEL_OF_SUPPORT,
  sanitizeInterestHint,
  recommendService
} = require('../src/shared/finder/serviceFinder');

const TEST_PORT = 5004;
const TEST_DIR = path.join(__dirname, 'temp_test_stage3_env');
const TEST_DATA_DIR = path.join(TEST_DIR, 'data');
const TEST_SUBSCRIBERS_FILE = path.join(TEST_DIR, 'subscribers_test.json');
const TEST_ADMIN_KEY = 'test-secret-stage3-key';

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

function waitForServer(port, maxRetries = 40) {
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
  console.log('       STAGE 3 AUTOMATED VERIFICATION SUITE (ISOLATED)          ');
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

  let serverLogs = '';

  const serverEnv = {
    ...process.env,
    PORT: String(TEST_PORT),
    DATA_DIR: TEST_DATA_DIR,
    SUBSCRIBERS_DB_FILE: TEST_SUBSCRIBERS_FILE,
    ADMIN_API_KEY: TEST_ADMIN_KEY,
    STORAGE_DRIVER: 'local',
    FORM_RATE_LIMIT_MAX: '5',
    TRUST_PROXY: 'true'
  };

  const serverProc = spawn(process.execPath, [path.join(__dirname, '../server.js')], {
    env: serverEnv,
    stdio: 'pipe'
  });

  serverProc.stdout.on('data', (d) => { serverLogs += d.toString(); });
  serverProc.stderr.on('data', (d) => { serverLogs += d.toString(); });

  try {
    await waitForServer(TEST_PORT);
    console.log(`Server started successfully on port ${TEST_PORT}.\n`);

    // --- TEST GROUP 1: New Page Routes & Canonical Names ---
    console.log('--- TEST GROUP 1: New Page Routes & Canonical Names ---');
    
    // TT-13 Mini-Game
    const resGame = await request({ path: '/popcorn-maths/game' });
    assert('/popcorn-maths/game returns HTTP 200', resGame.statusCode === 200);
    assert('/popcorn-maths/game contains canonical name "Popcorn Math Mini-Game"', resGame.body.includes('Popcorn Math Mini-Game'));
    assert('/popcorn-maths/game has parent zero-storage notice', resGame.body.includes('This game does not collect or store any personal data or responses.'));
    assert('/popcorn-maths/game contains mascot placeholder', resGame.body.includes('data-todo="mascot"'));

    // TT-14 Smart Service Finder
    const resFinder = await request({ path: '/find-your-programme' });
    assert('/find-your-programme returns HTTP 200', resFinder.statusCode === 200);
    assert('/find-your-programme contains canonical name "Smart Service Finder"', resFinder.body.includes('Smart Service Finder'));
    assert('/find-your-programme contains memory-only notice', resFinder.body.includes('Your answers are held in memory only and are never saved or sent to a server.'));

    // Homepage Finder CTA
    const resHome = await request({ path: '/' });
    assert('/ homepage contains link to /find-your-programme', resHome.body.includes('/find-your-programme'));

    // TT-15 School Partnerships
    const resSchool = await request({ path: '/popcorn-maths/school-partnership' });
    assert('/popcorn-maths/school-partnership returns HTTP 200', resSchool.statusCode === 200);
    assert('/popcorn-maths/school-partnership contains canonical name "School Partnerships"', resSchool.body.includes('School Partnerships'));
    assert('/popcorn-maths/school-partnership states enquiry disclaimer', resSchool.body.includes('it is not a confirmed booking'));

    // TT-16 Resources
    const resResources = await request({ path: '/resources' });
    assert('/resources returns HTTP 200', resResources.statusCode === 200);
    assert('/resources contains canonical name "Educational Resources"', resResources.body.includes('Educational Resources'));
    assert('/resources has TODO(content) stub', resResources.body.includes('data-todo="content"'));

    // --- TEST GROUP 2: TT-15 School Partnership Form Pipeline ---
    console.log('\n--- TEST GROUP 2: TT-15 School Partnership Form Pipeline ---');
    const validSchoolSubmission = {
      schoolName: 'Island Academy',
      contactPerson: 'David Miller',
      roleTitle: 'Head of Mathematics',
      email: 'dmiller@islandacademy.edu',
      phone: '+1 264 497 0001',
      locationDistrict: 'Sandy Ground, Anguilla',
      studentAgeGroup: '8-10',
      estimatedStudentCount: 45,
      programmeType: 'Workshop',
      targetDate: 'Term 2 2026',
      message: 'Looking for a half-day interactive workshop for Year 4 and Year 5.',
      consent: true,
      _gotcha: ''
    };

    const resValidSchool = await request({ path: '/api/forms/school-enquiry', method: 'POST' }, validSchoolSubmission, {
      'x-forwarded-for': '192.168.10.1'
    });
    assert('Valid school enquiry returns HTTP 201', resValidSchool.statusCode === 201);
    assert('Response indicates success', resValidSchool.json && resValidSchool.json.success === true);

    // Verify record in storage has SCHOOL_ENQUIRY type
    const storageFile = path.join(TEST_DATA_DIR, 'tutortime-submissions.json');
    assert('Storage file exists in isolated directory', fs.existsSync(storageFile));
    const savedData = JSON.parse(fs.readFileSync(storageFile, 'utf8'));
    const savedRecords = Array.isArray(savedData) ? savedData : (savedData.submissions || []);
    const schoolRecord = savedRecords.find(r => r.type === 'SCHOOL_ENQUIRY');
    assert('Stored record has type SCHOOL_ENQUIRY', !!schoolRecord);
    assert('Stored record matches school name', schoolRecord && schoolRecord.payload.schoolName === 'Island Academy');

    // Validation Errors: Missing consent
    const resNoConsent = await request({ path: '/api/forms/school-enquiry', method: 'POST' }, {
      ...validSchoolSubmission,
      consent: false
    }, { 'x-forwarded-for': '192.168.10.2' });
    assert('Missing consent returns HTTP 400', resNoConsent.statusCode === 400);

    // Bad email
    const resBadEmail = await request({ path: '/api/forms/school-enquiry', method: 'POST' }, {
      ...validSchoolSubmission,
      email: 'not-an-email'
    }, { 'x-forwarded-for': '192.168.10.3' });
    assert('Bad email returns HTTP 400', resBadEmail.statusCode === 400);

    // Student count < 10 (9)
    const resCountLow = await request({ path: '/api/forms/school-enquiry', method: 'POST' }, {
      ...validSchoolSubmission,
      estimatedStudentCount: 9
    }, { 'x-forwarded-for': '192.168.10.4' });
    assert('Estimated student count 9 (<10) returns HTTP 400', resCountLow.statusCode === 400);

    // Student count > 500 (501)
    const resCountHigh = await request({ path: '/api/forms/school-enquiry', method: 'POST' }, {
      ...validSchoolSubmission,
      estimatedStudentCount: 501
    }, { 'x-forwarded-for': '192.168.10.5' });
    assert('Estimated student count 501 (>500) returns HTTP 400', resCountHigh.statusCode === 400);

    // Bad programmeType
    const resBadProg = await request({ path: '/api/forms/school-enquiry', method: 'POST' }, {
      ...validSchoolSubmission,
      programmeType: 'InvalidType'
    }, { 'x-forwarded-for': '192.168.10.6' });
    assert('Bad programmeType returns HTTP 400', resBadProg.statusCode === 400);

    // Unknown field
    const resUnknownField = await request({ path: '/api/forms/school-enquiry', method: 'POST' }, {
      ...validSchoolSubmission,
      unexpectedField: 'forbidden'
    }, { 'x-forwarded-for': '192.168.10.7' });
    assert('Unknown field returns HTTP 400', resUnknownField.statusCode === 400);

    // Oversized message (> 500 chars)
    const resOversizedMsg = await request({ path: '/api/forms/school-enquiry', method: 'POST' }, {
      ...validSchoolSubmission,
      message: 'a'.repeat(501)
    }, { 'x-forwarded-for': '192.168.10.8' });
    assert('Oversized message (> 500 chars) returns HTTP 400', resOversizedMsg.statusCode === 400);

    // Honeypot silent drop
    const resHoneypot = await request({ path: '/api/forms/school-enquiry', method: 'POST' }, {
      ...validSchoolSubmission,
      _gotcha: 'bot-fill'
    }, { 'x-forwarded-for': '192.168.10.9' });
    assert('Honeypot returns HTTP 200 silently', resHoneypot.statusCode === 200);

    // Rate Limiting on school form (5 allowed, 6th returns 429)
    console.log('\n--- Rate Limiting Verification ---');
    const rateLimitIp = '192.168.99.1';
    for (let i = 1; i <= 5; i++) {
      await request({ path: '/api/forms/school-enquiry', method: 'POST' }, validSchoolSubmission, {
        'x-forwarded-for': rateLimitIp
      });
    }
    const resRateLimited = await request({ path: '/api/forms/school-enquiry', method: 'POST' }, validSchoolSubmission, {
      'x-forwarded-for': rateLimitIp
    });
    assert('6th submission from same IP returns HTTP 429', resRateLimited.statusCode === 429);

    // --- TEST GROUP 3: TT-13 Mini-Game Pure Logic Unit Tests ---
    console.log('\n--- TEST GROUP 3: Mini-Game Pure Logic Unit Tests ---');
    const questions = getAllQuestions();
    assert('Fixed question list contains 10 questions', questions.length === 10);
    assert('Questions are suited for ages 8-13 (includes 8x7)', questions.some(q => q.prompt.includes('8 × 7')));

    const round1 = getRoundQuestions(0);
    assert('Round selection returns exactly 3 questions', round1.length === 3);
    assert('All 3 questions in round are distinct', (new Set(round1.map(q => q.id))).size === 3);

    const checkCorrect = checkAnswer('q1', 56);
    assert('checkAnswer with correct answer returns isCorrect: true', checkCorrect.isCorrect === true);
    assert('checkAnswer with correct answer includes POP! feedback', checkCorrect.feedback.includes('POP!'));

    const checkWrong = checkAnswer('q1', 48);
    assert('checkAnswer with wrong answer returns isCorrect: false', checkWrong.isCorrect === false);
    assert('checkAnswer with wrong answer includes Try again feedback', checkWrong.feedback.includes('Try again'));

    assert('isRoundComplete(3) returns true', isRoundComplete(3) === true);
    assert('isRoundComplete(2) returns false', isRoundComplete(2) === false);

    // --- TEST GROUP 4: TT-14 Smart Service Finder Pure Mapping Unit Tests ---
    console.log('\n--- TEST GROUP 4: Smart Service Finder Pure Mapping Unit Tests ---');
    let totalCombinations = 0;
    let validRecommendations = 0;

    for (const yg of YEAR_GROUPS) {
      for (const sw of SUPPORT_WANTED) {
        for (const ls of LEVEL_OF_SUPPORT) {
          totalCombinations++;
          const rec = recommendService({ yearGroup: yg, supportWanted: sw, levelOfSupport: ls });
          if (rec && rec.serviceId && rec.canonicalName && rec.reason && rec.ctaUrl && rec.ctaText) {
            validRecommendations++;
          }
        }
      }
    }
    assert(`Exhaustively tested ${totalCombinations} finder combinations (no unmapped inputs)`, totalCombinations === 72);
    assert('All 72 combinations return valid recommendation objects', validRecommendations === totalCombinations);

    // Specific mapping verification
    const recComp = recommendService({ levelOfSupport: 'comprehensive' });
    assert('Comprehensive support maps to Concierge', recComp.serviceId === 'concierge');

    const recOrg = recommendService({ supportWanted: 'organisation' });
    assert('Organisation support maps to Concierge', recOrg.serviceId === 'concierge');

    const recLearningSupport = recommendService({ supportWanted: 'learning-support' });
    assert('Learning support maps to Individualised Learning Support', recLearningSupport.serviceId === 'specialist-support');
    assert('Learning support uses canonical name', recLearningSupport.canonicalName === 'Individualised Learning Support');

    const recMathPrimary = recommendService({ yearGroup: 'upper-primary', supportWanted: 'maths', levelOfSupport: 'weekly' });
    assert('Primary math support maps to Popcorn Math', recMathPrimary.serviceId === 'popcorn-maths');

    // Hint sanitization allowlist
    assert('Valid hint "popcorn-maths" passes allowlist', sanitizeInterestHint('popcorn-maths') === 'popcorn-maths');
    assert('Valid hint "concierge" passes allowlist', sanitizeInterestHint('concierge') === 'concierge');
    assert('Invalid hint "malicious-injection" returns null', sanitizeInterestHint('malicious-injection') === null);
    assert('Empty hint returns null', sanitizeInterestHint('') === null);

    // --- TEST GROUP 5: Zero Client-Side Storage Scan ---
    console.log('\n--- TEST GROUP 5: Zero Client-Side Storage Scan ---');
    const prohibitedTokens = [
      'fetch',
      'XMLHttpRequest',
      'sendBeacon',
      'WebSocket',
      'localStorage',
      'sessionStorage',
      'indexedDB',
      'document.cookie'
    ];

    const clientScripts = [
      path.join(__dirname, '../MyWebApp/src/main/webapp/js/game.js'),
      path.join(__dirname, '../MyWebApp/src/main/webapp/js/finder.js')
    ];

    for (const scriptPath of clientScripts) {
      const scriptName = path.basename(scriptPath);
      const scriptContent = fs.readFileSync(scriptPath, 'utf8');

      for (const token of prohibitedTokens) {
        const found = scriptContent.includes(token);
        assert(`${scriptName} contains zero references to '${token}'`, !found);
      }
    }

    // --- TEST GROUP 6: Zero External Requests, Inline Scripts & Inline Handlers Scan ---
    console.log('\n--- TEST GROUP 6: Zero External Requests, Inline Scripts & Event Handlers Scan ---');
    const allRoutes = [
      '/',
      '/about',
      '/services/traditional-tutoring',
      '/services/concierge',
      '/services/popcorn-maths',
      '/services/specialist-support',
      '/popcorn-maths/presenter',
      '/popcorn-maths/game',
      '/find-your-programme',
      '/popcorn-maths/school-partnership',
      '/resources',
      '/book',
      '/contact',
      '/faq'
    ];

    for (const route of allRoutes) {
      const res = await request({ path: route });
      assert(`${route} returns HTTP 200`, res.statusCode === 200);

      // Check no inline script bodies: <script>...</script> where body is non-empty
      const inlineScriptMatches = res.body.match(/<script\b[^>]*>([\s\S]*?)<\/script>/gi) || [];
      const hasInlineScriptBody = inlineScriptMatches.some(tag => {
        // Exclude tags with src attribute
        if (/src\s*=/i.test(tag)) return false;
        const inner = tag.replace(/<script\b[^>]*>/i, '').replace(/<\/script>/i, '').trim();
        return inner.length > 0;
      });
      assert(`${route} has zero inline <script> bodies`, !hasInlineScriptBody);

      // Check no inline event handlers: onclick, onload, onsubmit, etc.
      const hasInlineHandlers = /\son[a-z]{3,}\s*=/i.test(res.body);
      assert(`${route} has zero inline on* event attributes`, !hasInlineHandlers);

      // Check no external host URLs in assets or link tags: src="https?://" or href="https?://"
      const externalAssetMatches = res.body.match(/(?:src|href)=["']https?:\/\/[^"'>]+/gi) || [];
      // wa.me is permitted only when WHATSAPP_PHONE_NUMBER is configured; in test env it must be empty
      assert(`${route} has zero asset URLs pointing to external hosts`, externalAssetMatches.length === 0);
    }

    // --- TEST GROUP 7: Testimonials Verification ---
    console.log('\n--- TEST GROUP 7: Testimonials Verification ---');
    assert('config.testimonials.enabled is false', config.testimonials.enabled === false);

    for (const route of allRoutes) {
      const res = await request({ path: route });
      const lowerBody = res.body.toLowerCase();
      const hasTestimonialSection = lowerBody.includes('class="testimonial') ||
                                    lowerBody.includes('id="testimonial') ||
                                    lowerBody.includes('what parents say');
      assert(`${route} contains zero testimonial sections`, !hasTestimonialSection);
    }

    // --- TEST GROUP 8: Zero PII Logging Verification ---
    console.log('\n--- TEST GROUP 8: Zero PII Logging Verification ---');
    assert('Server logs contain zero applicant emails', !serverLogs.includes('dmiller@islandacademy.edu'));
    assert('Server logs contain zero applicant phone numbers', !serverLogs.includes('497 0001'));

    console.log('\n================================================================');
    console.log(`STAGE 3 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

  } catch (err) {
    console.error('Fatal test error in Stage 3 suite:', err);
    failed++;
  } finally {
    serverProc.kill('SIGINT');

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
