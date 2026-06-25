// TeacherFeedbacks.js - Đánh giá Giáo viên từ Học viên (API thật)
import { API_BASE, showToast } from './_shared.js';

let _selectedTeacherId = 'all';

export async function renderTeacherFeedbacks(container) {
  const userRole = localStorage.getItem('userRole') || 'admin';
  const hoSoId = localStorage.getItem('hoSoId') || '1';

  container.innerHTML = `
    <div class="flex items-center justify-center min-h-[300px]">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-apple-blue"></div>
    </div>
  `;

  try {
    const [teachersRes, ratingsRes] = await Promise.all([
      fetch(`${API_BASE}/teachers`, { headers: { 'X-User-Role': userRole, 'X-Ho-So-Id': hoSoId } }),
      fetch(`${API_BASE}/ratings`, { headers: { 'X-User-Role': 'admin', 'X-Ho-So-Id': hoSoId } })
    ]);

    const teachersData = await teachersRes.json();
    const ratingsData = await ratingsRes.json();

    const teachers = teachersData.data || [];
    const allRatings = ratingsData.data || [];
    // Convert stats array → map keyed by giao_vien_id
    const statsMap = {};
    (ratingsData.stats || []).forEach(s => {
      statsMap[s.giao_vien_id] = { avg: s.trung_binh, count: parseInt(s.tong) };
    });

    renderFeedbacksUI(container, userRole, hoSoId, teachers, allRatings, statsMap, _selectedTeacherId);

  } catch (err) {
    container.innerHTML = `
      <div class="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-xs">
        <strong>Lỗi tải đánh giá giáo viên:</strong> ${err.message}
      </div>
    `;
  }
}

