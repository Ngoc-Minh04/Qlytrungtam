const { pool } = require('./src/config/db');

async function seed() {
  try {
    console.log('--- SEED DATA SCRIPT ---');
    
    // 1. Chèn 10 Học viên
    for (let i = 1; i <= 10; i++) {
      const ma = 'HV_TEST_' + i;
      const ho_ten = 'Học Viên Test ' + i;
      const sdt = '098765432' + (i - 1);
      const email = 'hv_test_' + i + '@stellar.edu.vn';
      
      const check = await pool.query('SELECT id FROM ho_so WHERE ma_ho_so = $1', [ma]);
      if (check.rows.length === 0) {
        await pool.query(
          "INSERT INTO ho_so (ma_ho_so, ho_ten, ngay_sinh, gioi_tinh, ten_phu_huynh, so_dien_thoai, email, trinh_do_dau_vao, chi_nhanh, loai_ho_so, is_deleted) VALUES ($1, $2, '2010-01-01', 'nam', 'Phụ huynh Test', $3, $4, 'Cơ bản A1', 'Trung tam chính', 'hoc_vien', 0)",
          [ma, ho_ten, sdt, email]
        );
        console.log('Đã chèn ' + ho_ten);
      }
    }
    
    // 2. Chèn 10 Giáo viên
    for (let i = 1; i <= 10; i++) {
      const ma = 'GV_TEST_' + i;
      const ho_ten = 'Giáo Viên Test ' + i;
      const sdt = '091234567' + (i - 1);
      const email = 'gv_test_' + i + '@stellar.edu.vn';
      
      const check = await pool.query('SELECT id FROM ho_so WHERE ma_ho_so = $1', [ma]);
      if (check.rows.length === 0) {
        await pool.query(
          "INSERT INTO ho_so (ma_ho_so, ho_ten, so_dien_thoai, email, chuyen_mon, kinh_nghiem, chi_nhanh, loai_ho_so, is_deleted) VALUES ($1, $2, $3, $4, 'Luyện thi IELTS', 5, 'Trung tam chính', 'giao_vien', 0)",
          [ma, ho_ten, sdt, email]
        );
        console.log('Đã chèn ' + ho_ten);
      }
    }
    
    console.log('--- SEED HOÀN TẤT ---');
    process.exit(0);
  } catch (err) {
    console.error('Lỗi khi seed data:', err.message);
    process.exit(1);
  }
}

seed();
