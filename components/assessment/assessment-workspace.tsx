"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import {
  CapHoc,
  KetQuaTieuChi,
  kiemTraRangBuocCapNhat,
  xacDinhMucToanTruongTuKetQua,
  xacDinhMucTuKetQua,
} from "@/lib/assessment/level-engine";
import { Alert } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { StatusBadge } from "@/components/ui/status-badge";

type Profile = {
  id: string;
  co_so_id: string;
  ho_ten: string;
};

type School = {
  id: string;
  ten: string;
  loai_hinh: string;
  cap_hoc: CapHoc[];
};

type SchoolYear = {
  id: string;
  ten: string;
  trang_thai: string;
};

type Criterion = {
  id: string;
  ma: string;
  ten: string;
  la_bat_buoc: boolean;
  loai_hinh_ap_dung: string;
  muc_tieu_chi?: {
    muc: 1 | 2;
    noi_dung_yeu_cau: string;
  }[];
  minh_chung_goi_y?: {
    mo_ta: string;
  }[];
};

type AssessmentRow = {
  id: string;
  tieu_chi_id: string;
  mo_ta_muc_1: string | null;
  dat_muc_1: boolean;
  mo_ta_muc_2: string | null;
  dat_muc_2: boolean;
  muc_dat: 0 | 1 | 2;
  trang_thai: string;
};

type EvidenceOption = {
  id: string;
  ma: string;
  ten: string;
  tieuChiIds: string[];
};

const capHocLabels: Record<CapHoc, string> = {
  mam_non: "Mầm non",
  tieu_hoc: "Tiểu học",
  thcs: "THCS",
  thpt: "THPT",
  gdtx: "GDTX",
  khac: "Khác",
};

function toKetQuaTieuChi(
  criteria: Criterion[],
  assessments: AssessmentRow[],
  evidence: EvidenceOption[],
) {
  return criteria.map<KetQuaTieuChi>((criterion) => {
    const row = assessments.find((item) => item.tieu_chi_id === criterion.id);

    return {
      id: criterion.id,
      ma: criterion.ma,
      ten: criterion.ten,
      laBatBuoc: criterion.la_bat_buoc,
      mucDat: row?.muc_dat ?? 0,
      moTaMuc1: row?.mo_ta_muc_1 ?? "",
      moTaMuc2: row?.mo_ta_muc_2 ?? "",
      maMinhChung: evidence
        .filter((item) => item.tieuChiIds.includes(criterion.id))
        .map((item) => item.ma),
    };
  });
}

