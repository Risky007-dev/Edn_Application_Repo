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
  <title>${escapeHtml(title)} | Tutor Time Portal</title>
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
        <img src="/assets/logos/tutor-time-logo.png" alt="Tutor Time" width="32" height="32">
        <span>Tutor Time &mdash; Private Portal</span>
      </a>
      <nav class="portal-nav" aria-label="Portal Navigation">
        ${navItems.map(item => `<a href="${escapeHtml(item.href)}" class="${activeTab === item.id ? 'active' : ''}">${escapeHtml(item.label)}</a>`).join('')}
        <form method="POST" action="${escapeHtml(base)}/logout" style="display:inline;">
          <input type="hidden" name="_csrf" value="${escapeHtml(csrfToken)}">
          <button type="submit">Log Out</button>
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
  <div class="portal-auth-wrap">
    <div class="portal-card">
      <h1>Teacher Cassie Portal</h1>
      <p style="color:#64748b;font-size:0.92rem;">Private attendance &amp; invoicing office.</p>
      ${error ? `<div class="portal-alert portal-alert-error" role="alert">${escapeHtml(error)}</div>` : ''}
      <form method="POST" action="${escapeHtml(base)}/login">
        <div class="portal-field" style="margin-bottom:0.85rem;">
          <label for="username">Username</label>
          <input id="username" name="username" type="text" required autocomplete="username" value="kashamar">
        </div>
        <div class="portal-field" style="margin-bottom:1.1rem;">
          <label for="password">Password</label>
          <input id="password" name="password" type="password" required autocomplete="current-password">
        </div>
        <button type="submit" class="portal-btn portal-btn-primary" style="width:100%;">Sign In</button>
      </form>
    </div>
  </div>
</body>
</html>`;
}

function renderChangePasswordPage({ base, error, mustChange, csrfToken }) {
  const heading = mustChange ? 'Set Your New Password' : 'Change Password';
  const note = mustChange
    ? 'For security, please replace your temporary password before continuing.'
    : 'Choose a strong password (at least 10 characters).';

  return `${renderPortalHead(heading)}
<body class="portal-body">
  <div class="portal-auth-wrap">
    <div class="portal-card">
      <h1>${escapeHtml(heading)}</h1>
      <p style="color:#64748b;font-size:0.92rem;">${escapeHtml(note)}</p>
      ${error ? `<div class="portal-alert portal-alert-error" role="alert">${escapeHtml(error)}</div>` : ''}
      <form method="POST" action="${escapeHtml(base)}/change-password">
        <input type="hidden" name="_csrf" value="${escapeHtml(csrfToken)}">
        <div class="portal-field" style="margin-bottom:0.85rem;">
          <label for="newPassword">New Password (min 10 characters)</label>
          <input id="newPassword" name="newPassword" type="password" minlength="10" required autocomplete="new-password">
        </div>
        <div class="portal-field" style="margin-bottom:1.1rem;">
          <label for="confirmPassword">Confirm New Password</label>
          <input id="confirmPassword" name="confirmPassword" type="password" minlength="10" required autocomplete="new-password">
        </div>
        <button type="submit" class="portal-btn portal-btn-primary" style="width:100%;">Save New Password</button>
      </form>
      ${!mustChange ? `<p style="margin-top:1rem;"><a href="${escapeHtml(base || '/')}">&larr; Back to Portal</a></p>` : ''}
    </div>
  </div>
