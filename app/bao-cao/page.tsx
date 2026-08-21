import Link from "next/link";
import { ReportExportWorkspace } from "@/components/reports/report-export-workspace";

export default function ReportsPage() {
  return (
    <main className="app-shell">
      <div className="content-wrap grid gap-8">
        <header className="page-header-row">
          <div>
            <h1 className="page-title">
              Xuất báo cáo
            </h1>
            <p className="page-copy mt-5">
              Tạo Mẫu 1, Mẫu 2 và các gói dữ liệu từ nội dung đã nhập, không tự sinh
              mô tả khi chưa có minh chứng.
            </p>
          </div>
          <nav className="flex flex-wrap items-start gap-2">
            <Link className="button-secondary" href="/">
              Trang chính
            </Link>
            <Link className="button-secondary" href="/tu-danh-gia">
              Tự đánh giá
            </Link>
            <Link className="button-secondary" href="/minh-chung">
              Kho minh chứng
            </Link>
          </nav>
        </header>

        <ReportExportWorkspace />
      </div>
    </main>
  );
}
