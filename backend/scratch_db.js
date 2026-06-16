const { pool } = require('./src/config/db');

async function showGoiHocKem() {
  try {
    console.log(`\n=== COLUMNS IN goi_hoc_kem ===`);
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'goi_hoc_kem';
    `);
    res.rows.forEach(r => console.log(`- ${r.column_name}: ${r.data_type}`));

    console.log(`\n=== CHECK CONSTRAINTS IN goi_hoc_kem ===`);
    const res2 = await pool.query(`
      SELECT conname, pg_get_constraintdef(oid) 
      FROM pg_constraint 
      WHERE conrelid = 'goi_hoc_kem'::regclass;
    `);
    res2.rows.forEach(r => console.log(`- ${r.conname}: ${r.pg_get_constraintdef}`));

  } catch (err) {
    console.error("Lỗi:", err);
  } finally {
    await pool.end();
  }
}

showGoiHocKem();
