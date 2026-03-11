const { tasks, readAlouds } = window.NATURE_SCOUT_CONTENT;

let activeTaskId = null;
let photos = {};
let observations = {};
let stream = null;
let currentAudio = null;
const optionIcons = {
  Leaves: '🍃',
  Roots: '🌱',
  Rocks: '🪨',
  Water: '💧',
  'Helps hold it up': '🪴',
  'Makes it bark': '🐶',
  'Turns it to metal': '🔩',
  'Makes it hop': '🐸',
  'New plants': '🌼',
  Shoes: '👟',
  Clouds: '☁️',
  Pebbles: '🪨',
  Dark: '⬛',
  Light: '💡',
  Bumpy: '⛰️',
  'Any of these': '✅',
  'About fist-size': '✊',
  'Bigger than a car': '🚗',
  'Tiny as sand': '⏺️',
  'Flat as paper': '📄',
  Smooth: '🫧',
  Fuzzy: '🐻',
  Squishy: '🧽',
  Sticky: '🍯',
  'It looks shiny': '✨',
  'It melts': '🫠',
  'It barks': '🐕',
  'It grows leaves': '🍀',
  Liquid: '🥤',
  Fluffy: '🪶',
  'Hot chocolate': '☕',
};

function getTaskById(taskId) {
  return tasks.find((task) => task.id === taskId) || null;
}

function getFallbackText(audioId) {
  if (audioId === 'intro') return readAlouds.intro;
  if (audioId === 'main-instruction') return readAlouds.mainInstruction;

  const match = audioId.match(/^task-(.+)-(clue|question|fact)$/);
  if (!match) return null;

  const [, taskId, kind] = match;
  const task = getTaskById(taskId);
  if (!task) return null;

  if (kind === 'clue') return task.clue;
  if (kind === 'question') return task.question;
  if (kind === 'fact') return `Great discovery! ${task.fact}`;
  return null;
}

function showAudioFallback(audioId) {
  const fallbackText = getFallbackText(audioId);

  if (!fallbackText) {
    alert('This audio file is missing.');
    return;
  }

  alert(fallbackText);
}

function startGame() {
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('game-container').classList.remove('hidden');
  renderGrid();
  playAudio('intro');
}

function renderGrid() {
  const grid = document.getElementById('photo-grid');
  grid.innerHTML = '';
  tasks.forEach((task) => {
    const photo = photos[task.id];
    const card = document.createElement(photo ? 'div' : 'button');
    if (!photo) {
      card.onclick = () => openCamera(task.id);
      card.type = 'button';
    }
    card.className = `mission-card relative h-full w-full rounded-2xl overflow-hidden border-4 shadow-sm flex flex-col items-center justify-center ${photo ? 'border-green-500 bg-white' : 'border-dashed border-gray-400 bg-white'}`;

    if (photo) {
      const obs = observations[task.id]
        ? `<div class="bg-yellow-300 text-black text-[8px] px-1 rounded-sm mt-0.5">${observations[task.id]}</div>`
        : '';
      card.innerHTML = `
                        <img src="${photo}" class="absolute inset-0 w-full h-full object-cover">
                        <div class="absolute inset-0 bg-green-500 bg-opacity-10 pointer-events-none"></div>
                        <div class="absolute top-2 right-2 w-[5.25rem]">
                            <button type="button" class="saved-card-action bg-red-500 text-white" onclick="event.stopPropagation(); deletePhoto('${task.id}')">
                                <span class="text-base leading-none">🗑️</span>
                                <span>Delete</span>
                            </button>
                        </div>
                        <div class="absolute bottom-0 left-0 right-0 bg-green-700 text-white text-[9px] p-1 font-bold leading-none flex items-center justify-between gap-1">
                            <button type="button" class="saved-card-audio" onclick="event.stopPropagation(); speakTaskFact('${task.id}')">🔊</button>
                            <div class="flex-1 text-center">${task.label} ✅ ${obs}</div>
                            <div class="w-5 shrink-0"></div>
                        </div>
                    `;
    } else {
      card.innerHTML = `
                        <div class="absolute top-1 left-1 bg-gray-100 text-gray-500 text-[8px] px-1.5 py-0.5 rounded-full font-bold">${task.standard}</div>
                        <div class="text-3xl md:text-5xl mb-1">${task.emoji}</div>
                        <div class="text-[10px] md:text-sm font-black text-gray-700 uppercase leading-none">${task.label}</div>
                        <div class="absolute top-1 right-1 text-green-600" onclick="event.stopPropagation(); speakTaskClue('${task.id}')">
                             <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                        </div>
                    `;
    }
    grid.appendChild(card);
  });
  const foundCount = Object.keys(photos).length;
  document.getElementById('progress-pills').innerText =
    `${foundCount} / ${tasks.length} Found`;
  if (foundCount === tasks.length) {
    document
      .getElementById('progress-pills')
      .classList.replace('bg-green-800', 'bg-yellow-500');
    document.getElementById('progress-pills').innerText = `Gold Scout! 🏆`;
  }
}

