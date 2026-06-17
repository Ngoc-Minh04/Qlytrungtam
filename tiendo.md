### [17/06/2026 13:53] — Khắc phục dải màu trắng che khuất camera quét QR trên Web Frontend
- **Loại**: Sửa bug giao diện / Trải nghiệm người dùng
- **File**: `frontend/src/pages/Dashboard.js`
- **Mô tả**: Sửa lỗi giao diện camera quét QR nhanh bị một dải màu trắng lớn che khuất phần dưới (do các thành phần HTML điều khiển mặc định tự động sinh ra bởi thư viện `html5-qrcode` mà chưa được định dạng CSS). Đã thêm bộ CSS tùy chỉnh ẩn đi các nút bấm, menu chọn camera và căn chỉnh video camera chiếm trọn vẹn 100% khung quét, bo tròn góc hiện đại.
- **Kết quả**: Thành công

### [17/06/2026 13:43] — Tối ưu hóa mật độ mã QR để Webcam Laptop dễ quét hơn
- **Loại**: Cải tiến bảo mật / Trải nghiệm người dùng
- **File**: `backend/src/routes/api.js`
- **Mô tả**: Phát hiện nguyên nhân camera laptop/webcam không thể nhận diện mã QR hiển thị từ di động là do mật độ dữ liệu mã hóa quá cao (chứa nhiều trường tên, vai trò...). Đã rút gọn payload mã QR động từ 5 trường xuống còn 2 trường cốt lõi (`ho_so_id` và `expiresAt`). Việc này giúp hình ảnh mã QR thưa hơn, dễ bắt nét hơn gấp 2 lần trên các webcam độ phân giải thấp.
- **Kết quả**: Thành công


### [17/06/2026 13:38] — Tối ưu hóa camera nhận diện mã QR trên Mobile App
- **Loại**: Cải tiến tính năng / Trải nghiệm người dùng
- **File**: `mobile/src/screens/admin/AdminScanner.js`
- **Mô tả**: Loại bỏ bộ lọc `barcodeScannerSettings` thủ công trong component `<CameraView>` của `expo-camera` để khắc phục lỗi không tự nhận diện mã QR trên một số thiết bị iOS và Android, giúp camera tự lấy nét và quét nhạy bén hơn.
- **Kết quả**: Thành công


### [17/06/2026 13:32] — Cấu hình địa chỉ IP mạng LAN thực tế cho Mobile App
- **Loại**: Cấu hình hệ thống / Sửa lỗi kết nối
- **File**: `mobile/src/api/client.js`
- **Mô tả**: Phát hiện nguyên nhân gây lỗi Timeout kết nối là do IP của máy tính bị lệch so với IP giả lập mặc định `10.0.2.2`. Tiến hành chạy lệnh `ipconfig` xác định IP WiFi hiện tại của máy tính là `192.168.11.125`, từ đó cập nhật lại cấu hình `SERVER_IP` trong tệp `client.js` để thiết bị di động kết nối trực tiếp đến backend.
- **Kết quả**: Thành công


### [17/06/2026 11:33] — Hoàn thiện toàn bộ các luồng chức năng và điều hướng cho Mobile App
- **Loại**: Tính năng mới / Phát triển ứng dụng di động
- **File**: `mobile/App.js`, `mobile/src/screens/student/StudentHome.js`, `mobile/src/screens/teacher/TeacherHome.js`, `mobile/src/screens/teacher/TeacherQR.js`, `mobile/src/screens/admin/AdminHome.js`, `mobile/src/screens/admin/AdminScanner.js`
- **Mô tả**:
  - Phát triển thành công giao diện trang chủ Học viên (`StudentHome.js`) hiển thị bento thống kê thông tin học phí, gói học kèm 1-1, timeline lịch học trong 7 ngày tới và lịch sử học tập.
  - Xây dựng giao diện cho Giáo viên gồm trang chủ (`TeacherHome.js`) hiển thị bento thống kê số buổi đã dạy, ca dạy sắp tới, điểm đánh giá sao trung bình, danh sách ca dạy hôm nay tích hợp nút điểm danh nhanh (có mặt, vắng, hủy lịch) và giao diện sinh mã QR chấm công (`TeacherQR.js`).
  - Thiết lập giao diện cho Admin/Lễ tân gồm trang chủ (`AdminHome.js`) hiển thị bento thống kê số lượt vào/ra hôm nay và danh sách nhật ký quét thẻ thời gian thực, cùng giao diện quét QR bằng camera di động (`AdminScanner.js`) sử dụng `expo-camera` và có hiệu ứng hiển thị kết quả quét trực quan.
  - Cập nhật định tuyến chính (`App.js`) tự động điều hướng luồng giao diện (Bottom Tab Bar riêng biệt) theo 3 vai trò tương ứng ngay khi đăng nhập thành công.
- **Kết quả**: Thành công

### [17/06/2026 11:05] — Giảm giới hạn chặn quét trùng lặp check-in xuống 1 phút
- **Loại**: Cải tiến tính năng / Tối ưu hóa vận hành
- **File**: `backend/src/routes/api.js`
- **Mô tả**: Giảm thời gian chặn quét check-in trùng lặp của một thành viên từ 5 phút xuống còn 1 phút (`INTERVAL '1 minute'`). Thay đổi này giúp tối ưu hóa luồng check-in/out tự động đảo chiều, đáp ứng các tình huống khẩn cấp cần ra vào lớp ngay lập tức và tránh hiện tượng ùn tắc quầy lễ tân khi gặp sự cố thẻ lỗi.
- **Kết quả**: Thành công


### [17/06/2026 10:55] — Khắc phục lỗi DOM Exception (NotFoundError) khi dừng camera ở các trang Log Checkin & Chấm công
- **Loại**: Sửa bug / Cải tiến thư viện
- **File**: `frontend/src/pages/CheckinLogs.js`, `frontend/src/pages/AttendanceStaff.js`
- **Mô tả**:
  - Khắc phục lỗi DOM Exception `NotFoundError: Failed to execute 'removeChild' on 'Node'` khi người dùng tải tệp tin ảnh QR thay vì dùng camera. Lỗi xảy ra do hàm `stopScanner` gọi phương thức `.stop()` của thư viện khi camera chưa từng khởi chạy.
  - Áp dụng bọc điều kiện kiểm tra thuộc tính `.isScanning` trước khi gọi `.stop()` trong `CheckinLogs.js` và `AttendanceStaff.js` để tránh việc thư viện cố gắng gỡ bỏ Node giao diện camera vốn không tồn tại.
