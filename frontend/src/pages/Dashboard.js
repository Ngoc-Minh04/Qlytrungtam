// Dashboard.js - Shell layout: dark sidebar Material Design 3 + router nội bộ
import { renderOverview } from './Overview.js';
import { renderSchedules } from './Schedules.js';
import { renderCheckinLogs } from './CheckinLogs.js';
import { renderCenterRules } from './CenterRules.js';
import { renderAuditLogs } from './AuditLogs.js';
import { renderCoursePackages } from './CoursePackages.js';
import { renderTutoringPackages } from './TutoringPackages.js';
import { renderClassManagement } from './ClassManagement.js';
import { renderStudentsList } from './StudentsList.js';
import { renderAddStudentForm } from './AddStudentForm.js';
import { renderTeachersList } from './TeachersList.js';
import { renderStaffList } from './StaffList.js';
import { renderAttendanceStaff } from './AttendanceStaff.js';
import { renderSalaryManagement } from './SalaryManagement.js';
import { renderLessonDiary } from './LessonDiary.js';
import { renderTeacherFeedbacks } from './TeacherFeedbacks.js';
import { renderCourseRegistrations } from './CourseRegistrations.js';
import { renderStudentRequests } from './StudentRequests.js';
import { renderRevenueReport } from './RevenueReport.js';
<<<<<<< HEAD
import { API_BASE, showToast, formatCurrencyInput, parseCurrencyInput } from './_shared.js';
=======
import { renderAccountManagement } from './AccountManagement.js';
import { API_BASE, showToast } from './_shared.js';
import { initChatbot, destroyChatbot } from './Chatbot.js';
>>>>>>> test-1

let currentPage = 'dashboard';
let currentActiveSubPage = 'dashboard';

// Expose modal helpers ra toàn cục
window.openCancelModal = function (id, price = '0', type = 'khoa_hoc') {
  const modal = document.getElementById('cancel-modal');
  const idInput = document.getElementById('modal-dky-id');
  const moneyInput = document.getElementById('modal-so-tien-hoan');
  if (modal && idInput) {
    idInput.value = id;
    modal.setAttribute('data-pkg-type', type);
    if (moneyInput) {
      moneyInput.value = formatCurrencyInput(String(price));
    }
    modal.classList.remove('hidden');
  }
};

window.openReportModal = function (lichHocId, hocVienId, giaoVienId, hocVienTen) {
  const modal = document.getElementById('report-modal');
  if (modal) {
    document.getElementById('modal-lich-hoc-id').value = lichHocId;
    document.getElementById('modal-hoc-vien-id').value = hocVienId;
    document.getElementById('modal-giao-vien-id').value = giaoVienId;
    document.getElementById('modal-hoc-vien-ten').value = hocVienTen;
    modal.classList.remove('hidden');
  }
};

// Cấu hình các group pages
const GROUP_PAGES = {
  'course-packages-group': {
    label: 'Quản lý Gói học', icon: 'school', roles: ['admin', 'le_tan'],
    tabs: [
      { page: 'course-packages', label: 'Gói học phí / Khóa học' },
      { page: 'tutoring-packages', label: 'Gói học kèm 1-1' }
    ]
  },
  'students-group': {
    label: 'Học viên & Tiếp nhận', icon: 'group', roles: ['admin', 'le_tan'],
    tabs: [{ page: 'students-list', label: 'Hồ sơ Học viên' }]
  },
  'teachers-group': {
    label: 'Nhân sự & Chấm công', icon: 'badge', roles: ['admin', 'le_tan'],
    tabs: [
      { page: 'teachers-list', label: 'Hồ sơ Giáo viên' },
      { page: 'staff-list', label: 'Hồ sơ Nhân viên' },
      { page: 'attendance-staff', label: 'Bảng Chấm công' },
      { page: 'salary-management', label: 'Tính Lương & Phụ cấp' }
    ]
  },
  'quality-group': {
    label: 'Chất lượng đào tạo', icon: 'menu_book', roles: ['admin', 'giao_vien'],
    tabs: [
      { page: 'lesson-diary', label: 'Nhật ký buổi học' },
      { page: 'teacher-feedbacks', label: 'Đánh giá Giáo viên' }
    ]
  },
  'finance-group': {
    label: 'Yêu cầu', icon: 'payments', roles: ['admin', 'le_tan'],
    tabs: [
      { page: 'course-registrations', label: 'Đăng ký / Thu phí' },
      { page: 'student-requests', label: 'Xử lý Yêu cầu' }
    ]
  },
  'accounts-group': {
    label: 'Quản lý Tài khoản', icon: 'manage_accounts', roles: ['admin'],
    tabs: [{ page: 'account-management', label: 'Tài khoản người dùng', roles: ['admin'] }]
  },
  'system-group': {
    label: 'Hệ thống & Nội quy', icon: 'admin_panel_settings', roles: ['admin', 'le_tan', 'giao_vien', 'hoc_vien'],
    tabs: [
      { page: 'audit-logs', label: 'Nhật ký hệ thống', roles: ['admin'] },
      { page: 'center-rules', label: 'Nội quy trung tâm' }
    ]
  }
};

function findGroupOfPage(page) {
  for (const [groupKey, group] of Object.entries(GROUP_PAGES)) {
    if (group.tabs.some(t => t.page === page)) return groupKey;
  }
  return null;
}

