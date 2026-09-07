# Ma trận năng lực theo vai trò

Đây là bảng tham chiếu duy nhất cho quyền hiển thị trang và hành động trên giao diện. PostgreSQL RLS/RPC vẫn là lớp bắt buộc cuối cùng. Unit test đối chiếu từng dòng capability dưới đây với `lib/auth/capabilities.ts`.

## Mã vai trò

| Mã | Vai trò |
|---|---|
| SYSTEM_ADMIN | Quản trị hệ thống PDT |
| PRINCIPAL | Hiệu trưởng / Giám đốc |
| SELF_ASSESSMENT_CHAIR | Chủ tịch Hội đồng TĐG |
| SECRETARY | Thư ký Hội đồng |
| MEMBER | Ủy viên / Tổ trưởng |
| TEACHER | Giáo viên |
| VIEWER | Khách chỉ đọc |

## Quyền trang

| Capability | Vai trò được phép |
|---|---|
| `page.dashboard` | PRINCIPAL, SELF_ASSESSMENT_CHAIR, SECRETARY |
| `page.work` | PRINCIPAL, SELF_ASSESSMENT_CHAIR, SECRETARY, MEMBER, TEACHER |
| `page.standards` | SYSTEM_ADMIN, PRINCIPAL, SELF_ASSESSMENT_CHAIR, SECRETARY, MEMBER, TEACHER |
| `page.evidence` | PRINCIPAL, SELF_ASSESSMENT_CHAIR, SECRETARY, MEMBER, TEACHER |
| `page.evidence.health` | PRINCIPAL, SELF_ASSESSMENT_CHAIR, SECRETARY |
| `page.evidence.verify` | PRINCIPAL, SELF_ASSESSMENT_CHAIR, SECRETARY |
| `page.assessment` | PRINCIPAL, SELF_ASSESSMENT_CHAIR, SECRETARY, MEMBER |
| `page.assessment.approve` | PRINCIPAL, SELF_ASSESSMENT_CHAIR |
| `page.improvement` | PRINCIPAL, SELF_ASSESSMENT_CHAIR, SECRETARY |
| `page.council` | PRINCIPAL, SELF_ASSESSMENT_CHAIR |
| `page.reports` | PRINCIPAL, SELF_ASSESSMENT_CHAIR, SECRETARY |
| `page.approved_reports` | PRINCIPAL, SELF_ASSESSMENT_CHAIR, SECRETARY, VIEWER |
| `page.legal` | PRINCIPAL, SELF_ASSESSMENT_CHAIR, SECRETARY |
| `page.audit` | PRINCIPAL |
| `page.settings` | SYSTEM_ADMIN, PRINCIPAL, SELF_ASSESSMENT_CHAIR |

## Quyền hành động

| Capability | Vai trò được phép |
|---|---|
| `action.evidence.verify` | PRINCIPAL, SELF_ASSESSMENT_CHAIR, SECRETARY |
| `action.assessment.approve` | PRINCIPAL, SELF_ASSESSMENT_CHAIR |
| `action.assessment.simulate` | PRINCIPAL, SELF_ASSESSMENT_CHAIR, SECRETARY |
| `action.council.manage` | PRINCIPAL, SELF_ASSESSMENT_CHAIR |
| `action.report.export` | PRINCIPAL, SELF_ASSESSMENT_CHAIR, SECRETARY |
| `action.report.approve` | PRINCIPAL, SELF_ASSESSMENT_CHAIR |

## Quy tắc sử dụng

- Không suy quyền từ việc nhìn thấy một nút hoặc biết URL.
- Giáo viên chỉ nộp minh chứng trong phạm vi công việc, không nhập hoặc duyệt Tự đánh giá.
- Thư ký có thể tổng hợp, xác minh minh chứng và xuất bản nháp; không phê duyệt báo cáo và không quản lý thành viên hội đồng.
- Khách chỉ đọc chỉ vào kho báo cáo đã phê duyệt.
- Quản trị hệ thống quản lý bộ tiêu chuẩn và thiết lập đơn vị; vai trò này không thay thế vai trò quản trị nghiệp vụ của nhà trường.
