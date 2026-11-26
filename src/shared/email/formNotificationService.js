/**
 * Public Form Notification Email Service
 * Decoupled from STORAGE_DRIVER: selects mock vs Amazon SESv2 via EMAIL_DRIVER.
 *
 * Privacy & Safety Rules:
 * - Always HTML-escape every user-submitted field before inserting into HTML emails.
 * - `learning-needs`: send ONLY submission ID, form type, timestamp, and parent contact details
 *   (strictly omit all learning/child fields).
 * - `presenter-application`: send applicant fields, NEVER attach CVs or include CV keys/download links.
 * - Never log PII (names, emails, phones, message bodies).
 */

const { SESv2Client, SendEmailCommand } = require('@aws-sdk/client-sesv2');
const { escapeHtml } = require('../templates/layout');

const FORM_LABELS = {
  'book-consultation': 'Consultation Booking Request',
  'contact': 'Contact Message',
  'school-enquiry': 'School Partnership Enquiry',
  'concierge-application': 'Concierge Academic Coaching Application',
  'popcorn-parent-interest': 'Popcorn Math Parent Interest Registration',
  'learning-needs': 'Individualised Learning Support Enquiry',
  'presenter-application': 'Popcorn Math Presenter Application'
};

// Strictly allowlisted email fields per form type
const FORM_EMAIL_FIELD_SPEC = {
  'book-consultation': [
    { key: 'parentName', label: 'Parent / Guardian Name' },
    { key: 'email', label: 'Contact Email' },
    { key: 'phone', label: 'Phone Number' },
    { key: 'serviceInterest', label: 'Service Interest' },
    { key: 'studentYearGroup', label: 'Student Year Group' },
    { key: 'additionalNotes', label: 'Additional Notes' },
    { key: 'message', label: 'Message' }
  ],
  'contact': [
    { key: 'fullName', label: 'Full Name' },
    { key: 'email', label: 'Email Address' },
    { key: 'phone', label: 'Phone Number' },
    { key: 'subject', label: 'Subject' },
    { key: 'message', label: 'Message' }
  ],
  'school-enquiry': [
    { key: 'schoolName', label: 'School / Institution Name' },
    { key: 'contactPerson', label: 'Contact Person' },
    { key: 'roleTitle', label: 'Role Title' },
    { key: 'email', label: 'Contact Email' },
    { key: 'phone', label: 'Contact Phone / WhatsApp' },
    { key: 'locationDistrict', label: 'Location / District' },
    { key: 'studentAgeGroup', label: 'Student Age Group' },
    { key: 'estimatedStudentCount', label: 'Estimated Students' },
    { key: 'programmeType', label: 'Preferred Format' },
    { key: 'targetDate', label: 'Target Term / Date' },
    { key: 'message', label: 'Additional Notes' }
  ],
  'concierge-application': [
    { key: 'parentName', label: 'Parent / Guardian Name' },
    { key: 'email', label: 'Contact Email' },
    { key: 'phone', label: 'Phone Number' },
    { key: 'studentYearGroup', label: 'Student Year Group' },
    { key: 'academicGoals', label: 'Academic Goals & Priorities' },
    { key: 'preferredSchedule', label: 'Preferred Schedule' }
  ],
  'popcorn-parent-interest': [
    { key: 'parentName', label: 'Parent / Guardian Name' },
    { key: 'email', label: 'Email Address' },
    { key: 'phone', label: 'WhatsApp / Phone Number' },
    { key: 'contactMethod', label: 'Preferred Contact Method' },
    { key: 'childGrade', label: 'Child Primary Grade Level' },
    { key: 'preferredSchool', label: 'Preferred Primary School' },
    { key: 'message', label: 'Questions or Comments' }
  ],
  // STRICT PRIVACY LIMIT: parent contact details + submission metadata ONLY (zero learning or child fields)
  'learning-needs': [
    { key: 'parentName', label: 'Parent / Guardian Name' },
    { key: 'email', label: 'Contact Email' },
    { key: 'phone', label: 'Phone Number' }
  ],
  // STRICT LIMIT: applicant details ONLY (never attach CV or include CV storage key / download link)
  'presenter-application': [
    { key: 'fullName', label: 'Full Legal Name' },
    { key: 'email', label: 'Email Address' },
    { key: 'phone', label: 'WhatsApp / Phone Number' },
    { key: 'location', label: 'Location' },
    { key: 'ageConfirmation', label: 'Confirmed 18 or Older' },
    { key: 'preferredRole', label: 'Preferred Role' },
    { key: 'educationalBackground', label: 'Educational Background' },
    { key: 'experienceWithChildren', label: 'Experience Working With Children' },
    { key: 'mathConfidence', label: 'Mathematics Confidence' },
    { key: 'availability', label: 'Availability' },
    { key: 'whyPopcornMath', label: 'Why Popcorn Math' }
  ]
};

// Test hooks & bounded in-memory mock outbox (for isolated local verification)
let injectedSesClient = null;
let injectedTransport = null;
const mockOutbox = [];
const MAX_MOCK_OUTBOX = 50;

