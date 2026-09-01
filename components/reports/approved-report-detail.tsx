"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAppContext } from "@/components/shared/use-app-context";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { toUserMessage } from "@/lib/errors/user-message";
import { reportStorageFailure } from "@/lib/observability/client-alerts";
import {
  ApprovedReportRow,
  formatApprovedAt,
  formatFileSize,
  reportOwnerLabel,
  reportTypeLabel,
  schoolLevelLabel,
} from "@/lib/reports/approved-report";

const detailSelect = [
  "id", "loai_bao_cao", "cap_hoc", "version", "trang_thai", "storage_path",
  "ten_tep_goc", "mime_type", "kich_thuoc", "sha256", "export_metadata",
  "ngay_phe_duyet", "created_at", "nam_hoc:nam_hoc_id(ten)",
  "nguoi_tao:nguoi_tao(ho_ten, email)",
  "nguoi_phe_duyet:nguoi_phe_duyet(ho_ten, email)",
].join(", ");

export function ApprovedReportDetail({ reportId }: { reportId: string }) {
  const { loading, message, profile, setMessage, supabase } = useAppContext();
  const [report, setReport] = useState<ApprovedReportRow | null>(null);
  const [loadingReport, setLoadingReport] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const loadReport = useCallback(async () => {
    if (!supabase || !profile) return;

    setLoadingReport(true);
    setMessage("");

    const { data, error } = await supabase
      .from("bao_cao")
      .select(detailSelect)
      .eq("id", reportId)
      .eq("co_so_id", profile.co_so_id)
      .eq("trang_thai", "da_phe_duyet")
      .maybeSingle();

    if (error) {
      setMessage(toUserMessage(error));
      setReport(null);
    } else {
      setReport(data as unknown as ApprovedReportRow | null);
    }

    setLoadingReport(false);
  }, [profile, reportId, setMessage, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadReport(), 0);
    return () => window.clearTimeout(timer);
  }, [loadReport]);

  async function downloadReport() {
    if (!supabase || !report?.storage_path) {
      setMessage("Báo cáo này chưa có tệp lưu trữ để tải xuống.");
      return;
    }

    setDownloading(true);
    setMessage("");
    const { data, error } = await supabase.storage.from("reports").createSignedUrl(report.storage_path, 60);
    setDownloading(false);

    if (error || !data?.signedUrl) {
      void reportStorageFailure("approved_report_signed_url");
      setMessage(toUserMessage(error, "Không tạo được liên kết tải báo cáo. Vui lòng thử lại."));
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  if (loading || loadingReport) return <LoadingState label="Đang tải chi tiết báo cáo…" />;

  if (!report) {
    return (
      <div className="grid gap-4">
        {message ? <Alert tone="warning">{message}</Alert> : null}
        <EmptyState
          title="Không tìm thấy báo cáo đã phê duyệt"
          description="Báo cáo không tồn tại, chưa được phê duyệt hoặc tài khoản của bạn không có quyền xem."
          action={<Link className="button-secondary" href="/bao-cao/da-phe-duyet">Quay lại kho báo cáo</Link>}
        />
      </div>
    );
  }

  const exportedAt = typeof report.export_metadata?.exported_at === "string"
    ? formatApprovedAt(report.export_metadata.exported_at)
    : "Chưa xác định";

  return (
    <div className="grid gap-6">
      {message ? <Alert tone="warning">{message}</Alert> : null}

      <div>
        <Link className="text-sm font-semibold text-[var(--color-action-blue)] hover:underline" href="/bao-cao/da-phe-duyet">
          Quay lại kho báo cáo
        </Link>
      </div>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-5 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={report.trang_thai} />
            <Badge>Phiên bản {report.version}</Badge>
            <Badge>{schoolLevelLabel(report.cap_hoc)}</Badge>
          </div>
          <h2 className="mt-3 text-xl font-semibold text-[var(--color-ink-navy)]">
            {reportTypeLabel(report.loai_bao_cao)}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-graphite)]/70">
            Snapshot chính thức của năm học {report.nam_hoc?.ten ?? "chưa xác định"}.
          </p>
        </div>

        <dl className="grid gap-px bg-[var(--color-border)] sm:grid-cols-2">
          <Metadata label="Năm học" value={report.nam_hoc?.ten ?? "Chưa xác định"} />
          <Metadata label="Cấp học" value={schoolLevelLabel(report.cap_hoc)} />
          <Metadata label="Người tạo" value={reportOwnerLabel(report.nguoi_tao)} />
          <Metadata label="Người phê duyệt" value={reportOwnerLabel(report.nguoi_phe_duyet)} />
          <Metadata label="Thời điểm phê duyệt" value={formatApprovedAt(report.ngay_phe_duyet)} />
          <Metadata label="Thời điểm xuất tệp" value={exportedAt} />
        </dl>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">Tệp báo cáo chính thức</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">
            Liên kết tải chỉ có hiệu lực trong 60 giây và không phải đường dẫn công khai.
          </p>
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <div><dt className="font-medium text-[var(--color-graphite)]/70">Tên tệp</dt><dd className="mt-1 break-all font-semibold text-[var(--color-ink-navy)]">{report.ten_tep_goc ?? "Chưa xác định"}</dd></div>
            <div><dt className="font-medium text-[var(--color-graphite)]/70">Dung lượng</dt><dd className="mt-1 text-[var(--color-ink-navy)]">{formatFileSize(report.kich_thuoc)}</dd></div>
            <div><dt className="font-medium text-[var(--color-graphite)]/70">Định dạng</dt><dd className="mt-1 break-all text-[var(--color-ink-navy)]">{report.mime_type ?? "Chưa xác định"}</dd></div>
            <div><dt className="font-medium text-[var(--color-graphite)]/70">Mã kiểm tra toàn vẹn</dt><dd className="mt-1 break-all font-mono text-xs text-[var(--color-ink-navy)]">{report.sha256 ?? "Chưa xác định"}</dd></div>
          </dl>
          <button
            className="button-primary"
            disabled={!report.storage_path || downloading}
            type="button"
            onClick={() => void downloadReport()}
          >
            {downloading ? "Đang tạo liên kết…" : "Tải báo cáo"}
          </button>
        </div>
        {!report.storage_path ? (
          <div className="border-t border-[var(--color-border)] p-5">
            <Alert tone="warning">Bản ghi đã phê duyệt nhưng chưa có tệp snapshot trong kho lưu trữ.</Alert>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function Metadata({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--color-paper)] px-5 py-4">
      <dt className="text-sm font-medium text-[var(--color-graphite)]/70">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-[var(--color-ink-navy)]">{value}</dd>
    </div>
  );
}
