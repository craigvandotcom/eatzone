// Temporarily disabled service worker for testing
// This prevents the offline page from interfering with development

console.log("Service worker disabled for testing");

// Minimal service worker that doesn't intercept requests
self.addEventListener("install", () => {
  console.log("Service worker installed (disabled)");
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  console.log("Service worker activated (disabled)");
  self.clients.claim();
});

// Don't intercept fetch requests during development
// self.addEventListener("fetch", event => {
//   // Fetch event handler disabled for testing
// });