function setSesClientForTests(client) {
  injectedSesClient = client || null;
}

function setTransportForTests(fn) {
  injectedTransport = typeof fn === 'function' ? fn : null;
}

function getMockOutbox() {
  return mockOutbox.slice();
}

function clearMockOutbox() {
  mockOutbox.length = 0;
}

/**
 * Resolves email driver independently of STORAGE_DRIVER.
 * Explicit EMAIL_DRIVER ('mock' | 'ses') always wins.
 * When unset, defaults to 'ses' only if STORAGE_DRIVER === 'aws', else 'mock'.
 */
function resolveEmailDriver() {
  const explicit = (process.env.EMAIL_DRIVER || '').toLowerCase().trim();
  if (explicit === 'mock' || explicit === 'ses') {
    return explicit;
  }
  const storageDriver = (process.env.STORAGE_DRIVER || 'local').toLowerCase().trim();
  return storageDriver === 'aws' ? 'ses' : 'mock';
}

/**
 * Resolves notification recipient email.
 * Uses CASSIE_NOTIFICATION_EMAIL first, falling back to ADMIN_NOTIFICATION_EMAIL.
 */
function resolveNotificationRecipient() {
  const cassie = (process.env.CASSIE_NOTIFICATION_EMAIL || '').trim();
  if (cassie) return cassie;
  const admin = (process.env.ADMIN_NOTIFICATION_EMAIL || '').trim();
  return admin || null;
}

