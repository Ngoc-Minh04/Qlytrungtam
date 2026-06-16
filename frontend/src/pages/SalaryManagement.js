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
          <div>
            <h2 class="text-xl font-bold tracking-tight text-slate-800">Tính Lương & Phụ cấp nhân sự</h2>
            <p class="text-xs text-slate-500">Tự động tính toán lương cứng, lương phụ cấp, lương ca giảng dạy dựa trên dữ liệu chấm công và điểm danh lớp học.</p>
          </div>
          
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
                  <th class="py-3 px-5 font-semibold">Lương cứng / ca dạy</th>
                  <th class="py-3 px-5 font-semibold">Phụ cấp & Thưởng</th>
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

      </div>
    `;

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
        <td colspan="8" class="py-8 text-center text-slate-400 text-xs italic">Đang tải dữ liệu và tính toán bảng lương...</td>
      </tr>
    `;

    try {
      const res = await fetch(`${API_BASE}/payroll/summary?month=${filterMonth}&year=${filterYear}`);
      const data = await res.json();
      const records = data.data || [];

      // Tính tổng hợp KPI
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

      // Render Bento KPI Cards
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

      // Render danh sách lương chi tiết
      tableBody.innerHTML = records.map((r, index) => {
        const isPaid = r.trang_thai === 'da_thanh_toan';
        const isTeacher = r.loai_ho_so === 'giao_vien';

        // Lương cơ bản / Lương ca
        const detailLuongText = isTeacher 
          ? `<div class="font-medium text-slate-700">Lớp nhóm: ${r.group_sessions} ca (x150k)</div>
             <div class="text-[10px] text-slate-400 mt-0.5">Học kèm: ${r.tutor_sessions} ca (x200k)</div>`
          : `<div class="font-medium text-slate-700">${r.luong_cung.toLocaleString('vi-VN')}đ</div>
             <div class="text-[10px] text-slate-400 mt-0.5">(300k / ngày công)</div>`;

        const statusClass = isPaid 
          ? 'bg-emerald-100 text-emerald-800' 
          : 'bg-yellow-50 text-yellow-800 border border-yellow-200';
        const statusLabel = isPaid 
          ? 'Đã thanh toán' 
          : 'Chưa thanh toán';

        return `
          <tr class="hover:bg-slate-50/50 transition-colors">
            <td class="py-3.5 px-5">
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
            <td class="py-3.5 px-5 text-slate-600 font-semibold text-[11px]">${r.work_days} ngày công</td>
            <td class="py-3.5 px-5 text-slate-500 font-medium">${isTeacher ? `${r.group_sessions + r.tutor_sessions} ca dạy` : '—'}</td>
            <td class="py-3.5 px-5">${detailLuongText}</td>
            <td class="py-3.5 px-5 font-bold text-slate-600">${r.phu_cap.toLocaleString('vi-VN')}đ</td>
            <td class="py-3.5 px-5 font-extrabold text-[#0066cc] text-[13px]">${r.thuc_linh.toLocaleString('vi-VN')}đ</td>
            <td class="py-3.5 px-5">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusClass}">
                ${statusLabel}
              </span>
              ${r.ngay_thanh_toan ? `<div class="text-[9px] text-slate-400 mt-1 font-semibold">${new Date(r.ngay_thanh_toan).toLocaleDateString('vi-VN')}</div>` : ''}
            </td>
            <td class="py-3.5 px-5 text-right">
              ${isPaid 
                ? `<span class="text-slate-400 font-bold text-[11px]">Đã duyệt chi</span>` 
                : `<button type="button" class="btn-pay-salary px-3 py-1 bg-apple-blue text-white text-[10.5px] font-bold rounded-full hover:opacity-90 active:scale-95 transition-all shadow-sm" data-idx="${index}">Thanh toán</button>`}
            </td>
          </tr>
        `;
      }).join('');

      // Gắn sự kiện click Thanh toán
      tableBody.querySelectorAll('.btn-pay-salary').forEach(btn => {
        btn.addEventListener('click', async () => {
          const idx = parseInt(btn.getAttribute('data-idx'));
          const record = records[idx];
          if (!record) return;

          if (!confirm(`Xác nhận thanh toán lương tháng ${filterMonth}/${filterYear} cho nhân sự ${record.ho_ten} với số tiền thực lĩnh ${record.thuc_linh.toLocaleString('vi-VN')}đ?`)) {
            return;
          }

          try {
            const res = await fetch(`${API_BASE}/payroll/${record.id}/pay`, {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json',
                'X-User-Role': 'le_tan'
              },
              body: JSON.stringify({
                month: filterMonth,
                year: filterYear,
                luong_cung: record.luong_cung,
                luong_ca_day: record.luong_ca_day,
                phu_cap: record.phu_cap,
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
            <td colspan="8" class="py-8 text-center text-slate-400 text-xs italic">Không tìm thấy dữ liệu nhân sự phù hợp để hiển thị.</td>
          </tr>
        `;
      }

    } catch (err) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" class="py-8 text-center text-red-600 text-xs italic">Lỗi tải dữ liệu bảng lương: ${err.message}</td>
        </tr>
      `;
    }
  }

  initLayout();
}
