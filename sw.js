'use strict';
const CACHE_VERSION='twf-pwa-shell-v1';
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
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
   const cache=await caches.open(CACHE_VERSION);
   await cache.addAll(SHELL_ASSETS.map(path=>new Request(new URL(path,self.registration.scope),{cache:'reload'})));
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
 if(url.origin!==self.location.origin||isSensitiveRequest(url))return;
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