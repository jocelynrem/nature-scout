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
