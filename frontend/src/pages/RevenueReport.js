// RevenueReport.js - Báo cáo Doanh thu (Admin)
import { API_BASE, showToast } from './_shared.js';

let revenueChart = null; // Biến giữ instance của Chart.js để tránh ghi đè

export async function renderRevenueReport(container) {
  // Render layout tĩnh
  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <!-- Bộ lọc thời gian -->
        <div class="flex bg-[#f3f3f5] p-1 rounded-xl border border-[#e2e2e4] select-none text-xs w-fit">
          <button id="filter-btn-today" class="filter-btn px-4 py-1.5 rounded-lg transition font-medium text-slate-500 hover:text-apple-ink" data-filter="today">Hôm nay</button>
          <button id="filter-btn-yesterday" class="filter-btn px-4 py-1.5 rounded-lg transition font-medium text-slate-500 hover:text-apple-ink" data-filter="yesterday">Hôm qua</button>
          <button id="filter-btn-month" class="filter-btn px-4 py-1.5 rounded-lg bg-white shadow-sm border border-apple-divider/20 font-bold text-apple-ink" data-filter="month">Tháng này</button>
        </div>
      </div>

      <!-- Bento Grid: Metric Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6" id="revenue-metrics-container">
        <!-- Sẽ render động -->
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="bg-white rounded-3xl p-6 border border-apple-divider flex flex-col shadow-sm">
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

        <div class="bg-white rounded-3xl p-6 border border-apple-divider lg:col-span-2 flex flex-col justify-between shadow-sm min-h-[300px]">
          <h3 class="font-bold text-apple-ink text-xs mb-4 uppercase tracking-wider">Biểu đồ xu hướng doanh thu</h3>
          <div class="flex-grow w-full relative">
            <canvas id="revenueTrendChart" style="max-height: 220px;"></canvas>
          </div>
        </div>
      </div>

      <!-- Popular Packages -->
      <div class="bg-white rounded-3xl p-6 border border-[#e2e2e4] shadow-sm">
        <h3 class="font-bold text-apple-ink text-xs mb-4 uppercase tracking-wider">Gói học phổ biến nhất</h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4" id="popular-pkgs-container">
          <!-- Sẽ render động -->
        </div>
      </div>

      <!-- Transaction Table -->
      <div class="bg-white rounded-3xl p-6 border border-apple-divider shadow-sm">
        <h3 class="font-bold text-apple-ink text-xs mb-4 uppercase tracking-wider">Chi tiết lịch sử thanh toán</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-apple-parchment border-b border-apple-divider text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th class="py-3 px-4">Khách hàng</th>
                <th class="py-3 px-4">Nội dung</th>
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

  // Thiết lập biến filter mặc định là month
  let currentFilter = 'month';

  async function loadRevenueData(filter) {
    try {
      const metricsContainer = document.getElementById('revenue-metrics-container');
      const popularContainer = document.getElementById('popular-pkgs-container');
      const tableBody = document.getElementById('transaction-table-body');

      if (metricsContainer) metricsContainer.innerHTML = '<div class="col-span-3 text-center text-xs py-8 text-slate-400">Đang tải báo cáo...</div>';

      const res = await fetch(`${API_BASE}/reports/revenue?filter=${filter}`, {
        headers: { 'X-User-Role': 'admin' }
      });
      const result = await res.json();

      if (!result.success) {
        showToast(result.error, 'error');
        return;
      }

      const { khoa_hoc, hoc_kem, lich_su_doanh_thu, goi_pho_bien, giao_dich } = result.data;
      const tongThu = (khoa_hoc?.thuc_thu || 0) + (hoc_kem?.thuc_thu || 0);

      // 1. Render Metrics Card
      metricsContainer.innerHTML = `
        <div class="bg-white rounded-2xl p-5 border border-apple-divider flex flex-col justify-between min-h-[120px] shadow-sm transition hover:bg-apple-parchment">
          <div class="flex justify-between items-start mb-2">
            <div class="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-apple-blue font-bold text-xs">KH</div>
            <span class="text-[9px] text-apple-blue font-bold bg-blue-50 px-2 py-0.5 rounded-full">Đại trà</span>
          </div>
          <div>
            <p class="text-slate-400 text-[9px] uppercase font-bold tracking-wider mb-0.5">Khóa học đại trà</p>
            <h3 class="text-lg font-bold text-apple-ink">${parseFloat(khoa_hoc?.thuc_thu || 0).toLocaleString('vi-VN')} VNĐ</h3>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-5 border border-apple-divider flex flex-col justify-between min-h-[120px] shadow-sm transition hover:bg-apple-parchment">
          <div class="flex justify-between items-start mb-2">
            <div class="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs">1-1</div>
            <span class="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">Học kèm</span>
          </div>
          <div>
            <p class="text-slate-400 text-[9px] uppercase font-bold tracking-wider mb-0.5">Dạy kèm 1-1 / Nhóm nhỏ</p>
            <h3 class="text-lg font-bold text-apple-ink">${parseFloat(hoc_kem?.thuc_thu || 0).toLocaleString('vi-VN')} VNĐ</h3>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-5 border-l-4 border-apple-blue flex flex-col justify-between min-h-[120px] shadow-sm transition hover:bg-apple-parchment">
          <div class="flex justify-between items-start mb-2">
            <div class="w-8 h-8 rounded-full bg-apple-pearl flex items-center justify-center text-apple-blue font-bold text-xs">∑</div>
            <span class="text-[9px] text-apple-blue font-bold bg-blue-50 px-2 py-0.5 rounded-full">Tổng cộng</span>
          </div>
          <div>
            <p class="text-slate-400 text-[9px] uppercase font-bold tracking-wider mb-0.5">Thực thu thực tế</p>
            <h3 class="text-xl font-extrabold text-apple-ink">${tongThu.toLocaleString('vi-VN')} VNĐ</h3>
          </div>
        </div>
      `;

      // 2. Render Popular Packages
      popularContainer.innerHTML = goi_pho_bien.map(pkg => `
        <div class="bg-apple-parchment rounded-2xl p-4 border border-apple-divider/40 flex flex-col justify-between">
          <h4 class="font-bold text-apple-ink text-xs mb-2">${pkg.ten_goi}</h4>
          <div class="flex justify-between items-center text-[10px]">
            <span class="text-slate-400">${pkg.so_luong} lượt đăng ký</span>
            <span class="text-apple-blue font-bold">${parseFloat(pkg.tong_doanh_thu || 0).toLocaleString('vi-VN')} đ</span>
          </div>
        </div>
      `).join('') + (goi_pho_bien.length === 0 ? '<p class="col-span-3 text-slate-400 italic py-2 text-center text-xs">Chưa có thống kê gói học.</p>' : '');

      // 3. Render Lịch sử thanh toán
      tableBody.innerHTML = giao_dich.map(g => `
        <tr class="hover:bg-apple-parchment border-b border-apple-divider/40 transition text-xs">
          <td class="py-3 px-4 font-bold text-apple-ink">${g.ho_ten}</td>
          <td class="py-3 px-4 text-slate-600">${g.ten_khoa_hoc}</td>
          <td class="py-3 px-4 capitalize text-slate-500">${g.phuong_thuc_tt || 'Chuyển khoản'}</td>
          <td class="py-3 px-4 text-slate-400">${new Date(g.ngay_tao).toLocaleDateString('vi-VN')}</td>
          <td class="py-3 px-4 text-right font-bold text-emerald-600">+${parseFloat(g.so_tien_da_thu).toLocaleString('vi-VN')} đ</td>
        </tr>
      `).join('') + (giao_dich.length === 0 ? '<tr><td colspan="5" class="py-6 text-center text-slate-400 text-xs">Không có dữ liệu giao dịch.</td></tr>' : '');

      // 4. Vẽ biểu đồ xu hướng Chart.js
      const chartLabels = lich_su_doanh_thu.map(d => new Date(d.ngay).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })).reverse();
      const chartData = lich_su_doanh_thu.map(d => d.tong_tien).reverse();

      if (revenueChart) revenueChart.destroy();
      const ctx = document.getElementById('revenueTrendChart').getContext('2d');
      revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: chartLabels.length > 0 ? chartLabels : ['N/A'],
          datasets: [{
            label: 'Doanh thu (VNĐ)',
            data: chartData.length > 0 ? chartData : [0],
            borderColor: '#0066cc',
            backgroundColor: 'rgba(0, 102, 204, 0.05)',
            borderWidth: 2,
            tension: 0.35,
            fill: true,
            pointBackgroundColor: '#0066cc',
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 9 } } },
            y: { ticks: { font: { size: 9 } } }
          }
        }
      });

    } catch (err) {
      console.error('Lỗi khi load doanh thu:', err);
    }
  }

  // Khởi chạy dữ liệu mặc định
  setTimeout(() => {
    loadRevenueData('month');

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

    // Bắt sự kiện click bộ lọc
    document.querySelectorAll('.filter-btn, [data-filter]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filter = btn.getAttribute('data-filter');
        if (!filter) return;

        // Active state style toggle
        document.querySelectorAll('.filter-btn, [data-filter]').forEach(b => {
          b.className = 'filter-btn px-4 py-1.5 rounded-lg transition font-medium text-slate-500 hover:text-apple-ink';
        });
        btn.className = 'filter-btn px-4 py-1.5 rounded-lg bg-white shadow-sm border border-apple-divider/20 font-bold text-apple-ink';

        loadRevenueData(filter);
      });
    });
  }, 100);
}
