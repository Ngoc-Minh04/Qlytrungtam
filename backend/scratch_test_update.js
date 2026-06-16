const { pool } = require('./src/config/db');

async function test() {
  try {
    // Giả sử chúng ta sửa lớp học có id = 4
    // Xem thông tin trước khi sửa
    const before = await pool.query('SELECT id, ten_lop, giao_vien_id FROM lop_hoc WHERE id = 4');
    console.log("TRƯỚC KHI SỬA:", before.rows[0]);

    // Gọi API giả lập PUT /api/classes/4
    // Chúng ta sẽ trực tiếp chạy logic của API PUT /api/classes/:id trong database bằng client query để kiểm tra
    const id = 4;
    const giao_vien_id = 26; // Đổi sang Giáo Viên Test 2
    const ten_lop = null; 
    const goi_hoc_phi_id = undefined;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const classRes = await client.query('SELECT * FROM lop_hoc WHERE id = $1 AND is_deleted = 0', [id]);
      const oldClass = classRes.rows[0];

      const newGvId = giao_vien_id || oldClass.giao_vien_id;
      let finalTenLop = ten_lop || oldClass.ten_lop;
      if (newGvId !== oldClass.giao_vien_id && (!ten_lop || ten_lop.startsWith('Lớp nhóm - GV'))) {
        const gvNameRes = await client.query('SELECT ho_ten FROM ho_so WHERE id = $1', [newGvId]);
        if (gvNameRes.rows.length > 0) {
          finalTenLop = `Lớp nhóm - GV ${gvNameRes.rows[0].ho_ten}`;
        }
      }

      await client.query(
        `UPDATE lop_hoc 
         SET ten_lop = $1, giao_vien_id = $2, goi_hoc_phi_id = $3
         WHERE id = $4`,
        [finalTenLop, newGvId, goi_hoc_phi_id !== undefined ? goi_hoc_phi_id : oldClass.goi_hoc_phi_id, id]
      );
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    // Xem thông tin sau khi sửa
    const after = await pool.query('SELECT id, ten_lop, giao_vien_id FROM lop_hoc WHERE id = 4');
    console.log("SAU KHI SỬA:", after.rows[0]);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

test();
