const STORAGE_KEY = 'ntonso_sda_welfare_data_v3';
const DUES_KEY = 'ntonso_sda_standard_dues_v3';
const THEME_KEY = 'ntonso_sda_theme_v3';
const ADMIN_PASSWORDS = ['sda2026', '1234'];

const RANK_OPTIONS = [
    'PS', 'ADII', 'ADI', 'DD',
    'Assistant Director II', 'Assistant Director I', 'Deputy Director',
    '14. Headmaster', '15. Assistant Headmaster', '16. Headmistress'
];

let adminLoggedIn = false;
let selectedTeacherId = null;
let editingMemberId = null;
let welfareData = loadData();
let standardMonthlyDues = Number(localStorage.getItem(DUES_KEY) || 100);

function loadData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) {
            return {
                teachers: [
                    { id: 'STF001', name: 'Collins Adarkwa Baiden', phone: '0240000001', rank: 'Assistant Director II', className: 'BS6', payments: [{ date: '2026-09-01', amount: 100, reference: 'PAY-001' }], payouts: [] },
                    { id: 'STF002', name: 'Edwardina Appiah Mensah', phone: '0240000002', rank: 'ADII', className: 'BS5', payments: [{ date: '2026-09-01', amount: 100, reference: 'PAY-002' }], payouts: [] },
                    { id: 'STF003', name: 'Madam Cassandra Yeboah', phone: '0240000003', rank: 'ADI', className: 'BS4', payments: [{ date: '2026-09-01', amount: 100, reference: 'PAY-003' }], payouts: [] }
                ]
            };
        }
        const parsed = JSON.parse(saved);
        if (!parsed || !Array.isArray(parsed.teachers)) return { teachers: [] };
        parsed.teachers.forEach(t => {
            if (!Array.isArray(t.payments)) t.payments = [];
            if (!Array.isArray(t.payouts)) t.payouts = [];
        });
        return parsed;
    } catch (e) {
        return { teachers: [] };
    }
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(welfareData));
}

document.addEventListener('DOMContentLoaded', () => {
    populateRankSelects();
    initializeDates();
    applySavedTheme();
    renderAll();
    updateAdminInterface();
});

function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDate(ds) {
    if (!ds) return '-';
    const d = new Date(`${ds}T00:00:00`);
    return isNaN(d.getTime()) ? ds : d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function monthYear(ds) {
    if (!ds) return '-';
    const d = new Date(`${ds}T00:00:00`);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

function initializeDates() {
    const today = todayISO();
    if (document.getElementById('adminPaymentDate')) document.getElementById('adminPaymentDate').value = today;
    if (document.getElementById('adminWithdrawalDate')) document.getElementById('adminWithdrawalDate').value = today;
    if (document.getElementById('reportMonthInput')) document.getElementById('reportMonthInput').value = today.slice(0, 7);
}

function money(amount) {
    return 'GHS ' + Number(amount || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function generateReference(p) { return p + '-' + Date.now().toString().slice(-8); }
function generateDocumentId(p) { return `${p}-${new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)}`; }
function initials(name) { return name ? name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() : '--'; }

function populateRankSelects() {
    [document.getElementById('newStaffGrade'), document.getElementById('editStaffGrade')].forEach(sel => {
        if (!sel) return;
        sel.innerHTML = '<option value="">Select Rank / Grade</option>';
        RANK_OPTIONS.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r; opt.textContent = r;
            sel.appendChild(opt);
        });
    });
}

function getTeacherById(id) { return welfareData.teachers.find(t => String(t.id) === String(id)); }
function getSelectedTeacher() {
    if (!selectedTeacherId && welfareData.teachers.length) selectedTeacherId = welfareData.teachers[0].id;
    return getTeacherById(selectedTeacherId);
}

function switchTeacher(id) {
    if (!id) return;
    selectedTeacherId = id;
    if (document.getElementById('teacherSelect')) document.getElementById('teacherSelect').value = id;
    if (document.getElementById('statementTeacherSelect')) document.getElementById('statementTeacherSelect').value = id;
    renderAll();
}

function populateTeacherSelects() {
    [document.getElementById('teacherSelect'), document.getElementById('statementTeacherSelect'), document.getElementById('adminPaymentTeacherSelect'), document.getElementById('adminWithdrawalTeacherSelect')].forEach(sel => {
        if (!sel) return;
        const cur = sel.value;
        sel.innerHTML = '';
        if (!welfareData.teachers.length) {
            sel.innerHTML = '<option value="">No members registered</option>';
            return;
        }
        welfareData.teachers.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id; opt.textContent = `${t.name} (${t.id})`;
            sel.appendChild(opt);
        });
        if (cur && welfareData.teachers.some(t => String(t.id) === String(cur))) sel.value = cur;
        else if (selectedTeacherId) sel.value = selectedTeacherId;
    });
}