export function AssessmentWorkspace() {
  const router = useRouter();
  const supabase = useMemo(() => {
    if (!isSupabaseConfigured()) {
      return null;
    }

    return createBrowserSupabaseClient();
  }, []);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [years, setYears] = useState<SchoolYear[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [evidence, setEvidence] = useState<EvidenceOption[]>([]);
  const [selectedCapHoc, setSelectedCapHoc] = useState<CapHoc>("mam_non");
  const [selectedCriterionId, setSelectedCriterionId] = useState("");
  const [whatIfCriterionId, setWhatIfCriterionId] = useState("");
  const [whatIfLevel, setWhatIfLevel] = useState<0 | 1 | 2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const activeYear = years.find((year) => year.trang_thai === "dang_hoat_dong") ?? years[0];
  const capHocList = school?.cap_hoc?.length ? school.cap_hoc : [selectedCapHoc];
  const ketQuaTieuChi = toKetQuaTieuChi(criteria, assessments, evidence);
  const giaiTrinh = xacDinhMucTuKetQua(ketQuaTieuChi);
  const selectedCriterion =
    criteria.find((criterion) => criterion.id === selectedCriterionId) ?? criteria[0];
  const whatIfCriterion = ketQuaTieuChi.find((item) => item.id === whatIfCriterionId);

  const whatIfKetQua = ketQuaTieuChi.map((item) => {
    if (whatIfLevel === null || item.id !== whatIfCriterionId) {
      return item;
    }

    return {
      ...item,
      mucDat: whatIfLevel,
      moTaMuc1: whatIfLevel >= 1 ? item.moTaMuc1 || "Giả định đủ mô tả Mức 1" : "",
      moTaMuc2: whatIfLevel >= 2 ? item.moTaMuc2 || "Giả định đủ mô tả Mức 2" : item.moTaMuc2,
      maMinhChung: (item.maMinhChung?.length ?? 0) > 0 ? item.maMinhChung : ["MC.GIA-DINH"],
    } satisfies KetQuaTieuChi;
  });
  const whatIfResult = xacDinhMucTuKetQua(whatIfKetQua);

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

    setProfile(profileData as Profile);

    const [{ data: schoolData }, { data: yearData }] =
      await Promise.all([
        supabase
          .from("co_so_giao_duc")
          .select("id, ten, loai_hinh, cap_hoc")
          .eq("id", profileData.co_so_id)
          .maybeSingle(),
        supabase
          .from("nam_hoc")
          .select("id, ten, trang_thai")
          .eq("co_so_id", profileData.co_so_id)
          .order("ngay_bat_dau", { ascending: false }),
      ]);

    const loadedSchool = schoolData as School | null;
    const loadedYears = (yearData ?? []) as SchoolYear[];
    const loadedActiveYear = loadedYears.find((year) => year.trang_thai === "dang_hoat_dong") ?? loadedYears[0];
    const { data: criterionData, error: criterionError } = loadedActiveYear
      ? await supabase
          .from("v_tieu_chi_nam_hoc")
          .select("id, ma, ten, la_bat_buoc, loai_hinh_ap_dung, muc_1, muc_2, minh_chung_goi_y")
          .eq("co_so_id", profileData.co_so_id)
          .eq("nam_hoc_id", loadedActiveYear.id)
          .order("ma", { ascending: true })
      : { data: [], error: null };

    if (criterionError) {
      setMessage(criterionError.message);
      setLoading(false);
      return;
    }

    const loadedCriteria = ((criterionData ?? []) as {
      id: string;
      ma: string;
      ten: string;
      la_bat_buoc: boolean;
      loai_hinh_ap_dung: string;
      muc_1: string | null;
      muc_2: string | null;
      minh_chung_goi_y: string | null;
    }[]).map<Criterion>((criterion) => ({
      id: criterion.id,
      ma: criterion.ma,
      ten: criterion.ten,
      la_bat_buoc: criterion.la_bat_buoc,
      loai_hinh_ap_dung: criterion.loai_hinh_ap_dung,
      muc_tieu_chi: [
        { muc: 1, noi_dung_yeu_cau: criterion.muc_1 ?? "" },
        { muc: 2, noi_dung_yeu_cau: criterion.muc_2 ?? "" },
      ],
      minh_chung_goi_y: criterion.minh_chung_goi_y
        ? [{ mo_ta: criterion.minh_chung_goi_y }]
        : [],
    }));

    setSchool(loadedSchool);
    setYears(loadedYears);
    setCriteria(loadedCriteria);
    setSelectedCriterionId((current) => current || loadedCriteria[0]?.id || "");
    setWhatIfCriterionId((current) => current || loadedCriteria[0]?.id || "");

    if (loadedSchool?.cap_hoc?.[0]) {
      setSelectedCapHoc(loadedSchool.cap_hoc[0]);
    }

    setLoading(false);
  }, [router, supabase]);

  const loadAssessmentData = useCallback(async () => {
    if (!supabase || !profile || !activeYear) {
      return;
    }

    const [{ data: assessmentData, error: assessmentError }, { data: evidenceData, error: evidenceError }] =
      await Promise.all([
        supabase
          .from("tu_danh_gia")
          .select("id, tieu_chi_id, mo_ta_muc_1, dat_muc_1, mo_ta_muc_2, dat_muc_2, muc_dat, trang_thai")
          .eq("co_so_id", profile.co_so_id)
          .eq("nam_hoc_id", activeYear.id)
          .eq("cap_hoc", selectedCapHoc),
        supabase
          .from("v_minh_chung_hop_le_danh_gia")
          .select("id, ma, ten")
          .eq("co_so_id", profile.co_so_id)
          .eq("nam_hoc_id", activeYear.id)
          .order("ma", { ascending: true }),
      ]);

    if (assessmentError || evidenceError) {
      setMessage(assessmentError?.message ?? evidenceError?.message ?? "Không tải được dữ liệu tự đánh giá.");
      return;
    }

    setAssessments((assessmentData ?? []) as AssessmentRow[]);
    const evidenceIds = (evidenceData ?? []).map((item) => item.id);
    const { data: linkData, error: linkError } = evidenceIds.length
      ? await supabase
          .from("minh_chung_tieu_chi")
          .select("minh_chung_id, tieu_chi_id")
          .in("minh_chung_id", evidenceIds)
      : { data: [], error: null };

    if (linkError) {
      setMessage(linkError.message);
      return;
    }

    setEvidence(
      ((evidenceData ?? []) as { id: string; ma: string; ten: string }[]).map((item) => ({
        id: item.id,
        ma: item.ma,
        ten: item.ten,
        tieuChiIds: (linkData ?? [])
          .filter((link) => link.minh_chung_id === item.id)
          .map((link) => link.tieu_chi_id),
      })),
    );
  }, [activeYear, profile, selectedCapHoc, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAssessmentData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadAssessmentData]);

  if (loading) {
    return <LoadingState label="Đang tải tự đánh giá..." />;
  }

  if (!profile || !activeYear) {
    return (
      <EmptyState
        title="Chưa có dữ liệu để tự đánh giá"
        description="Hãy thiết lập cơ sở giáo dục và năm học đang hoạt động trước khi nhập tự đánh giá."
        action={<Link className="button-primary" href="/thiet-lap">Thiết lập ngay</Link>}
      />
    );
  }

  return (
    <div className="grid gap-6">
      <section className="featured-card grid gap-4 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="text-sm text-white/70">{activeYear.ten}</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">{giaiTrinh.mucDat}</h2>
          <p className="mt-2 text-sm leading-6 text-white/78">{giaiTrinh.lyDo}</p>
          <p className="mt-1 text-sm font-medium text-white">{giaiTrinh.khoangCach}</p>
        </div>

        <label className="text-sm font-medium text-white">
          Cấp học
          <select
            className="form-control mt-2 min-w-48"
            value={selectedCapHoc}
            onChange={(event) => setSelectedCapHoc(event.target.value as CapHoc)}
          >
            {capHocList.map((capHoc) => (
              <option key={capHoc} value={capHoc}>
                {capHocLabels[capHoc] ?? capHoc}
              </option>
            ))}
          </select>
        </label>
      </section>

      {message ? <Message text={message} /> : null}

      <div className="flex flex-wrap gap-3">
        <Link className="button-secondary" href="/tu-danh-gia/cho-duyet">
          Xem tiêu chí chờ duyệt
        </Link>
        <Link className="button-secondary" href="/bo-tieu-chuan">
          Tra cứu bộ tiêu chuẩn
        </Link>
      </div>

      <GapBoard
        ketQuaTieuChi={ketQuaTieuChi}
        selectedCriterionId={selectedCriterion?.id ?? ""}
        whatIfCriterionId={whatIfCriterionId}
        whatIfLevel={whatIfLevel}
        onSelect={setSelectedCriterionId}
      />

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {selectedCriterion ? (
          <CriterionAssessmentForm
            activeYearId={activeYear.id}
            criterion={selectedCriterion}
            evidence={evidence}
            profile={profile}
            row={assessments.find((item) => item.tieu_chi_id === selectedCriterion.id) ?? null}
            selectedCapHoc={selectedCapHoc}
            supabase={supabase}
            onDone={async (text) => {
              setMessage(text);
              await loadAssessmentData();
            }}
          />
        ) : (
          <p className="surface-card surface-card-pad text-sm text-[var(--color-graphite)]/70">
            Chưa có tiêu chí trong bộ tiêu chuẩn.
          </p>
        )}

        <WhatIfPanel
          capHocList={capHocList}
          criteria={criteria}
          currentResult={giaiTrinh}
          selectedCriterionId={whatIfCriterionId}
          selectedCriterionName={whatIfCriterion ? `${whatIfCriterion.ma} - ${whatIfCriterion.ten}` : ""}
          setSelectedCriterionId={(id) => {
            setWhatIfCriterionId(id);
            setSelectedCriterionId(id);
          }}
          setWhatIfLevel={setWhatIfLevel}
          currentCriterionLevel={whatIfCriterion?.mucDat ?? 0}
          whatIfLevel={whatIfLevel}
          whatIfResult={whatIfResult}
          wholeSchoolResult={xacDinhMucToanTruongTuKetQua(
            capHocList.map((capHoc) => ({
              capHoc,
              ketQuaTieuChi: capHoc === selectedCapHoc && whatIfLevel !== null ? whatIfKetQua : ketQuaTieuChi,
            })),
          )}
        />
      </section>
    </div>
  );
}

