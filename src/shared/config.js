/**
 * Application Configuration & Service Feature Flags
 */

const chatbotFlag = process.env.FEATURES_CHATBOT_ENABLED !== 'false' && process.env.FEATURE_CHATBOT_ENABLED !== 'false';
const readinessFlag = process.env.FEATURES_READINESS_CHECK_ENABLED !== 'false' && process.env.FEATURE_READINESS_CHECK_ENABLED !== 'false';
const previewBanner = process.env.SHOW_LOCAL_PREVIEW_BANNER === 'true' || process.env.FEATURES_LOCAL_PREVIEW_BANNER === 'true';

module.exports = {
  siteUrl: (process.env.SITE_URL || process.env.PUBLIC_SITE_URL || 'https://popcornmaths.com').replace(/\/+$/, ''),
  testimonials: {
    enabled: false
  },
  // Feature flag structure
  features: {
    chatbot: {
      enabled: chatbotFlag
    },
    readinessCheck: {
      enabled: readinessFlag
    },
    localPreviewBanner: previewBanner
  },
  // Direct shortcuts
  chatbotEnabled: chatbotFlag,
  readinessCheckEnabled: readinessFlag,
  localPreviewBanner: previewBanner,

  // Stage 5 Service Function Toggles
  popcornLocationDirectory: true,
  popcornGameMultiLevel: true,
  conciergeReadinessSurvey: true,
  tutoringPrintableChecklist: true,
  faultInjectionEnabled: process.env.FAULT_INJECTION_ENABLED === 'true'
};