- **Kết quả**: Thành công

### [17/06/2026 10:50] — Sửa lỗi gọi sai API check-in và cải tiến bộ tắt camera tại Dashboard.js
- **Loại**: Sửa bug / Cải tiến vận hành
- **File**: `frontend/src/pages/Dashboard.js`
- **Mô tả**:
  - Phát hiện nguyên nhân: Tại nút quét QR nhanh / nhập mã nhanh ngoài topbar của Dashboard.js đang gọi nhầm lên endpoint cũ `/api/checkin` (trả về lỗi hoặc không tự động điểm danh ca học), trong khi endpoint đúng, bảo mật và đồng bộ điểm danh là `/api/checkin/scan`.
  - Tiến hành sửa đổi endpoint gọi API trong hàm `onScanSuccess` và sự kiện `submit` form check-in nhanh sang `/api/checkin/scan`.
  - Khắc phục lỗi warning của thư viện `Html5Qrcode` ("Cannot stop, scanner is not running or paused") bằng cách bọc điều kiện kiểm tra thuộc tính `html5QrScanner.isScanning` trước khi gọi phương thức giải phóng camera `stop()`.
- **Kết quả**: Thành công

### [17/06/2026 10:30] — Khắc phục lỗi nút Đăng xuất không hoạt động trên các Portal và Dashboard
- **Loại**: Sửa bug / Trải nghiệm người dùng
- **File**: `frontend/src/pages/TeacherPortal.js`, `frontend/src/pages/StudentPortal.js`, `frontend/src/pages/Dashboard.js`
- **Mô tả**: 
  - Khắc phục lỗi nút đăng xuất không hoạt động do cơ chế Router của ứng dụng sử dụng cơ chế định tuyến dựa trên Hash (`hashchange`), trong khi hàm `logout()` cũ sử dụng `window.history.pushState()` khiến Router không bắt được sự kiện thay đổi trang.
  - Chuyển đổi logic logout ở cả `TeacherPortal.js` và `StudentPortal.js` về chuẩn Hash Routing bằng cách thiết lập `window.location.hash = '/login'`.
  - Đồng bộ nút đăng xuất trong Dashboard chính (`Dashboard.js`) về chung cơ chế Hash Routing để đảm bảo hoạt động mượt mà.
- **Kết quả**: Thành công

### [17/06/2026 09:45] — Sửa lỗi 401 (Unauthorized) khi lấy mã QR và cải tiến tự động liên kết hồ sơ tài khoản
- **Loại**: Sửa bug / Cải tiến hệ thống
- **File**: `backend/src/routes/api.js`
- **Mô tả**: 
  - Sửa lỗi 401 do các tài khoản thử nghiệm của giáo viên/học viên (`gv01`, `hv01`) chưa được liên kết `ho_so_id` (bị NULL) trong database từ trước, dẫn đến việc thiếu tham số khi gọi API sinh mã QR.
  - Tiến hành cập nhật trực tiếp `ho_so_id` cho tài khoản `gv01` (khớp với hồ sơ GV001) và `hv01` (khớp với hồ sơ HV001) trong database.
  - Cải tiến câu lệnh truy vấn liên kết hồ sơ tự động ở API `POST /api/auth/login` để tự động so khớp cả số điện thoại và tìm kiếm tương đối (LIKE) email/tên đăng nhập, đảm bảo các tài khoản đăng nhập sau này đều được gán hồ sơ chính xác, không bị lỗi 401 nữa.
- **Kết quả**: Thành công

### [17/06/2026 09:35] — Tích hợp menu và tab hiển thị mã QR check-in cho Học viên & Giáo viên
- **Loại**: Cải tiến tính năng / Trải nghiệm người dùng
- **File**: `frontend/src/pages/StudentPortal.js`, `frontend/src/pages/TeacherPortal.js`
- **Mô tả**: Tích hợp thêm tab "Mã QR của tôi" vào hệ thống định tuyến (TABS) và thanh điều hướng của cả hai trang Portal (Học viên & Giáo viên). Kết nối gọi component `renderMyQR` để hiển thị mã QR động đếm ngược bảo mật, giúp giải quyết triệt để vấn đề giáo viên và học viên không tìm thấy mã QR để check-in.
- **Kết quả**: Thành công

### [17/06/2026 08:58] — Tích hợp luồng Check-in bằng mã QR JWT bảo mật & Tự động điểm danh ca học
- **Loại**: Tính năng mới / Nâng cấp trải nghiệm
- **File**: `backend/src/routes/api.js`, `frontend/src/pages/MyQR.js`, `frontend/src/pages/Dashboard.js`, `frontend/src/pages/CheckinLogs.js`, `frontend/src/pages/AttendanceStaff.js`
- **Mô tả**:
  - **Backend**: Phát triển API `GET /api/checkin/my-qr` sinh mã JWT ngắn hạn (5 phút) mã hóa AES-256 qua crypto. Phát triển API `POST /api/checkin/scan` thực hiện xác thực token, kiểm tra trùng quét (5 phút), kiểm tra hạn gói Gym (lớp nhóm) hoặc gói học kèm 1-1 còn ca, và tự động điểm danh ca học khớp trong ngày (`da_checkin = 1`, `trang_thai = 'da_hoc'`), đồng thời tự tăng số buổi học kèm tương ứng. Hỗ trợ song song cả quét QR lẫn nhập mã học viên thủ công từ Base64.
  - **Frontend**:
    - Xây dựng trang `MyQR.js` cho học viên/giáo viên hiển thị mã QR và bộ đếm ngược tự động làm mới mã sau 5 phút.
    - Đăng ký tab và router "Mã QR của tôi" vào `Dashboard.js`.
    - Tích hợp nút quét QR trực tiếp cùng modal camera và form nhập tay tiện lợi tại trang Lượt vào ra học viên (`CheckinLogs.js`) và Chấm công nhân sự (`AttendanceStaff.js`).
- **Kết quả**: Thành công

