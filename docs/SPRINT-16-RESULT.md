# Sprint 16 - API và hiệu năng

## Kết quả

- Dùng schema chung tại `lib/api/validation.ts` để kiểm tra UUID, loại hình,
  cấp học, năm học, ngày ISO và tham số phân trang.
- Mọi API trả lỗi theo hợp đồng `{ code, error, details? }`; phân biệt rõ
  `400/401/403/404/409/422/429/500` bằng kiểu lỗi và mã SQLSTATE/PostgREST,
  không suy luận từ câu thông báo tiếng Việt.
- Danh sách minh chứng, nhật ký, kế hoạch cải tiến và người dùng tải 25 dòng
  mỗi trang cùng tổng số dòng từ PostgreSQL.
- Gói ZIP tải tệp song song có giới hạn, tối đa hai tệp; mỗi lượt tải
  có timeout 30 giây và thử lại tối đa ba lần với lỗi mạng hoặc 5xx.
- Migration `037_sprint16_api_performance.sql` tạo bộ đếm rate limit nguyên tử
  trong PostgreSQL và bổ sung index theo đơn vị, năm học, trạng thái, thời gian.

## Giới hạn thao tác

| Thao tác | Giới hạn |
| --- | --- |
| Xuất Mẫu 1, Mẫu 2, XLSX hoặc JSON | 10 lượt / 5 phút / người dùng |
| Xuất gói minh chứng ZIP | 2 lượt / 10 phút / người dùng |
| Tạo liên kết tạm thời xem tệp | 60 lượt / phút / người dùng |

Khi hết lượt, API trả `429 RATE_LIMITED` và header `Retry-After`. Bộ đếm dùng
chung giữa các Cloudflare Worker nên không phụ thuộc một tiến trình ứng dụng.
Nếu PostgreSQL không kiểm tra được giới hạn, thao tác xuất bị từ chối an toàn.

## Kiểm chứng

- Unit/integration: `npm test`.
- TypeScript: `npm run typecheck`.
- Lint: `npm run lint`.
- Production build: `npm run build`.
- PostgreSQL/RLS: `npm run test:rls`.
- Test riêng Sprint 16:
  `supabase/tests/038_sprint16_api_performance_test.sql`.

Trước khi triển khai, áp dụng migration `037` lên staging, chạy toàn bộ lệnh
trên và kiểm tra thủ công phân trang cùng phản hồi `429`. Không reset database
production để áp dụng migration.
