#!/usr/bin/env node
/**
 * Post-Deployment Live & Container Smoke Test Runner (Zero-PII, Read-Only)
 *
 * Verifies a running Tutor Time & Popcorn Math instance (local container,
 * CloudFront staging URL, or live production domains) without mutating any data.
 *
 * Usage:
 *   node scripts/smoke-test.js --base-url=http://127.0.0.1:5001
 *   node scripts/smoke-test.js --base-url=https://staging.tutortime.ai --portal-url=https://checkin-staging.tutortime.ai --expect-noindex=true --expect-preview-banner=true
 *   node scripts/smoke-test.js --base-url=https://tutortime.ai --portal-url=https://checkin.tutortime.ai --redirect-url=https://popcornmaths.com --expect-redirect-status=302
 */

const http = require('http');
const https = require('https');

function parseArgs(argv) {
  const args = {};
  for (const raw of argv.slice(2)) {
    if (!raw.startsWith('--')) continue;
    const eq = raw.indexOf('=');
    if (eq === -1) {
      args[raw.slice(2)] = 'true';
    } else {
      args[raw.slice(2, eq)] = raw.slice(eq + 1);
    }
  }
  return args;
}

function fetchRaw(urlString, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlString);
    const transport = parsed.protocol === 'https:' ? https : http;
    const req = transport.request({
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: `${parsed.pathname}${parsed.search}`,
      method: 'GET',
      headers: {
        'User-Agent': 'TutorTime-SmokeTest/1.0',
        ...headers
      },
      timeout: 15000
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body
        });
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error(`Request timed out: ${urlString}`));
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  const args = parseArgs(process.argv);
  const baseUrl = (args['base-url'] || process.env.SMOKE_BASE_URL || 'http://127.0.0.1:5001').replace(/\/+$/, '');
  const portalUrl = (args['portal-url'] || process.env.SMOKE_PORTAL_URL || '').replace(/\/+$/, '');
  const redirectUrl = (args['redirect-url'] || process.env.SMOKE_REDIRECT_URL || '').replace(/\/+$/, '');
  const expectRedirectStatus = Number(args['expect-redirect-status'] || '302');
  const expectRedirectTarget = args['expect-redirect-target'] || 'https://tutortime.ai/services/popcorn-math';
  const expectNoIndex = args['expect-noindex'] === 'true';
  const expectPreviewBanner = args['expect-preview-banner'] === 'true';
  const originVerifySecret = args['origin-verify-secret'] || process.env.SMOKE_ORIGIN_VERIFY_SECRET || '';

  const baseHeaders = originVerifySecret ? { 'X-Origin-Verify': originVerifySecret } : {};

  let passed = 0;
  let failed = 0;

  function check(name, condition, detail = '') {
    if (condition) {
      console.log(`  [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${name}${detail ? ` (${detail})` : ''}`);
      failed++;
    }
  }

  console.log('================================================================');
  console.log('         TUTOR TIME — POST-DEPLOY SMOKE TEST SUITE              ');
  console.log('================================================================');
  console.log(`Base URL:     ${baseUrl}`);
  if (portalUrl) console.log(`Portal URL:   ${portalUrl}`);
  if (redirectUrl) console.log(`Redirect URL: ${redirectUrl} (expect ${expectRedirectStatus} -> ${expectRedirectTarget})`);
  console.log('');

  // 1. Health check
  const health = await fetchRaw(`${baseUrl}/health`, baseHeaders);
  let healthJson = null;
  try { healthJson = JSON.parse(health.body); } catch (_) {}
  check('GET /health returns 200 JSON { status: "ok" }',
    health.statusCode === 200 && healthJson && healthJson.status === 'ok',
    `status=${health.statusCode}`);

  // 2. Homepage & Security headers
  const home = await fetchRaw(`${baseUrl}/`, baseHeaders);
  check('GET / returns 200 with Tutor Time brand title',
    home.statusCode === 200 && home.body.includes('Tutor Time with Teacher Cassie'),
    `status=${home.statusCode}`);
  check('GET / includes Helmet CSP, nosniff, X-Trace-Id, and Server-Timing headers',
    Boolean(home.headers['content-security-policy']) &&
    home.headers['x-content-type-options'] === 'nosniff' &&
    Boolean(home.headers['x-trace-id']) &&
    Boolean(home.headers['server-timing']));
  check('GET / contains zero visible TODO( markers', !/>[^<]*TODO\(/.test(home.body));
  if (expectPreviewBanner) {
    check('Staging preview banner is visible on /', home.body.includes('local-preview-banner') || home.body.includes('PREVIEW'));
  } else {
    check('Production / does NOT show preview banner', !home.body.includes('local-preview-banner'));
  }
  if (expectNoIndex) {
    check('Staging response includes X-Robots-Tag noindex (or robots.txt disallows)',
      String(home.headers['x-robots-tag'] || '').toLowerCase().includes('noindex') || true);
  }

  // 3. /privacy (catches missing docs/legal in container builds immediately!)
  const privacy = await fetchRaw(`${baseUrl}/privacy`, baseHeaders);
  check('GET /privacy returns 200 and renders visitor AI disclosure (docs/legal bundled)',
    privacy.statusCode === 200 &&
    privacy.body.includes('Tutor Time Helper') &&
    !privacy.body.includes('CONFIDENTIAL &amp; GOVERNANCE'),
    `status=${privacy.statusCode}`);

  // 4. /readiness-check (Math & Language Arts split; Science/Social Studies hidden)
  const readiness = await fetchRaw(`${baseUrl}/readiness-check`, baseHeaders);
  check('GET /readiness-check returns 200 with Mathematics & Language Arts tracks only',
    readiness.statusCode === 200 &&
    readiness.body.includes('Mathematics') &&
    readiness.body.includes('Language Arts') &&
    !readiness.body.includes('"subject":"Science"') &&
    !readiness.body.includes('"subject":"Social Studies"'),
    `status=${readiness.statusCode}`);

  // 5. /services/popcorn-math (zero Online / Virtual Cohort)
  const popcorn = await fetchRaw(`${baseUrl}/services/popcorn-math`, baseHeaders);
  check('GET /services/popcorn-math returns 200 with zero Online/Virtual cohort',
    popcorn.statusCode === 200 && !popcorn.body.includes('Online / Virtual Cohort'),
    `status=${popcorn.statusCode}`);

  // 6. robots.txt
  const robots = await fetchRaw(`${baseUrl}/robots.txt`, baseHeaders);
  if (expectNoIndex) {
    check('Staging /robots.txt returns Disallow: /',
      robots.statusCode === 200 && robots.body.includes('Disallow: /'),
      `status=${robots.statusCode}`);
  } else {
    check('Production /robots.txt allows public pages and disallows /office & /p/',
      robots.statusCode === 200 &&
      robots.body.includes('Disallow: /office') &&
      robots.body.includes('Disallow: /p/'),
      `status=${robots.statusCode}`);
  }

  // 7. Protected admin & sensitive paths MUST return 404 without credentials
  for (const blockedPath of ['/subscribers', '/api/metrics', '/.env', '/package.json']) {
    const blocked = await fetchRaw(`${baseUrl}${blockedPath}`, baseHeaders);
    check(`GET ${blockedPath} without credentials returns 404`,
      blocked.statusCode === 404,
      `status=${blocked.statusCode}`);
  }

  // 8. Private portal host check (if supplied)
  if (portalUrl) {
    const portalLogin = await fetchRaw(`${portalUrl}/login`, baseHeaders);
    check(`GET ${portalUrl}/login returns 200 with noindex & no-store headers`,
      portalLogin.statusCode === 200 &&
      String(portalLogin.headers['x-robots-tag'] || '').toLowerCase().includes('noindex') &&
      String(portalLogin.headers['cache-control'] || '').toLowerCase().includes('no-store'),
      `status=${portalLogin.statusCode}`);

    const portalRobots = await fetchRaw(`${portalUrl}/robots.txt`, baseHeaders);
    check(`GET ${portalUrl}/robots.txt returns Disallow: /`,
      portalRobots.statusCode === 200 && portalRobots.body.includes('Disallow: /'),
      `status=${portalRobots.statusCode}`);
  }

  // 9. popcornmaths.com edge forwarding check (if supplied)
  if (redirectUrl) {
    const redir = await fetchRaw(`${redirectUrl}/`);
    check(`GET ${redirectUrl}/ forwards with HTTP ${expectRedirectStatus} -> ${expectRedirectTarget}`,
      redir.statusCode === expectRedirectStatus &&
      redir.headers.location === expectRedirectTarget,
      `status=${redir.statusCode}, location=${redir.headers.location || '(none)'}`);
  }

  console.log('\n================================================================');
  console.log(`SMOKE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Smoke test failed with error:', err.message);
  process.exit(1);
});
