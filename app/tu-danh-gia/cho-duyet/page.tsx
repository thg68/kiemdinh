import { AssessmentApprovalWorkspace } from "@/components/assessment/assessment-approval-workspace";
import { ApplicationShell } from "@/components/layout/application-shell";

export const dynamic = "force-dynamic";

export default function AssessmentApprovalPage() {
  return (
    <ApplicationShell
      active="assessment"
      title="Tự đánh giá chờ duyệt"
      description="Hàng đợi các tiêu chí đã gửi duyệt để Hiệu trưởng hoặc Chủ tịch hội đồng xem xét và chốt mức."
    >
      <AssessmentApprovalWorkspace />
    </ApplicationShell>
  );
}
