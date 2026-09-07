# Luồng màn hình theo vai trò

Tài liệu này ghi lại các màn hình đã bổ sung sau đợt rà soát UI/UX theo phân quyền Phụ lục B. Mục tiêu là để mỗi quyền nghiệp vụ đều có nơi thao tác rõ ràng trong giao diện, không phụ thuộc vào việc người dùng nhớ đường dẫn.

## Hiệu trưởng / Giám đốc

- `/dashboard`: xem điểm vào chung và các nhóm việc chính.
- `/viec-cua-toi`: xem các hàng chờ xử lý trong đơn vị.
- `/thiet-lap`: quản lý người dùng, vai trò, năm học và phân công tiêu chí.
- `/hoi-dong-tu-danh-gia`: lập hội đồng, thêm thành viên, chuẩn bị danh sách ký trong Mẫu 1.
- `/bao-cao`: xuất file và cập nhật trạng thái báo cáo.
- `/bao-cao/da-phe-duyet`: xem báo cáo đã chốt.
- `/nhat-ky`: rà soát thao tác ghi và xác minh minh chứng theo RLS; thao tác xem không được lưu.

## Chủ tịch Hội đồng TĐG

- `/viec-cua-toi`: theo dõi tiêu chí, minh chứng và nội dung chờ duyệt.
- `/tu-danh-gia/cho-duyet`: duyệt hoặc trả về rà soát từng tiêu chí.
- `/thiet-lap`: phân công phạm vi tiêu chí nếu có quyền.
- `/hoi-dong-tu-danh-gia`: quản lý thông tin hội đồng.
- `/ke-hoach-cai-tien`: theo dõi các nội dung cải tiến sau tự đánh giá.

## Thư ký Hội đồng

- `/bo-tieu-chuan`: tra cứu nội dung TT57 theo đúng loại hình của đơn vị.
- `/minh-chung`: quản lý kho minh chứng và gắn nhiều tiêu chí cho một mã.
- `/minh-chung/xac-minh`: xác minh hoặc từ chối minh chứng.
- `/bao-cao`: nhập nhận xét theo tiêu chuẩn, xuất Mẫu 1, Mẫu 2 và các file bổ trợ.
- `/van-ban-lien-quan`: nhập căn cứ pháp lý ngoài TT57 do nhà trường tự quản lý.

## Ủy viên / Tổ trưởng

- `/viec-cua-toi`: xem tiêu chí được phân công.
- `/minh-chung`: nộp minh chứng trong phạm vi được phân công.
- `/tu-danh-gia`: nhập hiện trạng và gắn mã minh chứng cho tiêu chí được phân công.

## Giáo viên

- `/viec-cua-toi`: xem phần việc và tiêu chí được phân công.
- `/bo-tieu-chuan`: tra cứu nội dung tiêu chí.
- `/minh-chung`: tải lên và quản lý minh chứng thuộc phạm vi công việc; không được vào màn hình Tự đánh giá.

## Khách chỉ đọc

- `/bao-cao/da-phe-duyet`: xem báo cáo đã phê duyệt nếu RLS cho phép.

## Ghi chú kiểm soát

- Các màn hình nghiệp vụ chỉ là lớp giao diện. Quyền đọc/ghi vẫn phải được kiểm soát bằng RLS hoặc RPC ở Supabase.
- Các dữ liệu ngoài TT57 không được hardcode trong mã nguồn. Nhà trường tự nhập tại `/van-ban-lien-quan`.
- Nếu bổ sung vai trò hoặc quyền mới, cần cập nhật đồng thời: migration phân quyền, navigation, tài liệu này và checklist kiểm thử thủ công.
- Ma trận đầy đủ được kiểm tra tự động với mã nguồn tại `docs/MATRAN-NANG-LUC-VAI-TRO.md`.
