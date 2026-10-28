/**
 * Popcorn Math Mini-Game Logic (Pure Functions)
 * Designed for learners aged 8 to 13.
 * Pure in-memory calculation, zero storage, zero analytics.
 */

const GAME_QUESTIONS = [
  {
    id: 'q1',
    prompt: 'What is 8 × 7?',
    correctAnswer: 56,
    options: [48, 54, 56, 64]
  },
  {
    id: 'q2',
    prompt: 'What is 6 × 9?',
    correctAnswer: 54,
    options: [45, 52, 54, 63]
  },
  {
    id: 'q3',
    prompt: 'What is 7 × 7?',
    correctAnswer: 49,
    options: [42, 47, 49, 56]
  },
  {
    id: 'q4',
    prompt: 'What is 9 × 8?',
    correctAnswer: 72,
    options: [64, 72, 81, 84]
  },
  {
    id: 'q5',
    prompt: 'What is 6 × 8?',
    correctAnswer: 48,
    options: [42, 46, 48, 54]
  },
  {
    id: 'q6',
    prompt: 'What is 12 × 6?',
    correctAnswer: 72,
    options: [68, 70, 72, 84]
  },
  {
    id: 'q7',
    prompt: 'What is 9 × 9?',
    correctAnswer: 81,
    options: [72, 79, 81, 90]
  },
  {
    id: 'q8',
    prompt: 'What is 7 × 6?',
    correctAnswer: 42,
    options: [36, 40, 42, 48]
  },
  {
    id: 'q9',
    prompt: 'What is 8 × 8?',
    correctAnswer: 64,
    options: [56, 62, 64, 72]
  },
  {
    id: 'q10',
    prompt: 'What is 11 × 7?',
    correctAnswer: 77,
    options: [70, 74, 77, 88]
  }
];

function getAllQuestions() {
  return GAME_QUESTIONS.map(q => ({
    id: q.id,
    prompt: q.prompt,
    correctAnswer: q.correctAnswer,
    options: [...q.options]
  }));
}

function getRoundQuestions(offset = 0) {
  const all = getAllQuestions();
  const start = Math.abs(offset) % all.length;
  const selected = [];
  for (let i = 0; i < 3; i++) {
    selected.push(all[(start + i) % all.length]);
  }
  return selected;
}

function checkAnswer(questionId, selectedAnswer) {
  const question = GAME_QUESTIONS.find(q => q.id === questionId);
  if (!question) {
    return {
      isValidQuestion: false,
      isCorrect: false,
      feedback: 'Question not found'
    };
  }

  const numericAnswer = Number(selectedAnswer);
  const isCorrect = numericAnswer === question.correctAnswer;

  return {
    isValidQuestion: true,
    isCorrect,
    feedback: isCorrect ? 'POP! Correct!' : 'Try again'
  };
}

function isRoundComplete(correctCount) {
  return Number(correctCount) >= 3;
}

module.exports = {
  GAME_QUESTIONS,
  getAllQuestions,
  getRoundQuestions,
  checkAnswer,
  isRoundComplete
};

