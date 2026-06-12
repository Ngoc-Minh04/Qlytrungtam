// StaffList.js - Danh sách Nhân viên (Infinity Scroll, dùng chuc_vu thay vai_tro)
import { API_BASE, showToast } from './_shared.js';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}
function isValidPhone(phone) {
  return /^0\d{9}$/.test(phone.replace(/\s/g, ''));
}

export async function renderStaffList(container, role) {
  container.innerHTML = `
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-apple-blue"></div>
    </div>
  `;

  try {
    const res = await fetch(`${API_BASE}/staff`, {
      headers: { 'X-User-Role': role || 'admin' }
    });
    const result = await res.json();
    const allStaff = result.data || [];

    const roleLabels = {
      'admin': 'Quản lý', 'le_tan': 'Lễ tân', 'ke_toan': 'Kế toán', 'nhan_vien': 'Nhân viên',
      'Quản lý': 'Quản lý', 'Lễ tân': 'Lễ tân', 'Kế toán': 'Kế toán', 'Nhân viên': 'Nhân viên'
    };

    function renderTableRows(pageList) {
      if (pageList.length === 0) {
        return `<tr><td colspan="5" class="px-6 py-6 text-center text-slate-500 text-xs">Không tìm thấy nhân viên nào phù hợp.</td></tr>`;
      }
      return pageList.map(nv => `
        <tr class="hover:bg-slate-50 border-b border-apple-divider/40 text-xs transition group cursor-pointer" data-id="${nv.id}">
          <td class="sticky left-0 bg-white group-hover:bg-slate-50 transition-colors z-10 px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center font-bold text-white select-none text-sm">
                ${(nv.ho_ten || 'N').charAt(0)}
              </div>
              <div>
                <div class="font-bold text-apple-ink text-sm">${nv.ho_ten || '—'}</div>
                <div class="text-[10px] text-slate-400 mt-0.5">Mã: ${nv.ma_ho_so || '—'}</div>
              </div>
            </div>
          </td>
          <td class="px-6 py-4">
            <span class="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-100">
              ${roleLabels[nv.chuc_vu] || nv.chuc_vu || 'Nhân viên'}
            </span>
          </td>
          <td class="px-6 py-4 text-slate-600 font-medium">${nv.so_dien_thoai || '—'}</td>
          <td class="px-6 py-4 text-slate-600">${nv.email || '—'}</td>
          <td class="sticky right-0 bg-white group-hover:bg-slate-50 transition-colors z-10 px-6 py-4 text-right">
            <button class="btn-delete-staff px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-full transition text-[11px] font-semibold active:scale-95" data-id="${nv.id}">
              Xóa
            </button>
          </td>
        </tr>
      `).join('');
    }

    container.innerHTML = `
      <div class="space-y-4">
        <!-- Tab 3 nút -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="inline-flex bg-[#f3f3f5] p-1 rounded-xl border border-[#e2e2e4] select-none">
            <button id="tab-students" class="px-5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-apple-ink transition active:scale-95">
              <span class="flex items-center gap-1.5"><span class="material-symbols-outlined text-[14px]">school</span>Học viên</span>
            </button>
            <button id="tab-teachers" class="px-5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-apple-ink transition active:scale-95">
              <span class="flex items-center gap-1.5"><span class="material-symbols-outlined text-[14px]">badge</span>Giáo viên</span>
            </button>
            <button id="tab-staff-active" class="px-5 py-1.5 rounded-lg bg-white shadow-sm border border-apple-divider/20 text-xs font-semibold text-apple-ink transition active:scale-95">
              <span class="flex items-center gap-1.5"><span class="material-symbols-outlined text-[14px]">manage_accounts</span>Nhân viên</span>
            </button>
          </div>
          <button id="btn-add-staff-modal" class="flex items-center gap-1.5 px-5 py-2 rounded-full bg-emerald-600 text-white text-xs font-semibold hover:opacity-90 transition active:scale-95 shadow-sm">
            <span class="material-symbols-outlined text-[16px]">add</span>
            Thêm nhân viên mới
          </button>
        </div>

        <!-- Bộ lọc -->
        <div class="bg-white p-3 rounded-2xl flex flex-wrap gap-2 items-center border border-[#e2e2e4] shadow-sm">
          <div class="relative flex-1 min-w-[180px] text-xs">
            <input id="search-staff-input" class="w-full pl-8 pr-4 py-2 bg-[#f3f3f5] border border-[#e2e2e4] rounded-full outline-none focus:border-apple-blue focus:bg-white transition text-xs" placeholder="Tìm tên, mã số, hoặc SĐT..." type="text"/>
            <span class="material-symbols-outlined absolute left-2.5 top-2.5 text-slate-400 text-[16px]">search</span>
          </div>
          <select id="filter-staff-role" class="border border-[#e2e2e4] bg-[#f3f3f5] rounded-full px-3 py-2 outline-none focus:border-apple-blue text-xs font-medium transition cursor-pointer">
            <option value="">Tất cả vai trò</option>
            <option value="Quản lý">Quản lý</option>
            <option value="Lễ tân">Lễ tân</option>
            <option value="Kế toán">Kế toán</option>
            <option value="Nhân viên">Nhân viên</option>
          </select>
        </div>

        <!-- Table -->
        <div class="bg-white rounded-2xl border border-[#e2e2e4] overflow-hidden flex flex-col shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr class="bg-[#f3f3f5] border-b border-[#e2e2e4] text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th class="px-6 py-4">NHÂN VIÊN</th>
                  <th class="px-6 py-4">CHỨC VỤ</th>
                  <th class="px-6 py-4">SỐ ĐIỆN THOẠI</th>
                  <th class="px-6 py-4">EMAIL</th>
                  <th class="px-6 py-4 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody id="staff-table-body">
                <!-- Sẽ chèn bằng Infinity Scroll -->
              </tbody>
            </table>
          </div>
          <!-- Nút Tải thêm nhân viên kiểm soát được -->
          <div id="load-more-container" class="py-3 px-6 text-center border-t border-[#f3f3f5] bg-slate-50/50 hidden">
            <button id="btn-load-more" class="px-5 py-2 bg-white hover:bg-slate-50 border border-[#e2e2e4] text-slate-600 rounded-full text-xs font-bold transition active:scale-95 inline-flex items-center gap-1">
              <span>Tải thêm nhân viên</span>
              <span id="load-more-spinner" class="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-apple-blue hidden"></span>
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL THÊM NHÂN VIÊN MỚI -->
      <div id="add-staff-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4">
        <div class="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 border border-[#e2e2e4] shadow-xl max-h-[90vh] overflow-y-auto">
          <div class="flex justify-between items-center pb-3 border-b border-[#f3f3f5]">
            <h3 class="text-[15px] font-bold text-[#1a1c1d] flex items-center gap-2">
              <span class="material-symbols-outlined text-emerald-600 text-[20px]">person_add</span>
              Thêm nhân viên mới
            </h3>
            <button id="btn-close-staff-modal" class="p-1.5 text-[#727784] hover:bg-[#f3f3f5] rounded-full transition-all">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <form id="add-staff-modal-form" class="space-y-4 text-xs">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="sm:col-span-2">
                <label class="block font-semibold text-slate-600 mb-1.5">Họ và tên nhân viên <span class="text-rose-500 font-bold">*</span></label>
                <input type="text" id="modal-staff-fullName" placeholder="Nhập họ tên đầy đủ..." class="w-full border border-[#e2e2e4] rounded-xl px-4 py-2.5 outline-none focus:border-apple-blue transition bg-apple-pearl text-xs">
              </div>
              <div>
                <label class="block font-semibold text-slate-600 mb-1.5">Số điện thoại (10 số) <span class="text-rose-500 font-bold">*</span></label>
                <input type="tel" id="modal-staff-phone" placeholder="0xxxxxxxxx" maxlength="10" class="w-full border border-[#e2e2e4] rounded-xl px-4 py-2.5 outline-none focus:border-apple-blue transition bg-apple-pearl text-xs">
                <p class="text-[10px] text-slate-400 mt-1">Phải đúng 10 chữ số, bắt đầu bằng 0</p>
              </div>
              <div>
                <label class="block font-semibold text-slate-600 mb-1.5">Địa chỉ Email</label>
                <input type="email" id="modal-staff-email" placeholder="staff@example.com" class="w-full border border-[#e2e2e4] rounded-xl px-4 py-2.5 outline-none focus:border-apple-blue transition bg-apple-pearl text-xs">
                <p class="text-[10px] text-slate-400 mt-1">Ví dụ: abc@gmail.com (không bắt buộc)</p>
              </div>
              <div>
                <label class="block font-semibold text-slate-600 mb-1.5">Chức vụ / Vai trò <span class="text-rose-500 font-bold">*</span></label>
                <select id="modal-staff-role" class="w-full border border-[#e2e2e4] bg-[#f3f3f5] rounded-xl px-4 py-2.5 outline-none focus:border-apple-blue transition text-xs cursor-pointer">
                  <option value="Lễ tân">Lễ tân</option>
                  <option value="Kế toán">Kế toán</option>
                  <option value="Nhân viên">Nhân viên</option>
                  <option value="Quản lý">Quản lý</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold text-slate-600 mb-1.5">Chi nhánh <span class="text-rose-500 font-bold">*</span></label>
                <select id="modal-staff-branch" class="w-full border border-[#e2e2e4] bg-[#f3f3f5] rounded-xl px-4 py-2.5 outline-none focus:border-apple-blue transition text-xs cursor-pointer">
                  <option value="Trung tam chính">Trung tâm chính</option>
                  <option value="Downtown Campus">Downtown Campus</option>
                </select>
              </div>
            </div>
            <div class="flex justify-end gap-2 pt-4 border-t border-[#f3f3f5]">
              <button type="button" id="btn-cancel-staff-add" class="px-5 py-2.5 rounded-xl border border-[#e2e2e4] hover:bg-slate-50 text-slate-700 font-semibold transition active:scale-95 text-xs">Hủy bỏ</button>
              <button type="submit" class="px-7 py-2.5 rounded-xl bg-emerald-600 hover:opacity-90 text-white font-semibold transition active:scale-95 shadow-sm text-xs">Lưu nhân viên</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const tableBody = document.getElementById('staff-table-body');
    const searchInput = document.getElementById('search-staff-input');
    const filterRole = document.getElementById('filter-staff-role');
    const loadMoreContainer = document.getElementById('load-more-container');
    const btnLoadMore = document.getElementById('btn-load-more');
    const spinnerLoadMore = document.getElementById('load-more-spinner');

    let displayCount = 20;
    let filteredList = [...allStaff];

    function renderInfinityRows(list) {
      tableBody.innerHTML = renderTableRows(list.slice(0, displayCount));
      attachRowEvents(list.slice(0, displayCount));

      if (displayCount < list.length) {
        loadMoreContainer.classList.remove('hidden');
      } else {
        loadMoreContainer.classList.add('hidden');
      }
    }

    function updateTableInfinity(list) {
      filteredList = list;
      displayCount = 20;
      renderInfinityRows(filteredList);
    }

    btnLoadMore?.addEventListener('click', () => {
      spinnerLoadMore.classList.remove('hidden');
      btnLoadMore.setAttribute('disabled', 'true');
      setTimeout(() => {
        displayCount = Math.min(displayCount + 20, filteredList.length);
        renderInfinityRows(filteredList);
        spinnerLoadMore.classList.add('hidden');
        btnLoadMore.removeAttribute('disabled');
      }, 400);
    });

    const scrollContainer = tableBody.closest('.overflow-x-auto') || tableBody.closest('.overflow-y-auto');
    const onScroll = () => {
      if (displayCount >= filteredList.length) return;
      const scrollEl = scrollContainer || document.documentElement;
      const scrolled = scrollContainer ? scrollEl.scrollTop + scrollEl.clientHeight : window.scrollY + window.innerHeight;
      const total = scrollContainer ? scrollEl.scrollHeight : document.documentElement.scrollHeight;
      
      if (scrolled >= total - 50 && !btnLoadMore.hasAttribute('disabled')) {
        btnLoadMore.click();
      }
    };
    if (scrollContainer) scrollContainer.addEventListener('scroll', onScroll, { passive: true });
    else window.addEventListener('scroll', onScroll, { passive: true });

    function applyFilters() {
      const q = searchInput.value.toLowerCase();
      const roleFilter = filterRole.value;
      const filtered = allStaff.filter(nv => {
        const matchSearch = (nv.ho_ten && nv.ho_ten.toLowerCase().includes(q)) ||
          (nv.ma_ho_so && nv.ma_ho_so.toLowerCase().includes(q)) ||
          (nv.so_dien_thoai && nv.so_dien_thoai.includes(q));
        const matchRole = roleFilter === '' || (nv.chuc_vu || 'Nhân viên') === roleFilter;
        return matchSearch && matchRole;
      });
      updateTableInfinity(filtered);
    }

    searchInput.addEventListener('input', applyFilters);
    filterRole.addEventListener('change', applyFilters);

    function attachRowEvents(list) {
      tableBody.querySelectorAll('tr').forEach(row => {
        row.addEventListener('click', (e) => {
          if (e.target.closest('.btn-delete-staff')) {
            e.stopPropagation();
            const id = e.target.closest('.btn-delete-staff').getAttribute('data-id');
            deleteStaff(id);
            return;
          }
        });
      });
    }

    async function deleteStaff(id) {
      if (!confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) return;
      try {
        const resDel = await fetch(`${API_BASE}/staff/${id}`, {
          method: 'DELETE',
          headers: { 'X-User-Role': 'admin' }
        });
        const resultJson = await resDel.json();
        if (resultJson.success) {
          showToast('Đã xóa nhân viên thành công!');
          renderStaffList(container, role);
        } else {
          showToast(resultJson.error || 'Có lỗi xảy ra', 'error');
        }
      } catch (err) {
        showToast('Lỗi máy chủ', 'error');
      }
    }

    updateTableInfinity(allStaff);

    // Tab điều hướng
    document.getElementById('tab-students')?.addEventListener('click', () => {
      window._navigatePage && window._navigatePage('students-list');
    });
    document.getElementById('tab-teachers')?.addEventListener('click', () => {
      window._navigatePage && window._navigatePage('teachers-list');
    });

    // Modal thêm nhân viên
    const addModal = document.getElementById('add-staff-modal');
    document.getElementById('btn-add-staff-modal')?.addEventListener('click', () => {
      addModal.classList.remove('hidden');
      document.getElementById('add-staff-modal-form').reset();
    });
    document.getElementById('btn-close-staff-modal')?.addEventListener('click', () => addModal.classList.add('hidden'));
    document.getElementById('btn-cancel-staff-add')?.addEventListener('click', () => addModal.classList.add('hidden'));

    document.getElementById('add-staff-modal-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameVal = document.getElementById('modal-staff-fullName').value.trim();
      const phoneVal = document.getElementById('modal-staff-phone').value.trim();
      const emailVal = document.getElementById('modal-staff-email').value.trim();

      if (!nameVal) {
        document.getElementById('modal-staff-fullName').classList.add('border-red-500', 'bg-red-50');
        showToast('Vui lòng nhập họ và tên nhân viên', 'error');
        return;
      }
      if (!isValidPhone(phoneVal)) {
        document.getElementById('modal-staff-phone').classList.add('border-red-500', 'bg-red-50');
        showToast('Số điện thoại phải đúng 10 chữ số, bắt đầu bằng 0', 'error');
        return;
      }
      if (emailVal && !isValidEmail(emailVal)) {
        document.getElementById('modal-staff-email').classList.add('border-red-500', 'bg-red-50');
        showToast('Email không hợp lệ. Phải có định dạng abc@domain.com', 'error');
        return;
      }

      const payload = {
        ho_ten: nameVal,
        so_dien_thoai: phoneVal,
        email: emailVal || null,
        chuc_vu: document.getElementById('modal-staff-role').value,
        chi_nhanh: document.getElementById('modal-staff-branch').value,
        loai_ho_so: 'nhan_vien'
      };

      try {
        const postRes = await fetch(`${API_BASE}/staff/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-User-Role': 'admin' },
          body: JSON.stringify(payload)
        });
        const resultJson = await postRes.json();
        if (resultJson.success) {
          showToast('Tạo hồ sơ nhân viên thành công!');
          addModal.classList.add('hidden');
          renderStaffList(container, role);
        } else {
          showToast(resultJson.error || 'Có lỗi xảy ra', 'error');
        }
      } catch (err) {
        showToast('Lỗi máy chủ khi tạo nhân viên', 'error');
      }
    });

  } catch (err) {
    container.innerHTML = `
      <div class="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-xs">
        <strong>Lỗi tải dữ liệu:</strong> ${err.message}
      </div>
    `;
  }
}
