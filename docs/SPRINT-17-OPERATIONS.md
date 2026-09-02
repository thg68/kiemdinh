# Vận hành Sprint 17

## Mục tiêu

Sprint 17 siết tính toàn vẹn dữ liệu và bổ sung khả năng quan sát production:

- Mỗi đơn vị chỉ có một hội đồng tự đánh giá trong một năm học.
- Người phụ trách kế hoạch cải tiến phải thuộc cùng đơn vị với kế hoạch.
- `anon` và `authenticated` không có quyền DDL thừa như `TRUNCATE`, `TRIGGER`
  hoặc `REFERENCES` trên schema `public`.
- Mỗi request API có một `requestId`; log chỉ chứa mã sự kiện và metadata kỹ
  thuật nằm trong danh sách cho phép.
- Endpoint `/api/health` kiểm tra ứng dụng và Supabase Auth mà không trả secret,
  URL nội bộ hoặc nội dung lỗi từ nhà cung cấp.

## Kiểm tra dữ liệu trước migration

Chạy hai truy vấn sau trên staging trước khi áp dụng migration `038`:

```sql
select co_so_id, nam_hoc_id, count(*)
from public.hoi_dong_tu_danh_gia
group by co_so_id, nam_hoc_id
having count(*) > 1;
```

```sql
select kh.id, kh.co_so_id as co_so_ke_hoach, nd.co_so_id as co_so_nguoi_dung
from public.ke_hoach_cai_tien kh
join public.nguoi_dung nd on nd.id = kh.phu_trach_id
where kh.phu_trach_id is not null
  and nd.co_so_id is distinct from kh.co_so_id;
```

Nếu có kết quả, dừng migration và để nhà trường xác nhận bản ghi cần giữ hoặc
người phụ trách đúng. Migration cố ý không tự xóa hay tự đổi dữ liệu thật.

## Thứ tự triển khai

1. Sao lưu database staging và kiểm tra khả năng khôi phục.
2. Chạy hai truy vấn tiền kiểm ở trên.
3. Áp dụng `038_sprint17_production_operations.sql` lên staging.
4. Chạy `npm run test:rls`, `npm test`, `npm run typecheck`, `npm run lint` và
   `npm run build`.
5. Triển khai Worker staging, gọi `/api/health` và kiểm tra header
   `x-request-id` trên các API.
6. Tạo có kiểm soát một lỗi đăng nhập, một lỗi Storage và một lỗi xuất báo cáo;
   xác nhận Workers Logs nhận đúng `alertType` nhưng không có email, JWT, signed
   URL, tên tệp, nội dung minh chứng hoặc nội dung dữ liệu học sinh.
7. Chỉ lặp lại quy trình trên production sau khi staging đạt.

## Endpoint sức khỏe

Gọi `GET /api/health` từ hệ thống giám sát:

- `200`: ứng dụng và Supabase Auth đang sẵn sàng.
- `503`: thiếu cấu hình hoặc Supabase Auth không phản hồi đúng hạn.
- Header `cache-control: no-store` ngăn lưu kết quả cũ.
- Header `x-request-id` dùng để đối chiếu với Workers Logs.

Phản hồi chỉ có trạng thái tổng hợp và thời gian kiểm tra, không có hostname,
khóa Supabase hoặc thông báo lỗi thô.

## Truy vấn log đã lưu

Tạo ba Saved Query trong Cloudflare Workers Logs:

| Tên | Điều kiện |
| --- | --- |
| Lỗi xuất báo cáo | `alertType = "REPORT_EXPORT_FAILURE"` |
| Lỗi Storage | `alertType = "STORAGE_FAILURE"` |
| Đăng nhập thất bại | `alertType = "LOGIN_FAILURE"` |

Trường log được phép gồm `level`, `severity`, `event`, `alertType`, `category`,
`errorType`, `operation`, `reason`, `requestId`, `resourceId`, `route`,
`status`, `timestamp`. Logger loại bỏ query
string và không chấp nhận metadata tùy ý.

