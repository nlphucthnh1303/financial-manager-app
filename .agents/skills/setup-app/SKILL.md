---
name: setup-app
description: Quản lý vòng đời phần mềm Financial Manager trên điện thoại Android (Cài đặt, Cập nhật, Gỡ cài đặt, Kiểm tra kết nối ADB, cấu hình cổng đồng bộ USB reverse và khởi chạy ứng dụng). Kích hoạt khi người dùng gõ lệnh /setup-app hoặc yêu cầu cài đặt/cập nhật/gỡ cài đặt app trên điện thoại.
---

# 📱 Setup App Skill: Financial Manager Mobile Deployment

Skill này chịu trách nhiệm **duy nhất** việc quản lý vòng đời ứng dụng **Financial Manager** (`com.financialmanager.app`) trên điện thoại Android kết nối qua USB.

---

## 🔒 NGUYÊN TẮC BẢO VỆ TUYỆT ĐỐI (STRICT BOUNDARY RULES)
1. **CHỈ thao tác với duy nhất package `com.financialmanager.app`**.
2. **TUYỆT ĐỐI KHÔNG can thiệp vào cài đặt hệ điều hành Android** (không chỉnh sửa `settings put`, không tắt hiệu ứng, không chỉnh RAM Plus hay freezer).
3. **TUYỆT ĐỐI KHÔNG vô hiệu hóa (disable) hay gỡ bỏ bất kỳ ứng dụng nào khác của người dùng hay của hệ thống**.
4. **Mọi thao tác cài đặt / cập nhật đều phải dùng lệnh an toàn**: `adb install -r <apk>` để bảo toàn dữ liệu cục bộ của ứng dụng.

---

## 🛠️ CÁC LỆNH VÀ THAO TÁC HỖ TRỢ

Khi người dùng gõ lệnh `/setup-app` (hoặc kèm theo các tùy chọn như install, update, uninstall, launch, status):

### 1. Cài đặt ứng dụng mới (`/setup-app install` hoặc `/setup-app`)
Thực thi:
```bash
./setup-app.sh install
```
**Quy trình thực hiện:**
- Kiểm tra thiết bị kết nối qua USB (`adb devices`).
- Build mã nguồn Frontend và Sync sang Android (`npm run build && npx cap sync android`).
- Biên dịch file APK bằng Gradle (`./gradlew assembleDebug`).
- Cài đặt APK an toàn vào điện thoại (`adb install -r`).
- Mở cổng ADB Reverse port 5266 để sẵn sàng đồng bộ dữ liệu qua cáp USB (`adb reverse tcp:5266 tcp:5266`).
- Tự động mở ứng dụng trên màn hình điện thoại.

---

### 2. Cập nhật ứng dụng khi code có thay đổi (`/setup-app update`)
Thực thi:
```bash
./setup-app.sh update
```
**Quy trình thực hiện:**
- Tự động Rebuild Frontend với code mới nhất.
- Nạp bản cập nhật mới đè lên app cũ trên điện thoại (giữ nguyên toàn bộ dữ liệu giao dịch ngoại tuyến cũ trong IndexedDB).
- Khởi động lại ứng dụng với giao diện mới.

---

### 3. Gỡ cài đặt ứng dụng (`/setup-app uninstall`)
Thực thi:
```bash
./setup-app.sh uninstall
```
**Quy trình thực hiện:**
- Gỡ bỏ duy nhất package `com.financialmanager.app` khỏi máy.

---

### 4. Mở ứng dụng & Kích hoạt cổng đồng bộ (`/setup-app launch`)
Thực thi:
```bash
./setup-app.sh launch
```
**Quy trình thực hiện:**
- Mở cổng kết nối Reverse 5266.
- Khởi chạy màn hình chính của ứng dụng trên điện thoại.

---

### 5. Kiểm tra trạng thái cài đặt (`/setup-app status`)
Thực thi:
```bash
./setup-app.sh status
```
**Quy trình thực hiện:**
- Kiểm tra thiết bị có đang kết nối USB không.
- Kiểm tra ứng dụng Financial Manager đã được cài trên máy chưa và phiên bản hiện tại.
