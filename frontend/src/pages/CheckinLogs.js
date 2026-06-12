// CheckinLogs.js - Lượt Vào - Ra (QR Check-in)
import { API_BASE, showToast, setupSwipePagination } from './_shared.js';

export async function renderCheckinLogs(container) {
  container.innerHTML = `
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-apple-blue"></div>
    </div>
  `;

  try {
    const res = await fetch(`${API_BASE}/checkin-logs`);
    const result = await res.json();
    const logs = result.data || [];

    function renderLogCards(pageLogs) {
      if (pageLogs.length === 0) {
        return '<p class="col-span-2 text-slate-500 text-xs text-center py-12">Chưa có lượt quét nào.</p>';
      }
      return pageLogs.map(log => {
        const isValid = log.loai === 'vao';
        return `
          <div class="bg-white rounded-2xl p-4 flex items-center border border-apple-divider/40 shadow-sm relative overflow-hidden transition hover:bg-apple-parchment">
            ${!isValid ? '<div class="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>' : '<div class="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>'}
            <div class="w-10 h-10 rounded-full bg-apple-parchment flex items-center justify-center font-bold text-apple-blue mr-4 select-none">
              ${log.ho_ten.charAt(0)}
            </div>
            <div class="flex-1 text-xs">
              <h4 class="font-bold text-apple-ink text-sm">${log.ho_ten}</h4>
              <p class="text-slate-400 mt-0.5">Mã: ${log.ma_ho_so} • ${log.chi_nhanh_thuc_hien || 'Trung tâm'}</p>
            </div>
            <div class="text-right text-[10px]">
              <p class="text-slate-400 mb-1">${new Date(log.thoi_diem).toLocaleTimeString()}</p>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full font-bold tracking-wider ${isValid ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }">
                ${isValid ? 'CHECK-IN HỢP LỆ' : 'CHECK-OUT'}
              </span>
            </div>
          </div>
        `;
      }).join('');
    }

    container.innerHTML = `
      <div class="space-y-4">
        <div class="bg-apple-parchment rounded-2xl p-6 border border-apple-divider shadow-sm space-y-4 min-h-[400px]">
          <div class="flex justify-between items-center pb-2 border-b border-apple-divider/40">
            <h3 class="font-bold text-apple-ink text-sm">Nhật ký check-in gần đây</h3>
            <span class="text-[10px] text-slate-400 bg-white px-3 py-1 rounded-full font-bold">Hôm nay</span>
          </div>
          <div id="checkin-log-list" class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <!-- Sẽ chèn bằng setupSwipePagination -->
          </div>
        </div>
      </div>
    `;

    const logListContainer = document.getElementById('checkin-log-list');
    setupSwipePagination(logs, logListContainer, (pageLogs) => {
      logListContainer.innerHTML = renderLogCards(pageLogs);
    }, 10);

  } catch (err) {
    container.innerHTML = `
      <div class="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4 text-xs">
        <strong>Lỗi tải dữ liệu:</strong> ${err.message}
      </div>
    `;
  }
}
