// Khởi chạy ứng dụng SPA Frontend
import { renderPage, navigate } from './src/router.js';

document.addEventListener('DOMContentLoaded', () => {
  // Kích hoạt render trang theo URL hiện tại của trình duyệt
  renderPage(window.location.pathname);
});
