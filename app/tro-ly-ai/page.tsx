import { ComingSoonPage } from "@/components/layout/coming-soon-page";

export default function AiAssistantPage() {
  return (
    <ComingSoonPage
      active="ai"
      title="Trợ lý AI"
      description="Trợ lý AI chỉ được mở khi đã có rào chắn neo nội dung vào mã minh chứng thật và không xử lý dữ liệu đỏ của học sinh."
      nextAfter="Sau khi đủ guardrail"
    />
  );
}
