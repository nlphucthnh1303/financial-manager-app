# Module 02: Đa Tiền tệ & Tỷ giá (Currencies & Exchange Rates)

## 1. Tổng quan Kiến trúc Module (Module Overview)

### 1.1. Vai trò của Module
Module này chịu trách nhiệm quản lý danh mục Tiền tệ (Currencies) và Lịch sử Tỷ giá hối đoái (Exchange Rates). 

Trong hệ thống PFM kế toán kép, người dùng có thể sở hữu các ví tiền/tài khoản bằng nhiều loại tiền tệ khác nhau (VD: Ví Tiền mặt bằng `VND`, Tài khoản Paypal bằng `USD`, Thẻ tín dụng bằng `EUR`). Module này cung cấp khả năng tự động quy đổi số tiền giao dịch về **Tiền tệ Mặc định (Base Currency)** của người dùng để tính toán báo cáo tổng quan tài sản ròng và phân tích thu chi chính xác.

### 1.2. Danh sách các bảng Database (PostgreSQL Schema)
Module này sử dụng 2 bảng chính trong sơ đồ Firefly III:

| Tên bảng | Vai trò & Mô tả | Mối quan hệ (Relationships) |
| :--- | :--- | :--- |
| `currencies` | Lưu trữ danh mục tiền tệ hệ thống và tiền tệ tùy chỉnh của user (ISO 4217 code, symbol, decimal places, status). | 1-n với `currency_exchange_rates` (from_currency & to_currency), 1-n với `accounts`, 1-n với `transaction_journals`. |
| `currency_exchange_rates` | Lưu lịch sử tỷ giá hối đoái giữa 2 đồng tiền theo ngày. | n-1 với `currencies` (`from_currency_id`), n-1 với `currencies` (`to_currency_id`). |

#### Sơ đồ thực thể ERD:
```
  [currencies] (Base) 1 --- n [currency_exchange_rates] (From)
  [currencies] (Target) 1 --- n [currency_exchange_rates] (To)
```

---

## 2. Chi tiết Giao diện & Form (UI/UX & Forms)

### 2.1. Màn hình Danh sách Tiền tệ (`ScreenCurrencyList`)
* **Mô tả**: Hiển thị bảng danh sách các đồng tiền khả dụng trong hệ thống, tỷ giá hiện tại so với Base Currency, ký hiệu và tùy chọn bật/tắt kích hoạt.

### 2.2. Form Tạo / Chỉnh sửa Tiền tệ (`FormCurrency`)
* **Tên Form**: `FormCurrency`
* **Mô tả**: Cho phép tạo tiền tệ tùy chỉnh hoặc sửa định dạng hiển thị.

| Label (Hiển thị) | Payload Key | Type | Trạng thái | UI Validation Logic |
| :--- | :--- | :--- | :--- | :--- |
| Mã tiền tệ (ISO) | `code` | Text | Bắt buộc | 3 chữ cái viết hoa (e.g. `USD`, `VND`, `JPY`). Regex: `^[A-Z]{3}$`. |
| Tên tiền tệ | `name` | Text | Bắt buộc | Max 50 ký tự. Không được trống. |
| Ký hiệu tiền tệ | `symbol` | Text | Bắt buộc | Max 10 ký tự (e.g. `$`, `₫`, `€`). |
| Số chữ số thập phân | `decimalPlaces` | Number | Bắt buộc | Integer từ `0` đến `4` (VND là `0`, USD là `2`). |
| Trạng thái kích hoạt| `enabled` | Checkbox | Bắt buộc | Boolean (`true`/`false`). |

### 2.3. Form Cập nhật Tỷ giá Thủ công (`FormExchangeRate`)
* **Tên Form**: `FormExchangeRate`
* **Mô tả**: Cho phép nhập tỷ giá quy đổi thủ công cho một ngày cụ thể.

| Label (Hiển thị) | Payload Key | Type | Trạng thái | UI Validation Logic |
| :--- | :--- | :--- | :--- | :--- |
| Từ đồng tiền | `fromCurrencyId` | Select | Bắt buộc | Select từ danh sách `currencies` khả dụng. |
| Sang đồng tiền | `toCurrencyId` | Select | Bắt buộc | Phải khác `fromCurrencyId`. |
| Ngày áp dụng | `date` | Date | Bắt buộc | Format `YYYY-MM-DD`. Không được để trống. |
| Tỷ giá (Rate) | `rate` | Number (Decimal)| Bắt buộc | Số thực dương > 0 (e.g. `25450.50`). Tối đa 8 chữ số thập phân. |

---

## 3. Thiết kế RESTful API (API Design)

### 3.1. GET `/api/v1/currencies`
* **Mô tả**: Lấy danh sách tất cả các loại tiền tệ (có hỗ trợ filter active/enabled).
* **Authorization**: Bearer Token.
* **Query Parameters**: `?enabled=true`
* **Request Payload**: None.
* **Database Operations**:
  - `SELECT id, code, name, symbol, decimal_places, enabled FROM currencies WHERE enabled = true OR user_id = @UserId`

