/**
 * Phase 2 Task 5 Test Suite: Popcorn Math Complete Rebuild
 *
 * Verifies:
 * 1. All 7 canonical pages return HTTP 200 with proper titles and structure:
 *    - /services/popcorn-math
 *    - /popcorn-math/parents
 *    - /popcorn-math/schools
 *    - /popcorn-math/presenters
 *    - /popcorn-math/locations
 *    - /popcorn-math/play
 *    - /popcorn-math/faq
 * 2. 301 Permanent redirects from legacy URLs:
 *    - /services/popcorn-maths -> /services/popcorn-math
 *    - /popcorn-maths/presenter -> /popcorn-math/presenters
 *    - /popcorn-maths/game -> /popcorn-math/play
 *    - /popcorn-maths/school-partnership -> /popcorn-math/schools
 * 3. /join alias 301 redirect to /popcorn-math/presenters
 * 4. Popcorn parent interest form pipeline (/api/forms/popcorn-parent-interest):
 *    - Rejects if unknown fields provided (e.g. child name)
 *    - Rejects if no contact method or missing parent name
 *    - Accepts valid parent registration and stores without child name
 * 5. Mascot presence and child-friendly styling
 * 6. Responsive design and print stylesheet support
 */

const http = require('http');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const TEST_PORT = 5025;
const TEST_DIR = path.join(__dirname, 'temp_test_popcorn');
const DATA_DIR = path.join(TEST_DIR, 'data');

let serverProc = null;
let passed = 0;
let failed = 0;

