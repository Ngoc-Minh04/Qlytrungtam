// LessonDiary.js - Nhật ký học tập & Sổ liên lạc điện tử
import { showToast } from './_shared.js';
const API_BASE = 'http://localhost:3006/api';

export async function renderLessonDiary(container) {
  const userRole = localStorage.getItem('userRole') || 'hoc_vien';
  const hoSoId = localStorage.getItem('hoSoId') || localStorage.getItem('taiKhoanId') || '';

  container.innerHTML = `
    <div class="flex items-center justify-center min-h-[300px]">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-apple-blue"></div>
    </div>
  `;

  // Tab switcher ở đầu trang
  let activeTab = 'diary';

  async function renderWrapper() {
    container.innerHTML = `
      <div class="space-y-6">
        <!-- Tab pills Premium Segmented Control -->
        <div class="inline-flex bg-slate-100/80 p-0.5 rounded-full border border-slate-200/50 select-none backdrop-blur-sm">
          <button data-lt="diary" class="lt-tab px-5 py-1.5 rounded-full text-xs font-bold transition-all relative outline-none flex items-center gap-1.5" type="button">
            <span class="material-symbols-outlined text-[15px]">menu_book</span> Sổ liên lạc
          </button>
          <button data-lt="notes" class="lt-tab px-5 py-1.5 rounded-full text-xs font-bold transition-all relative outline-none flex items-center gap-1.5" type="button">
            <span class="material-symbols-outlined text-[15px]">sticky_note_2</span> Ghi chú dặn dò GV
          </button>
        </div>
        <div id="lt-content" class="space-y-6"></div>
      </div>`;
 
    container.querySelectorAll('.lt-tab').forEach(btn => {
      const type = btn.dataset.lt;
      if (activeTab === type) {
        btn.className = 'lt-tab px-5 py-1.5 rounded-full text-xs font-bold transition-all relative outline-none bg-white text-slate-800 shadow-sm border border-slate-200/20 flex items-center gap-1.5';
      } else {
        btn.className = 'lt-tab px-5 py-1.5 rounded-full text-xs font-bold transition-all relative outline-none text-slate-500 hover:text-slate-700 flex items-center gap-1.5';
      }
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
    content.innerHTML = `<div class="flex items-center justify-center py-10"><div class="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0071e3]"></div></div>`;
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
      content.innerHTML = `<div class="bg-red-50 border border-red-100 text-red-700 rounded-[20px] p-4 text-xs"><strong>Lỗi:</strong> ${err.message}</div>`;
    }
  }
 
  async function _loadNotesTab() {
    const content = document.getElementById('lt-content');
    content.innerHTML = `<div class="flex items-center justify-center py-10"><div class="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0071e3]"></div></div>`;
    try {
      const headers = { 'x-user-role': userRole, 'x-ho-so-id': hoSoId };
      const [stdRes, notesRes] = await Promise.all([
        fetch(`${API_BASE}/students`, { headers }),
        fetch(`${API_BASE}/notes`, { headers })
      ]);
      const students = (await stdRes.json()).data || [];
      let notes = (await notesRes.json()).data || [];
      let filterStudentId = '';
 
      function renderNotes(list) {
        if (list.length === 0) return `<div class="py-12 text-center text-xs text-slate-400"><span class="material-symbols-outlined text-4xl text-slate-200 block mb-2">sticky_note_2</span>Chưa có ghi chú dặn dò nào</div>`;
        return list.map(n => {
          const showActionBtns = (userRole === 'admin' || userRole === 'le_tan' || String(n.giao_vien_id) === String(hoSoId));
          return `
          <div class="flex gap-3.5 p-5 bg-amber-50/15 border border-amber-200/25 rounded-2xl relative group shadow-sm hover:shadow-md transition-all duration-300">
            <div class="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <span class="material-symbols-outlined text-amber-600 text-[18px]">sticky_note_2</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2 mb-1.5">
                <p class="text-xs font-bold text-slate-800">GV: ${n.ten_giao_vien || '—'} <span class="text-slate-400 font-medium">→</span> HV: ${n.ten_hoc_vien || '—'}</p>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <p class="text-[9px] text-slate-400 font-medium">${new Date(n.ngay_tao).toLocaleDateString('vi-VN')}</p>
                  ${showActionBtns ? `
                    <button class="btn-edit-note text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-0.5 rounded-full transition-all" data-id="${n.id}" title="Sửa ghi chú">
                      <span class="material-symbols-outlined text-[14px] block">edit</span>
                    </button>
                    <button class="btn-delete-note text-red-500 hover:text-red-700 hover:bg-red-50 p-0.5 rounded-full transition-all" data-id="${n.id}" title="Xóa ghi chú">
                      <span class="material-symbols-outlined text-[14px] block">delete</span>
                    </button>
                  ` : ''}
                </div>
              </div>
              <p class="text-xs text-slate-650 leading-relaxed font-medium">${n.noi_dung}</p>
            </div>
          </div>`;
        }).join('');
      }

      function bindNoteActionEvents() {
        // Sự kiện Sửa dặn dò
        content.querySelectorAll('.btn-edit-note').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            const item = notes.find(n => n.id === id);
            if (item) {
              document.getElementById('edit-note-id').value = item.id;
              document.getElementById('edit-note-content').value = item.noi_dung || '';
              document.getElementById('edit-note-modal').classList.remove('hidden');
            }
          });
        });

        // Sự kiện Xóa dặn dò
        content.querySelectorAll('.btn-delete-note').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            if (confirm('Bạn có chắc chắn muốn xóa ghi chú dặn dò này không?')) {
              try {
                const res = await fetch(`${API_BASE}/notes/${id}`, {
                  method: 'DELETE',
                  headers: { 'x-user-role': userRole, 'x-ho-so-id': hoSoId }
                });
                const result = await res.json();
                if (result.success) {
                  showToast('Xóa ghi chú dặn dò thành công!');
                  // Tải lại danh sách notes
                  const url = filterStudentId
                    ? `${API_BASE}/notes?hoc_vien_id=${filterStudentId}`
                    : `${API_BASE}/notes`;
                  const updatedRes = await fetch(url, { headers });
                  notes = (await updatedRes.json()).data || [];
                  document.getElementById('notes-list').innerHTML = renderNotes(notes);
                  bindNoteActionEvents();
                } else {
                  showToast(result.error || 'Lỗi khi xóa ghi chú', 'error');
                }
              } catch (err) {
                showToast('Lỗi máy chủ', 'error');
              }
            }
          });
        });
      }

      content.innerHTML = `
        <div class="space-y-4">
          <div class="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 shadow-sm">
            <span class="material-symbols-outlined text-[#0071e3]">filter_list</span>
            <select id="notes-filter-student" class="border border-slate-200 rounded-full px-4 py-2 text-xs focus:border-[#0071e3] outline-none transition-all w-full sm:w-64 font-bold text-slate-700 bg-white cursor-pointer">
              <option value="">Tất cả học viên</option>
              ${students.map(s => `<option value="${s.id}">${s.ho_ten} (${s.ma_ho_so})</option>`).join('')}
            </select>
            
            ${(userRole === 'admin' || userRole === 'le_tan' || userRole === 'giao_vien') ? `
              <button id="btn-create-note" class="flex items-center justify-center gap-1.5 px-4.5 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold rounded-full transition-all active:scale-95 shadow-sm h-[34px] sm:ml-2">
                <span class="material-symbols-outlined text-[16px]">add_comment</span>Thêm dặn dò
              </button>
            ` : ''}
            
            <span class="text-[10px] text-slate-400 font-bold ml-auto" id="notes-count-badge">${notes.length} ghi chú</span>
          </div>
          <div id="notes-list" class="space-y-3">${renderNotes(notes)}</div>
        </div>
        
        <!-- Modal Thêm dặn dò mới -->
        <div id="note-modal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-md hidden flex items-center justify-center z-50 animate-fadeIn">
          <div class="bg-white rounded-[28px] w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]" style="animation: modalIn 0.2s ease">
            <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 class="font-bold text-slate-800 text-sm tracking-wide">Tạo dặn dò / Ghi chú mới</h3>
              <button id="close-note-modal" class="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-all">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <form id="create-note-form" class="p-6 space-y-4 text-xs overflow-y-auto">
              <div class="space-y-1.5">
                <label class="font-semibold text-slate-500 block">Chọn học viên</label>
                <select name="hoc_vien_id" id="modal-note-select-student" required class="w-full border border-slate-200 rounded-full px-4 py-2.5 outline-none focus:border-[#0071e3] transition-all bg-slate-50/50 cursor-pointer">
                  <option value="">-- Chọn học viên --</option>
                  ${students.map(s => `<option value="${s.id}">${s.ho_ten} (${s.ma_ho_so})</option>`).join('')}
                </select>
              </div>

              <div class="space-y-1.5">
                <label class="font-semibold text-slate-500 block">Nội dung dặn dò / Ghi chú</label>
                <textarea name="noi_dung" required rows="4" placeholder="Nhập nội dung dặn dò hoặc lưu ý cho học viên..." class="w-full border border-slate-200 rounded-[20px] px-4 py-3 outline-none focus:border-[#0071e3] transition-all bg-slate-50/50 resize-none"></textarea>
              </div>

              <div class="pt-3 shrink-0">
                <button type="submit" class="w-full bg-[#0071e3] hover:bg-[#0077ed] text-white py-3 rounded-full font-bold hover:shadow-lg transition-all active:scale-[0.98]">
                  Lưu dặn dò
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Modal Chỉnh sửa dặn dò -->
        <div id="edit-note-modal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-md hidden flex items-center justify-center z-50 animate-fadeIn">
          <div class="bg-white rounded-[28px] w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]" style="animation: modalIn 0.2s ease">
            <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 class="font-bold text-slate-800 text-sm tracking-wide">Chỉnh sửa dặn dò / Ghi chú</h3>
              <button id="close-edit-note-modal" class="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-all">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <form id="edit-note-form" class="p-6 space-y-4 text-xs overflow-y-auto">
              <input type="hidden" name="note_id" id="edit-note-id" />
              <div class="space-y-1.5">
                <label class="font-semibold text-slate-500 block">Nội dung dặn dò / Ghi chú</label>
                <textarea name="noi_dung" id="edit-note-content" required rows="4" class="w-full border border-slate-200 rounded-[20px] px-4 py-3 outline-none focus:border-[#0071e3] transition-all bg-slate-50/50 resize-none"></textarea>
              </div>

              <div class="pt-3 shrink-0">
                <button type="submit" class="w-full bg-[#0071e3] hover:bg-[#0077ed] text-white py-3 rounded-full font-bold hover:shadow-lg transition-all active:scale-[0.98]">
                  Cập nhật dặn dò
                </button>
              </div>
            </form>
          </div>
        </div>
      `;

      bindNoteActionEvents();

      // Sự kiện mở/đóng modal note
      const noteModal = document.getElementById('note-modal');
      document.getElementById('btn-create-note')?.addEventListener('click', () => {
        if (filterStudentId) {
          document.getElementById('modal-note-select-student').value = filterStudentId;
        }
        noteModal.classList.remove('hidden');
      });
      document.getElementById('close-note-modal')?.addEventListener('click', () => {
        noteModal.classList.add('hidden');
      });
      document.getElementById('close-edit-note-modal')?.addEventListener('click', () => {
        document.getElementById('edit-note-modal').classList.add('hidden');
      });

      // Submit form tạo dặn dò
      document.getElementById('create-note-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const targetHocVienId = parseInt(formData.get('hoc_vien_id'));
        const noi_dung = formData.get('noi_dung');

        try {
          const res = await fetch(`${API_BASE}/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify({
              hoc_vien_id: targetHocVienId,
              noi_dung
            })
          });
          const result = await res.json();
          if (result.success) {
            showToast('Thêm ghi chú dặn dò thành công!');
            noteModal.classList.add('hidden');
            e.target.reset();
            
            // Tải lại danh sách
            const url = filterStudentId
              ? `${API_BASE}/notes?hoc_vien_id=${filterStudentId}`
              : `${API_BASE}/notes`;
            const updatedRes = await fetch(url, { headers });
            notes = (await updatedRes.json()).data || [];
            document.getElementById('notes-list').innerHTML = renderNotes(notes);
            document.getElementById('notes-count-badge').textContent = `${notes.length} ghi chú`;
            bindNoteActionEvents();
          } else {
            showToast(result.error || 'Lỗi lưu dữ liệu', 'error');
          }
        } catch (err) {
          showToast('Lỗi kết nối máy chủ', 'error');
        }
      });

      // Submit form Sửa dặn dò
      document.getElementById('edit-note-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const noteId = document.getElementById('edit-note-id').value;
        const noi_dung = document.getElementById('edit-note-content').value.trim();

        try {
          const res = await fetch(`${API_BASE}/notes/${noteId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify({ noi_dung })
          });
          const result = await res.json();
          if (result.success) {
            showToast('Cập nhật ghi chú dặn dò thành công!');
            document.getElementById('edit-note-modal').classList.add('hidden');
            
            // Tải lại danh sách
            const url = filterStudentId
              ? `${API_BASE}/notes?hoc_vien_id=${filterStudentId}`
              : `${API_BASE}/notes`;
            const updatedRes = await fetch(url, { headers });
            notes = (await updatedRes.json()).data || [];
            document.getElementById('notes-list').innerHTML = renderNotes(notes);
            bindNoteActionEvents();
          } else {
            showToast(result.error || 'Lỗi cập nhật', 'error');
          }
        } catch (err) {
          showToast('Lỗi kết nối máy chủ', 'error');
        }
      });

      document.getElementById('notes-filter-student')?.addEventListener('change', async e => {
        filterStudentId = e.target.value;
        const url = filterStudentId
          ? `${API_BASE}/notes?hoc_vien_id=${filterStudentId}`
          : `${API_BASE}/notes`;
        const filtered = await (await fetch(url, { headers })).json();
        const list = filtered.data || [];
        document.getElementById('notes-list').innerHTML = renderNotes(list);
        document.getElementById('notes-count-badge').textContent = `${list.length} ghi chú`;
        bindDeleteEvents();
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
            <h3 class="font-bold text-slate-800 text-sm tracking-tight">Sổ liên lạc học tập</h3>
            <p class="text-[11px] text-slate-400 mt-0.5">Theo dõi chi tiết nhật ký học tập và đánh giá sự tiến bộ của từng buổi học</p>
          </div>
          <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
            <!-- Nút Tải lại đồng bộ thiết kế -->
            <button id="btn-refresh-diary" class="flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-xs font-semibold rounded-full transition-all active:scale-95 shadow-sm h-[34px]">
              <span class="material-symbols-outlined text-[16px]">refresh</span>Tải lại
            </button>
            
            ${(userRole === 'admin' || userRole === 'giao_vien' || userRole === 'le_tan') ? `
              <button id="btn-create-diary" class="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold rounded-full transition-all active:scale-95 shadow-sm h-[34px]">
                <span class="material-symbols-outlined text-[16px]">rate_review</span>Viết nhận xét
              </button>
            ` : ''}
          </div>
        </div>
 
        <!-- Bộ chọn học viên (chỉ dành cho Admin, Lễ tân, Giáo viên) -->
        ${(userRole === 'admin' || userRole === 'le_tan' || userRole === 'giao_vien') ? `
          <div class="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[#0071e3]">person_search</span>
              <span class="text-xs font-bold text-slate-700">Tra cứu sổ liên lạc của học viên:</span>
            </div>
            <select id="select-student-diary" class="border border-slate-200 rounded-full px-4 py-2 text-xs focus:border-[#0071e3] outline-none transition-all w-full sm:w-64 font-bold text-slate-700 bg-white cursor-pointer">
              ${students.map(s => `
                <option value="${s.id}" ${s.id === studentId ? 'selected' : ''}>${s.ho_ten} (${s.ma_ho_so})</option>
              `).join('')}
            </select>
          </div>
        ` : ''}
 
        <!-- Timeline Nhật ký / Sổ liên lạc -->
        <div class="bg-white border border-slate-150 rounded-2xl p-6 shadow-sm space-y-6">
          <div class="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 class="font-bold text-slate-800 text-sm">Lịch sử nhận xét của: <span class="text-[#0071e3]">${studentName}</span></h3>
            <span class="text-[10px] bg-blue-50 text-[#0071e3] px-2 py-0.5 rounded-full font-bold">${diaries.length} Nhật ký</span>
          </div>
 
          <div class="relative pl-6 border-l border-slate-100 space-y-8">
            ${diaries.map(item => {
      const createdDate = new Date(item.ngay_tao).toLocaleDateString('vi-VN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      const createdTime = new Date(item.ngay_tao).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      return `
                <!-- Timeline Item -->
                <div class="relative">
                  <!-- Bullet point on timeline -->
                  <div class="absolute -left-[30px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#0071e3] ring-4 ring-blue-50"></div>
                  
                  <div class="bg-slate-50/40 rounded-2xl p-5 border border-slate-150/40 space-y-3 hover:shadow-md transition-all duration-300">
                    <div class="flex justify-between items-start flex-wrap gap-2">
                      <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-full bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center font-bold text-xs select-none">
                          ${item.ten_giao_vien ? item.ten_giao_vien.charAt(0) : 'G'}
                        </div>
                        <div>
                          <span class="font-bold text-slate-800 text-xs block">
                            ${item.chuc_vu_nguoi_gui === 'Nhân viên' || item.chuc_vu_nguoi_gui === 'Lễ tân' ? 'NV' : (item.chuc_vu_nguoi_gui === 'Quản lý' || item.chuc_vu_nguoi_gui === 'Admin' || item.chuc_vu_nguoi_gui === 'Quản trị viên' ? 'QL' : 'GV')}: ${item.ten_giao_vien || 'Giáo viên trung tâm'}
                          </span>
                          <span class="text-[9px] text-slate-400 block">${createdTime} - ${createdDate}</span>
                        </div>
                      </div>
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600">
                          ${item.so_phut_hoc} phút học
                        </span>
                        ${(userRole === 'admin' || userRole === 'giao_vien' || userRole === 'le_tan') ? `
                          <button class="btn-edit-diary text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1 rounded-full transition-all" data-id="${item.id}" title="Sửa nhận xét">
                            <span class="material-symbols-outlined text-[15px] block">edit</span>
                          </button>
                          <button class="btn-delete-diary text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-all" data-id="${item.id}" title="Xóa nhận xét">
                            <span class="material-symbols-outlined text-[15px] block">delete</span>
                          </button>
                        ` : ''}
                      </div>
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
      <div id="diary-modal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-md hidden flex items-center justify-center z-50 animate-fadeIn">
        <div class="bg-white rounded-[28px] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]" style="animation: modalIn 0.2s ease">
          <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center shrink-0">
            <h3 class="font-bold text-slate-800 text-sm tracking-wide">Tạo Nhật ký & Sổ liên lạc mới</h3>
            <button id="close-diary-modal" class="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-all">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          
          <form id="create-diary-form" class="p-6 space-y-4 text-xs overflow-y-auto max-h-[calc(90vh-70px)]">
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <label class="font-semibold text-slate-500 block">Chọn học viên</label>
                <select name="hoc_vien_id" id="modal-select-student" required class="w-full border border-slate-200 rounded-full px-4 py-2.5 outline-none focus:border-[#0071e3] transition-all bg-slate-50/50 cursor-pointer">
                  <option value="">-- Chọn học viên --</option>
                  ${students.map(s => `<option value="${s.id}" ${s.id === studentId ? 'selected' : ''}>${s.ho_ten}</option>`).join('')}
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="font-semibold text-slate-500 block">Số phút học</label>
                <input type="number" name="so_phut_hoc" value="90" required class="w-full border border-slate-200 rounded-full px-4 py-2.5 outline-none focus:border-[#0071e3] transition-all bg-slate-50/50" />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="font-semibold text-slate-500 block">Nội dung bài học</label>
              <textarea name="noi_dung_bai_hoc" required rows="2" placeholder="Ví dụ: Ôn tập ngữ pháp thì Hiện tại hoàn thành, luyện nói theo nhóm..." class="w-full border border-slate-200 rounded-[20px] px-4 py-3 outline-none focus:border-[#0071e3] transition-all bg-slate-50/50 resize-none"></textarea>
            </div>

            <div class="space-y-1.5">
              <label class="font-semibold text-slate-500 block">Nhận xét buổi học</label>
              <textarea name="nhan_xet_buoi_hoc" required rows="3" placeholder="Ví dụ: Học viên tiếp thu bài tốt, phản xạ nói lưu loát..." class="w-full border border-slate-200 rounded-[20px] px-4 py-3 outline-none focus:border-[#0071e3] transition-all bg-slate-50/50 resize-none"></textarea>
            </div>

            <div class="space-y-1.5">
              <label class="font-semibold text-slate-500 block">Bài tập về nhà</label>
              <textarea name="bai_tap_ve_nha" rows="2" placeholder="Ví dụ: Làm bài tập trang 45 sách giáo khoa..." class="w-full border border-slate-200 rounded-[20px] px-4 py-3 outline-none focus:border-[#0071e3] transition-all bg-slate-50/50 resize-none"></textarea>
            </div>

            <div class="space-y-1.5">
              <label class="font-semibold text-slate-500 block">Dặn dò / Ghi chú thêm</label>
              <input type="text" name="dan_do_giao_vien" placeholder="Ví dụ: Ôn lại từ vựng chuẩn bị kiểm tra 15p buổi tới" class="w-full border border-slate-200 rounded-full px-4 py-2.5 outline-none focus:border-[#0071e3] transition-all bg-slate-50/50" />
            </div>

            <div class="pt-3 shrink-0">
              <button type="submit" class="w-full bg-[#0071e3] hover:bg-[#0077ed] text-white py-3 rounded-full font-bold hover:shadow-lg transition-all active:scale-[0.98]">
                Lưu và gửi sổ liên lạc
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal Chỉnh sửa nhận xét sổ liên lạc -->
      <div id="edit-diary-modal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-md hidden flex items-center justify-center z-50 animate-fadeIn">
        <div class="bg-white rounded-[28px] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]" style="animation: modalIn 0.2s ease">
          <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center shrink-0">
            <h3 class="font-bold text-slate-800 text-sm tracking-wide">Chỉnh sửa Nhật ký & Sổ liên lạc</h3>
            <button id="close-edit-diary-modal" class="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-all">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          
          <form id="edit-diary-form" class="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-70px)] text-xs">
            <input type="hidden" name="diary_id" id="edit-diary-id" />
            <div class="space-y-1.5">
              <label class="font-semibold text-slate-500 block">Số phút học</label>
              <input type="number" name="so_phut_hoc" id="edit-diary-so-phut-hoc" required class="w-full border border-slate-200 rounded-full px-4 py-2.5 outline-none focus:border-[#0071e3] transition-all bg-slate-50/50" />
            </div>

            <div class="space-y-1.5">
              <label class="font-semibold text-slate-500 block">Nội dung bài học</label>
              <textarea name="noi_dung_bai_hoc" id="edit-diary-noi-dung-bai-hoc" required rows="2" class="w-full border border-slate-200 rounded-[20px] px-4 py-3 outline-none focus:border-[#0071e3] transition-all bg-slate-50/50 resize-none"></textarea>
            </div>

            <div class="space-y-1.5">
              <label class="font-semibold text-slate-500 block">Nhận xét buổi học</label>
              <textarea name="nhan_xet_buoi_hoc" id="edit-diary-nhan-xet-buoi-hoc" required rows="3" class="w-full border border-slate-200 rounded-[20px] px-4 py-3 outline-none focus:border-[#0071e3] transition-all bg-slate-50/50 resize-none"></textarea>
            </div>

            <div class="space-y-1.5">
              <label class="font-semibold text-slate-500 block">Bài tập về nhà</label>
              <textarea name="bai_tap_ve_nha" id="edit-diary-bai-tap-ve-nha" rows="2" class="w-full border border-slate-200 rounded-[20px] px-4 py-3 outline-none focus:border-[#0071e3] transition-all bg-slate-50/50 resize-none"></textarea>
            </div>

            <div class="space-y-1.5">
              <label class="font-semibold text-slate-500 block">Dặn dò / Ghi chú thêm</label>
              <input type="text" name="dan_do_giao_vien" id="edit-diary-dan-do-giao-vien" class="w-full border border-slate-200 rounded-full px-4 py-2.5 outline-none focus:border-[#0071e3] transition-all bg-slate-50/50" />
            </div>

            <div class="pt-3 shrink-0">
              <button type="submit" class="w-full bg-[#0071e3] hover:bg-[#0077ed] text-white py-3 rounded-full font-bold hover:shadow-lg transition-all active:scale-[0.98]">
                Cập nhật sổ liên lạc
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
      const gvId = parseInt(localStorage.getItem('hoSoId')) || parseInt(localStorage.getItem('taiKhoanId')) || 2;

      try {
        const res = await fetch(`${API_BASE}/reports`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hoc_vien_id: targetHocVienId,
            giao_vien_id: gvId,
            nguoi_gui_id: gvId,
            vai_tro_gui: userRole,
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

    // Sự kiện Sửa nhận xét
    container.querySelectorAll('.btn-edit-diary').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        const item = diaries.find(d => d.id === id);
        if (item) {
          document.getElementById('edit-diary-id').value = item.id;
          document.getElementById('edit-diary-so-phut-hoc').value = item.so_phut_hoc || 90;
          document.getElementById('edit-diary-noi-dung-bai-hoc').value = item.noi_dung_bai_hoc || '';
          document.getElementById('edit-diary-nhan-xet-buoi-hoc').value = item.nhan_xet_buoi_hoc || '';
          document.getElementById('edit-diary-bai-tap-ve-nha').value = item.bai_tap_ve_nha || '';
          document.getElementById('edit-diary-dan-do-giao-vien').value = item.dan_do_giao_vien || '';
          document.getElementById('edit-diary-modal').classList.remove('hidden');
        }
      });
    });

    document.getElementById('close-edit-diary-modal')?.addEventListener('click', () => {
      document.getElementById('edit-diary-modal').classList.add('hidden');
    });

    // Submit form Sửa nhận xét
    document.getElementById('edit-diary-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const diaryId = document.getElementById('edit-diary-id').value;
      const formData = new FormData(e.target);
      const so_phut_hoc = parseInt(formData.get('so_phut_hoc'));
      const noi_dung_bai_hoc = formData.get('noi_dung_bai_hoc');
      const nhan_xet_buoi_hoc = formData.get('nhan_xet_buoi_hoc');
      const bai_tap_ve_nha = formData.get('bai_tap_ve_nha');
      const dan_do_giao_vien = formData.get('dan_do_giao_vien');

      try {
        const res = await fetch(`${API_BASE}/reports/${diaryId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nhan_xet_buoi_hoc,
            bai_tap_ve_nha,
            noi_dung_bai_hoc,
            so_phut_hoc,
            dan_do_giao_vien
          })
        });

        const result = await res.json();
        if (result.success) {
          showToast('Cập nhật nhận xét thành công!');
          document.getElementById('edit-diary-modal').classList.add('hidden');
          loadDiaryData(container, userRole, students, studentId);
        } else {
          showToast(result.error || 'Lỗi khi cập nhật', 'error');
        }
      } catch (err) {
        showToast('Lỗi kết nối máy chủ', 'error');
      }
    });

    // Sự kiện Xóa nhận xét
    container.querySelectorAll('.btn-delete-diary').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.id);
        if (confirm('Bạn có chắc chắn muốn xóa nhận xét này không?')) {
          try {
            const res = await fetch(`${API_BASE}/reports/${id}`, {
              method: 'DELETE'
            });
            const result = await res.json();
            if (result.success) {
              showToast('Xóa nhận xét thành công!');
              loadDiaryData(container, userRole, students, studentId);
            } else {
              showToast(result.error || 'Lỗi khi xóa', 'error');
            }
          } catch (err) {
            showToast('Lỗi máy chủ', 'error');
          }
        }
      });
    });

  } catch (err) {
    container.innerHTML = `
      <div class="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-xs">
        <strong>Lỗi tải sổ liên lạc:</strong> ${err.message}
      </div>
    `;
  }
}
