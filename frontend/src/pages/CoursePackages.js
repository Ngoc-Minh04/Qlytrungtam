// CoursePackages.js - Gói học phí / Khóa học đại trà (CRUD + Card So Sánh Ngang)
import { API_BASE, showToast } from './_shared.js';

export async function renderCoursePackages(container) {
  container.innerHTML = `
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-apple-blue"></div>
    </div>
  `;

  try {
    const res = await fetch(`${API_BASE}/course-packages`);
    const result = await res.json();
    const packages = result.data || [];
    const role = localStorage.getItem('userRole') || 'admin';

    // Tạo HTML các cột so sánh ngang premium
    const comparisonsHtml = packages.map(p => `
      <div class="bg-white rounded-3xl p-6 border border-apple-divider/50 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-1">
        <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-apple-blue to-[#0071e3]"></div>
        <div class="space-y-4">
          <div class="flex justify-between items-start">
            <h4 class="font-bold text-apple-ink text-base tracking-tight">${p.ten_goi}</h4>
            <span class="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-50 text-apple-blue uppercase">Đại trà</span>
          </div>
          <p class="text-xs text-slate-500 leading-relaxed min-h-[48px]">${p.mo_ta || 'Chưa cập nhật mô tả.'}</p>
          <div class="border-t border-slate-100 pt-3">
            <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Thời hạn</div>
            <div class="text-sm font-extrabold text-apple-ink mt-0.5">${p.so_thang} tháng</div>
          </div>
        </div>
        <div class="pt-6 mt-6 border-t border-slate-100 flex flex-col gap-4">
          <div class="flex flex-col">
            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Học phí trọn gói</span>
            <span class="text-xl font-extrabold text-apple-blue mt-0.5">${p.gia.toLocaleString('vi-VN')} VNĐ</span>
          </div>
          ${role === 'admin' || role === 'le_tan' ? `
            <div class="flex gap-2">
              <button class="btn-edit-pkg flex-1 py-1.5 border border-[#e2e2e4] hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs transition active:scale-95 flex items-center justify-center gap-1" data-id="${p.id}">
                <span class="material-symbols-outlined text-[14px]">edit</span>Sửa
              </button>
              <button class="btn-delete-pkg py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl text-xs transition active:scale-95 flex items-center justify-center" data-id="${p.id}">
                <span class="material-symbols-outlined text-[14px]">delete</span>
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <div id="course-packages-wrapper" class="space-y-6">
        <div class="flex justify-between items-center gap-2 flex-wrap">
          <div class="flex items-center gap-2">
            <!-- Nút Refresh đồng bộ kích thước -->
            <button id="btn-refresh-course-packages" class="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#e2e2e4] hover:bg-slate-50 text-slate-700 text-xs font-semibold transition active:scale-95 shadow-sm h-[32px]">
              <span class="material-symbols-outlined text-[16px]">refresh</span>Tải lại
            </button>
            ${role === 'admin' || role === 'le_tan' ? `
              <button id="btn-open-create-pkg" class="flex items-center gap-1 px-4 py-2 rounded-full bg-apple-blue text-white text-xs font-semibold hover:opacity-90 transition active:scale-95 shadow-sm h-[32px]">
                <span class="material-symbols-outlined text-[16px]">add</span>Thêm gói học
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Bảng so sánh ngang Gói học -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${comparisonsHtml}
          ${packages.length === 0 ? `
            <div class="col-span-full bg-white rounded-2xl border border-apple-divider p-12 text-center text-slate-400 text-xs">
              <span class="material-symbols-outlined text-[36px] block opacity-40 mb-2">inventory_2</span>
              Chưa có gói học phí nào được tạo.
            </div>
          ` : ''}
        </div>
      </div>

      <!-- MODAL THÊM / SỬA GÓI HỌC PHÍ -->
      <div id="pkg-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-[#e2e2e4] shadow-xl">
          <div class="flex justify-between items-center pb-3 border-b border-[#f3f3f5]">
            <h3 id="modal-title" class="text-sm font-bold text-[#1a1c1d] flex items-center gap-2">
              <span class="material-symbols-outlined text-apple-blue text-[20px]">inventory_2</span>
              Thêm gói học phí mới
            </h3>
            <button id="btn-close-modal" class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <form id="pkg-form" class="space-y-4 text-xs">
            <div>
              <label class="block font-semibold text-slate-600 mb-1.5">Tên gói học phí <span class="text-rose-500 font-bold">*</span></label>
              <input type="text" id="pkg-name" placeholder="Ví dụ: Anh văn giao tiếp 3 tháng..." class="w-full border border-[#e2e2e4] rounded-xl px-3.5 py-2.5 outline-none focus:border-apple-blue transition bg-[#fafafa]">
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1.5">Mô tả chi tiết <span class="text-rose-500 font-bold">*</span></label>
              <textarea id="pkg-desc" rows="3" placeholder="Nhập mô tả về quyền lợi, số buổi..." class="w-full border border-[#e2e2e4] rounded-xl px-3.5 py-2.5 outline-none focus:border-apple-blue transition bg-[#fafafa] resize-none"></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block font-semibold text-slate-600 mb-1.5">Thời hạn (tháng) <span class="text-rose-500 font-bold">*</span></label>
                <input type="number" id="pkg-months" min="1" max="60" value="1" class="w-full border border-[#e2e2e4] rounded-xl px-3.5 py-2.5 outline-none focus:border-apple-blue transition bg-[#fafafa]">
              </div>
              <div>
                <label class="block font-semibold text-slate-600 mb-1.5">Giá tiền (VNĐ) <span class="text-rose-500 font-bold">*</span></label>
                <input type="number" id="pkg-price" min="0" placeholder="0" class="w-full border border-[#e2e2e4] rounded-xl px-3.5 py-2.5 outline-none focus:border-apple-blue transition bg-[#fafafa]">
              </div>
            </div>
            <div class="flex justify-end gap-2 pt-4 border-t border-[#f3f3f5]">
              <button type="button" id="btn-cancel-modal" class="px-5 py-2.5 rounded-xl border border-[#e2e2e4] hover:bg-slate-50 text-slate-700 font-semibold transition active:scale-95">Hủy bỏ</button>
              <button type="submit" class="px-7 py-2.5 rounded-xl bg-apple-blue hover:opacity-90 text-white font-semibold transition active:scale-95 shadow-sm">Lưu gói học</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Sự kiện quản lý Modal
    const modal = document.getElementById('pkg-modal');
    const form = document.getElementById('pkg-form');
    const titleEl = document.getElementById('modal-title');
    let editingId = null;

    document.getElementById('btn-open-create-pkg')?.addEventListener('click', () => {
      editingId = null;
      titleEl.innerHTML = `<span class="material-symbols-outlined text-apple-blue text-[20px]">inventory_2</span> Thêm gói học phí mới`;
      form.reset();
      modal.classList.remove('hidden');
    });

    document.getElementById('btn-refresh-course-packages')?.addEventListener('click', () => {
      renderCoursePackages(container);
    });

    const closeModal = () => modal.classList.add('hidden');
    document.getElementById('btn-close-modal')?.addEventListener('click', closeModal);
    document.getElementById('btn-cancel-modal')?.addEventListener('click', closeModal);

    // Gắn sự kiện sửa/xóa trên Card qua wrapper động để tránh lặp listener
    container.querySelector('#course-packages-wrapper')?.addEventListener('click', async (e) => {
      const btnEdit = e.target.closest('.btn-edit-pkg');
      const btnDel = e.target.closest('.btn-delete-pkg');

      if (btnEdit) {
        const id = btnEdit.getAttribute('data-id');
        const pkg = packages.find(p => p.id == id);
        if (pkg) {
          editingId = id;
          titleEl.innerHTML = `<span class="material-symbols-outlined text-apple-blue text-[20px]">edit</span> Chỉnh sửa gói học phí`;
          document.getElementById('pkg-name').value = pkg.ten_goi;
          document.getElementById('pkg-desc').value = pkg.mo_ta || '';
          document.getElementById('pkg-months').value = pkg.so_thang;
          document.getElementById('pkg-price').value = pkg.gia;
          modal.classList.remove('hidden');
        }
      }

      if (btnDel) {
        const id = btnDel.getAttribute('data-id');
        if (confirm('Bạn có chắc chắn muốn xóa gói học phí này?')) {
          try {
            const delRes = await fetch(`${API_BASE}/course-packages/${id}`, {
              method: 'DELETE',
              headers: { 'X-User-Role': role }
            });
            const resultJson = await delRes.json();
            if (resultJson.success) {
              showToast('Xóa gói học phí thành công!');
              renderCoursePackages(container);
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
        { id: 'pkg-name', label: 'Tên gói học phí' },
        { id: 'pkg-desc', label: 'Mô tả chi tiết' },
        { id: 'pkg-months', label: 'Thời hạn' },
        { id: 'pkg-price', label: 'Giá tiền' }
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

      const payload = {
        ten_goi: document.getElementById('pkg-name').value.trim(),
        mo_ta: document.getElementById('pkg-desc').value.trim(),
        so_thang: parseInt(document.getElementById('pkg-months').value),
        gia: parseFloat(document.getElementById('pkg-price').value)
      };

      try {
        const url = editingId ? `${API_BASE}/course-packages/${editingId}` : `${API_BASE}/course-packages`;
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
          showToast(editingId ? 'Cập nhật gói học phí thành công!' : 'Tạo gói học phí mới thành công!');
          modal.classList.add('hidden');
          renderCoursePackages(container);
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
