/**
 * CPEA Readiness Check - Client-Side Interactive Engine (Mathematics & Language Arts Tracks)
 * 100% client-side, in-memory only, zero browser persistence.
 */

(function () {
  'use strict';

  var ACTIVE_SUBJECTS = ['Mathematics', 'Language Arts'];
  var QUESTIONS_PER_SESSION = 10;

  var questionsData = [];
  var activeSubject = null;
  var currentQuestions = [];
  var currentIndex = 0;
  var userAnswers = []; // { questionIndex, selectedIndex, isCorrect, subject }
  var streak = 0;
  var maxStreak = 0;
  var initialPickerHtml = '';

  // SVGs for dynamic mascot face updates when inline SVG fallback is active
  var mascotSvgs = {
    neutral: '<path d="M42 66 Q50 73 58 66" stroke="#1A365D" stroke-width="2.4" stroke-linecap="round" fill="none"/>',
    thinking: '<path d="M44 68 Q50 66 56 69" stroke="#1A365D" stroke-width="2.4" stroke-linecap="round" fill="none"/>',
    celebrating: '<path d="M39 65 Q50 79 61 65 Z" fill="#D94848" stroke="#1A365D" stroke-width="2" stroke-linejoin="round"/>',
    happy: '<path d="M41 66 Q50 76 59 66 Z" fill="#D94848" stroke="#1A365D" stroke-width="2" stroke-linejoin="round"/>'
  };

  function updateMascotReaction(expression, speechText) {
    var mascotEl = document.getElementById('readiness-mascot');
    var speechEl = document.getElementById('readiness-speech-text');

    if (mascotEl) {
      mascotEl.setAttribute('data-expression', expression);

      if (mascotEl.tagName && mascotEl.tagName.toLowerCase() === 'img') {
        var exprAttr = mascotEl.getAttribute('data-expressions');
        if (exprAttr) {
          try {
            var exprMap = JSON.parse(exprAttr);
            if (exprMap && exprMap[expression]) {
              mascotEl.setAttribute('src', exprMap[expression]);
            }
          } catch (e) {
            // Fall back to CSS expression state
          }
        }
        mascotEl.setAttribute('alt', 'Tutor Time Guide avatar (' + expression + ')');
      } else {
        var mouth = mascotEl.querySelector('path[d*="Q50"], path[d*="66 Q50"]');
        if (mouth && mascotSvgs[expression]) {
          var temp = document.createElement('div');
          temp.innerHTML = '<svg>' + mascotSvgs[expression] + '</svg>';
          var newPath = temp.querySelector('path');
          if (newPath) {
            mouth.setAttribute('d', newPath.getAttribute('d'));
            mouth.setAttribute('fill', newPath.getAttribute('fill'));
            mouth.setAttribute('stroke', newPath.getAttribute('stroke'));
          }
        }
      }
    }
    if (speechEl && speechText) {
      speechEl.textContent = speechText;
    }
  }

  function shuffleArray(list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function normalizeSubjectParam(raw) {
    if (!raw) return null;
    var s = String(raw).trim().toLowerCase();
    if (s === 'math' || s === 'maths' || s === 'mathematics') return 'Mathematics';
    if (s === 'la' || s === 'language-arts' || s === 'language arts' || s === 'english') return 'Language Arts';
    return null;
  }

  function pickSubjectSession(bank, subject) {
    var pool = bank.filter(function (q) { return q.subject === subject; });
    var selected = shuffleArray(pool).slice(0, QUESTIONS_PER_SESSION);

    return selected.map(function (q, idx) {
      var correctOptText = q.options[q.correctIndex];
      var shuffledOpts = shuffleArray(q.options);
      var newCorrectIdx = shuffledOpts.indexOf(correctOptText);

      return {
        number: idx + 1,
        id: q.id,
        subject: q.subject,
        prompt: q.prompt,
        passage: q.passage || null,
        imageSvg: q.imageSvg || null,
        options: shuffledOpts,
        correctIndex: newCorrectIdx,
        explanation: q.explanation
      };
    });
  }

  function clearStarsTrail() {
    var trail = document.getElementById('readiness-stars-trail');
    if (trail) trail.innerHTML = '';
  }

  function renderStarsTrail() {
    var trail = document.getElementById('readiness-stars-trail');
    if (!trail) return;
    trail.innerHTML = '';

    for (var i = 0; i < currentQuestions.length; i++) {
      var star = document.createElement('span');
      star.className = 'trail-star';
      star.setAttribute('aria-hidden', 'true');

      if (i < userAnswers.length) {
        var ans = userAnswers[i];
        if (ans && ans.isCorrect) {
          star.className += ' star-correct';
          star.textContent = '★';
          star.title = 'Question ' + (i + 1) + ': Correct';
        } else {
          star.className += ' star-attempted';
          star.textContent = '✦';
          star.title = 'Question ' + (i + 1) + ': Practised';
        }
      } else if (i === currentIndex) {
        star.className += ' star-current';
        star.textContent = '☆';
        star.title = 'Current Question ' + (i + 1);
      } else {
        star.className += ' star-upcoming';
        star.textContent = '•';
        star.title = 'Upcoming Question ' + (i + 1);
      }
      trail.appendChild(star);
    }
  }

  function renderSubjectPicker() {
    var container = document.getElementById('readiness-card');
    if (!container) return;

    activeSubject = null;
    currentQuestions = [];
    currentIndex = 0;
    userAnswers = [];
    streak = 0;
    maxStreak = 0;

    clearStarsTrail();
    if (initialPickerHtml) {
      container.innerHTML = initialPickerHtml;
    }

    updateMascotReaction('happy', 'Welcome! Pick Mathematics or Language Arts to try 10 sample questions together.');
    wirePickerButtons();
  }

  function wirePickerButtons() {
    var buttons = document.querySelectorAll('[data-start-subject]');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var subj = btn.getAttribute('data-start-subject');
        if (ACTIVE_SUBJECTS.indexOf(subj) !== -1) {
          startSubjectSession(subj);
        }
      });
    });
  }

  function renderCurrentQuestion() {
    var container = document.getElementById('readiness-card');
    var liveRegion = document.getElementById('readiness-live-announcer');
    if (!container) return;

    if (currentIndex >= currentQuestions.length) {
      renderResultsScreen();
      return;
    }

    var q = currentQuestions[currentIndex];
    renderStarsTrail();

    var streakBadge = '';
    if (streak >= 2) {
      streakBadge = '<div class="streak-badge" aria-label="Streak of ' + streak + ' correct answers">🔥 ' + streak + ' In a Row!</div>';
    }

    var passageHtml = q.passage
      ? '<div class="question-passage"><p><strong>Reading Passage:</strong></p><blockquote>' + escapeHtml(q.passage) + '</blockquote></div>'
      : '';
    var imageHtml = q.imageSvg ? '<div class="question-diagram">' + q.imageSvg + '</div>' : '';

    var subjectBadge = q.subject === 'Mathematics'
      ? '<span class="subject-badge badge-math">🔢 Mathematics</span>'
      : '<span class="subject-badge badge-la">📚 Language Arts</span>';

    var html = '' +
      '<div class="readiness-track-bar">' +
        '<span class="readiness-track-label">Track: <strong>' + escapeHtml(activeSubject) + '</strong> (Sample Practice)</span>' +
        '<button type="button" id="btn-change-subject" class="btn-link-subtle">← Change Subject</button>' +
      '</div>' +
      '<div class="question-header">' +
        '<div class="question-meta">' +
          '<span class="question-step">Question ' + (currentIndex + 1) + ' of ' + currentQuestions.length + '</span>' +
          subjectBadge +
        '</div>' +
        streakBadge +
      '</div>' +
      passageHtml +
      imageHtml +
      '<div class="question-prompt">' +
        '<h3 id="question-text">' + escapeHtml(q.prompt).replace(/\n/g, '<br>') + '</h3>' +
      '</div>' +
      '<form id="readiness-options-form" class="options-form" role="radiogroup" aria-labelledby="question-text">';

    var letters = ['A', 'B', 'C', 'D'];
    q.options.forEach(function (opt, optIdx) {
      var optId = 'opt-' + optIdx;
      html += '' +
        '<label class="option-label" for="' + optId + '" id="label-' + optIdx + '">' +
          '<input type="radio" name="cpea-choice" id="' + optId + '" value="' + optIdx + '" class="option-radio">' +
          '<span class="option-letter">' + letters[optIdx] + '</span>' +
          '<span class="option-text">' + escapeHtml(opt) + '</span>' +
        '</label>';
    });

    html += '' +
      '<div class="question-actions">' +
        '<button type="button" id="btn-submit-answer" class="btn btn-primary btn-large" disabled>Check My Answer</button>' +
      '</div>' +
      '</form>' +
      '<div id="question-feedback-area" class="feedback-area" hidden></div>';

    container.innerHTML = html;

    if (liveRegion) {
      liveRegion.textContent = activeSubject + ' Question ' + (currentIndex + 1) + ' of ' + currentQuestions.length + ': ' + q.prompt;
    }

    updateMascotReaction('neutral', 'Take your time! Read each option carefully.');

    var changeBtn = document.getElementById('btn-change-subject');
    if (changeBtn) {
      changeBtn.addEventListener('click', renderSubjectPicker);
    }

    var form = document.getElementById('readiness-options-form');
    var submitBtn = document.getElementById('btn-submit-answer');
    var radios = form.querySelectorAll('input[type="radio"]');

    radios.forEach(function (radio) {
      radio.addEventListener('change', function () {
        submitBtn.removeAttribute('disabled');
        updateMascotReaction('thinking', "Good thought! Click 'Check My Answer' when ready.");
        radios.forEach(function (r, idx) {
          var lbl = document.getElementById('label-' + idx);
          if (lbl) {
            if (r.checked) lbl.classList.add('option-selected');
            else lbl.classList.remove('option-selected');
          }
        });
      });
    });

    submitBtn.addEventListener('click', function () {
      var selectedRadio = form.querySelector('input[type="radio"]:checked');
      if (!selectedRadio) return;
      handleAnswer(parseInt(selectedRadio.value, 10));
    });
  }

  function handleAnswer(selectedIndex) {
    var q = currentQuestions[currentIndex];
    var isCorrect = (selectedIndex === q.correctIndex);

    userAnswers.push({
      questionIndex: currentIndex,
      selectedIndex: selectedIndex,
      isCorrect: isCorrect,
      subject: q.subject
    });

    var radios = document.querySelectorAll('input[name="cpea-choice"]');
    radios.forEach(function (r) { r.disabled = true; });

    var submitBtn = document.getElementById('btn-submit-answer');
    if (submitBtn) submitBtn.style.display = 'none';

    var correctLabel = document.getElementById('label-' + q.correctIndex);
    if (correctLabel) correctLabel.classList.add('option-correct');

    if (!isCorrect) {
      var chosenLabel = document.getElementById('label-' + selectedIndex);
      if (chosenLabel) chosenLabel.classList.add('option-incorrect');
      streak = 0;
      updateMascotReaction('happy', 'Nice try! Read the explanation below to see why option ' + ['A', 'B', 'C', 'D'][q.correctIndex] + ' is correct.');
    } else {
      streak++;
      if (streak > maxStreak) maxStreak = streak;
      var cheer = streak >= 3 ? 'Amazing! ' + streak + " correct in a row! You're a superstar!" : "Spot on! That's correct!";
      updateMascotReaction('celebrating', cheer);
    }

    renderStarsTrail();

    var feedbackArea = document.getElementById('question-feedback-area');
    var liveRegion = document.getElementById('readiness-live-announcer');

    if (feedbackArea) {
      feedbackArea.removeAttribute('hidden');
      var statusBadge = isCorrect
        ? '<div class="feedback-banner feedback-banner-correct">✅ Excellent Thinking!</div>'
        : '<div class="feedback-banner feedback-banner-encourage">💡 Great effort! Here is why:</div>';

      feedbackArea.innerHTML = '' +
        statusBadge +
        '<p class="feedback-explanation">' + escapeHtml(q.explanation) + '</p>' +
        '<div class="feedback-actions">' +
          '<button type="button" id="btn-next-question" class="btn btn-primary btn-large">' +
            (currentIndex + 1 < currentQuestions.length ? 'Next Question →' : 'See My Results 🌟') +
          '</button>' +
        '</div>';

      if (liveRegion) {
        liveRegion.textContent = (isCorrect ? 'Correct! ' : 'Good attempt. ') + q.explanation;
      }

      var nextBtn = document.getElementById('btn-next-question');
      if (nextBtn) {
        nextBtn.focus();
        nextBtn.addEventListener('click', function () {
          currentIndex++;
          renderCurrentQuestion();
        });
      }
    }
  }

  function computeBand(correctCount) {
    if (correctCount >= 9) {
      return {
        bandName: 'Exam Star',
        bandBadge: '🌟',
        mascotCheer: 'Incredible job! You showed outstanding ' + activeSubject + ' mastery across these 10 sample questions. Keep shining!'
      };
    }
    if (correctCount >= 7) {
      return {
        bandName: 'Looking Good',
        bandBadge: '🚀',
        mascotCheer: 'Super effort! You have a strong ' + activeSubject + ' foundation. A little regular practice will make you unstoppable!'
      };
    }
    if (correctCount >= 5) {
      return {
        bandName: 'Getting There',
        bandBadge: '💪',
        mascotCheer: 'Great work completing all 10 ' + activeSubject + ' questions! Practising key topics will build even more confidence.'
      };
    }
    return {
      bandName: 'Just Starting',
      bandBadge: '🌱',
      mascotCheer: 'Every learning journey starts here! Practising these sample ' + activeSubject + ' questions is a great way to grow.'
    };
  }

  function renderResultsScreen() {
    var container = document.getElementById('readiness-card');
    var liveRegion = document.getElementById('readiness-live-announcer');
    if (!container) return;

    var totalQuestions = currentQuestions.length || QUESTIONS_PER_SESSION;
    var correctCount = userAnswers.filter(function (a) { return a.isCorrect; }).length;
    var percentage = Math.round((correctCount / totalQuestions) * 100);
    var bandInfo = computeBand(correctCount);
    var otherSubject = activeSubject === 'Mathematics' ? 'Language Arts' : 'Mathematics';

    updateMascotReaction('celebrating', bandInfo.mascotCheer);

    var bookUrl = '/book?rcSubject=' + encodeURIComponent(activeSubject) +
      '&rcScore=' + encodeURIComponent(String(correctCount)) +
      '&rcTotal=' + encodeURIComponent(String(totalQuestions)) +
      '&rcBand=' + encodeURIComponent(bandInfo.bandName);

    var subjectIcon = activeSubject === 'Mathematics' ? '🔢' : '📚';
    var streakLine = maxStreak >= 2
      ? '<p class="results-streak-note">🔥 Best Streak: <strong>' + maxStreak + ' in a row</strong></p>'
      : '';

    var resultsHtml = '' +
      '<div class="results-container">' +
        '<div class="results-header">' +
          '<span class="results-band-icon" aria-hidden="true">' + bandInfo.bandBadge + '</span>' +
          '<p class="results-subject-pill">' + subjectIcon + ' ' + escapeHtml(activeSubject) + ' Track</p>' +
          '<h2 class="results-title">' + escapeHtml(bandInfo.bandName) + '</h2>' +
          '<p class="results-score-display">' + correctCount + ' out of ' + totalQuestions + ' Correct &bull; ' + percentage + '%</p>' +
          streakLine +
          '<p class="results-disclaimer"><strong>Note:</strong> Sample questions: not an official CPEA paper. Results are not stored automatically.</p>' +
        '</div>' +

        '<div class="results-breakdown-section">' +
          '<h3>' + escapeHtml(activeSubject) + ' Score Progress</h3>' +
          '<div class="subject-row">' +
            '<div class="subject-row-header">' +
              '<span class="subject-row-name">' + escapeHtml(activeSubject) + '</span>' +
              '<span class="subject-row-badge">' + escapeHtml(bandInfo.bandName) + ' ' + bandInfo.bandBadge + '</span>' +
              '<span class="subject-row-score"><strong>' + correctCount + '/' + totalQuestions + '</strong> (' + percentage + '%)</span>' +
            '</div>' +
            '<div class="subject-progress-bar" role="progressbar" aria-valuenow="' + percentage + '" aria-valuemin="0" aria-valuemax="100">' +
              '<div class="subject-progress-fill" style="width: ' + percentage + '%;"></div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="results-actions print-hidden">' +
          '<button type="button" id="btn-print-results" class="btn btn-secondary">🖨️ Print My Results</button>' +
          '<button type="button" id="btn-retry-quiz" class="btn btn-primary">🔄 Try 10 New ' + escapeHtml(activeSubject) + ' Questions</button>' +
          '<button type="button" id="btn-switch-subject" class="btn btn-secondary">⇄ Try ' + escapeHtml(otherSubject) + '</button>' +
          '<a href="' + escapeHtml(bookUrl) + '" class="btn btn-accent">📅 Book a Consultation</a>' +
        '</div>' +
      '</div>';

    container.innerHTML = resultsHtml;

    if (liveRegion) {
      liveRegion.textContent = activeSubject + ' readiness check complete! You scored ' + correctCount + ' out of ' + totalQuestions + ' (' + percentage + '%). Readiness band: ' + bandInfo.bandName;
    }

    var printBtn = document.getElementById('btn-print-results');
    if (printBtn) {
      printBtn.addEventListener('click', function () { window.print(); });
    }

    var retryBtn = document.getElementById('btn-retry-quiz');
    if (retryBtn) {
      retryBtn.addEventListener('click', function () { startSubjectSession(activeSubject); });
    }

    var switchBtn = document.getElementById('btn-switch-subject');
    if (switchBtn) {
      switchBtn.addEventListener('click', function () { startSubjectSession(otherSubject); });
    }
  }

  function startSubjectSession(subject) {
    activeSubject = subject;
    currentIndex = 0;
    userAnswers = [];
    streak = 0;
    maxStreak = 0;
    currentQuestions = pickSubjectSession(questionsData, subject);
    renderCurrentQuestion();
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function initReadinessCheck() {
    var dataEl = document.getElementById('readiness-questions-data');
    var cardEl = document.getElementById('readiness-card');
    if (!dataEl || !cardEl) return;

    initialPickerHtml = cardEl.innerHTML;

    try {
      questionsData = JSON.parse(dataEl.textContent);
    } catch (e) {
      console.error('Error parsing readiness questions data:', e);
      return;
    }

    if (!Array.isArray(questionsData) || questionsData.length === 0) return;

    // Optional URL deep-link (?subject=math or ?subject=language-arts)
    var preselected = null;
    try {
      var params = new URLSearchParams(window.location.search);
      preselected = normalizeSubjectParam(params.get('subject'));
    } catch (_) {}

    if (preselected) {
      startSubjectSession(preselected);
    } else {
      wirePickerButtons();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReadinessCheck);
  } else {
    initReadinessCheck();
  }
})();
