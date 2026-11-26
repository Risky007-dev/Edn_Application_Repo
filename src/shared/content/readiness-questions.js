/**
 * CPEA-Style Sample Readiness Check Question Bank
 * Original, culturally grounded sample practice questions for Caribbean primary students (approx. ages 10–12).
 *
 * IMPORTANT:
 * - Active public tracks: Mathematics (20 original sample questions) and Language Arts (20 original sample questions).
 * - Each session draws 10 randomized questions from the chosen active subject.
 * - Science (6) and Social Studies (6) are preserved in code in HIDDEN_SUBJECTS for potential future use,
 *   but are NOT exposed in the public subject picker or embedded into rendered page data.
 * - All questions are original practice samples, NOT official CPEA exam papers.
 */

const ACTIVE_SUBJECTS = ['Mathematics', 'Language Arts'];
const HIDDEN_SUBJECTS = ['Science', 'Social Studies'];
const QUESTIONS_PER_SESSION = 10;

const READINESS_QUESTIONS = [
  // =========================================================================
  // LANGUAGE ARTS (20 Original Sample Questions — Active Track)
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
  {
    id: 'la-07',
    subject: 'Language Arts',
    passage: 'On Saturday morning, a group of primary students met near the sandy cove with small spades and watering cans. Working side by side, they planted thirty young sea-grape saplings along the dunes. Their teacher explained that the spreading roots would hold the loose sand in place during strong coastal winds.',
    prompt: 'What is the MAIN IDEA of the passage?',
    options: [
      'Sea-grape trees grow faster than palm trees.',
      'Students planted sea-grape saplings to help protect the beach from sand erosion.',
      'The students preferred gardening to swimming on Saturday.',
      'Strong winds blew away all of the watering cans.'
    ],
    correctIndex: 1,
    explanation: 'Every detail in the paragraph focuses on the students planting sea-grape saplings so their roots protect the dunes.'
  },
  {
    id: 'la-08',
    subject: 'Language Arts',
    prompt: 'Read the sentence below:\n"At sunrise, the calm harbour shimmered like a sheet of polished glass."\nWhich figure of speech is used in this sentence?',
    options: ['Metaphor', 'Simile', 'Onomatopoeia', 'Oxymoron'],
    correctIndex: 1,
    explanation: 'A simile compares two different things using the word "like" or "as" ("shimmered like a sheet of polished glass").'
  },
  {
    id: 'la-09',
    subject: 'Language Arts',
    prompt: 'Choose the correct homophone to complete the sentence:\n"Please place the extra dictionaries over __________ on the top shelf."',
    options: ['their', 'there', 'they\'re', 'theirs'],
    correctIndex: 1,
    explanation: '"There" refers to a place or location. "Their" shows ownership, and "they\'re" is short for "they are".'
  },
  {
    id: 'la-10',
    subject: 'Language Arts',
    prompt: 'Which word is the OPPOSITE (antonym) of the word "GENEROUS"?',
    options: ['Kind', 'Selfish', 'Helpful', 'Cheerful'],
    correctIndex: 1,
    explanation: 'A generous person gladly shares with others, while a selfish person thinks only of themselves.'
  },
  {
    id: 'la-11',
    subject: 'Language Arts',
    prompt: 'In the sentence below, what part of speech is the word "SWIFTLY"?\n"The cricket ball rolled swiftly across the grassy outfield."',
    options: ['Noun', 'Adjective', 'Adverb', 'Preposition'],
    correctIndex: 2,
    explanation: '"Swiftly" describes HOW the ball rolled (it modifies the verb "rolled"), making it an adverb.'
  },
  {
    id: 'la-12',
    subject: 'Language Arts',
    prompt: 'Choose the correct past-tense verb to complete the sentence:\n"Yesterday afternoon, Keisha __________ her brightly coloured kite above the playing field."',
    options: ['flied', 'flew', 'flying', 'flies'],
    correctIndex: 1,
    explanation: '"Fly" is an irregular verb; its simple past tense is "flew" (not "flied").'
  },
  {
    id: 'la-13',
    subject: 'Language Arts',
    prompt: 'Which sentence uses the apostrophe CORRECTLY to show ownership?',
    options: [
      'The students backpack was left beside the classroom door.',
      'The student\'s backpack was left beside the classroom door.',
      'The student\'s backpack\'s was left beside the classroom door.',
      'The students\'s backpack was left beside the classroom door.'
    ],
    correctIndex: 1,
    explanation: 'For a single owner ("the student"), add an apostrophe and "s" ("student\'s") before the item owned ("backpack").'
  },
  {
    id: 'la-14',
    subject: 'Language Arts',
    prompt: 'What does the prefix "RE-" mean in words like "rebuild", "reread", and "rewrite"?',
    options: ['Before', 'Not', 'Again', 'Under'],
    correctIndex: 2,
    explanation: 'The prefix "re-" means "again" or "back", so "reread" means to read again.'
  },
  {
    id: 'la-15',
    subject: 'Language Arts',
    passage: 'Tariq looked up at the thick grey clouds rolling in from the east. Without being asked, he rolled his bicycle under the covered porch, shut the bedroom shutters, and packed his yellow raincoat into his school bag.',
    prompt: 'What can you INFER from Tariq\'s actions?',
    options: [
      'Tariq is getting ready to sell his bicycle.',
      'Tariq expects a heavy rain shower to start soon.',
      'Tariq forgot where he left his school bag.',
      'Tariq plans to go swimming in the afternoon.'
    ],
    correctIndex: 1,
    explanation: 'Dark grey clouds, moving a bicycle under shelter, closing shutters, and packing a raincoat all show he expects rain.'
  },
  {
    id: 'la-16',
    subject: 'Language Arts',
    prompt: 'Choose the BEST conjunction to join the two ideas:\n"Maya practised her speech every evening, __________ she felt calm and confident on stage."',
    options: ['although', 'so', 'unless', 'but'],
    correctIndex: 1,
    explanation: '"So" shows a cause-and-effect relationship: practising every evening caused her to feel calm on stage.'
  },
  {
    id: 'la-17',
    subject: 'Language Arts',
    prompt: 'Which word is CLOSEST in meaning (synonym) to the word "CAUTIOUS"?',
    options: ['Careful', 'Noisy', 'Reckless', 'Sleepy'],
    correctIndex: 0,
    explanation: '"Cautious" means careful and watchful to avoid danger or mistakes.'
  },
  {
    id: 'la-18',
    subject: 'Language Arts',
    prompt: 'Choose the word that BEST completes the sentence:\n"Both players on the netball team remembered to bring __________ own water bottles."',
    options: ['his', 'her', 'their', 'its'],
    correctIndex: 2,
    explanation: '"Both players" is a plural subject, so it takes the plural possessive pronoun "their".'
  },
  {
    id: 'la-19',
    subject: 'Language Arts',
    prompt: 'Which word is spelled CORRECTLY?',
    options: ['neccessary', 'necessary', 'necesary', 'neccesary'],
    correctIndex: 1,
    explanation: '"Necessary" is spelled with one "c" and two "s"s (a handy memory trick: one collar, two sleeves).'
  },
  {
    id: 'la-20',
    subject: 'Language Arts',
    prompt: 'Which of the following sentences states a FACT rather than an opinion?',
    options: [
      'Mangoes are the tastiest fruit in the entire world.',
      'An island is a piece of land completely surrounded by water.',
      'Blue is a much prettier colour than green.',
      'Friday is always the most exciting day of the week.'
    ],
    correctIndex: 1,
    explanation: 'A fact can be proven true for everyone; the definition of an island is a verifiable fact, whereas the others are personal opinions.'
  },

  // =========================================================================
  // MATHEMATICS (20 Original Sample Questions — Active Track)
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
    imageSvg: `<svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Analog clock showing 3:00">
      <circle cx="70" cy="70" r="60" fill="#FFF9C4" stroke="#1A365D" stroke-width="3"/>
      <circle cx="70" cy="70" r="4" fill="#1A365D"/>
      <text x="70" y="24" font-size="12" font-weight="bold" text-anchor="middle" fill="#1A365D">12</text>
      <text x="120" y="74" font-size="12" font-weight="bold" text-anchor="middle" fill="#1A365D">3</text>
      <text x="70" y="124" font-size="12" font-weight="bold" text-anchor="middle" fill="#1A365D">6</text>
      <text x="20" y="74" font-size="12" font-weight="bold" text-anchor="middle" fill="#1A365D">9</text>
      <line x1="70" y1="70" x2="98" y2="70" stroke="#1A365D" stroke-width="3.5" stroke-linecap="round"/>
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
      <rect x="45" y="60" width="30" height="40" fill="#2E75B6"/>
      <rect x="95" y="30" width="30" height="70" fill="#F5A623"/>
      <rect x="145" y="50" width="30" height="50" fill="#4CAF50"/>
      <text x="60" y="115" font-size="10" text-anchor="middle" fill="#1A365D">Mon</text>
      <text x="110" y="115" font-size="10" text-anchor="middle" fill="#1A365D">Tue</text>
      <text x="160" y="115" font-size="10" text-anchor="middle" fill="#1A365D">Wed</text>
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
  {
    id: 'math-07',
    subject: 'Mathematics',
    imageSvg: `<svg width="200" height="110" viewBox="0 0 200 110" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Rectangle garden bed 12 metres long and 5 metres wide">
      <rect x="35" y="25" width="130" height="55" fill="#E8F5E9" stroke="#1A365D" stroke-width="2.5"/>
      <text x="100" y="18" font-size="12" fill="#1A365D" font-weight="bold" text-anchor="middle">12 m</text>
      <text x="182" y="57" font-size="12" fill="#1A365D" font-weight="bold" text-anchor="middle">5 m</text>
    </svg>`,
    prompt: 'A rectangular school garden is 12 metres long and 5 metres wide. What is the PERIMETER around the garden?',
    options: ['17 m', '34 m', '60 m', '29 m'],
    correctIndex: 1,
    explanation: 'Perimeter of a rectangle = 2 × (Length + Width) = 2 × (12 + 5) = 2 × 17 = 34 m.'
  },
  {
    id: 'math-08',
    subject: 'Mathematics',
    prompt: 'Amara drank 1/4 of a jug of sorrel and her brother drank 3/8 of the same jug. What fraction of the jug did they drink altogether?',
    options: ['4/12', '5/8', '1/2', '7/8'],
    correctIndex: 1,
    explanation: 'Convert 1/4 to eighths: 1/4 = 2/8. Then add: 2/8 + 3/8 = 5/8.'
  },
  {
    id: 'math-09',
    subject: 'Mathematics',
    prompt: 'At a snack stall, a bottle of coconut water costs $3.75 and a baked patty costs $2.50. If Jalen pays with a $10.00 note, how much change should he receive?',
    options: ['$3.25', '$3.75', '$4.25', '$6.25'],
    correctIndex: 1,
    explanation: 'Total cost = $3.75 + $2.50 = $6.25. Change = $10.00 - $6.25 = $3.75.'
  },
  {
    id: 'math-10',
    subject: 'Mathematics',
    prompt: 'What is the place value of the digit 7 in the number 47,382?',
    options: ['70', '700', '7,000', '70,000'],
    correctIndex: 2,
    explanation: 'Reading from right to left: 2 (ones), 8 (tens), 3 (hundreds), 7 (thousands). So 7 represents 7,000.'
  },
  {
    id: 'math-11',
    subject: 'Mathematics',
    prompt: 'To make fresh limeade, Malik mixes water and lime juice in the ratio 4 : 1. If he uses 3 cups of lime juice, how many cups of water does he need?',
    options: ['7 cups', '9 cups', '12 cups', '15 cups'],
    correctIndex: 2,
    explanation: 'For every 1 cup of lime juice he needs 4 cups of water. For 3 cups of lime juice: 3 × 4 = 12 cups of water.'
  },
  {
    id: 'math-12',
    subject: 'Mathematics',
    imageSvg: `<svg width="200" height="110" viewBox="0 0 200 110" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Straight line divided into a 125 degree angle and unknown angle x">
      <line x1="20" y1="85" x2="180" y2="85" stroke="#1A365D" stroke-width="2.5"/>
      <line x1="100" y1="85" x2="145" y2="25" stroke="#E65100" stroke-width="2.5"/>
      <path d="M76 85 A24 24 0 0 1 114 66" stroke="#2E75B6" stroke-width="2" fill="none"/>
      <text x="64" y="58" font-size="12" fill="#1A365D" font-weight="bold">125°</text>
      <text x="132" y="72" font-size="12" fill="#E65100" font-weight="bold">x</text>
    </svg>`,
    prompt: 'In the diagram above, the two angles lie on a straight line. What is the size of angle x?',
    options: ['45°', '55°', '65°', '75°'],
    correctIndex: 1,
    explanation: 'Angles on a straight line add up to 180°. Therefore, x = 180° - 125° = 55°.'
  },
  {
    id: 'math-13',
    subject: 'Mathematics',
    prompt: 'Look at the number pattern below. What is the NEXT number in the sequence?\n5,  9,  13,  17,  ___',
    options: ['19', '20', '21', '22'],
    correctIndex: 2,
    explanation: 'Each term increases by 4 (+4): 5 + 4 = 9, 9 + 4 = 13, 13 + 4 = 17, and 17 + 4 = 21.'
  },
  {
    id: 'math-14',
    subject: 'Mathematics',
    prompt: 'A wooden sailboat is 4.5 metres long. What is its length in centimetres?',
    options: ['45 cm', '405 cm', '450 cm', '4,500 cm'],
    correctIndex: 2,
    explanation: 'There are 100 centimetres in 1 metre. So 4.5 × 100 = 450 centimetres.'
  },
  {
    id: 'math-15',
    subject: 'Mathematics',
    prompt: 'A school backpack normally costs $40.00. During a sale, it is discounted by 15%. How much money is taken off the regular price?',
    options: ['$4.00', '$6.00', '$8.00', '$15.00'],
    correctIndex: 1,
    explanation: '10% of $40 is $4, and 5% of $40 is $2. Together, 15% of $40 = $4 + $2 = $6.00.'
  },
  {
    id: 'math-16',
    subject: 'Mathematics',
    prompt: 'A teacher has 53 seashells to share equally among 6 craft tables. How many seashells will be LEFT OVER?',
    options: ['3 seashells', '4 seashells', '5 seashells', '8 seashells'],
    correctIndex: 2,
    explanation: '6 × 8 = 48 seashells are shared equally. Remainder = 53 - 48 = 5 seashells left over.'
  },
  {
    id: 'math-17',
    subject: 'Mathematics',
    prompt: 'A rectangular craft box is 5 cm long, 4 cm wide, and 3 cm tall. What is the VOLUME of the box?',
    options: ['12 cm³', '24 cm³', '47 cm³', '60 cm³'],
    correctIndex: 3,
    explanation: 'Volume = Length × Width × Height = 5 × 4 × 3 = 60 cm³.'
  },
  {
    id: 'math-18',
    subject: 'Mathematics',
    prompt: 'What is 6,482 rounded to the nearest HUNDRED?',
    options: ['6,400', '6,480', '6,500', '7,000'],
    correctIndex: 2,
    explanation: 'The tens digit is 8 (which is 5 or greater), so we round 482 up to 500, giving 6,500.'
  },
  {
    id: 'math-19',
    subject: 'Mathematics',
    prompt: 'Which of the following numbers is a PRIME number?',
    options: ['15', '21', '23', '27'],
    correctIndex: 2,
    explanation: 'A prime number has exactly two factors: 1 and itself. 23 is prime, whereas 15 = 3×5, 21 = 3×7, and 27 = 3×9.'
  },
  {
    id: 'math-20',
    subject: 'Mathematics',
    prompt: 'Which decimal is EQUAL to the fraction 3/4?',
    options: ['0.34', '0.50', '0.75', '0.80'],
    correctIndex: 2,
    explanation: '3 ÷ 4 = 0.75 (or think of 3 quarters of a dollar = 75 cents = $0.75).'
  },

  // =========================================================================
  // SCIENCE (6 Questions — Preserved in Code, Hidden from Public UI)
  // =========================================================================
  {
    id: 'sci-01',
    subject: 'Science',
    imageSvg: `<svg width="200" height="120" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Water cycle diagram showing evaporation, condensation, and precipitation">
      <circle cx="165" cy="30" r="14" fill="#F5A623"/>
      <path d="M70 35 Q80 20 95 25 Q110 15 120 28 Q130 32 125 45 Q115 50 75 45 Z" fill="#90CAF9" stroke="#1A365D" stroke-width="1.5"/>
      <path d="M20 100 Q60 90 100 100 Q140 110 180 100 L180 118 L20 118 Z" fill="#2E75B6"/>
      <path d="M50 90 Q45 65 65 52" stroke="#E65100" stroke-width="2" stroke-dasharray="3 3" marker-end="url(#arrow)"/>
      <text x="40" y="68" font-size="9" fill="#E65100" font-weight="bold">Stage X</text>
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
  // SOCIAL STUDIES (6 Questions — Preserved in Code, Hidden from Public UI)
  // =========================================================================
  {
    id: 'ss-01',
    subject: 'Social Studies',
    imageSvg: `<svg width="180" height="120" viewBox="0 0 180 120" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Archipelago map outline">
      <rect width="180" height="120" fill="#E1F5FE" rx="6"/>
      <path d="M45 35 Q65 25 85 30 Q70 42 45 35 Z" fill="#81C784" stroke="#1A365D" stroke-width="1.5"/>
      <circle cx="80" cy="50" r="10" fill="#A5D6A7" stroke="#1A365D" stroke-width="1.5"/>
      <ellipse cx="110" cy="70" rx="14" ry="8" fill="#81C784" stroke="#1A365D" stroke-width="1.5"/>
      <circle cx="135" cy="88" r="7" fill="#A5D6A7" stroke="#1A365D" stroke-width="1.5"/>
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

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function normalizeActiveSubject(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const cleaned = raw.trim().toLowerCase();
  if (cleaned === 'math' || cleaned === 'maths' || cleaned === 'mathematics') {
    return 'Mathematics';
  }
  if (cleaned === 'la' || cleaned === 'english' || cleaned === 'language-arts' || cleaned === 'language arts') {
    return 'Language Arts';
  }
  return null;
}

function getActiveQuestions(questions = READINESS_QUESTIONS) {
  return questions.filter(q => ACTIVE_SUBJECTS.includes(q.subject));
}

function getQuestionsBySubject(subject, questions = READINESS_QUESTIONS) {
  const canonical = normalizeActiveSubject(subject);
  if (!canonical) return [];
  return questions.filter(q => q.subject === canonical);
}

function getReadinessBand(correctCount, total = QUESTIONS_PER_SESSION) {
  if (!Number.isInteger(correctCount) || total <= 0) {
    return { band: 'Just Starting', badge: '🌱' };
  }
  if (correctCount >= 9) return { band: 'Exam Star', badge: '🌟' };
  if (correctCount >= 7) return { band: 'Looking Good', badge: '🚀' };
  if (correctCount >= 5) return { band: 'Getting There', badge: '💪' };
  return { band: 'Just Starting', badge: '🌱' };
}

/**
 * Generates a randomized 10-question quiz session for an active subject
 * ('Mathematics' or 'Language Arts'). Shuffles question selection and option order
 * while preserving the exact correctIndex.
 */
function generateQuizSession(subject = 'Mathematics', questions = READINESS_QUESTIONS) {
  // Backwards-safety: if caller passed a questions array as first argument, default subject to Mathematics
  let targetSubject = subject;
  let sourceQuestions = questions;
  if (Array.isArray(subject)) {
    sourceQuestions = subject;
    targetSubject = 'Mathematics';
  }

  const canonical = normalizeActiveSubject(targetSubject);
  if (!canonical) {
    throw new Error(`Unsupported or hidden readiness subject: ${targetSubject}`);
  }

  const pool = sourceQuestions.filter(q => q.subject === canonical);
  const selected = shuffleArray(pool).slice(0, QUESTIONS_PER_SESSION);

  return selected.map((q, qIndex) => {
    const originalCorrectOption = q.options[q.correctIndex];
    const shuffledOptions = shuffleArray(q.options);
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
  ACTIVE_SUBJECTS,
  HIDDEN_SUBJECTS,
  QUESTIONS_PER_SESSION,
  READINESS_QUESTIONS,
  normalizeActiveSubject,
  getActiveQuestions,
  getQuestionsBySubject,
  getReadinessBand,
  generateQuizSession
};
