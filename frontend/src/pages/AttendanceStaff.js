import { API_BASE, showToast, setupCustomDatePicker } from './_shared.js';

export async function renderAttendanceStaff(container) {
  const userRole = localStorage.getItem('userRole') || 'hoc_vien';
  const currentUsername = localStorage.getItem('username') || '';

  // Trạng thái cục bộ
  let activeTab = 'history'; // 'history' hoặc 'sheet'
  const now = new Date();
  let filterMonth = now.getMonth() + 1;
  let filterYear = now.getFullYear();

  // Khởi động container rỗng và render cấu trúc layout chính
  async function initLayout() {
    container.innerHTML = `
      <div class="space-y-6 animate-fadeIn">
        
        <!-- Header & Action Row -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 class="text-xl font-bold tracking-tight text-slate-800">
              ${userRole === 'giao_vien' ? 'Nhật ký & Bảng chấm công của tôi' : 'Chấm công Nhân sự & Giáo viên'}
            </h2>
            <p class="text-xs text-slate-500">
              ${userRole === 'giao_vien' ? 'Xem nhật ký quét vân tay/QR và theo dõi bảng tổng hợp công đi làm hàng tháng của bạn.' : 'Quản lý lịch sử ra vào và theo dõi bảng chấm công tháng của giáo viên & nhân viên trung tâm.'}
            </p>
          </div>
          
          <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button id="btn-refresh-attendance" class="flex items-center justify-center gap-1.5 px-4 py-2 border border-[#e2e2e4] hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-full transition-all active:scale-95 shadow-sm h-[32px]">
              <span class="material-symbols-outlined text-[16px]">refresh</span>Tải lại
            </button>
            
            ${(userRole === 'admin' || userRole === 'le_tan' || userRole === 'giao_vien') ? `
              <button id="btn-add-log" class="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-apple-blue to-[#007eff] text-white text-xs font-semibold rounded-full transition-all active:scale-95 shadow-md hover:shadow-lg h-[32px]">
                <span class="material-symbols-outlined text-[16px]">add</span>${userRole === 'giao_vien' ? 'Tự chấm công bổ sung' : 'Thêm lượt quét'}
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Tab Switcher Premium -->
        <div class="flex border-b border-apple-divider/50 gap-6">
          <button id="tab-history" class="pb-3 text-xs font-bold transition-all border-b-2 outline-none relative" type="button">
            Lượt ra vào chi tiết
          </button>
          <button id="tab-sheet" class="pb-3 text-xs font-bold transition-all border-b-2 outline-none relative" type="button">
            Bảng chấm công tháng
          </button>
        </div>

        <!-- Khu vực hiển thị nội dung chính -->
        <div id="attendance-main-content" class="space-y-6">
          <!-- Rendered by JS -->
        </div>

      </div>

      <!-- Modal Thêm lượt quét chấm công thủ công -->
      <div id="add-log-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm hidden flex items-center justify-center z-50 animate-fadeIn">
        <div class="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
          <div class="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
            <h3 class="font-bold text-slate-800 text-sm uppercase tracking-wider">${userRole === 'giao_vien' ? 'Tự chấm công bổ sung' : 'Ghi nhận lượt quét thủ công'}</h3>
            <button id="close-log-modal" class="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-all">
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          
          <form id="add-log-form" class="p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-70px)]">
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Giáo viên / Nhân sự</label>
              <select name="ho_so_id" id="modal-attendance-teacher" required class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-apple-blue outline-none transition-all">
                <option value="">-- Chọn Nhân sự --</option>
              </select>
              <input type="hidden" id="modal-attendance-teacher-hidden">
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Ngày quét</label>
                <div id="attendance-date-container" class="relative">
                  <input type="date" name="ngay_quet" id="attendance-date" required />
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Giờ quét</label>
                <input type="time" name="gio_quet" required class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-apple-blue outline-none transition-all" />
              </div>
            </div>

            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Phương thức chấm công</label>
              <select name="phuong_thuc" class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-apple-blue outline-none transition-all">
                <option value="van_tay">Thẻ Vân tay</option>
                <option value="qr_code">QR Code Động</option>
              </select>
            </div>

            <div class="pt-2 shrink-0">
              <button type="submit" class="w-full bg-gradient-to-r from-apple-blue to-[#007eff] text-white py-2.5 rounded-xl text-xs font-semibold hover:shadow-lg transition-all active:scale-[0.98]">
                Xác nhận ghi nhận
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Thiết lập chuyển Tab
    const tabHistory = document.getElementById('tab-history');
    const tabSheet = document.getElementById('tab-sheet');

    function updateTabStyle() {
      if (activeTab === 'history') {
        tabHistory.className = 'pb-3 text-xs font-extrabold text-apple-blue border-b-2 border-apple-blue outline-none relative';
        tabSheet.className = 'pb-3 text-xs font-semibold text-slate-400 border-b-2 border-transparent hover:text-slate-600 outline-none relative';
      } else {
        tabSheet.className = 'pb-3 text-xs font-extrabold text-apple-blue border-b-2 border-apple-blue outline-none relative';
        tabHistory.className = 'pb-3 text-xs font-semibold text-slate-400 border-b-2 border-transparent hover:text-slate-600 outline-none relative';
      }
    }

    tabHistory.addEventListener('click', () => {
      activeTab = 'history';
      updateTabStyle();
      loadTabContent();
    });

    tabSheet.addEventListener('click', () => {
      activeTab = 'sheet';
      updateTabStyle();
      loadTabContent();
    });

    updateTabStyle();
    
    // Gắn sự kiện Tải lại
    document.getElementById('btn-refresh-attendance')?.addEventListener('click', () => {
      loadTabContent();
    });

    // Sự kiện mở modal thủ công
    const modal = document.getElementById('add-log-modal');
    document.getElementById('btn-add-log')?.addEventListener('click', async () => {
      const now = new Date();
      const localDate = now.toISOString().split('T')[0];
      const localTime = now.toTimeString().slice(0, 5);
      
      const form = document.getElementById('add-log-form');
      form.elements['ngay_quet'].value = localDate;
      form.elements['gio_quet'].value = localTime;
      
      // Load danh sách nhân sự lên modal
      try {
        const [teachersRes, staffRes] = await Promise.all([
          fetch(`${API_BASE}/teachers`).then(r => r.json()),
          fetch(`${API_BASE}/staff`).then(r => r.json())
        ]);
        const teachers = teachersRes.data || [];
        const staff = staffRes.data || [];
        const allPeople = [...teachers, ...staff];

        const selectEl = document.getElementById('modal-attendance-teacher');
        const hiddenEl = document.getElementById('modal-attendance-teacher-hidden');

        // Tìm tài khoản đăng nhập hiện tại
        const currentPerson = allPeople.find(p => 
          (p.ma_ho_so && p.ma_ho_so.toLowerCase() === currentUsername.toLowerCase()) || 
          p.so_dien_thoai === currentUsername
        );

        if (userRole === 'giao_vien' && currentPerson) {
          selectEl.innerHTML = `<option value="${currentPerson.id}">${currentPerson.ho_ten} (${currentPerson.ma_ho_so})</option>`;
          selectEl.disabled = true;
          hiddenEl.value = currentPerson.id;
        } else {
          selectEl.disabled = false;
          selectEl.innerHTML = '<option value="">-- Chọn Nhân sự --</option>' + 
            allPeople.map(p => `<option value="${p.id}" ${currentPerson && currentPerson.id === p.id ? 'selected' : ''}>${p.ho_ten} (${p.ma_ho_so} - ${p.loai_ho_so === 'giao_vien' ? 'GV' : 'NV'})</option>`).join('');
        }
      } catch (err) {
        showToast('Lỗi tải danh sách nhân sự', 'error');
      }

      setupCustomDatePicker(document.getElementById('attendance-date'), document.getElementById('attendance-date-container'));
      modal.classList.remove('hidden');
    });

    document.getElementById('close-log-modal')?.addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    // Form submit thêm log
    document.getElementById('add-log-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      let ho_so_id = parseInt(formData.get('ho_so_id'));
      if (isNaN(ho_so_id)) {
        ho_so_id = parseInt(document.getElementById('modal-attendance-teacher-hidden')?.value);
      }
      const ngay_quet = formData.get('ngay_quet');
      const gio_quet = formData.get('gio_quet');
      const phuong_thuc = formData.get('phuong_thuc');
      const thoi_diem = new Date(`${ngay_quet}T${gio_quet}`).toISOString();

      try {
        const res = await fetch(`${API_BASE}/checkin-logs`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-role': userRole
          },
          body: JSON.stringify({ ho_so_id, thoi_diem, phuong_thuc, chi_nhanh_thuc_hien: 'Trung tâm chính' })
        });

        const result = await res.json();
        if (result.success) {
          showToast('Ghi nhận lượt quét thành công!');
          modal.classList.add('hidden');
          loadTabContent();
        } else {
          showToast(result.error || 'Lỗi lưu thông tin', 'error');
        }
      } catch (err) {
        showToast('Lỗi kết nối máy chủ', 'error');
      }
    });

    // Khởi chạy load nội dung
    loadTabContent();
  }

  // Tải nội dung theo Tab đang chọn
  async function loadTabContent() {
    const mainArea = document.getElementById('attendance-main-content');
    if (!mainArea) return;

    mainArea.innerHTML = `
      <div class="flex items-center justify-center py-16">
        <div class="animate-spin rounded-full h-7 w-7 border-b-2 border-apple-blue"></div>
      </div>
    `;

    if (activeTab === 'history') {
      await renderHistoryTab(mainArea);
    } else {
      await renderSheetTab(mainArea);
    }
  }

  // TAB 1: Lịch sử ra vào chi tiết
  async function renderHistoryTab(targetEl) {
    try {
      const [logsRes, teachersRes, staffRes] = await Promise.all([
        fetch(`${API_BASE}/checkin-logs`),
        fetch(`${API_BASE}/teachers`),
        fetch(`${API_BASE}/staff`)
      ]);

      const logsData = await logsRes.json();
      const teachers = (await teachersRes.json()).data || [];
      const staff = (await staffRes.json()).data || [];
      const allPeople = [...teachers, ...staff];

      const allLogs = logsData.data || [];

      // Tìm thông tin người dùng hiện tại
      const currentPerson = allPeople.find(p => 
        (p.ma_ho_so && p.ma_ho_so.toLowerCase() === currentUsername.toLowerCase()) || 
        p.so_dien_thoai === currentUsername
      );

      // Nếu là giáo viên hoặc nhân viên thường, chỉ cho xem lịch sử của chính họ
      let filteredLogs = [];
      if (userRole !== 'admin' && userRole !== 'le_tan' && currentPerson) {
        filteredLogs = allLogs.filter(log => log.ho_so_id === currentPerson.id);
      } else {
        filteredLogs = allLogs;
      }

      // Thống kê sơ bộ
      const totalCheckins = filteredLogs.length;
      let onTimeCount = 0;
      let lateCount = 0;

      const processedLogs = filteredLogs.map(log => {
        const timeStr = new Date(log.thoi_diem).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const dateStr = new Date(log.thoi_diem).toLocaleDateString('vi-VN');
        
        const hour = new Date(log.thoi_diem).getHours();
        const minute = new Date(log.thoi_diem).getMinutes();
        
        let isLate = false;
        if (hour > 8 || (hour === 8 && minute > 5)) {
          isLate = true;
          lateCount++;
        } else {
          onTimeCount++;
        }

        return {
          ...log,
          dateStr,
          timeStr,
          isLate,
          statusLabel: isLate ? 'Đi muộn' : 'Đúng giờ',
          statusColor: isLate ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
      });

      const onTimeRate = totalCheckins > 0 ? Math.round((onTimeCount / totalCheckins) * 100) : 100;

      targetEl.innerHTML = `
        <!-- KPI Cards Grid (Bento style) -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-white border border-[#e2e2e4] rounded-2xl p-5 flex flex-col justify-between shadow-sm min-h-[120px] hover:border-[#0066cc]/50 hover:shadow-md transition-all duration-300">
            <div class="flex justify-between items-start">
              <div>
                <span class="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Tổng ca quét</span>
                <span class="text-3xl font-extrabold text-[#1a1c1d] block mt-2 tracking-tight">${totalCheckins}</span>
              </div>
              <div class="p-2.5 bg-blue-50 text-apple-blue rounded-xl">
                <span class="material-symbols-outlined text-[20px]">fingerprint</span>
              </div>
            </div>
            <p class="text-[10px] text-slate-400 mt-3">Lượt quét thẻ ra/vào ghi nhận được</p>
          </div>

          <div class="bg-white border border-[#e2e2e4] rounded-2xl p-5 flex flex-col justify-between shadow-sm min-h-[120px] hover:border-[#0066cc]/50 hover:shadow-md transition-all duration-300">
            <div class="flex justify-between items-start">
              <div>
                <span class="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Đúng giờ</span>
                <span class="text-3xl font-extrabold text-emerald-600 block mt-2 tracking-tight">${onTimeCount}</span>
              </div>
              <div class="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <span class="material-symbols-outlined text-[20px]">check_circle</span>
              </div>
            </div>
            <p class="text-[10px] text-slate-400 mt-3">Số ca check-in trước 08:05 sáng</p>
          </div>

          <div class="bg-white border border-[#e2e2e4] rounded-2xl p-5 flex flex-col justify-between shadow-sm min-h-[120px] hover:border-[#0066cc]/50 hover:shadow-md transition-all duration-300">
            <div class="flex justify-between items-start">
              <div>
                <span class="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Đi muộn</span>
                <span class="text-3xl font-extrabold text-amber-600 block mt-2 tracking-tight">${lateCount}</span>
              </div>
              <div class="p-2.5 bg-amber-50 text-amber-500 rounded-xl">
                <span class="material-symbols-outlined text-[20px]">warning</span>
              </div>
            </div>
            <p class="text-[10px] text-slate-400 mt-3">Số ca check-in muộn sau 08:05 sáng</p>
          </div>

          <div class="bg-white border border-[#e2e2e4] rounded-2xl p-5 flex flex-col justify-between shadow-sm min-h-[120px] hover:border-[#0066cc]/50 hover:shadow-md transition-all duration-300">
            <div class="flex justify-between items-start">
              <div>
                <span class="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Tỷ lệ đúng giờ</span>
                <span class="text-3xl font-extrabold text-[#0066cc] block mt-2 tracking-tight">${onTimeRate}%</span>
              </div>
              <div class="p-2.5 bg-blue-50 text-[#0066cc] rounded-xl">
                <span class="material-symbols-outlined text-[20px]">schedule</span>
              </div>
            </div>
            <p class="text-[10px] text-slate-400 mt-3">Tỷ lệ đi làm đúng giờ chuyên cần</p>
          </div>
        </div>

        <!-- Bảng danh sách log check-in -->
        <div class="bg-white border border-[#e2e2e4] rounded-2xl shadow-sm overflow-hidden">
          <div class="p-5 border-b border-[#f3f3f5] flex justify-between items-center bg-slate-50/50">
            <h3 class="font-bold text-slate-700 text-xs uppercase tracking-wider">Lịch sử check-in nhân sự</h3>
            <span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">Thời gian thực</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="border-b border-[#e2e2e4] text-slate-400 uppercase text-[10px] tracking-wider bg-slate-50/20">
                  <th class="py-3 px-5 font-semibold">Nhân viên / Giáo viên</th>
                  <th class="py-3 px-5 font-semibold">Ngày quét</th>
                  <th class="py-3 px-5 font-semibold">Giờ quét</th>
                  <th class="py-3 px-5 font-semibold">Phương thức</th>
                  <th class="py-3 px-5 font-semibold text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#f3f3f5]">
                ${processedLogs.map(log => `
                  <tr class="hover:bg-slate-50/55 transition-colors">
                    <td class="py-3 px-5">
                      <div class="flex items-center gap-2.5">
                        <div class="w-7 h-7 rounded-full bg-apple-blue/10 flex items-center justify-center font-bold text-apple-blue text-xs select-none">
                          ${log.ho_ten.charAt(0)}
                        </div>
                        <div>
                          <span class="font-bold text-slate-800 block text-xs">${log.ho_ten}</span>
                          <span class="text-[10px] text-slate-400 block">${log.ma_ho_so || 'NV_GV'}</span>
                        </div>
                      </div>
                    </td>
                    <td class="py-3 px-5 text-slate-500 font-medium">${log.dateStr}</td>
                    <td class="py-3 px-5 text-slate-700 font-semibold">${log.timeStr}</td>
                    <td class="py-3 px-5">
                      <span class="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        ${log.phuong_thuc === 'qr_code' ? 'QR Code Động' : 'Thẻ Vân Tay'}
                      </span>
                    </td>
                    <td class="py-3 px-5 text-right">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${log.statusColor}">
                        ${log.statusLabel}
                      </span>
                    </td>
                  </tr>
                `).join('')}
                ${processedLogs.length === 0 ? `
                  <tr>
                    <td colspan="5" class="py-10 text-center text-slate-400 text-xs">
                      <span class="material-symbols-outlined text-[32px] text-slate-300 block mb-1">sentiment_dissatisfied</span>
                      Chưa có dữ liệu chấm công giáo viên nào được ghi nhận.
                    </td>
                  </tr>
                ` : ''}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      targetEl.innerHTML = `<div class="p-4 bg-red-50 text-red-700 text-xs rounded-xl">Lỗi tải lịch sử chấm công: ${err.message}</div>`;
    }
  }

  // TAB 2: Bảng chấm công tổng hợp theo tháng
  async function renderSheetTab(targetEl) {
    try {
      const summaryRes = await fetch(`${API_BASE}/attendance/summary?month=${filterMonth}&year=${filterYear}`);
      const summaryData = await summaryRes.json();
      let summaries = summaryData.data || [];

      // Phân quyền: Nếu không phải Admin hoặc Lễ tân, chỉ hiển thị dòng của chính họ
      if (userRole !== 'admin' && userRole !== 'le_tan') {
        summaries = summaries.filter(p => 
          (p.ma_ho_so && p.ma_ho_so.toLowerCase() === currentUsername.toLowerCase()) || 
          p.ho_ten.toLowerCase().replace(/\s/g, '') === currentUsername.toLowerCase()
        );
      }

      // Xác định số ngày trong tháng được chọn
      const totalDays = new Date(filterYear, filterMonth, 0).getDate();
      const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);

      // Tạo list options chọn tháng
      const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1)
        .map(m => `<option value="${m}" ${m === filterMonth ? 'selected' : ''}>Tháng ${m}</option>`)
        .join('');

      // Danh sách năm
      const yearOptions = [2025, 2026, 2027]
        .map(y => `<option value="${y}" ${y === filterYear ? 'selected' : ''}>Năm ${y}</option>`)
        .join('');

      let tbodyRows = '';
      summaries.forEach(person => {
        // Tạo tập hợp (set) các ngày đi làm dạng string yyyy-mm-dd
        const workDates = new Set(person.work_days.map(d => {
          // Chuỗi từ db có dạng yyyy-mm-dd
          return parseInt(d.split('-')[2]); // Lấy phần ngày
        }));

        let daysHtml = '';
        let totalPresent = 0;
        daysArray.forEach(d => {
          const isPresent = workDates.has(d);
          if (isPresent) totalPresent++;

          daysHtml += `
            <td class="p-1.5 text-center border border-apple-divider/40 text-[10px] font-bold">
              ${isPresent ? '<span class="text-emerald-500 font-extrabold text-[12px]">✓</span>' : '<span class="text-slate-200">-</span>'}
            </td>
          `;
        });

        tbodyRows += `
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-3 border border-apple-divider/45 sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] whitespace-nowrap">
              <div class="font-bold text-slate-800">${person.ho_ten}</div>
              <div class="text-[9px] text-slate-400 uppercase font-semibold mt-0.5">${person.ma_ho_so} — ${person.loai_ho_so === 'giao_vien' ? 'Giáo viên' : 'Nhân viên'}</div>
            </td>
            ${daysHtml}
            <td class="p-3 border border-apple-divider/45 text-center font-extrabold text-apple-blue bg-blue-50/30 whitespace-nowrap text-xs">
              ${totalPresent} / ${totalDays}
            </td>
          </tr>
        `;
      });

      targetEl.innerHTML = `
        <!-- Bộ lọc tháng / năm -->
        <div class="bg-white border border-[#e2e2e4] rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-3 justify-between">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-apple-blue text-[18px]">calendar_month</span>
            <span class="font-bold text-slate-700 text-xs">Chọn kỳ chấm công:</span>
            <select id="select-filter-month" class="border border-slate-200 rounded-full px-3 py-1 text-xs bg-white outline-none cursor-pointer focus:border-apple-blue">
              ${monthOptions}
            </select>
            <select id="select-filter-year" class="border border-slate-200 rounded-full px-3 py-1 text-xs bg-white outline-none cursor-pointer focus:border-apple-blue">
              ${yearOptions}
            </select>
          </div>
          <div class="text-[10px] text-slate-400 font-semibold italic">
            * Dấu (✓) xanh thể hiện nhân sự có ít nhất một lượt quét check-in/out trong ngày.
          </div>
        </div>

        <!-- Bảng Grid tổng hợp công -->
        <div class="bg-white border border-[#e2e2e4] rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div class="overflow-x-auto w-full relative">
            <table class="w-full border-collapse">
              <thead>
                <tr class="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-[#e2e2e4]">
                  <th class="p-3 border border-apple-divider/45 sticky left-0 bg-slate-50 z-20 min-w-[150px] text-left shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    Nhân sự
                  </th>
                  ${daysArray.map(d => `<th class="p-1.5 border border-apple-divider/45 text-center min-w-[28px]">${d}</th>`).join('')}
                  <th class="p-3 border border-apple-divider/45 text-center bg-blue-50/45 min-w-[70px]">Công/Tháng</th>
                </tr>
              </thead>
              <tbody>
                ${tbodyRows}
                ${summaries.length === 0 ? `
                  <tr>
                    <td colspan="${totalDays + 2}" class="p-8 text-center text-slate-400 text-xs italic">
                      Không tìm thấy nhân sự phù hợp để hiển thị bảng công.
                    </td>
                  </tr>
                ` : ''}
              </tbody>
            </table>
          </div>
        </div>
      `;

      // Gắn sự kiện thay đổi bộ lọc
      document.getElementById('select-filter-month')?.addEventListener('change', (e) => {
        filterMonth = parseInt(e.target.value);
        loadTabContent();
      });
      document.getElementById('select-filter-year')?.addEventListener('change', (e) => {
        filterYear = parseInt(e.target.value);
        loadTabContent();
      });

    } catch (err) {
      targetEl.innerHTML = `<div class="p-4 bg-red-50 text-red-700 text-xs rounded-xl">Lỗi tải bảng tổng hợp công: ${err.message}</div>`;
    }
  }

  // Khởi chạy
  initLayout();
}
