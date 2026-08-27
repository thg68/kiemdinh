"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import {
  Criterion,
  Evidence,
  EvidenceCriterionLink,
  SchoolYear,
  todayIsoDate,
} from "@/lib/evidence";
import { Alert } from "@/components/ui/alert";
import { EvidenceSubnav } from "@/components/evidence/evidence-subnav";

export function EvidenceHealth() {
  const router = useRouter();
  const supabase = useMemo(() => {
    if (!isSupabaseConfigured()) {
      return null;
    }

    return createBrowserSupabaseClient();
  }, []);
  const [message, setMessage] = useState("");
  const [year, setYear] = useState<SchoolYear | null>(null);
  const [expired, setExpired] = useState<Evidence[]>([]);
  const [orphans, setOrphans] = useState<Evidence[]>([]);
  const [duplicateGroups, setDuplicateGroups] = useState<Evidence[][]>([]);
  const [emptyCriteria, setEmptyCriteria] = useState<Criterion[]>([]);

  const loadHealth = useCallback(async () => {
    if (!supabase) {
      setMessage("Chưa cấu hình Supabase trong .env.local.");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      router.replace("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("nguoi_dung")
      .select("id, co_so_id")
      .eq("auth_user_id", userData.user.id)
      .maybeSingle();

    if (!profile) {
      setMessage("Bạn cần thiết lập cơ sở giáo dục trước.");
      return;
    }

    const { data: yearData } = await supabase
      .from("nam_hoc")
      .select("id, ten, trang_thai")
      .eq("co_so_id", profile.co_so_id)
      .eq("trang_thai", "dang_hoat_dong")
      .maybeSingle();

    if (!yearData) {
      setMessage("Chưa có năm học đang hoạt động.");
      return;
    }

    const { data: evidenceData } = await supabase
      .from("minh_chung")
      .select("*")
      .eq("co_so_id", profile.co_so_id)
      .eq("nam_hoc_id", yearData.id)
      .is("deleted_at", null);

    const { data: criterionData } = await supabase
      .from("v_tieu_chi_nam_hoc")
      .select("id, ma, ten, la_bat_buoc, loai_hinh_ap_dung, tieu_chuan_id, tieu_chuan_so_thu_tu, tieu_chuan_ten")
      .eq("co_so_id", profile.co_so_id)
      .eq("nam_hoc_id", yearData.id)
      .order("ma", { ascending: true });

    const rows = (evidenceData ?? []) as Evidence[];
    const ids = rows.map((item) => item.id);
    const { data: linkData } =
      ids.length > 0
        ? await supabase
            .from("minh_chung_tieu_chi")
            .select(
              "minh_chung_id, tieu_chi_id, la_tieu_chi_goc, tieu_chi: tieu_chi_id(id, ma, ten, la_bat_buoc, tieu_chuan_id)",
            )
            .in("minh_chung_id", ids)
        : { data: [] };

    const links = (linkData ?? []) as unknown as EvidenceCriterionLink[];
    const today = todayIsoDate();
    const expiredRows = rows.filter((item) => item.ngay_het_gia_tri && item.ngay_het_gia_tri < today);
    const orphanRows = rows.filter((item) => !links.some((link) => link.minh_chung_id === item.id));

    const hashMap = new Map<string, Evidence[]>();
    for (const item of rows) {
      if (!item.hash_tep) {
        continue;
      }

      hashMap.set(item.hash_tep, [...(hashMap.get(item.hash_tep) ?? []), item]);
    }

    const duplicateRows = [...hashMap.values()].filter((group) => group.length > 1);

    const linkedCriterionIds = new Set(links.map((link) => link.tieu_chi_id));
    const emptyCriterionRows = ((criterionData ?? []) as unknown as (Criterion & {
      tieu_chuan_so_thu_tu: number;
      tieu_chuan_ten: string;
    })[])
      .filter((criterion) => !linkedCriterionIds.has(criterion.id))
      .map((criterion) => ({
        ...criterion,
        tieu_chuan: {
          so_thu_tu: criterion.tieu_chuan_so_thu_tu,
          ten: criterion.tieu_chuan_ten,
        },
      }));

    const { error: auditError } = await supabase.rpc("fn_log_user_access", {
      p_hanh_dong: "EVIDENCE_HEALTH_READ",
      p_doi_tuong_id: null,
      p_du_lieu_moi: {
        nam_hoc_id: yearData.id,
        so_minh_chung: rows.length,
      },
    });

    if (auditError) {
      setMessage("Không ghi được nhật ký truy cập. Vui lòng tải lại trang.");
      return;
    }

    setYear(yearData as SchoolYear);
    setExpired(expiredRows);
    setOrphans(orphanRows);
    setDuplicateGroups(duplicateRows);
    setEmptyCriteria(emptyCriterionRows);
  }, [router, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadHealth();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadHealth]);

  return (
    <div className="grid gap-6">
      <EvidenceSubnav active="health" />

      <div className="hidden">
        <Link className="button-secondary" href="/minh-chung">
          Quay lại kho
        </Link>
      </div>

      {message ? <Alert tone="warning">{message}</Alert> : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Hết hiệu lực" value={expired.length} />
        <Metric label="Nhóm trùng hash" value={duplicateGroups.length} />
        <Metric label="Mồ côi" value={orphans.length} />
        <Metric label="Tiêu chí rỗng" value={emptyCriteria.length} />
      </section>

      <HealthPanel title={`Minh chứng hết hiệu lực${year ? ` - ${year.ten}` : ""}`}>
        <EvidenceList items={expired} empty="Không có minh chứng hết hiệu lực." />
      </HealthPanel>

      <HealthPanel title="Minh chứng trùng lặp theo SHA-256">
        {duplicateGroups.length === 0 ? (
          <p className="text-sm text-[var(--color-graphite)]/70">Không phát hiện nhóm trùng hash.</p>
        ) : (
          <div className="grid gap-4">
            {duplicateGroups.map((group) => (
              <div className="surface-card p-3" key={group[0].hash_tep ?? group[0].id}>
                <p className="break-all text-xs text-[var(--color-graphite)]/70">{group[0].hash_tep}</p>
                <EvidenceList items={group} />
              </div>
            ))}
          </div>
        )}
      </HealthPanel>

      <HealthPanel title="Minh chứng mồ côi">
        <EvidenceList items={orphans} empty="Không có minh chứng mồ côi." />
      </HealthPanel>

      <HealthPanel title="Tiêu chí chưa có minh chứng">
        {emptyCriteria.length === 0 ? (
          <p className="text-sm text-[var(--color-graphite)]/70">Tất cả tiêu chí đã có minh chứng.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {emptyCriteria.map((criterion) => (
              <div className="surface-card p-3 text-sm" key={criterion.id}>
                <strong className="text-[var(--color-ink-navy)]">{criterion.ma}</strong>{" "}
                <span className="text-[var(--color-graphite)]/70">{criterion.ten}</span>
              </div>
            ))}
          </div>
        )}
      </HealthPanel>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface-card p-5">
      <p className="text-sm text-[var(--color-graphite)]/70">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-[var(--color-ink-navy)]">{value}</p>
    </div>
  );
}

function HealthPanel({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="surface-card surface-card-pad">
      <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function EvidenceList({ items, empty }: { items: Evidence[]; empty?: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-[var(--color-graphite)]/70">{empty ?? "Không có dữ liệu."}</p>;
  }

  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <Link
          className="surface-card p-3 text-sm text-[var(--color-ink-navy)] hover:border-[var(--color-electric-cobalt)] hover:bg-[var(--color-lavender-mist)]/45"
          href={`/minh-chung/${item.id}`}
          key={item.id}
        >
          <strong>{item.ma}</strong> - {item.ten}
        </Link>
      ))}
    </div>
  );
}
