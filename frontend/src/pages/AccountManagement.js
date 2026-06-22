// AccountManagement.js — Quản lý tài khoản học viên & giáo viên (Admin)
import { API_BASE, showToast } from './_shared.js';

const ROLE_LABEL = { admin: 'Admin', le_tan: 'Lễ tân', giao_vien: 'Giáo viên', hoc_vien: 'Học viên' };
const ROLE_CLS = {
  admin: 'bg-purple-100 text-purple-700 border border-purple-200',
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
        <h3 class="font-bold text-apple-ink text-sm">Quản lý tài khoản</h3>
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
        ${['Tất cả', 'hoc_vien', 'giao_vien', 'le_tan', 'admin'].map((r, i) => `
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
              <option value="hoc_vien">Học viên</option>
              <option value="giao_vien">Giáo viên</option>
              <option value="le_tan">Lễ tân</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div id="c-profile-wrap" class="hidden">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Liên kết hồ sơ</label>
            <select id="c-profile" class="mt-1 w-full px-3 py-2.5 bg-[#f5f5f7] border border-[#e2e2e4] rounded-xl text-xs font-medium focus:outline-none focus:border-[#0066cc] transition">
              <option value="">— Không liên kết (hoặc chọn) —</option>
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
            <input id="c-pw" required type="password" placeholder="Ít nhất 6 ký tự"
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

    <!-- Modal đặt lại mật khẩu -->
    <div id="modal-reset-pw" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" onclick="document.getElementById('modal-reset-pw').classList.add('hidden')"></div>
      <div class="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div class="flex items-center justify-between px-6 py-5 border-b border-[#f0f0f2]">
          <h3 class="text-sm font-bold text-[#1d1d1f]">Đặt lại mật khẩu</h3>
          <button onclick="document.getElementById('modal-reset-pw').classList.add('hidden')"
            class="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition">
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <form id="form-reset-pw" class="px-6 py-5 space-y-3">
          <input type="hidden" id="rp-id">
          <p class="text-xs text-slate-500">Tài khoản: <span id="rp-name" class="font-bold text-[#1d1d1f]"></span></p>
          <div>
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Mật khẩu mới</label>
            <input id="rp-pw" required type="password" placeholder="Ít nhất 6 ký tự"
              class="mt-1 w-full px-3 py-2.5 bg-[#f5f5f7] border border-[#e2e2e4] rounded-xl text-xs font-medium focus:outline-none focus:border-[#0066cc] transition">
          </div>
          <p id="rp-err" class="text-[10px] text-red-500 hidden"></p>
          <div class="flex gap-2 pt-1">
            <button type="button" onclick="document.getElementById('modal-reset-pw').classList.add('hidden')"
              class="flex-1 text-xs font-semibold py-2.5 rounded-xl border border-[#e2e2e4] text-slate-500 hover:bg-slate-50 transition">Hủy</button>
            <button type="submit"
              class="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2.5 rounded-xl transition">Đặt lại</button>
          </div>
        </form>
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
    if (filterRole !== 'Tất cả') rows = rows.filter(a => a.vai_tro === filterRole);
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
            <th class="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tài khoản</th>
            <th class="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wide hidden md:table-cell">Hồ sơ</th>
            <th class="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Vai trò</th>
            <th class="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wide hidden sm:table-cell">Đăng nhập cuối</th>
            <th class="text-center px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Trạng thái</th>
            <th class="text-right px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Thao tác</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#f5f5f7]">
          ${rows.map(a => `
            <tr class="hover:bg-[#fafafa] transition-colors">
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                       style="background:${a.vai_tro === 'hoc_vien' ? '#f97316' : a.vai_tro === 'giao_vien' ? '#059669' : a.vai_tro === 'admin' ? '#7c3aed' : '#0066cc'}">
                    ${(a.ten_dang_nhap || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p class="font-semibold text-[#1d1d1f]">${a.ten_dang_nhap}</p>
                    <p class="text-[9px] text-slate-400">ID: ${a.id}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3.5 hidden md:table-cell">
                ${a.ho_ten
        ? `<p class="font-medium text-[#1d1d1f]">${a.ho_ten}</p><p class="text-[9px] text-slate-400">${a.ma_ho_so || ''}</p>`
        : `<span class="text-slate-300 text-[10px]">Không liên kết</span>`}
              </td>
              <td class="px-4 py-3.5">
                <span class="text-[9px] font-bold px-2 py-1 rounded-full ${ROLE_CLS[a.vai_tro] || 'bg-slate-100 text-slate-500'}">${ROLE_LABEL[a.vai_tro] || a.vai_tro}</span>
              </td>
              <td class="px-4 py-3.5 hidden sm:table-cell">
                <p class="text-[10px] text-slate-500">${a.lan_dang_nhap_cuoi ? fmt(a.lan_dang_nhap_cuoi) : 'Chưa đăng nhập'}</p>
              </td>
              <td class="px-4 py-3.5 text-center">
                <button onclick="window._acctToggle(${a.id}, ${a.is_active}, this)"
                  class="inline-flex items-center gap-1 text-[9px] font-bold px-2.5 py-1 rounded-full transition
                    ${a.is_active
        ? 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200'
        : 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200'}">
                  <span class="material-symbols-outlined text-[11px]">${a.is_active ? 'check_circle' : 'block'}</span>
                  ${a.is_active ? 'Hoạt động' : 'Bị khóa'}
                </button>
              </td>
              <td class="px-5 py-3.5 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button onclick="window._acctResetPw(${a.id}, '${a.ten_dang_nhap}')"
                    class="w-7 h-7 rounded-lg flex items-center justify-center text-amber-500 hover:bg-amber-50 transition" title="Đặt lại mật khẩu">
                    <span class="material-symbols-outlined text-[15px]">lock_reset</span>
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
    if (role === 'hoc_vien' || role === 'giao_vien') {
      wrap.classList.remove('hidden');
      sel.innerHTML = `<option value="">— Đang tải... —</option>`;
      try {
        const r = await fetch(`${API_BASE}/accounts/available-profiles?loai=${role}`, { headers: { 'x-user-role': 'admin' } });
        const d = await r.json();
        const profiles = d.data || [];
        sel.innerHTML = `<option value="">— Không liên kết —</option>` +
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
    const body = {
      vai_tro: document.getElementById('c-role').value,
      ho_so_id: document.getElementById('c-profile').value || null,
      ten_dang_nhap: document.getElementById('c-user').value.trim(),
      mat_khau: document.getElementById('c-pw').value,
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

  // Submit đặt lại mật khẩu
  document.getElementById('form-reset-pw')?.addEventListener('submit', async e => {
    e.preventDefault();
    const id = document.getElementById('rp-id').value;
    const pw = document.getElementById('rp-pw').value;
    const err = document.getElementById('rp-err');
    try {
      const r = await fetch(`${API_BASE}/accounts/${id}/reset-password`, {
        method: 'PUT', headers: authHeaders(), body: JSON.stringify({ mat_khau_moi: pw })
      });
      const res = await r.json();
      if (res.success) {
        showToast('Đã đặt lại mật khẩu thành công!');
        document.getElementById('modal-reset-pw').classList.add('hidden');
      } else { err.textContent = res.error || 'Thất bại'; err.classList.remove('hidden'); }
    } catch (_) { err.textContent = 'Lỗi kết nối'; err.classList.remove('hidden'); }
  });

  // Toggle active
  window._acctToggle = async (id, current, btn) => {
    try {
      const r = await fetch(`${API_BASE}/accounts/${id}/toggle`, { method: 'PUT', headers: { 'x-user-role': 'admin' } });
      const res = await r.json();
      if (res.success) {
        showToast(res.is_active ? 'Đã kích hoạt tài khoản' : 'Đã khóa tài khoản');
        await load();
      }
    } catch (_) { showToast('Lỗi kết nối', 'error'); }
  };

  // Reset password modal
  window._acctResetPw = (id, name) => {
    document.getElementById('rp-id').value = id;
    document.getElementById('rp-name').textContent = name;
    document.getElementById('rp-pw').value = '';
    document.getElementById('rp-err').classList.add('hidden');
    document.getElementById('modal-reset-pw').classList.remove('hidden');
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

  await load();
}
