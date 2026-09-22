# Module 07: Hóa đơn & Giao dịch Định kỳ (Bills & Recurring Transactions)

## 1. Tổng quan Kiến trúc Module (Module Overview)

### 1.1. Vai trò của Module
Module này tự động hóa việc quản lý các nghĩa vụ tài chính lặp đi lặp lại. Module chia làm 2 thành phần cốt lõi:
1. **Bills (Hóa đơn cần thanh toán)**: Theo dõi các hóa đơn định kỳ (Tiền điện, nước, internet, tiền nhà) với khoảng tiền dự kiến (Min/Max Amount). Hệ thống tự động khớp giao dịch chi tiêu thực tế với Hóa đơn để theo dõi trạng thái `Paid` (Đã trả) hoặc `Unpaid` (Chưa trả).
2. **Recurrence Transactions (Giao dịch Định kỳ Tự động)**: Thiết lập quy tắc sinh giao dịch tự động theo chu kỳ (Trả lương hàng tháng, Trả góp, Đăng ký dịch vụ Spotify/Netflix). Được xử lý ngầm bởi Background Worker Service (**Quartz.NET** hoặc **Hangfire** trong .NET Core).

### 1.2. Danh sách các bảng Database (PostgreSQL Schema)
Module này sử dụng 5 bảng CSDL chính trong Firefly III:

| Tên bảng | Vai trò & Mô tả | Mối quan hệ (Relationships) |
| :--- | :--- | :--- |
| `bills` | Lưu danh sách hóa đơn theo dõi (Tên hóa đơn, Số tiền min/max, Ngày đến hạn, Chu kỳ lặp, Trạng thái active). | 1-n với `bill_meta`, 1-n với `transaction_journals`. |
| `bill_meta` | Lưu các thuộc tính tùy biến của hóa đơn (e.g. Mã khách hàng tiền điện, Link thanh toán). | n-1 với `bills`. |
| `recurrences` | Quy tắc tạo giao dịch định kỳ (Tên quy tắc, Chu kỳ Cron/Interval, Ngày kích hoạt tiếp theo `first_date`, `repeat_until`). | 1-n với `recurrence_transactions`, 1-n với `recurrence_meta`, 1-n với `transaction_journals`. |
| `recurrence_transactions`| Mẫu bút toán giao dịch (Template) sẽ được nhân bản khi Background Job chạy. | n-1 với `recurrences`, n-1 với `accounts`. |
| `recurrence_meta` | Lưu siêu dữ liệu cấu hình lặp lại. | n-1 với `recurrences`. |

#### Sơ đồ thực thể ERD:
```
  [bills]        1 --- n [transaction_journals]
  [recurrences]  1 --- n [recurrence_transactions]
  [recurrences]  1 --- n [transaction_journals] (được sinh tự động từ Background Job)
```

---

## 2. Chi tiết Giao diện & Form (UI/UX & Forms)

### 2.1. Màn hình Quản lý Hóa đơn & Giao dịch Định kỳ (`ScreenBillManagement`)
* **Mô tả**: Hiển thị danh sách hóa đơn tháng này, cảnh báo các hóa đơn sắp đến hạn/quá hạn chưa thanh toán, lịch các giao dịch lặp lại tự động sắp tới.

### 2.2. Form Tạo / Chỉnh sửa Hóa đơn (`FormBill`)
* **Tên Form**: `FormBill`
* **Mô tả**: Thiết lập hóa đơn cần theo dõi (VD: Tiền điện EVN tháng này).

| Label (Hiển thị) | Payload Key | Type | Trạng thái | UI Validation Logic |
| :--- | :--- | :--- | :--- | :--- |
| Tên Hóa đơn | `name` | Text | Bắt buộc | Length: 2 - 100 ký tự. (e.g. `Tiền điện EVN`). |
| Số tiền tối thiểu | `amountMin` | Number (Decimal)| Bắt buộc | Số thực > 0. |
| Số tiền tối đa | `amountMax` | Number (Decimal)| Bắt buộc | Số thực `>= amountMin`. |
| Chu kỳ lặp | `repeatFreq` | Select | Bắt buộc | Enum: `Weekly`, `Monthly`, `Quarterly`, `Yearly`. |
| Ngày bắt đầu lặp | `date` | Date | Bắt buộc | Format `YYYY-MM-DD`. |
| Trạng thái kích hoạt| `active` | Checkbox | Bắt buộc | Boolean (`true`/`false`). Mặc định `true`. |

### 2.3. Form Thiết lập Giao dịch Lặp lại (`FormRecurrence`)
* **Tên Form**: `FormRecurrence`
* **Mô tả**: Tạo quy tắc tự động sinh giao dịch (VD: Nhận lương 25.000.000đ vào ngày 5 hàng tháng).

