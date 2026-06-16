import { renderDashboard } from './pages/Dashboard.js';
import { renderStudentPortal } from './pages/StudentPortal.js';
import { renderTeacherPortal } from './pages/TeacherPortal.js';

const API_BASE = 'http://localhost:3006/api';

// Định nghĩa hàm render trang Login — Split Layout
function renderLogin() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <style>
      @keyframes loginSlideIn {
        from { opacity: 0; transform: translateX(24px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes loginFloat {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        33%       { transform: translateY(-10px) rotate(1deg); }
        66%       { transform: translateY(-5px) rotate(-1deg); }
      }
      @keyframes shimmer {
        0%   { background-position: -200% center; }
        100% { background-position: 200% center; }
      }
      .login-form-side { animation: loginSlideIn 0.5s cubic-bezier(.22,.68,0,1.2) forwards; }
      .login-float-card { animation: loginFloat 6s ease-in-out infinite; }
      .login-float-card-2 { animation: loginFloat 6s ease-in-out 2s infinite; }
      .login-float-card-3 { animation: loginFloat 6s ease-in-out 4s infinite; }
      .login-input:focus { box-shadow: 0 0 0 3px rgba(255,255,255,0.25); }
      .login-input { background: rgba(255,255,255,0.10) !important; border-color: rgba(255,255,255,0.20) !important; color: white !important; }
      .login-input::placeholder { color: rgba(255,255,255,0.45) !important; }
      .login-input:focus { background: rgba(255,255,255,0.15) !important; border-color: rgba(255,255,255,0.45) !important; }
      .login-label { color: rgba(255,255,255,0.7); }
      .login-divider { border-color: rgba(255,255,255,0.15); }
    </style>

    <div class="min-h-screen w-full flex overflow-hidden" style="background: #0f172a;">

      <!-- Cột trái: Brand / Illustration -->
      <div class="hidden lg:flex flex-col flex-1 relative overflow-hidden"
        style="background: linear-gradient(135deg, #0066cc 0%, #004ea8 45%, #1e3a8a 100%);">

        <!-- Background pattern -->
        <div class="absolute inset-0 opacity-10"
          style="background-image: radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px); background-size: 48px 48px;"></div>
        <div class="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-20"
          style="background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%); transform: translate(150px, -150px);"></div>
        <div class="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-15"
          style="background: radial-gradient(circle, rgba(99,179,237,0.4) 0%, transparent 70%); transform: translate(-100px, 100px);"></div>

        <!-- Content -->
        <div class="relative z-10 flex flex-col h-full p-12">
          <!-- Logo -->
          <div class="flex items-center gap-3 mb-auto">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: rgba(255,255,255,0.2);">
              <span class="text-white font-extrabold text-lg select-none">S</span>
            </div>
            <span class="text-white font-bold text-[17px] tracking-tight">Stellar Academy</span>
          </div>

          <!-- Floating UI cards -->
          <div class="flex-1 flex items-center justify-center">
            <div class="relative w-full max-w-[380px]">

              <!-- Card 1: Thống kê -->
              <div class="login-float-card absolute -top-8 -left-4 bg-white rounded-2xl p-4 shadow-2xl w-[200px]" style="opacity:0.95;">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                    <span class="material-symbols-outlined text-blue-600 text-[14px]">school</span>
                  </div>
                  <span class="text-[11px] font-bold text-slate-600">Học viên</span>
                </div>
                <div class="text-[24px] font-extrabold text-slate-800">248</div>
                <div class="text-[10px] text-emerald-500 font-semibold mt-0.5">↑ +12 tháng này</div>
              </div>

              <!-- Card 2: Doanh thu -->
              <div class="login-float-card-2 absolute -bottom-4 -right-4 bg-white rounded-2xl p-4 shadow-2xl w-[190px]" style="opacity:0.95;">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <span class="material-symbols-outlined text-emerald-600 text-[14px]">trending_up</span>
                  </div>
                  <span class="text-[11px] font-bold text-slate-600">Doanh thu</span>
                </div>
                <div class="text-[20px] font-extrabold text-slate-800">128tr</div>
                <div class="text-[10px] text-emerald-500 font-semibold mt-0.5">↑ +8.5% so với kỳ</div>
              </div>

              <!-- Card 3: Lịch dạy hôm nay -->
              <div class="login-float-card-3 absolute top-1/2 -right-12 -translate-y-1/2 bg-white rounded-2xl p-4 shadow-2xl w-[170px]" style="opacity:0.95;">
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                    <span class="material-symbols-outlined text-violet-600 text-[14px]">calendar_today</span>
                  </div>
                  <span class="text-[11px] font-bold text-slate-600">Hôm nay</span>
                </div>
                <div class="space-y-1.5">
                  <div class="flex items-center gap-1.5">
                    <div class="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></div>
                    <span class="text-[9.5px] text-slate-500">8:00 — IELTS B2</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <div class="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></div>
                    <span class="text-[9.5px] text-slate-500">10:00 — Comm A1</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <div class="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></div>
                    <span class="text-[9.5px] text-slate-500">14:30 — TOEIC</span>
                  </div>
                </div>
              </div>

              <!-- Main illustration circle -->
              <div class="w-[200px] h-[200px] mx-auto rounded-full flex items-center justify-center"
                style="background: rgba(255,255,255,0.12); border: 2px solid rgba(255,255,255,0.2);">
                <div class="w-[150px] h-[150px] rounded-full flex items-center justify-center"
                  style="background: rgba(255,255,255,0.15); border: 2px solid rgba(255,255,255,0.25);">
                  <span class="material-symbols-outlined text-white text-[64px]">school</span>
                </div>
              </div>

            </div>
          </div>

          <!-- Bottom tagline -->
          <div class="mt-auto">
            <h2 class="text-white text-[26px] font-extrabold leading-tight mb-3">
              Quản lý thông minh<br>
              <span style="color: rgba(255,255,255,0.7);">cho trung tâm của bạn</span>
            </h2>
            <p class="text-[13px]" style="color: rgba(255,255,255,0.55);">Theo dõi học viên, doanh thu, lịch dạy và hơn thế nữa — tất cả trong một nền tảng.</p>
          </div>
        </div>
      </div>

      <!-- Cột phải: Form đăng nhập -->
      <div class="login-form-side flex flex-col w-full lg:w-[440px] shrink-0 relative"
        style="background: linear-gradient(160deg, #1e293b 0%, #0f172a 100%);">

        <!-- Top decoration -->
        <div class="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
          style="background: radial-gradient(circle, rgba(0,102,204,0.12) 0%, transparent 70%); transform: translate(80px, -80px);"></div>

        <div class="flex-1 flex flex-col justify-center px-10 py-12 relative z-10">

          <!-- Logo mobile (chỉ hiện trên mobile) -->
          <div class="flex items-center gap-3 mb-10 lg:hidden">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background: linear-gradient(135deg, #0066cc, #004ea8);">
              <span class="text-white font-extrabold text-base select-none">S</span>
            </div>
            <span class="text-white font-bold text-[16px] tracking-tight">Stellar Academy</span>
          </div>

          <!-- Heading -->
          <div class="mb-8">
            <h1 class="text-[28px] font-extrabold text-white leading-tight mb-2">Chào mừng trở lại</h1>
            <p class="text-[13px]" style="color: rgba(255,255,255,0.45);">Đăng nhập vào tài khoản của bạn để tiếp tục</p>
          </div>

          <form id="login-form" class="space-y-5">

            <!-- Username -->
            <div class="space-y-2">
              <label class="login-label text-[11px] font-bold uppercase tracking-wider block">Tên đăng nhập</label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] pointer-events-none" style="color: rgba(255,255,255,0.35);">person</span>
                <input type="text" id="username" required autocomplete="username"
                  class="login-input w-full pl-10 pr-4 py-3.5 border rounded-xl outline-none transition-all text-[13px] font-semibold"
                  placeholder="Nhập tên đăng nhập">
              </div>
            </div>

            <!-- Password -->
            <div class="space-y-2">
              <label class="login-label text-[11px] font-bold uppercase tracking-wider block">Mật khẩu</label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] pointer-events-none" style="color: rgba(255,255,255,0.35);">lock</span>
                <input type="password" id="password" required autocomplete="current-password"
                  class="login-input w-full pl-10 pr-11 py-3.5 border rounded-xl outline-none transition-all text-[13px] font-semibold"
                  placeholder="Nhập mật khẩu">
                <button type="button" id="toggle-password-btn"
                  class="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors p-0.5"
                  style="color: rgba(255,255,255,0.35);">
                  <span class="material-symbols-outlined text-[18px]" id="password-visibility-icon">visibility</span>
                </button>
              </div>
            </div>

            <!-- Error message slot -->
            <div id="login-error-wrap" class="hidden">
              <div class="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[11.5px] font-medium"
                style="background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5;">
                <span class="material-symbols-outlined text-[16px] shrink-0">error</span>
                <span id="login-error-text">Tên đăng nhập hoặc mật khẩu không đúng</span>
              </div>
            </div>

            <!-- Submit -->
            <button type="submit" id="login-submit-btn"
              class="w-full text-white font-bold py-4 px-4 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] text-[14px] mt-2"
              style="background: linear-gradient(135deg, #0066cc 0%, #004ea8 100%); box-shadow: 0 4px 24px rgba(0,102,204,0.4);">
              <span id="login-btn-text">Đăng nhập</span>
              <span class="material-symbols-outlined text-[18px]" id="login-btn-icon">arrow_forward</span>
            </button>

          </form>

          <!-- Footer -->
          <p class="text-center text-[11px] mt-10" style="color: rgba(255,255,255,0.25);">© 2026 Stellar Academy · All rights reserved</p>
        </div>
      </div>

    </div>
  `;

  // Toggle password visibility
  document.getElementById('toggle-password-btn')?.addEventListener('click', () => {
    const input = document.getElementById('password');
    const icon = document.getElementById('password-visibility-icon');
    if (input.type === 'password') { input.type = 'text'; icon.textContent = 'visibility_off'; icon.parentElement.style.color = 'rgba(255,255,255,0.6)'; }
    else { input.type = 'password'; icon.textContent = 'visibility'; icon.parentElement.style.color = 'rgba(255,255,255,0.35)'; }
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

function setHash(path) {
  if (window.location.hash.replace('#', '') !== path) {
    history.replaceState(null, '', '#' + path);
  }
}

// Hàm điều phối render trang chính
export function renderPage(path) {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userRole = localStorage.getItem('userRole') || 'hoc_vien';

  // Chuyển hướng nếu chưa đăng nhập
  if (!isLoggedIn && path !== '/login') {
    setHash('/login');
    renderLogin();
    return;
  }

  // Chuyển hướng đến trang phù hợp vai trò nếu đã đăng nhập và vào /login hoặc /
  if (isLoggedIn && (path === '/login' || path === '/')) {
    if (userRole === 'hoc_vien') {
      setHash('/student-portal');
      renderStudentPortal();
    } else if (userRole === 'giao_vien') {
      setHash('/teacher-portal');
      renderTeacherPortal();
    } else {
      setHash('/dashboard');
      renderDashboard(userRole);
    }
    return;
  }

  // Bảo vệ: học viên không được vào dashboard nội bộ
  if (isLoggedIn && userRole === 'hoc_vien' && path === '/dashboard') {
    setHash('/student-portal');
    renderStudentPortal();
    return;
  }
  if (isLoggedIn && userRole === 'giao_vien' && path === '/dashboard') {
    setHash('/teacher-portal');
    renderTeacherPortal();
    return;
  }

  setHash(path);
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

// Hàm chuyển hướng trang (Hash-based routing — tương thích Live Server)
export function navigate(path) {
  window.location.hash = path;
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

// Lắng nghe sự kiện hash thay đổi (Back/Forward và navigate())
window.addEventListener('hashchange', () => {
  const path = window.location.hash.replace('#', '') || '/';
  renderPage(path);
});