function renderAll() {
    populateTeacherSelects();
    renderDashboard();
    renderTeachersSection();
    renderPaymentsSection();
    renderWelfareSection();
    renderAdminRoster();
    renderAdminSettings();
}

function renderDashboard() {
    const t = getSelectedTeacher();
    const fund = getTotalContributions() - getTotalPayouts();
    document.getElementById('statTotalFund').textContent = money(fund);
    document.getElementById('statMonthlyRate').textContent = money(standardMonthlyDues);

    if (!t) {
        document.getElementById('headerTeacherName').textContent = 'No Teacher';
        document.getElementById('currentTeacherName').textContent = 'No member registered';
        document.getElementById('paymentTableBody').innerHTML = '<tr><td colspan="5" class="text-center py-6 text-slate-400">No member registered.</td></tr>';
        document.getElementById('withdrawalTableBody').innerHTML = '<tr><td colspan="5" class="text-center py-6 text-slate-400">No member registered.</td></tr>';
        return;
    }

    document.getElementById('headerTeacherName').textContent = t.name;
    document.getElementById('currentTeacherName').textContent = t.name;
    document.getElementById('currentTeacherGrade').textContent = t.rank || '--';
    document.getElementById('currentTeacherStaffId').textContent = t.id || '--';
    document.getElementById('currentTeacherPhone').textContent = t.phone || '--';
    document.getElementById('currentTeacherClass').textContent = t.className || '--';
    document.getElementById('teacherAvatar').textContent = initials(t.name);

    const mTotal = t.payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    document.getElementById('statMemberTotal').textContent = money(mTotal);
    document.getElementById('statMemberContribCount').textContent = `${t.payments.length} Payment${t.payments.length === 1 ? '' : 's'}`;

    const sorted = [...t.payments].sort((a, b) => String(b.date).localeCompare(String(a.date)));
    if (sorted.length) {
        document.getElementById('statLastPayment').textContent = money(sorted[0].amount);
        document.getElementById('statLastMonthName').textContent = `${monthYear(sorted[0].date)} • ${formatDate(sorted[0].date)}`;
    } else {
        document.getElementById('statLastPayment').textContent = 'N/A';
        document.getElementById('statLastMonthName').textContent = '-';
    }

    document.getElementById('paymentTableBody').innerHTML = t.payments.length ? t.payments.map(p => `<tr><td class="px-6 py-3">${monthYear(p.date)}</td><td class="px-6 py-3">${p.reference}</td><td class="px-6 py-3 font-bold">${money(p.amount)}</td><td class="px-6 py-3">${formatDate(p.date)}</td><td class="px-6 py-3"><span class="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">Paid</span></td></tr>`).join('') : '<tr><td colspan="5" class="text-center py-6 text-slate-400">No contributions found.</td></tr>';
    document.getElementById('withdrawalTableBody').innerHTML = t.payouts.length ? t.payouts.map(w => `<tr><td class="px-6 py-3">${w.reference}</td><td class="px-6 py-3 font-semibold">${t.name}</td><td class="px-6 py-3">${w.reason}</td><td class="px-6 py-3 font-bold text-rose-600">${money(w.amount)}</td><td class="px-6 py-3">${formatDate(w.date)}</td></tr>`).join('') : '<tr><td colspan="5" class="text-center py-6 text-slate-400">No payouts recorded.</td></tr>';
}

