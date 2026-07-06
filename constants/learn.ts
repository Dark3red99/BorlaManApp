import type { WasteType } from '../types/models';

// Learn & Earn content: one segregation guide + one short quiz per waste
// type. Static for the mock; the backend will serve this from a CMS so new
// guides/quizzes ship without an app update.

export const POINTS_PER_CORRECT = 10;

export type Guide = {
  type: WasteType;
  title: string;
  readMinutes: number;
  intro: string;
  dos: string[];
  donts: string[];
  tip: string;
};

export type QuizQuestion = {
  prompt: string;
  options: string[];
  answer: number; // index into options
  explanation: string;
};

export type Quiz = {
  id: WasteType; // one quiz per waste type for now
  title: string;
  questions: QuizQuestion[];
};

export const GUIDES: Guide[] = [
  {
    type: 'household',
    title: 'Handling everyday borla',
    readMinutes: 2,
    intro:
      'General home waste is what fills most bins — wrappers, sweepings, packaging. Handled well, it stays off the streets and out of the gutters.',
    dos: [
      'Bag your waste and tie the bag shut before pickup',
      'Keep a covered bin so pests and rain stay out',
      'Pull out recyclables and food waste first — it shrinks your load',
      'Book a pickup before the bin overflows, not after',
    ],
    donts: [
      "Don't dump waste in gutters — blocked drains flood whole streets in the rainy season",
      "Don't burn waste at home; the smoke carries toxins into your compound",
      "Don't drop batteries or electronics into the household bag",
    ],
    tip: 'A tied bag loads faster, so collectors can serve more homes per round — and your compound stays clean.',
  },
  {
    type: 'recyclables',
    title: 'Sorting plastics, cans & paper',
    readMinutes: 3,
    intro:
      'Sachets, bottles, cans and cardboard have resale value when they arrive clean and sorted. That value is why a recyclables pickup is the cheapest on BorlaMan.',
    dos: [
      'Give bottles and sachets a quick rinse before bagging',
      'Collect water sachets together — clean film is in high demand',
      'Flatten cardboard boxes to save space on the Aboboyaa',
      'Keep plastics, cans and paper in separate bags if you can',
    ],
    donts: [
      "Don't mix in food waste — residue contaminates the whole bag",
      "Don't include used diapers or medical waste; they are never recyclable",
      "Don't crush cans with waste still inside",
    ],
    tip: 'Sorted recyclables ride a 0.8× price multiplier — sorting at home literally lowers your bill.',
  },
  {
    type: 'organic',
    title: 'Food & garden waste',
    readMinutes: 2,
    intro:
      'Peels, leftovers, market trimmings and garden cuttings rot fast in Ghana’s heat — but handled right, they become compost instead of stench.',
    dos: [
      'Keep a small covered container just for food scraps',
      'Book pickups within a day or two, before it smells and draws pests',
      'Compost at home if you have garden space — peels become free fertiliser',
      'Drain excess liquid before bagging to keep the load light',
    ],
    donts: [
      "Don't mix organic waste with recyclables — residue kills their value",
      "Don't leave it uncovered; flies and rodents find it within hours",
      "Don't pour cooking oil in — it ruins compost and clogs drains",
    ],
    tip: 'Organic waste is billed at 0.9× — and composting what you can means paying for even fewer kilos.',
  },
  {
    type: 'ewaste',
    title: 'Phones, batteries & cables',
    readMinutes: 3,
    intro:
      'Dead phones, chargers, bulbs and batteries carry lead, mercury and cadmium. Burned or landfilled, those toxins end up in air, soil and food — so e-waste gets special handling.',
    dos: [
      'Keep a box at home just for dead electronics and batteries',
      'Book a dedicated e-waste pickup once the box fills up',
      'Tape the terminals of loose batteries to prevent fires',
      'Wipe personal data off phones and laptops before handing them over',
    ],
    donts: [
      "Don't burn cables for the copper — the fumes are among the most toxic there are",
      "Don't put batteries in the household bag; they leak in landfill",
      "Don't smash screens or bulbs; broken ones release what's sealed inside",
    ],
    tip: 'E-waste is billed at 1.5× because it needs careful transport and certified recycling — small loads, big impact.',
  },
  {
    type: 'mixed',
    title: 'Bulky & unsorted loads',
    readMinutes: 2,
    intro:
      'Mixed waste is the catch-all: unsorted bags, old furniture, renovation debris. It is the most expensive load per kilo because someone still has to sort it at the depot.',
    dos: [
      'Pull out recyclables and organics first — every kilo you sort is billed cheaper',
      'Pick the right load size for bulky items so the collector brings the right cart',
      'Stack and tie loose items so they ride safely on the Aboboyaa',
      'Add photos to your request so the collector knows what to expect',
    ],
    donts: [
      "Don't hide e-waste or hazardous items inside a mixed load",
      "Don't overfill bags until they tear mid-loading",
      "Don't leave bulky items on the roadside hoping they vanish — they won't",
    ],
    tip: 'Mixed rides a 1.2× multiplier. Ten minutes of sorting before you book usually pays for itself.',
  },
];

