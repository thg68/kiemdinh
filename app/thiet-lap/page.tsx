import { SchoolYearSetup } from "@/components/setup/school-year-setup";

export default function SetupPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f2] px-6 py-10 text-[#1f2933]">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 border-b border-[#d8d6c9] pb-5">
          <p className="text-sm font-medium uppercase tracking-[0.08em] text-[#6f5f36]">
            Thiết lập ban đầu
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[#17324d]">
            Cơ sở giáo dục và năm học
          </h1>
        </header>

        <SchoolYearSetup />
      </div>
    </main>
  );
}
