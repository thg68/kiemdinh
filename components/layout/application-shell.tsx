import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";

type ApplicationShellProps = {
  active: "dashboard" | "standards" | "evidence" | "assessment" | "reports" | "settings";
  children: React.ReactNode;
  description?: string;
  title: string;
};

const primaryNav = [
  { key: "dashboard", label: "Tổng quan", href: "/dashboard" },
  { key: "standards", label: "Bộ tiêu chuẩn", href: "/dashboard#standards" },
  { key: "evidence", label: "Minh chứng", href: "/minh-chung" },
  { key: "assessment", label: "Tự đánh giá", href: "/tu-danh-gia" },
  { key: "reports", label: "Báo cáo", href: "/bao-cao" },
  { key: "settings", label: "Cài đặt", href: "/thiet-lap" },
] as const;

export function ApplicationShell({
  active,
  children,
  description,
  title,
}: ApplicationShellProps) {
  return (
    <div className="app-layout">
      <div className="app-frame">
        <aside className="app-sidebar">
          <Link className="block text-lg font-bold text-[var(--color-ink-navy)]" href="/">
            PDT Quality
          </Link>
          <p className="mt-2 text-xs leading-5 text-[var(--color-graphite)]/65">
            Quản trị chất lượng nhà trường từ vận hành hằng ngày.
          </p>

          <nav className="mt-8 grid gap-1" aria-label="Điều hướng nghiệp vụ">
            {primaryNav.map((item) => (
              <Link
                className={`app-nav-link ${active === item.key ? "app-nav-link-active" : ""}`}
                href={item.href}
                key={item.key}
              >
                {item.label}
              </Link>
            ))}
          </nav>

        </aside>

        <main className="app-main">
          <div className="app-topbar">
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink-navy)]">
                Không gian làm việc
              </p>
              <p className="mt-1 text-xs text-[var(--color-graphite)]/65">
                Năm học và đơn vị được tải từ dữ liệu thật trong từng màn hình.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-[var(--color-graphite)]/65">
              <span className="mini-badge hidden sm:inline-flex">RLS</span>
              <span className="mini-badge hidden sm:inline-flex">Signed URL</span>
              <span className="mini-badge hidden lg:inline-flex">Nhật ký</span>
              <LogoutButton />
            </div>
          </div>

          <div className="mx-auto grid w-full max-w-[var(--container-width)] gap-8">
            <header className="page-header">
              <h1 className="page-title">{title}</h1>
              {description ? <p className="page-copy">{description}</p> : null}
            </header>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
