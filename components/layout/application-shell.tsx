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
import { capabilityForPath, hasCapability } from "@/lib/auth/capabilities";
import {
  firstRouteForRoles,
  navigationForRoles,
  type ActiveNav,
} from "@/lib/auth/navigation";
import { toUserMessage } from "@/lib/errors/user-message";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

type ApplicationShellProps = {
  active: ActiveNav;
  children: React.ReactNode;
  description?: string;
  title: string;
};

export function ApplicationShell({
  active,
  children,
  description,
  title,
}: ApplicationShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const [menuOpen, setMenuOpen] = useState(false);
  const [roles, setRoles] = useState<RoleLabel[]>([]);
  const [rolesLoading, setRolesLoading] = useState(configured);
  const [roleMessage, setRoleMessage] = useState(
    configured ? "" : "Chưa cấu hình kết nối hệ thống.",
  );
  const supabase = useMemo(
    () => (configured ? createBrowserSupabaseClient() : null),
    [configured],
  );
  const roleCodes = useMemo(() => roles.map((role) => role.ma), [roles]);
  const schoolRoles = useMemo(
    () => roles.filter((role) => role.ma !== "SYSTEM_ADMIN"),
    [roles],
  );
  const schoolRoleCodes = useMemo(
    () => schoolRoles.map((role) => role.ma),
    [schoolRoles],
  );
  const navigation = navigationForRoles(schoolRoleCodes);
  const requiredCapability = capabilityForPath(pathname);
  const isOnboardingAccount = pathname.startsWith("/thiet-lap") && roleCodes.length === 0;
  const canAccess =
    !requiredCapability || isOnboardingAccount || hasCapability(schoolRoleCodes, requiredCapability);

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
        setRoleMessage(toUserMessage(error, "Không tải được vai trò. Vui lòng tải lại trang."));
      } else {
        setRoles((data ?? []) as RoleLabel[]);
      }
      setRolesLoading(false);
    }

    void loadRoles();

    return () => {
      activeRequest = false;
    };
  }, [pathname, router, supabase]);

  useEffect(() => {
    if (rolesLoading || roleMessage || canAccess) return;

    const destination = firstRouteForRoles(roleCodes);
    if (destination !== pathname) {
      router.replace(destination);
    }
  }, [canAccess, pathname, roleCodes, roleMessage, rolesLoading, router]);

  useEffect(() => {
    if (!menuOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") closeMenu();
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  if (rolesLoading) {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <LoadingState label="Đang kiểm tra quyền truy cập…" />
      </main>
    );
  }

  if (!configured || roleMessage) {
    return (
      <main className="mx-auto grid min-h-screen max-w-xl place-items-center p-6">
        <Alert tone="warning">{roleMessage || "Chưa cấu hình kết nối hệ thống."}</Alert>
      </main>
    );
  }

  if (!canAccess) {
    return (
      <main className="mx-auto grid min-h-screen max-w-xl place-items-center p-6">
        <Alert tone="warning">Bạn không có quyền truy cập trang này. Hệ thống đang chuyển tới khu vực phù hợp.</Alert>
      </main>
    );
  }

  return (
    <div className="app-layout">
      <a className="skip-link" href="#noi-dung-chinh">
        Bỏ qua điều hướng
      </a>

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
          aria-hidden={!menuOpen && undefined}
          className={`app-sidebar ${menuOpen ? "app-sidebar-open" : ""}`}
          id="app-sidebar"
        >
          <Link className="block text-lg font-bold text-[var(--color-ink-navy)]" href="/" onClick={closeMenu}>
            PDT Quality
          </Link>
          <p className="mt-2 text-xs leading-5 text-[var(--color-graphite)]/65">
            Quản trị chất lượng nhà trường từ vận hành hằng ngày.
          </p>

          <WorkspaceSwitcher current="school" roleCodes={roleCodes} />

          <nav
            aria-busy={rolesLoading || undefined}
            aria-label="Điều hướng nghiệp vụ"
            className="mt-8 grid gap-1"
          >
            {rolesLoading ? (
              <span className="muted px-3 py-2 text-sm" role="status">
                Đang tải quyền truy cập…
              </span>
            ) : navigation.length > 0 ? (
              navigation.map((item) => {
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
              })
            ) : (
              <p className="muted px-3 py-2 text-sm">
                Tài khoản chưa được cấp vai trò sử dụng.
              </p>
            )}
          </nav>

          {roleMessage ? <Alert className="mt-4" tone="warning">{roleMessage}</Alert> : null}
          <CurrentUserRoles roles={schoolRoles} title="Vai trò tại trường" />

          <div className="mt-8 border-t border-[var(--color-border)] pt-6">
            <LogoutButton />
          </div>
        </aside>

        <main className="app-main" id="noi-dung-chinh" tabIndex={-1}>
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
