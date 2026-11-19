/**
 * Phase 2 - Legal Routes Verification (/privacy and /terms)
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const TEST_PORT = 5025;
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

function httpGet(urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:${TEST_PORT}${urlPath}`, (res) => {
      let body = '';
      res.on('data', chunk => (body += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
  });
}

async function run() {
  console.log('================================================================');
  console.log('       PHASE 2 - LEGAL ROUTES VERIFICATION (/privacy, /terms)   ');
  console.log('================================================================\n');

  const serverProc = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(TEST_PORT), NODE_ENV: 'test' },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Server startup timeout')), 8000);
    serverProc.stdout.on('data', (d) => {
      if (d.toString().includes(`localhost:${TEST_PORT}`)) {
        clearTimeout(timer);
        resolve();
      }
    });
  });

  try {
    const privacy = await httpGet('/privacy');
    assert('GET /privacy returns HTTP 200', privacy.status === 200, `got ${privacy.status}`);
    assert('/privacy displays "Draft, pending review" banner', privacy.body.includes('Draft, pending review'));
    assert('/privacy preserves data-todo="legal" markers', privacy.body.includes('data-todo="legal"'));
    assert('/privacy renders visitor-facing Chatbot Privacy wording', privacy.body.includes('Tutor Time Helper') && privacy.body.includes('Zero Personal Data Collection'));
    assert('/privacy does NOT expose internal governance/audit docs', !privacy.body.includes('CONFIDENTIAL &amp; GOVERNANCE') && !privacy.body.includes('awsDriver.js') && !privacy.body.includes('TO CONFIRM WITH COUNSEL'));

    const terms = await httpGet('/terms');
    assert('GET /terms returns HTTP 200', terms.status === 200, `got ${terms.status}`);
    assert('/terms displays "Draft, pending review" banner', terms.body.includes('Draft, pending review'));
    assert('/terms preserves data-todo="legal" markers', terms.body.includes('data-todo="legal"'));
    assert('/terms displays neutral "Terms of Use coming soon" notice', terms.body.includes('Terms of Use coming soon'));
    assert('/terms does NOT expose internal inventory or ClickUp IDs', !terms.body.includes('Policy Document Inventory') && !terms.body.includes('ClickUp') && !terms.body.includes('CONFIDENTIAL'));
  } finally {
    serverProc.kill();
  }

  console.log('\n================================================================');
  console.log(`LEGAL ROUTES TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
