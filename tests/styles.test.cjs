const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const styles = fs.readFileSync(
  path.join(__dirname, '..', 'styles.css'),
  'utf8',
);

test('booklet shell is constrained to the visible viewport', () => {
  assert.match(
    styles,
    /\.nature-guide-shell\s*\{[\s\S]*max-height:\s*min\(94vh,\s*94dvh,\s*calc\(var\(--vh,\s*1vh\)\s*\*\s*94\)\);/,
  );
});

test('booklet pages allow internal scrolling on overflow', () => {
  assert.match(
    styles,
    /\.nature-guide-page-card\s*\{[\s\S]*overflow:\s*auto;[\s\S]*-webkit-overflow-scrolling:\s*touch;/,
  );
  assert.match(
    styles,
    /\.nature-guide-cover,\s*[\r\n\s]*\.nature-guide-finale\s*\{[\s\S]*overflow:\s*auto;[\s\S]*overscroll-behavior:\s*contain;/,
  );
});

test('booklet content area can shrink inside the modal layout', () => {
  assert.match(
    styles,
    /\.nature-guide-book\s*\{[\s\S]*flex:\s*1;[\s\S]*min-height:\s*0;/,
  );
  assert.match(
    styles,
    /\.nature-guide-page\s*\{[\s\S]*min-height:\s*0;[\s\S]*height:\s*100%;/,
  );
});
