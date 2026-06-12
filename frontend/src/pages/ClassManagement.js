// ClassManagement.js - Lớp học & Xếp lịch (Redesign: Lớp nhóm 1-N / Học kèm 1-1)
import { API_BASE, showToast } from './_shared.js';

export async function renderClassManagement(container) {
  container.innerHTML = `
    <div class="space-y-4">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Form bên trái -->
        <div class="bg-apple-parchment rounded-[18px] p-6 border border-apple-divider/60 space-y-4 h-fit">
          <h3 class="font-bold text-apple-ink text-sm">Đăng ký lịch dạy</h3>
          
          <form id="schedule-form" class="space-y-4 text-xs">
            <!-- 1. Chọn Giáo viên trước -->
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Chọn Giáo viên giảng dạy <span class="text-rose-500 font-bold">*</span></label>
              <select id="class-teacher" required class="w-full border border-apple-divider rounded-full px-4 py-2 outline-none focus:border-apple-blue transition bg-white cursor-pointer">
                <option value="">-- Chọn giáo viên --</option>
              </select>
            </div>

            <!-- 2. Dropdown Loại lớp -->
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Loại hình lớp học <span class="text-rose-500 font-bold">*</span></label>
              <select id="class-type" required class="w-full border border-apple-divider rounded-full px-4 py-2 outline-none focus:border-apple-blue transition bg-white cursor-pointer">
                <option value="nhom" selected>Lớp học nhóm (1 Giáo viên - Nhiều Học sinh)</option>
                <option value="ca_nhan">Lớp học kèm (1 kèm 1)</option>
              </select>
            </div>

            <!-- Gói học đại trà (Dùng cho Lớp Nhóm) -->
            <div id="course-package-group">
              <label class="block font-semibold text-slate-600 mb-1">Chọn Gói học / Khóa học <span class="text-rose-500 font-bold">*</span></label>
              <select id="class-course-package" class="w-full border border-apple-divider rounded-full px-4 py-2 outline-none focus:border-apple-blue transition bg-white cursor-pointer">
                <option value="">-- Chọn gói học phí --</option>
              </select>
            </div>

            <!-- ID Đăng ký học kèm (Dùng cho Học kèm 1-1) -->
            <div id="tutoring-contract-group" class="hidden">
              <label class="block font-semibold text-slate-600 mb-1">Mã Đăng ký Học kèm (ID) <span class="text-rose-500 font-bold">*</span></label>
              <input type="number" id="class-tutoring-id" placeholder="Nhập mã hợp đồng kèm..." class="w-full border border-apple-divider rounded-full px-4 py-2 outline-none focus:border-apple-blue transition bg-white">
            </div>

            <!-- Panel chọn học viên (Chỉ hiện khi là lớp học nhóm) -->
            <div id="student-picker-panel" class="space-y-2">
              <div class="flex justify-between items-center bg-slate-100 p-2.5 rounded-xl border border-apple-divider/40">
                <span class="font-bold text-slate-700">Học sinh trong lớp (Tối đa 10)</span>
                <button type="button" id="btn-toggle-student-list" class="text-apple-blue font-bold text-[10px] uppercase hover:underline">Ẩn/Hiện</button>
              </div>
              <div id="student-picker-list" class="bg-white border border-apple-divider/50 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1.5">
                <p class="text-slate-400 italic text-center py-2">Đang tải danh sách học viên...</p>
              </div>
              <div id="selected-student-badges" class="flex flex-wrap gap-1.5 pt-1">
                <!-- Hiển thị các học sinh đã được tick chọn -->
              </div>
            </div>

            <!-- Ngày & Giờ học -->
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Ngày dạy học <span class="text-rose-500 font-bold">*</span></label>
              <input type="date" id="class-date" required class="w-full border border-apple-divider rounded-full px-4 py-2 outline-none focus:border-apple-blue transition bg-white">
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block font-semibold text-slate-600 mb-1">Giờ bắt đầu <span class="text-rose-500 font-bold">*</span></label>
                <input type="time" id="class-start" required class="w-full border border-apple-divider rounded-full px-4 py-2 outline-none focus:border-apple-blue transition bg-white">
              </div>
              <div>
                <label class="block font-semibold text-slate-600 mb-1">Giờ kết thúc <span class="text-rose-500 font-bold">*</span></label>
                <input type="time" id="class-end" required class="w-full border border-apple-divider rounded-full px-4 py-2 outline-none focus:border-apple-blue transition bg-white">
              </div>
            </div>

            <button type="submit" class="w-full bg-apple-blue hover:opacity-90 text-white font-semibold py-2.5 rounded-full transition active:scale-95 shadow-md">
              Xếp lịch & Tạo lớp ngay
            </button>
          </form>
        </div>

        <!-- Danh sách lịch sử đặt lịch bên phải -->
        <div class="lg:col-span-2 bg-apple-white rounded-[18px] border border-apple-divider overflow-hidden flex flex-col" id="class-list-container">
          <div class="p-6 flex items-center justify-center text-slate-400 text-xs">Đang tải lịch sử đặt lịch...</div>
        </div>
      </div>
    </div>
  `;

  const teacherSelect = document.getElementById('class-teacher');
  const classTypeSelect = document.getElementById('class-type');
  const coursePkgGroup = document.getElementById('course-package-group');
  const coursePkgSelect = document.getElementById('class-course-package');
  const tutorGroup = document.getElementById('tutoring-contract-group');
  const tutorIdInput = document.getElementById('class-tutoring-id');
  const studentPickerPanel = document.getElementById('student-picker-panel');
  const studentPickerList = document.getElementById('student-picker-list');
  const selectedBadges = document.getElementById('selected-student-badges');
  const toggleStudentListBtn = document.getElementById('btn-toggle-student-list');

  // Set ngày hôm nay làm min để tránh đặt lịch trong quá khứ
  const todayStr = new Date().toISOString().split('T')[0];
  document.getElementById('class-date').min = todayStr;

  let allStudents = [];
  let selectedStudentIds = [];

  // Toggle ẩn/hiện danh sách học viên
  toggleStudentListBtn?.addEventListener('click', () => {
    studentPickerList.classList.toggle('hidden');
  });

  // Tải danh sách giáo viên, học sinh và gói học phí
  async function loadFormData() {
    try {
      // 1. Tải giáo viên
      const gvRes = await fetch(`${API_BASE}/teachers`);
      const gvData = await gvRes.json();
      const teachers = gvData.data || [];
      teacherSelect.innerHTML = '<option value="">-- Chọn giáo viên --</option>' + teachers.map(t => `<option value="${t.id}">${t.ho_ten} (${t.chuyen_mon})</option>`).join('');

      // 2. Tải học sinh
      const hsRes = await fetch(`${API_BASE}/students`);
      const hsData = await hsRes.json();
      allStudents = hsData.data || [];
      renderStudentChecklist();

      // 3. Tải gói học phí
      const pkgRes = await fetch(`${API_BASE}/course-packages`);
      const pkgData = await pkgRes.json();
      const packages = pkgData.data || [];
      coursePkgSelect.innerHTML = '<option value="">-- Chọn gói học phí --</option>' + packages.map(p => `<option value="${p.id}">${p.ten_goi}</option>`).join('');

    } catch (e) {
      showToast('Không thể tải dữ liệu biểu mẫu xếp lịch', 'error');
    }
  }

  function renderStudentChecklist() {
    if (allStudents.length === 0) {
      studentPickerList.innerHTML = '<p class="text-slate-400 italic text-center py-2">Không có học viên nào.</p>';
      return;
    }
    studentPickerList.innerHTML = allStudents.map(s => `
      <label class="flex items-center gap-2 hover:bg-slate-50 p-1 rounded transition cursor-pointer select-none">
        <input type="checkbox" value="${s.id}" class="student-checkbox rounded text-apple-blue focus:ring-apple-blue" ${selectedStudentIds.includes(s.id) ? 'checked' : ''}>
        <span class="text-slate-700">${s.ho_ten}</span>
      </label>
    `).join('');

    // Gắn sự kiện click cho các checkbox
    studentPickerList.querySelectorAll('.student-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = parseInt(cb.value);
        if (cb.checked) {
          if (selectedStudentIds.length >= 10) {
            showToast('Lớp học nhóm tối đa chỉ cho phép 10 học viên!', 'error');
            cb.checked = false;
            return;
          }
          if (!selectedStudentIds.includes(id)) selectedStudentIds.push(id);
        } else {
          selectedStudentIds = selectedStudentIds.filter(sid => sid !== id);
        }
        renderSelectedBadges();
      });
    });
  }

  function renderSelectedBadges() {
    selectedBadges.innerHTML = selectedStudentIds.map(id => {
      const student = allStudents.find(s => s.id === id);
      if (!student) return '';
      return `
        <span class="inline-flex items-center gap-1 bg-blue-50 text-apple-blue font-bold px-2 py-1 rounded-full text-[10px] border border-blue-100">
          ${student.ho_ten}
          <button type="button" class="btn-remove-selected text-red-500 hover:text-red-700 font-extrabold focus:outline-none" data-id="${id}">×</button>
        </span>
      `;
    }).join('');

    // Gắn sự kiện xóa học viên trực tiếp trên badge
    selectedBadges.querySelectorAll('.btn-remove-selected').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'));
        selectedStudentIds = selectedStudentIds.filter(sid => sid !== id);
        renderStudentChecklist(); // Sync check box
        renderSelectedBadges();
      });
    });
  }

  // Chuyển đổi giao diện khi thay đổi loại lớp
  classTypeSelect?.addEventListener('change', () => {
    const val = classTypeSelect.value;
    if (val === 'nhom') {
      coursePkgGroup.classList.remove('hidden');
      tutorGroup.classList.add('hidden');
      studentPickerPanel.classList.remove('hidden');
    } else {
      coursePkgGroup.classList.add('hidden');
      tutorGroup.classList.remove('hidden');
      studentPickerPanel.classList.add('hidden');
    }
  });

  // Tải danh sách lịch học & lớp học nhóm
  async function loadScheduleList() {
    const schList = document.getElementById('class-list-container');
    if (!schList) return;

    try {
      // Tải lịch học kèm
      const schedulesRes = await fetch(`${API_BASE}/schedules`);
      const schedulesData = await schedulesRes.json();
      const schedules = schedulesData.data || [];

      // Tải danh sách lớp nhóm
      const classesRes = await fetch(`${API_BASE}/classes`);
      const classesData = await classesRes.json();
      const classesList = classesData.data || [];

      let rows = '';

      // Render lịch lớp học nhóm trước
      classesList.forEach(item => {
        rows += `
          <tr class="hover:bg-slate-50 border-b border-apple-divider/40 transition text-xs">
            <td class="px-5 py-3.5">
              <div class="font-bold text-apple-ink">${item.ten_lop}</div>
              <div class="text-[9.5px] text-slate-400 mt-0.5">Gói: ${item.ten_goi_hoc_phi || 'Tự chọn'}</div>
            </td>
            <td class="px-5 py-3.5 text-slate-500 font-semibold uppercase">Lớp nhóm</td>
            <td class="px-5 py-3.5 text-slate-600">${item.ten_giao_vien}</td>
            <td class="px-5 py-3.5 font-bold text-apple-blue">${item.si_so || 0}/10 học sinh</td>
            <td class="px-5 py-3.5">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Đang học</span>
            </td>
          </tr>
        `;
      });

      // Render lịch học kèm 1-1
      schedules.forEach(item => {
        rows += `
          <tr class="hover:bg-slate-50 border-b border-apple-divider/40 transition text-xs">
            <td class="px-5 py-3.5">
              <div class="font-bold text-apple-ink">Học kèm: ${item.ten_hoc_vien}</div>
              <div class="text-[9.5px] text-slate-400 mt-0.5">Ngày: ${new Date(item.ngay_hoc).toLocaleDateString('vi-VN')}</div>
            </td>
            <td class="px-5 py-3.5 text-slate-500 font-semibold uppercase">1 kèm 1</td>
            <td class="px-5 py-3.5 text-slate-600">${item.ten_giao_vien}</td>
            <td class="px-5 py-3.5 font-bold text-apple-ink">${item.gio_bat_dau.slice(0, 5)} - ${item.gio_ket_thuc.slice(0, 5)}</td>
            <td class="px-5 py-3.5">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${item.trang_thai === 'da_hoc' ? 'bg-emerald-100 text-emerald-800' :
            item.trang_thai === 'vang' ? 'bg-rose-100 text-rose-800' : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
          }">${item.trang_thai === 'da_hoc' ? 'Đã học' : item.trang_thai === 'vang' ? 'Vắng' : 'Chờ học'}</span>
            </td>
          </tr>
        `;
      });

      schList.innerHTML = `
        <div class="p-4 border-b border-apple-divider flex justify-between items-center">
          <h3 class="font-bold text-apple-ink text-xs uppercase tracking-wider">Lịch sử đặt lịch & Lớp học</h3>
          <span class="text-[10px] text-slate-400">${classesList.length + schedules.length} bản ghi</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-apple-parchment text-slate-500 text-[10px] font-semibold uppercase tracking-wider border-b border-apple-divider">
                <th class="px-5 py-3">Lớp học / Học viên</th>
                <th class="px-5 py-3">Loại hình</th>
                <th class="px-5 py-3">Giáo viên</th>
                <th class="px-5 py-3">Chi tiết ca</th>
                <th class="px-5 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
              ${(classesList.length === 0 && schedules.length === 0) ? '<tr><td colspan="5" class="px-5 py-6 text-center text-slate-500 text-xs">Chưa có lịch giảng dạy nào.</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      `;

    } catch (e) {
      schList.innerHTML = `<div class="p-4 text-red-600 text-xs">Lỗi tải lịch sử đặt lịch: ${e.message}</div>`;
    }
  }

  // Khởi chạy dữ liệu form
  loadFormData();
  loadScheduleList();

  // Gửi Form xếp lịch
  document.getElementById('schedule-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const gvId = teacherSelect.value;
    const type = classTypeSelect.value;
    const ngayHoc = document.getElementById('class-date').value;
    const batDau = document.getElementById('class-start').value;
    const ketThuc = document.getElementById('class-end').value;

    // Validate giờ quá khứ nếu là ngày hôm nay
    const todayStr = new Date().toISOString().split('T')[0];
    if (ngayHoc === todayStr) {
      const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
      if (batDau < nowTime) {
        showToast('Không thể xếp lịch ca học bắt đầu ở thời điểm quá khứ của ngày hôm nay!', 'error');
        return;
      }
    }

    if (ketThuc <= batDau) {
      showToast('Giờ kết thúc ca học phải lớn hơn giờ bắt đầu!', 'error');
      return;
    }

    // 1. Gửi lớp học nhóm
    if (type === 'nhom') {
      const pkgId = coursePkgSelect.value;
      if (selectedStudentIds.length === 0) {
        showToast('Vui lòng chọn ít nhất 1 học sinh để mở lớp nhóm!', 'error');
        return;
      }

      const payload = {
        ten_lop: `Lớp nhóm - GV ${teacherSelect.options[teacherSelect.selectedIndex].text.split(' (')[0]}`,
        giao_vien_id: parseInt(gvId),
        goi_hoc_phi_id: pkgId ? parseInt(pkgId) : null,
        hoc_vien_ids: selectedStudentIds,
        ngay_hoc: ngayHoc,
        gio_bat_dau: batDau,
        gio_ket_thuc: ketThuc
      };

      try {
        const res = await fetch(`${API_BASE}/classes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Role': 'le_tan'
          },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (result.success) {
          showToast('Tạo lớp học nhóm và xếp lịch thành công!');
          selectedStudentIds = [];
          renderClassManagement(container); // Reload
        } else {
          showToast(result.error || 'Có lỗi xảy ra', 'error');
        }
      } catch (err) {
        showToast('Lỗi kết nối máy chủ', 'error');
      }

    } else {
      // 2. Gửi lớp học kèm 1-1
      const contractId = tutorIdInput.value;
      if (!contractId || contractId.trim() === '') {
        showToast('Vui lòng điền mã hợp đồng học kèm!', 'error');
        tutorIdInput.focus();
        return;
      }

      const payload = {
        dang_ky_hoc_kem_id: parseInt(contractId),
        ngay_hoc: ngayHoc,
        gio_bat_dau: batDau,
        gio_ket_thuc: ketThuc,
        loai_buoi: 'ca_nhan'
      };

      try {
        const res = await fetch(`${API_BASE}/schedule`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Role': 'le_tan'
          },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (result.success) {
          showToast('Đặt lịch học kèm thành công!');
          renderClassManagement(container);
        } else {
          showToast(result.error || 'Có lỗi xảy ra', 'error');
        }
      } catch (err) {
        showToast('Lỗi kết nối máy chủ', 'error');
      }
    }
  });
}
