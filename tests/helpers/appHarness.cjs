const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class FakeStyle {
  constructor() {
    this.values = {};
  }

  setProperty(name, value) {
    this.values[name] = value;
  }

  getPropertyValue(name) {
    return this.values[name] || '';
  }
}

class FakeClassList {
  constructor(element) {
    this.element = element;
    this.classes = new Set();
  }

  add(...names) {
    names.forEach((name) => this.classes.add(name));
    this.#sync();
  }

  remove(...names) {
    names.forEach((name) => this.classes.delete(name));
    this.#sync();
  }

  contains(name) {
    return this.classes.has(name);
  }

  toggle(name, force) {
    if (force === true) {
      this.classes.add(name);
    } else if (force === false) {
      this.classes.delete(name);
    } else if (this.classes.has(name)) {
      this.classes.delete(name);
    } else {
      this.classes.add(name);
    }
    this.#sync();
    return this.classes.has(name);
  }

  setFromString(value) {
    this.classes = new Set(String(value || '').split(/\s+/).filter(Boolean));
    this.#sync();
  }

  toString() {
    return Array.from(this.classes).join(' ');
  }

  #sync() {
    this.element.className = this.toString();
  }
}

class FakeElement {
  constructor(tagName, ownerDocument) {
    this.tagName = tagName.toUpperCase();
    this.ownerDocument = ownerDocument;
    this.children = [];
    this.parentNode = null;
    this.dataset = {};
    this.style = new FakeStyle();
    this.classList = new FakeClassList(this);
    this.className = '';
    this.eventListeners = {};
    this.attributes = {};
    this._id = '';
    this._textContent = '';
    this._innerHTML = '';
    this.disabled = false;
  }

  set id(value) {
    this._id = value;
    if (value) {
      this.ownerDocument.elementsById.set(value, this);
    }
  }

  get id() {
    return this._id;
  }

  set textContent(value) {
    this._textContent = String(value);
    this._innerHTML = '';
    this.children = [];
  }

  get textContent() {
    return this._textContent;
  }

  set innerHTML(value) {
    this._innerHTML = String(value);
    this._textContent = this._innerHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const articleCount = (this._innerHTML.match(/<article\b/gi) || []).length;
    this.children = [];
    for (let index = 0; index < articleCount; index += 1) {
      const child = new FakeElement('article', this.ownerDocument);
      child.parentNode = this;
      this.children.push(child);
    }
  }

  get innerHTML() {
    return this._innerHTML;
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  addEventListener(type, listener) {
    if (!this.eventListeners[type]) {
      this.eventListeners[type] = [];
    }
    this.eventListeners[type].push(listener);
  }

  dispatchEvent(type, eventObject = {}) {
    const listeners = this.eventListeners[type] || [];
    listeners.forEach((listener) => listener(eventObject));
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name === 'id') {
      this.id = value;
    }
    if (name === 'class') {
      this.classList.setFromString(value);
    }
  }
}

class FakeDocument {
  constructor() {
    this.elementsById = new Map();
    this.documentElement = new FakeElement('html', this);
    this.documentElement.style = new FakeStyle();
    this.body = new FakeElement('body', this);
  }

  createElement(tagName) {
    return new FakeElement(tagName, this);
  }

  getElementById(id) {
    return this.elementsById.get(id) || null;
  }
}

function createBaseDom(document) {
  [
    ['div', 'start-screen'],
    ['div', 'game-container'],
    ['div', 'photo-grid'],
    ['div', 'progress-pills'],
    ['button', 'guide-button'],
    ['div', 'guide-modal'],
    ['div', 'guide-book'],
    ['div', 'guide-track'],
    ['button', 'guide-prev'],
    ['button', 'guide-next'],
    ['div', 'guide-page-indicator'],
  ].forEach(([tagName, id]) => {
    const element = document.createElement(tagName);
    element.id = id;
    if (id === 'guide-modal' || id === 'game-container' || id === 'guide-button') {
      element.classList.add('hidden');
    }
  });
}

function loadApp() {
  const rootDir = path.resolve(__dirname, '..', '..');
  const document = new FakeDocument();
  createBaseDom(document);

  const windowListeners = {};
  const visualViewportListeners = {};
  const audioEvents = {};

  function addWindowListener(type, listener) {
    if (!windowListeners[type]) {
      windowListeners[type] = [];
    }
    windowListeners[type].push(listener);
  }

  const sandbox = {
    console,
    module: { exports: {} },
    exports: {},
    setTimeout,
    clearTimeout,
    document,
    navigator: {},
    alert: () => {},
    Audio: class FakeAudio {
      constructor(src) {
        this.src = src;
        this.currentTime = 0;
      }

      addEventListener(type, listener) {
        audioEvents[type] = listener;
      }

      play() {
        if (audioEvents.playing) {
          audioEvents.playing();
        }
        return Promise.resolve();
      }

      pause() {}
    },
  };

  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.window.innerHeight = 900;
  sandbox.window.visualViewport = {
    height: 700,
    addEventListener(type, listener) {
      visualViewportListeners[type] = listener;
    },
  };
  sandbox.window.addEventListener = addWindowListener;

  vm.createContext(sandbox);
  vm.runInContext(
    fs.readFileSync(path.join(rootDir, 'content.js'), 'utf8'),
    sandbox,
    { filename: 'content.js' },
  );
  vm.runInContext(
    fs.readFileSync(path.join(rootDir, 'script.js'), 'utf8'),
    sandbox,
    { filename: 'script.js' },
  );

  return {
    sandbox,
    document,
    windowListeners,
    visualViewportListeners,
    run(code) {
      return vm.runInContext(code, sandbox);
    },
  };
}

module.exports = {
  loadApp,
};
