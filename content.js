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
      question: 'I noticed this plant part is...',
      options: [
        'I noticed leaves',
        'I noticed roots',
        'I noticed rocks',
        'I noticed water',
      ],
      fact: 'Leaves help plants use sunlight to make food.',
    },
    {
      id: 'stem',
      label: 'Stem',
      emoji: '🌿',
      standard: 'LS.1.1',
      clue: 'Find a stem on a plant.',
      question: 'I noticed this stem helps the plant...',
      options: [
        'I noticed it holds the plant up',
        'I noticed it makes bark',
        'I noticed it turns to metal',
        'I noticed it makes the plant hop',
      ],
      fact: 'A stem helps hold a plant up and moves water to other plant parts.',
    },
    {
      id: 'seeds',
      label: 'Seeds',
      emoji: '🌰',
      standard: 'LS.1.1',
      clue: 'Find some seeds.',
      question: 'I noticed these seeds could grow into...',
      options: [
        'I noticed new plants',
        'I noticed shoes',
        'I noticed clouds',
        'I noticed pebbles',
      ],
      fact: 'Seeds can grow into new plants when they get what they need.',
    },
    {
      id: 'soil',
      label: 'Soil',
      emoji: '🟫',
      standard: 'ESS.1.2',
      clue: 'Find some soil.',
      question: 'I noticed the soil looks or feels...',
      options: [
        'I noticed dark soil',
        'I noticed light soil',
        'I noticed bumpy soil',
        'I noticed more than one of these',
      ],
      fact: 'Soil is an Earth material. It can have different colors and textures.',
    },
    {
      id: 'fist-rock',
      label: 'Rock the Size of Your Fist',
      emoji: '✊',
      standard: 'ESS.1.2',
      clue: 'Find a rock about the size of your fist.',
      question: 'I noticed this rock is...',
      options: [
        'I noticed it is about fist-size',
        'I noticed it is bigger than a car',
        'I noticed it is tiny as sand',
        'I noticed it is flat as paper',
      ],
      fact: 'Rocks can be described by size as well as color, shape, and texture.',
    },
    {
      id: 'smooth-rock',
      label: 'Smooth Rock',
      emoji: '🫧',
      standard: 'ESS.1.2',
      clue: 'Find a smooth rock.',
      question: 'I noticed this rock feels...',
      options: [
        'I noticed it feels smooth',
        'I noticed it feels fuzzy',
        'I noticed it feels squishy',
        'I noticed it feels sticky',
      ],
      fact: 'Texture is a physical property. Some rocks feel smooth.',
    },
    {
      id: 'shiny-rock',
      label: 'Shiny Rock',
      emoji: '✨',
      standard: 'ESS.1.2',
      clue: 'Find a shiny rock.',
      question: 'I noticed something special. This rock...',
      options: [
        'I noticed it looks shiny',
        'I noticed it melts',
        'I noticed it barks',
        'I noticed it grows leaves',
      ],
      fact: 'A rock can be shiny. That is one way we describe its physical properties.',
    },
    {
      id: 'bumpy-rock',
      label: 'Bumpy Rock',
      emoji: '⛰️',
      standard: 'ESS.1.2',
      clue: 'Find a bumpy rock.',
      question: 'I noticed this rock feels...',
      options: [
        'I noticed it feels bumpy',
        'I noticed it feels liquid',
        'I noticed it feels fluffy',
        'I noticed it feels like hot chocolate',
      ],
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
