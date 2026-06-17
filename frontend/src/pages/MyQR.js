import { API_BASE, showToast } from './_shared.js';

export async function renderMyQR(container) {
  const hoSoId = localStorage.getItem('hoSoId');
  const userRole = localStorage.getItem('userRole');

  container.innerHTML = `
    <div class="flex flex-col items-center justify-center min-h-[500px] p-6 animate-fadeIn">
      <div class="bg-white border border-[#e2e2e4] rounded-3xl p-8 max-w-sm w-full shadow-lg flex flex-col items-center space-y-6 text-center">
        
        <!-- Header -->
        <div>
          <h3 class="text-lg font-bold text-slate-800">Mã QR Check-in cá nhân</h3>
          <p class="text-xs text-slate-400 mt-1">Sử dụng mã này để điểm danh vào ca học hoặc chấm công tại quầy lễ tân</p>
        </div>

        <!-- QR Area -->
        <div class="relative w-64 h-64 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner p-4 group">
          <img id="my-qr-image" class="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 select-none" style="display: none;" />
          <div id="my-qr-loading" class="flex flex-col items-center gap-2">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-apple-blue"></div>
            <span class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Đang tạo mã...</span>
          </div>
        </div>

        <!-- Timer Countdown Info -->
        <div class="w-full bg-[#f3f3f5] rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
          <div class="flex items-center gap-1.5 text-slate-500 font-medium">
            <span class="material-symbols-outlined text-[16px] text-amber-500 animate-pulse">schedule</span>
            <span>Tự động làm mới sau:</span>
          </div>
          <span id="my-qr-timer" class="font-extrabold text-apple-blue text-sm tracking-wide">05:00</span>
        </div>

        <!-- Actions -->
        <div class="w-full pt-2 flex flex-col gap-2">
          <button id="btn-refresh-qr" class="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-apple-blue to-[#007eff] text-white py-2.5 rounded-xl text-xs font-semibold hover:shadow-lg transition-all active:scale-[0.98] shadow-md">
            <span class="material-symbols-outlined text-[16px]">autorenew</span>Làm mới mã QR ngay
          </button>
          
          <div class="text-[10px] text-slate-400 font-medium italic">
            * Mã QR có thời hạn 5 phút và tự động thay đổi để chống gian lận.
          </div>
        </div>

      </div>
    </div>
  `;

  let timerInterval = null;

  async function fetchNewQR() {
    const qrImage = document.getElementById('my-qr-image');
    const qrLoading = document.getElementById('my-qr-loading');
    const qrTimer = document.getElementById('my-qr-timer');

    if (qrImage) qrImage.style.display = 'none';
    if (qrLoading) qrLoading.style.display = 'flex';

    clearInterval(timerInterval);

    try {
      const res = await fetch(`${API_BASE}/checkin/my-qr`, {
        headers: {
          'x-ho-so-id': hoSoId || '',
          'x-user-role': userRole || ''
        }
      });
      const result = await res.json();
      if (result.success) {
        const { qr_token, expires_at, ttl_seconds } = result.data;

        // Render QR Code qua API online
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qr_token)}`;
        if (qrImage) {
          qrImage.src = qrUrl;
          qrImage.onload = () => {
            qrLoading.style.display = 'none';
            qrImage.style.display = 'block';
          };
        }

        // Bắt đầu đếm ngược
        let remainingSeconds = Math.max(0, Math.floor((expires_at - Date.now()) / 1000));
        
        const updateTimerDisplay = () => {
          const m = Math.floor(remainingSeconds / 60).toString().padStart(2, '0');
          const s = (remainingSeconds % 60).toString().padStart(2, '0');
          if (qrTimer) qrTimer.textContent = `${m}:${s}`;
        };

        updateTimerDisplay();

        timerInterval = setInterval(() => {
          remainingSeconds--;
          if (remainingSeconds < 0) {
            clearInterval(timerInterval);
            fetchNewQR(); // Tự động load mã mới
          } else {
            updateTimerDisplay();
          }
        }, 1000);

      } else {
        showToast(result.error || 'Lỗi tạo mã QR', 'error');
      }
    } catch (err) {
      showToast('Lỗi kết nối máy chủ', 'error');
    }
  }

  // Sự kiện làm mới thủ công
  document.getElementById('btn-refresh-qr')?.addEventListener('click', () => {
    fetchNewQR();
    showToast('Đã làm mới mã QR thành công!', 'success');
  });

  // Load mã QR đầu tiên
  fetchNewQR();

  // Dọn dẹp interval khi container bị hủy/render lại trang khác
  const observer = new MutationObserver(() => {
    if (!document.body.contains(container)) {
      clearInterval(timerInterval);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
