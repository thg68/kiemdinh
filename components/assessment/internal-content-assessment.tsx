"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LoadingState } from "@/components/ui/loading-state";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  evaluateInternalContentAssessment,
  findSelectedProposition,
  isInternalContentSatisfied,
  LuaChonNoiHamDraft,
  MenhDeTrangThai,
  MucNoiHam,
  NoiHamDanhGia,
} from "@/lib/assessment/internal-content-engine";
import { CapHoc } from "@/lib/assessment/level-engine";
import { toUserMessage } from "@/lib/errors/user-message";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type SupabaseClient = ReturnType<typeof createBrowserSupabaseClient>;

type Criterion = {
  id: string;
  ma: string;
  ten: string;
  la_bat_buoc: boolean;
  minh_chung_goi_y?: { mo_ta: string }[];
};

type AssessmentRow = {
  id: string;
  mo_ta_muc_1: string | null;
  mo_ta_muc_2: string | null;
  muc_dat: 0 | 1 | 2;
  trang_thai: string;
  revision: number;
};

type EvidenceOption = {
  eligible: boolean;
  id: string;
  ma: string;
  reason: string | null;
  ten: string;
};

type ContentRow = {
  id: string;
  ma: string;
  muc: MucNoiHam;
  noi_dung: string;
  trich_dan_goc: string;
  thu_tu: number;
};

type PropositionRow = {
  id: string;
  noi_ham_id: string;
  ma: string;
  noi_dung: string;
  loai: MenhDeTrangThai["loai"];
  la_dat: boolean;
  la_khong_dat: boolean;
  yeu_cau_minh_chung: boolean;
  thu_tu: number;
};

type SelectionRow = {
  noi_ham_id: string;
  menh_de_id: string;
  mo_ta_thuc_te: string;
  lua_chon_noi_ham_minh_chung?: { minh_chung_id: string }[];
};

const editableStatuses = new Set(["nhap", "dang_ra_soat", "ke_thua_cho_cap_nhat"]);

function mapContentRows(contents: ContentRow[], propositions: PropositionRow[]): NoiHamDanhGia[] {
  return contents.map((content) => ({
    id: content.id,
    ma: content.ma,
    muc: content.muc,
    noiDung: content.noi_dung,
    trichDanGoc: content.trich_dan_goc,
    thuTu: content.thu_tu,
    menhDe: propositions
      .filter((proposition) => proposition.noi_ham_id === content.id)
      .sort((left, right) => left.thu_tu - right.thu_tu)
      .map((proposition) => ({
        id: proposition.id,
        noiHamId: proposition.noi_ham_id,
        ma: proposition.ma,
        noiDung: proposition.noi_dung,
        loai: proposition.loai,
        laDat: proposition.la_dat,
        laKhongDat: proposition.la_khong_dat,
        yeuCauMinhChung: proposition.yeu_cau_minh_chung,
        thuTu: proposition.thu_tu,
      })),
  }));
}

function selectionMessage(
  content: NoiHamDanhGia,
  draft: LuaChonNoiHamDraft | undefined,
) {
  const proposition = findSelectedProposition(content, draft);

  if (!proposition) return "Chưa chọn trạng thái";
  if (!draft?.moTaThucTe.trim()) return "Cần ghi nhận hiện trạng thực tế";
  if (proposition.yeuCauMinhChung && draft.minhChungIds.length === 0) {
    return "Cần gắn ít nhất một minh chứng hợp lệ";
  }
  if (!proposition.laDat) return "Đã ghi nhận, chưa đủ điều kiện đạt";

  return "Đã đủ điều kiện";
}

