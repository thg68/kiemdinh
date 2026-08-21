import { EvidenceDetail } from "@/components/evidence/evidence-detail";
import { ApplicationShell } from "@/components/layout/application-shell";

export default async function EvidenceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <ApplicationShell
      active="evidence"
      title="Chi tiết minh chứng"
      description="Xem mã, tệp hoặc liên kết và toàn bộ tiêu chí đang sử dụng minh chứng này."
    >
      <EvidenceDetail evidenceId={id} />
    </ApplicationShell>
  );
}
