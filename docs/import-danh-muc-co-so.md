# Nhập danh mục cơ sở giáo dục từ Excel

Chức năng này dành cho **Quản trị hệ thống** tại `/quan-tri/co-so`. Nó nhập danh mục trường để quản trị viên rà soát và kích hoạt. Dữ liệu năm học, tự đánh giá và minh chứng được nhập bằng quy trình riêng.

## Chuẩn bị file

Tải file mẫu `.xlsx` ngay trên trang **Cơ sở giáo dục**. Điền dữ liệu vào trang tính **Danh mục trường**, giữ nguyên dòng tiêu đề:

| Cột | Yêu cầu |
| --- | --- |
| Mã trường | Bắt buộc; lưu dạng văn bản để giữ số 0 đầu mã. |
| Tên trường | Bắt buộc. |
| Tỉnh/Thành | Bắt buộc; dùng tên trong danh mục. Chấp nhận thêm dạng `Thành phố Hà Nội`, `TP. Hồ Chí Minh`, `Tỉnh Quảng Ninh` hoặc mã tỉnh hai chữ số như `22`. File mẫu liệt kê đủ 34 tỉnh/thành. |
| Phường/Xã | Có thể để trống. |
| Loại hình | Bắt buộc: `Mầm non`, `Phổ thông` hoặc `GDTX`. |
| Cấp học | Bắt buộc: `Mầm non`, `Tiểu học`, `THCS`, `THPT` hoặc `GDTX`. Trường nhiều cấp ghi các cấp cách nhau bằng dấu phẩy. |
| Địa chỉ | Có thể để trống. |
| Công lập | Có thể để trống; nếu điền dùng `Có` hoặc `Không`. |

Không đưa công thức, thông tin học sinh, mật khẩu hoặc dữ liệu cá nhân vào file danh mục trường.

## Nhập và kiểm tra

1. Chọn file `.xlsx` và bấm **Xem trước**.
2. Xem tổng số dòng mới, mã trường đã tồn tại và dòng lỗi. Mỗi lỗi có số dòng để sửa trong Excel.
3. Chỉ khi file hợp lệ, bấm **Xác nhận nhập**. Hệ thống kiểm tra lại file trước khi ghi.
4. Kiểm tra danh sách trường vừa tạo, rà soát thông tin và kích hoạt từng trường khi sẵn sàng. Trường mới chưa tự động có năm học hoặc cho phép tự đăng ký.

Mã trường đã có sẽ được bỏ qua; import không ghi đè dữ liệu của trường đang vận hành. Nhập lại cùng file không tạo trường trùng. Nếu file thay đổi sau khi xem trước, hãy xem trước lại trước khi xác nhận.

Để nhập minh chứng và nội dung tự đánh giá của một năm học, dùng [hướng dẫn import dữ liệu năm học](import-du-lieu-truong-that.md).
