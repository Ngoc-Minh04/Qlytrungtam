### [25/06/2026 15:20] — Tái cấu trúc phân tách rõ ràng danh mục Học viên & Nhân sự (TeachersList.js, StaffList.js, StudentsList.js)
- **Loại**: Cải tiến cấu trúc & giao diện (UI/UX)
- **File**: `frontend/src/pages/StudentsList.js`, `frontend/src/pages/TeachersList.js`, `frontend/src/pages/StaffList.js`
- **Mô tả**: 
  * Loại bỏ các tab Giáo viên & Nhân viên khỏi menu con của trang danh sách Học viên. Thay bằng tiêu đề badge đơn giản "Quản lý Học viên".
  * Loại bỏ tab Học viên khỏi menu con của trang danh sách Giáo viên và Nhân viên (chỉ giữ lại 2 tab Giáo viên & Nhân viên để chuyển đổi qua lại bên trong khu vực Nhân sự).
  * Giúp giao diện sạch sẽ, chuyên nghiệp, phân tách rạch ròi giữa tệp khách hàng (học viên) và tệp nhân sự nội bộ trung tâm, tránh gây rối mắt cho người dùng.
- **Kết quả**: Thành công

### [25/06/2026 15:15] — Ẩn dòng "Đã thu" thừa khi học phí được đóng đủ (StudentRequests.js)
- **Loại**: Cải tiến giao diện (UI/UX)
- **File**: `frontend/src/pages/StudentRequests.js`
- **Mô tả**: Tối ưu hóa giao diện cột Học phí, chỉ hiển thị thêm dòng "Đã thu: ..." phụ khi số tiền thực thu khác biệt so với giá thực tế của khóa học (Ví dụ đóng thiếu hoặc thừa). Nếu học sinh đã đóng đủ 100% học phí, dòng này sẽ tự động ẩn đi để giao diện bảng gọn gàng hơn.
- **Kết quả**: Thành công

### [25/06/2026 15:13] — Việt hóa phương thức thanh toán ở danh sách xử lý yêu cầu (StudentRequests.js)
- **Loại**: Cải tiến giao diện (UI/UX)
- **File**: `frontend/src/pages/StudentRequests.js`
- **Mô tả**: Việt hóa hiển thị phương thức thanh toán thô trên bảng Đăng ký đang hoạt động (`tien_mat` thành "Tiền mặt", `chuyen_khoan` thành "Chuyển khoản") giúp giao diện đồng nhất và dễ đọc hơn.
- **Kết quả**: Thành công

### [25/06/2026 15:09] — Tối ưu giao diện form sửa ca học (ClassManagement.js)
- **Loại**: Cải tiến giao diện (UI/UX)
- **File**: `frontend/src/pages/ClassManagement.js`
- **Mô tả**:
  * Thu nhỏ padding tổng thể của Modal Chỉnh sửa ca học từ `p-6 space-y-4` xuống `p-4 space-y-2.5`, tăng giới hạn chiều cao tối đa lên `max-h-[92vh]`.
  * Thu nhỏ nút chọn giờ bắt đầu (`py-1.5`) và khoảng cách gap giữa các ô giờ học để chiếm ít không gian hơn.
  * Tái cấu trúc phần chân form: Gộp hai dòng **Thời lượng buổi học** và **Giờ kết thúc** thành Grid 2 cột giúp giảm 3 hàng thông tin dọc, giúp form hiển thị trọn vẹn trong một màn hình, không cần cuộn để ấn nút "Cập nhật lịch".
- **Kết quả**: Thành công

### [25/06/2026 14:58] — Việt hóa phương thức thanh toán và tối ưu chiều cao tab Gói học
- **Loại**: Cải tiến giao diện (UI/UX)
- **File**: `frontend/src/pages/StudentsList.js`
- **Mô tả**:
  * Chuyển đổi hiển thị phương thức thanh toán thô (ví dụ: `tien_mat`, `chuyen_khoan`, `the_ngan_hang`) sang tiếng Việt thân thiện ("Tiền mặt", "Chuyển khoản", "Thẻ ngân hàng") trên card "Gói đang hoạt động".
  * Gộp 3 trường thông tin cuối của form đăng ký mới gồm *Giá thực tế*, *Đã thu* và *Phương thức thanh toán* vào cùng một hàng ngang sử dụng CSS Grid 3 cột (`sm:grid-cols-3`) để tối ưu hóa chiều cao.
  * Giới hạn lại chiều cao tối đa của vùng cuộn nội dung tab Gói học (`max-h-[calc(90vh-140px)]`) và giảm bớt padding xuống `p-4`.
  * Sửa lỗi cơ chế chuyển tab: Sử dụng `classList` (`add('hidden')` / `remove('hidden')`) thay vì can thiệp trực tiếp bằng inline `style.display` (làm mất tác dụng các class `flex-col`, `overflow-hidden` vốn có của Tailwind CSS, khiến modal bị cuộn không mong muốn).
- **Kết quả**: Thành công

### [25/06/2026 14:44] — Nâng cấp thiết kế Modal viết nhận xét sang Grid 2 cột và Sticky Footer
- **Loại**: Cải tiến giao diện (UI/UX)
- **File**: `frontend/src/pages/LessonDiary.js`
- **Mô tả**:
  * Tăng chiều rộng tối đa của Modal nhận xét lên `max-w-2xl` để tối ưu diện tích ngang.
  * Tái thiết lập bố cục form nhập liệu: Nhóm các ô Textarea (Nội dung, Nhận xét, Bài tập, Ghi chú) song song sang dạng Grid 2 cột giúp giảm 40% chiều cao của modal.
  * Cố định nút "Lưu và gửi sổ liên lạc" ở chân modal (`Sticky Footer`) để luôn hiển thị, giúp giáo viên hoàn thành nhập liệu là có thể gửi ngay mà không cần trượt hay cuộn màn hình xuống dưới.
- **Kết quả**: Thành công

### [25/06/2026 14:38] — Khắc phục triệt để lỗi Sidebar đè lên modal nhận xét (Stacking Context)
- **Loại**: Sửa lỗi giao diện (UI/UX)
- **File**: `frontend/src/pages/LessonDiary.js`
- **Mô tả**:
  * Tích hợp cơ chế di chuyển động phần tử DOM: Khi người dùng bấm nút "Viết nhận xét", Javascript sẽ tự động chuyển (`document.body.appendChild`) thẻ modal `#diary-modal` ra ngoài cùng thẻ `body` để phá vỡ giới hạn Stacking Context của container nội dung bên phải.
  * Giúp lớp phủ mờ che phủ hoàn toàn 100% màn hình, kể cả phần logo và tiêu đề ở góc trên bên trái của Sidebar.
- **Kết quả**: Thành công

### [25/06/2026 14:37] — Tối ưu hóa z-index modal che hoàn toàn header sidebar
- **Loại**: Sửa lỗi giao diện (UI/UX)
- **File**: `frontend/src/pages/LessonDiary.js`
- **Mô tả**:
  * Tăng `z-index` của modal nhận xét từ `z-[9999]` lên `z-[99999]` để che mờ hoàn toàn logo và chữ Stellar Academy ở header của sidebar bên trái.
  * Tăng độ đậm lớp phủ tối mờ lên `bg-slate-900/60` để mang lại trải nghiệm tương phản chiều sâu chất lượng cao.
- **Kết quả**: Thành công

### [25/06/2026 14:35] — Khắc phục lỗi hiển thị lớp phủ mờ (z-index) và validation mặc định của Modal nhận xét
- **Loại**: Sửa lỗi giao diện (UI/UX)
- **File**: `frontend/src/pages/LessonDiary.js`
- **Mô tả**:
  * Tăng độ ưu tiên hiển thị (`z-index`) của modal nhận xét (`#diary-modal`) lên `z-[9999]` để đảm bảo lớp nền phủ mờ che phủ hoàn toàn 100% màn hình (bao gồm cả thanh Sidebar bên trái).
  * Thêm thuộc tính `novalidate` cho thẻ `<form id="create-diary-form">` để tắt hoàn toàn thông báo tooltip mặc định của trình duyệt, cho phép nhãn báo lỗi màu đỏ tự thiết kế và hiệu ứng rung lắc hoạt động hoàn hảo.
- **Kết quả**: Thành công

### [25/06/2026 14:33] — Cải tiến giao diện validation báo lỗi khi chưa chọn ca học (Sổ liên lạc)
- **Loại**: Cải tiến giao diện (UI/UX)
- **File**: `frontend/src/pages/LessonDiary.js`
- **Mô tả**:
  * Thiết kế lại cơ chế validation biểu mẫu viết nhận xét mới: Khi chưa chọn ca học mà nhấn nút Submit, Dropdown sẽ được highlight viền đỏ dày `border-red-500 ring-2 ring-red-100` đồng thời xuất hiện một nhãn báo lỗi màu đỏ kèm icon warning đẹp mắt ngay phía dưới.
  * Tích hợp hiệu ứng rung lắc (CSS Shake Animation) tác động lên toàn bộ Modal viết nhận xét để cảnh báo lỗi trực quan và chuẩn giao diện cao cấp.
  * Tự động ẩn nhãn báo lỗi và khôi phục viền ngay khi người dùng thực hiện chọn ca học.
- **Kết quả**: Thành công

### [25/06/2026 14:28] — Thêm thanh cuộn dọc tối đa (max-height) cho Yêu cầu đặt lịch học
- **Loại**: Cải tiến giao diện (UI/UX)
- **File**: `frontend/src/pages/StudentRequests.js`
- **Mô tả**:
  * Tích hợp thanh cuộn dọc nội bộ (`max-h-[500px]`, `overflow-y-auto`) cho bảng danh sách "Tất cả yêu cầu đặt lịch học" tại mục Đặt lịch học của tab Yêu cầu.
  * Cố định dòng tiêu đề bảng `thead` thành `sticky top-0 bg-white z-10` kèm lớp phủ mờ `backdrop-blur-sm` của iOS để giữ nguyên dòng tiêu đề cột khi người dùng thực hiện cuộn dữ liệu.
- **Kết quả**: Thành công

### [25/06/2026 14:27] — Loại bỏ tính năng phân trang vuốt ngang cho Hủy khóa học
- **Loại**: Cải tiến giao diện (UI/UX)
- **File**: `frontend/src/pages/StudentRequests.js`
- **Mô tả**:
  * Gỡ bỏ hoàn toàn logic phân trang vuốt ngang (`setupSwipePagination`) tại bảng "Danh sách đăng ký đang hoạt động" của tab xử lý hủy đăng ký khóa học.
  * Cho phép dữ liệu hiển thị toàn bộ và sử dụng thanh cuộn dọc nội bộ của card để cuộn tự nhiên, tránh xung đột trải nghiệm vuốt ngang.
- **Kết quả**: Thành công

### [25/06/2026 14:51] — Cố định nút "Đăng ký gói học này" xuống chân Modal (Sticky Footer)
- **Loại**: Cải tiến giao diện (UI/UX)
- **File**: `frontend/src/pages/StudentsList.js`
- **Mô tả**:
  * Di chuyển nút bấm "Đăng ký gói học này" từ trong form cuộn xuống khu vực chân modal cố định (ngang hàng với nút Đóng).
  * Tích hợp cơ chế hiển thị động: Nút đăng ký sẽ ẩn mặc định và chỉ xuất hiện ở footer khi người dùng nhấn "Mở form", giúp người dùng hoàn thành điền thông tin là bấm đăng ký được ngay mà không cần cuộn trang xuống.
- **Kết quả**: Thành công

### [25/06/2026 14:48] — Tối ưu hóa biểu mẫu Đăng ký gói học mới (StudentsList)
- **Loại**: Cải tiến giao diện (UI/UX)
- **File**: `frontend/src/pages/StudentsList.js`
- **Mô tả**:
  * Tăng chiều rộng tối đa của modal chi tiết học viên lên `max-w-3xl` để tạo không gian rộng rãi.
  * Tái thiết lập form đăng ký gói học mới (`#register-package-form-wrap`): Thay đổi giao diện nhập thông tin (chọn loại gói, thời hạn, giá thực tế, thực thu, phương thức thanh toán) sang Grid 2 cột song song.
  * Giúp giáo viên/nhân viên đăng ký nhanh chóng mà không cần trượt hay cuộn màn hình xuống dưới.
- **Kết quả**: Thành công

### [25/06/2026 14:24] — Thêm thanh cuộn dọc tối đa (max-height) cho Hủy khóa học (StudentRequests)
- **Loại**: Cải tiến giao diện (UI/UX)
- **File**: `frontend/src/pages/StudentRequests.js`
- **Mô tả**:
  * Chuyển đổi card "Danh sách đăng ký đang hoạt động" ở tab xử lý yêu cầu hủy khóa học sang dạng flexbox giới hạn chiều cao tối đa `max-h-[420px]` kèm thanh cuộn dọc `overflow-y-auto` riêng.
  * Cài đặt dòng tiêu đề bảng `thead` thành `sticky top-0 bg-white z-10` kèm lớp phủ mờ `backdrop-blur-sm` của iOS để giữ nguyên dòng tiêu đề cột khi người dùng thực hiện cuộn dữ liệu.
- **Kết quả**: Thành công

### [25/06/2026 14:21] — Thêm thanh cuộn dọc tối đa (max-height) cho Quản lý tài khoản
- **Loại**: Cải tiến giao diện (UI/UX)
- **File**: `frontend/src/pages/AccountManagement.js`
- **Mô tả**:
  * Đổi cấu trúc card chứa bảng tài khoản sang dạng flexbox giới hạn chiều cao tối đa `max-h-[550px]` và kích hoạt thanh cuộn dọc `overflow-y-auto` riêng.
  * Thiết lập dòng tiêu đề bảng `thead` thành `sticky top-0 bg-white z-10` kèm hiệu ứng kính mờ `backdrop-blur-sm` của iOS để giữ nguyên thanh tiêu đề khi cuộn danh sách tài khoản dài.
- **Kết quả**: Thành công

### [25/06/2026 14:20] — Đổi chiều cao cố định sang chiều cao tối đa cho Lịch sử thanh toán
- **Loại**: Cải tiến giao diện (UI/UX)
- **File**: `frontend/src/pages/RevenueReport.js`
- **Mô tả**:
  * Đổi chiều cao của card Lịch sử thanh toán từ cố định `h-[520px]` sang chiều cao tối đa `max-h-[520px]`.
  * Giúp bảng tự động thu gọn lại ôm khít lấy các dòng khi có ít dữ liệu (ví dụ ở bộ lọc "Hôm nay", "Hôm qua") để tránh khoảng trống trắng thừa ở dưới, và chỉ kích hoạt thanh cuộn khi số lượng dòng vượt quá chiều cao tối đa này.
- **Kết quả**: Thành công

### [25/06/2026 14:16] — Thêm thanh cuộn dọc cố định cho bảng Lịch sử thanh toán
- **Loại**: Cải tiến giao diện (UI/UX)
- **File**: `frontend/src/pages/RevenueReport.js`
- **Mô tả**:
  * Giới hạn chiều cao card "Chi tiết lịch sử thanh toán" ở mức `h-[520px]`.
  * Tích hợp thanh cuộn dọc (`overflow-y-auto`) riêng biệt cho bảng lịch sử để quản lý gọn gàng khi có hàng trăm giao dịch phát sinh.
  * Cài đặt `sticky top-0 z-10` cho tiêu đề bảng (`thead`) để giữ cố định tiêu đề cột khi người dùng thực hiện cuộn dữ liệu.
- **Kết quả**: Thành công

### [25/06/2026 14:08] — Thiết kế Bento Card gộp thống kê Điểm trung bình và Phân bổ xếp hạng
- **Loại**: Cải tiến giao diện (UI/UX)
- **File**: `frontend/src/pages/TeacherFeedbacks.js`
- **Mô tả**:
  * Gộp hai card "Điểm TB" và "Phân bổ xếp hạng" thành một card Bento lớn duy nhất.
  * Sử dụng grid `md:grid-cols-3` và bộ chia ngăn `divide-x` để phân chia cột: Điểm TB chiếm 1/3 (bên trái), biểu đồ phân bổ sao chiếm 2/3 (bên phải, giới hạn độ rộng thanh `max-w-md` tránh bị bè ngang).
  * Giải quyết hoàn toàn vấn đề trống trải và kéo dãn chiều ngang không mong muốn của cả 2 phần thống kê.
- **Kết quả**: Thành công

### [25/06/2026 14:05] — Thu gọn kích thước card Phân bổ xếp hạng sao
- **Loại**: Cải tiến giao diện (UI/UX)
- **File**: `frontend/src/pages/TeacherFeedbacks.js`
- **Mô tả**:
  * Giới hạn chiều rộng tối đa của các thanh tiến trình phân bổ sao (`max-w-md`) để tránh card bị bè ngang quá dài gây mất cân đối trên màn hình lớn.
  * Giảm padding và kích thước icon star của card thống kê tổng quan giúp bố cục phía trên gọn gàng và tinh tế hơn.
- **Kết quả**: Thành công

### [25/06/2026 14:03] — Tối ưu layout 60/40 và tích hợp thanh cuộn độc lập cho Đánh giá giáo viên
- **Loại**: Cải tiến giao diện (UI/UX)
- **File**: `frontend/src/pages/TeacherFeedbacks.js`
- **Mô tả**:
  * Đổi bố cục 2 card "Xếp hạng chất lượng giảng dạy" và "Tất cả nhận xét" sang dạng grid 2 cột song song (tỷ lệ 60/40) trên desktop để tận dụng tối đa chiều rộng màn hình.
  * Giới hạn chiều cao cố định của cả hai card ở mức `h-[480px]` và kích hoạt thanh cuộn dọc (`overflow-y-auto`) riêng biệt cho phần dữ liệu bên trong để người dùng cuộn xem độc lập không ảnh hưởng đến chiều cao trang.
  * Giảm padding của các ô dữ liệu trong bảng và các khung hội thoại nhận xét để tối ưu hóa không gian trống.
- **Kết quả**: Thành công

### [25/06/2026 13:55] — Chặn ca học tương lai, tự động tính số phút học thực tế và highlight báo lỗi modal nhận xét
- **Loại**: Cải tiến logic nghiệp vụ (Backend & Frontend)
- **File**: `backend/src/routes/api.js`, `frontend/src/pages/LessonDiary.js`
- **Mô tả**:
  - **Backend**: Thêm điều kiện `ngay_hoc <= CURRENT_DATE` vào SQL của API `GET /api/reports/unreviewed-sessions/:studentId` để lọc bỏ các ca học trong tương lai (ví dụ ca 22/07).
  - **Frontend**: 
    - Thêm hàm `calculateSessionMinutes` tính toán thời lượng chênh lệch giữa giờ bắt đầu và giờ kết thúc. Tự động điền số phút học thực tế khi người dùng chọn ca học tương ứng.
    - Tích hợp bôi đỏ viền (highlight) dropdown ca học và hiển thị cảnh báo lỗi bằng Toast khi submit form mà chưa chọn ca học.
