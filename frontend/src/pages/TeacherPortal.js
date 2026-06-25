// TeacherPortal.js — Portal giáo viên · Navy gradient · Top tab pills · Glassmorphism
import { initChatbot } from './Chatbot.js';
import { renderMyQR } from './MyQR.js';
import { showToast } from './_shared.js';
const API_BASE = 'http://localhost:3006/api';

function getAuthHeaders() {
  return {
    'x-user-role': localStorage.getItem('userRole') || 'giao_vien',
    'x-ho-so-id': localStorage.getItem('hoSoId') || '',
    'x-tai-khoan-id': localStorage.getItem('taiKhoanId') || ''
  };
}

function logout() {
  ['isLoggedIn', 'userRole', 'username', 'hoTen', 'taiKhoanId', 'hoSoId', 'chiNhanh'].forEach(k => localStorage.removeItem(k));
  window.location.hash = '/login';
}

function parseSafeDate(d) {
  if (!d) return null;
  const parts = d.substring(0, 10).split('-');
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function isTimeToShowAttendance(ngayHoc, gioBatDau) {
  if (!ngayHoc || !gioBatDau) return false;
  const datePart = ngayHoc.substring(0, 10);
  const timePart = gioBatDau.substring(0, 5);
  const targetTime = new Date(`${datePart}T${timePart}:00`);
  // Cho phép điểm danh trước 30 phút (30 * 60 * 1000 miligiây)
  const allowTime = new Date(targetTime.getTime() - 30 * 60 * 1000);
  return new Date() >= allowTime;
}

function sortSessions(sessions) {
  if (!sessions || !Array.isArray(sessions)) return [];
  return [...sessions].sort((a, b) => {
    const statusOrder = { cho_hoc: 1, da_hoc: 2, vang: 2, da_huy: 3 };
    const orderA = statusOrder[a.trang_thai] || 2;
    const orderB = statusOrder[b.trang_thai] || 2;
    if (orderA !== orderB) return orderA - orderB;
    return (a.gio_bat_dau || '').localeCompare(b.gio_bat_dau || '');
  });
}

function formatDate(d) {
  if (!d) return '—';
  const parsed = parseSafeDate(d);
  return parsed ? parsed.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
}
function formatTime(t) { return t ? t.slice(0, 5) : ''; }

const STS_CLS = {
  da_hoc: 'bg-green-100 text-green-700 border border-green-200',
  cho_hoc: 'bg-blue-100 text-blue-700 border border-blue-200',
  vang: 'bg-red-100 text-red-700 border border-red-200',
  da_huy: 'bg-slate-100 text-slate-500 border border-slate-200',
};
const STS_LBL = { da_hoc: 'Đã dạy', cho_hoc: 'Chờ học', vang: 'HV Vắng', da_huy: 'Đã hủy' };

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

const NAV  = '#1a3a5c';
const NAV2 = '#0a6ebd';
const GRAD = `linear-gradient(135deg,${NAV} 0%,${NAV2} 100%)`;

const TABS = [
  { id: 'overview',  label: 'Tổng quan',    icon: 'home' },
  { id: 'my-qr',     label: 'Mã QR của tôi', icon: 'qr_code' },
  { id: 'schedule',  label: 'Lịch dạy',     icon: 'calendar_month' },
  { id: 'students',  label: 'Học viên',     icon: 'group' },
  { id: 'diary',     label: 'Sổ liên lạc',  icon: 'edit_note' },
  { id: 'stats',     label: 'Thống kê',     icon: 'bar_chart' },
  { id: 'salary',    label: 'Phiếu lương',  icon: 'payments' },
  { id: 'profile',   label: 'Hồ sơ',        icon: 'person' },
];

// Reset về overview mỗi lần vào lại portal
let _activeTab = 'overview';

export async function renderTeacherPortal() {
  _activeTab = 'overview';
  const app   = document.getElementById('app');
  const hoTen = localStorage.getItem('hoTen') || 'Giáo viên';

  app.innerHTML = `
    <div class="min-h-screen bg-[#f4f7fb] font-sans" id="tp-root">

      <!-- ── HEADER ─────────────────────────────────────────── -->
      <header class="sticky top-0 z-40 bg-white/70 backdrop-blur-2xl border-b border-blue-100/60 shadow-sm shadow-blue-100/30">

        <div class="flex items-center justify-between px-4 md:px-8 h-14">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-2xl flex items-center justify-center shadow-md shadow-blue-600/30"
                 style="background:${GRAD}">
              <span class="material-symbols-outlined text-white text-[16px]">school</span>
            </div>
            <div class="leading-none">
              <p class="text-[10px] text-slate-400 font-medium">Stellar Academy</p>
              <p class="text-xs font-bold text-slate-800">Cổng giáo viên</p>
            </div>
          </div>

          <div class="flex items-center gap-1.5">
            <!-- Bell -->
            <div class="relative" id="bell-wrapper">
              <button id="bell-btn"
                class="relative w-9 h-9 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-blue-50 transition-all">
                <span class="material-symbols-outlined text-[20px]">notifications</span>
                <span id="bell-badge"
                  class="hidden absolute top-1.5 right-1.5 min-w-[14px] h-3.5 px-0.5 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center leading-none"></span>
              </button>
              <div id="bell-dropdown"
                class="hidden absolute right-0 top-12 w-80 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-300/40 border border-slate-100 z-50 overflow-hidden">
                <div class="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                  <span class="text-xs font-bold text-slate-800">Thông báo</span>
                  <button id="mark-all-read-btn" class="text-[10px] font-semibold hover:underline" style="color:${NAV2}">Đọc tất cả</button>
                </div>
                <div id="notif-list" class="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  <div class="p-5 text-xs text-slate-400 text-center">Đang tải...</div>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2 bg-blue-50 rounded-2xl pl-1.5 pr-3 py-1 border border-blue-100">
              <div class="w-6 h-6 rounded-xl flex items-center justify-center text-white font-bold text-[10px] shadow-sm shadow-blue-400/30"
                   style="background:${GRAD}">
                ${hoTen.charAt(0)}
              </div>
              <span class="text-xs font-semibold text-slate-700 max-w-[90px] truncate">${hoTen}</span>
            </div>

            <button onclick="window._tpLogout()"
              class="w-9 h-9 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Đăng xuất">
              <span class="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>

        <!-- TOP TAB PILLS -->
        <div class="px-4 md:px-8 pb-3 flex gap-2 overflow-x-auto scrollbar-none" id="tp-tab-bar">
          ${TABS.map(t => `
            <button data-tab="${t.id}"
              class="tp-tab flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200
                ${t.id === _activeTab
                  ? 'text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-500 bg-slate-100 hover:bg-blue-50 hover:text-blue-700'}"
              ${t.id === _activeTab ? `style="background:${GRAD}"` : ''}>
              <span class="material-symbols-outlined text-[14px]">${t.icon}</span>
              ${t.label}
            </button>`).join('')}
        </div>
      </header>

      <main class="px-4 md:px-8 py-5 pb-10 max-w-3xl mx-auto" id="tp-content">
        <div class="flex items-center justify-center min-h-[300px]">
          <div class="animate-spin w-8 h-8 rounded-full border-[3px] border-blue-200 border-t-blue-600"></div>
        </div>
      </main>
    </div>
  `;

  window._tpLogout = logout;
  _setupTabs();
  _setupBell();
  _renderTab('overview');
  initChatbot();
}

function _setupTabs() {
  document.querySelectorAll('.tp-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      _activeTab = btn.dataset.tab;
      document.querySelectorAll('.tp-tab').forEach(b => {
        if (b.dataset.tab === _activeTab) {
          b.className = 'tp-tab flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 text-white shadow-md shadow-blue-600/30';
          b.style.background = GRAD;
        } else {
          b.className = 'tp-tab flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 text-slate-500 bg-slate-100 hover:bg-blue-50 hover:text-blue-700';
          b.style.background = '';
        }
      });
      _renderTab(_activeTab);
    });
  });
}

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
    const ns   = data.data || [];
    const ur   = data.unread_count || 0;
    if (badge) { badge.textContent = ur > 9 ? '9+' : ur; badge.classList.toggle('hidden', ur === 0); }
    if (list) {
      list.innerHTML = ns.length === 0
        ? `<div class="p-6 text-xs text-slate-400 text-center">Chưa có thông báo</div>`
        : ns.map(n => `
          <div class="flex gap-3 px-5 py-3 ${n.da_doc ? '' : 'bg-blue-50/50'} hover:bg-slate-50 cursor-pointer transition-colors" onclick="window._tpMarkRead(${n.id},this)">
            <div class="w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm" style="background:${GRAD}">
              <span class="material-symbols-outlined text-white text-[13px]">notifications</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-semibold text-slate-800 truncate">${n.tieu_de}</p>
              <p class="text-[10px] text-slate-400 mt-0.5 line-clamp-2">${n.noi_dung}</p>
              <p class="text-[9px] text-slate-300 mt-1">${formatDate(n.ngay_tao)}</p>
            </div>
            ${!n.da_doc ? `<span class="w-2 h-2 rounded-full flex-shrink-0 mt-2" style="background:${NAV2}"></span>` : ''}
          </div>`).join('');
    }
  } catch (_) {}
}
window._tpMarkRead = async (id, el) => {
  await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'PUT', headers: getAuthHeaders() });
  el.classList.remove('bg-blue-50/50'); el.querySelector('.w-2.h-2')?.remove();
  await _loadNotifications();
};

