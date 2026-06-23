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
      SELECT s.*, hs_gv.ho_ten as ten_gv_hs, hs_gv.chuc_vu as chuc_vu_hs
      FROM so_lien_lac s
      LEFT JOIN ho_so hs_gv ON s.giao_vien_id = hs_gv.id
      ORDER BY s.id DESC
      LIMIT 5
    `);
    console.log("5 NHẬN XÉT MỚI NHẤT TRONG DATABASE:");
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
