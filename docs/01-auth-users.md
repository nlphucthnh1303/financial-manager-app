# Module 01: Quản lý Người dùng & Bảo mật (Auth & User Management)

## 1. Tổng quan Kiến trúc Module (Module Overview)

### 1.1. Vai trò của Module
Module này chịu trách nhiệm cho việc xác thực (Authentication), phân quyền (Authorization), quản lý thông tin người dùng (User Profile), bảo mật đa yếu tố (MFA/TOTP) và quản lý phiên làm việc (Session & Access Tokens). 

Đây là module nền tảng của hệ thống PFM. Tất cả dữ liệu của các module khác (Ví tiền, Giao dịch, Ngân sách, Hũ tiết kiệm) đều được gắn chặt với một `user_id` để đảm bảo tính cô lập dữ liệu tuyệt đối giữa các người dùng (Multi-tenant isolation at application level).

### 1.2. Danh sách các bảng Database (PostgreSQL Schema)
Module này sử dụng 6 bảng cốt lõi trong sơ đồ CSDL của hệ thống:

| Tên bảng | Vai trò & Mô tả | Mối quan hệ (Relationships) |
| :--- | :--- | :--- |
| `users` | Lưu trữ thông tin tài khoản người dùng chính (Email, Password Hash, Display Name, Status, MFA secret). | 1-n với `personal_access_tokens`, 1-n với `password_resets`, 1-n với `mfa_codes`, n-n với `roles`. |
| `password_resets` | Lưu trữ mã token khôi phục mật khẩu có thời hạn. | n-1 với `users` (thông qua `email` hoặc `user_id`). |
| `personal_access_tokens`| Lưu trữ Refresh Token / API Access Tokens cho client (Web, Mobile). | n-1 với `users` (`user_id`). |
| `roles` | Danh sách các vai trò trong hệ thống (e.g., `Admin`, `StandardUser`, `PremiumUser`). | n-n với `users` qua bảng `role_user`, n-n với `permissions` qua `permission_role`. |
| `permissions` | Danh sách quyền chi tiết (e.g., `user.create`, `report.export`, `admin.view`). | n-n với `roles` qua bảng `permission_role`. |
| `role_user` | Bảng trung gian n-n giữa `users` và `roles`. | Mapping FK `user_id` và `role_id`. |

#### Sơ đồ thực thể ERD khái lược:
```
  [users] 1 --- n [personal_access_tokens]
  [users] 1 --- n [password_resets]
  [users] n --- n [roles] (qua role_user)
  [roles] n --- n [permissions] (qua permission_role)
```

---

## 2. Chi tiết Giao diện & Form (UI/UX & Forms)

### 2.1. Form Đăng ký (Register Screen - `FormRegister`)
* **Tên Form**: `FormRegister`
* **Mô tả**: Màn hình cho phép người dùng mới tạo tài khoản cá nhân.

| Label (Hiển thị) | Payload Key | Type | Trạng thái | UI Validation Logic |
| :--- | :--- | :--- | :--- | :--- |
| Email | `email` | Text (Email) | Bắt buộc | Regex Email chuẩn (`^[^\s@]+@[^\s@]+\.[^\s@]+$`), max length 255, required. |
| Họ và tên | `fullName` | Text | Bắt buộc | Length: 2 - 100 ký tự, không chứa ký tự đặc biệt nguy hại. |
| Mật khẩu | `password` | Password | Bắt buộc | Tối thiểu 8 ký tự, ít nhất 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt (`@$!%*?&`). |
| Xác nhận mật khẩu | `confirmPassword` | Password | Bắt buộc | Phải khớp 100% với giá trị trường `password`. |
| Tiền tệ mặc định | `currencyCode` | Select | Bắt buộc | Chọn từ danh sách ISO currency (Mặc định `VND`). |

### 2.2. Form Đăng nhập (Login Screen - `FormLogin`)
* **Tên Form**: `FormLogin`
* **Mô tả**: Cho phép người dùng đăng nhập bằng Email và Mật khẩu.

