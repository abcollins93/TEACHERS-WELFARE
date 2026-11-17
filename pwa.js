function showPwaInstallNotice(tenantLabel){
 var schoolLabel=String(tenantLabel||'School').trim()||'School';
 var safeLabel=schoolLabel.replace(/[&<>"']/g,'');
 var id='pwaInstallNoticeModal',root=document.getElementById(id);
 if(!root){
  var style=document.createElement('style');style.textContent='#'+id+'{position:fixed;inset:0;z-index:15000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(2,8,23,.76);backdrop-filter:blur(7px)}#'+id+'[hidden]{display:none!important}#'+id+' .pwa-notice-card{width:min(100%,440px);padding:23px;border:1px solid #334155;border-radius:18px;background:linear-gradient(145deg,#10213b,#081426);color:#f1f5f9;box-shadow:0 25px 70px rgba(0,0,0,.5)}#'+id+' h2{margin:0 0 10px;color:#fff;font-size:1.15rem}#'+id+' p{margin:0;color:#c1ccdc;line-height:1.65}#'+id+' button{display:block;margin:20px 0 0 auto;min-height:42px;padding:9px 18px;border:1px solid #d6a637;border-radius:10px;background:linear-gradient(110deg,#f0c65d,#d6a637);color:#172033;font-weight:800}';
  document.head.appendChild(style);root=document.createElement('div');root.id=id;root.hidden=true;root.innerHTML='<section class="pwa-notice-card" role="dialog" aria-modal="true" aria-labelledby="pwaInstallNoticeTitle"><h2 id="pwaInstallNoticeTitle">Install '+safeLabel+' Welfare</h2><p>To install '+safeLabel+' Welfare, open your browser menu and choose “Add to Home screen” or “Install app”. The shortcut will open this school gateway.</p><button type="button">OK</button></section>';document.body.appendChild(root);
 }
 root.hidden=false;var button=root.querySelector('button'),prior=document.activeElement;
 var close=function(){root.hidden=true;button.removeEventListener('click',close);document.removeEventListener('keydown',key,true);if(prior&&prior.focus)prior.focus({preventScroll:true});};
 var key=function(e){if(e.key==='Escape'||e.key==='Enter'){e.preventDefault();close();}};
 button.addEventListener('click',close);document.addEventListener('keydown',key,true);button.focus();
}

(function(){
 'use strict';
 var pageUrl=new URL(window.location.href);
 var params=pageUrl.searchParams;
 var hashParams=new URLSearchParams(pageUrl.hash.replace(/^#/,''));
 var storedCode='';
 try{storedCode=sessionStorage.getItem('invited_school_code')||localStorage.getItem('invited_school_code')||sessionStorage.getItem('active_tenant_code')||localStorage.getItem('active_tenant_code')||'';}catch(_){}
 var schoolCode=(params.get('c')||params.get('school_code')||params.get('tenant')||params.get('school')||params.get('code')||
   hashParams.get('c')||hashParams.get('school_code')||hashParams.get('tenant')||hashParams.get('school')||storedCode||'').trim().toUpperCase();
 var tenantName='';
 try{tenantName=sessionStorage.getItem('active_tenant_name')||localStorage.getItem('active_tenant_name')||sessionStorage.getItem('invited_school_name')||localStorage.getItem('invited_school_name')||'';}catch(_){}
 function persistTenantName(value){
   var normalized=String(value||'').replace(/[\x00-\x1F\x7F]/g,' ').replace(/\s+/g,' ').trim();
   if(!normalized)return '';
   tenantName=normalized;
   try{localStorage.setItem('active_tenant_name',normalized);localStorage.setItem('invited_school_name',normalized);}catch(_){}
   try{sessionStorage.setItem('active_tenant_name',normalized);sessionStorage.setItem('invited_school_name',normalized);}catch(_){}
   return normalized;
 }
 function persistSchoolCode(value){
   var normalized=String(value||'').trim().toUpperCase();
   if(!/^[A-Z0-9-]{2,32}$/.test(normalized))return '';
   schoolCode=normalized;
   try{localStorage.setItem('invited_school_code',normalized);localStorage.setItem('active_tenant_code',normalized);}catch(_){}
   try{sessionStorage.setItem('invited_school_code',normalized);sessionStorage.setItem('active_tenant_code',normalized);}catch(_){}
   return normalized;
 }
 if(schoolCode)persistSchoolCode(schoolCode);
 var manifestLink=null;
 var manifestUrl='';
 function displayModeInstalled(){return window.matchMedia('(display-mode: standalone)').matches||window.matchMedia('(display-mode: fullscreen)').matches||window.navigator.standalone===true;}
 var isStandalone=displayModeInstalled();
 var isInstalled=isStandalone;
 var appInstalledThisSession=false;
 function clearStaleInstalledFlag(){try{localStorage.removeItem('welfare_app_installed');}catch(_){}}
 function hideInstallButton(){if(installButton){installButton.style.setProperty('display','none','important');installButton.setAttribute('aria-hidden','true');installButton.disabled=true;}}
 function showInstallButton(){if(installButton&&!isInstalled&&!displayModeInstalled()){installButton.style.removeProperty('display');installButton.setAttribute('aria-hidden','false');installButton.disabled=false;}}
 function markInstalled(fromAppInstalledEvent){isInstalled=true;isStandalone=displayModeInstalled();if(fromAppInstalledEvent)appInstalledThisSession=true;clearStaleInstalledFlag();hideInstallButton();}
 function detectRelatedInstalledApps(){
   if(displayModeInstalled()){markInstalled(false);return;}
   if(typeof navigator.getInstalledRelatedApps!=='function'){
     clearStaleInstalledFlag();
     if(!appInstalledThisSession){isInstalled=false;showInstallButton();}
     return;
   }
   Promise.resolve().then(function(){return navigator.getInstalledRelatedApps();}).then(function(apps){
     if(Array.isArray(apps)&&apps.length){markInstalled(false);return;}
     clearStaleInstalledFlag();
     if(!displayModeInstalled()&&!appInstalledThisSession){isInstalled=false;isStandalone=false;showInstallButton();}
   }).catch(function(){
     clearStaleInstalledFlag();
     if(!displayModeInstalled()&&!appInstalledThisSession){isInstalled=false;isStandalone=false;showInstallButton();}
   });
 }
 detectRelatedInstalledApps();
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
   var appScope=new URL('./',pageUrl).href;
   var launchUrl=new URL('./g.html',pageUrl);
   if(schoolCode)launchUrl.searchParams.set('c',schoolCode);
   var manifest={
     id:launchUrl.href,
     name:'Welfare',
     short_name:'Welfare',
     description:'School welfare portal for '+label+'.',
     lang:'en-GH',
     start_url:launchUrl.href,
     scope:new URL('/TEACHERS-WELFARE/',pageUrl.origin).href,
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
   if(new URLSearchParams(location.search).get('c')?.trim().toUpperCase()==='DEMO')return;
   if(code)persistSchoolCode(code);
   if(name)persistTenantName(name);
   injectTenantManifest();
   if(installButton){
     if(isInstalled){hideInstallButton();return;}
     var label='Install '+safeTenantLabel()+' Portal';
     var labelNode=installButton.querySelector('.welfare-pwa-install-label');
     if(labelNode)labelNode.textContent=label;
     installButton.setAttribute('aria-label',label);
   }
 };
 injectTenantManifest();
 if(typeof MutationObserver!=='undefined'){
   var observeSchoolIdentity=function(){
     ['schoolName','loginSchoolName'].forEach(function(id){
       var node=document.getElementById(id);
       if(!node)return;
       var update=function(){
         if(new URLSearchParams(location.search).get('c')?.trim().toUpperCase()==='DEMO')return;
         var value=(node.textContent||'').trim();
         if(value&&value!=='School gateway unavailable'&&value!=='Loading...'){
           persistTenantName(value);
           injectTenantManifest();
           var labelNode=installButton&&installButton.querySelector('.welfare-pwa-install-label');
           if(labelNode&&!isInstalled){
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
   if(installButton||!document.body||isInstalled||displayModeInstalled())return;
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
     installIcon.textContent='＋';
     installButton.setAttribute('aria-label',label);
   }
   refreshInstallButtonLabel();
   installButton.addEventListener('click',async function(){
     if(deferredPrompt&&!isStandalone){
       try{
         await deferredPrompt.prompt();
         var choiceResult=await deferredPrompt.userChoice;
         if(choiceResult&&choiceResult.outcome==='accepted')markInstalled(true);
       }catch(_){}
       deferredPrompt=null;
       if(!isInstalled)showInstallButton();
     }else{
       var instructions='To install '+safeTenantLabel()+' Welfare, open your browser menu and choose “Install app” or “Add to Home screen”. The installed shortcut will open this school gateway.';
       if(isStandalone)instructions=safeTenantLabel()+' Welfare is already installed. Open it from your device home screen to return to this school portal.';
       if(window.showWelfareDialog){window.showWelfareDialog('alert',instructions,'Install '+safeTenantLabel()+' Welfare');}else{showPwaInstallNotice(safeTenantLabel());}
     }
   });
   // Append after all gateway/sign-in content so it remains at the bottom in normal document flow.
   document.body.appendChild(installButton);
 }
 window.addEventListener('beforeinstallprompt',function(event){
   event.preventDefault();deferredPrompt=event;addInstallButton();
 });
 window.addEventListener('appinstalled',function(){markInstalled(true);});
 window.addEventListener('pageshow',function(){detectRelatedInstalledApps();if(displayModeInstalled())markInstalled(false);});
 // Show the install control only while this device has not installed the app.
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addInstallButton,{once:true});
 else addInstallButton();
})();