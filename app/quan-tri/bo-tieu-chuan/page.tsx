import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStandards } from "@/components/admin/admin-standards";

export default function AdminStandardsPage() {
  return (
    <>
      <AdminPageHeader
        title="Bộ tiêu chuẩn"
        description="Theo dõi phiên bản, hiệu lực, cấu trúc và phạm vi sử dụng của các bộ tiêu chuẩn dùng chung."
      />
      <AdminStandards />
    </>
  );
}
