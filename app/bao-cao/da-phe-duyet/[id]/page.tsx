import { ApplicationShell } from "@/components/layout/application-shell";
import { ApprovedReportDetail } from "@/components/reports/approved-report-detail";

export const dynamic = "force-dynamic";

export default async function ApprovedReportDetailPage({
  params,
}: PageProps<"/bao-cao/da-phe-duyet/[id]">) {
  const { id } = await params;

  return (
    <ApplicationShell
      active="reports"
      title="Chi tiết báo cáo đã phê duyệt"
      description="Xem thông tin phê duyệt và tải snapshot chính thức của báo cáo."
    >
      <ApprovedReportDetail reportId={id} />
    </ApplicationShell>
  );
}
