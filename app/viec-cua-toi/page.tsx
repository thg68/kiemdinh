import { ApplicationShell } from "@/components/layout/application-shell";
import { MyWorkWorkspace } from "@/components/tasks/my-work-workspace";

export const dynamic = "force-dynamic";

export default function MyWorkPage() {
  return (
    <ApplicationShell
      active="work"
      title="Việc của tôi"
      description="Danh sách việc cần xử lý theo vai trò và phạm vi phân công của bạn trong năm học hiện tại."
    >
      <MyWorkWorkspace />
    </ApplicationShell>
  );
}
