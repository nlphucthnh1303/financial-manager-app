# Module 08: Hũ Tiết kiệm (Piggy Banks & Saving Goals)

## 1. Tổng quan Kiến trúc Module (Module Overview)

### 1.1. Vai trò của Module
Module Hũ tiết kiệm (Piggy Banks) quản lý các **Mục tiêu Tiết kiệm (Savings Goals)** dài hạn hoặc ngắn hạn của người dùng (VD: "Tiết kiệm mua Xe máy mới - 40 triệu", "Quỹ dự phòng khẩn cấp - 50 triệu", "Du lịch Nhật Bản - 30 triệu").

Hũ tiết kiệm gắn liền với một Tài khoản Ví tài sản (`account_id`). Tiền trong Hũ tiết kiệm đại diện cho khoản tiền được "giữ lại / phân bổ ảo" bên trong số dư tài khoản đó, giúp người dùng không tiêu lẹm vào các mục tiêu dài hạn. Module theo dõi lịch sử nạp/rút tiền khỏi hũ qua các sự kiện `piggy_bank_events` và tự động gợi ý số tiền cần tích lũy mỗi tháng để đạt mục tiêu đúng hạn.

### 1.2. Danh sách các bảng Database (PostgreSQL Schema)
Module này sử dụng 2 bảng CSDL chính trong Firefly III:

| Tên bảng | Vai trò & Mô tả | Mối quan hệ (Relationships) |
| :--- | :--- | :--- |
| `piggy_banks` | Lưu thông tin hũ tiết kiệm (Tên hũ, Số tiền mục tiêu `target_amount`, Số tiền đã tích lũy `current_amount`, Ngày mục tiêu `target_date`, `account_id` chứa tiền). | n-1 với `accounts`, 1-n với `piggy_bank_events`. |
| `piggy_bank_events` | Bảng nhật ký ghi lại mọi biến động nạp tiền (+) hoặc rút tiền (-) khỏi hũ tiết kiệm. | n-1 với `piggy_banks`, n-1 với `transaction_journals` (tùy chọn liên kết với giao dịch). |

#### Sơ đồ thực thể ERD:
```
  [accounts]         1 --- n [piggy_banks]
  [piggy_banks]      1 --- n [piggy_bank_events]
  [transaction_journals] 1 --- n [piggy_bank_events]
```

---

## 2. Chi tiết Giao diện & Form (UI/UX & Forms)

### 2.1. Màn hình Danh sách Hũ Tiết kiệm (`ScreenPiggyBankList`)
* **Mô tả**: Hiển thị các hũ tiết kiệm dạng card trực quan với hình ảnh minh họa, thanh tiến độ hoàn thành (%), số tiền còn thiếu, ngày đích dự kiến và gợi ý số tiền cần nạp hàng tháng.

### 2.2. Form Tạo / Chỉnh sửa Hũ Tiết kiệm (`FormPiggyBank`)
* **Tên Form**: `FormPiggyBank`
* **Mô tả**: Tạo một mục tiêu tiết kiệm mới.

| Label (Hiển thị) | Payload Key | Type | Trạng thái | UI Validation Logic |
| :--- | :--- | :--- | :--- | :--- |
| Tên Hũ tiết kiệm | `name` | Text | Bắt buộc | Length: 2 - 100 ký tự (e.g. `Quỹ mua Laptop M3`). |
| Thuộc Ví tài sản | `accountId` | Select | Bắt buộc | Select ví Asset account chứa khoản tiền này. |
| Số tiền mục tiêu | `targetAmount` | Number (Decimal)| Bắt buộc | Số thực dương > 0 (e.g. `35000000.00`). |
| Số tiền hiện có | `currentAmount` | Number (Decimal)| Tùy chọn | Số thực >= 0 (Mặc định `0`). Phải `<= targetAmount`. |
| Ngày mục tiêu | `targetDate` | Date | Tùy chọn | Format `YYYY-MM-DD`. Phải > ngày hiện tại. |
| Ghi chú | `notes` | Textarea | Tùy chọn | Max 500 ký tự. |

### 2.3. Form Nạp / Rút Tiền Hũ Tiết kiệm (`FormPiggyBankEvent`)
* **Tên Form**: `FormPiggyBankEvent`
* **Mô tả**: Nạp thêm tiền vào hũ hoặc rút bớt tiền ra khỏi hũ.

