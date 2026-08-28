# Kết quả Sprint 11

**Trạng thái triển khai mã nguồn: Hoàn tất**

**Trạng thái phát hành production: Chưa qua release gate**

## Đã hoàn thành

- Supabase browser client dùng singleton, loại nguyên nhân tạo nhiều GoTrueClient.
- Chuẩn hóa lỗi tiếng Việt; UI và API không đưa thẳng PostgREST, SQLSTATE, JWT hoặc stack trace cho người dùng.
- Bổ sung error boundary và structured logging chỉ ghi trường kỹ thuật trong danh sách cho phép, không ghi message, stack, token hoặc dữ liệu cá nhân.
- Điều hướng hiển thị theo vai trò; RLS/RPC vẫn là nguồn quyết định quyền duy nhất.
- Bổ sung skip link, nhãn/trạng thái form, thao tác bàn phím, focus, loading và disabled state.
- Khóa tràn ngang và kiểm tra responsive tại 320, 375, 768, 1024 và 1440 px.
- Tách cấu hình Cloudflare staging/production; bộ kiểm tra môi trường chặn staging dùng nhầm Supabase production.
- CI chạy lint, typecheck, coverage, build, migration/RLS, deploy staging và E2E; production có approval gate và workflow rollback.
- OpenNext build và Wrangler staging dry-run thành công với đúng các binding `ASSETS`, `IMAGES`, `WORKER_SELF_REFERENCE`.

## Kết quả xác minh ngày 2026-08-28

- `next build`: đạt; TypeScript và toàn bộ route prerender thành công.
- `npm run lint`: đạt, không có lỗi hoặc warning ESLint.
- `npm run test:coverage`: 12 tệp test, 57/57 test đạt; statement coverage 96,65%.
- Playwright công khai: 6/6 test đạt; không tràn ngang ở năm viewport và form đăng nhập thao tác được bằng bàn phím.
- E2E Giáo viên: bỏ qua có chủ đích vì máy chưa có credential staging.
- Bộ chặn staging: chấp nhận URL staging riêng và từ chối URL trùng production.
- OpenNext Cloudflare staging build: đạt.
- Wrangler staging dry-run: đạt; không triển khai ra Internet.
- Worker production hiện tại: HTTP 200 qua HTTPS, có HSTS và CSP.

## Release gate còn mở

- `npm run test:rls` chưa chạy local vì máy chưa có Docker Desktop/Podman; CI sẽ khởi động Supabase local và chạy toàn bộ pgTAP trước deploy staging.
- Cần cấu hình ba tài khoản E2E staging: Hiệu trưởng, Thư ký và Giáo viên.
- Custom domain `kdclgd.io.vn` vẫn lỗi phân giải DNS tại thời điểm kiểm tra.
- Cần xác nhận Supabase Site URL, redirect URLs và GitHub Environment required reviewers trong dashboard.

Không dùng cơ sở dữ liệu production cho automated test. Chỉ phát hành production khi toàn bộ release gate trên được xác nhận.
