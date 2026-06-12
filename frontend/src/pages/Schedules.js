// Schedules.js - Thời khóa biểu / Lịch giảng dạy (Redesign: Lịch tuần 7 cột + Chuyển tuần + Phân trang swipe/drag)
import { API_BASE, showToast, setupSwipePagination } from './_shared.js';

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

    // Lịch tuần logic
    let currentStartDate = new Date();
    // Chuyển về thứ 2 của tuần hiện tại
    const day = currentStartDate.getDay();
    const diff = currentStartDate.getDate() - day + (day === 0 ? -6 : 1);
    currentStartDate.setDate(diff);

    function getWeekDays(start) {
      const days = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        days.push(d);
      }
      return days;
    }

    function renderWeeklyCalendar() {
      const days = getWeekDays(currentStartDate);
      const startStr = days[0].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const endStr = days[6].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

      // Định nghĩa các khung giờ hàng (Row Hours) từ 08:00 đến 20:00 (mỗi 2 tiếng)
      const hours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];

      // Vẽ header các cột ngày
      const dayHeadersHtml = days.map((d, index) => {
        const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
        const isToday = new Date().toDateString() === d.toDateString();
        return `
          <th class="px-3 py-4 text-center border border-apple-divider/40 min-w-[120px] ${isToday ? 'bg-blue-50/70 border-b-2 border-b-apple-blue' : ''}">
            <div class="text-[10px] uppercase font-bold ${isToday ? 'text-apple-blue' : 'text-slate-400'}">${dayNames[index]}</div>
            <div class="text-sm font-extrabold text-apple-ink mt-1">${d.getDate()}</div>
          </th>
        `;
      }).join('');

      // Vẽ lưới các ô sự kiện
      let gridRowsHtml = '';
      hours.forEach(hour => {
        gridRowsHtml += `<tr class="border-b border-apple-divider/30">
          <td class="px-3 py-4 text-center font-bold text-slate-500 border border-apple-divider/30 bg-apple-parchment text-[11px]">${hour}</td>`;

        days.forEach(day => {
          const dateStr = day.toISOString().split('T')[0];

          // Lọc các ca học khớp ngày và trong khung giờ này (hoặc lân cận)
          const matchedEvents = schedules.filter(item => {
            const itemDate = new Date(item.ngay_hoc).toISOString().split('T')[0];
            const startHour = item.gio_bat_dau.slice(0, 5);
            return itemDate === dateStr && startHour >= hour && startHour < (parseInt(hour.split(':')[0]) + 2 + ':00');
          });

          const eventsHtml = matchedEvents.map(event => {
            const isFinished = event.trang_thai === 'da_hoc';
            const isAbsent = event.trang_thai === 'vang';
            return `
              <div class="rounded-xl p-2 text-[10px] text-left border flex flex-col justify-between transition hover:shadow shadow-sm ${isFinished ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                isAbsent ? 'bg-rose-50 border-rose-200 text-rose-800' :
                  'bg-yellow-50 border-yellow-200 text-yellow-800'
              }">
                <div>
                  <div class="font-bold truncate">${event.ten_hoc_vien}</div>
                  <div class="text-[9px] text-slate-400 mt-0.5">${event.gio_bat_dau.slice(0, 5)} - ${event.gio_ket_thuc.slice(0, 5)}</div>
                </div>
                <div class="text-[9px] font-semibold mt-1 truncate">GV: ${event.ten_giao_vien.split(' ')[0]}</div>
              </div>
            `;
          }).join('');

          gridRowsHtml += `
            <td class="p-2 border border-apple-divider/30 bg-white relative align-top min-h-[90px] space-y-1.5">
              ${eventsHtml}
            </td>
          `;
        });
        gridRowsHtml += `</tr>`;
      });

      const calContainer = document.getElementById('weekly-calendar-grid');
      if (calContainer) {
        calContainer.innerHTML = `
          <div class="flex justify-between items-center bg-apple-parchment px-6 py-3 border-b border-apple-divider select-none">
            <span class="text-xs font-bold text-apple-ink">Thời gian: ${startStr} - ${endStr}</span>
            <div class="flex gap-2">
              <button id="btn-prev-week" class="p-1 text-apple-ink hover:bg-white border border-apple-divider/40 rounded-full transition active:scale-95 shadow-sm">
                <span class="material-symbols-outlined text-[16px] block">chevron_left</span>
              </button>
              <button id="btn-next-week" class="p-1 text-apple-ink hover:bg-white border border-apple-divider/40 rounded-full transition active:scale-95 shadow-sm">
                <span class="material-symbols-outlined text-[16px] block">chevron_right</span>
              </button>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse table-fixed">
              <thead>
                <tr class="bg-apple-pearl text-slate-500 text-[10px] font-semibold uppercase tracking-wider border-b border-apple-divider">
                  <th class="px-3 py-4 text-center border border-apple-divider/40 w-16 bg-apple-parchment">Giờ</th>
                  ${dayHeadersHtml}
                </tr>
              </thead>
              <tbody>
                ${gridRowsHtml}
              </tbody>
            </table>
          </div>
        `;

        // Đăng ký lại sự kiện chuyển tuần
        document.getElementById('btn-prev-week').addEventListener('click', () => {
          currentStartDate.setDate(currentStartDate.getDate() - 7);
          renderWeeklyCalendar();
        });
        document.getElementById('btn-next-week').addEventListener('click', () => {
          currentStartDate.setDate(currentStartDate.getDate() + 7);
          renderWeeklyCalendar();
        });
      }
    }

    // Giao diện chính của tab Schedules
    container.innerHTML = `
      <div class="space-y-6">
        <div class="bg-apple-white rounded-[18px] border border-apple-divider overflow-hidden flex flex-col" id="weekly-calendar-grid">
          <!-- Calendar grid sẽ render ở đây -->
        </div>

        <!-- Bảng danh sách phân trang (dành cho drag/swipe phụ họa bên dưới) -->
        <div class="bg-apple-white rounded-[18px] border border-apple-divider overflow-hidden">
          <div class="p-6 border-b border-apple-divider flex justify-between items-center">
            <h3 class="font-bold text-apple-ink text-sm uppercase tracking-wider">Danh sách ca học chi tiết</h3>
            <span class="text-[10px] text-slate-400">${schedules.length} bản ghi</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-apple-parchment text-slate-500 text-[10px] font-semibold uppercase tracking-wider border-b border-apple-divider">
                  <th class="px-6 py-3">Ngày học</th>
                  <th class="px-6 py-3">Giờ học</th>
                  <th class="px-6 py-3">Học viên</th>
                  <th class="px-6 py-3">Giáo viên</th>
                  <th class="px-6 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody id="schedules-table-body">
                <!-- Sẽ chèn bằng setupSwipePagination -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Khởi động lịch tuần
    renderWeeklyCalendar();

    // Khởi động bảng phân trang vuốt kéo
    const tableBody = document.getElementById('schedules-table-body');

    function renderTableRows(pageSchedules) {
      if (pageSchedules.length === 0) {
        return '<tr><td colspan="5" class="px-6 py-6 text-center text-slate-500 text-xs">Không có lịch học nào.</td></tr>';
      }
      return pageSchedules.map(item => `
        <tr class="hover:bg-apple-parchment border-b border-apple-divider/40 transition text-xs">
          <td class="px-6 py-4 whitespace-nowrap text-slate-500">${new Date(item.ngay_hoc).toLocaleDateString('vi-VN')}</td>
          <td class="px-6 py-4 whitespace-nowrap font-bold text-apple-ink">${item.gio_bat_dau.slice(0, 5)} - ${item.gio_ket_thuc.slice(0, 5)}</td>
          <td class="px-6 py-4 whitespace-nowrap text-slate-600">${item.ten_hoc_vien}</td>
          <td class="px-6 py-4 whitespace-nowrap text-slate-600">${item.ten_giao_vien}</td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${item.trang_thai === 'da_hoc' ? 'bg-emerald-100 text-emerald-800' :
          item.trang_thai === 'vang' ? 'bg-rose-100 text-rose-800' : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
        }">${item.trang_thai === 'da_hoc' ? 'Đã học' : item.trang_thai === 'vang' ? 'Vắng' : 'Chờ học'}</span>
          </td>
        </tr>
      `).join('');
    }

    setupSwipePagination(schedules, tableBody, (pageSchedules) => {
      tableBody.innerHTML = renderTableRows(pageSchedules);
    }, 10);

  } catch (err) {
    container.innerHTML = `
      <div class="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-xs">
        <strong>Lỗi tải dữ liệu:</strong> ${err.message}
      </div>
    `;
  }
}
