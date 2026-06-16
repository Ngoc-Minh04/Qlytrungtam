// Khởi chạy ứng dụng SPA Frontend
import { renderPage, navigate } from './src/router.js';

document.addEventListener('DOMContentLoaded', () => {
  // Hash-based routing cho Live Server (không cần server-side fallback)
  const path = window.location.hash.replace('#', '') || '/';
  renderPage(path);
});
