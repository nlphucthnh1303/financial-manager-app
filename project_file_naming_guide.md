# Gợi ý tên file cho Tài liệu Thiết kế & Chức năng Hệ thống

Dựa trên danh sách 22 tính năng chi tiết và bộ 47 bảng CSDL của Firefly III mà bạn đang triển khai, dưới đây là các gợi ý đặt tên file (cho tài liệu, đặc tả yêu cầu, hoặc file tổng hợp) tùy theo phong cách quản lý dự án của bạn:

## 1. Phong cách tiếng Anh chuẩn kỹ thuật (Khuyên dùng cho dev/lập trình)
*   `system-features-spec.md` (Đặc tả chi tiết toàn bộ tính năng hệ thống)
*   `firefly-pfm-features.md` (Danh sách tính năng hệ thống PFM tích hợp 47 bảng)
*   `functional-requirements.md` (Yêu cầu chức năng)

## 2. Phong cách tiếng Việt rõ ràng, dễ quản lý trên Notion/GitHub
*   `Danh_Sach_Chuc_Nang_He_Thong.md`
*   `Tai_Lieu_dac_ta_47_bang.md`
*   `Kien_Truc_Tai_Chinh_Ca_Nhan.md`

## 3. Gợi ý chia nhỏ theo Module (Nếu bạn muốn tách file cho từng nhóm chức năng)
Nếu bạn dùng các công cụ như Notion, Obsidian hoặc GitHub Wiki, bạn có thể tạo một thư mục `docs/` và đặt tên các file theo từng module như sau:
*   `docs/01-auth-users.md` (Module Quản lý người dùng & Bảo mật)
*   `docs/02-currencies.md` (Module Đa tiền tệ & Tỷ giá)
*   `docs/03-accounts.md` (Module Tài khoản & Ví)
*   `docs/04-transactions.md` (Module Giao dịch cốt lõi & Kế toán kép)
*   `docs/05-categories-tags.md` (Module Phân loại, Thẻ & GPS)
*   `docs/06-budgets.md` (Module Ngân sách & Hạn mức)
*   `docs/07-bills-recurrences.md` (Module Hóa đơn & Giao dịch định kỳ)
*   `docs/08-piggy-banks.md` (Module Hũ tiết kiệm)
*   `docs/09-statistics.md` (Module Báo cáo & Thống kê)

Bạn có thể chọn tên file ngắn gọn như **`system-features-spec.md`** nếu muốn lưu toàn bộ nội dung này vào project .NET của mình dưới dạng tài liệu Markdown (`README` hoặc thư mục `docs`).