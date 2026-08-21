import { EvidenceDetail } from "@/components/evidence/evidence-detail";

export default async function EvidenceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="app-shell">
      <div className="content-wrap max-w-5xl">
        <EvidenceDetail evidenceId={id} />
      </div>
    </main>
  );
}
