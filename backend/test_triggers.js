const { pool } = require('./src/config/db');

async function checkTriggers() {
  try {
    console.log("=== KIỂM TRA TRIGGER TRÊN BẢNG HO_SO VÀ LOP_HOC ===");
    const res = await pool.query(`
      SELECT tgname, tgrelid::regclass, tgtype, pg_get_triggerdef(oid)
      FROM pg_trigger
      WHERE tgrelid IN ('ho_so'::regclass, 'lop_hoc'::regclass, 'lich_hoc_nhom'::regclass, 'lich_hoc'::regclass)
        AND tgisinternal = false;
    `);
    res.rows.forEach(r => {
      console.log(`- Trigger: ${r.tgname} on ${r.tgrelid}`);
      console.log(`  Definition: ${r.pg_get_triggerdef}`);
    });
  } catch (err) {
    console.error("Lỗi:", err);
  } finally {
    await pool.end();
  }
}

checkTriggers();
