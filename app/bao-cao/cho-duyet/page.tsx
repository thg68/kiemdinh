import { ApplicationShell } from "@/components/layout/application-shell";
import { PendingReportsWorkspace } from "@/components/reports/pending-reports-workspace";

export const dynamic = "force-dynamic";

export default function PendingReportsPage() {
  return (
    <ApplicationShell
      active="reports"
      title="Báo cáo chờ duyệt"
      description="Rà soát đúng tệp đã gửi, phê duyệt thành snapshot chính thức hoặc trả lại kèm yêu cầu chỉnh sửa."
    >
      <PendingReportsWorkspace />
    </ApplicationShell>
  );
}
