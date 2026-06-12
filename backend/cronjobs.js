const cron = require('node-cron');
const { pool } = require('./src/config/db');

// ============================================================
// TÁC VỤ 1: Quét học viên sắp hết hạn gói và chèn thông báo
// Chạy lúc 08:00 sáng hàng ngày: '0 8 * * *'
// ============================================================
const runExpireCheckJob = async () => {
  console.log('[CRON] ⏰ Bắt đầu tác vụ 1: Quét học viên sắp hết hạn gói học phí...');
  try {
    // 1. Quét View v_trang_thai_hoi_vien lọc ra các học viên sap_het_han
    const queryStr = `
      SELECT id, ma_ho_so, ho_ten, den_ngay_xa_nhat 
      FROM v_trang_thai_hoi_vien 
      WHERE trang_thai_mau = 'sap_het_han'
    `;
    const result = await pool.query(queryStr);
    const sapHetHanHocVien = result.rows;

    console.log(`[CRON] Tìm thấy ${sapHetHanHocVien.length} học viên sắp hết hạn.`);

    for (const hv of sapHetHanHocVien) {
      // 2. Chèn thông báo cho mỗi học viên tìm thấy
      const tieuDe = `Học viên sắp hết hạn gói: ${hv.ho_ten}`;
      const noiDung = `Học viên ${hv.ho_ten} (${hv.ma_ho_so}) có gói học phí sẽ hết hạn vào ngày ${hv.den_ngay_xa_nhat}. Vui lòng liên hệ hỗ trợ gia hạn.`;
      
      // Kiểm tra xem đã có thông báo loại này cho đối tượng này chưa để tránh chèn trùng lặp mỗi ngày
      const checkDupQuery = `
        SELECT id FROM thong_bao 
        WHERE loai = 'sap_het_han_goi_tap' 
          AND doi_tuong_id = $1 
          AND da_doc = 0 
          AND ngay_tao::date = CURRENT_DATE
      `;
      const dupCheck = await pool.query(checkDupQuery, [hv.id]);
      
      if (dupCheck.rows.length === 0) {
        const insertQuery = `
          INSERT INTO thong_bao (loai, tieu_de, noi_dung, doi_tuong_id, doi_tuong, danh_cho)
          VALUES ('sap_het_han_goi_tap', $1, $2, $3, 'ho_so', 'nhan_vien')
        `;
        await pool.query(insertQuery, [tieuDe, noiDung, hv.id]);
        console.log(`[CRON] Đã chèn thông báo sắp hết hạn cho HV: ${hv.ho_ten}`);
      }
    }
    console.log('[CRON] ✅ Hoàn thành tác vụ 1.');
  } catch (err) {
    console.error('[CRON] ❌ Lỗi xảy ra trong tác vụ 1:', err.message);
  }
};

cron.schedule('0 8 * * *', runExpireCheckJob);


// ============================================================
// TÁC VỤ 2: Tự động đánh dấu vắng các buổi học chưa điểm danh
// Chạy lúc 22:00 đêm hàng ngày: '0 22 * * *'
// ============================================================
const runAutoAttendanceJob = async () => {
  console.log('[CRON] ⏰ Bắt đầu tác vụ 2: Quét các buổi học chưa điểm danh trong ngày...');
  try {
    // 1. Đọc giá trị cấu hình giờ từ bảng cau_hinh (khóa 'gio_dong_cua')
    const configQuery = `SELECT gia_tri FROM cau_hinh WHERE khoa = 'gio_dong_cua'`;
    const configResult = await pool.query(configQuery);
    
    let configTime = '22:00';
    if (configResult.rows.length > 0) {
      configTime = configResult.rows[0].gia_tri;
    }
    console.log(`[CRON] Giờ cấu hình đóng cửa nhận được: ${configTime}`);

    // Để đảm bảo tính chính xác, kiểm tra xem thời điểm chạy có khớp với cấu hình hay không.
    // Nếu chạy đúng lúc 22:00 đêm theo lập lịch thì chúng ta xử lý.
    
    // 2. Quét các buổi học trong ngày hôm đó ở bảng lich_hoc mà vẫn ở trạng thái 'cho_hoc'
    const scheduleQuery = `
      SELECT lh.*, hs_hv.ho_ten as ten_hoc_vien, hs_gv.ho_ten as ten_giao_vien
      FROM lich_hoc lh
      JOIN ho_so hs_hv ON lh.hoc_vien_id = hs_hv.id
      JOIN ho_so hs_gv ON lh.giao_vien_id = hs_gv.id
      WHERE lh.ngay_hoc = CURRENT_DATE 
        AND lh.trang_thai = 'cho_hoc'
    `;
    const scheduleResult = await pool.query(scheduleQuery);
    const uncheckSchedules = scheduleResult.rows;

    console.log(`[CRON] Tìm thấy ${uncheckSchedules.length} buổi học chưa điểm danh hôm nay.`);

    if (uncheckSchedules.length > 0) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        for (const session of uncheckSchedules) {
          // Cập nhật trạng thái = 'vang', ghi nhận lỗi vào ghi_chu
          const updateQuery = `
            UPDATE lich_hoc
            SET 
              trang_thai = 'vang',
              da_checkin = 1,
              ghi_chu = COALESCE(ghi_chu, '') || ' [Hệ thống tự động điểm danh vắng lúc ' || $1 || ' do giáo viên quên check-in]',
              ngay_cap_nhat = CURRENT_TIMESTAMP
            WHERE id = $2
          `;
          await client.query(updateQuery, [configTime, session.id]);

          // Chèn một bản ghi loai = 'cron_tu_xac_nhan' vào thong_bao để Admin giám sát
          const tieuDe = `Tự động điểm danh vắng: Buổi học ID ${session.id}`;
          const noiDung = `Buổi học ngày ${session.ngay_hoc.toISOString().split('T')[0]} lúc ${session.gio_bat_dau} - ${session.gio_ket_thuc} giữa GV ${session.ten_giao_vien} và HV ${session.ten_hoc_vien} đã tự động cập nhật trạng thái thành Vắng (Do giáo viên quên điểm danh trước giờ đóng cửa ${configTime}).`;
          
          const insertNotifQuery = `
            INSERT INTO thong_bao (loai, tieu_de, noi_dung, doi_tuong_id, doi_tuong, danh_cho)
            VALUES ('cron_tu_xac_nhan', $1, $2, $3, 'lich_hoc', 'admin')
          `;
          await client.query(insertNotifQuery, [tieuDe, noiDung, session.id]);
        }

        await client.query('COMMIT');
        console.log(`[CRON] ✅ Đã xử lý tự động điểm danh vắng thành công cho ${uncheckSchedules.length} buổi.`);
      } catch (txnErr) {
        await client.query('ROLLBACK');
        throw txnErr;
      } finally {
        client.release();
      }
    } else {
      console.log('[CRON] Không có buổi học nào bị bỏ quên điểm danh hôm nay.');
    }
    console.log('[CRON] ✅ Hoàn thành tác vụ 2.');
  } catch (err) {
    console.error('[CRON] ❌ Lỗi xảy ra trong tác vụ 2:', err.message);
  }
};

cron.schedule('0 22 * * *', runAutoAttendanceJob);

// Xuất các hàm để hỗ trợ chạy thử nghiệm thủ công khi cần
module.exports = {
  runExpireCheckJob,
  runAutoAttendanceJob
};
