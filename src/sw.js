// src/sw.js
console.log('Custom Service Worker loaded');

// 必须添加这行代码，用于 Workbox 注入预缓存清单
const precacheManifest = self.__WB_MANIFEST;

self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  // 可选：使用预缓存清单
  event.waitUntil(
    caches.open('my-cache-v1')
      .then(cache => cache.addAll(precacheManifest.map(item => item.url)))
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
});

self.addEventListener('fetch', (event) => {
  console.log('Fetching:', event.request.url);
});