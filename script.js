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
    card.className = `mission-card ${photo ? 'mission-card-complete' : 'mission-card-empty'}`;

    if (photo) {
      const obs = observations[task.id]
        ? `<div class="saved-card-observation">${observations[task.id]}</div>`
        : '';
      card.innerHTML = `
                        <img src="${photo}" class="mission-photo">
                        <div class="mission-photo-overlay"></div>
                        <div class="saved-card-toolbar">
                            <button type="button" class="saved-card-action button is-danger is-rounded" onclick="event.stopPropagation(); deletePhoto('${task.id}')">
                                <span class="icon is-small"><i class="fas fa-trash-alt"></i></span>
                            </button>
                        </div>
                        <div class="saved-card-footer">
                            <button type="button" class="saved-card-audio" onclick="event.stopPropagation(); speakTaskFact('${task.id}')">
                              <i class="fas fa-volume-up"></i>
                            </button>
                            <div class="saved-card-label">${task.label} &#10003; ${obs}</div>
                            <div class="saved-card-spacer"></div>
                        </div>
                    `;
    } else {
      card.innerHTML = `
                        <div class="mission-standard">${task.standard}</div>
                        <div class="mission-emoji">${task.emoji}</div>
                        <div class="mission-label">${task.label}</div>
                        <button type="button" class="mission-audio-trigger" onclick="event.stopPropagation(); speakTaskClue('${task.id}')">
                          <i class="fas fa-volume-up"></i>
                        </button>
                    `;
    }
    grid.appendChild(card);
  });
  const foundCount = Object.keys(photos).length;
  const progressPill = document.getElementById('progress-pills');
  progressPill.innerText = `${foundCount} / ${tasks.length} Found`;
  if (foundCount === tasks.length) {
    progressPill.classList.add('is-complete');
    progressPill.innerText = `Gold Scout! 🏆`;
  } else {
    progressPill.classList.remove('is-complete');
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
    btn.className = 'button nature-option-button btn-bounce';
    btn.innerHTML = `
      <span class="nature-option-icon">${getOptionIcon(opt)}</span>
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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((error) => {
      console.error('Service worker registration failed', error);
    });
  });
}
