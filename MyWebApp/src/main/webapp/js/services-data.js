/**
 * ============================================================================
 * TUTOR TIME / POPCORN MATH — SHARED CLIENT DATA & COMPONENT RENDERER
 * Single source of truth for navigation, canonical services, logos, and footer.
 * ============================================================================
 */

const SERVICES_DATA = [
  {
    slug: 'traditional-tutoring',
    title: 'Personalised Tutoring & Academic Support',
    shortTitle: 'Tutoring',
    tagline: 'Tailored 1-on-1 Academic Tutoring',
    description: 'TODO(content): Personalized one-to-one tutoring sessions across core academic curricula, tailored to individual student needs and pacing.',
    colorToken: 'var(--color-brand-traditional-primary)',
    accentToken: 'var(--color-brand-traditional-secondary)',
    logoUrl: '/assets/logos/TT_logo.jpg',
    status: 'Coming Soon',
    pageUrl: '/services/traditional-tutoring',
    badgeClass: 'status-coming-soon'
  },
  {
    slug: 'concierge',
    title: 'Concierge Academic Coaching',
    shortTitle: 'Concierge Coaching',
    tagline: 'Premium Academic Oversight & Mentorship',
    description: 'TODO(content): Premium learning tier integrating executive academic coaching, organization, and tailored student progress roadmaps.',
    colorToken: 'var(--color-brand-concierge-primary)',
    accentToken: 'var(--color-brand-concierge-secondary)',
    logoUrl: '/assets/logos/TT_logo.jpg',
    status: 'Coming Soon',
    pageUrl: '/services/concierge',
    badgeClass: 'status-coming-soon'
  },
  {
    slug: 'popcorn-maths',
    title: 'Popcorn Math',
    shortTitle: 'Popcorn Math',
    tagline: 'Where Math Skills POP! (Ages 8–13)',
    description: 'TODO(content): Engaging community-based mathematics program where young mentors guide children aged 8–13 in designated school hubs.',
    colorToken: 'var(--color-brand-popcorn-primary)',
    accentToken: 'var(--color-brand-popcorn-secondary)',
    logoUrl: '/assets/logos/popcorn-math-logo.png',
    status: 'Coming Soon',
    pageUrl: '/services/popcorn-maths',
    badgeClass: 'status-coming-soon',
    hasSchoolProgram: true
  },
  {
    slug: 'specialist-support',
    title: 'Individualised Learning Support',
    shortTitle: 'Learning Support',
    tagline: 'Structured Routines & Differentiated Learning',
    description: 'TODO(content): Targeted pedagogical frameworks focusing on strengths, structured routines, and executive functioning assistance.',
    colorToken: 'var(--color-brand-specialist-primary)',
    accentToken: 'var(--color-brand-specialist-secondary)',
    logoUrl: '/assets/logos/TT_logo.jpg',
    status: 'Coming Soon',
    pageUrl: '/services/specialist-support',
    badgeClass: 'status-coming-soon'
  }
];

const NAVIGATION_ITEMS = [
  { label: 'HOME', href: '/' },
  { label: 'ABOUT', href: '/about' },
  {
    label: 'OUR SERVICES',
    href: '#services',
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
];

/**
 * Generates semantic HTML markup for a service card.
 */
function createServiceCardHTML(service) {
  const isPopcorn = service.slug === 'popcorn-maths';
  const logoMarkup = service.logoUrl
    ? `<img src="${service.logoUrl}" alt="${service.title} logo" class="card-logo-img ${isPopcorn ? 'card-logo-popcorn' : ''}" />`
    : `<div class="logo-placeholder card-logo"><span>Logo</span></div>`;

  return `
    <article class="service-card" style="--card-accent-color: ${service.colorToken};" data-slug="${service.slug}">
      <div class="card-header">
        <div class="card-brand-mark">${logoMarkup}</div>
        <span class="status-pill ${service.badgeClass}">${service.status}</span>
      </div>
      <h3 class="card-title">${service.title}</h3>
      <div class="card-tagline" style="color: ${service.accentToken};">${service.tagline}</div>
      <p class="card-desc">${service.description}</p>
      <div class="card-footer">
        <a href="${service.pageUrl}" class="btn btn-outline btn-sm" aria-label="Explore ${service.title}">
          Explore Service &rarr;
        </a>
      </div>
    </article>
  `;
}

/**
 * Renders all service cards into the designated container element.
 */
function renderServicesGrid(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = SERVICES_DATA.map(createServiceCardHTML).join('');
}

/**
 * Renders the top navigation header with logo, dropdown menus, and responsive toggle.
 */
function renderHeader(headerId = 'site-header') {
  const header = document.getElementById(headerId);
  if (!header) return;

  const navHtml = NAVIGATION_ITEMS.map((item) => {
    if (item.dropdown) {
      const dropItems = item.dropdown
        .map(sub => `<a href="${sub.href}" class="dropdown-item">${sub.label}</a>`)
        .join('');
      return `
        <li class="nav-item has-dropdown">
          <a href="${item.href}" class="nav-link dropdown-toggle" aria-expanded="false">
            ${item.label} <span class="caret" aria-hidden="true">▾</span>
          </a>
          <div class="nav-dropdown" role="menu">
            ${dropItems}
          </div>
        </li>
      `;
    }
    if (item.isCta) {
      return `
        <li class="nav-item nav-cta-item">
          <a href="${item.href}" class="btn btn-primary btn-sm nav-cta-btn">${item.label}</a>
        </li>
      `;
    }
    return `
      <li class="nav-item">
        <a href="${item.href}" class="nav-link">${item.label}</a>
      </li>
    `;
  }).join('');

  header.innerHTML = `
    <div class="container header-inner">
      <a href="/" class="brand-wrapper" aria-label="Tutor Time with Teacher Cassie">
        <img src="/assets/logos/TT_logo.jpg" alt="Tutor Time Logo" class="brand-logo-img" />
        <div class="brand-text">
          <span class="brand-title">Tutor Time</span>
          <span class="brand-subtitle">with Tr. Cassie</span>
        </div>
      </a>

      <button class="mobile-nav-toggle" aria-label="Toggle navigation menu" aria-expanded="false" id="mobile-toggle">
        <span class="hamburger-bar"></span>
        <span class="hamburger-bar"></span>
        <span class="hamburger-bar"></span>
      </button>

      <nav class="main-nav" id="main-nav" aria-label="Main Navigation">
        <ul class="nav-list">
          ${navHtml}
        </ul>
      </nav>
    </div>
  `;

  // Attach mobile toggle listener
  const toggleBtn = document.getElementById('mobile-toggle');
  const mainNav = document.getElementById('main-nav');
  if (toggleBtn && mainNav) {
    toggleBtn.addEventListener('click', () => {
      const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      toggleBtn.setAttribute('aria-expanded', String(!expanded));
      mainNav.classList.toggle('nav-open');
    });
  }

  // Mobile dropdown touch support
  const dropdownToggles = header.querySelectorAll('.has-dropdown > .dropdown-toggle');
  dropdownToggles.forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (window.innerWidth < 992) {
        e.preventDefault();
        const parent = btn.parentElement;
        parent.classList.toggle('dropdown-open');
        const isExp = parent.classList.contains('dropdown-open');
        btn.setAttribute('aria-expanded', String(isExp));
      }
    });
  });
}