- **Kết quả**: Thành công

### [25/06/2026 13:49] — Liên kết nhận xét Sổ liên lạc với Lịch học kèm/Lớp nhóm thực tế và tự động điền giáo viên
- **Loại**: Cải tiến logic nghiệp vụ & Nâng cấp hệ thống (Backend & Frontend)
- **File**: `backend/src/routes/api.js`, `frontend/src/pages/LessonDiary.js`
- **Mô tả**:
  - **Backend**:
    - Thêm cột `lich_hoc_nhom_id` vào bảng `so_lien_lac` và thực hiện migration tự động.
    - Định nghĩa API endpoint mới `GET /api/reports/unreviewed-sessions/:studentId` để lấy danh sách ca học chưa nhận xét.
    - Cập nhật route `POST /api/reports` để kiểm tra trùng lặp và tự động cập nhật trạng thái lịch học thành `'da_hoc'` sau khi lưu thành công.
  - **Frontend**:
    - Thêm dropdown "Chọn ca học cần nhận xét" và input hiển thị tên "Giáo viên giảng dạy" trong biểu mẫu tạo nhận xét mới.
    - Gọi API nạp danh sách ca học chưa nhận xét khi chọn học viên, tự động ánh xạ giáo viên thực tế đứng lớp và gửi ID ca học kèm/ca học nhóm lên backend.
- **Kết quả**: Thành công

### [25/06/2026 13:44] — Thiết lập thanh cuộn riêng biệt và gắn IntersectionObserver root cho card Sổ liên lạc
- **Loại**: Cải tiến giao diện (UI/UX) & Tối ưu logic render
- **File**: `frontend/src/pages/LessonDiary.js`
- **Mô tả**:
  - Giới hạn chiều cao card Sổ liên lạc ở mức `max-h-[650px]` và tạo container cuộn riêng biệt `overflow-y-auto` cho danh sách lịch sử nhận xét.
  - Cấu hình thuộc tính `root` của `IntersectionObserver` trỏ tới container cuộn này (`diary-timeline-container-scroll`) để kích hoạt tải thêm mượt mà khi cuộn bên trong card, thay vì phụ thuộc vào thanh cuộn của toàn trang.
- **Kết quả**: Thành công

### [25/06/2026 13:42] — Mở rộng w-full và nâng cấp thuật toán Cuộn vô hạn (Infinite Scroll) mượt mà
- **Loại**: Cải tiến giao diện (UI/UX) & Tối ưu logic render
- **File**: `frontend/src/pages/LessonDiary.js`
- **Mô tả**:
  - Chuyển đổi khung ngoài Sổ liên lạc sang dạng rộng toàn màn hình (`w-full`) để lấp đầy khoảng trống thừa hai bên, điều chỉnh độ rộng Sidebar rộng `lg:w-[280px]` để cân đối trên màn hình lớn.
  - Thiết kế lại cơ chế nạp của Sổ liên lạc: Thay thế cơ chế ghi đè toàn bộ `innerHTML` bằng cách nạp nối tiếp các phần tử mới bằng `insertAdjacentHTML('beforeend', ...)` giúp ngăn ngừa khựng/giật màn hình khi tải trang tiếp theo.
  - Tăng khoảng cách tải trước `rootMargin` lên `200px` để kích hoạt cuộn liên tục mượt mà.
- **Kết quả**: Thành công

### [25/06/2026 13:30] — Cải tiến khung nền Sổ liên lạc và cập nhật nhãn Người nhận xét
- **Loại**: Cải tiến giao diện (UI/UX)
- **File**: `frontend/src/pages/LessonDiary.js`
- **Mô tả**:
  - Đóng khung toàn bộ Sổ liên lạc vào thẻ card lớn mờ mịn (Glassmorphic Outer Card) với độ rộng tối ưu `max-w-5xl` giúp cân đối và sang trọng hơn trên màn hình rộng, tránh cảm giác trống trải hai bên.
  - Thay đổi nhãn thông tin thanh bên từ "GV dạy gần nhất" thành "Người nhận xét gần nhất" để phản ánh chính xác dữ liệu từ cơ sở dữ liệu.
- **Result**: Thành công

### [25/06/2026 13:21] — Thiết kế Sidebar tóm tắt học tập tận dụng không gian trống Sổ liên lạc
- **Loại**: Cải tiến giao diện (UI/UX)
- **File**: `frontend/src/pages/LessonDiary.js`
- **Mô tả**:
  - Tái thiết kế Sổ liên lạc học tập thành bố cục 2 cột chính-phụ: Cột trái chứa Timeline, cột phải (Sidebar) chứa thẻ Bento tóm tắt động (Tổng số phút học, số buổi nhận xét, Giáo viên dạy gần nhất) và thẻ trạng thái học tập tích cực, giúp tận dụng triệt để khoảng không gian trống hai bên trên màn hình lớn.
- **Kết quả**: Thành công

### [25/06/2026 13:19] — Giới hạn chiều ngang tối đa và căn giữa cho Sổ liên lạc học tập
- **Loại**: Cải tiến giao diện (UI/UX)
- **File**: `frontend/src/pages/LessonDiary.js`
- **Mô tả**:
  - Giới hạn chiều ngang tối đa của Sổ liên lạc ở mức `max-w-4xl` và căn giữa trang `mx-auto`, giúp các card hiển thị cân đối trên màn hình lớn và tránh kéo giãn chữ quá mức gây khó đọc.
- **Kết quả**: Thành công

### [25/06/2026 13:17] — Tối ưu hóa layout card Sổ liên lạc sang Grid 2 cột và compact spacing
- **Loại**: Cải tiến giao diện (UI/UX)
- **File**: `frontend/src/pages/LessonDiary.js`
- **Mô tả**:
  - Cấu trúc lại card nhật ký Sổ liên lạc: Chuyển đổi "Nội dung bài học" và "Nhận xét buổi học" sang dạng Grid 2 cột song song (trên máy tính) giúp tiết kiệm 40% chiều cao card, thu gọn khoảng cách padding card xuống `p-4` và box con xuống `p-2.5` để giảm không gian trống dư thừa, tạo cảm giác chuyên nghiệp như dashboard cao cấp.
- **Kết quả**: Thành công

### [25/06/2026 11:38] — Tích hợp tính năng cuộn vô hạn (Infinite Scroll) cho Sổ liên lạc học tập
- **Loại**: Cải tiến giao diện (UI/UX)
- **File**: `frontend/src/pages/LessonDiary.js`
- **Mô tả**:
  - Tích hợp Intersection Observer và render theo chunk động (mỗi lần 5 nhật ký) cho danh sách lịch sử nhận xét học viên tại Sổ liên lạc điện tử, mang đến trải nghiệm cuộn vô hạn mượt mà giống trang học viên và tránh quá tải DOM khi dữ liệu lịch sử lớn.
- **Kết quả**: Thành công

### [25/06/2026 11:32] — Nâng cấp đồng bộ giao diện Nội quy trung tâm chuẩn Apple Premium
- **Loại**: Cải tiến giao diện (UI/UX)
- **File**: `frontend/src/pages/CenterRules.js`
- **Mô tả**:
  - **Khung chứa & Tiêu đề**: Tái cấu trúc khung chứa tiêu đề và danh sách sang dạng Bento card kính mờ cao cấp với viền siêu mỏng `border-slate-100/80` và đổ bóng nhẹ.
  - **Danh mục nội quy**: Cải tiến tag đối tượng (Học viên, Giáo viên, Nhân viên) sang tông màu pastel dịu nhẹ và tinh giản các nút sửa/xóa thành dạng tròn tối giản.
  - **Modal**: Đồng bộ hóa modal Thêm/Sửa nội quy lên phong cách Apple Premium với góc bo tròn lớn `rounded-[28px]` và hiệu ứng `backdrop-blur-md` tinh tế.
- **Kết quả**: Thành công

### [25/06/2026 11:29] — Nâng cấp đồng bộ giao diện Quản lý tài khoản chuẩn Apple Premium
- **Loại**: Cải tiến giao diện (UI/UX)
- **File**: `frontend/src/pages/AccountManagement.js`
- **Mô tả**:
  - **iOS Segmented Control**: Chuyển đổi bộ lọc phân vai trò tài khoản sang kiểu trượt phân khúc iOS mượt mà.
  - **Bento Stats & Table**: Nâng cấp 4 thẻ thông số tài khoản và bảng danh sách sang phong cách kính mờ, viền siêu mỏng `border-slate-100/70`, avatar phối màu pastel dịu nhẹ theo từng vai trò.
  - **Modal**: Đồng bộ hóa cả 3 modal tạo mới, sửa và xem chi tiết sang góc bo tròn `rounded-[28px]` kết hợp hiệu ứng `backdrop-blur-md` sang trọng.
- **Kết quả**: Thành công

### [25/06/2026 11:22] — Nâng cấp đồng bộ giao diện Chất lượng đào tạo (Nhật ký & Dặn dò, Đánh giá) chuẩn Apple Premium
- **Loại**: Cải tiến giao diện (UI/UX)
- **File**: `frontend/src/pages/LessonDiary.js`, `frontend/src/pages/TeacherFeedbacks.js`
- **Mô tả**:
  - **iOS Segmented Control**: Cập nhật tab chuyển đổi giữa Sổ liên lạc và Ghi chú dặn dò giáo viên sang kiểu trượt phân khúc iOS.
  - **Nhật ký & Ghi chú dặn dò**: Timeline được định dạng lại với các đường line và bullet siêu mảnh, hộp đựng dặn dò đổi sang màu vàng nhạt pastel Glassmorphic dịu nhẹ. Các select filter và button "Thêm dặn dò" được bo tròn nhẵn mịn.
  - **Đánh giá giáo viên**: Nâng cấp các biểu đồ xếp hạng, bento cards phân bổ sao và hộp thoại phản hồi của học sinh sang kiểu kính mờ Apple tinh khiết.
  - **Modal**: Đồng bộ hóa góc bo các modal tạo mới/sửa dặn dò rộng `rounded-[28px]`, phủ bóng và backdrop blur.
- **Kết quả**: Thành công

### [25/06/2026 11:15] — Nâng cấp đồng bộ giao diện Chấm công & Tính lương phụ cấp chuẩn Apple Premium
- **Loại**: Cải tiến giao diện (UI/UX)
- **File**: `frontend/src/pages/AttendanceStaff.js`, `frontend/src/pages/SalaryManagement.js`
- **Mô tả**:
  - **iOS Segmented Control**: Chuyển đổi tab chấm công sang kiểu trượt phân khúc chuẩn iOS với nền mờ.
  - **KPI Bento Cards & Grid**: Tinh chỉnh 4 thẻ KPI chấm công và 4 thẻ quỹ lương sang phong cách kính mờ bo tròn mềm mại.
  - **Bảng dữ liệu lượt quét & tính lương**: Định dạng lại bảng với viền siêu mỏng `border-slate-100`, tag trạng thái màu dịu (Emerald/Amber), và các input phụ cấp/khấu trừ bo tròn mềm mịn, đổi màu viền khi focus.
  - **Modal**: Đồng bộ hóa góc bo modal `rounded-[28px]` với lớp backdrop-blur-md chất lượng cao.
- **Kết quả**: Thành công

### [25/06/2026 11:06] — Nâng cấp đồng bộ giao diện Học viên, Giáo viên & Nhân viên chuẩn Apple Premium
- **Loại**: Cải tiến giao diện (UI/UX)
- **File**: `frontend/src/pages/StudentsList.js`, `frontend/src/pages/TeachersList.js`, `frontend/src/pages/StaffList.js`
- **Mô tả**:
  - **iOS Segmented Control**: Nâng cấp thanh điều hướng 3 nút phụ sang phong cách trượt phân khúc của iOS với viền mờ tinh xảo và bóng đổ nhẹ ở nút được chọn.
  - **Bảng dữ liệu & Avatar**: Loại bỏ các nét viền bảng thô ráp, đổi màu nền tiêu đề bảng và thiết kế avatar nhân sự sang gradient/pastel nhẹ tạo cảm giác vô cùng sạch sẽ.
  - **Bộ lọc & Nút bấm**: Cải tiến dropdown select và ô tìm kiếm sang kiểu bo tròn hoàn toàn (rounded-full) với tông nền nhẹ của iOS. Nút "Hủy khóa" và "Xóa" được thay thế bằng pill-buttons màu đỏ hồng pastel dịu mắt.
  - **Modal**: Đồng bộ thiết kế modal tạo mới với góc bo tròn rộng `rounded-[28px]`, hiệu ứng bóng đổ sâu và backdrop blur mượt mà.
- **Kết quả**: Thành công

### [25/06/2026 10:59] — Nâng cấp giao diện Lớp học & Xếp lịch chuẩn Apple Premium
- **Loại**: Cải tiến giao diện (UI/UX)
- **File**: `frontend/src/pages/ClassManagement.js`
- **Mô tả**:
  - **Form bên trái**: Đổi màu nền từ xám thô sang trắng ngọc phối hợp viền mỏng tinh khiết, bo góc tròn rộng. Các ô input, select chuyển sang phong cách iOS (`bg-slate-50/50`).
  - **Lưới chọn giờ (Time grid)**: Làm lại các ô nút chọn giờ với viền mỏng mượt mà, các nút active đổi thành gradient xanh dương mượt, bỏ đi viền đen thô cũ.
  - **Danh sách học sinh & badges**: Làm lại danh sách chọn học viên và các pill-badge học sinh đã chọn thành các viên thuốc bo tròn cao cấp với hiệu ứng đổ bóng nhẹ.
- **Kết quả**: Thành công

### [25/06/2026 10:55] — Nâng cấp giao diện Quản lý gói học đại trà & gói học kèm 1-1 chuẩn Apple Premium
- **Loại**: Cải tiến giao diện (UI/UX)
- **File**: `frontend/src/pages/CoursePackages.js`, `frontend/src/pages/TutoringPackages.js`
- **Mô tả**:
  - **Thẻ gói học**: Thiết kế lại với bo góc `rounded-2xl`, bổ sung bóng đổ mịn mượt và viền mờ cao cấp (`border-slate-100`). Thêm đường viền chỉ thị gradient khẽ phía trên đầu (màu xanh dương cho đại trà, xanh ngọc cho học kèm).
  - **Học phí & thông tin**: Chữ số học phí to đậm nổi bật, các thông tin phụ như số buổi/thời hạn được phân cấp trực quan hơn.
  - **Nút bấm & Modal**: Thay đổi toàn bộ các nút sửa/xóa và nút trong modal sang dạng bo tròn hoàn chỉnh (rounded-full), thiết kế hộp thoại (modal) có góc bo rộng `rounded-[28px]` với lớp phủ backdrop blur đẳng cấp.
- **Kết quả**: Thành công

### [25/06/2026 10:53] — Nâng cấp giao diện Lượt vào ra (CheckinLogs) chuẩn Apple Premium
- **Loại**: Cải tiến giao diện (UI/UX)
- **File**: `frontend/src/pages/CheckinLogs.js`
- **Mô tả**:
  - **Khung nhật ký & nút bấm**: Chuyển đổi khung xám thô cũ sang nền trắng thanh lịch phối hợp viền mờ siêu mỏng, bo góc rộng, nút bấm gradient Apple-style.
  - **Thẻ nhật ký quét (Log Cards)**: Thiết kế lại với bóng đổ mịn màng, loại bỏ vạch màu thô, tích hợp đèn tín hiệu (Status Pulse Indicator) nhấp nháy phát sáng (xanh lá cho CHECK-IN, đỏ hồng cho CHECK-OUT).
  - **Modal Quét QR**: Nâng cấp hiệu ứng bo góc cực rộng `rounded-[28px]` chuẩn Apple, cải tiến khung Camera quét QR và các ô nhập thủ công sang phong cách hiện đại.
- **Kết quả**: Thành công

### [25/06/2026 10:51] — Nâng cấp giao diện Thời khóa biểu (Schedules) chuẩn Apple Premium
- **Loại**: Cải tiến giao diện (UI/UX)
- **File**: `frontend/src/pages/Schedules.js`
- **Mô tả**:
  - **Lưới lịch tuần**: Làm mềm dịu các đường viền ngăn cách (đổi từ `border-apple-divider/40` sang `border-slate-100/70`), tạo cảm giác thoáng đãng và thanh lịch.
  - **Thẻ lớp học**: Thiết kế lại với bo góc `rounded-lg`, tăng độ tương phản nhẹ và thêm viền trái nổi bật (`border-l-[3.5px]`) tương ứng với từng trạng thái học (xanh lá cho Đã học, đỏ hồng cho Vắng, vàng hổ phách cho Chờ học).
  - **Bảng ca học chi tiết**: Định dạng cột trạng thái thành các huy hiệu (badge) bo tròn thời thượng kèm dấu chấm tròn trạng thái tinh tế.
- **Kết quả**: Thành công

### [25/06/2026 10:45] — Nâng cấp giao diện trang Tổng quan chuẩn Bento Grid Apple Premium
- **Loại**: Cải tiến giao diện (UI/UX)
- **File**: `frontend/src/pages/Overview.js`
- **Mô tả**:
  - **Bento Row 1**: Bo tròn góc rộng (`rounded-3xl`), nâng kích thước padding và icon, thêm đổ bóng mềm mượt (`shadow-sm`) và hiệu ứng hover phóng to nhẹ có chiều sâu.
  - **Card Doanh thu lớn**: Thiết kế lại theo phong cách Dark Luxury hiện đại (tông màu đen mờ sâu `from-[#1c1d21] to-[#343538]`), nâng cấp thiết kế các thẻ thông số doanh thu bên trong.
  - **Rating & Yêu cầu học viên**: Tái thiết kế các thành phần con với đường viền mờ ảo, màu sắc dịu nhẹ, chuyên nghiệp như widget hệ điều hành iOS.
- **Kết quả**: Thành công

### [25/06/2026 10:41] — Thiết kế lại giao diện Báo cáo Doanh thu chuẩn Apple-style Premium
- **Loại**: Cải tiến giao diện (UI/UX)
- **File**: `frontend/src/pages/RevenueReport.js`
- **Mô tả**:
  - **Metric Cards**: Thiết kế lại 3 card thông số (Tổng, Đại trà, Học kèm) thành giao diện bento với hiệu ứng gradient mờ nhẹ (glassmorphic), bổ sung các icon chuyên nghiệp tương ứng của hệ thống Apple.
  - **Lịch sử giao dịch**: Định dạng lại phương thức thanh toán có icon trực quan (atm cho Chuyển khoản, hóa đơn cho Tiền mặt). Cải tiến dòng giao dịch bị hủy: gạch ngang tên/tiền, nền đỏ dịu (`bg-red-50/10`) để phân biệt trực quan và làm dịu mắt người dùng.
- **Kết quả**: Thành công

