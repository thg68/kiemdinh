import { AssessmentWorkspace } from "@/components/assessment/assessment-workspace";
import { ApplicationShell } from "@/components/layout/application-shell";

export const dynamic = "force-dynamic";

export default function SelfAssessmentPage() {
  return (
    <ApplicationShell
      active="assessment"
      title="Tự đánh giá"
      description="Nhập hiện trạng theo tiêu chí, gắn mã minh chứng có thật và xem ngay khoảng cách để đạt mức tiếp theo."
    >
      <AssessmentWorkspace />
    </ApplicationShell>
  );
}
