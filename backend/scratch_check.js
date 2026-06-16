const { pool } = require('./src/config/db');

async function run() {
  try {
    // 1. Kiểm tra các trigger hiện có trong database
    const triggersRes = await pool.query(`
      SELECT trigger_name, event_manipulation, event_object_table, action_statement
      FROM information_schema.triggers;
    `);
    console.log("=== TRIGGERS ===");
    console.log(triggersRes.rows);

    // 2. Kiểm tra thông tin các lớp học
    const classesRes = await pool.query(`
      SELECT id, ten_lop, giao_vien_id FROM lop_hoc LIMIT 10;
    `);
    console.log("\n=== LOP_HOC ===");
    console.log(classesRes.rows);

    // 3. Kiểm tra các giáo viên test
    const teachersRes = await pool.query(`
      SELECT id, ho_ten FROM ho_so WHERE loai_ho_so = 'giao_vien' LIMIT 10;
    `);
    console.log("\n=== TEACHERS ===");
    console.log(teachersRes.rows);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

run();
