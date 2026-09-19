# Triển khai email xác thực tài khoản

Tài liệu này áp dụng cho Supabase Auth, Edge Function `send-email`, Resend và ứng dụng production tại `https://kdclgd.io.vn`.

## Thành phần đã thêm

- Đăng ký chuyển người dùng đến `/xac-thuc-email` và hiển thị popup nhắc kiểm tra đúng địa chỉ email.
- Gửi lại email sau thời gian chờ 60 giây; Supabase vẫn là nơi giới hạn tần suất phía máy chủ.
- Trang xác thực chỉ tiêu thụ `token_hash` sau khi người dùng bấm **Xác thực tài khoản**, tránh trình quét liên kết của email client dùng token trước người nhận.
- Edge Function `send-email` kiểm tra chữ ký Standard Webhooks và gửi cả HTML lẫn plain text qua Resend.
- Email xác thực dùng favicon tại `/icon.png`, tên đơn vị PDT Academy và địa chỉ hỗ trợ `tuphung@gmail.com`.
- RPC `fn_admin_danh_sach_tai_khoan` hiển thị toàn bộ Supabase Auth accounts, kể cả tài khoản chưa xác thực và chưa có hồ sơ `nguoi_dung`.

## Thứ tự triển khai production

1. Sao lưu database theo quy trình phát hành hiện hành.
2. Áp dụng migration `076_admin_auth_accounts.sql` trước khi phát hành giao diện quản trị.
3. Trong Resend, xác minh domain gửi `kdclgd.io.vn` và hoàn tất các bản ghi SPF, DKIM, DMARC theo hướng dẫn của Resend.
4. Tạo API key Resend chỉ dùng cho email giao dịch.
5. Đặt secrets cho Supabase Edge Functions bằng file cục bộ không commit:

   ```dotenv
   RESEND_API_KEY=re_xxxxxxxxx
   SEND_EMAIL_HOOK_SECRET=v1,whsec_xxxxxxxxx
   AUTH_EMAIL_FROM=PDT Academy <no-reply@kdclgd.io.vn>
   PUBLIC_APP_URL=https://kdclgd.io.vn
   ```

   ```powershell
   npx supabase secrets set --env-file supabase/functions/.env --project-ref <PROJECT_REF>
   npx supabase functions deploy send-email --no-verify-jwt --project-ref <PROJECT_REF>
   ```

6. Trong Supabase Dashboard > Authentication:

   - Site URL: `https://kdclgd.io.vn`
   - Redirect URLs: `https://kdclgd.io.vn/xac-thuc-email` và `https://kdclgd.io.vn/quen-mat-khau`
   - Bật email confirmation.
   - Đặt thời hạn OTP là 3.600 giây.
   - Đặt thời gian tối thiểu giữa hai email là 60 giây.

7. Trong Auth Hooks, tạo **Send Email hook** kiểu HTTPS trỏ đến:

   `https://<PROJECT_REF>.supabase.co/functions/v1/send-email`

   Sao chép secret được Supabase tạo vào `SEND_EMAIL_HOOK_SECRET`, cập nhật Edge Function secret lần cuối, sau đó bật hook.
8. Deploy ứng dụng Cloudflare với `NEXT_PUBLIC_APP_URL=https://kdclgd.io.vn`. Bộ kiểm tra môi trường sẽ từ chối URL production khác domain này, URL có path, query hoặc fragment.
9. Kiểm tra nhanh bằng một địa chỉ email mới:

   - email có logo, tên người dùng, CTA, link dự phòng, thời hạn và footer;
   - CTA mở `/xac-thuc-email` trên domain production;
   - tài khoản chưa xác thực bị chặn đăng nhập và có thể gửi lại email;
   - sau xác thực, người dùng đăng nhập và hoàn tất tham gia trường;
   - trang quản trị hiển thị email và trạng thái xác thực của tài khoản vừa tạo.

Cấu hình Auth trên Supabase hosted không được áp dụng bằng `supabase db push`; Site URL, redirect allowlist và Auth Hook phải được kiểm tra trong Dashboard sau mỗi lần đổi project.

## Khôi phục khi gửi email lỗi

1. Tắt Send Email Hook trong Supabase Dashboard để Auth quay về email provider/template trước đó.
2. Khôi phục phiên bản Edge Function nếu lỗi chỉ nằm trong template hoặc Resend integration.
3. Không rollback migration 076: hàm mới chỉ đọc dữ liệu và không thay đổi tài khoản.
4. Kiểm tra Resend logs bằng message ID; không sao chép token, webhook payload hoặc địa chỉ email người dùng vào issue và application log.

## Tài liệu tham khảo

- [Supabase Send Email Hook](https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook)
- [Supabase Auth email templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Resend domain verification](https://resend.com/docs/dashboard/domains/introduction)
