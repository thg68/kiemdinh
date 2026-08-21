import { EvidenceHealth } from "@/components/evidence/evidence-health";

export default function EvidenceHealthPage() {
  return (
    <main className="app-shell">
      <div className="content-wrap">
        <header className="page-header">
          <h1 className="page-title">
            Kiểm tra sức khỏe minh chứng
          </h1>
          <p className="page-copy">
            Rà soát minh chứng hết hạn, trùng lặp, mồ côi và tiêu chí còn rỗng
            trong năm học đang hoạt động.
          </p>
        </header>

        <EvidenceHealth />
      </div>
    </main>
  );
}
