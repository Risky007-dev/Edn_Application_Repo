/**
 * Main Client Application Script
 * Strict CSP compliant: No inline event handlers or scripts.
 * Manages responsive hamburger navigation, accessible keyboard dropdowns, and theme switcher.
 */

// Initialize theme immediately to prevent layout flashes
(function initThemeEarly() {
  try {
    var saved = localStorage.getItem('tt_theme');
    var theme = saved === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    // Fallback if localStorage is inaccessible
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();

function updateThemeToggleButton(theme) {
  var btn = document.getElementById('theme-toggle-btn');
  if (!btn) return;
  var isDark = theme === 'dark';
  btn.setAttribute('aria-label', isDark ? 'Switch to bright kid-friendly mode' : 'Switch to dark mode');
  btn.setAttribute('title', isDark ? 'Switch to bright mode' : 'Switch to dark mode');
  var textEl = btn.querySelector('.theme-mode-text');
  if (textEl) {
    textEl.textContent = isDark ? 'Dark' : 'Light';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // 0. Theme Toggle Switcher
  var themeBtn = document.getElementById('theme-toggle-btn');
  var currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  updateThemeToggleButton(currentTheme);

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      var activeTheme = document.documentElement.getAttribute('data-theme') || 'light';
      var nextTheme = activeTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nextTheme);
      try {
        localStorage.setItem('tt_theme', nextTheme);
      } catch (e) {}
      updateThemeToggleButton(nextTheme);
    });
  }

  // 1. Mobile Hamburger Navigation
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const siteNav = document.getElementById('site-nav');

  if (hamburgerBtn && siteNav) {
    hamburgerBtn.addEventListener('click', () => {
      const isExpanded = hamburgerBtn.getAttribute('aria-expanded') === 'true';
      hamburgerBtn.setAttribute('aria-expanded', String(!isExpanded));
      hamburgerBtn.classList.toggle('active', !isExpanded);
      siteNav.classList.toggle('open', !isExpanded);
    });

    // Close mobile nav on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && siteNav.classList.contains('open')) {
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        hamburgerBtn.classList.remove('active');
        siteNav.classList.remove('open');
        hamburgerBtn.focus();
      }
    });
  }

  // 2. Keyboard-Accessible Dropdowns
  const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

  dropdownToggles.forEach((toggle) => {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
      
      // Close other dropdowns
      dropdownToggles.forEach((t) => {
        if (t !== toggle) {
          t.setAttribute('aria-expanded', 'false');
          const p = t.closest('.dropdown');
          if (p) p.classList.remove('open');
        }
      });

      toggle.setAttribute('aria-expanded', String(!isExpanded));
      const parent = toggle.closest('.dropdown');
      if (parent) {
        parent.classList.toggle('open', !isExpanded);
      }
    });

    // Keyboard support: Enter or Space
    toggle.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const parent = toggle.closest('.dropdown');
        if (parent) {
          parent.classList.add('open');
          toggle.setAttribute('aria-expanded', 'true');
          const firstLink = parent.querySelector('.dropdown-link');
          if (firstLink) firstLink.focus();
        }
      }
    });
  });

  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) {
      dropdownToggles.forEach((t) => {
        t.setAttribute('aria-expanded', 'false');
        const p = t.closest('.dropdown');
        if (p) p.classList.remove('open');
      });
    }
  });

  // 3. Homepage Interest Form (/subscribe)
  const subscribeForm = document.getElementById('subscribe-form');
  const subscribeStatus = document.getElementById('subscribe-status');

  if (subscribeForm && subscribeStatus) {
    subscribeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('subscribe-email');
      const email = (emailInput ? emailInput.value : '').trim();

      if (!email) {
        subscribeStatus.className = 'form-status error';
        subscribeStatus.textContent = 'Please enter a valid email address.';
        return;
      }

      const submitBtn = subscribeForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      subscribeStatus.className = 'form-status loading';
      subscribeStatus.textContent = 'Submitting...';

      try {
        const res = await fetch('/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();

        if (res.ok) {
          subscribeStatus.className = 'form-status success';
          subscribeStatus.textContent = data.message || 'Thank you for registering your interest!';
          subscribeForm.reset();
        } else {
          subscribeStatus.className = 'form-status error';
          subscribeStatus.textContent = data.message || 'Error subscribing. Please try again.';
        }
      } catch (err) {
        subscribeStatus.className = 'form-status error';
        subscribeStatus.textContent = 'Network error. Please try again later.';
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  // 4. Popcorn Math Location Directory (Feature P1)
  const locSelect = document.getElementById('popcorn-location-select');
  const locDetails = document.getElementById('location-details');

  if (locSelect && locDetails) {
    let locations = [];
    try {
      locations = JSON.parse(locSelect.getAttribute('data-locations') || '[]');
    } catch (e) {}

    locSelect.addEventListener('change', () => {
      const selectedId = locSelect.value;
      const found = locations.find(l => l.id === selectedId);
      if (found) {
        const titleEl = document.getElementById('loc-title');
        const venueEl = document.getElementById('loc-venue');
        const schedEl = document.getElementById('loc-schedule');
        const agesEl = document.getElementById('loc-ages');
        const statusEl = document.getElementById('loc-status');
        const ctaEl = document.getElementById('loc-cta');

        if (titleEl) titleEl.textContent = found.name;
        if (venueEl) venueEl.textContent = found.venue;
        if (schedEl) schedEl.textContent = found.schedule;
        if (agesEl) agesEl.textContent = found.ages;
        if (statusEl) {
          statusEl.textContent = found.status;
          statusEl.className = 'badge ' + (found.status === 'Active Cohort' ? 'bg-success text-white' : 'bg-primary text-white');
        }
        if (ctaEl) {
          ctaEl.href = '/book?service=popcorn-maths&location=' + encodeURIComponent(found.name);
        }
        locDetails.style.display = 'block';
      }
    });
  }

  // 5. Concierge Readiness Survey (Feature C1)
  const surveySection = document.getElementById('readiness-survey');
  const surveyResult = document.getElementById('survey-result');
  const surveyApplyBtn = document.getElementById('survey-apply-btn');
  const conciergeGoals = document.getElementById('academicGoals');

  if (surveySection && surveyResult) {
    const radios = surveySection.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
      radio.addEventListener('change', () => {
        const q1Val = (surveySection.querySelector('input[name="survey-q1"]:checked') || {}).value;
        const q2Val = (surveySection.querySelector('input[name="survey-q2"]:checked') || {}).value;
        const h4 = surveyResult.querySelector('h4');
        const p = surveyResult.querySelector('p');

        if (q1Val === 'executive' || q2Val === 'high') {
          if (h4) h4.textContent = 'Strong Match for Concierge Coaching';
          if (p) p.textContent = 'Your family would benefit significantly from structured academic oversight, deadline management, and direct educator accountability.';
        } else {
          if (h4) h4.textContent = 'Personalised Tutoring May Also Be Suitable';
          if (p) p.textContent = 'If support is primarily needed for specific subject topics, 1-to-1 Personalised Tutoring is also an excellent pathway.';
        }
      });
    });

    if (surveyApplyBtn && conciergeGoals) {
      surveyApplyBtn.addEventListener('click', () => {
        if (!conciergeGoals.value.includes('[Self-Assessment:')) {
          conciergeGoals.value = (conciergeGoals.value ? conciergeGoals.value + '\n\n' : '') +
            '[Self-Assessment: Seeking structured academic oversight and executive coaching]';
        }
      });
    }
  }

  // 6. Printable Consultation Preparation Checklist (Feature T3)
  const printChecklistBtn = document.getElementById('btn-print-checklist');
  if (printChecklistBtn) {
    printChecklistBtn.addEventListener('click', () => {
      window.print();
    });
  }
});
