# Kết quả Sprint 10

**Trạng thái: Partial**

Phần mã nguồn và cổng CI đã hoàn thành. Hai lớp cần hạ tầng ngoài repo chưa được đánh dấu pass trên máy này: pgTAP cần Docker và E2E cần ba tài khoản staging.

## Completed

- Thêm ma trận pgTAP cho 7 vai trò, 12 quyền và hai tenant.
- Kiểm tra tấn công chéo tenant bằng UUID biết trước trên minh chứng, báo cáo và nhật ký.
- Thêm integration test cho signed URL, audit bắt buộc và API xuất báo cáo.
- Sửa API báo cáo trả đúng `401`/`403` thay vì gom lỗi thiếu quyền thành `500`.
- Bổ sung kiểm thử engine cho dữ liệu rỗng, tiêu chí/minh chứng trùng và trường nhiều cấp.
- Sinh rồi đọc ngược DOCX, XLSX và ZIP để kiểm tra nội dung/metadata.
- Thêm Playwright cho Hiệu trưởng, Thư ký Hội đồng và Giáo viên.
- Thêm GitHub Actions chặn merge bằng application, database-security và e2e-staging.

## Verification

- `npm run lint`: pass.
- `npm run typecheck`: pass sau khi sinh route types bằng Next 16.
- `npm run build`: pass, 28 route động.
- `npm test`: 47/47 pass.
- `npm run test:coverage`: pass với kết quả:
  - Tổng thể: statements 96,63%, branches 76,16%, functions 97,50%, lines 97,26%.
  - Engine: statements 97,77%, branches 91,52%, functions 100%, lines 97,43%.
  - Route báo cáo: statements 100%, branches 90,90%, functions 100%, lines 100%.
- `npx playwright test --list`: nhận đủ 4 kịch bản trong 1 file.

## Blocked

- `npm run test:rls`: chưa chạy tại máy này vì không có lệnh/Docker Engine. CI đã có job khởi động Supabase, replay migration sạch và chạy toàn bộ pgTAP.
- E2E thật: chưa chạy vì phiên làm việc không có `E2E_BASE_URL` và tài khoản staging theo vai trò. CI được cấu hình fail nếu thiếu secret, không âm thầm bỏ qua.

## Security

- Không thêm service-role key vào runtime hoặc test E2E.
- Không tắt RLS.
- Signed URL vẫn có thời hạn và chỉ được trả sau khi audit thành công.
- File xuất đặt `Cache-Control: no-store`.
- SQL test xác nhận SYSTEM_ADMIN không tự có quyền đọc dữ liệu nghiệp vụ tenant.

## Việc cần làm để chuyển sang Complete
