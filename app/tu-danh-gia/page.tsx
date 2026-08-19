import Link from "next/link";
import { AssessmentWorkspace } from "@/components/assessment/assessment-workspace";

export default function SelfAssessmentPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f2] px-6 py-8 text-[#1f2933]">
      <div className="mx-auto grid w-full max-w-7xl gap-6">
        <header className="grid gap-3 border-b border-[#d8d6c9] pb-5 sm:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.08em] text-[#6f5f36]">
              Sprint 3
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[#17324d]">
              Tự đánh giá
            </h1>
          </div>
          <nav className="flex flex-wrap items-start gap-2">
            <Link className="border border-[#17324d] px-4 py-2 text-sm font-semibold text-[#17324d]" href="/">
              Trang chính
            </Link>
            <Link className="border border-[#17324d] px-4 py-2 text-sm font-semibold text-[#17324d]" href="/minh-chung">
              Kho minh chứng
            </Link>
          </nav>
        </header>

        <AssessmentWorkspace />
      </div>
    </main>
  );
}
