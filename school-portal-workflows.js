/* School-scoped welfare workflows. Uses the authenticated Supabase client created by school-portal.html. */
(function(){
'use strict';
window.__welfareWorkflowBundleState='loading';
window.__welfareWorkflowBundleVersion='20261122-sidebar-navigation-v25';
const $=id=>document.getElementById(id);
const ensurePrimaryFundBalanceCard=()=>{
 const value=$('netTotal'),card=value?.closest('.metric');
 if(!card)return;
 card.classList.add('metric-featured','metric-balance');
 const label=card.querySelector('.metric-label');if(label)label.textContent='TOTAL FUND BALANCE';
 let note=card.querySelector('.metric-note');
 if(!note){note=document.createElement('span');note.className='metric-note metric-note-positive';card.querySelector('.metric-content')?.appendChild(note);}
 if(note&&!note.textContent.trim())note.textContent='After all active payouts';
};
ensurePrimaryFundBalanceCard();
document.addEventListener('DOMContentLoaded',ensurePrimaryFundBalanceCard,{once:true});
window.addEventListener('welfare-workflows-ready',ensurePrimaryFundBalanceCard);


/* Lightweight, tenant-local financial charts shared by Admin, Member and DEMO dashboards. */
(function(){
 if(window.__welfareRenderFinancialCharts)return;
 const dateOf=(row,kind)=>{
  const fields=kind==='payout'?['date','payout_date','disbursement_date','payment_date','created_at']:['date','contribution_date','payment_date','created_at'];
  for(const field of fields){const raw=String(row?.[field]??'').trim(),m=raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);if(m){const y=Number(m[1]),mo=Number(m[2]),day=Number(m[3]);if(mo>=1&&mo<=12&&day>=1&&day<=31)return y+'-'+String(mo).padStart(2,'0')+'-'+String(day).padStart(2,'0');}}
  return '';
 };
 const active=row=>{const status=String(row?.status||row?.transaction_status||row?.reversal_status||'').toLowerCase(),flag=[row?.is_reversed,row?.isReversed,row?.reversed].some(v=>v===true||['true','t','1','yes'].includes(String(v??'').toLowerCase()));return !flag&&!['reversed','inactive','deleted','cancelled','canceled','void','archived'].includes(status)&&!row?.reversed_at&&!row?.reversedAt;};
 const amount=row=>{const n=Number(row?.amount);return Number.isFinite(n)&&n>0?n:0;};
 const cash=n=>'GH₵ '+Number(n||0).toLocaleString('en-GH',{minimumFractionDigits:2,maximumFractionDigits:2});
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const ns='http://www.w3.org/2000/svg';
 const svg=(label,body,minWidth=640,viewBoxWidth=600,viewBoxHeight=220,proportional=false)=>{const width=Math.max(640,Math.ceil(minWidth)),height=Math.max(190,Math.ceil(viewBoxHeight)),plotStyle='display:block!important;box-sizing:content-box!important;width:'+width+'px!important;min-width:'+width+'px!important;max-width:none!important;height:'+height+'px!important;min-height:'+height+'px!important;max-height:'+height+'px!important;aspect-ratio:auto!important;flex:0 0 '+width+'px!important;align-self:flex-start!important;object-fit:fill!important',canvas=proportional?'<div class="wf-financial-chart-canvas" style="display:block!important;position:relative!important;width:'+width+'px!important;min-width:'+width+'px!important;max-width:none!important;height:'+height+'px!important;min-height:'+height+'px!important;max-height:'+height+'px!important;flex:none!important"><svg class="wf-financial-chart-plot" width="'+width+'" height="'+height+'" style="'+plotStyle+'" viewBox="0 0 '+viewBoxWidth+' '+viewBoxHeight+'" preserveAspectRatio="xMidYMid meet" role="img" aria-label="'+esc(label)+'" xmlns="'+ns+'">'+body+'</svg></div>':'<svg class="wf-financial-chart-plot" width="'+width+'" height="'+height+'" style="'+plotStyle+'" viewBox="0 0 '+viewBoxWidth+' '+viewBoxHeight+'" preserveAspectRatio="xMidYMid meet" role="img" aria-label="'+esc(label)+'" xmlns="'+ns+'">'+body+'</svg>';return '<div class="wf-financial-chart-scroll'+(proportional?' wf-financial-chart-scroll-wide':'')+'" '+(proportional?'style="display:block!important;position:relative!important;width:100%!important;min-width:0!important;height:'+height+'px!important;min-height:'+height+'px!important;max-height:'+height+'px!important;overflow-x:auto!important;overflow-y:hidden!important;-webkit-overflow-scrolling:touch!important;contain:layout paint!important" ':'')+'tabindex="0" role="region" aria-label="Scrollable chart: '+esc(label)+'">'+canvas+'</div>';};
 const empty='<div class="wf-financial-chart-empty">No dated ledger records available yet.</div>';
 const ensureStyles=()=>{
  if(document.getElementById('welfare-financial-chart-styles'))return;
  const style=document.createElement('style');style.id='welfare-financial-chart-styles';
  style.textContent=`
   #welfareFinancialCharts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:16px 0 20px}
   #welfareFinancialCharts .wf-financial-chart-card{min-width:0;background:#fff;border:1px solid #e3e8f0;border-radius:17px;padding:16px;box-shadow:0 5px 16px rgba(16,35,63,.055);color:#10233F}
   #welfareFinancialCharts .wf-financial-chart-card:last-child{grid-column:1/-1}
   .wf-financial-chart-head{margin-bottom:8px}.wf-financial-chart-head h3{font-size:1rem;font-weight:850;margin:0 0 4px;color:#10233F}.wf-financial-chart-head p{font-size:.8rem;color:#64748b;margin:0}
   .wf-financial-chart-scroll{display:block;width:100%;max-width:100%;min-width:0;overflow-x:auto!important;overflow-y:hidden!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior-x:contain;touch-action:pan-x pan-y;scrollbar-width:thin;scrollbar-color:#cbd5e1 transparent}
   .wf-financial-chart-plot{display:block!important;flex:none!important;box-sizing:content-box!important;width:auto!important;height:auto!important;max-width:none!important;max-height:none!important;overflow:visible;align-self:flex-start}.wf-financial-chart-plot text{font-family:inherit;fill:#64748b;font-size:14px;font-weight:650}
   .wf-financial-chart-readout{min-height:34px;margin-top:7px;padding:8px 10px;border-radius:10px;background:#F4F6F9;color:#10233F;font-size:.82rem;font-weight:750;font-variant-numeric:tabular-nums;line-height:1.35}
   .wf-financial-chart-legend{display:flex;gap:14px;flex-wrap:wrap;margin-top:8px;font-size:.76rem;color:#475569}.wf-financial-chart-legend span{display:inline-flex;align-items:center;gap:6px}.wf-financial-chart-legend i{width:9px;height:9px;border-radius:3px;display:inline-block}
   .wf-financial-chart-empty{min-height:145px;display:grid;place-items:center;text-align:center;color:#64748b;background:#F4F6F9;border:1px dashed #cbd5e1;border-radius:12px;padding:18px;font-size:.84rem}
   #welfareFinancialCharts .wf-chart-mark{cursor:pointer;outline:none}#welfareFinancialCharts .wf-chart-mark:focus{stroke:#10233F;stroke-width:3}
   #welfareFinancialCharts #wfFundBalanceHistory .wf-financial-chart-scroll-wide{display:block!important;position:relative!important;width:100%!important;min-width:0!important;height:210px!important;min-height:210px!important;max-height:210px!important;overflow-x:auto!important;overflow-y:hidden!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior-x:contain!important;contain:none!important;white-space:nowrap!important}
   #welfareFinancialCharts #wfFundBalanceHistory .wf-financial-chart-canvas{display:inline-block!important;position:relative!important;width:max-content!important;min-width:max-content!important;max-width:none!important;height:210px!important;min-height:210px!important;max-height:210px!important;flex:none!important;vertical-align:top!important}
   #welfareFinancialCharts #wfFundBalanceHistory svg.wf-financial-chart-plot{display:block!important;width:max-content!important;min-width:max-content!important;max-width:none!important;height:210px!important;min-height:210px!important;max-height:210px!important;aspect-ratio:auto!important;flex:none!important;overflow:visible!important}
   @media(max-width:760px){#welfareFinancialCharts{grid-template-columns:minmax(0,1fr);gap:12px;margin:14px 0 18px}#welfareFinancialCharts .wf-financial-chart-card:last-child{grid-column:auto}#welfareFinancialCharts .wf-financial-chart-card{padding:13px}}
   html.dark #welfareFinancialCharts .wf-financial-chart-card,body.dark #welfareFinancialCharts .wf-financial-chart-card,body.dark-mode #welfareFinancialCharts .wf-financial-chart-card{background:#0B1D3A!important;background-color:#0B1D3A!important;color:#F8FAFC!important;border:1px solid #49617F!important;box-shadow:0 8px 24px rgba(0,0,0,.28)!important;color-scheme:dark}
   html.dark #welfareFinancialCharts .wf-financial-chart-head h3,body.dark #welfareFinancialCharts .wf-financial-chart-head h3,body.dark-mode #welfareFinancialCharts .wf-financial-chart-head h3{color:#FFE08A!important;opacity:1!important;font-weight:900!important;text-shadow:none!important}
   html.dark #welfareFinancialCharts .wf-financial-chart-head p,body.dark #welfareFinancialCharts .wf-financial-chart-head p,body.dark-mode #welfareFinancialCharts .wf-financial-chart-head p{color:#E2E8F0!important;opacity:1!important;font-weight:700!important;text-shadow:none!important}
   html.dark #welfareFinancialCharts .wf-financial-chart-readout,body.dark #welfareFinancialCharts .wf-financial-chart-readout,body.dark-mode #welfareFinancialCharts .wf-financial-chart-readout{background:#142B4A!important;color:#FFFFFF!important;border:1px solid #49617F!important;opacity:1!important}
   html.dark #welfareFinancialCharts .wf-financial-chart-legend,html.dark #welfareFinancialCharts .wf-financial-chart-legend span,body.dark #welfareFinancialCharts .wf-financial-chart-legend,body.dark #welfareFinancialCharts .wf-financial-chart-legend span,body.dark-mode #welfareFinancialCharts .wf-financial-chart-legend,body.dark-mode #welfareFinancialCharts .wf-financial-chart-legend span{color:#F8FAFC!important;opacity:1!important;font-weight:800!important}
   html.dark #welfareFinancialCharts .wf-financial-chart-plot text,html.dark #welfareFinancialCharts .wf-financial-chart-plot tspan,body.dark #welfareFinancialCharts .wf-financial-chart-plot text,body.dark #welfareFinancialCharts .wf-financial-chart-plot tspan,body.dark-mode #welfareFinancialCharts .wf-financial-chart-plot text,body.dark-mode #welfareFinancialCharts .wf-financial-chart-plot tspan{fill:#F8FAFC!important;color:#F8FAFC!important;opacity:1!important;font-weight:800!important}
   html.dark #welfareFinancialCharts .wf-financial-chart-empty,body.dark #welfareFinancialCharts .wf-financial-chart-empty,body.dark-mode #welfareFinancialCharts .wf-financial-chart-empty{background:#10233F!important;color:#F8FAFC!important;border-color:#718096!important}
  `;
  document.head.appendChild(style);
 };
 const monthRange=keys=>{if(!keys.length)return [];const sorted=keys.slice().sort(),[sy,sm]=sorted[0].split('-').map(Number),[ey,em]=sorted[sorted.length-1].split('-').map(Number),out=[];let y=sy,m=sm;while(y<ey||(y===ey&&m<=em)){out.push(y+'-'+String(m).padStart(2,'0'));m++;if(m===13){m=1;y++;}if(out.length>240)break;}return out;};
 const bindReadout=card=>{const readout=card.querySelector('.wf-financial-chart-readout');card.querySelectorAll('[data-chart-value]').forEach(mark=>{const show=()=>{if(readout)readout.textContent=mark.getAttribute('data-chart-value')||'';};mark.addEventListener('click',show);mark.addEventListener('focus',show);mark.addEventListener('mouseenter',show);});};
 const setChartRole=role=>{
  const normalized=/^(admin|administrator|school_admin)$/i.test(String(role||''))?'admin':/^(member|teacher)$/i.test(String(role||''))?'member':'';
  if(!normalized)return '';
  window.__welfareCurrentRole=normalized==='admin'?'admin':'teacher';
  if(typeof window.__welfareSetRoleMarker==='function')window.__welfareSetRoleMarker(normalized);
  else [document.documentElement,document.body,$('dashboard'),document.querySelector('main')].filter(Boolean).forEach(root=>{root.dataset.welfareRole=normalized;root.classList.toggle('welfare-role-admin',normalized==='admin');root.classList.toggle('welfare-role-member',normalized==='member');});
  return normalized;
 };
 const currentChartRole=()=>{
  const role=String(document.body?.dataset.welfareRole||$('dashboard')?.dataset.welfareRole||document.documentElement?.dataset.welfareRole||window.__welfareCurrentRole||'').toLowerCase();
  return ['admin','administrator','school_admin'].includes(role)?'admin':['member','teacher'].includes(role)?'member':'';
 };
 const isAdminChartView=()=>currentChartRole()==='admin';
 const removeAdminFundHistory=()=>{
  const role=currentChartRole();
  if(role==='admin'){setChartRole('admin');document.querySelectorAll('#welfareFinancialCharts #wfFundBalanceHistory,#wfFundBalanceHistory').forEach(node=>node.remove());return true;}
  if(role==='member'){setChartRole('member');return false;}
  return false;
 };
 if(!window.__welfareAdminFundHistoryGuard){
  window.__welfareAdminFundHistoryGuard=true;
  const adminChartObserver=new MutationObserver(records=>{
   if(!isAdminChartView())return;
   for(const record of records){
    if(record.type!=='childList')continue;
    for(const node of record.addedNodes){
     if(node.nodeType!==1)continue;
     if(node.id==='wfFundBalanceHistory'||node.querySelector?.('#wfFundBalanceHistory')){removeAdminFundHistory();return;}
    }
   }
  });
  adminChartObserver.observe(document.body,{childList:true,subtree:true});
  window.__welfareAdminFundHistoryObserver=adminChartObserver;
  window.addEventListener('welfare-workflows-ready',removeAdminFundHistory);
  window.addEventListener('welfare-workspace-mounted',removeAdminFundHistory);
  removeAdminFundHistory();
 }
 const renderNow=({contributions=[],payouts=[],scope='School ledger'}={})=>{
  setChartRole(window.__welfareCurrentRole||document.body?.dataset.welfareRole||$('dashboard')?.dataset.welfareRole);
  window.__welfareFinancialChartPending={contributions,payouts,scope};
  const host=document.getElementById('welfareFinancialCharts');if(!host)return;ensureStyles();
  const con=(Array.isArray(contributions)?contributions:[]).filter(active).map(row=>({...row,__date:dateOf(row,'contribution')})).filter(row=>row.__date);
  const pay=(Array.isArray(payouts)?payouts:[]).filter(active).map(row=>({...row,__date:dateOf(row,'payout')})).filter(row=>row.__date);
  const conTotals=new Map(),payTotals=new Map();con.forEach(row=>{const k=row.__date.slice(0,7);conTotals.set(k,(conTotals.get(k)||0)+amount(row));});pay.forEach(row=>{const k=row.__date.slice(0,7);payTotals.set(k,(payTotals.get(k)||0)+amount(row));});
  const keys=monthRange([...conTotals.keys(),...payTotals.keys()]);
  const card=(id,title,subtitle,body,readout,legend='')=>'<article class="wf-financial-chart-card" id="'+id+'"><header class="wf-financial-chart-head"><h3>'+title+'</h3><p>'+subtitle+'</p></header>'+body+'<div class="wf-financial-chart-readout" aria-live="polite">'+readout+'</div>'+legend+'</article>';
  let trendBody=empty,trendReadout='Select a month to inspect its recorded total.';
  if(con.length&&keys.length){const vals=keys.map(key=>({key,total:conTotals.get(key)||0})),max=Math.max(...vals.map(x=>x.total),0),base=166,plotH=132,step=560/vals.length,bw=Math.max(5,Math.min(28,step*.56));let body='<line x1="22" y1="'+base+'" x2="584" y2="'+base+'" stroke="#cbd5e1"/>';vals.forEach((v,i)=>{const height=max?(v.total/max)*plotH:0,x=30+i*step+(step-bw)/2,y=base-height,label=v.key.slice(5)+' / '+v.key.slice(0,4);body+='<rect class="wf-chart-mark" tabindex="0" role="button" aria-label="'+esc(label+' '+cash(v.total))+'" data-chart-value="'+esc(label+' · '+cash(v.total))+'" x="'+x.toFixed(2)+'" y="'+y.toFixed(2)+'" width="'+bw.toFixed(2)+'" height="'+height.toFixed(2)+'" rx="4" fill="#C6A04A"><title>'+esc(label+' · '+cash(v.total))+'</title></rect><text x="'+(x+bw/2).toFixed(2)+'" y="188" text-anchor="middle">'+v.key.slice(5)+'</text>';});trendBody=svg('Monthly contribution trend in Ghana cedis',body,Math.max(600,vals.length*48+40));trendReadout=keys.length+' dated month(s) · Tap a bar for exact GH₵ total.';}
  let compareBody=empty,compareReadout='Select a month to compare actual contributions and payouts.';
  if(keys.length&&(con.length||pay.length)){const vals=keys.map(key=>({key,con:conTotals.get(key)||0,pay:payTotals.get(key)||0})),max=Math.max(...vals.flatMap(x=>[x.con,x.pay]),0),base=166,plotH=132,step=560/vals.length,bw=Math.max(5,Math.min(15,step*.38));let body='<line x1="22" y1="'+base+'" x2="584" y2="'+base+'" stroke="#cbd5e1"/>';vals.forEach((v,i)=>{const center=30+i*step+step/2,h1=max?v.con/max*plotH:0,h2=max?v.pay/max*plotH:0,x1=center-bw-1,x2=center+1,label=v.key.slice(5)+' / '+v.key.slice(0,4),read=label+' · Contributions '+cash(v.con)+' · Payouts '+cash(v.pay);body+='<rect class="wf-chart-mark" tabindex="0" role="button" data-chart-value="'+esc(read)+'" aria-label="'+esc(read)+'" x="'+x1.toFixed(2)+'" y="'+(base-h1).toFixed(2)+'" width="'+bw.toFixed(2)+'" height="'+h1.toFixed(2)+'" rx="3" fill="#C6A04A"><title>'+esc('Contributions '+cash(v.con))+'</title></rect><rect class="wf-chart-mark" tabindex="0" role="button" data-chart-value="'+esc(read)+'" aria-label="'+esc(read)+'" x="'+x2.toFixed(2)+'" y="'+(base-h2).toFixed(2)+'" width="'+bw.toFixed(2)+'" height="'+h2.toFixed(2)+'" rx="3" fill="#25845B"><title>'+esc('Payouts '+cash(v.pay))+'</title></rect><text x="'+center.toFixed(2)+'" y="188" text-anchor="middle">'+v.key.slice(5)+'</text>';});compareBody=svg('Monthly contributions compared with welfare payouts',body,Math.max(640,vals.length*48+48));compareReadout=keys.length+' dated month(s) · Tap either series for both exact totals.';}
  const adminDashboard=isAdminChartView();
  let balanceBody=empty,balanceReadout='Select a point to inspect the cumulative running balance.';
  const events=[...con.map((row,index)=>({date:row.__date,type:'contribution',amount:amount(row),index})),...pay.map((row,index)=>({date:row.__date,type:'payout',amount:amount(row),index}))].sort((a,b)=>a.date.localeCompare(b.date)||(a.type===b.type?a.index-b.index:a.type==='contribution'?-1:1));
  if(events.length&&!adminDashboard){let running=0;const points=events.map(event=>{running+=event.type==='contribution'?event.amount:-event.amount;return {...event,balance:running};});const min=Math.min(0,...points.map(p=>p.balance)),max=Math.max(0,...points.map(p=>p.balance)),span=max-min||1,plotWidth=Math.max(640,points.length*52+112),plotHeight=210,left=56,right=plotWidth-56,top=42,bottom=150,axisY=174,coords=points.map((p,i)=>({x:points.length===1?plotWidth/2:left+i*(right-left)/(points.length-1),y:bottom-((p.balance-min)/span)*(bottom-top),...p})),line=coords.map((p,i)=>(i?'L':'M')+p.x.toFixed(2)+' '+p.y.toFixed(2)).join(' ');let body='<line x1="28" y1="'+axisY+'" x2="'+(plotWidth-28)+'" y2="'+axisY+'" stroke="#94A3B8" stroke-width="1.5"/><line x1="28" y1="'+top+'" x2="28" y2="'+bottom+'" stroke="#94A3B8" stroke-width="1.25"/><path d="'+line+'" fill="none" stroke="#E0B84F" stroke-width="3.25" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/>';coords.forEach(p=>{const label=p.date+' · '+(p.type==='contribution'?'Contribution +':'Payout −')+cash(p.amount)+' · Running net '+cash(p.balance);body+='<circle class="wf-chart-mark" tabindex="0" role="button" aria-label="'+esc(label)+'" data-chart-value="'+esc(label)+'" cx="'+p.x.toFixed(2)+'" cy="'+p.y.toFixed(2)+'" r="7" fill="#10233F" stroke="#E0B84F" stroke-width="2" vector-effect="non-scaling-stroke"><title>'+esc(label)+'</title></circle>';});if(coords.length===1){const p=coords[0];body+='<text x="'+p.x.toFixed(2)+'" y="202" text-anchor="middle">'+p.date.slice(5)+'</text>';}else{[coords[0],coords[coords.length-1]].forEach((p,i)=>{body+='<text x="'+p.x.toFixed(2)+'" y="202" text-anchor="'+(i===0?'start':'end')+'">'+p.date.slice(5)+'</text>';});}balanceBody=svg('Cumulative running net balance from dated ledger entries',body,plotWidth,plotWidth,plotHeight,true);balanceReadout=points.length+' dated transaction(s) · Running total '+cash(running)+' · Tap a point for exact value.';}
  host.innerHTML=card('wfMonthlyContributionTrend','Monthly contribution trend','Recorded contributions by month',trendBody,trendReadout)+card('wfPayoutComparison','Payout comparison','Monthly contributions vs. welfare payouts',compareBody,compareReadout,'<div class="wf-financial-chart-legend"><span><i style="background:#C6A04A"></i>Contributions</span><span><i style="background:#25845B"></i>Payouts</span></div>')+(adminDashboard?'':card('wfFundBalanceHistory','Fund-balance history','Running total from dated ledger entries',balanceBody,balanceReadout));
  if(adminDashboard)host.querySelector('#wfFundBalanceHistory')?.remove();
  removeAdminFundHistory();host.dataset.scope=scope;host.querySelectorAll('.wf-financial-chart-card').forEach(bindReadout);
 };
 const render=payload=>{
  setChartRole(window.__welfareCurrentRole||document.body?.dataset.welfareRole||$('dashboard')?.dataset.welfareRole);
  window.__welfareFinancialChartPending=payload||window.__welfareFinancialChartPending;
  const snapshot=window.__welfareFinancialChartPending;
  if(!snapshot)return;
  const host=document.getElementById('welfareFinancialCharts');
  const run=()=>renderNow(snapshot);
  const scheduler=window.__welfareUiScheduler;
  if(scheduler)scheduler.schedule(run,host||renderNow);
  else requestAnimationFrame(run);
 };
 window.__welfareRenderFinancialCharts=render;
 if(window.__welfareFinancialChartPending)render(window.__welfareFinancialChartPending);
 document.addEventListener('click',event=>{const nav=event.target.closest('.navbtn[data-target="schoolOverview"]');if(nav&&window.__welfareFinancialChartPending)render(window.__welfareFinancialChartPending);},{passive:true});
})();

// Stable route IDs are independent of sidebar labels and presentation text.
window.__welfareResolvePortalViewTarget=(rawTarget,role)=>{
 const target=String(rawTarget||'').trim();
 const routes=role==='admin'
  ?{wfContributionPanel:'wfAdminContributionPanel',wfPayoutPanel:'wfAdminPayoutPanel',wfTeacherPanel:'teacherProfileViewer'}
  :{wfReportsPanel:'wfStatementPanel',teacherProfileViewer:'wfTeacherPanel'};
 return routes[target]||target;
};

/* Shared badge and numeric treatment for workflow-rendered content. */
(function(){
 if(document.getElementById('welfare-workflow-visual-polish'))return;
 const style=document.createElement('style'); style.id='welfare-workflow-visual-polish';
 style.textContent=`
  :where(.wf-admin-pill,.wf-payout-status,.wf-admin-status,.wf-restricted-badge,.wf-teacher-register-badge,.teacher-dashboard-status) { display:inline-flex;align-items:center;justify-content:center;gap:5px;min-height:23px;padding:4px 9px;border:1px solid rgba(100,116,139,.28);border-radius:999px;line-height:1.25;font-weight:750;white-space:nowrap; }
  :where(.wf-payout-metric strong,.teacher-dashboard-contribution-amount,.teacher-dashboard-payout-amount,.wf-currency,.wf-money,[class*="amount"],[class*="total"],[class*="balance"],[class*="count"]) { font-variant-numeric:tabular-nums lining-nums;font-feature-settings:"tnum" 1,"lnum" 1; }
  .dark :where(.wf-admin-pill,.wf-payout-status,.wf-admin-status,.wf-restricted-badge,.wf-teacher-register-badge,.teacher-dashboard-status) { border-color:rgba(148,163,184,.34); }
  :where(.wf-empty-state,.empty-state) { padding:18px 14px;border:1px dashed rgba(148,163,184,.38);border-radius:12px;color:var(--muted,#718096);text-align:center;background:rgba(148,163,184,.045); }
 `;
 document.head.appendChild(style);
})();


(function(){if(document.getElementById('welfare-workflow-mobile-interaction-performance'))return;const style=document.createElement('style');style.id='welfare-workflow-mobile-interaction-performance';style.textContent=`/* Mobile interaction and paint budget: keep taps immediate and scrolling composited. */
:where(button,a,[role="button"],[role="tab"],.navbtn,.tab,.toggle,.password-toggle,[data-action],[data-card-action],.teacher-dashboard-statement,.metric){touch-action:manipulation;-webkit-tap-highlight-color:transparent}
:where(button,a,[role="button"],[role="tab"],.navbtn,.tab,.toggle,.password-toggle,[data-action]){cursor:pointer}
:where(button,a,[role="button"],[role="tab"],.navbtn,.tab,.toggle,.password-toggle,[data-action]):active{filter:none;opacity:.9}
.navbtn.is-pressed{opacity:.86}
@media(hover:none) and (pointer:coarse){
 html,body{scroll-behavior:auto!important;overscroll-behavior-x:none}
 body{background-image:none}
 #dashboard,.sidebar,.dash-layout,.table-wrap,.wf-admin-quick-pills,.wf-dues-matrix-scroll,[data-scroll-container]{-webkit-overflow-scrolling:touch}
 #dashboard .panel,#dashboard .metric,#dashboard .support,#workflows .panel,#wfAdminPanel .panel,.teacher-dashboard-ledger-card,.teacher-dashboard-profile,.teacher-profile-accent,#teacherProfileViewer,#wfTeacherPanel,.wf-payout-view,#wfReportsPanel.wf-reports-view{-webkit-backdrop-filter:none!important;backdrop-filter:none!important;box-shadow:0 1px 5px rgba(11,29,58,.045)!important}
 #dashboard .panel,#dashboard .metric,#dashboard .support,#workflows .panel{transform:none!important}
 #dashboard .overview-top,header.top,#mobile-nav-overlay{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
 .sidebar{box-shadow:8px 0 22px rgba(3,10,22,.18)!important}
 button:hover:not(:disabled),.navbtn:hover,.panel:hover,.metric:hover{transform:none!important;filter:none}
 :where(button,a,[role="button"],[role="tab"],.navbtn,.tab,.toggle,.password-toggle,[data-action]){transition:background-color .1s ease,border-color .1s ease,color .1s ease!important}
}
@media(prefers-reduced-motion:reduce){:where(button,a,[role="button"],[role="tab"],.navbtn,.tab,.toggle,.password-toggle,[data-action]){transition:none!important}}`;document.head.appendChild(style);})();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const displayWelfareReason=reason=>{const value=String(reason??'').trim();return value?value.replace(/^Bereavement Assistance$/i,'Condolence Support'):'—';};
window.displayWelfareReason=displayWelfareReason;
const money=n=>Number(n||0).toLocaleString('en-GH',{minimumFractionDigits:2,maximumFractionDigits:2});
const welfareCash=value=>'GH₵ '+money(value);
window.formatWelfareCurrency=welfareCash;
const today=()=>new Date().toISOString().slice(0,10);
const frameRender=(function(){
 const pending=new WeakMap();
 return function(key,render){
  if(!key||typeof render!=='function'||pending.has(key))return;
  const run=()=>{pending.delete(key);render();};
  pending.set(key,run);
  const scheduler=window.__welfareUiScheduler;
  if(scheduler)scheduler.schedule(run,key);
  else requestAnimationFrame(run);
 };
})();

function wfDialog({kind='confirm',title='Please confirm',message='',confirmText='Confirm',cancelText='Cancel',placeholder='Enter your response…',responseMode='none'}={}){
 return new Promise(resolve=>{
  let root=document.getElementById('wfGlobalDialog');
  if(!root){
   const style=document.createElement('style');style.id='wf-global-dialog-style';style.textContent=`
#wfGlobalDialog{position:fixed;inset:0;z-index:13000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(2,8,23,.76);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px)}
#wfGlobalDialog[hidden]{display:none!important}
#wfGlobalDialog .wfg-card{width:min(100%,470px);padding:24px;border:1px solid #334155;border-radius:19px;background:linear-gradient(145deg,#10213b,#081426);color:#f1f5f9;box-shadow:0 28px 85px rgba(0,0,0,.5)}
#wfGlobalDialog h2{margin:0 0 10px;color:#fff;font-size:1.2rem;font-weight:850}
#wfGlobalDialog .wfg-message{color:#c1ccdc;line-height:1.65;font-size:.9rem;white-space:pre-wrap;overflow-wrap:anywhere}
#wfGlobalDialog textarea{display:block;width:100%;min-height:105px;margin-top:15px;padding:12px;border:1px solid #435570;border-radius:11px;background:#071326;color:#fff;font:inherit;box-sizing:border-box}
#wfGlobalDialog textarea[hidden]{display:none!important}
#wfGlobalDialog textarea:focus{outline:0;border-color:#d6a637;box-shadow:0 0 0 3px rgba(214,166,55,.18)}
#wfGlobalDialog .wfg-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:20px}
#wfGlobalDialog button{min-height:42px;padding:9px 16px;border-radius:10px;font:inherit;font-weight:800;cursor:pointer}
#wfGlobalDialog .wfg-cancel{border:1px solid #40516b;background:#172b47;color:#e2e8f0}
#wfGlobalDialog .wfg-ok{border:1px solid #d6a637;background:linear-gradient(110deg,#f0c65d,#d6a637);color:#172033}
@media(max-width:520px){#wfGlobalDialog .wfg-card{padding:20px 17px}#wfGlobalDialog .wfg-actions button{flex:1}}
`;document.head.appendChild(style);
   root=document.createElement('div');root.id='wfGlobalDialog';root.hidden=true;root.innerHTML='<section class="wfg-card" role="dialog" aria-modal="true" aria-labelledby="wfgTitle"><h2 id="wfgTitle"></h2><div class="wfg-message" id="wfgMessage"></div><textarea id="wfgInput" hidden></textarea><div class="wfg-actions"><button type="button" class="wfg-cancel" id="wfgCancel">Cancel</button><button type="button" class="wfg-ok" id="wfgConfirm">Confirm</button></div></section>';document.body.appendChild(root);
  }
  const input=root.querySelector('#wfgInput'),ok=root.querySelector('#wfgConfirm'),cancel=root.querySelector('#wfgCancel');
  const inputVisible=kind==='prompt'||(kind==='confirm'&&(responseMode==='optional'||responseMode==='required'));
  const inputRequired=kind==='prompt'||responseMode==='required';
  root.querySelector('#wfgTitle').textContent=title;root.querySelector('#wfgMessage').textContent=message;
  input.hidden=!inputVisible;input.required=inputRequired;input.value='';input.placeholder=placeholder;input.setAttribute('aria-label',placeholder||'Optional response');
  cancel.hidden=kind==='alert';ok.textContent=kind==='alert'?'OK':confirmText;cancel.textContent=cancelText;
  root.hidden=false;document.body.style.overflow='hidden';
  const prior=document.activeElement;let done=false;
  const finish=value=>{if(done)return;done=true;root.hidden=true;document.body.style.overflow='';document.removeEventListener('keydown',keys,true);ok.removeEventListener('click',yes);cancel.removeEventListener('click',no);root.removeEventListener('click',backdrop);if(prior?.focus)prior.focus({preventScroll:true});resolve(value);};
  const yes=()=>{if(kind==='prompt'){const v=input.value.trim();if(!v)return;finish(v);}else if(inputVisible){const response=input.value.trim();if(inputRequired&&!response){input.focus();return;}finish({confirmed:true,response});}else finish(true);};
  const no=()=>finish(kind==='confirm'?(inputVisible?{confirmed:false,response:''}:false):null);
  const backdrop=e=>{if(e.target===root)no();};
  const keys=e=>{if(e.key==='Escape'){e.preventDefault();no();}else if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();yes();}};
  ok.addEventListener('click',yes);cancel.addEventListener('click',no);root.addEventListener('click',backdrop);document.addEventListener('keydown',keys,true);
  if(inputVisible)input.focus();else ok.focus();
 });
}
const wfNotice=message=>wfDialog({kind:'alert',title:'Notice',message:String(message??'')});
const wfConfirm=(message,options={})=>{const body=String(message??'');const title=/deactivat/i.test(body)?'Deactivate teacher':/delete|permanently/i.test(body)?'Confirm permanent deletion':/payout|withdrawal/i.test(body)?'Confirm welfare payout':/reversal/i.test(body)?'Confirm transaction reversal':/contribution/i.test(body)?'Confirm contribution':/announcement/i.test(body)?'Confirm announcement':'Confirm action';return wfDialog({kind:'confirm',title,message:body,confirmText:'Confirm',cancelText:'Cancel',...options});};
const wfPrompt=message=>wfDialog({kind:'prompt',title:'Additional information required',message:String(message??''),confirmText:'Confirm'});

// Branded, accessible reason dialog used by contribution and payout reversals.
function requestReversalReason(transactionType){
 return new Promise(resolve=>{
  let layer=document.getElementById('wfReversalReasonModal');
  if(!layer){
   const style=document.createElement('style');
   style.id='wf-reversal-reason-modal-style';
   style.textContent=`
#wfReversalReasonModal{position:fixed;inset:0;z-index:12000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,8,23,.72);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px)}
#wfReversalReasonModal[hidden]{display:none!important}
#wfReversalReasonModal .wf-reversal-dialog{width:min(100%,480px);border:1px solid #334155;border-radius:20px;padding:24px;background:linear-gradient(145deg,#10213b,#081426);color:#f1f5f9;box-shadow:0 28px 85px rgba(0,0,0,.48);animation:wfReversalModalIn .18s ease-out}
#wfReversalReasonModal .wf-reversal-kicker{display:flex;align-items:center;gap:9px;color:#e9c56b;font-size:.72rem;font-weight:850;letter-spacing:.12em;text-transform:uppercase}
#wfReversalReasonModal .wf-reversal-kicker i{width:32px;height:32px;display:grid;place-items:center;border-radius:10px;background:rgba(214,166,55,.14)}
#wfReversalReasonModal h2{margin:14px 0 6px;color:#fff;font-size:1.25rem;letter-spacing:-.035em}
#wfReversalReasonModal p{margin:0 0 15px;color:#b8c5d8;font-size:.88rem;line-height:1.6}
#wfReversalReasonModal label{display:block;margin:0 0 7px;color:#e2e8f0;font-size:.8rem;font-weight:800}
#wfReversalReasonModal textarea{display:block;width:100%;min-height:116px;resize:vertical;padding:12px 13px;border:1px solid #435570;border-radius:12px;background:#071326;color:#f8fafc;font:inherit;line-height:1.5;outline:none}
#wfReversalReasonModal textarea::placeholder{color:#8292aa}
#wfReversalReasonModal textarea:focus{border-color:#d6a637;box-shadow:0 0 0 3px rgba(214,166,55,.2)}
#wfReversalReasonModal .wf-reversal-hint{display:block;margin-top:7px;color:#91a1b8;font-size:.72rem}
#wfReversalReasonModal .wf-reversal-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:20px}
#wfReversalReasonModal button{min-height:43px;padding:10px 16px;border-radius:10px;font:inherit;font-size:.84rem;font-weight:850;cursor:pointer}
#wfReversalReasonModal .wf-reversal-cancel{border:1px solid #40516b;background:#172b47;color:#e2e8f0}
#wfReversalReasonModal .wf-reversal-confirm{border:1px solid #d6a637;background:linear-gradient(110deg,#f0c65d,#d6a637);color:#172033}
#wfReversalReasonModal button:disabled{opacity:.45;cursor:not-allowed}
#wfReversalReasonModal button:focus-visible{outline:3px solid rgba(214,166,55,.42);outline-offset:2px}
@keyframes wfReversalModalIn{from{opacity:0;transform:translateY(8px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
@media(max-width:520px){#wfReversalReasonModal{padding:13px}#wfReversalReasonModal .wf-reversal-dialog{padding:20px 17px;border-radius:17px}#wfReversalReasonModal .wf-reversal-actions button{flex:1}}
@media(prefers-reduced-motion:reduce){#wfReversalReasonModal .wf-reversal-dialog{animation:none}}
`;
   document.head.appendChild(style);
   layer=document.createElement('div');
   layer.id='wfReversalReasonModal';
   layer.hidden=true;
   layer.innerHTML='<section class="wf-reversal-dialog" role="dialog" aria-modal="true" aria-labelledby="wfReversalReasonTitle" aria-describedby="wfReversalReasonDescription"><div class="wf-reversal-kicker"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i> Transaction control</div><h2 id="wfReversalReasonTitle">Reason for reversal</h2><p id="wfReversalReasonDescription">Enter a clear reason for this reversal. The original transaction will be retained for the audit trail.</p><label for="wfReversalReasonInput">Reversal reason <span aria-hidden="true">*</span></label><textarea id="wfReversalReasonInput" maxlength="1000" placeholder="Describe why this transaction is being reversed…" required></textarea><small class="wf-reversal-hint">A reason is required before the reversal can continue.</small><div class="wf-reversal-actions"><button type="button" class="wf-reversal-cancel" data-wf-reason-cancel>Cancel</button><button type="button" class="wf-reversal-confirm" data-wf-reason-confirm disabled>Confirm</button></div></section>';
   document.body.appendChild(layer);
  }
  const input=layer.querySelector('#wfReversalReasonInput');
  const title=layer.querySelector('#wfReversalReasonTitle');
  const description=layer.querySelector('#wfReversalReasonDescription');
  const confirmButton=layer.querySelector('[data-wf-reason-confirm]');
  const cancelButton=layer.querySelector('[data-wf-reason-cancel]');
  title.textContent='Reason for '+transactionType+' reversal';
  description.textContent='Enter a clear reason for reversing this '+transactionType+'. The original transaction will be retained for the audit trail.';
  input.value='';
  confirmButton.disabled=true;
  layer.hidden=false;
  document.body.style.overflow='hidden';
  const previousFocus=document.activeElement;
  let settled=false;
  const finish=value=>{
   if(settled)return;
   settled=true;
   layer.hidden=true;
   document.body.style.overflow='';
   document.removeEventListener('keydown',onKeyDown,true);
   confirmButton.removeEventListener('click',onConfirm);
   cancelButton.removeEventListener('click',onCancel);
   layer.removeEventListener('click',onBackdrop);
   if(previousFocus&&typeof previousFocus.focus==='function')previousFocus.focus({preventScroll:true});
   resolve(value);
  };
  const onConfirm=()=>{const value=input.value.trim();if(value)finish(value);};
  const onCancel=()=>finish(null);
  const onBackdrop=event=>{if(event.target===layer)onCancel();};
  const onKeyDown=event=>{if(event.key==='Escape'){event.preventDefault();onCancel();}else if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){event.preventDefault();onConfirm();}};
  input.addEventListener('input',()=>{confirmButton.disabled=!input.value.trim();});
  confirmButton.addEventListener('click',onConfirm);
  cancelButton.addEventListener('click',onCancel);
  layer.addEventListener('click',onBackdrop);
  document.addEventListener('keydown',onKeyDown,true);
  requestAnimationFrame(()=>input.focus());
 });
}
const RANK_OPTIONS=[
 'Headmaster','Assistant Headmaster','Headmistress','Assistant Headmistress',
 'Member','Pupil Teacher','Superintendent II','Superintendent I',
 'Senior Superintendent II','Senior Superintendent I','Principal Superintendent',
 'Assistant Director II','Assistant Director I','Deputy Director',
 'Director II','Director I','Deputy Director General','Director General'
];
const rankOptionsMarkup=()=>'<option value="">Select Rank / Grade</option>'+RANK_OPTIONS.map(rank=>'<option value="'+esc(rank)+'">'+esc(rank)+'</option>').join('');
const csvCell=v=>{let s=String(v??'');if(/^[\s]*[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
const downloadWorkflowBlob=(blob,fileName,statusId,successText,viewLabel,sourceButton=null)=>{
 if(!(blob instanceof Blob))throw new Error('The generated file is unavailable.');
 const isPdf=/\.pdf$/i.test(String(fileName||''))||/pdf/i.test(String(viewLabel||''))||/PDF/i.test(String(successText||''));
 const filename=isPdf?(String(fileName||'Welfare_Statement_Report').replace(/\.pdf$/i,'')||'Welfare_Statement_Report')+'.pdf':String(fileName||'download');
 const downloadBlob=isPdf&&blob.type!=='application/pdf'?new Blob([blob],{type:'application/pdf'}):blob;
 const url=window.URL.createObjectURL(downloadBlob),link=document.createElement('a');
 link.href=url;
 link.setAttribute('download',filename);
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 let status=$(statusId);
 const card=sourceButton?.closest('.wf-report-card');
 if(card){
   status=card.querySelector('.wf-download-feedback');
   if(!status){
    status=document.createElement('p');
    status.className='wf-report-message wf-download-feedback';
    status.setAttribute('role','status');
    status.setAttribute('aria-live','polite');
    const actions=sourceButton.closest('.wf-report-actions,.wf-dues-matrix-export-actions')||sourceButton.parentElement;
    if(actions&&card.contains(actions))actions.insertAdjacentElement('afterend',status);
    else card.appendChild(status);
   }
 }
 if(status){
   status.textContent=successText;
   status.className=(status.className||'muted').replace(/\b(error|muted)\b/g,'').trim()+' wf-download-feedback';
   status.querySelectorAll('a[data-wf-download-link]').forEach(existing=>existing.remove());
   const fallback=document.createElement('a');
   fallback.href=url;
   fallback.target='_blank';
   fallback.rel='noopener';
   fallback.setAttribute('data-wf-download-link','');
   fallback.textContent=viewLabel||'Tap here to view downloaded PDF';
   fallback.style.cssText='display:inline-block;margin:7px 0;padding:8px 12px;border-radius:8px;background:#eaf2ff;color:#12376b;font-weight:800;text-decoration:underline;overflow-wrap:anywhere';
   status.querySelectorAll('a[data-wf-download-link]').forEach(link=>link.remove());
   fallback.setAttribute('data-wf-download-link','');
   status.appendChild(document.createTextNode(' '));
   status.appendChild(fallback);
 }
 setTimeout(()=>URL.revokeObjectURL(url),10*60*1000);
};

// Tenant names and details are supplied by the authenticated school record.

function addUI(){
 const d=document.createElement('section');d.id='workflows';d.innerHTML=`<style>
#wfAdminPanel{--wf-purple:#6d28d9;--wf-green:#059669;--wf-red:#e11d48;--wf-ink:#07122b;color:var(--wf-ink)}
#wfTeacherRegisterPanel{background:#fff!important;color:#07122b!important;border:1px solid rgba(148,163,184,.2)!important;border-radius:18px!important;box-shadow:0 16px 38px rgba(7,18,43,.09)!important;margin:18px 0!important;padding:clamp(16px,2.5vw,24px)!important;min-width:0}
#wfTeacherRegisterPanel .wf-teacher-register-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap;margin-bottom:14px}
#wfTeacherRegisterPanel .wf-teacher-register-heading h3{margin:0 0 5px;color:#07122b;font-size:1.25rem;font-weight:850}
#wfTeacherRegisterPanel .wf-teacher-register-heading p{margin:0;max-width:760px;line-height:1.6}
#wfTeacherRegisterPanel .wf-teacher-register-badge{display:inline-flex;align-items:center;gap:7px;padding:7px 11px;border-radius:999px;background:#ecfdf5;color:#047857;font-size:.72rem;font-weight:850;white-space:nowrap}
#wfTeacherRegisterPanel label{display:block;color:#17233b;font-weight:750;margin:12px 0 7px}
#wfTeacherRegisterPanel input:not([type=file]),#wfTeacherRegisterPanel input[type=file]{width:100%;min-height:44px;padding:10px 12px;border:1px solid #dbe2ec;border-radius:10px;background:#fff;color:#0f172a;box-sizing:border-box}
#wfTeacherRegisterPanel input:focus{outline:0;border-color:#818cf8;box-shadow:0 0 0 3px rgba(99,102,241,.13)}
/* Teacher registration form: prevent grid children and native controls from forcing overflow. */
#wfTeacherRegisterPanel #wfTeacher{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px 14px;min-width:0}
#wfTeacherRegisterPanel #wfTeacher>div{min-width:0;max-width:100%}
#wfTeacherRegisterPanel #wfTeacher input:not([type=file]),
#wfTeacherRegisterPanel #wfTeacher select{display:block;width:100%!important;max-width:100%;min-width:0;box-sizing:border-box!important}
#wfTeacherRegisterPanel #wfTeacher select{padding-right:34px!important;white-space:normal;text-overflow:ellipsis}
#wfTeacherRegisterPanel .wf-passport-upload{width:100%;min-width:0;max-width:100%;padding:7px;border:1px solid #dbe2ec;border-radius:12px;background:#f8fafc;box-sizing:border-box;overflow:hidden}
#wfTeacherRegisterPanel .wf-passport-upload input[type=file]{display:block;width:100%;min-width:0;max-width:100%;min-height:42px;padding:4px!important;border:0!important;border-radius:8px!important;background:transparent!important;box-shadow:none!important;font-size:.82rem;line-height:1.4;box-sizing:border-box}
#wfTeacherRegisterPanel .wf-passport-upload input[type=file]::file-selector-button{max-width:100%;margin:0 8px 0 0;padding:9px 12px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;color:#17233b;font:inherit;font-weight:750;white-space:nowrap}
#wfTeacherRegisterPanel .wf-passport-upload input[type=file]::-webkit-file-upload-button{max-width:100%;margin:0 8px 0 0;padding:9px 12px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;color:#17233b;font:inherit;font-weight:750;white-space:nowrap}
#wfTeacherRegisterPanel .wf-passport-help{display:block;margin:8px 2px 0;line-height:1.55;overflow-wrap:anywhere}
@media(max-width:760px){
 #wfTeacherRegisterPanel #wfTeacher{grid-template-columns:minmax(0,1fr);gap:12px}
 #wfTeacherRegisterPanel #wfTeacher>div{width:100%;min-width:0}
 #wfTeacherRegisterPanel #wfTeacher>div[style*="align-self:end"]{align-self:stretch!important}
 #wfTeacherRegisterPanel #wfTeacher>div[style*="align-self:end"] button{flex:1 1 140px}
 #wfTeacherRegisterPanel #wfTeacher select{font-size:1rem;padding-right:38px!important}
 #wfTeacherRegisterPanel .wf-passport-upload input[type=file]{font-size:.78rem}
}
#wfTeacherRegisterPanel button{border:1px solid transparent;border-radius:10px;min-height:42px;padding:10px 15px;background:#07122b;color:#fff;font-weight:800}
#wfTeacherRegisterPanel button.secondary{background:#f1f5f9;color:#1e293b;border-color:#e2e8f0}
#wfTeacherRegisterPanel table{width:100%;min-width:1250px;border-collapse:collapse}
#wfTeacherRegisterPanel th{background:#f1f5f9;color:#334155;text-align:left;font-size:.73rem;letter-spacing:.04em;text-transform:uppercase}
#wfTeacherRegisterPanel th,#wfTeacherRegisterPanel td{padding:11px 10px;border-bottom:1px solid #e5eaf1;vertical-align:middle}
#wfTeacherRegisterPanel td{color:#17233b;font-size:.83rem}
#wfTeacherRegisterPanel .wf-teacher-status{display:inline-flex;padding:5px 9px;border-radius:999px;font-size:.7rem;font-weight:850}
#wfTeacherRegisterPanel .wf-teacher-status.active{background:#dcfce7;color:#166534}
#wfTeacherRegisterPanel .wf-teacher-status.inactive{background:#fee2e2;color:#991b1b}
.dark #wfTeacherRegisterPanel{background:#0b1d3a!important;color:#e6edf7!important;border-color:#26364d!important}
.dark #wfTeacherRegisterPanel h3,.dark #wfTeacherRegisterPanel td{color:#e6edf7}
.dark #wfTeacherRegisterPanel input{background:#071328;color:#e6edf7;border-color:#354862}
@media(max-width:640px){#wfTeacherRegisterPanel .wf-teacher-register-heading h3{font-size:1.08rem}#wfTeacherRegisterPanel .wf-teacher-register-badge{font-size:.65rem}}

#wfAdminPanel .panel{background:#fff!important;color:#07122b!important;border:1px solid rgba(148,163,184,.18)!important;border-radius:16px!important;box-shadow:0 18px 42px rgba(7,18,43,.12)!important;margin-bottom:18px;padding:22px;min-width:0}
#wfAdminPanel .wf-admin-intro{background:linear-gradient(145deg,#fff,#f8fafc)!important}
/* High-contrast Administration Panel hero: match the dashboard solidarity banner. */
#wfAdminPanel .wf-admin-intro{position:relative!important;isolation:isolate;overflow:hidden;background:linear-gradient(125deg,#071b35 0%,#12345b 58%,#1b4568 100%)!important;color:#fff!important;border:1px solid rgba(214,173,82,.42)!important;box-shadow:0 18px 42px rgba(7,27,53,.2)!important}
#wfAdminPanel .wf-admin-intro:before{content:"";position:absolute;z-index:-1;width:250px;height:250px;right:-85px;top:-155px;border:1px solid rgba(185,199,255,.18);border-radius:50%;box-shadow:0 0 0 24px rgba(157,174,255,.035),0 0 0 50px rgba(157,174,255,.025);pointer-events:none}
#wfAdminPanel .wf-admin-intro h2,#wfAdminPanel .wf-admin-intro p,#wfAdminPanel .wf-admin-intro .wf-admin-intro-top,#wfAdminPanel .wf-admin-intro .wf-admin-shortcuts{color:#fff!important}
#wfAdminPanel .wf-admin-intro p{color:#e5ebf7!important;line-height:1.7}
#wfAdminPanel .wf-admin-intro .wf-admin-eyebrow,#wfAdminPanel .wf-admin-intro .wf-admin-eyebrow i{color:#ffdc72!important}
#wfAdminPanel .wf-admin-intro .wf-admin-status{background:rgba(230,190,65,.14)!important;border:1px solid rgba(230,190,65,.4)!important;color:#ffdc72!important}
#wfAdminPanel .wf-admin-intro .wf-admin-shortcuts span{color:#fff!important;background:rgba(255,255,255,.07)!important;border:1px solid rgba(255,255,255,.13)!important}
#wfAdminPanel .wf-admin-intro .wf-admin-shortcuts i{color:#ffdc72!important}
#wfAdminPanel h2,#wfAdminPanel h3{display:flex;align-items:center;gap:11px;color:#07122b!important;font-weight:850!important;letter-spacing:-.025em;line-height:1.35;margin:0 0 9px}
#wfAdminPanel h3:before{font-family:"Font Awesome 6 Free";font-weight:900;display:inline-grid;place-items:center;width:38px;height:38px;flex:0 0 38px;border-radius:11px;background:#eef2ff;color:#4338ca;font-size:16px}
#wfAdminAccessPanel h3:before{content:"\\f084";background:#f1f5f9;color:#0f172a}
#wfAdminUsersPanel h3:before{content:"\\f2bd";background:#ecfdf5;color:#059669}
#wfResetDataPanel h3:before{content:"\\f071";background:#fff1f2;color:#e11d48}
#wfTeacherRegisterPanel h3:before{content:"\\f234";background:#ecfdf5;color:#059669}
#wfAdminContributionPanel h3:before{content:"\\f4b9";background:#ecfdf5;color:#059669}
#wfAdminPayoutPanel h3:before,#wfPayoutLedgerPanel h3:before{content:"\\f4b9";background:#fff1f2;color:#e11d48}
#wfStatementPanel h3:before{content:"\\f15c"}
#wfLedgerPanel h3:before{content:"\\f03a"}
#wfBroadcastPanel h3:before{content:"\\f0a1";background:#f3e8ff;color:#7e22ce}
#wfSettingsPanel h3:before{content:"\\f1de";background:#eff6ff;color:#1d4ed8}
#wfReportsPanel h3:before{content:"\\f1c1"}
#wfAuditPanel h3:before{content:"\\f1da"}
#wfAdminPanel p.muted{color:#64748b!important;line-height:1.65}
#wfAdminPanel label{color:#17233b;font-weight:750;margin:13px 0 7px}
#wfAdminPanel input,#wfAdminPanel select,#wfAdminPanel textarea{width:100%;min-height:44px;padding:11px 13px!important;border:1px solid #dbe2ec!important;border-radius:11px!important;background:#fff!important;color:#0f172a!important;box-shadow:none;transition:border-color .18s,box-shadow .18s}
#wfAdminPanel input::placeholder,#wfAdminPanel textarea::placeholder{color:#94a3b8}
#wfAdminPanel input:focus,#wfAdminPanel select:focus,#wfAdminPanel textarea:focus{outline:0;border-color:#818cf8!important;box-shadow:0 0 0 3px rgba(99,102,241,.13)!important}
#wfAdminPanel button{border:1px solid transparent;border-radius:10px;min-height:42px;padding:10px 15px;background:#07122b;color:#fff;font-weight:800;box-shadow:0 5px 12px rgba(7,18,43,.12);transition:transform .18s,filter .18s,box-shadow .18s}
#wfAdminPanel button:hover{filter:brightness(1.08);transform:translateY(-1px);box-shadow:0 8px 18px rgba(7,18,43,.15)}
#wfAdminPanel button.secondary{background:#f1f5f9;color:#1e293b;border-color:#e2e8f0;box-shadow:none}
#wfBroadcastPanel button[type=submit]{background:linear-gradient(120deg,#7c3aed,#4f46e5)}
#wfAdminUsersPanel button[type=submit],#wfTeacherSave,#wfContribution button[type=submit],#wfDuesForm button[type=submit]{background:#059669}
#wfPayout button[type=submit],#wfResetDataForm button[type=submit]{background:linear-gradient(120deg,#e11d48,#be123c)}
#wfAdminAccessPanel button[type=submit],#wfSettingsPanel button[type=submit]{background:#07122b}
#wfAdminPanel table{width:100%;border-collapse:separate;border-spacing:0;font-size:.86rem;overflow:hidden;border-radius:12px}
#wfAdminPanel th{background:#f1f5f9;color:#334155;font-weight:850;letter-spacing:.04em}
#wfAdminPanel th,#wfAdminPanel td{padding:12px;border-bottom:1px solid #e8edf4}
#wfAdminPanel tbody tr:hover{background:#f8fafc}
#wfAdminPanel .wf-data-protection{border:1px solid #fecdd3;border-radius:12px;background:#fff1f2;padding:14px 16px;margin:12px 0}
#wfAdminPanel .wf-data-protection strong{color:#be123c}
#wfAdminPanel .wf-admin-intro-top{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;flex-wrap:wrap}
#wfAdminPanel .wf-admin-eyebrow{font-size:.76rem;letter-spacing:.12em;text-transform:uppercase;font-weight:900;color:#4338ca;margin-bottom:8px}
#wfAdminPanel .wf-admin-shortcuts{display:flex;gap:9px;flex-wrap:wrap;margin-top:18px}
#wfAdminPanel .wf-admin-shortcuts span{display:inline-flex;align-items:center;gap:7px;background:#f1f5f9;color:#334155;border-radius:999px;padding:8px 12px;font-size:.78rem;font-weight:800}
#wfAdminPanel .wf-restricted-badge{display:inline-flex;align-items:center;gap:6px;margin-left:4px;padding:6px 10px;border:1px solid rgba(255,220,114,.42);border-radius:999px;background:rgba(230,190,65,.12);color:#ffdc72;font-size:.7rem;letter-spacing:.03em;white-space:nowrap}\n #wfAdminPanel .wf-admin-status{display:inline-flex;align-items:center;gap:7px;padding:8px 11px;border-radius:999px;background:#ecfdf5;color:#047857;font-weight:850;font-size:.76rem}
#wfAdminPanel .grid{gap:15px}
@media(max-width:600px){#wfAdminPanel .panel{padding:16px!important}#wfAdminPanel h3{font-size:1rem}#wfAdminPanel h3:before{width:34px;height:34px;flex-basis:34px}#wfAdminPanel .wf-admin-status{width:max-content}#wfAdminPanel .grid{grid-template-columns:1fr}}

/* Unified administration styling: apply to every workflow panel, not only the hero wrapper. */
#workflows .panel{background:#fff;color:#07122b;border:1px solid rgba(148,163,184,.18);border-radius:16px;box-shadow:0 18px 42px rgba(7,18,43,.18);padding:22px;min-width:0}
#workflows .panel h3{display:flex;align-items:center;gap:11px;color:#07122b;font-size:1.04rem;font-weight:850;letter-spacing:-.025em;line-height:1.35;margin:0 0 10px}
#workflows .panel h3:before{font-family:"Font Awesome 6 Free";font-weight:900;display:inline-grid;place-items:center;width:38px;height:38px;flex:0 0 38px;border-radius:11px;background:#eff6ff;color:#1d4ed8;font-size:16px}
#workflows #wfBroadcastPanel h3:before{content:"\\f0a1";background:#f3e8ff;color:#7e22ce}
#workflows #wfSettingsPanel h3:before{content:"\\f1de";background:#eff6ff;color:#1d4ed8}
#workflows #wfAdminAccessPanel h3:before{content:"\\f084";background:#eff6ff;color:#1d4ed8}
#workflows #wfAdminUsersPanel h3:before{content:"\\f2bd";background:#ecfdf5;color:#059669}
#workflows #wfTeacherRegisterPanel h3:before{content:"\\f234";background:#ecfdf5;color:#059669}
#workflows #wfAdminContributionPanel h3:before{content:"\\f4b9";background:#ecfdf5;color:#059669}
#workflows #wfAdminPayoutPanel h3:before,#workflows #wfResetDataPanel h3:before{content:"\\f071";background:#fff1f2;color:#e11d48}
#workflows #wfLedgerPanel h3:before{content:"\\f03a"}
#workflows #wfStatementPanel h3:before,#workflows #wfReportsPanel h3:before{content:"\\f15c"}
#workflows #wfAuditPanel h3:before{content:"\\f1da"}
#workflows input,#workflows select,#workflows textarea{width:100%;min-height:44px;padding:11px 13px;border:1px solid #dbe2ec;border-radius:11px;background:#fff;color:#0f172a;box-shadow:none;transition:border-color .18s,box-shadow .18s,background .18s}
#workflows input:focus,#workflows select:focus,#workflows textarea:focus{outline:0;border-color:#818cf8;box-shadow:0 0 0 3px rgba(99,102,241,.13)}
#workflows button{border:1px solid transparent;border-radius:10px;min-height:42px;padding:10px 15px;background:#07122b;color:#fff;font-weight:800;box-shadow:0 5px 12px rgba(7,18,43,.12);transition:transform .18s,filter .18s,box-shadow .18s}
#workflows button:hover:not(:disabled){filter:brightness(1.06);transform:translateY(-1px);box-shadow:0 8px 18px rgba(7,18,43,.15)}
#workflows button.secondary{background:#f1f5f9;color:#1e293b;border-color:#e2e8f0;box-shadow:none}
#workflows #wfBroadcastForm button[type=submit]{background:linear-gradient(120deg,#7c3aed,#4f46e5)}
#workflows #wfInviteAdminForm button[type=submit],#workflows #wfContribution button[type=submit],#workflows #wfDuesForm button[type=submit]{background:#059669}
#workflows #wfPayout button[type=submit],#workflows #wfResetDataForm button[type=submit]{background:linear-gradient(120deg,#e11d48,#be123c)}
#workflows #wfAdminAccessPanel button[type=submit],#workflows #wfSettingsPanel button[type=submit]{background:linear-gradient(120deg,#123a76,#07122b)}
#workflows #wfTeacherSave{background:linear-gradient(120deg,#8b5cf6,#6d28d9)!important;color:#fff!important}
#workflows #wfStatementPdf{background:linear-gradient(120deg,#ec4899,#db2777)!important;color:#fff!important}
#workflows .wf-data-protection{border-radius:12px}
#workflows table{width:100%;border-collapse:separate;border-spacing:0;border-radius:12px;overflow:hidden}
#workflows th{background:#f1f5f9;color:#334155;font-weight:850}
#workflows th,#workflows td{padding:12px;border-bottom:1px solid #e8edf4}
#workflows tbody tr:hover{background:#f8fafc}
@media(max-width:600px){#workflows .panel{padding:16px}#workflows .panel h3{font-size:1rem}#workflows .panel h3:before{width:34px;height:34px;flex-basis:34px}#workflows .grid{grid-template-columns:1fr}}


/* Premium navy hero card: aligned with the dashboard solidarity hero. */
#wfAdminPanel .wf-admin-intro{
  position:relative!important;isolation:isolate!important;overflow:hidden!important;
  border-radius:1.5rem!important;padding:clamp(24px,4vw,40px)!important;
  border:1px solid rgba(214,173,82,.38)!important;
  background:radial-gradient(circle at 88% 14%,rgba(82,112,210,.25) 0%,transparent 38%),
             radial-gradient(circle at 12% 100%,rgba(30,64,120,.28) 0%,transparent 42%),
             linear-gradient(135deg,#0d1b2a 0%,#1b263b 60%,#0f172a 100%)!important;
  color:#fff!important;box-shadow:0 20px 48px rgba(7,18,43,.22)!important;
}
#wfAdminPanel .wf-admin-intro::before{
  content:"";position:absolute;z-index:-1;width:420px;height:420px;right:-155px;bottom:-285px;
  border:1px solid rgba(185,199,255,.18);border-radius:50%;
  box-shadow:0 0 0 24px rgba(157,174,255,.035),0 0 0 52px rgba(157,174,255,.025),0 0 0 82px rgba(157,174,255,.018);
  pointer-events:none;
}
#wfAdminPanel .wf-admin-intro .wf-admin-eyebrow{
  display:inline-flex;align-items:center;gap:9px;width:max-content;max-width:100%;
  padding:9px 16px;margin:0 0 16px;border:1px solid rgba(245,179,45,.48);
  border-radius:999px;background:rgba(120,76,8,.20);color:#fbbf24!important;
  font-size:.75rem;font-weight:850;letter-spacing:.09em;text-transform:uppercase;
}
#wfAdminPanel .wf-admin-intro .wf-admin-eyebrow i{color:#fbbf24!important}
#wfAdminPanel .wf-admin-intro h2{
  display:block!important;color:#fff!important;font-size:clamp(1.7rem,3.6vw,2.45rem);
  line-height:1.12;font-weight:900!important;letter-spacing:-.045em;text-wrap:balance;
}
#wfAdminPanel .wf-admin-intro p{color:#cbd5e1!important;line-height:1.75}
#wfAdminPanel .wf-admin-intro .wf-restricted-badge{
  display:inline-flex;vertical-align:middle;margin:8px 0 0 5px;
  border:1px solid rgba(245,179,45,.42);border-radius:999px;
  background:rgba(120,76,8,.18);color:#fbbf24!important;
}
#wfAdminPanel .wf-admin-intro .wf-admin-status{
  background:rgba(16,185,129,.13)!important;border:1px solid rgba(52,211,153,.32)!important;
  color:#a7f3d0!important;
}
#wfAdminPanel .wf-admin-intro .wf-admin-shortcuts span{
  background:rgba(255,255,255,.07)!important;border:1px solid rgba(255,255,255,.13)!important;
  color:#e2e8f0!important;
}
#wfAdminPanel .wf-admin-intro .wf-admin-shortcuts i{color:#fbbf24!important}
@media(max-width:600px){
  #wfAdminPanel .wf-admin-intro{border-radius:1.5rem!important;padding:24px 19px!important}
  #wfAdminPanel .wf-admin-intro .wf-admin-status{width:max-content}
}


.wf-payout-view{padding:clamp(18px,2.5vw,28px)!important;border:1px solid var(--line)!important;border-radius:18px!important;background:#fff!important;box-shadow:0 12px 32px rgba(11,29,58,.07)!important;min-width:0;color:#17243a!important}.wf-payout-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:20px}.wf-payout-heading h2{margin:0 0 5px!important;color:#14233d!important;font-size:clamp(1.35rem,2.4vw,1.8rem)!important;font-weight:850!important;letter-spacing:-.035em}.wf-payout-heading p{margin:0;color:#718096!important;font-size:.9rem}.wf-payout-metrics{display:grid;grid-template-columns:1fr;gap:13px;margin:0 0 20px}.wf-payout-metric{position:relative;display:flex;flex-direction:column;justify-content:center;min-height:104px;padding:17px 20px 17px 22px;background:#fff;border:1px solid #e8edf4;border-left:5px solid transparent;border-radius:14px;box-shadow:0 7px 20px rgba(15,35,65,.055);overflow:hidden}.wf-payout-metric small{font-size:.7rem;font-weight:900;letter-spacing:.12em;color:#718096}.wf-payout-metric strong{display:block;margin-top:7px;color:#14233d;font-size:clamp(1.45rem,3vw,1.9rem);line-height:1.15;font-weight:900;font-variant-numeric:tabular-nums}.wf-payout-pink{border-left-color:#e34c78}.wf-payout-pink:before{content:"";position:absolute;left:0;top:0;bottom:0;width:5px;background:linear-gradient(180deg,#f472b6,#dc365f)}.wf-payout-blue{border-left-color:#3b82f6}.wf-payout-purple{border-left-color:#8b5cf6}.wf-payout-log{border:1px solid #e8edf4;border-radius:15px;background:#fff;overflow:hidden}.wf-payout-log-head{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;padding:17px 19px;border-bottom:1px solid #edf1f6}.wf-payout-log-head h3{margin:0!important;color:#17243a!important;font-size:1rem!important;font-weight:850!important}.wf-payout-log-head p{margin:4px 0 0;font-size:.82rem}.wf-payout-log-head input{width:min(100%,290px)!important;min-height:40px!important;margin:0!important}.wf-payout-table-wrap{width:100%;overflow-x:auto}.wf-payout-table-wrap table{width:100%;min-width:760px;border-collapse:collapse;font-size:.84rem}.wf-payout-table-wrap th{padding:13px 15px;background:#f6f8fb;color:#617087;font-size:.68rem;font-weight:900;letter-spacing:.1em;text-align:left;white-space:nowrap}.wf-payout-table-wrap td{padding:14px 15px;border-top:1px solid #edf1f6;color:#334155;vertical-align:middle}.wf-payout-table-wrap tbody tr:hover{background:#fafbfe}.wf-payout-status{display:inline-flex;align-items:center;padding:5px 9px;border-radius:999px;background:#eff6ff;color:#315f9c;font-size:.72rem;font-weight:800;white-space:nowrap}.dark .wf-payout-view,.dark .wf-payout-log,.dark .wf-payout-metric{background:#0b1d3a!important;color:#e6edf7!important;border-color:#26364d!important}.dark .wf-payout-heading h2,.dark .wf-payout-metric strong,.dark .wf-payout-log-head h3,.dark .wf-payout-table-wrap td{color:#e6edf7!important}.dark .wf-payout-metric small,.dark .wf-payout-heading p{color:#a8b5c8!important}.dark .wf-payout-table-wrap th{background:#142d52;color:#d4deeb}.dark .wf-payout-table-wrap td{border-color:#26364d}.dark .wf-payout-log-head{border-color:#26364d}@media(min-width:760px){.wf-payout-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}.wf-payout-metric{min-height:116px}}@media(max-width:520px){.wf-payout-view{padding:16px!important}.wf-payout-metric{min-height:94px}.wf-payout-log-head{align-items:stretch}.wf-payout-log-head input{width:100%!important}}

#wfAdminPayoutPanel{grid-column:1/-1!important}#wfAdminPayoutPanel .wf-payout-entry{margin-top:18px;padding-top:14px;border-top:1px solid #e8edf4}#wfAdminPayoutPanel .wf-payout-entry summary{cursor:pointer;color:#334155;font-weight:850}#wfAdminPayoutPanel .wf-payout-entry form{max-width:720px;padding-top:10px}#wfAdminPayoutPanel .wf-payout-entry button{margin-top:8px}.dark #wfAdminPayoutPanel .wf-payout-entry{border-color:#26364d}.dark #wfAdminPayoutPanel .wf-payout-entry summary{color:#e6edf7}

#wfReportsPanel.wf-reports-view{padding:clamp(18px,2.5vw,30px)!important;border:1px solid #e7ecf3!important;border-radius:20px!important;background:#f8fafc!important;box-shadow:0 14px 38px rgba(15,35,65,.07)!important;color:#17243a!important}#wfReportsPanel .wf-reports-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:23px}#wfReportsPanel .wf-reports-heading h2{display:block!important;margin:0 0 7px!important;color:#14233d!important;font-size:clamp(1.45rem,2.5vw,1.9rem)!important;font-weight:900!important;letter-spacing:-.035em!important}#wfReportsPanel .wf-reports-heading h2:before{display:none!important}#wfReportsPanel .wf-reports-heading p{margin:0;color:#718096!important;line-height:1.65;font-size:.92rem}#wfReportsPanel .wf-reports-admin-status{display:inline-flex;align-items:center;gap:8px;padding:9px 12px;border-radius:999px;background:#ecfdf5;color:#047857;border:1px solid #bbf7d0;font-size:.75rem;font-weight:850;white-space:nowrap}#wfReportsPanel .wf-report-cards{display:grid;grid-template-columns:1fr;gap:17px}#wfReportsPanel .wf-report-card{display:flex;align-items:flex-start;gap:17px;padding:clamp(17px,2vw,23px);background:#fff;border:1px solid #e7ecf3;border-radius:17px;box-shadow:0 8px 24px rgba(15,35,65,.055);min-width:0;transition:transform .18s ease,box-shadow .18s ease}#wfReportsPanel .wf-report-card:hover{transform:none;box-shadow:0 13px 30px rgba(15,35,65,.09)}#wfReportsPanel .wf-report-card{border-top:4px solid var(--wf-report-accent,#64748b);padding-top:calc(clamp(17px,2vw,23px) - 3px)}#wfReportsPanel .wf-report-card-rose{--wf-report-accent:#db2777}#wfReportsPanel .wf-report-card-amber{--wf-report-accent:#d97706}#wfReportsPanel .wf-report-card-violet{--wf-report-accent:#7e22ce}#wfReportsPanel .wf-report-card-emerald{--wf-report-accent:#059669}#wfReportsPanel .wf-report-card-indigo{--wf-report-accent:#4f46e5}#wfReportsPanel .wf-report-card-rose{border-top-color:#db2777!important}#wfReportsPanel .wf-report-card-amber{border-top-color:#d97706!important}#wfReportsPanel .wf-report-card-violet{border-top-color:#7e22ce!important}#wfReportsPanel .wf-report-card-emerald{border-top-color:#059669!important}#wfReportsPanel .wf-report-card-indigo{border-top-color:#4f46e5!important}#wfReportsPanel .wf-report-button-rose{background:linear-gradient(135deg,#ec4899,#db2777)!important}#wfReportsPanel .wf-report-button-indigo{background:linear-gradient(135deg,#6366f1,#4338ca)!important}#wfReportsPanel .wf-month-year-picker{position:relative;z-index:2;transform:none!important;overflow:visible!important}#wfReportsPanel .wf-month-year-picker select{display:block!important;position:relative!important;z-index:3!important;pointer-events:auto!important;appearance:auto!important;-webkit-appearance:menulist!important;touch-action:manipulation;cursor:pointer}#wfReportsPanel .wf-report-card-icon{width:49px;height:49px;flex:0 0 49px;display:grid;place-items:center;border-radius:14px;font-size:1.25rem}#wfReportsPanel .wf-report-icon-blue{background:#eff6ff;color:#2563eb}#wfReportsPanel .wf-report-icon-orange{background:#fff7ed;color:#ea580c}#wfReportsPanel .wf-report-icon-green{background:#ecfdf5;color:#059669}#wfReportsPanel .wf-report-icon-purple{background:#f3e8ff;color:#7e22ce}#wfReportsPanel .wf-report-button-purple{background:linear-gradient(135deg,#9333ea,#6b21a8)!important}#wfReportsPanel .wf-report-card-content{flex:1;min-width:0}#wfReportsPanel .wf-report-card-content h3{display:block!important;margin:1px 0 7px!important;color:#17243a!important;font-size:1.08rem!important;font-weight:900!important;letter-spacing:-.02em!important}#wfReportsPanel .wf-report-card-content h3:before{display:none!important}#wfReportsPanel .wf-report-card-content>p:not(.wf-report-message){margin:0 0 16px;color:#718096!important;font-size:.88rem;line-height:1.65}#wfReportsPanel .wf-report-card-content label{display:block;margin:0 0 7px!important;color:#334155!important;font-size:.8rem;font-weight:800!important}#wfReportsPanel .wf-report-card-content select{width:100%;max-width:560px;min-height:46px;margin:0 0 13px;padding:11px 13px;border:1px solid #dbe2ec;border-radius:11px;background:#fff;color:#17243a;font-weight:600}#wfReportsPanel .wf-report-button{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:46px;padding:11px 17px;border:0!important;border-radius:11px!important;color:#fff!important;font-size:.83rem;font-weight:850!important;box-shadow:0 6px 14px rgba(15,23,42,.13)!important;transition:filter .18s,transform .18s}#wfReportsPanel .wf-report-button:hover{filter:brightness(1.08);transform:translateY(-1px)}#wfReportsPanel .wf-report-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:auto}#wfReportsPanel .wf-report-actions .wf-report-button{flex:1 1 145px;width:auto;margin-top:0}#wfReportsPanel .wf-report-button-share{background:linear-gradient(135deg,#0f766e,#115e59)!important}#wfReportsPanel .wf-report-button-dark{background:linear-gradient(135deg,#202938,#080d18)!important}#wfReportsPanel .wf-report-button-orange{background:linear-gradient(135deg,#f59e0b,#d97706)!important}#wfReportsPanel .wf-report-button-green{background:linear-gradient(135deg,#10b981,#047857)!important}#wfReportsPanel .wf-report-message{margin:9px 0 0;color:#64748b;font-size:.8rem}#wfReportsPanel .wf-report-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:18px;padding:14px 3px 0;border-top:1px solid #e5eaf1}#wfReportsPanel .wf-report-footer p{margin:0;font-size:.8rem}#wfReportsPanel .wf-report-csv{display:inline-flex;align-items:center;gap:8px;min-height:38px;padding:8px 12px;background:#eef2f7!important;color:#334155!important;border:1px solid #dce3ed!important;border-radius:10px;font-size:.78rem;font-weight:800;box-shadow:none!important}.dark #wfReportsPanel.wf-reports-view{background:#0c1728!important;border-color:#26364d!important;color:#e6edf7!important}.dark #wfReportsPanel .wf-report-card{background:#111f33;border-color:#293a52}.dark #wfReportsPanel .wf-reports-heading h2,.dark #wfReportsPanel .wf-report-card-content h3{color:#edf3fb!important}.dark #wfReportsPanel .wf-reports-heading p,.dark #wfReportsPanel .wf-report-card-content>p:not(.wf-report-message){color:#aab8ca!important}.dark #wfReportsPanel .wf-report-card-content label{color:#d9e3ef!important}.dark #wfReportsPanel .wf-report-card-content select{background:#0b1728;color:#edf3fb;border-color:#35465d}.dark #wfReportsPanel .wf-report-footer{border-color:#293a52}.dark #wfReportsPanel .wf-report-csv{background:#24364e!important;color:#e5edf7!important;border-color:#3a4d66!important}@media(min-width:900px){#wfReportsPanel .wf-report-cards{grid-template-columns:repeat(3,minmax(0,1fr))}#wfReportsPanel .wf-report-card{flex-direction:column;min-height:320px}#wfReportsPanel .wf-report-card-content{width:100%}#wfReportsPanel .wf-report-button{width:100%;margin-top:auto}}@media(max-width:540px){#wfReportsPanel.wf-reports-view{padding:16px!important}#wfReportsPanel .wf-report-card{gap:13px;padding:16px}#wfReportsPanel .wf-report-card-icon{width:43px;height:43px;flex-basis:43px;border-radius:12px}#wfReportsPanel .wf-report-button{width:100%;font-size:.78rem;padding:10px 12px}}
\n#wfAdminPayoutPanel .wf-payout-reference{font-weight:500;color:#64748b}#wfAdminPayoutPanel .wf-payout-beneficiary{font-weight:900;text-transform:uppercase;color:#17243a}#wfAdminPayoutPanel .wf-payout-amount{font-weight:900;color:#dc365f;white-space:nowrap}#wfAdminPayoutPanel .wf-reverse-action{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:10px 16px;border:0!important;border-radius:15px!important;background:#ffe4e8!important;color:#b4234d!important;box-shadow:none!important;font-weight:850!important;white-space:nowrap}#wfAdminPayoutPanel .wf-reverse-action:hover{background:#fecdd6!important;filter:none!important;transform:translateY(-1px)}#wfAdminPayoutPanel .wf-reverse-action i{font-size:1rem}#wfAdminPayoutPanel .wf-reversed-label{color:#be123c;font-size:.78rem}#wfAdminPayoutPanel .wf-payout-table-wrap th{white-space:nowrap}\n
/* Shared solidarity hero design for the administration workspace */
#wfAdminPanel .wf-admin-intro{
 position:relative!important;isolation:isolate;overflow:hidden!important;margin:0 0 20px!important;
 padding:clamp(24px,4vw,38px)!important;border:1px solid rgba(232,196,112,.36)!important;
 border-radius:28px!important;
 background:radial-gradient(ellipse at 82% 18%,rgba(73,137,205,.24),transparent 38%),radial-gradient(ellipse at 12% 100%,rgba(201,157,69,.12),transparent 36%),linear-gradient(128deg,#06152c 0%,#0b2546 48%,#12385f 100%)!important;
 color:#fff!important;box-shadow:0 18px 46px rgba(3,15,34,.22)!important
}
#wfAdminPanel .wf-admin-intro:before{content:"";position:absolute;z-index:0;width:310px;height:310px;right:-100px;top:-170px;border:1px solid rgba(225,196,130,.22);border-radius:50%;box-shadow:0 0 0 25px rgba(225,196,130,.035),0 0 0 52px rgba(225,196,130,.025),0 0 0 82px rgba(105,158,220,.025);pointer-events:none}
#wfAdminPanel .wf-admin-intro-top{position:relative;z-index:1;align-items:flex-start;gap:18px}
#wfAdminPanel .wf-admin-intro .wf-admin-eyebrow{display:inline-flex;align-items:center;gap:8px;margin:0 0 15px;padding:7px 13px;border:1px solid rgba(232,196,112,.58);border-radius:999px;background:rgba(3,12,27,.58);color:#f3d58a!important;font-size:.7rem;font-weight:850;letter-spacing:.12em;text-transform:uppercase}
#wfAdminPanel .wf-admin-intro .wf-admin-eyebrow i{color:#f3d58a!important}
#wfAdminPanel .wf-admin-intro h2{display:block;max-width:850px;margin:0 0 11px!important;color:#fff!important;font-size:clamp(1.65rem,3.4vw,2.5rem)!important;font-weight:900!important;letter-spacing:-.04em!important;line-height:1.12!important}
#wfAdminPanel .wf-admin-intro p{max-width:850px;margin:0;color:#d5dfed!important;font-size:clamp(.9rem,1.5vw,1rem);line-height:1.75}
#wfAdminPanel .wf-admin-intro .wf-restricted-badge{display:inline-flex;vertical-align:middle;margin:8px 0 0;padding:5px 9px;border:1px solid rgba(255,255,255,.2);border-radius:999px;background:rgba(255,255,255,.08);color:#f4d68e;font-size:.68rem;letter-spacing:.02em}
#wfAdminPanel .wf-admin-intro .wf-admin-status{flex:0 0 auto;padding:8px 12px;border:1px solid rgba(232,196,112,.4)!important;border-radius:999px;background:rgba(3,12,27,.42)!important;color:#f3d58a!important;font-size:.72rem;font-weight:800}
#wfAdminPanel .wf-admin-intro .wf-admin-shortcuts{position:relative;z-index:1;display:flex;flex-wrap:wrap;gap:9px;margin-top:18px}
#wfAdminPanel .wf-admin-intro .wf-admin-shortcuts span{padding:7px 11px;border:1px solid rgba(255,255,255,.15)!important;border-radius:999px;background:rgba(255,255,255,.07)!important;color:#f1f5fb!important;font-size:.74rem;font-weight:700}
#wfAdminPanel .wf-admin-intro .wf-admin-shortcuts i{color:#f3d58a!important}
@media(max-width:640px){#wfAdminPanel .wf-admin-intro{padding:23px 19px!important;border-radius:22px!important}#wfAdminPanel .wf-admin-intro-top{display:block}#wfAdminPanel .wf-admin-intro .wf-admin-status{display:inline-flex;margin-top:14px}#wfAdminPanel .wf-admin-intro h2{font-size:clamp(1.5rem,7vw,2rem)!important}}

/* Align Administration Panel hero with the shared navy/sapphire solidarity design. */
#wfAdminPanel .wf-admin-intro{position:relative!important;isolation:isolate;overflow:hidden;margin:0 0 2rem!important;padding:1.5rem!important;border:1px solid rgba(255,255,255,.1)!important;border-radius:2.25rem!important;background:linear-gradient(135deg,#0c1b3c 0%,#183b70 56%,#2563a6 100%)!important;color:#fff!important;box-shadow:0 25px 50px -12px rgba(2,8,23,.42)!important}
#wfAdminPanel .wf-admin-intro:before{content:"";position:absolute;z-index:0;right:-2.5rem;bottom:-2.5rem;width:20rem;height:20rem;border-radius:9999px;background:rgba(245,158,11,.15);filter:blur(48px);pointer-events:none}
#wfAdminPanel .wf-admin-intro:after{content:"";position:absolute;z-index:0;right:33.333%;top:-5rem;width:15rem;height:15rem;border-radius:9999px;background:rgba(59,130,246,.15);filter:blur(40px);pointer-events:none}
#wfAdminPanel .wf-admin-intro>*{position:relative;z-index:1}
#wfAdminPanel .wf-admin-intro-top>div{position:relative;z-index:1;max-width:48rem}
#wfAdminPanel .wf-admin-intro .wf-admin-eyebrow{display:inline-flex;align-items:center;gap:.5rem;padding:.375rem .875rem;border:1px solid rgba(251,191,36,.3);border-radius:9999px;background:rgba(251,191,36,.2);color:#fcd34d!important;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;backdrop-filter:blur(12px)}
#wfAdminPanel .wf-admin-intro .wf-admin-eyebrow i{color:#fbbf24!important}
#wfAdminPanel .wf-admin-intro h2{max-width:48rem;color:#fff!important;font-size:clamp(1.875rem,3.4vw,2.25rem)!important;font-weight:900!important;letter-spacing:-.025em!important;line-height:1.15!important}
#wfAdminPanel .wf-admin-intro p{max-width:48rem;color:#e2e8f0!important;font-size:clamp(.875rem,1.5vw,1rem)!important;font-weight:500!important;line-height:1.65!important}
@media(min-width:640px){#wfAdminPanel .wf-admin-intro{padding:2.5rem!important}}
@media(max-width:640px){#wfAdminPanel .wf-admin-intro{border-radius:1.5rem!important;padding:1.5rem 1.25rem!important}}

/* Compact, horizontally scrollable Administration Panel quick actions. */
#wfAdminPanel .wf-admin-quick-actions{margin:0 0 18px;padding:14px 15px;border:1px solid rgba(214,166,55,.24);border-radius:18px;background:linear-gradient(135deg,#fff 0%,#f7f9fc 100%);box-shadow:0 9px 24px rgba(15,23,42,.06)}#wfAdminPanel .wf-admin-quick-actions{border-top:5px solid #d6a637!important;padding-top:10px!important}
.dark #wfAdminPanel .wf-admin-quick-actions{background:linear-gradient(135deg,#0f1f37,#0a172b);border-color:rgba(214,166,55,.25)}
#wfAdminPanel .wf-admin-quick-heading{display:flex;align-items:center;gap:9px;margin:0 0 11px;color:#334155;font-size:.72rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
.dark #wfAdminPanel .wf-admin-quick-heading{color:#e2e8f0}
#wfAdminPanel .wf-admin-quick-heading i{display:grid;place-items:center;width:27px;height:27px;border-radius:9px;background:#fff1c9;color:#a8750b}
#wfAdminPanel .wf-admin-quick-hint{margin-left:auto;color:#94a3b8;font-size:.65rem;font-weight:700;letter-spacing:0;text-transform:none}
#wfAdminPanel .wf-admin-quick-pills{display:flex;flex-wrap:nowrap;gap:9px;overflow-x:auto;overflow-y:hidden;padding:2px 2px 8px;scrollbar-width:thin;scrollbar-color:rgba(184,135,32,.55) transparent;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain}
#wfAdminPanel .wf-admin-quick-pill{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:41px;flex:0 0 auto;white-space:nowrap;padding:9px 13px;border:1px solid #e2e8f0;border-radius:999px;background:#fff;color:#1e3554;font-size:.72rem;font-weight:800;text-decoration:none;box-shadow:0 3px 9px rgba(15,23,42,.04);transition:transform .18s ease,border-color .18s ease,background .18s ease,box-shadow .18s ease}
#wfAdminPanel .wf-admin-quick-pill>i{color:#b88720}
#wfAdminPanel .wf-admin-quick-pill:hover,#wfAdminPanel .wf-admin-quick-pill.is-active{border-color:#d6a637;background:#fff5d9;color:#805b0a;box-shadow:0 5px 12px rgba(15,23,42,.07)}
#wfAdminPanel .wf-admin-quick-pill:focus-visible{outline:3px solid rgba(214,166,55,.35);outline-offset:2px}
.dark #wfAdminPanel .wf-admin-quick-pill{background:#172943;border-color:#334155;color:#e2e8f0}
.dark #wfAdminPanel .wf-admin-quick-pill:hover,.dark #wfAdminPanel .wf-admin-quick-pill.is-active{background:#243956;border-color:#d6a637;color:#ffe4a3}
#wfAdminPanel .wf-admin-quick-pill-danger{border-color:#fecaca;color:#b91c1c;background:#fff7f7}
#wfAdminPanel .wf-admin-quick-pill-danger>i{color:#dc2626}
#wfAdminPanel .wf-admin-quick-pill-danger:hover,#wfAdminPanel .wf-admin-quick-pill-danger.is-active{border-color:#ef4444;background:#fff1f2;color:#b91c1c}
#wfBroadcastPanel,#wfSettingsPanel,#wfAdminAccessPanel,#wfAdminUsersPanel,#wfResetDataPanel{scroll-margin-top:calc(var(--unified-header-height,140px) + 18px)}
@media(max-width:640px){#wfAdminPanel .wf-admin-quick-actions{padding:12px;border-radius:16px}#wfAdminPanel .wf-admin-quick-pills{gap:8px}#wfAdminPanel .wf-admin-quick-pill{font-size:.67rem;padding:9px 11px}#wfAdminPanel .wf-admin-quick-hint{font-size:.6rem}}


/* Unified elevated control cards with section-specific top accents. */
#wfAdminPanel > #wfBroadcastPanel,
#wfAdminPanel > #wfSettingsPanel,
#wfAdminPanel > #wfAdminAccessPanel,
#wfAdminPanel > #wfAdminUsersPanel,
#wfAdminPanel > #wfResetDataPanel,
#wfAdminPanel > .grid > .panel{
 --wf-card-accent:#2563eb;
 position:relative!important;isolation:isolate;
 overflow:hidden;
 padding:clamp(17px,2.2vw,24px)!important;
 border:1px solid rgba(148,163,184,.22)!important;
 border-top:4px solid var(--wf-card-accent)!important;
 border-radius:20px!important;
 background:linear-gradient(155deg,#fff 0%,#fbfdff 72%,#f5f8fc 100%)!important;
 box-shadow:0 14px 30px rgba(15,23,42,.09),0 4px 10px rgba(15,23,42,.045),inset 0 1px 0 rgba(255,255,255,.95)!important;
 transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease;
}
#wfAdminPanel > #wfBroadcastPanel{--wf-card-accent:#0d9488}
#wfAdminPanel > #wfSettingsPanel{--wf-card-accent:#d6a637}
#wfAdminPanel > #wfAdminAccessPanel{--wf-card-accent:#7c3aed}
#wfAdminPanel > #wfAdminUsersPanel{--wf-card-accent:#2563eb}
#wfAdminPanel > #wfResetDataPanel{--wf-card-accent:#dc4758}
#wfAdminPanel > .grid > .panel{--wf-card-accent:#16a34a}
#wfAdminPanel > #wfBroadcastPanel:before,
#wfAdminPanel > #wfSettingsPanel:before,
#wfAdminPanel > #wfAdminAccessPanel:before,
#wfAdminPanel > #wfAdminUsersPanel:before,
#wfAdminPanel > #wfResetDataPanel:before,
#wfAdminPanel > .grid > .panel:before{
 content:"";position:absolute;z-index:-1;inset:0 0 auto;height:54px;
 background:linear-gradient(180deg,color-mix(in srgb,var(--wf-card-accent) 8%,transparent),transparent);
 pointer-events:none;
}
#wfAdminPanel > #wfBroadcastPanel h3,
#wfAdminPanel > #wfSettingsPanel h3,
#wfAdminPanel > #wfAdminAccessPanel h3,
#wfAdminPanel > #wfAdminUsersPanel h3,
#wfAdminPanel > #wfResetDataPanel h3{margin-top:2px!important;letter-spacing:-.025em}
#wfAdminPanel > #wfBroadcastPanel p,
#wfAdminPanel > #wfSettingsPanel p,
#wfAdminPanel > #wfAdminAccessPanel p,
#wfAdminPanel > #wfAdminUsersPanel p,
#wfAdminPanel > #wfResetDataPanel p{line-height:1.65}
#wfAdminPanel .wf-dues-reminder-control,
#wfAdminPanel .wf-data-protection{
 position:relative;overflow:hidden;
 border-top:3px solid #d6a637!important;
 border-radius:14px!important;
 background:linear-gradient(145deg,rgba(255,249,230,.92),rgba(255,255,255,.94))!important;
 box-shadow:0 7px 16px rgba(15,23,42,.055),inset 0 1px rgba(255,255,255,.9)!important;
 padding:15px 16px!important;
}
#wfAdminPanel .wf-data-protection{border-top-color:#7c3aed!important;background:linear-gradient(145deg,#f5f0ff,#fff)!important}
#wfAdminPanel input:not([type=checkbox]):not([type=radio]),
#wfAdminPanel textarea,#wfAdminPanel select{
 box-sizing:border-box;max-width:100%;
 border:1px solid #cbd5e1!important;border-radius:11px!important;
 background:#fff!important;color:#17243a!important;
 box-shadow:inset 0 1px 2px rgba(15,23,42,.045)!important;
}
#wfAdminPanel input:focus,#wfAdminPanel textarea:focus,#wfAdminPanel select:focus{
 outline:3px solid rgba(59,130,246,.16)!important;border-color:#4f86d9!important;
}
#wfAdminPanel button{
 border-radius:12px!important;
 transition:transform .18s ease,box-shadow .18s ease,filter .18s ease;
}
#wfAdminPanel button:hover{transform:translateY(-1px);box-shadow:0 7px 16px rgba(15,23,42,.13)}
.dark #wfAdminPanel > #wfBroadcastPanel,
.dark #wfAdminPanel > #wfSettingsPanel,
.dark #wfAdminPanel > #wfAdminAccessPanel,
.dark #wfAdminPanel > #wfAdminUsersPanel,
.dark #wfAdminPanel > #wfResetDataPanel,
.dark #wfAdminPanel > .grid > .panel{
 background:linear-gradient(155deg,#14243a 0%,#101d30 72%,#0d192b 100%)!important;
 border-color:rgba(100,116,139,.35)!important;
 border-top-color:var(--wf-card-accent)!important;
 box-shadow:0 16px 34px rgba(0,0,0,.28),0 4px 12px rgba(0,0,0,.2),inset 0 1px rgba(255,255,255,.045)!important;
 color:#e7eef8!important;
}
.dark #wfAdminPanel > #wfBroadcastPanel h3,
.dark #wfAdminPanel > #wfSettingsPanel h3,
.dark #wfAdminPanel > #wfAdminAccessPanel h3,
.dark #wfAdminPanel > #wfAdminUsersPanel h3,
.dark #wfAdminPanel > #wfResetDataPanel h3{color:#f1f5fb!important}
.dark #wfAdminPanel > #wfBroadcastPanel p,
.dark #wfAdminPanel > #wfSettingsPanel p,
.dark #wfAdminPanel > #wfAdminAccessPanel p,
.dark #wfAdminPanel > #wfAdminUsersPanel p,
.dark #wfAdminPanel > #wfResetDataPanel p{color:#aebed1}
.dark #wfAdminPanel .wf-dues-reminder-control,
.dark #wfAdminPanel .wf-data-protection{background:linear-gradient(145deg,#263247,#1a293e)!important;border-color:#66552d!important;color:#e8eef7}
.dark #wfAdminPanel .wf-data-protection{border-top-color:#a78bfa!important;border-color:#4c3b70!important}
.dark #wfAdminPanel input:not([type=checkbox]):not([type=radio)],
.dark #wfAdminPanel textarea,#wfAdminPanel select{
 background:#0b1728!important;color:#edf3fb!important;border-color:#3a4b63!important;
}
.dark #wfAdminPanel input::placeholder,#wfAdminPanel textarea::placeholder{color:#91a2b8!important}
@media(hover:hover) and (min-width:700px){
 #wfAdminPanel > #wfBroadcastPanel:hover,
 #wfAdminPanel > #wfSettingsPanel:hover,
 #wfAdminPanel > #wfAdminAccessPanel:hover,
 #wfAdminPanel > #wfAdminUsersPanel:hover,
 #wfAdminPanel > #wfResetDataPanel:hover,
 #wfAdminPanel > .grid > .panel:hover{
  transform:translateY(-2px);
  box-shadow:0 20px 38px rgba(15,23,42,.12),0 6px 14px rgba(15,23,42,.055),inset 0 1px 0 rgba(255,255,255,.95)!important;
 }
}
@media(max-width:640px){
 #wfAdminPanel > #wfBroadcastPanel,
 #wfAdminPanel > #wfSettingsPanel,
 #wfAdminPanel > #wfAdminAccessPanel,
 #wfAdminPanel > #wfAdminUsersPanel,
 #wfAdminPanel > #wfResetDataPanel,
 #wfAdminPanel > .grid > .panel{padding:17px!important;border-radius:17px!important}
}

</style><style id="teacher-register-icon-font-fallback-guard">
#wfTeacherRegisterPanel .wf-teacher-register-badge{gap:7px}
#wfTeacherRegisterPanel .wf-teacher-register-badge .wf-badge-icon{width:15px;height:15px;flex:0 0 15px;display:block;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
#wfTeacherRegisterPanel .wf-register-title:before,#wfBulkTeacherCard .wf-bulk-title:before{content:none!important;display:none!important}
#wfTeacherRegisterPanel .wf-register-title .wf-ui-icon,#wfBulkTeacherCard .wf-bulk-title .wf-ui-icon{font-family:inherit!important;font-style:normal!important;line-height:1!important}
</style>
 <section class="wf-admin-hub" id="wfAdminPanel"><div class="panel wf-admin-intro"><div class="wf-admin-intro-top"><div><div class="wf-admin-eyebrow"><i class="fa-solid fa-shield-heart"></i> Official Welfare Hub</div><h2>Empowering Our Educators Through Solidarity <span class="wf-restricted-badge"><i class="fa-solid fa-lock"></i> Restricted Access</span></h2><p>Providing mutual financial support, social welfare benefits, and transparent record-keeping through a secure, organised school workspace.</p></div><span class="wf-admin-status"><i class="fa-solid fa-circle-check"></i> Admin mode active</span></div><div class="wf-admin-shortcuts"><span><i class="fa-solid fa-users"></i> Members</span><span><i class="fa-solid fa-coins"></i> Contributions</span><span><i class="fa-solid fa-hand-holding-heart"></i> Welfare</span></div></div>
 <nav class="wf-admin-quick-actions" aria-label="Administration quick actions">
  <div class="wf-admin-quick-heading"><i class="fa-solid fa-arrow-right"></i><span>Quick Admin Actions</span><span class="wf-admin-quick-hint">Jump to a task</span></div>
  <div class="wf-admin-quick-pills">
   <a class="wf-admin-quick-pill" href="#tenantSchoolLogoCard" data-wf-admin-target="tenantSchoolLogoCard"><i class="fa-solid fa-school"></i> School Profile</a>
   <a class="wf-admin-quick-pill" href="#wfBroadcastPanel" data-wf-admin-target="wfBroadcastPanel"><i class="fa-solid fa-bullhorn"></i> School Announcement</a>
   <a class="wf-admin-quick-pill" href="#wfSettingsPanel" data-wf-admin-target="wfSettingsPanel"><i class="fa-solid fa-coins"></i> School Settings · Monthly Dues</a>
   <a class="wf-admin-quick-pill" href="#wfAdminAccessPanel" data-wf-admin-target="wfAdminAccessPanel"><i class="fa-solid fa-key"></i> Administrator Access &amp; Recovery</a>
   <a class="wf-admin-quick-pill" href="#wfAdminUsersPanel" data-wf-admin-target="wfAdminUsersPanel"><i class="fa-solid fa-user-plus"></i> Register &amp; Manage Administrators</a>
   <a class="wf-admin-quick-pill wf-admin-quick-pill-danger" href="#wfResetDataPanel" data-wf-admin-target="wfResetDataPanel"><i class="fa-solid fa-triangle-exclamation"></i> Reset School's Welfare Data</a>
  </div>
 </nav>
 <section id="tenantSchoolLogoCard" class="panel tenant-school-logo-card" hidden aria-label="School profile and logo">
 <div class="tenant-school-logo-copy"><span class="tenant-school-logo-kicker">SCHOOL PROFILE</span><h2 id="tenantLogoSchoolName">School name</h2><p id="tenantLogoSchoolCode">School code</p></div>
 <div class="tenant-school-logo-controls">
  <div class="tenant-school-logo-preview" id="tenantLogoPreviewFrame"><img id="tenantSchoolLogoPreview" alt="Active school crest preview" hidden></div>
  <div class="tenant-school-logo-actions"><label for="tenantSchoolLogoFile">School Logo / Crest</label><input id="tenantSchoolLogoFile" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"><small>PNG, JPEG, WebP or SVG · Maximum 3 MB · Transparent backgrounds supported</small><button id="tenantSchoolLogoRemove" class="secondary" type="button" disabled><i class="fa-solid fa-trash-can"></i> Remove Logo</button><p id="tenantSchoolLogoStatus" role="status" aria-live="polite"></p></div>
 </div>
</section>
 <div class="panel" id="wfBroadcastPanel"><h3>School announcement</h3><p class="muted">Publish a school-scoped message for the portal. The message is stored with this school’s settings.</p><form id="wfBroadcastForm"><label for="wfBroadcastText">Announcement message</label><textarea id="wfBroadcastText" maxlength="500" rows="3" style="width:100%;padding:12px;border:1px solid var(--line);border-radius:10px;font:inherit" placeholder="Enter an important welfare fund announcement"></textarea><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button type="submit">Publish announcement</button><button id="wfBroadcastClear" class="secondary" type="button">Clear announcement</button></div></form><p id="wfBroadcastMsg" class="muted" role="status"></p>
 <div class="wf-dues-reminder-control" style="margin-top:16px;padding:14px 15px;border:1px solid rgba(214,166,55,.28);border-radius:13px;background:rgba(214,166,55,.055)">
  <label for="wfAutomatedDuesReminderToggle" style="display:flex;align-items:center;gap:10px;margin:0 0 6px;font-weight:850">
   <input id="wfAutomatedDuesReminderToggle" type="checkbox" role="switch" aria-describedby="wfDuesReminderHelp" style="width:20px!important;height:20px;min-height:20px;padding:0!important;flex:0 0 20px;accent-color:#059669">
   <span>Automated monthly dues reminder</span>
  </label>
  <p id="wfDuesReminderHelp" class="muted" style="margin:0;font-size:.82rem">When enabled, members whose recorded contributions are below this school’s standard dues for the current month will see a gentle, personal reminder in the bottom ticker.</p>
  <p id="wfDuesReminderMsg" class="muted" role="status" aria-live="polite" style="margin:8px 0 0">Loading reminder setting…</p>
 </div></div>
 <div class="panel" id="wfSettingsPanel"><h3>School settings · Monthly dues</h3><p class="muted">Set the standard monthly contribution for this school. This setting is scoped to the current school account.</p><form id="wfDuesForm" class="grid"><div><label for="wfMonthlyDues">Standard monthly dues (GH₵)</label><input id="wfMonthlyDues" type="number" min="0" step=".01" required></div><div style="align-self:end"><button>Save monthly dues</button></div></form><p id="wfDuesMsg" class="muted"></p></div>
 <div class="panel" id="wfAdminAccessPanel"><h3>Administrator access &amp; recovery</h3><p class="muted">Change the password for the administrator currently signed in. New administrator invitations remain managed through the secure platform onboarding process; use <strong>Forgot password?</strong> on the school sign-in page for account recovery.</p><form id="wfChangePasswordForm" class="grid"><div><label for="wfCurrentAdminPassword">Current password</label><input id="wfCurrentAdminPassword" type="password" autocomplete="current-password" required></div><div><label for="wfNewAdminPassword">New password</label><input id="wfNewAdminPassword" type="password" autocomplete="new-password" minlength="8" maxlength="128" required><small class="muted">Use at least 8 characters.</small></div><div><label for="wfConfirmAdminPassword">Confirm new password</label><input id="wfConfirmAdminPassword" type="password" autocomplete="new-password" minlength="8" maxlength="128" required></div><div style="align-self:end"><button type="submit"><i class="fa-solid fa-key"></i> Update my password</button></div></form><p id="wfPasswordMsg" class="muted" role="status" aria-live="polite"></p><div class="wf-data-protection"><strong><i class="fa-solid fa-lock"></i> Account security</strong><p class="muted">Administrator access is linked to this school. Account invitations and deactivation are verified server-side.</p></div></div>
 <div class="panel" id="wfAdminUsersPanel"><h3>Register &amp; manage administrators</h3><p class="muted">Invite a new administrator by email. They must accept the invitation and set their own password. A school can have up to 10 active administrators.</p><form id="wfInviteAdminForm" class="grid"><div><label for="wfInviteAdminName">Full name / title</label><input id="wfInviteAdminName" maxlength="120" required placeholder="e.g. Welfare Secretary"></div><div><label for="wfInviteAdminUsername">Admin username</label><input id="wfInviteAdminUsername" maxlength="40" minlength="3" pattern="[A-Za-z0-9._-]{3,40}" required placeholder="e.g. welfare.secretary"></div><div><label for="wfInviteAdminEmail">Email address</label><input id="wfInviteAdminEmail" type="email" maxlength="254" required placeholder="name@example.com"></div><div style="align-self:end"><button type="submit"><i class="fa-solid fa-user-plus"></i> Send administrator invitation</button></div></form><p id="wfAdminUsersMsg" class="muted" role="status" aria-live="polite"></p><div style="overflow:auto"><table><thead><tr><th>Username</th><th>Name / Title</th><th>Status</th><th>Action</th></tr></thead><tbody id="wfAdminUsersRows"><tr><td colspan="4">Loading administrators…</td></tr></tbody></table></div><p class="muted">Deactivation removes this school’s portal access but does not delete the person’s Supabase identity.</p></div>
 <div class="grid"><div class="panel" id="wfAdminContributionPanel" style="grid-column:1/-1"><header style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:18px"><div><h2 style="margin:0 0 6px;font-size:clamp(1.4rem,3vw,1.9rem);font-weight:900;letter-spacing:-.035em">Contributions</h2><p class="muted" style="margin:0">Complete contribution records and financial logs.</p></div></header><section id="wfBulkContributionCard" style="margin:16px 0 20px;padding:18px;border:1px solid #dbe7e2;border-radius:15px;background:linear-gradient(145deg,#f7fffb,#fff)">
 <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap"><div><h3 style="margin:0 0 5px">Bulk Contribution Import</h3><p class="muted" style="margin:0;max-width:760px">Download a roster-filled workbook, enter amounts and covered months, then review the month-end dates and ledger references before saving.</p></div><span style="display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;background:#dcfce7;color:#166534;font-size:.72rem;font-weight:850"><i class="fa-solid fa-shield-check"></i> School-scoped import</span></div>
 <div style="display:flex;align-items:end;gap:12px;flex-wrap:wrap;margin-top:14px"><div style="min-width:150px;flex:0 0 170px"><label for="wfBulkContributionYear" style="margin-top:0">Contribution Year</label><select id="wfBulkContributionYear" aria-label="Contribution year"></select></div><button type="button" id="wfBulkContributionDownload"><i class="fa-solid fa-file-excel"></i> Download Pre-Filled Contribution Template</button><div><label for="wfBulkContributionFile" style="margin-top:0">Upload completed file (.xlsx or .csv)</label><input type="file" id="wfBulkContributionFile" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" style="max-width:330px"></div></div>
 <p id="wfBulkContributionMsg" class="muted" role="status" aria-live="polite" style="margin:10px 0 0">Blank or zero-amount rows are skipped. Each covered month is recorded separately at its calendar month-end.</p>
 </section><div class="wf-payout-metrics" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:18px 0"><article class="wf-payout-metric wf-payout-blue" style="border-left-color:#16a34a"><small>TOTAL CONTRIBUTIONS</small><strong id="wfConTotal">GH₵ 0.00</strong></article><article class="wf-payout-metric wf-payout-blue"><small>TOTAL DISBURSEMENT</small><strong id="wfConDisbursement">GH₵ 0.00</strong></article><article class="wf-payout-metric wf-payout-blue"><small>TOTAL NET FUND</small><strong id="wfConNet">GH₵ 0.00</strong></article></div><details class="wf-contribution-table-disclosure" style="margin-top:18px;padding-top:14px;border-top:1px solid #e8edf4"><summary style="cursor:pointer;font-weight:850;color:var(--ink)">View Contribution Table</summary><div class="wf-contribution-table-content"><section class="wf-payout-log"><div class="wf-payout-log-head"><div><h3>Financial Records</h3><p class="muted">School contribution history, including reversed records.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap;min-width:min(100%,260px)"><input id="wfLedgerSearch" type="search" aria-label="Search contributions" placeholder="Search teacher or reference" style="flex:1;min-width:180px"><input id="wfLedgerMonth" type="month" aria-label="Filter by month" style="width:165px"></div></div><div class="wf-payout-table-wrap"><table style="min-width:880px"><thead><tr><th>TEACHER</th><th>MONTH / YEAR</th><th>DESCRIPTION</th><th>AMOUNT</th><th>CUMULATIVE</th><th>DATE</th><th>ACTION</th></tr></thead><tbody id="wfConRows"><tr><td colspan="7">Loading contribution records…</td></tr></tbody></table></div></section></div></details><details style="margin-top:18px;padding-top:14px;border-top:1px solid #e8edf4"><summary style="cursor:pointer;font-weight:850;color:var(--ink)">Record a contribution</summary><form id="wfContribution" style="max-width:720px;padding-top:10px"><label>Teacher</label><select id="wfConTeacher" required style="width:100%;padding:12px"></select><label>Amount (GH₵)</label><input id="wfConAmount" type="number" min=".01" step=".01" required><label>Date</label><input id="wfConDate" type="date" required><label>Description</label><input id="wfConRef" maxlength="180"><p id="wfConMsg" class="muted"></p><button type="submit">Save contribution</button></form></details></div>
 <div class="panel wf-payout-view" id="wfAdminPayoutPanel"><header class="wf-payout-heading"><div><h2>Welfare &amp; Payouts</h2><p>Welfare fund disbursement history and support log.</p></div></header><div class="wf-payout-metrics"><article class="wf-payout-metric wf-payout-pink"><small>TOTAL PAYOUTS</small><strong id="wfPayoutTotal">GH₵ 0.00</strong></article><article class="wf-payout-metric wf-payout-blue"><small>CURRENT FUND</small><strong id="wfPayoutCurrentFund">GH₵ 0.00</strong></article><article class="wf-payout-metric wf-payout-purple"><small>ACTIVE MEMBERS</small><strong id="wfPayoutActiveMembers">0</strong></article></div><div class="wf-payout-log"><div class="wf-payout-log-head"><div><h3>Disbursement Log</h3><p class="muted">Search payout records and retain reversed transactions in the history.</p></div><input id="wfPayoutSearch" type="search" aria-label="Search payouts" placeholder="Search beneficiary, reference or reason"></div><div class="wf-payout-table-wrap"><table><thead><tr><th>REFERENCE</th><th>BENEFICIARY</th><th>REASON</th><th>AMOUNT</th><th>DATE</th><th>ACTION</th></tr></thead><tbody id="wfPayRows"></tbody></table></div></div><details class="wf-payout-entry"><summary>Record a welfare payout</summary><form id="wfPayout"><label>Teacher</label><select id="wfPayTeacher" required style="width:100%;padding:12px"></select><label>Amount (GH₵)</label><input id="wfPayAmount" type="number" min=".01" step=".01" required><label>Date</label><input id="wfPayDate" type="date" required><label for="wfPayReason">Reason</label><div class="wf-payout-reason-suggestions" role="group" aria-label="Standard welfare payout reasons" style="display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 10px"><button type="button" class="secondary" data-wf-payout-reason="Medical Support">Medical Support</button><button type="button" class="secondary" data-wf-payout-reason="Condolence Support">Condolence Support</button><button type="button" class="secondary" data-wf-payout-reason="Emergency Loan">Emergency Loan</button><button type="button" class="secondary" data-wf-payout-reason="Wedding / Celebration">Wedding / Celebration</button><button type="button" class="secondary" data-wf-payout-reason="General Welfare Support">General Welfare Support</button><button type="button" class="secondary" data-wf-payout-reason="Retirement / Exit Package">Retirement / Exit Package</button><button type="button" class="secondary" data-wf-payout-custom>Other / Custom Reason</button></div><input id="wfPayReason" maxlength="180" required placeholder="Choose a suggestion or enter a custom reason" autocomplete="off"><label>Reference</label><input id="wfPayRef" maxlength="180"><p id="wfPayMsg" class="muted"></p><button>Save payout</button></form></details></div></div>
 
 <div class="panel portal-audit-history-card" id="wfAuditPanel"><div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap"><h3>Audit history</h3><button id="wfAuditExport" type="button" class="secondary portal-audit-export-button">Export audit CSV</button></div><p class="muted">Export includes the currently loaded school-scoped audit records, up to 300 entries.</p><div class="grid"><div><label for="wfAuditSearch">Search audit records</label><input id="wfAuditSearch" placeholder="Search action, actor, details…"></div><div><label for="wfAuditCategory">Category</label><select id="wfAuditCategory"><option value="">All categories</option><option>Welfare portal</option><option>Contribution</option><option>Payout</option><option>Teacher</option></select></div></div><p id="wfAuditMsg" class="muted">Loading audit history…</p><div style="overflow:auto"><table><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Details</th><th>Status</th></tr></thead><tbody id="wfAuditRows"><tr><td colspan="5">Loading…</td></tr></tbody></table></div></div>
  <!-- Destructive reset intentionally placed last in the Administration Panel. -->
  <div class="panel" id="wfResetDataPanel"><h3>Reset this school’s welfare data</h3><div class="wf-data-protection"><strong><i class="fa-solid fa-triangle-exclamation"></i> Permanent action</strong><p class="muted">This deletes only this school’s registered members, contribution records, payout records and transaction-reversal records. The audit history and school settings are preserved. This cannot be undone.</p></div><form id="wfResetDataForm" class="grid"><div><label for="wfResetPassword">Current administrator password</label><input id="wfResetPassword" type="password" autocomplete="current-password" required></div><div><label for="wfResetConfirmation">School-specific confirmation</label><input id="wfResetConfirmation" required autocomplete="off" placeholder="RESET:SCHOOLCODE"><small id="wfResetExpected" class="muted">Confirmation phrase will appear after the school loads.</small></div><div><label for="wfResetAllConfirmation">Final safety phrase</label><input id="wfResetAllConfirmation" required autocomplete="off" pattern="RESET ALL" title="Type RESET ALL exactly" placeholder="Type RESET ALL"><small class="muted">Required second confirmation before any records can be cleared.</small></div><div><button type="submit" class="danger"><i class="fa-solid fa-trash-can"></i> Permanently reset this school’s welfare data</button></div></form><p id="wfResetDataMsg" class="muted" role="status" aria-live="polite"></p></div>
</section>
 <div class="panel" id="wfTeacherRegisterPanel"><div class="wf-teacher-register-heading"><div><h3 class="wf-register-title"><svg class="wf-ui-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M12 3 19 6v5c0 4.5-2.8 8-7 10-4.2-2-7-5.5-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/></svg> Teacher Register</h3><p class="muted">Manage verified members of this school. Changes are saved to this school’s teacher records; existing financial history is preserved.</p></div><span class="wf-teacher-register-badge"><svg class="wf-ui-icon wf-badge-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M12 3 19 6v5c0 4.5-2.8 8-7 10-4.2-2-7-5.5-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/></svg> Admin access</span></div>
  <section id="wfBulkTeacherCard" class="panel" style="margin:0 0 18px;padding:18px;border:1px solid var(--line);border-radius:16px">
   <h3 class="wf-bulk-title"><svg class="wf-ui-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><rect x="3.5" y="4" width="17" height="16" rx="2"/><path d="M8 8h8M8 12h8M8 16h3M16 15v3m-1.5-1.5h3"/></svg> Bulk Register Teachers via Template</h3>
   <ol class="wf-bulk-steps"><li><span class="wf-step-number">1</span><span>Download the teacher template.</span></li><li><span class="wf-step-number">2</span><span>Fill in one teacher per row in Excel. Format the <strong>Phone</strong> and <strong>Staff ID</strong> columns as <strong>Text</strong> to preserve leading zeros.</span></li><li><span class="wf-step-number">3</span><span>Upload the completed file, review the preview, and confirm.</span></li></ol>
   <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><button type="button" id="wfBulkTeacherDownload"><i class="fa-solid fa-download"></i> Download Template</button><button type="button" id="wfBulkTeacherChoose" class="secondary"><i class="fa-solid fa-file-arrow-up"></i> Upload Filled Template</button><input type="file" id="wfBulkTeacherFile" accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" hidden></div>
   <p id="wfBulkTeacherMsg" class="muted" role="status" aria-live="polite" style="margin:10px 0 0"></p>
  </section>
  <label for="wfTeacherSearch">Search teachers</label><input id="wfTeacherSearch" type="search" placeholder="Search teachers">
 <form id="wfTeacher" class="grid">
 <div><label for="wfTid">Staff ID</label><input id="wfTid" required maxlength="80"></div><div><label for="wfName">Full name</label><input id="wfName" required maxlength="160"></div>
 <div><label for="wfPhone">Phone</label><input id="wfPhone" maxlength="40"></div><div><label for="wfRank">Rank / Grade</label><select id="wfRank" style="width:100%;min-height:44px;padding:10px 12px;border:1px solid #dbe2ec;border-radius:10px;background:#fff;color:#0f172a;box-sizing:border-box">${rankOptionsMarkup()}</select></div>
 <div><label for="wfClass">Class / Subject / Responsibility</label><input id="wfClass" maxlength="100" placeholder="e.g. Primary 6, Mathematics"></div><div><label for="wfMembershipType">Membership Type</label><select id="wfMembershipType"><option value="">Select membership type</option><option value="Permanent">Permanent</option><option value="Temporal">Temporal</option></select></div><div><label for="wfEmployer">Employer</label><select id="wfEmployer"><option value="">Select employer</option><option value="GES">GES</option><option value="NGO">NGO</option><option value="NSA">NSA</option></select></div><div><label for="wfPassport">Passport photograph (optional)</label><div class="wf-passport-upload"><input id="wfPassport" type="file" accept="image/jpeg,image/png,image/webp"></div><small class="muted wf-passport-help">JPEG, PNG or WebP; maximum 3 MB. Leave blank to keep the current photo.</small><div id="wfPassportPreview" class="muted" aria-live="polite"></div></div><div style="align-self:end;display:flex;gap:8px;flex-wrap:wrap"><button id="wfTeacherSave" type="submit">Register teacher</button><button id="wfTeacherCancel" class="secondary" type="button">Cancel edit</button></div></form><p id="wfTeacherMsg" class="muted" role="status" aria-live="polite"></p><div class="wf-teacher-register-table" style="overflow:auto"><table><thead><tr><th>Staff ID</th><th>Name</th><th>Phone</th><th>Rank</th><th>Class</th><th>Membership Type</th><th>Employer</th><th>Status</th><th>Profile actions</th></tr></thead><tbody id="wfManageTeacherRows"></tbody></table></div></div>
 
 <section class="wf-reports-view hidden" id="wfReportsPanel"><header class="wf-reports-heading"><div><h2>Statements &amp; Reports</h2><p>Generate individual member statements or executive fund summary reports instantly.</p></div><span class="wf-reports-admin-status"><i class="fa-solid fa-shield-check"></i> Administrator access active</span></header><div class="wf-report-cards"><article class="wf-report-card wf-report-card-rose"><div class="wf-report-card-icon wf-report-icon-blue"><i class="fa-solid fa-file-lines"></i></div><div class="wf-report-card-content"><h3>Individual Statement</h3><p>Generate a comprehensive, print-ready official A4 statement for the selected member account.</p><label for="wfStatementTeacher">Select Member Account</label><select id="wfStatementTeacher" aria-label="Select Member Account"></select><div class="wf-report-actions"><button id="wfStatementPdf" type="button" class="wf-report-button wf-report-button-rose"><i class="fa-solid fa-file-pdf"></i> Download Member Statement</button><button id="wfStatementShare" type="button" class="wf-report-button wf-report-button-share wf-report-button-rose-share"><i class="fa-solid fa-share-nodes"></i> Share PDF</button></div><p id="wfStatementMsg" class="wf-report-message" role="status" aria-live="polite"></p></div></article><article class="wf-report-card wf-report-card-amber"><div class="wf-report-card-icon wf-report-icon-orange"><i class="fa-solid fa-calendar-days"></i></div><div class="wf-report-card-content"><h3>Monthly Summary Report</h3><p>Administrator access active. Select target month to generate report.</p><div class="wf-month-year-picker" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;max-width:560px;margin-bottom:13px"><div><label for="wfReportMonth">Select Month</label><select id="wfReportMonth" aria-label="Select reporting month"></select></div><div><label for="wfReportYear">Select Year</label><select id="wfReportYear" aria-label="Select reporting year"></select></div></div><div class="wf-report-actions"><button id="wfMonthlyPdf" type="button" class="wf-report-button wf-report-button-orange"><i class="fa-solid fa-file-pdf"></i> Download Monthly Summary (Admin)</button><button id="wfMonthlyShare" type="button" class="wf-report-button wf-report-button-share wf-report-button-orange-share"><i class="fa-solid fa-share-nodes"></i> Share PDF</button></div><p id="wfMonthlyReportMsg" class="wf-report-message" role="status" aria-live="polite"></p></div></article><article class="wf-report-card wf-report-card-violet"><div class="wf-report-card-icon wf-report-icon-purple"><i class="fa-solid fa-calendar-check"></i></div><div class="wf-report-card-content"><h3>Yearly Summary Report</h3><p>Select a calendar year to download that year’s school-wide contribution and welfare payout summary.</p><label for="wfAnnualYear">Select Year</label><select id="wfAnnualYear" aria-label="Select annual report year"></select><div class="wf-report-actions"><button id="wfAnnualPdf" type="button" class="wf-report-button wf-report-button-purple"><i class="fa-solid fa-file-pdf"></i> Download Yearly Summary (Admin)</button><button id="wfAnnualShare" type="button" class="wf-report-button wf-report-button-share wf-report-button-purple-share"><i class="fa-solid fa-share-nodes"></i> Share PDF</button></div><p id="wfAnnualReportMsg" class="wf-report-message" role="status" aria-live="polite"></p></div></article><article class="wf-report-card wf-report-card-emerald"><div class="wf-report-card-icon wf-report-icon-green"><i class="fa-solid fa-chart-column"></i></div><div class="wf-report-card-content"><h3>Complete Fund Summary</h3><p>Administrator access is active. You can generate the complete fund report.</p><div class="wf-report-actions"><button id="wfCompletePdf" type="button" class="wf-report-button wf-report-button-green"><i class="fa-solid fa-file-pdf"></i> Download Complete Summary (Admin)</button><button id="wfCompleteShare" type="button" class="wf-report-button wf-report-button-share wf-report-button-green-share"><i class="fa-solid fa-share-nodes"></i> Share PDF</button></div><p id="wfCompleteReportMsg" class="wf-report-message" role="status" aria-live="polite"></p></div></article><article class="wf-report-card wf-report-card-indigo"><div class="wf-report-card-icon wf-report-icon-blue"><i class="fa-solid fa-chart-bar"></i></div><div class="wf-report-card-content"><h3>Statistics of Payment</h3><p>View each active member’s payment completion for the selected calendar year.</p><label for="wfPaymentStatsYear">Select Year</label><select id="wfPaymentStatsYear" aria-label="Select payment statistics year"></select><button id="wfPaymentStatsPdf" type="button" class="wf-report-button wf-report-button-indigo"><i class="fa-solid fa-file-pdf"></i> Download Statistics PDF</button><p id="wfPaymentStatsMsg" class="wf-report-message" role="status" aria-live="polite"></p></div></article></div>
<article class="wf-report-card wf-report-card-emerald wf-dues-matrix-card" id="wfDuesMatrixCard">
 <div class="wf-report-card-content">
  <h3><i class="fa-solid fa-table-cells-large" aria-hidden="true"></i> Month-by-Month Dues Matrix</h3>
  <p>Teacher-by-month contribution overview for the selected calendar year. Only active, non-reversed contributions are counted.</p>
  <div class="wf-dues-matrix-controls">
   <div><label for="wfDuesMatrixYear">Select Year</label><select id="wfDuesMatrixYear" aria-label="Select dues matrix year"></select></div>
   <div><label for="wfDuesMatrixSearch">Find Teacher / Staff ID</label><input id="wfDuesMatrixSearch" type="search" placeholder="Search name or Staff ID" autocomplete="off"></div>
  </div>
  <p class="wf-dues-matrix-legend"><span class="wf-dues-matrix-paid">✓ Paid</span><span class="wf-dues-matrix-unpaid">— Unpaid / missing</span><span class="muted">Amounts are shown in GH₵.</span></p>
  <div class="wf-dues-matrix-export-actions" style="display:flex;justify-content:flex-end;gap:9px;flex-wrap:wrap;margin:0 0 12px">
   <button id="wfDuesMatrixPdf" type="button" class="wf-report-button wf-report-button-green" style="background:linear-gradient(135deg,#10b981,#047857)!important;border:1px solid #047857!important;color:#fff!important;box-shadow:0 5px 14px rgba(5,150,105,.18)!important"><i class="fa-solid fa-file-pdf" aria-hidden="true"></i> Download Dues Matrix (PDF)</button>
  </div>
  <p id="wfDuesMatrixStatus" class="wf-report-message" role="status" aria-live="polite"></p>
  <div class="wf-dues-matrix-scroll" role="region" aria-label="Teacher by month dues matrix" tabindex="0">
   <table class="wf-dues-matrix-table"><thead><tr><th scope="col">Teacher / Staff ID</th><th scope="col">Jan</th><th scope="col">Feb</th><th scope="col">Mar</th><th scope="col">Apr</th><th scope="col">May</th><th scope="col">Jun</th><th scope="col">Jul</th><th scope="col">Aug</th><th scope="col">Sep</th><th scope="col">Oct</th><th scope="col">Nov</th><th scope="col">Dec</th></tr></thead><tbody id="wfDuesMatrixRows"><tr><td colspan="13">Loading dues matrix…</td></tr></tbody></table>
  </div>
  
 </div>
</article>
<div class="wf-report-footer"><p id="wfReportMsg" class="muted" role="status" aria-live="polite">Reports include records visible to this authenticated school administrator only.</p><button id="wfExportCsv" type="button" class="wf-report-csv"><i class="fa-solid fa-file-csv"></i> Export ledgers CSV</button></div></section>`;
 // Financial workspaces are independent sidebar destinations, not admin-panel cards.
 const contributionWorkspace=d.querySelector('#wfAdminContributionPanel');
 const payoutWorkspace=d.querySelector('#wfAdminPayoutPanel');
 if(contributionWorkspace)d.appendChild(contributionWorkspace);
 if(payoutWorkspace)d.appendChild(payoutWorkspace);
 const dash=$('dashboard');if(dash)dash.appendChild(d);
 // Ensure the dues-matrix export control is present in the live, mounted card.
 // This is intentionally idempotent so repeated Admin Panel renders cannot duplicate it.
 const duesMatrixCard=d.querySelector('#wfDuesMatrixCard');
 const duesMatrixContent=duesMatrixCard?.querySelector('.wf-report-card-content');
 if(duesMatrixContent&&!duesMatrixContent.querySelector('#wfDuesMatrixPdf')){
  const exportActions=document.createElement('div');
  exportActions.className='wf-dues-matrix-export-actions';
  exportActions.style.cssText='display:flex;justify-content:flex-end;gap:9px;flex-wrap:wrap;margin:0 0 12px';
  exportActions.innerHTML='<button id="wfDuesMatrixPdf" type="button" class="wf-report-button wf-report-button-green" style="display:inline-flex!important;visibility:visible!important;opacity:1!important;background:linear-gradient(135deg,#10b981,#047857)!important;border:1px solid #047857!important;color:#fff!important;min-height:46px;padding:11px 17px;border-radius:11px;font-weight:850;box-shadow:0 5px 14px rgba(5,150,105,.18)!important"><i class="fa-solid fa-file-pdf" aria-hidden="true"></i> Download Dues Matrix (PDF)</button>';
  const legend=duesMatrixContent.querySelector('.wf-dues-matrix-legend');
  if(legend)legend.insertAdjacentElement('afterend',exportActions);else duesMatrixContent.appendChild(exportActions);
 }

 // Bind the Admin Panel quick-action navigation after its workflow markup is mounted.
 const adminQuickNav=d.querySelector('.wf-admin-quick-actions');
 if(adminQuickNav&&!adminQuickNav.dataset.bound){
  adminQuickNav.dataset.bound='true';
  adminQuickNav.querySelectorAll('[data-wf-admin-target]').forEach(function(link){
   link.addEventListener('click',function(event){
    const target=d.querySelector('#'+link.dataset.wfAdminTarget);
    if(!target)return;
    event.preventDefault();
    adminQuickNav.querySelectorAll('[data-wf-admin-target]').forEach(function(item){
     const active=item===link;
     item.classList.toggle('is-active',active);
     if(active)item.setAttribute('aria-current','location');else item.removeAttribute('aria-current');
    });
    target.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
    if(history.replaceState)history.replaceState(null,'','#'+target.id);
   });
  });
 }

 // Guard the contribution form before the rest of workflow initialization runs.
 // If an earlier optional setup step fails, the browser must never submit the form
 // natively (which reloads the portal and can send the admin back to the gateway).
 const contributionFormGuard=$('wfContribution');
 if(contributionFormGuard&&!contributionFormGuard.dataset.nativeSubmitGuard){
  contributionFormGuard.dataset.nativeSubmitGuard='1';
  contributionFormGuard.addEventListener('submit',event=>{
   event.preventDefault();
   if(typeof contributionFormGuard.onsubmit!=='function'){
    const status=$('wfConMsg');
    if(status){status.textContent='The contribution form is still initializing. Please wait a moment and try again.';status.className='muted';}
   }
  },true);
 }
 // Keep every reporting year selector rolling forward with the calendar and
 // with the newest year present in this school's already-loaded records.
 window.populateReportYearSelectors=(records=[])=>{
   const now=new Date(),currentYear=now.getFullYear(),yearSet=new Set([currentYear]);
   const readYear=value=>{
     if(value===null||value===undefined||value==='')return;
     const text=String(value).trim();
     const match=text.match(/^(\d{4})/)||text.match(/(?:^|\D)(\d{4})(?:\D|$)/);
     const year=Number(match?.[1]);
     if(Number.isInteger(year)&&year>=2016&&year<=9999)yearSet.add(year);
   };
   (Array.isArray(records)?records:[]).forEach(row=>{
     if(!row||typeof row!=='object')return;
     ['date','contribution_date','payment_date','payout_date','created_at','updated_at','month','period','year','transaction_date'].forEach(key=>readYear(row[key]));
   });
   const newestYear=Math.max(...yearSet,currentYear);
   const years=Array.from({length:newestYear-2016+1},(_,index)=>newestYear-index);
   const monthSelect=$('wfReportMonth'),monthlySelect=$('wfReportYear'),annualSelect=$('wfAnnualYear'),statsSelect=$('wfPaymentStatsYear'),matrixSelect=$('wfDuesMatrixYear');
   const replaceYears=(select)=>{
     if(!select)return;
     const previous=String(select.value||'');
     select.replaceChildren(...years.map(year=>new Option(String(year),String(year))));
     select.disabled=false;
     select.value=years.includes(Number(previous))?previous:String(currentYear);
   };
   if(monthSelect){
     const previousMonth=String(monthSelect.value||'');
     const monthNames=Array.from({length:12},(_,index)=>new Date(2000,index,1).toLocaleDateString('en-GH',{month:'long'}));
     monthSelect.replaceChildren(...monthNames.map((name,index)=>new Option(name,String(index+1).padStart(2,'0'))));
     monthSelect.disabled=false;
     monthSelect.value=/^(0[1-9]|1[0-2])$/.test(previousMonth)?previousMonth:String(now.getMonth()+1).padStart(2,'0');
   }
   [monthlySelect,annualSelect,statsSelect,matrixSelect].forEach(replaceYears);
 };
 window.populateReportYearSelectors();
 // Keep audit history in its own view, outside the restricted management workspace.
 const auditPanel=$('wfAuditPanel');
 if(dash&&auditPanel){
   const auditView=document.createElement('section');
   auditView.id='wfAuditView';
   auditView.className='portal-audit-view hidden';
   auditView.setAttribute('aria-labelledby','wfAuditViewTitle');
   auditView.innerHTML='<div class="panel portal-audit-heading-card"><div class="wf-admin-eyebrow"><i class="fa-solid fa-shield-halved"></i> Accountability</div><h2 id="wfAuditViewTitle">Audit Trail Dashboard</h2><p class="muted">Review this school’s audit history separately from management tasks.</p></div>';
   auditPanel.parentElement?.removeChild(auditPanel);
   auditView.appendChild(auditPanel);
   const auditAccentStyle=document.createElement('style');
   auditAccentStyle.id='portal-audit-profile-accent-style';
   auditAccentStyle.textContent='.portal-audit-heading-card{border-top:5px solid #0f766e!important}.portal-audit-history-card{border-top:5px solid #2563eb!important}.portal-audit-export-button{background:linear-gradient(135deg,#3b82f6,#1d4ed8)!important;color:#fff!important;border-color:#1d4ed8!important}.teacher-profile-card-rose{border-top:5px solid #db2777!important;padding-top:calc(24px - 4px)!important;border-top-left-radius:var(--radius-lg,22px)!important;border-top-right-radius:var(--radius-lg,22px)!important}.teacher-profile-print-button{background:linear-gradient(120deg,#ec4899,#db2777)!important;color:#fff!important;border:1px solid #db2777!important}.dark .portal-audit-heading-card{border-top-color:#0f766e!important}.dark .portal-audit-history-card{border-top-color:#2563eb!important}.dark .teacher-profile-card-rose{border-top-color:#db2777!important}';
   if(!document.getElementById(auditAccentStyle.id))document.head.appendChild(auditAccentStyle);
   dash.appendChild(auditView);
 }
 ['wfConDate','wfPayDate'].forEach(id=>$(id).value=today());
}
function msg(id,s,bad){const el=$(id);if(!el)return;el.textContent=String(s??'');el.className=bad?'error':'muted';}
async function audit(client,ctx,action,details,teacherId){
 const {data:{user}}=await client.auth.getUser();
 const {error}=await client.from('audit_logs').insert({id:crypto.randomUUID(),actor_name:user?.email||'School administrator',category:'Welfare portal',action,details,target_teacher_id:teacherId||null,status:'success',time_string:new Date().toLocaleString(),school_id:ctx.id});
 if(error){console.warn('Audit log insert failed',error.message);return false;}
 return true;
}
window.initSchoolWorkflows=async function(client,school,refresh){
 let workflowStage='administrator session verification';
 window.__welfareWorkflowLastError=null;
 const awaitWorkflowAuth=(value,ms,label)=>{let timer;return Promise.race([Promise.resolve(value),new Promise((_,reject)=>{timer=window.setTimeout(()=>reject(new Error(label||'The request timed out.')),ms);})]).finally(()=>{if(timer)window.clearTimeout(timer);});};
 // DEMO receives a dedicated in-memory client from demo-sandbox.js. Every query
 // and mutation below is therefore scoped to this local sandbox, never Supabase.
 const isLocalDemo=!!client?.__welfareDemo&&String(school?.school_code||'').toUpperCase()==='DEMO';
 const workflowSchoolKey=String(school?.id||'');
 const workflowSchoolCode=String(school?.school_code||school?.schoolCode||'').trim().toUpperCase();
 let workflowUserId='demo-local-admin';
 let workflowAdminIdentity=window.WelfareDemo?.getCurrentUser?.()||null;
 if(!isLocalDemo){
  if(!workflowSchoolKey||!workflowSchoolCode)throw new Error('The verified school ID or school code is missing. Refresh the school gateway and retry.');
  const requestedCodeRaw=String(new URLSearchParams(location.search).get('c')||'').trim().toUpperCase();
  const requestedCode=requestedCodeRaw==='NTONSO-A-0'?'NTONSO-A-01':requestedCodeRaw;
  if(requestedCode&&requestedCode!==workflowSchoolCode)throw new Error('The signed-in school does not match this gateway link. Sign in through the correct school URL.');
  const sessionResult=await awaitWorkflowAuth(client.auth.getSession(),15000,'Administrator session restoration timed out.');
  if(sessionResult?.error)throw new Error('Administrator session restoration failed: '+(sessionResult.error.message||'Please sign in again.'));
  let session=sessionResult?.data?.session||null;
  if(session?.access_token&&Number(session.expires_at||0)>0&&Number(session.expires_at)*1000<Date.now()+60000){const refreshed=await awaitWorkflowAuth(client.auth.refreshSession(),15000,'Administrator session refresh timed out.');if(refreshed?.error||!refreshed?.data?.session?.access_token)throw new Error('Administrator session expired and could not be refreshed. Sign in again.');session=refreshed.data.session;}
  if(!session?.access_token)throw new Error('No active administrator session is available to load school records. Sign in again.');
  const identity=await awaitWorkflowAuth(client.auth.getUser(),15000,'Administrator identity verification timed out.');
  if(identity?.error||!identity?.data?.user||String(identity.data.user.id)!==String(session.user?.id||''))throw new Error('The administrator session identity could not be verified. Sign in again.');
  workflowUserId=String(identity.data.user.id);
  workflowAdminIdentity=identity.data.user;
  window.__welfareWorkflowAdminIdentity=workflowAdminIdentity;
  if(window.__welfareAdminSessionUserId&&String(window.__welfareAdminSessionUserId)!==workflowUserId)throw new Error('The active administrator account changed. Refresh the portal before continuing.');
 }
 if(workflowSchoolKey&&window.__welfareWorkflowReadySchoolId===workflowSchoolKey&&window.__welfareWorkflowReadyUserId===workflowUserId&&$('workflows')&&$('wfAdminPanel')&&$('teacherProfileViewer')&&$('schoolTeachers')&&$('wfAdminContributionPanel')&&$('wfAdminPayoutPanel'))return true;
 if(window.__welfareWorkflowReadySchoolId&&window.__welfareWorkflowReadySchoolId!==workflowSchoolKey){window.__welfareWorkflowReadySchoolId=null;window.__welfareWorkflowReadyUserId=null;}
 window.__welfareCurrentRole='admin';window.__welfareSetRoleMarker?.('admin');
 window.__welfareCurrentSchool=school;
 try{
 workflowStage='administrator workspace mounting';
 // Yield for two browser paints, then continue without waiting for an
 // idle callback that can be postponed indefinitely on busy mobile devices.
 await new Promise(resolve=>window.requestAnimationFrame(()=>window.requestAnimationFrame(resolve)));
 if(isLocalDemo&&window.__welfareDemoRole!=='admin')return false;
 // Rebuild workflow markup on refresh so handlers always use the latest school-scoped data.
 const existingWorkflows=$('workflows');const retainedRoster=$('schoolTeachers');const overview=$('schoolOverview');if(existingWorkflows&&retainedRoster&&existingWorkflows.contains(retainedRoster)&&overview?.parentElement)overview.parentElement.insertBefore(retainedRoster,overview.nextElementSibling);retainedRoster?.querySelector('#wfTeacherRegisterPanel')?.remove();if(existingWorkflows)existingWorkflows.remove();
 workflowStage='administrator section construction';
 addUI();
 // Re-render shared dashboard charts after the Admin hub exists, so the Admin-only
 // chart exclusion is applied even if the first chart render ran during early hydration.
 if(window.__welfareFinancialChartPending)window.__welfareRenderFinancialCharts?.(window.__welfareFinancialChartPending);
 const workflowMountNode=$('workflows');
 const adminPanelNode=$('wfAdminPanel');
 if(!workflowMountNode||!adminPanelNode)throw new Error('Admin Panel markup could not be mounted in the dashboard.');
 const roster=$('schoolTeachers'),teacherRegisterPanel=$('wfTeacherRegisterPanel');
 const ctx=school;
 window.__welfareCurrentSchool=ctx;
 // Tenant crest is stored per verified school code; no shared/global logo key is used.
 const logoCard=$('tenantSchoolLogoCard'),logoInput=$('tenantSchoolLogoFile'),logoPreview=$('tenantSchoolLogoPreview'),logoRemove=$('tenantSchoolLogoRemove'),logoStatus=$('tenantSchoolLogoStatus');
 const logoCode=String(ctx.school_code||ctx.schoolCode||'').trim();
 const logoStorageKey=logoCode?'welfare_logo_'+logoCode:'';
 const readSchoolLogo=()=>{
  let saved='';try{saved=logoStorageKey?localStorage.getItem(logoStorageKey)||'':'';}catch(_){}
  const value=saved||ctx.logo_data_url||ctx.logoDataUrl||ctx.school_logo||ctx.logo||'';
  return /^data:image\/png;base64,[a-z0-9+/=]+$/i.test(String(value))?String(value):'';
 };
 const renderSchoolLogo=()=>{
  const value=readSchoolLogo();
  if(logoPreview){if(value){logoPreview.src=value;logoPreview.hidden=false;}else{logoPreview.removeAttribute('src');logoPreview.hidden=true;}}
  if(logoRemove)logoRemove.disabled=!value;
  if($('tenantLogoSchoolName'))$('tenantLogoSchoolName').textContent=ctx.name||'School profile';
  if($('tenantLogoSchoolCode'))$('tenantLogoSchoolCode').textContent=logoCode?'School code: '+logoCode:'School code unavailable';
 };
 if(logoCard&&logoCode){
  logoCard.hidden=false;renderSchoolLogo();
  if(logoInput){
   logoInput.onchange=async event=>{
    const file=event.target.files?.[0];if(!file)return;
    const allowed=['image/png','image/jpeg','image/webp','image/svg+xml'];
    if(!allowed.includes(String(file.type||'').toLowerCase())){if(logoStatus)logoStatus.textContent='Choose a PNG, JPEG, WebP or SVG image.';logoInput.value='';return;}
    if(file.size>3*1024*1024){if(logoStatus)logoStatus.textContent='The logo file must be 3 MB or smaller.';logoInput.value='';return;}
    let objectUrl='';
    try{
     if(logoStatus)logoStatus.textContent='Preparing school crest…';
     let image;
     if(typeof createImageBitmap==='function'){
      try{image=await createImageBitmap(file);}catch(_){}
     }
     if(!image){
      objectUrl=URL.createObjectURL(file);
      image=await new Promise((resolve,reject)=>{
       const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('The selected image could not be decoded.'));
       img.src=objectUrl;
      });
     }
     const width=Number(image.width||image.naturalWidth||0),height=Number(image.height||image.naturalHeight||0);
     if(!width||!height||width>10000||height>10000)throw new Error('The image dimensions are invalid or too large.');
     const scale=Math.min(1,256/Math.max(width,height)),canvas=document.createElement('canvas');
     canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));
     const context=canvas.getContext('2d',{alpha:true});if(!context)throw new Error('Image processing is unavailable in this browser.');
     context.clearRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
     const dataUrl=canvas.toDataURL('image/png');
     if(!/^data:image\/png;base64,/.test(dataUrl))throw new Error('The school logo could not be normalized.');
     try{localStorage.setItem(logoStorageKey,dataUrl);}catch(_){throw new Error('This browser could not save the school logo. Free some device storage and try again.');}
     ctx.logo_data_url=dataUrl;ctx.logoDataUrl=dataUrl;window.__welfareCurrentSchool=ctx;
     renderSchoolLogo();if(logoStatus)logoStatus.textContent='School logo saved for '+logoCode+'. It will appear in future PDF reports and member statements.';
     if(image.close)image.close();
    }catch(error){if(logoStatus)logoStatus.textContent=error?.message||'The logo could not be saved.';}
    finally{if(objectUrl)URL.revokeObjectURL(objectUrl);logoInput.value='';}
   };
  }
  if(logoRemove){
   logoRemove.onclick=()=>{
    try{localStorage.removeItem(logoStorageKey);}catch(_){}
    delete ctx.logo_data_url;delete ctx.logoDataUrl;delete ctx.school_logo;delete ctx.logo;
    window.__welfareCurrentSchool=ctx;renderSchoolLogo();
    if(logoStatus)logoStatus.textContent='School logo removed. Future PDF exports will use the standard text-only header.';
    if(logoInput)logoInput.value='';
   };
  }
 }
 workflowStage='school settings hydration';
 let standardMonthlyDues=0;
 // This workflow-only preference read must not stall account Settings or the
 // rest of the administrator workspace. Use the saved value when it responds;
 // otherwise keep the safe zero/default and allow the workflow to finish mounting.
 // Load the configured rate independently. This optional dashboard
 // metadata must never hold workflow mounting or the first profile render.
 void (async()=>{
  let timer;
  try{
   const initialDuesResult=await Promise.race([
    client.from('system_settings').select('value').eq('school_id',ctx.id).eq('key','standard_dues').maybeSingle(),
    new Promise(resolve=>{timer=setTimeout(()=>resolve({data:null,error:{message:'Timed out while loading standard monthly dues.'}}),8000);})
   ]);
   const {data:initialDuesSetting,error:initialDuesError}=initialDuesResult||{};
   if(!initialDuesError&&initialDuesSetting){
    standardMonthlyDues=Number(initialDuesSetting.value||0);
    const duesInput=$('wfMonthlyDues');
    if(duesInput)duesInput.value=standardMonthlyDues;
    if(standardMonthlyDues>0)window.updateSchoolMonthlyDuesMetric?.(standardMonthlyDues);
   }else if(initialDuesError)console.warn('[School settings] Could not load saved standard monthly dues:',initialDuesError.message);
  }catch(error){console.warn('[School settings] Monthly dues hydration deferred:',error?.message||error);}
  finally{if(timer)clearTimeout(timer);}
 })();
 // Capture the monthly dues form submit before any browser-level form navigation can occur.
 const duesForm=$('wfDuesForm');
 if(duesForm){
   duesForm.addEventListener('submit',async event=>{
     event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
     const input=$('wfMonthlyDues'),button=duesForm.querySelector('button[type="submit"],button:not([type])');
     const value=Number(input?.value);
     if(!Number.isFinite(value)||value<0){msg('wfDuesMsg','Enter a valid monthly dues amount.',true);return;}
     if(button)button.disabled=true;
     msg('wfDuesMsg','Saving monthly dues…');
     try{
       const {error}=await client.from('system_settings').upsert(
         {school_id:ctx.id,key:'standard_dues',value:String(value)},
         {onConflict:'school_id,key'}
       );
       if(error)throw error;
       standardMonthlyDues=value;
       if(ctx&&typeof ctx==='object'){ctx.monthly_dues=value;window.__welfareCurrentSchool=ctx;}
       window.schoolSettings=Object.assign({},window.schoolSettings||{},{standard_dues:value,monthly_dues:value});
       window.updateSchoolMonthlyDuesMetric?.(value);
       const auditOk=await audit(client,ctx,'Update monthly dues','GH₵ '+value.toFixed(2));
       msg('wfDuesMsg',auditOk?'Standard monthly dues updated successfully.':'Monthly dues were saved, but the audit entry could not be recorded.',!auditOk);
     }catch(error){
       console.error('[School settings] Monthly dues save failed:',error);
       msg('wfDuesMsg','Monthly dues could not be saved. Please check your connection and school settings permissions, then try again.',true);
     }finally{if(button)button.disabled=false;}
   },true);
 }

 workflowStage='teacher register mounting';
 if(!roster||!teacherRegisterPanel)throw new Error('Teachers & Members workspace could not be mounted.');
 roster.appendChild(teacherRegisterPanel);
 // School-scoped administrator activity ticker. The existing audit-log RLS policy
 // permits only an active administrator to read records for their own school.
 if(window.__adminActivityTickerTimer){clearInterval(window.__adminActivityTickerTimer);window.__adminActivityTickerTimer=null;}
 document.getElementById('adminActivityTicker')?.remove();
 document.body.classList.add('admin-activity-ticker-active');
 let adminTickerStyles=document.getElementById('adminActivityTickerStyles');
 if(!adminTickerStyles){
   adminTickerStyles=document.createElement('style');adminTickerStyles.id='adminActivityTickerStyles';
   adminTickerStyles.textContent=`
    #adminActivityTicker{position:fixed;z-index:1200;left:0;right:0;bottom:0;min-height:48px;display:flex;align-items:center;gap:10px;padding:6px 12px calc(6px + env(safe-area-inset-bottom));background:linear-gradient(112deg,#061326 0%,#0d2544 46%,#102f54 72%,#07172c 100%);border-top:1px solid rgba(255,255,255,.14);box-shadow:0 -12px 34px rgba(3,10,22,.24),inset 0 1px rgba(255,255,255,.08);color:#fff;overflow:hidden}
    #adminActivityTicker:before{content:'';position:absolute;left:0;right:0;top:0;height:2px;background:linear-gradient(90deg,#8b6722,#f8df91 22%,#d6a637 52%,#fff0bd 72%,#8b6722)}
    #adminActivityTicker:after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(100deg,rgba(255,255,255,.055),transparent 30%,transparent 70%,rgba(255,255,255,.035))}
    #adminActivityTicker .admin-ticker-brand{position:relative;z-index:1;flex:0 0 auto;display:flex;align-items:center;gap:9px;padding:8px 12px;border:1px solid rgba(230,190,91,.34);border-radius:12px;background:linear-gradient(145deg,rgba(255,255,255,.12),rgba(255,255,255,.035));box-shadow:inset 0 1px rgba(255,255,255,.1),0 4px 14px rgba(0,0,0,.12)}
    #adminActivityTicker .admin-ticker-brand-icon{width:28px;height:28px;display:grid;place-items:center;border-radius:9px;background:linear-gradient(145deg,#f4d98b,#c18b24);color:#10213a;font-size:.8rem;box-shadow:0 3px 10px rgba(214,166,55,.2)}
    #adminActivityTicker .admin-ticker-brand-copy{display:grid;gap:1px;line-height:1.1}
    #adminActivityTicker .admin-ticker-brand-copy strong{font-size:.67rem;letter-spacing:.12em;color:#ffe6a0;font-weight:900}
    #adminActivityTicker .admin-ticker-brand-copy small{font-size:.58rem;letter-spacing:.08em;color:#aebed2;font-weight:700}
    #adminActivityTicker .admin-ticker-indicator{width:6px;height:6px;border-radius:50%;background:#50dfa8;box-shadow:0 0 0 4px rgba(80,223,168,.13);animation:adminTickerPulse 2.6s ease-in-out infinite}
    #adminActivityTicker .admin-ticker-window{position:relative;z-index:1;min-width:0;flex:1;overflow:hidden;mask-image:linear-gradient(90deg,transparent,#000 3%,#000 97%,transparent)}
    #adminActivityTicker .admin-ticker-track{display:flex;width:max-content;align-items:center;animation:continuousScroll 360s linear infinite!important;will-change:transform}
    #adminActivityTicker .admin-ticker-track:hover{animation-play-state:paused!important}
    #adminActivityTicker.is-paused .admin-ticker-track{animation-play-state:paused!important}
    #adminActivityTicker .admin-ticker-group{display:flex;flex:0 0 auto;align-items:center;gap:38px;padding-right:38px;white-space:nowrap}
    #adminActivityTicker .admin-ticker-item{display:inline-flex;align-items:center;gap:9px;color:#f7f9fd;font-size:.8rem}
    #adminActivityTicker .admin-ticker-item b{color:#ffdf91;font-size:.67rem;letter-spacing:.06em}
    #adminActivityTicker .admin-ticker-time{color:#9fb2ca;font-size:.66rem}
    #adminActivityTicker .admin-ticker-control{position:relative;z-index:2;flex:0 0 24px;width:24px;height:24px;min-width:24px;min-height:24px;padding:0!important;display:grid;place-items:center;border:1px solid rgba(255,255,255,.2);border-radius:50%;background:rgba(255,255,255,.07);color:#f7df9e;font-size:.58rem;line-height:1;box-shadow:none}
    #adminActivityTicker .admin-ticker-control i{font-size:.58rem;line-height:1}
    #adminActivityTicker .admin-ticker-control:hover{background:rgba(255,255,255,.16)}
    body.admin-activity-ticker-active{padding-bottom:64px}
    body.admin-activity-ticker-active .sidebar{padding-bottom:68px}
    @keyframes adminTickerPulse{50%{opacity:.55;transform:scale(.82)}}
    @media(max-width:600px){#adminActivityTicker{min-height:48px;padding:5px 8px calc(5px + env(safe-area-inset-bottom));gap:7px}#adminActivityTicker .admin-ticker-brand{gap:7px;padding:7px 8px}#adminActivityTicker .admin-ticker-brand-icon{width:25px;height:25px}#adminActivityTicker .admin-ticker-brand-copy strong{font-size:.59rem}#adminActivityTicker .admin-ticker-brand-copy small{display:none}#adminActivityTicker .admin-ticker-group{gap:25px;padding-right:25px}#adminActivityTicker .admin-ticker-item{font-size:.72rem}#adminActivityTicker .admin-ticker-time{font-size:.6rem}#adminActivityTicker .admin-ticker-control{width:20px;height:20px;min-width:20px;min-height:20px;flex-basis:20px}}
    @media(max-width:360px){#adminActivityTicker .admin-ticker-brand-copy{display:none}#adminActivityTicker .admin-ticker-brand{padding:6px}}
    @media(prefers-reduced-motion:reduce){#adminActivityTicker .admin-ticker-track,#adminActivityTicker .admin-ticker-indicator{animation:none!important}}
   `;
   document.head.appendChild(adminTickerStyles);
 }
 const adminTicker=document.createElement('aside');
 adminTicker.id='adminActivityTicker';adminTicker.setAttribute('aria-label','Administrator activity');
 adminTicker.innerHTML='<div class="admin-ticker-brand"><span class="admin-ticker-brand-copy"><strong>ADMIN ACTIVITY</strong><small>SCHOOL OPERATIONS</small></span><span class="admin-ticker-indicator" aria-hidden="true"></span></div><div class="admin-ticker-window"><div class="admin-ticker-track animate-continuous-ticker"><div class="admin-ticker-group" id="adminTickerItems"></div><div class="admin-ticker-group" id="adminTickerItemsClone" aria-hidden="true"></div></div></div><button type="button" class="admin-ticker-control" aria-label="Pause scrolling" aria-pressed="false" title="Pause scrolling"><i class="fa-solid fa-pause" aria-hidden="true"></i></button>';
 document.body.appendChild(adminTicker);
 const adminTickerControl=adminTicker.querySelector('.admin-ticker-control');
 adminTickerControl?.addEventListener('click',()=>{
   const paused=adminTicker.classList.toggle('is-paused');
   adminTickerControl.setAttribute('aria-pressed',String(paused));
   adminTickerControl.setAttribute('aria-label',paused?'Resume scrolling':'Pause scrolling');
   adminTickerControl.title=paused?'Resume scrolling':'Pause scrolling';
   adminTickerControl.innerHTML='<i class="fa-solid '+(paused?'fa-play':'fa-pause')+'" aria-hidden="true"></i>';
 });
 workflowStage='administrator activity feed setup';
 const refreshAdminActivityTicker=async()=>{
   const {data:rows,error}=await client.from('audit_logs')
     .select('created_at,time_string,actor_name,action,details,status')
     .eq('school_id',ctx.id).order('created_at',{ascending:false}).limit(50);
   if(error){adminTicker.classList.add('hidden');console.warn('[Administrator activity ticker] Feed unavailable:',error.message);return;}
   const primary=document.getElementById('adminTickerItems'),clone=document.getElementById('adminTickerItemsClone');
   if(!rows?.length){adminTicker.classList.add('hidden');if(primary)primary.innerHTML='';if(clone)clone.innerHTML='';return;}
   adminTicker.classList.remove('hidden');
   const items=rows.map(row=>{
     const stamp=row.created_at?new Date(row.created_at).toLocaleString('en-GH',{dateStyle:'medium',timeStyle:'short'}):(row.time_string||'');
     const detail=String(row.details||'').trim();
     return '<span class="admin-ticker-item"><b>'+esc(row.actor_name||'Administrator')+'</b><span>'+esc(row.action||'Activity recorded')+(detail?' · '+esc(detail):'')+'</span><time class="admin-ticker-time">'+esc(stamp)+'</time></span>';
   }).join('');
   if(primary&&clone){primary.innerHTML=items;clone.innerHTML=items;}
 };
 void refreshAdminActivityTicker().catch(error=>console.warn('[Administrator activity ticker] Initial feed deferred:',error?.message||error));
 if(!isLocalDemo)window.__adminActivityTickerTimer=setInterval(()=>{
   if(document.visibilityState!=='visible'||navigator.onLine===false)return;
   refreshAdminActivityTicker().catch(error=>console.warn('[Administrator activity ticker] Refresh deferred:',error?.message||error));
 },120000);

 const adminTeacherProfileNav=document.querySelector('.sidebar .navbtn[data-target="wfTeacherPanel"]');
 if(adminTeacherProfileNav){adminTeacherProfileNav.style.display='none';adminTeacherProfileNav.setAttribute('aria-hidden','true');}
 $('wfChangePasswordForm')?.addEventListener('submit',async e=>{e.preventDefault();const current=$('wfCurrentAdminPassword').value,newPassword=$('wfNewAdminPassword').value,confirmPassword=$('wfConfirmAdminPassword').value;if(newPassword.length<8)return msg('wfPasswordMsg','Use a new password with at least 8 characters.',true);if(newPassword.length>128)return msg('wfPasswordMsg','Password must not exceed 128 characters.',true);if(newPassword!==confirmPassword)return msg('wfPasswordMsg','The new passwords do not match.',true);const {data:{user},error:userError}=await client.auth.getUser();if(userError||!user?.email)return msg('wfPasswordMsg','Your signed-in administrator account could not be verified. Sign in again and retry.',true);msg('wfPasswordMsg','Verifying your current password…');const {error:verifyError}=await client.auth.signInWithPassword({email:user.email,password:current});if(verifyError)return msg('wfPasswordMsg','Current password is incorrect. No changes were made.',true);const {data:updateResult,error:updateError}=await client.functions.invoke('school-admin-management',{body:{action:'change_password',password:newPassword}});if(updateError||!updateResult?.ok)return msg('wfPasswordMsg',updateResult?.error||updateError?.message||'Password update failed. Please try again or use password recovery.',true);$('wfChangePasswordForm').reset();msg('wfPasswordMsg','Password updated successfully for the signed-in administrator.');await audit(client,school,'Change administrator password','Administrator password changed through the school portal.');});

 // Tenant branding comes from the authenticated school record supplied by the portal.
 // Load sources independently: a missing optional column/table must not prevent the
 // dashboard's other sections from rendering. Errors are logged without exposing SQL.
 // Fetch every page so totals and ledgers are not silently capped by the API row limit.
  workflowStage='tenant data hydration';
  const withWorkflowTimeout=(value,ms,label)=>{
    let timer;
    return Promise.race([
      Promise.resolve(value),
      new Promise((_,reject)=>{timer=window.setTimeout(()=>reject(new Error(label||'This request timed out.')),ms);})
    ]).finally(()=>{if(timer)window.clearTimeout(timer);});
  };
  const loadSource=async(label,makeQuery)=>{
    try{
      const all=[];let from=0;const pageSize=1000;let pages=0;
      while(true){
        if(++pages>50)throw new Error('The '+label+' exceeded the safe pagination limit.');
        const result=await withWorkflowTimeout(makeQuery().range(from,from+pageSize-1),20000,label+' timed out.');
        if(result?.error){console.warn('[School Welfare] '+label+' unavailable:',result.error.code||'',result.error.message||'');return {data:[],error:result.error};}
        const batch=Array.isArray(result?.data)?result.data:[];
        all.push(...batch);
        if(batch.length<pageSize)break;
        from+=pageSize;
      }
      return {data:all,error:null};
    }catch(error){console.warn('[School Welfare] '+label+' request failed:',error?.message||error);return {data:[],error};}
  };
  const teacherQuery=fields=>loadSource('teacher roster',()=>client.from('teachers').select(fields).eq('school_id',school.id).order('name'));
 // Load the full master teacher record so the administrator viewer and individual
 // teacher profile resolve identical source fields. select('*') also avoids assuming
 // optional profile columns exist in every tenant schema.
 // Start the primary roster read alongside the independent school ledgers.
 // Compatibility fallbacks run only if the full teacher projection is unavailable.
 let [tr,cr,pr,rr,ar]=await Promise.all([
   teacherQuery('*'),
   loadSource('contribution ledger',()=>client.from('contributions').select('id,teacher_id,amount,date,reference').eq('school_id',school.id).order('date',{ascending:false})),
   loadSource('payout ledger',()=>client.from('payouts').select('id,teacher_id,amount,date,reason,reference,school_id').eq('school_id',school.id).order('date',{ascending:false})),
   loadSource('transaction reversals',()=>client.from('transaction_reversals').select('transaction_type,transaction_id,reason,created_at').eq('school_id',school.id)),
   loadSource('teacher login accounts',()=>client.from('teacher_accounts').select('auth_user_id,teacher_id,school_id,must_change_password,active').eq('school_id',school.id).eq('active',true))
 ]);
 if(tr.error)tr=await teacherQuery('id,name,phone,rank,class_name,is_active,passport,created_at');
 if(tr.error)tr=await teacherQuery('id,name,phone,rank,class_name,is_active,passport');
 if(tr.error)tr=await teacherQuery('id,name,phone,rank,class_name,passport');
 if(tr.error)tr=await teacherQuery('id,name,phone,rank,class_name,is_active');
 if(tr.error){
   tr=await teacherQuery('id,name,phone,rank,class_name');
   if(!tr.error)tr.data=tr.data.map(t=>({...t,is_active:true,passport:null}));
 }else{
   tr.data=tr.data.map(t=>({...t,is_active:typeof t.is_active==='boolean'?t.is_active:true,passport:t.passport??null}));
 }
 let loginAccounts=new Map((ar.data||[]).map(account=>[String(account.teacher_id),account]));
 let teachers=(tr.data||[]).map(t=>{const normalized=typeof window.normalizeTeacherProfileRecord==='function'?window.normalizeTeacherProfileRecord(t):t;const account=loginAccounts.get(String(normalized.id));return {...normalized,auth_user_id:account?.auth_user_id||null,login_activated:!!account?.auth_user_id,must_change_password:account?.must_change_password??null};});let cons=cr.data||[], pays=pr.data||[], reversals=rr.data||[];
  window.__welfareTeacherRegisterState={schoolId:String(school.id||''),schoolCode:String(school.school_code||school.schoolCode||'').toUpperCase(),rows:teachers};
 const sourceWarnings=[];
 if(tr.error)sourceWarnings.push('Teacher register unavailable');
 if(ar.error)sourceWarnings.push('Teacher login status unavailable');
 if(cr.error)sourceWarnings.push('Contribution ledger unavailable');
 if(pr.error)sourceWarnings.push('Payout ledger unavailable');
 if(rr.error)sourceWarnings.push('Reversal status unavailable');
 if(sourceWarnings.length){
   console.warn('[School Welfare] Partial dashboard data for school',school.school_code,sourceWarnings);
 }
 const reversed=new Set(reversals.map(r=>r.transaction_type+':'+r.transaction_id));
 const isActiveContributionRecord=item=>{
  if(!item||typeof item!=='object')return false;
  const statuses=[item.status,item.transaction_status,item.reversal_status].map(value=>String(value||'').trim().toLowerCase());
  const reversedFlag=[item.is_reversed,item.isReversed,item.reversed].some(value=>value===true||['true','t','1','yes'].includes(String(value).trim().toLowerCase()));
  const inactiveFlag=statuses.some(status=>['inactive','deleted','cancelled','canceled','void','archived'].includes(status));
  return !reversed.has('contribution:'+item.id)&&!statuses.includes('reversed')&&!inactiveFlag&&!reversedFlag&&!item.reversed_at&&!item.reversedAt;
 };
 const isActivePayoutRecord=item=>{
  if(!item||typeof item!=='object')return false;
  const status=String(item.status||item.transaction_status||'').trim().toLowerCase();
  const reversedFlag=[item.is_reversed,item.isReversed,item.reversed].some(value=>value===true||['true','t','1','yes'].includes(String(value).trim().toLowerCase()));
  return !reversed.has('payout:'+item.id)&&!['reversed','inactive','deleted','cancelled','canceled','void','archived'].includes(status)&&!reversedFlag&&!item.reversed_at&&!item.reversedAt;
 };
 let activeCons=cons.filter(isActiveContributionRecord), activePays=pays.filter(isActivePayoutRecord);
 window.__welfareRenderFinancialCharts?.({contributions:activeCons,payouts:activePays,scope:'School ledger'});
 // Expand year options using only the active tenant's loaded ledgers.
 window.populateReportYearSelectors([...activeCons,...activePays]);
 const demoLatestMonthKey=isLocalDemo?cons.reduce((latest,row)=>String(row.date||'')>latest?String(row.date||''):latest,'').slice(0,7):'';
 const getDashboardMonthKey=isLocalDemo?()=>demoLatestMonthKey||'2026-03':()=>{const now=new Date();return now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');};

 const contribStyle=document.createElement('style');
 contribStyle.textContent=`
 #wfLedgerPanel{border:1px solid var(--line);border-radius:18px;padding:clamp(16px,2.2vw,24px);box-shadow:0 10px 28px rgba(7,19,40,.06)}
 #wfLedgerPanel .wf-contrib-header h2{font-size:1.45rem;margin:0 0 5px;color:var(--text,#14213d)}
 #wfLedgerPanel .wf-contrib-header p{margin:0 0 20px}
 #wfLedgerPanel .wf-contrib-metrics{display:grid;grid-template-columns:1fr;gap:12px;margin:0 0 20px}
 #wfLedgerPanel .wf-contrib-metric{min-height:104px;border:1px solid var(--line);border-left:5px solid;border-radius:14px;padding:17px 19px;background:var(--surface,#fff);display:flex;flex-direction:column;justify-content:center;gap:9px;box-shadow:0 5px 16px rgba(15,23,42,.045)}
 #wfLedgerPanel .wf-contrib-metric small{font-size:.72rem;letter-spacing:.11em;font-weight:850;color:var(--muted,#64748b)}
 #wfLedgerPanel .wf-contrib-metric strong{font-size:clamp(1.45rem,3vw,1.9rem);font-weight:900;letter-spacing:-.035em;color:var(--text,#14213d)}
 #wfLedgerPanel .wf-contrib-green{border-left-color:#16a34a}.wf-contrib-red{border-left-color:#e11d48}.wf-contrib-blue{border-left-color:#2563eb}
 #wfLedgerPanel .wf-contrib-log{border:1px solid var(--line);border-radius:15px;overflow:hidden;background:var(--surface,#fff)}
 #wfLedgerPanel .wf-contrib-log-head{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;padding:16px 18px;border-bottom:1px solid var(--line)}
 #wfLedgerPanel .wf-contrib-log-head h3{margin:0;font-size:1.05rem}
 #wfLedgerPanel .wf-contrib-filters{display:flex;gap:8px;flex-wrap:wrap}
 #wfLedgerPanel .wf-contrib-filters input{min-height:40px;max-width:220px;padding:8px 11px;border:1px solid var(--line);border-radius:10px;background:var(--surface,#fff);color:inherit}
 #wfLedgerPanel .wf-contrib-table-wrap{overflow-x:auto}
 #wfLedgerPanel table{width:100%;min-width:720px;border-collapse:collapse}
 #wfLedgerPanel th{padding:13px 15px;text-align:left;font-size:.68rem;letter-spacing:.1em;font-weight:850;color:var(--muted,#64748b);white-space:nowrap;background:rgba(120,130,150,.055)}
 #wfLedgerPanel td{padding:14px 15px;border-top:1px solid var(--line);font-size:.86rem;white-space:nowrap}
 #wfLedgerPanel td:nth-child(4){font-weight:850}
 .dark #wfLedgerPanel .wf-contrib-metric,.dark #wfLedgerPanel .wf-contrib-log{background:var(--surface,#101b2d)}
 @media(min-width:900px){#wfLedgerPanel .wf-contrib-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}}
 @media(max-width:600px){#wfLedgerPanel .wf-contrib-filters,#wfLedgerPanel .wf-contrib-filters input{width:100%;max-width:none}#wfDuesMatrixCard .wf-dues-matrix-table{min-width:760px;font-size:.68rem}#wfDuesMatrixCard .wf-dues-matrix-table th{padding:8px 3px}#wfDuesMatrixCard .wf-dues-matrix-table td{padding:6px 3px}#wfDuesMatrixCard .wf-dues-matrix-table th:first-child,#wfDuesMatrixCard .wf-dues-matrix-table td:first-child{width:130px;min-width:130px}#wfDuesMatrixCard .wf-dues-matrix-cell-paid{font-size:.58rem;padding:3px 1px}}
 `;
 contribStyle.textContent+=`
 #wfDuesMatrixCard{grid-column:1/-1;position:relative;overflow:hidden;border:1px solid var(--line);border-top:5px solid #16a779!important;border-radius:17px;background:var(--surface,#fff);color:var(--text,var(--ink));box-shadow:0 10px 28px rgba(7,19,40,.06);padding:clamp(15px,2.2vw,22px)}
 #wfDuesMatrixCard .wf-report-card-content{width:100%}
 #wfDuesMatrixCard h3{display:flex;align-items:center;gap:9px;margin:0 0 5px;color:var(--text,var(--ink))}
 #wfDuesMatrixCard h3 i{color:#16a779}
 #wfDuesMatrixCard p{margin:5px 0 14px;color:var(--muted)}
 #wfDuesMatrixCard .wf-dues-matrix-controls{display:grid;grid-template-columns:minmax(150px,190px) minmax(220px,1fr);gap:12px;max-width:620px;margin:10px 0 12px}
 #wfDuesMatrixCard .wf-dues-matrix-controls label{display:block;margin:0 0 5px;font-size:.76rem;font-weight:800}
 #wfDuesMatrixCard .wf-dues-matrix-controls input,#wfDuesMatrixCard .wf-dues-matrix-controls select{width:100%;min-width:0;min-height:42px;padding:9px 11px;border:1px solid var(--line);border-radius:9px;background:var(--surface,#fff);color:var(--text,var(--ink))}
 #wfDuesMatrixCard .wf-dues-matrix-legend{display:flex;align-items:center;gap:13px;flex-wrap:wrap;font-size:.76rem;margin:9px 0 12px}
 #wfDuesMatrixCard .wf-dues-matrix-paid,#wfDuesMatrixCard .wf-dues-matrix-unpaid{display:inline-flex;align-items:center;gap:4px;font-weight:850}
 #wfDuesMatrixCard .wf-dues-matrix-paid{color:#13865f}
 #wfDuesMatrixCard .wf-dues-matrix-unpaid{color:#9aa5b5}
 #wfDuesMatrixCard .wf-dues-matrix-scroll{width:100%;max-width:100%;overflow-x:auto;border:1px solid var(--line);border-radius:12px;overscroll-behavior-x:contain}
 #wfDuesMatrixCard .wf-dues-matrix-table{width:100%;min-width:760px;border-collapse:separate;border-spacing:0;font-size:.72rem;table-layout:fixed}
 #wfDuesMatrixCard .wf-dues-matrix-table th{position:sticky;top:0;z-index:1;padding:11px 9px;text-align:center;background:#edf4f2;color:#29443c;border-bottom:1px solid var(--line);white-space:nowrap}
 #wfDuesMatrixCard .wf-dues-matrix-table th:first-child{left:0;z-index:2;width:145px;min-width:145px;text-align:left}
 #wfDuesMatrixCard .wf-dues-matrix-table td{padding:9px 8px;text-align:center;border-bottom:1px solid var(--line);white-space:nowrap;font-variant-numeric:tabular-nums}
 #wfDuesMatrixCard .wf-dues-matrix-table td:first-child{position:sticky;left:0;z-index:1;text-align:left;background:var(--surface,#fff);font-weight:800;width:145px;min-width:145px;white-space:normal;overflow-wrap:anywhere}
 #wfDuesMatrixCard .wf-dues-matrix-teacher small{display:block;color:var(--muted);font-size:.68rem;font-weight:650}
 #wfDuesMatrixCard .wf-dues-matrix-cell-paid{display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;width:100%;max-width:100%;min-width:0;padding:3px 3px;border-radius:7px;background:#dcfce7;color:#166534;font-size:clamp(.58rem,2.3vw,.68rem);line-height:1.2;font-weight:850;white-space:normal;overflow-wrap:normal;word-break:keep-all;letter-spacing:-.02em;text-align:center}
 #wfDuesMatrixCard .wf-dues-matrix-cell-unpaid{color:#9aa5b5;font-weight:750}
 #wfDuesMatrixCard .wf-dues-matrix-table tbody tr:last-child td{border-bottom:0}
 .dark #wfDuesMatrixCard{background:#0b1d3a;color:#e6edf7;border-color:#26364d}
 .dark #wfDuesMatrixCard .wf-dues-matrix-controls input,.dark #wfDuesMatrixCard .wf-dues-matrix-controls select{background:#071328;color:#e6edf7;border-color:#354862}
 .dark #wfDuesMatrixCard .wf-dues-matrix-table th{background:#173a37;color:#e3f5ee}
 .dark #wfDuesMatrixCard .wf-dues-matrix-table td:first-child{background:#0b1d3a}
 .dark #wfDuesMatrixCard .wf-dues-matrix-cell-paid{background:#14532d;color:#bbf7d0}
 .dark #wfDuesMatrixCard .wf-dues-matrix-cell-unpaid{color:#8291a6}
 @media(max-width:600px){#wfDuesMatrixCard .wf-dues-matrix-controls{grid-template-columns:1fr}#wfDuesMatrixCard .wf-dues-matrix-table{min-width:850px}}
 `;
 document.head.appendChild(contribStyle);
 workflowStage='profile and ledger rendering';
 const teacherById=new Map(teachers.map(t=>[String(t.id),t]));
 const profileIdentity=()=>workflowAdminIdentity||window.__welfareWorkflowAdminIdentity||window.WelfareDemo?.getCurrentUser?.()||{};
 const chooseInitialProfileTeacher=rows=>{
  const list=Array.isArray(rows)?rows:[];
  if(!list.length)return null;
  const identity=profileIdentity(),userId=String(identity.id||identity.user_id||'').trim();
  const email=String(identity.email||'').trim().toLowerCase();
  const metadata=identity.user_metadata||{};
  const fullName=String(metadata.full_name||metadata.name||identity.full_name||identity.name||'').trim().toLowerCase().replace(/\s+/g,' ');
  const matched=list.find(row=>{
   const ids=[row.auth_user_id,row.user_id,row.authUserId,row.userId,row.id].map(value=>String(value||'').trim()).filter(Boolean);
   const emails=[row.email,row.email_address,row.contact_email].map(value=>String(value||'').trim().toLowerCase()).filter(Boolean);
   const names=[row.name,row.full_name,row.fullName].map(value=>String(value||'').trim().toLowerCase().replace(/\s+/g,' ')).filter(Boolean);
   return (userId&&ids.includes(userId))||(email&&emails.includes(email))||(fullName&&names.includes(fullName));
  });
  return matched||list.find(row=>row.is_active!==false)||list[0]||null;
 };
 let selectedProfileTeacherId=String(chooseInitialProfileTeacher(teachers)?.id||'');
 const profileHost=$('schoolOverview')?.parentElement;
 if(profileHost){
  document.getElementById('teacherProfileViewer')?.remove();
  const p=document.createElement('section');p.id='teacherProfileViewer';p.className='panel hidden';p.style.cssText='margin-top:18px;padding:clamp(16px,2.4vw,28px)';
  p.innerHTML=`
   <header style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap;margin-bottom:20px">
    <div><h2 style="margin:0 0 6px">Teacher Profile</h2><p class="muted" style="margin:0">Comprehensive personal, professional, and membership overview.</p></div>
    <button type="button" id="teacherProfilePrint" class="secondary teacher-profile-print-button"><i class="fa-solid fa-file-pdf"></i> Print / Download Profile Statement</button>
   </header>
   <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:18px"><label for="teacherProfileSelect" style="margin:0">Select teacher</label><select id="teacherProfileSelect" style="max-width:360px"></select></div>
   <div id="teacherProfileContent" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px">
    <article class="panel teacher-profile-card-rose" style="margin:0;text-align:center;padding:24px;position:relative">
     <span id="tpStatus" style="position:absolute;right:15px;top:15px;border-radius:99px;padding:6px 11px;font-size:.72rem;font-weight:800"></span>
     <div id="tpAvatar" style="width:104px;height:104px;border-radius:24px;margin:18px auto 14px;display:grid;place-items:center;background:linear-gradient(145deg,#142746,#071326);color:#f1ce78;font-size:2rem;font-weight:900">—</div>
     <h3 id="tpName" style="margin:0 0 5px">—</h3><p id="tpRank" class="muted">—</p><strong id="tpStaffId">—</strong>
     <div class="teacher-profile-meta-grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;border-top:1px solid var(--line);margin-top:20px;padding-top:15px;text-align:left">
      <div style="display:flex;flex-direction:column;gap:4px;min-width:0"><small class="muted">REGISTRATION DATE</small><strong id="tpRegistration">—</strong></div><div style="display:flex;flex-direction:column;gap:4px;min-width:0"><small class="muted">MEMBERSHIP TYPE</small><strong id="tpMembership">—</strong></div>
     </div>
    </article>
    <article class="panel teacher-profile-accent teacher-profile-accent-blue teacher-personal-contact-card" style="margin:0;padding:22px"><div class="teacher-contact-card-head"><h3><i class="fa-solid fa-address-card" aria-hidden="true"></i> Personal &amp; Contact Information</h3><span class="teacher-contact-secure"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i> VERIFIED PROFILE</span></div><div id="tpPersonalRows" class="tp-fields"></div><div class="teacher-contact-card-foot"><p class="muted">To update official details, contact the Executive Administrator.</p><button type="button" class="teacher-contact-edit-button" id="tpEditContact"><i class="fa-solid fa-pen-to-square" aria-hidden="true"></i> Edit Contact Info</button></div></article>
    <article class="panel teacher-profile-accent teacher-profile-accent-gold teacher-professional-details-card" style="margin:0;padding:22px"><div class="teacher-professional-card-head"><h3><i class="fa-solid fa-briefcase" aria-hidden="true"></i> Professional &amp; Employment Details</h3><span class="teacher-professional-secure"><i class="fa-solid fa-clipboard-check" aria-hidden="true"></i> EMPLOYMENT RECORD</span></div><div id="tpProfessionalRows" class="tp-fields"></div></article>
    <article class="panel teacher-profile-accent teacher-profile-accent-purple" style="margin:0;padding:22px"><h3><i class="fa-solid fa-wallet" aria-hidden="true"></i> Welfare Membership &amp; Financial Summary</h3><div id="tpFinanceRows"></div></article>
   </div>
   <style>
    /* Match the teacher's own profile cards: 5px thematic top accents, rounded top corners and consistent panel depth. */
    #teacherProfileViewer .teacher-profile-accent{
      border-top-width:5px!important;
      border-top-style:solid!important;
      border-top-left-radius:var(--radius-lg,22px)!important;
      border-top-right-radius:var(--radius-lg,22px)!important;
      background-clip:padding-box;
      box-shadow:var(--panel-shadow,0 8px 22px rgba(15,23,42,.08));
    }
    #teacherProfileViewer .teacher-profile-accent-blue{border-top-color:#3b82f6!important}
    #teacherProfileViewer .teacher-profile-accent-gold{border-top-color:#d6a637!important}
    #teacherProfileViewer .teacher-profile-accent-purple{border-top-color:#8b5cf6!important}
    #teacherProfileViewer .tp-fields{display:grid;gap:10px}
    #teacherProfileViewer .teacher-personal-contact-card .tp-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
    #teacherProfileViewer .teacher-personal-contact-card .tp-field{min-width:0;border:1px solid rgba(15,23,42,.08);background:#f8fafc;border-radius:13px;padding:13px 14px;box-shadow:none}
    #teacherProfileViewer .teacher-personal-contact-card .tp-field small{display:block;color:#64748b;font-size:.68rem;font-weight:850;letter-spacing:.075em;line-height:1.3;margin:0 0 7px;text-transform:uppercase}
    #teacherProfileViewer .teacher-personal-contact-card .tp-field strong{display:block;color:#172b49;font-size:.91rem;font-weight:800;line-height:1.45;overflow-wrap:anywhere}
    #teacherProfileViewer .teacher-contact-card-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:0 0 15px}
    #teacherProfileViewer .teacher-contact-card-head h3{display:flex;align-items:center;gap:9px;margin:0;color:#172b49;font-size:1.02rem;font-weight:850}
    #teacherProfileViewer .teacher-contact-card-head h3>i{color:#2563eb}
    #teacherProfileViewer .teacher-contact-secure{display:inline-flex;align-items:center;gap:5px;padding:5px 8px;border:1px solid #dbeafe;border-radius:999px;background:#eff6ff;color:#1d4ed8;font-size:.62rem;font-weight:850;letter-spacing:.055em}
    #teacherProfileViewer .teacher-contact-card-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:14px}
    #teacherProfileViewer .teacher-contact-card-foot p{margin:0;max-width:36ch;font-size:.78rem;line-height:1.45}
    #teacherProfileViewer .teacher-contact-edit-button{display:inline-flex;align-items:center;justify-content:center;gap:8px;flex:0 0 auto;min-height:42px;padding:10px 15px;border:1px solid #1d4ed8;border-radius:11px;background:#1d4ed8;color:#fff;font-size:.82rem;font-weight:850;box-shadow:0 3px 9px rgba(29,78,216,.16);cursor:pointer}
    #teacherProfileViewer .teacher-contact-edit-button:hover{background:#1e40af;border-color:#1e40af}
    .dark #teacherProfileViewer .teacher-personal-contact-card{background:var(--panel)!important}
    .dark #teacherProfileViewer .teacher-contact-card-head h3,.dark #teacherProfileViewer .teacher-personal-contact-card .tp-field strong{color:#e5edf8}
    .dark #teacherProfileViewer .teacher-contact-secure{background:#172b49;border-color:#2d4a72;color:#bfdbfe}
    .dark #teacherProfileViewer .teacher-personal-contact-card .tp-field{background:#101f35;border-color:rgba(148,163,184,.2)}
    .dark #teacherProfileViewer .teacher-personal-contact-card .tp-field small{color:#a9b8cc}
    .dark #teacherProfileViewer .teacher-contact-edit-button{background:#2563eb;border-color:#60a5fa;color:#fff}
    @media(max-width:600px){#teacherProfileViewer .teacher-personal-contact-card .tp-fields{grid-template-columns:1fr;gap:9px}#teacherProfileViewer .teacher-personal-contact-card .tp-field{padding:12px 13px;border-radius:12px}#teacherProfileViewer .teacher-contact-card-foot{align-items:stretch;flex-direction:column;gap:10px}#teacherProfileViewer .teacher-contact-edit-button{width:100%;min-height:45px}}

    #teacherProfileViewer .tp-field{border:1px solid var(--line);background:rgba(120,130,150,.06);border-radius:12px;padding:11px 13px}
    #teacherProfileViewer .tp-field small{display:block;color:var(--muted);font-size:.68rem;font-weight:850;letter-spacing:.06em;margin-bottom:5px}
    #teacherProfileViewer .tp-field strong{display:block;overflow-wrap:anywhere;font-size:.92rem}
    #teacherProfileViewer #tpFinanceRows{display:grid;gap:10px}
    #teacherProfileViewer .tp-finance{display:flex;align-items:center;justify-content:space-between;gap:14px;min-width:0;padding:15px 14px;border:1px solid var(--line);border-radius:13px;background:rgba(120,130,150,.045);box-shadow:0 1px 2px rgba(15,23,42,.035)}
    #teacherProfileViewer .tp-finance span{min-width:0;color:var(--muted);font-size:.86rem;font-weight:650;line-height:1.4}
    #teacherProfileViewer .tp-finance strong{flex:0 0 auto;margin-left:auto;text-align:right;font-size:.94rem;font-weight:850;font-variant-numeric:tabular-nums;white-space:nowrap}
    #teacherProfileViewer .tp-finance .finance-positive{color:#059669!important}
    #teacherProfileViewer .tp-finance .finance-payout{color:#e05b5b!important}
    #teacherProfileViewer .tp-finance .finance-empty{color:var(--muted)!important}
    .dark #teacherProfileViewer .tp-finance{background:rgba(148,163,184,.055);border-color:var(--line)}
    @media(max-width:420px){#teacherProfileViewer .tp-finance{gap:8px;padding:12px 10px}#teacherProfileViewer .tp-finance span{font-size:.79rem}#teacherProfileViewer .tp-finance strong{font-size:.84rem}}
    #teacherProfilePrint{background:linear-gradient(120deg,#ec4899,#db2777)!important;color:#fff!important;border:1px solid #db2777!important;border-radius:10px;box-shadow:0 6px 16px rgba(219,39,119,.22)}
    #teacherProfilePrint:hover:not(:disabled){background:linear-gradient(120deg,#db2777,#be185d)!important;border-color:#be185d!important}
    @media(max-width:760px){#teacherProfileContent{grid-template-columns:1fr!important}#teacherProfileViewer .teacher-profile-accent{border-top-left-radius:17px!important;border-top-right-radius:17px!important}#teacherProfilePrint{width:100%}}
    @media print{body *{visibility:hidden!important}#teacherProfileViewer,#teacherProfileViewer *{visibility:visible!important}#teacherProfileViewer{position:absolute;inset:0;width:100%;margin:0!important}#teacherProfilePrint,#teacherProfileSelect,#teacherProfileViewer label,#tpEditContact{display:none!important}}
   
    #teacherProfileViewer .teacher-professional-details-card{border:1px solid #e2e8f0!important;border-top:4px solid #d6a637!important;background:#fff}
    #teacherProfileViewer .teacher-professional-card-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:0 0 16px}
    #teacherProfileViewer .teacher-professional-card-head h3{display:flex;align-items:center;gap:9px;margin:0;color:#172b49;font-size:1.02rem;font-weight:850}
    #teacherProfileViewer .teacher-professional-card-head h3>i{color:#b88716}
    #teacherProfileViewer .teacher-professional-secure{display:inline-flex;align-items:center;gap:5px;padding:5px 8px;border:1px solid #f2dfaa;border-radius:999px;background:#fff8e6;color:#8a6410;font-size:.62rem;font-weight:850;letter-spacing:.055em}
    #teacherProfileViewer .teacher-professional-details-card .tp-fields{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
    #teacherProfileViewer .teacher-professional-details-card .tp-field{min-width:0;border:1px solid #e2e8f0;background:#f8fafc;border-radius:13px;padding:13px 14px}
    #teacherProfileViewer .teacher-professional-details-card .tp-field small{color:#64748b;font-size:.68rem;font-weight:850;letter-spacing:.075em;line-height:1.3;margin-bottom:7px}
    #teacherProfileViewer .teacher-professional-details-card .tp-field strong{color:#172b49;font-size:.91rem;font-weight:800;line-height:1.45;overflow-wrap:anywhere}
    .dark #teacherProfileViewer .teacher-professional-details-card{background:var(--panel)!important;border-color:var(--line)!important}
    .dark #teacherProfileViewer .teacher-professional-card-head h3,.dark #teacherProfileViewer .teacher-professional-details-card .tp-field strong{color:#e5edf8}
    .dark #teacherProfileViewer .teacher-professional-secure{background:#302817;border-color:#66532a;color:#f5d98a}
    .dark #teacherProfileViewer .teacher-professional-details-card .tp-field{background:rgba(148,163,184,.07);border-color:var(--line)}
    .dark #teacherProfileViewer .teacher-professional-details-card .tp-field small{color:#a9b8cc}
    @media(max-width:600px){#teacherProfileViewer .teacher-professional-details-card{padding:16px!important}#teacherProfileViewer .teacher-professional-card-head{align-items:flex-start;margin-bottom:13px}#teacherProfileViewer .teacher-professional-details-card .tp-fields{grid-template-columns:1fr;gap:9px}#teacherProfileViewer .teacher-professional-details-card .tp-field{padding:12px 13px;border-radius:12px}}
</style>`;
  const wf=$('workflows');profileHost.insertBefore(p,wf&&wf.parentElement===profileHost?wf:null);
 }
 const profileSelect=$('teacherProfileSelect');
 const profileRows=rows=>rows.map(([k,v])=>'<div class="tp-field"><small>'+esc(k)+'</small><strong>'+esc(v||'—')+'</strong></div>').join('');
 const profileMoney=n=>'GH₵ '+Number(n||0).toLocaleString('en-GH',{minimumFractionDigits:2,maximumFractionDigits:2});
 const profileDate=v=>{if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});};
 const getProfileTeacherRows=()=>{
  const cached=window.__welfareTeacherRegisterState;
  const cachedRows=cached&&String(cached.schoolId||'')===String(ctx.id||'')&&String(cached.schoolCode||'').toUpperCase()===String(ctx.school_code||ctx.schoolCode||'').toUpperCase()&&Array.isArray(cached.rows)?cached.rows:[];
  if(teachers.length)return teachers;
  if(cachedRows.length)return cachedRows;
  if(client?.__welfareDemo&&Array.isArray(window.WelfareDemo?.teachers))return window.WelfareDemo.teachers;
  return [];
 };
 const renderSelectedTeacherProfile=()=>{
  const profileTeachers=getProfileTeacherRows();
  if(!selectedProfileTeacherId&&profileTeachers.length)selectedProfileTeacherId=String(chooseInitialProfileTeacher(profileTeachers)?.id||'');
  let sourceTeacher=profileTeachers.find(x=>String(x.id)===String(selectedProfileTeacherId));
  // A stale selection (for example after a roster refresh or account switch)
  // must never leave the profile viewer blank while tenant-scoped rows exist.
  if(!sourceTeacher&&profileTeachers.length){sourceTeacher=chooseInitialProfileTeacher(profileTeachers)||profileTeachers[0];selectedProfileTeacherId=String(sourceTeacher.id);if(profileSelect)profileSelect.value=selectedProfileTeacherId;}
  if(!sourceTeacher){
   const nameNode=$('tpName');if(nameNode)nameNode.textContent=tr.error?'Teacher profile could not be loaded':'No teacher profiles are registered for this school.';
   const personalNode=$('tpPersonalRows');if(personalNode)personalNode.innerHTML='<div class="tp-field"><small>PROFILE STATUS</small><strong>'+(tr.error?'The school teacher register could not be reached.':'No teacher records are registered for this school yet.')+'</strong></div>'+(tr.error?'<button type="button" class="wf-table-action" data-wf-retry-profile>Retry loading profile</button>':'');
   const professionalNode=$('tpProfessionalRows');if(professionalNode)professionalNode.innerHTML='';
   const financeNode=$('tpFinanceRows');if(financeNode)financeNode.innerHTML='<div class="tp-finance"><span>Financial history</span><strong class="finance-empty">Unavailable</strong></div>';
   const avatarNode=$('tpAvatar');if(avatarNode)avatarNode.textContent='—';
   const statusNode=$('tpStatus');if(statusNode)statusNode.textContent='Unavailable';
   return false;
  }
  const t=typeof window.normalizeTeacherProfileRecord==='function'?window.normalizeTeacherProfileRecord(sourceTeacher):sourceTeacher;
  const tc=activeCons.filter(x=>String(x.teacher_id)===String(t.id)),tp=activePays.filter(x=>String(x.teacher_id)===String(t.id));
  const dues=tc.reduce((n,x)=>n+Number(x.amount||0),0),paid=tp.reduce((n,x)=>n+Number(x.amount||0),0);
  const recent=[...tc].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))[0];
  const parts=String(t.name||'').trim().split(/\s+/).filter(Boolean),initials=parts.slice(0,2).map(x=>x[0]).join('').toUpperCase()||'—';
  const setText=(id,value)=>{const node=$(id);if(node)node.textContent=String(value??'—');};
  const status=$('tpStatus');if(status){status.textContent=t.is_active===false?'Inactive':'Active';status.style.cssText+=';background:'+(t.is_active===false?'#fee2e2':'#dcfce7')+';color:'+(t.is_active===false?'#b91c1c':'#166534');}
  const profileAvatar=$('tpAvatar');
  if(profileAvatar){
   profileAvatar.textContent=initials;profileAvatar.style.overflow='hidden';
   if(t.passport){
    const photo=document.createElement('img');photo.src=t.passport;photo.alt='Passport photograph of '+String(t.name||'teacher');photo.loading='eager';photo.decoding='async';
    photo.style.cssText='display:block;width:100%;height:100%;object-fit:cover;border-radius:inherit';
    photo.onerror=()=>{photo.remove();profileAvatar.textContent=initials;};profileAvatar.replaceChildren(photo);
   }
  }
  setText('tpName',t.name||'—');setText('tpRank',t.rank||'—');setText('tpStaffId','Staff ID: '+t.id);
  setText('tpRegistration',profileDate(t.registration_date||t.created_at||t.date_registered));setText('tpMembership',t.membership_type||t.membership||'—');
  const personal=$('tpPersonalRows');if(personal)personal.innerHTML=profileRows([['FULL NAME',t.name],['PHONE NUMBER',t.phone],['SCHOOL / INSTITUTION',school.name],['DISTRICT & REGION',[school.district,school.region].filter(Boolean).join(' · ')]]);
  const professional=$('tpProfessionalRows');if(professional)professional.innerHTML=profileRows([['Staff ID',t.id],['Professional Rank',t.rank],['CLASS / SUBJECT',t.class_name],['Employer',t.employer||school.employer]]);
  const finance=$('tpFinanceRows');if(finance)finance.innerHTML=[
   '<div class="tp-finance"><span>Total Dues Contributed</span><strong class="finance-positive">'+esc(profileMoney(dues))+'</strong></div>',
   '<div class="tp-finance"><span>Total Welfare Payouts Received</span><strong class="finance-payout">'+esc(profileMoney(paid))+'</strong></div>',
   '<div class="tp-finance"><span>Total Payments Recorded</span><strong>'+(tc.length?String(tc.length):'0 Payments')+'</strong></div>',
   '<div class="tp-finance"><span>Most Recent Contribution</span><strong'+(recent?'':' class="finance-empty"')+'>'+esc(recent?profileDate(recent.date):'—')+'</strong></div>'
  ].join('');
  return true;
 };
 if(profileSelect){profileSelect.innerHTML=getProfileTeacherRows().map(t=>'<option value="'+esc(t.id)+'">'+esc(t.name||t.id)+' ('+esc(t.id)+')</option>').join('');profileSelect.value=selectedProfileTeacherId;profileSelect.addEventListener('change',()=>{selectedProfileTeacherId=profileSelect.value;renderSelectedTeacherProfile();});}
 $('teacherProfileViewer')?.addEventListener('click',async event=>{const retry=event.target.closest('[data-wf-retry-profile]');if(!retry)return;retry.disabled=true;retry.textContent='Retrying…';try{await window.__welfareEnsureTeacherRegisterLoaded(ctx.school_code);msg('wfTeacherMsg','Teacher profile refreshed successfully.');}catch(error){retry.disabled=false;retry.textContent='Retry loading profile';const statusNode=$('tpPersonalRows')?.querySelector('strong');if(statusNode)statusNode.textContent=error?.message||'The profile could not be loaded. Please retry.';}});
 $('teacherProfilePrint')?.addEventListener('click',()=>window.print());
 $('tpEditContact')?.addEventListener('click',()=>wfNotice('To update official contact details, contact the Executive Administrator.'));
 renderSelectedTeacherProfile();
 // A synchronous cached render is the first response to Profile viewer navigation.
 // Network-backed roster and ledger refreshes are deliberately kept separate.
 window.__welfareRenderAdminProfileViewer=()=>{
  const profileTeachers=getProfileTeacherRows();
  if(!selectedProfileTeacherId&&profileTeachers[0])selectedProfileTeacherId=String(chooseInitialProfileTeacher(profileTeachers)?.id||'');
  if(profileSelect){
   profileSelect.innerHTML=profileTeachers.map(row=>'<option value="'+esc(row.id)+'">'+esc(row.name||row.id)+' ('+esc(row.id)+')</option>').join('');
   profileSelect.value=selectedProfileTeacherId;
  }
  const rendered=renderSelectedTeacherProfile();
  const panel=$('teacherProfileViewer');
  if(panel){panel.classList.remove('hidden');panel.removeAttribute('hidden');panel.style.setProperty('display','block','important');panel.style.setProperty('visibility','visible','important');panel.removeAttribute('aria-hidden');}
  return rendered;
 };
 window.__welfareRenderActiveProfileViewer=()=>{
  if(window.__welfareCurrentRole==='teacher')return window.__welfareRefreshMemberProfileViewer?.()??false;
  return window.__welfareRenderAdminProfileViewer?.()??false;
 };
 window.__welfareRefreshAdminProfileViewer=async()=>{
  // Navigation has already rendered the cached profile. Keep it visible while
  // the tenant-scoped roster and financial history refresh in the background.
  try{
   await reloadTeacherRegisterForExport();
  }catch(error){
   console.warn('[School Welfare] Profile viewer roster refresh deferred:',error?.message||error);
   if(!teachers.length){
    tr={data:[],error};
    renderSelectedTeacherProfile();
   }
   return false;
  }
  if(typeof refreshWorkflow==='function'){
   const financialReady=await refreshWorkflow();
   if(!financialReady)console.warn('[School Welfare] Profile viewer financial history is incomplete; retry the contribution/payout sections.');
  }
  if(!selectedProfileTeacherId||!teachers.some(item=>String(item.id)===String(selectedProfileTeacherId)))selectedProfileTeacherId=String(chooseInitialProfileTeacher(teachers)?.id||'');
  if(profileSelect)profileSelect.value=selectedProfileTeacherId;
  window.__welfareRenderAdminProfileViewer();
  return !!teachers.length;
 };

 const teacherLabel=id=>{const t=teacherById.get(String(id));return t?esc(t.name)+' ('+esc(t.id)+')':esc(id||'—')};
 const ensureTeacherTableAccentStyles=()=>{
  if(document.getElementById('wf-teacher-table-accent-styles'))return;
  const style=document.createElement('style');style.id='wf-teacher-table-accent-styles';style.textContent=`
  #wfTeacherRegisterPanel .wf-rank-badge,
  #wfTeacherRegisterPanel .wf-membership-badge,
  #wfTeacherRegisterPanel .wf-employer-badge{
    display:inline-flex;align-items:center;justify-content:center;max-width:100%;
    padding:5px 10px;border:1px solid transparent;border-radius:999px;
    font-size:.76rem;font-weight:750;line-height:1.35;white-space:normal;
    overflow-wrap:anywhere;vertical-align:middle;
  }
  #wfTeacherRegisterPanel .wf-rank-badge{background:#eff6ff;color:#2563eb;border-color:#bfdbfe;white-space:nowrap;overflow-wrap:normal}
  #wfTeacherRegisterPanel .wf-accent-cell.wf-rank-cell{min-width:140px;white-space:nowrap}
  #wfTeacherRegisterPanel .wf-class-accent{color:#d97706;font-weight:750;white-space:normal;overflow-wrap:anywhere}
  #wfTeacherRegisterPanel .wf-membership-badge{background:#ecfdf5;color:#047857;border-color:#a7f3d0}
  #wfTeacherRegisterPanel .wf-employer-badge{background:#f1f5f9;color:#475569;border-color:#cbd5e1}
  #wfTeacherRegisterPanel .wf-accent-cell{padding-left:12px;padding-right:12px}
  /* Signature identity columns: Staff ID, teacher name and phone. */
  #wfTeacherRegisterPanel .wf-staff-id-cell{white-space:nowrap}
  #wfTeacherRegisterPanel .wf-staff-id-badge{display:inline-flex;align-items:center;padding:5px 9px;border:1px solid #cbd5e1;border-radius:8px;background:#f1f5f9;color:#334155;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:.78rem;font-weight:700;letter-spacing:.015em;white-space:nowrap}
  #wfTeacherRegisterPanel td.teacher-name-cell{color:#0f172a!important;font-weight:700;letter-spacing:.005em}
  #wfTeacherRegisterPanel td.wf-phone-cell{color:#0d9488!important;font-weight:650;font-variant-numeric:tabular-nums;white-space:nowrap}
  #wfTeacherRegisterPanel tbody tr{transition:background-color .16s ease}
  #wfTeacherRegisterPanel tbody td{border-bottom:1px solid #e2e8f0;padding:12px 10px}
  #wfTeacherRegisterPanel tbody tr:hover{background:#f8fafc}
  .dark #wfTeacherRegisterPanel .wf-staff-id-badge{background:#26364a;color:#cbd5e1;border-color:#475569}
  .dark #wfTeacherRegisterPanel td.teacher-name-cell{color:#f8fafc!important}
  .dark #wfTeacherRegisterPanel td.wf-phone-cell{color:#5eead4!important}
  .dark #wfTeacherRegisterPanel tbody td{border-bottom-color:#334155}
  .dark #wfTeacherRegisterPanel tbody tr:hover{background:#102541}
  /* Clear action hierarchy for teacher and administrator management tables. */
  #wfTeacherRegisterPanel .wf-table-action{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:36px;padding:8px 12px!important;margin:2px 3px 2px 0;border:1px solid transparent!important;border-radius:10px!important;font-size:.76rem!important;font-weight:800!important;line-height:1.2;white-space:nowrap;box-shadow:none!important;transition:all .2s ease}
  #wfTeacherRegisterPanel .wf-table-action:hover{transform:translateY(-1px)}
  #wfTeacherRegisterPanel .wf-action-view{background:#e0f2fe!important;color:#075985!important;border-color:#bae6fd!important}
  #wfTeacherRegisterPanel .wf-action-view:hover{background:#bae6fd!important}
  #wfTeacherRegisterPanel .wf-action-edit{background:#fef3c7!important;color:#92400e!important;border-color:#fcd34d!important}
  #wfTeacherRegisterPanel .wf-action-edit:hover{background:#fde68a!important}
  #wfTeacherRegisterPanel .wf-action-primary{background:#0f172a!important;color:#fff!important;border-color:#d6a637!important}
  #wfTeacherRegisterPanel .wf-action-primary:hover{background:#1e293b!important}
  #wfTeacherRegisterPanel .wf-action-danger{background:#fff1f2!important;color:#be123c!important;border-color:#fecdd3!important}
  #wfTeacherRegisterPanel .wf-action-danger:hover{background:#ffe4e6!important}
  #wfTeacherRegisterPanel .wf-teacher-status{display:inline-flex;align-items:center;justify-content:center;padding:5px 10px;border:1px solid #bbf7d0;border-radius:999px;background:#dcfce7;color:#166534;font-size:.7rem;font-weight:850;white-space:nowrap}
  #wfTeacherRegisterPanel .wf-teacher-status.inactive{background:#f1f5f9;color:#475569;border-color:#cbd5e1}
  #wfTeacherRegisterPanel .wf-login-status{display:inline-flex;align-items:center;justify-content:center;margin:4px 0 0;padding:5px 9px;border:1px solid #bbf7d0;border-radius:999px;background:#ecfdf5;color:#166534;font-size:.68rem;font-weight:850;line-height:1;white-space:nowrap}
  #wfTeacherRegisterPanel .wf-login-status.pending{background:#f1f5f9;color:#64748b;border-color:#cbd5e1}
  #wfTeacherRegisterPanel .wf-action-reset{background:#ecfdf5!important;color:#166534!important;border-color:#a7f3d0!important}
  #wfTeacherRegisterPanel .wf-action-reset:hover{background:#d1fae5!important}
  #wfAdminPanel .wf-admin-pill{display:inline-flex;align-items:center;justify-content:center;padding:5px 10px;border:1px solid #cbd5e1;border-radius:999px;background:#f1f5f9;color:#475569;font-size:.7rem;font-weight:850;white-space:nowrap}
  #wfAdminPanel .wf-admin-pill.active{background:#d1fae5;color:#065f46;border-color:#a7f3d0}
  #wfAdminPanel .wf-table-action{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:8px 12px!important;margin:2px 3px 2px 0;border:1px solid #fecdd3!important;border-radius:10px!important;background:#fff1f2!important;color:#be123c!important;font-size:.76rem!important;font-weight:800!important;white-space:nowrap;transition:all .2s ease}
  #wfAdminPanel .wf-table-action:hover{background:#ffe4e6!important;transform:translateY(-1px)}
  .dark #wfTeacherRegisterPanel .wf-action-view{background:#12304a!important;color:#bae6fd!important;border-color:#285575!important}
  .dark #wfTeacherRegisterPanel .wf-action-edit{background:#443316!important;color:#fde68a!important;border-color:#765a23!important}
  .dark #wfTeacherRegisterPanel .wf-action-primary{background:#020617!important;color:#fff!important;border-color:#b88d32!important}
  .dark #wfTeacherRegisterPanel .wf-action-danger,#wfAdminPanel .wf-table-action{background:#4c1d2b!important;color:#fecdd3!important;border-color:#87334b!important}
  .dark #wfTeacherRegisterPanel .wf-teacher-status{background:#123b32;color:#a7f3d0;border-color:#17634f}
  .dark #wfTeacherRegisterPanel .wf-teacher-status.inactive,#wfAdminPanel .wf-admin-pill{background:#26364a;color:#cbd5e1;border-color:#475569}
  .dark #wfAdminPanel .wf-admin-pill.active{background:#123b32;color:#a7f3d0;border-color:#17634f}
  .dark #wfAdminPanel .wf-table-action:hover{background:#64263a!important}
  .dark #wfTeacherRegisterPanel .wf-rank-badge{background:#172f52;color:#93c5fd;border-color:#315987}
  .dark #wfTeacherRegisterPanel .wf-class-accent{color:#fbbf24}
  .dark #wfTeacherRegisterPanel .wf-membership-badge{background:#123b32;color:#6ee7b7;border-color:#17634f}
  .dark #wfTeacherRegisterPanel .wf-employer-badge{background:#26364a;color:#cbd5e1;border-color:#475569}
  /* Signature styling for teacher registration controls and photo upload. */
  #wfTeacherRegisterPanel #wfTeacherSave{
    display:inline-flex;align-items:center;justify-content:center;gap:8px;
    min-height:44px;padding:11px 20px!important;border:1px solid #b88d32!important;
    border-radius:12px!important;background:linear-gradient(115deg,#0f172a 0%,#172554 58%,#8a6825 150%)!important;
    color:#fff!important;font-weight:850!important;letter-spacing:.01em;
    box-shadow:0 4px 12px rgba(0,0,0,.15)!important;
    transition:all .2s ease;cursor:pointer
  }
  #wfTeacherRegisterPanel #wfTeacherSave:hover{
    transform:translateY(-2px);box-shadow:0 7px 18px rgba(15,23,42,.24)!important;
    background:linear-gradient(115deg,#172554 0%,#1e3a5f 58%,#a78332 150%)!important
  }
  #wfTeacherRegisterPanel #wfTeacherSave:active{transform:translateY(0);box-shadow:0 2px 6px rgba(0,0,0,.16)!important}
  #wfTeacherRegisterPanel #wfTeacherSave:focus-visible,#wfTeacherRegisterPanel #wfTeacherCancel:focus-visible{outline:3px solid #d6a637;outline-offset:3px}
  #wfTeacherRegisterPanel #wfTeacherCancel{
    display:inline-flex;align-items:center;justify-content:center;min-height:44px;
    padding:11px 18px!important;border:1px solid #cbd5e1!important;border-radius:12px!important;
    background:#f1f5f9!important;color:#334155!important;font-weight:750!important;
    transition:all .2s ease;cursor:pointer
  }
  #wfTeacherRegisterPanel #wfTeacherCancel:hover{background:#e2e8f0!important;transform:translateY(-1px)}
  #wfTeacherRegisterPanel #wfPassport{
    display:block;width:100%;max-width:100%;box-sizing:border-box;padding:9px 10px;
    border:1px solid #cbd5e1;border-radius:12px;background:#f8fafc;color:#334155;
    font:inherit;transition:border-color .2s ease,box-shadow .2s ease,background .2s ease
  }
  #wfTeacherRegisterPanel #wfPassport::file-selector-button{
    margin:0 12px 0 0;padding:8px 12px;border:1px solid #cbd5e1;border-radius:9px;
    background:#e2e8f0;color:#334155;font:inherit;font-weight:750;cursor:pointer;
    transition:all .2s ease
  }
  #wfTeacherRegisterPanel #wfPassport::file-selector-button:hover{background:#cbd5e1}
  #wfTeacherRegisterPanel #wfPassport:focus-visible{outline:0;border-color:#d6a637;box-shadow:0 0 0 3px rgba(214,166,55,.2)}
  .dark #wfTeacherRegisterPanel #wfTeacherCancel{background:#26364a!important;color:#e2e8f0!important;border-color:#475569!important}
  .dark #wfTeacherRegisterPanel #wfTeacherCancel:hover{background:#334155!important}
  .dark #wfTeacherRegisterPanel #wfPassport{background:#172033;color:#e2e8f0;border-color:#475569}
  .dark #wfTeacherRegisterPanel #wfPassport::file-selector-button{background:#26364a;color:#e2e8f0;border-color:#475569}
  .dark #wfTeacherRegisterPanel #wfPassport::file-selector-button:hover{background:#334155}
  .dark #wfTeacherRegisterPanel #wfTeacherSave{background:linear-gradient(115deg,#020617 0%,#172554 58%,#8a6825 150%)!important}
  @media(max-width:640px){
    #wfTeacherRegisterPanel .wf-accent-cell{padding-left:9px;padding-right:9px}
    #wfTeacherRegisterPanel .wf-rank-badge,#wfTeacherRegisterPanel .wf-membership-badge,#wfTeacherRegisterPanel .wf-employer-badge{padding:4px 8px;font-size:.72rem}
  }`;
  document.head.appendChild(style);
 };
 ensureTeacherTableAccentStyles();
 const teacherLoginState=t=>{
   const activated=!!(t?.auth_user_id||t?.login_activated===true||String(t?.login_activated||'').toLowerCase()==='true');
   const passwordSet=activated&&t?.must_change_password===false;
   return {activated,label:passwordSet?'Password Set':activated?'Login Active':'Not Activated'};
 };
 const renderTeacherTables=()=>{const q=String($('wfTeacherSearch')?.value||'').trim().toLowerCase();const visible=teachers.filter(t=>[t.id,t.name,t.phone,t.rank,t.class_name,t.membership_type,t.employer].some(v=>String(v||'').toLowerCase().includes(q)));
 $('wfManageTeacherRows').innerHTML=tr.error?'<tr><td colspan="9">Teacher register could not be loaded. Check the school connection and permissions, then <button type="button" class="wf-table-action" data-wf-retry-roster>Retry loading</button>.</td></tr>':visible.length?visible.map(t=>{const login=teacherLoginState(t);return '<tr><td class="wf-staff-id-cell"><span class="wf-staff-id-badge">'+esc(t.id)+'</span></td><td class="teacher-name-cell">'+esc(t.name)+'</td><td class="wf-phone-cell">'+esc(t.phone||'—')+'</td><td class="wf-accent-cell wf-rank-cell"><span class="wf-rank-badge">'+esc(t.rank||'—')+'</span></td><td class="wf-accent-cell"><span class="wf-class-accent">'+esc(t.class_name||'—')+'</span></td><td class="wf-accent-cell"><span class="wf-membership-badge">'+esc(t.membership_type||'—')+'</span></td><td class="wf-accent-cell"><span class="wf-employer-badge">'+esc(t.employer||'—')+'</span></td><td><span class="wf-teacher-status '+(t.is_active===false?'inactive':'active')+'">'+(t.is_active===false?'Inactive':'Active')+'</span><br><span class="wf-login-status '+(login.activated?'active':'pending')+'">'+esc(login.label)+'</span></td><td><button type="button" class="wf-table-action wf-action-view" data-view-profile="'+esc(t.id)+'">View profile</button> <button type="button" class="wf-table-action wf-action-edit" data-wf-edit="'+esc(t.id)+'">Edit</button> <button type="button" class="wf-table-action '+(login.activated?'wf-action-reset':'wf-action-primary')+'" data-wf-activate="'+esc(t.id)+'">'+(login.activated?'✓ Reset login':'Activate login')+'</button> '+(t.is_active===false?'<button type="button" class="wf-table-action wf-action-primary" data-wf-restore="'+esc(t.id)+'">Restore</button>':'<button type="button" class="wf-table-action wf-action-danger" data-wf-remove="'+esc(t.id)+'">Deactivate</button>')+'</td></tr>';}).join(''):'<tr><td colspan="9">No matching teachers.</td></tr>';};
 if(window.__welfareScheduleNonCritical)window.__welfareScheduleNonCritical(renderTeacherTables,$('wfManageTeacherRows'));else renderTeacherTables();
 // Expose an awaited, tenant-bound register hydration path for executive PDF exports.
 // It reloads source records instead of trusting a possibly stale or empty DOM table.
 let teacherRegisterReloadPromise=null;
 const reloadTeacherRegisterForExport=async()=>{
  if(teacherRegisterReloadPromise)return teacherRegisterReloadPromise;
  teacherRegisterReloadPromise=(async()=>{
   const expectedCode=String(ctx.school_code||ctx.schoolCode||'').trim().toUpperCase();
   if(!expectedCode||String(window.__welfareCurrentSchool?.id||'')!==String(ctx.id||''))throw new Error('The active school context changed. Refresh the portal and retry.');
   // Section entry and retry actions always re-query: a matching cache may itself
   // be an empty result captured while authentication was still hydrating.
   let next;
   if(isLocalDemo&&typeof window.WelfareDemo?.loadTeacherRegister==='function'){
    const rows=await window.WelfareDemo.loadTeacherRegister(ctx.school_code);
    next={data:Array.isArray(rows)?rows:[],error:null};
   }else next=await teacherQuery('*');
   const fallbacks=['id,name,phone,rank,class_name,is_active,passport,created_at','id,name,phone,rank,class_name,is_active,passport','id,name,phone,rank,class_name,passport','id,name,phone,rank,class_name,is_active','id,name,phone,rank,class_name'];
   for(const fields of fallbacks){if(!next?.error)break;next=await teacherQuery(fields);}
   if(next?.error)throw new Error('The school teacher register could not be loaded. Check the connection and school access, then retry the PDF.');
   const normalizedRows=(next.data||[]).map(row=>{
    const normalized=typeof window.normalizeTeacherProfileRecord==='function'?window.normalizeTeacherProfileRecord(row):row;
    return {...normalized,is_active:typeof normalized.is_active==='boolean'?normalized.is_active:true,passport:normalized.passport??null};
   });
   const accountResult=await loadSource('teacher login accounts refresh',()=>client.from('teacher_accounts').select('auth_user_id,teacher_id,school_id,must_change_password,active').eq('school_id',ctx.id).eq('active',true));
   loginAccounts=new Map((accountResult.data||[]).map(account=>[String(account.teacher_id),account]));
   teachers=normalizedRows.map(row=>{const account=loginAccounts.get(String(row.id));return {...row,auth_user_id:account?.auth_user_id||null,login_activated:!!account?.auth_user_id,must_change_password:account?.must_change_password??null};});
   tr={data:teachers,error:null};
   window.__welfareTeacherRegisterState={schoolId:String(ctx.id||''),schoolCode:String(ctx.school_code||ctx.schoolCode||'').toUpperCase(),rows:teachers};
   tr={data:teachers,error:null};
   teacherById.clear();teachers.forEach(row=>teacherById.set(String(row.id),row));
   if(!selectedProfileTeacherId||!teachers.some(row=>String(row.id)===String(selectedProfileTeacherId)))selectedProfileTeacherId=String(chooseInitialProfileTeacher(teachers)?.id||'');
   renderTeacherTables();
   if(profileSelect){profileSelect.innerHTML=teachers.map(row=>'<option value="'+esc(row.id)+'">'+esc(row.name||row.id)+' ('+esc(row.id)+')</option>').join('');profileSelect.value=selectedProfileTeacherId;}
   const teacherOptions='<option value="">Choose teacher</option>'+teachers.filter(row=>row.is_active!==false).map(row=>'<option value="'+esc(row.id)+'">'+esc(row.name)+' ('+esc(row.id)+')</option>').join('');
   ['wfConTeacher','wfPayTeacher','wfStatementTeacher'].forEach(id=>{const select=$(id);if(select){const previous=select.value;select.innerHTML=teacherOptions;if(Array.from(select.options).some(option=>option.value===previous))select.value=previous;}});
   const count=$('teacherCount');if(count)count.textContent=String(teachers.filter(row=>row.is_active!==false).length);
   renderSelectedTeacherProfile();
   return teachers.map(row=>({...row}));
  })().finally(()=>{teacherRegisterReloadPromise=null;});
  return teacherRegisterReloadPromise;
 };
 window.__welfareEnsureTeacherRegisterLoaded=async expectedSchoolCode=>{
  const expected=String(expectedSchoolCode||ctx.school_code||'').trim().toUpperCase();
  const actual=String(ctx.school_code||ctx.schoolCode||'').trim().toUpperCase();
  if(!actual||expected!==actual)throw new Error('The active school context changed. Refresh the portal before exporting this register.');
  if(String(window.__welfareCurrentSchool?.id||'')!==String(ctx.id||''))throw new Error('The active school tenant is no longer available. Refresh and retry.');
  return reloadTeacherRegisterForExport();
 };
 $('wfTeacherSearch').addEventListener('input',()=>frameRender($('wfManageTeacherRows'),renderTeacherTables));
 $('wfManageTeacherRows').addEventListener('click',async e=>{
   const retryRoster=e.target.closest('[data-wf-retry-roster]');
   if(retryRoster){
    retryRoster.disabled=true;
    try{await window.__welfareEnsureTeacherRegisterLoaded(ctx.school_code);msg('wfTeacherMsg','Teacher register refreshed successfully.');}
    catch(error){msg('wfTeacherMsg',error?.message||'Teacher register is still unavailable. Please retry.',true);}
    return;
   }
   const viewButton=e.target.closest('[data-view-profile]');
   if(viewButton){selectedProfileTeacherId=String(viewButton.dataset.viewProfile);if(profileSelect)profileSelect.value=selectedProfileTeacherId;renderSelectedTeacherProfile();const nav=document.querySelector('.sidebar .navbtn[data-target="teacherProfileViewer"]');if(nav)nav.click();return;}
   const deactivateButton=e.target.closest('[data-wf-remove]');
   if(deactivateButton){
     const teacher=teachers.find(t=>String(t.id)===String(deactivateButton.dataset.wfRemove));
     if(!teacher)return msg('wfTeacherMsg','That teacher is no longer in the loaded roster. Refresh and try again.',true);
     if(teacher.is_active===false)return msg('wfTeacherMsg','This teacher is already inactive.',true);
     const confirmation=await wfConfirm('OK to deactivate '+teacher.name+' ('+teacher.id+')?\n\nThe teacher will be removed from the active register and will no longer be eligible to sign in. Existing contributions, payouts and historical records will be retained.\n\nSelect Cancel to leave the teacher active.',{responseMode:'optional',placeholder:'Optional note for the audit trail…'});
      if(!confirmation||confirmation.confirmed===false)return;
      const adminNote=confirmation.response||'No additional note supplied; action confirmed by school administrator.';
     deactivateButton.disabled=true;
     msg('wfTeacherMsg','Deactivating '+teacher.name+'…');
     try{
       const {error}=await client.from('teachers').update({is_active:false}).eq('id',teacher.id).eq('school_id',ctx.id);
       if(error)throw new Error(error.message||'The teacher could not be deactivated.');
       const auditOk=await audit(client,ctx,'Deactivate teacher profile',teacher.name+' ('+teacher.id+'); existing financial history retained.; admin note: '+adminNote,teacher.id);
       await refreshWorkflow();
       msg('wfTeacherMsg',auditOk?teacher.name+' has been deactivated successfully. Financial history was retained.':teacher.name+' was deactivated, but the audit entry failed. Notify the platform administrator.',!auditOk);
     }catch(error){
       console.error('[School Welfare] Teacher deactivation failed:',error);
       msg('wfTeacherMsg',error.message||'Teacher deactivation failed. No change was confirmed.',true);
       deactivateButton.disabled=false;
     }
     return;
   }
   const button=e.target.closest('[data-wf-activate]');if(!button)return;
   const teacher=teachers.find(t=>String(t.id)===String(button.dataset.wfActivate));
   if(!teacher)return msg('wfTeacherMsg','That teacher is no longer in the loaded roster. Refresh and try again.',true);
   if(teacher.is_active===false)return msg('wfTeacherMsg','Restore this teacher first, then activate the sign-in.',true);
   const isReset=button.textContent.toLowerCase().includes('reset');
   if(!await wfConfirm((isReset?'Create or reset':'Activate')+' the secure sign-in for '+teacher.name+' ('+teacher.id+')? The teacher’s Staff ID ('+teacher.id+') will be set as the temporary login password, and any previous password will stop working. Share the Staff ID privately; the teacher must change it after signing in.'))return;
   button.disabled=true;msg('wfTeacherMsg','Securing teacher sign-in…');
   try{
     const {data,error}=await client.functions.invoke('provision-teacher-account',{body:{school_id:ctx.id,teacher_id:teacher.id}});
     if(error||!data?.ok)throw new Error(data?.error||error?.message||'Teacher sign-in could not be activated.');
     await audit(client,ctx,'Activate/reset teacher sign-in','Secure teacher account activated/reset for Staff ID '+teacher.id+'.',teacher.id);
     teacher.login_activated=true;
     if(data.auth_user_id)teacher.auth_user_id=data.auth_user_id;
     teacher.must_change_password=true;
     renderTeacherTables();
     msg('wfTeacherMsg','Sign-in activated for '+teacher.name+'. The Staff ID is the temporary login password.');
     wfNotice('TEACHER SIGN-IN ACTIVATED\\nSchool: '+ctx.name+'\\nTeacher: '+data.teacher_name+'\\nStaff ID: '+data.staff_id+'\\nTemporary login password (Staff ID): '+data.initial_password+'\\n\\nShare the Staff ID privately. The teacher must change it after signing in.');
   }catch(error){msg('wfTeacherMsg',error.message||'Teacher sign-in could not be activated. No success was assumed.',true);}
   finally{button.disabled=false;}
 });

 const adminContributionRecordsMetric=$('adminContributionRecordsMetric');if(adminContributionRecordsMetric)adminContributionRecordsMetric.hidden=false;
 window.applyDashboardMetricLayout?.();
 const adminContributionRecordsCount=$('adminContributionRecordsCount');if(adminContributionRecordsCount)adminContributionRecordsCount.textContent=(cr.error||rr.error)?'Unavailable':String(activeCons.length);
 const options='<option value="">Choose teacher</option>'+teachers.filter(t=>t.is_active!==false).map(t=>'<option value="'+esc(t.id)+'">'+esc(t.name)+' ('+esc(t.id)+')</option>').join('');
 $('wfConTeacher').innerHTML=options;$('wfPayTeacher').innerHTML=options;$('wfStatementTeacher').innerHTML=options;
 const reversalCell=(type,x)=>reversed.has(type+':'+x.id)?'<strong class="wf-reversed-label">REVERSED</strong> <span class="muted">· '+esc(reversals.find(r=>r.transaction_type===type&&String(r.transaction_id)===String(x.id))?.reason||'Reason recorded')+'</span>':'<button type="button" class="wf-reverse-action" data-wf-reverse="'+type+'" data-wf-id="'+esc(x.id)+'"><i class="fa-solid fa-rotate-left" aria-hidden="true"></i> Reverse</button>';
 const renderContributionLedger=()=>{
    const q=String($('wfLedgerSearch')?.value||'').trim().toLowerCase(),month=$('wfLedgerMonth')?.value||'';
    const rows=cons.filter(x=>(!month||String(x.date||'').startsWith(month))&&[x.teacher_id,x.reference,teacherById.get(String(x.teacher_id))?.name].some(v=>String(v||'').toLowerCase().includes(q))).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.id||'').localeCompare(String(b.id||'')));
    const totalCon=activeCons.reduce((n,x)=>n+Number(x.amount||0),0),totalPay=activePays.reduce((n,x)=>n+Number(x.amount||0),0);
    $('wfConTotal').textContent=cr.error?'Unavailable':'GH₵ '+money(totalCon);
    $('wfConDisbursement').textContent=pr.error?'Unavailable':'GH₵ '+money(totalPay);
    $('wfConNet').textContent=(cr.error||pr.error)?'Unavailable':'GH₵ '+money(totalCon-totalPay);
    let runningTotal=0;
    $('wfConRows').innerHTML=cr.error?'<tr><td colspan="7">Contribution records could not be loaded. Check school account permissions and <button type="button" class="wf-table-action" data-wf-retry-ledgers>Retry loading</button>.</td></tr>':rows.length?rows.map(x=>{
     const d=String(x.date||''),monthYear=d.length>=7?new Date(d+'T00:00:00').toLocaleDateString('en-GB',{month:'short',year:'numeric'}):'—';
     const reversedEntry=reversed.has('contribution:'+x.id);
     if(!reversedEntry)runningTotal+=Number(x.amount||0);
     const action=reversedEntry?'<span class="wf-admin-pill">Reversed</span>':'<button type="button" class="secondary" data-wf-reverse="contribution" data-wf-id="'+esc(x.id)+'">Reverse</button>';
     return '<tr><td>'+teacherLabel(x.teacher_id)+'</td><td>'+esc(monthYear)+'</td><td>'+esc(x.reference||'—')+'</td><td>GH₵ '+money(x.amount)+'</td><td class="wf-payout-amount">GH₵ '+money(runningTotal)+'</td><td>'+esc(d||'—')+'</td><td>'+action+'</td></tr>';
    }).join(''):'<tr><td colspan="7">No matching contributions.</td></tr>';
  };
  if(window.__welfareScheduleNonCritical)window.__welfareScheduleNonCritical(renderContributionLedger,$('wfConRows'));else renderContributionLedger();$('wfLedgerSearch').addEventListener('input',()=>frameRender($('wfConRows'),renderContributionLedger));$('wfLedgerMonth').addEventListener('change',()=>frameRender($('wfConRows'),renderContributionLedger));
  const renderDuesMatrix=()=>{
    const rowsHost=$('wfDuesMatrixRows'),status=$('wfDuesMatrixStatus');
    if(!rowsHost)return;
    if(tr.error||cr.error||rr.error){
      rowsHost.innerHTML='<tr><td colspan="13">The teacher register, contribution ledger, or reversal status could not be verified. The matrix is unavailable to avoid showing incorrect paid status.</td></tr>';
      if(status)status.textContent='Unavailable — check school data access and refresh.';
      return;
    }
    const year=String($('wfDuesMatrixYear')?.value||'');
    if(!/^\d{4}$/.test(year)){
      rowsHost.innerHTML='<tr><td colspan="13">Choose a valid reporting year.</td></tr>';
      if(status)status.textContent='';
      return;
    }
    const query=String($('wfDuesMatrixSearch')?.value||'').trim().toLowerCase();
    const roster=teachers.filter(teacher=>teacher.is_active!==false&&[
      teacher.name,teacher.id,teacher.staff_id,teacher.staffId
    ].some(value=>String(value??'').toLowerCase().includes(query)));
    const totals=new Map();
    activeCons.forEach(item=>{
      const date=String(item.date||'').slice(0,10),match=date.match(/^(\d{4})-(\d{2})-/);
      if(!match||match[1]!==year)return;
      const month=Number(match[2]);if(month<1||month>12)return;
      const key=String(item.teacher_id)+'|'+month;
      totals.set(key,(totals.get(key)||0)+Number(item.amount||0));
    });
    if(!roster.length){
      rowsHost.innerHTML='<tr><td colspan="13">'+(query?'No active members match this search.':'No active members are registered for this school.')+'</td></tr>';
      if(status)status.textContent='0 teachers shown · '+year;
      return;
    }
    rowsHost.innerHTML=roster.map(teacher=>{
      const name=esc(teacher.name||'Unnamed member'),staffId=esc(teacher.staff_id||teacher.staffId||teacher.id||'—');
      const cells=Array.from({length:12},(_,index)=>{
        const amount=totals.get(String(teacher.id)+'|'+(index+1))||0;
        return amount>0?'<td><span class="wf-dues-matrix-cell-paid" title="Active contributions recorded: GH₵ '+money(amount)+'">✓ GH₵ '+money(amount)+'</span></td>':'<td><span class="wf-dues-matrix-cell-unpaid" aria-label="Unpaid or missing">—</span></td>';
      }).join('');
      return '<tr><td><span class="wf-dues-matrix-teacher">'+name+'<small>Staff ID: '+staffId+'</small></span></td>'+cells+'</tr>';
    }).join('');
    const yearRecords=activeCons.filter(item=>String(item.date||'').slice(0,4)===year).length;
    if(status)status.textContent=roster.length+' active member'+(roster.length===1?'':'s')+' shown · '+year+' · '+yearRecords+' active contribution record'+(yearRecords===1?'':'s');
  };
  if(window.__welfareScheduleNonCritical)window.__welfareScheduleNonCritical(renderDuesMatrix,$('wfDuesMatrixRows'));else renderDuesMatrix();
  $('wfDuesMatrixYear')?.addEventListener('change',()=>frameRender($('wfDuesMatrixRows'),renderDuesMatrix));
   $('wfDuesMatrixSearch')?.addEventListener('input',()=>frameRender($('wfDuesMatrixRows'),renderDuesMatrix));
  const duesMatrixPdfButton=$('wfDuesMatrixPdf');
  if(duesMatrixPdfButton){
   duesMatrixPdfButton.addEventListener('click',async()=>{
    const button=duesMatrixPdfButton,status=$('wfDuesMatrixStatus');
    if(button.disabled)return;
    const original=button.innerHTML;button.disabled=true;button.setAttribute('aria-busy','true');
    button.innerHTML='<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Preparing PDF…';
    const reportHostId='wfDuesMatrixPdfHost';
    let report=null;
    try{
     await new Promise(resolve=>requestAnimationFrame(resolve));
     if(tr.error||cr.error||rr.error)throw new Error('The school roster, contribution ledger, and reversal status must all be available before this official report can be issued.');
     if(typeof window.html2pdf!=='function')throw new Error('The PDF library is unavailable. Check your connection and try again.');
     // Verification is best-effort for this report: a slow or unavailable
     // registry must never prevent the school from receiving its PDF.
     const selectedYear=String($('wfDuesMatrixYear')?.value||'');
     if(!/^\d{4}$/.test(selectedYear))throw new Error('Choose a valid reporting year.');
     const searchTerm=String($('wfDuesMatrixSearch')?.value||'').trim().toLowerCase();
     const roster=teachers.filter(teacher=>teacher.is_active!==false&&[
      teacher.name,teacher.id,teacher.staff_id,teacher.staffId
     ].some(value=>String(value??'').toLowerCase().includes(searchTerm)));
     if(!roster.length)throw new Error(searchTerm?'No active members match the current search.':'No active members are registered for this school.');
     const monthNames=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
     const monthTotals=Array(12).fill(0),matrixRows=roster.map(teacher=>{
      const amounts=Array(12).fill(0);
      activeCons.forEach(item=>{
       if(String(item.teacher_id)!==String(teacher.id))return;
       const date=String(item.date||'').slice(0,10),match=date.match(/^(\d{4})-(\d{2})-/);
       if(!match||match[1]!==selectedYear)return;
       const month=Number(match[2]);if(month<1||month>12)return;
       amounts[month-1]+=Number(item.amount||0);
      });
      amounts.forEach((amount,index)=>monthTotals[index]+=amount);
      return {teacher,amounts,total:amounts.reduce((sum,value)=>sum+value,0)};
     });
     const grandTotal=monthTotals.reduce((sum,value)=>sum+value,0);
     const schoolName=String(ctx.name||ctx.school_name||'School Welfare').trim();
     const schoolCode=String(ctx.school_code||ctx.schoolCode||'').trim().toUpperCase();
     if(!ctx.id||!schoolCode)throw new Error('The active school identity could not be verified. The PDF was not issued.');
     const documentId=crypto.randomUUID();
     const issued=new Date();
     let verificationRegistered=false;
     if(typeof window.registerTenantStatementVerification==='function'){
      try{
       await Promise.race([
        window.registerTenantStatementVerification({school_code:schoolCode,document_id:documentId,document_type:'dues-matrix',period:'Calendar year '+selectedYear,academic_year:window.getCurrentAcademicYear()}).then(result=>{verificationRegistered=!!result?.success;return result;}),
        new Promise((_,reject)=>setTimeout(()=>reject(new Error('Verification registration timed out.')),5000))
       ]);
      }catch(verificationError){console.warn('[School Welfare] Dues matrix verification registration deferred; PDF will still be downloaded:',verificationError?.message||verificationError);}
     }
     const includeVerificationQr=verificationRegistered&&typeof window.QRCode==='function';
     const escapePdf=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
     const logo=typeof window.getWelfareTenantLogoDataUrl==='function'?window.getWelfareTenantLogoDataUrl(ctx):'';
     const logoMarkup=logo?'<img class="wf-dm-crest" src="'+logo+'" alt="'+escapePdf(schoolName)+' school crest">':'<div class="wf-dm-crest-placeholder" aria-hidden="true">✦</div>';
     const headCells=monthNames.map(month=>'<th scope="col">'+month+'</th>').join('');
     const bodyRows=matrixRows.map(({teacher,amounts,total})=>{
      const name=escapePdf(teacher.name||'Unnamed member'),staff=escapePdf(teacher.staff_id||teacher.staffId||teacher.id||'—');
      const cells=amounts.map(amount=>'<td class="'+(amount>0?'is-paid':'is-unpaid')+'">'+(amount>0?'GH₵ '+money(amount):'—')+'</td>').join('');
      return '<tr><td class="wf-dm-member"><strong>'+name+'</strong><small>Staff ID: '+staff+'</small></td>'+cells+'<td class="wf-dm-total">GH₵ '+money(total)+'</td></tr>';
     }).join('');
     const totalsRow='<tr class="wf-dm-totals"><th scope="row">MONTHLY TOTAL</th>'+monthTotals.map(amount=>'<td>GH₵ '+money(amount)+'</td>').join('')+'<td>GH₵ '+money(grandTotal)+'</td></tr>';
     const qrId='wfDuesMatrixQr_'+documentId.replace(/-/g,'');
     report=document.createElement('div');report.id=reportHostId;report.className='school-welfare-summary-pdf wf-dues-matrix-pdf';
     report.setAttribute('data-welfare-pdf-staging','');report.style.cssText='display:none!important;visibility:hidden!important;opacity:0!important;position:fixed!important;left:-10000px!important;top:0!important;width:281mm!important;min-width:281mm!important;max-width:281mm!important;height:auto!important;min-height:150mm!important;max-height:none!important;overflow:visible!important;pointer-events:none!important;margin:0;padding:6mm 7mm;box-sizing:border-box;background:#ffffff!important;color:#14213d!important;color-scheme:light!important;font-family:Arial,Helvetica,sans-serif';
     report.innerHTML='<style>'+
      '#'+reportHostId+'{background:#fff!important;color:#14213d!important;font-family:Arial,Helvetica,sans-serif!important;font-size:9.5pt!important;line-height:1.4!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}'+
      '#'+reportHostId+' .wf-dm-header{display:grid;grid-template-columns:18mm 1fr 24mm;align-items:center;gap:5mm;margin:0 0 3mm;min-height:19mm}'+
      '#'+reportHostId+' .wf-dm-crest{display:block;width:17mm;height:17mm;object-fit:contain;background:transparent!important;border:0!important;outline:0!important;box-shadow:none!important;padding:0!important;border-radius:0!important}'+
      '#'+reportHostId+' .wf-dm-crest-placeholder{width:17mm;height:17mm;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:22pt}'+
      '#'+reportHostId+' .wf-dm-heading{text-align:center}'+
      '#'+reportHostId+' .wf-dm-heading h2{margin:0;font-size:10.5pt;letter-spacing:1px;color:#17365d}'+
      '#'+reportHostId+' .wf-dm-heading h1{margin:1mm 0;font-size:17pt;line-height:1.18;color:#142d52}'+
      '#'+reportHostId+' .wf-dm-heading p{margin:0;font-size:9.5pt;font-weight:700;letter-spacing:.8px;color:#0f766e}'+
      '#'+reportHostId+' .wf-dm-meta{display:flex;justify-content:space-between;gap:8px;margin:0 0 2.5mm;padding:2mm 0;border-top:1px solid #cbd5e1;border-bottom:1px solid #cbd5e1;font-size:8.5pt}'+
      '#'+reportHostId+' .wf-dm-table{width:100%;table-layout:fixed;border-collapse:collapse!important;white-space:normal!important;font-size:8.2pt!important;line-height:1.3!important}'+
      '#'+reportHostId+' .wf-dm-table th,#'+reportHostId+' .wf-dm-table td{border:1px solid #000000!important;padding:1.9mm .65mm!important;text-align:center;vertical-align:middle;overflow-wrap:anywhere;color:#14213d;background:#fff}'+
      '#'+reportHostId+' .wf-dm-table thead th{background:#e8f3ef!important;color:#064e3b!important;font-size:8.2pt!important;font-weight:800!important}'+
      '#'+reportHostId+' .wf-dm-table .wf-dm-member{width:43mm;text-align:left!important}'+
      '#'+reportHostId+' .wf-dm-table .wf-dm-member strong{display:block;font-size:7pt}'+
      '#'+reportHostId+' .wf-dm-table .wf-dm-member small{display:block;margin-top:.6mm;font-size:7pt;color:#475569}'+
      '#'+reportHostId+' .wf-dm-table .is-paid{font-weight:700;color:#065f46}'+
      '#'+reportHostId+' .wf-dm-table .is-unpaid{color:#64748b}'+
      '#'+reportHostId+' .wf-dm-table .wf-dm-total{font-weight:800;background:#f1f5f9!important}'+
      '#'+reportHostId+' .wf-dm-table .wf-dm-totals th,#'+reportHostId+' .wf-dm-table .wf-dm-totals td{background:#d1fae5!important;color:#064e3b!important;font-weight:900!important}'+
      '#'+reportHostId+' .wf-dm-bottom{display:flex;justify-content:space-between;align-items:flex-end;gap:8mm;margin-top:2mm;break-inside:avoid;page-break-inside:avoid}'+
      '#'+reportHostId+' .wf-dm-summary{font-size:8pt;font-weight:800;color:#064e3b}'+
      '#'+reportHostId+' .wf-dm-qr{text-align:right;min-width:23mm;font-size:6pt;color:#475569}'+
      '#'+reportHostId+' .wf-dm-qr img,#'+reportHostId+' .wf-dm-qr canvas{display:block;width:19mm!important;height:19mm!important;margin:0 0 1mm auto!important}'+
      '#'+reportHostId+' .sws-disclaimer{font-weight:700!important;display:block;width:100%;max-width:100%;box-sizing:border-box;margin:2mm 0 0;padding:1mm 0;border-top:1px dotted #64748b;border-bottom:1px dotted #64748b;color:#334155;font-family:Arial,sans-serif;font-size:8pt;font-weight:700!important;line-height:1.3;text-align:center;white-space:normal;overflow-wrap:anywhere}'+
      '@media print{#'+reportHostId+'{width:281mm!important;max-width:281mm!important;margin:0!important;padding:6mm 7mm!important;box-sizing:border-box!important}}'+
      '</style>'+
      '<header class="wf-dm-header">'+logoMarkup+'<div class="wf-dm-heading"><h2>GHANA EDUCATION SERVICE</h2><h1>'+escapePdf(schoolName)+'</h1><p>MONTH-BY-MONTH DUES MATRIX</p></div><div></div></header>'+
      '<div class="wf-dm-meta"><span><b>School code:</b> '+escapePdf(schoolCode)+'</span><span><b>Calendar year:</b> '+selectedYear+'</span><span><b>Members:</b> '+matrixRows.length+'</span><span><b>Date issued:</b> '+issued.toLocaleDateString('en-GB')+'</span></div>'+
      '<table class="wf-dm-table"><colgroup><col style="width:43mm">'+monthNames.map(()=>'<col>').join('')+'<col style="width:22mm"></colgroup><thead><tr><th scope="col">Teacher / Staff ID</th>'+headCells+'<th scope="col">Row Total</th></tr></thead><tbody>'+bodyRows+totalsRow+'</tbody></table>'+
      '<div class="wf-dm-bottom"><div class="wf-dm-summary">School contribution total for '+selectedYear+': GH₵ '+money(grandTotal)+'<br>Active members included: '+matrixRows.length+(searchTerm?'<br>Search filter: '+escapePdf($('wfDuesMatrixSearch')?.value||''):'')+'</div>'+(includeVerificationQr?'<div class="wf-dm-qr"><div id="'+qrId+'"></div>Scan to verify this official report</div>':'')+'</div>'+
      '<div class="sws-disclaimer">*** The School welfare is not liable for any financial loss resulting from disclosing your member/account details including password to Third Parties ***</div>';
     if(typeof window.applyWelfarePdfTenantWatermark==='function')window.applyWelfarePdfTenantWatermark(report,schoolName,ctx);
     document.body.appendChild(report);
     // Keep the A4 template hidden while it is assembled. It becomes a
     // measurable off-screen capture source only for the rasterization window.
     report.style.setProperty('display','none','important');
     report.style.setProperty('visibility','hidden','important');
     report.style.setProperty('opacity','0','important');
     report.style.setProperty('position','fixed','important');
     report.style.setProperty('left','-10000px','important');
     report.style.setProperty('top','0','important');
     report.style.setProperty('width','281mm','important');
     report.style.setProperty('min-width','281mm','important');
     report.style.setProperty('max-width','281mm','important');
     report.style.setProperty('height','auto','important');
     report.style.setProperty('min-height','150mm','important');
     report.style.setProperty('max-height','none','important');
     report.style.setProperty('overflow','visible','important');
     report.style.setProperty('background','#ffffff','important');
     report.style.setProperty('color','#14213d','important');
     report.style.setProperty('color-scheme','light','important');
     report.style.setProperty('pointer-events','none','important');
     const qrNode=report.querySelector('#'+qrId);
     if(includeVerificationQr){
      try{
       const qrNode=report.querySelector('#'+qrId);
       new window.QRCode(qrNode,{text:'https://abcollins93.github.io/TEACHERS-WELFARE/verify.html?c='+encodeURIComponent(schoolCode)+'&d='+encodeURIComponent(documentId),width:300,height:300,colorDark:'#030a16',colorLight:'#ffffff',correctLevel:window.QRCode.CorrectLevel.M});
       await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
       if(!qrNode.querySelector('canvas,img'))throw new Error('QR image was not created.');
      }catch(qrError){
       console.warn('[School Welfare] Dues matrix QR could not be rendered; continuing without QR:',qrError?.message||qrError);
       report.querySelector('.wf-dm-qr')?.remove();
      }
     }
     const filename=(schoolCode.replace(/[^a-z0-9_-]/gi,'_')||'school')+'-dues-matrix-'+selectedYear+'.pdf';
     // Keep the capture node attached, measurable and fully laid out before
     // html2canvas snapshots it. Waiting for fonts/images prevents blank pages.
     await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
     if(document.fonts?.ready)await document.fonts.ready;
     const reportImages=Array.from(report.querySelectorAll('img'));
     await Promise.all(reportImages.map(async image=>{
      if(image.complete&&image.naturalWidth>0)return;
      if(typeof image.decode==='function'){try{await image.decode();return;}catch(_){}}
      await new Promise(resolve=>{image.addEventListener('load',resolve,{once:true});image.addEventListener('error',resolve,{once:true});});
     }));
     // Reveal only for layout measurement and rasterization. This node is
     // fixed off-screen, so it cannot flash over the portal on mobile.
     report.style.setProperty('display','block','important');
     report.style.setProperty('visibility','visible','important');
     report.style.setProperty('opacity','1','important');
     const reportWidth=Math.ceil(report.getBoundingClientRect().width||report.scrollWidth);
     const reportHeight=Math.ceil(report.getBoundingClientRect().height||report.scrollHeight);
     const tableBody=report.querySelector('.wf-dm-table tbody');
     const tableRows=tableBody?.querySelectorAll('tr')?.length||0;
     const reportText=String(report.textContent||'').trim();
     if(reportWidth<700||reportHeight<100||tableRows<2||reportText.length<100||!report.querySelector('.wf-dm-header h1')||!report.querySelector('.wf-dm-meta'))throw new Error('The dues matrix report did not finish rendering with its school header, reporting year and member rows. Please try again.');
     const pdfOptions={margin:0,filename,image:{type:'png'},html2canvas:{scale:3,useCORS:true,letterRendering:true,allowTaint:false,backgroundColor:'#ffffff',logging:false,scrollX:0,scrollY:0,windowWidth:Math.max(reportWidth,document.documentElement.clientWidth),windowHeight:Math.max(reportHeight,document.documentElement.clientHeight),width:reportWidth,height:reportHeight},jsPDF:{unit:'mm',format:'a4',orientation:'landscape',compress:true},pagebreak:{mode:['css'],avoid:['tr','.wf-dm-bottom']}};
     if(typeof window.html2canvas!=='function')throw new Error('The PDF image renderer is unavailable. Refresh the portal and try again.');
     // Match the proven member-statement pipeline: capture the populated DOM
     // directly, then hand the verified canvas to html2pdf for A4 pagination.
     // html2pdf.from(report).toCanvas() can clone an off-screen, zero-viewport
     // staging node into an entirely white canvas on mobile browsers.
     await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
     const renderedCanvas=await window.html2canvas(report,pdfOptions.html2canvas);
     if(!renderedCanvas||renderedCanvas.width<100||renderedCanvas.height<100)throw new Error('The dues matrix canvas dimensions are invalid. No blank PDF was downloaded.');
     const context=renderedCanvas.getContext('2d',{willReadFrequently:true});
     const pixels=context?.getImageData(0,0,renderedCanvas.width,renderedCanvas.height).data;
     if(!pixels)throw new Error('The dues matrix canvas could not be verified. No blank PDF was downloaded.');
     let foregroundSamples=0,opaqueSamples=0;
     const totalPixels=Math.floor(pixels.length/4),sampleStride=Math.max(1,Math.floor(totalPixels/20000));
     for(let index=0;index<totalPixels;index+=sampleStride){
      const offset=index*4,red=pixels[offset],green=pixels[offset+1],blue=pixels[offset+2],alpha=pixels[offset+3];
      if(alpha>0)opaqueSamples++;
      if(alpha>0&&(red<242||green<242||blue<242))foregroundSamples++;
     }
     const pngData=renderedCanvas.toDataURL('image/png');
     if(opaqueSamples<100||foregroundSamples<50||pngData.length<5000)throw new Error('The dues matrix canvas appears blank after capture (canvas '+renderedCanvas.width+'×'+renderedCanvas.height+', foreground samples '+foregroundSamples+'). No blank PDF was downloaded.');
     // Restore the hidden-template rule immediately after rasterization.
     report.style.setProperty('display','none','important');
     report.style.setProperty('visibility','hidden','important');
     report.style.setProperty('opacity','0','important');
     const pdfWorker=window.html2pdf().set(pdfOptions).from(renderedCanvas);
     const blob=await pdfWorker.toPdf().output('blob');
     report.remove();report=null; // Release the off-screen staging node before cache/download work.
     if(!(blob instanceof Blob)||blob.size<1000)throw new Error('The generated dues matrix PDF is empty. Please try again.');
     const pdfSignature=new Uint8Array(await blob.slice(0,5).arrayBuffer());
     if(String.fromCharCode(...pdfSignature)!=='%PDF-')throw new Error('The generated report is not a valid PDF document. Please try again.');
     if(typeof window.cacheWelfareStatementPdf==='function'){
      try{await window.cacheWelfareStatementPdf(blob,filename,{
       school_code:schoolCode,document_id:documentId,document_type:'dues-matrix',
       period:'Calendar year '+selectedYear,academic_year:window.getCurrentAcademicYear()
      });}catch(cacheError){console.warn('[School Welfare] Dues matrix PDF cache unavailable; continuing with download:',cacheError?.message||cacheError);}
     }
     window.downloadWelfareBlob(blob,filename,status,'Official dues matrix PDF for '+selectedYear+' is ready.',button);
    }catch(error){
     console.error('[School Welfare] Dues matrix PDF failed:',error);
     if(status){status.textContent=error?.message||'The dues matrix PDF could not be generated.';status.className='error';}
    }finally{
     if(report){report.style.setProperty('display','none','important');report.style.setProperty('visibility','hidden','important');report.style.setProperty('opacity','0','important');report.remove();report=null;}
     button.disabled=false;button.removeAttribute('aria-busy');button.innerHTML=original;
    }
   });
  }
  let payoutDataRevision=0,lastPayoutRenderKey='';
  const renderPayoutLedger=()=>{
    const q=String($('wfPayoutSearch')?.value||'').trim().toLowerCase();
    const renderKey=q+'|'+payoutDataRevision;
    if(renderKey===lastPayoutRenderKey)return;
    lastPayoutRenderKey=renderKey;
    const rows=pays.filter(x=>[x.teacher_id,window.displayWelfareReason(x.reason),x.reference,teacherById.get(String(x.teacher_id))?.name].some(v=>String(v||'').toLowerCase().includes(q)));
    const totalPayout=activePays.reduce((n,x)=>n+Number(x.amount||0),0),currentFund=activeCons.reduce((n,x)=>n+Number(x.amount||0),0)-totalPayout,activeMembers=teachers.filter(t=>t.is_active!==false).length;
    $('wfPayoutTotal').textContent=pr.error?'Unavailable':'GH₵ '+money(totalPayout);
    $('wfPayoutCurrentFund').textContent=(cr.error||pr.error)?'Unavailable':'GH₵ '+money(currentFund);
    $('wfPayoutActiveMembers').textContent=tr.error?'Unavailable':String(activeMembers);
    $('wfPayRows').innerHTML=pr.error?'<tr><td colspan="6">Payout records could not be loaded. Check the school account permissions and <button type="button" class="wf-table-action" data-wf-retry-ledgers>Retry loading</button>.</td></tr>':rows.length?rows.map(x=>{const rawDate=String(x.date||'');const displayDate=rawDate&&/^\d{4}-\d{2}-\d{2}/.test(rawDate)?new Date(rawDate.slice(0,10)+'T00:00:00').toLocaleDateString('en-GB'):(rawDate||'—');return '<tr><td class="wf-payout-reference">'+esc(x.reference||'—')+'</td><td class="wf-payout-beneficiary">'+teacherLabel(x.teacher_id)+'</td><td>'+esc(window.displayWelfareReason(x.reason||'Welfare support'))+'</td><td class="wf-payout-amount">GH₵ '+money(x.amount)+'</td><td>'+esc(displayDate)+'</td><td>'+reversalCell('payout',x)+'</td></tr>'}).join(''):'<tr><td colspan="6">No matching payouts.</td></tr>';
  };
  if(window.__welfareScheduleNonCritical)window.__welfareScheduleNonCritical(renderPayoutLedger,$('wfPayRows'));else renderPayoutLedger();$('wfPayoutSearch').addEventListener('input',()=>frameRender($('wfPayRows'),renderPayoutLedger));
  // Reload transaction data in place; keep the authenticated dashboard and
  // currently selected section mounted after a contribution or payout is saved.
  const refreshWorkflow=async()=>{
    const [nextCon,nextPay,nextRev]=await Promise.all([
      loadSource('contribution ledger refresh',()=>client.from('contributions').select('id,teacher_id,amount,date,reference').eq('school_id',ctx.id).order('date',{ascending:false})),
      loadSource('payout ledger refresh',()=>client.from('payouts').select('id,teacher_id,amount,date,reason,reference').eq('school_id',ctx.id).order('date',{ascending:false})),
      loadSource('transaction reversals refresh',()=>client.from('transaction_reversals').select('transaction_type,transaction_id,reason,created_at').eq('school_id',ctx.id))
    ]);
    cr=nextCon;pr=nextPay;rr=nextRev;payoutDataRevision++;lastPayoutRenderKey='';
    cons=nextCon.data||[];pays=nextPay.data||[];reversals=nextRev.data||[];
    reversed.clear();
    reversals.forEach(item=>reversed.add(item.transaction_type+':'+item.transaction_id));
    activeCons=cons.filter(isActiveContributionRecord);
    const contributionRecordsCount=$('adminContributionRecordsCount');
    if(contributionRecordsCount)contributionRecordsCount.textContent=(cr.error||rr.error)?'Unavailable':String(activeCons.length);
    activePays=pays.filter(isActivePayoutRecord);
    const totalCon=activeCons.reduce((sum,item)=>sum+Number(item.amount||0),0);
    const totalPay=activePays.reduce((sum,item)=>sum+Number(item.amount||0),0);
    $('contributionTotal').textContent=cr.error?'Unavailable':'GH₵ '+money(totalCon);
    $('payoutTotal').textContent=pr.error?'Unavailable':'GH₵ '+money(totalPay);
    $('netTotal').textContent=(cr.error||pr.error)?'Unavailable':'GH₵ '+money(totalCon-totalPay);
    const monthKey=getDashboardMonthKey();
    if($('monthlyContributionTotal'))$('monthlyContributionTotal').textContent=cr.error?'Unavailable':'GH₵ '+money(activeCons.filter(item=>String(item.date||'').slice(0,7)===monthKey).reduce((sum,item)=>sum+Number(item.amount||0),0));
    renderContributionLedger();
    renderDuesMatrix();
    renderPayoutLedger();
    renderSelectedTeacherProfile();
    void refreshAdminActivityTicker().catch(error=>console.warn('[Administrator activity ticker] Refresh deferred:',error?.message||error));
    return !cr.error&&!pr.error;
  };
  window.__welfareRefreshAdminWorkspace=refreshWorkflow;
  $('teacherCount').textContent=tr.error?'Unavailable':String(teachers.filter(t=>t.is_active!==false).length);
  $('contributionTotal').textContent=cr.error?'Unavailable':'GH₵ '+money(activeCons.reduce((a,x)=>a+Number(x.amount||0),0));
  $('payoutTotal').textContent=pr.error?'Unavailable':'GH₵ '+money(activePays.reduce((a,x)=>a+Number(x.amount||0),0));
  $('netTotal').textContent=(cr.error||pr.error)?'Unavailable':'GH₵ '+money(activeCons.reduce((a,x)=>a+Number(x.amount||0),0)-activePays.reduce((a,x)=>a+Number(x.amount||0),0));

 $('wfResetExpected').textContent='Required phrase: RESET:'+ctx.school_code;
 $('wfResetConfirmation').placeholder='RESET:'+ctx.school_code;
 const callAdminManagement=async payload=>{
   const {data,error}=await client.functions.invoke('school-admin-management',{body:{...payload,school_id:ctx.id}});
   if(error){
     let responseMessage=data?.error||data?.message||'';
     try{
       const response=error.context;
       if(!responseMessage&&response&&typeof response.clone==='function'){
         const payload=await response.clone().json();
         responseMessage=payload?.error||payload?.message||'';
       }
     }catch(_){}
     throw new Error(responseMessage||error.message||'The request failed.');
   }
   if(data?.error)throw new Error(data.error);
   return data||{};
 };
 const renderSchoolAdmins=admins=>{
   const rows=$('wfAdminUsersRows');
   rows.innerHTML=admins.length?admins.map(a=>'<tr><td>'+esc(a.username||'—')+'</td><td class="teacher-name-cell">'+esc(a.name||'—')+'</td><td>'+(a.active?'<span class="wf-admin-pill active">Active</span>':'<span class="wf-admin-pill">Inactive</span>')+'</td><td>'+(a.active&&a.user_id!==undefined?'<button type="button" class="wf-table-action" data-wf-admin-deactivate="'+esc(a.id)+'" '+(String(a.user_id)===String((awaitUserId)||'')?'disabled title="You cannot deactivate your own account"':'')+'>Deactivate</button>':'—')+'</td></tr>').join(''):'<tr><td colspan="4">No administrator accounts are linked to this school.</td></tr>';
 };
 let awaitUserId='';
 const loadSchoolAdmins=async()=>{
   $('wfAdminUsersRows').innerHTML='<tr><td colspan="4">Loading administrators…</td></tr>';
   try{
     const {data:{user}}=await client.auth.getUser();awaitUserId=user?.id||'';
     const data=await callAdminManagement({action:'list'});renderSchoolAdmins(data.administrators||[]);
     msg('wfAdminUsersMsg','Showing administrators for '+ctx.name+'.');
   }catch(error){$('wfAdminUsersRows').innerHTML='<tr><td colspan="4">Administrator list unavailable.</td></tr>';msg('wfAdminUsersMsg',error.message||'Administrator list unavailable.',true);}
 };
 $('wfInviteAdminForm').onsubmit=async e=>{
   e.preventDefault();const full_name=$('wfInviteAdminName').value.trim(),username=$('wfInviteAdminUsername').value.trim(),email=$('wfInviteAdminEmail').value.trim();
   if(!await wfConfirm('Send a secure administrator invitation to '+email+' for '+ctx.name+'?'))return;
   msg('wfAdminUsersMsg','Sending invitation…');
   try{const result=await callAdminManagement({action:'invite',full_name,username,email});$('wfInviteAdminForm').reset();msg('wfAdminUsersMsg',result.message||'Invitation sent.');await loadSchoolAdmins();}
   catch(error){msg('wfAdminUsersMsg',error.message||'Invitation failed.',true);}
 };
 $('wfAdminUsersRows').addEventListener('click',async e=>{
   const button=e.target.closest('[data-wf-admin-deactivate]');if(!button)return;
   if(!await wfConfirm('Deactivate this administrator’s access to '+ctx.name+'? Their account identity and audit history will be retained.'))return;
   button.disabled=true;msg('wfAdminUsersMsg','Updating administrator access…');
   try{const result=await callAdminManagement({action:'deactivate',admin_id:button.dataset.wfAdminDeactivate});msg('wfAdminUsersMsg',result.message||'Administrator access updated.');await loadSchoolAdmins();}
   catch(error){msg('wfAdminUsersMsg',error.message||'Administrator access could not be changed.',true);button.disabled=false;}
 });
 $('wfResetDataForm').onsubmit=async e=>{
   e.preventDefault();const current_password=$('wfResetPassword').value,confirmation=$('wfResetConfirmation').value,finalPhrase=$('wfResetAllConfirmation').value;
   if(confirmation!=='RESET:'+ctx.school_code)return msg('wfResetDataMsg','The confirmation phrase does not match this school. No records were changed.',true);
    if(finalPhrase!=='RESET ALL')return msg('wfResetDataMsg','Type RESET ALL exactly to confirm this second safety step. No records were changed.',true);
   if(!await wfConfirm('FINAL CONFIRMATION: Permanently delete all member, contribution, payout and reversal records belonging only to '+ctx.name+' ('+ctx.school_code+')? Audit history and school settings will remain. This cannot be undone.'))return;
   msg('wfResetDataMsg','Verifying administrator and processing the school-scoped reset…');
   try{const result=await callAdminManagement({action:'reset',current_password,confirmation,final_confirmation:finalPhrase});$('wfResetDataForm').reset();$('wfResetExpected').textContent='Required phrase: RESET:'+ctx.school_code;$('wfResetConfirmation').placeholder='RESET:'+ctx.school_code;msg('wfResetDataMsg','Reset completed. Removed '+(result.result?.members_removed??0)+' members, '+(result.result?.contributions_removed??0)+' contributions, '+(result.result?.payouts_removed??0)+' payouts. Audit history preserved.');await refreshWorkflow();}
   catch(error){msg('wfResetDataMsg',error.message||'Reset failed. No success was assumed.',true);}
 };
 loadSchoolAdmins();


 // Keep the global academic-year helper available to every administrator
 // PDF export, even if a future page-shell change omits the early HTML bootstrap.
 if(typeof window.getCurrentAcademicYear!=='function'){
  window.getCurrentAcademicYear=function(){
   const school=window.__welfareCurrentSchool||ctx||{},now=new Date();
   const saved=[school.academic_year,school.academicYear,school.current_academic_year,school.currentAcademicYear,school.school_year,school.schoolYear]
    .map(value=>String(value??'').trim()).find(value=>/^\d{4}\\s*[/–-]\\s*\d{4}$/.test(value));
   if(saved)return saved.replace(/\\s+/g,'').replace(/[–-]/,'/');
   const configuredMonth=Number(school.academic_year_start_month??school.academicYearStartMonth);
   const startMonth=Number.isInteger(configuredMonth)&&configuredMonth>=1&&configuredMonth<=12?configuredMonth-1:8;
   const startYear=now.getFullYear()-(now.getMonth()<startMonth?1:0);
   return startYear+'/'+(startYear+1);
  };
 }
 // Bind report actions as soon as report controls and school-scoped data are ready.
 // Install these BEFORE optional settings requests so slow settings cannot leave
 // visible PDF buttons without click handlers.
 const reportPdfFailure=(label,error,statusId,fallback)=>{
   const message=String(error?.message||fallback||'The PDF operation failed.');
   const stack=String(error?.stack||'No JavaScript stack was provided.');
   console.error(label+'\nMessage: '+message+'\nStack:\n'+stack,error);
   const status=statusId?document.getElementById(statusId):null;
   if(status){status.style.whiteSpace='pre-wrap';status.style.overflowWrap='anywhere';}
   if(statusId)msg(statusId,message+'\n'+stack.split('\n').slice(0,9).join('\n'),true);
 };
 const assertShareableWelfarePdf=async generated=>{
   const blob=generated?.blob;
   if(!(blob instanceof Blob)||blob.size<5000)throw new Error('The PDF is empty or incomplete. Please regenerate the statement before sharing.');
   const signature=new Uint8Array(await blob.slice(0,5).arrayBuffer());
   if(String.fromCharCode(...signature)!=='%PDF-')throw new Error('The generated file is not a valid PDF. Please regenerate it before sharing.');
   return generated;
 };
 const preparedAdminShares=new Map();
 const adminSharePreparation=new Map();
 const adminShareKey=options=>[options.type,options.month||'',options.year||''].join('|');
 const prepareAdminReportShare=(button,statusId,buildOptions)=>{
   if(!button||typeof window.generateTenantWelfarePdf!=='function')return;
   const options=buildOptions();options.shareIntent=true;
   const key=adminShareKey(options);
   const current=adminSharePreparation.get(button.id);
   if(current?.key===key)return;
   const task=(async()=>{
     try{
       const generated=await assertShareableWelfarePdf(await window.generateTenantWelfarePdf(options));
       const fileName=String(generated.filename||'Welfare_Report.pdf');
       const pdfFile=new File([generated.blob],fileName,{type:'application/pdf'});
       const schoolCode=options.school?.school_code||ctx.school_code||'';
       const verificationUrl=generated.documentId&&schoolCode
        ?'https://abcollins93.github.io/TEACHERS-WELFARE/verify.html?c='+encodeURIComponent(schoolCode)+'&d='+encodeURIComponent(generated.documentId):'';
       if(adminSharePreparation.get(button.id)?.task===task){
         preparedAdminShares.set(button.id,{key,generated,pdfFile,fileName,verificationUrl});
         msg(statusId,'PDF ready to share. Tap Share PDF to open your device share sheet.');
       }
     }catch(error){reportPdfFailure('[School Welfare PDF] Admin report share preparation failed',error,statusId,'The report could not be prepared for sharing.');}
   })();
   adminSharePreparation.set(button.id,{key,task});
 };
 const sharePreparedAdminReport=(button,statusId,buildOptions)=>{
   const options=buildOptions(),key=adminShareKey(options),prepared=preparedAdminShares.get(button.id);
   if(!prepared||prepared.key!==key){
     prepareAdminReportShare(button,statusId,buildOptions);
     msg(statusId,'Preparing your PDF for sharing. Please tap Share PDF again when it is ready.');
     return;
   }
   const title=prepared.fileName.replace(/\.pdf$/i,'').replace(/[-_]+/g,' ');
   const shareData={files:[prepared.pdfFile],title,text:'Please find attached this school welfare PDF report.'};
   let canFile=false;try{canFile=typeof navigator.share==='function'&&(!navigator.canShare||navigator.canShare(shareData));}catch(_){}
   if(canFile){
     let pending;try{pending=navigator.share(shareData);}catch(error){pending=Promise.reject(error);}
     Promise.resolve(pending).then(()=>msg(statusId,'PDF shared successfully.')).catch(error=>{
       if(error?.name==='AbortError'){msg(statusId,'PDF sharing was cancelled.');return;}
       console.warn('[School Welfare PDF] Native report file sharing failed:',error);
       downloadWorkflowBlob(prepared.generated.blob,prepared.fileName,statusId,'The PDF could not be shared. Your PDF has been downloaded instead.','Tap here to view downloaded PDF',button);
     });
     return;
   }
   const linkText='Verify this official Welfare PDF report:',url=prepared.verificationUrl;
   if(typeof navigator.share==='function'){
     let pending;try{pending=navigator.share({title,text:linkText,url:url||undefined});}catch(error){pending=Promise.reject(error);}
     Promise.resolve(pending).then(()=>msg(statusId,url?'Verification link shared. No PDF file was attached.':'Report details shared. No PDF file was attached.')).catch(error=>{
       if(error?.name==='AbortError'){msg(statusId,'PDF sharing was cancelled.');return;}
       const whatsapp='https://wa.me/?text='+encodeURIComponent(linkText+(url?' '+url:''));
       let opened=null;try{opened=window.open(whatsapp,'_blank');}catch(_){}
       if(opened)msg(statusId,'Verification link opened in WhatsApp. No PDF file was attached.');
       else downloadWorkflowBlob(prepared.generated.blob,prepared.fileName,statusId,'File sharing is not supported here. Your PDF has been downloaded instead.','Tap here to view downloaded PDF',button);
     });
   }else{
     const whatsapp='https://wa.me/?text='+encodeURIComponent(linkText+(url?' '+url:''));
     let opened=null;try{opened=window.open(whatsapp,'_blank');}catch(_){}
     if(opened)msg(statusId,'Verification link opened in WhatsApp. No PDF file was attached.');
     else downloadWorkflowBlob(prepared.generated.blob,prepared.fileName,statusId,'File sharing is not supported here. Your PDF has been downloaded instead.','Tap here to view downloaded PDF',button);
   }
 };
 const runWelfarePdf=async(button,statusId,successText,buildOptions,sharePdf=false)=>{
   if(sharePdf){sharePreparedAdminReport(button,statusId,buildOptions);return;}
   if(!button||button.disabled)return;
   const original=button.innerHTML;
   button.disabled=true;button.setAttribute('aria-busy','true');
   button.innerHTML='<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Preparing PDF…';
   try{
     // Give the browser a paint opportunity so the spinner is visible before
     // authentication-independent report assembly and canvas/PDF work begins.
     await new Promise(resolve=>requestAnimationFrame(resolve));
     if(typeof window.generateTenantWelfarePdf!=='function')throw new Error('The PDF generator is unavailable. Reload the portal and try again.');
     const pdfOptions=buildOptions();
     const generated=await window.generateTenantWelfarePdf(pdfOptions);
     const cacheDetails={school_code:pdfOptions?.school?.school_code||window.__welfareCurrentSchool?.school_code,document_id:generated.documentId,document_type:pdfOptions?.type,period:pdfOptions?.month||pdfOptions?.year||'',academic_year:pdfOptions?.academicYear||''};
     if(typeof window.cacheWelfareStatementPdf==='function')Promise.resolve(window.cacheWelfareStatementPdf(generated.blob,generated.filename,cacheDetails)).catch(error=>console.warn('[School Welfare PDF] Local PDF cache deferred:',error?.message||error));
     downloadWorkflowBlob(generated.blob,generated.filename,statusId,successText,'Tap here to view downloaded PDF',button);
   }catch(error){reportPdfFailure('[School Welfare PDF] Report download failed',error,statusId,'The PDF could not be generated. Check your connection and try again.');}
   finally{
     button.innerHTML=original;button.disabled=false;button.removeAttribute('aria-busy');
   }
 };
 $('wfMonthlyPdf').addEventListener('click',()=>{
   const selectedMonth=$('wfReportMonth').value,selectedYear=$('wfReportYear').value;
   if(!selectedMonth||!selectedYear)return msg('wfMonthlyReportMsg','Choose both a reporting month and year.',true);
   const month=selectedYear+'-'+selectedMonth;
   return runWelfarePdf($('wfMonthlyPdf'),'wfMonthlyReportMsg','Monthly summary PDF downloaded successfully.',()=>({
     type:'monthly',school:{name:ctx.name,school_code:ctx.school_code,district:ctx.district,region:ctx.region},
     month,contributions:activeCons,payouts:activePays,teachers,
     academicYear:window.getCurrentAcademicYear(),
     standardMonthlyDues
   }));
 });
 $('wfCompletePdf').addEventListener('click',()=>runWelfarePdf($('wfCompletePdf'),'wfCompleteReportMsg','Complete fund summary PDF downloaded successfully.',()=>({
   type:'complete',school:{name:ctx.name,school_code:ctx.school_code,district:ctx.district,region:ctx.region},
   contributions:activeCons,payouts:activePays,teachers,
   academicYear:window.getCurrentAcademicYear(),
   standardMonthlyDues
 })));
 $('wfAnnualPdf').addEventListener('click',()=>{
   const selectedYear=$('wfAnnualYear').value;
   if(!/^\d{4}$/.test(selectedYear||''))return msg('wfReportMsg','Choose a valid reporting year.',true);
   return runWelfarePdf($('wfAnnualPdf'),'wfAnnualReportMsg','Yearly summary PDF downloaded successfully.',()=>({
     type:'annual',year:selectedYear,school:{name:ctx.name,school_code:ctx.school_code,district:ctx.district,region:ctx.region},
     contributions:activeCons,payouts:activePays,teachers,
     academicYear:window.getCurrentAcademicYear(),
     standardMonthlyDues
   }));
 });
 $('wfPaymentStatsPdf').addEventListener('click',()=>{
   const selectedYear=$('wfPaymentStatsYear').value;
   if(!/^\d{4}$/.test(selectedYear||''))return msg('wfReportMsg','Choose a valid reporting year.',true);
   return runWelfarePdf($('wfPaymentStatsPdf'),'wfPaymentStatsMsg','Statistics of payment PDF downloaded successfully.',()=>({
     type:'payment-statistics',year:selectedYear,school:{name:ctx.name,school_code:ctx.school_code,district:ctx.district,region:ctx.region},
     contributions:activeCons,teachers,standardMonthlyDues
   }));
 });
 // Prepare the selected individual statement before the Share tap. Mobile Chrome
 // requires navigator.share() to be called while the tap's transient activation is live.
 const buildIndividualStatementOptions=(tid,teacher)=>({
   type:'individual',school:{name:ctx.name,school_code:ctx.school_code,district:ctx.district,region:ctx.region},
   teacher,teachers,contributions:activeCons.filter(x=>String(x.teacher_id)===String(tid)),
   payouts:pays.filter(row=>String(row.school_id||'')===String(ctx.id))
    .sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.id||'').localeCompare(String(b.id||''))),
   personalPayoutTotal:pays.filter(row=>String(row.teacher_id||'')===String(teacher.id||'')&&String(row.school_id||'')===String(ctx.id)).reduce((sum,row)=>sum+Number(row.amount||0),0),
   personalContributionTotal:activeCons.filter(x=>String(x.teacher_id)===String(tid)).reduce((sum,row)=>sum+Number(row.amount||0),0),
   schoolFundBalance:activeCons.reduce((sum,row)=>sum+Number(row.amount||0),0)-activePays.reduce((sum,row)=>sum+Number(row.amount||0),0),
   academicYear:window.getCurrentAcademicYear(),standardMonthlyDues
 });
 let preparedIndividualShare=null,individualSharePreparation=null,individualSharePreparationToken=0;
 const prepareIndividualStatementShare=()=>{
   const tid=$('wfStatementTeacher').value,teacher=teachers.find(t=>String(t.id)===String(tid));
   const token=++individualSharePreparationToken;
   preparedIndividualShare=null;
   if(!teacher){msg('wfStatementMsg','Choose a member account to prepare its PDF for sharing.');return;}
   if(typeof window.generateTenantWelfarePdf!=='function'){msg('wfStatementMsg','The PDF generator is unavailable. Reload the portal and try again.',true);return;}
   msg('wfStatementMsg','Preparing statement for one-tap sharing…');
   individualSharePreparation=(async()=>{
     const options=buildIndividualStatementOptions(tid,teacher);
     options.shareIntent=true;
     const generated=await assertShareableWelfarePdf(await window.generateTenantWelfarePdf(options));
     const fileName=String(generated.filename||'Welfare_Individual_Statement.pdf');
     const pdfFile=new File([generated.blob],fileName,{type:'application/pdf'});
     const schoolCode=options.school.school_code||'';
     const verificationUrl=generated.documentId&&schoolCode
       ?'https://abcollins93.github.io/TEACHERS-WELFARE/verify.html?c='+encodeURIComponent(schoolCode)+'&d='+encodeURIComponent(generated.documentId)
       :'';
     if(token===individualSharePreparationToken&&String($('wfStatementTeacher').value)===String(tid)){
       preparedIndividualShare={tid,generated,pdfFile,fileName,verificationUrl};
       msg('wfStatementMsg','Statement PDF is ready. Tap Share PDF to open your device share sheet.');
     }
   })().catch(error=>{
     if(token===individualSharePreparationToken){
       preparedIndividualShare=null;
       reportPdfFailure('[School Welfare PDF] Individual member statement share preparation failed',error,'wfStatementMsg','The statement PDF could not be prepared for sharing.');
     }
   });
 };
 $('wfStatementTeacher').addEventListener('change',prepareIndividualStatementShare);
 $('wfStatementPdf').addEventListener('click',()=>{
   const tid=$('wfStatementTeacher').value,teacher=teachers.find(t=>String(t.id)===String(tid));
   if(!teacher)return msg('wfStatementMsg','Choose a teacher first.',true);
   return runWelfarePdf($('wfStatementPdf'),'wfStatementMsg','Member statement PDF downloaded successfully.',()=>buildIndividualStatementOptions(tid,teacher));
 });
 $('wfStatementShare').addEventListener('click',()=>{
   const tid=$('wfStatementTeacher').value,prepared=preparedIndividualShare;
   if(!tid)return msg('wfStatementMsg','Choose a teacher first.',true);
   if(!prepared||String(prepared.tid)!==String(tid)){
     if(!individualSharePreparation)prepareIndividualStatementShare();
     msg('wfStatementMsg','Your statement is still being prepared. Please tap Share PDF again when preparation is complete.');
     return;
   }
   const shareTitle=String(prepared.fileName).replace(/\.pdf$/i,'').replace(/[-_]+/g,' ');
   const shareText='Please find attached this school welfare PDF report.';
   const shareData={files:[prepared.pdfFile],title:shareTitle,text:shareText};
   let supportsFileShare=false;
   try{
     supportsFileShare=typeof navigator.share==='function'&&(!navigator.canShare||navigator.canShare(shareData));
   }catch(_){supportsFileShare=false;}
   if(supportsFileShare){
     // Invoke synchronously in this click handler: no await, promise chain, cache,
     // verification call, or QR request is allowed before native share().
     let sharePromise;
     try{sharePromise=navigator.share(shareData);}
     catch(error){
       if(error?.name==='AbortError'){msg('wfStatementMsg','PDF sharing was cancelled.');return;}
       console.warn('[School Welfare PDF] Individual native file share failed:',error);
       downloadWorkflowBlob(prepared.generated.blob,prepared.fileName,'wfStatementMsg','The PDF could not be shared. Your PDF has been downloaded instead.','Tap here to view downloaded PDF');
       return;
     }
     Promise.resolve(sharePromise).then(()=>{
       msg('wfStatementMsg','PDF shared successfully.');
     }).catch(error=>{
       if(error?.name==='AbortError'){msg('wfStatementMsg','PDF sharing was cancelled.');return;}
       console.warn('[School Welfare PDF] Individual native file share failed:',error);
       downloadWorkflowBlob(prepared.generated.blob,prepared.fileName,'wfStatementMsg','The PDF could not be shared. Your PDF has been downloaded instead.','Tap here to view downloaded PDF');
     });
     return;
   }
   const linkText='Verify this official Welfare PDF report:';
   const shareUrl=prepared.verificationUrl;
   if(typeof navigator.share==='function'){
     let linkPromise;
     try{linkPromise=navigator.share({title:shareTitle,text:linkText,url:shareUrl||undefined});}
     catch(error){linkPromise=Promise.reject(error);}
     Promise.resolve(linkPromise).then(()=>{
       msg('wfStatementMsg',shareUrl?'Verification link shared. No PDF file was attached.':'Report details shared. No PDF file was attached.');
     }).catch(error=>{
       if(error?.name==='AbortError'){msg('wfStatementMsg','PDF sharing was cancelled.');return;}
       const whatsappUrl='https://wa.me/?text='+encodeURIComponent(linkText+(shareUrl?' '+shareUrl:''));
       let opened=null;try{opened=window.open(whatsappUrl,'_blank');}catch(_){}
       if(opened)msg('wfStatementMsg','Verification link opened in WhatsApp. No PDF file was attached.');
       else downloadWorkflowBlob(prepared.generated.blob,prepared.fileName,'wfStatementMsg','File sharing is not supported here. Your PDF has been downloaded instead.','Tap here to view downloaded PDF');
     });
     return;
   }
   const whatsappUrl='https://wa.me/?text='+encodeURIComponent(linkText+(shareUrl?' '+shareUrl:''));
   let opened=null;try{opened=window.open(whatsappUrl,'_blank');}catch(_){}
   if(opened)msg('wfStatementMsg','Verification link opened in WhatsApp. No PDF file was attached.');
   else downloadWorkflowBlob(prepared.generated.blob,prepared.fileName,'wfStatementMsg','File sharing is not supported here. Your PDF has been downloaded instead.','Tap here to view downloaded PDF');
 });
 // Prepare the currently selected member as soon as the report controls are ready.
 prepareIndividualStatementShare();

 const buildMonthlyShareOptions=()=>{
   const selectedMonth=$('wfReportMonth').value,selectedYear=$('wfReportYear').value;
   if(!selectedMonth||!selectedYear)throw new Error('Choose both a reporting month and year.');
   return {type:'monthly',month:selectedYear+'-'+selectedMonth,school:{name:ctx.name,school_code:ctx.school_code,district:ctx.district,region:ctx.region},contributions:activeCons,payouts:activePays,teachers,academicYear:window.getCurrentAcademicYear(),standardMonthlyDues};
 };
 $('wfMonthlyShare').addEventListener('click',()=>{try{return runWelfarePdf($('wfMonthlyShare'),'wfMonthlyReportMsg','Monthly summary PDF shared successfully.',buildMonthlyShareOptions,true);}catch(error){msg('wfMonthlyReportMsg',error.message,true);}});
 prepareAdminReportShare($('wfMonthlyShare'),'wfMonthlyReportMsg',buildMonthlyShareOptions);
 $('wfReportMonth').addEventListener('change',()=>prepareAdminReportShare($('wfMonthlyShare'),'wfMonthlyReportMsg',buildMonthlyShareOptions));
 $('wfReportYear').addEventListener('change',()=>prepareAdminReportShare($('wfMonthlyShare'),'wfMonthlyReportMsg',buildMonthlyShareOptions));
 const buildCompleteShareOptions=()=>({type:'complete',school:{name:ctx.name,school_code:ctx.school_code,district:ctx.district,region:ctx.region},contributions:activeCons,payouts:activePays,teachers,academicYear:window.getCurrentAcademicYear(),standardMonthlyDues});
 $('wfCompleteShare').addEventListener('click',()=>runWelfarePdf($('wfCompleteShare'),'wfCompleteReportMsg','Complete fund summary PDF shared successfully.',buildCompleteShareOptions,true));
 prepareAdminReportShare($('wfCompleteShare'),'wfCompleteReportMsg',buildCompleteShareOptions);
 const buildAnnualShareOptions=()=>{
   const selectedYear=$('wfAnnualYear').value;
   if(!/^\d{4}$/.test(selectedYear||''))throw new Error('Choose a valid reporting year.');
   return {type:'annual',year:selectedYear,school:{name:ctx.name,school_code:ctx.school_code,district:ctx.district,region:ctx.region},contributions:activeCons,payouts:activePays,teachers,academicYear:window.getCurrentAcademicYear(),standardMonthlyDues};
 };
 $('wfAnnualShare').addEventListener('click',()=>{try{return runWelfarePdf($('wfAnnualShare'),'wfAnnualReportMsg','Yearly summary PDF shared successfully.',buildAnnualShareOptions,true);}catch(error){msg('wfAnnualReportMsg',error.message,true);}});
 prepareAdminReportShare($('wfAnnualShare'),'wfAnnualReportMsg',buildAnnualShareOptions);
 $('wfAnnualYear').addEventListener('change',()=>prepareAdminReportShare($('wfAnnualShare'),'wfAnnualReportMsg',buildAnnualShareOptions));
 $('wfStatementShare').addEventListener('click',()=>{
   const tid=$('wfStatementTeacher').value,teacher=teachers.find(t=>String(t.id)===String(tid));
   if(!teacher)return msg('wfStatementMsg','Choose a teacher first.',true);
   return runWelfarePdf($('wfStatementShare'),'wfStatementMsg','Member statement PDF shared successfully.',()=>({
     type:'individual',school:{name:ctx.name,school_code:ctx.school_code,district:ctx.district,region:ctx.region},
     teacher,teachers,contributions:activeCons.filter(x=>String(x.teacher_id)===String(tid)),
     payouts:pays.filter(row=>String(row.school_id||'')===String(ctx.id))
      .sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.id||'').localeCompare(String(b.id||''))),
     personalPayoutTotal:pays.filter(row=>String(row.teacher_id||'')===String(teacher.id||'')&&String(row.school_id||'')===String(ctx.id)).reduce((sum,row)=>sum+Number(row.amount||0),0),
     personalContributionTotal:activeCons.filter(x=>String(x.teacher_id)===String(tid)).reduce((sum,row)=>sum+Number(row.amount||0),0),
     schoolFundBalance:activeCons.reduce((sum,row)=>sum+Number(row.amount||0),0)-activePays.reduce((sum,row)=>sum+Number(row.amount||0),0),
     academicYear:window.getCurrentAcademicYear(),standardMonthlyDues
   }),true);
 });
 const {data:broadcastSetting,error:broadcastLoadError}=await client.from('system_settings').select('value').eq('school_id',ctx.id).eq('key','broadcast_message').maybeSingle();
 if(!broadcastLoadError&&broadcastSetting)$('wfBroadcastText').value=String(broadcastSetting.value||'');
 const {data:duesReminderSetting,error:duesReminderLoadError}=await client.from('system_settings').select('value').eq('school_id',ctx.id).eq('key','automated_dues_reminder').maybeSingle();
 const duesReminderToggle=$('wfAutomatedDuesReminderToggle');
 if(duesReminderToggle&&!duesReminderLoadError)duesReminderToggle.checked=String(duesReminderSetting?.value||'false').toLowerCase()==='true';
 if(duesReminderLoadError)msg('wfDuesReminderMsg','The reminder setting could not be loaded. Check school settings permissions.',true);
 if(duesReminderToggle){
   duesReminderToggle.addEventListener('change',async()=>{
     const enabled=duesReminderToggle.checked;
     duesReminderToggle.disabled=true;
     msg('wfDuesReminderMsg',enabled?'Enabling automated dues reminders…':'Disabling automated dues reminders…');
     try{
       const {error}=await client.from('system_settings').upsert(
         {school_id:ctx.id,key:'automated_dues_reminder',value:String(enabled)},
         {onConflict:'school_id,key'}
       );
       if(error)throw error;
       const auditOk=await audit(client,ctx,enabled?'Enable automated dues reminders':'Disable automated dues reminders',enabled?'Members with unpaid current-month dues will see a personal ticker reminder.':'Personal monthly dues reminders have been disabled.');
       msg('wfDuesReminderMsg',auditOk?(enabled?'Automated monthly dues reminders are now active for this school.':'Automated monthly dues reminders are now off.'):'Reminder setting saved, but the audit entry could not be recorded.',!auditOk);
     }catch(error){
       console.error('[School settings] Automated dues reminder update failed:',error);
       duesReminderToggle.checked=!enabled;
       msg('wfDuesReminderMsg','The reminder setting could not be saved. No change was made.',true);
     }finally{duesReminderToggle.disabled=false;}
   });
 }
 const saveBroadcast=async value=>{
   msg('wfBroadcastMsg','Saving announcement…');
   const {error}=await client.from('system_settings').upsert({school_id:ctx.id,key:'broadcast_message',value},{onConflict:'school_id,key'});
   if(error){msg('wfBroadcastMsg','Announcement could not be saved. Check the school settings permissions and unique key.',true);return;}
   if(value){
     const {data:{user}}=await client.auth.getUser();
     const {error:archiveError}=await client.from('school_announcements').insert({school_id:ctx.id,message:value,published_by:user?.id||null});
     if(archiveError){console.error('[School announcements] History insert failed:',archiveError.message);msg('wfBroadcastMsg','Current notice saved, but it could not be added to the live announcement history. Please retry publishing.',true);return;}
   }
   const ok=await audit(client,ctx,value?'Publish school announcement':'Clear school announcement',value?'Announcement published to the school feed.':'Current announcement cleared; previously published announcements remain in history.');
   msg('wfBroadcastMsg',ok?(value?'Announcement published to the live teacher feed.':'Current announcement cleared; published history retained.'):'Announcement saved, but its audit entry failed. Notify the platform administrator.',!ok);
 };
 $('wfBroadcastForm').onsubmit=async e=>{e.preventDefault();const value=$('wfBroadcastText').value.trim();if(!value)return msg('wfBroadcastMsg','Enter an announcement before publishing.',true);if(!await wfConfirm('Publish this announcement for this school?'))return;await saveBroadcast(value);};
 $('wfBroadcastClear').onclick=async()=>{if(!await wfConfirm('Clear this school’s current announcement?'))return;$('wfBroadcastText').value='';await saveBroadcast('');};

 let auditRows=[];
 async function loadAudit(){
   const {data,error}=await client.from('audit_logs').select('time_string,actor_name,action,details,status,category').eq('school_id',ctx.id).order('created_at',{ascending:false}).limit(300);
   if(error){msg('wfAuditMsg','Audit history is unavailable under the current school permissions.',true);$('wfAuditRows').innerHTML='<tr><td colspan="5">No audit records could be loaded.</td></tr>';return;}
   auditRows=data||[];lastAuditRenderKey='';renderAudit();
 }
 let lastAuditRenderKey='';
 function renderAudit(){
   const q=($('wfAuditSearch').value||'').toLowerCase(),cat=$('wfAuditCategory').value;
   const renderKey=q+'|'+cat+'|'+auditRows.length;
   if(renderKey===lastAuditRenderKey)return;
   lastAuditRenderKey=renderKey;
   const rows=auditRows.filter(x=>(!cat||x.category===cat)&&[x.time_string,x.actor_name,x.action,x.details,x.status,x.category].some(v=>String(v||'').toLowerCase().includes(q)));
   $('wfAuditRows').innerHTML=rows.length?rows.map(x=>'<tr><td>'+esc(x.time_string||'—')+'</td><td>'+esc(x.actor_name||'—')+'</td><td>'+esc(x.action||'—')+'</td><td>'+esc(x.details||'—')+'</td><td>'+esc(x.status||'—')+'</td></tr>').join(''):'<tr><td colspan="5">No matching audit entries.</td></tr>';
   msg('wfAuditMsg',rows.length+' audit entr'+(rows.length===1?'y':'ies')+' shown.');
 }
 $('wfAuditSearch').addEventListener('input',()=>frameRender($('wfAuditRows'),renderAudit));$('wfAuditCategory').addEventListener('change',()=>frameRender($('wfAuditRows'),renderAudit));
 $('wfAuditExport').onclick=()=>{
   const q=($('wfAuditSearch').value||'').toLowerCase(),cat=$('wfAuditCategory').value;
   const filtered=auditRows.filter(x=>(!cat||x.category===cat)&&[x.time_string,x.actor_name,x.action,x.details,x.status,x.category].some(v=>String(v||'').toLowerCase().includes(q)));
   const rows=[['Time','Actor','Category','Action','Details','Status'],...filtered.map(x=>[x.time_string||'',x.actor_name||'',x.category||'',x.action||'',x.details||'',x.status||''])];
    const csv=rows.map(row=>row.map(csvCell).join(',')).join('\r\n');
    const schoolCode=String(ctx.school_code||'school').replace(/[^a-z0-9_-]/gi,'_');
    const filename='Welfare_Audit_History_'+schoolCode+'_'+new Date().toISOString().split('T')[0]+'.csv';
    const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});
   downloadWorkflowBlob(blob,filename,'wfAuditMsg','Audit CSV prepared with '+filtered.length+' entries.','Tap here to open the CSV file');
 };
 $('wfExportCsv').onclick=()=>{
   const rows=[['Record type','Date','Staff ID','Amount GH₵','Reference / reason','Status'],...cons.map(x=>['Contribution',x.date,x.teacher_id,x.amount,x.reference||'',reversed.has('contribution:'+x.id)?'REVERSED':'Active']),...pays.map(x=>['Welfare payout',x.date,x.teacher_id,x.amount,x.reason||x.reference||'',reversed.has('payout:'+x.id)?'REVERSED':'Active'])];
   const csv=rows.map(row=>row.map(csvCell).join(',')).join('\r\n');
   const schoolCode=String(ctx.school_code||'school').replace(/[^a-z0-9_-]/gi,'_');
   const filename='Welfare_Ledgers_'+schoolCode+'_'+new Date().toISOString().split('T')[0]+'.csv';
   const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});
   downloadWorkflowBlob(blob,filename,'wfReportMsg','CSV export prepared for download.','Tap here to open the CSV file');
 };
  // Audit is a dedicated, lazy-loaded view. Never fetch or render audit rows as part
 // of the management panel; fetch only after the user explicitly selects Audit Trail.
 const auditNav=document.querySelector('.sidebar .navbtn[data-target="wfAuditPanel"]');
 const auditView=$('wfAuditView');
 const adminHub=$('wfAdminPanel');
 const auditPanel=$('wfAuditPanel');
 if(auditView)auditView.setAttribute('aria-hidden','true');
 // Defensive guard: keep the audit table outside the administration workspace.
 if(auditPanel && adminHub && adminHub.contains(auditPanel) && auditView){
   auditView.appendChild(auditPanel);
 }
 // The sidebar router emits this event only after the Audit destination is
 // revealed. Hydrate the audit table from that explicit section activation,
 // rather than relying on a second click listener attached to the menu button.
 window.addEventListener('welfare-sidebar-section-open',event=>{
  if(event.detail?.targetId!=='wfAuditPanel'||window.__welfareCurrentRole!=='admin')return;
  if(auditView){
   auditView.classList.remove('hidden');
   auditView.removeAttribute('hidden');
   auditView.style.setProperty('display','block','important');
   auditView.setAttribute('aria-hidden','false');
  }
  loadAudit();
 });
 
 let editingTeacherId=null;
 let selectedPassportData=null;
 let passportReadPending=false;
 const PASSPORT_MAX_BYTES=3*1024*1024;
 const PASSPORT_MAX_DIMENSION=600;
 function setPassportReadState(pending,message){
   passportReadPending=!!pending;
   const saveButton=$('wfTeacherSave');
   if(saveButton)saveButton.disabled=passportReadPending;
   if(message!==undefined)$('wfPassportPreview').textContent=message;
 }
 function readAndCompressPassport(file){
   return new Promise((resolve,reject)=>{
     let reader=null,image=null,settled=false,readerTimer=null,imageTimer=null;
     const cleanup=()=>{
       if(readerTimer)clearTimeout(readerTimer);
       if(imageTimer)clearTimeout(imageTimer);
       if(reader){reader.onload=null;reader.onerror=null;reader.onabort=null;}
       if(image){image.onload=null;image.onerror=null;}
     };
     const fail=error=>{
       if(settled)return;
       settled=true;cleanup();
       reject(error instanceof Error?error:new Error('The photo could not be read. Please choose it again.'));
     };
     const succeed=value=>{
       if(settled)return;
       settled=true;cleanup();resolve(value);
     };
     try{
       reader=new FileReader();
       reader.onerror=()=>fail(new Error('The photo could not be read. Please choose it again.'));
       reader.onabort=()=>fail(new Error('Photo reading was interrupted. Please choose it again.'));
       reader.onload=()=>{
         try{
           const source=typeof reader.result==='string'?reader.result:'';
           if(!/^data:image\/(?:jpeg|png|webp);base64,/i.test(source))return fail(new Error('The selected photo could not be decoded. Please choose a JPEG, PNG or WebP image.'));
           image=new Image();
           image.onerror=()=>fail(new Error('The photo could not be decoded. Please choose it again.'));
           image.onload=()=>{
             try{
               const width=Number(image.naturalWidth||image.width),height=Number(image.naturalHeight||image.height);
               if(!width||!height)return fail(new Error('The selected photo has invalid dimensions. Please choose another image.'));
               const scale=Math.min(1,PASSPORT_MAX_DIMENSION/Math.max(width,height));
               const canvas=document.createElement('canvas');
               canvas.width=Math.max(1,Math.round(width*scale));
               canvas.height=Math.max(1,Math.round(height*scale));
               const context=canvas.getContext('2d');
               if(!context)return fail(new Error('This device could not prepare the photo. Please choose another image.'));
               context.drawImage(image,0,0,canvas.width,canvas.height);
               const compressed=canvas.toDataURL('image/jpeg',0.85);
               if(!/^data:image\/jpeg;base64,/i.test(compressed))return fail(new Error('The photo could not be compressed. Please choose another image.'));
               succeed(compressed);
             }catch(canvasError){fail(canvasError);}
           };
           imageTimer=setTimeout(()=>fail(new Error('The photo took too long to load. Please choose it again.')),12000);
           image.src=source;
         }catch(imageSetupError){fail(imageSetupError);}
       };
       readerTimer=setTimeout(()=>fail(new Error('The photo could not be read in time. Please choose it again.')),12000);
       reader.readAsDataURL(file);
     }catch(readError){fail(readError);}
   });
 }
 $('wfPassport').addEventListener('change',async()=>{
   selectedPassportData=null;
   const file=$('wfPassport').files?.[0];
   if(!file){setPassportReadState(false,'');return;}
   if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>PASSPORT_MAX_BYTES){
     $('wfPassport').value='';
     setPassportReadState(false,'Choose a JPEG, PNG or WebP image no larger than 3 MB.');
     return;
   }
   setPassportReadState(true,'Preparing photo…');
   try{
     selectedPassportData=await readAndCompressPassport(file);
     setPassportReadState(false,'Photo ready to save (resized and compressed).');
   }catch(photoError){
     selectedPassportData=null;
     $('wfPassport').value='';
     setPassportReadState(false,photoError?.message||'The photo could not be read. Please choose it again.');
   }
 });
 function resetTeacherForm(){editingTeacherId=null;selectedPassportData=null;$('wfTeacher').reset();$('wfPassportPreview').textContent='';$('wfTid').disabled=false;$('wfTeacherSave').textContent='Register teacher';msg('wfTeacherMsg','');}
 $('wfTeacherCancel').onclick=resetTeacherForm;
 
 // Bulk teacher import. Role is informational only; administrator access remains
 // exclusively controlled by the secure administrator invitation workflow.
 const bulkColumns=['Staff ID','Full name','Phone','Rank / Grade','Class / Subject / Responsibility','Membership Type','Employer'];
 const bulkRankOptions=[...RANK_OPTIONS];
 const bulkMembershipOptions=['Permanent','Temporal'];
 const bulkEmployerOptions=['GES','NGO','NSA'];
 const bulkEscape=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const bulkCsvCell=value=>{const s=String(value??'');return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
 let bulkExcelPromise=null;
 const bulkLoadExcelJs=()=>{
  if(window.ExcelJS)return Promise.resolve(window.ExcelJS);if(bulkExcelPromise)return bulkExcelPromise;
  bulkExcelPromise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';script.onload=()=>window.ExcelJS?resolve(window.ExcelJS):reject(new Error('Excel workbook generator did not initialize.'));script.onerror=()=>reject(new Error('Could not load the Excel workbook generator. Check your connection and try again.'));document.head.appendChild(script);});
  return bulkExcelPromise;
 };
 const bulkDownloadTemplate=async()=>{
  const ExcelJS=await bulkLoadExcelJs(),workbook=new ExcelJS.Workbook(),sheet=workbook.addWorksheet('Teacher Register'),lists=workbook.addWorksheet('Validation Lists');
  lists.state='veryHidden';
  bulkRankOptions.forEach((value,index)=>lists.getCell(index+1,1).value=value);
  bulkMembershipOptions.forEach((value,index)=>lists.getCell(index+1,2).value=value);
  bulkEmployerOptions.forEach((value,index)=>lists.getCell(index+1,3).value=value);
  workbook.definedNames.add("'Validation Lists'!$A$1:$A$"+bulkRankOptions.length,'RankGradeOptions');
  workbook.definedNames.add("'Validation Lists'!$B$1:$B$"+bulkMembershipOptions.length,'MembershipTypeOptions');
  workbook.definedNames.add("'Validation Lists'!$C$1:$C$"+bulkEmployerOptions.length,'EmployerOptions');
  sheet.columns=bulkColumns.map((header,index)=>({header,key:'c'+index,width:[18,28,20,30,34,22,18][index]}));
  sheet.getRow(1).font={bold:true,color:{argb:'FFFFFFFF'}};sheet.getRow(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF17365D'}};sheet.getRow(1).alignment={vertical:'middle',wrapText:true};
  sheet.views=[{state:'frozen',ySplit:1}];sheet.autoFilter={from:'A1',to:'G200'};
  for(let row=2;row<=200;row++){
   sheet.getCell(row,1).numFmt='@';sheet.getCell(row,3).numFmt='@';
   sheet.getCell(row,4).dataValidation={type:'list',allowBlank:true,formulae:['=RankGradeOptions'],showErrorMessage:true,errorTitle:'Choose a listed rank',error:'Select a Rank / Grade from the dropdown.'};
   sheet.getCell(row,6).dataValidation={type:'list',allowBlank:true,formulae:['=MembershipTypeOptions'],showErrorMessage:true,errorTitle:'Choose a membership type',error:'Select a Membership Type from the dropdown.'};
   sheet.getCell(row,7).dataValidation={type:'list',allowBlank:true,formulae:['=EmployerOptions'],showErrorMessage:true,errorTitle:'Choose an employer',error:'Select an Employer from the dropdown.'};
  }
  const buffer=await workbook.xlsx.writeBuffer(),blob=new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='Teacher_Bulk_Registration_Template.xlsx';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  msg('wfBulkTeacherMsg','Excel template downloaded with blank rows, Text-formatted Staff ID and Phone columns, and dropdowns through row 200.');
 };
 const bulkParseCsv=source=>{
  const rows=[];let row=[],field='',quoted=false;
  for(let i=0;i<source.length;i++){const ch=source[i];if(quoted){if(ch==='"'&&source[i+1]==='"'){field+='"';i++;}else if(ch==='"')quoted=false;else field+=ch;}else if(ch==='"'&&field==='')quoted=true;else if(ch===','){row.push(field);field='';}else if(ch==='\n'){row.push(field);rows.push(row);row=[];field='';}else if(ch!=='\r')field+=ch;}
  if(field!==''||row.length){row.push(field);rows.push(row);}return rows;
 };
 let bulkXlsxPromise=null;
 const bulkLoadXlsx=()=>{
  if(window.XLSX)return Promise.resolve(window.XLSX);if(bulkXlsxPromise)return bulkXlsxPromise;
  bulkXlsxPromise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';script.onload=()=>window.XLSX?resolve(window.XLSX):reject(new Error('Excel parser did not initialize.'));script.onerror=()=>reject(new Error('Could not load the Excel parser. Please try a CSV template instead.'));document.head.appendChild(script);});
  return bulkXlsxPromise;
 };
 const bulkNormalizeHeader=value=>String(value??'').replace(/^\uFEFF/,'').trim().toLowerCase().replace(/\s+/g,' ').replace(/[’]/g,"'");
 const bulkShowPreview=(records,databaseIds)=>{
  document.getElementById('wfBulkTeacherPreview')?.remove();
  const existingIds=new Set(teachers.map(t=>String(t.id).trim().toLowerCase())),seenIds=new Set();
  const reviewed=records.map((record,index)=>{const missing=[];if(!String(record.name||'').trim())missing.push('Full name');if(!String(record.id||'').trim())missing.push('Staff ID');const key=String(record.id||'').trim().toLowerCase();const duplicate=!!key&&(existingIds.has(key)||databaseIds?.has(key)||seenIds.has(key));if(key)seenIds.add(key);return {...record,rowNumber:index+2,missing,duplicate,valid:!missing.length&&!duplicate};});
  const validCount=reviewed.filter(x=>x.valid).length,modal=document.createElement('div');modal.id='wfBulkTeacherPreview';modal.style.cssText='position:fixed;inset:0;z-index:10050;background:rgba(2,8,23,.72);display:flex;align-items:center;justify-content:center;padding:14px;overflow:auto';
  const tableRows=reviewed.map(row=>'<tr style="background:'+(row.valid?'transparent':'rgba(239,68,68,.08)')+'"><td>'+row.rowNumber+'</td>'+[row.id,row.name,row.phone,row.rank,row.class_name,row.membership_type,row.employer].map(value=>'<td>'+bulkEscape(value||'—')+'</td>').join('')+'<td style="color:'+(row.valid?'#15803d':'#dc2626')+';font-weight:750">'+(row.valid?'Ready':bulkEscape([...row.missing.map(x=>'Missing '+x),...(row.duplicate?['Duplicate Staff ID']:[])].join('; ')))+'</td></tr>').join('');
  modal.innerHTML='<div role="dialog" aria-modal="true" aria-labelledby="wfBulkPreviewTitle" style="width:min(1100px,100%);max-height:92vh;overflow:auto;background:var(--surface,#fff);color:var(--text,#14213d);border-radius:18px;padding:clamp(16px,3vw,26px);box-shadow:0 24px 80px rgba(0,0,0,.35)"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px"><div><h2 id="wfBulkPreviewTitle" style="margin:0 0 6px">Preview &amp; Confirmation</h2><p class="muted" style="margin:0 0 14px">Rows with missing required fields or duplicate Staff IDs will be skipped. The preview below maps each column directly to the teacher profile. Administrator access remains controlled by the secure administrator invitation workflow.</p></div><button type="button" id="wfBulkPreviewClose" class="secondary" aria-label="Close preview">✕</button></div><p style="font-weight:800;margin:0 0 12px">'+validCount+' valid · '+(reviewed.length-validCount)+' skipped · '+reviewed.length+' detected</p><div style="overflow:auto;max-height:55vh;border:1px solid var(--line);border-radius:12px"><table style="width:100%;min-width:850px;border-collapse:collapse"><thead><tr>'+['Row',...bulkColumns,'Validation'].map(x=>'<th style="position:sticky;top:0;background:var(--surface,#fff);padding:10px;text-align:left;border-bottom:1px solid var(--line)">'+x+'</th>').join('')+'</tr></thead><tbody>'+tableRows+'</tbody></table></div><div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:16px"><button type="button" id="wfBulkPreviewCancel" class="secondary">Cancel</button><button type="button" id="wfBulkPreviewConfirm" '+(validCount?'':'disabled')+'>Confirm &amp; Register '+validCount+' Teachers</button></div><p id="wfBulkPreviewStatus" class="muted" role="status" aria-live="polite" style="margin:10px 0 0"></p></div>';
  document.body.appendChild(modal);const close=()=>modal.remove();modal.querySelector('#wfBulkPreviewClose').onclick=close;modal.querySelector('#wfBulkPreviewCancel').onclick=close;
  modal.querySelector('#wfBulkPreviewConfirm').onclick=async()=>{
   const button=modal.querySelector('#wfBulkPreviewConfirm'),cancel=modal.querySelector('#wfBulkPreviewCancel'),status=modal.querySelector('#wfBulkPreviewStatus');button.disabled=true;cancel.disabled=true;
   const validRows=reviewed.filter(x=>x.valid);status.textContent='Registering '+validRows.length+' teacher records…';
   const payload=validRows.map(x=>({id:String(x.id).trim(),name:String(x.name).trim(),phone:String(x.phone||'').trim()||null,rank:String(x.rank||'').trim()||null,class_name:String(x.class_name||'').trim()||null,membership_type:String(x.membership_type||'').trim()||null,employer:String(x.employer||'').trim()||null,school_id:ctx.id}));
   try{
    const {data:inserted,error}=await client.from('teachers').insert(payload).select('id,name');if(error)throw new Error(error.message||'Teacher records could not be saved.');
    let activated=0,activationFailures=[];
    for(const teacher of (inserted||[])){try{const {data,error:provisionError}=await client.functions.invoke('provision-teacher-account',{body:{school_id:ctx.id,teacher_id:teacher.id}});if(provisionError||!data?.ok)throw new Error(data?.error||provisionError?.message||'Sign-in setup failed');activated++;}catch(problem){activationFailures.push(String(teacher.id)+': '+(problem.message||'sign-in setup failed'));}}
    const auditOk=await audit(client,ctx,'Bulk register teachers',String(inserted?.length||0)+' teacher records added from template; '+activated+' secure sign-ins activated. Bulk teacher fields imported from the seven-column template.');
    close();await refreshWorkflow();const count=inserted?.length||0;
    const summary='Bulk registration complete: '+count+' teachers registered; '+activated+' sign-ins activated; '+activationFailures.length+' sign-in setup failures. '+(reviewed.length-validRows.length)+' rows skipped.';
    msg('wfBulkTeacherMsg',summary,activationFailures.length>0||!auditOk);wfNotice(summary+(activationFailures.length?'\n\nSign-in setup needs attention:\n'+activationFailures.slice(0,10).join('\n'):'')+(!auditOk?'\nAudit logging also needs attention.':''));
   }catch(problem){status.textContent='Registration failed: '+(problem.message||'Unknown error')+'. No success was assumed.';button.disabled=false;cancel.disabled=false;}
  };
 };
 const bulkReadFile=async file=>{
  const extension=String(file.name||'').split('.').pop().toLowerCase();let matrix;
  if(extension==='csv')matrix=bulkParseCsv(await file.text());
  else if(extension==='xlsx'||extension==='xls'){const XLSX=await bulkLoadXlsx();const workbook=XLSX.read(await file.arrayBuffer(),{type:'array',raw:false});const first=workbook.SheetNames?.[0];if(!first)throw new Error('The workbook contains no worksheet.');matrix=XLSX.utils.sheet_to_json(workbook.Sheets[first],{header:1,defval:'',raw:false});}
  else throw new Error('Choose an .xlsx, .xls or .csv file.');
  if(!matrix?.length)throw new Error('The selected file is empty.');
  const headers=matrix[0].map(bulkNormalizeHeader),columnIndex=bulkColumns.map(column=>headers.indexOf(bulkNormalizeHeader(column))),missingHeaders=bulkColumns.filter((column,index)=>columnIndex[index]<0);
  if(missingHeaders.length)throw new Error('Missing template columns: '+missingHeaders.join(', '));
  const records=matrix.slice(1).filter(row=>row.some(cell=>String(cell??'').trim()!=='')).map(row=>({id:String(row[columnIndex[0]]??'').trim(),name:String(row[columnIndex[1]]??'').trim(),phone:String(row[columnIndex[2]]??'').trim(),rank:String(row[columnIndex[3]]??'').trim(),class_name:String(row[columnIndex[4]]??'').trim(),membership_type:String(row[columnIndex[5]]??'').trim(),employer:String(row[columnIndex[6]]??'').trim()}));
  if(!records.length)throw new Error('No teacher rows were found beneath the header.');
  const {data:latest,error}=await client.from('teachers').select('id').eq('school_id',ctx.id);if(error)throw new Error('Could not verify existing Staff IDs for this school. Try again.');
  const latestIds=new Set((latest||[]).map(t=>String(t.id).trim().toLowerCase()));bulkShowPreview(records,latestIds);
 };
 $('wfBulkTeacherDownload')?.addEventListener('click',bulkDownloadTemplate);
 $('wfBulkTeacherChoose')?.addEventListener('click',()=>$('wfBulkTeacherFile')?.click());
 $('wfBulkTeacherFile')?.addEventListener('change',async()=>{const file=$('wfBulkTeacherFile').files?.[0];if(!file)return;msg('wfBulkTeacherMsg','Reading and validating template…');try{await bulkReadFile(file);msg('wfBulkTeacherMsg','Review the preview and confirm to register valid rows.');}catch(problem){msg('wfBulkTeacherMsg',problem?.message||'The file could not be processed.',true);}finally{$('wfBulkTeacherFile').value='';}});

 $('wfManageTeacherRows').addEventListener('click',async e=>{
   // Deactivation is handled by the earlier listener, which supports an optional audit note.
   // Keep this listener for the independent Restore and Edit actions only.
   const restore=e.target.closest('[data-wf-restore]');
   if(restore){const t=teachers.find(x=>String(x.id)===restore.dataset.wfRestore);if(!t)return;if(!await wfConfirm('Restore '+t.name+' to the active register?'))return;const {error}=await client.from('teachers').update({is_active:true}).eq('id',t.id).eq('school_id',ctx.id);if(error)return wfNotice('Teacher could not be restored. Check school permissions.');const ok=await audit(client,ctx,'Restore teacher profile',t.name,t.id);await refreshWorkflow();if(!ok)wfNotice('Teacher restored, but audit logging failed.');return;}
   const b=e.target.closest('[data-wf-edit]');if(!b)return;const t=teachers.find(x=>String(x.id)===b.dataset.wfEdit);if(!t)return;editingTeacherId=t.id;$('wfTid').value=t.id;$('wfTid').disabled=true;$('wfName').value=t.name||'';$('wfPhone').value=t.phone||'';$('wfRank').value=t.rank||'';$('wfClass').value=t.class_name||'';$('wfMembershipType').value=t.membership_type||'';$('wfEmployer').value=t.employer||'';selectedPassportData=null;$('wfPassport').value='';$('wfPassportPreview').textContent=t.passport?'Existing passport photo saved. Choose a new image to replace it.':'';$('wfTeacherSave').textContent='Save changes';msg('wfTeacherMsg','Editing '+t.name+'.');$('wfTid').scrollIntoView({behavior:'smooth',block:'center'});
 });
 $('wfTeacher').onsubmit=async e=>{e.preventDefault();if(passportReadPending)return msg('wfTeacherMsg','Please wait for the photo to finish processing before saving.',true);if($('wfPassport').files?.length&&!selectedPassportData)return msg('wfTeacherMsg','The selected photo was not processed. Choose it again or clear the photo field before saving.',true);const row={id:$('wfTid').value.trim(),name:$('wfName').value.trim(),phone:$('wfPhone').value.trim()||null,rank:$('wfRank').value.trim()||null,class_name:$('wfClass').value.trim()||null,membership_type:$('wfMembershipType').value||null,employer:$('wfEmployer').value||null,school_id:ctx.id};if(selectedPassportData)row.passport=selectedPassportData;msg('wfTeacherMsg','Saving…');
   const result=editingTeacherId?await client.from('teachers').update({name:row.name,phone:row.phone,rank:row.rank,class_name:row.class_name,membership_type:row.membership_type,employer:row.employer,...(selectedPassportData?{passport:selectedPassportData}:{})}).eq('id',editingTeacherId).eq('school_id',ctx.id):await client.from('teachers').insert(row);
   if(result.error){msg('wfTeacherMsg',editingTeacherId?'Changes were not saved. Check school permissions.':'Not saved. Check the staff ID and school permissions.',true);return;}
   const wasEditing=!!editingTeacherId;
   const savedTeacher={...row,is_active:wasEditing?(teachers.find(t=>String(t.id)===String(row.id))?.is_active!==false):true,passport:selectedPassportData|| (teachers.find(t=>String(t.id)===String(row.id))?.passport||null)};
   const existingTeacher=teachers.find(t=>String(t.id)===String(row.id));
   if(existingTeacher)Object.assign(existingTeacher,savedTeacher);else teachers.push(savedTeacher);
   teacherById.set(String(row.id),savedTeacher);
   selectedProfileTeacherId=String(row.id);
   if(profileSelect){profileSelect.innerHTML=teachers.map(t=>'<option value="'+esc(t.id)+'">'+esc(t.name||t.id)+' ('+esc(t.id)+')</option>').join('');profileSelect.value=selectedProfileTeacherId;}
   renderSelectedTeacherProfile();
   renderTeacherTables();
   const auditOk=await audit(client,ctx,wasEditing?'Update teacher profile':'Register teacher',row.name,row.id);resetTeacherForm();await refreshWorkflow();msg('wfTeacherMsg',auditOk?(wasEditing?'Teacher profile updated.':'Teacher registered.'):'Saved, but the audit entry failed. Notify the platform administrator.',!auditOk);
 };
 // Year-agnostic bulk contribution import. The live schema stores the staff ID
 // in contributions.teacher_id and the paid date in contributions.date; the date
 // itself carries the reporting year, so existing statements and ledgers stay compatible.
 const bulkContributionYear=$('wfBulkContributionYear');
 const contributionNowYear=Number(new Intl.DateTimeFormat('en',{timeZone:'Africa/Accra',year:'numeric'}).format(new Date()));
 for(let y=contributionNowYear-10;y<=contributionNowYear+5;y++){const option=document.createElement('option');option.value=String(y);option.textContent=String(y);if(y===contributionNowYear)option.selected=true;bulkContributionYear.appendChild(option);}
 const contributionMonthNames=['January','February','March','April','May','June','July','August','September','October','November','December'];
 const contributionMonthIndex=value=>{const key=String(value||'').trim().toLowerCase();return contributionMonthNames.findIndex(name=>name.toLowerCase()===key||name.slice(0,3).toLowerCase()===key);};
 const contributionParseMonths=value=>{
   const input=String(value||'').trim();if(!input)return {months:[],error:'Enter the month or months covered.'};
   const tokens=input.split(',').map(x=>x.trim()).filter(Boolean),indexes=[];
   for(const token of tokens){
     const range=token.split(/\s*(?:-|–|—|\bto\b)\s*/i);
     if(range.length>2)return {months:[],error:'Use a clear month range such as Jan - Mar.'};
     const start=contributionMonthIndex(range[0]),end=contributionMonthIndex(range[1]||range[0]);
     if(start<0||end<0)return {months:[],error:'Unrecognized month in "'+token+'".'};
     if(end<start)return {months:[],error:'Month ranges must run from earlier to later in the year.'};
     for(let m=start;m<=end;m++)if(!indexes.includes(m))indexes.push(m);
   }
   return {months:indexes.sort((a,b)=>a-b),error:null};
 };
 const contributionDateForMonth=(year,monthIndex)=>{const day=new Date(year,monthIndex+1,0).getDate();return year+'-'+String(monthIndex+1).padStart(2,'0')+'-'+String(day).padStart(2,'0');};
 const contributionHeaderKey=value=>String(value??'').replace(/^\uFEFF/,'').trim().toLowerCase().replace(/\s+/g,' ').replace(/[’]/g,"'");
 const contributionHeaderAliases={
   staff:['staff id','staffid','staff_id','teacher id','teacher_id'],
   name:['full name','name','teacher name'],
   amount:['amount paid (ghs)','amount paid','amount (ghs)','amount','paid amount'],
   months:['months covered / period','months covered','period','month(s) covered','months'],
   reference:['payment reference / receipt','payment reference','reference / receipt','reference','receipt']
 };
 const contributionFindColumn=(headers,key)=>headers.findIndex(header=>contributionHeaderAliases[key].includes(contributionHeaderKey(header)));
 let contributionImportRows=[];
 const contributionClosePreview=()=>document.getElementById('wfBulkContributionPreview')?.remove();
 const contributionRenderPreview=review=>{
   contributionClosePreview();contributionImportRows=review;
   const valid=review.filter(row=>row.valid),readyEntryCount=valid.reduce((sum,row)=>sum+row.entries.length,0),skipped=review.filter(row=>row.skipped).length,invalid=review.filter(row=>!row.valid&&!row.skipped).length;
   const modal=document.createElement('div');modal.id='wfBulkContributionPreview';modal.style.cssText='position:fixed;inset:0;z-index:10080;background:rgba(2,8,23,.76);display:flex;align-items:center;justify-content:center;padding:12px;overflow:auto';
   const previewRows=review.flatMap(row=>row.valid?row.entries.map(entry=>({rowNumber:row.rowNumber,staffId:row.staffId,fullName:row.fullName,amount:entry.amount,period:entry.month+(row.entries.length>1?' (from '+row.period+')':''),datePaid:entry.datePaid,reference:entry.reference,valid:true,skipped:false})): [row]);
   const rows=previewRows.map(row=>'<tr style="background:'+(row.valid?'rgba(22,163,74,.045)':row.skipped?'rgba(148,163,184,.07)':'rgba(220,38,38,.07)')+'"><td>'+row.rowNumber+'</td><td>'+bulkEscape(row.staffId||'—')+'</td><td>'+bulkEscape(row.fullName||'—')+'</td><td>'+ (row.amount===null?'—':Number.isFinite(Number(row.amount))?'GH₵ '+Number(row.amount).toFixed(2):bulkEscape(row.amountRaw||'Invalid amount'))+'</td><td>'+bulkEscape(row.period||'—')+'</td><td>'+bulkEscape(row.datePaid||'—')+'</td><td>'+bulkEscape(row.reference||'—')+'</td><td style="font-weight:800;color:'+(row.valid?'#15803d':row.skipped?'#64748b':'#b91c1c')+'">'+(row.valid?'✓ Ready':row.skipped?'Skipped':bulkEscape(row.error||'Invalid'))+'</td></tr>').join('');
   modal.innerHTML='<div role="dialog" aria-modal="true" aria-labelledby="wfBulkContributionPreviewTitle" style="width:min(1500px,100%);max-height:94vh;overflow:auto;background:#fff;color:#14213d;border-radius:18px;padding:clamp(15px,2.5vw,25px);box-shadow:0 24px 80px rgba(0,0,0,.4)"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><div><h2 id="wfBulkContributionPreviewTitle" style="margin:0 0 5px">Review Bulk Contributions</h2><p style="margin:0;color:#64748b">Reporting Year: <strong>'+bulkEscape(String(bulkContributionYear.value))+'</strong>. Every month in a multi-month period becomes an individual ledger entry.</p></div><button type="button" id="wfBulkContributionClose" class="secondary">Close</button></div><div style="display:flex;gap:9px;flex-wrap:wrap;margin:14px 0"><span style="padding:7px 10px;border-radius:9px;background:#dcfce7;color:#166534;font-weight:800">'+readyEntryCount+' ready monthly entries</span><span style="padding:7px 10px;border-radius:9px;background:#fee2e2;color:#991b1b;font-weight:800">'+invalid+' invalid rows</span><span style="padding:7px 10px;border-radius:9px;background:#f1f5f9;color:#475569;font-weight:800">'+skipped+' blank/zero rows skipped</span></div><div style="overflow:auto;max-height:58vh;border:1px solid #e2e8f0;border-radius:12px"><table style="min-width:1250px;width:100%;border-collapse:collapse;font-size:.78rem"><thead style="position:sticky;top:0;background:#edf2f7;z-index:1"><tr>'+['#','Staff ID','Full Name','Amount Paid (GH₵)','Months Covered / Period','Date Paid','Description','Validation'].map(x=>'<th style="padding:10px;text-align:left;border-bottom:1px solid #dbe2ea">'+x+'</th>').join('')+'</tr></thead><tbody>'+rows+'</tbody></table></div><p id="wfBulkContributionPreviewMsg" style="color:#64748b;font-size:.82rem;margin:12px 0">Only validated payment entries will be inserted. Invalid rows are excluded.</p><div style="display:flex;justify-content:flex-end;gap:9px;flex-wrap:wrap"><button type="button" id="wfBulkContributionCancel" class="secondary">Cancel</button><button type="button" id="wfBulkContributionSave" '+(valid.length?'':'disabled')+'><i class="fa-solid fa-check"></i> Confirm &amp; Save Bulk Contributions ('+readyEntryCount+')</button></div></div>';
   document.body.appendChild(modal);
   modal.querySelector('#wfBulkContributionClose').onclick=contributionClosePreview;modal.querySelector('#wfBulkContributionCancel').onclick=contributionClosePreview;
   modal.querySelector('#wfBulkContributionSave').onclick=async()=>{
     const button=modal.querySelector('#wfBulkContributionSave');button.disabled=true;button.textContent='Saving batch…';
     const payload=valid.flatMap(row=>row.entries).map(entry=>({school_id:ctx.id,teacher_id:entry.staffId,amount:entry.amount,date:entry.datePaid,reference:entry.reference}));
     try{
       const {error}=await client.from('contributions').insert(payload);
       if(error)throw new Error(error.message||'The batch insert was rejected.');
       const total=payload.reduce((sum,row)=>sum+Number(row.amount||0),0);
       const auditOk=await audit(client,ctx,'Bulk contribution import',payload.length+' monthly entries; '+valid.length+' source rows; GH₵ '+total.toFixed(2)+'; reporting year '+bulkContributionYear.value+'.');
       await refreshWorkflow();
       contributionClosePreview();$('wfBulkContributionFile').value='';
       msg('wfBulkContributionMsg',payload.length+' contribution entries saved successfully for '+bulkContributionYear.value+' (GH₵ '+total.toFixed(2)+'). '+(auditOk?'Audit recorded.':'Audit entry could not be recorded; notify the platform administrator.'));
     }catch(error){
       console.error('[Bulk contributions] Batch insert failed:',error);
       button.disabled=false;button.innerHTML='<i class="fa-solid fa-rotate"></i> Retry Save';
       const status=modal.querySelector('#wfBulkContributionPreviewMsg');if(status)status.textContent='Nothing was confirmed as saved. '+(error.message||'Check school permissions and try again.');
     }
   };
 };
 $('wfBulkContributionDownload').addEventListener('click',async()=>{
   const button=$('wfBulkContributionDownload');button.disabled=true;
   try{
     const year=Number(bulkContributionYear.value);
     const {data:members,error}=await client.from('teachers').select('id,name').eq('school_id',ctx.id).eq('is_active',true).order('name');
     if(error)throw new Error(error.message||'Could not load the active school roster.');
     if(!members?.length)throw new Error('No active members were found for this school.');
     const ExcelJS=await bulkLoadExcelJs(),workbook=new ExcelJS.Workbook(),sheet=workbook.addWorksheet('Contributions');
     const headers=['Staff ID','Full Name','Amount Paid (GH₵)','Months Covered / Period'];
     sheet.columns=headers.map((header,index)=>({header,key:'c'+index,width:[20,32,22,32][index]}));
     sheet.getRow(1).font={bold:true,color:{argb:'FFFFFFFF'}};sheet.getRow(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF17365D'}};sheet.getRow(1).alignment={vertical:'middle',wrapText:true};sheet.views=[{state:'frozen',ySplit:1}];sheet.autoFilter={from:'A1',to:'D'+(members.length+1)};
     members.forEach((member,index)=>{const row=sheet.getRow(index+2);row.getCell(1).value=String(member.id??'');row.getCell(1).numFmt='@';row.getCell(2).value=member.name||'';row.getCell(3).value=null;row.getCell(4).value=null;row.alignment={vertical:'middle'};});
     sheet.getColumn(1).numFmt='@';sheet.getColumn(3).numFmt='#,##0.00';
     sheet.getCell('C1').note='Enter the total amount paid for the months covered. For multiple months, the portal splits the total evenly to the nearest pesewa.';
     sheet.getCell('D1').note='Examples: January; March; Jan - Dec; January to March; Jan, Feb, Mar.';
     const buffer=await workbook.xlsx.writeBuffer(),blob=new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
     const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='Welfare_Contributions_Template_'+year+'.xlsx';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
     msg('wfBulkContributionMsg',members.length+' active members pre-filled. Staff IDs are stored as Text. Complete Amount and Months Covered, then upload the workbook. References are generated automatically.');
   }catch(error){msg('wfBulkContributionMsg',error.message||'Template download failed.',true);}
   finally{button.disabled=false;}
 });
 $('wfBulkContributionFile').addEventListener('change',async event=>{
   const file=event.target.files?.[0];if(!file)return;
   try{
     const year=Number(bulkContributionYear.value);if(!Number.isInteger(year)||year<1900||year>9999)throw new Error('Choose a valid reporting year.');
     let matrix;
     if(/\.csv$/i.test(file.name)){matrix=bulkParseCsv(await file.text());}
     else{const XLSX=await bulkLoadXlsx(),buffer=await file.arrayBuffer(),book=XLSX.read(buffer,{type:'array',cellText:true,cellDates:false});const sheet=book.Sheets[book.SheetNames[0]];matrix=XLSX.utils.sheet_to_json(sheet,{header:1,raw:false,defval:''});}
     if(!matrix?.length||matrix.length<2)throw new Error('The uploaded file does not contain contribution rows.');
     const headers=matrix[0],columns={};Object.keys(contributionHeaderAliases).forEach(key=>columns[key]=contributionFindColumn(headers,key));
     if(columns.staff<0||columns.amount<0||columns.months<0)throw new Error('Required columns not found. Use the downloaded contribution template.');
     const {data:members,error:rosterError}=await client.from('teachers').select('id,name,is_active').eq('school_id',ctx.id).eq('is_active',true);
     if(rosterError)throw new Error('The active school roster could not be verified: '+rosterError.message);
     const roster=new Map((members||[]).map(member=>[String(member.id||'').trim().toLowerCase(),member]));
     const review=[];
     matrix.slice(1).forEach((cells,index)=>{
       const values=Array.isArray(cells)?cells:[];
       const staffId=String(values[columns.staff]??'').trim(),rawAmount=String(values[columns.amount]??'').trim(),period=String(values[columns.months]??'').trim();
       if(!staffId&&!rawAmount&&!period)return;
       const amount=rawAmount===''?null:Number(rawAmount);
       if(amount===null||amount===0){review.push({rowNumber:index+2,staffId,fullName:String(values[columns.name]??''),amount,period,valid:false,skipped:true,error:'Blank or zero amount — skipped',entries:[]});return;}
       const member=roster.get(staffId.toLowerCase()),problems=[];
       if(!member)problems.push('Unrecognized or inactive Staff ID');
       if(!Number.isFinite(amount)||amount<0.01)problems.push('Amount must be at least GH₵ 0.01');else if(Math.abs(amount*100-Math.round(amount*100))>0.0001)problems.push('Amount must not have more than two decimal places');
       const parsed=contributionParseMonths(period);if(parsed.error)problems.push(parsed.error);
       if(!period)problems.push('Missing month / period');
       if(!parsed.error&&parsed.months.length&&Number.isFinite(amount)&&amount>0){
         const totalCents=Math.round(amount*100),standardRateCents=Math.round(Number(standardMonthlyDues||0)*100);
         // A value equal to the school's standard monthly rate means "that rate per month".
         // Other entered amounts retain the existing total-lump-sum allocation behaviour.
         const useStandardRatePerMonth=standardRateCents>0&&totalCents===standardRateCents;
         const base=Math.floor(totalCents/parsed.months.length),remainder=totalCents%parsed.months.length;
         const customReference=columns.reference>=0?String(values[columns.reference]??'').trim():'';
         const entries=parsed.months.map((monthIndex,monthPosition)=>{const cents=useStandardRatePerMonth?standardRateCents:base+(monthPosition<remainder?1:0),datePaid=contributionDateForMonth(year,monthIndex),reference=customReference||('CONTRIBUTION FOR '+contributionMonthNames[monthIndex].toUpperCase()+' '+year);return {staffId:member?.id||staffId,amount:Number((cents/100).toFixed(2)),datePaid,reference,month:contributionMonthNames[monthIndex]};});
         const amountSum=entries.reduce((sum,entry)=>sum+entry.amount,0);
         if(!useStandardRatePerMonth&&Math.abs(amountSum-amount)>0.001)problems.push('Amount could not be allocated exactly.');
         review.push({rowNumber:index+2,staffId,fullName:member?.name||String(values[columns.name]??''),amount,amountRaw:rawAmount,period,datePaid:entries.map(x=>x.datePaid).join(', '),reference:entries.map(x=>x.reference).join('; '),valid:!problems.length,skipped:false,error:problems.join('; '),entries:problems.length?[]:entries});
       }else review.push({rowNumber:index+2,staffId,fullName:member?.name||String(values[columns.name]??''),amount,amountRaw:rawAmount,period,datePaid:'—',reference:'—',valid:false,skipped:false,error:problems.join('; ')||'Invalid contribution row',entries:[]});
     });
     if(!review.length)throw new Error('No contribution rows with data were found.');
     contributionRenderPreview(review);
     msg('wfBulkContributionMsg','Preview ready for reporting year '+year+'. Review validation results before confirming the batch.');
   }catch(error){console.error('[Bulk contributions] Preview failed:',error);msg('wfBulkContributionMsg',error.message||'The file could not be processed.',true);}
 });

 $('wfContribution').onsubmit=async e=>{e.preventDefault();const teacher_id=$('wfConTeacher').value,amount=Number($('wfConAmount').value);if(!teacher_id||!Number.isFinite(amount)||amount<=0)return msg('wfConMsg','Choose a teacher and a positive amount.',true);const teacher=teachers.find(t=>String(t.id)===String(teacher_id));if(!teacher)return msg('wfConMsg','The selected teacher could not be verified. Refresh the register and try again.',true);const confirmation='Confirm contribution recording?\n\nGH₵ '+amount.toFixed(2)+' will be recorded as a contribution in the name of '+teacher.name+'.\n\nSelect OK to commit or Cancel to stop.';if(!await wfConfirm(confirmation))return msg('wfConMsg','Contribution not saved.');const row={teacher_id,amount,date:$('wfConDate').value,reference:$('wfConRef').value.trim()||null,school_id:ctx.id};msg('wfConMsg','Saving contribution for '+teacher.name+'…');const {error}=await client.from('contributions').insert(row);if(error)return msg('wfConMsg','Not saved. Check school permissions.',true);const auditOk=await audit(client,ctx,'Record contribution','GH₵ '+amount.toFixed(2)+' recorded in the name of '+teacher.name,teacher_id);$('wfContribution').reset();$('wfConDate').value=today();await refreshWorkflow();msg('wfConMsg',auditOk?'Contribution of GH₵ '+amount.toFixed(2)+' recorded in the name of '+teacher.name+'.':'Contribution saved, but the audit entry failed. Notify the platform administrator.',!auditOk);};
 $('wfConRows').addEventListener('click',async e=>{
 const retry=e.target.closest('[data-wf-retry-ledgers]');
 if(retry){retry.disabled=true;const ok=await refreshWorkflow();if(!ok)wfNotice('The contribution or payout ledger is still unavailable. Check your connection and retry.');return;}
 const b=e.target.closest('[data-wf-reverse]');if(!b)return;const type=b.dataset.wfReverse,id=b.dataset.wfId;const rows=type==='contribution'?cons:pays;const tx=rows.find(x=>String(x.id)===String(id));if(!tx||reversed.has(type+':'+id))return;const reason=await requestReversalReason(type);if(!reason||!reason.trim())return; if(!await wfConfirm('Confirm reversal of GH₵ '+money(tx.amount)+'? The original transaction will remain visible and be excluded from active totals.'))return;const {data:{user}}=await client.auth.getUser();const {error}=await client.from('transaction_reversals').insert({school_id:ctx.id,transaction_type:type,transaction_id:id,teacher_id:tx.teacher_id,amount:tx.amount,transaction_date:tx.date,reason:reason.trim(),reversed_by:user?.email||'School administrator'});if(error){wfNotice(error.code==='23505'?'This transaction has already been reversed.':'Reversal was not saved. Check school permissions and reversal-table policies.');return;}const ok=await audit(client,ctx,'Reverse '+type,'Original transaction '+id+'; GH₵ '+Number(tx.amount).toFixed(2)+'; reason: '+reason.trim(),tx.teacher_id);await refreshWorkflow();if(!ok)wfNotice('Reversal saved, but the audit entry failed.');});
 $('wfPayout').addEventListener('click',e=>{const chip=e.target.closest('[data-wf-payout-reason],[data-wf-payout-custom]');if(!chip)return;const reasonInput=$('wfPayReason');if(!reasonInput)return;if(chip.hasAttribute('data-wf-payout-custom')){reasonInput.value='';reasonInput.placeholder='Enter your custom welfare payout reason';reasonInput.focus();return;}reasonInput.value=chip.getAttribute('data-wf-payout-reason')||'';reasonInput.placeholder='Choose a suggestion or enter a custom reason';reasonInput.dispatchEvent(new Event('input',{bubbles:true}));});
 $('wfPayRows').addEventListener('click',async e=>{
 const retry=e.target.closest('[data-wf-retry-ledgers]');
 if(retry){retry.disabled=true;const ok=await refreshWorkflow();if(!ok)wfNotice('The contribution or payout ledger is still unavailable. Check your connection and retry.');return;}
 const b=e.target.closest('[data-wf-reverse]');if(!b)return;const type=b.dataset.wfReverse,id=b.dataset.wfId;const rows=type==='contribution'?cons:pays;const tx=rows.find(x=>String(x.id)===String(id));if(!tx||reversed.has(type+':'+id))return;const reason=await requestReversalReason(type);if(!reason||!reason.trim())return;if(!await wfConfirm('Confirm reversal of GH₵ '+money(tx.amount)+'? The original transaction will remain visible and be excluded from active totals.'))return;const {data:{user}}=await client.auth.getUser();const {error}=await client.from('transaction_reversals').insert({school_id:ctx.id,transaction_type:type,transaction_id:id,teacher_id:tx.teacher_id,amount:tx.amount,transaction_date:tx.date,reason:reason.trim(),reversed_by:user?.email||'School administrator'});if(error){wfNotice(error.code==='23505'?'This transaction has already been reversed.':'Reversal was not saved. Check school permissions and reversal-table policies.');return;}const ok=await audit(client,ctx,'Reverse '+type,'Original transaction '+id+'; GH₵ '+Number(tx.amount).toFixed(2)+'; reason: '+reason.trim(),tx.teacher_id);await refreshWorkflow();if(!ok)wfNotice('Reversal saved, but the audit entry failed.');});
 $('wfPayout').onsubmit=async e=>{e.preventDefault();const teacher_id=$('wfPayTeacher').value,amount=Number($('wfPayAmount').value);if(!teacher_id||!Number.isFinite(amount)||amount<=0)return msg('wfPayMsg','Choose a teacher and enter a positive amount.',true);const activeContributions=cons.filter(x=>!reversed.has('contribution:'+String(x.id))).reduce((sum,x)=>sum+Number(x.amount||0),0);const activePayouts=pays.filter(x=>!reversed.has('payout:'+String(x.id))).reduce((sum,x)=>sum+Number(x.amount||0),0);const available=Math.round((activeContributions-activePayouts)*100)/100;if(amount>available+0.001)return msg('wfPayMsg','Payout exceeds the available school fund balance of GH₵ '+money(Math.max(0,available))+'. Reverse or reconcile records before proceeding.',true);const confirmation=await wfConfirm('Confirm welfare payout of GH₵ '+amount.toFixed(2)+'? Available balance after payout: GH₵ '+money(available-amount)+'.',{responseMode:'optional',placeholder:'Optional note for the audit trail…'});if(!confirmation||confirmation.confirmed===false)return;const adminNote=confirmation.response||'No additional note supplied; action confirmed by school administrator.';const row={teacher_id,amount,date:$('wfPayDate').value,reason:$('wfPayReason').value.trim(),reference:$('wfPayRef').value.trim()||null,school_id:ctx.id};msg('wfPayMsg','Saving…');const {error}=await client.rpc('record_school_welfare_payout',{p_school_id:ctx.id,p_teacher_id:teacher_id,p_amount:amount,p_date:row.date,p_reason:row.reason,p_reference:row.reference});if(error){console.warn('Secure payout RPC failed',error.code,error.message);return msg('wfPayMsg',error.code==='23514'?'Payout was not saved: the available school fund balance may be insufficient, or the amount/reason/date is invalid. Refresh the ledger and check the details.':'Payout was not saved. The secure database check failed; no payout was recorded. Check administrator access and try again.',true);}const auditOk=await audit(client,ctx,'Record payout','GH₵ '+amount.toFixed(2)+' — '+row.reason+'; admin note: '+adminNote,teacher_id);$('wfPayout').reset();$('wfPayDate').value=today();await refreshWorkflow();msg('wfPayMsg',auditOk?'Payout recorded.':'Payout saved, but the audit entry failed. Notify the platform administrator.',!auditOk);};
   if(workflowSchoolKey){window.__welfareWorkflowReadySchoolId=workflowSchoolKey;window.__welfareWorkflowReadyUserId=workflowUserId;}
   // Signal that authenticated tenant destinations and renderers are mounted.
   window.__welfareSyncSidebarNavigation?.();
   window.dispatchEvent(new CustomEvent('welfare-workspace-mounted',{detail:{schoolId:workflowSchoolKey,schoolCode:String(ctx.school_code||'')}}));
   return true;
 }catch(error){
   // Report initialization failure so the caller cannot mistake an unmounted
   // Admin Panel for a successful workflow setup.
   window.__welfareWorkflowLastError={message:String(error?.message||error||'Unknown workflow initialization error'),stage:workflowStage,schoolCode:workflowSchoolCode,userId:workflowUserId,at:new Date().toISOString()};
   console.error('[School Welfare] Workflow initialization failed:',window.__welfareWorkflowLastError,error?.stack||'');
   if(window.__welfareWorkflowReadySchoolId===workflowSchoolKey){window.__welfareWorkflowReadySchoolId=null;window.__welfareWorkflowReadyUserId=null;}
   return false;
 }
};
window.__welfareWorkflowBundleState='ready';
window.dispatchEvent(new Event('welfare-workflows-ready'));
})();