async function _renderTab(tab) {
  const c = document.getElementById('tp-content');
  if (!c) return;
  c.innerHTML = `<div class="flex items-center justify-center min-h-[300px]"><div class="animate-spin w-8 h-8 rounded-full border-[3px] border-blue-200 border-t-blue-600"></div></div>`;
  switch (tab) {
    case 'overview':  await _tabOverview(c);  break;
    case 'my-qr':     await renderMyQR(c);    break;
    case 'schedule':  await _tabSchedule(c);  break;
    case 'students':  await _tabStudents(c);  break;
    case 'diary':     await _tabDiary(c);     break;
    case 'stats':     await _tabStats(c);     break;
    case 'salary':    await _tabSalary(c);    break;
    case 'profile':   await _tabProfile(c);   break;
  }
}

/* ── HELPERS ── */
function _card(content, extra = '') {
  return `<div class="bg-white/80 backdrop-blur-sm rounded-3xl border border-blue-50 shadow-lg shadow-blue-100/20 overflow-hidden ${extra}">${content}</div>`;
}
function _sec(icon, title) {
  return `<div class="flex items-center gap-2 px-5 py-4 border-b border-slate-50">
    <span class="material-symbols-outlined text-[18px]" style="color:${NAV2}">${icon}</span>
    <h2 class="text-xs font-bold text-slate-800">${title}</h2>
  </div>`;
}
function _kpi(icon, lbl, val, sub, color) {
  return `<div class="bg-white/80 backdrop-blur-sm rounded-3xl border border-blue-50 shadow-lg shadow-blue-100/20 p-4">
    <div class="w-8 h-8 rounded-2xl flex items-center justify-center mb-2 shadow-sm" style="background:${color}18">
      <span class="material-symbols-outlined text-[17px]" style="color:${color}">${icon}</span>
    </div>
    <p class="text-xl font-black text-slate-800">${val}</p>
    <p class="text-[10px] text-slate-400 font-medium mt-0.5">${sub} ${lbl}</p>
  </div>`;
}

