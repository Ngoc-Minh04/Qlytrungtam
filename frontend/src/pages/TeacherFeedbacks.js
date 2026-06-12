// TeacherFeedbacks.js - Đánh giá Giáo viên từ Học viên & Phụ huynh
const API_BASE = '/api';

export async function renderTeacherFeedbacks(container) {
  const userRole = localStorage.getItem('userRole') || 'hoc_vien';
  const userId = localStorage.getItem('userId') || '1';

  container.innerHTML = `
    <div class="flex items-center justify-center min-h-[300px]">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-apple-blue"></div>
    </div>
  `;

  try {
    // Tải danh sách giáo viên để hiển thị hoặc lọc
    const teachersRes = await fetch(`${API_BASE}/teachers`);
    const teachersData = await teachersRes.json();
    const teachers = teachersData.data || [];

    // Tạo mock data đánh giá giáo viên cao cấp
    const mockFeedbacks = [
      {
        id: 1,
        teacherId: teachers[0]?.id || 1,
        teacherName: teachers[0]?.ho_ten || 'Nguyễn Văn A',
        studentName: 'HV Nguyễn Hoàng Nam',
        rating: 5,
        comment: 'Thầy dạy cực kỳ nhiệt tình, dễ hiểu và sửa phát âm rất kỹ. Em tiến bộ rõ rệt sau 1 tháng học kèm.',
        date: '12/06/2026'
      },
      {
        id: 2,
        teacherId: teachers[0]?.id || 1,
        teacherName: teachers[0]?.ho_ten || 'Nguyễn Văn A',
        studentName: 'Phụ huynh bé Mai Anh',
        rating: 5,
        comment: 'Cô rất quan tâm đến các con. Có báo cáo chi tiết sau mỗi buổi học nên gia đình rất an tâm.',
        date: '11/06/2026'
      },
      {
        id: 3,
        teacherId: teachers[1]?.id || 2,
        teacherName: teachers[1]?.ho_ten || 'Trần Thị B',
        studentName: 'HV Lê Minh Triết',
        rating: 4,
        comment: 'Phương pháp dạy hiện đại, tương tác nhiều. Đôi lúc bài tập hơi nhiều một chút nhưng rất hiệu quả.',
        date: '10/06/2026'
      },
      {
        id: 4,
        teacherId: teachers[2]?.id || 3,
        teacherName: teachers[2]?.ho_ten || 'Phạm Thanh C',
        studentName: 'HV Vũ Thu Hà',
        rating: 5,
        comment: 'Thầy giáo siêu hài hước, học không bị áp lực. Kiến thức chuyên môn của thầy rất vững vàng.',
        date: '08/06/2026'
      }
    ];

    await renderFeedbacksUI(container, userRole, teachers, mockFeedbacks);

  } catch (err) {
    container.innerHTML = `
      <div class="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-xs">
        <strong>Lỗi tải đánh giá giáo viên:</strong> ${err.message}
      </div>
    `;
  }
}

