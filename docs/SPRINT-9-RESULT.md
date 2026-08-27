# Sprint 9 - Transaction ghi dữ liệu và báo cáo

## Phạm vi đã thực hiện

- RPC nguyên tử cho tự đánh giá, liên kết minh chứng và audit.
- RPC nguyên tử chuyển năm học đang hoạt động.
- Import theo lô `upload -> staging -> validate -> preview -> commit`, có hash chống trùng.
- Readiness và approval gate ở PostgreSQL.
- Snapshot báo cáo tăng phiên bản, bất biến và có metadata kiểm tra toàn vẹn.
- Đủ nguồn dữ liệu cho tám phần Mẫu 2.
- JSON có metadata tái dựng và ZIP minh chứng dạng stream.

## Migration

- `020_write_flow_report_transactions.sql`: schema, RLS và RPC chính.
- `021_fix_import_level_cast.sql`: migration bù cho staging đã nhận bản `020` trước lần lint đầu tiên; bản cài mới là no-op.
- `022_report_snapshot_storage_gate.sql`: yêu cầu snapshot thật trong bucket `reports`.
- `023_import_unknown_row_validation.sql`: giữ dòng sai loại trong staging để hiển thị đầy đủ lỗi.
- `024_mau2_write_grants.sql`: cho phép request ghi nội dung Mẫu 2 đi tới lớp RLS.
- `025_import_batch_noop_idempotency.sql`: chạy lại cùng hash chỉ đọc batch cũ, không làm đổi `updated_at`.

Các migration `020`-`025` đã được áp dụng trên Supabase staging. `supabase db lint --linked --level error --fail-on error` trả về không có lỗi schema.

## Kiểm thử

- Unit test TypeScript kiểm tra JSON tái dựng và đọc lại ZIP sinh từ stream.
- pgTAP `020_sprint9_transactions_test.sql` có 24 assertion cho atomic rollback, active year, readiness, approval, snapshot version và import idempotency.
- Máy hiện tại chưa có Docker Desktop nên Supabase CLI chưa chạy được pgTAP dù dùng `--linked`; đây là điều kiện còn thiếu trước khi rollout production.

## Quy tắc vận hành

- Không dùng `service_role` cho import.
- Không phê duyệt báo cáo khi readiness chưa đạt.
- Không sửa hoặc xóa snapshot đã phê duyệt.
- Không rollout migration Sprint 9 lên production trước khi pgTAP chạy đạt trên staging và có backup trước migration.
