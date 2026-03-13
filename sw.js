importScripts('content.js');

const CACHE_NAME = 'nature-scout-v4';
const RUNTIME_CACHE = 'nature-scout-runtime-v4';
const CDN_CACHE = 'nature-scout-cdn-v4';

const coreAssets = [
  './',
  'index.html',
  'styles.css',
  'script.js',
  'content.js',
  'manifest.webmanifest',
  'favicon.svg',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png',
];

const audioAssets = [
  'audio/intro.wav',
  'audio/main-instruction.wav',
  ...self.NATURE_SCOUT_CONTENT.tasks.flatMap((task) => [
    `audio/task-${task.id}-clue.wav`,
    `audio/task-${task.id}-question.wav`,
    `audio/task-${task.id}-fact.wav`,
  ]),
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([...coreAssets, ...audioAssets])),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![CACHE_NAME, RUNTIME_CACHE, CDN_CACHE].includes(key))
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
    return;
  }

  if (
    url.hostname === 'cdn.jsdelivr.net' ||
    url.hostname === 'use.fontawesome.com'
  ) {
    event.respondWith(staleWhileRevalidate(request, CDN_CACHE));
  }
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    if (request.mode === 'navigate') {
      const fallback = await caches.match('index.html');
      if (fallback) {
        return fallback;
      }
    }
    throw error;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then((response) => {
      cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);

  return cached || networkFetch;
}
