// ClassManagement.js - Lớp học & Xếp lịch (Redesign: max 50 HS, giờ grid 8-22h, thời lượng auto, chọn tất cả)
import { API_BASE, showToast } from './_shared.js';

export async function renderClassManagement(container) {
  // Set ngày hôm nay làm giá trị min
  const todayStr = new Date().toISOString().split('T')[0];

  container.innerHTML = `
    <div class="space-y-4">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Form bên trái -->
        <div class="bg-apple-parchment rounded-[18px] p-6 border border-apple-divider/60 space-y-4 h-fit">
          <div class="flex justify-between items-center pb-1 border-b border-apple-divider/40">
            <h3 class="font-bold text-apple-ink text-sm">Đăng ký lịch dạy</h3>
            <button id="btn-refresh-class-form" class="flex items-center justify-center gap-1 px-2.5 py-1 border border-[#e2e2e4] hover:bg-white text-slate-700 text-[11px] font-semibold rounded-full transition-all active:scale-95 shadow-sm h-[28px]" type="button">
              <span class="material-symbols-outlined text-[14px]">refresh</span>Tải lại
            </button>
          </div>
          
          <form id="schedule-form" class="space-y-4 text-xs">
            <!-- 1. Chọn Giáo viên -->
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
                <option value="nhom" selected>Lớp học nhóm (1 GV - Nhiều HS, tối đa 50)</option>
                <option value="ca_nhan">Lớp học kèm (1 kèm 1)</option>
              </select>
            </div>

            <!-- Gói học đại trà -->
            <div id="course-package-group">
              <label class="block font-semibold text-slate-600 mb-1">Chọn Gói học / Khóa học <span class="text-rose-500 font-bold">*</span></label>
              <select id="class-course-package" class="w-full border border-apple-divider rounded-full px-4 py-2 outline-none focus:border-apple-blue transition bg-white cursor-pointer">
                <option value="">-- Chọn gói học phí --</option>
              </select>
            </div>

            <!-- ID Đăng ký học kèm -->
            <div id="tutoring-contract-group" class="hidden">
              <label class="block font-semibold text-slate-600 mb-1">Mã Đăng ký Học kèm (ID) <span class="text-rose-500 font-bold">*</span></label>
              <input type="number" id="class-tutoring-id" placeholder="Nhập mã hợp đồng kèm..." class="w-full border border-apple-divider rounded-full px-4 py-2 outline-none focus:border-apple-blue transition bg-white">
            </div>

            <!-- Panel chọn học viên -->
            <div id="student-picker-panel" class="space-y-2">
              <div class="flex justify-between items-center bg-slate-100 p-2.5 rounded-xl border border-apple-divider/40">
                <span class="font-bold text-slate-700">Học sinh trong lớp <span id="selected-count-badge" class="text-apple-blue">(0/50)</span></span>
                <div class="flex items-center gap-2">
                  <button type="button" id="btn-select-all-students" class="text-emerald-600 font-bold text-[10px] uppercase hover:underline">Chọn tất cả</button>
                  <button type="button" id="btn-toggle-student-list" class="text-apple-blue font-bold text-[10px] uppercase hover:underline">Ẩn/Hiện</button>
                </div>
              </div>
              <div>
                <input type="text" id="student-search" placeholder="Tìm học viên..." class="w-full border border-apple-divider rounded-full px-3 py-1.5 text-xs outline-none focus:border-apple-blue transition bg-white mb-1.5">
              </div>
              <div id="student-picker-list" class="bg-white border border-apple-divider/50 rounded-xl p-3 max-h-48 overflow-y-auto space-y-1.5">
                <p class="text-slate-400 italic text-center py-2">Đang tải danh sách học viên...</p>
              </div>
              <div id="selected-student-badges" class="flex flex-wrap gap-1.5 pt-1">
                <!-- Badges học sinh đã chọn -->
              </div>
            </div>

            <!-- Ngày học - có min để không chọn quá khứ -->
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Ngày dạy học <span class="text-rose-500 font-bold">*</span></label>
              <input type="date" id="class-date" required min="${todayStr}" value="${todayStr}" class="w-full border border-apple-divider rounded-full px-4 py-2 outline-none focus:border-apple-blue transition bg-white cursor-pointer">
            </div>

            <!-- Giờ bắt đầu: Grid button 8h-22h -->
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Giờ bắt đầu <span class="text-rose-500 font-bold">*</span></label>
              <div id="time-grid" class="grid grid-cols-4 gap-1.5">
                <!-- Sẽ render bằng JS -->
              </div>
              <input type="hidden" id="class-start" required>
            </div>

            <!-- Thời lượng -->
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Thời lượng buổi học <span class="text-rose-500 font-bold">*</span></label>
              <div class="grid grid-cols-3 gap-2">
                <button type="button" class="duration-btn px-3 py-2 rounded-xl border-2 border-apple-divider bg-white text-xs font-bold text-slate-600 hover:border-apple-blue hover:bg-blue-50 transition active:scale-95" data-duration="60">1 tiếng</button>
                <button type="button" class="duration-btn px-3 py-2 rounded-xl border-2 border-apple-divider bg-white text-xs font-bold text-slate-600 hover:border-apple-blue hover:bg-blue-50 transition active:scale-95" data-duration="90">1.5 tiếng</button>
                <button type="button" class="duration-btn px-3 py-2 rounded-xl border-2 border-apple-divider bg-white text-xs font-bold text-slate-600 hover:border-apple-blue hover:bg-blue-50 transition active:scale-95" data-duration="120">2 tiếng</button>
              </div>
              <input type="hidden" id="class-duration" value="">
            </div>

            <!-- Giờ kết thúc (tự tính) -->
            <div id="class-end-display" class="hidden">
              <label class="block font-semibold text-slate-600 mb-1">Giờ kết thúc (tự tính)</label>
              <div class="bg-white border border-apple-divider rounded-full px-4 py-2 font-bold text-apple-blue text-xs" id="class-end-label">--:--</div>
              <input type="hidden" id="class-end" required>
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
  const selectAllBtn = document.getElementById('btn-select-all-students');
  const studentSearch = document.getElementById('student-search');
  const timeGrid = document.getElementById('time-grid');
  const classStartInput = document.getElementById('class-start');
  const classDurationInput = document.getElementById('class-duration');
  const classEndInput = document.getElementById('class-end');
  const classEndDisplay = document.getElementById('class-end-display');
  const classEndLabel = document.getElementById('class-end-label');
  const selectedCountBadge = document.getElementById('selected-count-badge');

  let allStudents = [];
  let filteredStudents = [];
  let selectedStudentIds = [];
  let selectedStartTime = '';
  let selectedDuration = 0;

  // ============ RENDER TIME GRID ============
  function renderTimeGrid(selectedDate) {
    const now = new Date();
    const isToday = selectedDate === now.toISOString().split('T')[0];
    const currentH = now.getHours();
    const currentM = now.getMinutes();

    const slots = [];
    for (let h = 8; h <= 22; h++) {
      for (let m = 0; m < 60; m += 30) {
        if (h === 22 && m > 0) break; // 22:00 là slot cuối
        slots.push({ h, m });
      }
    }

    timeGrid.innerHTML = slots.map(({ h, m }) => {
      const label = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const isPast = isToday && (h < currentH || (h === currentH && m <= currentM));
      const isSelected = label === selectedStartTime;
      return `
        <button type="button" 
          class="time-slot-btn py-2 rounded-xl text-[11px] font-bold transition text-center border-2 
            ${isPast ? 'bg-slate-100 border-slate-100 text-slate-300 cursor-not-allowed' : 
              isSelected ? 'bg-apple-blue border-apple-blue text-white shadow-md shadow-apple-blue/20' :
              'bg-white border-apple-divider text-slate-600 hover:border-apple-blue hover:bg-blue-50 active:scale-95'}"
          data-time="${label}" ${isPast ? 'disabled' : ''}
        >${label}</button>
      `;
    }).join('');

    // Gắn sự kiện cho time slot
    timeGrid.querySelectorAll('.time-slot-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedStartTime = btn.getAttribute('data-time');
        classStartInput.value = selectedStartTime;
        renderTimeGrid(selectedDate); // re-render để cập nhật selected
        updateEndTime();
      });
    });
  }

  // Cập nhật giờ kết thúc tự động
  function updateEndTime() {
    if (!selectedStartTime || !selectedDuration) {
      classEndDisplay.classList.add('hidden');
      classEndLabel.textContent = '--:--';
      classEndInput.value = '';
      return;
    }
    const [h, m] = selectedStartTime.split(':').map(Number);
    const totalMin = h * 60 + m + selectedDuration;
    const endH = Math.floor(totalMin / 60);
    const endM = totalMin % 60;
    if (endH > 22 || (endH === 22 && endM > 0)) {
      showToast('Giờ kết thúc vượt quá 22:00, vui lòng chọn giờ bắt đầu sớm hơn', 'error');
      classEndDisplay.classList.add('hidden');
      classEndLabel.textContent = '--:--';
      classEndInput.value = '';
      return;
    }
    const endStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    classEndLabel.textContent = endStr;
    classEndInput.value = endStr;
    classEndDisplay.classList.remove('hidden');
  }

  // Khởi tạo time grid với ngày hôm nay
  renderTimeGrid(todayStr);

  // Khi chọn ngày mới -> re-render time grid
  document.getElementById('class-date').addEventListener('change', (e) => {
    selectedStartTime = '';
    classStartInput.value = '';
    renderTimeGrid(e.target.value);
    updateEndTime();
  });

  // Chọn thời lượng
  document.querySelectorAll('.duration-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.duration-btn').forEach(b => {
        b.classList.remove('border-apple-blue', 'bg-blue-50', 'text-apple-blue');
        b.classList.add('border-apple-divider', 'bg-white', 'text-slate-600');
      });
      btn.classList.add('border-apple-blue', 'bg-blue-50', 'text-apple-blue');
      btn.classList.remove('border-apple-divider', 'bg-white', 'text-slate-600');
      selectedDuration = parseInt(btn.getAttribute('data-duration'));
      classDurationInput.value = selectedDuration;
      updateEndTime();
    });
  });

  // Toggle ẩn/hiện danh sách học viên
  toggleStudentListBtn?.addEventListener('click', () => {
    studentPickerList.classList.toggle('hidden');
    studentSearch.closest('div').classList.toggle('hidden');
  });

  // Search học viên
  studentSearch?.addEventListener('input', () => {
    const q = studentSearch.value.toLowerCase();
    filteredStudents = allStudents.filter(s => s.ho_ten.toLowerCase().includes(q));
    renderStudentChecklist();
  });

  // Chọn tất cả / bỏ chọn tất cả
  selectAllBtn?.addEventListener('click', () => {
    const visibleIds = filteredStudents.map(s => s.id);
    const allSelected = visibleIds.every(id => selectedStudentIds.includes(id));
    if (allSelected) {
      // Bỏ chọn tất cả visible
      selectedStudentIds = selectedStudentIds.filter(id => !visibleIds.includes(id));
    } else {
      // Chọn tất cả visible (tối đa 50)
      visibleIds.forEach(id => {
        if (!selectedStudentIds.includes(id) && selectedStudentIds.length < 50) {
          selectedStudentIds.push(id);
        }
      });
    }
    renderStudentChecklist();
    renderSelectedBadges();
  });

  // Tải dữ liệu form
  async function loadFormData() {
    try {
      const gvRes = await fetch(`${API_BASE}/teachers`);
      const gvData = await gvRes.json();
      const teachers = gvData.data || [];
      teacherSelect.innerHTML = '<option value="">-- Chọn giáo viên --</option>' + teachers.map(t => `<option value="${t.id}">${t.ho_ten}${t.chuyen_mon ? ' (' + t.chuyen_mon + ')' : ''}</option>`).join('');

      const hsRes = await fetch(`${API_BASE}/students`);
      const hsData = await hsRes.json();
      allStudents = hsData.data || [];
      filteredStudents = [...allStudents];
      renderStudentChecklist();

      const pkgRes = await fetch(`${API_BASE}/course-packages`);
      const pkgData = await pkgRes.json();
      const packages = pkgData.data || [];
      coursePkgSelect.innerHTML = '<option value="">-- Chọn gói học phí --</option>' + packages.map(p => `<option value="${p.id}">${p.ten_goi}</option>`).join('');

    } catch (e) {
      showToast('Không thể tải dữ liệu biểu mẫu xếp lịch', 'error');
    }
  }

  function renderStudentChecklist() {
    if (filteredStudents.length === 0) {
      studentPickerList.innerHTML = '<p class="text-slate-400 italic text-center py-2">Không tìm thấy học viên nào.</p>';
      return;
    }
    studentPickerList.innerHTML = filteredStudents.map(s => `
      <label class="flex items-center gap-2 hover:bg-slate-50 p-1.5 rounded-lg transition cursor-pointer select-none">
        <input type="checkbox" value="${s.id}" class="student-checkbox rounded text-apple-blue focus:ring-apple-blue" ${selectedStudentIds.includes(s.id) ? 'checked' : ''}>
        <span class="text-slate-700">${s.ho_ten}</span>
        <span class="text-[9px] text-slate-400 ml-auto">${s.trinh_do_dau_vao || ''}</span>
      </label>
    `).join('');

    selectedCountBadge.textContent = `(${selectedStudentIds.length}/50)`;

    studentPickerList.querySelectorAll('.student-checkbox').forEach(cb => {
      cb.addEventListener('change', () => {
        const id = parseInt(cb.value);
        if (cb.checked) {
          if (selectedStudentIds.length >= 50) {
            showToast('Lớp học nhóm tối đa chỉ cho phép 50 học viên!', 'error');
            cb.checked = false;
            return;
          }
          if (!selectedStudentIds.includes(id)) selectedStudentIds.push(id);
        } else {
          selectedStudentIds = selectedStudentIds.filter(sid => sid !== id);
        }
        selectedCountBadge.textContent = `(${selectedStudentIds.length}/50)`;
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

    selectedBadges.querySelectorAll('.btn-remove-selected').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'));
        selectedStudentIds = selectedStudentIds.filter(sid => sid !== id);
        renderStudentChecklist();
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
      const [schedulesRes, classesRes] = await Promise.all([
        fetch(`${API_BASE}/schedules`).then(r => r.json()),
        fetch(`${API_BASE}/classes`).then(r => r.json())
      ]);
      const schedules = schedulesRes.data || [];
      const classesList = classesRes.data || [];

      let rows = '';
      classesList.forEach(item => {
        const ngayHocStr = item.ngay_hoc ? new Date(item.ngay_hoc).toLocaleDateString('vi-VN') : '—';
        const gioHocStr = (item.gio_bat_dau && item.gio_ket_thuc) ? `${item.gio_bat_dau.slice(0, 5)} - ${item.gio_ket_thuc.slice(0, 5)}` : '—';
        rows += `
          <tr class="hover:bg-slate-50 border-b border-apple-divider/40 transition text-xs">
            <td class="px-5 py-3.5">
              <div class="font-bold text-apple-ink">${item.ten_lop}</div>
              <div class="text-[9.5px] text-slate-400 mt-0.5">Gói: ${item.ten_goi_hoc_phi || 'Tự chọn'}</div>
              <div class="text-[9.5px] text-slate-400 mt-0.5">Ngày: ${ngayHocStr}</div>
            </td>
            <td class="px-5 py-3.5 text-slate-500 font-semibold uppercase">Lớp nhóm</td>
            <td class="px-5 py-3.5 text-slate-600">${item.ten_giao_vien}</td>
            <td class="px-5 py-3.5 font-bold text-apple-blue">${gioHocStr} (${item.si_so || 0}/50 học sinh)</td>
            <td class="px-5 py-3.5">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Đang học</span>
            </td>
          </tr>
        `;
      });

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
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${item.trang_thai === 'da_hoc' ? 'bg-emerald-100 text-emerald-800' : item.trang_thai === 'vang' ? 'bg-rose-100 text-rose-800' : 'bg-yellow-50 text-yellow-800 border border-yellow-200'}">${item.trang_thai === 'da_hoc' ? 'Đã học' : item.trang_thai === 'vang' ? 'Vắng' : 'Chờ học'}</span>
            </td>
          </tr>
        `;
      });

      schList.innerHTML = `
        <div class="p-4 border-b border-apple-divider flex justify-between items-center flex-wrap gap-2">
          <h3 class="font-bold text-apple-ink text-xs uppercase tracking-wider">Lịch sử đặt lịch & Lớp học</h3>
          <div class="flex items-center gap-2">
            <button id="btn-refresh-class-list" class="flex items-center justify-center gap-1.5 px-3 py-1 border border-[#e2e2e4] hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-full transition-all active:scale-95 shadow-sm h-[30px]" type="button">
              <span class="material-symbols-outlined text-[16px]">refresh</span>Tải lại
            </button>
            <span class="text-[10px] text-slate-400 bg-white px-3 py-1 rounded-full font-bold">${classesList.length + schedules.length} bản ghi</span>
          </div>
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
      document.getElementById('btn-refresh-class-list')?.addEventListener('click', () => {
        loadScheduleList();
      });
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
    const batDau = classStartInput.value;
    const ketThuc = classEndInput.value;

    if (!gvId) { showToast('Vui lòng chọn giáo viên', 'error'); return; }
    if (!ngayHoc) { showToast('Vui lòng chọn ngày dạy học', 'error'); return; }
    if (!batDau) { showToast('Vui lòng chọn giờ bắt đầu', 'error'); return; }
    if (!selectedDuration) { showToast('Vui lòng chọn thời lượng buổi học', 'error'); return; }
    if (!ketThuc) { showToast('Không thể tính giờ kết thúc, vui lòng kiểm tra lại', 'error'); return; }

    if (type === 'nhom') {
      const pkgId = coursePkgSelect.value;
      if (!pkgId) {
        showToast('Vui lòng chọn gói học / khóa học cho lớp nhóm!', 'error');
        coursePkgSelect.focus();
        return;
      }
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
          headers: { 'Content-Type': 'application/json', 'X-User-Role': 'le_tan' },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (result.success) {
          showToast('Tạo lớp học nhóm và xếp lịch thành công!');
          renderClassManagement(container);
        } else {
          showToast(result.error || 'Có lỗi xảy ra', 'error');
        }
      } catch (err) {
        showToast('Lỗi kết nối máy chủ', 'error');
      }

    } else {
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
          headers: { 'Content-Type': 'application/json', 'X-User-Role': 'le_tan' },
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
