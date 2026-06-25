// StudentsList.js - Hồ sơ Học viên, Giáo viên, Nhân viên (tab 3 nút)
import { API_BASE, showToast, formatCurrencyInput, parseCurrencyInput, setupCustomDatePicker } from './_shared.js';

// Hàm validate email hợp lệ (phải có domain.tld)
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

// Hàm validate SĐT 10 số (bắt đầu bằng 0)
function isValidPhone(phone) {
  return /^0\d{9}$/.test(phone.replace(/\s/g, ''));
}

let coursePkgs = [];
let tutoringPkgs = [];
let teachersList = [];

export async function renderStudentsList(container, role) {
  container.innerHTML = `
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-apple-blue"></div>
    </div>
  `;

  try {
    const [studentsRes, coursePkgsRes, tutoringPkgsRes, teachersRes] = await Promise.all([
      fetch(`${API_BASE}/students`),
      fetch(`${API_BASE}/course-packages`),
      fetch(`${API_BASE}/tutoring-packages`),
      fetch(`${API_BASE}/teachers`)
    ]);

    const result = await studentsRes.json();
    const allStudents = result.data || [];

    coursePkgs = (await coursePkgsRes.json()).data || [];
    tutoringPkgs = (await tutoringPkgsRes.json()).data || [];
    teachersList = (await teachersRes.json()).data || [];

    const statusBadges = {
      con_han: `<div class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)] animate-pulse"></span><span class="font-bold text-emerald-700 text-[10.5px]">Đang hoạt động</span></div>`,
      sap_het_han: `<div class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)] animate-pulse"></span><span class="font-bold text-amber-700 text-[10.5px]">Sắp hết hạn</span></div>`,
      het_han: `<div class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]"></span><span class="font-bold text-rose-700 text-[10.5px]">Đã hết hạn</span></div>`,
      chua_dang_ky: `<div class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span><span class="font-bold text-slate-500 text-[10.5px]">Chưa mua gói</span></div>`
    };

    function renderTableRows(pageStudents) {
      if (pageStudents.length === 0) {
        return `<tr><td colspan="5" class="px-6 py-8 text-center text-slate-400 text-xs font-semibold">Không tìm thấy học viên nào phù hợp.</td></tr>`;
      }
      return pageStudents.map(sv => `
        <tr class="hover:bg-slate-50/50 border-b border-slate-100 text-xs transition group cursor-pointer" data-id="${sv.id}">
          <td class="sticky left-0 bg-white group-hover:bg-slate-50/50 transition-colors z-10 px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full overflow-hidden shadow-sm bg-gradient-to-br from-slate-100 to-slate-200/50 flex items-center justify-center font-bold text-slate-700 select-none shrink-0 border border-slate-200/20">
                ${sv.avatar_url ? `<img src="${sv.avatar_url}" class="w-full h-full object-cover">` : (sv.ho_ten || 'H').charAt(0)}
              </div>
              <div>
                <div class="font-bold text-slate-800 text-sm tracking-tight">${sv.ho_ten}</div>
                <div class="text-[10px] text-slate-400 mt-0.5 font-medium">Mã: ${sv.ma_ho_so}</div>
              </div>
            </div>
          </td>
          <td class="px-6 py-4">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-600 font-bold text-[10px] border border-slate-200/60">
              ${sv.trinh_do_dau_vao || 'Cơ bản A1'}
            </span>
          </td>
          <td class="px-6 py-4">
            <div class="text-slate-700 font-semibold">${sv.so_dien_thoai || '—'}</div>
            <div class="text-[10px] text-slate-400 mt-0.5 font-medium">${sv.ten_phu_huynh || 'Chưa cập nhật'}</div>
          </td>
          <td class="px-6 py-4">
            <span class="inline-flex items-center px-2.5 py-1 rounded-full ${sv.trang_thai_mau === 'con_han' ? 'bg-emerald-50/55 border border-emerald-100/70' :
          sv.trang_thai_mau === 'sap_het_han' ? 'bg-amber-50/55 border border-amber-100/70' :
            sv.trang_thai_mau === 'het_han' ? 'bg-rose-50/55 border border-rose-100/70' :
              'bg-slate-50 border border-slate-200/60'
        }">
              ${statusBadges[sv.trang_thai_mau] || statusBadges['chua_dang_ky']}
            </span>
          </td>
          <td class="sticky right-0 bg-white group-hover:bg-slate-50/50 transition-colors z-10 px-6 py-4 text-right">
            <button class="btn-cancel-reg px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100/80 text-rose-600 rounded-full transition text-[11px] font-bold active:scale-95 shadow-sm" data-id="${sv.id}" data-price="${sv.goi_dang_ky_gan_nhat_price || 0}">
              Hủy khóa
            </button>
          </td>
        </tr>
      `).join('');
    }

    container.innerHTML = `
      <div class="space-y-4">
        <!-- Tiêu đề / Badge quản lý -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-100/80 rounded-full border border-slate-200/50 text-slate-800 text-xs font-bold select-none backdrop-blur-sm">
            <span class="material-symbols-outlined text-[15px] text-apple-blue">school</span>
            Quản lý Học viên
          </div>
          <div class="flex items-center gap-2">
            <button id="btn-refresh-students" class="flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-full transition-all active:scale-95 shadow-sm h-[32px]">
              <span class="material-symbols-outlined text-[16px]">refresh</span>Tải lại
            </button>
            <button id="btn-add-student-modal" class="flex items-center gap-1.5 px-5 py-2 rounded-full bg-apple-blue text-white text-xs font-semibold hover:opacity-90 transition active:scale-95 shadow-sm h-[32px]">
              <span class="material-symbols-outlined text-[16px]">add</span>
              Thêm hồ sơ mới
            </button>
          </div>
        </div>

        <!-- Bộ lọc gộp lại trên 1 dòng có bộ lọc nâng cao -->
        <div class="bg-white p-3 rounded-2xl flex flex-wrap gap-2 items-center border border-slate-100 shadow-sm">
          <div class="relative flex-1 min-w-[180px] text-xs">
            <input id="search-students-input" class="w-full pl-8 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-full outline-none focus:border-apple-blue focus:bg-white transition text-xs" placeholder="Tìm tên, mã số, hoặc SĐT..." type="text"/>
            <span class="material-symbols-outlined absolute left-2.5 top-2.5 text-slate-450 text-[16px]">search</span>
          </div>
          <select id="filter-level" class="border border-slate-200 bg-slate-50/50 rounded-full px-3.5 py-2 outline-none focus:border-apple-blue text-xs font-semibold text-slate-600 transition cursor-pointer">
            <option value="">Tất cả trình độ</option>
            <option value="Cơ bản A1">A1 Beginner</option>
            <option value="Cơ bản A2">A2 Elementary</option>
            <option value="Trung cấp B1">B1 Intermediate</option>
            <option value="Trung cấp B2">B2 Upper-Intermediate</option>
            <option value="Cao cấp C1">C1 Advanced</option>
            <option value="Cao cấp C2">C2 Proficiency</option>
          </select>
          <select id="filter-status" class="border border-slate-200 bg-slate-50/50 rounded-full px-3.5 py-2 outline-none focus:border-apple-blue text-xs font-semibold text-slate-600 transition cursor-pointer">
            <option value="">Tất cả trạng thái</option>
            <option value="con_han">Đang hoạt động</option>
            <option value="sap_het_han">Sắp hết hạn</option>
            <option value="het_han">Đã hết hạn</option>
            <option value="chua_dang_ky">Chưa mua gói</option>
          </select>
          <select id="filter-package" class="border border-slate-200 bg-slate-50/50 rounded-full px-3.5 py-2 outline-none focus:border-apple-blue text-xs font-semibold text-slate-600 transition cursor-pointer max-w-[160px]">
            <option value="">Tất cả gói học</option>
            <optgroup label="Khóa học đại trà">
              ${coursePkgs.map(p => `<option value="course_${p.id}">${p.ten_goi}</option>`).join('')}
            </optgroup>
            <optgroup label="Gói kèm 1-1">
              ${tutoringPkgs.map(p => `<option value="tutor_${p.id}">${p.ten_goi}</option>`).join('')}
            </optgroup>
          </select>
          <select id="filter-teacher" class="border border-slate-200 bg-slate-50/50 rounded-full px-3.5 py-2 outline-none focus:border-apple-blue text-xs font-semibold text-slate-600 transition cursor-pointer max-w-[160px]">
            <option value="">Tất cả giáo viên</option>
            ${teachersList.map(t => `<option value="${t.id}">${t.ho_ten}</option>`).join('')}
          </select>
          <select id="filter-gender" class="border border-slate-200 bg-slate-50/50 rounded-full px-3.5 py-2 outline-none focus:border-apple-blue text-xs font-semibold text-slate-600 transition cursor-pointer">
            <option value="">Tất cả giới tính</option>
            <option value="nam">Nam</option>
            <option value="nữ">Nữ</option>
            <option value="khác">Khác</option>
          </select>
          <button id="btn-reset-filters" class="flex items-center justify-center gap-1.5 px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-bold rounded-full transition-all active:scale-95 shadow-sm h-[32px]" type="button">
            <span class="material-symbols-outlined text-[16px]">restart_alt</span>Đặt lại bộ lọc
          </button>
        </div>

        <!-- Table Container (bỏ cột Chi nhánh, còn 5 cột) -->
        <div class="bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col shadow-sm">
          <div class="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table class="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th class="sticky top-0 bg-slate-50 z-20 px-6 py-4">HỌC VIÊN</th>
                  <th class="sticky top-0 bg-slate-50 z-20 px-6 py-4">TRÌNH ĐỘ</th>
                  <th class="sticky top-0 bg-slate-50 z-20 px-6 py-4">LIÊN HỆ PHỤ HUYNH</th>
                  <th class="sticky top-0 bg-slate-50 z-20 px-6 py-4">TRẠNG THÁI</th>
                  <th class="sticky top-0 bg-slate-50 z-20 px-6 py-4 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody id="students-table-body">
                <!-- Sẽ chèn bằng setupSwipePagination -->
              </tbody>
            </table>
          </div>
          <!-- Nút Tải thêm học viên kiểm soát được -->
          <div id="load-more-container" class="py-3 px-6 text-center border-t border-slate-100 bg-slate-50/50 hidden">
            <button id="btn-load-more" class="px-5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-full text-xs font-bold transition active:scale-95 inline-flex items-center gap-1">
              <span>Tải thêm học viên</span>
              <span id="load-more-spinner" class="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-apple-blue hidden"></span>
            </button>
          </div>
          <div id="infinite-scroll-sentinel" class="h-4 w-full"></div>
        </div>
      </div>

      <!-- MODAL TIẾP NHẬN HỌC VIÊN MỚI (Ẩn mặc định) -->
      <div id="add-student-modal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center hidden p-4 animate-fadeIn">
        <div class="bg-white rounded-[28px] max-w-2xl w-full p-6 space-y-4 border border-slate-100 shadow-2xl max-h-[90vh] overflow-y-auto" style="animation: modalIn 0.2s ease">
          <div class="flex justify-between items-center pb-3 border-b border-[#f3f3f5]">
            <h3 class="text-[15px] font-bold text-[#1a1c1d] flex items-center gap-2">
              <span class="material-symbols-outlined text-apple-blue text-[20px]">person_add</span>
              Tiếp nhận học viên mới
            </h3>
            <button id="btn-close-add-modal" class="p-1.5 text-[#727784] hover:bg-[#f3f3f5] rounded-full transition-all">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <form id="add-student-modal-form" class="space-y-4 text-xs">
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
              <div class="flex-grow grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                <div class="md:col-span-2">
                  <label class="block font-semibold text-slate-600 mb-1">Họ và tên học viên <span class="text-rose-500 font-bold">*</span></label>
                  <input type="text" id="modal-add-fullName" placeholder="Nhập họ tên đầy đủ..." class="w-full border border-[#e2e2e4] rounded-xl px-4 py-2 outline-none focus:border-apple-blue transition bg-apple-pearl text-xs">
                </div>
                <div>
                  <label class="block font-semibold text-slate-600 mb-1">Ngày sinh</label>
                  <div id="modal-add-dob-container" class="relative">
                    <input type="date" id="modal-add-dob" max="${new Date().toISOString().split('T')[0]}">
                  </div>
                </div>
                <div>
                  <label class="block font-semibold text-slate-600 mb-1">Giới tính <span class="text-rose-500 font-bold">*</span></label>
                  <select id="modal-add-gender" class="w-full border border-[#e2e2e4] bg-[#f3f3f5] rounded-xl px-4 py-2 outline-none focus:border-apple-blue transition text-xs cursor-pointer">
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Các hàng thông tin khác phía dưới -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div class="md:col-span-2">
                <label class="block font-semibold text-slate-600 mb-1">Họ tên phụ huynh</label>
                <input type="text" id="modal-add-parentName" placeholder="Tên cha mẹ hoặc người giám hộ (không bắt buộc)..." class="w-full border border-[#e2e2e4] rounded-xl px-4 py-2 outline-none focus:border-apple-blue transition bg-apple-pearl text-xs">
              </div>
              <div>
                <label class="block font-semibold text-slate-600 mb-1">Số điện thoại (10 số) <span class="text-rose-500 font-bold">*</span></label>
                <input type="tel" id="modal-add-phone" placeholder="0xxxxxxxxx" maxlength="10" class="w-full border border-[#e2e2e4] rounded-xl px-4 py-2 outline-none focus:border-apple-blue transition bg-apple-pearl text-xs">
                <p class="text-[10px] text-slate-400 mt-1">Phải đúng 10 chữ số, bắt đầu bằng 0</p>
              </div>
              <div>
                <label class="block font-semibold text-slate-600 mb-1">Địa chỉ Email</label>
                <input type="email" id="modal-add-email" placeholder="parent@example.com" class="w-full border border-[#e2e2e4] rounded-xl px-4 py-2 outline-none focus:border-apple-blue transition bg-apple-pearl text-xs">
                <p class="text-[10px] text-slate-400 mt-1">Ví dụ: abc@gmail.com</p>
              </div>
              <div>
                <label class="block font-semibold text-slate-600 mb-1">Trình độ đầu vào <span class="text-rose-500 font-bold">*</span></label>
                <select id="modal-add-entryLevel" class="w-full border border-[#e2e2e4] bg-[#f3f3f5] rounded-xl px-4 py-2 outline-none focus:border-apple-blue transition text-xs cursor-pointer">
                  <option value="Cơ bản A1">A1 Beginner</option>
                  <option value="Cơ bản A2">A2 Elementary</option>
                  <option value="Trung cấp B1">B1 Intermediate</option>
                  <option value="Trung cấp B2">B2 Upper-Intermediate</option>
                  <option value="Cao cấp C1">C1 Advanced</option>
                  <option value="Cao cấp C2">C2 Proficiency</option>
                </select>
              </div>
              <div class="hidden">
                <label class="block font-semibold text-slate-600 mb-1">Chi nhánh tiếp nhận <span class="text-rose-500 font-bold">*</span></label>
                <select id="modal-add-branch" class="w-full border border-[#e2e2e4] bg-[#f3f3f5] rounded-xl px-4 py-2 outline-none focus:border-apple-blue transition text-xs cursor-pointer">
                  <option value="Trung tam chính" selected>Trung tâm chính</option>
                  <option value="Downtown Campus">Downtown Campus</option>
                </select>
              </div>

              <!-- Checkbox Tự động tạo tài khoản và Tài khoản / Mật khẩu -->
              <div class="md:col-span-2 space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100/80">
                <div class="flex items-center gap-2">
                  <input type="checkbox" id="modal-add-autoAccount" class="rounded text-apple-blue focus:ring-apple-blue w-4 h-4 cursor-pointer" checked>
                  <label for="modal-add-autoAccount" class="font-bold text-slate-700 cursor-pointer select-none text-xs">Tự động tạo tài khoản đăng nhập</label>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3" id="modal-account-fields">
                  <div>
                    <label class="block font-semibold text-slate-500 mb-1">Tên đăng nhập</label>
                    <input type="text" id="modal-add-username" placeholder="Tên đăng nhập..." readonly class="w-full border border-[#e2e2e4] rounded-xl px-4 py-2 outline-none bg-slate-100 cursor-not-allowed text-xs">
                  </div>
                  <div>
                    <label class="block font-semibold text-slate-500 mb-1">Mật khẩu đăng nhập</label>
                    <input type="text" id="modal-add-password" placeholder="Mật khẩu..." class="w-full border border-[#e2e2e4] rounded-xl px-4 py-2 outline-none focus:border-apple-blue transition bg-white text-xs" value="123456">
                  </div>
                </div>
              </div>
            </div>
            <div class="flex justify-end gap-2 pt-4 border-t border-[#f3f3f5]">
              <button type="button" id="btn-cancel-add" class="px-5 py-2.5 rounded-xl border border-[#e2e2e4] hover:bg-slate-50 text-slate-700 font-semibold transition active:scale-95 text-xs">Hủy bỏ</button>
              <button type="submit" class="px-7 py-2.5 rounded-xl bg-apple-blue hover:opacity-90 text-white font-semibold transition active:scale-95 shadow-sm text-xs">Lưu hồ sơ mới</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const tableBody = document.getElementById('students-table-body');
    const searchInput = document.getElementById('search-students-input');
    const filterLevel = document.getElementById('filter-level');
    const filterStatus = document.getElementById('filter-status');
    const filterPackage = document.getElementById('filter-package');
    const filterTeacher = document.getElementById('filter-teacher');
    const filterGender = document.getElementById('filter-gender');

    const loadMoreContainer = document.getElementById('load-more-container');
    const btnLoadMore = document.getElementById('btn-load-more');
    const spinnerLoadMore = document.getElementById('load-more-spinner');

    // IntersectionObserver Infinite Scroll Setup
    let displayCount = 10;
    let filteredList = [...allStudents];
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
    if (window.studentsObserver) {
      window.studentsObserver.disconnect();
    }
    const sentinel = document.getElementById('infinite-scroll-sentinel');
    if (sentinel) {
      window.studentsObserver = new IntersectionObserver((entries) => {
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
      window.studentsObserver.observe(sentinel);
    }

    function applyFilters() {
      const q = searchInput.value.toLowerCase();
      const level = filterLevel.value;
      const status = filterStatus.value;
      const pkgFilter = filterPackage.value;
      const teacherFilter = filterTeacher.value;
      const genderFilter = filterGender.value;

      const filtered = allStudents.filter(sv => {
        const matchesSearch = sv.ho_ten.toLowerCase().includes(q) ||
          sv.ma_ho_so.toLowerCase().includes(q) ||
          (sv.so_dien_thoai && sv.so_dien_thoai.includes(q));
        const matchesLevel = level === "" || sv.trinh_do_dau_vao === level;
        const matchesStatus = status === "" || sv.trang_thai_mau === status;
        const matchesGender = genderFilter === "" || (sv.gioi_tinh && sv.gioi_tinh.toLowerCase() === genderFilter.toLowerCase());

        let matchesPkg = true;
        if (pkgFilter) {
          const [type, id] = pkgFilter.split('_');
          const numId = parseInt(id);
          if (type === 'course') {
            matchesPkg = sv.active_course_pkg_ids && sv.active_course_pkg_ids.includes(numId);
          } else if (type === 'tutor') {
            matchesPkg = sv.active_tutor_pkg_ids && sv.active_tutor_pkg_ids.includes(numId);
          }
        }

        let matchesTeacher = true;
        if (teacherFilter) {
          const numId = parseInt(teacherFilter);
          matchesTeacher = sv.active_teacher_ids && sv.active_teacher_ids.includes(numId);
        }

        return matchesSearch && matchesLevel && matchesStatus && matchesPkg && matchesTeacher && matchesGender;
      });

      updateTableInfinity(filtered);
    }

    searchInput.addEventListener('input', applyFilters);
    filterLevel.addEventListener('change', applyFilters);
    filterStatus.addEventListener('change', applyFilters);
    filterPackage.addEventListener('change', applyFilters);
    filterTeacher.addEventListener('change', applyFilters);
    filterGender.addEventListener('change', applyFilters);

    document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
      searchInput.value = '';
      filterLevel.value = '';
      filterStatus.value = '';
      filterPackage.value = '';
      filterTeacher.value = '';
      filterGender.value = '';
      applyFilters();
    });

    function attachRowEvents(currentList) {
      tableBody.querySelectorAll('tr').forEach(row => {
        row.addEventListener('click', (e) => {
          if (e.target.closest('.btn-cancel-reg')) {
            e.stopPropagation();
            const studentId = e.target.closest('.btn-cancel-reg').getAttribute('data-id');
            const sv = currentList.find(item => item.id == studentId);
            if (sv) {
              showStudentDetailModal(sv);
              setTimeout(() => {
                const tabPkg = document.getElementById('btn-tab-packages');
                if (tabPkg) tabPkg.click();
              }, 150);
            }
            return;
          }
          const id = row.getAttribute('data-id');
          const sv = currentList.find(item => item.id == id);
          if (sv) showStudentDetailModal(sv);
        });
      });
    }

    updateTableInfinity(allStudents);

    // Tự động mở chi tiết học viên nếu chuyển từ màn hình biên lai thanh toán thành công
    const autoOpenId = sessionStorage.getItem('auto_open_student_id');
    if (autoOpenId) {
      sessionStorage.removeItem('auto_open_student_id');
      const studentToOpen = allStudents.find(item => item.id == autoOpenId);
      if (studentToOpen) {
        showStudentDetailModal(studentToOpen);
      }
    }


    // Sự kiện refresh học viên
    document.getElementById('btn-refresh-students')?.addEventListener('click', () => {
      renderStudentsList(container, role);
    });

    // Mở modal thêm hồ sơ
    const addModal = document.getElementById('add-student-modal');
    document.getElementById('btn-add-student-modal')?.addEventListener('click', () => {
      addModal.classList.remove('hidden');
      document.getElementById('add-student-modal-form').reset();

      const phoneInput = document.getElementById('modal-add-phone');
      const usernameInput = document.getElementById('modal-add-username');
      const passwordInput = document.getElementById('modal-add-password');
      const autoAccCheckbox = document.getElementById('modal-add-autoAccount');
      const avatarPreview = document.getElementById('modal-add-avatar-preview');
      if (avatarPreview) {
        avatarPreview.classList.add('hidden');
        avatarPreview.src = '';
      }

      if (autoAccCheckbox && autoAccCheckbox.checked) {
        usernameInput.value = phoneInput.value;
        passwordInput.value = '123456';
      }

      // Đặt mặc định ngày sinh là ngày hôm nay theo giờ địa phương (YYYY-MM-DD)
      const tzOffset = (new Date()).getTimezoneOffset() * 60000;
      const todayLocal = (new Date(Date.now() - tzOffset)).toISOString().split('T')[0];
      const dobInput = document.getElementById('modal-add-dob');
      if (dobInput) {
        dobInput.value = todayLocal;
      }

      setupCustomDatePicker(
        document.getElementById('modal-add-dob'),
        document.getElementById('modal-add-dob-container')
      );
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

    document.getElementById('modal-add-phone')?.addEventListener('input', (e) => {
      const autoAccCheckbox = document.getElementById('modal-add-autoAccount');
      const usernameInput = document.getElementById('modal-add-username');
      if (autoAccCheckbox && autoAccCheckbox.checked && usernameInput) {
        usernameInput.value = e.target.value.trim();
      }
    });

    document.getElementById('modal-add-autoAccount')?.addEventListener('change', (e) => {
      const usernameInput = document.getElementById('modal-add-username');
      const passwordInput = document.getElementById('modal-add-password');
      const phoneInput = document.getElementById('modal-add-phone');
      if (e.target.checked) {
        if (usernameInput) usernameInput.value = phoneInput.value.trim();
        if (passwordInput) passwordInput.value = '123456';
      }
    });

    document.getElementById('btn-close-add-modal')?.addEventListener('click', () => addModal.classList.add('hidden'));
    document.getElementById('btn-cancel-add')?.addEventListener('click', () => addModal.classList.add('hidden'));

    // Gửi form thêm học viên mới với validate JS & highlight
    document.getElementById('add-student-modal-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Validate bắt buộc
      const reqFields = [
        { id: 'modal-add-fullName', label: 'Họ và tên học viên' },
        { id: 'modal-add-gender', label: 'Giới tính' },
        { id: 'modal-add-phone', label: 'Số điện thoại' },
        { id: 'modal-add-entryLevel', label: 'Trình độ đầu vào' },
        { id: 'modal-add-branch', label: 'Chi nhánh tiếp nhận' }
      ];

      let hasError = false;
      reqFields.forEach(f => {
        const input = document.getElementById(f.id);
        const isEmpty = !input.value || input.value.trim() === '';
        if (isEmpty) {
          input.classList.add('border-red-500', 'bg-red-50');
          input.classList.remove('border-[#e2e2e4]', 'bg-apple-pearl');
          if (!hasError) { showToast(`Vui lòng điền: ${f.label}`, 'error'); input.focus(); hasError = true; }
        } else {
          input.classList.remove('border-red-500', 'bg-red-50');
          input.classList.add('border-[#e2e2e4]', 'bg-apple-pearl');
        }
      });
      if (hasError) return;

      // Validate SĐT 10 số
      const phoneVal = document.getElementById('modal-add-phone').value.trim();
      if (!isValidPhone(phoneVal)) {
        document.getElementById('modal-add-phone').classList.add('border-red-500', 'bg-red-50');
        showToast('Số điện thoại phải đúng 10 chữ số, bắt đầu bằng 0 (ví dụ: 0912345678)', 'error');
        return;
      }

      // Validate ngày sinh không vượt quá ngày hiện tại
      const dobVal = document.getElementById('modal-add-dob').value;
      if (dobVal) {
        const birthday = new Date(dobVal);
        const today = new Date();
        birthday.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        if (birthday > today) {
          showToast('Ngày sinh không được vượt quá ngày hiện tại', 'error');
          return;
        }
      }

      const autoCreateAccount = document.getElementById('modal-add-autoAccount').checked;
      if (autoCreateAccount) {
        const usernameVal = (document.getElementById('modal-add-username').value || phoneVal).trim();
        const passwordVal = document.getElementById('modal-add-password').value.trim();
        if (usernameVal.length !== 10) {
          showToast('Tên đăng nhập (Số điện thoại) tự động tạo phải đủ 10 số', 'error');
          return;
        }
        if (passwordVal.length < 6) {
          showToast('Mật khẩu tự động tạo phải có ít nhất 6 ký tự', 'error');
          return;
        }
      }

      // Validate Email (nếu có điền)
      const emailVal = document.getElementById('modal-add-email').value.trim();
      if (emailVal && !isValidEmail(emailVal)) {
        document.getElementById('modal-add-email').classList.add('border-red-500', 'bg-red-50');
        showToast('Email không hợp lệ. Phải có định dạng abc@domain.com', 'error');
        return;
      }

      const avatarFile = document.getElementById('modal-add-avatar').files[0];

      const submitForm = async (avatarBase64 = null) => {
        const payload = {
          ho_ten: document.getElementById('modal-add-fullName').value.trim(),
          ngay_sinh: document.getElementById('modal-add-dob').value || null,
          gioi_tinh: document.getElementById('modal-add-gender').value.toLowerCase(),
          ten_phu_huynh: document.getElementById('modal-add-parentName').value.trim() || null,
          so_dien_thoai: phoneVal,
          email: emailVal || null,
          trinh_do_dau_vao: document.getElementById('modal-add-entryLevel').value,
          chi_nhanh: document.getElementById('modal-add-branch').value,
          loai_ho_so: 'hoc_vien',
          avatar_url: avatarBase64,
          auto_create_account: autoCreateAccount,
          username: document.getElementById('modal-add-username') ? document.getElementById('modal-add-username').value.trim() : null,
          password: document.getElementById('modal-add-password') ? document.getElementById('modal-add-password').value.trim() : null
        };

        try {
          const postRes = await fetch(`${API_BASE}/students/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-User-Role': 'le_tan'
            },
            body: JSON.stringify(payload)
          });
          const resultJson = await postRes.json();
          if (resultJson.success) {
            showToast('Tạo hồ sơ học viên thành công!');
            addModal.classList.add('hidden');
            renderStudentsList(container, role);
          } else {
            showToast(resultJson.error || 'Có lỗi xảy ra', 'error');
          }
        } catch (err) {
          showToast('Lỗi máy chủ khi tạo học viên', 'error');
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

export function showStudentDetailModal(sv) {
  window.showStudentDetailModal = showStudentDetailModal;
  window.currentStudent = sv;
  let modal = document.getElementById('student-detail-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'student-detail-modal';
    modal.className = 'fixed inset-0 bg-black/45 backdrop-blur-md z-50 flex items-center justify-center p-4 hidden';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="bg-white rounded-3xl max-w-2xl w-full border border-[#e2e2e4] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      <div class="flex justify-between items-center px-6 py-4 border-b border-[#f3f3f5] shrink-0">
        <h3 class="text-sm font-bold text-[#1a1c1d] flex items-center gap-2">
          <span class="material-symbols-outlined text-apple-blue text-[22px]">account_circle</span>
          Hồ sơ Học viên & Gói dịch vụ
        </h3>
        <button id="close-student-detail-modal" class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all flex items-center justify-center">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>
      <div class="flex justify-center items-center py-16 shrink-0">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-apple-blue"></div>
      </div>
    </div>
  `;
  modal.classList.remove('hidden');

  modal.querySelector('#close-student-detail-modal').addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  fetch(`${API_BASE}/students/${sv.id}/registrations`)
    .then(res => res.json())
    .then(result => {
      if (!result.success) throw new Error(result.error);
      const { khoa_hoc, hoc_kem } = result.data;

      const activeCourses = khoa_hoc.filter(x => x.trang_thai === 'dang_hoat_dong');
      const activeTutors = hoc_kem.filter(x => x.trang_thai === 'dang_hoat_dong');
      const historyCourses = khoa_hoc.filter(x => x.trang_thai !== 'dang_hoat_dong');
      const historyTutors = hoc_kem.filter(x => x.trang_thai !== 'dang_hoat_dong');

      const dobFormatted = sv.ngay_sinh ? sv.ngay_sinh.substring(0, 10) : '';
      const ngayTaoFormatted = sv.ngay_tao ? new Date(sv.ngay_tao).toLocaleString('vi-VN') : '—';

      const levelOptions = [
        { value: 'Cơ bản A1', label: 'A1 Beginner' },
        { value: 'Cơ bản A2', label: 'A2 Elementary' },
        { value: 'Trung cấp B1', label: 'B1 Intermediate' },
        { value: 'Trung cấp B2', label: 'B2 Upper-Intermediate' },
        { value: 'Cao cấp C1', label: 'C1 Advanced' },
        { value: 'Cao cấp C2', label: 'C2 Proficiency' }
      ];

      modal.innerHTML = `
        <div class="bg-white rounded-3xl max-w-3xl w-full border border-[#e2e2e4] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in duration-200">
          <!-- Header cố định -->
          <div class="px-6 py-4 border-b border-[#f3f3f5] shrink-0">
            <div class="flex justify-between items-center">
              <h3 class="text-sm font-bold text-[#1a1c1d] flex items-center gap-2">
                <span class="material-symbols-outlined text-apple-blue text-[22px]">account_circle</span>
                Hồ sơ & Gói dịch vụ
              </h3>
              <button id="close-student-detail-modal" class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all flex items-center justify-center">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <!-- Tabs Menu -->
            <div class="flex mt-3 border-t border-[#f3f3f5] pt-2">
              <button type="button" id="btn-tab-info" class="px-4 py-2 font-bold text-xs text-apple-blue border-b-2 border-apple-blue transition focus:outline-none">Thông tin cá nhân</button>
              <button type="button" id="btn-tab-packages" class="px-4 py-2 font-medium text-xs text-slate-400 hover:text-apple-ink transition focus:outline-none">Gói học & Đăng ký</button>
            </div>
          </div>

          <!-- TAB PANEL 1: THÔNG TIN CÁ NHÂN -->
          <form id="student-inplace-edit-form" class="flex flex-col overflow-hidden max-h-[calc(90vh-95px)]">
            <div class="p-6 overflow-y-auto space-y-6 pr-4 scrollbar-thin">
              <!-- Header Profile -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-br from-[#0066cc]/5 via-[#0066cc]/1 to-transparent border border-[#0066cc]/10">
                <div class="flex items-center gap-4 w-full">
                  <div class="relative w-16 h-16 rounded-2xl bg-[#f3f3f5] border border-apple-divider/40 text-apple-ink overflow-hidden flex items-center justify-center font-extrabold text-2xl shadow-lg shrink-0 select-none cursor-pointer group" id="detail-avatar-container">
                    ${sv.avatar_url ? `<img id="detail-avatar-img" src="${sv.avatar_url}" class="w-full h-full object-cover">` : `<span id="detail-avatar-placeholder">${(sv.ho_ten || 'H').charAt(0)}</span>`}
                    <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <span class="material-symbols-outlined text-white text-[18px]">photo_camera</span>
                    </div>
                  </div>
                  <input type="file" id="detail-avatar-file-input" accept="image/*" class="hidden">
                  <div class="flex-grow space-y-1">
                    <input type="text" id="inplace-fullName" value="${sv.ho_ten || ''}" required 
                           class="font-extrabold text-base text-apple-ink bg-transparent border-b border-transparent hover:border-slate-300 focus:border-apple-blue focus:bg-white px-1.5 py-0.5 outline-none rounded transition w-full">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="px-2 py-0.5 rounded-md bg-[#0066cc]/10 text-apple-blue font-bold text-[10px] tracking-wide uppercase">${sv.ma_ho_so}</span>
                      <span class="text-slate-400 font-medium text-[10.5px]">Đăng ký lúc: ${ngayTaoFormatted}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Grid Thông tin cá nhân đầy đủ -->
              <div class="space-y-3">
                <h4 class="font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 text-slate-400">
                  <span class="material-symbols-outlined text-[16px]">info</span> Thông tin cá nhân (Có thể sửa)
                </h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <!-- Ngày sinh -->
                  <div class="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 flex items-start gap-2">
                    <span class="material-symbols-outlined text-slate-400 text-[18px] mt-2">calendar_today</span>
                    <div class="w-full">
                      <span class="block text-[9px] text-slate-400 font-semibold uppercase px-1">Ngày sinh</span>
                      <div id="inplace-dob-container" class="relative">
                        <input type="date" id="inplace-dob" value="${dobFormatted}" max="${new Date().toISOString().split('T')[0]}">
                      </div>
                    </div>
                  </div>
                  <!-- Giới tính -->
                  <div class="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 flex items-start gap-2">
                    <span class="material-symbols-outlined text-slate-400 text-[18px] mt-2">wc</span>
                    <div class="w-full">
                      <span class="block text-[9px] text-slate-400 font-semibold uppercase px-1">Giới tính</span>
                      <select id="inplace-gender" required
                              class="font-bold text-apple-ink text-xs w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-apple-blue focus:bg-white px-1 py-0.5 outline-none rounded transition cursor-pointer">
                        <option value="nam" ${sv.gioi_tinh === 'nam' ? 'selected' : ''}>Nam</option>
                        <option value="nữ" ${sv.gioi_tinh === 'nữ' ? 'selected' : ''}>Nữ</option>
                        <option value="khác" ${sv.gioi_tinh === 'khác' ? 'selected' : ''}>Khác</option>
                      </select>
                    </div>
                  </div>
                  <!-- Số điện thoại -->
                  <div class="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 flex items-start gap-2">
                    <span class="material-symbols-outlined text-slate-400 text-[18px] mt-2">call</span>
                    <div class="w-full">
                      <span class="block text-[9px] text-slate-400 font-semibold uppercase px-1">Số điện thoại (10 số)</span>
                      <input type="tel" id="inplace-phone" value="${sv.so_dien_thoai || ''}" required maxlength="10"
                             class="font-bold text-apple-ink text-xs w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-apple-blue focus:bg-white px-1 py-0.5 outline-none rounded transition">
                    </div>
                  </div>
                  <!-- Email -->
                  <div class="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 flex items-start gap-2">
                    <span class="material-symbols-outlined text-slate-400 text-[18px] mt-2">mail</span>
                    <div class="w-full">
                      <span class="block text-[9px] text-slate-400 font-semibold uppercase px-1">Email</span>
                      <input type="email" id="inplace-email" value="${sv.email || ''}"
                             class="font-bold text-apple-ink text-xs w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-apple-blue focus:bg-white px-1 py-0.5 outline-none rounded transition">
                    </div>
                  </div>
                  <!-- Phụ huynh -->
                  <div class="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 flex items-start gap-2">
                    <span class="material-symbols-outlined text-slate-400 text-[18px] mt-2">supervisor_account</span>
                    <div class="w-full">
                      <span class="block text-[9px] text-slate-400 font-semibold uppercase px-1">Tên phụ huynh</span>
                      <input type="text" id="inplace-parentName" value="${sv.ten_phu_huynh || ''}"
                             class="font-bold text-apple-ink text-xs w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-apple-blue focus:bg-white px-1 py-0.5 outline-none rounded transition">
                    </div>
                  </div>
                  <!-- Trình độ đầu vào -->
                  <div class="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 flex items-start gap-2">
                    <span class="material-symbols-outlined text-slate-400 text-[18px] mt-2">school</span>
                    <div class="w-full">
                      <span class="block text-[9px] text-slate-400 font-semibold uppercase px-1">Trình độ đầu vào</span>
                      <select id="inplace-entryLevel" required
                              class="font-bold text-apple-ink text-xs w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-apple-blue focus:bg-white px-1 py-0.5 outline-none rounded transition cursor-pointer">
                        ${levelOptions.map(opt => `<option value="${opt.value}" ${sv.trinh_do_dau_vao === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer cố định của Tab Thông tin -->
            <div class="flex justify-between items-center px-6 py-4 border-t border-[#f3f3f5] bg-slate-50 shrink-0">
              <button type="button" id="btn-delete-student-profile" class="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl font-bold transition active:scale-95 text-xs">
                <span class="material-symbols-outlined text-[16px]">delete</span>Xóa học viên
              </button>
              <div class="flex gap-2">
                <button type="button" id="btn-cancel-inplace-edit" class="px-4 py-2 rounded-xl border border-[#e2e2e4] hover:bg-slate-100 text-slate-700 font-semibold transition active:scale-95 text-xs">Đóng</button>
                <button type="submit" class="px-6 py-2 rounded-xl bg-apple-blue hover:opacity-90 text-white font-bold transition active:scale-95 shadow-md text-xs">Lưu thay đổi</button>
              </div>
            </div>
          </form>

          <!-- TAB PANEL 2: GÓI HỌC (Ẩn mặc định) -->
          <div id="panel-packages" class="hidden flex-col overflow-hidden max-h-[calc(90vh-140px)]">
            <div class="p-3 overflow-y-auto space-y-3 pr-2 scrollbar-thin flex-grow">
              <!-- Section: Gói đang hoạt động -->
              <div class="space-y-3">
                <h4 class="font-bold text-apple-blue uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[16px]">task_alt</span> Gói đang hoạt động
                </h4>
                <div id="active-packages-list" class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  ${activeCourses.map(item => `
                    <div class="border border-[#0066cc]/20 rounded-xl p-3 bg-gradient-to-br from-[#0066cc]/5 to-transparent flex flex-col justify-between gap-2 relative overflow-hidden active-pkg-card" data-id="${item.id}" data-type="khoa_hoc" data-original-tu-ngay="${new Date(item.tu_ngay).toLocaleDateString('sv-SE')}">
                      <div class="pkg-view-mode">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-apple-blue"></span>
                            <span class="font-extrabold text-xs text-[#1a1c1d]">${item.ten_goi || 'Khóa học đại trà'}</span>
                          </div>
                          <button type="button" class="btn-edit-active-pkg text-apple-blue hover:underline font-semibold text-[10px]">Sửa/Đổi gói</button>
                        </div>
                        <div class="text-[10px] text-slate-500 mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5">
                           <p>📅 <strong>${new Date(item.tu_ngay).toLocaleDateString('vi-VN')}</strong> → <strong>${new Date(item.den_ngay).toLocaleDateString('vi-VN')}</strong></p>
                           <p>💳 <strong>${item.phuong_thuc_tt === 'tien_mat' ? 'Tiền mặt' : item.phuong_thuc_tt === 'chuyen_khoan' ? 'Chuyển khoản' : item.phuong_thuc_tt === 'the_ngan_hang' ? 'Thẻ ngân hàng' : (item.phuong_thuc_tt || 'Tiền mặt')}</strong></p>
                           <p>Giá: <strong>${Number(item.gia_thuc_te || 0).toLocaleString('vi-VN')} VNĐ</strong></p>
                           <p>Thực thu: <strong>${Number(item.so_tien_da_thu || 0).toLocaleString('vi-VN')} VNĐ</strong></p>
                        </div>
                        <button type="button" class="btn-cancel-active-package w-full mt-2 bg-red-50 hover:bg-red-100 text-red-600 py-1 rounded-xl font-bold transition active:scale-95 text-[10px]" data-id="${item.id}" data-price="${item.so_tien_da_thu || 0}" data-type="khoa_hoc">
                          Hủy gói / Hoàn tiền
                        </button>
                      </div>

                      <!-- Edit/Change package mode -->
                      <div class="pkg-edit-mode hidden space-y-2 text-[10.5px]">
                        <div class="font-bold text-[#1a1c1d] mb-1">Chỉnh sửa đăng ký khóa học</div>
                        <div>
                          <label class="block text-[9px] font-bold text-slate-400 mb-0.5">CHỌN GÓI HỌC (ĐỔI GÓI)</label>
                          <select class="edit-pkg-select w-full border border-[#e2e2e4] rounded-lg p-1 text-[11px] bg-white">
                            ${coursePkgs.map(p => `<option value="${p.id}" ${p.id === item.goi_hoc_phi_id ? 'selected' : ''} data-price="${p.gia}" data-months="${p.so_thang}">${p.ten_goi}</option>`).join('')}
                          </select>
                        </div>
                         <div class="grid grid-cols-2 gap-1.5">
                          <div>
                            <label class="block text-[9px] font-bold text-slate-400 mb-0.5">TỪ NGÀY</label>
                            <input type="date" class="edit-tu-ngay w-full border border-[#e2e2e4] rounded-lg p-1 text-[11px]" min="${new Date().toLocaleDateString('sv-SE')}" value="${new Date(item.tu_ngay).toLocaleDateString('sv-SE')}">
                          </div>
                          <div>
                            <label class="block text-[9px] font-bold text-slate-400 mb-0.5">ĐẾN NGÀY</label>
                            <input type="date" class="edit-den-ngay w-full border border-[#e2e2e4] rounded-lg p-1 text-[11px]" value="${new Date(item.den_ngay).toLocaleDateString('sv-SE')}">
                          </div>
                        </div>
                        <div class="grid grid-cols-2 gap-1.5">
                          <div>
                            <label class="block text-[9px] font-bold text-slate-400 mb-0.5">GIÁ THỰC TẾ (VNĐ)</label>
                            <input type="text" class="edit-gia-thuc-te w-full border border-[#e2e2e4] rounded-lg p-1 text-[11px]" value="${formatCurrencyInput(String(item.gia_thuc_te || 0))}">
                          </div>
                          <div>
                            <label class="block text-[9px] font-bold text-slate-400 mb-0.5">ĐÃ THU (VNĐ)</label>
                            <input type="text" class="edit-da-thu w-full border border-[#e2e2e4] rounded-lg p-1 text-[11px]" value="${formatCurrencyInput(String(item.so_tien_da_thu || 0))}">
                          </div>
                        </div>
                        <div>
                          <label class="block text-[9px] font-bold text-slate-400 mb-0.5">PHƯƠNG THỨC TT</label>
                          <select class="edit-phuong-thuc w-full border border-[#e2e2e4] rounded-lg p-1 text-[11px] bg-white">
                            <option value="tien_mat" ${item.phuong_thuc_tt === 'tien_mat' ? 'selected' : ''}>Tiền mặt</option>
                            <option value="chuyen_khoan" ${item.phuong_thuc_tt === 'chuyen_khoan' ? 'selected' : ''}>Chuyển khoản</option>
                            <option value="the_ngan_hang" ${item.phuong_thuc_tt === 'the_ngan_hang' ? 'selected' : ''}>Thẻ ngân hàng</option>
                          </select>
                        </div>
                        <div class="flex gap-1 pt-1">
                          <button type="button" class="btn-save-edit-pkg flex-1 py-1 bg-emerald-600 text-white rounded font-bold transition">Lưu</button>
                          <button type="button" class="btn-cancel-edit-pkg flex-1 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold transition">Hủy</button>
                        </div>
                      </div>
                    </div>
                  `).join('')}

                  ${activeTutors.map(item => `
                    <div class="border border-purple-500/20 rounded-2xl p-4 bg-gradient-to-br from-purple-500/5 to-transparent flex flex-col justify-between gap-3 active-pkg-card" data-id="${item.id}" data-type="hoc_kem" data-original-tu-ngay="${new Date(item.tu_ngay).toLocaleDateString('sv-SE')}">
                      <div class="pkg-view-mode">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-purple-600"></span>
                            <span class="font-extrabold text-xs text-[#1a1c1d]">${item.ten_goi || 'Gói kèm 1-1'}</span>
                          </div>
                          <button type="button" class="btn-edit-active-pkg text-purple-600 hover:underline font-semibold text-[10px]">Sửa/Đổi gói</button>
                        </div>
                        <div class="text-[10px] text-slate-500 mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5">
                           <p>GV: <strong>${item.ten_giao_vien || 'Chưa xếp'}</strong></p>
                           <p>Tiến trình: <strong>${item.so_buoi_da_hoc}</strong> / <strong>${item.so_buoi_dang_ky}</strong> buổi</p>
                           <p>Ngày bắt đầu: <strong>${new Date(item.tu_ngay).toLocaleDateString('vi-VN')}</strong></p>
                           <p>Giá thực tế: <strong>${Number(item.gia_thuc_te || 0).toLocaleString('vi-VN')} VNĐ</strong></p>
                           <p>Thực thu: <strong>${Number(item.so_tien_da_thu || 0).toLocaleString('vi-VN')} VNĐ</strong></p>
                           <p>Thanh toán: <strong>${item.phuong_thuc_tt === 'tien_mat' ? 'Tiền mặt' : item.phuong_thuc_tt === 'chuyen_khoan' ? 'Chuyển khoản' : item.phuong_thuc_tt === 'the_ngan_hang' ? 'Thẻ ngân hàng' : (item.phuong_thuc_tt || 'Tiền mặt')}</strong></p>
                        </div>
                        <button type="button" class="btn-cancel-active-package w-full mt-3 bg-red-50 hover:bg-red-100 text-red-600 py-1.5 rounded-xl font-bold transition active:scale-95 text-[10.5px]" data-id="${item.id}" data-price="${item.so_tien_da_thu || 0}" data-type="hoc_kem">
                          Hủy gói / Hoàn tiền
                        </button>
                      </div>

                      <!-- Edit/Change package mode -->
                      <div class="pkg-edit-mode hidden space-y-2 text-[10.5px]">
                        <div class="font-bold text-[#1a1c1d] mb-1">Chỉnh sửa hợp đồng học kèm</div>
                        <div>
                          <label class="block text-[9px] font-bold text-slate-400 mb-0.5">CHỌN GÓI HỌC (ĐỔI GÓI)</label>
                          <select class="edit-pkg-select w-full border border-[#e2e2e4] rounded-lg p-1 text-[11px] bg-white">
                            ${tutoringPkgs.map(p => `<option value="${p.id}" ${p.id === item.goi_hoc_kem_id ? 'selected' : ''} data-price="${p.gia}">${p.ten_goi}</option>`).join('')}
                          </select>
                        </div>
                        <div class="grid grid-cols-2 gap-1.5">
                          <div>
                            <label class="block text-[9px] font-bold text-slate-400 mb-0.5">SỐ BUỔI ĐK</label>
                            <input type="number" readonly class="edit-so-buoi w-full border border-[#e2e2e4] rounded-lg p-1 text-[11px] bg-slate-100 cursor-not-allowed" value="${item.so_buoi_dang_ky}">
                          </div>
                          <div>
                            <label class="block text-[9px] font-bold text-slate-400 mb-0.5">SỐ BUỔI ĐÃ HỌC</label>
                            <input type="number" class="edit-so-buoi-da-hoc w-full border border-[#e2e2e4] rounded-lg p-1 text-[11px]" value="${item.so_buoi_da_hoc}">
                          </div>
                        </div>
                        <div>
                          <label class="block text-[9px] font-bold text-slate-400 mb-0.5">NGÀY BẮT ĐẦU</label>
                          <input type="date" class="edit-tu-ngay w-full border border-[#e2e2e4] rounded-lg p-1 text-[11px]" min="${new Date().toLocaleDateString('sv-SE')}" value="${new Date(item.tu_ngay).toLocaleDateString('sv-SE')}">
                        </div>
                        <div class="grid grid-cols-2 gap-1.5">
                          <div>
                            <label class="block text-[9px] font-bold text-slate-400 mb-0.5">GIÁ THỰC TẾ (VNĐ)</label>
                            <input type="text" class="edit-gia-thuc-te w-full border border-[#e2e2e4] rounded-lg p-1 text-[11px]" value="${formatCurrencyInput(String(item.gia_thuc_te || 0))}">
                          </div>
                          <div>
                            <label class="block text-[9px] font-bold text-slate-400 mb-0.5">ĐÃ THU (VNĐ)</label>
                            <input type="text" class="edit-da-thu w-full border border-[#e2e2e4] rounded-lg p-1 text-[11px]" value="${formatCurrencyInput(String(item.so_tien_da_thu || 0))}">
                          </div>
                        </div>
                        <div>
                          <label class="block text-[9px] font-bold text-slate-400 mb-0.5">PHƯƠNG THỨC TT</label>
                          <select class="edit-phuong-thuc w-full border border-[#e2e2e4] rounded-lg p-1 text-[11px] bg-white">
                            <option value="tien_mat" ${item.phuong_thuc_tt === 'tien_mat' ? 'selected' : ''}>Tiền mặt</option>
                            <option value="chuyen_khoan" ${item.phuong_thuc_tt === 'chuyen_khoan' ? 'selected' : ''}>Chuyển khoản</option>
                            <option value="the_ngan_hang" ${item.phuong_thuc_tt === 'the_ngan_hang' ? 'selected' : ''}>Thẻ ngân hàng</option>
                          </select>
                        </div>
                        <div class="flex gap-1 pt-1">
                          <button type="button" class="btn-save-edit-pkg flex-1 py-1 bg-emerald-600 text-white rounded font-bold transition">Lưu</button>
                          <button type="button" class="btn-cancel-edit-pkg flex-1 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold transition">Hủy</button>
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
                ${activeCourses.length === 0 && activeTutors.length === 0 ? `
                  <div class="border border-dashed border-[#e2e2e4] rounded-2xl p-6 text-center bg-slate-50/40">
                    <span class="material-symbols-outlined text-slate-300 text-3xl">inbox_customize</span>
                    <p class="text-slate-400 italic mt-1 text-[11px]">Học viên này hiện chưa đăng ký gói học nào đang hoạt động.</p>
                  </div>
                ` : ''}
              </div>

              <!-- Section: Đăng ký gói học mới -->
              <div class="space-y-3 pt-3 border-t border-[#f3f3f5]">
                <div class="flex items-center justify-between">
                  <h4 class="font-bold text-emerald-600 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[16px]">add_circle</span> Đăng ký gói học mới
                  </h4>
                  <button type="button" id="btn-toggle-register-form" class="text-[10px] text-apple-blue font-semibold hover:underline focus:outline-none">Mở / Đóng form</button>
                </div>
                <div id="register-package-form-wrap" class="hidden space-y-2 bg-emerald-50/60 border border-emerald-100 rounded-xl p-3">
                  
                  <!-- Grid 2 cột cho thông tin gói -->
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Loại gói</label>
                      <select id="reg-pkg-type" class="w-full border border-[#e2e2e4] bg-white rounded-xl px-2 py-1.5 text-xs outline-none focus:border-apple-blue transition cursor-pointer">
                        <option value="khoa_hoc">Khóa học đại trà</option>
                        <option value="hoc_kem">Gói kèm 1-1</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Chọn gói</label>
                      <select id="reg-pkg-id" class="w-full border border-[#e2e2e4] bg-white rounded-xl px-2 py-1.5 text-xs outline-none focus:border-apple-blue transition cursor-pointer">
                        <option value="">-- Đang tải... --</option>
                      </select>
                    </div>
 
                    <!-- Hàng ngày bắt đầu / ngày kết thúc của khóa học -->
                    <div id="reg-khoa-hoc-fields-start">
                      <label class="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase">Ngày bắt đầu</label>
                      <input type="date" id="reg-tu-ngay" class="w-full border border-[#e2e2e4] bg-white rounded-xl px-2 py-1.5 text-xs outline-none focus:border-apple-blue" value="${new Date().toLocaleDateString('sv-SE')}">
                    </div>
                    <div id="reg-khoa-hoc-fields-end">
                      <label class="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase">Ngày kết thúc</label>
                      <input type="date" id="reg-den-ngay" class="w-full border border-[#e2e2e4] bg-white rounded-xl px-2 py-1.5 text-xs outline-none focus:border-apple-blue">
                    </div>

                    <!-- Hàng số buổi của gói học kèm -->
                    <div id="reg-hoc-kem-fields" class="col-span-2 hidden">
                      <div class="hidden">
                        <select id="reg-teacher-id">
                          <option value="" selected>-- Chọn GV --</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Số buổi đăng ký</label>
                        <input type="number" id="reg-so-buoi" min="1" readonly class="w-full border border-[#e2e2e4] bg-slate-100 rounded-xl px-3 py-2 text-xs outline-none focus:border-apple-blue cursor-not-allowed">
                      </div>
                    </div>
                  </div>

                  <!-- Hàng 3 cột cho Giá thực tế, Đã thu, Phương thức thanh toán -->
                  <div class="grid grid-cols-3 gap-2">
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Giá thực tế (VNĐ)</label>
                      <input type="text" id="reg-gia-thuc-te" placeholder="0" class="w-full border border-[#e2e2e4] bg-white rounded-xl px-2 py-1.5 text-xs outline-none focus:border-apple-blue">
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Đã thu (VNĐ)</label>
                      <input type="text" id="reg-da-thu" placeholder="0" class="w-full border border-[#e2e2e4] bg-white rounded-xl px-2 py-1.5 text-xs outline-none focus:border-apple-blue">
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Phương thức TT</label>
                      <select id="reg-phuong-thuc" class="w-full border border-[#e2e2e4] bg-white rounded-xl px-2 py-1.5 text-xs outline-none focus:border-apple-blue transition cursor-pointer">
                        <option value="tien_mat">Tiền mặt</option>
                        <option value="chuyen_khoan">Chuyển khoản</option>
                        <option value="the_ngan_hang">Thẻ ngân hàng</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Section: Lịch sử mua / hủy gói -->
              <div class="space-y-3 pt-3 border-t border-[#f3f3f5]">
                <h4 class="font-bold text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[16px]">history</span> Lịch sử mua / hủy / đổi gói
                </h4>
                <div class="max-h-[160px] overflow-y-auto space-y-2 pr-1">
                  ${[...historyCourses, ...historyTutors].map(item => `
                    <div class="border border-slate-100 rounded-xl p-3 bg-slate-50/50 flex justify-between items-center hover:bg-slate-50 transition border-l-4 ${item.trang_thai === 'huy' ? 'border-l-red-500' : 'border-l-slate-400'}">
                      <div>
                        <div class="font-bold text-xs text-apple-ink">${item.ten_goi} <span class="text-[10px] font-normal text-slate-400">(${item.loai_goi === 'khoa_hoc' ? 'Đại trà' : 'Kèm 1-1'})</span></div>
                        <div class="text-[9.5px] text-slate-400 mt-1">
                          ${item.trang_thai === 'huy' ? `<span class="text-red-500 font-bold">Hoàn: ${item.so_tien_hoan?.toLocaleString('vi-VN') || 0} VNĐ</span>` : ''}
                        </div>
                        ${item.trang_thai === 'huy' ? `<p class="text-[9.5px] text-slate-500 italic mt-0.5">Lý do: ${item.ly_do_huy || 'Không ghi rõ'}</p>` : ''}
                      </div>
                      <span class="px-2.5 py-1 rounded-full text-[9px] font-extrabold select-none shrink-0 ${item.trang_thai === 'huy' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}">
                        ${item.trang_thai === 'huy' ? 'ĐÃ HỦY' : 'HẾT HẠN'}
                      </span>
                    </div>
                  `).join('')}
                  ${historyCourses.length === 0 && historyTutors.length === 0 ? `
                    <p class="text-slate-400 italic py-2 text-center text-xs">Chưa có lịch sử giao dịch nào.</p>
                  ` : ''}
                </div>
              </div>
            </div>

            <!-- Footer cố định của Tab Gói học -->
            <div class="flex justify-end items-center px-6 py-4 border-t border-[#f3f3f5] bg-slate-50 shrink-0 gap-2">
              <button type="button" id="btn-close-pkg-tab" class="px-5 py-2 rounded-xl border border-[#e2e2e4] hover:bg-slate-100 text-slate-700 font-semibold transition active:scale-95 text-xs">Đóng</button>
              <button type="button" id="btn-submit-register-pkg" class="hidden px-5 py-2 bg-emerald-600 hover:opacity-90 text-white font-bold rounded-xl transition active:scale-95 text-xs shadow-sm flex items-center justify-center gap-1.5">
                <span class="material-symbols-outlined text-[15px]">add_shopping_cart</span>
                Đăng ký gói học này
              </button>
            </div>
          </div>
        </div>
      `;

      // Khởi tạo custom date picker cho inplace edit
      setupCustomDatePicker(
        modal.querySelector('#inplace-dob'),
        modal.querySelector('#inplace-dob-container')
      );

      // JS Tabs Navigation
      const btnTabInfo = modal.querySelector('#btn-tab-info');
      const btnTabPackages = modal.querySelector('#btn-tab-packages');
      const formInfoPanel = modal.querySelector('#student-inplace-edit-form');
      const panelPackages = modal.querySelector('#panel-packages');

      btnTabInfo.addEventListener('click', () => {
        btnTabInfo.className = 'px-4 py-2 font-bold text-xs text-apple-blue border-b-2 border-apple-blue transition focus:outline-none';
        btnTabPackages.className = 'px-4 py-2 font-medium text-xs text-slate-400 hover:text-apple-ink transition focus:outline-none';
        formInfoPanel.classList.remove('hidden');
        panelPackages.classList.add('hidden');
      });

      btnTabPackages.addEventListener('click', () => {
        btnTabPackages.className = 'px-4 py-2 font-bold text-xs text-apple-blue border-b-2 border-apple-blue transition focus:outline-none';
        btnTabInfo.className = 'px-4 py-2 font-medium text-xs text-slate-400 hover:text-apple-ink transition focus:outline-none';
        formInfoPanel.classList.add('hidden');
        panelPackages.classList.remove('hidden');
        panelPackages.classList.add('flex');
      });

      modal.querySelector('#close-student-detail-modal').addEventListener('click', () => modal.classList.add('hidden'));
      modal.querySelector('#btn-cancel-inplace-edit').addEventListener('click', () => modal.classList.add('hidden'));
      modal.querySelector('#btn-close-pkg-tab').addEventListener('click', () => modal.classList.add('hidden'));

      // Sửa/Đổi gói đang hoạt động - Chuyển đổi Mode Edit/View ngay trên Card
      modal.querySelectorAll('.active-pkg-card').forEach(card => {
        const id = card.getAttribute('data-id');
        const type = card.getAttribute('data-type');
        const viewMode = card.querySelector('.pkg-view-mode');
        const editMode = card.querySelector('.pkg-edit-mode');

        card.querySelector('.btn-edit-active-pkg')?.addEventListener('click', () => {
          viewMode.classList.add('hidden');
          editMode.classList.remove('hidden');
        });

        card.querySelector('.btn-cancel-edit-pkg')?.addEventListener('click', () => {
          editMode.classList.add('hidden');
          viewMode.classList.remove('hidden');
        });

        // Tự động nhảy ngày/giá khi đổi gói học của gói hoạt động hiện tại
        const editPkgSelect = card.querySelector('.edit-pkg-select');
        const editGiaInput = card.querySelector('.edit-gia-thuc-te');
        const editDaThuInput = card.querySelector('.edit-da-thu');
        const editTuNgayInput = card.querySelector('.edit-tu-ngay');
        const editDenNgayInput = card.querySelector('.edit-den-ngay');

        if (editPkgSelect) {
          editPkgSelect.addEventListener('change', () => {
            const opt = editPkgSelect.options[editPkgSelect.selectedIndex];
            const price = parseFloat(opt.getAttribute('data-price')) || 0;
            const months = parseInt(opt.getAttribute('data-months')) || 0;

            if (editGiaInput) editGiaInput.value = formatCurrencyInput(String(price));
            if (editDaThuInput) editDaThuInput.value = formatCurrencyInput(String(price));

            if (type === 'khoa_hoc' && editTuNgayInput && editDenNgayInput && months > 0) {
              const start = new Date(editTuNgayInput.value);
              const end = new Date(start);
              end.setMonth(start.getMonth() + months);
              editDenNgayInput.value = end.toLocaleDateString('sv-SE');
            }
          });
        }

        if (editGiaInput) {
          editGiaInput.addEventListener('input', (e) => {
            e.target.value = formatCurrencyInput(e.target.value);
          });
        }
        if (editDaThuInput) {
          editDaThuInput.addEventListener('input', (e) => {
            e.target.value = formatCurrencyInput(e.target.value);
          });
        }

        if (editTuNgayInput && editDenNgayInput && editPkgSelect) {
          editTuNgayInput.addEventListener('change', () => {
            const opt = editPkgSelect.options[editPkgSelect.selectedIndex];
            const months = parseInt(opt.getAttribute('data-months')) || 0;
            if (months > 0) {
              const start = new Date(editTuNgayInput.value);
              const end = new Date(start);
              end.setMonth(start.getMonth() + months);
              editDenNgayInput.value = end.toLocaleDateString('sv-SE');
            }
          });
        }

        // Lưu sửa đổi gói hoạt động
        card.querySelector('.btn-save-edit-pkg')?.addEventListener('click', async () => {
          let payload = {};
          let endpoint = '';
          const tuNgayVal = card.querySelector('.edit-tu-ngay').value;
          const originalTuNgay = card.getAttribute('data-original-tu-ngay');
          const todayStr = new Date().toLocaleDateString('sv-SE');

          if (tuNgayVal !== originalTuNgay && tuNgayVal < todayStr) {
            showToast('Ngày bắt đầu mới không được ở quá khứ!', 'error');
            return;
          }

          const giaThucTeVal = parseCurrencyInput(card.querySelector('.edit-gia-thuc-te').value);
          const daThuVal = parseCurrencyInput(card.querySelector('.edit-da-thu').value);

          if (type === 'khoa_hoc') {
            payload = {
              goi_hoc_phi_id: parseInt(card.querySelector('.edit-pkg-select').value),
              tu_ngay: tuNgayVal,
              den_ngay: card.querySelector('.edit-den-ngay').value,
              gia_thuc_te: giaThucTeVal,
              so_tien_da_thu: daThuVal,
              phuong_thuc_tt: card.querySelector('.edit-phuong-thuc').value
            };
            endpoint = `${API_BASE}/registrations/${id}`;
          } else {
            payload = {
              goi_hoc_kem_id: parseInt(card.querySelector('.edit-pkg-select').value),
              so_buoi_dang_ky: parseInt(card.querySelector('.edit-so-buoi').value) || 0,
              so_buoi_da_hoc: parseInt(card.querySelector('.edit-so-buoi-da-hoc').value) || 0,
              tu_ngay: tuNgayVal,
              gia_thuc_te: giaThucTeVal,
              so_tien_da_thu: daThuVal,
              phuong_thuc_tt: card.querySelector('.edit-phuong-thuc').value
            };
            endpoint = `${API_BASE}/registrations/tutoring/${id}`;
          }

          if (payload.so_tien_da_thu < 0 || payload.so_tien_da_thu > payload.gia_thuc_te) {
            showToast('Số tiền đã thu không được âm và không được vượt quá giá thực tế!', 'error');
            return;
          }

          try {
            const putRes = await fetch(endpoint, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'X-User-Role': 'le_tan' },
              body: JSON.stringify(payload)
            });
            const resultJson = await putRes.json();
            if (resultJson.success) {
              showToast('Cập nhật gói học thành công!', 'success');
              const contentDiv = document.getElementById('dashboard-content');
              await renderStudentsList(contentDiv, localStorage.getItem('userRole'));

              if (window.showStudentDetailModal && window.currentStudent) {
                window.showStudentDetailModal(window.currentStudent);
                setTimeout(() => {
                  const tabPkg = document.getElementById('btn-tab-packages');
                  if (tabPkg) tabPkg.click();
                }, 100);
              }
            } else {
              showToast(resultJson.error || 'Có lỗi xảy ra', 'error');
            }
          } catch (err) {
            showToast('Lỗi máy chủ', 'error');
          }
        });
      });

      // Lắng nghe click ảnh đại diện để mở chọn file
      const detailAvatarContainer = modal.querySelector('#detail-avatar-container');
      const detailAvatarFileInput = modal.querySelector('#detail-avatar-file-input');
      const detailAvatarImg = modal.querySelector('#detail-avatar-img');
      const detailAvatarPlaceholder = modal.querySelector('#detail-avatar-placeholder');
      let base64AvatarData = null;

      detailAvatarContainer?.addEventListener('click', () => {
        detailAvatarFileInput?.click();
      });

      detailAvatarFileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            base64AvatarData = reader.result;
            if (detailAvatarImg) {
              detailAvatarImg.src = base64AvatarData;
            } else if (detailAvatarContainer) {
              if (detailAvatarPlaceholder) detailAvatarPlaceholder.remove();
              const newImg = document.createElement('img');
              newImg.id = 'detail-avatar-img';
              newImg.src = base64AvatarData;
              newImg.className = 'w-full h-full object-cover';
              detailAvatarContainer.insertBefore(newImg, detailAvatarContainer.firstChild);
            }
          };
          reader.readAsDataURL(file);
        }
      });

      // Submit cập nhật học viên với validate
      modal.querySelector('#student-inplace-edit-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const phoneVal = modal.querySelector('#inplace-phone').value.trim();
        if (!isValidPhone(phoneVal)) {
          showToast('Số điện thoại phải đúng 10 chữ số, bắt đầu bằng 0', 'error');
          return;
        }

        const dobVal = modal.querySelector('#inplace-dob').value;
        if (dobVal) {
          const birthday = new Date(dobVal);
          const today = new Date();
          birthday.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);
          if (birthday > today) {
            showToast('Ngày sinh không được vượt quá ngày hiện tại', 'error');
            return;
          }
        }

        const emailVal = modal.querySelector('#inplace-email').value.trim();
        if (emailVal && !isValidEmail(emailVal)) {
          showToast('Email không hợp lệ. Phải có định dạng abc@domain.com', 'error');
          return;
        }

        const payload = {
          ho_ten: modal.querySelector('#inplace-fullName').value.trim(),
          ngay_sinh: modal.querySelector('#inplace-dob').value || null,
          gioi_tinh: modal.querySelector('#inplace-gender').value,
          ten_phu_huynh: modal.querySelector('#inplace-parentName').value.trim() || null,
          so_dien_thoai: phoneVal,
          email: emailVal || null,
          trinh_do_dau_vao: modal.querySelector('#inplace-entryLevel').value,
          chi_nhanh: sv.chi_nhanh || 'Trung tam chính',
          avatar_url: base64AvatarData || sv.avatar_url
        };

        try {
          const putRes = await fetch(`${API_BASE}/students/${sv.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-User-Role': 'le_tan'
            },
            body: JSON.stringify(payload)
          });
          const putResult = await putRes.json();
          if (putResult.success) {
            showToast('Cập nhật hồ sơ học viên thành công!', 'success');
            modal.classList.add('hidden');
            const contentDiv = document.getElementById('dashboard-content');
            renderStudentsList(contentDiv, localStorage.getItem('userRole'));
          } else {
            showToast(putResult.error || 'Có lỗi xảy ra', 'error');
          }
        } catch (err) {
          showToast('Lỗi máy chủ khi cập nhật', 'error');
        }
      });

      modal.querySelector('#btn-delete-student-profile').addEventListener('click', async () => {
        if (!confirm(`Bạn có chắc chắn muốn xóa hồ sơ học viên ${sv.ho_ten}?`)) return;
        try {
          const delRes = await fetch(`${API_BASE}/students/${sv.id}`, {
            method: 'DELETE',
            headers: { 'X-User-Role': 'admin' }
          });
          const delResult = await delRes.json();
          if (delResult.success) {
            showToast('Đã xóa học viên thành công!', 'success');
            modal.classList.add('hidden');
            const contentDiv = document.getElementById('dashboard-content');
            renderStudentsList(contentDiv, localStorage.getItem('userRole'));
          } else {
            showToast(delResult.error, 'error');
          }
        } catch (e) {
          showToast('Lỗi kết nối máy chủ', 'error');
        }
      });

      modal.querySelectorAll('.btn-cancel-active-package').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const regId = btn.getAttribute('data-id');
          const price = btn.getAttribute('data-price') || '0';
          const type = btn.getAttribute('data-type') || 'khoa_hoc';
          modal.classList.add('hidden');
          window.openCancelModal && window.openCancelModal(regId, price, type);
        });
      });

      // Toggle form đăng ký gói học
      modal.querySelector('#btn-toggle-register-form')?.addEventListener('click', () => {
        const wrap = modal.querySelector('#register-package-form-wrap');
        const submitBtn = modal.querySelector('#btn-submit-register-pkg');
        wrap.classList.toggle('hidden');
        if (!wrap.classList.contains('hidden')) {
          submitBtn?.classList.remove('hidden');
          loadRegisterFormData();
        } else {
          submitBtn?.classList.add('hidden');
        }
      });

      let allPkgsKH = [], allPkgsKem = [], allTeachers = [];
      async function loadRegisterFormData() {
        try {
          const [pkgRes, kemRes, gvRes] = await Promise.all([
            fetch(`${API_BASE}/course-packages`).then(r => r.json()),
            fetch(`${API_BASE}/tutoring-packages`).then(r => r.json()),
            fetch(`${API_BASE}/teachers`).then(r => r.json())
          ]);
          allPkgsKH = pkgRes.data || [];
          allPkgsKem = kemRes.data || [];
          allTeachers = gvRes.data || [];
          updatePkgOptions();
        } catch { }
      }

      function updatePkgOptions() {
        const type = modal.querySelector('#reg-pkg-type')?.value;
        const pkgSelect = modal.querySelector('#reg-pkg-id');
        const startField = modal.querySelector('#reg-khoa-hoc-fields-start');
        const endField = modal.querySelector('#reg-khoa-hoc-fields-end');
        const hocKemFields = modal.querySelector('#reg-hoc-kem-fields');
        const teacherSel = modal.querySelector('#reg-teacher-id');
        const regSoBuoiInput = modal.querySelector('#reg-so-buoi');
        if (!pkgSelect) return;
        if (type === 'khoa_hoc') {
          pkgSelect.innerHTML = '<option value="">-- Chọn gói học phí --</option>' + allPkgsKH.map(p => `<option value="${p.id}" data-price="${p.gia}" data-months="${p.so_thang}">${p.ten_goi} (${Number(p.gia).toLocaleString('vi-VN')} VNĐ)</option>`).join('');
          startField?.classList.remove('hidden');
          endField?.classList.remove('hidden');
          hocKemFields?.classList.add('hidden');
        } else {
          pkgSelect.innerHTML = '<option value="">-- Chọn gói học kèm --</option>' + allPkgsKem.map(p => `<option value="${p.id}" data-price="${p.gia}" data-sessions="${p.so_buoi}">${p.ten_goi} (${Number(p.gia).toLocaleString('vi-VN')} VNĐ)</option>`).join('');
          startField?.classList.add('hidden');
          endField?.classList.add('hidden');
          hocKemFields?.classList.remove('hidden');
          if (regSoBuoiInput) regSoBuoiInput.value = ''; // Để trống khi chưa chọn gói cụ thể
          if (teacherSel) {
            teacherSel.innerHTML = '<option value="">-- Chọn giáo viên --</option>' + allTeachers.map(t => `<option value="${t.id}">${t.ho_ten}</option>`).join('');
          }
        }
      }

      modal.querySelector('#reg-pkg-type')?.addEventListener('change', () => {
        updatePkgOptions();
        // Reset giá trị giá và đã thu khi đổi loại gói
        const giaInput = modal.querySelector('#reg-gia-thuc-te');
        const daThuInput = modal.querySelector('#reg-da-thu');
        if (giaInput) giaInput.value = '';
        if (daThuInput) daThuInput.value = '';
      });

      // Tự động nhảy Ngày, Giá, Thực thu khi chọn gói học mới
      const pkgSelect = modal.querySelector('#reg-pkg-id');
      const giaInput = modal.querySelector('#reg-gia-thuc-te');
      const daThuInput = modal.querySelector('#reg-da-thu');
      const tuNgayInput = modal.querySelector('#reg-tu-ngay');
      const denNgayInput = modal.querySelector('#reg-den-ngay');

      // Lắng nghe sự kiện gõ phím để format tiền tệ trực quan
      giaInput?.addEventListener('input', (e) => {
        e.target.value = formatCurrencyInput(e.target.value);
      });
      daThuInput?.addEventListener('input', (e) => {
        e.target.value = formatCurrencyInput(e.target.value);
      });

      pkgSelect?.addEventListener('change', () => {
        const type = modal.querySelector('#reg-pkg-type')?.value;
        const opt = pkgSelect.options[pkgSelect.selectedIndex];
        if (!opt || opt.value === '') return;

        const price = parseFloat(opt.getAttribute('data-price')) || 0;
        const months = parseInt(opt.getAttribute('data-months')) || 0;
        const sessions = parseInt(opt.getAttribute('data-sessions')) || 0;

        if (giaInput) giaInput.value = formatCurrencyInput(String(price));
        if (daThuInput) daThuInput.value = formatCurrencyInput(String(price));

        if (type === 'khoa_hoc' && tuNgayInput && denNgayInput && months > 0) {
          const start = new Date(tuNgayInput.value);
          const end = new Date(start);
          end.setMonth(start.getMonth() + months);
          denNgayInput.value = end.toLocaleDateString('sv-SE');
        } else if (type === 'hoc_kem') {
          const regSoBuoiInput = modal.querySelector('#reg-so-buoi');
          if (regSoBuoiInput) regSoBuoiInput.value = sessions;
        }
      });

      tuNgayInput?.addEventListener('change', () => {
        const type = modal.querySelector('#reg-pkg-type')?.value;
        const opt = pkgSelect.options[pkgSelect.selectedIndex];
        if (type === 'khoa_hoc' && opt && opt.value !== '') {
          const months = parseInt(opt.getAttribute('data-months')) || 0;
          if (months > 0 && denNgayInput) {
            const start = new Date(tuNgayInput.value);
            const end = new Date(start);
            end.setMonth(start.getMonth() + months);
            denNgayInput.value = end.toLocaleDateString('sv-SE');
          }
        }
      });

      // Hàm kích hoạt thanh toán PayOS và hiện QR
      async function triggerPayOSPayment() {
        const pkgId = modal.querySelector('#reg-pkg-id')?.value;
        if (!pkgId) {
          showToast('Vui lòng chọn Gói học trước khi chọn thanh toán chuyển khoản!', 'error');
          modal.querySelector('#reg-phuong-thuc').value = 'tien_mat';
          return;
        }

        const type = modal.querySelector('#reg-pkg-type')?.value;
        const isTutoring = type === 'hoc_kem';
        const tuNgayVal = modal.querySelector('#reg-tu-ngay')?.value || new Date().toISOString().split('T')[0];
        const denNgayVal = modal.querySelector('#reg-den-ngay')?.value;

        if (!isTutoring && !denNgayVal) {
          showToast('Vui lòng chọn ngày bắt đầu và kết thúc trước khi thanh toán!', 'error');
          modal.querySelector('#reg-phuong-thuc').value = 'tien_mat';
          return;
        }

        let createPayload = {
          ho_so_id: sv.id,
          tu_ngay: tuNgayVal,
          den_ngay: isTutoring ? null : denNgayVal,
          chi_nhanh_mua: sv.chi_nhanh || 'Trung tâm chính',
          returnUrl: window.location.href,
          cancelUrl: window.location.href
        };

        if (isTutoring) {
          createPayload.goi_hoc_kem_id = parseInt(pkgId);
          createPayload.giao_vien_id = null;
        } else {
          createPayload.goi_hoc_phi_id = parseInt(pkgId);
        }

        try {
          showToast('Đang khởi tạo mã QR thanh toán PayOS...');
          const payLinkRes = await fetch(`${API_BASE}/payment/create-payment-link`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(createPayload)
          });
          const payLinkData = await payLinkRes.json();
          if (!payLinkData.success) {
            showToast(payLinkData.error || 'Lỗi khởi tạo thanh toán', 'error');
            modal.querySelector('#reg-phuong-thuc').value = 'tien_mat';
            return;
          }

          const { checkoutUrl, orderCode, amount, qrCode } = payLinkData.data;

          // Hiển thị modal QR
          let qrModal = document.getElementById('payos-qr-modal');
          if (!qrModal) {
            qrModal = document.createElement('div');
            qrModal.id = 'payos-qr-modal';
            qrModal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center transition-all duration-300 opacity-0 pointer-events-none';
            document.body.appendChild(qrModal);
          }

          qrModal.innerHTML = `
            <div class="bg-white rounded-2xl p-6 w-[320px] shadow-2xl border border-apple-divider/40 text-center transform scale-95 transition-all duration-300 flex flex-col items-center justify-center space-y-4">
              <h4 class="font-bold text-apple-ink text-sm">QUÉT MÃ QR THANH TOÁN</h4>
              <p class="text-[10px] text-slate-500">Sử dụng ứng dụng Ngân hàng hoặc Ví điện tử để quét mã</p>
              
              <div class="relative w-48 h-48 bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden border border-slate-100 shadow-inner">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode || checkoutUrl)}" alt="QR PayOS" class="w-full h-full object-contain">
                <div class="absolute inset-0 bg-apple-blue/5 animate-pulse pointer-events-none"></div>
              </div>

              <div class="w-full bg-slate-50 rounded-xl p-3 text-left space-y-1 text-[11px] border border-slate-100">
                <div class="flex justify-between"><span class="text-slate-500">Số tiền:</span><span class="font-bold text-rose-500">${amount.toLocaleString('vi-VN')} đ</span></div>
                <div class="flex justify-between"><span class="text-slate-500">Nội dung:</span><span class="font-bold text-apple-ink">DK ${pkgSelect.options[pkgSelect.selectedIndex].text.split('(')[0].trim()}</span></div>
              </div>

              <div class="flex items-center gap-1.5 justify-center text-[10px] text-apple-blue font-semibold animate-pulse">
                <span class="inline-block w-1.5 h-1.5 bg-apple-blue rounded-full"></span>
                <span>Đang chờ bạn quét mã thanh toán...</span>
              </div>

              <div class="w-full flex flex-col gap-2 pt-2">
                <a href="${checkoutUrl}" target="_blank" class="w-full py-2 bg-apple-blue hover:opacity-90 text-white font-bold rounded-xl text-xs transition active:scale-95 shadow-sm block text-center">Thanh toán trực tiếp</a>
                <button id="btn-cancel-payos" class="w-full py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs transition active:scale-95">Hủy bỏ giao dịch</button>
              </div>
            </div>
          `;

          setTimeout(() => {
            qrModal.classList.remove('pointer-events-none');
            qrModal.classList.add('opacity-100');
            qrModal.querySelector('div').classList.remove('scale-95');
            qrModal.querySelector('div').classList.add('scale-100');
          }, 50);

          // Hàm hiển thị biên lai thành công chuyên nghiệp
          function showSuccessReceipt(data) {
            let receiptModal = document.getElementById('payment-success-modal');
            if (!receiptModal) {
              receiptModal = document.createElement('div');
              receiptModal.id = 'payment-success-modal';
              receiptModal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center transition-all duration-300 opacity-0 pointer-events-none';
              document.body.appendChild(receiptModal);
            }

            receiptModal.innerHTML = `
              <div class="bg-white rounded-2xl p-6 w-[340px] shadow-2xl border border-apple-divider/40 text-center transform scale-95 transition-all duration-300 flex flex-col items-center justify-center space-y-4">
                <div class="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 animate-bounce">
                  <span class="material-symbols-outlined text-3xl font-bold">check_circle</span>
                </div>
                
                <div class="space-y-1">
                  <h4 class="font-extrabold text-apple-ink text-sm">THANH TOÁN THÀNH CÔNG</h4>
                  <p class="text-[10px] text-emerald-600 font-semibold">Giao dịch đã được ghi nhận hệ thống</p>
                </div>

                <div class="w-full bg-slate-50 rounded-xl p-3 text-left space-y-1.5 text-[11px] border border-slate-100">
                  <div class="flex justify-between border-b border-slate-100 pb-1"><span class="text-slate-500">Mã giao dịch:</span><span class="font-bold text-apple-ink">#${data.orderCode}</span></div>
                  <div class="flex justify-between border-b border-slate-100 pb-1"><span class="text-slate-500">Học viên:</span><span class="font-bold text-apple-ink">${data.studentName}</span></div>
                  <div class="flex justify-between border-b border-slate-100 pb-1"><span class="text-slate-500">Gói đăng ký:</span><span class="font-bold text-apple-ink">${data.packageName}</span></div>
                  <div class="flex justify-between border-b border-slate-100 pb-1"><span class="text-slate-500">Số tiền:</span><span class="font-extrabold text-rose-500">${Number(data.amount).toLocaleString('vi-VN')} đ</span></div>
                  <div class="flex justify-between border-b border-slate-100 pb-1"><span class="text-slate-500">Phương thức:</span><span class="font-bold text-apple-blue">Chuyển khoản (PayOS)</span></div>
                  <div class="flex justify-between"><span class="text-slate-500">Thời gian:</span><span class="font-medium text-slate-500">${new Date().toLocaleString('vi-VN')}</span></div>
                </div>

                <div class="w-full flex flex-col gap-2 pt-2">
                  <button id="btn-success-close" class="w-full py-2 bg-apple-blue hover:opacity-90 text-white font-bold rounded-xl text-xs transition active:scale-95 shadow-sm">Đóng & Tiếp tục</button>
                </div>
              </div>
            `;

            setTimeout(() => {
              receiptModal.classList.remove('pointer-events-none');
              receiptModal.classList.add('opacity-100');
              receiptModal.querySelector('div').classList.remove('scale-95');
              receiptModal.querySelector('div').classList.add('scale-100');
            }, 50);

            function hideSuccessModal() {
              receiptModal.classList.add('pointer-events-none');
              receiptModal.classList.remove('opacity-100');
              receiptModal.querySelector('div').classList.remove('scale-100');
              receiptModal.querySelector('div').classList.add('scale-95');
            }

            document.getElementById('btn-success-close')?.addEventListener('click', async () => {
              hideSuccessModal();
              // Tải lại danh sách ngầm
              const contentDiv = document.getElementById('dashboard-content');
              await renderStudentsList(contentDiv, localStorage.getItem('userRole'));

              // Mở lại modal chi tiết và nhảy vào Tab Gói học & Đăng ký
              if (window.showStudentDetailModal && window.currentStudent) {
                await window.showStudentDetailModal(window.currentStudent);
                setTimeout(() => {
                  const tabPkg = document.getElementById('btn-tab-packages');
                  if (tabPkg) tabPkg.click();
                }, 100);
              }
            });
          }

          // Start polling
          let pollInterval = setInterval(async () => {
            try {
              const statusRes = await fetch(`${API_BASE}/payment/check-status/${orderCode}`);
              const statusData = await statusRes.json();
              if (statusData.success && statusData.paid) {
                clearInterval(pollInterval);
                hideQrModal();
                showToast('Thanh toán qua PayOS thành công!');

                showSuccessReceipt({
                  orderCode: orderCode,
                  studentName: sv.ho_ten,
                  packageName: pkgSelect.options[pkgSelect.selectedIndex].text.split('(')[0].trim(),
                  amount: amount
                });
              }
            } catch (err) {
              console.error(err);
            }
          }, 2000);

          function hideQrModal() {
            clearInterval(pollInterval);
            qrModal.classList.add('pointer-events-none');
            qrModal.classList.remove('opacity-100');
            qrModal.querySelector('div').classList.remove('scale-100');
            qrModal.querySelector('div').classList.add('scale-95');
          }

          document.getElementById('btn-cancel-payos')?.addEventListener('click', () => {
            hideQrModal();
            modal.querySelector('#reg-phuong-thuc').value = 'tien_mat';
            showToast('Đã hủy thanh toán qua PayOS.', 'warning');
          });

        } catch (err) {
          showToast('Không thể kết nối máy chủ thanh toán', 'error');
          modal.querySelector('#reg-phuong-thuc').value = 'tien_mat';
        }
      }

      modal.querySelector('#reg-phuong-thuc')?.addEventListener('change', (e) => {
        if (e.target.value === 'chuyen_khoan') {
          triggerPayOSPayment();
        }
      });

      // Submit đăng ký gói học
      modal.querySelector('#btn-submit-register-pkg')?.addEventListener('click', async () => {
        const type = modal.querySelector('#reg-pkg-type')?.value;
        const pkgId = modal.querySelector('#reg-pkg-id')?.value;
        const giaThucTe = parseCurrencyInput(modal.querySelector('#reg-gia-thuc-te')?.value || '0');
        const daThu = parseCurrencyInput(modal.querySelector('#reg-da-thu')?.value || '0');
        const phuongThuc = modal.querySelector('#reg-phuong-thuc')?.value || 'tien_mat';

        if (!pkgId) { showToast('Vui lòng chọn gói học', 'error'); return; }

        if (phuongThuc === 'chuyen_khoan') {
          // Trực tiếp mở luồng thanh toán QR VietQR nếu chọn chuyển khoản
          triggerPayOSPayment();
          return;
        }

        let payload, endpoint;
        if (type === 'khoa_hoc') {
          const tuNgay = modal.querySelector('#reg-tu-ngay')?.value;
          const denNgay = modal.querySelector('#reg-den-ngay')?.value;
          if (!tuNgay || !denNgay) { showToast('Vui lòng chọn ngày bắt đầu và kết thúc', 'error'); return; }
          payload = { ho_so_id: sv.id, goi_hoc_phi_id: parseInt(pkgId), tu_ngay: tuNgay, den_ngay: denNgay, gia_thuc_te: giaThucTe, so_tien_da_thu: daThu, phuong_thuc_tt: phuongThuc, chi_nhanh_mua: sv.chi_nhanh || 'Trung tam chính' };
          endpoint = `${API_BASE}/registrations`;
        } else {
          const soBuoi = parseInt(modal.querySelector('#reg-so-buoi')?.value) || 10;
          const tuNgay = modal.querySelector('#reg-tu-ngay')?.value || new Date().toISOString().split('T')[0];
          payload = { hoc_vien_id: sv.id, giao_vien_id: null, goi_hoc_kem_id: parseInt(pkgId), tu_ngay: tuNgay, den_ngay: null, gia_thuc_te: giaThucTe, so_tien_da_thu: daThu, phuong_thuc_tt: phuongThuc, so_buoi_dang_ky: soBuoi };
          endpoint = `${API_BASE}/registrations/tutoring`;
        }

        try {
          const regRes = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-User-Role': 'le_tan' },
            body: JSON.stringify(payload)
          });
          const regResult = await regRes.json();
          if (regResult.success) {
            showToast('Đăng ký gói học thành công!', 'success');
            // Tải lại danh sách ngầm
            const contentDiv = document.getElementById('dashboard-content');
            await renderStudentsList(contentDiv, localStorage.getItem('userRole'));

            // Mở lại modal chi tiết và nhảy vào Tab Gói học & Đăng ký
            if (window.showStudentDetailModal && window.currentStudent) {
              await window.showStudentDetailModal(window.currentStudent);
              // Kích hoạt tab Gói học ngay lập tức
              setTimeout(() => {
                const tabPkg = document.getElementById('btn-tab-packages');
                if (tabPkg) tabPkg.click();
              }, 100);
            }
          } else {
            showToast(regResult.error || 'Có lỗi xảy ra', 'error');
          }
        } catch (err) {
          showToast('Lỗi kết nối máy chủ', 'error');
        }
      });

    })
    .catch((err) => {
      console.error('Lỗi khi tải thông tin gói học viên:', err);
      showToast('Không thể tải thông tin gói học viên: ' + err.message, 'error');
    });
}

