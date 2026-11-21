/* Welfare DEMO sandbox: entirely in-memory; never calls Supabase or persists demo records. */
(function(){
 'use strict';
 const demoQuery=new URLSearchParams(window.location.search);
 if(!demoQuery.has('c')||String(demoQuery.get('c')||'').trim().toUpperCase()!=='DEMO')return;
 const school={id:'demo-school-local',name:'DEMO BASIC SCHOOL',school_code:'DEMO',school_type:'Basic',region:'Ashanti Region',district:'Kumasi Metro',status:'active',monthly_dues:20};
 const names=[
  ['Akosua Mensah','GES/DEMO/001','Principal Superintendent','Primary 6','024 310 2201'],
  ['Kwame Asare','GES/DEMO/002','Assistant Director II','JHS 2','020 441 7820'],
  ['Ama Serwaa Boateng','GES/DEMO/003','Principal Superintendent','Primary 4','055 208 1143'],
  ['Yaw Osei','GES/DEMO/004','Senior Superintendent I','JHS 3','024 908 7712'],
  ['Abena Owusu','GES/DEMO/005','Senior Superintendent II','Primary 5','050 117 9034'],
  ['Kofi Appiah','GES/DEMO/006','Principal Superintendent','JHS 1','027 660 4158'],
  ['Efua Antwi','GES/DEMO/007','Pupil Teacher','Primary 2','054 390 2281'],
  ['Daniel Agyeman','GES/DEMO/008','Assistant Director I','Primary 6','026 881 6042']
 ];
 const teachers=names.map((n,index)=>({id:'demo-teacher-'+(index+1),teacher_id:'demo-teacher-'+(index+1),name:n[0],staff_id:n[1],rank:n[2],class_name:n[3],phone:n[4],email:'teacher'+(index+1)+'@demo.welfare.local',is_active:true,status:'active',registration_date:'2025-04-01',joined_at:'2025-04-01',created_at:'2025-04-01T09:00:00.000Z',passport:null,school_id:school.id}));
 const months=[];for(let index=0;index<12;index++){const d=new Date(2025,3+index,1);months.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'));}
 const gaps=[[2,7],[4],[1,5,10],[3,8],[0,6],[2,9],[1,4,7,11],[5,10]];
 let contributions=[];
 teachers.forEach((teacher,ti)=>months.forEach((month,mi)=>{
  if(gaps[ti].includes(mi))return;
  contributions.push({id:'demo-con-'+(tindex+1)+'-'+(mindex+1),teacher_id:teacher.id,school_id:school.id,amount:20,date:month+'-15',contribution_date:month+'-15',payment_date:month+'-15',reference:'DEMO-C'+String(tindex+1).padStart(2,'0')+'-'+String(mindex+1).padStart(2,'0'),status:'active',is_reversed:false,created_at:month+'-15T10:00:00.000Z'});
 }));
 let payouts=[
  {id:'demo-pay-1',teacher_id:teachers[0].id,school_id:school.id,amount:150,date:'2025-08-21',payout_date:'2025-08-21',reason:'Medical assistance',reference:'DEMO-PAY-001'},
  {id:'demo-pay-2',teacher_id:teachers[2].id,school_id:school.id,amount:100,date:'2025-11-06',payout_date:'2025-11-06',reason:'Bereavement assistance',reference:'DEMO-PAY-002'},
  {id:'demo-pay-3',teacher_id:teachers[4].id,school_id:school.id,amount:80,date:'2026-01-18',payout_date:'2026-01-18',reason:'Emergency welfare support',reference:'DEMO-PAY-003'},
  {id:'demo-pay-4',teacher_id:teachers[1].id,school_id:school.id,amount:120,date:'2026-03-12',payout_date:'2026-03-12',reason:'Medical assistance',reference:'DEMO-PAY-004'}
 ];
 let reversals=[],auditLogs=[
  {id:'demo-audit-1',school_id:school.id,actor_name:'Demo Administrator',category:'Welfare portal',action:'Published school announcement',details:'Termly welfare contribution reminder',status:'success',created_at:'2026-03-01T09:00:00Z'},
  {id:'demo-audit-2',school_id:school.id,actor_name:'Demo Administrator',category:'Contribution',action:'Recorded contribution',details:'Monthly contribution received',status:'success',created_at:'2026-03-15T10:00:00Z'}
 ];
 let announcements=[
  {id:'demo-ann-1',school_id:school.id,message:'Welcome to the DEMO BASIC SCHOOL welfare portal. Explore the dashboard, contribution ledger and reports.',created_at:'2026-03-01T08:00:00Z',published_at:'2026-03-01T08:00:00Z',active:true},
  {id:'demo-ann-2',school_id:school.id,message:'Monthly standard welfare dues are GHS 20.00. Please review your contribution history and outstanding months.',created_at:'2026-03-05T08:00:00Z',published_at:'2026-03-05T08:00:00Z',active:true}
 ];
 let settings=[{school_id:school.id,key:'standard_dues',value:'20'},{school_id:school.id,key:'school_announcement',value:announcements[0].message},{school_id:school.id,key:'broadcast_message',value:announcements[1].message},{school_id:school.id,key:'headteacher_name',value:'Mrs. Akosua Mensah'},{school_id:school.id,key:'financial_secretary_name',value:'Mr. Kwame Asare'}];
 let accounts=[],activeTeacherIndex=0;
 const user={id:'demo-admin-user',email:'admin@demo.welfare.local',user_metadata:{full_name:'Demo Administrator',name:'Demo Administrator'},app_metadata:{account_type:'school_admin'}};
 // DEMO rows are flat records. Shallow snapshots avoid JSON serialization
 // while keeping returned row objects independent of the in-memory dataset.
 const clone=x=>Array.isArray(x)?x.map(row=>row&&typeof row==='object'?{...row}:row)
  :x&&typeof x==='object'?{...x}:x;
 const tables={schools:[school],teachers,contributions,payouts,transaction_reversals:reversals,system_settings:settings,audit_logs:auditLogs,school_announcements:announcements,teacher_accounts:accounts,platform_admins:[{user_id:user.id,school_id:school.id,active:true}],admin_users:[],platform_schools:[{school_code:'DEMO',status:'active'}]};
 function rows(name){return tables[name]||(tables[name]=[]);}
 function query(table){
  let action='select',projection='*',filters=[],sorts=[],max=null,from=0,to=Infinity,payload=null,conflict='';
  const q={
   select(fields){projection=fields||'*';return q;},
   eq(k,v){filters.push(r=>String(r?.[k]??'')===String(v??''));return q;},
   neq(k,v){filters.push(r=>String(r?.[k]??'')!==String(v??''));return q;},
   is(k,v){filters.push(r=>v===null?r?.[k]==null:r?.[k]===v);return q;},
   in(k,values){filters.push(r=>(values||[]).map(String).includes(String(r?.[k]??'')));return q;},
   gte(k,v){filters.push(r=>String(r?.[k]??'')>=String(v));return q;},
   lte(k,v){filters.push(r=>String(r?.[k]??'')<=String(v));return q;},
   order(k,opt={}){sorts.push([k,opt.ascending!==false]);return q;},
   limit(n){max=Number(n);return q;},
   range(a,b){from=Number(a)||0;to=Number(b)||Infinity;return q;},
   insert(value){action='insert';payload=Array.isArray(value)?value:[value];return q;},
   upsert(value,opt={}){action='upsert';payload=Array.isArray(value)?value:[value];conflict=opt.onConflict||'';return q;},
   update(value){action='update';payload=value||{};return q;},
   delete(){action='delete';return q;},
   maybeSingle(){return q.then(res=>({data:res.data?.[0]||null,error:res.error}));},
   single(){return q.then(res=>({data:res.data?.[0]||null,error:res.error}));},
   then(resolve,reject){try{return Promise.resolve(execute()).then(resolve,reject)}catch(e){return Promise.reject(e).then(resolve,reject);}}
  };
  function execute(){
   let source=rows(table),selected=source.filter(r=>filters.every(fn=>fn(r)));
   if(action==='insert'||action==='upsert'){
    const added=payload.map(item=>{const row={id:item.id||'demo-'+table+'-'+Math.random().toString(36).slice(2,9),...item};if(table==='contributions')row.status=row.status||'active';if(action==='upsert'&&conflict){const keys=conflict.split(',');const found=source.find(x=>keys.every(k=>x[k]===row[k]));if(found){Object.assign(found,row);return found;}}source.push(row);return row;});
    return {data:clone(added),error:null};
   }
   if(action==='update'){selected.forEach(r=>Object.assign(r,payload));return {data:clone(selected),error:null};}
   if(action==='delete'){const gone=new Set(selected);tables[table]=source.filter(r=>!gone.has(r));return {data:clone(selected),error:null};}
   let result=selected.slice();
   sorts.forEach(([key,ascending])=>result.sort((a,b)=>String(a?.[key]??'').localeCompare(String(b?.[key]??''))*(ascending?1:-1)));
   if(max!==null)result=result.slice(0,max);
   result=result.slice(from,Number.isFinite(to)?to+1:undefined);
   if(projection&&projection!=='*'&&!projection.includes('(')){
    const fields=projection.split(',').map(x=>x.trim()).filter(Boolean);
    result=result.map(r=>Object.fromEntries(fields.map(f=>[f,r[f]]).filter(([k,v])=>v!==undefined)));
   }
   return {data:clone(result),error:null};
  }
  return q;
 }
 function activeCon(){const rev=new Set(reversals.filter(x=>x.transaction_type==='contribution').map(x=>String(x.transaction_id)));return contributions.filter(x=>{const status=String(x.status||x.transaction_status||x.reversal_status||'').toLowerCase(),flagged=v=>v===true||['true','t','1','yes'].includes(String(v??'').trim().toLowerCase());return !rev.has(String(x.id))&&!flagged(x.is_reversed)&&!flagged(x.reversed)&&!['reversed','inactive','deleted','cancelled','canceled','void','archived'].includes(status)&&!x.reversed_at&&!x.reversedAt;});}
 function activePay(){const rev=new Set(reversals.filter(x=>x.transaction_type==='payout').map(x=>String(x.transaction_id)));return payouts.filter(x=>{const status=String(x.status||x.transaction_status||'').toLowerCase(),flagged=v=>v===true||['true','t','1','yes'].includes(String(v??'').trim().toLowerCase());return !rev.has(String(x.id))&&!flagged(x.is_reversed)&&!flagged(x.reversed)&&!['reversed','inactive','deleted','cancelled','canceled','void','archived'].includes(status)&&!x.reversed_at&&!x.reversedAt;});}
 const summary=()=>{
  const activeContributions=activeCon(),activePayouts=activePay();
  const contributionTotal=activeContributions.reduce((sum,row)=>sum+Number(row.amount||0),0);
  const payoutTotal=activePayouts.reduce((sum,row)=>sum+Number(row.amount||0),0);
  return {teacherCount:teachers.filter(row=>row.is_active!==false).length,contributionCount:activeContributions.length,contributionTotal,payoutCount:activePayouts.length,payoutTotal,netFundBalance:contributionTotal-payoutTotal,monthlyDues:Number(school.monthly_dues||0),latestMonth:months[months.length-1]||''};
 };
 const demoStorage={};
 const client={
  __welfareDemo:true,
  storage:{from(bucket){return {
   async upload(path,file){demoStorage[bucket+'/'+path]=file;return {data:{path},error:null};},
   async createSignedUrl(path){return {data:{signedUrl:demoStorage[bucket+'/'+path] instanceof Blob?URL.createObjectURL(demoStorage[bucket+'/'+path]):null},error:{statusCode:'404',message:'No demo profile image'}};},
   async remove(paths){(paths||[]).forEach(path=>delete demoStorage[bucket+'/'+path]);return {data:[],error:null};}
  };}},
  auth:{
   async getUser(){const selected=teachers[activeTeacherIndex];return {data:{user:window.__welfareDemoRole==='teacher'?{...user,id:'demo-teacher-auth',email:selected.email,user_metadata:{full_name:selected.name,account_type:'teacher'}}:user},error:null};},
   async getSession(){return {data:{session:{access_token:'demo-local-session',user}},error:null};},
   onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}};},
   async signOut(){return {error:null};},
   async signInWithPassword(){return {data:{user},error:null};}
  },
  from:query,
  async rpc(name,args={}){
   const teacher=teachers[activeTeacherIndex],mine=contributions.filter(x=>x.teacher_id===teacher.id),ownPayouts=payouts.filter(x=>x.teacher_id===teacher.id);
   switch(name){
    case 'get_my_teacher_profile':return {data:window.__welfareDemoRole==='teacher'?[{...teacher,teacher_id:teacher.id,school_id:school.id}]:null,error:null};
    case 'get_my_teacher_contributions':return {data:clone(mine),error:null};
    case 'get_my_teacher_contribution_feed':return {data:clone(mine),error:null};
    case 'get_my_teacher_payouts':return {data:clone(ownPayouts),error:null};
    case 'get_my_school_welfare_payout_feed':return {data:clone(payouts),error:null};
    case 'get_my_school_fund_summary':return {data:[{total_fund_balance:activeCon().reduce((s,x)=>s+Number(x.amount||0),0)-activePay().reduce((s,x)=>s+Number(x.amount||0),0)}],error:null};
    case 'get_my_school_registered_member_count':return {data:teachers.filter(x=>x.is_active!==false).length,error:null};
    case 'get_my_teacher_school_standard_dues':return {data:20,error:null};
    case 'get_my_teacher_ticker_feed':return {data:announcements.map(x=>({feed_type:'announcement',message:x.message,published_at:x.published_at})),error:null};
    case 'get_my_school_pdf_signatories':return {data:{headteacher_name:'Mrs. Akosua Mensah',financial_secretary_name:'Mr. Kwame Asare'},error:null};
    case 'save_my_teacher_passport':return {data:true,error:null};
    case 'record_school_welfare_payout':{
      const row={id:'demo-pay-'+(payouts.length+1),school_id:school.id,teacher_id:args.p_teacher_id,amount:Number(args.p_amount),date:args.p_date,payout_date:args.p_date,reason:args.p_reason,reference:args.p_reference||'DEMO-PAYOUT-'+(payouts.length+1)};
      payouts.push(row);return {data:{success:true},error:null};
    }
    default:return {data:null,error:null};
   }
  },
  functions:{async invoke(name,{body}={}){
   const payload=body||{};
   if(name==='issue-statement-verification'){
    const documentId=String(payload.document_id||'DEMO-STATEMENT');
    return {data:{success:true,school_code:'DEMO',document_id:documentId,verification_url:'https://abcollins93.github.io/TEACHERS-WELFARE/verify.html?c=DEMO&d='+encodeURIComponent(documentId)},error:null};
   }
   if(name==='provision-teacher-account'){
    const teacher=teachers.find(item=>String(item.id)===String(payload.teacher_id));
    if(!teacher)return {data:{ok:false,error:'Demo teacher not found.'},error:null};
    const authId='demo-auth-'+teacher.id;
    let account=accounts.find(item=>item.teacher_id===teacher.id);
    if(!account){account={id:'demo-account-'+teacher.id,teacher_id:teacher.id,school_id:school.id,active:true};accounts.push(account);}
    account.auth_user_id=authId;account.active=true;teacher.login_activated=true;
    return {data:{ok:true,auth_user_id:authId,teacher_name:teacher.name,staff_id:teacher.staff_id,initial_password:teacher.staff_id},error:null};
   }
   if(name==='school-admin-management'){
    if(payload.action==='list')return {data:{ok:true,administrators:clone(tables.admin_users)},error:null};
    if(payload.action==='invite'){
     const row={id:'demo-admin-'+(tables.admin_users.length+1),user_id:'demo-invited-'+(tables.admin_users.length+1),username:payload.username,name:payload.full_name,email:payload.email,active:true};
     tables.admin_users.push(row);return {data:{ok:true,message:'Demo invitation recorded in this browser session only.'},error:null};
    }
    if(payload.action==='deactivate'){
     const row=tables.admin_users.find(item=>String(item.id)===String(payload.admin_id));
     if(row)row.active=false;return {data:{ok:true,message:'Demo administrator deactivated in this session.'},error:null};
    }
    if(payload.action==='reset'){
     const removed={members_removed:teachers.length,contributions_removed:contributions.length,payouts_removed:payouts.length};
     teachers.splice(0);contributions.splice(0);payouts.splice(0);reversals.splice(0);accounts.splice(0);
     return {data:{ok:true,result:removed},error:null};
    }
    if(payload.action==='change_password')return {data:{ok:true,message:'Demo password change simulated for this session.'},error:null};
    return {data:{ok:true,administrators:clone(tables.admin_users)},error:null};
   }
   if(name==='teacher-account-security')return {data:{ok:true,success:true,message:'Demo teacher account action simulated locally.'},error:null};
   return {data:{ok:true,success:true,administrators:clone(tables.admin_users)},error:null};
  }}
 };

 const whatsappNumber='233202790002';
 const setupMessage=values=>[
  'Hello, I would like to set up a Teachers Welfare Portal for my school.',
  '',
  'School Name: '+(values.school||'Not provided'),
  'Contact Person & Role: '+(values.contact||'Not provided'),
  'District / Region: '+(values.location||'Not provided'),
  'Approximate Number of Staff: '+(values.staff||'Not provided'),
  '',
  'Please contact me with the onboarding details. Thank you.'
 ].join('\\n');
 const setupUrl=values=>'https://wa.me/'+whatsappNumber+'?text='+encodeURIComponent(setupMessage(values||{}));
 function openSchoolSetupModal(){
  let modal=document.getElementById('welfareSchoolSetupModal');
  if(!modal){
   const style=document.createElement('style');style.id='welfare-school-setup-modal-styles';
   style.textContent=`
    #welfareSchoolSetupModal{position:fixed;inset:0;z-index:16000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(4,12,27,.62);backdrop-filter:blur(3px)}
    #welfareSchoolSetupModal[hidden]{display:none!important}
    #welfareSchoolSetupModal .wss-card{position:relative;width:min(100%,480px);max-height:min(90vh,760px);overflow:auto;padding:22px;border:1px solid #d8e1ee;border-radius:18px;background:#fff;color:#172b46;box-shadow:0 24px 80px rgba(0,0,0,.3)}
    #welfareSchoolSetupModal .wss-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:16px}
    #welfareSchoolSetupModal h2{margin:0 0 5px;font-size:20px;font-weight:850}
    #welfareSchoolSetupModal .wss-intro{margin:0;color:#64748b;font-size:13px;line-height:1.5}
    #welfareSchoolSetupModal .wss-close{width:36px;height:36px;flex:0 0 36px;border:0;border-radius:10px;background:#eef2f7;color:#334155;font-size:25px;line-height:1;cursor:pointer}
    #welfareSchoolSetupModal .wss-fields{display:grid;gap:12px}
    #welfareSchoolSetupModal label{display:grid;gap:5px;color:#263b58;font-size:12px;font-weight:800}
    #welfareSchoolSetupModal input{width:100%;min-width:0;min-height:42px;padding:10px 12px;border:1px solid #cbd5e1;border-radius:9px;background:#fff;color:#172b46;font:inherit;font-size:14px;outline:none}
    #welfareSchoolSetupModal input:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.13)}
    #welfareSchoolSetupModal .wss-primary{display:flex;width:100%;min-height:46px;align-items:center;justify-content:center;margin-top:16px;padding:11px 14px;border:0;border-radius:10px;background:#16834b;color:#fff;font:inherit;font-size:14px;font-weight:850;cursor:pointer}
    #welfareSchoolSetupModal .wss-direct{display:block;margin-top:12px;text-align:center;color:#176bba;font-size:13px;font-weight:800;text-decoration:underline;text-underline-offset:3px}
    #welfareSchoolSetupModal .wss-foot{margin:12px 0 0;text-align:center;color:#64748b;font-size:11px}
    body.dark #welfareSchoolSetupModal .wss-card,.dark #welfareSchoolSetupModal .wss-card{background:#10213b;color:#edf4ff;border-color:#334b6e}
    body.dark #welfareSchoolSetupModal .wss-intro,.dark #welfareSchoolSetupModal .wss-intro,body.dark #welfareSchoolSetupModal .wss-foot,.dark #welfareSchoolSetupModal .wss-foot{color:#b8c8dc}
    body.dark #welfareSchoolSetupModal label,.dark #welfareSchoolSetupModal label{color:#e2eaf5}
    body.dark #welfareSchoolSetupModal input,.dark #welfareSchoolSetupModal input{background:#0b1a30;color:#f1f5f9;border-color:#435b7d}
    body.dark #welfareSchoolSetupModal .wss-close,.dark #welfareSchoolSetupModal .wss-close{background:#263b59;color:#edf4ff}
    body.dark #welfareSchoolSetupModal .wss-direct,.dark #welfareSchoolSetupModal .wss-direct{color:#8fc5ff}
    @media(max-width:480px){#welfareSchoolSetupModal{align-items:flex-end;padding:8px}#welfareSchoolSetupModal .wss-card{max-height:92vh;padding:18px;border-radius:18px 18px 12px 12px}}
   `;
   document.head.appendChild(style);
   modal=document.createElement('div');modal.id='welfareSchoolSetupModal';modal.hidden=true;modal.setAttribute('role','presentation');
   modal.innerHTML='<section class="wss-card" role="dialog" aria-modal="true" aria-labelledby="wssTitle"><div class="wss-head"><div><h2 id="wssTitle">Set Up Your School</h2><p class="wss-intro">Share a few details and our team will help you get your school welfare portal ready.</p></div><button class="wss-close" type="button" aria-label="Close onboarding form">×</button></div><form class="wss-fields"><label>School Name<input name="school" autocomplete="organization" placeholder="Enter your school name"></label><label>Contact Person Name &amp; Role<input name="contact" autocomplete="name" placeholder="e.g. Ama Mensah — Headteacher"></label><label>District / Region<input name="location" placeholder="e.g. Kumasi Metro, Ashanti Region"></label><label>Approximate Number of Staff<input name="staff" inputmode="numeric" type="number" min="1" placeholder="e.g. 35"></label><button class="wss-primary" type="submit">Send via WhatsApp</button></form><a class="wss-direct" target="_blank" rel="noopener noreferrer">Direct WhatsApp Chat</a><p class="wss-foot">You can send a message now or complete the details first.</p></section>';
   document.body.appendChild(modal);
   const close=()=>{modal.hidden=true;};
   modal.querySelector('.wss-close').addEventListener('click',close);
   modal.addEventListener('click',event=>{if(event.target===modal)close();});
   modal.querySelector('.wss-fields').addEventListener('submit',event=>{
    event.preventDefault();const form=event.currentTarget;
    const values={school:form.elements.school.value.trim(),contact:form.elements.contact.value.trim(),location:form.elements.location.value.trim(),staff:form.elements.staff.value.trim()};
    window.open(setupUrl(values),'_blank','noopener,noreferrer');close();
   });
   modal.querySelector('.wss-fields').addEventListener('input',updateDirectLink);
   document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!modal.hidden)close();});
  }
  function updateDirectLink(){
   const form=modal.querySelector('.wss-fields'),values={school:form.elements.school.value.trim(),contact:form.elements.contact.value.trim(),location:form.elements.location.value.trim(),staff:form.elements.staff.value.trim()};
   modal.querySelector('.wss-direct').href=setupUrl(values);
  }
  updateDirectLink();modal.hidden=false;
  modal.querySelector('input[name="school"]').focus({preventScroll:true});
 }

 const yieldToBrowser=()=>new Promise(resolve=>{const next=()=>setTimeout(resolve,0);if(typeof requestAnimationFrame==='function')requestAnimationFrame(next);else next();});
 window.WelfareDemo={school,teachers,contributions,payouts,announcements,client,months,activeCon,activePay,summary,yieldToBrowser,openSchoolSetupModal,setTeacher(index){activeTeacherIndex=Math.max(0,Math.min(teachers.length-1,Number(index)||0));}};
})();
