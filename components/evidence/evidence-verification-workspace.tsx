"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EvidenceSubnav } from "@/components/evidence/evidence-subnav";
import { useAppContext } from "@/components/shared/use-app-context";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { evaluateEvidenceEligibility } from "@/lib/assessment/evidence-eligibility";
import { formatEvidenceStatus } from "@/lib/evidence";
import { toUserMessage } from "@/lib/errors/user-message";

type CriterionLevel = {
  muc: number;
  noi_dung_yeu_cau: string;
};

type Standard = {
  so_thu_tu: number;
  ten: string;
};

type Criterion = {
  id: string;
  ma: string;
  ten: string;
  la_bat_buoc: boolean;
  tieu_chuan?: Standard | Standard[] | null;
  muc_tieu_chi?: CriterionLevel[];
};

type EvidenceLink = {
  la_tieu_chi_goc: boolean;
  tieu_chi?: Criterion | Criterion[] | null;
};

type Uploader = {
  ho_ten: string | null;
  email: string | null;
};

type EvidenceRow = {
  id: string;
  ma: string;
  ten: string;
  loai_tep: string | null;
  duong_dan: string | null;
  storage_path: string | null;
  hash_tep: string | null;
  kich_thuoc: number | null;
  la_du_lieu_demo: boolean;
  ngay_ban_hanh: string | null;
  ngay_het_gia_tri: string | null;
  trang_thai_xac_minh: string;
  created_at: string;
  nguoi_tai_len?: Uploader | Uploader[] | null;
  minh_chung_tieu_chi?: EvidenceLink[];
};

