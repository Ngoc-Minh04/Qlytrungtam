### [12/06/2026 14:31] — Cấu hình bảo mật Git (.gitignore) tránh lộ API key
- **Loại**: Cấu hình bảo mật hệ thống / Git
- **File**: `.gitignore`
- **Mô tả**:
  - Tạo tệp tin `.gitignore` tại thư mục gốc của dự án.
  - Cấu hình loại bỏ các thư mục phụ thuộc (`node_modules`), tệp tin biến môi trường chứa API Key nhạy cảm (`.env`, `.env.local`), các thư mục cấu hình IDE (`.vscode/`, `.idea/`) và các định dạng tệp tin chứa khoá bảo mật.
- **Kết quả**: Thành công

### [12/06/2026 13:10] — Tối ưu phân trang Drag/Swipe chống click nhầm toàn hệ thống
- **Loại**: Cải tiến trải nghiệm người dùng / Phân trang
- **File**: `frontend/src/pages/_shared.js`
- **Mô tả**:
  - Tối ưu hàm `setupSwipePagination` dùng chung. Lắng nghe cả sự kiện di chuyển chuột/ngón tay (`mousemove` & `touchmove`).
  - Thiết lập cơ chế chống click nhầm: Chỉ chuyển trang khi khoảng cách kéo ngang thực sự lớn hơn `60px` và tỷ lệ kéo ngang vượt trội kéo dọc. Ngăn chặn triệt để sự kiện click của các thẻ con bên dưới khi đang thực hiện thao tác kéo trang bằng Capture Event Phase.
  - Cải tiến chỉ dẫn trực quan màu sắc nút drag sang trọng hơn.
- **Kết quả**: Thành công

### [12/06/2026 10:35] — In-place Edit Giáo viên & Xây dựng StudentRequests.js đầy đủ
- **Loại**: Tính năng mới / Cải tiến giao diện
- **File**: `frontend/src/pages/TeachersList.js`, `frontend/src/pages/StudentRequests.js`
- **Mô tả**:
  - **TeachersList.js**: Hợp nhất Modal Chi tiết + Chỉnh sửa thành In-place Edit. Xóa hàm `showEditTeacherModal` cũ. Modal mới hiển thị tất cả trường (Họ tên, Chuyên môn, Kinh nghiệm, SĐT, Email, Chi nhánh) dưới dạng input/select chỉnh sửa trực tiếp. Gọi `PUT /api/teachers/:id` khi submit. Toast thành công + badge "Đã lưu" xuất hiện 3 giây.
  - **StudentRequests.js**: Xây dựng lại hoàn toàn từ placeholder. Fetch dữ liệu thật từ `GET /api/registrations`. Hiển thị bảng đăng ký khóa học với cards thống kê (đang HĐ, đã hủy, tổng). Modal hủy khóa học có form nhập số tiền hoàn trả + lý do, gọi `PUT /api/registrations/:id/cancel`. Toast thông báo đầy đủ success/error.
- **Kết quả**: Thành công

### [12/06/2026 10:26] — Sửa lỗi cú pháp (syntax error) trong StudentsList.js
- **Loại**: Sửa bug / Cú pháp
- **File**: `frontend/src/pages/StudentsList.js`
- **Mô tả**:
  - Khắc phục lỗi ghép chuỗi bị sai ở dòng 299 gây lỗi cú pháp `"Unterminated string literal"`.
  - Bổ sung dấu đóng ngoặc `});` bị thiếu cho sự kiện `submit` của form cập nhật học viên ở cuối file (dòng 714 cũ), giúp file JS biên dịch bình thường.
- **Kết quả**: Thành công

### [12/06/2026 10:18] — Khắc phục lỗi tràn viền và cố định nút đóng (x) trên các modal
- **Loại**: Sửa bug giao diện / UX
- **File**: `frontend/src/pages/StudentsList.js`, `frontend/src/pages/TeachersList.js`
- **Mô tả**:
  - Áp dụng cấu trúc Flexbox (`flex flex-col max-h-[90vh] overflow-hidden`) để cố định phần Header chứa nút đóng (x).
  - Tách biệt phần nội dung (Body) cuộn độc lập (`overflow-y-auto max-h-[calc(90vh-70px)] pr-4`) để ngăn thanh cuộn của trình duyệt tràn ra ngoài và đè lên nút x ở góc phải.
  - Làm nổi bật nút đóng (x) với hiệu ứng đổi màu rõ nét (`text-slate-400 hover:text-red-500 hover:bg-red-50`).
- **Kết quả**: Thành công

