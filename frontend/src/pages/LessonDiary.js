// LessonDiary.js - Nhật ký học tập & Sổ liên lạc điện tử
import { showToast } from './_shared.js';
const API_BASE = 'http://localhost:3006/api';

export async function renderLessonDiary(container) {
  const userRole = localStorage.getItem('userRole') || 'hoc_vien';
  const hoSoId   = localStorage.getItem('hoSoId') || localStorage.getItem('userId') || '';

  container.innerHTML = `
    <div class="flex items-center justify-center min-h-[300px]">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-apple-blue"></div>
    </div>
  `;

  // Tab switcher ở đầu trang
  let activeTab = 'diary';

  async function renderWrapper() {
    container.innerHTML = `
      <div class="space-y-5">
        <!-- Tab pills -->
        <div class="flex gap-2">
          <button data-lt="diary" class="lt-tab flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all
            ${activeTab === 'diary' ? 'bg-[#0066cc] text-white shadow' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}">
            <span class="material-symbols-outlined text-[14px]">menu_book</span> Sổ liên lạc
          </button>
          <button data-lt="notes" class="lt-tab flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all
            ${activeTab === 'notes' ? 'bg-[#0066cc] text-white shadow' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}">
            <span class="material-symbols-outlined text-[14px]">sticky_note_2</span> Ghi chú dặn dò GV
          </button>
        </div>
        <div id="lt-content"></div>
      </div>`;

    container.querySelectorAll('.lt-tab').forEach(btn => {
      btn.addEventListener('click', async () => {
        activeTab = btn.dataset.lt;
        await renderWrapper();
      });
    });

    if (activeTab === 'diary') await _loadDiaryTab();
    else await _loadNotesTab();
  }

  async function _loadDiaryTab() {
    const content = document.getElementById('lt-content');
    content.innerHTML = `<div class="flex items-center justify-center py-10"><div class="animate-spin rounded-full h-6 w-6 border-b-2 border-apple-blue"></div></div>`;
    try {
      let students = [];
      let selectedStudentId = null;
      if (userRole === 'admin' || userRole === 'le_tan' || userRole === 'giao_vien') {
        const stdData = await (await fetch(`${API_BASE}/students`, {
          headers: { 'x-user-role': userRole, 'x-ho-so-id': hoSoId }
        })).json();
        students = stdData.data || [];
        if (students.length > 0) selectedStudentId = students[0].id;
      } else {
        selectedStudentId = parseInt(hoSoId);
      }
      await loadDiaryData(content, userRole, students, selectedStudentId);
    } catch (err) {
      content.innerHTML = `<div class="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-xs"><strong>Lỗi:</strong> ${err.message}</div>`;
    }
  }

  async function _loadNotesTab() {
    const content = document.getElementById('lt-content');
    content.innerHTML = `<div class="flex items-center justify-center py-10"><div class="animate-spin rounded-full h-6 w-6 border-b-2 border-apple-blue"></div></div>`;
    try {
      const [stdRes, notesRes] = await Promise.all([
        fetch(`${API_BASE}/students`, { headers: { 'x-user-role': userRole, 'x-ho-so-id': hoSoId } }),
        fetch(`${API_BASE}/notes`, { headers: { 'x-user-role': 'admin', 'x-ho-so-id': hoSoId } })
      ]);
      const students = (await stdRes.json()).data || [];
      let notes = (await notesRes.json()).data || [];
      let filterStudentId = '';

      function renderNotes(list) {
        if (list.length === 0) return `<div class="py-12 text-center text-xs text-slate-400"><span class="material-symbols-outlined text-4xl text-slate-200 block mb-2">sticky_note_2</span>Chưa có ghi chú dặn dò nào</div>`;
        return list.map(n => `
          <div class="flex gap-3 p-4 bg-amber-50/40 border border-amber-100/60 rounded-2xl">
            <div class="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <span class="material-symbols-outlined text-amber-600 text-[17px]">sticky_note_2</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2 mb-1">
                <p class="text-xs font-bold text-slate-800">GV: ${n.ten_giao_vien || '—'} → HV: ${n.ten_hoc_vien || '—'}</p>
                <p class="text-[9px] text-slate-400 flex-shrink-0">${new Date(n.ngay_tao).toLocaleDateString('vi-VN')}</p>
              </div>
              <p class="text-xs text-slate-700 leading-relaxed">${n.noi_dung}</p>
            </div>
          </div>`).join('');
      }

      content.innerHTML = `
        <div class="space-y-4">
          <div class="bg-white border border-[#e2e2e4] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 shadow-sm">
            <span class="material-symbols-outlined text-[#0066cc]">filter_list</span>
            <select id="notes-filter-student" class="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-apple-blue outline-none transition-all w-full sm:w-64">
              <option value="">Tất cả học viên</option>
              ${students.map(s => `<option value="${s.id}">${s.ho_ten} (${s.ma_ho_so})</option>`).join('')}
            </select>
            <span class="text-[10px] text-slate-400 ml-auto">${notes.length} ghi chú</span>
          </div>
          <div id="notes-list" class="space-y-3">${renderNotes(notes)}</div>
        </div>`;

      document.getElementById('notes-filter-student')?.addEventListener('change', async e => {
        filterStudentId = e.target.value;
        const url = filterStudentId
          ? `${API_BASE}/notes?hoc_vien_id=${filterStudentId}`
          : `${API_BASE}/notes`;
        const filtered = await (await fetch(url, { headers: { 'x-user-role': 'admin', 'x-ho-so-id': hoSoId } })).json();
        const list = filtered.data || [];
        document.getElementById('notes-list').innerHTML = renderNotes(list);
      });
    } catch (err) {
      content.innerHTML = `<div class="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-xs"><strong>Lỗi:</strong> ${err.message}</div>`;
    }
  }

  try {
    await renderWrapper();

  } catch (err) {
    container.innerHTML = `
      <div class="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-xs">
        <strong>Lỗi tải sổ liên lạc:</strong> ${err.message}
      </div>
    `;
  }
}

