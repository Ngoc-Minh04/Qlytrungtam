async function trigger() {
  try {
    const response = await fetch('http://localhost:3006/api/staff/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': 'admin'
      },
      body: JSON.stringify({
        ho_ten: "Nhân viên Test Lỗi Trùng",
        so_dien_thoai: "0987654321", // SĐT đã dùng ở bước trước
        email: "staff_err_dup@test.com",
        chuc_vu: "Nhân viên",
        chi_nhanh: "Trung tâm chính",
        avatar_url: null,
        auto_create_account: true
      })
    });
    const result = await response.json();
    console.log("SERVER RESPONSE (DUP PHONE):", result);
  } catch (err) {
    console.error("LỖI KẾT NỐI:", err);
  }
}

trigger();
