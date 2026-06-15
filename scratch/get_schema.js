const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

async function queryTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema='public'
  `);
  console.log('Tables:', tables.rows.map(r => r.table_name));

  // Thêm việc mô tả cấu trúc bảng ho_so
  const ho_so_cols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'ho_so'
  `);
  console.log('ho_so schema:', ho_so_cols.rows);

  await client.end();
}
queryTables().catch(console.error);
