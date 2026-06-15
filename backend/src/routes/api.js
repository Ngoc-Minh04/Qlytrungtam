const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const cloudinary = require('cloudinary').v2;

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper upload base64 lên Cloudinary
async function uploadToCloudinary(base64Str) {
  if (!base64Str) return null;
  try {
    // Nếu client truyền lên base64, upload trực tiếp lên Cloudinary
    const uploadRes = await cloudinary.uploader.upload(base64Str, {
      folder: 'stellar_academy_avatars'
    });
    return uploadRes.secure_url;
  } catch (err) {
    console.error('Lỗi upload Cloudinary:', err.message);
    return null;
  }
}

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
// Helper tạo tài khoản mặc định liên kết với ho_so
// ============================================================
async function autoCreateAccount(client, hoSoId, username, roleId, password = '123456') {
  const insertAccQuery = `
    INSERT INTO tai_khoan (ten_dang_nhap, mat_khau_hash, vai_tro_id, trang_thai)
    VALUES ($1, $2, $3, 'hoat_dong')
    RETURNING id
  `;
  const accRes = await client.query(insertAccQuery, [username, password, roleId]);
  const accId = accRes.rows[0].id;

  // Cập nhật tai_khoan_id ngược lại bảng ho_so
  await client.query('UPDATE ho_so SET tai_khoan_id = $1 WHERE id = $2', [accId, hoSoId]);
  return accId;
}

