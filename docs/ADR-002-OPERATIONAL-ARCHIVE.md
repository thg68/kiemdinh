# ADR-002: Lưu trữ thay vì xóa dữ liệu vận hành

## Quyết định

Kế hoạch cải tiến và văn bản liên quan được **lưu trữ (archive)** thay vì xóa cứng. Bản ghi lưu trữ không xuất hiện trong danh sách làm việc và báo cáo hiện hành, nhưng có thể được khôi phục bởi vai trò có quyền ghi.

## Lý do

- Giữ lịch sử đã từng dùng để chuẩn bị báo cáo của năm học.
- Tránh mất dữ liệu do thao tác nhầm.
- Cho phép nhật ký ghi rõ thời điểm lưu trữ và khôi phục mà không lưu nội dung nhạy cảm.

## Hệ quả

- Các truy vấn nghiệp vụ mặc định phải lọc `archived_at is null`.
- Màn hình quản lý có lựa chọn xem bản ghi đã lưu trữ và nút khôi phục.
- Không cung cấp thao tác xóa cứng trong giao diện người dùng.
