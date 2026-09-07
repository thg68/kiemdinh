import { createClient } from "@supabase/supabase-js";
import { CapHoc, KetQuaTieuChi, xacDinhMucTuKetQua } from "@/lib/assessment/level-engine";
import { apiErrors, databaseApiError } from "@/lib/api/errors";

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
  bo_tieu_chuan_id: string;
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
  loai_hinh_ap_dung: string;
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

export type ImprovementReportSections = {
  can_cu_xay_dung: string | null;
  muc_dich_yeu_cau: string | null;
  tom_tat_van_de_trong_tam: string | null;
  theo_doi_danh_gia: string | null;
  to_chuc_thuc_hien: string | null;
  co_che_danh_gia_bao_cao: string | null;
};

export type ReportSnapshot = {
  id: string;
  loai_bao_cao: string;
  cap_hoc: CapHoc | null;
  version: number;
  trang_thai: string;
  storage_path: string | null;
  ten_tep_goc: string | null;
  mime_type: string | null;
  kich_thuoc: number | null;
  sha256: string | null;
  export_metadata: Record<string, unknown>;
  ngay_phe_duyet: string | null;
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
  improvementReportSections: ImprovementReportSections | null;
  reportSnapshots: ReportSnapshot[];
  ketQuaTieuChi: KetQuaTieuChi[];
  giaiTrinh: ReturnType<typeof xacDinhMucTuKetQua>;
};

export function assertReportScope(
  school: Pick<ReportSchool, "cap_hoc">,
  capHoc: CapHoc,
) {
  if (!school.cap_hoc.includes(capHoc)) {
    throw apiErrors.unprocessable(
      "Cấp học được chọn không thuộc cơ sở giáo dục hiện tại.",
      { field: "capHoc", code: "SCHOOL_LEVEL_OUT_OF_SCOPE" },
    );
  }
}

