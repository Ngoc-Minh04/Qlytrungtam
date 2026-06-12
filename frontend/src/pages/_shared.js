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
