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
   return (tenantName||schoolCode||'School').replace(/[\x00-\x1F\x7F]/g,' ').replace(/\s+/g,' ').trim()||'School';
 }
 function toBase64Utf8(value){
   var bytes=new TextEncoder().encode(value);
   var binary='';
   for(var i=0;i<bytes.length;i++)binary+=String.fromCharCode(bytes[i]);
   return btoa(binary);
 }
 function injectTenantManifest(){
   var label=safeTenantLabel();
   var shortLabel='Welfare';
   var manifest={
     id:window.location.href,
     name:'Welfare Portal',
     short_name:shortLabel,
     description:'School welfare portal for '+label+'.',
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
   document.title=label+' | Welfare Portal';
 }
 window.updateWelfarePwaTenant=function(name,code){
   if(code)schoolCode=String(code).trim().toUpperCase();
   if(name)tenantName=String(name).trim();
   injectTenantManifest();
 };
 injectTenantManifest();
 if(typeof MutationObserver!=='undefined'){
   var observeSchoolIdentity=function(){
     ['schoolName','loginSchoolName'].forEach(function(id){
       var node=document.getElementById(id);
       if(!node)return;
       var update=function(){
         var value=(node.textContent||'').trim();
         if(value&&value!=='School gateway unavailable'&&value!=='Loading...'){
           tenantName=value;
           injectTenantManifest();
           var labelNode=installButton&&installButton.querySelector('.welfare-pwa-install-label');
           if(labelNode){
             var buttonLabel='Install '+safeTenantLabel()+' Portal';
             labelNode.textContent=buttonLabel;
             installButton.setAttribute('aria-label',buttonLabel);
           }
         }
       };
       update();
       new MutationObserver(update).observe(node,{childList:true,characterData:true,subtree:true});
     });
   };
   if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observeSchoolIdentity,{once:true});
   else observeSchoolIdentity();
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
   installButton.style.cssText='position:relative;z-index:2;display:inline-flex;align-items:center;justify-content:center;flex:0 1 auto;gap:9px;box-sizing:border-box;width:fit-content;max-width:calc(100% - 24px);min-width:0;margin:14px 0 20px;padding:12px 18px;border:1px solid rgba(255,230,160,.78);border-radius:14px;background:linear-gradient(135deg,#f4d98b,#c18b24);color:#0b1d3a;font:800 13px/1.4 system-ui,sans-serif;white-space:normal;overflow-wrap:anywhere;word-break:normal;text-align:center;box-shadow:0 8px 24px rgba(3,10,22,.16);cursor:pointer';
   var installIcon=document.createElement('span');
   installIcon.setAttribute('aria-hidden','true');
   installIcon.textContent='＋';
   installIcon.style.cssText='flex:0 0 auto;font-size:18px;line-height:1';
   var installLabel=document.createElement('span');
   installLabel.className='welfare-pwa-install-label';
   installLabel.style.cssText='min-width:0;white-space:normal;overflow-wrap:anywhere';
   installButton.appendChild(installIcon);
   installButton.appendChild(installLabel);
   function refreshInstallButtonLabel(){
     var label='Install '+safeTenantLabel()+' Portal';
     installLabel.textContent=label;
     installButton.setAttribute('aria-label',label);
   }
   refreshInstallButtonLabel();
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
   var hero=document.querySelector('#schoolOverview .portal-hero');
   var loginPanel=document.getElementById('login');
   if(hero&&hero.parentNode){
     hero.insertAdjacentElement('afterend',installButton);
     installButton.style.display='none';
     var dashboard=document.getElementById('dashboard');
     if(dashboard&&!dashboard.classList.contains('hidden'))installButton.style.display='inline-flex';
     if(dashboard){
       new MutationObserver(function(){
         installButton.style.display=dashboard.classList.contains('hidden')?'none':'inline-flex';
       }).observe(dashboard,{attributes:true,attributeFilter:['class']});
     }
   }else if(loginPanel&&loginPanel.parentNode){
     loginPanel.insertAdjacentElement('afterend',installButton);
   }else{
     document.body.appendChild(installButton);
   }
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