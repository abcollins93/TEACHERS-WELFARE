/* School-scoped welfare workflows. Uses the authenticated Supabase client created by school-portal.html. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>Number(n||0).toLocaleString('en-GH',{minimumFractionDigits:2,maximumFractionDigits:2});
const today=()=>new Date().toISOString().slice(0,10);
function addUI(){
 const d=document.createElement('section');d.id='workflows';d.innerHTML=`
 <div class="panel"><h3>Teacher register</h3><p class="muted">Register and update staff details. Historical finance records are not deleted when a staff profile is changed.</p><form id="wfTeacher" class="grid">
 <div><label>Staff ID</label><input id="wfTid" required maxlength="80"></div><div><label>Full name</label><input id="wfName" required maxlength="160"></div>
 <div><label>Phone</label><input id="wfPhone" maxlength="40"></div><div><label>Rank</label><input id="wfRank" maxlength="100"></div>
 <div><label>Class / responsibility</label><input id="wfClass" maxlength="100"></div><div style="align-self:end;display:flex;gap:8px;flex-wrap:wrap"><button id="wfTeacherSave">Register teacher</button><button id="wfTeacherCancel" class="secondary" type="button">Cancel edit</button></div></form><p id="wfTeacherMsg" class="muted"></p><div style="overflow:auto"><table><thead><tr><th>Staff ID</th><th>Name</th><th>Phone</th><th>Rank</th><th>Class</th><th>Profile actions</th></tr></thead><tbody id="wfManageTeacherRows"></tbody></table></div></div>
 <div class="grid"><div class="panel"><h3>Record contribution</h3><form id="wfContribution"><label>Teacher</label><select id="wfConTeacher" required style="width:100%;padding:12px"></select><label>Amount (GHS)</label><input id="wfConAmount" type="number" min=".01" step=".01" required><label>Date</label><input id="wfConDate" type="date" required><label>Reference</label><input id="wfConRef" maxlength="180"><p id="wfConMsg" class="muted"></p><button>Save contribution</button></form></div>
 <div class="panel"><h3>Record welfare payout</h3><form id="wfPayout"><label>Teacher</label><select id="wfPayTeacher" required style="width:100%;padding:12px"></select><label>Amount (GHS)</label><input id="wfPayAmount" type="number" min=".01" step=".01" required><label>Date</label><input id="wfPayDate" type="date" required><label>Reason</label><input id="wfPayReason" maxlength="180" required><label>Reference</label><input id="wfPayRef" maxlength="180"><p id="wfPayMsg" class="muted"></p><button>Save payout</button></form></div></div>
 <div class="grid"><div class="panel"><h3>Member PDF statement</h3><p class="muted">Download an individual teacher statement showing contributions, welfare payouts and net position.</p><label for="wfStatementTeacher">Teacher</label><select id="wfStatementTeacher" style="width:100%;padding:12px"></select><button id="wfStatementPdf" type="button" style="margin-top:10px"><i class="fa-solid fa-file-pdf"></i> Download member statement</button><p id="wfStatementMsg" class="muted"></p></div><div class="panel"><h3>Contribution ledger</h3><div style="overflow:auto"><table><thead><tr><th>Date</th><th>Teacher</th><th>Amount (GHS)</th><th>Reference</th></tr></thead><tbody id="wfConRows"></tbody></table></div></div>
 <div class="panel"><h3>Welfare payouts</h3><div style="overflow:auto"><table><thead><tr><th>Date</th><th>Teacher</th><th>Amount (GHS)</th><th>Reason</th></tr></thead><tbody id="wfPayRows"></tbody></table></div></div></div>
 <div class="panel"><h3>School settings · Monthly dues</h3><p class="muted">Set the standard monthly contribution for this school. This setting is scoped to the current school account.</p><form id="wfDuesForm" class="grid"><div><label for="wfMonthlyDues">Standard monthly dues (GHS)</label><input id="wfMonthlyDues" type="number" min="0" step=".01" required></div><div style="align-self:end"><button>Save monthly dues</button></div></form><p id="wfDuesMsg" class="muted"></p></div>
 <div class="panel"><h3>Reports and exports</h3><div class="grid"><div><label for="wfMonth">Reporting month</label><input id="wfMonth" type="month"></div><div style="align-self:end;display:flex;gap:8px;flex-wrap:wrap"><button id="wfMonthlyPdf" type="button">Monthly PDF summary</button><button id="wfExportCsv" type="button" class="secondary">Export ledgers CSV</button></div></div><p id="wfReportMsg" class="muted">Reports include records visible to this school account only.</p></div>
 <div class="panel"><h3>Audit history</h3><div class="grid"><div><label for="wfAuditSearch">Search audit records</label><input id="wfAuditSearch" placeholder="Search action, actor, details…"></div><div><label for="wfAuditCategory">Category</label><select id="wfAuditCategory"><option value="">All categories</option><option>Welfare portal</option><option>Contribution</option><option>Payout</option><option>Teacher</option></select></div></div><p id="wfAuditMsg" class="muted">Loading audit history…</p><div style="overflow:auto"><table><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Details</th><th>Status</th></tr></thead><tbody id="wfAuditRows"><tr><td colspan="5">Loading…</td></tr></tbody></table></div></div>`;
 const dash=$('dashboard');if(dash)dash.appendChild(d);
 ['wfConDate','wfPayDate'].forEach(id=>$(id).value=today());
}
function msg(id,s,bad){$(id).textContent=s;$(id).className=bad?'error':'muted';}
async function audit(client,ctx,action,details,teacherId){
 const {data:{user}}=await client.auth.getUser();
 const {error}=await client.from('audit_logs').insert({id:crypto.randomUUID(),actor_name:user?.email||'School administrator',category:'Welfare portal',action,details,target_teacher_id:teacherId||null,status:'success',time_string:new Date().toLocaleString(),school_id:ctx.id});
 if(error){console.warn('Audit log insert failed',error.message);return false;}
 return true;
}
window.initSchoolWorkflows=async function(client,school,refresh){
 if(!$('workflows'))addUI();
 const [tr,cr,pr]=await Promise.all([
  client.from('teachers').select('id,name,phone,rank,class_name').eq('school_id',school.id).order('name'),
  client.from('contributions').select('id,teacher_id,amount,date,reference').eq('school_id',school.id).order('date',{ascending:false}),
  client.from('payouts').select('id,teacher_id,amount,date,reason,reference').eq('school_id',school.id).order('date',{ascending:false})
 ]);
 if(tr.error||cr.error||pr.error){msg('wfTeacherMsg','Records could not be loaded. Check school-admin database permissions.',true);return;}
 const teachers=tr.data||[], cons=cr.data||[], pays=pr.data||[];
 $('teacherRows').innerHTML=teachers.length?teachers.map(t=>'<tr><td>'+esc(t.id)+'</td><td>'+esc(t.name)+'</td><td>'+esc(t.phone||'—')+'</td><td>'+esc(t.rank||'—')+'</td><td>'+esc(t.class_name||'—')+'</td></tr>').join(''):'<tr><td colspan="5">No teachers yet.</td></tr>';
 $('wfManageTeacherRows').innerHTML=teachers.length?teachers.map(t=>'<tr><td>'+esc(t.id)+'</td><td>'+esc(t.name)+'</td><td>'+esc(t.phone||'—')+'</td><td>'+esc(t.rank||'—')+'</td><td>'+esc(t.class_name||'—')+'</td><td><button type="button" class="secondary" data-wf-edit="'+esc(t.id)+'">Edit</button></td></tr>').join(''):'<tr><td colspan="6">No teachers registered.</td></tr>';

 const options='<option value="">Choose teacher</option>'+teachers.map(t=>'<option value="'+esc(t.id)+'">'+esc(t.name)+' ('+esc(t.id)+')</option>').join('');
 $('wfConTeacher').innerHTML=options;$('wfPayTeacher').innerHTML=options;$('wfStatementTeacher').innerHTML=options;
 $('wfConRows').innerHTML=cons.length?cons.map(x=>'<tr><td>'+esc(x.date)+'</td><td>'+esc(x.teacher_id)+'</td><td>'+money(x.amount)+'</td><td>'+esc(x.reference||'—')+'</td></tr>').join(''):'<tr><td colspan="4">No contributions recorded.</td></tr>';
 $('wfPayRows').innerHTML=pays.length?pays.map(x=>'<tr><td>'+esc(x.date)+'</td><td>'+esc(x.teacher_id)+'</td><td>'+money(x.amount)+'</td><td>'+esc(x.reason||x.reference||'—')+'</td></tr>').join(''):'<tr><td colspan="4">No payouts recorded.</td></tr>';
 $('teacherCount').textContent=teachers.length;
 $('contributionTotal').textContent=money(cons.reduce((a,x)=>a+Number(x.amount||0),0));
 $('payoutTotal').textContent=money(pays.reduce((a,x)=>a+Number(x.amount||0),0));
 $('netTotal').textContent=money(cons.reduce((a,x)=>a+Number(x.amount||0),0)-pays.reduce((a,x)=>a+Number(x.amount||0),0));
 const ctx=school;
 $('wfMonth').value=new Date().toISOString().slice(0,7);
 const {data:duesSetting,error:duesLoadError}=await client.from('system_settings').select('value').eq('school_id',ctx.id).eq('key','standard_dues').maybeSingle();
 if(!duesLoadError && duesSetting) $('wfMonthlyDues').value=Number(duesSetting.value||0);
 $('wfDuesForm').onsubmit=async e=>{e.preventDefault();const value=Number($('wfMonthlyDues').value);if(!Number.isFinite(value)||value<0)return msg('wfDuesMsg','Enter a valid monthly dues amount.',true);msg('wfDuesMsg','Saving…');const {error}=await client.from('system_settings').upsert({school_id:ctx.id,key:'standard_dues',value:String(value)},{onConflict:'school_id,key'});if(error){msg('wfDuesMsg','Monthly dues could not be saved. The settings table may need a school-scoped unique key/policy; no schema changes were made.',true);return;}const auditOk=await audit(client,ctx,'Update monthly dues','GHS '+value.toFixed(2));msg('wfDuesMsg',auditOk?'Standard monthly dues updated.':'Dues saved, but the audit entry failed.',!auditOk);};
 let auditRows=[];
 async function loadAudit(){
   const {data,error}=await client.from('audit_logs').select('time_string,actor_name,action,details,status,category').eq('school_id',ctx.id).order('created_at',{ascending:false}).limit(300);
   if(error){msg('wfAuditMsg','Audit history is unavailable under the current school permissions.',true);$('wfAuditRows').innerHTML='<tr><td colspan="5">No audit records could be loaded.</td></tr>';return;}
   auditRows=data||[];renderAudit();
 }
 function renderAudit(){
   const q=($('wfAuditSearch').value||'').toLowerCase(),cat=$('wfAuditCategory').value;
   const rows=auditRows.filter(x=>(!cat||x.category===cat)&&[x.time_string,x.actor_name,x.action,x.details,x.status,x.category].some(v=>String(v||'').toLowerCase().includes(q)));
   $('wfAuditRows').innerHTML=rows.length?rows.map(x=>'<tr><td>'+esc(x.time_string||'—')+'</td><td>'+esc(x.actor_name||'—')+'</td><td>'+esc(x.action||'—')+'</td><td>'+esc(x.details||'—')+'</td><td>'+esc(x.status||'—')+'</td></tr>').join(''):'<tr><td colspan="5">No matching audit entries.</td></tr>';
   msg('wfAuditMsg',rows.length+' audit entr'+(rows.length===1?'y':'ies')+' shown.');
 }
 $('wfAuditSearch').addEventListener('input',renderAudit);$('wfAuditCategory').addEventListener('change',renderAudit);
 $('wfExportCsv').onclick=()=>{
   const rows=[['Record type','Date','Staff ID','Amount GHS','Reference / reason'],...cons.map(x=>['Contribution',x.date,x.teacher_id,x.amount,x.reference||'']),...pays.map(x=>['Welfare payout',x.date,x.teacher_id,x.amount,x.reason||x.reference||''])];
   const csv=rows.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\\r\\n');
   const blob=new Blob(['\\ufeff'+csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download=(ctx.school_code||'school')+'-welfare-ledgers.csv';a.click();URL.revokeObjectURL(url);msg('wfReportMsg','CSV export prepared for download.');
 };
 $('wfMonthlyPdf').onclick=()=>{
   const month=$('wfMonth').value;if(!month)return msg('wfReportMsg','Choose a reporting month first.',true);
   if(!window.html2pdf)return msg('wfReportMsg','PDF service is unavailable.',true);
   const mc=cons.filter(x=>String(x.date||'').startsWith(month)),mp=pays.filter(x=>String(x.date||'').startsWith(month));
   const sumC=mc.reduce((a,x)=>a+Number(x.amount||0),0),sumP=mp.reduce((a,x)=>a+Number(x.amount||0),0);
   const report=document.createElement('div');report.style.cssText='padding:24px;background:white;color:#182235;font-family:Arial,sans-serif';
   report.innerHTML='<h1>'+esc(ctx.name)+'</h1><h2>Monthly Welfare Fund Summary</h2><p>School code: '+esc(ctx.school_code)+' | Period: '+esc(month)+'</p><hr><p>Teachers registered: '+teachers.length+'</p><p>Contributions: GHS '+money(sumC)+' ('+mc.length+' entries)</p><p>Welfare payouts: GHS '+money(sumP)+' ('+mp.length+' entries)</p><h3>Contributions</h3><table style="width:100%;border-collapse:collapse"><tr><th>Date</th><th>Staff ID</th><th>Amount</th><th>Reference</th></tr>'+mc.map(x=>'<tr><td>'+esc(x.date)+'</td><td>'+esc(x.teacher_id)+'</td><td>'+money(x.amount)+'</td><td>'+esc(x.reference||'—')+'</td></tr>').join('')+'</table><h3>Payouts</h3><table style="width:100%;border-collapse:collapse"><tr><th>Date</th><th>Staff ID</th><th>Amount</th><th>Reason</th></tr>'+mp.map(x=>'<tr><td>'+esc(x.date)+'</td><td>'+esc(x.teacher_id)+'</td><td>'+money(x.amount)+'</td><td>'+esc(x.reason||x.reference||'—')+'</td></tr>').join('')+'</table>';
   window.html2pdf().set({margin:10,filename:(ctx.school_code||'school')+'-'+month+'-monthly-welfare.pdf',html2canvas:{scale:2},jsPDF:{unit:'mm',format:'a4',orientation:'landscape'}}).from(report).save();msg('wfReportMsg','Monthly PDF report is being prepared.');
 };
 loadAudit();
 $('wfStatementPdf').onclick=()=>{
   const tid=$('wfStatementTeacher').value;
   const teacher=teachers.find(t=>String(t.id)===String(tid));
   if(!teacher){msg('wfStatementMsg','Choose a teacher first.',true);return;}
   if(!window.html2pdf){msg('wfStatementMsg','PDF service is unavailable. Check your internet connection.',true);return;}
   const tc=cons.filter(x=>String(x.teacher_id)===String(tid)),tp=pays.filter(x=>String(x.teacher_id)===String(tid));
   const totalC=tc.reduce((a,x)=>a+Number(x.amount||0),0),totalP=tp.reduce((a,x)=>a+Number(x.amount||0),0);
   const safe=s=>esc(s);
   const report=document.createElement('div');report.style.cssText='padding:24px;color:#182235;background:white;font-family:Arial,sans-serif';
   report.innerHTML='<h1 style="color:#0b1d3a">'+safe(school.name)+'</h1><h2>Individual Welfare Statement</h2><p>School code: '+safe(school.school_code)+' | Generated: '+new Date().toLocaleString()+'</p><hr><p><b>Teacher:</b> '+safe(teacher.name)+'</p><p><b>Staff ID:</b> '+safe(teacher.id)+'</p><p><b>Rank:</b> '+safe(teacher.rank||'—')+' | <b>Class:</b> '+safe(teacher.class_name||'—')+'</p><h3>Summary</h3><p>Total contributions: GHS '+money(totalC)+'</p><p>Total welfare payouts: GHS '+money(totalP)+'</p><p><b>Net member position: GHS '+money(totalC-totalP)+'</b></p><h3>Contribution history</h3><table style="width:100%;border-collapse:collapse"><thead><tr><th>Date</th><th>Amount (GHS)</th><th>Reference</th></tr></thead><tbody>'+tc.map(x=>'<tr><td>'+safe(x.date)+'</td><td>'+money(x.amount)+'</td><td>'+safe(x.reference||'—')+'</td></tr>').join('')+'</tbody></table><h3>Welfare payout history</h3><table style="width:100%;border-collapse:collapse"><thead><tr><th>Date</th><th>Amount (GHS)</th><th>Reason</th></tr></thead><tbody>'+tp.map(x=>'<tr><td>'+safe(x.date)+'</td><td>'+money(x.amount)+'</td><td>'+safe(x.reason||x.reference||'—')+'</td></tr>').join('')+'</tbody></table>';
   window.html2pdf().set({margin:10,filename:(String(teacher.id).replace(/[^a-z0-9_-]/gi,'_')||'member')+'-welfare-statement.pdf',image:{type:'jpeg',quality:.96},html2canvas:{scale:2,useCORS:true},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}}).from(report).save();
   msg('wfStatementMsg','Your statement is being prepared for download.');
 };
 let editingTeacherId=null;
 function resetTeacherForm(){editingTeacherId=null;$('wfTeacher').reset();$('wfTid').disabled=false;$('wfTeacherSave').textContent='Register teacher';msg('wfTeacherMsg','');}
 $('wfTeacherCancel').onclick=resetTeacherForm;
 $('wfManageTeacherRows').addEventListener('click',e=>{const b=e.target.closest('[data-wf-edit]');if(!b)return;const t=teachers.find(x=>String(x.id)===b.dataset.wfEdit);if(!t)return;editingTeacherId=t.id;$('wfTid').value=t.id;$('wfTid').disabled=true;$('wfName').value=t.name||'';$('wfPhone').value=t.phone||'';$('wfRank').value=t.rank||'';$('wfClass').value=t.class_name||'';$('wfTeacherSave').textContent='Save changes';msg('wfTeacherMsg','Editing '+t.name+'.');$('wfTid').scrollIntoView({behavior:'smooth',block:'center'});});
 $('wfTeacher').onsubmit=async e=>{e.preventDefault();const row={id:$('wfTid').value.trim(),name:$('wfName').value.trim(),phone:$('wfPhone').value.trim()||null,rank:$('wfRank').value.trim()||null,class_name:$('wfClass').value.trim()||null,school_id:ctx.id};msg('wfTeacherMsg','Saving…');
   const result=editingTeacherId?await client.from('teachers').update({name:row.name,phone:row.phone,rank:row.rank,class_name:row.class_name}).eq('id',editingTeacherId).eq('school_id',ctx.id):await client.from('teachers').insert(row);
   if(result.error){msg('wfTeacherMsg',editingTeacherId?'Changes were not saved. Check school permissions.':'Not saved. Check the staff ID and school permissions.',true);return;}
   const auditOk=await audit(client,ctx,editingTeacherId?'Update teacher profile':'Register teacher',row.name,row.id);resetTeacherForm();await refresh();msg('wfTeacherMsg',auditOk?(editingTeacherId?'Teacher profile updated.':'Teacher registered.'):'Saved, but the audit entry failed. Notify the platform administrator.',!auditOk);
 };
 $('wfContribution').onsubmit=async e=>{e.preventDefault();const teacher_id=$('wfConTeacher').value,amount=Number($('wfConAmount').value);if(!teacher_id||amount<=0)return msg('wfConMsg','Choose a teacher and a positive amount.',true);const row={teacher_id,amount,date:$('wfConDate').value,reference:$('wfConRef').value.trim()||null,school_id:ctx.id};msg('wfConMsg','Saving…');const {error}=await client.from('contributions').insert(row);if(error)return msg('wfConMsg','Not saved. Check school permissions.',true);const auditOk=await audit(client,ctx,'Record contribution','GHS '+amount.toFixed(2),teacher_id);$('wfContribution').reset();$('wfConDate').value=today();await refresh();msg('wfConMsg',auditOk?'Contribution recorded.':'Contribution saved, but the audit entry failed. Notify the platform administrator.',!auditOk);};
 $('wfPayout').onsubmit=async e=>{e.preventDefault();const teacher_id=$('wfPayTeacher').value,amount=Number($('wfPayAmount').value);if(!teacher_id||amount<=0)return msg('wfPayMsg','Choose a teacher and a positive amount.',true);if(!confirm('Confirm welfare payout of GHS '+amount.toFixed(2)+'?'))return;const row={teacher_id,amount,date:$('wfPayDate').value,reason:$('wfPayReason').value.trim(),reference:$('wfPayRef').value.trim()||null,school_id:ctx.id};msg('wfPayMsg','Saving…');const {error}=await client.from('payouts').insert(row);if(error)return msg('wfPayMsg','Not saved. Check school permissions.',true);const auditOk=await audit(client,ctx,'Record payout','GHS '+amount.toFixed(2)+' — '+row.reason,teacher_id);$('wfPayout').reset();$('wfPayDate').value=today();await refresh();msg('wfPayMsg',auditOk?'Payout recorded.':'Payout saved, but the audit entry failed. Notify the platform administrator.',!auditOk);};
};
})();