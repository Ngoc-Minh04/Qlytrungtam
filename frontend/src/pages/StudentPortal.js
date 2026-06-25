// StudentPortal.js — Portal học viên · Orange gradient · Top tab pills · Glassmorphism
import { initChatbot } from './Chatbot.js';
import { renderMyQR } from './MyQR.js';
import { showToast } from './_shared.js';
const API_BASE = 'http://localhost:3006/api';

function getAuthHeaders() {
  return {
    'x-user-role': localStorage.getItem('userRole') || 'hoc_vien',
    'x-ho-so-id': localStorage.getItem('hoSoId') || '',
    'x-tai-khoan-id': localStorage.getItem('taiKhoanId') || ''
  };
}

function logout() {
  ['isLoggedIn', 'userRole', 'username', 'hoTen', 'taiKhoanId', 'hoSoId', 'chiNhanh'].forEach(k => localStorage.removeItem(k));
  window.location.hash = '/login';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function formatTime(t) { return t ? t.slice(0, 5) : ''; }
function formatMoney(n) {
  if (!n) return '0 ₫';
  return Number(n).toLocaleString('vi-VN') + ' ₫';
}

const STS_CLS = {
  da_hoc: 'bg-green-100 text-green-700 border border-green-200',
  cho_hoc: 'bg-orange-100 text-orange-700 border border-orange-200',
  vang: 'bg-red-100 text-red-700 border border-red-200',
  da_huy: 'bg-slate-100 text-slate-500 border border-slate-200',
  con_han: 'bg-green-100 text-green-700 border border-green-200',
  sap_het_han: 'bg-amber-100 text-amber-700 border border-amber-200',
  het_han: 'bg-red-100 text-red-700 border border-red-200',
  chua_dang_ky: 'bg-slate-100 text-slate-500 border border-slate-200',
  cho_duyet: 'bg-blue-100 text-blue-700 border border-blue-200',
  da_duyet: 'bg-green-100 text-green-700 border border-green-200',
  tu_choi: 'bg-red-100 text-red-700 border border-red-200',
};
const STS_LBL = {
  da_hoc: 'Đã học', cho_hoc: 'Chờ học', vang: 'Vắng mặt', da_huy: 'Đã hủy',
  con_han: 'Còn hạn', sap_het_han: 'Sắp hết hạn', het_han: 'Hết hạn', chua_dang_ky: 'Chưa đăng ký',
  cho_duyet: 'Chờ duyệt', da_duyet: 'Đã duyệt', tu_choi: 'Từ chối',
};

function getSessionStatusLabel(l) {
  if (l.trang_thai !== 'cho_hoc') return STS_LBL[l.trang_thai] || l.trang_thai;
  const now = new Date();
  const datePart = l.ngay_hoc.substring(0, 10);
  const startTime = new Date(`${datePart}T${l.gio_bat_dau.slice(0, 5)}`);
  const endTime = new Date(`${datePart}T${l.gio_ket_thuc.slice(0, 5)}`);
  if (now >= startTime && now <= endTime) return 'Đang học';
  return 'Chờ học';
}

function getSessionStatusClass(l) {
  if (l.trang_thai !== 'cho_hoc') return STS_CLS[l.trang_thai] || 'bg-slate-100 text-slate-500';
  const now = new Date();
  const datePart = l.ngay_hoc.substring(0, 10);
  const startTime = new Date(`${datePart}T${l.gio_bat_dau.slice(0, 5)}`);
  const endTime = new Date(`${datePart}T${l.gio_ket_thuc.slice(0, 5)}`);
  if (now >= startTime && now <= endTime) return 'bg-blue-100 text-blue-700 border border-blue-200';
  return STS_CLS.cho_hoc;
}

const TABS = [
  { id: 'overview',  label: 'Tổng quan',  icon: 'home' },
  { id: 'my-qr',     label: 'Mã QR của tôi', icon: 'qr_code' },
  { id: 'schedule',  label: 'Lịch học',   icon: 'calendar_month' },
  { id: 'diary',     label: 'Sổ liên lạc', icon: 'menu_book' },
  { id: 'tuition',   label: 'Học phí',    icon: 'payments' },
  { id: 'booking',   label: 'Đặt lịch',   icon: 'event_available' },
  { id: 'profile',   label: 'Hồ sơ',      icon: 'person' },
];

// Reset về overview mỗi lần vào lại portal
let _activeTab = 'overview';

export async function renderStudentPortal() {
  _activeTab = 'overview';
  const app = document.getElementById('app');
  const hoTen = localStorage.getItem('hoTen') || 'Học viên';

  app.innerHTML = `
    <div class="min-h-screen bg-[#faf7f4] font-sans" id="sp-root">

      <!-- ── HEADER ─────────────────────────────────────────── -->
      <header class="sticky top-0 z-40 bg-white/70 backdrop-blur-2xl border-b border-orange-100/60 shadow-sm shadow-orange-100/40">

        <div class="flex items-center justify-between px-4 md:px-8 h-14">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-2xl flex items-center justify-center shadow-md shadow-orange-400/30"
                 style="background:linear-gradient(135deg,#FF6B35,#FF9500)">
              <span class="text-white font-black text-sm tracking-tighter">S</span>
            </div>
            <div class="leading-none">
              <p class="text-[10px] text-slate-400 font-medium">Stellar Academy</p>
              <p class="text-xs font-bold text-slate-800">Cổng học viên</p>
            </div>
          </div>

          <div class="flex items-center gap-1.5">
            <!-- Bell -->
            <div class="relative" id="bell-wrapper">
              <button id="bell-btn"
                class="relative w-9 h-9 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-orange-50 transition-all">
                <span class="material-symbols-outlined text-[20px]">notifications</span>
                <span id="bell-badge"
                  class="hidden absolute top-1.5 right-1.5 min-w-[14px] h-3.5 px-0.5 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center leading-none"></span>
              </button>
              <div id="bell-dropdown"
                class="hidden absolute right-0 top-12 w-80 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-300/40 border border-slate-100 z-50 overflow-hidden">
                <div class="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                  <span class="text-xs font-bold text-slate-800">Thông báo</span>
                  <button id="mark-all-read-btn" class="text-[10px] text-orange-500 font-semibold hover:underline">Đọc tất cả</button>
                </div>
                <div id="notif-list" class="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  <div class="p-5 text-xs text-slate-400 text-center">Đang tải...</div>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2 bg-orange-50 rounded-2xl pl-1.5 pr-3 py-1 border border-orange-100">
              <div class="w-6 h-6 rounded-xl flex items-center justify-center text-white font-bold text-[10px] shadow-sm shadow-orange-300/40"
                   style="background:linear-gradient(135deg,#FF6B35,#FF9500)">
                ${hoTen.charAt(0)}
              </div>
              <span class="text-xs font-semibold text-slate-700 max-w-[90px] truncate">${hoTen}</span>
            </div>

            <button onclick="window._spLogout()"
              class="w-9 h-9 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Đăng xuất">
              <span class="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>

        <!-- TOP TAB PILLS -->
        <div class="px-4 md:px-8 pb-3 flex gap-2 overflow-x-auto scrollbar-none" id="sp-tab-bar">
          ${TABS.map(t => `
            <button data-tab="${t.id}"
              class="sp-tab flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200
                ${t.id === _activeTab
                  ? 'text-white shadow-md shadow-orange-300/40'
                  : 'text-slate-500 bg-slate-100 hover:bg-orange-50 hover:text-orange-600'}"
              ${t.id === _activeTab ? 'style="background:linear-gradient(135deg,#FF6B35,#FF9500)"' : ''}>
              <span class="material-symbols-outlined text-[14px]">${t.icon}</span>
              ${t.label}
            </button>`).join('')}
        </div>
      </header>

      <main class="px-4 md:px-8 py-5 pb-10 max-w-3xl mx-auto" id="sp-content">
        <div class="flex items-center justify-center min-h-[300px]">
          <div class="animate-spin w-8 h-8 rounded-full border-[3px] border-orange-200 border-t-orange-500"></div>
        </div>
      </main>
    </div>
  `;

  window._spLogout = logout;
  _setupTabs();
  _setupBell();
  _renderTab('overview');
  initChatbot();
}

/* ────────── TAB NAVIGATION ──────────── */
function _setupTabs() {
  document.querySelectorAll('.sp-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      _activeTab = btn.dataset.tab;
      document.querySelectorAll('.sp-tab').forEach(b => {
        if (b.dataset.tab === _activeTab) {
          b.className = 'sp-tab flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 text-white shadow-md shadow-orange-300/40';
          b.style.background = 'linear-gradient(135deg,#FF6B35,#FF9500)';
        } else {
          b.className = 'sp-tab flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 text-slate-500 bg-slate-100 hover:bg-orange-50 hover:text-orange-600';
          b.style.background = '';
        }
      });
      _renderTab(_activeTab);
    });
  });
}

