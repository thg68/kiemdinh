import { ApplicationShell } from "@/components/layout/application-shell";
import { RelatedDocumentsWorkspace } from "@/components/legal/related-documents-workspace";

export const dynamic = "force-dynamic";

export default function RelatedDocumentsPage() {
  return (
    <ApplicationShell
      active="legal"
      title="Văn bản liên quan"
      description="Nhà trường tự nhập và cập nhật các căn cứ ngoài TT57 đang sử dụng trong năm học. Hệ thống không tự hardcode số hiệu văn bản chưa được xác minh."
    >
      <RelatedDocumentsWorkspace />
    </ApplicationShell>
  );
}
