# TÀI LIỆU THIẾT KẾ UI/UX VÀ KIẾN TRÚC FRONTEND DÀNH CHO DỰ ÁN QUẢN LÝ TÀI CHÍNH CÁ NHÂN (PFM)
**Công nghệ:** React / Next.js (App Router), Tailwind CSS, **shadcn/ui** (Design System)  
**Tác giả:** Technical Lead, UI/UX Designer & Frontend Architect  
**Phiên bản:** 1.0 (Bao phủ đầy đủ 9 Module tương thích 100% với API Back-end)

---

## TỔNG QUAN KIẾN TRÚC FRONTEND & DESIGN SYSTEM (SHADCN/UI)

### 1. Nguyên tắc cốt lõi về UI/UX
- **Tối ưu số lần Click (Click Minimization):** Các tác vụ thường xuyên như *Tạo giao dịch*, *Chuyển tiền*, *Nạp hũ tiết kiệm* phải truy cập được trong 1-click từ bất kỳ đâu qua Nút Quick Action `+` trên Header/Floating Bar.
- **Thư viện UI chuẩn:** Sử dụng 100% linh hồn thiết kế của **shadcn/ui** (Radix UI Primitives + Tailwind CSS).
- **Phân định hiển thị Modal/Sheet/Page:**
  - `Full Page`: Dành cho các trang xem tổng quan, báo cáo, danh sách lớn cần không gian thao tác (`Data Table`).
  - `Sheet` (Drawer trượt từ bên phải): Dành cho các Form tạo mới/chỉnh sửa phức tạp có nhiều input (VD: Thêm giao dịch, Thêm tài khoản) để không làm mất ngữ cảnh (context) trang hiện tại.
  - `Dialog` (Modal popup ở giữa): Dành cho các form thao tác nhanh ít input (VD: Nạp/rút hũ tiết kiệm, Đổi mật khẩu, Thêm nhãn Tag).
  - `AlertDialog`: Bắt buộc dùng cho các hành động Destructive (Xóa giao dịch, Khóa tài khoản, Xóa ngân sách) với nút bấm màu đỏ (`variant="destructive"`).
  - `Popover / Command`: Dành cho Combobox tìm kiếm (Chọn danh mục, Chọn loại tiền, Tìm tài khoản).

---

## CHI TIẾT THIẾT KẾ DỰ ÁN DỰA TRÊN 9 MODULE HỆ THỐNG

---

### MODULE 01: XÁC THỰC & QUẢN LÝ NGƯỜI DÙNG (AUTH & USER PROFILE)

#### 1. Danh sách Màn hình chính (Pages & Layouts)
* **Routes:**
  * `/auth/login`: Màn hình Đăng nhập.
  * `/auth/register`: Màn hình Đăng ký tài khoản.
  * `/settings/profile`: Màn hình Hồ sơ cá nhân & Bảo mật (Thuộc Layout `/settings`).
* **Layout:**
  * **Auth Layout:** Cấu trúc 2 cột Split-Screen (Bên trái là Banner chuyển động giới thiệu PFM & Glassmorphism Card, bên phải là Form Auth căn giữa).
  * **Settings Layout:** Sidebar điều hướng phụ (Profile, Security, Preferences) bên trái, Main Content bên phải.

#### 2. Chi tiết các Form nhập liệu (Forms & Inputs)
* **Form Đăng ký / Đăng nhập (`/auth/register`, `/auth/login`):**
  * *Loại hiển thị:* **Full Page Form** nằm trong `Card` của shadcn để tạo sự tập trung tối đa cho người dùng.
  * *Các Fields:*
    * `Email`: `Input` (type="email", placeholder="user@example.com").
    * `FullName`: `Input` (type="text", placeholder="Nguyễn Văn A").
    * `Password`: `Input` (type="password" với toggle icon mắt 👁️ xem mật khẩu).
    * `ConfirmPassword`: `Input` (type="password").
    * `CurrencyCode`: `Select` (danh sách VND, USD, EUR... mặc định "VND").
