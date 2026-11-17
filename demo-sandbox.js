/* Welfare DEMO sandbox: entirely in-memory; never calls Supabase or persists demo records. */
(function(){
 'use strict';
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
 const teachers=names.map((n,i)=>({id:'demo-teacher-'+(i+1),teacher_id:'demo-teacher-'+(i+1),name:n[0],staff_id:n[1],rank:n[2],class_name:n[3],phone:n[4],email:'teacher'+(i+1)+'@demo.welfare.local',is_active:true,status:'active',registration_date:'2025-04-01',joined_at:'2025-04-01',created_at:'2025-04-01T09:00:00.000Z',passport:null,school_id:school.id}));
 const months=[];for(let i=0;i<12;i++){const d=new Date(2025,3+i,1);months.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'));}
 const gaps=[[2,7],[4],[1,5,10],[3,8],[0,6],[2,9],[1,4,7,11],[5,10]];
 let contributions=[];
 teachers.forEach((teacher,ti)=>months.forEach((month,mi)=>{
  if(gaps[ti].includes(mi))return;
  contributions.push({id:'demo-con-'+(ti+1)+'-'+(mi+1),teacher_id:teacher.id,school_id:school.id,amount:20,date:month+'-15',contribution_date:month+'-15',payment_date:month+'-15',reference:'DEMO-C'+String(ti+1).padStart(2,'0')+'-'+String(mi+1).padStart(2,'0'),status:'active',is_reversed:false,created_at:month+'-15T10:00:00.000Z'});
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
 let settings=[{school_id:school.id,key:'standard_dues',value:'20'},{school_id:school.id,key:'school_announcement',value:announcements[0].message},{school_id:school.id,key:'headteacher_name',value:'Mrs. Akosua Mensah'},{school_id:school.id,key:'financial_secretary_name',value:'Mr. Kwame Asare'}];
 let accounts=[],activeTeacherIndex=0;
 const user={id:'demo-admin-user',email:'admin@demo.welfare.local',user_metadata:{full_name:'Demo Administrator',name:'Demo Administrator'},app_metadata:{account_type:'school_admin'}};
 const clone=x=>JSON.parse(JSON.stringify(x));
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
 function activeCon(){const rev=new Set(reversals.filter(x=>x.transaction_type==='contribution').map(x=>String(x.transaction_id)));return contributions.filter(x=>!rev.has(String(x.id))&&!x.is_reversed&&String(x.status||'').toLowerCase()!=='reversed');}
 function activePay(){const rev=new Set(reversals.filter(x=>x.transaction_type==='payout').map(x=>String(x.transaction_id)));return payouts.filter(x=>!rev.has(String(x.id)));}
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
  functions:{async invoke(name,{body}={}){if(name==='issue-statement-verification')return {data:{success:true,school_code:'DEMO',document_id:body?.document_id||'DEMO-STATEMENT',verification_url:location.origin+location.pathname.replace(/[^/]*$/,'')+'verify.html?c=DEMO&d='+(body?.document_id||'DEMO-STATEMENT')},error:null};return {data:{ok:true,success:true,administrators:[]},error:null};}}
 };
 window.WelfareDemo={school,teachers,contributions,payouts,announcements,client,months,activeCon,activePay,setTeacher(index){activeTeacherIndex=Math.max(0,Math.min(teachers.length-1,Number(index)||0));}};
})();
