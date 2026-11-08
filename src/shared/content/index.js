/**
 * Centralized Site Content Data Registry
 * Project: Tutor Time / Popcorn Math
 *
 * CONTENT RULES:
 * - All promotional copy and advisory headlines from REQUIREMENTS_CASSIE_v1.md
 *   are marked with { text: "...", status: "PROPOSED-COPY" }.
 * - Unstipulated copy is marked { text: "Details coming soon.", status: "STUB", todo: "content" }.
 * - No advertised pay, rates, prices, qualifications, specialist claims, or competitor mentions.
 */

const brand = require('../brand');

const CONTENT = {
  global: {
    siteName: { text: 'Tutor Time with Teacher Cassie', status: 'APPROVED' },
    parentBrand: { text: 'Tutor Time', status: 'APPROVED' },
    tagline: { text: 'Where Learning Pops, Confidence Grows & Students Succeed!', status: 'APPROVED' },
    subhead: { text: 'Personalised Academic Support. Innovative Learning. Real Results.', status: 'APPROVED' },
    privacyNote: { text: 'I agree to the processing of my details in accordance with the Privacy Policy. Details coming soon.', status: 'APPROVED' },
    detailsComingSoon: { text: 'Details coming soon.', status: 'STUB', todo: 'content' }
  },

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
        { label: 'Play & Learn', href: '/popcorn-maths/game' },
        { label: 'School Partnerships', href: '/popcorn-maths/school-partnership' },
        { label: 'Become a Presenter', href: '/popcorn-maths/presenter' }
      ]
    },
    { label: 'RESOURCES', href: '/resources' },
    { label: 'FAQ', href: '/faq' },
    { label: 'CONTACT', href: '/contact' },
    { label: 'BOOK NOW', href: '/book', isCta: true }
  ],

  footer: {
    copyright: { text: `© ${new Date().getFullYear()} Tutor Time with Teacher Cassie. All rights reserved.`, status: 'APPROVED' },
    legalNotice: { text: 'Details coming soon.', status: 'APPROVED' }
  },

  homepage: {
    hero: {
      headline: { text: 'TUTOR TIME WITH TEACHER CASSIE', status: 'APPROVED' },
      tagline: { text: 'Where Learning Pops, Confidence Grows & Students Succeed!', status: 'APPROVED' },
      subhead: { text: 'Personalised Academic Support. Innovative Learning. Real Results.', status: 'APPROVED' },
      ctaBook: { text: 'Book a Consultation', status: 'APPROVED' },
      ctaExplore: { text: 'Explore Our Programmes', status: 'APPROVED' },
      options: [
        {
          key: 'tutoring',
          title: { text: 'Tutoring', status: 'APPROVED' },
          name: { text: 'Personalised Tutoring & Academic Support', status: 'APPROVED' },
          desc: { text: 'Personalised learning support tailored to individual student curriculum and pace.', status: 'APPROVED' },
          cta: { text: 'Explore Tutoring', status: 'APPROVED' },
          href: '/services/traditional-tutoring',
          icon: '🎓'
        },
        {
          key: 'concierge',
          title: { text: 'Concierge Coaching', status: 'APPROVED' },
          name: { text: 'Concierge Academic Coaching', status: 'APPROVED' },
          desc: { text: 'Premium academic oversight, assignment tracking, and executive coaching.', status: 'APPROVED' },
          cta: { text: 'Explore Coaching', status: 'APPROVED' },
          href: '/services/concierge',
          icon: '👑'
        },
        {
          key: 'popcorn',
          title: { text: 'Popcorn Math', status: 'APPROVED' },
          name: { text: 'Popcorn Math', status: 'APPROVED' },
          desc: { text: 'Fun, energetic, hands-on mathematics sessions that build fluency and confidence.', status: 'APPROVED' },
          cta: { text: 'Discover Popcorn Math', status: 'APPROVED' },
          href: '/services/popcorn-maths',
          icon: '🍿'
        }
      ]
    },
    subscribeSection: {
      title: { text: 'Stay Connected with Tutor Time', status: 'APPROVED' },
      description: { text: 'Register your email address to receive program updates and educational resources.', status: 'APPROVED' },
      buttonText: { text: 'Register Interest', status: 'APPROVED' }
    }
  },

  services: {
    'traditional-tutoring': {
      title: { text: 'Personalised Tutoring & Academic Support', status: 'APPROVED' },
      tagline: { text: 'Tailored one-to-one and small group learning aligned with individual curriculum goals.', status: 'APPROVED' },
      overview: { text: 'Our personalized tutoring meets students where they are, developing academic mastery, study routines, and self-confidence across core subjects.', status: 'APPROVED' },
      features: [
        { text: 'One-on-One instruction tailored to individual learning styles', status: 'APPROVED' },
        { text: 'Small group collaborative learning sessions', status: 'APPROVED' },
        { text: 'Curriculum-aligned homework and examination preparation', status: 'APPROVED' },
        { text: 'Continuous feedback and progress tracking for parents', status: 'APPROVED' }
      ],
      cta: { text: 'Book a Consultation', href: '/book?service=One-on-One%20Tutoring', status: 'APPROVED' }
    },

    'concierge': {
      title: { text: 'Concierge Academic Coaching', status: 'APPROVED' },
      headline: { text: "Your Child's Education, Personally Managed.", status: 'APPROVED' },
      tagline: { text: 'More Than Tutoring. A Personalised Approach to Academic Success.', status: 'APPROVED' },
      overview: { text: 'From assignment tracking to examination preparation, our Concierge Academic Coaching service provides comprehensive academic guidance to help students stay organised, prepared, and supported.', status: 'APPROVED' },
      expectationsTitle: { text: 'What Parents Can Expect', status: 'APPROVED' },
      expectations: [
        { text: 'Academic planning and organisation', status: 'APPROVED' },
        { text: 'Assignment and deadline monitoring', status: 'APPROVED' },
        { text: 'Examination preparation planning', status: 'APPROVED' },
        { text: 'Personalised academic goals', status: 'APPROVED' },
        { text: 'Regular progress updates', status: 'APPROVED' },
        { text: 'Executive functioning and study skills support', status: 'APPROVED' },
        { text: 'Parent communication and academic accountability', status: 'APPROVED' }
      ],
      ctaText: { text: 'Apply for Concierge Coaching', status: 'APPROVED' }
    },

    'popcorn-maths': {
      title: { text: 'Popcorn Math', status: 'APPROVED' },
      headline: { text: 'Where Math Skills POP!', status: 'APPROVED' },
      tagline: { text: 'Making Mathematics Fun, Interactive & Unforgettable!', status: 'APPROVED' },
      overview: { text: 'Popcorn Math transforms mathematics into an exciting learning experience through games, challenges, movement, and hands-on activities.', status: 'APPROVED' },
      ctaSession: { text: 'Join a Popcorn Math Session', href: '/contact?subject=popcorn-session', status: 'APPROVED' },
      ctaSchool: { text: 'Bring Popcorn Math to Your School', href: '/contact?subject=school-partnership', status: 'APPROVED' },
      ctaPresenter: { text: 'Become a Popcorn Math Presenter', href: '/popcorn-maths/presenter', status: 'APPROVED' }
    },

    'specialist-support': {
      title: { text: 'Individualised Learning Support', status: 'APPROVED' },
      tagline: { text: 'Differentiated instruction, structured routines, and executive functioning strategies.', status: 'APPROVED' },
      overview: { text: 'Supporting students who benefit from structured routines, multi-sensory approaches, executive functioning strategies, and personalised academic pacing.', status: 'APPROVED' },
      helperNotice: { text: 'Note: Please describe learning styles and strengths. Do not include clinical diagnoses, medical reports, or sensitive health data.', status: 'APPROVED' }
    }
  },

  presenter: {
    title: { text: 'Become a Popcorn Math Presenter', status: 'APPROVED' },
    badge: { text: "WE'RE HIRING!", status: 'APPROVED' },
    tagline: { text: 'Love Mathematics? Love Working With Children? Have a Big Personality?', status: 'APPROVED' },
    lead: { text: "We're looking for enthusiastic, creative, and energetic individuals to help bring Popcorn Math to life!", status: 'APPROVED' },
    description: { text: "As a Popcorn Math Presenter, you'll lead interactive mathematics sessions, facilitate engaging challenges, and help children discover that learning mathematics can be fun.", status: 'APPROVED' },
    whoWeLookForTitle: { text: "Who We're Looking For", status: 'APPROVED' },
    qualities: [
      { text: 'Confident and enthusiastic communicators', status: 'APPROVED' },
      { text: 'Individuals who enjoy working with children', status: 'APPROVED' },
      { text: 'Creative thinkers who bring energy to learning', status: 'APPROVED' },
      { text: 'People with strong foundational mathematics skills', status: 'APPROVED' },
      { text: 'Reliable, professional team players', status: 'APPROVED' },
      { text: 'Teachers, university students, aspiring educators, and individuals with relevant experience are welcome to apply', status: 'APPROVED' }
    ],
    whatWeOfferTitle: { text: 'What We Offer', status: 'APPROVED' },
    whatWeOfferContent: { text: 'Details coming soon.', status: 'STUB', todo: 'content' }
  },

  bookPage: {
    title: { text: 'Book a Consultation', status: 'APPROVED' },
    subhead: { text: 'Schedule an initial discussion to find the right academic pathway for your child.', status: 'APPROVED' },
    serviceOptions: [
      'One-on-One Tutoring',
      'Small Group Tutoring',
      'Concierge Academic Coaching',
      'Popcorn Math',
      'Specialist Learning Support',
      'School Partnership'
    ],
    yearGroupOptions: [
      'Early Primary',
      'Upper Primary',
      'Secondary'
    ]
  },

  contactPage: {
    title: { text: 'Contact Us', status: 'APPROVED' },
    subhead: { text: 'Get in touch with Teacher Cassie and the Tutor Time team.', status: 'APPROVED' },
    whatsappCta: { text: 'Chat with Teacher Cassie on WhatsApp', status: 'APPROVED' }
  },

  faqPage: {
    title: { text: 'Frequently Asked Questions', status: 'APPROVED' },
    subhead: { text: 'Answers to common questions about our programmes and consultations.', status: 'APPROVED' },
    items: [
      {
        question: { text: 'What is the difference between Tutoring and Concierge Academic Coaching?', status: 'APPROVED' },
        answer: { text: 'Tutoring provides focused instructional support in specific subjects, while Concierge Academic Coaching provides ongoing academic management, deadline monitoring, study skills, and holistic parent communication.', status: 'APPROVED' }
      },
      {
        question: { text: 'What is Popcorn Math?', status: 'APPROVED' },
        answer: { text: 'Popcorn Math is an energetic, interactive mathematics programme designed to make math concepts fun, visual, and memorable through challenges, games, and hands-on activities.', status: 'APPROVED' }
      },
      {
        question: { text: 'How do consultations work?', status: 'APPROVED' },
        answer: { text: 'Before commencing Concierge Coaching or bespoke learning support, we conduct an initial consultation with parents to assess student needs, learning goals, and schedule availability.', status: 'APPROVED' }
      },
      {
        question: { text: 'Who can apply to become a Popcorn Math Presenter?', status: 'APPROVED' },
        answer: { text: 'We welcome enthusiastic educators, university students, and dynamic individuals aged 18 or older who love math and enjoy working with young learners.', status: 'APPROVED' }
      },
      {
        question: { text: 'Can schools book Popcorn Math workshops?', status: 'APPROVED' },
        answer: { text: 'Yes, schools can enquire about in-school workshops, enrichment days, and after-school clubs. Submit an enquiry via our Contact page to discuss custom school programmes.', status: 'APPROVED' }
      },
      {
        question: { text: 'What are session rates and schedules?', status: 'APPROVED' },
        answer: { text: 'Details coming soon.', status: 'STUB', todo: 'content' }
      }
    ]
  },

  aboutPage: {
    title: { text: 'About Tutor Time', status: 'APPROVED' },
    lead: { text: 'Dedicated to inspiring academic confidence and joyful learning.', status: 'APPROVED' },
    mission: { text: 'Details coming soon.', status: 'STUB', todo: 'content' },
    biography: { text: 'Details coming soon.', status: 'STUB', todo: 'content' }
  },

  gamePage: {
    title: { text: 'Popcorn Math Mini-Game', status: 'APPROVED' },
    headline: { text: 'CAN YOU MAKE THE POPCORN POP?', status: 'APPROVED' },
    subhead: { text: 'Solve 3 Math Questions to Fill Your Popcorn Bucket!', status: 'APPROVED' },
    starTitle: { text: "YOU'RE A POPCORN MATH STAR!", status: 'APPROVED' },
    starLead: { text: 'Want more exciting mathematics challenges? Join our next Popcorn Math session!', status: 'APPROVED' },
    starCta: { text: 'EXPLORE POPCORN MATH', status: 'APPROVED' },
    privacyNotice: { text: 'This game does not collect or store any personal data or responses.', status: 'APPROVED' }
  },

  finderPage: {
    title: { text: 'Smart Service Finder', status: 'APPROVED' },
    headline: { text: 'Not Sure Which Programme Is Right for Your Child?', status: 'APPROVED' },
    subhead: { text: 'Answer three quick questions to discover the most relevant educational programme for your child.', status: 'APPROVED' },
    privacyNotice: { text: 'Your answers are held in memory only and are never saved or sent to a server.', status: 'APPROVED' }
  },

  schoolEnquiryPage: {
    title: { text: 'Bring Popcorn Math to Your School', status: 'APPROVED' },
    headline: { text: 'BRING POPCORN MATH TO YOUR SCHOOL!', status: 'APPROVED' },
    tagline: { text: 'Transform Ordinary Mathematics Lessons Into Extraordinary Learning Experiences!', status: 'APPROVED' },
    overview: { text: 'Our interactive mathematics sessions are designed to engage students through movement, games, problem-solving, and collaborative challenges.', status: 'APPROVED' },
    disclaimer: { text: 'Please note: Submitting this form is an enquiry to discuss custom school workshops and scheduling; it is not a confirmed booking.', status: 'APPROVED' }
  },

  resourcesPage: {
    title: { text: 'Educational Resources', status: 'APPROVED' },
    headline: { text: 'Educational Resources', status: 'APPROVED' },
    details: { text: 'Details coming soon.', status: 'STUB', todo: 'content' }
  },

  popcornLocations: [
    {
      id: 'the-valley',
      name: 'The Valley (Central)',
      venue: 'The Valley Community Center',
      schedule: 'Saturdays, 9:30 AM – 11:00 AM',
      ages: 'Ages 5–11',
      status: 'Active Cohort'
    },
    {
      id: 'sandy-ground',
      name: 'Sandy Ground',
      venue: 'Sandy Ground Learning Hub',
      schedule: 'Wednesdays, 3:45 PM – 5:00 PM',
      ages: 'Ages 5–11',
      status: 'Registering Interest'
    },
    {
      id: 'island-harbour',
      name: 'Island Harbour',
      venue: 'East End Community Hall',
      schedule: 'Thursdays, 3:45 PM – 5:00 PM',
      ages: 'Ages 6–12',
      status: 'Registering Interest'
    },
    {
      id: 'west-end',
      name: 'West End',
      venue: 'West End Parish Classroom',
      schedule: 'Saturdays, 1:00 PM – 2:30 PM',
      ages: 'Ages 5–11',
      status: 'Active Cohort'
    },
    {
      id: 'virtual',
      name: 'Online / Virtual Cohort',
      venue: 'Interactive Live Video Classroom',
      schedule: 'Tuesdays & Thursdays, 4:30 PM – 5:30 PM',
      ages: 'Ages 7–13',
      status: 'Active Cohort'
    }
  ]
};

module.exports = CONTENT;
