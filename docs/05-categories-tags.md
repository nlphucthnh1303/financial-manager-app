# Module 05: Phân loại, Thẻ & GPS (Categories, Tags & Locations)

## 1. Tổng quan Kiến trúc Module (Module Overview)

### 1.1. Vai trò của Module
Module này quản lý hệ thống Phân loại (Categories), Thẻ đánh dấu (Tags) và Vị trí địa lý (Locations/GPS) nhằm mục đích gắn nhãn, sắp xếp và trực quan hóa dữ liệu tài chính của người dùng theo nhiều chiều phân tích khác nhau.

- **Categories (Danh mục)**: Phân loại phân cấp (Cha - Con) đại diện cho lý do thu/chi (VD: `Ăn uống` -> `Nhà hàng`, `Cà phê`). Mỗi giao dịch thông thường thuộc về 1 Danh mục.
- **Tags (Thẻ)**: Từ khóa đa chiều cho phép gom nhóm các giao dịch xuyên suốt nhiều danh mục khác nhau theo sự kiện/dự án (VD: `#DuLichPhuQuoc2026` chứa các chi tiêu từ Danh mục `Vé máy bay`, `Khách sạn`, `Ăn uống`).
- **Locations / Geolocation**: Lưu thông tin vị trí địa lý (Vĩ độ, Kinh độ, Tên địa điểm, Địa chỉ) xảy ra giao dịch để hiển thị trên bản đồ tài chính (Spend Map).

### 1.2. Danh sách các bảng Database (PostgreSQL Schema)
Module này sử dụng 5 bảng CSDL chính:

| Tên bảng | Vai trò & Mô tả | Mối quan hệ (Relationships) |
| :--- | :--- | :--- |
| `categories` | Bảng lưu danh mục phân loại thu/chi (Tên, Icon, Màu sắc, ID danh mục cha `parent_id`). | 1-n với chính nó (Parent-Child hierarchy), 1-n với `transaction_journals`, 1-n với `category_meta`. |
| `category_meta` | Lưu các thuộc tính tùy biến của danh mục (e.g. `target_monthly_spend`, `display_order`). | n-1 với `categories`. |
| `tags` | Bảng lưu danh sách các thẻ tag (Tên tag, Mô tả, Ngày bắt đầu/kết thúc sự kiện). | n-n với `transaction_journals` qua `taggables`. |
| `taggables` | Bảng trung gian đa hình (Polymorphic mapping) giữa `tags` và `transaction_journals`. | FK `tag_id`, `taggable_id` (`transaction_journal_id`), `taggable_type`. |
| `journal_meta` / `locations`| Lưu vĩ độ (latitude), kinh độ (longitude), tên vị trí, địa chỉ giao dịch. | n-1 với `transaction_journals`. |

#### Sơ đồ thực thể ERD:
```
  [categories] (Parent) 1 --- n [categories] (Child)
  [categories]          1 --- n [transaction_journals]
  [tags]                n --- n [transaction_journals] (qua taggables)
  [journal_meta]        n --- 1 [transaction_journals]
```

---

## 2. Chi tiết Giao diện & Form (UI/UX & Forms)

### 2.1. Màn hình Quản lý Cây Danh mục (`ScreenCategoryManagement`)
* **Mô tả**: Hiển thị cây danh mục dạng cây (Tree view) phân biệt Thu nhập / Chi tiêu, icon màu sắc sinh động, hỗ trợ kéo thả sắp xếp thứ tự và tìm kiếm nhanh.

### 2.2. Form Tạo / Chỉnh sửa Danh mục (`FormCategory`)
* **Tên Form**: `FormCategory`
* **Mô tả**: Thêm mới hoặc chỉnh sửa danh mục chi tiêu/thu nhập.

| Label (Hiển thị) | Payload Key | Type | Trạng thái | UI Validation Logic |
| :--- | :--- | :--- | :--- | :--- |
| Tên danh mục | `name` | Text | Bắt buộc | Length: 2 - 100 ký tự. Không được bỏ trống. |
| Danh mục cha | `parentId` | Select | Tùy chọn | Chọn từ danh sách `categories` cùng User ID. Tránh chọn chính nó. |
| Biểu tượng (Icon) | `icon` | IconPicker | Bắt buộc | Chuỗi định danh icon (e.g. `utensils`, `car`, `home`). |
| Mã màu (Color) | `color` | ColorPicker| Bắt buộc | Hex Color Code (e.g. `#FF5733`). Regex `^#[0-9A-Fa-f]{6}$`. |
| Thuộc nhóm | `type` | Select | Bắt buộc | Enum: `Expense` (Chi tiêu), `Revenue` (Thu nhập). |

### 2.3. Form Quản lý Thẻ Tag (`FormTag`)
* **Tên Form**: `FormTag`
* **Mô tả**: Tạo thẻ tag sự kiện với mốc thời gian hoặc hạn mức dự toán riêng cho tag đó.

