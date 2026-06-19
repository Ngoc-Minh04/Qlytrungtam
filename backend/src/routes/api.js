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

  if (giao_vien_id && hoc_vien_id === giao_vien_id) {
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
      hoc_vien_id, giao_vien_id || null, goi_hoc_kem_id, so_buoi_dang_ky, tu_ngay, den_ngay || null, gia_thuc_te, so_tien_da_thu, phuong_thuc_tt
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

// API POST /api/schedule: Xếp lịch học kèm/lớp học (Chống 3 lỗi lớn và hỗ trợ xếp lịch hàng loạt)
router.post('/schedule', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { dang_ky_hoc_kem_id, ngay_hoc, gio_bat_dau, gio_ket_thuc, loai_buoi, ngay_hoc_list, giao_vien_id } = req.body;

  const datesToSchedule = (ngay_hoc_list && Array.isArray(ngay_hoc_list) && ngay_hoc_list.length > 0) 
    ? ngay_hoc_list 
    : [ngay_hoc];

  if (!dang_ky_hoc_kem_id || datesToSchedule.some(d => !d) || !gio_bat_dau || !gio_ket_thuc) {
    return res.status(400).json({ success: false, error: 'Thiếu thông tin bắt buộc để xếp lịch học' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Đọc thông tin hợp đồng đăng ký học kèm
    const contractRes = await client.query('SELECT * FROM dang_ky_hoc_kem WHERE id = $1', [dang_ky_hoc_kem_id]);
    if (contractRes.rows.length === 0) {
      throw new Error('Không tìm thấy đăng ký học kèm tương ứng');
    }
    const contract = contractRes.rows[0];

    // Xác định giáo viên thực tế (ưu tiên giáo viên gửi từ form, fallback về giáo viên của hợp đồng)
    const finalGvId = giao_vien_id ? parseInt(giao_vien_id) : contract.giao_vien_id;

    // 2. Chặn ngày quá khứ
    const today = new Date().toISOString().split('T')[0];
    for (const d of datesToSchedule) {
      if (d < today) {
        throw new Error(`Không thể xếp lịch vào ngày trong quá khứ (${d.split('-').reverse().join('/')})`);
      }
    }

    // 3. Chặn xếp lịch học ngoài thời hạn hợp đồng
    for (const d of datesToSchedule) {
      const dateHoc = new Date(d);
      const dateTu = new Date(contract.tu_ngay);
      const dateDen = contract.den_ngay ? new Date(contract.den_ngay) : null;

      if (dateHoc < dateTu || (dateDen && dateHoc > dateDen)) {
        throw new Error(`Lỗi: Ngày xếp lịch (${d.split('-').reverse().join('/')}) nằm ngoài thời hạn hợp đồng (từ ${contract.tu_ngay.toISOString().split('T')[0].split('-').reverse().join('/')} đến ${contract.den_ngay ? contract.den_ngay.toISOString().split('T')[0].split('-').reverse().join('/') : 'vô hạn'})`);
      }
    }

    // 4. Chặn vượt quá số buổi đăng ký
    const countRes = await client.query(
      "SELECT COUNT(*) FROM lich_hoc WHERE dang_ky_hoc_kem_id = $1 AND trang_thai IN ('cho_hoc', 'da_hoc')",
      [dang_ky_hoc_kem_id]
    );
    const activeSessions = parseInt(countRes.rows[0].count);
    const totalProposed = activeSessions + datesToSchedule.length;
    if (totalProposed > contract.so_buoi_dang_ky) {
      throw new Error(`Lỗi: Bạn đề xuất xếp thêm ${datesToSchedule.length} buổi, nâng tổng số buổi xếp lên ${totalProposed}/${contract.so_buoi_dang_ky} buổi của gói học. Không được vượt quá giới hạn.`);
    }

    // 5. Kiểm tra overlap của từng ngày
    for (const d of datesToSchedule) {
      // 5.1 Chặn trùng lịch dạy của Giáo viên
      if (finalGvId) {
        const checkGvOverlap1 = `
          SELECT id FROM lich_hoc
          WHERE giao_vien_id = $1 
            AND ngay_hoc = $2 
            AND trang_thai != 'da_huy'
            AND NOT (gio_ket_thuc <= $3 OR gio_bat_dau >= $4)
        `;
        const checkGvOverlap2 = `
          SELECT id FROM lich_hoc_nhom
          WHERE giao_vien_id = $1 
            AND ngay_hoc = $2 
            AND trang_thai != 'da_huy'
            AND NOT (gio_ket_thuc <= $3 OR gio_bat_dau >= $4)
        `;

        const overlapRes1 = await client.query(checkGvOverlap1, [finalGvId, d, gio_bat_dau, gio_ket_thuc]);
        const overlapRes2 = await client.query(checkGvOverlap2, [finalGvId, d, gio_bat_dau, gio_ket_thuc]);

        if (overlapRes1.rows.length > 0 || overlapRes2.rows.length > 0) {
          throw new Error(`Giáo viên giảng dạy đã bị trùng lịch ngày ${d.split('-').reverse().join('/')} vào ca giờ ${gio_bat_dau.slice(0,5)}-${gio_ket_thuc.slice(0,5)}!`);
        }
      }

      // 5.2 Chặn trùng lịch học của Học viên
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
      const hvOverlap1 = await client.query(checkHvOverlap1, [contract.hoc_vien_id, d, gio_bat_dau, gio_ket_thuc]);
      const hvOverlap2 = await client.query(checkHvOverlap2, [contract.hoc_vien_id, d, gio_bat_dau, gio_ket_thuc]);

      if (hvOverlap1.rows.length > 0 || hvOverlap2.rows.length > 0) {
        throw new Error(`Học viên đã có lịch học một ca khác vào ngày ${d.split('-').reverse().join('/')} trong khung giờ ${gio_bat_dau.slice(0,5)}-${gio_ket_thuc.slice(0,5)}!`);
      }
    }

    // Nếu hợp đồng học kèm chưa được gán giáo viên và có giáo viên được chọn từ form, tự động cập nhật hợp đồng
    if (giao_vien_id && !contract.giao_vien_id) {
      await client.query('UPDATE dang_ky_hoc_kem SET giao_vien_id = $1 WHERE id = $2', [finalGvId, dang_ky_hoc_kem_id]);
    }

    // 6. Thực hiện chèn hàng loạt ca học
    const schedulesCreated = [];
    for (const d of datesToSchedule) {
      const insertQuery = `
        INSERT INTO lich_hoc (
          dang_ky_hoc_kem_id, giao_vien_id, hoc_vien_id, ngay_hoc, gio_bat_dau, gio_ket_thuc, loai_buoi, trang_thai
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'cho_hoc')
        RETURNING *
      `;
      const insertRes = await client.query(insertQuery, [
        dang_ky_hoc_kem_id, finalGvId || null, contract.hoc_vien_id, d, gio_bat_dau, gio_ket_thuc, loai_buoi || 'ca_nhan'
      ]);
      schedulesCreated.push(insertRes.rows[0]);
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: schedulesCreated });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
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

// API PUT /api/schedule/by-contract/:contractId/update-batch: Cập nhật hàng loạt giáo viên, giờ học cho các ca kèm chưa dạy
router.put('/schedule/by-contract/:contractId/update-batch', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { contractId } = req.params;
  const { giao_vien_id, gio_bat_dau, gio_ket_thuc } = req.body;

  if (!gio_bat_dau || !gio_ket_thuc) {
    return res.status(400).json({ success: false, error: 'Vui lòng cung cấp đầy đủ giờ bắt đầu và giờ kết thúc!' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Lấy danh sách các ca chưa dạy của hợp đồng
    const sessionsRes = await client.query(
      "SELECT id, ngay_hoc::text FROM lich_hoc WHERE dang_ky_hoc_kem_id = $1 AND trang_thai = 'cho_hoc'",
      [contractId]
    );
    const sessions = sessionsRes.rows;

    if (sessions.length === 0) {
      throw new Error('Không có ca học kèm chưa học nào để cập nhật!');
    }

    const newGvId = giao_vien_id ? parseInt(giao_vien_id) : null;

    // 2. Kiểm tra trùng lịch cho từng ca
    for (const s of sessions) {
      const d = s.ngay_hoc;

      // Check GV trùng
      if (newGvId) {
        const checkGv1 = `
          SELECT id FROM lich_hoc 
          WHERE giao_vien_id = $1 AND ngay_hoc = $2 AND id != $3 AND trang_thai != 'da_huy'
            AND NOT (gio_ket_thuc <= $4 OR gio_bat_dau >= $5)
        `;
        const checkGv2 = `
          SELECT id FROM lich_hoc_nhom 
          WHERE giao_vien_id = $1 AND ngay_hoc = $2 AND trang_thai != 'da_huy'
            AND NOT (gio_ket_thuc <= $3 OR gio_bat_dau >= $4)
        `;
        const resGv1 = await client.query(checkGv1, [newGvId, d, s.id, gio_bat_dau, gio_ket_thuc]);
        const resGv2 = await client.query(checkGv2, [newGvId, d, gio_bat_dau, gio_ket_thuc]);
        if (resGv1.rows.length > 0 || resGv2.rows.length > 0) {
          throw new Error(`Giáo viên giảng dạy đã bị trùng lịch vào ngày ${d.split('-').reverse().join('/')} khung giờ ${gio_bat_dau}-${gio_ket_thuc}!`);
        }
      }
    }

    // 3. Tiến hành cập nhật
    for (const s of sessions) {
      await client.query(
        `UPDATE lich_hoc 
         SET gio_bat_dau = $1, gio_ket_thuc = $2, giao_vien_id = COALESCE($3, giao_vien_id), ngay_cap_nhat = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [gio_bat_dau, gio_ket_thuc, newGvId, s.id]
      );
    }

    // Nếu thay đổi giáo viên, tự động cập nhật cả giáo viên phụ trách trong đăng ký học kèm
    if (newGvId) {
      await client.query('UPDATE dang_ky_hoc_kem SET giao_vien_id = $1 WHERE id = $2', [newGvId, contractId]);
    }

    await client.query('COMMIT');
    res.json({ success: true, message: `Cập nhật thành công ${sessions.length} ca học kèm chưa diễn ra!` });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
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

// API DELETE /api/classes/schedule/:id: Xóa một ca dạy đơn lẻ của lớp nhóm khỏi database
router.delete('/classes/schedule/:id', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM lich_hoc_nhom WHERE id = $1 AND trang_thai = 'cho_hoc' RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy ca học nhóm chưa diễn ra để hủy!' });
    }
    res.json({ success: true, message: 'Đã hủy ca học nhóm đơn lẻ thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API PUT /api/classes/schedule/:id: Cập nhật sửa đổi một ca học nhóm đơn lẻ
router.put('/classes/schedule/:id', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { id } = req.params;
  const { ngay_hoc, gio_bat_dau, gio_ket_thuc, giao_vien_id } = req.body;

  try {
    const sessionRes = await pool.query('SELECT * FROM lich_hoc_nhom WHERE id = $1', [id]);
    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy buổi học lớp nhóm' });
    }
    const session = sessionRes.rows[0];

    const newGvId = giao_vien_id || session.giao_vien_id;
    const newNgay = ngay_hoc || session.ngay_hoc;
    const newStart = gio_bat_dau || session.gio_bat_dau;
    const newEnd = gio_ket_thuc || session.gio_ket_thuc;

    // Chặn sửa ngày/giờ quá khứ
    const targetDateTime = new Date(`${newNgay.split('T')[0]}T${newStart}:00`);
    if (targetDateTime < new Date()) {
      return res.status(400).json({ success: false, error: 'Không thể chỉnh sửa ca học nhóm lùi về thời điểm quá khứ!' });
    }

    // Kiểm tra giáo viên trùng lịch
    if (newGvId) {
      const checkGvOverlap1 = `
        SELECT id FROM lich_hoc
        WHERE giao_vien_id = $1 AND ngay_hoc = $2 AND trang_thai != 'da_huy'
          AND NOT (gio_ket_thuc <= $3 OR gio_bat_dau >= $4)
      `;
      const checkGvOverlap2 = `
        SELECT id FROM lich_hoc_nhom
        WHERE giao_vien_id = $1 AND ngay_hoc = $2 AND id != $3 AND trang_thai != 'da_huy'
          AND NOT (gio_ket_thuc <= $4 OR gio_bat_dau >= $5)
      `;
      const gvOverlapRes1 = await pool.query(checkGvOverlap1, [newGvId, newNgay, newStart, newEnd]);
      const gvOverlapRes2 = await pool.query(checkGvOverlap2, [newGvId, newNgay, id, newStart, newEnd]);
      if (gvOverlapRes1.rows.length > 0 || gvOverlapRes2.rows.length > 0) {
        return res.status(400).json({ success: false, error: 'Giáo viên phụ trách đã bị trùng lịch giảng dạy ca khác vào khung giờ mới này!' });
      }
    }

    const updateQuery = `
      UPDATE lich_hoc_nhom
      SET ngay_hoc = $1, gio_bat_dau = $2, gio_ket_thuc = $3, giao_vien_id = $4
      WHERE id = $5
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [newNgay, newStart, newEnd, newGvId, id]);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API DELETE /api/schedule/by-contract/:contractId: Hủy hàng loạt các ca học kèm chưa học (trạng thái cho_hoc)
router.delete('/schedule/by-contract/:contractId', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { contractId } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM lich_hoc WHERE dang_ky_hoc_kem_id = $1 AND trang_thai = 'cho_hoc' RETURNING *",
      [contractId]
    );
    res.json({ 
      success: true, 
      message: `Đã hủy thành công ${result.rows.length} ca học kèm chưa diễn ra!`,
      count: result.rows.length 
    });
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
  const { qr_token, current_branch, ho_so_id } = req.body;

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
    const inputStr = String(ho_so_id).trim();
    let hsRes;

    // 3.1. Tìm chính xác theo mã hồ sơ (case-insensitive)
    hsRes = await pool.query(
      'SELECT * FROM ho_so WHERE UPPER(ma_ho_so) = UPPER($1) AND is_deleted = 0',
      [inputStr]
    );

    // 3.2. Nếu không thấy, và input là số thuần túy, thử tìm theo khóa chính ID
    if (hsRes.rows.length === 0 && /^\d+$/.test(inputStr)) {
      hsRes = await pool.query(
        'SELECT * FROM ho_so WHERE id = $1 AND is_deleted = 0',
        [parseInt(inputStr)]
      );
    }

    // 3.3. Nếu vẫn không thấy, thử tìm theo số của ma_ho_so (ví dụ gõ 34 hoặc 034 -> tìm HV034, GV034, NV034)
    if (hsRes.rows.length === 0 && /^\d+$/.test(inputStr)) {
      const paddedNum = inputStr.padStart(3, '0');
      hsRes = await pool.query(
        `SELECT * FROM ho_so 
         WHERE (UPPER(ma_ho_so) = 'HV' || $1 
            OR UPPER(ma_ho_so) = 'GV' || $1 
            OR UPPER(ma_ho_so) = 'NV' || $1) 
           AND is_deleted = 0`,
        [paddedNum]
      );
    }

    if (hsRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Hồ sơ người dùng không tồn tại hoặc đã bị khóa' });
    }
    const userProfile = hsRes.rows[0];

    // 3.4. Kiểm tra chống check-in trùng lặp trong vòng 5 phút gần nhất
    const recentCheckin = await pool.query(
      `SELECT * FROM luot_vao_ra 
       WHERE ho_so_id = $1 
         AND thoi_diem > NOW() - INTERVAL '5 minutes'
       ORDER BY thoi_diem DESC LIMIT 1`,
      [userProfile.id]
    );
    if (recentCheckin.rows.length > 0) {
      const timeStr = new Date(recentCheckin.rows[0].thoi_diem).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return res.status(400).json({ 
        success: false, 
        error: `Thành viên này đã check-in lúc ${timeStr}. Vui lòng đợi thêm 5 phút.` 
      });
    }

    // Xác định loại lượt ra vào: Tự động đảo chiều (vào -> ra -> vào) dựa trên lượt quét cuối cùng trong ngày hôm nay
    const lastScanRes = await pool.query(
      `SELECT loai FROM luot_vao_ra 
       WHERE ho_so_id = $1 
         AND thoi_diem::date = CURRENT_DATE
       ORDER BY thoi_diem DESC LIMIT 1`,
      [userProfile.id]
    );

    let nextLoai = 'vao'; // Mặc định là vào
    if (lastScanRes.rows.length > 0) {
      const lastLoai = lastScanRes.rows[0].loai;
      nextLoai = (lastLoai === 'vao') ? 'ra' : 'vao';
    }

    // Tiến hành ghi nhận vào/ra
    const insertQuery = `
      INSERT INTO luot_vao_ra (ho_so_id, loai, phuong_thuc, chi_nhanh_thuc_hien)
      VALUES ($1, $2, 'qr_code', $3)
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [userProfile.id, nextLoai, current_branch || 'Trung tam chính']);

    const actionText = nextLoai === 'vao' ? 'check-in (đi vào)' : 'check-out (đi ra)';
    const titleText = nextLoai === 'vao' ? 'Quét mã QR vào' : 'Quét mã QR ra';

    await createNotification(
      'quet_ma_qr',
      titleText,
      `Thành viên "${userProfile.ho_ten}" đã ${actionText} thành công qua QR Code tại chi nhánh.`,
      result.rows[0].id,
      'luot_vao_ra',
      'nhan_vien'
    );

    res.json({
      success: true,
      message: `Ghi nhận ${nextLoai === 'vao' ? 'vào (Check-in)' : 'ra (Check-out)'} thành công!`,
      data: {
        ho_ten: userProfile.ho_ten,
        ma_ho_so: userProfile.ma_ho_so,
        loai_ho_so: userProfile.loai_ho_so,
        loai: nextLoai,
        thoi_diem: result.rows[0].thoi_diem
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/checkin/my-qr: Sinh mã QR JWT bảo mật ngắn hạn (5 phút) cho người dùng đăng nhập
router.get('/checkin/my-qr', async (req, res) => {
  const ho_so_id = req.headers['x-ho-so-id'];
  const user_role = req.headers['x-user-role'];

  if (!ho_so_id) {
    return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng' });
  }

  try {
    // Tìm hồ sơ cá nhân tương ứng
    let hsRes = await pool.query('SELECT id, ma_ho_so, ho_ten, loai_ho_so FROM ho_so WHERE id = $1 AND is_deleted = 0', [ho_so_id]);
    
    let userProfile;
    if (hsRes.rows.length === 0) {
      // Nếu không tìm thấy hồ sơ (tài khoản test chưa tạo hồ sơ), sinh thông tin giả lập tạm thời
      userProfile = {
        id: ho_so_id,
        ma_ho_so: 'TEMP_' + ho_so_id,
        ho_ten: 'Người dùng thử nghiệm #' + ho_so_id,
        loai_ho_so: user_role || 'hoc_vien'
      };
    } else {
      userProfile = hsRes.rows[0];
    }

    // Mã hóa JWT ngắn hạn bằng AES-256-CBC qua crypto
    const crypto = require('crypto');
    const secret = process.env.JWT_SECRET || 'stellar_academy_qr_secret_key_change_in_production';
    
    // Đọc TTL từ cấu hình, mặc định 5 phút
    const ttlMinutes = 5; 
    const expiresAt = Date.now() + ttlMinutes * 60 * 1000;
    
    const payload = {
      ho_so_id: userProfile.id,
      expiresAt
    };

    const data = JSON.stringify(payload);
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(secret, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const token = iv.toString('hex') + ':' + encrypted;

    res.json({
      success: true,
      data: {
        qr_token: token,
        expires_at: expiresAt,
        ttl_seconds: ttlMinutes * 60
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/checkin/scan: Lễ tân quét QR check-in & tự động điểm danh ca học
router.post('/checkin/scan', async (req, res) => {
  const { qr_token, current_branch } = req.body;

  if (!qr_token) {
    return res.status(400).json({ success: false, error: 'Thiếu mã QR check-in' });
  }

  try {
    // 1. Giải mã token bằng crypto hoặc Base64 thô
    const crypto = require('crypto');
    const secret = process.env.JWT_SECRET || 'stellar_academy_qr_secret_key_change_in_production';
    
    let payload;
    let isManualInput = false;
    try {
      const parts = qr_token.split(':');
      if (parts.length === 2) {
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        const key = crypto.scryptSync(secret, 'salt', 32);
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        payload = JSON.parse(decrypted);
      } else {
        // Thử giải mã Base64 thô
        const decoded = Buffer.from(qr_token, 'base64').toString('utf8');
        payload = JSON.parse(decoded);
        isManualInput = true;
      }
    } catch (e) {
      return res.status(400).json({ success: false, error: 'Mã QR hoặc Token không hợp lệ' });
    }

    const { ho_so_id, expiresAt, timestamp } = payload;

    // 2. Chống gian lận: Kiểm tra mã QR hoặc Token hết hạn
    const expirationTime = expiresAt || (parseInt(timestamp) + 60000); // 60s đối với token thủ công
    if (Date.now() > expirationTime) {
      return res.status(401).json({ success: false, error: 'Mã QR hoặc Token đã hết hạn hiệu lực.' });
    }

    // 3. Tìm kiếm hồ sơ
    const hsRes = await pool.query('SELECT * FROM ho_so WHERE id = $1 AND is_deleted = 0', [ho_so_id]);
    let userProfile = hsRes.rows[0];
    
    // Fallback nếu tài khoản test hoặc profile chưa được tạo
    if (!userProfile) {
      userProfile = {
        id: ho_so_id,
        ma_ho_so: 'TEMP_' + ho_so_id,
        ho_ten: 'Người dùng thử nghiệm #' + ho_so_id,
        loai_ho_so: 'hoc_vien'
      };
    }

    // 4. Chống check-in trùng lặp trong vòng 1 phút gần nhất
    const recentCheckin = await pool.query(
      `SELECT * FROM luot_vao_ra 
       WHERE ho_so_id = $1 
         AND thoi_diem > NOW() - INTERVAL '1 minute'
       ORDER BY thoi_diem DESC LIMIT 1`,
      [userProfile.id]
    );
    if (recentCheckin.rows.length > 0) {
      const timeStr = new Date(recentCheckin.rows[0].thoi_diem).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return res.status(400).json({ 
        success: false, 
        error: `Thành viên này đã quét check-in lúc ${timeStr}. Vui lòng đợi thêm 1 phút.` 
      });
    }

    // 5. Kiểm tra gói học đối với Học viên
    if (userProfile.loai_ho_so === 'hoc_vien') {
      // 5.1. Kiểm tra gói đại trà (lớp nhóm)
      const groupPkgRes = await pool.query(
        `SELECT 1 FROM dang_ky_khoa_hoc 
         WHERE ho_so_id = $1 
           AND trang_thai = 'dang_hoat_dong' 
           AND den_ngay >= CURRENT_DATE`,
        [userProfile.id]
      );

      // 5.2. Kiểm tra gói học kèm (1 kèm 1)
      const privatePkgRes = await pool.query(
        `SELECT 1 FROM dang_ky_hoc_kem 
         WHERE hoc_vien_id = $1 
           AND trang_thai = 'dang_hoat_dong' 
           AND (den_ngay IS NULL OR den_ngay >= CURRENT_DATE) 
           AND so_buoi_da_hoc < so_buoi_dang_ky`,
        [userProfile.id]
      );

      if (groupPkgRes.rows.length === 0 && privatePkgRes.rows.length === 0) {
        return res.status(403).json({ 
          success: false, 
          error: 'Chặn check-in: Học viên hiện không có gói học nào đang hoạt động hoặc gói học đã hết hạn / hết buổi.' 
        });
      }
    }

    // 6. Xác định loại lượt ra vào: Tự động đảo chiều (vào -> ra -> vào) dựa trên lượt quét cuối trong ngày
    const lastScanRes = await pool.query(
      `SELECT loai FROM luot_vao_ra 
       WHERE ho_so_id = $1 
         AND thoi_diem::date = CURRENT_DATE
       ORDER BY thoi_diem DESC LIMIT 1`,
      [userProfile.id]
    );

    let nextLoai = 'vao';
    if (lastScanRes.rows.length > 0) {
      const lastLoai = lastScanRes.rows[0].loai;
      nextLoai = (lastLoai === 'vao') ? 'ra' : 'vao';
    }

    // 7. Ghi nhận lượt ra vào
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const insertQuery = `
        INSERT INTO luot_vao_ra (ho_so_id, loai, phuong_thuc, chi_nhanh_thuc_hien)
        VALUES ($1, $2, 'qr_code', $3)
        RETURNING *
      `;
      const insertRes = await client.query(insertQuery, [userProfile.id, nextLoai, current_branch || 'Trung tâm chính']);
      const logId = insertRes.rows[0].id;

      let attendanceCount = 0;
      let scheduledLessons = [];

      // 8. Tự động điểm danh nếu là lượt "Vào" của Học viên
      if (userProfile.loai_ho_so === 'hoc_vien' && nextLoai === 'vao') {
        // Tìm các ca học trong ngày của học viên có trang_thai = 'cho_hoc'
        const lessonsRes = await client.query(
          `SELECT id, dang_ky_hoc_kem_id, ngay_hoc::text, gio_bat_dau 
           FROM lich_hoc 
           WHERE hoc_vien_id = $1 
             AND ngay_hoc = CURRENT_DATE 
             AND trang_thai = 'cho_hoc'`,
          [userProfile.id]
        );
        scheduledLessons = lessonsRes.rows;

        // Tiến hành điểm danh và cập nhật số buổi học kèm (nếu có)
        for (const lesson of scheduledLessons) {
          // Cập nhật trạng thái buổi học
          await client.query(
            `UPDATE lich_hoc 
             SET da_checkin = 1, trang_thai = 'da_hoc', pt_xac_nhan = 1, hv_xac_nhan = 1, ngay_xac_nhan = NOW() 
             WHERE id = $1`,
            [lesson.id]
          );
          attendanceCount++;

          // Nếu là học kèm 1 kèm 1, tăng số buổi đã dạy của hợp đồng
          if (lesson.dang_ky_hoc_kem_id) {
            await client.query(
              `UPDATE dang_ky_hoc_kem 
               SET so_buoi_da_hoc = so_buoi_da_hoc + 1 
               WHERE id = $1`,
              [lesson.dang_ky_hoc_kem_id]
            );
          }
        }
      }

      await client.query('COMMIT');

      // Gửi notification hệ thống
      const actionText = nextLoai === 'vao' ? 'check-in (đi vào)' : 'check-out (đi ra)';
      const titleText = nextLoai === 'vao' ? 'Quét QR điểm danh vào' : 'Quét QR điểm danh ra';
      const autoConfirmText = attendanceCount > 0 ? ` (Tự động điểm danh thành công ${attendanceCount} ca học hôm nay)` : '';

      await createNotification(
        'quet_ma_qr',
        titleText,
        `Thành viên "${userProfile.ho_ten}" đã ${actionText} thành công qua QR Code.${autoConfirmText}`,
        logId,
        'luot_vao_ra',
        'nhan_vien'
      );

      res.json({
        success: true,
        message: `Ghi nhận ${nextLoai === 'vao' ? 'vào (Check-in)' : 'ra (Check-out)'} thành công!${autoConfirmText}`,
        data: {
          ho_ten: userProfile.ho_ten,
          ma_ho_so: userProfile.ma_ho_so,
          loai_ho_so: userProfile.loai_ho_so,
          loai: nextLoai,
          thoi_diem: insertRes.rows[0].thoi_diem,
          attendance_count: attendanceCount
        }
      });

    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }

  } catch (err) {
    console.error('Lỗi scan check-in:', err);
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
router.delete('/course-packages/:id', verifyAccess(['admin', 'le_tan']), async (req, res) => {
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
    const isTheoBuoi = loai_goi === 'theo_buoi';
    const finalSoThang = isTheoBuoi ? null : (so_thang ? parseInt(so_thang) : null);
    const result = await pool.query(
      'INSERT INTO goi_hoc_kem (ten_goi, mo_ta, loai_goi, so_buoi, so_thang, gia, is_deleted) VALUES ($1, $2, $3, $4, $5, $6, 0) RETURNING *',
      [ten_goi, mo_ta, loai_goi || 'theo_buoi', parseInt(so_buoi), finalSoThang, parseFloat(gia)]
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
    const isTheoBuoi = loai_goi === 'theo_buoi';
    const finalSoThang = isTheoBuoi ? null : (so_thang ? parseInt(so_thang) : null);
    const result = await pool.query(
      'UPDATE goi_hoc_kem SET ten_goi = $1, mo_ta = $2, loai_goi = $3, so_buoi = $4, so_thang = $5, gia = $6 WHERE id = $7 AND is_deleted = 0 RETURNING *',
      [ten_goi, mo_ta, loai_goi || 'theo_buoi', parseInt(so_buoi), finalSoThang, parseFloat(gia), id]
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
router.delete('/tutoring-packages/:id', verifyAccess(['admin', 'le_tan']), async (req, res) => {
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
             lhn.ngay_hoc::text, lhn.gio_bat_dau, lhn.gio_ket_thuc, lhn.trang_thai as trang_thai_lich, lhn.id as lich_hoc_nhom_id,
             (SELECT MIN(ngay_hoc)::text FROM lich_hoc_nhom WHERE lop_hoc_id = l.id AND trang_thai != 'da_huy') as tu_ngay,
             (SELECT MAX(ngay_hoc)::text FROM lich_hoc_nhom WHERE lop_hoc_id = l.id AND trang_thai != 'da_huy') as den_ngay
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

// POST /api/classes: Tạo lớp học nhóm mới, thêm học viên và xếp lịch học (Hỗ trợ xếp lịch hàng loạt)
router.post('/classes', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { ten_lop, giao_vien_id, goi_hoc_phi_id, hoc_vien_ids, ngay_hoc, gio_bat_dau, gio_ket_thuc, ngay_hoc_list } = req.body;

  const datesToSchedule = (ngay_hoc_list && Array.isArray(ngay_hoc_list) && ngay_hoc_list.length > 0) 
    ? ngay_hoc_list 
    : [ngay_hoc];

  if (!ten_lop || !giao_vien_id || datesToSchedule.some(d => !d) || !gio_bat_dau || !gio_ket_thuc) {
    return res.status(400).json({ success: false, error: 'Thiếu thông tin bắt buộc để mở lớp và xếp lịch' });
  }

  // Chặn ngày quá khứ
  const today = new Date().toISOString().split('T')[0];
  for (const d of datesToSchedule) {
    if (d < today) {
      return res.status(400).json({ success: false, error: `Không thể xếp lịch lớp học vào ngày trong quá khứ (${d.split('-').reverse().join('/')})` });
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Kiểm tra giáo viên trùng lịch ở cả lich_hoc (1-1) và lich_hoc_nhom cho tất cả các ngày
    for (const d of datesToSchedule) {
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

      const gvOverlap1 = await client.query(checkGvOverlap1, [giao_vien_id, d, gio_bat_dau, gio_ket_thuc]);
      const gvOverlap2 = await client.query(checkGvOverlap2, [giao_vien_id, d, gio_bat_dau, gio_ket_thuc]);

      if (gvOverlap1.rows.length > 0 || gvOverlap2.rows.length > 0) {
        throw new Error(`Giáo viên đã trùng lịch giảng dạy ngày ${d.split('-').reverse().join('/')} vào khung giờ ${gio_bat_dau.slice(0,5)}-${gio_ket_thuc.slice(0,5)}!`);
      }

      // 2. Kiểm tra từng học viên xem có bị trùng lịch học ca khác (1 kèm 1 hoặc nhóm khác) không
      if (hoc_vien_ids && Array.isArray(hoc_vien_ids)) {
        const uniqueHvs = [...new Set(hoc_vien_ids)].slice(0, 50);
        for (const hvId of uniqueHvs) {
          const studentInfoRes = await client.query('SELECT ho_ten FROM ho_so WHERE id = $1', [hvId]);
          const tenHv = studentInfoRes.rows.length > 0 ? studentInfoRes.rows[0].ho_ten : `Học viên ID ${hvId}`;

          const checkHvOverlap1 = `
            SELECT id FROM lich_hoc
            WHERE hoc_vien_id = $1
              AND ngay_hoc = $2
              AND trang_thai != 'da_huy'
              AND NOT (gio_ket_thuc <= $3 OR gio_bat_dau >= $4)
          `;
          const hvOverlap1 = await client.query(checkHvOverlap1, [hvId, d, gio_bat_dau, gio_ket_thuc]);

          const checkHvOverlap2 = `
            SELECT lhn.id FROM lich_hoc_nhom lhn
            JOIN lop_hoc_hoc_vien lhv ON lhn.lop_hoc_id = lhv.lop_hoc_id
            WHERE lhv.hoc_vien_id = $1
              AND lhn.ngay_hoc = $2
              AND lhn.trang_thai != 'da_huy'
              AND NOT (lhn.gio_ket_thuc <= $3 OR lhn.gio_bat_dau >= $4)
          `;
          const hvOverlap2 = await client.query(checkHvOverlap2, [hvId, d, gio_bat_dau, gio_ket_thuc]);

          if (hvOverlap1.rows.length > 0 || hvOverlap2.rows.length > 0) {
            throw new Error(`Học viên "${tenHv}" đã có lịch học trùng ca khác ngày ${d.split('-').reverse().join('/')} vào khung giờ ${gio_bat_dau.slice(0,5)}-${gio_ket_thuc.slice(0,5)}!`);
          }
        }
      }
    }

    // 3. Tạo một lớp học nhóm duy nhất
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

    // 5. Xếp lịch học hàng loạt cho lớp học nhóm
    const schedulesCreated = [];
    for (const d of datesToSchedule) {
      const schedRes = await client.query(
        `INSERT INTO lich_hoc_nhom (lop_hoc_id, giao_vien_id, ngay_hoc, gio_bat_dau, gio_ket_thuc, trang_thai)
         VALUES ($1, $2, $3, $4, $5, 'cho_hoc') RETURNING *`,
        [lopHoc.id, giao_vien_id, d, gio_bat_dau, gio_ket_thuc]
      );
      schedulesCreated.push(schedRes.rows[0]);
    }

    await client.query('COMMIT');
    await createNotification(
      'them_lop_hoc',
      'Mở lớp học nhóm mới',
      `Lớp học nhóm "${ten_lop}" đã được mở và xếp ${datesToSchedule.length} ca học thành công.`,
      lopHoc.id,
      'lop_hoc',
      'nhan_vien'
    );
    res.status(201).json({ success: true, data: { class: lopHoc, schedules: schedulesCreated } });
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
    let finalTenLop = ten_lop || oldClass.ten_lop;
    if (newGvId !== oldClass.giao_vien_id && (!ten_lop || ten_lop.startsWith('Lớp nhóm - GV'))) {
      const gvNameRes = await client.query('SELECT ho_ten FROM ho_so WHERE id = $1', [newGvId]);
      if (gvNameRes.rows.length > 0) {
        finalTenLop = `Lớp nhóm - GV ${gvNameRes.rows[0].ho_ten}`;
      }
    }

    await client.query(
      `UPDATE lop_hoc 
       SET ten_lop = $1, giao_vien_id = $2, goi_hoc_phi_id = $3
       WHERE id = $4`,
      [finalTenLop, newGvId, goi_hoc_phi_id !== undefined ? goi_hoc_phi_id : oldClass.goi_hoc_phi_id, id]
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

    // Cập nhật ngày học và giờ cho các ca chưa học của lớp nhóm
    if (gio_bat_dau || gio_ket_thuc) {
      const updatedStart = gio_bat_dau;
      const updatedEnd = gio_ket_thuc;

      const schedCheck = await client.query(
        "SELECT id, ngay_hoc::text FROM lich_hoc_nhom WHERE lop_hoc_id = $1 AND trang_thai = 'cho_hoc'", 
        [id]
      );
      
      if (schedCheck.rows.length > 0) {
        // 1. Kiểm tra giáo viên trùng lịch cho từng ca chưa học
        for (const s of schedCheck.rows) {
          const d = s.ngay_hoc;
          
          if (newGvId) {
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

            const overlapRes1 = await client.query(checkOverlap1, [newGvId, d, updatedStart, updatedEnd]);
            const overlapRes2 = await client.query(checkOverlap2, [newGvId, d, s.id, updatedStart, updatedEnd]);

            if (overlapRes1.rows.length > 0 || overlapRes2.rows.length > 0) {
              throw new Error(`Giáo viên giảng dạy đã bị trùng lịch vào ngày ${d.split('-').reverse().join('/')} khung giờ ${updatedStart}-${updatedEnd}!`);
            }
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
            const hvOverlap1 = await client.query(checkHvOverlap1, [hvId, d, updatedStart, updatedEnd]);

            const checkHvOverlap2 = `
              SELECT lhn.id FROM lich_hoc_nhom lhn
              JOIN lop_hoc_hoc_vien lhv ON lhn.lop_hoc_id = lhv.lop_hoc_id
              WHERE lhv.hoc_vien_id = $1
                AND lhn.ngay_hoc = $2
                AND lhn.id != $3
                AND lhn.trang_thai != 'da_huy'
                AND NOT (lhn.gio_ket_thuc <= $4 OR lhn.gio_bat_dau >= $5)
            `;
            const hvOverlap2 = await client.query(checkHvOverlap2, [hvId, d, s.id, updatedStart, updatedEnd]);

            if (hvOverlap1.rows.length > 0 || hvOverlap2.rows.length > 0) {
              throw new Error(`Học viên "${tenHv}" đã bị trùng lịch học ca khác ngày ${d.split('-').reverse().join('/')} khung giờ ${updatedStart}-${updatedEnd}!`);
            }
          }
        }

        // 3. Thực hiện cập nhật toàn bộ ca chưa dạy
        for (const s of schedCheck.rows) {
          await client.query(
            `UPDATE lich_hoc_nhom
             SET gio_bat_dau = $1, gio_ket_thuc = $2, giao_vien_id = $3
             WHERE id = $4`,
            [updatedStart, updatedEnd, newGvId, s.id]
          );
        }
      }
    } else if (newGvId) {
      // Chỉ đổi giáo viên, không đổi giờ
      await client.query(
        "UPDATE lich_hoc_nhom SET giao_vien_id = $1 WHERE lop_hoc_id = $2 AND trang_thai = 'cho_hoc'",
        [newGvId, id]
      );
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

// API GET /classes/schedules: Lấy danh sách toàn bộ ca học của các lớp học nhóm
router.get('/classes/schedules', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT lhn.id, lhn.lop_hoc_id, lhn.giao_vien_id, lhn.ngay_hoc::text, lhn.gio_bat_dau, lhn.gio_ket_thuc, lhn.trang_thai,
             lh.ten_lop, hs.ho_ten as ten_giao_vien, 'nhom' as loai_buoi
      FROM lich_hoc_nhom lhn
      JOIN lop_hoc lh ON lhn.lop_hoc_id = lh.id
      LEFT JOIN ho_so hs ON lhn.giao_vien_id = hs.id
      WHERE lh.is_deleted = 0 AND lhn.trang_thai != 'da_huy'
      ORDER BY lhn.ngay_hoc ASC, lhn.gio_bat_dau ASC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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
// PHÂN HỆ QUẢN LÝ TÀI KHOẢN (Admin)
// ============================================================

// GET /api/accounts: Lấy danh sách tài khoản
router.get('/accounts', verifyAccess(['admin']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT tk.id, tk.ten_dang_nhap,
             CASE WHEN tk.trang_thai = 'hoat_dong' THEN 1 ELSE 0 END as is_active,
             tk.trang_thai,
             tk.lan_dang_nhap_cuoi, tk.ngay_tao,
             vt.ma_vai_tro as vai_tro,
             hs.ho_ten, hs.ma_ho_so, hs.email, hs.loai_ho_so
      FROM tai_khoan tk
      JOIN vai_tro vt ON tk.vai_tro_id = vt.id
      LEFT JOIN ho_so hs ON tk.ho_so_id = hs.id
      WHERE (tk.is_deleted = 0 OR tk.is_deleted IS NULL)
      ORDER BY tk.ngay_tao DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/accounts: Tạo tài khoản mới cho học viên hoặc giáo viên
router.post('/accounts', verifyAccess(['admin']), async (req, res) => {
  const bcrypt = require('bcryptjs');
  const { ten_dang_nhap, mat_khau, vai_tro, ho_so_id } = req.body;
  if (!ten_dang_nhap || !mat_khau || !vai_tro) {
    return res.status(400).json({ success: false, error: 'Thiếu thông tin bắt buộc' });
  }
  if (mat_khau.length < 6) {
    return res.status(400).json({ success: false, error: 'Mật khẩu phải có ít nhất 6 ký tự' });
  }
  try {
    const dup = await pool.query('SELECT id FROM tai_khoan WHERE ten_dang_nhap = $1 AND (is_deleted = 0 OR is_deleted IS NULL)', [ten_dang_nhap]);
    if (dup.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Tên đăng nhập đã tồn tại' });
    }
    const vrRes = await pool.query('SELECT id FROM vai_tro WHERE ma_vai_tro = $1', [vai_tro]);
    if (vrRes.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Vai trò không hợp lệ' });
    }
    const vai_tro_id = vrRes.rows[0].id;
    const mat_khau_hash = bcrypt.hashSync(mat_khau, 12);
    const result = await pool.query(
      'INSERT INTO tai_khoan (ten_dang_nhap, mat_khau_hash, vai_tro_id, ho_so_id, trang_thai) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [ten_dang_nhap, mat_khau_hash, vai_tro_id, ho_so_id || null, 'hoat_dong']
    );
    await createNotification('tao_tai_khoan','Tạo tài khoản mới',
      `Tài khoản "${ten_dang_nhap}" (${vai_tro}) đã được tạo thành công.`,
      result.rows[0].id, 'tai_khoan', 'nhan_vien');
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/accounts/:id/toggle: Kích hoạt / Khóa tài khoản
router.put('/accounts/:id/toggle', verifyAccess(['admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const cur = await pool.query('SELECT trang_thai, ten_dang_nhap FROM tai_khoan WHERE id = $1 AND (is_deleted = 0 OR is_deleted IS NULL)', [id]);
    if (cur.rows.length === 0) return res.status(404).json({ success: false, error: 'Không tìm thấy tài khoản' });
    const isActive = cur.rows[0].trang_thai === 'hoat_dong';
    const newTrangThai = isActive ? 'bi_khoa' : 'hoat_dong';
    await pool.query('UPDATE tai_khoan SET trang_thai = $1 WHERE id = $2', [newTrangThai, id]);
    res.json({ success: true, is_active: !isActive, trang_thai: newTrangThai });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/accounts/:id/reset-password: Admin đặt lại mật khẩu
router.put('/accounts/:id/reset-password', verifyAccess(['admin']), async (req, res) => {
  const bcrypt = require('bcryptjs');
  const { id } = req.params;
  const { mat_khau_moi } = req.body;
  if (!mat_khau_moi || mat_khau_moi.length < 6) {
    return res.status(400).json({ success: false, error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
  }
  try {
    const mat_khau_hash = bcrypt.hashSync(mat_khau_moi, 12);
    await pool.query('UPDATE tai_khoan SET mat_khau_hash = $1 WHERE id = $2 AND (is_deleted = 0 OR is_deleted IS NULL)', [mat_khau_hash, id]);
    res.json({ success: true, message: 'Đặt lại mật khẩu thành công' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/accounts/:id: Xóa mềm tài khoản
router.delete('/accounts/:id', verifyAccess(['admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const cur = await pool.query('SELECT ten_dang_nhap FROM tai_khoan WHERE id = $1', [id]);
    if (cur.rows.length === 0) return res.status(404).json({ success: false, error: 'Không tìm thấy tài khoản' });
    await pool.query('UPDATE tai_khoan SET is_deleted = 1, trang_thai = $1 WHERE id = $2', ['bi_khoa', id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/accounts/teachers-without-account: GV chưa có tài khoản
router.get('/accounts/available-profiles', verifyAccess(['admin']), async (req, res) => {
  const { loai } = req.query; // 'hoc_vien' | 'giao_vien'
  try {
    const result = await pool.query(`
      SELECT hs.id, hs.ho_ten, hs.ma_ho_so, hs.email, hs.loai_ho_so
      FROM ho_so hs
      WHERE hs.is_deleted = 0
        AND ($1::text IS NULL OR hs.loai_ho_so = $1)
        AND hs.id NOT IN (SELECT ho_so_id FROM tai_khoan WHERE ho_so_id IS NOT NULL AND is_deleted = 0)
      ORDER BY hs.ho_ten ASC
    `, [loai || null]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/teachers/:id: Lấy chi tiết một giáo viên
router.get('/teachers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM ho_so WHERE id = $1 AND loai_ho_so = 'giao_vien' AND is_deleted = 0", [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Không tìm thấy giáo viên' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/students/:id: Lấy chi tiết một học viên
router.get('/students/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM ho_so WHERE id = $1 AND loai_ho_so = 'hoc_vien' AND is_deleted = 0", [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Không tìm thấy học viên' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/rules: Lấy nội quy
router.get('/rules', async (req, res) => {
  const userRole = req.headers['x-user-role'] || 'hoc_vien';
  try {
    let queryStr = "SELECT * FROM noi_quy ORDER BY thu_tu ASC";
    if (userRole !== 'admin' && userRole !== 'le_tan') {
      queryStr = "SELECT * FROM noi_quy WHERE is_active = 1 ORDER BY thu_tu ASC";
    }
    const result = await pool.query(queryStr);
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

// POST /api/checkin-logs: Thêm lượt quét check-in chấm công thủ công (Admin & Lễ tân)
router.post('/checkin-logs', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { ho_so_id, chi_nhanh_thuc_hien, thoi_diem, phuong_thuc } = req.body;

  if (!ho_so_id || !thoi_diem) {
    return res.status(400).json({ success: false, error: 'Thiếu thông tin bắt buộc' });
  }

  try {
    const hsRes = await pool.query('SELECT ho_ten, ma_ho_so FROM ho_so WHERE id = $1', [ho_so_id]);
    if (hsRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ tương ứng' });
    }
    const targetUser = hsRes.rows[0];

    const queryStr = `
      INSERT INTO luot_vao_ra (ho_so_id, thoi_diem, loai, phuong_thuc, chi_nhanh_thuc_hien)
      VALUES ($1, $2, 'vao', $3, $4)
      RETURNING *
    `;
    const result = await pool.query(queryStr, [
      ho_so_id, 
      thoi_diem, 
      phuong_thuc || 'van_tay', 
      chi_nhanh_thuc_hien || 'Trung tâm chính'
    ]);

    await createNotification(
      'cham_cong_thu_cong',
      'Chấm công thủ công',
      `Đã ghi nhận lượt chấm công thủ công cho "${targetUser.ho_ten}" vào lúc ${new Date(thoi_diem).toLocaleTimeString('vi-VN')} ngày ${new Date(thoi_diem).toLocaleDateString('vi-VN')}.`,
      result.rows[0].id,
      'luot_vao_ra',
      'nhan_vien'
    );

    res.status(201).json({ success: true, data: result.rows[0] });
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
  const { ho_ten, so_dien_thoai, email, chuc_vu, chi_nhanh, avatar_url, luong_cung_ngay } = req.body;
  try {
    const finalAvatarUrl = avatar_url && avatar_url.startsWith('data:') ? await uploadToCloudinary(avatar_url) : avatar_url;
    const updateQuery = `
      UPDATE ho_so
      SET ho_ten = $1, so_dien_thoai = $2, email = $3, chuc_vu = $4,
          chi_nhanh = $5, avatar_url = COALESCE($6, avatar_url),
          luong_cung_ngay = COALESCE($7, luong_cung_ngay),
          ngay_cap_nhat = CURRENT_TIMESTAMP
      WHERE id = $8 AND loai_ho_so = 'nhan_vien' AND is_deleted = 0
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [
      ho_ten, so_dien_thoai, email, chuc_vu || 'Nhân viên', chi_nhanh || 'Trung tam chính', finalAvatarUrl,
      luong_cung_ngay !== undefined ? parseFloat(luong_cung_ngay) : null,
      id
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


// Lấy danh sách lịch dạy hôm nay từ bảng lich_hoc và lich_hoc_nhom (dành cho Giáo viên)
router.get('/schedule/today', async (req, res) => {
  let gvId = req.query.gvId || req.headers['x-ho-so-id'];
  try {
    let queryStr = '';
    const params = [];

    if (gvId) {
      params.push(gvId);
      queryStr = `
        SELECT 
          lh.id, 
          lh.dang_ky_hoc_kem_id, 
          lh.ngay_hoc::text, 
          lh.gio_bat_dau, 
          lh.gio_ket_thuc, 
          'ca_nhan' as loai_buoi, 
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
        WHERE lh.ngay_hoc = CURRENT_DATE AND lh.giao_vien_id = $1

        UNION ALL

        SELECT 
          lhn.id, 
          NULL as dang_ky_hoc_kem_id, 
          lhn.ngay_hoc::text, 
          lhn.gio_bat_dau, 
          lhn.gio_ket_thuc, 
          'nhom' as loai_buoi, 
          lhn.trang_thai, 
          0 as da_checkin, 
          0 as pt_xac_nhan, 
          0 as hv_xac_nhan,
          lh.ten_lop as ten_hoc_vien, 
          NULL as ma_hoc_vien,
          NULL as hoc_vien_id,
          lhn.giao_vien_id
        FROM lich_hoc_nhom lhn
        JOIN lop_hoc lh ON lhn.lop_hoc_id = lh.id
        WHERE lhn.ngay_hoc = CURRENT_DATE AND lhn.giao_vien_id = $1

        ORDER BY gio_bat_dau ASC
      `;
    } else {
      queryStr = `
        SELECT 
          lh.id, 
          lh.dang_ky_hoc_kem_id, 
          lh.ngay_hoc::text, 
          lh.gio_bat_dau, 
          lh.gio_ket_thuc, 
          'ca_nhan' as loai_buoi, 
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

        UNION ALL

        SELECT 
          lhn.id, 
          NULL as dang_ky_hoc_kem_id, 
          lhn.ngay_hoc::text, 
          lhn.gio_bat_dau, 
          lhn.gio_ket_thuc, 
          'nhom' as loai_buoi, 
          lhn.trang_thai, 
          0 as da_checkin, 
          0 as pt_xac_nhan, 
          0 as hv_xac_nhan,
          lh.ten_lop as ten_hoc_vien, 
          NULL as ma_hoc_vien,
          NULL as hoc_vien_id,
          lhn.giao_vien_id
        FROM lich_hoc_nhom lhn
        JOIN lop_hoc lh ON lhn.lop_hoc_id = lh.id
        WHERE lhn.ngay_hoc = CURRENT_DATE

        ORDER BY gio_bat_dau ASC
      `;
    }

    const result = await pool.query(queryStr, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Lỗi API lấy lịch học hôm nay:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// API PUT /api/attendance/:id: Giáo viên / nhân viên điểm danh ca học (hỗ trợ cả lich_hoc và lich_hoc_nhom)
router.put('/attendance/:id', async (req, res) => {
  const { id } = req.params;
  const { trang_thai } = req.body; // 'da_hoc' hoặc 'vang'

  if (!trang_thai || !['da_hoc', 'vang'].includes(trang_thai)) {
    return res.status(400).json({ success: false, error: 'Trạng thái điểm danh không hợp lệ' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Thử tìm trong bảng lich_hoc (Học kèm 1-1)
    const checkTutor = await client.query('SELECT * FROM lich_hoc WHERE id = $1', [id]);
    
    if (checkTutor.rows.length > 0) {
      const lesson = checkTutor.rows[0];
      
      // Update trạng thái ca học kèm
      const updateRes = await client.query(
        `UPDATE lich_hoc 
         SET trang_thai = $1, da_checkin = 1, pt_xac_nhan = 1, hv_xac_nhan = 1, ngay_xac_nhan = NOW() 
         WHERE id = $2 RETURNING *`,
        [trang_thai, id]
      );

      if (lesson.dang_ky_hoc_kem_id && lesson.trang_thai === 'cho_hoc') {
        await client.query(
          'UPDATE dang_ky_hoc_kem SET so_buoi_da_hoc = so_buoi_da_hoc + 1 WHERE id = $1',
          [lesson.dang_ky_hoc_kem_id]
        );
      }

      await client.query('COMMIT');
      return res.json({ success: true, data: updateRes.rows[0], loai: 'ca_nhan' });
    }

    // 2. Nếu không có ở lich_hoc, thử tìm trong bảng lich_hoc_nhom (Lớp học nhóm)
    const checkGroup = await client.query('SELECT * FROM lich_hoc_nhom WHERE id = $1', [id]);
    if (checkGroup.rows.length > 0) {
      const updateRes = await client.query(
        `UPDATE lich_hoc_nhom 
         SET trang_thai = $1 
         WHERE id = $2 RETURNING *`,
        [trang_thai, id]
      );

      await client.query('COMMIT');
      return res.json({ success: true, data: updateRes.rows[0], loai: 'nhom' });
    }

    await client.query('ROLLBACK');
    return res.status(404).json({ success: false, error: 'Không tìm thấy ca học cần điểm danh' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Lỗi khi điểm danh:', err.message);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// API PUT /api/attendance/:id/confirm: Học viên xác nhận đã học xong ca học kèm 1-1
router.put('/attendance/:id/confirm', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE lich_hoc 
       SET hv_xac_nhan = 1, ngay_xac_nhan = NOW() 
       WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      // Nếu là lớp học nhóm, trả về thành công giả lập
      const checkGroup = await pool.query('SELECT id FROM lich_hoc_nhom WHERE id = $1', [id]);
      if (checkGroup.rows.length > 0) {
        return res.json({ success: true, message: 'Xác nhận lớp học nhóm thành công (giả lập)' });
      }
      return res.status(404).json({ success: false, error: 'Không tìm thấy ca học cần xác nhận' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Lỗi khi học viên xác nhận ca học:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Lấy tất cả danh sách lịch học (dành cho trang Thời khóa biểu)
router.get('/schedules', async (req, res) => {
  const { hoc_vien_id, giao_vien_id } = req.query;
  try {
    let condsTutor = ["lh.trang_thai != 'da_huy'"];
    let condsGroup = ["lhn.trang_thai != 'da_huy'"];
    let params = [];

    if (hoc_vien_id) {
      params.push(hoc_vien_id);
      condsTutor.push(`lh.hoc_vien_id = $${params.length}`);
      condsGroup.push(`lhv.hoc_vien_id = $${params.length}`);
    }
    if (giao_vien_id) {
      params.push(giao_vien_id);
      condsTutor.push(`lh.giao_vien_id = $${params.length}`);
      condsGroup.push(`lhn.giao_vien_id = $${params.length}`);
    }

    const whereTutor = `WHERE ${condsTutor.join(' AND ')}`;
    const whereGroup = `WHERE ${condsGroup.join(' AND ')}`;

    const queryStr = `
      -- 1. Lịch dạy/học kèm 1-1
      SELECT 
        lh.id, lh.dang_ky_hoc_kem_id, lh.giao_vien_id, lh.hoc_vien_id, 
        lh.ngay_hoc::text, lh.gio_bat_dau, lh.gio_ket_thuc, lh.loai_buoi, 
        lh.trang_thai, lh.da_checkin, lh.pt_xac_nhan, lh.hv_xac_nhan, 
        lh.ngay_xac_nhan, lh.ghi_chu, lh.ngay_tao, lh.ngay_cap_nhat,
        hs_hv.ho_ten as ten_hoc_vien, 
        hs_gv.ho_ten as ten_giao_vien,
        dk.tu_ngay::text as tu_ngay,
        dk.den_ngay::text as den_ngay
      FROM lich_hoc lh
      JOIN ho_so hs_hv ON lh.hoc_vien_id = hs_hv.id
      LEFT JOIN ho_so hs_gv ON lh.giao_vien_id = hs_gv.id
      LEFT JOIN dang_ky_hoc_kem dk ON lh.dang_ky_hoc_kem_id = dk.id
      ${whereTutor}

      UNION ALL

      -- 2. Lịch dạy/học lớp nhóm
      SELECT 
        lhn.id, NULL as dang_ky_hoc_kem_id, lhn.giao_vien_id, lhv.hoc_vien_id,
        lhn.ngay_hoc::text, lhn.gio_bat_dau, lhn.gio_ket_thuc, 'nhom' as loai_buoi,
        lhn.trang_thai, 0 as da_checkin, 0 as pt_xac_nhan, 0 as hv_xac_nhan,
        NULL as ngay_xac_nhan, NULL as ghi_chu, lhn.ngay_tao, NULL as ngay_cap_nhat,
        hs_hv.ho_ten as ten_hoc_vien,
        hs_gv.ho_ten as ten_giao_vien,
        (SELECT MIN(ngay_hoc)::text FROM lich_hoc_nhom WHERE lop_hoc_id = lhn.lop_hoc_id AND trang_thai != 'da_huy') as tu_ngay,
        (SELECT MAX(ngay_hoc)::text FROM lich_hoc_nhom WHERE lop_hoc_id = lhn.lop_hoc_id AND trang_thai != 'da_huy') as den_ngay
      FROM lich_hoc_nhom lhn
      JOIN lop_hoc lh ON lhn.lop_hoc_id = lh.id
      LEFT JOIN lop_hoc_hoc_vien lhv ON lhn.lop_hoc_id = lhv.lop_hoc_id
      LEFT JOIN ho_so hs_hv ON lhv.hoc_vien_id = hs_hv.id
      LEFT JOIN ho_so hs_gv ON lhn.giao_vien_id = hs_gv.id
      ${whereGroup}

      ORDER BY ngay_hoc DESC, gio_bat_dau ASC
    `;
    
    const result = await pool.query(queryStr, params);
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

// ============================================================
// PHÂN HỆ XÁC THỰC (AUTH)
// ============================================================

// POST /api/auth/login: Đăng nhập bằng tài khoản thật
router.post('/auth/login', async (req, res) => {
  const bcrypt = require('bcryptjs');
  const { ten_dang_nhap, mat_khau } = req.body;
  if (!ten_dang_nhap || !mat_khau) {
    return res.status(400).json({ success: false, error: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu' });
  }

  try {
    const result = await pool.query(
      `SELECT tk.id, tk.ten_dang_nhap, tk.mat_khau_hash, tk.ho_so_id, tk.trang_thai,
              vt.ma_vai_tro as vai_tro,
              hs.ho_ten, hs.email, hs.so_dien_thoai, hs.chi_nhanh, hs.loai_ho_so, hs.ma_ho_so
       FROM tai_khoan tk
       JOIN vai_tro vt ON tk.vai_tro_id = vt.id
       LEFT JOIN ho_so hs ON tk.ho_so_id = hs.id
       WHERE tk.ten_dang_nhap = $1 AND (tk.is_deleted = 0 OR tk.is_deleted IS NULL)`,
      [ten_dang_nhap]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    const user = result.rows[0];

    if (user.trang_thai !== 'hoat_dong') {
      return res.status(403).json({ success: false, error: 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.' });
    }

    // So sánh mật khẩu: hỗ trợ cả bcrypt hash lẫn plain text cũ
    const isMatch = user.mat_khau_hash
      ? (user.mat_khau_hash.startsWith('$2') ? bcrypt.compareSync(mat_khau, user.mat_khau_hash) : user.mat_khau_hash === mat_khau)
      : false;

    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    // Cập nhật lần đăng nhập cuối
    await pool.query('UPDATE tai_khoan SET lan_dang_nhap_cuoi = NOW() WHERE id = $1', [user.id]);

    // Tự động liên kết hồ sơ nếu tài khoản chưa được liên kết (ho_so_id IS NULL)
    if (!user.ho_so_id && (user.vai_tro === 'giao_vien' || user.vai_tro === 'hoc_vien')) {
      const searchPattern = user.ten_dang_nhap.toUpperCase();
      const findProfile = await pool.query(
        `SELECT id, ho_ten, email, so_dien_thoai, chi_nhanh, loai_ho_so, ma_ho_so 
         FROM ho_so 
         WHERE (
           UPPER(ma_ho_so) = $1 
           OR UPPER(ho_ten) = $1 
           OR UPPER(email) = $1 
           OR UPPER(email) LIKE $2
           OR so_dien_thoai = $3
         ) 
         AND loai_ho_so = $4 
         AND is_deleted = 0 
         LIMIT 1`,
        [searchPattern, `%${searchPattern}%`, user.ten_dang_nhap, user.vai_tro]
      );
      if (findProfile.rows.length > 0) {
        const matchedProfile = findProfile.rows[0];
        user.ho_so_id = matchedProfile.id;
        user.ho_ten = matchedProfile.ho_ten;
        user.email = matchedProfile.email;
        user.so_dien_thoai = matchedProfile.so_dien_thoai;
        user.chi_nhanh = matchedProfile.chi_nhanh;
        user.loai_ho_so = matchedProfile.loai_ho_so;
        user.ma_ho_so = matchedProfile.ma_ho_so;

        // Cập nhật lại trong database để hoàn thành liên kết
        await pool.query('UPDATE tai_khoan SET ho_so_id = $1 WHERE id = $2', [matchedProfile.id, user.id]);
      }
    }

    res.json({
      success: true,
      data: {
        tai_khoan_id: user.id,
        ten_dang_nhap: user.ten_dang_nhap,
        vai_tro: user.vai_tro,
        ho_so_id: user.ho_so_id,
        ho_ten: user.ho_ten,
        email: user.email,
        so_dien_thoai: user.so_dien_thoai,
        chi_nhanh: user.chi_nhanh,
        loai_ho_so: user.loai_ho_so,
        ma_ho_so: user.ma_ho_so
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/me: Lấy thông tin người dùng hiện tại theo tai_khoan_id
router.get('/auth/me', async (req, res) => {
  const tai_khoan_id = req.headers['x-tai-khoan-id'];
  if (!tai_khoan_id) {
    return res.status(401).json({ success: false, error: 'Chưa xác thực' });
  }

  try {
    const result = await pool.query(
      `SELECT tk.id, tk.ten_dang_nhap, tk.ho_so_id, tk.trang_thai,
              vt.ma_vai_tro as vai_tro,
              hs.ho_ten, hs.email, hs.so_dien_thoai, hs.chi_nhanh, hs.loai_ho_so, hs.ma_ho_so
       FROM tai_khoan tk
       JOIN vai_tro vt ON tk.vai_tro_id = vt.id
       LEFT JOIN ho_so hs ON tk.ho_so_id = hs.id
       WHERE tk.id = $1 AND (tk.is_deleted = 0 OR tk.is_deleted IS NULL)`,
      [tai_khoan_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy tài khoản' });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      data: {
        tai_khoan_id: user.id,
        ten_dang_nhap: user.ten_dang_nhap,
        vai_tro: user.vai_tro,
        ho_so_id: user.ho_so_id,
        ho_ten: user.ho_ten,
        email: user.email,
        so_dien_thoai: user.so_dien_thoai,
        chi_nhanh: user.chi_nhanh,
        loai_ho_so: user.loai_ho_so,
        ma_ho_so: user.ma_ho_so
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/auth/change-password: Đổi mật khẩu
router.put('/auth/change-password', async (req, res) => {
  const bcrypt = require('bcryptjs');
  const tai_khoan_id = req.headers['x-tai-khoan-id'];
  const { mat_khau_cu, mat_khau_moi } = req.body;

  if (!tai_khoan_id) return res.status(401).json({ success: false, error: 'Chưa xác thực' });
  if (!mat_khau_cu || !mat_khau_moi) return res.status(400).json({ success: false, error: 'Vui lòng nhập đầy đủ mật khẩu' });
  if (mat_khau_moi.length < 6) return res.status(400).json({ success: false, error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });

  try {
    const result = await pool.query('SELECT mat_khau_hash FROM tai_khoan WHERE id = $1 AND (is_deleted = 0 OR is_deleted IS NULL)', [tai_khoan_id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Không tìm thấy tài khoản' });

    const hash = result.rows[0].mat_khau_hash;
    const isMatch = hash?.startsWith('$2') ? bcrypt.compareSync(mat_khau_cu, hash) : hash === mat_khau_cu;
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Mật khẩu hiện tại không đúng' });
    }

    const newHash = bcrypt.hashSync(mat_khau_moi, 12);
    await pool.query('UPDATE tai_khoan SET mat_khau_hash = $1 WHERE id = $2', [newHash, tai_khoan_id]);
    res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// PHÂN HỆ THÔNG BÁO
// ============================================================

// GET /api/notifications: Lấy thông báo theo vai trò người dùng
router.get('/notifications', async (req, res) => {
  const userRole = req.headers['x-user-role'] || 'hoc_vien';
  const ho_so_id = req.headers['x-ho-so-id'];
  const limit = parseInt(req.query.limit) || 20;

  try {
    let query, params;

    if (userRole === 'admin') {
      query = `SELECT * FROM thong_bao ORDER BY ngay_tao DESC LIMIT $1`;
      params = [limit];
    } else if (userRole === 'le_tan') {
      query = `SELECT * FROM thong_bao WHERE danh_cho IN ('nhan_vien', 'tat_ca') ORDER BY ngay_tao DESC LIMIT $1`;
      params = [limit];
    } else if (userRole === 'giao_vien') {
      query = `SELECT * FROM thong_bao WHERE danh_cho IN ('giao_vien', 'tat_ca') ORDER BY ngay_tao DESC LIMIT $1`;
      params = [limit];
    } else {
      // hoc_vien — chỉ thấy thông báo liên quan đến mình
      if (ho_so_id) {
        query = `SELECT * FROM thong_bao WHERE (danh_cho = 'hoc_vien' AND doi_tuong_id = $1) OR danh_cho = 'tat_ca' ORDER BY ngay_tao DESC LIMIT $2`;
        params = [ho_so_id, limit];
      } else {
        query = `SELECT * FROM thong_bao WHERE danh_cho = 'tat_ca' ORDER BY ngay_tao DESC LIMIT $1`;
        params = [limit];
      }
    }

    const result = await pool.query(query, params);
    const unreadCount = result.rows.filter(r => r.da_doc === 0).length;

    res.json({ success: true, data: result.rows, unread_count: unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/notifications/:id/read: Đánh dấu thông báo đã đọc
router.put('/notifications/:id/read', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE thong_bao SET da_doc = 1 WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/notifications/read-all: Đánh dấu tất cả đã đọc
router.put('/notifications/read-all', async (req, res) => {
  const userRole = req.headers['x-user-role'] || 'hoc_vien';
  const ho_so_id = req.headers['x-ho-so-id'];

  try {
    let query, params;
    if (userRole === 'admin') {
      query = `UPDATE thong_bao SET da_doc = 1 WHERE da_doc = 0`;
      params = [];
    } else if (userRole === 'le_tan') {
      query = `UPDATE thong_bao SET da_doc = 1 WHERE danh_cho IN ('nhan_vien', 'tat_ca') AND da_doc = 0`;
      params = [];
    } else if (userRole === 'giao_vien') {
      query = `UPDATE thong_bao SET da_doc = 1 WHERE danh_cho IN ('giao_vien', 'tat_ca') AND da_doc = 0`;
      params = [];
    } else if (ho_so_id) {
      query = `UPDATE thong_bao SET da_doc = 1 WHERE (danh_cho = 'hoc_vien' AND doi_tuong_id = $1) OR danh_cho = 'tat_ca'`;
      params = [ho_so_id];
    } else {
      return res.json({ success: true });
    }
    await pool.query(query, params);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/notifications/:id: Xóa thông báo
router.delete('/notifications/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM thong_bao WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/notifications/all/clear: Xóa toàn bộ thông báo theo vai trò
router.delete('/notifications/all/clear', async (req, res) => {
  const userRole = req.headers['x-user-role'] || 'hoc_vien';
  try {
    if (userRole === 'admin') {
      await pool.query('DELETE FROM thong_bao');
    } else if (userRole === 'le_tan') {
      await pool.query("DELETE FROM thong_bao WHERE danh_cho IN ('nhan_vien', 'tat_ca')");
    } else if (userRole === 'giao_vien') {
      await pool.query("DELETE FROM thong_bao WHERE danh_cho IN ('giao_vien', 'tat_ca')");
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/student-portal/overview: Dữ liệu tổng quan cho Portal Học viên
router.get('/student-portal/overview', async (req, res) => {
  const ho_so_id = req.headers['x-ho-so-id'];
  if (!ho_so_id) {
    return res.status(401).json({ success: false, error: 'Thiếu thông tin xác thực học viên' });
  }

  try {
    // Thông tin gói học phí hiện tại
    const goiHocRes = await pool.query(
      `SELECT dkk.*, ghp.ten_goi, ghp.mo_ta
       FROM dang_ky_khoa_hoc dkk
       JOIN goi_hoc_phi ghp ON dkk.goi_hoc_phi_id = ghp.id
       WHERE dkk.ho_so_id = $1 AND dkk.trang_thai = 'dang_hoat_dong'
       ORDER BY dkk.ngay_tao DESC LIMIT 1`,
      [ho_so_id]
    );

    // Gói học kèm đang hoạt động
    const goiKemRes = await pool.query(
      `SELECT dkhk.*, ghk.ten_goi, ghk.so_buoi
       FROM dang_ky_hoc_kem dkhk
       JOIN goi_hoc_kem ghk ON dkhk.goi_hoc_kem_id = ghk.id
       WHERE dkhk.hoc_vien_id = $1 AND dkhk.trang_thai = 'dang_hoat_dong'
       ORDER BY dkhk.ngay_tao DESC LIMIT 3`,
      [ho_so_id]
    );

    // Lịch học sắp tới (7 ngày tới) (gồm kèm 1-1 và lớp nhóm)
    const lichSapToiRes = await pool.query(
      `SELECT lh.id, lh.giao_vien_id, lh.hoc_vien_id, lh.ngay_hoc::text, lh.gio_bat_dau, lh.gio_ket_thuc, 
              lh.trang_thai, hs.ho_ten as ten_giao_vien, 'ca_nhan' as loai_buoi
       FROM lich_hoc lh
       LEFT JOIN ho_so hs ON lh.giao_vien_id = hs.id
       WHERE lh.hoc_vien_id = $1
         AND lh.ngay_hoc >= CURRENT_DATE
         AND lh.ngay_hoc <= CURRENT_DATE + INTERVAL '7 days'
         AND lh.trang_thai = 'cho_hoc'

       UNION ALL

       SELECT lhn.id, lhn.giao_vien_id, lhv.hoc_vien_id, lhn.ngay_hoc::text, lhn.gio_bat_dau, lhn.gio_ket_thuc,
              lhn.trang_thai, hs.ho_ten as ten_giao_vien, 'nhom' as loai_buoi
       FROM lich_hoc_nhom lhn
       JOIN lop_hoc_hoc_vien lhv ON lhn.lop_hoc_id = lhv.lop_hoc_id
       LEFT JOIN ho_so hs ON lhn.giao_vien_id = hs.id
       WHERE lhv.hoc_vien_id = $1
         AND lhn.ngay_hoc >= CURRENT_DATE
         AND lhn.ngay_hoc <= CURRENT_DATE + INTERVAL '7 days'
         AND lhn.trang_thai = 'cho_hoc'

       ORDER BY ngay_hoc ASC, gio_bat_dau ASC
       LIMIT 5`,
      [ho_so_id]
    );

    // Buổi học gần nhất đã học (gồm kèm 1-1 và lớp nhóm)
    const lichDaHocRes = await pool.query(
      `SELECT lh.id, lh.giao_vien_id, lh.hoc_vien_id, lh.ngay_hoc::text, lh.gio_bat_dau, lh.gio_ket_thuc,
              lh.trang_thai, hs.ho_ten as ten_giao_vien, 'ca_nhan' as loai_buoi
       FROM lich_hoc lh
       LEFT JOIN ho_so hs ON lh.giao_vien_id = hs.id
       WHERE lh.hoc_vien_id = $1 AND lh.trang_thai = 'da_hoc'

       UNION ALL

       SELECT lhn.id, lhn.giao_vien_id, lhv.hoc_vien_id, lhn.ngay_hoc::text, lhn.gio_bat_dau, lhn.gio_ket_thuc,
              lhn.trang_thai, hs.ho_ten as ten_giao_vien, 'nhom' as loai_buoi
       FROM lich_hoc_nhom lhn
       JOIN lop_hoc_hoc_vien lhv ON lhn.lop_hoc_id = lhv.lop_hoc_id
       LEFT JOIN ho_so hs ON lhn.giao_vien_id = hs.id
       WHERE lhv.hoc_vien_id = $1 AND lhn.trang_thai = 'da_hoc'

       ORDER BY ngay_hoc DESC
       LIMIT 3`,
      [ho_so_id]
    );

    // Trạng thái hội viên
    const trangThaiRes = await pool.query(
      `SELECT * FROM v_trang_thai_hoi_vien WHERE id = $1`,
      [ho_so_id]
    );

    res.json({
      success: true,
      data: {
        goi_hoc_phi: goiHocRes.rows[0] || null,
        goi_hoc_kem: goiKemRes.rows,
        lich_sap_toi: lichSapToiRes.rows,
        lich_da_hoc: lichDaHocRes.rows,
        trang_thai: trangThaiRes.rows[0] || null
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/teacher-portal/overview: Dữ liệu tổng quan cho Portal Giáo viên
router.get('/teacher-portal/overview', async (req, res) => {
  let ho_so_id = req.headers['x-ho-so-id'];
  const userRole = req.headers['x-user-role'] || 'giao_vien';

  if (!ho_so_id && (userRole === 'admin' || userRole === 'le_tan')) {
    try {
      const fallbackRes = await pool.query(
        "SELECT id FROM ho_so WHERE loai_ho_so = 'giao_vien' AND is_deleted = 0 ORDER BY id ASC LIMIT 1"
      );
      if (fallbackRes.rows.length > 0) {
        ho_so_id = fallbackRes.rows[0].id;
      }
    } catch (err) {
      console.error('Lỗi lấy hồ sơ giáo viên fallback:', err);
    }
  }

  if (!ho_so_id) {
    return res.status(401).json({ success: false, error: 'Thiếu thông tin xác thực giáo viên' });
  }

  try {
    // Lịch dạy hôm nay (gồm kèm 1-1 và lớp nhóm)
    const homNayRes = await pool.query(
      `SELECT lh.id, lh.dang_ky_hoc_kem_id, lh.ngay_hoc::text, lh.gio_bat_dau, lh.gio_ket_thuc, 
              'ca_nhan' as loai_buoi, lh.trang_thai, lh.da_checkin, lh.pt_xac_nhan, lh.hv_xac_nhan,
              hs.ho_ten as ten_hoc_vien, hs.so_dien_thoai as sdt_hoc_vien, lh.giao_vien_id
       FROM lich_hoc lh
       LEFT JOIN ho_so hs ON lh.hoc_vien_id = hs.id
       WHERE lh.giao_vien_id = $1 AND lh.ngay_hoc = CURRENT_DATE

       UNION ALL

       SELECT lhn.id, NULL as dang_ky_hoc_kem_id, lhn.ngay_hoc::text, lhn.gio_bat_dau, lhn.gio_ket_thuc,
              'nhom' as loai_buoi, lhn.trang_thai, 0 as da_checkin, 0 as pt_xac_nhan, 0 as hv_xac_nhan,
              lh.ten_lop as ten_hoc_vien, NULL as sdt_hoc_vien, lhn.giao_vien_id
       FROM lich_hoc_nhom lhn
       JOIN lop_hoc lh ON lhn.lop_hoc_id = lh.id
       WHERE lhn.giao_vien_id = $1 AND lhn.ngay_hoc = CURRENT_DATE

       ORDER BY gio_bat_dau ASC`,
      [ho_so_id]
    );

    // Lịch dạy tuần này (gồm kèm 1-1 và lớp nhóm)
    const tuanNayRes = await pool.query(
      `SELECT lh.id, lh.dang_ky_hoc_kem_id, lh.ngay_hoc::text, lh.gio_bat_dau, lh.gio_ket_thuc,
              'ca_nhan' as loai_buoi, lh.trang_thai, hs.ho_ten as ten_hoc_vien, lh.giao_vien_id
       FROM lich_hoc lh
       LEFT JOIN ho_so hs ON lh.hoc_vien_id = hs.id
       WHERE lh.giao_vien_id = $1
         AND lh.ngay_hoc >= DATE_TRUNC('week', CURRENT_DATE)
         AND lh.ngay_hoc < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'

       UNION ALL

       SELECT lhn.id, NULL as dang_ky_hoc_kem_id, lhn.ngay_hoc::text, lhn.gio_bat_dau, lhn.gio_ket_thuc,
              'nhom' as loai_buoi, lhn.trang_thai, lh.ten_lop as ten_hoc_vien, lhn.giao_vien_id
       FROM lich_hoc_nhom lhn
       JOIN lop_hoc lh ON lhn.lop_hoc_id = lh.id
       WHERE lhn.giao_vien_id = $1
         AND lhn.ngay_hoc >= DATE_TRUNC('week', CURRENT_DATE)
         AND lhn.ngay_hoc < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'

       ORDER BY ngay_hoc ASC, gio_bat_dau ASC`,
      [ho_so_id]
    );

    // Thống kê tháng này (cộng gộp từ cả 2 bảng)
    const thongKeRes = await pool.query(
      `WITH all_sessions AS (
         SELECT trang_thai, ngay_hoc, giao_vien_id FROM lich_hoc
         UNION ALL
         SELECT trang_thai, ngay_hoc, giao_vien_id FROM lich_hoc_nhom
       )
       SELECT
         COUNT(*) FILTER (WHERE trang_thai = 'da_hoc') as tong_buoi_da_day,
         COUNT(*) FILTER (WHERE trang_thai = 'vang') as tong_buoi_hoc_vien_vang,
         COUNT(*) FILTER (WHERE trang_thai = 'cho_hoc' AND ngay_hoc >= CURRENT_DATE) as buoi_sap_toi
       FROM all_sessions
       WHERE giao_vien_id = $1
         AND ngay_hoc >= DATE_TRUNC('month', CURRENT_DATE)`,
      [ho_so_id]
    );

    // Điểm đánh giá trung bình
    const danhGiaRes = await pool.query(
      `SELECT AVG(so_sao)::numeric(3,1) as trung_binh_sao, COUNT(*) as tong_danh_gia
       FROM danh_gia_giao_vien
       WHERE giao_vien_id = $1`,
      [ho_so_id]
    );

    res.json({
      success: true,
      data: {
        lich_hom_nay: homNayRes.rows,
        lich_tuan_nay: tuanNayRes.rows,
        thong_ke: thongKeRes.rows[0],
        danh_gia: danhGiaRes.rows[0]
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// PHÂN HỆ TÍNH NĂNG PORTAL MỚI
// ============================================================

// POST /api/ratings: Học viên đánh giá giáo viên sau buổi học
router.post('/ratings', async (req, res) => {
  const ho_so_id = req.headers['x-ho-so-id'];
  const { giao_vien_id, lich_hoc_id, so_sao, nhan_xet } = req.body;
  if (!ho_so_id || !giao_vien_id || !so_sao) {
    return res.status(400).json({ success: false, error: 'Thiếu thông tin đánh giá' });
  }
  if (so_sao < 1 || so_sao > 5) {
    return res.status(400).json({ success: false, error: 'Số sao phải từ 1 đến 5' });
  }
  try {
    let isGroup = false;
    if (lich_hoc_id) {
      // Tự động phân loại xem lich_hoc_id thuộc ca học kèm hay lớp nhóm
      const checkTutor = await pool.query('SELECT id FROM lich_hoc WHERE id = $1', [lich_hoc_id]);
      if (checkTutor.rows.length === 0) {
        const checkGroup = await pool.query('SELECT id FROM lich_hoc_nhom WHERE id = $1', [lich_hoc_id]);
        if (checkGroup.rows.length > 0) {
          isGroup = true;
        }
      }
    }

    // Kiểm tra đã đánh giá buổi này chưa
    if (lich_hoc_id) {
      const dupQuery = isGroup
        ? 'SELECT id FROM danh_gia_giao_vien WHERE hoc_vien_id = $1 AND lich_hoc_nhom_id = $2'
        : 'SELECT id FROM danh_gia_giao_vien WHERE hoc_vien_id = $1 AND lich_hoc_id = $2';
      
      const dup = await pool.query(dupQuery, [ho_so_id, lich_hoc_id]);
      if (dup.rows.length > 0) {
        return res.status(400).json({ success: false, error: 'Bạn đã đánh giá buổi học này rồi' });
      }
    }

    const insertQuery = isGroup
      ? `INSERT INTO danh_gia_giao_vien (giao_vien_id, hoc_vien_id, lich_hoc_nhom_id, so_sao, nhan_xet)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`
      : `INSERT INTO danh_gia_giao_vien (giao_vien_id, hoc_vien_id, lich_hoc_id, so_sao, nhan_xet)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`;

    const result = await pool.query(
      insertQuery,
      [giao_vien_id, ho_so_id, lich_hoc_id || null, so_sao, nhan_xet || '']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/ratings: Admin xem tất cả đánh giá giáo viên
router.get('/ratings', async (req, res) => {
  const { giao_vien_id } = req.query;
  try {
    let query = `
      SELECT dg.*, hs_gv.ho_ten as ten_giao_vien, hs_hv.ho_ten as ten_hoc_vien, hs_hv.ma_ho_so as ma_hoc_vien
      FROM danh_gia_giao_vien dg
      LEFT JOIN ho_so hs_gv ON dg.giao_vien_id = hs_gv.id
      LEFT JOIN ho_so hs_hv ON dg.hoc_vien_id = hs_hv.id
    `;
    const params = [];
    if (giao_vien_id) { params.push(giao_vien_id); query += ` WHERE dg.giao_vien_id = $1`; }
    query += ' ORDER BY dg.ngay_tao DESC LIMIT 100';
    const result = await pool.query(query, params);
    // Thống kê theo giáo viên
    const statsResult = await pool.query(`
      SELECT giao_vien_id, hs.ho_ten,
             AVG(so_sao)::numeric(3,1) as trung_binh, COUNT(*) as tong
      FROM danh_gia_giao_vien dg
      LEFT JOIN ho_so hs ON dg.giao_vien_id = hs.id
      GROUP BY giao_vien_id, hs.ho_ten ORDER BY trung_binh DESC
    `);
    res.json({ success: true, data: result.rows, stats: statsResult.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/ratings/check/:lich_hoc_id: Kiểm tra HV đã đánh giá buổi học chưa
router.get('/ratings/check/:lich_hoc_id', async (req, res) => {
  const ho_so_id = req.headers['x-ho-so-id'];
  const { lich_hoc_id } = req.params;
  try {
    let isGroup = false;
    if (lich_hoc_id) {
      const checkTutor = await pool.query('SELECT id FROM lich_hoc WHERE id = $1', [lich_hoc_id]);
      if (checkTutor.rows.length === 0) {
        const checkGroup = await pool.query('SELECT id FROM lich_hoc_nhom WHERE id = $1', [lich_hoc_id]);
        if (checkGroup.rows.length > 0) {
          isGroup = true;
        }
      }
    }

    const checkQuery = isGroup
      ? 'SELECT id, so_sao FROM danh_gia_giao_vien WHERE hoc_vien_id = $1 AND lich_hoc_nhom_id = $2'
      : 'SELECT id, so_sao FROM danh_gia_giao_vien WHERE hoc_vien_id = $1 AND lich_hoc_id = $2';

    const result = await pool.query(checkQuery, [ho_so_id, lich_hoc_id]);
    res.json({ success: true, da_danh_gia: result.rows.length > 0, data: result.rows[0] || null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/booking-requests: Học viên đặt lịch học
router.post('/booking-requests', async (req, res) => {
  const ho_so_id = req.headers['x-ho-so-id'];
  const { giao_vien_id, ngay_mong_muon, gio_bat_dau, gio_ket_thuc, ghi_chu } = req.body;
  if (!ho_so_id || !giao_vien_id || !ngay_mong_muon || !gio_bat_dau || !gio_ket_thuc) {
    return res.status(400).json({ success: false, error: 'Thiếu thông tin đặt lịch' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO yeu_cau_dat_lich (hoc_vien_id, giao_vien_id, ngay_mong_muon, gio_bat_dau, gio_ket_thuc, ghi_chu, trang_thai)
       VALUES ($1, $2, $3, $4, $5, $6, 'cho_duyet') RETURNING *`,
      [ho_so_id, giao_vien_id, ngay_mong_muon, gio_bat_dau, gio_ket_thuc, ghi_chu || '']
    );
    // Thông báo cho admin/lễ tân
    const hvRes = await pool.query('SELECT ho_ten FROM ho_so WHERE id = $1', [ho_so_id]);
    const gvRes = await pool.query('SELECT ho_ten FROM ho_so WHERE id = $1', [giao_vien_id]);
    const hvName = hvRes.rows[0]?.ho_ten || 'Học viên';
    const gvName = gvRes.rows[0]?.ho_ten || 'Giáo viên';
    await createNotification(
      'yeu_cau_dat_lich', 'Yêu cầu đặt lịch mới',
      `${hvName} yêu cầu đặt lịch với GV ${gvName} vào ${ngay_mong_muon} lúc ${gio_bat_dau}.`,
      result.rows[0].id, 'yeu_cau_dat_lich', 'nhan_vien'
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    // Nếu bảng chưa tồn tại thì tạo
    if (err.message.includes('does not exist')) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS yeu_cau_dat_lich (
          id SERIAL PRIMARY KEY,
          hoc_vien_id INTEGER REFERENCES ho_so(id),
          giao_vien_id INTEGER REFERENCES ho_so(id),
          ngay_mong_muon DATE NOT NULL,
          gio_bat_dau TIME NOT NULL,
          gio_ket_thuc TIME NOT NULL,
          ghi_chu TEXT DEFAULT '',
          trang_thai VARCHAR(20) DEFAULT 'cho_duyet',
          ngay_tao TIMESTAMP DEFAULT NOW(),
          ngay_cap_nhat TIMESTAMP DEFAULT NOW()
        )
      `);
      const result2 = await pool.query(
        `INSERT INTO yeu_cau_dat_lich (hoc_vien_id, giao_vien_id, ngay_mong_muon, gio_bat_dau, gio_ket_thuc, ghi_chu, trang_thai)
         VALUES ($1, $2, $3, $4, $5, $6, 'cho_duyet') RETURNING *`,
        [ho_so_id, giao_vien_id, ngay_mong_muon, gio_bat_dau, gio_ket_thuc, ghi_chu || '']
      );
      return res.status(201).json({ success: true, data: result2.rows[0] });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/booking-requests: Lịch sử yêu cầu đặt lịch của học viên (HV) hoặc tất cả (admin/le_tan)
router.get('/booking-requests', async (req, res) => {
  const ho_so_id = req.headers['x-ho-so-id'];
  const user_role = req.headers['x-user-role'];
  try {
    let result;
    if (user_role === 'admin' || user_role === 'le_tan') {
      result = await pool.query(
        `SELECT y.*, hs_hv.ho_ten as ten_hoc_vien, hs_hv.so_dien_thoai as sdt_hoc_vien,
                hs_gv.ho_ten as ten_giao_vien
         FROM yeu_cau_dat_lich y
         LEFT JOIN ho_so hs_hv ON y.hoc_vien_id = hs_hv.id
         LEFT JOIN ho_so hs_gv ON y.giao_vien_id = hs_gv.id
         ORDER BY y.ngay_tao DESC LIMIT 100`
      );
    } else {
      result = await pool.query(
        `SELECT y.*, hs_gv.ho_ten as ten_giao_vien
         FROM yeu_cau_dat_lich y
         LEFT JOIN ho_so hs_gv ON y.giao_vien_id = hs_gv.id
         WHERE y.hoc_vien_id = $1
         ORDER BY y.ngay_tao DESC LIMIT 20`,
        [ho_so_id]
      );
    }
    res.json({ success: true, data: result.rows });
  } catch (err) {
    if (err.message.includes('does not exist')) return res.json({ success: true, data: [] });
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/booking-requests/:id/approve: Admin/lễ tân duyệt hoặc từ chối yêu cầu đặt lịch
router.put('/booking-requests/:id/approve', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { id } = req.params;
  const { trang_thai, ghi_chu_admin } = req.body; // 'da_duyet' | 'tu_choi'
  if (!['da_duyet', 'tu_choi'].includes(trang_thai)) {
    return res.status(400).json({ success: false, error: 'Trạng thái không hợp lệ' });
  }
  try {
    const result = await pool.query(
      `UPDATE yeu_cau_dat_lich SET trang_thai = $1, ngay_cap_nhat = NOW() WHERE id = $2 RETURNING *`,
      [trang_thai, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Không tìm thấy yêu cầu' });
    const row = result.rows[0];
    // Thông báo cho học viên
    const hvName = (await pool.query('SELECT ho_ten FROM ho_so WHERE id = $1', [row.hoc_vien_id])).rows[0]?.ho_ten || '';
    const gvName = (await pool.query('SELECT ho_ten FROM ho_so WHERE id = $1', [row.giao_vien_id])).rows[0]?.ho_ten || '';
    const msg = trang_thai === 'da_duyet'
      ? `Yêu cầu đặt lịch với GV ${gvName} vào ${row.ngay_mong_muon} đã được duyệt.`
      : `Yêu cầu đặt lịch với GV ${gvName} vào ${row.ngay_mong_muon} đã bị từ chối.${ghi_chu_admin ? ' Lý do: ' + ghi_chu_admin : ''}`;
    await createNotification('booking_' + trang_thai,
      trang_thai === 'da_duyet' ? 'Lịch học được xác nhận' : 'Yêu cầu đặt lịch bị từ chối',
      msg, id, 'yeu_cau_dat_lich', 'hoc_vien'
    );
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/teacher-portal/my-students: Danh sách học viên GV đang dạy
router.get('/teacher-portal/my-students', async (req, res) => {
  let ho_so_id = req.headers['x-ho-so-id'];
  const userRole = req.headers['x-user-role'] || 'giao_vien';

  if (!ho_so_id && (userRole === 'admin' || userRole === 'le_tan')) {
    try {
      const fallbackRes = await pool.query(
        "SELECT id FROM ho_so WHERE loai_ho_so = 'giao_vien' AND is_deleted = 0 ORDER BY id ASC LIMIT 1"
      );
      if (fallbackRes.rows.length > 0) {
        ho_so_id = fallbackRes.rows[0].id;
      }
    } catch (err) {
      console.error('Lỗi lấy hồ sơ giáo viên fallback:', err);
    }
  }

  if (!ho_so_id) return res.status(401).json({ success: false, error: 'Thiếu xác thực' });
  try {
    const result = await pool.query(
      `SELECT DISTINCT hs.id, hs.ho_ten, hs.ma_ho_so, hs.so_dien_thoai, hs.email, hs.ngay_sinh,
              MAX(lh.ngay_hoc) as buoi_hoc_gan_nhat,
              COUNT(lh.id) as tong_buoi_hoc,
              COUNT(lh.id) FILTER (WHERE lh.trang_thai = 'da_hoc') as da_hoc,
              COUNT(lh.id) FILTER (WHERE lh.trang_thai = 'vang') as vang
       FROM lich_hoc lh
       JOIN ho_so hs ON lh.hoc_vien_id = hs.id
       WHERE lh.giao_vien_id = $1 AND lh.trang_thai != 'da_huy'
       GROUP BY hs.id, hs.ho_ten, hs.ma_ho_so, hs.so_dien_thoai, hs.email, hs.ngay_sinh
       ORDER BY hs.ho_ten ASC`,
      [ho_so_id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/teacher-portal/stats: Thống kê theo tháng cho giáo viên
router.get('/teacher-portal/stats', async (req, res) => {
  let ho_so_id = req.headers['x-ho-so-id'];
  const { thang, nam } = req.query;
  const userRole = req.headers['x-user-role'] || 'giao_vien';

  if (!ho_so_id && (userRole === 'admin' || userRole === 'le_tan')) {
    try {
      const fallbackRes = await pool.query(
        "SELECT id FROM ho_so WHERE loai_ho_so = 'giao_vien' AND is_deleted = 0 ORDER BY id ASC LIMIT 1"
      );
      if (fallbackRes.rows.length > 0) {
        ho_so_id = fallbackRes.rows[0].id;
      }
    } catch (err) {
      console.error('Lỗi lấy hồ sơ giáo viên fallback:', err);
    }
  }

  if (!ho_so_id) return res.status(401).json({ success: false, error: 'Thiếu xác thực' });
  try {
    const m = parseInt(thang) || new Date().getMonth() + 1;
    const y = parseInt(nam) || new Date().getFullYear();

    // Thống kê từng ngày trong tháng
    const dailyRes = await pool.query(
      `SELECT ngay_hoc::text as ngay,
              COUNT(*) FILTER (WHERE trang_thai = 'da_hoc') as da_day,
              COUNT(*) FILTER (WHERE trang_thai = 'vang') as hv_vang,
              COUNT(*) FILTER (WHERE trang_thai = 'cho_hoc') as sap_day
       FROM lich_hoc
       WHERE giao_vien_id = $1
         AND EXTRACT(MONTH FROM ngay_hoc) = $2
         AND EXTRACT(YEAR FROM ngay_hoc) = $3
       GROUP BY ngay_hoc ORDER BY ngay_hoc ASC`,
      [ho_so_id, m, y]
    );

    // Tổng tháng
    const totalRes = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE trang_thai = 'da_hoc') as tong_da_day,
         COUNT(*) FILTER (WHERE trang_thai = 'vang') as tong_hv_vang,
         COUNT(*) FILTER (WHERE trang_thai = 'cho_hoc') as tong_sap_day,
         COUNT(DISTINCT hoc_vien_id) as so_hoc_vien
       FROM lich_hoc
       WHERE giao_vien_id = $1
         AND EXTRACT(MONTH FROM ngay_hoc) = $2
         AND EXTRACT(YEAR FROM ngay_hoc) = $3`,
      [ho_so_id, m, y]
    );

    // Đánh giá tháng này
    const ratingRes = await pool.query(
      `SELECT AVG(so_sao)::numeric(3,1) as trung_binh, COUNT(*) as so_danh_gia
       FROM danh_gia_giao_vien
       WHERE giao_vien_id = $1
         AND EXTRACT(MONTH FROM ngay_tao) = $2
         AND EXTRACT(YEAR FROM ngay_tao) = $3`,
      [ho_so_id, m, y]
    );

    res.json({
      success: true,
      data: {
        thang: m, nam: y,
        theo_ngay: dailyRes.rows,
        tong: totalRes.rows[0],
        danh_gia: ratingRes.rows[0]
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/reports/teacher/:teacherId?: Lịch sử sổ liên lạc GV đã viết
router.get('/reports/teacher/:teacherId?', async (req, res) => {
  let { teacherId } = req.params;
  const { hoc_vien_id } = req.query;
  const userRole = req.headers['x-user-role'] || 'giao_vien';

  if ((!teacherId || teacherId === 'undefined' || teacherId === 'null') && (userRole === 'admin' || userRole === 'le_tan')) {
    try {
      const fallbackRes = await pool.query(
        "SELECT id FROM ho_so WHERE loai_ho_so = 'giao_vien' AND is_deleted = 0 ORDER BY id ASC LIMIT 1"
      );
      if (fallbackRes.rows.length > 0) {
        teacherId = fallbackRes.rows[0].id;
      }
    } catch (err) {
      console.error('Lỗi lấy hồ sơ giáo viên fallback:', err);
    }
  }

  if (!teacherId || teacherId === 'undefined' || teacherId === 'null') {
    return res.status(400).json({ success: false, error: 'Thiếu thông tin ID giáo viên' });
  }

  try {
    let query = `
      SELECT s.*, hs_hv.ho_ten as ten_hoc_vien, hs_hv.ma_ho_so as ma_hoc_vien
      FROM so_lien_lac s
      LEFT JOIN ho_so hs_hv ON s.hoc_vien_id = hs_hv.id
      WHERE s.giao_vien_id = $1
    `;
    const params = [teacherId];
    if (hoc_vien_id) {
      params.push(hoc_vien_id);
      query += ` AND s.hoc_vien_id = $${params.length}`;
    }
    query += ' ORDER BY s.ngay_tao DESC LIMIT 30';
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/reports/student/:studentId: Lấy danh sách sổ liên lạc của học viên
router.get('/reports/student/:studentId', async (req, res) => {
  const { studentId } = req.params;
  if (!studentId || studentId === 'undefined' || studentId === 'null') {
    return res.status(400).json({ success: false, error: 'Thiếu thông tin ID học viên' });
  }
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS so_lien_lac (
        id SERIAL PRIMARY KEY,
        hoc_vien_id INTEGER REFERENCES ho_so(id),
        giao_vien_id INTEGER REFERENCES ho_so(id),
        noi_dung_bai_hoc TEXT,
        nhan_xet_buoi_hoc TEXT,
        bai_tap_ve_nha TEXT,
        so_phut_hoc INTEGER DEFAULT 90,
        dan_do_giao_vien TEXT,
        ngay_tao TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    const result = await pool.query(`
      SELECT s.*, hs_gv.ho_ten as ten_giao_vien
      FROM so_lien_lac s
      LEFT JOIN ho_so hs_gv ON s.giao_vien_id = hs_gv.id
      WHERE s.hoc_vien_id = $1
      ORDER BY s.ngay_tao DESC
    `, [studentId]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/reports: Giáo viên tạo nhật ký học tập / sổ liên lạc mới
router.post('/reports', async (req, res) => {
  const {
    hoc_vien_id,
    giao_vien_id,
    nhan_xet_buoi_hoc,
    bai_tap_ve_nha,
    noi_dung_bai_hoc,
    so_phut_hoc,
    dan_do_giao_vien,
    nguoi_gui_id,
    vai_tro_gui,
    loai_nhat_ky
  } = req.body;

  if (!hoc_vien_id) {
    return res.status(400).json({ success: false, error: 'Thiếu thông tin học viên' });
  }

  let verifiedGvId = giao_vien_id;
  try {
    const gvCheck = await pool.query("SELECT id FROM ho_so WHERE id = $1", [giao_vien_id]);
    if (gvCheck.rows.length === 0) {
      // Tìm hồ sơ đầu tiên trong hệ thống (ưu tiên giáo viên, sau đó đến nhân viên khác) để gán làm người gửi
      const fallbackGv = await pool.query(
        "SELECT id FROM ho_so WHERE is_deleted = 0 ORDER BY CASE WHEN loai_ho_so = 'giao_vien' THEN 1 ELSE 2 END, id ASC LIMIT 1"
      );
      if (fallbackGv.rows.length > 0) {
        verifiedGvId = fallbackGv.rows[0].id;
      } else {
        return res.status(400).json({ success: false, error: 'Hệ thống chưa có hồ sơ nhân viên hay giáo viên nào để liên kết làm người viết nhận xét.' });
      }
    }
  } catch (err) {
    console.error('Lỗi kiểm tra giao_vien_id fallback:', err);
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS so_lien_lac (
        id SERIAL PRIMARY KEY,
        hoc_vien_id INTEGER REFERENCES ho_so(id),
        giao_vien_id INTEGER REFERENCES ho_so(id),
        noi_dung_bai_hoc TEXT,
        nhan_xet_buoi_hoc TEXT,
        bai_tap_ve_nha TEXT,
        so_phut_hoc INTEGER DEFAULT 90,
        dan_do_giao_vien TEXT,
        ngay_tao TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    const result = await pool.query(
      `INSERT INTO so_lien_lac 
        (hoc_vien_id, giao_vien_id, noi_dung_bai_hoc, nhan_xet_buoi_hoc, bai_tap_ve_nha, so_phut_hoc, dan_do_giao_vien, nguoi_gui_id, vai_tro_gui, loai_nhat_ky) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        hoc_vien_id, 
        verifiedGvId, 
        noi_dung_bai_hoc, 
        nhan_xet_buoi_hoc, 
        bai_tap_ve_nha, 
        so_phut_hoc || 90, 
        dan_do_giao_vien, 
        nguoi_gui_id || verifiedGvId, 
        vai_tro_gui || 'giao_vien', 
        loai_nhat_ky || 'giao_vien_dan_do'
      ]
    );

    // Tạo thông báo cho học viên
    await createNotification(
      'so_lien_lac', 
      'Bạn có nhận xét mới từ giáo viên',
      nhan_xet_buoi_hoc && nhan_xet_buoi_hoc.length > 80 ? nhan_xet_buoi_hoc.slice(0, 80) + '…' : nhan_xet_buoi_hoc,
      result.rows[0].id, 
      'so_lien_lac', 
      'hoc_vien'
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/reports/:id: Cập nhật nhận xét sổ liên lạc
router.put('/reports/:id', async (req, res) => {
  const { id } = req.params;
  const {
    nhan_xet_buoi_hoc,
    bai_tap_ve_nha,
    noi_dung_bai_hoc,
    so_phut_hoc,
    dan_do_giao_vien
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE so_lien_lac 
       SET nhan_xet_buoi_hoc = $1, bai_tap_ve_nha = $2, noi_dung_bai_hoc = $3, so_phut_hoc = $4, dan_do_giao_vien = $5, ngay_cap_nhat = NOW(), da_chinh_sua = 1
       WHERE id = $6 RETURNING *`,
      [nhan_xet_buoi_hoc, bai_tap_ve_nha, noi_dung_bai_hoc, so_phut_hoc || 90, dan_do_giao_vien, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy nhật ký nhận xét này' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/reports/:id: Xóa nhận xét sổ liên lạc
router.delete('/reports/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM so_lien_lac WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy nhật ký nhận xét này' });
    }
    res.json({ success: true, message: 'Đã xóa nhận xét thành công' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/notes: GV ghi chú dặn dò riêng cho học viên
router.post('/notes', async (req, res) => {
  const ho_so_id = req.headers['x-ho-so-id'];
  const { hoc_vien_id, noi_dung } = req.body;
  if (!ho_so_id || !hoc_vien_id || !noi_dung) {
    return res.status(400).json({ success: false, error: 'Thiếu thông tin ghi chú' });
  }
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ghi_chu_giao_vien (
        id SERIAL PRIMARY KEY,
        giao_vien_id INTEGER REFERENCES ho_so(id),
        hoc_vien_id INTEGER REFERENCES ho_so(id),
        noi_dung TEXT NOT NULL,
        ngay_tao TIMESTAMP DEFAULT NOW()
      )
    `);
    const result = await pool.query(
      'INSERT INTO ghi_chu_giao_vien (giao_vien_id, hoc_vien_id, noi_dung) VALUES ($1, $2, $3) RETURNING *',
      [ho_so_id, hoc_vien_id, noi_dung]
    );
    // Thông báo cho học viên
    await createNotification(
      'ghi_chu_giao_vien', 'Giáo viên có ghi chú mới cho bạn',
      noi_dung.length > 80 ? noi_dung.slice(0, 80) + '…' : noi_dung,
      result.rows[0].id, 'ghi_chu_giao_vien', 'hoc_vien'
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/notes: Lấy ghi chú dặn dò (GV lấy theo hoc_vien_id; HV lấy của mình; Admin/Lễ tân lấy tất cả hoặc lọc theo học viên)
router.get('/notes', async (req, res) => {
  const ho_so_id = req.headers['x-ho-so-id'];
  const user_role = req.headers['x-user-role'];
  const { hoc_vien_id } = req.query;
  try {
    let result;
    if (user_role === 'admin' || user_role === 'le_tan') {
      const params = [];
      let q = `
        SELECT g.*, 
               hs_gv.ho_ten as ten_giao_vien, 
               hs_hv.ho_ten as ten_hoc_vien 
        FROM ghi_chu_giao_vien g 
        LEFT JOIN ho_so hs_gv ON g.giao_vien_id = hs_gv.id 
        LEFT JOIN ho_so hs_hv ON g.hoc_vien_id = hs_hv.id
      `;
      if (hoc_vien_id) {
        params.push(hoc_vien_id);
        q += ` WHERE g.hoc_vien_id = $1`;
      }
      q += ' ORDER BY g.ngay_tao DESC LIMIT 100';
      result = await pool.query(q, params);
    } else if (user_role === 'giao_vien') {
      const params = [ho_so_id];
      let q = `SELECT g.*, hs.ho_ten as ten_hoc_vien FROM ghi_chu_giao_vien g LEFT JOIN ho_so hs ON g.hoc_vien_id = hs.id WHERE g.giao_vien_id = $1`;
      if (hoc_vien_id) { params.push(hoc_vien_id); q += ` AND g.hoc_vien_id = $${params.length}`; }
      q += ' ORDER BY g.ngay_tao DESC LIMIT 50';
      result = await pool.query(q, params);
    } else {
      result = await pool.query(
        `SELECT g.*, hs.ho_ten as ten_giao_vien FROM ghi_chu_giao_vien g LEFT JOIN ho_so hs ON g.giao_vien_id = hs.id WHERE g.hoc_vien_id = $1 ORDER BY g.ngay_tao DESC LIMIT 20`,
        [ho_so_id]
      );
    }
    res.json({ success: true, data: result.rows });
  } catch (err) {
    if (err.message.includes('does not exist')) return res.json({ success: true, data: [] });
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/notes/:id: Xóa ghi chú dặn dò (Admin, Lễ tân hoặc Giáo viên tạo ghi chú được quyền xóa)
router.delete('/notes/:id', async (req, res) => {
  const { id } = req.params;
  const ho_so_id = req.headers['x-ho-so-id'];
  const user_role = req.headers['x-user-role'];
  if (!ho_so_id || !user_role) {
    return res.status(401).json({ success: false, error: 'Thiếu thông tin xác thực' });
  }
  try {
    const noteRes = await pool.query('SELECT * FROM ghi_chu_giao_vien WHERE id = $1', [id]);
    if (noteRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy ghi chú' });
    }
    const note = noteRes.rows[0];
    
    // Quyền xóa: Admin, Lễ tân hoặc Giáo viên đã tạo ghi chú đó
    if (user_role === 'admin' || user_role === 'le_tan' || String(note.giao_vien_id) === String(ho_so_id)) {
      await pool.query('DELETE FROM ghi_chu_giao_vien WHERE id = $1', [id]);
      return res.json({ success: true, message: 'Đã xóa ghi chú dặn dò thành công' });
    } else {
      return res.status(430).json({ success: false, error: 'Bạn không có quyền xóa ghi chú này' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/notes/:id: Cập nhật ghi chú dặn dò (Admin, Lễ tân hoặc Giáo viên tạo ghi chú được quyền sửa)
router.put('/notes/:id', async (req, res) => {
  const { id } = req.params;
  const ho_so_id = req.headers['x-ho-so-id'];
  const user_role = req.headers['x-user-role'];
  const { noi_dung } = req.body;
  
  if (!ho_so_id || !user_role || !noi_dung) {
    return res.status(400).json({ success: false, error: 'Thiếu thông tin cập nhật' });
  }
  try {
    const noteRes = await pool.query('SELECT * FROM ghi_chu_giao_vien WHERE id = $1', [id]);
    if (noteRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy ghi chú' });
    }
    const note = noteRes.rows[0];
    
    // Quyền sửa: Admin, Lễ tân hoặc Giáo viên đã tạo ghi chú đó
    if (user_role === 'admin' || user_role === 'le_tan' || String(note.giao_vien_id) === String(ho_so_id)) {
      const result = await pool.query(
        'UPDATE ghi_chu_giao_vien SET noi_dung = $1 WHERE id = $2 RETURNING *',
        [noi_dung, id]
      );
      return res.json({ success: true, message: 'Cập nhật ghi chú dặn dò thành công', data: result.rows[0] });
    } else {
      return res.status(430).json({ success: false, error: 'Bạn không có quyền chỉnh sửa ghi chú này' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// CHATBOT AI — Gemini (phân quyền theo role)
// ============================================================
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// System prompt theo từng role
function getChatSystemPrompt(role, hoTen) {
  const base = `Bạn là trợ lý AI của Stellar Academy — một trung tâm ngoại ngữ. Tên bạn là "Stella". Trả lời bằng tiếng Việt, thân thiện, ngắn gọn, dùng emoji phù hợp.`;

  const rolePrompts = {
    hoc_vien: `${base}
Bạn đang hỗ trợ học viên tên: ${hoTen || 'bạn'}.
Bạn có thể giúp học viên về:
- Thông tin lịch học, buổi học sắp tới
- Tra cứu học phí, trạng thái đóng tiền
- Hướng dẫn đặt lịch học, xem sổ liên lạc
- Giải đáp thắc mắc về khóa học, nội quy trung tâm
- Mẹo học tiếng Anh hiệu quả
KHÔNG được hỏi hoặc cung cấp thông tin về: doanh thu, thống kê toàn trung tâm, thông tin cá nhân học viên khác, tài khoản admin/nhân viên.`,

    giao_vien: `${base}
Bạn đang hỗ trợ giáo viên tên: ${hoTen || 'thầy/cô'}.
Bạn có thể giúp giáo viên về:
- Lịch dạy, danh sách học viên
- Gợi ý phương pháp giảng dạy, tài liệu
- Hướng dẫn viết sổ liên lạc, ghi chú học viên
- Quy trình điểm danh, báo cáo buổi học
- Thông tin nội quy, quy định giáo viên
KHÔNG được cung cấp thông tin về: doanh thu trung tâm, thông tin cá nhân học viên ngoài lớp mình dạy, quyền admin.`,

    le_tan: `${base}
Bạn đang hỗ trợ nhân viên lễ tân tên: ${hoTen || 'bạn'}.
Bạn có thể giúp về:
- Quy trình tiếp nhận học viên mới, đăng ký khóa học
- Hướng dẫn xử lý yêu cầu, đặt lịch, hủy khóa
- Tra cứu thông tin học viên, giáo viên
- Quy định thu học phí, hoàn trả
- Hướng dẫn sử dụng các tính năng hệ thống
KHÔNG được cung cấp: thông tin tài khoản admin cấp cao, cấu hình hệ thống nội bộ.`,

    admin: `${base}
Bạn đang hỗ trợ quản trị viên tên: ${hoTen || 'admin'}.
Bạn có thể giúp về mọi khía cạnh của trung tâm:
- Phân tích doanh thu, báo cáo vận hành
- Quản lý nhân sự, học viên, giáo viên
- Cấu hình hệ thống, phân quyền tài khoản
- Chiến lược phát triển trung tâm, marketing
- Giải quyết vấn đề kỹ thuật, vận hành
- Gợi ý cải thiện quy trình làm việc`
  };

  return rolePrompts[role] || rolePrompts['hoc_vien'];
}

router.post('/chatbot', async (req, res) => {
  const role = req.headers['x-user-role'] || 'hoc_vien';
  const hoTen = req.headers['x-ho-ten'] || '';
  const { message, history } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, error: 'Tin nhắn không được để trống' });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: getChatSystemPrompt(role, hoTen)
    });

    // Chuyển đổi history sang format Gemini
    const chatHistory = (history || []).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(message.trim());
    const reply = result.response.text();

    res.json({ success: true, reply });
  } catch (err) {
    console.error('Gemini API error:', err.message);
    
    // Tạo phản hồi ngoại tuyến thông minh làm cứu cánh thay vì crash lỗi 500
    let reply = `Chào ${hoTen || 'bạn'}! Stella AI hiện đang trong chế độ offline (Bảo trì phím kết nối API). Mình tạm thời trả lời nhanh: `;
    const msgLower = message.toLowerCase();
    if (msgLower.includes('lịch') || msgLower.includes('ngày') || msgLower.includes('ca')) {
      reply += 'Lịch dạy hoặc lịch học của bạn đã được hiển thị đầy đủ trên màn hình thời khóa biểu chính. Bạn có thể kiểm tra trực tiếp ở đó nhé!';
    } else if (msgLower.includes('học phí') || msgLower.includes('tiền') || msgLower.includes('đóng')) {
      reply += 'Thông tin chi tiết về học phí, số tiền đã đóng và số tiền còn thiếu nằm trong tab "Học phí". Vui lòng kiểm tra hoặc liên hệ bộ phận Lễ tân nếu cần hỗ trợ.';
    } else if (msgLower.includes('sổ liên lạc') || msgLower.includes('nhận xét') || msgLower.includes('nhật ký')) {
      reply += 'Nhật ký học tập và nhận xét chi tiết sau mỗi buổi dạy được cập nhật trong tab "Sổ liên lạc". Giáo viên có thể điền thông tin và gửi trực tiếp tại đây.';
    } else if (msgLower.includes('học sinh') || msgLower.includes('học viên') || msgLower.includes('sinh viên')) {
      reply += 'Danh sách học viên và thông tin chi tiết từng bạn được quản lý trong tab "Học viên". Bạn có thể xem lịch sử học tập và tiến độ của các em tại đó.';
    } else {
      reply += 'Stella AI đã ghi nhận ý kiến của bạn. Ban quản trị trung tâm sẽ phản hồi lại bạn sớm nhất!';
    }
    
    res.json({ success: true, reply });
  }
});

// ============================================================
// AVATAR UPLOAD — Cloudinary
// ============================================================
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Chỉ chấp nhận file ảnh'));
    }
    cb(null, true);
  }
});

// POST /api/upload/avatar — upload ảnh đại diện
router.post('/upload/avatar', upload.single('avatar'), async (req, res) => {
  const hoSoId = req.headers['x-ho-so-id'];
  const role = req.headers['x-user-role'];

  if (!hoSoId) return res.status(401).json({ success: false, error: 'Thiếu xác thực' });
  if (!req.file) return res.status(400).json({ success: false, error: 'Không có file ảnh' });

  try {
    // Upload lên Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'stellar_academy/avatars',
          public_id: `avatar_${role}_${hoSoId}_${Date.now()}`,
          transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
          format: 'webp'
        },
        (error, result) => error ? reject(error) : resolve(result)
      );
      stream.end(req.file.buffer);
    });

    const avatarUrl = uploadResult.secure_url;

    // Lưu URL vào DB
    await pool.query('UPDATE ho_so SET avatar_url = $1 WHERE id = $2', [avatarUrl, hoSoId]);

    res.json({ success: true, avatar_url: avatarUrl });
  } catch (err) {
    console.error('Upload avatar error:', err.message);
    res.status(500).json({ success: false, error: 'Upload ảnh thất bại: ' + err.message });
  }
});

// GET /api/profile/:id — lấy thông tin hồ sơ (bao gồm avatar_url)
router.get('/profile/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT hs.*, vt.ten_vai_tro, tk.ten_dang_nhap
       FROM ho_so hs
       LEFT JOIN tai_khoan tk ON tk.ho_so_id = hs.id
       LEFT JOIN vai_tro vt ON tk.vai_tro_id = vt.id
       WHERE hs.id = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ' });
    res.json({ success: true, data: result.rows[0] });
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

// API PUT /api/registrations/tutoring/:id/cancel: Hủy đăng ký học kèm, hoàn tiền, tự động cập nhật
router.post('/registrations/tutoring/:id/cancel', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  // express routing hack: sử dụng post hoặc put để hỗ trợ route fallback
  // do người dùng truyền PUT hay POST, chúng ta khai báo router.put ở dưới
});

router.put('/registrations/tutoring/:id/cancel', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { id } = req.params;
  const { so_tien_hoan, ly_do_huy } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Cập nhật trang_thai = 'huy', chèn số tiền hoàn và lý do hủy trong dang_ky_hoc_kem
    const cancelQuery = `
      UPDATE dang_ky_hoc_kem
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
      throw new Error('Không tìm thấy đăng ký học kèm');
    }

    await client.query('COMMIT');
    await createNotification(
      'huy_buoi_tap',
      'Hủy gói kèm 1-1',
      `Hợp đồng học kèm ID ${id} đã bị hủy. Hoàn tiền: ${so_tien_hoan || 0} VNĐ.`,
      id,
      'dang_ky_hoc_kem',
      'nhan_vien'
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Lỗi API hủy gói kèm (Transaction):', err.message);
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
  const { ho_ten, so_dien_thoai, email, chuyen_mon, kinh_nghiem, chi_nhanh, avatar_url, don_gia_ca_nhom, don_gia_ca_kem } = req.body;
  try {
    const finalAvatarUrl = avatar_url && avatar_url.startsWith('data:') ? await uploadToCloudinary(avatar_url) : avatar_url;
    const updateQuery = `
      UPDATE ho_so
      SET ho_ten = $1, so_dien_thoai = $2, email = $3, chuyen_mon = $4,
          kinh_nghiem = $5, chi_nhanh = $6,
          avatar_url = COALESCE($7, avatar_url),
          don_gia_ca_nhom = COALESCE($8, don_gia_ca_nhom),
          don_gia_ca_kem = COALESCE($9, don_gia_ca_kem),
          ngay_cap_nhat = CURRENT_TIMESTAMP
      WHERE id = $10 AND loai_ho_so = 'giao_vien' AND is_deleted = 0
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [
      ho_ten, so_dien_thoai, email, chuyen_mon, parseInt(kinh_nghiem) || 0, chi_nhanh || 'Trung tam chính', finalAvatarUrl,
      don_gia_ca_nhom !== undefined ? parseFloat(don_gia_ca_nhom) : null,
      don_gia_ca_kem !== undefined ? parseFloat(don_gia_ca_kem) : null,
      id
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

// GET /api/attendance/summary: Lấy dữ liệu tổng hợp chấm công theo tháng
router.get('/attendance/summary', async (req, res) => {
  const { month, year } = req.query;
  const now = new Date();
  const targetMonth = month ? parseInt(month) : (now.getMonth() + 1);
  const targetYear = year ? parseInt(year) : now.getFullYear();

  try {
    // 1. Lấy danh sách tất cả nhân sự và giáo viên đang hoạt động
    const peopleRes = await pool.query(
      "SELECT id, ma_ho_so, ho_ten, loai_ho_so FROM ho_so WHERE loai_ho_so IN ('giao_vien', 'nhan_vien') AND is_deleted = 0 ORDER BY loai_ho_so DESC, ho_ten ASC"
    );
    const people = peopleRes.rows;

    // 2. Lấy log ra vào trong tháng và năm mục tiêu
    const logsRes = await pool.query(
      `SELECT ho_so_id, thoi_diem::date::text as ngay_hoc
       FROM luot_vao_ra
       WHERE EXTRACT(MONTH FROM thoi_diem) = $1 AND EXTRACT(YEAR FROM thoi_diem) = $2`,
      [targetMonth, targetYear]
    );
    const logs = logsRes.rows;

    // 3. Gom nhóm ngày làm việc cho từng người
    const workDaysMap = {};
    logs.forEach(log => {
      if (!workDaysMap[log.ho_so_id]) {
        workDaysMap[log.ho_so_id] = new Set();
      }
      workDaysMap[log.ho_so_id].add(log.ngay_hoc);
    });

    const summary = people.map(person => {
      const dates = Array.from(workDaysMap[person.id] || []);
      return {
        id: person.id,
        ma_ho_so: person.ma_ho_so,
        ho_ten: person.ho_ten,
        loai_ho_so: person.loai_ho_so,
        work_days: dates
      };
    });

    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/attendance/export: Xuất dữ liệu chấm công tháng dạng CSV
router.get('/attendance/export', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { month, year } = req.query;
  const now = new Date();
  const targetMonth = month ? parseInt(month) : (now.getMonth() + 1);
  const targetYear = year ? parseInt(year) : now.getFullYear();

  try {
    const peopleRes = await pool.query(
      "SELECT id, ma_ho_so, ho_ten, loai_ho_so FROM ho_so WHERE loai_ho_so IN ('giao_vien', 'nhan_vien') AND is_deleted = 0 ORDER BY loai_ho_so DESC, ho_ten ASC"
    );
    const people = peopleRes.rows;

    const logsRes = await pool.query(
      `SELECT ho_so_id, thoi_diem::date::text as ngay_hoc
       FROM luot_vao_ra
       WHERE EXTRACT(MONTH FROM thoi_diem) = $1 AND EXTRACT(YEAR FROM thoi_diem) = $2`,
      [targetMonth, targetYear]
    );
    const logs = logsRes.rows;

    const workDaysMap = {};
    logs.forEach(log => {
      if (!workDaysMap[log.ho_so_id]) {
        workDaysMap[log.ho_so_id] = new Set();
      }
      workDaysMap[log.ho_so_id].add(log.ngay_hoc);
    });

    const totalDays = new Date(targetYear, targetMonth, 0).getDate();

    // Sinh nội dung CSV (UTF-8 với BOM)
    let csvContent = '\uFEFF';
    csvContent += 'Mã nhân sự,Họ và tên,Vai trò,';
    csvContent += Array.from({ length: totalDays }, (_, i) => `Ngày ${i + 1}`).join(',') + ',Tổng công thực tế\n';

    people.forEach(p => {
      const dates = workDaysMap[p.id] || new Set();
      const rowDays = [];
      let presentCount = 0;
      for (let d = 1; d <= totalDays; d++) {
        let hasPresent = false;
        dates.forEach(dateStr => {
          const dateDay = parseInt(dateStr.split('-')[2]);
          if (dateDay === d) hasPresent = true;
        });

        if (hasPresent) {
          rowDays.push('X');
          presentCount++;
        } else {
          rowDays.push('-');
        }
      }
      csvContent += `"${p.ma_ho_so}","${p.ho_ten}","${p.loai_ho_so === 'giao_vien' ? 'Giáo viên' : 'Nhân viên'}",${rowDays.join(',')},"${presentCount}/${totalDays}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=cham_cong_${targetMonth}_${targetYear}.csv`);
    res.status(200).send(csvContent);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/payroll/summary: Tính toán lương tự động hàng tháng (Hỗ trợ cấu hình cá nhân + Snapshot chốt lương)
router.get('/payroll/summary', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { month, year } = req.query;
  const now = new Date();
  const targetMonth = month ? parseInt(month) : (now.getMonth() + 1);
  const targetYear = year ? parseInt(year) : now.getFullYear();

  try {
    // 1. Lấy tất cả nhân sự hoạt động cùng các cấu hình lương cá nhân (Loại trừ Admin)
    const peopleRes = await pool.query(
      `SELECT id, ma_ho_so, ho_ten, loai_ho_so, 
              COALESCE(luong_cung_ngay, 300000) as luong_cung_ngay,
              COALESCE(don_gia_ca_nhom, 150000) as don_gia_ca_nhom,
              COALESCE(don_gia_ca_kem, 200000) as don_gia_ca_kem
       FROM ho_so 
       WHERE loai_ho_so IN ('giao_vien', 'nhan_vien') AND ma_ho_so NOT LIKE 'AD%' AND is_deleted = 0 
       ORDER BY loai_ho_so DESC, ho_ten ASC`
    );
    const people = peopleRes.rows;

    // 2. Tính số ngày công của mỗi người từ luot_vao_ra
    const workDaysRes = await pool.query(
      `SELECT ho_so_id, COUNT(DISTINCT thoi_diem::date) as work_days
       FROM luot_vao_ra
       WHERE EXTRACT(MONTH FROM thoi_diem) = $1 AND EXTRACT(YEAR FROM thoi_diem) = $2
       GROUP BY ho_so_id`,
      [targetMonth, targetYear]
    );
    const workDaysMap = {};
    workDaysRes.rows.forEach(r => {
      workDaysMap[r.ho_so_id] = parseInt(r.work_days);
    });

    // 3. Tính số ca dạy lớp nhóm của Giáo viên (lich_hoc_nhom trang_thai = 'da_hoc')
    const groupSessionsRes = await pool.query(
      `SELECT giao_vien_id, COUNT(*) as sessions
       FROM lich_hoc_nhom
       WHERE EXTRACT(MONTH FROM ngay_hoc) = $1 AND EXTRACT(YEAR FROM ngay_hoc) = $2 AND trang_thai = 'da_hoc'
       GROUP BY giao_vien_id`,
      [targetMonth, targetYear]
    );
    const groupSessionsMap = {};
    groupSessionsRes.rows.forEach(r => {
      groupSessionsMap[r.giao_vien_id] = parseInt(r.sessions);
    });

    // 4. Tính số ca dạy học kèm 1-1 của Giáo viên (lich_hoc trang_thai = 'da_hoc')
    const tutorSessionsRes = await pool.query(
      `SELECT giao_vien_id, COUNT(*) as sessions
       FROM lich_hoc
       WHERE EXTRACT(MONTH FROM ngay_hoc) = $1 AND EXTRACT(YEAR FROM ngay_hoc) = $2 AND trang_thai = 'da_hoc'
       GROUP BY giao_vien_id`,
      [targetMonth, targetYear]
    );
    const tutorSessionsMap = {};
    tutorSessionsRes.rows.forEach(r => {
      tutorSessionsMap[r.giao_vien_id] = parseInt(r.sessions);
    });

    // Lấy trạng thái chốt từ bảng bang_luong (Snapshot)
    const payrollRes = await pool.query(
      "SELECT * FROM bang_luong WHERE thang = $1 AND nam = $2",
      [targetMonth, targetYear]
    );
    const dbPayrollMap = {};
    payrollRes.rows.forEach(r => {
      dbPayrollMap[r.ho_so_id] = r;
    });

    const payrollSummary = people.map(p => {
      const dbRecord = dbPayrollMap[p.id];
      const workDays = workDaysMap[p.id] || 0;
      const groupSessions = groupSessionsMap[p.id] || 0;
      const tutorSessions = tutorSessionsMap[p.id] || 0;

      // CẢI TIẾN 4: Nếu lương của nhân viên tháng này ĐÃ THANH TOÁN -> lấy dữ liệu Snapshot trong DB làm chuẩn
      if (dbRecord && dbRecord.trang_thai === 'da_thanh_toan') {
        return {
          id: p.id,
          ma_ho_so: p.ma_ho_so,
          ho_ten: p.ho_ten,
          loai_ho_so: p.loai_ho_so,
          work_days: workDays, // Hiển thị số ngày/ca thực tế hiện tại để đối chiếu nếu có lệch
          group_sessions: groupSessions,
          tutor_sessions: tutorSessions,
          luong_cung: parseFloat(dbRecord.luong_cung),
          luong_ca_day: parseFloat(dbRecord.luong_ca_day),
          phu_cap: parseFloat(dbRecord.phu_cap),
          khau_tru: parseFloat(dbRecord.khau_tru || 0),
          thuc_linh: parseFloat(dbRecord.thuc_linh),
          trang_thai: dbRecord.trang_thai,
          ngay_thanh_toan: dbRecord.ngay_thanh_toan
        };
      }

      // CHƯA THANH TOÁN -> Tính toán động dựa trên cấu hình ho_so của từng cá nhân (CẢI TIẾN 2)
      let luongCung = 0;
      let luongCaDay = 0;
      let phuCap = 0;
      let khauTru = 0; // Mặc định chưa thanh toán thì khấu trừ = 0, có thể chỉnh sửa ở frontend

      if (p.loai_ho_so === 'giao_vien') {
        luongCaDay = (groupSessions * parseFloat(p.don_gia_ca_nhom)) + (tutorSessions * parseFloat(p.don_gia_ca_kem));
        phuCap = workDays > 15 ? 500000 : 0; 
      } else {
        luongCung = workDays * parseFloat(p.luong_cung_ngay); 
        phuCap = workDays > 22 ? 800000 : 0; 
      }

      const calculatedThucLinh = luongCung + luongCaDay + phuCap - khauTru;

      return {
        id: p.id,
        ma_ho_so: p.ma_ho_so,
        ho_ten: p.ho_ten,
        loai_ho_so: p.loai_ho_so,
        work_days: workDays,
        group_sessions: groupSessions,
        tutor_sessions: tutorSessions,
        luong_cung: luongCung,
        luong_ca_day: luongCaDay,
        phu_cap: phuCap,
        khau_tru: khauTru,
        thuc_linh: calculatedThucLinh,
        trang_thai: 'chua_thanh_toan',
        ngay_thanh_toan: null,
        // Đính kèm thêm thông tin cấu hình lương gốc để frontend hiển thị ghi chú trực quan
        luong_cung_ngay: parseFloat(p.luong_cung_ngay),
        don_gia_ca_nhom: parseFloat(p.don_gia_ca_nhom),
        don_gia_ca_kem: parseFloat(p.don_gia_ca_kem)
      };
    });

    res.json({ success: true, data: payrollSummary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/payroll/:id/pay: Xác nhận thanh toán lương cho nhân sự (Hỗ trợ lưu khấu trừ và chốt snapshot)
router.put('/payroll/:id/pay', verifyAccess(['admin', 'le_tan']), async (req, res) => {
  const { id } = req.params; 
  const { month, year, luong_cung, luong_ca_day, phu_cap, khau_tru, thuc_linh } = req.body;

  if (!month || !year) {
    return res.status(400).json({ success: false, error: 'Thiếu thông tin tháng và năm để thanh toán lương' });
  }

  try {
    const query = `
      INSERT INTO bang_luong (ho_so_id, thang, nam, luong_cung, luong_ca_day, phu_cap, khau_tru, thuc_linh, trang_thai, ngay_thanh_toan)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'da_thanh_toan', CURRENT_TIMESTAMP)
      ON CONFLICT (ho_so_id, thang, nam)
      DO UPDATE SET 
        luong_cung = EXCLUDED.luong_cung,
        luong_ca_day = EXCLUDED.luong_ca_day,
        phu_cap = EXCLUDED.phu_cap,
        khau_tru = EXCLUDED.khau_tru,
        thuc_linh = EXCLUDED.thuc_linh,
        trang_thai = 'da_thanh_toan',
        ngay_thanh_toan = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const result = await pool.query(query, [
      id, month, year, luong_cung || 0, luong_ca_day || 0, phu_cap || 0, khau_tru || 0, thuc_linh || 0
    ]);

    await createNotification(
      'cap_nhat_buoi_tap',
      'Thanh toán lương thành công',
      `Đã thực hiện chi trả lương tháng ${month}/${year} cho nhân sự ID ${id} với tổng số tiền ${parseFloat(thuc_linh || 0).toLocaleString('vi-VN')} VNĐ.`,
      result.rows[0].id,
      'bang_luong',
      'nhan_vien'
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/payroll/my-salary: Người dùng tự tra cứu phiếu lương cá nhân của họ
router.get('/payroll/my-salary', verifyAccess(['admin', 'le_tan', 'giao_vien', 'hoc_vien']), async (req, res) => {
  const { month, year, ho_so_id } = req.query;
  const now = new Date();
  const targetMonth = month ? parseInt(month) : (now.getMonth() + 1);
  const targetYear = year ? parseInt(year) : now.getFullYear();

  // Xác thực ho_so_id, nếu không truyền tự động tìm
  if (!ho_so_id) {
    return res.status(400).json({ success: false, error: 'Thiếu ho_so_id tra cứu' });
  }

  try {
    // 1. Đọc hồ sơ cùng cấu hình lương
    const personRes = await pool.query(
      `SELECT id, ma_ho_so, ho_ten, loai_ho_so, 
              COALESCE(luong_cung_ngay, 300000) as luong_cung_ngay,
              COALESCE(don_gia_ca_nhom, 150000) as don_gia_ca_nhom,
              COALESCE(don_gia_ca_kem, 200000) as don_gia_ca_kem
       FROM ho_so 
       WHERE id = $1 AND is_deleted = 0`,
      [ho_so_id]
    );

    if (personRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ người dùng này' });
    }
    const p = personRes.rows[0];

    // Loại trừ các tài khoản Admin ra khỏi dữ liệu bảng lương
    if (p.ma_ho_so && p.ma_ho_so.startsWith('AD')) {
      return res.status(404).json({ success: false, error: 'Tài khoản Admin không thuộc diện nhận lương và không có phiếu lương.' });
    }

    // 2. Tính số ngày công
    const workDaysRes = await pool.query(
      `SELECT COUNT(DISTINCT thoi_diem::date) as work_days
       FROM luot_vao_ra
       WHERE ho_so_id = $1 AND EXTRACT(MONTH FROM thoi_diem) = $2 AND EXTRACT(YEAR FROM thoi_diem) = $3`,
      [ho_so_id, targetMonth, targetYear]
    );
    const workDays = parseInt(workDaysRes.rows[0].work_days) || 0;

    // 3. Tính số ca dạy nhóm
    const groupSessionsRes = await pool.query(
      `SELECT COUNT(*) as sessions
       FROM lich_hoc_nhom
       WHERE giao_vien_id = $1 AND EXTRACT(MONTH FROM ngay_hoc) = $2 AND EXTRACT(YEAR FROM ngay_hoc) = $3 AND trang_thai = 'da_hoc'`,
      [ho_so_id, targetMonth, targetYear]
    );
    const groupSessions = parseInt(groupSessionsRes.rows[0].sessions) || 0;

    // 4. Tính số ca dạy kèm 1-1
    const tutorSessionsRes = await pool.query(
      `SELECT COUNT(*) as sessions
       FROM lich_hoc
       WHERE giao_vien_id = $1 AND EXTRACT(MONTH FROM ngay_hoc) = $2 AND EXTRACT(YEAR FROM ngay_hoc) = $3 AND trang_thai = 'da_hoc'`,
      [ho_so_id, targetMonth, targetYear]
    );
    const tutorSessions = parseInt(tutorSessionsRes.rows[0].sessions) || 0;

    // 5. Kiểm tra chốt trong bảng bang_luong
    const payrollRes = await pool.query(
      "SELECT * FROM bang_luong WHERE ho_so_id = $1 AND thang = $2 AND nam = $3",
      [ho_so_id, targetMonth, targetYear]
    );

    if (payrollRes.rows.length > 0) {
      const dbRecord = payrollRes.rows[0];
      return res.json({
        success: true,
        data: {
          id: p.id,
          ma_ho_so: p.ma_ho_so,
          ho_ten: p.ho_ten,
          loai_ho_so: p.loai_ho_so,
          work_days: workDays,
          group_sessions: groupSessions,
          tutor_sessions: tutorSessions,
          luong_cung: parseFloat(dbRecord.luong_cung),
          luong_ca_day: parseFloat(dbRecord.luong_ca_day),
          phu_cap: parseFloat(dbRecord.phu_cap),
          khau_tru: parseFloat(dbRecord.khau_tru || 0),
          thuc_linh: parseFloat(dbRecord.thuc_linh),
          trang_thai: dbRecord.trang_thai,
          ngay_thanh_toan: dbRecord.ngay_thanh_toan
        }
      });
    }

    // Chưa thanh toán -> Tính toán động
    let luongCung = 0;
    let luongCaDay = 0;
    let phuCap = 0;

    if (p.loai_ho_so === 'giao_vien') {
      luongCaDay = (groupSessions * parseFloat(p.don_gia_ca_nhom)) + (tutorSessions * parseFloat(p.don_gia_ca_kem));
      phuCap = workDays > 15 ? 500000 : 0;
    } else {
      luongCung = workDays * parseFloat(p.luong_cung_ngay);
      phuCap = workDays > 22 ? 800000 : 0;
    }

    const thucLinh = luongCung + luongCaDay + phuCap;

    res.json({
      success: true,
      data: {
        id: p.id,
        ma_ho_so: p.ma_ho_so,
        ho_ten: p.ho_ten,
        loai_ho_so: p.loai_ho_so,
        work_days: workDays,
        group_sessions: groupSessions,
        tutor_sessions: tutorSessions,
        luong_cung: luongCung,
        luong_ca_day: luongCaDay,
        phu_cap: phuCap,
        khau_tru: 0,
        thuc_linh: thucLinh,
        trang_thai: 'chua_thanh_toan',
        ngay_thanh_toan: null,
        luong_cung_ngay: parseFloat(p.luong_cung_ngay),
        don_gia_ca_nhom: parseFloat(p.don_gia_ca_nhom),
        don_gia_ca_kem: parseFloat(p.don_gia_ca_kem)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/checkin-logs: Lấy danh sách toàn bộ log check-in/out ra vào
router.get('/checkin-logs', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.*, h.ho_ten, h.ma_ho_so, h.loai_ho_so,
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

// POST /api/checkin-logs: Ghi nhận check-in/out thủ công từ Admin/Lễ tân
router.post('/checkin-logs', verifyAccess(['admin', 'le_tan', 'giao_vien']), async (req, res) => {
  const { ho_so_id, chi_nhanh_thuc_hien, thoi_diem, phuong_thuc } = req.body;
  if (!ho_so_id) {
    return res.status(400).json({ success: false, error: 'Thiếu thông tin người dùng cần chấm công' });
  }
  try {
    const hsRes = await pool.query('SELECT ho_ten, loai_ho_so FROM ho_so WHERE id = $1 AND is_deleted = 0', [ho_so_id]);
    if (hsRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ nhân sự/giáo viên' });
    }
    const profile = hsRes.rows[0];

    const insertQuery = `
      INSERT INTO luot_vao_ra (ho_so_id, loai, phuong_thuc, chi_nhanh_thuc_hien, thoi_diem)
      VALUES ($1, 'vao', $2, $3, $4)
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [
      ho_so_id, 
      phuong_thuc || 'van_tay', 
      chi_nhanh_thuc_hien || 'Trung tâm chính',
      thoi_diem || new Date().toISOString()
    ]);

    await createNotification(
      'quet_ma_qr',
      'Ghi nhận chấm công thủ công',
      `Nhân viên/Giáo viên "${profile.ho_ten}" đã được ghi nhận chấm công thủ công bởi người quản trị.`,
      result.rows[0].id,
      'luot_vao_ra',
      'nhan_vien'
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
