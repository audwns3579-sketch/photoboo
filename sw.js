/* STUDIO 042 — 오프라인 캐시.
   앱 내용을 고치고 아이패드에 반영되지 않으면 아래 CACHE 번호를 올리세요. */
const CACHE = "booth-v15";
const SHELL = ["./", "./index.html", "./app.js", "./camera-check.html", "./manifest.json", "./icon-180.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  // 폰트는 받아온 뒤 캐시에 쌓아 둡니다 (두 번째부터 오프라인 동작)
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res && res.status === 200 && (res.type === "basic" || res.type === "cors")) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => caches.match("./index.html"));
    })
  );
});
