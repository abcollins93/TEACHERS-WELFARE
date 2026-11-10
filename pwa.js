(function(){
 'use strict';
 var pageUrl=new URL(window.location.href);
 var params=pageUrl.searchParams;
 var schoolCode=(params.get('school')||params.get('c')||params.get('code')||params.get('school_code')||'').trim().toUpperCase();
 var tenantName='';
 var manifestLink=null;
 var manifestUrl='';
 var isStandalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
 function safeTenantLabel(){
   return (tenantName||schoolCode||'School').replace(/[\\u0000-\\u001f]/g,' ').trim().slice(0,90)||'School';
 }
 function toBase64Utf8(value){
   var bytes=new TextEncoder().encode(value);
   var binary='';
   for(var i=0;i<bytes.length;i++)binary+=String.fromCharCode(bytes[i]);
   return btoa(binary);
 }
 function injectTenantManifest(){
   var label=safeTenantLabel();
   var shortLabel=('Welfare '+(schoolCode||label)).replace(/\\s+/g,' ').slice(0,20);
   var manifest={
     id:pageUrl.pathname+pageUrl.search,
     name:'Welfare - '+label,
     short_name:shortLabel,
     description:'Teachers Welfare Fund portal for '+label+'.',
     lang:'en-GH',
     start_url:window.location.href,
     scope:new URL('./',pageUrl).href,
     display:'standalone',
     orientation:'any',
     theme_color:'#0b1d3a',
     background_color:'#071328',
     icons:[{src:new URL('./icons/welfare-portal.svg',pageUrl).href,sizes:'any',type:'image/svg+xml',purpose:'any maskable'}]
   };
   var dataUri='data:application/manifest+json;base64,'+toBase64Utf8(JSON.stringify(manifest));
   if(!manifestLink){
     manifestLink=document.querySelector('link[rel="manifest"]');
     if(!manifestLink){manifestLink=document.createElement('link');manifestLink.rel='manifest';document.head.appendChild(manifestLink);}
   }
   manifestLink.href=dataUri;
   var appleTitle=document.querySelector('meta[name="apple-mobile-web-app-title"]');
   if(appleTitle)appleTitle.content=shortLabel;
   document.title='Welfare - '+label+' | Teachers Welfare Fund';
 }
 window.updateWelfarePwaTenant=function(name,code){
   if(code)schoolCode=String(code).trim().toUpperCase();
   if(name)tenantName=String(name).trim();
   injectTenantManifest();
 };
 injectTenantManifest();
 if(typeof MutationObserver!=='undefined'){
   var observeSchoolName=function(){
     var node=document.getElementById('schoolName')||document.getElementById('loginSchoolName');
     if(!node)return;
     var update=function(){
       var value=(node.textContent||'').trim();
       if(value&&value!=='School gateway unavailable'&&value!=='Loading...'){
         tenantName=value;
         injectTenantManifest();
       }
     };
     update();
     new MutationObserver(update).observe(node,{childList:true,characterData:true,subtree:true});
   };
   if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observeSchoolName,{once:true});
   else observeSchoolName();
 }
 var isSecure=location.protocol==='https:'||location.hostname==='localhost';
 if(isSecure&&'serviceWorker' in navigator){
   window.addEventListener('load',function(){
     var swUrl=new URL('./sw.js',pageUrl);
     var appScope=new URL('./',pageUrl);
     navigator.serviceWorker.register(swUrl.href,{scope:appScope.href,updateViaCache:'none'}).catch(function(error){
       console.warn('[Welfare Portal PWA] Service worker registration failed:',error);
     });
   });
 }
 var deferredPrompt=null;
 var installButton=null;
 function addInstallButton(){
   if(installButton||isStandalone||!document.body)return;
   installButton=document.createElement('button');
   installButton.type='button';
   installButton.id='welfarePwaInstall';
   installButton.innerHTML='<span aria-hidden="true">＋</span> Install '+safeTenantLabel()+' Portal';
   installButton.setAttribute('aria-label','Install Welfare Portal for '+safeTenantLabel());
   installButton.style.cssText='position:fixed;z-index:1400;right:16px;bottom:calc(76px + env(safe-area-inset-bottom));display:flex;align-items:center;gap:8px;padding:11px 15px;border:1px solid rgba(255,230,160,.7);border-radius:999px;background:linear-gradient(135deg,#f4d98b,#c18b24);color:#0b1d3a;font:800 12px/1.2 system-ui,sans-serif;box-shadow:0 8px 24px rgba(3,10,22,.25);cursor:pointer';
   installButton.addEventListener('click',async function(){
     if(deferredPrompt){
       deferredPrompt.prompt();
       try{await deferredPrompt.userChoice;}catch(_){}
       deferredPrompt=null;
       if(installButton){installButton.remove();installButton=null;}
     }else{
       window.alert('To install this school portal, open your browser menu and choose “Add to Home screen” or “Install app”.');
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