/* ────────── BELL ──────────── */
async function _setupBell() {
  const btn = document.getElementById('bell-btn');
  const dd  = document.getElementById('bell-dropdown');
  if (!btn) return;
  await _loadNotifications();
  btn.addEventListener('click', e => { e.stopPropagation(); dd.classList.toggle('hidden'); });
  document.addEventListener('click', e => {
    if (!document.getElementById('bell-wrapper')?.contains(e.target)) dd.classList.add('hidden');
  });
  document.getElementById('mark-all-read-btn')?.addEventListener('click', async () => {
    await fetch(`${API_BASE}/notifications/read-all`, { method: 'PUT', headers: getAuthHeaders() });
    await _loadNotifications();
  });
}

async function _loadNotifications() {
  const badge = document.getElementById('bell-badge');
  const list  = document.getElementById('notif-list');
  try {
    const res  = await fetch(`${API_BASE}/notifications?limit=15`, { headers: getAuthHeaders() });
    const data = await res.json();
    const notifs = data.data || [];
    const unread = data.unread_count || 0;
    if (badge) { badge.textContent = unread > 9 ? '9+' : unread; badge.classList.toggle('hidden', unread === 0); }
    if (list) {
      list.innerHTML = notifs.length === 0
        ? `<div class="p-6 text-xs text-slate-400 text-center">Chưa có thông báo</div>`
        : notifs.map(n => `
          <div class="flex gap-3 px-5 py-3 ${n.da_doc ? '' : 'bg-orange-50/50'} hover:bg-slate-50 cursor-pointer transition-colors" onclick="window._spMarkRead(${n.id},this)">
            <div class="w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm shadow-orange-200/40" style="background:linear-gradient(135deg,#FF6B35,#FF9500)">
              <span class="material-symbols-outlined text-white text-[13px]">notifications</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-semibold text-slate-800 truncate">${n.tieu_de}</p>
              <p class="text-[10px] text-slate-400 mt-0.5 line-clamp-2">${n.noi_dung}</p>
              <p class="text-[9px] text-slate-300 mt-1">${formatDate(n.ngay_tao)}</p>
            </div>
            ${!n.da_doc ? '<span class="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0 mt-2"></span>' : ''}
          </div>`).join('');
    }
  } catch (_) {}
}
window._spMarkRead = async (id, el) => {
  await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'PUT', headers: getAuthHeaders() });
  el.classList.remove('bg-orange-50/50'); el.querySelector('.w-2.h-2')?.remove();
  await _loadNotifications();
};

/* ────────── RENDER TAB ──────────── */
async function _renderTab(tab) {
  const c = document.getElementById('sp-content');
  if (!c) return;
  c.innerHTML = `<div class="flex items-center justify-center min-h-[300px]"><div class="animate-spin w-8 h-8 rounded-full border-[3px] border-orange-200 border-t-orange-500"></div></div>`;
  switch (tab) {
    case 'overview': await _tabOverview(c); break;
    case 'my-qr':    await renderMyQR(c);    break;
    case 'schedule': await _tabSchedule(c); break;
    case 'diary':    await _tabDiary(c);    break;
    case 'tuition':  await _tabTuition(c);  break;
    case 'booking':  await _tabBooking(c);  break;
    case 'profile':  await _tabProfile(c);  break;
  }
}

/* ── HELPERS ── */
function _card(content, extra = '') {
  return `<div class="bg-white/80 backdrop-blur-sm rounded-3xl border border-orange-50 shadow-lg shadow-orange-100/30 overflow-hidden ${extra}">${content}</div>`;
}
function _sectionTitle(icon, title) {
  return `<div class="flex items-center gap-2 px-5 py-4 border-b border-slate-50">
    <span class="material-symbols-outlined text-[18px] text-orange-500">${icon}</span>
    <h2 class="text-xs font-bold text-slate-800">${title}</h2>
  </div>`;
}
function _kpi(icon, label, val, unit, color) {
  return `<div class="bg-white/80 backdrop-blur-sm rounded-3xl border border-orange-50 shadow-lg shadow-orange-100/20 p-4">
    <div class="w-8 h-8 rounded-2xl flex items-center justify-center mb-2 shadow-sm" style="background:${color}20">
      <span class="material-symbols-outlined text-[17px]" style="color:${color}">${icon}</span>
    </div>
    <p class="text-xl font-black text-slate-800">${val}</p>
    <p class="text-[10px] text-slate-400 font-medium mt-0.5">${unit} ${label}</p>
  </div>`;
}