function renderTeachersSection() {
    document.getElementById('teachersSectionBody').innerHTML = welfareData.teachers.length ? welfareData.teachers.map(t => {
        const tot = t.payments.reduce((s, p) => s + Number(p.amount || 0), 0);
        return `<tr><td class="px-5 py-3 font-semibold">${t.id}</td><td class="px-5 py-3 font-bold">${t.name}</td><td class="px-5 py-3">${t.phone}</td><td class="px-5 py-3">${t.rank}</td><td class="px-5 py-3">${t.className}</td><td class="px-5 py-3 font-bold">${money(tot)}</td><td class="px-5 py-3"><button onclick="openEditMemberModal('${t.id}')" class="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 font-bold text-[10px]">Edit</button></td></tr>`;
    }).join('') : '<tr><td colspan="7" class="text-center py-6 text-slate-400">No members registered.</td></tr>';
}

function renderPaymentsSection() {
    document.getElementById('paymentTotalAll').textContent = money(getTotalContributions());
    document.getElementById('paymentMemberCount').textContent = welfareData.teachers.length;
    document.getElementById('paymentMonthlyRate').textContent = money(standardMonthlyDues);
    const recs = [];
    welfareData.teachers.forEach(t => t.payments.forEach(p => recs.push({ t, p })));
    recs.sort((a, b) => String(b.p.date).localeCompare(String(a.p.date)));
    document.getElementById('allPaymentsBody').innerHTML = recs.length ? recs.map(r => `<tr><td class="px-5 py-3 font-semibold">${r.t.name}</td><td class="px-5 py-3">${monthYear(r.p.date)}</td><td class="px-5 py-3">${r.p.reference}</td><td class="px-5 py-3 font-bold text-emerald-600">${money(r.p.amount)}</td><td class="px-5 py-3">${formatDate(r.p.date)}</td></tr>`).join('') : '<tr><td colspan="5" class="text-center py-6 text-slate-400">No contributions found.</td></tr>';
}

function renderWelfareSection() {
    const payouts = getTotalPayouts();
    document.getElementById('welfareTotalWithdrawn').textContent = money(payouts);
    document.getElementById('welfareCurrentFund').textContent = money(getTotalContributions() - payouts);
    document.getElementById('welfareMemberCount').textContent = welfareData.teachers.length;
    const recs = [];
    welfareData.teachers.forEach(t => t.payouts.forEach(w => recs.push({ t, w })));
    recs.sort((a, b) => String(b.w.date).localeCompare(String(a.w.date)));
    document.getElementById('allWithdrawalsBody').innerHTML = recs.length ? recs.map(r => `<tr><td class="px-5 py-3">${r.w.reference}</td><td class="px-5 py-3 font-semibold">${r.t.name}</td><td class="px-5 py-3">${r.w.reason}</td><td class="px-5 py-3 font-bold text-rose-600">${money(r.w.amount)}</td><td class="px-5 py-3">${formatDate(r.w.date)}</td></tr>`).join('') : '<tr><td colspan="5" class="text-center py-6 text-slate-400">No payouts recorded.</td></tr>';
}

