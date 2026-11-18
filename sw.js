/* Ministerio Teocrático PWA v10.3 */
const CACHE_NAME = 'ministerio-teocratico-v10-3';
const APP_SHELL = ['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./favicon-32.png','./Idiomas/es.xml','./Idiomas/en.xml'];
self.addEventListener('install', event => event.waitUntil((async()=>{
  const cache=await caches.open(CACHE_NAME);
  await Promise.all(APP_SHELL.map(async path=>{try{const r=await fetch(new Request(new URL(path,self.registration.scope),{cache:'reload'}));if(r.ok)await cache.put(new URL(path,self.registration.scope),r)}catch(_){}}));
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const keys=await caches.keys(); await Promise.all(keys.filter(k=>k.startsWith('ministerio-teocratico-')&&k!==CACHE_NAME).map(k=>caches.delete(k)));
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==self.location.origin)return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME),cached=await cache.match(req,{ignoreSearch:req.mode==='navigate'});
    if(cached){if(req.mode==='navigate')event.waitUntil(fetch(req).then(r=>{if(r.ok)cache.put(req,r.clone())}).catch(()=>{}));return cached}
    try{const r=await fetch(req);if(r.ok&&r.type==='basic')await cache.put(req,r.clone());return r}
    catch(_){if(req.mode==='navigate')return (await cache.match(new URL('./index.html',self.registration.scope)))||new Response('Abre la aplicación una vez con Internet para prepararla sin conexión.',{status:503});return new Response('',{status:504})}
  })());
});
self.addEventListener('message',event=>{
  const d=event.data||{};
  if(d.type==='SHOW_NOTIFICATION' && d.title){
    event.waitUntil(self.registration.showNotification(d.title,{body:d.body||'',icon:'./icon-192.png',badge:'./icon-192.png',tag:d.tag||'ministerio-'+Date.now(),renotify:false,data:{url:'./index.html'}}));
  }
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();event.waitUntil((async()=>{const all=await clients.matchAll({type:'window',includeUncontrolled:true});for(const c of all){if('focus'in c){await c.focus();return}}if(clients.openWindow)await clients.openWindow('./index.html')})());
});
