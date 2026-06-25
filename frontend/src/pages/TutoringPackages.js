// TutoringPackages.js - Gói học kèm 1-1 / 1-2 (CRUD + So Sánh Ngang)
import { API_BASE, showToast, formatCurrencyInput, parseCurrencyInput } from './_shared.js';

export async function renderTutoringPackages(container) {
  container.innerHTML = `
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-apple-blue"></div>
    </div>
  `;

  try {
    const res = await fetch(`${API_BASE}/tutoring-packages`);
    const result = await res.json();
    const packages = result.data || [];
    const role = localStorage.getItem('userRole') || 'admin';

    // Tạo HTML các cột so sánh ngang premium
    const comparisonsHtml = packages.map(p => `
      <div class="bg-white rounded-2xl p-5 pt-6 border border-slate-100 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
        <!-- Emerald glow top line -->
        <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-[#10b981]/80"></div>
        
        <div class="space-y-3 mt-1.5">
          <div class="flex justify-between items-start gap-2">
            <h4 class="font-bold text-slate-800 text-xs tracking-tight leading-tight select-none">${p.ten_goi}</h4>
            <span class="px-2 py-0.5 rounded-full text-[8px] font-extrabold bg-emerald-50 text-emerald-600 uppercase tracking-wider shrink-0 select-none">Học kèm</span>
          </div>
          <p class="text-[10.5px] text-slate-450 leading-relaxed min-h-[40px]">${p.mo_ta || 'Chưa cập nhật mô tả.'}</p>
          <div class="border-t border-slate-50 pt-3 flex justify-between">
            <div>
              <div class="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Số buổi học</div>
              <div class="text-[11px] font-black text-slate-700 mt-1">${p.so_buoi} buổi</div>
            </div>
            <div class="text-right">
              <div class="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Thời hạn</div>
              <div class="text-[11px] font-black text-slate-700 mt-1">${p.so_thang !== null && p.so_thang !== undefined ? p.so_thang + ' tháng' : 'Không giới hạn'}</div>
            </div>
          </div>
        </div>
        
        <div class="pt-3 mt-3 border-t border-slate-50 flex flex-col gap-3">
          <div class="flex flex-col">
            <span class="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Học phí trọn gói</span>
            <span class="text-sm font-extrabold text-emerald-600 mt-0.5 tracking-tight">${p.gia.toLocaleString('vi-VN')} VNĐ</span>
          </div>
          ${role === 'admin' || role === 'le_tan' ? `
            <div class="flex gap-1.5 mt-1">
              <button class="btn-edit-tutor-pkg flex-1 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-full text-[11px] transition active:scale-95 flex items-center justify-center gap-0.5" data-id="${p.id}">
                <span class="material-symbols-outlined text-[13px]">edit</span>Sửa
              </button>
              <button class="btn-delete-tutor-pkg py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold rounded-full text-[11px] transition active:scale-95 flex items-center justify-center" data-id="${p.id}">
                <span class="material-symbols-outlined text-[13px]">delete</span>
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <div id="tutoring-packages-wrapper" class="space-y-6">
        <div class="flex justify-between items-center gap-2 flex-wrap">
          <h3 class="font-bold text-slate-800 text-sm tracking-wide">Gói học kèm 1-1</h3>
          <div class="flex items-center gap-2">
            <!-- Nút Refresh đồng bộ kích thước -->
            <button id="btn-refresh-tutoring-packages" class="flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition active:scale-95 shadow-sm h-[32px]">
              <span class="material-symbols-outlined text-[16px]">refresh</span>Tải lại
            </button>
            ${role === 'admin' || role === 'le_tan' ? `
              <button id="btn-open-create-tutor-pkg" class="flex items-center gap-1 px-4 py-2 rounded-full bg-apple-blue text-white text-xs font-semibold hover:opacity-90 transition active:scale-95 shadow-sm h-[32px]">
                <span class="material-symbols-outlined text-[16px]">add</span>Thêm gói học kèm
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Bảng so sánh ngang Gói học -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          ${comparisonsHtml}
          ${packages.length === 0 ? `
            <div class="col-span-full bg-white rounded-2xl border border-slate-100 p-16 text-center text-slate-400 text-xs">
              <span class="material-symbols-outlined text-[36px] block opacity-40 mb-2">inventory_2</span>
              Chưa có gói học kèm nào được tạo.
            </div>
          ` : ''}
        </div>
      </div>

      <!-- MODAL THÊM / SỬA GÓI HỌC KÈM -->
      <div id="tutor-pkg-modal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center hidden p-4 animate-fadeIn">
        <div class="bg-white rounded-[28px] max-w-md w-full p-6 space-y-4 border border-slate-100 shadow-2xl" style="animation: modalIn 0.2s ease">
          <div class="flex justify-between items-center pb-3 border-b border-slate-50">
            <h3 id="tutor-modal-title" class="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span class="material-symbols-outlined text-apple-blue text-[20px]">inventory_2</span>
              Thêm gói học kèm mới
            </h3>
            <button id="btn-close-tutor-modal" class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <form id="tutor-pkg-form" class="space-y-4 text-xs">
            <div>
              <label class="block font-semibold text-slate-500 mb-1.5">Tên gói học kèm <span class="text-rose-500 font-bold">*</span></label>
              <input type="text" id="tutor-pkg-name" placeholder="Ví dụ: Gói học kèm 10 buổi..." class="w-full border border-slate-200 rounded-full px-4 py-2.5 outline-none focus:border-apple-blue transition bg-slate-50/50">
            </div>
            <div>
              <label class="block font-semibold text-slate-500 mb-1.5">Mô tả chi tiết <span class="text-rose-500 font-bold">*</span></label>
              <textarea id="tutor-pkg-desc" rows="3" placeholder="Nhập mô tả về quyền lợi, cam kết..." class="w-full border border-slate-200 rounded-[18px] px-4 py-2.5 outline-none focus:border-apple-blue transition bg-slate-50/50 resize-none"></textarea>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block font-semibold text-slate-500 mb-1.5">Số buổi <span class="text-rose-500 font-bold">*</span></label>
                <input type="number" id="tutor-pkg-sessions" min="1" value="10" class="w-full border border-slate-200 rounded-full px-4 py-2.5 outline-none focus:border-apple-blue transition bg-slate-50/50">
              </div>
              <div>
                <label class="block font-semibold text-slate-500 mb-1.5">Thời hạn (tháng)</label>
                <input type="number" id="tutor-pkg-months" placeholder="Không giới hạn" class="w-full border border-slate-200 rounded-full px-4 py-2.5 outline-none focus:border-apple-blue transition bg-slate-50/50">
              </div>
              <div>
                <label class="block font-semibold text-slate-500 mb-1.5">Giá tiền (VNĐ) <span class="text-rose-500 font-bold">*</span></label>
                <input type="text" id="tutor-pkg-price" placeholder="0" class="w-full border border-slate-200 rounded-full px-4 py-2.5 outline-none focus:border-apple-blue transition bg-slate-50/50">
              </div>
            </div>
            <div class="flex justify-end gap-2 pt-4 border-t border-slate-50">
              <button type="button" id="btn-cancel-tutor-modal" class="px-5 py-2.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition active:scale-95">Hủy bỏ</button>
              <button type="submit" class="px-7 py-2.5 rounded-full bg-apple-blue hover:opacity-90 text-white font-semibold transition active:scale-95 shadow-sm">Lưu gói học</button>
            </div>
          </form>
        </div>
      </div>
      <style>
        @keyframes modalIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      </style>
    `;

    // Sự kiện quản lý Modal
    const modal = document.getElementById('tutor-pkg-modal');
    const form = document.getElementById('tutor-pkg-form');
    const titleEl = document.getElementById('tutor-modal-title');
    let editingId = null;

    document.getElementById('btn-open-create-tutor-pkg')?.addEventListener('click', () => {
      editingId = null;
      titleEl.innerHTML = `<span class="material-symbols-outlined text-apple-blue text-[20px]">inventory_2</span> Thêm gói học kèm mới`;
      form.reset();
      modal.classList.remove('hidden');
    });

    document.getElementById('btn-close-tutor-modal')?.addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    document.getElementById('btn-cancel-tutor-modal')?.addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    document.getElementById('btn-refresh-tutoring-packages')?.addEventListener('click', () => {
      renderTutoringPackages(container);
    });

    // Thêm listener format cho ô nhập giá tiền
    const priceInputEl = document.getElementById('tutor-pkg-price');
    priceInputEl?.addEventListener('input', (e) => {
      e.target.value = formatCurrencyInput(e.target.value);
    });

    // Gắn sự kiện sửa/xóa trên wrapper tĩnh
    document.getElementById('tutoring-packages-wrapper')?.addEventListener('click', async (e) => {
      const btnEdit = e.target.closest('.btn-edit-tutor-pkg');
      const btnDel = e.target.closest('.btn-delete-tutor-pkg');

      if (btnEdit) {
        const id = btnEdit.getAttribute('data-id');
        const pkg = packages.find(p => p.id == id);
        if (pkg) {
          editingId = id;
          titleEl.innerHTML = `<span class="material-symbols-outlined text-apple-blue text-[20px]">edit</span> Chỉnh sửa gói học kèm`;
          document.getElementById('tutor-pkg-name').value = pkg.ten_goi;
          document.getElementById('tutor-pkg-desc').value = pkg.mo_ta || '';
          document.getElementById('tutor-pkg-sessions').value = pkg.so_buoi;
          document.getElementById('tutor-pkg-months').value = pkg.so_thang !== null && pkg.so_thang !== undefined ? pkg.so_thang : '';
          document.getElementById('tutor-pkg-price').value = formatCurrencyInput(String(pkg.gia));
          modal.classList.remove('hidden');
        }
      }

      if (btnDel) {
        const id = btnDel.getAttribute('data-id');
        if (confirm('Bạn có chắc chắn muốn xóa gói học kèm này?')) {
          try {
            const delRes = await fetch(`${API_BASE}/tutoring-packages/${id}`, {
              method: 'DELETE',
              headers: { 'X-User-Role': role }
            });
            const resultJson = await delRes.json();
            if (resultJson.success) {
              showToast('Xóa gói học kèm thành công!');
              renderTutoringPackages(container);
            } else {
              showToast(resultJson.error, 'error');
            }
          } catch (err) {
            showToast('Lỗi máy chủ khi xóa', 'error');
          }
        }
      }
    });

    // Form Submit (Tạo mới / Cập nhật)
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const fields = [
        { id: 'tutor-pkg-name', label: 'Tên gói học kèm' },
        { id: 'tutor-pkg-desc', label: 'Mô tả chi tiết' },
        { id: 'tutor-pkg-sessions', label: 'Số buổi học' },
        { id: 'tutor-pkg-price', label: 'Giá tiền' }
      ];

      let hasError = false;
      fields.forEach(f => {
        const input = document.getElementById(f.id);
        if (!input.value || input.value.trim() === '') {
          input.classList.add('border-red-500', 'bg-red-50');
          if (!hasError) {
            showToast(`Vui lòng điền trường bắt buộc: ${f.label}`, 'error');
            input.focus();
            hasError = true;
          }
        } else {
          input.classList.remove('border-red-500', 'bg-red-50');
        }
      });

      if (hasError) return;

      const monthsVal = document.getElementById('tutor-pkg-months').value;
      const payload = {
        ten_goi: document.getElementById('tutor-pkg-name').value.trim(),
        mo_ta: document.getElementById('tutor-pkg-desc').value.trim(),
        loai_goi: 'theo_buoi',
        so_buoi: parseInt(document.getElementById('tutor-pkg-sessions').value),
        so_thang: monthsVal ? parseInt(monthsVal) : null,
        gia: parseCurrencyInput(document.getElementById('tutor-pkg-price').value)
      };

      try {
        const url = editingId ? `${API_BASE}/tutoring-packages/${editingId}` : `${API_BASE}/tutoring-packages`;
        const method = editingId ? 'PUT' : 'POST';

        const submitRes = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'X-User-Role': role
          },
          body: JSON.stringify(payload)
        });
        const resultJson = await submitRes.json();

        if (resultJson.success) {
          showToast(editingId ? 'Cập nhật gói học kèm thành công!' : 'Tạo gói học kèm mới thành công!');
          modal.classList.add('hidden');
          renderTutoringPackages(container);
        } else {
          showToast(resultJson.error || 'Có lỗi xảy ra', 'error');
        }
      } catch (err) {
        showToast('Lỗi kết nối máy chủ', 'error');
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
