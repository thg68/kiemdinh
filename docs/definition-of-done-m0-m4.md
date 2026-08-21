# Kiểm Tra Định Nghĩa Hoàn Thành M0-M4

Tài liệu này ghi lại trạng thái kiểm tra đến Sprint 6.

## M0 - Nền tảng và phân quyền

- Chạy với dữ liệu thật: Đạt một phần. Đã có đăng nhập Supabase, tạo đơn vị và năm học; cần trường thí điểm nhập dữ liệu thật để xác nhận cuối.
- Phân quyền ở tầng CSDL: Đạt. RLS đã bật cho bảng nền tảng và nghiệp vụ; migration `010` siết lại theo Phụ lục B.
- Xử lý rỗng/lỗi: Đạt cơ bản. Màn hình đăng nhập, thiết lập và các module chính có thông báo khi thiếu cấu hình hoặc thiếu dữ liệu.
- Commit Git: Đạt.
- Hướng dẫn sử dụng: Đạt. Xem `docs/huong-dan-hieu-truong.md`, `docs/huong-dan-thu-ky-hoi-dong.md`, `docs/huong-dan-giao-vien.md`.

## M1 - Bộ tiêu chuẩn

- Chạy với dữ liệu thật: Đạt. Migration `011` đã nạp nội dung Phụ lục I, II, III dựa trên gói nguồn `tt57_seed/`, đủ 4 tiêu chuẩn, 15 tiêu chí, 8 tiêu chí bắt buộc và 2 mức cho cả `mam_non`, `pho_thong`, `gdtx`.
- Phân quyền ở tầng CSDL: Đạt. Bảng tham chiếu đọc cho người đã đăng nhập, ghi cho quản trị hệ thống.
- Xử lý rỗng/lỗi: Đạt cơ bản. Khi thiếu nội dung mức, báo cáo cảnh báo thay vì tự bịa.
- Commit Git: Đạt.
- Hướng dẫn sử dụng: Đạt. `docs/nhap-noi-dung-phu-luc-tt57.md` ghi rõ nguồn JSON và nguyên tắc tạo version mới khi văn bản thay đổi.

## M2 - Kho minh chứng

- Chạy với dữ liệu thật: Đạt về luồng, cần trường thí điểm nạp tối thiểu 100 minh chứng để xác nhận vận hành.
- Phân quyền ở tầng CSDL: Đạt. Có RLS, role/permission và kiểm soát giáo viên theo phạm vi công việc/phân công tiêu chí.
- Xử lý rỗng/lỗi: Đạt. Có danh sách rỗng, thông báo lỗi, health check.
- Commit Git: Đạt.
- Hướng dẫn sử dụng: Đạt. Có hướng dẫn cho giáo viên và thư ký.

## M3 - Tự đánh giá

- Chạy với dữ liệu thật: Đạt về chức năng, cần dữ liệu trường thật để xác nhận đủ 15/15 tiêu chí.
- Phân quyền ở tầng CSDL: Đạt. Có RLS và trigger chặn lưu mức khi thiếu minh chứng/mô tả.
- Xử lý rỗng/lỗi: Đạt. Có trạng thái thiếu đơn vị/năm học/tiêu chí/minh chứng.
- Commit Git: Đạt.
- Hướng dẫn sử dụng: Đạt.

## M4 - Xuất báo cáo

- Chạy với dữ liệu thật: Đạt về luồng kỹ thuật; checkpoint chính thức vẫn phụ thuộc dữ liệu thật của trường thí điểm. Dữ liệu `[DEMO]` chỉ dùng trình diễn.
- Phân quyền ở tầng CSDL: Đạt. API xuất báo cáo dùng token người dùng hiện tại và đi qua RLS.
- Xử lý rỗng/lỗi: Đạt. Mẫu 1 chèn cảnh báo đỏ khi thiếu dữ liệu hoặc thiếu mã minh chứng.
- Commit Git: Đạt.
- Hướng dẫn sử dụng: Đạt.

## Điểm Cần Theo Dõi Sau Sprint 6

- Kiểm thử quy trình tạo năm học mới có kế thừa tự đánh giá sang trạng thái `ke_thua_cho_cap_nhat` bằng dữ liệu trường thật.
- Kiểm thử bằng dữ liệu thật của trường thí điểm, không dùng dữ liệu `[DEMO]` để kết luận hoàn thành nghiệp vụ.
- Bổ sung ảnh chụp màn hình vào các tài liệu hướng dẫn.
