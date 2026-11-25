/**
 * Phase 2 - Task 1: Local Test Environment & Viewport Automated Verification
 */

const http = require('http');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let chromium;
try {
  // Use global playwright if available
  chromium = require('playwright').chromium;
} catch (_) {
  try {
    const globalPlaywrightPath = path.join('/home/ubuntu/.nvm/versions/node/v24.19.0/lib/node_modules/playwright');
    chromium = require(globalPlaywrightPath).chromium;
  } catch (err) {
    console.log('[Notice] Playwright not found in local path, skipping headless browser test:', err.message);
  }
}

const TEST_PORT = 5020;
const TEST_DIR = path.join(__dirname, 'temp_phase2_env');
const TEST_DATA_DIR = path.join(TEST_DIR, 'data');
const TEST_SUBSCRIBERS_FILE = path.join(TEST_DIR, 'subscribers.json');

if (fs.existsSync(TEST_DIR)) {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(TEST_DATA_DIR, { recursive: true });

function request(port, options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({ port, host: '127.0.0.1', ...options }, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch (_) {}
        resolve({ statusCode: res.statusCode, headers: res.headers, body, json });
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

function waitForServer(port, maxRetries = 30) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const check = () => {
      http.get(`http://127.0.0.1:${port}/health`, (res) => {
        if (res.statusCode === 200) return resolve();
        retry();
      }).on('error', retry);
    };
    const retry = () => {
      retries++;
      if (retries >= maxRetries) {
        reject(new Error(`Server failed to start on port ${port}`));
      } else {
        setTimeout(check, 200);
      }
    };
    check();
  });
}

let passed = 0;
let failed = 0;
function assert(name, condition, details = '') {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${name} ${details}`);
    failed++;
  }
}

async function run() {
  console.log('================================================================');
  console.log('       PHASE 2 - TASK 1: LOCAL ENVIRONMENT & VIEWPORTS          ');
  console.log('================================================================');

  const serverProc = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      PORT: String(TEST_PORT),
      NODE_ENV: 'development',
      STORAGE_DRIVER: 'local',
      DATA_DIR: TEST_DATA_DIR,
      SUBSCRIBERS_DB_FILE: TEST_SUBSCRIBERS_FILE,
      SHOW_LOCAL_PREVIEW_BANNER: 'true',
      SITE_URL: 'https://test-preview.tutortime.ai'
    },
    stdio: ['ignore', 'ignore', 'ignore']
  });

  try {
    await waitForServer(TEST_PORT);

    console.log('\n--- 1. Local Preview Banner & Config ---');
    const homeRes = await request(TEST_PORT, { path: '/' });
    assert('Homepage returns HTTP 200', homeRes.statusCode === 200);
    assert('Local preview banner renders when enabled', homeRes.body.includes('class="local-preview-banner"'));
    assert('Local preview banner has accessible role="status"', homeRes.body.includes('role="status"'));

    console.log('\n--- 2. SITE_URL Environment Variable Resolution ---');
    const robotsRes = await request(TEST_PORT, { path: '/robots.txt' });
    assert('robots.txt points to configured SITE_URL', robotsRes.body.includes('Sitemap: https://test-preview.tutortime.ai/sitemap.xml'));

    const sitemapRes = await request(TEST_PORT, { path: '/sitemap.xml' });
    assert('sitemap.xml uses configured SITE_URL', sitemapRes.body.includes('<loc>https://test-preview.tutortime.ai/</loc>'));

    assert('Rendered HTML canonical og:url uses configured SITE_URL', homeRes.body.includes('property="og:url" content="https://test-preview.tutortime.ai/"'));

    console.log('\n--- 3. Multi-Device Viewport Audit (360px, 768px, 1200px) ---');
    if (chromium) {
      const browser = await chromium.launch();
      for (const width of [360, 768, 1200]) {
        const page = await browser.newPage();
        await page.setViewportSize({ width, height: 800 });
        await page.goto(`http://127.0.0.1:${TEST_PORT}/`);
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        assert(`Viewport ${width}px has no horizontal overflow (scrollWidth: ${scrollWidth})`, scrollWidth <= width);
        await page.close();
      }
      await browser.close();
    } else {
      console.log('  [SKIP] Playwright browser not available in this environment');
    }

  } finally {
    serverProc.kill('SIGTERM');
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  }

  console.log('\n================================================================');
  console.log(`TASK 1 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
