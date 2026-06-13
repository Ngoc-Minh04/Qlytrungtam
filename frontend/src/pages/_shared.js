// _shared.js - Tiện ích dùng chung cho tất cả các page
export const API_BASE = 'http://localhost:3006/api';

export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container') || document.body;
  const toast = document.createElement('div');
  toast.className = `toast${type === 'error' ? ' error' : ' success'}`;
  toast.textContent = message;
  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Định dạng tiền tệ tự động thêm dấu chấm phân cách hàng nghìn (ví dụ: 1.500.000)
export function formatCurrencyInput(value) {
  // Lấy ra các chữ số
  const cleanValue = value.replace(/\D/g, '');
  if (!cleanValue) return '';
  return new Intl.NumberFormat('vi-VN').format(parseInt(cleanValue));
}

// Phục hồi giá trị số nguyên từ chuỗi đã format dạng tiền tệ
export function parseCurrencyInput(value) {
  return parseFloat(value.replace(/\./g, '')) || 0;
}

// Widget Lịch Custom 3 Cấp (Năm -> Tháng -> Ngày) Premium Apple UI
// pickerInput: Element input nhận value (YYYY-MM-DD)
// containerEl: Element container chứa hoặc hiển thị nút lịch
// options: { minDate, maxDate, onSelect }
export function setupCustomDatePicker(pickerInput, containerEl, options = {}) {
  // Ẩn input date mặc định
  pickerInput.type = 'hidden';

  // Tạo nút đại diện để bấm mở lịch
  let dateBtn = containerEl.querySelector('.custom-date-picker-btn');
  if (!dateBtn) {
    dateBtn = document.createElement('button');
    dateBtn.type = 'button';
    dateBtn.className = 'custom-date-picker-btn flex items-center justify-between gap-2 w-full border border-apple-divider rounded-full px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:border-apple-blue hover:bg-blue-50 transition-all select-none cursor-pointer';
    containerEl.appendChild(dateBtn);
  }

  // Khởi tạo giá trị ban đầu
  let selectedDate = pickerInput.value ? new Date(pickerInput.value) : new Date();
  if (isNaN(selectedDate.getTime())) selectedDate = new Date();

  const updateBtnLabel = (date) => {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    dateBtn.innerHTML = `
      <span class="flex items-center gap-1.5">
        <span class="material-symbols-outlined text-[16px] text-apple-blue">calendar_today</span>
        <span>${d}/${m}/${y}</span>
      </span>
      <span class="material-symbols-outlined text-[14px] text-slate-400">arrow_drop_down</span>
    `;
    pickerInput.value = `${y}-${m}-${d}`;
  };

  updateBtnLabel(selectedDate);

  // Tạo Popover chứa lịch
  let popover = containerEl.querySelector('.custom-date-picker-popover');
  if (!popover) {
    popover = document.createElement('div');
    popover.className = 'custom-date-picker-popover hidden absolute left-0 right-0 mt-1 bg-white border border-[#e2e2e4] rounded-2xl shadow-xl z-50 p-4 animate-in fade-in slide-in-from-top-1 duration-150 text-xs w-[280px] mx-auto';
    containerEl.classList.add('relative');
    containerEl.appendChild(popover);
  }

  let viewMode = 'day'; // 'year' | 'month' | 'day'
  let activeYear = selectedDate.getFullYear();
  let activeMonth = selectedDate.getMonth();

  const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
  const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  function renderPicker() {
    popover.innerHTML = '';

    if (viewMode === 'year') {
      // --- VIEW NĂM ---
      const startYear = activeYear - 4;
      const years = Array.from({ length: 9 }, (_, i) => startYear + i);
      
      const header = document.createElement('div');
      header.className = 'flex justify-between items-center mb-3 pb-2 border-b border-apple-divider/40 font-bold';
      header.innerHTML = `
        <button type="button" class="btn-prev p-1 hover:bg-slate-100 rounded-full"><span class="material-symbols-outlined text-[16px]">chevron_left</span></button>
        <span class="text-slate-700">${startYear} - ${startYear + 8}</span>
        <button type="button" class="btn-next p-1 hover:bg-slate-100 rounded-full"><span class="material-symbols-outlined text-[16px]">chevron_right</span></button>
      `;
      popover.appendChild(header);

      const grid = document.createElement('div');
      grid.className = 'grid grid-cols-3 gap-2';
      years.forEach(y => {
        const isSel = y === activeYear;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `py-2 rounded-xl font-bold transition active:scale-95 border ${isSel ? 'bg-apple-blue border-apple-blue text-white shadow-md' : 'bg-white border-apple-divider text-slate-700 hover:border-apple-blue hover:bg-blue-50'}`;
        btn.textContent = y;
        btn.addEventListener('click', () => {
          activeYear = y;
          viewMode = 'month';
          renderPicker();
        });
        grid.appendChild(btn);
      });
      popover.appendChild(grid);

      header.querySelector('.btn-prev').addEventListener('click', () => { activeYear -= 9; renderPicker(); });
      header.querySelector('.btn-next').addEventListener('click', () => { activeYear += 9; renderPicker(); });

    } else if (viewMode === 'month') {
      // --- VIEW THÁNG ---
      const header = document.createElement('div');
      header.className = 'flex justify-between items-center mb-3 pb-2 border-b border-apple-divider/40 font-bold';
      header.innerHTML = `
        <button type="button" class="btn-to-year hover:underline text-apple-blue text-[11px] flex items-center gap-0.5"><span class="material-symbols-outlined text-[14px]">arrow_back</span> ${activeYear}</button>
        <span class="text-slate-700">${activeYear}</span>
        <div class="w-10"></div>
      `;
      popover.appendChild(header);

      const grid = document.createElement('div');
      grid.className = 'grid grid-cols-3 gap-2';
      monthNames.forEach((mName, idx) => {
        const isSel = idx === activeMonth;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `py-2 rounded-xl font-bold transition active:scale-95 border ${isSel ? 'bg-apple-blue border-apple-blue text-white shadow-md' : 'bg-white border-apple-divider text-slate-700 hover:border-apple-blue hover:bg-blue-50'}`;
        btn.textContent = mName;
        btn.addEventListener('click', () => {
          activeMonth = idx;
          viewMode = 'day';
          renderPicker();
        });
        grid.appendChild(btn);
      });
      popover.appendChild(grid);

      header.querySelector('.btn-to-year').addEventListener('click', () => { viewMode = 'year'; renderPicker(); });

    } else {
      // --- VIEW NGÀY ---
      const firstDay = new Date(activeYear, activeMonth, 1);
      const lastDay = new Date(activeYear, activeMonth + 1, 0);
      
      let startDay = new Date(firstDay);
      const firstDayOfWeek = firstDay.getDay() === 0 ? 7 : firstDay.getDay();
      startDay.setDate(firstDay.getDate() - (firstDayOfWeek - 1));

      const cells = [];
      const cur = new Date(startDay);
      while (cells.length < 42) {
        cells.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
      }

      const header = document.createElement('div');
      header.className = 'flex justify-between items-center mb-2 pb-2 border-b border-apple-divider/40 font-bold';
      header.innerHTML = `
        <button type="button" class="btn-to-month hover:underline text-apple-blue text-[11px] flex items-center gap-0.5"><span class="material-symbols-outlined text-[14px]">arrow_back</span> Tháng</button>
        <span class="text-slate-700 font-bold">${monthNames[activeMonth]} ${activeYear}</span>
        <div class="flex items-center gap-1">
          <button type="button" class="btn-prev p-1 hover:bg-slate-100 rounded-full"><span class="material-symbols-outlined text-[16px]">chevron_left</span></button>
          <button type="button" class="btn-next p-1 hover:bg-slate-100 rounded-full"><span class="material-symbols-outlined text-[16px]">chevron_right</span></button>
        </div>
      `;
      popover.appendChild(header);

      const daysGrid = document.createElement('div');
      daysGrid.className = 'grid grid-cols-7 mb-1';
      daysGrid.innerHTML = dayNames.map(d => `<div class="text-center text-[10px] font-bold text-slate-400 py-1 uppercase select-none">${d}</div>`).join('');
      popover.appendChild(daysGrid);

      const grid = document.createElement('div');
      grid.className = 'grid grid-cols-7 gap-1';
      cells.forEach(date => {
        const isCurrentMonth = date.getMonth() === activeMonth;
        const isSel = date.toDateString() === selectedDate.toDateString();
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        let isDisabled = false;
        if (options.minDate && dateStr < options.minDate) isDisabled = true;
        if (options.maxDate && dateStr > options.maxDate) isDisabled = true;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.disabled = isDisabled;
        btn.className = `aspect-square rounded-lg flex items-center justify-center font-semibold text-[11px] transition active:scale-95
          ${isDisabled ? 'text-slate-300 cursor-not-allowed bg-slate-50' : 
            isSel ? 'bg-apple-blue text-white font-extrabold shadow-sm' :
            !isCurrentMonth ? 'text-slate-300 hover:bg-slate-50' :
            'text-slate-700 hover:bg-blue-50 hover:text-apple-blue border border-transparent'}`;
        btn.textContent = date.getDate();
        
        if (!isDisabled) {
          btn.addEventListener('click', () => {
            selectedDate = date;
            updateBtnLabel(selectedDate);
            popover.classList.add('hidden');
            if (options.onSelect) options.onSelect(pickerInput.value);
          });
        }
        grid.appendChild(btn);
      });
      popover.appendChild(grid);

      header.querySelector('.btn-to-month').addEventListener('click', () => { viewMode = 'month'; renderPicker(); });
      header.querySelector('.btn-prev').addEventListener('click', () => {
        if (activeMonth === 0) { activeMonth = 11; activeYear--; }
        else activeMonth--;
        renderPicker();
      });
      header.querySelector('.btn-next').addEventListener('click', () => {
        if (activeMonth === 11) { activeMonth = 0; activeYear++; }
        else activeMonth++;
        renderPicker();
      });
    }
  }

  // Mở/Đóng popover
  dateBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    // Đóng toàn bộ custom pickers khác trước
    document.querySelectorAll('.custom-date-picker-popover').forEach(p => {
      if (p !== popover) p.classList.add('hidden');
    });

    popover.classList.toggle('hidden');
    if (!popover.classList.contains('hidden')) {
      viewMode = 'day';
      activeYear = selectedDate.getFullYear();
      activeMonth = selectedDate.getMonth();
      renderPicker();
    }
  });

  // Đóng khi click ngoài
  document.addEventListener('click', (e) => {
    if (!popover.contains(e.target) && e.target !== dateBtn && !dateBtn.contains(e.target)) {
      popover.classList.add('hidden');
    }
  });
}

