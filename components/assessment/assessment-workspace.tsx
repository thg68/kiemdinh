"use client";

import { toUserMessage } from "@/lib/errors/user-message";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import {
  CapHoc,
  KetQuaTieuChi,
  MucHieuLuc,
  kiemTraRangBuocCapNhat,
  mucHopLe,
  xacDinhMucToanTruongTuKetQua,
  xacDinhMucToanTruongVoiGiaDinh,
  xacDinhMucTuKetQua,
  xacDinhMucVoiGiaDinh,
} from "@/lib/assessment/level-engine";
import {
  deXuatPhuongAnToiThieu,
  MucMucTieu,
  taoBanDoMucGiaDinh,
  ThayDoiGiaDinh,
} from "@/lib/assessment/simulation";
import { docDuLieuTinhMuc } from "@/lib/assessment/service";
import { hasCapability } from "@/lib/auth/capabilities";
import { Alert } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { InternalContentAssessment } from "@/components/assessment/internal-content-assessment";
import { evaluateEvidenceEligibility } from "@/lib/assessment/evidence-eligibility";

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
  ngay_ket_thuc: string;
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
  revision: number;
};

type EvidenceOption = {
  eligible: boolean;
  id: string;
  ma: string;
  reason: string | null;
  ten: string;
  tuDanhGiaIds: string[];
};

type EvidenceRow = {
  id: string;
  la_du_lieu_demo: boolean;
  ma: string;
  ngay_het_gia_tri: string | null;
  ten: string;
  trang_thai_xac_minh: string;
};

type AssessmentEvidenceLink = {
  minh_chung_id: string;
  tu_danh_gia_id: string;
};

function mapEvidenceOptions(
  evidence: EvidenceRow[],
  links: AssessmentEvidenceLink[],
  schoolYearEnd: string,
) {
  return evidence.map<EvidenceOption>((item) => ({
    ...item,
    ...evaluateEvidenceEligibility(item, schoolYearEnd),
    tuDanhGiaIds: links
      .filter((link) => link.minh_chung_id === item.id)
      .map((link) => link.tu_danh_gia_id),
  }));
}

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
        .filter((item) => item.eligible && row && item.tuDanhGiaIds.includes(row.id))
        .map((item) => item.ma),
    };
  });
}