/* ── TAB: TỔNG QUAN ── */
async function _tabOverview(c) {
  const hoTen = localStorage.getItem('hoTen') || 'Giáo viên';
  try {
    const res  = await fetch(`${API_BASE}/teacher-portal/overview`, { headers: getAuthHeaders() });
    const data = await res.json();
    const d    = data.data || {};
    const hn   = sortSessions(d.lich_hom_nay || []);
    const tk   = d.thong_ke    || {};
    const dg   = d.danh_gia   || {};
    const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

    c.innerHTML = `
      <div class="space-y-4">
        <!-- Hero -->
        <div class="relative rounded-3xl overflow-hidden p-6 text-white shadow-xl shadow-blue-400/20"
             style="background:${GRAD}">
          <div class="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-16 translate-x-16"></div>
          <div class="absolute bottom-0 left-0 w-28 h-28 rounded-full bg-white/5 translate-y-10 -translate-x-8"></div>
          <p class="text-xs font-medium opacity-70 relative">Xin chào 👋</p>
          <h1 class="text-xl font-black mt-0.5 relative">${hoTen}</h1>
          <p class="text-[11px] opacity-60 mt-1 relative">${today}</p>
          <div class="flex items-center gap-2 mt-3 relative">
            <span class="inline-flex items-center gap-1 text-xs font-bold bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
              <span class="material-symbols-outlined text-[12px]">today</span>
              ${hn.length} buổi dạy hôm nay
            </span>
            ${dg.trung_binh_sao ? `<span class="inline-flex items-center gap-1 text-xs font-bold bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
              <span class="text-amber-300">★</span> ${dg.trung_binh_sao}
            </span>` : ''}
          </div>
        </div>

        <!-- KPIs -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          ${_kpi('check_circle','Đã dạy tháng này', tk.tong_buoi_da_day||0,'buổi','#22c55e')}
          ${_kpi('event_busy','HV Vắng tháng này', tk.tong_buoi_hoc_vien_vang||0,'buổi','#f59e0b')}
          ${_kpi('upcoming','Sắp dạy', tk.buoi_sap_toi||0,'buổi',NAV2)}
          <div class="bg-white/80 backdrop-blur-sm rounded-3xl border border-blue-50 shadow-lg shadow-blue-100/20 p-4">
            <div class="w-8 h-8 rounded-2xl flex items-center justify-center mb-2 shadow-sm bg-amber-50">
              <span class="material-symbols-outlined text-[17px] text-amber-500">star</span>
            </div>
            <div class="flex items-end gap-1">
              <p class="text-xl font-black text-slate-800">${dg.trung_binh_sao||'—'}</p>
              <span class="text-amber-400 text-xs mb-0.5">★</span>
            </div>
            <p class="text-[10px] text-slate-400 font-medium">${dg.tong_danh_gia||0} đánh giá</p>
          </div>
        </div>

        <!-- Lịch hôm nay -->
        ${_card(`
          ${_sec('today','Lịch dạy hôm nay')}
          <div class="divide-y divide-slate-50">
            ${hn.length === 0
              ? `<div class="py-10 text-center"><span class="material-symbols-outlined text-4xl text-slate-200">today</span><p class="text-xs text-slate-400 mt-2">Hôm nay không có buổi dạy</p></div>`
              : hn.map(l => `
                <div class="flex items-center gap-3.5 px-5 py-3">
                  <div class="w-11 h-11 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 shadow-sm" style="background:${NAV}18">
                    <span class="text-xs font-black leading-none" style="color:${NAV}">${formatTime(l.gio_bat_dau)}</span>
                    <span class="text-[8px] font-medium" style="color:${NAV}80">${formatTime(l.gio_ket_thuc)}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-semibold text-slate-800">${l.ten_hoc_vien || '—'}</p>
                    <p class="text-[10px] text-slate-400">${l.sdt_hoc_vien || ''}</p>
                  </div>
                  <div class="flex flex-col items-end gap-1.5">
                    <span class="text-[9px] font-semibold px-2.5 py-1 rounded-full ${getSessionStatusClass(l)}">${getSessionStatusLabel(l)}</span>
                    ${l.trang_thai === 'cho_hoc' ? (() => {
                      const canAttend = isTimeToShowAttendance(l.ngay_hoc, l.gio_bat_dau);
                      return `
                      <div class="flex gap-1">
                        ${canAttend ? `
                          <button onclick="window._tpAttend(${l.id},'da_hoc')"
                            class="text-[9px] bg-green-100 text-green-700 hover:bg-green-200 rounded-xl px-2 py-0.5 font-bold transition">✓ Đã học</button>
                          <button onclick="window._tpAttend(${l.id},'vang')"
                            class="text-[9px] bg-red-100 text-red-700 hover:bg-red-200 rounded-xl px-2 py-0.5 font-bold transition">✗ Vắng</button>
                        ` : `
                          <button onclick="showToast('Chưa đến giờ học (chỉ cho phép điểm danh trước tối đa 30 phút)!', 'error')"
                            class="text-[9px] opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200 rounded-xl px-2 py-0.5 font-bold transition">✓ Đã học</button>
                          <button onclick="showToast('Chưa đến giờ học (chỉ cho phép điểm danh trước tối đa 30 phút)!', 'error')"
                            class="text-[9px] opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200 rounded-xl px-2 py-0.5 font-bold transition">✗ Vắng</button>
                        `}
                      </div>`;
                    })() : ''}
                  </div>
                </div>`).join('')}
          </div>`)}
      </div>`;

    window._tpAttend = async (id, ts) => {
      try {
        const r = await fetch(`${API_BASE}/attendance/${id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ trang_thai: ts })
        });
        if ((await r.json()).success) {
          showToast('Điểm danh thành công!', 'success');
          await _renderTab('overview');
        }
      } catch (_) {}
    };
  } catch (err) {
    c.innerHTML = `<div class="bg-red-50 border border-red-100 text-red-600 rounded-3xl p-5 text-xs">${err.message}</div>`;
  }
}

let _subScheduleTab = 'today';

async function _tabSchedule(c) {
  c.innerHTML = `
    <div class="space-y-4">
      <!-- Sub Tab Switcher -->
      <div class="flex justify-between items-center bg-white/70 backdrop-blur-xl rounded-2xl p-1 shadow-sm border border-blue-50/50">
        <div class="flex gap-1 w-full">
          <button id="subtab-today-btn" 
            class="flex-1 text-center py-2 rounded-xl text-xs font-bold transition-all duration-200 
            ${_subScheduleTab === 'today' ? 'text-white shadow-md shadow-blue-500/20' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50/50'}"
            ${_subScheduleTab === 'today' ? `style="background:${GRAD}"` : ''}>
            Hôm nay
          </button>
          <button id="subtab-week-btn" 
            class="flex-1 text-center py-2 rounded-xl text-xs font-bold transition-all duration-200 
            ${_subScheduleTab === 'week' ? 'text-white shadow-md shadow-blue-500/20' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50/50'}"
            ${_subScheduleTab === 'week' ? `style="background:${GRAD}"` : ''}>
            Tuần này
          </button>
          <button id="subtab-month-btn" 
            class="flex-1 text-center py-2 rounded-xl text-xs font-bold transition-all duration-200 
            ${_subScheduleTab === 'month' ? 'text-white shadow-md shadow-blue-500/20' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50/50'}"
            ${_subScheduleTab === 'month' ? `style="background:${GRAD}"` : ''}>
            Tháng này
          </button>
        </div>
      </div>
      
      <!-- Sub Tab Container -->
      <div id="sub-tab-content">
        <div class="flex items-center justify-center min-h-[200px]">
          <div class="animate-spin w-6 h-6 rounded-full border-2 border-blue-200 border-t-blue-600"></div>
        </div>
      </div>
    </div>
  `;

  const contentDiv = document.getElementById('sub-tab-content');

  const loadSubTab = async () => {
    contentDiv.innerHTML = `<div class="flex items-center justify-center min-h-[200px]"><div class="animate-spin w-6 h-6 rounded-full border-2 border-blue-200 border-t-blue-600"></div></div>`;
    if (_subScheduleTab === 'today') {
      const hoSoId = localStorage.getItem('hoSoId');
      try {
        const res  = await fetch(`${API_BASE}/schedule/today`, { headers: getAuthHeaders() });
        const data = await res.json();
        const all  = sortSessions((data.data || []).filter(l => String(l.giao_vien_id) === String(hoSoId)));

        contentDiv.innerHTML = `
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-xs font-bold text-slate-500 uppercase tracking-wide">Lịch dạy hôm nay</h2>
              <span class="text-[10px] text-slate-400 font-medium">${new Date().toLocaleDateString('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit'})}</span>
            </div>
            ${_card(`
              <div class="divide-y divide-slate-50">
                ${all.length === 0
                  ? `<div class="py-14 text-center"><span class="material-symbols-outlined text-5xl text-slate-200">today</span><p class="text-xs text-slate-400 mt-2">Hôm nay không có buổi dạy</p></div>`
                  : all.map(l => `
                    <div class="flex items-start gap-3.5 px-5 py-4">
                      <div class="w-12 h-12 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 shadow-sm" style="background:${NAV}15">
                        <span class="text-xs font-black" style="color:${NAV}">${formatTime(l.gio_bat_dau)}</span>
                        <span class="text-[8px]" style="color:${NAV}70">${formatTime(l.gio_ket_thuc)}</span>
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-xs font-bold text-slate-800">${l.ten_hoc_vien||l.ho_ten||'—'}</p>
                        <p class="text-[10px] text-slate-400 mt-0.5">#${l.id}</p>
                        ${l.ghi_chu ? `<p class="text-[9px] text-amber-600 mt-1">${l.ghi_chu}</p>` : ''}
                        ${l.trang_thai === 'cho_hoc' ? (() => {
                          const canAttend = isTimeToShowAttendance(l.ngay_hoc, l.gio_bat_dau);
                          return `
                          <div class="flex gap-2 mt-2.5">
                            ${canAttend ? `
                              <button onclick="window._tpQuick(${l.id},'da_hoc')"
                                class="flex items-center gap-1 text-[10px] bg-green-100 text-green-700 hover:bg-green-200 rounded-xl px-3 py-1.5 font-bold transition">
                                <span class="material-symbols-outlined text-[12px]">check_circle</span> Đã học</button>
                              <button onclick="window._tpQuick(${l.id},'vang')"
                                class="flex items-center gap-1 text-[10px] bg-red-100 text-red-700 hover:bg-red-200 rounded-xl px-3 py-1.5 font-bold transition">
                                <span class="material-symbols-outlined text-[12px]">cancel</span> HV Vắng</button>
                            ` : `
                              <button onclick="showToast('Chưa đến giờ học (chỉ cho phép điểm danh trước tối đa 30 phút)!', 'error')"
                                class="flex items-center gap-1 text-[10px] opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200 rounded-xl px-3 py-1.5 font-bold transition">
                                <span class="material-symbols-outlined text-[12px]">check_circle</span> Đã học</button>
                              <button onclick="showToast('Chưa đến giờ học (chỉ cho phép điểm danh trước tối đa 30 phút)!', 'error')"
                                class="flex items-center gap-1 text-[10px] opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200 rounded-xl px-3 py-1.5 font-bold transition">
                                <span class="material-symbols-outlined text-[12px]">cancel</span> HV Vắng</button>
                            `}
                          </div>`;
                        })() : ''}
                      </div>
                      <span class="text-[9px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${getSessionStatusClass(l)}">${getSessionStatusLabel(l)}</span>
                    </div>`).join('')}
              </div>`)}
          </div>`;

        window._tpQuick = async (id, ts) => {
          try {
            const r = await fetch(`${API_BASE}/attendance/${id}`, {
              method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
              body: JSON.stringify({ trang_thai: ts })
            });
            if ((await r.json()).success) {
              showToast('Điểm danh thành công!', 'success');
              await loadSubTab();
            }
          } catch (_) {}
        };
      } catch (err) {
        contentDiv.innerHTML = `<div class="bg-red-50 border border-red-100 text-red-600 rounded-3xl p-5 text-xs">${err.message}</div>`;
      }
    } else {
      // logic loadTuần hoặc loadTháng
      window._tpQuick = async (id, ts) => {
        try {
          const r = await fetch(`${API_BASE}/attendance/${id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ trang_thai: ts })
          });
          if ((await r.json()).success) {
            showToast('Điểm danh thành công!', 'success');
            await loadSubTab();
          }
        } catch (_) {}
      };
      try {
        const res  = await fetch(`${API_BASE}/teacher-portal/overview`, { headers: getAuthHeaders() });
        const data = await res.json();
        let list = data.data?.lich_tuan_nay || [];

        // Nếu là tab Tuần này, chỉ lọc lấy các buổi học trong 7 ngày kể từ đầu tuần hiện tại
        if (_subScheduleTab === 'week') {
          // Lấy ngày cuối tuần hiện tại (Chủ Nhật)
          const now = new Date();
          const day = now.getDay();
          const diffToSunday = day === 0 ? 0 : 7 - day;
          const sundayDate = new Date(now.setDate(now.getDate() + diffToSunday));
          sundayDate.setHours(23, 59, 59, 999);
          const sundayStr = sundayDate.toISOString().split('T')[0];

          list = list.filter(l => l.ngay_hoc.substring(0, 10) <= sundayStr);
        }

        const grp = {};
        list.forEach(l => {
          const parsedDate = parseSafeDate(l.ngay_hoc);
          const k = parsedDate ? parsedDate.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' }) : 'Không xác định';
          if (!grp[k]) grp[k] = [];
          grp[k].push(l);
        });

        // Sắp xếp xoay vòng thời gian ngày học
        const sortedEntries = Object.entries(grp).sort(([dayA, itemsA], [dayB, itemsB]) => {
          const todayStr = new Date().toISOString().split('T')[0];
          const dateA = itemsA[0]?.ngay_hoc || '';
          const dateB = itemsB[0]?.ngay_hoc || '';

          const isFutureA = dateA >= todayStr;
          const isFutureB = dateB >= todayStr;

          if (isFutureA && !isFutureB) return -1;
          if (!isFutureA && isFutureB) return 1;

          return dateA.localeCompare(dateB);
        });

        const titleText = _subScheduleTab === 'week' ? 'Lịch dạy tuần này' : 'Lịch dạy tháng này';
        const emptyText = _subScheduleTab === 'week' ? 'Tuần này không có buổi dạy' : 'Không có buổi dạy nào trong tháng này';

        contentDiv.innerHTML = `
          <div class="space-y-4">
            <h2 class="text-xs font-bold text-slate-500 uppercase tracking-wide">${titleText}</h2>
            ${sortedEntries.length === 0
              ? _card(`<div class="py-14 text-center"><span class="material-symbols-outlined text-5xl text-slate-200">calendar_month</span><p class="text-xs text-slate-400 mt-2">${emptyText}</p></div>`)
              : sortedEntries.map(([day, items]) => {
                  const sortedItems = sortSessions(items);
                  const isToday = day.toLowerCase() === new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' }).toLowerCase();
                  return _card(`
                    <div class="px-5 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                      <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wide">${day}</p>
                      ${isToday ? `<span class="bg-blue-100 text-blue-800 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Hôm nay</span>` : ''}
                    </div>
                    <div class="divide-y divide-slate-50">
                      ${sortedItems.map(l => {
                        const canAttend = isTimeToShowAttendance(l.ngay_hoc, l.gio_bat_dau);
                        return `
                        <div class="flex items-center gap-3.5 px-5 py-3">
                          <div class="w-10 h-10 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 shadow-sm" style="background:${NAV}15">
                            <span class="text-[11px] font-black" style="color:${NAV}">${formatTime(l.gio_bat_dau)}</span>
                          </div>
                          <div class="flex-1 min-w-0">
                            <p class="text-xs font-semibold text-slate-800">${l.ten_hoc_vien||'—'}</p>
                            <p class="text-[10px] text-slate-400">${formatTime(l.gio_bat_dau)} – ${formatTime(l.gio_ket_thuc)}</p>
                            ${l.trang_thai === 'cho_hoc' ? `
                            <div class="flex gap-2 mt-2">
                              ${canAttend ? `
                                <button onclick="window._tpQuick(${l.id},'da_hoc')"
                                  class="text-[9px] bg-green-100 text-green-700 hover:bg-green-200 rounded-xl px-2 py-0.5 font-bold transition flex items-center gap-0.5">
                                  ✓ Đã học</button>
                                <button onclick="window._tpQuick(${l.id},'vang')"
                                  class="text-[9px] bg-red-100 text-red-700 hover:bg-red-200 rounded-xl px-2 py-0.5 font-bold transition flex items-center gap-0.5">
                                  ✗ Vắng</button>
                              ` : `
                                <button onclick="showToast('Chưa đến giờ học (chỉ cho phép điểm danh trước tối đa 30 phút)!', 'error')"
                                  class="text-[9px] opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200 rounded-xl px-2 py-0.5 font-bold transition flex items-center gap-0.5">
                                  ✓ Đã học</button>
                                <button onclick="showToast('Chưa đến giờ học (chỉ cho phép điểm danh trước tối đa 30 phút)!', 'error')"
                                  class="text-[9px] opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200 rounded-xl px-2 py-0.5 font-bold transition flex items-center gap-0.5">
                                  ✗ Vắng</button>
                              `}
                            </div>` : ''}
                          </div>
                          <span class="text-[9px] font-semibold px-2.5 py-1 rounded-full ${getSessionStatusClass(l)}">${getSessionStatusLabel(l)}</span>
                        </div>`;
                      }).join('')}
                    </div>`);
                }).join('')}
          </div>`;
      } catch (err) {
        contentDiv.innerHTML = `<div class="bg-red-50 border border-red-100 text-red-600 rounded-3xl p-5 text-xs">${err.message}</div>`;
      }
    }
  };

  const btnToday = document.getElementById('subtab-today-btn');
  const btnWeek = document.getElementById('subtab-week-btn');
  const btnMonth = document.getElementById('subtab-month-btn');

  btnToday.addEventListener('click', () => {
    _subScheduleTab = 'today';
    btnToday.className = 'flex-1 text-center py-2 rounded-xl text-xs font-bold transition-all duration-200 text-white shadow-md shadow-blue-500/20';
    btnToday.style.background = GRAD;
    btnWeek.className = 'flex-1 text-center py-2 rounded-xl text-xs font-bold transition-all duration-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50/50';
    btnWeek.style.background = '';
    btnMonth.className = 'flex-1 text-center py-2 rounded-xl text-xs font-bold transition-all duration-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50/50';
    btnMonth.style.background = '';
    loadSubTab();
  });

  btnWeek.addEventListener('click', () => {
    _subScheduleTab = 'week';
    btnWeek.className = 'flex-1 text-center py-2 rounded-xl text-xs font-bold transition-all duration-200 text-white shadow-md shadow-blue-500/20';
    btnWeek.style.background = GRAD;
    btnToday.className = 'flex-1 text-center py-2 rounded-xl text-xs font-bold transition-all duration-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50/50';
    btnToday.style.background = '';
    btnMonth.className = 'flex-1 text-center py-2 rounded-xl text-xs font-bold transition-all duration-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50/50';
    btnMonth.style.background = '';
    loadSubTab();
  });

  btnMonth.addEventListener('click', () => {
    _subScheduleTab = 'month';
    btnMonth.className = 'flex-1 text-center py-2 rounded-xl text-xs font-bold transition-all duration-200 text-white shadow-md shadow-blue-500/20';
    btnMonth.style.background = GRAD;
    btnToday.className = 'flex-1 text-center py-2 rounded-xl text-xs font-bold transition-all duration-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50/50';
    btnToday.style.background = '';
    btnWeek.className = 'flex-1 text-center py-2 rounded-xl text-xs font-bold transition-all duration-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50/50';
    btnWeek.style.background = '';
    loadSubTab();
  });

  await loadSubTab();
}

