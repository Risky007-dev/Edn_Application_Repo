/**
 * Application Configuration & Service Feature Flags
 */

module.exports = {
  testimonials: {
    enabled: false
  },
  // Stage 5 Service Function Toggles (set to false to instantly revert to baseline)
  popcornLocationDirectory: true,
  popcornGameMultiLevel: true,
  conciergeReadinessSurvey: true,
  tutoringPrintableChecklist: true,
  faultInjectionEnabled: process.env.FAULT_INJECTION_ENABLED === 'true'
};
