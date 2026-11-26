/**
 * Local Completion Tests — Item 1: Consultation Results & Privacy-Scoped Form Notifications to Cassie
 * Uses 100% mock email driver & injected mock SES client — zero real emails or AWS calls.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const express = require('express');
const http = require('http');

const {
  resolveEmailDriver,
  resolveNotificationRecipient,
  buildFormNotificationEmail,
  sendFormNotification,
  setSesClientForTests,
  setTransportForTests,
  getMockOutbox,
  clearMockOutbox
} = require('../src/shared/email/formNotificationService');
const { validateConsultationForm, validateReadinessSummary } = require('../src/shared/forms/validators');
const { renderBookPage } = require('../src/shared/templates/pages');

let passed = 0;
let failed = 0;

function check(name, condition, details = '') {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${name} ${details}`);
    failed++;
  }
}

function httpPostJson(server, reqPath, payload) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const body = JSON.stringify(payload);
    const req = http.request({
      hostname: '127.0.0.1',
      port: addr.port,
      path: reqPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (_) {}
        resolve({ status: res.statusCode, body: data, json });
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function run() {
  console.log('================================================================');
  console.log('   ITEM 1 VERIFICATION: CASSIE BOOKING & FORM NOTIFICATIONS     ');
  console.log('================================================================\n');

  const savedEnv = { ...process.env };
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tt-item1-test-'));

  try {
    // --- 1. Email Driver Independence from STORAGE_DRIVER ---
    console.log('--- 1. Email Driver & Recipient Resolution ---');
    process.env.STORAGE_DRIVER = 'aws';
    process.env.EMAIL_DRIVER = 'mock';
    check('EMAIL_DRIVER=mock overrides STORAGE_DRIVER=aws', resolveEmailDriver() === 'mock');

    process.env.STORAGE_DRIVER = 'local';
    process.env.EMAIL_DRIVER = 'ses';
    check('EMAIL_DRIVER=ses overrides STORAGE_DRIVER=local', resolveEmailDriver() === 'ses');

    delete process.env.EMAIL_DRIVER;
    process.env.STORAGE_DRIVER = 'local';
    check('Unset EMAIL_DRIVER with STORAGE_DRIVER=local defaults to mock', resolveEmailDriver() === 'mock');

    process.env.CASSIE_NOTIFICATION_EMAIL = 'Cassie@tutortime.ai';
    process.env.ADMIN_NOTIFICATION_EMAIL = 'admin@example.invalid';
    check('CASSIE_NOTIFICATION_EMAIL takes precedence over ADMIN_NOTIFICATION_EMAIL',
      resolveNotificationRecipient() === 'Cassie@tutortime.ai');

    delete process.env.CASSIE_NOTIFICATION_EMAIL;
    check('Falls back to ADMIN_NOTIFICATION_EMAIL when CASSIE_NOTIFICATION_EMAIL is unset',
      resolveNotificationRecipient() === 'admin@example.invalid');

    // Verify EMAIL_DRIVER=ses uses injected SES client even when STORAGE_DRIVER=local
    process.env.STORAGE_DRIVER = 'local';
    process.env.EMAIL_DRIVER = 'ses';
    process.env.CASSIE_NOTIFICATION_EMAIL = 'Cassie@tutortime.ai';
    process.env.SENDER_EMAIL = 'noreply@tutortime.example';
    const capturedSes = [];
    setSesClientForTests({
      send: async (cmd) => {
        capturedSes.push(cmd);
        return { MessageId: 'mock-ses-id-001' };
      }
    });
    const sesResult = await sendFormNotification('book-consultation', {
      id: 'rec-ses-1',
      parentName: 'Alice Parent',
      email: 'alice@example.invalid',
      phone: '+12645550101',
      serviceInterest: 'One-on-One Tutoring',
      studentYearGroup: 'Upper Primary',
      additionalNotes: 'Help with fractions'
    });
    check('EMAIL_DRIVER=ses dispatches to SESv2 client even with STORAGE_DRIVER=local',
      sesResult.success === true && sesResult.driver === 'ses' && capturedSes.length === 1);
    check('SES recipient is CASSIE_NOTIFICATION_EMAIL with parent Reply-To',
      capturedSes[0].input.Destination.ToAddresses[0] === 'Cassie@tutortime.ai' &&
      capturedSes[0].input.ReplyToAddresses[0] === 'alice@example.invalid');
    setSesClientForTests(null);

    // --- 2. Full Escaped Fields & Privacy Limits Across All 7 Forms ---
    console.log('\n--- 2. Email Content, Escaping & Per-Form Privacy Limits ---');

    const bookingMail = buildFormNotificationEmail('book-consultation', {
      id: 'bk-101',
      createdAt: '2026-11-26T10:00:00.000Z',
      parentName: 'Jane <script>alert(1)</script> Doe',
      email: 'jane@example.invalid',
      phone: '+1 264 555 0102',
      serviceInterest: 'One-on-One Tutoring',
      studentYearGroup: 'Upper Primary',
      additionalNotes: 'Needs help with <b>fractions</b> & decimals',
      readinessSummary: {
        subject: 'Mathematics',
        score: 4,
        total: 10,
        band: 'Just Starting',
        recommendedService: 'One-on-One Tutoring'
      }
    });
    check('book-consultation HTML escapes XSS tags safely',
      !bookingMail.bodyHtml.includes('<script>') && bookingMail.bodyHtml.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
    check('book-consultation includes all submitted booking fields',
      bookingMail.bodyHtml.includes('Jane &lt;script&gt;') &&
      bookingMail.bodyHtml.includes('jane@example.invalid') &&
      bookingMail.bodyHtml.includes('+1 264 555 0102') &&
      bookingMail.bodyHtml.includes('One-on-One Tutoring') &&
      bookingMail.bodyHtml.includes('Upper Primary') &&
      bookingMail.bodyHtml.includes('fractions'));
    check('book-consultation includes attached readiness summary',
      bookingMail.bodyHtml.includes('Parent-Attached Readiness Check Summary') &&
      bookingMail.bodyHtml.includes('Mathematics') &&
      bookingMail.bodyHtml.includes('4 / 10') &&
      bookingMail.bodyHtml.includes('Just Starting'));

    const learningNeedsMail = buildFormNotificationEmail('learning-needs', {
      id: 'ln-202',
      createdAt: '2026-11-26T10:05:00.000Z',
      parentName: 'Pat Guardian',
      email: 'pat@example.invalid',
      phone: '+1 264 555 0103',
      studentYearGroup: 'Early Primary',
      learningStrengths: 'SECRET_STRENGTH_VISUAL_LEARNER',
      areasForSupport: 'SECRET_AREA_EXECUTIVE_FUNCTION',
      academicGoals: 'SECRET_GOAL_READING',
      preferredLearningEnvironment: 'SECRET_QUIET_ROOM'
    });
    check('learning-needs includes ID, form type, and parent contact details',
      learningNeedsMail.bodyHtml.includes('ln-202') &&
      learningNeedsMail.bodyHtml.includes('learning-needs') &&
      learningNeedsMail.bodyHtml.includes('Pat Guardian') &&
      learningNeedsMail.bodyHtml.includes('pat@example.invalid') &&
      learningNeedsMail.bodyHtml.includes('+1 264 555 0103'));
    check('learning-needs strictly omits ALL learning and child fields from HTML & text',
      !learningNeedsMail.bodyHtml.includes('Early Primary') &&
      !learningNeedsMail.bodyHtml.includes('SECRET_STRENGTH') &&
      !learningNeedsMail.bodyHtml.includes('SECRET_AREA') &&
      !learningNeedsMail.bodyHtml.includes('SECRET_GOAL') &&
      !learningNeedsMail.bodyHtml.includes('SECRET_QUIET') &&
      !learningNeedsMail.bodyText.includes('SECRET_STRENGTH') &&
      !learningNeedsMail.bodyText.includes('Early Primary'));

    const presenterMail = buildFormNotificationEmail('presenter-application', {
      id: 'pr-303',
      fullName: 'Sam Educator',
      email: 'sam@example.invalid',
      phone: '+1 264 555 0104',
      location: 'The Valley, Anguilla',
      ageConfirmation: true,
      preferredRole: 'Presenter',
      educationalBackground: 'BEd Primary Education',
      experienceWithChildren: '4 years classroom teaching',
      mathConfidence: 'High',
      availability: 'Weekday afternoons',
      whyPopcornMath: 'Hands-on maths builds joy!',
      cvUploadKey: 'cv-uploads/2026/11/secret-key-sam_cv.pdf'
    });
    check('presenter-application includes applicant details',
      presenterMail.bodyHtml.includes('Sam Educator') &&
      presenterMail.bodyHtml.includes('BEd Primary Education') &&
      presenterMail.bodyHtml.includes('Hands-on maths builds joy!'));
    check('presenter-application omits CV storage key, attachment, and download link',
      !presenterMail.bodyHtml.includes('secret-key-sam_cv.pdf') &&
      !presenterMail.bodyHtml.includes('cv-uploads/') &&
      !presenterMail.bodyText.includes('secret-key-sam_cv.pdf') &&
      presenterMail.bodyHtml.includes('no attachment or download link'));

    for (const [fType, sample, mustContain] of [
      ['contact', { id: 'ct-1', fullName: 'Bob Contact', email: 'bob@example.invalid', subject: 'Schedule', message: 'Hello Cassie!' }, 'Hello Cassie!'],
      ['school-enquiry', { id: 'sc-1', schoolName: 'Island Primary', contactPerson: 'Principal Lee', roleTitle: 'Principal', email: 'lee@example.invalid', phone: '+12645550105', locationDistrict: 'The Valley', studentAgeGroup: 'Mixed', estimatedStudentCount: 30, programmeType: 'After-school club' }, 'Island Primary'],
      ['concierge-application', { id: 'cg-1', parentName: 'Dana Parent', email: 'dana@example.invalid', phone: '+12645550106', studentYearGroup: 'Secondary', academicGoals: 'Weekly study structure' }, 'Weekly study structure'],
      ['popcorn-parent-interest', { id: 'pp-1', parentName: 'Eva Parent', email: 'eva@example.invalid', phone: '+12645550107', childGrade: 'Grade 4', preferredSchool: 'Pilot Cohort' }, 'Grade 4']
    ]) {
      const m = buildFormNotificationEmail(fType, sample);
      check(`${fType} email includes full escaped fields`, m.bodyHtml.includes(mustContain) && m.bodyText.includes(mustContain));
    }

    // --- 3. Server-Side readinessSummary Validation ---
    console.log('\n--- 3. Server-Side Readiness Summary Validation ---');
    check('Valid Mathematics readinessSummary passes validation',
      validateReadinessSummary({ subject: 'Mathematics', score: 8, total: 10, band: 'Looking Good', recommendedService: 'Sunday Workshops' }).length === 0);
    check('Valid Language Arts readinessSummary passes validation',
      validateReadinessSummary({ subject: 'Language Arts', score: 9, total: 10, band: 'Exam Star' }).length === 0);
    check('Rejects childName inside readinessSummary',
      validateReadinessSummary({ subject: 'Mathematics', score: 7, total: 10, band: 'Looking Good', childName: 'Timmy' }).length > 0);
    check('Rejects hidden subject Science in readinessSummary',
      validateReadinessSummary({ subject: 'Science', score: 7, total: 10, band: 'Looking Good' }).length > 0);
    check('Rejects mismatched score and band',
      validateReadinessSummary({ subject: 'Mathematics', score: 9, total: 10, band: 'Just Starting' }).length > 0);
    check('Rejects out-of-range score (11/10)',
      validateReadinessSummary({ subject: 'Mathematics', score: 11, total: 10, band: 'Exam Star' }).length > 0);
    check('Rejects non-integer score (6.5)',
      validateReadinessSummary({ subject: 'Mathematics', score: 6.5, total: 10, band: 'Getting There' }).length > 0);

    const consultValidErrors = validateConsultationForm({
      parentName: 'Test Parent',
      email: 'parent@example.invalid',
      phone: '+12645550199',
      studentYearGroup: 'Upper Primary',
      serviceInterest: 'One-on-One Tutoring',
      readinessSummary: { subject: 'Mathematics', score: 3, total: 10, band: 'Just Starting' },
      consent: true
    });
    check('validateConsultationForm accepts valid readinessSummary', consultValidErrors.length === 0);

    // --- 4. End-to-End Pipeline: Mock Delivery & Email-Failure Resilience ---
    console.log('\n--- 4. End-to-End Pipeline & Email-Failure Resilience ---');
    process.env.STORAGE_DRIVER = 'local';
    process.env.EMAIL_DRIVER = 'mock';
    process.env.DATA_DIR = tmpDir;
    process.env.CASSIE_NOTIFICATION_EMAIL = 'Cassie@tutortime.ai';
    process.env.SEND_CONFIRMATIONS = 'false';

    // Load pipeline after setting temp DATA_DIR
    const formPipeline = require('../src/shared/forms/formPipeline');
    const app = express();
    app.use(express.json());
    app.use('/api', formPipeline);
    const server = await new Promise((resolve) => {
      const s = app.listen(0, '127.0.0.1', () => resolve(s));
    });

    try {
      clearMockOutbox();
      const okRes = await httpPostJson(server, '/api/forms/book-consultation', {
        parentName: 'Morgan Parent',
        email: 'morgan@example.invalid',
        phone: '+12645550111',
        studentYearGroup: 'Upper Primary',
        serviceInterest: 'One-on-One Tutoring',
        additionalNotes: 'Looking for Tuesday afternoons',
        readinessSummary: {
          subject: 'Language Arts',
          score: 5,
          total: 10,
          band: 'Getting There',
          recommendedService: 'Sunday Workshops'
        },
        consent: true
      });
      check('POST /api/forms/book-consultation returns HTTP 201 with readinessSummary', okRes.status === 201 && okRes.json.success === true);
      const outbox = getMockOutbox();
      check('Mock outbox captured email to Cassie@tutortime.ai with booking & readiness details',
        outbox.length === 1 &&
        outbox[0].to === 'Cassie@tutortime.ai' &&
        outbox[0].bodyHtml.includes('Morgan Parent') &&
        outbox[0].bodyHtml.includes('5 / 10') &&
        outbox[0].bodyHtml.includes('Getting There'));

      // Reject malformed readinessSummary with HTTP 400
      const badRes = await httpPostJson(server, '/api/forms/book-consultation', {
        parentName: 'Morgan Parent',
        email: 'morgan@example.invalid',
        phone: '+12645550111',
        studentYearGroup: 'Upper Primary',
        serviceInterest: 'One-on-One Tutoring',
        readinessSummary: { subject: 'Mathematics', score: 10, total: 10, band: 'Just Starting' },
        consent: true
      });
      check('POST /api/forms/book-consultation rejects mismatched readinessSummary with HTTP 400', badRes.status === 400);

      // Simulate email transport failure: booking MUST still be persisted and return HTTP 201!
      setTransportForTests(async () => {
        throw new Error('Simulated SES outage');
      });
      const failEmailRes = await httpPostJson(server, '/api/forms/book-consultation', {
        parentName: 'Resilient Parent',
        email: 'resilient@example.invalid',
        phone: '+12645550122',
        studentYearGroup: 'Early Primary',
        serviceInterest: 'Popcorn Math',
        additionalNotes: 'Must not be lost if email fails',
        consent: true
      });
      setTransportForTests(null);

      check('Booking still returns HTTP 201 even when email delivery throws',
        failEmailRes.status === 201 &&
        failEmailRes.json &&
        failEmailRes.json.success === true &&
        failEmailRes.json.emailNotificationSent === false);

      const savedData = JSON.parse(fs.readFileSync(path.join(tmpDir, 'tutortime-submissions.json'), 'utf8'));
      const savedBooking = (savedData.submissions || []).find(s => s.id === failEmailRes.json.id);
      check('Saved booking record is preserved intact in storage after email failure',
        Boolean(savedBooking) && savedBooking.parentName === 'Resilient Parent');
    } finally {
      server.close();
    }

    // --- 5. /book UI & Zero-Storage Client Verification ---
    console.log('\n--- 5. /book Opt-In Attachment Markup & Zero-Storage Client ---');
    const bookHtml = renderBookPage();
    check('/book renders hidden opt-in readiness attachment container & checkbox',
      bookHtml.includes('id="book-readiness-attachment"') &&
      bookHtml.includes('id="attachReadinessResult"') &&
      bookHtml.includes('id="book-readiness-summary-preview"'));

    const formsJs = fs.readFileSync(path.join(__dirname, '../MyWebApp/src/main/webapp/js/forms.js'), 'utf8');
    check('forms.js uses zero localStorage/sessionStorage/cookie storage',
      !formsJs.includes('localStorage') && !formsJs.includes('sessionStorage') && !formsJs.includes('document.cookie'));
  } finally {
    setSesClientForTests(null);
    setTransportForTests(null);
    clearMockOutbox();
    process.env = savedEnv;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  console.log('\n================================================================');
  console.log(`ITEM 1 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error('Fatal Item 1 test error:', err);
  process.exit(1);
});