### [12/06/2026 10:15] — Thiết kế lại Modal Chi tiết Học viên & Giáo viên dạng Premium
- **Loại**: Cải tiến giao diện / UX nâng cao
- **File**: `frontend/src/pages/StudentsList.js`, `frontend/src/pages/TeachersList.js`
- **Mô tả**:
  - **Modal Học viên**: Mở rộng kích thước modal (`max-w-2xl`), áp dụng hiệu ứng kính mờ và gradient. Hiển thị đầy đủ tất cả các trường dữ liệu từ database: Mã học viên, Họ tên, Ngày sinh, Giới tính, Số điện thoại, Email, Tên phụ huynh, Trình độ đầu vào, Chi nhánh, Ngày tiếp nhận. Cải tiến thẻ "Gói đang hoạt động" với visual bắt mắt, rõ nét.
  - **Modal Giáo viên**: Cải tiến tương tự với layout grid, hiển thị đầy đủ thông tin: Mã giáo viên, Họ tên, Chuyên môn, Số năm kinh nghiệm, Số điện thoại, Email, Chi nhánh công tác, Ngày gia nhập trung tâm.
- **Kết quả**: Thành công

### [12/06/2026 10:12] — Khắc phục lỗi Tiếp nhận học viên mới (500) và lỗi hiển thị Chi tiết học viên
- **Loại**: Sửa bug hệ thống
- **File**: `backend/src/routes/api.js`, `frontend/src/pages/StudentsList.js`
- **Mô tả**:
  - **Lỗi 500 (Tạo/Sửa học viên)**: Thêm phương thức `.toLowerCase()` vào trường `gioi_tinh` ở phía Backend (`POST /api/students/create` và `PUT /api/students/:id`) để tự động đồng bộ kiểu chữ thường (`nam`, `nữ`, `khác`), giải quyết dứt điểm lỗi vi phạm check constraint của Postgres khi frontend gửi dạng chữ hoa (`Nam`, `Nữ`).
  - **Lỗi không mở được chi tiết học viên**: Sửa lỗi sai tên biến trong hàm `showStudentDetailModal` của `StudentsList.js` từ `khoaHoc`/`hocKem` (gây lỗi `ReferenceError`) thành đúng định dạng `khoa_hoc`/`hoc_kem` như API trả về.
- **Kết quả**: Thành công

### [12/06/2026 09:55] — Thiết kế lại giao diện Login 2 cột sang trọng & Bổ sung ẩn/hiện mật khẩu
- **Loại**: Cải tiến giao diện / UX
- **File**: `frontend/src/router.js`
- **Mô tả**:
  - Tái cấu trúc trang đăng nhập thành layout 2 cột toàn màn hình: Cột trái hiển thị hình ảnh học tập trung tâm ngoại ngữ sống động (từ Unsplash) kèm mô tả thông tin trung tâm. Cột phải hiển thị form đăng nhập gọn gàng, tinh tế.
  - Loại bỏ hoàn toàn khối gợi ý tài khoản mẫu bên dưới form theo yêu cầu.
  - Thêm nút icon con mắt (`visibility`/`visibility_off`) và gắn sự kiện JavaScript hỗ trợ ẩn/hiện mật khẩu khi gõ.
- **Kết quả**: Thành công

### [12/06/2026 09:50] — Khắc phục lỗi cú pháp và dọn dẹp file TeachersList.js
- **Loại**: Sửa bug / Dọn dẹp code dư thừa
- **File**: `frontend/src/pages/TeachersList.js`
- **Mô tả**:
  - Loại bỏ hoàn toàn khối code lặp lại bị lỗi cú pháp ở cuối file (dòng 445 đến 570 cũ).
  - Khắc phục lỗi thiếu fetch API lấy dữ liệu thực tế tại đầu hàm `renderTeachersList`.
  - Đồng bộ hoá quyền và nút Sửa/Xóa giáo viên hoạt động ổn định với API.
- **Kết quả**: Thành công

### [12/06/2026 09:05] — Khắc phục layout sidebar/header/form dứt điểm
- **Loại**: Sửa bug giao diện / Tối ưu layout
- **File**: `frontend/src/pages/Dashboard.js`, `frontend/src/pages/AddStudentForm.js`
- **Mô tả**:
  - **Dashboard.js (layout toàn bộ)**: Thay thế hoàn toàn cơ chế layout từ Tailwind CSS responsive class (`md:w-[280px]`, `md:translate-x-0`, `md:pl-[var()]`) sang **JavaScript inline style** để tránh lỗi JIT của Tailwind CDN khi dùng dynamic class. Sidebar, topbar và main content đều được điều khiển width/transform/padding bằng JS function `applyLayout()` và `handleResize()`.
  - **Nút 3 gạch**: Luôn hiển thị ở mọi kích thước màn hình (không bị ẩn bởi CSS). Trên desktop click để thu gọn/mở rộng sidebar. Trên mobile click để mở sidebar overlay.
  - **Khoảng trắng header**: Topbar dùng `top:0` inline style, không có margin/padding thừa từ phần tử cha. Main content dùng `padding-top: 56px` khớp với chiều cao header.
  - **AddStudentForm.js**: Giảm spacing — `space-y-4→3`, `gap-3→2`, `p-6→4`, `py-2→1.5`, `mb-1→0.5`, `rounded-xl→rounded-lg`.
