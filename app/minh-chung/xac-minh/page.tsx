import { EvidenceVerificationWorkspace } from "@/components/evidence/evidence-verification-workspace";
import { ApplicationShell } from "@/components/layout/application-shell";

export const dynamic = "force-dynamic";

export default function EvidenceVerificationPage() {
  return (
    <ApplicationShell
      active="evidence"
      title="Xác minh minh chứng"
      description="Duyệt, từ chối hoặc kiểm tra lại các minh chứng đã được giáo viên và hội đồng đưa vào kho."
    >
      <EvidenceVerificationWorkspace />
    </ApplicationShell>
  );
}