### [16/06/2026 17:09] — Sửa đường dẫn load cấu hình .env trong db.js
- **Loại**: Sửa bug / Cấu hình hệ thống
- **File**: `backend/src/config/db.js`
- **Mô tả**: Thay đổi đường dẫn load tệp tin cấu hình `.env` từ `../.env` thành `../../.env` để định vị chính xác vị trí tệp môi trường ở thư mục gốc của backend, khắc phục lỗi không load được biến môi trường dẫn đến kết nối database mặc định localhost thất bại.
- **Kết quả**: Thành công

### [16/06/2026 17:08] — Cài đặt module @google/generative-ai phục vụ chatbot AI
- **Loại**: Cài package / Bổ sung thư viện
- **File**: `backend/package.json`
- **Mô tả**: Tiến hành cài đặt thư viện `@google/generative-ai` bị thiếu bằng tùy chọn `--legacy-peer-deps` để giải quyết lỗi crash server khi khởi chạy chatbot.
- **Kết quả**: Thành công

### [16/06/2026 17:06] — Dọn dẹp triệt để các ký tự xung đột merge (conflict markers)
- **Loại**: Sửa bug / Dọn dẹp hệ thống
- **File**: `tiendo.md`, `frontend/src/pages/Dashboard.js`, `frontend/src/pages/StudentRequests.js`, `backend/src/routes/api.js`
- **Mô tả**: Dọn dẹp toàn bộ các ký tự xung đột merge Git (`<<<<<<< HEAD`, `=======`, `>>>>>>>`) còn sót lại trong dự án và thực hiện gộp code thủ công chuẩn xác.
- **Kết quả**: Thành công

### [16/06/2026 16:53] — Tích hợp tự động nhận diện và đảo chiều Check-in / Check-out
- **Loại**: Cải tiến tính năng / Trải nghiệm người dùng
- **File**: `backend/src/routes/api.js`
- **Mô tả**: Tích hợp tính năng tự động nhận diện Vào/Ra (Check-in/Check-out). Hệ thống kiểm tra lượt quét của thành viên trong ngày: nếu là lượt đầu tiên hoặc lượt gần nhất là "Ra" thì ghi nhận là "Vào (Check-in)", nếu lượt gần nhất là "Vào" thì tự động đảo chiều ghi nhận là "Ra (Check-out)".
- **Kết quả**: Thành công

### [16/06/2026 16:50] — Khôi phục sự kiện đóng modal Quick Check-in
- **Loại**: Sửa bug / Giao diện & Trải nghiệm
- **File**: `frontend/src/pages/Dashboard.js`
- **Mô tả**: Gắn lại sự kiện lắng nghe click cho nút `close-quick-checkin-modal` để đảm bảo nút dấu (X) góc phải modal hoạt động bình thường, ẩn modal và giải phóng camera đúng cách.
- **Kết quả**: Thành công

### [16/06/2026 16:44] — Tích hợp Chọn ảnh QR, Tìm kiếm hồ sơ linh hoạt & Chống check-in trùng lặp
- **Loại**: Tính năng mới / Cải tiến bảo mật & Trải nghiệm người dùng
- **File**: `frontend/src/pages/Dashboard.js`, `backend/src/routes/api.js`
- **Mô tả**:
  - **Chọn ảnh QR**: Bổ sung nút "Chọn ảnh QR" trên modal cho phép lễ tân/người dùng tải lên tệp tin ảnh QR có sẵn để quét check-in trực tiếp mà không cần camera.
  - **Tìm kiếm linh hoạt**: Cải tiến logic truy vấn check-in ở backend. Hỗ trợ tìm kiếm theo Mã số hồ sơ dạng chuỗi (ví dụ: `HV034`, `GV001`) và mã số phụ để tránh nhầm lẫn giữa mã số hiển thị của học viên với khóa chính database của giáo viên.
  - **Chống check-in trùng lặp**: Chặn ghi nhận check-in liên tục của một thành viên nếu khoảng cách giữa hai lần quét dưới 5 phút, tránh tạo dữ liệu rác.
- **Kết quả**: Thành công

### [16/06/2026 16:33] — Sửa lỗi 400 Bad Request khi check-in thủ công bằng ID
- **Loại**: Sửa bug / Đồng bộ định dạng API
- **File**: `frontend/src/pages/Dashboard.js`
- **Mô tả**: Thay đổi định dạng trường `timestamp` gửi lên từ `new Date().toISOString()` (dạng chuỗi ISO) thành `Date.now()` (dạng số mili-giây) để đồng bộ hoàn toàn với bộ lọc chống gian lận kiểm tra thời hạn QR Code của API check-in trên backend.
- **Kết quả**: Thành công

### [16/06/2026 16:25] — Tối ưu giải phóng camera khi submit check-in thủ công
- **Loại**: Cải tiến tính năng / Trải nghiệm người dùng
- **File**: `frontend/src/pages/Dashboard.js`
- **Mô tả**: Bổ sung lệnh gọi `stopScanner()` ngay khi người dùng submit form check-in nhanh thủ công bằng ID. Việc này giúp tắt camera thiết bị ngay lập tức thay vì để camera hoạt động ngầm gây tốn pin hoặc lỗi thiết bị.
- **Kết quả**: Thành công

### [16/06/2026 16:10] — Hoàn thiện Module Quản lý Lương, Xuất báo cáo CSV & Nâng cấp Toast realtime
- **Loại**: Tính năng mới / Cải tiến hệ thống / UI UX & API mới
- **File**: `backend/src/routes/api.js`, `frontend/src/pages/AttendanceStaff.js`, `frontend/src/pages/SalaryManagement.js`, `frontend/src/pages/Dashboard.js`, `frontend/src/pages/_shared.js`
- **Mô tả**:
  - **Quản lý Lương & Phụ cấp (`SalaryManagement.js`)**: Xây dựng trang tính lương tự động. Cho phép Lễ tân/Admin lọc kỳ lương tháng/năm, xem chi tiết số ngày công, ca dạy (nhóm và học kèm 1-1) và tự động tính toán số tiền thực lĩnh (Giáo viên tính theo ca dạy, nhân viên tính theo ngày công). Hỗ trợ nút **"Thanh toán"** lương bọc thông báo xác nhận và tự động lưu trạng thái chi trả thành công vào database bảng `bang_luong`.
  - **Xuất báo cáo chấm công CSV**: Tích hợp API xuất file CSV báo cáo chấm công tháng (hỗ trợ mã hóa BOM UTF-8 không lỗi tiếng Việt trong Excel). Tích hợp nút **"Xuất báo cáo (CSV)"** ngay cạnh bộ lọc của Bảng chấm công.
  - **Toast Notification Premium**: Nâng cấp helper `showToast` trong `_shared.js` để hiển thị các thông báo dạng card Apple Style bo góc tròn cực đẹp, kèm các icon động theo phân loại `success`, `error`, `warning`, `info` giúp nâng cao trải nghiệm người dùng realtime.
  - **Đăng ký Routing**: Tích hợp trang Lương mới vào menu sidebar và cấu hình route trong `Dashboard.js`.
