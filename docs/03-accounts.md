# Module 03: Tài khoản & Ví (Accounts & Wallets)

## 1. Tổng quan Kiến trúc Module (Module Overview)

### 1.1. Vai trò của Module
Module này quản lý tất cả các Thực thể Tài khoản (Accounts) trong hệ thống PFM dựa trên chuẩn kế toán kép (Double-Entry Bookkeeping) của Firefly III.

Trong kế toán kép, **MỌI BÊN THAM GIA GIAO DỊCH ĐỀU LÀ MỘT TÀI KHOẢN**. Ví tiền mặt của bạn là một Tài khoản Assets, công ty trả lương cho bạn là một Tài khoản Revenue, và cửa hàng bạn mua đồ ăn là một Tài khoản Expense. 

Module này quản lý danh mục tài khoản, số dư ban đầu (Opening Balance), phân loại loại tài khoản và siêu dữ liệu (Account Metadata như số tài khoản, IBAN, tên ngân hàng).

### 1.2. Danh sách các bảng Database (PostgreSQL Schema)
Module này sử dụng 3 bảng chính trong CSDL Firefly III:

| Tên bảng | Vai trò & Mô tả | Mối quan hệ (Relationships) |
| :--- | :--- | :--- |
| `accounts` | Bảng chính lưu trữ mọi tài khoản (Tên, Loại tài khoản, Đồng tiền, Trạng thái ẩn/hiện, Số dư tính toán). | 1-n với `account_meta`, n-1 với `account_types`, n-1 với `currencies`, 1-n với `transactions` (Debit/Credit entries). |
| `account_types` | Danh mục cố định các loại tài khoản (`Asset`, `Expense`, `Revenue`, `Initial balance`, `Reconciliation`, `Loan`, `Debt`). | 1-n với `accounts`. |
| `account_meta` | Lưu các thuộc tính mở rộng động (Key-Value) của tài khoản (e.g., `account_number`, `iban`, `bank_name`, `credit_limit`). | n-1 với `accounts` (`account_id`). |

#### Loại Tài khoản Cốt lõi (`account_types`):
1. **Asset account**: Ví tài sản cá nhân (Ví tiền mặt, Tài khoản Vietcombank, Ví Momo, Tài khoản đầu tư).
2. **Expense account**: Tài khoản chi tiêu / Đối tác bán hàng (Siêu thị, Tiệm cà phê, Chủ nhà trọ).
3. **Revenue account**: Tài khoản nguồn thu (Công ty trả lương, Khách hàng, Ngân hàng trả lãi).
4. **Initial balance account**: Tài khoản đặc biệt dùng làm đối ứng khi khởi tạo Số dư ban đầu.
5. **Reconciliation account**: Tài khoản dùng cho giao dịch điều chỉnh / đối soát sai lệch.

#### Sơ đồ thực thể ERD:
```
  [account_types] 1 --- n [accounts]
  [currencies]    1 --- n [accounts]
  [users]         1 --- n [accounts]
  [accounts]      1 --- n [account_meta]
```

---

## 2. Chi tiết Giao diện & Form (UI/UX & Forms)

### 2.1. Màn hình Danh sách Ví & Tài khoản (`ScreenAccountList`)
* **Mô tả**: Hiển thị nhóm các ví tài sản (Asset Accounts), tổng tài sản, số dư hiện tại của từng ví, và bộ lọc theo loại ví hoặc trạng thái ẩn/kích hoạt.

### 2.2. Form Tạo / Chỉnh sửa Ví Tài sản (`FormAssetAccount`)
* **Tên Form**: `FormAssetAccount`
* **Mô tả**: Cho phép người dùng thêm ví tiền mặt, tài khoản ngân hàng hoặc ví điện tử mới.

