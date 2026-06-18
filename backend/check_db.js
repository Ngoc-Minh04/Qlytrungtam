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
      SELECT id, ho_ten, loai_ho_so 
      FROM ho_so 
      WHERE is_deleted = 0 
      ORDER BY CASE WHEN loai_ho_so = 'giao_vien' THEN 1 ELSE 2 END, id ASC 
      LIMIT 5
    `);
    console.log('Fallback query ordering:', res.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

main();
