import Link from "next/link";
import { AssessmentWorkspace } from "@/components/assessment/assessment-workspace";

export default function SelfAssessmentPage() {
  return (
    <main className="app-shell">
      <div className="content-wrap grid gap-8">
        <header className="page-header-row">
          <div>
            <h1 className="page-title">
              Tự đánh giá
            </h1>
            <p className="page-copy mt-5">
              Nhập hiện trạng theo tiêu chí, gắn mã minh chứng có thật và xem ngay
              khoảng cách để đạt mức tiếp theo.
            </p>
          </div>
          <nav className="flex flex-wrap items-start gap-2">
            <Link className="button-secondary" href="/">
              Trang chính
            </Link>
            <Link className="button-secondary" href="/minh-chung">
              Kho minh chứng
            </Link>
          </nav>
        </header>

        <AssessmentWorkspace />
      </div>
    </main>
  );
}
