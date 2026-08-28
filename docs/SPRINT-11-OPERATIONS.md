# Sprint 11 - Vận hành staging và production

## 1. Môi trường tách biệt

Tạo hai GitHub Environments: `staging` và `production`. Production phải bật required reviewers.

Staging secrets:

- `STAGING_SUPABASE_URL`
- `STAGING_SUPABASE_ANON_KEY`
- `STAGING_APP_URL`
- `PRODUCTION_SUPABASE_URL` chỉ để kiểm tra chống dùng nhầm project
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- Ba cặp tài khoản `E2E_*_EMAIL/PASSWORD`, `E2E_YEAR_ID`

Production secrets:

- `PRODUCTION_SUPABASE_URL`
- `PRODUCTION_SUPABASE_ANON_KEY`
- `PRODUCTION_APP_URL`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

Không lưu `service_role`, JWT, mật khẩu hoặc dữ liệu cá nhân trong repository, build log hay Workers Logs.

## 2. Pipeline

Pull request chạy lint, typecheck, unit/coverage, build, replay migration, pgTAP và E2E trên staging hiện hành.

Push vào `main` chạy các cổng trên, deploy Worker `kiemdinh-app-staging`, sau đó chạy E2E theo vai trò.

Production chỉ triển khai bằng workflow `Production release and rollback`:

1. Chọn `deploy`.
2. Xác nhận đã sao lưu dữ liệu.
3. Nhập mã phiên bản/lý do.
4. Reviewer của GitHub Environment `production` phê duyệt.
5. Theo dõi Workers Logs và kiểm tra nhanh đăng nhập, minh chứng, tự đánh giá, báo cáo.

## 3. Rollback

Khi có lỗi nghiêm trọng:

1. Dừng thao tác ghi dữ liệu nếu lỗi liên quan schema hoặc quyền.
2. Mở workflow `Production release and rollback`, chọn `rollback`.
3. Nhập lý do và chờ reviewer production phê duyệt.
4. Workflow chạy `wrangler rollback --env production` để quay về phiên bản Worker trước.
5. Nếu có migration dữ liệu, không tự chạy migration ngược. Khôi phục theo bản sao lưu đã duyệt và chạy kiểm tra hậu triển khai.
6. Ghi thời điểm, nguyên nhân, phiên bản trước/sau và kết quả vào nhật ký phát hành.

## 4. Observability

`wrangler.jsonc` bật Workers Logs cho staging và production. Staging thu thập 100% request để kiểm thử; production lấy mẫu 20%.

Log ứng dụng chỉ ghi event, loại lỗi, route, status và mã đối tượng kỹ thuật. Không ghi error message, stack, header, JWT, secret, mật khẩu hoặc nội dung hồ sơ nhạy cảm.

Cảnh báo vận hành cần theo dõi:

- Tỷ lệ 5xx tăng bất thường.
- `report_api_error`, `evidence_audit_failed`, `evidence_signed_url_failed`.
- Uncaught exception trong Workers.
- E2E staging thất bại sau deploy.

## 5. Checklist cấu hình production

- [ ] Domain chính phân giải DNS và trả HTTPS hợp lệ.
- [x] Workers domain trả HTTPS, HSTS, CSP, X-Content-Type-Options và frame protection.
- [ ] Supabase Authentication Site URL bằng domain production.
- [ ] Redirect URLs gồm domain production và staging chính xác.
- [ ] Email confirmation/reset redirect về đúng `/login` hoặc `/quen-mat-khau`.
- [ ] OAuth callback được khai báo nếu sau này bật OAuth; hiện chưa có OAuth trong phạm vi.
- [x] CSP chỉ cho kết nối Supabase qua HTTPS/WSS.
- [ ] Kiểm tra CORS tại mọi dịch vụ ngoài Supabase nếu bổ sung; hiện chưa có integration ngoài.
- [ ] Bật required reviewers cho GitHub Environment production.
- [ ] Chạy UAT dữ liệu thật trước release gate Sprint 12.

## 6. Kiểm tra UI Sprint 11

Playwright kiểm tra không tràn ngang tại 320, 375, 768, 1024 và 1440 px. Kết quả công khai ngày 2026-08-28: 6/6 test đạt; test theo vai trò chỉ chạy khi có credential staging. Ba luồng theo vai trò tiếp tục kiểm tra RLS/API; menu chỉ giúp người dùng tập trung vào tác vụ phù hợp, không thay thế authorization ở database.