* **Quy tắc Validate UI:**
  * Kiểm tra realtime qua `react-hook-form` + `zod`. Khi có lỗi, hiển thị `FormMessage` màu đỏ (`text-destructive`) dưới input, border input viền đỏ `border-destructive`.

#### 3. Tương tác & Cảnh báo (Interactions, Alerts & Feedbacks)
* **Destructive Action:** Đăng xuất khỏi thiết bị dùng `AlertDialog` xác nhận: *"Bạn có chắc chắn muốn đăng xuất?"*.
* **Toast Notification (Sonner):**
  * Success: *"Đăng nhập thành công! Chào mừng quay trở lại."*
  * Error: *"Email hoặc mật khẩu không chính xác."*
* **Loading & Empty State:** Nút `Button` có `Loader2` quay tròn khi submitting (`disabled={isLoading}`).

#### 4. Thành phần tái sử dụng (Reusable Components)
* `UserAvatar`: Component hiển thị Avatar người dùng kèm AvatarFallback chữ cái đầu.
* `PasswordInput`: Input mật khẩu tích hợp sẵn nút ẩn/hiện mật khẩu.

---

### MODULE 02: QUẢN LÝ TIỀN TỆ & TỶ GIÁ (CURRENCIES & EXCHANGE RATES)

#### 1. Danh sách Màn hình chính (Pages & Layouts)
* **Route:** `/settings/currencies`
* **Layout:** Thuộc `/settings` Layout. Cấu trúc `Tabs` của shadcn:
  * Tab 1: *Danh sách Tiền tệ* (Danh sách dạng `Card Grid` hoặc `Data Table`).
  * Tab 2: *Lịch sử Tỷ giá quy đổi* (`Data Table` kèm Filter theo ngày).
  * Tab 3: *Công cụ Quy đổi nhanh* (Currency Converter Card).

#### 2. Chi tiết các Form nhập liệu (Forms & Inputs)
* **Form Thêm Tiền tệ tùy chỉnh:**
  * *Loại hiển thị:* `Dialog` (Modal giữa màn hình).
  * *Fields:*
    * `Code`: `Input` (Mã ISO 3 ký tự, placeholder="JPY", uppercase).
    * `Name`: `Input` (placeholder="Yên Nhật").
    * `Symbol`: `Input` (placeholder="¥").
    * `DecimalPlaces`: `Input` (type="number", placeholder="0").
    * `Enabled`: `Switch` (Bật/Tắt sử dụng).
* **Form Cập nhật Tỷ giá quy đổi:**
  * *Loại hiển thị:* `Dialog`.
  * *Fields:*
    * `FromCurrencyId` & `ToCurrencyId`: `Select` chọn cặp tiền tệ.
    * `Rate`: `Input` (type="number", step="0.000001", placeholder="25450.5").
    * `Date`: `DatePicker` (Pop-up Calendar chọn ngày áp dụng).

#### 3. Tương tác & Cảnh báo
* **Toast (Sonner):** Bắn thông báo *"Đã cập nhật tỷ giá quy đổi USD -> VND thành công"*.
* **Quick Converter:** Component tự động tính kết quả ngay khi người dùng gõ số tiền (`onInputchange`).

#### 4. Thành phần tái sử dụng
* `CurrencyBadge`: Badge hiển thị mã tiền tệ kèm cờ quốc gia (VD: `[🇻🇳 VND]`, `[🇺🇸 USD]`).

---

### MODULE 03: QUẢN LÝ TÀI KHOẢN & VÍ TIỀN (ACCOUNTS & WALLETS)

#### 1. Danh sách Màn hình chính (Pages & Layouts)
* **Route:** `/accounts`
* **Layout:** Main Dashboard Layout.
* **Định hướng hiển thị:**
  * Phía trên: **KPI Cards** (Tổng tài sản ròng, Tổng nợ, Tổng tiền mặt).
  * Phía dưới: **Account Cards Grid** nhóm theo loại ví (*Asset Accounts*, *Expense Accounts*, *Revenue Accounts*). Mỗi Card hiển thị: Tên ví, Biểu tượng ngân hàng/Ví, Số dư hiện tại (đổi màu xanh/đỏ), và Nút Quick Action `...` (DropdownMenu).

