/**
 * Express Router for Kashamar's Private Portal (/office or checkin.tutortime.ai)
 * and Parent Read-Only Links (/p/:token).
 */

const crypto = require('crypto');
const express = require('express');
const { getPortalStore } = require('./portalStore');
const {
  SESSION_TTL_SECONDS,
  hashPassword,
  verifyPassword,
  generateToken,
  hashToken,
  parseCookies,
  setSessionCookie,
  clearSessionCookie,
  createLoginRateLimiter,
  requireAuth,
  verifyCsrf
} = require('./auth');
const {
  VALID_STATUSES,
  normalizePrice,
  isStatusBillable,
  computeAttendancePrice,
  computeStudentMonthSummary,
  computeMonthInvoices,
  buildCsvExport
} = require('./billing');
const { PortalEmailService } = require('./emailService');
const {
  renderLoginPage,
  renderChangePasswordPage,
  renderDashboardPage,
  renderAttendancePage,
  renderStudentsPage,
  renderStudentProfilePage,
  renderInvoicesPage,
  renderSettingsPage,
  renderEmailsPage,
  renderParentViewPage
} = require('./templates');

function isValidDateStr(d) {
  return typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
}

function isValidMonthStr(m) {
  return typeof m === 'string' && /^\d{4}-\d{2}$/.test(m);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonthIso() {
  return new Date().toISOString().slice(0, 7);
}

function isCheckinHost(req) {
  const host = String(req.headers && req.headers.host || '').split(':')[0].toLowerCase();
  return host === 'checkin.tutortime.ai';
}

function getBasePrefix(req) {
  return isCheckinHost(req) ? '' : '/office';
}

function getPortalOrigin(req) {
  if (process.env.PORTAL_BASE_URL) {
    return process.env.PORTAL_BASE_URL.replace(/\/+$/, '');
  }
  const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0].trim();
  const host = req.headers.host || 'checkin.tutortime.ai';
  return `${proto}://${host}`;
}

function setPrivateHeaders(req, res, next) {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  next();
}

