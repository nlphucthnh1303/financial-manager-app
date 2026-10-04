# 💰 Financial Manager (PFM System) - Version 2.0.0

Hệ thống **Quản lý Tài chính Cá nhân Thông minh (Personal Finance Management - PFM)** kiến trúc đa nền tảng kết hợp giữa **Ứng dụng Máy tính (Desktop App - Windows / Linux)**, **Ứng dụng Di động (Mobile App - Android Offline-First)** và **Cơ sở dữ liệu tập trung (PostgreSQL Central Database)**.

---

## 🌟 Điểm nổi bật & Tính năng cốt lõi (v2.0.0)

### 1. 🖥️ Ứng dụng Desktop (Windows x64 / Arch Linux)
- **Giao diện hiện đại & Cao cấp**: Xây dựng trên nền tảng **React 18 + TypeScript + TailwindCSS + Radix UI + Lucide Icons**, hỗ trợ chế độ Sáng/Tối (Light/Dark mode) linh hoạt.
- **Kiến trúc Nhúng Siêu nhẹ**: Chạy bằng **Photino.NET + WebView2**, nhúng trực tiếp API ASP.NET Core và Frontend tĩnh trong một tiến trình duy nhất mà không cần cài thêm Node.js hay Web Server bên ngoài.
- **Bảo toàn Dữ liệu & Tự động Cập nhật (In-Place Auto-Update)**: Cấu hình kết nối và mật khẩu được mã hóa an toàn bằng **Windows DPAPI** tại `%APPDATA%\FinancialManager`. Cập nhật lên bản mới chỉ cần 1-click mà không bị mất cài đặt.
- **9 Module Tài chính chuẩn Firefly III**:
  - 💳 **Quản lý Tài khoản**: Tiền mặt, Ngân hàng, Thẻ tín dụng, Khoản nợ.
  - 📊 **Giao dịch Thu - Chi - Chuyển tiền**: Ghi chép chi tiết, hỗ trợ đa tiền tệ (VND, USD, EUR...).
  - 🏷️ **Danh mục & Thẻ (Tags)**: Phân loại chi tiêu đa cấp, gắn nhãn thông minh.
  - 🎯 **Ngân sách (Budgets)**: Cảnh báo chi tiêu theo ngưỡng hạn mức tháng.
  - 📅 **Hóa đơn & Định kỳ (Bills/Recurring)**: Nhắc nhở thanh toán hóa đơn điện thoại, điện nước.
  - 🐷 **Heo đất Tiết kiệm (Piggy Banks)**: Quản lý mục tiêu tiết kiệm, nạp/rút tiền tích lũy.
  - 📈 **Báo cáo & Thống kê**: Biểu đồ dòng tiền, phân bổ danh mục (Recharts).

---

### 2. 📱 Ứng dụng Di động (Android Mobile App - Offline-First)
- **Offline-First Local DB (IndexedDB)**: Ghi chép giao dịch nhanh chóng mọi lúc mọi nơi ngay cả khi không có kết nối Internet.
- **🔌 Đồng bộ 2 Chiều qua Cáp USB (Physical USB Sync)**:
  - Cắm cáp USB nối điện thoại vào máy tính và nhấn "Đồng bộ".
  - Tự động nạp giao dịch mới từ điện thoại vào Database tổng trên máy tính, và tải danh mục/tài khoản mới nhất từ máy tính về điện thoại.
  - Ghi nhận lịch sử đồng bộ chi tiết (`SyncHistories`).
- **📸 Quét Hóa đơn Ngân hàng Thông minh (On-Device OCR & Share Intent)**:
  - Tích hợp tính năng **Chia sẻ ảnh (Android Share Intent)**: Khi có ảnh chụp biên lai chuyển tiền từ các app ngân hàng (Techcombank, VietinBank, Vietcombank, MB, Momo, Sacombank...), người dùng chỉ cần bấm **Chia sẻ ➔ Financial Manager**.
  - Ứng dụng sử dụng **Google ML Kit Text Recognition** xử lý trực tiếp trên máy (On-Device OCR) chỉ trong 0.5s: Tự động trích xuất số tiền, tên người nhận, ngân hàng và điền sẵn biểu mẫu giao dịch.
- **Tối ưu Tốc độ & Tiết kiệm Pin**: Loại bỏ các animation dư thừa, tốc độ phản hồi < 200ms, tối ưu tuyệt đối cho các thiết bị cấu hình phổ thông.

---

