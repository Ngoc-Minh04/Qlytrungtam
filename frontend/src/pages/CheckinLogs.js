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
    const allLogs = result.data || [];

    // Tính ngày hôm nay địa phương (yyyy-mm-dd) để lọc dữ liệu chỉ trong ngày hôm nay
    const tzOffset = (new Date()).getTimezoneOffset() * 60000;
    const localTodayStr = (new Date(Date.now() - tzOffset)).toISOString().split('T')[0];

    const logs = allLogs.filter(log => {
      if (!log.thoi_diem) return false;
      const logDateStr = new Date(new Date(log.thoi_diem).getTime() - tzOffset).toISOString().split('T')[0];
      return logDateStr === localTodayStr;
    });

    function renderLogCards(pageLogs) {
      if (pageLogs.length === 0) {
        return '<p class="col-span-2 text-slate-400 text-xs text-center py-16 font-medium">Chưa có lượt quét nào trong ngày hôm nay.</p>';
      }
      return pageLogs.map(log => {
        const isValid = log.loai === 'vao';
        const indicatorColor = isValid ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse';
        return `
          <div class="bg-white rounded-2xl p-4 flex items-center border border-slate-100/80 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md hover:scale-[1.01] hover:bg-slate-50/40">
            <!-- Glowing status indicator dot -->
            <div class="absolute right-4 top-4 w-2 h-2 rounded-full ${indicatorColor}"></div>
            
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200/50 flex items-center justify-center font-bold text-slate-700 mr-4 select-none border border-slate-200/40">
              ${log.ho_ten.charAt(0)}
            </div>
            
            <div class="flex-1 min-w-0 pr-6">
              <h4 class="font-bold text-slate-800 text-sm truncate">${log.ho_ten}</h4>
              <p class="text-[11px] text-slate-400 font-medium mt-0.5 flex items-center gap-1.5 truncate">
                <span>Mã: ${log.ma_ho_so}</span>
                <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                <span>${log.chi_nhanh_thuc_hien || 'Trung tâm'}</span>
              </p>
            </div>
            
            <div class="text-right text-[10px] shrink-0">
              <p class="text-slate-400 font-bold mb-1.5 tracking-tight">${new Date(log.thoi_diem).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider ${
                isValid 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                  : 'bg-rose-50 text-rose-700 border border-rose-100'
              }">
                ${isValid ? 'CHECK-IN' : 'CHECK-OUT'}
              </span>
            </div>
          </div>
        `;
      }).join('');
    }

    container.innerHTML = `
      <div class="space-y-4">
        <div class="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-5 min-h-[400px]">
          <div class="flex justify-between items-center pb-3.5 border-b border-slate-100 flex-wrap gap-3">
            <div class="flex items-center gap-3">
              <h3 class="font-bold text-slate-800 text-sm tracking-wide">Nhật ký check-in gần đây</h3>
              <span class="px-2 py-0.5 bg-slate-100 text-slate-500 font-semibold rounded-full text-[9px]">${logs.length} lượt</span>
            </div>
            <div class="flex items-center gap-2">
              <button id="btn-logs-scan-qr" class="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-apple-blue to-[#007eff] hover:shadow-md text-white text-xs font-bold rounded-full transition-all active:scale-95 shadow-sm h-[32px]">
                <span class="material-symbols-outlined text-[16px]">qr_code_scanner</span>Quét QR Check-in
              </button>
              <button id="btn-refresh-checkin" class="flex items-center justify-center gap-1.5 px-3.5 py-1.5 border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-full transition-all active:scale-95 shadow-sm h-[32px]">
                <span class="material-symbols-outlined text-[16px]">refresh</span>Tải lại
              </button>
              <span class="text-[9px] text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full font-bold">Hôm nay</span>
            </div>
          </div>
          <div id="checkin-log-list" class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
            <!-- Dữ liệu render trực tiếp -->
          </div>
        </div>
      </div>

      <!-- Modal quét QR Check-in -->
      <div id="logs-scan-modal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4 hidden animate-fadeIn">
        <div class="bg-white rounded-[28px] max-w-md w-full border border-slate-100 shadow-2xl overflow-hidden" style="animation: modalIn 0.2s ease">
          <div class="flex items-center justify-between px-6 py-4.5 border-b border-slate-50">
            <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span class="material-symbols-outlined text-apple-blue text-[20px]">qr_code_scanner</span>
              Quét mã QR học viên
            </h3>
            <button id="close-logs-scan-modal" class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <div class="p-6 space-y-4 text-xs">
            <!-- Camera Scanner Area -->
            <div id="logs-reader" class="w-full aspect-square bg-slate-50 border border-slate-150 rounded-[20px] overflow-hidden relative shadow-inner">
              <!-- Camera preview will render here -->
            </div>
            
            <!-- File upload fallback -->
            <div class="flex justify-center">
              <button id="btn-logs-upload-qr" class="flex items-center gap-1.5 px-4.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-full transition active:scale-95 shadow-sm">
                <span class="material-symbols-outlined text-[16px]">file_upload</span>
                Chọn ảnh QR từ máy
              </button>
              <input type="file" id="logs-scan-file" accept="image/*" class="hidden" />
            </div>

            <!-- Manual input fallback -->
            <form id="logs-scan-form" class="space-y-3 pt-4 border-t border-slate-100">
              <div class="space-y-1.5">
                <label class="block font-semibold text-slate-500">Hoặc nhập mã học viên thủ công</label>
                <div class="flex gap-2">
                  <input type="text" id="logs-scan-input" placeholder="Ví dụ: HV034" required
                    class="flex-1 border border-slate-200 rounded-full px-4 py-2 outline-none focus:border-apple-blue transition bg-slate-50/50 text-xs">
                  <button type="submit" class="px-5 py-2 bg-slate-800 text-white font-semibold rounded-full hover:bg-slate-900 transition active:scale-95 text-xs">
                    Gửi
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      <style>
        @keyframes modalIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      </style>
    `;

    document.getElementById('btn-refresh-checkin')?.addEventListener('click', () => {
      renderCheckinLogs(container);
    });

    const logListContainer = document.getElementById('checkin-log-list');
    if (logListContainer) {
      logListContainer.innerHTML = renderLogCards(logs);
    }

    // Xử lý camera quét QR
    let html5QrScanner = null;
    const scanModal = document.getElementById('logs-scan-modal');

    function stopScanner() {
      if (html5QrScanner) {
        if (html5QrScanner.isScanning) {
          html5QrScanner.stop().then(() => {
            html5QrScanner = null;
          }).catch(err => {
            console.error("Lỗi giải phóng camera:", err);
            html5QrScanner = null;
          });
        } else {
          html5QrScanner = null;
        }
      }
    }

    async function onScanSuccess(decodedText) {
      stopScanner();
      scanModal.classList.add('hidden');
      await submitCheckinScan(decodedText);
    }

    async function submitCheckinScan(token) {
      try {
        const res = await fetch(`${API_BASE}/checkin/scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qr_token: token, current_branch: 'Trung tâm chính' })
        });
        const result = await res.json();
        if (result.success) {
          showToast(result.message || 'Check-in thành công!', 'success');
          renderCheckinLogs(container); // Refresh danh sách
        } else {
          showToast(result.error || 'Check-in thất bại', 'error');
        }
      } catch (err) {
        showToast('Không thể kết nối máy chủ', 'error');
      }
    }

    // Mở modal quét
    document.getElementById('btn-logs-scan-qr')?.addEventListener('click', () => {
      scanModal.classList.remove('hidden');
      setTimeout(() => {
        try {
          html5QrScanner = new Html5Qrcode("logs-reader");
          html5QrScanner.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: (w, h) => ({ width: Math.round(w * 0.7), height: Math.round(h * 0.7) })
            },
            onScanSuccess
          ).catch(err => {
            console.warn("Không thể khởi động camera quét QR:", err);
            const readerDiv = document.getElementById('logs-reader');
            if (readerDiv) {
              readerDiv.innerHTML = `<div class="p-4 text-center text-slate-400 text-xs h-full flex flex-col justify-center items-center select-none">
                <span class="material-symbols-outlined text-red-400 text-[28px] mb-1">videocam_off</span>
                Không thể truy cập camera. Vui lòng cấp quyền hoặc nhập thủ công.
              </div>`;
            }
          });
        } catch (e) {
          console.error("Lỗi khởi tạo Html5Qrcode:", e);
        }
      }, 100);
    });

    // Đóng modal quét
    document.getElementById('close-logs-scan-modal')?.addEventListener('click', () => {
      scanModal.classList.add('hidden');
      stopScanner();
    });

    scanModal.addEventListener('click', (e) => {
      if (e.target === scanModal) {
        scanModal.classList.add('hidden');
        stopScanner();
      }
    });

    // Trigger upload ảnh
    document.getElementById('btn-logs-upload-qr')?.addEventListener('click', () => {
      document.getElementById('logs-scan-file')?.click();
    });

    document.getElementById('logs-scan-file')?.addEventListener('change', async (e) => {
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      const tempScanner = new Html5Qrcode("logs-reader");
      try {
        showToast('Đang quét mã QR từ ảnh...', 'info');
        const decodedText = await tempScanner.scanFile(file, false);
        await onScanSuccess(decodedText);
      } catch (err) {
        showToast('Không tìm thấy mã QR trong ảnh này', 'error');
      }
    });

    // Submit form thủ công
    document.getElementById('logs-scan-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const inputVal = document.getElementById('logs-scan-input').value.trim();
      if (!inputVal) return;
      
      stopScanner();
      scanModal.classList.add('hidden');

      // Giả lập token Base64 thô tương tự quick-checkin
      const payload = { ho_so_id: inputVal, timestamp: Date.now() };
      const manualToken = btoa(JSON.stringify(payload));
      await submitCheckinScan(manualToken);
    });

    // Dọn dẹp scanner khi chuyển trang
    const observer = new MutationObserver(() => {
      if (!document.body.contains(container)) {
        stopScanner();
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

  } catch (err) {
    container.innerHTML = `
      <div class="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4 text-xs">
        <strong>Lỗi tải dữ liệu:</strong> ${err.message}
      </div>
    `;
  }
}
