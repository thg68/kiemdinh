# ADR-001 - Phê duyệt báo cáo và quyền hội đồng

## Trạng thái

Đã chấp nhận, dựa trên Phụ lục B do chủ dự án cung cấp.

## Quyết định

- Mẫu 1 và Mẫu 2 là hai artifact nghiệp vụ tham gia luồng bản nháp, chờ duyệt và phê duyệt.
- Danh mục minh chứng XLSX, gói minh chứng ZIP và dữ liệu năm học JSON là tệp xuất bổ trợ. Các tệp này không có trạng thái phê duyệt và không xuất hiện trong kho báo cáo chính thức.
- Hiệu trưởng/Giám đốc và Chủ tịch Hội đồng TĐG được quản lý hội đồng, thành viên và phê duyệt theo quyền tương ứng.
- Thư ký Hội đồng được đọc thông tin hội đồng để tổng hợp báo cáo, nhưng không được thêm, sửa hoặc xóa thành viên.
- Ủy viên được đọc thông tin hội đồng; Giáo viên, Khách và Quản trị hệ thống không đọc dữ liệu hội đồng của đơn vị nếu không có vai trò đơn vị phù hợp.

## Cơ chế bắt buộc

- PostgreSQL RLS kiểm tra `council.read` và `council.manage`; UI chỉ phản ánh cùng quyết định.
- Trigger DB từ chối lưu XLSX/ZIP/JSON vào bảng `bao_cao`, kể cả khi gọi trực tiếp API.
- Snapshot Mẫu 1/Mẫu 2 đã phê duyệt tiếp tục bất biến ở bảng nghiệp vụ và Storage.
