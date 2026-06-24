const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  try {
    // 1. Tính theo logic của API /registrations giống frontend
    const regsRes = await client.query(`
      SELECT 
        so_tien_da_thu, so_tien_hoan, ngay_tao, trang_thai
      FROM dang_ky_khoa_hoc
      UNION ALL
      SELECT 
        so_tien_da_thu, so_tien_hoan, ngay_tao, trang_thai
      FROM dang_ky_hoc_kem
    `);
    const regs = regsRes.rows;
    const activeAndCancelledRegs = regs.filter(r => r.trang_thai !== 'tam_dung');
    
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Ở JS frontend dùng: r.ngay_dang_ky.startsWith(thisMonth)
    // r.ngay_dang_ky ở đây tương ứng r.ngay_tao
    const monthRevenueJS = activeAndCancelledRegs
      .filter(r => {
        if (!r.ngay_tao) return false;
        // Chuyển r.ngay_tao sang ISOString hoặc format YYYY-MM-DD
        const dateStr = new Date(r.ngay_tao).toISOString().split('T')[0];
        return dateStr.startsWith(thisMonth);
      })
      .reduce((s, r) => s + (parseFloat(r.so_tien_da_thu || 0) - parseFloat(r.so_tien_hoan || 0)), 0);
      
    console.log('JS calculation monthRevenue:', monthRevenueJS);

    // 2. Thử query SQL sử dụng ngay_tao::text LIKE
    const sqlLikeRes = await client.query(`
      SELECT (
        SELECT COALESCE(SUM(COALESCE(so_tien_da_thu, 0) - COALESCE(so_tien_hoan, 0)), 0)
        FROM dang_ky_hoc_kem
        WHERE trang_thai != 'tam_dung' AND ngay_tao::text LIKE $1
      ) + (
        SELECT COALESCE(SUM(COALESCE(so_tien_da_thu, 0) - COALESCE(so_tien_hoan, 0)), 0)
        FROM dang_ky_khoa_hoc
        WHERE trang_thai != 'tam_dung' AND ngay_tao::text LIKE $1
      ) as month_revenue
    `, [`${thisMonth}%`]);
    console.log('SQL LIKE calculation monthRevenue:', sqlLikeRes.rows[0].month_revenue);

    // 3. Thử query SQL sử dụng DATE_TRUNC hoặc TO_CHAR
    const sqlDateTruncRes = await client.query(`
      SELECT (
        SELECT COALESCE(SUM(COALESCE(so_tien_da_thu, 0) - COALESCE(so_tien_hoan, 0)), 0)
        FROM dang_ky_hoc_kem
        WHERE trang_thai != 'tam_dung' AND date_trunc('month', ngay_tao) = date_trunc('month', CURRENT_DATE)
      ) + (
        SELECT COALESCE(SUM(COALESCE(so_tien_da_thu, 0) - COALESCE(so_tien_hoan, 0)), 0)
        FROM dang_ky_khoa_hoc
        WHERE trang_thai != 'tam_dung' AND date_trunc('month', ngay_tao) = date_trunc('month', CURRENT_DATE)
      ) as month_revenue
    `);
    console.log('SQL DATE_TRUNC calculation monthRevenue:', sqlDateTruncRes.rows[0].month_revenue);

    // In ra danh sách các registration trong tháng này để debug
    console.log('\n--- Details of all records ---');
    regs.forEach(r => {
      console.log(`trang_thai: ${r.trang_thai}, thu: ${r.so_tien_da_thu}, hoan: ${r.so_tien_hoan}, ngay_tao: ${r.ngay_tao}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
