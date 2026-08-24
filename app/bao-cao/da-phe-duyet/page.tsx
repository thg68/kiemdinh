import { ApplicationShell } from "@/components/layout/application-shell";
import { ApprovedReportsWorkspace } from "@/components/reports/approved-reports-workspace";

export const dynamic = "force-dynamic";

export default function ApprovedReportsPage() {
  return (
    <ApplicationShell
      active="reports"
      title="Báo cáo đã phê duyệt"
      description="Không gian chỉ đọc cho các báo cáo đã được chốt, phù hợp với vai trò khách hoặc đoàn thẩm định khi cần."
    >
      <ApprovedReportsWorkspace />
    </ApplicationShell>
  );
}
