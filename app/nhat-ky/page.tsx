import { AuditLogWorkspace } from "@/components/audit/audit-log-workspace";
import { ApplicationShell } from "@/components/layout/application-shell";

export const dynamic = "force-dynamic";

export default function AuditLogPage() {
  return (
    <ApplicationShell
      active="audit"
      title="Nhật ký thao tác"
      description="Theo dõi các thao tác thay đổi và phê duyệt trong phạm vi đơn vị để phục vụ kiểm soát nội bộ."
    >
      <AuditLogWorkspace />
    </ApplicationShell>
  );
}
