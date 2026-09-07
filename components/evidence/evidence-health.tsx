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
  SchoolYear,
} from "@/lib/evidence";
import { Alert } from "@/components/ui/alert";
import { EvidenceSubnav } from "@/components/evidence/evidence-subnav";
import { StorageOrphanMaintenance } from "@/components/evidence/storage-orphan-maintenance";
import { LoadingState } from "@/components/ui/loading-state";
import { toUserMessage } from "@/lib/errors/user-message";

type HealthResult = {
  expired: Evidence[];
  orphans: Evidence[];
  duplicate_groups: Array<{ hash_tep: string; items: Evidence[] }>;
  empty_criteria: Array<Criterion & { tieu_chuan_so_thu_tu: number; tieu_chuan_ten: string }>;
};

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
  const [loading, setLoading] = useState(true);

  const loadHealth = useCallback(async () => {
    if (!supabase) {
      setMessage("Chưa cấu hình Supabase trong .env.local.");
      setLoading(false);
      return;
    }

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      router.replace("/login");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("nguoi_dung")
      .select("id, co_so_id")
      .eq("auth_user_id", userData.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      setMessage(toUserMessage(profileError, "Bạn cần thiết lập cơ sở giáo dục trước."));
      setLoading(false);
      return;
    }

    const { data: yearData, error: yearError } = await supabase
      .from("nam_hoc")
      .select("id, ten, trang_thai")
      .eq("co_so_id", profile.co_so_id)
      .eq("trang_thai", "dang_hoat_dong")
      .maybeSingle();

    if (yearError || !yearData) {
      setMessage(toUserMessage(yearError, "Chưa có năm học đang hoạt động."));
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.rpc("fn_suc_khoe_minh_chung", {
      p_nam_hoc_id: yearData.id,
    });

    if (error || !data) {
      setMessage(toUserMessage(error, "Không tổng hợp được sức khỏe minh chứng. Vui lòng thử lại."));
      setLoading(false);
      return;
    }

    const health = data as HealthResult;
    const emptyCriterionRows = health.empty_criteria.map((criterion) => ({
      ...criterion,
      tieu_chuan: {
        so_thu_tu: criterion.tieu_chuan_so_thu_tu,
        ten: criterion.tieu_chuan_ten,
      },
    }));

    setYear(yearData as SchoolYear);
    setExpired(health.expired);
    setOrphans(health.orphans);
    setDuplicateGroups(health.duplicate_groups.map((group) => group.items));
    setEmptyCriteria(emptyCriterionRows);
    setLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadHealth();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadHealth]);

  if (loading) return <LoadingState label="Đang kiểm tra sức khỏe minh chứng…" />;

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
        <Metric label="Dữ liệu trùng lặp" value={duplicateGroups.length} />
        <Metric label="Mồ côi" value={orphans.length} />
        <Metric label="Tiêu chí rỗng" value={emptyCriteria.length} />
      </section>

      <StorageOrphanMaintenance />

      <HealthPanel title={`Minh chứng hết hiệu lực${year ? ` - ${year.ten}` : ""}`}>
        <EvidenceList items={expired} empty="Không có minh chứng hết hiệu lực." />
      </HealthPanel>

      <HealthPanel title="Minh chứng trùng lặp theo SHA-256">
        {duplicateGroups.length === 0 ? (
          <p className="text-sm text-[var(--color-graphite)]/70">Không phát hiện dữ liệu trùng lặp.</p>
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
