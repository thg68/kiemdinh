# Biên bản triển khai production Sprint 17

Ngày triển khai: 03/09/2026.

## Phạm vi

- Supabase production: migration `020` đến `038`.
- Cloudflare Worker production: `kiemdinh-app`.
- Domain chính: `https://kdclgd.io.vn`.
- Workers Route: `kdclgd.io.vn/*`.

## Kiểm tra trước triển khai

- Đã tạo backup schema và data trong `supabase/.temp/`; thư mục này bị Git bỏ qua.
- `123/123` unit test đạt.
- TypeScript, ESLint và production build đạt.
- Dry-run xác nhận đúng 19 migration còn thiếu.

## Kết quả

- Production đã đồng bộ migration `001` đến `038`.
- Supabase DB lint không phát hiện lỗi schema.
- Cloudflare Worker version:
  `109b4fb6-c7a4-4ba9-98e7-50f49c48c402`.
- `https://kiemdinh-app.thang-nh.workers.dev/api/health`: HTTP 200.
- `https://kdclgd.io.vn/api/health`: HTTP 200, kết nối Supabase Auth đạt.
- `https://kdclgd.io.vn/`: HTTP 200.

## Lưu ý vận hành

- Domain dùng Workers Route vì apex đã có bản ghi DNS do người dùng quản lý.
- Không đưa file backup production vào Git hoặc gửi qua dịch vụ bên ngoài.
- Cần lưu backup ở vị trí mã hóa, giới hạn quyền truy cập và xóa theo chính sách lưu giữ.
