"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import {
  CurrentUserRoles,
  type RoleLabel,
} from "@/components/layout/current-user-roles";
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher";
import { Alert } from "@/components/ui/alert";
import { LoadingState } from "@/components/ui/loading-state";
import { firstSchoolRouteForRoles } from "@/lib/auth/navigation";
import { toUserMessage } from "@/lib/errors/user-message";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

const adminNavigation = [
  { href: "/quan-tri", label: "Tổng quan" },
  { href: "/quan-tri/co-so", label: "Cơ sở giáo dục" },
  { href: "/quan-tri/nguoi-tham-gia", label: "Người tham gia" },
  { href: "/quan-tri/minh-chung", label: "Quản trị minh chứng" },
  { href: "/quan-tri/bo-tieu-chuan", label: "Bộ tiêu chuẩn" },
  { href: "/quan-tri/van-hanh", label: "Vận hành hệ thống" },
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/quan-tri") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const [menuOpen, setMenuOpen] = useState(false);
  const [roles, setRoles] = useState<RoleLabel[]>([]);
  const [loading, setLoading] = useState(configured);
  const [message, setMessage] = useState(
    configured ? "" : "Chưa cấu hình kết nối hệ thống.",
  );
  const supabase = useMemo(
    () => (configured ? createBrowserSupabaseClient() : null),
    [configured],
  );
  const roleCodes = useMemo(() => roles.map((role) => role.ma), [roles]);
  const hasAccess = roleCodes.includes("SYSTEM_ADMIN");

  function closeMenu() {
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!supabase) return;

    const client = supabase;
    let activeRequest = true;

    async function loadRoles() {
      const { data: authData, error: authError } = await client.auth.getUser();

      if (!activeRequest) return;

      if (authError || !authData.user) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      const { data, error } = await client.rpc("fn_user_role_labels");

      if (!activeRequest) return;

      if (error) {
        setMessage(toUserMessage(error, "Không tải được quyền quản trị. Vui lòng tải lại trang."));
      } else {
        setRoles((data ?? []) as RoleLabel[]);
      }
      setLoading(false);
    }

    void loadRoles();

    return () => {
      activeRequest = false;
    };
  }, [pathname, router, supabase]);

  useEffect(() => {
    if (loading || message || hasAccess) return;
    router.replace(firstSchoolRouteForRoles(roleCodes));
  }, [hasAccess, loading, message, roleCodes, router]);

  useEffect(() => {
    if (!menuOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") closeMenu();
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <LoadingState label="Đang kiểm tra quyền quản trị…" />
      </main>
    );
  }

  if (!configured || message) {
    return (
      <main className="mx-auto grid min-h-screen max-w-xl place-items-center p-6">
        <Alert tone="warning">{message || "Chưa cấu hình kết nối hệ thống."}</Alert>
      </main>
    );
  }

  if (!hasAccess) {
    return (
      <main className="mx-auto grid min-h-screen max-w-xl place-items-center p-6">
        <Alert tone="warning">
          Tài khoản không có quyền quản trị hệ thống. Hệ thống đang chuyển tới khu vực phù hợp.
        </Alert>
      </main>
    );
  }

  const systemAdminRoles = roles.filter((role) => role.ma === "SYSTEM_ADMIN");

  return (
    <div className="app-layout admin-layout">
      <a className="skip-link" href="#noi-dung-quan-tri">
        Bỏ qua điều hướng
      </a>

      <div className="app-mobile-header">
        <Link className="text-base font-bold text-[var(--color-ink-navy)]" href="/quan-tri" onClick={closeMenu}>
          PDT Quality
        </Link>
        <button
          aria-controls="admin-sidebar"
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

      <div className="app-frame admin-frame">
        <aside
          aria-hidden={!menuOpen && undefined}
          className={`app-sidebar admin-sidebar ${menuOpen ? "app-sidebar-open" : ""}`}
          id="admin-sidebar"
        >
          <Link className="block text-lg font-bold text-[var(--color-ink-navy)]" href="/quan-tri" onClick={closeMenu}>
            PDT Quality
          </Link>
          <p className="mt-2 text-xs font-semibold uppercase text-[var(--color-electric-cobalt)]">
            Quản trị hệ thống
          </p>
          <p className="mt-2 text-xs leading-5 text-[var(--color-graphite)]/65">
            Điều phối tài khoản, cơ sở, danh mục và trạng thái kỹ thuật trên toàn hệ thống.
          </p>

          <WorkspaceSwitcher current="admin" roleCodes={roleCodes} />

          <nav aria-label="Điều hướng quản trị hệ thống" className="mt-8 grid gap-1">
            {adminNavigation.map((item) => {
              const isActive = isActivePath(pathname, item.href);

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={`app-nav-link ${isActive ? "app-nav-link-active" : ""}`}
                  href={item.href}
                  key={item.href}
                  onClick={closeMenu}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <CurrentUserRoles roles={systemAdminRoles} title="Vai trò hệ thống" />

          <div className="mt-8 border-t border-[var(--color-border)] pt-6">
            <LogoutButton />
          </div>
        </aside>

        <main className="app-main admin-main" id="noi-dung-quan-tri" tabIndex={-1}>
          <div className="mx-auto grid w-full max-w-[1360px] gap-7">{children}</div>
        </main>
      </div>
    </div>
  );
}
