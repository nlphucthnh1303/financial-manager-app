# Module 06: Ngân sách & Hạn mức (Budgets & Limits)

## 1. Tổng quan Kiến trúc Module (Module Overview)

### 1.1. Vai trò của Module
Module Ngân sách (Budgets) cho phép người dùng lập kế hoạch kiểm soát chi tiêu bằng cách thiết lập **Hạn mức Chi tiêu (Spending Limits)** cho từng nhóm danh mục hoặc mục đích trong các chu kỳ thời gian cố định (Hàng tuần, Hàng tháng, Hàng năm hoặc Khoảng thời gian tùy chỉnh).

Module liên tục theo dõi tiến độ chi tiêu thực tế từ các giao dịch `Withdrawal` trong Module 04, tự động tính toán **Số tiền đã tiêu (Spent)**, **Số tiền còn lại (Remaining)** và **Tỷ lệ phần trăm đã sử dụng (%)**, đồng thời gửi cảnh báo khi người dùng sắp vượt quá hoặc đã vượt quá ngân sách đề ra.

### 1.2. Danh sách các bảng Database (PostgreSQL Schema)
Module này sử dụng 3 bảng CSDL chính trong Firefly III:

| Tên bảng | Vai trò & Mô tả | Mối quan hệ (Relationships) |
| :--- | :--- | :--- |
| `budgets` | Bảng danh mục các ngân sách (Tên ngân sách, Thứ tự hiển thị, Auto-budget settings). | 1-n với `budget_limits`, 1-n với `budget_transaction_journal`, 1-n với `transaction_journals`. |
| `budget_limits` | Hạn mức chi tiêu cụ thể gắn liền với ngân sách theo chu kỳ thời gian (Ngày bắt đầu, Ngày kết thúc, Số tiền hạn mức). | n-1 với `budgets` (`budget_id`). |
| `budget_transaction_journal`| Bảng liên kết trung gian ghi nhận số tiền của từng giao dịch được gán vào hạn mức ngân sách nào. | FK `budget_limit_id` và `transaction_journal_id`. |

#### Sơ đồ thực thể ERD:
```
  [budgets] 1 --- n [budget_limits]
  [budgets] 1 --- n [transaction_journals]
  [budget_limits] 1 --- n [budget_transaction_journal] n --- 1 [transaction_journals]
```

---

## 2. Chi tiết Giao diện & Form (UI/UX & Forms)

### 2.1. Màn hình Dashboard Ngân sách (`ScreenBudgetDashboard`)
* **Mô tả**: Hiển thị danh sách các ngân sách của tháng hiện tại với thanh tiến độ Progress Bar sinh động (Xanh: <80%, Vàng: 80%-100%, Đỏ: >100% vỡ ngân sách), tổng hạn mức và tổng thực chi.

### 2.2. Form Tạo / Chỉnh sửa Ngân sách (`FormBudget`)
* **Tên Form**: `FormBudget`
* **Mô tả**: Tạo tên ngân sách mới (e.g. `Ngân sách Ăn uống T9/2026`).

| Label (Hiển thị) | Payload Key | Type | Trạng thái | UI Validation Logic |
| :--- | :--- | :--- | :--- | :--- |
| Tên Ngân sách | `name` | Text | Bắt buộc | Length: 2 - 100 ký tự. Không được để trống. |
| Danh mục áp dụng | `categoryIds` | MultiSelect | Tùy chọn | Danh sách ID danh mục thuộc ngân sách này. |
| Tự động gia hạn | `autoRenewal` | Checkbox | Bắt buộc | Boolean (`true`/`false`). Mặc định `true`. |

### 2.3. Form Thiết lập Hạn mức Ngân sách (`FormBudgetLimit`)
* **Tên Form**: `FormBudgetLimit`
* **Mô tả**: Đặt số tiền hạn mức và thời gian hiệu lực cho ngân sách.

