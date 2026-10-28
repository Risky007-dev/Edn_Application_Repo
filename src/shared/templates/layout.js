/**
 * Base HTML Layout Template
 * Provides semantic HTML5 skeleton, accessible navigation, hamburger menu,
 * strict CSP compliance (no inline scripts/events), and Chatbot placeholder.
 */

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderLayout({ title, description, bodyHtml, currentPath = '/' }) {
  const whatsappNum = (process.env.WHATSAPP_PHONE_NUMBER || '').trim();
  const whatsappLink = whatsappNum ? `https://wa.me/${whatsappNum.replace(/[^0-9]/g, '')}` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} | Tutor Time with Teacher Cassie</title>
  <meta name="description" content="${escapeHtml(description || 'Tutor Time with Teacher Cassie - Personalised Tutoring, Concierge Academic Coaching, and Popcorn Math.')}">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/favicon-32x32.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/icons/apple-touch-icon-180x180.png">
  <link rel="stylesheet" href="/css/tokens.css">
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>

  <header class="site-header">
    <div class="header-container">
      <a href="/" class="brand-link" aria-label="Tutor Time with Teacher Cassie Home">
        <img src="/assets/logos/tutor-time-logo.png" alt="Tutor Time Logo" class="brand-logo" width="48" height="48">
        <span class="brand-title">Tutor Time</span>
      </a>

      <button type="button" class="hamburger-btn" id="hamburger-btn" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="site-nav">
        <span class="bar"></span>
        <span class="bar"></span>
        <span class="bar"></span>
      </button>

      <nav class="site-nav" id="site-nav" aria-label="Main Navigation">
        <ul class="nav-list">
          <li class="nav-item"><a href="/" class="nav-link ${currentPath === '/' ? 'active' : ''}">Home</a></li>
          <li class="nav-item"><a href="/about" class="nav-link ${currentPath === '/about' ? 'active' : ''}">About</a></li>
          
          <li class="nav-item dropdown">
            <button type="button" class="nav-link dropdown-toggle" aria-expanded="false" aria-haspopup="true">
              Our Services <span class="arrow" aria-hidden="true">▾</span>
            </button>
            <ul class="dropdown-menu">
              <li><a href="/services/traditional-tutoring" class="dropdown-link">Personalised Tutoring</a></li>
              <li><a href="/services/concierge" class="dropdown-link">Concierge Academic Coaching</a></li>
              <li><a href="/services/specialist-support" class="dropdown-link">Individualised Learning Support</a></li>
            </ul>
          </li>

          <li class="nav-item dropdown">
            <button type="button" class="nav-link dropdown-toggle" aria-expanded="false" aria-haspopup="true">
              Popcorn Math <span class="arrow" aria-hidden="true">▾</span>
            </button>
            <ul class="dropdown-menu">
              <li><a href="/services/popcorn-maths" class="dropdown-link">About Popcorn Math</a></li>
              <li><a href="/popcorn-maths/presenter" class="dropdown-link">Become a Presenter</a></li>
            </ul>
          </li>

          <li class="nav-item"><a href="/faq" class="nav-link ${currentPath === '/faq' ? 'active' : ''}">FAQ</a></li>
          <li class="nav-item"><a href="/contact" class="nav-link ${currentPath === '/contact' ? 'active' : ''}">Contact</a></li>
          <li class="nav-item nav-cta"><a href="/book" class="btn btn-primary nav-book-btn">Book Now</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main id="main-content" class="main-content">
    ${bodyHtml}
  </main>

  <!-- TODO: AI Chatbot placeholder - Phase 3 evaluation per Cassie advisory -->

  <footer class="site-footer">
    <div class="footer-container">
      <div class="footer-column">
        <div class="footer-brand">
          <img src="/assets/logos/tutor-time-logo.png" alt="Tutor Time Logo" class="footer-logo" width="40" height="40">
          <h3>Tutor Time</h3>
        </div>
        <p class="footer-tagline">Where Learning Pops, Confidence Grows &amp; Students Succeed!</p>
        <p class="footer-legal-notice" data-todo="content">Tutor Time provides educational coaching and instructional support. <span class="todo-badge">TODO(legal)</span></p>
      </div>

      <div class="footer-column">
        <h4>Programmes</h4>
        <ul class="footer-links">
          <li><a href="/services/traditional-tutoring">Personalised Tutoring</a></li>
          <li><a href="/services/concierge">Concierge Academic Coaching</a></li>
          <li><a href="/services/popcorn-maths">Popcorn Math</a></li>
          <li><a href="/services/specialist-support">Individualised Learning Support</a></li>
        </ul>
      </div>

      <div class="footer-column">
        <h4>Join Our Team</h4>
        <ul class="footer-links">
          <li><a href="/popcorn-maths/presenter">Become a Popcorn Math Presenter</a></li>
          <li><a href="/contact?subject=tutor-application">Become a Tutor</a></li>
        </ul>
      </div>

      <div class="footer-column">
        <h4>Connect</h4>
        <ul class="footer-links">
          <li><a href="/contact">Contact Us</a></li>
          <li><a href="/book">Book a Consultation</a></li>
          <li><a href="/faq">FAQ</a></li>
          ${whatsappLink ? `<li><a href="${escapeHtml(whatsappLink)}" class="whatsapp-link" target="_blank" rel="noopener noreferrer">💬 WhatsApp Teacher Cassie</a></li>` : ''}
        </ul>
      </div>
    </div>

    <div class="footer-bottom">
      <div class="footer-bottom-container">
        <p class="copyright">&copy; ${new Date().getFullYear()} Tutor Time with Teacher Cassie. All rights reserved.</p>
        <div class="footer-meta-links" data-todo="content">
          <a href="/privacy">Privacy Policy</a>
          <span class="sep" aria-hidden="true">&bull;</span>
          <a href="/terms">Terms of Service</a>
          <span class="todo-badge">TODO(legal)</span>
        </div>
      </div>
    </div>
  </footer>

  <script src="/js/main.js"></script>
  <script src="/js/forms.js"></script>
</body>
</html>`;
}

module.exports = {
  escapeHtml,
  renderLayout
};
