const { tasks, readAlouds } = window.NATURE_SCOUT_CONTENT;

let activeTaskId = null;
let photos = {};
let observations = {};
let stream = null;
let currentAudio = null;
let guideAutoOpened = false;
let currentGuidePage = 0;
let guideTouchStartX = null;
const optionIcons = {
  Leaves: '🍃',
  Roots: '🌱',
  Rocks: '🪨',
  Water: '💧',
  'Helps hold it up': '🪴',
  'Makes bark': '🐶',
  'Turns to metal': '🔩',
  'Makes it hop': '🐸',
  'New plants': '🌼',
  Shoes: '👟',
  Clouds: '☁️',
  Pebbles: '🪨',
  'Dark soil': '⬛',
  'Light soil': '💡',
  'Bumpy soil': '⛰️',
  'More than one of these': '✅',
  'About fist-size': '✊',
  'Bigger than a car': '🚗',
  'Tiny as sand': '⏺️',
  'Flat as paper': '📄',
  Smooth: '🫧',
  Fuzzy: '🐻',
  Squishy: '🧽',
  Sticky: '🍯',
  'Looks shiny': '✨',
  Melts: '🫠',
  Barks: '🐕',
  'Grows leaves': '🍀',
  Liquid: '🥤',
  Fluffy: '🪶',
  'Like hot chocolate': '☕',
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
  playAudio('intro', { showFallbackAlert: false });
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
                                <span aria-hidden="true">🗑️</span>
                            </button>
                        </div>
                        <div class="saved-card-footer">
                            <button type="button" class="saved-card-audio" onclick="event.stopPropagation(); speakTaskFact('${task.id}')">
                              <span aria-hidden="true">🔊</span>
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
                          <span aria-hidden="true">🔊</span>
                        </button>
                    `;
    }
    grid.appendChild(card);
  });
  const foundCount = Object.keys(photos).length;
  const progressPill = document.getElementById('progress-pills');
  const guideButton = document.getElementById('guide-button');
  progressPill.textContent = `${foundCount} / ${tasks.length} Found`;
  guideButton.classList.toggle('hidden', foundCount !== tasks.length);
  if (foundCount === tasks.length) {
    progressPill.classList.add('is-complete');
    progressPill.textContent = `Gold Scout! 🏆`;
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
  document.getElementById('target-label').textContent = task.label;
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
  observations[activeTaskId] = getTaskById(activeTaskId)?.options?.[0] || '';
  closeCamera();
  const task = getTaskById(activeTaskId);
  showSuccess(task);
}

function showPropertySelection(task) {
  const modal = document.getElementById('property-modal');
  document.getElementById('property-question').textContent = task.question;
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
  document.getElementById('success-fact').textContent = task.fact;
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
  if (Object.keys(photos).length !== tasks.length) return;
  renderGuide();
  document.getElementById('guide-modal').classList.remove('hidden');
  goToGuidePage(0, false);
}

function closeGuide() {
  document.getElementById('guide-modal').classList.add('hidden');
  stopSpeaking();
}

function renderGuide() {
  const guideTrack = document.getElementById('guide-track');
  const foundTasks = tasks.filter((task) => photos[task.id]);

  guideTrack.innerHTML = `
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
            <span class="nature-inline-emoji" aria-hidden="true">🔊</span>
            <span>Read This Page</span>
          </button>
        </div>
      </div>
    `;
    guideTrack.appendChild(page);
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
  guideTrack.appendChild(finalePage);
  currentGuidePage = 0;
  attachGuideSwipeHandlers();
  updateGuidePager();
}

function getGuidePageCount() {
  const guideTrack = document.getElementById('guide-track');
  return guideTrack ? guideTrack.children.length : 0;
}

function goToGuidePage(index, animate = true) {
  const guideTrack = document.getElementById('guide-track');
  if (!guideTrack) return;

  const pageCount = getGuidePageCount();
  if (!pageCount) return;

  currentGuidePage = Math.max(0, Math.min(index, pageCount - 1));
  guideTrack.style.transition = animate ? 'transform 0.35s ease' : 'none';
  guideTrack.style.transform = `translateX(calc(${currentGuidePage} * -100% - ${currentGuidePage} * var(--guide-gap, 0.85rem)))`;
  updateGuidePager();
}

function goToNextGuidePage() {
  goToGuidePage(currentGuidePage + 1);
}

function goToPreviousGuidePage() {
  goToGuidePage(currentGuidePage - 1);
}

function updateGuidePager() {
  const prevButton = document.getElementById('guide-prev');
  const nextButton = document.getElementById('guide-next');
  const indicator = document.getElementById('guide-page-indicator');
  const pageCount = getGuidePageCount();

  if (!pageCount) return;

  prevButton.disabled = currentGuidePage === 0;
  nextButton.disabled = currentGuidePage === pageCount - 1;

  if (currentGuidePage === 0) {
    indicator.textContent = 'Cover';
    return;
  }

  if (currentGuidePage === pageCount - 1) {
    indicator.textContent = 'The End';
    return;
  }

  indicator.textContent = `Page ${currentGuidePage} of ${pageCount - 2}`;
}

function attachGuideSwipeHandlers() {
  const guideBook = document.getElementById('guide-book');
  if (!guideBook || guideBook.dataset.swipeReady === 'true') return;

  guideBook.addEventListener('touchstart', (event) => {
    guideTouchStartX = event.changedTouches[0].clientX;
  }, { passive: true });

  guideBook.addEventListener('touchend', (event) => {
    if (guideTouchStartX === null) return;
    const deltaX = event.changedTouches[0].clientX - guideTouchStartX;
    guideTouchStartX = null;

    if (Math.abs(deltaX) < 45) return;
    if (deltaX < 0) {
      goToNextGuidePage();
      return;
    }
    goToPreviousGuidePage();
  }, { passive: true });

  guideBook.dataset.swipeReady = 'true';
}

function speakCurrentTask() {
  const task = getTaskById(activeTaskId);
  if (!task) return;
  playAudio(`task-${task.id}-clue`, { showFallbackAlert: false });
}

function speakPropertyQuestion() {
  const task = getTaskById(activeTaskId);
  if (!task) return;
  playAudio(`task-${task.id}-question`, { showFallbackAlert: false });
}

function speakCurrentFact() {
  const task = getTaskById(activeTaskId);
  if (!task) return;
  playAudio(`task-${task.id}-fact`, { showFallbackAlert: false });
}

function speakMainInstruction() {
  playAudio('main-instruction', { showFallbackAlert: true });
}

function speakTaskClue(taskId) {
  playAudio(`task-${taskId}-clue`, { showFallbackAlert: true });
}

function speakTaskFact(taskId) {
  playAudio(`task-${taskId}-fact`, { showFallbackAlert: true });
}

async function playAudio(audioId, { showFallbackAlert = true } = {}) {
  stopSpeaking();
  const audio = new Audio(`audio/${audioId}.wav`);
  currentAudio = audio;
  let playbackStarted = false;
  let fallbackShown = false;

  const fallbackToText = (error) => {
    if (playbackStarted || fallbackShown) {
      return;
    }
    fallbackShown = true;
    if (currentAudio === audio) {
      currentAudio = null;
    }
    console.warn(`Audio playback failed for ${audioId}`, error);
    if (showFallbackAlert) {
      showAudioFallback(audioId);
    }
  };

  audio.addEventListener(
    'error',
    () => fallbackToText(new Error('Missing or unreadable audio file.')),
    { once: true },
  );

  audio.addEventListener(
    'playing',
    () => {
      playbackStarted = true;
    },
    { once: true },
  );

  try {
    await audio.play();
    playbackStarted = true;
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
