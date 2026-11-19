/**
 * Server-Rendered HTML Templates for Kashamar's QuickSchools-Inspired SIS Portal & Parent View
 * All dynamic values escaped via escapeHtml(); strictly CSP-compliant.
 */

const { escapeHtml } = require('../shared/templates/layout');
const { normalizePrice } = require('./billing');

function formatMoney(amount, currencySymbol = '$') {
  return `${currencySymbol}${normalizePrice(amount).toFixed(2)}`;
}

function renderFlash(flash) {
  if (!flash || !flash.message) return '';
  const cls = flash.type === 'warning'
    ? 'portal-alert-warning'
    : flash.type === 'error'
      ? 'portal-alert-error'
      : 'portal-alert-success';
  return `<div class="portal-alert ${cls}" role="status">${escapeHtml(flash.message)}</div>`;
}

function renderPortalHead(title) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow, noarchive">
  <title>${escapeHtml(title)} | Tutor Time SIS</title>
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/favicon-32x32.png">
  <link rel="stylesheet" href="/css/tokens.css">
  <link rel="stylesheet" href="/css/portal.css">
  <script src="/js/portal.js" defer></script>
</head>`;
}

function renderPortalShell({ title, base, activeTab, csrfToken, flash, bodyHtml }) {
  const navItems = [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard', href: `${base || '/'}` },
    { id: 'attendance', icon: '✓', label: 'Roll Call', href: `${base}/attendance` },
    { id: 'students', icon: '👥', label: 'Students', href: `${base}/students` },
    { id: 'invoices', icon: '🧾', label: 'Fee & Invoices', href: `${base}/invoices` },
    { id: 'emails', icon: '✉️', label: 'Parent Notices', href: `${base}/emails` },
    { id: 'settings', icon: '⚙️', label: 'Settings', href: `${base}/settings` }
  ];

  return `${renderPortalHead(title)}
<body class="portal-body">
  <div class="qs-shell">
    <div class="qs-backdrop" data-sidebar-backdrop></div>
    <aside class="qs-sidebar no-print" aria-label="Portal Sidebar">
      <div>
        <a href="${escapeHtml(base || '/')}" class="portal-brand">
          <img src="/assets/logos/tutor-time-logo.png" alt="Tutor Time" width="36" height="36">
          <span>
            <span class="portal-brand-title">Tutor Time</span>
            <span class="portal-brand-sub">Teacher Cassie SIS</span>
          </span>
        </a>

        <nav class="qs-sidebar-nav" aria-label="Primary Navigation">
          ${navItems.map(item => `
            <a href="${escapeHtml(item.href)}" class="qs-nav-item ${activeTab === item.id ? 'active' : ''}">
              <span class="qs-nav-icon" aria-hidden="true">${item.icon}</span>
              <span>${escapeHtml(item.label)}</span>
            </a>
          `).join('')}
        </nav>
      </div>

      <div class="qs-sidebar-footer">
        <div class="qs-user-chip">
          <strong>Kashamar</strong>
          <span>Admin &bull; Teacher Cassie</span>
        </div>
        <form method="POST" action="${escapeHtml(base)}/logout">
          <input type="hidden" name="_csrf" value="${escapeHtml(csrfToken)}">
          <button type="submit" class="portal-btn portal-btn-secondary portal-btn-sm" style="width:100%;">Log out</button>
        </form>
      </div>
    </aside>

    <div class="qs-content-wrap">
      <header class="qs-topbar no-print">
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <button type="button" class="qs-menu-btn" data-sidebar-toggle aria-expanded="false" aria-label="Toggle navigation">&#9776; Menu</button>
          <span class="qs-topbar-title">${escapeHtml(title)}</span>
        </div>
        <div class="portal-inline-actions">
          <a href="${escapeHtml(base)}/attendance" class="portal-btn portal-btn-primary portal-btn-sm">Take Roll Call</a>
        </div>
      </header>

      <main class="qs-main">
        ${renderFlash(flash)}
        ${bodyHtml}
      </main>
    </div>
  </div>
</body>
</html>`;
}

function renderLoginPage({ base, error }) {
  return `${renderPortalHead('Sign In')}
<body class="portal-body">
  <div class="portal-auth-shell">
    <div class="portal-auth-card">
      <aside class="portal-auth-aside">
        <div>
          <span class="portal-auth-aside-badge">Private Tutor SIS</span>
          <h2>Tutor Time with Teacher Cassie</h2>
          <p>Roll-call attendance, student profiles, homework notes, parent notices, and monthly fee statements in one workspace.</p>
        </div>
        <div style="font-size:0.84rem;opacity:0.85;">
          Protected workspace &bull; Encrypted sessions &bull; Not indexed
        </div>
      </aside>
      <section class="portal-auth-main">
        <h1>Sign in</h1>
        <p style="color:#4A5568;font-size:0.92rem;margin:0 0 1.25rem;">Enter your account details to open your school office.</p>
        ${error ? `<div class="portal-alert portal-alert-error" role="alert">${escapeHtml(error)}</div>` : ''}
        <form method="POST" action="${escapeHtml(base)}/login">
          <div class="portal-field" style="margin-bottom:0.95rem;">
            <label for="username">Username</label>
            <input id="username" name="username" type="text" required autocomplete="username" value="kashamar">
          </div>
          <div class="portal-field" style="margin-bottom:1.25rem;">
            <label for="password">Password</label>
            <input id="password" name="password" type="password" required autocomplete="current-password">
          </div>
          <button type="submit" class="portal-btn portal-btn-primary" style="width:100%;">Open Office</button>
        </form>
      </section>
    </div>
  </div>
</body>
</html>`;
}

function renderChangePasswordPage({ base, error, mustChange, csrfToken }) {
  const heading = mustChange ? 'Set your password' : 'Change password';
  const note = mustChange
    ? 'Replace your temporary password with a private passphrase before continuing.'
    : 'Choose a strong password of at least 10 characters.';

  return `${renderPortalHead(heading)}
