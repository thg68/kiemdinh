# Sprint 15 - An toàn kho tệp minh chứng

## Mục tiêu

Sprint 15 bảo đảm một mã minh chứng chỉ được cấp sau khi tệp thật trong Storage đã được kiểm tra và đối chiếu với dữ liệu sẽ ghi vào PostgreSQL. Các lượt tải tệp bị gián đoạn có thể được phát hiện và dọn an toàn, không tạo bản ghi minh chứng mồ côi.

## Luồng hoàn tất minh chứng

1. Trình duyệt kiểm tra tên tệp, phần mở rộng, MIME và giới hạn 25 MB trước khi tải.
2. Tệp được tải vào bucket private `evidence`, theo đường dẫn `<co_so_id>/<nam_hoc_id>/<uuid>.<ext>`.
3. API `/api/minh-chung/finalize` xác thực lại người dùng, tải object vừa tạo và kiểm tra nội dung ở phía máy chủ.
4. Máy chủ nhận diện chữ ký PDF, ảnh, Word/Excel cũ hoặc cấu trúc OOXML của DOCX/XLSX; đồng thời tự tính SHA-256 và kích thước.
5. RPC `fn_tao_minh_chung` khóa object để đối chiếu chủ sở hữu, đơn vị, năm học, MIME, kích thước, SHA-256 và ngày hiệu lực.
6. Chỉ sau khi mọi kiểm tra đạt, hệ thống mới sinh mã `MC.x.y.zz`, tạo minh chứng và các liên kết nhiều-nhiều với tiêu chí.
7. Nếu API hoàn tất thất bại, trình duyệt thử xóa object vừa tải. Object còn sót lại được liệt kê tại trang **Kiểm tra sức khỏe minh chứng** sau 60 phút.

## Giới hạn tệp

- Dung lượng: từ 1 byte đến 25 MiB.
- Định dạng: PDF, DOC, DOCX, XLS, XLSX, CSV, TXT, JPG/JPEG, PNG và WebP.
- Bucket `evidence` luôn private; ứng dụng chỉ mở tệp bằng signed URL có thời hạn.
- Tên object chỉ chứa ký tự an toàn và luôn nằm đúng thư mục đơn vị/năm học.

## Phân quyền và nhật ký

- Người dùng chỉ tải tệp vào đơn vị và năm học của mình; quyền tạo minh chứng vẫn chịu kiểm tra phân công tiêu chí.
- Chỉ người có quyền `evidence.delete` thấy danh sách và nút dọn object tải lỗi.
- Policy DELETE kiểm tra lại object chưa liên kết với minh chứng ngay tại thời điểm xóa.
- Mỗi đợt dọn thành công được ghi bằng hành động `EVIDENCE_ORPHAN_STORAGE_CLEANED`.

## Thành phần chính

- Migration: `supabase/migrations/036_sprint15_storage_hardening.sql`.
- pgTAP: `supabase/tests/037_sprint15_storage_hardening_test.sql`.
- API hoàn tất: `app/api/minh-chung/finalize/route.ts`.
- API dọn tệp lỗi: `app/api/minh-chung/orphans/route.ts`.
- Kiểm tra nội dung tệp: `lib/evidence-inspection.ts`.
- Giao diện vận hành: `components/evidence/storage-orphan-maintenance.tsx`.

## Kết quả kiểm thử

- PostgreSQL/RLS: 16 file, 288 assertion đạt.
- Unit/integration: 17 file, 83 test đạt bằng `npm test -- --run`.
- ESLint: đạt.
- TypeScript: đạt.
- Production build Next.js: đạt.

Không sử dụng dữ liệu minh chứng giả để xác nhận luồng nghiệp vụ. Kiểm thử tự động chỉ tạo fixture cô lập trong transaction và rollback sau khi chạy.
