'use strict';
const CACHE_VERSION='twf-pwa-shell-v40-admin-session-hydration';
const STATEMENT_CACHE='twf-cached-statements-v1';
const NETWORK_TIMEOUT_MS=8000;
const STATIC_TIMEOUT_MS=6500;
async function reportNetworkState(state,detail){
 const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
 clients.forEach(client=>client.postMessage({type:'WELFARE_NETWORK_STATUS',state,detail:detail||''}));
}
async function timedFetch(request,timeout=NETWORK_TIMEOUT_MS){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),timeout);
 try{
  const response=await fetch(request,{signal:controller.signal});
  if(response&&response.ok)reportNetworkState('online');
  return response;
 }catch(error){
  reportNetworkState('slow',error&&error.name==='AbortError'?'Request timed out':'Network request failed');
  throw error;
 }finally{clearTimeout(timer);}
}
const SHELL_ASSETS=[
 './',
 './index.html',
 './school-portal.html',
 './demo-sandbox.js?v=20261121-admin-session-hydration-v11',
 './set-password.html',
 './g.html',
 './offline.html',
 './manifest.json',
 './pwa.js',
 './school-portal-workflows.js?v=20261121-admin-session-hydration-v11',
 './icons/welfare-portal.svg'
];
const CDN_ASSETS=[
 'https://cdn.tailwindcss.com',
 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css',
 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap',
 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'
];
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
   const cache=await caches.open(CACHE_VERSION);
   // Cache each same-origin shell asset independently. A single missing file
   // must not make the entire install fail on a weak mobile connection.
   await Promise.allSettled(SHELL_ASSETS.map(async path=>{
     const request=new Request(new URL(path,self.registration.scope),{cache:'reload'});
     try{
       const response=await timedFetch(request,STATIC_TIMEOUT_MS);
       if(response&&response.ok)await cache.put(request,response.clone());
     }catch(error){console.warn('[Welfare PWA] Shell asset deferred:',path,error?.message||error);}
   }));
   // CDN assets are cached on demand and never block service-worker install.
   await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
   const keys=await caches.keys();
   await Promise.all(keys.filter(key=>key.startsWith('twf-pwa-')&&key!==CACHE_VERSION&&key!==STATEMENT_CACHE).map(key=>caches.delete(key)));
   await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 const url=new URL(request.url);
 if(request.method!=='GET')return;
 if(url.origin!==self.location.origin){
   const trustedStaticHosts=['cdnjs.cloudflare.com','cdn.jsdelivr.net','cdn.tailwindcss.com','fonts.googleapis.com','fonts.gstatic.com'];
   if(!trustedStaticHosts.includes(url.hostname)||!['script','style','font','image'].includes(request.destination))return;
   event.respondWith((async()=>{
     const cache=await caches.open('twf-pwa-cdn-v1');
     const cached=await cache.match(request);
     if(cached)return cached;
     try{
       const response=await timedFetch(request,STATIC_TIMEOUT_MS);
       if(response&&(response.ok||response.type==='opaque'))cache.put(request,response.clone()).catch(()=>{});
       return response;
     }catch(_){return cached||Response.error();}
   })());
   return;
 }
 if(request.mode==='navigate'){
   event.respondWith((async()=>{
     const cache=await caches.open(CACHE_VERSION);
     try{
       const response=await timedFetch(new Request(request,{cache:'no-store'}));
       if(response&&response.ok)cache.put(request,response.clone()).catch(()=>{});
       return response;
     }catch(_){
       const exact=await cache.match(request);
       if(exact)return exact;
       const pathMatch=await cache.match(new URL(url.pathname,self.location.origin).href);
       if(pathMatch)return pathMatch;
       return (await cache.match(new URL('./offline.html',self.registration.scope).href))||Response.error();
     }
   })());
   return;
 }
 if(/\/school-portal-workflows\.js$/i.test(url.pathname)){
   event.respondWith((async()=>{
     const cache=await caches.open(CACHE_VERSION);
     try{
       const response=await timedFetch(new Request(request,{cache:'no-store'}),STATIC_TIMEOUT_MS);
       if(response&&response.ok)cache.put(request,response.clone()).catch(()=>{});
       return response;
     }catch(_){
       return (await cache.match(request))||Response.error();
     }
   })());
   return;
 }
 if(/\/pwa\.js$/i.test(url.pathname)){
   event.respondWith((async()=>{
     const cache=await caches.open(CACHE_VERSION);
     try{
       const response=await fetch(request,{cache:'no-store'});
       if(response&&response.ok)cache.put(request,response.clone()).catch(()=>{});
       return response;
     }catch(_){
       return (await cache.match(request))||Response.error();
     }
   })());
   return;
 }
 if(['script','style','image','font','manifest'].includes(request.destination)||/\.(?:js|css|svg|png|webp|ico|woff2?)$/i.test(url.pathname)){
   event.respondWith((async()=>{
     const cache=await caches.open(CACHE_VERSION);
     const cached=await cache.match(request);
     if(cached)return cached;
     try{
       const response=await timedFetch(request,STATIC_TIMEOUT_MS);
       if(response&&response.ok)cache.put(request,response.clone()).catch(()=>{});
       return response;
     }catch(_){return cached||Response.error();}
   })());
 }
});