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

Áp dụng migration đầu tiên trong `supabase/migrations/001_init.sql` lên Supabase trước khi dùng màn hình thiết lập.

## Hướng dẫn sử dụng ban đầu

Đăng nhập tại `/login`, sau đó vào `/thiet-lap` để tạo cơ sở giáo dục và chọn hoặc tạo năm học đang hoạt động.

## Cấu trúc thư mục

- `app/`: giao diện Next.js App Router.
- `components/`: thành phần giao diện dùng lại.
- `lib/`: mã dùng chung, bao gồm cấu hình Supabase.
- `supabase/migrations/`: migration PostgreSQL/RLS cho Supabase.
- `public/`: tài nguyên tĩnh.

## Ghi chú Sprint 0

Sprint này chỉ chuẩn bị nền dự án. Chưa viết logic nghiệp vụ, chưa nhập bộ tiêu chuẩn, chưa tạo engine tính mức và chưa tạo schema phân quyền.

## Ghi chú Sprint 1

Migration `001_init.sql` tạo schema nền, RLS theo `co_so_id`, bảng nối nhiều-nhiều `minh_chung_tieu_chi`, bộ tiêu chuẩn versioned và seed khung TT57 cho một loại hình mẫu chờ nhập nội dung phụ lục chính thức.
