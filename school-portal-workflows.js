/* School-scoped welfare workflows. Uses the authenticated Supabase client created by school-portal.html. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>Number(n||0).toLocaleString('en-GH',{minimumFractionDigits:2,maximumFractionDigits:2});
const today=()=>new Date().toISOString().slice(0,10);
const csvCell=v=>{let s=String(v??'');if(/^[\s]*[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};

// Tenant names and details are supplied by the authenticated school record.

function addUI(){
 const d=document.createElement('section');d.id='workflows';d.innerHTML=`<style>
#wfAdminPanel{--wf-purple:#6d28d9;--wf-green:#059669;--wf-red:#e11d48;--wf-ink:#07122b;color:var(--wf-ink)}
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
#wfTeacherPanel h3:before{content:"\\f234";background:#ecfdf5;color:#059669}
#wfContributionPanel h3:before{content:"\\f4b9";background:#ecfdf5;color:#059669}
#wfPayoutPanel h3:before,#wfPayoutLedgerPanel h3:before{content:"\\f4b9";background:#fff1f2;color:#e11d48}
#wfStatementPanel h3:before{content:"\\f15c"}
#wfLedgerPanel h3:before{content:"\\f03a"}
#wfBroadcastPanel h3:before{content:"\\f0a1";background:#f3e8ff;color:#7e22ce}
#wfSettingsPanel h3:before{content:"\\f1de";background:#eff6ff;color:#1d4ed8}
#wfReportsPanel h3:before{content:"\\f1c1"}
#wfAuditPanel h3:before{content:"\\f1da"}
#wfMemberSummaryPanel h3:before{content:"\\f0c0"}
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
#workflows #wfTeacherPanel h3:before{content:"\\f234";background:#ecfdf5;color:#059669}
#workflows #wfContributionPanel h3:before{content:"\\f4b9";background:#ecfdf5;color:#059669}
#workflows #wfPayoutPanel h3:before,#workflows #wfResetDataPanel h3:before{content:"\\f071";background:#fff1f2;color:#e11d48}
#workflows #wfLedgerPanel h3:before{content:"\\f03a"}
#workflows #wfStatementPanel h3:before,#workflows #wfReportsPanel h3:before{content:"\\f15c"}
#workflows #wfAuditPanel h3:before{content:"\\f1da"}
#workflows #wfMemberSummaryPanel h3:before{content:"\\f0c0"}
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

</style>
 <section class="wf-admin-hub" id="wfAdminPanel"><div class="panel wf-admin-intro"><div class="wf-admin-intro-top"><div><div class="wf-admin-eyebrow"><i class="fa-solid fa-shield-halved"></i> Secure administration</div><h2>Administration Panel <span class="wf-restricted-badge"><i class="fa-solid fa-lock"></i> Restricted Access</span></h2><p>Manage this school’s members, contributions, monthly dues, welfare payouts, announcements and reports from one organised workspace.</p></div><span class="wf-admin-status"><i class="fa-solid fa-circle-check"></i> Admin mode active</span></div><div class="wf-admin-shortcuts"><span><i class="fa-solid fa-users"></i> Members</span><span><i class="fa-solid fa-coins"></i> Contributions</span><span><i class="fa-solid fa-hand-holding-heart"></i> Welfare</span><span><i class="fa-solid fa-file-lines"></i> Reports</span></div></div>
 <div class="panel" id="wfAdminAccessPanel"><h3>Administrator access &amp; recovery</h3><p class="muted">Change the password for the administrator currently signed in. New administrator invitations remain managed through the secure platform onboarding process; use <strong>Forgot password?</strong> on the school sign-in page for account recovery.</p><form id="wfChangePasswordForm" class="grid"><div><label for="wfCurrentAdminPassword">Current password</label><input id="wfCurrentAdminPassword" type="password" autocomplete="current-password" required></div><div><label for="wfNewAdminPassword">New password</label><input id="wfNewAdminPassword" type="password" autocomplete="new-password" minlength="10" maxlength="128" required><small class="muted">Use at least 10 characters.</small></div><div><label for="wfConfirmAdminPassword">Confirm new password</label><input id="wfConfirmAdminPassword" type="password" autocomplete="new-password" minlength="10" maxlength="128" required></div><div style="align-self:end"><button type="submit"><i class="fa-solid fa-key"></i> Update my password</button></div></form><p id="wfPasswordMsg" class="muted" role="status" aria-live="polite"></p><div class="wf-data-protection"><strong><i class="fa-solid fa-lock"></i> Account security</strong><p class="muted">Administrator access is linked to this school. Account invitations and deactivation are verified server-side.</p></div></div>
 <div class="panel" id="wfAdminUsersPanel"><h3>Register &amp; manage administrators</h3><p class="muted">Invite a new administrator by email. They must accept the invitation and set their own password. A school can have up to 10 active administrators.</p><form id="wfInviteAdminForm" class="grid"><div><label for="wfInviteAdminName">Full name / title</label><input id="wfInviteAdminName" maxlength="120" required placeholder="e.g. Welfare Secretary"></div><div><label for="wfInviteAdminUsername">Admin username</label><input id="wfInviteAdminUsername" maxlength="40" minlength="3" pattern="[A-Za-z0-9._-]{3,40}" required placeholder="e.g. welfare.secretary"></div><div><label for="wfInviteAdminEmail">Email address</label><input id="wfInviteAdminEmail" type="email" maxlength="254" required placeholder="name@example.com"></div><div style="align-self:end"><button type="submit"><i class="fa-solid fa-user-plus"></i> Send administrator invitation</button></div></form><p id="wfAdminUsersMsg" class="muted" role="status" aria-live="polite"></p><div style="overflow:auto"><table><thead><tr><th>Username</th><th>Name / Title</th><th>Status</th><th>Action</th></tr></thead><tbody id="wfAdminUsersRows"><tr><td colspan="4">Loading administrators…</td></tr></tbody></table></div><p class="muted">Deactivation removes this school’s portal access but does not delete the person’s Supabase identity.</p></div>
 <div class="panel" id="wfResetDataPanel"><h3>Reset this school’s welfare data</h3><div class="wf-data-protection"><strong><i class="fa-solid fa-triangle-exclamation"></i> Permanent action</strong><p class="muted">This deletes only this school’s registered members, contribution records, payout records and transaction-reversal records. The audit history and school settings are preserved. This cannot be undone.</p></div><form id="wfResetDataForm" class="grid"><div><label for="wfResetPassword">Current administrator password</label><input id="wfResetPassword" type="password" autocomplete="current-password" required></div><div><label for="wfResetConfirmation">School-specific confirmation</label><input id="wfResetConfirmation" required autocomplete="off" placeholder="RESET:SCHOOLCODE"><small id="wfResetExpected" class="muted">Confirmation phrase will appear after the school loads.</small></div><div><label for="wfResetAllConfirmation">Final safety phrase</label><input id="wfResetAllConfirmation" required autocomplete="off" pattern="RESET ALL" title="Type RESET ALL exactly" placeholder="Type RESET ALL"><small class="muted">Required second confirmation before any records can be cleared.</small></div><div><button type="submit" class="danger"><i class="fa-solid fa-trash-can"></i> Permanently reset this school’s welfare data</button></div></form><p id="wfResetDataMsg" class="muted" role="status" aria-live="polite"></p></div>
 <div class="panel" id="wfTeacherPanel"><h3>Teacher register</h3><label for="wfTeacherSearch">Search teachers</label><input id="wfTeacherSearch" type="search" placeholder="Search name, staff ID, phone, rank or class"><p class="muted">Register and update staff details. Historical finance records are not deleted when a staff profile is changed.</p><form id="wfTeacher" class="grid">
 <div><label>Staff ID</label><input id="wfTid" required maxlength="80"></div><div><label>Full name</label><input id="wfName" required maxlength="160"></div>
 <div><label>Phone</label><input id="wfPhone" maxlength="40"></div><div><label>Rank</label><input id="wfRank" maxlength="100"></div>
 <div><label>Class / Subject / responsibility</label><input id="wfClass" maxlength="100" placeholder="e.g. Primary 6, Mathematics"></div><div><label for="wfPassport">Passport photograph (optional)</label><input id="wfPassport" type="file" accept="image/jpeg,image/png,image/webp"><small class="muted">JPEG, PNG or WebP; maximum 1 MB. Leave blank to keep the current photo.</small><div id="wfPassportPreview" class="muted" aria-live="polite"></div></div><div style="align-self:end;display:flex;gap:8px;flex-wrap:wrap"><button id="wfTeacherSave">Register teacher</button><button id="wfTeacherCancel" class="secondary" type="button">Cancel edit</button></div></form><p id="wfTeacherMsg" class="muted"></p><div style="overflow:auto"><table><thead><tr><th>Staff ID</th><th>Name</th><th>Phone</th><th>Rank</th><th>Class</th><th>Profile actions</th></tr></thead><tbody id="wfManageTeacherRows"></tbody></table></div></div>
 <div class="grid"><div class="panel" id="wfContributionPanel"><h3>Record contribution</h3><form id="wfContribution"><label>Teacher</label><select id="wfConTeacher" required style="width:100%;padding:12px"></select><label>Amount (GHS)</label><input id="wfConAmount" type="number" min=".01" step=".01" required><label>Date</label><input id="wfConDate" type="date" required><label>Reference</label><input id="wfConRef" maxlength="180"><p id="wfConMsg" class="muted"></p><button>Save contribution</button></form></div>
 <div class="panel" id="wfPayoutPanel"><h3>Record welfare payout</h3><form id="wfPayout"><label>Teacher</label><select id="wfPayTeacher" required style="width:100%;padding:12px"></select><label>Amount (GHS)</label><input id="wfPayAmount" type="number" min=".01" step=".01" required><label>Date</label><input id="wfPayDate" type="date" required><label>Reason</label><input id="wfPayReason" maxlength="180" required><label>Reference</label><input id="wfPayRef" maxlength="180"><p id="wfPayMsg" class="muted"></p><button>Save payout</button></form></div></div>
 <div class="grid"><div class="panel" id="wfStatementPanel"><h3>Member PDF statement</h3><p class="muted">Download an individual teacher statement showing contributions, welfare payouts and net position.</p><label for="wfStatementTeacher">Teacher</label><select id="wfStatementTeacher" style="width:100%;padding:12px"></select><button id="wfStatementPdf" type="button" style="margin-top:10px"><i class="fa-solid fa-file-pdf"></i> Download member statement</button><p id="wfStatementMsg" class="muted"></p></div><div class="panel" id="wfLedgerPanel"><h3>Monthly Contribution Ledger</h3><p class="muted">Search and filter this school’s contribution history. Reversed entries remain visible for accountability.</p><div class="grid"><div><label for="wfLedgerSearch">Search ledger</label><input id="wfLedgerSearch" type="search" placeholder="Teacher, staff ID or reference"></div><div><label for="wfLedgerMonth">Filter month</label><input id="wfLedgerMonth" type="month"></div></div><div style="overflow:auto"><table><thead><tr><th>Date</th><th>Teacher</th><th>Amount (GHS)</th><th>Reference</th><th>Reversal</th></tr></thead><tbody id="wfConRows"></tbody></table></div></div>
 <div class="panel" id="wfPayoutLedgerPanel"><h3>Welfare Payouts & Fund Withdrawal Log</h3><p class="muted">Search payout records and retain reversed transactions in the history.</p><label for="wfPayoutSearch">Search payouts</label><input id="wfPayoutSearch" type="search" placeholder="Teacher, staff ID or reason"><div style="overflow:auto"><table><thead><tr><th>Date</th><th>Teacher</th><th>Amount (GHS)</th><th>Reason</th><th>Reversal</th></tr></thead><tbody id="wfPayRows"></tbody></table></div></div></div>
 <div class="panel" id="wfBroadcastPanel"><h3>School announcement</h3><p class="muted">Publish a school-scoped message for the portal. The message is stored with this school’s settings.</p><form id="wfBroadcastForm"><label for="wfBroadcastText">Announcement message</label><textarea id="wfBroadcastText" maxlength="500" rows="3" style="width:100%;padding:12px;border:1px solid var(--line);border-radius:10px;font:inherit" placeholder="Enter an important welfare fund announcement"></textarea><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button type="submit">Publish announcement</button><button id="wfBroadcastClear" class="secondary" type="button">Clear announcement</button></div></form><p id="wfBroadcastMsg" class="muted" role="status"></p></div>
 <div class="panel" id="wfSettingsPanel"><h3>School settings · Monthly dues</h3><p class="muted">Set the standard monthly contribution for this school. This setting is scoped to the current school account.</p><form id="wfDuesForm" class="grid"><div><label for="wfMonthlyDues">Standard monthly dues (GHS)</label><input id="wfMonthlyDues" type="number" min="0" step=".01" required></div><div style="align-self:end"><button>Save monthly dues</button></div></form><p id="wfDuesMsg" class="muted"></p></div>
 <div class="panel" id="wfReportsPanel"><h3>Reports and exports</h3><div class="grid"><div><label for="wfMonth">Reporting month</label><input id="wfMonth" type="month"></div><div style="align-self:end;display:flex;gap:8px;flex-wrap:wrap"><button id="wfMonthlyPdf" type="button">Monthly PDF summary</button><button id="wfExportCsv" type="button" class="secondary">Export ledgers CSV</button></div></div><p id="wfReportMsg" class="muted">Reports include records visible to this school account only.</p></div>
 <div class="panel" id="wfAuditPanel"><div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap"><h3>Audit history</h3><button id="wfAuditExport" type="button" class="secondary">Export audit CSV</button></div><p class="muted">Export includes the currently loaded school-scoped audit records, up to 300 entries.</p><div class="grid"><div><label for="wfAuditSearch">Search audit records</label><input id="wfAuditSearch" placeholder="Search action, actor, details…"></div><div><label for="wfAuditCategory">Category</label><select id="wfAuditCategory"><option value="">All categories</option><option>Welfare portal</option><option>Contribution</option><option>Payout</option><option>Teacher</option></select></div></div><p id="wfAuditMsg" class="muted">Loading audit history…</p><div style="overflow:auto"><table><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Details</th><th>Status</th></tr></thead><tbody id="wfAuditRows"><tr><td colspan="5">Loading…</td></tr></tbody></table></div></div></section>`;
 const dash=$('dashboard');if(dash)dash.appendChild(d);
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
 const existingWorkflows=$('workflows');const retainedRoster=$('schoolTeachers');const overview=$('schoolOverview');if(existingWorkflows&&retainedRoster&&existingWorkflows.contains(retainedRoster)&&overview?.parentElement)overview.parentElement.insertBefore(retainedRoster,overview.nextElementSibling);if(existingWorkflows)existingWorkflows.remove();
 addUI();
 const adminHub=$('wfAdminPanel'),roster=$('schoolTeachers');if(adminHub&&roster)adminHub.insertBefore(roster,adminHub.querySelector('#wfTeacherPanel'));
 $('wfChangePasswordForm')?.addEventListener('submit',async e=>{e.preventDefault();const current=$('wfCurrentAdminPassword').value,newPassword=$('wfNewAdminPassword').value,confirmPassword=$('wfConfirmAdminPassword').value;if(newPassword.length<10)return msg('wfPasswordMsg','Use a new password with at least 10 characters.',true);if(newPassword!==confirmPassword)return msg('wfPasswordMsg','The new passwords do not match.',true);const {data:{user},error:userError}=await client.auth.getUser();if(userError||!user?.email)return msg('wfPasswordMsg','Your signed-in administrator account could not be verified. Sign in again and retry.',true);msg('wfPasswordMsg','Verifying your current password…');const {error:verifyError}=await client.auth.signInWithPassword({email:user.email,password:current});if(verifyError)return msg('wfPasswordMsg','Current password is incorrect. No changes were made.',true);const {error:updateError}=await client.auth.updateUser({password:newPassword});if(updateError)return msg('wfPasswordMsg','Password update failed. Please try again or use password recovery.',true);$('wfChangePasswordForm').reset();msg('wfPasswordMsg','Password updated successfully for the signed-in administrator.');await audit(client,school,'Change administrator password','Administrator password changed through the school portal.');});

 // Tenant branding comes from the authenticated school record supplied by the portal.
 // Load sources independently: a missing optional column/table must not prevent the
 // dashboard's other sections from rendering. Errors are logged without exposing SQL.
 const loadSource=async(label,makeQuery)=>{
   try{
     const result=await makeQuery();
     if(result?.error){console.warn('[School Welfare] '+label+' unavailable:',result.error.code||'',result.error.message||'');return {data:[],error:result.error};}
     return {data:Array.isArray(result?.data)?result.data:[],error:null};
   }catch(error){console.warn('[School Welfare] '+label+' request failed:',error?.message||error);return {data:[],error};}
 };
 const teacherQuery=fields=>loadSource('teacher roster',()=>client.from('teachers').select(fields).eq('school_id',school.id).order('name'));
 // Retry compatible projections independently: older tenants may lack one or both
 // optional profile columns. Never require is_active/passport to show the roster.
 let tr=await teacherQuery('id,name,phone,rank,class_name,is_active,passport');
 if(tr.error)tr=await teacherQuery('id,name,phone,rank,class_name,passport');
 if(tr.error)tr=await teacherQuery('id,name,phone,rank,class_name,is_active');
 if(tr.error){
   tr=await teacherQuery('id,name,phone,rank,class_name');
   if(!tr.error)tr.data=tr.data.map(t=>({...t,is_active:true,passport:null}));
 }else{
   tr.data=tr.data.map(t=>({...t,is_active:typeof t.is_active==='boolean'?t.is_active:true,passport:t.passport??null}));
 }
 const [cr,pr,rr]=await Promise.all([
   loadSource('contribution ledger',()=>client.from('contributions').select('id,teacher_id,amount,date,reference').eq('school_id',school.id).order('date',{ascending:false})),
   loadSource('payout ledger',()=>client.from('payouts').select('id,teacher_id,amount,date,reason,reference').eq('school_id',school.id).order('date',{ascending:false})),
   loadSource('transaction reversals',()=>client.from('transaction_reversals').select('transaction_type,transaction_id,reason,created_at').eq('school_id',school.id))
 ]);
 const teachers=tr.data||[], cons=cr.data||[], pays=pr.data||[], reversals=rr.data||[];
 const sourceWarnings=[];
 if(tr.error)sourceWarnings.push('Teacher register unavailable');
 if(cr.error)sourceWarnings.push('Contribution ledger unavailable');
 if(pr.error)sourceWarnings.push('Payout ledger unavailable');
 if(rr.error)sourceWarnings.push('Reversal status unavailable');
 if(sourceWarnings.length){
   console.warn('[School Welfare] Partial dashboard data for school',school.school_code,sourceWarnings);
 }
 const reversed=new Set(reversals.map(r=>r.transaction_type+':'+r.transaction_id));
 const activeCons=cons.filter(x=>!reversed.has('contribution:'+x.id)), activePays=pays.filter(x=>!reversed.has('payout:'+x.id));
 const teacherById=new Map(teachers.map(t=>[String(t.id),t]));
 const memberSummaryHTML='<div class="panel" id="wfMemberSummaryPanel"><h3>Member fund summary</h3><p class="muted">Active contributions, payouts and net position by teacher; reversed transactions are excluded.</p><label for="wfMemberSearch">Search members</label><input id="wfMemberSearch" type="search" placeholder="Teacher name or staff ID"><div style="overflow:auto"><table><thead><tr><th>Staff ID</th><th>Teacher</th><th>Contributions (GHS)</th><th>Payouts (GHS)</th><th>Net (GHS)</th></tr></thead><tbody id="wfMemberRows"></tbody></table></div></div>';
 const workflowRoot=$('workflows');if(workflowRoot&&!$('wfMemberSummaryPanel'))workflowRoot.insertAdjacentHTML('afterbegin',memberSummaryHTML);
 const renderMemberSummary=()=>{const q=String($('wfMemberSearch')?.value||'').toLowerCase().trim();const rows=teachers.filter(t=>[t.id,t.name].some(v=>String(v||'').toLowerCase().includes(q))).map(t=>{const c=activeCons.filter(x=>String(x.teacher_id)===String(t.id)).reduce((n,x)=>n+Number(x.amount||0),0);const p=activePays.filter(x=>String(x.teacher_id)===String(t.id)).reduce((n,x)=>n+Number(x.amount||0),0);return '<tr><td>'+esc(t.id)+'</td><td>'+esc(t.name)+'</td><td>'+money(c)+'</td><td>'+money(p)+'</td><td><strong>'+money(c-p)+'</strong></td></tr>';});$('wfMemberRows').innerHTML=rows.length?rows.join(''):'<tr><td colspan="5">No matching members.</td></tr>';};
 renderMemberSummary();$('wfMemberSearch').addEventListener('input',renderMemberSummary);
 const teacherLabel=id=>{const t=teacherById.get(String(id));return t?esc(t.name)+' ('+esc(t.id)+')':esc(id||'—')};
 const renderTeacherTables=()=>{const q=String($('wfTeacherSearch')?.value||'').trim().toLowerCase();const visible=teachers.filter(t=>[t.id,t.name,t.phone,t.rank,t.class_name].some(v=>String(v||'').toLowerCase().includes(q)));
 const rosterRows=$('teacherRows');if(rosterRows)rosterRows.innerHTML=visible.length?visible.map(t=>'<tr><td>'+esc(t.id)+'</td><td>'+esc(t.name)+'</td><td>'+esc(t.phone||'—')+'</td><td>'+esc(t.rank||'—')+'</td><td>'+esc(t.class_name||'—')+'</td></tr>').join(''):'<tr><td colspan="5">No matching teachers.</td></tr>';
 $('wfManageTeacherRows').innerHTML=visible.length?visible.map(t=>'<tr><td>'+esc(t.id)+'</td><td>'+esc(t.name)+'</td><td>'+esc(t.phone||'—')+'</td><td>'+esc(t.rank||'—')+'</td><td>'+esc(t.class_name||'—')+'</td><td><span>'+ (t.is_active===false?'Inactive':'Active') +'</span> <button type="button" class="secondary" data-wf-edit="'+esc(t.id)+'">Edit</button> '+'<button type="button" data-wf-activate="'+esc(t.id)+'">Activate / reset login</button> '+(t.is_active===false?'<button type="button" data-wf-restore="'+esc(t.id)+'">Restore</button>':'<button type="button" class="secondary" data-wf-remove="'+esc(t.id)+'">Deactivate</button>')+'</td></tr>').join(''):'<tr><td colspan="6">No matching teachers.</td></tr>';};
 renderTeacherTables();
 $('wfTeacherSearch').addEventListener('input',renderTeacherTables);
 $('wfManageTeacherRows').addEventListener('click',async e=>{
   const button=e.target.closest('[data-wf-activate]');if(!button)return;
   const teacher=teachers.find(t=>String(t.id)===String(button.dataset.wfActivate));
   if(!teacher)return msg('wfTeacherMsg','That teacher is no longer in the loaded roster. Refresh and try again.',true);
   if(teacher.is_active===false)return msg('wfTeacherMsg','Restore this teacher first, then activate the sign-in.',true);
   const isReset=button.textContent.toLowerCase().includes('reset');
   if(!confirm((isReset?'Create or reset':'Activate')+' the secure sign-in for '+teacher.name+' ('+teacher.id+')? A new one-time temporary password will be generated and any previous password will stop working. Share it privately with the teacher.'))return;
   button.disabled=true;msg('wfTeacherMsg','Securing teacher sign-in…');
   try{
     const {data,error}=await client.functions.invoke('provision-teacher-account',{body:{school_id:ctx.id,teacher_id:teacher.id}});
     if(error||!data?.ok)throw new Error(data?.error||error?.message||'Teacher sign-in could not be activated.');
     await audit(client,ctx,'Activate/reset teacher sign-in','Secure teacher account activated/reset for Staff ID '+teacher.id+'.',teacher.id);
     msg('wfTeacherMsg','Sign-in activated for '+teacher.name+'. Temporary password is shown once in the next message.');
     alert('TEACHER SIGN-IN ACTIVATED\\nSchool: '+ctx.name+'\\nTeacher: '+data.teacher_name+'\\nStaff ID: '+data.staff_id+'\\nTemporary password: '+data.temporary_password+'\\n\\nShare this password privately. The teacher must change it after signing in.');
   }catch(error){msg('wfTeacherMsg',error.message||'Teacher sign-in could not be activated. No success was assumed.',true);}
   finally{button.disabled=false;}
 });

 const options='<option value="">Choose teacher</option>'+teachers.filter(t=>t.is_active!==false).map(t=>'<option value="'+esc(t.id)+'">'+esc(t.name)+' ('+esc(t.id)+')</option>').join('');
 $('wfConTeacher').innerHTML=options;$('wfPayTeacher').innerHTML=options;$('wfStatementTeacher').innerHTML=options;
 const reversalCell=(type,x)=>reversed.has(type+':'+x.id)?'<strong>REVERSED</strong> <span class="muted">· '+esc(reversals.find(r=>r.transaction_type===type&&String(r.transaction_id)===String(x.id))?.reason||'Reason recorded')+'</span>':'<button type="button" class="secondary" data-wf-reverse="'+type+'" data-wf-id="'+esc(x.id)+'">Reverse</button>';
 const renderContributionLedger=()=>{const q=String($('wfLedgerSearch')?.value||'').trim().toLowerCase(),month=$('wfLedgerMonth')?.value||'';const rows=cons.filter(x=>(!month||String(x.date||'').startsWith(month))&&[x.teacher_id,x.reference,teacherById.get(String(x.teacher_id))?.name].some(v=>String(v||'').toLowerCase().includes(q)));$('wfConRows').innerHTML=rows.length?rows.map(x=>'<tr><td>'+esc(x.date)+'</td><td>'+teacherLabel(x.teacher_id)+'</td><td>'+money(x.amount)+'</td><td>'+esc(x.reference||'—')+'</td><td>'+reversalCell('contribution',x)+'</td></tr>').join(''):'<tr><td colspan="5">No matching contributions.</td></tr>';};
 renderContributionLedger();$('wfLedgerSearch').addEventListener('input',renderContributionLedger);$('wfLedgerMonth').addEventListener('change',renderContributionLedger);
 const renderPayoutLedger=()=>{const q=String($('wfPayoutSearch')?.value||'').trim().toLowerCase();const rows=pays.filter(x=>[x.teacher_id,x.reason,x.reference,teacherById.get(String(x.teacher_id))?.name].some(v=>String(v||'').toLowerCase().includes(q)));$('wfPayRows').innerHTML=rows.length?rows.map(x=>'<tr><td>'+esc(x.date)+'</td><td>'+teacherLabel(x.teacher_id)+'</td><td>'+money(x.amount)+'</td><td>'+esc(x.reason||x.reference||'—')+'</td><td>'+reversalCell('payout',x)+'</td></tr>').join(''):'<tr><td colspan="5">No matching payouts.</td></tr>';};renderPayoutLedger();$('wfPayoutSearch').addEventListener('input',renderPayoutLedger);
 $('teacherCount').textContent=teachers.filter(t=>t.is_active!==false).length;
 $('contributionTotal').textContent=money(activeCons.reduce((a,x)=>a+Number(x.amount||0),0));
 $('payoutTotal').textContent=money(activePays.reduce((a,x)=>a+Number(x.amount||0),0));
 $('netTotal').textContent=money(activeCons.reduce((a,x)=>a+Number(x.amount||0),0)-activePays.reduce((a,x)=>a+Number(x.amount||0),0));
 const ctx=school;
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
   try{const result=await callAdminManagement({action:'reset',current_password,confirmation});$('wfResetDataForm').reset();$('wfResetExpected').textContent='Required phrase: RESET:'+ctx.school_code;$('wfResetConfirmation').placeholder='RESET:'+ctx.school_code;msg('wfResetDataMsg','Reset completed. Removed '+(result.result?.members_removed??0)+' members, '+(result.result?.contributions_removed??0)+' contributions, '+(result.result?.payouts_removed??0)+' payouts. Audit history preserved.');await refresh();}
   catch(error){msg('wfResetDataMsg',error.message||'Reset failed. No success was assumed.',true);}
 };
 loadSchoolAdmins();
 $('wfMonth').value=new Date().toISOString().slice(0,7);
 const {data:broadcastSetting,error:broadcastLoadError}=await client.from('system_settings').select('value').eq('school_id',ctx.id).eq('key','broadcast_message').maybeSingle();
 if(!broadcastLoadError&&broadcastSetting)$('wfBroadcastText').value=String(broadcastSetting.value||'');
 const saveBroadcast=async value=>{
   msg('wfBroadcastMsg','Saving announcement…');
   const {error}=await client.from('system_settings').upsert({school_id:ctx.id,key:'broadcast_message',value},{onConflict:'school_id,key'});
   if(error){msg('wfBroadcastMsg','Announcement could not be saved. Check the school settings permissions and unique key; no database schema was changed.',true);return;}
   const ok=await audit(client,ctx,value?'Publish school announcement':'Clear school announcement',value?'Announcement updated.':'Announcement cleared.');
   msg('wfBroadcastMsg',ok?(value?'Announcement published.':'Announcement cleared.'):'Announcement saved, but its audit entry failed. Notify the platform administrator.',!ok);
 };
 $('wfBroadcastForm').onsubmit=async e=>{e.preventDefault();const value=$('wfBroadcastText').value.trim();if(!value)return msg('wfBroadcastMsg','Enter an announcement before publishing.',true);if(!confirm('Publish this announcement for this school?'))return;await saveBroadcast(value);};
 $('wfBroadcastClear').onclick=async()=>{if(!confirm('Clear this school’s current announcement?'))return;$('wfBroadcastText').value='';await saveBroadcast('');};
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
 $('wfMonthlyPdf').onclick=()=>{
   const month=$('wfMonth').value;if(!month)return msg('wfReportMsg','Choose a reporting month first.',true);
   if(!window.html2pdf)return msg('wfReportMsg','PDF service is unavailable.',true);
   const mc=activeCons.filter(x=>String(x.date||'').startsWith(month)),mp=activePays.filter(x=>String(x.date||'').startsWith(month));
   const sumC=mc.reduce((a,x)=>a+Number(x.amount||0),0),sumP=mp.reduce((a,x)=>a+Number(x.amount||0),0);
   const report=document.createElement('div');report.style.cssText='padding:24px;background:white;color:#182235;font-family:Arial,sans-serif';
   report.innerHTML='<h1>'+esc(ctx.name)+'</h1><h2>Monthly Welfare Fund Summary</h2><p>School code: '+esc(ctx.school_code)+' | Period: '+esc(month)+'</p><hr><p>Teachers registered: '+teachers.length+'</p><p>Contributions: GHS '+money(sumC)+' ('+mc.length+' entries)</p><p>Welfare payouts: GHS '+money(sumP)+' ('+mp.length+' entries)</p><h3>Contributions</h3><table style="width:100%;border-collapse:collapse"><tr><th>Date</th><th>Staff ID</th><th>Amount</th><th>Reference</th></tr>'+mc.map(x=>'<tr><td>'+esc(x.date)+'</td><td>'+esc(x.teacher_id)+'</td><td>'+money(x.amount)+'</td><td>'+esc(x.reference||'—')+'</td></tr>').join('')+'</table><h3>Payouts</h3><table style="width:100%;border-collapse:collapse"><tr><th>Date</th><th>Staff ID</th><th>Amount</th><th>Reason</th></tr>'+mp.map(x=>'<tr><td>'+esc(x.date)+'</td><td>'+esc(x.teacher_id)+'</td><td>'+money(x.amount)+'</td><td>'+esc(x.reason||x.reference||'—')+'</td></tr>').join('')+'</table>';
   window.html2pdf().set({margin:10,filename:(ctx.school_code||'school')+'-'+month+'-monthly-welfare.pdf',html2canvas:{scale:2},jsPDF:{unit:'mm',format:'a4',orientation:'landscape'}}).from(report).save();msg('wfReportMsg','Monthly PDF report is being prepared.');
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
 $('wfStatementPdf').onclick=()=>{
   const tid=$('wfStatementTeacher').value;
   const teacher=teachers.find(t=>String(t.id)===String(tid));
   if(!teacher){msg('wfStatementMsg','Choose a teacher first.',true);return;}
   if(!window.html2pdf){msg('wfStatementMsg','PDF service is unavailable. Check your internet connection.',true);return;}
   const tc=activeCons.filter(x=>String(x.teacher_id)===String(tid)),tp=activePays.filter(x=>String(x.teacher_id)===String(tid));
   const totalC=tc.reduce((a,x)=>a+Number(x.amount||0),0),totalP=tp.reduce((a,x)=>a+Number(x.amount||0),0);
   const safe=s=>esc(s);
   const report=document.createElement('div');report.style.cssText='padding:24px;color:#182235;background:white;font-family:Arial,sans-serif';
   report.innerHTML='<h1 style="color:#0b1d3a">'+safe(school.name)+'</h1><h2>Individual Welfare Statement</h2><p>School code: '+safe(school.school_code)+' | Generated: '+new Date().toLocaleString()+'</p><hr><p><b>Teacher:</b> '+safe(teacher.name)+'</p><p><b>Staff ID:</b> '+safe(teacher.id)+'</p><p><b>Rank:</b> '+safe(teacher.rank||'—')+' | <b>Class:</b> '+safe(teacher.class_name||'—')+'</p><h3>Summary</h3><p>Total contributions: GHS '+money(totalC)+'</p><p>Total welfare payouts: GHS '+money(totalP)+'</p><p><b>Net member position: GHS '+money(totalC-totalP)+'</b></p><h3>Contribution history</h3><table style="width:100%;border-collapse:collapse"><thead><tr><th>Date</th><th>Amount (GHS)</th><th>Reference</th></tr></thead><tbody>'+tc.map(x=>'<tr><td>'+safe(x.date)+'</td><td>'+money(x.amount)+'</td><td>'+safe(x.reference||'—')+'</td></tr>').join('')+'</tbody></table><h3>Welfare payout history</h3><table style="width:100%;border-collapse:collapse"><thead><tr><th>Date</th><th>Amount (GHS)</th><th>Reason</th></tr></thead><tbody>'+tp.map(x=>'<tr><td>'+safe(x.date)+'</td><td>'+money(x.amount)+'</td><td>'+safe(x.reason||x.reference||'—')+'</td></tr>').join('')+'</tbody></table>';
   window.html2pdf().set({margin:10,filename:(String(teacher.id).replace(/[^a-z0-9_-]/gi,'_')||'member')+'-welfare-statement.pdf',image:{type:'jpeg',quality:.96},html2canvas:{scale:2,useCORS:true},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}}).from(report).save();
   msg('wfStatementMsg','Your statement is being prepared for download.');
 };
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
     await refresh();if(!auditOk)alert('Profile deactivated, but audit logging failed. Contact the platform administrator.');return;
   }
   const restore=e.target.closest('[data-wf-restore]');
   if(restore){const t=teachers.find(x=>String(x.id)===restore.dataset.wfRestore);if(!t)return;if(!confirm('Restore '+t.name+' to the active register?'))return;const {error}=await client.from('teachers').update({is_active:true}).eq('id',t.id).eq('school_id',ctx.id);if(error)return alert('Teacher could not be restored. Check school permissions.');const ok=await audit(client,ctx,'Restore teacher profile',t.name,t.id);await refresh();if(!ok)alert('Teacher restored, but audit logging failed.');return;}
   const b=e.target.closest('[data-wf-edit]');if(!b)return;const t=teachers.find(x=>String(x.id)===b.dataset.wfEdit);if(!t)return;editingTeacherId=t.id;$('wfTid').value=t.id;$('wfTid').disabled=true;$('wfName').value=t.name||'';$('wfPhone').value=t.phone||'';$('wfRank').value=t.rank||'';$('wfClass').value=t.class_name||'';selectedPassportData=null;$('wfPassport').value='';$('wfPassportPreview').textContent=t.passport?'Existing passport photo saved. Choose a new image to replace it.':'';$('wfTeacherSave').textContent='Save changes';msg('wfTeacherMsg','Editing '+t.name+'.');$('wfTid').scrollIntoView({behavior:'smooth',block:'center'});
 });
 $('wfTeacher').onsubmit=async e=>{e.preventDefault();if($('wfPassport').files?.length&&!selectedPassportData)return msg('wfTeacherMsg','Wait for the photo to finish loading, or remove it and save again.',true);const row={id:$('wfTid').value.trim(),name:$('wfName').value.trim(),phone:$('wfPhone').value.trim()||null,rank:$('wfRank').value.trim()||null,class_name:$('wfClass').value.trim()||null,school_id:ctx.id};if(selectedPassportData)row.passport=selectedPassportData;msg('wfTeacherMsg','Saving…');
   const result=editingTeacherId?await client.from('teachers').update({name:row.name,phone:row.phone,rank:row.rank,class_name:row.class_name,...(selectedPassportData?{passport:selectedPassportData}:{})}).eq('id',editingTeacherId).eq('school_id',ctx.id):await client.from('teachers').insert(row);
   if(result.error){msg('wfTeacherMsg',editingTeacherId?'Changes were not saved. Check school permissions.':'Not saved. Check the staff ID and school permissions.',true);return;}
   const auditOk=await audit(client,ctx,editingTeacherId?'Update teacher profile':'Register teacher',row.name,row.id);resetTeacherForm();await refresh();msg('wfTeacherMsg',auditOk?(editingTeacherId?'Teacher profile updated.':'Teacher registered.'):'Saved, but the audit entry failed. Notify the platform administrator.',!auditOk);
 };
 $('wfContribution').onsubmit=async e=>{e.preventDefault();const teacher_id=$('wfConTeacher').value,amount=Number($('wfConAmount').value);if(!teacher_id||amount<=0)return msg('wfConMsg','Choose a teacher and a positive amount.',true);const row={teacher_id,amount,date:$('wfConDate').value,reference:$('wfConRef').value.trim()||null,school_id:ctx.id};msg('wfConMsg','Saving…');const {error}=await client.from('contributions').insert(row);if(error)return msg('wfConMsg','Not saved. Check school permissions.',true);const auditOk=await audit(client,ctx,'Record contribution','GHS '+amount.toFixed(2),teacher_id);$('wfContribution').reset();$('wfConDate').value=today();await refresh();msg('wfConMsg',auditOk?'Contribution recorded.':'Contribution saved, but the audit entry failed. Notify the platform administrator.',!auditOk);};
 $('wfConRows').addEventListener('click',async e=>{const b=e.target.closest('[data-wf-reverse]');if(!b)return;const type=b.dataset.wfReverse,id=b.dataset.wfId;const rows=type==='contribution'?cons:pays;const tx=rows.find(x=>String(x.id)===String(id));if(!tx||reversed.has(type+':'+id))return;const reason=prompt('Enter the reason for reversing this '+type+'. The original record will be retained:');if(!reason||!reason.trim())return; if(!confirm('Confirm reversal of GHS '+money(tx.amount)+'? The original transaction will remain visible and be excluded from active totals.'))return;const {data:{user}}=await client.auth.getUser();const {error}=await client.from('transaction_reversals').insert({school_id:ctx.id,transaction_type:type,transaction_id:id,teacher_id:tx.teacher_id,amount:tx.amount,transaction_date:tx.date,reason:reason.trim(),reversed_by:user?.email||'School administrator'});if(error){alert(error.code==='23505'?'This transaction has already been reversed.':'Reversal was not saved. Check school permissions and reversal-table policies.');return;}const ok=await audit(client,ctx,'Reverse '+type,'Original transaction '+id+'; GHS '+Number(tx.amount).toFixed(2)+'; reason: '+reason.trim(),tx.teacher_id);await refresh();if(!ok)alert('Reversal saved, but the audit entry failed.');});
 $('wfPayRows').addEventListener('click',async e=>{const b=e.target.closest('[data-wf-reverse]');if(!b)return;const type=b.dataset.wfReverse,id=b.dataset.wfId;const rows=type==='contribution'?cons:pays;const tx=rows.find(x=>String(x.id)===String(id));if(!tx||reversed.has(type+':'+id))return;const reason=prompt('Enter the reason for reversing this '+type+'. The original record will be retained:');if(!reason||!reason.trim())return;if(!confirm('Confirm reversal of GHS '+money(tx.amount)+'? The original transaction will remain visible and be excluded from active totals.'))return;const {data:{user}}=await client.auth.getUser();const {error}=await client.from('transaction_reversals').insert({school_id:ctx.id,transaction_type:type,transaction_id:id,teacher_id:tx.teacher_id,amount:tx.amount,transaction_date:tx.date,reason:reason.trim(),reversed_by:user?.email||'School administrator'});if(error){alert(error.code==='23505'?'This transaction has already been reversed.':'Reversal was not saved. Check school permissions and reversal-table policies.');return;}const ok=await audit(client,ctx,'Reverse '+type,'Original transaction '+id+'; GHS '+Number(tx.amount).toFixed(2)+'; reason: '+reason.trim(),tx.teacher_id);await refresh();if(!ok)alert('Reversal saved, but the audit entry failed.');});
 $('wfPayout').onsubmit=async e=>{e.preventDefault();const teacher_id=$('wfPayTeacher').value,amount=Number($('wfPayAmount').value);if(!teacher_id||!Number.isFinite(amount)||amount<=0)return msg('wfPayMsg','Choose a teacher and enter a positive amount.',true);const activeContributions=cons.filter(x=>!reversed.has('contribution:'+String(x.id))).reduce((sum,x)=>sum+Number(x.amount||0),0);const activePayouts=pays.filter(x=>!reversed.has('payout:'+String(x.id))).reduce((sum,x)=>sum+Number(x.amount||0),0);const available=Math.round((activeContributions-activePayouts)*100)/100;if(amount>available+0.001)return msg('wfPayMsg','Payout exceeds the available school fund balance of GHS '+money(Math.max(0,available))+'. Reverse or reconcile records before proceeding.',true);if(!confirm('Confirm welfare payout of GHS '+amount.toFixed(2)+'? Available balance after payout: GHS '+money(available-amount)+'.'))return;const row={teacher_id,amount,date:$('wfPayDate').value,reason:$('wfPayReason').value.trim(),reference:$('wfPayRef').value.trim()||null,school_id:ctx.id};msg('wfPayMsg','Saving…');const {error}=await client.rpc('record_school_welfare_payout',{p_school_id:ctx.id,p_teacher_id:teacher_id,p_amount:amount,p_date:row.date,p_reason:row.reason,p_reference:row.reference});if(error){console.warn('Secure payout RPC failed',error.code,error.message);return msg('wfPayMsg',error.code==='23514'?'Payout was not saved: the available school fund balance may be insufficient, or the amount/reason/date is invalid. Refresh the ledger and check the details.':'Payout was not saved. The secure database check failed; no payout was recorded. Check administrator access and try again.',true);}const auditOk=await audit(client,ctx,'Record payout','GHS '+amount.toFixed(2)+' — '+row.reason,teacher_id);$('wfPayout').reset();$('wfPayDate').value=today();await refresh();msg('wfPayMsg',auditOk?'Payout recorded.':'Payout saved, but the audit entry failed. Notify the platform administrator.',!auditOk);};
 }catch(error){
   // Keep the portal shell rendered; diagnostics stay in the console rather than
   // adding a warning card that displaces the dashboard or hides useful sections.
   console.error('[School Welfare] Workflow initialization stopped safely:',error?.message||error);
 }
};
})();
