import Link from "next/link";
import { ApplicationShell } from "@/components/layout/application-shell";

export const dynamic = "force-dynamic";

const priorityAreas = [
  {
    title: "Việc của tôi",
    body: "Xem tiêu chí được phân công, minh chứng chờ xử lý và các hồ sơ cần duyệt.",
    href: "/viec-cua-toi",
  },
  {
    title: "Bộ tiêu chuẩn",
    body: "Tra cứu nội dung từng tiêu chí, yêu cầu Mức 1, Mức 2 và minh chứng gợi ý.",
    href: "/bo-tieu-chuan",
  },
  {
    title: "Kho minh chứng",
    body: "Tải lên, dùng lại mã minh chứng và xem các tiêu chí đang dùng chung một minh chứng.",
    href: "/minh-chung",
  },
  {
    title: "Tự đánh giá",
    body: "Nhập hiện trạng, gắn minh chứng, xem Gap Board và thử What-if.",
    href: "/tu-danh-gia",
  },
];

const reportAreas = [
  {
    title: "Kế hoạch cải tiến",
    body: "Nhập các nhiệm vụ cải tiến chất lượng để xuất Mẫu 2.",
    href: "/ke-hoach-cai-tien",
  },
  {
    title: "Hội đồng tự đánh giá",
    body: "Quản lý danh sách hội đồng, chức vụ và vai trò ký xác nhận trong Mẫu 1.",
    href: "/hoi-dong-tu-danh-gia",
  },
  {
    title: "Xuất báo cáo",
    body: "Tạo Mẫu 1, Mẫu 2, danh mục minh chứng, gói minh chứng và JSON dự phòng.",
    href: "/bao-cao",
  },
  {
    title: "Báo cáo đã phê duyệt",
    body: "Xem các báo cáo đã chốt, phù hợp cho vai trò khách chỉ đọc.",
    href: "/bao-cao/da-phe-duyet",
  },
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
          <p className="text-sm text-white/70">Bản vận hành đầu tiên</p>
          <h2 className="mt-2 font-serif text-4xl font-medium text-white">
            Bắt đầu từ việc thật, để kiểm định tự hiện ra.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/78">
            Giáo viên nộp minh chứng, hội đồng tự đánh giá, hiệu trưởng xem khoảng cách và xuất báo cáo từ cùng một nguồn dữ liệu.
          </p>
        </div>
        <Link className="button-primary" href="/viec-cua-toi">
          Xem việc cần làm
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {priorityAreas.map((area) => (
          <Link className="surface-card surface-card-pad hover:border-[var(--color-electric-cobalt)]" href={area.href} key={area.title}>
            <h2 className="section-title text-xl">{area.title}</h2>
            <p className="muted mt-4 text-sm leading-7">{area.body}</p>
          </Link>
        ))}
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-6 py-5">
          <h2 className="section-title text-xl">Hoàn thiện báo cáo</h2>
          <p className="muted mt-2 text-sm leading-7">
            Các phần dưới đây giúp Mẫu 1 và Mẫu 2 lấy đủ dữ liệu thật, không phải bổ sung bằng tay sau khi xuất file.
          </p>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          {reportAreas.map((area) => (
            <Link className="surface-card p-4 hover:border-[var(--color-electric-cobalt)]" href={area.href} key={area.title}>
              <h3 className="text-base font-semibold text-[var(--color-ink-navy)]">{area.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--color-graphite)]/70">{area.body}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="surface-card surface-card-pad">
        <h2 className="section-title text-xl">Kiểm soát nội bộ</h2>
        <p className="muted mt-3 text-sm leading-7">
          Nhật ký thao tác giúp nhà trường truy vết ai đã tạo, sửa, xác minh, gửi duyệt hoặc phê duyệt dữ liệu.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link className="button-secondary" href="/nhat-ky">
            Mở nhật ký
          </Link>
          <Link className="button-secondary" href="/van-ban-lien-quan">
            Văn bản liên quan
          </Link>
          <Link className="button-secondary" href="/thiet-lap">
            Cài đặt đơn vị
          </Link>
        </div>
      </section>
    </ApplicationShell>
  );
}