export function AssessmentWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
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
  const [ketQuaTheoCapHoc, setKetQuaTheoCapHoc] = useState<Map<CapHoc, KetQuaTieuChi[]>>(new Map());
  const [selectedCapHoc, setSelectedCapHoc] = useState<CapHoc>("mam_non");
  const [selectedCriterionId, setSelectedCriterionId] = useState("");
  const [roleCodes, setRoleCodes] = useState<string[]>([]);
  const [simulationOpen, setSimulationOpen] = useState(false);
  const [simulationTarget, setSimulationTarget] = useState<MucMucTieu>(1);
  const [simulationChanges, setSimulationChanges] = useState<ThayDoiGiaDinh[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAssessment, setLoadingAssessment] = useState(false);
  const [message, setMessage] = useState("");
  const assessmentRequestGeneration = useRef(0);

  const activeYear = years.find((year) => year.trang_thai === "dang_hoat_dong") ?? years[0];
  const capHocList = useMemo(
    () => (school?.cap_hoc?.length ? school.cap_hoc : [selectedCapHoc]),
    [school, selectedCapHoc],
  );
  const ketQuaTieuChi = toKetQuaTieuChi(criteria, assessments, evidence);
  const giaiTrinh = xacDinhMucTuKetQua(ketQuaTieuChi);
  const selectedCriterion =
    criteria.find((criterion) => criterion.id === selectedCriterionId) ?? criteria[0];
  const canSimulate = hasCapability(roleCodes, "action.assessment.simulate");
  const simulatedLevels = taoBanDoMucGiaDinh(simulationChanges);
  const simulationResult = xacDinhMucVoiGiaDinh(ketQuaTieuChi, simulatedLevels);
  const capResults = capHocList.map((capHoc) => ({
    capHoc,
    ketQuaTieuChi: capHoc === selectedCapHoc
      ? ketQuaTieuChi
      : ketQuaTheoCapHoc.get(capHoc) ?? [],
  }));
  const wholeSchoolResult = xacDinhMucToanTruongTuKetQua(capResults);
  const simulatedWholeSchoolResult = xacDinhMucToanTruongVoiGiaDinh(
    capResults,
    selectedCapHoc,
    simulatedLevels,
  );

  const changeSimulationTarget = useCallback((target: MucMucTieu) => {
    setSimulationTarget(target);
    setSimulationChanges(deXuatPhuongAnToiThieu(ketQuaTieuChi, target));
  }, [ketQuaTieuChi]);

  const openSimulation = useCallback(() => {
    const target: MucMucTieu = giaiTrinh.mucDat === "Không đạt Mức 1" ? 1 : 2;
    setSimulationTarget(target);
    setSimulationChanges(deXuatPhuongAnToiThieu(ketQuaTieuChi, target));
    setSimulationOpen(true);
  }, [giaiTrinh.mucDat, ketQuaTieuChi]);

  const closeSimulation = useCallback(() => {
    setSimulationOpen(false);
    setSimulationChanges([]);
  }, []);

  const syncScopeUrl = useCallback((capHoc: CapHoc, criterionId: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set("cap_hoc", capHoc);
    if (criterionId) params.set("tieu_chi_id", criterionId);
    window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
  }, [pathname]);

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

    const [
      { data: profileData, error: profileError },
      { data: roleData, error: roleError },
    ] = await Promise.all([
      supabase
        .from("nguoi_dung")
        .select("id, co_so_id, ho_ten")
        .eq("auth_user_id", userData.user.id)
        .maybeSingle(),
      supabase.rpc("fn_user_role_labels"),
    ]);

    if (profileError || roleError || !profileData) {
      setMessage(toUserMessage(profileError ?? roleError, "Bạn cần thiết lập cơ sở giáo dục và quyền truy cập trước."));
      setLoading(false);
      return;
    }

    setProfile(profileData as Profile);
    setRoleCodes(((roleData ?? []) as Array<{ ma: string }>).map((role) => role.ma));

    const [{ data: schoolData }, { data: yearData }] =
      await Promise.all([
        supabase
          .from("co_so_giao_duc")
          .select("id, ten, loai_hinh, cap_hoc")
          .eq("id", profileData.co_so_id)
          .maybeSingle(),
        supabase
          .from("nam_hoc")
          .select("id, ten, trang_thai, ngay_ket_thuc")
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
      setMessage(toUserMessage(criterionError, "Không tải được danh sách tiêu chí. Vui lòng thử lại."));
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

    const locationParams = new URLSearchParams(window.location.search);
    const requestedCapHoc = locationParams.get("cap_hoc") as CapHoc | null;
    const nextCapHoc = requestedCapHoc && loadedSchool?.cap_hoc.includes(requestedCapHoc)
      ? requestedCapHoc
      : loadedSchool?.cap_hoc?.[0] ?? "mam_non";
    const requestedCriterionId = locationParams.get("tieu_chi_id");
    const nextCriterionId = requestedCriterionId
      && loadedCriteria.some((criterion) => criterion.id === requestedCriterionId)
      ? requestedCriterionId
      : loadedCriteria[0]?.id ?? "";

    setSchool(loadedSchool);
    setYears(loadedYears);
    setCriteria(loadedCriteria);
    setSelectedCriterionId(nextCriterionId);
    setSelectedCapHoc(nextCapHoc);
    syncScopeUrl(nextCapHoc, nextCriterionId);

    setLoading(false);
  }, [router, supabase, syncScopeUrl]);

  const loadAssessmentData = useCallback(async () => {
    if (!supabase || !profile || !activeYear) {
      return;
    }

    const requestGeneration = ++assessmentRequestGeneration.current;
    setLoadingAssessment(true);
    setAssessments([]);
    setEvidence([]);
    setKetQuaTheoCapHoc(new Map());

    const [{ data: assessmentData, error: assessmentError }, { data: evidenceData, error: evidenceError }] =
      await Promise.all([
        supabase
          .from("tu_danh_gia")
          .select("id, tieu_chi_id, mo_ta_muc_1, dat_muc_1, mo_ta_muc_2, dat_muc_2, muc_dat, trang_thai, revision")
          .eq("co_so_id", profile.co_so_id)
          .eq("nam_hoc_id", activeYear.id)
          .eq("cap_hoc", selectedCapHoc),
        supabase
          .from("minh_chung")
          .select("id, ma, ten, trang_thai_xac_minh, ngay_het_gia_tri, la_du_lieu_demo")
          .eq("co_so_id", profile.co_so_id)
          .eq("nam_hoc_id", activeYear.id)
          .is("deleted_at", null)
          .order("ma", { ascending: true }),
      ]);

    if (requestGeneration !== assessmentRequestGeneration.current) return;

    if (assessmentError || evidenceError) {
      setMessage(toUserMessage(assessmentError ?? evidenceError, "Không tải được dữ liệu tự đánh giá. Vui lòng thử lại."));
      setLoadingAssessment(false);
      return;
    }

    const loadedAssessments = (assessmentData ?? []) as AssessmentRow[];
    setAssessments(loadedAssessments);
    const assessmentIds = loadedAssessments.map((item) => item.id);
    const { data: linkData, error: linkError } = assessmentIds.length
      ? await supabase
          .from("tu_danh_gia_minh_chung")
          .select("minh_chung_id, tu_danh_gia_id")
          .in("tu_danh_gia_id", assessmentIds)
      : { data: [], error: null };

    if (requestGeneration !== assessmentRequestGeneration.current) return;

    if (linkError) {
      setMessage(toUserMessage(linkError, "Không tải được liên kết minh chứng. Vui lòng thử lại."));
      setLoadingAssessment(false);
      return;
    }

    setEvidence(mapEvidenceOptions(
      (evidenceData ?? []) as EvidenceRow[],
      (linkData ?? []) as AssessmentEvidenceLink[],
      activeYear.ngay_ket_thuc,
    ));

    try {
      const allCapResults = await Promise.all(
        capHocList.map(async (capHoc) => ({
          capHoc,
          ...(await docDuLieuTinhMuc(supabase, profile.co_so_id, activeYear.id, capHoc)),
        })),
      );
      if (requestGeneration !== assessmentRequestGeneration.current) return;
      setKetQuaTheoCapHoc(new Map(allCapResults.map((item) => [item.capHoc, item.ketQuaTieuChi])));
    } catch (error) {
      if (requestGeneration !== assessmentRequestGeneration.current) return;
      setKetQuaTheoCapHoc(new Map());
      setMessage(toUserMessage(error, "Không tải được kết quả của tất cả cấp học. Vui lòng thử lại."));
    }
    if (requestGeneration === assessmentRequestGeneration.current) setLoadingAssessment(false);
  }, [activeYear, capHocList, profile, selectedCapHoc, supabase]);

  const refreshEvidence = useCallback(async () => {
    if (!supabase || !profile || !activeYear) return;

    const assessmentIds = assessments.map((item) => item.id);
    const [{ data: evidenceData, error: evidenceError }, { data: linkData, error: linkError }] =
      await Promise.all([
        supabase
          .from("minh_chung")
          .select("id, ma, ten, trang_thai_xac_minh, ngay_het_gia_tri, la_du_lieu_demo")
          .eq("co_so_id", profile.co_so_id)
          .eq("nam_hoc_id", activeYear.id)
          .is("deleted_at", null)
          .order("ma", { ascending: true }),
        assessmentIds.length
          ? supabase
              .from("tu_danh_gia_minh_chung")
              .select("minh_chung_id, tu_danh_gia_id")
              .in("tu_danh_gia_id", assessmentIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

    if (evidenceError || linkError) {
      setMessage(toUserMessage(evidenceError ?? linkError, "Không tải lại được kho minh chứng. Vui lòng thử lại."));
      return;
    }

    setEvidence(mapEvidenceOptions(
      (evidenceData ?? []) as EvidenceRow[],
      (linkData ?? []) as AssessmentEvidenceLink[],
      activeYear.ngay_ket_thuc,
    ));
    setMessage("Đã tải lại kho minh chứng.");
  }, [activeYear, assessments, profile, supabase]);

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

    return () => {
      window.clearTimeout(timer);
      assessmentRequestGeneration.current += 1;
    };
  }, [loadAssessmentData]);

  if (loading) {
    return <LoadingState label="Đang tải tự đánh giá…" />;
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
            onChange={(event) => {
              const nextCapHoc = event.target.value as CapHoc;
              setSimulationOpen(false);
              setSimulationChanges([]);
              setSelectedCapHoc(nextCapHoc);
              syncScopeUrl(nextCapHoc, selectedCriterion?.id ?? "");
            }}
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

      {loadingAssessment ? (
        <LoadingState label={`Đang tải tự đánh giá cấp ${capHocLabels[selectedCapHoc] ?? selectedCapHoc}…`} />
      ) : (
      <>
      <GapBoard
        ketQuaTieuChi={ketQuaTieuChi}
        selectedCriterionId={selectedCriterion?.id ?? ""}
        canSimulate={canSimulate}
        simulatedLevels={simulationOpen ? simulatedLevels : undefined}
        onSelect={(id) => {
          setSelectedCriterionId(id);
          syncScopeUrl(selectedCapHoc, id);
        }}
        onOpenSimulation={openSimulation}
      />

      <section>
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
            onRefreshEvidence={refreshEvidence}
          />
        ) : (
          <p className="surface-card surface-card-pad text-sm text-[var(--color-graphite)]/70">
            Chưa có tiêu chí trong bộ tiêu chuẩn.
          </p>
        )}
      </section>

      <SimulationDrawer
        capHocLabel={capHocLabels[selectedCapHoc] ?? selectedCapHoc}
        changes={simulationChanges}
        currentResult={giaiTrinh}
        currentWholeSchoolResult={wholeSchoolResult}
        items={ketQuaTieuChi}
        open={simulationOpen}
        projectedResult={simulationResult}
        projectedWholeSchoolResult={simulatedWholeSchoolResult}
        target={simulationTarget}
        onChanges={setSimulationChanges}
        onClose={closeSimulation}
        onOpenCriterion={(id) => {
          setSelectedCriterionId(id);
          setSimulationOpen(false);
          syncScopeUrl(selectedCapHoc, id);
          document.getElementById("criterion-assessment")?.scrollIntoView({ behavior: "smooth" });
        }}
        onTarget={changeSimulationTarget}
      />
      </>
      )}
    </div>
  );
}

