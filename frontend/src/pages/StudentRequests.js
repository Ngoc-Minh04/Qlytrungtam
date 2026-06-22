// StudentRequests.js - Xử lý Yêu cầu (Hủy khóa học + Đặt lịch)
import { API_BASE, showToast, setupSwipePagination, formatCurrencyInput, parseCurrencyInput } from './_shared.js';

let _activeTab = 'cancellations';

export async function renderStudentRequests(container) {
  _activeTab = _activeTab || 'cancellations';
  renderTabShell(container);
  if (_activeTab === 'cancellations') {
    await loadCancellationsTab(container);
  } else {
    await loadBookingTab(container);
  }
}

function renderTabShell(container) {
  container.innerHTML = `
    <div class="space-y-5">
      <!-- Tab Switcher -->
      <div class="flex gap-1 bg-[#f3f3f5] rounded-2xl p-1 w-fit">
        <button id="tab-cancellations" data-tab="cancellations"
          class="tab-btn px-4 py-2 rounded-xl text-xs font-semibold transition-all ${_activeTab === 'cancellations' ? 'bg-white text-apple-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}">
          <span class="material-symbols-outlined text-[14px] align-middle mr-1">cancel</span>Hủy khóa học
        </button>
        <button id="tab-bookings" data-tab="bookings"
          class="tab-btn px-4 py-2 rounded-xl text-xs font-semibold transition-all ${_activeTab === 'bookings' ? 'bg-white text-apple-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}">
          <span class="material-symbols-outlined text-[14px] align-middle mr-1">calendar_add_on</span>Yêu cầu đặt lịch
        </button>
      </div>
      <!-- Content -->
      <div id="tab-content">
        <div class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-apple-blue"></div>
        </div>
      </div>
    </div>
  `;

  // Tab switch events
  container.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      _activeTab = btn.dataset.tab;
      container.querySelectorAll('.tab-btn').forEach(b => {
        const active = b.dataset.tab === _activeTab;
        b.className = `tab-btn px-4 py-2 rounded-xl text-xs font-semibold transition-all ${active ? 'bg-white text-apple-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`;
      });
      if (_activeTab === 'cancellations') {
        await loadCancellationsTab(container);
      } else {
        await loadBookingTab(container);
      }
    });
  });
}

