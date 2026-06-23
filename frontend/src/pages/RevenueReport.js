// RevenueReport.js - Báo cáo Doanh thu (Admin)
import { API_BASE, showToast } from './_shared.js';

let revenueChart = null; // Biến giữ instance của Chart.js để tránh ghi đè

export async function renderRevenueReport(container) {
  // Tạo danh sách option từ tháng 1 -> 12 của năm hiện tại
  const currentYear = new Date().getFullYear();
  let monthOptions = '';
  for (let m = 1; m <= 12; m++) {
    monthOptions += `<option value="${currentYear}-${String(m).padStart(2, '0')}">Tháng ${m}/${currentYear}</option>`;
  }

  // Render layout tĩnh
  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex flex-col lg:flex-row justify-between lg:items-center gap-4 bg-white p-4 rounded-3xl border border-apple-divider shadow-sm">
        <!-- Bộ lọc thời gian nhanh -->
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center bg-[#f3f3f5] p-1 rounded-xl border border-[#e2e2e4] select-none text-xs w-fit">
            <button id="filter-btn-today" class="filter-btn px-4 py-1.5 rounded-lg transition font-bold text-apple-ink bg-white shadow-sm border border-apple-divider/20" data-filter="today">Hôm nay</button>
            <button id="filter-btn-yesterday" class="filter-btn px-4 py-1.5 rounded-lg transition font-medium text-slate-500 hover:text-apple-ink" data-filter="yesterday">Hôm qua</button>
            <button id="filter-btn-week" class="filter-btn px-4 py-1.5 rounded-lg transition font-medium text-slate-500 hover:text-apple-ink" data-filter="week">Tuần này</button>
            
            <!-- Dropdown chọn tháng -->
            <div class="relative flex items-center">
              <select id="filter-select-month" class="filter-btn px-4 py-1.5 rounded-lg transition font-medium text-slate-500 hover:text-apple-ink bg-transparent border-none outline-none cursor-pointer appearance-none pr-7">
                <option value="month" selected>Tháng này</option>
                ${monthOptions}
              </select>
              <span class="material-symbols-outlined text-[14px] absolute right-2 pointer-events-none text-slate-400">keyboard_arrow_down</span>
            </div>
          </div>
        </div>

        <!-- Nút Refresh đồng bộ kích thước -->
        <button id="btn-refresh-revenue" class="flex items-center justify-center gap-1.5 px-4 py-2 border border-[#e2e2e4] hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-full transition-all active:scale-95 shadow-sm h-[32px] w-fit" type="button">
          <span class="material-symbols-outlined text-[16px]">refresh</span>Tải lại
        </button>
      </div>

      <!-- Bento Grid: Metric Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6" id="revenue-metrics-container">
        <!-- Sẽ render động -->
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="bg-white rounded-3xl p-6 border border-apple-divider flex flex-col shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
          <h3 class="font-bold text-apple-ink text-xs mb-4 uppercase tracking-wider">Tỷ lệ hình thức thanh toán</h3>
          <div class="flex-1 flex flex-col items-center justify-center py-6">
            <div class="w-36 h-36 relative flex items-center justify-center">
              <canvas id="paymentPieChart"></canvas>
            </div>
          </div>
          <div class="mt-4 space-y-2 text-xs">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2"><div class="w-2.5 h-2.5 rounded-full bg-[#0066cc]"></div><span class="text-slate-600">Chuyển khoản</span></div>
              <span class="font-bold">80%</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2"><div class="w-2.5 h-2.5 rounded-full bg-zinc-200"></div><span class="text-slate-600">Tiền mặt</span></div>
              <span class="font-bold">20%</span>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-3xl p-6 border border-apple-divider lg:col-span-2 flex flex-col justify-between shadow-sm min-h-[300px] transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
          <h3 class="font-bold text-apple-ink text-xs mb-4 uppercase tracking-wider">Biểu đồ xu hướng doanh thu</h3>
          <div class="flex-grow w-full relative">
            <canvas id="revenueTrendChart" style="max-height: 220px;"></canvas>
          </div>
        </div>
      </div>

      <!-- Popular Packages -->
      <div class="bg-white rounded-3xl p-6 border border-[#e2e2e4] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
        <h3 class="font-bold text-apple-ink text-xs mb-4 uppercase tracking-wider">Gói học phổ biến nhất</h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4" id="popular-pkgs-container">
          <!-- Sẽ render động -->
        </div>
      </div>

      <!-- Transaction Table -->
      <div class="bg-white rounded-3xl p-6 border border-apple-divider shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
        <h3 class="font-bold text-apple-ink text-xs mb-4 uppercase tracking-wider">Chi tiết lịch sử thanh toán</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-apple-parchment border-b border-apple-divider text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th class="py-3 px-4">Khách hàng</th>
                <th class="py-3 px-4">Nội dung</th>
                <th class="py-3 px-4">Phân loại</th>
                <th class="py-3 px-4">Phương thức</th>
                <th class="py-3 px-4">Ngày giao dịch</th>
                <th class="py-3 px-4 text-right">Thực thu</th>
              </tr>
            </thead>
            <tbody id="transaction-table-body">
              <!-- Sẽ render động -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Thiết lập biến filter mặc định là today
  let currentFilter = 'today';

  async function loadRevenueData(filterOrQuery) {
    try {
      const metricsContainer = document.getElementById('revenue-metrics-container');
      const popularContainer = document.getElementById('popular-pkgs-container');
      const tableBody = document.getElementById('transaction-table-body');

      if (metricsContainer) metricsContainer.innerHTML = '<div class="col-span-3 text-center text-xs py-8 text-slate-400">Đang tải báo cáo...</div>';

      let url = `${API_BASE}/reports/revenue`;
      if (typeof filterOrQuery === 'string') {
        url += `?filter=${filterOrQuery}`;
      } else if (filterOrQuery && filterOrQuery.start_date && filterOrQuery.end_date) {
        url += `?start_date=${filterOrQuery.start_date}&end_date=${filterOrQuery.end_date}`;
      } else {
        url += `?filter=month`;
      }

      const res = await fetch(url, {
        headers: { 'X-User-Role': 'admin' }
      });
      const result = await res.json();

      if (!result.success) {
        showToast(result.error, 'error');
        return;
      }

      const { khoa_hoc, hoc_kem, lich_su_doanh_thu, goi_pho_bien, giao_dich } = result.data;
      const tongThu = parseFloat(khoa_hoc?.total || 0) + parseFloat(hoc_kem?.total || 0);

      // 1. Render Metrics Card (Đảo vị trí Tổng cộng lên đầu góc trái)
      metricsContainer.innerHTML = `
        <div class="bg-white rounded-2xl p-5 border-l-4 border-apple-blue flex flex-col justify-between min-h-[120px] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:bg-apple-parchment">
          <div class="flex justify-between items-start mb-2">
            <div class="w-8 h-8 rounded-full bg-apple-pearl flex items-center justify-center text-apple-blue font-bold text-xs">∑</div>
            <span class="text-[9px] text-apple-blue font-bold bg-blue-50 px-2 py-0.5 rounded-full">Tổng cộng</span>
          </div>
          <div>
            <p class="text-slate-400 text-[9px] uppercase font-bold tracking-wider mb-0.5">Doanh thu</p>
            <h3 class="text-xl font-extrabold text-apple-ink">${tongThu.toLocaleString('vi-VN')} VNĐ</h3>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-5 border border-apple-divider flex flex-col justify-between min-h-[120px] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:bg-apple-parchment">
          <div class="flex justify-between items-start mb-2">
            <div class="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-apple-blue font-bold text-xs">KH</div>
            <span class="text-[9px] text-apple-blue font-bold bg-blue-50 px-2 py-0.5 rounded-full">Đại trà</span>
          </div>
          <div>
            <p class="text-slate-400 text-[9px] uppercase font-bold tracking-wider mb-0.5">Khóa học đại trà</p>
            <h3 class="text-lg font-bold text-apple-ink">${parseFloat(khoa_hoc?.total || 0).toLocaleString('vi-VN')} VNĐ</h3>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-5 border border-apple-divider flex flex-col justify-between min-h-[120px] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:bg-apple-parchment">
          <div class="flex justify-between items-start mb-2">
            <div class="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs">1-1</div>
            <span class="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">Học kèm</span>
          </div>
          <div>
            <p class="text-slate-400 text-[9px] uppercase font-bold tracking-wider mb-0.5">Dạy kèm 1-1</p>
            <h3 class="text-lg font-bold text-apple-ink">${parseFloat(hoc_kem?.total || 0).toLocaleString('vi-VN')} VNĐ</h3>
          </div>
        </div>
      `;

      // 2. Render Popular Packages
      popularContainer.innerHTML = goi_pho_bien.map(pkg => `
        <div class="bg-apple-parchment rounded-2xl p-4 border border-apple-divider/40 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:bg-white">
          <h4 class="font-bold text-apple-ink text-xs mb-2">${pkg.ten_goi}</h4>
          <div class="flex justify-between items-center text-[10px]">
            <span class="text-slate-400">${pkg.so_luong} lượt đăng ký</span>
            <span class="text-apple-blue font-bold">${parseFloat(pkg.tong_doanh_thu || 0).toLocaleString('vi-VN')} đ</span>
          </div>
        </div>
      `).join('') + (goi_pho_bien.length === 0 ? '<p class="col-span-3 text-slate-400 italic py-2 text-center text-xs">Chưa có thống kê gói học.</p>' : '');

      // Helper format phương thức thanh toán sang tiếng Việt chuẩn
      const formatMethod = (method) => {
        if (!method) return 'Chuyển khoản';
        const m = method.toLowerCase().trim();
        if (m.includes('tien_mat') || m.includes('cash') || m.includes('tiền mặt')) {
          return 'Tiền mặt';
        }
        return 'Chuyển khoản';
      };

      // Helper format ngày giờ chi tiết
      const formatDateTime = (dateStr) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return `${time} ${date}`;
      };

      // 3. Render Lịch sử thanh toán
      tableBody.innerHTML = giao_dich.map(g => {
        const isKem = g.loai_goi === 'hoc_kem';
        const typeBadge = isKem
          ? `<span class="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">Kèm 1-1</span>`
          : `<span class="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-apple-blue border border-blue-200">Đại trà</span>`;

        const isCancelled = g.trang_thai === 'huy';
        const netAmt = parseFloat(g.so_tien_da_thu || 0) - parseFloat(g.so_tien_hoan || 0);
        
        const nameDisplay = isCancelled
          ? `<span class="font-bold text-slate-500">${g.ho_ten}</span> <span class="ml-1.5 px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-red-50 text-red-500 border border-red-200 inline-block align-middle">Đã hủy (Hoàn: ${parseFloat(g.so_tien_hoan || 0).toLocaleString('vi-VN')}đ)</span>`
          : `<span class="font-bold text-apple-ink">${g.ho_ten}</span>`;

        const amountDisplay = isCancelled
          ? `<span class="font-bold text-red-500">${netAmt > 0 ? '+' : ''}${netAmt.toLocaleString('vi-VN')} đ</span>`
          : `<span class="font-bold text-emerald-600">+${parseFloat(g.so_tien_da_thu).toLocaleString('vi-VN')} đ</span>`;

        const rowClass = isCancelled 
          ? 'bg-slate-50/75 opacity-65 hover:opacity-100 hover:bg-slate-100/90 border-b border-apple-divider/40 transition-all text-xs duration-200' 
          : 'hover:bg-apple-parchment border-b border-apple-divider/40 transition text-xs';

        return `
          <tr class="${rowClass}">
            <td class="py-3 px-4">${nameDisplay}</td>
            <td class="py-3 px-4 text-slate-600">${g.ten_khoa_hoc}</td>
            <td class="py-3 px-4">${typeBadge}</td>
            <td class="py-3 px-4 font-medium text-slate-600">${formatMethod(g.phuong_thuc_tt)}</td>
            <td class="py-3 px-4 text-slate-400">${formatDateTime(g.ngay_tao)}</td>
            <td class="py-3 px-4 text-right">${amountDisplay}</td>
          </tr>
        `;
      }).join('') + (giao_dich.length === 0 ? '<tr><td colspan="6" class="py-6 text-center text-slate-400 text-xs">Không có dữ liệu giao dịch.</td></tr>' : '');

      // 4. Vẽ biểu đồ xu hướng Chart.js
      const chartLabels = lich_su_doanh_thu.map(d => new Date(d.ngay).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })).reverse();
      const chartData = lich_su_doanh_thu.map(d => d.tong_tien).reverse();

      if (revenueChart) revenueChart.destroy();
      const ctx = document.getElementById('revenueTrendChart').getContext('2d');

      // Tối ưu hóa: Nếu là bộ lọc hôm nay, hôm qua hoặc tuần này thì bắt buộc dùng biểu đồ cột 'bar' để hiển thị trực quan
      const useBarChart = (currentFilter === 'today' || currentFilter === 'yesterday' || currentFilter === 'week' || chartData.length <= 1);
      
      let chartBgColor = 'rgba(0, 102, 204, 0.05)';
      if (useBarChart) {
        chartBgColor = 'rgba(0, 102, 204, 0.85)';
      } else {
        // Tạo gradient mờ dần tuyệt đẹp kiểu Apple Health-style cho line chart
        const gradient = ctx.createLinearGradient(0, 0, 0, 220);
        gradient.addColorStop(0, 'rgba(0, 102, 204, 0.25)');
        gradient.addColorStop(1, 'rgba(0, 102, 204, 0.00)');
        chartBgColor = gradient;
      }

      revenueChart = new Chart(ctx, {
        type: useBarChart ? 'bar' : 'line',
        data: {
          labels: chartLabels.length > 0 ? chartLabels : ['Không có giao dịch'],
          datasets: [{
            label: 'Doanh thu (VNĐ)',
            data: chartData.length > 0 ? chartData : [0],
            borderColor: '#0066cc',
            backgroundColor: chartBgColor,
            borderWidth: useBarChart ? 0 : 2.5,
            tension: 0.38,
            fill: true,
            pointBackgroundColor: '#0066cc',
            pointHoverBackgroundColor: '#ffffff',
            pointHoverBorderColor: '#0066cc',
            pointHoverBorderWidth: 3,
            pointRadius: useBarChart ? 0 : 3.5,
            pointHoverRadius: useBarChart ? 0 : 6,
            barThickness: useBarChart ? 50 : undefined,
            borderRadius: useBarChart ? 8 : 0 // Bo tròn góc cột đứng Apple-style
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1c1c1e',
              titleFont: { size: 10, weight: 'bold' },
              bodyFont: { size: 11 },
              padding: 10,
              cornerRadius: 12,
              displayColors: false,
              callbacks: {
                label: function(context) {
                  return ' ' + context.parsed.y.toLocaleString('vi-VN') + ' VNĐ';
                }
              }
            }
          },
          scales: {
            x: { 
              grid: { display: false }, 
              ticks: { font: { size: 9, family: '-apple-system, BlinkMacSystemFont, "Segoe UI"' }, color: '#8e8e93' } 
            },
            y: { 
              grid: { color: 'rgba(0, 0, 0, 0.04)' },
              ticks: { 
                font: { size: 9, family: '-apple-system, BlinkMacSystemFont, "Segoe UI"' }, 
                color: '#8e8e93',
                callback: function(value) {
                  if (value >= 1000000) return (value / 1000000) + 'M';
                  if (value >= 1000) return (value / 1000) + 'K';
                  return value;
                }
              } 
            }
          }
        }
      });

    } catch (err) {
      console.error('Lỗi khi load doanh thu:', err);
    }
  }

  // Khởi chạy dữ liệu mặc định
  setTimeout(() => {
    loadRevenueData('today');

    // Biểu đồ tròn hình thức thanh toán cố định 80% CK / 20% tiền mặt
    const pieCtx = document.getElementById('paymentPieChart').getContext('2d');
    new Chart(pieCtx, {
      type: 'doughnut',
      data: {
        labels: ['Chuyển khoản', 'Tiền mặt'],
        datasets: [{
          data: [80, 20],
          backgroundColor: ['#0066cc', '#e2e2e4'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        cutout: '75%'
      }
    });

    // Bắt sự kiện click bộ lọc nhanh
    document.querySelectorAll('.filter-btn, [data-filter]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filter = btn.getAttribute('data-filter');
        if (!filter || filter === 'custom') return;

        currentFilter = filter; // Đồng bộ bộ lọc đang chọn

        // Reset các bộ lọc khác
        const monthSelect = document.getElementById('filter-select-month');
        if (monthSelect) monthSelect.value = 'month';

        // Active state style toggle
        document.querySelectorAll('.filter-btn, [data-filter]').forEach(b => {
          b.classList.remove('bg-white', 'shadow-sm', 'border', 'border-apple-divider/20', 'font-bold', 'text-apple-ink');
          b.classList.add('text-slate-500');
        });
        btn.classList.add('bg-white', 'shadow-sm', 'border', 'border-apple-divider/20', 'font-bold', 'text-apple-ink');
        btn.classList.remove('text-slate-500');

        loadRevenueData(filter);
      });
    });

    // Bắt sự kiện đổi tháng trong Dropdown chọn tháng
    document.getElementById('filter-select-month')?.addEventListener('change', (e) => {
      const val = e.target.value;
      currentFilter = val; // Đồng bộ bộ lọc đang chọn

      // Tắt active các nút bộ lọc khác
      document.querySelectorAll('.filter-btn, [data-filter]').forEach(b => {
        b.classList.remove('bg-white', 'shadow-sm', 'border', 'border-apple-divider/20', 'font-bold', 'text-apple-ink');
        b.classList.add('text-slate-500');
      });

      // Highlight select box month
      const selectElement = e.target;
      selectElement.classList.add('bg-white', 'shadow-sm', 'border', 'border-apple-divider/20', 'font-bold', 'text-apple-ink');
      selectElement.classList.remove('text-slate-500');

      if (val === 'month') {
        loadRevenueData('month');
      } else {
        // Trích xuất tháng và năm từ chuỗi: YYYY-MM
        const [year, month] = val.split('-');
        // Tính ngày bắt đầu và ngày kết thúc của tháng đã chọn
        const start_date = `${year}-${month}-01`;
        const lastDay = new Date(year, parseInt(month), 0).getDate();
        const end_date = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
        
        loadRevenueData({ start_date, end_date });
      }
    });

    document.getElementById('btn-refresh-revenue')?.addEventListener('click', () => {
      renderRevenueReport(container);
    });
  }, 100);
}



