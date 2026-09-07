import { CouncilWorkspace } from "@/components/council/council-workspace";
import { ApplicationShell } from "@/components/layout/application-shell";

export const dynamic = "force-dynamic";

export default function CouncilPage() {
  return (
    <ApplicationShell
      active="council"
      title="Hội đồng tự đánh giá"
      description={"Quản lý thông tin hội đồng, quyết định thành lập và danh sách thành viên dùng trong Mẫu\u00a01."}
    >
      <CouncilWorkspace />
    </ApplicationShell>
  );
}
