/**
 * Centralized Site Content Data Definitions
 * Project: Tutor Time
 *
 * NOTE: All promotional headlines and copy from Cassie's advisory document
 * are marked PROPOSED-COPY. Missing copy is marked TODO(content).
 */

const brand = require('../brand');

const SITE_CONTENT = {
  navigation: [
    { label: 'HOME', href: '/' },
    { label: 'ABOUT', href: '/about' },
    {
      label: 'OUR SERVICES',
      href: '#',
      dropdown: [
        { label: 'Personalised Tutoring & Academic Support', href: '/services/traditional-tutoring' },
        { label: 'Concierge Academic Coaching', href: '/services/concierge' },
        { label: 'Individualised Learning Support', href: '/services/specialist-support' }
      ]
    },
    {
      label: 'POPCORN MATH',
      href: '/services/popcorn-maths',
      dropdown: [
        { label: 'About Popcorn Math', href: '/services/popcorn-maths' },
        { label: 'Become a Presenter', href: '/popcorn-maths/presenter' },
        { label: 'School Partnerships', href: '/popcorn-maths/school-partnership' },
        { label: 'Play & Learn Demo', href: '/popcorn-maths/game' }
      ]
    },
    { label: 'RESOURCES', href: '/resources' },
    { label: 'CONTACT', href: '/contact' },
    { label: 'BOOK NOW', href: '/book', isCta: true }
  ],

  footer: {
    copyright: `© ${new Date().getFullYear()} Tutor Time with Teacher Cassie. All rights reserved.`,
    legalLinks: [
      { label: 'Privacy Policy', href: '/privacy', tag: 'TODO(legal)' },
      { label: 'Terms of Service', href: '/terms', tag: 'TODO(legal)' }
    ],
    joinOurTeam: [
      { label: 'Become a Tutor', href: '/contact?subject=tutor-enquiry' },
      { label: 'Become a Popcorn Math Presenter', href: '/popcorn-maths/presenter' }
    ],
    whatsapp: {
      label: 'Chat with Teacher Cassie on WhatsApp',
      getNumber() {
        return process.env.WHATSAPP_PHONE_NUMBER || '';
      },
      getLink() {
        const num = this.getNumber();
        return num ? `https://wa.me/${num.replace(/[^0-9]/g, '')}` : '#';
      }
    }
  },

  homepage: {
    hero: {
      headline: 'TUTOR TIME WITH TEACHER CASSIE', // PROPOSED-COPY
      tagline: 'Where Learning Pops, Confidence Grows & Students Succeed!', // PROPOSED-COPY
      subhead: 'Personalised Academic Support. Innovative Learning. Real Results.', // PROPOSED-COPY
      options: [
        {
          key: 'tutoring',
          title: 'Tutoring',
          name: brand.services['traditional-tutoring'].name,
          slug: 'traditional-tutoring',
          desc: 'Personalised learning support tailored to individual student curriculum and pace.',
          ctaText: 'Explore Tutoring',
          href: '/services/traditional-tutoring',
          icon: '🎓'
        },
        {
          key: 'concierge',
          title: 'Concierge Coaching',
          name: brand.services['concierge'].name,
          slug: 'concierge',
          desc: 'Premium academic oversight, assignment tracking, and executive coaching.',
          ctaText: 'Explore Coaching',
          href: '/services/concierge',
          icon: '👑'
        },
        {
          key: 'popcorn',
          title: 'Popcorn Math',
          name: brand.services['popcorn-maths'].name,
          slug: 'popcorn-maths',
          desc: 'Fun, energetic, hands-on mathematics sessions that build fluency and confidence.',
          ctaText: 'Discover Popcorn Math',
          href: '/services/popcorn-maths',
          icon: '🍿'
        }
      ],
      primaryCtas: [
        { label: 'BOOK A CONSULTATION', href: '/book', variant: 'primary' },
        { label: 'EXPLORE OUR PROGRAMMES', href: '#services', variant: 'secondary' }
      ]
    },
    launchStatus: {
      title: 'Platform Launch Status',
      badge: 'Coming Soon',
      launchDateNote: 'TODO(content): Official Launch Date Pending Owner Confirmation',
      description: 'We are preparing our educational programmes for students across Anguilla and beyond. Register below for launch notifications and enrollment announcements.'
    }
  },

  services: brand.services
};

module.exports = SITE_CONTENT;