export function createRequestSupabaseClient(authorization: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw apiErrors.internal("Chưa cấu hình Supabase.");
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
    throw apiErrors.unauthorized("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
  }

  const { data, error } = await supabase
    .from("nguoi_dung")
    .select("id, co_so_id, ho_ten")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  if (error) {
    throw databaseApiError(error, "Không tải được hồ sơ người dùng.");
  }

  if (!data) {
    throw apiErrors.notFound("Không tìm thấy hồ sơ người dùng trong cơ sở giáo dục.");
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
    throw databaseApiError(permissionError, "Không kiểm tra được quyền xuất báo cáo.");
  }

  if (!canExport) {
    throw apiErrors.forbidden("Bạn chưa có quyền xuất báo cáo của cơ sở giáo dục này.");
  }

  const [
    { data: schoolData, error: schoolError },
    { data: yearData, error: yearError },
    { data: criterionData, error: criterionError },
    { data: assessmentData, error: assessmentError },
    { data: evidenceData, error: evidenceError },
    { data: planData, error: planError },
    { data: noteData, error: noteError },
    { data: improvementSectionData, error: improvementSectionError },
    { data: reportSnapshotData, error: reportSnapshotError },
    { data: councilData, error: councilError },
  ] = await Promise.all([
    supabase
      .from("co_so_giao_duc")
      .select("id, ten, ma_truong, loai_hinh, cap_hoc, dia_chi, co_quan_quan_ly")
      .eq("id", profile.co_so_id)
      .maybeSingle(),
    supabase
      .from("nam_hoc")
      .select("id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai, bo_tieu_chuan_id")
      .eq("id", namHocId)
      .eq("co_so_id", profile.co_so_id)
      .maybeSingle(),
    supabase
      .from("v_tieu_chi_nam_hoc")
      .select("id, ma, ten, la_bat_buoc, loai_hinh_ap_dung, tieu_chuan_id, tieu_chuan_so_thu_tu, tieu_chuan_ten, muc_1, muc_2")
      .eq("co_so_id", profile.co_so_id)
      .eq("nam_hoc_id", namHocId)
      .order("ma", { ascending: true }),
    supabase
      .from("tu_danh_gia")
      .select("id, tieu_chi_id, cap_hoc, mo_ta_muc_1, dat_muc_1, mo_ta_muc_2, dat_muc_2, muc_dat")
      .eq("co_so_id", profile.co_so_id)
      .eq("nam_hoc_id", namHocId)
      .eq("cap_hoc", capHoc)
      .eq("la_du_lieu_demo", false),
    supabase
      .from("v_minh_chung_hop_le_danh_gia")
      .select("id, ma, ten, loai_tep, duong_dan, storage_path, hash_tep, kich_thuoc, ngay_ban_hanh, ngay_het_gia_tri, ghi_chu")
      .eq("co_so_id", profile.co_so_id)
      .eq("nam_hoc_id", namHocId)
      .eq("la_du_lieu_demo", false)
      .order("ma", { ascending: true }),
    supabase
      .from("ke_hoach_cai_tien")
      .select("id, tieu_chuan_id, tieu_chi_id, noi_dung, muc_tieu, hoat_dong, chi_so_ket_qua, thoi_gian_bat_dau, thoi_gian_ket_thuc, nguon_luc, minh_chung_du_kien, muc_do_thuc_hien, ghi_chu, phu_trach:phu_trach_id(ho_ten)")
      .eq("co_so_id", profile.co_so_id)
      .eq("nam_hoc_id", namHocId)
      .eq("la_du_lieu_demo", false)
      .is("archived_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("nhan_xet_tieu_chuan")
      .select("id, tieu_chuan_id, cap_hoc, diem_manh_noi_bat, han_che_trong_tam, dinh_huong_cai_tien")
      .eq("co_so_id", profile.co_so_id)
      .eq("nam_hoc_id", namHocId)
      .eq("cap_hoc", capHoc)
      .eq("la_du_lieu_demo", false),
    supabase
      .from("noi_dung_mau_2")
      .select("can_cu_xay_dung, muc_dich_yeu_cau, tom_tat_van_de_trong_tam, theo_doi_danh_gia, to_chuc_thuc_hien, co_che_danh_gia_bao_cao")
      .eq("co_so_id", profile.co_so_id)
      .eq("nam_hoc_id", namHocId)
      .eq("cap_hoc", capHoc)
      .maybeSingle(),
    supabase
      .from("bao_cao")
      .select("id, loai_bao_cao, cap_hoc, version, trang_thai, storage_path, ten_tep_goc, mime_type, kich_thuoc, sha256, export_metadata, ngay_phe_duyet")
      .eq("co_so_id", profile.co_so_id)
      .eq("nam_hoc_id", namHocId)
      .order("version", { ascending: true }),
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
    criterionError ??
    assessmentError ??
    evidenceError ??
    planError ??
    noteError ??
    improvementSectionError ??
    reportSnapshotError ??
    councilError;

  if (firstError) {
    throw databaseApiError(firstError, "Không tải được dữ liệu xuất báo cáo.");
  }

  if (!schoolData || !yearData) {
    throw apiErrors.notFound("Không tìm thấy cơ sở giáo dục hoặc năm học để xuất báo cáo.");
  }

  assertReportScope(schoolData as ReportSchool, capHoc);

  const criteria = ((criterionData ?? []) as (Omit<ReportCriterion, "tieu_chuan"> & {
    tieu_chuan_so_thu_tu: number;
    tieu_chuan_ten: string;
  })[]).map((criterion) => ({
    id: criterion.id,
    ma: criterion.ma,
    ten: criterion.ten,
    la_bat_buoc: criterion.la_bat_buoc,
    loai_hinh_ap_dung: criterion.loai_hinh_ap_dung,
    tieu_chuan_id: criterion.tieu_chuan_id,
    muc_1: criterion.muc_1 ?? "",
    muc_2: criterion.muc_2 ?? "",
    tieu_chuan: {
      id: criterion.tieu_chuan_id,
      so_thu_tu: criterion.tieu_chuan_so_thu_tu,
      ten: criterion.tieu_chuan_ten,
    },
  }));
  const standardsById = new Map<string, ReportStandard>();

  for (const criterion of criteria) {
    if (criterion.tieu_chuan) {
      standardsById.set(criterion.tieu_chuan.id, criterion.tieu_chuan);
    }
  }

  const assessments = (assessmentData ?? []) as ReportAssessment[];
  const assessmentIds = assessments.map((item) => item.id);
  const { data: evidenceLinkData, error: evidenceLinkError } = assessmentIds.length
    ? await supabase
        .from("tu_danh_gia_minh_chung")
        .select("minh_chung_id, tu_danh_gia_id")
        .in("tu_danh_gia_id", assessmentIds)
    : { data: [], error: null };

  if (evidenceLinkError) {
    throw databaseApiError(evidenceLinkError, "Không tải được liên kết tiêu chí của minh chứng.");
  }

  const evidence = ((evidenceData ?? []) as Omit<ReportEvidence, "tieuChiIds">[]).map((item) => ({
    ...item,
    tieuChiIds: (evidenceLinkData ?? [])
      .filter((link) => link.minh_chung_id === item.id)
      .map((link) => assessments.find((assessment) => assessment.id === link.tu_danh_gia_id)?.tieu_chi_id)
      .filter((criterionId): criterionId is string => Boolean(criterionId)),
  }));

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
    standards: [...standardsById.values()].sort((a, b) => a.so_thu_tu - b.so_thu_tu),
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
    improvementReportSections: (improvementSectionData ?? null) as ImprovementReportSections | null,
    reportSnapshots: (reportSnapshotData ?? []) as ReportSnapshot[],
    ketQuaTieuChi,
    giaiTrinh: xacDinhMucTuKetQua(ketQuaTieuChi),
  };
}