function createPortalRouters(options = {}) {
  const store = options.store || getPortalStore();
  const emailService = options.emailService || new PortalEmailService();
  const loginLimiter = options.loginLimiter || createLoginRateLimiter();
  const authGuard = requireAuth(store, getBasePrefix);

  const officeRouter = express.Router();
  officeRouter.use(setPrivateHeaders);
  officeRouter.use(express.urlencoded({ extended: false }));

  // Login
  officeRouter.get('/login', (req, res) => {
    res.send(renderLoginPage({ base: getBasePrefix(req), error: null }));
  });

  officeRouter.post('/login', loginLimiter, async (req, res, next) => {
    try {
      const base = getBasePrefix(req);
      const username = String(req.body.username || '').trim().toLowerCase();
      const password = String(req.body.password || '');

      const user = await store.getUser(username);
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return res.status(401).send(renderLoginPage({
          base,
          error: 'Invalid username or password.'
        }));
      }

      const rawSessionToken = generateToken(32);
      const tokenHash = hashToken(rawSessionToken);
      const csrfToken = generateToken(24);
      const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;

      await store.createSession({
        tokenHash,
        username: user.username,
        csrfToken,
        expiresAt,
        createdAt: new Date().toISOString()
      });

      setSessionCookie(res, rawSessionToken, req);

      if (user.mustChangePassword) {
        return res.redirect(`${base}/change-password`);
      }
      return res.redirect(base || '/');
    } catch (err) {
      next(err);
    }
  });

  // Logout
  officeRouter.post('/logout', authGuard, verifyCsrf, async (req, res, next) => {
    try {
      const base = getBasePrefix(req);
      if (req.portalSessionTokenHash) {
        await store.deleteSession(req.portalSessionTokenHash);
      }
      clearSessionCookie(res, req);
      return res.redirect(`${base}/login`);
    } catch (err) {
      next(err);
    }
  });

  // Change password (required on first login, optional later)
  officeRouter.get('/change-password', authGuard, (req, res) => {
    res.send(renderChangePasswordPage({
      base: getBasePrefix(req),
      error: null,
      mustChange: Boolean(req.portalUser.mustChangePassword),
      csrfToken: req.portalSession.csrfToken
    }));
  });

  officeRouter.post('/change-password', authGuard, verifyCsrf, async (req, res, next) => {
    try {
      const base = getBasePrefix(req);
      const newPassword = String(req.body.newPassword || '');
      const confirmPassword = String(req.body.confirmPassword || '');

      if (newPassword.length < 10) {
        return res.status(400).send(renderChangePasswordPage({
          base,
          error: 'Password must be at least 10 characters.',
          mustChange: Boolean(req.portalUser.mustChangePassword),
          csrfToken: req.portalSession.csrfToken
        }));
      }
      if (newPassword !== confirmPassword) {
        return res.status(400).send(renderChangePasswordPage({
          base,
          error: 'Passwords do not match.',
          mustChange: Boolean(req.portalUser.mustChangePassword),
          csrfToken: req.portalSession.csrfToken
        }));
      }

      const updatedUser = {
        ...req.portalUser,
        passwordHash: hashPassword(newPassword),
        mustChangePassword: false,
        updatedAt: new Date().toISOString()
      };
      await store.putUser(updatedUser);
      return res.redirect(base || '/');
    } catch (err) {
      next(err);
    }
  });

  // School Dashboard (Home)
  officeRouter.get('/', authGuard, async (req, res, next) => {
    try {
      const base = getBasePrefix(req);
      const today = todayIso();
      const month = currentMonthIso();

      const [students, monthRecords, recentLogs, settings] = await Promise.all([
        store.listStudents({ includeArchived: true }),
        store.listAttendanceByMonth(month),
        store.listEmailLogs(month),
        store.getSettings()
      ]);

      const todayRecords = monthRecords.filter(r => r.date === today);
      const monthInvoices = computeMonthInvoices(students, monthRecords, settings, month);
      const flash = req.query.msg
        ? {
            type: req.query.type === 'warning' ? 'warning' : req.query.type === 'error' ? 'error' : 'success',
            message: String(req.query.msg)
          }
        : null;

      res.send(renderDashboardPage({
        base,
        today,
        month,
        students,
        todayRecords,
        monthInvoices,
        recentLogs,
        settings,
        flash,
        csrfToken: req.portalSession.csrfToken
      }));
    } catch (err) {
      next(err);
    }
  });

  // Roll-Call Attendance Grid
  officeRouter.get('/attendance', authGuard, async (req, res, next) => {
    try {
      const base = getBasePrefix(req);
      const date = isValidDateStr(req.query.date) ? req.query.date : todayIso();
      const month = isValidMonthStr(req.query.month) ? req.query.month : date.slice(0, 7);

      const [students, monthRecords, settings] = await Promise.all([
        store.listStudents({ includeArchived: true }),
        store.listAttendanceByMonth(month),
        store.getSettings()
      ]);

      const monthInvoices = computeMonthInvoices(students, monthRecords, settings, month);
      const flash = req.query.msg
        ? {
            type: req.query.type === 'warning' ? 'warning' : req.query.type === 'error' ? 'error' : 'success',
            message: String(req.query.msg)
          }
        : null;

      res.send(renderAttendancePage({
        base,
        date,
        month,
        students,
        monthRecords,
        monthInvoices,
        settings,
        flash,
        csrfToken: req.portalSession.csrfToken
      }));
    } catch (err) {
      next(err);
    }
  });

  // Batch Save Roll-Call Grid
  officeRouter.post('/attendance/batch', authGuard, verifyCsrf, async (req, res, next) => {
    try {
      const base = getBasePrefix(req);
      const date = isValidDateStr(req.body.date) ? req.body.date : todayIso();
      const month = isValidMonthStr(req.body.month) ? req.body.month : date.slice(0, 7);
      const skipEmail = req.body.skipEmail === '1';

      const [students, settings] = await Promise.all([
        store.listStudents({ includeArchived: false }),
        store.getSettings()
      ]);

      let savedCount = 0;
      let sentCount = 0;
      let warningMsgs = [];

      for (const student of students) {
        const rawStatus = req.body[`status_${student.studentId}`];
        if (!rawStatus) continue;
        const status = String(rawStatus).toLowerCase().trim();
        if (!VALID_STATUSES.includes(status)) continue;

        const note = String(req.body[`note_${student.studentId}`] || '').trim().slice(0, 400);
        const billable = isStatusBillable(status, settings);
        const priceApplied = computeAttendancePrice(status, student.pricePerSession, settings);

        const record = {
          studentId: student.studentId,
          date,
          month: date.slice(0, 7),
          status,
          billable,
          priceApplied,
          note,
          updatedAt: new Date().toISOString()
        };

        await store.putAttendance(record);
        savedCount++;

        if (!skipEmail) {
          const parentLink = `${getPortalOrigin(req)}/p/${student.parentToken}?month=${record.month}`;
          const emailRes = await emailService.sendAttendanceNotice({
            store,
            student,
            record,
            settings,
            parentLink
          });
          if (emailRes.status === 'SENT') sentCount++;
          else if (emailRes.status === 'BLOCKED_SANDBOX' || emailRes.status === 'FAILED') {
            warningMsgs.push(`${student.name}: ${emailRes.warning}`);
          }
        }
      }

      let msg = `Saved roll call for ${savedCount} student(s) on ${date}.`;
      let type = 'success';
      if (!skipEmail && sentCount > 0) {
        msg += ` Sent ${sentCount} parent email(s).`;
      }
      if (warningMsgs.length > 0) {
        type = 'warning';
        msg += ` Warning: ${warningMsgs.join(' | ')}`;
      }

      return res.redirect(`${base}/attendance?date=${encodeURIComponent(date)}&month=${encodeURIComponent(month)}&type=${encodeURIComponent(type)}&msg=${encodeURIComponent(msg)}`);
    } catch (err) {
      next(err);
    }
  });

  // Mark / Edit Attendance
  officeRouter.post('/attendance', authGuard, verifyCsrf, async (req, res, next) => {
    try {
      const base = getBasePrefix(req);
      const date = isValidDateStr(req.body.date) ? req.body.date : todayIso();
      const month = isValidMonthStr(req.body.month) ? req.body.month : date.slice(0, 7);
      const studentId = String(req.body.studentId || '').trim();
      const status = String(req.body.status || '').toLowerCase().trim();
      const note = String(req.body.note || '').trim().slice(0, 400);
      const skipEmail = req.body.skipEmail === '1';

      if (!studentId || !VALID_STATUSES.includes(status)) {
        return res.redirect(`${base || '/'}?date=${encodeURIComponent(date)}&month=${encodeURIComponent(month)}&type=error&msg=${encodeURIComponent('Invalid student or attendance status.')}`);
      }

      const [student, settings] = await Promise.all([
        store.getStudent(studentId),
        store.getSettings()
      ]);

      if (!student) {
        return res.redirect(`${base || '/'}?date=${encodeURIComponent(date)}&month=${encodeURIComponent(month)}&type=error&msg=${encodeURIComponent('Student not found.')}`);
      }

      const billable = isStatusBillable(status, settings);
      const priceApplied = computeAttendancePrice(status, student.pricePerSession, settings);
      const record = {
        studentId,
        date,
        month: date.slice(0, 7),
        status,
        billable,
        priceApplied,
        note,
        updatedAt: new Date().toISOString()
      };

      await store.putAttendance(record);

      let msg = `Saved ${student.name} (${status}) for ${date}.`;
      let type = 'success';

      if (!skipEmail) {
        const parentLink = `${getPortalOrigin(req)}/p/${student.parentToken}?month=${record.month}`;
        const emailResult = await emailService.sendAttendanceNotice({
          store,
          student,
          record,
          settings,
          parentLink
        });

        if (emailResult.status === 'SENT') {
          msg += ` Parent email sent (ID: ${emailResult.messageId}).`;
        } else if (emailResult.status === 'BLOCKED_SANDBOX') {
          type = 'warning';
          msg += ` Warning: Email NOT sent — ${emailResult.warning}`;
        } else if (emailResult.status === 'FAILED') {
          type = 'warning';
          msg += ` Warning: Email failed (${emailResult.warning}).`;
        }
      }

      return res.redirect(`${base}/attendance?date=${encodeURIComponent(date)}&month=${encodeURIComponent(month)}&type=${encodeURIComponent(type)}&msg=${encodeURIComponent(msg)}`);
    } catch (err) {
      next(err);
    }
  });

  // Undo / Delete Attendance Entry
  officeRouter.post('/attendance/delete', authGuard, verifyCsrf, async (req, res, next) => {
    try {
      const base = getBasePrefix(req);
      const date = isValidDateStr(req.body.date) ? req.body.date : todayIso();
      const month = isValidMonthStr(req.body.month) ? req.body.month : date.slice(0, 7);
      const studentId = String(req.body.studentId || '').trim();

      if (studentId) {
        await store.deleteAttendance(date.slice(0, 7), date, studentId);
      }

      return res.redirect(`${base}/attendance?date=${encodeURIComponent(date)}&month=${encodeURIComponent(month)}&type=success&msg=${encodeURIComponent('Attendance entry removed.')}`);
    } catch (err) {
      next(err);
    }
  });

  // Students List
  officeRouter.get('/students', authGuard, async (req, res, next) => {
    try {
      const base = getBasePrefix(req);
      const includeArchived = req.query.archived === '1';
      const [students, settings] = await Promise.all([
        store.listStudents({ includeArchived }),
        store.getSettings()
      ]);

      const flash = req.query.msg
        ? { type: req.query.type || 'success', message: String(req.query.msg) }
        : null;

      res.send(renderStudentsPage({
        base,
        students,
        includeArchived,
        portalOrigin: getPortalOrigin(req),
        settings,
        flash,
        csrfToken: req.portalSession.csrfToken
      }));
    } catch (err) {
      next(err);
    }
  });

  // Add Student
  officeRouter.post('/students', authGuard, verifyCsrf, async (req, res, next) => {
    try {
      const base = getBasePrefix(req);
      const name = String(req.body.name || '').trim().slice(0, 100);
      const gradeLevel = String(req.body.gradeLevel || '').trim().slice(0, 50);
      const parentName = String(req.body.parentName || '').trim().slice(0, 100);
      const parentEmail = String(req.body.parentEmail || '').trim().slice(0, 150);
      const parentPhone = String(req.body.parentPhone || '').trim().slice(0, 40);
      const pricePerSession = normalizePrice(req.body.pricePerSession);
      const notes = String(req.body.notes || '').trim().slice(0, 500);

      if (!name || !parentName || !parentEmail) {
        return res.redirect(`${base}/students?type=error&msg=${encodeURIComponent('Student name, parent name, and parent email are required.')}`);
      }

      const rawToken = generateToken(32);
      const student = {
        studentId: `stu_${crypto.randomBytes(6).toString('hex')}`,
        name,
        gradeLevel,
        parentName,
        parentEmail,
        parentPhone,
        pricePerSession,
        notes,
        archived: false,
        parentToken: rawToken,
        parentTokenHash: hashToken(rawToken),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await store.saveStudent(student);
      return res.redirect(`${base}/students?type=success&msg=${encodeURIComponent(`Added ${name}.`)}`);
    } catch (err) {
      next(err);
    }
  });

  // Student Profile (Tabbed SIS View)
  officeRouter.get('/students/:id', authGuard, async (req, res, next) => {
    try {
      const base = getBasePrefix(req);
      const student = await store.getStudent(req.params.id);
      if (!student) {
        return res.redirect(`${base}/students?type=error&msg=${encodeURIComponent('Student not found.')}`);
      }

      const tab = ['overview', 'attendance', 'progress', 'message'].includes(req.query.tab) ? req.query.tab : 'overview';
      const month = isValidMonthStr(req.query.month) ? req.query.month : currentMonthIso();

      const [monthRecords, progressNotes, settings] = await Promise.all([
        store.listAttendanceByMonth(month),
        store.listProgressNotes(student.studentId),
        store.getSettings()
      ]);

      const summary = computeStudentMonthSummary(
        student,
        monthRecords.filter(r => r.studentId === student.studentId),
        settings
      );

      const flash = req.query.msg
        ? { type: req.query.type || 'success', message: String(req.query.msg) }
        : null;

      res.send(renderStudentProfilePage({
        base,
        student,
        tab,
        month,
        summary,
        progressNotes,
        portalOrigin: getPortalOrigin(req),
        settings,
        flash,
        csrfToken: req.portalSession.csrfToken
      }));
    } catch (err) {
      next(err);
    }
  });

  // Add Homework & Mastery Note
  officeRouter.post('/students/:id/progress', authGuard, verifyCsrf, async (req, res, next) => {
    try {
      const base = getBasePrefix(req);
      const student = await store.getStudent(req.params.id);
      if (!student) {
        return res.redirect(`${base}/students?type=error&msg=${encodeURIComponent('Student not found.')}`);
      }

      const date = isValidDateStr(req.body.date) ? req.body.date : todayIso();
      const topic = String(req.body.topic || '').trim().slice(0, 120);
      const mastery = String(req.body.mastery || '').trim().slice(0, 60);
      const homework = String(req.body.homework || '').trim().slice(0, 400);

      if (!topic) {
        return res.redirect(`${base}/students/${encodeURIComponent(student.studentId)}?tab=progress&type=error&msg=${encodeURIComponent('Topic is required.')}`);
      }

      const note = {
        noteId: `note_${crypto.randomBytes(5).toString('hex')}`,
        studentId: student.studentId,
        date,
        topic,
        mastery,
        homework,
        createdAt: new Date().toISOString()
      };

      await store.putProgressNote(note);
      return res.redirect(`${base}/students/${encodeURIComponent(student.studentId)}?tab=progress&type=success&msg=${encodeURIComponent('Saved homework & mastery note.')}`);
    } catch (err) {
      next(err);
    }
  });

  // Delete Progress Note
  officeRouter.post('/students/:id/progress/:noteId/delete', authGuard, verifyCsrf, async (req, res, next) => {
    try {
      const base = getBasePrefix(req);
      const date = isValidDateStr(req.body.date) ? req.body.date : todayIso();
      await store.deleteProgressNote(req.params.id, date, req.params.noteId);
      return res.redirect(`${base}/students/${encodeURIComponent(req.params.id)}?tab=progress&type=success&msg=${encodeURIComponent('Removed progress note.')}`);
    } catch (err) {
      next(err);
    }
  });

  // Send Direct Message to Parent via SES
  officeRouter.post('/students/:id/notify', authGuard, verifyCsrf, async (req, res, next) => {
    try {
      const base = getBasePrefix(req);
      const student = await store.getStudent(req.params.id);
      if (!student) {
        return res.redirect(`${base}/students?type=error&msg=${encodeURIComponent('Student not found.')}`);
      }

      const subject = String(req.body.subject || '').trim().slice(0, 150);
      const message = String(req.body.message || '').trim().slice(0, 2000);
      if (!message) {
        return res.redirect(`${base}/students/${encodeURIComponent(student.studentId)}?tab=message&type=error&msg=${encodeURIComponent('Message cannot be empty.')}`);
      }

      const settings = await store.getSettings();
      const parentLink = `${getPortalOrigin(req)}/p/${student.parentToken}`;
      const result = await emailService.sendCustomParentNotice({
        store,
        student,
        subject,
        message,
        settings,
        parentLink
      });

      const type = result.status === 'SENT' ? 'success' : 'warning';
      const msg = result.status === 'SENT'
        ? `Email sent to ${student.parentEmail} (ID: ${result.messageId}).`
        : `Email ${result.status}: ${result.warning}`;

      return res.redirect(`${base}/students/${encodeURIComponent(student.studentId)}?tab=message&type=${encodeURIComponent(type)}&msg=${encodeURIComponent(msg)}`);
    } catch (err) {
      next(err);
    }
  });

  // Edit / Archive Student
  officeRouter.post('/students/:id', authGuard, verifyCsrf, async (req, res, next) => {
    try {
      const base = getBasePrefix(req);
      const student = await store.getStudent(req.params.id);
      if (!student) {
        return res.redirect(`${base}/students?type=error&msg=${encodeURIComponent('Student not found.')}`);
      }

      const toggleArchive = req.body.toggleArchive === '1';
      const updated = {
        ...student,
        name: String(req.body.name || student.name).trim().slice(0, 100),
        gradeLevel: String(req.body.gradeLevel ?? student.gradeLevel ?? '').trim().slice(0, 50),
        parentName: String(req.body.parentName || student.parentName).trim().slice(0, 100),
        parentEmail: String(req.body.parentEmail || student.parentEmail).trim().slice(0, 150),
        parentPhone: String(req.body.parentPhone ?? student.parentPhone ?? '').trim().slice(0, 40),
        pricePerSession: normalizePrice(req.body.pricePerSession ?? student.pricePerSession),
        notes: String(req.body.notes ?? student.notes ?? '').trim().slice(0, 500),
        archived: toggleArchive ? !student.archived : Boolean(student.archived),
        updatedAt: new Date().toISOString()
      };

      await store.saveStudent(updated);
      const dest = req.body.redirectProfile === '1'
        ? `${base}/students/${encodeURIComponent(student.studentId)}?type=success&msg=${encodeURIComponent(`Updated ${updated.name}.`)}`
        : `${base}/students?type=success&msg=${encodeURIComponent(`Updated ${updated.name}.`)}`;
      return res.redirect(dest);
    } catch (err) {
      next(err);
    }
  });

  // Regenerate Parent Token
  officeRouter.post('/students/:id/regenerate-token', authGuard, verifyCsrf, async (req, res, next) => {
    try {
      const base = getBasePrefix(req);
      const student = await store.getStudent(req.params.id);
      if (!student) {
        return res.redirect(`${base}/students?type=error&msg=${encodeURIComponent('Student not found.')}`);
      }

      const rawToken = generateToken(32);
      const updated = {
        ...student,
        parentToken: rawToken,
        parentTokenHash: hashToken(rawToken),
        updatedAt: new Date().toISOString()
      };
      await store.saveStudent(updated);
      const msg = `Regenerated private parent link for ${student.name}. Old link is now invalid.`;
      const dest = req.body.redirectProfile === '1'
        ? `${base}/students/${encodeURIComponent(student.studentId)}?type=success&msg=${encodeURIComponent(msg)}`
        : `${base}/students?type=success&msg=${encodeURIComponent(msg)}`;
      return res.redirect(dest);
    } catch (err) {
      next(err);
    }
  });

  // Invoices
  officeRouter.get('/invoices', authGuard, async (req, res, next) => {
    try {
      const base = getBasePrefix(req);
      const month = isValidMonthStr(req.query.month) ? req.query.month : currentMonthIso();
      const selectedStudentId = String(req.query.studentId || '').trim();

      const [students, monthRecords, settings] = await Promise.all([
        store.listStudents({ includeArchived: true }),
        store.listAttendanceByMonth(month),
        store.getSettings()
      ]);

      const invoices = computeMonthInvoices(students, monthRecords, settings, month);
      res.send(renderInvoicesPage({
        base,
        month,
        selectedStudentId,
        students,
        invoices,
        settings,
        csrfToken: req.portalSession.csrfToken
      }));
    } catch (err) {
      next(err);
    }
  });

  // CSV Export
  officeRouter.get('/export.csv', authGuard, async (req, res, next) => {
    try {
      const month = isValidMonthStr(req.query.month) ? req.query.month : currentMonthIso();
      const [students, monthRecords] = await Promise.all([
        store.listStudents({ includeArchived: true }),
        store.listAttendanceByMonth(month)
      ]);
      const csv = buildCsvExport(students, monthRecords, month);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="tutortime-attendance-${month}.csv"`);
      res.send(csv);
    } catch (err) {
      next(err);
    }
  });

  // Email Logs
  officeRouter.get('/emails', authGuard, async (req, res, next) => {
    try {
      const base = getBasePrefix(req);
      const month = isValidMonthStr(req.query.month) ? req.query.month : currentMonthIso();
      const [logs, settings] = await Promise.all([
        store.listEmailLogs(month),
        store.getSettings()
      ]);
      res.send(renderEmailsPage({
        base,
        month,
        logs,
        settings,
        csrfToken: req.portalSession.csrfToken
      }));
    } catch (err) {
      next(err);
    }
  });

  // Settings Page
  officeRouter.get('/settings', authGuard, async (req, res, next) => {
    try {
      const base = getBasePrefix(req);
      const settings = await store.getSettings();
      const flash = req.query.msg
        ? { type: req.query.type || 'success', message: String(req.query.msg) }
        : null;
      res.send(renderSettingsPage({
        base,
        settings,
        flash,
        csrfToken: req.portalSession.csrfToken
      }));
    } catch (err) {
      next(err);
    }
  });

  officeRouter.post('/settings', authGuard, verifyCsrf, async (req, res, next) => {
    try {
      const base = getBasePrefix(req);
      const current = await store.getSettings();
      const updated = {
        ...current,
        tutorDisplayName: String(req.body.tutorDisplayName || 'Teacher Cassie').trim().slice(0, 80),
        replyToEmail: String(req.body.replyToEmail || 'Cassie@tutortime.ai').trim().slice(0, 150),
        defaultPricePerSession: normalizePrice(req.body.defaultPricePerSession ?? 50),
        currencySymbol: String(req.body.currencySymbol || '$').trim().slice(0, 5) || '$',
        lateIsBillable: req.body.lateIsBillable === '1',
        sendParentEmails: req.body.sendParentEmails === '1',
        showProgressOnParentView: req.body.showProgressOnParentView === '1'
      };
      await store.saveSettings(updated);
      return res.redirect(`${base}/settings?type=success&msg=${encodeURIComponent('Settings saved.')}`);
    } catch (err) {
      next(err);
    }
  });

  // Parent Read-Only Router (/p/:token)
  const parentRouter = express.Router();
  parentRouter.use(setPrivateHeaders);

  parentRouter.get('/:token', async (req, res, next) => {
    try {
      const rawToken = String(req.params.token || '').trim();
      if (!rawToken || rawToken.length < 16) {
        return res.status(404).send('Not Found');
      }

      const tokenHash = hashToken(rawToken);
      const student = await store.getStudentByTokenHash(tokenHash);
      if (!student) {
        return res.status(404).send('Not Found');
      }

      const month = isValidMonthStr(req.query.month) ? req.query.month : currentMonthIso();
      const [monthRecords, progressNotes, settings] = await Promise.all([
        store.listAttendanceByMonth(month),
        store.listProgressNotes(student.studentId),
        store.getSettings()
      ]);

      // Strictly filter to only this student's records
      const studentOnlyRecords = monthRecords.filter(r => r.studentId === student.studentId);
      const summary = computeStudentMonthSummary(student, studentOnlyRecords, settings);

      res.send(renderParentViewPage({
        student,
        summary,
        progressNotes,
        month,
        settings
      }));
    } catch (err) {
      next(err);
    }
  });

  return {
    officeRouter,
    parentRouter,
    isCheckinHost
  };
}

module.exports = {
  createPortalRouters,
  isCheckinHost
};
