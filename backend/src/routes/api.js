const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// ============================================================
// MIDDLEWARE PHÂN QUYỀN VÀ BẢO MẬT API (Bảo mật API nâng cao)
// ============================================================
const verifyAccess = (requiredRoles) => {
  return async (req, res, next) => {
    // Đọc thông tin giả lập từ Headers
    const userRole = req.headers['x-user-role'] || 'hoc_vien';
    const userBranch = req.headers['x-user-branch'] || 'Trung tam chính';

    if (!requiredRoles.includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        error: `Quyền truy cập bị từ chối. Hành động này yêu cầu quyền: ${requiredRoles.join(', ')}` 
      });
    }

    req.userRole = userRole;
    req.userBranch = userBranch;
    next();
  };
};

// ============================================================
// 1. PHÂN HỆ QUẢN LÝ KHÓA HỌC & HỌC PHÍ
// ============================================================

// API POST /api/registrations: Đăng ký khóa học đại trà (Có kiểm soát lỗi)
router.post('/registrations', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { ho_so_id, goi_hoc_phi_id, tu_ngay, den_ngay, gia_thuc_te, so_tien_da_thu, phuong_thuc_tt, chi_nhanh_mua } = req.body;

  // 1. Chặn số tiền thực thu âm hoặc lớn hơn giá trị thực tế
  if (so_tien_da_thu < 0 || so_tien_da_thu > gia_thuc_te) {
    return res.status(400).json({ success: false, error: 'Số tiền đã thu phải lớn hơn hoặc bằng 0 và không được vượt quá giá thực tế của khóa học' });
  }

  // 2. Chặn đăng ký lùi về quá khứ (tu_ngay không được trước ngày hôm nay)
  const today = new Date().toISOString().split('T')[0];
  if (tu_ngay < today) {
    return res.status(400).json({ success: false, error: 'Ngày bắt đầu khóa học không được lùi về quá khứ' });
  }

  // 3. Chặn đăng ký trùng lặp / overlap thời gian khóa học cùng loại
  try {
    const overlapCheck = `
      SELECT id FROM dang_ky_khoa_hoc
      WHERE ho_so_id = $1 
        AND trang_thai = 'dang_hoat_dong'
        AND NOT (den_ngay < $2 OR tu_ngay > $3)
    `;
    const overlapRes = await pool.query(overlapCheck, [ho_so_id, tu_ngay, den_ngay]);
    if (overlapRes.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Học viên đã có một khóa học đại trà hoạt động trong khoảng thời gian này (Lỗi trùng thời gian học)' });
    }

    // Tiến hành chèn dữ liệu
    const insertQuery = `
      INSERT INTO dang_ky_khoa_hoc (
        ho_so_id, goi_hoc_phi_id, tu_ngay, den_ngay, gia_thuc_te, so_tien_da_thu, 
        phuong_thuc_tt, chi_nhanh_mua, trang_thai
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'dang_hoat_dong')
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [
      ho_so_id, goi_hoc_phi_id, tu_ngay, den_ngay, gia_thuc_te, so_tien_da_thu, phuong_thuc_tt, chi_nhanh_mua || 'Trung tam chính'
    ]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API POST /api/registrations/tutoring: Đăng ký học kèm 1-1
router.post('/registrations/tutoring', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { hoc_vien_id, giao_vien_id, goi_hoc_kem_id, tu_ngay, den_ngay, gia_thuc_te, so_tien_da_thu, phuong_thuc_tt, so_buoi_dang_ky } = req.body;

  if (hoc_vien_id === giao_vien_id) {
    return res.status(400).json({ success: false, error: 'Học viên và Giáo viên không được trùng nhau' });
  }

  if (so_tien_da_thu < 0 || so_tien_da_thu > gia_thuc_te) {
    return res.status(400).json({ success: false, error: 'Số tiền thực thu không hợp lệ' });
  }

  try {
    const insertQuery = `
      INSERT INTO dang_ky_hoc_kem (
        hoc_vien_id, giao_vien_id, goi_hoc_kem_id, so_buoi_dang_ky, so_buoi_da_hoc,
        tu_ngay, den_ngay, gia_thuc_te, so_tien_da_thu, phuong_thuc_tt, trang_thai
      ) VALUES ($1, $2, $3, $4, 0, $5, $6, $7, $8, $9, 'dang_hoat_dong')
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [
      hoc_vien_id, giao_vien_id, goi_hoc_kem_id, so_buoi_dang_ky, tu_ngay, den_ngay || null, gia_thuc_te, so_tien_da_thu, phuong_thuc_tt
    ]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// 2. PHÂN HỆ XẾP LỊCH HỌC & VẬN HÀNH ĐIỂM DANH
// ============================================================

// API POST /api/schedule: Xếp lịch học kèm/lớp học (Chống 3 lỗi lớn)
router.post('/schedule', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { dang_ky_hoc_kem_id, ngay_hoc, gio_bat_dau, gio_ket_thuc, loai_buoi } = req.body;

  try {
    // 1. Đọc thông tin hợp đồng đăng ký học kèm
    const contractRes = await pool.query('SELECT * FROM dang_ky_hoc_kem WHERE id = $1', [dang_ky_hoc_kem_id]);
    if (contractRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy đăng ký học kèm tương ứng' });
    }
    const contract = contractRes.rows[0];

    // 2. Chặn xếp lịch học ngoài thời hạn hợp đồng
    const dateHoc = new Date(ngay_hoc);
    const dateTu = new Date(contract.tu_ngay);
    const dateDen = contract.den_ngay ? new Date(contract.den_ngay) : null;

    if (dateHoc < dateTu || (dateDen && dateHoc > dateDen)) {
      return res.status(400).json({ 
        success: false, 
        error: `Lỗi: Ngày xếp lịch (${ngay_hoc}) nằm ngoài thời hạn hợp đồng (từ ${contract.tu_ngay.toISOString().split('T')[0]} đến ${contract.den_ngay ? contract.den_ngay.toISOString().split('T')[0] : 'vô hạn'})` 
      });
    }

    // 3. Chặn vượt quá số buổi đăng ký (Đã học + Sẽ học không vượt quá đăng ký)
    const countRes = await pool.query(
      "SELECT COUNT(*) FROM lich_hoc WHERE dang_ky_hoc_kem_id = $1 AND trang_thai IN ('cho_hoc', 'da_hoc')",
      [dang_ky_hoc_kem_id]
    );
    const activeSessions = parseInt(countRes.rows[0].count);
    if (activeSessions >= contract.so_buoi_dang_ky) {
      return res.status(400).json({ 
        success: false, 
        error: `Lỗi: Học viên đã xếp đủ ${activeSessions}/${contract.so_buoi_dang_ky} buổi theo gói học. Không được phép xếp thêm.` 
      });
    }

    // 4. Chặn trùng lịch dạy của Giáo viên (Teacher Overbooking)
    const checkGvOverlap = `
      SELECT id FROM lich_hoc
      WHERE giao_vien_id = $1 
        AND ngay_hoc = $2 
        AND trang_thai != 'da_huy'
        AND NOT (gio_ket_thuc <= $3 OR gio_bat_dau >= $4)
    `;
    const overlapRes = await pool.query(checkGvOverlap, [contract.giao_vien_id, ngay_hoc, gio_bat_dau, gio_ket_thuc]);
    if (overlapRes.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Giáo viên phụ trách đã bị trùng lịch giảng dạy một lớp/buổi học kèm khác vào khung giờ này!' 
      });
    }

    // Tiến hành xếp lịch học
    const insertQuery = `
      INSERT INTO lich_hoc (
        dang_ky_hoc_kem_id, giao_vien_id, hoc_vien_id, ngay_hoc, gio_bat_dau, gio_ket_thuc, loai_buoi, trang_thai
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'cho_hoc')
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [
      dang_ky_hoc_kem_id, contract.giao_vien_id, contract.hoc_vien_id, ngay_hoc, gio_bat_dau, gio_ket_thuc, loai_buoi || 'ca_nhan'
    ]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API PUT /api/schedule/:id/cancel: Hủy lịch dạy/học (Chặn hủy sát giờ học)
router.put('/schedule/:id/cancel', verifyAccess(['admin', 'le_tan', 'giao_vien', 'hoc_vien']), async (req, res) => {
  const { id } = req.params;

  try {
    const sessionRes = await pool.query('SELECT * FROM lich_hoc WHERE id = $1', [id]);
    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy buổi học' });
    }
    const session = sessionRes.rows[0];

    if (session.trang_thai !== 'cho_hoc') {
      return res.status(400).json({ success: false, error: 'Buổi học đã được xử lý điểm danh trước đó, không thể hủy' });
    }

    // Đọc thời gian hủy tối thiểu từ cấu hình (mặc định 2 giờ)
    const configRes = await pool.query("SELECT gia_tri FROM cau_hinh WHERE khoa = 'han_huy_buoi_hoc_gio'");
    const minHours = configRes.rows.length > 0 ? parseFloat(configRes.rows[0].gia_tri) : 2;

    const startStr = `${session.ngay_hoc.toISOString().split('T')[0]} ${session.gio_bat_dau}`;
    const startTime = new Date(startStr);
    const now = new Date();
    const diffMs = startTime - now;
    const diffHours = diffMs / (1000 * 60 * 60);

    // Nếu cách giờ học nhỏ hơn 2 tiếng -> Tự động chuyển thành 'vang' (vẫn trừ 1 buổi học)
    if (diffHours < minHours) {
      const updateQuery = `
        UPDATE lich_hoc
        SET 
          trang_thai = 'vang', 
          da_checkin = 1,
          pt_xac_nhan = 1,
          hv_xac_nhan = 1,
          ngay_xac_nhan = CURRENT_TIMESTAMP,
          ghi_chu = 'Hủy muộn sát giờ học (< ' || $1 || ' tiếng). Chuyển thành vắng và vẫn tính buổi.'
        WHERE id = $2
        RETURNING *
      `;
      // Ngoài ra phải cộng dồn buổi học vào hợp đồng dạy học kèm
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const updated = await client.query(updateQuery, [minHours, id]);
        await client.query(
          'UPDATE dang_ky_hoc_kem SET so_buoi_da_hoc = so_buoi_da_hoc + 1 WHERE id = $1',
          [session.dang_ky_hoc_kem_id]
        );
        await client.query('COMMIT');
        return res.json({ 
          success: true, 
          data: updated.rows[0], 
          message: `Cảnh báo: Do hủy muộn dưới ${minHours} giờ trước buổi học, buổi học đã bị tính vắng không phép và khấu trừ 1 buổi vào gói học.` 
        });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    // Nếu hủy trước hạn -> Hủy thành công bình thường
    const cancelRes = await pool.query(
      "UPDATE lich_hoc SET trang_thai = 'da_huy', ngay_cap_nhat = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [id]
    );
    res.json({ success: true, data: cancelRes.rows[0], message: 'Hủy lịch học thành công và không tính vào gói học.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// 3. PHÂN HỆ QUÉT QR CODE & LƯỢT VÀO - RA
// ============================================================

// API POST /api/checkin: Quét QR check-in chống gian lận
router.post('/checkin', async (req, res) => {
  const { qr_token, current_branch } = req.body; // Token QR dạng JSON string hoặc chuỗi mã hóa

  try {
    // 1. Giải mã token (Giả lập QR token chứa: { ho_so_id, timestamp })
    let payload;
    try {
      const decoded = Buffer.from(qr_token, 'base64').toString('utf8');
      payload = JSON.parse(decoded);
    } catch (e) {
      return res.status(400).json({ success: false, error: 'Mã QR không hợp lệ hoặc đã bị lỗi định dạng' });
    }

    const { ho_so_id, timestamp } = payload;

    // 2. Chống gian lận bằng kiểm tra QR Code động quá hạn 5 phút
    const configRes = await pool.query("SELECT gia_tri FROM cau_hinh WHERE khoa = 'qr_token_ttl_phut'");
    const ttlMin = configRes.rows.length > 0 ? parseInt(configRes.rows[0].gia_tri) : 5;

    const qrTime = new Date(timestamp);
    const now = new Date();
    const diffMs = now - qrTime;
    const diffMin = diffMs / (1000 * 60);

    if (diffMin > ttlMin || diffMin < -1) {
      return res.status(400).json({ success: false, error: 'Mã QR đã hết hạn hiệu lực. Vui lòng làm mới mã QR trên ứng dụng học viên để check-in' });
    }

    // 3. Truy vấn hồ sơ học viên
    const hsRes = await pool.query('SELECT * FROM ho_so WHERE id = $1 AND is_deleted = 0', [ho_so_id]);
    if (hsRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ tương ứng' });
    }
    const student = hsRes.rows[0];

    // 4. Check-in đúng chi nhánh
    if (student.chi_nhanh && current_branch && student.chi_nhanh !== current_branch) {
      return res.status(400).json({ 
        success: false, 
        error: `Lỗi: Học viên đăng ký học tại chi nhánh [${student.chi_nhanh}] nhưng đang check-in tại chi nhánh [${current_branch}]. Vui lòng di chuyển về đúng chi nhánh.` 
      });
    }

    // 5. Check-in khi khóa học hết hạn hoặc hết buổi
    const viewRes = await pool.query('SELECT * FROM v_trang_thai_hoi_vien WHERE id = $1', [ho_so_id]);
    if (viewRes.rows.length > 0) {
      const vt = viewRes.rows[0];
      if (vt.trang_thai_mau === 'het_han') {
        return res.status(400).json({ success: false, error: 'Check-in bị từ chối: Khóa học đại trà của học viên đã hết hạn.' });
      }
      if (vt.trang_thai_mau === 'chua_dang_ky') {
        return res.status(400).json({ success: false, error: 'Check-in bị từ chối: Học viên chưa đăng ký bất kỳ khóa học nào.' });
      }
    }

    // Ghi nhận lượt vào ra thành công
    const insertQuery = `
      INSERT INTO luot_vao_ra (ho_so_id, thoi_diem, loai, phuong_thuc, chi_nhanh_thuc_hien)
      VALUES ($1, CURRENT_TIMESTAMP, 'vao', 'qr_code', $2)
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [ho_so_id, current_branch || student.chi_nhanh || 'Trung tam chính']);

    res.json({ 
      success: true, 
      data: result.rows[0], 
      message: `Chào mừng học viên [${student.ho_ten}] đã check-in thành công tại chi nhánh ${current_branch || 'trung tâm'}` 
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// 4. PHÂN HỆ THỐNG KÊ DOANH THU & ĐỒNG BỘ TRẠNG THÁI
// ============================================================

// API GET /api/reports/revenue: Báo cáo doanh thu thật (Không tính doanh thu ảo) hỗ trợ filter = today | yesterday | month
router.get('/reports/revenue', verifyAccess(['admin']), async (req, res) => {
  const { filter } = req.query; // today, yesterday, month
  try {
    let dateCondition = '';
    if (filter === 'today') {
      dateCondition = "AND CURRENT_DATE = ngay_tao::date";
    } else if (filter === 'yesterday') {
      dateCondition = "AND (CURRENT_DATE - 1) = ngay_tao::date";
    } else if (filter === 'month') {
      dateCondition = "AND date_trunc('month', ngay_tao) = date_trunc('month', CURRENT_DATE)";
    }

    // 1. Thống kê tiền khóa học loại trừ trạng thái 'huy' và 'tam_dung'
    const khoaHocQuery = `
      SELECT COALESCE(SUM(gia_thuc_te), 0) as tong_gia, COALESCE(SUM(so_tien_da_thu), 0) as thuc_thu, COALESCE(SUM(so_tien_hoan), 0) as tong_hoan
      FROM dang_ky_khoa_hoc
      WHERE trang_thai NOT IN ('huy', 'tam_dung') ${dateCondition.replace('ngay_tao', 'ngay_tao')}
    `;
    const khRes = await pool.query(khoaHocQuery);

    // 2. Thống kê tiền học kèm loại trừ trạng thái 'huy' và 'tam_dung'
    const hocKemQuery = `
      SELECT COALESCE(SUM(gia_thuc_te), 0) as tong_gia, COALESCE(SUM(so_tien_da_thu), 0) as thuc_thu, COALESCE(SUM(so_tien_hoan), 0) as tong_hoan
      FROM dang_ky_hoc_kem
      WHERE trang_thai NOT IN ('huy', 'tam_dung') ${dateCondition.replace('ngay_tao', 'ngay_tao')}
    `;
    const hkRes = await pool.query(hocKemQuery);

    // 3. Thống kê chi tiết theo ngày
    let statsQuery = `
      SELECT ngay, tong_tien, tong_don, tien_khoa_hoc, tien_hoc_kem 
      FROM doanh_thu 
      ORDER BY ngay DESC 
      LIMIT 30
    `;
    if (filter === 'today') {
      statsQuery = `
        SELECT CURRENT_DATE as ngay, 
               COALESCE((SELECT SUM(so_tien_da_thu) FROM dang_ky_khoa_hoc WHERE trang_thai NOT IN ('huy', 'tam_dung') AND ngay_tao::date = CURRENT_DATE), 0) +
               COALESCE((SELECT SUM(so_tien_da_thu) FROM dang_ky_hoc_kem WHERE trang_thai NOT IN ('huy', 'tam_dung') AND ngay_tao::date = CURRENT_DATE), 0) as tong_tien,
               COALESCE((SELECT COUNT(*) FROM dang_ky_khoa_hoc WHERE trang_thai NOT IN ('huy', 'tam_dung') AND ngay_tao::date = CURRENT_DATE), 0) +
               COALESCE((SELECT COUNT(*) FROM dang_ky_hoc_kem WHERE trang_thai NOT IN ('huy', 'tam_dung') AND ngay_tao::date = CURRENT_DATE), 0) as tong_don,
               COALESCE((SELECT SUM(so_tien_da_thu) FROM dang_ky_khoa_hoc WHERE trang_thai NOT IN ('huy', 'tam_dung') AND ngay_tao::date = CURRENT_DATE), 0) as tien_khoa_hoc,
               COALESCE((SELECT SUM(so_tien_da_thu) FROM dang_ky_hoc_kem WHERE trang_thai NOT IN ('huy', 'tam_dung') AND ngay_tao::date = CURRENT_DATE), 0) as tien_hoc_kem
      `;
    } else if (filter === 'yesterday') {
      statsQuery = `
        SELECT (CURRENT_DATE - 1) as ngay, 
               COALESCE((SELECT SUM(so_tien_da_thu) FROM dang_ky_khoa_hoc WHERE trang_thai NOT IN ('huy', 'tam_dung') AND ngay_tao::date = CURRENT_DATE - 1), 0) +
               COALESCE((SELECT SUM(so_tien_da_thu) FROM dang_ky_hoc_kem WHERE trang_thai NOT IN ('huy', 'tam_dung') AND ngay_tao::date = CURRENT_DATE - 1), 0) as tong_tien,
               COALESCE((SELECT COUNT(*) FROM dang_ky_khoa_hoc WHERE trang_thai NOT IN ('huy', 'tam_dung') AND ngay_tao::date = CURRENT_DATE - 1), 0) +
               COALESCE((SELECT COUNT(*) FROM dang_ky_hoc_kem WHERE trang_thai NOT IN ('huy', 'tam_dung') AND ngay_tao::date = CURRENT_DATE - 1), 0) as tong_don,
               COALESCE((SELECT SUM(so_tien_da_thu) FROM dang_ky_khoa_hoc WHERE trang_thai NOT IN ('huy', 'tam_dung') AND ngay_tao::date = CURRENT_DATE - 1), 0) as tien_khoa_hoc,
               COALESCE((SELECT SUM(so_tien_da_thu) FROM dang_ky_hoc_kem WHERE trang_thai NOT IN ('huy', 'tam_dung') AND ngay_tao::date = CURRENT_DATE - 1), 0) as tien_hoc_kem
      `;
    }
    const statsRes = await pool.query(statsQuery);

    // 4. Thống kê gói học bán chạy nhất (ví dụ top 3 gói đại trà)
    const bestSellerQuery = `
      SELECT g.ten_goi, COUNT(d.id) as so_luong, SUM(d.so_tien_da_thu) as tong_doanh_thu
      FROM dang_ky_khoa_hoc d
      JOIN goi_hoc_phi g ON d.goi_hoc_phi_id = g.id
      WHERE d.trang_thai NOT IN ('huy', 'tam_dung')
      GROUP BY g.ten_goi
      ORDER BY so_luong DESC
      LIMIT 3
    `;
    const bestSellerRes = await pool.query(bestSellerQuery);

    // 5. Danh sách các giao dịch thanh toán cụ thể trong kỳ filter
    const paymentsQuery = `
      SELECT d.id, h.ho_ten, g.ten_goi as ten_khoa_hoc, d.so_tien_da_thu, d.phuong_thuc_tt, d.ngay_tao
      FROM dang_ky_khoa_hoc d
      JOIN ho_so h ON d.ho_so_id = h.id
      JOIN goi_hoc_phi g ON d.goi_hoc_phi_id = g.id
      WHERE d.trang_thai NOT IN ('huy', 'tam_dung') ${dateCondition}
      UNION ALL
      SELECT dk.id, h.ho_ten, gk.ten_goi as ten_khoa_hoc, dk.so_tien_da_thu, dk.phuong_thuc_tt, dk.ngay_tao
      FROM dang_ky_hoc_kem dk
      JOIN ho_so h ON dk.hoc_vien_id = h.id
      JOIN goi_hoc_kem gk ON dk.goi_hoc_kem_id = gk.id
      WHERE dk.trang_thai NOT IN ('huy', 'tam_dung') ${dateCondition.replace('ngay_tao', 'ngay_tao')}
      ORDER BY ngay_tao DESC
      LIMIT 30
    `;
    const paymentsRes = await pool.query(paymentsQuery);

    res.json({
      success: true,
      data: {
        khoa_hoc: khRes.rows[0],
        hoc_kem: hkRes.rows[0],
        lich_su_doanh_thu: statsRes.rows.map(r => ({
          ...r,
          // Đảm bảo kiểu số
          tong_tien: parseFloat(r.tong_tien || 0),
          tien_khoa_hoc: parseFloat(r.tien_khoa_hoc || 0),
          tien_hoc_kem: parseFloat(r.tien_hoc_kem || 0)
        })),
        goi_pho_bien: bestSellerRes.rows,
        giao_dich: paymentsRes.rows
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// 5. CÁC API PHỤC VỤ MENU VÀ ACCORDION CẤP 2 CHO FRONTEND
// ============================================================

// GET /api/course-packages: Lấy danh sách gói học phí
router.get('/course-packages', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM goi_hoc_phi WHERE is_deleted = 0 ORDER BY ten_goi ASC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/course-packages: Thêm mới gói học phí
router.post('/course-packages', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { ten_goi, mo_ta, so_thang, gia } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO goi_hoc_phi (ten_goi, mo_ta, so_thang, gia, is_deleted) VALUES ($1, $2, $3, $4, 0) RETURNING *',
      [ten_goi, mo_ta, parseInt(so_thang), parseFloat(gia)]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/course-packages/:id: Cập nhật gói học phí
router.put('/course-packages/:id', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { id } = req.params;
  const { ten_goi, mo_ta, so_thang, gia } = req.body;
  try {
    const result = await pool.query(
      'UPDATE goi_hoc_phi SET ten_goi = $1, mo_ta = $2, so_thang = $3, gia = $4 WHERE id = $5 AND is_deleted = 0 RETURNING *',
      [ten_goi, mo_ta, parseInt(so_thang), parseFloat(gia), id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy gói học phí' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/course-packages/:id: Xóa mềm gói học phí
router.delete('/course-packages/:id', verifyAccess(['admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('UPDATE goi_hoc_phi SET is_deleted = 1 WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy gói học phí' });
    }
    res.json({ success: true, message: 'Đã xóa mềm gói học phí thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/tutoring-packages: Lấy danh sách gói học kèm
router.get('/tutoring-packages', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM goi_hoc_kem WHERE is_deleted = 0 ORDER BY ten_goi ASC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/tutoring-packages: Thêm mới gói học kèm
router.post('/tutoring-packages', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { ten_goi, mo_ta, loai_goi, so_buoi, so_thang, gia } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO goi_hoc_kem (ten_goi, mo_ta, loai_goi, so_buoi, so_thang, gia, is_deleted) VALUES ($1, $2, $3, $4, $5, $6, 0) RETURNING *',
      [ten_goi, mo_ta, loai_goi || 'theo_buoi', parseInt(so_buoi) || 0, parseInt(so_thang) || 0, parseFloat(gia)]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/tutoring-packages/:id: Cập nhật gói học kèm
router.put('/tutoring-packages/:id', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { id } = req.params;
  const { ten_goi, mo_ta, loai_goi, so_buoi, so_thang, gia } = req.body;
  try {
    const result = await pool.query(
      'UPDATE goi_hoc_kem SET ten_goi = $1, mo_ta = $2, loai_goi = $3, so_buoi = $4, so_thang = $5, gia = $6 WHERE id = $7 AND is_deleted = 0 RETURNING *',
      [ten_goi, mo_ta, loai_goi, parseInt(so_buoi) || 0, parseInt(so_thang) || 0, parseFloat(gia), id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy gói học kèm' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/tutoring-packages/:id: Xóa mềm gói học kèm
router.delete('/tutoring-packages/:id', verifyAccess(['admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('UPDATE goi_hoc_kem SET is_deleted = 1 WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy gói học kèm' });
    }
    res.json({ success: true, message: 'Đã xóa mềm gói học kèm thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/classes: Lấy danh sách tất cả các lớp học nhóm
router.get('/classes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.*, h.ho_ten as ten_giao_vien, g.ten_goi as ten_goi_hoc_phi,
             (SELECT COUNT(*) FROM lop_hoc_hoc_vien WHERE lop_hoc_id = l.id) as si_so
      FROM lop_hoc l
      LEFT JOIN ho_so h ON l.giao_vien_id = h.id
      LEFT JOIN goi_hoc_phi g ON l.goi_hoc_phi_id = g.id
      WHERE l.is_deleted = 0
      ORDER BY l.ngay_tao DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/classes/:id/students: Lấy danh sách học viên trong một lớp học nhóm
router.get('/classes/:id/students', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT h.* 
      FROM lop_hoc_hoc_vien lh
      JOIN ho_so h ON lh.hoc_vien_id = h.id
      WHERE lh.lop_hoc_id = $1 AND h.is_deleted = 0
    `, [id]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/classes: Tạo lớp học nhóm mới, thêm học viên và xếp lịch học
router.post('/classes', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { ten_lop, giao_vien_id, goi_hoc_phi_id, hoc_vien_ids, ngay_hoc, gio_bat_dau, gio_ket_thuc } = req.body;

  if (!ten_lop || !giao_vien_id || !ngay_hoc || !gio_bat_dau || !gio_ket_thuc) {
    return res.status(400).json({ success: false, error: 'Thiếu thông tin bắt buộc để mở lớp và xếp lịch' });
  }

  // Chặn ngày quá khứ
  const today = new Date().toISOString().split('T')[0];
  if (ngay_hoc < today) {
    return res.status(400).json({ success: false, error: 'Không thể xếp lịch lớp học vào ngày trong quá khứ' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Kiểm tra giáo viên trùng lịch ở cả lich_hoc (1-1) và lich_hoc_nhom
    const checkOverlap1 = `
      SELECT id FROM lich_hoc 
      WHERE giao_vien_id = $1 AND ngay_hoc = $2 AND trang_thai != 'da_huy'
        AND NOT (gio_ket_thuc <= $3 OR gio_bat_dau >= $4)
    `;
    const checkOverlap2 = `
      SELECT id FROM lich_hoc_nhom
      WHERE giao_vien_id = $1 AND ngay_hoc = $2 AND trang_thai != 'da_huy'
        AND NOT (gio_ket_thuc <= $3 OR gio_bat_dau >= $4)
    `;

    const overlap1 = await client.query(checkOverlap1, [giao_vien_id, ngay_hoc, gio_bat_dau, gio_ket_thuc]);
    const overlap2 = await client.query(checkOverlap2, [giao_vien_id, ngay_hoc, gio_bat_dau, gio_ket_thuc]);

    if (overlap1.rows.length > 0 || overlap2.rows.length > 0) {
      throw new Error('Giáo viên đã trùng lịch giảng dạy một ca khác trong cùng khung giờ này!');
    }

    // 2. Tạo lớp học
    const classRes = await client.query(
      `INSERT INTO lop_hoc (ten_lop, giao_vien_id, loai_lop, goi_hoc_phi_id, max_hoc_vien, trang_thai, is_deleted)
       VALUES ($1, $2, 'nhom', $3, 10, 'dang_hoat_dong', 0) RETURNING *`,
      [ten_lop, giao_vien_id, goi_hoc_phi_id || null]
    );
    const lopHoc = classRes.rows[0];

    // 3. Liên kết học viên vào lớp (nếu có, tối đa 10 học viên)
    if (hoc_vien_ids && Array.isArray(hoc_vien_ids)) {
      const uniqueHvs = [...new Set(hoc_vien_ids)].slice(0, 10);
      for (const hvId of uniqueHvs) {
        await client.query(
          'INSERT INTO lop_hoc_hoc_vien (lop_hoc_id, hoc_vien_id) VALUES ($1, $2)',
          [lopHoc.id, hvId]
        );
      }
    }

    // 4. Xếp lịch học cho lớp học nhóm
    const schedRes = await client.query(
      `INSERT INTO lich_hoc_nhom (lop_hoc_id, giao_vien_id, ngay_hoc, gio_bat_dau, gio_ket_thuc, trang_thai)
       VALUES ($1, $2, $3, $4, $5, 'cho_hoc') RETURNING *`,
      [lopHoc.id, giao_vien_id, ngay_hoc, gio_bat_dau, gio_ket_thuc]
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: { class: lopHoc, schedule: schedRes.rows[0] } });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// GET /api/teachers: Lấy danh sách giáo viên
router.get('/teachers', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM ho_so WHERE loai_ho_so = 'giao_vien' AND is_deleted = 0 ORDER BY ho_ten ASC");
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/rules: Lấy nội quy
router.get('/rules', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM noi_quy WHERE is_active = 1 ORDER BY thu_tu ASC");
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/audit-logs: Xem nhật ký hệ thống (Admin only)
router.get('/audit-logs', verifyAccess(['admin']), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM audit_log ORDER BY thoi_diem DESC LIMIT 100');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/checkin-logs: Xem nhật ký check-in
router.get('/checkin-logs', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.*, h.ho_ten, h.ma_ho_so 
      FROM luot_vao_ra l 
      LEFT JOIN ho_so h ON l.ho_so_id = h.id 
      ORDER BY l.thoi_diem DESC LIMIT 100
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// 1. LUỒNG ĐIỂM DANH & XÁC NHẬN BUỔI HỌC (Bảng `lich_hoc`)
// ============================================================

// API PUT /api/attendance/:id: Cập nhật trạng thái điểm danh
router.put('/attendance/:id', async (req, res) => {
  const { id } = req.params;
  const { trang_thai } = req.body; // 'da_hoc', 'vang', 'da_huy'

  if (!['da_hoc', 'vang', 'da_huy'].includes(trang_thai)) {
    return res.status(400).json({ success: false, error: 'Trạng thái điểm danh không hợp lệ' });
  }

  try {
    const queryStr = `
      UPDATE lich_hoc
      SET 
        trang_thai = $1,
        da_checkin = 1,
        ngay_cap_nhat = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(queryStr, [trang_thai, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy buổi học' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Lỗi API cập nhật điểm danh:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// API PUT /api/attendance/:id/confirm: Xác nhận buổi học từ Giáo viên hoặc Học viên
router.put('/attendance/:id/confirm', async (req, res) => {
  const { id } = req.params;
  const { pt_xac_nhan, hv_xac_nhan } = req.body; // 1 hoặc 0

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Cập nhật trạng thái xác nhận của lich_hoc
    const updateLichHocQuery = `
      UPDATE lich_hoc
      SET 
        pt_xac_nhan = COALESCE($1, pt_xac_nhan),
        hv_xac_nhan = COALESCE($2, hv_xac_nhan),
        ngay_xac_nhan = CASE WHEN ($1 = 1 OR $2 = 1) THEN CURRENT_TIMESTAMP ELSE ngay_xac_nhan END,
        ngay_cap_nhat = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    const lhResult = await client.query(updateLichHocQuery, [pt_xac_nhan, hv_xac_nhan, id]);

    if (lhResult.rows.length === 0) {
      throw new Error('Không tìm thấy buổi học');
    }

    const updatedLichHoc = lhResult.rows[0];

    // 2. Nếu cả 2 cùng bằng 1, tự động tăng số buổi đã học ở bảng dang_ky_hoc_kem thêm +1
    if (updatedLichHoc.pt_xac_nhan === 1 && updatedLichHoc.hv_xac_nhan === 1) {
      const updateDkhkQuery = `
        UPDATE dang_ky_hoc_kem
        SET 
          so_buoi_da_hoc = so_buoi_da_hoc + 1,
          ngay_cap_nhat = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      const dkhkResult = await client.query(updateDkhkQuery, [updatedLichHoc.dang_ky_hoc_kem_id]);
      
      if (dkhkResult.rows.length === 0) {
        throw new Error('Không tìm thấy thông tin đăng ký học kèm liên quan');
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, data: updatedLichHoc });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Lỗi API xác nhận buổi học (Transaction):', err.message);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// ============================================================
// 3. LUỒNG SỔ LIÊN LẠC (Bảng `so_lien_lac`)
// ============================================================

// API POST /api/reports: Tạo nhật ký/sổ liên lạc buổi học
router.post('/reports', async (req, res) => {
  const {
    lich_hoc_id,
    hoc_vien_id,
    giao_vien_id,
    nguoi_gui_id,
    vai_tro_gui,
    loai_nhat_ky,
    nhan_xet_buoi_hoc,
    bai_tap_ve_nha,
    noi_dung_bai_hoc,
    so_phut_hoc,
    dan_do_giao_vien,
    ghi_chu
  } = req.body;

  if (!hoc_vien_id || !giao_vien_id || !nguoi_gui_id) {
    return res.status(400).json({ success: false, error: 'Thiếu thông tin các bên liên quan' });
  }

  try {
    const insertQuery = `
      INSERT INTO so_lien_lac (
        lich_hoc_id, hoc_vien_id, giao_vien_id, nguoi_gui_id, vai_tro_gui,
        loai_nhat_ky, nhan_xet_buoi_hoc, bai_tap_ve_nha, so_phut_hoc,
        noi_dung_bai_hoc, dan_do_giao_vien, ghi_chu
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [
      lich_hoc_id || null,
      hoc_vien_id,
      giao_vien_id,
      nguoi_gui_id,
      vai_tro_gui || 'giao_vien',
      loai_nhat_ky || 'giao_vien_dan_do',
      nhan_xet_buoi_hoc || '',
      bai_tap_ve_nha || '',
      so_phut_hoc || 0,
      noi_dung_bai_hoc || '',
      dan_do_giao_vien || '',
      ghi_chu || ''
    ]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Lỗi API tạo sổ liên lạc:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// API GET /api/reports/student/:studentId: Lấy danh sách sổ liên lạc theo dòng thời gian
router.get('/reports/student/:studentId', async (req, res) => {
  const { studentId } = req.params;

  try {
    const queryStr = `
      SELECT 
        s.*, 
        hs_gv.ho_ten as ten_giao_vien, 
        hs_gv.avatar_url as avatar_giao_vien
      FROM so_lien_lac s
      LEFT JOIN ho_so hs_gv ON s.giao_vien_id = hs_gv.id
      WHERE s.hoc_vien_id = $1
      ORDER BY s.ngay_tao DESC
    `;
    const result = await pool.query(queryStr, [studentId]);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Lỗi API lấy sổ liên lạc học viên:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// 4. LUỒNG HỦY KHÓA HỌC & TỰ TRỪ DOANH THU (Bảng `dang_ky_khoa_hoc`)
// ============================================================

// API PUT /api/registrations/:id/cancel: Hủy đăng ký khóa học, hoàn tiền, tự động trừ doanh thu qua Trigger
router.put('/registrations/:id/cancel', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { id } = req.params;
  const { so_tien_hoan, ly_do_huy } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Cập nhật trang_thai = 'huy', chèn số tiền hoàn và lý do hủy
    const cancelQuery = `
      UPDATE dang_ky_khoa_hoc
      SET 
        trang_thai = 'huy',
        so_tien_hoan = COALESCE($1, 0),
        ly_do_huy = $2,
        ngay_huy = CURRENT_TIMESTAMP,
        ngay_cap_nhat = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    const result = await client.query(cancelQuery, [so_tien_hoan || 0, ly_do_huy || 'Hủy theo yêu cầu của học viên', id]);

    if (result.rows.length === 0) {
      throw new Error('Không tìm thấy đăng ký khóa học');
    }

    await client.query('COMMIT');
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Lỗi API hủy khóa học (Transaction):', err.message);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// GET /api/students/:id/registrations: Lấy chi tiết các gói đăng ký của học viên
router.get('/students/:id/registrations', async (req, res) => {
  const { id } = req.params;
  try {
    const khoaHocRes = await pool.query(`
      SELECT dk.*, g.ten_goi, 'khoa_hoc' as loai_goi
      FROM dang_ky_khoa_hoc dk
      LEFT JOIN goi_hoc_phi g ON dk.goi_hoc_phi_id = g.id
      WHERE dk.ho_so_id = $1
      ORDER BY dk.ngay_tao DESC
    `, [id]);

    const hocKemRes = await pool.query(`
      SELECT dk.*, g.ten_goi, hs_gv.ho_ten as ten_giao_vien, 'hoc_kem' as loai_goi
      FROM dang_ky_hoc_kem dk
      LEFT JOIN goi_hoc_kem g ON dk.goi_hoc_kem_id = g.id
      LEFT JOIN ho_so hs_gv ON dk.giao_vien_id = hs_gv.id
      WHERE dk.hoc_vien_id = $1
      ORDER BY dk.ngay_tao DESC
    `, [id]);

    res.json({
      success: true,
      data: {
        khoa_hoc: khoaHocRes.rows,
        hoc_kem: hocKemRes.rows
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/students/:id: Cập nhật học viên
router.put('/students/:id', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { id } = req.params;
  const { ho_ten, ngay_sinh, gioi_tinh, ten_phu_huynh, so_dien_thoai, email, trinh_do_dau_vao, chi_nhanh } = req.body;
  const genderLower = gioi_tinh ? gioi_tinh.toLowerCase() : 'khác';
  try {
    const updateQuery = `
      UPDATE ho_so
      SET ho_ten = $1, ngay_sinh = $2, gioi_tinh = $3, ten_phu_huynh = $4,
          so_dien_thoai = $5, email = $6, trinh_do_dau_vao = $7, chi_nhanh = $8,
          ngay_cap_nhat = CURRENT_TIMESTAMP
      WHERE id = $9 AND loai_ho_so = 'hoc_vien' AND is_deleted = 0
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [
      ho_ten, ngay_sinh, genderLower, ten_phu_huynh, so_dien_thoai, email, trinh_do_dau_vao, chi_nhanh, id
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ học viên' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/students/:id: Xóa mềm học viên
router.delete('/students/:id', verifyAccess(['admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const deleteQuery = `
      UPDATE ho_so
      SET is_deleted = 1, ngay_xoa = CURRENT_TIMESTAMP
      WHERE id = $1 AND loai_ho_so = 'hoc_vien'
      RETURNING *
    `;
    const result = await pool.query(deleteQuery, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ học viên để xóa' });
    }
    res.json({ success: true, message: 'Đã xóa mềm học viên thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/teachers/:id: Cập nhật giáo viên
router.put('/teachers/:id', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { id } = req.params;
  const { ho_ten, so_dien_thoai, email, chuyen_mon, kinh_nghiem, chi_nhanh } = req.body;
  try {
    const updateQuery = `
      UPDATE ho_so
      SET ho_ten = $1, so_dien_thoai = $2, email = $3, chuyen_mon = $4,
          kinh_nghiem = $5, chi_nhanh = $6, ngay_cap_nhat = CURRENT_TIMESTAMP
      WHERE id = $7 AND loai_ho_so = 'giao_vien' AND is_deleted = 0
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [
      ho_ten, so_dien_thoai, email, chuyen_mon, parseInt(kinh_nghiem) || 0, chi_nhanh || 'Trung tam chính', id
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ giáo viên' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/teachers/:id: Xóa mềm giáo viên
router.delete('/teachers/:id', verifyAccess(['admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const deleteQuery = `
      UPDATE ho_so
      SET is_deleted = 1, ngay_xoa = CURRENT_TIMESTAMP
      WHERE id = $1 AND loai_ho_so = 'giao_vien'
      RETURNING *
    `;
    const result = await pool.query(deleteQuery, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ giáo viên để xóa' });
    }
    res.json({ success: true, message: 'Đã xóa mềm giáo viên thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API POST /api/students/create: Lễ tân tiếp nhận hồ sơ học viên mới
router.post('/students/create', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { ho_ten, ngay_sinh, gioi_tinh, ten_phu_huynh, so_dien_thoai, email, trinh_do_dau_vao, chi_nhanh } = req.body;
  const genderLower = gioi_tinh ? gioi_tinh.toLowerCase() : 'khác';

  try {
    // Tự sinh ma_ho_so (ví dụ tìm số thứ tự lớn nhất)
    const countRes = await pool.query("SELECT COUNT(*) FROM ho_so WHERE loai_ho_so = 'hoc_vien'");
    const nextNum = parseInt(countRes.rows[0].count) + 1;
    const ma_ho_so = `HV${String(nextNum).padStart(3, '0')}`;

    const insertQuery = `
      INSERT INTO ho_so (
        ma_ho_so, ho_ten, ngay_sinh, gioi_tinh, ten_phu_huynh, so_dien_thoai, email, 
        trinh_do_dau_vao, chi_nhanh, loai_ho_so, is_deleted
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'hoc_vien', 0)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      ma_ho_so, ho_ten, ngay_sinh, genderLower, ten_phu_huynh, so_dien_thoai, email, trinh_do_dau_vao, chi_nhanh
    ]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Lỗi API tạo học viên:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// API POST /api/teachers/create: Tạo hồ sơ giáo viên mới
router.post('/teachers/create', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { ho_ten, so_dien_thoai, email, chuyen_mon, kinh_nghiem, chi_nhanh } = req.body;

  try {
    const countRes = await pool.query("SELECT COUNT(*) FROM ho_so WHERE loai_ho_so = 'giao_vien'");
    const nextNum = parseInt(countRes.rows[0].count) + 1;
    const ma_ho_so = `GV${String(nextNum).padStart(3, '0')}`;

    const insertQuery = `
      INSERT INTO ho_so (
        ma_ho_so, ho_ten, so_dien_thoai, email, chuyen_mon, kinh_nghiem, chi_nhanh, loai_ho_so, is_deleted
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'giao_vien', 0)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      ma_ho_so, ho_ten, so_dien_thoai, email, chuyen_mon, parseInt(kinh_nghiem) || 0, chi_nhanh || 'Trung tam chính'
    ]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Lỗi API tạo giáo viên:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Lấy danh sách học viên từ View v_trang_thai_hoi_vien (dành cho Lễ tân)
router.get('/students', async (req, res) => {
  try {
    const queryStr = 'SELECT * FROM v_trang_thai_hoi_vien ORDER BY ho_ten ASC';
    const result = await pool.query(queryStr);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Lỗi API lấy danh sách học viên:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Lấy danh sách lịch dạy hôm nay từ bảng lich_hoc (dành cho Giáo viên)
router.get('/schedule/today', async (req, res) => {
  const { gvId } = req.query;
  try {
    let queryStr = `
      SELECT 
        lh.id, 
        lh.dang_ky_hoc_kem_id, 
        lh.ngay_hoc, 
        lh.gio_bat_dau, 
        lh.gio_ket_thuc, 
        lh.loai_buoi, 
        lh.trang_thai, 
        lh.da_checkin, 
        lh.pt_xac_nhan, 
        lh.hv_xac_nhan,
        hs_hv.ho_ten as ten_hoc_vien, 
        hs_hv.ma_ho_so as ma_hoc_vien,
        lh.hoc_vien_id,
        lh.giao_vien_id
      FROM lich_hoc lh
      JOIN ho_so hs_hv ON lh.hoc_vien_id = hs_hv.id
      WHERE lh.ngay_hoc = CURRENT_DATE
    `;
    const params = [];
    if (gvId) {
      queryStr += ' AND lh.giao_vien_id = $1';
      params.push(gvId);
    }
    queryStr += ' ORDER BY lh.gio_bat_dau ASC';
    const result = await pool.query(queryStr, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Lỗi API lấy lịch học hôm nay:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Lấy tất cả danh sách lịch học (dành cho trang Thời khóa biểu)
router.get('/schedules', async (req, res) => {
  try {
    const queryStr = `
      SELECT 
        lh.*, 
        hs_hv.ho_ten as ten_hoc_vien, 
        hs_gv.ho_ten as ten_giao_vien
      FROM lich_hoc lh
      JOIN ho_so hs_hv ON lh.hoc_vien_id = hs_hv.id
      JOIN ho_so hs_gv ON lh.giao_vien_id = hs_gv.id
      ORDER BY lh.ngay_hoc DESC, lh.gio_bat_dau ASC
    `;
    const result = await pool.query(queryStr);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/checkins: Lấy danh sách lượt check-in hôm nay/tất cả (phục vụ Overview.js)
router.get('/checkins', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.*, h.ho_ten, h.ma_ho_so, 
             l.thoi_diem::date::text as ngay_quet,
             l.thoi_diem::time::text as gio_quet
      FROM luot_vao_ra l 
      LEFT JOIN ho_so h ON l.ho_so_id = h.id 
      ORDER BY l.thoi_diem DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/registrations: Lấy danh sách tất cả các đăng ký khóa học để thống kê (phục vụ Overview.js)
router.get('/registrations', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, h.ho_ten, g.ten_goi,
             'da_thanh_toan' as trang_thai_thanh_toan,
             r.gia_thuc_te as so_tien_phai_nop,
             r.ngay_tao as ngay_dang_ky
      FROM dang_ky_khoa_hoc r
      LEFT JOIN ho_so h ON r.ho_so_id = h.id
      LEFT JOIN goi_hoc_phi g ON r.goi_hoc_phi_id = g.id
      ORDER BY r.ngay_tao DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
