const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') }); // Load .env từ backend/.env

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

      // DDL tạo bảng thong_bao
      await client.query(`
        CREATE TABLE IF NOT EXISTS thong_bao (
          id SERIAL PRIMARY KEY,
          loai VARCHAR(50) NOT NULL,
          tieu_de VARCHAR(255) NOT NULL,
          noi_dung TEXT NOT NULL,
          doi_tuong_id INT,
          doi_tuong VARCHAR(50),
          danh_cho VARCHAR(50) DEFAULT 'nhan_vien',
          da_doc SMALLINT DEFAULT 0,
          ngay_tao TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // DDL tạo bảng noi_quy
      await client.query(`
        CREATE TABLE IF NOT EXISTS noi_quy (
          id SERIAL PRIMARY KEY,
          tieu_de VARCHAR(255) NOT NULL,
          noi_dung TEXT NOT NULL,
          ap_dung_cho VARCHAR(100) DEFAULT 'tất cả',
          thu_tu INT DEFAULT 0,
          is_active SMALLINT DEFAULT 1,
          ngay_tao TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // Tự động seed nội quy mặc định nếu bảng trống
      const checkRules = await client.query('SELECT COUNT(*) FROM noi_quy');
      if (parseInt(checkRules.rows[0].count) === 0) {
        await client.query(`
          INSERT INTO noi_quy (tieu_de, noi_dung, ap_dung_cho, thu_tu, is_active) VALUES 
          ('Quy định về thời gian học tập', 'Học viên và giáo viên phải có mặt đúng giờ học đã đăng ký. Học viên đi trễ quá 15 phút sẽ không được vào lớp. Giáo viên có lịch dạy đột xuất cần nghỉ hoặc đổi ca phải thông báo trước 24 giờ cho lễ tân.', 'tat_ca', 1, 1),
          ('Quy định về trang phục', 'Học viên và giáo viên mặc trang phục lịch sự, chỉnh tề khi đến trung tâm. Không mặc quần đùi, áo ba lỗ hoặc trang phục gây phản cảm.', 'tat_ca', 2, 1),
          ('Bảo quản tài sản chung', 'Không mang thức ăn, nước uống có màu vào phòng học. Giữ gìn vệ sinh lớp học, không viết bậy lên bàn ghế và bảng đen. Tắt toàn bộ thiết bị điện (máy lạnh, đèn) sau khi kết thúc buổi học.', 'tat_ca', 3, 1),
          ('Quy định chuẩn bị bài giảng', 'Giáo viên bắt buộc phải chuẩn bị giáo án và tài liệu học tập trước khi lên lớp. Thường xuyên cập nhật nhật ký học tập và sổ liên lạc cho học viên sau mỗi ca học.', 'giao_vien', 4, 1),
          ('Bảo mật thông tin nội bộ', 'Nghiêm cấm nhân viên và giáo viên tiết lộ thông tin cá nhân của học viên, phụ huynh hoặc các tài liệu đào tạo độc quyền của trung tâm ra ngoài.', 'nhan_vien', 5, 1),
          ('Chính sách hoàn trả học phí', 'Học phí chỉ được xem xét hoàn trả khi học viên chủ động nộp đơn xin dừng học và làm thủ tục hủy khóa trước ngày khai giảng tối thiểu 7 ngày. Phí hoàn trả sẽ tính dựa trên số buổi chưa học thực tế.', 'hoc_vien', 6, 1)
        `);
        console.log('✅ Đã seed dữ liệu nội quy mặc định thành công!');
      }

      // Migration: thêm cột ho_so_id vào tai_khoan nếu chưa có
      await client.query(`
        ALTER TABLE tai_khoan ADD COLUMN IF NOT EXISTS ho_so_id INT REFERENCES ho_so(id);
      `);
      await client.query(`
        ALTER TABLE tai_khoan ADD COLUMN IF NOT EXISTS is_deleted SMALLINT DEFAULT 0;
      `);
      await client.query(`
        ALTER TABLE tai_khoan ADD COLUMN IF NOT EXISTS lan_dang_nhap_cuoi TIMESTAMPTZ;
      `);

      // Migration: Thêm cột cấu hình lương riêng biệt cho từng hồ sơ nhân sự/giáo viên
      await client.query(`
        ALTER TABLE ho_so ADD COLUMN IF NOT EXISTS luong_cung_ngay NUMERIC DEFAULT 300000;
      `);
      await client.query(`
        ALTER TABLE ho_so ADD COLUMN IF NOT EXISTS don_gia_ca_nhom NUMERIC DEFAULT 150000;
      `);
      await client.query(`
        ALTER TABLE ho_so ADD COLUMN IF NOT EXISTS don_gia_ca_kem NUMERIC DEFAULT 200000;
      `);

      // Migration: Thêm cột khấu trừ cho bảng lương
      await client.query(`
        CREATE TABLE IF NOT EXISTS bang_luong (
          id SERIAL PRIMARY KEY,
          ho_so_id INT REFERENCES ho_so(id),
          thang INT NOT NULL,
          nam INT NOT NULL,
          luong_cung NUMERIC DEFAULT 0,
          luong_ca_day NUMERIC DEFAULT 0,
          phu_cap NUMERIC DEFAULT 0,
          thuc_linh NUMERIC DEFAULT 0,
          trang_thai VARCHAR(20) DEFAULT 'chua_thanh_toan',
          ngay_thanh_toan TIMESTAMPTZ,
          ngay_tao TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(ho_so_id, thang, nam)
        );
      `);
      await client.query(`
        ALTER TABLE bang_luong ADD COLUMN IF NOT EXISTS khau_tru NUMERIC DEFAULT 0;
      `);

      // DDL tạo bảng vai_tro
      await client.query(`
        CREATE TABLE IF NOT EXISTS vai_tro (
          id SERIAL PRIMARY KEY,
          ten_vai_tro VARCHAR(50) UNIQUE NOT NULL,
          mo_ta VARCHAR(255)
        );
      `);

      // DDL tạo bảng tai_khoan
      await client.query(`
        CREATE TABLE IF NOT EXISTS tai_khoan (
          id SERIAL PRIMARY KEY,
          ten_dang_nhap VARCHAR(100) UNIQUE NOT NULL,
          mat_khau VARCHAR(255) NOT NULL,
          vai_tro_id INT REFERENCES vai_tro(id),
          ho_so_id INT REFERENCES ho_so(id),
          is_active SMALLINT DEFAULT 1,
          is_deleted SMALLINT DEFAULT 0,
          lan_dang_nhap_cuoi TIMESTAMPTZ,
          ngay_tao TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // DDL tạo bảng danh_gia_giao_vien (nếu chưa có)
      await client.query(`
        CREATE TABLE IF NOT EXISTS danh_gia_giao_vien (
          id SERIAL PRIMARY KEY,
          giao_vien_id INT REFERENCES ho_so(id),
          hoc_vien_id INT REFERENCES ho_so(id),
          lich_hoc_id INT,
          so_sao SMALLINT CHECK (so_sao BETWEEN 1 AND 5),
          nhan_xet TEXT,
          ngay_tao TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // DDL tạo bảng yeu_cau_dat_lich
      await client.query(`
        CREATE TABLE IF NOT EXISTS yeu_cau_dat_lich (
          id SERIAL PRIMARY KEY,
          hoc_vien_id INT REFERENCES ho_so(id),
          giao_vien_id INT REFERENCES ho_so(id),
          ngay_mong_muon DATE NOT NULL,
          gio_bat_dau TIME NOT NULL,
          gio_ket_thuc TIME NOT NULL,
          ghi_chu TEXT DEFAULT '',
          trang_thai VARCHAR(20) DEFAULT 'cho_duyet',
          ngay_tao TIMESTAMPTZ DEFAULT NOW(),
          ngay_cap_nhat TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // DDL tạo bảng ghi_chu_giao_vien
      await client.query(`
        CREATE TABLE IF NOT EXISTS ghi_chu_giao_vien (
          id SERIAL PRIMARY KEY,
          giao_vien_id INT REFERENCES ho_so(id),
          hoc_vien_id INT REFERENCES ho_so(id),
          noi_dung TEXT NOT NULL,
          ngay_tao TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // Seed vai_tro mặc định
      const checkVaiTro = await client.query("SELECT COUNT(*) FROM vai_tro");
      if (parseInt(checkVaiTro.rows[0].count) === 0) {
        await client.query(`
          INSERT INTO vai_tro (ten_vai_tro, mo_ta) VALUES
            ('admin', 'Quản trị viên hệ thống'),
            ('le_tan', 'Lễ tân / Nhân viên'),
            ('giao_vien', 'Giáo viên'),
            ('hoc_vien', 'Học viên')
          ON CONFLICT (ten_vai_tro) DO NOTHING
        `);

        // Seed tài khoản mẫu
        await client.query(`
          INSERT INTO tai_khoan (ten_dang_nhap, mat_khau, vai_tro_id, ho_so_id, is_active)
          SELECT 'admin', 'admin123', v.id, NULL, 1
          FROM vai_tro v WHERE v.ten_vai_tro = 'admin'
          ON CONFLICT (ten_dang_nhap) DO NOTHING
        `);
        await client.query(`
          INSERT INTO tai_khoan (ten_dang_nhap, mat_khau, vai_tro_id, ho_so_id, is_active)
          SELECT 'letan', 'letan123', v.id, NULL, 1
          FROM vai_tro v WHERE v.ten_vai_tro = 'le_tan'
          ON CONFLICT (ten_dang_nhap) DO NOTHING
        `);
        console.log('✅ Đã seed vai_tro và tài khoản mặc định (admin/admin123, letan/letan123)');
      }

      console.log('✅ Khởi tạo các bảng lớp học nhóm (lop_hoc, lop_hoc_hoc_vien, lich_hoc_nhom, thong_bao, noi_quy) thành công!');
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
