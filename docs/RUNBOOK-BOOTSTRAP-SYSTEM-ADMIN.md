# Runbook khởi tạo SYSTEM_ADMIN đầu tiên

Quy trình này chỉ dùng một lần cho một project Supabase mới. Không dùng seed UAT, không đưa mật khẩu, database URL hoặc khóa `service_role` vào Git hay lịch sử lệnh dùng chung.

## Điều kiện trước khi chạy

1. Đã áp dụng đầy đủ migration và đã sao lưu CSDL.
2. Hai người cùng kiểm tra đúng project Supabase, đúng môi trường và phiếu thay đổi.
3. Đã tạo tài khoản trong Supabase Auth, đã xác nhận email và bật MFA cho tài khoản vận hành nếu gói Supabase hỗ trợ.
4. Đã có một `co_so_giao_duc` thật, đang hoạt động và có `ma_truong` duy nhất. Schema hiện tại yêu cầu mọi hồ sơ ứng dụng thuộc một đơn vị; không tạo đơn vị giả chỉ để giữ tài khoản quản trị.
5. Có kết nối Postgres trực tiếp với vai trò chủ sở hữu CSDL. Không chạy script qua trình duyệt, Worker, anon key hoặc service-role API.

Nếu production hoàn toàn trống, đội triển khai phải tạo bản ghi cho đơn vị thật đầu tiên bằng một thay đổi SQL được duyệt trước, với đúng loại hình và cấp học. Sau bootstrap, SYSTEM_ADMIN dùng màn hình Cài đặt để tạo các đơn vị tiếp theo và mời Hiệu trưởng.

## Chạy trên staging

Mở terminal riêng, đặt database URL trong biến môi trường chỉ tồn tại trong phiên hiện tại. Sau đó chạy:

```bash
psql "$DATABASE_URL" \
  -v admin_email='email-da-xac-nhan@example.vn' \
  -v school_code='MA_DON_VI_THAT' \
  -v change_ticket='OPS-001' \
  -v dry_run=true \
  -f supabase/runbooks/bootstrap_first_system_admin.sql
```

Trên PowerShell, có thể dùng cùng các đối số `-v`; truyền database URL qua biến môi trường thay vì ghi thẳng vào file. Email và mã phiếu không phải mật khẩu nhưng vẫn chỉ dùng giá trị thật trong phiên vận hành.

Script thực hiện trong một transaction, khóa chống chạy đồng thời, yêu cầu email Auth đã xác nhận, từ chối nếu đã có SYSTEM_ADMIN, gán vai trò và ghi `SYSTEM_ADMIN_BOOTSTRAPPED` vào nhật ký. Helper nằm trong `pg_temp` và bị xóa trước khi commit nên không tạo endpoint bootstrap lâu dài. Lần diễn tập phải dùng `dry_run=true`; khi chạy chính thức đổi thành `dry_run=false`.

## Kiểm tra sau khi chạy

1. Kết quả cuối phải là `system_admin_count = 1`.
2. Đăng nhập bằng tài khoản mới và xác nhận chỉ thấy Bộ tiêu chuẩn và Cài đặt theo capability hiện hành.
3. Tạo thử một đơn vị staging và lời mời Hiệu trưởng; kiểm tra nhật ký có hành động khởi tạo và tạo đơn vị.
4. Chạy test vai trò, RLS và secret scan trước khi lặp lại trên production.
5. Thử chạy lại script; nó phải rollback với thông báo hệ thống đã có SYSTEM_ADMIN.

## Chạy production và đóng quyền tạm

1. Lặp lại đúng phiên bản script đã qua staging, trong cửa sổ thay đổi được phê duyệt bởi hai người.
2. Lưu mã phiếu, thời điểm, người thực hiện và `system_admin_user_id`; không lưu database URL hoặc token.
3. Đóng phiên `psql`, xóa biến `DATABASE_URL` khỏi terminal và thu hồi quyền truy cập CSDL tạm của người thực hiện.
4. Nếu đã cấp mật khẩu CSDL tạm, xoay vòng mật khẩu trong Supabase Dashboard ngay sau hậu kiểm.
5. Không tạo SYSTEM_ADMIN tiếp theo bằng SQL tùy ý. Việc tăng số quản trị hệ thống phải có runbook riêng, phê duyệt hai người và audit tương đương.

## Khôi phục khi thất bại

- Lỗi trước `commit` làm toàn bộ transaction rollback; sửa dữ liệu đầu vào rồi chạy lại.
- Nếu đã commit nhầm project, dừng thao tác, ghi sự cố, thu hồi liên kết vai trò trong transaction được phê duyệt và kiểm tra toàn bộ nhật ký kể từ thời điểm bootstrap.
- Không xóa dòng audit để che thao tác sai.
