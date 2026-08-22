import { SchoolYearSetup } from "@/components/setup/school-year-setup";
import { ApplicationShell } from "@/components/layout/application-shell";

export const dynamic = "force-dynamic";

export default function SetupPage() {
  return (
    <ApplicationShell
      active="settings"
      title="Cơ sở giáo dục và năm học"
      description="Thiết lập đơn vị một lần, sau đó chọn năm học đang vận hành để mọi minh chứng và tự đánh giá đi đúng ngữ cảnh."
    >
      <SchoolYearSetup />
    </ApplicationShell>
  );
}