| Label (Hiển thị) | Payload Key | Type | Trạng thái | UI Validation Logic |
| :--- | :--- | :--- | :--- | :--- |
| Tên ví / Tài khoản | `name` | Text | Bắt buộc | Length: 2 - 100 ký tự. Không trùng tên với ví khác của user. |
| Loại ví tài sản | `accountTypeId` | Select | Bắt buộc | Select: Asset / Checking / Savings / Credit Card. |
| Loai tiền tệ | `currencyId` | Select | Bắt buộc | Select từ danh sách `currencies` khả dụng. |
| Số dư ban đầu | `openingBalance` | Number (Decimal)| Tùy chọn | Số thực >= 0 (Mặc định `0`). Chỉ nhập khi tạo mới. |
| Ngày bắt đầu tính | `openingBalanceDate`| Date | Bắt buộc (nếu có số dư)| Format `YYYY-MM-DD`. Mặc định ngày hiện tại. |
| Tên ngân hàng | `bankName` | Text | Tùy chọn | Max 100 ký tự (e.g. `Vietcombank`, `Techcombank`). |
| Số tài khoản / IBAN | `accountNumber` | Text | Tùy chọn | Max 50 ký tự chữ và số. |
| Trạng thái kích hoạt| `active` | Checkbox | Bắt buộc | Boolean (`true`/`false`). Mặc định `true`. |
| Ẩn khỏi Tổng số dư | `includeInNetWorth` | Checkbox | Bắt buộc | Boolean (`true`/`false`). Mặc định `true`. |
| Ghi chú | `notes` | Textarea | Tùy chọn | Max 500 ký tự. |

---

## 3. Thiết kế RESTful API (API Design)

### 3.1. GET `/api/v1/accounts`
* **Mô tả**: Lấy danh sách tài khoản của người dùng đăng nhập.
* **Authorization**: Bearer Token (Chủ sở hữu).
* **Query Parameters**: `?type=Asset&active=true&search=vietcombank`
* **Request Payload**: None.
* **Database Operations**:
  - `SELECT a.id, a.name, a.currency_id, c.code AS currency_code, at.type AS account_type, a.active FROM accounts a JOIN account_types at ON a.account_type_id = at.id JOIN currencies c ON a.currency_id = c.id WHERE a.user_id = @UserId AND a.active = true`

### 3.2. GET `/api/v1/accounts/{id}`
* **Mô tả**: Lấy chi tiết 1 tài khoản bao gồm số dư tính toán hiện tại và siêu dữ liệu (`account_meta`).
* **Authorization**: Bearer Token (Chủ sở hữu).
* **Database Operations**:
  - Join `accounts`, `account_meta`, tính tổng Debit - Credit từ bảng `transactions` để ra `currentBalance`.

### 3.3. POST `/api/v1/accounts`
* **Mô tả**: Tạo mới một tài khoản (Ví tài sản, Tài khoản chi tiêu hoặc Nguồn thu).
* **Authorization**: Bearer Token.
* **Request Payload**:
```json
{
  "name": "Tài khoản Vietcombank VCB",
  "accountTypeId": "acc-type-uuid-asset",
  "currencyId": "currency-uuid-vnd",
  "openingBalance": 10000000.00,
  "openingBalanceDate": "2026-09-01",
  "bankName": "Vietcombank",
  "accountNumber": "10123456789",
  "includeInNetWorth": true,
  "notes": "Tài khoản nhận lương hàng tháng"
}
```
* **Business Rules (Backend)**:
  1. Kiểm tra xem tên tài khoản `name` đã tồn tại trong danh sách tài khoản của `user_id` hiện tại chưa (Case-insensitive). Nếu trùng -> Ném exception `ACCOUNT_NAME_EXISTS`.
  2. Tạo bản ghi tài khoản mới trong bảng `accounts`.
  3. Thêm các thông tin `bankName`, `accountNumber` vào bảng `account_meta`.
  4. **Nghiệp vụ Kế toán Kép cho Số dư ban đầu (Opening Balance)**: Nếu `openingBalance > 0`:
     - Tự động tìm hoặc tạo tài khoản hệ thống loại `Initial balance account`.
     - Tự động tạo một Giao dịch Khởi tạo (Transaction Journal) loại `Opening balance` từ `Initial balance account` -> `Tài khoản mới vừa tạo` với số tiền bằng `openingBalance`.
