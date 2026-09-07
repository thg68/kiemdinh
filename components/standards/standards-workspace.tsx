"use client";

import { toUserMessage } from "@/lib/errors/user-message";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useAppContext } from "@/components/shared/use-app-context";

type StandardSet = {
  id: string;
  ma_van_ban: string;
  ten: string;
  version: number;
  trang_thai: string;
  loai_hinh: string;
};

type Standard = {
  id: string;
  so_thu_tu: number;
  ten: string;
};

type CriterionLevel = {
  muc: 1 | 2;
  noi_dung_yeu_cau: string;
};

type EvidenceSuggestion = {
  mo_ta: string;
  nhom_noi_dung: string | null;
  thu_tu: number;
};

type QuantMetric = {
  ten_chi_so: string;
  don_vi: string | null;
  cong_thuc: string | null;
  thu_tu: number;
};

type Criterion = {
  id: string;
  tieu_chuan_id: string;
  ma: string;
  ten: string;
  la_bat_buoc: boolean;
  thu_tu: number;
  muc_tieu_chi?: CriterionLevel[];
  minh_chung_goi_y?: EvidenceSuggestion[];
  chi_so_dinh_luong?: QuantMetric[];
};

function normalizeText(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

const statusLabels: Record<string, { label: string; tone: "neutral" | "success" | "warning" }> = {
  dang_ap_dung: { label: "Đang áp dụng", tone: "success" },
  da_khoa: { label: "Đã khóa", tone: "neutral" },
  du_thao: { label: "Dự thảo", tone: "warning" },
  het_hieu_luc: { label: "Hết hiệu lực", tone: "neutral" },
};

function formatStatus(status: string) {
  return statusLabels[status] ?? { label: status, tone: "neutral" as const };
}

export function StandardsWorkspace() {
  const { activeYear, loading, message, school, setMessage, supabase } = useAppContext();
  const [standardSet, setStandardSet] = useState<StandardSet | null>(null);
  const [standards, setStandards] = useState<Standard[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [selectedStandard, setSelectedStandard] = useState("all");
  const [filter, setFilter] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [loadingStandards, setLoadingStandards] = useState(false);

  const loadStandards = useCallback(async () => {
    if (!supabase || !school || !activeYear) {
      setStandardSet(null);
      setStandards([]);
      setCriteria([]);
      return;
    }

    setLoadingStandards(true);
    setMessage("");

    const { data: setData, error: setError } = await supabase
      .from("bo_tieu_chuan")
      .select("id, ma_van_ban, ten, version, trang_thai, loai_hinh")
      .eq("id", activeYear.bo_tieu_chuan_id)
      .eq("loai_hinh", school.loai_hinh)
      .maybeSingle();

    if (setError || !setData) {
      setMessage(toUserMessage(setError, "Năm học này chưa được gắn với bộ tiêu chuẩn phù hợp."));
      setLoadingStandards(false);
      return;
    }

    const { data: standardData, error: standardError } = await supabase
      .from("tieu_chuan")
      .select("id, so_thu_tu, ten")
      .eq("bo_id", setData.id)
      .order("so_thu_tu", { ascending: true });

    if (standardError) {
      setMessage(toUserMessage(standardError, "Không tải được danh sách tiêu chuẩn. Vui lòng thử lại."));
      setLoadingStandards(false);
      return;
    }

    const standardIds = ((standardData ?? []) as Standard[]).map((item) => item.id);
    const { data: criterionData, error: criterionError } =
      standardIds.length > 0
        ? await supabase
            .from("tieu_chi")
            .select(
              "id, tieu_chuan_id, ma, ten, la_bat_buoc, thu_tu, muc_tieu_chi(muc, noi_dung_yeu_cau), minh_chung_goi_y(mo_ta, nhom_noi_dung, thu_tu), chi_so_dinh_luong(ten_chi_so, don_vi, cong_thuc, thu_tu)",
            )
            .in("tieu_chuan_id", standardIds)
            .order("ma", { ascending: true })
        : { data: [], error: null };

    if (criterionError) {
      setMessage(toUserMessage(criterionError, "Không tải được danh sách tiêu chí. Vui lòng thử lại."));
      setLoadingStandards(false);
      return;
    }

    setStandardSet(setData as StandardSet);
    setStandards((standardData ?? []) as Standard[]);
    setCriteria((criterionData ?? []) as Criterion[]);
    setLoadingStandards(false);
  }, [activeYear, school, setMessage, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadStandards();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadStandards]);

  const filteredCriteria = useMemo(() => {
    const normalizedKeyword = normalizeText(keyword.trim());

    return criteria.filter((criterion) => {
      const matchesStandard =
        selectedStandard === "all" || criterion.tieu_chuan_id === selectedStandard;
      const matchesFilter =
        filter === "all" ||
        (filter === "required" && criterion.la_bat_buoc) ||
        (filter === "optional" && !criterion.la_bat_buoc);
      const matchesKeyword =
        !normalizedKeyword ||
        normalizeText(`${criterion.ma} ${criterion.ten}`).includes(normalizedKeyword);

      return matchesStandard && matchesFilter && matchesKeyword;
    });
  }, [criteria, filter, keyword, selectedStandard]);

  if (loading || loadingStandards) {
    return <LoadingState label="Đang tải bộ tiêu chuẩn TT57…" />;
  }

  return (
    <div className="grid gap-6">
      {message ? <Alert tone="warning">{message}</Alert> : null}

      {standardSet ? (
        <section className="featured-card grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <span className="inline-block rounded bg-white/10 px-2.5 py-0.5 font-mono text-xs font-medium text-white/80 border border-white/15">
              {standardSet.ma_van_ban}
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">{standardSet.ten}</h2>
            <p className="mt-2 text-sm leading-6 text-white/78">
              Nội dung tiêu chuẩn được đọc từ bảng dữ liệu có phiên bản. Màn hình này chỉ để tra cứu, không phải nơi nhập báo cáo.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-end">
            {(() => {
              const { label, tone } = formatStatus(standardSet.trang_thai);
              const bgClass =
                tone === "success"
                  ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/30"
                  : tone === "warning"
                  ? "bg-amber-500/20 text-amber-200 border-amber-400/30"
                  : "bg-white/10 text-white/80 border-white/20";
              return (
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border backdrop-blur-md ${bgClass}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {label}
                </span>
              );
            })()}
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 border border-white/20">
              Phiên bản {standardSet.version}
            </span>
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 border border-white/20">
              Năm học {activeYear?.ten}
            </span>
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 border border-white/20">
              {criteria.length} tiêu chí
            </span>
          </div>
        </section>
      ) : null}

      <section className="surface-card grid gap-3 p-5 lg:grid-cols-[1fr_180px_180px]">
        <label className="text-sm font-medium">
          Tìm tiêu chí
          <input
            className="form-control mt-2"
            placeholder="Ví dụ: 4.1 hoặc an toàn"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </label>
        <label className="text-sm font-medium">
          Tiêu chuẩn
          <select
            className="form-control mt-2"
            value={selectedStandard}
            onChange={(event) => setSelectedStandard(event.target.value)}
          >
            <option value="all">Tất cả</option>
            {standards.map((standard) => (
              <option key={standard.id} value={standard.id}>
                Tiêu chuẩn {standard.so_thu_tu}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Loại tiêu chí
          <select
            className="form-control mt-2"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="required">Bắt buộc</option>
            <option value="optional">Còn lại</option>
          </select>
        </label>
      </section>

      {filteredCriteria.length === 0 ? (
        <EmptyState
          title="Không tìm thấy tiêu chí phù hợp"
          description="Hãy đổi từ khóa hoặc bỏ bớt bộ lọc để xem lại danh sách tiêu chí."
        />
      ) : (
        <div className="grid gap-4">
          {standards.map((standard) => {
            const standardCriteria = filteredCriteria
              .filter((criterion) => criterion.tieu_chuan_id === standard.id)
              .sort((a, b) => a.thu_tu - b.thu_tu);

            if (standardCriteria.length === 0) {
              return null;
            }

            return (
              <section className="surface-card overflow-hidden" key={standard.id}>
                <div className="border-b border-[var(--color-border)] px-5 py-4">
                  <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">
                    Tiêu chuẩn {standard.so_thu_tu}: {standard.ten}
                  </h2>
                </div>
                <div className="grid gap-4 p-5">
                  {standardCriteria.map((criterion) => (
                    <CriterionCard criterion={criterion} key={criterion.id} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CriterionCard({ criterion }: { criterion: Criterion }) {
  const levels = [...(criterion.muc_tieu_chi ?? [])].sort((a, b) => a.muc - b.muc);
  const suggestions = [...(criterion.minh_chung_goi_y ?? [])].sort((a, b) => a.thu_tu - b.thu_tu);
  const metrics = [...(criterion.chi_so_dinh_luong ?? [])].sort((a, b) => a.thu_tu - b.thu_tu);

  return (
    <article className="surface-card p-4">
      <div className="grid gap-3 lg:grid-cols-[180px_1fr]">
        <div>
          <p className="font-semibold tabular-nums text-[var(--color-ink-navy)]">{criterion.ma}</p>
          <div className="mt-2">
            {criterion.la_bat_buoc ? <Badge tone="warning">Bắt buộc</Badge> : <Badge>Tiêu chí còn lại</Badge>}
          </div>
        </div>
        <div className="grid gap-4">
          <h3 className="text-lg font-semibold leading-7 text-[var(--color-ink-navy)]">{criterion.ten}</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {levels.map((level) => (
              <section
                className="rounded-[var(--radius-card)] bg-[var(--color-lavender-mist)]/55 p-4"
                key={level.muc}
              >
                <h4 className="text-sm font-semibold text-[var(--color-ink-navy)]">Mức {level.muc}</h4>
                <p className="mt-2 text-sm leading-7 text-[var(--color-graphite)]/82">
                  {level.noi_dung_yeu_cau || "Chưa có nội dung yêu cầu trong dữ liệu."}
                </p>
              </section>
            ))}
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <InfoList title="Minh chứng gợi ý" empty="Chưa có gợi ý minh chứng." items={suggestions.map((item) => item.mo_ta)} />
            <InfoList
              title="Chỉ số định lượng"
              empty="Chưa có chỉ số định lượng."
              items={metrics.map((item) =>
                item.don_vi ? `${item.ten_chi_so} (${item.don_vi})` : item.ten_chi_so,
              )}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function InfoList({ empty, items, title }: { empty: string; items: string[]; title: string }) {
  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] p-4">
      <h4 className="text-sm font-semibold text-[var(--color-ink-navy)]">{title}</h4>
      {items.length === 0 ? (
        <p className="mt-2 text-sm leading-6 text-[var(--color-graphite)]/70">{empty}</p>
      ) : (
        <ul className="mt-2 grid gap-2 text-sm leading-6 text-[var(--color-graphite)]/78">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