// Helper sinh tên đăng nhập không dấu, viết liền
function generateUsername(fullName, prefix = '') {
  let clean = fullName.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '');
  
  if (clean.length > 15) clean = clean.substring(0, 15);
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `${prefix}${clean}${randomSuffix}`;
}

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

    await createNotification(
      'dang_ky_khoa_hoc',
      'Đăng ký khóa học mới',
      `Học viên đăng ký thành công khóa học đại trà mới (ID hồ sơ: ${ho_so_id}).`,
      result.rows[0].id,
      'dang_ky_khoa_hoc',
      'nhan_vien'
    );

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

    await createNotification(
      'dang_ky_hoc_kem',
      'Đăng ký học kèm 1-1',
      `Học viên đăng ký thành công gói học kèm 1-1 mới (ID học viên: ${hoc_vien_id}).`,
      result.rows[0].id,
      'dang_ky_hoc_kem',
      'nhan_vien'
    );

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

    // 5. Chặn trùng lịch học của Học viên (Student Overbooking)
    const checkHvOverlap1 = `
      SELECT id FROM lich_hoc
      WHERE hoc_vien_id = $1
        AND ngay_hoc = $2
        AND trang_thai != 'da_huy'
        AND NOT (gio_ket_thuc <= $3 OR gio_bat_dau >= $4)
    `;
    const checkHvOverlap2 = `
      SELECT lhn.id FROM lich_hoc_nhom lhn
      JOIN lop_hoc_hoc_vien lhv ON lhn.lop_hoc_id = lhv.lop_hoc_id
      WHERE lhv.hoc_vien_id = $1
        AND lhn.ngay_hoc = $2
        AND lhn.trang_thai != 'da_huy'
        AND NOT (lhn.gio_ket_thuc <= $3 OR lhn.gio_bat_dau >= $4)
    `;
    const hvOverlapRes1 = await pool.query(checkHvOverlap1, [contract.hoc_vien_id, ngay_hoc, gio_bat_dau, gio_ket_thuc]);
    const hvOverlapRes2 = await pool.query(checkHvOverlap2, [contract.hoc_vien_id, ngay_hoc, gio_bat_dau, gio_ket_thuc]);
    if (hvOverlapRes1.rows.length > 0 || hvOverlapRes2.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Học viên đã có lịch học một ca khác (lớp kèm hoặc lớp nhóm) trong khung giờ này!'
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

    await createNotification(
      'xep_lich_hoc',
      'Xếp lịch học kèm mới',
      `Đã xếp lịch học mới cho học viên ngày ${ngay_hoc} từ ${gio_bat_dau} đến ${gio_ket_thuc}.`,
      result.rows[0].id,
      'lich_hoc',
      'nhan_vien'
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API PUT /api/schedule/:id: Cập nhật sửa đổi lịch học 1 kèm 1
router.put('/schedule/:id', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { id } = req.params;
  const { ngay_hoc, gio_bat_dau, gio_ket_thuc, giao_vien_id } = req.body;

  try {
    const sessionRes = await pool.query('SELECT * FROM lich_hoc WHERE id = $1', [id]);
    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy buổi học học kèm' });
    }
    const session = sessionRes.rows[0];

    // Kiểm tra giáo viên trùng lịch nếu đổi GV hoặc ngày giờ
    const newGvId = giao_vien_id || session.giao_vien_id;
    const newNgay = ngay_hoc || session.ngay_hoc;
    const newStart = gio_bat_dau || session.gio_bat_dau;
    const newEnd = gio_ket_thuc || session.gio_ket_thuc;

    // Chặn sửa ngày/giờ quá khứ
    let ngayHocStr;
    if (typeof newNgay === 'string') {
      ngayHocStr = newNgay.split('T')[0];
    } else {
      const y = newNgay.getFullYear();
      const m = String(newNgay.getMonth() + 1).padStart(2, '0');
      const d = String(newNgay.getDate()).padStart(2, '0');
      ngayHocStr = `${y}-${m}-${d}`;
    }
    const targetDateTime = new Date(`${ngayHocStr}T${newStart}:00`);
    if (targetDateTime < new Date()) {
      return res.status(400).json({ success: false, error: 'Không thể chỉnh sửa lịch học lùi về thời điểm quá khứ!' });
    }

    const checkGvOverlap = `
      SELECT id FROM lich_hoc
      WHERE giao_vien_id = $1 
        AND ngay_hoc = $2 
        AND id != $3
        AND trang_thai != 'da_huy'
        AND NOT (gio_ket_thuc <= $4 OR gio_bat_dau >= $5)
    `;
    const overlapRes = await pool.query(checkGvOverlap, [newGvId, newNgay, id, newStart, newEnd]);
    if (overlapRes.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Giáo viên phụ trách đã bị trùng lịch giảng dạy ca khác vào khung giờ mới này!' 
      });
    }

    // Kiểm tra học viên trùng lịch
    const checkHvOverlap1 = `
      SELECT id FROM lich_hoc
      WHERE hoc_vien_id = $1
        AND ngay_hoc = $2
        AND id != $3
        AND trang_thai != 'da_huy'
        AND NOT (gio_ket_thuc <= $4 OR gio_bat_dau >= $5)
    `;
    const checkHvOverlap2 = `
      SELECT lhn.id FROM lich_hoc_nhom lhn
      JOIN lop_hoc_hoc_vien lhv ON lhn.lop_hoc_id = lhv.lop_hoc_id
      WHERE lhv.hoc_vien_id = $1
        AND lhn.ngay_hoc = $2
        AND lhn.trang_thai != 'da_huy'
        AND NOT (lhn.gio_ket_thuc <= $3 OR lhn.gio_bat_dau >= $4)
    `;
    const hvOverlapRes1 = await pool.query(checkHvOverlap1, [session.hoc_vien_id, newNgay, id, newStart, newEnd]);
    const hvOverlapRes2 = await pool.query(checkHvOverlap2, [session.hoc_vien_id, newNgay, newStart, newEnd]);
    if (hvOverlapRes1.rows.length > 0 || hvOverlapRes2.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Học viên đã có lịch học một ca khác (lớp kèm hoặc lớp nhóm) trong khung giờ này!'
      });
    }

    const updateQuery = `
      UPDATE lich_hoc
      SET ngay_hoc = $1, gio_bat_dau = $2, gio_ket_thuc = $3, giao_vien_id = $4, ngay_cap_nhat = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [newNgay, newStart, newEnd, newGvId, id]);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API DELETE /api/schedule/:id: Xóa lịch học 1 kèm 1 hoàn toàn khỏi database
router.delete('/schedule/:id', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM lich_hoc WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy buổi học để xóa' });
    }
    res.json({ success: true, message: 'Đã xóa buổi học thành công!' });
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
        
        await createNotification(
          'huy_lich_muon',
          'Hủy lịch học sát giờ (Vắng)',
          `Lịch học ID ${id} bị hủy sát giờ (< ${minHours} giờ). Chuyển thành vắng và trừ buổi.`,
          id,
          'lich_hoc',
          'nhan_vien'
        );

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

    await createNotification(
      'huy_lich_hoc',
      'Hủy lịch học thành công',
      `Đã hủy thành công lịch học ID ${id} trước thời hạn.`,
      id,
      'lich_hoc',
      'nhan_vien'
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

    // 2. Chống gian lận: Kiểm tra mã QR hết hạn (quá 60 giây)
    const nowMs = Date.now();
    const qrTime = parseInt(timestamp);
    if (isNaN(qrTime) || Math.abs(nowMs - qrTime) > 60000) {
      return res.status(400).json({ success: false, error: 'Mã QR đã hết hạn hiệu lực (Chống gian lận chụp ảnh gửi hộ)' });
    }

    // 3. Kiểm tra xem hồ sơ có tồn tại và đang hoạt động không
    const hsRes = await pool.query('SELECT * FROM ho_so WHERE id = $1 AND is_deleted = 0', [ho_so_id]);
    if (hsRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Hồ sơ người dùng không tồn tại hoặc đã bị khóa' });
    }
    const userProfile = hsRes.rows[0];

    // Tiến hành ghi nhận vào/ra
    const insertQuery = `
      INSERT INTO luot_vao_ra (ho_so_id, loai, phuong_thuc, chi_nhanh_thuc_hien)
      VALUES ($1, 'vao', 'qr_code', $2)
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [ho_so_id, current_branch || 'Trung tam chính']);

    await createNotification(
      'quet_ma_qr',
      'Quét mã QR ra vào',
      `Thành viên "${userProfile.ho_ten}" đã check-in thành công qua QR Code tại chi nhánh.`,
      result.rows[0].id,
      'luot_vao_ra',
      'nhan_vien'
    );

    res.json({
      success: true,
      message: 'Ghi nhận quét mã QR check-in thành công!',
      data: {
        ho_ten: userProfile.ho_ten,
        ma_ho_so: userProfile.ma_ho_so,
        loai_ho_so: userProfile.loai_ho_so,
        thoi_diem: result.rows[0].thoi_diem
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// 4. PHÂN HỆ QUẢN LÝ BÁO CÁO DOANH THU & KỲ BÁO CÁO
// ============================================================

// GET /api/reports/revenue: Lấy dữ liệu báo cáo doanh thu động (Có lọc theo kỳ ngày)
router.get('/reports/revenue', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { start_date, end_date } = req.query;

  let dateCondition = '';
  const params = [];
  if (start_date && end_date) {
    dateCondition = ' AND d.ngay >= $1 AND d.ngay <= $2';
    params.push(start_date, end_date);
  }

  try {
    // 1. Tổng tiền các gói đại trà
    const khQuery = `SELECT COALESCE(SUM(so_tien_da_thu), 0) as total FROM dang_ky_khoa_hoc WHERE trang_thai NOT IN ('huy', 'tam_dung')`;
    const khRes = await pool.query(khQuery);

    // 2. Tổng tiền các gói kèm 1-1
    const hkQuery = `SELECT COALESCE(SUM(so_tien_da_thu), 0) as total FROM dang_ky_hoc_kem WHERE trang_thai NOT IN ('huy', 'tam_dung')`;
    const hkRes = await pool.query(hkQuery);

    // 3. Biểu đồ doanh thu tích lũy hàng ngày trong kỳ filter
    const statsQuery = `
      SELECT d.ngay::text as ngay, d.tong_tien, d.tong_don, d.tien_khoa_hoc, d.tien_hoc_kem
      FROM doanh_thu d
      WHERE 1=1 ${dateCondition.replace('d.ngay', 'd.ngay')}
      ORDER BY d.ngay ASC
    `;
    const statsRes = await pool.query(statsQuery, params);

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
    let paymentsQuery = '';
    let paymentsRes;
    if (start_date && end_date) {
      paymentsQuery = `
        SELECT d.id, h.ho_ten, g.ten_goi as ten_khoa_hoc, d.so_tien_da_thu, d.phuong_thuc_tt, d.ngay_tao
        FROM dang_ky_khoa_hoc d
        JOIN ho_so h ON d.ho_so_id = h.id
        JOIN goi_hoc_phi g ON d.goi_hoc_phi_id = g.id
        WHERE d.trang_thai NOT IN ('huy', 'tam_dung') AND d.ngay_tao::date >= $1 AND d.ngay_tao::date <= $2
        UNION ALL
        SELECT dk.id, h.ho_ten, gk.ten_goi as ten_khoa_hoc, dk.so_tien_da_thu, dk.phuong_thuc_tt, dk.ngay_tao
        FROM dang_ky_hoc_kem dk
        JOIN ho_so h ON dk.hoc_vien_id = h.id
        JOIN goi_hoc_kem gk ON dk.goi_hoc_kem_id = gk.id
        WHERE dk.trang_thai NOT IN ('huy', 'tam_dung') AND dk.ngay_tao::date >= $1 AND dk.ngay_tao::date <= $2
        ORDER BY ngay_tao DESC
        LIMIT 30
      `;
      paymentsRes = await pool.query(paymentsQuery, [start_date, end_date]);
    } else {
      paymentsQuery = `
        SELECT d.id, h.ho_ten, g.ten_goi as ten_khoa_hoc, d.so_tien_da_thu, d.phuong_thuc_tt, d.ngay_tao
        FROM dang_ky_khoa_hoc d
        JOIN ho_so h ON d.ho_so_id = h.id
        JOIN goi_hoc_phi g ON d.goi_hoc_phi_id = g.id
        WHERE d.trang_thai NOT IN ('huy', 'tam_dung')
        UNION ALL
        SELECT dk.id, h.ho_ten, gk.ten_goi as ten_khoa_hoc, dk.so_tien_da_thu, dk.phuong_thuc_tt, dk.ngay_tao
        FROM dang_ky_hoc_kem dk
        JOIN ho_so h ON dk.hoc_vien_id = h.id
        JOIN goi_hoc_kem gk ON dk.goi_hoc_kem_id = gk.id
        WHERE dk.trang_thai NOT IN ('huy', 'tam_dung')
        ORDER BY ngay_tao DESC
        LIMIT 30
      `;
      paymentsRes = await pool.query(paymentsQuery);
    }

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
    await createNotification(
      'them_goi_hoc_phi',
      'Thêm mới gói học phí',
      `Gói học phí đại trà "${ten_goi}" đã được thêm mới trên hệ thống.`,
      result.rows[0].id,
      'goi_hoc_phi',
      'nhan_vien'
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
    await createNotification(
      'sua_goi_hoc_phi',
      'Cập nhật gói học phí',
      `Gói học phí đại trà "${ten_goi}" đã được cập nhật thành công.`,
      id,
      'goi_hoc_phi',
      'nhan_vien'
    );
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
    await createNotification(
      'xoa_goi_hoc_phi',
      'Xóa gói học phí',
      `Đã gỡ bỏ gói học phí "${result.rows[0].ten_goi}" khỏi hệ thống.`,
      id,
      'goi_hoc_phi',
      'nhan_vien'
    );
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
      [ten_goi, mo_ta, loai_goi || 'ca_nhan', parseInt(so_buoi), parseInt(so_thang), parseFloat(gia)]
    );
    await createNotification(
      'them_goi_hoc_kem',
      'Thêm mới gói học kèm',
      `Gói học kèm "${ten_goi}" đã được thêm mới thành công trên hệ thống.`,
      result.rows[0].id,
      'goi_hoc_kem',
      'nhan_vien'
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
      [ten_goi, mo_ta, loai_goi, parseInt(so_buoi), parseInt(so_thang), parseFloat(gia), id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy gói học kèm' });
    }
    await createNotification(
      'sua_goi_hoc_kem',
      'Cập nhật gói học kèm',
      `Gói học kèm "${ten_goi}" đã được cập nhật thành công.`,
      id,
      'goi_hoc_kem',
      'nhan_vien'
    );
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
    await createNotification(
      'xoa_goi_hoc_kem',
      'Xóa gói học kèm',
      `Đã gỡ bỏ gói học kèm 1-1 "${result.rows[0].ten_goi}" khỏi hệ thống.`,
      id,
      'goi_hoc_kem',
      'nhan_vien'
    );
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
             (SELECT COUNT(*) FROM lop_hoc_hoc_vien WHERE lop_hoc_id = l.id) as si_so,
             lhn.ngay_hoc::text, lhn.gio_bat_dau, lhn.gio_ket_thuc, lhn.trang_thai as trang_thai_lich, lhn.id as lich_hoc_nhom_id
      FROM lop_hoc l
      LEFT JOIN ho_so h ON l.giao_vien_id = h.id
      LEFT JOIN goi_hoc_phi g ON l.goi_hoc_phi_id = g.id
      LEFT JOIN (
        SELECT DISTINCT ON (lop_hoc_id) id, lop_hoc_id, ngay_hoc, gio_bat_dau, gio_ket_thuc, trang_thai
        FROM lich_hoc_nhom
        WHERE trang_thai != 'da_huy'
        ORDER BY lop_hoc_id, ngay_hoc ASC, gio_bat_dau ASC
      ) lhn ON l.id = lhn.lop_hoc_id
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
    const checkGvOverlap1 = `
      SELECT id FROM lich_hoc 
      WHERE giao_vien_id = $1 AND ngay_hoc = $2 AND trang_thai != 'da_huy'
        AND NOT (gio_ket_thuc <= $3 OR gio_bat_dau >= $4)
    `;
    const checkGvOverlap2 = `
      SELECT id FROM lich_hoc_nhom
      WHERE giao_vien_id = $1 AND ngay_hoc = $2 AND trang_thai != 'da_huy'
        AND NOT (gio_ket_thuc <= $3 OR gio_bat_dau >= $4)
    `;

    const gvOverlap1 = await client.query(checkGvOverlap1, [giao_vien_id, ngay_hoc, gio_bat_dau, gio_ket_thuc]);
    const gvOverlap2 = await client.query(checkGvOverlap2, [giao_vien_id, ngay_hoc, gio_bat_dau, gio_ket_thuc]);

    if (gvOverlap1.rows.length > 0 || gvOverlap2.rows.length > 0) {
      throw new Error('Giáo viên đã trùng lịch giảng dạy một ca khác trong cùng khung giờ này!');
    }

    // 2. Kiểm tra từng học viên xem có bị trùng lịch học ca khác (1 kèm 1 hoặc nhóm khác) trong khung giờ này không
    if (hoc_vien_ids && Array.isArray(hoc_vien_ids)) {
      const uniqueHvs = [...new Set(hoc_vien_ids)].slice(0, 50);
      for (const hvId of uniqueHvs) {
        // Lấy tên học viên để báo lỗi chi tiết
        const studentInfoRes = await client.query('SELECT ho_ten FROM ho_so WHERE id = $1', [hvId]);
        const tenHv = studentInfoRes.rows.length > 0 ? studentInfoRes.rows[0].ho_ten : `Học viên ID ${hvId}`;

        // Trùng lớp học kèm
        const checkHvOverlap1 = `
          SELECT id FROM lich_hoc
          WHERE hoc_vien_id = $1
            AND ngay_hoc = $2
            AND trang_thai != 'da_huy'
            AND NOT (gio_ket_thuc <= $3 OR gio_bat_dau >= $4)
        `;
        const hvOverlap1 = await client.query(checkHvOverlap1, [hvId, ngay_hoc, gio_bat_dau, gio_ket_thuc]);

        // Trùng lớp học nhóm
        const checkHvOverlap2 = `
          SELECT lhn.id FROM lich_hoc_nhom lhn
          JOIN lop_hoc_hoc_vien lhv ON lhn.lop_hoc_id = lhv.lop_hoc_id
          WHERE lhv.hoc_vien_id = $1
            AND lhn.ngay_hoc = $2
            AND lhn.trang_thai != 'da_huy'
            AND NOT (lhn.gio_ket_thuc <= $3 OR lhn.gio_bat_dau >= $4)
        `;
        const hvOverlap2 = await client.query(checkHvOverlap2, [hvId, ngay_hoc, gio_bat_dau, gio_ket_thuc]);

        if (hvOverlap1.rows.length > 0 || hvOverlap2.rows.length > 0) {
          throw new Error(`Học viên "${tenHv}" đã có lịch học trùng ca khác trong khung giờ này!`);
        }
      }
    }

    // 3. Tạo lớp học (tối đa 50 học viên)
    const classRes = await client.query(
      `INSERT INTO lop_hoc (ten_lop, giao_vien_id, loai_lop, goi_hoc_phi_id, max_hoc_vien, trang_thai, is_deleted)
       VALUES ($1, $2, 'nhom', $3, 50, 'dang_hoat_dong', 0) RETURNING *`,
      [ten_lop, giao_vien_id, goi_hoc_phi_id || null]
    );
    const lopHoc = classRes.rows[0];

    // 4. Liên kết học viên vào lớp (nếu có, tối đa 50 học viên)
    if (hoc_vien_ids && Array.isArray(hoc_vien_ids)) {
      const uniqueHvs = [...new Set(hoc_vien_ids)].slice(0, 50);
      for (const hvId of uniqueHvs) {
        await client.query(
          'INSERT INTO lop_hoc_hoc_vien (lop_hoc_id, hoc_vien_id) VALUES ($1, $2)',
          [lopHoc.id, hvId]
        );
      }
    }

    // 5. Xếp lịch học cho lớp học nhóm
    const schedRes = await client.query(
      `INSERT INTO lich_hoc_nhom (lop_hoc_id, giao_vien_id, ngay_hoc, gio_bat_dau, gio_ket_thuc, trang_thai)
       VALUES ($1, $2, $3, $4, $5, 'cho_hoc') RETURNING *`,
      [lopHoc.id, giao_vien_id, ngay_hoc, gio_bat_dau, gio_ket_thuc]
    );    await client.query('COMMIT');
    await createNotification(
      'them_lop_hoc',
      'Mở lớp học nhóm mới',
      `Lớp học nhóm "${ten_lop}" đã được mở thành công.`,
      lopHoc.id,
      'lop_hoc',
      'nhan_vien'
    );
    res.status(201).json({ success: true, data: { class: lopHoc, schedule: schedRes.rows[0] } });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// API PUT /api/classes/:id: Sửa đổi lịch lớp học nhóm
router.put('/classes/:id', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { id } = req.params;
  const { ten_lop, giao_vien_id, goi_hoc_phi_id, ngay_hoc, gio_bat_dau, gio_ket_thuc, hoc_vien_ids } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Tìm lớp học hiện tại
    const classRes = await client.query('SELECT * FROM lop_hoc WHERE id = $1 AND is_deleted = 0', [id]);
    if (classRes.rows.length === 0) {
      throw new Error('Không tìm thấy lớp học nhóm');
    }
    const oldClass = classRes.rows[0];

    // Cập nhật thông tin lớp
    const newGvId = giao_vien_id || oldClass.giao_vien_id;
    await client.query(
      `UPDATE lop_hoc 
       SET ten_lop = $1, giao_vien_id = $2, goi_hoc_phi_id = $3
       WHERE id = $4`,
      [ten_lop || oldClass.ten_lop, newGvId, goi_hoc_phi_id !== undefined ? goi_hoc_phi_id : oldClass.goi_hoc_phi_id, id]
    );

    // Cập nhật học viên
    if (hoc_vien_ids && Array.isArray(hoc_vien_ids)) {
      await client.query('DELETE FROM lop_hoc_hoc_vien WHERE lop_hoc_id = $1', [id]);
      const uniqueHvs = [...new Set(hoc_vien_ids)].slice(0, 50);
      for (const hvId of uniqueHvs) {
        await client.query(
          'INSERT INTO lop_hoc_hoc_vien (lop_hoc_id, hoc_vien_id) VALUES ($1, $2)',
          [id, hvId]
        );
      }
    }

    // Cập nhật ngày học và giờ
    if (ngay_hoc || gio_bat_dau || gio_ket_thuc) {
      const schedCheck = await client.query('SELECT id, ngay_hoc, gio_bat_dau, gio_ket_thuc FROM lich_hoc_nhom WHERE lop_hoc_id = $1 AND trang_thai != \'da_huy\'', [id]);
      if (schedCheck.rows.length > 0) {
        const activeSched = schedCheck.rows[0];
        const updatedNgay = ngay_hoc || activeSched.ngay_hoc;
        const updatedStart = gio_bat_dau || activeSched.gio_bat_dau;
        const updatedEnd = gio_ket_thuc || activeSched.gio_ket_thuc;

        // Chặn sửa ngày/giờ quá khứ
        let ngayHocStr;
        if (typeof updatedNgay === 'string') {
          ngayHocStr = updatedNgay.split('T')[0];
        } else {
          const y = updatedNgay.getFullYear();
          const m = String(updatedNgay.getMonth() + 1).padStart(2, '0');
          const d = String(updatedNgay.getDate()).padStart(2, '0');
          ngayHocStr = `${y}-${m}-${d}`;
        }
        const targetDateTime = new Date(`${ngayHocStr}T${updatedStart}:00`);
        if (targetDateTime < new Date()) {
          throw new Error('Không thể chỉnh sửa lịch học lùi về thời điểm quá khứ!');
        }

        // 1. Kiểm tra giáo viên trùng lịch
        const checkOverlap1 = `
          SELECT id FROM lich_hoc 
          WHERE giao_vien_id = $1 AND ngay_hoc = $2 AND trang_thai != 'da_huy'
            AND NOT (gio_ket_thuc <= $3 OR gio_bat_dau >= $4)
        `;
        const checkOverlap2 = `
          SELECT id FROM lich_hoc_nhom
          WHERE giao_vien_id = $1 AND ngay_hoc = $2 AND id != $3 AND trang_thai != 'da_huy'
            AND NOT (gio_ket_thuc <= $4 OR gio_bat_dau >= $5)
        `;

        const overlapRes1 = await client.query(checkOverlap1, [newGvId, updatedNgay, updatedStart, updatedEnd]);
        const overlapRes2 = await client.query(checkOverlap2, [newGvId, updatedNgay, activeSched.id, updatedStart, updatedEnd]);

        if (overlapRes1.rows.length > 0 || overlapRes2.rows.length > 0) {
          throw new Error('Giáo viên đã trùng lịch giảng dạy một ca khác trong cùng khung giờ này!');
        }

        // 2. Kiểm tra học viên trùng lịch (nếu có học viên trong lớp)
        const currentHvsRes = await client.query('SELECT hoc_vien_id FROM lop_hoc_hoc_vien WHERE lop_hoc_id = $1', [id]);
        const currentHvIds = currentHvsRes.rows.map(r => r.hoc_vien_id);
        const targetHvIds = (hoc_vien_ids && Array.isArray(hoc_vien_ids)) ? [...new Set(hoc_vien_ids)].slice(0, 50) : currentHvIds;

        for (const hvId of targetHvIds) {
          const studentInfoRes = await client.query('SELECT ho_ten FROM ho_so WHERE id = $1', [hvId]);
          const tenHv = studentInfoRes.rows.length > 0 ? studentInfoRes.rows[0].ho_ten : `Học viên ID ${hvId}`;

          const checkHvOverlap1 = `
            SELECT id FROM lich_hoc
            WHERE hoc_vien_id = $1
              AND ngay_hoc = $2
              AND trang_thai != 'da_huy'
              AND NOT (gio_ket_thuc <= $3 OR gio_bat_dau >= $4)
          `;
          const hvOverlap1 = await client.query(checkHvOverlap1, [hvId, updatedNgay, updatedStart, updatedEnd]);

          const checkHvOverlap2 = `
            SELECT lhn.id FROM lich_hoc_nhom lhn
            JOIN lop_hoc_hoc_vien lhv ON lhn.lop_hoc_id = lhv.lop_hoc_id
            WHERE lhv.hoc_vien_id = $1
              AND lhn.ngay_hoc = $2
              AND lhn.id != $3
              AND lhn.trang_thai != 'da_huy'
              AND NOT (lhn.gio_ket_thuc <= $4 OR lhn.gio_bat_dau >= $5)
          `;
          const hvOverlap2 = await client.query(checkHvOverlap2, [hvId, updatedNgay, activeSched.id, updatedStart, updatedEnd]);

          if (hvOverlap1.rows.length > 0 || hvOverlap2.rows.length > 0) {
            throw new Error(`Học viên "${tenHv}" đã có lịch học trùng ca khác trong khung giờ này!`);
          }
        }

        await client.query(
          `UPDATE lich_hoc_nhom
           SET ngay_hoc = $1, gio_bat_dau = $2, gio_ket_thuc = $3, giao_vien_id = $4
           WHERE id = $5`,
          [updatedNgay, updatedStart, updatedEnd, newGvId, activeSched.id]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Cập nhật thông tin và lịch lớp học nhóm thành công!' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// API DELETE /api/classes/:id: Xóa mềm lớp học nhóm và hủy lịch tương ứng
router.delete('/classes/:id', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE lop_hoc SET is_deleted = 1 WHERE id = $1', [id]);
    await client.query('UPDATE lich_hoc_nhom SET trang_thai = \'da_huy\' WHERE lop_hoc_id = $1', [id]);
    await client.query('COMMIT');
    res.json({ success: true, message: 'Đã xóa lớp học nhóm thành công!' });
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
    const result = await pool.query("SELECT * FROM ho_so WHERE loai_ho_so = 'giao_vien' AND is_deleted = 0 ORDER BY id DESC");
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// API NHÂN VIÊN (dùng bảng ho_so, loai_ho_so = 'nhan_vien')
// ============================================================

// GET /api/staff: Lấy danh sách nhân viên
router.get('/staff', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM ho_so WHERE loai_ho_so = 'nhan_vien' AND is_deleted = 0 ORDER BY id DESC");
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/staff/create: Thêm nhân viên mới (Có upload avatar + auto tạo tài khoản)
router.post('/staff/create', verifyAccess(['admin']), async (req, res) => {
  const { ho_ten, so_dien_thoai, email, chuc_vu, chi_nhanh, avatar_url, auto_create_account, username, password } = req.body;
  if (!ho_ten || !so_dien_thoai) {
    return res.status(400).json({ success: false, error: 'Thiếu thông tin bắt buộc: họ tên và số điện thoại' });
  }

  if (auto_create_account) {
    const finalUsername = (username || so_dien_thoai || '').trim();
    try {
      const dupCheck = await pool.query('SELECT id FROM tai_khoan WHERE ten_dang_nhap = $1', [finalUsername]);
      if (dupCheck.rows.length > 0) {
        return res.status(400).json({ success: false, error: `Số điện thoại hoặc tên đăng nhập '${finalUsername}' đã được sử dụng. Vui lòng chọn số điện thoại hoặc tên đăng nhập khác.` });
      }
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Tự sinh ma_ho_so (đảm bảo tính duy nhất và không bị trùng khóa)
    let nextNum = 1;
    let ma_ho_so = '';
    let isUnique = false;
    while (!isUnique) {
      const countRes = await client.query("SELECT COUNT(*) FROM ho_so WHERE loai_ho_so = 'nhan_vien'");
      nextNum = parseInt(countRes.rows[0].count) + nextNum;
      ma_ho_so = `NV${String(nextNum).padStart(3, '0')}`;
      const checkDup = await client.query("SELECT id FROM ho_so WHERE ma_ho_so = $1", [ma_ho_so]);
      if (checkDup.rows.length === 0) {
        isUnique = true;
      } else {
        nextNum++;
      }
    }
    
    const finalAvatarUrl = avatar_url && avatar_url.startsWith('data:') ? await uploadToCloudinary(avatar_url) : (avatar_url || null);

    const result = await client.query(
      `INSERT INTO ho_so (ma_ho_so, ho_ten, so_dien_thoai, email, chuc_vu, chi_nhanh, loai_ho_so, avatar_url, is_deleted)
       VALUES ($1, $2, $3, $4, $5, $6, 'nhan_vien', $7, 0) RETURNING *`,
      [ma_ho_so, ho_ten.trim(), so_dien_thoai.trim(), email || null, chuc_vu || 'Nhân viên', chi_nhanh || 'Trung tam chính', finalAvatarUrl]
    );

    const newStaff = result.rows[0];

    if (auto_create_account) {
      const finalUsername = username || so_dien_thoai || generateUsername(ho_ten, 'nv_');
      const finalPassword = password || '123456';
      // Gắn vai trò le_tan (2) làm mặc định cho nhân sự hoặc vai trò admin (1) nếu là quản lý
      const roleId = (chuc_vu === 'Quản lý' || chuc_vu === 'Admin') ? 1 : 2;
      await autoCreateAccount(client, newStaff.id, finalUsername, roleId, finalPassword);
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: newStaff });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// DELETE /api/staff/:id: Xóa mềm nhân viên
router.delete('/staff/:id', verifyAccess(['admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE ho_so SET is_deleted = 1 WHERE id = $1 AND loai_ho_so = 'nhan_vien' RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ nhân viên' });
    }
    res.json({ success: true, message: 'Đã xóa nhân viên thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API PUT /api/staff/:id: Cập nhật nhân viên
router.put('/staff/:id', verifyAccess(['admin']), async (req, res) => {
  const { id } = req.params;
  const { ho_ten, so_dien_thoai, email, chuc_vu, chi_nhanh, avatar_url } = req.body;
  try {
    const finalAvatarUrl = avatar_url && avatar_url.startsWith('data:') ? await uploadToCloudinary(avatar_url) : avatar_url;
    const updateQuery = `
      UPDATE ho_so
      SET ho_ten = $1, so_dien_thoai = $2, email = $3, chuc_vu = $4,
          chi_nhanh = $5, avatar_url = COALESCE($6, avatar_url), ngay_cap_nhat = CURRENT_TIMESTAMP
      WHERE id = $7 AND loai_ho_so = 'nhan_vien' AND is_deleted = 0
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [
      ho_ten, so_dien_thoai, email, chuc_vu || 'Nhân viên', chi_nhanh || 'Trung tam chính', finalAvatarUrl, id
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ nhân viên' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// 1. PHÂN HỆ QUẢN LÝ HỒ SƠ & TÀI KHOẢN HỌC VIÊN / GIÁO VIÊN
// ============================================================

// API POST /api/students/create: Lễ tân tiếp nhận hồ sơ học viên mới (Có upload avatar + auto tạo tài khoản)
router.post('/students/create', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { ho_ten, ngay_sinh, gioi_tinh, ten_phu_huynh, so_dien_thoai, email, trinh_do_dau_vao, chi_nhanh, avatar_url, auto_create_account, username, password } = req.body;
  const genderLower = gioi_tinh ? gioi_tinh.toLowerCase() : 'khác';

  let genderDb = 'khac';
  if (genderLower === 'nam') genderDb = 'nam';
  else if (genderLower === 'nữ' || genderLower === 'nu') genderDb = 'nu';
  else genderDb = 'khac';

  if (auto_create_account) {
    const finalUsername = (username || so_dien_thoai || '').trim();
    try {
      const dupCheck = await pool.query('SELECT id FROM tai_khoan WHERE ten_dang_nhap = $1', [finalUsername]);
      if (dupCheck.rows.length > 0) {
        return res.status(400).json({ success: false, error: `Số điện thoại hoặc tên đăng nhập '${finalUsername}' đã được sử dụng. Vui lòng chọn số điện thoại hoặc tên đăng nhập khác.` });
      }
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Tự sinh ma_ho_so (đảm bảo tính duy nhất và không bị trùng khóa)
    let nextNum = 1;
    let ma_ho_so = '';
    let isUnique = false;
    while (!isUnique) {
      const countRes = await client.query("SELECT COUNT(*) FROM ho_so WHERE loai_ho_so = 'hoc_vien'");
      nextNum = parseInt(countRes.rows[0].count) + nextNum;
      ma_ho_so = `HV${String(nextNum).padStart(3, '0')}`;
      const checkDup = await client.query("SELECT id FROM ho_so WHERE ma_ho_so = $1", [ma_ho_so]);
      if (checkDup.rows.length === 0) {
        isUnique = true;
      } else {
        nextNum++;
      }
    }

    const finalAvatarUrl = avatar_url && avatar_url.startsWith('data:') ? await uploadToCloudinary(avatar_url) : (avatar_url || null);

    const insertQuery = `
      INSERT INTO ho_so (
        ma_ho_so, ho_ten, ngay_sinh, gioi_tinh, ten_phu_huynh, so_dien_thoai, email, 
        trinh_do_dau_vao, chi_nhanh, loai_ho_so, avatar_url, is_deleted
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'hoc_vien', $10, 0)
      RETURNING *
    `;

    const result = await client.query(insertQuery, [
      ma_ho_so, ho_ten, ngay_sinh, genderDb, ten_phu_huynh, so_dien_thoai, email, trinh_do_dau_vao, chi_nhanh, finalAvatarUrl
    ]);

    const newStudent = result.rows[0];

    if (auto_create_account) {
      const finalUsername = username || so_dien_thoai || generateUsername(ho_ten, 'hv_');
      const finalPassword = password || '123456';
      await autoCreateAccount(client, newStudent.id, finalUsername, 4, finalPassword); // vai_tro_id = 4 cho hoc_vien
    }

    // Ghi nhận thông báo
    await createNotification(
      'them_hoc_vien',
      'Tiếp nhận học viên mới',
      `Học viên "${ho_ten}" (${ma_ho_so}) đã được tiếp nhận tại chi nhánh "${chi_nhanh || 'Trung tâm chính'}".`,
      newStudent.id,
      'ho_so',
      'nhan_vien'
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: newStudent });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Lỗi API tạo học viên:', err.message);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// API POST /api/teachers/create: Tạo hồ sơ giáo viên mới (Có upload avatar + auto tạo tài khoản)
router.post('/teachers/create', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { ho_ten, so_dien_thoai, email, chuyen_mon, kinh_nghiem, chi_nhanh, avatar_url, auto_create_account, username, password } = req.body;

  if (auto_create_account) {
    const finalUsername = (username || so_dien_thoai || '').trim();
    try {
      const dupCheck = await pool.query('SELECT id FROM tai_khoan WHERE ten_dang_nhap = $1', [finalUsername]);
      if (dupCheck.rows.length > 0) {
        return res.status(400).json({ success: false, error: `Số điện thoại hoặc tên đăng nhập '${finalUsername}' đã được sử dụng. Vui lòng chọn số điện thoại hoặc tên đăng nhập khác.` });
      }
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Tự sinh ma_ho_so (đảm bảo tính duy nhất và không bị trùng khóa)
    let nextNum = 1;
    let ma_ho_so = '';
    let isUnique = false;
    while (!isUnique) {
      const countRes = await client.query("SELECT COUNT(*) FROM ho_so WHERE loai_ho_so = 'giao_vien'");
      nextNum = parseInt(countRes.rows[0].count) + nextNum;
      ma_ho_so = `GV${String(nextNum).padStart(3, '0')}`;
      const checkDup = await client.query("SELECT id FROM ho_so WHERE ma_ho_so = $1", [ma_ho_so]);
      if (checkDup.rows.length === 0) {
        isUnique = true;
      } else {
        nextNum++;
      }
    }

    const finalAvatarUrl = avatar_url && avatar_url.startsWith('data:') ? await uploadToCloudinary(avatar_url) : (avatar_url || null);

    const insertQuery = `
      INSERT INTO ho_so (
        ma_ho_so, ho_ten, so_dien_thoai, email, chuyen_mon, kinh_nghiem, chi_nhanh, loai_ho_so, avatar_url, is_deleted
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'giao_vien', $8, 0)
      RETURNING *
    `;

    const result = await client.query(insertQuery, [
      ma_ho_so, ho_ten, so_dien_thoai, email, chuyen_mon, parseInt(kinh_nghiem) || 0, chi_nhanh || 'Trung tam chính', finalAvatarUrl
    ]);

    const newTeacher = result.rows[0];

    if (auto_create_account) {
      const finalUsername = username || so_dien_thoai || generateUsername(ho_ten, 'gv_');
      const finalPassword = password || '123456';
      await autoCreateAccount(client, newTeacher.id, finalUsername, 3, finalPassword); // vai_tro_id = 3 cho giao_vien
    }

    // Ghi nhận thông báo
    await createNotification(
      'them_giao_vien',
      'Tuyển dụng giáo viên mới',
      `Giáo viên "${ho_ten}" (${ma_ho_so}) đã được thêm mới trên hệ thống.`,
      newTeacher.id,
      'ho_so',
      'nhan_vien'
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: newTeacher });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Lỗi API tạo giáo viên:', err.message);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// Lấy danh sách học viên (trả đầy đủ trường: ngay_sinh, email, ten_phu_huynh, trinh_do_dau_vao)
router.get('/students', async (req, res) => {
  try {
    const queryStr = `
      SELECT 
        h.id, h.ma_ho_so, h.ho_ten, h.ngay_sinh::text, h.gioi_tinh,
        h.ten_phu_huynh, h.so_dien_thoai, h.email,
        h.trinh_do_dau_vao, h.chi_nhanh, h.loai_ho_so,
        h.ngay_tao, h.ngay_cap_nhat, h.avatar_url,
        COALESCE(v.trang_thai_mau, 'chua_dang_ky') as trang_thai_mau,
        (
          SELECT COALESCE(json_agg(goi_hoc_phi_id), '[]'::json) 
          FROM dang_ky_khoa_hoc 
          WHERE ho_so_id = h.id AND trang_thai = 'dang_hoat_dong'
        ) as active_course_pkg_ids,
        (
          SELECT COALESCE(json_agg(goi_hoc_kem_id), '[]'::json) 
          FROM dang_ky_hoc_kem 
          WHERE hoc_vien_id = h.id AND trang_thai = 'dang_hoat_dong'
        ) as active_tutor_pkg_ids,
        (
          SELECT COALESCE(json_agg(giao_vien_id), '[]'::json) 
          FROM dang_ky_hoc_kem 
          WHERE hoc_vien_id = h.id AND trang_thai = 'dang_hoat_dong'
        ) as active_teacher_ids,
        (
          SELECT COALESCE(
            (SELECT so_tien_da_thu FROM dang_ky_khoa_hoc WHERE ho_so_id = h.id AND trang_thai = 'dang_hoat_dong' ORDER BY ngay_tao DESC LIMIT 1),
            (SELECT so_tien_da_thu FROM dang_ky_hoc_kem WHERE hoc_vien_id = h.id AND trang_thai = 'dang_hoat_dong' ORDER BY ngay_tao DESC LIMIT 1),
            0
          )
        ) as goi_dang_ky_gan_nhat_price
      FROM ho_so h
      LEFT JOIN v_trang_thai_hoi_vien v ON h.id = v.id
      WHERE h.loai_ho_so = 'hoc_vien' AND h.is_deleted = 0
      ORDER BY h.id DESC
    `;
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
        lh.id, lh.dang_ky_hoc_kem_id, lh.giao_vien_id, lh.hoc_vien_id, 
        lh.ngay_hoc::text, lh.gio_bat_dau, lh.gio_ket_thuc, lh.loai_buoi, 
        lh.trang_thai, lh.da_checkin, lh.pt_xac_nhan, lh.hv_xac_nhan, 
        lh.ngay_xac_nhan, lh.ghi_chu, lh.ngay_tao, lh.ngay_cap_nhat,
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

// ============================================================
// 6. PHÂN HỆ THÔNG BÁO (Notifications)
// ============================================================

// Helper function để chèn thông báo
async function createNotification(loai, tieu_de, noi_dung, doi_tuong_id = null, doi_tuong = null, danh_cho = 'nhan_vien') {
  // Map loai để vượt qua constraint 'thong_bao_loai_check' trong DB Edtech cũ
  const validTypes = [
    'sap_het_han_goi_tap', 'het_han_goi_tap', 'check_in', 
    'chua_check_in_truoc_buoi_pt', 'cron_tu_xac_nhan', 'sap_het_buoi_pt', 
    'ho_so_moi', 'gia_han_goi_tap', 'dang_ky_goi_pt_moi', 'huy_buoi_tap', 
    'hoan_tac_buoi_tap', 'tai_khoan_bi_khoa', 'tai_khoan_moi', 
    'tom_tat_buoi_sang', 'het_han_goi_pt_thang', 'cap_nhat_buoi_tap'
  ];
  let finalLoai = loai;
  if (!validTypes.includes(loai)) {
    if (loai.includes('dang_ky_khoa_hoc') || loai.includes('dang_ky_goi_pt_moi') || loai.includes('them_')) {
      finalLoai = 'dang_ky_goi_pt_moi';
    } else if (loai.includes('huy_')) {
      finalLoai = 'huy_buoi_tap';
    } else if (loai.includes('sua_') || loai.includes('cap_nhat_')) {
      finalLoai = 'cap_nhat_buoi_tap';
    } else {
      finalLoai = 'ho_so_moi';
    }
  }

  let finalDanhCho = danh_cho;
  if (danh_cho === 'giao_vien' || danh_cho === 'hoc_vien') {
    finalDanhCho = 'nhan_vien'; // Constraint chỉ cho phép ['admin', 'nhan_vien', 'ca_hai']
  }

  try {
    await pool.query(
      `INSERT INTO thong_bao (loai, tieu_de, noi_dung, doi_tuong_id, doi_tuong, danh_cho) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [finalLoai, tieu_de, noi_dung, doi_tuong_id, doi_tuong, finalDanhCho]
    );
  } catch (err) {
    console.error('Lỗi tự động chèn thông báo:', err.message);
  }
}

// GET /api/notifications: Lấy danh sách thông báo theo role
router.get('/notifications', async (req, res) => {
  const userRole = req.headers['x-user-role'] || 'hoc_vien';
  let target = 'nhan_vien'; // Mặc định Lễ tân/nhân viên
  if (userRole === 'admin') target = 'admin';
  else if (userRole === 'giao_vien') target = 'giao_vien';
  else if (userRole === 'hoc_vien') target = 'hoc_vien';

  try {
    // Admin xem được tất cả các thông báo
    let queryStr = '';
    let params = [];
    if (userRole === 'admin') {
      queryStr = 'SELECT * FROM thong_bao ORDER BY ngay_tao DESC LIMIT 100';
    } else {
      queryStr = 'SELECT * FROM thong_bao WHERE danh_cho = $1 ORDER BY ngay_tao DESC LIMIT 100';
      params.push(target);
    }
    const result = await pool.query(queryStr, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/notifications/:id/read: Đánh dấu đã đọc
router.put('/notifications/:id/read', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE thong_bao SET da_doc = 1 WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy thông báo' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/notifications/:id: Xóa một thông báo
router.delete('/notifications/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM thong_bao WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy thông báo' });
    }
    res.json({ success: true, message: 'Đã xóa thông báo thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/notifications/all: Xóa tất cả thông báo của người dùng đó
router.delete('/notifications/all/clear', async (req, res) => {
  const userRole = req.headers['x-user-role'] || 'hoc_vien';
  let target = 'nhan_vien';
  if (userRole === 'admin') target = 'admin';
  else if (userRole === 'giao_vien') target = 'giao_vien';
  else if (userRole === 'hoc_vien') target = 'hoc_vien';

  try {
    if (userRole === 'admin') {
      await pool.query('DELETE FROM thong_bao');
    } else {
      await pool.query('DELETE FROM thong_bao WHERE danh_cho = $1', [target]);
    }
    res.json({ success: true, message: 'Đã xóa tất cả thông báo!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// 7. PHÂN HỆ NỘI QUY (Rules Management)
// ============================================================

// POST /api/rules: Thêm nội quy (Chỉ Admin/Lễ tân)
router.post('/rules', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { tieu_de, noi_dung, ap_dung_cho, thu_tu } = req.body;
  if (!tieu_de || !noi_dung) {
    return res.status(400).json({ success: false, error: 'Tiêu đề và nội dung là bắt buộc' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO noi_quy (tieu_de, noi_dung, ap_dung_cho, thu_tu, is_active) 
       VALUES ($1, $2, $3, $4, 1) RETURNING *`,
      [tieu_de, noi_dung, ap_dung_cho || 'tất cả', parseInt(thu_tu) || 0]
    );

    // Ghi nhận thông báo
    await createNotification(
      'them_noi_quy',
      'Thêm nội quy mới',
      `Nội quy "${tieu_de}" đã được thêm mới bởi bộ phận quản trị.`,
      result.rows[0].id,
      'noi_quy',
      'nhan_vien'
    );
    await createNotification(
      'them_noi_quy',
      'Cập nhật nội quy trung tâm',
      `Đã có nội quy mới được ban hành: "${tieu_de}". Vui lòng đọc kỹ để tuân thủ.`,
      result.rows[0].id,
      'noi_quy',
      'hoc_vien'
    );
    await createNotification(
      'them_noi_quy',
      'Cập nhật nội quy trung tâm',
      `Đã có nội quy mới được ban hành: "${tieu_de}". Vui lòng đọc kỹ để tuân thủ.`,
      result.rows[0].id,
      'noi_quy',
      'giao_vien'
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/rules/:id: Cập nhật nội quy (Chỉ Admin/Lễ tân)
router.put('/rules/:id', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { id } = req.params;
  const { tieu_de, noi_dung, ap_dung_cho, thu_tu, is_active } = req.body;
  try {
    const result = await pool.query(
      `UPDATE noi_quy 
       SET tieu_de = $1, noi_dung = $2, ap_dung_cho = $3, thu_tu = $4, is_active = $5 
       WHERE id = $6 RETURNING *`,
      [tieu_de, noi_dung, ap_dung_cho, parseInt(thu_tu) || 0, parseInt(is_active) === 0 ? 0 : 1, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy nội quy' });
    }

    // Ghi nhận thông báo
    await createNotification(
      'sua_noi_quy',
      'Chỉnh sửa nội quy',
      `Nội quy "${tieu_de}" đã được cập nhật nội dung.`,
      id,
      'noi_quy',
      'nhan_vien'
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/rules/:id: Xóa nội quy (Chỉ Admin/Lễ tân)
router.delete('/rules/:id', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { id } = req.params;
  try {
    // Đọc thông tin trước khi xóa để gửi thông báo
    const ruleRes = await pool.query('SELECT tieu_de FROM noi_quy WHERE id = $1', [id]);
    if (ruleRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy nội quy' });
    }
    const tieu_de = ruleRes.rows[0].tieu_de;

    await pool.query('DELETE FROM noi_quy WHERE id = $1', [id]);

    // Ghi nhận thông báo
    await createNotification(
      'xoa_noi_quy',
      'Xóa nội quy',
      `Nội quy "${tieu_de}" đã bị gỡ bỏ khỏi hệ thống.`,
      id,
      'noi_quy',
      'nhan_vien'
    );

    res.json({ success: true, message: 'Đã xóa nội quy thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

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
    await createNotification(
      'huy_khoa_hoc',
      'Hủy khóa học',
      `Đăng ký khóa học ID ${id} đã bị hủy. Hoàn tiền: ${so_tien_hoan || 0} VNĐ.`,
      id,
      'dang_ky_khoa_hoc',
      'nhan_vien'
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Lỗi API hủy khóa học (Transaction):', err.message);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// API PUT /api/registrations/:id: Cập nhật / đổi gói khóa học đại trà
router.put('/registrations/:id', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { id } = req.params;
  const { goi_hoc_phi_id, tu_ngay, den_ngay, gia_thuc_te, so_tien_da_thu, phuong_thuc_tt } = req.body;

  if (so_tien_da_thu < 0 || so_tien_da_thu > gia_thuc_te) {
    return res.status(400).json({ success: false, error: 'Số tiền thực thu không hợp lệ' });
  }

  try {
    const query = `
      UPDATE dang_ky_khoa_hoc
      SET 
        goi_hoc_phi_id = COALESCE($1, goi_hoc_phi_id),
        tu_ngay = COALESCE($2, tu_ngay),
        den_ngay = COALESCE($3, den_ngay),
        gia_thuc_te = COALESCE($4, gia_thuc_te),
        so_tien_da_thu = COALESCE($5, so_tien_da_thu),
        phuong_thuc_tt = COALESCE($6, phuong_thuc_tt),
        ngay_cap_nhat = CURRENT_TIMESTAMP
      WHERE id = $7 AND trang_thai = 'dang_hoat_dong'
      RETURNING *
    `;
    const result = await pool.query(query, [
      goi_hoc_phi_id ? parseInt(goi_hoc_phi_id) : null,
      tu_ngay || null,
      den_ngay || null,
      gia_thuc_te !== undefined ? parseFloat(gia_thuc_te) : null,
      so_tien_da_thu !== undefined ? parseFloat(so_tien_da_thu) : null,
      phuong_thuc_tt || null,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy gói học đang hoạt động để chỉnh sửa' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API PUT /api/registrations/tutoring/:id: Cập nhật / đổi gói dạy học kèm 1-1
router.put('/registrations/tutoring/:id', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { id } = req.params;
  const { giao_vien_id, goi_hoc_kem_id, so_buoi_dang_ky, so_buoi_da_hoc, tu_ngay, den_ngay, gia_thuc_te, so_tien_da_thu, phuong_thuc_tt } = req.body;

  if (so_tien_da_thu < 0 || so_tien_da_thu > gia_thuc_te) {
    return res.status(400).json({ success: false, error: 'Số tiền thực thu không hợp lệ' });
  }

  try {
    const query = `
      UPDATE dang_ky_hoc_kem
      SET 
        giao_vien_id = COALESCE($1, giao_vien_id),
        goi_hoc_kem_id = COALESCE($2, goi_hoc_kem_id),
        so_buoi_dang_ky = COALESCE($3, so_buoi_dang_ky),
        so_buoi_da_hoc = COALESCE($4, so_buoi_da_hoc),
        tu_ngay = COALESCE($5, tu_ngay),
        den_ngay = COALESCE($6, den_ngay),
        gia_thuc_te = COALESCE($7, gia_thuc_te),
        so_tien_da_thu = COALESCE($8, so_tien_da_thu),
        phuong_thuc_tt = COALESCE($9, phuong_thuc_tt),
        ngay_cap_nhat = CURRENT_TIMESTAMP
      WHERE id = $10 AND trang_thai = 'dang_hoat_dong'
      RETURNING *
    `;
    const result = await pool.query(query, [
      giao_vien_id ? parseInt(giao_vien_id) : null,
      goi_hoc_kem_id ? parseInt(goi_hoc_kem_id) : null,
      so_buoi_dang_ky !== undefined ? parseInt(so_buoi_dang_ky) : null,
      so_buoi_da_hoc !== undefined ? parseInt(so_buoi_da_hoc) : null,
      tu_ngay || null,
      den_ngay || null,
      gia_thuc_te !== undefined ? parseFloat(gia_thuc_te) : null,
      so_tien_da_thu !== undefined ? parseFloat(so_tien_da_thu) : null,
      phuong_thuc_tt || null,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy gói học kèm đang hoạt động để chỉnh sửa' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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
  const { ho_ten, ngay_sinh, gioi_tinh, ten_phu_huynh, so_dien_thoai, email, trinh_do_dau_vao, chi_nhanh, avatar_url } = req.body;
  const genderLower = gioi_tinh ? gioi_tinh.toLowerCase() : 'khác';
  let genderDb = 'khac';
  if (genderLower === 'nam') genderDb = 'nam';
  else if (genderLower === 'nữ' || genderLower === 'nu') genderDb = 'nu';
  else genderDb = 'khac';

  try {
    const finalAvatarUrl = avatar_url && avatar_url.startsWith('data:') ? await uploadToCloudinary(avatar_url) : avatar_url;
    const updateQuery = `
      UPDATE ho_so
      SET ho_ten = $1, ngay_sinh = $2, gioi_tinh = $3, ten_phu_huynh = $4,
          so_dien_thoai = $5, email = $6, trinh_do_dau_vao = $7, chi_nhanh = $8,
          avatar_url = COALESCE($9, avatar_url),
          ngay_cap_nhat = CURRENT_TIMESTAMP
      WHERE id = $10 AND loai_ho_so = 'hoc_vien' AND is_deleted = 0
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [
      ho_ten, ngay_sinh, genderDb, ten_phu_huynh, so_dien_thoai, email, trinh_do_dau_vao, chi_nhanh, finalAvatarUrl, id
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ học viên' });
    }
    
    // Ghi nhận thông báo
    await createNotification(
      'sua_hoc_vien',
      'Cập nhật hồ sơ học viên',
      `Hồ sơ học viên "${ho_ten}" đã được cập nhật thành công.`,
      id,
      'ho_so',
      'nhan_vien'
    );

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

    // Ghi nhận thông báo
    await createNotification(
      'xoa_hoc_vien',
      'Xóa hồ sơ học viên',
      `Đã xóa mềm hồ sơ học viên "${result.rows[0].ho_ten}" khỏi hệ thống.`,
      id,
      'ho_so',
      'nhan_vien'
    );

    res.json({ success: true, message: 'Đã xóa mềm học viên thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/teachers/:id: Cập nhật giáo viên
router.put('/teachers/:id', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { id } = req.params;
  const { ho_ten, so_dien_thoai, email, chuyen_mon, kinh_nghiem, chi_nhanh, avatar_url } = req.body;
  try {
    const finalAvatarUrl = avatar_url && avatar_url.startsWith('data:') ? await uploadToCloudinary(avatar_url) : avatar_url;
    const updateQuery = `
      UPDATE ho_so
      SET ho_ten = $1, so_dien_thoai = $2, email = $3, chuyen_mon = $4,
          kinh_nghiem = $5, chi_nhanh = $6,
          avatar_url = COALESCE($7, avatar_url),
          ngay_cap_nhat = CURRENT_TIMESTAMP
      WHERE id = $8 AND loai_ho_so = 'giao_vien' AND is_deleted = 0
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [
      ho_ten, so_dien_thoai, email, chuyen_mon, parseInt(kinh_nghiem) || 0, chi_nhanh || 'Trung tam chính', finalAvatarUrl, id
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ giáo viên' });
    }

    // Ghi nhận thông báo
    await createNotification(
      'sua_giao_vien',
      'Cập nhật hồ sơ giáo viên',
      `Hồ sơ giáo viên "${ho_ten}" đã được cập nhật thành công.`,
      id,
      'ho_so',
      'nhan_vien'
    );

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

    // Ghi nhận thông báo
    await createNotification(
      'xoa_giao_vien',
      'Xóa hồ sơ giáo viên',
      `Đã xóa mềm hồ sơ giáo viên "${result.rows[0].ho_ten}" khỏi hệ thống.`,
      id,
      'ho_so',
      'nhan_vien'
    );

    res.json({ success: true, message: 'Đã xóa mềm giáo viên thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
