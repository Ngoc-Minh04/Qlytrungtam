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

      const targetLabels = {
        'tat_ca': 'Tất cả',
        'hoc_vien': 'Học viên',
        'giao_vien': 'Giáo viên',
        'nhan_vien': 'Nhân viên'
      };

      let displayCount = 10;
      let isRulesLoading = false;

      function renderRulesChunk() {
        const chunk = rules.slice(0, displayCount);
        const rulesListContainer = document.getElementById('rules-list-container');
        if (!rulesListContainer) return;

        const targetColors = {
          'tat_ca': 'bg-blue-50 text-[#0071e3] border border-blue-100/30',
          'hoc_vien': 'bg-orange-50 text-orange-600 border border-orange-100/30',
          'giao_vien': 'bg-emerald-50 text-emerald-600 border border-emerald-100/30',
          'nhan_vien': 'bg-purple-50 text-purple-600 border border-purple-100/30'
        };

        rulesListContainer.innerHTML = chunk.map((rule, idx) => `
          <div class="py-5 ${idx === 0 ? 'pt-0' : ''} flex flex-col md:flex-row justify-between items-start gap-4 transition-all duration-300">
            <div class="space-y-2 flex-grow pr-4">
              <div class="flex items-center gap-2 flex-wrap">
                <h4 class="font-bold text-slate-800 text-[13.5px]">${idx + 1}. ${rule.tieu_de}</h4>
                ${rule.is_active === 0 ? '<span class="bg-rose-50 text-rose-600 border border-rose-100 px-2 py-0.5 rounded-full text-[9px] font-semibold">Tạm ẩn</span>' : ''}
              </div>
              <p class="text-slate-500 leading-relaxed text-[12px] whitespace-pre-wrap">${rule.noi_dung}</p>
              <div class="flex items-center gap-2 flex-wrap pt-0.5">
                <span class="inline-block text-[10px] ${targetColors[rule.ap_dung_cho] || 'bg-slate-100 text-slate-600'} rounded-full px-2.5 py-0.5 capitalize font-semibold">Đối tượng: ${targetLabels[rule.ap_dung_cho] || rule.ap_dung_cho}</span>
                <span class="text-[10px] text-slate-400 font-medium bg-slate-50 border border-slate-100 rounded-full px-2.5 py-0.5">Thứ tự: ${rule.thu_tu}</span>
              </div>
            </div>
            ${isAdminOrStaff ? `
              <div class="flex items-center gap-2 shrink-0 md:self-center">
                <button class="btn-edit-rule p-2 text-slate-400 hover:text-[#0071e3] hover:bg-[#0071e3]/5 border border-slate-200/60 hover:border-[#0071e3]/20 rounded-full transition-all active:scale-95" data-id="${rule.id}" title="Chỉnh sửa">
                  <span class="material-symbols-outlined text-[16px]">edit</span>
                </button>
                <button class="btn-delete-rule p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 border border-slate-200/60 hover:border-rose-200 rounded-full transition-all active:scale-95" data-id="${rule.id}" title="Xóa nội quy">
                  <span class="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
            ` : ''}
          </div>
        `).join('');

        if (rules.length === 0) {
          rulesListContainer.innerHTML = '<p class="text-slate-400 py-12 text-center text-[13px] font-medium">Chưa có nội quy nào được cấu hình trên hệ thống.</p>';
        }

        attachRuleEvents();
      }

      container.innerHTML = `
        <div class="space-y-6 max-w-4xl mx-auto">
          <!-- Header Area -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-slate-100/80 shadow-sm">
            <div>
              <h2 class="text-lg font-bold text-slate-800 tracking-tight">Nội Quy Trung Tâm</h2>
              <p class="text-xs text-slate-400 mt-1 font-medium">Nội quy & quy định chính thức dành cho học viên, giáo viên và nhân viên Stellar Academy</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <!-- Nút Refresh đồng bộ kích thước -->
              <button id="btn-refresh-rules" class="flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 bg-white/60 hover:bg-slate-50 text-slate-600 rounded-full transition-all active:scale-95 text-[12.5px] font-semibold h-[36px] shadow-sm">
                <span class="material-symbols-outlined text-[17px] text-slate-500">refresh</span>
                <span>Tải lại</span>
              </button>
              ${isAdminOrStaff ? `
                <button id="btn-add-rule" class="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full transition-all active:scale-95 text-[12.5px] font-semibold h-[36px] shadow-sm shadow-[#0071e3]/10">
                  <span class="material-symbols-outlined text-[17px]">add</span>
                  <span>Thêm nội quy</span>
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Content List -->
          <div class="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-slate-100/80 shadow-sm flex flex-col max-h-[550px] overflow-hidden">
            <h3 class="sticky top-0 bg-white/90 backdrop-blur-sm z-10 border-b border-slate-100 pb-3 uppercase tracking-wider shrink-0 font-bold text-slate-800 text-sm">Danh mục nội quy hiện hành</h3>
            <div id="rules-list-container" class="space-y-6 divide-y divide-slate-100/70 pt-2 text-xs overflow-y-auto pr-2 flex-grow">
              <!-- Rendered by JS chunk -->
            </div>
            <div id="center-rules-sentinel" class="h-4 w-full shrink-0"></div>
          </div>
        </div>

        <!-- MODAL THÊM / SỬA NỘI QUY -->
        <div id="rule-modal" class="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4">
          <div class="bg-white/90 backdrop-blur-md rounded-[28px] max-w-lg w-full p-6 border border-slate-100/50 max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div class="flex justify-between items-center pb-3 border-b border-slate-100 mb-4 shrink-0">
              <h3 id="modal-rule-title" class="text-sm font-bold text-slate-800">Thêm nội quy mới</h3>
              <button id="close-rule-modal" class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all">
                <span class="material-symbols-outlined text-[19px]">close</span>
              </button>
            </div>
            <form id="rule-form" class="space-y-4 text-xs flex-grow">
              <input type="hidden" id="modal-rule-id">
              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-0.5">Tiêu đề nội quy</label>
                <input type="text" id="modal-rule-tieu-de" required placeholder="Ví dụ: Quy định giờ giấc học tập" class="w-full border border-slate-200/60 rounded-xl px-4 py-2.5 outline-none bg-slate-50/50 focus:border-[#0071e3] transition">
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-0.5">Áp dụng cho</label>
                  <select id="modal-rule-ap-dung" class="w-full border border-slate-200/60 rounded-xl px-3 py-2.5 outline-none bg-slate-50/50 focus:border-[#0071e3] transition">
                    <option value="tat_ca">Tất cả</option>
                    <option value="hoc_vien">Học viên</option>
                    <option value="giao_vien">Giáo viên</option>
                    <option value="nhan_vien">Nhân viên</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-0.5">Thứ tự hiển thị</label>
                  <input type="number" id="modal-rule-thu-tu" value="1" min="0" required class="w-full border border-slate-200/60 rounded-xl px-4 py-2.5 outline-none bg-slate-50/50 focus:border-[#0071e3] transition">
                </div>
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-0.5">Nội dung chi tiết</label>
                <textarea id="modal-rule-noi-dung" rows="6" required placeholder="Nhập nội dung quy định chi tiết..." class="w-full border border-slate-200/60 rounded-xl px-4 py-2.5 outline-none bg-slate-50/50 focus:border-[#0071e3] transition leading-relaxed"></textarea>
              </div>
              <div id="wrapper-active-checkbox" class="flex items-center gap-2 pt-1 pl-0.5 hidden">
                <input type="checkbox" id="modal-rule-active" checked class="w-4 h-4 text-[#0071e3] border-slate-300 rounded focus:ring-[#0071e3]/20">
                <label for="modal-rule-active" class="text-[12px] font-medium text-slate-600">Kích hoạt hiển thị</label>
              </div>
              <div class="flex gap-3 pt-2 shrink-0">
                <button type="button" id="btn-cancel-rule-modal" class="flex-1 border border-slate-200 text-slate-500 font-semibold py-2.5 rounded-full transition-all active:scale-95 h-[40px]">Hủy</button>
                <button type="submit" class="flex-1 bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold py-2.5 rounded-full transition-all active:scale-95 h-[40px] shadow-md shadow-[#0071e3]/10">Lưu lại</button>
              </div>
            </form>
          </div>
        </div>
      `;

      // Nút Refresh
      document.getElementById('btn-refresh-rules')?.addEventListener('click', () => {
        loadRules();
      });

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

      function attachRuleEvents() {
        if (isAdminOrStaff) {
          // Hàm mở modal thêm
          document.getElementById('btn-add-rule').onclick = () => {
            form.reset();
            inputId.value = '';
            modalTitle.textContent = 'Thêm nội quy mới';
            wrapperCheckbox.classList.add('hidden');
            modal.classList.remove('hidden');
          };

          // Đóng modal
          const closeModal = () => modal.classList.add('hidden');
          const closeBtn = document.getElementById('close-rule-modal');
          if (closeBtn) closeBtn.onclick = closeModal;
          const cancelBtn = document.getElementById('btn-cancel-rule-modal');
          if (cancelBtn) cancelBtn.onclick = closeModal;

          // Edit
          container.querySelectorAll('.btn-edit-rule').forEach(btn => {
            btn.onclick = () => {
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
            };
          });

          // Delete
          container.querySelectorAll('.btn-delete-rule').forEach(btn => {
            btn.onclick = async () => {
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
            };
          });
        }
      }

      renderRulesChunk();

      // Intersection Observer cho Center Rules
      if (window.centerRulesObserver) {
        window.centerRulesObserver.disconnect();
      }
      const rulesSentinel = document.getElementById('center-rules-sentinel');
      if (rulesSentinel && rules.length > 0) {
        window.centerRulesObserver = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting && displayCount < rules.length && !isRulesLoading) {
            isRulesLoading = true;
            setTimeout(() => {
              displayCount = Math.min(displayCount + 10, rules.length);
              renderRulesChunk();
              isRulesLoading = false;
            }, 150);
          }
        }, { rootMargin: '10px' });
        window.centerRulesObserver.observe(rulesSentinel);
      }

      if (isAdminOrStaff && form) {
        // Submit form
        form.onsubmit = async (e) => {
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
              modal.classList.add('hidden');
              loadRules();
            } else {
              showToast(saveResult.error || 'Có lỗi xảy ra', 'error');
            }
          } catch (err) {
            showToast('Không thể lưu nội quy', 'error');
          }
        };
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
