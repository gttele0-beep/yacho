// 野帳:電波のない現場でも開けるように、アプリ本体をiPadに保存しておく
const VER = '20261123155646';
const CACHE = 'yacho-' + VER;
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png', './icon-512-mask.png'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('yacho-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// 本体は「つながれば新しいもの、だめなら保存してあるもの」。それ以外は保存してあるものを先に
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const isPage = req.mode === 'navigate' || /\/(index\.html)?$/.test(new URL(req.url).pathname);
  if (isPage) {
    e.respondWith((async () => {
      const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 4000);
      try {
        const res = await fetch(req, { signal: ctl.signal, cache: 'no-cache' }); clearTimeout(tm);
        if (res.ok) { const c = await caches.open(CACHE); c.put('./index.html', res.clone()); }
        return res;
      } catch (err) {
        clearTimeout(tm);
        return (await caches.match('./index.html')) || (await caches.match('./')) || Response.error();
      }
    })());
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