function formatFieldValue(val) {
  if (val === true) return 'Yes';
  if (val === false) return 'No';
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

/**
 * Builds safely escaped HTML & plain-text email content for any of the 7 form types.
 */
function buildFormNotificationEmail(formType, record = {}) {
  const formLabel = FORM_LABELS[formType] || formType;
  const fieldSpecs = FORM_EMAIL_FIELD_SPEC[formType] || [];
  const recordId = formatFieldValue(record.id || '(pending)');
  const createdAt = formatFieldValue(record.createdAt || new Date().toISOString());

  const rows = [];
  for (const spec of fieldSpecs) {
    const formatted = formatFieldValue(record[spec.key]);
    if (formatted !== '') {
      rows.push({ label: spec.label, value: formatted });
    }
  }

  // Presenter CV indicator ONLY (boolean status, never key/attachment/link)
  if (formType === 'presenter-application') {
    const hasCv = Boolean(
      (typeof record.cvUploadKey === 'string' && record.cvUploadKey.trim()) ||
      (typeof record.cvFileKey === 'string' && record.cvFileKey.trim())
    );
    rows.push({
      label: 'CV Uploaded',
      value: hasCv ? 'Yes (stored privately; no attachment or download link included in email)' : 'No'
    });
  }

  // Optional parent-attached Readiness Check summary on book-consultation
  let readinessHtml = '';
  let readinessText = '';
  if (formType === 'book-consultation' && record.readinessSummary && typeof record.readinessSummary === 'object') {
    const rs = record.readinessSummary;
    const rsLines = [
      { label: 'Subject', value: formatFieldValue(rs.subject) },
      { label: 'Score', value: `${formatFieldValue(rs.score)} / ${formatFieldValue(rs.total)}` },
      { label: 'Readiness Band', value: formatFieldValue(rs.band) }
    ];
    if (rs.recommendedService) {
      rsLines.push({ label: 'Suggested Programme', value: formatFieldValue(rs.recommendedService) });
    }

    const rsRowsHtml = rsLines.map(item =>
      `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #EFE7DA;font-weight:700;color:#1A365D;width:40%;">${escapeHtml(item.label)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #EFE7DA;color:#1C2434;">${escapeHtml(item.value)}</td>
      </tr>`
    ).join('\n');

    readinessHtml = `
      <div style="margin-top:20px;padding:16px;background:#FFFDF9;border:1px solid #E8E0D2;border-left:4px solid #F5A623;border-radius:8px;">
        <h3 style="margin:0 0 10px;font-size:15px;color:#1A365D;">Parent-Attached Readiness Check Summary</h3>
        <p style="margin:0 0 10px;font-size:12px;color:#64748B;">Non-identifying sample practice score voluntarily attached by parent.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
          ${rsRowsHtml}
        </table>
      </div>`;

    readinessText = [
      '',
      '--- Parent-Attached Readiness Check Summary ---',
      ...rsLines.map(item => `${item.label}: ${item.value}`)
    ].join('\n');
  }

  let privacyNoticeHtml = '';
  let privacyNoticeText = '';
  if (formType === 'learning-needs') {
    privacyNoticeHtml = `
      <p style="margin:16px 0 0;padding:12px 14px;background:#FFF8EE;border:1px solid #E8E0D2;border-radius:8px;font-size:13px;color:#4A5568;">
        <strong>Privacy Notice:</strong> Per Tutor Time privacy policy, student learning details are omitted from email notifications. Review submission ID <code>${escapeHtml(recordId)}</code> directly in secure storage.
      </p>`;
    privacyNoticeText = `\nPrivacy Notice: Student learning details are omitted from email notifications. Review submission ID ${recordId} directly in secure storage.\n`;
  }

  const rowsHtml = rows.map(r =>
    `<tr>
      <td style="padding:10px 12px;border-bottom:1px solid #EFE7DA;font-weight:700;color:#1A365D;vertical-align:top;width:36%;">${escapeHtml(r.label)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #EFE7DA;color:#1C2434;white-space:pre-wrap;word-break:break-word;">${escapeHtml(r.value)}</td>
    </tr>`
  ).join('\n');

  const subject = `Tutor Time — New ${formLabel} (${recordId})`;

  const bodyHtml = `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#FFF8EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1C2434;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8EE;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#FFFFFF;border:1px solid #E8E0D2;border-radius:14px;overflow:hidden;">
          <tr>
            <td style="background:#028090;padding:20px 24px;color:#FFFFFF;">
              <div style="font-size:12px;font-weight:700;letter-spacing:0.04em;opacity:0.9;margin-bottom:4px;">TUTOR TIME WITH TEACHER CASSIE</div>
              <div style="font-size:20px;font-weight:700;line-height:1.25;">New ${escapeHtml(formLabel)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 24px;">
              <p style="margin:0 0 14px;font-size:13px;color:#64748B;">
                <strong>Submission ID:</strong> <code>${escapeHtml(recordId)}</code> &bull;
                <strong>Form Type:</strong> <code>${escapeHtml(formType)}</code> &bull;
                <strong>Received:</strong> ${escapeHtml(createdAt)}
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #EFE7DA;border-radius:8px;font-size:14px;">
                ${rowsHtml}
              </table>
              ${readinessHtml}
              ${privacyNoticeHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  const bodyText = [
    `Tutor Time with Teacher Cassie — New ${formLabel}`,
    `Submission ID: ${recordId}`,
    `Form Type: ${formType}`,
    `Received: ${createdAt}`,
    '',
    ...rows.map(r => `${r.label}: ${r.value}`),
    readinessText,
    privacyNoticeText
  ].filter(Boolean).join('\n');

  const replyTo = (typeof record.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email.trim()))
    ? record.email.trim()
    : null;

  return { subject, bodyHtml, bodyText, replyTo };
}

async function dispatchEmail({ to, subject, bodyHtml, bodyText, replyTo = null }) {
  const driver = resolveEmailDriver();

  if (injectedTransport) {
    return injectedTransport({ driver, to, subject, bodyHtml, bodyText, replyTo });
  }

  if (driver === 'mock') {
    const messageId = `mock-email-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const entry = {
      driver: 'mock',
      messageId,
      to,
      replyTo,
      subject,
      bodyHtml,
      bodyText,
      sentAt: new Date().toISOString()
    };
    mockOutbox.push(entry);
    if (mockOutbox.length > MAX_MOCK_OUTBOX) {
      mockOutbox.shift();
    }
    // Zero-PII console audit log
    console.log(JSON.stringify({
      timestamp: entry.sentAt,
      level: 'info',
      event: 'form_notification_mock_sent',
      driver: 'mock',
      messageId
    }));
    return { success: true, driver: 'mock', messageId };
  }

  // SESv2 path (only when EMAIL_DRIVER=ses, or unset with STORAGE_DRIVER=aws)
  const sender = (process.env.SENDER_EMAIL || '').trim();
  if (!sender) {
    console.warn(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'warn',
      event: 'form_notification_ses_skipped_missing_sender'
    }));
    return { success: false, skipped: true, driver: 'ses', reason: 'SENDER_EMAIL not configured' };
  }

  const region = process.env.SES_REGION || process.env.AWS_REGION || 'us-east-2';
  const client = injectedSesClient || new SESv2Client({ region });

  const commandInput = {
    FromEmailAddress: sender,
    Destination: {
      ToAddresses: [to]
    },
    Content: {
      Simple: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: bodyHtml, Charset: 'UTF-8' },
          ...(bodyText ? { Text: { Data: bodyText, Charset: 'UTF-8' } } : {})
        }
      }
    }
  };

  if (replyTo) {
    commandInput.ReplyToAddresses = [replyTo];
  }

  const response = await client.send(new SendEmailCommand(commandInput));
  return {
    success: true,
    driver: 'ses',
    messageId: response && response.MessageId ? response.MessageId : null
  };
}

async function sendFormNotification(formType, record) {
  const recipient = resolveNotificationRecipient();
  if (!recipient) {
    return { success: false, skipped: true, reason: 'No notification recipient configured' };
  }
  const { subject, bodyHtml, bodyText, replyTo } = buildFormNotificationEmail(formType, record);
  return dispatchEmail({
    to: recipient,
    subject,
    bodyHtml,
    bodyText,
    replyTo
  });
}

module.exports = {
  FORM_LABELS,
  FORM_EMAIL_FIELD_SPEC,
  resolveEmailDriver,
  resolveNotificationRecipient,
  buildFormNotificationEmail,
  dispatchEmail,
  sendFormNotification,
  setSesClientForTests,
  setTransportForTests,
  getMockOutbox,
  clearMockOutbox
};
