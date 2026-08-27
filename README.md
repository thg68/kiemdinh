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

Điền `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` và `NEXT_PUBLIC_APP_URL` trong `.env.local`. `NEXT_PUBLIC_APP_URL` là URL gốc của môi trường hiện tại, ví dụ `http://localhost:3000` khi chạy local hoặc domain HTTPS thật khi triển khai. Áp dụng các migration trong `supabase/migrations/` theo đúng thứ tự trước khi dùng dữ liệu thật.

## Triển Khai Cloudflare

Cloudflare/OpenNext dùng Node.js 22. Có thể chạy trực tiếp bằng Node 22 hoặc đặt `NODE22_HOME` tới thư mục cài Node 22 trước khi dùng các lệnh sau:

```bash
npm run preview
npm run deploy
```

Trước khi triển khai, chạy `npm run test`, `npm run lint`, `npm run build` và `npx supabase db lint --linked --level warning`. Không đưa `.env.local`, `.dev.vars` hoặc khóa Supabase `service_role` vào Git.

## Kiểm Thử

```bash
npm run test
npm run lint
npm run build
```

Kiểm tra manifest import trước khi chạy thật:

```bash
npm run import:school-year -- --manifest=data/import-manifest.example.csv --dry-run=true
npm run import:school-year -- --manifest=data/import-manifest.example.csv
npm run import:school-year -- --manifest=data/import-manifest.example.csv --commit=true
```

Lệnh thứ hai tải nguồn vào staging và kiểm tra toàn bộ lô nhưng chưa ghi dữ liệu nghiệp vụ. Chỉ dùng `--commit=true` sau khi kết quả trả về `ready: true`; cùng một file hash được chạy lại sẽ không tạo bản ghi trùng.

## Hướng Dẫn Ban Đầu

Đăng nhập tại `/login`, vào `/thiet-lap` để tạo cơ sở giáo dục và chọn hoặc tạo năm học đang hoạt động.

Nếu quên mật khẩu, vào `/quen-mat-khau` để gửi email đặt lại mật khẩu qua Supabase Auth.

Quản lý người dùng nằm trong `/thiet-lap`: người dùng mới cần tạo tài khoản ở `/login` trước, sau đó Hiệu trưởng nhập email để đưa vào đơn vị và gán vai trò như Thư ký, Giáo viên hoặc Ủy viên.

Kho minh chứng nằm tại `/minh-chung`; kiểm tra sức khỏe minh chứng tại `/minh-chung/suc-khoe`.

Tự đánh giá nằm tại `/tu-danh-gia`; chọn cấp học, nhập mô tả theo từng tiêu chí, gắn mã minh chứng từ kho M2 rồi xem Gap Board và What-if.

Xuất báo cáo nằm tại `/bao-cao`; chọn năm học và cấp học để tải Mẫu 1, Mẫu 2, danh mục minh chứng, gói minh chứng và JSON dự phòng.

Nội dung sáu phần thuyết minh của Mẫu 2 được nhập tại `/ke-hoach-cai-tien`; hai phần còn lại lấy từ thông tin năm học và bảng kế hoạch. Báo cáo chỉ được phê duyệt khi database xác nhận đủ điều kiện và snapshot thật đã lưu trong Storage.

Nhập dữ liệu trường thí điểm theo hướng dẫn `docs/import-du-lieu-truong-that.md`; file manifest mẫu nằm tại `data/import-manifest.example.csv`.

## Tài Liệu Sprint 6

- `docs/huong-dan-hieu-truong.md`: hướng dẫn sử dụng cho Hiệu trưởng.
- `docs/huong-dan-thu-ky-hoi-dong.md`: hướng dẫn sử dụng cho Thư ký hội đồng.
- `docs/huong-dan-giao-vien.md`: hướng dẫn sử dụng cho Giáo viên.
- `docs/kich-ban-video-demo-10-phut.md`: kịch bản quay video demo 10 phút.
- `docs/definition-of-done-m0-m4.md`: kiểm tra Định nghĩa Hoàn thành cho M0-M4.
- `docs/nhap-noi-dung-phu-luc-tt57.md`: nguyên tắc nhập nội dung phụ lục TT57 vào bảng dữ liệu.
- `docs/phan-quyen-phu-luc-b.md`: mô tả phân quyền và RLS theo Phụ lục B.
- `docs/luong-man-hinh-theo-vai-tro.md`: mapping vai trò với các màn hình thao tác chính.
- `CHANGELOG.md`: tóm tắt quyết định kiến trúc qua các sprint.

## Cấu Trúc Thư Mục

- `app/`: giao diện Next.js App Router.
- `components/`: thành phần giao diện dùng lại.
- `lib/`: mã dùng chung, Supabase client và engine tính mức.
- `supabase/migrations/`: migration PostgreSQL/RLS cho Supabase.
- `public/`: tài nguyên tĩnh.
- `tt57_seed/`: gói dữ liệu thật Phụ lục I, II, III của TT57 do người dùng cung cấp.
- `data/tt57/`: bản JSON đã đưa vào app/test, được đối chiếu không lệch với `tt57_seed/`.

## Ghi Chú Sprint 1

Migration `001_init.sql` tạo schema nền, RLS theo `co_so_id`, bảng nối nhiều-nhiều `minh_chung_tieu_chi` và khung TT57 ban đầu.

Migration `011_seed_tt57_reference_data.sql` nạp dữ liệu thật Phụ lục I, II, III dựa trên gói nguồn `tt57_seed/`, cập nhật khung cũ thành bộ tiêu chuẩn đang áp dụng cho `mam_non`, `pho_thong`, `gdtx`.

