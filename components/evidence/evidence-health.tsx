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

    setYear(yearData as SchoolYear);

    const [{ data: evidenceData }, { data: schoolData }] = await Promise.all([
      supabase
        .from("minh_chung")
        .select("*")
        .eq("co_so_id", profile.co_so_id)
        .eq("nam_hoc_id", yearData.id)
        .is("deleted_at", null),
      supabase
        .from("co_so_giao_duc")
        .select("loai_hinh")
        .eq("id", profile.co_so_id)
        .maybeSingle(),
    ]);

    const { data: criterionData } = await supabase
      .from("tieu_chi")
      .select("id, ma, ten, la_bat_buoc, loai_hinh_ap_dung, tieu_chuan_id, tieu_chuan: tieu_chuan_id(so_thu_tu, ten)")
      .eq("loai_hinh_ap_dung", schoolData?.loai_hinh ?? "mam_non")
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
    setExpired(rows.filter((item) => item.ngay_het_gia_tri && item.ngay_het_gia_tri < today));
    setOrphans(rows.filter((item) => !links.some((link) => link.minh_chung_id === item.id)));

    const hashMap = new Map<string, Evidence[]>();
    for (const item of rows) {
      if (!item.hash_tep) {
        continue;
      }

      hashMap.set(item.hash_tep, [...(hashMap.get(item.hash_tep) ?? []), item]);
    }

    setDuplicateGroups([...hashMap.values()].filter((group) => group.length > 1));

    const linkedCriterionIds = new Set(links.map((link) => link.tieu_chi_id));
    setEmptyCriteria(
      ((criterionData ?? []) as unknown as Criterion[]).filter(
        (criterion) => !linkedCriterionIds.has(criterion.id),
      ),
    );

    await supabase.from("nhat_ky_truy_cap").insert({
      co_so_id: profile.co_so_id,
      nguoi_dung_id: profile.id,
      hanh_dong: "EVIDENCE_HEALTH_READ",
      doi_tuong: "minh_chung",
      du_lieu_moi: {
        nam_hoc_id: yearData.id,
        so_minh_chung: rows.length,
      },
    });
  }, [router, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadHealth();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadHealth]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap gap-3">
        <Link className="border border-[#17324d] px-4 py-2 text-sm font-semibold text-[#17324d]" href="/minh-chung">
          Quay lại kho
        </Link>
      </div>

      {message ? (
        <p className="border border-[#d8d6c9] bg-white px-4 py-3 text-sm text-[#52606d]">{message}</p>
      ) : null}

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
          <p className="text-sm text-[#52606d]">Không phát hiện nhóm trùng hash.</p>
        ) : (
          <div className="grid gap-4">
            {duplicateGroups.map((group) => (
              <div className="border border-[#e4e1d5] p-3" key={group[0].hash_tep ?? group[0].id}>
                <p className="break-all text-xs text-[#52606d]">{group[0].hash_tep}</p>
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
          <p className="text-sm text-[#52606d]">Tất cả tiêu chí đã có minh chứng.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {emptyCriteria.map((criterion) => (
              <div className="border border-[#e4e1d5] p-3 text-sm" key={criterion.id}>
                <strong className="text-[#17324d]">{criterion.ma}</strong>{" "}
                <span className="text-[#52606d]">{criterion.ten}</span>
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
    <div className="border border-[#d8d6c9] bg-white p-5">
      <p className="text-sm text-[#52606d]">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-[#17324d]">{value}</p>
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
    <section className="border border-[#d8d6c9] bg-white p-5">
      <h2 className="text-lg font-semibold text-[#17324d]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function EvidenceList({ items, empty }: { items: Evidence[]; empty?: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-[#52606d]">{empty ?? "Không có dữ liệu."}</p>;
  }

  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <Link
          className="border border-[#e4e1d5] p-3 text-sm text-[#17324d] hover:bg-[#f7f7f2]"
          href={`/minh-chung/${item.id}`}
          key={item.id}
        >
          <strong>{item.ma}</strong> - {item.ten}
        </Link>
      ))}
    </div>
  );
}
