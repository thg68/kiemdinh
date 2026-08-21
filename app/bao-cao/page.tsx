import { ReportExportWorkspace } from "@/components/reports/report-export-workspace";
import { ApplicationShell } from "@/components/layout/application-shell";

export default function ReportsPage() {
  return (
    <ApplicationShell
      active="reports"
      title="Xuất báo cáo"
      description="Tạo Mẫu 1, Mẫu 2 và các gói dữ liệu từ nội dung đã nhập, không tự sinh mô tả khi chưa có minh chứng."
    >
      <ReportExportWorkspace />
    </ApplicationShell>
  );
}
