const { pool } = require('./src/config/db');

async function showColumns() {
  try {
    for (const table of ['lop_hoc', 'lich_hoc', 'lich_hoc_nhom']) {
      console.log(`\n=== CÁC CỘT TRONG BẢNG ${table.toUpperCase()} ===`);
      const res = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1;
      `, [table]);
      res.rows.forEach(r => console.log(`- ${r.column_name}: ${r.data_type}`));
    }
  } catch (err) {
    console.error("Lỗi:", err);
  } finally {
    await pool.end();
  }
}

showColumns();