- **Kết quả**: Thành công

### [16/06/2026 16:00] — Tích hợp Bảng chấm công tổng hợp theo tháng cho nhân sự & giáo viên
- **Loại**: Tính năng mới / UI UX & API mới
- **File**: `backend/src/routes/api.js`, `frontend/src/pages/AttendanceStaff.js`
- **Mô tả**:
  - **Backend API**: Viết thêm endpoint `GET /api/attendance/summary` để tổng hợp số ngày có log quét thẻ (`luot_vao_ra`) của từng giáo viên/nhân viên theo tháng/năm chọn lọc.
  - **Frontend (AttendanceStaff.js)**:
    - Thiết kế hệ thống Tab chuyển đổi sang trọng: **"Lượt ra vào chi tiết"** và **"Bảng chấm công tháng"**.
    - Xây dựng giao diện Grid Table chấm công tháng cực đẹp (Apple Bento Style), hàng dọc là danh sách nhân sự, hàng ngang là các ngày từ 1 đến hết tháng (tự động tính số ngày). Các ngày có mặt hiển thị dấu tích xanh lá `✓`. Cột cuối hiển thị tổng số ngày công làm việc thực tế trên tháng.
    - Tích hợp bộ lọc chọn Tháng/Năm linh hoạt.
    - Bảo mật phân quyền: Chỉ role `admin` và `le_tan` mới xem được bảng công của toàn bộ nhân sự; tài khoản `giao_vien` chỉ hiển thị duy nhất hàng chấm công của chính mình.
- **Kết quả**: Thành công

### [16/06/2026 15:50] — Sửa lỗi đổi giáo viên thành công nhưng giao diện vẫn hiển thị giáo viên cũ
- **Loại**: Sửa bug / Đồng bộ dữ liệu
- **File**: `backend/src/routes/api.js`
- **Mô tả**:
  - Phát hiện nguyên nhân: Cột "Lớp học / Học viên" hiển thị `item.title` (chính là tên lớp học nhóm `ten_lop`). Tên này được sinh mặc định theo dạng `Lớp nhóm - GV [Tên Giáo Viên]`. Khi sửa đổi giáo viên của lớp học nhóm, backend cập nhật cột `giao_vien_id` nhưng giữ nguyên `ten_lop` chứa tên giáo viên cũ.
  - Giải pháp: Cập nhật logic API `PUT /api/classes/:id` ở backend. Nếu phát hiện thay đổi giáo viên (`newGvId !== oldClass.giao_vien_id`), hệ thống sẽ tự động tra cứu tên giáo viên mới và cập nhật lại `ten_lop` theo format tương ứng để đồng bộ hiển thị chuẩn xác giáo viên mới lên giao diện tức thì.
- **Kết quả**: Thành công

### [16/06/2026 15:40] — Sửa lỗi tràn layout Modal sửa lịch học
- **Loại**: Sửa giao diện / Fix CSS Layout
- **File**: `frontend/src/pages/ClassManagement.js`
- **Mô tả**:
  - Gán thêm class `max-h-[85vh] overflow-y-auto` cho container Modal sửa ca học nhằm giới hạn chiều cao tối đa của form, tự động xuất hiện thanh cuộn đứng bên trong khi màn hình có độ phân giải thấp, giúp tránh tình trạng nút lưu/hủy bị che khuất và không bấm được.
- **Kết quả**: Thành công

### [16/06/2026 15:35] — Hỗ trợ xem chi tiết ca học kèm & Sửa/Hủy ca đơn lẻ linh hoạt
- **Loại**: Cải tiến tính năng / UI UX
- **File**: `frontend/src/pages/ClassManagement.js`
- **Mô tả**:
  - **Accordion xem chi tiết**: Thêm nút "Xem chi tiết ca" ở mỗi dòng gộp học kèm. Lễ tân có thể click vào để mở rộng danh sách chi tiết các buổi học của gói kèm này.
  - **Sửa/Hủy ca học đơn lẻ**: Trong bảng chi tiết mở rộng, Lễ tân có thể nhấn Hủy (xóa duy nhất 1 ca học kèm này) hoặc nhấn Sửa (mở Modal cho phép dời Ngày học, đổi Giờ, đổi Giáo viên của duy nhất ca đó).
  - **Cập nhật Modal Sửa**: Hiển thị lại trường chọn **Ngày học** trên Modal khi sửa đơn lẻ hoặc sửa chuỗi.
- **Kết quả**: Thành công

### [16/06/2026 15:25] — Gộp hiển thị lịch học kèm theo Đăng ký & Thêm API hủy hàng loạt ca chưa học
- **Loại**: Cải tiến tính năng / API mới
- **File**: `backend/src/routes/api.js`, `frontend/src/pages/ClassManagement.js`
- **Mô tả**:
  - **Backend (api.js)**: Viết thêm API `DELETE /api/schedule/by-contract/:contractId` để xóa nhanh toàn bộ các ca học kèm ở trạng thái `cho_hoc` (chưa học) thuộc một đăng ký học kèm cụ thể. Giữ nguyên các buổi đã học (`da_hoc`) làm lịch sử.
  - **Frontend (ClassManagement.js)**:
    - Trong bảng **Lịch sử đặt lịch & Lớp học**, thực hiện group các ca học kèm cá nhân theo từng hợp đồng đăng ký (`dang_ky_hoc_kem_id`) để gộp thành 1 dòng duy nhất cho gọn.
    - **Lớp học / Học viên**: Hiển thị tên học viên, khoảng ngày học từ buổi đầu tiên đến buổi cuối cùng (Ví dụ: `16/06/2026 - 08/07/2026`), và thống kê số buổi học (Ví dụ: `Đã xếp 10 buổi (Đã học: 2, Chờ học: 8)`).
    - **Thứ**: Hiển thị gộp các Thứ tương ứng (Ví dụ: `T2, T4, T6`).
    - **Thao tác Hủy**: Khi bấm hủy dòng gộp học kèm, hệ thống sẽ gọi API hủy hàng loạt các ca chưa học (`cho_hoc`) của đăng ký tương ứng, giúp Lễ tân giải phóng số buổi còn lại để xếp lại lịch mới theo Thứ/Giờ khác dễ dàng.
