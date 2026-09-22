# Module 09: Báo cáo & Thống kê (Statistics & Financial Reports)

## 1. Tổng quan Kiến trúc Module (Module Overview)

### 1.1. Vai trò của Module
Module Báo cáo & Thống kê (Statistics & Analytics Engine) có nhiệm vụ tổng hợp, phân tích và trực quan hóa dữ liệu tài chính của người dùng dưới dạng các biểu đồ thông minh, bảng phân tích xu hướng và báo cáo xuất file (PDF, Excel XLSX, CSV).

Module giúp người dùng trả lời các câu hỏi tài chính quan trọng:
- Tổng thu nhập và tổng chi tiêu tháng này là bao nhiêu? Cân đối dòng tiền (Net Cashflow) âm hay dương?
- Tài sản ròng (Net Worth) biến động như thế nào qua các tháng?
- Tiền của tôi đang tiêu nhiều nhất vào danh mục nào?
- Xu hướng chi tiêu tăng hay giảm so với các tháng trước?

### 1.2. Danh sách các bảng Database (PostgreSQL Schema)
Module này là **Module Truy vấn & Tổng hợp (Aggregation & Analytics Engine)**, chủ yếu đọc dữ liệu (Read-Heavy) thông qua các truy vấn tối ưu, PostgreSQL Views, và Materialized Views từ các bảng:

| Tên bảng / View | Vai trò & Mục đích sử dụng |
| :--- | :--- |
| `transaction_journals` | Đọc thông tin ngày, loại giao dịch, danh mục, ngân sách, user_id. |
| `transactions` | Tổng hợp số tiền Nợ/Có (Debit/Credit) theo từng tài khoản. |
| `accounts` | Phân loại tài sản (`Asset`), nợ (`Debt`), chi tiêu (`Expense`), thu nhập (`Revenue`). |
| `categories` | Gom nhóm tổng chi tiêu/thu nhập theo từng danh mục. |
| `currencies` & `currency_exchange_rates` | Quy đổi số tiền đa ngoại tệ về Tiền tệ Mặc định (Base Currency) trước khi aggregation. |

#### Sơ đồ Luồng Dữ liệu Aggregation (Data Pipeline):
```
  [transactions] + [transaction_journals]
         │
         ▼
  [Exchange Rate Conversion] (Chuyển đổi về Base Currency VND/USD)
         │
         ▼
  [Aggregation Engine / SQL Window Functions]
         │
         ▼
  [JSON Analytical Data Output] ──► (Front-end Recharts/Chart.js & PDF/XLSX Exporter)
```

---

## 2. Chi tiết Giao diện & Form (UI/UX & Forms)

### 2.1. Màn hình Tổng quan Báo cáo (`ScreenFinancialAnalytics`)
* **Mô tả**: Bảng điều khiển phân tích tổng hợp bao gồm:
  - Card chỉ số KPI: Tổng Thu nhập, Tổng Chi tiêu, Dòng tiền Thuần (Net Cashflow), Tài sản Ròng (Net Worth).
  - Biểu đồ Miền (Area Chart): Xu hướng Thu/Chi theo thời gian.
  - Biểu đồ Tròn (Donut Chart): Cơ cấu chi tiêu theo Danh mục.
  - Biểu đồ Cột (Bar Chart): So sánh Ngân sách và Chi tiêu thực tế.

### 2.2. Form Bộ lọc Báo cáo (`FormReportFilter`)
* **Tên Form**: `FormReportFilter`
* **Mô tả**: Thanh công cụ tùy chỉnh khoảng thời gian và tiêu chí phân tích báo cáo.

| Label (Hiển thị) | Payload Key | Type | Trạng thái | UI Validation Logic |
| :--- | :--- | :--- | :--- | :--- |
| Khoảng thời gian | `periodType` | Select | Bắt buộc | Enum: `ThisMonth`, `LastMonth`, `ThisYear`, `Custom`. |
| Từ ngày | `startDate` | Date | Bắt buộc | Format `YYYY-MM-DD`. |
| Đến ngày | `endDate` | Date | Bắt buộc | Format `YYYY-MM-DD`. Phải `>= startDate`. |
| Tiền tệ báo cáo | `currencyCode` | Select | Bắt buộc | Select từ danh sách `currencies` (Mặc định Base Currency của user). |
| Lọc theo Ví tiền | `accountIds` | MultiSelect | Tùy chọn | Lựa chọn một hoặc nhiều ví cụ thể. |

---

## 3. Thiết kế RESTful API (API Design)

