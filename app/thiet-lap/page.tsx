import { SchoolYearSetup } from "@/components/setup/school-year-setup";

export default function SetupPage() {
  return (
    <main className="app-shell">
      <div className="content-wrap">
        <header className="page-header">
          <h1 className="page-title">
            Cơ sở giáo dục và năm học
          </h1>
          <p className="page-copy">
            Thiết lập đơn vị một lần, sau đó chọn năm học đang vận hành để mọi minh chứng
            và tự đánh giá đi đúng ngữ cảnh.
          </p>
        </header>

        <SchoolYearSetup />
      </div>
    </main>
  );
}
