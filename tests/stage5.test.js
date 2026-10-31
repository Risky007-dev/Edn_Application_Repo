/**
 * Stage 5 Automated Verification Suite
 * Covers Operational Hardening, SEO Discovery (robots.txt, sitemap.xml, Open Graph),
 * Tracing & Fault-Injection Harness, Service Functions (P1, P2, C1, T3, X2),
 * Feature Flag Toggles, and Graceful SIGTERM Container Shutdown.
 * Fully self-contained on isolated test ports 5007 / 5008.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const config = require('../src/shared/config');
const content = require('../src/shared/content');
const {
  QUESTION_BANKS,
  getQuestionsByLevel,
  checkAnswer
} = require('../src/shared/game/popcornGame');
const {
  renderConciergePage,
  renderPopcornMathsPage,
  renderPopcornGamePage,
  renderBookPage
} = require('../src/shared/templates/pages');

const TEST_PORT = 5007;
const FAULT_PORT = 5008;
const TEST_DIR = path.join(__dirname, 'temp_test_stage5_env');
const TEST_DATA_DIR = path.join(TEST_DIR, 'data');
const TEST_SUBSCRIBERS_FILE = path.join(TEST_DIR, 'subscribers_test.json');

if (fs.existsSync(TEST_DIR)) {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(TEST_DATA_DIR, { recursive: true });

function request(port, options, postData = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: '127.0.0.1',
      port,
      path: options.path || '/',
      method: options.method || 'GET',
      headers: { ...options.headers, ...headers }
    };

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
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
      const req = http.get(`http://127.0.0.1:${port}/health`, (res) => {
        res.resume();
        if (res.statusCode === 200) {
          resolve();
        } else {
          setTimeout(check, 150);
        }
      });
      req.on('error', () => {
        retries++;
        if (retries >= maxRetries) {
          reject(new Error(`Server failed to start on port ${port}`));
        } else {
          setTimeout(check, 150);
        }
      });
    };
    check();
  });
}

async function runStage5Suite() {
  console.log('================================================================');
  console.log('       STAGE 5 AUTOMATED VERIFICATION SUITE (ISOLATED)          ');
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
  const serverProc = spawn(process.execPath, [path.join(__dirname, '../server.js')], {
    env: {
      ...process.env,
      PORT: String(TEST_PORT),
      DATA_DIR: TEST_DATA_DIR,
      SUBSCRIBERS_DB_FILE: TEST_SUBSCRIBERS_FILE,
      STORAGE_DRIVER: 'local',
      FAULT_INJECTION_ENABLED: 'false'
    },
    stdio: 'pipe'
  });

  serverProc.stdout.on('data', (d) => { serverLogs += d.toString(); });
  serverProc.stderr.on('data', (d) => { serverLogs += d.toString(); });

  let faultProc = null;

  try {
    await waitForServer(TEST_PORT);

    // --- GROUP 1: Operational Readiness, Container & CloudFormation Alignment (9) ---
    console.log('--- GROUP 1: Operational Readiness, Container & CloudFormation ---');
    const dockerfileText = fs.readFileSync(path.join(__dirname, '../Dockerfile'), 'utf8');
    const pkgJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
    const stackYaml = fs.readFileSync(path.join(__dirname, '../infra/tutortime-stack.yaml'), 'utf8');

    assert('Dockerfile copies src directory into container image', /COPY\s+src\s+\.\/src/.test(dockerfileText));
    assert('Dockerfile HEALTHCHECK probes /health endpoint', dockerfileText.includes('http://localhost:5001/health'));
    assert('package.json declares engines.node runtime range', Boolean(pkgJson.engines && pkgJson.engines.node));
    assert('CloudFormation stack enables DynamoDB PointInTimeRecovery', stackYaml.includes('PointInTimeRecoveryEnabled: true'));

    const resHealth = await request(TEST_PORT, { path: '/health' });
    assert('GET /health returns HTTP 200', resHealth.statusCode === 200);
    assert('GET /health returns status ok and numeric uptime', Boolean(resHealth.json && resHealth.json.status === 'ok' && typeof resHealth.json.uptime === 'number'));

    const resApiHealth = await request(TEST_PORT, { path: '/api/health' });
    assert('GET /api/health returns HTTP 200 with status ok', Boolean(resApiHealth.statusCode === 200 && resApiHealth.json && resApiHealth.json.status === 'ok'));

    const resPing = await request(TEST_PORT, { path: '/api/health/ping' });
    assert('GET /api/health/ping returns HTTP 200', resPing.statusCode === 200);
    assert('GET /api/health/ping returns plain-text pong', resPing.body === 'pong');

    // --- GROUP 2: Tracing Harness & Fault Injection Isolation (8) ---
    console.log('\n--- GROUP 2: Tracing Harness & Fault Injection Isolation ---');
    const customTrace = 'Root=1-671f0000-abcdef1234567890';
    const resTraced = await request(TEST_PORT, { path: '/' }, null, { 'x-amzn-trace-id': customTrace });
    assert('Incoming X-Amzn-Trace-Id is echoed in X-Trace-Id response header', resTraced.headers['x-trace-id'] === customTrace);

    const resSyntheticTrace = await request(TEST_PORT, { path: '/' });
    assert('Missing trace header generates synthetic local-trace-* UUID header', typeof resSyntheticTrace.headers['x-trace-id'] === 'string' && resSyntheticTrace.headers['x-trace-id'].startsWith('local-trace-'));
    assert('Response includes Server-Timing app;dur metric header', typeof resSyntheticTrace.headers['server-timing'] === 'string' && resSyntheticTrace.headers['server-timing'].includes('app;dur='));
    assert('Server JSON logs record custom traceId cleanly', serverLogs.includes(customTrace));

    assert('config.faultInjectionEnabled defaults to false', config.faultInjectionEnabled === false);
    const resFaultDisabled = await request(TEST_PORT, { path: '/api/debug/fault', method: 'POST' }, { mode: '503' });
    assert('POST /api/debug/fault returns HTTP 404 when disabled', resFaultDisabled.statusCode === 404);

    faultProc = spawn(process.execPath, [path.join(__dirname, '../server.js')], {
      env: {
        ...process.env,
        PORT: String(FAULT_PORT),
        DATA_DIR: TEST_DATA_DIR,
        SUBSCRIBERS_DB_FILE: TEST_SUBSCRIBERS_FILE,
        STORAGE_DRIVER: 'local',
        FAULT_INJECTION_ENABLED: 'true',
        FAULT_INJECTION_KEY: 'paper-secret-fault-key'
      },
      stdio: 'ignore'
    });
    await waitForServer(FAULT_PORT);

    const resFaultBadKey = await request(FAULT_PORT, { path: '/api/debug/fault', method: 'POST' }, { mode: '503' }, { 'x-debug-fault-key': 'wrong-key' });
    assert('POST /api/debug/fault with invalid key returns HTTP 404', resFaultBadKey.statusCode === 404);

    const resFaultValid = await request(FAULT_PORT, { path: '/api/debug/fault', method: 'POST' }, { mode: '503' }, { 'x-debug-fault-key': 'paper-secret-fault-key' });
    assert('POST /api/debug/fault with valid key triggers controlled HTTP 503', resFaultValid.statusCode === 503);
    faultProc.kill('SIGTERM');
    faultProc = null;

    // --- GROUP 3: SEO Discovery & XML Lockdown (12) ---
    console.log('\n--- GROUP 3: SEO Discovery (robots.txt, sitemap.xml, Open Graph) ---');
    const resRobots = await request(TEST_PORT, { path: '/robots.txt' });
    assert('GET /robots.txt returns HTTP 200', resRobots.statusCode === 200);
    assert('robots.txt allows crawlers and disallows /api/', resRobots.body.includes('User-agent: *') && resRobots.body.includes('Disallow: /api/'));
    assert('robots.txt points to canonical sitemap.xml', resRobots.body.includes('Sitemap: https://popcornmaths.com/sitemap.xml'));

    const resSitemap = await request(TEST_PORT, { path: '/sitemap.xml' });
    assert('GET /sitemap.xml returns HTTP 200 with XML content-type', resSitemap.statusCode === 200 && String(resSitemap.headers['content-type']).includes('xml'));
    assert('sitemap.xml contains valid XML <urlset> declaration', resSitemap.body.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));

    const expectedRoutes = [
      '/', '/about', '/services/traditional-tutoring', '/services/concierge',
      '/services/popcorn-maths', '/services/specialist-support', '/popcorn-maths/presenter',
      '/popcorn-maths/game', '/find-your-programme', '/popcorn-maths/school-partnership',
      '/resources', '/book', '/contact', '/faq'
    ];
    assert('sitemap.xml lists all 14 canonical public routes', expectedRoutes.every((r) => resSitemap.body.includes(`<loc>https://popcornmaths.com${r}</loc>`)));

    const resPom = await request(TEST_PORT, { path: '/pom.xml' });
    assert('GET /pom.xml remains blocked with HTTP 404', resPom.statusCode === 404);
    const resWebXml = await request(TEST_PORT, { path: '/WEB-INF/web.xml' });
    assert('GET /WEB-INF/web.xml remains blocked with HTTP 404', resWebXml.statusCode === 404);

    assert('Rendered HTML includes og:title meta tag', resSyntheticTrace.body.includes('property="og:title"'));
    assert('Rendered HTML includes og:description meta tag', resSyntheticTrace.body.includes('property="og:description"'));
    assert('Rendered HTML includes og:url meta tag', resSyntheticTrace.body.includes('property="og:url"'));
    assert('Rendered HTML includes og:image meta tag', resSyntheticTrace.body.includes('property="og:image"'));

    // --- GROUP 4: Service Functions (P1, P2, C1, T3, X2) UI & Logic (17) ---
    console.log('\n--- GROUP 4: Service Functions (P1, P2, C1, T3, X2) ---');
    assert('content.popcornLocations defines 5 community/virtual cohorts', Array.isArray(content.popcornLocations) && content.popcornLocations.length === 5);

    const resPopcorn = await request(TEST_PORT, { path: '/services/popcorn-maths' });
    assert('/services/popcorn-maths renders #popcorn-location-select', resPopcorn.body.includes('id="popcorn-location-select"'));
    assert('/services/popcorn-maths embeds data-locations and #location-details live region', resPopcorn.body.includes('data-locations=') && resPopcorn.body.includes('id="location-details"'));

    const resGame = await request(TEST_PORT, { path: '/popcorn-maths/game' });
    assert('/popcorn-maths/game renders #game-level-select difficulty dropdown', resGame.body.includes('id="game-level-select"'));
    assert('/popcorn-maths/game includes Little Kernels, Popping Poppers, and Mega Crunch bands',
      resGame.body.includes('Little Kernels') && resGame.body.includes('Popping Poppers') && resGame.body.includes('Mega Crunch'));

    assert('QUESTION_BANKS.kernels provides addition problems for ages 4-6', Array.isArray(QUESTION_BANKS.kernels) && QUESTION_BANKS.kernels.length >= 5);
    assert('QUESTION_BANKS.crunch provides mental arithmetic problems for ages 10-12', Array.isArray(QUESTION_BANKS.crunch) && QUESTION_BANKS.crunch.length >= 5);
    assert('getQuestionsByLevel and checkAnswer support multi-level banks',
      getQuestionsByLevel('kernels')[0].id === 'k1' && checkAnswer('k1', 7).isCorrect === true && checkAnswer('c1', 60).isCorrect === true);

    const gameClientJs = fs.readFileSync(path.join(__dirname, '../MyWebApp/src/main/webapp/js/game.js'), 'utf8');
    assert('Client game.js maintains zero persistent storage or network calls',
      !gameClientJs.includes('localStorage') && !gameClientJs.includes('document.cookie') && !gameClientJs.includes('fetch('));

    const resConcierge = await request(TEST_PORT, { path: '/services/concierge' });
    assert('/services/concierge renders #readiness-survey self-assessment', resConcierge.body.includes('id="readiness-survey"'));
    assert('/services/concierge renders #survey-result and #survey-apply-btn',
      resConcierge.body.includes('id="survey-result"') && resConcierge.body.includes('id="survey-apply-btn"'));

    const resBook = await request(TEST_PORT, { path: '/book' });
    assert('/book renders #consultation-checklist preparation section', resBook.body.includes('id="consultation-checklist"'));
    assert('/book renders #btn-print-checklist print action button', resBook.body.includes('id="btn-print-checklist"'));

    const styleCss = fs.readFileSync(path.join(__dirname, '../MyWebApp/src/main/webapp/css/style.css'), 'utf8');
    assert('style.css contains @media print semantic print stylesheet', styleCss.includes('@media print'));

    const mainJs = fs.readFileSync(path.join(__dirname, '../MyWebApp/src/main/webapp/js/main.js'), 'utf8');
    assert('main.js wires location directory, readiness survey, and print checklist',
      mainJs.includes('popcorn-location-select') && mainJs.includes('readiness-survey') && mainJs.includes('btn-print-checklist'));

    const formPages = ['/book', '/services/concierge', '/services/specialist-support', '/popcorn-maths/presenter', '/contact'];
    let allFormAriaLive = true;
    for (const fp of formPages) {
      const r = await request(TEST_PORT, { path: fp });
      if (!r.body.includes('aria-live="polite"')) allFormAriaLive = false;
    }
    assert('All 5 intake form pages include aria-live="polite" status regions', allFormAriaLive);

    const enhancedBodies = [resPopcorn.body, resGame.body, resConcierge.body, resBook.body];
    const hasUnsafeInlineOrExternal = enhancedBodies.some((html) => {
      const scripts = html.match(/<script\b[^>]*>([\s\S]*?)<\/script>/gi) || [];
      const badScript = scripts.some((tag) => !/src\s*=/i.test(tag) && tag.replace(/<\/?script[^>]*>/gi, '').trim().length > 0);
      const extAsset = /(?:src|href)=["']https?:\/\/[^"'>]+/i.test(html);
      return badScript || extAsset;
    });
    assert('Enhanced service pages introduce zero inline scripts or external asset hosts', !hasUnsafeInlineOrExternal);

    // --- GROUP 5: Feature Flag Toggle-Off & Graceful SIGTERM Shutdown (10) ---
    console.log('\n--- GROUP 5: Operator Feature Flags & Graceful SIGTERM Shutdown ---');
    config.popcornLocationDirectory = false;
    assert('Disabling popcornLocationDirectory hides location selector cleanly', !renderPopcornMathsPage().includes('id="popcorn-location-select"'));
    config.popcornLocationDirectory = true;
    assert('Re-enabling popcornLocationDirectory restores location selector', renderPopcornMathsPage().includes('id="popcorn-location-select"'));

    config.popcornGameMultiLevel = false;
    assert('Disabling popcornGameMultiLevel hides difficulty selector cleanly', !renderPopcornGamePage().includes('id="game-level-select"'));
    config.popcornGameMultiLevel = true;
    assert('Re-enabling popcornGameMultiLevel restores difficulty selector', renderPopcornGamePage().includes('id="game-level-select"'));

    config.conciergeReadinessSurvey = false;
    assert('Disabling conciergeReadinessSurvey hides readiness questionnaire cleanly', !renderConciergePage().includes('id="readiness-survey"'));
    config.conciergeReadinessSurvey = true;
    assert('Re-enabling conciergeReadinessSurvey restores readiness questionnaire', renderConciergePage().includes('id="readiness-survey"'));

    config.tutoringPrintableChecklist = false;
    assert('Disabling tutoringPrintableChecklist hides printable checklist cleanly', !renderBookPage().includes('id="consultation-checklist"'));
    config.tutoringPrintableChecklist = true;
    assert('Re-enabling tutoringPrintableChecklist restores printable checklist', renderBookPage().includes('id="consultation-checklist"'));

    const exitCode = await new Promise((resolve) => {
      serverProc.once('exit', (code) => resolve(code));
      serverProc.kill('SIGTERM');
    });
    assert('SIGTERM logs structured graceful_shutdown JSON event', serverLogs.includes('"event":"graceful_shutdown"') && serverLogs.includes('"signal":"SIGTERM"'));
    assert('Server drains sockets and exits with code 0 on SIGTERM', exitCode === 0);

    console.log('\n================================================================');
    console.log(`STAGE 5 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');
  } catch (err) {
    console.error('Fatal error in Stage 5 test suite:', err);
    failed++;
  } finally {
    if (faultProc) {
      try { faultProc.kill('SIGTERM'); } catch (_) {}
    }
    if (serverProc.exitCode === null) {
      try { serverProc.kill('SIGTERM'); } catch (_) {}
    }
    if (fs.existsSync(TEST_DIR)) {
      try { fs.rmSync(TEST_DIR, { recursive: true, force: true }); } catch (_) {}
    }
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runStage5Suite();
