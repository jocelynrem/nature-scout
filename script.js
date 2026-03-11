const apiKey = '';
const tasks = [
  {
    id: 'sun',
    label: 'Light Energy',
    emoji: '☀️',
    standard: 'LS.1.1',
    fact: 'Plants use light to make their own food! This gives them the energy they need to grow.',
  },
  {
    id: 'water',
    label: 'Water Needs',
    emoji: '💧',
    standard: 'LS.1.1',
    fact: 'All living things need water. Plants take in water through their roots to stay healthy.',
  },
  {
    id: 'rock',
    label: 'Earth Rock',
    emoji: '🪨',
    standard: 'ESS.1.2',
    question: 'What does this rock feel like?',
    options: ['Rough', 'Smooth', 'Hard', 'Pointy'],
    fact: 'Earth materials like rocks can be described by their color, size, and texture!',
  },
  {
    id: 'soil',
    label: 'Nutrient Soil',
    emoji: '🌱',
    standard: 'ESS.1.2',
    question: 'What color is the soil?',
    options: ['Dark', 'Light', 'Red', 'Brown'],
    fact: "Plants don't 'eat' soil, but they do get important nutrients and water from it!",
  },
  {
    id: 'shelter',
    label: 'Animal Shelter',
    emoji: '🏠',
    standard: 'LS.1.1',
    fact: 'Animals use plants or other materials for shelter and nesting to stay safe and dry.',
  },
  {
    id: 'resource',
    label: 'Natural Resource',
    emoji: '🌳',
    standard: 'ESS.1.3',
    fact: 'Humans depend on natural resources like trees for wood to build homes and paper.',
  },
  {
    id: 'recycle',
    label: 'Recycle Action',
    emoji: '♻️',
    standard: 'ESS.1.3',
    fact: 'Materials like plastic and metal can be broken down and reused in a different form!',
  },
  {
    id: 'litter',
    label: 'Protect Nature',
    emoji: '🗑️',
    standard: 'ESS.1.3',
    fact: 'Litter can hurt plants and animals. Keeping the environment clean helps everything grow.',
  },
];

let activeTaskId = null;
let photos = {};
let observations = {};
let stream = null;
let currentAudio = null;

function startGame() {
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('game-container').classList.remove('hidden');
  renderGrid();
  speakText('Welcome Nature Scout! Tap a square to start your walk.');
}

function renderGrid() {
  const grid = document.getElementById('photo-grid');
  grid.innerHTML = '';
  tasks.forEach((task) => {
    const photo = photos[task.id];
    const card = document.createElement('button');
    card.onclick = () => openCamera(task.id);
    card.className = `mission-card relative h-full w-full rounded-2xl overflow-hidden border-4 shadow-sm flex flex-col items-center justify-center ${photo ? 'border-green-500 bg-white' : 'border-dashed border-gray-400 bg-white'}`;

    if (photo) {
      const obs = observations[task.id]
        ? `<div class="bg-yellow-300 text-black text-[8px] px-1 rounded-sm mt-0.5">${observations[task.id]}</div>`
        : '';
      card.innerHTML = `
                        <img src="${photo}" class="absolute inset-0 w-full h-full object-cover">
                        <div class="absolute inset-0 bg-green-500 bg-opacity-10"></div>
                        <div class="absolute bottom-0 left-0 right-0 bg-green-700 text-white text-[9px] p-1 font-bold text-center leading-none">
                            ${task.label} ✅ ${obs}
                        </div>
                    `;
    } else {
      card.innerHTML = `
                        <div class="absolute top-1 left-1 bg-gray-100 text-gray-500 text-[8px] px-1.5 py-0.5 rounded-full font-bold">${task.standard}</div>
                        <div class="text-3xl md:text-5xl mb-1">${task.emoji}</div>
                        <div class="text-[10px] md:text-sm font-black text-gray-700 uppercase leading-none">${task.label}</div>
                        <div class="absolute top-1 right-1 text-green-600" onclick="event.stopPropagation(); speakText('${task.label}')">
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

async function openCamera(taskId) {
  activeTaskId = taskId;
  const task = tasks.find((t) => t.id === taskId);
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
  const task = tasks.find((t) => t.id === activeTaskId);
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
      'bg-green-600 text-white font-black py-4 rounded-2xl text-xl btn-bounce';
    btn.innerText = opt;
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
  const task = tasks.find((t) => t.id === activeTaskId);
  speakText(`Can you find ${task.label}?`);
}

function speakPropertyQuestion() {
  const task = tasks.find((t) => t.id === activeTaskId);
  speakText(task.question);
}

function speakCurrentFact() {
  const task = tasks.find((t) => t.id === activeTaskId);
  speakText(`Great discovery! ${task.fact}`);
}

async function speakText(text) {
  stopSpeaking();
  try {
    const result = await callTTSWithRetry(text);
    if (result) {
      const sampleRateMatch = result.mimeType.match(/rate=(\d+)/);
      const sampleRate = sampleRateMatch
        ? parseInt(sampleRateMatch[1], 10)
        : 24000;
      const audioBuffer = base64ToUint8Array(result.inlineData.data);
      const wavBlob = pcmToWav(audioBuffer, sampleRate);
      const audioUrl = URL.createObjectURL(wavBlob);
      currentAudio = new Audio(audioUrl);
      currentAudio.play();
    }
  } catch (e) {
    console.error('TTS Failed', e);
  }
}

function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
}

async function callTTSWithRetry(text, retries = 0) {
  const payload = {
    contents: [{ parts: [{ text: text }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
      },
    },
  };
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );
    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0];
  } catch (err) {
    if (retries < 5) {
      await new Promise((r) => setTimeout(r, Math.pow(2, retries) * 1000));
      return callTTSWithRetry(text, retries + 1);
    }
    return null;
  }
}

function base64ToUint8Array(base64) {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function pcmToWav(pcmData, sampleRate) {
  const buffer = new ArrayBuffer(44 + pcmData.length);
  const view = new DataView(buffer);
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 32 + pcmData.length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, pcmData.length, true);
  const pcmView = new Uint8Array(pcmData);
  for (let i = 0; i < pcmData.length; i++) {
    view.setUint8(44 + i, pcmView[i]);
  }
  return new Blob([view], { type: 'audio/wav' });
}

function setFullHeight() {
  document.documentElement.style.setProperty(
    '--vh',
    `${window.innerHeight * 0.01}px`,
  );
}

window.addEventListener('resize', setFullHeight);
setFullHeight();
