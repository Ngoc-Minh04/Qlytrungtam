// CenterRules.js - Nội quy trung tâm
import { API_BASE } from './_shared.js';

export async function renderCenterRules(container) {
  container.innerHTML = `
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-apple-blue"></div>
    </div>
  `;

  try {
    const res = await fetch(`${API_BASE}/rules`);
    const result = await res.json();
    const rules = result.data || [];

    container.innerHTML = `
      <div class="space-y-4">
        <div class="bg-white rounded-2xl p-6 border border-apple-divider max-w-2xl space-y-4 shadow-sm">
          <h3 class="font-bold text-apple-ink text-sm border-b border-apple-parchment pb-3 uppercase tracking-wider">Nội quy trung tâm tiếng Anh Stellar Academy</h3>
          <div class="space-y-4 divide-y divide-apple-divider/40 pt-2 text-xs">
            ${rules.map((rule, idx) => `
              <div class="pt-4 ${idx === 0 ? 'pt-0' : ''}">
                <h4 class="font-bold text-apple-ink text-xs mb-1.5">${idx + 1}. ${rule.tieu_de}</h4>
                <p class="text-slate-600 leading-relaxed whitespace-pre-wrap">${rule.noi_dung}</p>
                <span class="inline-block text-[9px] bg-apple-parchment text-slate-500 rounded px-2 py-0.5 mt-2.5 capitalize font-medium">Áp dụng: ${rule.ap_dung_cho}</span>
              </div>
            `).join('')}
            ${rules.length === 0 ? '<p class="text-slate-500 py-6 text-center">Chưa có nội quy nào được đăng.</p>' : ''}
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `
      <div class="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-xs">
        <strong>Lỗi tải dữ liệu:</strong> ${err.message}
      </div>
    `;
  }
}
