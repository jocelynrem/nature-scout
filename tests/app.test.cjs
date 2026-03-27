const test = require('node:test');
const assert = require('node:assert/strict');

const { loadApp } = require('./helpers/appHarness.cjs');

test('setFullHeight prefers visualViewport height for viewport sizing', () => {
  const app = loadApp();

  assert.equal(
    app.document.documentElement.style.getPropertyValue('--vh'),
    '7px',
  );
  assert.ok(app.windowListeners.resize);
  assert.ok(app.visualViewportListeners.resize);
});

test('openGuide only opens after every task has a photo', () => {
  const app = loadApp();
  const guideModal = app.document.getElementById('guide-modal');

  app.run('openGuide()');
  assert.equal(guideModal.classList.contains('hidden'), true);

  app.run(`
    photos = Object.fromEntries(tasks.map((task, index) => [task.id, 'photo-' + index]));
    openGuide();
  `);

  assert.equal(guideModal.classList.contains('hidden'), false);
});

test('renderGuide builds cover, task pages, and finale with pager state', () => {
  const app = loadApp();
  const track = app.document.getElementById('guide-track');
  const indicator = app.document.getElementById('guide-page-indicator');
  const prev = app.document.getElementById('guide-prev');
  const next = app.document.getElementById('guide-next');

  app.run(`
    photos = Object.fromEntries(tasks.map((task, index) => [task.id, 'photo-' + index]));
    observations = { leaf: 'Leaves' };
    renderGuide();
  `);

  assert.equal(track.children.length, 10);
  assert.match(track.innerHTML, /Nature Scout Booklet/);
  assert.equal(indicator.textContent, 'Cover');
  assert.equal(prev.disabled, true);
  assert.equal(next.disabled, false);
});

test('goToGuidePage updates transform and page labels', () => {
  const app = loadApp();
  const track = app.document.getElementById('guide-track');
  const indicator = app.document.getElementById('guide-page-indicator');
  const next = app.document.getElementById('guide-next');

  app.run(`
    photos = Object.fromEntries(tasks.map((task, index) => [task.id, 'photo-' + index]));
    renderGuide();
    goToGuidePage(1, false);
  `);

  assert.equal(
    track.style.transform,
    'translateX(calc(1 * -100% - 1 * var(--guide-gap, 0.85rem)))',
  );
  assert.equal(indicator.textContent, 'Page 1 of 8');

  app.run('goToGuidePage(9, false)');
  assert.equal(indicator.textContent, 'The End');
  assert.equal(next.disabled, true);
});

test('saved progress restores from local storage on load', () => {
  const savedState = JSON.stringify({
    started: true,
    photos: {
      leaf: 'photo-0',
      stem: 'photo-1',
      seeds: 'photo-2',
      soil: 'photo-3',
      'fist-rock': 'photo-4',
      'smooth-rock': 'photo-5',
      'shiny-rock': 'photo-6',
      'bumpy-rock': 'photo-7',
    },
    observations: { leaf: 'Leaves' },
  });
  const app = loadApp({ 'nature-scout-game-state-v1': savedState });
  const startScreen = app.document.getElementById('start-screen');
  const gameContainer = app.document.getElementById('game-container');
  const guideButton = app.document.getElementById('guide-button');
  const progressPill = app.document.getElementById('progress-pills');

  assert.equal(startScreen.classList.contains('hidden'), true);
  assert.equal(gameContainer.classList.contains('hidden'), false);
  assert.equal(guideButton.classList.contains('hidden'), false);
  assert.equal(progressPill.textContent, 'Gold Scout! 🏆');
});

test('restartGame confirms before clearing saved guide and returning to start', () => {
  const app = loadApp();
  const startScreen = app.document.getElementById('start-screen');
  const gameContainer = app.document.getElementById('game-container');

  app.run(`
    startGame();
    photos = Object.fromEntries(tasks.map((task, index) => [task.id, 'photo-' + index]));
    observations = { leaf: 'Leaves' };
    renderGrid();
  `);

  assert.equal(app.storage.has('nature-scout-game-state-v1'), true);

  app.sandbox.confirm = () => false;
  app.run('restartGame()');
  assert.equal(gameContainer.classList.contains('hidden'), false);
  assert.equal(startScreen.classList.contains('hidden'), true);

  app.sandbox.confirm = () => true;
  app.run('restartGame()');
  assert.equal(gameContainer.classList.contains('hidden'), true);
  assert.equal(startScreen.classList.contains('hidden'), false);
  assert.equal(app.storage.has('nature-scout-game-state-v1'), false);
});
