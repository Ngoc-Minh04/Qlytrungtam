const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'src/.env') });

const { pool } = require('./src/config/db');
const apiRouter = require('./src/routes/api');
const cronJobs = require('./cronjobs'); // Tự động load và lên lịch cron jobs

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware cấu hình CORS
app.use(cors({
  origin: '*', // Cho phép tất cả các nguồn hoặc cấu hình chi tiết nếu cần thiết
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Role', 'X-User-Branch', 'x-user-role', 'x-user-branch', 'x-tai-khoan-id', 'x-ho-so-id', 'X-Tai-Khoan-Id', 'X-Ho-So-Id', 'x-ho-ten', 'X-Ho-Ten']
}));

// Middleware parser body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend tĩnh nếu chạy chung (tùy chọn)
app.use(express.static(path.join(__dirname, '../frontend')));

// Khởi chạy API Router
app.use('/api', apiRouter);

// Endpoint kiểm tra server hoạt động
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Chào mừng bạn đến với API Hệ thống Quản lý Trung tâm Dạy học!',
    env: process.env.NODE_ENV,
    port: PORT
  });
});

// Endpoint chạy test cron job thủ công (hỗ trợ kiểm thử)
app.post('/api/test-cron/expire-check', async (req, res) => {
  try {
    await cronJobs.runExpireCheckJob();
    res.json({ success: true, message: 'Đã kích hoạt quét học viên sắp hết hạn gói thành công.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/test-cron/auto-attendance', async (req, res) => {
  try {
    await cronJobs.runAutoAttendanceJob();
    res.json({ success: true, message: 'Đã kích hoạt tự động điểm danh vắng thành công.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Middleware xử lý lỗi tập trung
app.use((err, req, res, next) => {
  console.error('❌ Lỗi hệ thống:', err.stack);
  res.status(500).json({
    success: false,
    error: 'Đã xảy ra lỗi hệ thống cục bộ. Vui lòng kiểm tra log!'
  });
});

// Lắng nghe cổng kết nối
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🚀 Server đang chạy tại địa chỉ: http://localhost:${PORT}`);
  console.log(`⚙️  Môi trường: ${process.env.NODE_ENV}`);
  console.log(`📅 Thời điểm khởi chạy: ${new Date().toLocaleString()}`);
  console.log(`===================================================`);
});

module.exports = app;