| Label (Hiển thị) | Payload Key | Type | Trạng thái | UI Validation Logic |
| :--- | :--- | :--- | :--- | :--- |
| Hành động | `action` | Radio | Bắt buộc | Enum: `Deposit` (Nạp vào), `Withdraw` (Rút ra). |
| Số tiền thao tác | `amount` | Number (Decimal)| Bắt buộc | Số thực dương > 0. Nếu `Withdraw` thì `amount <= currentAmount`. |
| Ghi chú biến động | `notes` | Text | Tùy chọn | Max 255 ký tự (e.g. `Trích thưởng quý nạp vào hũ`). |

---

## 3. Thiết kế RESTful API (API Design)

### 3.1. GET `/api/v1/piggy-banks`
* **Mô tả**: Lấy danh sách tất cả các hũ tiết kiệm của người dùng.
* **Authorization**: Bearer Token.
* **Database Operations**:
  - `SELECT pb.id, pb.name, pb.target_amount, pb.current_amount, pb.target_date, a.name AS account_name FROM piggy_banks pb JOIN accounts a ON pb.account_id = a.id WHERE a.user_id = @UserId`

### 3.2. POST `/api/v1/piggy-banks`
* **Mô tả**: Tạo hũ tiết kiệm mới.
* **Authorization**: Bearer Token.
* **Request Payload**:
```json
{
  "name": "Quỹ mua MacBook Pro M3",
  "accountId": "acc-uuid-vcb-savings",
  "targetAmount": 45000000.00,
  "currentAmount": 5000000.00,
  "targetDate": "2027-01-01",
  "notes": "Mục tiêu mua máy phục vụ công việc"
}
```
* **Business Rules (Backend)**:
  1. Kiểm tra `accountId` thuộc sở hữu của user và là tài khoản Asset.
  2. Nếu `currentAmount > 0`, tự động tạo một sự kiện khởi tạo trong `piggy_bank_events`.
* **Database Operations**:
  - `INSERT INTO piggy_banks (id, account_id, name, target_amount, current_amount, target_date, notes) VALUES (...)`

### 3.3. POST `/api/v1/piggy-banks/{id}/events`
* **Mô tả**: Thực hiện Nạp hoặc Rút tiền từ hũ tiết kiệm.
* **Authorization**: Bearer Token.
* **Request Payload**:
```json
{
  "action": "Deposit",
  "amount": 2000000.00,
  "notes": "Nạp tiền tiết kiệm tháng 9"
}
```
* **Business Rules (Backend)**:
  1. Tìm hũ tiết kiệm theo `id`.
  2. Nếu `action == Withdraw` và `amount > currentAmount` -> Trả về lỗi `INSUFFICIENT_PIGGY_BALANCE`.
  3. Cập nhật `current_amount` trong `piggy_banks`:
     - Nạp (`Deposit`): `current_amount = current_amount + amount`
     - Rút (`Withdraw`): `current_amount = current_amount - amount`
  4. Thêm nhật ký vào bảng `piggy_bank_events`.
* **Transaction**: **BẮT BUỘC DÙNG DATABASE TRANSACTION** để đảm bảo đồng bộ giữa bảng Hũ và bảng Nhật ký Sự kiện.

---

## 4. Xử lý Lỗi & Exception Handling

| Mã HTTP | Mã lỗi Nội bộ (ErrorCode) | Nguyên nhân & Ngữ cảnh |
| :--- | :--- | :--- |
| `400 Bad Request` | `INSUFFICIENT_PIGGY_BALANCE` | Số tiền rút lớn hơn số tiền hiện có trong hũ. |
| `400 Bad Request` | `PIGGY_EXCEEDS_TARGET` | Nạp số tiền vượt quá hạn mức mục tiêu (nếu hệ thống chặn). |
| `404 Not Found` | `PIGGY_BANK_NOT_FOUND` | Không tìm thấy hũ tiết kiệm. |

---

## 5. Cấu trúc Response Chuẩn (Standard API Response)

### 5.1. Response Chi tiết Hũ Tiết kiệm (HTTP 200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cập nhật hũ tiết kiệm thành công",
  "data": {
    "id": "pb-uuid-macbook",
    "name": "Quỹ mua MacBook Pro M3",
    "accountName": "Tài khoản Tiết kiệm VCB",
    "targetAmount": 45000000.00,
    "currentAmount": 7000000.00,
    "remainingAmount": 38000000.00,
    "percentageCompleted": 15.56,
    "targetDate": "2027-01-01",
    "suggestedMonthlyDeposit": 2375000.00,
    "updatedAt": "2026-09-20T11:57:00Z"
  },
  "errors": null,
  "timestamp": "2026-09-20T11:57:00Z"
}
```