export function InternalContentAssessment(props: {
  activeYearId: string;
  criterion: Criterion;
  evidence: EvidenceOption[];
  row: AssessmentRow | null;
  selectedCapHoc: CapHoc;
  supabase: SupabaseClient | null;
  onDone: (message: string) => Promise<void>;
  onRefreshEvidence: () => Promise<void>;
}) {
  const [contents, setContents] = useState<NoiHamDanhGia[]>([]);
  const [drafts, setDrafts] = useState<LuaChonNoiHamDraft[]>([]);
  const [activeLevel, setActiveLevel] = useState<MucNoiHam>(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const requestGeneration = useRef(0);
  const eligibleEvidenceIds = useMemo(
    () => new Set(props.evidence.filter((item) => item.eligible).map((item) => item.id)),
    [props.evidence],
  );
  const evaluationDrafts = useMemo(() => drafts.map((draft) => ({
    ...draft,
    minhChungIds: draft.minhChungIds.filter((id) => eligibleEvidenceIds.has(id)),
  })), [drafts, eligibleEvidenceIds]);
  const result = useMemo(
    () => evaluateInternalContentAssessment(contents, evaluationDrafts),
    [contents, evaluationDrafts],
  );
  const canEdit = !props.row || editableStatuses.has(props.row.trang_thai);
  const rowId = props.row?.id;
  const activeContents = contents.filter((content) => content.muc === activeLevel);
  const evidenceById = useMemo(
    () => new Map(props.evidence.map((item) => [item.id, item])),
    [props.evidence],
  );
  const eligibleEvidence = useMemo(
    () => props.evidence.filter((item) => item.eligible),
    [props.evidence],
  );
  const unavailableEvidence = useMemo(
    () => props.evidence.filter((item) => !item.eligible),
    [props.evidence],
  );
  const unavailableReasonCounts = useMemo(() => {
    const counts = new Map<string, number>();

    unavailableEvidence.forEach((item) => {
      const reason = item.reason ?? "Minh chứng không đáp ứng điều kiện sử dụng.";
      counts.set(reason, (counts.get(reason) ?? 0) + 1);
    });

    return [...counts.entries()].map(([reason, count]) => ({ count, reason }));
  }, [unavailableEvidence]);

  useEffect(() => {
    const generation = ++requestGeneration.current;

    async function loadInternalContents() {
      if (!props.supabase) {
        setLoadError("Chưa cấu hình Supabase.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError("");
      setActiveLevel(1);

      const { data: contentData, error: contentError } = await props.supabase
        .from("v_noi_ham_tieu_chi")
        .select("id, ma, muc, noi_dung, trich_dan_goc, thu_tu")
        .eq("tieu_chi_id", props.criterion.id)
        .order("muc", { ascending: true })
        .order("thu_tu", { ascending: true });

      if (generation !== requestGeneration.current) return;

      if (contentError) {
        setLoadError(toUserMessage(
          contentError,
          "Không tải được Phiếu nội hàm. Hãy áp dụng migration mới rồi thử lại.",
        ));
        setContents([]);
        setDrafts([]);
        setLoading(false);
        return;
      }

      const loadedContentRows = (contentData ?? []) as ContentRow[];
      if (loadedContentRows.length === 0) {
        setLoadError("Tiêu chí này chưa có dữ liệu nội hàm. Vui lòng liên hệ quản trị hệ thống.");
        setContents([]);
        setDrafts([]);
        setLoading(false);
        return;
      }

      const contentIds = loadedContentRows.map((content) => content.id);
      const { data: propositionData, error: propositionError } = contentIds.length
        ? await props.supabase
            .from("menh_de_trang_thai")
            .select("id, noi_ham_id, ma, noi_dung, loai, la_dat, la_khong_dat, yeu_cau_minh_chung, thu_tu")
            .in("noi_ham_id", contentIds)
            .order("thu_tu", { ascending: true })
        : { data: [], error: null };

      if (generation !== requestGeneration.current) return;

      if (propositionError) {
        setLoadError(toUserMessage(propositionError, "Không tải được các trạng thái nội hàm."));
        setLoading(false);
        return;
      }

      const mappedContents = mapContentRows(
        loadedContentRows,
        (propositionData ?? []) as PropositionRow[],
      );
      setContents(mappedContents);

      const { data: selectionData, error: selectionError } = rowId
        ? await props.supabase
            .from("lua_chon_noi_ham")
            .select("noi_ham_id, menh_de_id, mo_ta_thuc_te, lua_chon_noi_ham_minh_chung(minh_chung_id)")
            .eq("tu_danh_gia_id", rowId)
        : { data: [], error: null };

      if (generation !== requestGeneration.current) return;

      if (selectionError) {
        setLoadError(toUserMessage(selectionError, "Không tải được bản nháp Phiếu nội hàm."));
        setLoading(false);
        return;
      }

      setDrafts(((selectionData ?? []) as SelectionRow[]).map((selection) => ({
        noiHamId: selection.noi_ham_id,
        menhDeId: selection.menh_de_id,
        moTaThucTe: selection.mo_ta_thuc_te,
        minhChungIds: (selection.lua_chon_noi_ham_minh_chung ?? [])
          .map((link) => link.minh_chung_id),
      })));
      setDirty(false);
      setLoading(false);
    }

    void loadInternalContents();

    return () => {
      requestGeneration.current += 1;
    };
  }, [props.criterion.id, props.supabase, rowId]);

  function updateDraft(noiHamId: string, update: Partial<LuaChonNoiHamDraft>) {
    setDirty(true);
    setDrafts((current) => {
      const existing = current.find((draft) => draft.noiHamId === noiHamId);
      const next = {
        noiHamId,
        menhDeId: existing?.menhDeId ?? "",
        moTaThucTe: existing?.moTaThucTe ?? "",
        minhChungIds: existing?.minhChungIds ?? [],
        ...update,
      };

      return existing
        ? current.map((draft) => draft.noiHamId === noiHamId ? next : draft)
        : [...current, next];
    });
  }

  function toggleEvidence(noiHamId: string, evidenceId: string) {
    const draft = drafts.find((item) => item.noiHamId === noiHamId);
    const currentIds = draft?.minhChungIds ?? [];
    updateDraft(noiHamId, {
      minhChungIds: currentIds.includes(evidenceId)
        ? currentIds.filter((id) => id !== evidenceId)
        : [...currentIds, evidenceId],
    });
  }

  async function saveDraft(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (!props.supabase) {
      await props.onDone("Chưa cấu hình Supabase.");
      return;
    }

    setSaving(true);
    const payload = drafts
      .filter((draft) => draft.menhDeId)
      .map((draft) => ({
        noi_ham_id: draft.noiHamId,
        menh_de_id: draft.menhDeId,
        mo_ta_thuc_te: draft.moTaThucTe,
        minh_chung_ids: draft.minhChungIds.filter((id) => eligibleEvidenceIds.has(id)),
      }));
    const { error } = await props.supabase.rpc("fn_luu_phieu_noi_ham_atomic", {
      p_nam_hoc_id: props.activeYearId,
      p_cap_hoc: props.selectedCapHoc,
      p_tieu_chi_id: props.criterion.id,
      p_lua_chon: payload,
    });
    setSaving(false);

    if (!error) setDirty(false);

    await props.onDone(
      error
        ? toUserMessage(error, "Không lưu được Phiếu nội hàm.")
        : `Đã lưu Phiếu nội hàm. Kết quả hiện tại: ${result.mucDat === 0 ? "Chưa đạt" : `Mức ${result.mucDat}`}.`,
    );
  }

  async function submitForApproval() {
    if (!props.supabase || !props.row) {
      await props.onDone("Hãy lưu Phiếu nội hàm trước khi gửi duyệt.");
      return;
    }

    if (dirty) {
      await props.onDone("Bạn còn thay đổi chưa lưu. Hãy lưu bản nháp trước khi gửi duyệt.");
      return;
    }

    if (result.daChon < result.tongNoiHam) {
      await props.onDone("Hãy ghi nhận trạng thái cho tất cả nội hàm trước khi gửi duyệt.");
      return;
    }

    const { error } = await props.supabase.rpc("fn_cap_nhat_trang_thai_tu_danh_gia", {
      p_nam_hoc_id: props.activeYearId,
      p_cap_hoc: props.selectedCapHoc,
      p_tieu_chi_id: props.criterion.id,
      p_trang_thai: "cho_duyet",
      p_expected_revision: props.row.revision,
    });

    await props.onDone(
      error ? toUserMessage(error) : "Đã gửi tiêu chí sang trạng thái chờ duyệt.",
    );
  }

  if (loading) {
    return <LoadingState label="Đang tải Phiếu nội hàm…" />;
  }

  if (loadError) {
    return (
      <section id="criterion-assessment" className="surface-card surface-card-pad">
        <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">Phiếu nội hàm chưa sẵn sàng</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-danger)]">{loadError}</p>
        {props.row?.mo_ta_muc_1 || props.row?.mo_ta_muc_2 ? (
          <div className="mt-4 border-t border-[var(--color-border)] pt-4 text-sm leading-6">
            <p className="font-semibold text-[var(--color-ink-navy)]">Dữ liệu tự đánh giá hiện có vẫn được giữ nguyên</p>
            {props.row.mo_ta_muc_1 ? <p className="mt-2 whitespace-pre-wrap">{props.row.mo_ta_muc_1}</p> : null}
            {props.row.mo_ta_muc_2 ? <p className="mt-2 whitespace-pre-wrap">{props.row.mo_ta_muc_2}</p> : null}
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <form id="criterion-assessment" className="surface-card overflow-hidden" onSubmit={saveDraft}>
      <header className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[var(--color-warning)]">
              <span className="tabular-nums">{props.criterion.ma}</span>
              {props.criterion.la_bat_buoc ? <span>Bắt buộc</span> : null}
            </div>
            <h2 className="mt-1 text-xl font-semibold leading-7 text-[var(--color-ink-navy)]">
              {props.criterion.ten}
            </h2>
            <p className="mt-2 text-sm text-[var(--color-graphite)]/70">
              {result.daChon}/{result.tongNoiHam} nội hàm đã ghi nhận
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[var(--color-lavender-mist)] px-3 py-1.5 text-sm font-semibold text-[var(--color-ink-navy)]">
              {result.mucDat === 0 ? "Chưa đạt" : `Mức ${result.mucDat}`}
            </span>
            <StatusBadge status={props.row?.trang_thai ?? "chua_nhap"} />
          </div>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--color-border)]" aria-hidden="true">
          <div
            className="h-full rounded-full bg-[var(--color-electric-cobalt)] transition-[width] duration-200"
            style={{ width: `${result.tongNoiHam ? (result.daChon / result.tongNoiHam) * 100 : 0}%` }}
          />
        </div>
      </header>

      <div className="border-b border-[var(--color-border)] px-5 py-3 sm:px-6">
        <div className="inline-flex rounded-[var(--radius-card)] bg-[var(--color-lavender-mist)] p-1" role="tablist" aria-label="Mức tiêu chí">
          {([1, 2] as const).map((level) => {
            const locked = level === 2 && !result.muc1HoanThanh;
            return (
              <button
                className={`min-w-28 rounded-[6px] px-4 py-2 text-sm font-semibold transition-colors ${
                  activeLevel === level
                    ? "bg-white text-[var(--color-ink-navy)]"
                    : "text-[var(--color-graphite)]"
                }`}
                aria-selected={activeLevel === level}
                key={level}
                role="tab"
                type="button"
                onClick={() => setActiveLevel(level)}
              >
                Mức {level}{locked ? " · Đang khóa" : ""}
              </button>
            );
          })}
        </div>
        {activeLevel === 2 && !result.muc1HoanThanh ? (
          <p className="mt-3 text-sm leading-6 text-[var(--color-warning)]">
            Mức 2 sẽ mở khi tất cả nội hàm Mức 1 đã chọn trạng thái đáp ứng, có mô tả thực tế và minh chứng hợp lệ.
          </p>
        ) : null}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0 divide-y divide-[var(--color-border)]">
          {activeContents.map((content, index) => {
            const draft = drafts.find((item) => item.noiHamId === content.id);
            const evaluationDraft = evaluationDrafts.find((item) => item.noiHamId === content.id);
            const proposition = findSelectedProposition(content, evaluationDraft);
            const levelLocked = activeLevel === 2 && !result.muc1HoanThanh;
            const satisfied = isInternalContentSatisfied(content, evaluationDraft);

            return (
              <section className="px-5 py-6 sm:px-6" key={content.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-ink-navy)]">
                      Nội hàm {index + 1}
                    </p>
                    <p className="mt-2 max-w-[78ch] text-sm leading-6 text-[var(--color-graphite)]">
                      {content.trichDanGoc}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    satisfied
                      ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
                      : "bg-[var(--color-lavender-mist)] text-[var(--color-graphite)]"
                  }`}>
                    {selectionMessage(content, evaluationDraft)}
                  </span>
                </div>

                <fieldset className="mt-5" disabled={!canEdit || levelLocked}>
                  <legend className="text-sm font-semibold text-[var(--color-ink-navy)]">Trạng thái thực tế</legend>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {content.menhDe.map((option) => (
                      <label
                        className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-[6px] border px-3 py-3 text-sm leading-5 transition-colors ${
                          draft?.menhDeId === option.id
                            ? "border-[var(--color-electric-cobalt)] bg-[var(--color-lavender-mist)]"
                            : "border-[var(--color-border)] bg-white hover:border-[var(--color-electric-cobalt)]"
                        } ${!canEdit || levelLocked ? "cursor-not-allowed opacity-60" : ""}`}
                        key={option.id}
                      >
                        <input
                          checked={draft?.menhDeId === option.id}
                          className="mt-0.5"
                          name={`proposition-${content.id}`}
                          type="radio"
                          onChange={() => updateDraft(content.id, { menhDeId: option.id })}
                        />
                        <span>{option.noiDung}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {proposition ? (
                  <div className="mt-5 grid gap-4">
                    <label className="text-sm font-semibold text-[var(--color-ink-navy)]">
                      Ghi nhận thực tế của nhà trường
                      <textarea
                        className="form-control mt-2 min-h-24 font-normal"
                        disabled={!canEdit || levelLocked}
                        value={draft?.moTaThucTe ?? ""}
                        onChange={(event) => updateDraft(content.id, { moTaThucTe: event.target.value })}
                      />
                    </label>

                    <details className="rounded-[6px] border border-[var(--color-border)] bg-white" open={proposition.yeuCauMinhChung && (draft?.minhChungIds.length ?? 0) === 0}>
                      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[var(--color-ink-navy)]">
                        Minh chứng hợp lệ đã chọn: {evaluationDraft?.minhChungIds.length ?? 0}
                        {proposition.yeuCauMinhChung ? " · Bắt buộc" : ""}
                      </summary>
                      <div className="border-t border-[var(--color-border)] p-3">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs leading-5 text-[var(--color-graphite)]/70">
                            Chỉ minh chứng thật, đã xác minh và còn hiệu lực mới được tính.
                          </p>
                          <button
                            className="button-secondary min-h-9 px-3 py-1.5 text-xs"
                            type="button"
                            onClick={() => void props.onRefreshEvidence()}
                          >
                            Tải lại kho
                          </button>
                        </div>
                        {eligibleEvidence.length === 0 ? (
                          <div className="rounded-[6px] bg-[var(--color-warning-soft)] p-4 text-sm leading-6">
                            <p className="font-semibold text-[var(--color-ink-navy)]">Chưa có minh chứng đủ điều kiện để gắn.</p>
                            <p className="mt-1 text-[var(--color-graphite)]/75">
                              Kho hiện có {unavailableEvidence.length} minh chứng, nhưng chưa có minh chứng nào đáp ứng đủ điều kiện sử dụng.
                            </p>
                            {unavailableReasonCounts.length > 0 ? (
                              <ul className="mt-2 grid gap-1 text-[var(--color-graphite)]/75">
                                {unavailableReasonCounts.map((item) => (
                                  <li key={item.reason}>{item.count} minh chứng: {item.reason}</li>
                                ))}
                              </ul>
                            ) : null}
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Link className="button-secondary" href="/minh-chung/tao">Tạo minh chứng</Link>
                              <Link className="button-secondary" href="/minh-chung/xac-minh">Đi tới xác minh</Link>
                            </div>
                          </div>
                        ) : (
                          <div className="grid gap-2 sm:grid-cols-2">
                          {eligibleEvidence.map((item) => (
                          <div className="flex items-start justify-between gap-3 rounded-[6px] border border-[var(--color-border)] p-3" key={item.id}>
                            <label className="flex min-w-0 items-start gap-2 text-sm leading-5">
                              <input
                                checked={draft?.minhChungIds.includes(item.id) ?? false}
                                className="mt-0.5"
                                disabled={!canEdit || levelLocked}
                                type="checkbox"
                                onChange={() => toggleEvidence(content.id, item.id)}
                              />
                              <span className="min-w-0">
                                <strong className="block truncate text-[var(--color-ink-navy)]">{item.ma}</strong>
                                <span className="line-clamp-2 text-[var(--color-graphite)]/75">{item.ten}</span>
                              </span>
                            </label>
                            <Link className="shrink-0 text-xs font-semibold text-[var(--color-electric-cobalt)]" href={`/minh-chung/${item.id}`}>
                              Xem
                            </Link>
                          </div>
                          ))}
                          </div>
                        )}

                        {unavailableEvidence.length > 0 ? (
                          <details className="mt-3 rounded-[6px] border border-[var(--color-border)]">
                            <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-[var(--color-graphite)]">
                              {unavailableEvidence.length} minh chứng chưa đủ điều kiện
                            </summary>
                            <div className="grid gap-2 border-t border-[var(--color-border)] p-3 sm:grid-cols-2">
                              {unavailableEvidence.map((item) => {
                                const selected = draft?.minhChungIds.includes(item.id) ?? false;
                                return (
                                  <div className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-warm-white)] p-3 text-sm" key={item.id}>
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <strong className="block truncate text-[var(--color-ink-navy)]">{item.ma}</strong>
                                        <span className="line-clamp-2 text-[var(--color-graphite)]/75">{item.ten}</span>
                                      </div>
                                      <Link className="shrink-0 text-xs font-semibold text-[var(--color-electric-cobalt)]" href={`/minh-chung/${item.id}`}>Xem</Link>
                                    </div>
                                    <p className="mt-2 text-xs leading-5 text-[var(--color-danger)]">{item.reason}</p>
                                    {selected && canEdit && !levelLocked ? (
                                      <button className="mt-2 text-xs font-semibold text-[var(--color-danger)]" type="button" onClick={() => toggleEvidence(content.id, item.id)}>
                                        Bỏ khỏi nội hàm
                                      </button>
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                          </details>
                        ) : null}
                      </div>
                    </details>
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>

        <aside className="border-t border-[var(--color-border)] bg-[var(--color-warm-white)] p-5 lg:border-l lg:border-t-0 lg:p-6">
          <div className="lg:sticky lg:top-6">
            <p className="text-sm font-semibold text-[var(--color-ink-navy)]">Bản xem trước</p>
            <div className="mt-4 grid gap-5 text-sm leading-6">
              <section>
                <h3 className="font-semibold text-[var(--color-ink-navy)]">Hiện trạng Mức 1</h3>
                <p className="mt-1 whitespace-pre-wrap text-[var(--color-graphite)]/75">
                  {result.moTaMuc1 || props.row?.mo_ta_muc_1 || "Chưa có nội dung."}
                </p>
              </section>
              <section>
                <h3 className="font-semibold text-[var(--color-ink-navy)]">Hiện trạng Mức 2</h3>
                <p className="mt-1 whitespace-pre-wrap text-[var(--color-graphite)]/75">
                  {result.moTaMuc2 || props.row?.mo_ta_muc_2 || "Chưa có nội dung."}
                </p>
              </section>
              <section>
                <h3 className="font-semibold text-[var(--color-ink-navy)]">Điểm cần cải tiến</h3>
                {result.diemYeu.length ? (
                  <ul className="mt-1 grid list-disc gap-1 pl-5 text-[var(--color-graphite)]/75">
                    {result.diemYeu.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
                  </ul>
                ) : (
                  <p className="mt-1 text-[var(--color-graphite)]/75">Chưa ghi nhận nội dung chưa đáp ứng.</p>
                )}
              </section>
              <section>
                <h3 className="font-semibold text-[var(--color-ink-navy)]">Minh chứng sử dụng</h3>
                <p className="mt-1 text-[var(--color-graphite)]/75">
                  {Array.from(new Set(drafts.flatMap((draft) => draft.minhChungIds)))
                    .map((id) => evidenceById.get(id)?.ma)
                    .filter(Boolean)
                    .join(", ") || "Chưa gắn minh chứng."}
                </p>
              </section>
            </div>
          </div>
        </aside>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] px-5 py-4 sm:px-6">
        <p className="text-sm text-[var(--color-graphite)]/70" aria-live="polite">
          {saving
            ? "Đang lưu bản nháp…"
            : !canEdit
              ? "Tiêu chí đang bị khóa chỉnh sửa."
              : dirty
                ? "Bạn có thay đổi chưa lưu."
                : "Mọi thay đổi đã được lưu."}
        </p>
        <div className="flex flex-wrap gap-3">
          {props.row && canEdit ? (
            <button
              className="button-secondary"
              disabled={dirty || saving}
              title={dirty ? "Lưu bản nháp trước khi gửi duyệt" : undefined}
              type="button"
              onClick={() => setPendingSubmit(true)}
            >
              Gửi duyệt
            </button>
          ) : null}
          <button className="button-primary" disabled={saving || !canEdit} type="submit">
            {saving ? "Đang lưu…" : "Lưu bản nháp"}
          </button>
        </div>
      </footer>

      <ConfirmDialog
        confirmLabel="Gửi duyệt"
        description="Tiêu chí sẽ được khóa chỉnh sửa và chuyển tới người có thẩm quyền. Tất cả nội hàm phải được ghi nhận trước khi gửi."
        isOpen={pendingSubmit}
        title="Gửi tiêu chí này sang chờ duyệt?"
        tone="primary"
        onCancel={() => setPendingSubmit(false)}
        onConfirm={async () => {
          setPendingSubmit(false);
          await submitForApproval();
        }}
      />
    </form>
  );
}