| Label (Hiển thị) | Payload Key | Type | Trạng thái | UI Validation Logic |
| :--- | :--- | :--- | :--- | :--- |
| Tên Quy tắc | `title` | Text | Bắt buộc | Length: 2 - 100 ký tự. |
| Loại giao dịch | `type` | Select | Bắt buộc | Enum: `Withdrawal`, `Deposit`, `Transfer`. |
| Chu kỳ (Frequency)| `repeatFrequency` | Select | Bắt buộc | Enum: `Daily`, `Weekly`, `Monthly`, `Yearly`. |
| Ngày sinh đầu tiên| `firstDate` | Date | Bắt buộc | Format `YYYY-MM-DD`. |
| Ngày kết thúc | `repeatUntil` | Date | Tùy chọn | Nếu để trống = Lặp vô hạn. |
| Số tiền | `amount` | Number (Decimal)| Bắt buộc | Số thực dương > 0. |
| Tài khoản Nguồn | `sourceAccountId` | Select | Bắt buộc | Select ví nguồn. |
| Tài khoản Đích | `destinationAccountId`| Select/Text | Bắt buộc | Select ví đích hoặc tên nơi thụ hưởng. |

---

## 3. Thiết kế RESTful API (API Design)

### 3.1. GET `/api/v1/bills`
* **Mô tả**: Lấy danh sách hóa đơn và trạng thái thanh toán trong kỳ hiện tại.
* **Authorization**: Bearer Token.
* **Database Operations**:
  - Join `bills` với `transaction_journals` để kiểm tra xem đã có giao dịch nào khớp với khoảng tiền `amount_min` -> `amount_max` trong kỳ này chưa.

### 3.2. POST `/api/v1/recurrences`
* **Mô tả**: Tạo mới quy tắc sinh giao dịch định kỳ.
* **Authorization**: Bearer Token.
* **Request Payload**:
```json
{
  "title": "Nhận lương công ty hằng tháng",
  "type": "Deposit",
  "repeatFrequency": "Monthly",
  "firstDate": "2026-10-05",
  "repeatUntil": null,
  "amount": 25000000.00,
  "sourceAccountName": "Công ty Cổ phần Tech",
  "destinationAccountId": "acc-uuid-vcb",
  "categoryId": "cat-uuid-luong"
}
```
* **Business Rules (Backend)**:
  1. Thêm quy tắc vào bảng `recurrences`.
  2. Thêm template chi tiết vào bảng `recurrence_transactions`.
  3. Tính toán ngày chạy tiếp theo (`next_date`).

### 3.3. Background Worker Engine (Quartz.NET / Hangfire Cron Job)
* **Tần suất chạy**: Hàng ngày vào lúc `00:05:00 UTC`.
* **Logic xử lý ngầm (C# Engine)**:
  1. Lấy danh sách các `recurrences` có `active = true` và `next_date <= CurrentUtcDate`.
  2. Với mỗi quy tắc:
     - Tự động gọi Service sinh một Giao dịch Kế toán Kép mới (`transaction_journals` + `transactions`) trong Module 04.
     - Tính toán lại ngày sinh tiếp theo (`next_date`) dựa trên `repeatFrequency`.
     - Cập nhật `next_date` và `last_executed_at` vào bảng `recurrences`.
  3. Bọc toàn bộ thao tác của mỗi recurrence trong DB Transaction.

---

## 4. Xử lý Lỗi & Exception Handling

| Mã HTTP | Mã lỗi Nội bộ (ErrorCode) | Nguyên nhân & Ngữ cảnh |
| :--- | :--- | :--- |
| `400 Bad Request` | `INVALID_BILL_AMOUNT_RANGE`| Số tiền Min > Max. |
| `400 Bad Request` | `INVALID_RECURRENCE_DATE` | Ngày bắt đầu lặp trong quá khứ không hợp lệ. |
| `404 Not Found` | `BILL_NOT_FOUND` | Không tìm thấy hóa đơn. |
| `500 Internal Error`| `BACKGROUND_JOB_FAILED` | Lỗi khi Background Job tự động sinh giao dịch. |

---

## 5. Cấu trúc Response Chuẩn (Standard API Response)

### 5.1. Response Danh sách Hóa đơn (HTTP 200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy danh sách hóa đơn thành công",
  "data": [
    {
      "id": "bill-uuid-001",
      "name": "Tiền điện EVN",
      "amountMin": 1200000.00,
      "amountMax": 1800000.00,
      "repeatFrequency": "Monthly",
      "nextDueDate": "2026-09-25",
      "isPaidThisPeriod": true,
      "matchedTransactionId": "tj-uuid-evn-paid"
    }
  ],
  "errors": null,
  "timestamp": "2026-09-20T11:56:00Z"
}
```