/* ── TAB: HỌC VIÊN CỦA TÔI ── */
async function _tabStudents(c) {
  try {
    const res  = await fetch(`${API_BASE}/teacher-portal/my-students`, { headers: getAuthHeaders() });
    const data = await res.json();
    const list = data.data || [];

    c.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-black text-slate-800">Học viên của tôi</h2>
          <span class="text-[10px] font-semibold text-slate-400 bg-blue-50 rounded-full px-3 py-1">${list.length} học viên</span>
        </div>

        ${list.length === 0
          ? _card(`<div class="py-14 text-center"><span class="material-symbols-outlined text-5xl text-slate-200">group</span><p class="text-xs text-slate-400 mt-2">Chưa có học viên nào</p></div>`)
          : _card(`
              <div class="divide-y divide-slate-50">
                ${list.map(s => `
                  <div class="flex items-center gap-3.5 px-5 py-3.5 hover:bg-blue-50/20 transition-colors cursor-pointer" onclick="window._tpOpenStudent(${s.id},'${s.ho_ten}')">
                    <div class="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm text-white font-bold text-sm"
                         style="background:${GRAD}">
                      ${(s.ho_ten||'?').charAt(0)}
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-bold text-slate-800">${s.ho_ten}</p>
                      <p class="text-[10px] text-slate-400">${s.ma_ho_so || ''} · ${s.so_dien_thoai || '—'}</p>
                    </div>
                    <div class="text-right flex-shrink-0">
                      <div class="flex items-center gap-1.5 text-[9px] text-slate-500">
                        <span class="text-green-500 font-bold">${s.da_hoc||0}</span>học
                        <span class="text-red-400 font-bold">${s.vang||0}</span>vắng
                      </div>
                      <p class="text-[8px] text-slate-300 mt-0.5">Gần nhất: ${formatDate(s.buoi_hoc_gan_nhat)}</p>
                    </div>
                  </div>`).join('')}
              </div>`)}
      </div>

      <!-- Modal chi tiết học viên -->
      <div id="student-modal" class="hidden fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4" style="background:rgba(0,0,0,0.4)">
        <div class="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full max-w-sm max-h-[80vh] overflow-y-auto" id="student-modal-content">
          <div class="p-5 text-center text-xs text-slate-400">Đang tải...</div>
        </div>
      </div>`;

    window._tpOpenStudent = async (id, name) => {
      document.getElementById('student-modal').classList.remove('hidden');
      const mc = document.getElementById('student-modal-content');
      mc.innerHTML = `<div class="p-8 text-center"><div class="animate-spin w-6 h-6 rounded-full border-2 border-blue-200 border-t-blue-600 mx-auto"></div></div>`;

      try {
        const [schRes, histRes] = await Promise.all([
          fetch(`${API_BASE}/schedules?hoc_vien_id=${id}&giao_vien_id=${localStorage.getItem('hoSoId')}`, { headers: getAuthHeaders() }),
          fetch(`${API_BASE}/reports/teacher/${localStorage.getItem('hoSoId')}?hoc_vien_id=${id}`, { headers: getAuthHeaders() })
        ]);
        const schs = (await schRes.json()).data || [];
        const hist = (await histRes.json()).data || [];
        const upcoming = schs.filter(s => s.trang_thai === 'cho_hoc').slice(0, 3);
        const done = schs.filter(s => s.trang_thai === 'da_hoc').length;
        const absent = schs.filter(s => s.trang_thai === 'vang').length;

        mc.innerHTML = `
          <div class="p-5">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold shadow-sm" style="background:${GRAD}">${name.charAt(0)}</div>
                <div>
                  <p class="text-sm font-black text-slate-800">${name}</p>
                  <p class="text-[10px] text-slate-400 flex gap-2">
                    <span class="text-green-600 font-bold">${done} đã học</span>
                    <span class="text-red-400 font-bold">${absent} vắng</span>
                  </p>
                </div>
              </div>
              <button onclick="document.getElementById('student-modal').classList.add('hidden')"
                class="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-500 transition">
                <span class="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            ${upcoming.length > 0 ? `
              <p class="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-2">Lịch học sắp tới</p>
              <div class="space-y-1.5 mb-4">
                ${upcoming.map(s => `
                  <div class="flex items-center justify-between bg-blue-50 rounded-2xl px-3.5 py-2.5">
                    <p class="text-xs font-semibold text-slate-700">${formatDate(s.ngay_hoc)}</p>
                    <p class="text-[10px] text-slate-500">${formatTime(s.gio_bat_dau)} – ${formatTime(s.gio_ket_thuc)}</p>
                  </div>`).join('')}
              </div>` : ''}

            <p class="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-2">Sổ liên lạc gần đây</p>
            ${hist.length === 0
              ? `<p class="text-xs text-slate-400 text-center py-4">Chưa có nhật ký nào</p>`
              : hist.slice(0,3).map(h => `
                <div class="bg-slate-50 rounded-2xl p-3 mb-2">
                  <p class="text-[9px] text-slate-400 mb-1">${formatDate(h.ngay_tao)}</p>
                  ${h.noi_dung_bai_hoc ? `<p class="text-xs text-slate-700 line-clamp-2">${h.noi_dung_bai_hoc}</p>` : ''}
                  ${h.nhan_xet_buoi_hoc ? `<p class="text-[10px] text-amber-600 mt-0.5 line-clamp-1">${h.nhan_xet_buoi_hoc}</p>` : ''}
                </div>`).join('')}

            <!-- Ghi chú dặn dò -->
            <p class="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-2 mt-3">Ghi chú dặn dò nhanh</p>
            <form id="note-form-${id}" class="flex gap-2">
              <input type="text" id="note-input-${id}" placeholder="Nhập dặn dò cho học viên..."
                class="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-blue-400 transition">
              <button type="submit" class="px-3 py-2 rounded-2xl text-white text-xs font-bold transition hover:opacity-90 flex-shrink-0"
                style="background:${GRAD}">Gửi</button>
            </form>
            <p id="note-msg-${id}" class="text-[9px] mt-1 hidden"></p>
          </div>`;

        document.getElementById(`note-form-${id}`)?.addEventListener('submit', async e => {
          e.preventDefault();
          const val = document.getElementById(`note-input-${id}`).value.trim();
          const msg = document.getElementById(`note-msg-${id}`);
          if (!val) return;
          try {
            const r = await fetch(`${API_BASE}/notes`, {
              method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
              body: JSON.stringify({ hoc_vien_id: id, noi_dung: val })
            });
            const res = await r.json();
            msg.textContent = res.success ? '✓ Đã gửi dặn dò!' : (res.error || 'Thất bại');
            msg.className = `text-[9px] mt-1 ${res.success ? 'text-green-600' : 'text-red-500'}`;
            msg.classList.remove('hidden');
            if (res.success) document.getElementById(`note-input-${id}`).value = '';
          } catch (_) {}
        });
      } catch (_) {
        mc.innerHTML = `<div class="p-6 text-xs text-red-500 text-center">Lỗi tải dữ liệu</div>`;
      }
    };

    // Đóng modal khi click ngoài
    document.getElementById('student-modal')?.addEventListener('click', e => {
      if (e.target === document.getElementById('student-modal'))
        document.getElementById('student-modal').classList.add('hidden');
    });
  } catch (err) {
    c.innerHTML = `<div class="bg-red-50 border border-red-100 text-red-600 rounded-3xl p-5 text-xs">${err.message}</div>`;
  }
}