- **Kết quả**: Thành công

### [12/06/2026 09:20] — Tách tab Báo cáo doanh thu & Thêm hiệu ứng hover card
- **Loại**: Chỉnh sửa tính năng / Giao diện
- **File**: `frontend/src/pages/Dashboard.js`, `frontend/src/pages/Overview.js`
- **Mô tả**:
  - **Dashboard.js**: Tách tab "Báo cáo Doanh thu" ra khỏi group "finance-group" (đổi tên finance-group thành "Yêu cầu"). Đăng ký Báo cáo Doanh thu làm một mục đơn lập độc lập trên menu sidebar (roles: `admin`, icon: `bar_chart`).
  - **Overview.js**: Bổ sung class `hover:border-[#0066cc]/50 hover:shadow-md transition-all duration-300` vào các Bento Card trên dashboard giúp tạo hiệu ứng viền nổi lên và đổ bóng mịn màng khi rê chuột.
- **Kết quả**: Thành công

### [12/06/2026 09:25] — Sửa lỗi CORS & Bổ sung API endpoints thiếu cho Overview
- **Loại**: Sửa bug / Cấu hình Backend & API
- **File**: `backend/server.js`, `backend/src/routes/api.js`
- **Mô tả**:
  - **CORS error (x-user-role)**: Cập nhật cấu hình CORS middleware trong `server.js` của backend để chấp nhận cả hai kiểu viết hoa thường của headers phân quyền (`X-User-Role`, `X-User-Branch`, `x-user-role`, `x-user-branch`).
  - **API 404 (checkins, registrations)**: Bổ sung 2 endpoint GET `/api/checkins` (lấy toàn bộ logs ra vào để phục vụ tính năng tìm học viên check-in sớm nhất) và GET `/api/registrations` (lấy lịch sử đăng ký khóa học để phục vụ thống kê tổng doanh thu thực tế và gói học bán chạy nhất) tại `api.js` mà trang Overview của frontend đang gọi.
- **Kết quả**: Thành công

### [12/06/2026 09:30] — Tối ưu khoảng trắng các form và cập nhật PTTT doanh thu
- **Loại**: Tối ưu giao diện / Chỉnh sửa luồng thanh toán
- **File**: `frontend/src/pages/CourseRegistrations.js`, `frontend/src/pages/StudentRequests.js`, `frontend/src/pages/RevenueReport.js`
- **Mô tả**:
  - **Phương thức thanh toán**: Rút gọn biểu đồ tròn trong `RevenueReport.js` chỉ hiển thị 2 loại hình thanh toán theo thực tế sử dụng: **Chuyển khoản** (80%) và **Tiền mặt** (20%).
  - **Tối ưu khoảng trắng các form (mục Yêu cầu)**:
    - Trong `CourseRegistrations.js` (Đăng ký học phần): Thu nhỏ padding tổng thể từ `p-6` xuống `p-4`, giảm khoảng cách `space-y-4` xuống `space-y-3`, làm gọn các label, input và kích thước cột.
    - Trong `StudentRequests.js` (Xử lý yêu cầu): Thay đổi border-radius của card sang `rounded-xl`, giảm padding xuống `p-4` và `p-5`, thu hẹp khoảng cách `space-y-4` thành `space-y-3`.
- **Kết quả**: Thành công

### [12/06/2026 09:35] — Tăng độ màu đường viền (divider) & Seed 10 record test học viên/giáo viên
- **Loại**: Cải tiến UI / CSDL mẫu
- **File**: `frontend/index.html`, `backend/src/config/db.js`, `backend/seed_test_data.js`
- **Mô tả**:
  - **Tăng độ màu đường viền**: Cập nhật mã màu `divider` trong `tailwind.config` của `index.html` từ `#e0e0e0` (nhạt) thành `#b0b0b5` (đậm hơn, rõ ràng và sắc nét hơn), giúp toàn bộ giao diện bảng và thẻ phân định khối rõ nét hơn.
  - **Sửa đường dẫn môi trường .env**: Điều chỉnh đường dẫn load tệp cấu hình `.env` trong `backend/src/config/db.js` cho đúng cấp thư mục khi truy cập ngoài môi trường chạy server.
  - **Dữ liệu Test mẫu**: Tạo và thực thi script `seed_test_data.js` chèn thành công 10 học viên mẫu (`HV_TEST_1` đến `HV_TEST_10`) và 10 giáo viên mẫu (`GV_TEST_1` đến `GV_TEST_10`) vào hệ thống cơ sở dữ liệu để phục vụ kiểm thử phân trang và bộ lọc.
- **Kết quả**: Thành công
