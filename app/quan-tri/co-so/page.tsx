import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSchools } from "@/components/admin/admin-schools";

export default function AdminSchoolsPage() {
  return (
    <>
      <AdminPageHeader
        title="Cơ sở giáo dục"
        description="Quản lý danh mục trường, trạng thái vận hành và mức độ thiết lập dữ liệu trên toàn hệ thống."
      />
      <AdminSchools />
    </>
  );
}
