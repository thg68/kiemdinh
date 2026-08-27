# Hướng Dẫn Import Dữ Liệu Trường Thí Điểm

Mục tiêu Sprint 5: nhập tối thiểu 100 minh chứng và đủ 15/15 tiêu chí có nội dung cho một năm học thật. Dữ liệu này phải đến từ hồ sơ vận hành thật của trường, không dùng dữ liệu `[DEMO]`.

## Nguồn Dữ Liệu

- Excel/CSV: dùng làm manifest điều phối import.
- Word `.docx`: dùng để lấy mô tả hiện trạng nếu trường đã soạn nội dung trong Word.
- Thư mục tệp minh chứng: PDF, DOCX, XLSX, ảnh, hoặc tệp khác.
- Nhập tay: dùng giao diện `/minh-chung`, `/tu-danh-gia`, `/bao-cao` cho các trường hợp cần rà soát kỹ.

## Chuẩn Bị

1. Đăng nhập ứng dụng bằng tài khoản Hiệu trưởng/Chủ tịch hội đồng/Thư ký của trường.
2. Vào `/thiet-lap`, bảo đảm đã có cơ sở giáo dục và năm học đang hoạt động.
3. Chuẩn bị thư mục minh chứng trên máy, ví dụ `C:\du-lieu-truong\minh-chung`.
4. Sao chép `data/import-manifest.example.csv` thành file làm việc riêng, ví dụ `C:\du-lieu-truong\manifest.csv`.
5. Điền manifest bằng dữ liệu thật.

## Biến Môi Trường

Giữ `.env.local` cho URL và anon key Supabase. Không đưa service role key vào script import.

Trong PowerShell, đặt tài khoản import:

```powershell
$env:SUPABASE_IMPORT_EMAIL="email-cua-tai-khoan-truong@example.com"
$env:SUPABASE_IMPORT_PASSWORD="mat-khau"
```

## Cấu Trúc Manifest

Các loại dòng trong cột `loai_dong`:

- `evidence`: tạo minh chứng, upload tệp nếu có `file_path`, gắn vào một hoặc nhiều tiêu chí trong `ma_tieu_chi`.
- `assessment`: nhập tự đánh giá cho một tiêu chí; có thể lấy nội dung từ `word_path`.
- `standard_note`: nhập Điểm mạnh/Hạn chế/Định hướng cải tiến cho một tiêu chuẩn.
- `plan`: nhập dòng kế hoạch cải tiến chất lượng cho Mẫu 2.

Với `evidence`, nếu một minh chứng dùng cho nhiều tiêu chí, ghi `ma_tieu_chi` dạng:

```text
1.1;1.3;4.3
```

Script sẽ tạo một mã minh chứng duy nhất theo tiêu chí đầu tiên, các tiêu chí sau chỉ tham chiếu lại mã đó.

## Chạy Thử

Chạy dry-run trước để kiểm tra manifest:

```powershell
npm run import:school-year -- --manifest="C:\du-lieu-truong\manifest.csv" --dry-run=true
```

Tải vào staging và xem kết quả kiểm tra; bước này chưa ghi bảng nghiệp vụ:

```powershell
npm run import:school-year -- --manifest="C:\du-lieu-truong\manifest.csv"
```

Chỉ khi kết quả có `ready: true`, commit toàn bộ lô trong một transaction:

```powershell
npm run import:school-year -- --manifest="C:\du-lieu-truong\manifest.csv" --commit=true
```

Nếu một dòng lỗi, toàn bộ lô giữ ở staging và không có bản ghi nghiệp vụ nào được tạo. Chạy lại cùng file đã commit là thao tác không gây trùng dữ liệu.

## Kiểm Tra Sau Import

- Vào `/minh-chung`, lọc theo năm học, kiểm tra số lượng minh chứng.
- Vào `/minh-chung/suc-khoe`, kiểm tra minh chứng trùng, hết hạn, mồ côi, tiêu chí rỗng.
- Vào `/tu-danh-gia`, kiểm tra 15/15 tiêu chí có mô tả và mã minh chứng.
- Vào `/bao-cao`, nhập/rà soát nhận xét theo tiêu chuẩn.
- Xuất Mẫu 1 `.docx`; nếu còn cảnh báo đỏ thì chưa đạt checkpoint Sprint 4.

## Lưu Ý An Toàn

- Không import dữ liệu Đỏ chi tiết của học sinh vào ứng dụng ở giai đoạn này.
- Với hồ sơ sức khỏe, tâm lý, khuyết tật, sự cố an toàn, chỉ nhập dạng chỉ mục: có/không, ai giữ, ở đâu, ngày nào.
- Script dùng tài khoản đăng nhập thật và đi qua RLS, nên nếu bị từ chối quyền thì cần sửa phân quyền/phân công, không dùng service role để bỏ qua.