| Label (Hiển thị) | Payload Key | Type | Trạng thái | UI Validation Logic |
| :--- | :--- | :--- | :--- | :--- |
| Email | `email` | Text (Email) | Bắt buộc | Không được bỏ trống, đúng định dạng Email. |
| Mật khẩu | `password` | Password | Bắt buộc | Không được bỏ trống. |
| Nhớ phiên đăng nhập| `rememberMe` | Checkbox | Tùy chọn | Boolean (`true`/`false`). Mặc định `false`. |
| Mã MFA (nếu bật) | `mfaCode` | Text/Number | Tùy chọn | 6 chữ số (nếu tài khoản đã kích hoạt 2FA). |

### 2.3. Form Cập nhật Profile & Mật khẩu (`FormUserProfile` & `FormChangePassword`)
* **Tên Form**: `FormUserProfile`
* **Mô tả**: Cho phép chỉnh sửa tên hiển thị, ngôn ngữ, avatar, mật khẩu hiện tại và mật khẩu mới.

| Label (Hiển thị) | Payload Key | Type | Trạng thái | UI Validation Logic |
| :--- | :--- | :--- | :--- | :--- |
| Tên hiển thị | `displayName` | Text | Bắt buộc | Max 100 ký tự. |
| Mật khẩu hiện tại | `currentPassword` | Password | Bắt buộc (khi đổi pass)| Không được bỏ trống nếu điền `newPassword`. |
| Mật khẩu mới | `newPassword` | Password | Tùy chọn | Đúng chuẩn mật khẩu mạnh (>=8 ký tự, hoa, thường, số, ký tự đặc biệt). |

---

## 3. Thiết kế RESTful API (API Design)

### 3.1. POST `/api/v1/auth/register`
* **Mô tả**: Đăng ký tài khoản người dùng mới.
* **Authorization**: Public (Không cần Bearer Token).
* **Request Payload**:
```json
{
  "email": "user@example.com",
  "fullName": "Nguyen Van A",
  "password": "Password123!",
  "currencyCode": "VND"
}
```
* **Business Rules (Backend)**:
  1. Kiểm tra Email đã tồn tại trong DB bảng `users` chưa. Nếu có -> Ném exception EmailAlreadyExists.
  2. Băm mật khẩu bằng thuật toán **BCrypt** (work factor 12) hoặc **Argon2id**. KHÔNG BAO GIỜ lưu plaintext.
  3. Tạo mới bản ghi `users` với `status = 'active'`, gán `role` mặc định là `StandardUser`.
  4. Tự động khởi tạo cấu hình ban đầu cho user (e.g. Các loại tài khoản mặc định Cash/Checking/Savings, Tiền tệ mặc định VND).
* **Database Operations**:
  - `INSERT INTO users (id, email, password_hash, name, default_currency, created_at, updated_at)...`
  - `INSERT INTO role_user (user_id, role_id)...`
* **Transaction**: **CÓ**. Phải bọc toàn bộ thao tác insert user + role + default setting trong 1 DB Transaction.

