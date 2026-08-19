# KiemDinh

Ứng dụng quản trị nhà trường phục vụ bảo đảm chất lượng giáo dục theo định hướng Thông tư 57/2026/TT-BGDĐT.

Nguyên tắc nền: minh chứng là sản phẩm phụ của vận hành nhà trường, không phải việc làm thêm để phục vụ kiểm định.

## Chạy local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Sau đó mở `http://localhost:3000`.

Điền `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` trong `.env.local` khi đã có dự án Supabase.

Áp dụng các migration trong `supabase/migrations/` lên Supabase theo thứ tự trước khi dùng ứng dụng.

## Hướng Dẫn Ban Đầu

Đăng nhập tại `/login`, sau đó vào `/thiet-lap` để tạo cơ sở giáo dục và chọn hoặc tạo năm học đang hoạt động.

Kho minh chứng nằm tại `/minh-chung`; trang kiểm tra sức khỏe nằm tại `/minh-chung/suc-khoe`.

## Cấu Trúc Thư Mục

- `app/`: giao diện Next.js App Router.
- `components/`: thành phần giao diện dùng lại.
- `lib/`: mã dùng chung, bao gồm cấu hình Supabase.
- `supabase/migrations/`: migration PostgreSQL/RLS cho Supabase.
- `public/`: tài nguyên tĩnh.

## Ghi Chú Sprint 1

Migration `001_init.sql` tạo schema nền, RLS theo `co_so_id`, bảng nối nhiều-nhiều `minh_chung_tieu_chi`, bộ tiêu chuẩn versioned và seed khung TT57 cho một loại hình mẫu chờ nhập nội dung phụ lục chính thức.

## Ghi Chú Sprint 2

Migration `002_evidence_module.sql` bổ sung permission codes, mapping role-quyền cho nhóm minh chứng, RLS chi tiết cho `minh_chung`/`minh_chung_tieu_chi`, bucket Storage private `evidence` và RPC tạo/gắn minh chứng có audit.

## Checklist Kiểm Thử Thủ Công Sprint 2

- Đăng nhập, tạo cơ sở giáo dục và năm học đang hoạt động nếu chưa có.
- Vào `/minh-chung`, tải một tệp mới, chọn nhiều tiêu chí và chọn một tiêu chí gốc; kiểm tra mã dạng `MC.x.y.01`.
- Dùng lại minh chứng vừa tạo để gắn thêm tiêu chí khác; kiểm tra mã không đổi và trang chi tiết hiển thị tất cả tiêu chí.
- Bấm “Xem tệp 10 phút” ở trang chi tiết; kiểm tra URL là signed URL và không phải public URL vĩnh viễn.
- Tạo hai minh chứng bằng cùng một tệp; vào `/minh-chung/suc-khoe` kiểm tra nhóm trùng SHA-256.
- Tạo minh chứng không gắn tiêu chí bằng thao tác SQL thử nghiệm nếu cần; kiểm tra mục “mồ côi”.
- Gán ngày hết giá trị trước ngày hiện tại; kiểm tra cảnh báo hết hiệu lực.
- Kiểm tra bảng `nhat_ky_truy_cap` có log khi tạo, đọc danh sách, đọc chi tiết, tạo signed URL và gắn tiêu chí.
- Dùng tài khoản khác tenant hoặc vai trò không phù hợp để thử request trực tiếp; PostgreSQL/RLS phải từ chối.
