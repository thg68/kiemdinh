# Nhập Nội Dung Phụ Lục TT57

Từ Sprint 6, cơ sở dữ liệu đã có đủ khung 4 tiêu chuẩn, 15 tiêu chí và 2 mức cho cả 3 loại hình:

- `mam_non`
- `pho_thong`
- `gdtx`

Các bản ghi này chỉ là khung dữ liệu versioned. Nội dung pháp lý chính thức của từng phụ lục phải được nhập từ văn bản người dùng cung cấp, không tự sinh bằng AI.

## Nguyên tắc nhập

- Giữ nguyên mã tiêu chí: `1.1`, `1.2`, ..., `4.3`.
- Đánh dấu đúng 8 tiêu chí bắt buộc: `1.3`, `1.4`, `2.1`, `2.2`, `3.1`, `3.2`, `4.1`, `4.2`.
- Mỗi tiêu chí có đúng 2 mức trong `muc_tieu_chi`.
- Không hardcode nội dung phụ lục trong mã nguồn.
- Khi chưa có nội dung chính thức, báo cáo phải cảnh báo thiếu dữ liệu.

## Cấu trúc JSON đề xuất

```json
{
  "ma": "1.1",
  "ten": "...",
  "la_bat_buoc": false,
  "loai_hinh": "mam_non",
  "muc_1": { "noi_dung_yeu_cau": "..." },
  "muc_2": { "noi_dung_yeu_cau": "..." },
  "minh_chung_goi_y": ["...", "..."],
  "chi_so_dinh_luong": [
    { "ten_chi_so": "...", "don_vi": "..." }
  ]
}
```

## Trạng thái hiện tại

- Schema đã sẵn sàng cho cả 3 phụ lục.
- Khung dữ liệu đã có đủ số lượng bản ghi cần thiết.
- Nội dung chính thức vẫn cần được nhập từ phụ lục TT57 do người dùng cung cấp.

## Cách kiểm tra nhanh

Sau khi nhập dữ liệu, kiểm tra:

- Mỗi loại hình có 4 tiêu chuẩn.
- Mỗi loại hình có 15 tiêu chí.
- Mỗi tiêu chí có Mức 1 và Mức 2.
- Không còn `noi_dung_yeu_cau` trống với tiêu chí dùng để xuất báo cáo chính thức.
