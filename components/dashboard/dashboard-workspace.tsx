"use client";

import { toUserMessage } from "@/lib/errors/user-message";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CapHoc, KetQuaTieuChi, xacDinhMucToanTruongTuKetQua } from "@/lib/assessment/level-engine";
import { docDuLieuTinhMuc } from "@/lib/assessment/service";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAppContext } from "@/components/shared/use-app-context";

type RoleLabel = {
  ma: string;
  ten: string;
};

type PendingCounts = {
  assessments: number;
  evidence: number;
  reports: number;
};

const managerRoles = new Set(["PRINCIPAL", "SELF_ASSESSMENT_CHAIR", "SECRETARY", "SYSTEM_ADMIN"]);

export function DashboardWorkspace() {
  const { activeYear, loading, message, profile, school, setMessage, supabase } = useAppContext();
  const [roles, setRoles] = useState<RoleLabel[]>([]);
  const [resultsByCapHoc, setResultsByCapHoc] = useState<Map<CapHoc, KetQuaTieuChi[]>>(new Map());
  const [pendingCounts, setPendingCounts] = useState<PendingCounts>({ assessments: 0, evidence: 0, reports: 0 });
  const [loadingData, setLoadingData] = useState(false);

  const capHocList = useMemo(
    () => ((school?.cap_hoc?.length ? school.cap_hoc : [school?.loai_hinh ?? "mam_non"]) as CapHoc[]),
    [school],
  );
  const isManager = roles.some((role) => managerRoles.has(role.ma));
  const result = xacDinhMucToanTruongTuKetQua(
    capHocList.map((capHoc) => ({ capHoc, ketQuaTieuChi: resultsByCapHoc.get(capHoc) ?? [] })),
  );
  const blockers = result.chanLenMucTiepTheo.slice(0, 6);
  const completedCriteria = Array.from(resultsByCapHoc.values())
    .flat()
    .filter((item) => item.mucDat > 0 && (item.maMinhChung?.length ?? 0) > 0).length;
  const totalCriteriaByCap = capHocList.length * 15;

  const loadDashboard = useCallback(async () => {
    if (!supabase || !profile || !school || !activeYear) {
      return;
    }

    setLoadingData(true);
    setMessage("");

    const { data: roleData } = await supabase.rpc("fn_user_role_labels");
    setRoles((roleData ?? []) as RoleLabel[]);

    try {
      const [levelData, { count: evidenceCount }, { count: assessmentCount }, { count: reportCount }] =
        await Promise.all([
          Promise.all(
            capHocList.map(async (capHoc) => ({
              capHoc,
              ...(await docDuLieuTinhMuc(supabase, profile.co_so_id, activeYear.id, capHoc)),
            })),
          ),
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

      setResultsByCapHoc(new Map(levelData.map((item) => [item.capHoc, item.ketQuaTieuChi])));
      setPendingCounts({
        assessments: assessmentCount ?? 0,
        evidence: evidenceCount ?? 0,
        reports: reportCount ?? 0,
      });
    } catch (error) {
      setResultsByCapHoc(new Map());
      setMessage(toUserMessage(error, "Không tải được dữ liệu tổng quan. Vui lòng thử lại."));
    }
    setLoadingData(false);
  }, [activeYear, capHocList, profile, school, setMessage, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  if (loading || loadingData) {
    return <LoadingState label="Đang tải tổng quan dữ liệu thật…" />;
  }

  if (!profile || !school || !activeYear) {
    return (
      <EmptyState
        title="Chưa có dữ liệu tổng quan"
        description="Hãy thiết lập đơn vị và năm học đang hoạt động trước khi xem dashboard."
        action={<Link className="button-primary" href="/thiet-lap">Thiết lập ngay</Link>}
      />
    );
  }

  return (
    <div className="grid gap-6">
      {message ? <Alert tone="warning">{message}</Alert> : null}

      <section className="featured-card grid gap-6 lg:grid-cols-[1fr_340px] lg:items-end">
        <div>
          <p className="text-sm text-white/72">{school.ten} · {activeYear.ten}</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">{result.mucDat}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/78">{result.lyDo}</p>
          <p className="mt-2 text-sm font-semibold text-white">{result.khoangCach}</p>
        </div>
        <div className="grid gap-2 rounded-[var(--radius-card)] bg-white/10 p-4 text-sm text-white">
          <p className="text-white/72">Vai trò hiện tại</p>
          <div className="flex flex-wrap gap-2">
            {roles.length === 0 ? <StatusBadge>Chưa có vai trò</StatusBadge> : roles.map((role) => (
              <StatusBadge key={role.ma} tone={managerRoles.has(role.ma) ? "info" : "default"}>{role.ten}</StatusBadge>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <MetricCard href="/tu-danh-gia" label="Tiêu chí theo cấp có dữ liệu" value={`${completedCriteria}/${totalCriteriaByCap}`} />
        <MetricCard href="/minh-chung/xac-minh" label="Minh chứng chờ xác minh" value={pendingCounts.evidence} />
        <MetricCard href="/tu-danh-gia/cho-duyet" label="Tiêu chí chờ duyệt" value={pendingCounts.assessments} />
        <MetricCard href="/bao-cao" label="Báo cáo chờ duyệt" value={pendingCounts.reports} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="surface-card overflow-hidden">
          <div className="border-b border-[var(--color-border)] px-5 py-4">
            <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">Việc đang chặn mức tiếp theo</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">
              Danh sách lấy trực tiếp từ engine tính mức, không nhập tay trên dashboard.
            </p>
          </div>
          {blockers.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="Không còn điểm chặn chính"
                description="Trường đang đạt mức cao nhất theo dữ liệu hiện tại. Hãy duy trì minh chứng và rà soát báo cáo trước khi phê duyệt."
              />
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {blockers.map((blocker) => (
                <div className="grid gap-2 px-5 py-3 sm:grid-cols-[auto_1fr_auto] sm:items-center" key={blocker}>
                  <StatusBadge tone="danger">Cần xử lý</StatusBadge>
                  <p className="text-sm font-medium text-[var(--color-ink-navy)]">{blocker}</p>
                  <Link className="button-secondary" href="/tu-danh-gia">Mở tự đánh giá</Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="surface-card grid content-start gap-3 p-5">
          <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">Bước tiếp theo</h2>
          <p className="text-sm leading-6 text-[var(--color-graphite)]/70">
            {isManager
              ? "Ưu tiên xử lý các hàng đợi chờ duyệt, sau đó kiểm tra mức sẵn sàng của Mẫu 1."
              : "Ưu tiên hoàn thành tiêu chí được phân công và nộp minh chứng đúng phạm vi công việc."}
          </p>
          <Link className="button-primary" href={isManager ? "/bao-cao" : "/viec-cua-toi"}>
            {isManager ? "Kiểm tra báo cáo" : "Xem việc của tôi"}
          </Link>
          <Link className="button-secondary" href="/minh-chung/suc-khoe">
            Kiểm tra tình trạng minh chứng
          </Link>
        </aside>
      </section>
    </div>
  );
}

function MetricCard({ href, label, value }: { href: string; label: string; value: number | string }) {
  return (
    <Link className="surface-card p-4 hover:border-[var(--color-electric-cobalt)]" href={href}>
      <p className="text-sm leading-6 text-[var(--color-graphite)]/70">{label}</p>
      <p className="mt-2 font-serif text-3xl font-semibold text-[var(--color-ink-navy)]">{value}</p>
    </Link>
  );
}
