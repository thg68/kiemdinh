import { ApplicationShell } from "@/components/layout/application-shell";
import { StandardsWorkspace } from "@/components/standards/standards-workspace";

export const dynamic = "force-dynamic";

export default function StandardsPage() {
  return (
    <ApplicationShell
      active="standards"
      title="Bộ tiêu chuẩn"
      description="Tra cứu nội dung từng tiêu chuẩn, tiêu chí, yêu cầu Mức 1, Mức 2 và minh chứng gợi ý theo đúng loại hình của đơn vị."
    >
      <StandardsWorkspace />
    </ApplicationShell>
  );
}
