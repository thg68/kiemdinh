# Dữ Liệu Phụ Lục TT57

Từ migration `011_seed_tt57_reference_data.sql`, cơ sở dữ liệu đã có dữ liệu thật cho Phụ lục I, II, III:

- `mam_non`
- `pho_thong`
- `gdtx`

Nguồn dữ liệu nằm trong `data/tt57/*.json`. Không hardcode nội dung phụ lục trong mã nguồn TypeScript.

## Nguyên tắc nhập

- Giữ nguyên mã tiêu chí: `1.1`, `1.2`, ..., `4.3`.
- Đánh dấu đúng 8 tiêu chí bắt buộc: `1.3`, `1.4`, `2.1`, `2.2`, `3.1`, `3.2`, `4.1`, `4.2`.
- Mỗi tiêu chí có đúng 2 mức trong `muc_tieu_chi`.
- Không hardcode nội dung phụ lục trong mã nguồn.
- Khi chưa có nội dung chính thức, báo cáo phải cảnh báo thiếu dữ liệu.

## Cấu trúc JSON đang dùng

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

- `data/tt57/tt57-all.json` gộp cả 3 loại hình.
- `data/tt57/validation.json` ghi số lượng kiểm tra.
- Unit test `data/tt57/tt57-reference-data.test.ts` xác nhận đủ 4-15-8, 90 bản ghi mức và 102 chỉ số định lượng.
- Nếu TT57 được đính chính/sửa đổi, tạo version dữ liệu mới thay vì sửa lịch sử migration cũ.

## Cách kiểm tra nhanh

Sau khi cập nhật dữ liệu hoặc tạo version mới, kiểm tra:

- Mỗi loại hình có 4 tiêu chuẩn.
- Mỗi loại hình có 15 tiêu chí.
- Mỗi tiêu chí có Mức 1 và Mức 2.
- Không còn `noi_dung_yeu_cau` trống với tiêu chí dùng để xuất báo cáo chính thức.
