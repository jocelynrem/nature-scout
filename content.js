(function (root, factory) {
  const data = factory();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = data;
  }

  root.NATURE_SCOUT_CONTENT = data;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const tasks = [
    {
      id: 'leaf',
      label: 'Leaves',
      emoji: '🍃',
      standard: 'LS.1.1',
      clue: 'Find some leaves on a plant.',
      question: 'What plant part did you find?',
      options: ['Leaves', 'Roots', 'Rocks', 'Water'],
      fact: 'Leaves help plants use sunlight to make food.',
    },
    {
      id: 'stem',
      label: 'Stem',
      emoji: '🌿',
      standard: 'LS.1.1',
      clue: 'Find a stem on a plant.',
      question: 'What does a stem do for a plant?',
      options: [
        'Helps hold it up',
        'Makes it bark',
        'Turns it to metal',
        'Makes it hop',
      ],
      fact: 'A stem helps hold a plant up and moves water to other plant parts.',
    },
    {
      id: 'seeds',
      label: 'Seeds',
      emoji: '🌰',
      standard: 'LS.1.1',
      clue: 'Find some seeds.',
      question: 'What can seeds grow into?',
      options: ['New plants', 'Shoes', 'Clouds', 'Pebbles'],
      fact: 'Seeds can grow into new plants when they get what they need.',
    },
    {
      id: 'soil',
      label: 'Soil',
      emoji: '🟫',
      standard: 'ESS.1.2',
      clue: 'Find some soil.',
      question: 'Which word can describe soil?',
      options: ['Dark', 'Light', 'Bumpy', 'Any of these'],
      fact: 'Soil is an Earth material. It can have different colors and textures.',
    },
    {
      id: 'fist-rock',
      label: 'Rock the Size of Your Fist',
      emoji: '✊',
      standard: 'ESS.1.2',
      clue: 'Find a rock about the size of your fist.',
      question: 'How big is this rock?',
      options: [
        'About fist-size',
        'Bigger than a car',
        'Tiny as sand',
        'Flat as paper',
      ],
      fact: 'Rocks can be described by size as well as color, shape, and texture.',
    },
    {
      id: 'smooth-rock',
      label: 'Smooth Rock',
      emoji: '🫧',
      standard: 'ESS.1.2',
      clue: 'Find a smooth rock.',
      question: 'How does this rock feel?',
      options: ['Smooth', 'Fuzzy', 'Squishy', 'Sticky'],
      fact: 'Texture is a physical property. Some rocks feel smooth.',
    },
    {
      id: 'shiny-rock',
      label: 'Shiny Rock',
      emoji: '✨',
      standard: 'ESS.1.2',
      clue: 'Find a shiny rock.',
      question: 'What special property do you notice?',
      options: [
        'It looks shiny',
        'It melts',
        'It barks',
        'It grows leaves',
      ],
      fact: 'A rock can be shiny. That is one way we describe its physical properties.',
    },
    {
      id: 'bumpy-rock',
      label: 'Bumpy Rock',
      emoji: '⛰️',
      standard: 'ESS.1.2',
      clue: 'Find a bumpy rock.',
      question: 'How does this rock feel?',
      options: ['Bumpy', 'Liquid', 'Fluffy', 'Hot chocolate'],
      fact: 'Some rocks have rough or bumpy textures that we can observe.',
    },
  ];

  const readAlouds = {
    intro:
      'Welcome, Nature Scout. Today you will look for plant parts and different kinds of rocks. Tap a square to hear the clue, then take a picture when you find it.',
    mainInstruction:
      'Tap a square, then photograph that plant part or kind of rock during your schoolyard walk.',
  };

  return { tasks, readAlouds };
});
