/* School-scoped welfare workflows. Uses the authenticated Supabase client created by school-portal.html. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>Number(n||0).toLocaleString('en-GH',{minimumFractionDigits:2,maximumFractionDigits:2});
const today=()=>new Date().toISOString().slice(0,10);
function addUI(){
 const d=document.createElement('section');d.id='workflows';d.innerHTML=`
 <div class="panel"><h3>Teacher register</h3><form id="wfTeacher" class="grid">
 <div><label>Staff ID</label><input id="wfTid" required maxlength="80"></div><div><label>Full name</label><input id="wfName" required maxlength="160"></div>
 <div><label>Phone</label><input id="wfPhone" maxlength="40"></div><div><label>Rank</label><input id="wfRank" maxlength="100"></div>
 <div><label>Class / responsibility</label><input id="wfClass" maxlength="100"></div><div style="align-self:end"><button>Register teacher</button></div></form><p id="wfTeacherMsg" class="muted"></p></div>
 <div class="grid"><div class="panel"><h3>Record contribution</h3><form id="wfContribution"><label>Teacher</label><select id="wfConTeacher" required style="width:100%;padding:12px"></select><label>Amount (GHS)</label><input id="wfConAmount" type="number" min=".01" step=".01" required><label>Date</label><input id="wfConDate" type="date" required><label>Reference</label><input id="wfConRef" maxlength="180"><p id="wfConMsg" class="muted"></p><button>Save contribution</button></form></div>
 <div class="panel"><h3>Record welfare payout</h3><form id="wfPayout"><label>Teacher</label><select id="wfPayTeacher" required style="width:100%;padding:12px"></select><label>Amount (GHS)</label><input id="wfPayAmount" type="number" min=".01" step=".01" required><label>Date</label><input id="wfPayDate" type="date" required><label>Reason</label><input id="wfPayReason" maxlength="180" required><label>Reference</label><input id="wfPayRef" maxlength="180"><p id="wfPayMsg" class="muted"></p><button>Save payout</button></form></div></div>
 <div class="grid"><div class="panel"><h3>Contribution ledger</h3><div style="overflow:auto"><table><thead><tr><th>Date</th><th>Teacher</th><th>Amount (GHS)</th><th>Reference</th></tr></thead><tbody id="wfConRows"></tbody></table></div></div>
 <div class="panel"><h3>Welfare payouts</h3><div style="overflow:auto"><table><thead><tr><th>Date</th><th>Teacher</th><th>Amount (GHS)</th><th>Reason</th></tr></thead><tbody id="wfPayRows"></tbody></table></div></div></div>`;
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
 const options='<option value="">Choose teacher</option>'+teachers.map(t=>'<option value="'+esc(t.id)+'">'+esc(t.name)+' ('+esc(t.id)+')</option>').join('');
 $('wfConTeacher').innerHTML=options;$('wfPayTeacher').innerHTML=options;
 $('wfConRows').innerHTML=cons.length?cons.map(x=>'<tr><td>'+esc(x.date)+'</td><td>'+esc(x.teacher_id)+'</td><td>'+money(x.amount)+'</td><td>'+esc(x.reference||'—')+'</td></tr>').join(''):'<tr><td colspan="4">No contributions recorded.</td></tr>';
 $('wfPayRows').innerHTML=pays.length?pays.map(x=>'<tr><td>'+esc(x.date)+'</td><td>'+esc(x.teacher_id)+'</td><td>'+money(x.amount)+'</td><td>'+esc(x.reason||x.reference||'—')+'</td></tr>').join(''):'<tr><td colspan="4">No payouts recorded.</td></tr>';
 $('teacherCount').textContent=teachers.length;
 $('contributionTotal').textContent=money(cons.reduce((a,x)=>a+Number(x.amount||0),0));
 $('payoutTotal').textContent=money(pays.reduce((a,x)=>a+Number(x.amount||0),0));
 $('netTotal').textContent=money(cons.reduce((a,x)=>a+Number(x.amount||0),0)-pays.reduce((a,x)=>a+Number(x.amount||0),0));
 const ctx=school;
 $('wfTeacher').onsubmit=async e=>{e.preventDefault();const row={id:$('wfTid').value.trim(),name:$('wfName').value.trim(),phone:$('wfPhone').value.trim()||null,rank:$('wfRank').value.trim()||null,class_name:$('wfClass').value.trim()||null,school_id:ctx.id};msg('wfTeacherMsg','Saving…');const {error}=await client.from('teachers').insert(row);if(error){msg('wfTeacherMsg','Not saved. Check the staff ID and school permissions.',true);return;}const auditOk=await audit(client,ctx,'Register teacher',row.name,row.id);$('wfTeacher').reset();await refresh();msg('wfTeacherMsg',auditOk?'Teacher registered.':'Teacher registered, but the audit entry failed. Notify the platform administrator.',!auditOk);};
 $('wfContribution').onsubmit=async e=>{e.preventDefault();const teacher_id=$('wfConTeacher').value,amount=Number($('wfConAmount').value);if(!teacher_id||amount<=0)return msg('wfConMsg','Choose a teacher and a positive amount.',true);const row={teacher_id,amount,date:$('wfConDate').value,reference:$('wfConRef').value.trim()||null,school_id:ctx.id};msg('wfConMsg','Saving…');const {error}=await client.from('contributions').insert(row);if(error)return msg('wfConMsg','Not saved. Check school permissions.',true);const auditOk=await audit(client,ctx,'Record contribution','GHS '+amount.toFixed(2),teacher_id);$('wfContribution').reset();$('wfConDate').value=today();await refresh();msg('wfConMsg',auditOk?'Contribution recorded.':'Contribution saved, but the audit entry failed. Notify the platform administrator.',!auditOk);};
 $('wfPayout').onsubmit=async e=>{e.preventDefault();const teacher_id=$('wfPayTeacher').value,amount=Number($('wfPayAmount').value);if(!teacher_id||amount<=0)return msg('wfPayMsg','Choose a teacher and a positive amount.',true);if(!confirm('Confirm welfare payout of GHS '+amount.toFixed(2)+'?'))return;const row={teacher_id,amount,date:$('wfPayDate').value,reason:$('wfPayReason').value.trim(),reference:$('wfPayRef').value.trim()||null,school_id:ctx.id};msg('wfPayMsg','Saving…');const {error}=await client.from('payouts').insert(row);if(error)return msg('wfPayMsg','Not saved. Check school permissions.',true);const auditOk=await audit(client,ctx,'Record payout','GHS '+amount.toFixed(2)+' — '+row.reason,teacher_id);$('wfPayout').reset();$('wfPayDate').value=today();await refresh();msg('wfPayMsg',auditOk?'Payout recorded.':'Payout saved, but the audit entry failed. Notify the platform administrator.',!auditOk);};
};
})();