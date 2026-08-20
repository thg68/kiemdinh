import { createClient } from "@supabase/supabase-js";
import { CapHoc, KetQuaTieuChi, xacDinhMucTuKetQua } from "@/lib/assessment/level-engine";

export type ReportSupabaseClient = ReturnType<typeof createRequestSupabaseClient>;

export type ReportProfile = {
  id: string;
  co_so_id: string;
  ho_ten: string;
};

export type ReportSchool = {
  id: string;
  ten: string;
  ma_truong: string | null;
  loai_hinh: string;
  cap_hoc: CapHoc[];
  dia_chi: string | null;
  co_quan_quan_ly: string | null;
};

export type ReportSchoolYear = {
  id: string;
  ten: string;
  ngay_bat_dau: string;
  ngay_ket_thuc: string;
  trang_thai: string;
};

export type ReportStandard = {
  id: string;
  so_thu_tu: number;
  ten: string;
};

export type ReportCriterion = {
  id: string;
  ma: string;
  ten: string;
  la_bat_buoc: boolean;
  tieu_chuan_id: string;
  tieu_chuan?: ReportStandard;
  muc_1: string;
  muc_2: string;
};

export type ReportAssessment = {
  id: string;
  tieu_chi_id: string;
  cap_hoc: CapHoc;
  mo_ta_muc_1: string | null;
  dat_muc_1: boolean;
  mo_ta_muc_2: string | null;
  dat_muc_2: boolean;
  muc_dat: 0 | 1 | 2;
};

export type ReportEvidence = {
  id: string;
  ma: string;
  ten: string;
  loai_tep: string | null;
  duong_dan: string | null;
  storage_path: string | null;
  hash_tep: string | null;
  kich_thuoc: number | null;
  ngay_ban_hanh: string | null;
  ngay_het_gia_tri: string | null;
  ghi_chu: string | null;
  tieuChiIds: string[];
};

export type ImprovementPlan = {
  id: string;
  tieu_chuan_id: string | null;
  tieu_chi_id: string | null;
  noi_dung: string | null;
  muc_tieu: string | null;
  hoat_dong: string | null;
  chi_so_ket_qua: string | null;
  thoi_gian_bat_dau: string | null;
  thoi_gian_ket_thuc: string | null;
  nguon_luc: string | null;
  minh_chung_du_kien: string | null;
  muc_do_thuc_hien: string | null;
  ghi_chu: string | null;
  phu_trach?: { ho_ten: string } | null;
};

export type CouncilMember = {
  ho_ten: string;
  chuc_vu: string | null;
  vai_tro_hoi_dong: string;
  thu_tu: number;
};

export type StandardNote = {
  id: string;
  tieu_chuan_id: string;
  cap_hoc: CapHoc;
  diem_manh_noi_bat: string | null;
  han_che_trong_tam: string | null;
  dinh_huong_cai_tien: string | null;
};

export type ReportData = {
  profile: ReportProfile;
  school: ReportSchool;
  year: ReportSchoolYear;
  capHoc: CapHoc;
  standards: ReportStandard[];
  criteria: ReportCriterion[];
  assessments: ReportAssessment[];
  evidence: ReportEvidence[];
  plans: ImprovementPlan[];
  councilMembers: CouncilMember[];
  standardNotes: StandardNote[];
  ketQuaTieuChi: KetQuaTieuChi[];
  giaiTrinh: ReturnType<typeof xacDinhMucTuKetQua>;
};

export function createRequestSupabaseClient(authorization: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Chưa cấu hình Supabase.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authorization,
      },
    },
  });
}

export async function getReportProfile(supabase: ReportSupabaseClient) {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error(userError?.message ?? "Bạn cần đăng nhập để xuất báo cáo.");
  }

  const { data, error } = await supabase
    .from("nguoi_dung")
    .select("id, co_so_id, ho_ten")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "Không tìm thấy hồ sơ người dùng trong cơ sở giáo dục.");
  }

  return data as ReportProfile;
}

