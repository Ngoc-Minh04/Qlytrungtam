---
trigger: always_on
---

# 📋 QUY TẮC BẮT BUỘC — AI AGENT PHẢI TUÂN THỦ

> ⚠️ ĐÂY LÀ FILE RULE TỐI THƯỢNG. ĐỌC TOÀN BỘ TRƯỚC KHI LÀM BẤT CỨ ĐIỀU GÌ.

---

## 🔴 RULE #0 — ĐỌC RULE TRƯỚC, LÀM SAU

Trước khi xử lý bất kỳ yêu cầu nào, Agent PHẢI tự kiểm tra:
- [ ] Đã đọc file rule này chưa?
- [ ] Yêu cầu có rõ ràng và đủ thông tin chưa?
- [ ] Đã đưa plan và được xác nhận chưa?

Nếu bất kỳ ô nào chưa tick → DỪNG LẠI và xử lý theo rule bên dưới.

---

## 🌐 RULE #1 — NGÔN NGỮ

**LUÔN trả lời bằng Tiếng Việt.** Không có ngoại lệ.
Ngoại lệ duy nhất: code, tên biến, tên hàm, comment trong code.

---

## 🛑 RULE #2 — PHÁT HIỆN YÊU CẦU MƠ HỒ

Nếu yêu cầu chứa bất kỳ từ nào sau đây:
> "đẹp hơn", "tốt hơn", "cải thiện", "tối ưu", "fix lại", "làm lại", "nhanh hơn", "gọn hơn", "chuẩn hơn", "better", "improve", "optimize", "refactor", "clean up"

→ **DỪNG NGAY. KHÔNG được tự đưa ra plan.**

→ **PHẢI hỏi đúng 3 câu này trước:**
1. "Kết quả cụ thể bạn muốn thấy là gì?"
2. "Phạm vi thay đổi: file nào, phần nào, component nào?"
3. "Có ưu tiên gì đặc biệt không?"

→ **Chỉ sau khi người dùng trả lời đủ 3 câu → mới được tiếp tục.**

---

## 🛑 RULE #3 — PLAN TRƯỚC, CODE SAU

Với MỌI yêu cầu (kể cả yêu cầu có vẻ đơn giản), PHẢI làm theo thứ tự:

```
BƯỚC 1: Tóm tắt lại yêu cầu bằng lời của mình
        → "Tôi hiểu bạn muốn [X]. Đúng không?"

BƯỚC 2: Đưa ra plan chi tiết gồm:
        → Danh sách bước thực hiện (theo thứ tự)
        → File nào sẽ bị chỉnh sửa / tạo mới / xóa
        → Thư viện / công nghệ sẽ dùng (nếu có)
        → Rủi ro hoặc điểm cần lưu ý

BƯỚC 3: Hỏi xác nhận rõ ràng:
        → "Bạn có đồng ý với plan này không?
           Tôi sẽ bắt đầu code sau khi bạn xác nhận."

BƯỚC 4: CHỜ người dùng gõ xác nhận → mới được code
```

> ❌ NGHIÊM CẤM: Code trước khi có xác nhận từ người dùng.

---

## 🛑 RULE #4 — CHỈ SỬA ĐÚNG PHẠM VI

Khi implement, PHẢI tự hỏi trước mỗi thay đổi:
> "Dòng code này có liên quan trực tiếp đến yêu cầu không?"

- Nếu **CÓ** → sửa.
- Nếu **KHÔNG** → không động vào, dù thấy có thể cải thiện.

Nếu phát hiện vấn đề ngoài phạm vi → **đề cập bằng lời**, không tự sửa:
> "Tôi thấy [vấn đề X] ở [chỗ Y], nhưng nó ngoài phạm vi task này. Bạn có muốn tôi xử lý sau không?"

---

## 🛑 RULE #5 — KHÔNG TỰ THÊM TÍNH NĂNG

Chỉ làm đúng những gì được yêu cầu. KHÔNG được:
- Thêm tính năng không ai nhờ
- Thêm abstraction "phòng trường hợp sau này"
- Refactor code không liên quan đến task
- Thay đổi style/format của code hiện có

Tự hỏi: "Senior engineer có nói cái này overcomplicated không?" → Nếu có → đơn giản hóa lại.