</body>
</html>`;
}

function renderAttendancePage({ base, date, month, students, monthRecords, monthInvoices, settings, flash, csrfToken }) {
  const cur = settings.currencySymbol || '$';
  const activeStudents = students.filter(s => !s.archived);
  const dateRecords = monthRecords.filter(r => r.date === date);
  const recordByStudent = new Map(dateRecords.map(r => [r.studentId, r]));
  const studentMap = new Map(students.map(s => [s.studentId, s]));

  const bodyHtml = `
    <div class="portal-grid">
      <div class="portal-stat">
        <div class="portal-stat-label">Selected Month (${escapeHtml(month)})</div>
        <div class="portal-stat-value">${escapeHtml(formatMoney(monthInvoices.grandTotal, cur))}</div>
      </div>
      <div class="portal-stat">
        <div class="portal-stat-label">Billable Sessions</div>
        <div class="portal-stat-value">${escapeHtml(String(monthInvoices.totalBillableSessions))}</div>
      </div>
      <div class="portal-stat">
        <div class="portal-stat-label">Active Students</div>
        <div class="portal-stat-value">${escapeHtml(String(activeStudents.length))}</div>
      </div>
    </div>

    <div class="portal-card">
      <form method="GET" action="${escapeHtml(base || '/')}" class="portal-form-row" style="align-items:end;margin-bottom:0;">
        <div class="portal-field">
          <label for="date-picker">Session Date</label>
          <input id="date-picker" name="date" type="date" value="${escapeHtml(date)}">
        </div>
        <div class="portal-field">
          <label for="month-picker">Running Totals Month</label>
          <input id="month-picker" name="month" type="month" value="${escapeHtml(month)}">
        </div>
        <div class="portal-field">
          <button type="submit" class="portal-btn portal-btn-secondary">Load Date &amp; Month</button>
        </div>
        <div class="portal-field">
          <a href="${escapeHtml(base)}/export.csv?month=${escapeHtml(month)}" class="portal-btn portal-btn-secondary">Export CSV (${escapeHtml(month)})</a>
        </div>
      </form>
    </div>

    <div class="portal-card">
      <h2>Mark Attendance for ${escapeHtml(date)}</h2>
      ${activeStudents.length === 0
        ? `<p>No active students yet. <a href="${escapeHtml(base)}/students">Add your first student &rarr;</a></p>`
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
            <div class="portal-field" style="margin-bottom:0.85rem;">
              <label for="att-note">Optional Note (visible to parent)</label>
              <input id="att-note" name="note" type="text" maxlength="400" placeholder="e.g., Covered fractions &amp; word problems">
            </div>
            <div class="portal-inline-actions">
              <button type="submit" class="portal-btn portal-btn-primary">Save &amp; Notify Parent</button>
              <label class="portal-checkbox" style="margin-left:0.5rem;">
                <input type="checkbox" name="skipEmail" value="1">
                <span>Save without sending email</span>
              </label>
            </div>
          </form>`}
    </div>

    <div class="portal-card">
      <h2>Entries for ${escapeHtml(date)}</h2>
      ${dateRecords.length === 0
        ? '<p style="color:#64748b;">No attendance recorded for this date yet.</p>'
        : `<div class="portal-table-wrap">
            <table class="portal-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Status</th>
                  <th>Billed</th>
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
                    <td>${rec.billable ? escapeHtml(formatMoney(rec.priceApplied, cur)) : '$0.00'}</td>
                    <td>${escapeHtml(rec.note || '')}</td>
                    <td>
                      <div class="portal-inline-actions">
                        <form method="POST" action="${escapeHtml(base)}/attendance" style="display:inline;">
                          <input type="hidden" name="_csrf" value="${escapeHtml(csrfToken)}">
                          <input type="hidden" name="date" value="${escapeHtml(date)}">
                          <input type="hidden" name="month" value="${escapeHtml(month)}">
                          <input type="hidden" name="studentId" value="${escapeHtml(rec.studentId)}">
                          <input type="hidden" name="skipEmail" value="1">
                          <select name="status" aria-label="Change status">
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

    <div class="portal-card">
      <h2>Running Totals &mdash; ${escapeHtml(month)}</h2>
      ${monthInvoices.studentInvoices.length === 0
        ? '<p style="color:#64748b;">No students to summarize yet.</p>'
        : `<div class="portal-table-wrap">
            <table class="portal-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Present</th>
                  <th>Late</th>
                  <th>Absent/Canc.</th>
                  <th>Billable</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${monthInvoices.studentInvoices.map(inv => `<tr>
                  <td>${escapeHtml(inv.student.name)}</td>
                  <td>${inv.presentCount}</td>
                  <td>${inv.lateCount}</td>
                  <td>${inv.absentCount + inv.cancelledCount}</td>
                  <td>${inv.billableCount}</td>
                  <td><strong>${escapeHtml(formatMoney(inv.totalAmount, cur))}</strong></td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>`}
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
    <div class="portal-card">
      <h2>Add Student</h2>
      <form method="POST" action="${escapeHtml(base)}/students">
        <input type="hidden" name="_csrf" value="${escapeHtml(csrfToken)}">
        <div class="portal-form-row">
          <div class="portal-field">
            <label for="stu-name">Student Name</label>
            <input id="stu-name" name="name" type="text" required maxlength="100">
          </div>
          <div class="portal-field">
            <label for="stu-parent">Parent Name</label>
            <input id="stu-parent" name="parentName" type="text" required maxlength="100">
          </div>
          <div class="portal-field">
            <label for="stu-email">Parent Email</label>
            <input id="stu-email" name="parentEmail" type="email" required maxlength="150">
          </div>
          <div class="portal-field">
            <label for="stu-price">Per-Session Price (${escapeHtml(cur)})</label>
            <input id="stu-price" name="pricePerSession" type="number" step="0.01" min="0" required value="${escapeHtml(String(defaultPrice))}">
          </div>
        </div>
        <div class="portal-field" style="margin-bottom:0.85rem;">
          <label for="stu-notes">Notes (optional)</label>
          <input id="stu-notes" name="notes" type="text" maxlength="500">
        </div>
        <button type="submit" class="portal-btn portal-btn-primary">Add Student</button>
      </form>
    </div>

    <div class="portal-card">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.75rem;">
        <h2 style="margin:0;">Students (${students.length})</h2>
        <a href="${escapeHtml(base)}/students${includeArchived ? '' : '?archived=1'}" class="portal-btn portal-btn-secondary portal-btn-sm">
          ${includeArchived ? 'Hide Archived' : 'Show Archived'}
        </a>
      </div>
      ${students.length === 0
        ? '<p style="color:#64748b;">No students found.</p>'
        : students.map(stu => {
            const parentUrl = `${portalOrigin}/p/${stu.parentToken}`;
            return `<div class="portal-card" style="background:#f8fafc;margin-bottom:0.85rem;">
              <form method="POST" action="${escapeHtml(base)}/students/${escapeHtml(stu.studentId)}">
                <input type="hidden" name="_csrf" value="${escapeHtml(csrfToken)}">
                <div class="portal-form-row">
                  <div class="portal-field">
                    <label>Student Name</label>
                    <input name="name" type="text" required value="${escapeHtml(stu.name)}">
                  </div>
                  <div class="portal-field">
                    <label>Parent Name</label>
                    <input name="parentName" type="text" required value="${escapeHtml(stu.parentName)}">
                  </div>
                  <div class="portal-field">
                    <label>Parent Email</label>
                    <input name="parentEmail" type="email" required value="${escapeHtml(stu.parentEmail)}">
                  </div>
                  <div class="portal-field">
                    <label>Price (${escapeHtml(cur)})</label>
                    <input name="pricePerSession" type="number" step="0.01" min="0" required value="${escapeHtml(String(stu.pricePerSession))}">
                  </div>
                </div>
                <div class="portal-field" style="margin-bottom:0.75rem;">
                  <label>Notes</label>
                  <input name="notes" type="text" value="${escapeHtml(stu.notes || '')}">
                </div>
                <div class="portal-inline-actions">
                  <button type="submit" class="portal-btn portal-btn-primary portal-btn-sm">Save Changes</button>
                  <button type="submit" name="toggleArchive" value="1" class="portal-btn portal-btn-secondary portal-btn-sm">
                    ${stu.archived ? 'Unarchive' : 'Archive'}
                  </button>
                </div>
              </form>
              <div style="margin-top:0.75rem;padding-top:0.75rem;border-top:1px solid #e2e8f0;display:flex;flex-wrap:wrap;gap:0.5rem;align-items:center;justify-content:space-between;">
                <div>
                  <span style="font-size:0.82rem;font-weight:600;color:#475569;">Private Parent Link:</span>
                  <span class="portal-token-box">${escapeHtml(parentUrl)}</span>
                </div>
                <div class="portal-inline-actions">
                  <button type="button" class="portal-btn portal-btn-secondary portal-btn-sm" data-copy-text="${escapeHtml(parentUrl)}">Copy Link</button>
                  <a href="${escapeHtml(parentUrl)}" target="_blank" rel="noopener" class="portal-btn portal-btn-secondary portal-btn-sm">Preview</a>
                  <form method="POST" action="${escapeHtml(base)}/students/${escapeHtml(stu.studentId)}/regenerate-token" data-confirm="Regenerate this child's private link? The old link will stop working immediately." style="display:inline;">
                    <input type="hidden" name="_csrf" value="${escapeHtml(csrfToken)}">
                    <button type="submit" class="portal-btn portal-btn-danger portal-btn-sm">Regenerate Link</button>
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
      <h1 style="margin:0;">Tutor Time with ${escapeHtml(tutorName)} &mdash; Monthly Invoice</h1>
      <p style="margin:0.25rem 0 0;">Billing Period: <strong>${escapeHtml(month)}</strong> | Contact: ${escapeHtml(settings.replyToEmail || 'Cassie@tutortime.ai')}</p>
    </div>

    <div class="portal-card no-print portal-filter-bar">
      <form method="GET" action="${escapeHtml(base)}/invoices" class="portal-form-row" style="align-items:end;margin-bottom:0;">
        <div class="portal-field">
          <label for="inv-month">Month</label>
          <input id="inv-month" name="month" type="month" value="${escapeHtml(month)}">
        </div>
        <div class="portal-field">
          <label for="inv-student">Student Filter</label>
          <select id="inv-student" name="studentId">
            <option value="">All Students</option>
            ${students.map(s => `<option value="${escapeHtml(s.studentId)}" ${selectedStudentId === s.studentId ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('')}
          </select>
        </div>
        <div class="portal-field">
          <button type="submit" class="portal-btn portal-btn-secondary">View Invoice</button>
        </div>
        <div class="portal-field">
          <button type="button" class="portal-btn portal-btn-primary" data-action="print">
            ${selectedStudentId ? 'Print This Child' : 'Print All'}
          </button>
        </div>
      </form>
    </div>

    <div class="portal-card">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;">
        <div>
          <h2 style="margin:0;">Invoice Summary &mdash; ${escapeHtml(month)}</h2>
          <p style="margin:0.25rem 0 0;color:#64748b;font-size:0.9rem;">Computed live from attendance records.</p>
        </div>
        <div style="font-size:1.4rem;font-weight:700;">Total: ${escapeHtml(formatMoney(displayTotal, cur))}</div>
      </div>
    </div>

    ${list.length === 0
      ? '<div class="portal-card"><p style="color:#64748b;">No sessions or students found for this selection.</p></div>'
      : list.map(inv => `
        <div class="portal-card">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.75rem;">
            <div>
              <h3 style="margin:0;">${escapeHtml(inv.student.name)}</h3>
              <div style="font-size:0.88rem;color:#64748b;">
                Parent: ${escapeHtml(inv.student.parentName)} (${escapeHtml(inv.student.parentEmail)}) &bull;
                Rate: ${escapeHtml(formatMoney(inv.student.pricePerSession, cur))}/session
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:1.2rem;font-weight:700;">${escapeHtml(formatMoney(inv.totalAmount, cur))}</div>
              <div style="font-size:0.82rem;color:#64748b;">${inv.billableCount} billable of ${inv.totalSessions} sessions</div>
              <a href="${escapeHtml(base)}/invoices?month=${escapeHtml(month)}&studentId=${escapeHtml(inv.student.studentId)}" class="portal-btn portal-btn-secondary portal-btn-sm no-print" style="margin-top:0.35rem;">Focus This Child</a>
            </div>
          </div>
          ${inv.sessions.length === 0
            ? '<p style="color:#64748b;font-size:0.9rem;margin:0;">No sessions recorded this month.</p>'
            : `<div class="portal-table-wrap">
                <table class="portal-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Note</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${inv.sessions.map(sess => `<tr>
                      <td>${escapeHtml(sess.date)}</td>
                      <td><span class="badge badge-${escapeHtml(sess.status)}">${escapeHtml(sess.status)}</span></td>
                      <td>${escapeHtml(sess.note || '')}</td>
                      <td>${sess.billable ? escapeHtml(formatMoney(sess.appliedPrice, cur)) : '$0.00'}</td>
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
    <div class="portal-card">
      <h2>Portal &amp; Billing Settings</h2>
      <form method="POST" action="${escapeHtml(base)}/settings">
        <input type="hidden" name="_csrf" value="${escapeHtml(csrfToken)}">
        <div class="portal-form-row">
          <div class="portal-field">
            <label for="set-tutor">Tutor Display Name</label>
            <input id="set-tutor" name="tutorDisplayName" type="text" required value="${escapeHtml(settings.tutorDisplayName || 'Teacher Cassie')}">
          </div>
          <div class="portal-field">
            <label for="set-replyto">Reply-To / Contact Email</label>
            <input id="set-replyto" name="replyToEmail" type="email" required value="${escapeHtml(settings.replyToEmail || 'Cassie@tutortime.ai')}">
          </div>
        </div>
        <div class="portal-form-row">
          <div class="portal-field">
            <label for="set-price">Default Per-Session Price</label>
            <input id="set-price" name="defaultPricePerSession" type="number" step="0.01" min="0" required value="${escapeHtml(String(settings.defaultPricePerSession ?? 50))}">
          </div>
          <div class="portal-field">
            <label for="set-currency">Currency Symbol</label>
            <input id="set-currency" name="currencySymbol" type="text" maxlength="5" required value="${escapeHtml(settings.currencySymbol || '$')}">
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:0.6rem;margin:1rem 0;">
          <label class="portal-checkbox">
            <input type="checkbox" name="lateIsBillable" value="1" ${settings.lateIsBillable !== false ? 'checked' : ''}>
            <span>Bill "Late" sessions at full per-session price</span>
          </label>
          <label class="portal-checkbox">
            <input type="checkbox" name="sendParentEmails" value="1" ${settings.sendParentEmails !== false ? 'checked' : ''}>
            <span>Send parent attendance email notifications automatically via SES</span>
          </label>
        </div>
        <button type="submit" class="portal-btn portal-btn-primary">Save Settings</button>
      </form>
    </div>

    <div class="portal-card">
      <h3>Account Security</h3>
      <p style="color:#64748b;font-size:0.92rem;">Update your portal login password at any time.</p>
      <a href="${escapeHtml(base)}/change-password" class="portal-btn portal-btn-secondary">Change Password</a>
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
    <div class="portal-card">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;">
        <div>
          <h2 style="margin:0;">Parent Email Delivery Log (${escapeHtml(month)})</h2>
          <p style="margin:0.25rem 0 0;color:#64748b;font-size:0.9rem;">
            Sender: <strong>${escapeHtml(settings.senderEmail || 'noreply@mail.tutortime.ai')}</strong> &bull;
            Reply-To: <strong>${escapeHtml(settings.replyToEmail || 'Cassie@tutortime.ai')}</strong>
          </p>
        </div>
        <form method="GET" action="${escapeHtml(base)}/emails" class="portal-inline-actions">
          <input name="month" type="month" value="${escapeHtml(month)}">
          <button type="submit" class="portal-btn portal-btn-secondary portal-btn-sm">Load</button>
        </form>
      </div>
    </div>

    <div class="portal-card">
      ${logs.length === 0
        ? '<p style="color:#64748b;">No email logs recorded for this month.</p>'
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
                  <td style="font-size:0.82rem;">${escapeHtml(l.createdAt)}</td>
                  <td>${escapeHtml(l.studentName || l.studentId)}</td>
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
  <main class="portal-main" style="max-width:760px;">
    <div class="portal-card">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;">
        <div>
          <h1 style="margin:0;font-size:1.35rem;">${escapeHtml(student.name)} &mdash; Attendance &amp; Sessions</h1>
          <p style="margin:0.25rem 0 0;color:#64748b;font-size:0.9rem;">
            Tutor: <strong>${escapeHtml(tutorName)}</strong> &bull;
            Rate: ${escapeHtml(formatMoney(student.pricePerSession, cur))}/session
          </p>
        </div>
        <form method="GET" class="portal-inline-actions">
          <input name="month" type="month" value="${escapeHtml(month)}" aria-label="Select month">
          <button type="submit" class="portal-btn portal-btn-secondary portal-btn-sm">View Month</button>
        </form>
      </div>
    </div>

    <div class="portal-grid">
      <div class="portal-stat">
        <div class="portal-stat-label">Month</div>
        <div class="portal-stat-value">${escapeHtml(month)}</div>
      </div>
      <div class="portal-stat">
        <div class="portal-stat-label">Billable Sessions</div>
        <div class="portal-stat-value">${escapeHtml(String(summary.billableCount))}</div>
      </div>
      <div class="portal-stat">
        <div class="portal-stat-label">Month Total</div>
        <div class="portal-stat-value">${escapeHtml(formatMoney(summary.totalAmount, cur))}</div>
      </div>
    </div>

    <div class="portal-card">
      <h2>Session History (${escapeHtml(month)})</h2>
      ${summary.sessions.length === 0
        ? '<p style="color:#64748b;">No sessions recorded for this month yet.</p>'
        : `<div class="portal-table-wrap">
            <table class="portal-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Note</th>
                  <th>Fee</th>
                </tr>
              </thead>
              <tbody>
                ${summary.sessions.map(s => `<tr>
                  <td>${escapeHtml(s.date)}</td>
                  <td><span class="badge badge-${escapeHtml(s.status)}">${escapeHtml(s.status)}</span></td>
                  <td>${escapeHtml(s.note || '')}</td>
                  <td>${s.billable ? escapeHtml(formatMoney(s.appliedPrice, cur)) : '$0.00'}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>`}
      <p style="margin-top:1.25rem;font-size:0.85rem;color:#64748b;">
        Questions about a session? Contact ${escapeHtml(tutorName)} at
        <a href="mailto:${escapeHtml(replyTo)}">${escapeHtml(replyTo)}</a>.
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
