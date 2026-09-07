# Sprint 12 - Hướng dẫn pilot và release gate

## 1. Điều kiện đầu vào

- Một Supabase staging tách biệt production.
- Một năm học chứa dữ liệu vận hành thật của trường thí điểm.
- Tối thiểu 100 minh chứng không mang cờ demo.
- Đủ 15/15 tiêu chí có minh chứng và mô tả hiện trạng.
- Bảy tài khoản staging riêng cho bảy vai trò.
- Người có thẩm quyền cho phép diễn tập backup/restore staging.

Không dùng dữ liệu học sinh thuộc nhóm Đỏ trong manifest hoặc file E2E.

### Tài khoản kiểm thử vai trò

Workflow tự tạo/cập nhật bảy tài khoản trong tenant `UAT-STAGING-01` bằng
`npm run provision:e2e:staging`. Cần cấu hình GitHub Environment `staging`:

- `STAGING_SUPABASE_URL`, `STAGING_SUPABASE_ANON_KEY`.
- `STAGING_SUPABASE_SERVICE_ROLE_KEY` chỉ dành cho job provision, không đưa vào Worker.
- `PRODUCTION_SUPABASE_URL` để script từ chối nếu trỏ nhầm production.
- Cặp `E2E_<ROLE>_EMAIL` và `E2E_<ROLE>_PASSWORD` cho đủ bảy vai trò.

Script chỉ chạy khi có `E2E_ALLOW_STAGING_PROVISION=true`, không in mật khẩu hoặc
service-role key ra log, và có thể chạy lại mà không tạo trùng tài khoản.

## 2. Kiểm tra dataset

Cấu hình tài khoản Hiệu trưởng staging trong biến môi trường, không commit mật khẩu:

```text
PILOT_AUDIT_EMAIL
PILOT_AUDIT_PASSWORD
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Chạy:

```bash
npm run check:pilot -- --year=<UUID_NAM_HOC> --cap-hoc=mam_non
```

Lệnh trả mã thoát `2` nếu thiếu 100 minh chứng, thiếu tiêu chí, còn demo hoặc thiếu vai trò.

## 3. Đối chiếu Mẫu 1

1. Xuất JSON năm học và Mẫu 1 từ cùng đơn vị, năm học, cấp học.
2. Chạy:

```bash
npm run verify:mau1 -- --docx=<MAU_1.docx> --json=<DU_LIEU_NAM_HOC.json>
```

3. Mở DOCX và kiểm tra thủ công bìa, danh sách hội đồng, mục lục, ngắt trang, bảng và chữ ký.
4. Người rà soát ký vào biên bản UAT trước khi Hiệu trưởng phê duyệt snapshot.

Công cụ tự động đối chiếu 15 tiêu chí, mô tả hiện trạng, mã minh chứng và chặn nhãn `[DEMO]`; nó không thay thế việc đọc nội dung nghiệp vụ.

## 4. Năm học mới

- Tạo năm mới bằng RPC kế thừa trên màn hình Cài đặt.
- Xác nhận đủ 15 bản ghi có trạng thái `ke_thua_cho_cap_nhat`.
- Mức đạt phải trở về 0 và cần rà soát lại.
- Minh chứng cũ, kể cả đã sửa, từ chối, hết hạn hoặc xóa, không tự động gắn sang năm mới.
- Chỉ dùng lại minh chứng sau khi người có trách nhiệm xác nhận còn giá trị và gắn lại đúng năm học.

## 5. Failure testing

- ZIP 100 tệp: kiểm tra mở được và đủ danh mục.
- Signed URL hết hạn: phải trả lỗi, không mở file công khai.
- Mạng gián đoạn/5xx: tải tệp thử lại tối đa ba lần.
- 403/404: không thử lại mù quáng.
- Export thất bại: không được tạo snapshot đã phê duyệt.
- API lỗi một phần: transaction phải rollback, không để dữ liệu dở dang.

## 6. Backup/restore staging

Chạy workflow **Sprint 12 pilot release gate** và xác nhận quyền diễn tập. Workflow:

1. Replay toàn bộ migration trên Supabase local.
2. Chạy pgTAP.
3. Provision tenant cùng bảy tài khoản UAT staging.
4. Chạy đúng 18 phép thử đăng nhập, capability, URL trực tiếp và RLS; thiếu secret phải fail, không skip.
5. Dump staging sang tệp tạm.
6. Restore vào Supabase local.
7. So sánh số lượng bảng lõi và chạy hậu kiểm.
8. Xóa tệp dump ngay cả khi job thất bại.

Không tải database dump lên GitHub artifact.

## 7. Quyết định phát hành

Chỉ đánh dấu production-ready khi:

- Critical = 0.
- High = 0.
- Medium có mô tả, ảnh hưởng, biện pháp giảm thiểu, người phụ trách và ngày xử lý.
- Dataset gate, 7 role E2E, backup/restore và UAT Mẫu 1 đều có log/bằng chứng.
