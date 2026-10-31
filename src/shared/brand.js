/**
 * Centralized Brand Definitions & Canonical Naming
 * Project: Tutor Time / Popcorn Math
 * Author: Developer
 *
 * HARD RULES:
 * - Brand names must remain consistent across server and client.
 * - Slugs are strictly mapped to their canonical display names.
 * - Never claim dyslexia or autism specialist certification (realigned to Individualised Learning Support).
 */

const BRAND_CONFIG = {
  platformName: 'Tutor Time with Teacher Cassie',
  parentBrand: 'Tutor Time',
  tagline: 'Where Learning Pops, Confidence Grows & Students Succeed!',
  platformLogo: '/assets/logos/TT_logo.jpg',
  platformLogoLight: '/assets/logos/TT_11.jpg',
  
  services: {
    'traditional-tutoring': {
      slug: 'traditional-tutoring',
      name: 'Personalised Tutoring & Academic Support',
      shortName: 'Tutoring',
      tagline: 'Tailored one-to-one learning aligned with individual curriculum goals',
      module: 'tutoring',
      accentColor: '#028090',
      logo: '/assets/logos/TT_logo.jpg'
    },
    'concierge': {
      slug: 'concierge',
      name: 'Concierge Academic Coaching',
      shortName: 'Concierge Coaching',
      tagline: 'Comprehensive academic oversight, organization, and accountability',
      module: 'concierge',
      accentColor: '#d97706',
      logo: '/assets/logos/TT_logo.jpg'
    },
    'popcorn-maths': {
      slug: 'popcorn-maths',
      name: 'Popcorn Math',
      shortName: 'Popcorn Math',
      tagline: 'Where Math Skills POP! Making mathematics fun, interactive & unforgettable',
      module: 'popcorn',
      accentColor: '#e62b25',
      logo: '/assets/logos/popcorn-math-logo.png'
    },
    'specialist-support': {
      slug: 'specialist-support',
      name: 'Individualised Learning Support',
      shortName: 'Learning Support',
      tagline: 'Structured routines, executive functioning, and differentiated learning',
      module: 'specialist-support',
      accentColor: '#059669',
      logo: '/assets/logos/TT_logo.jpg'
    }
  },

  allowedSlugs: [
    'traditional-tutoring',
    'concierge',
    'popcorn-maths',
    'specialist-support'
  ],

  getServiceBySlug(slug) {
    return this.services[slug] || null;
  },

  isSlugAllowed(slug) {
    return this.allowedSlugs.includes(slug);
  }
};

module.exports = BRAND_CONFIG;