<body class="portal-body">
  <div class="portal-auth-shell">
    <div class="portal-auth-card">
      <aside class="portal-auth-aside">
        <div>
          <span class="portal-auth-aside-badge">Account Security</span>
          <h2>Keep student records safe</h2>
          <p>Your password is stored using a salted scrypt hash and never logged or shared.</p>
        </div>
        <div style="font-size:0.84rem;opacity:0.85;">Minimum 10 characters recommended.</div>
      </aside>
      <section class="portal-auth-main">
        <h1>${escapeHtml(heading)}</h1>
        <p style="color:#4A5568;font-size:0.92rem;margin:0 0 1.25rem;">${escapeHtml(note)}</p>
        ${error ? `<div class="portal-alert portal-alert-error" role="alert">${escapeHtml(error)}</div>` : ''}
        <form method="POST" action="${escapeHtml(base)}/change-password">
          <input type="hidden" name="_csrf" value="${escapeHtml(csrfToken)}">
          <div class="portal-field" style="margin-bottom:0.95rem;">
            <label for="newPassword">New password (min 10 characters)</label>
            <input id="newPassword" name="newPassword" type="password" minlength="10" required autocomplete="new-password">
          </div>
          <div class="portal-field" style="margin-bottom:1.25rem;">
            <label for="confirmPassword">Confirm new password</label>
            <input id="confirmPassword" name="confirmPassword" type="password" minlength="10" required autocomplete="new-password">
          </div>
          <button type="submit" class="portal-btn portal-btn-primary" style="width:100%;">Save password</button>
        </form>
        ${!mustChange ? `<p style="margin-top:1rem;"><a href="${escapeHtml(base || '/')}" style="color:#028090;font-weight:700;text-decoration:none;">Back to Dashboard</a></p>` : ''}
      </section>
    </div>
  </div>