function firstArrayItem<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function collectReportData(
  supabase: ReportSupabaseClient,
  namHocId: string,
  capHoc: CapHoc,
): Promise<ReportData> {
  const profile = await getReportProfile(supabase);
  const { data: canExport, error: permissionError } = await supabase.rpc("fn_has_permission", {
    p_permission: "report.export",
    p_co_so_id: profile.co_so_id,
  });

  if (permissionError) {
    throw new Error(permissionError.message);
  }

  if (!canExport) {
    throw new Error("Bạn chưa có quyền xuất báo cáo của cơ sở giáo dục này.");
  }

  const [
    { data: schoolData, error: schoolError },
    { data: yearData, error: yearError },
    { data: standardData, error: standardError },
    { data: criterionData, error: criterionError },
    { data: levelData, error: levelError },
    { data: assessmentData, error: assessmentError },
    { data: evidenceData, error: evidenceError },
    { data: planData, error: planError },
    { data: noteData, error: noteError },
    { data: councilData },
  ] = await Promise.all([
    supabase
      .from("co_so_giao_duc")
      .select("id, ten, ma_truong, loai_hinh, cap_hoc, dia_chi, co_quan_quan_ly")
      .eq("id", profile.co_so_id)
      .maybeSingle(),
    supabase
      .from("nam_hoc")
      .select("id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai")
      .eq("id", namHocId)
      .eq("co_so_id", profile.co_so_id)
      .maybeSingle(),
    supabase.from("tieu_chuan").select("id, so_thu_tu, ten").order("so_thu_tu"),
    supabase
      .from("tieu_chi")
      .select("id, ma, ten, la_bat_buoc, tieu_chuan_id, tieu_chuan:tieu_chuan_id(id, so_thu_tu, ten)")
      .order("ma", { ascending: true }),
    supabase.from("muc_tieu_chi").select("tieu_chi_id, muc, noi_dung_yeu_cau"),
    supabase
      .from("tu_danh_gia")
      .select("id, tieu_chi_id, cap_hoc, mo_ta_muc_1, dat_muc_1, mo_ta_muc_2, dat_muc_2, muc_dat")
      .eq("co_so_id", profile.co_so_id)
      .eq("nam_hoc_id", namHocId)
      .eq("cap_hoc", capHoc),
    supabase
      .from("minh_chung")
      .select("id, ma, ten, loai_tep, duong_dan, storage_path, hash_tep, kich_thuoc, ngay_ban_hanh, ngay_het_gia_tri, ghi_chu, minh_chung_tieu_chi(tieu_chi_id)")
      .eq("co_so_id", profile.co_so_id)
      .eq("nam_hoc_id", namHocId)
      .is("deleted_at", null)
      .order("ma", { ascending: true }),
    supabase
      .from("ke_hoach_cai_tien")
      .select("id, tieu_chuan_id, tieu_chi_id, noi_dung, muc_tieu, hoat_dong, chi_so_ket_qua, thoi_gian_bat_dau, thoi_gian_ket_thuc, nguon_luc, minh_chung_du_kien, muc_do_thuc_hien, ghi_chu, phu_trach:phu_trach_id(ho_ten)")
      .eq("co_so_id", profile.co_so_id)
      .eq("nam_hoc_id", namHocId)
      .order("created_at", { ascending: true }),
    supabase
      .from("nhan_xet_tieu_chuan")
      .select("id, tieu_chuan_id, cap_hoc, diem_manh_noi_bat, han_che_trong_tam, dinh_huong_cai_tien")
      .eq("co_so_id", profile.co_so_id)
      .eq("nam_hoc_id", namHocId)
      .eq("cap_hoc", capHoc),
    supabase
      .from("hoi_dong_tu_danh_gia")
      .select("id, thanh_vien_hoi_dong(thu_tu, chuc_vu, vai_tro_hoi_dong, nguoi_dung:nguoi_dung_id(ho_ten))")
      .eq("co_so_id", profile.co_so_id)
      .eq("nam_hoc_id", namHocId)
      .limit(1),
  ]);

  const firstError =
    schoolError ??
    yearError ??
    standardError ??
    criterionError ??
    levelError ??
    assessmentError ??
    evidenceError ??
    planError ??
    noteError;

  if (firstError) {
    throw new Error(firstError.message);
  }

  if (!schoolData || !yearData) {
    throw new Error("Không tìm thấy cơ sở giáo dục hoặc năm học để xuất báo cáo.");
  }

  const levelByCriterion = new Map<string, { muc_1: string; muc_2: string }>();

  for (const level of (levelData ?? []) as { tieu_chi_id: string; muc: 1 | 2; noi_dung_yeu_cau: string }[]) {
    const current = levelByCriterion.get(level.tieu_chi_id) ?? { muc_1: "", muc_2: "" };

    if (level.muc === 1) {
      current.muc_1 = level.noi_dung_yeu_cau;
    } else {
      current.muc_2 = level.noi_dung_yeu_cau;
    }

    levelByCriterion.set(level.tieu_chi_id, current);
  }

  const criteria = ((criterionData ?? []) as (Omit<ReportCriterion, "muc_1" | "muc_2" | "tieu_chuan"> & {
    tieu_chuan?: ReportStandard | ReportStandard[] | null;
  })[]).map((criterion) => {
    const levels = levelByCriterion.get(criterion.id) ?? { muc_1: "", muc_2: "" };

    return {
      ...criterion,
      tieu_chuan: firstArrayItem(criterion.tieu_chuan) ?? undefined,
      muc_1: levels.muc_1,
      muc_2: levels.muc_2,
    };
  });

  const evidence = ((evidenceData ?? []) as (Omit<ReportEvidence, "tieuChiIds"> & {
    minh_chung_tieu_chi?: { tieu_chi_id: string }[];
  })[]).map((item) => ({
    ...item,
    tieuChiIds: (item.minh_chung_tieu_chi ?? []).map((link) => link.tieu_chi_id),
  }));

  const assessments = (assessmentData ?? []) as ReportAssessment[];
  const ketQuaTieuChi = criteria.map<KetQuaTieuChi>((criterion) => {
    const assessment = assessments.find((item) => item.tieu_chi_id === criterion.id);

    return {
      id: criterion.id,
      ma: criterion.ma,
      ten: criterion.ten,
      laBatBuoc: criterion.la_bat_buoc,
      mucDat: assessment?.muc_dat ?? 0,
      moTaMuc1: assessment?.mo_ta_muc_1 ?? "",
      moTaMuc2: assessment?.mo_ta_muc_2 ?? "",
      maMinhChung: evidence
        .filter((item) => item.tieuChiIds.includes(criterion.id))
        .map((item) => item.ma),
    };
  });

  const councilMembers =
    ((councilData?.[0]?.thanh_vien_hoi_dong ?? []) as {
      thu_tu: number;
      chuc_vu: string | null;
      vai_tro_hoi_dong: string;
      nguoi_dung?: { ho_ten: string } | { ho_ten: string }[] | null;
    }[])
      .map<CouncilMember>((item) => ({
        thu_tu: item.thu_tu,
        chuc_vu: item.chuc_vu,
        vai_tro_hoi_dong: item.vai_tro_hoi_dong,
        ho_ten: firstArrayItem(item.nguoi_dung)?.ho_ten ?? "",
      }))
      .sort((a, b) => a.thu_tu - b.thu_tu);

  return {
    profile,
    school: schoolData as ReportSchool,
    year: yearData as ReportSchoolYear,
    capHoc,
    standards: (standardData ?? []) as ReportStandard[],
    criteria,
    assessments,
    evidence,
    plans: ((planData ?? []) as (ImprovementPlan & { phu_trach?: { ho_ten: string } | { ho_ten: string }[] | null })[]).map(
      (item) => ({
        ...item,
        phu_trach: firstArrayItem(item.phu_trach) ?? null,
      }),
    ),
    councilMembers,
    standardNotes: (noteData ?? []) as StandardNote[],
    ketQuaTieuChi,
    giaiTrinh: xacDinhMucTuKetQua(ketQuaTieuChi),
  };
}
