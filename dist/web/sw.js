// src/sw.js

// Define the unique name and version for the current cache. Increment this 
// to trigger the Service Worker 'activate' event and refresh all assets.
const CACHE_NAME = 'tictactoe-v1';

// All assets required for the application to run offline MUST be listed here.
const ASSETS_TO_CACHE = [
    '/', // Required to handle the root path (index.html)
    'index.html',
    // The main JS bundle output by the build process.
    'app.bundle.js', 
    'css/styles.css',
    
    // --- Application Icons (For PWA installation) ---
    'assets/icons/icon-192x192.png',
    'assets/icons/icon-512x512.png',
    'assets/icons/maskable_icon.png',
    
    // --- Audio Assets (Ensure all game sounds are available offline) ---
    'assets/sounds/move.mp3',
    'assets/sounds/win.mp3',
    'assets/sounds/draw.mp3',
    'assets/sounds/loss.mp3',
    'assets/sounds/ai_start.mp3' 
];

// 1. Install Event: Pre-caches all critical application assets.
self.addEventListener('install', (event) => {
    // Ensures the Service Worker won't install until all assets are successfully cached.
    event.waitUntil(
        caches.open(CACHE_NAME)
              .then((cache) => {
                  console.log('Service Worker: Successfully opened cache and pre-caching essential assets.');
                  return cache.addAll(ASSETS_TO_CACHE);
              })
              .catch(err => console.error('Service Worker: Caching failed during install:', err))
    );
});

// 2. Fetch Event: Intercepts all network requests and applies the Cache-First strategy.
self.addEventListener('fetch', (event) => {
    // Respond with a Promise that resolves to the asset.
    event.respondWith(
        caches.match(event.request)
              .then((response) => {
                  // If the asset is found in the cache, return it immediately (Cache-First).
                  if (response) {
                      return response;
                  }
                  // If no cache match, fetch the asset from the network.
                  return fetch(event.request);
              })
              // Note: Add .catch() here if a fallback (e.g., an offline page) is needed.
    );
});

// 3. Activate Event: Clears out all old caches that do not match the current CACHE_NAME.
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Check if the cache name is NOT in the whitelist (i.e., it's an old version).
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName); 
                    }
                })
            );
        })
    );
});