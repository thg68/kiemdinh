# Sprint 13 - Khôi phục luồng ghi nghiệp vụ

## Nguyên nhân gốc

Bốn bảng nghiệp vụ đã có policy RLS theo đơn vị và vai trò nhưng role PostgreSQL
authenticated thiếu quyền INSERT, UPDATE, DELETE. Request vì vậy bị từ chối
trước khi RLS có thể đánh giá người dùng.

## Thay đổi

- Migration 034_sprint13_core_write_grants.sql cấp quyền DML cho
  ke_hoach_cai_tien, hoi_dong_tu_danh_gia, thanh_vien_hoi_dong và
  van_ban_lien_quan.
- Không thay đổi policy RLS hay ma trận vai trò hiện có.
- Thu hồi rõ ràng quyền DML của role anon.
- Không thay đổi frontend vì các màn hình đã gọi đúng bảng và thao tác.

## Kiểm thử hồi quy

File 035_sprint13_core_write_grants_test.sql kiểm tra:

- Hiệu trưởng tạo, sửa, xóa được kế hoạch và hội đồng trong đơn vị.
- Hiệu trưởng thêm, xóa được thành viên hội đồng trong đơn vị.
- Thư ký tạo, sửa, xóa được văn bản liên quan trong đơn vị.
- Giáo viên không sửa được kế hoạch, hội đồng, thành viên hoặc văn bản quản lý.
- Người dùng Tenant A không ghi được dữ liệu Tenant B.
- Role anon không có quyền ghi.

## Màn hình được khôi phục

- **Kế hoạch cải tiến**.
- **Hội đồng TĐG**.
- **Văn bản liên quan**.
- Phần dữ liệu Mẫu 2 đọc từ kế hoạch cải tiến.

## Triển khai

Áp dụng migration 034 trên staging trước, chạy npm run test:rls, sau đó mới đẩy
cùng migration lên production. Không cần sửa dữ liệu đã có.
