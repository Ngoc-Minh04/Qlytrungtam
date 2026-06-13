// Overview.js - Tổng quan Bento Grid — admin / le_tan / giao_vien
import { API_BASE, showToast } from './_shared.js';

export async function renderOverview(container, role) {
  container.innerHTML = `
    <div class="flex justify-center items-center py-16">
      <div class="animate-spin rounded-full h-7 w-7 border-b-2 border-apple-blue"></div>
    </div>
  `;

  try {
    if (role === 'admin' || role === 'le_tan') {
      await renderAdminOverview(container, role);
    } else if (role === 'giao_vien') {
      await renderTeacherOverview(container, role);
    } else {
      renderGuestOverview(container);
    }
  } catch (err) {
    container.innerHTML = `
      <div class="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-5 text-xs">
        <strong>Lỗi tải dữ liệu:</strong> ${err.message}
      </div>
    `;
  }
}

// ============================================================
// ADMIN / LỄ TÂN — Bento Grid đầy đủ
// ============================================================
async function renderAdminOverview(container, role) {
  const [studentsRes, teachersRes, regRes, checkinRes, bookingRes, ratingsRes] = await Promise.allSettled([
    fetch(`${API_BASE}/students`, { headers: { 'X-User-Role': role } }),
    fetch(`${API_BASE}/teachers`, { headers: { 'X-User-Role': role } }),
    fetch(`${API_BASE}/registrations`, { headers: { 'X-User-Role': role } }),
    fetch(`${API_BASE}/checkins`),
    fetch(`${API_BASE}/booking-requests`, { headers: { 'X-User-Role': 'admin' } }),
    fetch(`${API_BASE}/ratings`, { headers: { 'X-User-Role': 'admin' } }),
  ]);

  const students    = studentsRes.status === 'fulfilled'  ? (await studentsRes.value.json()).data  || [] : [];
  const teachers    = teachersRes.status === 'fulfilled'  ? (await teachersRes.value.json()).data  || [] : [];
  const regs        = regRes.status === 'fulfilled'       ? (await regRes.value.json()).data       || [] : [];
  const checkins    = checkinRes.status === 'fulfilled'   ? (await checkinRes.value.json()).data   || [] : [];
  const bookings    = bookingRes.status === 'fulfilled'   ? (await bookingRes.value.json()).data   || [] : [];
  const ratingsData = ratingsRes.status === 'fulfilled'   ? await ratingsRes.value.json()                : {};
  const ratings     = ratingsData.data || [];
  const ratingStats = ratingsData.stats || [];

  // --- Stats tính toán ---
  const todayStr = new Date().toLocaleDateString('en-CA');
  const checkinsToday = checkins.filter(c => c.ngay_quet && c.ngay_quet.startsWith(todayStr));
  const earliestCheckin = checkinsToday.length > 0
    ? [...checkinsToday].sort((a, b) => a.gio_quet.localeCompare(b.gio_quet))[0]
    : null;

  const paidRegs   = regs.filter(r => r.trang_thai_thanh_toan === 'da_thanh_toan');
  const unpaidRegs = regs.filter(r => r.trang_thai_thanh_toan !== 'da_thanh_toan' && r.trang_thai !== 'huy');

  const totalRevenue   = paidRegs.reduce((s, r) => s + parseFloat(r.so_tien_phai_nop || 0), 0);
  const unpaidRevenue  = unpaidRegs.reduce((s, r) => s + parseFloat(r.so_tien_phai_nop || 0), 0);

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthRevenue = paidRegs
    .filter(r => r.ngay_dang_ky && r.ngay_dang_ky.startsWith(thisMonth))
    .reduce((s, r) => s + parseFloat(r.so_tien_phai_nop || 0), 0);

  const pendingBookings = bookings.filter(b => b.trang_thai === 'cho_duyet');
  const cancelRequests  = regs.filter(r => r.trang_thai === 'huy');

  // Gói bán chạy
  const pkgMap = {};
  paidRegs.forEach(r => { const k = r.ten_goi || 'Khác'; pkgMap[k] = (pkgMap[k] || 0) + 1; });
  const bestSellers = Object.entries(pkgMap).sort((a, b) => b[1] - a[1]).slice(0, 3);

  // Rating trung bình
  const avgRating = ratings.length > 0
    ? (ratings.reduce((s, r) => s + (r.so_sao || 0), 0) / ratings.length).toFixed(1)
    : null;
  const topTeacher = ratingStats.length > 0 ? ratingStats[0] : null;

  // Feed hoạt động gần đây
  const feedItems = [];
  regs.slice(0, 4).forEach(r => {
    if (!r.ngay_dang_ky) return;
    feedItems.push({
      time: new Date(r.ngay_dang_ky),
      icon: 'payments',
      color: 'bg-emerald-50 text-emerald-600',
      text: `<strong>${r.ho_ten || 'HV'}</strong> đăng ký gói <em>${r.ten_goi || 'mới'}</em>`,
      page: 'course-registrations'
    });
  });
  checkinsToday.slice(0, 4).forEach(c => {
    const d = new Date(`${todayStr}T${c.gio_quet}`);
    feedItems.push({
      time: d,
      icon: 'login',
      color: 'bg-blue-50 text-blue-600',
      text: `<strong>${c.ho_ten || 'Học viên'}</strong> check-in vào trung tâm`,
      page: 'checkin-logs'
    });
  });
  feedItems.sort((a, b) => b.time - a.time);

  const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);

  container.innerHTML = `
    <div class="space-y-4 animate-fadeIn">

      <!-- Header row -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-[17px] font-bold text-slate-800 tracking-tight">Tổng quan hệ thống</h1>
          <p class="text-[11px] text-slate-400 mt-0.5">${new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
        <button id="btn-refresh-overview"
          class="flex items-center gap-1.5 px-3.5 py-2 border border-[#e2e2e4] hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-full transition-all active:scale-95 shadow-sm">
          <span class="material-symbols-outlined text-[15px]">refresh</span>Tải lại
        </button>
      </div>

      <!-- ===== BENTO ROW 1: KPI nhỏ x4 ===== -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">

        <!-- HV -->
        <div class="bento-card group cursor-pointer bg-white border border-[#e2e2e4] rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 active:scale-[0.98]"
          data-nav="students-group">
          <div class="flex items-start justify-between mb-3">
            <div class="p-2 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
              <span class="material-symbols-outlined text-blue-600 text-[20px]">group</span>
            </div>
            <span class="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wide">Active</span>
          </div>
          <div class="text-3xl font-extrabold text-slate-800 tracking-tight leading-none">${students.length}</div>
          <div class="text-[11px] font-medium text-slate-500 mt-1">Tổng học viên</div>
          <div class="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
            <span class="material-symbols-outlined text-[12px] text-blue-400">arrow_forward</span>Xem danh sách
          </div>
        </div>

        <!-- GV -->
        <div class="bento-card group cursor-pointer bg-white border border-[#e2e2e4] rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-200 active:scale-[0.98]"
          data-nav="teachers-group">
          <div class="flex items-start justify-between mb-3">
            <div class="p-2 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition-colors">
              <span class="material-symbols-outlined text-purple-600 text-[20px]">badge</span>
            </div>
            <span class="text-[9px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full uppercase tracking-wide">GV</span>
          </div>
          <div class="text-3xl font-extrabold text-slate-800 tracking-tight leading-none">${teachers.length}</div>
          <div class="text-[11px] font-medium text-slate-500 mt-1">Giáo viên & Trợ giảng</div>
          <div class="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
            <span class="material-symbols-outlined text-[12px] text-purple-400">arrow_forward</span>Xem nhân sự
          </div>
        </div>

        <!-- Buổi hôm nay -->
        <div class="bento-card group cursor-pointer bg-white border border-[#e2e2e4] rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-amber-300 transition-all duration-200 active:scale-[0.98]"
          data-nav="schedules">
          <div class="flex items-start justify-between mb-3">
            <div class="p-2 bg-amber-50 rounded-xl group-hover:bg-amber-100 transition-colors">
              <span class="material-symbols-outlined text-amber-600 text-[20px]">calendar_today</span>
            </div>
            <span class="text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wide">Hôm nay</span>
          </div>
          <div class="text-3xl font-extrabold text-slate-800 tracking-tight leading-none">${checkinsToday.length}</div>
          <div class="text-[11px] font-medium text-slate-500 mt-1">Check-in hôm nay</div>
          <div class="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
            <span class="material-symbols-outlined text-[12px] text-amber-400">arrow_forward</span>
            ${earliestCheckin ? `Sớm nhất: ${earliestCheckin.ho_ten.split(' ').pop()} (${earliestCheckin.gio_quet.slice(0,5)})` : 'Xem lượt vào-ra'}
          </div>
        </div>

        <!-- Yêu cầu chờ -->
        <div class="bento-card group cursor-pointer rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98] border
          ${pendingBookings.length > 0 ? 'bg-red-50 border-red-200 hover:border-red-400' : 'bg-white border-[#e2e2e4] hover:border-emerald-300'}"
          data-nav="finance-group">
          <div class="flex items-start justify-between mb-3">
            <div class="p-2 rounded-xl transition-colors ${pendingBookings.length > 0 ? 'bg-red-100' : 'bg-emerald-50 group-hover:bg-emerald-100'}">
              <span class="material-symbols-outlined text-[20px] ${pendingBookings.length > 0 ? 'text-red-600' : 'text-emerald-600'}">pending_actions</span>
            </div>
            ${pendingBookings.length > 0 ? `<span class="text-[9px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full uppercase tracking-wide animate-pulse">Cần xử lý</span>` : `<span class="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wide">OK</span>`}
          </div>
          <div class="text-3xl font-extrabold tracking-tight leading-none ${pendingBookings.length > 0 ? 'text-red-700' : 'text-slate-800'}">${pendingBookings.length}</div>
          <div class="text-[11px] font-medium mt-1 ${pendingBookings.length > 0 ? 'text-red-600' : 'text-slate-500'}">Booking chờ duyệt</div>
          <div class="text-[10px] mt-2 flex items-center gap-1 ${pendingBookings.length > 0 ? 'text-red-400' : 'text-slate-400'}">
            <span class="material-symbols-outlined text-[12px]">arrow_forward</span>Vào xử lý ngay
          </div>
        </div>

      </div>

      <!-- ===== BENTO ROW 2: Doanh thu lớn + Yêu cầu ===== -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">

        <!-- Doanh thu tháng — full width trên mobile, 2/3 trên desktop -->
        <div class="bento-card group cursor-pointer lg:col-span-2 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98]
          bg-gradient-to-br from-[#0055cc] to-[#0a6ebd] border border-[#0055cc] hover:border-blue-400"
          data-nav="revenue-report">
          <div class="flex items-start justify-between mb-4">
            <div>
              <span class="text-[10px] font-bold text-blue-200 uppercase tracking-widest block">Doanh thu tháng ${now.getMonth() + 1}/${now.getFullYear()}</span>
              <div class="text-4xl font-extrabold text-white tracking-tight mt-1">${fmt(monthRevenue)}<span class="text-lg font-semibold text-blue-200 ml-1">đ</span></div>
            </div>
            <div class="p-2.5 bg-white/15 rounded-xl">
              <span class="material-symbols-outlined text-white text-[24px]">payments</span>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3 mt-2">
            <div class="bg-white/10 rounded-xl p-3">
              <div class="text-[10px] text-blue-200 font-semibold uppercase tracking-wide">Tổng doanh thu</div>
              <div class="text-base font-extrabold text-white mt-0.5">${fmt(totalRevenue)} đ</div>
            </div>
            <div class="bg-white/10 rounded-xl p-3">
              <div class="text-[10px] text-blue-200 font-semibold uppercase tracking-wide">Học phí chưa thu</div>
              <div class="text-base font-extrabold text-amber-300 mt-0.5">${fmt(unpaidRevenue)} đ</div>
            </div>
          </div>
          <div class="mt-3 text-[10px] text-blue-200 flex items-center gap-1">
            <span class="material-symbols-outlined text-[12px]">arrow_forward</span>Xem báo cáo chi tiết
          </div>
        </div>

        <!-- Gói bán chạy -->
        <div class="bento-card group cursor-pointer bg-white border border-[#e2e2e4] rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 active:scale-[0.98]"
          data-nav="course-packages-group">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <div class="p-2 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors">
                <span class="material-symbols-outlined text-indigo-600 text-[18px]">school</span>
              </div>
              <span class="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Gói bán chạy</span>
            </div>
          </div>
          <div class="space-y-2.5">
            ${bestSellers.length === 0 ? `<p class="text-xs text-slate-400 py-2 text-center">Chưa có dữ liệu</p>` :
              bestSellers.map(([name, count], idx) => `
                <div class="flex items-center gap-2.5">
                  <span class="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold shrink-0
                    ${idx === 0 ? 'bg-amber-400 text-white' : idx === 1 ? 'bg-slate-300 text-slate-700' : 'bg-orange-300 text-white'}">${idx + 1}</span>
                  <div class="flex-1 min-w-0">
                    <div class="text-[11px] font-semibold text-slate-700 truncate">${name}</div>
                    <div class="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                      <div class="h-full bg-gradient-to-r from-indigo-400 to-indigo-300 rounded-full" style="width:${Math.min(100, (count / (bestSellers[0]?.[1] || 1)) * 100)}%"></div>
                    </div>
                  </div>
                  <span class="text-[10px] font-bold text-indigo-600 shrink-0">${count}</span>
                </div>
              `).join('')
            }
          </div>
          <div class="text-[10px] text-slate-400 mt-3 flex items-center gap-1">
            <span class="material-symbols-outlined text-[12px] text-indigo-400">arrow_forward</span>Quản lý gói học
          </div>
        </div>

      </div>

      <!-- ===== BENTO ROW 3: Chất lượng GV + Yêu cầu HV + Feed ===== -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">

        <!-- Đánh giá GV -->
        <div class="bento-card group cursor-pointer bg-white border border-[#e2e2e4] rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-amber-300 transition-all duration-200 active:scale-[0.98]"
          data-nav="quality-group">
          <div class="flex items-center gap-2 mb-4">
            <div class="p-2 bg-amber-50 rounded-xl group-hover:bg-amber-100 transition-colors">
              <span class="material-symbols-outlined text-amber-500 text-[18px]">star</span>
            </div>
            <span class="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Chất lượng giảng dạy</span>
          </div>
          ${avgRating ? `
            <div class="flex items-end gap-3 mb-3">
              <div class="text-4xl font-extrabold text-slate-800 tracking-tight leading-none">${avgRating}</div>
              <div>
                <div class="flex gap-0.5 mb-1">
                  ${Array.from({length:5}).map((_,i)=>`<span class="material-symbols-outlined fill-current text-[14px] ${i<Math.round(parseFloat(avgRating))?'text-amber-400':'text-slate-200'}">star</span>`).join('')}
                </div>
                <div class="text-[10px] text-slate-400">${ratings.length} lượt đánh giá</div>
              </div>
            </div>
            ${topTeacher ? `
              <div class="bg-amber-50 rounded-xl p-2.5 flex items-center gap-2">
                <span class="material-symbols-outlined text-amber-500 text-[16px]">emoji_events</span>
                <div class="min-w-0">
                  <div class="text-[10px] text-amber-700 font-bold uppercase">GV được yêu thích nhất</div>
                  <div class="text-[11px] font-semibold text-slate-700 truncate">${topTeacher.ho_ten || `GV #${topTeacher.giao_vien_id}`}</div>
                </div>
                <div class="text-amber-600 font-extrabold text-sm ml-auto shrink-0">${parseFloat(topTeacher.trung_binh).toFixed(1)}★</div>
              </div>
            ` : ''}
          ` : `<p class="text-xs text-slate-400 py-4 text-center">Chưa có đánh giá nào</p>`}
          <div class="text-[10px] text-slate-400 mt-3 flex items-center gap-1">
            <span class="material-symbols-outlined text-[12px] text-amber-400">arrow_forward</span>Xem tất cả đánh giá
          </div>
        </div>

        <!-- Yêu cầu tổng hợp -->
        <div class="bento-card group cursor-pointer bg-white border border-[#e2e2e4] rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-rose-300 transition-all duration-200 active:scale-[0.98]"
          data-nav="finance-group">
          <div class="flex items-center gap-2 mb-4">
            <div class="p-2 bg-rose-50 rounded-xl group-hover:bg-rose-100 transition-colors">
              <span class="material-symbols-outlined text-rose-500 text-[18px]">inbox</span>
            </div>
            <span class="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Yêu cầu từ học viên</span>
          </div>
          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-amber-500 text-[16px]">calendar_add_on</span>
                <span class="text-[11px] font-semibold text-slate-700">Đặt lịch chờ duyệt</span>
              </div>
              <span class="text-base font-extrabold ${pendingBookings.length > 0 ? 'text-amber-600' : 'text-slate-400'}">${pendingBookings.length}</span>
            </div>
            <div class="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-red-500 text-[16px]">cancel</span>
                <span class="text-[11px] font-semibold text-slate-700">Đã hủy khóa học</span>
              </div>
              <span class="text-base font-extrabold text-red-500">${cancelRequests.length}</span>
            </div>
            <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-slate-400 text-[16px]">how_to_reg</span>
                <span class="text-[11px] font-semibold text-slate-700">Đăng ký đang hoạt động</span>
              </div>
              <span class="text-base font-extrabold text-slate-700">${regs.filter(r=>r.trang_thai==='dang_hoat_dong').length}</span>
            </div>
          </div>
          <div class="text-[10px] text-slate-400 mt-3 flex items-center gap-1">
            <span class="material-symbols-outlined text-[12px] text-rose-400">arrow_forward</span>Vào xử lý yêu cầu
          </div>
        </div>

        <!-- Feed hoạt động gần đây -->
        <div class="bg-white border border-[#e2e2e4] rounded-2xl p-5 shadow-sm md:col-span-2 lg:col-span-1">
          <div class="flex items-center gap-2 mb-4">
            <div class="p-2 bg-slate-100 rounded-xl">
              <span class="material-symbols-outlined text-slate-500 text-[18px]">dynamic_feed</span>
            </div>
            <span class="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Hoạt động gần đây</span>
          </div>
          <div class="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scroll">
            ${feedItems.length === 0 ? `<p class="text-xs text-slate-400 text-center py-6">Chưa có hoạt động nào.</p>` :
              feedItems.map(item => `
                <div class="flex items-start gap-2.5 py-2 border-b border-[#f3f3f5] last:border-0 cursor-pointer hover:bg-slate-50 rounded-lg px-1 transition-colors feed-item" data-nav="${item.page}">
                  <div class="p-1.5 rounded-lg shrink-0 ${item.color}">
                    <span class="material-symbols-outlined text-[14px]">${item.icon}</span>
                  </div>
                  <div class="min-w-0">
                    <p class="text-[11px] text-slate-700 leading-relaxed">${item.text}</p>
                    <span class="text-[9px] text-slate-400">${item.time.toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})} — ${item.time.toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              `).join('')
            }
          </div>
        </div>

      </div>

      <!-- ===== BENTO ROW 4: Check-in hôm nay banner ===== -->
      ${checkinsToday.length > 0 ? `
      <div class="bento-card group cursor-pointer bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98] border border-slate-600"
        data-nav="checkin-logs">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center gap-3">
            <div class="p-2.5 bg-white/10 rounded-xl">
              <span class="material-symbols-outlined text-white text-[22px]">qr_code_scanner</span>
            </div>
            <div>
              <div class="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Check-in hôm nay</div>
              <div class="text-white font-bold text-sm mt-0.5">
                <span class="text-2xl font-extrabold text-emerald-400">${checkinsToday.length}</span> lượt vào — sớm nhất:
                ${earliestCheckin ? `<span class="text-emerald-300">${earliestCheckin.ho_ten}</span> lúc <span class="text-emerald-300">${earliestCheckin.gio_quet.slice(0,5)}</span>` : '—'}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <span class="material-symbols-outlined text-[14px]">arrow_forward</span>Xem tất cả lượt vào-ra
          </div>
        </div>
      </div>
      ` : ''}

    </div>
    <style>
      .custom-scroll::-webkit-scrollbar { width: 4px; }
      .custom-scroll::-webkit-scrollbar-track { background: transparent; }
      .custom-scroll::-webkit-scrollbar-thumb { background: #e2e2e4; border-radius: 99px; }
    </style>
  `;

  // Navigation events
  container.querySelectorAll('.bento-card[data-nav]').forEach(card => {
    card.addEventListener('click', () => {
      const page = card.dataset.nav;
      if (page && window._navigatePage) window._navigatePage(page);
    });
  });
  container.querySelectorAll('.feed-item[data-nav]').forEach(el => {
    el.addEventListener('click', () => {
      const page = el.dataset.nav;
      if (page && window._navigatePage) window._navigatePage(page);
    });
  });

  document.getElementById('btn-refresh-overview')?.addEventListener('click', () => {
    renderOverview(container, role);
  });
}

// ============================================================
// GIÁO VIÊN
// ============================================================
async function renderTeacherOverview(container, role) {
  const hoSoId = localStorage.getItem('hoSoId') || '1';
  const res = await fetch(`${API_BASE}/schedule/today`, { headers: { 'X-User-Role': role, 'X-Ho-So-Id': hoSoId } });
  const result = await res.json();
  const schedules = result.data || [];
  const done = schedules.filter(s => s.trang_thai === 'da_hoc').length;
  const absent = schedules.filter(s => s.trang_thai === 'vang').length;
  const pending = schedules.filter(s => s.trang_thai === 'cho_hoc').length;

  container.innerHTML = `
    <div class="space-y-4 animate-fadeIn">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-[17px] font-bold text-slate-800 tracking-tight">Lịch dạy học</h1>
          <p class="text-[11px] text-slate-400 mt-0.5">${new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
        <button id="btn-refresh-overview"
          class="flex items-center gap-1.5 px-3.5 py-2 border border-[#e2e2e4] hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-full transition-all active:scale-95 shadow-sm">
          <span class="material-symbols-outlined text-[15px]">refresh</span>Tải lại
        </button>
      </div>

      <!-- KPI row -->
      <div class="grid grid-cols-3 gap-3">
        <div class="bg-gradient-to-br from-[#1a3a5c] to-[#0a6ebd] rounded-2xl p-4 text-white shadow-sm">
          <div class="text-3xl font-extrabold">${schedules.length}</div>
          <div class="text-[10px] text-blue-200 uppercase font-bold mt-1">Tổng ca</div>
        </div>
        <div class="bg-white border border-[#e2e2e4] rounded-2xl p-4 shadow-sm">
          <div class="text-3xl font-extrabold text-emerald-600">${done}</div>
          <div class="text-[10px] text-slate-500 uppercase font-bold mt-1">Hoàn thành</div>
        </div>
        <div class="bg-white border border-[#e2e2e4] rounded-2xl p-4 shadow-sm">
          <div class="text-3xl font-extrabold text-amber-500">${pending}</div>
          <div class="text-[10px] text-slate-500 uppercase font-bold mt-1">Chờ học</div>
        </div>
      </div>

      <!-- Danh sách ca -->
      <div class="bg-white border border-[#e2e2e4] rounded-2xl p-5 shadow-sm space-y-3">
        <h3 class="text-[11px] font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-[#f3f3f5]">Các ca giảng dạy hôm nay</h3>
        ${schedules.length === 0 ? `<p class="text-slate-400 text-xs py-6 text-center">Hôm nay bạn không có lịch dạy.</p>` :
          schedules.map(item => `
            <div class="bg-[#fafafc] rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border border-[#e2e2e4]/65 hover:border-blue-300 transition-colors">
              <div>
                <span class="font-bold text-slate-800 text-sm block">${item.gio_bat_dau.slice(0,5)} – ${item.gio_ket_thuc.slice(0,5)}</span>
                <span class="text-[11px] text-slate-500 mt-0.5 block">HV: <strong class="text-slate-700">${item.ten_hoc_vien}</strong> · ${item.loai_buoi === 'ca_nhan' ? 'Kèm 1-1' : 'Lớp nhóm'}</span>
              </div>
              <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
                ${item.trang_thai === 'cho_hoc' ? `
                  <button onclick="window.confirmAttendance(${item.id}, 'da_hoc')" class="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-full text-[10.5px] font-semibold active:scale-95 transition">Điểm danh</button>
                  <button onclick="window.confirmAttendance(${item.id}, 'vang')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-full text-[10.5px] font-semibold active:scale-95 transition">Vắng</button>
                ` : `
                  <span class="px-3 py-1.5 rounded-full text-[10.5px] font-bold ${item.trang_thai==='da_hoc'?'bg-emerald-50 text-emerald-700':'bg-red-50 text-red-600'}">${item.trang_thai==='da_hoc'?'Đã dạy':'Vắng mặt'}</span>
                `}
                <button onclick="window.openReportModal(${item.id}, ${item.hoc_vien_id}, ${item.giao_vien_id}, '${item.ten_hoc_vien}')"
                  class="border border-[#e2e2e4] bg-white text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-full text-[10.5px] font-semibold active:scale-95 transition shadow-sm">
                  Tạo SLL
                </button>
              </div>
            </div>
          `).join('')
        }
      </div>
    </div>
  `;

  document.getElementById('btn-refresh-overview')?.addEventListener('click', () => renderOverview(container, role));

  window.confirmAttendance = async function (id, status) {
    try {
      const res = await fetch(`${API_BASE}/attendance/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trang_thai: status })
      });
      const result = await res.json();
      if (result.success) { showToast('Điểm danh thành công!'); renderOverview(container, role); }
      else showToast(result.error, 'error');
    } catch { showToast('Lỗi máy chủ', 'error'); }
  };
}

// ============================================================
// GUEST
// ============================================================
function renderGuestOverview(container) {
  container.innerHTML = `
    <div class="bg-white border border-[#e2e2e4] rounded-2xl p-6 max-w-xl shadow-sm">
      <h3 class="font-bold text-slate-800 text-base">Chào mừng đến với Stellar Academy!</h3>
      <p class="text-slate-500 text-xs leading-relaxed mt-2">Hệ thống quản lý trung tâm ngoại ngữ. Liên hệ ban quản lý để được cấp quyền truy cập.</p>
    </div>
  `;
}