function getMenuConfig(role) {
  const allItems = [
    { page: 'dashboard', icon: 'dashboard', label: 'Tổng quan', roles: ['admin', 'le_tan', 'giao_vien', 'hoc_vien'] },
    { page: 'schedules', icon: 'calendar_month', label: 'Thời khóa biểu', roles: ['admin', 'le_tan', 'giao_vien'] },
    { page: 'attendance-staff', icon: 'fingerprint', label: 'Chấm công của tôi', roles: ['giao_vien'] },
    { page: 'checkin-logs', icon: 'qr_code_scanner', label: 'Lượt Vào - Ra', roles: ['admin', 'le_tan'] },
    { page: 'course-packages-group', icon: 'school', label: 'Quản lý Gói học', roles: ['admin', 'le_tan'] },
    { page: 'class-management', icon: 'event_note', label: 'Lớp học & Xếp lịch', roles: ['admin', 'le_tan'] },
    { page: 'students-group', icon: 'group', label: 'Học viên & Tiếp nhận', roles: ['admin', 'le_tan'] },
    { page: 'teachers-group', icon: 'badge', label: 'Nhân sự & Chấm công', roles: ['admin', 'le_tan'] },
    { page: 'quality-group', icon: 'menu_book', label: 'Chất lượng đào tạo', roles: ['admin', 'giao_vien'] },
    { page: 'finance-group', icon: 'payments', label: 'Yêu cầu', roles: ['admin', 'le_tan'] },
    { page: 'revenue-report', icon: 'bar_chart', label: 'Báo cáo Doanh thu', roles: ['admin'] },
    { page: 'accounts-group', icon: 'manage_accounts', label: 'Quản lý Tài khoản', roles: ['admin'] },
    { page: 'system-group', icon: 'admin_panel_settings', label: 'Hệ thống & Nội quy', roles: ['admin', 'le_tan', 'giao_vien', 'hoc_vien'] },
  ];
  return allItems.filter(item => !item.roles || item.roles.includes(role));
}

function getPageRenderer(page, role) {
  const map = {
    'dashboard': (c) => renderOverview(c, role),
    'schedules': (c) => renderSchedules(c),
    'checkin-logs': (c) => renderCheckinLogs(c),
    'center-rules': (c) => renderCenterRules(c),
    'audit-logs': (c) => renderAuditLogs(c),
    'course-packages': (c) => renderCoursePackages(c),
    'tutoring-packages': (c) => renderTutoringPackages(c),
    'class-management': (c) => renderClassManagement(c),
    'students-list': (c) => renderStudentsList(c, role),
    'add-student-form': (c) => renderAddStudentForm(c),
    'teachers-list': (c) => renderTeachersList(c, role),
    'staff-list': (c) => renderStaffList(c, role),
    'attendance-staff': (c) => renderAttendanceStaff(c),
    'salary-management': (c) => renderSalaryManagement(c),
    'lesson-diary': (c) => renderLessonDiary(c, role),
    'teacher-feedbacks': (c) => renderTeacherFeedbacks(c),
    'course-registrations': (c) => renderCourseRegistrations(c),
    'student-requests': (c) => renderStudentRequests(c),
    'revenue-report': (c) => renderRevenueReport(c),
    'account-management': (c) => renderAccountManagement(c),
  };
  return map[page] || map['dashboard'];
}

