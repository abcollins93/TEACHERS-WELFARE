(function(){
 'use strict';
 var pageUrl=new URL(window.location.href);
 var params=pageUrl.searchParams;
 var schoolCode=(params.get('school')||params.get('c')||'').trim().toUpperCase();
 var tenantLaunchUrl=null;
 if(/^[A-Z0-9-]{2,32}$/.test(schoolCode)){
   tenantLaunchUrl=new URL('./school-portal.html',pageUrl);
   tenantLaunchUrl.searchParams.set('school',schoolCode);
 }else if(/(?:^|\/)g\.html$/i.test(pageUrl.pathname)){
   tenantLaunchUrl=new URL('./index.html',pageUrl);
 }else{
   tenantLaunchUrl=pageUrl;
 }
 var appScope=new URL('./',pageUrl);
 var manifest={
   id:tenantLaunchUrl.pathname+tenantLaunchUrl.search,
   name:'Teachers Welfare Portal',
   short_name:'Welfare Portal',
   description:'Teachers Welfare Fund school and member portal.',
   lang:'en-GH',
   start_url:tenantLaunchUrl.href,
   scope:appScope.href,
   display:'standalone',
   orientation:'any',
   theme_color:'#0b1d3a',
   background_color:'#071328',
   icons:[{src:new URL('./icons/welfare-portal.svg',pageUrl).href,sizes:'any',type:'image/svg+xml',purpose:'any maskable'}]
 };
 var manifestUrl=URL.createObjectURL(new Blob([JSON.stringify(manifest)],{type:'application/manifest+json'}));
 var manifestLink=document.querySelector('link[rel="manifest"]');
 if(!manifestLink){manifestLink=document.createElement('link');manifestLink.rel='manifest';document.head.appendChild(manifestLink);}
 manifestLink.href=manifestUrl;
 window.addEventListener('pagehide',function(){URL.revokeObjectURL(manifestUrl);},{once:true});
 var isSecure=location.protocol==='https:'||location.hostname==='localhost';
 if(!isSecure||!('serviceWorker' in navigator))return;
 window.addEventListener('load',function(){
   var swUrl=new URL('./sw.js',pageUrl);
   navigator.serviceWorker.register(swUrl.href,{scope:appScope.href,updateViaCache:'none'}).catch(function(error){
     console.warn('[Welfare Portal PWA] Service worker registration failed:',error);
   });
 });
 var deferredPrompt=null;
 var installButton=null;
 var isStandalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
 function addInstallButton(){
   if(installButton||isStandalone||!document.body)return;
   installButton=document.createElement('button');
   installButton.type='button';
   installButton.id='welfarePwaInstall';
   installButton.innerHTML='<span aria-hidden="true">＋</span> Install Welfare Portal';
   installButton.setAttribute('aria-label','Install Teachers Welfare Portal');
   installButton.style.cssText='position:fixed;z-index:1400;right:16px;bottom:calc(76px + env(safe-area-inset-bottom));display:flex;align-items:center;gap:8px;padding:11px 15px;border:1px solid rgba(255,230,160,.7);border-radius:999px;background:linear-gradient(135deg,#f4d98b,#c18b24);color:#0b1d3a;font:800 12px/1.2 system-ui,sans-serif;box-shadow:0 8px 24px rgba(3,10,22,.25);cursor:pointer';
   installButton.addEventListener('click',async function(){
     if(deferredPrompt){
       deferredPrompt.prompt();
       try{await deferredPrompt.userChoice;}catch(_){}
       deferredPrompt=null;
       installButton.remove();installButton=null;
     }else{
       window.alert('To install this portal, open your browser menu and choose “Add to Home screen” or “Install app”.');
     }
   });
   document.body.appendChild(installButton);
 }
 window.addEventListener('beforeinstallprompt',function(event){
   event.preventDefault();deferredPrompt=event;addInstallButton();
 });
 window.addEventListener('appinstalled',function(){
   isStandalone=true;if(installButton){installButton.remove();installButton=null;}
 });
 if(/iphone|ipad|ipod/i.test(navigator.userAgent)&&!isStandalone){
   if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addInstallButton,{once:true});
   else addInstallButton();
 }
})();