"use client";

import { toUserMessage } from "@/lib/errors/user-message";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useAppContext } from "@/components/shared/use-app-context";

type RoleLabel = {
  ma: string;
  ten: string;
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
};

type Assignment = {
  id: string;
  tieu_chi_id: string;
  cap_hoc: string;
  vai_tro_trong_tieu_chi: string | null;
  tieu_chi?: Criterion | Criterion[] | null;
};

type AssessmentRow = {
  id: string;
  tieu_chi_id: string;
  cap_hoc: string;
  muc_dat: 0 | 1 | 2;
  trang_thai: string;
};

type WorkItem = {
  assignment: Assignment;
  assessment?: AssessmentRow;
  evidenceCount: number;
};

const assessmentStatusLabels: Record<string, string> = {
  nhap: "Đang nhập",
  ke_thua_cho_cap_nhat: "Kế thừa, chờ cập nhật",
  cho_duyet: "Chờ duyệt",
  dang_ra_soat: "Đang rà soát",
  da_duyet: "Đã duyệt",
};

const capHocLabels: Record<string, string> = {
  mam_non: "Mầm non",
  tieu_hoc: "Tiểu học",
  thcs: "THCS",
  thpt: "THPT",
  gdtx: "GDTX",
};

function first<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function MyWorkWorkspace() {
  const { activeYear, loading, message, profile, setMessage, supabase } = useAppContext();
  const [roles, setRoles] = useState<RoleLabel[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [pendingEvidence, setPendingEvidence] = useState(0);
  const [pendingAssessments, setPendingAssessments] = useState(0);
  const [pendingReports, setPendingReports] = useState(0);
  const [loadingWork, setLoadingWork] = useState(false);

  const isManager = useMemo(
    () =>
      roles.some((role) =>
        ["PRINCIPAL", "SELF_ASSESSMENT_CHAIR", "SECRETARY", "SYSTEM_ADMIN"].includes(role.ma),
      ),
    [roles],
  );
  const canEditAssessment = isManager || roles.some((role) => role.ma === "MEMBER");

  const loadWork = useCallback(async () => {
    if (!supabase || !profile || !activeYear) {
      return;
    }

    setLoadingWork(true);
    setMessage("");

    const { data: roleData } = await supabase.rpc("fn_user_role_labels");
    setRoles((roleData ?? []) as RoleLabel[]);

    const { data: assignmentData, error: assignmentError } = await supabase
      .from("phan_cong_tieu_chi")
      .select(
        "id, tieu_chi_id, cap_hoc, vai_tro_trong_tieu_chi, tieu_chi:tieu_chi_id(id, ma, ten, la_bat_buoc, tieu_chuan:tieu_chuan_id(so_thu_tu, ten))",
      )
      .eq("nam_hoc_id", activeYear.id)
      .eq("nguoi_dung_id", profile.id)
      .order("created_at", { ascending: true });

    if (assignmentError) {
      setMessage(toUserMessage(assignmentError, "Không tải được việc được phân công. Vui lòng thử lại."));
      setLoadingWork(false);
      return;
    }

    const assignments = (assignmentData ?? []) as unknown as Assignment[];
    const criterionIds = assignments.map((item) => item.tieu_chi_id);

    const { data: assessmentData, error: assessmentError } = criterionIds.length > 0
      ? await supabase
          .from("tu_danh_gia")
          .select("id, tieu_chi_id, cap_hoc, muc_dat, trang_thai")
          .eq("co_so_id", profile.co_so_id)
          .eq("nam_hoc_id", activeYear.id)
          .in("tieu_chi_id", criterionIds)
      : { data: [], error: null };

    if (assessmentError) {
      setMessage(toUserMessage(assessmentError, "Không tải được kết quả tự đánh giá theo cấp học."));
      setLoadingWork(false);
      return;
    }

    const assessments = (assessmentData ?? []) as AssessmentRow[];
    const assessmentIds = assessments.map((row) => row.id);
    const { data: linkData, error: linkError } = assessmentIds.length > 0
      ? await supabase
          .from("tu_danh_gia_minh_chung")
          .select("tu_danh_gia_id")
          .in("tu_danh_gia_id", assessmentIds)
      : { data: [], error: null };

    if (linkError) {
      setMessage(toUserMessage(linkError, "Không tải được minh chứng của công việc."));
      setLoadingWork(false);
      return;
    }

    const evidenceCounts = new Map<string, number>();

    for (const link of linkData ?? []) {
      evidenceCounts.set(link.tu_danh_gia_id, (evidenceCounts.get(link.tu_danh_gia_id) ?? 0) + 1);
    }

    setWorkItems(
      assignments.map((assignment) => {
        const assessment = assessments.find(
          (row) => row.tieu_chi_id === assignment.tieu_chi_id && row.cap_hoc === assignment.cap_hoc,
        );
        return {
          assignment,
          assessment,
          evidenceCount: assessment ? evidenceCounts.get(assessment.id) ?? 0 : 0,
        };
      }),
    );

    const [{ count: evidenceCount }, { count: assessmentCount }, { count: reportCount }] =
      await Promise.all([
        supabase
          .from("minh_chung")
          .select("id", { count: "exact", head: true })
          .eq("co_so_id", profile.co_so_id)
          .eq("nam_hoc_id", activeYear.id)
          .eq("trang_thai_xac_minh", "cho_xac_minh")
          .is("deleted_at", null),
        supabase
          .from("tu_danh_gia")
          .select("id", { count: "exact", head: true })
          .eq("co_so_id", profile.co_so_id)
          .eq("nam_hoc_id", activeYear.id)
          .eq("trang_thai", "cho_duyet"),
        supabase
          .from("bao_cao")
          .select("id", { count: "exact", head: true })
          .eq("co_so_id", profile.co_so_id)
          .eq("nam_hoc_id", activeYear.id)
          .eq("trang_thai", "cho_duyet"),
      ]);

    setPendingEvidence(evidenceCount ?? 0);
    setPendingAssessments(assessmentCount ?? 0);
    setPendingReports(reportCount ?? 0);
    setLoadingWork(false);
  }, [activeYear, profile, setMessage, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadWork();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadWork]);

  if (loading || loadingWork) {
    return <LoadingState label="Đang tải việc của bạn…" />;
  }

  if (!profile || !activeYear) {
    return (
      <EmptyState
        title="Chưa có năm học đang làm việc"
        description="Hãy thiết lập đơn vị và năm học trước khi xem danh sách công việc."
        action={<ButtonLink href="/thiet-lap">Thiết lập ngay</ButtonLink>}
      />
    );
  }

  return (
    <div className="grid gap-6">
      {message ? <Alert tone="warning">{message}</Alert> : null}

      <section className="featured-card grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm text-white/72">{activeYear.ten}</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Bắt đầu từ những việc đang chờ bạn.</h2>
          <p className="mt-3 text-sm leading-6 text-white/78">
            Màn hình này gom tiêu chí được phân công, minh chứng cần xử lý và các hồ sơ chờ duyệt theo vai trò hiện tại.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {roles.length === 0 ? <Badge>Chưa có vai trò</Badge> : roles.map((role) => <Badge key={role.ma}>{role.ten}</Badge>)}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <ActionCard count={pendingEvidence} href="/minh-chung/xac-minh" label="Minh chứng chờ xác minh" />
        <ActionCard count={pendingAssessments} href="/tu-danh-gia/cho-duyet" label="Tiêu chí chờ duyệt" />
        <ActionCard count={pendingReports} href="/bao-cao" label="Báo cáo chờ duyệt" />
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">Tiêu chí được phân công</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">
            Giáo viên và ủy viên chỉ cần đi theo danh sách này, không phải tự dò toàn bộ 15 tiêu chí.
          </p>
        </div>
        {workItems.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="Bạn chưa có tiêu chí được phân công"
              description={
                isManager
                  ? "Bạn có vai trò quản lý nên có thể dùng các hàng đợi phía trên hoặc vào Cài đặt để phân công thêm."
                  : "Hãy liên hệ Thư ký hội đồng hoặc Hiệu trưởng để được phân công phạm vi công việc."
              }
              action={isManager ? <ButtonLink href="/thiet-lap" variant="secondary">Mở phân công</ButtonLink> : undefined}
            />
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {workItems.map((item) => {
              const criterion = first(item.assignment.tieu_chi);
              const standard = first(criterion?.tieu_chuan);
              const level = item.assessment?.muc_dat ?? 0;
              const status = item.assessment?.trang_thai ?? "chưa nhập";

              return (
                <article className="grid gap-4 px-5 py-4 lg:grid-cols-[1fr_auto]" key={item.assignment.id}>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold tabular-nums text-[var(--color-ink-navy)]">{criterion?.ma ?? "?"}</span>
                      {criterion?.la_bat_buoc ? <Badge tone="warning">Bắt buộc</Badge> : null}
                      <Badge>{capHocLabels[item.assignment.cap_hoc] ?? item.assignment.cap_hoc}</Badge>
                      <Badge>{assessmentStatusLabels[status] ?? status}</Badge>
                    </div>
                    <h3 className="mt-2 text-base font-semibold leading-7 text-[var(--color-ink-navy)]">
                      {criterion?.ten ?? "Tiêu chí không còn tồn tại"}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">
                      {standard ? `Tiêu chuẩn ${standard.so_thu_tu}: ${standard.ten}` : "Chưa xác định tiêu chuẩn"} ·
                      {" "}Mức hiện tại: {level === 0 ? "Chưa đạt" : `Mức ${level}`} ·
                      {" "}Minh chứng: {item.evidenceCount}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link className={canEditAssessment ? "button-secondary" : "button-primary"} href="/minh-chung/tao">
                      Nộp minh chứng
                    </Link>
                    {canEditAssessment ? (
                      <Link className="button-primary" href={`/tu-danh-gia?cap_hoc=${item.assignment.cap_hoc}&tieu_chi_id=${item.assignment.tieu_chi_id}`}>
                        Mở tự đánh giá
                      </Link>
                    ) : null}
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

function ActionCard({ count, href, label }: { count: number; href: string; label: string }) {
  return (
    <Link className="surface-card p-5 hover:border-[var(--color-electric-cobalt)]" href={href}>
      <p className="text-sm leading-6 text-[var(--color-graphite)]/70">{label}</p>
      <p className="mt-3 font-serif text-4xl font-medium text-[var(--color-ink-navy)]">{count}</p>
    </Link>
  );
}
