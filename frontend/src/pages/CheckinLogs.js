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
          <div class="flex justify-between items-center pb-2 border-b border-apple-divider/40 flex-wrap gap-2">
            <h3 class="font-bold text-apple-ink text-sm">Nhật ký check-in gần đây</h3>
            <div class="flex items-center gap-2">
              <button id="btn-logs-scan-qr" class="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-apple-blue to-[#007eff] hover:shadow-md text-white text-xs font-bold rounded-full transition-all active:scale-95 shadow-sm h-[30px]">
                <span class="material-symbols-outlined text-[16px]">qr_code_scanner</span>Quét QR Check-in
              </button>
              <button id="btn-refresh-checkin" class="flex items-center justify-center gap-1.5 px-3 py-1 border border-[#e2e2e4] hover:bg-white text-slate-700 text-xs font-semibold rounded-full transition-all active:scale-95 shadow-sm h-[30px]">
                <span class="material-symbols-outlined text-[16px]">refresh</span>Tải lại
              </button>
              <span class="text-[10px] text-slate-400 bg-white px-3 py-1.5 rounded-full font-bold">Hôm nay</span>
            </div>
          </div>
          <div id="checkin-log-list" class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <!-- Sẽ chèn bằng setupSwipePagination -->
          </div>
        </div>
      </div>

      <!-- Modal quét QR Check-in -->
      <div id="logs-scan-modal" class="fixed inset-0 bg-black/45 backdrop-blur-md z-50 flex items-center justify-center p-4 hidden animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-md w-full border border-[#e2e2e4] shadow-2xl overflow-hidden" style="animation: modalIn 0.2s ease">
          <div class="flex items-center justify-between px-6 py-4 border-b border-[#f3f3f5]">
            <h3 class="text-sm font-bold text-[#1a1c1d] flex items-center gap-2">
              <span class="material-symbols-outlined text-apple-blue text-[20px]">qr_code_scanner</span>
              Quét mã QR học viên
            </h3>
            <button id="close-logs-scan-modal" class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <div class="p-6 space-y-4 text-xs">
            <!-- Camera Scanner Area -->
            <div id="logs-reader" class="w-full aspect-square bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden relative">
              <!-- Camera preview will render here -->
            </div>
            
            <!-- File upload fallback -->
            <div class="flex justify-center">
              <button id="btn-logs-upload-qr" class="flex items-center gap-1.5 px-4 py-2 border border-[#e2e2e4] hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition active:scale-95">
                <span class="material-symbols-outlined text-[16px]">file_upload</span>
                Chọn ảnh QR từ máy
              </button>
              <input type="file" id="logs-scan-file" accept="image/*" class="hidden" />
            </div>

            <!-- Manual input fallback -->
            <form id="logs-scan-form" class="space-y-3 pt-2 border-t border-[#f3f3f5]">
              <div class="space-y-1">
                <label class="block font-semibold text-slate-600">Hoặc nhập mã học viên thủ công</label>
                <div class="flex gap-2">
                  <input type="text" id="logs-scan-input" placeholder="Ví dụ: HV034" required
                    class="flex-1 border border-[#e2e2e4] rounded-xl px-3 py-2 outline-none focus:border-apple-blue transition bg-[#fafafa]">
                  <button type="submit" class="px-4 py-2 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-900 transition active:scale-95">
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
    setupSwipePagination(logs, logListContainer, (pageLogs) => {
      logListContainer.innerHTML = renderLogCards(pageLogs);
    }, 10);

    // Xử lý camera quét QR
    let html5QrScanner = null;
    const scanModal = document.getElementById('logs-scan-modal');

    function stopScanner() {
      if (html5QrScanner) {
        html5QrScanner.stop().then(() => {
          html5QrScanner = null;
        }).catch(err => {
          console.error("Lỗi giải phóng camera:", err);
          html5QrScanner = null;
        });
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
