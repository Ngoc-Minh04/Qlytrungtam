// LessonDiary.js - Nhật ký buổi học / Sổ liên lạc
export async function renderLessonDiary(container) {
  container.innerHTML = `
    <div class="space-y-4">
      <div class="bg-apple-white rounded-[18px] p-6 border border-apple-divider space-y-4">
        <h3 class="font-bold text-apple-ink text-sm uppercase tracking-wider">Nhật ký học tập & Sổ liên lạc</h3>
        <div class="bg-apple-parchment rounded-[18px] p-8 text-center text-slate-500 text-xs border border-dashed border-apple-divider">
          Truy cập mục <strong>Tổng quan</strong> (nếu là Giáo viên) để tạo sổ liên lạc cho các học viên trong ngày.
        </div>
      </div>
    </div>
  `;
}