/**
 * Renders the site footer with Join Our Team links and dynamic WhatsApp button.
 */
function renderFooter(footerId = 'site-footer') {
  const footer = document.getElementById(footerId);
  if (!footer) return;

  const currentYear = new Date().getFullYear();

  footer.innerHTML = `
    <div class="container footer-inner">
      <div class="footer-grid">
        <div class="footer-col footer-brand-col">
          <div class="footer-brand">
            <img src="/assets/logos/TT_logo.jpg" alt="Tutor Time" class="footer-logo-img" />
            <span class="footer-brand-name">Tutor Time</span>
          </div>
          <p class="footer-tagline">Where Learning Pops, Confidence Grows &amp; Students Succeed!</p>
          <div class="whatsapp-btn-container" id="whatsapp-container">
            <a href="#" class="btn btn-whatsapp btn-sm" id="whatsapp-link" target="_blank" rel="noopener noreferrer">
              <span class="wa-icon" aria-hidden="true">💬</span> Chat on WhatsApp
            </a>
          </div>
        </div>

        <div class="footer-col">
          <h4 class="footer-col-title">Navigation</h4>
          <ul class="footer-links">
            <li><a href="/">Home</a></li>
            <li><a href="/about">About Teacher Cassie</a></li>
            <li><a href="/resources">Resources</a></li>
            <li><a href="/contact">Contact</a></li>
            <li><a href="/book">Book Consultation</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4 class="footer-col-title">Our Services</h4>
          <ul class="footer-links">
            <li><a href="/services/traditional-tutoring">Personalised Tutoring</a></li>
            <li><a href="/services/concierge">Concierge Coaching</a></li>
            <li><a href="/services/popcorn-maths">Popcorn Math</a></li>
            <li><a href="/services/specialist-support">Individualised Learning</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4 class="footer-col-title">Join Our Team</h4>
          <ul class="footer-links">
            <li><a href="/contact?subject=tutor-application">Become a Tutor</a></li>
            <li><a href="/popcorn-maths/presenter">Become a Popcorn Presenter</a></li>
          </ul>
          <div class="footer-badge-wrap">
            <span class="status-pill status-coming-soon">Launch 2026</span>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <p>&copy; ${currentYear} Tutor Time &amp; Popcorn Math. All rights reserved.</p>
        <div class="footer-legal">
          <a href="/privacy" class="legal-link">Privacy Notice (TODO: Legal)</a> &middot;
          <a href="/terms" class="legal-link">Terms (TODO: Legal)</a>
        </div>
      </div>
    </div>
  `;

  // Hydrate WhatsApp link dynamically from /api/brand-info
  fetch('/api/brand-info')
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      if (data && data.whatsapp && data.whatsapp.link && data.whatsapp.link !== '#') {
        const waLink = document.getElementById('whatsapp-link');
        if (waLink) {
          waLink.href = data.whatsapp.link;
        }
      }
    })
    .catch(() => {
      // Graceful fallback: WhatsApp button remains functional or opens contact page
    });
}

// Export for module environments if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SERVICES_DATA,
    NAVIGATION_ITEMS,
    createServiceCardHTML,
    renderServicesGrid,
    renderHeader,
    renderFooter
  };
}
