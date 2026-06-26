// Service Worker for Grandpa's Ears PWA
// 缓存静态资源，支持离线访问

const CACHE_NAME = 'grandpasears-v2';
const ASSETS = [
  '.',
  'index.html',
  'css/style.css',
  'js/app.js',
  'js/speech.js',
  'js/ui.js',
  'js/storage.js',
  'manifest.json'
];

// Install: 预缓存所有静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch((err) => {
        // 某个资源加载失败不阻塞安装
        console.warn('SW: cache addAll partial failure', err);
      });
    })
  );
});

// Activate: 清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

// Fetch: 缓存优先策略（静态资源从缓存取，节省流量）
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});
