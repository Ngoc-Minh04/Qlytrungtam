const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, './.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const id = 38;
    console.log(`Đang chạy thử lệnh xóa mềm tài khoản ID ${id}...`);
    
    // Kiểm tra xem tài khoản có tồn tại không
    const cur = await pool.query('SELECT ten_dang_nhap, ho_so_id FROM tai_khoan WHERE id = $1', [id]);
    console.log("Tài khoản hiện tại:", cur.rows);
    
    if (cur.rows.length === 0) {
      console.log("Không tìm thấy tài khoản.");
      return;
    }

    // Thử chạy query UPDATE xóa mềm
    const res = await pool.query("UPDATE tai_khoan SET is_deleted = 1, trang_thai = $1 WHERE id = $2 RETURNING *", ['bi_khoa', id]);
    console.log("KẾT QUẢ UPDATE:");
    console.log(res.rows);
  } catch (err) {
    console.error("LỖI XÓA TÀI KHOẢN CHI TIẾT:");
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
