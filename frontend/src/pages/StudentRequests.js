// StudentRequests.js - Xử lý Yêu cầu (Bảo lưu / Hủy khóa học)
import { API_BASE, showToast, setupSwipePagination } from './_shared.js';

export async function renderStudentRequests(container) {
  container.innerHTML = `
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-apple-blue"></div>
    </div>
  `;

  try {
    // Tải danh sách đăng ký khóa học đang hoạt động
    const res = await fetch(`${API_BASE}/registrations`, {
      headers: { 'X-User-Role': 'admin' }
    });
    const result = await res.json();
    const allRegs = result.data || [];

    // Lọc các đăng ký đang hoạt động (chưa bị hủy)
    const activeRegs = allRegs.filter(r => r.trang_thai !== 'huy');

    function renderRows(pageList) {
      if (pageList.length === 0) {
        return `
          <tr>
            <td colspan="6" class="px-6 py-12 text-center">
              <div class="flex flex-col items-center gap-3 text-slate-400">
                <span class="material-symbols-outlined text-[36px] opacity-40">inbox</span>
                <span class="text-xs">Không có yêu cầu nào đang chờ xử lý.</span>
              </div>
            </td>
          </tr>
        `;
      }
      return pageList.map(r => {
        const tuNgay = r.tu_ngay ? new Date(r.tu_ngay).toLocaleDateString('vi-VN') : '—';
        const denNgay = r.den_ngay ? new Date(r.den_ngay).toLocaleDateString('vi-VN') : '—';
        const soTien = r.gia_thuc_te ? parseInt(r.gia_thuc_te).toLocaleString('vi-VN') + ' đ' : '—';
        const thucThu = r.so_tien_da_thu ? parseInt(r.so_tien_da_thu).toLocaleString('vi-VN') + ' đ' : '—';
        return `
          <tr class="hover:bg-slate-50 border-b border-apple-divider/40 text-xs transition group">
            <td class="px-5 py-3.5">
              <div class="font-bold text-apple-ink">${r.ho_ten || '—'}</div>
              <div class="text-[10px] text-slate-400 mt-0.5">ID: ${r.ho_so_id} · Mã: ${r.ten_goi || '—'}</div>
            </td>
            <td class="px-5 py-3.5 text-slate-600">${tuNgay} → ${denNgay}</td>
            <td class="px-5 py-3.5">
              <div class="text-apple-ink font-semibold">${soTien}</div>
              <div class="text-[10px] text-slate-400">Đã thu: ${thucThu}</div>
            </td>
            <td class="px-5 py-3.5 text-slate-500">${r.phuong_thuc_tt || '—'}</td>
            <td class="px-5 py-3.5">
              <span class="px-2.5 py-1 rounded-full text-[10px] font-bold
                ${r.trang_thai === 'dang_hoat_dong' ? 'bg-emerald-100 text-emerald-700' :
            r.trang_thai === 'het_han' ? 'bg-slate-100 text-slate-500' :
              r.trang_thai === 'tam_dung' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-600'}">
                ${r.trang_thai === 'dang_hoat_dong' ? 'Đang hoạt động' :
            r.trang_thai === 'het_han' ? 'Hết hạn' :
              r.trang_thai === 'tam_dung' ? 'Tạm dừng' : r.trang_thai || '—'}
              </span>
            </td>
            <td class="px-5 py-3.5 text-right">
              <button class="btn-cancel-reg px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-full text-[10.5px] font-semibold transition active:scale-95"
                data-id="${r.id}" data-name="${r.ho_ten || ''}">
                Hủy KH
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <!-- Stats Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div class="bg-white rounded-2xl border border-[#e2e2e4] p-4 shadow-sm">
            <div class="flex items-center gap-2 mb-1">
              <span class="material-symbols-outlined text-emerald-500 text-[18px]">check_circle</span>
              <span class="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wide">Đang hoạt động</span>
            </div>
            <div class="text-2xl font-extrabold text-apple-ink">${allRegs.filter(r => r.trang_thai === 'dang_hoat_dong').length}</div>
          </div>
          <div class="bg-white rounded-2xl border border-[#e2e2e4] p-4 shadow-sm">
            <div class="flex items-center gap-2 mb-1">
              <span class="material-symbols-outlined text-red-500 text-[18px]">cancel</span>
              <span class="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wide">Đã hủy</span>
            </div>
            <div class="text-2xl font-extrabold text-apple-ink">${allRegs.filter(r => r.trang_thai === 'huy').length}</div>
          </div>
          <div class="bg-white rounded-2xl border border-[#e2e2e4] p-4 shadow-sm col-span-2 sm:col-span-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="material-symbols-outlined text-slate-400 text-[18px]">history</span>
              <span class="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wide">Tổng đăng ký</span>
            </div>
            <div class="text-2xl font-extrabold text-apple-ink">${allRegs.length}</div>
          </div>
        </div>

        <!-- Table -->
        <div class="bg-white rounded-2xl border border-[#e2e2e4] overflow-hidden shadow-sm">
          <div class="px-5 py-4 border-b border-[#f3f3f5] flex items-center justify-between flex-wrap gap-2">
            <h3 class="font-bold text-apple-ink text-sm flex items-center gap-2">
              <span class="material-symbols-outlined text-apple-blue text-[18px]">manage_accounts</span>
              Danh sách đăng ký khóa học đang hoạt động
            </h3>
            <div class="flex items-center gap-2">
              <button id="btn-refresh-requests" class="flex items-center justify-center gap-1.5 px-3 py-1 border border-[#e2e2e4] hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-full transition-all active:scale-95 shadow-sm h-[32px]" type="button">
                <span class="material-symbols-outlined text-[16px]">refresh</span>Tải lại
              </button>
              <span class="text-[10px] text-slate-400 bg-[#f3f3f5] px-3 py-1.5 rounded-full font-bold">${activeRegs.length} bản ghi</span>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr class="bg-[#f3f3f5] text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-[#e2e2e4]">
                  <th class="px-5 py-3">HỌC VIÊN / GÓI</th>
                  <th class="px-5 py-3">THỜI HẠN</th>
                  <th class="px-5 py-3">HỌC PHÍ</th>
                  <th class="px-5 py-3">THANH TOÁN</th>
                  <th class="px-5 py-3">TRẠNG THÁI</th>
                  <th class="px-5 py-3 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody id="requests-table-body">
                <!-- Sẽ chèn bằng setupSwipePagination -->
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- MODAL HỦY KHÓA HỌC -->
      <div id="cancel-reg-modal" class="fixed inset-0 bg-black/45 backdrop-blur-md z-50 flex items-center justify-center p-4 hidden">
        <div class="bg-white rounded-3xl max-w-md w-full border border-[#e2e2e4] shadow-2xl overflow-hidden" style="animation: modalIn 0.2s ease">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-[#f3f3f5]">
            <h3 class="text-sm font-bold text-[#1a1c1d] flex items-center gap-2">
              <span class="material-symbols-outlined text-red-500 text-[20px]">cancel</span>
              Hủy đăng ký khóa học
            </h3>
            <button id="close-cancel-modal" class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <!-- Body -->
          <form id="cancel-reg-form" class="p-6 space-y-4 text-xs">
            <div class="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
              <span class="material-symbols-outlined text-red-500 text-[20px]">warning</span>
              <p class="text-red-700 font-medium text-[11px]">Hành động này sẽ hủy khóa học của học viên <strong id="cancel-student-name" class="font-extrabold">—</strong>. Không thể hoàn tác.</p>
            </div>

            <div class="space-y-1">
              <label class="block font-semibold text-slate-600">Số tiền hoàn trả (VNĐ)</label>
              <input type="number" id="cancel-refund-amount" value="0" min="0"
                class="w-full border border-[#e2e2e4] rounded-xl px-3.5 py-2.5 outline-none focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/10 transition bg-[#fafafa]">
            </div>

            <div class="space-y-1">
              <label class="block font-semibold text-slate-600">Lý do hủy</label>
              <textarea id="cancel-reason" rows="3" placeholder="Nhập lý do hủy khóa học..."
                class="w-full border border-[#e2e2e4] rounded-xl px-3.5 py-2.5 outline-none focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/10 transition bg-[#fafafa] resize-none"></textarea>
            </div>

            <div class="flex justify-end gap-2 pt-2 border-t border-[#f3f3f5]">
              <button type="button" id="btn-cancel-cancel-reg"
                class="px-5 py-2.5 rounded-xl border border-[#e2e2e4] hover:bg-slate-50 text-slate-700 font-semibold transition active:scale-95">
                Đóng
              </button>
              <button type="submit"
                class="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition active:scale-95 shadow-sm">
                <span class="material-symbols-outlined text-[15px]">delete_forever</span>
                Xác nhận hủy
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      </style>
    `;

    const tableBody = document.getElementById('requests-table-body');
    setupSwipePagination(activeRegs, tableBody, (pageList) => {
      tableBody.innerHTML = renderRows(pageList);
    }, 10);

    document.getElementById('btn-refresh-requests')?.addEventListener('click', () => {
      renderStudentRequests(container);
    });

    // Gắn sự kiện nút Hủy KH
    let selectedRegId = null;
    const cancelModal = document.getElementById('cancel-reg-modal');

    tableBody.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-cancel-reg');
      if (!btn) return;
      selectedRegId = btn.getAttribute('data-id');
      const name = btn.getAttribute('data-name') || 'học viên này';
      document.getElementById('cancel-student-name').textContent = name;
      document.getElementById('cancel-refund-amount').value = '0';
      document.getElementById('cancel-reason').value = '';
      cancelModal.classList.remove('hidden');
    });

    document.getElementById('close-cancel-modal').addEventListener('click', () => {
      cancelModal.classList.add('hidden');
    });
    document.getElementById('btn-cancel-cancel-reg').addEventListener('click', () => {
      cancelModal.classList.add('hidden');
    });
    cancelModal.addEventListener('click', (e) => {
      if (e.target === cancelModal) cancelModal.classList.add('hidden');
    });

    document.getElementById('cancel-reg-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!selectedRegId) return;

      const submitBtn = e.target.querySelector('[type=submit]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="material-symbols-outlined text-[15px] animate-spin">progress_activity</span> Đang xử lý...`;

      const refundAmount = parseFloat(document.getElementById('cancel-refund-amount').value);
      const reason = document.getElementById('cancel-reason').value.trim();

      // Validate
      if (isNaN(refundAmount) || refundAmount < 0) {
        showToast('Số tiền hoàn trả không hợp lệ', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span class="material-symbols-outlined text-[15px]">delete_forever</span> Xác nhận hủy`;
        return;
      }
      if (!reason) {
        document.getElementById('cancel-reason').classList.add('border-red-500', 'bg-red-50');
        showToast('Vui lòng nhập lý do hủy khóa học', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span class="material-symbols-outlined text-[15px]">delete_forever</span> Xác nhận hủy`;
        return;
      }
      document.getElementById('cancel-reason').classList.remove('border-red-500', 'bg-red-50');

      const payload = {
        so_tien_hoan: refundAmount,
        ly_do_huy: reason
      };

      try {
        const res = await fetch(`${API_BASE}/registrations/${selectedRegId}/cancel`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Role': 'admin'
          },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (result.success) {
          showToast('Đã hủy đăng ký khóa học thành công!', 'success');
          cancelModal.classList.add('hidden');
          renderStudentRequests(container); // Reload
        } else {
          showToast(result.error || 'Có lỗi xảy ra khi hủy khóa học', 'error');
        }
      } catch (err) {
        showToast('Lỗi kết nối máy chủ', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span class="material-symbols-outlined text-[15px]">delete_forever</span> Xác nhận hủy`;
      }
    });

  } catch (err) {
    container.innerHTML = `
      <div class="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-xs">
        <strong>Lỗi tải dữ liệu:</strong> ${err.message}
      </div>
    `;
  }
}