### 3. 🔒 Hệ thống Back-end & Cơ sở dữ liệu (Core Engine)
- **Công nghệ**: **.NET 8 Web API** + **Entity Framework Core 8** + **PostgreSQL 16/17**.
- **Bảo mật**: Xác thực chuẩn **JWT Bearer Token**, mã hóa mật khẩu **BCrypt**, bảo vệ chống tấn công Brute-Force bằng Rate Limiter.
- **Tự động Khởi tạo & Nâng cấp (Auto-Migration)**: Tự động tạo bảng và migrate cấu trúc cơ sở dữ liệu khi khởi chạy.

---

## 📂 Cấu trúc Thư mục Dự án

```text
financial-manager-app/
├── back-end/
│   ├── src/
│   │   ├── FinancialManager.Domain/         # Entity, Enum, Base Models
│   │   ├── FinancialManager.Application/    # DTOs, Business Services, Interfaces
│   │   ├── FinancialManager.Infrastructure/ # EF Core DbContext, PostgreSQL Data
│   │   ├── FinancialManager.Api/            # REST Controllers, JWT Middleware, Swagger
│   │   └── FinancialManager.Desktop/        # Photino.NET Desktop App (Windows / Linux)
├── front-end/
│   ├── src/                                 # React UI, Tailwind, Pages, Components
│   │   ├── components/modals/               # Modals (ReceiptShareModal, DesktopSyncModal...)
│   │   └── lib/                             # LocalDB (IndexedDB), SyncEngine, OCR Parsers
│   ├── android/                             # Dự án Android Capacitor Native (Java + ML Kit)
│   │   └── app/src/main/                    # AndroidManifest, MainActivity.java, OCR Bridge
├── installer/
│   └── FinancialManager-Setup.iss           # Tệp đóng gói Inno Setup cho Windows
├── .agents/skills/                          # Hệ thống Skills tự động hóa
│   └── setup-app/SKILL.md                   # Skill quản lý cài đặt App Mobile (/setup-app)
├── build-windows-v2.sh                      # Script biên dịch trọn gói Desktop Windows
├── setup-app.sh                             # Script điều khiển vòng đời App Mobile
├── setup-arch-linux.sh                      # Script cài đặt môi trường Arch Linux & kết nối DB
└── docker-compose.yml                       # Cấu hình triển khai Docker Container
```

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy

### A. Dành cho Ứng dụng Desktop trên Windows

1. Tải bản phân phối Version 2.0.0 tại thư mục `dist/` (`FinancialManager-v2.0.0-Windows-x64.zip`).
2. Giải nén và chạy file:
   ```text
   Update-To-v2.0.0.bat
   ```
   *(Hoặc nhấp đúp chạy trực tiếp `FinancialManager.exe`)*.
3. Khi mở ứng dụng lần đầu, nhập thông tin kết nối PostgreSQL (Host, Port, Database, Username, Password) để hoàn tất.

---

### B. Dành cho Môi trường Arch Linux

1. Cài đặt các gói công cụ và cấu hình kết nối DB tự động:
   ```bash
   chmod +x setup-arch-linux.sh
   ./setup-arch-linux.sh
   ```
2. Khởi chạy Backend API:
   ```bash
   cd back-end/src/FinancialManager.Api
   dotnet run --urls "http://localhost:5266"
   ```
3. Khởi chạy Frontend Web:
   ```bash
   cd front-end
   npm run dev
   ```

---

### C. Dành cho Ứng dụng Di động (Android)

Cắm cáp USB nối điện thoại với máy tính (đã bật *Gỡ lỗi USB*), sau đó sử dụng bộ lệnh:

```bash
# 1. Cài đặt app mới vào điện thoại và mở cổng đồng bộ
./setup-app.sh install

# 2. Cập nhật app khi sửa đổi code (giữ nguyên dữ liệu cũ trong máy)
./setup-app.sh update

# 3. Mở app trên điện thoại
./setup-app.sh launch

# 4. Gỡ cài đặt app
./setup-app.sh uninstall
```

*(Hoặc gõ lệnh `/setup-app install` / `/setup-app update` trực tiếp trong trình trợ lý)*.

---

## 🛠️ Hướng dẫn Biên dịch từ Mã nguồn (Build from Source)

- **Biên dịch bản Desktop Windows (v2.0.0)**:
  ```bash
  ./build-windows-v2.sh
  ```
- **Biên dịch bản Android APK**:
  ```bash
  ./setup-app.sh build
  ```

---

## 📄 Bản quyền & Tác giả
- **Dự án**: Financial Manager App (PFM System)
- **Tác giả**: Nguyễn Lê Phúc Thịnh
- **Phiên bản**: 2.0.0 (Tháng 10/2026)
- **Giấy phép**: MIT License