| Label (Hiển thị) | Payload Key | Type | Trạng thái | UI Validation Logic |
| :--- | :--- | :--- | :--- | :--- |
| Tên Thẻ Tag | `tag` | Text | Bắt buộc | Chuỗi ký tự liền hoặc nối gạch (e.g. `dulich-dalat-2026`). Regex `^[a-zA-Z0-9_\-]+$`. |
| Mô tả sự kiện | `description` | Textarea | Tùy chọn | Max 500 ký tự. |
| Ngày bắt đầu | `dateFrom` | Date | Tùy chọn | Format `YYYY-MM-DD`. |
| Ngày kết thúc | `dateTo` | Date | Tùy chọn | Format `YYYY-MM-DD`. Phải `>= dateFrom`. |

---

## 3. Thiết kế RESTful API (API Design)

### 3.1. GET `/api/v1/categories`
* **Mô tả**: Lấy danh sách danh mục theo cấu trúc Cây (Tree) hoặc Danh sách phẳng (Flat list).
* **Authorization**: Bearer Token.
* **Query Parameters**: `?tree=true&type=Expense`
* **Request Payload**: None.
* **Database Operations**:
  - `SELECT id, name, parent_id, icon, color FROM categories WHERE user_id = @UserId ORDER BY name ASC`

### 3.2. POST `/api/v1/categories`
* **Mô tả**: Tạo mới 1 danh mục.
* **Authorization**: Bearer Token.
* **Request Payload**:
```json
{
  "name": "Cà phê & Trà sữa",
  "parentId": "cat-uuid-an-uong",
  "icon": "coffee",
  "color": "#6F4E37",
  "type": "Expense"
}
```
* **Business Rules (Backend)**:
  1. Kiểm tra xem tên danh mục `name` đã tồn tại ở cùng cấp (cùng `parentId` và `user_id`) chưa. Nếu có -> Ném exception `CATEGORY_ALREADY_EXISTS`.
  2. Nếu có `parentId`, kiểm tra `parentId` có tồn tại và thuộc sở hữu của user không.
* **Database Operations**:
  - `INSERT INTO categories (id, user_id, parent_id, name, icon, color, created_at, updated_at) VALUES (...)`

### 3.3. GET `/api/v1/tags`
* **Mô tả**: Lấy danh sách tất cả các tag của người dùng kèm số lượng giao dịch đã dùng.
* **Authorization**: Bearer Token.
* **Database Operations**:
  - `SELECT t.id, t.tag, t.description, COUNT(tg.taggable_id) AS transaction_count FROM tags t LEFT JOIN taggables tg ON t.id = tg.tag_id WHERE t.user_id = @UserId GROUP BY t.id`

### 3.4. POST `/api/v1/tags`
* **Mô tả**: Tạo tag mới.
* **Authorization**: Bearer Token.
* **Request Payload**:
```json
{
  "tag": "dulich-phuquoc-2026",
  "description": "Chuyến đi nghỉ dưỡng hè Phú Quốc với gia đình",
  "dateFrom": "2026-07-10",
  "dateTo": "2026-07-15"
}
```

---

## 4. Xử lý Lỗi & Exception Handling

| Mã HTTP | Mã lỗi Nội bộ (ErrorCode) | Nguyên nhân & Ngữ cảnh |
| :--- | :--- | :--- |
| `400 Bad Request` | `CIRCULAR_CATEGORY_PARENT` | Đặt danh mục cha là chính nó hoặc con cháu của nó (Lỗi vòng lặp). |
| `400 Bad Request` | `INVALID_TAG_FORMAT` | Tên tag chứa khoảng trắng hoặc ký tự không hợp lệ. |
| `403 Forbidden` | `CATEGORY_ACCESS_DENIED` | Cố ý sửa/xóa danh mục của người dùng khác. |
| `404 Not Found` | `CATEGORY_NOT_FOUND` | Không tìm thấy mã danh mục. |
| `409 Conflict` | `CATEGORY_ALREADY_EXISTS` | Tên danh mục trùng lặp ở cùng một cấp. |

---

## 5. Cấu trúc Response Chuẩn (Standard API Response)

### 5.1. Response Cấu trúc Cây Danh mục (HTTP 200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy danh mục thành công",
  "data": [
    {
      "id": "cat-uuid-an-uong",
      "name": "Ăn uống",
      "icon": "utensils",
      "color": "#FF5733",
      "type": "Expense",
      "subCategories": [
        {
          "id": "cat-uuid-ca-phe",
          "name": "Cà phê & Trà sữa",
          "icon": "coffee",
          "color": "#6F4E37",
          "parentId": "cat-uuid-an-uong"
        }
      ]
    }
  ],
  "errors": null,
  "timestamp": "2026-09-20T11:54:00Z"
}
```
