/**
 * Storage Subsystem Entrypoint
 * Provides a uniform interface across local JSON persistence and AWS cloud drivers.
 */

function getDriver() {
  const driverType = (process.env.STORAGE_DRIVER || 'local').toLowerCase().trim();
  if (driverType === 'aws') {
    // Lazy-load AWS driver only when explicitly requested
    return require('./awsDriver');
  }
  return require('./localDriver');
}

module.exports = {
  saveSubmission(formType, data) {
    return getDriver().saveSubmission(formType, data);
  },

  getSubmissionCount(formType) {
    return getDriver().getSubmissionCount(formType);
  },

  addSubscriber(email) {
    return getDriver().addSubscriber(email);
  },

  listSubscribers() {
    return getDriver().listSubscribers();
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
