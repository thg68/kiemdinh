"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAppContext } from "@/components/shared/use-app-context";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatEvidenceStatus } from "@/lib/evidence";
import { toUserMessage } from "@/lib/errors/user-message";
import { getAssessmentApprovalBlockers } from "@/lib/assessment/approval-readiness";

type Criterion = { id: string; ma: string; ten: string; la_bat_buoc: boolean };
type Evidence = {
  id: string;
  la_du_lieu_demo: boolean;
  ma: string;
  ten: string;
  duong_dan: string | null;
  storage_path: string | null;
  ngay_het_gia_tri: string | null;
  trang_thai_xac_minh: string;
};
type AssessmentEvidenceLink = { minh_chung?: Evidence | Evidence[] | null };
type InternalContentLevel = { muc: number };
type InternalContent = {
  id: string;
  ma: string;
  noi_dung: string;
  trich_dan_goc: string;
  muc_tieu_chi?: InternalContentLevel | InternalContentLevel[] | null;
};
type InternalProposition = {
  id: string;
  noi_dung: string;
  la_dat: boolean;
  la_khong_dat: boolean;
};
type InternalSelection = {
  mo_ta_thuc_te: string;
  noi_ham?: InternalContent | InternalContent[] | null;
  menh_de?: InternalProposition | InternalProposition[] | null;
  lua_chon_noi_ham_minh_chung?: { minh_chung_id: string }[];
};
type Person = { ho_ten: string | null; email: string | null };
type AssessmentRow = {
  id: string;
  la_du_lieu_demo: boolean;
  tieu_chi_id: string;
  cap_hoc: string;
  mo_ta_muc_1: string | null;
  mo_ta_muc_2: string | null;
  muc_dat: 0 | 1 | 2;
  trang_thai: string;
  ngay_cap_nhat: string;
  revision: number;
  nguoi_nhap?: Person | Person[] | null;
  tieu_chi?: Criterion | Criterion[] | null;
  tu_danh_gia_minh_chung?: AssessmentEvidenceLink[];
  lua_chon_noi_ham?: InternalSelection[];
};

const baseAssessmentSelect = "id, tieu_chi_id, cap_hoc, mo_ta_muc_1, mo_ta_muc_2, muc_dat, trang_thai, ngay_cap_nhat, revision, la_du_lieu_demo, nguoi_nhap:nguoi_dung!tu_danh_gia_nguoi_nhap_fkey(ho_ten, email), tieu_chi:tieu_chi!tu_danh_gia_tieu_chi_id_fkey(id, ma, ten, la_bat_buoc), tu_danh_gia_minh_chung!fk_tdg_minh_chung_tu_danh_gia_scope(minh_chung:minh_chung!fk_tdg_minh_chung_minh_chung_scope(id, ma, ten, duong_dan, storage_path, ngay_het_gia_tri, trang_thai_xac_minh, la_du_lieu_demo))";
const internalContentSelect = `${baseAssessmentSelect}, lua_chon_noi_ham(mo_ta_thuc_te, noi_ham:noi_ham!lua_chon_noi_ham_noi_ham_id_fkey(id, ma, noi_dung, trich_dan_goc, muc_tieu_chi:muc_tieu_chi!noi_ham_muc_tieu_chi_id_fkey(muc)), menh_de:menh_de_trang_thai!lua_chon_noi_ham_menh_de_id_noi_ham_id_fkey(id, noi_dung, la_dat, la_khong_dat), lua_chon_noi_ham_minh_chung(minh_chung_id))`;

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

function safeExternalUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function evidenceTone(evidence: Evidence): "success" | "warning" | "danger" {
  if (evidence.trang_thai_xac_minh !== "da_xac_minh") return "warning";
  const today = new Date().toISOString().slice(0, 10);
  return evidence.ngay_het_gia_tri && evidence.ngay_het_gia_tri < today ? "danger" : "success";
}

function internalContentLevel(selection: InternalSelection) {
  const content = first(selection.noi_ham);
  return first(content?.muc_tieu_chi)?.muc ?? 0;
}

function internalPropositionTone(proposition: InternalProposition | null | undefined): "success" | "warning" | "danger" {
  if (proposition?.la_dat) return "success";
  if (proposition?.la_khong_dat) return "danger";
  return "warning";
}

