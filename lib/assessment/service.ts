import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  CapHoc,
  KetQuaTieuChi,
  xacDinhMucToanTruongTuKetQua,
  xacDinhMucTuKetQua,
} from "./level-engine";

type SupabaseClient = ReturnType<typeof createBrowserSupabaseClient>;

export type TuDanhGiaRow = {
  id: string;
  co_so_id: string;
  nam_hoc_id: string;
  tieu_chi_id: string;
  cap_hoc: CapHoc;
  mo_ta_muc_1: string | null;
  dat_muc_1: boolean;
  mo_ta_muc_2: string | null;
  dat_muc_2: boolean;
  muc_dat: 0 | 1 | 2;
  ngay_cap_nhat: string;
};

export type CriterionForAssessment = {
  id: string;
  ma: string;
  ten: string;
  la_bat_buoc: boolean;
};

export type EvidenceCodeLink = {
  tieu_chi_id: string;
  ma: string;
};

export async function docDuLieuTinhMuc(
  supabase: SupabaseClient,
  coSoId: string,
  namHocId: string,
  capHoc: CapHoc,
) {
  const [
    { data: criteriaData, error: criteriaError },
    { data: assessmentData, error: assessmentError },
  ] =
    await Promise.all([
      supabase
        .from("v_tieu_chi_nam_hoc")
        .select("id, ma, ten, la_bat_buoc")
        .eq("co_so_id", coSoId)
        .eq("nam_hoc_id", namHocId)
        .order("ma", { ascending: true }),
      supabase
        .from("tu_danh_gia")
        .select("*")
        .eq("co_so_id", coSoId)
        .eq("nam_hoc_id", namHocId)
        .eq("cap_hoc", capHoc),
    ]);

  if (criteriaError) {
    throw criteriaError;
  }

  if (assessmentError) {
    throw assessmentError;
  }

  const { data: evidenceData, error: evidenceError } = await supabase
    .from("v_minh_chung_hop_le_danh_gia")
    .select("id, ma")
    .eq("co_so_id", coSoId)
    .eq("nam_hoc_id", namHocId)
    .order("ma", { ascending: true });

  if (evidenceError) {
    throw evidenceError;
  }

  const loadedAssessments = (assessmentData ?? []) as TuDanhGiaRow[];
  const assessmentIds = loadedAssessments.map((item) => item.id);
  const { data: evidenceLinks, error: evidenceLinkError } = assessmentIds.length
    ? await supabase
        .from("tu_danh_gia_minh_chung")
        .select("tu_danh_gia_id, minh_chung_id")
        .in("tu_danh_gia_id", assessmentIds)
    : { data: [], error: null };

  if (evidenceLinkError) {
    throw evidenceLinkError;
  }

  const evidenceByAssessment = new Map<string, string[]>();
  const evidenceCodeById = new Map((evidenceData ?? []).map((item) => [item.id, item.ma]));

  for (const link of evidenceLinks ?? []) {
    const evidenceCode = evidenceCodeById.get(link.minh_chung_id);

    if (!evidenceCode) continue;

    const current = evidenceByAssessment.get(link.tu_danh_gia_id) ?? [];
    current.push(evidenceCode);
    evidenceByAssessment.set(link.tu_danh_gia_id, current);
  }

  const assessments = loadedAssessments.reduce(
    (map, item) => map.set(item.tieu_chi_id, item),
    new Map<string, TuDanhGiaRow>(),
  );

  const ketQuaTieuChi = ((criteriaData ?? []) as CriterionForAssessment[]).map<KetQuaTieuChi>(
    (criterion) => {
      const row = assessments.get(criterion.id);

      return {
        id: criterion.id,
        ma: criterion.ma,
        ten: criterion.ten,
        laBatBuoc: criterion.la_bat_buoc,
        mucDat: row?.muc_dat ?? 0,
        moTaMuc1: row?.mo_ta_muc_1 ?? "",
        moTaMuc2: row?.mo_ta_muc_2 ?? "",
        maMinhChung: row ? evidenceByAssessment.get(row.id) ?? [] : [],
      };
    },
  );

  return { ketQuaTieuChi, assessments: Array.from(assessments.values()) };
}

export async function xacDinhMuc(
  coSoId: string,
  namHocId: string,
  capHoc: CapHoc,
  supabase = createBrowserSupabaseClient(),
) {
  const { ketQuaTieuChi } = await docDuLieuTinhMuc(supabase, coSoId, namHocId, capHoc);

  return xacDinhMucTuKetQua(ketQuaTieuChi);
}

export async function xacDinhMucToanTruong(
  coSoId: string,
  namHocId: string,
  capHocList: CapHoc[],
  supabase = createBrowserSupabaseClient(),
) {
  const cacCapHoc = await Promise.all(
    capHocList.map(async (capHoc) => {
      const { ketQuaTieuChi } = await docDuLieuTinhMuc(supabase, coSoId, namHocId, capHoc);

      return { capHoc, ketQuaTieuChi };
    }),
  );

  return xacDinhMucToanTruongTuKetQua(cacCapHoc);
}