#### 2. Chi tiết các Form nhập liệu (Forms & Inputs)
* **Form Thêm mới / Chỉnh sửa Ví:**
  * *Loại hiển thị:* **`Sheet` (Drawer trượt từ phải sang)** để có không gian nhập dữ liệu mà vẫn nhìn thấy danh sách ví bên dưới.
  * *Fields:*
    * `Name`: `Input` (placeholder="Tài khoản MB Bank", required).
    * `AccountTypeId`: `Select` (Ví tài sản Asset, Ví chi phí Expense, Ví thu nhập Revenue).
    * `CurrencyId`: `Select` (VND, USD...).
    * `OpeningBalance`: `Input` (Format tiền mặt, placeholder="10,000,000").
    * `IncludeInNetWorth`: `Switch` (Tính vào tổng tài sản ròng?).
    * `BankName` & `AccountNumber`: `Input` (Nhóm vào Collapsible mở rộng nâng cao).
    * `Notes`: `Textarea`.

#### 3. Tương tác & Cảnh báo
* **Destructive Action:** Xóa ví tiền $\rightarrow$ `AlertDialog`: *"Lưu ý: Ví này có 45 giao dịch. Xóa ví sẽ ẩn ví khỏi danh sách nhưng lịch sử giao dịch vẫn được giữ nguyên."* (Confirm text: "Tắt hoạt động ví").
* **Skeleton Loading:** 6 hình chữ nhật `Skeleton` nhấp nháy dạng Card trong lúc tải danh sách ví.

#### 4. Thành phần tái sử dụng
* `AccountCard`: Card hiển thị ví tiền đẹp mắt với màu gradient theo loại ví.
* `AccountSelect`: Component Combobox tìm kiếm tài khoản/ví tích hợp sẵn icon.

---

### MODULE 04: QUẢN LÝ GIAO DỊCH LÕI - KẾ TOÁN KÉP (TRANSACTIONS CORE)

#### 1. Danh sách Màn hình chính (Pages & Layouts)
* **Route:** `/transactions`
* **Layout:** Main Dashboard Layout.
* **Định hướng hiển thị:**
  * Bộ lọc trên cùng (`Filter Bar`): `DateRangePicker` (Chọn khoảng ngày), `Combobox` (Chọn Ví), `Combobox` (Chọn Danh mục), `Select` (Loại giao dịch: Chi tiêu, Thu nhập, Chuyển khoản).
  * Main Content: **`Data Table` của shadcn** (Tích hợp TanStack Table):
    * Cột 1: Ngày hoàn thành (Date).
    * Cột 2: Diễn giải & Tags (`Badge`).
    * Cột 3: Nguồn $\rightarrow$ Đích (Ví dụ: `Ví Tiền mặt` $\rightarrow$ `Siêu thị VinMart`).
    * Cột 4: Danh mục (`CategoryBadge`).
    * Cột 5: Số tiền (Hiển thị màu Đỏ `-150.000 ₫` cho Chi tiêu, màu Xanh `+5.000.000 ₫` cho Thu nhập).
    * Cột 6: Actions (`DropdownMenu`: Xem chi tiết, Sửa, Xóa).

#### 2. Chi tiết các Form nhập liệu (Forms & Inputs)
* **Form Tạo mới Giao dịch (Quick Add Transaction):**
  * *Loại hiển thị:* **`Sheet` (Trượt từ bên phải)** HOẶC bấm phím tắt `Ctrl + K` / Nút `+` Floating.
  * *Tabs Selector:* `TabsList` trên đầu Form chọn loại giao dịch: **[ Chi tiêu (Withdrawal) | Thu nhập (Deposit) | Chuyển khoản (Transfer) ]**.
  * *Fields cho Chi tiêu (Withdrawal):*
    * `Amount`: `Input` lớn (Font size to 24px, auto-format định dạng tiền tệ realtime).
    * `Description`: `Input` (placeholder="Mua sắm thực phẩm tuần").
    * `SourceAccountId`: `Combobox` (Chọn ví chi tiền: Ví Tiền mặt, Thẻ tín dụng...).
    * `DestinationAccountName`: `Combobox` tự động gợi ý nơi chi tiêu (VD: VinMart, Shopee, Grab).
    * `CategoryId`: `Combobox` chọn cây danh mục Thu/Chi kèm icon.
    * `BudgetId`: `Select` (Gắn vào Ngân sách tháng này - Không bắt buộc).
    * `Date`: `DatePicker` (Mặc định Hôm nay).
    * `Tags`: `BadgeGroup` tích hợp Input gõ Enter để thêm Tag.
    * `Notes`: `Textarea`.

