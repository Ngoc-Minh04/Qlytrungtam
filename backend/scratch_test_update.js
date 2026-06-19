const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const client = await pool.connect();
  try {
    console.log('Đang thực thi bổ sung cột lich_hoc_nhom_id vào database...');
    await client.query('ALTER TABLE danh_gia_giao_vien ADD COLUMN IF NOT EXISTS lich_hoc_nhom_id INT REFERENCES lich_hoc_nhom(id) ON DELETE CASCADE;');
    console.log('✅ Thành công! Cột lich_hoc_nhom_id đã được bổ sung.');
  } catch (err) {
    console.error('Lỗi khi chạy query:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
