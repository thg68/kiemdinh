import { EvidenceDetail } from "@/components/evidence/evidence-detail";

export default async function EvidenceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-[#f7f7f2] px-6 py-8 text-[#1f2933]">
      <div className="mx-auto max-w-5xl">
        <EvidenceDetail evidenceId={id} />
      </div>
    </main>
  );
}
