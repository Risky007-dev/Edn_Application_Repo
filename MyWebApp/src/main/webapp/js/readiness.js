/**
 * CPEA Readiness Check - Client-Side Interactive Engine
 * 100% client-side, zero persistence, accessible, keyboard-friendly.
 */

(function () {
  'use strict';

  var questionsData = [];
  var currentQuestions = [];
  var currentIndex = 0;
  var userAnswers = []; // { questionIndex, selectedIndex, isCorrect, subject }
  var streak = 0;
  var maxStreak = 0;

  var mascotExpressions = {
    neutral: 'neutral',
    thinking: 'thinking',
    celebrating: 'celebrating',
    happy: 'happy'
  };

  // SVGs for dynamic mascot face updates
  var mascotSvgs = {
    neutral: '<path d="M42 69 Q50 76 58 69" stroke="#1A365D" stroke-width="3" stroke-linecap="round" fill="none"/>',
    thinking: '<path d="M43 72 Q50 68 57 72" stroke="#1A365D" stroke-width="3" stroke-linecap="round" fill="none"/>',
    celebrating: '<path d="M38 66 Q50 84 62 66 Z" fill="#E65100" stroke="#1A365D" stroke-width="2.5"/>',
    happy: '<path d="M40 68 Q50 82 60 68" stroke="#1A365D" stroke-width="3" stroke-linecap="round" fill="#F5A623"/>'
  };

  function updateMascotReaction(expression, speechText) {
    var mascotEl = document.getElementById('readiness-mascot');
    var speechEl = document.getElementById('readiness-speech-text');

    if (mascotEl) {
      // Update mouth path inside SVG
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
    if (speechEl && speechText) {
      speechEl.textContent = speechText;
    }
  }

  function pickRandomSession(bank) {
    var subjects = ['Language Arts', 'Mathematics', 'Science', 'Social Studies'];
    var selected = [];

    subjects.forEach(function (subj) {
      var pool = bank.filter(function (q) { return q.subject === subj; });
      var shuffled = pool.slice().sort(function () { return 0.5 - Math.random(); });
      selected = selected.concat(shuffled.slice(0, 3));
    });

    // Shuffle the 12 questions
    selected.sort(function () { return 0.5 - Math.random(); });

    // Shuffle options for each question
    return selected.map(function (q, idx) {
      var correctOptText = q.options[q.correctIndex];
      var shuffledOpts = q.options.slice().sort(function () { return 0.5 - Math.random(); });
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

  function renderStarsTrail() {
    var trail = document.getElementById('readiness-stars-trail');
    if (!trail) return;
    trail.innerHTML = '';

    for (var i = 0; i < currentQuestions.length; i++) {
      var star = document.createElement('span');
      star.className = 'trail-star';
      star.setAttribute('aria-hidden', 'true');

      if (i < currentIndex) {
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

    // Streak indicator
    var streakBadge = '';
    if (streak >= 2) {
      streakBadge = '<div class="streak-badge" aria-label="Streak of ' + streak + ' correct answers">🔥 ' + streak + ' In a Row!</div>';
    }

    var passageHtml = q.passage ? '<div class="question-passage"><p><strong>Reading Passage:</strong></p><blockquote>' + escapeHtml(q.passage) + '</blockquote></div>' : '';
    var imageHtml = q.imageSvg ? '<div class="question-diagram">' + q.imageSvg + '</div>' : '';

    var subjectBadges = {
      'Language Arts': '<span class="subject-badge badge-la">📚 Language Arts</span>',
      'Mathematics': '<span class="subject-badge badge-math">🔢 Mathematics</span>',
      'Science': '<span class="subject-badge badge-sci">⚡ Science</span>',
      'Social Studies': '<span class="subject-badge badge-ss">🧭 Social Studies</span>'
    };

    var html = '' +
      '<div class="question-header">' +
        '<div class="question-meta">' +
          '<span class="question-step">Question ' + (currentIndex + 1) + ' of ' + currentQuestions.length + '</span>' +
          (subjectBadges[q.subject] || '') +
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
      liveRegion.textContent = 'Question ' + (currentIndex + 1) + ' of ' + currentQuestions.length + ': ' + q.subject + '. ' + q.prompt;
    }

    updateMascotReaction('neutral', "Take your time! Read each option carefully.");

    // Wire up option selection
    var form = document.getElementById('readiness-options-form');
    var submitBtn = document.getElementById('btn-submit-answer');
    var radios = form.querySelectorAll('input[type="radio"]');

    radios.forEach(function (radio) {
      radio.addEventListener('change', function () {
        submitBtn.removeAttribute('disabled');
        updateMascotReaction('thinking', "Good thought! Click 'Check My Answer' when ready.");
        // Highlight selected label
        radios.forEach(function (r, idx) {
          var lbl = document.getElementById('label-' + idx);
          if (lbl) {
            if (r.checked) {
              lbl.classList.add('option-selected');
            } else {
              lbl.classList.remove('option-selected');
            }
          }
        });
      });
    });

    submitBtn.addEventListener('click', function () {
      var selectedRadio = form.querySelector('input[type="radio"]:checked');
      if (!selectedRadio) return;
      var selectedIdx = parseInt(selectedRadio.value, 10);
      handleAnswer(selectedIdx);
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

    // Disable radios
    var radios = document.querySelectorAll('input[name="cpea-choice"]');
    radios.forEach(function (r) { r.disabled = true; });

    var submitBtn = document.getElementById('btn-submit-answer');
    if (submitBtn) submitBtn.style.display = 'none';

    // Highlight correct vs chosen
    var correctLabel = document.getElementById('label-' + q.correctIndex);
    if (correctLabel) correctLabel.classList.add('option-correct');

    if (!isCorrect) {
      var chosenLabel = document.getElementById('label-' + selectedIndex);
      if (chosenLabel) chosenLabel.classList.add('option-incorrect');
      streak = 0;
      updateMascotReaction('happy', "Nice try! Read the explanation below to see why option " + ['A','B','C','D'][q.correctIndex] + " is correct.");
    } else {
      streak++;
      if (streak > maxStreak) maxStreak = streak;
      var cheer = streak >= 3 ? "Amazing! " + streak + " correct in a row! You're a superstar!" : "Spot on! That's correct!";
      updateMascotReaction('celebrating', cheer);
    }

    renderStarsTrail();

    // Show feedback explanation
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

  function renderResultsScreen() {
    var container = document.getElementById('readiness-card');
    var liveRegion = document.getElementById('readiness-live-announcer');
    if (!container) return;

    var totalQuestions = currentQuestions.length;
    var correctCount = userAnswers.filter(function (a) { return a.isCorrect; }).length;
    var percentage = Math.round((correctCount / totalQuestions) * 100);

    // Readiness Bands
    var bandName = '';
    var bandBadge = '';
    var mascotCheer = '';

    if (correctCount >= 11) {
      bandName = 'Exam Star';
      bandBadge = '🌟';
      mascotCheer = "Incredible job! You showed outstanding mastery across all subjects. Keep shining!";
    } else if (correctCount >= 8) {
      bandName = 'Looking Good';
      bandBadge = '🚀';
      mascotCheer = "Super effort! You have a really strong foundation. A little extra review and you'll be unstoppable!";
    } else if (correctCount >= 5) {
      bandName = 'Getting There';
      bandBadge = '💪';
      mascotCheer = "Great work finishing all 12 questions! Reviewing key concepts will build even more confidence.";
    } else {
      bandName = 'Just Starting';
      bandBadge = '🌱';
      mascotCheer = "Every learning journey starts here! Practising these sample questions is the best way to grow.";
    }

    updateMascotReaction('celebrating', mascotCheer);

    // Subject breakdown
    var subjects = ['Language Arts', 'Mathematics', 'Science', 'Social Studies'];
    var subjectBadgesNames = {
      'Language Arts': 'Word Whiz 📚',
      'Mathematics': 'Number Ninja 🔢',
      'Science': 'Science Spark ⚡',
      'Social Studies': 'World Explorer 🧭'
    };

    var subjectRowsHtml = '';
    var strengths = [];
    var practiceAreas = [];

    subjects.forEach(function (subj) {
      var subjAnswers = userAnswers.filter(function (a) { return a.subject === subj; });
      var subjCorrect = subjAnswers.filter(function (a) { return a.isCorrect; }).length;
      var subjTotal = subjAnswers.length || 3;
      var subjPct = Math.round((subjCorrect / subjTotal) * 100);

      if (subjCorrect >= 2) {
        strengths.push(subj + ' (' + subjCorrect + '/' + subjTotal + ' correct)');
      } else {
        practiceAreas.push(subj + ' (Review recommended: ' + subjCorrect + '/' + subjTotal + ')');
      }

      subjectRowsHtml += '' +
        '<div class="subject-row">' +
          '<div class="subject-row-header">' +
            '<span class="subject-row-name">' + subj + '</span>' +
            '<span class="subject-row-badge">' + subjectBadgesNames[subj] + '</span>' +
            '<span class="subject-row-score"><strong>' + subjCorrect + '/' + subjTotal + '</strong> (' + subjPct + '%)</span>' +
          '</div>' +
          '<div class="subject-progress-bar" role="progressbar" aria-valuenow="' + subjPct + '" aria-valuemin="0" aria-valuemax="100">' +
            '<div class="subject-progress-fill" style="width: ' + subjPct + '%;"></div>' +
          '</div>' +
        '</div>';
    });

    var strengthsHtml = strengths.length > 0
      ? '<div class="results-insight-box insight-strengths"><h4>✨ What You Did Really Well</h4><ul>' + strengths.map(function(s){ return '<li>' + escapeHtml(s) + '</li>'; }).join('') + '</ul></div>'
      : '';

    var practiceHtml = practiceAreas.length > 0
      ? '<div class="results-insight-box insight-practice"><h4>🎯 What to Practise Next</h4><ul>' + practiceAreas.map(function(p){ return '<li>' + escapeHtml(p) + '</li>'; }).join('') + '</ul></div>'
      : '<div class="results-insight-box insight-strengths"><h4>🎯 Next Steps</h4><p>You scored well across all 4 subjects! Keep practicing with new question sets.</p></div>';

    var resultsHtml = '' +
      '<div class="results-container">' +
        '<div class="results-header">' +
          '<span class="results-band-icon" aria-hidden="true">' + bandBadge + '</span>' +
          '<h2 class="results-title">' + bandName + '</h2>' +
          '<p class="results-score-display">' + correctCount + ' out of ' + totalQuestions + ' Correct &bull; ' + percentage + '%</p>' +
          '<p class="results-disclaimer"><strong>Note:</strong> This readiness check is a fun, unofficial practice guide and not an official CPEA examination score.</p>' +
        '</div>' +

        '<div class="results-breakdown-section">' +
          '<h3>Subject Breakdown</h3>' +
          '<div class="subject-bars-list">' +
            subjectRowsHtml +
          '</div>' +
        '</div>' +

        '<div class="results-insights-grid">' +
          strengthsHtml +
          practiceHtml +
        '</div>' +

        '<div class="results-actions print-hidden">' +
          '<button type="button" id="btn-print-results" class="btn btn-secondary">🖨️ Print My Results</button>' +
          '<button type="button" id="btn-retry-quiz" class="btn btn-primary">🔄 Try Again with New Questions</button>' +
          '<a href="/book" class="btn btn-accent">📅 Book a Consultation</a>' +
        '</div>' +
      '</div>';

    container.innerHTML = resultsHtml;

    if (liveRegion) {
      liveRegion.textContent = 'Quiz complete! You scored ' + correctCount + ' out of 12 (' + percentage + '%). Readiness level: ' + bandName;
    }

    // Wire up results actions
    var printBtn = document.getElementById('btn-print-results');
    if (printBtn) {
      printBtn.addEventListener('click', function () {
        window.print();
      });
    }

    var retryBtn = document.getElementById('btn-retry-quiz');
    if (retryBtn) {
      retryBtn.addEventListener('click', function () {
        startNewSession();
      });
    }
  }

  function startNewSession() {
    currentIndex = 0;
    userAnswers = [];
    streak = 0;
    currentQuestions = pickRandomSession(questionsData);
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
    if (!dataEl) return;

    try {
      questionsData = JSON.parse(dataEl.textContent);
    } catch (e) {
      console.error('Error parsing readiness questions data:', e);
      return;
    }

    if (Array.isArray(questionsData) && questionsData.length > 0) {
      startNewSession();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReadinessCheck);
  } else {
    initReadinessCheck();
  }
})();
