// TeachersList.js - Hồ sơ Giáo viên hỗ trợ Bộ lọc chuyên môn, Modal Thêm giáo viên mới và In-place Edit
import { API_BASE, showToast } from './_shared.js';

// Hàm validate email hợp lệ (phải có domain.tld)
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

// Hàm validate SĐT 10 số
function isValidPhone(phone) {
  return /^0\d{9}$/.test(phone.replace(/\s/g, ''));
}

export async function renderTeachersList(container, role) {
  container.innerHTML = `
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-apple-blue"></div>
    </div>
  `;

  try {
    const res = await fetch(`${API_BASE}/teachers`, {
      headers: { 'X-User-Role': role || 'admin' }
    });
    const result = await res.json();
    const allTeachers = result.data || [];

    function renderTableRows(pageTeachers) {
      if (pageTeachers.length === 0) {
        return `<tr><td colspan="6" class="px-6 py-8 text-center text-slate-400 text-xs font-semibold">Không tìm thấy giáo viên nào phù hợp.</td></tr>`;
      }
      return pageTeachers.map(t => `
        <tr class="hover:bg-slate-50/50 border-b border-slate-100 text-xs transition group cursor-pointer" data-id="${t.id}">
          <td class="sticky left-0 bg-white group-hover:bg-slate-50/50 transition-colors z-10 px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full overflow-hidden shadow-sm bg-gradient-to-br from-slate-100 to-slate-200/50 flex items-center justify-center font-bold text-slate-700 select-none shrink-0 border border-slate-200/20">
                ${t.avatar_url ? `<img src="${t.avatar_url}" class="w-full h-full object-cover">` : (t.ho_ten ? t.ho_ten.charAt(0) : 'G')}
              </div>
              <div>
                <div class="font-bold text-slate-800 text-sm tracking-tight">${t.ho_ten}</div>
                <div class="text-[10px] text-slate-400 mt-0.5 font-medium">Mã số: ${t.ma_ho_so}</div>
              </div>
            </div>
          </td>
          <td class="px-6 py-4 hidden">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-600 font-bold text-[10px] border border-slate-200/60">
              ${t.chuyen_mon || 'Dạy tiếng Anh'}
            </span>
          </td>
          <td class="px-6 py-4 text-slate-700 font-semibold">${t.so_dien_thoai || '—'}</td>
          <td class="px-6 py-4 text-slate-600 font-medium">${t.email || '—'}</td>
          <td class="px-6 py-4 text-slate-600 font-medium">${t.kinh_nghiem || 0} năm kinh nghiệm</td>
          <td class="sticky right-0 bg-white group-hover:bg-slate-50/50 transition-colors z-10 px-6 py-4 text-right">
            <button class="btn-delete-teacher-row px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100/80 text-rose-600 rounded-full transition text-[11px] font-bold active:scale-95 shadow-sm" data-id="${t.id}">
              Xóa
            </button>
          </td>
        </tr>
      `).join('');
    }

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="inline-flex bg-slate-100/80 p-1 rounded-full border border-slate-200/50 select-none backdrop-blur-sm">
            <button id="tab-teachers-active" class="px-5 py-1.5 rounded-full bg-white shadow-sm border border-slate-200/30 text-xs font-bold text-slate-800 transition active:scale-95">
              <span class="flex items-center gap-1.5"><span class="material-symbols-outlined text-[14px]">badge</span>Giáo viên</span>
            </button>
            <button id="tab-staff" class="px-5 py-1.5 rounded-full text-xs font-semibold text-slate-400 hover:text-slate-700 transition active:scale-95">
              <span class="flex items-center gap-1.5"><span class="material-symbols-outlined text-[14px]">manage_accounts</span>Nhân viên</span>
            </button>
          </div>
          <div class="flex items-center gap-2">
            <!-- Nút Refresh đồng bộ kích thước -->
            <button id="btn-refresh-teachers" class="flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-full transition-all active:scale-95 shadow-sm h-[32px]">
              <span class="material-symbols-outlined text-[16px]">refresh</span>Tải lại
            </button>
            <button id="btn-add-teacher-modal" class="flex items-center gap-1.5 px-5 py-2 rounded-full bg-apple-blue text-white text-xs font-semibold hover:opacity-90 transition active:scale-95 shadow-sm h-[32px]">
              <span class="material-symbols-outlined text-[16px]">add</span>
              Thêm giáo viên mới
            </button>
          </div>
        </div>

        <!-- Filter & Search Bar -->
        <div class="bg-white p-3 rounded-2xl flex flex-wrap gap-2 items-center border border-slate-100 shadow-sm">
          <!-- Tìm kiếm -->
          <div class="relative flex-1 min-w-[180px] text-xs">
            <input id="search-teachers-input" class="w-full pl-8 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-full outline-none focus:border-apple-blue focus:bg-white transition text-xs" placeholder="Tìm tên, mã số, hoặc SĐT..." type="text"/>
            <span class="material-symbols-outlined absolute left-2.5 top-2.5 text-slate-450 text-[16px]">search</span>
          </div>
          <!-- Bộ lọc Chuyên môn (Ẩn) -->
          <select id="filter-expertise" class="hidden border border-slate-200 bg-slate-50/50 rounded-full px-3.5 py-2 outline-none focus:border-apple-blue text-xs font-semibold text-slate-600 transition cursor-pointer">
            <option value="">Tất cả chuyên môn</option>
            <option value="Dạy tiếng Anh">Dạy tiếng Anh</option>
            <option value="Dạy Giao tiếp">Dạy Giao tiếp</option>
            <option value="Luyện thi IELTS">Luyện thi IELTS</option>
            <option value="Tiếng Anh Trẻ Em">Tiếng Anh Trẻ Em</option>
          </select>
          <!-- Bộ Lọc Kinh Nghiệm -->
          <select id="filter-experience" class="border border-slate-200 bg-slate-50/50 rounded-full px-3.5 py-2 outline-none focus:border-apple-blue text-xs font-semibold text-slate-600 transition cursor-pointer">
            <option value="">Tất cả kinh nghiệm</option>
            <option value="1-3">1 - 3 năm</option>
            <option value="3-5">3 - 5 năm</option>
            <option value="5+">> 5 năm</option>
          </select>
          <!-- Bộ Lọc Giới Tính -->
          <select id="filter-gender" class="border border-slate-200 bg-slate-50/50 rounded-full px-3.5 py-2 outline-none focus:border-apple-blue text-xs font-semibold text-slate-600 transition cursor-pointer">
            <option value="">Tất cả giới tính</option>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
            <option value="Khác">Khác</option>
          </select>
          <!-- Nút Đặt lại bộ lọc -->
          <button id="btn-reset-filters" class="flex items-center justify-center gap-1.5 px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-bold rounded-full transition-all active:scale-95 shadow-sm h-[32px]" type="button">
            <span class="material-symbols-outlined text-[16px]">restart_alt</span>Đặt lại bộ lọc
          </button>
        </div>

        <!-- Table Container -->
        <div class="bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col shadow-sm">
          <div class="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table class="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th class="sticky top-0 bg-slate-50 z-20 px-6 py-4">GIÁO VIÊN</th>
                  <th class="sticky top-0 bg-slate-50 z-20 px-6 py-4 hidden">CHUYÊN MÔN</th>
                  <th class="sticky top-0 bg-slate-50 z-20 px-6 py-4">SỐ ĐIỆN THOẠI</th>
                  <th class="sticky top-0 bg-slate-50 z-20 px-6 py-4">EMAIL</th>
                  <th class="sticky top-0 bg-slate-50 z-20 px-6 py-4">KINH NGHIỆM</th>
                  <th class="sticky top-0 bg-slate-50 z-20 px-6 py-4 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody id="teachers-table-body">
                <!-- Sẽ chèn bằng Infinity Scroll -->
              </tbody>
            </table>
          </div>
          <!-- Nút Tải thêm giáo viên kiểm soát được -->
          <div id="load-more-container" class="py-3 px-6 text-center border-t border-[#f3f3f5] bg-slate-50/50 hidden">
            <button id="btn-load-more" class="px-5 py-2 bg-white hover:bg-slate-50 border border-[#e2e2e4] text-slate-600 rounded-full text-xs font-bold transition active:scale-95 inline-flex items-center gap-1">
              <span>Tải thêm giáo viên</span>
              <span id="load-more-spinner" class="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-apple-blue hidden"></span>
            </button>
          </div>
          <div id="infinite-scroll-sentinel" class="h-4 w-full"></div>
        </div>
      </div>

      <!-- MODAL THÊM GIÁO VIÊN MỚI -->
      <div id="add-teacher-modal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center hidden p-4 animate-fadeIn">
        <div class="bg-white rounded-[28px] max-w-xl w-full p-6 space-y-4 border border-slate-100 shadow-2xl max-h-[90vh] overflow-y-auto" style="animation: modalIn 0.2s ease">
          <div class="flex justify-between items-center pb-3.5 border-b border-slate-50">
            <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span class="material-symbols-outlined text-apple-blue text-[20px]">person_add</span>
              Thêm giáo viên / Trợ giảng mới
            </h3>
            <button id="btn-close-teacher-modal" class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <form id="add-teacher-modal-form" class="space-y-4 text-xs">
            <div class="flex flex-col sm:flex-row gap-4 items-start">
              <!-- Avatar vuông góc trái trên cùng -->
              <div class="flex flex-col items-center gap-2 shrink-0 w-full sm:w-28">
                <span class="block font-semibold text-slate-500 self-start sm:self-center">Ảnh đại diện</span>
                <div class="relative w-24 h-24 border border-dashed border-slate-200 rounded-[20px] overflow-hidden flex items-center justify-center bg-slate-50 hover:bg-slate-100/50 transition cursor-pointer group shadow-inner" id="modal-avatar-preview-container">
                  <span class="material-symbols-outlined text-[28px] text-slate-400 group-hover:scale-110 transition duration-150">upload</span>
                  <img id="modal-add-avatar-preview" class="absolute inset-0 w-full h-full object-cover hidden">
                </div>
                <input type="file" id="modal-add-avatar" accept="image/*" class="hidden">
                <button type="button" id="btn-trigger-avatar-upload" class="px-3 py-1 bg-white border border-slate-200 text-[10px] font-bold rounded-full hover:bg-slate-50 shadow-sm active:scale-95 transition">Chọn ảnh</button>
              </div>

              <!-- Cột thông tin cơ bản bên phải avatar -->
              <div class="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                <div class="sm:col-span-2 space-y-1.5">
                  <label class="block font-semibold text-slate-500">Họ và tên giáo viên <span class="text-rose-500 font-bold">*</span></label>
                  <input type="text" id="modal-teacher-fullName" placeholder="Nhập họ tên đầy đủ..." class="w-full border border-slate-200 rounded-full px-4 py-2.5 outline-none focus:border-apple-blue transition bg-slate-50/50">
                </div>
                <div class="space-y-1.5">
                  <label class="block font-semibold text-slate-500">Kinh nghiệm (năm) <span class="text-rose-500 font-bold">*</span></label>
                  <input type="number" id="modal-teacher-exp" min="0" value="1" class="w-full border border-slate-200 rounded-full px-4 py-2.5 outline-none focus:border-apple-blue transition bg-slate-50/50">
                </div>
              </div>
            </div>

            <!-- Các hàng thông tin khác phía dưới -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <label class="block font-semibold text-slate-500">Số điện thoại (10 số) <span class="text-rose-500 font-bold">*</span></label>
                <input type="tel" id="modal-teacher-phone" placeholder="0xxxxxxxxx" maxlength="10" class="w-full border border-slate-200 rounded-full px-4 py-2.5 outline-none focus:border-apple-blue transition bg-slate-50/50">
                <p class="text-[10px] text-slate-400 mt-1 font-medium pl-1">Phải đúng 10 chữ số, bắt đầu bằng 0</p>
              </div>
              <div class="space-y-1.5">
                <label class="block font-semibold text-slate-500">Địa chỉ Email</label>
                <input type="email" id="modal-teacher-email" placeholder="teacher@example.com" class="w-full border border-slate-200 rounded-full px-4 py-2.5 outline-none focus:border-apple-blue transition bg-slate-50/50">
                <p class="text-[10px] text-slate-400 mt-1 font-medium pl-1">Ví dụ: abc@gmail.com (không bắt buộc)</p>
              </div>
              <div class="sm:col-span-2 hidden space-y-1.5">
                <label class="block font-semibold text-slate-500">Chuyên môn giảng dạy <span class="text-rose-500 font-bold">*</span></label>
                <select id="modal-teacher-expertise" class="w-full border border-slate-200 bg-slate-50/50 rounded-full px-4 py-2.5 outline-none focus:border-apple-blue transition text-xs cursor-pointer">
                  <option value="Dạy tiếng Anh" selected>Dạy tiếng Anh</option>
                  <option value="Dạy Giao tiếp">Dạy Giao tiếp</option>
                  <option value="Luyện thi IELTS">Luyện thi IELTS</option>
                  <option value="Tiếng Anh Trẻ Em">Tiếng Anh Trẻ Em</option>
                </select>
              </div>

              <!-- Checkbox Tự động tạo tài khoản và Tài khoản / Mật khẩu -->
              <div class="sm:col-span-2 space-y-3 p-4 bg-slate-50/55 rounded-[20px] border border-slate-100">
                <div class="flex items-center gap-2">
                  <input type="checkbox" id="modal-teacher-autoAccount" class="rounded text-apple-blue focus:ring-apple-blue w-4 h-4 cursor-pointer" checked>
                  <label for="modal-teacher-autoAccount" class="font-bold text-slate-700 cursor-pointer select-none text-xs">Tự động tạo tài khoản đăng nhập</label>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3" id="modal-account-fields">
                  <div class="space-y-1.5">
                    <label class="block font-semibold text-slate-500">Tên đăng nhập</label>
                    <input type="text" id="modal-teacher-username" placeholder="Tên đăng nhập..." readonly class="w-full border border-slate-200 rounded-full px-4 py-2.5 outline-none bg-slate-100 cursor-not-allowed">
                  </div>
                  <div class="space-y-1.5">
                    <label class="block font-semibold text-slate-500">Mật khẩu đăng nhập</label>
                    <input type="text" id="modal-teacher-password" placeholder="Mật khẩu..." class="w-full border border-slate-250 rounded-full px-4 py-2.5 outline-none focus:border-apple-blue transition bg-white">
                  </div>
                </div>
              </div>
            </div>
            <div class="flex justify-end gap-2 pt-4 border-t border-slate-50">
              <button type="button" id="btn-cancel-teacher-add" class="px-5 py-2.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition active:scale-95 text-xs">Hủy bỏ</button>
              <button type="submit" class="px-7 py-2.5 rounded-full bg-apple-blue hover:opacity-90 text-white font-bold transition active:scale-95 shadow-sm text-xs">Lưu giáo viên</button>
            </div>
          </form>
        </div>
    `;

    const tableBody = document.getElementById('teachers-table-body');
    const searchInput = document.getElementById('search-teachers-input');
    const filterExpertise = document.getElementById('filter-expertise');
    const loadMoreContainer = document.getElementById('load-more-container');
    const btnLoadMore = document.getElementById('btn-load-more');
    const spinnerLoadMore = document.getElementById('load-more-spinner');

    // IntersectionObserver Infinite Scroll Setup
    let displayCount = 10;
    let filteredList = [...allTeachers];
    let isPageLoadingMore = false;

    function renderInfinityRows(list) {
      const rowsHtml = renderTableRows(list.slice(0, displayCount));
      tableBody.innerHTML = rowsHtml;
      attachRowEvents(list.slice(0, displayCount));
    }

    function updateTableInfinity(list) {
      filteredList = list;
      displayCount = 10;
      renderInfinityRows(filteredList);
    }

    // Thiết lập IntersectionObserver theo dõi sentinel
    if (window.teachersObserver) {
      window.teachersObserver.disconnect();
    }
    const sentinel = document.getElementById('infinite-scroll-sentinel');
    if (sentinel) {
      window.teachersObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && displayCount < filteredList.length && !isPageLoadingMore) {
          isPageLoadingMore = true;
          if (loadMoreContainer) {
            loadMoreContainer.classList.remove('hidden');
            spinnerLoadMore?.classList.remove('hidden');
          }
          setTimeout(() => {
            displayCount = Math.min(displayCount + 10, filteredList.length);
            renderInfinityRows(filteredList);
            isPageLoadingMore = false;
            if (loadMoreContainer) {
              loadMoreContainer.classList.add('hidden');
              spinnerLoadMore?.classList.add('hidden');
            }
          }, 150);
        }
      }, { rootMargin: '10px' });
      window.teachersObserver.observe(sentinel);
    }

    const filterExperience = document.getElementById('filter-experience');
    const filterGender = document.getElementById('filter-gender');

    // Sự kiện lọc giáo viên
    function applyFilters() {
      const q = searchInput.value.toLowerCase();
      const exp = filterExpertise.value;
      const experienceVal = filterExperience.value;
      const genderVal = filterGender.value;

      const filtered = allTeachers.filter(t => {
        const matchesSearch = (t.ho_ten && t.ho_ten.toLowerCase().includes(q)) ||
          (t.ma_ho_so && t.ma_ho_so.toLowerCase().includes(q)) ||
          (t.so_dien_thoai && t.so_dien_thoai.includes(q));
        const matchesExpertise = exp === "" || t.chuyen_mon === exp;

        let matchesExperience = true;
        if (experienceVal) {
          const years = parseInt(t.kinh_nghiem) || 0;
          if (experienceVal === '1-3') matchesExperience = years >= 1 && years <= 3;
          else if (experienceVal === '3-5') matchesExperience = years >= 3 && years <= 5;
          else if (experienceVal === '5+') matchesExperience = years > 5;
        }

        const matchesGender = genderVal === "" || (t.gioi_tinh && t.gioi_tinh.toLowerCase() === genderVal.toLowerCase());

        return matchesSearch && matchesExpertise && matchesExperience && matchesGender;
      });

      updateTableInfinity(filtered);
    }

    searchInput.addEventListener('input', applyFilters);
    filterExpertise.addEventListener('change', applyFilters);
    filterExperience.addEventListener('change', applyFilters);
    filterGender.addEventListener('change', applyFilters);

    document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
      searchInput.value = '';
      filterExpertise.value = '';
      filterExperience.value = '';
      filterGender.value = '';
      applyFilters();
    });

    // Gắn sự kiện dòng bảng
    function attachRowEvents(currentList) {
      tableBody.querySelectorAll('tr').forEach(row => {
        row.addEventListener('click', (e) => {
          const id = row.getAttribute('data-id');
          if (e.target.closest('.btn-delete-teacher-row')) {
            e.stopPropagation();
            deleteTeacher(id);
            return;
          }
          const t = currentList.find(item => item.id == id);
          if (t) showTeacherDetailModal(t, container, role);
        });
      });
    }

    async function deleteTeacher(id) {
      if (!confirm('Bạn có chắc chắn muốn xóa hồ sơ giáo viên này khỏi hệ thống?')) return;
      try {
        const resDel = await fetch(`${API_BASE}/teachers/${id}`, {
          method: 'DELETE',
          headers: { 'X-User-Role': 'admin' }
        });
        const resultJson = await resDel.json();
        if (resultJson.success) {
          showToast('Đã xóa hồ sơ giáo viên thành công!');
          renderTeachersList(container, role);
        } else {
          showToast(resultJson.error, 'error');
        }
      } catch (err) {
        showToast('Lỗi máy chủ', 'error');
      }
    }

    updateTableInfinity(allTeachers);

    // Chuyển tab
    document.getElementById('tab-staff')?.addEventListener('click', () => {
      window._navigatePage && window._navigatePage('staff-list');
    });

    // Sự kiện refresh giáo viên
    document.getElementById('btn-refresh-teachers')?.addEventListener('click', () => {
      renderTeachersList(container, role);
    });

    // Mở modal thêm giáo viên
    const addModal = document.getElementById('add-teacher-modal');
    document.getElementById('btn-add-teacher-modal')?.addEventListener('click', () => {
      addModal.classList.remove('hidden');
      document.getElementById('add-teacher-modal-form').reset();

      const phoneInput = document.getElementById('modal-teacher-phone');
      const usernameInput = document.getElementById('modal-teacher-username');
      const passwordInput = document.getElementById('modal-teacher-password');
      const autoAccCheckbox = document.getElementById('modal-teacher-autoAccount');
      const avatarPreview = document.getElementById('modal-add-avatar-preview');
      if (avatarPreview) avatarPreview.classList.add('hidden');

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

    document.getElementById('modal-teacher-phone')?.addEventListener('input', (e) => {
      const autoAccCheckbox = document.getElementById('modal-teacher-autoAccount');
      const usernameInput = document.getElementById('modal-teacher-username');
      if (autoAccCheckbox && autoAccCheckbox.checked && usernameInput) {
        usernameInput.value = e.target.value.trim();
      }
    });

    document.getElementById('modal-teacher-autoAccount')?.addEventListener('change', (e) => {
      const usernameInput = document.getElementById('modal-teacher-username');
      const passwordInput = document.getElementById('modal-teacher-password');
      const phoneInput = document.getElementById('modal-teacher-phone');
      if (e.target.checked) {
        if (usernameInput) usernameInput.value = phoneInput.value.trim();
        if (passwordInput) passwordInput.value = '123456';
      }
    });

    document.getElementById('btn-close-teacher-modal')?.addEventListener('click', () => addModal.classList.add('hidden'));
    document.getElementById('btn-cancel-teacher-add')?.addEventListener('click', () => addModal.classList.add('hidden'));

    // Gửi form thêm giáo viên mới với validation JS
    document.getElementById('add-teacher-modal-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const fields = [
        { id: 'modal-teacher-fullName', label: 'Họ và tên giáo viên' },
        { id: 'modal-teacher-phone', label: 'Số điện thoại liên hệ' },
        { id: 'modal-teacher-expertise', label: 'Chuyên môn giảng dạy' },
        { id: 'modal-teacher-exp', label: 'Kinh nghiệm (năm)' }
      ];

      let hasError = false;
      fields.forEach(f => {
        const input = document.getElementById(f.id);
        if (!input.value || input.value.trim() === '') {
          input.classList.add('border-red-500', 'bg-red-50');
          input.classList.remove('border-[#e2e2e4]', 'bg-apple-pearl');
          if (!hasError) {
            showToast(`Vui lòng điền trường bắt buộc: ${f.label}`, 'error');
            input.focus();
            hasError = true;
          }
        } else {
          input.classList.remove('border-red-500', 'bg-red-50');
          input.classList.add('border-[#e2e2e4]', 'bg-apple-pearl');
        }
      });

      if (hasError) return;

      // Validate SĐT 10 số bắt buộc
      const phoneVal = document.getElementById('modal-teacher-phone').value.trim();
      if (!isValidPhone(phoneVal)) {
        document.getElementById('modal-teacher-phone').classList.add('border-red-500', 'bg-red-50');
        showToast('Số điện thoại phải đúng 10 chữ số, bắt đầu bằng 0 (ví dụ: 0912345678)', 'error');
        return;
      }

      // Validate Email (nếu có điền)
      const emailVal = document.getElementById('modal-teacher-email').value.trim();
      if (emailVal && !isValidEmail(emailVal)) {
        document.getElementById('modal-teacher-email').classList.add('border-red-500', 'bg-red-50');
        showToast('Email không hợp lệ. Phải có định dạng abc@domain.com', 'error');
        return;
      }

      const avatarFile = document.getElementById('modal-add-avatar').files[0];
      const autoCreateAccount = document.getElementById('modal-teacher-autoAccount').checked;

      const submitForm = async (avatarBase64 = null) => {
        const payload = {
          ho_ten: document.getElementById('modal-teacher-fullName').value.trim(),
          so_dien_thoai: phoneVal,
          email: emailVal || null,
          chuyen_mon: document.getElementById('modal-teacher-expertise').value,
          kinh_nghiem: parseInt(document.getElementById('modal-teacher-exp').value) || 0,
          avatar_url: avatarBase64,
          auto_create_account: autoCreateAccount,
          username: document.getElementById('modal-teacher-username') ? document.getElementById('modal-teacher-username').value.trim() : null,
          password: document.getElementById('modal-teacher-password') ? document.getElementById('modal-teacher-password').value.trim() : null
        };

        try {
          const postRes = await fetch(`${API_BASE}/teachers/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-User-Role': 'admin'
            },
            body: JSON.stringify(payload)
          });
          const resultJson = await postRes.json();
          if (resultJson.success) {
            showToast('Tạo hồ sơ giáo viên thành công!');
            addModal.classList.add('hidden');
            renderTeachersList(container, role); // Reload
          } else {
            showToast(resultJson.error || 'Có lỗi xảy ra', 'error');
          }
        } catch (err) {
          showToast('Lỗi kết nối máy chủ', 'error');
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

// ===== MODAL CHI TIẾT + IN-PLACE EDIT GIÁO VIÊN =====
function showTeacherDetailModal(t, container, role) {
  let modal = document.getElementById('teacher-detail-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'teacher-detail-modal';
    modal.className = 'fixed inset-0 bg-black/45 backdrop-blur-md z-50 flex items-center justify-center p-4';
    document.body.appendChild(modal);
  }

  const ngayTaoFormatted = t.ngay_tao ? new Date(t.ngay_tao).toLocaleDateString('vi-VN') : '—';

  modal.innerHTML = `
    <div class="bg-white rounded-3xl max-w-xl w-full border border-[#e2e2e4] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-xs text-[#1a1c1d]" style="animation: modalIn 0.2s ease">
      <!-- Header cố định -->
      <div class="flex justify-between items-center px-6 py-4 border-b border-[#f3f3f5] shrink-0">
        <h3 class="text-sm font-bold text-[#1a1c1d] flex items-center gap-2">
          <span class="material-symbols-outlined text-apple-blue text-[22px]">badge</span>
          Hồ sơ Giáo viên & Trợ giảng
        </h3>
        <button id="close-teacher-detail-modal" class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all flex items-center justify-center">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <!-- Body Scroll -->
      <form id="teacher-edit-inplace-form" class="p-6 overflow-y-auto space-y-5 flex-1">
        <!-- Profile Banner -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-br from-[#0066cc]/8 via-[#0066cc]/3 to-transparent border border-[#0066cc]/15">
          <div class="flex items-center gap-4">
            <div class="relative w-14 h-14 rounded-2xl bg-[#f3f3f5] border border-apple-divider/40 text-apple-ink overflow-hidden flex items-center justify-center font-extrabold text-xl shadow-lg shrink-0 select-none cursor-pointer group" id="teacher-avatar-container">
              ${t.avatar_url ? `<img id="teacher-avatar-img" src="${t.avatar_url}" class="w-full h-full object-cover">` : `<span id="teacher-avatar-placeholder">${t.ho_ten ? t.ho_ten.charAt(0).toUpperCase() : 'G'}</span>`}
              <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <span class="material-symbols-outlined text-white text-[16px]">photo_camera</span>
              </div>
            </div>
            <input type="file" id="teacher-avatar-file-input" accept="image/*" class="hidden">
            <div>
              <h4 class="font-extrabold text-base text-apple-ink" id="teacher-display-name">${t.ho_ten}</h4>
              <div class="flex flex-wrap items-center gap-2 mt-1">
                <span class="px-2 py-0.5 rounded-md bg-[#0066cc]/10 text-apple-blue font-bold text-[10px] tracking-wide uppercase">${t.ma_ho_so}</span>
                <span class="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                <span class="text-slate-400 font-medium text-[10.5px]">Gia nhập: ${ngayTaoFormatted}</span>
              </div>
            </div>
          </div>
          <!-- Trạng thái lưu -->
          <div id="teacher-save-status" class="hidden items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-[10.5px] font-semibold self-end sm:self-center">
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
              <input type="text" id="t-edit-name" value="${t.ho_ten || ''}" required
                class="w-full border border-[#e2e2e4] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-apple-ink outline-none focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/10 transition bg-[#fafafa]">
            </div>

            <!-- Chuyên môn (Ẩn) -->
            <div class="space-y-1 hidden">
              <label class="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-500 uppercase tracking-wide">
                <span class="material-symbols-outlined text-[14px]">school</span> Chuyên môn
              </label>
              <select id="t-edit-expertise"
                class="w-full border border-[#e2e2e4] bg-[#fafafa] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-apple-ink outline-none focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/10 transition cursor-pointer">
                <option value="Dạy tiếng Anh" ${t.chuyen_mon === 'Dạy tiếng Anh' ? 'selected' : ''}>Dạy tiếng Anh</option>
                <option value="Dạy Giao tiếp" ${t.chuyen_mon === 'Dạy Giao tiếp' ? 'selected' : ''}>Dạy Giao tiếp</option>
                <option value="Luyện thi IELTS" ${t.chuyen_mon === 'Luyện thi IELTS' ? 'selected' : ''}>Luyện thi IELTS</option>
                <option value="Tiếng Anh Trẻ Em" ${t.chuyen_mon === 'Tiếng Anh Trẻ Em' ? 'selected' : ''}>Tiếng Anh Trẻ Em</option>
              </select>
            </div>

            <!-- Kinh nghiệm -->
            <div class="space-y-1">
              <label class="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-500 uppercase tracking-wide">
                <span class="material-symbols-outlined text-[14px]">military_tech</span> Kinh nghiệm (năm)
              </label>
              <input type="number" id="t-edit-exp" value="${t.kinh_nghiem || 0}" min="0"
                class="w-full border border-[#e2e2e4] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-apple-ink outline-none focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/10 transition bg-[#fafafa]">
            </div>

            <!-- Số điện thoại -->
            <div class="space-y-1">
              <label class="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-500 uppercase tracking-wide">
                <span class="material-symbols-outlined text-[14px]">call</span> Số điện thoại
              </label>
              <input type="tel" id="t-edit-phone" value="${t.so_dien_thoai || ''}"
                class="w-full border border-[#e2e2e4] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-apple-ink outline-none focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/10 transition bg-[#fafafa]">
            </div>

            <!-- Email -->
            <div class="space-y-1">
              <label class="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-500 uppercase tracking-wide">
                <span class="material-symbols-outlined text-[14px]">mail</span> Email
              </label>
              <input type="email" id="t-edit-email" value="${t.email || ''}"
                class="w-full border border-[#e2e2e4] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-apple-ink outline-none focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/10 transition bg-[#fafafa]">
            </div>

            <!-- Chi nhánh -->
            <div class="sm:col-span-2 space-y-1">
              <label class="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-500 uppercase tracking-wide">
                <span class="material-symbols-outlined text-[14px]">home_work</span> Chi nhánh công tác
              </label>
              <input type="text" id="t-edit-branch" value="${t.chi_nhanh || ''}" placeholder="Trung tâm chính"
                class="w-full border border-[#e2e2e4] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-apple-ink outline-none focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/10 transition bg-[#fafafa]">
            </div>

            <!-- Cấu hình lương ca dạy (Cải tiến 2) -->
            <div class="space-y-1">
              <label class="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-500 uppercase tracking-wide">
                <span class="material-symbols-outlined text-[14px]">payments</span> Lương ca nhóm (đ/ca)
              </label>
              <input type="number" id="t-edit-wage-group" value="${t.don_gia_ca_nhom !== undefined ? t.don_gia_ca_nhom : 150000}" min="0" step="1000"
                class="w-full border border-[#e2e2e4] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-apple-ink outline-none focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/10 transition bg-[#fafafa]">
            </div>

            <div class="space-y-1">
              <label class="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-500 uppercase tracking-wide">
                <span class="material-symbols-outlined text-[14px]">payments</span> Lương ca kèm 1-1 (đ/ca)
              </label>
              <input type="number" id="t-edit-wage-tutor" value="${t.don_gia_ca_kem !== undefined ? t.don_gia_ca_kem : 200000}" min="0" step="1000"
                class="w-full border border-[#e2e2e4] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-apple-ink outline-none focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/10 transition bg-[#fafafa]">
            </div>

          </div>
        </div>

        <!-- Footer Buttons -->
        <div class="flex justify-end gap-2 pt-4 border-t border-[#f3f3f5] shrink-0">
          <button type="button" id="close-teacher-detail-modal-footer"
            class="px-5 py-2.5 rounded-xl border border-[#e2e2e4] hover:bg-slate-50 text-slate-700 font-semibold transition active:scale-95 text-xs">
            Đóng
          </button>
          <button type="submit" id="btn-save-teacher-edit"
            class="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-apple-blue hover:opacity-90 text-white font-semibold transition active:scale-95 shadow-sm text-xs">
            <span class="material-symbols-outlined text-[15px]">save</span> Lưu thay đổi
          </button>
        </div>
      </form>
    </div>

    <style>
      @keyframes modalIn {
        from { opacity: 0; transform: scale(0.96) translateY(8px); }
        to   { opacity: 1; transform: scale(1) translateY(0); }
      }
    </style>
  `;

  modal.style.display = 'flex';

  const closeModal = () => { modal.style.display = 'none'; };
  modal.querySelector('#close-teacher-detail-modal').addEventListener('click', closeModal);
  modal.querySelector('#close-teacher-detail-modal-footer').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  // Lắng nghe click ảnh đại diện để mở chọn file
  const teacherAvatarContainer = modal.querySelector('#teacher-avatar-container');
  const teacherAvatarFileInput = modal.querySelector('#teacher-avatar-file-input');
  const teacherAvatarImg = modal.querySelector('#teacher-avatar-img');
  const teacherAvatarPlaceholder = modal.querySelector('#teacher-avatar-placeholder');
  let base64AvatarData = null;

  teacherAvatarContainer?.addEventListener('click', () => {
    teacherAvatarFileInput?.click();
  });

  teacherAvatarFileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        base64AvatarData = reader.result;
        if (teacherAvatarImg) {
          teacherAvatarImg.src = base64AvatarData;
        } else if (teacherAvatarContainer) {
          if (teacherAvatarPlaceholder) teacherAvatarPlaceholder.remove();
          const newImg = document.createElement('img');
          newImg.id = 'teacher-avatar-img';
          newImg.src = base64AvatarData;
          newImg.className = 'w-full h-full object-cover';
          teacherAvatarContainer.insertBefore(newImg, teacherAvatarContainer.firstChild);
        }

        // Tự động lưu ảnh đại diện khi đổi thành công
        const payload = {
          ho_ten: modal.querySelector('#t-edit-name').value.trim(),
          chuyen_mon: modal.querySelector('#t-edit-expertise').value,
          kinh_nghiem: parseInt(modal.querySelector('#t-edit-exp').value) || 0,
          so_dien_thoai: modal.querySelector('#t-edit-phone').value.trim(),
          email: modal.querySelector('#t-edit-email').value.trim() || null,
          chi_nhanh: modal.querySelector('#t-edit-branch').value.trim(),
          avatar_url: base64AvatarData
        };

        try {
          const putRes = await fetch(`${API_BASE}/teachers/${t.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-User-Role': 'admin' },
            body: JSON.stringify(payload)
          });
          const putResult = await putRes.json();
          if (putResult.success) {
            showToast('Cập nhật ảnh đại diện giáo viên thành công!', 'success');
            closeModal();
            renderTeachersList(container, role);
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

  modal.querySelector('#t-edit-name').addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (val) {
      modal.querySelector('#teacher-display-name').textContent = val;
      if (teacherAvatarPlaceholder) teacherAvatarPlaceholder.textContent = val.charAt(0).toUpperCase();
    }
  });

  modal.querySelector('#teacher-edit-inplace-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = modal.querySelector('#btn-save-teacher-edit');

    const phoneVal = modal.querySelector('#t-edit-phone').value.trim();
    if (!isValidPhone(phoneVal)) {
      showToast('Số điện thoại phải đúng 10 chữ số, bắt đầu bằng 0', 'error');
      return;
    }
    const emailVal = modal.querySelector('#t-edit-email').value.trim();
    if (emailVal && !isValidEmail(emailVal)) {
      showToast('Email không hợp lệ. Phải có định dạng abc@domain.com', 'error');
      return;
    }

    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span class="material-symbols-outlined text-[15px] animate-spin">progress_activity</span> Đang lưu...`;

    const payload = {
      ho_ten: modal.querySelector('#t-edit-name').value.trim(),
      chuyen_mon: modal.querySelector('#t-edit-expertise').value,
      kinh_nghiem: parseInt(modal.querySelector('#t-edit-exp').value) || 0,
      so_dien_thoai: phoneVal,
      email: emailVal || null,
      chi_nhanh: modal.querySelector('#t-edit-branch').value.trim(),
      avatar_url: base64AvatarData || t.avatar_url,
      don_gia_ca_nhom: parseFloat(modal.querySelector('#t-edit-wage-group').value) || 150000,
      don_gia_ca_kem: parseFloat(modal.querySelector('#t-edit-wage-tutor').value) || 200000
    };

    try {
      const putRes = await fetch(`${API_BASE}/teachers/${t.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': 'admin'
        },
        body: JSON.stringify(payload)
      });
      const putResult = await putRes.json();
      if (putResult.success) {
        showToast('Cập nhật hồ sơ giáo viên thành công!', 'success');
        closeModal();
        renderTeachersList(container, role);
      } else {
        showToast(putResult.error || 'Có lỗi xảy ra', 'error');
      }
    } catch (err) {
      showToast('Lỗi máy chủ', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<span class="material-symbols-outlined text-[15px]">save</span> Lưu thay đổi`;
    }
  });
}