async function renderFeedbacksUI(container, userRole, teachers, feedbacks) {
  // Tính toán số sao trung bình và phân bố sao
  const totalFeedbacks = feedbacks.length;
  const avgRating = totalFeedbacks > 0 
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks).toFixed(1)
    : '5.0';

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  feedbacks.forEach(f => {
    if (distribution[f.rating] !== undefined) {
      distribution[f.rating]++;
    }
  });

  container.innerHTML = `
    <div class="space-y-6 animate-fadeIn">
      
      <!-- Header Action Row -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 class="text-xl font-bold tracking-tight text-slate-800">Đánh giá & Phản hồi Giáo viên</h2>
          <p class="text-xs text-slate-500">Khảo sát chất lượng giảng dạy từ phụ huynh và học viên định kỳ.</p>
        </div>
        
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <!-- Nút Tải lại đồng bộ thiết kế -->
          <button id="btn-refresh-feedbacks" class="flex items-center justify-center gap-1.5 px-4 py-2 border border-[#e2e2e4] hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-full transition-all active:scale-95 shadow-sm h-[32px]">
            <span class="material-symbols-outlined text-[16px]">refresh</span>Tải lại
          </button>
          
          ${userRole === 'hoc_vien' ? `
            <button id="btn-add-feedback" class="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-apple-blue to-[#007eff] text-white text-xs font-semibold rounded-full transition-all active:scale-95 shadow-md hover:shadow-lg h-[32px]">
              <span class="material-symbols-outlined text-[16px]">star</span>Gửi đánh giá
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Overview Grid (Bento Style) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <!-- Bento Card 1: Điểm trung bình -->
        <div class="bg-white border border-[#e2e2e4] rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm hover:border-[#0066cc]/50 transition-all duration-300">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Đánh giá chung</span>
          <span class="text-5xl font-extrabold text-slate-800 tracking-tight block">${avgRating}</span>
          
          <!-- Stars Render -->
          <div class="flex items-center gap-0.5 mt-3 text-amber-400">
            ${Array.from({ length: 5 }).map((_, i) => `
              <span class="material-symbols-outlined fill-current text-[20px] ${i < Math.round(parseFloat(avgRating)) ? 'text-amber-400' : 'text-slate-200'}">star</span>
            `).join('')}
          </div>
          
          <span class="text-[10px] text-slate-400 mt-4 block">Dựa trên ${totalFeedbacks} lượt phản hồi học viên</span>
        </div>

        <!-- Bento Card 2: Biểu đồ phân bố sao -->
        <div class="bg-white border border-[#e2e2e4] rounded-2xl p-6 shadow-sm hover:border-[#0066cc]/50 transition-all duration-300 md:col-span-2 space-y-3">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Phân bổ xếp hạng</span>
          
          <div class="space-y-2">
            ${[5, 4, 3, 2, 1].map(star => {
              const count = distribution[star];
              const pct = totalFeedbacks > 0 ? (count / totalFeedbacks) * 100 : 0;
              return `
                <div class="flex items-center text-xs gap-3">
                  <span class="w-10 font-semibold text-slate-600 shrink-0 text-right">${star} sao</span>
                  <div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div class="bg-gradient-to-r from-amber-400 to-amber-300 h-full rounded-full transition-all duration-500" style="width: ${pct}%"></div>
                  </div>
                  <span class="w-8 text-slate-400 font-medium shrink-0 text-left">${count}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>

      <!-- Feedbacks List Section -->
      <div class="bg-white border border-[#e2e2e4] rounded-2xl p-6 shadow-sm space-y-4">
        <div class="border-b border-[#f3f3f5] pb-3 flex justify-between items-center bg-slate-50/20">
          <h3 class="font-bold text-slate-800 text-sm">Tất cả ý kiến & Nhận xét</h3>
          <span class="text-[10px] text-slate-400">Sắp xếp theo thời gian mới nhất</span>
        </div>

        <div id="feedbacks-container" class="space-y-4">
          ${feedbacks.map(item => `
            <div class="border-b border-[#f3f3f5] last:border-0 pb-4 last:pb-0 space-y-2">
              <div class="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <span class="font-bold text-slate-800 text-xs block">${item.studentName}</span>
                  <span class="text-[10px] text-slate-400 block">Đánh giá GV: <strong class="text-slate-600">${item.teacherName}</strong></span>
                </div>
                <div class="flex flex-col items-end gap-1">
                  <div class="flex gap-0.5 text-amber-400">
                    ${Array.from({ length: 5 }).map((_, i) => `
                      <span class="material-symbols-outlined text-[14px] ${i < item.rating ? 'fill-current' : 'text-slate-200'}">star</span>
                    `).join('')}
                  </div>
                  <span class="text-[9px] text-slate-400 block">${item.date}</span>
                </div>
              </div>
              <p class="text-xs text-slate-600 leading-relaxed bg-[#fafafc] border border-slate-100 rounded-xl p-3 font-medium">
                ${item.comment}
              </p>
            </div>
          `).join('')}

          ${feedbacks.length === 0 ? `
            <div class="py-8 text-center text-slate-400 text-xs">
              Chưa có ý kiến phản hồi nào được ghi nhận.
            </div>
          ` : ''}
        </div>
      </div>

    </div>

    <!-- Modal gửi đánh giá giáo viên (dành cho Học viên) -->
    <div id="feedback-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm hidden flex items-center justify-center z-50 animate-fadeIn">
      <div class="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        <div class="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
          <h3 class="font-bold text-slate-800 text-sm uppercase tracking-wider">Gửi phản hồi chất lượng dạy học</h3>
          <button id="close-feedback-modal" class="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-all">
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        
        <form id="create-feedback-form" class="p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-70px)]">
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Chọn Giáo viên muốn đánh giá</label>
            <select name="teacher_id" required class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-apple-blue outline-none transition-all">
              <option value="">-- Chọn Giáo viên --</option>
              ${teachers.map(t => `<option value="${t.id}">${t.ho_ten} (${t.chuyen_mon})</option>`).join('')}
            </select>
          </div>

          <!-- Rating Stars Selector -->
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Số sao đánh giá</label>
            <div class="flex items-center gap-1 text-slate-300 mt-1" id="star-selector">
              ${[1, 2, 3, 4, 5].map(val => `
                <button type="button" data-val="${val}" class="star-btn hover:scale-110 active:scale-95 transition-transform">
                  <span class="material-symbols-outlined text-[28px] pointer-events-none">star</span>
                </button>
              `).join('')}
            </div>
            <input type="hidden" name="rating" id="input-rating-value" value="5" />
          </div>

          <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Ý kiến đóng góp / Phản hồi chi tiết</label>
            <textarea name="comment" required rows="4" placeholder="Nhập những góp ý về phương pháp giảng dạy, thái độ, nội dung bài học..." class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-apple-blue outline-none transition-all resize-none"></textarea>
          </div>

          <div class="pt-2 shrink-0">
            <button type="submit" class="w-full bg-gradient-to-r from-apple-blue to-[#007eff] text-white py-2.5 rounded-xl text-xs font-semibold hover:shadow-lg transition-all active:scale-[0.98]">
              Xác nhận gửi phản hồi
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Đăng ký sự kiện
  document.getElementById('btn-refresh-feedbacks')?.addEventListener('click', () => {
    renderTeacherFeedbacks(container);
  });

  const modal = document.getElementById('feedback-modal');
  document.getElementById('btn-add-feedback')?.addEventListener('click', () => {
    modal.classList.remove('hidden');
  });

  document.getElementById('close-feedback-modal')?.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  // Selector Star Logic
  const starBtns = document.querySelectorAll('.star-btn');
  const ratingInput = document.getElementById('input-rating-value');
  
  function highlightStars(val) {
    starBtns.forEach(btn => {
      const btnVal = parseInt(btn.getAttribute('data-val'));
      const icon = btn.querySelector('span');
      if (btnVal <= val) {
        icon.classList.add('fill-current', 'text-amber-400');
        icon.classList.remove('text-slate-300');
      } else {
        icon.classList.remove('fill-current', 'text-amber-400');
        icon.classList.add('text-slate-300');
      }
    });
  }
  
  highlightStars(5); // Mặc định 5 sao

  starBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const val = parseInt(btn.getAttribute('data-val'));
      ratingInput.value = val;
      highlightStars(val);
    });
  });

  // Gửi feedback
  document.getElementById('create-feedback-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const teacherId = parseInt(formData.get('teacher_id'));
    const rating = parseInt(formData.get('rating'));
    const comment = formData.get('comment');
    
    const selectedTeacher = teachers.find(t => t.id === teacherId);
    
    // Thêm feedback mới vào danh sách đầu
    const newFeedback = {
      id: Date.now(),
      teacherId,
      teacherName: selectedTeacher ? selectedTeacher.ho_ten : 'Giáo viên',
      studentName: 'HV (Tôi)',
      rating,
      comment,
      date: new Date().toLocaleDateString('vi-VN')
    };

    feedbacks.unshift(newFeedback);
    showToast('Cảm ơn bạn đã gửi đánh giá giáo viên!');
    modal.classList.add('hidden');
    
    // Render lại UI với danh sách mới
    renderFeedbacksUI(container, userRole, teachers, feedbacks);
  });
}
