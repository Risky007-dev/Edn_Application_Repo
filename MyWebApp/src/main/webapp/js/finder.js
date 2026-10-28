/**
 * Smart Service Finder Client Controller
 * Pure in-memory calculation.
 * Strictly zero storage, zero analytics, zero external requests.
 */

(function () {
  'use strict';

  var SERVICES = {
    'popcorn-maths': {
      title: 'We Recommend Popcorn Math!',
      canonicalName: 'Popcorn Math',
      reason: 'Your child may benefit from our engaging mathematics programme designed to develop confidence, fluency, and problem-solving skills.',
      url: '/services/popcorn-maths',
      ctaText: 'Explore Popcorn Math'
    },
    'concierge': {
      title: 'We Recommend Concierge Academic Coaching!',
      canonicalName: 'Concierge Academic Coaching',
      reason: 'Your child will benefit from dedicated academic management, deadline monitoring, organisation, and regular parent progress roadmaps.',
      url: '/services/concierge',
      ctaText: 'Apply for Concierge Coaching'
    },
    'specialist-support': {
      title: 'We Recommend Individualised Learning Support!',
      canonicalName: 'Individualised Learning Support',
      reason: 'Your child will benefit from structured routines, multi-sensory approaches, differentiated pacing, and personalised academic strategies.',
      url: '/services/specialist-support',
      ctaText: 'Explore Individualised Support'
    },
    'traditional-tutoring': {
      title: 'We Recommend Personalised Tutoring & Academic Support!',
      canonicalName: 'Personalised Tutoring & Academic Support',
      reason: 'Tailored one-to-one and focused small group instruction aligned directly with your child’s curriculum and immediate learning goals.',
      url: '/services/traditional-tutoring',
      ctaText: 'Explore Personalised Tutoring'
    }
  };

  function computeRecommendation(yearGroup, supportWanted, levelOfSupport) {
    var yg = (yearGroup || '').toLowerCase();
    var sw = (supportWanted || '').toLowerCase();
    var ls = (levelOfSupport || '').toLowerCase();

    // 1. Comprehensive management or organisation
    if (ls === 'comprehensive' || sw === 'organisation') {
      return SERVICES.concierge;
    }

    // 2. Learning support (strictly using "Individualised Learning Support" terminology)
    if (sw === 'learning-support') {
      return SERVICES['specialist-support'];
    }

    // 3. Popcorn Math
    if (sw === 'maths' && (yg === 'early-primary' || yg === 'upper-primary' || ls === 'group' || sw === 'enrichment')) {
      return SERVICES['popcorn-maths'];
    }

    // 4. Default Personalised Tutoring
    return SERVICES['traditional-tutoring'];
  }

  function initFinder() {
    var container = document.getElementById('finder-form-container');
    var btn = document.getElementById('btn-find-recommendation');
    var recContainer = document.getElementById('finder-recommendation');
    var recTitle = document.getElementById('rec-title');
    var recReason = document.getElementById('rec-reason');
    var recCtaLink = document.getElementById('rec-cta-link');

    if (!btn || !container) return;

    // Check optional hint allowlist
    var hint = container.getAttribute('data-initial-hint');
    if (hint) {
      if (hint === 'popcorn-maths') {
        var mathRadio = document.querySelector('input[name="supportWanted"][value="maths"]');
        if (mathRadio) mathRadio.checked = true;
      } else if (hint === 'concierge') {
        var compRadio = document.querySelector('input[name="levelOfSupport"][value="comprehensive"]');
        if (compRadio) compRadio.checked = true;
      } else if (hint === 'specialist-support') {
        var specRadio = document.querySelector('input[name="supportWanted"][value="learning-support"]');
        if (specRadio) specRadio.checked = true;
      }
    }

    btn.addEventListener('click', function () {
      var selectedYear = document.querySelector('input[name="yearGroup"]:checked');
      var selectedSupport = document.querySelector('input[name="supportWanted"]:checked');
      var selectedLevel = document.querySelector('input[name="levelOfSupport"]:checked');

      var yearVal = selectedYear ? selectedYear.value : 'upper-primary';
      var supportVal = selectedSupport ? selectedSupport.value : 'maths';
      var levelVal = selectedLevel ? selectedLevel.value : 'weekly';

      var rec = computeRecommendation(yearVal, supportVal, levelVal);

      if (recTitle) recTitle.textContent = rec.title;
      if (recReason) recReason.textContent = rec.reason;
      if (recCtaLink) {
        recCtaLink.href = rec.url;
        recCtaLink.textContent = rec.ctaText + ' →';
      }

      if (recContainer) {
        recContainer.style.display = 'block';
        recContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        recTitle.setAttribute('tabindex', '-1');
        recTitle.focus();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFinder);
  } else {
    initFinder();
  }
})();

