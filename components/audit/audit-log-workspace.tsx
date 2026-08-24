"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useAppContext } from "@/components/shared/use-app-context";

type AuditRow = {
  id: string;
  hanh_dong: string;
  doi_tuong: string;
  doi_tuong_id: string | null;
  thoi_diem: string;
  nguoi_dung?: {
    ho_ten: string | null;
    email: string | null;
  } | null;
};

function normalizeText(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export function AuditLogWorkspace() {
  const { loading, message, profile, setMessage, supabase } = useAppContext();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [keyword, setKeyword] = useState("");
  const [objectFilter, setObjectFilter] = useState("all");
  const [loadingRows, setLoadingRows] = useState(false);

  const loadRows = useCallback(async () => {
    if (!supabase || !profile) {
      return;
    }

    setLoadingRows(true);
    setMessage("");

    const { data, error } = await supabase
      .from("nhat_ky_truy_cap")
      .select("id, hanh_dong, doi_tuong, doi_tuong_id, thoi_diem, nguoi_dung:nguoi_dung_id(ho_ten, email)")
      .eq("co_so_id", profile.co_so_id)
      .order("thoi_diem", { ascending: false })
      .limit(120);

    if (error) {
      setMessage(error.message);
      setLoadingRows(false);
      return;
    }

    setRows((data ?? []) as unknown as AuditRow[]);
    setLoadingRows(false);
  }, [profile, setMessage, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRows();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadRows]);

  const objects = useMemo(() => [...new Set(rows.map((row) => row.doi_tuong))].sort(), [rows]);
  const filteredRows = useMemo(() => {
    const normalizedKeyword = normalizeText(keyword.trim());

    return rows.filter((row) => {
      const matchesObject = objectFilter === "all" || row.doi_tuong === objectFilter;
      const actor = row.nguoi_dung?.ho_ten ?? row.nguoi_dung?.email ?? "";
      const matchesKeyword =
        !normalizedKeyword ||
        normalizeText(`${row.hanh_dong} ${row.doi_tuong} ${actor}`).includes(normalizedKeyword);

      return matchesObject && matchesKeyword;
    });
  }, [keyword, objectFilter, rows]);

  if (loading || loadingRows) {
    return <LoadingState label="Đang tải nhật ký thao tác..." />;
  }

  if (!profile) {
    return (
      <EmptyState
        title="Chưa có hồ sơ người dùng"
        description="Hãy thiết lập đơn vị trước khi xem nhật ký."
        action={<Link className="button-primary" href="/thiet-lap">Thiết lập ngay</Link>}
      />
    );
  }

  return (
    <div className="grid gap-6">
      {message ? <Alert tone="warning">{message}</Alert> : null}

      <section className="surface-card grid gap-3 p-5 md:grid-cols-[1fr_220px]">
        <label className="text-sm font-medium">
          Tìm hành động hoặc người thực hiện
          <input
            className="form-control mt-2"
            placeholder="Ví dụ: EVIDENCE, REPORT, Nguyễn Văn A"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </label>
        <label className="text-sm font-medium">
          Đối tượng
          <select
            className="form-control mt-2"
            value={objectFilter}
            onChange={(event) => setObjectFilter(event.target.value)}
          >
            <option value="all">Tất cả</option>
            {objects.map((objectName) => (
              <option key={objectName} value={objectName}>
                {objectName}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">Nhật ký gần đây</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">
            Hệ thống chỉ hiển thị nhật ký trong phạm vi đơn vị theo RLS.
          </p>
        </div>

        {filteredRows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="Không có dòng nhật ký phù hợp"
              description="Hãy đổi bộ lọc hoặc thực hiện một thao tác trong hệ thống để phát sinh nhật ký mới."
            />
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {filteredRows.map((row) => (
              <article className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_auto]" key={row.id}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{row.doi_tuong}</Badge>
                    <span className="font-semibold text-[var(--color-ink-navy)]">{row.hanh_dong}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-graphite)]/70">
                    Người thực hiện: {row.nguoi_dung?.ho_ten ?? row.nguoi_dung?.email ?? "Hệ thống"} ·
                    {" "}Đối tượng ID: {row.doi_tuong_id ?? "Không có"}
                  </p>
                </div>
                <time className="text-sm text-[var(--color-graphite)]/70" dateTime={row.thoi_diem}>
                  {new Date(row.thoi_diem).toLocaleString("vi-VN")}
                </time>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
