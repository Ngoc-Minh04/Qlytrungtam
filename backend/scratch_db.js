const { pool } = require('./src/config/db');

async function checkSchedules() {
  try {
    console.log(`\n=== DATA IN dang_ky_hoc_kem ===`);
    const resReg = await pool.query(`
      SELECT id, hoc_vien_id, giao_vien_id, goi_hoc_kem_id, so_buoi_dang_ky, so_buoi_da_hoc, trang_thai
      FROM dang_ky_hoc_kem;
    `);
    console.log(resReg.rows);

    console.log(`\n=== DATA IN lich_hoc ===`);
    const resSch = await pool.query(`
      SELECT id, dang_ky_hoc_kem_id, hoc_vien_id, giao_vien_id, ngay_hoc::text, gio_bat_dau, gio_ket_thuc, loai_buoi, trang_thai
      FROM lich_hoc;
    `);
    console.log(resSch.rows);

  } catch (err) {
    console.error("Lỗi:", err);
  } finally {
    await pool.end();
  }
}

checkSchedules();
