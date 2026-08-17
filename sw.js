const CACHE_NAME = 'hrtv-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://i.postimg.cc/bwH0G8w5/file-00000000f86c81fabc31858ba0521022.png'
];

// ১. Install Event: অ্যাপের মূল ফাইল ও লোগো ক্যাশ করা
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.log('Cache add error:', err);
      });
    })
  );
});

// ২. Activate Event: পুরানো ভার্সনের ক্যাশ স্বয়ংক্রিয়ভাবে মুছে ফেলা
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => clients.claim())
  );
});

// ৩. Fetch Event: লাইভ স্ট্রিম এবং Firebase বাদ দিয়ে শুধু মূল ফাইল স্মুথভাবে লোড করা
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // লাইভ স্ট্রিম (.m3u8, .ts), Firebase ও অ্যাড নেটওয়ার্ককে ক্যাশ করা থেকে বাদ রাখা
  if (
    event.request.method !== 'GET' ||
    url.includes('firebaseio.com') ||
    url.includes('.m3u8') ||
    url.includes('.ts') ||
    url.includes('googleapis.com') ||
    url.includes('google-analytics')
  ) {
    return; // সরাসরি ইন্টারনেট থেকে যাবে
  }

  // Network First Strategy (সবার আগে লাইভ ডেটা আনবে, নেটওয়ার্ক না থাকলে ক্যাশ ফাইল দেখাবে)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});
