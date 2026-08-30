# Kết quả Sprint 12

**Trạng thái mã nguồn:** Đã xác minh trên Supabase local.

**Trạng thái release gate:** Chưa đạt cho đến khi chạy bằng dữ liệu trường thật và staging.

## Bằng chứng tự động trong repository

- Migration `033` cô lập dữ liệu demo và chặn báo cáo đã phê duyệt nếu năm học còn demo.
- RPC `fn_kiem_tra_du_lieu_thi_diem` kiểm tra 100 minh chứng, 15/15 tiêu chí, 15 mô tả và 7 vai trò.
- pgTAP kiểm tra release gate, báo cáo demo và kế thừa năm học.
- E2E tùy chọn kiểm tra đăng nhập riêng của đủ 7 vai trò.
- ZIP có retry giới hạn cho lỗi mạng/5xx và không retry 403 do URL hết hạn.
- Công cụ đối chiếu Mẫu 1 với JSON nguồn.
- Workflow dump → restore → verify chỉ chạy trên staging và không lưu dump thành artifact.
- Tài liệu dữ liệu, xóa, quyền chủ thể, quyền riêng tư, truy cập và audit.

## Việc phải chạy bằng dữ liệu thật

| Hạng mục | Trạng thái | Bằng chứng cần có |
| --- | --- | --- |
| 100 minh chứng, 15/15 tiêu chí | Chưa xác nhận | JSON đầu ra `check:pilot` |
| 7 tài khoản vai trò | Chưa xác nhận | Playwright report staging |
| Tạo năm học mới | Chưa xác nhận UAT | Biên bản kiểm tra kế thừa |
| Mẫu 1 | Chưa đối chiếu thủ công | DOCX, JSON và biên bản ký |
| Backup/restore staging | Chưa chạy | Log workflow thành công |
| Đầu mối quyền riêng tư/thời hạn lưu trữ | Chưa cấu hình | Quyết định của đơn vị |

Không dùng dữ liệu do AI tạo để đóng các mục trên.

## Kết quả kiểm tra local

- Replay toàn bộ migration `001` đến `033`: đạt.
- pgTAP/RLS: 13 tệp, 237 kiểm tra, đạt.
- Vitest: 13 tệp, 64 kiểm tra, đạt.
- TypeScript: đạt.
- Release gate staging vẫn mở; không dùng kết quả local thay cho dữ liệu trường thật.