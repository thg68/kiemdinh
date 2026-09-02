# Sprint 17 - Vận hành production

## Kết quả

- Migration `038_sprint17_production_operations.sql` bảo đảm một hội đồng trên
  mỗi cặp `(co_so_id, nam_hoc_id)` và người phụ trách kế hoạch thuộc cùng đơn vị.
- Thu hồi `TRUNCATE`, `TRIGGER`, `REFERENCES` khỏi `PUBLIC`, `anon`,
  `authenticated` trên mọi quan hệ hiện hữu và default privileges của role
  migration `postgres` trong schema `public`.
- `middleware.ts` cấp UUID mới cho mọi request `/api/*`; API phản hồi cùng
  `x-request-id` để đối chiếu log.
- `/api/health` kiểm tra Supabase Auth với timeout, trả trạng thái tổng hợp
  `200/503` và không tiết lộ cấu hình.
- Logger dùng object có cấu trúc với danh sách trường cho phép. Không ghi error
  message/stack, request header, JWT, signed URL, tên tệp, nội dung minh chứng
  hoặc dữ liệu cá nhân nhạy cảm.
- Ba loại tín hiệu vận hành là `REPORT_EXPORT_FAILURE`, `STORAGE_FAILURE` và
  `LOGIN_FAILURE`; lỗi phía trình duyệt chỉ gửi mã lý do/thao tác an toàn về API
  cùng origin.
- Custom logs được bật 100% sampling trong giai đoạn thí điểm; invocation logs bị
  tắt để không lưu tự động request header hoặc URL. Cần đánh giá lại chi phí trước
  khi mở rộng.

## Hợp đồng cảnh báo

| Tín hiệu | Nguồn | Metadata được phép |
| --- | --- | --- |
| `REPORT_EXPORT_FAILURE` | API xuất báo cáo | operation, requestId, route, status |
| `STORAGE_FAILURE` | API/UI tải, xóa, mở tệp | operation, requestId, resourceId, route, status |
| `LOGIN_FAILURE` | Màn hình đăng nhập | reason, requestId, route |

Tài liệu triển khai, Saved Query và xử lý sự cố nằm tại
`docs/SPRINT-17-OPERATIONS.md`. Kết quả rollout staging nằm tại
`docs/SPRINT-17-STAGING-ROLLOUT.md`.

## Rollout staging

- Supabase staging đã nhận migration `033` đến `038`; kiểm tra catalog 4/4 đạt.
- Worker `kiemdinh-app-staging` đã deploy thành công với version
  `eb9830b5-af9f-43d4-97ac-1a783d882f76`.
- Bundle không chứa project ref production; `/api/health` trả 200 và request ID
  hợp lệ.
- Workers Logs đã nhận sự kiện `LOGIN_FAILURE` có cấu trúc và không chứa dữ liệu
  nhạy cảm.
- Production chưa được migrate hoặc deploy trong đợt này.

## Kiểm chứng

- Unit/integration: `npm test`.
- TypeScript: `npm run typecheck`.
- Lint: `npm run lint`.
- Production build: `npm run build`.
- PostgreSQL/RLS: `npm run test:rls`.
- Test riêng Sprint 17:
  `supabase/tests/039_sprint17_production_operations_test.sql`.

## Việc cần cấu hình theo tài khoản

Mã nguồn đã phát tín hiệu có cấu trúc và cấu hình Workers Logs. Người vận hành
vẫn phải chọn người/kênh nhận trong Cloudflare Notifications. Cảnh báo theo
ngưỡng trường log tùy chỉnh cần Tail Worker hoặc hệ thống log đích đã được đơn
vị phê duyệt; Sprint này không tự gửi dữ liệu sang dịch vụ bên ngoài.
