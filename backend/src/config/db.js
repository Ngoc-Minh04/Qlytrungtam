const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') }); // Load .env từ thư mục backend

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Kiểm tra kết nối và khởi tạo các bảng nếu chưa có
pool.connect(async (err, client, release) => {
  if (err) {
    console.error('❌ Kết nối database thất bại:', err.stack);
  } else {
    console.log('✅ Kết nối database PostgreSQL thành công!');
    try {
      // DDL tạo bảng lop_hoc
      await client.query(`
        CREATE TABLE IF NOT EXISTS lop_hoc (
          id SERIAL PRIMARY KEY,
          ten_lop VARCHAR(100) NOT NULL,
          giao_vien_id INT REFERENCES ho_so(id),
          loai_lop VARCHAR(20) DEFAULT 'nhom', -- 'nhom' hoặc 'ca_nhan'
          goi_hoc_phi_id INT REFERENCES goi_hoc_phi(id),
          max_hoc_vien INT DEFAULT 10,
          trang_thai VARCHAR(20) DEFAULT 'dang_hoat_dong',
          ngay_tao TIMESTAMPTZ DEFAULT NOW(),
          is_deleted SMALLINT DEFAULT 0
        );
      `);

      // DDL tạo bảng lop_hoc_hoc_vien
      await client.query(`
        CREATE TABLE IF NOT EXISTS lop_hoc_hoc_vien (
          id SERIAL PRIMARY KEY,
          lop_hoc_id INT REFERENCES lop_hoc(id) ON DELETE CASCADE,
          hoc_vien_id INT REFERENCES ho_so(id) ON DELETE CASCADE,
          ngay_tham_gia TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // DDL tạo bảng lich_hoc_nhom
      await client.query(`
        CREATE TABLE IF NOT EXISTS lich_hoc_nhom (
          id SERIAL PRIMARY KEY,
          lop_hoc_id INT REFERENCES lop_hoc(id) ON DELETE CASCADE,
          giao_vien_id INT REFERENCES ho_so(id),
          ngay_hoc DATE NOT NULL,
          gio_bat_dau TIME NOT NULL,
          gio_ket_thuc TIME NOT NULL,
          trang_thai VARCHAR(20) DEFAULT 'cho_hoc',
          ngay_tao TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      console.log('✅ Khởi tạo các bảng lớp học nhóm (lop_hoc, lop_hoc_hoc_vien, lich_hoc_nhom) thành công!');
    } catch (dbErr) {
      console.error('❌ Lỗi khởi tạo bảng lớp học:', dbErr.message);
    } finally {
      release();
    }
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
// Tránh rò rỉ kết nối bằng cách xuất ra pool để dùng cho Transaction
