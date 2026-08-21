# Phân Quyền Theo Phụ Lục B

Từ migration `010_permission_hardening_appendix_b.sql`, phân quyền chính được cài ở tầng cơ sở dữ liệu bằng RLS và các hàm kiểm tra quyền.

## Vai trò

| Vai trò | Phạm vi |
|---|---|
| Quản trị hệ thống | Quản lý bộ tiêu chuẩn, cấu hình nền và hỗ trợ kỹ thuật. Không dùng để xem dữ liệu học sinh chi tiết. |
| Hiệu trưởng / Giám đốc | Toàn quyền trong đơn vị, phê duyệt báo cáo, xem dashboard. |
| Chủ tịch Hội đồng TĐG | Phân công, duyệt nội dung, chốt mức. |
| Thư ký Hội đồng | Tổng hợp minh chứng, biên tập báo cáo, xuất báo cáo nháp. |
| Ủy viên / Tổ trưởng | Nhập hiện trạng và minh chứng cho tiêu chí được phân công. |
| Giáo viên | Tải minh chứng trong phạm vi công việc, không xem toàn bộ dữ liệu. |
| Khách chỉ đọc | Chỉ xem báo cáo đã phê duyệt khi cần. |

## Quyết định RLS chính

- `phan_cong_tieu_chi`: chỉ Hiệu trưởng hoặc Chủ tịch Hội đồng được tạo/sửa/xóa phân công.
- `tu_danh_gia`: nhóm quản lý xem toàn bộ; Ủy viên chỉ xem/ghi tiêu chí được phân công; Giáo viên không xem toàn bộ tự đánh giá.
- `minh_chung`: nhóm quản lý xem trong đơn vị; Ủy viên/Giáo viên chỉ xem minh chứng của mình hoặc thuộc tiêu chí được phân công.
- `storage.objects` bucket `evidence`: chỉ đọc được tệp khi metadata minh chứng tương ứng cũng đọc được qua RLS.
- `bao_cao`: Khách chỉ đọc chỉ xem báo cáo có trạng thái đã phê duyệt.
- `bao_cao` và `tu_danh_gia`: trạng thái đã duyệt/chốt chỉ do Hiệu trưởng hoặc Chủ tịch Hội đồng thực hiện.

## Lưu ý

Ứng dụng vẫn có thể ẩn/hiện nút để dễ dùng, nhưng bảo vệ chính nằm ở CSDL. Nếu người dùng gọi trực tiếp API hoặc truy vấn Supabase, RLS vẫn phải từ chối dữ liệu ngoài quyền.
