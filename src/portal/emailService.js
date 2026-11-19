/**
 * Portal Email Service (Amazon SESv2 with Sandbox Guard & Send Logging)
 */

const crypto = require('crypto');
const {
  SESv2Client,
  SendEmailCommand,
  GetAccountCommand,
  GetEmailIdentityCommand
} = require('@aws-sdk/client-sesv2');
const { escapeHtml } = require('../shared/templates/layout');

function formatDisplayDate(isoDate) {
  if (!isoDate) return '';
  const parts = String(isoDate).split('-');
  if (parts.length !== 3) return isoDate;
  const d = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });
}

function buildAttendanceEmail({ student, record, settings, parentLink }) {
  const tutorName = settings.tutorDisplayName || 'Teacher Cassie';
  const replyTo = settings.replyToEmail || 'Cassie@tutortime.ai';
  const prettyDate = formatDisplayDate(record.date);

  const statusTextMap = {
    present: 'attended a one-on-one session',
    late: 'attended a one-on-one session (arrived late)',
    absent: 'was marked absent for a scheduled session',
    cancelled: 'had a scheduled session cancelled'
  };
  const actionPhrase = statusTextMap[record.status] || `had attendance updated (${record.status})`;
  const subject = `Tutor Time Attendance: ${student.name} — ${record.date}`;

  const noteHtml = record.note
    ? `<p style="margin:12px 0;padding:10px 14px;background:#f8fafc;border-left:3px solid #2563eb;"><strong>Session Note:</strong> ${escapeHtml(record.note)}</p>`
    : '';
  const noteText = record.note ? `\nSession Note: ${record.note}\n` : '';

  const linkHtml = parentLink
    ? `<p style="margin:16px 0;"><a href="${escapeHtml(parentLink)}" style="display:inline-block;padding:10px 18px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">View ${escapeHtml(student.name)}'s Attendance &amp; Sessions</a></p>
       <p style="font-size:13px;color:#475569;">Or copy this private link: ${escapeHtml(parentLink)}</p>`
    : '';
  const linkText = parentLink ? `\nView ${student.name}'s attendance & sessions: ${parentLink}\n` : '';

  const bodyHtml = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#1e293b;line-height:1.5;">
      <p>Hello ${escapeHtml(student.parentName || 'Parent/Guardian')},</p>
      <p>Your child <strong>${escapeHtml(student.name)}</strong> ${escapeHtml(actionPhrase)} with <strong>${escapeHtml(tutorName)}</strong> on <strong>${escapeHtml(prettyDate)}</strong>.</p>
      ${noteHtml}
      ${linkHtml}
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
      <p style="font-size:12px;color:#64748b;">
        This is a transactional attendance notice from ${escapeHtml(tutorName)} (Tutor Time).
        To update your preferences, stop these notices, or ask a question, simply reply to this email or contact ${escapeHtml(tutorName)} at <a href="mailto:${escapeHtml(replyTo)}">${escapeHtml(replyTo)}</a>.
      </p>
    </div>
  `.trim();

  const bodyText = [
    `Hello ${student.parentName || 'Parent/Guardian'},`,
    '',
    `Your child ${student.name} ${actionPhrase} with ${tutorName} on ${prettyDate}.`,
    noteText,
    linkText,
    '---',
    `To stop these notices or ask a question, reply to this email or contact ${tutorName} at ${replyTo}.`
  ].join('\n');

  return { subject, bodyHtml, bodyText };
}

class PortalEmailService {
  constructor(options = {}) {
    this.region = options.region || process.env.SES_REGION || process.env.AWS_REGION || 'us-east-2';
    this.sesClient = options.sesClient || null;
  }

  isLiveSesEnabled() {
    if (this.sesClient) return true;
    const storageDriver = (process.env.STORAGE_DRIVER || 'local').toLowerCase().trim();
    const emailDriver = (process.env.EMAIL_DRIVER || '').toLowerCase().trim();
    return storageDriver === 'aws' || emailDriver === 'ses';
  }

  getSesClient() {
    if (!this.sesClient) {
      this.sesClient = new SESv2Client({ region: this.region });
    }
    return this.sesClient;
  }

  async checkSandboxAndRecipient(sesClient, recipientEmail) {
    try {
      const account = await sesClient.send(new GetAccountCommand({}));
      if (account && account.ProductionAccessEnabled === true) {
        return { allowed: true, sandbox: false };
      }
      // In sandbox mode: check if recipient address is verified in SES
      try {
        const identity = await sesClient.send(new GetEmailIdentityCommand({
          EmailIdentity: recipientEmail
        }));
        if (identity && identity.VerificationStatus === 'SUCCESS') {
          return { allowed: true, sandbox: true };
        }
        return {
          allowed: false,
          sandbox: true,
          reason: `SES is in sandbox mode and ${recipientEmail} is not a verified SES identity.`
        };
      } catch {
        return {
          allowed: false,
          sandbox: true,
          reason: `SES is in sandbox mode and ${recipientEmail} is not verified in SES.`
        };
      }
    } catch (err) {
      // If GetAccount fails (e.g. IAM permission omitted), fall through to SendEmailCommand and handle errors safely
      return { allowed: true, sandbox: null, checkError: err.message };
    }
  }

  async sendAttendanceNotice({ store, student, record, settings, parentLink }) {
    const logId = crypto.randomBytes(6).toString('hex');
    const createdAt = new Date().toISOString();
    const recipient = (student.parentEmail || '').trim();
    const month = record.month || record.date.slice(0, 7);

    if (!settings.sendParentEmails || !recipient) {
      const entry = {
        logId,
        createdAt,
        month,
        date: record.date,
        studentId: student.studentId,
        studentName: student.name,
        recipientEmail: recipient || '(none)',
        status: 'SKIPPED',
        messageId: null,
        errorMessage: !recipient ? 'No parent email on file' : 'Parent emails disabled in settings'
      };
      await store.logEmail(entry);
      return { status: 'SKIPPED', warning: entry.errorMessage, log: entry };
    }

    const { subject, bodyHtml, bodyText } = buildAttendanceEmail({
      student,
      record,
      settings,
      parentLink
    });

    if (!this.isLiveSesEnabled()) {
      const mockId = `mock-ses-${logId}`;
      const entry = {
        logId,
        createdAt,
        month,
        date: record.date,
        studentId: student.studentId,
        studentName: student.name,
        recipientEmail: recipient,
        status: 'SENT',
        messageId: mockId,
        errorMessage: null
      };
      await store.logEmail(entry);
      return { status: 'SENT', messageId: mockId, log: entry };
    }

    const sesClient = this.getSesClient();
    const sandboxCheck = await this.checkSandboxAndRecipient(sesClient, recipient);

    if (!sandboxCheck.allowed) {
      const entry = {
        logId,
        createdAt,
        month,
        date: record.date,
        studentId: student.studentId,
        studentName: student.name,
        recipientEmail: recipient,
        status: 'BLOCKED_SANDBOX',
        messageId: null,
        errorMessage: sandboxCheck.reason
      };
      await store.logEmail(entry);
      return { status: 'BLOCKED_SANDBOX', warning: sandboxCheck.reason, log: entry };
    }

    const senderEmail = settings.senderEmail || 'noreply@mail.tutortime.ai';
    const tutorName = settings.tutorDisplayName || 'Teacher Cassie';
    const replyTo = settings.replyToEmail || 'Cassie@tutortime.ai';

    try {
      const response = await sesClient.send(new SendEmailCommand({
        FromEmailAddress: `${tutorName} <${senderEmail}>`,
        ReplyToAddresses: [replyTo],
        Destination: {
          ToAddresses: [recipient]
        },
        Content: {
          Simple: {
            Subject: { Data: subject, Charset: 'UTF-8' },
            Body: {
              Html: { Data: bodyHtml, Charset: 'UTF-8' },
              Text: { Data: bodyText, Charset: 'UTF-8' }
            }
          }
        }
      }));

      const entry = {
        logId,
        createdAt,
        month,
        date: record.date,
        studentId: student.studentId,
        studentName: student.name,
        recipientEmail: recipient,
        status: 'SENT',
        messageId: response.MessageId || null,
        errorMessage: null
      };
      await store.logEmail(entry);
      return { status: 'SENT', messageId: entry.messageId, log: entry };
    } catch (err) {
      const errMsg = err && err.message ? err.message : 'SES send failed';
      const isSandboxRejection = /not verified|sandbox/i.test(errMsg);
      const status = isSandboxRejection ? 'BLOCKED_SANDBOX' : 'FAILED';
      const entry = {
        logId,
        createdAt,
        month,
        date: record.date,
        studentId: student.studentId,
        studentName: student.name,
        recipientEmail: recipient,
        status,
        messageId: null,
        errorMessage: errMsg
      };
      await store.logEmail(entry);
      return { status, warning: errMsg, log: entry };
    }
  }

  async sendCustomParentNotice({ store, student, subject, message, settings, parentLink }) {
    const logId = crypto.randomBytes(6).toString('hex');
    const createdAt = new Date().toISOString();
    const recipient = (student.parentEmail || '').trim();
    const month = createdAt.slice(0, 7);

    if (!recipient) {
      const entry = {
        logId,
        createdAt,
        month,
        date: createdAt.slice(0, 10),
        studentId: student.studentId,
        studentName: student.name,
        recipientEmail: '(none)',
        status: 'SKIPPED',
        messageId: null,
        errorMessage: 'No parent email on file'
      };
      await store.logEmail(entry);
      return { status: 'SKIPPED', warning: entry.errorMessage, log: entry };
    }

    const tutorName = settings.tutorDisplayName || 'Teacher Cassie';
    const replyTo = settings.replyToEmail || 'Cassie@tutortime.ai';
    const senderEmail = settings.senderEmail || 'noreply@mail.tutortime.ai';
    const cleanSubject = String(subject || `Message from ${tutorName}: ${student.name}`).trim();
    const cleanMsg = String(message || '').trim();

    const bodyHtml = `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#1e293b;line-height:1.55;">
        <p>Hello ${escapeHtml(student.parentName || 'Parent/Guardian')},</p>
        <p style="white-space:pre-line;">${escapeHtml(cleanMsg)}</p>
        ${parentLink ? `<p style="margin:16px 0;"><a href="${escapeHtml(parentLink)}" style="display:inline-block;padding:10px 18px;background:#028090;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">View ${escapeHtml(student.name)}'s Portal</a></p>` : ''}
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
        <p style="font-size:12px;color:#64748b;">
          Sent by ${escapeHtml(tutorName)} (Tutor Time). To reply or stop receiving notices, reply to this email or contact <a href="mailto:${escapeHtml(replyTo)}">${escapeHtml(replyTo)}</a>.
        </p>
      </div>
    `.trim();

    const bodyText = [
      `Hello ${student.parentName || 'Parent/Guardian'},`,
      '',
      cleanMsg,
      parentLink ? `\nView ${student.name}'s portal: ${parentLink}\n` : '',
      '---',
      `Sent by ${tutorName}. Reply or contact ${replyTo} to stop notices.`
    ].join('\n');

    if (!this.isLiveSesEnabled()) {
      const mockId = `mock-ses-${logId}`;
      const entry = {
        logId,
        createdAt,
        month,
        date: createdAt.slice(0, 10),
        studentId: student.studentId,
        studentName: student.name,
        recipientEmail: recipient,
        status: 'SENT',
        messageId: mockId,
        errorMessage: null
      };
      await store.logEmail(entry);
      return { status: 'SENT', messageId: mockId, log: entry };
    }

    const sesClient = this.getSesClient();
    const sandboxCheck = await this.checkSandboxAndRecipient(sesClient, recipient);
    if (!sandboxCheck.allowed) {
      const entry = {
        logId,
        createdAt,
        month,
        date: createdAt.slice(0, 10),
        studentId: student.studentId,
        studentName: student.name,
        recipientEmail: recipient,
        status: 'BLOCKED_SANDBOX',
        messageId: null,
        errorMessage: sandboxCheck.reason
      };
      await store.logEmail(entry);
      return { status: 'BLOCKED_SANDBOX', warning: sandboxCheck.reason, log: entry };
    }

    try {
      const response = await sesClient.send(new SendEmailCommand({
        FromEmailAddress: `${tutorName} <${senderEmail}>`,
        ReplyToAddresses: [replyTo],
        Destination: { ToAddresses: [recipient] },
        Content: {
          Simple: {
            Subject: { Data: cleanSubject, Charset: 'UTF-8' },
            Body: {
              Html: { Data: bodyHtml, Charset: 'UTF-8' },
              Text: { Data: bodyText, Charset: 'UTF-8' }
            }
          }
        }
      }));
      const entry = {
        logId,
        createdAt,
        month,
        date: createdAt.slice(0, 10),
        studentId: student.studentId,
        studentName: student.name,
        recipientEmail: recipient,
        status: 'SENT',
        messageId: response.MessageId || null,
        errorMessage: null
      };
      await store.logEmail(entry);
      return { status: 'SENT', messageId: entry.messageId, log: entry };
    } catch (err) {
      const errMsg = err && err.message ? err.message : 'SES send failed';
      const status = /not verified|sandbox/i.test(errMsg) ? 'BLOCKED_SANDBOX' : 'FAILED';
      const entry = {
        logId,
        createdAt,
        month,
        date: createdAt.slice(0, 10),
        studentId: student.studentId,
        studentName: student.name,
        recipientEmail: recipient,
        status,
        messageId: null,
        errorMessage: errMsg
      };
      await store.logEmail(entry);
      return { status, warning: errMsg, log: entry };
    }
  }
}

module.exports = {
  PortalEmailService,
  buildAttendanceEmail,
  formatDisplayDate
};
