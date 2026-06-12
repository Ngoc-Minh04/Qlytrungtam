import { renderDashboard } from './pages/Dashboard.js';

// Định nghĩa hàm render trang Login cực kỳ cao cấp, chuẩn Apple UI
function renderLogin() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="min-h-screen w-full flex bg-[#f5f5f7] relative overflow-hidden">
      <!-- Cột Trái: Hình ảnh Trung tâm Ngoại ngữ và Thông điệp chào mừng (Chỉ hiện trên màn hình lớn) -->
      <div class="hidden lg:flex lg:w-7/12 relative bg-[#1d1d1f] items-center p-16 overflow-hidden">
        <!-- Background Image với Overlay tối -->
        <div class="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80" 
               alt="Stellar Academy Center" 
               class="w-full h-full object-cover opacity-60 filter brightness-90">
          <div class="absolute inset-0 bg-gradient-to-t from-[#1d1d1f] via-transparent to-[#1d1d1f]/40"></div>
          <div class="absolute inset-0 bg-[#0066cc]/10 mix-blend-overlay"></div>
        </div>
        
        <!-- Nội dung chào mừng -->
        <div class="relative z-10 max-w-lg space-y-6 text-white">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-md text-white rounded-2xl shadow-lg border border-white/20">
            <span class="text-3xl font-extrabold tracking-tighter text-white">S</span>
          </div>
          <div class="space-y-3">
            <h1 class="text-4xl font-extrabold tracking-tight leading-tight apple-headline">Stellar Academy</h1>
            <p class="text-base text-slate-300 font-medium leading-relaxed">
              Hệ thống quản lý đào tạo ngoại ngữ toàn diện. Nâng tầm trải nghiệm giảng dạy, tối ưu hóa quy trình quản lý học viên và vận hành lớp học thông minh.
            </p>
          </div>
          <div class="flex items-center gap-4 pt-4 border-t border-white/10 text-xs text-slate-400">
            <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">verified</span> An toàn bảo mật</span>
            <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">speed</span> Tốc độ vượt trội</span>
          </div>
        </div>
      </div>

      <!-- Cột Phải: Form đăng nhập tinh gọn -->
      <div class="w-full lg:w-5/12 flex items-center justify-center p-8 bg-white z-10 shadow-2xl relative">
        <div class="absolute w-[400px] h-[400px] rounded-full bg-[#0066cc]/5 blur-[100px] top-0 right-0 pointer-events-none"></div>
        
        <div class="max-w-[380px] w-full space-y-8">
          <div class="space-y-2">
            <div class="lg:hidden inline-flex items-center justify-center w-12 h-12 bg-apple-blue text-white rounded-xl mb-2">
              <span class="text-xl font-bold tracking-tighter">S</span>
            </div>
            <h2 class="text-2xl font-extrabold tracking-tight text-[#1d1d1f] apple-headline">Đăng nhập hệ thống</h2>
            <p class="text-xs text-slate-400 font-medium">Vui lòng nhập tài khoản được cấp để tiếp tục</p>
          </div>

          <form id="login-form" class="space-y-4 text-xs">
            <div class="space-y-1.5">
              <label for="username" class="block font-semibold text-slate-500">Tên đăng nhập</label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-[18px]">person</span>
                <input type="text" id="username" required class="w-full pl-10 pr-4 py-3 bg-[#f5f5f7] border border-[#e2e2e4] rounded-xl focus:outline-none focus:border-[#0066cc] focus:bg-white transition text-xs font-bold text-[#1d1d1f]" placeholder="Tên tài khoản hoặc email">
              </div>
            </div>
            
            <div class="space-y-1.5">
              <label for="password" class="block font-semibold text-slate-500">Mật khẩu</label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-[18px]">lock</span>
                <input type="password" id="password" required class="w-full pl-10 pr-10 py-3 bg-[#f5f5f7] border border-[#e2e2e4] rounded-xl focus:outline-none focus:border-[#0066cc] focus:bg-white transition text-xs font-bold text-[#1d1d1f]" placeholder="••••••••">
                <button type="button" id="toggle-password-btn" class="absolute right-3.5 top-3 text-slate-400 hover:text-apple-blue transition-colors flex items-center justify-center">
                  <span class="material-symbols-outlined text-[18px]" id="password-visibility-icon">visibility</span>
                </button>
              </div>
            </div>

            <button type="submit" class="w-full bg-[#0066cc] hover:bg-[#0055b3] text-white font-semibold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-[#0066cc]/20 text-xs mt-4">
              Đăng nhập hệ thống
              <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </form>
          
          <div class="pt-8 text-center border-t border-[#f5f5f7]">
            <p class="text-[10px] text-slate-400 font-medium">© 2026 Stellar Academy. All Rights Reserved.</p>
          </div>
        </div>
      </div>
    </div>
  `;

  // Thêm tính năng ẩn hiện mật khẩu (Toggle Password Visibility)
  const passwordInput = document.getElementById('password');
  const toggleBtn = document.getElementById('toggle-password-btn');
  const visibilityIcon = document.getElementById('password-visibility-icon');

  if (toggleBtn && passwordInput && visibilityIcon) {
    toggleBtn.addEventListener('click', () => {
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        visibilityIcon.textContent = 'visibility_off';
      } else {
        passwordInput.type = 'password';
        visibilityIcon.textContent = 'visibility';
      }
    });
  }

  // Gắn sự kiện submit form login
  document.getElementById('login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    
    // Phân loại role dựa trên tên đăng nhập
    let role = 'hoc_vien';
    if (username.includes('admin')) role = 'admin';
    else if (username.includes('tan') || username.includes('le')) role = 'le_tan';
    else if (username.includes('vien') || username.includes('giao')) role = 'giao_vien';

    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', role);
    localStorage.setItem('username', username);

    navigate('/dashboard');
  });
}

// Cấu hình các Route của SPA
const routes = {
  '/': renderDashboard,
  '/dashboard': renderDashboard,
  '/login': renderLogin,
};

// Hàm điều phối render trang chính
export function renderPage(path) {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userRole = localStorage.getItem('userRole') || 'hoc_vien';

  console.log(`[Router] Render path: ${path}, isLoggedIn: ${isLoggedIn}, role: ${userRole}`);

  // Chuyển hướng nếu chưa đăng nhập
  if (!isLoggedIn && path !== '/login') {
    window.history.pushState({}, '', '/login');
    renderLogin();
    return;
  }

  // Chuyển hướng đến Dashboard nếu đã đăng nhập và truy cập trang Login
  if (isLoggedIn && path === '/login') {
    window.history.pushState({}, '', '/dashboard');
    renderDashboard(userRole);
    return;
  }

  const renderer = routes[path] || routes['/'];
  if (renderer === renderDashboard) {
    renderDashboard(userRole);
  } else {
    renderer();
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
