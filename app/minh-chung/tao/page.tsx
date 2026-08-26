import { EvidenceWorkspace } from "@/components/evidence/evidence-workspace";
import { ApplicationShell } from "@/components/layout/application-shell";

export const dynamic = "force-dynamic";

export default function CreateEvidencePage() {
  return (
    <ApplicationShell
      active="evidence"
      title="Tạo minh chứng"
      description="Tải tệp hoặc gắn liên kết điện tử, sau đó chọn một hoặc nhiều tiêu chí sử dụng minh chứng này."
    >
      <EvidenceWorkspace mode="create" />
    </ApplicationShell>
  );
}