function renderAdminRoster() {
    const body = document.getElementById('masterRosterBody');
    if (!body) return;
    if (!adminLoggedIn) {
        body.innerHTML = '<tr><td colspan="7" class="text-center py-6 text-slate-400">Admin login required.</td></tr>';
        return;
    }
    body.innerHTML = welfareData.teachers.length ? welfareData.teachers.map(t => {
        const tot = t.payments.reduce((s, p) => s + Number(p.amount || 0), 0);
        return `<tr><td class="px-4 py-3 font-semibold">${t.id}</td><td class="px-4 py-3 font-bold">${t.name}</td><td class="px-4 py-3">${t.phone}</td><td class="px-4 py-3">${t.rank}</td><td class="px-4 py-3">${t.className}</td><td class="px-4 py-3 font-bold">${money(tot)}</td><td class="px-4 py-3"><button onclick="openEditMemberModal('${t.id}')" class="px-2.5 py-1.5 rounded-lg bg-blue-100 text-blue-700 font-bold mr-1">Edit</button><button onclick="handleRemoveStaff('${t.id}')" class="px-2.5 py-1.5 rounded-lg bg-rose-100 text-rose-700 font-bold">Del</button></td></tr>`;
    }).join('') : '<tr><td colspan="7" class="text-center py-6 text-slate-400">No members registered.</td></tr>';
}

function renderAdminSettings() {
    if (document.getElementById('standardMonthlyDuesInput')) document.getElementById('standardMonthlyDuesInput').value = standardMonthlyDues;
    if (document.getElementById('adminCurrentDues')) document.getElementById('adminCurrentDues').textContent = money(standardMonthlyDues);
}

function handlePortalLogin(event) {
    event.preventDefault();
    const val = document.getElementById('gatewayInput').value.trim();
    const errorEl = document.getElementById('gatewayError');
    if (!val) { errorEl.classList.remove('hidden'); return; }

    if (ADMIN_PASSWORDS.includes(val)) {
        adminLoggedIn = true;
        document.getElementById('loginGatewayModal').classList.add('hidden');
        updateAdminInterface();
        renderAll();
        showToast('Administrator session started.', 'success');
        return;
    }

    const matched = welfareData.teachers.find(t => String(t.id).toLowerCase() === val.toLowerCase() || String(t.name).toLowerCase().includes(val.toLowerCase()));
    if (matched) {
        adminLoggedIn = false;
        selectedTeacherId = matched.id;
        document.getElementById('loginGatewayModal').classList.add('hidden');
        updateAdminInterface();
        renderAll();
        showSection('dashboard', null, true);
        showToast(`Welcome, ${matched.name}!`, 'success');
    } else {
        errorEl.classList.remove('hidden');
    }
}

function handleAdminLogin(event) {
    event.preventDefault();
    const pass = document.getElementById('adminPasswordInput').value;
    if (ADMIN_PASSWORDS.includes(pass)) {
        adminLoggedIn = true;
        document.getElementById('adminAuthError').classList.add('hidden');
        document.getElementById('adminPasswordInput').value = '';
        toggleAdminModal();
        updateAdminInterface();
        renderAll();
        showSection('admin', null, true);
        showToast('Admin access granted.', 'success');
    } else {
        document.getElementById('adminAuthError').classList.remove('hidden');
    }
}

function updateAdminInterface() {
    const btn = document.getElementById('adminToggleBtn');
    const text = document.getElementById('adminBtnText');
    const sumBtn = document.getElementById('fundSummaryButton');
    const sumText = document.getElementById('summaryAccessText');
    const monBtn = document.getElementById('monthlySummaryButton');
    const monText = document.getElementById('monthlySummaryAccessText');
    const roleText = document.getElementById('sidebarUserRoleText');

    if (adminLoggedIn) {
        btn.className = 'px-3 py-2.5 text-xs font-bold rounded-lg bg-emerald-600 text-white flex items-center';
        text.textContent = 'Admin Active';
        if (sumBtn) { sumBtn.classList.remove('opacity-50', 'cursor-not-allowed'); sumBtn.disabled = false; }
        if (sumText) sumText.textContent = 'Administrator access is active.';
        if (monBtn) { monBtn.classList.remove('opacity-50', 'cursor-not-allowed'); monBtn.disabled = false; }
        if (monText) monText.textContent = 'Administrator access is active.';
        if (roleText) roleText.textContent = 'Administrator';
    } else {
        btn.className = 'px-3 py-2.5 text-xs font-bold rounded-lg bg-sdaGold-500 text-sdaNavy-900 flex items-center';
        text.textContent = 'Admin Access';
        if (sumBtn) { sumBtn.classList.add('opacity-50', 'cursor-not-allowed'); sumBtn.disabled = true; }
        if (sumText) sumText.textContent = 'This report is available to the Administrator only.';
        if (monBtn) { monBtn.classList.add('opacity-50', 'cursor-not-allowed'); monBtn.disabled = true; }
        if (monText) monText.textContent = 'This report is available to the Administrator only.';
        if (roleText) {
            const t = getSelectedTeacher();
            roleText.textContent = t ? t.name : 'Portal User';
        }
    }
}