#### 3. Tương tác & Cảnh báo
* **Destructive Action:** Xóa giao dịch $\rightarrow$ `AlertDialog` cảnh báo: *"Số tiền 500.000 ₫ sẽ được hoàn lại vào Ví Tiền mặt. Bạn có chắc chắn muốn xóa giao dịch này?"*.
* **Empty State:** `EmptyState` component hiển thị hình minh họa ví tiền rỗng kèm nút Call to Action: `+ Tạo giao dịch đầu tiên`.

#### 4. Thành phần tái sử dụng
* `TransactionTypeBadge`: Badge phân loại (Chi tiêu: Đỏ, Thu nhập: Xanh lá, Chuyển khoản: Xanh dương).
* `AmountFormatter`: Component tự động định dạng số tiền kèm màu sắc và đơn vị tiền tệ.

---

### MODULE 05: DANH MỤC & NHÃN GIAO DỊCH (CATEGORIES & TAGS)

#### 1. Danh sách Màn hình chính (Pages & Layouts)
* **Route:** `/categories`
* **Layout:** Main Layout.
* **Định hướng hiển thị:** Sử dụng Cấu trúc `Tabs`:
  * Tab 1: *Cây Danh mục Thu/Chi* (`Accordion` hoặc `Tree View` phân cấp Danh mục Cha - Danh mục Con, hiển thị Color Picker Badge & Icon).
  * Tab 2: *Quản lý Nhãn (Tags)* (`Card Grid` hoặc `Data Table` hiển thị tên Tag, Mô tả, và Số lượng giao dịch liên quan).

#### 2. Chi tiết các Form nhập liệu (Forms & Inputs)
* **Form Thêm Danh mục mới:**
  * *Loại hiển thị:* `Dialog` (Popup trung tâm).
  * *Fields:*
    * `Name`: `Input` (placeholder="Ăn uống").
    * `ParentId`: `Select` (Chọn danh mục cha nếu là danh mục con).
    * `Type`: `RadioGroup` (Chi tiêu | Thu nhập).
    * `Color`: `Popover` chứa Bảng chọn màu Hex / Presets color.
    * `Icon`: `Popover` tìm kiếm Icon Lucide (Ví dụ: 🍔 `utensils`, 🚗 `car`).
* **Form Thêm Tag mới:**
  * *Loại hiển thị:* `Dialog`.
  * *Fields:* `Tag` (Tên tag), `Description` (Mô tả ngắn), `DateFrom` & `DateTo` (`DatePicker`).

#### 3. Thành phần tái sử dụng
* `CategoryIcon`: Component hiển thị icon danh mục trong khung tròn có màu nền nhạt (`bg-color/10`).

---

### MODULE 06: QUẢN LÝ NGÂN SÁCH CHI TIÊU (BUDGETS)

#### 1. Danh sách Màn hình chính (Pages & Layouts)
* **Route:** `/budgets`
* **Layout:** Main Layout.
* **Định hướng hiển thị:** **Progress Dashboard Layout**:
  * Phía trên: Bộ lọc Tháng/Năm (`MonthPicker`).
  * Danh sách Ngân sách dưới dạng `Grid Card`. Mỗi Card hiển thị:
    * Tên ngân sách & Hạn mức (VD: *Ăn uống - Hạn mức: 5.000.000 ₫*).
    * **`Progress` bar của shadcn**: Đã chi `3.800.000 ₫` (76%).
    * Thanh Progress đổi màu thông minh: Xanh lá (<70%), Vàng cam (70-90%), Đỏ rực (>90% hoặc Vượt hạn mức `Overspent`).
    * Số tiền còn lại được phép chi tiêu (`RemainingAmount`).

