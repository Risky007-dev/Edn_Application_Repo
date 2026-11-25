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

  const statusMeta = {
    present: {
      phrase: 'attended a one-on-one session',
      label: 'Present',
      bg: '#E6F7F2',
      fg: '#0D7A5F'
    },
    late: {
      phrase: 'attended a one-on-one session (arrived late)',
      label: 'Late',
      bg: '#FEF3C7',
      fg: '#B45309'
    },
    absent: {
      phrase: 'was marked absent for a scheduled session',
      label: 'Absent',
      bg: '#FEE2E2',
      fg: '#B91C1C'
    },
    cancelled: {
      phrase: 'had a scheduled session cancelled',
      label: 'Cancelled',
      bg: '#F1F5F9',
      fg: '#475569'
    }
  };
  const meta = statusMeta[record.status] || {
    phrase: `had attendance updated (${record.status})`,
    label: record.status,
    bg: '#F1F5F9',
    fg: '#334155'
  };
  const subject = `Tutor Time Attendance: ${student.name} — ${record.date}`;

  const noteHtml = record.note
    ? `<tr><td style="padding:14px 16px;background:#FFFDF9;border:1px solid #E8E0D2;border-left:4px solid #028090;border-radius:8px;font-size:14px;color:#1C2434;">
         <strong style="display:block;margin-bottom:4px;color:#028090;">Session Note</strong>
         ${escapeHtml(record.note)}
       </td></tr>
       <tr><td style="height:16px;"></td></tr>`
    : '';
  const noteText = record.note ? `\nSession Note: ${record.note}\n` : '';

  const linkHtml = parentLink
    ? `<tr><td align="left" style="padding:4px 0 12px;">
         <a href="${escapeHtml(parentLink)}" style="display:inline-block;padding:12px 22px;background:#028090;color:#FFFFFF;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">View ${escapeHtml(student.name)}'s Attendance &amp; Progress</a>
       </td></tr>
       <tr><td style="font-size:12px;color:#64748B;word-break:break-all;">
         Direct private link: <a href="${escapeHtml(parentLink)}" style="color:#028090;">${escapeHtml(parentLink)}</a>
       </td></tr>`
    : '';
  const linkText = parentLink ? `\nView ${student.name}'s attendance & progress: ${parentLink}\n` : '';

  const bodyHtml = `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#FFF8EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1C2434;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8EE;padding:28px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#FFFFFF;border:1px solid #E8E0D2;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:#028090;padding:22px 26px;color:#FFFFFF;">
              <div style="font-size:12px;font-weight:700;letter-spacing:0.04em;opacity:0.9;margin-bottom:4px;">TUTOR TIME WITH ${escapeHtml(tutorName.toUpperCase())}</div>
              <div style="font-size:20px;font-weight:700;line-height:1.25;">Session Attendance Update</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 26px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:15px;line-height:1.6;color:#1C2434;padding-bottom:14px;">
                    Hello <strong>${escapeHtml(student.parentName || 'Parent/Guardian')}</strong>,
                  </td>
                </tr>
                <tr>
                  <td style="font-size:15px;line-height:1.6;color:#1C2434;padding-bottom:16px;">
                    Your child <strong>${escapeHtml(student.name)}</strong> ${escapeHtml(meta.phrase)} with <strong>${escapeHtml(tutorName)}</strong> on <strong>${escapeHtml(prettyDate)}</strong>.
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:18px;">
                    <span style="display:inline-block;padding:5px 14px;border-radius:999px;background:${meta.bg};color:${meta.fg};font-size:13px;font-weight:700;">
                      Status: ${escapeHtml(meta.label)}
                    </span>
                  </td>
                </tr>
                ${noteHtml}
                ${linkHtml}
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#FFFDF9;border-top:1px solid #EFE7DA;padding:16px 26px;font-size:12px;line-height:1.55;color:#64748B;">
              This is a transactional attendance notice from ${escapeHtml(tutorName)} (Tutor Time).
              To update your preferences, stop these notices, or ask a question, simply reply to this email or contact ${escapeHtml(tutorName)} at
              <a href="mailto:${escapeHtml(replyTo)}" style="color:#028090;font-weight:600;">${escapeHtml(replyTo)}</a>.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  const bodyText = [
    `Hello ${student.parentName || 'Parent/Guardian'},`,
    '',
    `Your child ${student.name} ${meta.phrase} with ${tutorName} on ${prettyDate}.`,
    `Status: ${meta.label}`,
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

    const bodyHtml = `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#FFF8EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1C2434;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8EE;padding:28px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#FFFFFF;border:1px solid #E8E0D2;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:#028090;padding:22px 26px;color:#FFFFFF;">
              <div style="font-size:12px;font-weight:700;letter-spacing:0.04em;opacity:0.9;margin-bottom:4px;">TUTOR TIME WITH ${escapeHtml(tutorName.toUpperCase())}</div>
              <div style="font-size:20px;font-weight:700;line-height:1.25;">${escapeHtml(cleanSubject)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 26px;font-size:15px;line-height:1.6;color:#1C2434;">
              <p style="margin:0 0 14px;">Hello <strong>${escapeHtml(student.parentName || 'Parent/Guardian')}</strong>,</p>
              <p style="margin:0 0 18px;white-space:pre-line;">${escapeHtml(cleanMsg)}</p>
              ${parentLink ? `<p style="margin:0 0 8px;"><a href="${escapeHtml(parentLink)}" style="display:inline-block;padding:12px 22px;background:#028090;color:#FFFFFF;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">View ${escapeHtml(student.name)}'s Portal</a></p>` : ''}
            </td>
          </tr>
          <tr>
            <td style="background:#FFFDF9;border-top:1px solid #EFE7DA;padding:16px 26px;font-size:12px;line-height:1.55;color:#64748B;">
              Sent by ${escapeHtml(tutorName)} (Tutor Time). To reply or stop receiving notices, reply to this email or contact
              <a href="mailto:${escapeHtml(replyTo)}" style="color:#028090;font-weight:600;">${escapeHtml(replyTo)}</a>.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

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
