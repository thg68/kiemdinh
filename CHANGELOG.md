# Changelog

Tài liệu này tóm tắt các quyết định kiến trúc quan trọng qua Sprint 0-8.

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
- Bổ sung migration `010` để siết RLS/RBAC theo Phụ lục B: phân công, tự đánh giá, minh chứng, Storage và báo cáo đã phê duyệt.

## Hardening Sau Sprint 6

- Bổ sung migration `015` để thu hẹp các policy RLS còn quá rộng, khóa thay đổi vai trò trực tiếp và đưa xác minh minh chứng qua RPC có kiểm tra quyền, audit.
- Báo cáo được phê duyệt phải lưu file snapshot trong bucket Storage private `reports`; người dùng tải lại bằng signed URL có thời hạn.
- Engine tính mức luôn chuẩn hóa đủ 15 tiêu chí; tiêu chí bị thiếu khỏi dữ liệu đầu vào được tính là chưa đạt.
- Bổ sung giới hạn 25MB và danh sách định dạng cho tệp minh chứng; tự dọn tệp Storage nếu giao dịch tạo minh chứng thất bại.
- Bổ sung migration `016` sửa lỗi biên dịch hàm tạo năm học và kế thừa tự đánh giá `ke_thua_cho_cap_nhat`.

## Sprint 7 - Bảo mật P0

- Khóa đường dẫn tệp minh chứng theo đúng cặp đơn vị/năm học và siết policy Supabase Storage để ngăn truy cập chéo đơn vị.
- Không cho client gọi trực tiếp hàm sinh mã minh chứng hoặc hàm ghi nhật ký tổng quát; các lượt đọc nhạy cảm đi qua RPC có danh sách hành động cho phép.
- Nhật ký chỉ đọc được khi người dùng thuộc đúng đơn vị và có quyền `audit.read`; ứng dụng không còn chèn trực tiếp vào bảng nhật ký.
- Loại bỏ quyền quản trị hệ thống sửa báo cáo nghiệp vụ của đơn vị và chuẩn hóa `search_path` cho toàn bộ hàm `SECURITY DEFINER`.
- Bổ sung CSP, HSTS và các HTTP security header; không phát hành header nhận diện Next.js.
- Migration `017` chỉ được áp dụng sau khi bộ kiểm thử tấn công RLS trong `supabase/tests/017_security_p0_test.sql` chạy đạt trên Supabase thử nghiệm hoặc PostgreSQL cục bộ.

## Sprint 8 - Khóa phiên bản bộ tiêu chuẩn

- Mỗi năm học bắt buộc khóa vào đúng một `bo_tieu_chuan_id`; không được đổi phiên bản sau khi năm học đã phát sinh dữ liệu nghiệp vụ.
- Runtime chỉ đọc tiêu chí, nội dung Mức 1/Mức 2 và cờ bắt buộc từ PostgreSQL qua `v_tieu_chi_nam_hoc`; JSON TT57 chỉ còn là nguồn tạo seed và fixture kiểm tra.
- Các bảng tự đánh giá, phân công, kế hoạch cải tiến và liên kết minh chứng bị chặn nếu tham chiếu tiêu chí ngoài phiên bản của năm học.
- Chỉ minh chứng đã xác minh, chưa hết hiệu lực và thuộc đúng năm học/phiên bản mới được tính vào tự đánh giá và báo cáo.
- Hiệu lực minh chứng của năm học cũ được xét tại ngày kết thúc năm học để báo cáo lịch sử không thay đổi theo ngày hiện tại.
- Tạo năm học kế thừa ánh xạ tự đánh giá sang tiêu chí cùng mã trong phiên bản mới, giữ trạng thái `ke_thua_cho_cap_nhat` và không tự kế thừa minh chứng cũ.
- Migration `018` được kiểm chứng bằng 15 assertion trong `supabase/tests/018_standard_versioning_test.sql` trên Supabase staging sau một lần reset đầy đủ.
- Migration `019` bảo đảm đơn vị mới luôn tạo năm học đầu tiên cùng phiên bản bộ tiêu chuẩn phù hợp loại hình.
- Đã rollout migration `017`-`019` lên production sau khi sao lưu và chạy kiểm tra hậu triển khai.
- Đã hoàn thành UAT kỹ thuật xuyên suốt Giáo viên tạo minh chứng -> Thư ký xác minh -> Hiệu trưởng tự đánh giá -> xuất Mẫu 1; xem biên bản tại `docs/SPRINT-8-ROLLOUT.md`.
- Migration `019` đồng bộ luồng thiết lập đơn vị ban đầu với ràng buộc phiên bản và được kiểm chứng bằng tài khoản Auth chưa thuộc đơn vị.
