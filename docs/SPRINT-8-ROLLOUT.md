# Sprint 8 - Biên bản triển khai và UAT

Ngày thực hiện: 27/08/2026

## Phạm vi đã triển khai

- Khóa phiên bản bộ tiêu chuẩn theo từng năm học bằng migration `018_standard_versioning.sql`.
- Sửa luồng tạo đơn vị và năm học đầu tiên để luôn gắn đúng phiên bản bộ tiêu chuẩn bằng migration `019_fix_initial_school_year_version.sql`.
- Áp dụng các migration `017`, `018`, `019` lên Supabase production sau khi sao lưu schema và dữ liệu.
- Triển khai ứng dụng lên Cloudflare Workers tại `https://kiemdinh-app.thang-nh.workers.dev/`.

## Kết quả kiểm chứng

- Unit test TypeScript: 14/14 đạt.
- Kiểm thử SQL bảo mật migration `017`: 16/16 đạt.
- Kiểm thử SQL phiên bản migration `018`: 15/15 đạt.
- Kiểm thử tạo đơn vị và năm học migration `019`: 5/5 đạt.
- Kiểm tra production sau migration: không có năm học thiếu bộ tiêu chuẩn, không có sai loại hình và không có liên kết minh chứng khác phiên bản.
- Ma trận quyền staging đạt cho 7 vai trò theo Phụ lục B.
- UAT xuyên suốt trên staging đã đi qua đúng tài khoản và RLS:
  - Giáo viên tạo minh chứng `MC.1.1.01` cho tiêu chí 1.1 được phân công.
  - Thư ký xác minh minh chứng.
  - Hiệu trưởng lưu tự đánh giá Mức 1 có mô tả và minh chứng hợp lệ.
  - Endpoint Mẫu 1 trả tệp DOCX hợp lệ và ghi nhật ký `REPORT_EXPORTED`.
- DOCX UAT có tên tiêu chí thật, mã minh chứng và cảnh báo `CHƯA CÓ DỮ LIỆU` tại các phần còn trống; không có nội dung hiện trạng được tự sinh.

## Điểm chưa được coi là hoàn thành nghiệp vụ

- Dữ liệu UAT là dữ liệu kỹ thuật có nhãn `[UAT]`, không thay thế dữ liệu thật của trường thí điểm.
- Chưa kiểm thử M0-M4 với tối thiểu 100 minh chứng thật và đủ nội dung 15/15 tiêu chí.
- Máy kiểm thử chưa có LibreOffice nên chưa render toàn bộ DOCX thành ảnh để rà soát bố cục từng trang.
- Tên miền `kdclgd.io.vn` chưa hoạt động do nameserver tại nhà đăng ký chưa ủy quyền thành công cho Cloudflare.

## Điều kiện mở sử dụng thực tế

1. Hoàn thành UAT với dữ liệu thật của trường thí điểm và ký xác nhận kết quả.
2. Rà soát trực quan Mẫu 1, Mẫu 2 trên Microsoft Word hoặc LibreOffice.
3. Xoay vòng hoặc xóa toàn bộ tài khoản UAT staging sau nghiệm thu.
4. Hoàn tất nameserver của tên miền và kiểm tra lại đăng nhập, callback email, HTTPS.
5. Chỉ xuất bản báo cáo chính thức khi không còn cảnh báo `CHƯA CÓ DỮ LIỆU` trong các phần bắt buộc.
