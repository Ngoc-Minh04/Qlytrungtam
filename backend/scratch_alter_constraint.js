const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, './.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log("Đang tiến hành nâng cấp ràng buộc trên bảng so_lien_lac...");

    // 1. Drop ràng buộc cũ
    await pool.query(`
      ALTER TABLE so_lien_lac 
      DROP CONSTRAINT IF EXISTS so_lien_lac_vai_tro_gui_check
    `);
    console.log("1. Đã xóa ràng buộc cũ thành công.");

    // 2. Tạo ràng buộc mới cho phép cả nhan_vien, le_tan, admin
    await pool.query(`
      ALTER TABLE so_lien_lac 
      ADD CONSTRAINT so_lien_lac_vai_tro_gui_check 
      CHECK (vai_tro_gui IN ('hoc_vien', 'giao_vien', 'nhan_vien', 'le_tan', 'admin'))
    `);
    console.log("2. Đã tạo ràng buộc mới cho phép ('hoc_vien', 'giao_vien', 'nhan_vien', 'le_tan', 'admin') thành công.");

    // 3. Chạy thử lại lệnh insert test để kiểm tra
    const studentRes = await pool.query("SELECT id, ho_ten FROM ho_so WHERE loai_ho_so = 'hoc_vien' LIMIT 1");
    if (studentRes.rows.length > 0) {
      const studentId = studentRes.rows[0].id;
      const insertQuery = `
        INSERT INTO so_lien_lac 
          (hoc_vien_id, giao_vien_id, noi_dung_bai_hoc, nhan_xet_buoi_hoc, bai_tap_ve_nha, so_phut_hoc, dan_do_giao_vien, nguoi_gui_id, vai_tro_gui, loai_nhat_ky) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `;
      const testRes = await pool.query(insertQuery, [
        studentId, 99, 'Nội dung test', 'Nhận xét test từ nhân viên', 'Bài tập', 90, 'Dặn dò', 99, 'nhan_vien', 'giao_vien_dan_do'
      ]);
      console.log(`3. Chạy thử lệnh Insert thành công! ID vừa tạo: ${testRes.rows[0].id}`);
      
      // Xóa bản ghi test vừa tạo để giữ DB sạch
      await pool.query("DELETE FROM so_lien_lac WHERE id = $1", [testRes.rows[0].id]);
      console.log("4. Đã dọn dẹp bản ghi test.");
    }
  } catch (err) {
    console.error("LỖI KHI NÂNG CẤP DB:", err.message);
  } finally {
    await pool.end();
  }
}

main();
