# Module 04: Giao dịch Cốt lõi & Kế toán Kép (Core Transactions & Double-Entry)

## 1. Tổng quan Kiến trúc Module (Module Overview)

### 1.1. Vai trò của Module
Module này là **TRÁI TIM NĂNG LƯỢNG** của toàn bộ hệ thống Quản lý Tài chính Cá nhân (PFM). Module xử lý toàn bộ các sự kiện tài chính bao gồm Chi tiêu (Withdrawal), Thu nhập (Deposit), Chuyển khoản (Transfer) và Điều chỉnh đối soát (Reconciliation).

Hệ thống áp dụng nghiêm ngặt **Nguyên tắc Kế toán Kép (Double-Entry Bookkeeping)** từ Firefly III:
- Không bao giờ có tiền "tự dưng sinh ra" hoặc "tự dưng mất đi".
- Mỗi giao dịch bao gồm 1 Nhật ký Giao dịch (`transaction_journals`) và **ít nhất 2 Dòng bút toán đối ứng (`transactions`)**: Một dòng rút tiền từ Tài khoản Nguồn (Source Account - Debit) và một dòng nộp tiền vào Tài khoản Đích (Destination Account - Credit).
- **Tổng giá trị ghi Nợ (Debit) phải luôn BẰNG Tổng giá trị ghi Có (Credit)**.

### 1.2. Danh sách các bảng Database (PostgreSQL Schema)
Module này sử dụng 7 bảng CSDL liên kết chặt chẽ:

| Tên bảng | Vai trò & Mô tả | Mối quan hệ (Relationships) |
| :--- | :--- | :--- |
| `transaction_journals` | Bảng đầu mục giao dịch (Header) lưu thông tin chung: Mô tả, Ngày giao dịch, Danh mục, Ngân sách, Hóa đơn, Ghi chú, User ID. | 1-n với `transactions`, 1-n với `journal_meta`, n-1 với `categories`, n-1 với `budgets`, n-1 với `bills`, n-n với `tags` qua `taggables`. |
| `transactions` | Bảng chi tiết dòng bút toán kế toán (Splits/Legs). Lưu số tiền, `account_id` nguồn/đích, tỷ giá ngoại tệ. | n-1 với `transaction_journals`, n-1 với `accounts`. |
| `transaction_types` | Danh mục loại giao dịch (`Withdrawal`, `Deposit`, `Transfer`, `Opening balance`, `Reconciliation`). | 1-n với `transaction_journals`. |
| `journal_meta` | Lưu thuộc tính mở rộng của nhật ký giao dịch (e.g. Vĩ độ/Kinh độ GPS, Mã giao dịch ngân hàng, Thẻ tín dụng). | n-1 với `transaction_journals`. |
| `attachments` | Đính kèm hóa đơn/ảnh chụp chứng từ (`file_name`, `mime_type`, `file_size`, `path`). | n-1 với `transaction_journals` (Polymorphic `attachable`). |
| `tags` | Thẻ tag gắn liền giao dịch (e.g. `#dulich`, `#duan-A`). | n-n với `transaction_journals` qua `taggables`. |
| `taggables` | Bảng trung gian gắn tag với các entity (Polymorphic). | Mapping `tag_id` và `taggable_id` (`transaction_journal_id`). |

#### Mô hình Kế toán Kép cho các loại giao dịch:
1. **Withdrawal (Chi tiêu)**: 
   - Source Account: `Asset Account` (Ví dụ: Ví Tiền mặt) -> Số tiền âm `-X`
   - Destination Account: `Expense Account` (Ví dụ: Siêu thị WinMart) -> Số tiền dương `+X`
2. **Deposit (Thu nhập)**:
   - Source Account: `Revenue Account` (Ví dụ: Công ty ABC) -> Số tiền âm `-X`
   - Destination Account: `Asset Account` (Ví dụ: Tài khoản Vietcombank) -> Số tiền dương `+X`
3. **Transfer (Chuyển khoản)**:
   - Source Account: `Asset Account A` (Ví dụ: VCB) -> Số tiền âm `-X`
   - Destination Account: `Asset Account B` (Ví dụ: Ví Momo) -> Số tiền dương `+X`

---

## 2. Chi tiết Giao diện & Form (UI/UX & Forms)

### 2.1. Màn hình Danh sách Giao dịch (`ScreenTransactionList`)
* **Mô tả**: Hiển thị nhật ký giao dịch theo thứ tự thời gian (mới nhất lên trên), bộ lọc đa tiêu chí (Theo ví, Theo danh mục, Theo khoảng ngày, Tìm kiếm từ khóa), hiển thị màu sắc rõ ràng (Đỏ: Chi tiêu, Xanh lá: Thu nhập, Xanh dương: Chuyển khoản).