export function setupSwipePagination(data, container, renderFn, pageSize = 10) {
  let currentPage = 1;
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  // Tạo DOM cho panel hiển thị số trang và hướng dẫn
  let paginationEl = container.parentElement.querySelector('.swipe-pagination-bar');
  if (!paginationEl) {
    paginationEl = document.createElement('div');
    paginationEl.className = 'swipe-pagination-bar py-3 px-6 bg-[#fafafc] border-t border-[#b0b0b5]/40 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 select-none';
    container.parentElement.appendChild(paginationEl);
  }

  function updatePaginationUI() {
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, data.length);
    const pageData = data.slice(startIdx, endIdx);
    
    // Gọi hàm render để cập nhật bảng
    renderFn(pageData);

    // Vẽ giao diện phân trang
    paginationEl.innerHTML = `
      <div class="mb-2 sm:mb-0">
        Hiển thị <strong>${data.length > 0 ? startIdx + 1 : 0}-${endIdx}</strong> trên <strong>${data.length}</strong> bản ghi
      </div>
      <div class="flex items-center gap-4">
        <span class="text-[10px] text-[#0066cc] bg-[#0066cc]/5 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
          <span class="material-symbols-outlined text-[14px]">swipe</span>
          Kéo chuột hoặc vuốt để sang trang
        </span>
        <div class="flex gap-1.5 items-center">
          ${Array.from({ length: totalPages }).map((_, i) => `
            <div class="w-2 h-2 rounded-full transition-all duration-300 ${i + 1 === currentPage ? 'bg-apple-blue w-4' : 'bg-slate-300'}" data-page="${i + 1}"></div>
          `).join('')}
        </div>
        <div class="font-semibold text-apple-ink">Trang ${currentPage}/${totalPages}</div>
      </div>
    `;
  }

  // Thêm sự kiện vuốt/kéo tối ưu
  let startX = 0;
  let startY = 0;
  let isDragging = false;
  let hasDragged = false;

  const handleStart = (e) => {
    startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    isDragging = true;
    hasDragged = false;
  };

  const handleMove = (e) => {
    if (!isDragging) return;
    const currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const currentY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    
    const diffX = Math.abs(currentX - startX);
    const diffY = Math.abs(currentY - startY);

    // Nếu kéo ngang nhiều hơn kéo dọc và khoảng cách kéo lớn hơn 10px thì đánh dấu đang drag
    if (diffX > 10 && diffX > diffY) {
      hasDragged = true;
      // Ngăn chặn cuộn trang mặc định của trình duyệt khi đang vuốt ngang trên mobile
      if (e.cancelable) {
        e.preventDefault();
      }
    }
  };

  const handleEnd = (e) => {
    if (!isDragging) return;
    isDragging = false;
    
    const endX = e.type === 'touchend' ? e.changedTouches[0].clientX : e.clientX;
    const diffX = endX - startX;

    // Ngưỡng vuốt ngang (pixels)
    if (hasDragged && Math.abs(diffX) > 60) {
      if (diffX < 0) {
        // Vuốt sang trái -> Trang sau
        if (currentPage < totalPages) {
          currentPage++;
          updatePaginationUI();
        }
      } else {
        // Vuốt sang phải -> Trang trước
        if (currentPage > 1) {
          currentPage--;
          updatePaginationUI();
        }
      }
    }
  };

  // Ngăn chặn click nhầm khi đang thực hiện thao tác drag kéo trang
  const handleClickCapture = (e) => {
    if (hasDragged) {
      e.stopPropagation();
      e.preventDefault();
      hasDragged = false; // reset
    }
  };

  // Gắn các sự kiện vào container dữ liệu
  container.removeEventListener('mousedown', handleStart);
  container.removeEventListener('mousemove', handleMove);
  container.removeEventListener('mouseup', handleEnd);
  container.removeEventListener('touchstart', handleStart);
  container.removeEventListener('touchmove', handleMove);
  container.removeEventListener('touchend', handleEnd);
  container.removeEventListener('click', handleClickCapture, true);

  container.addEventListener('mousedown', handleStart);
  container.addEventListener('mousemove', handleMove);
  container.addEventListener('mouseup', handleEnd);
  container.addEventListener('touchstart', handleStart, { passive: true });
  container.addEventListener('touchmove', handleMove, { passive: false });
  container.addEventListener('touchend', handleEnd, { passive: true });
  
  // Sử dụng capturing phase để chặn các click event của thẻ con nếu người dùng đang thực hiện drag
  container.addEventListener('click', handleClickCapture, true);

  // Render trang đầu tiên
  updatePaginationUI();
}