| Label (Hiển thị) | Payload Key | Type | Trạng thái | UI Validation Logic |
| :--- | :--- | :--- | :--- | :--- |
| Ngân sách | `budgetId` | Select | Bắt buộc | Select từ danh sách `budgets`. |
| Chu kỳ áp dụng | `period` | Select | Bắt buộc | Enum: `Monthly`, `Weekly`, `Yearly`, `Custom`. Mặc định `Monthly`. |
| Hạn mức số tiền | `amount` | Number (Decimal)| Bắt buộc | Số thực dương > 0 (e.g. `5000000.00`). |
| Ngày bắt đầu | `start` | Date | Bắt buộc | Format `YYYY-MM-DD`. |
| Ngày kết thúc | `end` | Date | Bắt buộc | Format `YYYY-MM-DD`. Phải `>= start`. |

---

## 3. Thiết kế RESTful API (API Design)

### 3.1. GET `/api/v1/budgets/status`
* **Mô tả**: Lấy danh sách ngân sách kèm trạng thái tiến độ chi tiêu thực tế trong khoảng thời gian.
* **Authorization**: Bearer Token.
* **Query Parameters**: `?start=2026-09-01&end=2026-09-30`
* **Business Rules (Backend)**:
  1. Lấy tất cả `budgets` của `user_id`.
  2. Lấy `budget_limits` tương ứng trong khoảng `start` và `end`.
  3. Tính tổng thực chi `spentAmount` = SUM(`transactions.amount`) từ các giao dịch chi tiêu (`Withdrawal`) thuộc các danh mục hoặc được gắn trực tiếp `budget_id` trong khoảng thời gian này.
  4. Tính `remainingAmount = limitAmount - spentAmount` và `percentage = (spentAmount / limitAmount) * 100`.
* **Database Operations**:
  - `SELECT b.id, b.name, bl.amount AS limit_amount, COALESCE(SUM(ABS(t.amount)), 0) AS spent_amount FROM budgets b JOIN budget_limits bl ON b.id = bl.budget_id LEFT JOIN transaction_journals tj ON tj.budget_id = b.id JOIN transactions t ON t.transaction_journal_id = tj.id WHERE tj.completed_at BETWEEN @Start AND @End GROUP BY b.id, bl.amount`

### 3.2. POST `/api/v1/budgets`
* **Mô tả**: Tạo ngân sách mới kèm hạn mức ban đầu.
* **Authorization**: Bearer Token.
* **Request Payload**:
```json
{
  "name": "Ngân sách Ăn uống & Tiệc tùng",
  "categoryIds": ["cat-uuid-an-uong", "cat-uuid-ca-phe"],
  "limitAmount": 6000000.00,
  "period": "Monthly",
  "start": "2026-09-01",
  "end": "2026-09-30"
}
```
* **Business Rules (Backend)**:
  1. Thêm bản ghi `budgets`.
  2. Thêm bản ghi `budget_limits` tương ứng với số tiền `limitAmount` và ngày `start`, `end`.
* **Transaction**: **CÓ** (DB Transaction cho `budgets` và `budget_limits`).

---

## 4. Xử lý Lỗi & Exception Handling

| Mã HTTP | Mã lỗi Nội bộ (ErrorCode) | Nguyên nhân & Ngữ cảnh |
| :--- | :--- | :--- |
| `400 Bad Request` | `INVALID_BUDGET_LIMIT` | Số tiền hạn mức <= 0. |
| `400 Bad Request` | `INVALID_BUDGET_DATES` | Ngày bắt đầu lớn hơn ngày kết thúc. |
| `404 Not Found` | `BUDGET_NOT_FOUND` | Không tìm thấy ngân sách. |
| `409 Conflict` | `BUDGET_LIMIT_OVERLAP` | Đã tồn tại hạn mức cho cùng ngân sách trong cùng khoảng thời gian. |

---

## 5. Cấu trúc Response Chuẩn (Standard API Response)

### 5.1. Response Trạng thái Ngân sách (HTTP 200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy trạng thái ngân sách thành công",
  "data": [
    {
      "budgetId": "budget-uuid-001",
      "budgetName": "Ngân sách Ăn uống & Tiệc tùng",
      "period": "Monthly",
      "startDate": "2026-09-01",
      "endDate": "2026-09-30",
      "limitAmount": 6000000.00,
      "spentAmount": 4250000.00,
      "remainingAmount": 1750000.00,
      "percentageSpent": 70.83,
      "status": "Normal"
    }
  ],
  "errors": null,
  "timestamp": "2026-09-20T11:55:00Z"
}
```