### [25/06/2026 10:37] — Tối ưu hóa UI Chatbot: Tự động ẩn nút FAB khi mở khung chat
- **Loại**: Cải tiến trải nghiệm người dùng (UX/UI)
- **File**: `frontend/src/pages/Chatbot.js`
- **Mô tả**: Thay thế logic thay đổi icon của nút FAB (`stella-fab`) thành ẩn hẳn nút FAB này đi khi khung chat (`stella-panel`) đang hiển thị. Điều này giúp giao diện gọn gàng hơn, không bị hiển thị thừa nút tròn có icon dấu nhân (X) khi khung chat đã có nút đóng (X) tích hợp ở header.
- **Kết quả**: Thành công

### [25/06/2026 10:18] — Khắc phục độ trễ (lag) khi kéo thả di chuyển chatbot Stella AI
- **Loại**: Tối ưu hóa hiệu năng trải nghiệm người dùng (UX)
- **File**: `frontend/src/pages/Chatbot.js`
- **Mô tả**: Tắt thuộc tính CSS `transition` tạm thời (gán `transition = 'none'`) ngay khi bắt đầu hành động kéo thả (`mousedown`/`touchstart`) và khôi phục lại khi kết thúc hành động (`mouseup`/`touchend`). Giúp chatbot di chuyển mượt mà lập tức theo con trỏ chuột/tay vuốt mà không bị trễ (delay 200ms do transition CSS).
- **Kết quả**: Thành công

### [25/06/2026 10:08] — Cung cấp tính năng kéo thả (drag & drop) di chuyển chatbot Stella AI
- **Loại**: Cải tiến trải nghiệm người dùng (UX)
- **File**: `frontend/src/pages/Chatbot.js`
- **Mô tả**: Tích hợp tính năng kéo thả chuột / cảm ứng màn hình cho cả nút tròn Chatbot (`#stella-fab`) và hộp thoại chat (`#stella-panel` - kéo phần Header). Giúp người dùng dễ dàng di chuyển chatbot tránh che khuất thông tin số liệu quan trọng trên màn hình.
- **Kết quả**: Thành công

### [25/06/2026 10:06] — Sửa lỗi đếm sai lượt đăng ký gói học phổ biến nhất (loại bỏ trạng thái đã hủy)
- **Loại**: Sửa lỗi logic Backend
- **File**: `backend/src/routes/api.js`
- **Mô tả**: Thay đổi câu lệnh SQL truy vấn gói bán chạy nhất (`bestSellerQuery`) tại API `/api/reports/revenue` để loại bỏ luôn các gói đăng ký đã bị hủy (`trang_thai = 'huy'`). Giúp thống kê hiển thị chính xác số lượng học viên đăng ký thực tế.
- **Kết quả**: Thành công

### [25/06/2026 09:56] — Sửa lỗi hiển thị fallback 100% hình thức thanh toán khi doanh thu bằng 0
- **Loại**: Sửa lỗi giao diện (UI/UX)
- **File**: `frontend/src/pages/RevenueReport.js`
- **Mô tả**: Sửa công thức tính phần trăm ở Frontend để hiển thị đúng `0%` cho cả Chuyển khoản và Tiền mặt khi tổng doanh thu trong kỳ lọc bằng 0. Tránh bị fallback hiển thị 100% Chuyển khoản sai lệch thực tế.
- **Kết quả**: Thành công

### [25/06/2026 09:48] — Bổ sung tính năng Xuất báo cáo Doanh thu Excel/CSV & Biểu đồ thanh toán thực tế
- **Loại**: Thêm mới tính năng & Sửa logic hiển thị
- **File**: `backend/src/routes/api.js`, `frontend/src/pages/RevenueReport.js`
- **Mô tả**:
  - **Backend**: Thêm API `/api/reports/revenue/export` cho phép xuất toàn bộ giao dịch thanh toán trong khoảng thời gian lọc ra file CSV (sử dụng UTF-8 BOM để Excel đọc đúng tiếng Việt). Bổ sung truy vấn tính tổng thực tế của Chuyển khoản vs Tiền mặt trả về trong `/api/reports/revenue`.
  - **Frontend**: Thêm nút "Xuất Excel" màu xanh Apple-style. Đồng bộ Doughnut Chart vẽ tỉ lệ phương thức thanh toán thực tế thay vì hardcode 80%/20% như trước.
- **Kết quả**: Thành công

### [25/06/2026 09:20] — Thu gọn kích thước card gói học phí đại trà và gói học kèm
- **Loại**: Chỉnh sửa giao diện (UI/UX)
- **File**: `frontend/src/pages/CoursePackages.js`, `frontend/src/pages/TutoringPackages.js`
- **Mô tả**: Tinh chỉnh lại các class CSS Tailwind (giảm padding từ p-4/p-6 xuống p-3, giảm spacing từ space-y-2.5/space-y-4 xuống space-y-1.5, thu nhỏ kích thước chữ tiêu đề và giá tiền) để hiển thị card gói học nhỏ gọn và thanh thoát hơn. Đã xác thực biên dịch JavaScript thành công và không lỗi cú pháp.
- **Kết quả**: Thành công

### [25/06/2026 09:02] — Sửa lỗi mất padding card gói học (sửa p-4.5 thành p-5)
- **Loại**: Sửa lỗi giao diện (UI/UX)
- **File**: `frontend/src/pages/CoursePackages.js`, `frontend/src/pages/TutoringPackages.js`
- **Mô tả**: Thay thế class padding không tồn tại trong Tailwind (`p-4.5`) thành class hợp lệ (`p-5`) giúp card gói học hiển thị khoảng lề đệm cân xứng, viền bo tròn góc không bị tràn chữ ra ngoài.
- **Kết quả**: Thành công

### [25/06/2026 08:58] — Thu gọn kích thước card hiển thị gói học đại trà và gói học kèm
- **Loại**: Chỉnh sửa giao diện (UI/UX)
- **File**: `frontend/src/pages/CoursePackages.js`, `frontend/src/pages/TutoringPackages.js`
- **Mô tả**: Tiến hành tối ưu hóa giao diện hiển thị danh sách gói học phí. Giảm padding từ p-6 xuống p-4.5, đổi bo tròn góc từ rounded-3xl thành rounded-2xl, thu nhỏ cỡ chữ của tiêu đề gói học từ text-base xuống text-sm và mức giá từ text-xl xuống text-base để tổng thể card gói học gọn gàng, thanh thoát hơn theo phản hồi từ người dùng. Giữ nguyên 100% logic JavaScript xử lý CRUD.
- **Kết quả**: Thành công

### [25/06/2026 08:40] — Sửa lỗi xuất báo cáo chấm công tháng (CSV) bị lỗi quyền truy cập 403
- **Loại**: Sửa bug
- **File**: `backend/src/routes/api.js`, `frontend/src/pages/AttendanceStaff.js`
- **Mô tả**: Sửa lỗi 403 Forbidden khi xuất file báo cáo chấm công. Do trình duyệt chuyển hướng trực tiếp bằng `window.location.href` không đính kèm custom headers xác thực. Đã thay đổi Frontend truyền thêm `role` qua URL query parameters và cập nhật Backend chấp nhận xác thực phân quyền qua query parameter này cho riêng API tải file.
- **Kết quả**: Thành công

### [25/06/2026 08:28] — Sửa lỗi hiển thị font chữ UTF-8 của Stella AI
- **Loại**: Sửa bug
- **File**: `backend/src/routes/api.js`
- **Mô tả**: Thay đổi cơ chế nhận dữ liệu stream từ Groq API. Sử dụng Buffer thô gom các mảnh dữ liệu (chunks) rồi mới giải mã UTF-8 thông qua `Buffer.concat()`, khắc phục triệt để lỗi vỡ font chữ (hiển thị ký tự lạ dạng hỏi chấm đen) khi truyền tải các emoji hoặc chữ tiếng Việt có dấu.
- **Kết quả**: Thành công

### [25/06/2026 08:26] — Cải tiến logic Logout để bảo toàn lịch sử chat Stella AI
- **Loại**: Cải tiến tính năng
- **File**: `frontend/src/pages/Dashboard.js`, `frontend/src/pages/StudentPortal.js`, `frontend/src/pages/TeacherPortal.js`
- **Mô tả**: Thay thế lệnh `localStorage.clear()` bằng phương án xóa chọn lọc các key liên quan đến phiên đăng nhập (như `isLoggedIn`, `userRole`, `username`, v.v.). Việc này giúp bảo vệ và giữ lại lịch sử chat Stella AI cùng trạng thái cấu hình cá nhân của người dùng không bị xóa sạch khi đăng xuất.
- **Kết quả**: Thành công

### [25/06/2026 08:21] — Lưu trữ lịch sử chat của Stella AI vào LocalStorage theo từng tài khoản
- **Loại**: Cải tiến tính năng
- **File**: `frontend/src/pages/Chatbot.js`
- **Mô tả**: Thiết lập cơ chế lưu trữ lịch sử chat của Stella AI trong bộ nhớ trình duyệt `localStorage`. Phân tách khóa lưu trữ (`storageKey`) theo thông tin người dùng đang đăng nhập để tránh lẫn lộn lịch sử chat giữa các tài khoản khác nhau trên cùng một máy tính. Tự động tải lại lịch sử tin nhắn cũ khi mở widget chatbot.
- **Kết quả**: Thành công

### [25/06/2026 08:17] — Tích hợp gói học vào Chatbot Stella AI & Phân quyền doanh thu
- **Loại**: Chỉnh sửa tính năng / Sửa bug
- **File**: `backend/src/routes/api.js`
- **Mô tả**: Tải thông tin các gói học phí đại trà (goi_hoc_phi) và các gói dạy kèm (goi_hoc_kem) từ database và truyền trực tiếp vào context của Stella AI để trả lời người dùng khi được hỏi. Đồng thời, cấu hình phân quyền dữ liệu nhạy cảm (doanh thu trung tâm, thống kê học viên/giáo viên) chỉ dành riêng cho tài khoản Admin và Lễ tân.
- **Kết quả**: Thành công

### [24/06/2026 20:02] — Sửa lỗi 500 khi ghi nhận lượt quét check-in thủ công cho nhân sự
- **Loại**: Sửa bug logic Backend & Frontend
- **File**: `backend/src/routes/api.js`, `frontend/src/pages/AttendanceStaff.js`
- **Mô tả**:
  - **Frontend**: Cập nhật dropdown phương thức chấm công trong modal từ giá trị `"van_tay"` không hợp lệ sang các giá trị hợp lệ với CHECK constraint của CSDL như `"thu_cong"`, `"the_tu"`, `"qr_code"`, `"khuon_mat"`.
  - **Backend**: Xóa bỏ route `POST /checkin-logs` trùng lặp đầu tiên ở dòng 2005. Sửa đổi giá trị mặc định của `phuong_thuc` khi bị null từ `"van_tay"` thành `"thu_cong"` để tránh vi phạm check constraint của cơ sở dữ liệu.
- **Kết quả**: Thành công

### [24/06/2026 19:58] — Loại bỏ trùng lặp route checkin-logs
- **Mô tả**: Xóa bỏ định nghĩa route `GET /checkin-logs` trùng lặp đầu tiên (dòng 2004) vốn giới hạn dữ liệu ở LIMIT 100 và thiếu các trường định dạng ngày giờ. Việc này giúp giữ lại route chuẩn xác ở dưới (dòng 5406) trả về đầy đủ thông tin log check-in/out, giải quyết xung đột route gây lỗi 500 cục bộ trên trình duyệt.
- **Kết quả**: Thành công

### [24/06/2026 16:23] — Cập nhật cơ chế đăng nhập không phân biệt hoa thường và reset mật khẩu Admin
- **Mô tả**: Reset mật khẩu của tài khoản `Admin` về mật khẩu mặc định `123456`. Đồng thời, tối ưu câu lệnh SQL xác thực đăng nhập sử dụng hàm `LOWER()` để hỗ trợ đăng nhập không phân biệt chữ hoa, chữ thường cho tên tài khoản (ví dụ: gõ `admin` hay `Admin` đều hợp lệ).
- **Kết quả**: Thành công

### [24/06/2026 16:18] — Điều chỉnh tỷ lệ cột và chống tràn nhãn trạng thái trang Lớp học & Xếp lịch
- **Loại**: Chỉnh sửa giao diện (UI/UX)
- **File**: `frontend/src/pages/ClassManagement.js`
- **Mô tả**: Điều chỉnh tỷ lệ grid cột từ 4:6 sang 3:7 (card Đăng ký lịch dạy chiếm 3 phần, card Lịch sử đặt lịch chiếm 7 phần) để tăng không gian hiển thị danh sách lớp học. Đồng thời thêm thuộc tính `whitespace-nowrap` vào cột Trạng thái để ngăn chặn nhãn "Đang hoạt động/Đang tiến hành" bị xuống dòng khi co giãn màn hình.
- **Kết quả**: Thành công

### [24/06/2026 11:56] — Lọc bỏ học viên và giáo viên đã xóa khỏi số liệu thống kê của Chatbot
- **Loại**: Sửa bug logic Backend
- **File**: `backend/src/routes/api.js`
- **Mô tả**: Cập nhật câu SQL SELECT đếm số học viên và giáo viên trong API `/api/chatbot` bằng cách thêm điều kiện `is_deleted = 0`, giúp số lượng học sinh/giáo viên chatbot báo cáo khớp chính xác với Dashboard.
- **Kết quả**: Thành công

### [24/06/2026 11:52] — Khởi động lại Server Backend trung tâm
- **Loại**: Vận hành hệ thống
- **File**: Không có (Khởi chạy process)
- **Mô tả**: Phát hiện tiến trình cũ chạy ngầm bị cache code, đã giải phóng port 3006 và chạy lại `npm run dev` bằng Nodemon để đồng bộ code mới của API chatbot.
- **Kết quả**: Thành công

### [24/06/2026 11:50] — Cung cấp thêm số liệu doanh thu Hôm nay, Hôm qua, Tuần này cho Chatbot
- **Loại**: Sửa bug logic Backend
- **File**: `backend/src/routes/api.js`
- **Mô tả**: Bổ sung các câu truy vấn và đưa thông tin doanh thu Hôm nay, Hôm qua, Tuần này vào context truyền cho chatbot Stella AI. Giúp chatbot trả lời chính xác từng mốc thời gian khi được hỏi.
- **Kết quả**: Thành công

### [24/06/2026 11:47] — Đồng bộ doanh thu thực tế cho Chatbot Stella AI
- **Loại**: Sửa bug logic Backend
- **File**: `backend/src/routes/api.js`
- **Mô tả**: Cập nhật các câu truy vấn doanh thu trong API `/api/chatbot` để tính gộp dữ liệu từ cả 2 bảng `dang_ky_khoa_hoc` (khóa học đại trà) và `dang_ky_hoc_kem` (học kèm), giúp chatbot trả lời khớp chính xác với số liệu thực tế hiển thị trên Dashboard.
- **Kết quả**: Thành công

### [24/06/2026 11:12] — Chuyển đổi Chatbot AI sang Groq
- **Loại**: Chỉnh sửa cấu hình & Code chatbot
- **File**: `backend/.env`, `backend/src/routes/api.js`, `frontend/src/pages/Chatbot.js`
- **Mô tả**: Tích hợp Groq API Key mới hoạt động ổn định và thay thế hoàn toàn Gemini API (đang bị giới hạn quota 0 ở khu vực EU) để chatbot có thể trò chuyện bình thường. Sử dụng model llama-3.3-70b-versatile của Groq.
- **Kết quả**: Thành công

### [24/06/2026 09:34] — Cho phép giáo viên điểm danh sớm 30 phút
- **Loại**: Cập nhật logic nghiệp vụ (Feature Update)
- **File**: `frontend/src/pages/TeacherPortal.js`
- **Mô tả**:
  - Chỉnh sửa hàm `isTimeToShowAttendance` cho phép giáo viên điểm danh học viên trước giờ bắt đầu lớp học tối đa 30 phút thay vì phải đợi đúng giờ như trước.
  - Cập nhật lại các thông báo Toast cảnh báo lỗi khi bấm điểm danh quá sớm để phản ánh đúng thông tin logic mới.
- **Kết quả**: Thành công

### [23/06/2026 14:46] — Thay đổi model Gemini và cập nhật API Key
- **Loại**: Cấu hình hệ thống & Tương thích API
- **File**: `backend/src/routes/api.js`, `backend/.env`
- **Mô tả**:
  - Cập nhật model Gemini trong API `/api/chatbot` sang dùng dòng model mới nhất `gemini-2.0-flash` để tương thích tốt nhất với API Key AI Studio mới được cấp.
  - Cập nhật biến môi trường `GEMINI_API_KEY` mới của người dùng vào cấu hình `.env` của backend.
- **Kết quả**: Thành công

### [23/06/2026 14:28] — Sửa lỗi thiếu trigger mở hiển thị popup QR Code trong Đăng ký khóa học
- **Loại**: Sửa lỗi giao diện (Bug Fix)
- **File**: `frontend/src/pages/CourseRegistrations.js`
- **Mô tả**:
  - Khắc phục lỗi popup hiển thị mã QR VietQR PayOS bị vô hình (vẫn chèn HTML nhưng không xóa class `pointer-events-none` và `opacity-0` để kích hoạt hiệu ứng CSS hiện lên).
  - Đã thêm hàm `setTimeout` kích hoạt mở lớp phủ hiển thị popup QR ngay sau khi tải xong thông tin link thanh toán thành công.
- **Kết quả**: Thành công

### [23/06/2026 14:22] — Tích hợp thanh toán QR VietQR PayOS khi mua gói mới tại Hồ sơ học viên
- **Loại**: Phát triển tính năng mới & Cải tiến trải nghiệm (UI/UX)
- **File**: `frontend/src/pages/StudentsList.js`
- **Mô tả**:
  - Viết hàm `triggerPayOSPayment()` hỗ trợ gọi API backend lấy link thanh toán và hiển thị popup QR Code tự động kèm theo số tiền và nội dung chuyển khoản.
  - Thêm cơ chế polling kiểm tra trạng thái thanh toán từ backend mỗi 2 giây. Khi thanh toán thành công, hệ thống tự động tắt popup QR, lưu thông tin gói học vào CSDL và hiển thị hóa đơn thành công.
  - Lắng nghe sự thay đổi trên dropdown phương thức thanh toán `#reg-phuong-thuc` (khi chọn "Chuyển khoản" sẽ mở QR VietQR) và nút đăng ký `#btn-submit-register-pkg`.
- **Kết quả**: Thành công

