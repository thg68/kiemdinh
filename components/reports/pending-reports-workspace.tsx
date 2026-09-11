"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ReportSubnav } from "@/components/reports/report-subnav";
import { useAppContext } from "@/components/shared/use-app-context";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { toUserMessage } from "@/lib/errors/user-message";
import { reportStorageFailure } from "@/lib/observability/client-alerts";
import { reportOwnerLabel, reportTypeLabel, schoolLevelLabel } from "@/lib/reports/approved-report";

type ReportOwner = {
  email: string | null;
  ho_ten: string | null;
};

type PendingReportRow = {
  cap_hoc: string | null;
  created_at: string;
  export_metadata: Record<string, unknown> | null;
  id: string;
  kich_thuoc: number | null;
  loai_bao_cao: string;
  mime_type: string | null;
  ngay_gui_duyet: string | null;
  nguoi_gui_duyet?: ReportOwner | ReportOwner[] | null;
  sha256: string | null;
  source_digest: string | null;
  storage_path: string | null;
  ten_tep_goc: string | null;
  trang_thai: string;
  version: number;
};

function first<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDateTime(value: string | null) {
  if (!value) return "Chưa ghi nhận";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function PendingReportsWorkspace() {
  const { activeYear, loading, message, profile, setMessage, supabase, years } = useAppContext();
  const [selectedYearId, setSelectedYearId] = useState("");
  const [rows, setRows] = useState<PendingReportRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [workingId, setWorkingId] = useState("");
  const [openingId, setOpeningId] = useState("");
  const [pendingAction, setPendingAction] = useState<{
    report: PendingReportRow;
    status: "da_phe_duyet" | "tra_lai";
  } | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [dialogError, setDialogError] = useState("");

  const effectiveYearId = selectedYearId || activeYear?.id || "";

  const loadRows = useCallback(async () => {
    if (!supabase || !profile || !effectiveYearId) return;

    setLoadingRows(true);
    setMessage("");
    const { data, error } = await supabase
      .from("bao_cao")
      .select("id, loai_bao_cao, cap_hoc, version, trang_thai, storage_path, ten_tep_goc, mime_type, kich_thuoc, sha256, export_metadata, source_digest, created_at, ngay_gui_duyet, nguoi_gui_duyet:nguoi_gui_duyet(ho_ten, email)")
      .eq("co_so_id", profile.co_so_id)
      .eq("nam_hoc_id", effectiveYearId)
      .eq("trang_thai", "cho_duyet")
      .in("loai_bao_cao", ["mau_1_tu_danh_gia", "mau_2_ke_hoach_cai_tien"])
      .order("ngay_gui_duyet", { ascending: true, nullsFirst: true });

    if (error) {
      setMessage(toUserMessage(error, "Không tải được hàng đợi báo cáo. Vui lòng thử lại."));
      setRows([]);
    } else {
      setRows((data ?? []) as unknown as PendingReportRow[]);
    }
    setLoadingRows(false);
  }, [effectiveYearId, profile, setMessage, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadRows(), 0);
    return () => window.clearTimeout(timer);
  }, [loadRows]);

  async function openSubmittedFile(report: PendingReportRow) {
    if (!supabase || !report.storage_path) {
      setMessage("Bản chờ duyệt này chưa có tệp niêm phong. Hãy tạo lại bản gửi duyệt.");
      return;
    }

    setOpeningId(report.id);
    setMessage("");
    const { data, error } = await supabase.storage.from("reports").createSignedUrl(report.storage_path, 60);
    setOpeningId("");

    if (error || !data?.signedUrl) {
      void reportStorageFailure("pending_report_signed_url");
      setMessage(toUserMessage(error, "Không mở được tệp chờ duyệt. Vui lòng thử lại."));
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function confirmAction() {
    if (!supabase || !pendingAction) return;

    if (pendingAction.status === "tra_lai" && returnReason.trim().length < 5) {
      setDialogError("Lý do trả lại cần có ít nhất 5 ký tự.");
      return;
    }

    const report = pendingAction.report;

    if (
      pendingAction.status === "da_phe_duyet"
      && (!report.storage_path || !report.ten_tep_goc || !report.sha256 || !report.source_digest)
    ) {
      setDialogError("Báo cáo chưa có tệp niêm phong nên chưa thể phê duyệt.");
      return;
    }

    setWorkingId(report.id);
    setDialogError("");
    setMessage("");
    const { error } = await supabase.rpc("fn_luu_trang_thai_bao_cao", {
      p_nam_hoc_id: effectiveYearId,
      p_cap_hoc: report.cap_hoc,
      p_loai_bao_cao: report.loai_bao_cao,
      p_trang_thai: pendingAction.status,
      p_storage_path: report.storage_path,
      p_ten_tep_goc: report.ten_tep_goc,
      p_mime_type: report.mime_type,
      p_kich_thuoc: report.kich_thuoc,
      p_sha256: report.sha256,
      p_export_metadata: report.export_metadata ?? {},
      p_bao_cao_id: report.id,
      p_source_digest: report.source_digest,
      p_ly_do_tra_lai: pendingAction.status === "tra_lai" ? returnReason.trim() : null,
    });
    setWorkingId("");

    if (error) {
      const fallback = pendingAction.status === "da_phe_duyet"
        ? "Không thể phê duyệt: dữ liệu nguồn đã thay đổi hoặc checklist chưa đạt. Hãy trả lại để đơn vị gửi bản mới."
        : "Không thể trả lại báo cáo. Vui lòng thử lại.";
      setDialogError(toUserMessage(error, fallback));
      return;
    }

    setMessage(pendingAction.status === "da_phe_duyet"
      ? "Đã phê duyệt và khóa phiên bản báo cáo chính thức."
      : "Đã trả báo cáo về để chỉnh sửa.");
    setPendingAction(null);
    setReturnReason("");
    await loadRows();
  }

  if (loading) return <LoadingState label="Đang kiểm tra hàng đợi báo cáo…" />;

  if (!profile || !activeYear) {
    return (
      <EmptyState
        title="Chưa có năm học để duyệt báo cáo"
        description="Đơn vị cần có năm học đang hoạt động trước khi sử dụng hàng đợi phê duyệt."
      />
    );
  }

  return (
    <div className="grid gap-6">
      <ReportSubnav active="pending" canApprove />
      {message ? <Alert tone={message.startsWith("Đã") ? "success" : "warning"}>{message}</Alert> : null}

      <section className="surface-card p-5">
        <label className="block text-sm font-medium">
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
      </section>

      <section className="surface-card overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">Báo cáo chờ duyệt</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">
              Mở đúng tệp đã niêm phong để rà soát trước khi phê duyệt hoặc trả lại.
            </p>
          </div>
          <Badge>{rows.length} báo cáo</Badge>
        </div>

        {loadingRows ? (
          <div className="p-5"><LoadingState label="Đang tải báo cáo chờ duyệt…" /></div>
        ) : rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="Không có báo cáo chờ duyệt"
              description="Báo cáo sẽ xuất hiện tại đây sau khi người lập tạo và gửi bản niêm phong."
            />
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {rows.map((report) => {
              const sender = first(report.nguoi_gui_duyet);
              const hasSealedFile = Boolean(report.storage_path && report.source_digest && report.sha256);

              return (
                <article className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center" key={report.id}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-[var(--color-ink-navy)]">
                        {reportTypeLabel(report.loai_bao_cao)}
                      </h3>
                      <StatusBadge status={report.trang_thai} />
                      <Badge>Phiên bản {report.version}</Badge>
                    </div>
                    <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm leading-6 text-[var(--color-graphite)]/75 sm:grid-cols-2">
                      <div><dt className="inline font-medium">Cấp học: </dt><dd className="inline">{schoolLevelLabel(report.cap_hoc)}</dd></div>
                      <div><dt className="inline font-medium">Gửi lúc: </dt><dd className="inline">{formatDateTime(report.ngay_gui_duyet)}</dd></div>
                      <div><dt className="inline font-medium">Người gửi: </dt><dd className="inline">{reportOwnerLabel(sender)}</dd></div>
                      <div><dt className="inline font-medium">Tệp: </dt><dd className="inline">{report.ten_tep_goc ?? "Chưa có tệp"}</dd></div>
                    </dl>
                    {!hasSealedFile ? (
                      <p className="mt-3 text-sm font-medium text-[var(--color-danger)]">
                        Bản ghi cũ chưa có tệp niêm phong; chưa thể phê duyệt.
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    {hasSealedFile ? (
                      <button className="button-secondary" disabled={openingId === report.id} type="button" onClick={() => void openSubmittedFile(report)}>
                        {openingId === report.id ? "Đang mở…" : "Xem bản gửi duyệt"}
                      </button>
                    ) : (
                      <Link className="button-secondary" href="/bao-cao">Tạo lại bản gửi duyệt</Link>
                    )}
                    <button
                      className="button-secondary"
                      disabled={Boolean(workingId)}
                      type="button"
                      onClick={() => {
                        setDialogError("");
                        setPendingAction({ report, status: "tra_lai" });
                      }}
                    >
                      Trả lại
                    </button>
                    <button
                      className="button-danger"
                      disabled={!hasSealedFile || Boolean(workingId)}
                      type="button"
                      onClick={() => {
                        setDialogError("");
                        setPendingAction({ report, status: "da_phe_duyet" });
                      }}
                    >
                      Phê duyệt
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <ConfirmDialog
        confirmLabel={pendingAction?.status === "da_phe_duyet" ? "Phê duyệt báo cáo" : "Trả lại báo cáo"}
        description={pendingAction?.status === "tra_lai" ? (
          <label className="block font-medium text-[var(--color-ink-navy)]">
            Lý do trả lại
            <textarea
              className="form-control mt-2 min-h-28 font-normal"
              maxLength={1000}
              placeholder="Nêu rõ nội dung cần bổ sung hoặc sửa lại."
              value={returnReason}
              onChange={(event) => {
                setReturnReason(event.target.value);
                setDialogError("");
              }}
            />
            {dialogError ? <span className="mt-2 block text-xs text-[var(--color-danger)]">{dialogError}</span> : null}
          </label>
        ) : (
          <div>
            <p>Bản báo cáo đã niêm phong sẽ trở thành snapshot chính thức và không thể ghi đè.</p>
            {dialogError ? <p className="mt-2 text-[var(--color-danger)]">{dialogError}</p> : null}
          </div>
        )}
        isOpen={Boolean(pendingAction)}
        isWorking={Boolean(workingId)}
        title={pendingAction?.status === "da_phe_duyet" ? "Phê duyệt báo cáo này?" : "Trả báo cáo về để chỉnh sửa?"}
        tone={pendingAction?.status === "da_phe_duyet" ? "danger" : "warning"}
        onCancel={() => {
          setPendingAction(null);
          setReturnReason("");
          setDialogError("");
        }}
        onConfirm={() => void confirmAction()}
      />
    </div>
  );
}
