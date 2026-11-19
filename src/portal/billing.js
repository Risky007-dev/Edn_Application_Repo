/**
 * Pure Billing & Invoice Calculation Module
 * Totals are always computed directly from attendance records (never stored manually).
 */

const VALID_STATUSES = ['present', 'absent', 'late', 'cancelled'];

function normalizePrice(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.round(num * 100) / 100;
}

function toCents(amount) {
  return Math.round(normalizePrice(amount) * 100);
}

function fromCents(cents) {
  return Math.round(cents) / 100;
}

function isStatusBillable(status, settings = {}) {
  const s = String(status || '').toLowerCase();
  if (s === 'present') return true;
  if (s === 'late') return settings.lateIsBillable !== false;
  return false; // absent or cancelled are never billed
}

function computeAttendancePrice(status, pricePerSession, settings = {}) {
  if (!isStatusBillable(status, settings)) return 0;
  return normalizePrice(pricePerSession);
}

function computeStudentMonthSummary(student, attendanceRecords = [], settings = {}) {
  const studentRecords = attendanceRecords
    .filter(r => r.studentId === student.studentId)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  let presentCount = 0;
  let lateCount = 0;
  let absentCount = 0;
  let cancelledCount = 0;
  let billableCount = 0;
  let totalCents = 0;

  const sessions = studentRecords.map(rec => {
    const st = String(rec.status || '').toLowerCase();
    if (st === 'present') presentCount++;
    else if (st === 'late') lateCount++;
    else if (st === 'absent') absentCount++;
    else if (st === 'cancelled') cancelledCount++;

    const billable = typeof rec.billable === 'boolean' ? rec.billable : isStatusBillable(st, settings);
    const appliedPrice = billable
      ? normalizePrice(rec.priceApplied !== undefined ? rec.priceApplied : student.pricePerSession)
      : 0;

    if (billable) {
      billableCount++;
      totalCents += toCents(appliedPrice);
    }

    return {
      ...rec,
      status: st,
      billable,
      appliedPrice
    };
  });

  return {
    student,
    sessions,
    totalSessions: sessions.length,
    billableCount,
    presentCount,
    lateCount,
    absentCount,
    cancelledCount,
    totalAmount: fromCents(totalCents)
  };
}

function computeMonthInvoices(students = [], attendanceRecords = [], settings = {}, month = '') {
  const studentMap = new Map();
  for (const s of students) {
    studentMap.set(s.studentId, s);
  }

  // Include any student who has records in this month even if archived
  const studentInvoices = [];
  let grandTotalCents = 0;
  let totalBillableSessions = 0;
  let totalSessions = 0;

  for (const student of students) {
    const summary = computeStudentMonthSummary(student, attendanceRecords, settings);
    if (!student.archived || summary.totalSessions > 0) {
      studentInvoices.push(summary);
      grandTotalCents += toCents(summary.totalAmount);
      totalBillableSessions += summary.billableCount;
      totalSessions += summary.totalSessions;
    }
  }

  return {
    month,
    studentInvoices,
    grandTotal: fromCents(grandTotalCents),
    totalBillableSessions,
    totalSessions
  };
}

function csvCell(val) {
  const str = val === null || val === undefined ? '' : String(val);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsvExport(students = [], attendanceRecords = [], month = '') {
  const byId = new Map(students.map(s => [s.studentId, s]));
  const header = [
    'Month',
    'Date',
    'Student Name',
    'Parent Name',
    'Parent Email',
    'Status',
    'Billable',
    'Session Price',
    'Note',
    'Updated At'
  ].join(',');

  const rows = attendanceRecords
    .slice()
    .sort((a, b) => `${a.date}#${a.studentId}`.localeCompare(`${b.date}#${b.studentId}`))
    .map(rec => {
      const stu = byId.get(rec.studentId) || {};
      return [
        csvCell(rec.month || month),
        csvCell(rec.date),
        csvCell(stu.name || rec.studentId),
        csvCell(stu.parentName || ''),
        csvCell(stu.parentEmail || ''),
        csvCell(rec.status),
        csvCell(rec.billable ? 'YES' : 'NO'),
        csvCell(rec.billable ? normalizePrice(rec.priceApplied ?? stu.pricePerSession).toFixed(2) : '0.00'),
        csvCell(rec.note || ''),
        csvCell(rec.updatedAt || '')
      ].join(',');
    });

  return [header, ...rows].join('\r\n') + '\r\n';
}

module.exports = {
  VALID_STATUSES,
  normalizePrice,
  isStatusBillable,
  computeAttendancePrice,
  computeStudentMonthSummary,
  computeMonthInvoices,
  buildCsvExport
};