// ==================== TAB HỦY KHÓA HỌC ====================
async function loadCancellationsTab(container) {
  const tabContent = container.querySelector('#tab-content');
  tabContent.innerHTML = `<div class="flex justify-center items-center py-12"><div class="animate-spin rounded-full h-6 w-6 border-b-2 border-apple-blue"></div></div>`;

  try {
    const res = await fetch(`${API_BASE}/registrations`, {
      headers: { 'X-User-Role': 'admin' }
    });
    const result = await res.json();
    const allRegs = result.data || [];
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
        const typeBadge = r.loai_goi === 'hoc_kem' 
          ? `<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200/50 uppercase ml-1">Kèm 1-1</span>` 
          : `<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-apple-blue border border-blue-200/50 uppercase ml-1">Đại trà</span>`;
        return `
          <tr class="hover:bg-slate-50 border-b border-apple-divider/40 text-xs transition group">
            <td class="px-5 py-3.5">
              <div class="font-bold text-apple-ink flex items-center gap-1">
                ${r.ho_ten || '—'}
                ${typeBadge}
              </div>
              <div class="text-[10px] text-slate-400 mt-0.5">ID: ${r.ho_so_id} · Gói: ${r.ten_goi || '—'}</div>
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
                data-id="${r.id}" data-type="${r.loai_goi}" data-name="${r.ho_ten || ''}">
                Hủy KH
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }

    tabContent.innerHTML = `
      <div class="space-y-5">
        <!-- Stats -->
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
              Danh sách đăng ký đang hoạt động
            </h3>
            <div class="flex items-center gap-2">
              <button id="btn-refresh-cancel" class="flex items-center justify-center gap-1.5 px-3 py-1 border border-[#e2e2e4] hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-full transition-all active:scale-95 shadow-sm h-[32px]">
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
              <tbody id="cancellations-table-body"></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- MODAL HỦY KHÓA HỌC -->
      <div id="cancel-reg-modal" class="fixed inset-0 bg-black/45 backdrop-blur-md z-50 flex items-center justify-center p-4 hidden">
        <div class="bg-white rounded-3xl max-w-md w-full border border-[#e2e2e4] shadow-2xl overflow-hidden" style="animation: modalIn 0.2s ease">
          <div class="flex items-center justify-between px-6 py-4 border-b border-[#f3f3f5]">
            <h3 class="text-sm font-bold text-[#1a1c1d] flex items-center gap-2">
              <span class="material-symbols-outlined text-red-500 text-[20px]">cancel</span>
              Hủy đăng ký khóa học
            </h3>
            <button id="close-cancel-modal" class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <form id="cancel-reg-form" class="p-6 space-y-4 text-xs">
            <div class="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
              <span class="material-symbols-outlined text-red-500 text-[20px]">warning</span>
              <p class="text-red-700 font-medium text-[11px]">Hành động này sẽ hủy khóa học của học viên <strong id="cancel-student-name" class="font-extrabold">—</strong>. Không thể hoàn tác.</p>
            </div>
            <div class="space-y-1">
              <label class="block font-semibold text-slate-600">Số tiền hoàn trả (VNĐ)</label>
              <input type="text" id="cancel-refund-amount" placeholder="0"
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
        @keyframes modalIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      </style>
    `;

    const tableBody = tabContent.querySelector('#cancellations-table-body');
    setupSwipePagination(activeRegs, tableBody, (pageList) => {
      tableBody.innerHTML = renderRows(pageList);
    }, 10);

    tabContent.querySelector('#btn-refresh-cancel')?.addEventListener('click', () => {
      loadCancellationsTab(container);
    });

    let selectedRegId = null;
    let selectedRegType = 'dai_tra';
    const cancelModal = tabContent.querySelector('#cancel-reg-modal');

    tableBody.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-cancel-reg');
      if (!btn) return;
      selectedRegId = btn.getAttribute('data-id');
      selectedRegType = btn.getAttribute('data-type') || 'dai_tra';
      const name = btn.getAttribute('data-name') || '';
      document.getElementById('cancel-student-name').textContent = name;
      
      // Tìm registration tương ứng để tính số tiền hoàn trả gợi ý tự động
      const reg = activeRegs.find(r => r.id == selectedRegId && r.loai_goi === selectedRegType);
      let suggestRefund = 0;
      if (reg) {
        const daThu = reg.so_tien_da_thu || 0;
        const giaThucTe = reg.gia_thuc_te || 0;
        const tongBuoi = reg.so_buoi_dang_ky || 0;
        const daHoc = reg.so_buoi_da_hoc || 0;

        if (tongBuoi > 0) {
          const donGiaBuoi = giaThucTe / tongBuoi;
          const tienDaHoc = daHoc * donGiaBuoi;
          suggestRefund = Math.max(0, Math.round(daThu - tienDaHoc));
        } else {
          suggestRefund = daThu;
        }
      }
      document.getElementById('cancel-refund-amount').value = formatCurrencyInput(String(suggestRefund));
      document.getElementById('cancel-reason').value = '';
      cancelModal.classList.remove('hidden');
    });

    // Thêm listener format cho ô nhập số tiền hoàn trả
    tabContent.querySelector('#cancel-refund-amount')?.addEventListener('input', (e) => {
      e.target.value = formatCurrencyInput(e.target.value);
    });

    tabContent.querySelector('#close-cancel-modal').addEventListener('click', () => cancelModal.classList.add('hidden'));
    tabContent.querySelector('#btn-cancel-cancel-reg').addEventListener('click', () => cancelModal.classList.add('hidden'));
    cancelModal.addEventListener('click', (e) => { if (e.target === cancelModal) cancelModal.classList.add('hidden'); });

    tabContent.querySelector('#cancel-reg-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!selectedRegId) return;
      const submitBtn = e.target.querySelector('[type=submit]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="material-symbols-outlined text-[15px] animate-spin">progress_activity</span> Đang xử lý...`;

      const refundAmount = parseCurrencyInput(document.getElementById('cancel-refund-amount').value);
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

      const cancelUrl = selectedRegType === 'hoc_kem'
        ? `${API_BASE}/registrations/tutoring/${selectedRegId}/cancel`
        : `${API_BASE}/registrations/${selectedRegId}/cancel`;

      try {
        const res = await fetch(cancelUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'X-User-Role': 'admin' },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (result.success) {
          showToast('Đã hủy đăng ký khóa học thành công!', 'success');
          cancelModal.classList.add('hidden');
          await loadCancellationsTab(container);
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
    tabContent.innerHTML = `<div class="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-xs"><strong>Lỗi tải dữ liệu:</strong> ${err.message}</div>`;
  }
}

// ==================== TAB ĐẶT LỊCH ====================
async function loadBookingTab(container) {
  const tabContent = container.querySelector('#tab-content');
  tabContent.innerHTML = `<div class="flex justify-center items-center py-12"><div class="animate-spin rounded-full h-6 w-6 border-b-2 border-apple-blue"></div></div>`;

  try {
    const res = await fetch(`${API_BASE}/booking-requests`, {
      headers: { 'X-User-Role': 'admin' }
    });
    const result = await res.json();
    const bookings = result.data || [];

    const pending = bookings.filter(b => b.trang_thai === 'cho_duyet');
    const approved = bookings.filter(b => b.trang_thai === 'da_duyet');
    const rejected = bookings.filter(b => b.trang_thai === 'tu_choi');

    function statusBadge(ts) {
      if (ts === 'cho_duyet') return `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">Chờ duyệt</span>`;
      if (ts === 'da_duyet') return `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Đã duyệt</span>`;
      if (ts === 'tu_choi') return `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-600">Từ chối</span>`;
      return `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">${ts}</span>`;
    }

    function renderBookingRows(list) {
      if (list.length === 0) {
        return `
          <tr>
            <td colspan="6" class="px-6 py-12 text-center">
              <div class="flex flex-col items-center gap-3 text-slate-400">
                <span class="material-symbols-outlined text-[36px] opacity-40">calendar_today</span>
                <span class="text-xs">Không có yêu cầu đặt lịch nào.</span>
              </div>
            </td>
          </tr>
        `;
      }
      return list.map(b => {
        const ngay = b.ngay_mong_muon ? new Date(b.ngay_mong_muon).toLocaleDateString('vi-VN') : '—';
        const gio = `${b.gio_bat_dau || '—'} → ${b.gio_ket_thuc || '—'}`;
        const ngayTao = b.ngay_tao ? new Date(b.ngay_tao).toLocaleDateString('vi-VN') : '—';
        return `
          <tr class="hover:bg-slate-50 border-b border-apple-divider/40 text-xs transition">
            <td class="px-5 py-3.5">
              <div class="font-bold text-apple-ink">${b.ten_hoc_vien || b.hoc_vien_ten || `HV #${b.hoc_vien_id}`}</div>
              <div class="text-[10px] text-slate-400 mt-0.5">Gửi lúc: ${ngayTao}</div>
            </td>
            <td class="px-5 py-3.5 text-slate-700 font-semibold">${b.ten_giao_vien || b.giao_vien_ten || `GV #${b.giao_vien_id}`}</td>
            <td class="px-5 py-3.5 text-slate-600">${ngay}</td>
            <td class="px-5 py-3.5 text-slate-600">${gio}</td>
            <td class="px-5 py-3.5">${statusBadge(b.trang_thai)}</td>
            <td class="px-5 py-3.5 text-right">
              ${b.trang_thai === 'cho_duyet' ? `
                <div class="flex justify-end gap-1.5">
                  <button class="btn-approve-booking px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-full text-[10.5px] font-semibold transition active:scale-95"
                    data-id="${b.id}" data-name="${b.ten_hoc_vien || ''}">
                    Duyệt
                  </button>
                  <button class="btn-reject-booking px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-full text-[10.5px] font-semibold transition active:scale-95"
                    data-id="${b.id}" data-name="${b.ten_hoc_vien || ''}">
                    Từ chối
                  </button>
                </div>
              ` : `<span class="text-[10px] text-slate-400">—</span>`}
            </td>
          </tr>
        `;
      }).join('');
    }

    tabContent.innerHTML = `
      <div class="space-y-5">
        <!-- Stats -->
        <div class="grid grid-cols-3 gap-3">
          <div class="bg-white rounded-2xl border border-[#e2e2e4] p-4 shadow-sm">
            <div class="flex items-center gap-2 mb-1">
              <span class="material-symbols-outlined text-amber-500 text-[18px]">pending</span>
              <span class="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wide">Chờ duyệt</span>
            </div>
            <div class="text-2xl font-extrabold text-apple-ink">${pending.length}</div>
          </div>
          <div class="bg-white rounded-2xl border border-[#e2e2e4] p-4 shadow-sm">
            <div class="flex items-center gap-2 mb-1">
              <span class="material-symbols-outlined text-emerald-500 text-[18px]">check_circle</span>
              <span class="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wide">Đã duyệt</span>
            </div>
            <div class="text-2xl font-extrabold text-apple-ink">${approved.length}</div>
          </div>
          <div class="bg-white rounded-2xl border border-[#e2e2e4] p-4 shadow-sm">
            <div class="flex items-center gap-2 mb-1">
              <span class="material-symbols-outlined text-red-500 text-[18px]">cancel</span>
              <span class="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wide">Từ chối</span>
            </div>
            <div class="text-2xl font-extrabold text-apple-ink">${rejected.length}</div>
          </div>
        </div>

        <!-- Table -->
        <div class="bg-white rounded-2xl border border-[#e2e2e4] overflow-hidden shadow-sm">
          <div class="px-5 py-4 border-b border-[#f3f3f5] flex items-center justify-between flex-wrap gap-2">
            <h3 class="font-bold text-apple-ink text-sm flex items-center gap-2">
              <span class="material-symbols-outlined text-apple-blue text-[18px]">calendar_add_on</span>
              Tất cả yêu cầu đặt lịch học
            </h3>
            <div class="flex items-center gap-2">
              <button id="btn-refresh-bookings" class="flex items-center justify-center gap-1.5 px-3 py-1 border border-[#e2e2e4] hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-full transition-all active:scale-95 shadow-sm h-[32px]">
                <span class="material-symbols-outlined text-[16px]">refresh</span>Tải lại
              </button>
              <span class="text-[10px] text-slate-400 bg-[#f3f3f5] px-3 py-1.5 rounded-full font-bold">${bookings.length} yêu cầu</span>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr class="bg-[#f3f3f5] text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-[#e2e2e4]">
                  <th class="px-5 py-3">HỌC VIÊN</th>
                  <th class="px-5 py-3">GIÁO VIÊN</th>
                  <th class="px-5 py-3">NGÀY MONG MUỐN</th>
                  <th class="px-5 py-3">GIỜ</th>
                  <th class="px-5 py-3">TRẠNG THÁI</th>
                  <th class="px-5 py-3 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody id="bookings-table-body">
                ${renderBookingRows(bookings)}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- MODAL TỪ CHỐI -->
      <div id="reject-booking-modal" class="fixed inset-0 bg-black/45 backdrop-blur-md z-50 flex items-center justify-center p-4 hidden">
        <div class="bg-white rounded-3xl max-w-md w-full border border-[#e2e2e4] shadow-2xl overflow-hidden" style="animation: modalIn 0.2s ease">
          <div class="flex items-center justify-between px-6 py-4 border-b border-[#f3f3f5]">
            <h3 class="text-sm font-bold text-[#1a1c1d] flex items-center gap-2">
              <span class="material-symbols-outlined text-red-500 text-[20px]">event_busy</span>
              Từ chối yêu cầu đặt lịch
            </h3>
            <button id="close-reject-modal" class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <form id="reject-booking-form" class="p-6 space-y-4 text-xs">
            <p class="text-slate-600 text-[11px]">Từ chối yêu cầu của học viên <strong id="reject-student-name">—</strong>. Học viên sẽ nhận được thông báo.</p>
            <div class="space-y-1">
              <label class="block font-semibold text-slate-600">Lý do từ chối</label>
              <textarea id="reject-reason" rows="3" placeholder="Nhập lý do từ chối (tùy chọn)..."
                class="w-full border border-[#e2e2e4] rounded-xl px-3.5 py-2.5 outline-none focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/10 transition bg-[#fafafa] resize-none"></textarea>
            </div>
            <div class="flex justify-end gap-2 pt-2 border-t border-[#f3f3f5]">
              <button type="button" id="btn-close-reject"
                class="px-5 py-2.5 rounded-xl border border-[#e2e2e4] hover:bg-slate-50 text-slate-700 font-semibold transition active:scale-95">
                Hủy
              </button>
              <button type="submit"
                class="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition active:scale-95 shadow-sm">
                <span class="material-symbols-outlined text-[15px]">block</span>
                Xác nhận từ chối
              </button>
            </div>
          </form>
        </div>
      </div>
      <style>
        @keyframes modalIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      </style>
    `;

    tabContent.querySelector('#btn-refresh-bookings')?.addEventListener('click', () => {
      loadBookingTab(container);
    });

    // Duyệt yêu cầu
    const tableBody = tabContent.querySelector('#bookings-table-body');
    tableBody.addEventListener('click', async (e) => {
      const approveBtn = e.target.closest('.btn-approve-booking');
      if (approveBtn) {
        const id = approveBtn.dataset.id;
        const name = approveBtn.dataset.name || 'học viên';
        if (!confirm(`Duyệt yêu cầu đặt lịch của ${name}?`)) return;
        approveBtn.disabled = true;
        approveBtn.textContent = '...';
        try {
          const res = await fetch(`${API_BASE}/booking-requests/${id}/approve`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-User-Role': 'admin' },
            body: JSON.stringify({ trang_thai: 'da_duyet' })
          });
          const result = await res.json();
          if (result.success) {
            showToast('Đã duyệt yêu cầu đặt lịch!', 'success');
            await loadBookingTab(container);
          } else {
            showToast(result.error || 'Lỗi khi duyệt', 'error');
            approveBtn.disabled = false;
            approveBtn.textContent = 'Duyệt';
          }
        } catch {
          showToast('Lỗi kết nối máy chủ', 'error');
          approveBtn.disabled = false;
          approveBtn.textContent = 'Duyệt';
        }
      }
    });

    // Từ chối — mở modal
    let rejectBookingId = null;
    const rejectModal = tabContent.querySelector('#reject-booking-modal');

    tableBody.addEventListener('click', (e) => {
      const rejectBtn = e.target.closest('.btn-reject-booking');
      if (!rejectBtn) return;
      rejectBookingId = rejectBtn.dataset.id;
      tabContent.querySelector('#reject-student-name').textContent = rejectBtn.dataset.name || 'học viên này';
      tabContent.querySelector('#reject-reason').value = '';
      rejectModal.classList.remove('hidden');
    });

    tabContent.querySelector('#close-reject-modal').addEventListener('click', () => rejectModal.classList.add('hidden'));
    tabContent.querySelector('#btn-close-reject').addEventListener('click', () => rejectModal.classList.add('hidden'));
    rejectModal.addEventListener('click', (e) => { if (e.target === rejectModal) rejectModal.classList.add('hidden'); });

    tabContent.querySelector('#reject-booking-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!rejectBookingId) return;
      const submitBtn = e.target.querySelector('[type=submit]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="material-symbols-outlined text-[15px] animate-spin">progress_activity</span> Đang xử lý...`;
      const lyDo = tabContent.querySelector('#reject-reason').value.trim() || 'Không phù hợp lịch';
      try {
        const res = await fetch(`${API_BASE}/booking-requests/${rejectBookingId}/approve`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'X-User-Role': 'admin' },
          body: JSON.stringify({ trang_thai: 'tu_choi', ly_do: lyDo })
        });
        const result = await res.json();
        if (result.success) {
          showToast('Đã từ chối yêu cầu đặt lịch.', 'success');
          rejectModal.classList.add('hidden');
          await loadBookingTab(container);
        } else {
          showToast(result.error || 'Lỗi khi từ chối', 'error');
        }
      } catch {
        showToast('Lỗi kết nối máy chủ', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span class="material-symbols-outlined text-[15px]">block</span> Xác nhận từ chối`;
      }
    });

  } catch (err) {
    tabContent.innerHTML = `<div class="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-xs"><strong>Lỗi tải dữ liệu:</strong> ${err.message}</div>`;
  }
}