export function AssessmentApprovalWorkspace() {
  const { activeYear, loading, message, profile, setMessage, supabase, years } = useAppContext();
  const [selectedYearId, setSelectedYearId] = useState("");
  const [rows, setRows] = useState<AssessmentRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [openingEvidenceId, setOpeningEvidenceId] = useState("");
  const [actionError, setActionError] = useState("");
  const [pendingAction, setPendingAction] = useState<{
    row: AssessmentRow;
    status: "da_duyet" | "dang_ra_soat";
  } | null>(null);
  const effectiveYearId = selectedYearId || activeYear?.id || "";
  const effectiveYear = years.find((year) => year.id === effectiveYearId) ?? activeYear;
  const today = new Date().toISOString().slice(0, 10);
  const evidenceValidityCutoff = effectiveYear?.ngay_ket_thuc && effectiveYear.ngay_ket_thuc < today
    ? effectiveYear.ngay_ket_thuc
    : today;

  const loadRows = useCallback(async () => {
    if (!supabase || !profile || !effectiveYearId) return;
    setLoadingRows(true);
    setMessage("");
    const fetchRows = (select: string) => supabase
      .from("tu_danh_gia")
      .select(select)
      .eq("co_so_id", profile.co_so_id)
      .eq("nam_hoc_id", effectiveYearId)
      .eq("trang_thai", "cho_duyet")
      .order("ngay_cap_nhat", { ascending: false });

    let { data, error } = await fetchRows(internalContentSelect);

    if (error && /lua_chon_noi_ham|noi_ham/i.test(`${error.code ?? ""} ${error.message ?? ""}`)) {
      ({ data, error } = await fetchRows(baseAssessmentSelect));
    }
    if (error) setMessage(toUserMessage(error, "Không tải được hàng đợi duyệt. Vui lòng thử lại."));
    else setRows((data ?? []) as unknown as AssessmentRow[]);
    setLoadingRows(false);
  }, [effectiveYearId, profile, setMessage, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRows();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadRows]);

  async function openEvidence(evidence: Evidence) {
    const externalUrl = safeExternalUrl(evidence.duong_dan);
    if (externalUrl) {
      window.open(externalUrl, "_blank", "noopener,noreferrer");
      return;
    }
    if (!supabase || !evidence.storage_path) return;
    setOpeningEvidenceId(evidence.id);
    try {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) throw new Error("AUTH_REQUIRED");
      const response = await fetch(`/api/minh-chung/${evidence.id}/signed-url`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const payload = (await response.json()) as { signedUrl?: string; message?: string; error?: string };
      if (!response.ok || !payload.signedUrl) throw new Error(payload.message ?? payload.error ?? "SIGNED_URL_FAILED");
      window.open(payload.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      setMessage(toUserMessage(error, "Không thể mở tệp minh chứng lúc này. Vui lòng thử lại."));
    } finally {
      setOpeningEvidenceId("");
    }
  }

  async function updateStatus(row: AssessmentRow, status: "da_duyet" | "dang_ra_soat") {
    if (!supabase) return false;
    setUpdatingId(row.id);
    setMessage("");
    setActionError("");
    const { error } = await supabase.rpc("fn_cap_nhat_trang_thai_tu_danh_gia", {
      p_nam_hoc_id: effectiveYearId,
      p_cap_hoc: row.cap_hoc,
      p_tieu_chi_id: row.tieu_chi_id,
      p_trang_thai: status,
      p_expected_revision: row.revision,
    });
    setUpdatingId("");
    if (error) {
      const errorMessage = toUserMessage(
        error,
        error.code === "40001"
          ? "Dữ liệu đã thay đổi. Hãy tải lại rồi thao tác lại."
          : error.code === "23514"
            ? "Không thể chốt mức vì minh chứng chưa hợp lệ hoặc dữ liệu vẫn là dữ liệu thử."
            : error.code === "55000"
              ? "Tiêu chí không còn ở trạng thái chờ duyệt. Hãy tải lại danh sách."
              : "Không thể cập nhật trạng thái tự đánh giá.",
      );
      setActionError(errorMessage);
      setMessage(errorMessage);
      await loadRows();
      return false;
    }
    setMessage(status === "da_duyet" ? "Đã chốt mức tự đánh giá." : "Đã trả tiêu chí về rà soát.");
    await loadRows();
    return true;
  }

  if (loading || loadingRows) return <LoadingState label="Đang tải tiêu chí chờ duyệt…" />;
  if (!profile || !activeYear) {
    return <EmptyState title="Chưa có năm học để duyệt" description="Hãy thiết lập đơn vị và năm học trước khi duyệt tự đánh giá." action={<Link className="button-primary" href="/thiet-lap">Thiết lập ngay</Link>} />;
  }

  return (
    <div className="grid gap-6">
      {message ? <Alert tone={message.startsWith("Đã") ? "success" : "warning"}>{message}</Alert> : null}
      <section className="surface-card grid gap-3 p-5 md:grid-cols-[1fr_auto] md:items-end">
        <label className="text-sm font-medium">Năm học
          <select className="form-control mt-2" value={effectiveYearId} onChange={(event) => setSelectedYearId(event.target.value)}>
            {years.map((year) => <option key={year.id} value={year.id}>{year.ten}{year.trang_thai === "dang_hoat_dong" ? " (đang hoạt động)" : ""}</option>)}
          </select>
        </label>
        <Link className="button-secondary" href="/tu-danh-gia">Mở Gap Board</Link>
      </section>
      <section className="surface-card overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">Tiêu chí chờ duyệt</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">Đối chiếu nội dung và từng minh chứng trước khi chốt mức.</p>
        </div>
        {rows.length === 0 ? <div className="p-5"><EmptyState title="Không có tiêu chí chờ duyệt" description="Tiêu chí được gửi duyệt sẽ xuất hiện tại đây." /></div> : (
          <div className="divide-y divide-[var(--color-border)]">
            {rows.map((row) => {
              const criterion = first(row.tieu_chi);
              const author = first(row.nguoi_nhap);
              const evidence = (row.tu_danh_gia_minh_chung ?? []).map((link) => first(link.minh_chung)).filter(Boolean) as Evidence[];
              const approvalBlockers = getAssessmentApprovalBlockers(row, evidence, evidenceValidityCutoff);
              const evidenceById = new Map(evidence.map((item) => [item.id, item]));
              const internalSelections = [...(row.lua_chon_noi_ham ?? [])].sort((left, right) => {
                const levelDifference = internalContentLevel(left) - internalContentLevel(right);
                if (levelDifference !== 0) return levelDifference;
                return (first(left.noi_ham)?.ma ?? "").localeCompare(first(right.noi_ham)?.ma ?? "", "vi");
              });
              return (
                <article className="grid gap-4 px-5 py-5" key={row.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="tabular-nums text-[var(--color-ink-navy)]">{criterion?.ma ?? "?"}</strong>
                        {criterion?.la_bat_buoc ? <Badge tone="warning">Bắt buộc</Badge> : null}
                        <StatusBadge tone="info">{capHocLabels[row.cap_hoc] ?? row.cap_hoc}</StatusBadge>
                        <StatusBadge tone={row.muc_dat === 2 ? "success" : row.muc_dat === 1 ? "warning" : "danger"}>{row.muc_dat === 0 ? "Chưa đạt" : `Mức ${row.muc_dat}`}</StatusBadge>
                      </div>
                      <h3 className="mt-2 text-base font-semibold leading-7 text-[var(--color-ink-navy)]">{criterion?.ten ?? "Tiêu chí không còn tồn tại"}</h3>
                      <p className="mt-1 text-sm text-[var(--color-graphite)]/70">Người nhập: {author?.ho_ten ?? author?.email ?? "Chưa rõ"} · Cập nhật: {new Date(row.ngay_cap_nhat).toLocaleString("vi-VN")}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button className="button-secondary" disabled={Boolean(updatingId)} type="button" onClick={() => { setActionError(""); setPendingAction({ row, status: "dang_ra_soat" }); }}>Trả về rà soát</button>
                      <button
                        aria-describedby={approvalBlockers.length ? `approval-blockers-${row.id}` : undefined}
                        className="button-danger"
                        disabled={Boolean(updatingId) || approvalBlockers.length > 0}
                        title={approvalBlockers[0]}
                        type="button"
                        onClick={() => { setActionError(""); setPendingAction({ row, status: "da_duyet" }); }}
                      >
                        Chốt mức
                      </button>
                    </div>
                  </div>
                  {approvalBlockers.length > 0 ? (
                    <Alert id={`approval-blockers-${row.id}`} tone="warning">
                      <strong>Chưa thể chốt mức.</strong> {approvalBlockers.join(" ")} Hãy trả tiêu chí về rà soát để cập nhật dữ liệu thật và minh chứng hợp lệ.
                    </Alert>
                  ) : null}
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-[var(--radius-card)] bg-[var(--color-info-soft)] p-3"><strong>Mức 1</strong><p className="mt-1 whitespace-pre-wrap text-sm leading-6">{row.mo_ta_muc_1?.trim() || "Chưa có mô tả Mức 1."}</p></div>
                    <div className="rounded-[var(--radius-card)] bg-[var(--color-info-soft)] p-3"><strong>Mức 2</strong><p className="mt-1 whitespace-pre-wrap text-sm leading-6">{row.mo_ta_muc_2?.trim() || "Chưa có mô tả Mức 2."}</p></div>
                  </div>
                  {internalSelections.length > 0 ? (
                    <section>
                      <h4 className="text-sm font-semibold text-[var(--color-ink-navy)]">
                        Đối chiếu Phiếu nội hàm ({internalSelections.length})
                      </h4>
                      <div className="mt-2 divide-y divide-[var(--color-border)] rounded-[var(--radius-card)] border border-[var(--color-border)]">
                        {internalSelections.map((selection, index) => {
                          const content = first(selection.noi_ham);
                          const proposition = first(selection.menh_de);
                          const linkedEvidence = (selection.lua_chon_noi_ham_minh_chung ?? [])
                            .map((link) => evidenceById.get(link.minh_chung_id))
                            .filter(Boolean) as Evidence[];
                          const level = internalContentLevel(selection);

                          return (
                            <div className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.7fr)]" key={content?.id ?? index}>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge>Mức {level || "?"}</Badge>
                                  <strong className="text-sm text-[var(--color-ink-navy)]">
                                    {content?.ma ?? `Nội hàm ${index + 1}`}
                                  </strong>
                                </div>
                                <p className="mt-2 text-sm leading-6 text-[var(--color-graphite)]">
                                  {content?.trich_dan_goc ?? content?.noi_dung ?? "Không tải được yêu cầu gốc."}
                                </p>
                              </div>
                              <div className="min-w-0 text-sm leading-6">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-semibold text-[var(--color-ink-navy)]">Trạng thái đã chọn</span>
                                  <Badge tone={internalPropositionTone(proposition)}>
                                    {proposition?.noi_dung ?? "Chưa xác định"}
                                  </Badge>
                                </div>
                                <p className="mt-2 whitespace-pre-wrap text-[var(--color-graphite)]">
                                  {selection.mo_ta_thuc_te.trim() || "Chưa có ghi nhận thực tế."}
                                </p>
                                <p className="mt-2 text-xs text-[var(--color-graphite)]/70">
                                  Minh chứng: {linkedEvidence.map((item) => item.ma).join(", ") || "Không yêu cầu hoặc chưa gắn"}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  ) : null}
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--color-ink-navy)]">Minh chứng của cấp học này ({evidence.length})</h4>
                    {evidence.length === 0 ? <Alert tone="warning">Chưa có minh chứng được gắn với bản tự đánh giá này.</Alert> : (
                      <div className="mt-2 grid gap-2 md:grid-cols-2">
                        {evidence.map((item) => {
                          const tone = evidenceTone(item);
                          const canOpen = Boolean(safeExternalUrl(item.duong_dan) || item.storage_path);
                          return <div className="surface-card flex items-start justify-between gap-3 p-3" key={item.id}>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2"><strong>{item.ma}</strong><Badge tone={tone}>{tone === "danger" ? "Hết hiệu lực" : formatEvidenceStatus(item.trang_thai_xac_minh)}</Badge></div>
                              <p className="mt-1 text-sm leading-6">{item.ten}</p>
                              <p className="text-xs text-[var(--color-graphite)]/65">Hết giá trị: {item.ngay_het_gia_tri ?? "Không có hạn"}</p>
                            </div>
                            {canOpen ? <button className="button-secondary shrink-0" disabled={openingEvidenceId === item.id} type="button" onClick={() => void openEvidence(item)}>{openingEvidenceId === item.id ? "Đang mở…" : "Mở tệp"}</button> : null}
                          </div>;
                        })}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
      <ConfirmDialog
        confirmLabel={pendingAction?.status === "da_duyet" ? "Chốt mức" : "Trả về rà soát"}
        description={<>
          <p>{pendingAction?.status === "da_duyet" ? "Xác nhận nội dung và minh chứng đã đúng. Dữ liệu đã chốt sẽ không thể sửa trực tiếp." : "Tiêu chí sẽ được mở lại để người phụ trách chỉnh sửa."}</p>
          {actionError ? <p className="mt-3 font-semibold text-[var(--color-danger)]" role="alert">{actionError}</p> : null}
        </>}
        isOpen={Boolean(pendingAction)} isWorking={Boolean(updatingId)}
        title={pendingAction?.status === "da_duyet" ? "Chốt mức tự đánh giá?" : "Trả tiêu chí về rà soát?"}
        tone={pendingAction?.status === "da_duyet" ? "danger" : "warning"}
        onCancel={() => { setActionError(""); setPendingAction(null); }}
        onConfirm={async () => {
          if (!pendingAction) return;
          const action = pendingAction;
          const succeeded = await updateStatus(action.row, action.status);
          if (succeeded) setPendingAction(null);
        }}
      />
    </div>
  );
}
