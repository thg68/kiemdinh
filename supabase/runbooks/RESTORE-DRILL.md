# Diễn tập khôi phục Supabase

Quy trình này dùng để chứng minh bản sao lưu có thể khôi phục được. Luôn thực hiện trên PostgreSQL cô lập, không chạy trực tiếp vào staging hoặc production.

## Phạm vi bản sao lưu

Bản sao phải bao gồm dữ liệu của các schema `auth`, `public`, `storage` và schema `public`. Ghi lại phiên bản PostgreSQL/Supabase, thời điểm sao lưu và SHA-256 của từng tệp.

Schema nền của `auth` và `storage` phải cùng thời điểm hoặc tương thích với bản sao dữ liệu. Không dùng tùy tiện schema mới hơn vì policy mới có thể phụ thuộc function chưa tồn tại trong bản sao cũ.

## Trình tự khôi phục

1. Tạo PostgreSQL cô lập, cùng major version với nguồn. Không dùng URL staging hoặc production.
2. Kiểm tra SHA-256 của `schema.sql` và `data.sql` trước khi restore.
3. Nạp phần `pre-data` của schema nền Supabase cho `auth` và `storage`.
4. Bảo đảm khóa chính của `auth.users` đã tồn tại trước khi nạp các khóa ngoại của ứng dụng.
5. Nạp schema `public` từ bản sao lưu.
6. Nạp phần `post-data` tương thích của `auth` và `storage`.
7. Nạp `data.sql`. Khi dump có quan hệ vòng, dùng chế độ vô hiệu trigger dành riêng cho phiên restore và bật lại ngay sau đó.
8. Áp dụng lần lượt các migration phát sinh sau thời điểm sao lưu.
9. So sánh số hàng của các bảng trọng yếu giữa nguồn và bản khôi phục: `auth.users`, `co_so_giao_duc`, `nam_hoc`, `tieu_chi`, `muc_tieu_chi`, `minh_chung`, `minh_chung_tieu_chi`, `tu_danh_gia`, `ke_hoach_cai_tien`, `bao_cao`, `storage.objects`.
10. Chạy toàn bộ pgTAP, kiểm tra khóa ngoại, UNIQUE và mọi constraint còn `NOT VALID`.
11. Chỉ công nhận diễn tập thành công khi số hàng khớp, migration chạy hết và toàn bộ kiểm tra bất biến đạt.

## Bằng chứng ngày 2026-09-06

- Bản sao kiểm tra trước migration `054`: `.tmp/remediation-backups/production-pre-054-20260906-193930/`.
- `schema.sql`: `1817F05C8A8335FBAC46C690A0C7CD3C581E5B3A1F367EC5E4D6F220A866052B`.
- `data.sql`: `68DC08C6AE6FA268DD7A38B27F24262CDFBC0E4DB02B721B1EDAF02058DB80FA`.
- Khôi phục thành công trong container cô lập dùng image `public.ecr.aws/supabase/postgres:17.6.1.165`.
- Số hàng của 11 bảng trọng yếu khớp hoàn toàn với nguồn.
- Các migration tiếp theo áp dụng thành công; dữ liệu sai lệch `loai_hinh/cap_hoc` được phát hiện và sửa bằng migration `054`.
- Sau sửa, không còn đơn vị một cấp hoặc bản tự đánh giá lệch cấp; toàn bộ constraint tồn đọng đã được validate.

## Điều cấm

- Không ghi service-role key, JWT, signed URL hoặc dữ liệu nhạy cảm vào log hay tài liệu bằng chứng.
- Không coi file dump có dòng kết thúc hợp lệ là bằng chứng restore thành công.
- Không tự sửa nội dung tự đánh giá hoặc tạo minh chứng giả để làm cho kiểm tra UAT đạt.