### 3.2. POST `/api/v1/auth/login`
* **Mô tả**: Đăng nhập hệ thống và cấp phát JWT Access Token + Refresh Token.
* **Authorization**: Public.
* **Request Payload**:
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "rememberMe": true,
  "mfaCode": null
}
```
* **Business Rules (Backend)**:
  1. Tìm user theo `email`. Nếu không tìm thấy hoặc `status != 'active'` -> Trả về HTTP 401 (Invalid Credentials).
  2. Verify password hash bằng BCrypt/Argon2id. Nếu sai -> Trả về HTTP 401.
  3. Nếu user bật MFA: Kiểm tra `mfaCode`. Đúng -> Cho phép tiếp tục; Sai -> Trả 401 (Invalid MFA Code).
  4. Tạo JWT Access Token (hạn 15-60 phút) chứa `userId`, `email`, `roles`.
  5. Tạo Refresh Token (hạn 7 ngày nếu `rememberMe = true`, 1 ngày nếu `false`), hash và lưu vào bảng `personal_access_tokens`.
* **Database Operations**:
  - `SELECT * FROM users WHERE email = @Email AND status = 'active'`
  - `INSERT INTO personal_access_tokens (id, user_id, token_hash, expires_at, created_at)...`
* **Transaction**: Không bắt buộc (Single Insert/Select).

### 3.3. POST `/api/v1/auth/refresh-token`
* **Mô tả**: Đổi Refresh Token lấy Access Token mới.
* **Authorization**: Public (Gửi kèm `refreshToken` trong Body hoặc HttpOnly Cookie).
* **Request Payload**:
```json
{
  "refreshToken": "d9b2e8f1-4c3a-4b7d-8e9f-1a2b3c4d5e6f"
}
```
* **Business Rules (Backend)**:
  1. Hash token nhận được và tìm trong bảng `personal_access_tokens`.
  2. Kiểm tra token có bị thu hồi (revoked) hoặc hết hạn (`expires_at < UTC NOW`) chưa.
  3. Nếu hợp lệ -> Cấp Access Token mới và rotate Refresh Token mới.

### 3.4. POST `/api/v1/auth/logout`
* **Mô tả**: Đăng xuất, thu hồi Refresh Token hiện tại.
* **Authorization**: Bearer Token.
* **Request Payload**:
```json
{
  "refreshToken": "d9b2e8f1-4c3a-4b7d-8e9f-1a2b3c4d5e6f"
}
```
* **Database Operations**:
  - `DELETE FROM personal_access_tokens WHERE token_hash = @Hash AND user_id = @CurrentUserId`

---

## 4. Xử lý Lỗi & Exception Handling

| Mã HTTP | Mã lỗi Nội bộ (ErrorCode) | Nguyên nhân & Ngữ cảnh |
| :--- | :--- | :--- |
| `400 Bad Request` | `INVALID_CREDENTIALS` | Mật khẩu hiện tại không đúng khi thực hiện đổi mật khẩu. |
| `401 Unauthorized` | `AUTH_EXPIRED_TOKEN` | Access Token hết hạn hoặc không hợp lệ. |
| `401 Unauthorized` | `INVALID_LOGIN` | Sai email hoặc mật khẩu. |
| `403 Forbidden` | `MFA_REQUIRED` | Yêu cầu nhập mã MFA 2FA. |
| `409 Conflict` | `EMAIL_ALREADY_EXISTS` | Email đăng ký đã tồn tại trong CSDL. |
| `422 Unprocessable`| `VALIDATION_FAILED` | Payload gửi lên vi phạm quy tắc validation (Thiếu email, password không đủ mạnh...). |

---

## 5. Cấu trúc Response Chuẩn (Standard API Response)

Mọi API trong module Auth đều tuân thủ cấu trúc Response chuẩn sau đây:

### 5.1. Response Thành công (HTTP 200 / 201)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Đăng nhập thành công",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 3600,
    "refreshToken": "d9b2e8f1-4c3a-4b7d-8e9f-1a2b3c4d5e6f",
    "user": {
      "id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
      "email": "user@example.com",
      "fullName": "Nguyen Van A",
      "defaultCurrency": "VND"
    }
  },
  "errors": null,
  "timestamp": "2026-09-20T11:50:00Z"
}
```

### 5.2. Response Thất bại do Validation (HTTP 422)
```json
{
  "success": false,
  "statusCode": 422,
  "message": "Dữ liệu đầu vào không hợp lệ",
  "data": null,
  "errors": [
    {
      "field": "email",
      "message": "Email đã tồn tại trên hệ thống"
    },
    {
      "field": "password",
      "message": "Mật khẩu phải chứa ít nhất 1 chữ cái viết hoa"
    }
  ],
  "timestamp": "2026-09-20T11:50:00Z"
}
```
