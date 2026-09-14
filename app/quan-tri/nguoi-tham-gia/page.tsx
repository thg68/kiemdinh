import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminParticipants } from "@/components/admin/admin-participants";

export default function AdminParticipantsPage() {
  return (
    <>
      <AdminPageHeader
        title="Người tham gia"
        description="Cấp quyền Hiệu trưởng, theo dõi vai trò và kiểm soát trạng thái tài khoản theo từng trường."
      />
      <AdminParticipants />
    </>
  );
}
