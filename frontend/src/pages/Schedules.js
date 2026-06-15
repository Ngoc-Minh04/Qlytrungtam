// Schedules.js - Thời khóa biểu với Calendar Zoom In/Out (Thập kỷ → Năm → Tháng → Tuần)
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

    // State cho calendar
    let viewMode = 'week'; // 'decade' | 'year' | 'month' | 'week'
    let selectedYear = new Date().getFullYear();
    let selectedMonth = new Date().getMonth(); // 0-indexed
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

    // ========== RENDER DECADE VIEW (Chọn năm) ==========
    function renderDecadeView() {
      const startYear = Math.floor(selectedYear / 10) * 10;
      const years = Array.from({ length: 12 }, (_, i) => startYear - 1 + i); // 2019 tới 2030
      const calEl = document.getElementById('calendar-view');
      if (!calEl) return;

      calEl.innerHTML = `
        <div class="flex justify-between items-center px-6 py-4 border-b border-apple-divider select-none">
          <button id="btn-prev-decade" class="p-1.5 hover:bg-slate-100 border border-apple-divider/40 rounded-full transition active:scale-95">
            <span class="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <span class="text-sm font-bold text-apple-ink">Năm ${startYear} - ${startYear + 9}</span>
          <button id="btn-next-decade" class="p-1.5 hover:bg-slate-100 border border-apple-divider/40 rounded-full transition active:scale-95">
            <span class="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
        <div class="grid grid-cols-4 gap-3 p-6">
          ${years.map(y => {
            const isCurrentYear = new Date().getFullYear() === y;
            const isOutOfDecade = y < startYear || y > startYear + 9;
            return `
              <button type="button" class="year-btn py-4 rounded-2xl text-xs font-bold transition active:scale-95 border-2
                ${isCurrentYear
                  ? 'bg-apple-blue border-apple-blue text-white shadow-lg shadow-apple-blue/20'
                  : isOutOfDecade
                    ? 'bg-slate-50 border-apple-divider/40 text-slate-300 hover:bg-slate-100'
                    : 'bg-white border-apple-divider text-slate-600 hover:border-apple-blue hover:bg-blue-50'
                }" data-year="${y}">
                ${y}
              </button>
            `;
          }).join('')}
        </div>
        <div class="px-6 pb-4 text-center">
          <p class="text-[10px] text-slate-400 font-medium">Chạm vào năm để xem các tháng</p>
        </div>
      `;

      calEl.querySelector('#btn-prev-decade')?.addEventListener('click', () => { selectedYear -= 10; renderDecadeView(); });
      calEl.querySelector('#btn-next-decade')?.addEventListener('click', () => { selectedYear += 10; renderDecadeView(); });
      calEl.querySelectorAll('.year-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          selectedYear = parseInt(btn.getAttribute('data-year'));
          viewMode = 'year';
          renderCalendar();
          updateViewBtns();
        });
      });
    }

    // ========== RENDER YEAR VIEW (Chọn tháng) ==========
    function renderYearView() {
      const monthNames = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
      const now = new Date();
      const calEl = document.getElementById('calendar-view');
      if (!calEl) return;
      calEl.innerHTML = `
        <div class="flex justify-between items-center px-6 py-4 border-b border-apple-divider select-none">
          <button id="btn-prev-year" class="p-1.5 hover:bg-slate-100 border border-apple-divider/40 rounded-full transition active:scale-95">
            <span class="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <span id="title-year-zoom" class="text-sm font-bold text-apple-ink cursor-pointer hover:underline">Năm ${selectedYear}</span>
          <button id="btn-next-year" class="p-1.5 hover:bg-slate-100 border border-apple-divider/40 rounded-full transition active:scale-95">
            <span class="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
        <div class="grid grid-cols-3 gap-3 p-6">
          ${monthNames.map((name, idx) => {
            const isCurrentMonth = now.getFullYear() === selectedYear && now.getMonth() === idx;
            return `
              <button type="button" class="month-btn py-4 rounded-2xl text-sm font-bold transition active:scale-95 border-2
                ${isCurrentMonth
                  ? 'bg-apple-blue border-apple-blue text-white shadow-lg shadow-apple-blue/20'
                  : 'bg-white border-apple-divider text-slate-600 hover:border-apple-blue hover:bg-blue-50'
                }" data-month="${idx}">
                ${name}
              </button>
            `;
          }).join('')}
        </div>
        <div class="px-6 pb-4 text-center">
          <p class="text-[10px] text-slate-400 font-medium">Chạm vào tháng để xem các ngày</p>
        </div>
      `;

      calEl.querySelector('#btn-prev-year')?.addEventListener('click', () => { selectedYear--; renderYearView(); });
      calEl.querySelector('#btn-next-year')?.addEventListener('click', () => { selectedYear++; renderYearView(); });
      calEl.querySelector('#title-year-zoom')?.addEventListener('click', () => { viewMode = 'decade'; renderCalendar(); updateViewBtns(); });
      calEl.querySelectorAll('.month-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          selectedMonth = parseInt(btn.getAttribute('data-month'));
          viewMode = 'month';
          renderCalendar();
          updateViewBtns();
        });
      });
    }

    // ========== RENDER MONTH VIEW (Chọn ngày) ==========
    function renderMonthView() {
      const monthNames = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
      const dayNames = ['T2','T3','T4','T5','T6','T7','CN'];
      const now = new Date();
      const calEl = document.getElementById('calendar-view');
      if (!calEl) return;

      // Tính ngày đầu tháng
      const firstDay = new Date(selectedYear, selectedMonth, 1);
      const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
      
      // Ngày đầu tuần của tuần đầu tháng (Thứ 2)
      let startDay = new Date(firstDay);
      const firstDayOfWeek = firstDay.getDay() === 0 ? 7 : firstDay.getDay();
      startDay.setDate(firstDay.getDate() - (firstDayOfWeek - 1));

      // Tạo grid 6 tuần × 7 ngày
      const cells = [];
      const cur = new Date(startDay);
      while (cells.length < 42) {
        cells.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
      }

      // Đếm số sự kiện mỗi ngày
      const eventCountByDate = {};
      schedules.forEach(s => {
        const d = new Date(s.ngay_hoc).toISOString().split('T')[0];
        eventCountByDate[d] = (eventCountByDate[d] || 0) + 1;
      });

      calEl.innerHTML = `
        <div class="flex justify-between items-center px-6 py-4 border-b border-apple-divider select-none">
          <button id="btn-prev-month" class="p-1.5 hover:bg-slate-100 border border-apple-divider/40 rounded-full transition active:scale-95">
            <span class="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <span id="title-month-zoom" class="text-sm font-bold text-apple-ink cursor-pointer hover:underline">Tháng ${selectedMonth + 1} năm ${selectedYear}</span>
          <button id="btn-next-month" class="p-1.5 hover:bg-slate-100 border border-apple-divider/40 rounded-full transition active:scale-95">
            <span class="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
        <div class="p-4">
          <div class="grid grid-cols-7 mb-2">
            ${dayNames.map(d => `<div class="text-center text-[10px] font-bold text-slate-400 uppercase py-1">${d}</div>`).join('')}
          </div>
          <div class="grid grid-cols-7 gap-1">
            ${cells.map(date => {
              const dateStr = date.toISOString().split('T')[0];
              const isToday = date.toDateString() === now.toDateString();
              const isCurrentMonth = date.getMonth() === selectedMonth;
              const eventCount = eventCountByDate[dateStr] || 0;
              const isPast = date < new Date(now.toISOString().split('T')[0]);
              return `
                <button type="button" class="day-cell-btn aspect-square rounded-xl flex flex-col items-center justify-center transition p-1
                  ${isToday ? 'bg-apple-blue text-white font-bold shadow-md shadow-apple-blue/20' :
                    !isCurrentMonth ? 'text-slate-300 hover:bg-slate-50' :
                    isPast ? 'text-slate-400 hover:bg-slate-50' :
                    'text-slate-700 hover:bg-blue-50 hover:border-apple-blue border border-transparent'
                  }" data-date="${dateStr}">
                  <span class="text-xs font-bold">${date.getDate()}</span>
                  ${eventCount > 0 ? `<span class="w-1.5 h-1.5 rounded-full mt-0.5 ${isToday ? 'bg-white' : 'bg-apple-blue'}"></span>` : ''}
                </button>
              `;
            }).join('')}
          </div>
        </div>
        <div class="px-6 pb-4 text-center">
          <p class="text-[10px] text-slate-400 font-medium">Chạm vào ngày để xem thời khóa biểu chi tiết</p>
        </div>
      `;

      calEl.querySelector('#btn-prev-month')?.addEventListener('click', () => {
        if (selectedMonth === 0) { selectedMonth = 11; selectedYear--; }
        else selectedMonth--;
        renderMonthView();
      });
      calEl.querySelector('#btn-next-month')?.addEventListener('click', () => {
        if (selectedMonth === 11) { selectedMonth = 0; selectedYear++; }
        else selectedMonth++;
        renderMonthView();
      });
      calEl.querySelector('#title-month-zoom')?.addEventListener('click', () => { viewMode = 'year'; renderCalendar(); updateViewBtns(); });
      calEl.querySelectorAll('.day-cell-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const date = new Date(btn.getAttribute('data-date'));
          currentStartDate = getMonday(date);
          viewMode = 'week';
          renderCalendar();
          updateViewBtns();
        });
      });
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
          const dateStr = day.toISOString().split('T')[0];
          const hourNum = parseInt(hour.split(':')[0]);
          const matchedEvents = schedules.filter(item => {
            const itemDate = new Date(item.ngay_hoc).toISOString().split('T')[0];
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
          <span id="title-week-zoom" class="text-xs font-bold text-apple-ink cursor-pointer hover:underline">Tuần: ${startStr} — ${endStr}</span>
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

      calEl.querySelector('#title-week-zoom')?.addEventListener('click', () => {
        selectedMonth = currentStartDate.getMonth();
        selectedYear = currentStartDate.getFullYear();
        viewMode = 'month';
        renderCalendar();
        updateViewBtns();
      });
      calEl.querySelector('#btn-prev-week')?.addEventListener('click', () => {
        currentStartDate.setDate(currentStartDate.getDate() - 7);
        renderWeekView();
      });
      calEl.querySelector('#btn-next-week')?.addEventListener('click', () => {
        currentStartDate.setDate(currentStartDate.getDate() + 7);
        renderWeekView();
      });
    }

    // Dispatcher
    function renderCalendar() {
      if (viewMode === 'decade') renderDecadeView();
      else if (viewMode === 'year') renderYearView();
      else if (viewMode === 'month') renderMonthView();
      else renderWeekView();
    }

    // Giao diện chính
    container.innerHTML = `
      <div class="space-y-4">
        <!-- Header chuyển view -->
        <div class="flex items-center gap-2">
          <div class="inline-flex bg-[#f3f3f5] p-1 rounded-xl border border-[#e2e2e4]">
            <button id="view-year-btn" class="px-4 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 text-slate-400 hover:text-apple-ink">Năm</button>
            <button id="view-month-btn" class="px-4 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 text-slate-400 hover:text-apple-ink">Tháng</button>
            <button id="view-week-btn" class="px-4 py-1.5 rounded-lg bg-white shadow-sm border border-apple-divider/20 text-xs font-semibold text-apple-ink transition active:scale-95">Tuần</button>
          </div>
          <span class="text-xs text-slate-400">• Nhấn vào tiêu đề lịch để zoom out, chạm vào ô để zoom in</span>
        </div>

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

    // View mode buttons
    document.getElementById('view-year-btn')?.addEventListener('click', () => {
      viewMode = 'decade';
      selectedYear = currentStartDate.getFullYear();
      renderCalendar();
      updateViewBtns();
    });
    document.getElementById('view-month-btn')?.addEventListener('click', () => {
      viewMode = 'year';
      selectedMonth = currentStartDate.getMonth();
      selectedYear = currentStartDate.getFullYear();
      renderCalendar();
      updateViewBtns();
    });
    document.getElementById('view-week-btn')?.addEventListener('click', () => {
      viewMode = 'week';
      renderCalendar();
      updateViewBtns();
    });

    document.getElementById('btn-refresh-schedules')?.addEventListener('click', () => {
      renderSchedules(container);
    });

    function updateViewBtns() {
      const btns = { decade: 'view-year-btn', year: 'view-month-btn', week: 'view-week-btn' };
      Object.entries(btns).forEach(([mode, id]) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        if (mode === viewMode || (mode === 'decade' && viewMode === 'decade') || (mode === 'year' && viewMode === 'year') || (mode === 'year' && viewMode === 'month')) {
          btn.classList.add('bg-white', 'shadow-sm', 'border', 'border-apple-divider/20', 'text-apple-ink');
          btn.classList.remove('text-slate-400');
        } else {
          btn.classList.remove('bg-white', 'shadow-sm', 'border', 'border-apple-divider/20', 'text-apple-ink');
          btn.classList.add('text-slate-400');
        }
      });
    }

    // Khởi động mặc định là view Tuần
    renderCalendar();
    updateViewBtns();

  } catch (err) {
    container.innerHTML = `
      <div class="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-xs">
        <strong>Lỗi tải dữ liệu:</strong> ${err.message}
      </div>
    `;
  }
}
