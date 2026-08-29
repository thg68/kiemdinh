import { ApplicationShell } from "@/components/layout/application-shell";
import { ApprovedReportsWorkspace } from "@/components/reports/approved-reports-workspace";

export const dynamic = "force-dynamic";

export default function ApprovedReportsPage() {
  return (
    <ApplicationShell
      active="reports"
      title="Báo cáo đã phê duyệt"
      description="Kho chỉ đọc dành cho các snapshot báo cáo chính thức của đơn vị."
    >
      <ApprovedReportsWorkspace />
    </ApplicationShell>
  );
}