export const QUIZZES: Quiz[] = [
  {
    id: 'household',
    title: 'Everyday borla basics',
    questions: [
      {
        prompt: 'How should household waste be prepared for pickup?',
        options: [
          'Left loose in the bin',
          'Bagged and tied shut',
          'Soaked in water first',
          'Mixed with recyclables',
        ],
        answer: 1,
        explanation: 'A tied bag keeps the load clean, loads faster and nothing spills on the way.',
      },
      {
        prompt: 'Why should waste never be dumped in gutters?',
        options: [
          'Gutters are cleaned every morning anyway',
          'It blocks drains and floods streets in the rainy season',
          'It helps water flow faster',
          'It is fine as long as it rains soon',
        ],
        answer: 1,
        explanation: 'Choked gutters are a top cause of urban flooding in Ghana’s rainy season.',
      },
      {
        prompt: 'Burning borla at home is…',
        options: [
          'A quick, safe way to reduce waste',
          'Good for the soil',
          'Harmful — the smoke carries toxins into your compound',
          'Allowed everywhere',
        ],
        answer: 2,
        explanation: 'Open burning releases toxic smoke right where your family breathes.',
      },
      {
        prompt: 'Which of these does NOT belong in the household bag?',
        options: ['Food wrappers', 'Swept dust', 'Old batteries', 'Torn clothing'],
        answer: 2,
        explanation: 'Batteries are e-waste — in landfill they leak heavy metals into soil and water.',
      },
    ],
  },
  {
    id: 'recyclables',
    title: 'Recycling that pays',
    questions: [
      {
        prompt: 'Before bagging a used bottle or sachet, you should…',
        options: ['Give it a quick rinse', 'Burn it lightly', 'Fill it with sand', 'Nothing at all'],
        answer: 0,
        explanation: 'Clean plastic keeps its resale value; dirty plastic often gets dumped instead.',
      },
      {
        prompt: 'Which of these counts as recyclable?',
        options: [
          'Cooked food leftovers',
          'Plastic bottles, cans and cardboard',
          'Used diapers',
          'Broken glass mixed with food',
        ],
        answer: 1,
        explanation: 'Clean plastics, metals and paper are the core recyclables buyers want.',
      },
      {
        prompt: 'Why is a sorted recyclables pickup the cheapest on BorlaMan?',
        options: [
          'Recyclables weigh nothing',
          'Collectors prefer the colour of the bags',
          'It is not actually cheaper',
          'Sorted recyclables have resale value, so the rate multiplier is lower',
        ],
        answer: 3,
        explanation: 'Recyclables ride a 0.8× multiplier because the material itself is worth money.',
      },
      {
        prompt: 'What is the best way to handle cardboard boxes?',
        options: [
          'Soak them in water',
          'Flatten them to save space',
          'Stuff them with other waste',
          'Burn them',
        ],
        answer: 1,
        explanation: 'Flat boxes stack — more material fits on one Aboboyaa trip.',
      },
    ],
  },
  {
    id: 'organic',
    title: 'Food & garden waste',
    questions: [
      {
        prompt: 'Organic waste includes…',
        options: [
          'Food scraps, peels and garden trimmings',
          'Plastic bags',
          'Batteries',
          'Tin cans',
        ],
        answer: 0,
        explanation: 'If it grew, it can rot — that is what makes it organic waste.',
      },
      {
        prompt: 'The best home use for organic waste is…',
        options: [
          'Burning it',
          'Pouring it in the gutter',
          'Composting it for the garden',
          'Mixing it with plastics',
        ],
        answer: 2,
        explanation: 'Compost turns peels into free fertiliser instead of landfill weight.',
      },
      {
        prompt: 'Why keep organic waste away from recyclables?',
        options: [
          'It makes the bag too colourful',
          'Food residue contaminates recyclables and destroys their value',
          'Organic waste is dangerous to touch',
          'No reason — mixing is fine',
        ],
        answer: 1,
        explanation: 'One leaking bag of leftovers can send a whole load of plastics to the dump.',
      },
      {
        prompt: 'In Ghana’s heat, organic waste should be collected…',
        options: [
          'Once a month',
          'Only during Harmattan',
          'Whenever the bin is completely full',
          'Within a day or two, before it smells and attracts pests',
        ],
        answer: 3,
        explanation: 'Heat speeds up rot — quick pickups keep the compound fresh and pest-free.',
      },
    ],
  },
  {
    id: 'ewaste',
    title: 'E-waste, handled right',
    questions: [
      {
        prompt: 'Which of these is e-waste?',
        options: ['Banana peels', 'Old phone chargers and batteries', 'Water sachets', 'Cardboard'],
        answer: 1,
        explanation: 'Anything with a plug, cable, chip or battery is e-waste.',
      },
      {
        prompt: 'Why must e-waste never be burned?',
        options: [
          'It burns too slowly',
          'The ash stains the ground',
          'Burning releases lead and mercury fumes that poison air and soil',
          'It is fine to burn in small amounts',
        ],
        answer: 2,
        explanation: 'Cable burning is a major source of toxic pollution — the fumes travel far beyond the fire.',
      },
      {
        prompt: 'Why does an e-waste pickup cost more (1.5×)?',
        options: [
          'It needs careful handling and certified recycling',
          'Electronics are heavier than anything else',
          'Collectors dislike carrying it',
          'It does not cost more',
        ],
        answer: 0,
        explanation: 'Safe transport and proper recycling of hazardous parts is what the higher rate pays for.',
      },
      {
        prompt: 'What should you do with dead batteries?',
        options: [
          'Drop them in the household bag',
          'Bury them in the garden',
          'Burn them with other waste',
          'Keep them separate and book an e-waste pickup',
        ],
        answer: 3,
        explanation: 'A dedicated box at home plus an e-waste pickup keeps heavy metals out of the soil.',
      },
    ],
  },
  {
    id: 'mixed',
    title: 'Mixed loads & your bill',
    questions: [
      {
        prompt: 'On BorlaMan, "mixed" waste means…',
        options: [
          'Only garden waste',
          'Unsorted or bulky waste',
          'Recyclables in one bag',
          'Anything in a black bag',
        ],
        answer: 1,
        explanation: 'Mixed is the catch-all for unsorted bags and bulky items like furniture.',
      },
      {
        prompt: 'Why does mixed waste cost more (1.2×) than sorted waste?',
        options: [
          'The bags are more expensive',
          'Collectors charge for the smell',
          'Someone still has to sort it at the depot, which takes time and labour',
          'It does not cost more',
        ],
        answer: 2,
        explanation: 'Depot sorting is hand work — the multiplier covers that extra labour.',
      },
      {
        prompt: 'The easiest way to lower your pickup bill is…',
        options: [
          'Sort recyclables and organics out of your borla first',
          'Use smaller bags',
          'Book pickups at night',
          'Wait until the load is huge',
        ],
        answer: 0,
        explanation: 'Sorted loads ride cheaper multipliers — 0.8× for recyclables, 0.9× for organics.',
      },
      {
        prompt: 'An old mattress or broken chair should be booked as…',
        options: [
          'Recyclables',
          'Organic waste',
          'E-waste',
          'Mixed, with a larger load size',
        ],
        answer: 3,
        explanation: 'Bulky items are mixed waste — the bigger size band tells the collector what cart to bring.',
      },
    ],
  },
];

export const guideFor = (type: WasteType): Guide =>
  GUIDES.find((g) => g.type === type) ?? GUIDES[0];

export const quizFor = (type: WasteType): Quiz =>
  QUIZZES.find((q) => q.id === type) ?? QUIZZES[0];

/** Max points a quiz can bank in total. */
export const quizMaxPoints = (quiz: Quiz): number => quiz.questions.length * POINTS_PER_CORRECT;
