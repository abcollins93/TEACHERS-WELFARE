/* School-scoped welfare workflows. Uses the authenticated Supabase client created by school-portal.html. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>Number(n||0).toLocaleString('en-GH',{minimumFractionDigits:2,maximumFractionDigits:2});
const today=()=>new Date().toISOString().slice(0,10);
const RANK_OPTIONS=[
 'Headmaster','Assistant Headmaster','Headmistress','Assistant Headmistress',
 'Member','Pupil Teacher','Superintendent II','Superintendent I',
 'Senior Superintendent II','Senior Superintendent I','Principal Superintendent',
 'Assistant Director II','Assistant Director I','Deputy Director',
 'Director II','Director I','Deputy Director General','Director General'
];
const rankOptionsMarkup=()=>'<option value="">Select Rank / Grade</option>'+RANK_OPTIONS.map(rank=>'<option value="'+esc(rank)+'">'+esc(rank)+'</option>').join('');
const csvCell=v=>{let s=String(v??'');if(/^[\s]*[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};

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
#wfTeacherRegisterPanel button{border:1px solid transparent;border-radius:10px;min-height:42px;padding:10px 15px;background:#07122b;color:#fff;font-weight:800}
#wfTeacherRegisterPanel button.secondary{background:#f1f5f9;color:#1e293b;border-color:#e2e8f0}
#wfTeacherRegisterPanel table{width:100%;min-width:850px;border-collapse:collapse}
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
#wfContributionPanel h3:before{content:"\\f4b9";background:#ecfdf5;color:#059669}
#wfPayoutPanel h3:before,#wfPayoutLedgerPanel h3:before{content:"\\f4b9";background:#fff1f2;color:#e11d48}
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
#workflows #wfContributionPanel h3:before{content:"\\f4b9";background:#ecfdf5;color:#059669}
#workflows #wfPayoutPanel h3:before,#workflows #wfResetDataPanel h3:before{content:"\\f071";background:#fff1f2;color:#e11d48}
#workflows #wfLedgerPanel h3:before{content:"\\f03a"}
#workflows #wfStatementPanel h3:before,#workflows #wfReportsPanel h3:before{content:"\\f15c"}
#workflows #wfAuditPanel h3:before{content:"\\f1da"}
#workflows input,#workflows select,#workflows textarea{width:100%;min-height:44px;padding:11px 13px;border:1px solid #dbe2ec;border-radius:11px;background:#fff;color:#0f172a;box-shadow:none;transition:border-color .18s,box-shadow .18s,background .18s}
#workflows input:focus,#workflows select:focus,#workflows textarea:focus{outline:0;border-color:#818cf8;box-shadow:0 0 0 3px rgba(99,102,241,.13)}
#workflows button{border:1px solid transparent;border-radius:10px;min-height:42px;padding:10px 15px;background:#07122b;color:#fff;font-weight:800;box-shadow:0 5px 12px rgba(7,18,43,.12);transition:transform .18s,filter .18s,box-shadow .18s}
#workflows button:hover:not(:disabled){filter:brightness(1.06);transform:translateY(-1px);box-shadow:0 8px 18px rgba(7,18,43,.15)}
#workflows button.secondary{background:#f1f5f9;color:#1e293b;border-color:#e2e8f0;box-shadow:none}
#workflows #wfBroadcastForm button[type=submit]{background:linear-gradient(120deg,#7c3aed,#4f46e5)}
#workflows #wfInviteAdminForm button[type=submit],#workflows #wfTeacherSave,#workflows #wfContribution button[type=submit],#workflows #wfDuesForm button[type=submit]{background:#059669}
#workflows #wfPayout button[type=submit],#workflows #wfResetDataForm button[type=submit]{background:linear-gradient(120deg,#e11d48,#be123c)}
#workflows #wfAdminAccessPanel button[type=submit],#workflows #wfSettingsPanel button[type=submit]{background:linear-gradient(120deg,#123a76,#07122b)}
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

#wfPayoutPanel{grid-column:1/-1!important}#wfPayoutPanel .wf-payout-entry{margin-top:18px;padding-top:14px;border-top:1px solid #e8edf4}#wfPayoutPanel .wf-payout-entry summary{cursor:pointer;color:#334155;font-weight:850}#wfPayoutPanel .wf-payout-entry form{max-width:720px;padding-top:10px}#wfPayoutPanel .wf-payout-entry button{margin-top:8px}.dark #wfPayoutPanel .wf-payout-entry{border-color:#26364d}.dark #wfPayoutPanel .wf-payout-entry summary{color:#e6edf7}

#wfReportsPanel.wf-reports-view{padding:clamp(18px,2.5vw,30px)!important;border:1px solid #e7ecf3!important;border-radius:20px!important;background:#f8fafc!important;box-shadow:0 14px 38px rgba(15,35,65,.07)!important;color:#17243a!important}#wfReportsPanel .wf-reports-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:23px}#wfReportsPanel .wf-reports-heading h2{display:block!important;margin:0 0 7px!important;color:#14233d!important;font-size:clamp(1.45rem,2.5vw,1.9rem)!important;font-weight:900!important;letter-spacing:-.035em!important}#wfReportsPanel .wf-reports-heading h2:before{display:none!important}#wfReportsPanel .wf-reports-heading p{margin:0;color:#718096!important;line-height:1.65;font-size:.92rem}#wfReportsPanel .wf-reports-admin-status{display:inline-flex;align-items:center;gap:8px;padding:9px 12px;border-radius:999px;background:#ecfdf5;color:#047857;border:1px solid #bbf7d0;font-size:.75rem;font-weight:850;white-space:nowrap}#wfReportsPanel .wf-report-cards{display:grid;grid-template-columns:1fr;gap:17px}#wfReportsPanel .wf-report-card{display:flex;align-items:flex-start;gap:17px;padding:clamp(17px,2vw,23px);background:#fff;border:1px solid #e7ecf3;border-radius:17px;box-shadow:0 8px 24px rgba(15,35,65,.055);min-width:0;transition:transform .18s ease,box-shadow .18s ease}#wfReportsPanel .wf-report-card:hover{transform:none;box-shadow:0 13px 30px rgba(15,35,65,.09)}#wfReportsPanel .wf-month-year-picker{position:relative;z-index:2;transform:none!important;overflow:visible!important}#wfReportsPanel .wf-month-year-picker select{display:block!important;position:relative!important;z-index:3!important;pointer-events:auto!important;appearance:auto!important;-webkit-appearance:menulist!important;touch-action:manipulation;cursor:pointer}#wfReportsPanel .wf-report-card-icon{width:49px;height:49px;flex:0 0 49px;display:grid;place-items:center;border-radius:14px;font-size:1.25rem}#wfReportsPanel .wf-report-icon-blue{background:#eff6ff;color:#2563eb}#wfReportsPanel .wf-report-icon-orange{background:#fff7ed;color:#ea580c}#wfReportsPanel .wf-report-icon-green{background:#ecfdf5;color:#059669}#wfReportsPanel .wf-report-icon-purple{background:#f3e8ff;color:#7e22ce}#wfReportsPanel .wf-report-button-purple{background:linear-gradient(135deg,#9333ea,#6b21a8)!important}#wfReportsPanel .wf-report-card-content{flex:1;min-width:0}#wfReportsPanel .wf-report-card-content h3{display:block!important;margin:1px 0 7px!important;color:#17243a!important;font-size:1.08rem!important;font-weight:900!important;letter-spacing:-.02em!important}#wfReportsPanel .wf-report-card-content h3:before{display:none!important}#wfReportsPanel .wf-report-card-content>p:not(.wf-report-message){margin:0 0 16px;color:#718096!important;font-size:.88rem;line-height:1.65}#wfReportsPanel .wf-report-card-content label{display:block;margin:0 0 7px!important;color:#334155!important;font-size:.8rem;font-weight:800!important}#wfReportsPanel .wf-report-card-content select{width:100%;max-width:560px;min-height:46px;margin:0 0 13px;padding:11px 13px;border:1px solid #dbe2ec;border-radius:11px;background:#fff;color:#17243a;font-weight:600}#wfReportsPanel .wf-report-button{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:46px;padding:11px 17px;border:0!important;border-radius:11px!important;color:#fff!important;font-size:.83rem;font-weight:850!important;box-shadow:0 6px 14px rgba(15,23,42,.13)!important;transition:filter .18s,transform .18s}#wfReportsPanel .wf-report-button:hover{filter:brightness(1.08);transform:translateY(-1px)}#wfReportsPanel .wf-report-button-dark{background:linear-gradient(135deg,#202938,#080d18)!important}#wfReportsPanel .wf-report-button-orange{background:linear-gradient(135deg,#f59e0b,#d97706)!important}#wfReportsPanel .wf-report-button-green{background:linear-gradient(135deg,#10b981,#047857)!important}#wfReportsPanel .wf-report-message{margin:9px 0 0;color:#64748b;font-size:.8rem}#wfReportsPanel .wf-report-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:18px;padding:14px 3px 0;border-top:1px solid #e5eaf1}#wfReportsPanel .wf-report-footer p{margin:0;font-size:.8rem}#wfReportsPanel .wf-report-csv{display:inline-flex;align-items:center;gap:8px;min-height:38px;padding:8px 12px;background:#eef2f7!important;color:#334155!important;border:1px solid #dce3ed!important;border-radius:10px;font-size:.78rem;font-weight:800;box-shadow:none!important}.dark #wfReportsPanel.wf-reports-view{background:#0c1728!important;border-color:#26364d!important;color:#e6edf7!important}.dark #wfReportsPanel .wf-report-card{background:#111f33;border-color:#293a52}.dark #wfReportsPanel .wf-reports-heading h2,.dark #wfReportsPanel .wf-report-card-content h3{color:#edf3fb!important}.dark #wfReportsPanel .wf-reports-heading p,.dark #wfReportsPanel .wf-report-card-content>p:not(.wf-report-message){color:#aab8ca!important}.dark #wfReportsPanel .wf-report-card-content label{color:#d9e3ef!important}.dark #wfReportsPanel .wf-report-card-content select{background:#0b1728;color:#edf3fb;border-color:#35465d}.dark #wfReportsPanel .wf-report-footer{border-color:#293a52}.dark #wfReportsPanel .wf-report-csv{background:#24364e!important;color:#e5edf7!important;border-color:#3a4d66!important}@media(min-width:900px){#wfReportsPanel .wf-report-cards{grid-template-columns:repeat(3,minmax(0,1fr))}#wfReportsPanel .wf-report-card{flex-direction:column;min-height:320px}#wfReportsPanel .wf-report-card-content{width:100%}#wfReportsPanel .wf-report-button{width:100%;margin-top:auto}}@media(max-width:540px){#wfReportsPanel.wf-reports-view{padding:16px!important}#wfReportsPanel .wf-report-card{gap:13px;padding:16px}#wfReportsPanel .wf-report-card-icon{width:43px;height:43px;flex-basis:43px;border-radius:12px}#wfReportsPanel .wf-report-button{width:100%;font-size:.78rem;padding:10px 12px}}
\n#wfPayoutPanel .wf-payout-reference{font-weight:500;color:#64748b}#wfPayoutPanel .wf-payout-beneficiary{font-weight:900;text-transform:uppercase;color:#17243a}#wfPayoutPanel .wf-payout-amount{font-weight:900;color:#dc365f;white-space:nowrap}#wfPayoutPanel .wf-reverse-action{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:10px 16px;border:0!important;border-radius:15px!important;background:#ffe4e8!important;color:#b4234d!important;box-shadow:none!important;font-weight:850!important;white-space:nowrap}#wfPayoutPanel .wf-reverse-action:hover{background:#fecdd6!important;filter:none!important;transform:translateY(-1px)}#wfPayoutPanel .wf-reverse-action i{font-size:1rem}#wfPayoutPanel .wf-reversed-label{color:#be123c;font-size:.78rem}#wfPayoutPanel .wf-payout-table-wrap th{white-space:nowrap}\n</style>
 <section class="wf-admin-hub" id="wfAdminPanel"><div class="panel wf-admin-intro"><div class="wf-admin-intro-top"><div><div class="wf-admin-eyebrow"><i class="fa-solid fa-shield-halved"></i> Secure administration</div><h2>Administration Panel <span class="wf-restricted-badge"><i class="fa-solid fa-lock"></i> Restricted Access</span></h2><p>Manage this school’s members, contributions, monthly dues, welfare payouts and announcements from one organised workspace.</p></div><span class="wf-admin-status"><i class="fa-solid fa-circle-check"></i> Admin mode active</span></div><div class="wf-admin-shortcuts"><span><i class="fa-solid fa-users"></i> Members</span><span><i class="fa-solid fa-coins"></i> Contributions</span><span><i class="fa-solid fa-hand-holding-heart"></i> Welfare</span></div></div>
 <div class="panel" id="wfBroadcastPanel"><h3>School announcement</h3><p class="muted">Publish a school-scoped message for the portal. The message is stored with this school’s settings.</p><form id="wfBroadcastForm"><label for="wfBroadcastText">Announcement message</label><textarea id="wfBroadcastText" maxlength="500" rows="3" style="width:100%;padding:12px;border:1px solid var(--line);border-radius:10px;font:inherit" placeholder="Enter an important welfare fund announcement"></textarea><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button type="submit">Publish announcement</button><button id="wfBroadcastClear" class="secondary" type="button">Clear announcement</button></div></form><p id="wfBroadcastMsg" class="muted" role="status"></p></div>
 <div class="panel" id="wfSettingsPanel"><h3>School settings · Monthly dues</h3><p class="muted">Set the standard monthly contribution for this school. This setting is scoped to the current school account.</p><form id="wfDuesForm" class="grid"><div><label for="wfMonthlyDues">Standard monthly dues (GHS)</label><input id="wfMonthlyDues" type="number" min="0" step=".01" required></div><div style="align-self:end"><button>Save monthly dues</button></div></form><p id="wfDuesMsg" class="muted"></p></div>
 <div class="panel" id="wfAdminAccessPanel"><h3>Administrator access &amp; recovery</h3><p class="muted">Change the password for the administrator currently signed in. New administrator invitations remain managed through the secure platform onboarding process; use <strong>Forgot password?</strong> on the school sign-in page for account recovery.</p><form id="wfChangePasswordForm" class="grid"><div><label for="wfCurrentAdminPassword">Current password</label><input id="wfCurrentAdminPassword" type="password" autocomplete="current-password" required></div><div><label for="wfNewAdminPassword">New password</label><input id="wfNewAdminPassword" type="password" autocomplete="new-password" minlength="10" maxlength="128" required><small class="muted">Use at least 10 characters.</small></div><div><label for="wfConfirmAdminPassword">Confirm new password</label><input id="wfConfirmAdminPassword" type="password" autocomplete="new-password" minlength="10" maxlength="128" required></div><div style="align-self:end"><button type="submit"><i class="fa-solid fa-key"></i> Update my password</button></div></form><p id="wfPasswordMsg" class="muted" role="status" aria-live="polite"></p><div class="wf-data-protection"><strong><i class="fa-solid fa-lock"></i> Account security</strong><p class="muted">Administrator access is linked to this school. Account invitations and deactivation are verified server-side.</p></div></div>
 <div class="panel" id="wfAdminUsersPanel"><h3>Register &amp; manage administrators</h3><p class="muted">Invite a new administrator by email. They must accept the invitation and set their own password. A school can have up to 10 active administrators.</p><form id="wfInviteAdminForm" class="grid"><div><label for="wfInviteAdminName">Full name / title</label><input id="wfInviteAdminName" maxlength="120" required placeholder="e.g. Welfare Secretary"></div><div><label for="wfInviteAdminUsername">Admin username</label><input id="wfInviteAdminUsername" maxlength="40" minlength="3" pattern="[A-Za-z0-9._-]{3,40}" required placeholder="e.g. welfare.secretary"></div><div><label for="wfInviteAdminEmail">Email address</label><input id="wfInviteAdminEmail" type="email" maxlength="254" required placeholder="name@example.com"></div><div style="align-self:end"><button type="submit"><i class="fa-solid fa-user-plus"></i> Send administrator invitation</button></div></form><p id="wfAdminUsersMsg" class="muted" role="status" aria-live="polite"></p><div style="overflow:auto"><table><thead><tr><th>Username</th><th>Name / Title</th><th>Status</th><th>Action</th></tr></thead><tbody id="wfAdminUsersRows"><tr><td colspan="4">Loading administrators…</td></tr></tbody></table></div><p class="muted">Deactivation removes this school’s portal access but does not delete the person’s Supabase identity.</p></div>
 <div class="grid"><div class="panel" id="wfContributionPanel" style="grid-column:1/-1"><header style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:18px"><div><h2 style="margin:0 0 6px;font-size:clamp(1.4rem,3vw,1.9rem);font-weight:900;letter-spacing:-.035em">Contributions</h2><p class="muted" style="margin:0">Complete contribution records and financial logs.</p></div></header><div class="wf-payout-metrics" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:18px 0"><article class="wf-payout-metric wf-payout-blue" style="border-left-color:#16a34a"><small>TOTAL CONTRIBUTIONS</small><strong id="wfConTotal">GHS 0.00</strong></article><article class="wf-payout-metric wf-payout-blue"><small>TOTAL DISBURSEMENT</small><strong id="wfConDisbursement">GHS 0.00</strong></article><article class="wf-payout-metric wf-payout-blue"><small>TOTAL NET FUND</small><strong id="wfConNet">GHS 0.00</strong></article></div><section class="wf-payout-log"><div class="wf-payout-log-head"><div><h3>Financial Records</h3><p class="muted">School contribution history, including reversed records.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap;min-width:min(100%,260px)"><input id="wfLedgerSearch" type="search" aria-label="Search contributions" placeholder="Search teacher or reference" style="flex:1;min-width:180px"><input id="wfLedgerMonth" type="month" aria-label="Filter by month" style="width:165px"></div></div><div class="wf-payout-table-wrap"><table style="min-width:760px"><thead><tr><th>TEACHER</th><th>MONTH / YEAR</th><th>REFERENCE</th><th>AMOUNT</th><th>DATE</th><th>ACTION</th></tr></thead><tbody id="wfConRows"><tr><td colspan="6">Loading contribution records…</td></tr></tbody></table></div></section><details style="margin-top:18px;padding-top:14px;border-top:1px solid #e8edf4"><summary style="cursor:pointer;font-weight:850;color:var(--ink)">Record a contribution</summary><form id="wfContribution" style="max-width:720px;padding-top:10px"><label>Teacher</label><select id="wfConTeacher" required style="width:100%;padding:12px"></select><label>Amount (GHS)</label><input id="wfConAmount" type="number" min=".01" step=".01" required><label>Date</label><input id="wfConDate" type="date" required><label>Reference</label><input id="wfConRef" maxlength="180"><p id="wfConMsg" class="muted"></p><button type="submit">Save contribution</button></form></details></div>
 <div class="panel wf-payout-view" id="wfPayoutPanel"><header class="wf-payout-heading"><div><h2>Welfare &amp; Payouts</h2><p>Welfare fund disbursement history and support log.</p></div></header><div class="wf-payout-metrics"><article class="wf-payout-metric wf-payout-pink"><small>TOTAL PAYOUTS</small><strong id="wfPayoutTotal">GHS 0.00</strong></article><article class="wf-payout-metric wf-payout-blue"><small>CURRENT FUND</small><strong id="wfPayoutCurrentFund">GHS 0.00</strong></article><article class="wf-payout-metric wf-payout-purple"><small>ACTIVE MEMBERS</small><strong id="wfPayoutActiveMembers">0</strong></article></div><div class="wf-payout-log"><div class="wf-payout-log-head"><div><h3>Disbursement Log</h3><p class="muted">Search payout records and retain reversed transactions in the history.</p></div><input id="wfPayoutSearch" type="search" aria-label="Search payouts" placeholder="Search beneficiary, reference or reason"></div><div class="wf-payout-table-wrap"><table><thead><tr><th>REFERENCE</th><th>BENEFICIARY</th><th>REASON</th><th>AMOUNT</th><th>DATE</th><th>ACTION</th></tr></thead><tbody id="wfPayRows"></tbody></table></div></div><details class="wf-payout-entry"><summary>Record a welfare payout</summary><form id="wfPayout"><label>Teacher</label><select id="wfPayTeacher" required style="width:100%;padding:12px"></select><label>Amount (GHS)</label><input id="wfPayAmount" type="number" min=".01" step=".01" required><label>Date</label><input id="wfPayDate" type="date" required><label>Reason</label><input id="wfPayReason" maxlength="180" required><label>Reference</label><input id="wfPayRef" maxlength="180"><p id="wfPayMsg" class="muted"></p><button>Save payout</button></form></details></div></div>
 
 <div class="panel" id="wfAuditPanel"><div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap"><h3>Audit history</h3><button id="wfAuditExport" type="button" class="secondary">Export audit CSV</button></div><p class="muted">Export includes the currently loaded school-scoped audit records, up to 300 entries.</p><div class="grid"><div><label for="wfAuditSearch">Search audit records</label><input id="wfAuditSearch" placeholder="Search action, actor, details…"></div><div><label for="wfAuditCategory">Category</label><select id="wfAuditCategory"><option value="">All categories</option><option>Welfare portal</option><option>Contribution</option><option>Payout</option><option>Teacher</option></select></div></div><p id="wfAuditMsg" class="muted">Loading audit history…</p><div style="overflow:auto"><table><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Details</th><th>Status</th></tr></thead><tbody id="wfAuditRows"><tr><td colspan="5">Loading…</td></tr></tbody></table></div></div>
  <!-- Destructive reset intentionally placed last in the Administration Panel. -->
  <div class="panel" id="wfResetDataPanel"><h3>Reset this school’s welfare data</h3><div class="wf-data-protection"><strong><i class="fa-solid fa-triangle-exclamation"></i> Permanent action</strong><p class="muted">This deletes only this school’s registered members, contribution records, payout records and transaction-reversal records. The audit history and school settings are preserved. This cannot be undone.</p></div><form id="wfResetDataForm" class="grid"><div><label for="wfResetPassword">Current administrator password</label><input id="wfResetPassword" type="password" autocomplete="current-password" required></div><div><label for="wfResetConfirmation">School-specific confirmation</label><input id="wfResetConfirmation" required autocomplete="off" placeholder="RESET:SCHOOLCODE"><small id="wfResetExpected" class="muted">Confirmation phrase will appear after the school loads.</small></div><div><label for="wfResetAllConfirmation">Final safety phrase</label><input id="wfResetAllConfirmation" required autocomplete="off" pattern="RESET ALL" title="Type RESET ALL exactly" placeholder="Type RESET ALL"><small class="muted">Required second confirmation before any records can be cleared.</small></div><div><button type="submit" class="danger"><i class="fa-solid fa-trash-can"></i> Permanently reset this school’s welfare data</button></div></form><p id="wfResetDataMsg" class="muted" role="status" aria-live="polite"></p></div>
</section>
 <div class="panel" id="wfTeacherRegisterPanel"><div class="wf-teacher-register-heading"><div><h3>Teacher Register</h3><p class="muted">Manage verified members of this school. Changes are saved to this school’s teacher records; existing financial history is preserved.</p></div><span class="wf-teacher-register-badge"><i class="fa-solid fa-shield-check"></i> Admin access</span></div><label for="wfTeacherSearch">Search teachers</label><input id="wfTeacherSearch" type="search" placeholder="Search teachers">
 <form id="wfTeacher" class="grid">
 <div><label for="wfTid">Staff ID</label><input id="wfTid" required maxlength="80"></div><div><label for="wfName">Full name</label><input id="wfName" required maxlength="160"></div>
 <div><label for="wfPhone">Phone</label><input id="wfPhone" maxlength="40"></div><div><label for="wfRank">Rank / Grade</label><select id="wfRank" style="width:100%;min-height:44px;padding:10px 12px;border:1px solid #dbe2ec;border-radius:10px;background:#fff;color:#0f172a;box-sizing:border-box">${rankOptionsMarkup()}</select></div>
 <div><label for="wfClass">Class / Subject / Responsibility</label><input id="wfClass" maxlength="100" placeholder="e.g. Primary 6, Mathematics"></div><div><label for="wfPassport">Passport photograph (optional)</label><input id="wfPassport" type="file" accept="image/jpeg,image/png,image/webp"><small class="muted">JPEG, PNG or WebP; maximum 1 MB. Leave blank to keep the current photo.</small><div id="wfPassportPreview" class="muted" aria-live="polite"></div></div><div style="align-self:end;display:flex;gap:8px;flex-wrap:wrap"><button id="wfTeacherSave" type="submit">Register teacher</button><button id="wfTeacherCancel" class="secondary" type="button">Cancel edit</button></div></form><p id="wfTeacherMsg" class="muted" role="status" aria-live="polite"></p><div class="wf-teacher-register-table" style="overflow:auto"><table><thead><tr><th>Staff ID</th><th>Name</th><th>Phone</th><th>Rank</th><th>Class</th><th>Status</th><th>Profile actions</th></tr></thead><tbody id="wfManageTeacherRows"></tbody></table></div></div>
 
 <section class="wf-reports-view hidden" id="wfReportsPanel"><header class="wf-reports-heading"><div><h2>Statements &amp; Reports</h2><p>Generate individual member statements or executive fund summary reports instantly.</p></div><span class="wf-reports-admin-status"><i class="fa-solid fa-shield-check"></i> Administrator access active</span></header><div class="wf-report-cards"><article class="wf-report-card"><div class="wf-report-card-icon wf-report-icon-blue"><i class="fa-solid fa-file-lines"></i></div><div class="wf-report-card-content"><h3>Individual Statement</h3><p>Generate a comprehensive, print-ready official A4 statement for the selected member account.</p><label for="wfStatementTeacher">Select Member Account</label><select id="wfStatementTeacher" aria-label="Select Member Account"></select><button id="wfStatementPdf" type="button" class="wf-report-button wf-report-button-dark"><i class="fa-solid fa-file-pdf"></i> Download Member Statement</button><p id="wfStatementMsg" class="wf-report-message" role="status" aria-live="polite"></p></div></article><article class="wf-report-card"><div class="wf-report-card-icon wf-report-icon-orange"><i class="fa-solid fa-calendar-days"></i></div><div class="wf-report-card-content"><h3>Monthly Summary Report</h3><p>Administrator access active. Select target month to generate report.</p><div class="wf-month-year-picker" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;max-width:560px;margin-bottom:13px"><div><label for="wfReportMonth">Select Month</label><select id="wfReportMonth" aria-label="Select reporting month"></select></div><div><label for="wfReportYear">Select Year</label><select id="wfReportYear" aria-label="Select reporting year"></select></div></div><button id="wfMonthlyPdf" type="button" class="wf-report-button wf-report-button-orange"><i class="fa-solid fa-file-pdf"></i> Download Monthly Summary (Admin)</button></div></article><article class="wf-report-card"><div class="wf-report-card-icon wf-report-icon-purple"><i class="fa-solid fa-calendar-check"></i></div><div class="wf-report-card-content"><h3>Yearly Summary Report</h3><p>Select a calendar year to download that year’s school-wide contribution and welfare payout summary.</p><label for="wfAnnualYear">Select Year</label><select id="wfAnnualYear" aria-label="Select annual report year"></select><button id="wfAnnualPdf" type="button" class="wf-report-button wf-report-button-purple"><i class="fa-solid fa-file-pdf"></i> Download Yearly Summary (Admin)</button></div></article><article class="wf-report-card"><div class="wf-report-card-icon wf-report-icon-green"><i class="fa-solid fa-chart-column"></i></div><div class="wf-report-card-content"><h3>Complete Fund Summary</h3><p>Administrator access is active. You can generate the complete fund report.</p><button id="wfCompletePdf" type="button" class="wf-report-button wf-report-button-green"><i class="fa-solid fa-file-pdf"></i> Download Complete Summary (Admin)</button></div></article></div><div class="wf-report-footer"><p id="wfReportMsg" class="muted" role="status" aria-live="polite">Reports include records visible to this authenticated school administrator only.</p><button id="wfExportCsv" type="button" class="wf-report-csv"><i class="fa-solid fa-file-csv"></i> Export ledgers CSV</button></div></section>`;
 // Financial workspaces are independent sidebar destinations, not admin-panel cards.
 const contributionWorkspace=d.querySelector('#wfContributionPanel');
 const payoutWorkspace=d.querySelector('#wfPayoutPanel');
 if(contributionWorkspace)d.appendChild(contributionWorkspace);
 if(payoutWorkspace)d.appendChild(payoutWorkspace);
 const dash=$('dashboard');if(dash)dash.appendChild(d);
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
 // Populate the monthly report selectors immediately after mounting the report
 // view. This keeps Month and Year available even if later optional setup is slow.
 const reportMonthSelect=$('wfReportMonth'),reportYearSelect=$('wfReportYear'),annualYearSelect=$('wfAnnualYear');
 {
   const reportMonthNow=new Date();
   const monthNames=Array.from({length:12},(_,i)=>new Date(2000,i,1).toLocaleDateString('en-GH',{month:'long'}));
   const reportYears=Array.from({length:11},(_,i)=>reportMonthNow.getFullYear()-i);
   if(reportMonthSelect&&reportYearSelect){
     reportMonthSelect.replaceChildren(...monthNames.map((name,i)=>new Option(name,String(i+1).padStart(2,'0'))));
     reportYearSelect.replaceChildren(...reportYears.map(year=>new Option(String(year),String(year))));
     reportMonthSelect.disabled=false;reportYearSelect.disabled=false;
     reportMonthSelect.value=String(reportMonthNow.getMonth()+1).padStart(2,'0');
     reportYearSelect.value=String(reportMonthNow.getFullYear());
   }
   if(annualYearSelect){
     annualYearSelect.replaceChildren(...reportYears.map(year=>new Option(String(year),String(year))));
     annualYearSelect.disabled=false;
     annualYearSelect.value=String(reportMonthNow.getFullYear());
   }
 }
 // Keep audit history in its own view, outside the restricted management workspace.
 const auditPanel=$('wfAuditPanel');
 if(dash&&auditPanel){
   const auditView=document.createElement('section');
   auditView.id='wfAuditView';
   auditView.className='portal-audit-view hidden';
   auditView.setAttribute('aria-labelledby','wfAuditViewTitle');
   auditView.innerHTML='<div class="panel"><div class="wf-admin-eyebrow"><i class="fa-solid fa-shield-halved"></i> Accountability</div><h2 id="wfAuditViewTitle">Audit Trail Dashboard</h2><p class="muted">Review this school’s audit history separately from management tasks.</p></div>';
   auditPanel.parentElement?.removeChild(auditPanel);
   auditView.appendChild(auditPanel);
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
 try{
 // Rebuild workflow markup on refresh so handlers always use the latest school-scoped data.
 const existingWorkflows=$('workflows');const retainedRoster=$('schoolTeachers');const overview=$('schoolOverview');if(existingWorkflows&&retainedRoster&&existingWorkflows.contains(retainedRoster)&&overview?.parentElement)overview.parentElement.insertBefore(retainedRoster,overview.nextElementSibling);retainedRoster?.querySelector('#wfTeacherRegisterPanel')?.remove();if(existingWorkflows)existingWorkflows.remove();
 addUI();
 const workflowMountNode=$('workflows');
 const adminPanelNode=$('wfAdminPanel');
 if(!workflowMountNode||!adminPanelNode)throw new Error('Admin Panel markup could not be mounted in the dashboard.');
 const roster=$('schoolTeachers'),teacherRegisterPanel=$('wfTeacherRegisterPanel');
 const ctx=school;
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
       const auditOk=await audit(client,ctx,'Update monthly dues','GHS '+value.toFixed(2));
       msg('wfDuesMsg',auditOk?'Standard monthly dues updated successfully.':'Monthly dues were saved, but the audit entry could not be recorded.',!auditOk);
     }catch(error){
       console.error('[School settings] Monthly dues save failed:',error);
       msg('wfDuesMsg','Monthly dues could not be saved. Please check your connection and school settings permissions, then try again.',true);
     }finally{if(button)button.disabled=false;}
   },true);
 }

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
    #adminActivityTicker .admin-ticker-track{display:flex;width:max-content;align-items:center;animation:adminTickerMove 90s linear infinite;will-change:transform}
    #adminActivityTicker.is-paused .admin-ticker-track{animation-play-state:paused}
    #adminActivityTicker .admin-ticker-group{display:flex;flex:0 0 auto;align-items:center;gap:38px;padding-right:38px;white-space:nowrap}
    #adminActivityTicker .admin-ticker-item{display:inline-flex;align-items:center;gap:9px;color:#f7f9fd;font-size:.8rem}
    #adminActivityTicker .admin-ticker-item b{color:#ffdf91;font-size:.67rem;letter-spacing:.06em}
    #adminActivityTicker .admin-ticker-time{color:#9fb2ca;font-size:.66rem}
    #adminActivityTicker .admin-ticker-control{position:relative;z-index:2;flex:0 0 24px;width:24px;height:24px;min-width:24px;min-height:24px;padding:0!important;display:grid;place-items:center;border:1px solid rgba(255,255,255,.2);border-radius:50%;background:rgba(255,255,255,.07);color:#f7df9e;font-size:.58rem;line-height:1;box-shadow:none}
    #adminActivityTicker .admin-ticker-control i{font-size:.58rem;line-height:1}
    #adminActivityTicker .admin-ticker-control:hover{background:rgba(255,255,255,.16)}
    body.admin-activity-ticker-active{padding-bottom:64px}
    body.admin-activity-ticker-active .sidebar{padding-bottom:68px}
    @keyframes adminTickerMove{from{transform:translateX(0)}to{transform:translateX(-50%)}}
    @keyframes adminTickerPulse{50%{opacity:.55;transform:scale(.82)}}
    @media(max-width:600px){#adminActivityTicker{min-height:48px;padding:5px 8px calc(5px + env(safe-area-inset-bottom));gap:7px}#adminActivityTicker .admin-ticker-brand{gap:7px;padding:7px 8px}#adminActivityTicker .admin-ticker-brand-icon{width:25px;height:25px}#adminActivityTicker .admin-ticker-brand-copy strong{font-size:.59rem}#adminActivityTicker .admin-ticker-brand-copy small{display:none}#adminActivityTicker .admin-ticker-group{gap:25px;padding-right:25px}#adminActivityTicker .admin-ticker-item{font-size:.72rem}#adminActivityTicker .admin-ticker-time{font-size:.6rem}#adminActivityTicker .admin-ticker-control{width:20px;height:20px;min-width:20px;min-height:20px;flex-basis:20px}}
    @media(max-width:360px){#adminActivityTicker .admin-ticker-brand-copy{display:none}#adminActivityTicker .admin-ticker-brand{padding:6px}}
    @media(prefers-reduced-motion:reduce){#adminActivityTicker .admin-ticker-track,#adminActivityTicker .admin-ticker-indicator{animation:none!important}}
   `;
   document.head.appendChild(adminTickerStyles);
 }
 const adminTicker=document.createElement('aside');
 adminTicker.id='adminActivityTicker';adminTicker.setAttribute('aria-label','Administrator activity');
 adminTicker.innerHTML='<div class="admin-ticker-brand"><span class="admin-ticker-brand-copy"><strong>ADMIN ACTIVITY</strong><small>SCHOOL OPERATIONS</small></span><span class="admin-ticker-indicator" aria-hidden="true"></span></div><div class="admin-ticker-window"><div class="admin-ticker-track"><div class="admin-ticker-group" id="adminTickerItems"></div><div class="admin-ticker-group" id="adminTickerItemsClone" aria-hidden="true"></div></div></div><button type="button" class="admin-ticker-control" aria-label="Pause scrolling" aria-pressed="false" title="Pause scrolling"><i class="fa-solid fa-pause" aria-hidden="true"></i></button>';
 document.body.appendChild(adminTicker);
 const adminTickerControl=adminTicker.querySelector('.admin-ticker-control');
 adminTickerControl?.addEventListener('click',()=>{
   const paused=adminTicker.classList.toggle('is-paused');
   adminTickerControl.setAttribute('aria-pressed',String(paused));
   adminTickerControl.setAttribute('aria-label',paused?'Resume scrolling':'Pause scrolling');
   adminTickerControl.title=paused?'Resume scrolling':'Pause scrolling';
   adminTickerControl.innerHTML='<i class="fa-solid '+(paused?'fa-play':'fa-pause')+'" aria-hidden="true"></i>';
 });
 const refreshAdminActivityTicker=async()=>{
   const {data:rows,error}=await client.from('audit_logs')
     .select('created_at,time_string,actor_name,action,details,status')
     .eq('school_id',ctx.id).order('created_at',{ascending:false}).limit(50);
   if(error){console.warn('[Administrator activity ticker] Feed unavailable:',error.message);return;}
   const items=rows?.length?rows.map(row=>{
     const stamp=row.created_at?new Date(row.created_at).toLocaleString('en-GH',{dateStyle:'medium',timeStyle:'short'}):(row.time_string||'');
     const detail=String(row.details||'').trim();
     return '<span class="admin-ticker-item"><b>'+esc(row.actor_name||'Administrator')+'</b><span>'+esc(row.action||'Activity recorded')+(detail?' · '+esc(detail):'')+'</span><time class="admin-ticker-time">'+esc(stamp)+'</time></span>';
   }).join(''):'<span class="admin-ticker-item"><b>ACTIVITY</b><span>No administrator activity has been recorded yet.</span></span>';
   const primary=document.getElementById('adminTickerItems'),clone=document.getElementById('adminTickerItemsClone');
   if(primary&&clone){primary.innerHTML=items;clone.innerHTML=items;}
 };
 await refreshAdminActivityTicker();
 window.__adminActivityTickerTimer=setInterval(refreshAdminActivityTicker,30000);

 const adminTeacherProfileNav=document.querySelector('.sidebar .navbtn[data-target="wfTeacherPanel"]');
 if(adminTeacherProfileNav){adminTeacherProfileNav.style.display='none';adminTeacherProfileNav.setAttribute('aria-hidden','true');}
 $('wfChangePasswordForm')?.addEventListener('submit',async e=>{e.preventDefault();const current=$('wfCurrentAdminPassword').value,newPassword=$('wfNewAdminPassword').value,confirmPassword=$('wfConfirmAdminPassword').value;if(newPassword.length<10)return msg('wfPasswordMsg','Use a new password with at least 10 characters.',true);if(newPassword!==confirmPassword)return msg('wfPasswordMsg','The new passwords do not match.',true);const {data:{user},error:userError}=await client.auth.getUser();if(userError||!user?.email)return msg('wfPasswordMsg','Your signed-in administrator account could not be verified. Sign in again and retry.',true);msg('wfPasswordMsg','Verifying your current password…');const {error:verifyError}=await client.auth.signInWithPassword({email:user.email,password:current});if(verifyError)return msg('wfPasswordMsg','Current password is incorrect. No changes were made.',true);const {error:updateError}=await client.auth.updateUser({password:newPassword});if(updateError)return msg('wfPasswordMsg','Password update failed. Please try again or use password recovery.',true);$('wfChangePasswordForm').reset();msg('wfPasswordMsg','Password updated successfully for the signed-in administrator.');await audit(client,school,'Change administrator password','Administrator password changed through the school portal.');});

 // Tenant branding comes from the authenticated school record supplied by the portal.
 // Load sources independently: a missing optional column/table must not prevent the
 // dashboard's other sections from rendering. Errors are logged without exposing SQL.
 // Fetch every page so totals and ledgers are not silently capped by the API row limit.
  const loadSource=async(label,makeQuery)=>{
    try{
      const all=[];let from=0;const pageSize=1000;
      while(true){
        const result=await makeQuery().range(from,from+pageSize-1);
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
 // Retry compatible projections independently: older tenants may lack one or both
 // optional profile columns. Never require is_active/passport to show the roster.
 let tr=await teacherQuery('id,name,phone,rank,class_name,is_active,passport,created_at,registration_date,membership_type,employer');
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
 let [cr,pr,rr]=await Promise.all([
   loadSource('contribution ledger',()=>client.from('contributions').select('id,teacher_id,amount,date,reference').eq('school_id',school.id).order('date',{ascending:false})),
   loadSource('payout ledger',()=>client.from('payouts').select('id,teacher_id,amount,date,reason,reference').eq('school_id',school.id).order('date',{ascending:false})),
   loadSource('transaction reversals',()=>client.from('transaction_reversals').select('transaction_type,transaction_id,reason,created_at').eq('school_id',school.id))
 ]);
 const teachers=tr.data||[];let cons=cr.data||[], pays=pr.data||[], reversals=rr.data||[];
 const sourceWarnings=[];
 if(tr.error)sourceWarnings.push('Teacher register unavailable');
 if(cr.error)sourceWarnings.push('Contribution ledger unavailable');
 if(pr.error)sourceWarnings.push('Payout ledger unavailable');
 if(rr.error)sourceWarnings.push('Reversal status unavailable');
 if(sourceWarnings.length){
   console.warn('[School Welfare] Partial dashboard data for school',school.school_code,sourceWarnings);
 }
 const reversed=new Set(reversals.map(r=>r.transaction_type+':'+r.transaction_id));
 let activeCons=cons.filter(x=>!reversed.has('contribution:'+x.id)), activePays=pays.filter(x=>!reversed.has('payout:'+x.id));

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
 @media(max-width:600px){#wfLedgerPanel .wf-contrib-filters,#wfLedgerPanel .wf-contrib-filters input{width:100%;max-width:none}}
 `;
 document.head.appendChild(contribStyle);
 const teacherById=new Map(teachers.map(t=>[String(t.id),t]));
 let selectedProfileTeacherId=teachers[0]?String(teachers[0].id):'';
 const profileHost=$('schoolOverview')?.parentElement;
 if(profileHost){
  document.getElementById('teacherProfileViewer')?.remove();
  const p=document.createElement('section');p.id='teacherProfileViewer';p.className='panel hidden';p.style.cssText='margin-top:18px;padding:clamp(16px,2.4vw,28px)';
  p.innerHTML=`
   <header style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap;margin-bottom:20px">
    <div><h2 style="margin:0 0 6px">Teacher Profile</h2><p class="muted" style="margin:0">Comprehensive personal, professional, and membership overview.</p></div>
    <button type="button" id="teacherProfilePrint" class="secondary"><i class="fa-solid fa-file-pdf"></i> Print / Download Profile Statement</button>
   </header>
   <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:18px"><label for="teacherProfileSelect" style="margin:0">Select teacher</label><select id="teacherProfileSelect" style="max-width:360px"></select></div>
   <div id="teacherProfileContent" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px">
    <article class="panel" style="margin:0;text-align:center;padding:24px;position:relative">
     <span id="tpStatus" style="position:absolute;right:15px;top:15px;border-radius:99px;padding:6px 11px;font-size:.72rem;font-weight:800"></span>
     <div id="tpAvatar" style="width:104px;height:104px;border-radius:24px;margin:18px auto 14px;display:grid;place-items:center;background:linear-gradient(145deg,#142746,#071326);color:#f1ce78;font-size:2rem;font-weight:900">—</div>
     <h3 id="tpName" style="margin:0 0 5px">—</h3><p id="tpRank" class="muted">—</p><strong id="tpStaffId">—</strong>
     <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;border-top:1px solid var(--line);margin-top:20px;padding-top:15px;text-align:left">
      <div><small class="muted">REGISTRATION DATE</small><strong id="tpRegistration">—</strong></div><div><small class="muted">MEMBERSHIP TYPE</small><strong id="tpMembership">—</strong></div>
     </div>
    </article>
    <article class="panel" style="margin:0;padding:22px"><h3><i class="fa-solid fa-address-card"></i> Personal &amp; Contact Information</h3><div id="tpPersonalRows" class="tp-fields"></div><p class="muted">To update your official personal or contact information, contact the Executive Administrator.</p><button type="button" class="secondary" id="tpEditContact">Edit Contact Info</button></article>
    <article class="panel" style="margin:0;padding:22px"><h3><i class="fa-solid fa-briefcase"></i> Professional &amp; Employment Details</h3><div id="tpProfessionalRows" class="tp-fields"></div></article>
    <article class="panel" style="margin:0;padding:22px"><h3><i class="fa-solid fa-hand-holding-heart"></i> Welfare Membership &amp; Financial Summary</h3><div id="tpFinanceRows"></div></article>
   </div>
   <style>
    #teacherProfileViewer .tp-fields{display:grid;gap:10px}
    #teacherProfileViewer .tp-field{border:1px solid var(--line);background:rgba(120,130,150,.06);border-radius:12px;padding:11px 13px}
    #teacherProfileViewer .tp-field small{display:block;color:var(--muted);font-size:.68rem;font-weight:850;letter-spacing:.06em;margin-bottom:5px}
    #teacherProfileViewer .tp-field strong{display:block;overflow-wrap:anywhere;font-size:.92rem}
    #teacherProfileViewer .tp-finance{display:flex;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid var(--line)}
    @media(max-width:760px){#teacherProfileContent{grid-template-columns:1fr!important}#teacherProfilePrint{width:100%}}
    @media print{body *{visibility:hidden!important}#teacherProfileViewer,#teacherProfileViewer *{visibility:visible!important}#teacherProfileViewer{position:absolute;inset:0;width:100%;margin:0!important}#teacherProfilePrint,#teacherProfileSelect,#teacherProfileViewer label,#tpEditContact{display:none!important}}
   </style>`;
  const wf=$('workflows');profileHost.insertBefore(p,wf&&wf.parentElement===profileHost?wf:null);
 }
 const profileSelect=$('teacherProfileSelect');
 const profileRows=rows=>rows.map(([k,v])=>'<div class="tp-field"><small>'+esc(k)+'</small><strong>'+esc(v||'—')+'</strong></div>').join('');
 const profileMoney=n=>'GHS '+Number(n||0).toLocaleString('en-GH',{minimumFractionDigits:2,maximumFractionDigits:2});
 const profileDate=v=>{if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});};
 const renderSelectedTeacherProfile=()=>{
  const t=teachers.find(x=>String(x.id)===selectedProfileTeacherId);if(!t)return;
  const tc=activeCons.filter(x=>String(x.teacher_id)===String(t.id)),tp=activePays.filter(x=>String(x.teacher_id)===String(t.id));
  const dues=tc.reduce((n,x)=>n+Number(x.amount||0),0),paid=tp.reduce((n,x)=>n+Number(x.amount||0),0);
  const recent=[...tc].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))[0];
  const parts=String(t.name||'').trim().split(/\\s+/).filter(Boolean),initials=parts.slice(0,2).map(x=>x[0]).join('').toUpperCase()||'—';
  $('tpStatus').textContent=t.is_active===false?'Inactive':'Active';$('tpStatus').style.cssText+=';background:'+(t.is_active===false?'#fee2e2':'#dcfce7')+';color:'+(t.is_active===false?'#b91c1c':'#166534');
  $('tpAvatar').textContent=initials;$('tpName').textContent=t.name||'—';$('tpRank').textContent=t.rank||'—';$('tpStaffId').textContent='Staff ID: '+t.id;
  $('tpRegistration').textContent=profileDate(t.registration_date||t.created_at||t.date_registered);$('tpMembership').textContent=t.membership_type||t.membership||'—';
  $('tpPersonalRows').innerHTML=profileRows([['FULL NAME',t.name],['PHONE NUMBER',t.phone],['SCHOOL / INSTITUTION',school.name],['DISTRICT & REGION',[school.district,school.region].filter(Boolean).join(' · ')]]);
  $('tpProfessionalRows').innerHTML=profileRows([['Staff ID',t.id],['Professional Rank',t.rank],['Class / Subject Assigned',t.class_name],['Employer',t.employer||school.employer]]);
  $('tpFinanceRows').innerHTML=[
   '<div class="tp-finance"><span>Total Dues Contributed</span><strong style="color:#15803d">'+esc(profileMoney(dues))+'</strong></div>',
   '<div class="tp-finance"><span>Total Welfare Payouts Received</span><strong style="color:#dc2626">'+esc(profileMoney(paid))+'</strong></div>',
   '<div class="tp-finance"><span>Total Payments Recorded</span><strong>'+tc.length+'</strong></div>',
   '<div class="tp-finance"><span>Most Recent Contribution</span><strong>'+esc(recent?profileDate(recent.date):'—')+'</strong></div>'
  ].join('');
 };
 if(profileSelect){profileSelect.innerHTML=teachers.map(t=>'<option value="'+esc(t.id)+'">'+esc(t.name||t.id)+' ('+esc(t.id)+')</option>').join('');profileSelect.value=selectedProfileTeacherId;profileSelect.addEventListener('change',()=>{selectedProfileTeacherId=profileSelect.value;renderSelectedTeacherProfile();});}
 $('teacherProfilePrint')?.addEventListener('click',()=>window.print());
 $('tpEditContact')?.addEventListener('click',()=>alert('To update official contact details, contact the Executive Administrator.'));
 renderSelectedTeacherProfile();

 const teacherLabel=id=>{const t=teacherById.get(String(id));return t?esc(t.name)+' ('+esc(t.id)+')':esc(id||'—')};
 const renderTeacherTables=()=>{const q=String($('wfTeacherSearch')?.value||'').trim().toLowerCase();const visible=teachers.filter(t=>[t.id,t.name,t.phone,t.rank,t.class_name].some(v=>String(v||'').toLowerCase().includes(q)));
 $('wfManageTeacherRows').innerHTML=visible.length?visible.map(t=>'<tr><td>'+esc(t.id)+'</td><td>'+esc(t.name)+'</td><td>'+esc(t.phone||'—')+'</td><td>'+esc(t.rank||'—')+'</td><td>'+esc(t.class_name||'—')+'</td><td><span class="wf-teacher-status '+(t.is_active===false?'inactive':'active')+'">'+(t.is_active===false?'Inactive':'Active')+'</span></td><td><button type="button" class="secondary" data-view-profile="'+esc(t.id)+'">View profile</button> <button type="button" class="secondary" data-wf-edit="'+esc(t.id)+'">Edit</button> '+'<button type="button" data-wf-activate="'+esc(t.id)+'">Activate / reset login</button> '+(t.is_active===false?'<button type="button" data-wf-restore="'+esc(t.id)+'">Restore</button>':'<button type="button" class="secondary" data-wf-remove="'+esc(t.id)+'">Deactivate</button>')+'</td></tr>').join(''):'<tr><td colspan="7">No matching teachers.</td></tr>';};
 renderTeacherTables();
 $('wfTeacherSearch').addEventListener('input',renderTeacherTables);
 $('wfManageTeacherRows').addEventListener('click',async e=>{
   const viewButton=e.target.closest('[data-view-profile]');
   if(viewButton){selectedProfileTeacherId=String(viewButton.dataset.viewProfile);if(profileSelect)profileSelect.value=selectedProfileTeacherId;renderSelectedTeacherProfile();const nav=document.querySelector('.sidebar .navbtn[data-target="teacherProfileViewer"]');if(nav)nav.click();return;}
   const deactivateButton=e.target.closest('[data-wf-remove]');
   if(deactivateButton){
     const teacher=teachers.find(t=>String(t.id)===String(deactivateButton.dataset.wfRemove));
     if(!teacher)return msg('wfTeacherMsg','That teacher is no longer in the loaded roster. Refresh and try again.',true);
     if(teacher.is_active===false)return msg('wfTeacherMsg','This teacher is already inactive.',true);
     const confirmed=confirm('OK to deactivate '+teacher.name+' ('+teacher.id+')?\n\nThe teacher will be removed from the active register and will no longer be eligible to sign in. Existing contributions, payouts and historical records will be retained.\n\nSelect Cancel to leave the teacher active.');
     if(!confirmed)return;
     deactivateButton.disabled=true;
     msg('wfTeacherMsg','Deactivating '+teacher.name+'…');
     try{
       const {error}=await client.from('teachers').update({is_active:false}).eq('id',teacher.id).eq('school_id',ctx.id);
       if(error)throw new Error(error.message||'The teacher could not be deactivated.');
       const auditOk=await audit(client,ctx,'Deactivate teacher profile',teacher.name+' ('+teacher.id+'); existing financial history retained.',teacher.id);
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
   if(!confirm((isReset?'Create or reset':'Activate')+' the secure sign-in for '+teacher.name+' ('+teacher.id+')? The teacher’s Staff ID ('+teacher.id+') will be set as the temporary login password, and any previous password will stop working. Share the Staff ID privately; the teacher must change it after signing in.'))return;
   button.disabled=true;msg('wfTeacherMsg','Securing teacher sign-in…');
   try{
     const {data,error}=await client.functions.invoke('provision-teacher-account',{body:{school_id:ctx.id,teacher_id:teacher.id}});
     if(error||!data?.ok)throw new Error(data?.error||error?.message||'Teacher sign-in could not be activated.');
     await audit(client,ctx,'Activate/reset teacher sign-in','Secure teacher account activated/reset for Staff ID '+teacher.id+'.',teacher.id);
     msg('wfTeacherMsg','Sign-in activated for '+teacher.name+'. The Staff ID is the temporary login password.');
     alert('TEACHER SIGN-IN ACTIVATED\\nSchool: '+ctx.name+'\\nTeacher: '+data.teacher_name+'\\nStaff ID: '+data.staff_id+'\\nTemporary login password (Staff ID): '+data.initial_password+'\\n\\nShare the Staff ID privately. The teacher must change it after signing in.');
   }catch(error){msg('wfTeacherMsg',error.message||'Teacher sign-in could not be activated. No success was assumed.',true);}
   finally{button.disabled=false;}
 });

 const options='<option value="">Choose teacher</option>'+teachers.filter(t=>t.is_active!==false).map(t=>'<option value="'+esc(t.id)+'">'+esc(t.name)+' ('+esc(t.id)+')</option>').join('');
 $('wfConTeacher').innerHTML=options;$('wfPayTeacher').innerHTML=options;$('wfStatementTeacher').innerHTML=options;
 const reversalCell=(type,x)=>reversed.has(type+':'+x.id)?'<strong class="wf-reversed-label">REVERSED</strong> <span class="muted">· '+esc(reversals.find(r=>r.transaction_type===type&&String(r.transaction_id)===String(x.id))?.reason||'Reason recorded')+'</span>':'<button type="button" class="wf-reverse-action" data-wf-reverse="'+type+'" data-wf-id="'+esc(x.id)+'"><i class="fa-solid fa-rotate-left" aria-hidden="true"></i> Reverse</button>';
 const renderContributionLedger=()=>{
    const q=String($('wfLedgerSearch')?.value||'').trim().toLowerCase(),month=$('wfLedgerMonth')?.value||'';
    const rows=cons.filter(x=>(!month||String(x.date||'').startsWith(month))&&[x.teacher_id,x.reference,teacherById.get(String(x.teacher_id))?.name].some(v=>String(v||'').toLowerCase().includes(q)));
    const totalCon=activeCons.reduce((n,x)=>n+Number(x.amount||0),0),totalPay=activePays.reduce((n,x)=>n+Number(x.amount||0),0);
    $('wfConTotal').textContent=cr.error?'Unavailable':'GHS '+money(totalCon);
    $('wfConDisbursement').textContent=pr.error?'Unavailable':'GHS '+money(totalPay);
    $('wfConNet').textContent=(cr.error||pr.error)?'Unavailable':'GHS '+money(totalCon-totalPay);
    $('wfConRows').innerHTML=cr.error?'<tr><td colspan="6">Contribution records could not be loaded. Check school account permissions and try again.</td></tr>':rows.length?rows.map(x=>{
     const d=String(x.date||''),monthYear=d.length>=7?new Date(d+'T00:00:00').toLocaleDateString('en-GB',{month:'short',year:'numeric'}):'—';
     const reversedEntry=reversed.has('contribution:'+x.id);
     const action=reversedEntry?'<span class="wf-admin-pill">Reversed</span>':'<button type="button" class="secondary" data-wf-reverse="contribution" data-wf-id="'+esc(x.id)+'">Reverse</button>';
     return '<tr><td>'+teacherLabel(x.teacher_id)+'</td><td>'+esc(monthYear)+'</td><td>'+esc(x.reference||'—')+'</td><td>GHS '+money(x.amount)+'</td><td>'+esc(d||'—')+'</td><td>'+action+'</td></tr>';
    }).join(''):'<tr><td colspan="6">No matching contributions.</td></tr>';
  };
  renderContributionLedger();$('wfLedgerSearch').addEventListener('input',renderContributionLedger);$('wfLedgerMonth').addEventListener('change',renderContributionLedger);
  const renderPayoutLedger=()=>{
    const q=String($('wfPayoutSearch')?.value||'').trim().toLowerCase();
    const rows=pays.filter(x=>[x.teacher_id,x.reason,x.reference,teacherById.get(String(x.teacher_id))?.name].some(v=>String(v||'').toLowerCase().includes(q)));
    const totalPayout=activePays.reduce((n,x)=>n+Number(x.amount||0),0),currentFund=activeCons.reduce((n,x)=>n+Number(x.amount||0),0)-totalPayout,activeMembers=teachers.filter(t=>t.is_active!==false).length;
    $('wfPayoutTotal').textContent=pr.error?'Unavailable':'GHS '+money(totalPayout);
    $('wfPayoutCurrentFund').textContent=(cr.error||pr.error)?'Unavailable':'GHS '+money(currentFund);
    $('wfPayoutActiveMembers').textContent=tr.error?'Unavailable':String(activeMembers);
    $('wfPayRows').innerHTML=pr.error?'<tr><td colspan="6">Payout records could not be loaded. Check the school account permissions and try again.</td></tr>':rows.length?rows.map(x=>{const rawDate=String(x.date||'');const displayDate=rawDate&&/^\d{4}-\d{2}-\d{2}/.test(rawDate)?new Date(rawDate.slice(0,10)+'T00:00:00').toLocaleDateString('en-GB'):(rawDate||'—');return '<tr><td class="wf-payout-reference">'+esc(x.reference||'—')+'</td><td class="wf-payout-beneficiary">'+teacherLabel(x.teacher_id)+'</td><td>'+esc(x.reason||'Welfare support')+'</td><td class="wf-payout-amount">GHS '+money(x.amount)+'</td><td>'+esc(displayDate)+'</td><td>'+reversalCell('payout',x)+'</td></tr>'}).join(''):'<tr><td colspan="6">No matching payouts.</td></tr>';
  };
  renderPayoutLedger();$('wfPayoutSearch').addEventListener('input',renderPayoutLedger);
  // Reload transaction data in place; keep the authenticated dashboard and
  // currently selected section mounted after a contribution or payout is saved.
  const refreshWorkflow=async()=>{
    const [nextCon,nextPay,nextRev]=await Promise.all([
      loadSource('contribution ledger refresh',()=>client.from('contributions').select('id,teacher_id,amount,date,reference').eq('school_id',ctx.id).order('date',{ascending:false})),
      loadSource('payout ledger refresh',()=>client.from('payouts').select('id,teacher_id,amount,date,reason,reference').eq('school_id',ctx.id).order('date',{ascending:false})),
      loadSource('transaction reversals refresh',()=>client.from('transaction_reversals').select('transaction_type,transaction_id,reason,created_at').eq('school_id',ctx.id))
    ]);
    cr=nextCon;pr=nextPay;rr=nextRev;
    cons=nextCon.data||[];pays=nextPay.data||[];reversals=nextRev.data||[];
    reversed.clear();
    reversals.forEach(item=>reversed.add(item.transaction_type+':'+item.transaction_id));
    activeCons=cons.filter(item=>!reversed.has('contribution:'+item.id));
    activePays=pays.filter(item=>!reversed.has('payout:'+item.id));
    const totalCon=activeCons.reduce((sum,item)=>sum+Number(item.amount||0),0);
    const totalPay=activePays.reduce((sum,item)=>sum+Number(item.amount||0),0);
    $('contributionTotal').textContent=cr.error?'Unavailable':money(totalCon);
    $('payoutTotal').textContent=pr.error?'Unavailable':money(totalPay);
    $('netTotal').textContent=(cr.error||pr.error)?'Unavailable':money(totalCon-totalPay);
    const now=new Date(),monthKey=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
    if($('monthlyContributionTotal'))$('monthlyContributionTotal').textContent=cr.error?'Unavailable':money(activeCons.filter(item=>String(item.date||'').slice(0,7)===monthKey).reduce((sum,item)=>sum+Number(item.amount||0),0));
    renderContributionLedger();
    renderPayoutLedger();
    renderSelectedTeacherProfile();
    await refreshAdminActivityTicker();
    return !cr.error&&!pr.error;
  };
  $('teacherCount').textContent=tr.error?'Unavailable':String(teachers.filter(t=>t.is_active!==false).length);
  $('contributionTotal').textContent=cr.error?'Unavailable':money(activeCons.reduce((a,x)=>a+Number(x.amount||0),0));
  $('payoutTotal').textContent=pr.error?'Unavailable':money(activePays.reduce((a,x)=>a+Number(x.amount||0),0));
  $('netTotal').textContent=(cr.error||pr.error)?'Unavailable':money(activeCons.reduce((a,x)=>a+Number(x.amount||0),0)-activePays.reduce((a,x)=>a+Number(x.amount||0),0));

 $('wfResetExpected').textContent='Required phrase: RESET:'+ctx.school_code;
 $('wfResetConfirmation').placeholder='RESET:'+ctx.school_code;
 const callAdminManagement=async payload=>{
   const {data,error}=await client.functions.invoke('school-admin-management',{body:{...payload,school_id:ctx.id}});
   if(error)throw new Error(data?.error||error.message||'The request failed.');
   if(data?.error)throw new Error(data.error);
   return data||{};
 };
 const renderSchoolAdmins=admins=>{
   const rows=$('wfAdminUsersRows');
   rows.innerHTML=admins.length?admins.map(a=>'<tr><td>'+esc(a.username||'—')+'</td><td>'+esc(a.name||'—')+'</td><td>'+(a.active?'<span class="wf-admin-pill active">Active</span>':'<span class="wf-admin-pill">Inactive</span>')+'</td><td>'+(a.active&&a.user_id!==undefined?'<button type="button" class="secondary" data-wf-admin-deactivate="'+esc(a.id)+'" '+(String(a.user_id)===String((awaitUserId)||'')?'disabled title="You cannot deactivate your own account"':'')+'>Deactivate</button>':'—')+'</td></tr>').join(''):'<tr><td colspan="4">No administrator accounts are linked to this school.</td></tr>';
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
   if(!confirm('Send a secure administrator invitation to '+email+' for '+ctx.name+'?'))return;
   msg('wfAdminUsersMsg','Sending invitation…');
   try{const result=await callAdminManagement({action:'invite',full_name,username,email});$('wfInviteAdminForm').reset();msg('wfAdminUsersMsg',result.message||'Invitation sent.');await loadSchoolAdmins();}
   catch(error){msg('wfAdminUsersMsg',error.message||'Invitation failed.',true);}
 };
 $('wfAdminUsersRows').addEventListener('click',async e=>{
   const button=e.target.closest('[data-wf-admin-deactivate]');if(!button)return;
   if(!confirm('Deactivate this administrator’s access to '+ctx.name+'? Their account identity and audit history will be retained.'))return;
   button.disabled=true;msg('wfAdminUsersMsg','Updating administrator access…');
   try{const result=await callAdminManagement({action:'deactivate',admin_id:button.dataset.wfAdminDeactivate});msg('wfAdminUsersMsg',result.message||'Administrator access updated.');await loadSchoolAdmins();}
   catch(error){msg('wfAdminUsersMsg',error.message||'Administrator access could not be changed.',true);button.disabled=false;}
 });
 $('wfResetDataForm').onsubmit=async e=>{
   e.preventDefault();const current_password=$('wfResetPassword').value,confirmation=$('wfResetConfirmation').value,finalPhrase=$('wfResetAllConfirmation').value;
   if(confirmation!=='RESET:'+ctx.school_code)return msg('wfResetDataMsg','The confirmation phrase does not match this school. No records were changed.',true);
    if(finalPhrase!=='RESET ALL')return msg('wfResetDataMsg','Type RESET ALL exactly to confirm this second safety step. No records were changed.',true);
   if(!confirm('FINAL CONFIRMATION: Permanently delete all member, contribution, payout and reversal records belonging only to '+ctx.name+' ('+ctx.school_code+')? Audit history and school settings will remain. This cannot be undone.'))return;
   msg('wfResetDataMsg','Verifying administrator and processing the school-scoped reset…');
   try{const result=await callAdminManagement({action:'reset',current_password,confirmation});$('wfResetDataForm').reset();$('wfResetExpected').textContent='Required phrase: RESET:'+ctx.school_code;$('wfResetConfirmation').placeholder='RESET:'+ctx.school_code;msg('wfResetDataMsg','Reset completed. Removed '+(result.result?.members_removed??0)+' members, '+(result.result?.contributions_removed??0)+' contributions, '+(result.result?.payouts_removed??0)+' payouts. Audit history preserved.');await refreshWorkflow();}
   catch(error){msg('wfResetDataMsg',error.message||'Reset failed. No success was assumed.',true);}
 };
 loadSchoolAdmins();


 // Bind report actions as soon as report controls and school-scoped data are ready.
 // Install these BEFORE optional settings requests so slow settings cannot leave
 // visible PDF buttons without click handlers.
 const runWelfarePdf=async(button,statusId,successText,buildOptions)=>{
   if(button.disabled)return;
   button.disabled=true;
   msg(statusId,'Preparing PDF…');
   try{
     if(typeof window.generateTenantWelfarePdf!=='function')throw new Error('The PDF generator is unavailable. Reload the portal and try again.');
     await window.generateTenantWelfarePdf(buildOptions());
     msg(statusId,successText);
   }catch(error){
     console.error('[School Welfare PDF]',error);
     msg(statusId,error?.message||'The PDF could not be generated. Check your connection and try again.',true);
   }finally{button.disabled=false;}
 };
 $('wfMonthlyPdf').addEventListener('click',()=>{
   const selectedMonth=$('wfReportMonth').value,selectedYear=$('wfReportYear').value;
   if(!selectedMonth||!selectedYear)return msg('wfReportMsg','Choose both a reporting month and year.',true);
   const month=selectedYear+'-'+selectedMonth;
   return runWelfarePdf($('wfMonthlyPdf'),'wfReportMsg','Monthly summary PDF downloaded successfully.',()=>({
     type:'monthly',school:{name:ctx.name,school_code:ctx.school_code,district:ctx.district,region:ctx.region},
     month,contributions:activeCons,payouts:activePays,teachers,
     academicYear:window.getCurrentAcademicYear(),
     standardMonthlyDues:typeof standardMonthlyDues!=='undefined'?standardMonthlyDues:0
   }));
 });
 $('wfCompletePdf').addEventListener('click',()=>runWelfarePdf($('wfCompletePdf'),'wfReportMsg','Complete fund summary PDF downloaded successfully.',()=>({
   type:'complete',school:{name:ctx.name,school_code:ctx.school_code,district:ctx.district,region:ctx.region},
   contributions:activeCons,payouts:activePays,teachers,
   academicYear:window.getCurrentAcademicYear(),
   standardMonthlyDues:typeof standardMonthlyDues!=='undefined'?standardMonthlyDues:0
 })));
 $('wfAnnualPdf').addEventListener('click',()=>{
   const selectedYear=$('wfAnnualYear').value;
   if(!/^\d{4}$/.test(selectedYear||''))return msg('wfReportMsg','Choose a valid reporting year.',true);
   return runWelfarePdf($('wfAnnualPdf'),'wfReportMsg','Yearly summary PDF downloaded successfully.',()=>({
     type:'annual',year:selectedYear,school:{name:ctx.name,school_code:ctx.school_code,district:ctx.district,region:ctx.region},
     contributions:activeCons,payouts:activePays,teachers,
     academicYear:window.getCurrentAcademicYear(),
     standardMonthlyDues:typeof standardMonthlyDues!=='undefined'?standardMonthlyDues:0
   }));
 });
 $('wfStatementPdf').addEventListener('click',()=>{
   const tid=$('wfStatementTeacher').value,teacher=teachers.find(t=>String(t.id)===String(tid));
   if(!teacher)return msg('wfStatementMsg','Choose a teacher first.',true);
   return runWelfarePdf($('wfStatementPdf'),'wfStatementMsg','Member statement PDF downloaded successfully.',()=>({
     type:'individual',school:{name:ctx.name,school_code:ctx.school_code,district:ctx.district,region:ctx.region},
     teacher,contributions:activeCons.filter(x=>String(x.teacher_id)===String(tid)),
     payouts:activePays.filter(x=>String(x.teacher_id)===String(tid)),
     personalContributionTotal:activeCons.filter(x=>String(x.teacher_id)===String(tid)).reduce((sum,row)=>sum+Number(row.amount||0),0),
     schoolFundBalance:activeCons.reduce((sum,row)=>sum+Number(row.amount||0),0)-activePays.reduce((sum,row)=>sum+Number(row.amount||0),0),
     academicYear:window.getCurrentAcademicYear(),
     standardMonthlyDues:typeof standardMonthlyDues!=='undefined'?standardMonthlyDues:0
   }));
 });

 const {data:broadcastSetting,error:broadcastLoadError}=await client.from('system_settings').select('value').eq('school_id',ctx.id).eq('key','broadcast_message').maybeSingle();
 if(!broadcastLoadError&&broadcastSetting)$('wfBroadcastText').value=String(broadcastSetting.value||'');
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
 $('wfBroadcastForm').onsubmit=async e=>{e.preventDefault();const value=$('wfBroadcastText').value.trim();if(!value)return msg('wfBroadcastMsg','Enter an announcement before publishing.',true);if(!confirm('Publish this announcement for this school?'))return;await saveBroadcast(value);};
 $('wfBroadcastClear').onclick=async()=>{if(!confirm('Clear this school’s current announcement?'))return;$('wfBroadcastText').value='';await saveBroadcast('');};
 const {data:duesSetting,error:duesLoadError}=await client.from('system_settings').select('value').eq('school_id',ctx.id).eq('key','standard_dues').maybeSingle();
 if(!duesLoadError && duesSetting) $('wfMonthlyDues').value=Number(duesSetting.value||0);

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
 $('wfAuditExport').onclick=()=>{
   const q=($('wfAuditSearch').value||'').toLowerCase(),cat=$('wfAuditCategory').value;
   const filtered=auditRows.filter(x=>(!cat||x.category===cat)&&[x.time_string,x.actor_name,x.action,x.details,x.status,x.category].some(v=>String(v||'').toLowerCase().includes(q)));
   const rows=[['Time','Actor','Category','Action','Details','Status'],...filtered.map(x=>[x.time_string||'',x.actor_name||'',x.category||'',x.action||'',x.details||'',x.status||''])];
    const csv=rows.map(row=>row.map(csvCell).join(',')).join('\r\n');
    const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download=(ctx.school_code||'school')+'-audit-history.csv';a.click();URL.revokeObjectURL(url);
   msg('wfAuditMsg','Audit CSV prepared with '+filtered.length+' entries.');
 };
 $('wfExportCsv').onclick=()=>{
   const rows=[['Record type','Date','Staff ID','Amount GHS','Reference / reason','Status'],...cons.map(x=>['Contribution',x.date,x.teacher_id,x.amount,x.reference||'',reversed.has('contribution:'+x.id)?'REVERSED':'Active']),...pays.map(x=>['Welfare payout',x.date,x.teacher_id,x.amount,x.reason||x.reference||'',reversed.has('payout:'+x.id)?'REVERSED':'Active'])];
   const csv=rows.map(row=>row.map(csvCell).join(',')).join('\r\n');
   const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download=(ctx.school_code||'school')+'-welfare-ledgers.csv';a.click();URL.revokeObjectURL(url);msg('wfReportMsg','CSV export prepared for download.');
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
 auditNav?.addEventListener('click',()=>{
   if(auditView){
     auditView.classList.remove('hidden');
     auditView.setAttribute('aria-hidden','false');
   }
   loadAudit();
 },{passive:true});
 
 let editingTeacherId=null;
 let selectedPassportData=null;
 $('wfPassport').addEventListener('change',()=>{
   selectedPassportData=null;
   const file=$('wfPassport').files?.[0];
   const preview=$('wfPassportPreview');
   if(!file){preview.textContent='';return;}
   if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>1024*1024){
     $('wfPassport').value='';preview.textContent='Choose a JPEG, PNG or WebP image no larger than 1 MB.';return;
   }
   const reader=new FileReader();
   reader.onload=()=>{selectedPassportData=String(reader.result||'');preview.textContent='Photo ready to save.';};
   reader.onerror=()=>{selectedPassportData=null;preview.textContent='The photo could not be read. Please choose it again.';};
   reader.readAsDataURL(file);
 });
 function resetTeacherForm(){editingTeacherId=null;selectedPassportData=null;$('wfTeacher').reset();$('wfPassportPreview').textContent='';$('wfTid').disabled=false;$('wfTeacherSave').textContent='Register teacher';msg('wfTeacherMsg','');}
 $('wfTeacherCancel').onclick=resetTeacherForm;
 $('wfManageTeacherRows').addEventListener('click',async e=>{
   const remove=e.target.closest('[data-wf-remove]');
   if(remove){
     const t=teachers.find(x=>String(x.id)===remove.dataset.wfRemove);if(!t)return;
     if(!confirm('Deactivate '+t.name+'? The profile and all historical finance records will be retained.'))return;
     const reason=prompt('Enter a reason for deactivation (required for the audit trail):');if(!reason||!reason.trim())return alert('Deactivation cancelled. A reason is required.');
     const {error}=await client.from('teachers').update({is_active:false}).eq('id',t.id).eq('school_id',ctx.id);
     if(error)return alert('Teacher was not deactivated. Check school permissions and the teacher status migration.');
     const auditOk=await audit(client,ctx,'Deactivate teacher profile',t.name+'; reason: '+reason.trim(),t.id);
     await refreshWorkflow();if(!auditOk)alert('Profile deactivated, but audit logging failed. Contact the platform administrator.');return;
   }
   const restore=e.target.closest('[data-wf-restore]');
   if(restore){const t=teachers.find(x=>String(x.id)===restore.dataset.wfRestore);if(!t)return;if(!confirm('Restore '+t.name+' to the active register?'))return;const {error}=await client.from('teachers').update({is_active:true}).eq('id',t.id).eq('school_id',ctx.id);if(error)return alert('Teacher could not be restored. Check school permissions.');const ok=await audit(client,ctx,'Restore teacher profile',t.name,t.id);await refreshWorkflow();if(!ok)alert('Teacher restored, but audit logging failed.');return;}
   const b=e.target.closest('[data-wf-edit]');if(!b)return;const t=teachers.find(x=>String(x.id)===b.dataset.wfEdit);if(!t)return;editingTeacherId=t.id;$('wfTid').value=t.id;$('wfTid').disabled=true;$('wfName').value=t.name||'';$('wfPhone').value=t.phone||'';$('wfRank').value=t.rank||'';$('wfClass').value=t.class_name||'';selectedPassportData=null;$('wfPassport').value='';$('wfPassportPreview').textContent=t.passport?'Existing passport photo saved. Choose a new image to replace it.':'';$('wfTeacherSave').textContent='Save changes';msg('wfTeacherMsg','Editing '+t.name+'.');$('wfTid').scrollIntoView({behavior:'smooth',block:'center'});
 });
 $('wfTeacher').onsubmit=async e=>{e.preventDefault();if($('wfPassport').files?.length&&!selectedPassportData)return msg('wfTeacherMsg','Wait for the photo to finish loading, or remove it and save again.',true);const row={id:$('wfTid').value.trim(),name:$('wfName').value.trim(),phone:$('wfPhone').value.trim()||null,rank:$('wfRank').value.trim()||null,class_name:$('wfClass').value.trim()||null,school_id:ctx.id};if(selectedPassportData)row.passport=selectedPassportData;msg('wfTeacherMsg','Saving…');
   const result=editingTeacherId?await client.from('teachers').update({name:row.name,phone:row.phone,rank:row.rank,class_name:row.class_name,...(selectedPassportData?{passport:selectedPassportData}:{})}).eq('id',editingTeacherId).eq('school_id',ctx.id):await client.from('teachers').insert(row);
   if(result.error){msg('wfTeacherMsg',editingTeacherId?'Changes were not saved. Check school permissions.':'Not saved. Check the staff ID and school permissions.',true);return;}
   const auditOk=await audit(client,ctx,editingTeacherId?'Update teacher profile':'Register teacher',row.name,row.id);resetTeacherForm();await refreshWorkflow();msg('wfTeacherMsg',auditOk?(editingTeacherId?'Teacher profile updated.':'Teacher registered.'):'Saved, but the audit entry failed. Notify the platform administrator.',!auditOk);
 };
 $('wfContribution').onsubmit=async e=>{e.preventDefault();const teacher_id=$('wfConTeacher').value,amount=Number($('wfConAmount').value);if(!teacher_id||!Number.isFinite(amount)||amount<=0)return msg('wfConMsg','Choose a teacher and a positive amount.',true);const teacher=teachers.find(t=>String(t.id)===String(teacher_id));if(!teacher)return msg('wfConMsg','The selected teacher could not be verified. Refresh the register and try again.',true);const confirmation='Confirm contribution recording?\n\nGHS '+amount.toFixed(2)+' will be recorded as a contribution in the name of '+teacher.name+'.\n\nSelect OK to commit or Cancel to stop.';if(!window.confirm(confirmation))return msg('wfConMsg','Contribution not saved.');const row={teacher_id,amount,date:$('wfConDate').value,reference:$('wfConRef').value.trim()||null,school_id:ctx.id};msg('wfConMsg','Saving contribution for '+teacher.name+'…');const {error}=await client.from('contributions').insert(row);if(error)return msg('wfConMsg','Not saved. Check school permissions.',true);const auditOk=await audit(client,ctx,'Record contribution','GHS '+amount.toFixed(2)+' recorded in the name of '+teacher.name,teacher_id);$('wfContribution').reset();$('wfConDate').value=today();await refreshWorkflow();msg('wfConMsg',auditOk?'Contribution of GHS '+amount.toFixed(2)+' recorded in the name of '+teacher.name+'.':'Contribution saved, but the audit entry failed. Notify the platform administrator.',!auditOk);};
 $('wfConRows').addEventListener('click',async e=>{const b=e.target.closest('[data-wf-reverse]');if(!b)return;const type=b.dataset.wfReverse,id=b.dataset.wfId;const rows=type==='contribution'?cons:pays;const tx=rows.find(x=>String(x.id)===String(id));if(!tx||reversed.has(type+':'+id))return;const reason=prompt('Enter the reason for reversing this '+type+'. The original record will be retained:');if(!reason||!reason.trim())return; if(!confirm('Confirm reversal of GHS '+money(tx.amount)+'? The original transaction will remain visible and be excluded from active totals.'))return;const {data:{user}}=await client.auth.getUser();const {error}=await client.from('transaction_reversals').insert({school_id:ctx.id,transaction_type:type,transaction_id:id,teacher_id:tx.teacher_id,amount:tx.amount,transaction_date:tx.date,reason:reason.trim(),reversed_by:user?.email||'School administrator'});if(error){alert(error.code==='23505'?'This transaction has already been reversed.':'Reversal was not saved. Check school permissions and reversal-table policies.');return;}const ok=await audit(client,ctx,'Reverse '+type,'Original transaction '+id+'; GHS '+Number(tx.amount).toFixed(2)+'; reason: '+reason.trim(),tx.teacher_id);await refreshWorkflow();if(!ok)alert('Reversal saved, but the audit entry failed.');});
 $('wfPayRows').addEventListener('click',async e=>{const b=e.target.closest('[data-wf-reverse]');if(!b)return;const type=b.dataset.wfReverse,id=b.dataset.wfId;const rows=type==='contribution'?cons:pays;const tx=rows.find(x=>String(x.id)===String(id));if(!tx||reversed.has(type+':'+id))return;const reason=prompt('Enter the reason for reversing this '+type+'. The original record will be retained:');if(!reason||!reason.trim())return;if(!confirm('Confirm reversal of GHS '+money(tx.amount)+'? The original transaction will remain visible and be excluded from active totals.'))return;const {data:{user}}=await client.auth.getUser();const {error}=await client.from('transaction_reversals').insert({school_id:ctx.id,transaction_type:type,transaction_id:id,teacher_id:tx.teacher_id,amount:tx.amount,transaction_date:tx.date,reason:reason.trim(),reversed_by:user?.email||'School administrator'});if(error){alert(error.code==='23505'?'This transaction has already been reversed.':'Reversal was not saved. Check school permissions and reversal-table policies.');return;}const ok=await audit(client,ctx,'Reverse '+type,'Original transaction '+id+'; GHS '+Number(tx.amount).toFixed(2)+'; reason: '+reason.trim(),tx.teacher_id);await refreshWorkflow();if(!ok)alert('Reversal saved, but the audit entry failed.');});
 $('wfPayout').onsubmit=async e=>{e.preventDefault();const teacher_id=$('wfPayTeacher').value,amount=Number($('wfPayAmount').value);if(!teacher_id||!Number.isFinite(amount)||amount<=0)return msg('wfPayMsg','Choose a teacher and enter a positive amount.',true);const activeContributions=cons.filter(x=>!reversed.has('contribution:'+String(x.id))).reduce((sum,x)=>sum+Number(x.amount||0),0);const activePayouts=pays.filter(x=>!reversed.has('payout:'+String(x.id))).reduce((sum,x)=>sum+Number(x.amount||0),0);const available=Math.round((activeContributions-activePayouts)*100)/100;if(amount>available+0.001)return msg('wfPayMsg','Payout exceeds the available school fund balance of GHS '+money(Math.max(0,available))+'. Reverse or reconcile records before proceeding.',true);if(!confirm('Confirm welfare payout of GHS '+amount.toFixed(2)+'? Available balance after payout: GHS '+money(available-amount)+'.'))return;const row={teacher_id,amount,date:$('wfPayDate').value,reason:$('wfPayReason').value.trim(),reference:$('wfPayRef').value.trim()||null,school_id:ctx.id};msg('wfPayMsg','Saving…');const {error}=await client.rpc('record_school_welfare_payout',{p_school_id:ctx.id,p_teacher_id:teacher_id,p_amount:amount,p_date:row.date,p_reason:row.reason,p_reference:row.reference});if(error){console.warn('Secure payout RPC failed',error.code,error.message);return msg('wfPayMsg',error.code==='23514'?'Payout was not saved: the available school fund balance may be insufficient, or the amount/reason/date is invalid. Refresh the ledger and check the details.':'Payout was not saved. The secure database check failed; no payout was recorded. Check administrator access and try again.',true);}const auditOk=await audit(client,ctx,'Record payout','GHS '+amount.toFixed(2)+' — '+row.reason,teacher_id);$('wfPayout').reset();$('wfPayDate').value=today();await refreshWorkflow();msg('wfPayMsg',auditOk?'Payout recorded.':'Payout saved, but the audit entry failed. Notify the platform administrator.',!auditOk);};
   return true;
 }catch(error){
   // Report initialization failure so the caller cannot mistake an unmounted
   // Admin Panel for a successful workflow setup.
   console.error('[School Welfare] Workflow initialization failed:',error?.message||error);
   return false;
 }
};
})();
