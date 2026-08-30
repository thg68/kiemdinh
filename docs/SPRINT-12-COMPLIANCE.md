# Chính sách dữ liệu và quyền riêng tư

## Phạm vi

Tài liệu này áp dụng cho dữ liệu M0-M4 của PDT Quality. Thông tư 57 là nguồn nghiệp vụ đã được người dùng xác minh. Thời hạn lưu trữ pháp lý cụ thể ngoài TT57 chưa được xác định trong tài liệu nguồn, vì vậy nhà trường phải phê duyệt thời hạn trước khi cấu hình xóa.

## 1. Lưu trữ dữ liệu

- Bộ tiêu chuẩn và snapshot báo cáo đã phê duyệt được giữ theo phiên bản để tái lập lịch sử.
- Minh chứng được giữ theo năm học và đơn vị; file nằm trong Storage private.
- Nhật ký chỉ ghi hành động ghi và phê duyệt/xác minh cần truy vết, không ghi lượt đọc thông thường.
- Không tự động xóa dữ liệu khi chưa có quyết định lưu trữ của đơn vị.
- Bản sao tạm từ diễn tập backup phải xóa ngay khi đối chiếu xong.

Chủ sở hữu chính sách của đơn vị phải điền: thời hạn minh chứng, thời hạn nhật ký, thời hạn tài khoản ngừng hoạt động và quy trình tiêu hủy bản sao lưu.

## 2. Xóa dữ liệu

1. Người có thẩm quyền xác định phạm vi đơn vị, năm học và căn cứ xóa.
2. Xuất JSON/danh mục cần lưu nếu chính sách yêu cầu.
3. Kiểm tra ràng buộc báo cáo đã phê duyệt; snapshot chính thức không được ghi đè hoặc xóa bằng thao tác người dùng thông thường.
4. Xóa hoặc ẩn danh dữ liệu theo quy trình quản trị, không dùng service role để bỏ qua phê duyệt.
5. Ghi nhật ký yêu cầu, người duyệt, phạm vi và kết quả.
6. Xác nhận tệp Storage và bản ghi CSDL đã được xử lý đồng bộ.

Hiện hệ thống chưa có chức năng “xóa toàn bộ đơn vị” một nút. Việc offboarding tenant cần runbook riêng và hai người phê duyệt trước khi triển khai production.

## 3. Quyền của chủ thể dữ liệu

Người dùng có thể yêu cầu: biết dữ liệu tài khoản đang lưu, sửa thông tin sai, ngừng tài khoản, xuất dữ liệu thuộc phạm vi được phép và yêu cầu xóa khi không bị nghĩa vụ lưu trữ hoặc snapshot bất biến ngăn cản.

Yêu cầu phải được xác minh danh tính và chuyển cho Hiệu trưởng/Giám đốc hoặc người được ủy quyền. Kết quả xử lý phải nêu rõ dữ liệu đã sửa/xóa, dữ liệu phải giữ và lý do.

## 4. Dữ liệu nhạy cảm

Nội dung chi tiết về nhân thân, sức khỏe, tâm lý, khuyết tật, sự cố an toàn hoặc bạo lực học đường không được lưu trong giai đoạn hiện tại và không được gửi tới API AI/dịch vụ ngoài. Chỉ lưu chỉ mục: có hay không, người giữ, vị trí và ngày hồ sơ.

## 5. Thông báo quyền riêng tư

Hệ thống xử lý thông tin tài khoản, phân quyền, minh chứng nhà trường, tự đánh giá, kế hoạch cải tiến và báo cáo để phục vụ quản trị chất lượng. Dữ liệu được giới hạn theo đơn vị và năm học bằng RLS. File private chỉ mở bằng liên kết có thời hạn. Người dùng không được tải dữ liệu ngoài phạm vi công việc hoặc chia sẻ signed URL.

Đầu mối tiếp nhận yêu cầu quyền riêng tư, thời hạn phản hồi và thông tin đơn vị quản lý dữ liệu: **chưa được xác định trong tài liệu; phải cấu hình trước release gate**.

## 6. Kiểm soát truy cập

Bảy vai trò và quyền chi tiết được mô tả tại [Phân quyền Phụ lục B](../phan-quyen-phu-luc-b.md). Giao diện theo vai trò chỉ hỗ trợ thao tác; RLS/RPC tại PostgreSQL là nguồn quyết định quyền.

Tài khoản phải là tài khoản cá nhân, không dùng chung. Vai trò được cấp qua lời mời hoặc người có quyền quản lý thành viên. Khi người dùng chuyển công tác, tài khoản phải ngừng hoạt động và thu hồi vai trò.

## 7. Chính sách nhật ký

Ghi nhật ký cho thao tác tạo/sửa/xóa dữ liệu nghiệp vụ và phê duyệt/xác minh. Không ghi lượt xem thông thường. Nhật ký tối thiểu gồm actor, tenant, hành động, đối tượng, thời điểm và metadata kỹ thuật cần thiết.

Không ghi mật khẩu, JWT, secret, nội dung hồ sơ Đỏ hoặc nội dung file. Người dùng không được chèn/sửa/xóa trực tiếp nhật ký. Chỉ vai trò có `audit.read` trong đúng tenant mới được đọc.
