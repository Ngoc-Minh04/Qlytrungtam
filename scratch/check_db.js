const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const khRes = await pool.query("SELECT COUNT(*), SUM(so_tien_da_thu) FROM dang_ky_khoa_hoc");
    const hkRes = await pool.query("SELECT COUNT(*), SUM(so_tien_da_thu) FROM dang_ky_hoc_kem");
    const dtRes = await pool.query("SELECT COUNT(*) FROM doanh_thu");
    console.log('dang_ky_khoa_hoc:', khRes.rows[0]);
    console.log('dang_ky_hoc_kem:', hkRes.rows[0]);
    console.log('doanh_thu:', dtRes.rows[0]);
  } catch (err) {
    console.error('Error querying schema:', err);
  } finally {
    await pool.end();
  }
}

main();
