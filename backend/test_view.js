const { pool } = require('./src/config/db');

async function test() {
  try {
    // Drop view cũ trước để tránh lỗi thay đổi kiểu dữ liệu/cột của view
    await pool.query('DROP VIEW IF EXISTS v_trang_thai_hoi_vien CASCADE');

    const createViewQuery = `
      CREATE OR REPLACE VIEW v_trang_thai_hoi_vien AS
      SELECT 
        h.id,
        h.ma_ho_so,
        h.ho_ten,
        h.so_dien_thoai,
        h.avatar_url,
        h.chi_nhanh,
        CASE
          -- 1. Nếu có gói đại trà còn hạn thì lấy ngày hết hạn gói đại trà làm mốc
          WHEN EXISTS (SELECT 1 FROM dang_ky_khoa_hoc dk WHERE dk.ho_so_id = h.id AND dk.trang_thai = 'dang_hoat_dong') 
               OR EXISTS (SELECT 1 FROM dang_ky_hoc_kem dk2 WHERE dk2.hoc_vien_id = h.id AND dk2.trang_thai = 'dang_hoat_dong') THEN
            GREATEST(
              COALESCE((SELECT max(dk.den_ngay) FROM dang_ky_khoa_hoc dk WHERE dk.ho_so_id = h.id AND dk.trang_thai = 'dang_hoat_dong'), '1970-01-01'::date),
              COALESCE((SELECT max(dk2.den_ngay) FROM dang_ky_hoc_kem dk2 WHERE dk2.hoc_vien_id = h.id AND dk2.trang_thai = 'dang_hoat_dong'), '1970-01-01'::date)
            )
          ELSE NULL
        END AS den_ngay_xa_nhat,
        CASE
          -- Chưa đăng ký bất kỳ gói nào ở trạng thái 'dang_hoat_dong'
          WHEN NOT EXISTS (SELECT 1 FROM dang_ky_khoa_hoc dk WHERE dk.ho_so_id = h.id AND dk.trang_thai = 'dang_hoat_dong')
               AND NOT EXISTS (SELECT 1 FROM dang_ky_hoc_kem dk2 WHERE dk2.hoc_vien_id = h.id AND dk2.trang_thai = 'dang_hoat_dong') THEN 'chua_dang_ky'::text
          
          -- Có đăng ký gói học kèm đang hoạt động chưa dạy hết số buổi đăng ký và không giới hạn ngày (den_ngay IS NULL) -> xem là ĐANG HOẠT ĐỘNG
          WHEN EXISTS (SELECT 1 FROM dang_ky_hoc_kem dk2 WHERE dk2.hoc_vien_id = h.id AND dk2.trang_thai = 'dang_hoat_dong' AND dk2.den_ngay IS NULL AND dk2.so_buoi_da_hoc < dk2.so_buoi_dang_ky) THEN 'con_han'::text
          
          -- Tất cả gói đăng ký (đại trà & học kèm) đều đã hết hạn ngày hoặc hết số buổi học kèm
          WHEN (
            COALESCE(
              GREATEST(
                COALESCE((SELECT max(dk.den_ngay) FROM dang_ky_khoa_hoc dk WHERE dk.ho_so_id = h.id AND dk.trang_thai = 'dang_hoat_dong'), '1970-01-01'::date),
                COALESCE((SELECT max(dk2.den_ngay) FROM dang_ky_hoc_kem dk2 WHERE dk2.hoc_vien_id = h.id AND dk2.trang_thai = 'dang_hoat_dong'), '1970-01-01'::date)
              ),
              '1970-01-01'::date
            ) < CURRENT_DATE
          ) OR (
            NOT EXISTS (SELECT 1 FROM dang_ky_khoa_hoc dk WHERE dk.ho_so_id = h.id AND dk.trang_thai = 'dang_hoat_dong')
            AND EXISTS (SELECT 1 FROM dang_ky_hoc_kem dk2 WHERE dk2.hoc_vien_id = h.id AND dk2.trang_thai = 'dang_hoat_dong')
            AND NOT EXISTS (SELECT 1 FROM dang_ky_hoc_kem dk2 WHERE dk2.hoc_vien_id = h.id AND dk2.trang_thai = 'dang_hoat_dong' AND dk2.so_buoi_da_hoc < dk2.so_buoi_dang_ky)
          ) THEN 'het_han'::text
          
          -- Sắp hết hạn ngày (trong vòng 7 ngày)
          WHEN COALESCE(
            GREATEST(
              COALESCE((SELECT max(dk.den_ngay) FROM dang_ky_khoa_hoc dk WHERE dk.ho_so_id = h.id AND dk.trang_thai = 'dang_hoat_dong'), '1970-01-01'::date),
              COALESCE((SELECT max(dk2.den_ngay) FROM dang_ky_hoc_kem dk2 WHERE dk2.hoc_vien_id = h.id AND dk2.trang_thai = 'dang_hoat_dong'), '1970-01-01'::date)
            ),
            '1970-01-01'::date
          ) <= (CURRENT_DATE + 7) THEN 'sap_het_han'::text
          
          ELSE 'con_han'::text
        END AS trang_thai_mau,
        (SELECT count(*) FROM dang_ky_hoc_kem dp WHERE dp.hoc_vien_id = h.id AND dp.trang_thai = 'dang_hoat_dong') AS so_goi_pt_dang_tap,
        (SELECT count(*) FROM dang_ky_khoa_hoc dk WHERE dk.ho_so_id = h.id AND dk.trang_thai = 'dang_hoat_dong') AS so_goi_tap_hien_tai
      FROM ho_so h
      WHERE h.loai_ho_so = 'hoc_vien' AND h.is_deleted = 0
    `;
    await pool.query(createViewQuery);
    console.log("✅ Đã cập nhật view v_trang_thai_hoi_vien thành công!");
  } catch (err) {
    console.error("Lỗi cập nhật view:", err);
  } finally {
    await pool.end();
  }
}
test();
