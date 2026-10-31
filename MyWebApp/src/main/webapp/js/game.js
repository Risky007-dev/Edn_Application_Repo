/**
 * Popcorn Math Mini-Game Client Controller
 * Pure in-memory state.
 * Strictly zero storage, zero analytics, zero external requests.
 */

(function () {
  'use strict';

  var QUESTION_BANKS = {
    kernels: [
      { id: 'k1', prompt: 'What is 3 + 4?', answer: 7, options: [5, 6, 7, 8] },
      { id: 'k2', prompt: 'What is 5 + 5?', answer: 10, options: [8, 9, 10, 11] },
      { id: 'k3', prompt: 'What is 6 + 2?', answer: 8, options: [7, 8, 9, 10] },
      { id: 'k4', prompt: 'What is 4 + 5?', answer: 9, options: [7, 8, 9, 10] },
      { id: 'k5', prompt: 'What is 7 + 3?', answer: 10, options: [8, 9, 10, 12] }
    ],
    poppers: [
      { id: 'q1', prompt: 'What is 8 × 7?', answer: 56, options: [48, 54, 56, 64] },
      { id: 'q2', prompt: 'What is 6 × 9?', answer: 54, options: [45, 52, 54, 63] },
      { id: 'q3', prompt: 'What is 7 × 7?', answer: 49, options: [42, 47, 49, 56] },
      { id: 'q4', prompt: 'What is 9 × 8?', answer: 72, options: [64, 72, 81, 84] },
      { id: 'q5', prompt: 'What is 6 × 8?', answer: 48, options: [42, 46, 48, 54] },
      { id: 'q6', prompt: 'What is 12 × 6?', answer: 72, options: [68, 70, 72, 84] },
      { id: 'q7', prompt: 'What is 9 × 9?', answer: 81, options: [72, 79, 81, 90] },
      { id: 'q8', prompt: 'What is 7 × 6?', answer: 42, options: [36, 40, 42, 48] }
    ],
    crunch: [
      { id: 'c1', prompt: 'What is 15 × 4?', answer: 60, options: [45, 50, 60, 65] },
      { id: 'c2', prompt: 'What is 144 ÷ 12?', answer: 12, options: [11, 12, 13, 14] },
      { id: 'c3', prompt: 'What is 25 × 4?', answer: 100, options: [75, 90, 100, 125] },
      { id: 'c4', prompt: 'What is 84 ÷ 7?', answer: 12, options: [11, 12, 14, 16] },
      { id: 'c5', prompt: 'What is 18 × 3?', answer: 54, options: [48, 52, 54, 56] }
    ]
  };

  var roundQuestions = [];
  var currentIndex = 0;
  var correctCount = 0;
  var roundSeed = 0;

  function initGame() {
    var trackerEl = document.getElementById('question-tracker');
    var promptEl = document.getElementById('question-prompt');
    var gridEl = document.getElementById('answers-grid');
    var arenaEl = document.getElementById('game-arena');
    var starEl = document.getElementById('game-star-screen');
    var feedbackEl = document.getElementById('game-feedback');
    var playAgainBtn = document.getElementById('btn-play-again');
    var levelSelect = document.getElementById('game-level-select');

    if (!gridEl || !promptEl) return;

    function getCurrentQuestions() {
      var level = levelSelect ? levelSelect.value : 'poppers';
      return QUESTION_BANKS[level] || QUESTION_BANKS.poppers;
    }

    function selectRoundQuestions() {
      var qList = getCurrentQuestions();
      roundQuestions = [];
      var start = roundSeed % qList.length;
      roundSeed = (roundSeed + 3) % qList.length;
      for (var i = 0; i < 3; i++) {
        var q = qList[(start + i) % qList.length];
        roundQuestions.push(q);
      }
    }

    function resetBucket() {
      for (var s = 1; s <= 3; s++) {
        var k = document.getElementById('kernel-' + s);
        if (k) {
          k.classList.remove('kernel-popped');
          k.removeAttribute('aria-label');
        }
      }
    }

    function popKernel(num) {
      var k = document.getElementById('kernel-' + num);
      if (k) {
        k.classList.add('kernel-popped');
        k.setAttribute('aria-label', 'Kernel ' + num + ' popped in bucket');
      }
    }

    function showQuestion() {
      if (currentIndex >= roundQuestions.length) {
        finishRound();
        return;
      }

      var current = roundQuestions[currentIndex];
      if (trackerEl) {
        trackerEl.textContent = 'Question ' + (currentIndex + 1) + ' of 3';
      }
      promptEl.textContent = current.prompt;
      gridEl.innerHTML = '';

      if (feedbackEl) {
        feedbackEl.textContent = '';
        feedbackEl.className = 'game-feedback';
      }

      current.options.forEach(function (opt) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-answer';
        btn.setAttribute('aria-label', 'Answer ' + opt);
        btn.textContent = String(opt);

        btn.addEventListener('click', function () {
          handleAnswer(opt, current.answer, btn);
        });

        gridEl.appendChild(btn);
      });

      // Set focus to the first answer option for keyboard users
      var firstBtn = gridEl.querySelector('button');
      if (firstBtn && currentIndex > 0) {
        firstBtn.focus();
      }
    }

    function handleAnswer(chosen, correct, btn) {
      if (chosen === correct) {
        correctCount++;
        popKernel(correctCount);

        if (feedbackEl) {
          feedbackEl.className = 'game-feedback pop-success';
          feedbackEl.textContent = '🍿 POP! Correct!';
        }

        // Disable options during celebration
        var buttons = gridEl.querySelectorAll('button');
        buttons.forEach(function (b) {
          b.disabled = true;
          if (b === btn) {
            b.classList.add('answer-correct');
          }
        });

        if (correctCount >= 3) {
          setTimeout(finishRound, 700);
        } else {
          currentIndex++;
          setTimeout(showQuestion, 700);
        }
      } else {
        if (feedbackEl) {
          feedbackEl.className = 'game-feedback pop-retry';
          feedbackEl.textContent = 'Try again! You can do it!';
        }
        btn.classList.add('answer-retry');
        setTimeout(function () {
          btn.classList.remove('answer-retry');
        }, 500);
      }
    }

    function finishRound() {
      if (arenaEl) arenaEl.style.display = 'none';
      if (starEl) {
        starEl.style.display = 'block';
        var starHeading = starEl.querySelector('h2');
        if (starHeading) {
          starHeading.setAttribute('tabindex', '-1');
          starHeading.focus();
        }
      }
      if (feedbackEl) {
        feedbackEl.className = 'game-feedback pop-star';
        feedbackEl.textContent = "🎉 YOU'RE A POPCORN MATH STAR! All 3 kernels popped!";
      }
    }

    function startNewRound() {
      currentIndex = 0;
      correctCount = 0;
      selectRoundQuestions();
      resetBucket();

      if (starEl) starEl.style.display = 'none';
      if (arenaEl) arenaEl.style.display = 'block';

      showQuestion();
    }

    if (playAgainBtn) {
      playAgainBtn.addEventListener('click', startNewRound);
    }

    if (levelSelect) {
      levelSelect.addEventListener('change', startNewRound);
    }

    startNewRound();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
  } else {
    initGame();
  }
})();

