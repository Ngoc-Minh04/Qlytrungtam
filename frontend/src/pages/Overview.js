// Overview.js - Trang Tổng quan Bento Grid Responsive kết nối API thật
import { API_BASE, showToast } from './_shared.js';

export async function renderOverview(container, role) {
  container.innerHTML = `
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-apple-blue"></div>
    </div>
  `;

  try {
    // 1. Fetch dữ liệu học viên
    const studentRes = await fetch(`${API_BASE}/students`);
    const studentData = await studentRes.json();
    const students = studentData.data || [];

    // 2. Fetch dữ liệu giáo viên (chỉ dành cho admin/le_tan)
    let teachers = [];
    if (role === 'admin' || role === 'le_tan') {
      try {
        const teacherRes = await fetch(`${API_BASE}/teachers`);
        const teacherData = await teacherRes.json();
        teachers = teacherData.data || [];
      } catch (err) {
        console.error('Không thể tải danh sách giáo viên', err);
      }
    }

    // 3. Fetch dữ liệu check-in hôm nay
    let checkinsToday = [];
    try {
      const checkinRes = await fetch(`${API_BASE}/checkins`);
      const checkinData = await checkinRes.json();
      const logs = checkinData.data || [];
      const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
      checkinsToday = logs.filter(log => log.ngay_quet && log.ngay_quet.startsWith(todayStr));
    } catch (err) {
      console.error('Không thể tải lịch sử checkin', err);
    }

    // 4. Tìm check-in sớm nhất hôm nay
    let earliestCheckin = null;
    if (checkinsToday.length > 0) {
      // Sắp xếp theo gio_quet tăng dần
      const sorted = [...checkinsToday].sort((a, b) => a.gio_quet.localeCompare(b.gio_quet));
      earliestCheckin = sorted[0];
    }

    // 5. Tính toán các gói bán chạy nhất và doanh thu tổng quan (Từ danh sách đăng ký)
    let packagesSold = {};
    let registrations = [];
    if (role === 'admin' || role === 'le_tan') {
      try {
        const regRes = await fetch(`${API_BASE}/registrations`);
        const regData = await regRes.json();
        registrations = regData.data || [];
        
        registrations.forEach(reg => {
          if (reg.trang_thai_thanh_toan === 'da_thanh_toan') {
            const pkgName = reg.ten_goi || 'Khóa học đại trà';
            packagesSold[pkgName] = (packagesSold[pkgName] || 0) + 1;
          }
        });
      } catch (err) {
        console.error('Không thể tải danh sách đăng ký', err);
      }
    }

    // Sắp xếp các gói bán chạy nhất
    const bestSellers = Object.entries(packagesSold)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Tính toán hoạt động gần đây
    const recentActivities = [];
    registrations.slice(0, 5).forEach(reg => {
      recentActivities.push({
        time: new Date(reg.ngay_dang_ky).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        desc: `Học viên đăng ký gói ${reg.ten_goi || 'mới'}`,
        icon: 'payments',
        color: 'text-emerald-500 bg-emerald-50'
      });
    });
    checkinsToday.slice(0, 5).forEach(log => {
      recentActivities.push({
        time: log.gio_quet.slice(0, 5),
        desc: `Học viên ${log.ho_ten} check-in tại chi nhánh`,
        icon: 'login',
        color: 'text-blue-500 bg-blue-50'
      });
    });
    // Sắp xếp theo thứ tự mới nhất
    recentActivities.sort((a, b) => b.time.localeCompare(a.time));

    const totalRevenue = registrations
      .filter(r => r.trang_thai_thanh_toan === 'da_thanh_toan')
      .reduce((sum, r) => sum + parseFloat(r.so_tien_phai_nop || 0), 0);

    const formattedRevenue = new Intl.NumberFormat('vi-VN').format(totalRevenue) + ' VNĐ';

    if (role === 'le_tan' || role === 'admin') {
      container.innerHTML = `
        <div class="space-y-6">
          <!-- Bento Grid Layout -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            
            <!-- Card 1: Tổng hội viên -->
            <div class="bg-white border border-[#e2e2e4] rounded-2xl p-5 flex flex-col justify-between shadow-sm min-h-[140px] hover:border-[#0066cc]/50 hover:shadow-md transition-all duration-300">
              <div class="flex justify-between items-start">
                <div>
                  <span class="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Tổng học viên</span>
                  <span class="text-3xl font-extrabold text-[#1a1c1d] block mt-2 tracking-tight">${students.length}</span>
                </div>
                <div class="p-2.5 bg-blue-50 text-apple-blue rounded-xl">
                  <span class="material-symbols-outlined text-[22px]">group</span>
                </div>
              </div>
              <p class="text-[10px] text-slate-400 mt-4 flex items-center gap-1">
                <span class="material-symbols-outlined text-[12px] text-emerald-500">trending_up</span>
                <span>Kết nối trực tiếp từ CSDL thật</span>
              </p>
            </div>

            <!-- Card 2: Tổng nhân sự -->
            <div class="bg-white border border-[#e2e2e4] rounded-2xl p-5 flex flex-col justify-between shadow-sm min-h-[140px] hover:border-[#0066cc]/50 hover:shadow-md transition-all duration-300">
              <div class="flex justify-between items-start">
                <div>
                  <span class="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Tổng giáo viên</span>
                  <span class="text-3xl font-extrabold text-[#1a1c1d] block mt-2 tracking-tight">${teachers.length}</span>
                </div>
                <div class="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                  <span class="material-symbols-outlined text-[22px]">badge</span>
                </div>
              </div>
              <p class="text-[10px] text-slate-400 mt-4">Bao gồm Giáo viên & Trợ giảng</p>
            </div>

            <!-- Card 3: Doanh thu khóa học -->
            <div class="bg-white border border-[#e2e2e4] rounded-2xl p-5 flex flex-col justify-between shadow-sm min-h-[140px] hover:border-[#0066cc]/50 hover:shadow-md transition-all duration-300 md:col-span-2">
              <div class="flex justify-between items-start">
                <div>
                  <span class="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Tổng doanh thu thực tế</span>
                  <span class="text-3xl font-extrabold text-emerald-600 block mt-2 tracking-tight">${formattedRevenue}</span>
                </div>
                <div class="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <span class="material-symbols-outlined text-[22px]">payments</span>
                </div>
              </div>
              <p class="text-[10px] text-slate-400 mt-4">Đã được loại trừ các đơn hàng ảo/chưa thanh toán</p>
            </div>

            <!-- Card 4: Check-in sớm nhất hôm nay -->
            <div class="bg-white border border-[#e2e2e4] rounded-2xl p-5 flex flex-col justify-between shadow-sm min-h-[140px] hover:border-[#0066cc]/50 hover:shadow-md transition-all duration-300 lg:col-span-2">
              <div class="flex justify-between items-start">
                <div class="space-y-1">
                  <span class="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Đi sớm nhất hôm nay</span>
                  ${earliestCheckin ? `
                    <div class="flex items-center gap-2 mt-2">
                      <div class="w-7 h-7 rounded-full bg-[#0066cc]/10 flex items-center justify-center font-bold text-[#0066cc] text-xs shrink-0 select-none">
                        ${earliestCheckin.ho_ten.charAt(0)}
                      </div>
                      <div>
                        <span class="text-sm font-bold text-[#1a1c1d] block">${earliestCheckin.ho_ten}</span>
                        <span class="text-[10px] text-slate-400">Vào lúc: ${earliestCheckin.gio_quet.slice(0, 5)}</span>
                      </div>
                    </div>
                  ` : `
                    <span class="text-sm font-medium text-slate-400 block mt-2">Chưa có ai check-in hôm nay</span>
                  `}
                </div>
                <div class="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <span class="material-symbols-outlined text-[22px]">alarm</span>
                </div>
              </div>
              <p class="text-[10px] text-slate-400 mt-3">Thống kê từ lượt check-in ra vào hàng ngày</p>
            </div>

            <!-- Card 5: Gói học bán chạy -->
            <div class="bg-white border border-[#e2e2e4] rounded-2xl p-5 flex flex-col justify-between shadow-sm min-h-[140px] hover:border-[#0066cc]/50 hover:shadow-md transition-all duration-300 lg:col-span-2">
              <div class="flex justify-between items-start">
                <div class="space-y-1 w-full">
                  <span class="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Gói học bán chạy nhất</span>
                  <div class="mt-2 space-y-1.5">
                    ${bestSellers.map((item, idx) => `
                      <div class="flex justify-between items-center text-xs">
                        <span class="font-medium text-slate-700 truncate max-w-[70%]">${idx + 1}. ${item.name}</span>
                        <span class="font-bold text-apple-blue bg-blue-50 px-2 py-0.5 rounded-full text-[10px]">${item.count} lượt đăng ký</span>
                      </div>
                    `).join('')}
                    ${bestSellers.length === 0 ? '<span class="text-slate-400 text-xs block mt-1">Chưa có giao dịch khóa học</span>' : ''}
                  </div>
                </div>
              </div>
            </div>

            <!-- Card 6: Nhật ký hoạt động gần đây (Scrollable) -->
            <div class="bg-white border border-[#e2e2e4] rounded-2xl p-5 shadow-sm md:col-span-2 lg:col-span-4 flex flex-col justify-between">
              <div>
                <span class="text-xs font-semibold text-slate-500 block uppercase tracking-wider mb-3">Nhật ký hoạt động gần đây</span>
                <div class="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  ${recentActivities.map(act => `
                    <div class="flex items-center justify-between text-xs py-2 border-b border-[#f3f3f5] last:border-0">
                      <div class="flex items-center gap-2">
                        <div class="p-1.5 rounded-lg ${act.color}">
                          <span class="material-symbols-outlined text-[16px]">${act.icon}</span>
                        </div>
                        <span class="text-slate-700 font-medium">${act.desc}</span>
                      </div>
                      <span class="text-[10px] text-slate-400 font-semibold">${act.time}</span>
                    </div>
                  `).join('')}
                  ${recentActivities.length === 0 ? '<p class="text-slate-400 text-xs py-4 text-center">Chưa có hoạt động nào trong ngày</p>' : ''}
                </div>
              </div>
            </div>

          </div>
        </div>
      `;
    } else if (role === 'giao_vien') {
      const res = await fetch(`${API_BASE}/schedule/today`);
      const result = await res.json();
      const schedules = result.data || [];

      container.innerHTML = `
        <div class="space-y-6">
          <div class="bg-[#272729] text-white rounded-2xl p-6 flex flex-col justify-between min-h-[150px] shadow-sm">
            <div class="space-y-1">
              <h2 class="text-lg font-bold tracking-tight apple-headline">Lịch dạy học hôm nay</h2>
              <p class="text-[10px] text-slate-400">Xem chi tiết các ca dạy kèm cá nhân và lớp nhóm.</p>
            </div>
            <div class="flex gap-6 mt-5 text-xs">
              <div>
                <span class="text-2xl font-bold block text-blue-400">${schedules.length}</span>
                <span class="text-[9px] uppercase tracking-wider text-slate-400">Tổng ca dạy</span>
              </div>
              <div class="border-l border-zinc-700 pl-6">
                <span class="text-2xl font-bold block text-emerald-400">${schedules.filter(s => s.trang_thai === 'da_hoc').length}</span>
                <span class="text-[9px] uppercase tracking-wider text-slate-400">Hoàn thành</span>
              </div>
            </div>
          </div>

          <div class="bg-white border border-[#e2e2e4] rounded-2xl p-5 space-y-4 shadow-sm">
            <div class="flex justify-between items-center pb-2 border-b border-[#f3f3f5]">
              <h3 class="font-bold text-[#1a1c1d] text-xs uppercase tracking-wider text-slate-500">Các ca giảng dạy trong ngày</h3>
            </div>
            <div class="space-y-2">
              ${schedules.map(item => `
                <div class="bg-[#fafafc] rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs border border-[#e2e2e4]/65 hover:border-apple-blue transition-colors">
                  <div>
                    <span class="font-bold text-[#1a1c1d] text-sm">${item.gio_bat_dau.slice(0, 5)} - ${item.gio_ket_thuc.slice(0, 5)}</span>
                    <span class="text-slate-500 block mt-0.5">Học viên: <strong class="text-[#1a1c1d]">${item.ten_hoc_vien}</strong> | ${item.loai_buoi === 'ca_nhan' ? 'Kèm 1-1' : 'Lớp nhóm'}</span>
                  </div>
                  <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
                    ${item.trang_thai === 'cho_hoc' ? `
                       <button onclick="window.confirmAttendance(${item.id}, 'da_hoc')" class="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-full text-[10px] font-semibold active:scale-95 transition">Điểm danh học</button>
                       <button onclick="window.confirmAttendance(${item.id}, 'vang')" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-full text-[10px] font-semibold active:scale-95 transition">Vắng</button>
                    ` : `
                       <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">${item.trang_thai === 'da_hoc' ? 'Đã dạy' : 'Vắng mặt'}</span>
                    `}
                    <button onclick="window.openReportModal(${item.id}, ${item.hoc_vien_id}, ${item.giao_vien_id}, '${item.ten_hoc_vien}')" class="border border-[#e2e2e4] text-[#1a1c1d] hover:bg-white bg-white px-3 py-1 rounded-full text-[10px] font-semibold active:scale-95 transition shadow-sm">Tạo SLL</button>
                  </div>
                </div>
              `).join('')}
              ${schedules.length === 0 ? '<p class="text-slate-500 text-xs py-4 text-center">Hôm nay bạn không có lịch dạy.</p>' : ''}
            </div>
          </div>
        </div>
      `;

      window.confirmAttendance = async function(id, status) {
        try {
          const res = await fetch(`${API_BASE}/attendance/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trang_thai: status })
          });
          const result = await res.json();
          if (result.success) {
            showToast('Điểm danh thành công!');
            renderOverview(container, role);
          } else {
            showToast(result.error, 'error');
          }
        } catch (err) {
          showToast('Lỗi máy chủ', 'error');
        }
      };
    } else {
      container.innerHTML = `
        <div class="bg-white border border-[#e2e2e4] rounded-2xl p-6 max-w-xl space-y-4 shadow-sm">
          <h3 class="font-bold text-[#1a1c1d] text-base apple-headline">Chào mừng bạn đến với Stellar Academy!</h3>
          <p class="text-slate-600 text-xs leading-relaxed">Hệ thống quản lý trung tâm tiếng Anh. Liên hệ ban quản lý để được cấp quyền truy cập chức năng.</p>
        </div>
      `;
    }
  } catch (err) {
    container.innerHTML = `
      <div class="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-xs">
        <strong>Lỗi tải dữ liệu:</strong> ${err.message}
      </div>
    `;
  }
}
