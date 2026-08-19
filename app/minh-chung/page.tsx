import { EvidenceWorkspace } from "@/components/evidence/evidence-workspace";

export default function EvidencePage() {
  return (
    <main className="min-h-screen bg-[#f7f7f2] px-6 py-8 text-[#1f2933]">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 border-b border-[#d8d6c9] pb-5">
          <p className="text-sm font-medium uppercase tracking-[0.08em] text-[#6f5f36]">
            Module M2
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[#17324d]">
            Kho minh chứng
          </h1>
        </header>

        <EvidenceWorkspace />
      </div>
    </main>
  );
}
