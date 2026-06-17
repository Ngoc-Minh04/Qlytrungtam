const { pool } = require('./src/config/db');

async function testSchedules() {
  try {
    const queryStr = `
      -- 1. Lịch dạy/học kèm 1-1
      SELECT 
        lh.id, lh.dang_ky_hoc_kem_id, lh.giao_vien_id, lh.hoc_vien_id, 
        lh.ngay_hoc::text, lh.gio_bat_dau, lh.gio_ket_thuc, lh.loai_buoi, 
        lh.trang_thai, lh.da_checkin, lh.pt_xac_nhan, lh.hv_xac_nhan, 
        lh.ngay_xac_nhan, lh.ghi_chu, lh.ngay_tao, lh.ngay_cap_nhat,
        hs_hv.ho_ten as ten_hoc_vien, 
        hs_gv.ho_ten as ten_giao_vien,
        dk.tu_ngay::text as tu_ngay,
        dk.den_ngay::text as den_ngay
      FROM lich_hoc lh
      JOIN ho_so hs_hv ON lh.hoc_vien_id = hs_hv.id
      LEFT JOIN ho_so hs_gv ON lh.giao_vien_id = hs_gv.id
      LEFT JOIN dang_ky_hoc_kem dk ON lh.dang_ky_hoc_kem_id = dk.id

      UNION ALL

      -- 2. Lịch dạy/học lớp nhóm
      SELECT 
        lhn.id, NULL as dang_ky_hoc_kem_id, lhn.giao_vien_id, lhv.hoc_vien_id,
        lhn.ngay_hoc::text, lhn.gio_bat_dau, lhn.gio_ket_thuc, 'nhom' as loai_buoi,
        lhn.trang_thai, 0 as da_checkin, 0 as pt_xac_nhan, 0 as hv_xac_nhan,
        NULL as ngay_xac_nhan, NULL as ghi_chu, lhn.ngay_tao, NULL as ngay_cap_nhat,
        hs_hv.ho_ten as ten_hoc_vien,
        hs_gv.ho_ten as ten_giao_vien,
        (SELECT MIN(ngay_hoc)::text FROM lich_hoc_nhom WHERE lop_hoc_id = lhn.lop_hoc_id AND trang_thai != 'da_huy') as tu_ngay,
        (SELECT MAX(ngay_hoc)::text FROM lich_hoc_nhom WHERE lop_hoc_id = lhn.lop_hoc_id AND trang_thai != 'da_huy') as den_ngay
      FROM lich_hoc_nhom lhn
      JOIN lop_hoc lh ON lhn.lop_hoc_id = lh.id
      LEFT JOIN lop_hoc_hoc_vien lhv ON lhn.lop_hoc_id = lhv.lop_hoc_id
      LEFT JOIN ho_so hs_hv ON lhv.hoc_vien_id = hs_hv.id
      LEFT JOIN ho_so hs_gv ON lhn.giao_vien_id = hs_gv.id

      ORDER BY ngay_hoc DESC, gio_bat_dau ASC
    `;
    const res = await pool.query(queryStr);
    console.log("Total schedules found:", res.rows.length);
    console.log("First 5 schedules:", res.rows.slice(0, 5));
    console.log("Types of schedules:", [...new Set(res.rows.map(r => r.loai_buoi))]);
    console.log("Types of schedules count:", res.rows.reduce((acc, r) => { acc[r.loai_buoi] = (acc[r.loai_buoi] || 0) + 1; return acc; }, {}));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

testSchedules();
