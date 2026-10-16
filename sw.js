const V='wardrobe-v105',MEDIA='wd-media',DEMO=["demo/chinos-beige.webp", "demo/coat-trench.webp", "demo/coat-wool.webp", "demo/hoodie-black-zip.webp", "demo/hoodie-grey.webp", "demo/jacket-black-highneck.webp", "demo/jacket-bomber.webp", "demo/jacket-denim-black.webp", "demo/jacket-denim.webp", "demo/jacket-rain.webp", "demo/jacket-suede-beige.webp", "demo/jeans-black-flare.webp", "demo/jeans-black-wide.webp", "demo/jeans-black.webp", "demo/jeans-blue.webp", "demo/jeans-lightblue-flare.webp", "demo/loafers-brown.webp", "demo/longsleeve-striped.webp", "demo/polo-black.webp", "demo/polo-white.webp", "demo/puffer-black.webp", "demo/puffer-white.webp", "demo/shirt-blue.webp", "demo/shirt-white.webp", "demo/shorts-denim.webp", "demo/sneakers-black.webp", "demo/sneakers-gat-black.webp", "demo/sneakers-gat-white.webp", "demo/sneakers-white.webp", "demo/sweater-beige.webp", "demo/sweater-black-cable.webp", "demo/sweater-black-quarter.webp", "demo/sweater-grey-cable.webp", "demo/sweater-navy.webp", "demo/sweater-pink-cable.webp", "demo/sweater-white-cable.webp", "demo/sweatpants-grey.webp", "demo/tee-black.webp", "demo/tee-grey.webp", "demo/tee-white.webp", "demo/trousers-black.webp", "demo/jordan-puffer-black.webp", "demo/palace-puffer-black.webp", "demo/bape-tee-white.webp", "demo/balenciaga-fortnite-tee.webp", "demo/polo-usa-zip-hoodie-grey.webp", "demo/mastermind-hoodie-black.webp", "demo/mastermind-hoodie-pink.webp", "demo/supreme-waffle-sweater-cream.webp", "demo/supreme-waffle-sweater-black.webp", "demo/saint-laurent-mohair-sweater.webp", "demo/supreme-blur-sweater.webp", "demo/supreme-zip-hoodie-black.webp", "demo/supreme-zip-hoodie-grey.webp", "demo/supreme-zip-hoodie-washed-black.webp"],SHELL=['./','index.html','i18n.js','social.js','editor.js','chat.js','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','tab.mp3'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL).then(()=>Promise.all(DEMO.map(u=>c.add(u).catch(()=>{}))))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V&&x!==MEDIA).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 const r=e.request,u=new URL(r.url);
 // chat photos / video posters / avatars never change for a given URL: keep them on the device so they never reload
 if(r.method==='GET'&&u.origin===location.origin&&((u.pathname==='/api/dm'&&/[?&]a=(mimg|mposter)(&|$)/.test(u.search))||(u.pathname==='/api/social'&&/[?&]a=avatar(&|$)/.test(u.search)&&/[?&]v=/.test(u.search)))){
  e.respondWith(caches.open(MEDIA).then(c=>c.match(r).then(m=>m||fetch(r).then(x=>{if(x.ok&&x.status===200)c.put(r,x.clone()).catch(()=>{});return x}))));return}
 if(r.method!=='GET'||u.origin!==location.origin||u.pathname.startsWith('/api/'))return; // never cache API responses (private, per-user data) // weather/geocoding API: always network, app handles errors
 if(r.mode==='navigate'){e.respondWith(fetch(r).then(x=>{const c=x.clone();caches.open(V).then(h=>h.put('index.html',c));return x}).catch(()=>caches.match('index.html')));return}
 e.respondWith(caches.match(r).then(m=>m||fetch(r).then(x=>{const c=x.clone();caches.open(V).then(h=>h.put(r,c));return x})));
});

// ---- message notifications (Web Push)
const TXT={ru:{img:'📷 Фото',vid:'🎥 Видео',msg:'Новое сообщение'},uk:{img:'📷 Фото',vid:'🎥 Відео',msg:'Нове повідомлення'},en:{img:'📷 Photo',vid:'🎥 Video',msg:'New message'}};
self.addEventListener('push',e=>{
 let d={};try{d=e.data.json()}catch(_){}
 const L=TXT[String(self.navigator&&self.navigator.language||'ru').slice(0,2)]||TXT.ru;
 const body=d.kind==='img'||d.kind==='vid'?L[d.kind]+(d.text?': '+d.text:''):(d.text||L.msg);
 e.waitUntil(self.registration.showNotification(d.name||'Driply',{body,tag:'dm-'+(d.cid||d.nick||'x'),renotify:true,icon:'icons/icon-192.png',badge:'icons/icon-192.png',data:{nick:d.nick||''}}));
});
self.addEventListener('pushsubscriptionchange',e=>{ // the browser rotated the subscription: renew and tell the server
 e.waitUntil((async()=>{try{const o=e.oldSubscription&&e.oldSubscription.options;const sub=e.newSubscription||await self.registration.pushManager.subscribe(o||{userVisibleOnly:true});
  await fetch('/api/dm',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-Requested-With':'wd'},body:JSON.stringify({op:'push',sub:sub.toJSON()})})}catch(_){}})());
});
self.addEventListener('notificationclick',e=>{
 e.notification.close();const nick=(e.notification.data&&e.notification.data.nick)||'';
 e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{
  const c=cs.find(x=>'focus'in x);
  if(c){c.postMessage({type:'open-chat',nick});return c.focus()}
  return self.clients.openWindow('./?chat='+encodeURIComponent(nick));
 }));
});
