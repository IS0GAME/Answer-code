// Answer Code Service Worker for Offline PWA Support
var CACHE_NAME = 'answer-code-v3.0';
var ASSETS = [
  './',
  './index.html',
  './admin.html',
  './seed.html',
  './css/style.css',
  './js/firebase-config.js',
  './js/app.js',
  './js/auth.js',
  './js/admin.js',
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (e) {
  // Pass through firestore API requests
  if (e.request.url.indexOf('firestore.googleapis.com') !== -1 || e.request.url.indexOf('identitytoolkit') !== -1) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function (response) {
      return response || fetch(e.request).catch(function () {
        return caches.match('./index.html');
      });
    })
  );
});
