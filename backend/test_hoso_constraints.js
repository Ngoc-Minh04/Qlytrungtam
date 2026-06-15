const { pool } = require('./src/config/db');

async function checkHoSoConstraints() {
  try {
    console.log("=== KIỂM TRA CHECK CONSTRAINT CỦA HO_SO ===");
    const res = await pool.query(`
      SELECT conname, pg_get_constraintdef(oid) 
      FROM pg_constraint 
      WHERE conrelid = 'ho_so'::regclass;
    `);
    res.rows.forEach(r => console.log(`- ${r.conname}: ${r.pg_get_constraintdef}`));
  } catch (err) {
    console.error("Lỗi:", err);
  } finally {
    await pool.end();
  }
}

checkHoSoConstraints();
