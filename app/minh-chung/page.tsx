import { EvidenceWorkspace } from "@/components/evidence/evidence-workspace";

export default function EvidencePage() {
  return (
    <main className="app-shell">
      <div className="content-wrap">
        <header className="page-header">
          <h1 className="page-title">
            Kho minh chứng
          </h1>
          <p className="page-copy">
            Một tệp chỉ có một mã, nhưng có thể phục vụ nhiều tiêu chí. Đây là nơi
            nhà trường quản lý nguồn sự thật duy nhất của minh chứng.
          </p>
        </header>

        <EvidenceWorkspace />
      </div>
    </main>
  );
}
