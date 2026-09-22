# BẢN THIẾT KẾ KỸ THUẬT HỆ THỐNG QUẢN LÝ TÀI CHÍNH CÁ NHÂN (PFM SYSTEM BLUEPRINT)

> **Kiến trúc hệ thống**: .NET 8 (C#) Web API Back-end | ReactJS + TypeScript Front-end | PostgreSQL Database (Firefly III 47-Table Double-Entry Bookkeeping Schema)
> **Tác giả**: Technical Lead & System Architect
> **Phiên bản**: 1.0.0 | **Ngày phát hành**: 2026-09-20

---

## MỤC LỤC TỔNG QUAN

1. [Kiến trúc Tổng quan Hệ thống (System Architecture)](#1-ki%E1%BA%BFn-tr%C3%BAc-t%E1%BB%95ng-quan-h%E1%BB%87-th%E1%BB%91ng)
2. [Chuẩn Giao tiếp RESTful API & Standard Response](#2-chu%E1%BA%A9n-giao-ti%E1%BA%BFp-restful-api--standard-response)
3. [Cơ chế Xử lý Lỗi Tập trung (Global Exception Handling)](#3-c%C6%A1-ch%E1%BA%BF-x%E1%BB%AD-l%C3%BD-l%E1%BB%97i-t%E1%BA%ADp-trung-global-exception-handling)
4. [Nguyên tắc Kế toán Kép (Double-Entry Bookkeeping Rules)](#4-nguy%C3%AAn-t%E1%BA%AFc-k%E1%BA%BF-to%C3%A1n-k%C3%A9p-double-entry-bookkeeping-rules)
5. [Danh mục Chi tiết 9 Module Tính năng (Detailed Modules 01 - 09)](#5-danh-m%E1%BB%A5c-chi-ti%E1%BA%BFt-9-module-t%C3%ADnh-n%C4%83ng)
   - [Module 01: Quản lý Người dùng & Bảo mật (Auth & Security)](#module-01-qu%E1%BA%A3n-l%C3%BD-ng%C6%B0%E1%BB%9Di-d%C3%B9ng--b%E1%BA%A3o-m%E1%BA%ADt-auth--security)
   - [Module 02: Đa Tiền tệ & Tỷ giá (Currencies & Rates)](#module-02-%C4%91a-ti%E1%BB%81n-t%E1%BB%87--t%E1%BB%B7-gi%C3%A1-currencies--rates)
   - [Module 03: Tài khoản & Ví (Accounts & Wallets)](#module-03-t%C3%A0i-kho%E1%BA%A3n--v%C3%AD-accounts--wallets)
   - [Module 04: Giao dịch Cốt lõi & Kế toán Kép (Transactions)](#module-04-giao-d%E1%BB%8Bch-c%E1%BB%91t-l%C3%B5i--k%E1%BA%BF-to%C3%A1n-k%E1%BA%BFp-transactions)
   - [Module 05: Phân loại, Thẻ & GPS (Categories & Tags)](#module-05-ph%C3%A2n-lo%E1%BA%A1i-th%E1%BA%BB--gps-categories--tags)
   - [Module 06: Ngân sách & Hạn mức (Budgets & Limits)](#module-06-ng%C3%A2n-s%C3%A1ch--h%E1%BA%A1n-m%E1%BB%A9c-budgets--limits)
   - [Module 07: Hóa đơn & Giao dịch Định kỳ (Bills & Recurrences)](#module-07-h%C3%B3a-%C4%91%C6%A1n--giao-d%E1%BB%8Bch-%C4%91%E1%BB%8Bnh-k%E1%BB%B3-bills--recurrences)
   - [Module 08: Hũ Tiết kiệm (Piggy Banks)](#module-08-h%C6%A9-ti%E1%BA%BFt-ki%E1%BB%87m-piggy-banks)
   - [Module 09: Báo cáo & Thống kê (Analytics & Reports)](#module-09-b%C3%A1o-c%C3%A1o--th%E1%BB%91ng-k%C3%AA-analytics--reports)

---

## 1. KIẾN TRÚC TỔNG QUAN HỆ THỐNG

### 1.1. Backend Architecture (.NET 8 Clean Architecture)
Hệ thống Back-end được tổ chức theo mô hình **Clean Architecture (Onion Architecture)** chia thành 4 lớp:

```
┌─────────────────────────────────────────────────────────────┐
│                 API Layer (Controllers, Middlewares)         │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│           Application Layer (Services, DTOs, CQRS)           │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│           Domain Layer (Entities, Value Objects, Enums)      │
└──────────────────────────────▲──────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────┐
│       Infrastructure Layer (EF Core, PostgreSQL DB, Quartz)  │
└─────────────────────────────────────────────────────────────┘
```

- **Domain Layer**: Chứa 47 Entities mapping với PostgreSQL Tables của Firefly III, Domain Events, Enums. KHÔNG phụ thuộc vào bất kỳ thư viện bên ngoài nào.
- **Application Layer**: Chứa Business Rules, Services, DTOs, FluentValidation rules, Interfaces.
- **Infrastructure Layer**: Triển khai `DbContext` với **Entity Framework Core 8**, Repositories, Quartz.NET Background Job Engine, JWT Token Generator, BCrypt Password Hasher.
- **API Layer**: Controller endpoints chuẩn RESTful, Authorization Attributes (`[Authorize]`), Global Exception Middleware.

### 1.2. Frontend Architecture (ReactJS + TypeScript)
- **Framework**: React 18+ với Vite & TypeScript.
- **State Management**: **TanStack Query (React Query v5)** cho Server State & Caching; **Zustand** cho Client UI State (Auth, Theme, Modals).
- **Form & Validation**: **React Hook Form** kết hợp với **Zod Schema Validation**.
- **UI Library**: TailwindCSS + Shadcn UI + Lucide Icons + Recharts (Trực quan hóa biểu đồ).

---

## 2. CHUẨN GIAO TIẾP RESTFUL API & STANDARD RESPONSE

Toàn bộ các Endpoint API trong hệ thống (tất cả 9 Module) **BẮT BUỘC** phải trả về một cấu trúc JSON thống nhất dạng Wrapper Object duy nhất:

### 2.1. Cấu trúc JSON Envelope
```typescript
interface ApiResponse<T> {
  success: boolean;            // true nếu HTTP 2xx, false nếu HTTP 4xx/5xx
  statusCode: number;          // Mã trạng thái HTTP (200, 201, 400, 401, 403, 404, 422, 500)
  message: string;             // Thông báo ngắn gọn bằng tiếng Việt dễ hiểu cho user
  data: T | null;              // Payload kết quả trả về (Object, Array, hoặc null)
  errors: ValidationError[] | null; // Danh sách lỗi chi tiết theo từng field (dùng cho 422)
  timestamp: string;           // Thời gian phản hồi dạng UTC ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)
}

interface ValidationError {
  field: string;               // Tên biến payload bị lỗi (e.g. "email", "amount")
  message: string;             // Lý do lỗi (e.g. "Số tiền phải lớn hơn 0")
}
```

### 2.2. Minh họa Response thành công (HTTP 200 / 201)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Thao tác thành công",
  "data": {
    "id": "acc-uuid-001",
    "name": "Ví Tiền mặt",
    "balance": 5000000.00
  },
  "errors": null,
  "timestamp": "2026-09-20T11:59:00Z"
}
```

### 2.3. Minh họa Response lỗi Validation (HTTP 422 Unprocessable Entity)
```json
{
  "success": false,
  "statusCode": 422,
  "message": "Dữ liệu gửi lên không hợp lệ",
  "data": null,
  "errors": [
    {
      "field": "amount",
      "message": "Số tiền giao dịch phải lớn hơn 0"
    },
    {
      "field": "sourceAccountId",
      "message": "Tài khoản nguồn không được để trống"
    }
  ],
  "timestamp": "2026-09-20T11:59:00Z"
}
```

---

## 3. CƠ CHẾ XỬ LÝ LỖI TẬP TRUNG (GLOBAL EXCEPTION HANDLING)

Tất cả các ngoại lệ (Exceptions) trong hệ thống .NET Core sẽ được chặn bởi `GlobalExceptionMiddleware` và ánh xạ chính xác sang các mã lỗi HTTP chuẩn:

| Mã HTTP | Tên chuẩn HTTP | Ngữ cảnh xảy ra & Exception Loại | Cách xử lý ở Front-end |
| :--- | :--- | :--- | :--- |
| `400` | Bad Request | Vi phạm quy tắc nghiệp vụ (VD: Chuyển khoản số tiền lớn hơn số dư ví, nạp hũ tiết kiệm vượt mức). | Hiển thị Toast Warning / Alert thông báo lý do vi phạm. |
| `401` | Unauthorized | Bearer Token thiếu, hết hạn hoặc không hợp lệ. | Tự động gọi Refresh Token API. Nếu thất bại -> Chuyển hướng sang màn hình `/login`. |
| `403` | Forbidden | Cố ý truy cập hoặc thao tác sửa/xóa dữ liệu thuộc sở hữu của User ID khác. | Hiển thị trang/modal thông báo "Bạn không có quyền thực hiện thao tác này". |
| `404` | Not Found | Không tìm thấy tài khoản, giao dịch, ngân sách hoặc danh mục theo ID yêu cầu. | Hiển thị màn hình 404 Not Found hoặc Toast thông báo dữ liệu không tồn tại. |
| `409` | Conflict | Dữ liệu trùng lặp (VD: Đăng ký Email đã tồn tại, Tạo tài khoản/danh mục trùng tên ở cùng cấp). | Hiển thị lỗi ngay trên trường nhập liệu tương ứng. |
| `422` | Unprocessable | Lỗi kiểm tra cú pháp & ràng buộc dữ liệu đầu vào (FluentValidation / Zod Schema). | Highlight đỏ các Input field bị lỗi và hiển thị danh sách `errors[]`. |
| `500` | Internal Error | Ngoại lệ hệ thống chưa xử lý (Database crash, NullReferenceException). | Hiển thị Toast "Lỗi hệ thống, vui lòng thử lại sau". Ghi log chi tiết (Serilog). |

---

## 4. NGUYÊN TẮC KẾ TOÁN KÉP (DOUBLE-ENTRY BOOKKEEPING RULES)

Cốt lõi của hệ thống PFM này dựa trên bộ 47 bảng CSDL của **Firefly III**:

1. **Mọi thực thể giao dịch đều là Tài khoản (Accounts)**:
   - `Asset Account`: Ví cá nhân (Ví tiền mặt, Ngân hàng VCB, Ví Momo).
   - `Expense Account`: Nơi chi tiền (Nhà hàng, Siêu thị, Cửa hàng điện máy).
   - `Revenue Account`: Nơi thu tiền (Công ty trả lương, Khách hàng).
   - `Initial Balance / Reconciliation Account`: Tài khoản đối ứng khởi tạo số dư / điều chỉnh sai lệch.

2. **Cấu trúc Bút toán 2 Chân (Two-Leg Transaction Splits)**:
   Mỗi sự kiện tài chính tạo ra 1 `transaction_journals` và ít nhất 2 bản ghi `transactions`:
   - **Giao dịch Chi tiêu (Withdrawal)**: 
     - Asset Account (Debit `-X`) -> Expense Account (Credit `+X`).
   - **Giao dịch Thu nhập (Deposit)**:
     - Revenue Account (Debit `-X`) -> Asset Account (Credit `+X`).
   - **Giao dịch Chuyển khoản (Transfer)**:
     - Asset Account A (Debit `-X`) -> Asset Account B (Credit `+X`).

3. **Database Transaction Management**:
   Mọi thao tác tạo/sửa/xóa Giao dịch, Khởi tạo tài khoản, Nạp/rút hũ tiết kiệm **BẮT BUỘC** phải được bọc trong 1 **PostgreSQL Database Transaction** (`IDbContextTransaction`) để đảm bảo nguyên lý **Atomicity (A trong ACID)**.

---

## 5. DANH MỤC CHI TIẾT 9 MODULE TÍNH NĂNG

Chi tiết từng Module được đặc tả đầy đủ trong các file Markdown độc lập tại thư mục `docs/`. Lập trình viên Backend và Frontend vui lòng click xem file đặc tả tương ứng bên dưới để thực thi code:

### 📄 [Module 01: Quản lý Người dùng & Bảo mật (`docs/01-auth-users.md`)](file:///s:/Study/Code/Person/financial-manager-app/docs/01-auth-users.md)
- **Tables**: `users`, `password_resets`, `personal_access_tokens`, `roles`, `permissions`, `role_user`.
- **Chức năng**: Đăng ký, Đăng nhập JWT, Refresh Token, Đổi mật khẩu, Xác thực 2 yếu tố MFA, Quản lý Profile.

### 📄 [Module 02: Đa Tiền tệ & Tỷ giá (`docs/02-currencies.md`)](file:///s:/Study/Code/Person/financial-manager-app/docs/02-currencies.md)
- **Tables**: `currencies`, `currency_exchange_rates`.
- **Chức năng**: Danh mục ISO 4217, Cấu hình số chữ số thập phân, Tỷ giá quy đổi theo ngày, API convert số tiền về Base Currency.

### 📄 [Module 03: Tài khoản & Ví (`docs/03-accounts.md`)](file:///s:/Study/Code/Person/financial-manager-app/docs/03-accounts.md)
- **Tables**: `accounts`, `account_types`, `account_meta`.
- **Chức năng**: Quản lý Ví tài sản, Tài khoản ngân hàng, Số dư ban đầu (Opening Balance), Metadata (IBAN, Bank Code), Tính số dư tự động.

### 📄 [Module 04: Giao dịch Cốt lõi & Kế toán Kép (`docs/04-transactions.md`)](file:///s:/Study/Code/Person/financial-manager-app/docs/04-transactions.md)
- **Tables**: `transaction_journals`, `transactions`, `transaction_types`, `journal_meta`, `attachments`, `tags`, `taggables`.
- **Chức năng**: Nhập Thu/Chi/Chuyển khoản, Phân tách bút toán Debit/Credit, Đính kèm ảnh hóa đơn, Gắn Thẻ Tag, DB Transaction Management.

### 📄 [Module 05: Phân loại, Thẻ & GPS (`docs/05-categories-tags.md`)](file:///s:/Study/Code/Person/financial-manager-app/docs/05-categories-tags.md)
- **Tables**: `categories`, `category_meta`, `tags`, `taggables`, `journal_meta` (GPS location).
- **Chức năng**: Cây danh mục cha - con (Category Tree), Icon & Mã màu, Thẻ Tag sự kiện, Định vị GPS vị trí giao dịch.

### 📄 [Module 06: Ngân sách & Hạn mức (`docs/06-budgets.md`)](file:///s:/Study/Code/Person/financial-manager-app/docs/06-budgets.md)
- **Tables**: `budgets`, `budget_limits`, `budget_transaction_journal`.
- **Chức năng**: Đặt hạn mức chi tiêu theo tuần/tháng/năm, Theo dõi tiến độ chi tiêu %, Cảnh báo sắp vượt/vượt quá ngân sách.

### 📄 [Module 07: Hóa đơn & Giao dịch Định kỳ (`docs/07-bills-recurrences.md`)](file:///s:/Study/Code/Person/financial-manager-app/docs/07-bills-recurrences.md)
- **Tables**: `bills`, `bill_meta`, `recurrences`, `recurrence_transactions`, `recurrence_meta`.
- **Chức năng**: Theo dõi hóa đơn cố định, Tự động hóa sinh giao dịch định kỳ theo lịch Cron Job (Quartz.NET / Hangfire Worker Service).

### 📄 [Module 08: Hũ Tiết kiệm (`docs/08-piggy-banks.md`)](file:///s:/Study/Code/Person/financial-manager-app/docs/08-piggy-banks.md)
- **Tables**: `piggy_banks`, `piggy_bank_events`.
- **Chức năng**: Mục tiêu tiết kiệm ngắn/dài hạn, Phân bổ tiền ảo trong ví Asset, Thao tác Nạp/Rút hũ, Gợi ý số tiền nạp hàng tháng.

### 📄 [Module 09: Báo cáo & Thống kê (`docs/09-statistics.md`)](file:///s:/Study/Code/Person/financial-manager-app/docs/09-statistics.md)
- **Tables/Views**: `transaction_journals`, `transactions`, `accounts`, `categories` (Read-Heavy Aggregations).
- **Chức năng**: Báo cáo Dòng tiền (Cashflow), Biểu đồ Cơ cấu Chi tiêu (Category Breakdown), Tài sản ròng (Net Worth), Xuất báo cáo file Excel XLSX / PDF.

---

> **HƯỚNG DẪN DÀNH CHO LẬP TRÌNH VIÊN**:
> - **Backend Developer (.NET 8)**: Đọc phần 1 & 2 của tài liệu này để nắm Clean Architecture và Standard API Response Wrapper. Sau đó mở lần lượt từng file trong thư mục `docs/01-auth-users.md` đến `docs/09-statistics.md` để triển khai Entity, Migration, Service và Controller tương ứng.
> - **Frontend Developer (ReactJS + TS)**: Đọc phần 2 & 3 để xây dựng Axios Interceptor và React Query custom hooks. Sử dụng bảng Giao diện & Form (Mục 2) của từng file trong `docs/` để dựng React Hook Form + Zod validation schema chuẩn xác.
