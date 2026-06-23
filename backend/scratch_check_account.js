const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, './.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const accountRes = await pool.query("SELECT * FROM tai_khoan WHERE ten_dang_nhap = '0369877456'");
    console.log("TÀI KHOẢN:");
    console.log(accountRes.rows);

    if (accountRes.rows.length > 0) {
      const acc = accountRes.rows[0];
      const hosoRes = await pool.query("SELECT * FROM ho_so WHERE id = $1", [acc.ho_so_id]);
      console.log("HỒ SƠ LIÊN KẾT THEO HO_SO_ID:");
      console.log(hosoRes.rows);

      const hosoPhoneRes = await pool.query("SELECT * FROM ho_so WHERE so_dien_thoai = '0369877456'");
      console.log("HỒ SƠ CÓ SỐ ĐIỆN THOẠI TRÙNG KHỚP:");
      console.log(hosoPhoneRes.rows);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
