import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSchools } from "@/components/admin/admin-schools";

export default function AdminSchoolsPage() {
  return (
    <>
      <AdminPageHeader
        title="Cơ sở giáo dục"
        description="Tạo hoặc nhập danh mục trường từ Excel, khai báo địa phương và quản lý trạng thái vận hành trên toàn hệ thống."
      />
      <AdminSchools />
    </>
  );
}