</body>
</html>`;
}

function renderDashboardPage({ base, today, month, students, todayRecords, monthInvoices, recentLogs, settings, flash, csrfToken }) {
  const cur = settings.currencySymbol || '$';
  const activeStudents = students.filter(s => !s.archived);
  const markedMap = new Map(todayRecords.map(r => [r.studentId, r]));

  const bodyHtml = `
    <div class="portal-page-head">
      <div>
        <h1>School Dashboard</h1>
        <p>Welcome back, Teacher Cassie. Today is <span class="num">${escapeHtml(today)}</span>.</p>
      </div>
      <div class="portal-inline-actions">
        <a href="${escapeHtml(base)}/students" class="portal-btn portal-btn-secondary">Manage Students</a>
        <a href="${escapeHtml(base)}/attendance?date=${escapeHtml(today)}" class="portal-btn portal-btn-primary">Open Roll Call</a>
      </div>
    </div>

    <div class="portal-grid">
      <div class="portal-stat">
        <div class="portal-stat-label">Active students</div>
        <div class="portal-stat-value num">${escapeHtml(String(activeStudents.length))}</div>
      </div>
      <div class="portal-stat stat-mint">
        <div class="portal-stat-label">Marked today</div>
        <div class="portal-stat-value num">${escapeHtml(String(todayRecords.length))} / ${escapeHtml(String(activeStudents.length))}</div>
      </div>
      <div class="portal-stat">
        <div class="portal-stat-label">Billable sessions (${escapeHtml(month)})</div>
        <div class="portal-stat-value num">${escapeHtml(String(monthInvoices.totalBillableSessions))}</div>
      </div>
      <div class="portal-stat stat-accent">
        <div class="portal-stat-label">Month total (${escapeHtml(month)})</div>
        <div class="portal-stat-value num">${escapeHtml(formatMoney(monthInvoices.grandTotal, cur))}</div>
      </div>
    </div>

    <div class="portal-workspace">
      <div class="portal-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.85rem;">
          <h2 style="margin:0;">Today&rsquo;s Attendance Snapshot</h2>
          <a href="${escapeHtml(base)}/attendance?date=${escapeHtml(today)}" class="portal-btn portal-btn-secondary portal-btn-sm">Edit Roll Call</a>
        </div>
        ${activeStudents.length === 0
          ? `<div class="portal-empty"><strong>No active students yet.</strong> <a href="${escapeHtml(base)}/students">Add your first student</a>.</div>`
          : `<div class="portal-table-wrap">
              <table class="portal-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Today (${escapeHtml(today)})</th>
                    <th class="num">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  ${activeStudents.map(s => {
                    const rec = markedMap.get(s.studentId);
                    return `<tr>
                      <td><a href="${escapeHtml(base)}/students/${escapeHtml(s.studentId)}" style="color:#028090;font-weight:700;text-decoration:none;">${escapeHtml(s.name)}</a></td>
                      <td>${rec ? `<span class="badge badge-${escapeHtml(rec.status)}">${escapeHtml(rec.status)}</span>` : '<span style="color:#94A3B8;">Unmarked</span>'}</td>
                      <td class="num">${escapeHtml(formatMoney(s.pricePerSession, cur))}</td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>`}
      </div>

      <div class="portal-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.85rem;">
          <h2 style="margin:0;">Recent Parent Notices</h2>
          <a href="${escapeHtml(base)}/emails" class="portal-btn portal-btn-secondary portal-btn-sm">View All</a>
        </div>
        ${recentLogs.length === 0
          ? '<div class="portal-empty">No parent emails sent this month yet.</div>'
          : `<div class="portal-table-wrap">
              <table class="portal-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${recentLogs.slice(0, 6).map(l => `<tr>
                    <td><strong>${escapeHtml(l.studentName || l.studentId)}</strong><br><span style="font-size:0.78rem;color:#64748B;">${escapeHtml(l.recipientEmail)}</span></td>
                    <td><span class="badge badge-${escapeHtml(String(l.status || '').toLowerCase())}">${escapeHtml(l.status)}</span></td>
                  </tr>`).join('')}
                </tbody>
              </table>
            </div>`}
      </div>
    </div>
  `;

  return renderPortalShell({
    title: 'Dashboard',
    base,
    activeTab: 'dashboard',
    csrfToken,
    flash,
    bodyHtml
  });
}

function shiftIsoDate(isoDate, deltaDays) {
  const parts = String(isoDate).split('-').map(Number);
  if (parts.length !== 3) return isoDate;
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + deltaDays));
  return d.toISOString().slice(0, 10);
}

function getInitials(name) {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function renderAttendancePage({ base, date, month, students, monthRecords, monthInvoices, settings, flash, csrfToken }) {
  const cur = settings.currencySymbol || '$';
  const activeStudents = students.filter(s => !s.archived);
  const dateRecords = monthRecords.filter(r => r.date === date);
  const recordByStudent = new Map(dateRecords.map(r => [r.studentId, r]));

  const prevDate = shiftIsoDate(date, -1);
  const nextDate = shiftIsoDate(date, 1);
  const todayStr = new Date().toISOString().slice(0, 10);

  let countPresent = 0;
  let countLate = 0;
  let countAbsent = 0;
  let countCancelled = 0;
  for (const r of dateRecords) {
    if (r.status === 'present') countPresent++;
    else if (r.status === 'late') countLate++;
    else if (r.status === 'absent') countAbsent++;
    else if (r.status === 'cancelled') countCancelled++;
  }
  const countUnmarked = Math.max(0, activeStudents.length - dateRecords.length);

  const bodyHtml = `
    <div class="portal-page-head">
      <div>
        <h1>Roll-Call Attendance</h1>
        <p>Daily attendance sheet for <strong class="num">${escapeHtml(date)}</strong>.</p>
      </div>
      <div class="portal-inline-actions">
        <a href="${escapeHtml(base)}/export.csv?month=${escapeHtml(month)}" class="portal-btn portal-btn-secondary">Export CSV (${escapeHtml(month)})</a>
        <a href="${escapeHtml(base)}/invoices?month=${escapeHtml(month)}" class="portal-btn portal-btn-primary">Fee &amp; Invoices</a>
      </div>
    </div>

    <div class="portal-card">
      <div class="qs-rc-toolbar">
        <div class="qs-rc-date-nav">
          <a href="${escapeHtml(base)}/attendance?date=${escapeHtml(prevDate)}&month=${escapeHtml(prevDate.slice(0, 7))}" class="portal-btn portal-btn-secondary portal-btn-sm" aria-label="Previous day">&larr; Prev</a>
          <form method="GET" action="${escapeHtml(base)}/attendance" style="display:inline-flex;gap:0.35rem;align-items:center;">
            <input id="date-picker" name="date" type="date" value="${escapeHtml(date)}" aria-label="Session date">
            <input type="hidden" name="month" value="${escapeHtml(month)}">
            <button type="submit" class="portal-btn portal-btn-secondary portal-btn-sm">Go</button>
          </form>
          <a href="${escapeHtml(base)}/attendance?date=${escapeHtml(nextDate)}&month=${escapeHtml(nextDate.slice(0, 7))}" class="portal-btn portal-btn-secondary portal-btn-sm" aria-label="Next day">Next &rarr;</a>
          <a href="${escapeHtml(base)}/attendance?date=${escapeHtml(todayStr)}&month=${escapeHtml(todayStr.slice(0, 7))}" class="portal-btn portal-btn-secondary portal-btn-sm">Today</a>
        </div>

        <div class="portal-inline-actions">
          <input type="search" class="qs-search" placeholder="Filter students..." data-table-filter="#rollcall-grid-table tbody tr" aria-label="Filter roll call students">
          ${activeStudents.length > 0 ? `<button type="button" class="portal-btn portal-btn-secondary portal-btn-sm" data-mark-all="present">Mark All Present</button>` : ''}
        </div>
      </div>

      <div class="qs-rc-counters" aria-label="Daily Attendance Summary">
        <span class="qs-rc-counter c-present">Present: <strong class="num">${countPresent}</strong></span>
        <span class="qs-rc-counter c-late">Late: <strong class="num">${countLate}</strong></span>
        <span class="qs-rc-counter c-absent">Absent: <strong class="num">${countAbsent}</strong></span>
        <span class="qs-rc-counter c-cancelled">Cancelled: <strong class="num">${countCancelled}</strong></span>
        <span class="qs-rc-counter">Unmarked: <strong class="num">${countUnmarked}</strong></span>
      </div>

      ${activeStudents.length === 0
        ? `<div class="portal-empty">
            <p style="margin:0 0 0.75rem;"><strong>No active students yet.</strong> Enroll a student to start taking roll call.</p>
            <a href="${escapeHtml(base)}/students" class="portal-btn portal-btn-primary">Enroll first student</a>
          </div>`
        : `<form method="POST" action="${escapeHtml(base)}/attendance/batch" id="rollcall-batch-form">
            <input type="hidden" name="_csrf" value="${escapeHtml(csrfToken)}">
            <input type="hidden" name="date" value="${escapeHtml(date)}">
            <input type="hidden" name="month" value="${escapeHtml(month)}">
            <div class="portal-table-wrap">
              <table class="portal-table qs-rollcall-table" id="rollcall-grid-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Attendance</th>
                    <th>Session Note</th>
                    <th>Saved</th>
                  </tr>
                </thead>
                <tbody>
                  ${activeStudents.map(s => {
                    const existing = recordByStudent.get(s.studentId);
                    const curStatus = existing ? existing.status : '';
                    return `<tr class="${existing ? 'qs-rc-row-saved' : ''}" data-search="${escapeHtml(`${s.name} ${s.gradeLevel || ''}`)}">
                      <td>
                        <div class="qs-student-cell">
                          <span class="qs-avatar" aria-hidden="true">${escapeHtml(getInitials(s.name))}</span>
                          <div>
                            <a href="${escapeHtml(base)}/students/${escapeHtml(s.studentId)}" style="color:#1C2434;font-weight:700;text-decoration:none;">${escapeHtml(s.name)}</a>
                            <div style="font-size:0.78rem;color:#64748B;">${s.gradeLevel ? `${escapeHtml(s.gradeLevel)} &bull; ` : ''}<span class="num">${escapeHtml(formatMoney(s.pricePerSession, cur))}</span></div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div class="qs-pill-group" role="radiogroup" aria-label="Status for ${escapeHtml(s.name)}">
                          ${[
                            { v: 'present', label: 'P · Present' },
                            { v: 'late', label: 'L · Late' },
                            { v: 'absent', label: 'A · Absent' },
                            { v: 'cancelled', label: 'C · Cancelled' }
                          ].map(st => `
                            <label class="qs-pill">
                              <input type="radio" name="status_${escapeHtml(s.studentId)}" value="${st.v}" ${curStatus === st.v ? 'checked' : ''}>
                              <span>${st.label}</span>
                            </label>
                          `).join('')}
                        </div>
                      </td>
                      <td>
                        <input type="text" name="note_${escapeHtml(s.studentId)}" value="${escapeHtml(existing ? existing.note || '' : '')}" maxlength="400" placeholder="Add session note..." style="width:100%;min-width:170px;padding:0.45rem 0.65rem;border:1.5px solid #D8CFC0;border-radius:8px;font-family:inherit;font-size:0.86rem;">
                      </td>
                      <td>
                        ${existing
                          ? `<button type="submit" form="undo-${escapeHtml(s.studentId)}" class="portal-btn portal-btn-danger portal-btn-sm">Undo</button>`
                          : '<span style="font-size:0.8rem;color:#94A3B8;">&mdash;</span>'}
                      </td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>
            <div class="portal-inline-actions" style="justify-content:space-between;margin-top:1rem;">
              <label class="portal-checkbox">
                <input type="checkbox" name="skipEmail" value="1">
                <span>Save without emailing parents</span>
              </label>
              <button type="submit" class="portal-btn portal-btn-primary">Save Roll Call &amp; Notify Parents</button>
            </div>
          </form>
          ${activeStudents.filter(s => recordByStudent.has(s.studentId)).map(s => `
            <form id="undo-${escapeHtml(s.studentId)}" method="POST" action="${escapeHtml(base)}/attendance/delete" data-confirm="Undo ${escapeHtml(s.name)}'s entry for ${escapeHtml(date)}?" style="display:none;">
              <input type="hidden" name="_csrf" value="${escapeHtml(csrfToken)}">
              <input type="hidden" name="date" value="${escapeHtml(date)}">
              <input type="hidden" name="month" value="${escapeHtml(month)}">
              <input type="hidden" name="studentId" value="${escapeHtml(s.studentId)}">
            </form>
          `).join('')}`}
    </div>

    <div class="portal-card">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.85rem;">
        <h2 style="margin:0;">Month Running Totals (${escapeHtml(month)})</h2>
        <form method="GET" action="${escapeHtml(base)}/attendance" class="portal-inline-actions">
          <input type="hidden" name="date" value="${escapeHtml(date)}">
          <input name="month" type="month" value="${escapeHtml(month)}" style="padding:0.38rem 0.6rem;border:1.5px solid #D8CFC0;border-radius:8px;font-family:inherit;font-weight:600;">
          <button type="submit" class="portal-btn portal-btn-secondary portal-btn-sm">Switch Month</button>
        </form>
      </div>
      ${monthInvoices.studentInvoices.length === 0
        ? '<div class="portal-empty">No attendance logged for this month yet.</div>'
        : `<div class="portal-table-wrap">
            <table class="portal-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th class="num">Present</th>
                  <th class="num">Late</th>
                  <th class="num">Absent/Canc.</th>
                  <th class="num">Billable</th>
                  <th class="num">Total</th>
                </tr>
              </thead>
              <tbody>
                ${monthInvoices.studentInvoices.map(inv => `<tr>
                  <td><strong>${escapeHtml(inv.student.name)}</strong></td>
                  <td class="num">${inv.presentCount}</td>
                  <td class="num">${inv.lateCount}</td>
                  <td class="num">${inv.absentCount + inv.cancelledCount}</td>
                  <td class="num">${inv.billableCount}</td>
                  <td class="num"><strong>${escapeHtml(formatMoney(inv.totalAmount, cur))}</strong></td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>`}
    </div>
  `;

  return renderPortalShell({
    title: 'Roll Call',
    base,
    activeTab: 'attendance',
    csrfToken,
    flash,
    bodyHtml
  });
}

function renderStudentsPage({ base, students, includeArchived, portalOrigin, settings, flash, csrfToken }) {
  const cur = settings.currencySymbol || '$';
  const defaultPrice = settings.defaultPricePerSession || 50;

  const bodyHtml = `
    <div class="portal-page-head">
      <div>
        <h1>Student Directory (SIS)</h1>
        <p>Click any student to open their full profile, attendance history, homework notes, and private parent link.</p>
      </div>
      <div class="portal-inline-actions">
        <input type="search" class="qs-search" placeholder="Search student or parent..." data-table-filter="#student-roster-table tbody tr" aria-label="Search students">
        <a href="${escapeHtml(base)}/students${includeArchived ? '' : '?archived=1'}" class="portal-btn portal-btn-secondary">
          ${includeArchived ? 'Hide archived' : 'Show archived'}
        </a>
      </div>
    </div>

    <div class="portal-card">
      <h2>Enrolled Students (${students.length})</h2>
      ${students.length === 0
        ? '<div class="portal-empty">No students found. Use the form below to enroll your first student.</div>'
        : `<div class="portal-table-wrap">
            <table class="portal-table" id="student-roster-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Guardian</th>
                  <th>Status</th>
                  <th class="num">Rate</th>
                  <th>Parent Link</th>
                  <th>Profile</th>
                </tr>
              </thead>
              <tbody>
                ${students.map(stu => {
                  const parentUrl = `${portalOrigin}/p/${stu.parentToken}`;
                  return `<tr data-search="${escapeHtml(`${stu.name} ${stu.parentName} ${stu.parentEmail} ${stu.gradeLevel || ''}`)}">
                    <td>
                      <a href="${escapeHtml(base)}/students/${escapeHtml(stu.studentId)}" style="color:#028090;font-weight:700;text-decoration:none;">${escapeHtml(stu.name)}</a>
                      ${stu.gradeLevel ? `<div style="font-size:0.78rem;color:#64748B;">${escapeHtml(stu.gradeLevel)}</div>` : ''}
                    </td>
                    <td>
                      <strong>${escapeHtml(stu.parentName)}</strong>
                      <div style="font-size:0.8rem;color:#64748B;">${escapeHtml(stu.parentEmail)}</div>
                    </td>
                    <td>${stu.archived ? '<span class="badge badge-archived">Archived</span>' : '<span class="badge badge-present">Active</span>'}</td>
                    <td class="num">${escapeHtml(formatMoney(stu.pricePerSession, cur))}</td>
                    <td>
                      <div class="portal-inline-actions">
                        <button type="button" class="portal-btn portal-btn-secondary portal-btn-sm" data-copy-text="${escapeHtml(parentUrl)}">Copy Link</button>
                        <a href="${escapeHtml(parentUrl)}" target="_blank" rel="noopener" class="portal-btn portal-btn-secondary portal-btn-sm">Preview</a>
                      </div>
                    </td>
                    <td>
                      <a href="${escapeHtml(base)}/students/${escapeHtml(stu.studentId)}" class="portal-btn portal-btn-primary portal-btn-sm">Open Profile</a>
                    </td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>`}
    </div>

    <div class="portal-card">
      <h2>Enroll New Student</h2>
      <form method="POST" action="${escapeHtml(base)}/students">
        <input type="hidden" name="_csrf" value="${escapeHtml(csrfToken)}">
        <div class="portal-form-row">
          <div class="portal-field">
            <label for="stu-name">Student name</label>
            <input id="stu-name" name="name" type="text" required maxlength="100">
          </div>
          <div class="portal-field">
            <label for="stu-grade">Grade / level (optional)</label>
            <input id="stu-grade" name="gradeLevel" type="text" maxlength="50" placeholder="e.g., Grade 5 / CPEA">
          </div>
          <div class="portal-field">
            <label for="stu-parent">Parent / guardian name</label>
            <input id="stu-parent" name="parentName" type="text" required maxlength="100">
          </div>
          <div class="portal-field">
            <label for="stu-email">Parent email</label>
            <input id="stu-email" name="parentEmail" type="email" required maxlength="150">
          </div>
        </div>
        <div class="portal-form-row">
          <div class="portal-field">
            <label for="stu-phone">Parent phone (optional)</label>
            <input id="stu-phone" name="parentPhone" type="text" maxlength="40">
          </div>
          <div class="portal-field">
            <label for="stu-price">Per-session price (${escapeHtml(cur)})</label>
            <input id="stu-price" name="pricePerSession" type="number" step="0.01" min="0" required value="${escapeHtml(String(defaultPrice))}">
          </div>
        </div>
        <div class="portal-field" style="margin-bottom:0.95rem;">
          <label for="stu-notes">Notes (optional)</label>
          <input id="stu-notes" name="notes" type="text" maxlength="500" placeholder="Focus areas, learning preferences, or schedule notes">
        </div>
        <button type="submit" class="portal-btn portal-btn-primary">Add student</button>
      </form>
    </div>
  `;

  return renderPortalShell({
    title: 'Students',
    base,
    activeTab: 'students',
    csrfToken,
    flash,
    bodyHtml
  });
}

function renderStudentProfilePage({ base, student, tab, month, summary, progressNotes, portalOrigin, settings, flash, csrfToken }) {
  const cur = settings.currencySymbol || '$';
  const parentUrl = `${portalOrigin}/p/${student.parentToken}`;
  const tabs = [
    { id: 'overview', label: 'Profile & Guardian' },
    { id: 'attendance', label: 'Attendance History' },
    { id: 'progress', label: 'Homework & Mastery' },
    { id: 'message', label: 'Message Parent' }
  ];

  let tabContent = '';
  if (tab === 'attendance') {
    tabContent = `
      <div class="portal-card">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.85rem;">
          <h2 style="margin:0;">Attendance History (${escapeHtml(month)})</h2>
          <form method="GET" action="${escapeHtml(base)}/students/${escapeHtml(student.studentId)}" class="portal-inline-actions">
            <input type="hidden" name="tab" value="attendance">
            <input name="month" type="month" value="${escapeHtml(month)}" style="padding:0.4rem 0.6rem;border:1.5px solid #D8CFC0;border-radius:8px;font-family:inherit;font-weight:600;">
            <button type="submit" class="portal-btn portal-btn-secondary portal-btn-sm">Load</button>
          </form>
        </div>
        <p style="margin:0 0 1rem;color:#4A5568;">
          Billable sessions: <strong class="num">${summary.billableCount}</strong> &bull;
          Month total: <strong class="num">${escapeHtml(formatMoney(summary.totalAmount, cur))}</strong>
        </p>
        ${summary.sessions.length === 0
          ? '<div class="portal-empty">No attendance entries for this month.</div>'
          : `<div class="portal-table-wrap">
              <table class="portal-table">
                <thead><tr><th>Date</th><th>Status</th><th>Note</th><th class="num">Fee</th></tr></thead>
                <tbody>
                  ${summary.sessions.map(s => `<tr>
                    <td class="num">${escapeHtml(s.date)}</td>
                    <td><span class="badge badge-${escapeHtml(s.status)}">${escapeHtml(s.status)}</span></td>
                    <td>${escapeHtml(s.note || '')}</td>
                    <td class="num">${s.billable ? escapeHtml(formatMoney(s.appliedPrice, cur)) : '$0.00'}</td>
                  </tr>`).join('')}
                </tbody>
              </table>
            </div>`}
      </div>
    `;
  } else if (tab === 'progress') {
    tabContent = `
      <div class="portal-card">
        <h2>Log Homework &amp; Mastery Note</h2>
        <form method="POST" action="${escapeHtml(base)}/students/${escapeHtml(student.studentId)}/progress">
          <input type="hidden" name="_csrf" value="${escapeHtml(csrfToken)}">
          <div class="portal-form-row">
            <div class="portal-field">
              <label for="prog-date">Date</label>
              <input id="prog-date" name="date" type="date" required value="${escapeHtml(new Date().toISOString().slice(0, 10))}">
            </div>
            <div class="portal-field">
              <label for="prog-topic">Topic / Skill</label>
              <input id="prog-topic" name="topic" type="text" required maxlength="120" placeholder="e.g., Equivalent Fractions">
            </div>
            <div class="portal-field">
              <label for="prog-mastery">Mastery / Score</label>
              <input id="prog-mastery" name="mastery" type="text" maxlength="60" placeholder="e.g., 9/10 or Mastered">
            </div>
          </div>
          <div class="portal-field" style="margin-bottom:0.9rem;">
            <label for="prog-hw">Homework / Next Steps</label>
            <input id="prog-hw" name="homework" type="text" maxlength="400" placeholder="e.g., Complete worksheet p.14 #1-8">
          </div>
          <button type="submit" class="portal-btn portal-btn-primary">Save Progress Note</button>
        </form>
      </div>

      <div class="portal-card">
        <h2>Recorded Notes (${progressNotes.length})</h2>
        ${progressNotes.length === 0
          ? '<div class="portal-empty">No homework or mastery notes recorded yet.</div>'
          : `<div class="portal-table-wrap">
              <table class="portal-table">
                <thead><tr><th>Date</th><th>Topic</th><th>Mastery</th><th>Homework</th><th>Remove</th></tr></thead>
                <tbody>
                  ${progressNotes.map(n => `<tr>
                    <td class="num">${escapeHtml(n.date)}</td>
                    <td><strong>${escapeHtml(n.topic)}</strong></td>
                    <td>${escapeHtml(n.mastery || '')}</td>
                    <td>${escapeHtml(n.homework || '')}</td>
                    <td>
                      <form method="POST" action="${escapeHtml(base)}/students/${escapeHtml(student.studentId)}/progress/${escapeHtml(n.noteId)}/delete" data-confirm="Remove this progress note?">
                        <input type="hidden" name="_csrf" value="${escapeHtml(csrfToken)}">
                        <input type="hidden" name="date" value="${escapeHtml(n.date)}">
                        <button type="submit" class="portal-btn portal-btn-danger portal-btn-sm">Delete</button>
                      </form>
                    </td>
                  </tr>`).join('')}
                </tbody>
              </table>
            </div>`}
      </div>
    `;
  } else if (tab === 'message') {
    tabContent = `
      <div class="portal-card">
        <h2>Send Direct Notice to ${escapeHtml(student.parentName)}</h2>
        <p style="color:#4A5568;font-size:0.9rem;">Sends via SES to <strong>${escapeHtml(student.parentEmail)}</strong> with Reply-To set to ${escapeHtml(settings.replyToEmail || 'Cassie@tutortime.ai')}.</p>
        <form method="POST" action="${escapeHtml(base)}/students/${escapeHtml(student.studentId)}/notify">
          <input type="hidden" name="_csrf" value="${escapeHtml(csrfToken)}">
          <div class="portal-field" style="margin-bottom:0.85rem;">
            <label for="msg-subject">Subject</label>
            <input id="msg-subject" name="subject" type="text" required maxlength="150" value="Tutor Time Update: ${escapeHtml(student.name)}">
          </div>
          <div class="portal-field" style="margin-bottom:0.95rem;">
            <label for="msg-body">Message</label>
            <textarea id="msg-body" name="message" rows="5" required maxlength="2000" placeholder="Share a progress update, homework reminder, or scheduling note..."></textarea>
          </div>
          <button type="submit" class="portal-btn portal-btn-primary">Send Email via SES</button>
        </form>
      </div>
    `;
  } else {
    tabContent = `
      <div class="portal-card">
        <h2>Profile &amp; Guardian Details</h2>
        <form method="POST" action="${escapeHtml(base)}/students/${escapeHtml(student.studentId)}">
          <input type="hidden" name="_csrf" value="${escapeHtml(csrfToken)}">
          <input type="hidden" name="redirectProfile" value="1">
          <div class="portal-form-row">
            <div class="portal-field">
              <label>Student name</label>
              <input name="name" type="text" required value="${escapeHtml(student.name)}">
            </div>
            <div class="portal-field">
              <label>Grade / level</label>
              <input name="gradeLevel" type="text" value="${escapeHtml(student.gradeLevel || '')}">
            </div>
            <div class="portal-field">
              <label>Parent name</label>
              <input name="parentName" type="text" required value="${escapeHtml(student.parentName)}">
            </div>
            <div class="portal-field">
              <label>Parent email</label>
              <input name="parentEmail" type="email" required value="${escapeHtml(student.parentEmail)}">
            </div>
          </div>
          <div class="portal-form-row">
            <div class="portal-field">
              <label>Parent phone</label>
              <input name="parentPhone" type="text" value="${escapeHtml(student.parentPhone || '')}">
            </div>
            <div class="portal-field">
              <label>Price (${escapeHtml(cur)})</label>
              <input name="pricePerSession" type="number" step="0.01" min="0" required value="${escapeHtml(String(student.pricePerSession))}">
            </div>
          </div>
          <div class="portal-field" style="margin-bottom:0.95rem;">
            <label>Notes</label>
            <input name="notes" type="text" value="${escapeHtml(student.notes || '')}">
          </div>
          <div class="portal-inline-actions">
            <button type="submit" class="portal-btn portal-btn-primary">Save Profile</button>
            <button type="submit" name="toggleArchive" value="1" class="portal-btn portal-btn-secondary">
              ${student.archived ? 'Unarchive Student' : 'Archive Student'}
            </button>
          </div>
        </form>
      </div>

      <div class="portal-card">
        <h2>Private Parent Link (No Login Required)</h2>
        <p style="color:#4A5568;font-size:0.9rem;">Only ${escapeHtml(student.name)}&rsquo;s attendance and progress are reachable via this token.</p>
        <div style="display:flex;flex-wrap:wrap;gap:0.65rem;align-items:center;justify-content:space-between;">
          <span class="portal-token-box">${escapeHtml(parentUrl)}</span>
          <div class="portal-inline-actions">
            <button type="button" class="portal-btn portal-btn-secondary portal-btn-sm" data-copy-text="${escapeHtml(parentUrl)}">Copy Link</button>
            <a href="${escapeHtml(parentUrl)}" target="_blank" rel="noopener" class="portal-btn portal-btn-secondary portal-btn-sm">Open Parent View</a>
            <form method="POST" action="${escapeHtml(base)}/students/${escapeHtml(student.studentId)}/regenerate-token" data-confirm="Regenerate this child's private link? The old link will stop working immediately." style="display:inline;">
              <input type="hidden" name="_csrf" value="${escapeHtml(csrfToken)}">
              <input type="hidden" name="redirectProfile" value="1">
              <button type="submit" class="portal-btn portal-btn-danger portal-btn-sm">Regenerate Link</button>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  const bodyHtml = `
    <div class="portal-page-head">
      <div>
        <h1>${escapeHtml(student.name)} ${student.archived ? '<span class="badge badge-archived">Archived</span>' : ''}</h1>
        <p>Guardian: ${escapeHtml(student.parentName)} &bull; Rate: <span class="num">${escapeHtml(formatMoney(student.pricePerSession, cur))}</span>/session</p>
      </div>
      <div class="portal-inline-actions">
        <a href="${escapeHtml(base)}/students" class="portal-btn portal-btn-secondary">&larr; All Students</a>
        <a href="${escapeHtml(base)}/invoices?month=${escapeHtml(month)}&studentId=${escapeHtml(student.studentId)}" class="portal-btn portal-btn-primary">Print Statement</a>
      </div>
    </div>

    <nav class="qs-tabs" aria-label="Student Profile Sections">
      ${tabs.map(t => `<a href="${escapeHtml(base)}/students/${escapeHtml(student.studentId)}?tab=${escapeHtml(t.id)}&month=${escapeHtml(month)}" class="qs-tab ${tab === t.id ? 'active' : ''}">${escapeHtml(t.label)}</a>`).join('')}
    </nav>

    ${tabContent}
  `;

  return renderPortalShell({
    title: student.name,
    base,
    activeTab: 'students',
    csrfToken,
    flash,
    bodyHtml
  });
}

function renderInvoicesPage({ base, month, selectedStudentId, students, invoices, settings, csrfToken }) {
  const cur = settings.currencySymbol || '$';
  const tutorName = settings.tutorDisplayName || 'Teacher Cassie';
  const list = selectedStudentId
    ? invoices.studentInvoices.filter(inv => inv.student.studentId === selectedStudentId)
    : invoices.studentInvoices;

  const displayTotal = list.reduce((acc, item) => acc + item.totalAmount, 0);

  const bodyHtml = `
    <div class="invoice-print-header">
      <h1 style="margin:0;">Tutor Time with ${escapeHtml(tutorName)} &mdash; Monthly Statement</h1>
      <p style="margin:0.25rem 0 0;">Billing Period: <strong>${escapeHtml(month)}</strong> | Contact: ${escapeHtml(settings.replyToEmail || 'Cassie@tutortime.ai')}</p>
    </div>

    <div class="portal-page-head no-print">
      <div>
        <h1>Fee Tracking &amp; Invoices</h1>
        <p>Live billing statements computed from ${escapeHtml(month)} attendance records.</p>
      </div>
      <button type="button" class="portal-btn portal-btn-primary" data-action="print">
        ${selectedStudentId ? 'Print this child' : 'Print all'}
      </button>
    </div>

    <div class="portal-card no-print portal-filter-bar">
      <form method="GET" action="${escapeHtml(base)}/invoices" class="portal-form-row" style="align-items:end;margin-bottom:0;">
        <div class="portal-field">
          <label for="inv-month">Month</label>
          <input id="inv-month" name="month" type="month" value="${escapeHtml(month)}">
        </div>
        <div class="portal-field">
          <label for="inv-student">Student filter</label>
          <select id="inv-student" name="studentId">
            <option value="">All Students</option>
            ${students.map(s => `<option value="${escapeHtml(s.studentId)}" ${selectedStudentId === s.studentId ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('')}
          </select>
        </div>
        <div class="portal-field">
          <button type="submit" class="portal-btn portal-btn-secondary">Update view</button>
        </div>
      </form>
    </div>

    <div class="portal-card">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;">
        <div>
          <h2 style="margin:0;">Statement Total &mdash; ${escapeHtml(month)}</h2>
          <p style="margin:0.2rem 0 0;color:#4A5568;font-size:0.9rem;">Edits to attendance recalculate totals automatically.</p>
        </div>
        <div class="portal-stat-value num" style="margin:0;">${escapeHtml(formatMoney(displayTotal, cur))}</div>
      </div>
    </div>

    ${list.length === 0
      ? '<div class="portal-card"><div class="portal-empty">No sessions or students found for this selection.</div></div>'
      : list.map(inv => `
        <div class="portal-card">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:0.75rem;margin-bottom:0.85rem;">
            <div>
              <h3 style="margin:0;font-size:1.15rem;">${escapeHtml(inv.student.name)}</h3>
              <div style="font-size:0.88rem;color:#4A5568;">
                Parent: ${escapeHtml(inv.student.parentName)} (${escapeHtml(inv.student.parentEmail)}) &bull;
                Rate: <span class="num">${escapeHtml(formatMoney(inv.student.pricePerSession, cur))}</span>/session
              </div>
            </div>
            <div style="text-align:right;">
              <div class="num" style="font-size:1.3rem;font-weight:700;color:#028090;">${escapeHtml(formatMoney(inv.totalAmount, cur))}</div>
              <div style="font-size:0.82rem;color:#64748B;">${inv.billableCount} billable of ${inv.totalSessions} sessions</div>
              <a href="${escapeHtml(base)}/invoices?month=${escapeHtml(month)}&studentId=${escapeHtml(inv.student.studentId)}" class="portal-btn portal-btn-secondary portal-btn-sm no-print" style="margin-top:0.4rem;">Focus this child</a>
            </div>
          </div>
          ${inv.sessions.length === 0
            ? '<div class="portal-empty" style="padding:0.9rem;">No sessions recorded this month.</div>'
            : `<div class="portal-table-wrap">
                <table class="portal-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Note</th>
                      <th class="num">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${inv.sessions.map(sess => `<tr>
                      <td class="num">${escapeHtml(sess.date)}</td>
                      <td><span class="badge badge-${escapeHtml(sess.status)}">${escapeHtml(sess.status)}</span></td>
                      <td>${escapeHtml(sess.note || '')}</td>
                      <td class="num">${sess.billable ? escapeHtml(formatMoney(sess.appliedPrice, cur)) : '$0.00'}</td>
                    </tr>`).join('')}
                  </tbody>
                </table>
              </div>`}
        </div>
      `).join('')}
  `;

  return renderPortalShell({
    title: `Invoices (${month})`,
    base,
    activeTab: 'invoices',
    csrfToken,
    flash: null,
    bodyHtml
  });
}

function renderSettingsPage({ base, settings, flash, csrfToken }) {
  const bodyHtml = `
    <div class="portal-page-head">
      <div>
        <h1>Office &amp; Module Settings</h1>
        <p>Configure billing rules, parent portal visibility, and SES email notifications.</p>
      </div>
    </div>

    <div class="portal-card">
      <h2>Billing &amp; Notification Preferences</h2>
      <form method="POST" action="${escapeHtml(base)}/settings">
        <input type="hidden" name="_csrf" value="${escapeHtml(csrfToken)}">
        <div class="portal-form-row">
          <div class="portal-field">
            <label for="set-tutor">Tutor display name</label>
            <input id="set-tutor" name="tutorDisplayName" type="text" required value="${escapeHtml(settings.tutorDisplayName || 'Teacher Cassie')}">
          </div>
          <div class="portal-field">
            <label for="set-replyto">Reply-To / contact email</label>
            <input id="set-replyto" name="replyToEmail" type="email" required value="${escapeHtml(settings.replyToEmail || 'Cassie@tutortime.ai')}">
          </div>
        </div>
        <div class="portal-form-row">
          <div class="portal-field">
            <label for="set-price">Default per-session price</label>
            <input id="set-price" name="defaultPricePerSession" type="number" step="0.01" min="0" required value="${escapeHtml(String(settings.defaultPricePerSession ?? 50))}">
          </div>
          <div class="portal-field">
            <label for="set-currency">Currency symbol</label>
            <input id="set-currency" name="currencySymbol" type="text" maxlength="5" required value="${escapeHtml(settings.currencySymbol || '$')}">
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:0.65rem;margin:1.1rem 0;">
          <label class="portal-checkbox">
            <input type="checkbox" name="lateIsBillable" value="1" ${settings.lateIsBillable !== false ? 'checked' : ''}>
            <span>Bill &ldquo;Late&rdquo; sessions at full per-session price</span>
          </label>
          <label class="portal-checkbox">
            <input type="checkbox" name="sendParentEmails" value="1" ${settings.sendParentEmails !== false ? 'checked' : ''}>
            <span>Send parent attendance email notifications automatically via SES</span>
          </label>
          <label class="portal-checkbox">
            <input type="checkbox" name="showProgressOnParentView" value="1" ${settings.showProgressOnParentView !== false ? 'checked' : ''}>
            <span>Show Homework &amp; Mastery notes on private parent links (/p/:token)</span>
          </label>
        </div>
        <button type="submit" class="portal-btn portal-btn-primary">Save settings</button>
      </form>
    </div>

    <div class="portal-card">
      <h3>Account Security</h3>
      <p style="color:#4A5568;font-size:0.92rem;margin:0 0 0.85rem;">Update your portal login password at any time.</p>
      <a href="${escapeHtml(base)}/change-password" class="portal-btn portal-btn-secondary">Change password</a>
    </div>
  `;

  return renderPortalShell({
    title: 'Settings',
    base,
    activeTab: 'settings',
    csrfToken,
    flash,
    bodyHtml
  });
}

function renderEmailsPage({ base, month, logs, settings, csrfToken }) {
  const bodyHtml = `
    <div class="portal-page-head">
      <div>
        <h1>Parent Notices &amp; Email Log</h1>
        <p>
          Sender: <strong>${escapeHtml(settings.senderEmail || 'noreply@mail.tutortime.ai')}</strong> &bull;
          Reply-To: <strong>${escapeHtml(settings.replyToEmail || 'Cassie@tutortime.ai')}</strong>
        </p>
      </div>
      <form method="GET" action="${escapeHtml(base)}/emails" class="portal-inline-actions">
        <input name="month" type="month" value="${escapeHtml(month)}" style="padding:0.45rem 0.65rem;border:1.5px solid #D8CFC0;border-radius:8px;font-family:inherit;font-weight:600;">
        <button type="submit" class="portal-btn portal-btn-secondary portal-btn-sm">Load month</button>
      </form>
    </div>

    <div class="portal-card">
      ${logs.length === 0
        ? '<div class="portal-empty">No email deliveries logged for this month yet.</div>'
        : `<div class="portal-table-wrap">
            <table class="portal-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Student</th>
                  <th>Recipient</th>
                  <th>Status</th>
                  <th>Message ID / Details</th>
                </tr>
              </thead>
              <tbody>
                ${logs.map(l => `<tr>
                  <td class="num" style="font-size:0.82rem;">${escapeHtml(l.createdAt)}</td>
                  <td><strong>${escapeHtml(l.studentName || l.studentId)}</strong></td>
                  <td>${escapeHtml(l.recipientEmail)}</td>
                  <td><span class="badge badge-${escapeHtml(String(l.status || '').toLowerCase())}">${escapeHtml(l.status)}</span></td>
                  <td style="font-size:0.82rem;">${escapeHtml(l.messageId || l.errorMessage || '')}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>`}
    </div>
  `;

  return renderPortalShell({
    title: 'Parent Notices',
    base,
    activeTab: 'emails',
    csrfToken,
    flash: null,
    bodyHtml
  });
}

function renderParentViewPage({ student, summary, progressNotes = [], month, settings }) {
  const cur = settings.currencySymbol || '$';
  const tutorName = settings.tutorDisplayName || 'Teacher Cassie';
  const replyTo = settings.replyToEmail || 'Cassie@tutortime.ai';
  const showProgress = settings.showProgressOnParentView !== false;

  return `${renderPortalHead(`${student.name} — Attendance`)}
<body class="portal-body">
  <header class="portal-header">
    <div class="portal-header-inner">
      <div class="portal-brand">
        <img src="/assets/logos/tutor-time-logo.png" alt="Tutor Time" width="36" height="36">
        <span>
          <span class="portal-brand-title">Tutor Time with ${escapeHtml(tutorName)}</span>
          <span class="portal-brand-sub">Private Parent Attendance &amp; Progress Summary</span>
        </span>
      </div>
      <form method="GET" class="portal-inline-actions">
        <input name="month" type="month" value="${escapeHtml(month)}" aria-label="Select month" style="padding:0.42rem 0.65rem;border:1.5px solid #D8CFC0;border-radius:8px;font-family:inherit;font-weight:600;">
        <button type="submit" class="portal-btn portal-btn-secondary portal-btn-sm">View month</button>
      </form>
    </div>
  </header>

  <main class="portal-main" style="max-width:820px;">
    <div class="portal-page-head">
      <div>
        <h1>${escapeHtml(student.name)}</h1>
        ${student.gradeLevel ? `<p>${escapeHtml(student.gradeLevel)}</p>` : ''}
      </div>
    </div>

    <div class="portal-grid">
      <div class="portal-stat">
        <div class="portal-stat-label">Month</div>
        <div class="portal-stat-value num">${escapeHtml(month)}</div>
      </div>
      <div class="portal-stat stat-mint">
        <div class="portal-stat-label">Sessions attended</div>
        <div class="portal-stat-value num">${escapeHtml(String(summary.presentCount + summary.lateCount))}</div>
      </div>
      <div class="portal-stat stat-accent">
        <div class="portal-stat-label">Recorded sessions</div>
        <div class="portal-stat-value num">${escapeHtml(String(summary.totalSessions))}</div>
      </div>
    </div>

    <div class="portal-card">
      <h2>Attendance &amp; Session Log (${escapeHtml(month)})</h2>
      ${summary.sessions.length === 0
        ? '<div class="portal-empty">No sessions recorded for this month yet.</div>'
        : `<div class="portal-table-wrap">
            <table class="portal-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Session Note</th>
                </tr>
              </thead>
              <tbody>
                ${summary.sessions.map(s => `<tr>
                  <td class="num">${escapeHtml(s.date)}</td>
                  <td><span class="badge badge-${escapeHtml(s.status)}">${escapeHtml(s.status)}</span></td>
                  <td>${escapeHtml(s.note || '')}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>`}
    </div>

    ${showProgress ? `
      <div class="portal-card">
        <h2>Homework &amp; Mastery Notes</h2>
        ${progressNotes.length === 0
          ? '<div class="portal-empty">No homework or mastery notes posted yet.</div>'
          : `<div class="portal-table-wrap">
              <table class="portal-table">
                <thead><tr><th>Date</th><th>Topic</th><th>Mastery</th><th>Homework</th></tr></thead>
                <tbody>
                  ${progressNotes.map(n => `<tr>
                    <td class="num">${escapeHtml(n.date)}</td>
                    <td><strong>${escapeHtml(n.topic)}</strong></td>
                    <td>${escapeHtml(n.mastery || '')}</td>
                    <td>${escapeHtml(n.homework || '')}</td>
                  </tr>`).join('')}
                </tbody>
              </table>
            </div>`}
      </div>` : ''}

    <div class="portal-card" style="background:#FFFDF9;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;font-size:0.9rem;color:#4A5568;">
        <span>Monthly summary (${escapeHtml(month)}): <strong class="num">${escapeHtml(String(summary.billableCount))}</strong> billable session(s)</span>
        <span>Total: <strong class="num" style="color:#1C2434;">${escapeHtml(formatMoney(summary.totalAmount, cur))}</strong></span>
      </div>
    </div>

    <p style="margin-top:1.25rem;font-size:0.88rem;color:#4A5568;">
      Questions about a session? Contact ${escapeHtml(tutorName)} at
      <a href="mailto:${escapeHtml(replyTo)}" style="color:#028090;font-weight:700;">${escapeHtml(replyTo)}</a>.
    </p>
  </main>
</body>
</html>`;
}

module.exports = {
  renderPortalShell,
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
};