### [23/06/2026 14:15] — Tích hợp biên lai thanh toán thành công và tự động chuyển hướng chi tiết học viên
- **Loại**: Cải tiến trải nghiệm người dùng (UI/UX) & Phát triển tính năng mới
- **File**: `frontend/src/pages/CourseRegistrations.js`, `frontend/src/pages/StudentsList.js`
- **Mô tả**:
  - **CourseRegistrations.js**: Bổ sung hàm hiển thị Biên lai thanh toán thành công (`showSuccessReceipt`) khi thanh toán chuyển khoản PayOS hoặc đóng học phí bằng tiền mặt hoàn tất. Biên lai hiển thị đầy đủ thông tin: Mã giao dịch, Tên học viên, Tên gói, Số tiền thực thu, Phương thức và Thời gian. Hỗ trợ nút điều hướng nhanh "Đến hồ sơ học viên".
  - **StudentsList.js**: Tích hợp cơ chế tự động phát hiện `auto_open_student_id` từ `sessionStorage` khi chuyển từ trang biên lai sang. Hệ thống sẽ tự động tìm kiếm học viên trong danh sách và kích hoạt bật Modal chi tiết học viên, giúp đồng bộ hiển thị và giải quyết triệt để phản hồi "học viên chưa được nhận gói học".
- **Kết quả**: Thành công

### [23/06/2026 14:03] — Khắc phục lỗi quét mã QR MoMo/Ngân hàng (VietQR Format)
- **Loại**: Cải tiến tính năng & Sửa lỗi hiển thị (UI/UX)
- **File**: `backend/src/routes/api.js`, `frontend/src/pages/CourseRegistrations.js`
- **Mô tả**:
  - **Backend**: Cập nhật API trả về thêm chuỗi `qrCode` (VietQR) được cung cấp bởi PayOS.
  - **Frontend**: Thay đổi dữ liệu nguồn ảnh QR từ link web `checkoutUrl` thành chuỗi `qrCode` (VietQR), cho phép các ứng dụng MoMo, ZaloPay và các ứng dụng Ngân hàng nhận diện và tự điền thông tin chuyển khoản chính xác khi quét.
- **Kết quả**: Thành công

### [23/06/2026 13:58] — Sửa lỗi 500 khi gọi API tạo link thanh toán PayOS
- **Loại**: Sửa lỗi runtime (Bug Fix)
- **File**: `backend/src/utils/payos.js`, `backend/src/routes/api.js`
- **Mô tả**:
  - Khắc phục lỗi `payOS.createPaymentLink is not a function` do truyền sai định dạng tham số vào constructor PayOS (bắt buộc phải nhận một object cấu hình `{ clientId, apiKey, checksumKey }`).
  - Cập nhật hàm tạo link thanh toán sang `payOS.paymentRequests.create(paymentData)` và hàm xác thực webhook sang `payOS.webhooks.verify(req.body)` đúng theo quy định của SDK `@payos/node` vừa cài đặt.
- **Kết quả**: Thành công

### [23/06/2026 13:54] — Kích hoạt hiện mã QR PayOS ngay khi chọn phương thức Chuyển khoản
- **Loại**: Cải tiến trải nghiệm người dùng (UX)
- **File**: `frontend/src/pages/CourseRegistrations.js`
- **Mô tả**:
  - Gắn sự kiện `change` lắng nghe thay đổi của dropdown phương thức thanh toán `#reg-pay-method`.
  - Ngay khi Lễ tân click chọn "Chuyển khoản", hệ thống sẽ tự động kiểm tra xem đã điền đầy đủ Học viên và Gói học chưa. Nếu đã điền đủ, hệ thống tự động gọi API và hiển thị popup mã QR PayOS ngay lập tức cho khách hàng quét thanh toán mà không cần đợi bấm nút submit gửi đơn nữa.
- **Kết quả**: Thành open thành công

### [23/06/2026 13:46] — Tích hợp hiển thị mã QR PayOS và kiểm tra thanh toán tự động ở Frontend
- **Loại**: Cải tiến tính năng & Trải nghiệm giao diện (UI/UX)
- **File**: `frontend/src/pages/CourseRegistrations.js`, `backend/src/routes/api.js`
- **Mô tả**:
  - **Backend**: Thêm endpoint `GET /api/payment/check-status/:orderCode` để kiểm tra trạng thái thanh toán thời gian thực của đơn hàng.
  - **Frontend**:
    - Khi Lễ tân chọn phương thức "Chuyển khoản" và bấm lưu, hệ thống sẽ tự động gọi API tạo link thanh toán, sau đó hiển thị popup mã QR PayOS vô cùng premium (backdrop-blur-sm, hiệu ứng nhịp đập pulse).
    - Triển khai cơ chế tự động thăm dò (polling) trạng thái thanh toán mỗi 2 giây. Khi người dùng quét mã thành công, giao diện tự động ẩn popup, hiện thông báo chúc mừng và hoàn tất ghi nhận đơn hàng (tiền mặt lưu trực tiếp không cần quét).
- **Kết quả**: Thành công

### [23/06/2026 13:42] — Khắc phục lỗi khởi tạo PayOS constructor (TypeError: PayOS is not a constructor)
- **Loại**: Sửa lỗi runtime (Bug Fix)
- **File**: `backend/src/utils/payos.js`
- **Mô tả**:
  - Do module `@payos/node` export dạng CommonJS bọc trong thuộc tính, việc require trực tiếp `PayOS` gây ra lỗi constructor.
  - Đã cập nhật cơ chế import lấy chính xác class `PayOS` bằng fallback: `PayOSModule.PayOS || PayOSModule.default || PayOSModule`.
- **Kết quả**: Thành công

### [23/06/2026 13:40] — Tích hợp cổng thanh toán PayOS vào Backend trung tâm
- **Loại**: Phát triển tính năng mới
- **File**: `backend/package.json`, `backend/.env`, `backend/.env.example`, `backend/src/utils/payos.js`, `backend/src/routes/api.js`
- **Mô tả**:
  - Cài đặt thư viện SDK `@payos/node` và cấu hình file utility `payos.js`.
  - Cấu hình các biến môi trường Client ID, API Key, Checksum Key vào file `.env` và cập nhật file `.env.example`.
  - Phát triển API Tạo link thanh toán `POST /api/payment/create-payment-link` hỗ trợ cả gói học phí đại trà và gói học kèm, tự động lưu thông tin đơn hàng với trạng thái tạm thời là `'huy'`.
  - Phát triển API Webhook `POST /api/payment/webhook` xác thực chữ ký của PayOS, khi nhận trạng thái `PAID` sẽ tự động kích hoạt trạng thái đơn hàng thành `'dang_hoat_dong'`, từ đó đồng bộ doanh thu thông qua các cơ chế báo cáo.
- **Kết quả**: Thành công

### [23/06/2026 13:23] — Sửa lỗi hiển thị Việt hóa trong bảng Nhật ký hệ thống (Audit Logs)
- **Loại**: Sửa lỗi hiển thị & Trải nghiệm người dùng (UI/UX)
- **File**: `frontend/src/pages/AuditLogs.js`
- **Mô tả**:
  - Khắc phục lỗi in hoa/in thường làm sai lệch so khớp ánh xạ bằng cách đưa các khóa về chữ thường (toLowerCase) và loại bỏ khoảng trắng (trim).
  - Tự động Việt hóa tài khoản `"system"` và `"SYSTEM"` thành `"Hệ thống"`.
  - Việt hóa hoàn toàn các hành động cơ sở dữ liệu (ví dụ: `CREATE` / `create` -> `"Tạo mới"`, `LOGIN` / `login` -> `"Đăng nhập"`, v.v.).
- **Kết quả**: Thành công

### [23/06/2026 13:17] — Việt hóa hiển thị thông tin trong Nhật ký hệ thống (Audit Logs)
- **Loại**: Cải tiến trải nghiệm giao diện (UI/UX)
- **File**: `frontend/src/pages/AuditLogs.js`
- **Mô tả**:
  - Ánh xạ tài khoản `system` thành nhãn "Hệ thống".
  - Chuyển đổi các vai trò hệ thống sang Tiếng Việt tương ứng (ví dụ: `admin` -> "Quản trị viên", `le_tan` -> "Lễ tân", `giao_vien` -> "Giáo viên", `hoc_vien` -> "Học viên", `system` -> "Hệ thống").
  - Việt hóa các hành động cơ sở dữ liệu và hoạt động của người dùng (ví dụ: `login` -> "Đăng nhập", `create` -> "Tạo mới", `update` -> "Cập nhật", `delete` -> "Xóa", v.v.).
- **Kết quả**: Thành công

### [23/06/2026 11:18] — Hoàn tất tích hợp cuộn vô hạn (Infinite Scroll) và ghim tiêu đề cho Nhật ký hệ thống và Nội quy trung tâm
- **Loại**: Cải tiến trải nghiệm giao diện (UI/UX)
- **File**: `frontend/src/pages/AuditLogs.js`, `frontend/src/pages/CenterRules.js`
- **Mô tả**:
  - **AuditLogs.js**: Loại bỏ cơ chế phân trang vuốt cũ (`setupSwipePagination`), chuyển sang sử dụng `IntersectionObserver` với sentinel `#audit-logs-sentinel`. Giới hạn chiều cao khung cuộn tối đa `max-h-[450px]` và ghim tiêu đề bảng bằng `sticky top-0 bg-apple-parchment z-20`.
  - **CenterRules.js**: Thiết lập giới hạn chiều cao `max-h-[550px]` cho danh sách nội quy, ghim tiêu đề danh mục `<h3>` ở trên cùng bằng `sticky top-0 bg-white z-10`. Triển khai IntersectionObserver nạp từng phần 10 nội quy khi cuộn xuống. Đăng ký lại các sự kiện CRUD (Edit/Delete) cho các phần tử được render động.
- **Kết quả**: Thành công

### [23/06/2026 10:57] — Thiết lập mặc định hiển thị doanh thu Hôm nay cho Báo cáo Doanh thu
- **Loại**: Cải tiến luồng trải nghiệm người dùng (UX)
- **File**: `frontend/src/pages/RevenueReport.js`
- **Mô tả**:
  - Chuyển đổi bộ lọc mặc định khi tải trang Báo cáo Doanh thu từ `'Tháng này'` sang `'Hôm nay'` để giúp Admin nắm bắt ngay hoạt động giao dịch phát sinh trong ngày hiện tại.
  - Tự động kích hoạt kiểu hiển thị active (nút sáng trắng và có viền nổi) cho nút **Hôm nay** ngay khi mở trang.
- **Kết quả**: Thành công

### [23/06/2026 10:42] — Nâng cấp hệ thống hiển thị và khấu trừ tiền hoàn đối với các gói học đã hủy
- **Loại**: Cải tiến tính năng & Trải nghiệm giao diện (UI/UX)
- **File**: `backend/src/routes/api.js`, `frontend/src/pages/Overview.js`, `frontend/src/pages/RevenueReport.js`
- **Mô tả**:
  - **Backend**: Cập nhật API `/api/reports/revenue` tính toán doanh thu bằng `so_tien_da_thu - so_tien_hoan`. Đưa các giao dịch đã hủy vào danh sách lịch sử và trả về `trang_thai`, `so_tien_hoan`. Bổ sung trường `so_tien_hoan` trong API `/api/registrations`.
  - **Frontend Tổng quan**: Đồng bộ tính doanh thu dựa trên thực thu trừ tiền hoàn (bao gồm cả các gói đã hủy để khớp 100% với backend).
  - **Frontend Báo cáo (UI/UX mới)**: 
    * Thiết lập làm mờ toàn bộ dòng giao dịch đã hủy (`opacity-65` và nền xám nhạt `#f8fafc`) giúp giao diện thông thoáng, dễ quét thông tin, tự động hover nổi rõ nét khi di chuột qua.
    * Tinh giản hiển thị: Cột Thực thu chỉ hiển thị duy nhất 1 con số thực thu sau khi hoàn (ví dụ: `+1.000.000 đ` màu đỏ cam), tránh rối mắt. Toàn bộ thông tin hoàn trả được đưa gọn gàng vào nhãn trạng thái bên cạnh tên học viên: `Đã hủy (Hoàn: Xđ)`.
- **Kết quả**: Thành công

### [23/06/2026 10:35] — Đồng bộ số liệu doanh thu thực thu giữa Tổng quan và Báo cáo Doanh thu
- **Loại**: Sửa lỗi logic hiển thị
- **File**: `frontend/src/pages/Overview.js`
- **Mô tả**:
  - Tái cấu trúc logic tính toán doanh thu trên màn hình Tổng quan để sử dụng dữ liệu thực thu (`so_tien_da_thu`) thay vì giá trị gốc (`gia_thuc_te`).
  - Lọc loại bỏ hoàn toàn các gói đăng ký đã bị hủy (`huy`) hoặc tạm dừng (`tam_dung`) để thống nhất 100% với số liệu hiển thị thực tế bên tab Báo cáo Doanh thu (6.000.000đ).
- **Kết quả**: Thành công

### [23/06/2026 10:23] — Tích hợp hộp thoại xác nhận khi Khóa/Mở khóa tài khoản
- **Loại**: Cải tiến bảo mật & Trải nghiệm người dùng (UI/UX)
- **File**: `frontend/src/pages/AccountManagement.js`
- **Mô tả**:
  - Bổ sung hộp thoại cảnh báo xác nhận `confirm` trước khi tiến hành Khóa hoặc Mở khóa tài khoản người dùng.
  - Ngăn chặn hoàn toàn việc Admin vô tình lỡ tay click nhầm làm khóa tài khoản của học viên hay nhân sự ngoài ý muốn.
- **Kết quả**: Thành công

### [23/06/2026 10:27] — Khắc phục lỗi sai lệch số liệu biểu đồ doanh thu hàng ngày
- **Loại**: Sửa bug logic Backend
- **File**: `backend/src/routes/api.js`
- **Mô tả**:
  - Loại bỏ việc đọc biểu đồ từ bảng tĩnh `doanh_thu` (chỉ chứa 4 dòng dữ liệu kiểm thử cũ).
  - Tái cấu trúc API `/api/reports/revenue` để tính toán doanh thu tích lũy hàng ngày thời gian thực (real-time) trực tiếp từ dải ngày thực tế (`generate_series`) kết hợp với dữ liệu đăng ký thực tế từ 2 bảng `dang_ky_khoa_hoc` VÀ `dang_ky_hoc_kem`.
  - Khắc phục hoàn toàn lỗi số liệu trên biểu đồ không tăng hoặc không khớp với các card chỉ số tổng ở phía trên.
- **Kết quả**: Thành công

### [23/06/2026 10:22] — Khôi phục tính năng Click trực tiếp vào Trạng thái tài khoản
- **Loại**: Cải tiến trải nghiệm người dùng (UX)
- **File**: `frontend/src/pages/AccountManagement.js`
- **Mô tả**:
  - Chuyển đổi lại badge hiển thị ở cột Trạng thái thành nút bấm có thể tương tác (`onclick`).
  - Hỗ trợ cả 2 luồng thao tác song song: Admin có thể click nhanh trực tiếp vào badge Trạng thái (Hoạt động / Bị khóa) hoặc sử dụng nút bấm biểu tượng Ổ khóa trong cột Thao tác để bật/tắt kích hoạt tài khoản.
- **Kết quả**: Thành công

### [23/06/2026 10:20] — Bổ sung nút Khóa/Mở khóa tài khoản trực quan
- **Loại**: Cải tiến giao diện & Trải nghiệm người dùng (UI/UX)
- **File**: `frontend/src/pages/AccountManagement.js`
- **Mô tả**:
  - Chuyển đổi cột Trạng thái thành dạng hiển thị tĩnh (badge "Hoạt động" / "Bị khóa" chỉ để xem, không click được) để tránh Admin nhầm lẫn.
  - Bổ sung nút Khóa / Mở khóa dạng biểu tượng **Ổ khóa** (`lock` / `lock_open`) trực tiếp vào cột Thao tác:
    * Khi tài khoản Đang hoạt động: Hiện nút Khóa (icon `lock` màu vàng cam).
    * Khi tài khoản Bị khóa: Hiện nút Mở khóa (icon `lock_open` màu xanh lá).
- **Kết quả**: Thành công

### [23/06/2026 10:15] — Tái cấu trúc bảng quản lý tài khoản sang dạng 2 cột trực quan
- **Loại**: Cải tiến giao diện & UI/UX
- **File**: `frontend/src/pages/AccountManagement.js`
- **Mô tả**:
  - Chuyển đổi cấu trúc danh sách tài khoản sang dạng 2 cột chính tách biệt rõ ràng:
    * **Cột 1 (Người sở hữu)**: Hiển thị Avatar tròn, Họ và tên (chữ đậm) và nhãn Vai trò (badge màu) ngay bên dưới.
    * **Cột 2 (Thông tin đăng nhập)**: Hiển thị Số điện thoại đăng nhập (chữ to) và Email (chữ nhỏ).
  - Cải tiến này giúp Admin quản lý cực kỳ trực quan, thông thoáng mắt và hoạt động hoàn hảo khi hiển thị trên các màn hình điện thoại di động nhỏ gọn.
- **Kết quả**: Thành công

### [23/06/2026 10:10] — Gộp cột Họ tên và Tên đăng nhập trong Quản lý tài khoản
- **Loại**: Cải tiến giao diện & UI/UX
- **File**: `frontend/src/pages/AccountManagement.js`
- **Mô tả**:
  - Gộp thông tin cột "Tài khoản" và cột "Hồ sơ" làm một cột duy nhất là "Tài khoản người dùng".
  - Hiển thị Họ và tên của người sở hữu tài khoản nổi bật làm tiêu đề chính (chữ đậm) giúp nhận diện cực kỳ trực quan, phía dưới là Tên đăng nhập (Số điện thoại) và Mã số hồ sơ liên kết dạng chữ nhỏ gọn gàng.
  - Cải tiến này giúp tối ưu hóa không gian hiển thị của bảng dữ liệu, tránh bị ẩn thông tin người dùng trên các thiết bị di động.
- **Kết quả**: Thành công

### [23/06/2026 10:03] — Ẩn trường Chi nhánh học viên và Khóa tên đăng nhập Giáo viên/Nhân viên
- **Loại**: Cải tiến UI/UX & Nghiệp vụ
- **File**: `frontend/src/pages/StudentsList.js`, `frontend/src/pages/TeachersList.js`, `frontend/src/pages/StaffList.js`
- **Mô tả**:
  - **Học viên**: Ẩn trường "Chi nhánh tiếp nhận" khỏi Modal Tiếp nhận học viên mới và đặt mặc định là "Trung tâm chính" do hệ thống chưa phát triển đa chi nhánh.
  - **Giáo viên & Nhân viên**: Khóa trường nhập Tên đăng nhập thành chỉ đọc (`readonly`) và đổi style xám (`bg-slate-100 cursor-not-allowed`) để tự động sao chép Số điện thoại sang Tên đăng nhập tương tự như học viên.
- **Kết quả**: Thành công