function handleSidebarAuthAction() {
    document.getElementById('gatewayInput').value = '';
    document.getElementById('gatewayError').classList.add('hidden');
    document.getElementById('loginGatewayModal').classList.remove('hidden');
}

function requireAdmin() {
    if (adminLoggedIn) return true;
    toggleAdminModal();
    showToast('Administrator login required.', 'error');
    return false;
}

function requestAdminSection() {
    if (!adminLoggedIn) { toggleAdminModal(); return; }
    showSection('admin', null, true);
}

function logoutAdmin() {
    adminLoggedIn = false;
    updateAdminInterface();
    handleSidebarAuthAction();
    showToast('Admin session ended.', 'success');
}

function getTotalContributions() { return welfareData.teachers.reduce((s, t) => s + t.payments.reduce((acc, p) => acc + Number(p.amount || 0), 0), 0); }
function getTotalPayouts() { return welfareData.teachers.reduce((s, t) => s + t.payouts.reduce((acc, w) => acc + Number(w.amount || 0), 0), 0); }

function handleAddNewStaff(e) {
    e.preventDefault();
    if (!requireAdmin()) return;
    const id = document.getElementById('newStaffId').value.trim();
    const name = document.getElementById('newStaffName').value.trim();
    const phone = document.getElementById('newStaffPhone').value.trim();
    const rank = document.getElementById('newStaffGrade').value;
    const className = document.getElementById('newStaffClass').value.trim();

    if (welfareData.teachers.some(t => t.id.toLowerCase() === id.toLowerCase())) {
        showToast('Staff ID already exists.', 'error');
        return;
    }
    welfareData.teachers.push({ id, name, phone, rank, className, payments: [], payouts: [] });
    saveData();
    selectedTeacherId = id;
    document.getElementById('addStaffForm').reset();
    renderAll();
    showToast('Staff added successfully.', 'success');
}

function handleRecordPayment(e) {
    e.preventDefault();
    if (!requireAdmin()) return;
    const teacherId = document.getElementById('adminPaymentTeacherSelect').value;
    const date = document.getElementById('adminPaymentDate').value;
    const amount = Number(document.getElementById('adminPaymentAmount').value);
    const teacher = getTeacherById(teacherId);
    if (!teacher) return;

    teacher.payments.push({ date, amount, reference: generateReference('PAY') });
    saveData();
    renderAll();
    showToast('Contribution recorded.', 'success');
}

function handleRecordWithdrawal(e) {
    e.preventDefault();
    if (!requireAdmin()) return;
    const teacherId = document.getElementById('adminWithdrawalTeacherSelect').value;
    const date = document.getElementById('adminWithdrawalDate').value;
    const amount = Number(document.getElementById('adminWithdrawalAmount').value);
    const reason = document.getElementById('adminWithdrawalReason').value;
    const teacher = getTeacherById(teacherId);
    if (!teacher) return;

    if (amount > (getTotalContributions() - getTotalPayouts())) {
        showToast('Withdrawal exceeds fund balance.', 'error');
        return;
    }
    teacher.payouts.push({ date, amount, reason, reference: generateReference('WEL') });
    saveData();
    renderAll();
    showToast('Payout recorded.', 'success');
}

