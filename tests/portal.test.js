/**
 * Isolated Automated Test Suite for Kashamar's Private Portal
 * Covers: Billing Math, Token Isolation, Auth/CSRF/Rate Limiting, SEO Exclusion, and SES Sandbox Blocking.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');

// Isolate local portal storage in temp directory
const tempDir = path.join(__dirname, 'temp_portal_test');
fs.rmSync(tempDir, { recursive: true, force: true });
fs.mkdirSync(tempDir, { recursive: true });
process.env.PORTAL_DATA_FILE = path.join(tempDir, 'portal-test.json');
process.env.ALLOW_INSECURE_LOCAL_COOKIE = 'true';
process.env.PORTAL_LOGIN_RATE_LIMIT_MAX = '3';

const { LocalPortalStore } = require('../src/portal/portalStore');
const {
  isStatusBillable,
  computeAttendancePrice,
  computeStudentMonthSummary,
  computeMonthInvoices,
  buildCsvExport
} = require('../src/portal/billing');
const { ensureKashamarSeeded } = require('../src/portal/auth');
const { PortalEmailService } = require('../src/portal/emailService');
const { createPortalRouters, isCheckinHost } = require('../src/portal/router');

let passed = 0;
let failed = 0;

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed++;
      console.log(`  ✓ ${name}`);
    })
    .catch((err) => {
      failed++;
      console.error(`  ✗ FAIL: ${name}\n    ${err.stack || err.message}`);
    });
}

function request(server, method, reqPath, { headers = {}, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const opts = {
      hostname: '127.0.0.1',
      port: addr.port,
      path: reqPath,
      method,
      headers: { ...headers }
    };
    if (body !== null && !opts.headers['Content-Type']) {
      opts.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      opts.headers['Content-Length'] = Buffer.byteLength(body);
    }
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (body !== null) req.write(body);
    req.end();
  });
}

function extractCookie(setCookieHeader) {
  if (!setCookieHeader) return '';
  const arr = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  return arr.map(c => c.split(';')[0]).join('; ');
}

function extractCsrf(html) {
  const m = html.match(/name="_csrf"\s+value="([^"]+)"/);
  return m ? m[1] : '';
}

async function run() {
  console.log('\n================================================================');
  console.log('       PRIVATE PORTAL AUTOMATED TEST SUITE (ISOLATED)');
  console.log('================================================================\n');

  // --- GROUP 1: Billing Math ---
  console.log('--- 1. Billing Math ---');
  await test('Present bills pricePerSession; absent & cancelled bill $0', () => {
    assert.strictEqual(isStatusBillable('present', { lateIsBillable: true }), true);
    assert.strictEqual(isStatusBillable('absent', { lateIsBillable: true }), false);
    assert.strictEqual(isStatusBillable('cancelled', { lateIsBillable: true }), false);
    assert.strictEqual(computeAttendancePrice('present', 42.5, { lateIsBillable: true }), 42.5);
    assert.strictEqual(computeAttendancePrice('absent', 42.5, { lateIsBillable: true }), 0);
    assert.strictEqual(computeAttendancePrice('cancelled', 42.5, { lateIsBillable: true }), 0);
  });

  await test('Late is billable by default and respects lateIsBillable=false', () => {
    assert.strictEqual(isStatusBillable('late', {}), true);
    assert.strictEqual(computeAttendancePrice('late', 55, { lateIsBillable: true }), 55);
    assert.strictEqual(isStatusBillable('late', { lateIsBillable: false }), false);
    assert.strictEqual(computeAttendancePrice('late', 55, { lateIsBillable: false }), 0);
  });

  await test('Month invoice totals compute accurately from records without float drift', () => {
    const students = [
      { studentId: 's1', name: 'Alice', parentName: 'Pat', parentEmail: 'pat@example.com', pricePerSession: 33.33, archived: false },
      { studentId: 's2', name: 'Bob', parentName: 'Sam', parentEmail: 'sam@example.com', pricePerSession: 45.00, archived: false }
    ];
    const records = [
      { studentId: 's1', date: '2026-11-02', month: '2026-11', status: 'present', billable: true, priceApplied: 33.33 },
      { studentId: 's1', date: '2026-11-04', month: '2026-11', status: 'late', billable: true, priceApplied: 33.33 },
      { studentId: 's1', date: '2026-11-06', month: '2026-11', status: 'absent', billable: false, priceApplied: 0 },
      { studentId: 's2', date: '2026-11-03', month: '2026-11', status: 'present', billable: true, priceApplied: 45.00 },
      { studentId: 's2', date: '2026-11-05', month: '2026-11', status: 'cancelled', billable: false, priceApplied: 0 }
    ];
    const inv = computeMonthInvoices(students, records, { lateIsBillable: true }, '2026-11');
    assert.strictEqual(inv.totalBillableSessions, 3);
    assert.strictEqual(inv.grandTotal, 111.66);
    const s1Summary = computeStudentMonthSummary(students[0], records, { lateIsBillable: true });
    assert.strictEqual(s1Summary.totalAmount, 66.66);
    assert.strictEqual(s1Summary.billableCount, 2);
    const csv = buildCsvExport(students, records, '2026-11');
    assert.ok(csv.includes('Alice'));
    assert.ok(csv.includes('33.33'));
  });

  // --- GROUP 2: SES Sandbox Blocking ---
  console.log('\n--- 2. SES Sandbox Blocking & Logging ---');
  await test('SES sandbox blocks unverified email cleanly without crashing and logs BLOCKED_SANDBOX', async () => {
    const store = new LocalPortalStore();
    let sendCalled = false;
    const mockSes = {
      async send(cmd) {
        const name = cmd.constructor.name;
        if (name === 'GetAccountCommand') {
          return { ProductionAccessEnabled: false };
        }
        if (name === 'GetEmailIdentityCommand') {
          if (cmd.input.EmailIdentity === 'verified@example.com') {
            return { VerificationStatus: 'SUCCESS' };
          }
          return { VerificationStatus: 'PENDING' };
        }
        if (name === 'SendEmailCommand') {
          sendCalled = true;
          return { MessageId: 'msg-12345' };
        }
        throw new Error('Unexpected command: ' + name);
      }
    };

    const emailSvc = new PortalEmailService({ sesClient: mockSes });
    const settings = {
      senderEmail: 'noreply@mail.tutortime.ai',
      replyToEmail: 'Cassie@tutortime.ai',
      tutorDisplayName: 'Teacher Cassie',
      sendParentEmails: true
    };

    const blockedRes = await emailSvc.sendAttendanceNotice({
      store,
      student: { studentId: 's1', name: 'Alice', parentName: 'Pat', parentEmail: 'unverified@example.com' },
      record: { date: '2026-11-19', month: '2026-11', status: 'present', note: 'Great work' },
      settings,
      parentLink: 'https://checkin.tutortime.ai/p/tok123'
    });

    assert.strictEqual(blockedRes.status, 'BLOCKED_SANDBOX');
    assert.strictEqual(sendCalled, false);

    const sentRes = await emailSvc.sendAttendanceNotice({
      store,
      student: { studentId: 's2', name: 'Bob', parentName: 'Sam', parentEmail: 'verified@example.com' },
      record: { date: '2026-11-19', month: '2026-11', status: 'present', note: '' },
      settings,
      parentLink: 'https://checkin.tutortime.ai/p/tok456'
    });

    assert.strictEqual(sentRes.status, 'SENT');
    assert.strictEqual(sentRes.messageId, 'msg-12345');
    assert.strictEqual(sendCalled, true);

    const logs = await store.listEmailLogs('2026-11');
    assert.strictEqual(logs.length, 2);
    assert.ok(logs.some(l => l.status === 'BLOCKED_SANDBOX' && l.recipientEmail === 'unverified@example.com'));
    assert.ok(logs.some(l => l.status === 'SENT' && l.messageId === 'msg-12345'));
  });

  // --- GROUP 3: HTTP Integration (Auth, CSRF, Rate Limit, Token Isolation, Host Routing) ---
  console.log('\n--- 3. Auth, CSRF, Rate Limit & Token Isolation ---');
  // Reset portal test file for clean HTTP integration
  fs.rmSync(process.env.PORTAL_DATA_FILE, { force: true });
  const store = new LocalPortalStore();
  const seed = await ensureKashamarSeeded(store);
  assert.strictEqual(seed.created, true);
  assert.ok(seed.tempPassword && seed.tempPassword.length >= 16);

  const mockSandboxSes = {
    async send(cmd) {
      if (cmd.constructor.name === 'GetAccountCommand') return { ProductionAccessEnabled: false };
      if (cmd.constructor.name === 'GetEmailIdentityCommand') return { VerificationStatus: 'NOT_STARTED' };
      throw new Error('Should not send in sandbox');
    }
  };
  const emailSvc = new PortalEmailService({ sesClient: mockSandboxSes });

  const app = express();
  const { officeRouter, parentRouter } = createPortalRouters({ store, emailService: emailSvc });
  app.use('/p', parentRouter);
  app.use('/office', officeRouter);
  app.use((req, res, next) => {
    if (isCheckinHost(req)) return officeRouter(req, res, next);
    next();
  });

  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });

  try {
    let cookie = '';
    let csrf = '';

    await test('Unauthenticated /office redirects to /office/login with noindex header', async () => {
      const res = await request(server, 'GET', '/office');
      assert.strictEqual(res.status, 302);
      assert.strictEqual(res.headers.location, '/office/login');
      assert.ok(String(res.headers['x-robots-tag']).includes('noindex'));
    });

    await test('Host checkin.tutortime.ai routes / directly to portal', async () => {
      const res = await request(server, 'GET', '/', { headers: { Host: 'checkin.tutortime.ai' } });
      assert.strictEqual(res.status, 302);
      assert.strictEqual(res.headers.location, '/login');
    });

    await test('First login with temp password forces password change before accessing /office', async () => {
      const loginBody = new URLSearchParams({ username: 'kashamar', password: seed.tempPassword }).toString();
      const loginRes = await request(server, 'POST', '/office/login', { body: loginBody });
      assert.strictEqual(loginRes.status, 302);
      assert.strictEqual(loginRes.headers.location, '/office/change-password');
      cookie = extractCookie(loginRes.headers['set-cookie']);
      assert.ok(cookie.includes('tt_portal_session='));

      // Trying to skip to /office redirects back to /office/change-password
      const skipRes = await request(server, 'GET', '/office', { headers: { Cookie: cookie } });
      assert.strictEqual(skipRes.status, 302);
      assert.strictEqual(skipRes.headers.location, '/office/change-password');

      const cpPage = await request(server, 'GET', '/office/change-password', { headers: { Cookie: cookie } });
      assert.strictEqual(cpPage.status, 200);
      csrf = extractCsrf(cpPage.body);
      assert.ok(csrf.length > 10);

      const cpBody = new URLSearchParams({
        _csrf: csrf,
        newPassword: 'CassieStrongPassword2026!',
        confirmPassword: 'CassieStrongPassword2026!'
      }).toString();
      const cpPost = await request(server, 'POST', '/office/change-password', {
        headers: { Cookie: cookie },
        body: cpBody
      });
      assert.strictEqual(cpPost.status, 302);
      assert.strictEqual(cpPost.headers.location, '/office');
    });

    await test('CSRF protection rejects POST without valid _csrf token with HTTP 403', async () => {
      const badBody = new URLSearchParams({
        _csrf: 'invalid-csrf-token',
        name: 'Hacker Kid',
        parentName: 'Evil',
        parentEmail: 'evil@example.com',
        pricePerSession: '50'
      }).toString();
      const res = await request(server, 'POST', '/office/students', {
        headers: { Cookie: cookie },
        body: badBody
      });
      assert.strictEqual(res.status, 403);
    });

    await test('Add two students, mark attendance (shows sandbox warning), and verify parent token isolation', async () => {
      for (const s of [
        { name: 'Maya Lin', parentName: 'Grace Lin', parentEmail: 'grace@example.com', pricePerSession: '60' },
        { name: 'Leo King', parentName: 'Mark King', parentEmail: 'mark@example.com', pricePerSession: '40' }
      ]) {
        const res = await request(server, 'POST', '/office/students', {
          headers: { Cookie: cookie },
          body: new URLSearchParams({ _csrf: csrf, ...s }).toString()
        });
        assert.strictEqual(res.status, 302);
      }

      const students = await store.listStudents();
      assert.strictEqual(students.length, 2);
      const maya = students.find(s => s.name === 'Maya Lin');
      const leo = students.find(s => s.name === 'Leo King');

      // Mark Maya present (triggers mocked sandbox SES -> warning in redirect)
      const attRes = await request(server, 'POST', '/office/attendance', {
        headers: { Cookie: cookie },
        body: new URLSearchParams({
          _csrf: csrf,
          date: '2026-11-19',
          month: '2026-11',
          studentId: maya.studentId,
          status: 'present',
          note: 'Fractions mastery'
        }).toString()
      });
      assert.strictEqual(attRes.status, 302);
      assert.ok(attRes.headers.location.includes('type=warning'));

      // Parent link for Maya shows Maya ONLY, never Leo
      const mayaPage = await request(server, 'GET', `/p/${maya.parentToken}?month=2026-11`);
      assert.strictEqual(mayaPage.status, 200);
      assert.ok(mayaPage.body.includes('Maya Lin'));
      assert.ok(mayaPage.body.includes('Fractions mastery'));
      assert.ok(!mayaPage.body.includes('Leo King'));
      assert.ok(String(mayaPage.headers['x-robots-tag']).includes('noindex'));

      // Parent link for Leo shows Leo ONLY, never Maya
      const leoPage = await request(server, 'GET', `/p/${leo.parentToken}?month=2026-11`);
      assert.strictEqual(leoPage.status, 200);
      assert.ok(leoPage.body.includes('Leo King'));
      assert.ok(!leoPage.body.includes('Maya Lin'));

      // Invalid token returns 404
      const invalidPage = await request(server, 'GET', '/p/nonexistent-token-1234567890');
      assert.strictEqual(invalidPage.status, 404);

      // Regenerating Maya's token invalidates the old token immediately
      const oldToken = maya.parentToken;
      const regenRes = await request(server, 'POST', `/office/students/${maya.studentId}/regenerate-token`, {
        headers: { Cookie: cookie },
        body: new URLSearchParams({ _csrf: csrf }).toString()
      });
      assert.strictEqual(regenRes.status, 302);

      const oldTokenRes = await request(server, 'GET', `/p/${oldToken}`);
      assert.strictEqual(oldTokenRes.status, 404);

      const updatedMaya = await store.getStudent(maya.studentId);
      const newTokenRes = await request(server, 'GET', `/p/${updatedMaya.parentToken}?month=2026-11`);
      assert.strictEqual(newTokenRes.status, 200);
    });

    await test('QuickSchools Roll-Call batch save, Student Profile tabs, and isolated Homework/Mastery notes', async () => {
      const students = await store.listStudents();
      const maya = students.find(s => s.name === 'Maya Lin');
      const leo = students.find(s => s.name === 'Leo King');

      // Roll call page renders
      const rcPage = await request(server, 'GET', '/office/attendance?date=2026-11-20&month=2026-11', {
        headers: { Cookie: cookie }
      });
      assert.strictEqual(rcPage.status, 200);
      assert.ok(rcPage.body.includes('Roll-Call Attendance'));

      // Batch roll call save
      const batchParams = new URLSearchParams({
        _csrf: csrf,
        date: '2026-11-20',
        month: '2026-11',
        skipEmail: '1',
        [`status_${maya.studentId}`]: 'late',
        [`note_${maya.studentId}`]: 'Arrived 10m late',
        [`status_${leo.studentId}`]: 'absent',
        [`note_${leo.studentId}`]: 'Sick day'
      });
      const batchRes = await request(server, 'POST', '/office/attendance/batch', {
        headers: { Cookie: cookie },
        body: batchParams.toString()
      });
      assert.strictEqual(batchRes.status, 302);
      assert.ok(batchRes.headers.location.includes('/office/attendance'));

      const novRecords = await store.listAttendanceByMonth('2026-11');
      const mayaNov20 = novRecords.find(r => r.date === '2026-11-20' && r.studentId === maya.studentId);
      const leoNov20 = novRecords.find(r => r.date === '2026-11-20' && r.studentId === leo.studentId);
      assert.strictEqual(mayaNov20.billable, true);
      assert.strictEqual(leoNov20.billable, false);

      // Student profile & Homework/Mastery note
      const profPage = await request(server, 'GET', `/office/students/${maya.studentId}?tab=progress`, {
        headers: { Cookie: cookie }
      });
      assert.strictEqual(profPage.status, 200);
      assert.ok(profPage.body.includes('Homework &amp; Mastery'));

      const progRes = await request(server, 'POST', `/office/students/${maya.studentId}/progress`, {
        headers: { Cookie: cookie },
        body: new URLSearchParams({
          _csrf: csrf,
          date: '2026-11-20',
          topic: 'Long Division',
          mastery: '9/10',
          homework: 'Practice sheet B'
        }).toString()
      });
      assert.strictEqual(progRes.status, 302);

      // Verify progress note appears ONLY on Maya's parent link, NEVER on Leo's
      const mayaParent = await request(server, 'GET', `/p/${maya.parentToken}?month=2026-11`);
      assert.ok(mayaParent.body.includes('Long Division'));
      assert.ok(mayaParent.body.includes('Practice sheet B'));

      const leoParent = await request(server, 'GET', `/p/${leo.parentToken}?month=2026-11`);
      assert.ok(!leoParent.body.includes('Long Division'));
      assert.ok(!leoParent.body.includes('Practice sheet B'));
    });

    await test('Login rate limiter returns HTTP 429 after repeated failed attempts', async () => {
      const badLogin = new URLSearchParams({ username: 'kashamar', password: 'wrong-password' }).toString();
      for (let i = 0; i < 3; i++) {
        const r = await request(server, 'POST', '/office/login', { body: badLogin });
        assert.strictEqual(r.status, 401);
      }
      const blocked = await request(server, 'POST', '/office/login', { body: badLogin });
      assert.strictEqual(blocked.status, 429);
    });
  } finally {
    server.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  console.log('\n================================================================');
  console.log(`PORTAL TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