### [23/06/2026 09:57] — Khóa trường Tên đăng nhập tự tạo thành chỉ đọc (Read-only)
- **Loại**: Cải tiến nghiệp vụ & UI/UX
- **File**: `frontend/src/pages/StudentsList.js`
- **Mô tả**:
  - Đặt thuộc tính `readonly` và thay đổi style (màu nền xám `bg-slate-100`, con trỏ `cursor-not-allowed`) cho trường nhập Tên đăng nhập trong Modal Tiếp nhận học viên mới.
  - Trường này sẽ tự động lấy và cập nhật theo Số điện thoại của hồ sơ nhập phía trên, không cho phép Admin tự ý chỉnh sửa tay khác số điện thoại để đảm bảo tính đồng nhất 100% giữa tài khoản đăng nhập và số điện thoại liên hệ của học viên.
- **Kết quả**: Thành công

### [23/06/2026 09:47] — Chặn lưu ngày sinh tương lai và SĐT/mật khẩu sai quy định hiển thị thông báo lỗi đẹp mắt
- **Loại**: Sửa bug & UI/UX
- **File**: `backend/src/routes/api.js`, `frontend/src/pages/StudentsList.js`, `frontend/src/pages/AddStudentForm.js`
- **Mô tả**:
  - Chặn chọn ngày sinh trong tương lai (lớn hơn ngày hiện tại) bằng cách gán thuộc tính `max` cho ô input date ở Frontend.
  - Bổ sung logic JavaScript kiểm tra ngày sinh tại Frontend và Backend, hiển thị thông báo lỗi **Toast màu đỏ đẹp mắt** nếu người dùng nhập ngày sinh tương lai.
  - Duy trì kiểm tra tên đăng nhập (SĐT) tự động tạo đủ 10 số, mật khẩu đủ 6 ký tự trở lên; hiển thị Toast lỗi chi tiết, rõ ràng và ngăn chặn việc âm thầm lưu thành công dữ liệu sai quy chuẩn.
- **Kết quả**: Thành công

### [23/06/2026 09:23] — Đồng bộ validate mật khẩu tối thiểu 6 ký tự và thêm Xác nhận mật khẩu
- **Loại**: Cải tiến tính năng & Bảo mật
- **File**: `backend/src/routes/api.js`, `frontend/src/pages/AccountManagement.js`
- **Mô tả**:
  - Thêm ô nhập `"Nhập lại mật khẩu mới"` và thuộc tính `minlength="6"` vào Form Sửa tài khoản.
  - Bổ sung logic JavaScript kiểm tra độ dài $\ge 6$ ký tự và trùng khớp mật khẩu ở cả 2 modal: Tạo tài khoản và Sửa tài khoản tại Frontend.
  - Cập nhật API sửa tài khoản (`PUT /api/accounts/:id`) trên Backend để chặn và trả về lỗi `400` nếu mật khẩu mới dưới 6 ký tự.
- **Kết quả**: Thành công

### [23/06/2026 09:09] — Gộp tính năng Đặt lại mật khẩu vào chung Form Sửa tài khoản
- **Loại**: Cải tiến tính năng & UI/UX
- **File**: `backend/src/routes/api.js`, `frontend/src/pages/AccountManagement.js`
- **Mô tả**:
  - Gộp trường nhập mật khẩu mới trực tiếp vào Form Sửa tài khoản (để trống nếu không đổi).
  - Loại bỏ hoàn toàn nút "Đặt lại mật khẩu" riêng biệt trên bảng và Modal đặt lại mật khẩu cũ để làm tinh gọn giao diện.
  - Cập nhật API PUT sửa tài khoản ở backend nhận thêm `mat_khau_moi` và mã hóa bcrypt để lưu lại khi người dùng có nhu cầu đổi mật khẩu.
- **Kết quả**: Thành công

### [23/06/2026 09:03] — Ẩn hoàn toàn trường Hồ sơ liên kết khỏi Form Sửa tài khoản
- **Loại**: Cải tiến giao diện & Tinh giản UI/UX
- **File**: `frontend/src/pages/AccountManagement.js`
- **Mô tả**:
  - Loại bỏ hoàn toàn dòng hiển thị "Hồ sơ liên kết" khỏi giao diện của Modal Sửa tài khoản (`#modal-edit`).
  - Chỉ duy trì giá trị liên kết này bằng thẻ ẩn `input type="hidden"` để truyền ngầm lên server khi lưu, giúp Form Sửa cực kỳ tối giản và tập trung vào 2 trường cần chỉnh sửa thực tế: Tên đăng nhập và Vai trò.
- **Kết quả**: Thành công

### [23/06/2026 09:01] — Cố định Hồ sơ liên kết chỉ đọc (read-only) khi sửa tài khoản
- **Loại**: Cải tiến giao diện & UI/UX
- **File**: `frontend/src/pages/AccountManagement.js`
- **Mô tả**:
  - Chuyển đổi phần chọn hồ sơ liên kết trong Modal Sửa (`#modal-edit`) từ dạng Dropdown chọn lựa sang **chữ tĩnh hiển thị chỉ đọc (read-only)**.
  - Khóa chặt không cho phép đổi hồ sơ liên kết của tài khoản hiện tại khi sửa (duy trì quan hệ 1 tài khoản - 1 hồ sơ vĩnh viễn), tránh việc Admin bấm nhầm làm sai lệch hoặc mất liên kết cũ của tài khoản.
- **Kết quả**: Thành công

### [23/06/2026 08:57] — Bắt buộc chọn Hồ sơ liên kết khi tạo/sửa tài khoản
- **Loại**: Cải tiến tính năng & Bảo toàn dữ liệu
- **File**: `frontend/src/pages/AccountManagement.js`
- **Mô tả**:
  - Gắn thuộc tính `required` cho dropdown chọn hồ sơ liên kết ở cả Form Tạo (`c-profile`) và Form Sửa (`e-profile`).
  - Loại bỏ hoàn toàn tùy chọn "Không liên kết" và thay thế bằng placeholder "— Chọn hồ sơ liên kết —". Tránh việc người dùng vô tình gỡ bỏ liên kết của tài khoản.
- **Kết quả**: Thành công

### [23/06/2026 08:44] — Sửa lỗi thiếu ho_so_id và so_dien_thoai trong API lấy danh sách tài khoản
- **Loại**: Sửa lỗi logic Backend
- **File**: `backend/src/routes/api.js`
- **Mô tả**:
  - Bổ sung các cột `tk.ho_so_id` và `hs.so_dien_thoai` vào câu lệnh SELECT của API `GET /api/accounts`.
  - Khắc phục lỗi giao diện không nhận được liên kết hồ sơ của tài khoản (dẫn tới hiện thông báo chưa liên kết và không load được hồ sơ đang liên kết khi mở modal Sửa).
- **Kết quả**: Thành công

### [23/06/2026 08:38] — Hỗ trợ click vào dòng tài khoản để xem chi tiết
- **Loại**: Cải tiến trải nghiệm người dùng (UX)
- **File**: `frontend/src/pages/AccountManagement.js`
- **Mô tả**:
  - Tích hợp class `cursor-pointer` và sự kiện click trực tiếp lên thẻ dòng `<tr>` của danh sách tài khoản.
  - Khi click vào bất kỳ cột nào trên dòng (ngoại trừ cụm nút thao tác Khóa/Sửa/Xóa/Reset mật khẩu), hệ thống tự động mở Modal xem chi tiết tài khoản.
- **Kết quả**: Thành công

### [23/06/2026 08:35] — Tích hợp tính năng Xem chi tiết tài khoản
- **Loại**: Cải tiến tính năng & Trải nghiệm người dùng
- **File**: `frontend/src/pages/AccountManagement.js`
- **Mô tả**:
  - Bổ sung nút **Xem chi tiết** (icon hình con mắt màu xám) vào trước mỗi dòng tài khoản.
  - Tích hợp Modal **Chi tiết tài khoản** (`modal-view`) hiển thị trực quan thông tin tài khoản đăng nhập (ID, Tên đăng nhập, Vai trò, Trạng thái, Ngày tạo, Đăng nhập cuối) và toàn bộ thông tin cá nhân của hồ sơ liên kết (ID hồ sơ, Mã hồ sơ, Họ và tên, Phân loại hồ sơ) dưới dạng lưới 2 cột gọn gàng.
- **Kết quả**: Thành công

### [23/06/2026 08:31] — Phát triển tính năng Sửa/Xem tài khoản, sửa lỗi Khóa/Xóa 500 và lỗi lọc nhân viên
- **Loại**: Cải tiến tính năng & Sửa lỗi hệ thống
- **File**: `backend/src/routes/api.js`, `frontend/src/pages/AccountManagement.js`, Cơ sở dữ liệu (bảng `tai_khoan`)
- **Mô tả**:
  - **Sửa lỗi Khóa/Xóa 500**: Thay đổi cấu hình check constraint `tai_khoan_trang_thai_check` trong Postgres để cho phép lưu trạng thái `'bi_khoa'` (trước đó chỉ cho phép `'khoa'`), khắc phục triệt để lỗi 500 khi Khóa/Xóa tài khoản.
  - **Phát triển API Cập nhật tài khoản**: Viết mới route `PUT /api/accounts/:id` ở backend hỗ trợ sửa đổi tên đăng nhập, vai trò và hồ sơ liên kết.
  - **Tích hợp giao diện Sửa/Xem tài khoản**: Thêm nút sửa (bút chì), modal sửa tài khoản `#modal-edit` cùng toàn bộ logic load danh sách hồ sơ tương thích và gửi cập nhật.
  - **Sửa lỗi lọc và tạo Nhân viên**: Đồng bộ việc ánh xạ vai trò `'nhan_vien'` ở giao diện thành `'le_tan'` ở database khi gửi tạo mới, và lọc gộp cả `'le_tan'`/`'ke_toan'` khi lọc vai trò Nhân viên ở frontend.
- **Kết quả**: Thành công

### [23/06/2026 08:14] — Sửa lỗi gán sai tên người gửi trong Sổ liên lạc khi thiếu hoSoId
- **Loại**: Sửa lỗi logic Backend
- **File**: `backend/src/routes/api.js`
- **Mô tả**:
  - Khắc phục lỗi khi tài khoản chưa lưu lại `hoSoId` trong phiên làm việc của trình duyệt thì client tự động gửi ID tài khoản (ví dụ `45`) lên làm `giao_vien_id`.
  - Backend đã kiểm tra thấy trùng khớp ID này với hồ sơ học sinh (hồ sơ ID `45` của học sinh tên "a") nên đã lưu nhận xét dưới danh nghĩa học sinh "a" (hiển thị là "GV: a").
  - Đã thêm điều kiện `AND loai_ho_so != 'hoc_vien'` vào câu query kiểm tra `gvCheck` để chặn việc nhận diện sai hồ sơ học sinh làm hồ sơ giáo viên/nhân viên gửi nhận xét.
- **Kết quả**: Thành công

### [23/06/2026 08:10] — Nâng cấp ràng buộc kiểm tra vai trò người gửi nhận xét trong Sổ liên lạc
- **Loại**: Cập nhật database / Khắc phục lỗi hệ thống
- **File**: Cơ sở dữ liệu (bảng `so_lien_lac`)
- **Mô tả**:
  - Phát hiện lỗi 500 khi tài khoản Nhân viên (`nhan_vien`) viết nhận xét do vi phạm ràng buộc kiểm tra `so_lien_lac_vai_tro_gui_check` (ràng buộc cũ trong Postgres chỉ cho phép `'hoc_vien'` và `'giao_vien'`).
  - Đã thực thi lệnh SQL DROP ràng buộc cũ và tạo lại ràng buộc mới, mở rộng danh sách vai trò hợp lệ được ghi nhận khi gửi nhận xét: `('hoc_vien', 'giao_vien', 'nhan_vien', 'le_tan', 'admin')`.
- **Kết quả**: Thành công

### [22/06/2026 17:25] — Khắc phục lỗi thiếu liên kết hồ sơ khi tạo tài khoản tự động (autoCreateAccount)
- **Loại**: Sửa lỗi logic Backend & Cơ sở dữ liệu
- **File**: `backend/src/routes/api.js`
- **Mô tả**:
  - **Sửa helper autoCreateAccount**: Thêm trường `ho_so_id` vào câu lệnh `INSERT INTO tai_khoan` khi tạo tài khoản tự động cho Nhân viên, Giáo viên, và Học viên mới. Khắc phục triệt để việc các tài khoản tạo tự động mới có `ho_so_id = NULL`.
  - **Cập nhật database**: Liên kết thủ công tài khoản test mới tạo `0369877654` với hồ sơ nhân sự ID `99` (nhân viên tên `aa`).
  - **Mở rộng tự động liên kết khi đăng nhập**: Cập nhật API `/auth/login` để tự động tra cứu và tự động vá/liên kết hồ sơ cho các tài khoản vai trò Nhân viên (`nhan_vien` hoặc `le_tan`) nếu trước đó bị thiếu liên kết `ho_so_id`.
- **Kết quả**: Thành công

### [22/06/2026 17:15] — Liên kết hồ sơ nhân sự cho tài khoản test và khắc phục lỗi người gửi nhận xét
- **Loại**: Cập nhật database & Đồng bộ dữ liệu
- **File**: Cơ sở dữ liệu (bảng `tai_khoan`)
- **Mô tả**:
  - Cập nhật liên kết hồ sơ nhân sự `ho_so_id = 96` (Hồ sơ nhân viên tên `nv00223`) cho tài khoản đăng nhập `0369871111` (vai_tro_id = 2 - Nhân viên).
  - Khắc phục triệt để lỗi khi viết nhận xét bằng tài khoản Nhân viên này thì timeline Sổ liên lạc bị gán sang giáo viên "a" (do trước đây thiếu liên kết `ho_so_id` dẫn đến backend chạy fallback tự chọn ngẫu nhiên một giáo viên). Giờ đây, khi đăng nhập lại và viết nhận xét mới, hệ thống sẽ gửi đúng `ho_so_id` và hiển thị chính xác nhãn `"NV: nv00223"`.
- **Kết quả**: Thành công

### [22/06/2026 17:04] — Khắc phục nhãn hiển thị cứng người gửi "GV:" tại Sổ liên lạc
- **Loại**: Sửa bug giao diện & Cải tiến tính năng
- **File**: `backend/src/routes/api.js`, `frontend/src/pages/LessonDiary.js`
- **Mô tả**:
  - **Backend**: Cập nhật câu SQL SELECT của API `/api/reports/student/:studentId` để thực hiện JOIN lấy thêm trường `chuc_vu` từ hồ sơ người gửi (`ho_so`).
  - **Frontend**: Thay thế nhãn hiển thị cứng `"GV:"` thành hiển thị động dựa trên chức vụ thực tế của người gửi trong hồ sơ nhân sự:
    * Nếu chức vụ là "Nhân viên" hoặc "Lễ tân" -> Hiển thị `"NV: [Tên]"`.
    * Nếu chức vụ là "Quản lý", "Admin" hoặc "Quản trị viên" -> Hiển thị `"QL: [Tên]"`.
    * Các trường hợp còn lại (Giáo viên) -> Giữ nguyên `"GV: [Tên]"`.
- **Kết quả**: Thành công

### [22/06/2026 16:58] — Đồng bộ hóa quyền truy cập menu cho vai trò Nhân viên
- **Loại**: Cải tiến phân quyền & Giao diện người dùng
- **File**: `frontend/src/pages/Dashboard.js`
- **Mô tả**: Bổ sung vai trò `"nhan_vien"` vào danh sách vai trò được phép (`roles`) của toàn bộ các mục menu vận hành trung tâm bao gồm: Tổng quan, Thời khóa biểu, Lượt Vào - Ra, Quản lý Gói học, Lớp học & Xếp lịch, Học viên & Tiếp nhận, Nhân sự & Chấm công, Chất lượng đào tạo, Yêu cầu, Hệ thống & Nội quy. Đảm bảo tài khoản Nhân viên có đầy đủ quyền thao tác vận hành mà vẫn bảo mật thông tin tài chính doanh thu và danh sách tài khoản của Admin.
- **Kết quả**: Thành công

### [22/06/2026 16:49] — Quy chuẩn vai trò nhân viên/admin và ẩn trường chi nhánh
- **Loại**: Cải tiến giao diện & Đồng bộ cơ sở dữ liệu
- **File**: `frontend/src/pages/StaffList.js`, `frontend/src/pages/AccountManagement.js`
- **Mô tả**:
  - **Ẩn trường Chi nhánh**: Ẩn dropdown chọn chi nhánh khỏi các form thêm và sửa đổi hồ sơ nhân sự (do hệ thống local chưa vận hành đa chi nhánh), thiết lập mặc định giá trị ngầm gửi lên là `"Trung tâm chính"`.
  - **Quy chuẩn vai trò**: 
    - Lọc bỏ hoàn toàn các vai trò rườm rà "Lễ tân" (`le_tan`) và "Kế toán" (`ke_toan`) khỏi dropdown tạo/chỉnh sửa hồ sơ và tài khoản nhân sự. Chỉ giữ lại đúng 2 lựa chọn: **Nhân viên** (`nhan_vien`) và **Quản lý / Admin** (`admin`).
    - Gộp hiển thị badge vai trò `le_tan` trên danh sách tài khoản chung sang nhãn hiển thị `"Nhân viên"`.
    - Chạy script cập nhật database chuyển đổi đồng bộ tất cả hồ sơ, tài khoản Lễ tân/Kế toán cũ về vai trò Nhân viên (`nhan_vien`/`le_tan`).
- **Kết quả**: Thành công

### [22/06/2026 16:26] — Khắc phục lỗi không đóng được Modal khi thêm/sửa gói học
- **Loại**: Sửa bug giao diện & Trải nghiệm người dùng
- **File**: `frontend/src/pages/CoursePackages.js`, `frontend/src/pages/TutoringPackages.js`
- **Mô tả**:
  - Gắn sự kiện lắng nghe Click (`addEventListener`) cho các nút Đóng (`btn-close-modal`, `btn-close-tutor-modal`) và nút Hủy (`btn-cancel-modal`, `btn-cancel-tutor-modal`).
  - Khi click vào các nút này, modal sẽ tự động thêm class `hidden` để ẩn đi một cách chính xác khi nhân sự muốn thoát hoặc hủy thao tác.
- **Kết quả**: Thành công

### [22/06/2026 16:12] — Thiết lập cố định kiểu biểu đồ theo bộ lọc trong báo cáo doanh thu
- **Loại**: Cải tiến giao diện & UI/UX
- **File**: `frontend/src/pages/RevenueReport.js`
- **Mô tả**:
  - **Cấu hình kiểu biểu đồ**: Thiết lập cố định biểu đồ cột (**Bar Chart** bo tròn góc `borderRadius: 8`, độ rộng `barThickness: 50`) cho các bộ lọc thời gian ngắn: **Hôm nay, Hôm qua, Tuần này** để so sánh trực quan các ngày.
  - **Biểu đồ đường cong gradient (Area Line)**: Được áp dụng cố định cho các bộ lọc thời gian dài: **Tháng này và Chọn tháng 1-12** để mang lại giao diện tăng trưởng mượt mà, thoáng đãng Apple-style.
  - **Đồng bộ biến**: Đồng bộ biến `currentFilter` khi tương tác để biểu đồ luôn chuyển đổi chính xác.
