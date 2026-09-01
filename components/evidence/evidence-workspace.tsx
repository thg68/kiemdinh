"use client";

import { toUserMessage } from "@/lib/errors/user-message";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { reportStorageFailure } from "@/lib/observability/client-alerts";
import {
  Criterion,
  Evidence,
  EvidenceCriterionLink,
  Profile,
  SchoolYear,
  canonicalEvidenceMimeType,
  formatEvidenceStatus,
  sha256File,
  storagePathForEvidence,
  validateEvidenceFile,
} from "@/lib/evidence";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { DEFAULT_PAGE_SIZE, Pagination } from "@/components/ui/pagination";
import { EvidenceSubnav } from "@/components/evidence/evidence-subnav";

type EvidenceWithCriteria = Evidence & {
  criteria: Criterion[];
};

type Filters = {
  keyword: string;
  namHocId: string;
  tieuChuan: string;
  tieuChiIds: string[];
  trangThai: string;
};

export function EvidenceWorkspace({ mode = "list" }: { mode?: "list" | "create" }) {
  const router = useRouter();
  const supabase = useMemo(() => {
    if (!isSupabaseConfigured()) {
      return null;
    }

    return createBrowserSupabaseClient();
  }, []);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [years, setYears] = useState<SchoolYear[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [evidence, setEvidence] = useState<EvidenceWithCriteria[]>([]);
  const [evidenceCount, setEvidenceCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState<Filters>({
    keyword: "",
    namHocId: "",
    tieuChuan: "",
    tieuChiIds: [],
    trangThai: "",
  });

  const activeYear = years.find((year) => year.trang_thai === "dang_hoat_dong");
  const selectedYearId = filters.namHocId || activeYear?.id || years[0]?.id || "";
  const hasActiveFilters = Boolean(
      filters.keyword.trim() ||
      filters.namHocId ||
      filters.tieuChuan ||
      filters.tieuChiIds.length > 0 ||
      filters.trangThai,
  );

  const loadData = useCallback(async () => {
    if (!supabase) {
      setMessage("Chưa cấu hình Supabase trong .env.local.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      router.replace("/login");
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("nguoi_dung")
      .select("id, co_so_id, ho_ten")
      .eq("auth_user_id", userData.user.id)
      .maybeSingle();

    if (profileError || !profileData) {
      setMessage(toUserMessage(profileError, "Bạn cần thiết lập cơ sở giáo dục trước."));
      setLoading(false);
      return;
    }

    setProfile(profileData);

    const { data: yearData } = await supabase
      .from("nam_hoc")
      .select("id, ten, trang_thai")
      .eq("co_so_id", profileData.co_so_id)
      .order("ngay_bat_dau", { ascending: false });

    setYears((yearData ?? []) as SchoolYear[]);
    setLoading(false);
  }, [router, supabase]);

  const loadCriteria = useCallback(async () => {
    if (!supabase || !profile || !selectedYearId) return;

    const { data, error } = await supabase
      .from("v_tieu_chi_nam_hoc")
      .select("id, ma, ten, la_bat_buoc, loai_hinh_ap_dung, tieu_chuan_id, tieu_chuan_so_thu_tu, tieu_chuan_ten")
      .eq("co_so_id", profile.co_so_id)
      .eq("nam_hoc_id", selectedYearId)
      .order("ma", { ascending: true });

    if (error) {
      setMessage(toUserMessage(error));
      return;
    }

    setCriteria(((data ?? []) as {
      id: string;
      ma: string;
      ten: string;
      la_bat_buoc: boolean;
      loai_hinh_ap_dung: string;
      tieu_chuan_id: string;
      tieu_chuan_so_thu_tu: number;
      tieu_chuan_ten: string;
    }[]).map((criterion) => ({
      id: criterion.id,
      ma: criterion.ma,
      ten: criterion.ten,
      la_bat_buoc: criterion.la_bat_buoc,
      loai_hinh_ap_dung: criterion.loai_hinh_ap_dung,
      tieu_chuan_id: criterion.tieu_chuan_id,
      tieu_chuan: {
        so_thu_tu: criterion.tieu_chuan_so_thu_tu,
        ten: criterion.tieu_chuan_ten,
      },
    })));
  }, [profile, selectedYearId, supabase]);

  const loadEvidence = useCallback(async () => {
    if (!supabase || !profile) {
      return;
    }

    const evidenceIdSets: Set<string>[] = [];
    const criterionGroups = [
      filters.tieuChiIds,
      filters.tieuChuan
        ? criteria
            .filter(
              (criterion) =>
                String(criterion.tieu_chuan?.so_thu_tu) === filters.tieuChuan,
            )
            .map((criterion) => criterion.id)
        : [],
    ].filter((ids) => ids.length > 0);

    for (const criterionIds of criterionGroups) {
      const { data: matchingLinks, error: matchingLinkError } = await supabase
        .from("minh_chung_tieu_chi")
        .select("minh_chung_id")
        .in("tieu_chi_id", criterionIds);

      if (matchingLinkError) {
        setMessage(toUserMessage(matchingLinkError));
        setEvidence([]);
        setEvidenceCount(0);
        return;
      }

      evidenceIdSets.push(
        new Set((matchingLinks ?? []).map((link) => link.minh_chung_id)),
      );
    }

    const eligibleEvidenceIds = evidenceIdSets.length > 0
      ? [...evidenceIdSets[0]].filter((id) =>
          evidenceIdSets.every((idSet) => idSet.has(id)),
        )
      : null;

    if (eligibleEvidenceIds && eligibleEvidenceIds.length === 0) {
      setEvidence([]);
      setEvidenceCount(0);
      return;
    }

    let query = supabase
      .from("minh_chung")
      .select("*", { count: "exact" })
      .eq("co_so_id", profile.co_so_id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (selectedYearId) {
      query = query.eq("nam_hoc_id", selectedYearId);
    }

    if (filters.keyword.trim()) {
      const keyword = `%${filters.keyword.trim()}%`;
      query = query.or(`ma.ilike.${keyword},ten.ilike.${keyword}`);
    }

    if (filters.trangThai) {
      query = query.eq("trang_thai_xac_minh", filters.trangThai);
    }

    if (eligibleEvidenceIds) {
      query = query.in("id", eligibleEvidenceIds);
    }

    query = mode === "list"
      ? query.range((page - 1) * DEFAULT_PAGE_SIZE, page * DEFAULT_PAGE_SIZE - 1)
      : query.limit(100);

    const { count, data: evidenceData, error } = await query;

    if (error) {
      setMessage(toUserMessage(error));
      setEvidence([]);
      setEvidenceCount(0);
      return;
    }

    const ids = (evidenceData ?? []).map((item) => item.id);
    const { data: linkData } =
      ids.length > 0
        ? await supabase
            .from("minh_chung_tieu_chi")
            .select(
              "minh_chung_id, tieu_chi_id, la_tieu_chi_goc, tieu_chi: tieu_chi_id(id, ma, ten, la_bat_buoc, tieu_chuan_id, tieu_chuan: tieu_chuan_id(so_thu_tu, ten))",
            )
            .in("minh_chung_id", ids)
        : { data: [] };

    const links = (linkData ?? []) as unknown as EvidenceCriterionLink[];
    const rows = ((evidenceData ?? []) as Evidence[]).map((item) => ({
        ...item,
        criteria: links
          .filter((link) => link.minh_chung_id === item.id)
          .map((link) => link.tieu_chi)
          .filter(Boolean)
          .map((criterion) => criterion as Criterion) as Criterion[],
      }));

    setEvidence(rows);
    setEvidenceCount(count ?? rows.length);
  }, [criteria, filters, mode, page, profile, selectedYearId, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCriteria();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadCriteria]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadEvidence();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadEvidence]);

  if (loading) {
    return <LoadingState label="Đang tải kho minh chứng…" />;
  }

  return (
    <div className="grid gap-6">
      <EvidenceSubnav active={mode === "create" ? "create" : "list"} />

      {message ? <Message text={message} /> : null}

      {mode === "create" ? (
        <EvidenceCreateForm
          criteria={criteria}
          evidence={evidence}
          profile={profile}
          selectedYearId={selectedYearId}
          supabase={supabase}
          onCancel={() => router.push("/minh-chung")}
          onDone={async (text) => {
            setMessage(text);
            await loadEvidence();

            if (text.startsWith("Đã")) {
              router.push("/minh-chung");
            }
          }}
        />
      ) : null}

      {mode === "list" && (evidence.length > 0 || hasActiveFilters) ? (
        <EvidenceFilters
          criteria={criteria}
          filters={filters}
          setFilters={(nextFilters) => {
            setPage(1);
            setFilters(nextFilters);
          }}
          years={years}
        />
      ) : null}

      {mode === "list" ? (
      <section className="surface-card overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">Danh sách minh chứng</h2>
          <p className="mt-1 text-sm text-[var(--color-graphite)]/70">
            Mỗi dòng là một mã minh chứng duy nhất, có thể phục vụ nhiều tiêu chí.
          </p>
        </div>

        <div className="divide-y divide-[var(--color-border)]">
          {evidence.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title={hasActiveFilters ? "Không có minh chứng phù hợp" : "Hiện chưa có minh chứng nào được tải lên"}
                description={
                  hasActiveFilters
                    ? "Hãy xóa bớt bộ lọc để xem các minh chứng đã có."
                    : "Bấm Tạo minh chứng để tải tệp hoặc gắn liên kết điện tử đầu tiên."
                }
                action={
                  hasActiveFilters ? (
                    <button
                      className="button-secondary"
                      type="button"
                      onClick={() => {
                        setPage(1);
                        setFilters({
                          keyword: "",
                          namHocId: "",
                          tieuChuan: "",
                          tieuChiIds: [],
                          trangThai: "",
                        });
                      }}
                    >
                      Xóa bộ lọc
                    </button>
                  ) : (
                    <Link className="button-primary" href="/minh-chung/tao">
                      Tạo minh chứng
                    </Link>
                  )
                }
              />
            </div>
          ) : (
            evidence.map((item) => (
              <article className="grid gap-3 px-5 py-4 hover:bg-[var(--color-lavender-mist)]/45 lg:grid-cols-[1fr_220px]" key={item.id}>
                <div>
                  <Link className="font-semibold text-[var(--color-ink-navy)] hover:underline" href={`/minh-chung/${item.id}`}>
                    {item.ma} - {item.ten}
                  </Link>
                  <p className="mt-2 text-sm text-[var(--color-graphite)]/70">
                    {item.criteria.length > 0 ? "Tiêu chí đang dùng:" : "Chưa gắn tiêu chí"}
                  </p>
                  {item.criteria.length > 0 ? (
                    <ul className="mt-2 grid gap-1 text-sm text-[var(--color-graphite)]/80">
                      {item.criteria.map((criterion) => (
                        <li className="leading-5" key={criterion.id}>
                          <strong className="text-[var(--color-ink-navy)]">{criterion.ma}</strong> - {criterion.ten}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <div className="text-sm text-[var(--color-graphite)]/70">
                  <p>{formatEvidenceStatus(item.trang_thai_xac_minh)}</p>
                  <p>{item.ngay_ban_hanh ? `Ban hành: ${item.ngay_ban_hanh}` : "Chưa có ngày ban hành"}</p>
                  <p>{item.ngay_het_gia_tri ? `Hết giá trị: ${item.ngay_het_gia_tri}` : "Không ghi hạn"}</p>
                </div>
              </article>
            ))
          )}
        </div>
        <Pagination
          page={page}
          total={evidenceCount}
          onPageChange={setPage}
        />
      </section>
      ) : null}
    </div>
  );
}

function EvidenceCreateForm(props: {
  criteria: Criterion[];
  evidence: EvidenceWithCriteria[];
  profile: Profile | null;
  selectedYearId: string;
  supabase: ReturnType<typeof createBrowserSupabaseClient> | null;
  onCancel: () => void;
  onDone: (message: string) => Promise<void>;
}) {
  const [mode, setMode] = useState<"new" | "reuse">("new");
  const [selectedEvidenceId, setSelectedEvidenceId] = useState("");
  const [selectedCriterionIds, setSelectedCriterionIds] = useState<string[]>([]);
  const [rootCriterionId, setRootCriterionId] = useState("");
  const [ten, setTen] = useState("");
  const [ngayBanHanh, setNgayBanHanh] = useState("");
  const [ngayHetGiaTri, setNgayHetGiaTri] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [hyperlink, setHyperlink] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function toggleCriterion(id: string) {
    setSelectedCriterionIds((current) => {
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];

      if (!next.includes(rootCriterionId)) {
        setRootCriterionId(next[0] ?? "");
      }

      return next;
    });
  }

  async function cleanupStorageObject(storagePath: string) {
    const supabase = props.supabase;

    if (!supabase) {
      return;
    }

    const { error } = await supabase.storage
      .from("evidence")
      .remove([storagePath]);

    if (error) {
      void reportStorageFailure("evidence_cleanup");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!props.supabase || !props.profile) {
      await props.onDone("Chưa đăng nhập hoặc chưa cấu hình Supabase.");
      return;
    }

    if (selectedCriterionIds.length === 0) {
      await props.onDone("Hãy chọn ít nhất một tiêu chí.");
      return;
    }

    if (!props.selectedYearId) {
      await props.onDone("Hãy tạo hoặc chọn năm học trước khi tạo minh chứng.");
      return;
    }

    setSubmitting(true);

    if (mode === "reuse") {
      if (!selectedEvidenceId) {
        setSubmitting(false);
        await props.onDone("Hãy chọn minh chứng có sẵn trước khi gắn thêm tiêu chí.");
        return;
      }

      const { error } = await props.supabase.rpc("fn_gan_minh_chung_tieu_chi", {
        p_minh_chung_id: selectedEvidenceId,
        p_tieu_chi_ids: selectedCriterionIds,
      });

      setSubmitting(false);
      await props.onDone(error ? toUserMessage(error) : "Đã gắn thêm tiêu chí cho minh chứng có sẵn.");
      return;
    }

    if (!rootCriterionId) {
      setSubmitting(false);
      await props.onDone("Hãy chọn tiêu chí gốc để sinh mã minh chứng.");
      return;
    }

    if (!ten.trim()) {
      setSubmitting(false);
      await props.onDone("Hãy nhập tên minh chứng.");
      return;
    }

    if (!file && !hyperlink.trim()) {
      setSubmitting(false);
      await props.onDone("Hãy chọn tệp hoặc nhập liên kết điện tử.");
      return;
    }

    let storagePath: string | null = null;
    let hash: string | null = null;
    let type: string | null = null;

    if (file) {
      const fileError = validateEvidenceFile(file);

      if (fileError) {
        setSubmitting(false);
        await props.onDone(fileError);
        return;
      }

      storagePath = storagePathForEvidence(props.profile.co_so_id, props.selectedYearId, file);
      hash = await sha256File(file);
      type = canonicalEvidenceMimeType(file);

      const { error: uploadError } = await props.supabase.storage
        .from("evidence")
        .upload(storagePath, file, {
          cacheControl: "3600",
          contentType: type ?? undefined,
          metadata: {
            original_name: file.name,
            sha256: hash,
          },
          upsert: false,
        });

      if (uploadError) {
        void reportStorageFailure("evidence_upload");
        setSubmitting(false);
        await props.onDone(toUserMessage(uploadError, "Không tải được tệp minh chứng. Vui lòng thử lại."));
        return;
      }
    }

    const { data: sessionData } = await props.supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
      if (storagePath) {
        await cleanupStorageObject(storagePath);
      }

      setSubmitting(false);
      await props.onDone("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      return;
    }

    let finalizeResponse: Response;

    try {
      finalizeResponse = await fetch("/api/minh-chung/finalize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          duongDan: hyperlink,
          namHocId: props.selectedYearId,
          ngayBanHanh: ngayBanHanh || null,
          ngayHetGiaTri: ngayHetGiaTri || null,
          storagePath,
          ten: ten.trim(),
          tenTepGoc: file?.name ?? "",
          tieuChiGocId: rootCriterionId,
          tieuChiIds: selectedCriterionIds,
        }),
      });
    } catch {
      if (storagePath) {
        await cleanupStorageObject(storagePath);
      }

      setSubmitting(false);
      await props.onDone("Mất kết nối khi hoàn tất minh chứng. Vui lòng thử lại.");
      return;
    }

    const finalizePayload = (await finalizeResponse.json().catch(() => null)) as {
      error?: string;
    } | null;

    setSubmitting(false);

    if (!finalizeResponse.ok) {
      if (storagePath) {
        await cleanupStorageObject(storagePath);
      }

      await props.onDone(finalizePayload?.error ?? "Không thể hoàn tất minh chứng.");
      return;
    }

    setTen("");
    setFile(null);
    setHyperlink("");
    setNgayBanHanh("");
    setNgayHetGiaTri("");
    setSelectedCriterionIds([]);
    setRootCriterionId("");
    await props.onDone("Đã tạo minh chứng và gắn tiêu chí.");
  }

  return (
    <section className="surface-card surface-card-pad">
      <div className="grid gap-3 border-b border-[var(--color-border)] pb-4 sm:grid-cols-[1fr_auto]">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">Thêm minh chứng</h2>
          <p className="mt-1 text-sm text-[var(--color-graphite)]/70">
            Tạo mã mới từ tiêu chí gốc hoặc dùng lại mã minh chứng đã có.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="segmented-control grid-cols-2 text-sm font-medium" aria-label="Kiểu thêm minh chứng">
            <button
              aria-pressed={mode === "new"}
              className={`segmented-option ${mode === "new" ? "segmented-option-active" : "text-[var(--color-graphite)]"}`}
              type="button"
              onClick={() => setMode("new")}
            >
              Mới
            </button>
            <button
              aria-pressed={mode === "reuse"}
              className={`segmented-option ${mode === "reuse" ? "segmented-option-active" : "text-[var(--color-graphite)]"}`}
              type="button"
              onClick={() => setMode("reuse")}
            >
              Dùng lại
            </button>
          </div>
          <button className="button-secondary" type="button" onClick={props.onCancel}>
            Đóng
          </button>
        </div>
      </div>

      <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-2 rounded-[var(--radius-card)] bg-[var(--color-info-soft)] p-3 text-sm leading-6 text-[var(--color-ink-navy)] sm:grid-cols-3">
          <p><strong>1.</strong> Chọn tệp hoặc liên kết.</p>
          <p><strong>2.</strong> Gắn một hoặc nhiều tiêu chí.</p>
          <p><strong>3.</strong> Hệ thống giữ một mã minh chứng duy nhất.</p>
        </div>

        {mode === "reuse" ? (
          <label className="text-sm font-medium">
            Minh chứng có sẵn
            <select
              className="form-control mt-2"
              value={selectedEvidenceId}
              onChange={(event) => setSelectedEvidenceId(event.target.value)}
              required
            >
              <option value="">Chọn minh chứng</option>
              {props.evidence.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.ma} - {item.ten}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="text-sm font-medium">
              Tên minh chứng
              <input
                className="form-control mt-2"
                value={ten}
                onChange={(event) => setTen(event.target.value)}
                required
              />
            </label>
            <label className="text-sm font-medium">
              Tệp minh chứng
              <span className="file-picker mt-2">
                <span className="file-picker-button">Chọn tệp</span>
                <span className="file-picker-name">{file ? file.name : "Chưa chọn tệp nào"}</span>
                <input
                  className="file-picker-input"
                  type="file"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
              </span>
            </label>
            <label className="text-sm font-medium lg:col-span-2">
              Hoặc liên kết điện tử
              <input
                className="form-control mt-2"
                type="url"
                value={hyperlink}
                onChange={(event) => setHyperlink(event.target.value)}
              />
            </label>
            <label className="text-sm font-medium">
              Ngày ban hành
              <input
                className="form-control mt-2"
                type="date"
                value={ngayBanHanh}
                onChange={(event) => setNgayBanHanh(event.target.value)}
              />
            </label>
            <label className="text-sm font-medium">
              Ngày hết giá trị
              <input
                className="form-control mt-2"
                type="date"
                value={ngayHetGiaTri}
                onChange={(event) => setNgayHetGiaTri(event.target.value)}
              />
            </label>
          </div>
        )}

        <CriterionPicker
          criteria={props.criteria}
          rootCriterionId={rootCriterionId}
          selectedCriterionIds={selectedCriterionIds}
          setRootCriterionId={setRootCriterionId}
          toggleCriterion={toggleCriterion}
          showRoot={mode === "new"}
        />

        <button
          className="button-primary w-full"
          disabled={submitting}
        >
          {submitting ? "Đang lưu…" : mode === "new" ? "Tải lên và gắn tiêu chí" : "Gắn tiêu chí cho mã có sẵn"}
        </button>
      </form>
    </section>
  );
}

function CriterionPicker(props: {
  criteria: Criterion[];
  selectedCriterionIds: string[];
  rootCriterionId: string;
  showRoot: boolean;
  setRootCriterionId: (id: string) => void;
  toggleCriterion: (id: string) => void;
}) {
  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-semibold text-[var(--color-ink-navy)]">Tiêu chí sử dụng minh chứng</legend>
      <div className="grid gap-2 rounded-[var(--radius-card)] border border-[var(--color-border)] p-3 sm:grid-cols-2 lg:grid-cols-3">
        {props.criteria.map((criterion) => (
          <label className="surface-card grid gap-2 p-3 text-sm hover:border-[var(--color-electric-cobalt)]" key={criterion.id}>
            <span className="flex items-start gap-2">
              <input
                checked={props.selectedCriterionIds.includes(criterion.id)}
                onChange={() => props.toggleCriterion(criterion.id)}
                type="checkbox"
              />
              <span>
                <strong className="text-[var(--color-ink-navy)]">{criterion.ma}</strong> {criterion.ten}
              </span>
            </span>
            {props.showRoot && props.selectedCriterionIds.includes(criterion.id) ? (
              <span className="flex items-center gap-2 text-[var(--color-graphite)]/70">
                <input
                  checked={props.rootCriterionId === criterion.id}
                  name="rootCriterion"
                  onChange={() => props.setRootCriterionId(criterion.id)}
                  type="radio"
                />
                Tiêu chí gốc
              </span>
            ) : null}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function EvidenceFilters(props: {
  criteria: Criterion[];
  filters: Filters;
  setFilters: (filters: Filters) => void;
  years: SchoolYear[];
}) {
  const hasAnyFilter = Boolean(
    props.filters.keyword.trim() ||
      props.filters.namHocId ||
      props.filters.tieuChuan ||
      props.filters.tieuChiIds.length > 0 ||
      props.filters.trangThai,
  );

  return (
    <section className="surface-card grid gap-3 p-5 lg:grid-cols-5">
      <label className="text-sm font-medium lg:col-span-2">
        Tìm mã hoặc tên
        <input
          className="form-control mt-2"
          value={props.filters.keyword}
          onChange={(event) => props.setFilters({ ...props.filters, keyword: event.target.value })}
        />
      </label>
      <label className="text-sm font-medium">
        Năm học
        <select
          className="form-control mt-2"
          value={props.filters.namHocId}
          onChange={(event) => props.setFilters({ ...props.filters, namHocId: event.target.value })}
        >
          <option value="">Đang hoạt động</option>
          {props.years.map((year) => (
            <option key={year.id} value={year.id}>
              {year.ten}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium">
        Tiêu chuẩn
        <select
          className="form-control mt-2"
          value={props.filters.tieuChuan}
          onChange={(event) => props.setFilters({ ...props.filters, tieuChuan: event.target.value })}
        >
          <option value="">Tất cả</option>
          {[1, 2, 3, 4].map((number) => (
            <option key={number} value={number}>
              Tiêu chuẩn {number}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium">
        Trạng thái
        <select
          className="form-control mt-2"
          value={props.filters.trangThai}
          onChange={(event) => props.setFilters({ ...props.filters, trangThai: event.target.value })}
        >
          <option value="">Tất cả</option>
          <option value="cho_xac_minh">Chờ xác minh</option>
          <option value="da_xac_minh">Đã xác minh</option>
          <option value="tu_choi">Từ chối</option>
          <option value="het_hieu_luc">Hết hiệu lực</option>
        </select>
      </label>
      <CriterionFilterGrid
        criteria={props.criteria}
        selectedIds={props.filters.tieuChiIds}
        onChange={(tieuChiIds) => props.setFilters({ ...props.filters, tieuChiIds })}
      />

      <label className="hidden">
        Tiêu chí
        <select
          className="form-control mt-2 min-h-40"
          multiple
          value={props.filters.tieuChiIds}
          onChange={(event) =>
            props.setFilters({
              ...props.filters,
              tieuChiIds: Array.from(event.target.selectedOptions, (option) => option.value).filter(Boolean),
            })
          }
        >
          <option value="">Tất cả tiêu chí</option>
          {props.criteria.map((criterion) => (
            <option key={criterion.id} value={criterion.id}>
              {criterion.ma} - {criterion.ten}
            </option>
          ))}
        </select>
      </label>
      {hasAnyFilter ? (
      <div className="lg:col-span-5">
        <button
          className="button-secondary"
          type="button"
          onClick={() =>
            props.setFilters({
              keyword: "",
              namHocId: "",
              tieuChuan: "",
              tieuChiIds: [],
              trangThai: "",
            })
          }
        >
          Xóa bộ lọc
        </button>
      </div>
      ) : null}
    </section>
  );
}

function CriterionFilterGrid({
  criteria,
  onChange,
  selectedIds,
}: {
  criteria: Criterion[];
  onChange: (ids: string[]) => void;
  selectedIds: string[];
}) {
  function toggleCriterion(id: string) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id]);
  }

  return (
    <fieldset className="criterion-filter lg:col-span-5">
      <div className="criterion-filter-header">
        <legend className="text-sm font-semibold text-[var(--color-ink-navy)]">Tiêu chí</legend>
        {selectedIds.length > 0 ? (
          <button className="criterion-filter-clear" type="button" onClick={() => onChange([])}>
            Bỏ chọn tiêu chí
          </button>
        ) : (
          <span className="criterion-filter-hint">Chọn một hoặc nhiều tiêu chí</span>
        )}
      </div>

      <div className="criterion-filter-grid">
        {criteria.map((criterion) => {
          const isSelected = selectedIds.includes(criterion.id);

          return (
            <button
              aria-pressed={isSelected}
              className={`criterion-filter-option ${isSelected ? "criterion-filter-option-active" : ""}`}
              key={criterion.id}
              type="button"
              onClick={() => toggleCriterion(criterion.id)}
            >
              <span className="criterion-filter-code">{criterion.ma}</span>
              <span className="criterion-filter-name">{criterion.ten}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function Message({ text }: { text: string }) {
  return (
    <Alert tone={text.includes("Đã ") ? "success" : "warning"}>{text}</Alert>
  );
}
