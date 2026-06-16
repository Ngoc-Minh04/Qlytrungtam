import { API_BASE, showToast, setupCustomDatePicker } from './_shared.js';

export async function renderAttendanceStaff(container) {
  const userRole = localStorage.getItem('userRole') || 'hoc_vien';
  
  // Hiển thị loading state
  container.innerHTML = `
    <div class="flex items-center justify-center min-h-[300px]">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-apple-blue"></div>
    </div>
  `;

  try {
    // Tải dữ liệu log check-in và danh sách giáo viên
    const [logsRes, teachersRes] = await Promise.all([
      fetch(`${API_BASE}/checkin-logs`),
      fetch(`${API_BASE}/teachers`)
    ]);

    const logsData = await logsRes.json();
    const teachersData = await teachersRes.json();

    const allLogs = logsData.data || [];
    const teachers = teachersData.data || [];

    // Lấy username hiện tại từ localStorage để tìm giáo viên khớp
    const currentUsername = localStorage.getItem('username') || '';
    const currentTeacher = teachers.find(t => 
      (t.ma_ho_so && t.ma_ho_so.toLowerCase() === currentUsername.toLowerCase()) || 
      t.so_dien_thoai === currentUsername ||
      (t.ho_ten && t.ho_ten.toLowerCase().replace(/\s/g, '') === currentUsername.toLowerCase())
    );

    // Chỉ lọc các log của giáo viên (loai_ho_so = 'giao_vien' hoặc liên kết với danh sách giáo viên)
    // Nếu là giáo viên, chỉ hiển thị log của chính mình
    let teacherLogs = [];
    if (userRole === 'giao_vien' && currentTeacher) {
      teacherLogs = allLogs.filter(log => log.ho_so_id === currentTeacher.id);
    } else {
      const teacherIds = new Set(teachers.map(t => t.id));
      teacherLogs = allLogs.filter(log => teacherIds.has(log.ho_so_id));
    }

    // Thống kê sơ bộ
    const totalCheckins = teacherLogs.length;
    
    // Giả lập trạng thái đi muộn nếu giờ quét sau 8:00 sáng
    let onTimeCount = 0;
    let lateCount = 0;
    
    const processedLogs = teacherLogs.map(log => {
      const timeStr = new Date(log.thoi_diem).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const dateStr = new Date(log.thoi_diem).toLocaleDateString('vi-VN');
      
      // Giả sử giờ bắt đầu làm việc buổi sáng là 08:00, chiều là 13:30
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

    container.innerHTML = `
      <div class="space-y-6 animate-fadeIn">
        
        <!-- Header & Action Row -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 class="text-xl font-bold tracking-tight text-slate-800">${userRole === 'giao_vien' ? 'Lịch sử Chấm công của tôi' : 'Chấm công Nhân sự & Giáo viên'}</h2>
            <p class="text-xs text-slate-500">${userRole === 'giao_vien' ? 'Xem nhật ký check-in ra vào và tự chấm công bổ sung khi quên quét QR.' : 'Giám sát lượt vào ra và giờ giấc giảng dạy dựa trên hệ thống quét QR & thẻ vân tay.'}</p>
          </div>
          
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <!-- Nút Tải lại đồng bộ thiết kế -->
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

        <!-- KPI Cards Grid (Bento style) -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Card 1 -->
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
            <p class="text-[10px] text-slate-400 mt-3">Lượt ghi nhận của toàn bộ giáo viên</p>
          </div>

          <!-- Card 2 -->
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
            <p class="text-[10px] text-slate-400 mt-3">Ca check-in trước giờ quy định</p>
          </div>

          <!-- Card 3 -->
          <div class="bg-white border border-[#e2e2e4] rounded-2xl p-5 flex flex-col justify-between shadow-sm min-h-[120px] hover:border-[#0066cc]/50 hover:shadow-md transition-all duration-300">
            <div class="flex justify-between items-start">
              <div>
                <span class="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Đi muộn</span>
                <span class="text-3xl font-extrabold text-amber-600 block mt-2 tracking-tight">${lateCount}</span>
              </div>
              <div class="p-2.5 bg-amber-50 text-amber-50 rounded-xl">
                <span class="material-symbols-outlined text-[20px]">warning</span>
              </div>
            </div>
            <p class="text-[10px] text-slate-400 mt-3">Check-in muộn quá 5 phút so với ca</p>
          </div>

          <!-- Card 4 -->
          <div class="bg-white border border-[#e2e2e4] rounded-2xl p-5 flex flex-col justify-between shadow-sm min-h-[120px] hover:border-[#0066cc]/50 hover:shadow-md transition-all duration-300">
            <div class="flex justify-between items-start">
              <div>
                <span class="text-xs font-semibold text-slate-500 block uppercase tracking-wider font-bold">Tỷ lệ đúng giờ</span>
                <span class="text-3xl font-extrabold text-[#0066cc] block mt-2 tracking-tight">${onTimeRate}%</span>
              </div>
              <div class="p-2.5 bg-blue-50 text-[#0066cc] rounded-xl">
                <span class="material-symbols-outlined text-[20px]">schedule</span>
              </div>
            </div>
            <p class="text-[10px] text-slate-400 mt-3">Chỉ số tuân thủ giờ giấc làm việc</p>
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
              <select name="ho_so_id" id="modal-attendance-teacher" required ${userRole === 'giao_vien' && currentTeacher ? 'disabled' : ''} class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-apple-blue outline-none transition-all">
                <option value="">-- Chọn Giáo viên --</option>
                ${teachers.map(t => `<option value="${t.id}" ${userRole === 'giao_vien' && currentTeacher && currentTeacher.id === t.id ? 'selected' : ''}>${t.ho_ten} (${t.ma_ho_so})</option>`).join('')}
              </select>
              ${userRole === 'giao_vien' && currentTeacher ? `<input type="hidden" id="modal-attendance-teacher-hidden" value="${currentTeacher.id}">` : ''}
            </div>

            <div class="space-y-1 hidden">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Chi nhánh</label>
              <select name="chi_nhanh_thuc_hien" class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-apple-blue outline-none transition-all">
                <option value="Trung tâm chính" selected>Trung tâm chính</option>
              </select>
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

    // Khởi tạo custom date picker cho ngày quét
    const dateInput = document.getElementById('attendance-date');
    const dateContainer = document.getElementById('attendance-date-container');
    const setupPicker = () => {
      // Vì setupCustomDatePicker thay đổi kiểu thành hidden, chúng ta cần đảm bảo form submit đọc đúng giá trị
      setupCustomDatePicker(dateInput, dateContainer);
    };
    setupPicker();

    // Gắn các sự kiện click / modal
    document.getElementById('btn-refresh-attendance')?.addEventListener('click', () => {
      renderAttendanceStaff(container);
    });

    const modal = document.getElementById('add-log-modal');
    document.getElementById('btn-add-log')?.addEventListener('click', () => {
      // Set ngày hiện tại mặc định
      const now = new Date();
      const localDate = now.toISOString().split('T')[0];
      const localTime = now.toTimeString().slice(0, 5);
      
      const form = document.getElementById('add-log-form');
      form.elements['ngay_quet'].value = localDate;
      form.elements['gio_quet'].value = localTime;
      
      // Vẽ lại picker
      setupPicker();
      
      modal.classList.remove('hidden');
    });

    document.getElementById('close-log-modal')?.addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    // Submit form thêm log chấm công thủ công
    document.getElementById('add-log-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      let ho_so_id = parseInt(formData.get('ho_so_id'));
      if (isNaN(ho_so_id)) {
        ho_so_id = parseInt(document.getElementById('modal-attendance-teacher-hidden')?.value);
      }
      const chi_nhanh_thuc_hien = formData.get('chi_nhanh_thuc_hien');
      const ngay_quet = formData.get('ngay_quet');
      const gio_quet = formData.get('gio_quet');
      const phuong_thuc = formData.get('phuong_thuc');

      // Ghép ngày giờ
      const thoi_diem = new Date(`${ngay_quet}T${gio_quet}`).toISOString();

      try {
        const res = await fetch(`${API_BASE}/checkin-logs`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-role': userRole
          },
          body: JSON.stringify({ ho_so_id, chi_nhanh_thuc_hien, thoi_diem, phuong_thuc })
        });

        const result = await res.json();
        if (result.success) {
          showToast('Ghi nhận lượt quét thành công!');
          modal.classList.add('hidden');
          renderAttendanceStaff(container);
        } else {
          showToast(result.error || 'Lỗi lưu thông tin', 'error');
        }
      } catch (err) {
        showToast('Lỗi kết nối máy chủ', 'error');
      }
    });

  } catch (err) {
    container.innerHTML = `
      <div class="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-xs">
        <strong>Lỗi tải dữ liệu chấm công:</strong> ${err.message}
      </div>
    `;
  }
}