### 3.2. POST `/api/v1/currencies`
* **Mô tả**: Thêm loại tiền tệ mới.
* **Authorization**: Bearer Token (Admin hoặc User custom currency).
* **Request Payload**:
```json
{
  "code": "EUR",
  "name": "Euro",
  "symbol": "€",
  "decimalPlaces": 2,
  "enabled": true
}
```
* **Business Rules (Backend)**:
  1. Kiểm tra mã ISO `code` đã tồn tại chưa (viết hoa). Nếu có -> Ném exception `CURRENCY_CODE_ALREADY_EXISTS`.
  2. Lưu thông tin tiền tệ vào CSDL.
* **Database Operations**:
  - `INSERT INTO currencies (id, code, name, symbol, decimal_places, enabled, created_at, updated_at)...`

### 3.3. POST `/api/v1/currencies/rates`
* **Mô tả**: Tạo hoặc cập nhật tỷ giá quy đổi giữa 2 đồng tiền cho 1 ngày.
* **Authorization**: Bearer Token.
* **Request Payload**:
```json
{
  "fromCurrencyId": "currency-uuid-usd",
  "toCurrencyId": "currency-uuid-vnd",
  "date": "2026-09-20",
  "rate": 25450.00
}
```
* **Business Rules (Backend)**:
  1. `fromCurrencyId` và `toCurrencyId` không được trùng nhau.
  2. `rate` phải > 0.
  3. Nếu tỷ giá cho cặp tiền tệ + ngày này đã tồn tại -> Update giá trị `rate`. Nếu chưa có -> Insert mới (UPSERT).
* **Database Operations**:
  - `INSERT INTO currency_exchange_rates (id, from_currency_id, to_currency_id, date, rate, created_at) VALUES (...) ON CONFLICT (from_currency_id, to_currency_id, date) DO UPDATE SET rate = EXCLUDED.rate;`

### 3.4. GET `/api/v1/currencies/convert`
* **Mô tả**: API tiện ích hỗ trợ Frontend tính nhanh số tiền quy đổi tại một thời điểm.
* **Authorization**: Bearer Token.
* **Query Parameters**: `?from=USD&to=VND&amount=100&date=2026-09-20`
* **Business Rules (Backend)**:
  1. Tìm tỷ giá ngày `2026-09-20`. Nếu không có tỷ giá ngày này, tự động fallback lấy tỷ giá gần nhất trong quá khứ (`date <= TargetDate ORDER BY date DESC LIMIT 1`).
  2. Nếu không có tỷ giá nào -> Trả về lỗi `EXCHANGE_RATE_NOT_FOUND`.
  3. Tính toán: `convertedAmount = round(amount * rate, decimalPlaces)`.

---

## 4. Xử lý Lỗi & Exception Handling

| Mã HTTP | Mã lỗi Nội bộ (ErrorCode) | Nguyên nhân & Ngữ cảnh |
| :--- | :--- | :--- |
| `400 Bad Request` | `SAME_CURRENCY_CONVERSION` | Cố gắng nhập tỷ giá giữa 2 đồng tiền giống hệt nhau. |
| `400 Bad Request` | `INVALID_RATE_VALUE` | Tỷ giá nhập vào <= 0. |
| `404 Not Found` | `CURRENCY_NOT_FOUND` | Không tìm thấy mã tiền tệ yêu cầu. |
| `404 Not Found` | `EXCHANGE_RATE_NOT_FOUND` | Không tìm thấy tỷ giá quy đổi tương ứng cho ngày được chọn. |
| `409 Conflict` | `CURRENCY_CODE_ALREADY_EXISTS` | Mã ISO tiền tệ đã tồn tại. |

---

## 5. Cấu trúc Response Chuẩn (Standard API Response)

### 5.1. Response Danh sách Tiền tệ (HTTP 200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy danh sách tiền tệ thành công",
  "data": [
    {
      "id": "c01-vnd-uuid",
      "code": "VND",
      "name": "Vietnamese Đồng",
      "symbol": "₫",
      "decimalPlaces": 0,
      "enabled": true
    },
    {
      "id": "c02-usd-uuid",
      "code": "USD",
      "name": "US Dollar",
      "symbol": "$",
      "decimalPlaces": 2,
      "enabled": true
    }
  ],
  "errors": null,
  "timestamp": "2026-09-20T11:51:00Z"
}
```

### 5.2. Response Kết quả Quy đổi Tiền tệ (HTTP 200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Quy đổi tiền tệ thành công",
  "data": {
    "fromCurrency": "USD",
    "toCurrency": "VND",
    "originalAmount": 100.00,
    "exchangeRate": 25450.00,
    "rateDate": "2026-09-20",
    "convertedAmount": 2545000
  },
  "errors": null,
  "timestamp": "2026-09-20T11:51:00Z"
}
```
