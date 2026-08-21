import { ComingSoonPage } from "@/components/layout/coming-soon-page";

export default function IndicatorsPage() {
  return (
    <ComingSoonPage
      active="indicators"
      title="Chỉ số chất lượng"
      description="Các chỉ số định lượng sẽ được lấy từ dữ liệu nhà trường đã có, tránh tạo thêm bảng biểu thủ công."
      nextAfter="Sau dữ liệu thí điểm"
    />
  );
}
