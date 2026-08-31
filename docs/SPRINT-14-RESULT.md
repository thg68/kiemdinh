# Sprint 14 - Ổn định mã minh chứng qua phiên bản

## Nguyên nhân gốc

Mỗi phiên bản bộ tiêu chuẩn tạo UUID mới cho cùng một mã tiêu chí, ví dụ
`1.1`. Bộ đếm cũ dùng khóa `(co_so_id, tieu_chi_id)`, nên khi năm học chuyển
sang phiên bản mới, dãy số bị bắt đầu lại và có thể cấp trùng
`MC.1.1.01`.

## Quyết định kiến trúc

- UUID xác định đúng bản ghi tiêu chí của một phiên bản pháp lý.
- `ma_tieu_chi` xác định dãy mã minh chứng dùng lâu dài trong một cơ sở.
- Bộ đếm vì vậy dùng khóa `(co_so_id, ma_tieu_chi)`.
- Năm học vẫn ghim `bo_tieu_chuan_id`; mọi liên kết nghiệp vụ tiếp tục dùng
  UUID tiêu chí để không trộn nội dung giữa các phiên bản.

## Migration

`035_sprint14_evidence_code_versioning.sql` thực hiện trong một transaction:

1. Suy ra `ma_tieu_chi` từ các UUID cũ.
2. Hợp nhất nhiều bộ đếm của cùng một mã tiêu chí.
3. Đối chiếu toàn bộ mã minh chứng hiện có và lấy số lớn nhất cộng một.
4. Đổi khóa chính của bộ đếm thành `(co_so_id, ma_tieu_chi)`.
5. Thay hàm sinh mã và siết RPC tạo, gắn, phân công tiêu chí.

RLS `bo_dem_same_tenant` và quyền chỉ đọc của `authenticated` được giữ
nguyên. Chỉ RPC `SECURITY DEFINER` nội bộ được gọi hàm sinh mã.

## Bảo vệ luồng ghi

- Tạo minh chứng từ chối toàn bộ request nếu có một tiêu chí không thuộc bộ
  tiêu chuẩn của năm học; bộ đếm chưa bị thay đổi.
- Gắn minh chứng từ chối tiêu chí khác phiên bản trước khi thêm bảng nối.
- Phân công kiểm tra toàn bộ danh sách trước khi xóa phân công cũ.
- Mảng rỗng ở RPC phân công vẫn có nghĩa là xóa toàn bộ phân công của người
  dùng trong năm học đó.

## Kiểm thử

`036_sprint14_evidence_code_versioning_test.sql` có 16 kiểm tra:

- V1 cấp `MC.1.1.01`, V2 tiếp tục cấp `MC.1.1.02`.
- Khi kho đã có mã import `MC.1.1.08`, mã kế tiếp là `MC.1.1.09`.
- Một cơ sở chỉ có một bộ đếm cho mã `1.1` qua nhiều phiên bản.
- Ba RPC từ chối UUID tiêu chí sai phiên bản.
- Phân công hợp lệ cũ không bị mất sau một request sai.

Kết quả local: 16/16 test Sprint 14 và 277/277 test database/RLS đều đạt.
Đối chiếu dữ liệu sau backfill cho kết quả 0 nhóm thiếu bộ đếm và 0 bộ đếm
đứng sau số lớn nhất trong kho.

## Phạm vi ảnh hưởng

- Kho minh chứng và form tạo minh chứng.
- Chức năng dùng lại/gắn thêm tiêu chí.
- Trang người dùng và phân quyền khi phân công tiêu chí.
- Không thay đổi nội dung tiêu chí, engine tính mức hoặc định dạng báo cáo.

## Triển khai

1. Sao lưu database trước migration.
2. Áp migration trên staging.
3. Chạy `npm run test:rls`.
4. Tạo thử minh chứng cho cùng mã tiêu chí ở hai năm học dùng hai phiên bản.
5. Chỉ áp production khi mã thứ hai tiếp tục dãy số và phân công cũ còn nguyên.
