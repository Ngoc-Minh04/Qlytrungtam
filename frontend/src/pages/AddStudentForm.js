// AddStudentForm.js - Tiếp nhận học viên mới
import { API_BASE, showToast, setupCustomDatePicker } from './_shared.js';

export async function renderAddStudentForm(container) {
  container.innerHTML = `
    <div class="space-y-3">
      <div>
        <h2 class="font-bold text-apple-ink text-lg apple-headline">Tiếp nhận học viên mới</h2>
      </div>
      <div class="bg-white rounded-2xl border border-apple-divider overflow-hidden flex flex-col lg:flex-row max-w-4xl mx-auto shadow-sm">
        <!-- Left Column: Avatar Upload -->
        <div class="w-full lg:w-1/3 p-4 bg-apple-parchment flex flex-col items-center justify-start border-b lg:border-b-0 lg:border-r border-apple-divider/40">
          <div class="w-28 h-28 rounded-2xl bg-white flex flex-col items-center justify-center mb-3 shadow-sm border border-apple-divider/60 group relative overflow-hidden cursor-pointer hover:bg-apple-parchment transition">
            <span class="material-symbols-outlined text-3xl text-apple-blue opacity-85 mb-1">add_a_photo</span>
            <span class="text-[10px] font-semibold text-apple-ink">Tải ảnh đại diện</span>
            <input type="file" id="add-avatar-file" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
          <div class="text-center space-y-1">
            <h3 class="font-bold text-apple-ink text-xs">Hồ sơ & ảnh chân dung</h3>
            <p class="text-[10px] text-slate-500 leading-relaxed">JPG/PNG dưới 5MB.</p>
          </div>
        </div>
        
        <!-- Right Column: Form Grid -->
        <div class="w-full lg:w-2/3 p-4">
          <form id="add-student-form" class="space-y-3 text-xs">
            <!-- Thông tin cá nhân -->
            <div>
              <h3 class="font-bold text-apple-ink text-xs mb-2 border-b border-apple-parchment pb-1 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-apple-blue text-[15px]">person</span>
                Thông tin cá nhân học viên
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div class="md:col-span-2">
                  <label class="block font-semibold text-slate-600 mb-0.5">Họ và tên</label>
                  <input type="text" id="add-fullName" required placeholder="Nhập họ tên đầy đủ..." class="w-full border border-apple-divider rounded-lg px-3 py-1.5 outline-none focus:border-apple-blue transition bg-apple-pearl">
                </div>
                <div>
                  <label class="block font-semibold text-slate-600 mb-0.5">Ngày sinh</label>
                  <div id="add-dob-container" class="relative">
                    <input type="date" id="add-dob" required>
                  </div>
                </div>
                <div>
                  <label class="block font-semibold text-slate-600 mb-0.5">Giới tính</label>
                  <select id="add-gender" required class="w-full border border-apple-divider rounded-lg px-3 py-1.5 outline-none focus:border-apple-blue transition bg-apple-pearl">
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>
            </div>
 
            <!-- Thông tin phụ huynh -->
            <div>
              <h3 class="font-bold text-apple-ink text-xs mb-2 border-b border-apple-parchment pb-1 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-apple-blue text-[15px]">family_restroom</span>
                Liên hệ Phụ huynh / Người giám hộ
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div class="md:col-span-2">
                  <label class="block font-semibold text-slate-600 mb-0.5">Họ tên phụ huynh</label>
                  <input type="text" id="add-parentName" required placeholder="Tên cha mẹ hoặc người đại diện..." class="w-full border border-apple-divider rounded-lg px-3 py-1.5 outline-none focus:border-apple-blue transition bg-apple-pearl">
                </div>
                <div>
                  <label class="block font-semibold text-slate-600 mb-0.5">Số điện thoại phụ huynh</label>
                  <input type="tel" id="add-phone" required placeholder="09xxxxxxx" class="w-full border border-apple-divider rounded-lg px-3 py-1.5 outline-none focus:border-apple-blue transition bg-apple-pearl">
                </div>
                <div>
                  <label class="block font-semibold text-slate-600 mb-0.5">Địa chỉ Email</label>
                  <input type="email" id="add-email" required placeholder="parent@example.com" class="w-full border border-apple-divider rounded-lg px-3 py-1.5 outline-none focus:border-apple-blue transition bg-apple-pearl">
                </div>
              </div>
            </div>
 
            <!-- Trình độ xếp lớp -->
            <div>
              <h3 class="font-bold text-apple-ink text-xs mb-2 border-b border-apple-parchment pb-1 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-apple-blue text-[15px]">school</span>
                Xếp lớp học thuật
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label class="block font-semibold text-slate-600 mb-0.5">Trình độ đầu vào</label>
                  <select id="add-entryLevel" required class="w-full border border-apple-divider rounded-lg px-3 py-1.5 outline-none focus:border-apple-blue transition bg-apple-pearl">
                    <option value="Cơ bản A1">A1 Beginner</option>
                    <option value="Trung cấp B1">B1 Intermediate</option>
                    <option value="Cao cấp C1">C1 Advanced</option>
                  </select>
                </div>
                <div class="hidden">
                  <label class="block font-semibold text-slate-600 mb-0.5">Chi nhánh</label>
                  <select id="add-branch" required class="w-full border border-apple-divider rounded-lg px-3 py-1.5 outline-none focus:border-apple-blue transition bg-apple-pearl">
                    <option value="Trung tam chính" selected>Trung tâm chính</option>
                    <option value="Downtown Campus">Downtown Campus</option>
                  </select>
                </div>
                <div class="md:col-span-2 flex items-center gap-2 py-1 bg-slate-50 px-3 rounded-xl border border-slate-100">
                  <input type="checkbox" id="add-autoAccount" class="rounded text-apple-blue focus:ring-apple-blue w-4 h-4 cursor-pointer" checked>
                  <label for="add-autoAccount" class="font-bold text-slate-700 cursor-pointer select-none">Tự động tạo tài khoản đăng nhập (mật khẩu mặc định: 123456)</label>
                </div>
              </div>
            </div>
 
            <div class="flex justify-end gap-2 pt-2 border-t border-apple-divider/40">
              <button type="reset" class="px-4 py-1.5 rounded-lg border border-apple-divider hover:bg-apple-parchment text-apple-ink font-semibold transition active:scale-95 text-xs">Hủy</button>
              <button type="submit" class="px-6 py-1.5 rounded-lg bg-apple-blue hover:opacity-90 text-white font-semibold transition active:scale-95 shadow-sm text-xs">Lưu hồ sơ</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  // Tải Lịch Custom
  setupCustomDatePicker(document.getElementById('add-dob'), document.getElementById('add-dob-container'));

  document.getElementById('add-student-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const avatarFile = document.getElementById('add-avatar-file')?.files[0];
    const autoCreate = document.getElementById('add-autoAccount').checked;

    const submitData = async (avatarBase64 = null) => {
      const payload = {
        ho_ten: document.getElementById('add-fullName').value,
        ngay_sinh: document.getElementById('add-dob').value,
        gioi_tinh: document.getElementById('add-gender').value,
        ten_phu_huynh: document.getElementById('add-parentName').value,
        so_dien_thoai: document.getElementById('add-phone').value,
        email: document.getElementById('add-email').value,
        trinh_do_dau_vao: document.getElementById('add-entryLevel').value,
        chi_nhanh: document.getElementById('add-branch').value,
        loai_ho_so: 'hoc_vien',
        avatar_url: avatarBase64,
        auto_create_account: autoCreate
      };

      try {
        const res = await fetch(`${API_BASE}/students/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Role': 'le_tan'
          },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (result.success) {
          showToast('Tạo hồ sơ học viên thành công!');
          window._navigatePage && window._navigatePage('students-list');
        } else {
          showToast(result.error || 'Có lỗi xảy ra', 'error');
        }
      } catch (err) {
        showToast('Lỗi API', 'error');
      }
    };

    if (avatarFile) {
      const reader = new FileReader();
      reader.onload = () => submitData(reader.result);
      reader.onerror = () => showToast('Lỗi khi đọc file ảnh', 'error');
      reader.readAsDataURL(avatarFile);
    } else {
      submitData(null);
    }
  });
}
