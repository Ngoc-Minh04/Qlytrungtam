// AuditLogs.js - Nhật ký hệ thống (Admin)
import { API_BASE } from './_shared.js';

export async function renderAuditLogs(container) {
  container.innerHTML = `
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-apple-blue"></div>
    </div>
  `;

  try {
    const res = await fetch(`${API_BASE}/audit-logs`, {
      headers: { 'X-User-Role': 'admin' }
    });
    const result = await res.json();

    if (!result.success) {
      container.innerHTML = `<p class="text-red-600 text-xs">${result.error}</p>`;
      return;
    }

    const logs = result.data || [];

    let displayCount = 15;
    let isLogsLoading = false;

    function renderTableRowsChunk() {
      const chunk = logs.slice(0, displayCount);
      if (chunk.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-6 text-center text-slate-500 text-xs">Chưa có nhật ký nào.</td></tr>';
        return;
      }

      // Ánh xạ vai trò sang Tiếng Việt
      const roleMap = {
        'admin': 'Quản trị viên',
        'le_tan': 'Lễ tân',
        'giao_vien': 'Giáo viên',
        'hoc_vien': 'Học viên',
        'system': 'Hệ thống'
      };

      // Ánh xạ hành động sang Tiếng Việt
      const actionMap = {
        'login': 'Đăng nhập',
        'logout': 'Đăng xuất',
        'create': 'Tạo mới',
        'update': 'Cập nhật',
        'delete': 'Xóa',
        'pay': 'Thanh toán',
        'cancel': 'Hủy bỏ',
        'scan': 'Quét thẻ',
        'approve': 'Phê duyệt',
        'reject': 'Từ chối'
      };

      tableBody.innerHTML = chunk.map(log => {
        const userKey = (log.ten_dang_nhap || '').toLowerCase().trim();
        const displayUsername = userKey === 'system' ? 'Hệ thống' : (log.ten_dang_nhap || '—');

        const roleKey = (log.vai_tro || '').toLowerCase().trim();
        const displayRole = roleMap[roleKey] || log.vai_tro || '—';

        const actionKey = (log.hanh_dong || '').toLowerCase().trim();
        const displayAction = actionMap[actionKey] || log.hanh_dong || '—';

        return `
          <tr class="hover:bg-apple-parchment border-b border-apple-divider/40 transition text-[11px]">
            <td class="px-6 py-4 whitespace-nowrap text-slate-500">${new Date(log.thoi_diem).toLocaleString()}</td>
            <td class="px-6 py-4 whitespace-nowrap font-bold text-apple-ink">${displayUsername}</td>
            <td class="px-6 py-4 whitespace-nowrap text-slate-600">${displayRole}</td>
            <td class="px-6 py-4 whitespace-nowrap text-apple-blue font-bold">${displayAction}</td>
            <td class="px-6 py-4 whitespace-nowrap text-slate-600">${log.doi_tuong}</td>
            <td class="px-6 py-4 text-slate-500 max-w-xs truncate">${log.ghi_chu || ''}</td>
          </tr>
        `;
      }).join('');
    }

    container.innerHTML = `
      <div class="space-y-4">
        <div class="bg-apple-white rounded-[18px] border border-apple-divider overflow-hidden flex flex-col">
          <div class="p-5 border-b border-apple-divider flex justify-between items-center flex-wrap gap-2">
            <h3 class="font-bold text-apple-ink text-sm uppercase tracking-wider">Nhật ký hệ thống giám sát thao tác</h3>
            <button id="btn-refresh-audit" class="flex items-center justify-center gap-1.5 px-4 py-2 border border-[#e2e2e4] hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-full transition-all active:scale-95 shadow-sm h-[32px]">
              <span class="material-symbols-outlined text-[16px]">refresh</span>Tải lại
            </button>
          </div>
          <div class="overflow-x-auto max-h-[450px] overflow-y-auto w-full relative">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-apple-parchment text-slate-500 text-[10px] font-semibold uppercase tracking-wider border-b border-apple-divider">
                  <th class="sticky top-0 bg-apple-parchment z-20 px-6 py-3">Thời điểm</th>
                  <th class="sticky top-0 bg-apple-parchment z-20 px-6 py-3">Tài khoản</th>
                  <th class="sticky top-0 bg-apple-parchment z-20 px-6 py-3">Vai trò</th>
                  <th class="sticky top-0 bg-apple-parchment z-20 px-6 py-3">Hành động</th>
                  <th class="sticky top-0 bg-apple-parchment z-20 px-6 py-3">Bảng</th>
                  <th class="sticky top-0 bg-apple-parchment z-20 px-6 py-3">Mô tả</th>
                </tr>
              </thead>
              <tbody id="audit-table-body">
                <!-- Rendered dynamically -->
              </tbody>
            </table>
          </div>
          <div id="audit-logs-sentinel" class="h-4 w-full shrink-0"></div>
        </div>
      </div>
    `;

    document.getElementById('btn-refresh-audit')?.addEventListener('click', () => {
      renderAuditLogs(container);
    });

    const tableBody = document.getElementById('audit-table-body');
    renderTableRowsChunk();

    if (window.auditLogsObserver) {
      window.auditLogsObserver.disconnect();
    }
    const sentinel = document.getElementById('audit-logs-sentinel');
    if (sentinel && logs.length > 0) {
      window.auditLogsObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && displayCount < logs.length && !isLogsLoading) {
          isLogsLoading = true;
          setTimeout(() => {
            displayCount = Math.min(displayCount + 15, logs.length);
            renderTableRowsChunk();
            isLogsLoading = false;
          }, 150);
        }
      }, { rootMargin: '10px' });
      window.auditLogsObserver.observe(sentinel);
    }

  } catch (err) {
    container.innerHTML = `
      <div class="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-xs">
        <strong>Lỗi tải dữ liệu:</strong> ${err.message}
      </div>
    `;
  }
}

