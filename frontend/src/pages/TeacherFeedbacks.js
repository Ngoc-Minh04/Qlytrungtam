// TeacherFeedbacks.js - Đánh giá Giáo viên
export async function renderTeacherFeedbacks(container) {
  container.innerHTML = `
    <div class="space-y-4">
      <div class="bg-apple-white rounded-[18px] p-6 border border-apple-divider space-y-4">
        <h3 class="font-bold text-apple-ink text-sm uppercase tracking-wider">Đánh giá giáo viên</h3>
        <div class="bg-apple-parchment rounded-[18px] p-8 text-center text-slate-500 text-xs border border-dashed border-apple-divider">
          Danh sách xếp hạng sao và phản hồi từ phụ huynh.
        </div>
      </div>
    </div>
  `;
}
