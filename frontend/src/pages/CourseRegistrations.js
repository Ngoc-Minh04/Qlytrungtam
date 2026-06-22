// CourseRegistrations.js - Đăng ký khóa học / Thu phí (Đại trà & Học kèm)
import { API_BASE, showToast, formatCurrencyInput, parseCurrencyInput, setupCustomDatePicker } from './_shared.js';

export async function renderCourseRegistrations(container) {
  const todayStr = new Date().toISOString().split('T')[0];

  container.innerHTML = `
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-apple-blue"></div>
    </div>
  `;

  try {
    const [studentsRes, coursePkgsRes, tutoringPkgsRes, teachersRes] = await Promise.all([
      fetch(`${API_BASE}/students`),
      fetch(`${API_BASE}/course-packages`),
      fetch(`${API_BASE}/tutoring-packages`),
      fetch(`${API_BASE}/teachers`)
    ]);

    const studentsData = await studentsRes.json();
    const coursePkgsData = await coursePkgsRes.json();
    const tutoringPkgsData = await tutoringPkgsRes.json();
    const teachersData = await teachersRes.json();

    const students = studentsData.data || [];
    const coursePkgs = coursePkgsData.data || [];
    const tutoringPkgs = tutoringPkgsData.data || [];
    const teachers = teachersData.data || [];

    container.innerHTML = `
      <div class="space-y-3">
        <div class="bg-white rounded-xl border border-apple-divider overflow-visible flex flex-col lg:flex-row max-w-3xl mx-auto shadow-sm">
          <!-- Left Column -->
          <div class="w-full lg:w-1/3 p-4 bg-apple-parchment flex flex-col items-center justify-start border-b lg:border-b-0 lg:border-r border-apple-divider/40 rounded-t-xl lg:rounded-tr-none lg:rounded-l-xl">
            <button id="btn-refresh-course-registrations" class="self-start mb-2 flex items-center justify-center gap-1 px-2 py-0.5 border border-[#e2e2e4] hover:bg-white text-slate-700 text-[10px] font-semibold rounded-full transition-all active:scale-95 shadow-sm h-[26px]" type="button">
              <span class="material-symbols-outlined text-[14px]">refresh</span>Tải lại
            </button>
            <div class="w-20 h-20 rounded-xl bg-white flex flex-col items-center justify-center mb-3 shadow-sm border border-apple-divider/60">
              <span class="material-symbols-outlined text-2xl text-apple-blue opacity-85">payments</span>
            </div>
            <div class="text-center space-y-0.5">
              <h3 class="font-bold text-apple-ink text-xs">Thanh toán & Thu phí học</h3>
              <p class="text-[9.5px] text-slate-500 leading-relaxed"></p>
            </div>
          </div>
          
          <!-- Right Column: Form -->
          <div class="w-full lg:w-2/3 p-4">
            <form id="reg-course-form" class="space-y-3 text-[11.5px]">
              <div>
                <h3 class="font-bold text-apple-ink text-xs mb-2 border-b border-apple-parchment pb-1 flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-apple-blue text-[14px]">person</span>
                  Thông tin Học viên & Loại hình
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label class="block font-semibold text-slate-600 mb-0.5">Học viên <span class="text-rose-500 font-bold">*</span></label>
                    <select id="reg-student-id" required class="w-full border border-apple-divider rounded-lg px-3 py-1.5 outline-none focus:border-apple-blue transition bg-apple-pearl">
                      <option value="">-- Chọn Học viên --</option>
                      ${students.map(sv => `<option value="${sv.id}">${sv.ho_ten} - ${sv.ma_ho_so || sv.id}</option>`).join('')}
                    </select>
                  </div>
                  <div>
                    <label class="block font-semibold text-slate-600 mb-0.5">Loại hình gói học <span class="text-rose-500 font-bold">*</span></label>
                    <select id="reg-type-select" required class="w-full border border-apple-divider rounded-lg px-3 py-1.5 outline-none focus:border-apple-blue transition bg-apple-pearl">
                      <option value="dai_tra">Gói đại trà (Học nhóm)</option>
                      <option value="hoc_kem">Gói học kèm 1-1 </option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Chọn Gói Học -->
              <div>
                <h3 class="font-bold text-apple-ink text-xs mb-2 border-b border-apple-parchment pb-1 flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-apple-blue text-[14px]">school</span>
                  Gói học & Giáo viên
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div class="md:col-span-2">
                    <label class="block font-semibold text-slate-600 mb-0.5">Chọn Gói học <span class="text-rose-500 font-bold">*</span></label>
                    <select id="reg-package-id" required class="w-full border border-apple-divider rounded-lg px-3 py-1.5 outline-none focus:border-apple-blue transition bg-apple-pearl">
                      <!-- Sẽ tự động cập nhật qua JS -->
                    </select>
                  </div>
                  <div id="wrapper-gv-assign" class="hidden md:col-span-2">
                    <label class="block font-semibold text-slate-600 mb-0.5">Giáo viên phụ trách dạy kèm (Tùy chọn)</label>
                    <select id="reg-teacher-id" class="w-full border border-apple-divider rounded-lg px-3 py-1.5 outline-none focus:border-apple-blue transition bg-apple-pearl">
                      <option value="">-- Chưa chỉ định (Sắp xếp sau) --</option>
                      ${teachers.map(t => `<option value="${t.id}">${t.ho_ten} ${t.chuyen_mon ? ' · ' + t.chuyen_mon : ''}</option>`).join('')}
                    </select>
                  </div>
                  <div id="wrapper-sessions-count" class="hidden">
                    <label class="block font-semibold text-slate-600 mb-0.5">Số buổi học <span class="text-rose-500 font-bold">*</span></label>
                    <input type="number" id="reg-sessions" min="1" placeholder="Ví dụ: 12" readonly class="w-full border border-apple-divider rounded-lg px-3 py-1.5 outline-none focus:border-apple-blue transition bg-slate-100 cursor-not-allowed">
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
                    <div id="reg-start-container" class="relative">
                      <input type="date" id="reg-start" required>
                    </div>
                  </div>
                  <div>
                    <label class="block font-semibold text-slate-600 mb-0.5">Ngày kết thúc (Tự động tính)</label>
                    <div id="reg-end-container" class="relative">
                      <input type="date" id="reg-end" required>
                    </div>
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
                    <input type="text" id="reg-price" placeholder="0" required class="w-full border border-apple-divider rounded-lg px-3 py-1.5 outline-none focus:border-apple-blue transition bg-apple-pearl">
                  </div>
                  <div>
                    <label class="block font-semibold text-slate-600 mb-0.5">Thực thu (VNĐ)</label>
                    <input type="text" id="reg-paid" placeholder="0" required class="w-full border border-apple-divider rounded-lg px-3 py-1.5 outline-none focus:border-apple-blue transition bg-apple-pearl">
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

    // Tải Lịch Custom
    const regStartInput = document.getElementById('reg-start');
    const regEndInput = document.getElementById('reg-end');
    const typeSelect = document.getElementById('reg-type-select');
    const packageSelect = document.getElementById('reg-package-id');
    const priceInput = document.getElementById('reg-price');
    const paidInput = document.getElementById('reg-paid');

    const wrapperGv = document.getElementById('wrapper-gv-assign');
    const wrapperSessions = document.getElementById('wrapper-sessions-count');
    const sessionsInput = document.getElementById('reg-sessions');

    regStartInput.value = todayStr;

    setupCustomDatePicker(regStartInput, document.getElementById('reg-start-container'), {
      minDate: todayStr,
      onSelect: () => {
        updateEndDate();
      }
    });
    setupCustomDatePicker(regEndInput, document.getElementById('reg-end-container'));

    // Hàm cập nhật danh sách gói học dựa trên loại hình được chọn
    function renderPackagesList() {
      const type = typeSelect.value;
      if (type === 'dai_tra') {
        wrapperGv.classList.add('hidden');
        wrapperSessions.classList.add('hidden');
        sessionsInput.removeAttribute('required');

        packageSelect.innerHTML = `
          <option value="">-- Chọn Gói học phí đại trà --</option>
          ${coursePkgs.map(p => `
            <option value="${p.id}" data-price="${p.gia}" data-months="${p.so_thang}">
              ${p.ten_goi} (${p.so_thang} th - ${p.gia.toLocaleString('vi-VN')} VNĐ)
            </option>
          `).join('')}
        `;
      } else {
        wrapperGv.classList.remove('hidden');
        wrapperSessions.classList.remove('hidden');
        sessionsInput.setAttribute('required', 'true');

        packageSelect.innerHTML = `
          <option value="">-- Chọn Gói học kèm 1-1</option>
          ${tutoringPkgs.map(p => `
            <option value="${p.id}" data-price="${p.gia}" data-sessions="${p.so_buoi}">
              ${p.ten_goi} (${p.so_buoi} buổi - ${p.gia.toLocaleString('vi-VN')} VNĐ)
            </option>
          `).join('')}
        `;
      }
      priceInput.value = '';
      paidInput.value = '';
      sessionsInput.value = '';
      regEndInput.value = '';
    }

    renderPackagesList();
    typeSelect.addEventListener('change', renderPackagesList);

    // Hàm tự động tính toán ngày kết thúc dựa vào ngày bắt đầu và gói học
    function updateEndDate() {
      const selectedOpt = packageSelect.options[packageSelect.selectedIndex];
      if (selectedOpt && selectedOpt.value) {
        const startVal = regStartInput.value;
        if (!startVal) return;

        const type = typeSelect.value;
        if (type === 'dai_tra') {
          const months = parseInt(selectedOpt.getAttribute('data-months')) || 0;
          if (months > 0) {
            const startDate = new Date(startVal);
            startDate.setMonth(startDate.getMonth() + months);
            const y = startDate.getFullYear();
            const m = String(startDate.getMonth() + 1).padStart(2, '0');
            const d = String(startDate.getDate()).padStart(2, '0');
            regEndInput.value = `${y}-${m}-${d}`;
          }
        } else {
          // Gói kèm: mặc định thời hạn là 1 năm từ ngày bắt đầu
          const startDate = new Date(startVal);
          startDate.setFullYear(startDate.getFullYear() + 1);
          const y = startDate.getFullYear();
          const m = String(startDate.getMonth() + 1).padStart(2, '0');
          const d = String(startDate.getDate()).padStart(2, '0');
          regEndInput.value = `${y}-${m}-${d}`;
        }
      }
    }

    // Format tiền tệ trực quan khi nhập
    priceInput.addEventListener('input', (e) => {
      e.target.value = formatCurrencyInput(e.target.value);
    });
    paidInput.addEventListener('input', (e) => {
      e.target.value = formatCurrencyInput(e.target.value);
    });

    // Lắng nghe sự kiện đổi Gói học phí
    packageSelect.addEventListener('change', () => {
      const selectedOpt = packageSelect.options[packageSelect.selectedIndex];
      if (selectedOpt && selectedOpt.value) {
        const price = selectedOpt.getAttribute('data-price') || '0';
        priceInput.value = formatCurrencyInput(price);
        paidInput.value = formatCurrencyInput(price);

        const type = typeSelect.value;
        if (type === 'hoc_kem') {
          const sessions = selectedOpt.getAttribute('data-sessions') || '';
          sessionsInput.value = sessions;
        }

        updateEndDate();
      } else {
        priceInput.value = '';
        paidInput.value = '';
        sessionsInput.value = '';
      }
    });

    document.getElementById('btn-refresh-course-registrations')?.addEventListener('click', () => {
      renderCourseRegistrations(container);
    });

    document.getElementById('reg-course-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const type = typeSelect.value;
      const isTutoring = type === 'hoc_kem';

      let url = `${API_BASE}/registrations`;
      let payload = {
        ho_so_id: parseInt(document.getElementById('reg-student-id').value),
        tu_ngay: regStartInput.value,
        den_ngay: regEndInput.value,
        gia_thuc_te: parseCurrencyInput(priceInput.value),
        so_tien_da_thu: parseCurrencyInput(paidInput.value),
        phuong_thuc_tt: document.getElementById('reg-pay-method').value
      };

      if (isTutoring) {
        url = `${API_BASE}/registrations/tutoring`;
        payload = {
          hoc_vien_id: payload.ho_so_id,
          giao_vien_id: document.getElementById('reg-teacher-id').value ? parseInt(document.getElementById('reg-teacher-id').value) : null,
          goi_hoc_kem_id: parseInt(packageSelect.value),
          so_buoi_dang_ky: parseInt(sessionsInput.value),
          tu_ngay: payload.tu_ngay,
          den_ngay: payload.den_ngay,
          gia_thuc_te: payload.gia_thuc_te,
          so_tien_da_thu: payload.so_tien_da_thu,
          phuong_thuc_tt: payload.phuong_thuc_tt
        };
      } else {
        payload.goi_hoc_phi_id = parseInt(packageSelect.value);
      }

      try {
        const res = await fetch(url, {
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
          if (isTutoring) {
            sessionStorage.setItem('auto_schedule_data', JSON.stringify({
              type: 'hoc_kem',
              hoc_vien_id: payload.hoc_vien_id,
              goi_hoc_kem_id: payload.goi_hoc_kem_id,
              giao_vien_id: payload.giao_vien_id
            }));
            if (typeof window._navigatePage === 'function') {
              window._navigatePage('class-management');
            } else {
              window.location.hash = '/class-management';
            }
          } else {
            renderCourseRegistrations(container);
          }
        } else {
          showToast(result.error || 'Lỗi không xác định', 'error');
        }
      } catch (e) {
        showToast('Lỗi kết nối API', 'error');
      }
    });

  } catch (error) {
    showToast('Lỗi khi tải dữ liệu khởi tạo', 'error');
    container.innerHTML = `
      <div class="text-center py-12 text-slate-400 text-xs">
        Không thể kết nối máy chủ để lấy thông tin. Vui lòng bấm Tải lại để thử lại.
      </div>
    `;
  }
}