async function loadDiaryData(container, userRole, students, studentId) {
  if (!studentId) {
    container.innerHTML = `
      <div class="bg-white border border-[#e2e2e4] rounded-2xl p-8 text-center text-slate-500 text-xs shadow-sm">
        Không tìm thấy thông tin học viên để truy xuất sổ liên lạc.
      </div>
    `;
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/reports/student/${studentId}`);
    const result = await res.json();
    const diaries = result.data || [];

    // Lấy thông tin học viên được chọn để hiển thị tiêu đề
    const currentStudent = students.find(s => s.id === studentId);
    const studentName = currentStudent ? currentStudent.ho_ten : 'Học viên';

    // Tạo giao diện
    container.innerHTML = `
      <div class="space-y-6 animate-fadeIn">
        <!-- Header & Top Actions -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 class="text-xl font-bold tracking-tight text-slate-800">Nhật ký Học tập & Sổ liên lạc</h2>
            <p class="text-xs text-slate-500">Xem nhận xét bài học, bài tập về nhà và đánh giá từ giáo viên.</p>
          </div>
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <!-- Nút Tải lại đồng bộ thiết kế -->
            <button id="btn-refresh-diary" class="flex items-center justify-center gap-1.5 px-4 py-2 border border-[#e2e2e4] hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-full transition-all active:scale-95 shadow-sm h-[32px]">
              <span class="material-symbols-outlined text-[16px]">refresh</span>Tải lại
            </button>
            
            ${(userRole === 'admin' || userRole === 'giao_vien') ? `
              <button id="btn-create-diary" class="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-apple-blue to-[#007eff] text-white text-xs font-semibold rounded-full transition-all active:scale-95 shadow-md hover:shadow-lg h-[32px]">
                <span class="material-symbols-outlined text-[16px]">rate_review</span>Viết nhận xét
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Bộ chọn học viên (chỉ dành cho Admin, Lễ tân, Giáo viên) -->
        ${(userRole === 'admin' || userRole === 'le_tan' || userRole === 'giao_vien') ? `
          <div class="bg-white border border-[#e2e2e4] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-apple-blue">person_search</span>
              <span class="text-xs font-bold text-slate-700">Tra cứu sổ liên lạc của học viên:</span>
            </div>
            <select id="select-student-diary" class="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-apple-blue outline-none transition-all w-full sm:w-64">
              ${students.map(s => `
                <option value="${s.id}" ${s.id === studentId ? 'selected' : ''}>${s.ho_ten} (${s.ma_ho_so})</option>
              `).join('')}
            </select>
          </div>
        ` : ''}

        <!-- Timeline Nhật ký / Sổ liên lạc -->
        <div class="bg-white border border-[#e2e2e4] rounded-2xl p-6 shadow-sm space-y-6">
          <div class="border-b border-[#f3f3f5] pb-3 flex items-center justify-between">
            <h3 class="font-bold text-slate-800 text-sm">Lịch sử nhận xét của: <span class="text-apple-blue">${studentName}</span></h3>
            <span class="text-[10px] bg-blue-50 text-apple-blue px-2 py-0.5 rounded-full font-bold">${diaries.length} Nhật ký</span>
          </div>

          <div class="relative pl-6 border-l-2 border-slate-100 space-y-8">
            ${diaries.map(item => {
              const createdDate = new Date(item.ngay_tao).toLocaleDateString('vi-VN', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              });
              const createdTime = new Date(item.ngay_tao).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
              return `
                <!-- Timeline Item -->
                <div class="relative">
                  <!-- Bullet point on timeline -->
                  <div class="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-white border-4 border-apple-blue flex items-center justify-center"></div>
                  
                  <div class="bg-[#fafafc] rounded-2xl p-5 border border-[#e2e2e4]/60 space-y-3 hover:shadow-sm transition-all duration-300">
                    <div class="flex justify-between items-start flex-wrap gap-2">
                      <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs select-none">
                          ${item.ten_giao_vien ? item.ten_giao_vien.charAt(0) : 'G'}
                        </div>
                        <div>
                          <span class="font-bold text-slate-800 text-xs block">GV: ${item.ten_giao_vien || 'Giáo viên trung tâm'}</span>
                          <span class="text-[9px] text-slate-400 block">${createdTime} - ${createdDate}</span>
                        </div>
                      </div>
                      <span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600">
                        ${item.so_phut_hoc} phút học
                      </span>
                    </div>

                    <!-- Nội dung bài học -->
                    <div class="space-y-1">
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bài học / Nội dung đã dạy:</span>
                      <p class="text-xs text-slate-700 font-medium leading-relaxed bg-white border border-slate-100 rounded-xl p-3">${item.noi_dung_bai_hoc || 'Không ghi nhận nội dung.'}</p>
                    </div>

                    <!-- Nhận xét học viên -->
                    <div class="space-y-1">
                      <span class="text-[10px] font-bold text-[#0066cc]/70 uppercase tracking-wider block">Nhận xét buổi học:</span>
                      <p class="text-xs text-slate-700 leading-relaxed bg-[#f6faff] border border-blue-50 rounded-xl p-3 italic">"${item.nhan_xet_buoi_hoc || 'Học viên chú ý lắng nghe giảng bài và phát biểu xây dựng bài.'}"</p>
                    </div>

                    <!-- Bài tập về nhà -->
                    ${item.bai_tap_ve_nha ? `
                      <div class="space-y-1 bg-amber-50/30 border border-amber-100/50 rounded-xl p-3">
                        <span class="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                          <span class="material-symbols-outlined text-[13px]">assignment</span>Bài tập về nhà:
                        </span>
                        <p class="text-xs text-slate-600 leading-relaxed pl-4 font-medium">${item.bai_tap_ve_nha}</p>
                      </div>
                    ` : ''}

                    <!-- Dặn dò thêm -->
                    ${item.dan_do_giao_vien ? `
                      <div class="text-[10px] text-slate-400 flex items-center gap-1.5 pt-1">
                        <span class="material-symbols-outlined text-[14px]">info</span>
                        <span>Dặn dò thêm: ${item.dan_do_giao_vien}</span>
                      </div>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('')}

            ${diaries.length === 0 ? `
              <div class="py-8 text-center text-slate-400 text-xs">
                <span class="material-symbols-outlined text-[36px] text-slate-300 block mb-1">history</span>
                Chưa có nhật ký học tập hoặc sổ liên lạc điện tử nào được ghi nhận cho học viên này.
              </div>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Modal Viết nhận xét sổ liên lạc mới -->
      <div id="diary-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm hidden flex items-center justify-center z-50 animate-fadeIn">
        <div class="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
          <div class="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
            <h3 class="font-bold text-slate-800 text-sm uppercase tracking-wider">Tạo Nhật ký & Sổ liên lạc mới</h3>
            <button id="close-diary-modal" class="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-all">
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          
          <form id="create-diary-form" class="p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-70px)]">
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Chọn học viên</label>
                <select name="hoc_vien_id" id="modal-select-student" required class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-apple-blue outline-none transition-all">
                  <option value="">-- Chọn học viên --</option>
                  ${students.map(s => `<option value="${s.id}" ${s.id === studentId ? 'selected' : ''}>${s.ho_ten}</option>`).join('')}
                </select>
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Số phút học</label>
                <input type="number" name="so_phut_hoc" value="90" required class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-apple-blue outline-none transition-all" />
              </div>
            </div>

            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nội dung bài học</label>
              <textarea name="noi_dung_bai_hoc" required rows="2" placeholder="Ví dụ: Ôn tập ngữ pháp thì Hiện tại hoàn thành, luyện nói theo nhóm..." class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-apple-blue outline-none transition-all resize-none"></textarea>
            </div>

            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nhận xét buổi học</label>
              <textarea name="nhan_xet_buoi_hoc" required rows="3" placeholder="Ví dụ: Học viên tiếp thu bài tốt, phản xạ nói lưu loát..." class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-apple-blue outline-none transition-all resize-none"></textarea>
            </div>

            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Bài tập về nhà</label>
              <textarea name="bai_tap_ve_nha" rows="2" placeholder="Ví dụ: Làm bài tập trang 45 sách giáo khoa..." class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-apple-blue outline-none transition-all resize-none"></textarea>
            </div>

            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Dặn dò / Ghi chú thêm</label>
              <input type="text" name="dan_do_giao_vien" placeholder="Ví dụ: Ôn lại từ vựng chuẩn bị kiểm tra 15p buổi tới" class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-apple-blue outline-none transition-all" />
            </div>

            <div class="pt-2 shrink-0">
              <button type="submit" class="w-full bg-gradient-to-r from-apple-blue to-[#007eff] text-white py-2.5 rounded-xl text-xs font-semibold hover:shadow-lg transition-all active:scale-[0.98]">
                Lưu và gửi sổ liên lạc
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Đăng ký các sự kiện
    document.getElementById('btn-refresh-diary')?.addEventListener('click', () => {
      loadDiaryData(container, userRole, students, studentId);
    });

    document.getElementById('select-student-diary')?.addEventListener('change', (e) => {
      const selectedId = parseInt(e.target.value);
      loadDiaryData(container, userRole, students, selectedId);
    });

    const modal = document.getElementById('diary-modal');
    document.getElementById('btn-create-diary')?.addEventListener('click', () => {
      modal.classList.remove('hidden');
    });

    document.getElementById('close-diary-modal')?.addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    // Tạo nhận xét mới
    document.getElementById('create-diary-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const targetHocVienId = parseInt(formData.get('hoc_vien_id'));
      const so_phut_hoc = parseInt(formData.get('so_phut_hoc'));
      const noi_dung_bai_hoc = formData.get('noi_dung_bai_hoc');
      const nhan_xet_buoi_hoc = formData.get('nhan_xet_buoi_hoc');
      const bai_tap_ve_nha = formData.get('bai_tap_ve_nha');
      const dan_do_giao_vien = formData.get('dan_do_giao_vien');
      const gvId = parseInt(localStorage.getItem('hoSoId')) || parseInt(localStorage.getItem('userId')) || 2;

      try {
        const res = await fetch(`${API_BASE}/reports`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hoc_vien_id: targetHocVienId,
            giao_vien_id: gvId,
            nguoi_gui_id: gvId,
            vai_tro_gui: 'giao_vien',
            loai_nhat_ky: 'giao_vien_dan_do',
            nhan_xet_buoi_hoc,
            bai_tap_ve_nha,
            noi_dung_bai_hoc,
            so_phut_hoc,
            dan_do_giao_vien
          })
        });

        const result = await res.json();
        if (result.success) {
          showToast('Tạo sổ liên lạc thành công!');
          modal.classList.add('hidden');
          // Reload lại
          loadDiaryData(container, userRole, students, targetHocVienId);
        } else {
          showToast(result.error || 'Lỗi lưu dữ liệu', 'error');
        }
      } catch (err) {
        showToast('Lỗi máy chủ', 'error');
      }
    });

  } catch (err) {
    container.innerHTML = `
      <div class="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-xs">
        <strong>Lỗi tải sổ liên lạc:</strong> ${err.message}
      </div>
    `;
  }
}
