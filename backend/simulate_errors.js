const { pool } = require('./src/config/db');

async function testStaffCreate() {
  console.log("\n--- THỬ GIẢ LẬP TẠO NHÂN VIÊN ---");
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Tự sinh ma_ho_so
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
    console.log("Sinh ma_ho_so:", ma_ho_so);

    const ho_ten = "Nhân viên Test Lỗi";
    const so_dien_thoai = "0123456789";
    const email = "staff_error@test.com";
    const chuc_vu = "Nhân viên";
    const chi_nhanh = "Trung tam chính";

    const result = await client.query(
      `INSERT INTO ho_so (ma_ho_so, ho_ten, so_dien_thoai, email, chuc_vu, chi_nhanh, loai_ho_so, avatar_url, is_deleted)
       VALUES ($1, $2, $3, $4, $5, $6, 'nhan_vien', $7, 0) RETURNING *`,
      [ma_ho_so, ho_ten, so_dien_thoai, email, chuc_vu, chi_nhanh, null]
    );
    console.log("Thêm ho_so thành công:", result.rows[0]);

    // autoCreateAccount
    const newStaff = result.rows[0];
    const username = so_dien_thoai;
    const password = '123456';
    const roleId = 2; // le_tan

    const insertAccQuery = `
      INSERT INTO tai_khoan (ten_dang_nhap, mat_khau_hash, vai_tro_id, trang_thai)
      VALUES ($1, $2, $3, 'hoat_dong')
      RETURNING id
    `;
    const accRes = await client.query(insertAccQuery, [username, password, roleId]);
    console.log("Tạo tài khoản thành công ID:", accRes.rows[0].id);

    await client.query('ROLLBACK');
    console.log("Giả lập tạo nhân viên OK (Đã rollback)");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("LỖI KHI TẠO NHÂN VIÊN:", err);
  } finally {
    client.release();
  }
}

async function testClassUpdate() {
  console.log("\n--- THỬ GIẢ LẬP UPDATE LỚP HỌC (PUT /api/classes/2) ---");
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const id = 2;
    const ten_lop = "Lớp nhóm - GV Giáo Viên Test 2 (Sửa)";
    const giao_vien_id = 26;
    const ngay_hoc = '2026-06-16';
    const gio_bat_dau = '08:00';
    const gio_ket_thuc = '09:30';

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
       SET ten_lop = $1, giao_vien_id = $2, ngay_cap_nhat = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [ten_lop || oldClass.ten_lop, newGvId, id]
    );

    // Cập nhật ngày học và giờ
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
      console.log("targetDateTime:", targetDateTime);

      // Kiểm tra giáo viên overlap
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

      const overlap1 = await client.query(checkOverlap1, [newGvId, updatedNgay, updatedStart, updatedEnd]);
      const overlap2 = await client.query(checkOverlap2, [newGvId, updatedNgay, activeSched.id, updatedStart, updatedEnd]);

      if (overlap1.rows.length > 0 || overlap2.rows.length > 0) {
        throw new Error('Giáo viên đã trùng lịch giảng dạy một ca khác trong cùng khung giờ này!');
      }

      await client.query(
        `UPDATE lich_hoc_nhom
         SET ngay_hoc = $1, gio_bat_dau = $2, gio_ket_thuc = $3, giao_vien_id = $4
         WHERE id = $5`,
        [updatedNgay, updatedStart, updatedEnd, newGvId, activeSched.id]
      );
    }

    await client.query('COMMIT');
    console.log("Giả lập update lớp học OK!");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("LỖI KHI UPDATE LỚP HỌC:", err);
  } finally {
    client.release();
  }
}

async function run() {
  await testStaffCreate();
  await testClassUpdate();
  await pool.end();
}

run();
