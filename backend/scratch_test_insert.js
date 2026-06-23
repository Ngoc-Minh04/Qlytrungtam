const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, './.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    // Lấy một học viên ngẫu nhiên hợp lệ trong hệ thống để test
    const studentRes = await pool.query("SELECT id, ho_ten FROM ho_so WHERE loai_ho_so = 'hoc_vien' LIMIT 1");
    if (studentRes.rows.length === 0) {
      console.log("Không tìm thấy học viên nào trong hệ thống.");
      return;
    }
    const studentId = studentRes.rows[0].id;
    console.log(`Đang thử INSERT nhận xét cho học viên: ${studentRes.rows[0].ho_ten} (ID: ${studentId})`);

    // Thử insert trực tiếp với giao_vien_id = 99
    const insertQuery = `
      INSERT INTO so_lien_lac 
        (hoc_vien_id, giao_vien_id, noi_dung_bai_hoc, nhan_xet_buoi_hoc, bai_tap_ve_nha, so_phut_hoc, dan_do_giao_vien, nguoi_gui_id, vai_tro_gui, loai_nhat_ky) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const res = await pool.query(insertQuery, [
      studentId,
      99, // giao_vien_id
      'Nội dung test',
      'Nhận xét test từ nhân viên',
      'Bài tập test',
      90,
      'Dặn dò test',
      99, // nguoi_gui_id
      'nhan_vien', // vai_tro_gui
      'giao_vien_dan_do'
    ]);
    console.log("INSERT THÀNH CÔNG:", res.rows[0]);
  } catch (err) {
    console.error("LỖI INSERT THỰC TẾ:");
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
