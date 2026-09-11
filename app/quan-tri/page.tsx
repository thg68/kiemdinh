import { AdminOverview } from "@/components/admin/admin-overview";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default function AdminOverviewPage() {
  return (
    <>
      <AdminPageHeader
        title="Tổng quan hệ thống"
        description="Theo dõi quy mô, điểm cần chú ý và đi nhanh tới các tác vụ quản trị trên toàn nền tảng."
      />
      <AdminOverview />
    </>
  );
}