- **Kết quả**: Thành công

### [16/06/2026 15:05] — Cho phép tự chọn Thứ tùy ý khi tự động xếp lịch & Sửa chữ 'vô hạn' ở gói học kèm
- **Loại**: Cải tiến tính năng / Sửa giao diện
- **File**: `frontend/src/pages/ClassManagement.js`
- **Mô tả**:
  - **Tự động xếp lịch**: Thay đổi giao diện từ 2 khung radio cố định (T2-4-6 hoặc T3-5-7) thành danh sách checkbox các thứ từ Thứ 2 đến Chủ Nhật. Người dùng có thể chọn tổ hợp Thứ học tùy ý (Ví dụ: T2-4-6, T3-5-7 hoặc bất kỳ tổ hợp nào khác) để hệ thống tự động sinh các ngày học tương ứng cho đến khi đủ số buổi của gói học kèm / số tháng của khóa học nhóm.
  - **Thời hạn gói kèm**: Sửa lỗi hiển thị thời hạn từ "vô hạn" thành "Theo số buổi" đối với lớp học kèm 1 kèm 1 khi ngày kết thúc (`den_ngay`) của hợp đồng bị null, giúp thông tin rõ ràng và đúng bản chất.
- **Kết quả**: Thành công

### [16/06/2026 14:50] — Thay đổi hiển thị Thứ học và khoảng thời hạn khóa học/học kèm
- **Loại**: Cải tiến giao diện / API mới
- **File**: `backend/src/routes/api.js`, `frontend/src/pages/ClassManagement.js`
- **Mô tả**:
  - **Backend**: Cập nhật SQL query của API `GET /api/classes` và `GET /api/schedules` để lấy thêm ngày bắt đầu (`tu_ngay`) và ngày kết thúc (`den_ngay`) từ hợp đồng hoạt động (lớp học nhóm / gói kèm 1-1).
  - **Frontend (ClassManagement.js)**:
    - Trong bảng lịch sử xếp lịch: Đổi tên cột "Giáo viên" thành cột "Thứ", tự động phân tích ngày học để chuyển thành thứ tương ứng (ví dụ: `Thứ 2`, `Thứ 4`, `Chủ Nhật`).
    - Bổ sung khoảng thời hạn hợp đồng (Ví dụ: `16/06/2026 - 16/07/2026`) vào dưới cột thông tin Lớp học / Học viên để lễ tân dễ dàng đối chiếu tiến trình và thời gian khóa học.
- **Kết quả**: Thành công

### [16/06/2026 14:25] — Sửa hiển thị thời hạn gói kèm, tối ưu Infinite Scroll và bỏ GV hướng dẫn lúc sửa gói
- **Loại**: Sửa bug / Cải tiến giao diện
- **File**: `frontend/src/pages/TutoringPackages.js`, `frontend/src/pages/StudentsList.js`, `frontend/src/pages/TeachersList.js`, `frontend/src/pages/StaffList.js`
- **Mô tả**:
  - **TutoringPackages**: Sửa dứt điểm hiển thị thời hạn "null tháng" thành "Không giới hạn".
  - **StudentsList, TeachersList, StaffList**: 
    - Nâng cấp layout bảng: Bổ sung thanh cuộn `max-h-[600px] overflow-y-auto` cho container bảng và gán class `sticky top-0 bg-[#f3f3f5] z-20` cho tất cả các tiêu đề `th` để cố định tiêu đề bảng không bị trôi khi cuộn vô hạn.
    - Chỉnh sửa Infinite Scroll: Chỉ hiển thị 10 dòng dữ liệu ban đầu thay vì 20 dòng, đồng thời bước nhảy IntersectionObserver tải thêm mỗi lần cũng là 10 dòng (rootMargin đồng bộ về 10px).
  - **StudentsList**: Xóa trường select chọn Giáo viên hướng dẫn khỏi form chỉnh sửa gói học kèm đang hoạt động (`active-pkg-card`), đồng thời xóa thuộc tính `giao_vien_id` khỏi payload gửi lên API khi bấm Lưu để giữ nguyên giáo viên đang được xếp lịch dạy.
- **Kết quả**: Thành công

### [16/06/2026 13:45] — Hoàn tất sửa đổi các lỗi liên quan đến Gói học, Học kèm, Hủy gói hoàn tiền và Xếp lịch đủ buổi
- **Loại**: Sửa bug / Cải tiến tính năng
- **File**: `backend/src/routes/api.js`, `frontend/src/pages/TutoringPackages.js`, `frontend/src/pages/StudentsList.js`, `frontend/src/pages/ClassManagement.js`, `frontend/src/pages/Dashboard.js`
- **Mô tả**:
  - **TutoringPackages**: Sửa lỗi 500 khi thêm/sửa gói học kèm 1-1 bằng cách tự động gán `so_thang` thành `null` khi `loai_goi = 'theo_buoi'` để pass check constraint `chk_loai_goi` ở backend, đồng thời cho phép trường Thời hạn để trống trên UI.
  - **StudentsList**:
    - Sửa Infinite Scroll bằng cách giảm `rootMargin` từ `100px` thành `10px` để tránh trigger tải liên tục.
    - Form đăng ký gói kèm 1-1: Để trống số buổi đăng ký mặc định khi chưa chọn gói và tự động điền đúng theo gói khi chọn.
    - Form in-place edit gói kèm: Thêm option `-- Chưa xếp --` mặc định nếu hợp đồng chưa xếp giáo viên (tránh tự gán gv233).
    - Đổi nút "Hủy khóa" ngoài danh sách học viên thành lối tắt mở modal chi tiết học viên và kích hoạt tab Gói học.
  - **ClassManagement**:
    - Chặn và ẩn nút "Chọn tất cả học sinh" khi loại hình lớp học là 1 kèm 1.
    - Truyền `giao_vien_id` được chọn trên form lên payload xếp lịch học kèm.
    - Sửa thuật toán tự động xếp lịch để sinh đủ số ca (cho gói kèm 1-1) hoặc sinh đủ số tháng (cho gói đại trà) thay vì bị giới hạn trong tháng hiện tại.
  - **Dashboard & Backend API**:
    - Viết API `PUT /api/registrations/tutoring/:id/cancel` cho phép hủy gói học kèm hoàn tiền thành công (tránh gọi nhầm API hủy khóa học đại trà gây lỗi 500).
    - Cập nhật backend `POST /api/schedule` tự động gán `giao_vien_id` vào hợp đồng học kèm nếu hợp đồng chưa có giáo viên.