function GapBoard(props: {
  ketQuaTieuChi: KetQuaTieuChi[];
  selectedCriterionId: string;
  canSimulate: boolean;
  simulatedLevels?: ReadonlyMap<string, MucHieuLuc>;
  onSelect: (id: string) => void;
  onOpenSimulation: () => void;
}) {
  return (
    <section className="surface-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">Gap Board</h2>
          <p className="mt-1 text-sm text-[var(--color-graphite)]/70">Chọn một tiêu chí để cập nhật hoặc mô phỏng lộ trình nâng mức.</p>
        </div>
        {props.canSimulate ? (
          <button className="button-secondary" type="button" onClick={props.onOpenSimulation}>
            Mô phỏng phương án
          </button>
        ) : null}
      </div>
      <div className="grid auto-rows-fr gap-2.5 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {props.ketQuaTieuChi.map((item) => {
          const isSimulated = props.simulatedLevels?.has(item.ma) ?? false;
          const displayLevel = props.simulatedLevels?.get(item.ma) ?? mucHopLe(item);
          const rangBuoc = isSimulated ? null : kiemTraRangBuocCapNhat(item);
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
                  {isSimulated ? (
                    <span className="rounded-full bg-[var(--color-electric-cobalt)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-normal text-white">
                      Mô phỏng
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
                  {isSimulated ? "Giả định đủ điều kiện" : !rangBuoc?.hopLe ? rangBuoc?.loi[0] : ""}
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
  onRefreshEvidence: () => Promise<void>;
}) {
  return (
    <InternalContentAssessment
      activeYearId={props.activeYearId}
      criterion={props.criterion}
      evidence={props.evidence}
      row={props.row}
      selectedCapHoc={props.selectedCapHoc}
      supabase={props.supabase}
      onDone={props.onDone}
      onRefreshEvidence={props.onRefreshEvidence}
    />
  );
}

export function LegacyCriterionAssessmentForm(props: {
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
  const [pendingStatus, setPendingStatus] = useState<"cho_duyet" | null>(null);
  const statusConfirm = {
    cho_duyet: {
      confirmLabel: "Gửi duyệt",
      description: "Tiêu chí sẽ chuyển sang hàng đợi để người có thẩm quyền xem xét. Bạn vẫn nên lưu nội dung tự đánh giá trước khi gửi.",
      title: "Gửi tiêu chí này sang chờ duyệt?",
      tone: "primary" as const,
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
          .filter((item) => props.row && item.tuDanhGiaIds.includes(props.row.id))
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

    // CSDL gắn/gỡ minh chứng, lưu tự đánh giá và audit trong cùng một transaction.
    const { error } = await props.supabase.rpc("fn_luu_tu_danh_gia_atomic", {
      p_nam_hoc_id: props.activeYearId,
      p_cap_hoc: props.selectedCapHoc,
      p_tieu_chi_id: props.criterion.id,
      p_mo_ta_muc_1: moTaMuc1,
      p_mo_ta_muc_2: moTaMuc2,
      p_muc_dat: mucDat,
      p_minh_chung_ids: selectedEvidenceIds,
    });

    setSaving(false);
    await props.onDone(error ? toUserMessage(error) : "Đã lưu tự đánh giá cho tiêu chí.");
  }

  async function updateStatus(status: "cho_duyet") {
    if (!props.supabase) {
      await props.onDone("Chưa cấu hình Supabase.");
      return;
    }

    if (!props.row) {
      await props.onDone("Hãy lưu nội dung tự đánh giá trước khi gửi duyệt.");
      return;
    }

    const { error } = await props.supabase.rpc("fn_cap_nhat_trang_thai_tu_danh_gia", {
      p_nam_hoc_id: props.activeYearId,
      p_cap_hoc: props.selectedCapHoc,
      p_tieu_chi_id: props.criterion.id,
      p_trang_thai: status,
      p_expected_revision: props.row.revision,
    });

    await props.onDone(
      error
        ? toUserMessage(error)
        : "Đã gửi tiêu chí sang trạng thái chờ duyệt.",
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
    <form id="criterion-assessment" className="surface-card grid gap-4 p-5" onSubmit={handleSubmit}>
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
        disabled={saving || props.row?.trang_thai === "cho_duyet" || props.row?.trang_thai === "da_duyet"}
      >
        {saving ? "Đang lưu…" : "Lưu tự đánh giá"}
      </button>

      {props.row && ["nhap", "dang_ra_soat", "ke_thua_cho_cap_nhat"].includes(props.row.trang_thai) ? (
        <div className="border-t border-[var(--color-border)] pt-4">
          <button className="button-secondary" type="button" onClick={() => setPendingStatus("cho_duyet")}>
            Gửi duyệt
          </button>
        </div>
      ) : null}
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

function SimulationDrawer(props: {
  capHocLabel: string;
  changes: ThayDoiGiaDinh[];
  currentResult: ReturnType<typeof xacDinhMucTuKetQua>;
  currentWholeSchoolResult: ReturnType<typeof xacDinhMucToanTruongTuKetQua>;
  items: KetQuaTieuChi[];
  open: boolean;
  projectedResult: ReturnType<typeof xacDinhMucTuKetQua>;
  projectedWholeSchoolResult: ReturnType<typeof xacDinhMucToanTruongTuKetQua>;
  target: MucMucTieu;
  onChanges: (changes: ThayDoiGiaDinh[]) => void;
  onClose: () => void;
  onOpenCriterion: (id: string) => void;
  onTarget: (target: MucMucTieu) => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const { onClose, open } = props;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !drawerRef.current) return;

      const focusable = [...drawerRef.current.querySelectorAll<HTMLElement>(
        "button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href]",
      )].filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!props.open) return null;

  const changesByCode = new Map(props.changes.map((change) => [change.ma, change.muc]));
  const candidates = props.items.filter((item) => mucHopLe(item) < props.target);
  const firstChanged = props.changes.length
    ? props.items.find((item) => item.ma === props.changes[0].ma)
    : undefined;

  function toggleCriterion(item: KetQuaTieuChi) {
    const exists = changesByCode.has(item.ma);
    props.onChanges(exists
      ? props.changes.filter((change) => change.ma !== item.ma)
      : [...props.changes, { ma: item.ma, muc: props.target }]);
  }

  function updateLevel(ma: string, muc: MucMucTieu) {
    props.onChanges(props.changes.map((change) => change.ma === ma ? { ...change, muc } : change));
  }

  return (
    <div className="simulation-drawer-backdrop" role="presentation" onMouseDown={props.onClose}>
      <aside
        ref={drawerRef}
        aria-describedby="simulation-description"
        aria-labelledby="simulation-title"
        aria-modal="true"
        className="simulation-drawer"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[var(--color-border)] bg-white px-5 py-4 sm:px-6">
          <div>
            <p className="text-sm font-medium text-[var(--color-electric-cobalt)]">{props.capHocLabel}</p>
            <h2 id="simulation-title" className="mt-1 text-xl font-semibold text-[var(--color-ink-navy)]">
              Mô phỏng lộ trình nâng mức
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            aria-label="Đóng mô phỏng"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-[var(--color-border)] text-2xl leading-none text-[var(--color-ink-navy)] hover:border-[var(--color-electric-cobalt)]"
            type="button"
            onClick={props.onClose}
          >
            ×
          </button>
        </header>

        <div className="grid gap-0">
          <section className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
            <p id="simulation-description" className="text-sm leading-6 text-[var(--color-graphite)]/75">
              Chọn các tiêu chí dự kiến hoàn thiện để xem mức có thể đạt. Mô phỏng giả sử tiêu chí đã đủ mô tả và minh chứng, hoàn toàn không lưu dữ liệu.
            </p>
            <div className="mt-4 grid grid-cols-2 rounded-[var(--radius-card)] bg-[var(--color-lavender-mist)] p-1" aria-label="Mức mục tiêu">
              {([1, 2] as const).map((target) => (
                <button
                  aria-pressed={props.target === target}
                  className={`rounded-[calc(var(--radius-card)-2px)] px-3 py-2 text-sm font-semibold ${
                    props.target === target ? "bg-white text-[var(--color-ink-navy)] shadow-sm" : "text-[var(--color-graphite)]/70"
                  }`}
                  key={target}
                  type="button"
                  onClick={() => props.onTarget(target)}
                >
                  Mục tiêu Mức {target}
                </button>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-2 border-b border-[var(--color-border)] bg-[var(--color-lavender-mist)]/35 sm:grid-cols-3">
            <SimulationMetric label="Hiện tại" value={props.currentResult.mucDat} />
            <SimulationMetric label="Sau mô phỏng" value={props.projectedResult.mucDat} emphasized />
            <SimulationMetric
              label="Toàn trường"
              value={`${props.currentWholeSchoolResult.mucDat} → ${props.projectedWholeSchoolResult.mucDat}`}
              className="col-span-2 sm:col-span-1"
            />
          </section>

          <section className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="font-semibold text-[var(--color-ink-navy)]">Phương án đang thử</h3>
                <p className="mt-1 text-sm text-[var(--color-graphite)]/70">
                  {props.changes.length} tiêu chí được chọn trong {candidates.length} tiêu chí chưa đạt mục tiêu.
                </p>
              </div>
              <button
                className="text-sm font-semibold text-[var(--color-electric-cobalt)] disabled:cursor-not-allowed disabled:opacity-45"
                disabled={props.changes.length === 0}
                type="button"
                onClick={() => props.onChanges([])}
              >
                Bỏ chọn tất cả
              </button>
            </div>

            <div className="mt-4 grid gap-2">
              {candidates.length ? candidates.map((item) => {
                const selectedLevel = changesByCode.get(item.ma);
                const currentLevel = mucHopLe(item);
                return (
                  <div className="grid gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] p-3 sm:grid-cols-[1fr_auto] sm:items-center" key={item.ma}>
                    <label className="flex min-w-0 cursor-pointer items-start gap-3">
                      <input
                        checked={selectedLevel !== undefined}
                        className="mt-1 size-4 shrink-0 accent-[var(--color-electric-cobalt)]"
                        type="checkbox"
                        onChange={() => toggleCriterion(item)}
                      />
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <strong className="tabular-nums text-[var(--color-ink-navy)]">{item.ma}</strong>
                          {item.laBatBuoc ? <StatusBadge tone="warning">Bắt buộc</StatusBadge> : null}
                        </span>
                        <span className="mt-1 block text-sm leading-5 text-[var(--color-graphite)]">{item.ten}</span>
                        <span className="mt-1 block text-xs text-[var(--color-graphite)]/65">
                          Hiện tại: {currentLevel === 0 ? "Chưa đạt" : `Mức ${currentLevel}`}
                        </span>
                      </span>
                    </label>

                    {selectedLevel !== undefined && props.target === 2 ? (
                      <select
                        aria-label={`Mức mô phỏng cho tiêu chí ${item.ma}`}
                        className="form-control min-w-28 py-2 text-sm"
                        value={selectedLevel}
                        onChange={(event) => updateLevel(item.ma, Number(event.target.value) as MucMucTieu)}
                      >
                        <option value={1}>Mức 1</option>
                        <option value={2}>Mức 2</option>
                      </select>
                    ) : null}
                  </div>
                );
              }) : (
                <p className="rounded-[var(--radius-card)] border border-[var(--color-success)] bg-[var(--color-success-soft)] p-4 text-sm text-[var(--color-success)]">
                  Cấp học này đã đạt mục tiêu Mức {props.target}.
                </p>
              )}
            </div>
          </section>

          <section className="px-5 py-5 sm:px-6">
            <h3 className="font-semibold text-[var(--color-ink-navy)]">Kết luận mô phỏng</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--color-graphite)]/75">{props.projectedResult.lyDo}</p>
            <p className="mt-2 text-sm font-medium leading-6 text-[var(--color-ink-navy)]">{props.projectedResult.khoangCach}</p>
            {props.projectedResult.chanLenMucTiepTheo.length ? (
              <ul className="mt-3 grid gap-1.5 text-sm text-[var(--color-graphite)]/75">
                {props.projectedResult.chanLenMucTiepTheo.slice(0, 6).map((blocker) => (
                  <li key={blocker}>• {blocker}</li>
                ))}
              </ul>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              {firstChanged?.id ? (
                <button className="button-primary" type="button" onClick={() => props.onOpenCriterion(firstChanged.id!)}>
                  Mở tiêu chí đầu tiên
                </button>
              ) : null}
              <Link className="button-secondary" href="/ke-hoach-cai-tien">
                Mở kế hoạch cải tiến
              </Link>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}

function SimulationMetric(props: {
  className?: string;
  emphasized?: boolean;
  label: string;
  value: string;
}) {
  return (
    <div className={`border-r border-[var(--color-border)] px-4 py-4 last:border-r-0 ${props.className ?? ""}`}>
      <p className="text-xs font-medium text-[var(--color-graphite)]/65">{props.label}</p>
      <p className={`mt-1 text-sm font-semibold leading-5 ${props.emphasized ? "text-[var(--color-electric-cobalt)]" : "text-[var(--color-ink-navy)]"}`}>
        {props.value}
      </p>
    </div>
  );
}

function Message({ text }: { text: string }) {
  return (
    <Alert tone={text.includes("Đã ") ? "success" : "warning"}>{text}</Alert>
  );
}
