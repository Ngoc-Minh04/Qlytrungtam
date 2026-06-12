// CenterRules.js - Nội quy trung tâm (Phong cách premium Apple UI + CRUD cho Admin/Lễ tân)
import { API_BASE, showToast } from './_shared.js';

export async function renderCenterRules(container) {
  const userRole = localStorage.getItem('userRole') || 'hoc_vien';
  const isAdminOrStaff = ['admin', 'le_tan'].includes(userRole);

  container.innerHTML = `
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0066cc]"></div>
    </div>
  `;

  async function loadRules() {
    try {
      const res = await fetch(`${API_BASE}/rules`, {
        headers: { 'x-user-role': userRole }
      });
      const result = await res.json();
      const rules = result.data || [];

      container.innerHTML = `
        <div class="space-y-6 max-w-4xl mx-auto">
          <!-- Header Area -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-5 border border-[#e2e2e4] shadow-sm">
            <div>
              <h2 class="text-lg font-bold text-[#1d1d1f] tracking-tight">Nội Quy Trung Tâm</h2>
              <p class="text-xs text-slate-500 mt-1">Nội quy & quy định chính thức dành cho học viên, giáo viên và nhân viên Stellar Academy</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <!-- Nút Refresh đồng bộ kích thước -->
              <button id="btn-refresh-rules" class="flex items-center justify-center gap-1.5 px-4 py-2 border border-[#e2e2e4] hover:bg-[#f3f3f5] text-[#1d1d1f] rounded-full transition-all active:scale-95 text-[12.5px] font-semibold h-[36px]">
                <span class="material-symbols-outlined text-[17px]">refresh</span>
                <span>Tải lại</span>
              </button>
              ${isAdminOrStaff ? `
                <button id="btn-add-rule" class="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#0066cc] hover:bg-[#004e9f] text-white rounded-full transition-all active:scale-95 text-[12.5px] font-semibold h-[36px]">
                  <span class="material-symbols-outlined text-[17px]">add</span>
                  <span>Thêm nội quy</span>
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Content List -->
          <div class="bg-white rounded-2xl p-6 border border-[#e2e2e4] shadow-sm space-y-4">
            <h3 class="font-bold text-[#1d1d1f] text-sm border-b border-[#f3f3f5] pb-3 uppercase tracking-wider">Danh mục nội quy hiện hành</h3>
            <div class="space-y-6 divide-y divide-[#f3f3f5] pt-2 text-xs">
              ${rules.map((rule, idx) => `
                <div class="pt-5 ${idx === 0 ? 'pt-0' : ''} flex flex-col md:flex-row justify-between items-start gap-4">
                  <div class="space-y-2 flex-grow pr-4">
                    <div class="flex items-center gap-2 flex-wrap">
                      <h4 class="font-bold text-[#1d1d1f] text-[13.5px]">${idx + 1}. ${rule.tieu_de}</h4>
                      ${rule.is_active === 0 ? '<span class="bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded text-[9px] font-semibold">Tạm ẩn</span>' : ''}
                    </div>
                    <p class="text-slate-600 leading-relaxed text-[12px] whitespace-pre-wrap">${rule.noi_dung}</p>
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="inline-block text-[10px] bg-slate-100 text-slate-600 rounded-md px-2.5 py-1 capitalize font-semibold">Đối tượng: ${rule.ap_dung_cho}</span>
                      <span class="text-[10px] text-slate-400">Thứ tự: ${rule.thu_tu}</span>
                    </div>
                  </div>
                  ${isAdminOrStaff ? `
                    <div class="flex items-center gap-2 shrink-0 md:self-center">
                      <button class="btn-edit-rule p-2 text-slate-500 hover:text-[#0066cc] hover:bg-[#0066cc]/5 border border-[#e2e2e4] hover:border-[#0066cc]/30 rounded-full transition-all active:scale-95" data-id="${rule.id}" title="Chỉnh sửa">
                        <span class="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button class="btn-delete-rule p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 border border-[#e2e2e4] hover:border-red-200 rounded-full transition-all active:scale-95" data-id="${rule.id}" title="Xóa nội quy">
                        <span class="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  ` : ''}
                </div>
              `).join('')}
              ${rules.length === 0 ? '<p class="text-slate-500 py-12 text-center text-[13px]">Chưa có nội quy nào được cấu hình trên hệ thống.</p>' : ''}
            </div>
          </div>
        </div>

        <!-- MODAL THÊM / SỬA NỘI QUY -->
        <div id="rule-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4">
          <div class="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#e2e2e4] max-h-[90vh] overflow-y-auto shadow-xl flex flex-col">
            <div class="flex justify-between items-center pb-3 border-b border-[#f3f3f5] mb-4 shrink-0">
              <h3 id="modal-rule-title" class="text-[14px] font-bold text-[#1a1c1d]">Thêm nội quy mới</h3>
              <button id="close-rule-modal" class="p-1.5 text-[#727784] hover:bg-[#f3f3f5] rounded-full transition-all">
                <span class="material-symbols-outlined text-[19px]">close</span>
              </button>
            </div>
            <form id="rule-form" class="space-y-4 text-sm flex-grow">
              <input type="hidden" id="modal-rule-id">
              <div>
                <label class="block text-[11.5px] font-semibold text-[#414753] mb-1">Tiêu đề nội quy</label>
                <input type="text" id="modal-rule-tieu-de" required placeholder="Ví dụ: Quy định giờ giấc học tập" class="w-full border border-[#e2e2e4] rounded-xl px-4 py-2 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/10 transition text-[13px]">
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-[11.5px] font-semibold text-[#414753] mb-1">Áp dụng cho</label>
                  <select id="modal-rule-ap-dung" class="w-full border border-[#e2e2e4] rounded-xl px-3 py-2 outline-none focus:border-[#0066cc] transition text-[13px] bg-white">
                    <option value="tất cả">Tất cả</option>
                    <option value="học viên">Học viên</option>
                    <option value="giáo viên">Giáo viên</option>
                    <option value="nhân viên">Nhân viên</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[11.5px] font-semibold text-[#414753] mb-1">Thứ tự hiển thị</label>
                  <input type="number" id="modal-rule-thu-tu" value="1" min="0" required class="w-full border border-[#e2e2e4] rounded-xl px-4 py-2 outline-none focus:border-[#0066cc] transition text-[13px]">
                </div>
              </div>
              <div>
                <label class="block text-[11.5px] font-semibold text-[#414753] mb-1">Nội dung chi tiết</label>
                <textarea id="modal-rule-noi-dung" rows="6" required placeholder="Nhập nội dung quy định chi tiết..." class="w-full border border-[#e2e2e4] rounded-xl px-4 py-2.5 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/10 transition text-[13px] leading-relaxed"></textarea>
              </div>
              <div id="wrapper-active-checkbox" class="flex items-center gap-2 pt-1 hidden">
                <input type="checkbox" id="modal-rule-active" checked class="w-4 h-4 text-[#0066cc] border-[#e2e2e4] rounded focus:ring-[#0066cc]/10">
                <label for="modal-rule-active" class="text-[12px] font-medium text-slate-700">Kích hoạt hiển thị</label>
              </div>
              <div class="flex gap-3 pt-2 shrink-0">
                <button type="button" id="btn-cancel-rule-modal" class="flex-1 border border-[#e2e2e4] hover:bg-[#f3f3f5] text-[#1d1d1f] font-semibold py-2.5 rounded-full transition active:scale-95 text-[12.5px] h-[40px]">Hủy</button>
                <button type="submit" class="flex-1 bg-[#0066cc] hover:bg-[#004e9f] text-white font-semibold py-2.5 rounded-full transition active:scale-95 text-[12.5px] h-[40px] shadow-sm">Lưu lại</button>
              </div>
            </form>
          </div>
        </div>
      `;

      // Nút Refresh
      document.getElementById('btn-refresh-rules')?.addEventListener('click', () => {
        loadRules();
      });

      if (isAdminOrStaff) {
        const modal = document.getElementById('rule-modal');
        const form = document.getElementById('rule-form');
        const modalTitle = document.getElementById('modal-rule-title');
        const inputId = document.getElementById('modal-rule-id');
        const inputTieuDe = document.getElementById('modal-rule-tieu-de');
        const inputApDung = document.getElementById('modal-rule-ap-dung');
        const inputThuTu = document.getElementById('modal-rule-thu-tu');
        const inputNoiDung = document.getElementById('modal-rule-noi-dung');
        const wrapperCheckbox = document.getElementById('wrapper-active-checkbox');
        const checkboxActive = document.getElementById('modal-rule-active');

        // Hàm mở modal thêm
        document.getElementById('btn-add-rule')?.addEventListener('click', () => {
          form.reset();
          inputId.value = '';
          modalTitle.textContent = 'Thêm nội quy mới';
          wrapperCheckbox.classList.add('hidden');
          modal.classList.remove('hidden');
        });

        // Đóng modal
        const closeModal = () => modal.classList.add('hidden');
        document.getElementById('close-rule-modal')?.addEventListener('click', closeModal);
        document.getElementById('btn-cancel-rule-modal')?.addEventListener('click', closeModal);

        // Edit
        container.querySelectorAll('.btn-edit-rule').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const ruleObj = rules.find(r => r.id === parseInt(id));
            if (ruleObj) {
              inputId.value = ruleObj.id;
              inputTieuDe.value = ruleObj.tieu_de;
              inputApDung.value = ruleObj.ap_dung_cho;
              inputThuTu.value = ruleObj.thu_tu;
              inputNoiDung.value = ruleObj.noi_dung;
              checkboxActive.checked = ruleObj.is_active === 1;
              
              modalTitle.textContent = 'Chỉnh sửa nội quy';
              wrapperCheckbox.classList.remove('hidden');
              modal.classList.remove('hidden');
            }
          });
        });

        // Delete
        container.querySelectorAll('.btn-delete-rule').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            if (confirm('Bạn có chắc chắn muốn xóa nội quy này không? Thao tác này không thể hoàn tác!')) {
              try {
                const deleteRes = await fetch(`${API_BASE}/rules/${id}`, {
                  method: 'DELETE',
                  headers: { 'x-user-role': userRole }
                });
                const deleteResult = await deleteRes.json();
                if (deleteResult.success) {
                  showToast('Đã xóa nội quy thành công!');
                  loadRules();
                } else {
                  showToast(deleteResult.error || 'Có lỗi xảy ra', 'error');
                }
              } catch (err) {
                showToast('Không thể kết nối tới server', 'error');
              }
            }
          });
        });

        // Submit form
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const id = inputId.value;
          const payload = {
            tieu_de: inputTieuDe.value.trim(),
            ap_dung_cho: inputApDung.value,
            thu_tu: parseInt(inputThuTu.value) || 0,
            noi_dung: inputNoiDung.value.trim(),
            is_active: checkboxActive.checked ? 1 : 0
          };

          const url = id ? `${API_BASE}/rules/${id}` : `${API_BASE}/rules`;
          const method = id ? 'PUT' : 'POST';

          try {
            const saveRes = await fetch(url, {
              method,
              headers: {
                'Content-Type': 'application/json',
                'x-user-role': userRole
              },
              body: JSON.stringify(payload)
            });
            const saveResult = await saveRes.json();
            if (saveResult.success) {
              showToast(id ? 'Đã cập nhật nội quy!' : 'Đã thêm nội quy mới!');
              closeModal();
              loadRules();
            } else {
              showToast(saveResult.error || 'Có lỗi xảy ra', 'error');
            }
          } catch (err) {
            showToast('Không thể lưu nội quy', 'error');
          }
        });
      }
    } catch (err) {
      container.innerHTML = `
        <div class="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-xs max-w-lg mx-auto">
          <strong>Lỗi tải dữ liệu:</strong> ${err.message}
        </div>
      `;
    }
  }

  // Khởi động load danh sách nội quy
  await loadRules();
}