* **Database Operations**:
  - `INSERT INTO accounts (id, user_id, account_type_id, currency_id, name, active, created_at) VALUES (...)`
  - `INSERT INTO account_meta (account_id, name, value) VALUES ...`
  - `INSERT INTO transaction_journals ...` & `INSERT INTO transactions ...` (nếu có opening balance).
* **Transaction**: **CÓ** (Bắt buộc dùng DB Transaction vì bao gồm insert Account, Metadata và Transaction Journal khởi tạo).

### 3.4. PUT `/api/v1/accounts/{id}`
* **Mô tả**: Cập nhật thông tin tài khoản.
* **Authorization**: Bearer Token (Chỉ sửa được tài khoản thuộc sở hữu của user).
* **Request Payload**:
```json
{
  "name": "Tài khoản Vietcombank Main",
  "bankName": "Vietcombank - CN Tân Bình",
  "accountNumber": "10123456789",
  "active": true,
  "includeInNetWorth": true,
  "notes": "Đã cập nhật chi nhánh"
}
```
* **Business Rules (Backend)**:
  1. Kiểm tra tài khoản tồn tại và thuộc sở hữu của `current_user_id`. Nếu không -> Trả 404/403.
  2. KHÔNG CHO PHÉP sửa `currencyId` hoặc `accountTypeId` nếu tài khoản đã có phát sinh giao dịch.

### 3.5. DELETE `/api/v1/accounts/{id}`
* **Mô tả**: Xóa tài khoản (Hoặc Đánh dấu Soft-Delete / Inactive).
* **Authorization**: Bearer Token.
* **Business Rules (Backend)**:
  1. Nếu tài khoản đã phát sinh giao dịch trong bảng `transactions` -> **KHÔNG CHO XÓA CỨNG**, chỉ hỗ trợ chuyển `active = false` (Soft delete / Archiving).
  2. Nếu tài khoản chưa từng có giao dịch -> Cho phép DELETE khỏi DB.

---

## 4. Xử lý Lỗi & Exception Handling

| Mã HTTP | Mã lỗi Nội bộ (ErrorCode) | Nguyên nhân & Ngữ cảnh |
| :--- | :--- | :--- |
| `400 Bad Request` | `CANNOT_CHANGE_ACCOUNT_CURRENCY` | Cố ý sửa loại tiền tệ của tài khoản đã có giao dịch phát sinh. |
| `400 Bad Request` | `CANNOT_DELETE_ACCOUNT_WITH_TRANSACTIONS` | Cố ý xóa cứng tài khoản đã có lịch sử giao dịch. |
| `403 Forbidden` | `ACCOUNT_ACCESS_DENIED` | Cố ý truy cập/thao tác trên tài khoản của user khác. |
| `404 Not Found` | `ACCOUNT_NOT_FOUND` | Không tìm thấy ID tài khoản yêu cầu. |
| `409 Conflict` | `ACCOUNT_NAME_ALREADY_EXISTS` | Tên tài khoản trùng lặp với ví khác của cùng người dùng. |

---

## 5. Cấu trúc Response Chuẩn (Standard API Response)

### 5.1. Response Chi tiết Tài khoản (HTTP 200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy thông tin tài khoản thành công",
  "data": {
    "id": "acc-uuid-vcb-001",
    "name": "Tài khoản Vietcombank VCB",
    "accountType": "Asset",
    "currency": {
      "id": "c01-vnd-uuid",
      "code": "VND",
      "symbol": "₫"
    },
    "currentBalance": 10000000.00,
    "active": true,
    "includeInNetWorth": true,
    "metadata": {
      "bankName": "Vietcombank",
      "accountNumber": "10123456789"
    },
    "createdAt": "2026-09-01T08:00:00Z"
  },
  "errors": null,
  "timestamp": "2026-09-20T11:52:00Z"
}
```
