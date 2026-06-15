async function trigger() {
  try {
    const response = await fetch('http://localhost:3006/api/classes/2', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': 'le_tan'
      },
      body: JSON.stringify({
        ten_lop: "Lớp nhóm - Sửa Test Thành Công",
        giao_vien_id: 26,
        ngay_hoc: "2026-06-25", // ngày tương lai để vượt qua chặn quá khứ
        gio_bat_dau: "08:00",
        gio_ket_thuc: "09:30"
      })
    });
    const result = await response.json();
    console.log("SERVER RESPONSE FOR PUT CLASS:", result);
  } catch (err) {
    console.error("LỖI KẾT NỐI:", err);
  }
}

trigger();
