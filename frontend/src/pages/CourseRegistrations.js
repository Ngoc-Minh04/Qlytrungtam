// CourseRegistrations.js - Đăng ký khóa học / Thu phí
import { API_BASE, showToast } from './_shared.js';

export async function renderCourseRegistrations(container) {
  container.innerHTML = `
    <div class="space-y-3">
      <div class="bg-white rounded-xl border border-apple-divider overflow-hidden flex flex-col lg:flex-row max-w-3xl mx-auto shadow-sm">
        <!-- Left Column -->
        <div class="w-full lg:w-1/3 p-4 bg-apple-parchment flex flex-col items-center justify-start border-b lg:border-b-0 lg:border-r border-apple-divider/40">
          <div class="w-20 h-20 rounded-xl bg-white flex flex-col items-center justify-center mb-3 shadow-sm border border-apple-divider/60">
            <span class="material-symbols-outlined text-2xl text-apple-blue opacity-85">payments</span>
          </div>
          <div class="text-center space-y-0.5">
            <h3 class="font-bold text-apple-ink text-xs">Thanh toán & Thu phí học</h3>
            <p class="text-[9.5px] text-slate-500 leading-relaxed">Đồng bộ doanh thu tự động thông qua Trigger.</p>
          </div>
        </div>
        
        <!-- Right Column: Form -->
        <div class="w-full lg:w-2/3 p-4">
          <form id="reg-course-form" class="space-y-3 text-[11.5px]">
            <div>
              <h3 class="font-bold text-apple-ink text-xs mb-2 border-b border-apple-parchment pb-1 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-apple-blue text-[14px]">person</span>
                Thông tin Học viên
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label class="block font-semibold text-slate-600 mb-0.5">Mã Học viên (ID hồ sơ)</label>
                  <input type="number" id="reg-student-id" value="1" required class="w-full border border-apple-divider rounded-lg px-3 py-1.5 outline-none focus:border-apple-blue transition bg-apple-pearl">
                </div>
                <div>
                  <label class="block font-semibold text-slate-600 mb-0.5">Mã Gói học phí (ID)</label>
                  <input type="number" id="reg-package-id" value="1" required class="w-full border border-apple-divider rounded-lg px-3 py-1.5 outline-none focus:border-apple-blue transition bg-apple-pearl">
                </div>
              </div>
            </div>

            <div>
              <h3 class="font-bold text-apple-ink text-xs mb-2 border-b border-apple-parchment pb-1 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-apple-blue text-[14px]">calendar_today</span>
                Thời hạn khóa học
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label class="block font-semibold text-slate-600 mb-0.5">Ngày bắt đầu</label>
                  <input type="date" id="reg-start" required class="w-full border border-apple-divider rounded-lg px-3 py-1.5 outline-none focus:border-apple-blue transition bg-apple-pearl">
                </div>
                <div>
                  <label class="block font-semibold text-slate-600 mb-0.5">Ngày kết thúc</label>
                  <input type="date" id="reg-end" required class="w-full border border-apple-divider rounded-lg px-3 py-1.5 outline-none focus:border-apple-blue transition bg-apple-pearl">
                </div>
              </div>
            </div>

            <div>
              <h3 class="font-bold text-apple-ink text-xs mb-2 border-b border-apple-parchment pb-1 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-apple-blue text-[14px]">payments</span>
                Chi tiết Đóng học phí
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label class="block font-semibold text-slate-600 mb-0.5">Giá trị khóa học (VNĐ)</label>
                  <input type="number" id="reg-price" value="4500000" required class="w-full border border-apple-divider rounded-lg px-3 py-1.5 outline-none focus:border-apple-blue transition bg-apple-pearl">
                </div>
                <div>
                  <label class="block font-semibold text-slate-600 mb-0.5">Thực thu (VNĐ)</label>
                  <input type="number" id="reg-paid" value="4500000" required class="w-full border border-apple-divider rounded-lg px-3 py-1.5 outline-none focus:border-apple-blue transition bg-apple-pearl">
                </div>
                <div class="md:col-span-2">
                  <label class="block font-semibold text-slate-600 mb-0.5">Phương thức thanh toán</label>
                  <select id="reg-pay-method" class="w-full border border-apple-divider rounded-lg px-3 py-1.5 outline-none focus:border-apple-blue transition bg-apple-pearl">
                    <option value="Chuyen khoan">Chuyển khoản</option>
                    <option value="Tien mat">Tiền mặt</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="flex justify-end gap-2 pt-2 border-t border-apple-divider/40">
              <button type="reset" class="px-4 py-1.5 rounded-lg border border-apple-divider hover:bg-apple-parchment text-apple-ink font-semibold transition active:scale-95">Hủy</button>
              <button type="submit" class="px-6 py-1.5 rounded-lg bg-apple-blue hover:opacity-90 text-white font-semibold transition active:scale-95 shadow-sm">Ghi nhận đóng học phí</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  document.getElementById('reg-course-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      ho_so_id: parseInt(document.getElementById('reg-student-id').value),
      goi_hoc_phi_id: parseInt(document.getElementById('reg-package-id').value),
      tu_ngay: document.getElementById('reg-start').value,
      den_ngay: document.getElementById('reg-end').value,
      gia_thuc_te: parseFloat(document.getElementById('reg-price').value),
      so_tien_da_thu: parseFloat(document.getElementById('reg-paid').value),
      phuong_thuc_tt: document.getElementById('reg-pay-method').value
    };

    try {
      const res = await fetch(`${API_BASE}/registrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': 'le_tan'
        },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        showToast('Ghi nhận đóng học phí thành công!');
        document.getElementById('reg-course-form').reset();
      } else {
        showToast(result.error || 'Lỗi không xác định', 'error');
      }
    } catch (e) {
      showToast('Lỗi kết nối API', 'error');
    }
  });
}