async function renderSubPage(page, role) {
  const contentDiv = document.getElementById('dashboard-content');
  if (!contentDiv) return;

  // Đóng mobile sidebar khi chuyển trang
  if (window.innerWidth < 768) {
    const sb = document.getElementById('sidebar-menu');
    const ov = document.getElementById('sidebar-overlay');
    if (sb) sb.style.transform = 'translateX(-100%)';
    if (ov) ov.classList.add('hidden');
  }

  let groupKey = findGroupOfPage(page);
  let activePage = page;
  let activeGroup = null;

  if (groupKey) {
    activeGroup = groupKey;
  } else if (GROUP_PAGES[page]) {
    activeGroup = page;
    const group = GROUP_PAGES[page];
    const allowedTab = group.tabs.find(t => !t.roles || t.roles.includes(role));
    if (allowedTab) activePage = allowedTab.page;
  }

  currentPage = activeGroup || activePage;
  currentActiveSubPage = activePage;

  // Cập nhật active state trên sidebar
  document.querySelectorAll('.nav-item').forEach(btn => {
    const isActive = btn.getAttribute('data-page') === currentPage;
    if (isActive) {
      btn.classList.add('border-[#0066cc]', 'bg-white/10', 'text-white', 'font-bold');
      btn.classList.remove('text-[#c8c6c8]', 'font-medium', 'border-transparent');
      const icon = btn.querySelector('.material-symbols-outlined');
      if (icon) icon.style.fontVariationSettings = "'FILL' 1";
    } else {
      btn.classList.remove('border-[#0066cc]', 'bg-white/10', 'text-white', 'font-bold');
      btn.classList.add('text-[#c8c6c8]', 'font-medium', 'border-transparent');
      const icon = btn.querySelector('.material-symbols-outlined');
      if (icon) icon.style.fontVariationSettings = "'FILL' 0";
    }
  });

  // Cập nhật tiêu đề topbar
  const titleEl = document.getElementById('topbar-title');
  if (titleEl) {
    const item = getMenuConfig(role).find(m => m.page === currentPage);
    if (item) titleEl.textContent = item.label;
  }

  if (activeGroup) {
    const group = GROUP_PAGES[activeGroup];
    const visibleTabs = group.tabs.filter(t => !t.roles || t.roles.includes(role));

    contentDiv.innerHTML = `
      <div class="flex border-b border-[#e2e2e4] mb-4 gap-5 overflow-x-auto">
        ${visibleTabs.map(t => {
          const isTabActive = t.page === activePage;
          return `<button class="sub-tab-btn text-[13px] font-medium transition-all whitespace-nowrap active:scale-95 pb-2.5 ${
            isTabActive ? 'border-b-2 border-[#0066cc] text-[#0066cc] font-semibold' : 'text-[#727784] hover:text-[#1a1c1d]'
          }" data-subpage="${t.page}">${t.label}</button>`;
        }).join('')}
      </div>
      <div id="sub-page-container">
        <div class="flex justify-center items-center py-10">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0066cc]"></div>
        </div>
      </div>
    `;

    contentDiv.querySelectorAll('.sub-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetSub = btn.getAttribute('data-subpage');
        if (targetSub) renderSubPage(targetSub, role);
      });
    });

    const subContainer = document.getElementById('sub-page-container');
    try {
      await getPageRenderer(activePage, role)(subContainer);
    } catch (err) {
      subContainer.innerHTML = `<div class="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm"><strong>Lỗi tải dữ liệu:</strong> ${err.message}</div>`;
    }
  } else {
    contentDiv.innerHTML = `<div class="flex justify-center items-center py-10"><div class="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0066cc]"></div></div>`;
    try {
      await getPageRenderer(activePage, role)(contentDiv);
    } catch (err) {
      contentDiv.innerHTML = `<div class="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm"><strong>Lỗi tải dữ liệu:</strong> ${err.message}</div>`;
    }
  }
}

function buildSidebarItems(role) {
  const items = getMenuConfig(role);
  const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
  return items.map(item => `
    <button class="nav-item flex items-center gap-3 w-full text-left px-4 py-2.5 rounded-lg text-[#c8c6c8] font-medium hover:bg-white/5 transition-all duration-150 active:scale-95 border-l-4 border-transparent"
      data-page="${item.page}" title="${isCollapsed ? item.label : ''}">
      <span class="material-symbols-outlined text-[21px] shrink-0">${item.icon}</span>
      <span class="sidebar-text text-[13px] font-medium transition-all duration-200" style="display:${isCollapsed ? 'none' : ''}">${item.label}</span>
    </button>
  `).join('');
}

// ===== LAYOUT CONSTANTS =====
const SIDEBAR_FULL = 280;
const SIDEBAR_COLLAPSED = 72;
const TOPBAR_H = 56;

function getSidebarW() {
  return localStorage.getItem('sidebar-collapsed') === 'true' ? SIDEBAR_COLLAPSED : SIDEBAR_FULL;
}

// Áp dụng layout cho desktop vs mobile bằng JS thuần (không dùng Tailwind md: breakpoint)
function applyLayout() {
  const sidebar = document.getElementById('sidebar-menu');
  const topbar  = document.getElementById('topbar-header');
  const main    = document.getElementById('main-container');
  if (!sidebar || !topbar || !main) return;

  if (window.innerWidth < 768) {
    // Mobile: sidebar ẩn (overlay), topbar/main full width
    topbar.style.left  = '0';
    topbar.style.width = '100%';
    main.style.paddingLeft = '0';
    sidebar.style.width = SIDEBAR_FULL + 'px';
  } else {
    // Desktop: sidebar luôn hiện với width theo trạng thái collapsed
    const sw = getSidebarW();
    sidebar.style.width     = sw + 'px';
    sidebar.style.transform = 'translateX(0)';
    topbar.style.left  = sw + 'px';
    topbar.style.width = 'calc(100% - ' + sw + 'px)';
    main.style.paddingLeft  = sw + 'px';
  }
}

function updateSidebarContent(isCollapsed) {
  const sidebar = document.getElementById('sidebar-menu');
  if (!sidebar) return;
  const brand    = sidebar.querySelector('.sidebar-brand');
  const brandCol = sidebar.querySelector('.sidebar-brand-collapsed');
  if (brand)    brand.style.display    = isCollapsed ? 'none' : '';
  if (brandCol) brandCol.style.display = isCollapsed ? 'flex' : 'none';
  sidebar.querySelectorAll('.sidebar-text').forEach(el => { el.style.display = isCollapsed ? 'none' : ''; });
  document.querySelectorAll('.nav-item').forEach(btn => {
    const label = btn.querySelector('.sidebar-text')?.textContent || '';
    btn.setAttribute('title', isCollapsed ? label : '');
  });
}

export function renderDashboard(role) {
  const app = document.getElementById('app');
  const username = localStorage.getItem('username') || 'Người dùng';
  const roleNames = { admin: 'Quản trị viên', le_tan: 'Lễ tân Tuyển sinh', giao_vien: 'Giáo viên / Trợ giảng', hoc_vien: 'Học viên / Phụ huynh' };
  const roleName = roleNames[role] || 'Học viên';
  const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';

  app.innerHTML = `
    <!-- Overlay cho sidebar trên mobile -->
    <div id="sidebar-overlay" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 hidden"></div>

    <!-- SIDEBAR CỐ ĐỊNH — width và transform đều do JS kiểm soát, không dùng Tailwind md: -->
    <aside id="sidebar-menu" class="fixed left-0 top-0 h-full bg-[#272729] flex flex-col z-40 select-none"
      style="width:${SIDEBAR_FULL}px; transform:translateX(-100%); transition: transform 0.28s ease, width 0.28s ease;">

      <!-- Brand header — chiều cao khớp với topbar -->
      <div class="px-5 border-b border-white/10 shrink-0 flex items-center justify-between"
        style="height:${TOPBAR_H}px;">
        <div class="sidebar-brand overflow-hidden" style="display:${isCollapsed ? 'none' : ''}">
          <h1 class="text-white font-bold text-[15px] tracking-tight leading-tight whitespace-nowrap">Stellar Academy</h1>
          <p class="text-[#727784] text-[10.5px] mt-0.5 font-medium">Cổng Quản Lý Trung Tâm</p>
        </div>
        <div class="sidebar-brand-collapsed w-full items-center justify-center" style="display:${isCollapsed ? 'flex' : 'none'}">
          <span class="text-white font-bold text-lg">S</span>
        </div>
        <!-- Nút X đóng sidebar (chỉ hiển thị trên mobile) -->
        <button id="btn-close-sidebar" class="p-1 text-[#c8c6c8] hover:text-white rounded-lg hover:bg-white/5 transition-all shrink-0" style="display:none;">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <!-- Nav Items -->
      <nav class="flex-1 overflow-y-auto py-2.5 px-2 space-y-0.5" id="sidebar-nav">
        ${buildSidebarItems(role)}
      </nav>
    </aside>

    <!-- TOPBAR CỐ ĐỊNH — left và width đều do JS kiểm soát -->
    <header id="topbar-header" class="fixed top-0 z-20 bg-white border-b border-[#e2e2e4] flex items-center justify-between px-4"
      style="left:0; width:100%; height:${TOPBAR_H}px; top:0; transition: left 0.28s ease, width 0.28s ease;">
      <div class="flex items-center gap-2">
        <!-- Nút 3 gạch — luôn hiển thị ở mọi màn hình -->
        <button id="btn-toggle-sidebar" title="Menu" class="p-2 text-[#727784] hover:text-[#0066cc] hover:bg-[#f3f3f5] rounded-lg transition-all active:scale-95 shrink-0">
          <span class="material-symbols-outlined text-[21px]">menu</span>
        </button>
        <span id="topbar-title" class="text-[#1a1c1d] font-semibold text-[14px] select-none">Tổng quan</span>
      </div>
      <div class="flex items-center gap-1.5">
        <!-- Check-in nhanh -->
        <button id="btn-quick-checkin" title="Quét QR Vào - Ra"
          class="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0066cc]/10 hover:bg-[#0066cc]/20 text-[#0066cc] rounded-full transition-all active:scale-95 text-[12px] font-semibold shrink-0">
          <span class="material-symbols-outlined text-[17px]">qr_code_scanner</span>
          <span class="hidden sm:inline">Check-in</span>
        </button>
        <!-- Làm mới -->
        <button id="btn-refresh" title="Làm mới" class="p-1.5 text-[#727784] hover:text-[#0066cc] hover:bg-[#f3f3f5] rounded-full transition-all active:scale-95">
          <span class="material-symbols-outlined text-[19px]">refresh</span>
        </button>
        <!-- Thông báo -->
        <div class="relative">
          <button id="btn-notifications" class="relative p-1.5 text-[#727784] hover:text-[#0066cc] hover:bg-[#f3f3f5] rounded-full transition-all active:scale-95">
            <span class="material-symbols-outlined text-[19px]">notifications</span>
            <span id="notif-badge" class="absolute top-0.5 right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center hidden">0</span>
          </button>
          <!-- Notification Dropdown Menu -->
          <div id="notifications-dropdown" class="absolute right-0 top-full mt-2 w-80 bg-white border border-[#e2e2e4] rounded-2xl shadow-xl py-3 hidden z-50 flex flex-col max-h-[400px] overflow-hidden">
            <div class="px-4 pb-2 border-b border-[#f3f3f5] flex justify-between items-center shrink-0">
              <span class="text-[12.5px] font-bold text-[#1a1c1d]">Thông báo</span>
              <button id="btn-clear-all-notif" class="text-[11px] text-[#0066cc] hover:underline font-semibold">Xóa tất cả</button>
            </div>
            <div id="notifications-list" class="flex-grow overflow-y-auto divide-y divide-[#f3f3f5] pr-1">
              <div class="p-4 text-center text-[12px] text-slate-500">Đang tải thông báo...</div>
            </div>
          </div>
        </div>
        <!-- User Dropdown -->
        <div class="relative group/user">
          <button class="flex items-center gap-1.5 px-2 py-1.5 hover:bg-[#f3f3f5] rounded-full transition-all select-none">
            <div class="w-7 h-7 rounded-full bg-[#0066cc] flex items-center justify-center text-white font-bold text-xs shrink-0">
              ${username.charAt(0).toUpperCase()}
            </div>
            <span class="text-[12.5px] font-semibold text-[#1a1c1d] max-w-[80px] truncate hidden sm:inline-block">${username}</span>
            <span class="material-symbols-outlined text-[15px] text-[#727784] transition-transform group-hover/user:rotate-180">keyboard_arrow_down</span>
          </button>
          <div class="absolute right-0 top-full mt-1 w-52 bg-white border border-[#e2e2e4] rounded-2xl shadow-xl py-2 hidden group-hover/user:block z-50">
            <div class="px-4 py-2 border-b border-[#f3f3f5]">
              <p class="text-[12px] font-bold text-[#1a1c1d] truncate">${username}</p>
              <p class="text-[10px] text-[#727784] mt-0.5 truncate">${roleName}</p>
            </div>
            <a href="javascript:void(0)" class="flex items-center gap-2 px-4 py-2 text-[12.5px] text-[#1a1c1d] hover:bg-[#f3f3f5]">
              <span class="material-symbols-outlined text-[17px] text-[#727784]">person</span>Thông tin cá nhân
            </a>
            <a href="javascript:void(0)" class="flex items-center gap-2 px-4 py-2 text-[12.5px] text-[#1a1c1d] hover:bg-[#f3f3f5]">
              <span class="material-symbols-outlined text-[17px] text-[#727784]">notifications</span>Thông báo mới
            </a>
            <hr class="border-[#f3f3f5] my-1"/>
            <button id="btn-header-logout" class="w-full text-left flex items-center gap-2 px-4 py-2 text-[12.5px] text-red-600 hover:bg-red-50">
              <span class="material-symbols-outlined text-[17px] text-red-500">logout</span>Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- MAIN CONTENT — padding-top khớp topbar, padding-left do JS kiểm soát -->
    <main id="main-container" class="min-h-screen bg-[#f5f5f7]"
      style="padding-top:${TOPBAR_H}px; padding-left:0; transition: padding-left 0.28s ease;">
      <div id="dashboard-content" class="p-4 md:p-5 w-full max-w-[1400px] mx-auto">
        <!-- Sub-pages render vào đây -->
      </div>
    </main>

    <!-- MODAL SỔ LIÊN LẠC -->
    <div id="report-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4">
      <div class="bg-white rounded-2xl max-w-lg w-full p-5 border border-[#e2e2e4] max-h-[90vh] overflow-y-auto shadow-xl">
        <div class="flex justify-between items-center pb-3 border-b border-[#f3f3f5] mb-3">
          <h3 class="text-[14px] font-bold text-[#1a1c1d]">Tạo sổ liên lạc buổi học</h3>
          <button id="close-modal" class="p-1.5 text-[#727784] hover:bg-[#f3f3f5] rounded-full transition-all">
            <span class="material-symbols-outlined text-[19px]">close</span>
          </button>
        </div>
        <form id="report-form" class="space-y-2.5 text-sm">
          <input type="hidden" id="modal-lich-hoc-id">
          <input type="hidden" id="modal-hoc-vien-id">
          <input type="hidden" id="modal-giao-vien-id">
          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label class="block text-[11.5px] font-semibold text-[#414753] mb-1">Học viên</label>
              <input type="text" id="modal-hoc-vien-ten" readonly class="w-full bg-[#f3f3f5] border border-[#e2e2e4] rounded-lg px-3 py-1.5 outline-none text-[12.5px]">
            </div>
            <div>
              <label class="block text-[11.5px] font-semibold text-[#414753] mb-1">Thời gian (phút)</label>
              <input type="number" id="modal-so-phut-hoc" value="90" required class="w-full border border-[#e2e2e4] rounded-lg px-3 py-1.5 outline-none focus:border-[#0066cc] transition text-[12.5px]">
            </div>
          </div>
          <div>
            <label class="block text-[11.5px] font-semibold text-[#414753] mb-1">Nội dung bài học</label>
            <textarea id="modal-noi-dung-bai-hoc" rows="2" required class="w-full border border-[#e2e2e4] rounded-lg px-3 py-1.5 outline-none focus:border-[#0066cc] transition text-[12.5px]" placeholder="Nội dung kiến thức giảng dạy..."></textarea>
          </div>
          <div>
            <label class="block text-[11.5px] font-semibold text-[#414753] mb-1">Nhận xét của giáo viên</label>
            <textarea id="modal-nhan-xet-buoi_hoc" rows="2" required class="w-full border border-[#e2e2e4] rounded-lg px-3 py-1.5 outline-none focus:border-[#0066cc] transition text-[12.5px]" placeholder="Đánh giá mức độ hiểu bài..."></textarea>
          </div>
          <div>
            <label class="block text-[11.5px] font-semibold text-[#414753] mb-1">Bài tập về nhà</label>
            <textarea id="modal-bai-tap-ve-nha" rows="2" class="w-full border border-[#e2e2e4] rounded-lg px-3 py-1.5 outline-none focus:border-[#0066cc] transition text-[12.5px]" placeholder="Nhiệm vụ về nhà..."></textarea>
          </div>
          <div>
            <label class="block text-[11.5px] font-semibold text-[#414753] mb-1">Lời dặn dò khác</label>
            <input type="text" id="modal-dan-do-giao-vien" class="w-full border border-[#e2e2e4] rounded-lg px-3 py-1.5 outline-none focus:border-[#0066cc] transition text-[12.5px]" placeholder="Nhắc nhở học viên...">
          </div>
          <button type="submit" class="w-full bg-[#0066cc] hover:bg-[#004e9f] text-white font-semibold py-2 px-4 rounded-full transition active:scale-95 text-[13px] mt-1">
            Gửi sổ liên lạc điện tử
          </button>
        </form>
      </div>
    </div>

    <!-- MODAL HỦY KHÓA HỌC -->
    <div id="cancel-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4">
      <div class="bg-white rounded-2xl max-w-sm w-full p-5 border border-[#e2e2e4] shadow-xl">
        <div class="flex justify-between items-center pb-3 border-b border-[#f3f3f5] mb-3">
          <h3 class="text-[13.5px] font-bold text-red-600 flex items-center gap-2">
            <span class="material-symbols-outlined text-[17px]">warning</span>Xác nhận hủy khóa học
          </h3>
          <button id="close-cancel-modal" class="p-1.5 text-[#727784] hover:bg-[#f3f3f5] rounded-full transition-all">
            <span class="material-symbols-outlined text-[19px]">close</span>
          </button>
        </div>
        <form id="cancel-form" class="space-y-2.5 text-sm">
          <input type="hidden" id="modal-dky-id">
          <div>
            <label class="block text-[11.5px] font-semibold text-[#414753] mb-1">Số tiền hoàn trả (VNĐ)</label>
            <input type="text" id="modal-so-tien-hoan" value="0" required class="w-full border border-[#e2e2e4] rounded-lg px-3 py-1.5 outline-none focus:border-[#0066cc] transition text-[12.5px] font-bold">
          </div>
          <div>
            <label class="block text-[11.5px] font-semibold text-[#414753] mb-1">Lý do hủy</label>
            <textarea id="modal-ly-do-huy" rows="3" required class="w-full border border-[#e2e2e4] rounded-lg px-3 py-1.5 outline-none focus:border-[#0066cc] transition text-[12.5px]" placeholder="Lý do hoàn trả học phí..."></textarea>
          </div>
          <div class="flex gap-2 pt-1">
            <button type="button" id="btn-abort-cancel" class="flex-1 border border-[#e2e2e4] hover:bg-[#f3f3f5] text-[#1a1c1d] font-semibold py-2 rounded-full transition active:scale-95 text-[12.5px]">Quay lại</button>
            <button type="submit" class="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-full transition active:scale-95 text-[12.5px]">Hủy khóa học</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL QUICK CHECK-IN -->
    <div id="quick-checkin-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4">
      <div class="bg-white rounded-2xl max-w-sm w-full p-5 border border-[#e2e2e4] shadow-xl">
        <div class="flex justify-between items-center pb-3 border-b border-[#f3f3f5] mb-3">
          <h3 class="text-[14px] font-bold text-[#1a1c1d] flex items-center gap-2">
            <span class="material-symbols-outlined text-[#0066cc] text-[19px]">qr_code_scanner</span>Check-in Vào - Ra nhanh
          </h3>
          <button id="close-quick-checkin-modal" class="p-1.5 text-[#727784] hover:bg-[#f3f3f5] rounded-full transition-all">
            <span class="material-symbols-outlined text-[19px]">close</span>
          </button>
        </div>
        <div class="space-y-3">
          <div class="relative w-full aspect-square bg-[#f5f5f7] rounded-2xl overflow-hidden border border-[#e2e2e4]">
            <div id="reader" class="w-full h-full"></div>
          </div>
          <div class="flex justify-between items-center gap-2">
            <button type="button" id="btn-upload-qr" class="flex-grow flex items-center justify-center gap-1.5 py-2 border border-[#e2e2e4] hover:bg-[#f3f3f5] rounded-xl text-[12px] font-semibold transition active:scale-95 text-[#414753]">
              <span class="material-symbols-outlined text-[17px]">upload_file</span>
              Chọn ảnh QR
            </button>
            <input type="file" id="quick-checkin-file" accept="image/*" class="hidden">
          </div>
          <div class="relative flex items-center">
            <div class="flex-grow border-t border-[#e2e2e4]"></div>
            <span class="flex-shrink-0 mx-3 text-[9px] text-slate-400 font-bold uppercase tracking-wider">Hoặc nhập thủ công</span>
            <div class="flex-grow border-t border-[#e2e2e4]"></div>
          </div>
          <form id="quick-checkin-form" class="flex gap-2">
            <input type="text" id="quick-checkin-input" placeholder="Mã số (VD: HV034, GV001)" required
              class="flex-grow border border-[#e2e2e4] rounded-xl px-4 py-2 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/10 transition text-[13px] font-bold text-center">
            <button type="submit" class="bg-[#0066cc] hover:bg-[#004e9f] text-white font-semibold px-4 py-2 rounded-xl text-[13px] active:scale-95 transition whitespace-nowrap shadow-sm">
              Xác nhận
            </button>
          </form>
        </div>
      </div>
    </div>
  `;

  // ========== KHỞI TẠO LAYOUT ==========
  // Áp dụng trạng thái collapsed từ localStorage
  if (isCollapsed) updateSidebarContent(true);

  // Áp dụng layout ngay sau khi render HTML
  applyLayout();

  // Xử lý resize — sidebar tự thu trên mobile, tự mở trên desktop
  const handleResize = () => {
    const sidebar = document.getElementById('sidebar-menu');
    const overlay = document.getElementById('sidebar-overlay');
    const topbar  = document.getElementById('topbar-header');
    const main    = document.getElementById('main-container');
    const closeBtn = document.getElementById('btn-close-sidebar');
    if (!sidebar || !topbar || !main) return;

    if (window.innerWidth < 768) {
      // Mobile: ẩn sidebar, full-width topbar/main
      sidebar.style.transform = 'translateX(-100%)';
      if (overlay) overlay.classList.add('hidden');
      topbar.style.left  = '0';
      topbar.style.width = '100%';
      main.style.paddingLeft = '0';
      if (closeBtn) closeBtn.style.display = 'flex';
    } else {
      // Desktop: hiện sidebar, điều chỉnh topbar/main theo width
      const sw = getSidebarW();
      sidebar.style.width     = sw + 'px';
      sidebar.style.transform = 'translateX(0)';
      if (overlay) overlay.classList.add('hidden');
      topbar.style.left  = sw + 'px';
      topbar.style.width = 'calc(100% - ' + sw + 'px)';
      main.style.paddingLeft  = sw + 'px';
      if (closeBtn) closeBtn.style.display = 'none';
    }
  };

  window.addEventListener('resize', handleResize);
  handleResize(); // chạy ngay lần đầu

  // Nút 3 gạch — toggle sidebar
  document.getElementById('btn-toggle-sidebar')?.addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar-menu');
    const overlay = document.getElementById('sidebar-overlay');
    const topbar  = document.getElementById('topbar-header');
    const main    = document.getElementById('main-container');

    if (window.innerWidth < 768) {
      // Mobile: trượt overlay
      const isHidden = sidebar.style.transform === 'translateX(-100%)';
      sidebar.style.transform = isHidden ? 'translateX(0)' : 'translateX(-100%)';
      if (overlay) overlay.classList.toggle('hidden', !isHidden);
    } else {
      // Desktop: thu gọn / mở rộng
      const wasCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
      const nowCollapsed = !wasCollapsed;
      localStorage.setItem('sidebar-collapsed', nowCollapsed ? 'true' : 'false');

      const sw = nowCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_FULL;
      sidebar.style.width    = sw + 'px';
      topbar.style.left      = sw + 'px';
      topbar.style.width     = 'calc(100% - ' + sw + 'px)';
      main.style.paddingLeft = sw + 'px';

      updateSidebarContent(nowCollapsed);
    }
  });

  // Nút X đóng sidebar (mobile)
  document.getElementById('btn-close-sidebar')?.addEventListener('click', () => {
    document.getElementById('sidebar-menu').style.transform = 'translateX(-100%)';
    document.getElementById('sidebar-overlay')?.classList.add('hidden');
  });

  // Click overlay đóng sidebar
  document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
    document.getElementById('sidebar-menu').style.transform = 'translateX(-100%)';
    document.getElementById('sidebar-overlay').classList.add('hidden');
  });

  // Logout
  document.getElementById('btn-header-logout')?.addEventListener('click', () => {
    localStorage.clear();
    window.location.reload();
  });

  // Mở modal Quick Check-in & kích hoạt Camera quét QR thực tế
  let html5QrScanner = null;

  async function onScanSuccess(decodedText, decodedResult) {
    stopScanner();
    document.getElementById('quick-checkin-modal')?.classList.add('hidden');
    
    // Gửi request check-in lên server
    try {
      const res = await fetch(`${API_BASE}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_token: decodedText, current_branch: 'Trung tâm chính' })
      });
      const result = await res.json();
      if (result.success) {
        showToast(result.message || 'Check-in thành công!');
        if (currentActiveSubPage === 'checkin-logs') renderSubPage('checkin-logs', role);
      } else {
        showToast(result.error || 'Check-in thất bại', 'error');
      }
    } catch (err) {
      showToast('Không thể kết nối máy chủ', 'error');
    }
  }

  function stopScanner() {
    if (html5QrScanner) {
      html5QrScanner.stop().then(() => {
        html5QrScanner = null;
      }).catch(err => {
        console.error("Lỗi giải phóng camera:", err);
        html5QrScanner = null;
      });
    }
  }

  document.getElementById('btn-quick-checkin')?.addEventListener('click', () => {
    const modal = document.getElementById('quick-checkin-modal');
    const input = document.getElementById('quick-checkin-input');
    if (modal && input) { 
      modal.classList.remove('hidden'); 
      input.value = ''; 
      input.focus(); 
      
      // Kích hoạt camera
      setTimeout(() => {
        try {
          html5QrScanner = new Html5Qrcode("reader");
          html5QrScanner.start(
            { facingMode: "environment" }, 
            {
              fps: 10,
              qrbox: (width, height) => {
                return { width: Math.round(width * 0.7), height: Math.round(height * 0.7) };
              }
            },
            onScanSuccess
          ).catch(err => {
            console.warn("Không thể khởi động camera quét QR:", err);
            const readerDiv = document.getElementById('reader');
            if (readerDiv) readerDiv.innerHTML = `<div class="p-4 text-center text-slate-400 text-xs h-full flex flex-col justify-center items-center select-none">
              <span class="material-symbols-outlined text-red-400 text-[28px] mb-1">videocam_off</span>
              Không thể truy cập camera. Vui lòng cấp quyền hoặc nhập ID thủ công.
            </div>`;
          });
        } catch (e) {
          console.error("Lỗi khởi tạo Html5Qrcode:", e);
        }
      }, 100);
    }
  });

  // Đóng modal Quick Check-in
  document.getElementById('close-quick-checkin-modal')?.addEventListener('click', () => {
    document.getElementById('quick-checkin-modal')?.classList.add('hidden');
    stopScanner();
  });

  // Trigger chọn ảnh QR
  document.getElementById('btn-upload-qr')?.addEventListener('click', () => {
    document.getElementById('quick-checkin-file')?.click();
  });

  // Xử lý quét mã QR từ tệp tin hình ảnh tải lên
  document.getElementById('quick-checkin-file')?.addEventListener('change', async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const tempScanner = new Html5Qrcode("reader");
    try {
      showToast('Đang quét mã QR từ ảnh...', 'info');
      const decodedText = await tempScanner.scanFile(file, false);
      // Gọi onScanSuccess với kết quả quét được
      await onScanSuccess(decodedText, null);
    } catch (err) {
      console.warn("Không tìm thấy mã QR trong ảnh này:", err);
      showToast('Không tìm thấy mã QR hợp lệ trong hình ảnh này', 'error');
    }
  });

  // Submit Quick Check-in
  document.getElementById('quick-checkin-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const studentId = document.getElementById('quick-checkin-input').value.trim();
    if (!studentId) return;
    stopScanner();
    const payload = { ho_so_id: studentId, timestamp: Date.now() };
    const qr_token = btoa(JSON.stringify(payload));
    try {
      const res = await fetch(`${API_BASE}/checkin`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_token, current_branch: 'Trung tâm chính' })
      });
      const result = await res.json();
      if (result.success) {
        showToast(result.message || 'Check-in thành công!');
        document.getElementById('quick-checkin-modal')?.classList.add('hidden');
        if (currentActiveSubPage === 'checkin-logs') renderSubPage('checkin-logs', role);
      } else {
        showToast(result.error || 'Check-in thất bại', 'error');
      }
    } catch (err) { showToast('Không thể kết nối máy chủ', 'error'); }
  });

  // Đóng modals khác
  document.getElementById('close-modal')?.addEventListener('click', () => { document.getElementById('report-modal')?.classList.add('hidden'); });
  document.getElementById('close-cancel-modal')?.addEventListener('click', () => { document.getElementById('cancel-modal')?.classList.add('hidden'); });
  document.getElementById('btn-abort-cancel')?.addEventListener('click', () => { document.getElementById('cancel-modal')?.classList.add('hidden'); });

  // Nav item click
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => { const page = btn.getAttribute('data-page'); if (page) renderSubPage(page, role); });
  });

  // Làm mới
  document.getElementById('btn-refresh')?.addEventListener('click', () => { renderSubPage(currentActiveSubPage || currentPage, role); });

  // Expose _navigatePage để page con điều hướng
  window._navigatePage = (page) => renderSubPage(page, role);

  // Gửi form sổ liên lạc
  document.getElementById('report-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      lich_hoc_id: parseInt(document.getElementById('modal-lich-hoc-id').value) || null,
      hoc_vien_id: parseInt(document.getElementById('modal-hoc-vien-id').value),
      giao_vien_id: parseInt(document.getElementById('modal-giao-vien-id').value),
      nguoi_gui_id: parseInt(document.getElementById('modal-giao-vien-id').value),
      vai_tro_gui: 'giao_vien', loai_nhat_ky: 'giao_vien_dan_do',
      nhan_xet_buoi_hoc: document.getElementById('modal-nhan-xet-buoi_hoc').value,
      bai_tap_ve_nha: document.getElementById('modal-bai-tap-ve-nha').value,
      noi_dung_bai_hoc: document.getElementById('modal-noi-dung-bai-hoc').value,
      so_phut_hoc: parseInt(document.getElementById('modal-so-phut-hoc').value),
      dan_do_giao_vien: document.getElementById('modal-dan-do-giao-vien').value
    };
    try {
      const res = await fetch(`${API_BASE}/reports`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await res.json();
      if (result.success) {
        showToast('Đã gửi sổ liên lạc thành công!');
        document.getElementById('report-modal')?.classList.add('hidden');
        renderSubPage(currentActiveSubPage || currentPage, role);
      } else { showToast(result.error || 'Có lỗi xảy ra', 'error'); }
    } catch (err) { showToast('Không thể kết nối máy chủ', 'error'); }
  });

  // Tự động format số tiền hoàn trả khi nhập liệu
  document.getElementById('modal-so-tien-hoan')?.addEventListener('input', (e) => {
    e.target.value = formatCurrencyInput(e.target.value);
  });

  // Gửi form hủy khóa học
  document.getElementById('cancel-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('modal-dky-id').value;
    const modalEl = document.getElementById('cancel-modal');
    const type = modalEl ? modalEl.getAttribute('data-pkg-type') : 'khoa_hoc';
    const rawMoneyStr = document.getElementById('modal-so-tien-hoan').value;
    const soTienHoan = parseCurrencyInput(rawMoneyStr);

    if (soTienHoan <= 0) {
      showToast('Vui lòng nhập số tiền hoàn trả lớn hơn 0', 'error');
      return;
    }

    const payload = {
      so_tien_hoan: soTienHoan,
      ly_do_huy: document.getElementById('modal-ly-do-huy').value
    };
    try {
      const endpoint = type === 'hoc_kem' 
        ? `${API_BASE}/registrations/tutoring/${id}/cancel` 
        : `${API_BASE}/registrations/${id}/cancel`;
      const res = await fetch(endpoint, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-User-Role': 'le_tan' }, body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        showToast('Đã hủy khóa học thành công!');
        document.getElementById('cancel-modal')?.classList.add('hidden');
        await renderSubPage(currentActiveSubPage || currentPage, role);
        
        // Mở lại modal chi tiết và nhảy vào Tab Gói học & Đăng ký
        if (window.showStudentDetailModal && window.currentStudent) {
          await window.showStudentDetailModal(window.currentStudent);
          // Kích hoạt tab Gói học ngay lập tức
          setTimeout(() => {
            const tabPkg = document.getElementById('btn-tab-packages');
            if (tabPkg) tabPkg.click();
          }, 100);
        }
      } else { showToast(result.error || 'Có lỗi xảy ra', 'error'); }
    } catch (err) { showToast('Không thể kết nối máy chủ', 'error'); }
  });

  // ==========================================
  // XỬ LÝ LOGIC THÔNG BÁO Ở HEADER (Dropdown & Badge)
  // ==========================================
  const btnNotif = document.getElementById('btn-notifications');
  const dropdownNotif = document.getElementById('notifications-dropdown');
  const badgeNotif = document.getElementById('notif-badge');
  const listNotif = document.getElementById('notifications-list');
  const btnClearAllNotif = document.getElementById('btn-clear-all-notif');

  async function loadNotifications() {
    try {
      const res = await fetch(`${API_BASE}/notifications`, {
        headers: {
          'x-user-role': role,
          'x-ho-so-id': localStorage.getItem('hoSoId') || ''
        }
      });
      const result = await res.json();
      if (result.success) {
        const list = result.data || [];
        const unreadCount = list.filter(n => n.da_doc === 0).length;

        // Cập nhật Badge
        if (unreadCount > 0) {
          badgeNotif.textContent = unreadCount;
          badgeNotif.classList.remove('hidden');
        } else {
          badgeNotif.classList.add('hidden');
        }

        // Cập nhật Danh sách dropdown
        if (list.length === 0) {
          listNotif.innerHTML = `<div class="p-5 text-center text-[12px] text-slate-400">Không có thông báo nào</div>`;
          return;
        }

        listNotif.innerHTML = list.map(item => `
          <div class="p-3 text-[12px] hover:bg-slate-50 transition-all relative flex flex-col gap-1 notif-item cursor-pointer ${item.da_doc === 0 ? 'bg-[#0066cc]/5 border-l-2 border-[#0066cc]' : ''}" data-id="${item.id}">
            <div class="flex justify-between items-start pr-6">
              <span class="font-bold text-[#1a1c1d]">${item.tieu_de}</span>
              <button class="btn-delete-notif absolute right-2 top-2 p-1 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 transition-all" data-id="${item.id}" title="Xóa thông báo">
                <span class="material-symbols-outlined text-[14px]">delete</span>
              </button>
            </div>
            <p class="text-slate-600 pr-4">${item.noi_dung}</p>
            <span class="text-[9px] text-slate-400">${new Date(item.ngay_tao).toLocaleString()}</span>
          </div>
        `).join('');

        // Thêm sự kiện click từng thông báo để đọc
        listNotif.querySelectorAll('.notif-item').forEach(el => {
          el.addEventListener('click', async (e) => {
            // Nếu click vào nút xóa thì bỏ qua
            if (e.target.closest('.btn-delete-notif')) return;
            
            const id = el.getAttribute('data-id');
            try {
              const readRes = await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'PUT' });
              const readResult = await readRes.json();
              if (readResult.success) {
                loadNotifications();
              }
            } catch (err) { console.error('Lỗi khi đọc thông báo:', err); }
          });
        });

        // Thêm sự kiện xóa từng thông báo
        listNotif.querySelectorAll('.btn-delete-notif').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            try {
              const delRes = await fetch(`${API_BASE}/notifications/${id}`, { method: 'DELETE' });
              const delResult = await delRes.json();
              if (delResult.success) {
                showToast('Đã xóa thông báo');
                loadNotifications();
              }
            } catch (err) { console.error('Lỗi khi xóa thông báo:', err); }
          });
        });
      }
    } catch (err) {
      console.error('Không thể load thông báo:', err);
    }
  }

  // Bắt đầu load thông báo định kỳ
  loadNotifications();
  const notifInterval = setInterval(loadNotifications, 15000); // 15 giây tự động reload 1 lần
  window.addEventListener('pagehide', () => clearInterval(notifInterval));

  // Toggle Dropdown
  btnNotif?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownNotif.classList.toggle('hidden');
    if (!dropdownNotif.classList.contains('hidden')) {
      loadNotifications();
    }
  });

  // Đóng dropdown khi click bên ngoài
  document.addEventListener('click', (e) => {
    if (dropdownNotif && !dropdownNotif.contains(e.target) && e.target !== btnNotif && !btnNotif?.contains(e.target)) {
      dropdownNotif.classList.add('hidden');
    }
  });

  // Xóa tất cả thông báo
  btnClearAllNotif?.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (confirm('Bạn có chắc chắn muốn xóa tất cả thông báo không?')) {
      try {
        const res = await fetch(`${API_BASE}/notifications/all/clear`, {
          method: 'DELETE',
          headers: { 'x-user-role': role }
        });
        const result = await res.json();
        if (result.success) {
          showToast('Đã xóa toàn bộ thông báo');
          loadNotifications();
        }
      } catch (err) {
        showToast('Lỗi khi xóa thông báo', 'error');
      }
    }
  });

  // Render trang mặc định
  renderSubPage(currentActiveSubPage || currentPage, role);

  // Khởi động chatbot
  initChatbot();
}