/* ── TAB: TỔNG QUAN ── */
async function _tabOverview(c) {
  const hoTen = localStorage.getItem('hoTen') || 'Học viên';
  try {
    const res  = await fetch(`${API_BASE}/student-portal/overview`, { headers: getAuthHeaders() });
    const data = await res.json();
    const d    = data.data || {};
    const goi  = d.goi_hoc_phi;
    const tt   = d.trang_thai;
    const sap  = d.lich_sap_toi  || [];
    const da   = d.lich_da_hoc   || [];
    const kem  = d.goi_hoc_kem   || [];
    const ttM  = tt?.trang_thai_mau || 'chua_dang_ky';

    let daysLeft = '—'; let pct = 0;
    if (goi?.tu_ngay && goi?.den_ngay) {
      const total = (new Date(goi.den_ngay) - new Date(goi.tu_ngay)) / 86400000;
      const left  = Math.max(0, Math.ceil((new Date(goi.den_ngay) - new Date()) / 86400000));
      daysLeft = left; pct = Math.min(100, Math.round((left / total) * 100));
    }

    c.innerHTML = `
      <div class="space-y-4">
        <!-- Hero banner -->
        <div class="relative rounded-3xl overflow-hidden p-6 text-white shadow-xl shadow-orange-300/30"
             style="background:linear-gradient(135deg,#FF6B35 0%,#FF9500 60%,#FFB347 100%)">
          <div class="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 -translate-y-10 translate-x-10"></div>
          <div class="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-8 -translate-x-6"></div>
          <p class="text-xs font-medium opacity-80 relative">Xin chào 👋</p>
          <h1 class="text-xl font-black mt-0.5 relative">${hoTen}</h1>
          <div class="flex items-center gap-2 mt-3 relative">
            <span class="inline-flex items-center gap-1 text-xs font-bold bg-white/25 backdrop-blur-sm rounded-full px-3 py-1">
              <span class="material-symbols-outlined text-[12px]">shield</span>
              ${STS_LBL[ttM] || 'Chưa đăng ký'}
            </span>
            ${goi ? `<span class="text-[11px] opacity-80 font-medium">${goi.ten_goi}</span>` : ''}
          </div>
        </div>

        <!-- KPI row -->
        <div class="grid grid-cols-3 gap-3">
          ${_kpi('schedule', 'Sắp học', sap.length, 'buổi', '#FF6B35')}
          ${_kpi('check_circle', 'Đã học', da.length, 'buổi', '#22c55e')}
          ${_kpi('school', 'Học kèm', kem.length, 'gói', '#a855f7')}
        </div>

        <!-- Gói học phí -->
        ${goi ? _card(`
          ${_sectionTitle('workspace_premium', 'Gói học phí hiện tại')}
          <div class="px-5 py-4 space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-bold text-slate-800">${goi.ten_goi}</p>
                <p class="text-[10px] text-slate-400 mt-0.5">${formatDate(goi.tu_ngay)} → ${formatDate(goi.den_ngay)}</p>
              </div>
              <span class="text-[10px] font-bold px-3 py-1 rounded-full ${STS_CLS[ttM]}">${STS_LBL[ttM]}</span>
            </div>
            <div>
              <div class="flex justify-between text-[10px] text-slate-400 mb-1.5">
                <span>Tiến trình</span><span>${daysLeft} ngày còn lại</span>
              </div>
              <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all" style="width:${pct}%;background:linear-gradient(90deg,#FF6B35,#FF9500)"></div>
              </div>
            </div>
          </div>`) : _card(`<div class="px-5 py-8 text-center"><span class="material-symbols-outlined text-4xl text-slate-200">workspace_premium</span><p class="text-xs text-slate-400 mt-2">Chưa có gói học phí</p></div>`)}

        <!-- Lịch sắp học -->
        ${_card(`
          ${_sectionTitle('event_upcoming', 'Lịch học sắp tới')}
          <div class="divide-y divide-slate-50">
            ${sap.length === 0
              ? `<div class="px-5 py-8 text-center text-xs text-slate-400">Không có lịch học sắp tới</div>`
              : sap.map(l => `
                <div class="flex items-center gap-3.5 px-5 py-3">
                  <div class="w-10 h-10 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 shadow-sm shadow-orange-200/40"
                       style="background:linear-gradient(135deg,#FF6B35,#FF9500)">
                    <span class="text-white text-[11px] font-black leading-none">${new Date(l.ngay_hoc).toLocaleDateString('vi-VN',{day:'2-digit'})}</span>
                    <span class="text-white/70 text-[8px] font-medium">${new Date(l.ngay_hoc).toLocaleDateString('vi-VN',{month:'short'})}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-semibold text-slate-800">GV: ${l.ten_giao_vien || '—'}</p>
                    <p class="text-[10px] text-slate-400">${formatTime(l.gio_bat_dau)} – ${formatTime(l.gio_ket_thuc)}</p>
                  </div>
                  <span class="text-[9px] font-semibold px-2.5 py-1 rounded-full ${getSessionStatusClass(l)}">${getSessionStatusLabel(l)}</span>
                </div>`).join('')}
          </div>`)}

        <!-- Gói học kèm -->
        ${kem.length > 0 ? _card(`
          ${_sectionTitle('people', 'Gói học kèm đang hoạt động')}
          <div class="divide-y divide-slate-50">
            ${kem.map(g => {
              const p = g.so_buoi > 0 ? Math.round((g.so_buoi_da_hoc / g.so_buoi) * 100) : 0;
              return `<div class="px-5 py-3">
                <div class="flex justify-between items-center mb-2">
                  <p class="text-xs font-semibold text-slate-800">${g.ten_goi}</p>
                  <span class="text-[10px] text-slate-400 font-medium">${g.so_buoi_da_hoc}/${g.so_buoi} buổi</span>
                </div>
                <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full rounded-full bg-purple-500" style="width:${p}%"></div>
                </div>
                <p class="text-[9px] text-slate-400 mt-1">Hết hạn: ${formatDate(g.den_ngay)}</p>
              </div>`;
            }).join('')}
          </div>`) : ''}

        <!-- Ghi chú từ giáo viên -->
        <div id="sp-notes-overview"></div>
      </div>`;

    // Tải ghi chú dặn dò từ GV
    _loadNotesPreview(document.getElementById('sp-notes-overview'));
  } catch (err) {
    c.innerHTML = `<div class="bg-red-50 border border-red-100 text-red-600 rounded-3xl p-5 text-xs">${err.message}</div>`;
  }
}

async function _loadNotesPreview(el) {
  if (!el) return;
  try {
    const res = await fetch(`${API_BASE}/notes`, { headers: getAuthHeaders() });
    const data = await res.json();
    const notes = (data.data || []).slice(0, 3);
    if (notes.length === 0) return;
    el.innerHTML = _card(`
      ${_sectionTitle('sticky_note_2', 'Dặn dò từ giáo viên')}
      <div class="divide-y divide-slate-50">
        ${notes.map(n => `
          <div class="px-5 py-3">
            <div class="flex items-center justify-between mb-1">
              <p class="text-[10px] font-bold text-orange-600">GV: ${n.ten_giao_vien || '—'}</p>
              <p class="text-[9px] text-slate-300">${formatDate(n.ngay_tao)}</p>
            </div>
            <p class="text-xs text-slate-700 leading-relaxed">${n.noi_dung}</p>
          </div>`).join('')}
      </div>`);
  } catch (_) {}
}

/* ── TAB: LỊCH HỌC ── */
async function _tabSchedule(c) {
  const hoSoId = localStorage.getItem('hoSoId');
  try {
    const res  = await fetch(`${API_BASE}/schedules?hoc_vien_id=${hoSoId}`, { headers: getAuthHeaders() });
    const data = await res.json();
    const rows = data.data || [];

    const grouped = {};
    rows.forEach(r => {
      const k = new Date(r.ngay_hoc).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
      if (!grouped[k]) grouped[k] = [];
      grouped[k].push(r);
    });

    c.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-black text-slate-800">Lịch học của tôi</h2>
          <div class="flex gap-1.5 flex-wrap">
            ${[['bg-orange-400','Chờ học'],['bg-green-400','Đã học'],['bg-red-400','Vắng']].map(([cl,lb])=>`
              <span class="flex items-center gap-1 text-[9px] text-slate-500 font-semibold">
                <span class="w-1.5 h-1.5 rounded-full ${cl} inline-block"></span>${lb}</span>`).join('')}
          </div>
        </div>
        ${rows.length === 0
          ? _card(`<div class="py-14 text-center"><span class="material-symbols-outlined text-5xl text-slate-200">calendar_month</span><p class="text-xs text-slate-400 mt-2">Chưa có lịch học nào</p></div>`)
          : Object.entries(grouped).map(([month, items]) => _card(`
              <div class="px-5 py-3 bg-slate-50/80 border-b border-slate-100">
                <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wide">${month}</p>
              </div>
              <div class="divide-y divide-slate-50">
                ${items.map(l => {
                  const cc = l.trang_thai === 'da_hoc' ? '#22c55e' : l.trang_thai === 'vang' ? '#ef4444' : '#FF6B35';
                  const canConfirm = l.trang_thai === 'da_hoc' && !l.hv_xac_nhan && l.loai_buoi === 'ca_nhan';
                  const canRate    = l.trang_thai === 'da_hoc';
                  return `<div class="flex items-start gap-3.5 px-5 py-3">
                    <div class="w-10 h-10 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 shadow-sm" style="background:${cc}18">
                      <span class="text-[11px] font-black leading-none" style="color:${cc}">${new Date(l.ngay_hoc).toLocaleDateString('vi-VN',{day:'2-digit'})}</span>
                      <span class="text-[8px] font-medium" style="color:${cc}99">${new Date(l.ngay_hoc).toLocaleDateString('vi-VN',{weekday:'short'})}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-semibold text-slate-800">GV: ${l.ten_giao_vien || '—'}</p>
                      <p class="text-[10px] text-slate-400">${formatTime(l.gio_bat_dau)} – ${formatTime(l.gio_ket_thuc)}</p>
                      ${l.ghi_chu ? `<p class="text-[9px] text-amber-600 mt-0.5">${l.ghi_chu}</p>` : ''}
                      <div class="flex gap-1.5 mt-2 flex-wrap">
                        ${canConfirm ? `<button onclick="window._spConfirm(${l.id})" class="text-[9px] bg-green-100 text-green-700 hover:bg-green-200 rounded-xl px-2.5 py-1 font-bold transition flex items-center gap-1"><span class="material-symbols-outlined text-[11px]">thumb_up</span>Xác nhận đã học</button>` : ''}
                        ${l.hv_xac_nhan ? `<span class="text-[9px] text-green-600 font-semibold flex items-center gap-0.5"><span class="material-symbols-outlined text-[11px]">verified</span>Đã xác nhận</span>` : ''}
                        ${canRate ? (l.rating_so_sao 
                          ? `<button onclick="window._spOpenRate(${l.id},${l.giao_vien_id},'${(l.ten_giao_vien||'').replace(/'/g, "\\'")}',${l.rating_so_sao},'${(l.rating_nhan_xet||'').replace(/'/g, "\\'").replace(/\n/g, "\\n")}')" class="text-[9px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl px-2.5 py-1 font-bold transition flex items-center gap-1"><span class="material-symbols-outlined text-[11px]">edit_note</span>Sửa đánh giá (${l.rating_so_sao}★)</button>`
                          : `<button onclick="window._spOpenRate(${l.id},${l.giao_vien_id},'${(l.ten_giao_vien||'').replace(/'/g, "\\'")}',0,'')" class="text-[9px] bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-xl px-2.5 py-1 font-bold transition flex items-center gap-1"><span class="material-symbols-outlined text-[11px]">star</span>Đánh giá GV</button>`) : ''}
                      </div>
                    </div>
                    <span class="text-[9px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${getSessionStatusClass(l)}">${getSessionStatusLabel(l)}</span>
                  </div>`;}).join('')}
               </div>`)).join('')}
       </div>
 
       <!-- Modal đánh giá -->
       <div id="rate-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(0,0,0,0.4)">
         <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
           <h3 id="rate-modal-title" class="text-sm font-black text-slate-800 mb-1">Đánh giá giáo viên</h3>
           <p id="rate-gv-name" class="text-xs text-slate-400 mb-4"></p>
           <div class="flex gap-2 justify-center mb-4" id="star-row">
             ${[1,2,3,4,5].map(i=>`<button data-star="${i}" onclick="window._spSetStar(${i})" class="star-btn text-3xl text-slate-300 hover:text-amber-400 transition-colors">★</button>`).join('')}
           </div>
           <textarea id="rate-comment" rows="3" placeholder="Nhận xét về giáo viên (tùy chọn)..."
             class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs resize-none focus:outline-none focus:border-orange-400 mb-3"></textarea>
           <p id="rate-msg" class="hidden text-[10px] mb-2"></p>
           <div class="flex gap-2">
             <button onclick="document.getElementById('rate-modal').classList.add('hidden')"
               class="flex-1 py-2.5 rounded-2xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition">Hủy</button>
             <button onclick="window._spSubmitRate()"
               class="flex-1 py-2.5 rounded-2xl text-xs font-semibold text-white shadow-md hover:opacity-90 transition"
               style="background:linear-gradient(135deg,#FF6B35,#FF9500)">Gửi đánh giá</button>
           </div>
         </div>
       </div>`;
 
     let _rateData = { lichHocId: null, giaoVienId: null, soSao: 0 };
 
     window._spConfirm = async (id) => {
       try {
         const r = await fetch(`${API_BASE}/attendance/${id}/confirm`, {
           method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
           body: JSON.stringify({ hv_xac_nhan: 1 })
         });
         const res = await r.json();
         if (res.success) await _renderTab('schedule');
       } catch (_) {}
     };
 
     window._spOpenRate = (lichHocId, giaoVienId, tenGv, soSao = 0, nhanXet = '') => {
       _rateData = { lichHocId, giaoVienId, soSao };
       document.getElementById('rate-gv-name').textContent = `GV: ${tenGv}`;
       document.getElementById('rate-modal-title').textContent = soSao > 0 ? 'Chỉnh sửa đánh giá giáo viên' : 'Đánh giá giáo viên';
       document.getElementById('rate-msg').classList.add('hidden');
       document.getElementById('rate-comment').value = nhanXet;
       _spSetStar(soSao);
       document.getElementById('rate-modal').classList.remove('hidden');
     };

    window._spSetStar = (n) => {
      _rateData.soSao = n;
      document.querySelectorAll('.star-btn').forEach(b => {
        b.style.color = parseInt(b.dataset.star) <= n ? '#f59e0b' : '#cbd5e1';
      });
    };

    window._spSubmitRate = async () => {
      if (!_rateData.soSao) {
        const msg = document.getElementById('rate-msg');
        msg.textContent = 'Vui lòng chọn số sao'; msg.className = 'text-[10px] text-red-500 mb-2'; msg.classList.remove('hidden');
        return;
      }
      try {
        const r = await fetch(`${API_BASE}/ratings`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ giao_vien_id: _rateData.giaoVienId, lich_hoc_id: _rateData.lichHocId, so_sao: _rateData.soSao, nhan_xet: document.getElementById('rate-comment').value })
        });
        const res = await r.json();
        const msg = document.getElementById('rate-msg');
        if (res.success) {
          document.getElementById('rate-modal').classList.add('hidden');
          showToast(res.message || 'Đã gửi đánh giá giáo viên thành công!', 'success');
          await _renderTab('schedule');
        } else {
          msg.textContent = res.error || 'Gửi thất bại'; msg.className = 'text-[10px] text-red-500 mb-2'; msg.classList.remove('hidden');
          showToast(res.error || 'Gửi đánh giá thất bại!', 'error');
        }
      } catch (err) {
        showToast(err.message || 'Đã xảy ra lỗi khi gửi đánh giá!', 'error');
      }
    };
  } catch (err) {
    c.innerHTML = `<div class="bg-red-50 border border-red-100 text-red-600 rounded-3xl p-5 text-xs">${err.message}</div>`;
  }
}

/* ── TAB: SỔ LIÊN LẠC ── */
async function _tabDiary(c) {
  const hoSoId = localStorage.getItem('hoSoId');
  try {
    const [reportRes, noteRes] = await Promise.all([
      fetch(`${API_BASE}/reports/student/${hoSoId}`, { headers: getAuthHeaders() }),
      fetch(`${API_BASE}/notes`, { headers: getAuthHeaders() })
    ]);
    const reportData = await reportRes.json();
    const noteData   = await noteRes.json();
    const list  = reportData.data || [];
    const notes = noteData.data || [];

    c.innerHTML = `
      <div class="space-y-4">
        <h2 class="text-sm font-black text-slate-800">Sổ liên lạc điện tử</h2>

        ${notes.length > 0 ? _card(`
          ${_sectionTitle('sticky_note_2', 'Dặn dò từ giáo viên')}
          <div class="divide-y divide-slate-50">
            ${notes.map(n => `
              <div class="px-5 py-3 bg-amber-50/40">
                <div class="flex items-center justify-between mb-1">
                  <p class="text-[10px] font-bold text-orange-600 flex items-center gap-1">
                    <span class="material-symbols-outlined text-[12px]">person</span>GV: ${n.ten_giao_vien || '—'}
                  </p>
                  <p class="text-[9px] text-slate-300">${formatDate(n.ngay_tao)}</p>
                </div>
                <p class="text-xs text-slate-700 leading-relaxed">${n.noi_dung}</p>
              </div>`).join('')}
          </div>`) : ''}

        ${list.length === 0
          ? _card(`<div class="py-14 text-center"><span class="material-symbols-outlined text-5xl text-slate-200">menu_book</span><p class="text-xs text-slate-400 mt-2">Chưa có nhật ký học tập nào</p></div>`)
          : list.map((d, i) => `
            <div class="relative flex gap-3.5">
              <div class="flex flex-col items-center">
                <div class="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md shadow-orange-200/50"
                     style="background:linear-gradient(135deg,#FF6B35,#FF9500)">
                  <span class="material-symbols-outlined text-white text-[15px]">menu_book</span>
                </div>
                ${i < list.length - 1 ? '<div class="w-px flex-1 bg-orange-100 mt-1.5"></div>' : ''}
              </div>
              <div class="flex-1 pb-4">
                ${_card(`
                  <div class="px-5 py-4 space-y-3">
                    <div class="flex items-start justify-between gap-2">
                      <p class="text-xs font-bold text-slate-800">GV: ${d.ten_giao_vien || '—'}</p>
                      <p class="text-[9px] text-slate-400 flex-shrink-0">${formatDate(d.ngay_tao)}</p>
                    </div>
                    ${d.noi_dung_bai_hoc ? `
                      <div>
                        <p class="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">Nội dung bài học</p>
                        <p class="text-xs text-slate-700">${d.noi_dung_bai_hoc}</p>
                      </div>` : ''}
                    ${d.nhan_xet_buoi_hoc ? `
                      <div class="rounded-2xl p-3" style="background:linear-gradient(135deg,#fff7ed,#ffedd5)">
                        <p class="text-[9px] font-bold text-orange-500 uppercase tracking-wide mb-1">Nhận xét của giáo viên</p>
                        <p class="text-xs text-orange-900">${d.nhan_xet_buoi_hoc}</p>
                      </div>` : ''}
                    ${d.bai_tap_ve_nha ? `
                      <div class="bg-blue-50 rounded-2xl p-3">
                        <p class="text-[9px] font-bold text-blue-500 uppercase tracking-wide mb-1">Bài tập về nhà</p>
                        <p class="text-xs text-blue-800">${d.bai_tap_ve_nha}</p>
                      </div>` : ''}
                  </div>`)}
              </div>
            </div>`).join('')}
      </div>`;
  } catch (err) {
    c.innerHTML = `<div class="bg-red-50 border border-red-100 text-red-600 rounded-3xl p-5 text-xs">${err.message}</div>`;
  }
}

/* ── TAB: HỌC PHÍ ── */
async function _tabTuition(c) {
  const hoSoId = localStorage.getItem('hoSoId');
  try {
    const res  = await fetch(`${API_BASE}/students/${hoSoId}/registrations`, { headers: getAuthHeaders() });
    const data = await res.json();
    const kh   = data.data?.khoa_hoc || [];
    const hk   = data.data?.hoc_kem  || [];

    const totalPaid = kh.reduce((s, r) => s + Number(r.so_tien_da_thu || 0), 0)
                    + hk.reduce((s, r) => s + Number(r.so_tien_da_thu || 0), 0);
    const totalDebt = kh.reduce((s, r) => s + Math.max(0, Number(r.gia_thuc_te || 0) - Number(r.so_tien_da_thu || 0)), 0)
                    + hk.reduce((s, r) => s + Math.max(0, Number(r.gia_thuc_te || 0) - Number(r.so_tien_da_thu || 0)), 0);

    c.innerHTML = `
      <div class="space-y-4">
        <h2 class="text-sm font-black text-slate-800">Học phí & Thanh toán</h2>

        <!-- Tóm tắt -->
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-green-50 border border-green-100 rounded-3xl p-4 shadow-sm">
            <div class="w-7 h-7 bg-green-100 rounded-xl flex items-center justify-center mb-2">
              <span class="material-symbols-outlined text-green-600 text-[15px]">paid</span>
            </div>
            <p class="text-base font-black text-green-700">${formatMoney(totalPaid)}</p>
            <p class="text-[10px] text-green-500 font-medium">Đã thanh toán</p>
          </div>
          <div class="${totalDebt > 0 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'} border rounded-3xl p-4 shadow-sm">
            <div class="w-7 h-7 ${totalDebt > 0 ? 'bg-red-100' : 'bg-slate-100'} rounded-xl flex items-center justify-center mb-2">
              <span class="material-symbols-outlined ${totalDebt > 0 ? 'text-red-500' : 'text-slate-400'} text-[15px]">receipt_long</span>
            </div>
            <p class="text-base font-black ${totalDebt > 0 ? 'text-red-600' : 'text-slate-400'}">${formatMoney(totalDebt)}</p>
            <p class="text-[10px] ${totalDebt > 0 ? 'text-red-400' : 'text-slate-400'} font-medium">Còn nợ</p>
          </div>
        </div>

        <!-- Khóa học đại trà -->
        ${kh.length > 0 ? _card(`
          ${_sectionTitle('school', 'Khóa học đại trà')}
          <div class="divide-y divide-slate-50">
            ${kh.map(r => {
              const debt = Math.max(0, Number(r.gia_thuc_te||0) - Number(r.so_tien_da_thu||0));
              return `<div class="px-5 py-3.5">
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-bold text-slate-800">${r.ten_goi || 'Khóa học'}</p>
                    <p class="text-[10px] text-slate-400 mt-0.5">${formatDate(r.tu_ngay)} → ${formatDate(r.den_ngay)}</p>
                  </div>
                  <span class="text-[9px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${r.trang_thai === 'dang_hoat_dong' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}">${r.trang_thai === 'dang_hoat_dong' ? 'Đang học' : r.trang_thai}</span>
                </div>
                <div class="mt-2.5 grid grid-cols-3 gap-2">
                  ${[
                    ['Giá niêm yết', formatMoney(r.gia_thuc_te),'text-slate-600'],
                    ['Đã thu', formatMoney(r.so_tien_da_thu),'text-green-600'],
                    ['Còn nợ', formatMoney(debt), debt > 0 ? 'text-red-500 font-bold' : 'text-slate-400'],
                  ].map(([l,v,cl])=>`
                    <div class="bg-slate-50 rounded-2xl p-2">
                      <p class="text-[8px] text-slate-400 uppercase tracking-wide">${l}</p>
                      <p class="text-[10px] font-semibold ${cl} mt-0.5">${v}</p>
                    </div>`).join('')}
                </div>
              </div>`;
            }).join('')}
          </div>`) : ''}

        <!-- Học kèm -->
        ${hk.length > 0 ? _card(`
          ${_sectionTitle('people', 'Học kèm 1-1')}
          <div class="divide-y divide-slate-50">
            ${hk.map(r => {
              const debt = Math.max(0, Number(r.gia_thuc_te||0) - Number(r.so_tien_da_thu||0));
              const pct  = r.so_buoi > 0 ? Math.round(((r.so_buoi_da_hoc||0) / r.so_buoi) * 100) : 0;
              return `<div class="px-5 py-3.5">
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-bold text-slate-800">${r.ten_goi || 'Học kèm'}</p>
                    <p class="text-[10px] text-slate-400 mt-0.5">GV: ${r.ten_giao_vien || '—'}</p>
                    <div class="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div class="h-full bg-purple-400 rounded-full" style="width:${pct}%"></div>
                    </div>
                    <p class="text-[9px] text-slate-400 mt-0.5">${r.so_buoi_da_hoc||0}/${r.so_buoi||0} buổi · ${formatDate(r.den_ngay)}</p>
                  </div>
                  <div class="text-right flex-shrink-0">
                    <p class="text-[10px] font-semibold text-green-600">${formatMoney(r.so_tien_da_thu)}</p>
                    ${debt > 0 ? `<p class="text-[9px] font-bold text-red-500">Nợ ${formatMoney(debt)}</p>` : ''}
                  </div>
                </div>
              </div>`;
            }).join('')}
          </div>`) : ''}

        ${kh.length === 0 && hk.length === 0 ? _card(`<div class="py-14 text-center"><span class="material-symbols-outlined text-5xl text-slate-200">payments</span><p class="text-xs text-slate-400 mt-2">Chưa có đăng ký khóa học nào</p></div>`) : ''}
      </div>`;
  } catch (err) {
    c.innerHTML = `<div class="bg-red-50 border border-red-100 text-red-600 rounded-3xl p-5 text-xs">${err.message}</div>`;
  }
}

/* ── TAB: ĐẶT LỊCH ── */
async function _tabBooking(c) {
  try {
    const [teacherRes, bookingRes] = await Promise.all([
      fetch(`${API_BASE}/teachers`, { headers: getAuthHeaders() }),
      fetch(`${API_BASE}/booking-requests`, { headers: getAuthHeaders() })
    ]);
    const teachers  = (await teacherRes.json()).data || [];
    const bookings  = (await bookingRes.json()).data || [];

    // Kiểm tra xem học viên có gói học kèm hoạt động hay không
    const checkActiveTutorRes = await fetch(`${API_BASE}/student-portal/overview`, { headers: getAuthHeaders() });
    const overviewData = await checkActiveTutorRes.json();
    const activeTutors = overviewData.data?.goi_hoc_kem || [];
    const hasActiveTutor = activeTutors.length > 0;

    c.innerHTML = `
      <div class="space-y-4">
        <h2 class="text-sm font-black text-slate-800">Đặt lịch học</h2>

        ${!hasActiveTutor ? _card(`
          <div class="px-5 py-8 text-center space-y-3">
            <div class="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center mx-auto text-orange-500">
              <span class="material-symbols-outlined text-2xl">info</span>
            </div>
            <h3 class="text-xs font-bold text-slate-800">Chức năng tự đặt lịch học</h3>
            <p class="text-[10px] text-slate-500 max-w-sm mx-auto leading-relaxed">
              Tính năng tự đặt lịch học chỉ áp dụng cho học viên đăng ký <strong>Gói học kèm 1-1 hoặc 1-2</strong> đang hoạt động.
              <br><br>
              Nếu bạn là học viên lớp học nhóm cố định, vui lòng học theo khung giờ cố định của lớp được trung tâm sắp xếp hoặc liên hệ Lễ tân để biết thêm chi tiết.
            </p>
          </div>
        `) : _card(`
          <div class="px-5 py-4">
            <p class="text-[10px] text-slate-400 mb-4">Chọn giáo viên và thời gian mong muốn. Lịch sẽ được xác nhận bởi trung tâm.</p>
            <form id="booking-form" class="space-y-3">
              <div>
                <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Giáo viên</label>
                <select id="bk-teacher" required class="mt-1.5 w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition">
                  <option value="">— Chọn giáo viên —</option>
                  ${teachers.map(t => `<option value="${t.id}">${t.ho_ten}${t.chuyen_mon ? ' · ' + t.chuyen_mon : ''}</option>`).join('')}
                </select>
              </div>
              <div class="grid grid-cols-2 gap-2.5">
                <div>
                  <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Ngày mong muốn</label>
                  <input type="date" id="bk-date" required min="${new Date().toISOString().split('T')[0]}"
                    class="mt-1.5 w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition">
                </div>
                <div>
                  <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Giờ bắt đầu</label>
                  <input type="time" id="bk-start" required
                    class="mt-1.5 w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition">
                </div>
              </div>
              <div>
                <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Giờ kết thúc</label>
                <input type="time" id="bk-end" required
                  class="mt-1.5 w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition">
              </div>
              <div>
                <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Ghi chú thêm (tùy chọn)</label>
                <textarea id="bk-note" rows="2" placeholder="Ví dụ: muốn học ngữ pháp nâng cao..."
                  class="mt-1.5 w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-orange-400 resize-none transition"></textarea>
              </div>
              <p id="bk-msg" class="text-[10px] hidden mt-1"></p>
              <button type="submit" class="w-full text-white text-xs font-bold py-2.5 rounded-2xl transition shadow-md shadow-orange-200/50 hover:opacity-90 active:scale-[.98] flex items-center justify-center gap-2"
                style="background:linear-gradient(135deg,#FF6B35,#FF9500)">
                <span class="material-symbols-outlined text-[14px]">send</span> Gửi yêu cầu đặt lịch
              </button>
            </form>
          </div>`)}

        <!-- Lịch sử yêu cầu -->
        ${bookings.length > 0 ? _card(`
          ${_sectionTitle('history', 'Lịch sử yêu cầu đặt lịch')}
          <div class="divide-y divide-slate-50">
            ${bookings.map(b => `
              <div class="flex items-start gap-3 px-5 py-3">
                <div class="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                     style="background:${b.trang_thai==='da_duyet'?'#dcfce7':b.trang_thai==='tu_choi'?'#fee2e2':'#eff6ff'}">
                  <span class="material-symbols-outlined text-[15px]" style="color:${b.trang_thai==='da_duyet'?'#16a34a':b.trang_thai==='tu_choi'?'#dc2626':'#2563eb'}">
                    ${b.trang_thai==='da_duyet'?'check_circle':b.trang_thai==='tu_choi'?'cancel':'schedule'}
                  </span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-semibold text-slate-800">GV: ${b.ten_giao_vien || '—'}</p>
                  <p class="text-[10px] text-slate-400">${formatDate(b.ngay_mong_muon)} · ${formatTime(b.gio_bat_dau)} – ${formatTime(b.gio_ket_thuc)}</p>
                  ${b.ghi_chu ? `<p class="text-[9px] text-slate-400 mt-0.5 italic">${b.ghi_chu}</p>` : ''}
                </div>
                <span class="text-[9px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${STS_CLS[b.trang_thai]||'bg-slate-100 text-slate-500'}">${STS_LBL[b.trang_thai]||b.trang_thai}</span>
              </div>`).join('')}
          </div>`) : ''}
      </div>`;

    document.getElementById('booking-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const msg   = document.getElementById('bk-msg');
      const start = document.getElementById('bk-start').value;
      const end   = document.getElementById('bk-end').value;
      if (start && end && start >= end) {
        msg.textContent = 'Giờ kết thúc phải sau giờ bắt đầu';
        msg.className = 'text-[10px] text-red-500 mt-1'; msg.classList.remove('hidden'); return;
      }
      try {
        const r = await fetch(`${API_BASE}/booking-requests`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            giao_vien_id: document.getElementById('bk-teacher').value,
            ngay_mong_muon: document.getElementById('bk-date').value,
            gio_bat_dau: start, gio_ket_thuc: end,
            ghi_chu: document.getElementById('bk-note').value.trim()
          })
        });
        const res = await r.json();
        if (res.success) {
          msg.textContent = '✓ Đã gửi yêu cầu! Trung tâm sẽ xác nhận sớm.';
          msg.className = 'text-[10px] text-green-600 mt-1'; msg.classList.remove('hidden');
          document.getElementById('booking-form').reset();
          setTimeout(() => _renderTab('booking'), 1500);
        } else {
          msg.textContent = res.error || 'Gửi thất bại';
          msg.className = 'text-[10px] text-red-500 mt-1'; msg.classList.remove('hidden');
        }
      } catch (_) {
        msg.textContent = 'Lỗi kết nối'; msg.className = 'text-[10px] text-red-500 mt-1'; msg.classList.remove('hidden');
      }
    });
  } catch (err) {
    c.innerHTML = `<div class="bg-red-50 border border-red-100 text-red-600 rounded-3xl p-5 text-xs">${err.message}</div>`;
  }
}

/* ── TAB: HỒ SƠ ── */
async function _tabProfile(c) {
  const hoSoId = localStorage.getItem('hoSoId');
  if (!hoSoId) {
    c.innerHTML = _card(`<div class="py-12 text-center text-xs text-slate-400">Không tìm thấy thông tin hồ sơ</div>`);
    return;
  }
  try {
    const res  = await fetch(`${API_BASE}/students/${hoSoId}`, { headers: getAuthHeaders() });
    const data = await res.json();
    const hs   = data.data || {};

    c.innerHTML = `
      <div class="space-y-4">
        ${_card(`
          <div class="h-28 relative" style="background:linear-gradient(135deg,#FF6B35,#FF9500,#FFB347)">
            <div class="absolute inset-0 bg-white/5"></div>
            <div class="absolute -bottom-7 left-5 group cursor-pointer" id="sp-avatar-wrap">
              <div class="w-14 h-14 rounded-2xl bg-white shadow-xl shadow-orange-200/50 flex items-center justify-center border-2 border-orange-100 overflow-hidden relative">
                ${hs.avatar_url
                  ? `<img id="sp-avatar-img" src="${hs.avatar_url}" class="w-full h-full object-cover" alt="avatar">`
                  : `<span id="sp-avatar-letter" class="text-2xl font-black text-orange-500">${(hs.ho_ten||'?').charAt(0)}</span>`
                }
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                  <span class="material-symbols-outlined text-white text-[16px]">photo_camera</span>
                </div>
              </div>
              <input type="file" id="sp-avatar-input" accept="image/*" class="hidden">
            </div>
          </div>
          <div class="pt-10 px-5 pb-5">
            <h3 class="text-base font-black text-slate-800">${hs.ho_ten || '—'}</h3>
            <p class="text-[10px] text-slate-400 font-medium mt-0.5">${hs.ma_ho_so || ''} · Học viên</p>
            <div class="mt-4 grid grid-cols-2 gap-2.5">
              ${[
                ['Ngày sinh', formatDate(hs.ngay_sinh)],
                ['Giới tính', hs.gioi_tinh || '—'],
                ['SĐT', hs.so_dien_thoai || '—'],
                ['Email', hs.email || '—'],
                ['Phụ huynh', hs.ten_phu_huynh || '—'],
                ['Trình độ', hs.trinh_do_dau_vao || '—'],
                ['Chi nhánh', hs.chi_nhanh || '—'],
                ['Tiếp nhận', formatDate(hs.ngay_tao)],
              ].map(([l, v]) => `
                <div class="bg-slate-50/80 rounded-2xl p-3">
                  <p class="text-[9px] font-bold text-slate-400 uppercase tracking-wide">${l}</p>
                  <p class="text-xs font-semibold text-slate-800 mt-0.5 break-words">${v}</p>
                </div>`).join('')}
            </div>
          </div>`)}

        ${_card(`
          <div class="px-5 py-4">
            <h3 class="text-xs font-black text-slate-800 mb-3">Đổi mật khẩu</h3>
            <form id="pw-form" class="space-y-2.5">
              ${['pw-old:Mật khẩu hiện tại', 'pw-new:Mật khẩu mới (≥6 ký tự)', 'pw-cfm:Xác nhận mật khẩu mới'].map(s => {
                const [id, lbl] = s.split(':');
                return `<div>
                  <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wide">${lbl}</label>
                  <input type="password" id="${id}" required class="mt-1 w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition">
                </div>`;
              }).join('')}
              <p id="pw-msg" class="text-[10px] hidden mt-1"></p>
              <button type="submit" class="w-full text-white text-xs font-bold py-2.5 rounded-2xl transition shadow-md shadow-orange-200/50 hover:opacity-90 active:scale-[.98]"
                style="background:linear-gradient(135deg,#FF6B35,#FF9500)">Cập nhật mật khẩu</button>
            </form>
          </div>`)}
      </div>`;

    // Avatar upload
    document.getElementById('sp-avatar-wrap')?.addEventListener('click', () => {
      document.getElementById('sp-avatar-input')?.click();
    });
    document.getElementById('sp-avatar-input')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('avatar', file);
      const wrap = document.getElementById('sp-avatar-wrap');
      if (wrap) wrap.style.opacity = '0.5';
      try {
        const r = await fetch(`${API_BASE}/upload/avatar`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: formData
        });
        const result = await r.json();
        if (result.success) {
          const img = document.getElementById('sp-avatar-img');
          const letter = document.getElementById('sp-avatar-letter');
          if (img) { img.src = result.avatar_url; }
          else if (letter) {
            const newImg = document.createElement('img');
            newImg.id = 'sp-avatar-img';
            newImg.src = result.avatar_url;
            newImg.className = 'w-full h-full object-cover';
            letter.replaceWith(newImg);
          }
        }
      } catch (_) {}
      finally { if (wrap) wrap.style.opacity = '1'; }
    });

    document.getElementById('pw-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const old = document.getElementById('pw-old').value;
      const nw  = document.getElementById('pw-new').value;
      const cfm = document.getElementById('pw-cfm').value;
      const msg = document.getElementById('pw-msg');
      if (nw !== cfm) { msg.textContent = 'Mật khẩu xác nhận không khớp'; msg.className = 'text-[10px] text-red-500 mt-1'; msg.classList.remove('hidden'); return; }
      if (nw.length < 6) { msg.textContent = 'Mật khẩu mới phải có ít nhất 6 ký tự'; msg.className = 'text-[10px] text-red-500 mt-1'; msg.classList.remove('hidden'); return; }
      try {
        const r = await fetch(`${API_BASE}/auth/change-password`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ mat_khau_cu: old, mat_khau_moi: nw })
        });
        const result = await r.json();
        msg.textContent = result.success ? '✓ Đổi mật khẩu thành công!' : (result.error || 'Thất bại');
        msg.className   = `text-[10px] mt-1 ${result.success ? 'text-green-600' : 'text-red-500'}`;
        msg.classList.remove('hidden');
        if (result.success) document.getElementById('pw-form').reset();
      } catch (_) { msg.textContent = 'Lỗi kết nối'; msg.className = 'text-[10px] text-red-500 mt-1'; msg.classList.remove('hidden'); }
    });
  } catch (err) {
    c.innerHTML = `<div class="bg-red-50 border border-red-100 text-red-600 rounded-3xl p-5 text-xs">${err.message}</div>`;
  }
}