- **Kết quả**: Thành công

### [22/06/2026 15:54] — Tinh giản tối đa bộ lọc doanh thu và tích hợp dropdown chọn tháng 1-12
- **Loại**: Cải tiến giao diện & UI/UX
- **File**: `frontend/src/pages/RevenueReport.js`
- **Mô tả**:
  - **Dropdown chọn tháng**: Thay thế nút "Tháng này" cố định bằng một hộp chọn thả xuống (Dropdown Select) chứa **Tháng này** mặc định và **Tháng 1 đến Tháng 12** của năm hiện tại. Khi chọn một tháng bất kỳ, hệ thống tự động quy đổi thành khoảng ngày đầu/cuối của tháng đó và tải dữ liệu tương ứng.
  - **Tinh giản giao diện**: Loại bỏ hoàn toàn tính năng bộ chọn khoảng ngày tùy chỉnh `Từ ngày - Đến ngày` và nút "Tùy chọn ngày" rườm rà. Giao diện bộ lọc doanh thu hiện tại cực kỳ tối giản, chỉ giữ lại các nút lọc nhanh tối cần thiết: **Hôm nay**, **Hôm qua**, **Tuần này**, và **Chọn tháng (1-12)**.
- **Kết quả**: Thành công

### [22/06/2026 15:21] — Chuẩn hóa tiếng Việt phương thức thanh toán và bổ sung thông tin lịch sử giao dịch
- **Loại**: Cải tiến tính năng & UI/UX
- **File**: `backend/src/routes/api.js`, `frontend/src/pages/RevenueReport.js`
- **Mô tả**:
  - **Backend**: Cập nhật query lấy danh sách giao dịch trả về thêm trường `loai_goi` để phân biệt gói đại trà và gói học kèm.
  - **Frontend**: 
    - Bổ sung cột **Phân loại** với badge màu sinh động (`Đại trà` / `Kèm 1-1`) để giúp quản trị viên nhận biết nhanh loại gói học.
    - Chuẩn hóa cột **Phương thức** hiển thị rõ ràng tiếng Việt có dấu (`Tiền mặt` / `Chuyển khoản`) thay vì dạng text thô của DB.
    - Cập nhật định dạng cột **Ngày giao dịch** hiển thị đầy đủ chi tiết cả **Giờ:Phút** và **Ngày/Tháng/Năm** (Ví dụ: `15:30 22/06/2026`).
- **Kết quả**: Thành công

### [22/06/2026 15:15] — Thêm hiệu ứng hover nổi và đổ bóng cho card báo cáo doanh thu
- **Loại**: Cải tiến giao diện & UI/UX
- **File**: `frontend/src/pages/RevenueReport.js`
- **Mô tả**: Tích hợp các thuộc tính Tailwind CSS (`transition-all duration-300 hover:-translate-y-1 hover:shadow-md`) cho tất cả các card chỉ số (KPI) doanh thu, card biểu đồ tròn, card biểu đồ xu hướng, và các card hiển thị gói học phổ biến nhất. Điều này tạo hiệu ứng nổi nhẹ và đổ bóng mềm mại khi người dùng di chuột qua, nâng cao trải nghiệm thẩm mỹ cao cấp (Apple-style).
- **Kết quả**: Thành công

### [22/06/2026 15:10] — Tổng hợp cả Gói đại trà và Gói học kèm vào thống kê gói bán chạy nhất
- **Loại**: Cải tiến tính năng & Đồng bộ dữ liệu
- **File**: `backend/src/routes/api.js`
- **Mô tả**: Nâng cấp câu truy vấn `bestSellerQuery` của API `/reports/revenue`. Sử dụng cấu trúc `UNION ALL` để gộp cả giao dịch đăng ký khóa học đại trà (`dang_ky_khoa_hoc`) và gói học kèm (`dang_ky_hoc_kem`), sau đó xếp hạng chung để tìm ra top 3 gói học được đăng ký nhiều nhất, đảm bảo tính đầy đủ cho mục "Gói học phổ biến nhất" trên tab Doanh thu.
- **Kết quả**: Thành công

### [22/06/2026 14:59] — Khắc phục lỗi hiển thị 0 VNĐ và đồng bộ bộ lọc thời gian tại tab Doanh thu
- **Loại**: Sửa bug & Đồng bộ tính năng
- **File**: `backend/src/routes/api.js`, `frontend/src/pages/RevenueReport.js`
- **Mô tả**:
  - **Backend**: Cập nhật API `GET /api/reports/revenue` để phân tích và hỗ trợ tham số `filter` (`today`, `yesterday`, `month`). Tự động tính toán ngày bắt đầu/kết thúc tương ứng và đưa vào lọc thời gian cho cả doanh thu đại trà lẫn học kèm.
  - **Frontend**: Sửa lỗi lệch tên trường dữ liệu từ `thuc_thu` thành `total` để khớp với giá trị trả về của SQL query. Tích hợp `parseFloat` để tính tổng doanh thu chính xác tránh ghép chuỗi.
- **Kết quả**: Thành công

### [22/06/2026 14:48] — Khóa trường Số buổi học gói kèm 1-1 thành chỉ đọc (readonly)
- **Loại**: Cải tiến bảo mật & Trải nghiệm người dùng
- **File**: `frontend/src/pages/CourseRegistrations.js`, `frontend/src/pages/StudentsList.js`
- **Mô tả**: Chuyển đổi các ô nhập số buổi học của gói học kèm 1-1 sang chế độ chỉ đọc (`readonly`), thêm màu nền xám và đổi con trỏ chuột thành `cursor-not-allowed` để tránh việc người dùng chỉnh sửa sai số buổi so với gói học kèm thực tế đã chọn. Áp dụng đồng bộ tại tab Đăng ký / Thu phí, form chỉnh sửa gói học kèm đang hoạt động và form đăng ký gói học kèm mới trong modal chi tiết học viên.
- **Kết quả**: Thành công

### [22/06/2026 14:26] — Tự động chuyển tab Lớp học & Xếp lịch và điền sẵn thông tin khi đăng ký gói 1 kèm 1 thành công
- **Loại**: Cải tiến tính năng & Trải nghiệm người dùng
- **File**: `frontend/src/pages/CourseRegistrations.js`
- **Mô tả**: Sau khi ghi nhận đóng học phí thành công cho gói học kèm 1-1, hệ thống sẽ tự động lưu thông tin gói học kèm (bao gồm học viên, gói học, giáo viên phụ trách) vào `sessionStorage` và kích hoạt tự động chuyển hướng giao diện sang tab Lớp học & Xếp lịch. Trang Lớp học & Xếp lịch sẽ tự động nhận diện và điền sẵn dữ liệu này giúp Lễ tân chỉ việc đặt lịch.
- **Kết quả**: Thành công

### [22/06/2026 14:01] — Tự động điền Giáo viên được chỉ định sẵn khi xếp lịch học kèm
- **Loại**: Cải tiến trải nghiệm người dùng
- **File**: `frontend/src/pages/ClassManagement.js`
- **Mô tả**: Cập nhật hàm `renderStudentChecklist()`. Khi Lễ tân xếp lịch học kèm và chọn học viên, hệ thống sẽ kiểm tra xem gói học kèm đang hoạt động của học viên đó có chỉ định trước Giáo viên phụ trách dạy kèm hay không. Nếu có, dropdown **Chọn Giáo viên giảng dạy** trong form xếp lịch sẽ tự động được chọn sang giáo viên đó, giúp giảm bớt thao tác chọn thủ công cho Lễ tân.
- **Kết quả**: Thành công

### [22/06/2026 13:41] — Tích hợp Gói học kèm 1-1 vào form Đăng ký / Thu phí
- **Loại**: Cải tiến giao diện & Tính năng
- **File**: `frontend/src/pages/CourseRegistrations.js`
- **Mô tả**: Nâng cấp form Đăng ký / Thu phí. Bổ sung trường chọn **Loại hình gói học** cho phép Lễ tân linh động chọn giữa Gói đại trà (Học nhóm) hoặc Gói học kèm 1-1. Khi chọn gói học kèm, form tự động chuyển đổi: hiển thị trường chọn Giáo viên phụ trách dạy kèm, ô nhập số buổi học đăng ký, và tải danh sách gói kèm từ API `/tutoring-packages`. Submit form sẽ gọi đúng API đăng ký học kèm `/api/registrations/tutoring`.
- **Kết quả**: Thành công

### [22/06/2026 13:34] — Phân quyền tính năng tự đặt lịch chỉ cho Gói học kèm hoạt động
- **Loại**: Cải tiến logic & Phân quyền tính năng
- **File**: `backend/src/routes/api.js`, `frontend/src/pages/StudentPortal.js`
- **Mô tả**:
  - **Backend**: Cập nhật API `POST /api/booking-requests`, chuyển đổi kiểm tra gói học. Chỉ cho phép các tài khoản học viên có Gói học kèm (`dang_ky_hoc_kem`) hoạt động được phép gửi yêu cầu đặt lịch học, trả về lỗi chi tiết nếu học viên chỉ có gói học đại trà/học nhóm cố định.
  - **Frontend**: Cập nhật tab Đặt lịch của Portal Học viên. Tự động kiểm tra danh sách gói học kèm hoạt động của học viên thông qua API tổng quan. Nếu học viên không có gói học kèm hoạt động, ẩn form đặt lịch và hiển thị màn hình thông tin giải thích trực quan hướng dẫn học viên tuân theo lịch cố định của trung tâm.
- **Kết quả**: Thành công

### [22/06/2026 13:18] — Ẩn các lớp học nhóm trống không hoạt động khỏi tab Lớp học & Xếp lịch
- **Loại**: Cải tiến giao diện & Trải nghiệm người dùng
- **File**: `frontend/src/pages/ClassManagement.js`
- **Mô tả**: Cập nhật hàm `loadScheduleList()`. Bổ sung điều kiện lọc bỏ các lớp học nhóm có sĩ số bằng 0 (không còn học viên sau khi hủy gói) VÀ không còn bất kỳ ca dạy chờ học (`cho_hoc`) nào trong tương lai. Việc này giúp ẩn hoàn toàn các dòng lớp nhóm rỗng đã "Hoàn thành" sau khi Lễ tân bấm hủy gói học của học viên ở tab Yêu cầu.
- **Kết quả**: Thành công

### [22/06/2026 13:12] — Tự động hủy ca học nhóm tương lai nếu lớp học không còn học viên
- **Loại**: Cải tiến logic & Đồng bộ dữ liệu
- **File**: `backend/src/routes/api.js`
- **Mô tả**: Nâng cấp API hủy đăng ký khóa học đại trà `PUT /api/registrations/:id/cancel`. Khi học viên bị rút khỏi các lớp học nhóm, hệ thống kiểm tra lại sĩ số của từng lớp đó. Nếu sĩ số của lớp về bằng 0 (lớp trống), hệ thống tự động chuyển toàn bộ các ca học nhóm tương lai của lớp đó (`trang_thai = 'cho_hoc'`) thành `'da_huy'`. Việc này dọn sạch các lịch cũ của lớp trống khỏi hệ thống xếp lịch và thời khóa biểu của Giáo viên.
- **Kết quả**: Thành công

### [22/06/2026 12:03] — Lọc bỏ lịch học của các gói đã bị hủy khỏi thời khóa biểu chung
- **Loại**: Sửa lỗi logic & Đồng bộ dữ liệu
- **File**: `backend/src/routes/api.js`
- **Mô tả**: Cập nhật API lấy danh sách thời khóa biểu `GET /api/schedules`. Bổ sung điều kiện lọc `(dk.trang_thai IS NULL OR dk.trang_thai != 'huy')` cho các ca học kèm. Việc này giúp ẩn hoàn toàn các ca học cũ (bao gồm cả lịch sử ca học trong quá khứ) của các gói học kèm đã bị hủy khỏi giao diện quản lý thời khóa biểu của Lễ tân.
- **Kết quả**: Thành công

### [22/06/2026 11:51] — Tự động dọn dẹp lịch học và chặn đặt lịch khi hủy gói học
- **Loại**: Sửa lỗi logic & Đồng bộ dữ liệu
- **File**: `backend/src/routes/api.js`
- **Mô tả**:
  - **Chặn đặt lịch ở Portal**: Cập nhật API `POST /api/booking-requests` để kiểm tra điều kiện. Nếu học viên không có bất kỳ gói học nào (đại trà hoặc kèm) ở trạng thái `dang_hoat_dong`, hệ thống sẽ chặn và trả về thông báo lỗi yêu cầu đăng ký gói mới.
  - **Tự động hủy lịch học kèm tương lai**: Khi hủy gói học kèm (`PUT /api/registrations/tutoring/:id/cancel`), tự động cập nhật tất cả ca học chưa dạy (`trang_thai = 'cho_hoc'`) của gói đó thành `'da_huy'`.
  - **Tự động rút học viên khỏi lớp nhóm**: Khi hủy gói đại trà (`PUT /api/registrations/:id/cancel`), tự động xóa liên kết của học viên đó khỏi bảng `lop_hoc_hoc_vien`. Việc này tự động dọn sạch các ca học nhóm của lớp đó khỏi thời khóa biểu cá nhân của học viên.
- **Kết quả**: Thành công

### [22/06/2026 11:42] — Tính toán tự động số tiền hoàn trả gợi ý khi hủy khóa học
- **Loại**: Cải tiến tính năng & Trải nghiệm người dùng
- **File**: `backend/src/routes/api.js`, `frontend/src/pages/StudentRequests.js`
- **Mô tả**:
  - **Backend**: Cập nhật query `GET /api/registrations` lấy thêm dữ liệu `so_buoi_dang_ky` (Tổng số ca học nhóm được xếp lịch trong thời gian gói) và `so_buoi_da_hoc` (Số ca học nhóm của lớp có trạng thái là `da_hoc`) của học viên lớp đại trà bằng subquery thông minh.
  - **Frontend**: Triển khai công thức tự động tính tiền hoàn gợi ý: `Tiền hoàn = Tiền đã thu - (Số ca đã học * (Giá thực tế / Tổng số ca xếp lịch))` áp dụng đồng bộ cho cả gói học kèm và đại trà. Hệ thống hiển thị sẵn số tiền gợi ý này lên form nhưng vẫn cho phép Lễ tân chỉnh sửa nếu muốn.
- **Kết quả**: Thành công

### [22/06/2026 11:28] — Chuẩn hóa định dạng tiền tệ (dấu chấm) cho các ô nhập số tiền trong hệ thống
- **Loại**: Cải tiến trải nghiệm người dùng
- **File**: `frontend/src/pages/StudentRequests.js`, `frontend/src/pages/CoursePackages.js`, `frontend/src/pages/TutoringPackages.js`
- **Mô tả**:
  - Chuyển đổi các trường nhập số tiền từ `type="number"` sang `type="text"`.
  - Tích hợp hàm `formatCurrencyInput` và `parseCurrencyInput` để tự động định dạng dấu chấm phân cách hàng nghìn khi người dùng gõ hoặc khi tải dữ liệu cũ lên form, áp dụng cho:
    1. Ô nhập **Số tiền hoàn trả** khi hủy khóa học (`StudentRequests.js`).
    2. Ô nhập **Giá tiền** khi thêm/sửa Gói học đại trà (`CoursePackages.js`).
    3. Ô nhập **Giá tiền** khi thêm/sửa Gói học kèm 1-1 / 1-2 (`TutoringPackages.js`).
- **Kết quả**: Thành công

### [22/06/2026 11:20] — Hiển thị và xử lý hủy gói học kèm 1-1 tại tab Yêu cầu
- **Loại**: Cải tiến tính năng & Sửa lỗi logic
- **File**: `backend/src/routes/api.js`, `frontend/src/pages/StudentRequests.js`
- **Mô tả**:
  - **Backend**: Cập nhật API `GET /api/registrations` dùng `UNION ALL` để gộp danh sách đăng ký khóa học đại trà (`dang_ky_khoa_hoc`) và đăng ký học kèm (`dang_ky_hoc_kem`), bổ sung cột `loai_goi` để phân biệt.
  - **Frontend**: Hiển thị badge phân loại trực quan (`Đại trà` / `Kèm 1-1`). Cập nhật logic hủy để gọi đúng endpoint (`/api/registrations/tutoring/:id/cancel` cho học kèm và `/api/registrations/:id/cancel` cho đại trà).
- **Kết quả**: Thành công

### [22/06/2026 10:10] — Khắc phục lỗi popup lịch (date picker) bị cắt do overflow-hidden
- **Loại**: Sửa lỗi giao diện & Trải nghiệm người dùng
- **File**: `frontend/src/pages/CourseRegistrations.js`, `frontend/src/pages/AddStudentForm.js`
- **Mô tả**: Thay đổi class `overflow-hidden` thành `overflow-visible` trên các container card cha của Form. Đồng thời bo góc thủ công cột trái màu kem `bg-apple-parchment` để giao diện giữ nguyên vẻ bo tròn Apple-style, giải quyết triệt để lỗi popup lịch bị cắt khi vượt quá chiều cao card.
- **Kết quả**: Thành công

### [22/06/2026 09:05] — Cải tiến giao diện Đăng ký / Thu phí (CourseRegistrations.js)
- **Loại**: Cải tiến tính năng & Trải nghiệm người dùng
- **File**: `frontend/src/pages/CourseRegistrations.js`
- **Mô tả**:
  - Chuyển đổi hai trường nhập liệu thủ công "Mã học viên (ID hồ sơ)" và "Mã gói học phí (ID)" thành Dropdown `<select>` tải động dữ liệu từ máy chủ. Định dạng hiển thị học viên được chuẩn hóa thân thiện: `[Tên Học Viên] - [Mã HS]`.
  - Tự động điền giá tiền gói học tương ứng vào ô "Giá trị khóa học" và "Thực thu" khi người dùng chọn gói học phí.
  - Tự động cộng số tháng hiệu lực của gói học đó vào Ngày bắt đầu để tính toán và tự động điền Ngày kết thúc.
- **Kết quả**: Thành công

### [22/06/2026 08:20] — Duy trì trạng thái accordion và căn chỉnh các nút góc phải cùng hàng
- **Loại**: Chỉnh sửa giao diện & Trải nghiệm người dùng
- **File**: `frontend/src/pages/ClassManagement.js`, `frontend/src/pages/AccountManagement.js`, `frontend/src/pages/CoursePackages.js`, `frontend/src/pages/TutoringPackages.js`, `frontend/src/pages/SalaryManagement.js`, `frontend/src/pages/LessonDiary.js`
- **Mô tả**:
  - Tích hợp biến trạng thái `openSubLists` để lưu trữ các ID của accordion đang được mở trong tab Lớp học & xếp lịch. Khi người dùng xóa một buổi học đơn lẻ bất kỳ và danh sách được tải lại, trạng thái accordion của ca học đó vẫn được duy trì mở.
  - Quét toàn bộ các trang và điều chỉnh Header, thêm tiêu đề trang còn thiếu và dồn cụm nút bấm thao tác (Thêm, Tải lại) về góc bên phải cùng hàng một cách đồng bộ.