/* ── TAB: SỔ LIÊN LẠC ── */
async function _tabDiary(c) {
  const hoSoId = localStorage.getItem('hoSoId');
  try {
    const [stdRes, histRes] = await Promise.all([
      fetch(`${API_BASE}/students`, { headers: getAuthHeaders() }),
      fetch(`${API_BASE}/reports/teacher/${hoSoId}`, { headers: getAuthHeaders() })
    ]);
    const stds = ((await stdRes.json()).data || []).filter(s => s.loai_ho_so === 'hoc_vien' || !s.loai_ho_so);
    const hist = (await histRes.json()).data || [];

    c.innerHTML = `
      <div class="space-y-4">
        <h2 class="text-sm font-black text-slate-800">Sổ liên lạc</h2>

        <!-- Form viết mới -->
        ${_card(`
          ${_sec('edit_note','Viết nhật ký buổi học')}
          <div class="px-5 py-4">
            <form id="diary-form" class="space-y-3">
              <div>
                <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Học viên</label>
                <select id="d-student" required class="mt-1.5 w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 transition" style="--tw-ring-color:${NAV2}40">
                  <option value="">— Chọn học viên —</option>
                  ${stds.map(s => `<option value="${s.id}">${s.ho_ten} (${s.ma_ho_so})</option>`).join('')}
                </select>
              </div>
              ${[
                ['d-content','Nội dung bài học','Nội dung bài học hôm nay...'],
                ['d-comment','Nhận xét buổi học','Nhận xét về tiến độ, thái độ học tập...'],
                ['d-hw','Bài tập về nhà','Bài tập giao về nhà...'],
                ['d-dan-do','Dặn dò / Ghi chú thêm','Ví dụ: Ôn tập từ vựng chuẩn bị kiểm tra 15p buổi tới...'],
              ].map(([id, lbl, ph]) => `
                <div>
                  <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wide">${lbl}</label>
                  <textarea id="${id}" rows="2" placeholder="${ph}"
                    class="mt-1.5 w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none transition resize-none"></textarea>
                </div>`).join('')}
              <p id="d-msg" class="text-[10px] hidden"></p>
              <button type="submit" class="w-full text-white text-xs font-bold py-2.5 rounded-2xl transition shadow-md hover:opacity-90 active:scale-[.98] flex items-center justify-center gap-2"
                style="background:${GRAD}">
                <span class="material-symbols-outlined text-[14px]">send</span> Gửi sổ liên lạc
              </button>
            </form>
          </div>`)}
 
        <!-- Lịch sử đã viết -->
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-black text-slate-700">Lịch sử đã viết</h3>
          <span class="text-[10px] text-slate-400">${hist.length} bản ghi</span>
        </div>
        ${hist.length === 0
          ? _card(`<div class="py-10 text-center text-xs text-slate-400">Chưa viết sổ liên lạc nào</div>`)
          : hist.map(h => _card(`
              <div class="px-5 py-4 space-y-2.5">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-xl flex items-center justify-center text-white text-[10px] font-bold" style="background:${GRAD}">${(h.ten_hoc_vien||'?').charAt(0)}</div>
                    <p class="text-xs font-bold text-slate-800">${h.ten_hoc_vien || '—'}</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <p class="text-[9px] text-slate-400">${formatDate(h.ngay_tao)}</p>
                    <button class="btn-edit-t-diary text-blue-500 hover:text-blue-700 p-0.5 rounded transition" data-id="${h.id}" title="Sửa">
                      <span class="material-symbols-outlined text-[13px] block">edit</span>
                    </button>
                    <button class="btn-delete-t-diary text-red-500 hover:text-red-700 p-0.5 rounded transition" data-id="${h.id}" title="Xóa">
                      <span class="material-symbols-outlined text-[13px] block">delete</span>
                    </button>
                  </div>
                </div>
                ${h.noi_dung_bai_hoc ? `<div class="bg-slate-50 rounded-2xl p-3"><p class="text-[8px] font-bold text-slate-400 mb-1">NỘI DUNG</p><p class="text-xs text-slate-700">${h.noi_dung_bai_hoc}</p></div>` : ''}
                ${h.nhan_xet_buoi_hoc ? `<div class="rounded-2xl p-3" style="background:linear-gradient(135deg,#eff6ff,#dbeafe)"><p class="text-[8px] font-bold text-blue-400 mb-1">NHẬN XÉT</p><p class="text-xs text-blue-800">${h.nhan_xet_buoi_hoc}</p></div>` : ''}
                ${h.bai_tap_ve_nha ? `<div class="bg-amber-50 rounded-2xl p-3"><p class="text-[8px] font-bold text-amber-500 mb-1">BÀI TẬP</p><p class="text-xs text-amber-800">${h.bai_tap_ve_nha}</p></div>` : ''}
                ${h.dan_do_giao_vien ? `<div class="bg-blue-50/40 rounded-2xl p-3 border border-blue-100/30"><p class="text-[8px] font-bold text-blue-500 mb-1">DẶN DÒ / GHI CHÚ</p><p class="text-xs text-slate-700">${h.dan_do_giao_vien}</p></div>` : ''}
              </div>`)).join('')}
      </div>

      <!-- Modal Chỉnh sửa nhận xét cho GV -->
      <div id="t-edit-diary-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]">
          <div class="px-5 py-4 border-b border-slate-50 flex justify-between items-center">
            <span class="text-xs font-bold text-slate-800">Chỉnh sửa nhận xét</span>
            <button onclick="document.getElementById('t-edit-diary-modal').classList.add('hidden')"
              class="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-500 transition">
              <span class="material-symbols-outlined text-[15px]">close</span>
            </button>
          </div>
          <form id="t-edit-diary-form" class="p-5 space-y-3 overflow-y-auto">
            <input type="hidden" id="t-edit-id" />
            <div>
              <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Nội dung bài học</label>
              <textarea id="t-edit-content" rows="2" class="mt-1.5 w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none transition resize-none" required></textarea>
            </div>
            <div>
              <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Nhận xét buổi học</label>
              <textarea id="t-edit-comment" rows="3" class="mt-1.5 w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none transition resize-none" required></textarea>
            </div>
            <div>
              <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Bài tập về nhà</label>
              <textarea id="t-edit-hw" rows="2" class="mt-1.5 w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none transition resize-none"></textarea>
            </div>
            <div>
              <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Dặn dò / Ghi chú thêm</label>
              <textarea id="t-edit-dan-do" rows="2" class="mt-1.5 w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none transition resize-none"></textarea>
            </div>
            <button type="submit" class="w-full text-white text-xs font-bold py-2.5 rounded-2xl transition shadow-md hover:opacity-90 active:scale-[.98]"
              style="background:${GRAD}">
              Cập nhật sổ liên lạc
            </button>
          </form>
        </div>
      </div>`;

    c.querySelectorAll('.btn-edit-t-diary').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        const item = hist.find(h => h.id === id);
        if (item) {
          document.getElementById('t-edit-id').value = item.id;
          document.getElementById('t-edit-content').value = item.noi_dung_bai_hoc || '';
          document.getElementById('t-edit-comment').value = item.nhan_xet_buoi_hoc || '';
          document.getElementById('t-edit-hw').value = item.bai_tap_ve_nha || '';
          document.getElementById('t-edit-dan-do').value = item.dan_do_giao_vien || '';
          document.getElementById('t-edit-diary-modal').classList.remove('hidden');
        }
      });
    });

    document.getElementById('t-edit-diary-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('t-edit-id').value;
      const noi_dung_bai_hoc = document.getElementById('t-edit-content').value.trim();
      const nhan_xet_buoi_hoc = document.getElementById('t-edit-comment').value.trim();
      const bai_tap_ve_nha = document.getElementById('t-edit-hw').value.trim();
      const dan_do_giao_vien = document.getElementById('t-edit-dan-do').value.trim();

      try {
        const r = await fetch(`${API_BASE}/reports/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            noi_dung_bai_hoc,
            nhan_xet_buoi_hoc,
            bai_tap_ve_nha,
            dan_do_giao_vien
          })
        });
        const res = await r.json();
        if (res.success) {
          document.getElementById('t-edit-diary-modal').classList.add('hidden');
          _renderTab('diary');
        } else {
          alert(res.error || 'Cập nhật thất bại');
        }
      } catch (_) {
        alert('Lỗi kết nối máy chủ');
      }
    });

    c.querySelectorAll('.btn-delete-t-diary').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.id);
        if (confirm('Bạn có chắc chắn muốn xóa nhận xét này không?')) {
          try {
            const r = await fetch(`${API_BASE}/reports/${id}`, {
              method: 'DELETE',
              headers: getAuthHeaders()
            });
            const res = await r.json();
            if (res.success) {
              _renderTab('diary');
            } else {
              alert(res.error || 'Xóa thất bại');
            }
          } catch (_) {
            alert('Lỗi kết nối máy chủ');
          }
        }
      });
    });

    document.getElementById('d-student')?.addEventListener('change', async e => {
      const sid = e.target.value; if (!sid) return;
      // Cập nhật preview lịch sử ngay khi chọn học viên
    });

    document.getElementById('diary-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const msg = document.getElementById('d-msg');
      const sid = document.getElementById('d-student').value;
      if (!sid) { msg.textContent = 'Vui lòng chọn học viên'; msg.className = 'text-[10px] text-red-500'; msg.classList.remove('hidden'); return; }
      try {
        const r = await fetch(`${API_BASE}/reports`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            hoc_vien_id: sid,
            giao_vien_id: hoSoId,
            nguoi_gui_id: hoSoId,
            lich_hoc_id: null,
            noi_dung_bai_hoc: document.getElementById('d-content').value.trim(),
            nhan_xet_buoi_hoc: document.getElementById('d-comment').value.trim(),
            bai_tap_ve_nha: document.getElementById('d-hw').value.trim(),
            dan_do_giao_vien: document.getElementById('d-dan-do').value.trim(),
            vai_tro_gui: 'giao_vien'
          })
        });
        const res = await r.json();
        msg.textContent = res.success ? '✓ Đã gửi sổ liên lạc thành công!' : (res.error || 'Gửi thất bại');
        msg.className   = `text-[10px] ${res.success ? 'text-green-600' : 'text-red-500'}`;
        msg.classList.remove('hidden');
        if (res.success) {
          document.getElementById('diary-form').reset();
          setTimeout(() => _renderTab('diary'), 1000);
        }
      } catch (_) { msg.textContent = 'Lỗi kết nối'; msg.className = 'text-[10px] text-red-500'; msg.classList.remove('hidden'); }
    });
  } catch (err) {
    c.innerHTML = `<div class="bg-red-50 border border-red-100 text-red-600 rounded-3xl p-5 text-xs">${err.message}</div>`;
  }
}

/* ── TAB: THỐNG KÊ ── */
async function _tabStats(c) {
  const now = new Date();
  let selMonth = now.getMonth() + 1;
  let selYear  = now.getFullYear();

  async function loadStats(m, y) {
    const res  = await fetch(`${API_BASE}/teacher-portal/stats?thang=${m}&nam=${y}`, { headers: getAuthHeaders() });
    const data = await res.json();
    return data.data || {};
  }

  async function render() {
    const d = await loadStats(selMonth, selYear);
    const t = d.tong || {};
    const days = d.theo_ngay || [];
    const dg = d.danh_gia || {};
    const maxBuoi = Math.max(...days.map(d => Number(d.da_day||0) + Number(d.hv_vang||0)), 1);

    const monthNames = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];

    c.innerHTML = `
      <div class="space-y-4">
        <!-- Chọn tháng -->
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-black text-slate-800">Thống kê cá nhân</h2>
          <div class="flex items-center gap-2">
            <button id="prev-month" class="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition">
              <span class="material-symbols-outlined text-[14px]">chevron_left</span>
            </button>
            <span class="text-xs font-bold text-slate-700">${monthNames[selMonth-1]} ${selYear}</span>
            <button id="next-month" class="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition">
              <span class="material-symbols-outlined text-[14px]">chevron_right</span>
            </button>
          </div>
        </div>

        <!-- KPIs tháng -->
        <div class="grid grid-cols-2 gap-3">
          ${[
            ['check_circle', 'Buổi đã dạy', t.tong_da_day||0, '#22c55e'],
            ['event_busy',   'HV Vắng mặt', t.tong_hv_vang||0, '#f59e0b'],
            ['group',        'Số học viên',  t.so_hoc_vien||0, NAV2],
            ['star',         'Đánh giá TB',  dg.trung_binh || '—', '#f59e0b'],
          ].map(([ic,lb,vl,cl]) => `
            <div class="bg-white/80 backdrop-blur-sm rounded-3xl border border-blue-50 shadow-lg shadow-blue-100/20 p-4">
              <div class="w-8 h-8 rounded-2xl flex items-center justify-center mb-2 shadow-sm" style="background:${cl}18">
                <span class="material-symbols-outlined text-[17px]" style="color:${cl}">${ic}</span>
              </div>
              <p class="text-xl font-black text-slate-800">${vl}</p>
              <p class="text-[10px] text-slate-400 font-medium">${lb}</p>
            </div>`).join('')}
        </div>

        <!-- Biểu đồ cột đơn giản -->
        ${days.length > 0 ? _card(`
          ${_sec('bar_chart','Hoạt động theo ngày')}
          <div class="px-5 py-4">
            <div class="flex items-end gap-1 h-24 overflow-x-auto pb-2">
              ${days.map(d => {
                const total = Number(d.da_day||0) + Number(d.hv_vang||0);
                const pct   = Math.round((total / maxBuoi) * 100);
                const date  = new Date(d.ngay).toLocaleDateString('vi-VN',{day:'2-digit'});
                return `<div class="flex flex-col items-center gap-1 flex-shrink-0" style="min-width:22px">
                  <div class="w-4 rounded-t-lg transition-all" style="height:${Math.max(4,pct * 0.7)}px;background:${pct > 50 ? GRAD : `${NAV2}40`}" title="${total} buổi ngày ${d.ngay}"></div>
                  <span class="text-[7px] text-slate-400 font-medium">${date}</span>
                </div>`;
              }).join('')}
            </div>
            <div class="flex items-center gap-3 mt-2">
              <span class="flex items-center gap-1 text-[9px] text-slate-500"><span class="w-2 h-2 rounded-sm inline-block" style="background:${GRAD}"></span>≥ 50% tháng</span>
              <span class="flex items-center gap-1 text-[9px] text-slate-500"><span class="w-2 h-2 rounded-sm inline-block" style="background:${NAV2}40"></span>< 50% tháng</span>
            </div>
          </div>`) : ''}

        ${days.length === 0 ? _card(`<div class="py-14 text-center"><span class="material-symbols-outlined text-5xl text-slate-200">bar_chart</span><p class="text-xs text-slate-400 mt-2">Không có dữ liệu trong tháng này</p></div>`) : ''}
      </div>`;

    document.getElementById('prev-month')?.addEventListener('click', async () => {
      selMonth--; if (selMonth < 1) { selMonth = 12; selYear--; }
      await render();
    });
    document.getElementById('next-month')?.addEventListener('click', async () => {
      selMonth++; if (selMonth > 12) { selMonth = 1; selYear++; }
      await render();
    });
  }

  try {
    c.innerHTML = `<div class="flex items-center justify-center min-h-[200px]"><div class="animate-spin w-6 h-6 rounded-full border-2 border-blue-200 border-t-blue-600"></div></div>`;
    await render();
  } catch (err) {
    c.innerHTML = `<div class="bg-red-50 border border-red-100 text-red-600 rounded-3xl p-5 text-xs">${err.message}</div>`;
  }
}

/* ── TAB: PHIẾU LƯƠNG ── */
async function _tabSalary(c) {
  const now = new Date();
  let selMonth = now.getMonth() + 1;
  let selYear  = now.getFullYear();
  const hoSoId = localStorage.getItem('hoSoId');

  async function loadSalary(m, y) {
    const res = await fetch(`${API_BASE}/payroll/my-salary?month=${m}&year=${y}&ho_so_id=${hoSoId}`, {
      headers: getAuthHeaders()
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Lỗi tải phiếu lương');
    return result.data || {};
  }

  async function render() {
    try {
      const s = await loadSalary(selMonth, selYear);
      const isPaid = s.trang_thai === 'da_thanh_toan';

      const statusClass = isPaid 
        ? 'bg-emerald-100 text-emerald-800' 
        : 'bg-yellow-50 text-yellow-800 border border-yellow-200';
      const statusLabel = isPaid 
        ? 'Đã thanh toán' 
        : 'Chờ duyệt chi';

      const monthNames = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];

      c.innerHTML = `
        <div class="space-y-4">
          <!-- Chọn kỳ lương -->
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-black text-slate-800">Phiếu lương cá nhân</h2>
            <div class="flex items-center gap-2">
              <button id="prev-salary-month" class="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition">
                <span class="material-symbols-outlined text-[14px]">chevron_left</span>
              </button>
              <span class="text-xs font-bold text-slate-700">${monthNames[selMonth-1]} ${selYear}</span>
              <button id="next-salary-month" class="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition">
                <span class="material-symbols-outlined text-[14px]">chevron_right</span>
              </button>
            </div>
          </div>

          <!-- Trạng thái phiếu lương -->
          <div class="flex items-center justify-between p-4 rounded-3xl bg-white border border-blue-50 shadow-md">
            <div>
              <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Trạng thái thanh toán</p>
              <span class="inline-block px-3 py-1 rounded-full text-[10.5px] font-black mt-1.5 ${statusClass}">${statusLabel}</span>
            </div>
            ${s.ngay_thanh_toan ? `
            <div class="text-right">
              <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ngày thanh toán</p>
              <p class="text-xs font-bold text-slate-700 mt-1">${new Date(s.ngay_thanh_toan).toLocaleDateString('vi-VN')} ${new Date(s.ngay_thanh_toan).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}</p>
            </div>` : ''}
          </div>

          <!-- Chi tiết lương Bento -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <!-- Bento thực lĩnh -->
            <div class="bg-gradient-to-br from-[#0066cc] to-[#0a6ebd] rounded-3xl p-6 text-white shadow-xl shadow-blue-400/20 md:col-span-2 relative overflow-hidden">
              <div class="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-10 translate-x-10"></div>
              <span class="text-[10px] opacity-75 font-bold uppercase tracking-wider block">Thực lĩnh nhận được</span>
              <span class="text-3xl font-black block mt-2 tracking-tight">${s.thuc_linh.toLocaleString('vi-VN')} VNĐ</span>
              <p class="text-[10.5px] opacity-60 mt-3">Công thức: Thực lĩnh = Lương dạy ca + Phụ cấp - Khấu trừ</p>
            </div>

            <!-- Bento lương ca dạy học -->
            ${_card(`
              ${_sec('school','Chi tiết ca dạy học')}
              <div class="p-5 space-y-3">
                <div class="flex justify-between items-center text-xs">
                  <span class="text-slate-500 font-medium">Lớp nhóm:</span>
                  <span class="font-bold text-slate-700">${s.group_sessions} ca (x${s.don_gia_ca_nhom ? s.don_gia_ca_nhom.toLocaleString('vi-VN') : '150.000'}đ)</span>
                </div>
                <div class="flex justify-between items-center text-xs border-b border-slate-50 pb-3">
                  <span class="text-slate-500 font-medium">Học kèm 1-1:</span>
                  <span class="font-bold text-slate-700">${s.tutor_sessions} ca (x${s.don_gia_ca_kem ? s.don_gia_ca_kem.toLocaleString('vi-VN') : '200.000'}đ)</span>
                </div>
                <div class="flex justify-between items-center text-xs font-bold text-slate-800">
                  <span>Tổng tiền ca dạy:</span>
                  <span class="text-apple-blue font-extrabold text-sm">${(s.luong_ca_day || 0).toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            `)}

            <!-- Bento phụ cấp & khấu trừ -->
            ${_card(`
              ${_sec('payments','Cộng & Trừ lương')}
              <div class="p-5 space-y-3.5">
                <div class="flex justify-between items-center text-xs">
                  <span class="text-slate-500 font-medium flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Phụ cấp & Thưởng:</span>
                  <span class="font-bold text-emerald-600">+${s.phu_cap.toLocaleString('vi-VN')}đ</span>
                </div>
                <div class="flex justify-between items-center text-xs border-b border-slate-50 pb-3">
                  <span class="text-slate-500 font-medium flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>Khấu trừ / Tạm ứng:</span>
                  <span class="font-bold text-red-600">-${(s.khau_tru || 0).toLocaleString('vi-VN')}đ</span>
                </div>
                <div class="flex justify-between items-center text-xs">
                  <span class="text-slate-500 font-medium">Công quét vân tay/thẻ:</span>
                  <span class="font-bold text-slate-700">${s.work_days} ngày công</span>
                </div>
              </div>
            `)}

          </div>
        </div>`;

      document.getElementById('prev-salary-month')?.addEventListener('click', async () => {
        selMonth--; if (selMonth < 1) { selMonth = 12; selYear--; }
        await render();
      });
      document.getElementById('next-salary-month')?.addEventListener('click', async () => {
        selMonth++; if (selMonth > 12) { selMonth = 1; selYear++; }
        await render();
      });
    } catch (err) {
      c.innerHTML = `
        <div class="space-y-4">
          <!-- Chọn kỳ lương khi lỗi -->
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-black text-slate-800">Phiếu lương cá nhân</h2>
            <div class="flex items-center gap-2">
              <button id="prev-salary-month" class="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition">
                <span class="material-symbols-outlined text-[14px]">chevron_left</span>
              </button>
              <span class="text-xs font-bold text-slate-700">${monthNames[selMonth-1]} ${selYear}</span>
              <button id="next-salary-month" class="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition">
                <span class="material-symbols-outlined text-[14px]">chevron_right</span>
              </button>
            </div>
          </div>
          <div class="bg-red-50 border border-red-100 text-red-600 rounded-3xl p-5 text-xs text-center">
            Không tìm thấy thông tin phiếu lương cho kỳ này.
          </div>
        </div>
      `;
      document.getElementById('prev-salary-month')?.addEventListener('click', async () => {
        selMonth--; if (selMonth < 1) { selMonth = 12; selYear--; }
        await render();
      });
      document.getElementById('next-salary-month')?.addEventListener('click', async () => {
        selMonth++; if (selMonth > 12) { selMonth = 1; selYear++; }
        await render();
      });
    }
  }

  c.innerHTML = `<div class="flex items-center justify-center min-h-[200px]"><div class="animate-spin w-6 h-6 rounded-full border-2 border-blue-200 border-t-blue-600"></div></div>`;
  await render();
}

/* ── TAB: HỒ SƠ ── */
async function _tabProfile(c) {
  const hoSoId = localStorage.getItem('hoSoId');
  if (!hoSoId) { c.innerHTML = _card(`<div class="py-12 text-center text-xs text-slate-400">Không tìm thấy hồ sơ</div>`); return; }
  try {
    const res  = await fetch(`${API_BASE}/teachers/${hoSoId}`, { headers: getAuthHeaders() });
    const data = await res.json();
    const gv   = data.data || {};

    c.innerHTML = `
      <div class="space-y-4">
        ${_card(`
          <div class="h-28 relative" style="background:${GRAD}">
            <div class="absolute inset-0 opacity-20" style="background:radial-gradient(circle at 80% 50%,white,transparent)"></div>
            <div class="absolute -bottom-7 left-5 group cursor-pointer" id="tp-avatar-wrap">
              <div class="w-14 h-14 rounded-2xl bg-white shadow-xl shadow-blue-200/50 flex items-center justify-center border-2 border-blue-50 overflow-hidden relative">
                ${gv.avatar_url
                  ? `<img id="tp-avatar-img" src="${gv.avatar_url}" class="w-full h-full object-cover" alt="avatar">`
                  : `<span id="tp-avatar-letter" class="text-2xl font-black" style="color:${NAV}">${(gv.ho_ten||'?').charAt(0)}</span>`
                }
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                  <span class="material-symbols-outlined text-white text-[16px]">photo_camera</span>
                </div>
              </div>
              <input type="file" id="tp-avatar-input" accept="image/*" class="hidden">
            </div>
          </div>
          <div class="pt-10 px-5 pb-5">
            <h3 class="text-base font-black text-slate-800">${gv.ho_ten||'—'}</h3>
            <p class="text-[10px] text-slate-400 font-medium mt-0.5">${gv.ma_ho_so||''} · Giáo viên</p>
            <div class="mt-4 grid grid-cols-2 gap-2.5">
              ${[
                ['Chuyên môn', gv.chuyen_mon||'—'],
                ['Kinh nghiệm', gv.kinh_nghiem ? `${gv.kinh_nghiem} năm` : '—'],
                ['SĐT', gv.so_dien_thoai||'—'],
                ['Email', gv.email||'—'],
                ['Chi nhánh', gv.chi_nhanh||'—'],
                ['Ngày gia nhập', formatDate(gv.ngay_tao)],
              ].map(([l,v]) => `
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
              ${['pw-old:Mật khẩu hiện tại','pw-new:Mật khẩu mới (≥6 ký tự)','pw-cfm:Xác nhận mật khẩu mới'].map(s => {
                const [id, lbl] = s.split(':');
                return `<div>
                  <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wide">${lbl}</label>
                  <input type="password" id="${id}" required class="mt-1 w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none transition">
                </div>`;
              }).join('')}
              <p id="pw-msg" class="text-[10px] hidden mt-1"></p>
              <button type="submit" class="w-full text-white text-xs font-bold py-2.5 rounded-2xl shadow-md hover:opacity-90 active:scale-[.98] transition"
                style="background:${GRAD}">Cập nhật mật khẩu</button>
            </form>
          </div>`)}
      </div>`;

    // Avatar upload (teacher)
    document.getElementById('tp-avatar-wrap')?.addEventListener('click', () => {
      document.getElementById('tp-avatar-input')?.click();
    });
    document.getElementById('tp-avatar-input')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('avatar', file);
      const wrap = document.getElementById('tp-avatar-wrap');
      if (wrap) wrap.style.opacity = '0.5';
      try {
        const r = await fetch(`${API_BASE}/upload/avatar`, {
          method: 'POST', headers: getAuthHeaders(), body: formData
        });
        const result = await r.json();
        if (result.success) {
          const img = document.getElementById('tp-avatar-img');
          const letter = document.getElementById('tp-avatar-letter');
          if (img) { img.src = result.avatar_url; }
          else if (letter) {
            const newImg = document.createElement('img');
            newImg.id = 'tp-avatar-img'; newImg.src = result.avatar_url;
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
        const res = await r.json();
        msg.textContent = res.success ? '✓ Đổi mật khẩu thành công!' : (res.error||'Thất bại');
        msg.className   = `text-[10px] mt-1 ${res.success ? 'text-green-600' : 'text-red-500'}`;
        msg.classList.remove('hidden');
        if (res.success) document.getElementById('pw-form').reset();
      } catch (_) { msg.textContent = 'Lỗi kết nối'; msg.className = 'text-[10px] text-red-500 mt-1'; msg.classList.remove('hidden'); }
    });
  } catch (err) {
    c.innerHTML = `<div class="bg-red-50 border border-red-100 text-red-600 rounded-3xl p-5 text-xs">${err.message}</div>`;
  }
}
