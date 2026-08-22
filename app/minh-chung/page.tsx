import { EvidenceWorkspace } from "@/components/evidence/evidence-workspace";
import { ApplicationShell } from "@/components/layout/application-shell";

export const dynamic = "force-dynamic";

export default function EvidencePage() {
  return (
    <ApplicationShell
      active="evidence"
      title="Kho minh chứng"
      description="Một tệp chỉ có một mã, nhưng có thể phục vụ nhiều tiêu chí. Đây là nơi nhà trường quản lý nguồn sự thật duy nhất của minh chứng."
    >
      <EvidenceWorkspace />
    </ApplicationShell>
  );
}
