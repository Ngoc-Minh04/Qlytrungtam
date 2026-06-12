// AttendanceStaff.js - Bảng Chấm công
export async function renderAttendanceStaff(container) {
  container.innerHTML = `
    <div class="space-y-4">
      <div class="bg-apple-white rounded-[18px] p-6 border border-apple-divider space-y-4">
        <h3 class="font-bold text-apple-ink text-sm uppercase tracking-wider">Bảng chấm công nhân sự & giáo viên</h3>
        <div class="bg-apple-parchment rounded-[18px] p-8 text-center text-slate-500 text-xs border border-dashed border-apple-divider">
          Dữ liệu đồng bộ máy chấm công và quét thẻ vân tay tự động.
        </div>
      </div>
    </div>
  `;
}
