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
    <div class="space-y-6">
      <!-- Header row -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 class="text-xl font-bold text-slate-800 tracking-tight">Quản lý tài khoản</h3>
          <p class="text-xs text-slate-400 mt-0.5 font-medium">Cấp phát và giám sát quyền truy cập hệ thống</p>
        </div>
        <div class="flex items-center gap-2">
          <button id="btn-refresh-accounts" class="flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200/80 bg-white/60 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-full transition-all active:scale-95 shadow-sm h-[34px]">
            <span class="material-symbols-outlined text-[16px] text-slate-500">refresh</span>Tải lại
          </button>
          <button id="btn-create-account"
            class="flex items-center gap-2 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold px-4.5 py-2 rounded-full transition shadow-md shadow-[#0071e3]/10 active:scale-[.98] h-[34px]">
            <span class="material-symbols-outlined text-[16px]">person_add</span>
            Tạo tài khoản mới
          </button>
        </div>
      </div>

      <!-- Stats row -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4" id="acct-stats">
        ${[1, 2, 3, 4].map(() => `<div class="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-100 p-4 animate-pulse h-20 shadow-sm"></div>`).join('')}
      </div>

      <!-- Filter & Search row -->
      <div class="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <!-- Filter tabs -->
        <div class="bg-slate-100/80 p-0.5 rounded-full inline-flex gap-0.5 w-full md:w-auto max-w-full overflow-x-auto no-scrollbar" id="acct-filter">
          ${['Tất cả', 'hoc_vien', 'giao_vien', 'nhan_vien', 'admin'].map((r, i) => `
            <button data-role="${r}"
              class="acct-filter-btn flex-1 md:flex-initial text-center whitespace-nowrap text-[11px] font-semibold px-4 py-1.5 rounded-full transition-all duration-200 ${i === 0 ? 'bg-white text-[#0071e3] shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'}">
              ${i === 0 ? 'Tất cả' : ROLE_LABEL[r]}
            </button>`).join('')}
        </div>

        <!-- Search -->
        <div class="relative flex-1 md:max-w-xs">
          <span class="material-symbols-outlined absolute left-3.5 top-2.5 text-[17px] text-slate-400">search</span>
          <input id="acct-search" type="text" placeholder="Tìm tên đăng nhập, họ tên..."
            class="w-full pl-9.5 pr-4 py-2 bg-white border border-slate-200/60 rounded-full text-xs font-medium focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]/20 transition-all shadow-sm">
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div id="acct-table-wrap" class="overflow-x-auto">
          <div class="flex items-center justify-center p-14">
            <div class="animate-spin rounded-full h-7 w-7 border-b-2 border-[#0071e3]"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal tạo tài khoản -->
    <div id="modal-create" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onclick="document.getElementById('modal-create').classList.add('hidden')"></div>
      <div class="relative bg-white/90 backdrop-blur-md rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100/50">
        <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h3 class="text-sm font-bold text-slate-800">Tạo tài khoản mới</h3>
            <p class="text-[10px] text-slate-400 mt-0.5">Liên kết hồ sơ cá nhân với tài khoản đăng nhập</p>
          </div>
          <button onclick="document.getElementById('modal-create').classList.add('hidden')"
            class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <form id="form-create" class="px-6 py-5 space-y-4">
          <div>
            <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Vai trò <span class="text-red-500">*</span></label>
            <select id="c-role" required class="mt-1.5 w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200/60 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0071e3] transition">
              <option value="">— Chọn vai trò —</option>
              <option value="nhan_vien">Nhân viên</option>
              <option value="admin">Admin / Quản lý</option>
            </select>
          </div>
          <div id="c-profile-wrap" class="hidden">
            <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Liên kết hồ sơ <span class="text-red-500">*</span></label>
            <select id="c-profile" required class="mt-1.5 w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200/60 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0071e3] transition">
              <option value="">— Chọn hồ sơ liên kết —</option>
            </select>
            <p class="text-[9px] text-slate-400 mt-1 pl-1">Chỉ hiện hồ sơ chưa có tài khoản</p>
          </div>
          <div>
            <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tên đăng nhập <span class="text-red-500">*</span></label>
            <input id="c-user" required type="text" placeholder="vd: hocvien01"
              class="mt-1.5 w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200/60 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0071e3] transition">
          </div>
          <div>
            <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Mật khẩu <span class="text-red-500">*</span></label>
            <input id="c-pw" required type="password" placeholder="Ít nhất 6 ký tự" minlength="6"
              class="mt-1.5 w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200/60 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0071e3] transition">
          </div>
          <p id="c-err" class="text-[10px] text-red-500 hidden bg-red-50 p-2.5 rounded-lg border border-red-100"></p>
          <div class="flex gap-2.5 pt-2">
            <button type="button" onclick="document.getElementById('modal-create').classList.add('hidden')"
              class="flex-1 text-xs font-semibold py-2.5 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all">Hủy</button>
            <button type="submit"
              class="flex-1 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold py-2.5 rounded-full transition-all shadow-md shadow-[#0071e3]/10">Tạo tài khoản</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal sửa tài khoản -->
    <div id="modal-edit" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onclick="document.getElementById('modal-edit').classList.add('hidden')"></div>
      <div class="relative bg-white/90 backdrop-blur-md rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100/50">
        <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h3 class="text-sm font-bold text-slate-800">Chỉnh sửa tài khoản</h3>
            <p class="text-[10px] text-slate-400 mt-0.5">Cập nhật vai trò hoặc mật khẩu</p>
          </div>
          <button onclick="document.getElementById('modal-edit').classList.add('hidden')"
            class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <form id="form-edit-account" class="px-6 py-5 space-y-4">
          <input type="hidden" id="e-id">
          <div>
            <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Vai trò <span class="text-red-500">*</span></label>
            <select id="e-role" required class="mt-1.5 w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200/60 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0071e3] transition">
              <option value="hoc_vien">Học viên</option>
              <option value="giao_vien">Giáo viên</option>
              <option value="nhan_vien">Nhân viên</option>
              <option value="admin">Admin / Quản lý</option>
            </select>
          </div>
          <input type="hidden" id="e-profile-id">
          <div>
            <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tên đăng nhập <span class="text-red-500">*</span></label>
            <input id="e-user" required type="text" placeholder="vd: hocvien01"
              class="mt-1.5 w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200/60 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0071e3] transition">
          </div>
          <div>
            <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Mật khẩu mới (Để trống nếu không đổi)</label>
            <input id="e-pw" type="password" placeholder="Nhập mật khẩu mới nếu muốn đổi" minlength="6"
              class="mt-1.5 w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200/60 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0071e3] transition">
          </div>
          <div>
            <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Nhập lại mật khẩu mới</label>
            <input id="e-pw-confirm" type="password" placeholder="Nhập lại mật khẩu mới" minlength="6"
              class="mt-1.5 w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200/60 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0071e3] transition">
          </div>
          <p id="e-err" class="text-[10px] text-red-500 hidden bg-red-50 p-2.5 rounded-lg border border-red-100"></p>
          <div class="flex gap-2.5 pt-2">
            <button type="button" onclick="document.getElementById('modal-edit').classList.add('hidden')"
              class="flex-1 text-xs font-semibold py-2.5 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all">Hủy</button>
            <button type="submit"
              class="flex-1 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold py-2.5 rounded-full transition-all shadow-md shadow-[#0071e3]/10">Lưu thay đổi</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal xem chi tiết tài khoản -->
    <div id="modal-view" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onclick="document.getElementById('modal-view').classList.add('hidden')"></div>
      <div class="relative bg-white/90 backdrop-blur-md rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100/50">
        <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h3 class="text-sm font-bold text-slate-800">Chi tiết tài khoản</h3>
            <p class="text-[10px] text-slate-400 mt-0.5">Thông tin định danh và hồ sơ liên kết</p>
          </div>
          <button onclick="document.getElementById('modal-view').classList.add('hidden')"
            class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <div class="px-6 py-5 space-y-5 text-xs" id="view-account-details">
          <!-- Nội dung chi tiết load động ở đây -->
        </div>
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button onclick="document.getElementById('modal-view').classList.add('hidden')"
            class="bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-5 py-2 rounded-full transition-all active:scale-95 shadow-sm">Đóng</button>
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
      ['group', 'Tổng tài khoản', total, 'text-[#0071e3]', 'bg-blue-50/50'],
      ['check_circle', 'Đang hoạt động', active, 'text-emerald-600', 'bg-emerald-50/50'],
      ['school', 'Học viên', hvs, 'text-orange-500', 'bg-orange-50/50'],
      ['badge', 'Giáo viên', gvs, 'text-teal-600', 'bg-teal-50/50'],
    ].map(([icon, lbl, val, textColor, bgColor]) => `
      <div class="bg-white/60 backdrop-blur-md rounded-2xl border border-slate-100/80 p-4 shadow-sm hover:shadow-md transition-all duration-300">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center ${bgColor}">
            <span class="material-symbols-outlined text-[16px] ${textColor}">${icon}</span>
          </div>
          <div>
            <p class="text-[9px] text-slate-400 font-bold uppercase tracking-wider">${lbl}</p>
            <p class="text-lg font-bold text-slate-800 mt-0.5">${val}</p>
          </div>
        </div>
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
          <tr class="bg-slate-50/50 border-b border-slate-100">
            <th class="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Người sở hữu</th>
            <th class="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thông tin đăng nhập</th>
            <th class="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Đăng nhập cuối</th>
            <th class="text-center px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trạng thái</th>
            <th class="text-right px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thao tác</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100/70">
          ${rows.map(a => `
            <tr class="hover:bg-slate-50/40 transition-colors cursor-pointer" data-id="${a.id}">
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 shadow-sm"
                       style="background:${a.vai_tro === 'hoc_vien' ? '#fff7ed' : a.vai_tro === 'giao_vien' ? '#ecfdf5' : a.vai_tro === 'admin' ? '#f5f3ff' : '#eff6ff'}; 
                              color:${a.vai_tro === 'hoc_vien' ? '#ea580c' : a.vai_tro === 'giao_vien' ? '#059669' : a.vai_tro === 'admin' ? '#7c3aed' : '#0071e3'}">
                    ${(a.ho_ten || a.ten_dang_nhap || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p class="font-semibold text-slate-800">${a.ho_ten || 'Tài khoản hệ thống'}</p>
                    <div class="mt-1">
                      <span class="text-[9px] font-bold px-2.5 py-0.5 rounded-full ${ROLE_CLS[a.vai_tro] || 'bg-slate-100 text-slate-500'}">${ROLE_LABEL[a.vai_tro] || a.vai_tro}</span>
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3.5">
                <p class="font-medium text-slate-800">${a.ten_dang_nhap}</p>
                ${a.email ? `<p class="text-[10px] text-slate-400 mt-0.5">${a.email}</p>` : ''}
              </td>
              <td class="px-4 py-3.5 hidden sm:table-cell">
                <p class="text-[10px] text-slate-500">${a.lan_dang_nhap_cuoi ? fmt(a.lan_dang_nhap_cuoi) : 'Chưa đăng nhập'}</p>
              </td>
              <td class="px-4 py-3.5 text-center">
                <button onclick="window._acctToggle(${a.id}, ${a.is_active}, this)"
                  class="inline-flex items-center gap-1 text-[9px] font-bold px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer
                    ${a.is_active
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50 hover:bg-emerald-100'
                      : 'bg-rose-50 text-rose-600 border border-rose-100/50 hover:bg-rose-100'}">
                  <span class="material-symbols-outlined text-[11px]">${a.is_active ? 'check_circle' : 'block'}</span>
                  ${a.is_active ? 'Hoạt động' : 'Bị khóa'}
                </button>
              </td>
              <td class="px-5 py-3.5 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button onclick="window._acctView(${a.id})"
                    class="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-all" title="Xem chi tiết">
                    <span class="material-symbols-outlined text-[15px]">visibility</span>
                  </button>
                  <button onclick="window._acctEdit(${a.id})"
                    class="w-7 h-7 rounded-full flex items-center justify-center text-[#0071e3] hover:bg-[#0071e3]/5 transition-all" title="Sửa tài khoản">
                    <span class="material-symbols-outlined text-[15px]">edit</span>
                  </button>
                  <button onclick="window._acctToggle(${a.id}, ${a.is_active}, this)"
                    class="w-7 h-7 rounded-full flex items-center justify-center transition-all 
                      ${a.is_active ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}" 
                    title="${a.is_active ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}">
                    <span class="material-symbols-outlined text-[15px]">${a.is_active ? 'lock' : 'lock_open'}</span>
                  </button>
                  <button onclick="window._acctDelete(${a.id}, '${a.ten_dang_nhap}')"
                    class="w-7 h-7 rounded-full flex items-center justify-center text-rose-400 hover:bg-rose-50 transition-all" title="Xóa tài khoản">
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
      if (b === btn) {
        b.classList.add('bg-white', 'text-[#0071e3]', 'shadow-sm', 'font-bold');
        b.classList.remove('text-slate-500', 'hover:text-slate-800');
      } else {
        b.classList.remove('bg-white', 'text-[#0071e3]', 'shadow-sm', 'font-bold');
        b.classList.add('text-slate-500', 'hover:text-slate-800');
      }
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
          <h4 class="font-bold text-[#0071e3] mb-2 text-[10px] uppercase tracking-wider pl-1">Thông tin tài khoản</h4>
          <div class="grid grid-cols-2 gap-y-3 bg-slate-50/70 p-4.5 rounded-2xl border border-slate-100/80">
            <span class="text-slate-400 font-medium">ID tài khoản:</span>
            <span class="font-bold text-slate-700">${acct.id}</span>
            
            <span class="text-slate-400 font-medium">Tên đăng nhập:</span>
            <span class="font-bold text-slate-800">${acct.ten_dang_nhap}</span>
            
            <span class="text-slate-400 font-medium">Vai trò:</span>
            <span class="font-bold text-slate-700">${roleText}</span>
            
            <span class="text-slate-400 font-medium">Trạng thái:</span>
            <span class="font-bold ${acct.is_active ? 'text-green-600' : 'text-rose-500'}">
              ${acct.is_active ? 'Hoạt động' : 'Bị khóa'}
            </span>
            
            <span class="text-slate-400 font-medium">Ngày tạo:</span>
            <span class="font-semibold text-slate-600">${fmt(acct.ngay_tao)}</span>
            
            <span class="text-slate-400 font-medium">Đăng nhập cuối:</span>
            <span class="font-semibold text-slate-600">${acct.lan_dang_nhap_cuoi ? new Date(acct.lan_dang_nhap_cuoi).toLocaleString('vi-VN') : 'Chưa đăng nhập'}</span>
          </div>
        </div>
 
        <!-- Phân hồ sơ liên kết -->
        <div>
          <h4 class="font-bold text-[#0071e3] mb-2 text-[10px] uppercase tracking-wider pl-1">Hồ sơ cá nhân liên kết</h4>
          ${acct.ho_so_id ? `
            <div class="grid grid-cols-2 gap-y-3 bg-blue-50/20 p-4.5 rounded-2xl border border-blue-100/30">
              <span class="text-slate-400 font-medium">ID hồ sơ:</span>
              <span class="font-bold text-slate-700">${acct.ho_so_id}</span>
              
              <span class="text-slate-400 font-medium">Mã hồ sơ:</span>
              <span class="font-bold text-slate-800">${acct.ma_ho_so || '—'}</span>
              
              <span class="text-slate-400 font-medium">Họ và tên:</span>
              <span class="font-bold text-slate-800">${acct.ho_ten || '—'}</span>
              
              <span class="text-slate-400 font-medium">Phân loại hồ sơ:</span>
              <span class="font-semibold text-slate-700">
                ${acct.loai_ho_so === 'hoc_vien' ? 'Học viên' : acct.loai_ho_so === 'giao_vien' ? 'Giáo viên' : 'Nhân sự / Nhân viên'}
              </span>
            </div>
          ` : `
            <div class="bg-slate-50/50 text-slate-400 p-5 text-center rounded-2xl border border-dashed border-slate-200 text-xs">
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