function GapBoard(props: {
  ketQuaTieuChi: KetQuaTieuChi[];
  selectedCriterionId: string;
  whatIfCriterionId: string;
  whatIfLevel: 0 | 1 | 2 | null;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="surface-card overflow-hidden">
      <div className="border-b border-[var(--color-border)] px-5 py-4">
        <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">Gap Board</h2>
      </div>
      <div className="grid auto-rows-fr gap-2.5 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {props.ketQuaTieuChi.map((item) => {
          const isWhatIf = props.whatIfLevel !== null && item.id === props.whatIfCriterionId;
          const displayLevel = isWhatIf ? props.whatIfLevel ?? item.mucDat : item.mucDat;
          const displayItem = isWhatIf ? { ...item, mucDat: displayLevel } : item;
          const rangBuoc = kiemTraRangBuocCapNhat(displayItem);
          const dangThieu = item.laBatBuoc && displayLevel < 1;
          const tone = dangThieu
            ? "border-[var(--color-danger)] bg-[var(--color-danger-soft)]"
            : displayLevel === 2
              ? "border-[var(--color-success)] bg-[var(--color-success-soft)]"
              : displayLevel === 1
                ? "border-[var(--color-warning)] bg-[var(--color-warning-soft)]"
                : "border-[var(--color-border)] bg-white";
          const statusText = displayLevel === 0 ? "Chưa đạt" : `Mức ${displayLevel}`;
          const statusTone = displayLevel === 0
            ? "bg-white/85 text-[var(--color-danger)]"
            : displayLevel === 2
              ? "bg-white/85 text-[var(--color-success)]"
              : "bg-white/85 text-[var(--color-warning)]";

          return (
            <button
              className={`grid min-h-32 grid-rows-[auto_1fr_auto] rounded-[var(--radius-card)] border p-2.5 text-left text-[13px] transition hover:border-[var(--color-electric-cobalt)] hover:shadow-sm ${tone} ${
                props.selectedCriterionId === item.id ? "outline outline-2 outline-[var(--color-electric-cobalt)]" : ""
              }`}
              aria-pressed={props.selectedCriterionId === item.id}
              key={item.id}
              type="button"
              title={`${item.ma} - ${item.ten}`}
              onClick={() => item.id && props.onSelect(item.id)}
            >
              <span className="flex min-h-6 items-start justify-between gap-2">
                <span className="font-semibold tabular-nums leading-6 text-[var(--color-ink-navy)]">{item.ma}</span>
                <span className="flex items-center gap-1">
                  {isWhatIf ? (
                    <span className="rounded-full bg-[var(--color-electric-cobalt)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-normal text-white">
                      Giả định
                    </span>
                  ) : null}
                  {item.laBatBuoc ? (
                    <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-normal text-[var(--color-warning)]">
                      Bắt buộc
                    </span>
                  ) : null}
                </span>
              </span>
              <span className="mt-1.5 block line-clamp-4 font-semibold leading-5 text-[var(--color-ink-navy)]">
                {item.ten}
              </span>
              <span className="mt-2 flex min-h-6 items-end justify-between gap-2">
                <span className="line-clamp-1 text-[11px] leading-5 text-[var(--color-warning)]">
                  {!rangBuoc.hopLe ? rangBuoc.loi[0] : ""}
                </span>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusTone}`}>
                  {statusText}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function CriterionAssessmentForm(props: {
  activeYearId: string;
  criterion: Criterion;
  evidence: EvidenceOption[];
  profile: Profile;
  row: AssessmentRow | null;
  selectedCapHoc: CapHoc;
  supabase: ReturnType<typeof createBrowserSupabaseClient> | null;
  onDone: (message: string) => Promise<void>;
}) {
  const muc1Requirement =
    props.criterion.muc_tieu_chi?.find((level) => level.muc === 1)?.noi_dung_yeu_cau ?? "";
  const muc2Requirement =
    props.criterion.muc_tieu_chi?.find((level) => level.muc === 2)?.noi_dung_yeu_cau ?? "";
  const evidenceSuggestion = props.criterion.minh_chung_goi_y?.[0]?.mo_ta ?? "";
  const [moTaMuc1, setMoTaMuc1] = useState("");
  const [moTaMuc2, setMoTaMuc2] = useState("");
  const [mucDat, setMucDat] = useState<0 | 1 | 2>(0);
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<"cho_duyet" | "da_duyet" | "dang_ra_soat" | null>(null);
  const statusConfirm = {
    cho_duyet: {
      confirmLabel: "Gửi duyệt",
      description: "Tiêu chí sẽ chuyển sang hàng đợi để người có thẩm quyền xem xét. Bạn vẫn nên lưu nội dung tự đánh giá trước khi gửi.",
      title: "Gửi tiêu chí này sang chờ duyệt?",
      tone: "primary" as const,
    },
    da_duyet: {
      confirmLabel: "Chốt mức",
      description: "Mức tự đánh giá của tiêu chí sẽ được chốt theo dữ liệu hiện tại. Hãy chắc chắn mô tả hiện trạng và mã minh chứng đã đúng.",
      title: "Chốt mức tự đánh giá?",
      tone: "danger" as const,
    },
    dang_ra_soat: {
      confirmLabel: "Trả về rà soát",
      description: "Tiêu chí sẽ quay lại trạng thái rà soát để người phụ trách chỉnh sửa hoặc bổ sung minh chứng.",
      title: "Trả tiêu chí về rà soát?",
      tone: "warning" as const,
    },
  };
  const pendingConfirm = pendingStatus ? statusConfirm[pendingStatus] : null;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMoTaMuc1(props.row?.mo_ta_muc_1 ?? "");
      setMoTaMuc2(props.row?.mo_ta_muc_2 ?? "");
      setMucDat(props.row?.muc_dat ?? 0);
      setSelectedEvidenceIds(
        props.evidence
          .filter((item) => item.tieuChiIds.includes(props.criterion.id))
          .map((item) => item.id),
      );
    }, 0);

    return () => window.clearTimeout(timer);
  }, [props.criterion.id, props.evidence, props.row]);

  function toggleEvidence(id: string) {
    setSelectedEvidenceIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!props.supabase) {
      await props.onDone("Chưa cấu hình Supabase.");
      return;
    }

    const selectedEvidenceCodes = props.evidence
      .filter((item) => selectedEvidenceIds.includes(item.id))
      .map((item) => item.ma);
    const rangBuoc = kiemTraRangBuocCapNhat({
      id: props.criterion.id,
      ma: props.criterion.ma,
      ten: props.criterion.ten,
      laBatBuoc: props.criterion.la_bat_buoc,
      mucDat,
      moTaMuc1,
      moTaMuc2,
      maMinhChung: selectedEvidenceCodes,
    });

    if (!rangBuoc.hopLe) {
      await props.onDone(rangBuoc.loi.join(" "));
      return;
    }

    setSaving(true);

    for (const evidenceId of selectedEvidenceIds) {
      const evidence = props.evidence.find((item) => item.id === evidenceId);

      if (!evidence?.tieuChiIds.includes(props.criterion.id)) {
        const { error } = await props.supabase.rpc("fn_gan_minh_chung_tieu_chi", {
          p_minh_chung_id: evidenceId,
          p_tieu_chi_ids: [props.criterion.id],
        });

        if (error) {
          setSaving(false);
          await props.onDone(error.message);
          return;
        }
      }
    }

    const removedEvidenceIds = props.evidence
      .filter((item) => item.tieuChiIds.includes(props.criterion.id))
      .map((item) => item.id)
      .filter((id) => !selectedEvidenceIds.includes(id));

    if (removedEvidenceIds.length > 0) {
      const { error } = await props.supabase
        .from("minh_chung_tieu_chi")
        .delete()
        .eq("tieu_chi_id", props.criterion.id)
        .in("minh_chung_id", removedEvidenceIds);

      if (error) {
        setSaving(false);
        await props.onDone(error.message);
        return;
      }
    }

    const { error } = await props.supabase.from("tu_danh_gia").upsert(
      {
        co_so_id: props.profile.co_so_id,
        nam_hoc_id: props.activeYearId,
        tieu_chi_id: props.criterion.id,
        cap_hoc: props.selectedCapHoc,
        mo_ta_muc_1: moTaMuc1,
        dat_muc_1: mucDat >= 1,
        mo_ta_muc_2: moTaMuc2,
        dat_muc_2: mucDat >= 2,
        muc_dat: mucDat,
        nguoi_nhap: props.profile.id,
      },
      { onConflict: "co_so_id,nam_hoc_id,tieu_chi_id,cap_hoc" },
    );

    setSaving(false);
    await props.onDone(error ? error.message : "Đã lưu tự đánh giá cho tiêu chí.");
  }

  async function updateStatus(status: "cho_duyet" | "da_duyet" | "dang_ra_soat") {
    if (!props.supabase) {
      await props.onDone("Chưa cấu hình Supabase.");
      return;
    }

    const { error } = await props.supabase.rpc("fn_cap_nhat_trang_thai_tu_danh_gia", {
      p_nam_hoc_id: props.activeYearId,
      p_cap_hoc: props.selectedCapHoc,
      p_tieu_chi_id: props.criterion.id,
      p_trang_thai: status,
    });

    await props.onDone(
      error
        ? error.message
        : status === "cho_duyet"
          ? "Đã gửi tiêu chí sang trạng thái chờ duyệt."
          : status === "da_duyet"
            ? "Đã chốt mức tự đánh giá cho tiêu chí."
            : "Đã chuyển tiêu chí về trạng thái rà soát.",
    );
  }

  async function confirmStatusChange() {
    if (!pendingStatus) {
      return;
    }

    const status = pendingStatus;
    setPendingStatus(null);
    await updateStatus(status);
  }

  return (
    <form className="surface-card grid gap-4 p-5" onSubmit={handleSubmit}>
      <div>
        <p className="text-sm font-semibold text-[var(--color-warning)]">
          {props.criterion.ma} {props.criterion.la_bat_buoc ? "bắt buộc" : ""}
        </p>
        <h2 className="mt-1 text-xl font-semibold text-[var(--color-ink-navy)]">{props.criterion.ten}</h2>
        <div className="mt-2">
          <StatusBadge status={props.row?.trang_thai ?? "chua_nhap"} />
        </div>
        <p className="mt-2 text-sm leading-6 text-[var(--color-graphite)]/70">
          Nội dung quy định của tiêu chí nằm ngay dưới từng mức. Nhà trường chỉ nhập hiện trạng thực tế và gắn mã minh chứng.
        </p>
      </div>

      <fieldset className="grid gap-2 text-sm font-medium">
        <legend>Mức tự đánh giá</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { value: 0, label: "Chưa đạt" },
            { value: 1, label: "Mức 1" },
            { value: 2, label: "Mức 2" },
          ].map((option) => (
            <label className="surface-card px-3 py-3" key={option.value}>
              <input
                checked={mucDat === option.value}
                className="mr-2"
                name="mucDat"
                type="radio"
                onChange={() => setMucDat(option.value as 0 | 1 | 2)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="text-sm font-medium">
        Mô tả hiện trạng Mức 1
        {muc1Requirement ? (
          <span className="mt-2 block rounded-[var(--radius-card)] bg-[var(--color-lavender-mist)] p-3 text-sm font-normal leading-6 text-[var(--color-ink-navy)]">
            <strong className="mb-1 block">Nội dung quy định Mức 1</strong>
            {muc1Requirement}
          </span>
        ) : null}
        <textarea
          className="form-control mt-2 min-h-28"
          value={moTaMuc1}
          onChange={(event) => setMoTaMuc1(event.target.value)}
        />
      </label>

      <label className="text-sm font-medium">
        Mô tả hiện trạng Mức 2
        {muc2Requirement ? (
          <span className="mt-2 block rounded-[var(--radius-card)] bg-[var(--color-lavender-mist)] p-3 text-sm font-normal leading-6 text-[var(--color-ink-navy)]">
            <strong className="mb-1 block">Nội dung quy định Mức 2</strong>
            {muc2Requirement}
          </span>
        ) : null}
        <textarea
          className="form-control mt-2 min-h-28"
          value={moTaMuc2}
          onChange={(event) => setMoTaMuc2(event.target.value)}
        />
      </label>

      <fieldset className="grid gap-2 text-sm font-medium">
        <legend>Mã minh chứng đính kèm</legend>
        {evidenceSuggestion ? (
          <p className="rounded-[var(--radius-card)] bg-[var(--color-warning-soft)] p-3 text-sm font-normal leading-6 text-[var(--color-warning)]">
            Gợi ý minh chứng: {evidenceSuggestion}
          </p>
        ) : null}
        <div className="grid max-h-64 gap-2 overflow-auto rounded-[var(--radius-card)] border border-[var(--color-border)] p-3">
          {props.evidence.length === 0 ? (
            <p className="text-sm text-[var(--color-graphite)]/70">Chưa có minh chứng trong năm học này.</p>
          ) : (
            props.evidence.map((item) => (
              <label className="surface-card flex items-start gap-2 p-3" key={item.id}>
                <input
                  checked={selectedEvidenceIds.includes(item.id)}
                  type="checkbox"
                  onChange={() => toggleEvidence(item.id)}
                />
                <span>
                  <strong className="text-[var(--color-ink-navy)]">{item.ma}</strong> {item.ten}
                </span>
              </label>
            ))
          )}
        </div>
      </fieldset>

      <button
        className="button-primary"
        disabled={saving}
      >
        {saving ? "Đang lưu..." : "Lưu tự đánh giá"}
      </button>

      <div className="grid gap-2 border-t border-[var(--color-border)] pt-4 sm:grid-cols-3">
        <button className="button-secondary" type="button" onClick={() => setPendingStatus("cho_duyet")}>
          Gửi duyệt
        </button>
        <button className="button-secondary" type="button" onClick={() => setPendingStatus("dang_ra_soat")}>
          Trả về rà soát
        </button>
        <button className="button-danger" type="button" onClick={() => setPendingStatus("da_duyet")}>
          Chốt mức
        </button>
      </div>
      <ConfirmDialog
        confirmLabel={pendingConfirm?.confirmLabel}
        description={pendingConfirm?.description ?? ""}
        isOpen={Boolean(pendingConfirm)}
        title={pendingConfirm?.title ?? ""}
        tone={pendingConfirm?.tone}
        onCancel={() => setPendingStatus(null)}
        onConfirm={confirmStatusChange}
      />
    </form>
  );
}

function WhatIfPanel(props: {
  capHocList: CapHoc[];
  criteria: Criterion[];
  currentResult: ReturnType<typeof xacDinhMucTuKetQua>;
  selectedCriterionId: string;
  selectedCriterionName: string;
  setSelectedCriterionId: (id: string) => void;
  currentCriterionLevel: 0 | 1 | 2;
  whatIfLevel: 0 | 1 | 2 | null;
  setWhatIfLevel: (level: 0 | 1 | 2 | null) => void;
  whatIfResult: ReturnType<typeof xacDinhMucTuKetQua>;
  wholeSchoolResult: ReturnType<typeof xacDinhMucToanTruongTuKetQua>;
}) {
  const hasWhatIf = props.whatIfLevel !== null;
  const criterionChanged = hasWhatIf && props.currentCriterionLevel !== props.whatIfLevel;
  const resultChanged = hasWhatIf && props.currentResult.mucDat !== props.whatIfResult.mucDat;
  const levelLabel = (level: 0 | 1 | 2) => (level === 0 ? "Chưa đạt" : `Mức ${level}`);

  return (
    <aside className="surface-card grid content-start gap-4 p-5">
      <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">What-if</h2>
      <label className="text-sm font-medium">
        Tiêu chí giả định
        <select
          className="form-control mt-2"
          value={props.selectedCriterionId}
          onChange={(event) => props.setSelectedCriterionId(event.target.value)}
        >
          {props.criteria.map((criterion) => (
            <option key={criterion.id} value={criterion.id}>
              {criterion.ma} - {criterion.ten}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium">
        Mức giả định
        <select
          className="form-control mt-2"
          value={props.whatIfLevel ?? ""}
          onChange={(event) =>
            props.setWhatIfLevel(
              event.target.value === "" ? null : (Number(event.target.value) as 0 | 1 | 2),
            )
          }
        >
          <option value="">Không giả định</option>
          <option value={0}>Chưa đạt</option>
          <option value={1}>Mức 1</option>
          <option value={2}>Mức 2</option>
        </select>
      </label>
      {hasWhatIf ? (
        <button
          className="button-secondary"
          type="button"
          onClick={() => props.setWhatIfLevel(null)}
        >
          Tắt giả định
        </button>
      ) : null}
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-lavender-mist)]/45 p-3">
        <p className="text-xs font-semibold uppercase tracking-normal text-[var(--color-graphite)]/70">
          Xem trước, không lưu
        </p>
        <p className="mt-2 text-sm font-semibold leading-5 text-[var(--color-ink-navy)]">
          {props.selectedCriterionName || "Chưa chọn tiêu chí"}
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--color-graphite)]/80">
          Tiêu chí: {hasWhatIf ? `${levelLabel(props.currentCriterionLevel)} → ${levelLabel(props.whatIfLevel ?? 0)}` : "Không giả định"}
        </p>
        <p className="text-sm leading-6 text-[var(--color-graphite)]/80">
          Kết quả cấp học: {hasWhatIf ? `${props.currentResult.mucDat} → ${props.whatIfResult.mucDat}` : props.currentResult.mucDat}
        </p>
        <p className="mt-2 text-sm font-medium text-[var(--color-ink-navy)]">
          {!hasWhatIf
            ? "Chọn một mức để xem thử tác động, hoặc giữ Không giả định để xem dữ liệu thật."
            : criterionChanged
            ? resultChanged
              ? "Giả định này làm thay đổi mức đánh giá."
              : "Tiêu chí đã đổi, nhưng mức chung chưa thay đổi."
            : "Chọn một mức khác để xem tác động."}
        </p>
      </div>
      <div className="surface-card p-3">
        <p className="text-sm text-[var(--color-graphite)]/70">Cấp học đang xem</p>
        <p className="mt-1 font-semibold text-[var(--color-ink-navy)]">{props.whatIfResult.mucDat}</p>
      </div>
      <div className="surface-card p-3">
        <p className="text-sm text-[var(--color-graphite)]/70">Toàn trường</p>
        <p className="mt-1 font-semibold text-[var(--color-ink-navy)]">{props.wholeSchoolResult.mucDat}</p>
        <p className="mt-2 text-xs leading-5 text-[var(--color-graphite)]/70">{props.wholeSchoolResult.lyDo}</p>
      </div>
    </aside>
  );
}

function Message({ text }: { text: string }) {
  return (
    <Alert tone={text.includes("Đã ") ? "success" : "warning"}>{text}</Alert>
  );
}
