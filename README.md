# KiemDinh

Ứng dụng quản trị nhà trường phục vụ bảo đảm chất lượng giáo dục theo định hướng Thông tư 57/2026/TT-BGDĐT.

Nguyên tắc nền: minh chứng là sản phẩm phụ của vận hành nhà trường, không phải việc làm thêm để phục vụ kiểm định.

## Chạy Local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Sau đó mở `http://localhost:3000`.

Điền `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` trong `.env.local`. Áp dụng các migration trong `supabase/migrations/` theo đúng thứ tự trước khi dùng dữ liệu thật.

## Kiểm Thử

```bash
npm run test
npm run lint
npm run build
```

## Hướng Dẫn Ban Đầu

Đăng nhập tại `/login`, vào `/thiet-lap` để tạo cơ sở giáo dục và chọn hoặc tạo năm học đang hoạt động.

Kho minh chứng nằm tại `/minh-chung`; kiểm tra sức khỏe minh chứng tại `/minh-chung/suc-khoe`.

Tự đánh giá nằm tại `/tu-danh-gia`; chọn cấp học, nhập mô tả theo từng tiêu chí, gắn mã minh chứng từ kho M2 rồi xem Gap Board và What-if.

## Cấu Trúc Thư Mục

- `app/`: giao diện Next.js App Router.
- `components/`: thành phần giao diện dùng lại.
- `lib/`: mã dùng chung, Supabase client và engine tính mức.
- `supabase/migrations/`: migration PostgreSQL/RLS cho Supabase.
- `public/`: tài nguyên tĩnh.

## Ghi Chú Sprint 1

Migration `001_init.sql` tạo schema nền, RLS theo `co_so_id`, bảng nối nhiều-nhiều `minh_chung_tieu_chi`, bộ tiêu chuẩn versioned và seed khung TT57 cho một loại hình mẫu chờ nhập nội dung phụ lục chính thức.

## Ghi Chú Sprint 2

Migration `002_evidence_module.sql` bổ sung permission codes, mapping role-quyền cho nhóm minh chứng, RLS chi tiết cho `minh_chung`/`minh_chung_tieu_chi`, bucket Storage private `evidence` và RPC tạo/gắn minh chứng có audit.

## Ghi Chú Sprint 2.5

Migration `003_hardening.sql` bổ sung bảng `van_ban_lien_quan`, siết quyền Teacher theo phân công tiêu chí khi tạo minh chứng và cấp quyền audit helper cho server-side flow. Signed URL được tạo qua API route `/api/minh-chung/[id]/signed-url`, không tạo trực tiếp từ UI.

## Ghi Chú Sprint 3

Migration `004_assessment_module.sql` bổ sung quyền `assessment.*`, siết RLS cho `tu_danh_gia`, chặn đánh dấu đạt khi thiếu mô tả hoặc mã minh chứng, và tự ghi `lich_su_tu_danh_gia` khi mức thay đổi.

Engine tính mức nằm tại `lib/assessment/level-engine.ts`, trả về kết quả kèm lý do, điểm chặn lên mức kế tiếp và khoảng cách cần xử lý.

## Checklist Kiểm Thử Thủ Công Sprint 3

- Vào `/tu-danh-gia` khi chưa có năm học đang hoạt động; màn hình phải hướng về `/thiet-lap`, không trắng trang.
- Chọn một tiêu chí, thử lưu Mức 1 khi chưa có mô tả hoặc chưa gắn minh chứng; UI và trigger CSDL phải từ chối.
- Gắn một mã minh chứng có sẵn cho tiêu chí, nhập mô tả Mức 1 và lưu; `tu_danh_gia.muc_dat` phải là `1`.
- Thử lưu Mức 2 khi thiếu mô tả Mức 2; phải bị từ chối.
- Sau khi nâng hoặc hạ mức, kiểm tra `lich_su_tu_danh_gia` có dòng ghi người đổi, mức cũ, mức mới và thời điểm.
- Gap Board phải tô nổi tiêu chí bắt buộc chưa đạt và cập nhật kết quả ngay sau khi lưu.
- What-if đổi tạm một tiêu chí lên Mức 1 hoặc Mức 2; kết quả trên màn hình thay đổi nhưng CSDL không phát sinh bản ghi mới.
- Dùng vai trò không được phân công để ghi tiêu chí; RLS/RPC phải từ chối thao tác.
