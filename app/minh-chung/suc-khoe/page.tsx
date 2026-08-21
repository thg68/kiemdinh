import { EvidenceHealth } from "@/components/evidence/evidence-health";
import { ApplicationShell } from "@/components/layout/application-shell";

export default function EvidenceHealthPage() {
  return (
    <ApplicationShell
      active="evidence"
      title="Kiểm tra sức khỏe minh chứng"
      description="Rà soát minh chứng hết hạn, trùng lặp, mồ côi và tiêu chí còn rỗng trong năm học đang hoạt động."
    >
      <EvidenceHealth />
    </ApplicationShell>
  );
}
