// StudentsList.js - Hồ sơ Học viên với Bộ lọc, Modal Thêm mới Tiếp nhận
import { API_BASE, showToast, setupSwipePagination } from './_shared.js';

export async function renderStudentsList(container, role) {
  container.innerHTML = `
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-apple-blue"></div>
    </div>
  `;

  try {
    const res = await fetch(`${API_BASE}/students`);
    const result = await res.json();
    const allStudents = result.data || [];

    const statusBadges = {
      con_han: `<div class="flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-[#10b981]"></div><span class="font-semibold text-slate-800">Đang hoạt động</span></div>`,
      sap_het_han: `<div class="flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse"></div><span class="font-semibold text-slate-800">Sắp hết hạn</span></div>`,
      het_han: `<div class="flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-red-600"></div><span class="font-semibold text-red-600">Đã hết hạn</span></div>`,
      chua_dang_ky: `<div class="flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-slate-400"></div><span class="font-semibold text-slate-500">Chưa mua gói</span></div>`
    };

    function renderTableRows(pageStudents) {
      if (pageStudents.length === 0) {
        return `<tr><td colspan="6" class="px-6 py-6 text-center text-slate-500 text-xs">Không tìm thấy học viên nào phù hợp.</td></tr>`;
      }
      return pageStudents.map(sv => `
        <tr class="hover:bg-slate-50 border-b border-apple-divider/40 text-xs transition group cursor-pointer" data-id="${sv.id}">
          <td class="sticky left-0 bg-white group-hover:bg-slate-50 transition-colors z-10 px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full overflow-hidden shadow-sm bg-apple-parchment flex items-center justify-center font-bold text-apple-blue select-none">
                ${sv.ho_ten.charAt(0)}
              </div>
              <div>
                <div class="font-bold text-apple-ink text-sm">${sv.ho_ten}</div>
                <div class="text-[10px] text-slate-400 mt-0.5">ID: ${sv.ma_ho_so}</div>
              </div>
            </div>
          </td>
          <td class="px-6 py-4">
            <span class="inline-flex items-center px-2.5 py-1 rounded-full bg-[#f3f3f5] text-apple-ink font-bold text-[10px] border border-[#e2e2e4]">
              ${sv.trinh_do_dau_vao || 'Cơ bản A1'}
            </span>
          </td>
          <td class="px-6 py-4">
            <div class="text-apple-ink font-medium">${sv.so_dien_thoai || '—'}</div>
            <div class="text-[10px] text-slate-400 mt-0.5">${sv.ten_phu_huynh || 'Chưa cập nhật'}</div>
          </td>
          <td class="px-6 py-4">${statusBadges[sv.trang_thai_mau] || statusBadges['chua_dang_ky']}</td>
          <td class="px-6 py-4 text-slate-500 font-medium">Chi nhánh: ${sv.chi_nhanh || 'Trung tâm'}</td>
          <td class="sticky right-0 bg-white group-hover:bg-slate-50 transition-colors z-10 px-6 py-4 text-right">
            <button class="btn-cancel-reg px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-full transition text-[11px] font-semibold active:scale-95" data-id="${sv.id}">
              Hủy khóa
            </button>
          </td>
        </tr>
      `).join('');
    }

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="inline-flex bg-[#f3f3f5] p-1 rounded-lg border border-[#e2e2e4] select-none">
            <button class="px-5 py-1.5 rounded-md bg-white shadow-sm border border-apple-divider/20 text-xs font-semibold text-apple-ink transition active:scale-95">
              Học viên
            </button>
            <button id="switch-to-teachers" class="px-5 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-apple-ink transition active:scale-95">
              Giáo viên
            </button>
          </div>
        </div>

        <!-- Filter & Search Bar -->
        <div class="bg-white p-4 rounded-2xl flex flex-col lg:flex-row gap-3 justify-between items-center border border-[#e2e2e4] shadow-sm">
          <div class="flex flex-col sm:flex-row w-full lg:w-auto gap-3 items-center">
            <!-- Tìm kiếm -->
            <div class="relative w-full sm:w-64 text-xs">
              <input id="search-students-input" class="w-full pl-8 pr-4 py-2 bg-[#f3f3f5] border border-[#e2e2e4] rounded-full outline-none focus:border-apple-blue focus:bg-white transition" placeholder="Tìm tên, mã số, hoặc SĐT..." type="text"/>
              <span class="material-symbols-outlined absolute left-2.5 top-2.5 text-slate-400 text-[16px]">search</span>
            </div>
            <!-- Bộ lọc Trình độ -->
            <select id="filter-level" class="w-full sm:w-40 border border-[#e2e2e4] bg-[#f3f3f5] rounded-full px-4 py-1.5 outline-none focus:border-apple-blue text-xs font-medium transition cursor-pointer">
              <option value="">Tất cả trình độ</option>
              <option value="Cơ bản A1">A1 Beginner</option>
              <option value="Trung cấp B1">B1 Intermediate</option>
              <option value="Cao cấp C1">C1 Advanced</option>
            </select>
            <!-- Bộ lọc Chi nhánh -->
            <select id="filter-branch" class="w-full sm:w-44 border border-[#e2e2e4] bg-[#f3f3f5] rounded-full px-4 py-1.5 outline-none focus:border-apple-blue text-xs font-medium transition cursor-pointer">
              <option value="">Tất cả chi nhánh</option>
              <option value="Trung tam chính">Trung tâm chính</option>
              <option value="Downtown Campus">Downtown Campus</option>
            </select>
            <!-- Bộ lọc Trạng thái -->
            <select id="filter-status" class="w-full sm:w-40 border border-[#e2e2e4] bg-[#f3f3f5] rounded-full px-4 py-1.5 outline-none focus:border-apple-blue text-xs font-medium transition cursor-pointer">
              <option value="">Tất cả trạng thái</option>
              <option value="con_han">Đang hoạt động</option>
              <option value="sap_het_han">Sắp hết hạn</option>
              <option value="het_han">Đã hết hạn</option>
              <option value="chua_dang_ky">Chưa mua gói</option>
            </select>
          </div>
          <div class="flex items-center justify-end w-full lg:w-auto mt-2 lg:mt-0">
            <button id="btn-add-student-modal" class="flex items-center gap-1.5 px-5 py-2 rounded-full bg-apple-blue text-white text-xs font-semibold hover:opacity-90 transition active:scale-95 shadow-sm">
              <span class="material-symbols-outlined text-[16px]">add</span>
              Thêm hồ sơ mới
            </button>
          </div>
        </div>

        <!-- Table Container -->
        <div class="bg-white rounded-2xl border border-[#e2e2e4] overflow-hidden flex flex-col shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr class="bg-[#f3f3f5] border-b border-[#e2e2e4] text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th class="px-6 py-4">HỌC VIÊN</th>
                  <th class="px-6 py-4">TRÌNH ĐỘ</th>
                  <th class="px-6 py-4">LIÊN HỆ PHỤ HUYNH</th>
                  <th class="px-6 py-4">TRẠNG THÁI</th>
                  <th class="px-6 py-4">CHI NHÁNH</th>
                  <th class="px-6 py-4 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody id="students-table-body">
                <!-- Sẽ chèn bằng setupSwipePagination -->
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- MODAL TIẾP NHẬN HỌC VIÊN MỚI (Ẩn mặc định) -->
      <div id="add-student-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4">
        <div class="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 border border-[#e2e2e4] shadow-xl max-h-[90vh] overflow-y-auto">
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
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block font-semibold text-slate-600 mb-1.5">Họ và tên học viên <span class="text-rose-500 font-bold">*</span></label>
                <input type="text" id="modal-add-fullName" placeholder="Nhập họ tên đầy đủ..." class="w-full border border-[#e2e2e4] rounded-xl px-4 py-2.5 outline-none focus:border-apple-blue transition bg-apple-pearl text-xs">
              </div>
              <div>
                <label class="block font-semibold text-slate-600 mb-1.5">Ngày sinh <span class="text-rose-500 font-bold">*</span></label>
                <input type="date" id="modal-add-dob" class="w-full border border-[#e2e2e4] rounded-xl px-4 py-2.5 outline-none focus:border-apple-blue transition bg-apple-pearl text-xs">
              </div>
              <div>
                <label class="block font-semibold text-slate-600 mb-1.5">Giới tính <span class="text-rose-500 font-bold">*</span></label>
                <select id="modal-add-gender" class="w-full border border-[#e2e2e4] bg-[#f3f3f5] rounded-xl px-4 py-2.5 outline-none focus:border-apple-blue transition text-xs cursor-pointer">
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <div class="md:col-span-2">
                <label class="block font-semibold text-slate-600 mb-1.5">Họ tên phụ huynh <span class="text-rose-500 font-bold">*</span></label>
                <input type="text" id="modal-add-parentName" placeholder="Tên cha mẹ hoặc người giám hộ..." class="w-full border border-[#e2e2e4] rounded-xl px-4 py-2.5 outline-none focus:border-apple-blue transition bg-apple-pearl text-xs">
              </div>
              <div>
                <label class="block font-semibold text-slate-600 mb-1.5">Số điện thoại liên hệ <span class="text-rose-500 font-bold">*</span></label>
                <input type="tel" id="modal-add-phone" placeholder="09xxxxxxx" class="w-full border border-[#e2e2e4] rounded-xl px-4 py-2.5 outline-none focus:border-apple-blue transition bg-apple-pearl text-xs">
              </div>
              <div>
                <label class="block font-semibold text-slate-600 mb-1.5">Địa chỉ Email <span class="text-rose-500 font-bold">*</span></label>
                <input type="email" id="modal-add-email" placeholder="parent@example.com" class="w-full border border-[#e2e2e4] rounded-xl px-4 py-2.5 outline-none focus:border-apple-blue transition bg-apple-pearl text-xs">
              </div>
              <div>
                <label class="block font-semibold text-slate-600 mb-1.5">Trình độ đầu vào <span class="text-rose-500 font-bold">*</span></label>
                <select id="modal-add-entryLevel" class="w-full border border-[#e2e2e4] bg-[#f3f3f5] rounded-xl px-4 py-2.5 outline-none focus:border-apple-blue transition text-xs cursor-pointer">
                  <option value="Cơ bản A1">A1 Beginner</option>
                  <option value="Trung cấp B1">B1 Intermediate</option>
                  <option value="Cao cấp C1">C1 Advanced</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold text-slate-600 mb-1.5">Chi nhánh tiếp nhận <span class="text-rose-500 font-bold">*</span></label>
                <select id="modal-add-branch" class="w-full border border-[#e2e2e4] bg-[#f3f3f5] rounded-xl px-4 py-2.5 outline-none focus:border-apple-blue transition text-xs cursor-pointer">
                  <option value="Trung tam chính">Trung tâm chính</option>
                  <option value="Downtown Campus">Downtown Campus</option>
                </select>
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
    const filterBranch = document.getElementById('filter-branch');
    const filterStatus = document.getElementById('filter-status');

    function updateTableWithPagination(filteredList) {
      setupSwipePagination(filteredList, tableBody, (pageData) => {
        tableBody.innerHTML = renderTableRows(pageData);
        attachRowEvents(pageData);
      }, 10);
    }

    // Sự kiện lọc
    function applyFilters() {
      const q = searchInput.value.toLowerCase();
      const level = filterLevel.value;
      const branch = filterBranch.value;
      const status = filterStatus.value;

      const filtered = allStudents.filter(sv => {
        const matchesSearch = sv.ho_ten.toLowerCase().includes(q) ||
          sv.ma_ho_so.toLowerCase().includes(q) ||
          (sv.so_dien_thoai && sv.so_dien_thoai.includes(q));
        const matchesLevel = level === "" || sv.trinh_do_dau_vao === level;
        const matchesBranch = branch === "" || sv.chi_nhanh === branch;
        const matchesStatus = status === "" || sv.trang_thai_mau === status;

        return matchesSearch && matchesLevel && matchesBranch && matchesStatus;
      });

      updateTableWithPagination(filtered);
    }

    searchInput.addEventListener('input', applyFilters);
    filterLevel.addEventListener('change', applyFilters);
    filterBranch.addEventListener('change', applyFilters);
    filterStatus.addEventListener('change', applyFilters);

    // Xử lý sự kiện click trên row table
    function attachRowEvents(currentList) {
      tableBody.querySelectorAll('tr').forEach(row => {
        row.addEventListener('click', (e) => {
          if (e.target.closest('.btn-cancel-reg')) {
            const studentId = e.target.closest('.btn-cancel-reg').getAttribute('data-id');
            window.openCancelModal && window.openCancelModal(studentId);
            return;
          }
          const id = row.getAttribute('data-id');
          const sv = currentList.find(item => item.id == id);
          if (sv) showStudentDetailModal(sv);
        });
      });
    }

    // Khởi tạo trang phân trang đầu tiên
    updateTableWithPagination(allStudents);

    // Chuyển sang giáo viên
    document.getElementById('switch-to-teachers')?.addEventListener('click', () => {
      window._navigatePage && window._navigatePage('teachers-list');
    });

    // Mở modal thêm hồ sơ
    const addModal = document.getElementById('add-student-modal');
    document.getElementById('btn-add-student-modal')?.addEventListener('click', () => {
      addModal.classList.remove('hidden');
      document.getElementById('add-student-modal-form').reset();
    });

    document.getElementById('btn-close-add-modal')?.addEventListener('click', () => addModal.classList.add('hidden'));
    document.getElementById('btn-cancel-add')?.addEventListener('click', () => addModal.classList.add('hidden'));

    // Gửi form thêm học viên mới với validate JS & highlight
    document.getElementById('add-student-modal-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const fields = [
        { id: 'modal-add-fullName', label: 'Họ và tên học viên' },
        { id: 'modal-add-dob', label: 'Ngày sinh' },
        { id: 'modal-add-gender', label: 'Giới tính' },
        { id: 'modal-add-parentName', label: 'Họ tên phụ huynh' },
        { id: 'modal-add-phone', label: 'Số điện thoại liên hệ' },
        { id: 'modal-add-email', label: 'Địa chỉ Email' },
        { id: 'modal-add-entryLevel', label: 'Trình độ đầu vào' },
        { id: 'modal-add-branch', label: 'Chi nhánh tiếp nhận' }
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

      const payload = {
        ho_ten: document.getElementById('modal-add-fullName').value.trim(),
        ngay_sinh: document.getElementById('modal-add-dob').value,
        gioi_tinh: document.getElementById('modal-add-gender').value,
        ten_phu_huynh: document.getElementById('modal-add-parentName').value.trim(),
        so_dien_thoai: document.getElementById('modal-add-phone').value.trim(),
        email: document.getElementById('modal-add-email').value.trim(),
        trinh_do_dau_vao: document.getElementById('modal-add-entryLevel').value,
        chi_nhanh: document.getElementById('modal-add-branch').value,
        loai_ho_so: 'hoc_vien'
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
          renderStudentsList(container, role); // Reload danh sách
        } else {
          showToast(resultJson.error || 'Có lỗi xảy ra', 'error');
        }
      } catch (err) {
        showToast('Lỗi máy chủ khi tạo học viên', 'error');
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

function showStudentDetailModal(sv) {
  let modal = document.getElementById('student-detail-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'student-detail-modal';
    modal.className = 'fixed inset-0 bg-black/45 backdrop-blur-md z-50 flex items-center justify-center p-4 hidden';
    document.body.appendChild(modal);
  }

  // Hiển thị trạng thái loading trước khi load API lịch sử gói
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

  // Tải dữ liệu gói của học viên
  fetch(`${API_BASE}/students/${sv.id}/registrations`)
    .then(res => res.json())
    .then(result => {
      if (!result.success) throw new Error(result.error);
      const { khoa_hoc, hoc_kem } = result.data;

      const activeCourses = khoa_hoc.filter(x => x.trang_thai === 'dang_hoat_dong');
      const activeTutors = hoc_kem.filter(x => x.trang_thai === 'dang_hoat_dong');

      const historyCourses = khoa_hoc.filter(x => x.trang_thai !== 'dang_hoat_dong');
      const historyTutors = hoc_kem.filter(x => x.trang_thai !== 'dang_hoat_dong');

      const dobFormatted = sv.ngay_sinh ? new Date(sv.ngay_sinh).toISOString().split('T')[0] : '';
      const ngayTaoFormatted = sv.ngay_tao ? new Date(sv.ngay_tao).toLocaleString('vi-VN') : '—';

      modal.innerHTML = `
        <div class="bg-white rounded-3xl max-w-2xl w-full border border-[#e2e2e4] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in duration-200">
          
          <!-- Header cố định -->
          <div class="flex justify-between items-center px-6 py-4 border-b border-[#f3f3f5] shrink-0">
            <h3 class="text-sm font-bold text-[#1a1c1d] flex items-center gap-2">
              <span class="material-symbols-outlined text-apple-blue text-[22px]">account_circle</span>
              Hồ sơ & Chỉnh sửa trực tiếp
            </h3>
            <button id="close-student-detail-modal" class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all flex items-center justify-center">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <!-- Form cuộn nội dung -->
          <form id="student-inplace-edit-form" class="flex flex-col overflow-hidden max-h-[calc(90vh-70px)]">
            <div class="p-6 overflow-y-auto space-y-6 pr-4 scrollbar-thin">
              <!-- Header Profile -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-br from-[#0066cc]/5 via-[#0066cc]/1 to-transparent border border-[#0066cc]/10">
                <div class="flex items-center gap-4 w-full">
                  <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0066cc] to-[#004e9f] text-white flex items-center justify-center font-extrabold text-2xl shadow-lg shadow-[#0066cc]/15 shrink-0 select-none">
                    ${sv.ho_ten.charAt(0)}
                  </div>
                  <div class="flex-grow space-y-1">
                    <input type="text" id="inplace-fullName" value="${sv.ho_ten || ''}" required 
                           class="font-extrabold text-base text-apple-ink bg-transparent border-b border-transparent hover:border-slate-300 focus:border-apple-blue focus:bg-white px-1.5 py-0.5 outline-none rounded transition w-full">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="px-2 py-0.5 rounded-md bg-[#0066cc]/10 text-apple-blue font-bold text-[10px] tracking-wide uppercase">${sv.ma_ho_so}</span>
                      <span class="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                      <span class="text-slate-400 font-medium text-[10.5px]">Đăng ký lúc: ${ngayTaoFormatted}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Grid Thông tin cá nhân đầy đủ (Nhập liệu trực tiếp) -->
              <div class="space-y-3">
                <h4 class="font-bold text-[#1d1d1f] text-[11px] uppercase tracking-wider flex items-center gap-1 text-slate-400">
                  <span class="material-symbols-outlined text-[16px]">info</span> Thông tin cá nhân học viên (Có thể sửa)
                </h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <!-- Ngày sinh -->
                  <div class="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 flex items-start gap-2">
                    <span class="material-symbols-outlined text-slate-400 text-[18px] mt-2">calendar_today</span>
                    <div class="w-full">
                      <span class="block text-[9px] text-slate-400 font-semibold uppercase px-1">Ngày sinh</span>
                      <input type="date" id="inplace-dob" value="${dobFormatted}" required 
                             class="font-bold text-apple-ink text-xs w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-apple-blue focus:bg-white px-1 py-0.5 outline-none rounded transition">
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
                      <span class="block text-[9px] text-slate-400 font-semibold uppercase px-1">Số điện thoại</span>
                      <input type="tel" id="inplace-phone" value="${sv.so_dien_thoai || ''}" required 
                             class="font-bold text-apple-ink text-xs w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-apple-blue focus:bg-white px-1 py-0.5 outline-none rounded transition">
                    </div>
                  </div>
                  <!-- Email -->
                  <div class="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 flex items-start gap-2">
                    <span class="material-symbols-outlined text-slate-400 text-[18px] mt-2">mail</span>
                    <div class="w-full">
                      <span class="block text-[9px] text-slate-400 font-semibold uppercase px-1">Email</span>
                      <input type="email" id="inplace-email" value="${sv.email || ''}" required 
                             class="font-bold text-apple-ink text-xs w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-apple-blue focus:bg-white px-1 py-0.5 outline-none rounded transition">
                    </div>
                  </div>
                  <!-- Phụ huynh -->
                  <div class="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 flex items-start gap-2">
                    <span class="material-symbols-outlined text-slate-400 text-[18px] mt-2">supervisor_account</span>
                    <div class="w-full">
                      <span class="block text-[9px] text-slate-400 font-semibold uppercase px-1">Tên phụ huynh</span>
                      <input type="text" id="inplace-parentName" value="${sv.ten_phu_huynh || ''}" required 
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
                        <option value="Cơ bản A1" ${sv.trinh_do_dau_vao === 'Cơ bản A1' ? 'selected' : ''}>A1 Beginner</option>
                        <option value="Trung cấp B1" ${sv.trinh_do_dau_vao === 'Trung cấp B1' ? 'selected' : ''}>B1 Intermediate</option>
                        <option value="Cao cấp C1" ${sv.trinh_do_dau_vao === 'Cao cấp C1' ? 'selected' : ''}>C1 Advanced</option>
                      </select>
                    </div>
                  </div>
                  <!-- Chi nhánh -->
                  <div class="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 flex items-start gap-2 sm:col-span-2 md:col-span-1">
                    <span class="material-symbols-outlined text-slate-400 text-[18px] mt-2">home_work</span>
                    <div class="w-full">
                      <span class="block text-[9px] text-slate-400 font-semibold uppercase px-1">Chi nhánh</span>
                      <select id="inplace-branch" required 
                              class="font-bold text-apple-ink text-xs w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-apple-blue focus:bg-white px-1 py-0.5 outline-none rounded transition cursor-pointer">
                        <option value="Trung tam chính" ${sv.chi_nhanh === 'Trung tam chính' ? 'selected' : ''}>Trung tâm chính</option>
                        <option value="Downtown Campus" ${sv.chi_nhanh === 'Downtown Campus' ? 'selected' : ''}>Downtown Campus</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Section: Gói đang hoạt động -->
              <div class="space-y-3">
                <h4 class="font-bold text-apple-blue uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[16px]">task_alt</span> Gói đang hoạt động
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <!-- Đại trà -->
                  ${activeCourses.map(item => `
                    <div class="border border-[#0066cc]/20 rounded-2xl p-4 bg-gradient-to-br from-[#0066cc]/5 to-transparent flex flex-col justify-between gap-3 relative overflow-hidden">
                      <div class="absolute right-0 top-0 w-24 h-24 bg-apple-blue/5 rounded-full blur-xl -mr-8 -mt-8"></div>
                      <div>
                        <div class="flex items-center gap-2">
                          <span class="w-2 h-2 rounded-full bg-apple-blue"></span>
                          <span class="font-extrabold text-xs text-[#1a1c1d]">${item.ten_goi || 'Khóa học đại trà'}</span>
                        </div>
                        <div class="text-[10px] text-slate-500 mt-2 space-y-1">
                          <p class="flex items-center gap-1"><span class="material-symbols-outlined text-[13px] text-slate-400">calendar_month</span>Hạn dùng: ${new Date(item.tu_ngay).toLocaleDateString('vi-VN')} - ${new Date(item.den_ngay).toLocaleDateString('vi-VN')}</p>
                          <p class="flex items-center gap-1"><span class="material-symbols-outlined text-[13px] text-slate-400">payments</span>Thực thu: <strong class="text-[#1d1d1f]">${item.so_tien_da_thu.toLocaleString('vi-VN')} VNĐ</strong> / ${item.gia_thuc_te.toLocaleString('vi-VN')} VNĐ</p>
                        </div>
                      </div>
                      <button type="button" class="btn-cancel-active-package w-full mt-2 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-xl font-bold transition active:scale-95 text-[10.5px]" data-id="${item.id}" data-type="khoa_hoc">
                        Hủy gói / Hoàn tiền
                      </button>
                    </div>
                  `).join('')}

                  <!-- Học kèm -->
                  ${activeTutors.map(item => `
                    <div class="border border-purple-500/20 rounded-2xl p-4 bg-gradient-to-br from-purple-500/5 to-transparent flex flex-col justify-between gap-3 relative overflow-hidden">
                      <div class="absolute right-0 top-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl -mr-8 -mt-8"></div>
                      <div>
                        <div class="flex items-center gap-2">
                          <span class="w-2 h-2 rounded-full bg-purple-600"></span>
                          <span class="font-extrabold text-xs text-[#1a1c1d]">${item.ten_goi || 'Gói kèm 1-1'}</span>
                        </div>
                        <div class="text-[10px] text-slate-500 mt-2 space-y-1">
                          <p class="flex items-center gap-1"><span class="material-symbols-outlined text-[13px] text-slate-400">person</span>Giáo viên: <strong>${item.ten_giao_vien || 'Chưa xếp'}</strong></p>
                          <p class="flex items-center gap-1"><span class="material-symbols-outlined text-[13px] text-slate-400">trending_up</span>Tiến trình: Đã học <strong>${item.so_buoi_da_hoc}</strong> / ${item.so_buoi_dang_ky} buổi</p>
                        </div>
                      </div>
                      <button type="button" class="btn-cancel-active-package w-full mt-2 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-xl font-bold transition active:scale-95 text-[10.5px]" data-id="${item.id}" data-type="hoc_kem">
                        Hủy gói / Hoàn tiền
                      </button>
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

              <!-- Section: Lịch sử mua / hủy gói -->
              <div class="space-y-3 pt-3 border-t border-[#f3f3f5]">
                <h4 class="font-bold text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[16px]">history</span> Lịch sử mua / hủy / đổi gói
                </h4>
                <div class="max-h-[160px] overflow-y-auto space-y-2 pr-1">
                  ${[...historyCourses, ...historyTutors].map(item => `
                    <div class="border border-slate-100 rounded-xl p-3 bg-slate-50/50 flex justify-between items-center hover:bg-slate-50 transition border-l-4 ${item.trang_thai === 'huy' ? 'border-l-red-500' : 'border-l-slate-400'
        }">
                      <div>
                        <div class="font-bold text-xs text-apple-ink">${item.ten_goi} <span class="text-[10px] font-normal text-slate-400">(${item.loai_goi === 'khoa_hoc' ? 'Đại trà' : 'Kèm 1-1'})</span></div>
                        <div class="text-[9.5px] text-slate-400 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                          <span>Ngày đăng ký: ${new Date(item.ngay_tao || item.tu_ngay).toLocaleDateString('vi-VN')}</span>
                          ${item.trang_thai === 'huy' ? `<span class="text-red-500 font-bold">Hoàn tiền: ${item.so_tien_hoan?.toLocaleString('vi-VN') || 0} VNĐ</span>` : ''}
                        </div>
                        ${item.trang_thai === 'huy' ? `<p class="text-[9.5px] text-slate-500 italic mt-0.5">Lý do: ${item.ly_do_huy || 'Không ghi rõ'}</p>` : ''}
                      </div>
                      <span class="px-2.5 py-1 rounded-full text-[9px] font-extrabold select-none shrink-0 ${item.trang_thai === 'huy' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-100 text-slate-600 border border-slate-200'
        }">
                        ${item.trang_thai === 'huy' ? 'ĐÃ HỦY' : 'HẾT HẠN'}
                      </span>
                    </div>
                  `).join('')}
                  ${historyCourses.length === 0 && historyTutors.length === 0 ? `
                    <p class="text-slate-400 italic py-2 text-center">Chưa có lịch sử giao dịch nào được ghi nhận trước đó.</p>
                  ` : ''}
                </div>
              </div>
            </div>

            <!-- Footer cố định của form -->
            <div class="flex justify-between items-center px-6 py-4 border-t border-[#f3f3f5] bg-slate-50 shrink-0">
              <button type="button" id="btn-delete-student-profile" class="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl font-bold transition active:scale-95 text-xs">
                <span class="material-symbols-outlined text-[16px]">delete</span>Xóa học viên
              </button>
              <div class="flex gap-2">
                <button type="button" id="btn-cancel-inplace-edit" class="px-4 py-2 rounded-xl border border-[#e2e2e4] hover:bg-slate-100 text-slate-700 font-semibold transition active:scale-95 text-xs">Hủy</button>
                <button type="submit" class="px-6 py-2 rounded-xl bg-apple-blue hover:opacity-90 text-white font-bold transition active:scale-95 shadow-md text-xs">Lưu thay đổi</button>
              </div>
            </div>
          </form>
        </div>
      `;

      // Gắn sự kiện đóng modal
      modal.querySelector('#close-student-detail-modal').addEventListener('click', () => {
        modal.classList.add('hidden');
      });
      modal.querySelector('#btn-cancel-inplace-edit').addEventListener('click', () => {
        modal.classList.add('hidden');
      });

      // Submit cập nhật học viên trực tiếp
      modal.querySelector('#student-inplace-edit-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
          ho_ten: modal.querySelector('#inplace-fullName').value.trim(),
          ngay_sinh: modal.querySelector('#inplace-dob').value,
          gioi_tinh: modal.querySelector('#inplace-gender').value,
          ten_phu_huynh: modal.querySelector('#inplace-parentName').value.trim(),
          so_dien_thoai: modal.querySelector('#inplace-phone').value.trim(),
          email: modal.querySelector('#inplace-email').value.trim(),
          trinh_do_dau_vao: modal.querySelector('#inplace-entryLevel').value,
          chi_nhanh: modal.querySelector('#inplace-branch').value
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
            // Reload lại danh sách học viên
            const contentDiv = document.getElementById('dashboard-content');
            renderStudentsList(contentDiv, localStorage.getItem('userRole'));
          } else {
            showToast(putResult.error || 'Có lỗi xảy ra', 'error');
          }
        } catch (err) {
          showToast('Lỗi máy chủ khi cập nhật', 'error');
        }
      });

      // Sự kiện XÓA HỌC VIÊN
      modal.querySelector('#btn-delete-student-profile').addEventListener('click', async () => {
        if (!confirm(`Bạn có chắc chắn muốn xóa hồ sơ học viên ${sv.ho_ten} khỏi hệ thống?`)) return;
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

      // Sự kiện HỦY GÓI TRỰC TIẾP
      modal.querySelectorAll('.btn-cancel-active-package').forEach(btn => {
        btn.addEventListener('click', () => {
          const regId = btn.getAttribute('data-id');
          modal.classList.add('hidden');
          window.openCancelModal && window.openCancelModal(regId);
        });
      });
    })
    .catch(err => {
      showToast('Không thể tải thông tin gói học viên', 'error');
    });
}