- **Kết quả**: Thành công

### [19/06/2026 14:21] — Sửa lỗi không Hủy được ca học nhóm đơn lẻ trong danh sách chi tiết
- **Loại**: Sửa bug giao diện
- **File**: `frontend/src/pages/ClassManagement.js`
- **Mô tả**: Bổ sung thuộc tính `data-contract-id="${item.id}"` bị thiếu ở thẻ button Hủy ca học nhóm đơn lẻ (`btn-delete-single-session`) trong template accordion. Thiếu thuộc tính này khiến hàm click listener không thể nhận diện được đây là ca học nhóm, từ đó gửi sai endpoint / sai method dẫn tới thao tác hủy không phản hồi.
- **Kết quả**: Thành công

### [19/06/2026 14:09] — Đồng bộ chặn điểm danh trước giờ học cho tab Hôm nay và Tổng quan
- **Loại**: Sửa bug & Trải nghiệm người dùng
- **File**: `frontend/src/pages/TeacherPortal.js`
- **Mô tả**:
  - Tích hợp helper `isTimeToShowAttendance` vào nút điểm danh nhanh của tab **Hôm nay** (trong phần Lịch dạy) và mục **Lịch dạy hôm nay** (trong phần Tổng quan).
  - Làm mờ các nút điểm danh nếu ca học chưa đến giờ bắt đầu, click vào sẽ chặn thao tác và hiển thị Toast báo lỗi `"Chưa đến giờ học, không thể điểm danh trước!"`.
- **Kết quả**: Thành công

### [19/06/2026 13:55] — Tích hợp điểm danh nhanh vào tab Tuần này & Tháng này trong Cổng Giáo viên
- **Loại**: Cải tiến tính năng & Trải nghiệm người dùng
- **File**: `frontend/src/pages/TeacherPortal.js`
- **Mô tả**:
  - Thêm cụm nút điểm danh nhanh (`✓ Đã học` và `✗ HV Vắng`) vào chế độ xem danh sách ca học của cả hai tab **Tuần này** và **Tháng này**.
  - Tích hợp logic kiểm tra thời gian học bằng helper `isTimeToShowAttendance`:
    - Nếu đã đến giờ học: Hiển thị nút bình thường và cho phép điểm danh thành công với thông báo Toast chúc mừng.
    - Nếu chưa đến giờ học: Làm mờ nút (xám và thay đổi cursor) và lắng nghe sự kiện click để hiển thị Toast thông báo lỗi `"Chưa đến giờ học, không thể điểm danh trước!"`.
- **Kết quả**: Thành công

### [19/06/2026 13:45] — Tích hợp 3 nút sub-tabs: Hôm nay, Tuần này, Tháng này cho Lịch dạy của Giáo viên
- **Loại**: Cải tiến tính năng & Giao diện người dùng
- **File**: `frontend/src/pages/TeacherPortal.js`
- **Mô tả**:
  - Tách giao diện Lịch dạy thành 3 chế độ xem riêng biệt qua thanh chuyển đổi nhanh:
    - **Hôm nay**: Chỉ hiển thị danh sách các ca dạy trong ngày hiện tại.
    - **Tuần này**: Lọc và chỉ hiển thị lịch dạy từ đầu tuần đến Chủ Nhật của tuần hiện tại (7 ngày).
    - **Tháng này**: Hiển thị toàn bộ lịch dạy đã xếp trong vòng 30 ngày tới.
  - Cả 3 tab đều áp dụng đồng bộ logic sắp xếp ưu tiên trạng thái buổi học và sắp xếp xoay vòng thời gian ngày học.
- **Kết quả**: Thành công

### [19/06/2026 13:35] — Mở rộng hiển thị lịch dạy lên 30 ngày và sắp xếp xoay vòng thời gian
- **Loại**: Cải tiến tính năng & Trải nghiệm người dùng
- **File**: `backend/src/routes/api.js`, `frontend/src/pages/TeacherPortal.js`
- **Mô tả**:
  - **Backend**: Cập nhật query `tuanNayRes` trong API `/api/teacher-portal/overview` để lấy lịch dạy từ đầu tuần hiện tại đến 30 ngày tiếp theo (thay vì chỉ 7 ngày), giúp giáo viên nhìn thấy được lịch học 1 tháng đã xếp.
  - **Frontend**:
    * Đổi tên tiêu đề từ "Lịch dạy tuần này" thành "Lịch dạy 30 ngày tới".
    * Cập nhật logic sắp xếp xoay vòng ngày dạy: Những ngày $\ge$ ngày hôm nay (ngày hiện tại và tương lai) sẽ được xếp lên đầu tiên và tăng dần theo thời gian. Những ngày thuộc quá khứ của tuần hiện tại đã trôi qua sẽ tự động chuyển xuống dưới cùng của danh sách.
- **Kết quả**: Thành công

### [19/06/2026 13:20] — Đưa ngày hiện tại (Hôm nay) lên đầu danh sách Lịch tuần này
- **Loại**: Cải tiến trải nghiệm người dùng
- **File**: `frontend/src/pages/TeacherPortal.js`
- **Mô tả**: Cập nhật logic sắp xếp danh sách ngày ở tab "Tuần này". So khớp với nhãn ngày hiện tại để luôn đưa ngày "Hôm nay" lên đầu danh sách của tuần, các ngày khác được xếp sau đó theo thứ tự thời gian tăng dần, giúp giáo viên nắm bắt ngay lịch làm việc của ngày hiện tại. Đồng thời thêm tag "Hôm nay" nhỏ màu xanh bên cạnh tiêu đề ngày để dễ nhận biết.
- **Kết quả**: Thành công

### [19/06/2026 11:55] — Sắp xếp thứ tự ca dạy và gộp tab Hôm nay / Tuần này thành tab Lịch dạy
- **Loại**: Cải tiến tính năng & Trải nghiệm người dùng
- **File**: `frontend/src/pages/TeacherPortal.js`
- **Mô tả**:
  - **Sắp xếp thứ tự ca dạy**: Tạo hàm helper `sortSessions` dùng chung giúp gom nhóm và sắp xếp thứ tự ưu tiên các ca dạy trong ngày. Các ca chờ dạy (`cho_hoc`) được đưa lên trên đầu (sắp xếp tăng dần theo giờ bắt đầu), tiếp theo là các ca đã dạy/học viên vắng (`da_hoc`, `vang`), và cuối cùng là các ca đã hủy (`da_huy`). Áp dụng cho cả trang Tổng quan và trang Lịch dạy.
  - **Gộp tab**: Xóa bỏ 2 tab riêng biệt "Hôm nay" và "Tuần này" khỏi thanh Menu chính. Thay bằng 1 tab tích hợp duy nhất mang tên "Lịch dạy" chứa hai sub-tabs nhỏ ("Hôm nay" và "Tuần này") cho phép chuyển đổi nhanh, giúp giao diện gọn gàng hơn.
- **Kết quả**: Thành công

### [19/06/2026 11:30] — Sửa lỗi mất lịch và lệch ngày học do múi giờ ở Cổng Giáo viên
- **Loại**: Sửa bug database & Frontend
- **File**: `backend/src/routes/api.js`, `frontend/src/pages/TeacherPortal.js`
- **Mô tả**:
  - **Backend**: Cast các giá trị ngày của `DATE_TRUNC` trong câu SQL query của `tuanNayRes` về kiểu `::date` để so sánh ngày học thuần túy, ngăn ngừa sai lệch dữ liệu do múi giờ session của cơ sở dữ liệu làm mất lịch học.
  - **Frontend**: Khởi tạo hàm helper `parseSafeDate` parse chuỗi ngày học `YYYY-MM-DD` an toàn, tránh lệch múi giờ trên trình duyệt và áp dụng đồng bộ vào hàm format `formatDate` cùng logic gom nhóm lịch dạy tuần này `_tabWeek`.
- **Kết quả**: Thành công

### [19/06/2026 11:12] — Tích hợp hiển thị nội dung, cho phép chỉnh sửa đánh giá giáo viên và thêm thông báo Toast
- **Loại**: Cải tiến tính năng
- **File**: `backend/src/routes/api.js`, `frontend/src/pages/StudentPortal.js`
- **Mô tả**:
  - **Backend**: Cập nhật query `GET /api/schedules` thực hiện `LEFT JOIN` với bảng `danh_gia_giao_vien` để lấy lại số sao và nhận xét cũ của học viên. Cập nhật `POST /api/ratings` để tự động chuyển sang cơ chế `UPDATE` bản ghi nếu học viên đã đánh giá buổi học đó, thay vị chặn lỗi.
  - **Frontend**: 
    * Nút "Đánh giá GV" sẽ đổi trạng thái thành "Sửa đánh giá (X★)" nếu học viên đã đánh giá. Khi click vào, modal tự động tải lại các thông tin đánh giá cũ (số sao, nhận xét) cho phép học viên xem lại và lưu cập nhật đè lên.
    * Import và tích hợp hàm `showToast` từ `_shared.js` để hiển thị popup thông báo thành công (Apple Style) khi gửi hoặc cập nhật đánh giá thành công, hoặc thông báo lỗi nếu có trục trặc.
