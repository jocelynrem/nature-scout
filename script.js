const { tasks, readAlouds } = window.NATURE_SCOUT_CONTENT;

let activeTaskId = null;
let photos = {};
let observations = {};
let stream = null;
let currentAudio = null;
let guideAutoOpened = false;
const optionIcons = {
  'I noticed leaves': '🍃',
  'I noticed roots': '🌱',
  'I noticed rocks': '🪨',
  'I noticed water': '💧',
  'I noticed it holds the plant up': '🪴',
  'I noticed it makes bark': '🐶',
  'I noticed it turns to metal': '🔩',
  'I noticed it makes the plant hop': '🐸',
  'I noticed new plants': '🌼',
  'I noticed shoes': '👟',
  'I noticed clouds': '☁️',
  'I noticed pebbles': '🪨',
  'I noticed dark soil': '⬛',
  'I noticed light soil': '💡',
  'I noticed bumpy soil': '⛰️',
  'I noticed more than one of these': '✅',
  'I noticed it is about fist-size': '✊',
  'I noticed it is bigger than a car': '🚗',
  'I noticed it is tiny as sand': '⏺️',
  'I noticed it is flat as paper': '📄',
  'I noticed it feels smooth': '🫧',
  'I noticed it feels fuzzy': '🐻',
  'I noticed it feels squishy': '🧽',
  'I noticed it feels sticky': '🍯',
  'I noticed it looks shiny': '✨',
  'I noticed it melts': '🫠',
  'I noticed it barks': '🐕',
  'I noticed it grows leaves': '🍀',
  'I noticed it feels liquid': '🥤',
  'I noticed it feels fluffy': '🪶',
  'I noticed it feels like hot chocolate': '☕',
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
  const guideButton = document.getElementById('guide-button');
  progressPill.innerText = `${foundCount} / ${tasks.length} Found`;
  guideButton.classList.toggle('hidden', foundCount === 0);
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
  guideAutoOpened = false;
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
      <span class="nature-option-text">${opt}</span>
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
  if (Object.keys(photos).length === tasks.length && !guideAutoOpened) {
    guideAutoOpened = true;
    openGuide();
  }
}

function openGuide() {
  if (!Object.keys(photos).length) return;
  renderGuide();
  document.getElementById('guide-modal').classList.remove('hidden');
}

function closeGuide() {
  document.getElementById('guide-modal').classList.add('hidden');
  stopSpeaking();
}

function renderGuide() {
  const guideBook = document.getElementById('guide-book');
  const foundTasks = tasks.filter((task) => photos[task.id]);

  guideBook.innerHTML = `
    <article class="nature-guide-page nature-guide-cover">
      <div class="nature-guide-sparkle nature-guide-sparkle-one">🍓</div>
      <div class="nature-guide-sparkle nature-guide-sparkle-two">🦋</div>
      <div class="nature-guide-cover-badge">📖</div>
      <p class="nature-guide-cover-kicker">First Grade Field Notes</p>
      <h4 class="nature-guide-cover-title">Nature Scout Booklet</h4>
      <p class="nature-guide-cover-text">
        Plant parts, rocks, and earth materials we spotted on our outdoor science walk.
      </p>
      <p class="nature-guide-cover-tip">Swipe to turn the pages.</p>
    </article>
  `;

  foundTasks.forEach((task, index) => {
    const page = document.createElement('article');
    const observation = observations[task.id]
      ? `<p class="nature-guide-note"><span class="nature-guide-note-label">I noticed</span>${observations[task.id]}</p>`
      : '';
    page.className = 'nature-guide-page';
    page.innerHTML = `
      <div class="nature-guide-page-card">
        <div class="nature-guide-page-doodle">${index % 2 === 0 ? '🌼' : '🐞'}</div>
        <div class="nature-guide-page-photo-wrap">
          <img src="${photos[task.id]}" alt="${task.label}" class="nature-guide-photo" />
          <div class="nature-guide-photo-sticker">${task.emoji}</div>
        </div>
        <div class="nature-guide-page-body">
          <div class="nature-guide-page-meta">
            <span class="nature-guide-standard">${task.standard}</span>
            <span class="nature-guide-page-count">Page ${index + 1}</span>
          </div>
          <h4 class="nature-guide-page-title">${task.label}</h4>
          ${observation}
          <p class="nature-guide-fact">${task.fact}</p>
          <button
            type="button"
            class="button is-success is-light is-rounded nature-guide-audio"
            onclick="speakTaskFact('${task.id}')"
          >
            <span class="icon"><i class="fas fa-volume-up"></i></span>
            <span>Read This Page</span>
          </button>
        </div>
      </div>
    `;
    guideBook.appendChild(page);
  });

  const finalePage = document.createElement('article');
  finalePage.className = 'nature-guide-page nature-guide-finale';
  finalePage.innerHTML = `
    <div class="nature-guide-finale-badge">🏆</div>
    <h4 class="nature-guide-cover-title">Great Job, Scout!</h4>
    <p class="nature-guide-cover-text">
      You collected ${foundTasks.length} nature discoveries and turned them into your own mini guidebook.
    </p>
    <p class="nature-guide-cover-tip">Open it anytime with the Field Guide button.</p>
  `;
  guideBook.appendChild(finalePage);
  guideBook.scrollTo({ left: 0, behavior: 'auto' });
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
