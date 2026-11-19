/**
 * Server-Rendered HTML Templates for Kashamar's Private Portal & Parent View
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
  <title>${escapeHtml(title)} | Tutor Time Office</title>
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/favicon-32x32.png">
  <link rel="stylesheet" href="/css/tokens.css">
  <link rel="stylesheet" href="/css/portal.css">
  <script src="/js/portal.js" defer></script>
</head>`;
}

function renderPortalShell({ title, base, activeTab, csrfToken, flash, bodyHtml }) {
  const navItems = [
    { id: 'attendance', label: 'Attendance', href: `${base}` || '/' },
    { id: 'students', label: 'Students', href: `${base}/students` },
    { id: 'invoices', label: 'Invoices', href: `${base}/invoices` },
    { id: 'emails', label: 'Email Log', href: `${base}/emails` },
    { id: 'settings', label: 'Settings', href: `${base}/settings` }
  ];

  return `${renderPortalHead(title)}
<body class="portal-body">
  <header class="portal-header no-print">
    <div class="portal-header-inner">
      <a href="${escapeHtml(base || '/')}" class="portal-brand">
        <img src="/assets/logos/tutor-time-logo.png" alt="Tutor Time" width="36" height="36">
        <span>
          <span class="portal-brand-title">Tutor Time</span>
          <span class="portal-brand-sub">Teacher Cassie&rsquo;s Private Office</span>
        </span>
      </a>
      <nav class="portal-nav" aria-label="Portal Navigation">
        ${navItems.map(item => `<a href="${escapeHtml(item.href)}" class="${activeTab === item.id ? 'active' : ''}">${escapeHtml(item.label)}</a>`).join('')}
        <form method="POST" action="${escapeHtml(base)}/logout" style="display:inline;">
          <input type="hidden" name="_csrf" value="${escapeHtml(csrfToken)}">
          <button type="submit" class="portal-nav-logout">Log out</button>
        </form>
      </nav>
    </div>
  </header>
  <main class="portal-main">
    ${renderFlash(flash)}
    ${bodyHtml}
  </main>
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
          <span class="portal-auth-aside-badge">Private Tutor Office</span>
          <h2>Tutor Time with Teacher Cassie</h2>
          <p>Daily session check-in, parent attendance notices, and monthly invoicing in one quiet workspace.</p>
        </div>
        <div style="font-size:0.84rem;opacity:0.85;">
          Protected workspace &bull; Encrypted sessions &bull; Not indexed
        </div>
      </aside>
      <section class="portal-auth-main">
        <h1>Sign in</h1>
        <p style="color:#4A5568;font-size:0.92rem;margin:0 0 1.25rem;">Enter your account details to open today&rsquo;s attendance desk.</p>
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
        ${!mustChange ? `<p style="margin-top:1rem;"><a href="${escapeHtml(base || '/')}" style="color:#028090;font-weight:700;text-decoration:none;">Back to Attendance</a></p>` : ''}
      </section>
    </div>
  </div>
</body>
</html>`;
}

function renderAttendancePage({ base, date, month, students, monthRecords, monthInvoices, settings, flash, csrfToken }) {
  const cur = settings.currencySymbol || '$';
  const activeStudents = students.filter(s => !s.archived);
  const dateRecords = monthRecords.filter(r => r.date === date);
  const studentMap = new Map(students.map(s => [s.studentId, s]));

  const bodyHtml = `
    <div class="portal-page-head">
      <div>
        <h1>Attendance Desk</h1>
        <p>Mark daily sessions, send parent updates, and track ${escapeHtml(month)} totals.</p>
      </div>
      <div class="portal-inline-actions">
        <a href="${escapeHtml(base)}/export.csv?month=${escapeHtml(month)}" class="portal-btn portal-btn-secondary">Export CSV (${escapeHtml(month)})</a>
        <a href="${escapeHtml(base)}/invoices?month=${escapeHtml(month)}" class="portal-btn portal-btn-primary">Monthly Invoices</a>
      </div>
    </div>

    <div class="portal-grid">
      <div class="portal-stat">
        <div class="portal-stat-label">Month total (${escapeHtml(month)})</div>
        <div class="portal-stat-value num">${escapeHtml(formatMoney(monthInvoices.grandTotal, cur))}</div>
      </div>
      <div class="portal-stat stat-mint">
        <div class="portal-stat-label">Billable sessions</div>
        <div class="portal-stat-value num">${escapeHtml(String(monthInvoices.totalBillableSessions))}</div>
      </div>
      <div class="portal-stat stat-accent">
        <div class="portal-stat-label">Active students</div>
        <div class="portal-stat-value num">${escapeHtml(String(activeStudents.length))}</div>
      </div>
    </div>

    <div class="portal-card">
      <form method="GET" action="${escapeHtml(base || '/')}" class="portal-form-row" style="align-items:end;margin-bottom:0;">
        <div class="portal-field">
          <label for="date-picker">Session date</label>
          <input id="date-picker" name="date" type="date" value="${escapeHtml(date)}">
        </div>
        <div class="portal-field">
          <label for="month-picker">Summary month</label>
          <input id="month-picker" name="month" type="month" value="${escapeHtml(month)}">
        </div>
        <div class="portal-field">
          <button type="submit" class="portal-btn portal-btn-secondary">Load date &amp; month</button>
        </div>
      </form>
    </div>

    <div class="portal-workspace">
      <div>
        <div class="portal-card">
          <h2>Mark session for ${escapeHtml(date)}</h2>
          ${activeStudents.length === 0
            ? `<div class="portal-empty">
                <p style="margin:0 0 0.75rem;"><strong>No active students yet.</strong> Add a student to begin marking attendance.</p>
                <a href="${escapeHtml(base)}/students" class="portal-btn portal-btn-primary">Add first student</a>
              </div>`
            : `<form method="POST" action="${escapeHtml(base)}/attendance">
                <input type="hidden" name="_csrf" value="${escapeHtml(csrfToken)}">
                <input type="hidden" name="date" value="${escapeHtml(date)}">
                <input type="hidden" name="month" value="${escapeHtml(month)}">
                <div class="portal-form-row">
                  <div class="portal-field">
                    <label for="att-student">Student</label>
                    <select id="att-student" name="studentId" required>
                      ${activeStudents.map(s => `<option value="${escapeHtml(s.studentId)}">${escapeHtml(s.name)} (${escapeHtml(formatMoney(s.pricePerSession, cur))})</option>`).join('')}
                    </select>
                  </div>
                  <div class="portal-field">
                    <label for="att-status">Status</label>
                    <select id="att-status" name="status" required>
                      <option value="present">Present (Billed)</option>
                      <option value="late">Late (${settings.lateIsBillable !== false ? 'Billed' : 'Not Billed'})</option>
                      <option value="absent">Absent (Not Billed)</option>
                      <option value="cancelled">Cancelled (Not Billed)</option>
                    </select>
                  </div>
                </div>
                <div class="portal-field" style="margin-bottom:0.95rem;">
                  <label for="att-note">Session note (optional, included in parent email)</label>
                  <input id="att-note" name="note" type="text" maxlength="400" placeholder="e.g., Covered fractions &amp; word problems">
                </div>
                <div class="portal-inline-actions" style="justify-content:space-between;">
                  <label class="portal-checkbox">
                    <input type="checkbox" name="skipEmail" value="1">
                    <span>Save without emailing parent</span>
                  </label>
                  <button type="submit" class="portal-btn portal-btn-primary">Save &amp; notify parent</button>
                </div>
              </form>`}
        </div>

        <div class="portal-card">
          <h2>Entries on ${escapeHtml(date)}</h2>
          ${dateRecords.length === 0
            ? '<div class="portal-empty">No attendance recorded for this date yet.</div>'
            : `<div class="portal-table-wrap">
                <table class="portal-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Status</th>
                      <th class="num">Billed</th>
                      <th>Note</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${dateRecords.map(rec => {
                      const stu = studentMap.get(rec.studentId) || { name: rec.studentId };
                      return `<tr>
                        <td><strong>${escapeHtml(stu.name)}</strong></td>
                        <td><span class="badge badge-${escapeHtml(rec.status)}">${escapeHtml(rec.status)}</span></td>
                        <td class="num">${rec.billable ? escapeHtml(formatMoney(rec.priceApplied, cur)) : '$0.00'}</td>
                        <td>${escapeHtml(rec.note || '')}</td>
                        <td>
                          <div class="portal-inline-actions">
                            <form method="POST" action="${escapeHtml(base)}/attendance" style="display:inline-flex;gap:0.3rem;align-items:center;">
                              <input type="hidden" name="_csrf" value="${escapeHtml(csrfToken)}">
                              <input type="hidden" name="date" value="${escapeHtml(date)}">
                              <input type="hidden" name="month" value="${escapeHtml(month)}">
                              <input type="hidden" name="studentId" value="${escapeHtml(rec.studentId)}">
                              <input type="hidden" name="skipEmail" value="1">
                              <select name="status" aria-label="Change status" style="padding:0.28rem 0.45rem;border-radius:7px;border:1px solid #D8CFC0;font-size:0.82rem;">
                                <option value="present" ${rec.status === 'present' ? 'selected' : ''}>present</option>
                                <option value="late" ${rec.status === 'late' ? 'selected' : ''}>late</option>
                                <option value="absent" ${rec.status === 'absent' ? 'selected' : ''}>absent</option>
                                <option value="cancelled" ${rec.status === 'cancelled' ? 'selected' : ''}>cancelled</option>
                              </select>
                              <input type="hidden" name="note" value="${escapeHtml(rec.note || '')}">
                              <button type="submit" class="portal-btn portal-btn-secondary portal-btn-sm">Update</button>
                            </form>
                            <form method="POST" action="${escapeHtml(base)}/attendance/delete" data-confirm="Undo this attendance entry?" style="display:inline;">
                              <input type="hidden" name="_csrf" value="${escapeHtml(csrfToken)}">
                              <input type="hidden" name="date" value="${escapeHtml(date)}">
                              <input type="hidden" name="month" value="${escapeHtml(month)}">
                              <input type="hidden" name="studentId" value="${escapeHtml(rec.studentId)}">
                              <button type="submit" class="portal-btn portal-btn-danger portal-btn-sm">Undo</button>
                            </form>
                          </div>
                        </td>
                      </tr>`;
                    }).join('')}
                  </tbody>
                </table>
              </div>`}
        </div>
      </div>

      <div>
        <div class="portal-card">
          <h2>Running totals (${escapeHtml(month)})</h2>
          ${monthInvoices.studentInvoices.length === 0
            ? '<div class="portal-empty">Student totals will appear here once sessions are logged.</div>'
            : `<div class="portal-table-wrap">
                <table class="portal-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th class="num">Present</th>
                      <th class="num">Late</th>
                      <th class="num">Billable</th>
                      <th class="num">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${monthInvoices.studentInvoices.map(inv => `<tr>
                      <td><strong>${escapeHtml(inv.student.name)}</strong></td>
                      <td class="num">${inv.presentCount}</td>
                      <td class="num">${inv.lateCount}</td>
                      <td class="num">${inv.billableCount}</td>
                      <td class="num"><strong>${escapeHtml(formatMoney(inv.totalAmount, cur))}</strong></td>
                    </tr>`).join('')}
                  </tbody>
                </table>
              </div>`}
        </div>
      </div>
    </div>
  `;

  return renderPortalShell({
    title: 'Attendance',
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
        <h1>Student Roster</h1>
        <p>Manage student profiles, per-session rates, and private parent links.</p>
      </div>
      <a href="${escapeHtml(base)}/students${includeArchived ? '' : '?archived=1'}" class="portal-btn portal-btn-secondary">
        ${includeArchived ? 'Hide archived' : 'Show archived'}
      </a>
    </div>

    <div class="portal-card">
      <h2>Add student</h2>
      <form method="POST" action="${escapeHtml(base)}/students">
        <input type="hidden" name="_csrf" value="${escapeHtml(csrfToken)}">
        <div class="portal-form-row">
          <div class="portal-field">
            <label for="stu-name">Student name</label>
            <input id="stu-name" name="name" type="text" required maxlength="100">
          </div>
          <div class="portal-field">
            <label for="stu-parent">Parent / guardian name</label>
            <input id="stu-parent" name="parentName" type="text" required maxlength="100">
          </div>
          <div class="portal-field">
            <label for="stu-email">Parent email</label>
            <input id="stu-email" name="parentEmail" type="email" required maxlength="150">
          </div>
          <div class="portal-field">
            <label for="stu-price">Per-session price (${escapeHtml(cur)})</label>
            <input id="stu-price" name="pricePerSession" type="number" step="0.01" min="0" required value="${escapeHtml(String(defaultPrice))}">
          </div>
        </div>
        <div class="portal-field" style="margin-bottom:0.95rem;">
          <label for="stu-notes">Notes (optional)</label>
          <input id="stu-notes" name="notes" type="text" maxlength="500" placeholder="Grade level, focus areas, or scheduling notes">
        </div>
        <button type="submit" class="portal-btn portal-btn-primary">Add student</button>
      </form>
    </div>

    <div class="portal-card">
      <h2>Enrolled students (${students.length})</h2>
      ${students.length === 0
        ? '<div class="portal-empty">No students found in this view.</div>'
        : students.map(stu => {
            const parentUrl = `${portalOrigin}/p/${stu.parentToken}`;
            return `<div class="portal-subcard">
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.75rem;">
                <div style="display:flex;align-items:center;gap:0.5rem;">
                  <strong style="font-size:1.05rem;">${escapeHtml(stu.name)}</strong>
                  ${stu.archived ? '<span class="badge badge-archived">Archived</span>' : '<span class="badge badge-present">Active</span>'}
                </div>
                <span class="portal-money" style="font-weight:700;color:#028090;">${escapeHtml(formatMoney(stu.pricePerSession, cur))} / session</span>
              </div>
              <form method="POST" action="${escapeHtml(base)}/students/${escapeHtml(stu.studentId)}">
                <input type="hidden" name="_csrf" value="${escapeHtml(csrfToken)}">
                <div class="portal-form-row">
                  <div class="portal-field">
                    <label>Student name</label>
                    <input name="name" type="text" required value="${escapeHtml(stu.name)}">
                  </div>
                  <div class="portal-field">
                    <label>Parent name</label>
                    <input name="parentName" type="text" required value="${escapeHtml(stu.parentName)}">
                  </div>
                  <div class="portal-field">
                    <label>Parent email</label>
                    <input name="parentEmail" type="email" required value="${escapeHtml(stu.parentEmail)}">
                  </div>
                  <div class="portal-field">
                    <label>Price (${escapeHtml(cur)})</label>
                    <input name="pricePerSession" type="number" step="0.01" min="0" required value="${escapeHtml(String(stu.pricePerSession))}">
                  </div>
                </div>
                <div class="portal-field" style="margin-bottom:0.85rem;">
                  <label>Notes</label>
                  <input name="notes" type="text" value="${escapeHtml(stu.notes || '')}">
                </div>
                <div class="portal-inline-actions">
                  <button type="submit" class="portal-btn portal-btn-primary portal-btn-sm">Save changes</button>
                  <button type="submit" name="toggleArchive" value="1" class="portal-btn portal-btn-secondary portal-btn-sm">
                    ${stu.archived ? 'Unarchive' : 'Archive'}
                  </button>
                </div>
              </form>
              <div style="margin-top:0.85rem;padding-top:0.85rem;border-top:1px solid #E8E0D2;display:flex;flex-wrap:wrap;gap:0.6rem;align-items:center;justify-content:space-between;">
                <div style="display:flex;flex-wrap:wrap;gap:0.45rem;align-items:center;">
                  <span style="font-size:0.82rem;font-weight:700;color:#4A5568;">Parent link:</span>
                  <span class="portal-token-box">${escapeHtml(parentUrl)}</span>
                </div>
                <div class="portal-inline-actions">
                  <button type="button" class="portal-btn portal-btn-secondary portal-btn-sm" data-copy-text="${escapeHtml(parentUrl)}">Copy link</button>
                  <a href="${escapeHtml(parentUrl)}" target="_blank" rel="noopener" class="portal-btn portal-btn-secondary portal-btn-sm">Preview</a>
                  <form method="POST" action="${escapeHtml(base)}/students/${escapeHtml(stu.studentId)}/regenerate-token" data-confirm="Regenerate this child's private link? The old link will stop working immediately." style="display:inline;">
                    <input type="hidden" name="_csrf" value="${escapeHtml(csrfToken)}">
                    <button type="submit" class="portal-btn portal-btn-danger portal-btn-sm">Regenerate link</button>
                  </form>
                </div>
              </div>
            </div>`;
          }).join('')}
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
        <h1>Monthly Invoices</h1>
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
        <h1>Office Settings</h1>
        <p>Configure billing rules, default rates, and parent email notifications.</p>
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
        <h1>Email Delivery Log</h1>
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
    title: 'Email Log',
    base,
    activeTab: 'emails',
    csrfToken,
    flash: null,
    bodyHtml
  });
}

function renderParentViewPage({ student, summary, month, settings }) {
  const cur = settings.currencySymbol || '$';
  const tutorName = settings.tutorDisplayName || 'Teacher Cassie';
  const replyTo = settings.replyToEmail || 'Cassie@tutortime.ai';

  return `${renderPortalHead(`${student.name} — Attendance`)}
<body class="portal-body">
  <header class="portal-header">
    <div class="portal-header-inner">
      <div class="portal-brand">
        <img src="/assets/logos/tutor-time-logo.png" alt="Tutor Time" width="36" height="36">
        <span>
          <span class="portal-brand-title">Tutor Time with ${escapeHtml(tutorName)}</span>
          <span class="portal-brand-sub">Private Parent Attendance Summary</span>
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
        <p>Rate: <span class="num">${escapeHtml(formatMoney(student.pricePerSession, cur))}</span> per session</p>
      </div>
    </div>

    <div class="portal-grid">
      <div class="portal-stat">
        <div class="portal-stat-label">Billing month</div>
        <div class="portal-stat-value num">${escapeHtml(month)}</div>
      </div>
      <div class="portal-stat stat-mint">
        <div class="portal-stat-label">Billable sessions</div>
        <div class="portal-stat-value num">${escapeHtml(String(summary.billableCount))}</div>
      </div>
      <div class="portal-stat stat-accent">
        <div class="portal-stat-label">Month total</div>
        <div class="portal-stat-value num">${escapeHtml(formatMoney(summary.totalAmount, cur))}</div>
      </div>
    </div>

    <div class="portal-card">
      <h2>Session history (${escapeHtml(month)})</h2>
      ${summary.sessions.length === 0
        ? '<div class="portal-empty">No sessions recorded for this month yet.</div>'
        : `<div class="portal-table-wrap">
            <table class="portal-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Note</th>
                  <th class="num">Fee</th>
                </tr>
              </thead>
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
      <p style="margin-top:1.25rem;font-size:0.88rem;color:#4A5568;">
        Questions about a session? Contact ${escapeHtml(tutorName)} at
        <a href="mailto:${escapeHtml(replyTo)}" style="color:#028090;font-weight:700;">${escapeHtml(replyTo)}</a>.
      </p>
    </div>
  </main>
</body>
</html>`;
}

module.exports = {
  renderPortalShell,
  renderLoginPage,
  renderChangePasswordPage,
  renderAttendancePage,
  renderStudentsPage,
  renderInvoicesPage,
  renderSettingsPage,
  renderEmailsPage,
  renderParentViewPage
};
