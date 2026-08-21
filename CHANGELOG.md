# Changelog

Tài liệu này tóm tắt các quyết định kiến trúc quan trọng qua Sprint 0-6.

## Sprint 0 - Nền dự án

- Chọn Next.js App Router, TypeScript và Tailwind cho giao diện.
- Chọn Supabase Auth, PostgreSQL và Storage làm nền triển khai đầu tiên.
- Tách thư mục chính: `app/`, `components/`, `lib/`, `supabase/migrations/`.
- Không commit `.env` hoặc `.env.local`.

## Sprint 1 - Schema cơ sở dữ liệu

- Thiết kế multi-tenant quanh `co_so_giao_duc`.
- Mọi bảng nghiệp vụ chính có `co_so_id` và `nam_hoc_id`.
- Bật Row Level Security ở tầng CSDL, không chỉ ẩn nút trên giao diện.
- Bộ tiêu chuẩn được lưu trong bảng dữ liệu có phiên bản, không hardcode trong mã nguồn.
- `minh_chung_tieu_chi` là bảng nối nhiều-nhiều giữa minh chứng và tiêu chí.
- `tu_danh_gia` có `cap_hoc` để xử lý trường nhiều cấp học.
- Mã minh chứng sinh theo mẫu `MC.<tiêu chuẩn>.<tiêu chí>.<số thứ tự 2 chữ số>`.

## Sprint 2 - Kho minh chứng

- Minh chứng là thực thể độc lập, có một mã duy nhất.
- Một minh chứng có thể gắn nhiều tiêu chí; tiêu chí gốc được đánh dấu bằng `la_tieu_chi_goc`.
- Tệp lưu trong Supabase Storage private, truy cập bằng signed URL có thời hạn.
- Mọi thao tác đọc/ghi minh chứng được ghi vào `nhat_ky_truy_cap`.
- Giáo viên chỉ thao tác minh chứng thuộc phạm vi tiêu chí được phân công.

## Sprint 3 - Tự đánh giá và engine tính mức

- Engine tính mức đặt ở `lib/assessment/level-engine.ts`, dễ đọc và có test.
- Đánh giá tuần tự: chỉ xét Mức 2 khi Mức 1 đã đạt.
- Tám tiêu chí bắt buộc quyết định điều kiện đạt mức tương ứng.
- Kết quả engine trả về object giải trình, không chỉ trả về một chuỗi.
- CSDL chặn lưu mức đạt nếu thiếu mô tả hoặc thiếu mã minh chứng.
- Mỗi lần đổi mức được ghi vào `lich_su_tu_danh_gia`.

## Sprint 4 - Xuất báo cáo

- Module báo cáo đặt tại `/bao-cao`, API xuất file tại `/api/bao-cao/*`.
- Mẫu 1 `.docx` xuất từ dữ liệu tự đánh giá và minh chứng thật.
- Mẫu 1 chèn cảnh báo đỏ khi thiếu mô tả hoặc thiếu mã minh chứng.
- Mẫu 2 lấy dữ liệu từ `ke_hoach_cai_tien`.
- Có xuất bổ trợ: danh mục minh chứng `.xlsx`, gói minh chứng `.zip`, JSON đầy đủ theo năm học.
- API báo cáo dùng token người dùng hiện tại để RLS vẫn kiểm soát quyền.

## Sprint 5 - Thí điểm trường thật

- Viết hướng dẫn import dữ liệu một năm học thật bằng manifest Excel/CSV.
- Script import đi qua tài khoản đăng nhập thật và RLS, không dùng service role để bỏ qua phân quyền.
- Bổ sung dữ liệu demo có nhãn `[DEMO]` chỉ để thử luồng xuất file, không tính là dữ liệu thật.
- Vá lỗi demo phụ thuộc `digest()` và làm lại hàm demo để không nhân bản kế hoạch cải tiến.
- Đồng bộ việc lọc tiêu chí theo `loai_hinh` của cơ sở giáo dục để chuẩn bị cho đủ 3 phụ lục.

## Sprint 6 - Ổn định và tài liệu hóa

- Bổ sung hướng dẫn sử dụng riêng cho Hiệu trưởng, Thư ký hội đồng và Giáo viên.
- Viết kịch bản video demo 10 phút theo luồng vận hành thật.
- Ghi lại trạng thái Definition of Done cho M0-M4.
- Rà soát lint, test, build và dependency audit.
- Bổ sung migration `009` để có đủ khung tiêu chuẩn cho 3 loại hình và RPC tạo năm học mới có kế thừa tự đánh giá.
- Ghi rõ điểm còn theo dõi: nhập nội dung phụ lục TT57 chính thức và kiểm thử bằng dữ liệu trường thật.