#### 2. Chi tiết các Form nhập liệu (Forms & Inputs)
* **Form Thiết lập Ngân sách mới:**
  * *Loại hiển thị:* `Sheet` hoặc `Dialog`.
  * *Fields:*
    * `Name`: `Input` (placeholder="Ngân sách Mua sắm").
    * `LimitAmount`: `Input` (Format tiền mặt, placeholder="3,000,000").
    * `Period`: `Select` (Hàng tháng `Monthly`, Hàng tuần `Weekly`).
    * `Start` & `End`: `DateRangePicker`.

#### 3. Tương tác & Cảnh báo
* **Badge Trạng thái:** `Badge` hiển thị trạng thái `[Normal]` (Bình thường), `[Warning]` (Sắp chạm ngưỡng), `[Overspent]` (Đã vượt ngân sách).

---

### MODULE 07: HÓA ĐƠN & GIAO DỊCH ĐỊNH KỲ (BILLS & RECURRENCES)

#### 1. Danh sách Màn hình chính (Pages & Layouts)
* **Route:** `/bills`
* **Layout:** Main Layout. `Tabs`:
  * Tab 1: *Hóa đơn sắp tới (Bills)*: Hiển thị dạng `Timeline List` các khoản tiền cố định sắp đến hạn (Tiền điện, Tiền nhà, Internet).
  * Tab 2: *Lịch giao dịch lặp lại (Recurrences)*: `Data Table` hiển thị các quy tắc tự động sinh giao dịch (Lương hàng tháng, Tiền trả góp).

#### 2. Chi tiết các Form nhập liệu (Forms & Inputs)
* **Form Tạo Hóa đơn / Lịch lặp:**
  * *Loại hiển thị:* `Sheet` (Trượt từ phải sang).
  * *Fields:*
    * `Name` / `Title`: `Input` (placeholder="Tiền điện sinh hoạt").
    * `AmountMin` & `AmountMax`: `Input` (Khoảng tiền dự kiến).
    * `RepeatFrequency`: `Select` (Hàng tháng `Monthly`, Hàng năm `Yearly`).
    * `Date` / `FirstDate`: `DatePicker` (Ngày đến hạn hàng tháng).
    * `SourceAccountId` & `DestinationAccountId`: `Combobox`.

#### 3. Tương tác & Cảnh báo
* **Badge Trạng thái Hóa đơn:**
  * `[Đã thanh toán]` (Badge xanh lá kèm checkicon).
  * `[Chưa thanh toán - Còn 3 ngày]` (Badge màu cam).
  * `[Quá hạn]` (Badge màu đỏ mờ nhấp nháy).

---

### MODULE 08: HŨ TIẾT KIỆM & MỤC TIÊU (PIGGY BANKS)

#### 1. Danh sách Màn hình chính (Pages & Layouts)
* **Route:** `/piggy-banks`
* **Layout:** Main Layout.
* **Định hướng hiển thị:** `Card Grid` phong cách **Goal Tracker Cards**:
  * Mỗi Hũ tiết kiệm (VD: *Mua Laptop mới*, *Quỹ Du lịch*) hiển thị:
    * Hình ảnh/Icon mục tiêu.
    * `Progress` bar tròn hoặc ngang hiển thị % hoàn thành (VD: `15.000.000 / 30.000.000 ₫ (50%)`).
    * Dòng chữ gợi ý UX: *"Bạn nên nạp 2.500.000 ₫ / tháng để đạt mục tiêu vào tháng 12/2026"*.
    * 2 Nút Quick Action: `[+ Nạp tiền]` (Button primary) và `[- Rút tiền]` (Button outline).

