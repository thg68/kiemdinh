"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAppContext } from "@/components/shared/use-app-context";

type Criterion = {
  id: string;
  ma: string;
  ten: string;
  la_bat_buoc: boolean;
};

type AssessmentRow = {
  id: string;
  tieu_chi_id: string;
  cap_hoc: string;
  mo_ta_muc_1: string | null;
  mo_ta_muc_2: string | null;
  muc_dat: 0 | 1 | 2;
  trang_thai: string;
  ngay_cap_nhat: string;
  nguoi_nhap?: {
    ho_ten: string | null;
    email: string | null;
  } | null;
  tieu_chi?: Criterion | Criterion[] | null;
};

const capHocLabels: Record<string, string> = {
  mam_non: "Mầm non",
  tieu_hoc: "Tiểu học",
  thcs: "THCS",
  thpt: "THPT",
  gdtx: "GDTX",
  khac: "Khác",
};

function first<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function levelLabel(level: 0 | 1 | 2) {
  return level === 0 ? "Chưa đạt" : `Mức ${level}`;
}

export function AssessmentApprovalWorkspace() {
  const { activeYear, loading, message, profile, setMessage, supabase, years } = useAppContext();
  const [selectedYearId, setSelectedYearId] = useState("");
  const [rows, setRows] = useState<AssessmentRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [pendingAction, setPendingAction] = useState<{
    row: AssessmentRow;
    status: "da_duyet" | "dang_ra_soat";
  } | null>(null);

  const effectiveYearId = selectedYearId || activeYear?.id || "";

  const loadRows = useCallback(async () => {
    if (!supabase || !profile || !effectiveYearId) {
      return;
    }

    setLoadingRows(true);
    setMessage("");

    const { data, error } = await supabase
      .from("tu_danh_gia")
      .select(
        "id, tieu_chi_id, cap_hoc, mo_ta_muc_1, mo_ta_muc_2, muc_dat, trang_thai, ngay_cap_nhat, nguoi_nhap:nguoi_nhap(ho_ten, email), tieu_chi:tieu_chi_id(id, ma, ten, la_bat_buoc)",
      )
      .eq("co_so_id", profile.co_so_id)
      .eq("nam_hoc_id", effectiveYearId)
      .eq("trang_thai", "cho_duyet")
      .order("ngay_cap_nhat", { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoadingRows(false);
      return;
    }

    setRows((data ?? []) as unknown as AssessmentRow[]);
    setLoadingRows(false);
  }, [effectiveYearId, profile, setMessage, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRows();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadRows]);

  async function updateStatus(row: AssessmentRow, status: "da_duyet" | "dang_ra_soat") {
    if (!supabase) {
      setMessage("Chưa cấu hình Supabase.");
      return;
    }

    setUpdatingId(row.id);
    setMessage("");

    const { error } = await supabase.rpc("fn_cap_nhat_trang_thai_tu_danh_gia", {
      p_nam_hoc_id: effectiveYearId,
      p_cap_hoc: row.cap_hoc,
      p_tieu_chi_id: row.tieu_chi_id,
      p_trang_thai: status,
    });

    setUpdatingId("");

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(status === "da_duyet" ? "Đã chốt mức tự đánh giá." : "Đã trả tiêu chí về rà soát.");
    await loadRows();
  }

  async function confirmPendingAction() {
    if (!pendingAction) {
      return;
    }

    const action = pendingAction;
    setPendingAction(null);
    await updateStatus(action.row, action.status);
  }

  if (loading || loadingRows) {
    return <LoadingState label="Đang tải tiêu chí chờ duyệt..." />;
  }

  if (!profile || !activeYear) {
    return (
      <EmptyState
        title="Chưa có năm học để duyệt"
        description="Hãy thiết lập đơn vị và năm học trước khi duyệt tự đánh giá."
        action={<Link className="button-primary" href="/thiet-lap">Thiết lập ngay</Link>}
      />
    );
  }

  return (
    <div className="grid gap-6">
      {message ? <Alert tone={message.startsWith("Đã") ? "success" : "warning"}>{message}</Alert> : null}

      <section className="surface-card grid gap-3 p-5 md:grid-cols-[1fr_auto] md:items-end">
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
        <Link className="button-secondary" href="/tu-danh-gia">
          Mở Gap Board
        </Link>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">Tiêu chí chờ duyệt</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">
            Chỉ chốt khi mô tả hiện trạng và mã minh chứng đã đủ theo quy định của hệ thống.
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="Không có tiêu chí chờ duyệt"
              description="Khi giáo viên hoặc ủy viên gửi duyệt, tiêu chí sẽ xuất hiện tại đây."
            />
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {rows.map((row) => {
              const criterion = first(row.tieu_chi);

              return (
                <article className="grid gap-4 px-5 py-4 lg:grid-cols-[1fr_auto]" key={row.id}>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold tabular-nums text-[var(--color-ink-navy)]">{criterion?.ma ?? "?"}</span>
                      {criterion?.la_bat_buoc ? <Badge tone="warning">Bắt buộc</Badge> : null}
                      <StatusBadge tone="info">{capHocLabels[row.cap_hoc] ?? row.cap_hoc}</StatusBadge>
                      <StatusBadge tone={row.muc_dat === 2 ? "success" : row.muc_dat === 1 ? "warning" : "danger"}>
                        {levelLabel(row.muc_dat)}
                      </StatusBadge>
                    </div>
                    <h3 className="mt-2 text-base font-semibold leading-7 text-[var(--color-ink-navy)]">
                      {criterion?.ten ?? "Tiêu chí không còn tồn tại"}
                    </h3>
                    <div className="mt-3 grid gap-2 text-sm leading-6 md:grid-cols-2">
                      <div className="rounded-[var(--radius-card)] bg-[var(--color-info-soft)] p-3">
                        <p className="font-semibold text-[var(--color-ink-navy)]">Mức 1</p>
                        <p className="mt-1 line-clamp-3 text-[var(--color-graphite)]/78">
                          {row.mo_ta_muc_1?.trim() || "Chưa có mô tả Mức 1."}
                        </p>
                      </div>
                      <div className="rounded-[var(--radius-card)] bg-[var(--color-info-soft)] p-3">
                        <p className="font-semibold text-[var(--color-ink-navy)]">Mức 2</p>
                        <p className="mt-1 line-clamp-3 text-[var(--color-graphite)]/78">
                          {row.mo_ta_muc_2?.trim() || "Chưa có mô tả Mức 2."}
                        </p>
                      </div>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">
                      Người nhập: {row.nguoi_nhap?.ho_ten ?? row.nguoi_nhap?.email ?? "Chưa rõ"} ·
                      {" "}Cập nhật: {new Date(row.ngay_cap_nhat).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <button
                      className="button-secondary"
                      disabled={Boolean(updatingId)}
                      type="button"
                      onClick={() => setPendingAction({ row, status: "dang_ra_soat" })}
                    >
                      {updatingId === row.id ? "Đang lưu..." : "Trả về rà soát"}
                    </button>
                    <button
                      className="button-danger"
                      disabled={Boolean(updatingId)}
                      type="button"
                      onClick={() => setPendingAction({ row, status: "da_duyet" })}
                    >
                      {updatingId === row.id ? "Đang lưu..." : "Chốt mức"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
      <ConfirmDialog
        confirmLabel={pendingAction?.status === "da_duyet" ? "Chốt mức" : "Trả về rà soát"}
        description={
          pendingAction?.status === "da_duyet"
            ? "Tiêu chí sẽ được chốt theo nội dung đang hiển thị trong hàng đợi. Hãy chắc chắn mô tả hiện trạng và mức tự đánh giá đã phù hợp."
            : "Tiêu chí sẽ quay lại trạng thái rà soát để người phụ trách chỉnh sửa hoặc bổ sung minh chứng."
        }
        isOpen={Boolean(pendingAction)}
        isWorking={Boolean(updatingId)}
        title={pendingAction?.status === "da_duyet" ? "Chốt mức tự đánh giá?" : "Trả tiêu chí về rà soát?"}
        tone={pendingAction?.status === "da_duyet" ? "danger" : "warning"}
        onCancel={() => setPendingAction(null)}
        onConfirm={confirmPendingAction}
      />
    </div>
  );
}