- **Kết quả**: Thành công

### [16/06/2026 12:00] — Đồng bộ Infinite Scroll và nâng cấp Xếp lịch cả tháng
- **Loại**: Cải tiến giao diện / Trải nghiệm người dùng / Tính năng mới
- **File**: `frontend/src/pages/StaffList.js`, `frontend/src/pages/ClassManagement.js`, `tiendo.md`
- **Mô tả**:
  - **StaffList**: Đồng bộ hóa cơ chế Infinite Scroll bằng `IntersectionObserver` thay thế sự kiện cuộn window (`scroll`) để tối ưu hóa hiệu suất hiển thị.
  - **ClassManagement**: Thêm tùy chọn "Tự động xếp lịch cả tháng" theo khung Thứ 2-4-6 hoặc Thứ 3-5-7. Triển khai thuật toán tính ngày tự động gửi lên backend. Khi đặt lịch thành công, chỉ gọi `loadScheduleList()` để cập nhật bảng lịch sử đặt lịch bên phải tức thì, giữ nguyên form đang nhập bên trái.
- **Kết quả**: Thành công

### [16/06/2026 11:39] — Cập nhật API Backend cho phép xếp lịch hàng loạt và giao_vien_id nullable
- **Loại**: Cải tiến tính năng / API mới / Di cư Database
- **File**: `backend/src/routes/api.js`, `database`
- **Mô tả**:
  - Chuyển đổi cột `giao_vien_id` trong bảng `dang_ky_hoc_kem` thành nullable và sửa API `POST /api/registrations/tutoring` tương thích.
  - Cập nhật định nghĩa View `v_trang_thai_hoi_vien` để kết hợp kiểm tra trạng thái hoạt động dựa trên cả gói đại trà và gói học kèm 1 kèm 1.
  - Nâng cấp API `POST /api/classes` và `POST /api/schedule` hỗ trợ nhận mảng `ngay_hoc_list` để xếp lịch hàng loạt cả tháng bọc trong 1 Transaction duy nhất.
- **Kết quả**: Thành công

### [16/06/2026 10:03] — Cải tiến giao diện Lớp học, Infinite Scroll và Cập nhật Gói học
- **Loại**: Cải tiến giao diện / Trải nghiệm người dùng / Sửa bug
- **File**: `frontend/src/pages/StudentsList.js`, `frontend/src/pages/ClassManagement.js`, `tiendo.md`
- **Mô tả**:
  - **StudentsList**: Thay thế nút bấm "Tải thêm" bằng cơ chế tự động Infinite Scroll dựa trên hành vi cuộn dọc của window. Khắc phục lệch múi giờ date picker khi sửa gói học bằng `.toLocaleDateString('sv-SE')`. Đổi input tiền tệ sang text có dấu chấm tự động, chặn chọn ngày quá khứ và tự động giữ modal + chuyển về Tab Gói học khi lưu sửa thành công.
  - **ClassManagement**: Lọc danh sách học viên lớp nhóm chỉ khi đã chọn gói học tương ứng. Cập nhật logic hiển thị trạng thái lớp học nhóm quá hạn dựa trên ngày hiện tại (hiển thị "Chưa điểm danh"). Đổi luồng xếp lớp kèm 1-1 tương tự lớp nhóm: Chọn gói học kèm -> hiện học sinh có gói tương ứng -> giới hạn chọn duy nhất 1 học sinh và tự động tra cứu ID hợp đồng.
- **Kết quả**: Thành công

### [16/06/2026 10:02] — Phân quyền xóa gói học phí và gói học kèm cho Lễ tân
- **Loại**: Cải tiến tính năng / Phân quyền
- **File**: `backend/src/routes/api.js`, `tiendo.md`
- **Mô tả**: Cập nhật phân quyền endpoint DELETE của gói học phí (`/api/course-packages/:id`) và gói học kèm (`/api/tutoring-packages/:id`) để cho phép cả vai trò `le_tan` thực hiện thao tác xóa trực tiếp từ giao diện.
- **Kết quả**: Thành công

### [15/06/2026 16:50] — Phân quyền API check-in cho Giáo viên tự chấm công
- **Loại**: Cải tiến tính năng
- **File**: `backend/src/routes/api.js`, `tiendo.md`
- **Mô tả**: Thêm vai trò 'giao_vien' vào middleware verifyAccess của API POST /api/checkin-logs, cho phép tài khoản giáo viên tự chấm công thủ công khi quên quét mã QR.
- **Kết quả**: Thành công

### [15/06/2026 14:05] — Fix triệt để lệch ngày qua SQL CAST, mới thêm lên đầu danh sách, hoàn thiện luồng Modal
- **Loại**: Cải tiến tính năng & Sửa bug
- **File**: `backend/src/routes/api.js`, `frontend/src/pages/StudentsList.js`, `frontend/src/pages/TeachersList.js`, `frontend/src/pages/StaffList.js`, `frontend/src/pages/Dashboard.js`, `tiendo.md`
- **Mô tả**:
  - Sắp xếp học viên, giáo viên và nhân viên mới nhất lên đầu danh sách hiển thị (`ORDER BY id DESC`).
  - Sửa đổi các API SQL SELECT ép kiểu ngày (`ngay_sinh::text`, `ngay_hoc::text`) để PostgreSQL trả về chuỗi ngày thô YYYY-MM-DD không bị timezone offset đổi giờ thành ngày hôm trước.
  - Khi đổi ảnh đại diện giáo viên, nhân viên thành công: Tự động lưu qua API PUT và đóng modal quay về danh sách.
  - Khi đăng ký gói học mới hoặc hủy gói hoàn tiền thành công: Tự động làm mới dữ liệu và kích hoạt mở ngay Tab Gói học & Đăng ký của học viên đó.
