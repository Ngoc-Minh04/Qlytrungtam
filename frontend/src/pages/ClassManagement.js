// ClassManagement.js - Lớp học & Xếp lịch (Redesign: max 50 HS, giờ grid 8-22h, thời lượng auto, chọn tất cả)
import { API_BASE, showToast, setupCustomDatePicker } from './_shared.js';

export async function renderClassManagement(container) {

  const todayStr = new Date().toISOString().split('T')[0];

  container.innerHTML = `
    <div class="space-y-4">
      <div class="grid grid-cols-1 lg:grid-cols-10 gap-6">
        <!-- Form bên trái (Đăng ký lịch dạy - chiếm 3 phần) -->
        <div class="lg:col-span-3 bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-5 h-fit">
          <div class="flex justify-between items-center pb-3 border-b border-slate-100">
            <h3 class="font-bold text-slate-800 text-sm tracking-wide">Đăng ký lịch dạy</h3>
            <button id="btn-refresh-class-form" class="flex items-center justify-center gap-1.5 px-3 py-1 border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-semibold rounded-full transition-all active:scale-95 shadow-sm h-[30px]" type="button">
              <span class="material-symbols-outlined text-[14px]">refresh</span>Tải lại
            </button>
          </div>
          
          <form id="schedule-form" class="space-y-4 text-xs">
            <!-- 1. Chọn Giáo viên -->
            <div class="space-y-1.5">
              <label class="block font-semibold text-slate-500">Chọn Giáo viên giảng dạy <span class="text-rose-500 font-bold">*</span></label>
              <select id="class-teacher" required class="w-full border border-slate-250 rounded-full px-4 py-2.5 outline-none focus:border-apple-blue transition bg-slate-50/50 cursor-pointer">
                <option value="">-- Chọn giáo viên --</option>
              </select>
            </div>

            <!-- 2. Dropdown Loại lớp -->
            <div class="space-y-1.5">
              <label class="block font-semibold text-slate-500">Loại hình lớp học <span class="text-rose-500 font-bold">*</span></label>
              <select id="class-type" required class="w-full border border-slate-250 rounded-full px-4 py-2.5 outline-none focus:border-apple-blue transition bg-slate-50/50 cursor-pointer">
                <option value="nhom" selected>Lớp học nhóm (1 GV - Nhiều HS, tối đa 50)</option>
                <option value="ca_nhan">Lớp học kèm (1 kèm 1)</option>
              </select>
            </div>

            <!-- Gói học đại trà (Hiển thị khi chọn lớp nhóm) -->
            <div id="course-package-group" class="space-y-1.5">
              <label class="block font-semibold text-slate-500">Chọn Gói học / Khóa học <span class="text-rose-500 font-bold">*</span></label>
              <select id="class-course-package" class="w-full border border-slate-250 rounded-full px-4 py-2.5 outline-none focus:border-apple-blue transition bg-slate-50/50 cursor-pointer">
                <option value="">-- Chọn gói học phí --</option>
              </select>
            </div>

            <!-- Gói học kèm & Học viên đăng ký (Hiển thị khi chọn lớp kèm 1-1) -->
            <div id="tutoring-contract-group" class="hidden space-y-3">
              <div class="space-y-1.5">
                <label class="block font-semibold text-slate-500">Chọn Gói học kèm của học viên <span class="text-rose-500 font-bold">*</span></label>
                <select id="class-tutoring-select" class="w-full border border-slate-250 rounded-full px-4 py-2.5 outline-none focus:border-apple-blue transition bg-slate-50/50 cursor-pointer">
                  <option value="">-- Chọn gói kèm đang hoạt động --</option>
                </select>
                <input type="hidden" id="class-tutoring-id">
              </div>
            </div>

            <!-- Panel chọn học viên (Chỉ dành cho lớp nhóm) -->
            <div id="student-picker-panel" class="space-y-2">
              <div class="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span class="font-bold text-slate-700 text-[11px]">Học sinh trong lớp <span id="selected-count-badge" class="text-apple-blue font-extrabold">(0/50)</span></span>
                <div class="flex items-center gap-2 text-[10px]">
                  <button type="button" id="btn-select-all-students" class="text-emerald-600 font-bold uppercase hover:underline">Chọn tất cả</button>
                  <span class="text-slate-300">|</span>
                  <button type="button" id="btn-toggle-student-list" class="text-apple-blue font-bold uppercase hover:underline">Ẩn/Hiện</button>
                </div>
              </div>
              <div>
                <input type="text" id="student-search" placeholder="Tìm học viên..." class="w-full border border-slate-200 rounded-full px-4 py-2 text-xs outline-none focus:border-apple-blue transition bg-slate-50/30 mb-1.5">
              </div>
              <div id="student-picker-list" class="bg-white border border-slate-100 rounded-2xl p-3 max-h-48 overflow-y-auto space-y-1.5 shadow-inner">
                <p class="text-slate-400 italic text-center py-2">Đang tải danh sách học viên...</p>
              </div>
              <div id="selected-student-badges" class="flex flex-wrap gap-1.5 pt-1">
                <!-- Badges học sinh đã chọn -->
              </div>
            </div>

            <!-- Ngày học -->
            <div class="space-y-1.5">
              <label class="block font-semibold text-slate-500">Ngày dạy học <span class="text-rose-500 font-bold">*</span></label>
              <div id="class-date-container" class="relative">
                <input type="date" id="class-date" required min="${todayStr}" value="${todayStr}">
              </div>
            </div>

            <!-- Tự động xếp lịch cả tháng/theo gói -->
            <div class="space-y-2.5 p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
              <div class="flex items-center gap-2">
                <input type="checkbox" id="auto-schedule-month" class="rounded text-apple-blue focus:ring-apple-blue w-4 h-4 cursor-pointer">
                <label for="auto-schedule-month" class="font-bold text-slate-700 cursor-pointer select-none text-[11px]">Tự động xếp lịch nhiều buổi</label>
              </div>
              <div id="auto-schedule-options" class="hidden pl-2 space-y-2 border-l-2 border-slate-200">
                <span class="block font-bold text-slate-500 text-[10px] uppercase tracking-wider">Chọn các Thứ học cố định:</span>
                <div class="grid grid-cols-4 gap-1.5">
                  <label class="flex items-center gap-1 cursor-pointer select-none text-[10.5px] font-semibold text-slate-600">
                    <input type="checkbox" name="schedule-days" value="1" class="rounded text-apple-blue focus:ring-apple-blue w-3.5 h-3.5" checked>
                    T2
                  </label>
                  <label class="flex items-center gap-1 cursor-pointer select-none text-[10.5px] font-semibold text-slate-600">
                    <input type="checkbox" name="schedule-days" value="2" class="rounded text-apple-blue focus:ring-apple-blue w-3.5 h-3.5">
                    T3
                  </label>
                  <label class="flex items-center gap-1 cursor-pointer select-none text-[10.5px] font-semibold text-slate-600">
                    <input type="checkbox" name="schedule-days" value="3" class="rounded text-apple-blue focus:ring-apple-blue w-3.5 h-3.5" checked>
                    T4
                  </label>
                  <label class="flex items-center gap-1 cursor-pointer select-none text-[10.5px] font-semibold text-slate-600">
                    <input type="checkbox" name="schedule-days" value="4" class="rounded text-apple-blue focus:ring-apple-blue w-3.5 h-3.5">
                    T5
                  </label>
                  <label class="flex items-center gap-1 cursor-pointer select-none text-[10.5px] font-semibold text-slate-600">
                    <input type="checkbox" name="schedule-days" value="5" class="rounded text-apple-blue focus:ring-apple-blue w-3.5 h-3.5" checked>
                    T6
                  </label>
                  <label class="flex items-center gap-1 cursor-pointer select-none text-[10.5px] font-semibold text-slate-600">
                    <input type="checkbox" name="schedule-days" value="6" class="rounded text-apple-blue focus:ring-apple-blue w-3.5 h-3.5">
                    T7
                  </label>
                  <label class="flex items-center gap-1 cursor-pointer select-none text-[10.5px] font-semibold text-slate-600">
                    <input type="checkbox" name="schedule-days" value="0" class="rounded text-apple-blue focus:ring-apple-blue w-3.5 h-3.5">
                    CN
                  </label>
                </div>
              </div>
            </div>

            <!-- Giờ bắt đầu: Grid button 8h-22h -->
            <div class="space-y-1.5">
              <label class="block font-semibold text-slate-500">Giờ bắt đầu <span class="text-rose-500 font-bold">*</span></label>
              <div id="time-grid" class="grid grid-cols-4 gap-1.5">
                <!-- Sẽ render bằng JS -->
              </div>
              <input type="hidden" id="class-start" required>
            </div>

            <!-- Thời lượng -->
            <div class="space-y-1.5">
              <label class="block font-semibold text-slate-500">Thời lượng buổi học <span class="text-rose-500 font-bold">*</span></label>
              <div class="grid grid-cols-3 gap-2">
                <button type="button" class="duration-btn px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:border-apple-blue hover:bg-blue-50/50 transition active:scale-95" data-duration="60">1 tiếng</button>
                <button type="button" class="duration-btn px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:border-apple-blue hover:bg-blue-50/50 transition active:scale-95" data-duration="90">1.5 tiếng</button>
                <button type="button" class="duration-btn px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:border-apple-blue hover:bg-blue-50/50 transition active:scale-95" data-duration="120">2 tiếng</button>
              </div>
              <input type="hidden" id="class-duration" value="">
            </div>

            <!-- Giờ kết thúc (tự tính) -->
            <div id="class-end-display" class="hidden space-y-1.5">
              <label class="block font-semibold text-slate-500">Giờ kết thúc (tự tính)</label>
              <div class="bg-slate-50 border border-slate-100 rounded-full px-4 py-2.5 font-extrabold text-apple-blue text-xs select-none" id="class-end-label">--:--</div>
              <input type="hidden" id="class-end" required>
            </div>

            <button type="submit" class="w-full bg-gradient-to-r from-apple-blue to-[#0071e3]/95 hover:opacity-90 text-white font-bold py-3 rounded-full transition active:scale-95 shadow-md shadow-blue-500/15">
              Xếp lịch & Tạo lớp ngay
            </button>
          </form>
        </div>

        <!-- Danh sách lịch sử đặt lịch bên phải (chiếm 7 phần) -->
        <div class="lg:col-span-7 bg-white rounded-[24px] border border-slate-100 overflow-hidden flex flex-col shadow-sm" id="class-list-container">
          <div class="p-6 flex items-center justify-center text-slate-400 text-xs font-semibold">Đang tải lịch sử đặt lịch...</div>
        </div>
      </div>
    </div>
  `;

  const teacherSelect = document.getElementById('class-teacher');
  const classTypeSelect = document.getElementById('class-type');
  const coursePkgGroup = document.getElementById('course-package-group');
  const coursePkgSelect = document.getElementById('class-course-package');
  const tutorGroup = document.getElementById('tutoring-contract-group');
  const tutoringSelect = document.getElementById('class-tutoring-select');
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
  const openSubLists = new Set();

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
          class="time-slot-btn py-1.5 rounded-lg text-[10.5px] font-semibold transition-all duration-200 text-center border
            ${isPast ? 'bg-slate-100/50 border-slate-100 text-slate-350 cursor-not-allowed' : 
              isSelected ? 'bg-gradient-to-r from-apple-blue to-[#0071e3]/90 border-apple-blue text-white shadow-sm shadow-blue-500/25' :
              'bg-white border-slate-200 text-slate-600 hover:border-apple-blue hover:bg-blue-50/50 hover:text-apple-blue active:scale-95'}"
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

  // Khởi tạo custom date picker 3 cấp độ
  setupCustomDatePicker(
    document.getElementById('class-date'),
    document.getElementById('class-date-container'),
    {
      minDate: todayStr,
      onSelect: (val) => {
        selectedStartTime = '';
        classStartInput.value = '';
        renderTimeGrid(val);
        updateEndTime();
      }
    }
  );

  // Khởi tạo time grid với ngày hôm nay
  renderTimeGrid(todayStr);

  // Toggle hiển thị khung tự động xếp lịch cả tháng
  const autoScheduleCheck = document.getElementById('auto-schedule-month');
  const autoScheduleOptions = document.getElementById('auto-schedule-options');
  autoScheduleCheck?.addEventListener('change', (e) => {
    if (e.target.checked) {
      autoScheduleOptions.classList.remove('hidden');
    } else {
      autoScheduleOptions.classList.add('hidden');
    }
  });

  // Hàm lấy danh sách các ngày học hợp lệ theo khung (hỗ trợ sinh đủ số buổi học hoặc số tháng học)
  function getScheduleDates(startDateStr, allowedDays, limitType, limitVal) {
    const dates = [];
    
    // Check nếu allowedDays rỗng hoặc null, mặc định Thứ 2, 4, 6
    const days = (allowedDays && Array.isArray(allowedDays) && allowedDays.length > 0) 
      ? allowedDays.map(Number) 
      : [1, 3, 5];
      
    // Tránh lệch múi giờ bằng cách phân tách chuỗi YYYY-MM-DD
    const parts = startDateStr.split('-');
    const currentDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));

    const start = new Date(currentDate);

    if (limitType === 'sessions') {
      const maxSessions = parseInt(limitVal) || 10;
      while (dates.length < maxSessions) {
        const dayOfWeek = currentDate.getDay(); // 0-6 (0 là Chủ nhật, 1 là Thứ 2...)
        if (days.includes(dayOfWeek)) {
          const y = currentDate.getFullYear();
          const m = String(currentDate.getMonth() + 1).padStart(2, '0');
          const d = String(currentDate.getDate()).padStart(2, '0');
          dates.push(`${y}-${m}-${d}`);
        }
        currentDate.setDate(currentDate.getDate() + 1);
        // Chặn an toàn vòng lặp vô hạn (không quá 1 năm)
        if (dates.length >= 150 || (currentDate - start) > 365 * 24 * 60 * 60 * 1000) break;
      }
    } else {
      // limitType === 'months'
      const months = parseInt(limitVal) || 1;
      const end = new Date(start);
      end.setMonth(start.getMonth() + months);
      
      while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay();
        if (days.includes(dayOfWeek)) {
          const y = currentDate.getFullYear();
          const m = String(currentDate.getMonth() + 1).padStart(2, '0');
          const d = String(currentDate.getDate()).padStart(2, '0');
          dates.push(`${y}-${m}-${d}`);
        }
        currentDate.setDate(currentDate.getDate() + 1);
        // Chặn an toàn
        if (dates.length >= 150) break;
      }
    }
    return dates;
  }

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
    if (classTypeSelect.value === 'ca_nhan') {
      showToast('Lớp học kèm 1 kèm 1 chỉ cho phép chọn duy nhất 1 học viên', 'warning');
      return;
    }
    const visibleIds = filteredStudents.map(s => s.id);
    const allSelected = visibleIds.every(id => selectedStudentIds.includes(id));
    if (allSelected) {
      selectedStudentIds = selectedStudentIds.filter(id => !visibleIds.includes(id));
    } else {
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
      filteredStudents = [];
      renderStudentChecklist();

      const pkgRes = await fetch(`${API_BASE}/course-packages`);
      const pkgData = await pkgRes.json();
      const packages = pkgData.data || [];
      coursePkgSelect.innerHTML = '<option value="">-- Chọn gói học phí --</option>' + packages.map(p => `<option value="${p.id}" data-months="${p.so_thang}">${p.ten_goi}</option>`).join('');

      const tutorPkgRes = await fetch(`${API_BASE}/tutoring-packages`);
      const tutorPkgData = await tutorPkgRes.json();
      const tutoringPkgs = tutorPkgData.data || [];
      tutoringSelect.innerHTML = '<option value="">-- Chọn gói học kèm --</option>' + tutoringPkgs.map(p => `<option value="${p.id}">${p.ten_goi}</option>`).join('');

      // --- Tự động điền thông tin sau khi đăng ký thành công gói kèm 1-1 ---
      const autoDataStr = sessionStorage.getItem('auto_schedule_data');
      if (autoDataStr) {
        try {
          const autoData = JSON.parse(autoDataStr);
          sessionStorage.removeItem('auto_schedule_data');

          if (autoData.type === 'hoc_kem') {
            classTypeSelect.value = 'ca_nhan';
            coursePkgGroup.classList.add('hidden');
            tutorGroup.classList.remove('hidden');
            studentPickerPanel.classList.remove('hidden');
            selectAllBtn?.classList.add('hidden');

            tutoringSelect.value = autoData.goi_hoc_kem_id;
            if (autoData.giao_vien_id) {
              teacherSelect.value = autoData.giao_vien_id;
            }

            // Lọc học sinh theo gói
            filteredStudents = allStudents.filter(s => {
              const pkgIds = s.active_tutor_pkg_ids || [];
              return pkgIds.includes(autoData.goi_hoc_kem_id);
            });

            // Chọn sẵn học viên
            selectedStudentIds = [autoData.hoc_vien_id];
            
            // Lấy thông tin đăng ký học kèm chi tiết để gán vào hidden input
            const res = await fetch(`${API_BASE}/students/${autoData.hoc_vien_id}/registrations`);
            const data = await res.json();
            const activeReg = data.data?.hoc_kem?.find(r => r.goi_hoc_kem_id === autoData.goi_hoc_kem_id && r.trang_thai === 'dang_hoat_dong');
            if (activeReg) {
              tutorIdInput.value = activeReg.id;
              tutorIdInput.setAttribute('data-total-sessions', activeReg.so_buoi_dang_ky || 10);
              tutorIdInput.setAttribute('data-used-sessions', activeReg.so_buoi_da_hoc || 0);
            }

            renderStudentChecklist();
            renderSelectedBadges();
            
            showToast('Đã tự động điền sẵn thông tin học kèm vừa đăng ký!', 'success');
          }
        } catch (err) {
          console.error('Lỗi khi tự động điền thông tin xếp lịch:', err);
        }
      }
    } catch (e) {
      showToast('Không thể tải dữ liệu biểu mẫu xếp lịch', 'error');
    }
  }

  function renderStudentChecklist() {
    const isGroup = classTypeSelect.value === 'nhom';
    const pkgId = isGroup ? parseInt(coursePkgSelect.value) : parseInt(tutoringSelect.value);

    if (!pkgId) {
      studentPickerList.innerHTML = '<p class="text-slate-400 italic text-center py-2">Vui lòng chọn Gói học để hiển thị danh sách học viên.</p>';
      return;
    }

    if (filteredStudents.length === 0) {
      studentPickerList.innerHTML = '<p class="text-slate-400 italic text-center py-2">Không tìm thấy học viên nào sở hữu gói học này.</p>';
      return;
    }

    studentPickerList.innerHTML = filteredStudents.map(s => {
      const isSelected = selectedStudentIds.includes(s.id);
      return `
        <div class="flex items-center gap-2.5 hover:bg-slate-50 p-2 rounded-xl transition cursor-pointer select-none border ${isSelected ? 'border-apple-blue/20 bg-blue-50/30' : 'border-transparent'}" data-id="${s.id}">
          <div class="w-7 h-7 rounded-full overflow-hidden shadow-sm bg-slate-100 flex items-center justify-center font-bold text-slate-700 shrink-0 select-none">
            ${s.avatar_url ? `<img src="${s.avatar_url}" class="w-full h-full object-cover">` : (s.ho_ten || 'H').charAt(0)}
          </div>
          <span class="text-slate-700 font-semibold text-[11px]">${s.ho_ten}</span>
          <span class="text-[9px] text-slate-400 ml-auto font-medium">${s.trinh_do_dau_vao || ''}</span>
        </div>
      `;
    }).join('');

    selectedCountBadge.textContent = isGroup ? `(${selectedStudentIds.length}/50)` : `(${selectedStudentIds.length}/1)`;

    studentPickerList.querySelectorAll('[data-id]').forEach(el => {
      el.addEventListener('click', async () => {
        const id = parseInt(el.getAttribute('data-id'));
        const isGroup = classTypeSelect.value === 'nhom';
        
        if (isGroup) {
          if (selectedStudentIds.includes(id)) {
            selectedStudentIds = selectedStudentIds.filter(sid => sid !== id);
          } else {
            if (selectedStudentIds.length >= 50) {
              showToast('Lớp học nhóm tối đa chỉ cho phép 50 học viên!', 'error');
              return;
            }
            selectedStudentIds.push(id);
          }
        } else {
          if (selectedStudentIds.includes(id)) {
            selectedStudentIds = [];
            tutorIdInput.value = '';
          } else {
            selectedStudentIds = [id];
            const pkgId = parseInt(tutoringSelect.value);
            try {
              const res = await fetch(`${API_BASE}/students/${id}/registrations`);
              const data = await res.json();
              const activeReg = data.data?.hoc_kem?.find(r => r.goi_hoc_kem_id === pkgId && r.trang_thai === 'dang_hoat_dong');
              if (activeReg) {
                tutorIdInput.value = activeReg.id;
                tutorIdInput.setAttribute('data-total-sessions', activeReg.so_buoi_dang_ky || 10);
                tutorIdInput.setAttribute('data-used-sessions', activeReg.so_buoi_da_hoc || 0);
                
                // Tự động gán giáo viên được chỉ định sẵn của hợp đồng vào dropdown chọn Giáo viên xếp lịch
                const teacherSelect = document.getElementById('class-teacher');
                if (teacherSelect && activeReg.giao_vien_id) {
                  teacherSelect.value = activeReg.giao_vien_id;
                }
              } else {
                showToast('Học viên không có gói học kèm này đang hoạt động!', 'error');
                selectedStudentIds = [];
                tutorIdInput.value = '';
              }
            } catch (err) {
              showToast('Lỗi tải thông tin đăng ký của học viên', 'error');
              selectedStudentIds = [];
              tutorIdInput.value = '';
            }
          }
        }
        
        selectedCountBadge.textContent = isGroup ? `(${selectedStudentIds.length}/50)` : `(${selectedStudentIds.length}/1)`;
        renderStudentChecklist();
        renderSelectedBadges();
      });
    });
  }

  function renderSelectedBadges() {
    selectedBadges.innerHTML = selectedStudentIds.map(id => {
      const student = allStudents.find(s => s.id === id);
      if (!student) return '';
      return `
        <span class="inline-flex items-center gap-1.5 bg-blue-50 text-apple-blue font-bold px-3 py-1 rounded-full text-[10px] border border-blue-100/50 shadow-sm">
          ${student.ho_ten}
          <button type="button" class="btn-remove-selected text-red-500 hover:text-red-700 font-extrabold focus:outline-none ml-0.5 text-xs" data-id="${id}">×</button>
        </span>
      `;
    }).join('');

    selectedBadges.querySelectorAll('.btn-remove-selected').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'));
        selectedStudentIds = selectedStudentIds.filter(sid => sid !== id);
        if (classTypeSelect.value !== 'nhom') {
          tutorIdInput.value = '';
        }
        renderStudentChecklist();
        renderSelectedBadges();
      });
    });
  }

  // Chuyển đổi giao diện khi thay đổi loại lớp
  classTypeSelect?.addEventListener('change', () => {
    const val = classTypeSelect.value;
    selectedStudentIds = [];
    filteredStudents = [];
    tutorIdInput.value = '';
    renderStudentChecklist();
    renderSelectedBadges();

    if (val === 'nhom') {
      coursePkgGroup.classList.remove('hidden');
      tutorGroup.classList.add('hidden');
      studentPickerPanel.classList.remove('hidden');
      selectAllBtn?.classList.remove('hidden');
      coursePkgSelect.value = '';
    } else {
      coursePkgGroup.classList.add('hidden');
      tutorGroup.classList.remove('hidden');
      studentPickerPanel.classList.remove('hidden');
      selectAllBtn?.classList.add('hidden');
      tutoringSelect.value = '';
    }
  });

  // Lọc học viên theo gói học đã chọn
  coursePkgSelect?.addEventListener('change', () => {
    const pkgId = parseInt(coursePkgSelect.value);
    selectedStudentIds = []; // Reset danh sách chọn
    if (!pkgId) {
      filteredStudents = [];
    } else {
      filteredStudents = allStudents.filter(s => {
        const pkgIds = s.active_course_pkg_ids || [];
        return pkgIds.includes(pkgId);
      });
    }
    renderStudentChecklist();
    renderSelectedBadges();
  });

  // Lọc học viên theo gói học kèm đã chọn
  tutoringSelect?.addEventListener('change', () => {
    const pkgId = parseInt(tutoringSelect.value);
    selectedStudentIds = []; // Reset danh sách chọn
    tutorIdInput.value = '';
    if (!pkgId) {
      filteredStudents = [];
    } else {
      filteredStudents = allStudents.filter(s => {
        const pkgIds = s.active_tutor_pkg_ids || [];
        return pkgIds.includes(pkgId);
      });
    }
    renderStudentChecklist();
    renderSelectedBadges();
  });

  // Hàm mở Modal sửa ca học custom chặn ngày giờ quá khứ
  function openEditSessionModal(item) {
    let editModal = document.getElementById('edit-session-modal');
    if (!editModal) {
      editModal = document.createElement('div');
      editModal.id = 'edit-session-modal';
      editModal.className = 'fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden';
      document.body.appendChild(editModal);
    }

    const todayStr = new Date().toLocaleDateString('sv-SE');
    const itemNgayStr = item.ngay_hoc ? item.ngay_hoc.substring(0, 10) : todayStr;

    // Tính duration cũ của ca học
    let oldDuration = 90;
    if (item.gio_bat_dau && item.gio_ket_thuc) {
      const [sh, sm] = item.gio_bat_dau.split(':').map(Number);
      const [eh, em] = item.gio_ket_thuc.split(':').map(Number);
      oldDuration = (eh * 60 + em) - (sh * 60 + sm);
    }

    // Render form sửa đổi
    editModal.innerHTML = `
      <div class="bg-white rounded-3xl max-w-md w-full border border-[#e2e2e4] shadow-2xl p-4 space-y-2.5 animate-in fade-in duration-150 text-xs max-h-[92vh] overflow-y-auto">
        <div class="flex justify-between items-center pb-2 border-b border-apple-divider/40">
          <h3 class="font-bold text-apple-ink text-sm flex items-center gap-1.5">
            <span class="material-symbols-outlined text-apple-blue text-[18px]">edit_calendar</span>
            ${(item.type === 'nhom' || item.type === 'ca_nhan') ? 'Chỉnh sửa chuỗi ca học' : 'Chỉnh sửa ca học đơn lẻ'} (${item.type === 'nhom' || item.type === 'nhom_don_le' ? 'Lớp nhóm' : 'Học kèm'})
          </h3>
          <button type="button" id="btn-close-edit-session" class="p-1 hover:bg-slate-100 rounded-full flex items-center justify-center">
            <span class="material-symbols-outlined text-[16px] text-slate-400">close</span>
          </button>
        </div>
        
        <form id="edit-session-form" class="space-y-3">
          <p class="text-[10px] text-amber-600 bg-amber-50 p-2 rounded-xl border border-amber-200/50 font-semibold leading-relaxed">
            * Lưu ý: Hệ thống sẽ áp dụng giờ học, thời lượng và giáo viên giảng dạy mới cho toàn bộ các ca học <strong>chưa diễn ra (chờ học)</strong> của chuỗi lớp học này.
          </p>

          <!-- Ngày học (Mốc bắt đầu đổi hoặc ngày đơn lẻ) -->
          <div class="${(item.type === 'nhom' || item.type === 'ca_nhan') ? 'hidden' : ''}">
            <label class="block font-semibold text-slate-600 mb-0.5">Ngày dạy học <span class="text-rose-500 font-bold">*</span></label>
            <div id="edit-class-date-container" class="relative">
              <input type="date" id="edit-class-date" required min="${todayStr}" value="${itemNgayStr}">
            </div>
          </div>

          <!-- Chọn Giáo viên giảng dạy -->
          <div>
            <label class="block font-semibold text-slate-600 mb-0.5">Giáo viên giảng dạy <span class="text-rose-500 font-bold">*</span></label>
            <select id="edit-class-teacher" required class="w-full border border-apple-divider rounded-full px-3 py-1.5 outline-none focus:border-apple-blue transition bg-white cursor-pointer">
              <option value="">Đang tải danh sách giáo viên...</option>
            </select>
          </div>

          <!-- Giờ bắt đầu -->
          <div>
            <label class="block font-semibold text-slate-600 mb-0.5">Giờ bắt đầu <span class="text-rose-500 font-bold">*</span></label>
            <div id="edit-time-grid" class="grid grid-cols-4 gap-1">
              <!-- Rendered by JS -->
            </div>
            <input type="hidden" id="edit-class-start" value="${item.gio_bat_dau.slice(0, 5)}" required>
          </div>

          <!-- Thời lượng & Giờ kết thúc tự tính (Gộp Grid 2 cột) -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-600 mb-0.5">Thời lượng buổi học <span class="text-rose-500 font-bold">*</span></label>
              <div class="grid grid-cols-3 gap-1">
                <button type="button" class="edit-duration-btn px-1 py-1.5 rounded-lg border-2 transition font-bold text-[10px] text-center" data-duration="60">1 tiếng</button>
                <button type="button" class="edit-duration-btn px-1 py-1.5 rounded-lg border-2 transition font-bold text-[10px] text-center" data-duration="90">1.5 tiếng</button>
                <button type="button" class="edit-duration-btn px-1 py-1.5 rounded-lg border-2 transition font-bold text-[10px] text-center" data-duration="120">2 tiếng</button>
              </div>
              <input type="hidden" id="edit-class-duration" value="${oldDuration}">
            </div>

            <div>
              <label class="block font-semibold text-slate-600 mb-0.5">Giờ kết thúc (tự tính)</label>
              <div class="bg-slate-50 border border-apple-divider rounded-full px-3 py-1.5 font-bold text-apple-blue text-center text-xs h-[30px] flex items-center justify-center" id="edit-class-end-label">--:--</div>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-apple-divider/40">
            <button type="button" id="btn-cancel-edit-session" class="px-4 py-1.5 border border-[#e2e2e4] rounded-full hover:bg-slate-50 font-semibold active:scale-95 transition">Hủy bỏ</button>
            <button type="submit" class="px-5 py-1.5 bg-apple-blue text-white rounded-full hover:opacity-90 font-semibold active:scale-95 transition shadow-sm">Cập nhật lịch</button>
          </div>
        </form>
      </div>
    `;

    editModal.classList.remove('hidden');

    const form = editModal.querySelector('#edit-session-form');
    const startInput = editModal.querySelector('#edit-class-start');
    const durationInput = editModal.querySelector('#edit-class-duration');
    const timeGridEl = editModal.querySelector('#edit-time-grid');
    const endLabel = editModal.querySelector('#edit-class-end-label');
    const editTeacherSelect = editModal.querySelector('#edit-class-teacher');
    const dateInput = editModal.querySelector('#edit-class-date');

    let currentSelStart = startInput.value;
    let currentSelDuration = parseInt(durationInput.value) || 90;

    // Load giáo viên lên Modal
    async function loadEditTeachers() {
      try {
        const res = await fetch(`${API_BASE}/teachers`);
        const data = await res.json();
        const teachers = data.data || [];
        editTeacherSelect.innerHTML = teachers.map(t => 
          `<option value="${t.id}" ${t.id === item.giao_vien_id ? 'selected' : ''}>${t.ho_ten}${t.chuyen_mon ? ' (' + t.chuyen_mon + ')' : ''}</option>`
        ).join('');
      } catch (err) {
        editTeacherSelect.innerHTML = '<option value="">Lỗi tải danh sách giáo viên</option>';
      }
    }
    loadEditTeachers();

    // Render duration button active state
    const updateDurationBtns = () => {
      editModal.querySelectorAll('.edit-duration-btn').forEach(btn => {
        const d = parseInt(btn.getAttribute('data-duration'));
        if (d === currentSelDuration) {
          btn.className = 'edit-duration-btn px-1 py-1 rounded-lg border-2 border-apple-blue bg-blue-50 text-apple-blue font-bold transition text-[10px] text-center';
        } else {
          btn.className = 'edit-duration-btn px-1 py-1 rounded-lg border-2 border-apple-divider bg-white text-slate-600 hover:border-apple-blue hover:bg-blue-50 transition text-[10px] text-center';
        }
      });
    };

    updateDurationBtns();

    // Render time grid
    const renderEditTimeGrid = () => {
      const now = new Date();
      const isToday = dateInput.value === now.toISOString().split('T')[0];
      const currentH = now.getHours();
      const currentM = now.getMinutes();

      const slots = [];
      for (let h = 8; h <= 22; h++) {
        for (let m = 0; m < 60; m += 30) {
          if (h === 22 && m > 0) break;
          slots.push({ h, m });
        }
      }

      timeGridEl.innerHTML = slots.map(({ h, m }) => {
        const label = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const isPast = isToday && (h < currentH || (h === currentH && m <= currentM));
        const isSelected = label === currentSelStart;
        return `
          <button type="button" 
            class="edit-time-slot-btn py-1.5 rounded-xl text-[10px] font-bold transition text-center border-2 
              ${isPast ? 'bg-slate-100 border-slate-100 text-slate-300 cursor-not-allowed' : 
                isSelected ? 'bg-apple-blue border-apple-blue text-white shadow-sm' :
                'bg-white border-apple-divider text-slate-600 hover:border-apple-blue hover:bg-blue-50 active:scale-95'}"
            data-time="${label}" ${isPast ? 'disabled' : ''}
          >${label}</button>
        `;
      }).join('');

      timeGridEl.querySelectorAll('.edit-time-slot-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () => {
          currentSelStart = btn.getAttribute('data-time');
          startInput.value = currentSelStart;
          renderEditTimeGrid();
          updateEndTime();
        });
      });
    };

    const updateEndTime = () => {
      if (!currentSelStart || !currentSelDuration) {
        endLabel.textContent = '--:--';
        return;
      }
      const [h, m] = currentSelStart.split(':').map(Number);
      const totalMin = h * 60 + m + currentSelDuration;
      const endH = Math.floor(totalMin / 60);
      const endM = totalMin % 60;
      if (endH > 22 || (endH === 22 && endM > 0)) {
        showToast('Giờ kết thúc vượt quá 22:00, vui lòng chọn giờ bắt đầu sớm hơn', 'error');
        endLabel.textContent = '--:--';
        return;
      }
      const endStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      endLabel.textContent = endStr;
    };

    // Khởi tạo date picker custom cho Modal sửa
    setupCustomDatePicker(
      dateInput,
      editModal.querySelector('#edit-class-date-container'),
      {
        minDate: todayStr,
        onSelect: (val) => {
          const now = new Date();
          const isToday = val === now.toISOString().split('T')[0];
          if (isToday && currentSelStart) {
            const [sh, sm] = currentSelStart.split(':').map(Number);
            if (sh < now.getHours() || (sh === now.getHours() && sm <= now.getMinutes())) {
              currentSelStart = '';
              startInput.value = '';
            }
          }
          renderEditTimeGrid();
          updateEndTime();
        }
      }
    );

    renderEditTimeGrid();
    updateEndTime();

    // Click duration
    editModal.querySelectorAll('.edit-duration-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentSelDuration = parseInt(btn.getAttribute('data-duration'));
        durationInput.value = currentSelDuration;
        updateDurationBtns();
        updateEndTime();
      });
    });

    // Close events
    const closeModal = () => editModal.classList.add('hidden');
    editModal.querySelector('#btn-close-edit-session').addEventListener('click', closeModal);
    editModal.querySelector('#btn-cancel-edit-session').addEventListener('click', closeModal);

    // Submit form
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const updatedNgay = dateInput.value;
      const updatedStart = startInput.value;
      const updatedEnd = endLabel.textContent;
      const updatedGv = editTeacherSelect.value;

      if (!updatedNgay) {
        showToast('Vui lòng chọn ngày học!', 'error');
        return;
      }
      if (!updatedStart || updatedEnd === '--:--') {
        showToast('Vui lòng chọn giờ học hợp lệ!', 'error');
        return;
      }
      if (!updatedGv) {
        showToast('Vui lòng chọn giáo viên giảng dạy!', 'error');
        return;
      }

      // Check quá khứ trên frontend
      const targetDateTime = new Date(`${updatedNgay}T${updatedStart}:00`);
      if (targetDateTime < new Date()) {
        showToast('Không được chọn lịch học ở thời điểm quá khứ!', 'error');
        return;
      }

      const isGroup = item.type === 'nhom';
      const isSingleTutor = item.type === 'ca_nhan_don_le';
      const isSingleGroup = item.type === 'nhom_don_le';
      
      const url = isGroup 
        ? `${API_BASE}/classes/${item.id}` 
        : isSingleTutor
          ? `${API_BASE}/schedule/${item.id}`
          : isSingleGroup
            ? `${API_BASE}/classes/schedule/${item.id}`
            : `${API_BASE}/schedule/by-contract/${item.dang_ky_hoc_kem_id}/update-batch`;

      const bodyPayload = {
        ngay_hoc: updatedNgay,
        gio_bat_dau: updatedStart,
        gio_ket_thuc: updatedEnd,
        giao_vien_id: parseInt(updatedGv)
      };

      try {
        const editRes = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'X-User-Role': 'le_tan' },
          body: JSON.stringify(bodyPayload)
        });
        const result = await editRes.json();
        if (result.success) {
          showToast((isSingleTutor || isSingleGroup) ? 'Cập nhật ca học thành công!' : 'Cập nhật chuỗi lịch học thành công!');
          closeModal();
          loadScheduleList();
        } else {
          showToast(result.error || 'Lỗi khi cập nhật lịch', 'error');
        }
      } catch (err) {
        showToast('Lỗi kết nối máy chủ', 'error');
      }
    });
  }

  // Tải danh sách lịch học & lớp học nhóm
  async function loadScheduleList() {
    const schList = document.getElementById('class-list-container');
    if (!schList) return;
    try {
      const [schedulesRes, classesRes, classSchedulesRes] = await Promise.all([
        fetch(`${API_BASE}/schedules`).then(r => r.json()),
        fetch(`${API_BASE}/classes`).then(r => r.json()),
        fetch(`${API_BASE}/classes/schedules`).then(r => r.json())
      ]);
      const schedules = schedulesRes.data || [];
      const classesList = classesRes.data || [];
      const classSchedules = classSchedulesRes.data || [];

      // Gộp các ca học
      const allSessions = [];
      
      // Group các ca của lớp nhóm theo lop_hoc_id
      const groupSchedulesByClass = {};
      classSchedules.forEach(item => {
        if (!groupSchedulesByClass[item.lop_hoc_id]) {
          groupSchedulesByClass[item.lop_hoc_id] = [];
        }
        groupSchedulesByClass[item.lop_hoc_id].push(item);
      });

      classesList.forEach(item => {
        const classSessions = groupSchedulesByClass[item.id] || [];
        
        const totalClassSessions = classSessions.length;
        const finishedClassSessions = classSessions.filter(s => s.trang_thai === 'da_hoc').length;
        const pendingClassSessions = classSessions.filter(s => s.trang_thai === 'cho_hoc').length;

        // Nếu sĩ số = 0 VÀ không có ca học chờ dạy (hoặc không có ca học nào), ta bỏ qua không hiển thị lớp học này nữa
        const currentSiSo = parseInt(item.si_so || 0, 10);
        if (currentSiSo === 0 && pendingClassSessions === 0) {
          return;
        }

        // Tính khoảng ngày bắt đầu - kết thúc
        let minNgayStr = '';
        let maxNgayStr = '';
        let ngayGopText = '—';
        if (classSessions.length > 0) {
          const sortedClass = [...classSessions].sort((a, b) => a.ngay_hoc.localeCompare(b.ngay_hoc));
          minNgayStr = sortedClass[0].ngay_hoc ? sortedClass[0].ngay_hoc.substring(0, 10).split('-').reverse().join('/') : '';
          maxNgayStr = sortedClass[sortedClass.length - 1].ngay_hoc ? sortedClass[sortedClass.length - 1].ngay_hoc.substring(0, 10).split('-').reverse().join('/') : '';
          ngayGopText = minNgayStr === maxNgayStr ? minNgayStr : `${minNgayStr} - ${maxNgayStr}`;
        } else if (item.ngay_hoc) {
          ngayGopText = item.ngay_hoc.substring(0, 10).split('-').reverse().join('/');
        }

        // Lấy danh sách các thứ duy nhất của lớp nhóm
        const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const uniqueDaysSet = new Set();
        classSessions.forEach(s => {
          if (s.ngay_hoc) {
            const d = new Date(s.ngay_hoc);
            uniqueDaysSet.add(d.getDay()); // 0-6
          }
        });
        const sortedUniqueDays = Array.from(uniqueDaysSet).sort((a, b) => {
          const valA = a === 0 ? 7 : a;
          const valB = b === 0 ? 7 : b;
          return valA - valB;
        });
        const thuGopLabel = sortedUniqueDays.length > 0 
          ? sortedUniqueDays.map(d => dayLabels[d]).join(', ') 
          : (item.ngay_hoc ? getDayOfWeekLabel(item.ngay_hoc) : '—');


        allSessions.push({
          id: item.id,
          type: 'nhom',
          title: item.ten_lop,
          detail: `Gói: ${item.ten_goi_hoc_phi || 'Tự chọn'} (Đã xếp ${totalClassSessions} buổi)`,
          ngay_hoc: classSessions[0]?.ngay_hoc || item.ngay_hoc,
          ngay_hoc_gop: ngayGopText,
          thu_gop: thuGopLabel,
          gio_bat_dau: item.gio_bat_dau || '',
          gio_ket_thuc: item.gio_ket_thuc || '',
          ten_giao_vien: item.ten_giao_vien,
          giao_vien_id: item.giao_vien_id,
          si_so: item.si_so || 0,
          trang_thai: pendingClassSessions > 0 ? 'cho_hoc' : 'da_hoc',
          trang_thai_label: pendingClassSessions > 0 ? 'Đang hoạt động' : 'Hoàn thành',
          trang_thai_class: pendingClassSessions > 0 ? 'bg-blue-50 text-apple-blue border border-blue-200' : 'bg-emerald-100 text-emerald-800',
          tu_ngay: item.tu_ngay,
          den_ngay: item.den_ngay,
          classSessions: classSessions
        });
      });

      // Group các ca học kèm theo dang_ky_hoc_kem_id
      const tutoringGroups = {};
      schedules.forEach(item => {
        // Chỉ gộp ca học kèm (loại ca_nhan)
        if (item.loai_buoi === 'ca_nhan') {
          const key = item.dang_ky_hoc_kem_id || `temp-${Date.now()}-${Math.random()}`;
          if (!tutoringGroups[key]) {
            tutoringGroups[key] = [];
          }
          tutoringGroups[key].push(item);
        }
      });

      // Map các group học kèm thành từng dòng lịch gộp duy nhất
      Object.keys(tutoringGroups).forEach(key => {
        const group = tutoringGroups[key];
        if (group.length === 0) return;

        // Tìm MIN, MAX ngày học
        const sortedGroup = [...group].sort((a, b) => a.ngay_hoc.localeCompare(b.ngay_hoc));
        const firstSession = sortedGroup[0];
        const lastSession = sortedGroup[sortedGroup.length - 1];

        const minNgayStr = firstSession.ngay_hoc ? firstSession.ngay_hoc.substring(0, 10).split('-').reverse().join('/') : '';
        const maxNgayStr = lastSession.ngay_hoc ? lastSession.ngay_hoc.substring(0, 10).split('-').reverse().join('/') : '';
        const ngayGopText = minNgayStr === maxNgayStr ? minNgayStr : `${minNgayStr} - ${maxNgayStr}`;

        // Lấy danh sách các thứ duy nhất
        const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const uniqueDaysSet = new Set();
        group.forEach(s => {
          if (s.ngay_hoc) {
            const d = new Date(s.ngay_hoc);
            uniqueDaysSet.add(d.getDay()); // 0-6
          }
        });
        const sortedUniqueDays = Array.from(uniqueDaysSet).sort((a, b) => {
          // Xếp Thứ 2 -> Chủ nhật
          const valA = a === 0 ? 7 : a;
          const valB = b === 0 ? 7 : b;
          return valA - valB;
        });
        const thuGopLabel = sortedUniqueDays.map(d => dayLabels[d]).join(', ');

        // Thống kê số buổi đã học, chưa học của đợt xếp này
        const totalSessions = group.length;
        const finishedSessions = group.filter(s => s.trang_thai === 'da_hoc').length;
        const pendingSessions = group.filter(s => s.trang_thai === 'cho_hoc').length;

        allSessions.push({
          id: firstSession.id, // dùng id ca học đầu tiên
          dang_ky_hoc_kem_id: firstSession.dang_ky_hoc_kem_id,
          type: 'ca_nhan',
          title: `Học kèm: ${firstSession.ten_hoc_vien}`,
          detail: `Đã xếp ${totalSessions} buổi (Đã học: ${finishedSessions}, Chờ học: ${pendingSessions})`,
          ngay_hoc: firstSession.ngay_hoc, // lấy ngày đầu làm mốc sort
          ngay_hoc_gop: ngayGopText,
          thu_gop: thuGopLabel || '—',
          gio_bat_dau: firstSession.gio_bat_dau || '',
          gio_ket_thuc: firstSession.gio_ket_thuc || '',
          ten_giao_vien: firstSession.ten_giao_vien,
          giao_vien_id: firstSession.giao_vien_id,
          si_so: 1,
          trang_thai: pendingSessions > 0 ? 'cho_hoc' : 'da_hoc',
          trang_thai_label: pendingSessions > 0 ? 'Đang tiến hành' : 'Hoàn thành',
          trang_thai_class: pendingSessions > 0 ? 'bg-blue-50 text-apple-blue border border-blue-200' : 'bg-emerald-100 text-emerald-800',
          tu_ngay: firstSession.tu_ngay,
          den_ngay: firstSession.den_ngay,
          pendingSessionsCount: pendingSessions
        });
      });

      // Sắp xếp: theo ngày học tăng dần (ngày sớm ở trên), nếu trùng ngày sắp xếp theo giờ bắt đầu tăng dần
      allSessions.sort((a, b) => {
        const dateAStr = a.ngay_hoc ? a.ngay_hoc.substring(0, 10) : '';
        const dateBStr = b.ngay_hoc ? b.ngay_hoc.substring(0, 10) : '';
        if (dateAStr !== dateBStr) {
          return dateAStr.localeCompare(dateBStr);
        }
        return a.gio_bat_dau.localeCompare(b.gio_bat_dau);
      });

      // Hàm helper xác định thứ trong tuần dựa trên ngày yyyy-mm-dd
      function getDayOfWeekLabel(dateStr) {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        const day = date.getDay(); // 0: Chủ nhật, 1: Thứ 2...
        if (day === 0) return 'Chủ Nhật';
        return `Thứ ${day + 1}`;
      }

      let rows = '';
      allSessions.forEach((item, index) => {
        const ngayHocStr = item.ngay_hoc ? item.ngay_hoc.substring(0, 10).split('-').reverse().join('/') : '—';
        
        // Tính khoảng ngày bắt đầu - kết thúc
        let dateRangeStr = '';
        if (item.tu_ngay) {
          const startFmt = item.tu_ngay.substring(0, 10).split('-').reverse().join('/');
          let endFmt = 'vô hạn';
          if (item.den_ngay) {
            endFmt = item.den_ngay.substring(0, 10).split('-').reverse().join('/');
          } else if (item.type === 'ca_nhan') {
            endFmt = 'Theo số buổi';
          }
          dateRangeStr = `<div class="text-[9.5px] text-emerald-600 font-bold mt-0.5">Thời hạn: ${startFmt} - ${endFmt}</div>`;
        }

        const isGroup = item.type === 'nhom';
        const thuLabel = isGroup ? getDayOfWeekLabel(item.ngay_hoc) : item.thu_gop;
        const gioHocStr = (item.gio_bat_dau && item.gio_ket_thuc) ? `${item.gio_bat_dau.slice(0, 5)} - ${item.gio_ket_thuc.slice(0, 5)}` : '—';

        if (isGroup) {
          // Lớp nhóm: hiển thị accordion xem chi tiết các ca của lớp nhóm
          const groupSessions = [...(item.classSessions || [])].sort((a, b) => a.ngay_hoc.localeCompare(b.ngay_hoc));
          
          let subRowsHtml = '';
          groupSessions.forEach((sub, subIdx) => {
            const subNgayStr = sub.ngay_hoc ? sub.ngay_hoc.substring(0, 10).split('-').reverse().join('/') : '—';
            const subThu = getDayOfWeekLabel(sub.ngay_hoc);
            const subGio = (sub.gio_bat_dau && sub.gio_ket_thuc) ? `${sub.gio_bat_dau.slice(0, 5)} - ${sub.gio_ket_thuc.slice(0, 5)}` : '—';
            
            let subStatusLabel = 'Chờ học';
            let subStatusClass = 'bg-yellow-50 text-yellow-800 border border-yellow-200';

            if (sub.trang_thai === 'da_hoc') {
              subStatusLabel = 'Đã học';
              subStatusClass = 'bg-emerald-100 text-emerald-800';
            } else if (sub.trang_thai === 'vang') {
              subStatusLabel = 'Vắng';
              subStatusClass = 'bg-rose-100 text-rose-800';
            } else if (sub.trang_thai === 'cho_hoc') {
              const now = new Date();
              const datePart = sub.ngay_hoc.substring(0, 10);
              const startTime = new Date(`${datePart}T${sub.gio_bat_dau.slice(0, 5)}`);
              const endTime = new Date(`${datePart}T${sub.gio_ket_thuc.slice(0, 5)}`);
              if (now >= startTime && now <= endTime) {
                subStatusLabel = 'Đang học';
                subStatusClass = 'bg-blue-50 text-apple-blue border border-blue-200';
              }
            }

            subRowsHtml += `
              <div class="flex items-center justify-between py-2 border-b border-apple-divider/30 last:border-0 hover:bg-slate-50 px-2 rounded-lg">
                <div class="space-y-0.5">
                  <div class="font-bold text-slate-700">Buổi ${subIdx + 1}: ${subNgayStr} (${subThu})</div>
                  <div class="text-[10px] text-slate-400">Giáo viên: ${sub.ten_giao_vien || item.ten_giao_vien || 'Chưa gán'}</div>
                </div>
                <div class="font-bold text-slate-600">${subGio}</div>
                <div>
                  <span class="px-2 py-0.5 rounded-full text-[9px] font-bold ${subStatusClass}">${subStatusLabel}</span>
                </div>
                <div class="flex gap-2">
                  ${sub.trang_thai === 'cho_hoc' ? `
                    <button type="button" class="btn-edit-single-session text-apple-blue hover:underline font-bold text-[10px]" data-sub-id="${sub.id}" data-contract-id="${item.id}">Sửa</button>
                    <button type="button" class="btn-delete-single-session text-red-600 hover:underline font-bold text-[10px]" data-sub-id="${sub.id}" data-contract-id="${item.id}">Hủy</button>
                  ` : `
                    <span class="text-[9px] text-slate-400 font-semibold italic">Đã dạy</span>
                  `}
                </div>
              </div>
            `;
          });

          const targetId = `sub-list-class-${item.id}`;
          const isOpen = openSubLists.has(targetId);

          rows += `
            <tr class="hover:bg-slate-50 border-b border-apple-divider/40 transition text-xs">
              <td class="px-5 py-3.5">
                <div class="font-bold text-apple-ink">${item.title}</div>
                <div class="text-[9.5px] text-slate-500 mt-0.5 font-semibold flex items-center gap-1.5">
                  ${item.detail}
                  <button type="button" class="btn-toggle-sub-sessions text-apple-blue hover:underline flex items-center font-bold text-[10px]" data-target-id="${targetId}">
                    <span class="material-symbols-outlined text-[14px]">${isOpen ? 'unfold_less' : 'unfold_more'}</span>Xem chi tiết ca
                  </button>
                </div>
                ${dateRangeStr}
                <div class="text-[9.5px] text-slate-400 mt-0.5">Lịch dạy: ${item.ngay_hoc_gop}</div>
              </td>
              <td class="px-5 py-3.5 text-slate-600 font-semibold">${item.thu_gop}</td>
              <td class="px-5 py-3.5 font-bold text-apple-blue whitespace-nowrap">${gioHocStr} (${item.si_so}/50 HS)</td>
              <td class="px-5 py-3.5 whitespace-nowrap">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${item.trang_thai_class}">${item.trang_thai_label}</span>
              </td>
              <td class="px-5 py-3.5 text-right whitespace-nowrap">
                <button type="button" class="btn-edit-session text-apple-blue hover:underline font-bold mr-2 text-[11px]" data-idx="${index}">Sửa</button>
                <button type="button" class="btn-delete-session text-red-600 hover:underline font-bold text-[11px]" data-type="nhom" data-id="${item.id}">Hủy</button>
              </td>
            </tr>
            <tr id="${targetId}" class="${isOpen ? '' : 'hidden'} bg-slate-50/50 border-b border-apple-divider/40">
              <td colspan="5" class="px-6 py-3">
                <div class="bg-white rounded-2xl border border-apple-divider/50 p-3 shadow-inner space-y-1.5 max-h-60 overflow-y-auto">
                  <div class="text-[10px] uppercase font-bold text-slate-400 border-b pb-1 mb-1.5 flex justify-between items-center">
                    <span>Danh sách chi tiết ca học lớp nhóm</span>
                    <span class="text-apple-blue font-bold">${groupSessions.length} buổi học</span>
                  </div>
                  ${subRowsHtml}
                </div>
              </td>
            </tr>
          `;
        } else {
          // Lớp kèm: lấy danh sách các ca học chi tiết của group này để chuẩn bị render accordion
          const groupSessions = [...(tutoringGroups[item.dang_ky_hoc_kem_id] || [])].sort((a, b) => a.ngay_hoc.localeCompare(b.ngay_hoc));
          
          let subRowsHtml = '';
          groupSessions.forEach((sub, subIdx) => {
            const subNgayStr = sub.ngay_hoc ? sub.ngay_hoc.substring(0, 10).split('-').reverse().join('/') : '—';
            const subThu = getDayOfWeekLabel(sub.ngay_hoc);
            const subGio = (sub.gio_bat_dau && sub.gio_ket_thuc) ? `${sub.gio_bat_dau.slice(0, 5)} - ${sub.gio_ket_thuc.slice(0, 5)}` : '—';
            
            let subStatusLabel = 'Chờ học';
            let subStatusClass = 'bg-yellow-50 text-yellow-800 border border-yellow-200';

            if (sub.trang_thai === 'da_hoc') {
              subStatusLabel = 'Đã học';
              subStatusClass = 'bg-emerald-100 text-emerald-800';
            } else if (sub.trang_thai === 'vang') {
              subStatusLabel = 'Vắng';
              subStatusClass = 'bg-rose-100 text-rose-800';
            } else if (sub.trang_thai === 'cho_hoc') {
              const now = new Date();
              const datePart = sub.ngay_hoc.substring(0, 10);
              const startTime = new Date(`${datePart}T${sub.gio_bat_dau.slice(0, 5)}`);
              const endTime = new Date(`${datePart}T${sub.gio_ket_thuc.slice(0, 5)}`);
              if (now >= startTime && now <= endTime) {
                subStatusLabel = 'Đang học';
                subStatusClass = 'bg-blue-50 text-apple-blue border border-blue-200';
              }
            }

            subRowsHtml += `
              <div class="flex items-center justify-between py-2 border-b border-apple-divider/30 last:border-0 hover:bg-slate-50 px-2 rounded-lg">
                <div class="space-y-0.5">
                  <div class="font-bold text-slate-700">Buổi ${subIdx + 1}: ${subNgayStr} (${subThu})</div>
                  <div class="text-[10px] text-slate-400">Giáo viên: ${sub.ten_giao_vien || 'Chưa gán'}</div>
                </div>
                <div class="font-bold text-slate-600">${subGio}</div>
                <div>
                  <span class="px-2 py-0.5 rounded-full text-[9px] font-bold ${subStatusClass}">${subStatusLabel}</span>
                </div>
                <div class="flex gap-2">
                  ${sub.trang_thai === 'cho_hoc' ? `
                    <button type="button" class="btn-edit-single-session text-apple-blue hover:underline font-bold text-[10px]" data-sub-id="${sub.id}" data-contract-id="${item.dang_ky_hoc_kem_id}">Sửa</button>
                    <button type="button" class="btn-delete-single-session text-red-600 hover:underline font-bold text-[10px]" data-sub-id="${sub.id}" data-contract-id="${item.dang_ky_hoc_kem_id}">Hủy</button>
                  ` : `
                    <span class="text-[9px] text-slate-400 font-semibold italic">Đã chốt ca</span>
                  `}
                </div>
              </div>
            `;
          });

          const hasPending = item.pendingSessionsCount > 0;
          const targetId = `sub-list-${item.dang_ky_hoc_kem_id}`;
          const isOpen = openSubLists.has(targetId);

          rows += `
            <tr class="hover:bg-slate-50 border-b border-apple-divider/40 transition text-xs">
              <td class="px-5 py-3.5">
                <div class="font-bold text-apple-ink">${item.title}</div>
                <div class="text-[9.5px] text-slate-500 mt-0.5 font-semibold flex items-center gap-1.5">
                  ${item.detail}
                  <button type="button" class="btn-toggle-sub-sessions text-apple-blue hover:underline flex items-center font-bold text-[10px]" data-target-id="${targetId}">
                    <span class="material-symbols-outlined text-[14px]">${isOpen ? 'unfold_less' : 'unfold_more'}</span>Xem chi tiết ca
                  </button>
                </div>
                ${dateRangeStr}
                <div class="text-[9.5px] text-slate-400 mt-0.5">Lịch học: ${item.ngay_hoc_gop}</div>
              </td>
              <td class="px-5 py-3.5 text-slate-600 font-semibold">${thuLabel}</td>
              <td class="px-5 py-3.5 font-bold text-slate-700 whitespace-nowrap">${gioHocStr}</td>
              <td class="px-5 py-3.5 whitespace-nowrap">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${item.trang_thai_class}">${item.trang_thai_label}</span>
              </td>
              <td class="px-5 py-3.5 text-right whitespace-nowrap">
                ${hasPending ? `
                  <button type="button" class="btn-edit-session text-apple-blue hover:underline font-bold mr-2 text-[11px]" data-idx="${index}">Sửa chung</button>
                  <button type="button" class="btn-delete-session text-red-600 hover:underline font-bold text-[11px]" data-type="ca_nhan" data-contract-id="${item.dang_ky_hoc_kem_id}">Hủy hết</button>
                ` : `
                  <span class="text-[10px] text-slate-400 italic font-semibold">Không còn ca chờ học</span>
                `}
              </td>
            </tr>
            <tr id="${targetId}" class="${isOpen ? '' : 'hidden'} bg-slate-50/50 border-b border-apple-divider/40">
              <td colspan="5" class="px-6 py-3">
                <div class="bg-white rounded-2xl border border-apple-divider/50 p-3 shadow-inner space-y-1.5 max-h-60 overflow-y-auto">
                  <div class="text-[10px] uppercase font-bold text-slate-400 border-b pb-1 mb-1.5 flex justify-between items-center">
                    <span>Danh sách chi tiết ca học học kèm</span>
                    <span class="text-apple-blue font-bold">${groupSessions.length} buổi học</span>
                  </div>
                  ${subRowsHtml}
                </div>
              </td>
            </tr>
          `;
        }
      });

      schList.innerHTML = `
        <div class="p-4 border-b border-apple-divider flex justify-between items-center flex-wrap gap-2">
          <h3 class="font-bold text-apple-ink text-xs uppercase tracking-wider">Lịch sử đặt lịch & Lớp học</h3>
          <div class="flex items-center gap-2">
            <button id="btn-refresh-class-list" class="flex items-center justify-center gap-1.5 px-3 py-1 border border-[#e2e2e4] hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-full transition-all active:scale-95 shadow-sm h-[30px]" type="button">
              <span class="material-symbols-outlined text-[16px]">refresh</span>Tải lại
            </button>
            <span class="text-[10px] text-slate-400 bg-white px-3 py-1 rounded-full font-bold">${allSessions.length} bản ghi</span>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-apple-parchment text-slate-500 text-[10px] font-semibold uppercase tracking-wider border-b border-apple-divider">
                <th class="px-5 py-3">Lớp học / Học viên</th>
                <th class="px-5 py-3">Thứ</th>
                <th class="px-5 py-3">Chi tiết ca</th>
                <th class="px-5 py-3">Trạng thái</th>
                <th class="px-5 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
              ${allSessions.length === 0 ? '<tr><td colspan="5" class="px-5 py-6 text-center text-slate-500 text-xs">Chưa có lịch giảng dạy nào.</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      `;

      // Gắn sự kiện Xóa / Hủy
      schList.querySelectorAll('.btn-delete-session').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const type = btn.getAttribute('data-type');
          const id = btn.getAttribute('data-id');
          const contractId = btn.getAttribute('data-contract-id');
          const isGroup = type === 'nhom';
          
          let msg = '';
          let url = '';
          if (isGroup) {
            msg = 'Bạn có chắc chắn muốn hủy lớp học nhóm và toàn bộ lịch học liên quan không?';
            url = `${API_BASE}/classes/${id}`;
          } else {
            msg = 'Bạn có chắc chắn muốn hủy toàn bộ các ca học kèm chưa học (chờ học) của gói học này để xếp lịch lại không?';
            url = `${API_BASE}/schedule/by-contract/${contractId}`;
          }

          if (!confirm(msg)) return;

          try {
            const res = await fetch(url, { method: 'DELETE', headers: { 'X-User-Role': 'le_tan' } });
            const result = await res.json();
            if (result.success) {
              showToast(isGroup ? 'Hủy lớp học nhóm thành công!' : result.message);
              loadScheduleList();
            } else {
              showToast(result.error || 'Lỗi khi hủy', 'error');
            }
          } catch {
            showToast('Lỗi máy chủ', 'error');
          }
        });
      });

      // Gắn sự kiện Sửa ca học custom (Sửa chuỗi/Sửa chung)
      schList.querySelectorAll('.btn-edit-session').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.getAttribute('data-idx'));
          const item = allSessions[idx];
          if (item) openEditSessionModal(item);
        });
      });

      // Gắn sự kiện toggle danh sách chi tiết các ca học kèm
      schList.querySelectorAll('.btn-toggle-sub-sessions').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const targetId = btn.getAttribute('data-target-id');
          const subPanel = document.getElementById(targetId);
          if (subPanel) {
            const isHidden = subPanel.classList.toggle('hidden');
            if (isHidden) {
              openSubLists.delete(targetId);
            } else {
              openSubLists.add(targetId);
            }
            const icon = btn.querySelector('.material-symbols-outlined');
            if (icon) {
              icon.textContent = isHidden ? 'unfold_more' : 'unfold_less';
            }
          }
        });
      });

      // Gắn sự kiện Xóa đơn lẻ 1 ca học (kèm hoặc nhóm)
      schList.querySelectorAll('.btn-delete-single-session').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const subId = btn.getAttribute('data-sub-id');
          const contractId = btn.getAttribute('data-contract-id');
          
          // Kiểm tra xem đây là ca học nhóm hay học kèm bằng cách check classSessions
          const isGroupSession = allSessions.some(s => s.type === 'nhom' && s.id === parseInt(contractId));
          const url = isGroupSession 
            ? `${API_BASE}/classes/schedule/${subId}` 
            : `${API_BASE}/schedule/${subId}`;

          if (!confirm(isGroupSession ? 'Bạn có chắc chắn muốn hủy duy nhất ca học nhóm này không?' : 'Bạn có chắc chắn muốn hủy duy nhất buổi học kèm này không?')) return;

          try {
            const res = await fetch(url, { method: 'DELETE', headers: { 'X-User-Role': 'le_tan' } });
            const result = await res.json();
            if (result.success) {
              showToast(isGroupSession ? 'Hủy ca học nhóm thành công!' : 'Hủy ca học kèm thành công!');
              loadScheduleList();
            } else {
              showToast(result.error || 'Lỗi khi hủy', 'error');
            }
          } catch {
            showToast('Lỗi máy chủ', 'error');
          }
        });
      });

      // Gắn sự kiện Sửa đơn lẻ 1 ca học (kèm hoặc nhóm)
      schList.querySelectorAll('.btn-edit-single-session').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const subId = btn.getAttribute('data-sub-id');
          const contractId = btn.getAttribute('data-contract-id');

          const isGroupSession = allSessions.some(s => s.type === 'nhom' && s.id === parseInt(contractId));

          // Fetch thông tin ca học cụ thể để mở modal sửa đơn lẻ
          try {
            const res = await fetch(isGroupSession ? `${API_BASE}/classes/schedules` : `${API_BASE}/schedules`);
            const data = await res.json();
            const singleSession = (data.data || []).find(s => 
              s.id === parseInt(subId) && 
              (isGroupSession ? s.loai_buoi === 'nhom' : s.loai_buoi === 'ca_nhan')
            );
            if (singleSession) {
              // Gán trường type để hàm openEditSessionModal nhận biết sửa 1 buổi
              const editItem = {
                id: singleSession.id,
                type: isGroupSession ? 'nhom_don_le' : 'ca_nhan_don_le', // Đánh dấu sửa đơn lẻ
                dang_ky_hoc_kem_id: isGroupSession ? singleSession.lop_hoc_id : singleSession.dang_ky_hoc_kem_id,
                title: isGroupSession ? `Sửa Ca Học Nhóm` : `Sửa Buổi Học Kèm`,
                ngay_hoc: singleSession.ngay_hoc,
                gio_bat_dau: singleSession.gio_bat_dau || '',
                gio_ket_thuc: singleSession.gio_ket_thuc || '',
                giao_vien_id: singleSession.giao_vien_id
              };
              openEditSessionModal(editItem);
            } else {
              showToast('Không tìm thấy thông tin ca học!', 'error');
            }
          } catch {
            showToast('Lỗi tải dữ liệu ca học', 'error');
          }
        });
      });

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

    const isAutoSchedule = autoScheduleCheck && autoScheduleCheck.checked;
    
    // Lấy các Thứ được check
    let selectedDays = [];
    if (isAutoSchedule) {
      const checkedBoxes = document.querySelectorAll('input[name="schedule-days"]:checked');
      selectedDays = Array.from(checkedBoxes).map(cb => parseInt(cb.value));
      if (selectedDays.length === 0) {
        showToast('Vui lòng chọn ít nhất một Thứ để xếp lịch tự động!', 'error');
        return;
      }
    }

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

      let ngay_hoc_list = null;
      if (isAutoSchedule) {
        const selectedOpt = coursePkgSelect.options[coursePkgSelect.selectedIndex];
        const months = selectedOpt ? parseInt(selectedOpt.getAttribute('data-months')) : 1;
        ngay_hoc_list = getScheduleDates(ngayHoc, selectedDays, 'months', months || 1);
        if (ngay_hoc_list.length === 0) {
          showToast('Không tìm thấy ngày học nào phù hợp với Thứ đã chọn trong thời hạn của gói!', 'error');
          return;
        }
      }

      const payload = {
        ten_lop: `Lớp nhóm - GV ${teacherSelect.options[teacherSelect.selectedIndex].text.split(' (')[0]}`,
        giao_vien_id: parseInt(gvId),
        goi_hoc_phi_id: pkgId ? parseInt(pkgId) : null,
        hoc_vien_ids: selectedStudentIds,
        ngay_hoc: ngayHoc,
        gio_bat_dau: batDau,
        gio_ket_thuc: ketThuc,
        ngay_hoc_list: ngay_hoc_list
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
          loadScheduleList();
          
          // Reset nhẹ danh sách học viên
          selectedStudentIds = [];
          renderStudentChecklist();
          renderSelectedBadges();
          if (autoScheduleCheck) {
            autoScheduleCheck.checked = false;
            autoScheduleOptions.classList.add('hidden');
          }
        } else {
          showToast(result.error || 'Có lỗi xảy ra', 'error');
        }
      } catch (err) {
        showToast('Lỗi kết nối máy chủ', 'error');
      }

    } else {
      const contractId = document.getElementById('class-tutoring-id')?.value;
      if (!contractId || contractId.trim() === '') {
        showToast('Vui lòng chọn gói học kèm của học viên!', 'error');
        return;
      }

      let ngay_hoc_list = null;
      if (isAutoSchedule) {
        const totalSes = parseInt(tutorIdInput.getAttribute('data-total-sessions')) || 10;
        const usedSes = parseInt(tutorIdInput.getAttribute('data-used-sessions')) || 0;
        const sessionsToSchedule = Math.max(1, totalSes - usedSes);

        ngay_hoc_list = getScheduleDates(ngayHoc, selectedDays, 'sessions', sessionsToSchedule);
        if (ngay_hoc_list.length === 0) {
          showToast('Không tìm thấy ngày học nào phù hợp với Thứ đã chọn!', 'error');
          return;
        }
      }

      const payload = {
        dang_ky_hoc_kem_id: parseInt(contractId),
        giao_vien_id: gvId ? parseInt(gvId) : null,
        ngay_hoc: ngayHoc,
        gio_bat_dau: batDau,
        gio_ket_thuc: ketThuc,
        loai_buoi: 'ca_nhan',
        ngay_hoc_list: ngay_hoc_list
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
          loadScheduleList();
          
          // Reset nhẹ danh sách học viên
          selectedStudentIds = [];
          tutorIdInput.value = '';
          renderStudentChecklist();
          renderSelectedBadges();
          if (autoScheduleCheck) {
            autoScheduleCheck.checked = false;
            autoScheduleOptions.classList.add('hidden');
          }
        } else {
          showToast(result.error || 'Có lỗi xảy ra', 'error');
        }
      } catch (err) {
        showToast('Lỗi kết nối máy chủ', 'error');
      }
    }
  });
}
