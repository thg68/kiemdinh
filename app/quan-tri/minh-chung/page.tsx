import { AdminEvidence } from "@/components/admin/admin-evidence";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default function AdminEvidencePage() {
  return (
    <>
      <AdminPageHeader
        title="Quản trị minh chứng"
        description="Mở kho của từng cơ sở để theo dõi metadata, hiệu lực và sự cố tham chiếu mà không truy cập nội dung nghiệp vụ của nhà trường."
      />
      <AdminEvidence />
    </>
  );
}
