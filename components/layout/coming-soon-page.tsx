import Link from "next/link";
import type { ComponentProps } from "react";
import { ApplicationShell } from "@/components/layout/application-shell";

type ComingSoonPageProps = {
  active: ComponentProps<typeof ApplicationShell>["active"];
  title: string;
  description: string;
  nextAfter: string;
};

export function ComingSoonPage({
  active,
  description,
  nextAfter,
  title,
}: ComingSoonPageProps) {
  return (
    <ApplicationShell active={active} description={description} title={title}>
      <section className="surface-card surface-card-pad">
        <h2 className="section-title text-xl">Chưa triển khai trong bản đầu tiên</h2>
        <p className="muted mt-4 max-w-3xl text-sm leading-7">
          Khu vực này được giữ trong điều hướng để nhà trường nhìn thấy lộ trình,
          nhưng hiện chưa ghi dữ liệu nghiệp vụ và chưa tạo quyền mới. Sẽ chỉ mở
          sau khi Minh chứng, Tự đánh giá và Báo cáo chạy ổn với dữ liệu thật.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="mini-badge">Sau bản đầu tiên</span>
          <span className="mini-badge">{nextAfter}</span>
          <span className="mini-badge">Không dùng dữ liệu giả</span>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="button-primary" href="/dashboard">
            Về tổng quan
          </Link>
          <Link className="button-secondary" href="/bao-cao">
            Kiểm tra báo cáo
          </Link>
        </div>
      </section>
    </ApplicationShell>
  );
}
