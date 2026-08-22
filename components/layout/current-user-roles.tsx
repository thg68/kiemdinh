"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

type RoleLabel = {
  ma: string;
  ten: string;
};

export function CurrentUserRoles() {
  const supabase = useMemo(() => {
    if (!isSupabaseConfigured()) {
      return null;
    }

    return createBrowserSupabaseClient();
  }, []);
  const [roles, setRoles] = useState<RoleLabel[]>([]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let active = true;
    const client = supabase;

    async function loadRoles() {
      const { data } = await client.rpc("fn_user_role_labels");

      if (active) {
        setRoles((data ?? []) as RoleLabel[]);
      }
    }

    void loadRoles();

    return () => {
      active = false;
    };
  }, [supabase]);

  if (roles.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white/70 p-3">
      <p className="text-xs font-semibold text-[var(--color-graphite)]/65">
        Vai trò của bạn
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {roles.map((role) => (
          <span
            className="rounded-full bg-[var(--color-lavender-mist)] px-2.5 py-1 text-xs font-semibold text-[var(--color-ink-navy)]"
            key={role.ma}
            title={role.ma}
          >
            {role.ten}
          </span>
        ))}
      </div>
    </div>
  );
}
