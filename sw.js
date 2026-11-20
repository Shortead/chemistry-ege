"use strict";

const scope = new URL(self.registration.scope);
const index = new URL("index.html", scope);
const cachePrefix = "ege-chemistry:" + scope.pathname + ":";
const cacheName = cachePrefix + "1";

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    await cache.add(new Request(index, { cache: "reload" }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(cachePrefix) && name !== cacheName)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  if (event.request.mode !== "navigate") return;
  const url = new URL(event.request.url);
  if (url.origin !== scope.origin || (url.pathname !== scope.pathname && url.pathname !== index.pathname)) return;

  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    const response = await fetch(event.request).catch(() => null);
    if (response?.ok) {
      await cache.put(index, response.clone()).catch(() => {});
      return response;
    }
    return (await cache.match(index)) || response || Response.error();
  })());
});
