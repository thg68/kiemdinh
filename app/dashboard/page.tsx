import { DashboardWorkspace } from "@/components/dashboard/dashboard-workspace";
import { ApplicationShell } from "@/components/layout/application-shell";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <ApplicationShell
      active="dashboard"
      title="Tổng quan"
      description="Xem mức hiện tại, việc đang chặn mức tiếp theo và các hàng đợi cần xử lý từ dữ liệu thật của năm học."
    >
      <DashboardWorkspace />
    </ApplicationShell>
  );
}
