import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getTT57CriterionReference } from "@/lib/tt57/reference-data";
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
  loai_hinh_ap_dung: string;
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
    { data: schoolData, error: schoolError },
    { data: criteriaData, error: criteriaError },
    { data: assessmentData, error: assessmentError },
  ] =
    await Promise.all([
      supabase
        .from("co_so_giao_duc")
        .select("loai_hinh")
        .eq("id", coSoId)
        .maybeSingle(),
      supabase
        .from("tieu_chi")
        .select("id, ma, ten, la_bat_buoc, loai_hinh_ap_dung")
        .order("ma", { ascending: true }),
      supabase
        .from("tu_danh_gia")
        .select("*")
        .eq("co_so_id", coSoId)
        .eq("nam_hoc_id", namHocId)
        .eq("cap_hoc", capHoc),
    ]);

  if (schoolError) {
    throw schoolError;
  }

  if (criteriaError) {
    throw criteriaError;
  }

  if (assessmentError) {
    throw assessmentError;
  }

  const { data: evidenceData, error: evidenceError } = await supabase
    .from("minh_chung")
    .select("id, ma, minh_chung_tieu_chi(tieu_chi_id)")
    .eq("co_so_id", coSoId)
    .eq("nam_hoc_id", namHocId)
    .is("deleted_at", null);

  if (evidenceError) {
    throw evidenceError;
  }

  const evidenceByCriterion = new Map<string, string[]>();

  for (const item of evidenceData ?? []) {
    const links = (item.minh_chung_tieu_chi ?? []) as { tieu_chi_id: string }[];

    for (const link of links) {
      const current = evidenceByCriterion.get(link.tieu_chi_id) ?? [];
      current.push(item.ma);
      evidenceByCriterion.set(link.tieu_chi_id, current);
    }
  }

  const assessments = ((assessmentData ?? []) as TuDanhGiaRow[]).reduce(
    (map, item) => map.set(item.tieu_chi_id, item),
    new Map<string, TuDanhGiaRow>(),
  );

  // TT57 có 3 phụ lục riêng; engine chỉ tính trên bộ tiêu chí đúng loại hình của cơ sở.
  const criteriaForSchool = ((criteriaData ?? []) as CriterionForAssessment[]).filter(
    (criterion) => criterion.loai_hinh_ap_dung === (schoolData?.loai_hinh ?? "mam_non"),
  );

  const ketQuaTieuChi = criteriaForSchool.map<KetQuaTieuChi>(
    (criterion) => {
      const row = assessments.get(criterion.id);
      const reference = getTT57CriterionReference(schoolData?.loai_hinh, criterion.ma);

      return {
        id: criterion.id,
        ma: criterion.ma,
        ten: reference?.ten ?? criterion.ten,
        laBatBuoc: reference?.la_bat_buoc ?? criterion.la_bat_buoc,
        mucDat: row?.muc_dat ?? 0,
        moTaMuc1: row?.mo_ta_muc_1 ?? "",
        moTaMuc2: row?.mo_ta_muc_2 ?? "",
        maMinhChung: evidenceByCriterion.get(criterion.id) ?? [],
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