### 2.2. Form Tạo mới / Chỉnh sửa Giao dịch (`FormTransaction`)
* **Tên Form**: `FormTransaction`
* **Mô tả**: Màn hình nhập giao dịch linh hoạt hỗ trợ cả Chi tiêu, Thu nhập và Chuyển khoản.

| Label (Hiển thị) | Payload Key | Type | Trạng thái | UI Validation Logic |
| :--- | :--- | :--- | :--- | :--- |
| Loại giao dịch | `transactionType`| Radio/Tab | Bắt buộc | Enum: `Withdrawal`, `Deposit`, `Transfer`. Mặc định `Withdrawal`. |
| Diễn giải / Mô tả | `description` | Text | Bắt buộc | Length: 2 - 255 ký tự (e.g. `Mua cà phê Highlands`). |
| Số tiền | `amount` | Number (Decimal)| Bắt buộc | Số thực dương > 0. Format tiền tệ trực quan. |
| Ngày giao dịch | `date` | DateTime | Bắt buộc | Format ISO `YYYY-MM-DDTHH:mm:ss`. Mặc định ngày giờ hiện tại. |
| Tài khoản Nguồn | `sourceAccountId` | Select | Bắt buộc | Select từ danh sách Tài khoản. Với Withdrawal phải là Ví Asset. |
| Tài khoản Đích | `destinationAccountId`| Select/AutoComplete| Bắt buộc | Với Withdrawal: Chọn/Nhập tên nơi bán (Expense account). Với Transfer: Chọn Ví Asset đích. |
| Danh mục | `categoryId` | Select/Tree | Tùy chọn | Select danh mục chi tiêu/thu nhập. |
| Ngân sách | `budgetId` | Select | Tùy chọn | Chọn ngân sách liên quan (chỉ dành cho Chi tiêu). |
| Hóa đơn định kỳ | `billId` | Select | Tùy chọn | Chọn hóa đơn theo dõi. |
| Thẻ / Tags | `tags` | TagInput | Tùy chọn | Array các tag strings (e.g. `["dulich", "banbe"]`). |
| Ghi chú | `notes` | Textarea | Tùy chọn | Max 1000 ký tự. |
| File chứng từ/Hóa đơn| `attachments` | FileUpload | Tùy chọn | File ảnh (JPG/PNG) hoặc PDF. Max 5MB/file. |

---

## 3. Thiết kế RESTful API (API Design)

### 3.1. GET `/api/v1/transactions`
* **Mô tả**: Lấy danh sách giao dịch phân trang, hỗ trợ lọc chi tiết.
* **Authorization**: Bearer Token.
* **Query Parameters**: `?page=1&pageSize=20&startDate=2026-09-01&endDate=2026-09-30&accountId=acc-uuid&categoryId=cat-uuid&type=Withdrawal`
* **Request Payload**: None.
* **Database Operations**:
  - Query `transaction_journals` JOIN `transactions`, `categories`, `accounts` với phân trang `LIMIT @PageSize OFFSET @Offset`.

### 3.2. POST `/api/v1/transactions`
* **Mô tả**: Tạo mới 1 giao dịch (Chi tiêu, Thu nhập hoặc Chuyển khoản).
* **Authorization**: Bearer Token.
* **Request Payload**:
```json
{
  "transactionType": "Withdrawal",
  "description": "Ăn tối tại Phố Ngon 37",
  "amount": 450000.00,
  "currencyCode": "VND",
  "date": "2026-09-20T19:30:00Z",
  "sourceAccountId": "acc-uuid-vcb",
  "destinationAccountName": "Nhà hàng Phố Ngon 37",
  "categoryId": "cat-uuid-an-uong",
  "budgetId": "budget-uuid-thang9",
  "tags": ["dinnertime", "cuoiduan"],
  "notes": "Đi ăn mừng xong dự án"
}
```
* **Business Rules (Backend)**:
  1. Validate `amount` > 0.
  2. Xử lý Tài khoản Đích (`destinationAccountName`):
     - Nếu `transactionType == Withdrawal` và `destinationAccountName` chưa có trong DB bảng `accounts` loại `Expense`: Tự động tạo mới một Expense Account với tên đó.
     - Nếu `transactionType == Transfer`: Bắt buộc `destinationAccountId` phải là một Asset Account hợp lệ khác `sourceAccountId`.
  3. **Quy tắc Kế toán Kép (Double-Entry Split Generation)**:
     - Tạo bản ghi Header `transaction_journals` (Chứa `user_id`, `description`, `completed_at`, `category_id`, `budget_id`...).
     - Tạo bản ghi Dòng Nợ (Debit) trong `transactions`: `account_id = sourceAccountId`, `amount = -450000.00`.
     - Tạo bản ghi Dòng Có (Credit) trong `transactions`: `account_id = destinationAccountId`, `amount = +450000.00`.
  4. Xử lý Tags: Thêm tag mới vào `tags` nếu chưa có, tạo liên kết trong `taggables`.
