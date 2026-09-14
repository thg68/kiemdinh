import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminParticipants } from "@/components/admin/admin-participants";

export default function AdminParticipantsPage() {
  return (
    <>
      <AdminPageHeader
        title="Người tham gia"
        description="Quản lý trường tham gia, cấp quyền Hiệu trưởng và kiểm soát trạng thái tài khoản."
      />
      <AdminParticipants />
    </>
  );
}
