// _shared.js - Tiện ích dùng chung cho tất cả các page
export const API_BASE = 'http://localhost:3006/api';

export function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg text-xs font-bold pointer-events-auto transition-all duration-300 transform translate-y-2 opacity-0 select-none max-w-sm bg-white';
  
  let icon = 'check_circle';
  let iconColor = 'text-emerald-500';
  let borderColor = 'border-emerald-100';
  let bgClass = 'bg-emerald-50/20';
  
  if (type === 'error') {
    icon = 'cancel';
    iconColor = 'text-red-500';
    borderColor = 'border-red-100';
    bgClass = 'bg-red-50/20';
  } else if (type === 'warning') {
    icon = 'warning';
    iconColor = 'text-amber-500';
    borderColor = 'border-amber-100';
    bgClass = 'bg-amber-50/20';
  } else if (type === 'info') {
    icon = 'info';
    iconColor = 'text-apple-blue';
    borderColor = 'border-blue-100';
    bgClass = 'bg-blue-50/20';
  }

  toast.innerHTML = `
    <span class="material-symbols-outlined ${iconColor} text-[18px] shrink-0">${icon}</span>
    <span class="text-slate-800 leading-normal">${message}</span>
  `;
  toast.className += ` ${borderColor} ${bgClass}`;

  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });
  });

  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
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

  // Khởi tạo giá trị ban đầu (tránh lệch ngày do timezone offset khi chuyển đổi)
  let selectedDate = new Date();
  if (pickerInput.value) {
    const parts = pickerInput.value.split('-');
    if (parts.length === 3) {
      selectedDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    } else {
      selectedDate = new Date(pickerInput.value);
    }
  }
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

  // Tạo getter/setter hoặc observer để cập nhật giao diện khi pickerInput.value thay đổi từ ngoài
  const observer = new MutationObserver(() => {
    if (pickerInput.value) {
      const parts = pickerInput.value.split('-');
      if (parts.length === 3) {
        const newD = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        if (!isNaN(newD.getTime()) && newD.toDateString() !== selectedDate.toDateString()) {
          selectedDate = newD;
          const dStr = String(selectedDate.getDate()).padStart(2, '0');
          const mStr = String(selectedDate.getMonth() + 1).padStart(2, '0');
          const yStr = selectedDate.getFullYear();
          dateBtn.innerHTML = `
            <span class="flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[16px] text-apple-blue">calendar_today</span>
              <span>${dStr}/${mStr}/${yStr}</span>
            </span>
            <span class="material-symbols-outlined text-[14px] text-slate-400">arrow_drop_down</span>
          `;
        }
      }
    }
  });
  observer.observe(pickerInput, { attributes: true, attributeFilter: ['value'] });

  // Tạo Popover chứa lịch
  let popover = containerEl.querySelector('.custom-date-picker-popover');
  if (!popover) {
    popover = document.createElement('div');
    // Bỏ max-h và overflow để hiển thị trọn vẹn lịch biểu không cần cuộn
    popover.className = 'custom-date-picker-popover hidden absolute left-0 mt-1 bg-white border border-[#e2e2e4] rounded-2xl shadow-xl z-[9999] p-4 animate-in fade-in slide-in-from-top-1 duration-150 text-xs w-[280px]';
    containerEl.classList.add('relative');
    containerEl.appendChild(popover);
  }

  let viewMode = 'day'; // 'day', 'month', 'year'
  let activeYear = selectedDate.getFullYear();
  let activeMonth = selectedDate.getMonth();

  const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
  const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  function renderPicker() {
    popover.innerHTML = '';

    // Tạo Header dùng chung đối xứng: < [Tiêu đề] >
    const header = document.createElement('div');
    header.className = 'flex justify-between items-center mb-3 pb-2 border-b border-apple-divider/40 font-bold select-none';
    
    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'btn-prev p-1 hover:bg-slate-100 rounded-full flex items-center justify-center';
    prevBtn.innerHTML = '<span class="material-symbols-outlined text-[16px] text-slate-600">chevron_left</span>';

    const titleEl = document.createElement('span');
    titleEl.className = 'btn-title text-slate-700 cursor-pointer hover:text-apple-blue transition-colors text-xs font-bold';

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'btn-next p-1 hover:bg-slate-100 rounded-full flex items-center justify-center';
    nextBtn.innerHTML = '<span class="material-symbols-outlined text-[16px] text-slate-600">chevron_right</span>';

    header.appendChild(prevBtn);
    header.appendChild(titleEl);
    header.appendChild(nextBtn);
    popover.appendChild(header);

    if (viewMode === 'year') {
      // --- VIEW THẬP KỶ (HIỂN THỊ 12 NĂM) ---
      const startDecade = Math.floor(activeYear / 10) * 10;
      titleEl.textContent = `${startDecade} - ${startDecade + 9}`;
      
      // Không zoom out thêm vì đây là cấp cao nhất
      titleEl.classList.remove('cursor-pointer', 'hover:text-apple-blue');

      const grid = document.createElement('div');
      grid.className = 'grid grid-cols-4 gap-2';

      // Hiển thị 12 năm: từ startDecade - 1 đến startDecade + 10
      for (let i = -1; i <= 10; i++) {
        const y = startDecade + i;
        const isSel = y === selectedDate.getFullYear();
        const isOut = i === -1 || i === 10; // 2 năm lân cận thập kỷ
        
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `py-2 rounded-xl font-bold transition active:scale-95 border text-[11px]
          ${isSel ? 'bg-apple-blue border-apple-blue text-white shadow-md' : 
            isOut ? 'bg-white border-apple-divider/40 text-slate-300 opacity-50' : 
            'bg-white border-apple-divider text-slate-700 hover:border-apple-blue hover:bg-blue-50'}`;
        btn.textContent = y;
        
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          activeYear = y;
          viewMode = 'month';
          renderPicker();
        });
        grid.appendChild(btn);
      }
      popover.appendChild(grid);

      prevBtn.addEventListener('click', (e) => { e.stopPropagation(); activeYear -= 10; renderPicker(); });
      nextBtn.addEventListener('click', (e) => { e.stopPropagation(); activeYear += 10; renderPicker(); });

    } else if (viewMode === 'month') {
      // --- VIEW NĂM (HIỂN THỊ 12 THÁNG) ---
      titleEl.textContent = `${activeYear}`;
      titleEl.addEventListener('click', (e) => {
        e.stopPropagation();
        viewMode = 'year';
        renderPicker();
      });

      const grid = document.createElement('div');
      grid.className = 'grid grid-cols-3 gap-2';
      monthNames.forEach((mName, idx) => {
        const isSel = idx === selectedDate.getMonth() && activeYear === selectedDate.getFullYear();
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `py-2 rounded-xl font-bold transition active:scale-95 border text-[11px]
          ${isSel ? 'bg-apple-blue border-apple-blue text-white shadow-md' : 'bg-white border-apple-divider text-slate-700 hover:border-apple-blue hover:bg-blue-50'}`;
        btn.textContent = mName;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          activeMonth = idx;
          viewMode = 'day';
          renderPicker();
        });
        grid.appendChild(btn);
      });
      popover.appendChild(grid);

      prevBtn.addEventListener('click', (e) => { e.stopPropagation(); activeYear--; renderPicker(); });
      nextBtn.addEventListener('click', (e) => { e.stopPropagation(); activeYear++; renderPicker(); });

    } else {
      // --- VIEW THÁNG (HIỂN THỊ CÁC NGÀY) ---
      titleEl.textContent = `Tháng ${activeMonth + 1} ${activeYear}`;
      titleEl.addEventListener('click', (e) => {
        e.stopPropagation();
        viewMode = 'month';
        renderPicker();
      });

      const daysGrid = document.createElement('div');
      daysGrid.className = 'grid grid-cols-7 mb-1';
      daysGrid.innerHTML = dayNames.map(d => `<div class="text-center text-[10px] font-bold text-slate-400 py-1 uppercase select-none">${d}</div>`).join('');
      popover.appendChild(daysGrid);

      const firstDay = new Date(activeYear, activeMonth, 1);
      let startDay = new Date(firstDay);
      const firstDayOfWeek = firstDay.getDay() === 0 ? 7 : firstDay.getDay();
      startDay.setDate(firstDay.getDate() - (firstDayOfWeek - 1));

      const cells = [];
      const cur = new Date(startDay);
      while (cells.length < 42) {
        cells.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
      }

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

      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activeMonth === 0) { activeMonth = 11; activeYear--; }
        else activeMonth--;
        renderPicker();
      });
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
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
      // Trích xuất lại từ giá trị hiện tại của pickerInput để đồng bộ khi hiển thị
      let curDate = new Date();
      if (pickerInput.value) {
        const parts = pickerInput.value.split('-');
        if (parts.length === 3) {
          curDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
          curDate = new Date(pickerInput.value);
        }
      }
      if (!isNaN(curDate.getTime())) {
        selectedDate = curDate;
      }
      activeYear = selectedDate.getFullYear();
      activeMonth = selectedDate.getMonth();
      renderPicker();
    }
  });

  // Ngăn chặn đóng popover khi click vào bên trong nó
  popover.addEventListener('click', (e) => {
    e.stopPropagation();
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
