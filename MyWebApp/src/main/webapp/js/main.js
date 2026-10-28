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
});
