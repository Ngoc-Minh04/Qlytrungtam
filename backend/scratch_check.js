const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, './.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const lops = await pool.query(`
      SELECT l.id, l.ten_lop, l.is_deleted,
             (SELECT COUNT(*) FROM lop_hoc_hoc_vien WHERE lop_hoc_id = l.id) as si_so
      FROM lop_hoc l
      ORDER BY l.id DESC
      LIMIT 10
    `);
    console.log("MỚI NHẤT LOP_HOC:");
    console.log(lops.rows);

    const cas = await pool.query(`
      SELECT id, lop_hoc_id, ngay_hoc::text, trang_thai 
      FROM lich_hoc_nhom 
      WHERE lop_hoc_id IN (${lops.rows.map(r => r.id).join(',')})
    `);
    console.log("CÁC CA HỌC NHÓM LIÊN QUAN:");
    console.log(cas.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

main();
