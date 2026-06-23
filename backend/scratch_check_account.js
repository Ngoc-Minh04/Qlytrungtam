const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, './.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const updateRes = await pool.query(
      "UPDATE tai_khoan SET ho_so_id = 99 WHERE ten_dang_nhap = '0369877654' RETURNING *"
    );
    console.log("Cập nhật thành công tài khoản 0369877654:");
    console.log(updateRes.rows);
  } catch (err) {
    console.error('Lỗi khi cập nhật:', err.message);
  } finally {
    await pool.end();
  }
}

main();
