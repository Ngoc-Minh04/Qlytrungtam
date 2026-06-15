const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function queryTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  const audit = await client.query(`
    SELECT * 
    FROM audit_log 
    ORDER BY thoi_diem DESC 
    LIMIT 20
  `);
  console.log('Recent audit logs:', audit.rows);

  await client.end();
}
queryTables().catch(console.error);