## Ghi Chú Sprint 2

Migration `002_evidence_module.sql` bổ sung permission codes, mapping role-quyền cho nhóm minh chứng, RLS chi tiết cho `minh_chung`/`minh_chung_tieu_chi`, bucket Storage private `evidence` và RPC tạo/gắn minh chứng có audit.

## Ghi Chú Sprint 2.5

Migration `003_hardening.sql` bổ sung bảng `van_ban_lien_quan`, siết quyền Teacher theo phân công tiêu chí khi tạo minh chứng và cấp quyền audit helper cho server-side flow. Signed URL được tạo qua API route `/api/minh-chung/[id]/signed-url`, không tạo trực tiếp từ UI.

## Ghi Chú Sprint 3

Migration `004_assessment_module.sql` bổ sung quyền `assessment.*`, siết RLS cho `tu_danh_gia`, chặn đánh dấu đạt khi thiếu mô tả hoặc mã minh chứng, và tự ghi `lich_su_tu_danh_gia` khi mức thay đổi.

Engine tính mức nằm tại `lib/assessment/level-engine.ts`, trả về kết quả kèm lý do, điểm chặn lên mức kế tiếp và khoảng cách cần xử lý.

## Ghi Chú Sprint 4

Module xuất báo cáo nằm tại `/bao-cao`, các API tải file nằm dưới `/api/bao-cao/*`. Hệ thống dùng token người dùng hiện tại để đọc Supabase, vì vậy RLS vẫn kiểm soát quyền khi xuất file.

Mẫu 1 `.docx` chèn cảnh báo đỏ `[CHƯA CÓ DỮ LIỆU - không xuất bản chính thức]` nếu thiếu mô tả hiện trạng hoặc thiếu mã minh chứng, không tự sinh nội dung thay nhà trường.

Migration `005_report_module.sql` bổ sung quyền `report.*`, bảng `nhan_xet_tieu_chuan` để nhập Điểm mạnh/Hạn chế/Định hướng cải tiến theo từng tiêu chuẩn, RLS cho `bao_cao` và dữ liệu nhận xét.

Các định dạng đã có: Mẫu 1 `.docx`, Mẫu 2 `.docx`, danh mục minh chứng `.xlsx`, gói minh chứng `.zip`, JSON đầy đủ theo năm học.

## Checklist Kiểm Thử Thủ Công Sprint 3

- Vào `/tu-danh-gia` khi chưa có năm học đang hoạt động; màn hình phải hướng về `/thiet-lap`, không trắng trang.
- Chọn một tiêu chí, thử lưu Mức 1 khi chưa có mô tả hoặc chưa gắn minh chứng; UI và trigger CSDL phải từ chối.
- Gắn một mã minh chứng có sẵn cho tiêu chí, nhập mô tả Mức 1 và lưu; `tu_danh_gia.muc_dat` phải là `1`.
- Thử lưu Mức 2 khi thiếu mô tả Mức 2; phải bị từ chối.
- Sau khi nâng hoặc hạ mức, kiểm tra `lich_su_tu_danh_gia` có dòng ghi người đổi, mức cũ, mức mới và thời điểm.
- Gap Board phải tô nổi tiêu chí bắt buộc chưa đạt và cập nhật kết quả ngay sau khi lưu.
- What-if đổi tạm một tiêu chí lên Mức 1 hoặc Mức 2; kết quả trên màn hình thay đổi nhưng CSDL không phát sinh bản ghi mới.
- Dùng vai trò không được phân công để ghi tiêu chí; RLS/RPC phải từ chối thao tác.

## Checklist Kiểm Thử Thủ Công Sprint 4

- Đăng nhập bằng tài khoản thuộc một cơ sở giáo dục đã có năm học, minh chứng và tự đánh giá thật.
- Vào `/bao-cao`, chọn đúng năm học và cấp học đang kiểm thử.
- Nhập và lưu nhận xét theo từng tiêu chuẩn để Mẫu 1 có dữ liệu thật cho Điểm mạnh, Hạn chế và Định hướng cải tiến.
- Xuất Mẫu 1 `.docx`; mở file, kiểm tra đủ bìa ngoài, bìa trong, mục lục, Phần I-IV, đủ 15 tiêu chí và bảng mô tả hiện trạng.
- Với tiêu chí thiếu mô tả hoặc thiếu mã minh chứng, file phải có cảnh báo đỏ `[CHƯA CÓ DỮ LIỆU - không xuất bản chính thức]`.
- Kiểm tra các mã minh chứng trong Mẫu 1 nằm trong ngoặc đơn và không bị cấp lại mã mới.
- Xuất Mẫu 2 `.docx`; kiểm tra bảng kế hoạch cải tiến lấy dữ liệu từ `ke_hoach_cai_tien`.
- Xuất danh mục minh chứng `.xlsx`; kiểm tra cột TT, mã, tên, vị trí/đường dẫn, ghi chú.
- Xuất gói minh chứng `.zip`; kiểm tra có `danh-muc-minh-chung.xlsx` và các tệp trong thư mục `minh-chung` được đặt tên theo mã.
- Xuất JSON; kiểm tra có dữ liệu cơ sở, năm học, tiêu chí, tự đánh giá, minh chứng và kế hoạch cải tiến.
- Dùng tài khoản không có quyền hoặc khác đơn vị gọi trực tiếp API `/api/bao-cao/*`; RLS phải từ chối hoặc không trả dữ liệu ngoài phạm vi.
