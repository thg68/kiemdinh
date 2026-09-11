"use client";

import { toUserMessage } from "@/lib/errors/user-message";
import Link from "next/link";
import { FormEvent, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Archive,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  ListChecks,
  LoaderCircle,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { DEFAULT_PAGE_SIZE, Pagination } from "@/components/ui/pagination";
import { useAppContext } from "@/components/shared/use-app-context";
import { useScopedRequest } from "@/components/shared/use-scoped-request";
import { CapHoc } from "@/lib/assessment/level-engine";

type Standard = {
  id: string;
  so_thu_tu: number;
  ten: string;
};

type Criterion = {
  id: string;
  ma: string;
  ten: string;
  tieu_chuan_id: string;
  la_bat_buoc: boolean;
};

type User = {
  id: string;
  ho_ten: string | null;
  email: string | null;
};

type PlanStatus = "chua_thuc_hien" | "dang_thuc_hien" | "hoan_thanh" | "cham_tien_do" | "khong_thuc_hien";

type Plan = {
  id: string;
  tieu_chuan_id: string | null;
  tieu_chi_id: string | null;
  noi_dung: string | null;
  muc_tieu: string | null;
  hoat_dong: string | null;
  chi_so_ket_qua: string | null;
  thoi_gian_bat_dau: string | null;
  thoi_gian_ket_thuc: string | null;
  phu_trach_id: string | null;
  nguon_luc: string | null;
  minh_chung_du_kien: string | null;
  muc_do_thuc_hien: PlanStatus;
  archived_at: string | null;
  tieu_chuan?: Standard | Standard[] | null;
  tieu_chi?: Criterion | Criterion[] | null;
  phu_trach?: User | User[] | null;
};

type ReportSections = {
  can_cu_xay_dung: string;
  muc_dich_yeu_cau: string;
  tom_tat_van_de_trong_tam: string;
  theo_doi_danh_gia: string;
  to_chuc_thuc_hien: string;
  co_che_danh_gia_bao_cao: string;
};

type ImprovementView = "content" | "tasks" | "review";

type ReportReadiness = {
  ready: boolean;
  missing_criteria: string[];
  missing_descriptions: string[];
  missing_evidence: string[];
  unverified_evidence: string[];
  missing_council: boolean;
  other_blockers: string[];
};

type PlanSummaryRow = {
  muc_do_thuc_hien: PlanStatus;
  thoi_gian_ket_thuc: string | null;
};

const emptyReportSections: ReportSections = {
  can_cu_xay_dung: "",
  muc_dich_yeu_cau: "",
  tom_tat_van_de_trong_tam: "",
  theo_doi_danh_gia: "",
  to_chuc_thuc_hien: "",
  co_che_danh_gia_bao_cao: "",
};

const capHocLabels: Record<CapHoc, string> = {
  mam_non: "Mầm non",
  tieu_hoc: "Tiểu học",
  thcs: "THCS",
  thpt: "THPT",
  gdtx: "GDTX",
  khac: "Khác",
};

const statusLabels: Record<PlanStatus, string> = {
  chua_thuc_hien: "Chưa thực hiện",
  dang_thuc_hien: "Đang thực hiện",
  hoan_thanh: "Hoàn thành",
  cham_tien_do: "Chậm tiến độ",
  khong_thuc_hien: "Không thực hiện",
};

const viewLabels: Record<ImprovementView, string> = {
  content: "Nội dung Mẫu 2",
  tasks: "Nhiệm vụ cải tiến",
  review: "Rà soát và xuất",
};

const reportSectionFields: Array<{
  description: string;
  key: keyof ReportSections;
  label: string;
}> = [
  { key: "can_cu_xay_dung", label: "2. Căn cứ xây dựng", description: "Văn bản, kết quả tự đánh giá và nhu cầu thực tế làm căn cứ cho kế hoạch." },
  { key: "muc_dich_yeu_cau", label: "3. Mục đích, yêu cầu", description: "Kết quả nhà trường cần đạt được khi triển khai kế hoạch." },
  { key: "tom_tat_van_de_trong_tam", label: "4. Vấn đề trọng tâm cần cải tiến", description: "Những hạn chế cần ưu tiên xử lý trong năm học." },
  { key: "theo_doi_danh_gia", label: "6. Theo dõi và đánh giá thực hiện", description: "Cách đo lường tiến độ và xác nhận kết quả thực hiện." },
  { key: "to_chuc_thuc_hien", label: "7. Tổ chức thực hiện", description: "Cách phân công, phối hợp và điều hành kế hoạch." },
  { key: "co_che_danh_gia_bao_cao", label: "8. Cơ chế đánh giá và báo cáo", description: "Chu kỳ báo cáo, người xem xét và cách xử lý điều chỉnh." },
];

function first<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function toneForStatus(status: PlanStatus) {
  if (status === "hoan_thanh") {
    return "success" as const;
  }

  if (status === "cham_tien_do" || status === "khong_thuc_hien") {
    return "danger" as const;
  }

  if (status === "dang_thuc_hien") {
    return "warning" as const;
  }

  return "default" as const;
}

function formatDate(value: string | null) {
  if (!value) return "Chưa đặt";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN").format(date);
}

function isPlanOverdue(plan: PlanSummaryRow) {
  if (!plan.thoi_gian_ket_thuc || ["hoan_thanh", "khong_thuc_hien"].includes(plan.muc_do_thuc_hien)) {
    return false;
  }

  return plan.thoi_gian_ket_thuc < new Date().toISOString().slice(0, 10);
}

export function ImprovementPlanWorkspace() {
  const { activeYear, loading, message, profile, school, setMessage, supabase, years } = useAppContext();
  const [selectedYearId, setSelectedYearId] = useState("");
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planCount, setPlanCount] = useState(0);
  const [planSummary, setPlanSummary] = useState<PlanSummaryRow[]>([]);
  const [page, setPage] = useState(1);
  const [activeView, setActiveView] = useState<ImprovementView>("tasks");
  const [pendingView, setPendingView] = useState<ImprovementView | null>(null);
  const [openEditorAfterNavigation, setOpenEditorAfterNavigation] = useState(false);
  const [isPlanEditorOpen, setIsPlanEditorOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [criterionFilter, setCriterionFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [selectedCriterionId, setSelectedCriterionId] = useState("");
  const [noiDung, setNoiDung] = useState("");
  const [mucTieu, setMucTieu] = useState("");
  const [hoatDong, setHoatDong] = useState("");
  const [chiSoKetQua, setChiSoKetQua] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [phuTrachId, setPhuTrachId] = useState("");
  const [nguonLuc, setNguonLuc] = useState("");
  const [minhChungDuKien, setMinhChungDuKien] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [reportSections, setReportSections] = useState<ReportSections>(emptyReportSections);
  const [savedReportSections, setSavedReportSections] = useState<ReportSections>(emptyReportSections);
  const [reportReadiness, setReportReadiness] = useState<ReportReadiness | null>(null);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [savingSections, setSavingSections] = useState(false);
  const [selectedReportCapHoc, setSelectedReportCapHoc] = useState<CapHoc>("mam_non");
  const [editingPlanId, setEditingPlanId] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [updatingPlanId, setUpdatingPlanId] = useState("");

  const effectiveYearId = selectedYearId || activeYear?.id || "";
  const schoolCapHoc = (school?.cap_hoc ?? []) as CapHoc[];
  const reportCapHoc = schoolCapHoc.includes(selectedReportCapHoc)
    ? selectedReportCapHoc
    : schoolCapHoc[0] ?? "mam_non";
  const yearRequest = useScopedRequest(`${profile?.co_so_id ?? ""}:${effectiveYearId}`);
  const reportSectionRequest = useScopedRequest(`${profile?.co_so_id ?? ""}:${effectiveYearId}:${reportCapHoc}`);
  const filledReportSectionCount = reportSectionFields.filter(
    (field) => reportSections[field.key].trim().length > 0,
  ).length;
  const reportSectionsDirty = useMemo(
    () => JSON.stringify(reportSections) !== JSON.stringify(savedReportSections),
    [reportSections, savedReportSections],
  );
  const activePlanTotal = planSummary.length;
  const inProgressCount = planSummary.filter((plan) => plan.muc_do_thuc_hien === "dang_thuc_hien").length;
  const completedCount = planSummary.filter((plan) => plan.muc_do_thuc_hien === "hoan_thanh").length;
  const overdueCount = planSummary.filter(isPlanOverdue).length;

  const loadReferenceData = useCallback(async () => {
    if (!supabase || !profile || !effectiveYearId) {
      return;
    }

    setLoadingData(true);
    setMessage("");
    setCriteria([]);
    setUsers([]);
    setSelectedCriterionId("");
    const request = yearRequest.begin("reference");

    const [{ data: criterionData, error: criterionError }, { data: userData, error: userError }] =
      await Promise.all([
        supabase
          .from("v_tieu_chi_nam_hoc")
          .select("id, ma, ten, tieu_chuan_id, la_bat_buoc")
          .eq("co_so_id", profile.co_so_id)
          .eq("nam_hoc_id", effectiveYearId)
          .order("ma", { ascending: true }),
        supabase
          .from("nguoi_dung")
          .select("id, ho_ten, email")
          .eq("co_so_id", profile.co_so_id)
          .eq("trang_thai", "active")
          .order("ho_ten", { ascending: true }),
      ]);

    if (!yearRequest.isCurrent(request)) return;

    if (criterionError || userError) {
      setMessage(toUserMessage(criterionError ?? userError, "Không tải được dữ liệu tham chiếu. Vui lòng thử lại."));
      setLoadingData(false);
      return;
    }

    setCriteria((criterionData ?? []) as Criterion[]);
    setUsers((userData ?? []) as User[]);
    setSelectedCriterionId(((criterionData ?? []) as Criterion[])[0]?.id || "");
    setLoadingData(false);
  }, [effectiveYearId, profile, setMessage, supabase, yearRequest]);

  const loadPlans = useCallback(async () => {
    if (!supabase || !profile || !effectiveYearId) {
      return;
    }

    setPlans([]);
    setPlanCount(0);
    const request = yearRequest.begin("plans");

    let query = supabase
      .from("ke_hoach_cai_tien")
      .select(
        "id, tieu_chuan_id, tieu_chi_id, noi_dung, muc_tieu, hoat_dong, chi_so_ket_qua, thoi_gian_bat_dau, thoi_gian_ket_thuc, phu_trach_id, nguon_luc, minh_chung_du_kien, muc_do_thuc_hien, archived_at, tieu_chuan:tieu_chuan_id(id, so_thu_tu, ten), tieu_chi:tieu_chi_id(id, ma, ten, tieu_chuan_id, la_bat_buoc), phu_trach:phu_trach_id(id, ho_ten, email)",
        { count: "exact" },
      )
      .eq("co_so_id", profile.co_so_id)
      .eq("nam_hoc_id", effectiveYearId);

    query = showArchived ? query.not("archived_at", "is", null) : query.is("archived_at", null);

    const safeSearch = deferredSearchTerm.trim().replace(/[%(),]/g, "");
    if (safeSearch) query = query.or(`noi_dung.ilike.%${safeSearch}%,muc_tieu.ilike.%${safeSearch}%`);
    if (criterionFilter) query = query.eq("tieu_chi_id", criterionFilter);
    if (ownerFilter) query = query.eq("phu_trach_id", ownerFilter);
    if (statusFilter) query = query.eq("muc_do_thuc_hien", statusFilter);
    if (overdueOnly) {
      query = query
        .lt("thoi_gian_ket_thuc", new Date().toISOString().slice(0, 10))
        .not("muc_do_thuc_hien", "in", "(hoan_thanh,khong_thuc_hien)");
    }

    const { count, data, error } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * DEFAULT_PAGE_SIZE, page * DEFAULT_PAGE_SIZE - 1);

    if (!yearRequest.isCurrent(request)) return;

    if (error) {
      setMessage(toUserMessage(error));
      return;
    }

    setPlans((data ?? []) as unknown as Plan[]);
    setPlanCount(count ?? 0);
  }, [criterionFilter, deferredSearchTerm, effectiveYearId, overdueOnly, ownerFilter, page, profile, setMessage, showArchived, statusFilter, supabase, yearRequest]);

  const loadPlanSummary = useCallback(async () => {
    if (!supabase || !profile || !effectiveYearId) return;

    const request = yearRequest.begin("plan-summary");
    const { data, error } = await supabase
      .from("ke_hoach_cai_tien")
      .select("muc_do_thuc_hien, thoi_gian_ket_thuc")
      .eq("co_so_id", profile.co_so_id)
      .eq("nam_hoc_id", effectiveYearId)
      .is("archived_at", null);

    if (!yearRequest.isCurrent(request)) return;
    if (error) {
      setMessage(toUserMessage(error, "Không tải được tổng quan kế hoạch."));
      return;
    }

    setPlanSummary((data ?? []) as PlanSummaryRow[]);
  }, [effectiveYearId, profile, setMessage, supabase, yearRequest]);

  const loadReportSections = useCallback(async () => {
    if (!supabase || !profile || !effectiveYearId) {
      return;
    }

    setReportSections(emptyReportSections);
    setSavedReportSections(emptyReportSections);
    const request = reportSectionRequest.begin("report-sections");

    const { data, error } = await supabase
      .from("noi_dung_mau_2")
      .select("can_cu_xay_dung, muc_dich_yeu_cau, tom_tat_van_de_trong_tam, theo_doi_danh_gia, to_chuc_thuc_hien, co_che_danh_gia_bao_cao")
      .eq("co_so_id", profile.co_so_id)
      .eq("nam_hoc_id", effectiveYearId)
      .eq("cap_hoc", reportCapHoc)
      .maybeSingle();

    if (!reportSectionRequest.isCurrent(request)) return;

    if (error) {
      setMessage(toUserMessage(error));
      return;
    }

    const nextSections = data ? { ...emptyReportSections, ...data } : emptyReportSections;
    setReportSections(nextSections);
    setSavedReportSections(nextSections);
  }, [effectiveYearId, profile, reportCapHoc, reportSectionRequest, setMessage, supabase]);

  const loadReportReadiness = useCallback(async () => {
    if (!supabase || !effectiveYearId) return;

    setReadinessLoading(true);
    const request = reportSectionRequest.begin("report-readiness");
    const { data, error } = await supabase.rpc("fn_kiem_tra_san_sang_bao_cao", {
      p_cap_hoc: reportCapHoc,
      p_loai_bao_cao: "mau_2_ke_hoach_cai_tien",
      p_nam_hoc_id: effectiveYearId,
    });

    if (!reportSectionRequest.isCurrent(request)) return;
    setReadinessLoading(false);

    if (error) {
      setReportReadiness(null);
      setMessage(toUserMessage(error, "Không kiểm tra được điều kiện xuất Mẫu 2."));
      return;
    }

    setReportReadiness(data as ReportReadiness);
  }, [effectiveYearId, reportCapHoc, reportSectionRequest, setMessage, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSaving(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [effectiveYearId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSavingSections(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [effectiveYearId, reportCapHoc]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReferenceData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadReferenceData]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPlans();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadPlans]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReportSections();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadReportSections]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPlanSummary();
      void loadReportReadiness();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadPlanSummary, loadReportReadiness]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const requestedView = new URLSearchParams(window.location.search).get("view");
      if (requestedView === "content" || requestedView === "review") setActiveView(requestedView);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function commitView(view: ImprovementView) {
    setActiveView(view);
    const url = new URL(window.location.href);
    url.searchParams.set("view", view);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function changeView(view: ImprovementView) {
    if (view === activeView) return;
    if (activeView === "content" && reportSectionsDirty) {
      setOpenEditorAfterNavigation(false);
      setPendingView(view);
      return;
    }
    commitView(view);
  }

  async function saveReportSections() {
    if (!supabase || !profile || !effectiveYearId) {
      return;
    }

    setSavingSections(true);
    const request = reportSectionRequest.begin("save-report-sections");
    const { error } = await supabase.from("noi_dung_mau_2").upsert(
      {
        co_so_id: profile.co_so_id,
        nam_hoc_id: effectiveYearId,
        cap_hoc: reportCapHoc,
        ...reportSections,
        nguoi_cap_nhat: profile.id,
      },
      { onConflict: "co_so_id,nam_hoc_id,cap_hoc" },
    );
    if (!reportSectionRequest.isCurrent(request)) return;
    setSavingSections(false);
    if (error) {
      setMessage(toUserMessage(error));
      return;
    }

    setSavedReportSections({ ...reportSections });
    setMessage("Đã lưu nội dung chung của Mẫu 2.");
    await loadReportReadiness();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !profile || !effectiveYearId) {
      setMessage("Chưa đủ dữ liệu để lưu kế hoạch cải tiến.");
      return;
    }

    const criterion = criteria.find((item) => item.id === selectedCriterionId);

    if (!criterion) {
      setMessage("Hãy chọn tiêu chí cần cải tiến.");
      return;
    }

    if (timeStart && timeEnd && timeEnd < timeStart) {
      setMessage("Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.");
      return;
    }

    setSaving(true);
    setMessage("");
    const request = yearRequest.begin("save-plan");

    const payload = {
      co_so_id: profile.co_so_id,
      nam_hoc_id: effectiveYearId,
      tieu_chuan_id: criterion.tieu_chuan_id,
      tieu_chi_id: criterion.id,
      noi_dung: noiDung,
      muc_tieu: mucTieu,
      hoat_dong: hoatDong,
      chi_so_ket_qua: chiSoKetQua,
      thoi_gian_bat_dau: timeStart || null,
      thoi_gian_ket_thuc: timeEnd || null,
      phu_trach_id: phuTrachId || null,
      nguon_luc: nguonLuc,
      minh_chung_du_kien: minhChungDuKien,
    };

    const { error } = editingPlanId
      ? await supabase
          .from("ke_hoach_cai_tien")
          .update(payload)
          .eq("id", editingPlanId)
          .eq("co_so_id", profile.co_so_id)
          .eq("nam_hoc_id", effectiveYearId)
          .is("archived_at", null)
      : await supabase.from("ke_hoach_cai_tien").insert({
          ...payload,
          muc_do_thuc_hien: "chua_thuc_hien",
        });

    if (!yearRequest.isCurrent(request)) return;

    setSaving(false);

    if (error) {
      setMessage(toUserMessage(error));
      return;
    }

    const wasEditing = Boolean(editingPlanId);
    resetPlanForm();
    setIsPlanEditorOpen(false);
    setMessage(wasEditing ? "Đã cập nhật nhiệm vụ cải tiến." : "Đã thêm nhiệm vụ cải tiến.");
    await Promise.all([loadPlans(), loadPlanSummary(), loadReportReadiness()]);
  }

  function resetPlanForm() {
    setEditingPlanId("");
    setSelectedCriterionId(criteria[0]?.id ?? "");
    setNoiDung("");
    setMucTieu("");
    setHoatDong("");
    setChiSoKetQua("");
    setTimeStart("");
    setTimeEnd("");
    setPhuTrachId("");
    setNguonLuc("");
    setMinhChungDuKien("");
  }

  function editPlan(plan: Plan) {
    setEditingPlanId(plan.id);
    setSelectedCriterionId(plan.tieu_chi_id ?? criteria[0]?.id ?? "");
    setNoiDung(plan.noi_dung ?? "");
    setMucTieu(plan.muc_tieu ?? "");
    setHoatDong(plan.hoat_dong ?? "");
    setChiSoKetQua(plan.chi_so_ket_qua ?? "");
    setTimeStart(plan.thoi_gian_bat_dau ?? "");
    setTimeEnd(plan.thoi_gian_ket_thuc ?? "");
    setPhuTrachId(plan.phu_trach_id ?? "");
    setNguonLuc(plan.nguon_luc ?? "");
    setMinhChungDuKien(plan.minh_chung_du_kien ?? "");
    setIsPlanEditorOpen(true);
  }

  function openNewPlanEditor() {
    resetPlanForm();
    setIsPlanEditorOpen(true);
  }

  function closePlanEditor() {
    resetPlanForm();
    setIsPlanEditorOpen(false);
  }

  async function setPlanArchived(plan: Plan, archived: boolean) {
    if (!supabase || !profile) return;
    setUpdatingPlanId(plan.id);
    const { error } = await supabase
      .from("ke_hoach_cai_tien")
      .update({ archived_at: archived ? new Date().toISOString() : null })
      .eq("id", plan.id)
      .eq("co_so_id", profile.co_so_id)
      .eq("nam_hoc_id", effectiveYearId);
    if (error) {
      setUpdatingPlanId("");
      setMessage(toUserMessage(error));
      return;
    }
    if (editingPlanId === plan.id) resetPlanForm();
    setMessage(archived ? "Đã lưu trữ kế hoạch cải tiến." : "Đã khôi phục kế hoạch cải tiến.");
    await Promise.all([loadPlans(), loadPlanSummary(), loadReportReadiness()]);
    setUpdatingPlanId("");
  }

  async function updatePlanStatus(planId: string, status: PlanStatus) {
    if (!supabase || !profile || !effectiveYearId) {
      setMessage("Chưa cấu hình Supabase.");
      return;
    }

    setUpdatingPlanId(planId);
    const { error } = await supabase
      .from("ke_hoach_cai_tien")
      .update({ muc_do_thuc_hien: status })
      .eq("id", planId)
      .eq("co_so_id", profile.co_so_id)
      .eq("nam_hoc_id", effectiveYearId)
      .is("archived_at", null);

    if (error) {
      setUpdatingPlanId("");
      setMessage(toUserMessage(error));
      return;
    }

    setMessage("Đã cập nhật trạng thái kế hoạch.");
    await Promise.all([loadPlans(), loadPlanSummary()]);
    setUpdatingPlanId("");
  }

  if (loading || loadingData) {
    return <LoadingState label="Đang tải kế hoạch cải tiến…" />;
  }

  if (!profile || !activeYear) {
    return (
      <EmptyState
        title="Chưa có năm học để lập kế hoạch"
        description="Hãy thiết lập đơn vị và năm học trước khi nhập kế hoạch cải tiến chất lượng."
        action={<Link className="button-primary" href="/thiet-lap">Thiết lập ngay</Link>}
      />
    );
  }

  const hasTaskFilters = Boolean(searchTerm || criterionFilter || ownerFilter || statusFilter || overdueOnly);
  const readinessProblemCount = reportReadiness
    ? reportReadiness.missing_criteria.length
      + reportReadiness.missing_descriptions.length
      + reportReadiness.missing_evidence.length
      + reportReadiness.unverified_evidence.length
      + (reportReadiness.missing_council ? 1 : 0)
      + reportReadiness.other_blockers.length
    : 0;

  return (
    <div className="grid gap-5">
      {message ? <Alert tone={message.startsWith("Đã") ? "success" : "warning"}>{message}</Alert> : null}

      <section className="surface-card grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(180px,240px)_minmax(180px,240px)] lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase text-[var(--color-graphite)]/60">Phạm vi đang làm việc</p>
          <p className="mt-2 text-base font-semibold text-[var(--color-ink-navy)]">{school?.ten ?? "Đơn vị hiện tại"}</p>
          <p className="mt-1 text-sm text-[var(--color-graphite)]/70">Mọi thay đổi bên dưới chỉ áp dụng cho năm học và cấp học đã chọn.</p>
        </div>
        <label className="text-sm font-medium">
          Năm học
          <select className="form-control mt-2" value={effectiveYearId} onChange={(event) => { setPage(1); setSelectedYearId(event.target.value); }}>
            {years.map((year) => (
              <option key={year.id} value={year.id}>{year.ten} {year.trang_thai === "dang_hoat_dong" ? "(đang hoạt động)" : ""}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Cấp học
          <select className="form-control mt-2" value={reportCapHoc} onChange={(event) => setSelectedReportCapHoc(event.target.value as CapHoc)}>
            {(schoolCapHoc.length ? schoolCapHoc : [reportCapHoc]).map((capHoc) => <option key={capHoc} value={capHoc}>{capHocLabels[capHoc]}</option>)}
          </select>
        </label>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="grid border-b border-[var(--color-border)] sm:grid-cols-2 xl:grid-cols-4">
          <ProgressMetric icon={<FileText size={18} />} label="Nội dung chung" value={`${filledReportSectionCount}/6`} detail="phần đã hoàn thiện" />
          <ProgressMetric icon={<ListChecks size={18} />} label="Nhiệm vụ" value={String(activePlanTotal)} detail={`${inProgressCount} đang thực hiện`} />
          <ProgressMetric icon={<CheckCircle2 size={18} />} label="Hoàn thành" value={String(completedCount)} detail="nhiệm vụ" />
          <ProgressMetric icon={<AlertCircle size={18} />} label="Quá hạn" value={String(overdueCount)} detail={overdueCount ? "cần xử lý" : "không có"} danger={overdueCount > 0} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <p className="font-semibold text-[var(--color-ink-navy)]">Bước nên làm tiếp theo</p>
            <p className="mt-1 text-sm text-[var(--color-graphite)]/70">
              {filledReportSectionCount < 6
                ? `Hoàn thiện ${6 - filledReportSectionCount} phần nội dung chung còn thiếu.`
                : activePlanTotal === 0
                  ? "Thêm ít nhất một nhiệm vụ để tạo bảng kế hoạch Mẫu 2."
                  : reportReadiness?.ready
                    ? "Dữ liệu đã sẵn sàng để chuyển sang khu vực báo cáo."
                    : "Rà soát các điều kiện còn thiếu trước khi gửi duyệt."}
            </p>
          </div>
          <button className="button-primary" type="button" onClick={() => {
            if (filledReportSectionCount < 6) changeView("content");
            else if (activePlanTotal === 0) {
              if (activeView === "content" && reportSectionsDirty) {
                setOpenEditorAfterNavigation(true);
                setPendingView("tasks");
              }
              else { changeView("tasks"); openNewPlanEditor(); }
            }
            else changeView("review");
          }}>
            {filledReportSectionCount < 6 ? "Hoàn thiện nội dung" : activePlanTotal === 0 ? "Thêm nhiệm vụ" : "Rà soát Mẫu 2"}
            <ChevronRight aria-hidden="true" size={17} />
          </button>
        </div>
      </section>

      <nav className="surface-card overflow-x-auto" aria-label="Khu vực kế hoạch cải tiến">
        <div className="flex min-w-[620px]" role="tablist">
          {(Object.keys(viewLabels) as ImprovementView[]).map((view) => {
            const ViewIcon = view === "content" ? FileText : view === "tasks" ? ListChecks : ClipboardCheck;
            const viewDetail = view === "content"
              ? `${filledReportSectionCount}/6 phần hoàn thiện`
              : view === "tasks"
                ? `${activePlanTotal} nhiệm vụ`
                : reportReadiness?.ready
                  ? "Đã sẵn sàng"
                  : `${readinessProblemCount} mục cần xử lý`;
            const isActive = activeView === view;

            return (
              <button
                aria-selected={isActive}
                className={`relative flex min-w-0 flex-1 items-center gap-3 border-r border-[var(--color-border)] px-5 py-4 text-left transition-colors last:border-r-0 ${isActive ? "bg-[var(--color-lavender-mist)]/45 text-[var(--color-ink-navy)]" : "text-[var(--color-graphite)] hover:bg-[var(--color-paper)]"}`}
                key={view}
                role="tab"
                type="button"
                onClick={() => changeView(view)}
              >
                <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full ${isActive ? "bg-white text-[var(--color-electric-blue)] shadow-sm" : "bg-[var(--color-paper)] text-[var(--color-graphite)]/65"}`}>
                  <ViewIcon aria-hidden="true" size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{viewLabels[view]}</span>
                  <span className="mt-0.5 block text-xs font-medium opacity-65">{viewDetail}</span>
                </span>
                {isActive ? <span className="absolute inset-x-5 bottom-0 h-0.5 bg-[var(--color-electric-blue)]" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      </nav>

      {activeView === "content" ? (
        <section aria-label="Nội dung Mẫu 2" className="surface-card overflow-hidden" role="tabpanel">
          <div className="border-b border-[var(--color-border)] px-5 py-4">
            <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">Nội dung chung của Mẫu 2</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">Soạn sáu phần văn bản dùng chung. Phần 1 lấy từ thông tin đơn vị; phần 5 lấy tự động từ danh sách nhiệm vụ.</p>
          </div>
          <div className="grid gap-5 p-5">
            <div className="grid gap-3 border-l-2 border-[var(--color-electric-blue)] bg-[var(--color-lavender-mist)]/45 px-4 py-3 text-sm md:grid-cols-2">
              <p><strong>Phần 1:</strong> hệ thống tự điền thông tin đơn vị và năm học.</p>
              <p><strong>Phần 5:</strong> hệ thống tạo bảng từ các nhiệm vụ cải tiến.</p>
            </div>
            <div className="grid gap-5">
              {reportSectionFields.map((field) => (
                <TextArea
                  description={field.description}
                  key={field.key}
                  label={field.label}
                  rows={4}
                  value={reportSections[field.key]}
                  onChange={(value) => setReportSections((current) => ({ ...current, [field.key]: value }))}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] bg-white px-5 py-4">
            <p className="text-sm text-[var(--color-graphite)]/70">
              {reportSectionsDirty ? "Có thay đổi chưa được lưu." : "Nội dung hiện tại đã được lưu."}
            </p>
            <button className="button-primary" disabled={savingSections || !reportSectionsDirty} type="button" onClick={() => void saveReportSections()}>
              {savingSections ? <LoaderCircle className="animate-spin" aria-hidden="true" size={17} /> : <CheckCircle2 aria-hidden="true" size={17} />}
              {savingSections ? "Đang lưu…" : "Lưu nội dung"}
            </button>
          </div>
        </section>
      ) : null}

      {activeView === "tasks" ? (
        <section aria-label="Nhiệm vụ cải tiến" className="surface-card overflow-hidden" role="tabpanel">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">{showArchived ? "Nhiệm vụ đã lưu trữ" : "Nhiệm vụ cải tiến"}</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">Mỗi nhiệm vụ tạo thành một dòng trong bảng kế hoạch của Mẫu 2.</p>
            </div>
            <button className="button-primary" type="button" onClick={openNewPlanEditor}><Plus aria-hidden="true" size={18} />Thêm nhiệm vụ</button>
          </div>

          <div className="grid gap-3 border-b border-[var(--color-border)] bg-[var(--color-paper)]/55 p-5 md:grid-cols-2 xl:grid-cols-[minmax(220px,1.4fr)_1fr_1fr_1fr]">
            <label className="relative text-sm font-medium">
              Tìm nhiệm vụ
              <Search className="pointer-events-none absolute bottom-3 left-3 text-[var(--color-graphite)]/55" aria-hidden="true" size={17} />
              <input className="form-control search-control mt-2" placeholder="Nội dung hoặc mục tiêu" value={searchTerm} onChange={(event) => { setPage(1); setSearchTerm(event.target.value); }} />
            </label>
            <label className="text-sm font-medium">Tiêu chí
              <select className="form-control mt-2" value={criterionFilter} onChange={(event) => { setPage(1); setCriterionFilter(event.target.value); }}>
                <option value="">Tất cả tiêu chí</option>
                {criteria.map((criterion) => <option key={criterion.id} value={criterion.id}>{criterion.ma} - {criterion.ten}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium">Phụ trách
              <select className="form-control mt-2" value={ownerFilter} onChange={(event) => { setPage(1); setOwnerFilter(event.target.value); }}>
                <option value="">Tất cả người phụ trách</option>
                {users.map((user) => <option key={user.id} value={user.id}>{user.ho_ten ?? user.email ?? "Người dùng"}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium">Trạng thái
              <select className="form-control mt-2" value={statusFilter} onChange={(event) => { setPage(1); setStatusFilter(event.target.value); }}>
                <option value="">Tất cả trạng thái</option>
                {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <div className="flex flex-wrap items-center gap-4 md:col-span-2 xl:col-span-4">
              <label className="flex items-center gap-2 text-sm font-medium"><input checked={overdueOnly} type="checkbox" onChange={(event) => { setPage(1); setOverdueOnly(event.target.checked); }} />Chỉ hiện nhiệm vụ quá hạn</label>
              {hasTaskFilters ? (
                <button className="button-secondary" type="button" onClick={() => { setSearchTerm(""); setCriterionFilter(""); setOwnerFilter(""); setStatusFilter(""); setOverdueOnly(false); }}>
                  <RotateCcw aria-hidden="true" size={16} />Xóa bộ lọc
                </button>
              ) : null}
              <button className="button-secondary ml-auto" type="button" onClick={() => { setPage(1); setShowArchived((value) => !value); }}>
                <Archive aria-hidden="true" size={16} />{showArchived ? "Xem nhiệm vụ đang dùng" : "Xem mục đã lưu trữ"}
              </button>
            </div>
          </div>

          {plans.length === 0 ? (
            <div className="p-5"><EmptyState title={hasTaskFilters ? "Không tìm thấy nhiệm vụ phù hợp" : "Chưa có nhiệm vụ cải tiến"} description={hasTaskFilters ? "Hãy đổi hoặc xóa bộ lọc để xem thêm kết quả." : "Thêm nhiệm vụ đầu tiên từ hạn chế đã xác định trong phần tự đánh giá."} action={!hasTaskFilters ? <button className="button-primary" type="button" onClick={openNewPlanEditor}><Plus aria-hidden="true" size={18} />Thêm nhiệm vụ</button> : undefined} /></div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {plans.map((plan) => {
                const criterion = first(plan.tieu_chi);
                const standard = first(plan.tieu_chuan);
                const responsible = first(plan.phu_trach);
                const overdue = isPlanOverdue(plan);
                return (
                  <article className="grid gap-4 px-5 py-4 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-center" key={plan.id}>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {criterion ? <Badge tone={criterion.la_bat_buoc ? "warning" : "default"}>{criterion.ma}</Badge> : null}
                        {standard ? <span className="text-xs text-[var(--color-graphite)]/60">Tiêu chuẩn {standard.so_thu_tu}</span> : null}
                        <Badge tone={overdue ? "danger" : toneForStatus(plan.muc_do_thuc_hien)}>{overdue ? "Quá hạn" : statusLabels[plan.muc_do_thuc_hien]}</Badge>
                      </div>
                      <h3 className="mt-2 text-base font-semibold leading-6 text-[var(--color-ink-navy)]">{plan.noi_dung || "Chưa nhập nội dung"}</h3>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--color-graphite)]/72">Mục tiêu: {plan.muc_tieu || "Chưa nhập"}</p>
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[var(--color-graphite)]/65">
                        <span className="inline-flex items-center gap-1.5"><UserRound aria-hidden="true" size={15} />{responsible?.ho_ten ?? responsible?.email ?? "Chưa phân công"}</span>
                        <span className="inline-flex items-center gap-1.5"><CalendarDays aria-hidden="true" size={15} />{formatDate(plan.thoi_gian_bat_dau)} đến {formatDate(plan.thoi_gian_ket_thuc)}</span>
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] xl:grid-cols-1">
                      <select aria-label={`Trạng thái của ${plan.noi_dung ?? "nhiệm vụ"}`} className="form-control" disabled={showArchived || updatingPlanId === plan.id} value={plan.muc_do_thuc_hien} onChange={(event) => void updatePlanStatus(plan.id, event.target.value as PlanStatus)}>
                        {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                      {showArchived ? (
                        <button className="button-secondary" disabled={updatingPlanId === plan.id} type="button" onClick={() => void setPlanArchived(plan, false)}><RotateCcw aria-hidden="true" size={16} />Khôi phục</button>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <button className="button-secondary" type="button" onClick={() => editPlan(plan)}><Pencil aria-hidden="true" size={16} />Sửa</button>
                          <button className="button-secondary" disabled={updatingPlanId === plan.id} type="button" onClick={() => void setPlanArchived(plan, true)}><Archive aria-hidden="true" size={16} />Lưu trữ</button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          <Pagination page={page} total={planCount} onPageChange={setPage} />
        </section>
      ) : null}

      {activeView === "review" ? (
        <section aria-label="Rà soát và xuất Mẫu 2" className="surface-card overflow-hidden" role="tabpanel">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">Rà soát trước khi xuất Mẫu 2</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">Các điều kiện được tính từ dữ liệu hiện tại của đơn vị, năm học và cấp học đang chọn.</p>
            </div>
            {readinessLoading || !reportReadiness ? <Badge>Đang kiểm tra</Badge> : <Badge tone={reportReadiness.ready ? "success" : "danger"}>{reportReadiness.ready ? "Sẵn sàng" : `${readinessProblemCount} mục cần xử lý`}</Badge>}
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            <ReviewRow complete={filledReportSectionCount === 6} detail={`${filledReportSectionCount}/6 phần đã có nội dung.`} href="#" label="Nội dung chung của Mẫu 2" onAction={() => changeView("content")} />
            <ReviewRow complete={activePlanTotal > 0} detail={activePlanTotal ? `${activePlanTotal} nhiệm vụ đang được đưa vào bảng kế hoạch.` : "Chưa có nhiệm vụ nào để tạo bảng kế hoạch."} href="#" label="Bảng nhiệm vụ cải tiến" onAction={() => changeView("tasks")} />
            <ReviewRow complete={Boolean(reportReadiness && !reportReadiness.missing_criteria.length && !reportReadiness.missing_descriptions.length)} detail={!reportReadiness ? "Đang kiểm tra dữ liệu tự đánh giá." : reportReadiness.missing_criteria.length || reportReadiness.missing_descriptions.length ? "Tự đánh giá còn tiêu chí hoặc mô tả chưa hoàn thiện." : "Các tiêu chí tự đánh giá đã đủ dữ liệu."} href="/tu-danh-gia" label="Kết quả tự đánh giá" />
            <ReviewRow complete={Boolean(reportReadiness && !reportReadiness.missing_evidence.length && !reportReadiness.unverified_evidence.length)} detail={!reportReadiness ? "Đang kiểm tra dữ liệu minh chứng." : reportReadiness.missing_evidence.length || reportReadiness.unverified_evidence.length ? "Còn tiêu chí thiếu minh chứng hợp lệ hoặc minh chứng chưa xác minh." : "Minh chứng đáp ứng điều kiện báo cáo."} href="/minh-chung/xac-minh" label="Minh chứng hợp lệ" />
            <ReviewRow complete={Boolean(reportReadiness && !reportReadiness.missing_council)} detail={!reportReadiness ? "Đang kiểm tra thông tin hội đồng." : reportReadiness.missing_council ? "Chưa đủ thông tin Hội đồng tự đánh giá." : "Thông tin Hội đồng tự đánh giá đã sẵn sàng."} href="/hoi-dong-tu-danh-gia" label="Hội đồng tự đánh giá" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] bg-[var(--color-paper)]/45 px-5 py-4">
            <p className="text-sm leading-6 text-[var(--color-graphite)]/72">{reportReadiness?.ready ? "Mẫu 2 đã đủ điều kiện để tạo bản gửi duyệt." : "Bạn vẫn có thể mở trang Báo cáo để tải bản nháp và xem toàn bộ luồng duyệt."}</p>
            <Link className="button-primary" href="/bao-cao"><ClipboardCheck aria-hidden="true" size={18} />{reportReadiness?.ready ? "Tạo bản gửi duyệt" : "Mở khu vực báo cáo"}</Link>
          </div>
        </section>
      ) : null}

      {isPlanEditorOpen ? (
        <div className="fixed inset-0 z-50" role="presentation">
          <button aria-label="Đóng biểu mẫu" className="absolute inset-0 h-full w-full bg-[var(--color-ink-navy)]/35" type="button" onClick={closePlanEditor} />
          <section aria-labelledby="plan-editor-title" aria-modal="true" className="absolute inset-y-0 right-0 w-full max-w-2xl overflow-y-auto bg-white shadow-2xl" role="dialog">
            <form className="grid min-h-full grid-rows-[auto_1fr_auto]" onSubmit={handleSubmit}>
              <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-5 py-4">
                <div><h2 className="text-lg font-semibold text-[var(--color-ink-navy)]" id="plan-editor-title">{editingPlanId ? "Chỉnh sửa nhiệm vụ" : "Thêm nhiệm vụ cải tiến"}</h2><p className="mt-1 text-sm text-[var(--color-graphite)]/70">Thông tin này sẽ tạo một dòng trong bảng kế hoạch của Mẫu 2.</p></div>
                <button aria-label="Đóng" className="inline-flex size-10 items-center justify-center rounded-full border border-[var(--color-border)]" type="button" onClick={closePlanEditor}><X aria-hidden="true" size={19} /></button>
              </div>
              <div className="grid content-start gap-6 p-5">
                <fieldset className="grid gap-4"><legend className="mb-3 font-semibold text-[var(--color-ink-navy)]">1. Nội dung và mục tiêu</legend>
                  <label className="text-sm font-medium">Tiêu chí<select className="form-control mt-2" required value={selectedCriterionId} onChange={(event) => setSelectedCriterionId(event.target.value)}>{criteria.map((criterion) => <option key={criterion.id} value={criterion.id}>{criterion.ma} - {criterion.ten}</option>)}</select></label>
                  <TextArea label="Nội dung cần cải tiến" description="Nêu rõ hạn chế hoặc vấn đề cần khắc phục." required value={noiDung} onChange={setNoiDung} />
                  <TextArea label="Mục tiêu" description="Mô tả kết quả cụ thể cần đạt được." required value={mucTieu} onChange={setMucTieu} />
                </fieldset>
                <fieldset className="grid gap-4"><legend className="mb-3 font-semibold text-[var(--color-ink-navy)]">2. Cách thực hiện và đo lường</legend>
                  <TextArea label="Hoạt động, giải pháp" required value={hoatDong} onChange={setHoatDong} />
                  <TextArea label="Chỉ số đánh giá kết quả" description="Dùng kết quả có thể kiểm tra hoặc đo được." value={chiSoKetQua} onChange={setChiSoKetQua} />
                  <TextArea label="Minh chứng dự kiến" value={minhChungDuKien} onChange={setMinhChungDuKien} />
                </fieldset>
                <fieldset className="grid gap-4"><legend className="mb-3 font-semibold text-[var(--color-ink-navy)]">3. Phân công và thời gian</legend>
                  <label className="text-sm font-medium">Người phụ trách<select className="form-control mt-2" value={phuTrachId} onChange={(event) => setPhuTrachId(event.target.value)}><option value="">Chưa phân công</option>{users.map((user) => <option key={user.id} value={user.id}>{user.ho_ten ?? user.email ?? "Người dùng"}</option>)}</select></label>
                  <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Ngày bắt đầu<input className="form-control mt-2" type="date" value={timeStart} onChange={(event) => setTimeStart(event.target.value)} /></label><label className="text-sm font-medium">Ngày kết thúc<input className="form-control mt-2" min={timeStart || undefined} type="date" value={timeEnd} onChange={(event) => setTimeEnd(event.target.value)} /></label></div>
                  <TextArea label="Nguồn lực" value={nguonLuc} onChange={setNguonLuc} />
                </fieldset>
              </div>
              <div className="sticky bottom-0 flex justify-end gap-2 border-t border-[var(--color-border)] bg-white px-5 py-4"><button className="button-secondary" type="button" onClick={closePlanEditor}>Hủy</button><button className="button-primary" disabled={saving}>{saving ? <LoaderCircle className="animate-spin" aria-hidden="true" size={17} /> : <CheckCircle2 aria-hidden="true" size={17} />}{saving ? "Đang lưu…" : editingPlanId ? "Lưu thay đổi" : "Thêm nhiệm vụ"}</button></div>
            </form>
          </section>
        </div>
      ) : null}

      <ConfirmDialog
        confirmLabel="Bỏ thay đổi"
        description="Nội dung Mẫu 2 chưa được lưu. Các thay đổi vừa nhập sẽ bị mất."
        isOpen={pendingView !== null}
        onCancel={() => { setPendingView(null); setOpenEditorAfterNavigation(false); }}
        onConfirm={() => {
          setReportSections(savedReportSections);
          if (pendingView) commitView(pendingView);
          if (openEditorAfterNavigation) openNewPlanEditor();
          setPendingView(null);
          setOpenEditorAfterNavigation(false);
        }}
        title="Rời khỏi phần nội dung?"
        tone="warning"
      />
    </div>
  );
}

function TextArea({
  description,
  label,
  onChange,
  required = false,
  rows = 3,
  value,
}: {
  description?: string;
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  rows?: number;
  value: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      <span>{label}{required ? <span aria-hidden="true" className="text-[var(--color-danger)]"> *</span> : null}</span>
      {description ? <span className="font-normal leading-5 text-[var(--color-graphite)]/65">{description}</span> : null}
      <textarea
        className="form-control mt-1 min-h-24"
        required={required}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function ProgressMetric({
  danger = false,
  detail,
  icon,
  label,
  value,
}: {
  danger?: boolean;
  detail: string;
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-28 items-center gap-3 border-b border-[var(--color-border)] px-5 py-4 last:border-b-0 sm:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:last:border-r-0">
      <span className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full ${danger ? "bg-red-50 text-[var(--color-danger)]" : "bg-[var(--color-lavender-mist)] text-[var(--color-ink-navy)]"}`}>{icon}</span>
      <div>
        <p className="text-xs font-semibold text-[var(--color-graphite)]/60">{label}</p>
        <p className={`mt-1 text-2xl font-semibold ${danger ? "text-[var(--color-danger)]" : "text-[var(--color-ink-navy)]"}`}>{value}</p>
        <p className="text-xs text-[var(--color-graphite)]/60">{detail}</p>
      </div>
    </div>
  );
}

function ReviewRow({
  complete,
  detail,
  href,
  label,
  onAction,
}: {
  complete: boolean;
  detail: string;
  href: string;
  label: string;
  onAction?: () => void;
}) {
  const content = (
    <>
      <div className="flex min-w-0 items-start gap-3">
        {complete
          ? <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--color-success)]" size={20} />
          : <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--color-danger)]" size={20} />}
        <div>
          <p className="font-semibold text-[var(--color-ink-navy)]">{label}</p>
          <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">{detail}</p>
        </div>
      </div>
      {!complete ? <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[var(--color-electric-blue)]">Xử lý<ChevronRight aria-hidden="true" size={16} /></span> : <Badge tone="success">Đã đủ</Badge>}
    </>
  );

  if (onAction) {
    return <button className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left" type="button" onClick={onAction}>{content}</button>;
  }

  return <Link className="flex items-center justify-between gap-4 px-5 py-4" href={href}>{content}</Link>;
}
