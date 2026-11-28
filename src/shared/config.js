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
  faultInjectionEnabled: process.env.FAULT_INJECTION_ENABLED === 'true',

  // Swappable Mascot Asset Configuration (SVGs remain default until approved artwork is configured)
  mascots: {
    guide: {
      // Set GUIDE_MASCOT_IMAGE_PATH (e.g. '/assets/mascots/kashamar.png') or
      // GUIDE_MASCOT_EXPRESSIONS_DIR (e.g. '/assets/mascots-local-preview') to swap in artwork.
      imagePath: process.env.GUIDE_MASCOT_IMAGE_PATH || (process.env.GUIDE_MASCOT_EXPRESSIONS_DIR
        ? `${process.env.GUIDE_MASCOT_EXPRESSIONS_DIR.replace(/\/+$/, '')}/guide-neutral.jpg`
        : null),
      expressions: process.env.GUIDE_MASCOT_EXPRESSIONS_DIR
        ? {
            neutral: `${process.env.GUIDE_MASCOT_EXPRESSIONS_DIR.replace(/\/+$/, '')}/guide-neutral.jpg`,
            happy: `${process.env.GUIDE_MASCOT_EXPRESSIONS_DIR.replace(/\/+$/, '')}/guide-happy.jpg`,
            thinking: `${process.env.GUIDE_MASCOT_EXPRESSIONS_DIR.replace(/\/+$/, '')}/guide-thinking.jpg`,
            celebrating: `${process.env.GUIDE_MASCOT_EXPRESSIONS_DIR.replace(/\/+$/, '')}/guide-celebrating.jpg`
          }
        : null,
      alt: 'Tutor Time Guide avatar'
    },
    bucket: {
      // Set BUCKET_MASCOT_IMAGE_PATH (e.g. '/assets/mascots/popcorn-bucket.png') for illustrated
      // Popcorn Bucket artwork only (never use photos of Teacher Cassie for the bucket mascot).
      imagePath: process.env.BUCKET_MASCOT_IMAGE_PATH || null,
      expressions: null,
      alt: 'Popcorn Math bucket character mascot'
    }
  }
};