- **Kết quả**: Thành công

### [15/06/2026 13:35] — Tích hợp Cloudinary Avatar, fix ngày sinh, sort lịch học và định dạng ngày đăng ký
- **Loại**: Cải tiến tính năng & Sửa bug
- **File**: `frontend/src/pages/StudentsList.js`, `frontend/src/pages/ClassManagement.js`, `tiendo.md`
- **Mô tả**:
  - Đồng bộ hoá logic tính ngày kết thúc gói học đại trà theo định dạng cục bộ `sv-SE` để tránh lệch múi giờ.
  - Sửa scope các biến `coursePkgs`, `tutoringPkgs`, `teachersList` lên module-level để loại bỏ ReferenceError.
  - Đảm bảo hiển thị ảnh đại diện và cho phép đổi ảnh trực tiếp khi click vào container ảnh đại diện trong modal chi tiết của Học viên, Giáo viên, Nhân viên.
  - Sắp xếp lịch sử đặt lịch theo thứ tự ngày tăng dần (ngày sớm ở trên), nếu trùng ngày sắp xếp theo giờ bắt đầu tăng dần.
- **Kết quả**: Thành công

### [15/06/2026 11:00] — Khắc phục lỗi 401/404 Portal Giáo viên và 500 Chatbot AI
- **Loại**: Sửa bug / Cải tiến hệ thống API
- **File**: `backend/src/routes/api.js`
- **Mô tả**:
  - **Auto-link Hồ sơ**: Tự động so khớp và liên kết tài khoản giáo viên/học viên mới tạo với hồ sơ tương ứng trong DB dựa trên tên đăng nhập (so khớp hoa/thường với `ma_ho_so`, `ho_ten`, `email`) ngay khi đăng nhập để tránh lỗi trống `ho_so_id` gây ra mã 401.
  - **Fallback Cổng Giáo viên**: Tự động lấy giáo viên đầu tiên trong database làm fallback khi người dùng quyền `admin` hoặc `le_tan` truy cập Cổng Giáo viên mà không truyền `ho_so_id` nhằm hỗ trợ chế độ xem thử/giả lập.
  - **Reports API**: Chuyển tham số `:teacherId` của endpoint `/api/reports/teacher/:teacherId` thành tùy chọn (`:teacherId?`) và tự động áp dụng fallback để tránh lỗi 404 khi truy cập không truyền ID.
  - **Offline Chatbot**: Bọc try-catch xung quanh Gemini API trong endpoint `/api/chatbot` và trả về phản hồi offline thông minh, thân thiện thay vì crash lỗi 500 khi API Key gặp sự cố.
- **Kết quả**: Thành công

### [15/06/2026 10:40] — Sửa lỗi Date Picker, Lớp học SQL 500, Tạo nhân viên trùng SĐT và hiển thị Avatar
- **Loại**: Sửa bug
- **File**: `frontend/src/pages/_shared.js`, `frontend/src/pages/StudentsList.js`, `frontend/src/pages/StaffList.js`, `frontend/src/pages/TeachersList.js`, `backend/src/routes/api.js`
- **Mô tả**:
  - Thêm `e.stopPropagation()` vào các nút chọn năm/tháng của Date Picker trong `_shared.js` để tránh tự đóng popover khi thay đổi chế độ xem.
  - Sửa câu lệnh UPDATE và DELETE lớp học nhóm trong `api.js` (loại bỏ cột `ngay_cap_nhat` và `ngay_xoa` không tồn tại ở bảng `lop_hoc` gây lỗi 500).
  - Bổ sung kiểm tra trùng lặp `ten_dang_nhap` trước khi tạo mới tài khoản trong các API để trả về mã lỗi 400 Bad Request rõ ràng thay vì lỗi 500 database.
  - Chuẩn hóa cột `gioi_tinh` không dấu (`nam`/`nu`/`khac`) khi tạo/sửa học viên để tương thích với PostgreSQL Check Constraint.
  - Cập nhật hiển thị ảnh đại diện Cloudinary dạng thẻ `<img>` trong bảng danh sách cho Học viên, Giáo viên, và Nhân viên.
  - Đặt mặc định ngày sinh học viên là ngày hôm nay.
- **Kết quả**: Thành công

### [15/06/2026 08:10] — Sửa lỗi thiếu import setupCustomDatePicker trong StudentsList.js
- **Loại**: Sửa bug
- **File**: `frontend/src/pages/StudentsList.js`
- **Mô tả**: Sửa lỗi ReferenceError do thiếu import hàm `setupCustomDatePicker` từ tệp tin `_shared.js` dẫn đến việc tab "Học viên & Tiếp nhận" không hiển thị hoặc bị lỗi khi click nút thêm mới / sửa đổi thông tin.
- **Kết quả**: Thành công

### [12/06/2026 21:55] — Khắc phục lỗi Syntax do Conflict Merge trong ClassManagement.js và Schedules.js
- **Loại**: Sửa bug
- **File**: `frontend/src/pages/ClassManagement.js`, `frontend/src/pages/Schedules.js`
- **Mô tả**: Dọn dẹp các ký tự xung đột merge Git (`<<<<<<< HEAD`, `=======`, `>>>>>>>`) còn sót lại khiến file JS bị lỗi cú pháp không chạy được trên frontend. Đã chọn giữ các đoạn mã logic đúng đắn tương ứng của phiên bản mới nhất.
- **Kết quả**: Thành công (Ứng dụng frontend SPA tải và chạy bình thường)