### 3.1. GET `/api/v1/statistics/summary`
* **Mô tả**: Lấy các chỉ số KPI tài chính tổng quan (Tổng Thu, Tổng Chi, Net Cashflow, Net Worth).
* **Authorization**: Bearer Token.
* **Query Parameters**: `?startDate=2026-09-01&endDate=2026-09-30&currency=VND`
* **Database Operations**:
  - Thực hiện SQL SUM có quy đổi tỷ giá sang `currency` yêu cầu.

### 3.2. GET `/api/v1/statistics/cashflow-trend`
* **Mô tả**: Lấy dữ liệu chuỗi thời gian (Time-series data) cho biểu đồ Thu/Chi theo ngày hoặc theo tháng.
* **Authorization**: Bearer Token.
* **Query Parameters**: `?groupBy=Day&startDate=2026-09-01&endDate=2026-09-30`
* **Database Operations**:
  - `SELECT DATE(tj.completed_at) AS date, SUM(CASE WHEN tt.type = 'Deposit' THEN t.amount ELSE 0 END) AS income, SUM(CASE WHEN tt.type = 'Withdrawal' THEN ABS(t.amount) ELSE 0 END) AS expense FROM transaction_journals tj JOIN transactions t ON tj.id = t.transaction_journal_id JOIN transaction_types tt ON tj.transaction_type_id = tt.id WHERE tj.user_id = @UserId AND tj.completed_at BETWEEN @Start AND @End GROUP BY DATE(tj.completed_at) ORDER BY date ASC`

### 3.3. GET `/api/v1/statistics/category-breakdown`
* **Mô tả**: Lấy tỷ lệ % và tổng số tiền đã tiêu phân theo danh mục cho Biểu đồ Tròn.
* **Authorization**: Bearer Token.
* **Query Parameters**: `?type=Expense&startDate=2026-09-01&endDate=2026-09-30`
* **Database Operations**:
  - `SELECT c.id, c.name, c.color, c.icon, SUM(ABS(t.amount)) AS total_amount FROM categories c JOIN transaction_journals tj ON tj.category_id = c.id JOIN transactions t ON t.transaction_journal_id = tj.id WHERE tj.user_id = @UserId AND tj.completed_at BETWEEN @Start AND @End GROUP BY c.id, c.name, c.color, c.icon ORDER BY total_amount DESC`

### 3.4. GET `/api/v1/statistics/export`
* **Mô tả**: Xuất báo cáo tài chính ra file Excel (XLSX) hoặc PDF.
* **Authorization**: Bearer Token.
* **Query Parameters**: `?format=xlsx&startDate=2026-09-01&endDate=2026-09-30`
* **Response Output**: File Stream `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` hoặc `application/pdf`.

---

## 4. Xử lý Lỗi & Exception Handling

| Mã HTTP | Mã lỗi Nội bộ (ErrorCode) | Nguyên nhân & Ngữ cảnh |
| :--- | :--- | :--- |
| `400 Bad Request` | `INVALID_DATE_RANGE` | Ngày bắt đầu lớn hơn ngày kết thúc. |
| `400 Bad Request` | `UNSUPPORTED_EXPORT_FORMAT`| Định dạng xuất file không được hỗ trợ (chỉ chấp nhận `xlsx`, `pdf`, `csv`). |
| `500 Internal Error`| `REPORT_GENERATION_FAILED` | Lỗi trong quá trình render PDF hoặc ghi file Excel. |

---

## 5. Cấu trúc Response Chuẩn (Standard API Response)

### 5.1. Response Tóm tắt Chỉ số Tài chính (HTTP 200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy báo cáo thống kê thành công",
  "data": {
    "currency": "VND",
    "period": {
      "startDate": "2026-09-01",
      "endDate": "2026-09-30"
    },
    "kpi": {
      "totalIncome": 25000000.00,
      "totalExpense": 14250000.00,
      "netCashflow": 10750000.00,
      "currentNetWorth": 158400000.00
    },
    "categoryBreakdown": [
      {
        "categoryId": "cat-uuid-an-uong",
        "categoryName": "Ăn uống",
        "color": "#FF5733",
        "amount": 5400000.00,
        "percentage": 37.89
      },
      {
        "categoryId": "cat-uuid-nha-cua",
        "categoryName": "Nhà cửa & Hóa đơn",
        "color": "#3357FF",
        "amount": 4500000.00,
        "percentage": 31.58
      }
    ]
  },
  "errors": null,
  "timestamp": "2026-09-20T11:58:00Z"
}
```
