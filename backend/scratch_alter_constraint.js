const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, './.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log("Đang tiến hành nâng cấp ràng buộc trạng thái trên bảng tai_khoan...");

    // 1. Drop ràng buộc cũ
    await pool.query(`
      ALTER TABLE tai_khoan 
      DROP CONSTRAINT IF EXISTS tai_khoan_trang_thai_check
    `);
    console.log("1. Đã xóa ràng buộc trạng thái cũ thành công.");

    // 2. Tạo ràng buộc mới cho phép thêm 'bi_khoa'
    await pool.query(`
      ALTER TABLE tai_khoan 
      ADD CONSTRAINT tai_khoan_trang_thai_check 
      CHECK (trang_thai IN ('hoat_dong', 'khoa', 'bi_khoa', 'cho_xac_nhan'))
    `);
    console.log("2. Đã tạo ràng buộc mới cho phép ('hoat_dong', 'khoa', 'bi_khoa', 'cho_xac_nhan') thành công.");

    // 3. Test thử lệnh xóa mềm tài khoản ID 38
    console.log("3. Đang chạy thử lệnh xóa mềm tài khoản ID 38...");
    const res = await pool.query("UPDATE tai_khoan SET is_deleted = 1, trang_thai = $1 WHERE id = $2 RETURNING *", ['bi_khoa', 38]);
    console.log("-> Kết quả xóa thử thành công! Trạng thái hiện tại:", res.rows[0].trang_thai);

  } catch (err) {
    console.error("LỖI KHI NÂNG CẤP DB:", err.message);
  } finally {
    await pool.end();
  }
}

main();
