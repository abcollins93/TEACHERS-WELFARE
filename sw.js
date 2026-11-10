'use strict';
const CACHE_VERSION='twf-pwa-shell-v4';
const SHELL_ASSETS=[
 './',
 './index.html',
 './school-portal.html',
 './set-password.html',
 './g.html',
 './offline.html',
 './manifest.json',
 './pwa.js',
 './school-portal-workflows.js',
 './icons/welfare-portal.svg'
];
const CDN_ASSETS=[
 'https://cdn.tailwindcss.com',
 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css',
 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap',
 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'
];
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
   const cache=await caches.open(CACHE_VERSION);
   await cache.addAll(SHELL_ASSETS.map(path=>new Request(new URL(path,self.registration.scope),{cache:'reload'})));
   const cdnCache=await caches.open('twf-pwa-cdn-v1');
   await Promise.allSettled(CDN_ASSETS.map(async url=>{
     const request=new Request(url,{mode:'no-cors'});
     const controller=new AbortController();
     const timeout=setTimeout(()=>controller.abort(),4000);
     try{
       const response=await fetch(request,{signal:controller.signal});
       if(response&&(response.ok||response.type==='opaque'))await cdnCache.put(request,response);
     }finally{clearTimeout(timeout);}
   }));
   await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
   const keys=await caches.keys();
   await Promise.all(keys.filter(key=>key.startsWith('twf-pwa-')&&key!==CACHE_VERSION).map(key=>caches.delete(key)));
   await self.clients.claim();
 })());
});
function isSensitiveRequest(url){
 return /\/auth\/v1\/|\/rest\/v1\/|\/functions\/v1\/|\/storage\/v1\//i.test(url.pathname);
}
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin){
   const trustedStaticHosts=['cdnjs.cloudflare.com','cdn.jsdelivr.net','cdn.tailwindcss.com','fonts.googleapis.com','fonts.gstatic.com'];
   if(!trustedStaticHosts.includes(url.hostname)||!['script','style','font','image'].includes(request.destination))return;
   event.respondWith((async()=>{
     const cache=await caches.open('twf-pwa-cdn-v1');
     const cached=await cache.match(request);
     if(cached)return cached;
     try{
       const response=await fetch(request);
       if(response&&(response.ok||response.type==='opaque'))cache.put(request,response.clone()).catch(()=>{});
       return response;
     }catch(_){return cached||Response.error();}
   })());
   return;
 }
 if(isSensitiveRequest(url))return;
 if(request.mode==='navigate'){
   event.respondWith((async()=>{
     const cache=await caches.open(CACHE_VERSION);
     try{
       const response=await fetch(request);
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
       const response=await fetch(request);
       if(response&&response.ok)cache.put(request,response.clone()).catch(()=>{});
       return response;
     }catch(_){return cached||Response.error();}
   })());
 }
});