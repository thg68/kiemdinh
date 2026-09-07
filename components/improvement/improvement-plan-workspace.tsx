"use client";

import { toUserMessage } from "@/lib/errors/user-message";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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

export function ImprovementPlanWorkspace() {
  const { activeYear, loading, message, profile, school, setMessage, supabase, years } = useAppContext();
  const [selectedYearId, setSelectedYearId] = useState("");
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planCount, setPlanCount] = useState(0);
  const [page, setPage] = useState(1);
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
  const [savingSections, setSavingSections] = useState(false);
  const [selectedReportCapHoc, setSelectedReportCapHoc] = useState<CapHoc>("mam_non");
  const [editingPlanId, setEditingPlanId] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const effectiveYearId = selectedYearId || activeYear?.id || "";
  const schoolCapHoc = (school?.cap_hoc ?? []) as CapHoc[];
  const reportCapHoc = schoolCapHoc.includes(selectedReportCapHoc)
    ? selectedReportCapHoc
    : schoolCapHoc[0] ?? "mam_non";
  const yearRequest = useScopedRequest(`${profile?.co_so_id ?? ""}:${effectiveYearId}`);
  const reportSectionRequest = useScopedRequest(`${profile?.co_so_id ?? ""}:${effectiveYearId}:${reportCapHoc}`);

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
  }, [effectiveYearId, page, profile, setMessage, showArchived, supabase, yearRequest]);

  const loadReportSections = useCallback(async () => {
    if (!supabase || !profile || !effectiveYearId) {
      return;
    }

    setReportSections(emptyReportSections);
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

    setReportSections(data ? { ...emptyReportSections, ...data } : emptyReportSections);
  }, [effectiveYearId, profile, reportCapHoc, reportSectionRequest, setMessage, supabase]);

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
    setMessage(error ? toUserMessage(error) : "Đã lưu nội dung tám phần của Mẫu 2.");
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

    resetPlanForm();
    setMessage(editingPlanId ? "Đã cập nhật kế hoạch cải tiến." : "Đã thêm kế hoạch cải tiến.");
    await loadPlans();
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function setPlanArchived(plan: Plan, archived: boolean) {
    if (!supabase || !profile) return;
    const { error } = await supabase
      .from("ke_hoach_cai_tien")
      .update({ archived_at: archived ? new Date().toISOString() : null })
      .eq("id", plan.id)
      .eq("co_so_id", profile.co_so_id)
      .eq("nam_hoc_id", effectiveYearId);
    if (error) {
      setMessage(toUserMessage(error));
      return;
    }
    if (editingPlanId === plan.id) resetPlanForm();
    setMessage(archived ? "Đã lưu trữ kế hoạch cải tiến." : "Đã khôi phục kế hoạch cải tiến.");
    await loadPlans();
  }

  async function updatePlanStatus(planId: string, status: PlanStatus) {
    if (!supabase) {
      setMessage("Chưa cấu hình Supabase.");
      return;
    }

    const { error } = await supabase
      .from("ke_hoach_cai_tien")
      .update({ muc_do_thuc_hien: status })
      .eq("id", planId);

    if (error) {
      setMessage(toUserMessage(error));
      return;
    }

    setMessage("Đã cập nhật trạng thái kế hoạch.");
    await loadPlans();
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

  return (
    <div className="grid gap-6">
      {message ? <Alert tone={message.startsWith("Đã") ? "success" : "warning"}>{message}</Alert> : null}

      <section className="surface-card grid gap-3 p-5 md:grid-cols-[1fr_auto] md:items-end">
        <label className="text-sm font-medium">
          Năm học
          <select
            className="form-control mt-2"
            value={effectiveYearId}
            onChange={(event) => {
              setPage(1);
              setSelectedYearId(event.target.value);
            }}
          >
            {years.map((year) => (
              <option key={year.id} value={year.id}>
                {year.ten} {year.trang_thai === "dang_hoat_dong" ? "(đang hoạt động)" : ""}
              </option>
            ))}
          </select>
        </label>
        <Link className="button-secondary" href="/bao-cao">
          Xuất Mẫu 2
        </Link>
      </section>

      <section className="surface-card grid gap-4 p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
          <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">Nội dung chung của Mẫu 2</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">
            Hoàn thiện sáu phần văn bản dưới đây; thông tin chung và bảng kế hoạch được hệ thống lấy trực tiếp từ dữ liệu năm học.
          </p>
          </div>
          {schoolCapHoc.length > 1 ? (
            <label className="grid min-w-44 gap-1 text-sm font-medium">
              Cấp học
              <select className="field-control" value={reportCapHoc} onChange={(event) => setSelectedReportCapHoc(event.target.value as CapHoc)}>
                {schoolCapHoc.map((capHoc) => <option key={capHoc} value={capHoc}>{capHocLabels[capHoc]}</option>)}
              </select>
            </label>
          ) : null}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <TextArea label="2. Căn cứ xây dựng" value={reportSections.can_cu_xay_dung} onChange={(value) => setReportSections((current) => ({ ...current, can_cu_xay_dung: value }))} />
          <TextArea label="3. Mục đích, yêu cầu" value={reportSections.muc_dich_yeu_cau} onChange={(value) => setReportSections((current) => ({ ...current, muc_dich_yeu_cau: value }))} />
          <TextArea label="4. Vấn đề trọng tâm cần cải tiến" value={reportSections.tom_tat_van_de_trong_tam} onChange={(value) => setReportSections((current) => ({ ...current, tom_tat_van_de_trong_tam: value }))} />
          <TextArea label="6. Theo dõi và đánh giá thực hiện" value={reportSections.theo_doi_danh_gia} onChange={(value) => setReportSections((current) => ({ ...current, theo_doi_danh_gia: value }))} />
          <TextArea label="7. Tổ chức thực hiện" value={reportSections.to_chuc_thuc_hien} onChange={(value) => setReportSections((current) => ({ ...current, to_chuc_thuc_hien: value }))} />
          <TextArea label="8. Cơ chế đánh giá và báo cáo" value={reportSections.co_che_danh_gia_bao_cao} onChange={(value) => setReportSections((current) => ({ ...current, co_che_danh_gia_bao_cao: value }))} />
        </div>
        <button className="button-primary justify-self-start" disabled={savingSections} type="button" onClick={saveReportSections}>
          {savingSections ? "Đang lưu…" : "Lưu nội dung Mẫu 2"}
        </button>
      </section>

      <form className="surface-card grid gap-4 p-5" onSubmit={handleSubmit}>
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">{editingPlanId ? "Chỉnh sửa nội dung cải tiến" : "Thêm nội dung cải tiến"}</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">
            Các ô dưới đây đi thẳng vào bảng kế hoạch cải tiến của Mẫu 2.
          </p>
        </div>

        <label className="text-sm font-medium">
          Tiêu chí
          <select
            className="form-control mt-2"
            value={selectedCriterionId}
            onChange={(event) => setSelectedCriterionId(event.target.value)}
            required
          >
            {criteria.map((criterion) => (
              <option key={criterion.id} value={criterion.id}>
                {criterion.ma} - {criterion.ten}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 lg:grid-cols-2">
          <TextArea label="Nội dung cần cải tiến" value={noiDung} onChange={setNoiDung} required />
          <TextArea label="Mục tiêu" value={mucTieu} onChange={setMucTieu} required />
          <TextArea label="Hoạt động, giải pháp" value={hoatDong} onChange={setHoatDong} required />
          <TextArea label="Chỉ số đánh giá kết quả" value={chiSoKetQua} onChange={setChiSoKetQua} />
          <label className="text-sm font-medium">
            Thời gian bắt đầu
            <input className="form-control mt-2" type="date" value={timeStart} onChange={(event) => setTimeStart(event.target.value)} />
          </label>
          <label className="text-sm font-medium">
            Thời gian kết thúc
            <input className="form-control mt-2" type="date" value={timeEnd} onChange={(event) => setTimeEnd(event.target.value)} />
          </label>
          <label className="text-sm font-medium">
            Đơn vị, cá nhân phụ trách
            <select className="form-control mt-2" value={phuTrachId} onChange={(event) => setPhuTrachId(event.target.value)}>
              <option value="">Chưa chọn</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.ho_ten ?? user.email ?? "Người dùng"}
                </option>
              ))}
            </select>
          </label>
          <TextArea label="Nguồn lực" value={nguonLuc} onChange={setNguonLuc} />
          <TextArea label="Minh chứng dự kiến" value={minhChungDuKien} onChange={setMinhChungDuKien} />
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="button-primary" disabled={saving}>
            {saving ? "Đang lưu…" : editingPlanId ? "Lưu thay đổi" : "Thêm vào kế hoạch"}
          </button>
          {editingPlanId ? <button className="button-secondary" type="button" onClick={resetPlanForm}>Hủy chỉnh sửa</button> : null}
        </div>
      </form>

      <section className="surface-card overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
          <div><h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">{showArchived ? "Kế hoạch đã lưu trữ" : "Danh sách kế hoạch cải tiến"}</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">
            Mỗi dòng là một nhiệm vụ sẽ được đưa vào Mẫu 2 khi xuất báo cáo.
          </p></div>
          <button className="button-secondary" type="button" onClick={() => { setPage(1); setShowArchived((value) => !value); }}>
            {showArchived ? "Xem kế hoạch đang dùng" : "Xem mục đã lưu trữ"}
          </button>
        </div>
        {plans.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="Chưa có kế hoạch cải tiến"
              description="Hãy thêm các nội dung trọng tâm từ Gap Board hoặc từ kết quả tự đánh giá của hội đồng."
            />
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {plans.map((plan) => {
              const criterion = first(plan.tieu_chi);
              const standard = first(plan.tieu_chuan);
              const responsible = first(plan.phu_trach);

              return (
                <article className="grid gap-4 px-5 py-4" key={plan.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    {criterion ? <Badge tone={criterion.la_bat_buoc ? "warning" : "default"}>{criterion.ma}</Badge> : null}
                    {standard ? <Badge>Tiêu chuẩn {standard.so_thu_tu}</Badge> : null}
                    <Badge tone={toneForStatus(plan.muc_do_thuc_hien)}>{statusLabels[plan.muc_do_thuc_hien]}</Badge>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
                    <div>
                      <h3 className="text-base font-semibold leading-7 text-[var(--color-ink-navy)]">
                        {plan.noi_dung || "Chưa nhập nội dung"}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">
                        Mục tiêu: {plan.muc_tieu || "Chưa nhập"} · Phụ trách: {responsible?.ho_ten ?? responsible?.email ?? "Chưa chọn"}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">
                        Thời gian: {plan.thoi_gian_bat_dau ?? "?"} đến {plan.thoi_gian_ket_thuc ?? "?"}
                      </p>
                    </div>
                    <div className="grid gap-2"><label className="text-sm font-medium">
                      Cập nhật tiến độ
                      <select
                        className="form-control mt-2"
                        disabled={showArchived}
                        value={plan.muc_do_thuc_hien}
                        onChange={(event) => updatePlanStatus(plan.id, event.target.value as PlanStatus)}
                      >
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    {showArchived ? (
                      <button className="button-secondary" type="button" onClick={() => void setPlanArchived(plan, false)}>Khôi phục</button>
                    ) : (
                      <div className="flex gap-2">
                        <button className="button-secondary flex-1" type="button" onClick={() => editPlan(plan)}>Sửa</button>
                        <button className="button-secondary flex-1" type="button" onClick={() => void setPlanArchived(plan, true)}>Lưu trữ</button>
                      </div>
                    )}</div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        <Pagination
          page={page}
          total={planCount}
          onPageChange={setPage}
        />
      </section>
    </div>
  );
}

function TextArea({
  label,
  onChange,
  required = false,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
}) {
  return (
    <label className="text-sm font-medium">
      {label}
      <textarea
        className="form-control mt-2 min-h-24"
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
