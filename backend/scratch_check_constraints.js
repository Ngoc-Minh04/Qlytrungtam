const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, './.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const res = await pool.query(`
      SELECT pg_get_constraintdef(oid) AS constraint_def
      FROM pg_constraint
      WHERE conname = 'tai_khoan_trang_thai_check'
    `);
    console.log("RÀNG BUỘC TRẠNG THÁI TÀI KHOẢN:");
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
