import { renderDashboard } from './pages/Dashboard.js';
import { renderStudentPortal } from './pages/StudentPortal.js';
import { renderTeacherPortal } from './pages/TeacherPortal.js';

const API_BASE = 'http://localhost:3006/api';

// Định nghĩa hàm render trang Login — Minimal Centered Card
function renderLogin() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <style>
      @keyframes loginFadeIn {
        from { opacity: 0; transform: translateY(18px) scale(0.98); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes dotFloat {
        0%, 100% { transform: translateY(0px); }
        50%       { transform: translateY(-8px); }
      }
      .login-card { animation: loginFadeIn 0.5s cubic-bezier(.22,.68,0,1.2) forwards; }
      .dot-1 { animation: dotFloat 3s ease-in-out infinite; }
      .dot-2 { animation: dotFloat 3s ease-in-out 0.4s infinite; }
      .dot-3 { animation: dotFloat 3s ease-in-out 0.8s infinite; }
      .login-input:focus { box-shadow: 0 0 0 3px rgba(0,102,204,0.12); }
    </style>

    <!-- Nền với pattern chấm mờ -->
    <div class="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
      style="background: linear-gradient(135deg, #f0f4ff 0%, #fafafa 40%, #f0f7ff 100%);">

      <!-- Decorative blobs -->
      <div class="absolute top-[-80px] left-[-80px] w-[360px] h-[360px] rounded-full pointer-events-none"
        style="background: radial-gradient(circle, rgba(0,102,204,0.10) 0%, transparent 70%);"></div>
      <div class="absolute bottom-[-100px] right-[-60px] w-[400px] h-[400px] rounded-full pointer-events-none"
        style="background: radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%);"></div>
      <div class="absolute top-1/2 left-[8%] w-3 h-3 rounded-full bg-[#0066cc]/20 dot-1 hidden md:block"></div>
      <div class="absolute top-[25%] right-[12%] w-2 h-2 rounded-full bg-indigo-300/40 dot-2 hidden md:block"></div>
      <div class="absolute bottom-[20%] left-[15%] w-2.5 h-2.5 rounded-full bg-[#0066cc]/15 dot-3 hidden md:block"></div>

      <!-- Login Card -->
      <div class="login-card relative w-full max-w-[420px] mx-4">

        <!-- Logo & Brand trên đầu card -->
        <div class="text-center mb-7">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-lg"
            style="background: linear-gradient(135deg, #0066cc 0%, #004ea8 100%);">
            <span class="text-white font-extrabold text-2xl tracking-tighter select-none">S</span>
          </div>
          <h1 class="text-[22px] font-extrabold text-[#1a1c1d] tracking-tight leading-tight">Stellar Academy</h1>
          <p class="text-[12px] text-slate-400 mt-1 font-medium">Cổng quản lý trung tâm ngoại ngữ</p>
        </div>

        <!-- Card chính -->
        <div class="bg-white rounded-3xl shadow-xl border border-[#e8eaf0] p-8 space-y-5"
          style="box-shadow: 0 8px 40px rgba(0,0,0,0.08), 0 2px 8px rgba(0,102,204,0.06);">

          <div class="space-y-1">
            <h2 class="text-[15px] font-bold text-[#1a1c1d]">Đăng nhập</h2>
            <p class="text-[11.5px] text-slate-400">Nhập tài khoản được cấp để tiếp tục</p>
          </div>

          <form id="login-form" class="space-y-4">

            <!-- Username -->
            <div class="space-y-1.5">
              <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Tên đăng nhập</label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">person</span>
                <input type="text" id="username" required autocomplete="username"
                  class="login-input w-full pl-10 pr-4 py-3 bg-[#f8f9fc] border border-[#e2e6ef] rounded-xl outline-none focus:border-[#0066cc] focus:bg-white transition-all text-[13px] font-semibold text-[#1a1c1d] placeholder:font-normal placeholder:text-slate-400"
                  placeholder="admin / letan / ...">
              </div>
            </div>

            <!-- Password -->
            <div class="space-y-1.5">
              <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Mật khẩu</label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">lock</span>
                <input type="password" id="password" required autocomplete="current-password"
                  class="login-input w-full pl-10 pr-11 py-3 bg-[#f8f9fc] border border-[#e2e6ef] rounded-xl outline-none focus:border-[#0066cc] focus:bg-white transition-all text-[13px] font-semibold text-[#1a1c1d] placeholder:font-normal placeholder:text-slate-400"
                  placeholder="••••••••">
                <button type="button" id="toggle-password-btn"
                  class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0066cc] transition-colors p-0.5">
                  <span class="material-symbols-outlined text-[18px]" id="password-visibility-icon">visibility</span>
                </button>
              </div>
            </div>

            <!-- Error message slot -->
            <div id="login-error-wrap" class="hidden">
              <div class="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 rounded-xl px-3.5 py-2.5 text-[11.5px] font-medium">
                <span class="material-symbols-outlined text-[16px] shrink-0">error</span>
                <span id="login-error-text">Tên đăng nhập hoặc mật khẩu không đúng</span>
              </div>
            </div>

            <!-- Submit -->
            <button type="submit" id="login-submit-btn"
              class="w-full text-white font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] text-[13px] mt-1 shadow-md"
              style="background: linear-gradient(135deg, #0066cc 0%, #004ea8 100%); box-shadow: 0 4px 14px rgba(0,102,204,0.35);">
              <span id="login-btn-text">Đăng nhập</span>
              <span class="material-symbols-outlined text-[17px]" id="login-btn-icon">arrow_forward</span>
            </button>

          </form>

          <!-- Role hints -->
          <div class="border-t border-[#f0f2f7] pt-4">
            <p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">Tài khoản demo</p>
            <div class="grid grid-cols-2 gap-1.5">
              ${[
                { role: 'Admin', user: 'admin', color: '#6366f1', bg: '#eef2ff' },
                { role: 'Lễ tân', user: 'letan', color: '#0066cc', bg: '#eff6ff' },
                { role: 'Giáo viên', user: 'giaovien', color: '#059669', bg: '#ecfdf5' },
                { role: 'Học viên', user: 'hocvien', color: '#d97706', bg: '#fffbeb' },
              ].map(r => `
                <button type="button" class="demo-login-btn text-left px-2.5 py-1.5 rounded-lg text-[10.5px] font-semibold transition-all hover:opacity-80 active:scale-95"
                  style="background:${r.bg}; color:${r.color};" data-user="${r.user}">
                  ${r.role}: <span class="font-bold">${r.user}</span>
                </button>
              `).join('')}
            </div>
          </div>

        </div>

        <!-- Footer -->
        <p class="text-center text-[10px] text-slate-400 mt-5">© 2026 Stellar Academy · All rights reserved</p>
      </div>
    </div>
  `;

  // Toggle password visibility
  document.getElementById('toggle-password-btn')?.addEventListener('click', () => {
    const input = document.getElementById('password');
    const icon = document.getElementById('password-visibility-icon');
    if (input.type === 'password') { input.type = 'text'; icon.textContent = 'visibility_off'; }
    else { input.type = 'password'; icon.textContent = 'visibility'; }
  });

  // Demo login buttons — điền sẵn username
  document.querySelectorAll('.demo-login-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('username').value = btn.dataset.user;
      document.getElementById('password').value = btn.dataset.user + '123';
      document.getElementById('username').focus();
    });
  });

  function showLoginError(msg) {
    const wrap = document.getElementById('login-error-wrap');
    const text = document.getElementById('login-error-text');
    if (wrap && text) { text.textContent = msg; wrap.classList.remove('hidden'); }
  }
  function hideLoginError() {
    document.getElementById('login-error-wrap')?.classList.add('hidden');
  }
  function setLoginLoading(loading) {
    const btn = document.getElementById('login-submit-btn');
    const btnText = document.getElementById('login-btn-text');
    const btnIcon = document.getElementById('login-btn-icon');
    if (!btn) return;
    btn.disabled = loading;
    if (loading) {
      btnText.textContent = 'Đang xác thực...';
      btnIcon.textContent = 'autorenew';
      btnIcon.classList.add('animate-spin');
    } else {
      btnText.textContent = 'Đăng nhập';
      btnIcon.textContent = 'arrow_forward';
      btnIcon.classList.remove('animate-spin');
    }
  }

  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideLoginError();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    setLoginLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ten_dang_nhap: username, mat_khau: password })
      });
      const data = await res.json();

      if (!data.success) {
        setLoginLoading(false);
        showLoginError(data.error || 'Tên đăng nhập hoặc mật khẩu không đúng');
        return;
      }

      const user = data.data;
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userRole', user.vai_tro);
      localStorage.setItem('username', user.ten_dang_nhap);
      localStorage.setItem('hoTen', user.ho_ten || user.ten_dang_nhap);
      localStorage.setItem('taiKhoanId', user.tai_khoan_id);
      localStorage.setItem('hoSoId', user.ho_so_id || '');
      localStorage.setItem('chiNhanh', user.chi_nhanh || 'Trung tam chính');

      if (user.vai_tro === 'hoc_vien') navigate('/student-portal');
      else if (user.vai_tro === 'giao_vien') navigate('/teacher-portal');
      else navigate('/dashboard');
    } catch {
      setLoginLoading(false);
      showLoginError('Không thể kết nối đến máy chủ. Vui lòng thử lại.');
    }
  });
}

// Cấu hình các Route của SPA
const routes = {
  '/': null, // sẽ xử lý theo role
  '/dashboard': renderDashboard,
  '/login': renderLogin,
  '/student-portal': renderStudentPortal,
  '/teacher-portal': renderTeacherPortal,
};

// Hàm điều phối render trang chính
export function renderPage(path) {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userRole = localStorage.getItem('userRole') || 'hoc_vien';

  // Chuyển hướng nếu chưa đăng nhập
  if (!isLoggedIn && path !== '/login') {
    window.history.pushState({}, '', '/login');
    renderLogin();
    return;
  }

  // Chuyển hướng đến trang phù hợp vai trò nếu đã đăng nhập và vào /login hoặc /
  if (isLoggedIn && (path === '/login' || path === '/')) {
    if (userRole === 'hoc_vien') {
      window.history.pushState({}, '', '/student-portal');
      renderStudentPortal();
    } else if (userRole === 'giao_vien') {
      window.history.pushState({}, '', '/teacher-portal');
      renderTeacherPortal();
    } else {
      window.history.pushState({}, '', '/dashboard');
      renderDashboard(userRole);
    }
    return;
  }

  // Bảo vệ: học viên không được vào dashboard nội bộ
  if (isLoggedIn && userRole === 'hoc_vien' && path === '/dashboard') {
    window.history.pushState({}, '', '/student-portal');
    renderStudentPortal();
    return;
  }
  if (isLoggedIn && userRole === 'giao_vien' && path === '/dashboard') {
    window.history.pushState({}, '', '/teacher-portal');
    renderTeacherPortal();
    return;
  }

  const renderer = routes[path];
  if (renderer === renderDashboard || path === '/dashboard') {
    renderDashboard(userRole);
  } else if (renderer) {
    renderer();
  } else {
    // fallback
    if (userRole === 'hoc_vien') renderStudentPortal();
    else if (userRole === 'giao_vien') renderTeacherPortal();
    else renderDashboard(userRole);
  }
}

// Hàm chuyển hướng trang (History API)
export function navigate(path) {
  window.history.pushState({}, '', path);
  renderPage(path);
}

// Lắng nghe sự kiện click trên toàn bộ ứng dụng để chặn reload trang với các liên kết data-link
document.body.addEventListener('click', (e) => {
  const target = e.target.closest('[data-link]');
  if (target) {
    e.preventDefault();
    const href = target.getAttribute('href');
    navigate(href);
  }
});

// Lắng nghe sự kiện Back/Forward của trình duyệt
window.addEventListener('popstate', () => {
  renderPage(window.location.pathname);
});
