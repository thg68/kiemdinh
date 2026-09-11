"use client";

import type { AppRole } from "@/lib/auth/navigation";

export type RoleLabel = {
  ma: AppRole;
  ten: string;
};

export function CurrentUserRoles({
  roles,
  title = "Vai trò của bạn",
}: {
  roles: RoleLabel[];
  title?: string;
}) {
  if (roles.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Vai trò hiện tại"
      className="mt-6 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white/70 p-3"
    >
      <h2 className="text-xs font-semibold text-[var(--color-graphite)]/65">
        {title}
      </h2>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {roles.map((role) => (
          <span
            className="rounded-full bg-[var(--color-lavender-mist)] px-2.5 py-1 text-xs font-semibold text-[var(--color-ink-navy)]"
            key={role.ma}
          >
            {role.ten}
          </span>
        ))}
      </div>
    </section>
  );
}