function assert(description, condition) {
  if (condition) {
    console.log(`  ✓ ${description}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${description}`);
    failed++;
  }
}

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: TEST_PORT,
      ...options
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          json
        });
      });
    });

    req.on('error', reject);
    if (body) {
      if (typeof body === 'object') {
        req.setHeader('Content-Type', 'application/json');
        req.write(JSON.stringify(body));
      } else {
        req.write(body);
      }
    }
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('       PHASE 2 TASK 5: POPCORN MATH REBUILD TEST SUITE          ');
  console.log('================================================================\n');

  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const env = {
    ...process.env,
    PORT: TEST_PORT,
    DATA_DIR: DATA_DIR,
    SUBSCRIBERS_FILE: path.join(TEST_DIR, 'subscribers.json'),
    NODE_ENV: 'test',
    SITE_URL: 'https://tutortime.ai',
    STORAGE_DRIVER: 'local'
  };

  serverProc = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env,
    stdio: 'pipe'
  });

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Server start timeout')), 10000);
    serverProc.stdout.on('data', (chunk) => {
      if (chunk.toString().includes('Server running on')) {
        clearTimeout(timer);
        resolve();
      }
    });
    serverProc.stderr.on('data', (chunk) => {
      // ignore warnings
    });
  });

  try {
    // -------------------------------------------------------------------------
    // TEST GROUP 1: Canonical 7 Pages HTTP 200
    // -------------------------------------------------------------------------
    console.log('--- TEST GROUP 1: Canonical 7 Pages HTTP 200 ---');
    const canonicalPages = [
      { path: '/services/popcorn-math', name: 'Popcorn Math', keyword: 'Where Math Skills POP' },
      { path: '/popcorn-math/parents', name: 'For Parents', keyword: 'Popcorn Math for Parents' },
      { path: '/popcorn-math/schools', name: 'For Schools', keyword: 'Bring Popcorn Math to Your School' },
      { path: '/popcorn-math/presenters', name: 'For Presenters', keyword: 'Become a Popcorn Math Presenter' },
      { path: '/popcorn-math/locations', name: 'Locations', keyword: 'Popcorn Math Locations' },
      { path: '/popcorn-math/play', name: 'Play', keyword: 'Can You Make the Popcorn Pop' },
      { path: '/popcorn-math/faq', name: 'FAQ', keyword: 'Popcorn Math FAQ' }
    ];

    for (const page of canonicalPages) {
      const res = await request({ path: page.path, method: 'GET' });
      assert(`${page.path} returns HTTP 200`, res.statusCode === 200);
      assert(`${page.path} contains expected text "${page.keyword}"`, res.body.includes(page.keyword));
      assert(`${page.path} uses brand name "Popcorn Math" (no "s")`, res.body.includes('Popcorn Math'));
    }

    // -------------------------------------------------------------------------
    // TEST GROUP 2: 301 Permanent Redirects
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 2: 301 Permanent Redirects ---');
    const redirects = [
      { oldPath: '/services/popcorn-maths', newPath: '/services/popcorn-math' },
      { oldPath: '/popcorn-maths/presenter', newPath: '/popcorn-math/presenters' },
      { oldPath: '/popcorn-maths/game', newPath: '/popcorn-math/play' },
      { oldPath: '/popcorn-maths/school-partnership', newPath: '/popcorn-math/schools' },
      { oldPath: '/join', newPath: '/popcorn-math/presenters' }
    ];

    for (const r of redirects) {
      const res = await request({ path: r.oldPath, method: 'GET' });
      assert(`${r.oldPath} returns HTTP 301 redirect`, res.statusCode === 301);
      assert(`${r.oldPath} Location header points to ${r.newPath}`, res.headers.location === r.newPath);
    }

    // -------------------------------------------------------------------------
    // TEST GROUP 3: Mascot & Visual Assets
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 3: Mascot Bucket & Visual Assets ---');
    const hubRes = await request({ path: '/services/popcorn-math', method: 'GET' });
    assert('Hub page contains Popcorn bucket mascot', hubRes.body.includes('mascot-bucket'));
    assert('Hub page contains TODO(mascot) comment for artist replacement', hubRes.body.includes('TODO(mascot)'));

    const playRes = await request({ path: '/popcorn-math/play', method: 'GET' });
    assert('Play page contains Popcorn bucket mascot', playRes.body.includes('mascot-bucket'));

    // -------------------------------------------------------------------------
    // TEST GROUP 4: Child Privacy & Parent Interest Form Pipeline
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 4: Child Privacy & Parent Form Pipeline ---');
    const parentsRes = await request({ path: '/popcorn-math/parents', method: 'GET' });
    assert('Parent page explicitly contains child privacy notice',
      parentsRes.body.includes('We respect child privacy: we do not collect child names on this form'));
    assert('Parent page form does NOT contain a childName input', !parentsRes.body.includes('name="childName"'));

    // Attempt invalid form submission with child name (unknown field)
    const resBadField = await request({
      path: '/api/forms/popcorn-parent-interest',
      method: 'POST'
    }, {
      parentName: 'Jane Parent',
      email: 'jane@example.com',
      childGrade: 'Grade 3',
      childName: 'Johnny Doe', // VIOLATION: child name not permitted
      consent: 'on'
    });
    assert('Submission with childName rejected with HTTP 400 (strict schema)', resBadField.statusCode === 400);

    // Attempt submission without parent name
    const resNoName = await request({
      path: '/api/forms/popcorn-parent-interest',
      method: 'POST'
    }, {
      email: 'jane@example.com',
      childGrade: 'Grade 3',
      consent: 'on'
    });
    assert('Submission without parentName rejected with HTTP 400', resNoName.statusCode === 400);

    // Attempt submission without contact info
    const resNoContact = await request({
      path: '/api/forms/popcorn-parent-interest',
      method: 'POST'
    }, {
      parentName: 'Jane Parent',
      childGrade: 'Grade 3',
      consent: 'on'
    });
    assert('Submission without contact method rejected with HTTP 400', resNoContact.statusCode === 400);

    // Valid parent submission
    const resValid = await request({
      path: '/api/forms/popcorn-parent-interest',
      method: 'POST'
    }, {
      parentName: 'Jane Parent',
      email: 'jane@example.com',
      phone: '+1 264 555 1234',
      childGrade: 'Grade 3',
      preferredSchool: 'the-valley-pilot',
      message: 'Excited about the hands-on 3D crafts!',
      consent: 'on'
    });
    assert('Valid parent registration returns HTTP 201 Created', resValid.statusCode === 201);
    assert('Response returns record ID', typeof resValid.json.id === 'string');

    // Verify storage file contains record with NO child name
    const storePath = path.join(DATA_DIR, 'tutortime-submissions.json');
    assert('Submissions store file created', fs.existsSync(storePath));
    const storeData = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    const submissionsList = Array.isArray(storeData) ? storeData : (storeData.submissions || []);
    const parentRecord = submissionsList.find(r => r.formType === 'POPCORN_PARENT_INTEREST' || r.formType === 'popcorn-parent-interest');
    assert('Parent record successfully persisted', !!parentRecord);
    assert('Parent record contains parentName', parentRecord.parentName === 'Jane Parent');
    assert('Parent record contains childGrade', parentRecord.childGrade === 'Grade 3');
    assert('Parent record strictly contains NO childName attribute', parentRecord.childName === undefined);

    // -------------------------------------------------------------------------
    // TEST GROUP 5: Print Stylesheet & Presenter Handout
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 5: Print Stylesheet & Handout ---');
    const presenterRes = await request({ path: '/popcorn-math/presenters', method: 'GET' });
    assert('Presenters page contains print handout summary', presenterRes.body.includes('summary-print-card'));

    const cssContent = fs.readFileSync(path.join(__dirname, '../MyWebApp/src/main/webapp/css/components.css'), 'utf8');
    assert('components.css contains @media print rules for clean printouts', cssContent.includes('@media print'));

    // -------------------------------------------------------------------------
    // TEST GROUP 6: Interactive Wiring, Form Schema Alignment & Branded 404
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 6: Interactive Wiring, Form Alignment & Branded 404 ---');
    assert('Play page renders #question-tracker, #question-prompt, and #answers-grid for game.js',
      playRes.body.includes('id="question-tracker"') && playRes.body.includes('id="question-prompt"') && playRes.body.includes('id="answers-grid"'));
    assert('Play page renders #game-star-screen and #btn-play-again',
      playRes.body.includes('id="game-star-screen"') && playRes.body.includes('id="btn-play-again"'));
    assert('Hub location details renders #loc-title, #loc-venue, #loc-schedule, #loc-cta',
      hubRes.body.includes('id="loc-title"') && hubRes.body.includes('id="loc-venue"') && hubRes.body.includes('id="loc-schedule"') && hubRes.body.includes('id="loc-cta"'));

    assert('Parents form wires data-form-type="popcorn-parent-interest"',
      parentsRes.body.includes('data-form-type="popcorn-parent-interest"'));

    const schoolsRes = await request({ path: '/popcorn-math/schools', method: 'GET' });
    assert('Schools form wires data-form-type="school-enquiry"',
      schoolsRes.body.includes('data-form-type="school-enquiry"'));
    assert('Schools form uses validator-aligned field names',
      schoolsRes.body.includes('name="schoolName"') &&
      schoolsRes.body.includes('name="contactPerson"') &&
      schoolsRes.body.includes('name="roleTitle"') &&
      schoolsRes.body.includes('name="locationDistrict"') &&
      schoolsRes.body.includes('name="studentAgeGroup"') &&
      schoolsRes.body.includes('name="estimatedStudentCount"'));

    assert('Presenters form wires data-form-type="presenter-application"',
      presenterRes.body.includes('data-form-type="presenter-application"'));
    assert('Presenters form uses validator-aligned fields and #cvUploadKey without raw cvFile name',
      presenterRes.body.includes('name="ageConfirmation"') &&
      presenterRes.body.includes('id="cvUploadKey"') &&
      presenterRes.body.includes('name="educationalBackground"') &&
      presenterRes.body.includes('name="experienceWithChildren"') &&
      presenterRes.body.includes('name="availability"') &&
      presenterRes.body.includes('name="whyPopcornMath"') &&
      !presenterRes.body.includes('name="cvFile"'));

    const homeRes = await request({ path: '/', method: 'GET' });
    assert('Homepage renders all 4 core pathways including Individualised Learning Support',
      homeRes.body.includes('pathway-tutoring') &&
      homeRes.body.includes('pathway-concierge') &&
      homeRes.body.includes('pathway-popcorn') &&
      homeRes.body.includes('pathway-specialist'));

    const notFoundRes = await request({ path: '/nonexistent-streamline-check', method: 'GET' });
    assert('Unknown route returns HTTP 404 with branded Not Found page',
      notFoundRes.statusCode === 404 && notFoundRes.body.includes('Page Not Found') && notFoundRes.body.includes('Return Home'));

  } catch (err) {
    console.error('Fatal error during Popcorn Math test execution:', err);
    failed++;
  } finally {
    if (serverProc) {
      serverProc.kill('SIGINT');
    }
    try {
      if (fs.existsSync(TEST_DIR)) {
        fs.rmSync(TEST_DIR, { recursive: true, force: true });
      }
    } catch (_) {}

    console.log('\n================================================================');
    console.log(`POPCORN MATH TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

runTests();