- **Kết quả**: Thành côngt` từ `_shared.js` để hiển thị popup thông báo thành công (Apple Style) khi gửi hoặc cập nhật đánh giá thành công, hoặc thông báo lỗi nếu có trục trặc.
- **Kết quả**: Thành công

### [19/06/2026 11:00] — Khắc phục lỗi 500 khi Học viên đánh giá giáo viên lớp học nhóm
- **Loại**: Sửa bug database & Backend
- **File**: `backend/src/config/db.js`, `backend/src/routes/api.js`, Database (danh_gia_giao_vien)
- **Mô tả**:
  - **Database**: Gỡ bỏ ràng buộc `NOT NULL` của cột `lich_hoc_id` trong bảng `danh_gia_giao_vien` bằng câu lệnh SQL `ALTER COLUMN lich_hoc_id DROP NOT NULL`. Điều này cho phép học viên thực hiện đánh giá cho ca học nhóm (chỉ truyền `lich_hoc_nhom_id` còn `lich_hoc_id` bằng `null`) mà không vi phạm ràng buộc dữ liệu.
  - **Backend**: Cập nhật API check trạng thái đánh giá `GET /api/ratings/check/:lich_hoc_id` để tự động kiểm tra loại ca học (kèm 1-1 hay lớp nhóm) tương tự như API lưu đánh giá, tránh lỗi 500 khi tra cứu trạng thái đánh giá của lớp học nhóm.
- **Kết quả**: Thành công

### [19/06/2026 10:52] — Vá lỗi thiếu cột nhan_xet trong bảng đánh giá giáo viên
- **Loại**: Sửa bug database & Backend
- **File**: `backend/src/config/db.js`, Database (danh_gia_giao_vien)
- **Mô tả**:
  - **Database**: Chạy script migration bổ sung cột `nhan_xet TEXT` còn thiếu vào bảng `danh_gia_giao_vien` để tránh lỗi `column "nhan_xet" of relation "danh_gia_giao_vien" does not exist` khi học viên gửi đánh giá.
  - **Backend**: Cập nhật tệp khởi tạo cấu hình `db.js` thêm lệnh `ALTER TABLE danh_gia_giao_vien ADD COLUMN IF NOT EXISTS nhan_xet TEXT;` để tự động vá cột này nếu khởi chạy lại hệ thống trên môi trường sạch.
- **Kết quả**: Thành công

### [19/06/2026 10:45] — Phát triển API điểm danh PUT /api/attendance/:id & Tối ưu trạng thái Đang học động
- **Loại**: Cải tiến tính năng & Sửa bug
- **File**: `backend/src/routes/api.js`, `frontend/src/pages/ClassManagement.js`, `frontend/src/pages/TeacherPortal.js`, `frontend/src/pages/StudentPortal.js`
- **Mô tả**:
  - **Backend**: Xây dựng mới hoàn toàn API `PUT /api/attendance/:id` hỗ trợ tự động định tuyến và điểm danh (Đã dạy/Vắng) cho cả ca học kèm `lich_hoc` lẫn ca học nhóm `lich_hoc_nhom`, giải quyết triệt để lỗi 404 Not Found từ Cổng Giáo viên.
  - **Frontend**: Phát triển helper check động thời gian thực tế ở cả 3 trang Portal Admin, Cổng Giáo viên và Cổng Học viên. Nếu buổi học ở trạng thái "Chờ học" nhưng thời gian hiện tại đã bước vào khung giờ học, nhãn hiển thị sẽ tự động chuyển sang màu xanh dương **"Đang học"**, ngược lại hiển thị màu vàng **"Chờ học"**.
- **Kết quả**: Thành công

### [19/06/2026 10:30] — Gộp lịch dạy/học lớp nhóm vào các Portal và chuẩn hóa trạng thái Chờ học

### [19/06/2026 10:07] — Hoàn thiện tính năng Sửa và Xóa dặn dò GV
- **Loại**: Cải tiến tính năng
- **File**: `backend/src/routes/api.js`, `frontend/src/pages/LessonDiary.js`
- **Mô tả**:
  - **Backend**: Bổ sung API `PUT /api/notes/:id` cho phép cập nhật nội dung ghi chú dặn dò đã viết.
  - **Frontend**: Hiển thị thêm nút **Sửa** (icon bút chì màu xanh) trên mỗi thẻ dặn dò có quyền. Phát triển modal chỉnh sửa dặn dò `edit-note-modal` và kết nối API gửi cập nhật thành công.
- **Kết quả**: Thành công

### [19/06/2026 10:05] — Phát triển và tối ưu hóa phân hệ Ghi chú dặn dò GV
- **Loại**: Cải tiến tính năng & Sửa bug
- **File**: `backend/src/routes/api.js`, `frontend/src/pages/LessonDiary.js`
- **Mô tả**:
  - **Backend**: Cập nhật API `GET /api/notes` hỗ trợ vai trò `admin`/`le_tan` truy xuất toàn bộ danh sách ghi chú từ giáo viên gửi học viên. Thêm API `DELETE /api/notes/:id` để hỗ trợ xóa ghi chú dặn dò dư thừa.
  - **Frontend**: Khắc phục lỗi truyền thiếu role khiến tab "Ghi chú dặn dò GV" trống rỗng. Thêm nút Xóa dặn dò cho Admin, Lễ tân và Giáo viên tạo ghi chú đó.
- **Kết quả**: Thành công

### [19/06/2026 08:38] — Dọn dẹp code trùng lặp và sửa lỗi cú pháp dặn dò giáo viên trong TeacherPortal.js
- **Loại**: Sửa bug & Cải tiến tính năng
- **File**: `frontend/src/pages/TeacherPortal.js`
- **Mô tả**: Loại bỏ khối lệnh submit form trùng lặp dư thừa ở cuối hàm `_tabDiary` gây lỗi cú pháp JS trong Cổng giáo viên.
- **Kết quả**: Thành công

### [18/06/2026 13:38] — Tích hợp tính năng Sửa, Xóa nhận xét vào Cổng Giáo viên
- **Loại**: Cải tiến tính năng
- **File**: `frontend/src/pages/TeacherPortal.js`
- **Mô tả**: Tích hợp các nút Sửa, Xóa và Modal chỉnh sửa nhận xét buổi học vào mục Sổ liên lạc của Cổng Giáo viên (`TeacherPortal.js`), đồng bộ hóa trải nghiệm quản lý chất lượng đào tạo với Cổng Admin và Cổng Lễ tân.
- **Kết quả**: Thành công

### [18/06/2026 13:34] — Mở rộng quyền Viết, Sửa, Xóa nhận xét sổ liên lạc cho Nhân viên Lễ tân
- **Loại**: Cải tiến tính năng / Phân quyền
- **File**: `frontend/src/pages/LessonDiary.js`
- **Mô tả**: Cập nhật điều kiện hiển thị nút "Viết nhận xét", "Sửa nhận xét" và "Xóa nhận xét" để hỗ trợ thêm cả vai trò Nhân viên Lễ tân (`le_tan`) thao tác trực tiếp, thay vì chỉ giới hạn cho Admin và Giáo viên như trước.
- **Kết quả**: Thành công

### [18/06/2026 13:16] — Sửa lỗi hiển thị sai tên người nhận xét, Cập nhật chức vụ Admin & Tích hợp Sửa/Xóa nhận xét
- **Loại**: Cải tiến tính năng & Sửa bug
- **File**: `backend/src/routes/api.js`, `frontend/src/pages/LessonDiary.js`, Database (ho_so)
- **Mô tả**:
  - **Sửa lỗi hiển thị sai tên người gửi**: Đổi trường fallback từ `userId` thành `taiKhoanId` (đúng cấu trúc lưu trong localStorage của hệ thống) trong `LessonDiary.js` giúp tài khoản Admin gửi đúng ID của mình là `1` (Nguyễn Văn Admin) lên backend, chấm dứt việc hiển thị sai tên thành Trần Thị Lễ Tân.
  - **Cập nhật chức vụ Admin**: Thực thi lệnh SQL cập nhật trường `chuc_vu` của hồ sơ Admin thành `'Quản trị viên'` trong database để hiển thị đúng trong danh sách nhân viên của trung tâm.
  - **Tích hợp tính năng Sửa & Xóa nhận xét**:
    - **Backend**: Thêm router `PUT /api/reports/:id` (cập nhật nhận xét) và `DELETE /api/reports/:id` (xóa nhận xét).
    - **Frontend**: Hiển thị nút Sửa/Xóa trực quan trên timeline nhận xét của giáo viên/admin, phát triển Modal chỉnh sửa nhận xét buổi học và tích hợp gọi các API tương ứng.
- **Kết quả**: Thành công

### [18/06/2026 11:44] — Sửa lỗi 500 khi lưu nhận xét do thiếu các trường người gửi trong SQL Insert
- **Loại**: Sửa bug Backend
- **File**: `backend/src/routes/api.js`
- **Mô tả**: Sửa lỗi 500 do Database yêu cầu `nguoi_gui_id` không được null (`violates not-null constraint`). Cập nhật câu lệnh `INSERT INTO so_lien_lac` để bóc tách và ghi nhận đầy đủ các thông tin: `nguoi_gui_id`, `vai_tro_gui`, `loai_nhat_ky` từ request body của frontend gửi lên.
- **Kết quả**: Thành công

### [18/06/2026 11:40] — Tối ưu hóa liên kết tài khoản Admin/Lễ tân & Loại trừ tính lương Admin
- **Loại**: Cải tiến dữ liệu & Backend
- **File**: `backend/src/routes/api.js`, Database (tai_khoan)
- **Mô tả**:
  - **Liên kết tài khoản**: Cập nhật cơ sở dữ liệu để liên kết tài khoản `admin` với hồ sơ nhân sự `Nguyễn Văn Admin` (ho_so_id = 1), và tài khoản `letan01` với hồ sơ `Test Nhan Vien 2` (ho_so_id = 49).
  - **Loại trừ Admin khỏi bảng lương**:
    - Cập nhật API `GET /api/payroll/summary` để tự động loại trừ các hồ sơ bắt đầu bằng mã `AD` (Admin) khỏi danh sách tính lương hàng tháng của trung tâm.
    - Cập nhật API `GET /api/payroll/my-salary` để trả về lỗi 404 (Không có phiếu lương) nếu tài khoản tra cứu thuộc diện Admin.
- **Kết quả**: Thành công

### [18/06/2026 11:18] — Sửa lỗi gửi nhận xét sổ liên lạc từ Admin & Lỗi thiếu hàm showToast ở Frontend
- **Loại**: Sửa bug hệ thống
- **File**: `backend/src/routes/api.js`, `frontend/src/pages/LessonDiary.js`
- **Mô tả**:
  - **api.js (Sửa lỗi 500 khi Admin gửi nhận xét)**: Thêm kiểm tra `giao_vien_id` truyền lên từ client. Nếu ID này không tồn tại trong bảng `ho_so` (do tài khoản Admin chưa liên kết hồ sơ nhân sự), hệ thống tự động tìm và gán một hồ sơ nhân viên/giáo viên hợp lệ trong DB làm đại diện thay thế, ngăn chặn lỗi vi phạm khóa ngoại (foreign key constraint).
  - **LessonDiary.js (Sửa lỗi ReferenceError)**: Import hàm `showToast` từ `./_shared.js` vào đầu file để hiển thị popup thông báo thành công/thất bại khi lưu sổ liên lạc.
- **Kết quả**: Thành công

### [18/06/2026 11:08] — Bổ sung API Sổ liên lạc & Nhật ký học tập của học viên ở Backend
- **Loại**: Sửa bug / Bổ sung tính năng Backend
- **File**: `backend/src/routes/api.js`
- **Mô tả**:
  - **Tạo bảng `so_lien_lac` tự động**: Tự động tạo bảng `so_lien_lac` lưu trữ thông tin học tập của học viên nếu chưa tồn tại.
  - **API GET `/api/reports/student/:studentId`**: Định nghĩa endpoint để lấy lịch sử sổ liên lạc của một học sinh, kèm tên giáo viên dạy thông qua JOIN.
  - **API POST `/api/reports`**: Định nghĩa endpoint cho phép giáo viên gửi nhận xét, bài tập về nhà, số phút học và dặn dò của buổi học, đồng thời gửi thông báo tự động cho học viên.
- **Kết quả**: Thành công

### [18/06/2026 10:53] — Hoàn thiện CSS Styles phiếu lương Mobile & Tích hợp xem phiếu lương cho Admin/Lễ tân
- **Loại**: Cải tiến tính năng / UI UX Mobile App
- **File**: `mobile/src/screens/teacher/TeacherHome.js`, `mobile/src/screens/admin/AdminHome.js`
- **Mô tả**:
  - **TeacherHome.js — Bổ sung StyleSheet**: Khai báo đầy đủ 23 class CSS còn thiếu cho phần Bento Card "Tài chính cá nhân" và Modal chi tiết phiếu lương tháng của Giáo viên (`salaryBentoCard`, `salaryBentoLeft`, `salaryIconBox`, `salaryBentoTitle`, `salaryBentoAmount`, `salaryBentoRight`, `miniStatusBadge`, `miniStatusText`, `modalOverlay`, `modalContainer`, `modalHeader`, `modalTitle`, `modalSubtitle`, `closeBtn`, `modalContent`, `totalSalaryCard`, `totalSalaryLabel`, `totalSalaryText`, `statusBadgeLarge`, `detailSection`, `detailSectionTitle`, `detailRow`, `detailLabel`, `detailVal`).
  - **AdminHome.js — Tích hợp phiếu lương cá nhân**: Import thêm `Modal`, `ScrollView` từ React Native và các icon `CreditCard`, `ChevronRight`, `X` từ lucide. Thêm state `salary` + `showSalaryModal`. Gọi API `/api/payroll/my-salary` khi có `hoSoId` để tra cứu lương tháng hiện tại của chính Admin/Lễ tân. Hiển thị Bento Card "Tài chính cá nhân" với số tiền thực lĩnh và trạng thái thanh toán. Modal chi tiết hiển thị lương ngày công, đơn giá ngày, phụ cấp, khấu trừ và tổng thực lĩnh. Bổ sung đầy đủ 23 class CSS tương ứng vào StyleSheet.
- **Kết quả**: Thành công

### [18/06/2026 09:24] — Tích hợp 4 Cải tiến tính năng Tính lương & Phụ cấp nhân sự
- **Loại**: Cải tiến tính năng / UI UX & Cơ sở dữ liệu
- **File**: `backend/src/config/db.js`, `backend/src/routes/api.js`, `frontend/src/pages/SalaryManagement.js`, `frontend/src/pages/TeachersList.js`, `frontend/src/pages/StaffList.js`
- **Mô tả**:
  - **Cải tiến 1 (Phụ cấp & Khấu trừ động)**: Cho phép sửa Phụ cấp & Khấu trừ trực tiếp bằng ô nhập liệu định dạng tiền tệ trên giao diện, tự động tính lại Thực lĩnh và Bento KPI tổng lương real-time. Lưu thành công trường khấu trừ vào database.
  - **Cải tiến 2 (Lương theo cấu hình riêng)**: Bổ sung 3 trường cấu hình lương (`luong_cung_ngay`, `don_gia_ca_nhom`, `don_gia_ca_kem`) vào bảng `ho_so` và form edit của Nhân viên/Giáo viên. API tự động tính lương theo đơn giá riêng của từng người.
  - **Cải tiến 3 (Xem chi tiết công & ca dạy)**: Chuyển text thống kê công quét và số ca dạy thành link liên kết, click vào sẽ mở modal chi tiết danh sách ngày quét thẻ (cho nhân sự) hoặc ca dạy học đã hoàn thành (cho giáo viên) trong tháng chọn lọc để đối chiếu.
  - **Cải tiến 4 (Snapshot chốt lương)**: Lưu trữ và chốt số liệu cứng sau khi bấm "Thanh toán". Lương tháng đã thanh toán sẽ hiển thị số liệu từ Snapshot trong bảng `bang_luong`, không bị thay đổi động khi phát sinh ngày công/ca dạy mới.
- **Kết quả**: Thành công

### [18/06/2026 09:01] — Lọc lượt quét Vào - Ra trong ngày và cải tiến cuộn dọc danh sách
- **Loại**: Cải tiến giao diện / Trải nghiệm người dùng
- **File**: `frontend/src/pages/CheckinLogs.js`
- **Mô tả**:
  - **Lọc chỉ hiện ngày hôm nay**: Lọc danh sách lượt quét từ API dựa theo ngày hiện tại ở múi giờ địa phương, đảm bảo chỉ hiển thị các lượt check-in/out của ngày hôm nay, không còn hiển thị dữ liệu của ngày hôm qua.
  - **Tối ưu hóa thanh cuộn (Scrollbar)**: Loại bỏ cơ chế phân trang kéo/vuốt (Swipe Pagination) không thuận tiện trên thiết bị máy tính, thay thế bằng thanh cuộn dọc tự nhiên với chiều cao tối đa cố định giúp giao diện hiển thị liền mạch và dễ dàng theo dõi.
- **Kết quả**: Thành công

### [18/06/2026 08:33] — Sửa lỗi 403 Forbidden ở Bảng chấm công và Tính lương
- **Loại**: Sửa bug hệ thống
- **File**: `frontend/src/pages/AttendanceStaff.js`, `frontend/src/pages/SalaryManagement.js`
- **Mô tả**: Sửa lỗi 403 Forbidden bằng cách bổ sung đầy đủ headers 'x-user-role' và 'x-user-branch' vào tất cả các yêu cầu fetch gọi API chấm công (đối với danh sách giáo viên, nhân sự trong modal ghi nhận chấm công) và API tính toán lương tháng (đối với danh sách bảng thanh toán lương chi tiết).
- **Kết quả**: Thành công

### [18/06/2026 08:22] — Đơn giản hóa Thời khóa biểu: Cố định chế độ xem Tuần và loại bỏ Năm/Tháng
- **Loại**: Cải tiến tính năng / UI UX
- **File**: `frontend/src/pages/Schedules.js`
- **Mô tả**: Tối ưu hóa triệt để giao diện bằng cách loại bỏ hoàn toàn các chế độ xem trung gian không cần thiết (Decade, Year, Month view) và dọn dẹp các nút bấm chuyển đổi. Cố định giao diện Thời khóa biểu ở chế độ xem **Tuần** chi tiết (lưới giờ học thực tế). Đồng thời, vô hiệu hóa sự kiện click vào tiêu đề tuần để tránh zoom out ngoài ý muốn.
- **Kết quả**: Thành công

### [17/06/2026 16:48] — Tối ưu hóa bật sáng đèn nút view mode trong Schedules.js
- **Loại**: Sửa bug giao diện / Trải nghiệm người dùng
- **File**: `frontend/src/pages/Schedules.js`
- **Mô tả**: Sửa đổi triệt để hàm `updateViewBtns()` để loại bỏ hoàn toàn việc sáng đèn trùng lặp hoặc không đồng bộ giữa các tab view mode khi chuyển cấp độ zoom. Thiết lập logic tường minh: nút Năm sáng khi ở chế độ `year` hoặc `decade`, nút Tháng sáng khi ở chế độ `month`, nút Tuần sáng khi ở chế độ `week`.
- **Kết quả**: Thành công

### [17/06/2026 16:45] — Hoàn thiện Thời khóa biểu: Chuẩn hóa múi giờ và Đồng bộ zoom nút view
- **Loại**: Cải tiến tính năng / UI UX
- **File**: `frontend/src/pages/Schedules.js`
- **Mô tả**:
  - **Khắc phục lệch múi giờ**: Loại bỏ hoàn toàn phương thức `.toISOString()` khi so khớp ngày học. Thay vào đó, trích xuất chuỗi ngày học sạch từ backend bằng `.substring(0, 10)` và format ngày ô lịch theo giờ địa phương (`YYYY-MM-DD`). Giải pháp này giúp thời khóa biểu khớp chính xác 100% không bị lệch ngày học do timezone offset (đặc biệt khi xem vào buổi sáng sớm trước 7 giờ).
  - **Sửa zoom nút view**: Cập nhật lại logic của nút **Năm** (gán `viewMode = 'year'` để hiện 12 tháng) và nút **Tháng** (gán `viewMode = 'month'` để hiện lưới ngày) giúp các nút hoạt động đúng theo đúng nhãn của chúng, không bị lệch cấp độ zoom.
- **Kết quả**: Thành công

### [17/06/2026 16:03] — Khắc phục lỗi SQL 500 khi sửa đổi ca học nhóm đơn lẻ
- **Loại**: Sửa bug hệ thống
- **File**: `backend/src/routes/api.js`
- **Mô tả**: Khắc phục lỗi SQL 500 `Internal Server Error: column "ngay_cap_nhat" of relation "lich_hoc_nhom" does not exist` khi gọi API `PUT /api/classes/schedule/:id` để dời ngày ca học nhóm đơn lẻ. Đã loại bỏ trường `ngay_cap_nhat` khỏi câu truy vấn `UPDATE lich_hoc_nhom` vì bảng này không sở hữu cột đó.
- **Kết quả**: Thành công

### [17/06/2026 15:57] — Đồng bộ ẩn lịch đã hủy trên Thời khóa biểu và Hoàn thiện sửa ca đơn lẻ
- **Loại**: Sửa bug / Trải nghiệm người dùng
- **File**: `backend/src/routes/api.js`, `frontend/src/pages/ClassManagement.js`
- **Mô tả**:
  - **Ẩn lịch đã hủy trên Thời khóa biểu**: Sửa câu SQL query của API `GET /api/schedules` bổ sung thêm điều kiện lọc `lh.trang_thai != 'da_huy'` và `lhn.trang_thai != 'da_huy'` để ẩn sạch các lịch học/dạy đã hủy khỏi tab **Thời khóa biểu**.
  - **Sửa ca nhóm đơn lẻ thành công**: Thêm trường `'nhom' as loai_buoi` vào API `GET /api/classes/schedules` giúp frontend đối chiếu tìm kiếm chính xác thông tin ca học nhóm đơn lẻ, giải quyết dứt điểm lỗi thông báo "Không tìm thấy thông tin ca học" khi bấm nút Sửa trong accordion chi tiết.
  - **Tránh gây hiểu lầm khi Sửa chuỗi (Sửa chung)**: Ẩn trường chọn Ngày học trên Modal khi người dùng chọn **Sửa chung** (Sửa chuỗi), do tính năng này chỉ áp dụng đổi giờ học, giáo viên và thời lượng cho các buổi chưa học. Đối với **Sửa buổi đơn lẻ**, trường Ngày học vẫn hiển thị và cho phép thay đổi ngày tự do.
- **Kết quả**: Thành công

### [17/06/2026 15:18] — Cập nhật khóa giờ quá khứ khi Sửa lịch và Khắc phục lỗi hiển thị sai ngày do trùng ID
- **Loại**: Cải tiến tính năng / UI UX / Sửa bug
- **File**: `frontend/src/pages/ClassManagement.js`
- **Mô tả**:
  - **Khóa giờ quá khứ khi Sửa**: Đồng bộ hóa logic của Modal chỉnh sửa ca học giống như Form đăng ký chính. Nếu ngày chọn sửa là ngày hôm nay, các khung giờ bắt đầu đã trôi qua so với thời gian thực tế sẽ bị xám (`disabled`) không cho phép chọn. Đồng thời, tự động kiểm tra và reset giờ bắt đầu đã chọn nếu đổi ngày học sang hôm nay và giờ đó đã quá hạn.
  - **Sửa lỗi hiển thị sai ngày**: Bổ sung kiểm tra thêm điều kiện loại hình lớp học (`loai_buoi` là `nhom` hoặc `ca_nhan`) trong hàm tìm kiếm `singleSession` của sự kiện sửa ca đơn lẻ. Thay đổi này giải quyết triệt để vấn đề xung đột trùng ID giữa bảng `lich_hoc` và `lich_hoc_nhom` trong kết quả gộp `UNION ALL`, đảm bảo ngày dạy học hiển thị trên Modal sửa ca đơn lẻ luôn chuẩn xác theo đúng buổi được chọn (ví dụ: Buổi 1 là 17/06, Buổi 2 là 19/06).
- **Kết quả**: Thành công

### [17/06/2026 14:54] — Khắc phục ReferenceError pendingSessions ở ClassManagement.js
- **Loại**: Sửa bug giao diện
- **File**: `frontend/src/pages/ClassManagement.js`
- **Mô tả**: Khắc phục lỗi `ReferenceError: pendingSessions is not defined` khi render dòng lịch học kèm 1-1. Lỗi do gọi trực tiếp biến `pendingSessions` nằm ngoài scope vòng lặp gộp trước đó. Đã chuyển sang sử dụng `item.pendingSessionsCount` giúp khôi phục hiển thị card **Lịch sử đặt lịch & Lớp học** phía Frontend.
- **Kết quả**: Thành công

### [17/06/2026 14:50] — Sửa lỗi SQL UNION ALL làm trống Thời khóa biểu và Lịch sử học kèm
- **Loại**: Sửa bug hệ thống
- **File**: `backend/src/routes/api.js`
- **Mô tả**: Khắc phục lỗi SQL query của API `GET /api/schedules` khi thực hiện `UNION ALL` gộp lịch kèm và lịch nhóm. Lỗi xảy ra do query cố gắng chọn cột `lhn.ngay_cap_nhat` vốn không tồn tại trong bảng `lich_hoc_nhom`, khiến API trả về lỗi 500. Đã sửa thành `NULL as ngay_cap_nhat` để đồng bộ cấu trúc cột, giúp khôi phục hoàn toàn dữ liệu hiển thị trên cả **Thời khóa biểu** lẫn **Lịch sử đặt lịch & Lớp học** phía Frontend.
- **Kết quả**: Thành công

### [17/06/2026 14:42] — Nâng cấp Accordion ca chi tiết cho lớp học nhóm và bổ sung các API quản lý ca đơn lẻ
- **Loại**: Cải tiến tính năng / UI UX / API mới
- **File**: `frontend/src/pages/ClassManagement.js`, `backend/src/routes/api.js`
- **Mô tả**:
  - **Backend**: Thêm mới API `GET /api/classes/schedules` để lấy toàn bộ ca học của các lớp học nhóm. Thêm mới các API `DELETE /api/classes/schedule/:id` và `PUT /api/classes/schedule/:id` cho phép Lễ tân xóa hoặc dời ngày, đổi giờ dạy, đổi giáo viên cho từng ca đơn lẻ của lớp học nhóm.
  - **Frontend**: Đồng bộ hóa giao diện lớp học nhóm trong Card Lịch sử bằng cách nhóm các ca dạy học của lớp nhóm theo `lop_hoc_id`, gộp hiển thị tất cả các thứ dạy học cố định (`thu_gop`) và khoảng ngày dạy. Bổ sung nút **"Xem chi tiết ca"** (Accordion) cho lớp học nhóm, cho phép Lễ tân click vào để bung ra danh sách chi tiết từng buổi học nhóm, tích hợp đầy đủ nút Sửa và Hủy cho từng ca đơn lẻ của lớp học nhóm đó.
- **Kết quả**: Thành công

### [17/06/2026 14:30] — Khắc phục lỗi hiển thị ca học 1-1, lỗi sinh ngày xếp lịch và thời khóa biểu trống
- **Loại**: Sửa bug logic & Giao diện
- **File**: `frontend/src/pages/ClassManagement.js`, `backend/src/routes/api.js`
- **Mô tả**:
  - Sửa thuật toán `getScheduleDates` trong `ClassManagement.js` tính toán ngày học bằng cách phân rã chuỗi `YYYY-MM-DD` trực tiếp thay vì parse Date object từ string giúp tránh triệt để lệch múi giờ JS.
  - Sắp xếp mảng chi tiết ca học kèm (`groupSessions`) tăng dần theo ngày học và hiển thị nút thao tác động (ẩn các nút Hủy/Sửa khi không còn ca "Chờ học" để tránh lễ tân hiểu nhầm là chưa hủy).
  - Cập nhật API `GET /api/schedules` ở backend thực hiện `UNION ALL` gộp cả lịch 1-1 (`lich_hoc`) và lịch nhóm (`lich_hoc_nhom`) giúp tab **Thời khóa biểu** hiển thị đầy đủ ca học.
- **Kết quả**: Thành công

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