function first<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatFileSize(size: number | null) {
  if (size === null) {
    return "Chưa ghi";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function safeExternalUrl(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function orderedLevels(levels: CriterionLevel[] | undefined) {
  return [...(levels ?? [])].sort((left, right) => left.muc - right.muc);
}

export function EvidenceVerificationWorkspace() {
  const { activeYear, loading, message, profile, setMessage, supabase, years } = useAppContext();
  const [selectedYearId, setSelectedYearId] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rows, setRows] = useState<EvidenceRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [openingFileId, setOpeningFileId] = useState("");
  const [expandedId, setExpandedId] = useState("");
  const [pendingAction, setPendingAction] = useState<{
    id: string;
    name: string;
    status: "da_xac_minh" | "tu_choi";
  } | null>(null);

  const effectiveYearId = selectedYearId || activeYear?.id || "";
  const effectiveYear = useMemo(
    () => years.find((year) => year.id === effectiveYearId) ?? activeYear,
    [activeYear, effectiveYearId, years],
  );

  const loadRows = useCallback(async () => {
    if (!supabase || !profile || !effectiveYearId) {
      return;
    }

    setLoadingRows(true);
    setMessage("");

    let query = supabase
      .from("minh_chung")
      .select(
        "id, ma, ten, loai_tep, duong_dan, storage_path, hash_tep, kich_thuoc, la_du_lieu_demo, ngay_ban_hanh, ngay_het_gia_tri, trang_thai_xac_minh, created_at, nguoi_tai_len:nguoi_tai_len(ho_ten, email), minh_chung_tieu_chi(la_tieu_chi_goc, tieu_chi:tieu_chi_id(id, ma, ten, la_bat_buoc, tieu_chuan:tieu_chuan_id(so_thu_tu, ten), muc_tieu_chi(muc, noi_dung_yeu_cau)))",
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
      setMessage(toUserMessage(error));
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

  async function openStoredFile(row: EvidenceRow) {
    if (!supabase || !row.storage_path) {
      return;
    }

    setOpeningFileId(row.id);
    setMessage("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        setMessage("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        return;
      }

      const response = await fetch(`/api/minh-chung/${row.id}/signed-url`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const payload = (await response.json()) as {
        signedUrl?: string;
        error?: string;
      };

      if (!response.ok || !payload.signedUrl) {
        setMessage(payload.error ?? "Không tạo được liên kết tạm thời.");
        return;
      }

      window.open(payload.signedUrl, "_blank", "noopener,noreferrer");
    } catch {
      setMessage("Không thể mở tệp minh chứng lúc này. Vui lòng thử lại.");
    } finally {
      setOpeningFileId("");
    }
  }

  async function updateStatus(id: string, status: "da_xac_minh" | "tu_choi") {
    if (!supabase || !profile) {
      setMessage("Chưa đủ thông tin người dùng để xác minh minh chứng.");
      return;
    }

    setUpdatingId(id);
    setMessage("");

    const { error } = await supabase.rpc("fn_xac_minh_minh_chung", {
      p_minh_chung_id: id,
      p_trang_thai: status,
    });

    setUpdatingId("");

    if (error) {
      setMessage(toUserMessage(error));
      return;
    }

    setMessage(status === "da_xac_minh" ? "Đã xác minh minh chứng." : "Đã từ chối minh chứng.");
    await loadRows();
  }

  async function confirmPendingAction() {
    if (!pendingAction) {
      return;
    }

    const action = pendingAction;
    setPendingAction(null);
    await updateStatus(action.id, action.status);
  }

  if (loading || loadingRows) {
    return <LoadingState label="Đang tải danh sách minh chứng…" />;
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
      <EvidenceSubnav active="verify" />
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
            <option value="all">Tất cả</option>
            <option value="cho_xac_minh">Chờ xác minh</option>
            <option value="da_xac_minh">Đã xác minh</option>
            <option value="tu_choi">Từ chối</option>
          </select>
        </label>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">Danh sách minh chứng</h2>
              <p className="mt-1 max-w-[72ch] text-sm leading-6 text-[var(--color-graphite)]/70">
                Mở từng minh chứng để đối chiếu nội dung tiêu chí và tệp đính kèm trước khi xác minh.
              </p>
            </div>
            <Badge>{rows.length} minh chứng</Badge>
          </div>
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
                .map((link) => {
                  const criterion = first(link.tieu_chi);
                  return criterion ? { ...criterion, la_tieu_chi_goc: link.la_tieu_chi_goc } : null;
                })
                .filter(Boolean) as Array<Criterion & { la_tieu_chi_goc: boolean }>;
              const uploader = first(row.nguoi_tai_len);
              const externalUrl = safeExternalUrl(row.duong_dan);
              const isExpanded = expandedId === row.id;
              const detailId = `evidence-verification-detail-${row.id}`;
              const eligibility = effectiveYear
                ? evaluateEvidenceEligibility(row, effectiveYear.ngay_ket_thuc)
                : null;
              const verifiedButUnavailable = row.trang_thai_xac_minh === "da_xac_minh"
                && eligibility
                && !eligibility.eligible;

              return (
                <article key={row.id}>
                  <div className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-[var(--color-ink-navy)]">{row.ma}</span>
                        <Badge
                          tone={
                            row.trang_thai_xac_minh === "da_xac_minh"
                              ? "success"
                              : row.trang_thai_xac_minh === "tu_choi"
                                ? "danger"
                                : "warning"
                          }
                        >
                          {formatEvidenceStatus(row.trang_thai_xac_minh)}
                        </Badge>
                        {verifiedButUnavailable ? (
                          <Badge tone="danger">
                            {row.la_du_lieu_demo ? "Dữ liệu demo" : "Hết hiệu lực"}
                          </Badge>
                        ) : null}
                        <span className="text-xs text-[var(--color-graphite)]/65">
                          {criteria.length} tiêu chí
                        </span>
                      </div>
                      <h3 className="mt-2 text-base font-semibold leading-6 text-[var(--color-ink-navy)]">
                        {row.ten}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">
                        Người tải lên: {uploader?.ho_ten ?? uploader?.email ?? "Chưa rõ"} · Ngày ban hành:{" "}
                        {row.ngay_ban_hanh ?? "Chưa nhập"} · Hết giá trị:{" "}
                        {row.ngay_het_gia_tri ?? "Không ghi hạn"}
                      </p>
                      {verifiedButUnavailable ? (
                        <p className="mt-2 text-sm font-medium leading-6 text-[var(--color-danger)]">
                          {eligibility.reason} Minh chứng này không thể gắn vào tự đánh giá chính thức.
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {criteria.length === 0 ? (
                          <Badge>Chưa gắn tiêu chí</Badge>
                        ) : (
                          criteria.map((criterion) => (
                            <Badge key={criterion.id} tone={criterion.la_bat_buoc ? "warning" : "default"}>
                              {criterion.ma}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <button
                        aria-controls={detailId}
                        aria-expanded={isExpanded}
                        className="button-secondary"
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? "" : row.id)}
                      >
                        {isExpanded ? "Thu gọn" : "Xem chi tiết"}
                      </button>
                      {row.trang_thai_xac_minh !== "da_xac_minh" ? (
                        <>
                          <button
                            className="button-secondary"
                            disabled={Boolean(updatingId)}
                            type="button"
                            onClick={() => setPendingAction({ id: row.id, name: row.ten, status: "tu_choi" })}
                          >
                            {updatingId === row.id ? "Đang lưu…" : "Từ chối"}
                          </button>
                          <button
                            className="button-primary"
                            disabled={Boolean(updatingId)}
                            type="button"
                            onClick={() => setPendingAction({ id: row.id, name: row.ten, status: "da_xac_minh" })}
                          >
                            {updatingId === row.id ? "Đang lưu…" : "Xác minh"}
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>

                  {isExpanded ? (
                    <div
                      className="border-t border-[var(--color-border)] bg-[var(--color-lavender-mist)]/25 px-5 py-5"
                      id={detailId}
                    >
                      <div className="grid gap-6 xl:grid-cols-[minmax(260px,0.72fr)_minmax(0,1.28fr)]">
                        <section aria-labelledby={`${detailId}-file`}>
                          <h4
                            className="text-sm font-semibold text-[var(--color-ink-navy)]"
                            id={`${detailId}-file`}
                          >
                            Tệp và thông tin minh chứng
                          </h4>
                          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                            <EvidenceInfo label="Định dạng" value={row.loai_tep ?? "Chưa ghi"} />
                            <EvidenceInfo label="Dung lượng" value={formatFileSize(row.kich_thuoc)} />
                            <EvidenceInfo label="Ngày tải lên" value={row.created_at.slice(0, 10)} />
                            <EvidenceInfo
                              label="SHA-256"
                              value={row.hash_tep ? `${row.hash_tep.slice(0, 14)}…` : "Chưa có"}
                            />
                          </dl>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {row.storage_path ? (
                              <button
                                className="button-primary"
                                disabled={openingFileId === row.id}
                                type="button"
                                onClick={() => void openStoredFile(row)}
                              >
                                {openingFileId === row.id ? "Đang mở…" : "Mở tệp đính kèm"}
                              </button>
                            ) : null}
                            {externalUrl ? (
                              <a
                                className="button-secondary"
                                href={externalUrl}
                                rel="noopener noreferrer"
                                target="_blank"
                              >
                                Mở liên kết điện tử
                              </a>
                            ) : null}
                            <Link className="button-secondary" href={`/minh-chung/${row.id}`}>
                              Mở trang chi tiết
                            </Link>
                          </div>

                          {!row.storage_path && !externalUrl ? (
                            <p className="mt-4 text-sm leading-6 text-[var(--color-warning)]">
                              Minh chứng này chưa có tệp đính kèm hoặc liên kết điện tử để đối chiếu.
                            </p>
                          ) : null}
                          {row.duong_dan && !externalUrl ? (
                            <p className="mt-3 text-sm leading-6 text-[var(--color-danger)]">
                              Liên kết điện tử không hợp lệ hoặc không sử dụng HTTPS/HTTP.
                            </p>
                          ) : null}
                        </section>

                        <section aria-labelledby={`${detailId}-criteria`}>
                          <h4
                            className="text-sm font-semibold text-[var(--color-ink-navy)]"
                            id={`${detailId}-criteria`}
                          >
                            Tiêu chí sử dụng minh chứng
                          </h4>

                          {criteria.length === 0 ? (
                            <p className="mt-3 text-sm leading-6 text-[var(--color-graphite)]/70">
                              Minh chứng này chưa được gắn với tiêu chí nào.
                            </p>
                          ) : (
                            <div className="mt-3 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
                              {criteria.map((criterion) => {
                                const standard = first(criterion.tieu_chuan);
                                const levels = orderedLevels(criterion.muc_tieu_chi);

                                return (
                                  <div className="py-4 first:pt-3 last:pb-3" key={criterion.id}>
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="font-semibold text-[var(--color-ink-navy)]">
                                            {criterion.ma}
                                          </span>
                                          {criterion.la_bat_buoc ? <Badge tone="warning">Bắt buộc</Badge> : null}
                                          {criterion.la_tieu_chi_goc ? <Badge>Tiêu chí gốc</Badge> : null}
                                        </div>
                                        <p className="mt-1 text-sm font-medium leading-6 text-[var(--color-ink-navy)]">
                                          {criterion.ten}
                                        </p>
                                        {standard ? (
                                          <p className="mt-1 text-xs leading-5 text-[var(--color-graphite)]/65">
                                            Tiêu chuẩn {standard.so_thu_tu}: {standard.ten}
                                          </p>
                                        ) : null}
                                      </div>
                                    </div>

                                    {levels.length > 0 ? (
                                      <dl className="mt-3 grid gap-2">
                                        {levels.map((level) => (
                                          <div
                                            className="grid gap-1 text-sm sm:grid-cols-[72px_minmax(0,1fr)]"
                                            key={level.muc}
                                          >
                                            <dt className="font-semibold text-[var(--color-ink-navy)]">
                                              Mức {level.muc}
                                            </dt>
                                            <dd className="leading-6 text-[var(--color-graphite)]/75">
                                              {level.noi_dung_yeu_cau}
                                            </dd>
                                          </div>
                                        ))}
                                      </dl>
                                    ) : (
                                      <p className="mt-2 text-sm text-[var(--color-graphite)]/65">
                                        Chưa có nội dung yêu cầu mức trong bộ tiêu chuẩn đang áp dụng.
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </section>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <ConfirmDialog
        confirmLabel={pendingAction?.status === "da_xac_minh" ? "Xác minh" : "Từ chối"}
        description={
          pendingAction?.status === "da_xac_minh"
            ? `Minh chứng “${pendingAction.name}” sẽ được đánh dấu là đủ tin cậy để sử dụng trong tự đánh giá và báo cáo.`
            : `Minh chứng “${pendingAction?.name ?? ""}” sẽ bị từ chối và cần được thay thế hoặc bổ sung lại.`
        }
        isOpen={Boolean(pendingAction)}
        isWorking={Boolean(updatingId)}
        title={pendingAction?.status === "da_xac_minh" ? "Xác minh minh chứng này?" : "Từ chối minh chứng này?"}
        tone={pendingAction?.status === "da_xac_minh" ? "primary" : "danger"}
        onCancel={() => setPendingAction(null)}
        onConfirm={confirmPendingAction}
      />
    </div>
  );
}

function EvidenceInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[var(--color-graphite)]/65">{label}</dt>
      <dd className="mt-1 break-words font-medium text-[var(--color-ink-navy)]">{value}</dd>
    </div>
  );
}
