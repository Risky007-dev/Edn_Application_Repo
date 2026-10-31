/**
 * Storage Subsystem Entrypoint
 * Provides a uniform interface across local JSON persistence and AWS cloud drivers.
 */

const localDriver = require('./localDriver');

function getDriver() {
  const driverType = (process.env.STORAGE_DRIVER || 'local').toLowerCase().trim();
  if (driverType === 'aws') {
    // Lazy-load AWS driver only when explicitly requested
    const awsDriver = require('./awsDriver');
    return awsDriver;
  }
  return localDriver;
}

module.exports = {
  saveSubmission(formType, data) {
    return getDriver().saveSubmission(formType, data);
  },

  getSubmissionCount(formType) {
    return getDriver().getSubmissionCount(formType);
  },

  createUploadPresignedPost(filename, mimeType) {
    return getDriver().createUploadPresignedPost(filename, mimeType);
  },

  sendNotificationEmail(to, subject, bodyHtml) {
    return getDriver().sendNotificationEmail(to, subject, bodyHtml);
  },

  getCurrentDriverName() {
    return (process.env.STORAGE_DRIVER || 'local').toLowerCase().trim();
  }
};
