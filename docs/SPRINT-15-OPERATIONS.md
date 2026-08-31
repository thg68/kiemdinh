# Vận hành Sprint 15

## Thứ tự triển khai

1. Sao lưu database và xác nhận có thể khôi phục.
2. Áp dụng migration `036_sprint15_storage_hardening.sql` lên Supabase staging.
3. Chạy `npm run test:rls` với database staging hoặc bộ kiểm thử tương đương.
4. Triển khai ứng dụng staging sau khi migration đã thành công.
5. Thực hiện checklist kiểm thử bên dưới bằng tài khoản thật thuộc đơn vị thử nghiệm.
6. Chỉ lặp lại quy trình trên production sau khi staging đạt.

Không triển khai giao diện mới trước migration: route hoàn tất phụ thuộc chữ ký mới của `fn_tao_minh_chung` và hai RPC dọn object.

## Kiểm tra sau triển khai

- Bucket `evidence` có `public = false`.
- Giới hạn bucket là 25 MiB và danh sách MIME đúng với migration.
- Tải một PDF hợp lệ, gắn hai tiêu chí và xác nhận chỉ có một mã minh chứng.
- Thử tải tệp đổi đuôi giả; hệ thống phải từ chối và không tạo bản ghi `minh_chung`.
- Thử ngày hết giá trị trước ngày ban hành; cả API và PostgreSQL phải từ chối.
- Đăng nhập bằng tài khoản không có quyền xóa; phần dọn tệp tải lỗi không được hiển thị.
- Đăng nhập bằng Hiệu trưởng hoặc vai trò có `evidence.delete`; phần dọn tệp tải lỗi phải hoạt động.
- Mở minh chứng vừa tạo qua signed URL và xác nhận bucket không trả link public.

## Dọn tệp tải chưa hoàn tất

1. Vào **Minh chứng** > **Kiểm tra sức khỏe**.
2. Xem mục **Tệp tải chưa hoàn tất**.
3. Chỉ dọn các object đã tồn tại quá 60 phút và chưa gắn với bất kỳ bản ghi minh chứng nào.
4. Chọn **Dọn tệp** và xác nhận một lần nữa.
5. Kiểm tra Nhật ký có hành động dọn kho tệp và đúng số lượng object.

API xóa theo lô tối đa 20 object. Nếu một lô lỗi, hệ thống dừng và trả số lượng đã xóa; người vận hành có thể tải lại trang rồi chạy tiếp. Policy Storage kiểm tra lại trạng thái mồ côi khi xóa nên không được bỏ qua lỗi bằng thao tác trực tiếp trong database.

## Dữ liệu lịch sử

Các CHECK constraint mới dùng `NOT VALID` để không chặn triển khai khi kho cũ còn dữ liệu cần làm sạch. Chúng vẫn áp dụng ngay cho mọi bản ghi mới hoặc bản ghi được cập nhật. Sau khi rà soát dữ liệu cũ, quản trị database có thể chạy `VALIDATE CONSTRAINT` riêng trên staging trước rồi mới áp dụng production.

## Xử lý sự cố

- **Tải được tệp nhưng không có mã:** chờ tối đa 60 phút; người có quyền vào trang sức khỏe để dọn object còn sót rồi tải lại.
- **Báo sai MIME hoặc chữ ký:** dùng lại tệp gốc, không chỉ đổi phần mở rộng.
- **Báo sai SHA-256/kích thước:** xóa lượt tải lỗi và tải lại; không sửa trực tiếp metadata trong `storage.objects`.
- **Không thấy nút dọn:** kiểm tra vai trò có quyền `evidence.delete`; không cấp quyền bằng cách tắt RLS.
- **Storage gián đoạn:** tạm ngừng tải minh chứng, giữ nguyên migration và khôi phục dịch vụ trước khi thử lại.

## Quay lui

Có thể rollback phiên bản ứng dụng nếu route mới phát sinh lỗi, nhưng không nên nới bucket thành public hoặc bỏ policy tenant. Migration thay đổi contract tạo minh chứng, vì vậy rollback database chỉ thực hiện từ bản sao lưu đã kiểm chứng và theo cửa sổ bảo trì. Trong thời gian xử lý, tạm khóa thao tác tải mới thay vì cho phép ghi dữ liệu chưa đối chiếu.
