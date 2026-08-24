"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { formatEvidenceStatus } from "@/lib/evidence";
import { useAppContext } from "@/components/shared/use-app-context";

type Criterion = {
  id: string;
  ma: string;
  ten: string;
  la_bat_buoc: boolean;
};

type EvidenceLink = {
  tieu_chi?: Criterion | Criterion[] | null;
};

type EvidenceRow = {
  id: string;
  ma: string;
  ten: string;
  ngay_ban_hanh: string | null;
  ngay_het_gia_tri: string | null;
  trang_thai_xac_minh: string;
  created_at: string;
  nguoi_tai_len?: {
    ho_ten: string | null;
    email: string | null;
  } | null;
  minh_chung_tieu_chi?: EvidenceLink[];
};

function first<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function EvidenceVerificationWorkspace() {
  const { activeYear, loading, message, profile, setMessage, supabase, years } = useAppContext();
  const [selectedYearId, setSelectedYearId] = useState("");
  const [statusFilter, setStatusFilter] = useState("cho_xac_minh");
  const [rows, setRows] = useState<EvidenceRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [updatingId, setUpdatingId] = useState("");

  const effectiveYearId = selectedYearId || activeYear?.id || "";

  const loadRows = useCallback(async () => {
    if (!supabase || !profile || !effectiveYearId) {
      return;
    }

    setLoadingRows(true);
    setMessage("");

    let query = supabase
      .from("minh_chung")
      .select(
        "id, ma, ten, ngay_ban_hanh, ngay_het_gia_tri, trang_thai_xac_minh, created_at, nguoi_tai_len:nguoi_tai_len(ho_ten, email), minh_chung_tieu_chi(tieu_chi:tieu_chi_id(id, ma, ten, la_bat_buoc))",
      )
      .eq("co_so_id", profile.co_so_id)
      .eq("nam_hoc_id", effectiveYearId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("trang_thai_xac_minh", statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      setMessage(error.message);
      setLoadingRows(false);
      return;
    }

    setRows((data ?? []) as unknown as EvidenceRow[]);
    setLoadingRows(false);
  }, [effectiveYearId, profile, setMessage, statusFilter, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRows();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadRows]);

  async function updateStatus(id: string, status: "da_xac_minh" | "tu_choi") {
    if (!supabase || !profile) {
      setMessage("Chưa đủ thông tin người dùng để xác minh minh chứng.");
      return;
    }

    setUpdatingId(id);
    setMessage("");

    const { error } = await supabase
      .from("minh_chung")
      .update({
        trang_thai_xac_minh: status,
        nguoi_xac_minh: profile.id,
        ngay_xac_minh: new Date().toISOString(),
      })
      .eq("id", id);

    setUpdatingId("");

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(status === "da_xac_minh" ? "Đã xác minh minh chứng." : "Đã từ chối minh chứng.");
    await loadRows();
  }

  if (loading || loadingRows) {
    return <LoadingState label="Đang tải hàng đợi xác minh..." />;
  }

  if (!profile || !activeYear) {
    return (
      <EmptyState
        title="Chưa có năm học để xác minh"
        description="Hãy thiết lập đơn vị và năm học trước khi xác minh minh chứng."
        action={<Link className="button-primary" href="/thiet-lap">Thiết lập ngay</Link>}
      />
    );
  }

  return (
    <div className="grid gap-6">
      {message ? <Alert tone={message.startsWith("Đã") ? "success" : "warning"}>{message}</Alert> : null}

      <section className="surface-card grid gap-3 p-5 md:grid-cols-2">
        <label className="text-sm font-medium">
          Năm học
          <select
            className="form-control mt-2"
            value={effectiveYearId}
            onChange={(event) => setSelectedYearId(event.target.value)}
          >
            {years.map((year) => (
              <option key={year.id} value={year.id}>
                {year.ten} {year.trang_thai === "dang_hoat_dong" ? "(đang hoạt động)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Trạng thái
          <select
            className="form-control mt-2"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="cho_xac_minh">Chờ xác minh</option>
            <option value="da_xac_minh">Đã xác minh</option>
            <option value="tu_choi">Từ chối</option>
            <option value="all">Tất cả</option>
          </select>
        </label>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">Hàng đợi minh chứng</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">
            Xác minh để biết minh chứng nào đã đủ tin cậy cho tự đánh giá và báo cáo.
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="Không có minh chứng phù hợp"
              description="Hiện không có minh chứng nào trong trạng thái đã chọn."
              action={<Link className="button-secondary" href="/minh-chung">Quay về kho minh chứng</Link>}
            />
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {rows.map((row) => {
              const criteria = (row.minh_chung_tieu_chi ?? [])
                .map((link) => first(link.tieu_chi))
                .filter(Boolean) as Criterion[];

              return (
                <article className="grid gap-4 px-5 py-4 lg:grid-cols-[1fr_auto]" key={row.id}>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link className="font-semibold text-[var(--color-ink-navy)] hover:underline" href={`/minh-chung/${row.id}`}>
                        {row.ma}
                      </Link>
                      <Badge tone={row.trang_thai_xac_minh === "da_xac_minh" ? "success" : row.trang_thai_xac_minh === "tu_choi" ? "danger" : "warning"}>
                        {formatEvidenceStatus(row.trang_thai_xac_minh)}
                      </Badge>
                    </div>
                    <h3 className="mt-2 text-base font-semibold leading-7 text-[var(--color-ink-navy)]">{row.ten}</h3>
                    <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">
                      Người tải lên: {row.nguoi_tai_len?.ho_ten ?? row.nguoi_tai_len?.email ?? "Chưa rõ"} ·
                      {" "}Ngày ban hành: {row.ngay_ban_hanh ?? "Chưa nhập"} ·
                      {" "}Hết giá trị: {row.ngay_het_gia_tri ?? "Không ghi hạn"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {criteria.length === 0 ? <Badge>Chưa gắn tiêu chí</Badge> : criteria.map((criterion) => (
                        <Badge key={criterion.id} tone={criterion.la_bat_buoc ? "warning" : "default"}>
                          {criterion.ma}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <button
                      className="button-secondary"
                      disabled={Boolean(updatingId)}
                      type="button"
                      onClick={() => updateStatus(row.id, "tu_choi")}
                    >
                      {updatingId === row.id ? "Đang lưu..." : "Từ chối"}
                    </button>
                    <button
                      className="button-primary"
                      disabled={Boolean(updatingId)}
                      type="button"
                      onClick={() => updateStatus(row.id, "da_xac_minh")}
                    >
                      {updatingId === row.id ? "Đang lưu..." : "Xác minh"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