`invocation_logs` được đặt thành `false`; Cloudflare chỉ lưu custom logs do ứng
dụng phát theo allow-list. Không mở `wrangler tail` trên production trong lúc có
lưu lượng thật, vì luồng debug thời gian thực có thể hiển thị metadata request cho
người vận hành đang giữ phiên.

Ngưỡng vận hành đề xuất:

- `REPORT_EXPORT_FAILURE`: cảnh báo ngay khi có một sự kiện.
- `STORAGE_FAILURE`: cảnh báo ngay khi có một sự kiện.
- `LOGIN_FAILURE`: cảnh báo khi có từ 10 sự kiện trong 5 phút; điều tra theo
  `reason`, không ghi email hoặc địa chỉ IP vào log ứng dụng.

Cloudflare Notifications nên bật cảnh báo tỷ lệ lỗi Worker/HTTP 5xx và một
health check định kỳ tới `/api/health`. Saved Query giúp điều tra ba tín hiệu
nghiệp vụ, nhưng không tự gửi thông báo theo trường tùy chỉnh. Để tự động gửi
cảnh báo `LOGIN_FAILURE` theo ngưỡng, cần cấu hình Tail Worker hoặc hệ thống log
đích sau khi đơn vị phê duyệt kênh nhận và chính sách lưu giữ. Không gửi dữ liệu
nhạy cảm sang dịch vụ bên ngoài.

## Kiểm tra quyền sau migration

Truy vấn sau phải trả về 0 dòng:

```sql
select grantee, table_schema, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
  and privilege_type in ('TRUNCATE', 'TRIGGER', 'REFERENCES');
```

### Phạm vi default privileges trên Supabase hosted

Migration `038` sửa default privileges của role `postgres`, là owner tạo quan hệ
qua migration ứng dụng. Supabase còn role nội bộ `supabase_admin` với default ACL
do nhà cung cấp quản lý; role migration không được phép thay đổi ACL này. Vì vậy:

- mọi quan hệ `public` hiện hữu vẫn phải qua truy vấn audit ở trên;
- mọi quan hệ do migration ứng dụng tạo mới được bảo vệ bởi default ACL của
  `postgres`; và
- nếu một quan hệ mới có owner `supabase_admin`, phải audit và thu hồi quyền trên
  chính quan hệ đó trước khi ứng dụng sử dụng.

Không cấp thêm membership vào `supabase_admin` chỉ để làm test hoặc thay đổi ACL.

## Xử lý sự cố

- **Migration dừng vì trùng hội đồng:** không xóa tự động; đối chiếu biên bản và
  hợp nhất dữ liệu trên staging trước.
- **Migration dừng vì người phụ trách khác đơn vị:** sửa phân công bằng người có
  thẩm quyền; không bỏ khóa ngoại.
- **Health trả 503:** kiểm tra biến Supabase và trạng thái Supabase Auth; dùng
  `x-request-id` để đối chiếu log.
- **Không thấy log cảnh báo:** kiểm tra `observability.logs.enabled`, sampling và
  thời gian truy vấn; không thêm nội dung lỗi thô để dễ tìm kiếm.
- **Nghi lộ secret trong log:** khóa phiên, thu hồi secret liên quan, giới hạn
  quyền xem log và xử lý theo quy trình sự cố dữ liệu của đơn vị.

## Quay lui

Có thể rollback ứng dụng nếu logging hoặc health endpoint phát sinh lỗi. Hai
ràng buộc dữ liệu và việc thu hồi quyền không nên gỡ để khôi phục hành vi cũ.
Nếu cần rollback database, dùng bản sao lưu đã kiểm chứng trong cửa sổ bảo trì;
không `DROP CONSTRAINT` trực tiếp trên production khi chưa phân tích dữ liệu.
