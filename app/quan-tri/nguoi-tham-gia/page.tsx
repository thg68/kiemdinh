import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminParticipants } from "@/components/admin/admin-participants";

export default function AdminParticipantsPage() {
  return (
    <>
      <AdminPageHeader
        title="Tài khoản người dùng"
        description="Theo dõi email đăng ký, trạng thái xác thực, trường tham gia và quyền Hiệu trưởng."
      />
      <AdminParticipants />
    </>
  );
}
