# TT57/2026/TT-BGDĐT - Seed dữ liệu Phụ lục I, II, III

## Nội dung gói

- `tt57-mam-non.json` - Phụ lục I, cơ sở giáo dục mầm non.
- `tt57-pho-thong.json` - Phụ lục II, cơ sở giáo dục phổ thông.
- `tt57-gdtx.json` - Phụ lục III, cơ sở giáo dục thường xuyên.
- `tt57-all.json` - Gộp cả 3 loại hình.
- `validation.json` - Kết quả kiểm tra số lượng bản ghi.

Gói nguồn thật nằm trong `tt57_seed/`. Thư mục `data/tt57/` chỉ dùng làm dữ liệu nguồn để sinh migration và kiểm tra tính toàn vẹn; ứng dụng khi chạy chỉ đọc phiên bản bộ tiêu chuẩn đã khóa trong PostgreSQL.

Migration dùng trong project này: `supabase/migrations/011_seed_tt57_reference_data.sql`.

## Kiểm tra cấu trúc

| Loại hình | Tiêu chuẩn | Tiêu chí | Tiêu chí bắt buộc | Bản ghi mức | Nhóm minh chứng | Chỉ số định lượng tách được |
|---|---:|---:|---:|---:|---:|---:|
| Mầm non | 4 | 15 | 8 | 30 | 15 | 31 |
| Phổ thông | 4 | 15 | 8 | 30 | 15 | 37 |
| GDTX | 4 | 15 | 8 | 30 | 15 | 34 |

Tổng cộng: **45 tiêu chí, 90 bản ghi mức, 45 nhóm minh chứng, 102 chỉ số định lượng được tách từ câu chữ Phụ lục.**

## Nguồn

- Nguồn chính thức xác nhận số hiệu, ngày ban hành, ngày hiệu lực, cơ quan ban hành và PDF đính kèm: Cổng Thông tin điện tử Chính phủ.
- Nội dung Phụ lục được cấu trúc hóa từ bản HTML tiếng Việt của văn bản để thuận tiện cho việc trích xuất dữ liệu.

## Quy tắc chuẩn hóa

1. Mã tiêu chí dùng dạng `1.1` ... `4.3`.
2. 8 tiêu chí bắt buộc: `1.3`, `1.4`, `2.1`, `2.2`, `3.1`, `3.2`, `4.1`, `4.2`.
3. `minh_chung_goi_y`: giữ nguyên nội dung gợi ý của từng dòng trong Phụ lục.
4. `chi_so_dinh_luong`: tách theo dấu chấm phẩy từ cột “Dữ liệu định lượng chính”.
5. Nếu Phụ lục ghi “Không yêu cầu dữ liệu định lượng riêng”, mảng `chi_so_dinh_luong` để trống.
6. Không tự suy diễn `don_vi` hoặc `cong_thuc`; SQL để hai trường này `NULL`.
7. Với Phụ lục III, nguồn HTML hiển thị `TC1.1`; dữ liệu seed chuẩn hóa thành `1.1`.

## Lưu ý trước khi chạy migration

Migration `011_seed_tt57_reference_data.sql` bám theo các bảng/cột đang có trong project:

- `bo_tieu_chuan`
- `tieu_chuan`
- `tieu_chi`
- `muc_tieu_chi`
- `minh_chung_goi_y`
- `chi_so_dinh_luong`

Migration cập nhật các bản ghi khung đã có theo khóa nghiệp vụ, không tạo trùng bộ tiêu chí và không đổi ID của tiêu chí đã được các bảng nghiệp vụ tham chiếu.

## Khuyến nghị

Dùng 3 file JSON làm nguồn nhập liệu có kiểm soát trong repository và coi migration SQL là artifact nạp DB. PostgreSQL là nguồn sự thật duy nhất ở runtime. Khi văn bản được đính chính/sửa đổi, tạo version seed mới thay vì sửa lịch sử dữ liệu cũ.
