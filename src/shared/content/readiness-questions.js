/**
 * CPEA Mock Examination Question Bank
 * Original, culturally grounded sample questions designed for Caribbean primary students (ages 11-12).
 * Formatted across 4 exam subjects: Language Arts, Mathematics, Science, and Social Studies.
 *
 * Each question has:
 * - subject: Subject category
 * - prompt: Question text
 * - passage: Optional reading passage (used in Language Arts)
 * - imageSvg: Optional original inline SVG graphic
 * - options: 4 distinct choices (A to D)
 * - correctIndex: Index (0-3) of the correct choice
 * - explanation: Friendly, educational explanation shown after answering
 */

const READINESS_QUESTIONS = [
  // =========================================================================
  // LANGUAGE ARTS (6 Questions)
  // =========================================================================
  {
    id: 'la-01',
    subject: 'Language Arts',
    passage: 'Early in the morning, a cool breeze whispered across Shoal Bay. A school of silver jacks glided above the coral reef while pelicans circled high overhead, searching for their morning catch. Devon adjusted his snorkel mask, excited to spot his first sea turtle gliding gracefully through the turquoise waters.',
    prompt: 'In the passage, the phrase "a cool breeze whispered across Shoal Bay" is an example of which literary device?',
    options: ['Simile', 'Personification', 'Hyperbole', 'Alliteration'],
    correctIndex: 1,
    explanation: 'Personification gives human qualities (like whispering) to non-human things (like the wind).'
  },
  {
    id: 'la-02',
    subject: 'Language Arts',
    prompt: 'Choose the word that BEST completes the sentence:\n"The children were so __________ by the carnival costumes that they stopped to admire every feather."',
    options: ['fascinated', 'frustrated', 'hesitant', 'distracted'],
    correctIndex: 0,
    explanation: '"Fascinated" means completely charmed or captivated by something beautiful or interesting.'
  },
  {
    id: 'la-03',
    subject: 'Language Arts',
    prompt: 'Which sentence uses punctuation CORRECTLY?',
    options: [
      'After the rain stopped we walked to the market to buy mangoes, bananas, and guavas.',
      'After the rain stopped, we walked to the market to buy mangoes, bananas, and guavas.',
      'After the rain stopped, we walked to the market to buy mangoes bananas, and guavas.',
      'After the rain stopped we walked to the market, to buy mangoes, bananas and guavas.'
    ],
    correctIndex: 1,
    explanation: 'A comma is needed after the introductory dependent clause ("After the rain stopped,"), and items in a list are separated by commas.'
  },
  {
    id: 'la-04',
    subject: 'Language Arts',
    passage: 'Grandmother always advised, "Make hay while the sun shines, child, because opportunities do not wait for anyone."',
    prompt: 'What is the meaning of the proverb "Make hay while the sun shines"?',
    options: [
      'Work only during sunny mornings.',
      'Take advantage of good opportunities when they are available.',
      'Always help your grandparents on the farm.',
      'Never go outside when it begins to rain.'
    ],
    correctIndex: 1,
    explanation: 'This proverb encourages taking advantage of favourable conditions and opportunities while you have the chance.'
  },
  {
    id: 'la-05',
    subject: 'Language Arts',
    prompt: 'What is the root word of the word "UNCOMFORTABLE"?',
    options: ['Uncomfort', 'Comfort', 'Table', 'Fort'],
    correctIndex: 1,
    explanation: 'The prefix is "un-" (not), the suffix is "-able" (capable of), and the base root word is "comfort".'
  },
  {
    id: 'la-06',
    subject: 'Language Arts',
    prompt: 'Choose the option with the correct subject-verb agreement:\n"Neither the teacher nor the students __________ aware of the schedule change."',
    options: ['was', 'were', 'is', 'has been'],
    correctIndex: 1,
    explanation: 'In a "neither... nor" structure with compound subjects, the verb agrees with the subject closest to it ("the students were").'
  },

  // =========================================================================
  // MATHEMATICS (6 Questions)
  // =========================================================================
  {
    id: 'math-01',
    subject: 'Mathematics',
    imageSvg: `<svg width="180" height="120" viewBox="0 0 180 120" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Right triangle with base 8cm and height 6cm">
      <polygon points="30,100 150,100 30,20" fill="#E3F2FD" stroke="#1A365D" stroke-width="2.5"/>
      <rect x="30" y="88" width="12" height="12" stroke="#1A365D" stroke-width="1.5" fill="none"/>
      <text x="90" y="115" font-size="12" fill="#1A365D" font-weight="bold" text-anchor="middle">8 cm</text>
      <text x="18" y="65" font-size="12" fill="#1A365D" font-weight="bold" text-anchor="middle">6 cm</text>
    </svg>`,
    prompt: 'Look at the right-angled triangle above. What is the AREA of the triangle?',
    options: ['14 cm²', '24 cm²', '48 cm²', '28 cm²'],
    correctIndex: 1,
    explanation: 'Area of a triangle = (Base × Height) ÷ 2 = (8 × 6) ÷ 2 = 48 ÷ 2 = 24 cm².'
  },
  {
    id: 'math-02',
    subject: 'Mathematics',
    imageSvg: `<svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Analog clock showing 3:15">
      <circle cx="70" cy="70" r="60" fill="#FFF9C4" stroke="#1A365D" stroke-width="3"/>
      <circle cx="70" cy="70" r="4" fill="#1A365D"/>
      <text x="70" y="24" font-size="12" font-weight="bold" text-anchor="middle" fill="#1A365D">12</text>
      <text x="120" y="74" font-size="12" font-weight="bold" text-anchor="middle" fill="#1A365D">3</text>
      <text x="70" y="124" font-size="12" font-weight="bold" text-anchor="middle" fill="#1A365D">6</text>
      <text x="20" y="74" font-size="12" font-weight="bold" text-anchor="middle" fill="#1A365D">9</text>
      <!-- Hour hand pointing to 3 -->
      <line x1="70" y1="70" x2="98" y2="70" stroke="#1A365D" stroke-width="3.5" stroke-linecap="round"/>
      <!-- Minute hand pointing to 12 -->
      <line x1="70" y1="70" x2="70" y2="30" stroke="#E65100" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,
    prompt: 'The clock shows when a cricket match started (3:00 PM). The match ended at 5:45 PM. How long did the match last?',
    options: ['2 hours 15 minutes', '2 hours 45 minutes', '3 hours 15 minutes', '2 hours 30 minutes'],
    correctIndex: 1,
    explanation: 'From 3:00 PM to 5:00 PM is 2 hours. From 5:00 PM to 5:45 PM is 45 minutes. Total duration = 2 hours 45 minutes.'
  },
  {
    id: 'math-03',
    subject: 'Mathematics',
    imageSvg: `<svg width="220" height="130" viewBox="0 0 220 130" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bar chart showing mangoes picked: Mon 20, Tue 35, Wed 25">
      <line x1="30" y1="100" x2="200" y2="100" stroke="#1A365D" stroke-width="2"/>
      <line x1="30" y1="20" x2="30" y2="100" stroke="#1A365D" stroke-width="2"/>
      <!-- Bars -->
      <rect x="45" y="60" width="30" height="40" fill="#2E75B6"/>
      <rect x="95" y="30" width="30" height="70" fill="#F5A623"/>
      <rect x="145" y="50" width="30" height="50" fill="#4CAF50"/>
      <!-- Labels -->
      <text x="60" y="115" font-size="10" text-anchor="middle" fill="#1A365D">Mon</text>
      <text x="110" y="115" font-size="10" text-anchor="middle" fill="#1A365D">Tue</text>
      <text x="160" y="115" font-size="10" text-anchor="middle" fill="#1A365D">Wed</text>
      <!-- Values -->
      <text x="60" y="55" font-size="10" text-anchor="middle" fill="#1A365D" font-weight="bold">20</text>
      <text x="110" y="25" font-size="10" text-anchor="middle" fill="#1A365D" font-weight="bold">35</text>
      <text x="160" y="45" font-size="10" text-anchor="middle" fill="#1A365D" font-weight="bold">25</text>
    </svg>`,
    prompt: 'Based on the bar chart above showing mangoes harvested over 3 days, what is the MEAN (average) number of mangoes harvested per day?',
    options: ['25 mangoes', '26.7 mangoes', '30 mangoes', '35 mangoes'],
    correctIndex: 1,
    explanation: 'Total mangoes = 20 + 35 + 25 = 80. Average = 80 ÷ 3 = 26.67 (or 26.7 mangoes per day).'
  },
  {
    id: 'math-04',
    subject: 'Mathematics',
    prompt: 'A baker made 60 coconut tarts. She sold 3/5 of them in the morning and 25% of the REMAINING tarts in the afternoon. How many tarts were left at the end of the day?',
    options: ['6 tarts', '12 tarts', '18 tarts', '24 tarts'],
    correctIndex: 2,
    explanation: 'Sold in morning: 3/5 × 60 = 36 tarts. Remaining: 60 - 36 = 24 tarts. Sold in afternoon: 25% of 24 = 6 tarts. Left: 24 - 6 = 18 tarts.'
  },
  {
    id: 'math-05',
    subject: 'Mathematics',
    prompt: 'A ferry travels between Blowing Point and Marigot at an average speed of 24 kilometres per hour. If the journey takes 30 minutes (0.5 hours), what is the distance between the two ports?',
    options: ['8 km', '12 km', '16 km', '48 km'],
    correctIndex: 1,
    explanation: 'Distance = Speed × Time = 24 km/h × 0.5 h = 12 km.'
  },
  {
    id: 'math-06',
    subject: 'Mathematics',
    prompt: 'If 4 notebooks and 2 pens cost $16.00, and 2 pens cost $4.00, how much does ONE notebook cost?',
    options: ['$2.00', '$3.00', '$4.00', '$6.00'],
    correctIndex: 1,
    explanation: '4 notebooks + $4.00 = $16.00, so 4 notebooks = $12.00. One notebook = $12.00 ÷ 4 = $3.00.'
  },

  // =========================================================================
  // SCIENCE (6 Questions)
  // =========================================================================
  {
    id: 'sci-01',
    subject: 'Science',
    imageSvg: `<svg width="200" height="120" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Water cycle diagram showing evaporation, condensation, and precipitation">
      <!-- Sun -->
      <circle cx="165" cy="30" r="14" fill="#F5A623"/>
      <!-- Cloud -->
      <path d="M70 35 Q80 20 95 25 Q110 15 120 28 Q130 32 125 45 Q115 50 75 45 Z" fill="#90CAF9" stroke="#1A365D" stroke-width="1.5"/>
      <!-- Ocean -->
      <path d="M20 100 Q60 90 100 100 Q140 110 180 100 L180 118 L20 118 Z" fill="#2E75B6"/>
      <!-- Evaporation Arrow -->
      <path d="M50 90 Q45 65 65 52" stroke="#E65100" stroke-width="2" stroke-dasharray="3 3" marker-end="url(#arrow)"/>
      <text x="40" y="68" font-size="9" fill="#E65100" font-weight="bold">Stage X</text>
      <!-- Rain -->
      <line x1="90" y1="52" x2="85" y2="70" stroke="#1A365D" stroke-width="1.5"/>
      <line x1="105" y1="52" x2="100" y2="70" stroke="#1A365D" stroke-width="1.5"/>
    </svg>`,
    prompt: 'In the water cycle diagram above, what process is taking place at "Stage X", where ocean water turns into invisible water vapour?',
    options: ['Precipitation', 'Condensation', 'Evaporation', 'Transpiration'],
    correctIndex: 2,
    explanation: 'Evaporation is the process where heat energy from the sun turns liquid surface water into water vapour gas.'
  },
  {
    id: 'sci-02',
    subject: 'Science',
    prompt: 'Why are mangrove trees extremely important to Caribbean coastal ecosystems?',
    options: [
      'They provide sweet edible fruit for livestock.',
      'Their roots trap sediment, protect coastlines from storm waves, and provide nurseries for young fish.',
      'They absorb all the salt from the sea to make it fresh water.',
      'They grow faster than any other plant on land.'
    ],
    correctIndex: 1,
    explanation: 'Mangrove root systems prevent coastal erosion from heavy waves and shelter juvenile reef fish, crabs, and marine organisms.'
  },
  {
    id: 'sci-03',
    subject: 'Science',
    prompt: 'Which of the following is an example of an IRREVERSIBLE chemical change?',
    options: [
      'Melting ice cubes in the tropical sun.',
      'Dissolving sugar crystals in fresh lime water.',
      'Baking johnny cakes in a hot oven.',
      'Freezing coconut water into ice pops.'
    ],
    correctIndex: 2,
    explanation: 'Baking causes chemical changes that produce new substances; you cannot unbake a johnny cake back into raw dough.'
  },
  {
    id: 'sci-04',
    subject: 'Science',
    prompt: 'Which organ system in the human body is responsible for transporting oxygen, nutrients, and hormones to all living cells?',
    options: ['Respiratory system', 'Circulatory system', 'Nervous system', 'Skeletal system'],
    correctIndex: 1,
    explanation: 'The circulatory system (heart, blood, and blood vessels) pumps oxygen and nutrients throughout the body.'
  },
  {
    id: 'sci-05',
    subject: 'Science',
    prompt: 'Which renewable energy source is most abundant year-round in the Eastern Caribbean islands?',
    options: ['Geothermal energy', 'Solar and wind energy', 'Nuclear energy', 'Coal power'],
    correctIndex: 1,
    explanation: 'The Caribbean enjoys year-round tropical sunshine and steady northeast trade winds, making solar and wind energy abundant.'
  },
  {
    id: 'sci-06',
    subject: 'Science',
    prompt: 'What happens when two north poles of two bar magnets are placed close to each other?',
    options: [
      'They attract each other strongly.',
      'They repel (push away from) each other.',
      'They lose their magnetism immediately.',
      'They create an electric spark.'
    ],
    correctIndex: 1,
    explanation: 'Like poles of a magnet repel (north repels north, south repels south), while opposite poles attract.'
  },

  // =========================================================================
  // SOCIAL STUDIES (6 Questions)
  // =========================================================================
  {
    id: 'ss-01',
    subject: 'Social Studies',
    imageSvg: `<svg width="180" height="120" viewBox="0 0 180 120" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Archipelago map outline">
      <!-- Water -->
      <rect width="180" height="120" fill="#E1F5FE" rx="6"/>
      <!-- Island shapes -->
      <path d="M45 35 Q65 25 85 30 Q70 42 45 35 Z" fill="#81C784" stroke="#1A365D" stroke-width="1.5"/>
      <circle cx="80" cy="50" r="10" fill="#A5D6A7" stroke="#1A365D" stroke-width="1.5"/>
      <ellipse cx="110" cy="70" rx="14" ry="8" fill="#81C784" stroke="#1A365D" stroke-width="1.5"/>
      <circle cx="135" cy="88" r="7" fill="#A5D6A7" stroke="#1A365D" stroke-width="1.5"/>
      <!-- Compass Rose -->
      <text x="155" y="24" font-size="11" font-weight="bold" fill="#1A365D">N ↑</text>
    </svg>`,
    prompt: 'What geographical term describes a chain or cluster of islands, such as the Caribbean archipelago?',
    options: ['Peninsula', 'Isthmus', 'Archipelago', 'Plateau'],
    correctIndex: 2,
    explanation: 'An archipelago is an extensive group or chain of islands situated in a sea or ocean.'
  },
  {
    id: 'ss-02',
    subject: 'Social Studies',
    prompt: 'Which annual cultural sporting tradition in Anguilla has deep historical roots in seafaring and boatbuilding heritage?',
    options: ['Horse racing', 'Traditional boat racing', 'Polo', 'Downhill skiing'],
    correctIndex: 1,
    explanation: 'Traditional open-boat racing is Anguilla\'s national sport, celebrating the island\'s renowned maritime and boatbuilding history.'
  },
  {
    id: 'ss-03',
    subject: 'Social Studies',
    prompt: 'Which prevailing winds blow steadily across the Caribbean from the northeast towards the equator throughout the year?',
    options: ['Polar easterlies', 'Northeast trade winds', 'Westerlies', 'Monsoons'],
    correctIndex: 1,
    explanation: 'The Northeast Trade Winds blow across the tropical Atlantic, bringing refreshing breezes and influencing island climate.'
  },
  {
    id: 'ss-04',
    subject: 'Social Studies',
    prompt: 'What is the primary responsibility of a country\'s government when preparing for the Atlantic hurricane season (June to November)?',
    options: [
      'Close all local grocery stores and banks permanently.',
      'Coordinate emergency shelters, public warnings, and community disaster preparedness plans.',
      'Order all citizens to leave the island immediately.',
      'Stop all shipping vessels from entering territorial waters for six months.'
    ],
    correctIndex: 1,
    explanation: 'Disaster management agencies prepare shelters, inspect emergency infrastructure, and issue advisories to keep families safe.'
  },
  {
    id: 'ss-05',
    subject: 'Social Studies',
    prompt: 'What is the term for goods and services that a country SELLS to other nations around the world?',
    options: ['Imports', 'Tariffs', 'Exports', 'Subsidies'],
    correctIndex: 2,
    explanation: 'Exports are goods and services produced domestically and sold to buyers abroad (imports are bought from other countries).'
  },
  {
    id: 'ss-06',
    subject: 'Social Studies',
    prompt: 'Why is preserving historical landmarks and museum artifacts important for Caribbean communities?',
    options: [
      'It allows governments to charge entry fees to citizens.',
      'It preserves cultural identity, honours ancestors, and teaches future generations about their history.',
      'It ensures older buildings are never repaired or modernized.',
      'It stops students from having to read textbooks.'
    ],
    correctIndex: 1,
    explanation: 'Heritage sites connect generations to their history, resilience, and unique cultural identity.'
  }
];

/**
 * Generates a randomized 12-question quiz session:
 * Selects 3 questions per subject (4 subjects = 12 questions total),
 * and shuffles option order while keeping correctIndex accurate.
 */
function generateQuizSession(questions = READINESS_QUESTIONS) {
  const subjects = ['Language Arts', 'Mathematics', 'Science', 'Social Studies'];
  const selected = [];

  subjects.forEach(subj => {
    const pool = questions.filter(q => q.subject === subj);
    // Shuffle pool
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    // Pick 3
    selected.push(...shuffled.slice(0, 3));
  });

  // Shuffle overall order of questions
  const quiz = selected.sort(() => 0.5 - Math.random());

  // Shuffle options for each question
  return quiz.map((q, qIndex) => {
    const originalCorrectOption = q.options[q.correctIndex];
    const shuffledOptions = [...q.options].sort(() => 0.5 - Math.random());
    const newCorrectIndex = shuffledOptions.indexOf(originalCorrectOption);

    return {
      index: qIndex + 1,
      id: q.id,
      subject: q.subject,
      prompt: q.prompt,
      passage: q.passage || null,
      imageSvg: q.imageSvg || null,
      options: shuffledOptions,
      correctIndex: newCorrectIndex,
      explanation: q.explanation
    };
  });
}

module.exports = {
  READINESS_QUESTIONS,
  generateQuizSession
};
