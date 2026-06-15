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

    // 3. Chèn 6 nội quy mẫu
    const defaultRules = [
      {
        tieu_de: 'Quy định về thời gian học tập',
        noi_dung: 'Học viên và giáo viên phải có mặt đúng giờ học đã đăng ký. Học viên đi trễ quá 15 phút sẽ không được vào lớp. Giáo viên có lịch dạy đột xuất cần nghỉ hoặc đổi ca phải thông báo trước 24 giờ cho lễ tân.',
        ap_dung_cho: 'tat_ca',
        thu_tu: 1
      },
      {
        tieu_de: 'Quy định về trang phục',
        noi_dung: 'Học viên và giáo viên mặc trang phục lịch sự, chỉnh tề khi đến trung tâm. Không mặc quần đùi, áo ba lỗ hoặc trang phục gây phản cảm.',
        ap_dung_cho: 'tat_ca',
        thu_tu: 2
      },
      {
        tieu_de: 'Bảo quản tài sản chung',
        noi_dung: 'Không mang thức ăn, nước uống có màu vào phòng học. Giữ gìn vệ sinh lớp học, không viết bậy lên bàn ghế và bảng đen. Tắt toàn bộ thiết bị điện (máy lạnh, đèn) sau khi kết thúc buổi học.',
        ap_dung_cho: 'tat_ca',
        thu_tu: 3
      },
      {
        tieu_de: 'Quy định chuẩn bị bài giảng',
        noi_dung: 'Giáo viên bắt buộc phải chuẩn bị giáo án và tài liệu học tập trước khi lên lớp. Thường xuyên cập nhật nhật ký học tập và sổ liên lạc cho học viên sau mỗi ca học.',
        ap_dung_cho: 'giao_vien',
        thu_tu: 4
      },
      {
        tieu_de: 'Bảo mật thông tin nội bộ',
        noi_dung: 'Nghiêm cấm nhân viên và giáo viên tiết lộ thông tin cá nhân của học viên, phụ huynh hoặc các tài liệu đào tạo độc quyền của trung tâm ra ngoài.',
        ap_dung_cho: 'nhan_vien',
        thu_tu: 5
      },
      {
        tieu_de: 'Chính sách hoàn trả học phí',
        noi_dung: 'Học phí chỉ được xem xét hoàn trả khi học viên chủ động nộp đơn xin dừng học và làm thủ tục hủy khóa trước ngày khai giảng tối thiểu 7 ngày. Phí hoàn trả sẽ tính dựa trên số buổi chưa học thực tế.',
        ap_dung_cho: 'hoc_vien',
        thu_tu: 6
      }
    ];

    for (const rule of defaultRules) {
      const checkRule = await pool.query('SELECT id FROM noi_quy WHERE tieu_de = $1', [rule.tieu_de]);
      if (checkRule.rows.length === 0) {
        await pool.query(
          'INSERT INTO noi_quy (tieu_de, noi_dung, ap_dung_cho, thu_tu, is_active) VALUES ($1, $2, $3, $4, 1)',
          [rule.tieu_de, rule.noi_dung, rule.ap_dung_cho, rule.thu_tu]
        );
        console.log('Đã chèn nội quy: ' + rule.tieu_de);
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
