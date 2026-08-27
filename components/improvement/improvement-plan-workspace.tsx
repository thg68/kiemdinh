"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useAppContext } from "@/components/shared/use-app-context";

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
  tieu_chuan?: Standard | Standard[] | null;
  tieu_chi?: Criterion | Criterion[] | null;
  phu_trach?: User | User[] | null;
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
  const { activeYear, loading, message, profile, setMessage, supabase, years } = useAppContext();
  const [selectedYearId, setSelectedYearId] = useState("");
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
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

  const effectiveYearId = selectedYearId || activeYear?.id || "";

  const loadReferenceData = useCallback(async () => {
    if (!supabase || !profile || !effectiveYearId) {
      return;
    }

    setLoadingData(true);
    setMessage("");

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

    if (criterionError || userError) {
      setMessage(criterionError?.message ?? userError?.message ?? "Không tải được dữ liệu tham chiếu.");
      setLoadingData(false);
      return;
    }

    setCriteria((criterionData ?? []) as Criterion[]);
    setUsers((userData ?? []) as User[]);
    setSelectedCriterionId((current) => current || ((criterionData ?? []) as Criterion[])[0]?.id || "");
    setLoadingData(false);
  }, [effectiveYearId, profile, setMessage, supabase]);

  const loadPlans = useCallback(async () => {
    if (!supabase || !profile || !effectiveYearId) {
      return;
    }

    const { data, error } = await supabase
      .from("ke_hoach_cai_tien")
      .select(
        "id, tieu_chuan_id, tieu_chi_id, noi_dung, muc_tieu, hoat_dong, chi_so_ket_qua, thoi_gian_bat_dau, thoi_gian_ket_thuc, phu_trach_id, nguon_luc, minh_chung_du_kien, muc_do_thuc_hien, tieu_chuan:tieu_chuan_id(id, so_thu_tu, ten), tieu_chi:tieu_chi_id(id, ma, ten, tieu_chuan_id, la_bat_buoc), phu_trach:phu_trach_id(id, ho_ten, email)",
      )
      .eq("co_so_id", profile.co_so_id)
      .eq("nam_hoc_id", effectiveYearId)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setPlans((data ?? []) as unknown as Plan[]);
  }, [effectiveYearId, profile, setMessage, supabase]);

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

    const { error } = await supabase.from("ke_hoach_cai_tien").insert({
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
      muc_do_thuc_hien: "chua_thuc_hien",
    });

    setSaving(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setNoiDung("");
    setMucTieu("");
    setHoatDong("");
    setChiSoKetQua("");
    setTimeStart("");
    setTimeEnd("");
    setPhuTrachId("");
    setNguonLuc("");
    setMinhChungDuKien("");
    setMessage("Đã thêm kế hoạch cải tiến.");
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
      setMessage(error.message);
      return;
    }

    setMessage("Đã cập nhật trạng thái kế hoạch.");
    await loadPlans();
  }

  if (loading || loadingData) {
    return <LoadingState label="Đang tải kế hoạch cải tiến..." />;
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
          Xuất Mẫu 2
        </Link>
      </section>

      <form className="surface-card grid gap-4 p-5" onSubmit={handleSubmit}>
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">Thêm nội dung cải tiến</h2>
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

        <button className="button-primary" disabled={saving}>
          {saving ? "Đang lưu..." : "Thêm vào kế hoạch"}
        </button>
      </form>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">Danh sách kế hoạch cải tiến</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">
            Mỗi dòng là một nhiệm vụ sẽ được đưa vào Mẫu 2 khi xuất báo cáo.
          </p>
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
                    <label className="text-sm font-medium">
                      Cập nhật tiến độ
                      <select
                        className="form-control mt-2"
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
                  </div>
                </article>
              );
            })}
          </div>
        )}
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
