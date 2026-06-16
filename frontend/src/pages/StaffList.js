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
              <div class="w-9 h-9 rounded-full overflow-hidden shadow-sm bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center font-bold text-white select-none text-sm shrink-0">
                ${nv.avatar_url ? `<img src="${nv.avatar_url}" class="w-full h-full object-cover">` : (nv.ho_ten || 'N').charAt(0)}
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
          <div class="flex items-center gap-2">
            <button id="btn-refresh-staff" class="flex items-center justify-center gap-1.5 px-4 py-2 border border-[#e2e2e4] hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-full transition-all active:scale-95 shadow-sm h-[32px]">
              <span class="material-symbols-outlined text-[16px]">refresh</span>Tải lại
            </button>
            <button id="btn-add-staff-modal" class="flex items-center gap-1.5 px-5 py-2 rounded-full bg-emerald-600 text-white text-xs font-semibold hover:opacity-90 transition active:scale-95 shadow-sm h-[32px]">
              <span class="material-symbols-outlined text-[16px]">add</span>
              Thêm nhân viên mới
            </button>
          </div>
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
          <button id="btn-reset-filters" class="flex items-center justify-center gap-1.5 px-4 py-2 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold rounded-full transition-all active:scale-95 shadow-sm h-[32px]" type="button">
            <span class="material-symbols-outlined text-[16px]">restart_alt</span>Đặt lại bộ lọc
          </button>
        </div>

        <!-- Table -->
        <div class="bg-white rounded-2xl border border-[#e2e2e4] overflow-hidden flex flex-col shadow-sm">
          <div class="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table class="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr class="bg-[#f3f3f5] border-b border-[#e2e2e4] text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th class="sticky top-0 bg-[#f3f3f5] z-20 px-6 py-4">NHÂN VIÊN</th>
                  <th class="sticky top-0 bg-[#f3f3f5] z-20 px-6 py-4">CHỨC VỤ</th>
                  <th class="sticky top-0 bg-[#f3f3f5] z-20 px-6 py-4">SỐ ĐIỆN THOẠI</th>
                  <th class="sticky top-0 bg-[#f3f3f5] z-20 px-6 py-4">EMAIL</th>
                  <th class="sticky top-0 bg-[#f3f3f5] z-20 px-6 py-4 text-right">THAO TÁC</th>
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
          <div id="infinite-scroll-sentinel" class="h-4 w-full"></div>
        </div>
      </div>

      <!-- MODAL THÊM NHÂN VIÊN MỚI -->
      <div id="add-staff-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4">
        <div class="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 border border-[#e2e2e4] shadow-xl max-h-[90vh] overflow-y-auto animate-in fade-in duration-200">
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
            <div class="flex flex-col sm:flex-row gap-4 items-start">
              <!-- Avatar vuông góc trái trên cùng -->
              <div class="flex flex-col items-center gap-2 shrink-0 w-full sm:w-28">
                <span class="block font-semibold text-slate-600 self-start sm:self-center">Ảnh đại diện</span>
                <div class="relative w-24 h-24 border border-dashed border-[#e2e2e4] rounded-2xl overflow-hidden flex items-center justify-center bg-[#f3f3f5] hover:bg-slate-100 transition cursor-pointer group" id="modal-avatar-preview-container">
                  <span class="material-symbols-outlined text-[28px] text-slate-400 group-hover:scale-110 transition duration-150">upload</span>
                  <img id="modal-add-avatar-preview" class="absolute inset-0 w-full h-full object-cover hidden">
                </div>
                <input type="file" id="modal-add-avatar" accept="image/*" class="hidden">
                <button type="button" id="btn-trigger-avatar-upload" class="px-2.5 py-1 bg-white border border-[#e2e2e4] text-[10px] font-bold rounded-lg hover:bg-slate-50 shadow-sm active:scale-95 transition">Chọn ảnh</button>
              </div>

              <!-- Cột thông tin cơ bản bên phải avatar -->
              <div class="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                <div class="sm:col-span-2">
                  <label class="block font-semibold text-slate-600 mb-1">Họ và tên nhân viên <span class="text-rose-500 font-bold">*</span></label>
                  <input type="text" id="modal-staff-fullName" placeholder="Nhập họ tên đầy đủ..." class="w-full border border-[#e2e2e4] rounded-xl px-4 py-2 outline-none focus:border-apple-blue transition bg-apple-pearl text-xs">
                </div>
              </div>
            </div>

            <!-- Các hàng thông tin khác phía dưới -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-600 mb-1">Số điện thoại (10 số) <span class="text-rose-500 font-bold">*</span></label>
                <input type="tel" id="modal-staff-phone" placeholder="0xxxxxxxxx" maxlength="10" class="w-full border border-[#e2e2e4] rounded-xl px-4 py-2 outline-none focus:border-apple-blue transition bg-apple-pearl text-xs">
                <p class="text-[10px] text-slate-400 mt-1">Phải đúng 10 chữ số, bắt đầu bằng 0</p>
              </div>
              <div>
                <label class="block font-semibold text-slate-600 mb-1">Địa chỉ Email</label>
                <input type="email" id="modal-staff-email" placeholder="staff@example.com" class="w-full border border-[#e2e2e4] rounded-xl px-4 py-2 outline-none focus:border-apple-blue transition bg-apple-pearl text-xs">
                <p class="text-[10px] text-slate-400 mt-1">Ví dụ: abc@gmail.com (không bắt buộc)</p>
              </div>
              <div>
                <label class="block font-semibold text-slate-600 mb-1">Chức vụ / Vai trò <span class="text-rose-500 font-bold">*</span></label>
                <select id="modal-staff-role" class="w-full border border-[#e2e2e4] bg-[#f3f3f5] rounded-xl px-4 py-2 outline-none focus:border-apple-blue transition text-xs cursor-pointer">
                  <option value="Lễ tân">Lễ tân</option>
                  <option value="Kế toán">Kế toán</option>
                  <option value="Nhân viên">Nhân viên</option>
                  <option value="Quản lý">Quản lý</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold text-slate-600 mb-1">Chi nhánh <span class="text-rose-500 font-bold">*</span></label>
                <select id="modal-staff-branch" class="w-full border border-[#e2e2e4] bg-[#f3f3f5] rounded-xl px-4 py-2 outline-none focus:border-apple-blue transition text-xs cursor-pointer">
                  <option value="Trung tam chính">Trung tâm chính</option>
                  <option value="Downtown Campus">Downtown Campus</option>
                </select>
              </div>

              <!-- Checkbox Tự động tạo tài khoản và Tài khoản / Mật khẩu -->
              <div class="sm:col-span-2 space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100/80">
                <div class="flex items-center gap-2">
                  <input type="checkbox" id="modal-staff-autoAccount" class="rounded text-apple-blue focus:ring-apple-blue w-4 h-4 cursor-pointer" checked>
                  <label for="modal-staff-autoAccount" class="font-bold text-slate-700 cursor-pointer select-none text-xs">Tự động tạo tài khoản đăng nhập</label>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3" id="modal-account-fields">
                  <div>
                    <label class="block font-semibold text-slate-500 mb-1">Tên đăng nhập </label>
                    <input type="text" id="modal-staff-username" placeholder="Tên đăng nhập..." class="w-full border border-[#e2e2e4] rounded-xl px-4 py-2 outline-none focus:border-apple-blue transition bg-white text-xs">
                  </div>
                  <div>
                    <label class="block font-semibold text-slate-500 mb-1">Mật khẩu đăng nhập</label>
                    <input type="text" id="modal-staff-password" placeholder="Mật khẩu..." class="w-full border border-[#e2e2e4] rounded-xl px-4 py-2 outline-none focus:border-apple-blue transition bg-white text-xs" value="123456">
                  </div>
                </div>
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

    let displayCount = 10;
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
      displayCount = 10;
      renderInfinityRows(filteredList);
    }

    btnLoadMore?.addEventListener('click', () => {
      spinnerLoadMore.classList.remove('hidden');
      btnLoadMore.setAttribute('disabled', 'true');
      setTimeout(() => {
        displayCount = Math.min(displayCount + 10, filteredList.length);
        renderInfinityRows(filteredList);
        spinnerLoadMore.classList.add('hidden');
        btnLoadMore.removeAttribute('disabled');
      }, 400);
    });

    // Thiết lập IntersectionObserver theo dõi sentinel
    if (window.staffObserver) {
      window.staffObserver.disconnect();
    }
    const sentinel = document.getElementById('infinite-scroll-sentinel');
    if (sentinel) {
      window.staffObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && displayCount < filteredList.length && !btnLoadMore.hasAttribute('disabled')) {
          btnLoadMore.click();
        }
      }, { rootMargin: '10px' });
      window.staffObserver.observe(sentinel);
    }

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

    document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
      searchInput.value = '';
      filterRole.value = '';
      applyFilters();
    });

    document.getElementById('btn-refresh-staff')?.addEventListener('click', () => {
      renderStaffList(container, role);
    });

    function attachRowEvents(list) {
      tableBody.querySelectorAll('tr').forEach(row => {
        row.addEventListener('click', (e) => {
          if (e.target.closest('.btn-delete-staff')) {
            e.stopPropagation();
            const id = e.target.closest('.btn-delete-staff').getAttribute('data-id');
            deleteStaff(id);
            return;
          }
          const id = row.getAttribute('data-id');
          const nv = list.find(item => item.id == id);
          if (nv) showStaffDetailModal(nv, container, role);
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

      const phoneInput = document.getElementById('modal-staff-phone');
      const usernameInput = document.getElementById('modal-staff-username');
      const passwordInput = document.getElementById('modal-staff-password');
      const autoAccCheckbox = document.getElementById('modal-staff-autoAccount');
      const avatarPreview = document.getElementById('modal-add-avatar-preview');
      if (avatarPreview) {
        avatarPreview.classList.add('hidden');
        avatarPreview.src = '';
      }

      if (autoAccCheckbox && autoAccCheckbox.checked) {
        usernameInput.value = phoneInput.value;
        passwordInput.value = '123456';
      }
    });

    // Thêm sự kiện upload avatar preview & auto account sync
    document.getElementById('btn-trigger-avatar-upload')?.addEventListener('click', () => {
      document.getElementById('modal-add-avatar').click();
    });
    document.getElementById('modal-avatar-preview-container')?.addEventListener('click', () => {
      document.getElementById('modal-add-avatar').click();
    });
    document.getElementById('modal-add-avatar')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const preview = document.getElementById('modal-add-avatar-preview');
          if (preview) {
            preview.src = reader.result;
            preview.classList.remove('hidden');
          }
        };
        reader.readAsDataURL(file);
      }
    });

    document.getElementById('modal-staff-phone')?.addEventListener('input', (e) => {
      const autoAccCheckbox = document.getElementById('modal-staff-autoAccount');
      const usernameInput = document.getElementById('modal-staff-username');
      if (autoAccCheckbox && autoAccCheckbox.checked && usernameInput) {
        usernameInput.value = e.target.value.trim();
      }
    });

    document.getElementById('modal-staff-autoAccount')?.addEventListener('change', (e) => {
      const usernameInput = document.getElementById('modal-staff-username');
      const passwordInput = document.getElementById('modal-staff-password');
      const phoneInput = document.getElementById('modal-staff-phone');
      if (e.target.checked) {
        if (usernameInput) usernameInput.value = phoneInput.value.trim();
        if (passwordInput) passwordInput.value = '123456';
      }
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

      const avatarFile = document.getElementById('modal-add-avatar').files[0];
      const autoCreateAccount = document.getElementById('modal-staff-autoAccount').checked;

      const submitForm = async (avatarBase64 = null) => {
        const payload = {
          ho_ten: nameVal,
          so_dien_thoai: phoneVal,
          email: emailVal || null,
          chuc_vu: document.getElementById('modal-staff-role').value,
          chi_nhanh: document.getElementById('modal-staff-branch').value,
          loai_ho_so: 'nhan_vien',
          avatar_url: avatarBase64,
          auto_create_account: autoCreateAccount,
          username: document.getElementById('modal-staff-username') ? document.getElementById('modal-staff-username').value.trim() : null,
          password: document.getElementById('modal-staff-password') ? document.getElementById('modal-staff-password').value.trim() : null
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
      };

      if (avatarFile) {
        const reader = new FileReader();
        reader.onload = () => {
          submitForm(reader.result);
        };
        reader.onerror = () => {
          showToast('Lỗi khi đọc file ảnh đại diện', 'error');
        };
        reader.readAsDataURL(avatarFile);
      } else {
        submitForm(null);
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

// ===== MODAL CHI TIẾT + IN-PLACE EDIT NHÂN VIÊN =====
function showStaffDetailModal(nv, container, role) {
  let modal = document.getElementById('staff-detail-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'staff-detail-modal';
    modal.className = 'fixed inset-0 bg-black/45 backdrop-blur-md z-50 flex items-center justify-center p-4';
    document.body.appendChild(modal);
  }

  const ngayTaoFormatted = nv.ngay_tao ? new Date(nv.ngay_tao).toLocaleDateString('vi-VN') : '—';

  modal.innerHTML = `
    <div class="bg-white rounded-3xl max-w-xl w-full border border-[#e2e2e4] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-xs text-[#1a1c1d]" style="animation: modalIn 0.2s ease">
      <!-- Header cố định -->
      <div class="flex justify-between items-center px-6 py-4 border-b border-[#f3f3f5] shrink-0">
        <h3 class="text-sm font-bold text-[#1a1c1d] flex items-center gap-2">
          <span class="material-symbols-outlined text-emerald-600 text-[22px]">manage_accounts</span>
          Hồ sơ Nhân sự & Nhân viên
        </h3>
        <button id="close-staff-detail-modal" class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all flex items-center justify-center">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <!-- Body Scroll -->
      <form id="staff-edit-inplace-form" class="p-6 overflow-y-auto space-y-5 flex-1">
        <!-- Profile Banner -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-br from-emerald-500/8 via-emerald-500/3 to-transparent border border-emerald-500/15">
          <div class="flex items-center gap-4">
            <div class="relative w-14 h-14 rounded-2xl bg-[#f3f3f5] border border-apple-divider/40 text-apple-ink overflow-hidden flex items-center justify-center font-extrabold text-xl shadow-lg shrink-0 select-none cursor-pointer group" id="staff-avatar-container">
              ${nv.avatar_url ? `<img id="staff-avatar-img" src="${nv.avatar_url}" class="w-full h-full object-cover">` : `<span id="staff-avatar-placeholder">${nv.ho_ten ? nv.ho_ten.charAt(0).toUpperCase() : 'N'}</span>`}
              <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <span class="material-symbols-outlined text-white text-[16px]">photo_camera</span>
              </div>
            </div>
            <input type="file" id="staff-avatar-file-input" accept="image/*" class="hidden">
            <div>
              <h4 class="font-extrabold text-base text-apple-ink" id="staff-display-name">${nv.ho_ten}</h4>
              <div class="flex flex-wrap items-center gap-2 mt-1">
                <span class="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-bold text-[10px] tracking-wide uppercase">${nv.ma_ho_so}</span>
                <span class="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                <span class="text-slate-400 font-medium text-[10.5px]">Đăng ký lúc: ${ngayTaoFormatted}</span>
              </div>
            </div>
          </div>
          <!-- Trạng thái lưu -->
          <div id="staff-save-status" class="hidden items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-[10.5px] font-semibold self-end sm:self-center">
            <span class="material-symbols-outlined text-[14px]">check_circle</span> Đã lưu
          </div>
        </div>

        <!-- Thông báo hướng dẫn -->
        <div class="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl text-[10.5px] text-blue-600">
          <span class="material-symbols-outlined text-[14px]">edit_note</span>
          Chỉnh sửa trực tiếp các trường bên dưới rồi nhấn <strong class="mx-1">Lưu thay đổi</strong> để cập nhật.
        </div>

        <!-- Grid Thông tin chỉnh sửa -->
        <div class="space-y-4">
          <h4 class="font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 text-slate-400">
            <span class="material-symbols-outlined text-[16px]">info</span> Thông tin chi tiết hồ sơ
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">

            <!-- Họ tên -->
            <div class="sm:col-span-2 space-y-1">
              <label class="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-500 uppercase tracking-wide">
                <span class="material-symbols-outlined text-[14px]">person</span> Họ và tên
              </label>
              <input type="text" id="s-edit-name" value="${nv.ho_ten || ''}" required
                class="w-full border border-[#e2e2e4] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-apple-ink outline-none focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/10 transition bg-[#fafafa]">
            </div>

            <!-- Chức vụ -->
            <div class="space-y-1">
              <label class="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-500 uppercase tracking-wide">
                <span class="material-symbols-outlined text-[14px]">work</span> Chức vụ / Vai trò
              </label>
              <select id="s-edit-role"
                class="w-full border border-[#e2e2e4] bg-[#fafafa] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-apple-ink outline-none focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/10 transition cursor-pointer">
                <option value="Lễ tân" ${nv.chuc_vu === 'Lễ tân' ? 'selected' : ''}>Lễ tân</option>
                <option value="Kế toán" ${nv.chuc_vu === 'Kế toán' ? 'selected' : ''}>Kế toán</option>
                <option value="Nhân viên" ${nv.chuc_vu === 'Nhân viên' ? 'selected' : ''}>Nhân viên</option>
                <option value="Quản lý" ${nv.chuc_vu === 'Quản lý' ? 'selected' : ''}>Quản lý</option>
              </select>
            </div>

            <!-- Số điện thoại -->
            <div class="space-y-1">
              <label class="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-500 uppercase tracking-wide">
                <span class="material-symbols-outlined text-[14px]">call</span> Số điện thoại
              </label>
              <input type="tel" id="s-edit-phone" value="${nv.so_dien_thoai || ''}" required maxlength="10"
                class="w-full border border-[#e2e2e4] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-apple-ink outline-none focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/10 transition bg-[#fafafa]">
            </div>

            <!-- Email -->
            <div class="space-y-1 sm:col-span-2">
              <label class="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-500 uppercase tracking-wide">
                <span class="material-symbols-outlined text-[14px]">mail</span> Địa chỉ Email
              </label>
              <input type="email" id="s-edit-email" value="${nv.email || ''}"
                class="w-full border border-[#e2e2e4] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-apple-ink outline-none focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/10 transition bg-[#fafafa]">
            </div>

            <!-- Chi nhánh -->
            <div class="space-y-1 sm:col-span-2">
              <label class="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-500 uppercase tracking-wide">
                <span class="material-symbols-outlined text-[14px]">location_on</span> Chi nhánh công tác
              </label>
              <select id="s-edit-branch"
                class="w-full border border-[#e2e2e4] bg-[#fafafa] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-apple-ink outline-none focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/10 transition cursor-pointer">
                <option value="Trung tam chính" ${nv.chi_nhanh === 'Trung tam chính' ? 'selected' : ''}>Trung tâm chính</option>
                <option value="Downtown Campus" ${nv.chi_nhanh === 'Downtown Campus' ? 'selected' : ''}>Downtown Campus</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Footer / Action Buttons -->
        <div class="flex gap-2 pt-4 border-t border-[#f3f3f5] shrink-0 justify-between">
          <button type="button" id="btn-delete-staff-profile" class="px-5 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-xl transition active:scale-95 text-xs">
            Xóa hồ sơ nhân viên
          </button>
          <div class="flex gap-2">
            <button type="button" id="btn-cancel-inplace-edit" class="px-5 py-2.5 rounded-xl border border-[#e2e2e4] hover:bg-slate-50 text-slate-700 font-semibold transition active:scale-95 text-xs">Đóng</button>
            <button type="submit" class="px-7 py-2.5 rounded-xl bg-emerald-600 hover:opacity-90 text-white font-bold transition active:scale-95 shadow-sm text-xs">Lưu thay đổi</button>
          </div>
        </div>
      </form>
    </div>
  `;

  modal.classList.remove('hidden');

  // Lắng nghe click ảnh đại diện để mở chọn file
  const staffAvatarContainer = modal.querySelector('#staff-avatar-container');
  const staffAvatarFileInput = modal.querySelector('#staff-avatar-file-input');
  const staffAvatarImg = modal.querySelector('#staff-avatar-img');
  const staffAvatarPlaceholder = modal.querySelector('#staff-avatar-placeholder');
  let base64AvatarData = null;

  staffAvatarContainer?.addEventListener('click', () => {
    staffAvatarFileInput?.click();
  });

  staffAvatarFileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        base64AvatarData = reader.result;
        if (staffAvatarImg) {
          staffAvatarImg.src = base64AvatarData;
        } else if (staffAvatarContainer) {
          if (staffAvatarPlaceholder) staffAvatarPlaceholder.remove();
          const newImg = document.createElement('img');
          newImg.id = 'staff-avatar-img';
          newImg.src = base64AvatarData;
          newImg.className = 'w-full h-full object-cover';
          staffAvatarContainer.insertBefore(newImg, staffAvatarContainer.firstChild);
        }

        // Tự động lưu ảnh đại diện nhân viên khi đổi thành công
        const payload = {
          ho_ten: modal.querySelector('#s-edit-name').value.trim(),
          so_dien_thoai: modal.querySelector('#s-edit-phone').value.trim(),
          email: modal.querySelector('#s-edit-email').value.trim() || null,
          chuc_vu: modal.querySelector('#s-edit-role').value,
          chi_nhanh: modal.querySelector('#s-edit-branch').value,
          avatar_url: base64AvatarData
        };

        try {
          const putRes = await fetch(`${API_BASE}/staff/${nv.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-User-Role': 'admin' },
            body: JSON.stringify(payload)
          });
          const putResult = await putRes.json();
          if (putResult.success) {
            showToast('Cập nhật ảnh đại diện nhân viên thành công!', 'success');
            closeModal();
            renderStaffList(container, role);
          } else {
            showToast(putResult.error || 'Có lỗi xảy ra', 'error');
          }
        } catch (err) {
          showToast('Lỗi máy chủ', 'error');
        }
      };
      reader.readAsDataURL(file);
    }
  });

  // Đóng modal
  const closeModal = () => modal.classList.add('hidden');
  modal.querySelector('#close-staff-detail-modal').addEventListener('click', closeModal);
  modal.querySelector('#btn-cancel-inplace-edit').addEventListener('click', closeModal);

  // Xóa nhân viên trực tiếp
  modal.querySelector('#btn-delete-staff-profile').addEventListener('click', async () => {
    if (!confirm(`Bạn có chắc chắn muốn xóa hồ sơ nhân viên ${nv.ho_ten}?`)) return;
    try {
      const delRes = await fetch(`${API_BASE}/staff/${nv.id}`, {
        method: 'DELETE',
        headers: { 'X-User-Role': 'admin' }
      });
      const delResult = await delRes.json();
      if (delResult.success) {
        showToast('Đã xóa nhân viên thành công!', 'success');
        closeModal();
        renderStaffList(container, role);
      } else {
        showToast(delResult.error, 'error');
      }
    } catch {
      showToast('Lỗi kết nối máy chủ', 'error');
    }
  });

  modal.querySelector('#s-edit-name')?.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (val) {
      const disp = modal.querySelector('#staff-display-name');
      if (disp) disp.textContent = val;
      if (staffAvatarPlaceholder) staffAvatarPlaceholder.textContent = val.charAt(0).toUpperCase();
    }
  });

  // Submit form cập nhật
  modal.querySelector('#staff-edit-inplace-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameVal = modal.querySelector('#s-edit-name').value.trim();
    const phoneVal = modal.querySelector('#s-edit-phone').value.trim();
    const emailVal = modal.querySelector('#s-edit-email').value.trim();

    if (!isValidPhone(phoneVal)) {
      showToast('Số điện thoại phải đúng 10 chữ số, bắt đầu bằng 0', 'error');
      return;
    }
    if (emailVal && !isValidEmail(emailVal)) {
      showToast('Email không hợp lệ. Phải có định dạng abc@domain.com', 'error');
      return;
    }

    const payload = {
      ho_ten: nameVal,
      so_dien_thoai: phoneVal,
      email: emailVal || null,
      chuc_vu: modal.querySelector('#s-edit-role').value,
      chi_nhanh: modal.querySelector('#s-edit-branch').value,
      avatar_url: base64AvatarData || nv.avatar_url
    };

    try {
      const putRes = await fetch(`${API_BASE}/staff/${nv.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': 'admin'
        },
        body: JSON.stringify(payload)
      });
      const putResult = await putRes.json();
      if (putResult.success) {
        showToast('Cập nhật hồ sơ nhân viên thành công!', 'success');
        closeModal();
        renderStaffList(container, role);
      } else {
        showToast(putResult.error || 'Có lỗi xảy ra', 'error');
      }
    } catch (err) {
      showToast('Lỗi máy chủ khi cập nhật', 'error');
    }
  });
}
