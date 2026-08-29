"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppContext } from "@/components/shared/use-app-context";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { toUserMessage } from "@/lib/errors/user-message";
import {
  ApprovedReportRow,
  formatApprovedAt,
  reportOwnerLabel,
  reportTypeLabel,
  reportTypeLabels,
  schoolLevelLabel,
} from "@/lib/reports/approved-report";

const reportSelect = [
  "id", "loai_bao_cao", "cap_hoc", "version", "trang_thai", "storage_path",
  "ten_tep_goc", "mime_type", "kich_thuoc", "sha256", "export_metadata",
  "ngay_phe_duyet", "created_at",
  "nguoi_tao:nguoi_tao(ho_ten, email)",
  "nguoi_phe_duyet:nguoi_phe_duyet(ho_ten, email)",
].join(", ");

export function ApprovedReportsWorkspace() {
  const { activeYear, loading, message, profile, setMessage, supabase, years } = useAppContext();
  const [selectedYearId, setSelectedYearId] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [rows, setRows] = useState<ApprovedReportRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [downloadingId, setDownloadingId] = useState("");

  const effectiveYearId = selectedYearId || activeYear?.id || "";

  const loadRows = useCallback(async () => {
    if (!supabase || !profile || !effectiveYearId) return;

    setLoadingRows(true);
    setMessage("");

    const { data, error } = await supabase
      .from("bao_cao")
      .select(reportSelect)
      .eq("co_so_id", profile.co_so_id)
      .eq("nam_hoc_id", effectiveYearId)
      .eq("trang_thai", "da_phe_duyet")
      .order("ngay_phe_duyet", { ascending: false });

    if (error) {
      setMessage(toUserMessage(error));
      setRows([]);
    } else {
      setRows((data ?? []) as unknown as ApprovedReportRow[]);
    }

    setLoadingRows(false);
  }, [effectiveYearId, profile, setMessage, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadRows(), 0);
    return () => window.clearTimeout(timer);
  }, [loadRows]);

  const visibleRows = useMemo(
    () => rows.filter((row) => selectedType === "all" || row.loai_bao_cao === selectedType),
    [rows, selectedType],
  );

  async function downloadApprovedReport(row: ApprovedReportRow) {
    if (!supabase || !row.storage_path) {
      setMessage("Báo cáo này chưa có tệp lưu trữ để tải xuống.");
      return;
    }

    setDownloadingId(row.id);
    setMessage("");
    const { data, error } = await supabase.storage.from("reports").createSignedUrl(row.storage_path, 60);
    setDownloadingId("");

    if (error || !data?.signedUrl) {
      setMessage(toUserMessage(error, "Không tạo được liên kết tải báo cáo. Vui lòng thử lại."));
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  if (loading) return <LoadingState label="Đang tải kho báo cáo…" />;

  if (!profile || !activeYear) {
    return (
      <EmptyState
        title="Chưa có năm học để xem báo cáo"
        description="Tài khoản cần thuộc một đơn vị có năm học đang hoạt động trước khi xem báo cáo đã phê duyệt."
      />
    );
  }

  return (
    <div className="grid gap-6">
      {message ? <Alert tone="warning">{message}</Alert> : null}

      <section className="surface-card grid gap-4 p-5 md:grid-cols-2">
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
          Loại báo cáo
          <select
            className="form-control mt-2"
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value)}
          >
            <option value="all">Tất cả loại báo cáo</option>
            {Object.entries(reportTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">Kho báo cáo đã phê duyệt</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">
              Các bản tại đây là snapshot chính thức, chỉ đọc và không thể ghi đè.
            </p>
          </div>
          <Badge>{visibleRows.length} báo cáo</Badge>
        </div>

        {loadingRows ? (
          <div className="p-5"><LoadingState label="Đang tải báo cáo…" /></div>
        ) : visibleRows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title={rows.length === 0 ? "Chưa có báo cáo đã phê duyệt" : "Không có báo cáo phù hợp"}
              description={rows.length === 0
                ? "Báo cáo sẽ xuất hiện tại đây sau khi người có thẩm quyền phê duyệt."
                : "Hãy chọn loại báo cáo khác để xem các bản đã phê duyệt trong năm học này."}
            />
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {visibleRows.map((row) => (
              <article className="grid gap-4 px-5 py-5 lg:grid-cols-[1fr_auto] lg:items-center" key={row.id}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-[var(--color-ink-navy)]">
                      {reportTypeLabel(row.loai_bao_cao)}
                    </h3>
                    <StatusBadge status={row.trang_thai} />
                    <Badge>Phiên bản {row.version}</Badge>
                  </div>
                  <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm leading-6 text-[var(--color-graphite)]/75 sm:grid-cols-2">
                    <div><dt className="inline font-medium">Cấp học: </dt><dd className="inline">{schoolLevelLabel(row.cap_hoc)}</dd></div>
                    <div><dt className="inline font-medium">Phê duyệt: </dt><dd className="inline">{formatApprovedAt(row.ngay_phe_duyet)}</dd></div>
                    <div><dt className="inline font-medium">Người tạo: </dt><dd className="inline">{reportOwnerLabel(row.nguoi_tao)}</dd></div>
                    <div><dt className="inline font-medium">Người phê duyệt: </dt><dd className="inline">{reportOwnerLabel(row.nguoi_phe_duyet)}</dd></div>
                  </dl>
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Link className="button-secondary" href={`/bao-cao/da-phe-duyet/${row.id}`}>
                    Xem chi tiết
                  </Link>
                  <button
                    className="button-primary"
                    disabled={!row.storage_path || downloadingId === row.id}
                    type="button"
                    onClick={() => void downloadApprovedReport(row)}
                  >
                    {downloadingId === row.id ? "Đang tạo liên kết…" : "Tải báo cáo"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
