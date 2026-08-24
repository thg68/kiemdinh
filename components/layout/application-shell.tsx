"use client";

import Link from "next/link";
import { useState } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { CurrentUserRoles } from "@/components/layout/current-user-roles";

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
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="app-layout">
      <div className="app-mobile-header">
        <Link className="text-base font-bold text-[var(--color-ink-navy)]" href="/" onClick={closeMenu}>
          PDT Quality
        </Link>
        <button
          aria-controls="app-sidebar"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Đóng điều hướng" : "Mở điều hướng"}
          className="app-menu-button"
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
        >
          <span aria-hidden="true" className="grid gap-1">
            <span className="block h-0.5 w-4 rounded-full bg-current" />
            <span className="block h-0.5 w-4 rounded-full bg-current" />
            <span className="block h-0.5 w-4 rounded-full bg-current" />
          </span>
          Menu
        </button>
      </div>

      {menuOpen ? (
        <button
          aria-label="Đóng điều hướng"
          className="app-mobile-backdrop"
          type="button"
          onClick={closeMenu}
        />
      ) : null}

      <div className="app-frame">
        <aside
          className={`app-sidebar ${menuOpen ? "app-sidebar-open" : ""}`}
          id="app-sidebar"
        >
          <Link className="block text-lg font-bold text-[var(--color-ink-navy)]" href="/" onClick={closeMenu}>
            PDT Quality
          </Link>
          <p className="mt-2 text-xs leading-5 text-[var(--color-graphite)]/65">
            Quản trị chất lượng nhà trường từ vận hành hằng ngày.
          </p>

          <nav className="mt-8 grid gap-1" aria-label="Điều hướng nghiệp vụ">
            {primaryNav.map((item) => {
              const isActive = active === item.key;

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={`app-nav-link ${isActive ? "app-nav-link-active" : ""}`}
                  href={item.href}
                  key={item.key}
                  onClick={closeMenu}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <CurrentUserRoles />

          <div className="mt-8 border-t border-[var(--color-border)] pt-6">
            <LogoutButton />
          </div>
        </aside>

        <main className="app-main">
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
