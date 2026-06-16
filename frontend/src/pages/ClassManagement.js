// ClassManagement.js - Lớp học & Xếp lịch (Redesign: max 50 HS, giờ grid 8-22h, thời lượng auto, chọn tất cả)
import { API_BASE, showToast, setupCustomDatePicker } from './_shared.js';

export async function renderClassManagement(container) {

  const todayStr = new Date().toISOString().split('T')[0];

  container.innerHTML = `
    <div class="space-y-4">
      <div class="grid grid-cols-1 lg:grid-cols-10 gap-6">
        <!-- Form bên trái (Đăng ký lịch dạy - chiếm 4 phần) -->
        <div class="lg:col-span-4 bg-apple-parchment rounded-[18px] p-6 border border-apple-divider/60 space-y-4 h-fit">
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

            <!-- Gói học đại trà (Hiển thị khi chọn lớp nhóm) -->
            <div id="course-package-group">
              <label class="block font-semibold text-slate-600 mb-1">Chọn Gói học / Khóa học <span class="text-rose-500 font-bold">*</span></label>
              <select id="class-course-package" class="w-full border border-apple-divider rounded-full px-4 py-2 outline-none focus:border-apple-blue transition bg-white cursor-pointer">
                <option value="">-- Chọn gói học phí --</option>
              </select>
            </div>

            <!-- Gói học kèm & Học viên đăng ký (Hiển thị khi chọn lớp kèm 1-1) -->
            <div id="tutoring-contract-group" class="hidden space-y-3">
              <div>
                <label class="block font-semibold text-slate-600 mb-1">Chọn Gói học kèm của học viên <span class="text-rose-500 font-bold">*</span></label>
                <select id="class-tutoring-select" class="w-full border border-apple-divider rounded-full px-4 py-2 outline-none focus:border-apple-blue transition bg-white cursor-pointer">
                  <option value="">-- Chọn gói kèm đang hoạt động --</option>
                </select>
                <input type="hidden" id="class-tutoring-id">
              </div>
            </div>

            <!-- Panel chọn học viên (Chỉ dành cho lớp nhóm) -->
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
              <div id="class-date-container" class="relative">
                <input type="date" id="class-date" required min="${todayStr}" value="${todayStr}">
              </div>
            </div>

            <!-- Tự động xếp lịch cả tháng/theo gói -->
            <div class="space-y-2 p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
              <div class="flex items-center gap-2">
                <input type="checkbox" id="auto-schedule-month" class="rounded text-apple-blue focus:ring-apple-blue w-4 h-4 cursor-pointer">
                <label for="auto-schedule-month" class="font-bold text-slate-700 cursor-pointer select-none text-[11px]">Tự động xếp lịch</label>
              </div>
              <div id="auto-schedule-options" class="hidden pl-2 space-y-1.5">
                <span class="block font-semibold text-slate-500 text-[10px]">Chọn các Thứ học cố định:</span>
                <div class="grid grid-cols-4 gap-1.5">
                  <label class="flex items-center gap-1 cursor-pointer select-none text-[10.5px] text-slate-600">
                    <input type="checkbox" name="schedule-days" value="1" class="rounded text-apple-blue focus:ring-apple-blue w-3.5 h-3.5" checked>
                    T2
                  </label>
                  <label class="flex items-center gap-1 cursor-pointer select-none text-[10.5px] text-slate-600">
                    <input type="checkbox" name="schedule-days" value="2" class="rounded text-apple-blue focus:ring-apple-blue w-3.5 h-3.5">
                    T3
                  </label>
                  <label class="flex items-center gap-1 cursor-pointer select-none text-[10.5px] text-slate-600">
                    <input type="checkbox" name="schedule-days" value="3" class="rounded text-apple-blue focus:ring-apple-blue w-3.5 h-3.5" checked>
                    T4
                  </label>
                  <label class="flex items-center gap-1 cursor-pointer select-none text-[10.5px] text-slate-600">
                    <input type="checkbox" name="schedule-days" value="4" class="rounded text-apple-blue focus:ring-apple-blue w-3.5 h-3.5">
                    T5
                  </label>
                  <label class="flex items-center gap-1 cursor-pointer select-none text-[10.5px] text-slate-600">
                    <input type="checkbox" name="schedule-days" value="5" class="rounded text-apple-blue focus:ring-apple-blue w-3.5 h-3.5" checked>
                    T6
                  </label>
                  <label class="flex items-center gap-1 cursor-pointer select-none text-[10.5px] text-slate-600">
                    <input type="checkbox" name="schedule-days" value="6" class="rounded text-apple-blue focus:ring-apple-blue w-3.5 h-3.5">
                    T7
                  </label>
                  <label class="flex items-center gap-1 cursor-pointer select-none text-[10.5px] text-slate-600">
                    <input type="checkbox" name="schedule-days" value="0" class="rounded text-apple-blue focus:ring-apple-blue w-3.5 h-3.5">
                    CN
                  </label>
                </div>
              </div>
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

        <!-- Danh sách lịch sử đặt lịch bên phải (chiếm 6 phần) -->
        <div class="lg:col-span-6 bg-apple-white rounded-[18px] border border-apple-divider overflow-hidden flex flex-col shadow-sm" id="class-list-container">
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
    const start = new Date(startDateStr);
    
    // Check nếu allowedDays rỗng hoặc null, mặc định Thứ 2, 4, 6
    const days = (allowedDays && Array.isArray(allowedDays) && allowedDays.length > 0) 
      ? allowedDays.map(Number) 
      : [1, 3, 5];
      
    const currentDate = new Date(start);

    if (limitType === 'sessions') {
      const maxSessions = parseInt(limitVal) || 10;
      while (dates.length < maxSessions) {
        const dayOfWeek = currentDate.getDay(); // 0-6 (0 là Chủ nhật, 1 là Thứ 2...)
        if (days.includes(dayOfWeek)) {
          dates.push(currentDate.toLocaleDateString('sv-SE'));
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
          dates.push(currentDate.toLocaleDateString('sv-SE'));
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
        <div class="flex items-center gap-2.5 hover:bg-slate-50 p-2 rounded-xl transition cursor-pointer select-none border ${isSelected ? 'border-apple-blue/30 bg-blue-50/20' : 'border-transparent'}" data-id="${s.id}">
          <div class="w-7 h-7 rounded-full overflow-hidden shadow-sm bg-apple-parchment flex items-center justify-center font-bold text-apple-blue shrink-0">
            ${s.avatar_url ? `<img src="${s.avatar_url}" class="w-full h-full object-cover">` : (s.ho_ten || 'H').charAt(0)}
          </div>
          <span class="text-slate-700 font-semibold">${s.ho_ten}</span>
          <span class="text-[9px] text-slate-400 ml-auto">${s.trinh_do_dau_vao || ''}</span>
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

    editModal.innerHTML = `
      <div class="bg-white rounded-3xl max-w-md w-full border border-[#e2e2e4] shadow-2xl p-6 space-y-4 animate-in fade-in duration-150 text-xs">
        <div class="flex justify-between items-center pb-2 border-b border-apple-divider/40">
          <h3 class="font-bold text-apple-ink text-sm flex items-center gap-1.5">
            <span class="material-symbols-outlined text-apple-blue text-[18px]">edit_calendar</span>
            Chỉnh sửa ca học (${item.type === 'nhom' ? 'Lớp nhóm' : 'Học kèm'})
          </h3>
          <button type="button" id="btn-close-edit-session" class="p-1 hover:bg-slate-100 rounded-full flex items-center justify-center">
            <span class="material-symbols-outlined text-[16px] text-slate-400">close</span>
          </button>
        </div>
        
        <form id="edit-session-form" class="space-y-4">
          <!-- Ngày học -->
          <div>
            <label class="block font-semibold text-slate-600 mb-1">Ngày dạy học <span class="text-rose-500 font-bold">*</span></label>
            <div id="edit-class-date-container" class="relative">
              <input type="date" id="edit-class-date" required min="${todayStr}" value="${itemNgayStr}">
            </div>
          </div>

          <!-- Giờ bắt đầu -->
          <div>
            <label class="block font-semibold text-slate-600 mb-1">Giờ bắt đầu <span class="text-rose-500 font-bold">*</span></label>
            <div id="edit-time-grid" class="grid grid-cols-4 gap-1.5">
              <!-- Rendered by JS -->
            </div>
            <input type="hidden" id="edit-class-start" value="${item.gio_bat_dau.slice(0, 5)}" required>
          </div>

          <!-- Thời lượng -->
          <div>
            <label class="block font-semibold text-slate-600 mb-1">Thời lượng buổi học <span class="text-rose-500 font-bold">*</span></label>
            <div class="grid grid-cols-3 gap-2">
              <button type="button" class="edit-duration-btn px-3 py-2 rounded-xl border-2 transition font-bold" data-duration="60">1 tiếng</button>
              <button type="button" class="edit-duration-btn px-3 py-2 rounded-xl border-2 transition font-bold" data-duration="90">1.5 tiếng</button>
              <button type="button" class="edit-duration-btn px-3 py-2 rounded-xl border-2 transition font-bold" data-duration="120">2 tiếng</button>
            </div>
            <input type="hidden" id="edit-class-duration" value="${oldDuration}">
          </div>

          <!-- Giờ kết thúc tự tính -->
          <div>
            <label class="block font-semibold text-slate-600 mb-1">Giờ kết thúc (tự tính)</label>
            <div class="bg-slate-50 border border-apple-divider rounded-full px-4 py-2 font-bold text-apple-blue" id="edit-class-end-label">--:--</div>
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-apple-divider/40">
            <button type="button" id="btn-cancel-edit-session" class="px-4 py-2 border border-[#e2e2e4] rounded-full hover:bg-slate-50 font-semibold active:scale-95 transition">Hủy bỏ</button>
            <button type="submit" class="px-5 py-2 bg-apple-blue text-white rounded-full hover:opacity-90 font-semibold active:scale-95 transition shadow-sm">Cập nhật lịch</button>
          </div>
        </form>
      </div>
    `;

    editModal.classList.remove('hidden');

    const form = editModal.querySelector('#edit-session-form');
    const startInput = editModal.querySelector('#edit-class-start');
    const durationInput = editModal.querySelector('#edit-class-duration');
    const dateInput = editModal.querySelector('#edit-class-date');
    const timeGridEl = editModal.querySelector('#edit-time-grid');
    const endLabel = editModal.querySelector('#edit-class-end-label');

    let currentSelStart = startInput.value;
    let currentSelDuration = parseInt(durationInput.value) || 90;

    // Render duration button active state
    const updateDurationBtns = () => {
      editModal.querySelectorAll('.edit-duration-btn').forEach(btn => {
        const d = parseInt(btn.getAttribute('data-duration'));
        if (d === currentSelDuration) {
          btn.className = 'edit-duration-btn px-3 py-2 rounded-xl border-2 border-apple-blue bg-blue-50 text-apple-blue font-bold transition';
        } else {
          btn.className = 'edit-duration-btn px-3 py-2 rounded-xl border-2 border-apple-divider bg-white text-slate-600 hover:border-apple-blue hover:bg-blue-50 transition';
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
                'bg-white border-apple-divider text-slate-600 hover:border-apple-blue hover:bg-blue-50'}"
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

    // Khởi tạo date picker custom
    setupCustomDatePicker(
      dateInput,
      editModal.querySelector('#edit-class-date-container'),
      {
        minDate: todayStr,
        onSelect: (val) => {
          currentSelStart = '';
          startInput.value = '';
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

      if (!updatedStart || updatedEnd === '--:--') {
        showToast('Vui lòng chọn giờ học hợp lệ!', 'error');
        return;
      }

      // Check quá khứ trên frontend
      const targetDateTime = new Date(`${updatedNgay}T${updatedStart}:00`);
      if (targetDateTime < new Date()) {
        showToast('Không được chọn lịch học ở thời điểm quá khứ!', 'error');
        return;
      }

      const url = item.type === 'nhom' ? `${API_BASE}/classes/${item.id}` : `${API_BASE}/schedule/${item.id}`;
      const bodyPayload = item.type === 'nhom' ? {
        ngay_hoc: updatedNgay,
        gio_bat_dau: updatedStart,
        gio_ket_thuc: updatedEnd,
        giao_vien_id: item.giao_vien_id
      } : {
        ngay_hoc: updatedNgay,
        gio_bat_dau: updatedStart,
        gio_ket_thuc: updatedEnd,
        giao_vien_id: item.giao_vien_id
      };

      try {
        const editRes = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'X-User-Role': 'le_tan' },
          body: JSON.stringify(bodyPayload)
        });
        const result = await editRes.json();
        if (result.success) {
          showToast(`Cập nhật lịch học thành công!`);
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
      const [schedulesRes, classesRes] = await Promise.all([
        fetch(`${API_BASE}/schedules`).then(r => r.json()),
        fetch(`${API_BASE}/classes`).then(r => r.json())
      ]);
      const schedules = schedulesRes.data || [];
      const classesList = classesRes.data || [];

      // Gộp các ca học
      const allSessions = [];
      classesList.forEach(item => {
        const today = new Date().toLocaleDateString('sv-SE');
        const ngayHocStr = item.ngay_hoc ? item.ngay_hoc.substring(0, 10) : '';
        let label = 'Chờ học';
        let cssClass = 'bg-yellow-50 text-yellow-800 border border-yellow-200';
        
        if (item.trang_thai_lich === 'da_hoc') {
          label = 'Đã học';
          cssClass = 'bg-emerald-100 text-emerald-800';
        } else if (item.trang_thai_lich === 'vang') {
          label = 'Vắng';
          cssClass = 'bg-rose-100 text-rose-800';
        } else if (item.trang_thai_lich === 'da_huy') {
          label = 'Đã hủy';
          cssClass = 'bg-slate-100 text-slate-600 border border-slate-200';
        } else {
          if (ngayHocStr < today) {
            label = 'Chưa điểm danh';
            cssClass = 'bg-amber-100 text-amber-800';
          } else if (ngayHocStr === today) {
            label = 'Hôm nay';
            cssClass = 'bg-blue-100 text-blue-800';
          }
        }

        allSessions.push({
          id: item.id,
          type: 'nhom',
          title: item.ten_lop,
          detail: `Gói: ${item.ten_goi_hoc_phi || 'Tự chọn'}`,
          ngay_hoc: item.ngay_hoc,
          gio_bat_dau: item.gio_bat_dau || '',
          gio_ket_thuc: item.gio_ket_thuc || '',
          ten_giao_vien: item.ten_giao_vien,
          giao_vien_id: item.giao_vien_id,
          si_so: item.si_so || 0,
          trang_thai: item.trang_thai_lich || 'cho_hoc',
          trang_thai_label: label,
          trang_thai_class: cssClass,
          tu_ngay: item.tu_ngay,
          den_ngay: item.den_ngay
        });
      });
      schedules.forEach(item => {
        allSessions.push({
          id: item.id,
          type: 'ca_nhan',
          title: `Học kèm: ${item.ten_hoc_vien}`,
          detail: '',
          ngay_hoc: item.ngay_hoc,
          gio_bat_dau: item.gio_bat_dau || '',
          gio_ket_thuc: item.gio_ket_thuc || '',
          ten_giao_vien: item.ten_giao_vien,
          giao_vien_id: item.giao_vien_id,
          si_so: 1,
          trang_thai: item.trang_thai,
          trang_thai_label: item.trang_thai === 'da_hoc' ? 'Đã học' : item.trang_thai === 'vang' ? 'Vắng' : 'Chờ học',
          trang_thai_class: item.trang_thai === 'da_hoc' ? 'bg-emerald-100 text-emerald-800' : item.trang_thai === 'vang' ? 'bg-rose-100 text-rose-800' : 'bg-yellow-50 text-yellow-800 border border-yellow-200',
          tu_ngay: item.tu_ngay,
          den_ngay: item.den_ngay
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
      allSessions.forEach(item => {
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

        const thuLabel = getDayOfWeekLabel(item.ngay_hoc);
        const gioHocStr = (item.gio_bat_dau && item.gio_ket_thuc) ? `${item.gio_bat_dau.slice(0, 5)} - ${item.gio_ket_thuc.slice(0, 5)}` : '—';
        const isGroup = item.type === 'nhom';

        rows += `
          <tr class="hover:bg-slate-50 border-b border-apple-divider/40 transition text-xs">
            <td class="px-5 py-3.5">
              <div class="font-bold text-apple-ink">${item.title}</div>
              ${item.detail ? `<div class="text-[9.5px] text-slate-400 mt-0.5">${item.detail}</div>` : ''}
              ${dateRangeStr}
              <div class="text-[9.5px] text-slate-400 mt-0.5">Ngày dạy: ${ngayHocStr}</div>
            </td>
            <td class="px-5 py-3.5 text-slate-600 font-semibold">${thuLabel}</td>
            <td class="px-5 py-3.5 font-bold ${isGroup ? 'text-apple-blue' : 'text-apple-ink'} whitespace-nowrap">${gioHocStr} ${isGroup ? `(${item.si_so}/50 HS)` : ''}</td>
            <td class="px-5 py-3.5">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${item.trang_thai_class}">${item.trang_thai_label}</span>
            </td>
            <td class="px-5 py-3.5 text-right whitespace-nowrap">
              <button type="button" class="btn-edit-session text-apple-blue hover:underline font-bold mr-2 text-[11px]" data-idx="${allSessions.indexOf(item)}">Sửa</button>
              <button type="button" class="btn-delete-session text-red-600 hover:underline font-bold text-[11px]" data-type="${item.type}" data-id="${item.id}">Hủy</button>
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

      // Gắn sự kiện Xóa
      schList.querySelectorAll('.btn-delete-session').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const type = btn.getAttribute('data-type');
          const id = btn.getAttribute('data-id');
          const isGroup = type === 'nhom';
          const msg = isGroup ? 'Bạn có chắc chắn muốn hủy lớp học nhóm và lịch học liên quan không?' : 'Bạn có chắc chắn muốn hủy lịch học kèm này không?';
          if (!confirm(msg)) return;

          const url = isGroup ? `${API_BASE}/classes/${id}` : `${API_BASE}/schedule/${id}`;
          try {
            const res = await fetch(url, { method: 'DELETE', headers: { 'X-User-Role': 'le_tan' } });
            const result = await res.json();
            if (result.success) {
              showToast(`Hủy ${isGroup ? 'lớp học nhóm' : 'ca học kèm'} thành công!`);
              loadScheduleList();
            } else {
              showToast(result.error || 'Lỗi khi hủy', 'error');
            }
          } catch {
            showToast('Lỗi máy chủ', 'error');
          }
        });
      });

      // Gắn sự kiện Sửa ca học custom
      schList.querySelectorAll('.btn-edit-session').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.getAttribute('data-idx'));
          const item = allSessions[idx];
          if (item) openEditSessionModal(item);
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
