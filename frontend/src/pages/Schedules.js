// Schedules.js - Thời khóa biểu chi tiết theo tuần
import { API_BASE, showToast } from './_shared.js';

export async function renderSchedules(container) {
  container.innerHTML = `
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-apple-blue"></div>
    </div>
  `;

  try {
    const res = await fetch(`${API_BASE}/schedules`);
    const result = await res.json();
    const schedules = result.data || [];

    // State cho calendar tuần
    let currentStartDate = getMonday(new Date());

    function getMonday(d) {
      const date = new Date(d);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      date.setDate(diff);
      return date;
    }

    function getWeekDays(start) {
      const days = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        days.push(d);
      }
      return days;
    }

    // ========== RENDER WEEK VIEW (Lưới thời khóa biểu theo tuần) ==========
    function renderWeekView() {
      const days = getWeekDays(currentStartDate);
      const startStr = days[0].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      const endStr = days[6].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const dayNames = ['T2','T3','T4','T5','T6','T7','CN'];
      const hours = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00'];

      const dayHeadersHtml = days.map((d, index) => {
        const isToday = new Date().toDateString() === d.toDateString();
        return `
          <th class="px-2 py-3 text-center border border-apple-divider/40 min-w-[110px] ${isToday ? 'bg-blue-50/70 border-b-2 border-b-apple-blue' : ''}">
            <div class="text-[10px] uppercase font-bold ${isToday ? 'text-apple-blue' : 'text-slate-400'}">${dayNames[index]}</div>
            <div class="text-sm font-extrabold text-apple-ink mt-0.5">${d.getDate()}</div>
          </th>
        `;
      }).join('');

      let gridRowsHtml = '';
      hours.forEach(hour => {
        gridRowsHtml += `<tr class="border-b border-apple-divider/30">
          <td class="px-2 py-3 text-center font-bold text-slate-500 border border-apple-divider/30 bg-apple-parchment text-[10px] w-14">${hour}</td>`;
        days.forEach(day => {
          const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
          const hourNum = parseInt(hour.split(':')[0]);
          const matchedEvents = schedules.filter(item => {
            const itemDate = item.ngay_hoc ? item.ngay_hoc.substring(0, 10) : '';
            const startHour = parseInt(item.gio_bat_dau.split(':')[0]);
            return itemDate === dateStr && startHour === hourNum;
          });

          const eventsHtml = matchedEvents.map(event => {
            const isFinished = event.trang_thai === 'da_hoc';
            const isAbsent = event.trang_thai === 'vang';
            return `
              <div class="rounded-xl p-2 text-[10px] text-left border flex flex-col justify-between transition hover:shadow shadow-sm mb-1
                ${isFinished ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : isAbsent ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}">
                <div class="font-bold truncate">${event.ten_hoc_vien}</div>
                <div class="text-[9px] text-slate-400 mt-0.5">${event.gio_bat_dau.slice(0, 5)} - ${event.gio_ket_thuc.slice(0, 5)}</div>
                <div class="text-[9px] font-semibold mt-0.5 truncate">GV: ${event.ten_giao_vien.split(' ').slice(-1)[0]}</div>
              </div>
            `;
          }).join('');

          gridRowsHtml += `<td class="p-1.5 border border-apple-divider/30 bg-white align-top min-h-[70px]">${eventsHtml}</td>`;
        });
        gridRowsHtml += '</tr>';
      });

      const calEl = document.getElementById('calendar-view');
      if (!calEl) return;
      calEl.innerHTML = `
        <div class="flex justify-between items-center px-5 py-3 border-b border-apple-divider select-none flex-wrap gap-2">
          <button id="btn-prev-week" class="p-1.5 hover:bg-slate-100 border border-apple-divider/40 rounded-full transition active:scale-95">
            <span class="material-symbols-outlined text-[16px]">chevron_left</span>
          </button>
          <span id="title-week-zoom" class="text-xs font-bold text-apple-ink select-none">Tuần: ${startStr} — ${endStr}</span>
          <button id="btn-next-week" class="p-1.5 hover:bg-slate-100 border border-apple-divider/40 rounded-full transition active:scale-95">
            <span class="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>
        <div class="overflow-x-auto overflow-y-auto max-h-[520px]">
          <table class="w-full text-left border-collapse table-fixed">
            <thead class="sticky top-0 z-10">
              <tr class="bg-apple-pearl text-slate-500 text-[10px] font-semibold uppercase tracking-wider border-b border-apple-divider">
                <th class="px-2 py-3 text-center border border-apple-divider/40 w-14 bg-apple-parchment">Giờ</th>
                ${dayHeadersHtml}
              </tr>
            </thead>
            <tbody>${gridRowsHtml}</tbody>
          </table>
        </div>
      `;

      calEl.querySelector('#btn-prev-week')?.addEventListener('click', () => {
        currentStartDate.setDate(currentStartDate.getDate() - 7);
        renderWeekView();
      });
      calEl.querySelector('#btn-next-week')?.addEventListener('click', () => {
        currentStartDate.setDate(currentStartDate.getDate() + 7);
        renderWeekView();
      });
    }

    // Giao diện chính
    container.innerHTML = `
      <div class="space-y-4">
        <!-- Calendar container -->
        <div class="bg-white rounded-[18px] border border-apple-divider overflow-hidden" id="calendar-view">
          <!-- Rendered by JS -->
        </div>

        <!-- Bảng danh sách ca học chi tiết -->
        <div class="bg-white rounded-[18px] border border-apple-divider overflow-hidden">
          <div class="p-5 border-b border-apple-divider flex justify-between items-center flex-wrap gap-2">
            <div class="flex items-center gap-3">
              <h3 class="font-bold text-apple-ink text-sm">Danh sách ca học chi tiết</h3>
              <span class="text-[10px] text-slate-400">${schedules.length} bản ghi</span>
            </div>
            <button id="btn-refresh-schedules" class="flex items-center justify-center gap-1.5 px-4 py-2 border border-[#e2e2e4] hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-full transition-all active:scale-95 shadow-sm h-[32px]">
              <span class="material-symbols-outlined text-[16px]">refresh</span>Tải lại
            </button>
          </div>
          <div class="overflow-x-auto overflow-y-auto max-h-[320px]">
            <table class="w-full text-left border-collapse">
              <thead class="sticky top-0 z-10">
                <tr class="bg-apple-parchment text-slate-500 text-[10px] font-semibold uppercase tracking-wider border-b border-apple-divider">
                  <th class="px-5 py-3">Ngày học</th>
                  <th class="px-5 py-3">Giờ học</th>
                  <th class="px-5 py-3">Học viên</th>
                  <th class="px-5 py-3">Giáo viên</th>
                  <th class="px-5 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody id="schedules-table-body">
                ${schedules.length === 0
                  ? '<tr><td colspan="5" class="px-5 py-6 text-center text-slate-400 text-xs">Không có lịch học nào.</td></tr>'
                  : schedules.map(item => `
                    <tr class="hover:bg-apple-parchment border-b border-apple-divider/40 transition text-xs">
                      <td class="px-5 py-3 whitespace-nowrap text-slate-500">${new Date(item.ngay_hoc).toLocaleDateString('vi-VN')}</td>
                      <td class="px-5 py-3 whitespace-nowrap font-bold text-apple-ink">${item.gio_bat_dau.slice(0,5)} - ${item.gio_ket_thuc.slice(0,5)}</td>
                      <td class="px-5 py-3 whitespace-nowrap text-slate-600">${item.ten_hoc_vien}</td>
                      <td class="px-5 py-3 whitespace-nowrap text-slate-600">${item.ten_giao_vien}</td>
                      <td class="px-5 py-3 whitespace-nowrap">
                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${item.trang_thai === 'da_hoc' ? 'bg-emerald-100 text-emerald-800' : item.trang_thai === 'vang' ? 'bg-rose-100 text-rose-800' : 'bg-yellow-50 text-yellow-800 border border-yellow-200'}">
                          ${item.trang_thai === 'da_hoc' ? 'Đã học' : item.trang_thai === 'vang' ? 'Vắng' : 'Chờ học'}
                        </span>
                      </td>
                    </tr>
                  `).join('')
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-refresh-schedules')?.addEventListener('click', () => {
      renderSchedules(container);
    });

    // Khởi động render view tuần trực tiếp
    renderWeekView();

  } catch (err) {
    container.innerHTML = `
      <div class="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-xs">
        <strong>Lỗi tải dữ liệu:</strong> ${err.message}
      </div>
    `;
  }
}