function deletePhoto(taskId) {
  delete photos[taskId];
  delete observations[taskId];
  if (activeTaskId === taskId) {
    activeTaskId = null;
  }
  renderGrid();
}

async function openCamera(taskId) {
  activeTaskId = taskId;
  const task = getTaskById(taskId);
  document.getElementById('target-label').innerText = task.label;
  const video = document.getElementById('video-preview');
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    });
    video.srcObject = stream;
    document.getElementById('camera-view').classList.remove('hidden');
    speakCurrentTask();
  } catch (err) {
    alert('Check camera settings!');
  }
}

function closeCamera() {
  if (stream) stream.getTracks().forEach((track) => track.stop());
  document.getElementById('camera-view').classList.add('hidden');
  stopSpeaking();
}

function takePhoto() {
  const video = document.getElementById('video-preview');
  const canvas = document.getElementById('capture-canvas');
  const context = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  photos[activeTaskId] = canvas.toDataURL('image/png');
  closeCamera();
  const task = getTaskById(activeTaskId);
  if (task.question) showPropertySelection(task);
  else showSuccess(task);
}

function showPropertySelection(task) {
  const modal = document.getElementById('property-modal');
  document.getElementById('property-question').innerText = task.question;
  const optionsContainer = document.getElementById('property-options');
  optionsContainer.innerHTML = '';
  task.options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.className =
      'bg-green-600 text-white font-black py-4 rounded-2xl text-xl btn-bounce flex flex-col items-center justify-center gap-1 leading-tight';
    btn.innerHTML = `
      <span class="text-3xl leading-none">${getOptionIcon(opt)}</span>
      <span>${opt}</span>
    `;
    btn.onclick = () => {
      observations[task.id] = opt;
      modal.classList.add('hidden');
      showSuccess(task);
    };
    optionsContainer.appendChild(btn);
  });
  modal.classList.remove('hidden');
  speakPropertyQuestion();
}

function getOptionIcon(optionText) {
  return optionIcons[optionText] || '🔍';
}

function showSuccess(task) {
  document.getElementById('success-fact').innerText = task.fact;
  document.getElementById('success-modal').classList.remove('hidden');
  speakCurrentFact();
}

function closeSuccess() {
  document.getElementById('success-modal').classList.add('hidden');
  stopSpeaking();
  renderGrid();
}

function speakCurrentTask() {
  const task = getTaskById(activeTaskId);
  if (!task) return;
  playAudio(`task-${task.id}-clue`);
}

function speakPropertyQuestion() {
  const task = getTaskById(activeTaskId);
  if (!task) return;
  playAudio(`task-${task.id}-question`);
}

function speakCurrentFact() {
  const task = getTaskById(activeTaskId);
  if (!task) return;
  playAudio(`task-${task.id}-fact`);
}

function speakMainInstruction() {
  playAudio('main-instruction');
}

function speakTaskClue(taskId) {
  playAudio(`task-${taskId}-clue`);
}

function speakTaskFact(taskId) {
  playAudio(`task-${taskId}-fact`);
}

async function playAudio(audioId) {
  stopSpeaking();
  const audio = new Audio(`audio/${audioId}.wav`);
  currentAudio = audio;

  const fallbackToText = (error) => {
    if (currentAudio === audio) {
      currentAudio = null;
    }
    console.warn(`Audio playback failed for ${audioId}`, error);
    showAudioFallback(audioId);
  };

  audio.addEventListener(
    'error',
    () => fallbackToText(new Error('Missing or unreadable audio file.')),
    { once: true },
  );

  try {
    await audio.play();
  } catch (error) {
    fallbackToText(error);
  }
}

function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

function setFullHeight() {
  document.documentElement.style.setProperty(
    '--vh',
    `${window.innerHeight * 0.01}px`,
  );
}

window.addEventListener('resize', setFullHeight);
setFullHeight();