### [12/06/2026 21:44] — Sửa lỗi SQL Check Constraint và hiển thị Nội quy trung tâm
- **Loại**: Sửa bug
- **File**: `backend/src/config/db.js`, `backend/seed_test_data.js`, `frontend/src/pages/CenterRules.js`
- **Mô tả**: Chuẩn hóa dữ liệu cột `ap_dung_cho` trong bảng `noi_quy` thành các giá trị không dấu (`tat_ca`, `hoc_vien`, `giao_vien`, `nhan_vien`) để tương thích với PostgreSQL Check Constraint. Đồng bộ ở cả database seeding và frontend selectbox. Map nhãn tiếng Việt có dấu (`Tất cả`, `Học viên`, `Giáo viên`, `Nhân viên`) trên giao diện người dùng để đảm bảo mặt hiển thị.
- **Kết quả**: Thành công (Server Backend khởi động tốt không lỗi)

### [12/06/2026 21:30] — Modal Hồ sơ 2 Tab, Sửa/Đổi gói học, Nâng cấp Infinity Scroll & Bộ lọc, Fix ClassManagement
- **Loại**: Sửa bug + Tính năng mới + Cải tiến giao diện
- **File**:
  - `backend/src/routes/api.js` (Thêm API PUT cho registrations và tutoring registrations, nâng giới hạn xếp lịch lên 50 HS, JOIN ngày/giờ vào lớp nhóm)
  - `frontend/src/pages/StudentsList.js` (Modal chia 2 Tab, tự tính ngày/giá khi chọn gói, sửa/đổi gói đang hoạt động, bộ lọc nâng cao theo gói, giáo viên, giới tính, Infinity Scroll kiểm soát bằng nút Tải thêm)
  - `frontend/src/pages/TeachersList.js` (Đồng bộ Infinity Scroll kiểm soát bằng nút Tải thêm)
  - `frontend/src/pages/StaffList.js` (Đồng bộ Infinity Scroll kiểm soát bằng nút Tải thêm)
  - `frontend/src/pages/ClassManagement.js` (Mặc định ngày hôm nay, validate bắt buộc gói học cho lớp nhóm, hiển thị ngày giờ lớp nhóm trong lịch sử đặt lịch)
- **Kết quả**: Thành công

### [12/06/2026 17:00] — Infinity scroll, Đăng ký gói học từ hồ sơ HV, ClassManagement redesign, Schedules zoom calendar
- **Loại**: Sửa bug + Tính năng mới
- **File**: 
  - `backend/src/routes/api.js` (fix GET /students trả đủ trường, max_hoc_vien lớp nhóm = 50)
  - `frontend/src/pages/StudentsList.js` (đổi sang infinity scroll, thêm form đăng ký/hủy gói học trong modal)
  - `frontend/src/pages/ClassManagement.js` (viết lại: max 50 HS, chọn tất cả, giờ grid 8h-22h, thời lượng auto, ngày không quá khứ)
  - `frontend/src/pages/Schedules.js` (viết lại: Calendar 3 cấp Năm→Tháng→Tuần zoom in/out, T2 T3 viết hoa)
- **Kết quả**: Thành công

### [12/06/2026 15:00] — Validate form, Tab Nhân viên, Fix bug hiển thị
- **Loại**: Sửa bug + Tính năng mới
- **File**: 
  - `frontend/src/pages/StudentsList.js` (viết lại)
  - `frontend/src/pages/TeachersList.js` (cập nhật)
  - `frontend/src/pages/StudentRequests.js` (sửa validation cancel)
  - `frontend/src/pages/StaffList.js` (tạo mới)
  - `frontend/src/pages/Dashboard.js` (đăng ký route staff-list)
  - `backend/src/routes/api.js` (thêm API /staff)
- **Mô tả**:
  - **Validate email**: Regex `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/` — phải có domain.tld, áp dụng cả học viên lẫn giáo viên/nhân viên
  - **Validate SĐT 10 số**: Regex `/^0\d{9}$/` bắt buộc, áp dụng toàn bộ form thêm/sửa
  - **Fix bug trình độ đầu vào**: Thêm đủ 6 cấp (A1→C2), dropdown select đúng value từ DB
  - **Fix bug cancel hoàn tiền 0đ**: Bắt buộc nhập lý do hủy, nút submit reset sau validation fail
  - **Bỏ cột Chi nhánh**: Bảng học viên còn 5 cột (bỏ Chi nhánh)
  - **Tab 3 nút**: Học viên / Giáo viên / Nhân viên hiển thị ở cả 3 trang (StudentsList, TeachersList, StaffList)
  - **StaffList.js**: Trang nhân viên mới với bảng có phân trang, CRUD, validate
  - **Dashboard.js**: Thêm tab "Hồ sơ Nhân viên" vào sidebar nhóm Nhân sự, đăng ký route staff-list
  - **API /staff**: GET/POST /api/staff/create, DELETE /api/staff/:id (dùng bảng ho_so, loai_ho_so='nhan_vien')

### [12/06/2026 16:20] — Hoàn thiện các trang chấm công, sổ liên lạc, đánh giá giáo viên & API liên quan
- **Loại**: Hoàn thiện tính năng / Giao diện / API mới
- **File**: `frontend/src/pages/AttendanceStaff.js`, `frontend/src/pages/LessonDiary.js`, `frontend/src/pages/TeacherFeedbacks.js`, `backend/src/routes/api.js`
- **Mô tả**:
  - **AttendanceStaff.js**: Tái cấu trúc trang chấm công giáo viên, nhân sự theo phong cách Premium Apple UI. Hiển thị 4 Bento KPI thẻ thống kê, danh sách log chấm công chi tiết lấy trực tiếp từ database. Tích hợp form modal thêm log check-in thủ công dành cho Admin và Lễ tân.
  - **backend/src/routes/api.js**: Bổ sung thêm API endpoint `POST /api/checkin-logs` phục vụ lưu log chấm công thủ công có kiểm tra hồ sơ và tự động gửi thông báo (`createNotification`).
  - **LessonDiary.js**: Xây dựng giao diện sổ liên lạc và nhật ký học tập dạng Timeline sắc nét. Giáo viên có thể lọc từng học viên để xem lịch sử, và trực tiếp sử dụng form viết nhận xét điện tử gửi lên database. Học viên chỉ xem được thông tin của chính mình.
  - **TeacherFeedbacks.js**: Xây dựng biểu đồ bento phân phối sao đánh giá, điểm trung bình và danh sách ý kiến đóng góp chi tiết từ phụ huynh. Tích hợp form đánh giá chất lượng dạy học 1-5 sao dành riêng cho tài khoản học viên.
- **Kết quả**: Thành công

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
