"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { Alert } from "@/components/ui/alert";

type OrphanStorageObject = {
  storage_path: string;
  nam_hoc_id: string;
  created_at: string;
  kich_thuoc: number | null;
  loai_tep: string | null;
};

export function StorageOrphanMaintenance() {
  const supabase = useMemo(
    () => (isSupabaseConfigured() ? createBrowserSupabaseClient() : null),
    [],
  );
  const [allowed, setAllowed] = useState(false);
  const [items, setItems] = useState<OrphanStorageObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [message, setMessage] = useState("");

  const getAccessToken = useCallback(async () => {
    if (!supabase) {
      return null;
    }

    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, [supabase]);

  const refresh = useCallback(async () => {
    const accessToken = await getAccessToken();

    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "/api/minh-chung/orphans?olderThanMinutes=60",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      if (response.status === 403) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        items?: OrphanStorageObject[];
      } | null;

      if (!response.ok) {
        setMessage(payload?.error ?? "Không kiểm tra được tệp tải lỗi.");
        setLoading(false);
        return;
      }

      setAllowed(true);
      setItems(payload?.items ?? []);
      setMessage("");
    } catch {
      setMessage("Mất kết nối khi kiểm tra tệp tải lỗi.");
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [refresh]);

  async function cleanOrphans() {
    if (
      items.length === 0 ||
      !window.confirm(
        `Xóa vĩnh viễn ${items.length} tệp tải lỗi chưa gắn với minh chứng?`,
      )
    ) {
      return;
    }

    const accessToken = await getAccessToken();

    if (!accessToken) {
      setMessage("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      return;
    }

    setCleaning(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/minh-chung/orphans?olderThanMinutes=60",
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      const payload = (await response.json().catch(() => null)) as {
        deleted?: number;
        error?: string;
      } | null;

      if (!response.ok) {
        setMessage(payload?.error ?? "Không dọn được tệp tải lỗi.");
        return;
      }

      setMessage(`Đã dọn ${payload?.deleted ?? 0} tệp tải lỗi.`);
      await refresh();
    } catch {
      setMessage("Mất kết nối khi dọn tệp tải lỗi.");
    } finally {
      setCleaning(false);
    }
  }

  if (loading || !allowed) {
    return null;
  }

  return (
    <section className="surface-card surface-card-pad">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">
            Tệp tải chưa hoàn tất
          </h2>
          <p className="mt-1 text-sm text-[var(--color-graphite)]/70">
            Các tệp đã tải quá 60 phút nhưng chưa tạo được mã minh chứng.
          </p>
        </div>
        {items.length > 0 ? (
          <button
            className="button-secondary"
            disabled={cleaning}
            onClick={() => void cleanOrphans()}
            type="button"
          >
            {cleaning ? "Đang dọn…" : `Dọn ${items.length} tệp`}
          </button>
        ) : null}
      </div>

      <p
        className="mt-4 text-sm font-medium text-[var(--color-ink-navy)]"
        aria-live="polite"
      >
        {items.length === 0
          ? "Không có tệp tải lỗi cần dọn."
          : `Phát hiện ${items.length} tệp có thể dọn an toàn.`}
      </p>

      {message ? (
        <div className="mt-4">
          <Alert tone={message.startsWith("Đã dọn") ? "success" : "warning"}>
            {message}
          </Alert>
        </div>
      ) : null}
    </section>
  );
}
