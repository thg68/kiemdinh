import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminParticipants } from "@/components/admin/admin-participants";

export default function AdminParticipantsPage() {
  return (
    <>
      <AdminPageHeader
        title="Người tham gia"
        description="Theo dõi tài khoản theo cơ sở, vai trò và trạng thái; khóa hoặc khôi phục truy cập khi cần."
      />
      <AdminParticipants />
    </>
  );
}