function openEditMemberModal(id) {
    if (!requireAdmin()) return;
    const t = getTeacherById(id);
    if (!t) return;
    editingMemberId = id;
    document.getElementById('editMemberId').value = id;
    document.getElementById('editStaffId').value = t.id;
    document.getElementById('editStaffName').value = t.name;
    document.getElementById('editStaffPhone').value = t.phone;
    document.getElementById('editStaffGrade').value = t.rank;
    document.getElementById('editStaffClass').value = t.className;
    document.getElementById('editMemberModal').classList.remove('hidden');
    document.getElementById('editMemberModal').classList.add('flex');
}

function closeEditMemberModal() {
    document.getElementById('editMemberModal').classList.add('hidden');
    document.getElementById('editMemberModal').classList.remove('flex');
}

function saveEditedMember(e) {
    e.preventDefault();
    if (!requireAdmin()) return;
    const t = getTeacherById(editingMemberId);
    if (!t) return;
    t.id = document.getElementById('editStaffId').value.trim();
    t.name = document.getElementById('editStaffName').value.trim();
    t.phone = document.getElementById('editStaffPhone').value.trim();
    t.rank = document.getElementById('editStaffGrade').value;
    t.className = document.getElementById('editStaffClass').value.trim();
    saveData();
    closeEditMemberModal();
    renderAll();
    showToast('Member updated.', 'success');
}

function handleRemoveStaff(id) {
    if (!requireAdmin()) return;
    if (!confirm('Remove member and records?')) return;
    welfareData.teachers = welfareData.teachers.filter(t => t.id !== id);
    saveData();
    renderAll();
    showToast('Member removed.', 'success');
}

function saveMonthlyDues() {
    if (!requireAdmin()) return;
    standardMonthlyDues = Number(document.getElementById('standardMonthlyDuesInput').value);
    localStorage.setItem(DUES_KEY, standardMonthlyDues);
    renderAll();
    showToast('Standard dues updated.', 'success');
}

function toggleAdminModal() {
    const m = document.getElementById('adminModal');
    m.classList.toggle('hidden');
    m.classList.toggle('flex');
}

async function downloadPDF() {
    const t = getSelectedTeacher();
    if (!t) return;
    document.getElementById('pdfDocId').textContent = generateDocumentId('STMT');
    document.getElementById('pdfIssueDate').textContent = formatDate(todayISO());
    document.getElementById('pdfTeacherName').textContent = t.name;
    document.getElementById('pdfStaffId').textContent = t.id;
    document.getElementById('pdfPhone').textContent = t.phone;
    document.getElementById('pdfGrade').textContent = t.rank;
    document.getElementById('pdfClass').textContent = t.className;
    document.getElementById('pdfTotalPaid').textContent = money(t.payments.reduce((s, p) => s + Number(p.amount), 0));
    document.getElementById('pdfTotalWithdrawn').textContent = money(t.payouts.reduce((s, w) => s + Number(w.amount), 0));

    document.getElementById('pdfTableBody').innerHTML = t.payments.length ? t.payments.map((p, i) => `<tr><td>${i+1}</td><td>${monthYear(p.date)}</td><td>${p.reference}</td><td>${formatDate(p.date)}</td><td class="text-right font-bold">${money(p.amount)}</td></tr>`).join('') : '<tr><td colspan="5" class="text-center">No contributions.</td></tr>';
    document.getElementById('pdfWithdrawalTableBody').innerHTML = t.payouts.length ? t.payouts.map((w, i) => `<tr><td>${i+1}</td><td>${t.name}</td><td>${w.reason}</td><td>${w.reference}</td><td>${formatDate(w.date)}</td><td class="text-right font-bold">${money(w.amount)}</td></tr>`).join('') : '<tr><td colspan="6" class="text-center">No payouts.</td></tr>';

    await html2pdf().from(document.getElementById('statementPdfTemplate')).save(`Statement_${t.name.replace(/\s+/g, '_')}.pdf`);
    showToast('Statement downloaded.', 'success');
}