* **Database Operations**:
  - `INSERT INTO transaction_journals ...`
  - `INSERT INTO transactions` (2 rows)
  - `INSERT INTO tags` & `INSERT INTO taggables`
* **Transaction**: **BẮT BUỘC DÙNG DATABASE TRANSACTION**. Cả 2 leg của kế toán kép + header + tags phải commit thành công 100% hoặc rollback hoàn toàn nếu 1 bước thất bại.

### 3.3. PUT `/api/v1/transactions/{id}`
* **Mô tả**: Cập nhật thông tin giao dịch hiện có.
* **Authorization**: Bearer Token (Chỉ sửa được giao dịch của chính mình).
* **Request Payload**: Tương tự POST payload.
* **Business Rules (Backend)**:
  1. Tìm `transaction_journal` theo `id` và `user_id`. Nếu không thấy -> HTTP 404.
  2. Cập nhật lại thông tin Header `transaction_journals`.
  3. Cập nhật số tiền âm/dương tương ứng ở 2 bản ghi bút toán trong `transactions`.
* **Transaction**: **BẮT BUỘC DÙNG DATABASE TRANSACTION**.

### 3.4. DELETE `/api/v1/transactions/{id}`
* **Mô tả**: Xóa giao dịch.
* **Authorization**: Bearer Token.
* **Business Rules (Backend)**:
  1. Tìm `transaction_journal` theo ID.
  2. Xóa các bản ghi liên quan trong `taggables`, `journal_meta`, `attachments`, `transactions` và cuối cùng xóa `transaction_journals`.
* **Transaction**: **BẮT BUỘC DÙNG DATABASE TRANSACTION**.

---

## 4. Xử lý Lỗi & Exception Handling

| Mã HTTP | Mã lỗi Nội bộ (ErrorCode) | Nguyên nhân & Ngữ cảnh |
| :--- | :--- | :--- |
| `400 Bad Request` | `INVALID_TRANSACTION_AMOUNT` | Số tiền giao dịch <= 0. |
| `400 Bad Request` | `SAME_SOURCE_DESTINATION_ACCOUNT`| Tài khoản nguồn và tài khoản đích của giao dịch Chuyển khoản trùng nhau. |
| `400 Bad Request` | `UNBALANCED_TRANSACTION_LEGS` | Tổng số tiền Debit không cân bằng với Credit (Lỗi logic kế toán). |
| `403 Forbidden` | `TRANSACTION_ACCESS_DENIED` | Cố ý truy cập/sửa/xóa giao dịch của người dùng khác. |
| `404 Not Found` | `TRANSACTION_NOT_FOUND` | Không tìm thấy mã giao dịch. |
| `422 Unprocessable`| `MISSING_DESTINATION_ACCOUNT` | Thiếu thông tin tài khoản nhận/nơi chi tiêu. |

---

## 5. Cấu trúc Response Chuẩn (Standard API Response)

### 5.1. Response Chi tiết Giao dịch vừa Tạo (HTTP 201 Created)
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Tạo mới giao dịch thành công",
  "data": {
    "id": "tj-uuid-0019283",
    "transactionType": "Withdrawal",
    "description": "Ăn tối tại Phố Ngon 37",
    "amount": 450000.00,
    "currencyCode": "VND",
    "date": "2026-09-20T19:30:00Z",
    "category": {
      "id": "cat-uuid-an-uong",
      "name": "Ăn uống"
    },
    "budget": {
      "id": "budget-uuid-thang9",
      "name": "Ngân sách Ăn uống T9/2026"
    },
    "sourceAccount": {
      "id": "acc-uuid-vcb",
      "name": "Tài khoản Vietcombank VCB"
    },
    "destinationAccount": {
      "id": "acc-uuid-pho-ngon-37",
      "name": "Nhà hàng Phố Ngon 37"
    },
    "tags": ["dinnertime", "cuoiduan"],
    "createdAt": "2026-09-20T19:31:00Z"
  },
  "errors": null,
  "timestamp": "2026-09-20T19:31:00Z"
}
```
