"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAppContext } from "@/components/shared/use-app-context";

type ReportRow = {
  id: string;
  loai_bao_cao: string;
  version: number;
  trang_thai: string;
  storage_path: string | null;
  ngay_phe_duyet: string | null;
  nguoi_tao?: {
    ho_ten: string | null;
    email: string | null;
  } | null;
  nguoi_phe_duyet?: {
    ho_ten: string | null;
    email: string | null;
  } | null;
};

const reportTypeLabels: Record<string, string> = {
  mau_1_tu_danh_gia: "Mẫu 1 - Báo cáo tự đánh giá",
  mau_2_ke_hoach_cai_tien: "Mẫu 2 - Kế hoạch cải tiến",
  danh_muc_minh_chung: "Danh mục minh chứng",
  goi_minh_chung: "Gói minh chứng",
  du_lieu_nam_hoc_json: "Dữ liệu đầy đủ năm học",
};

export function ApprovedReportsWorkspace() {
  const { activeYear, loading, message, profile, setMessage, supabase, years } = useAppContext();
  const [selectedYearId, setSelectedYearId] = useState("");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [downloadingId, setDownloadingId] = useState("");

  const effectiveYearId = selectedYearId || activeYear?.id || "";

  const loadRows = useCallback(async () => {
    if (!supabase || !profile || !effectiveYearId) {
      return;
    }

    setLoadingRows(true);
    setMessage("");

    const { data, error } = await supabase
      .from("bao_cao")
      .select(
        "id, loai_bao_cao, version, trang_thai, storage_path, ngay_phe_duyet, nguoi_tao:nguoi_tao(ho_ten, email), nguoi_phe_duyet:nguoi_phe_duyet(ho_ten, email)",
      )
      .eq("co_so_id", profile.co_so_id)
      .eq("nam_hoc_id", effectiveYearId)
      .eq("trang_thai", "da_phe_duyet")
      .order("ngay_phe_duyet", { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoadingRows(false);
      return;
    }

    setRows((data ?? []) as unknown as ReportRow[]);
    setLoadingRows(false);
  }, [effectiveYearId, profile, setMessage, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRows();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadRows]);

  async function downloadApprovedReport(row: ReportRow) {
    if (!supabase || !row.storage_path) {
      setMessage("Báo cáo này chưa có file lưu trữ để tải xuống.");
      return;
    }

    setDownloadingId(row.id);
    setMessage("");

    const { data, error } = await supabase.storage
      .from("reports")
      .createSignedUrl(row.storage_path, 60);

    setDownloadingId("");

    if (error || !data?.signedUrl) {
      setMessage(error?.message ?? "Không tạo được liên kết tải báo cáo.");
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  if (loading || loadingRows) {
    return <LoadingState label="Đang tải báo cáo đã phê duyệt..." />;
  }

  if (!profile || !activeYear) {
    return (
      <EmptyState
        title="Chưa có năm học để xem báo cáo"
        description="Hãy thiết lập đơn vị và năm học trước khi xem báo cáo đã phê duyệt."
        action={<Link className="button-primary" href="/thiet-lap">Thiết lập ngay</Link>}
      />
    );
  }

  return (
    <div className="grid gap-6">
      {message ? <Alert tone="warning">{message}</Alert> : null}

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
        <Link className="button-secondary" href="/bao-cao">
          Mở màn xuất báo cáo
        </Link>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">Báo cáo đã phê duyệt</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">
            Khách chỉ đọc chỉ nên xem các báo cáo ở trạng thái đã phê duyệt.
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="Chưa có báo cáo đã phê duyệt"
              description="Khi Hiệu trưởng hoặc Chủ tịch hội đồng phê duyệt báo cáo, bản ghi sẽ xuất hiện tại đây."
            />
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {rows.map((row) => (
              <article className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_auto]" key={row.id}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-[var(--color-ink-navy)]">
                      {reportTypeLabels[row.loai_bao_cao] ?? row.loai_bao_cao}
                    </h3>
                    <StatusBadge status={row.trang_thai} />
                    <Badge>v{row.version}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-graphite)]/70">
                    Người tạo: {row.nguoi_tao?.ho_ten ?? row.nguoi_tao?.email ?? "Chưa rõ"} ·
                    {" "}Người phê duyệt: {row.nguoi_phe_duyet?.ho_ten ?? row.nguoi_phe_duyet?.email ?? "Chưa rõ"}
                  </p>
                  {row.storage_path ? (
                    <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">
                      File lưu trữ: {row.storage_path}
                    </p>
                  ) : (
                    <Alert className="mt-3" tone="warning">
                      Bản ghi đã phê duyệt nhưng chưa có file lưu trữ. Hãy mở màn xuất báo cáo và xuất lại từ dữ liệu hiện tại.
                    </Alert>
                  )}
                </div>
                <div className="grid gap-3 md:justify-items-end">
                  <time className="text-sm text-[var(--color-graphite)]/70" dateTime={row.ngay_phe_duyet ?? undefined}>
                    {row.ngay_phe_duyet ? new Date(row.ngay_phe_duyet).toLocaleString("vi-VN") : "Chưa có ngày phê duyệt"}
                  </time>
                  {row.storage_path ? (
                    <button
                      className="button-primary"
                      disabled={downloadingId === row.id}
                      type="button"
                      onClick={() => void downloadApprovedReport(row)}
                    >
                      {downloadingId === row.id ? "Đang tạo liên kết..." : "Tải file đã phê duyệt"}
                    </button>
                  ) : (
                    <Link className="button-secondary" href="/bao-cao">
                      Mở màn xuất file
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