function renderFeedbacksUI(container, userRole, hoSoId, teachers, allRatings, statsMap, filterTeacherId) {
  const filtered = filterTeacherId === 'all'
    ? allRatings
    : allRatings.filter(r => String(r.giao_vien_id) === String(filterTeacherId));
 
  const totalFeedbacks = filtered.length;
  const avgRating = totalFeedbacks > 0
    ? (filtered.reduce((sum, f) => sum + (f.so_sao || 0), 0) / totalFeedbacks).toFixed(1)
    : '0.0';
 
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  filtered.forEach(f => {
    const s = f.so_sao;
    if (s >= 1 && s <= 5) distribution[s]++;
  });
 
  // Tính tỷ lệ đánh giá tốt (>= 4 sao)
  const goodFeedbacksCount = filtered.filter(f => (f.so_sao || 0) >= 4).length;
  const satisfactionRate = totalFeedbacks > 0
    ? Math.round((goodFeedbacksCount / totalFeedbacks) * 100)
    : 0;
  
  // Tính stats theo từng GV từ statsMap hoặc từ allRatings
  const teacherStats = teachers.map(t => {
    const st = statsMap[t.id] || {};
    return {
      id: t.id,
      ho_ten: t.ho_ten,
      avg: st.avg ? parseFloat(st.avg).toFixed(1) : '—',
      count: st.count || 0
    };
  });
  
  container.innerHTML = `
    <div class="space-y-6 animate-fadeIn">
 
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 class="text-xl font-bold tracking-tight text-slate-800">Đánh giá & Phản hồi Giáo viên</h2>
          <p class="text-xs text-slate-500 mt-0.5">Dữ liệu đánh giá thực tế từ học viên sau mỗi buổi học</p>
        </div>
        <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select id="filter-teacher" class="border border-slate-200 rounded-full px-4 py-1.5 text-xs font-bold text-slate-700 bg-white shadow-sm outline-none focus:border-[#0071e3] transition cursor-pointer h-[34px]">
            <option value="all" ${filterTeacherId === 'all' ? 'selected' : ''}>Tất cả giáo viên</option>
            ${teachers.map(t => `<option value="${t.id}" ${String(filterTeacherId) === String(t.id) ? 'selected' : ''}>${t.ho_ten}</option>`).join('')}
          </select>
          <button id="btn-refresh-feedbacks" class="flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-xs font-semibold rounded-full transition-all active:scale-95 shadow-sm h-[34px]">
            <span class="material-symbols-outlined text-[16px]">refresh</span>Tải lại
          </button>
        </div>
      </div>
 
      <!-- Overview Stats (Bento Card - 3 Cột Đều Nhau) -->
      <div class="bg-white border border-slate-150 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 overflow-hidden">
 
        <!-- Cột 1: Điểm TB tổng / GV được chọn -->
        <div class="p-5 flex flex-col items-center justify-center text-center bg-slate-50/10">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            ${filterTeacherId === 'all' ? 'Điểm TB toàn trung tâm' : 'Điểm TB giáo viên'}
          </span>
          <span class="text-5xl font-extrabold text-slate-800 tracking-tight block">${avgRating}</span>
          <div class="flex items-center gap-0.5 mt-2.5">
            ${Array.from({ length: 5 }).map((_, i) => `
              <span class="material-symbols-outlined fill-current text-[18px] ${i < Math.round(parseFloat(avgRating)) ? 'text-amber-400' : 'text-slate-200'}">star</span>
            `).join('')}
          </div>
          <span class="text-[10px] text-slate-400 mt-3 block font-semibold">Từ ${totalFeedbacks} lượt đánh giá</span>
        </div>
 
        <!-- Cột 2: Phân bổ sao -->
        <div class="p-5 flex flex-col justify-center bg-white">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">Phân bổ xếp hạng</span>
          <div class="space-y-2">
            ${[5, 4, 3, 2, 1].map(star => {
              const count = distribution[star];
              const pct = totalFeedbacks > 0 ? (count / totalFeedbacks) * 100 : 0;
              return `
                <div class="flex items-center text-xs gap-3">
                  <span class="w-10 font-semibold text-slate-650 shrink-0 text-right">${star} ★</span>
                  <div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div class="bg-gradient-to-r from-amber-400 to-amber-300 h-full rounded-full transition-all duration-500" style="width: ${pct.toFixed(1)}%"></div>
                  </div>
                  <span class="w-8 text-slate-400 font-bold shrink-0">${count}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
 
        <!-- Cột 3: Tỷ lệ hài lòng -->
        <div class="p-5 flex flex-col items-center justify-center text-center bg-slate-50/10">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Chỉ số hài lòng</span>
          <div class="relative flex items-center justify-center">
            <!-- Vòng tròn tiến độ SVG Apple-style -->
            <svg class="w-24 h-24 transform -rotate-90">
              <circle cx="48" cy="48" r="38" stroke="#f1f5f9" stroke-width="6.5" fill="transparent" />
              <circle cx="48" cy="48" r="38" stroke="#10b981" stroke-width="7" fill="transparent"
                stroke-dasharray="${2 * Math.PI * 38}"
                stroke-dashoffset="${2 * Math.PI * 38 * (1 - satisfactionRate / 100)}"
                stroke-linecap="round"
                class="transition-all duration-1000 ease-out" />
            </svg>
            <div class="absolute flex flex-col items-center justify-center">
              <span class="text-2xl font-black text-slate-800 tracking-tighter">${satisfactionRate}%</span>
            </div>
          </div>
          <span class="text-[10px] text-slate-400 mt-2 block font-semibold">Tỷ lệ đánh giá tốt (>= 4★)</span>
        </div>
      </div>
 
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        ${filterTeacherId === 'all' && teacherStats.length > 0 ? `
        <!-- Bảng điểm từng GV -->
        <div class="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-sm lg:col-span-3 flex flex-col h-[480px]">
          <div class="px-4 py-3 border-b border-slate-100 bg-slate-50/50 shrink-0">
            <h3 class="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
              <span class="material-symbols-outlined text-[#0071e3] text-[18px]">leaderboard</span>
              Xếp hạng chất lượng giảng dạy
            </h3>
          </div>
          <div class="overflow-y-auto flex-1">
            <table class="w-full text-xs">
              <thead class="sticky top-0 bg-white z-10">
                <tr class="text-[10px] font-bold text-slate-455 uppercase tracking-wider border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm">
                  <th class="px-4 py-2.5 text-left">Giáo viên</th>
                  <th class="px-4 py-2.5 text-center">Điểm TB</th>
                  <th class="px-4 py-2.5 text-center">Số đánh giá</th>
                  <th class="px-4 py-2.5 text-center">Sao</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${teacherStats.sort((a, b) => parseFloat(b.avg) - parseFloat(a.avg)).map((t, idx) => `
                  <tr class="hover:bg-slate-50/50 transition-colors">
                    <td class="px-4 py-2.5">
                      <div class="flex items-center gap-2">
                        <span class="w-5 h-5 flex items-center justify-center rounded-full text-[9px] font-extrabold
                          ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-slate-100 text-slate-600' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}">
                          ${idx + 1}
                        </span>
                        <span class="font-bold text-slate-800">${t.ho_ten}</span>
                      </div>
                    </td>
                    <td class="px-4 py-2.5 text-center">
                      <span class="font-extrabold text-sm ${t.avg === '—' ? 'text-slate-400' : parseFloat(t.avg) >= 4.5 ? 'text-emerald-600' : parseFloat(t.avg) >= 3.5 ? 'text-amber-600' : 'text-red-500'}">${t.avg}</span>
                    </td>
                    <td class="px-4 py-2.5 text-center text-slate-500 font-medium">${t.count}</td>
                    <td class="px-4 py-2.5 text-center">
                      <div class="flex justify-center gap-0.5">
                        ${Array.from({ length: 5 }).map((_, i) => `
                          <span class="material-symbols-outlined fill-current text-[13px] ${i < Math.round(parseFloat(t.avg) || 0) ? 'text-amber-400' : 'text-slate-200'}">star</span>
                        `).join('')}
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        ` : ''}

        <!-- Danh sách đánh giá -->
        <div class="bg-white border border-slate-150 rounded-2xl shadow-sm ${filterTeacherId === 'all' && teacherStats.length > 0 ? 'lg:col-span-2' : 'lg:col-span-5'} flex flex-col h-[480px]">
          <div class="border-b border-slate-100 px-4 py-3 flex justify-between items-center bg-slate-50/50 shrink-0">
            <h3 class="font-bold text-slate-800 text-xs uppercase tracking-wider">Tất cả nhận xét</h3>
            <span class="text-[10px] text-slate-400 font-bold">Mới nhất trước</span>
          </div>

          <div class="overflow-y-auto flex-1 p-4 space-y-3.5">
            ${filtered.length === 0 ? `
              <div class="py-10 text-center text-slate-400 text-xs">
                <span class="material-symbols-outlined text-[32px] opacity-30 block mb-2">rate_review</span>
                Chưa có đánh giá nào${filterTeacherId !== 'all' ? ' cho giáo viên này' : ''}.
              </div>
            ` : filtered.map(item => {
              const ngay = item.ngay_tao ? new Date(item.ngay_tao).toLocaleDateString('vi-VN') : '—';
              const hvName = item.hoc_vien_ten || item.ten_hoc_vien || `HV #${item.hoc_vien_id}`;
              const gvName = item.giao_vien_ten || item.ten_giao_vien || `GV #${item.giao_vien_id}`;
              return `
                <div class="border-b border-slate-100 last:border-0 pb-3 last:pb-0 space-y-1.5">
                  <div class="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <span class="font-bold text-slate-800 text-xs block">${hvName}</span>
                      <span class="text-[10px] text-slate-400 block font-semibold">Đánh giá GV: <strong class="text-slate-650">${gvName}</strong></span>
                    </div>
                    <div class="flex flex-col items-end gap-0.5">
                      <div class="flex gap-0.5">
                        ${Array.from({ length: 5 }).map((_, i) => `
                          <span class="material-symbols-outlined fill-current text-[13px] ${i < (item.so_sao || 0) ? 'text-amber-400' : 'text-slate-200'}">star</span>
                        `).join('')}
                      </div>
                      <span class="text-[9px] text-slate-400 font-medium">${ngay}</span>
                    </div>
                  </div>
                  ${item.nhan_xet ? `
                    <p class="text-xs text-slate-650 leading-relaxed bg-slate-50/45 border border-slate-100/70 rounded-xl p-2.5 font-medium">
                      ${item.nhan_xet}
                    </p>
                  ` : `<p class="text-[10px] text-slate-400 italic">Không có nhận xét.</p>`}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
 
    </div>
  `;
 
  // Events
  document.getElementById('btn-refresh-feedbacks')?.addEventListener('click', () => {
    _selectedTeacherId = 'all';
    renderTeacherFeedbacks(container);
  });
 
  document.getElementById('filter-teacher')?.addEventListener('change', (e) => {
    _selectedTeacherId = e.target.value;
    renderFeedbacksUI(container, userRole, hoSoId, teachers, allRatings, statsMap, _selectedTeacherId);
  });
}
