// AccountManagement.js — Quản lý tài khoản học viên & giáo viên (Admin)
import { API_BASE, showToast } from './_shared.js';

const ROLE_LABEL = { admin: 'Admin / Quản lý', nhan_vien: 'Nhân viên', le_tan: 'Nhân viên', giao_vien: 'Giáo viên', hoc_vien: 'Học viên' };
const ROLE_CLS = {
  admin: 'bg-purple-100 text-purple-700 border border-purple-200',
  nhan_vien: 'bg-blue-100 text-blue-700 border border-blue-200',
  le_tan: 'bg-blue-100 text-blue-700 border border-blue-200',
  giao_vien: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  hoc_vien: 'bg-orange-100 text-orange-700 border border-orange-200',
};

function authHeaders() {
  return {
    'x-user-role': localStorage.getItem('userRole') || 'admin',
    'Content-Type': 'application/json'
  };
}

function fmt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export async function renderAccountManagement(container) {
  container.innerHTML = `
    <div class="space-y-5">
      <!-- Header row -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 class="font-bold text-apple-ink text-sm"></h3>
        <div class="flex items-center gap-2">
          <button id="btn-refresh-accounts" class="flex items-center justify-center gap-1.5 px-4 py-2 border border-[#e2e2e4] hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-full transition-all active:scale-95 shadow-sm h-[32px]">
            <span class="material-symbols-outlined text-[16px]">refresh</span>Tải lại
          </button>
          <button id="btn-create-account"
            class="flex items-center gap-2 bg-[#0066cc] hover:bg-[#0055b3] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-md shadow-[#0066cc]/20 active:scale-[.98] h-[32px]">
            <span class="material-symbols-outlined text-[16px]">person_add</span>
            Tạo tài khoản mới
          </button>
        </div>
      </div>

      <!-- Stats row -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3" id="acct-stats">
        ${[1, 2, 3, 4].map(() => `<div class="bg-white rounded-2xl border border-[#e2e2e4] p-4 animate-pulse h-20"></div>`).join('')}
      </div>

      <!-- Filter tabs -->
      <div class="flex gap-2 flex-wrap" id="acct-filter">
        ${['Tất cả', 'hoc_vien', 'giao_vien', 'nhan_vien', 'admin'].map((r, i) => `
          <button data-role="${r}"
            class="acct-filter-btn ${i === 0 ? 'bg-[#0066cc] text-white shadow-sm shadow-[#0066cc]/30' : 'bg-white text-slate-500 border border-[#e2e2e4]'} text-[10px] font-semibold px-3 py-1.5 rounded-full transition hover:border-[#0066cc]/50">
            ${i === 0 ? 'Tất cả' : ROLE_LABEL[r]}
          </button>`).join('')}
      </div>

      <!-- Search -->
      <div class="relative">
        <span class="material-symbols-outlined absolute left-3 top-2.5 text-[17px] text-slate-400">search</span>
        <input id="acct-search" type="text" placeholder="Tìm theo tên đăng nhập, họ tên, email..."
          class="w-full pl-9 pr-4 py-2.5 bg-white border border-[#e2e2e4] rounded-xl text-xs font-medium focus:outline-none focus:border-[#0066cc] transition">
      </div>

      <!-- Table -->
      <div class="bg-white rounded-2xl border border-[#e2e2e4] shadow-sm overflow-hidden">
        <div id="acct-table-wrap" class="overflow-x-auto">
          <div class="flex items-center justify-center p-10">
            <div class="animate-spin rounded-full h-7 w-7 border-b-2 border-[#0066cc]"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal tạo tài khoản -->
    <div id="modal-create" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" onclick="document.getElementById('modal-create').classList.add('hidden')"></div>
      <div class="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="flex items-center justify-between px-6 py-5 border-b border-[#f0f0f2]">
          <h3 class="text-sm font-bold text-[#1d1d1f]">Tạo tài khoản mới</h3>
          <button onclick="document.getElementById('modal-create').classList.add('hidden')"
            class="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition">
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <form id="form-create" class="px-6 py-5 space-y-3">
          <div>
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Vai trò <span class="text-red-500">*</span></label>
            <select id="c-role" required class="mt-1 w-full px-3 py-2.5 bg-[#f5f5f7] border border-[#e2e2e4] rounded-xl text-xs font-medium focus:outline-none focus:border-[#0066cc] transition">
              <option value="">— Chọn vai trò —</option>
              <option value="nhan_vien">Nhân viên</option>
              <option value="admin">Admin / Quản lý</option>
            </select>
          </div>
          <div id="c-profile-wrap" class="hidden">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Liên kết hồ sơ <span class="text-red-500">*</span></label>
            <select id="c-profile" required class="mt-1 w-full px-3 py-2.5 bg-[#f5f5f7] border border-[#e2e2e4] rounded-xl text-xs font-medium focus:outline-none focus:border-[#0066cc] transition">
              <option value="">— Chọn hồ sơ liên kết —</option>
            </select>
            <p class="text-[9px] text-slate-400 mt-1">Chỉ hiện hồ sơ chưa có tài khoản</p>
          </div>
          <div>
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tên đăng nhập <span class="text-red-500">*</span></label>
            <input id="c-user" required type="text" placeholder="vd: hocvien01"
              class="mt-1 w-full px-3 py-2.5 bg-[#f5f5f7] border border-[#e2e2e4] rounded-xl text-xs font-medium focus:outline-none focus:border-[#0066cc] transition">
          </div>
          <div>
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Mật khẩu <span class="text-red-500">*</span></label>
            <input id="c-pw" required type="password" placeholder="Ít nhất 6 ký tự" minlength="6"
              class="mt-1 w-full px-3 py-2.5 bg-[#f5f5f7] border border-[#e2e2e4] rounded-xl text-xs font-medium focus:outline-none focus:border-[#0066cc] transition">
          </div>
          <p id="c-err" class="text-[10px] text-red-500 hidden"></p>
          <div class="flex gap-2 pt-1">
            <button type="button" onclick="document.getElementById('modal-create').classList.add('hidden')"
              class="flex-1 text-xs font-semibold py-2.5 rounded-xl border border-[#e2e2e4] text-slate-500 hover:bg-slate-50 transition">Hủy</button>
            <button type="submit"
              class="flex-1 bg-[#0066cc] hover:bg-[#0055b3] text-white text-xs font-bold py-2.5 rounded-xl transition shadow-md shadow-[#0066cc]/20">Tạo tài khoản</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal sửa tài khoản -->
    <div id="modal-edit" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" onclick="document.getElementById('modal-edit').classList.add('hidden')"></div>
      <div class="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="flex items-center justify-between px-6 py-5 border-b border-[#f0f0f2]">
          <h3 class="text-sm font-bold text-[#1d1d1f]">Chỉnh sửa tài khoản</h3>
            <button onclick="document.getElementById('modal-edit').classList.add('hidden')"
            class="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition">
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <form id="form-edit-account" class="px-6 py-5 space-y-3">
          <input type="hidden" id="e-id">
          <div>
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Vai trò <span class="text-red-500">*</span></label>
            <select id="e-role" required class="mt-1 w-full px-3 py-2.5 bg-[#f5f5f7] border border-[#e2e2e4] rounded-xl text-xs font-medium focus:outline-none focus:border-[#0066cc] transition">
              <option value="hoc_vien">Học viên</option>
              <option value="giao_vien">Giáo viên</option>
              <option value="nhan_vien">Nhân viên</option>
              <option value="admin">Admin / Quản lý</option>
            </select>
          </div>
          <input type="hidden" id="e-profile-id">
          <div>
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tên đăng nhập <span class="text-red-500">*</span></label>
            <input id="e-user" required type="text" placeholder="vd: hocvien01"
              class="mt-1 w-full px-3 py-2.5 bg-[#f5f5f7] border border-[#e2e2e4] rounded-xl text-xs font-medium focus:outline-none focus:border-[#0066cc] transition">
          </div>
          <div>
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Mật khẩu mới (Để trống nếu không đổi)</label>
            <input id="e-pw" type="password" placeholder="Nhập mật khẩu mới nếu muốn đổi" minlength="6"
              class="mt-1 w-full px-3 py-2.5 bg-[#f5f5f7] border border-[#e2e2e4] rounded-xl text-xs font-medium focus:outline-none focus:border-[#0066cc] transition">
          </div>
          <div>
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nhập lại mật khẩu mới</label>
            <input id="e-pw-confirm" type="password" placeholder="Nhập lại mật khẩu mới" minlength="6"
              class="mt-1 w-full px-3 py-2.5 bg-[#f5f5f7] border border-[#e2e2e4] rounded-xl text-xs font-medium focus:outline-none focus:border-[#0066cc] transition">
          </div>
          <p id="e-err" class="text-[10px] text-red-500 hidden"></p>
          <div class="flex gap-2 pt-1">
            <button type="button" onclick="document.getElementById('modal-edit').classList.add('hidden')"
              class="flex-1 text-xs font-semibold py-2.5 rounded-xl border border-[#e2e2e4] text-slate-500 hover:bg-slate-50 transition">Hủy</button>
            <button type="submit"
              class="flex-1 bg-[#0066cc] hover:bg-[#0055b3] text-white text-xs font-bold py-2.5 rounded-xl transition shadow-md shadow-[#0066cc]/20">Lưu thay đổi</button>
          </div>
        </form>
      </div>
    </div>
 
    <!-- Modal xem chi tiết tài khoản -->
    <div id="modal-view" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" onclick="document.getElementById('modal-view').classList.add('hidden')"></div>
      <div class="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="flex items-center justify-between px-6 py-5 border-b border-[#f0f0f2]">
          <h3 class="text-sm font-bold text-[#1d1d1f]">Chi tiết tài khoản</h3>
          <button onclick="document.getElementById('modal-view').classList.add('hidden')"
            class="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition">
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <div class="px-6 py-5 space-y-4 text-xs" id="view-account-details">
          <!-- Nội dung chi tiết load động ở đây -->
        </div>
        <div class="px-6 py-4 bg-[#f9f9fb] border-t border-[#f0f0f2] flex justify-end">
          <button onclick="document.getElementById('modal-view').classList.add('hidden')"
            class="bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-5 py-2 rounded-xl transition">Đóng</button>
        </div>
      </div>
    </div>
  `;
 
  let allAccounts = [];
  let filterRole = 'Tất cả';
  let searchQ = '';
 
  // Load dữ liệu
  async function load() {
    try {
      const res = await fetch(`${API_BASE}/accounts`, { headers: { 'x-user-role': localStorage.getItem('userRole') || 'admin' } });
      const data = await res.json();
      allAccounts = data.data || [];
      renderStats();
      renderTable();
    } catch (err) {
      document.getElementById('acct-table-wrap').innerHTML = `<div class="p-6 text-xs text-red-500">${err.message}</div>`;
    }
  }
 
  function renderStats() {
    const total = allAccounts.length;
    const active = allAccounts.filter(a => a.is_active).length;
    const hvs = allAccounts.filter(a => a.vai_tro === 'hoc_vien').length;
    const gvs = allAccounts.filter(a => a.vai_tro === 'giao_vien').length;
    document.getElementById('acct-stats').innerHTML = [
      ['group', 'Tổng tài khoản', total, '#0066cc'],
      ['check_circle', 'Đang hoạt động', active, '#22c55e'],
      ['school', 'Học viên', hvs, '#f97316'],
      ['badge', 'Giáo viên', gvs, '#059669'],
    ].map(([icon, lbl, val, color]) => `
      <div class="bg-white rounded-2xl border border-[#e2e2e4] p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-7 h-7 rounded-xl flex items-center justify-center" style="background:${color}15">
            <span class="material-symbols-outlined text-[15px]" style="color:${color}">${icon}</span>
          </div>
          <p class="text-[10px] text-slate-400 font-medium">${lbl}</p>
        </div>
        <p class="text-xl font-bold text-[#1d1d1f]">${val}</p>
      </div>`).join('');
  }
 
  function renderTable() {
    let rows = allAccounts;
    if (filterRole !== 'Tất cả') {
      rows = rows.filter(a => {
        if (filterRole === 'nhan_vien') {
          return a.vai_tro === 'nhan_vien' || a.vai_tro === 'le_tan' || a.vai_tro === 'ke_toan';
        }
        return a.vai_tro === filterRole;
      });
    }
    if (searchQ) {
      const q = searchQ.toLowerCase();
      rows = rows.filter(a =>
        a.ten_dang_nhap?.toLowerCase().includes(q) ||
        a.ho_ten?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q)
      );
    }
 
    const wrap = document.getElementById('acct-table-wrap');
    if (rows.length === 0) {
      wrap.innerHTML = `<div class="py-14 text-center"><span class="material-symbols-outlined text-4xl text-slate-200">manage_accounts</span><p class="text-xs text-slate-400 mt-2">Không tìm thấy tài khoản nào</p></div>`;
      return;
    }
 
    wrap.innerHTML = `
      <table class="w-full text-xs">
        <thead>
          <tr class="bg-[#fafafa] border-b border-[#f0f0f2]">
            <th class="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Người sở hữu</th>
            <th class="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Thông tin đăng nhập</th>
            <th class="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wide hidden sm:table-cell">Đăng nhập cuối</th>
            <th class="text-center px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Trạng thái</th>
            <th class="text-right px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Thao tác</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#f5f5f7]">
          ${rows.map(a => `
            <tr class="hover:bg-slate-50/70 transition-colors cursor-pointer" data-id="${a.id}">
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                       style="background:${a.vai_tro === 'hoc_vien' ? '#f97316' : a.vai_tro === 'giao_vien' ? '#059669' : a.vai_tro === 'admin' ? '#7c3aed' : '#0066cc'}">
                    ${(a.ho_ten || a.ten_dang_nhap || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p class="font-semibold text-[#1d1d1f]">${a.ho_ten || 'Tài khoản hệ thống'}</p>
                    <div class="mt-1">
                      <span class="text-[9px] font-bold px-2 py-0.5 rounded-full ${ROLE_CLS[a.vai_tro] || 'bg-slate-100 text-slate-500'}">${ROLE_LABEL[a.vai_tro] || a.vai_tro}</span>
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3.5">
                <p class="font-medium text-[#1d1d1f]">${a.ten_dang_nhap}</p>
                ${a.email ? `<p class="text-[10px] text-slate-400 mt-0.5">${a.email}</p>` : ''}
              </td>
              <td class="px-4 py-3.5 hidden sm:table-cell">
                <p class="text-[10px] text-slate-500">${a.lan_dang_nhap_cuoi ? fmt(a.lan_dang_nhap_cuoi) : 'Chưa đăng nhập'}</p>
              </td>
              <td class="px-4 py-3.5 text-center">
                <button onclick="window._acctToggle(${a.id}, ${a.is_active}, this)"
                  class="inline-flex items-center gap-1 text-[9px] font-bold px-2.5 py-1 rounded-full transition cursor-pointer
                    ${a.is_active
        ? 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200'
        : 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200'}">
                  <span class="material-symbols-outlined text-[11px]">${a.is_active ? 'check_circle' : 'block'}</span>
                  ${a.is_active ? 'Hoạt động' : 'Bị khóa'}
                </button>
              </td>
              <td class="px-5 py-3.5 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button onclick="window._acctView(${a.id})"
                    class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition" title="Xem chi tiết">
                    <span class="material-symbols-outlined text-[15px]">visibility</span>
                  </button>
                  <button onclick="window._acctEdit(${a.id})"
                    class="w-7 h-7 rounded-lg flex items-center justify-center text-[#0066cc] hover:bg-[#0066cc]/5 transition" title="Sửa tài khoản">
                    <span class="material-symbols-outlined text-[15px]">edit</span>
                  </button>
                  <button onclick="window._acctToggle(${a.id}, ${a.is_active}, this)"
                    class="w-7 h-7 rounded-lg flex items-center justify-center transition 
                      ${a.is_active ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}" 
                    title="${a.is_active ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}">
                    <span class="material-symbols-outlined text-[15px]">${a.is_active ? 'lock' : 'lock_open'}</span>
                  </button>
                  <button onclick="window._acctDelete(${a.id}, '${a.ten_dang_nhap}')"
                    class="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 transition" title="Xóa tài khoản">
                    <span class="material-symbols-outlined text-[15px]">delete</span>
                  </button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>`;
 
    // Lắng nghe sự kiện click trên từng dòng để xem chi tiết (bỏ qua nếu click trúng button/thao tác)
    wrap.querySelectorAll('tbody tr').forEach(tr => {
      tr.addEventListener('click', e => {
        if (e.target.closest('button')) return;
        window._acctView(parseInt(tr.dataset.id));
      });
    });
  }
 
  // Filter tabs
  document.getElementById('acct-filter')?.addEventListener('click', e => {
    const btn = e.target.closest('.acct-filter-btn');
    if (!btn) return;
    filterRole = btn.dataset.role;
    document.querySelectorAll('.acct-filter-btn').forEach(b => {
      if (b === btn) { b.className = b.className.replace('bg-white text-slate-500 border border-[#e2e2e4]', 'bg-[#0066cc] text-white shadow-sm shadow-[#0066cc]/30'); }
      else { b.className = b.className.replace('bg-[#0066cc] text-white shadow-sm shadow-[#0066cc]/30', 'bg-white text-slate-500 border border-[#e2e2e4]'); }
    });
    renderTable();
  });
 
  // Search
  document.getElementById('acct-search')?.addEventListener('input', e => { searchQ = e.target.value; renderTable(); });
 
  // Sự kiện tải lại
  document.getElementById('btn-refresh-accounts')?.addEventListener('click', () => {
    load();
  });
 
  // Mở modal tạo
  document.getElementById('btn-create-account')?.addEventListener('click', () => {
    document.getElementById('modal-create').classList.remove('hidden');
    document.getElementById('form-create').reset();
    document.getElementById('c-err').classList.add('hidden');
    document.getElementById('c-profile-wrap').classList.add('hidden');
  });
 
  // Khi chọn vai trò trong form tạo → load profile
  document.getElementById('c-role')?.addEventListener('change', async e => {
    const role = e.target.value;
    const wrap = document.getElementById('c-profile-wrap');
    const sel = document.getElementById('c-profile');
    if (role === 'hoc_vien' || role === 'giao_vien' || role === 'nhan_vien' || role === 'admin') {
      wrap.classList.remove('hidden');
      sel.innerHTML = `<option value="">— Đang tải... —</option>`;
      try {
        const loaiParam = (role === 'admin' || role === 'nhan_vien') ? 'nhan_vien' : role;
        const r = await fetch(`${API_BASE}/accounts/available-profiles?loai=${loaiParam}`, { headers: { 'x-user-role': 'admin' } });
        const d = await r.json();
        const profiles = d.data || [];
        sel.innerHTML = `<option value="">— Chọn hồ sơ liên kết —</option>` +
          profiles.map(p => `<option value="${p.id}">${p.ho_ten} (${p.ma_ho_so})</option>`).join('');
        // Auto-fill tên đăng nhập khi chọn hồ sơ
        sel.addEventListener('change', () => {
          const opt = sel.options[sel.selectedIndex];
          if (opt.value) {
            const code = opt.text.match(/\(([^)]+)\)/)?.[1]?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
            document.getElementById('c-user').value = code;
          }
        });
      } catch (_) { sel.innerHTML = `<option value="">— Lỗi tải dữ liệu —</option>`; }
    } else {
      wrap.classList.add('hidden');
    }
  });
 
  // Submit tạo tài khoản
  document.getElementById('form-create')?.addEventListener('submit', async e => {
    e.preventDefault();
    const errEl = document.getElementById('c-err');
    const matKhau = document.getElementById('c-pw').value;
    if (matKhau.length < 6) {
      errEl.textContent = 'Mật khẩu phải có ít nhất 6 ký tự';
      errEl.classList.remove('hidden');
      return;
    }
    const body = {
      vai_tro: document.getElementById('c-role').value,
      ho_so_id: document.getElementById('c-profile').value || null,
      ten_dang_nhap: document.getElementById('c-user').value.trim(),
      mat_khau: matKhau,
    };
    try {
      const r = await fetch(`${API_BASE}/accounts`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(body)
      });
      const res = await r.json();
      if (res.success) {
        showToast(`Đã tạo tài khoản "${body.ten_dang_nhap}" thành công!`);
        document.getElementById('modal-create').classList.add('hidden');
        await load();
      } else {
        errEl.textContent = res.error || 'Tạo tài khoản thất bại';
        errEl.classList.remove('hidden');
      }
    } catch (_) { errEl.textContent = 'Lỗi kết nối máy chủ'; errEl.classList.remove('hidden'); }
  });
 
  // Submit chỉnh sửa tài khoản (Gồm cả mật khẩu mới và xác nhận mật khẩu)
  document.getElementById('form-edit-account')?.addEventListener('submit', async e => {
    e.preventDefault();
    const id = document.getElementById('e-id').value;
    const errEl = document.getElementById('e-err');
    const pw = document.getElementById('e-pw').value;
    const pwConfirm = document.getElementById('e-pw-confirm').value;

    let mat_khau_moi = undefined;
    if (pw.trim() !== '') {
      if (pw.length < 6) {
        errEl.textContent = 'Mật khẩu mới phải có ít nhất 6 ký tự';
        errEl.classList.remove('hidden');
        return;
      }
      if (pw !== pwConfirm) {
        errEl.textContent = 'Mật khẩu xác nhận không khớp';
        errEl.classList.remove('hidden');
        return;
      }
      mat_khau_moi = pw;
    }

    const body = {
      vai_tro: document.getElementById('e-role').value,
      ho_so_id: document.getElementById('e-profile-id').value || null,
      ten_dang_nhap: document.getElementById('e-user').value.trim(),
      mat_khau_moi
    };
    try {
      const r = await fetch(`${API_BASE}/accounts/${id}`, {
        method: 'PUT', headers: authHeaders(), body: JSON.stringify(body)
      });
      const res = await r.json();
      if (res.success) {
        showToast(`Đã cập nhật tài khoản "${body.ten_dang_nhap}" thành công!`);
        document.getElementById('modal-edit').classList.add('hidden');
        await load();
      } else {
        errEl.textContent = res.error || 'Cập nhật tài khoản thất bại';
        errEl.classList.remove('hidden');
      }
    } catch (_) { errEl.textContent = 'Lỗi kết nối máy chủ'; errEl.classList.remove('hidden'); }
  });
 
  // Mở modal Edit và điền dữ liệu (Xem / Sửa tài khoản)
  window._acctEdit = async (id) => {
    const acct = allAccounts.find(a => a.id === id);
    if (!acct) return;
 
    document.getElementById('e-id').value = acct.id;
    document.getElementById('e-user').value = acct.ten_dang_nhap;
    document.getElementById('e-pw').value = ''; // Reset password field
    document.getElementById('e-pw-confirm').value = ''; // Reset password confirm field
    
    let interfaceRole = acct.vai_tro;
    if (acct.vai_tro === 'le_tan' || acct.vai_tro === 'ke_toan') interfaceRole = 'nhan_vien';
    document.getElementById('e-role').value = interfaceRole;
    document.getElementById('e-err').classList.add('hidden');
    
    // Gán ID hồ sơ liên kết ngầm
    document.getElementById('e-profile-id').value = acct.ho_so_id || '';
 
    document.getElementById('modal-edit').classList.remove('hidden');
  };
 
  // Mở modal Xem chi tiết tài khoản
  window._acctView = (id) => {
    const acct = allAccounts.find(a => a.id === id);
    if (!acct) return;
 
    const detailsWrap = document.getElementById('view-account-details');
    let roleText = ROLE_LABEL[acct.vai_tro] || acct.vai_tro;
    
    detailsWrap.innerHTML = `
      <div class="space-y-4">
        <!-- Phần thông tin tài khoản -->
        <div>
          <h4 class="font-bold text-[#0066cc] mb-2 text-[10px] uppercase tracking-wider">Thông tin tài khoản</h4>
          <div class="grid grid-cols-2 gap-y-2 bg-[#f5f5f7] p-4 rounded-2xl border border-slate-100/50">
            <span class="text-slate-400">ID tài khoản:</span>
            <span class="font-bold text-slate-800">${acct.id}</span>
            
            <span class="text-slate-400">Tên đăng nhập:</span>
            <span class="font-bold text-slate-800">${acct.ten_dang_nhap}</span>
            
            <span class="text-slate-400">Vai trò:</span>
            <span class="font-bold text-slate-800">${roleText}</span>
            
            <span class="text-slate-400">Trạng thái:</span>
            <span class="font-bold ${acct.trang_thai === 'hoat_dong' ? 'text-green-600' : 'text-red-500'}">
              ${acct.trang_thai === 'hoat_dong' ? 'Hoạt động' : 'Bị khóa'}
            </span>
            
            <span class="text-slate-400">Ngày tạo:</span>
            <span class="font-semibold text-slate-700">${fmt(acct.ngay_tao)}</span>
            
            <span class="text-slate-400">Đăng nhập cuối:</span>
            <span class="font-semibold text-slate-700">${acct.lan_dang_nhap_cuoi ? new Date(acct.lan_dang_nhap_cuoi).toLocaleString('vi-VN') : 'Chưa đăng nhập'}</span>
          </div>
        </div>
 
        <!-- Phân hồ sơ liên kết -->
        <div>
          <h4 class="font-bold text-[#0066cc] mb-2 text-[10px] uppercase tracking-wider">Hồ sơ cá nhân liên kết</h4>
          ${acct.ho_so_id ? `
            <div class="grid grid-cols-2 gap-y-2 bg-blue-50/20 p-4 rounded-2xl border border-blue-100/20">
              <span class="text-slate-400">ID hồ sơ:</span>
              <span class="font-bold text-slate-800">${acct.ho_so_id}</span>
              
              <span class="text-slate-400">Mã hồ sơ:</span>
              <span class="font-bold text-slate-800">${acct.ma_ho_so || '—'}</span>
              
              <span class="text-slate-400">Họ và tên:</span>
              <span class="font-bold text-slate-800">${acct.ho_ten || '—'}</span>
              
              <span class="text-slate-400">Phân loại hồ sơ:</span>
              <span class="font-semibold text-slate-700">
                ${acct.loai_ho_so === 'hoc_vien' ? 'Học viên' : acct.loai_ho_so === 'giao_vien' ? 'Giáo viên' : 'Nhân sự / Nhân viên'}
              </span>
            </div>
          ` : `
            <div class="bg-slate-50 text-slate-400 p-4 text-center rounded-2xl border border-dashed border-slate-200">
              Tài khoản này chưa liên kết với hồ sơ cá nhân nào.
            </div>
          `}
        </div>
      </div>
    `;
    
    document.getElementById('modal-view').classList.remove('hidden');
  };
 
  // Toggle active
  window._acctToggle = async (id, current, btn) => {
    const actionText = current ? 'KHÓA' : 'MỞ KHÓA / KÍCH HOẠT';
    if (!confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản này?`)) return;
    try {
      const r = await fetch(`${API_BASE}/accounts/${id}/toggle`, { method: 'PUT', headers: { 'x-user-role': 'admin' } });
      const res = await r.json();
      if (res.success) {
        showToast(res.is_active ? 'Đã kích hoạt tài khoản' : 'Đã khóa tài khoản');
        await load();
      }
    } catch (_) { showToast('Lỗi kết nối', 'error'); }
  };
 
  // Delete
  window._acctDelete = async (id, name) => {
    if (!confirm(`Xóa tài khoản "${name}"? Hành động này không thể hoàn tác.`)) return;
    try {
      const r = await fetch(`${API_BASE}/accounts/${id}`, { method: 'DELETE', headers: { 'x-user-role': 'admin' } });
      const res = await r.json();
      if (res.success) { showToast(`Đã xóa tài khoản "${name}"`); await load(); }
      else showToast(res.error || 'Xóa thất bại', 'error');
    } catch (_) { showToast('Lỗi kết nối', 'error'); }
  };

  load();
}
