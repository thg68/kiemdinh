# Changelog

Tài liệu này tóm tắt các quyết định kiến trúc quan trọng qua Sprint 0-12.

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

## Sprint 9 - Transaction ghi dữ liệu và snapshot báo cáo

- Lưu tự đánh giá, gắn/gỡ minh chứng và audit được gộp vào `fn_luu_tu_danh_gia_atomic`; lỗi ở bất kỳ bước nào làm toàn bộ transaction rollback.
- Chuyển năm học hoạt động qua `fn_dat_nam_hoc_dang_hoat_dong` với khóa advisory và unique index để luôn giữ đúng một năm hoạt động.
- Import năm học dùng lô staging có SHA-256, kiểm tra trước khi commit và chống nhập trùng theo `(co_so_id, nam_hoc_id, hash_tep)`.
- Database là nguồn duy nhất xác định mức sẵn sàng báo cáo qua `fn_kiem_tra_san_sang_bao_cao`; cổng phê duyệt không còn phụ thuộc quyết định phía trình duyệt.
- Snapshot báo cáo tăng version, bất biến sau phê duyệt và phải trỏ tới object thật trong bucket `reports` cùng MIME, kích thước và SHA-256.
- Mẫu 2 có đủ nơi nhập sáu phần thuyết minh; thông tin chung và bảng kế hoạch lấy từ dữ liệu năm học để tạo đủ tám phần.
- JSON năm học mang metadata phiên bản và lịch sử snapshot; gói minh chứng ZIP được nén theo stream từ signed URL thay vì giữ toàn bộ tệp trong RAM.

## Sprint 11 - UI/UX và vận hành

- Dùng singleton Supabase browser client; chuẩn hóa lỗi tiếng Việt và chặn lộ PostgREST, SQLSTATE, JWT hoặc stack trace.
- Bổ sung error boundary, Workers Logs có cấu trúc và quy tắc không ghi secret/dữ liệu cá nhân.
- Điều hướng theo vai trò để giảm nhiễu; RLS/RPC tiếp tục là nguồn authorization duy nhất.
- Kiểm tra responsive 320-1440 px, keyboard, focus, form labels, loading và disabled states.
- Tách Cloudflare/Supabase staging, thêm CI deploy staging, production approval gate và rollback.

## Onboarding thành viên và đơn vị

- Đăng ký Auth không còn tự tạo hồ sơ đơn vị hoặc tự cấp vai trò Hiệu trưởng.
- Bổ sung lời mời thành viên theo email, có thời hạn và trạng thái chấp nhận hoặc từ chối.
- Người nhận chỉ được tạo hồ sơ `nguoi_dung` và nhận vai trò sau khi chấp nhận lời mời bằng đúng email đã xác nhận.
- Chỉ Quản trị hệ thống được tạo đơn vị mới; Hiệu trưởng đầu tiên được thiết lập qua lời mời riêng.
- Mọi thao tác mời và chấp nhận đi qua RPC `SECURITY DEFINER`, có kiểm tra quyền và ghi nhật ký.
## Sprint 12 - Cổng phát hành thí điểm

- Gắn cờ `la_du_lieu_demo` tại tầng PostgreSQL và loại dữ liệu demo khỏi nguồn Mẫu 1, Mẫu 2, JSON, XLSX và ZIP.
- Chặn phê duyệt báo cáo tại CSDL nếu năm học còn dữ liệu demo trong minh chứng, tự đánh giá, nhận xét hoặc kế hoạch cải tiến.
- Bổ sung `fn_kiem_tra_du_lieu_thi_diem` để kiểm tra tối thiểu 100 minh chứng thật, đủ 15/15 tiêu chí, 15 mô tả Mức 1 và đủ 7 vai trò.
- Kiểm thử kế thừa năm học mới ở trạng thái `ke_thua_cho_cap_nhat`; không sao chép liên kết minh chứng cũ.
- ZIP minh chứng thử lại có giới hạn khi mạng lỗi hoặc máy chủ trả 5xx; URL hết hạn 4xx dừng ngay và báo lỗi rõ ràng.
- Thêm công cụ đối chiếu Mẫu 1 với JSON nguồn, E2E đăng nhập 7 vai trò và workflow backup -> restore -> verify chỉ dành cho staging.
- Công khai trang quyền riêng tư và tài liệu hóa lưu giữ, xóa, quyền chủ thể, phân quyền và audit.
- Release gate chỉ được đóng sau khi dữ liệu thật, UAT Mẫu 1, 7 tài khoản staging và diễn tập phục hồi đều có bằng chứng đạt.

## Sprint 13 - Khôi phục luồng ghi nghiệp vụ

- Khôi phục quyền INSERT, UPDATE, DELETE cho kế hoạch cải tiến, hội đồng tự đánh giá, thành viên hội đồng và văn bản liên quan.
- Table grant chỉ cho request đi tới RLS; policy theo co_so_id và vai trò vẫn quyết định quyền trên từng dòng.
- Role anon không có quyền ghi trên bốn nhóm dữ liệu này.
- Bổ sung pgTAP kiểm tra CRUD hợp lệ, từ chối giáo viên sửa dữ liệu quản lý và chặn thao tác chéo đơn vị.
