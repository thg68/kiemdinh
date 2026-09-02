# Biên bản triển khai staging Sprint 17

## Môi trường

- Thời điểm hoàn tất: 02/09/2026 (Asia/Saigon).
- Supabase staging: project ref `rsovmzolfyetvyhjkgjw`.
- Cloudflare Worker: `kiemdinh-app-staging`.
- URL: `https://kiemdinh-app-staging.thang-nh.workers.dev`.
- Version ID: `eb9830b5-af9f-43d4-97ac-1a783d882f76`.
- Production không được migrate hoặc deploy trong đợt này.

## Cơ sở dữ liệu

- Đã tạo backup schema và data trước migration trong thư mục local bị Git bỏ qua:
  `supabase/.temp/staging-pre-sprint17-schema.sql` và
  `supabase/.temp/staging-pre-sprint17-data.sql`.
- Đã áp dụng thành công migration `033` đến `038` trên staging.
- `supabase db lint --linked --level warning`: không có lỗi schema.
- Kiểm tra catalog từ xa: 4/4 đạt, gồm UNIQUE hội đồng, FK người phụ trách cùng
  đơn vị, quyền thừa trên quan hệ hiện hữu và default privileges của role
  migration `postgres`.
- Test pgTAP Sprint 17 local: 7/7 đạt.

## Ứng dụng và Cloudflare

- Script deploy nạp `.env.staging.local` xuyên suốt tiến trình build; bundle có
  Supabase staging và không có project ref Supabase production.
- Next.js 16 dùng `middleware.ts` để OpenNext đóng gói Edge Middleware. Đây là
  ngoại lệ tương thích có cảnh báo deprecation; chưa đổi lại `proxy.ts` cho đến
  khi adapter Cloudflare hỗ trợ Node.js Proxy.
- OpenNext build và upload 62 assets thành công.
- `GET /api/health`: HTTP 200, body `status=ok`, có `x-request-id` UUID v4.
- Workers Logs nhận sự kiện `LOGIN_FAILURE` dạng object theo allow-list.
- Log kiểm thử không có email, JWT, signed URL, tên tệp hay nội dung nghiệp vụ.
- Invocation logs đã tắt; chỉ custom logs có cấu trúc được lưu. Luồng debug
  `wrangler tail` chỉ được mở có kiểm soát trên staging.

## Ngoại lệ đã biết

Supabase CLI dùng role tạm khi chạy test từ xa nên không có quyền gọi pgTAP trong
schema `extensions` hoặc đọc trực tiếp bảng nghiệp vụ. Vì vậy hậu kiểm từ xa dùng
TAP thuần trên catalog; test ghi dữ liệu và RLS vẫn chạy trên Supabase local.

Supabase hosted duy trì default ACL riêng cho role nội bộ `supabase_admin`, và role
migration của dự án không được phép thay đổi ACL đó. Migration `038` đã thu hồi
quyền trên mọi quan hệ `public` hiện hữu và trên default ACL của `postgres`, là
owner tạo bảng ứng dụng. Nếu nhà cung cấp tạo quan hệ mới trong `public` bằng
`supabase_admin`, phải chạy lại truy vấn audit quyền trước khi cho ứng dụng dùng
quan hệ đó.

## Điều kiện trước production

1. Chọn người hoặc kênh nhận Cloudflare Notifications.
2. Tạo Saved Query cho ba `alertType` trong tài liệu vận hành.
3. Kiểm thử có kiểm soát lỗi Storage và lỗi xuất báo cáo trên staging.
4. Xác nhận backup có thể khôi phục trong cửa sổ bảo trì.
5. Chỉ sau khi bốn điều trên đạt mới lặp lại migration và deploy production.
