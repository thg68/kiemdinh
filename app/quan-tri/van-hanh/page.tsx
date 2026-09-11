import { AdminOperations } from "@/components/admin/admin-operations";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default function AdminOperationsPage() {
  return (
    <>
      <AdminPageHeader
        title="Vận hành hệ thống"
        description="Kiểm tra sức khỏe các dịch vụ nền và theo dõi lịch sử thao tác quản trị đã được tối giản dữ liệu."
      />
      <AdminOperations />
    </>
  );
}
