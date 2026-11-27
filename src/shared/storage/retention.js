/**
 * Data Retention TTL Calculation Helper
 * Shared across localDriver and awsDriver to guarantee identical submission record shapes
 * and compliance with docs/legal/DATA_RETENTION_SCHEDULE.md.
 */

const DAY_SECONDS = 24 * 60 * 60;

const RETENTION_DAYS_BY_FORM = {
  PRESENTER_APPLICATION: 180,
  SCHOOL_ENQUIRY: 730,
  BOOK_CONSULTATION: 365,
  CONCIERGE_APPLICATION: 365,
  LEARNING_NEEDS: 365,
  POPCORN_PARENT_INTEREST: 365,
  CONTACT: 365
};

/**
 * Compute DynamoDB TTL epoch seconds (expireAt) for a form submission.
 * @param {string} formType Canonical uppercase formType (e.g. 'BOOK_CONSULTATION')
 * @param {string|Date} [createdAt] Optional ISO timestamp string or Date object
 * @returns {number} Integer Unix epoch seconds
 */
function computeExpireAt(formType, createdAt) {
  const days = RETENTION_DAYS_BY_FORM[String(formType || '').toUpperCase()] || 365;
  const createdMs = createdAt instanceof Date
    ? createdAt.getTime()
    : (createdAt ? Date.parse(createdAt) : Date.now());
  const baseSeconds = Math.floor((Number.isNaN(createdMs) ? Date.now() : createdMs) / 1000);
  return baseSeconds + (days * DAY_SECONDS);
}

module.exports = {
  RETENTION_DAYS_BY_FORM,
  computeExpireAt,
  computeSubmissionExpireAt: computeExpireAt
};
