import { API_BASE, showToast } from './_shared.js';

export async function renderSalaryManagement(container) {
  const userRole = localStorage.getItem('userRole') || 'hoc_vien';

  if (userRole !== 'admin' && userRole !== 'le_tan') {
    container.innerHTML = `
      <div class="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-xs">
        Bạn không có quyền truy cập vào chức năng quản lý lương này.
      </div>
    `;
    return;
  }

  const now = new Date();
  let filterMonth = now.getMonth() + 1;
  let filterYear = now.getFullYear();

  async function initLayout() {
    container.innerHTML = `
      <div class="space-y-6 animate-fadeIn">
        
        <!-- Header & Action Row -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 class="font-bold text-apple-ink text-sm">Bảng lương nhân sự</h3>
          <div class="flex items-center gap-2">
            <!-- Dropdown lọc kỳ lương -->
            <select id="salary-filter-month" class="border border-slate-200 rounded-full px-3 py-1.5 text-xs bg-white outline-none cursor-pointer focus:border-apple-blue font-bold text-slate-700">
              ${Array.from({ length: 12 }, (_, i) => i + 1).map(m => `<option value="${m}" ${m === filterMonth ? 'selected' : ''}>Tháng ${m}</option>`).join('')}
            </select>
            <select id="salary-filter-year" class="border border-slate-200 rounded-full px-3 py-1.5 text-xs bg-white outline-none cursor-pointer focus:border-apple-blue font-bold text-slate-700">
              ${[2025, 2026, 2027].map(y => `<option value="${y}" ${y === filterYear ? 'selected' : ''}>Năm ${y}</option>`).join('')}
            </select>
            
            <button id="btn-refresh-salary" class="flex items-center justify-center gap-1.5 px-4 py-2 border border-[#e2e2e4] hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-full transition-all active:scale-95 shadow-sm h-[32px]">
              <span class="material-symbols-outlined text-[16px]">refresh</span>Tải lại
            </button>
          </div>
        </div>

        <!-- Bento KPI Cards Lương -->
        <div id="salary-kpi-container" class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Rendered by JS -->
        </div>

        <!-- Bảng chi tiết lương nhân sự -->
        <div class="bg-white border border-[#e2e2e4] rounded-2xl shadow-sm overflow-hidden">
          <div class="p-5 border-b border-[#f3f3f5] flex justify-between items-center bg-slate-50/50">
            <h3 class="font-bold text-slate-700 text-xs uppercase tracking-wider">Bảng thanh toán lương chi tiết</h3>
            <span class="text-[10px] bg-blue-50 text-apple-blue px-2.5 py-0.5 rounded-full font-bold">Thanh toán tự động</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
        <tr class="border-b border-[#e2e2e4] text-slate-400 uppercase text-[10px] tracking-wider bg-slate-50/20">
                  <th class="py-3 px-5 font-semibold">Nhân sự</th>
                  <th class="py-3 px-5 font-semibold">Công quét (ngày)</th>
                  <th class="py-3 px-5 font-semibold">Ca dạy (Nhóm/Kèm)</th>
                  <th class="py-3 px-5 font-semibold">Mức lương gốc</th>
                  <th class="py-3 px-5 font-semibold">Phụ cấp & Thưởng</th>
                  <th class="py-3 px-5 font-semibold">Khấu trừ / Tạm ứng</th>
                  <th class="py-3 px-5 font-semibold">Thực lĩnh</th>
                  <th class="py-3 px-5 font-semibold">Trạng thái</th>
                  <th class="py-3 px-5 font-semibold text-right">Hành động</th>
                </tr>
              </thead>
              <tbody id="salary-table-body" class="divide-y divide-[#f3f3f5]">
                <!-- Rendered by JS -->
              </tbody>
            </table>
          </div>
        </div>

        <!-- Modal xem chi tiết (Cải tiến 3) -->
        <div id="salary-detail-modal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] hidden flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[80vh]">
            <div class="p-5 border-b border-[#f3f3f5] flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 id="detail-modal-title" class="font-extrabold text-slate-800 text-sm">Chi tiết hoạt động trong tháng</h3>
                <p id="detail-modal-subtitle" class="text-[10px] text-slate-400 mt-0.5"></p>
              </div>
              <button id="close-salary-detail-modal" class="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                <span class="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
            <div class="p-5 overflow-y-auto max-h-[50vh]">
              <table class="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr class="border-b border-[#e2e2e4] text-slate-400 uppercase text-[9px] tracking-wider">
                    <th id="modal-table-header-1" class="pb-2 font-semibold">Thời gian / Ngày học</th>
                    <th id="modal-table-header-2" class="pb-2 font-semibold">Thông tin chi tiết</th>
                  </tr>
                </thead>
                <tbody id="detail-modal-body" class="divide-y divide-[#f3f3f5]">
                  <!-- Rendered dynamically -->
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    `;

    document.getElementById('close-salary-detail-modal')?.addEventListener('click', () => {
      document.getElementById('salary-detail-modal').classList.add('hidden');
    });

    document.getElementById('salary-filter-month')?.addEventListener('change', (e) => {
      filterMonth = parseInt(e.target.value);
      loadSalaryData();
    });

    document.getElementById('salary-filter-year')?.addEventListener('change', (e) => {
      filterYear = parseInt(e.target.value);
      loadSalaryData();
    });

    document.getElementById('btn-refresh-salary')?.addEventListener('click', () => {
      loadSalaryData();
    });

    loadSalaryData();
  }

  // Load và tính toán lương
  async function loadSalaryData() {
    const kpiContainer = document.getElementById('salary-kpi-container');
    const tableBody = document.getElementById('salary-table-body');
    if (!kpiContainer || !tableBody) return;

    kpiContainer.innerHTML = Array.from({ length: 4 }).map(() => `
      <div class="bg-white border border-[#e2e2e4] rounded-2xl p-5 shadow-sm min-h-[100px] flex items-center justify-center">
        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-apple-blue"></div>
      </div>
    `).join('');

    tableBody.innerHTML = `
      <tr>
        <td colspan="9" class="py-8 text-center text-slate-400 text-xs italic">Đang tải dữ liệu và tính toán bảng lương...</td>
      </tr>
    `;

    try {
      const res = await fetch(`${API_BASE}/payroll/summary?month=${filterMonth}&year=${filterYear}`, {
        headers: {
          'x-user-role': userRole,
          'x-user-branch': localStorage.getItem('userBranch') || 'Trung tâm chính'
        }
      });
      const data = await res.json();
      const records = data.data || [];

      // Hàm cập nhật KPI Cards động tại Client (Cải tiến 1)
      function updateKPICards() {
        let totalThucLinh = 0;
        let totalPaid = 0;
        let totalUnpaid = 0;
        let totalSessions = 0;

        records.forEach(r => {
          totalThucLinh += r.thuc_linh;
          if (r.trang_thai === 'da_thanh_toan') {
            totalPaid += r.thuc_linh;
          } else {
            totalUnpaid += r.thuc_linh;
          }
          totalSessions += (r.group_sessions + r.tutor_sessions);
        });

        kpiContainer.innerHTML = `
          <!-- Card 1 -->
          <div class="bg-white border border-[#e2e2e4] rounded-2xl p-5 flex flex-col justify-between shadow-sm min-h-[120px] hover:border-[#0066cc]/50 hover:shadow-md transition-all duration-300">
            <div class="flex justify-between items-start">
              <div>
                <span class="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Tổng quỹ lương</span>
                <span class="text-2xl font-extrabold text-[#1a1c1d] block mt-2 tracking-tight">${totalThucLinh.toLocaleString('vi-VN')}đ</span>
              </div>
              <div class="p-2.5 bg-blue-50 text-apple-blue rounded-xl">
                <span class="material-symbols-outlined text-[20px]">payments</span>
              </div>
            </div>
            <p class="text-[10px] text-slate-400 mt-3">Tổng quỹ chi trả lương tháng ${filterMonth}/${filterYear}</p>
          </div>

          <!-- Card 2 -->
          <div class="bg-white border border-[#e2e2e4] rounded-2xl p-5 flex flex-col justify-between shadow-sm min-h-[120px] hover:border-[#0066cc]/50 hover:shadow-md transition-all duration-300">
            <div class="flex justify-between items-start">
              <div>
                <span class="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Đã thanh toán</span>
                <span class="text-2xl font-extrabold text-emerald-600 block mt-2 tracking-tight">${totalPaid.toLocaleString('vi-VN')}đ</span>
              </div>
              <div class="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <span class="material-symbols-outlined text-[20px]">price_check</span>
              </div>
            </div>
            <p class="text-[10px] text-slate-400 mt-3">Đã duyệt chi tiền lương hoàn tất</p>
          </div>

          <!-- Card 3 -->
          <div class="bg-white border border-[#e2e2e4] rounded-2xl p-5 flex flex-col justify-between shadow-sm min-h-[120px] hover:border-[#0066cc]/50 hover:shadow-md transition-all duration-300">
            <div class="flex justify-between items-start">
              <div>
                <span class="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Chưa thanh toán</span>
                <span class="text-2xl font-extrabold text-amber-600 block mt-2 tracking-tight">${totalUnpaid.toLocaleString('vi-VN')}đ</span>
              </div>
              <div class="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <span class="material-symbols-outlined text-[20px]">pending_actions</span>
              </div>
            </div>
            <p class="text-[10px] text-slate-400 mt-3">Tiền lương chờ phê duyệt chi trả</p>
          </div>

          <!-- Card 4 -->
          <div class="bg-white border border-[#e2e2e4] rounded-2xl p-5 flex flex-col justify-between shadow-sm min-h-[120px] hover:border-[#0066cc]/50 hover:shadow-md transition-all duration-300">
            <div class="flex justify-between items-start">
              <div>
                <span class="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Ca dạy giáo viên</span>
                <span class="text-2xl font-extrabold text-apple-blue block mt-2 tracking-tight">${totalSessions} ca</span>
              </div>
              <div class="p-2.5 bg-blue-50 text-apple-blue rounded-xl">
                <span class="material-symbols-outlined text-[20px]">school</span>
              </div>
            </div>
            <p class="text-[10px] text-slate-400 mt-3">Số ca dạy học hoàn thành trong tháng</p>
          </div>
        `;
      }

      updateKPICards();

      // Render danh sách lương chi tiết
      tableBody.innerHTML = records.map((r, index) => {
        const isPaid = r.trang_thai === 'da_thanh_toan';
        const isTeacher = r.loai_ho_so === 'giao_vien';

        // Lương cơ bản / Lương ca
        let detailLuongText = '';
        if (isTeacher) {
          detailLuongText = `
            <div class="font-semibold text-slate-700 text-[11px]">Nhóm: ${r.don_gia_ca_nhom ? r.don_gia_ca_nhom.toLocaleString('vi-VN') : '150.000'}đ/ca</div>
            <div class="text-[10px] text-slate-400 mt-0.5">Kèm: ${r.don_gia_ca_kem ? r.don_gia_ca_kem.toLocaleString('vi-VN') : '200.000'}đ/ca</div>
          `;
        } else {
          detailLuongText = `
            <div class="font-semibold text-slate-700 text-[11px]">${r.luong_cung_ngay ? r.luong_cung_ngay.toLocaleString('vi-VN') : '300.000'}đ/ngày</div>
            <div class="text-[10px] text-slate-400 mt-0.5">Tính theo công quét thẻ</div>
          `;
        }

        const statusClass = isPaid
          ? 'bg-emerald-100 text-emerald-800'
          : 'bg-yellow-50 text-yellow-800 border border-yellow-200';
        const statusLabel = isPaid
          ? 'Đã thanh toán'
          : 'Chưa thanh toán';

        // Cấu hình ô nhập liệu Phụ cấp & Khấu trừ (Cải tiến 1)
        const phuCapInput = isPaid
          ? `<span class="font-bold text-slate-600">${r.phu_cap.toLocaleString('vi-VN')}đ</span>`
          : `<div class="flex items-center border border-slate-200 hover:border-slate-300 rounded-lg px-2 py-1 bg-white max-w-[110px]">
               <input type="text" class="input-phu-cap w-full outline-none text-slate-700 text-center font-bold text-[11px]" data-idx="${index}" value="${r.phu_cap.toLocaleString('vi-VN')}">
               <span class="text-[10px] text-slate-400 font-semibold ml-0.5">đ</span>
             </div>`;

        const khauTruInput = isPaid
          ? `<span class="font-bold text-red-600">${r.khau_tru ? r.khau_tru.toLocaleString('vi-VN') : '0'}đ</span>`
          : `<div class="flex items-center border border-slate-200 hover:border-slate-300 rounded-lg px-2 py-1 bg-white max-w-[110px]">
               <input type="text" class="input-khau-tru w-full outline-none text-slate-700 text-center font-bold text-[11px] text-red-600" data-idx="${index}" value="${r.khau_tru ? r.khau_tru.toLocaleString('vi-VN') : '0'}">
               <span class="text-[10px] text-slate-400 font-semibold ml-0.5">đ</span>
             </div>`;

        return `
          <tr class="hover:bg-slate-50/50 transition-colors">
            <td class="py-3 px-5">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-full bg-apple-blue/10 flex items-center justify-center font-bold text-apple-blue text-xs select-none">
                  ${r.ho_ten.charAt(0)}
                </div>
                <div>
                  <span class="font-bold text-slate-800 block text-xs">${r.ho_ten}</span>
                  <span class="text-[10px] text-slate-400 block">${r.ma_ho_so} — ${isTeacher ? 'Giáo viên' : 'Nhân viên'}</span>
                </div>
              </div>
            </td>
            <td class="py-3 px-5">
              <button type="button" class="btn-view-work-days text-apple-blue hover:underline font-bold text-[11.5px] text-left cursor-pointer" data-idx="${index}">
                ${r.work_days} ngày công
              </button>
            </td>
            <td class="py-3 px-5">
              ${isTeacher
            ? `<button type="button" class="btn-view-sessions text-apple-blue hover:underline font-bold text-[11.5px] text-left cursor-pointer" data-idx="${index}">
                     ${r.group_sessions + r.tutor_sessions} ca dạy
                   </button>
                   <div class="text-[9px] text-slate-400 mt-0.5">(${r.group_sessions} nhóm / ${r.tutor_sessions} kèm)</div>`
            : '<span class="text-slate-400 font-medium">—</span>'}
            </td>
            <td class="py-3 px-5">${detailLuongText}</td>
            <td class="py-3 px-5">${phuCapInput}</td>
            <td class="py-3 px-5">${khauTruInput}</td>
            <td class="py-3 px-5 font-extrabold text-[#0066cc] text-[13px]">
              <span class="row-thuc-linh" id="thuc-linh-${index}">${r.thuc_linh.toLocaleString('vi-VN')}</span>đ
            </td>
            <td class="py-3 px-5">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusClass}">
                ${statusLabel}
              </span>
              ${r.ngay_thanh_toan ? `<div class="text-[9px] text-slate-400 mt-1 font-semibold">${new Date(r.ngay_thanh_toan).toLocaleDateString('vi-VN')}</div>` : ''}
            </td>
            <td class="py-3 px-5 text-right">
              ${isPaid
            ? `<span class="text-slate-400 font-bold text-[11px]">Đã duyệt chi</span>`
            : `<button type="button" class="btn-pay-salary px-3 py-1 bg-apple-blue text-white text-[10.5px] font-bold rounded-full hover:opacity-90 active:scale-95 transition-all shadow-sm" data-idx="${index}">Thanh toán</button>`}
            </td>
          </tr>
        `;
      }).join('');

      // Lắng nghe sự kiện input đổi Phụ cấp & Khấu trừ (Cải tiến 1)
      tableBody.querySelectorAll('.input-phu-cap').forEach(input => {
        input.addEventListener('input', (e) => {
          // Format có dấu chấm phân cách hàng nghìn
          let cleanValue = e.target.value.replace(/\D/g, '');
          let numVal = parseFloat(cleanValue) || 0;
          e.target.value = numVal.toLocaleString('vi-VN');

          const idx = parseInt(e.target.getAttribute('data-idx'));
          const r = records[idx];
          if (!r) return;

          // Cập nhật giá trị phụ cấp
          r.phu_cap = numVal;

          // Tính toán lại thực lĩnh
          let khauTruInputVal = tableBody.querySelector(`.input-khau-tru[data-idx="${idx}"]`)?.value || '0';
          let khauTruVal = parseFloat(khauTruInputVal.replace(/\./g, '')) || 0;
          r.khau_tru = khauTruVal;

          r.thuc_linh = r.luong_cung + r.luong_ca_day + r.phu_cap - r.khau_tru;

          document.getElementById(`thuc-linh-${idx}`).textContent = r.thuc_linh.toLocaleString('vi-VN');
          updateKPICards();
        });
      });

      tableBody.querySelectorAll('.input-khau-tru').forEach(input => {
        input.addEventListener('input', (e) => {
          let cleanValue = e.target.value.replace(/\D/g, '');
          let numVal = parseFloat(cleanValue) || 0;
          e.target.value = numVal.toLocaleString('vi-VN');

          const idx = parseInt(e.target.getAttribute('data-idx'));
          const r = records[idx];
          if (!r) return;

          // Cập nhật giá trị khấu trừ
          r.khau_tru = numVal;

          // Tính toán lại thực lĩnh
          let phuCapInputVal = tableBody.querySelector(`.input-phu-cap[data-idx="${idx}"]`)?.value || '0';
          let phuCapVal = parseFloat(phuCapInputVal.replace(/\./g, '')) || 0;
          r.phu_cap = phuCapVal;

          r.thuc_linh = r.luong_cung + r.luong_ca_day + r.phu_cap - r.khau_tru;

          document.getElementById(`thuc-linh-${idx}`).textContent = r.thuc_linh.toLocaleString('vi-VN');
          updateKPICards();
        });
      });

      // Xem chi tiết công chấm công (Cải tiến 3)
      tableBody.querySelectorAll('.btn-view-work-days').forEach(btn => {
        btn.addEventListener('click', async () => {
          const idx = parseInt(btn.getAttribute('data-idx'));
          const record = records[idx];
          if (!record) return;

          const modal = document.getElementById('salary-detail-modal');
          const title = document.getElementById('detail-modal-title');
          const subtitle = document.getElementById('detail-modal-subtitle');
          const th1 = document.getElementById('modal-table-header-1');
          const th2 = document.getElementById('modal-table-header-2');
          const body = document.getElementById('detail-modal-body');

          title.textContent = `Lịch sử quét thẻ check-in / check-out`;
          subtitle.textContent = `Nhân sự: ${record.ho_ten} — Tháng ${filterMonth}/${filterYear}`;
          th1.textContent = 'Ngày làm việc';
          th2.textContent = 'Trạng thái chấm công';

          body.innerHTML = `<tr><td colspan="2" class="py-4 text-center text-slate-400 italic">Đang tải lịch sử chấm công...</td></tr>`;
          modal.classList.remove('hidden');

          try {
            // Lấy log chi tiết chấm công của người đó
            const res = await fetch(`${API_BASE}/checkin-logs`, {
              headers: {
                'x-user-role': userRole,
                'x-user-branch': localStorage.getItem('userBranch') || 'Trung tâm chính'
              }
            });
            const d = await res.json();
            const allLogs = d.data || [];

            // Lọc log thuộc về tháng này và hồ sơ này
            const filtered = allLogs.filter(log => {
              if (log.ho_so_id !== record.id) return false;
              const date = new Date(log.ngay_quet);
              return (date.getMonth() + 1) === filterMonth && date.getFullYear() === filterYear;
            });

            // Group logs theo ngày học để hiển thị danh sách ngày và các lượt quét
            const dayMap = {};
            filtered.forEach(log => {
              if (!dayMap[log.ngay_quet]) dayMap[log.ngay_quet] = [];
              dayMap[log.ngay_quet].push(log.gio_quet ? log.gio_quet.slice(0, 5) : 'Quét');
            });

            const sortedDays = Object.keys(dayMap).sort((a, b) => b.localeCompare(a)); // mới nhất lên đầu

            if (sortedDays.length === 0) {
              body.innerHTML = `<tr><td colspan="2" class="py-4 text-center text-slate-400 italic">Không có dữ liệu chấm quét thẻ trong tháng.</td></tr>`;
            } else {
              body.innerHTML = sortedDays.map(dayStr => {
                const times = dayMap[dayStr];
                const cleanDayStr = dayStr.split('-').reverse().join('/');
                return `
                  <tr class="hover:bg-slate-50/50">
                    <td class="py-2.5 font-bold text-slate-700">${cleanDayStr}</td>
                    <td class="py-2.5">
                      <div class="flex flex-wrap gap-1">
                        ${times.map(t => `<span class="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-semibold text-[10px]">${t}</span>`).join('')}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('');
            }
          } catch (e) {
            body.innerHTML = `<tr><td colspan="2" class="py-4 text-center text-red-500 italic">Lỗi khi tải thông tin: ${e.message}</td></tr>`;
          }
        });
      });

      // Xem chi tiết ca dạy giáo viên (Cải tiến 3)
      tableBody.querySelectorAll('.btn-view-sessions').forEach(btn => {
        btn.addEventListener('click', async () => {
          const idx = parseInt(btn.getAttribute('data-idx'));
          const record = records[idx];
          if (!record) return;

          const modal = document.getElementById('salary-detail-modal');
          const title = document.getElementById('detail-modal-title');
          const subtitle = document.getElementById('detail-modal-subtitle');
          const th1 = document.getElementById('modal-table-header-1');
          const th2 = document.getElementById('modal-table-header-2');
          const body = document.getElementById('detail-modal-body');

          title.textContent = `Danh sách ca dạy học đã dạy`;
          subtitle.textContent = `Giáo viên: ${record.ho_ten} — Tháng ${filterMonth}/${filterYear}`;
          th1.textContent = 'Thời gian học';
          th2.textContent = 'Thông tin ca học & Loại hình';

          body.innerHTML = `<tr><td colspan="2" class="py-4 text-center text-slate-400 italic">Đang tải lịch sử giảng dạy...</td></tr>`;
          modal.classList.remove('hidden');

          try {
            const res = await fetch(`${API_BASE}/schedules?giao_vien_id=${record.id}`, {
              headers: {
                'x-user-role': userRole,
                'x-user-branch': localStorage.getItem('userBranch') || 'Trung tâm chính'
              }
            });
            const d = await res.json();
            const allSessions = d.data || [];

            // Lọc các ca dạy đã học thành công của tháng hiện tại
            const filtered = allSessions.filter(s => {
              if (s.trang_thai !== 'da_hoc') return false;
              const date = new Date(s.ngay_hoc);
              return (date.getMonth() + 1) === filterMonth && date.getFullYear() === filterYear;
            });

            if (filtered.length === 0) {
              body.innerHTML = `<tr><td colspan="2" class="py-4 text-center text-slate-400 italic">Không tìm thấy ca dạy học nào đã hoàn thành trong tháng.</td></tr>`;
            } else {
              body.innerHTML = filtered.map(s => {
                const dateClean = s.ngay_hoc.split('-').reverse().join('/');
                const isNhom = s.loai_buoi === 'nhom';
                const typeTag = isNhom
                  ? `<span class="px-2 py-0.5 bg-blue-50 text-apple-blue border border-blue-100 rounded-full font-bold text-[9px]">Lớp nhóm</span>`
                  : `<span class="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full font-bold text-[9px]">Kèm 1-1</span>`;

                return `
                  <tr class="hover:bg-slate-50/50">
                    <td class="py-2.5 font-bold text-slate-700">
                      <div>${dateClean}</div>
                      <div class="text-[10px] text-slate-400 font-semibold mt-0.5">${s.gio_bat_dau.slice(0, 5)} - ${s.gio_ket_thuc.slice(0, 5)}</div>
                    </td>
                    <td class="py-2.5">
                      <div class="font-bold text-slate-800 text-[11.5px]">${s.ten_hoc_vien || 'Lớp học nhóm'}</div>
                      <div class="flex items-center gap-1.5 mt-1">
                        ${typeTag}
                        <span class="text-[10px] text-slate-400 font-semibold">GV: ${s.ten_giao_vien}</span>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('');
            }
          } catch (e) {
            body.innerHTML = `<tr><td colspan="2" class="py-4 text-center text-red-500 italic">Lỗi khi tải thông tin: ${e.message}</td></tr>`;
          }
        });
      });

      // Gắn sự kiện click Thanh toán
      tableBody.querySelectorAll('.btn-pay-salary').forEach(btn => {
        btn.addEventListener('click', async () => {
          const idx = parseInt(btn.getAttribute('data-idx'));
          const record = records[idx];
          if (!record) return;

          if (!confirm(`Xác nhận thanh toán lương tháng ${filterMonth}/${filterYear} cho nhân sự ${record.ho_ten} với số tiền thực lĩnh ${record.thuc_linh.toLocaleString('vi-VN')}đ?\n(Phụ cấp: ${record.phu_cap.toLocaleString('vi-VN')}đ, Khấu trừ: ${record.khau_tru.toLocaleString('vi-VN')}đ)`)) {
            return;
          }

          try {
            const res = await fetch(`${API_BASE}/payroll/${record.id}/pay`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'x-user-role': userRole,
                'x-user-branch': localStorage.getItem('userBranch') || 'Trung tâm chính'
              },
              body: JSON.stringify({
                month: filterMonth,
                year: filterYear,
                luong_cung: record.luong_cung,
                luong_ca_day: record.luong_ca_day,
                phu_cap: record.phu_cap,
                khau_tru: record.khau_tru,
                thuc_linh: record.thuc_linh
              })
            });

            const result = await res.json();
            if (result.success) {
              showToast(`Thanh toán lương cho ${record.ho_ten} thành công!`);
              loadSalaryData();
            } else {
              showToast(result.error || 'Lỗi thanh toán lương', 'error');
            }
          } catch (err) {
            showToast('Lỗi kết nối máy chủ', 'error');
          }
        });
      });

      if (records.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="9" class="py-8 text-center text-slate-400 text-xs italic">Không tìm thấy dữ liệu nhân sự phù hợp để hiển thị.</td>
          </tr>
        `;
      }

    } catch (err) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="9" class="py-8 text-center text-red-600 text-xs italic">Lỗi tải dữ liệu bảng lương: ${err.message}</td>
        </tr>
      `;
    }
  }

  initLayout();
}

