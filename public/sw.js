// A minimal service worker to satisfy PWA installation requirements on iOS.
// This service worker properly handles fetch events, which is mandatory for installability.

const CACHE_NAME = "puls-v2";

// Install event - immediately activate
self.addEventListener("install", event => {
  console.log("Service Worker: Installing...");
  event.waitUntil(self.skipWaiting());
});

// Activate event - take control of all clients
self.addEventListener("activate", event => {
  console.log("Service Worker: Activating...");
  event.waitUntil(self.clients.claim());
});

// Fetch event - MUST properly handle requests for PWA installability
self.addEventListener("fetch", event => {
  // This is the key: we must call event.respondWith() to show the service worker
  // is actually capable of handling network requests, even if we just pass them through
  event.respondWith(
    fetch(event.request).catch(error => {
      // If network fails, we could return a cached response here
      // For now, we'll just re-throw the error
      throw error;
    })
  );
});