#### 2. Chi tiết các Form nhập liệu (Forms & Inputs)
* **Form Nạp / Rút tiền Hũ tiết kiệm:**
  * *Loại hiển thị:* **`Dialog` (Popup gọn gàng giữa màn hình)**.
  * *Fields:*
    * `Action`: `RadioGroup` dạng Segmented Control ([ 📥 Nạp tiền | 📤 Rút tiền ]).
    * `Amount`: `Input` (Số tiền nạp/rút).
    * `Notes`: `Input` (Ghi chú lý do).

#### 3. Tương tác & Cảnh báo
* **Toast Notification (Sonner):** Bắn hiệu ứng chúc mừng khi thanh Progress đạt 100%: *"🎉 Chúc mừng! Bạn đã hoàn thành mục tiêu tiết kiệm Mua Laptop mới!"*.

---

### MODULE 09: BÁO CÁO & THỐNG KÊ TÀI CHÍNH (STATISTICS & REPORTS)

#### 1. Danh sách Màn hình chính (Pages & Layouts)
* **Route:** `/statistics`
* **Layout:** Executive Dashboard Layout.
* **Định hướng hiển thị:**
  * Header Filter: `DateRangePicker` (Chọn khoảng thời gian báo cáo) + `Select` (Chọn đơn vị tiền tệ).
  * **Hàng 1 (KPI Metrics Cards):** 4 Cards gồm *Tổng Thu nhập*, *Tổng Chi tiêu*, *Dòng tiền ròng (Net Cashflow)*, *Tổng Tài sản ròng (Net Worth)*.
  * **Hàng 2 (Chart Visualizations):**
    * Bên trái: Biểu đồ đường/cột `AreaChart` / `BarChart` (Recharts / Tremor) hiển thị *Xu hướng Dòng tiền Thu/Chi*.
    * Bên phải: Biểu đồ tròn `PieChart` / `DonutChart` hiển thị *Cơ cấu Chi tiêu theo Danh mục (%)*.
  * **Hàng 3 (Detailed Category Breakdown Table):** `Data Table` chi tiết từng danh mục, số tiền chi và thanh phần trăm so với tổng chi tiêu.

#### 2. Thành phần tái sử dụng
* `StatCard`: Card hiển thị con số thống kê lớn kèm chỉ số phần trăm tăng/giảm so với kỳ trước (`[+12% vs tháng trước]`).
* `ChartContainer`: Reusable wrapper cho biểu đồ tương thích với hệ màu Tailwind CSS & Dark Mode.

---

## BẢNG TỔNG HỢP QUY TẮC SỬ DỤNG COMPONENT SHADCN/UI TRONG HỆ THỐNG

| Thành phần UI | Linh kiện shadcn/ui sử dụng | Ngữ cảnh áp dụng |
| :--- | :--- | :--- |
| **Bảng dữ liệu lớn** | `DataTable` (TanStack Table) | Danh sách giao dịch, Lịch sử tỷ giá, Lịch lặp định kỳ |
| **Form chi tiết / Nhiều trường** | `Sheet` (Slide-over Drawer) | Form Thêm/Sửa Giao dịch, Ví tiền, Hóa đơn định kỳ |
| **Form ngắn / Thao tác nhanh** | `Dialog` (Modal Window) | Nạp/Rút hũ tiết kiệm, Thêm Tag, Thêm Danh mục |
| **Hành động nguy hiểm / Xóa** | `AlertDialog` | Xóa giao dịch, Khóa ví tiền, Xóa ngân sách |
| **Tìm kiếm & Chọn dữ liệu** | `Command` + `Popover` (Combobox) | Chọn Danh mục Thu/Chi, Chọn Ví nguồn/Ví đích |
| **Chọn ngày / Khoảng ngày** | `Calendar` + `Popover` (`DatePicker`) | Chọn ngày giao dịch, Chọn khoảng thời gian báo cáo |
| **Thông báo hệ thống** | `Sonner` (Toast) | Báo thành công khi Lưu/Xóa/Thêm mới thành công |
| **Trạng thái tải dữ liệu** | `Skeleton` | Hiển thị khung xương nhấp nháy khi đang fetch API |
