import { ApplicationShell } from "@/components/layout/application-shell";
import { ImprovementPlanWorkspace } from "@/components/improvement/improvement-plan-workspace";

export const dynamic = "force-dynamic";

export default function ImprovementPlanPage() {
  return (
    <ApplicationShell
      active="improvement"
      title="Kế hoạch cải tiến"
      description="Nhập và theo dõi các nội dung cải tiến chất lượng dùng trực tiếp cho Mẫu 2."
    >
      <ImprovementPlanWorkspace />
    </ApplicationShell>
  );
}
