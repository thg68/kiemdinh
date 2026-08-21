import Link from "next/link";
import { ApplicationShell } from "@/components/layout/application-shell";

const workingAreas = [
  {
    title: "Minh chứng",
    body: "Quản lý tệp, liên kết điện tử, trạng thái xác minh và các tiêu chí đang sử dụng cùng một mã.",
    href: "/minh-chung",
  },
  {
    title: "Tự đánh giá",
    body: "Nhập hiện trạng, gắn minh chứng, xem Gap Board và mô phỏng What-if theo cấp học.",
    href: "/tu-danh-gia",
  },
  {
    title: "Báo cáo",
    body: "Xuất Mẫu 1, Mẫu 2, danh mục minh chứng, gói minh chứng và JSON theo năm học.",
    href: "/bao-cao",
  },
  {
    title: "Cài đặt",
    body: "Tạo cơ sở giáo dục, chọn năm học đang hoạt động và kế thừa dữ liệu năm trước.",
    href: "/thiet-lap",
  },
];

const notYet = [
  "Công việc",
  "Cải tiến chất lượng",
  "Chỉ số chất lượng",
  "Hội đồng & phân công",
  "Trợ lý AI",
];

export default function DashboardPage() {
  return (
    <ApplicationShell
      active="dashboard"
      title="Tổng quan"
      description="Điểm vào chung của không gian quản trị chất lượng. Các số liệu cụ thể được lấy từ dữ liệu thật trong từng màn hình nghiệp vụ."
    >
      <section className="featured-card grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm text-white/70">Bản đầu tiên</p>
          <h2 className="mt-2 font-serif text-4xl font-medium text-white">
            Minh chứng, tự đánh giá và báo cáo đã sẵn sàng để dùng với dữ liệu thật.
          </h2>
        </div>
        <Link className="button-primary" href="/tu-danh-gia">
          Xem Gap Board
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {workingAreas.map((area) => (
          <Link className="surface-card surface-card-pad hover:border-[var(--color-electric-cobalt)]" href={area.href} key={area.title}>
            <h2 className="section-title text-xl">{area.title}</h2>
            <p className="muted mt-4 text-sm leading-7">{area.body}</p>
          </Link>
        ))}
      </section>

      <section className="surface-card surface-card-pad" id="standards">
        <h2 className="section-title text-xl">Bộ tiêu chuẩn</h2>
        <p className="muted mt-3 text-sm leading-7">
          Bộ tiêu chuẩn là dữ liệu tham chiếu có phiên bản trong cơ sở dữ liệu. Màn hình tự đánh giá và báo cáo sẽ đọc tiêu chí, mức yêu cầu và cờ bắt buộc từ nguồn này.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="mini-badge">4 tiêu chuẩn</span>
          <span className="mini-badge">15 tiêu chí</span>
          <span className="mini-badge">8 tiêu chí bắt buộc</span>
        </div>
      </section>

      <section className="surface-card surface-card-pad">
        <h2 className="section-title text-xl">Các khu vực sẽ mở rộng sau bản đầu tiên</h2>
        <p className="muted mt-3 text-sm leading-7">
          Các mục dưới đây chỉ hiển thị định hướng sản phẩm, chưa tạo dữ liệu hoặc quyền mới.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {notYet.map((item) => (
            <span className="mini-badge" key={item}>{item}</span>
          ))}
        </div>
      </section>
    </ApplicationShell>
  );
}