async function downloadFundSummaryPDF() {
    if (!requireAdmin()) return;
    document.getElementById('summaryMembers').textContent = welfareData.teachers.length;
    document.getElementById('summaryContributions').textContent = money(getTotalContributions());
    document.getElementById('summaryPayouts').textContent = money(getTotalPayouts());
    document.getElementById('summaryNetFund').textContent = money(getTotalContributions() - getTotalPayouts());
    document.getElementById('summaryMembersBody').innerHTML = welfareData.teachers.map((t, i) => `<tr><td>${i+1}</td><td>${t.id}</td><td><b>${t.name}</b></td><td>${t.rank}</td><td class="text-center">${t.payments.length}</td><td class="text-right font-bold">${money(t.payments.reduce((s,p)=>s+Number(p.amount),0))}</td></tr>`).join('');
    await html2pdf().from(document.getElementById('summaryPdfTemplate')).save('Fund_Summary.pdf');
    showToast('Summary downloaded.', 'success');
}

async function downloadMonthlySummaryPDF() {
    if (!requireAdmin()) return;
    const mVal = document.getElementById('reportMonthInput').value;
    if (!mVal) return;
    const [y, m] = mVal.split('-');
    const matches = [];
    welfareData.teachers.forEach(t => t.payments.forEach(p => { if (p.date && p.date.startsWith(`${y}-${m}`)) matches.push({ t, p }); }));
    document.getElementById('monthlySummaryTargetMonth').textContent = new Date(`${y}-${m}-01`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    document.getElementById('monthlySummaryContributionsBody').innerHTML = matches.length ? matches.map((r, i) => `<tr><td>${i+1}</td><td>${r.t.id}</td><td><b>${r.t.name}</b></td><td>${r.p.reference}</td><td>${formatDate(r.p.date)}</td><td class="text-right font-bold">${money(r.p.amount)}</td></tr>`).join('') : '<tr><td colspan="6" class="text-center">No contributions this month.</td></tr>';
    await html2pdf().from(document.getElementById('monthlySummaryPdfTemplate')).save(`Monthly_Report_${y}_${m}.pdf`);
    showToast('Monthly report downloaded.', 'success');
}

function showSection(sec, btn) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`section-${sec}`);
    if (target) { target.classList.remove('hidden'); target.classList.add('active'); }
    document.querySelectorAll('.nav-button').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    document.getElementById('pageTitle').textContent = sec.charAt(0).toUpperCase() + sec.slice(1);
    closeMobileSidebar();
}

function toggleSidebar() {
    const s = document.getElementById('sidebar');
    const m = document.getElementById('mainWrapper');
    s.classList.toggle('sidebar-collapsed');
    m.classList.toggle('ml-72');
    m.classList.toggle('ml-[76px]');
}

function openMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobileOverlay');
    if (sidebar) sidebar.style.transform = 'translateX(0)';
    if (overlay) overlay.classList.remove('hidden');
}

function closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobileOverlay');
    if (sidebar) sidebar.style.transform = 'translateX(-100%)';
    if (overlay) overlay.classList.add('hidden');
}

function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem(THEME_KEY, document.documentElement.classList.contains('dark') ? 'dark' : 'light');
}

function applySavedTheme() {
    if (localStorage.getItem(THEME_KEY) === 'dark') document.documentElement.classList.add('dark');
}

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    document.getElementById('toastMessage').textContent = msg;
    document.getElementById('toastInner').className = `rounded-xl shadow-2xl px-5 py-4 text-sm font-semibold text-white ${type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'}`;
    toast.classList.remove('hidden');
    clearTimeout(window.__t);
    window.__t = setTimeout(() => toast.classList.add('hidden'), 3500);
}
