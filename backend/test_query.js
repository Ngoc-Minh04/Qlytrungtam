const { pool } = require('./src/config/db');

async function test() {
  try {
    console.log("=== THÔNG TIN BẢNG HO_SO CHỨC VỤ NHÂN VIÊN ===");
    const resStaff = await pool.query("SELECT id, ma_ho_so, ho_ten, loai_ho_so FROM ho_so WHERE loai_ho_so = 'nhan_vien' LIMIT 5");
    console.log("Staff samples:", resStaff.rows);

    console.log("\n=== KIỂM TRA CHECK CONSTRAINT CỦA THONG_BAO ===");
    const resConstraints = await pool.query(`
      SELECT conname, pg_get_constraintdef(oid) 
      FROM pg_constraint 
      WHERE conrelid = 'thong_bao'::regclass;
    `);
    console.log("thong_bao constraints:");
    resConstraints.rows.forEach(r => console.log(`- ${r.conname}: ${r.pg_get_constraintdef}`));

    console.log("\n=== KIỂM TRA LỚP HỌC VÀ LỊCH HỌC NHÓM ===");
    const resClasses = await pool.query("SELECT * FROM lop_hoc LIMIT 3");
    console.log("Classes samples:", resClasses.rows);

    const resScheds = await pool.query("SELECT * FROM lich_hoc_nhom LIMIT 3");
    console.log("Lich hoc nhom samples:", resScheds.rows);
  } catch (err) {
    console.error("Lỗi truy vấn:", err);
  } finally {
    await pool.end();
  }
}

test();
