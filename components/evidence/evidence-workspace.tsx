"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { getTT57CriterionReference } from "@/lib/tt57/reference-data";
import {
  Criterion,
  Evidence,
  EvidenceCriterionLink,
  Profile,
  SchoolYear,
  formatEvidenceStatus,
  sha256File,
  storagePathForEvidence,
} from "@/lib/evidence";

type EvidenceWithCriteria = Evidence & {
  criteria: Criterion[];
};

type Filters = {
  keyword: string;
  namHocId: string;
  tieuChuan: string;
  tieuChiId: string;
  trangThai: string;
};

function enrichCriterionLabel(criterion: Criterion, loaiHinh: string): Criterion {
  const reference = getTT57CriterionReference(loaiHinh, criterion.ma);

  if (!reference) {
    return criterion;
  }

  return {
    ...criterion,
    ten: reference.ten,
    la_bat_buoc: reference.la_bat_buoc,
    tieu_chuan: criterion.tieu_chuan
      ? {
          ...criterion.tieu_chuan,
          ten: reference.tieu_chuan.ten,
        }
      : criterion.tieu_chuan,
  };
}

export function EvidenceWorkspace() {
  const router = useRouter();
  const supabase = useMemo(() => {
    if (!isSupabaseConfigured()) {
      return null;
    }

    return createBrowserSupabaseClient();
  }, []);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [schoolType, setSchoolType] = useState("mam_non");
  const [years, setYears] = useState<SchoolYear[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [evidence, setEvidence] = useState<EvidenceWithCriteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState<Filters>({
    keyword: "",
    namHocId: "",
    tieuChuan: "",
    tieuChiId: "",
    trangThai: "",
  });

  const activeYear = years.find((year) => year.trang_thai === "dang_hoat_dong");
  const selectedYearId = filters.namHocId || activeYear?.id || years[0]?.id || "";

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
      setMessage(profileError?.message ?? "Bạn cần thiết lập cơ sở giáo dục trước.");
      setLoading(false);
      return;
    }

    setProfile(profileData);

    const [{ data: yearData }, { data: schoolData }] = await Promise.all([
      supabase
        .from("nam_hoc")
        .select("id, ten, trang_thai")
        .eq("co_so_id", profileData.co_so_id)
        .order("ngay_bat_dau", { ascending: false }),
      supabase
        .from("co_so_giao_duc")
        .select("loai_hinh")
        .eq("id", profileData.co_so_id)
        .maybeSingle(),
    ]);

    const { data: criterionData } = await supabase
      .from("tieu_chi")
      .select("id, ma, ten, la_bat_buoc, loai_hinh_ap_dung, tieu_chuan_id, tieu_chuan: tieu_chuan_id(so_thu_tu, ten)")
      .eq("loai_hinh_ap_dung", schoolData?.loai_hinh ?? "mam_non")
      .order("ma", { ascending: true });

    const loadedSchoolType = schoolData?.loai_hinh ?? "mam_non";
    const enrichedCriteria = ((criterionData ?? []) as unknown as Criterion[]).map((criterion) =>
      enrichCriterionLabel(criterion, loadedSchoolType),
    );

    setSchoolType(loadedSchoolType);
    setYears((yearData ?? []) as SchoolYear[]);
    setCriteria(enrichedCriteria);
    setLoading(false);
  }, [router, supabase]);

  const loadEvidence = useCallback(async () => {
    if (!supabase || !profile) {
      return;
    }

    let query = supabase
      .from("minh_chung")
      .select("*")
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

    const { data: evidenceData, error } = await query;

    if (error) {
      setMessage(error.message);
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
    const rows = ((evidenceData ?? []) as Evidence[])
      .map((item) => ({
        ...item,
        criteria: links
          .filter((link) => link.minh_chung_id === item.id)
          .map((link) => link.tieu_chi)
          .filter(Boolean)
          .map((criterion) => enrichCriterionLabel(criterion as Criterion, schoolType)) as Criterion[],
      }))
      .filter((item) => {
        if (filters.tieuChiId) {
          return item.criteria.some((criterion) => criterion.id === filters.tieuChiId);
        }

        if (filters.tieuChuan) {
          return item.criteria.some(
            (criterion) => String(criterion.tieu_chuan?.so_thu_tu) === filters.tieuChuan,
          );
        }

        return true;
      });

    setEvidence(rows);

    await supabase.from("nhat_ky_truy_cap").insert({
      co_so_id: profile.co_so_id,
      nguoi_dung_id: profile.id,
      hanh_dong: "EVIDENCE_LIST_READ",
      doi_tuong: "minh_chung",
      du_lieu_moi: {
        nam_hoc_id: selectedYearId,
        bo_loc: filters,
        so_dong: rows.length,
      },
    });
  }, [filters, profile, schoolType, selectedYearId, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadEvidence();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadEvidence]);

  if (loading) {
    return <p className="text-sm text-[var(--color-graphite)]/70">Đang tải kho minh chứng...</p>;
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap gap-3">
        <Link className="button-primary" href="/minh-chung/suc-khoe">
          Kiểm tra sức khỏe
        </Link>
        <Link className="button-secondary" href="/thiet-lap">
          Năm học
        </Link>
      </div>

      {message ? <Message text={message} /> : null}

      <EvidenceCreateForm
        criteria={criteria}
        evidence={evidence}
        profile={profile}
        selectedYearId={selectedYearId}
        supabase={supabase}
        onDone={async (text) => {
          setMessage(text);
          await loadEvidence();
        }}
      />

      <EvidenceFilters
        criteria={criteria}
        filters={filters}
        setFilters={setFilters}
        years={years}
      />

      <section className="surface-card overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">Danh sách minh chứng</h2>
          <p className="mt-1 text-sm text-[var(--color-graphite)]/70">
            Mỗi dòng là một mã minh chứng duy nhất, có thể phục vụ nhiều tiêu chí.
          </p>
        </div>

        <div className="divide-y divide-[var(--color-border)]">
          {evidence.length === 0 ? (
            <p className="px-5 py-6 text-sm text-[var(--color-graphite)]/70">Chưa có minh chứng phù hợp.</p>
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
      </section>
    </div>
  );
}

function EvidenceCreateForm(props: {
  criteria: Criterion[];
  evidence: EvidenceWithCriteria[];
  profile: Profile | null;
  selectedYearId: string;
  supabase: ReturnType<typeof createBrowserSupabaseClient> | null;
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

    setSubmitting(true);

    if (mode === "reuse") {
      const { error } = await props.supabase.rpc("fn_gan_minh_chung_tieu_chi", {
        p_minh_chung_id: selectedEvidenceId,
        p_tieu_chi_ids: selectedCriterionIds,
      });

      setSubmitting(false);
      await props.onDone(error ? error.message : "Đã gắn thêm tiêu chí cho minh chứng có sẵn.");
      return;
    }

    if (!rootCriterionId) {
      setSubmitting(false);
      await props.onDone("Hãy chọn tiêu chí gốc để sinh mã minh chứng.");
      return;
    }

    if (!file && !hyperlink.trim()) {
      setSubmitting(false);
      await props.onDone("Hãy chọn tệp hoặc nhập liên kết điện tử.");
      return;
    }

    let storagePath: string | null = null;
    let hash: string | null = null;
    let size: number | null = null;
    let type: string | null = null;

    if (file) {
      storagePath = storagePathForEvidence(props.profile.co_so_id, props.selectedYearId, file);
      hash = await sha256File(file);
      size = file.size;
      type = file.type || "application/octet-stream";

      const { error: uploadError } = await props.supabase.storage
        .from("evidence")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        setSubmitting(false);
        await props.onDone(uploadError.message);
        return;
      }
    }

    const { error } = await props.supabase.rpc("fn_tao_minh_chung", {
      p_nam_hoc_id: props.selectedYearId,
      p_tieu_chi_ids: selectedCriterionIds,
      p_tieu_chi_goc_id: rootCriterionId,
      p_ten: ten,
      p_loai_tep: type,
      p_duong_dan: hyperlink,
      p_storage_path: storagePath,
      p_hash_tep: hash,
      p_kich_thuoc: size,
      p_ngay_ban_hanh: ngayBanHanh || null,
      p_ngay_het_gia_tri: ngayHetGiaTri || null,
    });

    setSubmitting(false);

    if (error) {
      await props.onDone(error.message);
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
        <div className="segmented-control grid-cols-2 text-sm font-medium">
          <button
            className={`segmented-option ${mode === "new" ? "segmented-option-active" : "text-[var(--color-graphite)]"}`}
            type="button"
            onClick={() => setMode("new")}
          >
            Mới
          </button>
          <button
            className={`segmented-option ${mode === "reuse" ? "segmented-option-active" : "text-[var(--color-graphite)]"}`}
            type="button"
            onClick={() => setMode("reuse")}
          >
            Dùng lại
          </button>
        </div>
      </div>

      <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
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
              <input
                className="form-control mt-2 text-sm"
                type="file"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
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
          {submitting ? "Đang lưu..." : mode === "new" ? "Tải lên và gắn tiêu chí" : "Gắn tiêu chí cho mã có sẵn"}
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
      <div className="grid max-h-72 gap-2 overflow-auto rounded-[var(--radius-card)] border border-[var(--color-border)] p-3 sm:grid-cols-2 lg:grid-cols-3">
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
      <label className="text-sm font-medium lg:col-span-5">
        Tiêu chí
        <select
          className="form-control mt-2"
          value={props.filters.tieuChiId}
          onChange={(event) => props.setFilters({ ...props.filters, tieuChiId: event.target.value })}
        >
          <option value="">Tất cả tiêu chí</option>
          {props.criteria.map((criterion) => (
            <option key={criterion.id} value={criterion.id}>
              {criterion.ma} - {criterion.ten}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}

function Message({ text }: { text: string }) {
  return (
    <p className="status-message text-sm">
      {text}
    </p>
  );
}
