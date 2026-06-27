// Service Worker for Grandpa's Ears PWA
// 缓存静态资源，支持离线访问

const CACHE_NAME = 'grandpasears-v3';
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
  self.skipWaiting();
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
    }).then(() => self.clients.claim())
  );
});

// Fetch: 网络优先，离线时再回退到缓存，避免 GitHub Pages 长时间使用旧 JS
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, copy);
      });
      return response;
    }).catch(() => {
      return caches.match(event.request);
    })
  );
});