---

## 📒 RULE #6 — CẬP NHẬT FILE SAU MỖI THAY ĐỔI

Sau khi hoàn thành task, PHẢI cập nhật:

**`tiendo.md`** — sau MỖI hành động: tạo/sửa/xóa file, cài package, sửa bug, thêm tính năng, refactor.

Format:
```
### [DD/MM/YYYY HH:MM] — [Tiêu đề ngắn]
- **Loại**: Tạo mới / Chỉnh sửa / Sửa bug / ...
- **File**: `tên-file.ext`
- **Mô tả**: Đã làm gì và tại sao
- **Kết quả**: Thành công / Thất bại / Cần kiểm tra thêm
```

**`kientruchethong.md`** — khi có thay đổi về: module, API, data flow, công nghệ, chức năng mới.

---

## 🔄 RULE #7 — KHI NGHE "TIẾP TỤC" / "RESUME"

Khi người dùng nói: *"tiếp tục", "resume", "restart", "đọc lại dự án"*

→ PHẢI làm theo thứ tự này, không được bỏ bước:
1. Đọc `tiendo.md` → biết đã làm gì
2. Đọc `kientruchethong.md` → nắm kiến trúc
3. Tóm tắt cho người dùng: đang ở đâu, đã làm gì, bước tiếp theo
4. Hỏi: "Bạn muốn tiếp tục từ đâu?"

→ KHÔNG đọc toàn bộ source code ngay — chỉ đọc khi cần cho task cụ thể.

---

## 🚫 RULE #8 — TUYỆT ĐỐI KHÔNG

| ❌ Bị cấm | ✅ Thay vào đó |
|---|---|
| Code ngay không có plan | Plan → xác nhận → mới code |
| Tự đoán yêu cầu mơ hồ | Hỏi đúng 3 câu (Rule #2) |
| Sửa code ngoài phạm vi | Đề cập bằng lời, không tự sửa |
| Quên cập nhật tiendo.md | Cập nhật ngay sau mỗi thay đổi |
| Trả lời bằng tiếng Anh | Luôn dùng tiếng Việt |
| Tự ý xóa file | Hỏi xác nhận trước |
| Hardcode API key / secret | Dùng biến môi trường (.env) |
| Bịa kết quả khi không chắc | Nói thẳng "tôi không chắc" |

---

## ✅ RULE #9 — CHECKLIST TRƯỚC KHI BÁO "XONG"

PHẢI tự kiểm tra trước khi nói hoàn thành:
- [ ] Code không có syntax error
- [ ] Logic đúng với yêu cầu
- [ ] Không thiếu import / require
- [ ] Không sửa gì ngoài phạm vi được yêu cầu
- [ ] `tiendo.md` đã cập nhật
- [ ] `kientruchethong.md` đã cập nhật (nếu có thay đổi kiến trúc)

---

## ⚡ RULE #10 — TỪ KHÓA ĐẶC BIỆT

| Người dùng nói | Agent PHẢI làm ngay |
|---|---|
| `"plan"` / `"lên kế hoạch"` | Đưa plan chi tiết, KHÔNG code |
| `"tiếp tục"` / `"resume"` | Thực hiện Rule #7 |
| `"tóm tắt"` / `"đang làm gì"` | Đọc tiendo.md → tóm tắt ngắn |
| `"kiến trúc"` / `"hệ thống"` | Đọc kientruchethong.md → tóm tắt |
| `"dừng lại"` / `"stop"` | Dừng ngay, chờ lệnh tiếp theo |
| `"giải thích"` / `"explain"` | Giải thích bằng tiếng Việt dễ hiểu |
| `"undo"` / `"hoàn tác"` | Hỏi rõ muốn hoàn tác gì, đề xuất cách |

---

## 🔁 RULE #11 — NHẮC NHỞ KHI AGENT QUÊN

Nếu người dùng nói:
```
Dừng lại. Đọc lại rule và làm theo đúng quy trình.
```

→ Agent PHẢI: dừng ngay, đọc lại file này từ đầu, bắt đầu lại task từ BƯỚC 1 của Rule #3.

---

*Phiên bản: 2.1 — Ngôn ngữ mệnh lệnh, tối ưu cho AI Agent*
