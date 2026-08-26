"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { CapHoc } from "@/lib/assessment/level-engine";
import { getTT57StandardReference } from "@/lib/tt57/reference-data";
import { Alert } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { ReadinessChecklist, ReadinessItem } from "@/components/ui/readiness-checklist";
import { StatusBadge } from "@/components/ui/status-badge";

type Profile = {
  id: string;
  co_so_id: string;
  ho_ten: string;
};

type School = {
  id: string;
  ten: string;
  loai_hinh: string;
  cap_hoc: CapHoc[];
};

type SchoolYear = {
  id: string;
  ten: string;
  trang_thai: string;
};

type Standard = {
  id: string;
  so_thu_tu: number;
  ten: string;
};

type CriterionWithStandard = {
  id?: string;
  ma?: string;
  ten?: string;
  loai_hinh_ap_dung: string;
  tieu_chuan?: Standard | Standard[] | null;
};

type CriterionSummary = {
  id: string;
  ma: string;
  ten: string;
};

type StandardNote = {
  id?: string;
  tieu_chuan_id: string;
  diem_manh_noi_bat: string | null;
  han_che_trong_tam: string | null;
  dinh_huong_cai_tien: string | null;
};

type ReportRecord = {
  id: string;
  loai_bao_cao: string;
  trang_thai: string;
  ngay_phe_duyet: string | null;
  storage_path: string | null;
};

const capHocLabels: Record<CapHoc, string> = {
  mam_non: "Mầm non",
  tieu_hoc: "Tiểu học",
  thcs: "THCS",
  thpt: "THPT",
  gdtx: "GDTX",
  khac: "Khác",
};

type ExportItem = {
  endpoint: string;
  label: string;
  reportType: string;
};

const exports: ExportItem[] = [
  { endpoint: "mau-1", label: "Mẫu 1 - Báo cáo tự đánh giá (.docx)", reportType: "mau_1_tu_danh_gia" },
  { endpoint: "mau-2", label: "Mẫu 2 - Kế hoạch cải tiến (.docx)", reportType: "mau_2_ke_hoach_cai_tien" },
  { endpoint: "danh-muc-minh-chung", label: "Danh mục minh chứng (.xlsx)", reportType: "danh_muc_minh_chung" },
  { endpoint: "goi-minh-chung", label: "Gói minh chứng (.zip)", reportType: "goi_minh_chung" },
  { endpoint: "export-json", label: "Dữ liệu đầy đủ năm học (.json)", reportType: "du_lieu_nam_hoc_json" },
];

function storagePathForReport(coSoId: string, namHocId: string, reportType: string, fileName: string) {
  const safeFileName = fileName.replace(/[\\/:*?"<>|]+/g, "-");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  return `${coSoId}/${namHocId}/${reportType}/v1/${timestamp}-${safeFileName}`;
}

export function ReportExportWorkspace() {
  const router = useRouter();
  const supabase = useMemo(() => {
    if (!isSupabaseConfigured()) {
      return null;
    }

    return createBrowserSupabaseClient();
  }, []);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [years, setYears] = useState<SchoolYear[]>([]);
  const [criteria, setCriteria] = useState<CriterionSummary[]>([]);
  const [standards, setStandards] = useState<Standard[]>([]);
  const [standardNotes, setStandardNotes] = useState<StandardNote[]>([]);
  const [reportRecords, setReportRecords] = useState<ReportRecord[]>([]);
  const [readinessItems, setReadinessItems] = useState<ReadinessItem[]>([]);
  const [selectedYearId, setSelectedYearId] = useState("");
  const [selectedCapHoc, setSelectedCapHoc] = useState<CapHoc>("mam_non");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [downloading, setDownloading] = useState("");

  const capHocList = school?.cap_hoc?.length ? school.cap_hoc : [selectedCapHoc];

  const loadData = useCallback(async () => {
    if (!supabase) {
      setMessage("Chưa cấu hình Supabase trong .env.local.");
      setLoading(false);
      return null;
    }

    setLoading(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      router.replace("/login");
      return null;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("nguoi_dung")
      .select("id, co_so_id, ho_ten")
      .eq("auth_user_id", userData.user.id)
      .maybeSingle();

    if (profileError || !profileData) {
      setMessage(profileError?.message ?? "Bạn cần thiết lập cơ sở giáo dục trước.");
      setLoading(false);
      return;
    }

    setProfile(profileData as Profile);

    const [{ data: schoolData }, { data: yearData }, { data: criterionData }] = await Promise.all([
      supabase
        .from("co_so_giao_duc")
        .select("id, ten, loai_hinh, cap_hoc")
        .eq("id", profileData.co_so_id)
        .maybeSingle(),
      supabase
        .from("nam_hoc")
        .select("id, ten, trang_thai")
        .eq("co_so_id", profileData.co_so_id)
        .order("ngay_bat_dau", { ascending: false }),
      supabase
        .from("tieu_chi")
        .select("id, ma, ten, loai_hinh_ap_dung, tieu_chuan:tieu_chuan_id(id, so_thu_tu, ten)")
        .order("ma", { ascending: true }),
    ]);

    const loadedSchool = schoolData as School | null;
    const loadedYears = (yearData ?? []) as SchoolYear[];
    const activeYear = loadedYears.find((year) => year.trang_thai === "dang_hoat_dong") ?? loadedYears[0];
    const standardsById = new Map<string, Standard>();
    const filteredCriteria: CriterionSummary[] = [];

    for (const criterion of (criterionData ?? []) as CriterionWithStandard[]) {
      if (criterion.loai_hinh_ap_dung !== (loadedSchool?.loai_hinh ?? "mam_non")) {
        continue;
      }

      if (criterion.id && criterion.ma && criterion.ten) {
        filteredCriteria.push({
          id: criterion.id,
          ma: criterion.ma,
          ten: criterion.ten,
        });
      }

      const standard = Array.isArray(criterion.tieu_chuan)
        ? criterion.tieu_chuan[0]
        : criterion.tieu_chuan;

      if (standard) {
        const reference = getTT57StandardReference(loadedSchool?.loai_hinh, standard.so_thu_tu);

        standardsById.set(standard.id, {
          ...standard,
          ten: reference?.ten ?? standard.ten,
        });
      }
    }

    setSchool(loadedSchool);
    setYears(loadedYears);
    setCriteria(filteredCriteria.sort((a, b) => a.ma.localeCompare(b.ma, "vi")));
    setStandards([...standardsById.values()].sort((a, b) => a.so_thu_tu - b.so_thu_tu));
    setSelectedYearId((current) => current || activeYear?.id || "");

    if (loadedSchool?.cap_hoc?.[0]) {
      setSelectedCapHoc(loadedSchool.cap_hoc[0]);
    }

    setLoading(false);
  }, [router, supabase]);

  const loadStandardNotes = useCallback(async () => {
    if (!supabase || !profile || !selectedYearId || !selectedCapHoc) {
      return;
    }

    const { data, error } = await supabase
      .from("nhan_xet_tieu_chuan")
      .select("id, tieu_chuan_id, diem_manh_noi_bat, han_che_trong_tam, dinh_huong_cai_tien")
      .eq("co_so_id", profile.co_so_id)
      .eq("nam_hoc_id", selectedYearId)
      .eq("cap_hoc", selectedCapHoc);

    if (error) {
      setMessage(error.message);
      return;
    }

    setStandardNotes((data ?? []) as StandardNote[]);
  }, [profile, selectedCapHoc, selectedYearId, supabase]);

  const loadReportRecords = useCallback(async () => {
    if (!supabase || !profile || !selectedYearId) {
      return;
    }

    const { data, error } = await supabase
      .from("bao_cao")
      .select("id, loai_bao_cao, trang_thai, ngay_phe_duyet, storage_path")
      .eq("co_so_id", profile.co_so_id)
      .eq("nam_hoc_id", selectedYearId)
      .eq("version", 1);

    if (error) {
      setMessage(error.message);
      return;
    }

    setReportRecords((data ?? []) as ReportRecord[]);
  }, [profile, selectedYearId, supabase]);

  const loadReadiness = useCallback(async () => {
    if (!supabase || !profile || !selectedYearId || !selectedCapHoc || criteria.length === 0) {
      setReadinessItems([]);
      return;
    }

    const criterionIds = criteria.map((criterion) => criterion.id);
    const [
      { data: assessmentData, error: assessmentError },
      { data: linkData, error: linkError },
      { data: noteData, error: noteError },
      { data: councilData, error: councilError },
    ] = await Promise.all([
      supabase
        .from("tu_danh_gia")
        .select("tieu_chi_id, mo_ta_muc_1, mo_ta_muc_2, muc_dat")
        .eq("co_so_id", profile.co_so_id)
        .eq("nam_hoc_id", selectedYearId)
        .eq("cap_hoc", selectedCapHoc)
        .in("tieu_chi_id", criterionIds),
      supabase
        .from("minh_chung_tieu_chi")
        .select("tieu_chi_id, minh_chung:minh_chung_id(nam_hoc_id, deleted_at)")
        .in("tieu_chi_id", criterionIds),
      supabase
        .from("nhan_xet_tieu_chuan")
        .select("tieu_chuan_id, diem_manh_noi_bat, han_che_trong_tam, dinh_huong_cai_tien")
        .eq("co_so_id", profile.co_so_id)
        .eq("nam_hoc_id", selectedYearId)
        .eq("cap_hoc", selectedCapHoc),
      supabase
        .from("hoi_dong_tu_danh_gia")
        .select("id, thanh_vien_hoi_dong(id)")
        .eq("co_so_id", profile.co_so_id)
        .eq("nam_hoc_id", selectedYearId)
        .limit(1)
        .maybeSingle(),
    ]);

    if (assessmentError || linkError || noteError || councilError) {
      setReadinessItems([
        {
          id: "readiness-error",
          label: "Không kiểm tra được mức sẵn sàng",
          detail: assessmentError?.message ?? linkError?.message ?? noteError?.message ?? councilError?.message,
          status: "warning",
        },
      ]);
      return;
    }

    const assessments = (assessmentData ?? []) as {
      tieu_chi_id: string;
      mo_ta_muc_1: string | null;
      mo_ta_muc_2: string | null;
      muc_dat: 0 | 1 | 2;
    }[];
    const assessmentByCriterion = new Map(assessments.map((row) => [row.tieu_chi_id, row]));
    const evidenceCriterionIds = new Set<string>();

    for (const link of (linkData ?? []) as {
      tieu_chi_id: string;
      minh_chung?: { nam_hoc_id: string; deleted_at: string | null } | { nam_hoc_id: string; deleted_at: string | null }[] | null;
    }[]) {
      const evidence = Array.isArray(link.minh_chung) ? link.minh_chung[0] : link.minh_chung;

      if (evidence?.nam_hoc_id === selectedYearId && evidence.deleted_at === null) {
        evidenceCriterionIds.add(link.tieu_chi_id);
      }
    }

    const missingAssessment = criteria.filter((criterion) => !assessmentByCriterion.has(criterion.id));
    const missingDescription = criteria.filter((criterion) => {
      const row = assessmentByCriterion.get(criterion.id);

      if (!row) {
        return false;
      }

      if (row.muc_dat >= 1 && !row.mo_ta_muc_1?.trim()) {
        return true;
      }

      return row.muc_dat >= 2 && !row.mo_ta_muc_2?.trim();
    });
    const missingEvidence = criteria.filter((criterion) => !evidenceCriterionIds.has(criterion.id));
    const notes = (noteData ?? []) as StandardNote[];
    const incompleteNotes = standards.filter((standard) => {
      const note = notes.find((item) => item.tieu_chuan_id === standard.id);

      return !note?.diem_manh_noi_bat?.trim() || !note?.han_che_trong_tam?.trim() || !note?.dinh_huong_cai_tien?.trim();
    });
    const memberCount = Array.isArray(councilData?.thanh_vien_hoi_dong) ? councilData.thanh_vien_hoi_dong.length : 0;

    setReadinessItems([
      {
        id: "criteria-count",
        label: "Bộ tiêu chí theo loại hình",
        detail: `${criteria.length}/15 tiêu chí đã tải cho loại hình của đơn vị.`,
        status: criteria.length === 15 ? "ready" : "blocked",
      },
      {
        id: "assessment-count",
        label: "Tự đánh giá đủ 15 tiêu chí",
        detail: missingAssessment.length === 0 ? "Tất cả tiêu chí đã có bản ghi tự đánh giá." : `Còn thiếu: ${missingAssessment.map((item) => item.ma).join(", ")}.`,
        status: missingAssessment.length === 0 ? "ready" : "blocked",
      },
      {
        id: "assessment-description",
        label: "Mô tả hiện trạng theo mức đạt",
        detail: missingDescription.length === 0 ? "Các tiêu chí đã đạt đều có mô tả hiện trạng tương ứng." : `Cần bổ sung mô tả: ${missingDescription.map((item) => item.ma).join(", ")}.`,
        status: missingDescription.length === 0 ? "ready" : "blocked",
      },
      {
        id: "assessment-evidence",
        label: "Mã minh chứng gắn với tiêu chí",
        detail: missingEvidence.length === 0 ? "15/15 tiêu chí đều có minh chứng gắn kèm." : `Còn tiêu chí chưa có minh chứng: ${missingEvidence.map((item) => item.ma).join(", ")}.`,
        status: missingEvidence.length === 0 ? "ready" : "blocked",
      },
      {
        id: "standard-notes",
        label: "Nhận xét sau từng tiêu chuẩn",
        detail: incompleteNotes.length === 0 ? "Đủ điểm mạnh, hạn chế và định hướng cải tiến cho từng tiêu chuẩn." : `Cần hoàn thiện Tiêu chuẩn ${incompleteNotes.map((item) => item.so_thu_tu).join(", ")}.`,
        status: incompleteNotes.length === 0 ? "ready" : "warning",
      },
      {
        id: "council",
        label: "Hội đồng tự đánh giá",
        detail: memberCount > 0 ? `Đã có ${memberCount} thành viên hội đồng.` : "Chưa có thành viên hội đồng cho năm học này.",
        status: memberCount > 0 ? "ready" : "warning",
      },
    ]);
  }, [criteria, profile, selectedCapHoc, selectedYearId, standards, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadStandardNotes();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadStandardNotes]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReportRecords();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadReportRecords]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReadiness();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadReadiness]);

  function updateNote(standardId: string, field: keyof Omit<StandardNote, "id" | "tieu_chuan_id">, value: string) {
    setStandardNotes((current) => {
      const existing = current.find((item) => item.tieu_chuan_id === standardId);

      if (existing) {
        return current.map((item) =>
          item.tieu_chuan_id === standardId ? { ...item, [field]: value } : item,
        );
      }

      return [
        ...current,
        {
          tieu_chuan_id: standardId,
          diem_manh_noi_bat: "",
          han_che_trong_tam: "",
          dinh_huong_cai_tien: "",
          [field]: value,
        },
      ];
    });
  }

  async function saveStandardNotes() {
    if (!supabase || !profile || !selectedYearId) {
      setMessage("Chưa đủ thông tin để lưu nhận xét.");
      return;
    }

    const rows = standards.map((standard) => {
      const note = standardNotes.find((item) => item.tieu_chuan_id === standard.id);

      return {
        co_so_id: profile.co_so_id,
        nam_hoc_id: selectedYearId,
        tieu_chuan_id: standard.id,
        cap_hoc: selectedCapHoc,
        diem_manh_noi_bat: note?.diem_manh_noi_bat ?? "",
        han_che_trong_tam: note?.han_che_trong_tam ?? "",
        dinh_huong_cai_tien: note?.dinh_huong_cai_tien ?? "",
        nguoi_cap_nhat: profile.id,
      };
    });

    const { error } = await supabase
      .from("nhan_xet_tieu_chuan")
      .upsert(rows, { onConflict: "co_so_id,nam_hoc_id,tieu_chuan_id,cap_hoc" });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Đã lưu nhận xét theo tiêu chuẩn cho Mẫu 1.");
    await loadStandardNotes();
  }

  async function fetchReportFile(endpoint: string) {
    if (!supabase || !selectedYearId || !selectedCapHoc) {
      setMessage("Hãy chọn năm học và cấp học trước khi xuất.");
      return null;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      router.replace("/login");
      return null;
    }

    const response = await fetch(
      `/api/bao-cao/${endpoint}?namHocId=${encodeURIComponent(selectedYearId)}&capHoc=${encodeURIComponent(selectedCapHoc)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(body?.error ?? "Không xuất được file.");
      return null;
    }

    const blob = await response.blob();
    const disposition = response.headers.get("content-disposition") ?? "";
    const fileName = decodeURIComponent(
      disposition.match(/filename\*=UTF-8''([^;]+)/)?.[1] ?? `${endpoint}`,
    );
    return { blob, fileName };
  }

  async function download(endpoint: string) {
    setDownloading(endpoint);
    setMessage("");

    const reportFile = await fetchReportFile(endpoint);

    if (!reportFile) {
      setDownloading("");
      return;
    }

    const url = URL.createObjectURL(reportFile.blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = reportFile.fileName;
    anchor.click();
    URL.revokeObjectURL(url);

    setDownloading("");
    setMessage("Đã tạo file. Nếu Mẫu 1 còn cảnh báo đỏ, chưa được coi là báo cáo xuất bản chính thức.");
  }

  async function updateReportStatus(reportType: string, status: "nhap" | "cho_duyet" | "da_phe_duyet" | "tra_lai") {
    if (!supabase || !profile || !selectedYearId) {
      setMessage("Hãy chọn năm học trước khi cập nhật trạng thái báo cáo.");
      return;
    }

    setDownloading(`${reportType}:${status}`);
    setMessage("");

    let storagePath: string | null = null;

    if (status === "da_phe_duyet") {
      const item = exports.find((exportItem) => exportItem.reportType === reportType);

      if (!item) {
        setDownloading("");
        setMessage("Không xác định được loại báo cáo cần phê duyệt.");
        return;
      }

      const reportFile = await fetchReportFile(item.endpoint);

      if (!reportFile) {
        setDownloading("");
        return;
      }

      storagePath = storagePathForReport(profile.co_so_id, selectedYearId, reportType, reportFile.fileName);

      const { error: uploadError } = await supabase.storage
        .from("reports")
        .upload(storagePath, reportFile.blob, {
          contentType: reportFile.blob.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        setDownloading("");
        setMessage(`Không lưu được file báo cáo đã phê duyệt: ${uploadError.message}`);
        return;
      }
    }

    const { error } = await supabase.rpc("fn_luu_trang_thai_bao_cao", {
      p_nam_hoc_id: selectedYearId,
      p_loai_bao_cao: reportType,
      p_trang_thai: status,
      p_storage_path: storagePath,
    });

    if (error) {
      if (storagePath) {
        await supabase.storage.from("reports").remove([storagePath]);
      }

      setDownloading("");
      setMessage(error.message);
      return;
    }

    setDownloading("");
    setMessage(
      status === "da_phe_duyet"
        ? "Đã phê duyệt báo cáo. Khách chỉ đọc chỉ xem được báo cáo ở trạng thái này."
        : status === "cho_duyet"
          ? "Đã gửi báo cáo sang trạng thái chờ duyệt."
          : status === "tra_lai"
            ? "Đã trả báo cáo về để chỉnh sửa."
            : "Đã lưu trạng thái bản nháp báo cáo.",
    );
    await loadReportRecords();
  }

  if (loading) {
    return <LoadingState label="Đang tải dữ liệu xuất báo cáo..." />;
  }

  if (!profile || years.length === 0) {
    return (
      <EmptyState
        title="Chưa có dữ liệu để xuất báo cáo"
        description="Hãy thiết lập đơn vị và năm học đang hoạt động trước khi xuất Mẫu 1, Mẫu 2 hoặc danh mục minh chứng."
      />
    );
  }

  return (
    <div className="grid gap-6">
      <section className="surface-card grid gap-4 p-5 lg:grid-cols-2">
        <label className="text-sm font-medium">
          Năm học
          <select
            className="form-control mt-2"
            value={selectedYearId}
            onChange={(event) => setSelectedYearId(event.target.value)}
          >
            {years.map((year) => (
              <option key={year.id} value={year.id}>
                {year.ten} {year.trang_thai === "dang_hoat_dong" ? "(đang hoạt động)" : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium">
          Cấp học
          <select
            className="form-control mt-2"
            value={selectedCapHoc}
            onChange={(event) => setSelectedCapHoc(event.target.value as CapHoc)}
          >
            {capHocList.map((capHoc) => (
              <option key={capHoc} value={capHoc}>
                {capHocLabels[capHoc] ?? capHoc}
              </option>
            ))}
          </select>
        </label>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link className="button-secondary" href="/bao-cao/da-phe-duyet">
          Xem báo cáo đã phê duyệt
        </Link>
        <Link className="button-secondary" href="/ke-hoach-cai-tien">
          Nhập kế hoạch cải tiến
        </Link>
      </div>

      {message ? <Message text={message} /> : null}

      {readinessItems.length > 0 ? (
        <ReadinessChecklist
          description="Checklist này giúp tránh xuất hoặc phê duyệt Mẫu 1 khi dữ liệu thật còn thiếu. Hệ thống vẫn cho xuất file để rà soát, nhưng báo cáo chính thức cần xử lý hết mục chặn."
          items={readinessItems}
          title="Mức sẵn sàng của Mẫu 1"
        />
      ) : null}

      <StandardNotesForm
        notes={standardNotes}
        onSave={saveStandardNotes}
        onUpdate={updateNote}
        standards={standards}
      />

      <section className="surface-card overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">Xuất dữ liệu</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">
            Mẫu 1 chỉ hoàn chỉnh khi dữ liệu thật đã đủ mô tả hiện trạng và mã minh chứng.
          </p>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          {exports.map((item) => (
            <ReportExportCard
              currentStatus={reportRecords.find((record) => record.loai_bao_cao === item.reportType)?.trang_thai ?? "chưa tạo"}
              isDownloading={downloading === item.endpoint}
              isLocked={Boolean(downloading)}
              item={item}
              key={item.endpoint}
              onDownload={() => download(item.endpoint)}
              onUpdateStatus={updateReportStatus}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function ReportExportCard(props: {
  currentStatus: string;
  isDownloading: boolean;
  isLocked: boolean;
  item: (typeof exports)[number];
  onDownload: () => void;
  onUpdateStatus: (reportType: string, status: "nhap" | "cho_duyet" | "da_phe_duyet" | "tra_lai") => Promise<void>;
}) {
  const [pendingStatus, setPendingStatus] = useState<"nhap" | "cho_duyet" | "da_phe_duyet" | null>(null);
  const statusCopy = {
    da_phe_duyet: {
      confirmLabel: "Phê duyệt báo cáo",
      description: "Báo cáo sau khi phê duyệt sẽ xuất hiện ở khu vực báo cáo đã phê duyệt cho vai trò chỉ đọc. Hãy chắc chắn Mẫu 1 không còn cảnh báo đỏ trước khi chốt chính thức.",
      title: "Phê duyệt báo cáo này?",
      tone: "danger" as const,
    },
    cho_duyet: {
      confirmLabel: "Gửi duyệt",
      description: "Báo cáo sẽ chuyển sang hàng đợi chờ duyệt để người có thẩm quyền xem xét.",
      title: "Gửi báo cáo sang trạng thái chờ duyệt?",
      tone: "primary" as const,
    },
    nhap: {
      confirmLabel: "Chuyển về bản nháp",
      description: "Báo cáo sẽ quay về trạng thái bản nháp để tiếp tục chỉnh sửa trước khi gửi duyệt lại.",
      title: "Chuyển báo cáo về bản nháp?",
      tone: "warning" as const,
    },
  };
  const pendingCopy = pendingStatus ? statusCopy[pendingStatus] : null;

  async function handleConfirmStatus() {
    if (!pendingStatus) {
      return;
    }

    const status = pendingStatus;
    setPendingStatus(null);
    await props.onUpdateStatus(props.item.reportType, status);
  }

  return (
    <article className="surface-card grid gap-3 p-4">
      <div>
        <p className="text-sm font-semibold text-[var(--color-ink-navy)]">{props.item.label}</p>
        <div className="mt-2">
          <StatusBadge status={props.currentStatus} />
        </div>
      </div>
      <button
        className="button-primary"
        disabled={props.isLocked}
        aria-busy={props.isDownloading}
        type="button"
        onClick={props.onDownload}
      >
        {props.isDownloading ? "Đang tạo file..." : "Xuất file"}
      </button>
      <div className="grid gap-2 sm:grid-cols-3">
        <button className="button-secondary" type="button" onClick={() => setPendingStatus("nhap")}>
          Bản nháp
        </button>
        <button className="button-secondary" type="button" onClick={() => setPendingStatus("cho_duyet")}>
          Gửi duyệt
        </button>
        <button className="button-danger" type="button" onClick={() => setPendingStatus("da_phe_duyet")}>
          Phê duyệt
        </button>
      </div>
      <ConfirmDialog
        confirmLabel={pendingCopy?.confirmLabel}
        description={pendingCopy?.description ?? ""}
        isOpen={Boolean(pendingCopy)}
        title={pendingCopy?.title ?? ""}
        tone={pendingCopy?.tone}
        onCancel={() => setPendingStatus(null)}
        onConfirm={handleConfirmStatus}
      />
    </article>
  );
}

function StandardNotesForm(props: {
  standards: Standard[];
  notes: StandardNote[];
  onUpdate: (
    standardId: string,
    field: keyof Omit<StandardNote, "id" | "tieu_chuan_id">,
    value: string,
  ) => void;
  onSave: () => Promise<void>;
}) {
  if (props.standards.length === 0) {
    return null;
  }

  return (
    <section className="surface-card overflow-hidden">
      <div className="border-b border-[var(--color-border)] px-5 py-4">
        <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">Nhận xét theo tiêu chuẩn cho Mẫu 1</h2>
        <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">
          Các ô này đi thẳng vào phần Điểm mạnh, Hạn chế và Định hướng cải tiến. Để trống thì file Mẫu 1 sẽ cảnh báo đỏ.
        </p>
      </div>
      <div className="grid gap-5 p-5">
        {props.standards.map((standard) => {
          const note = props.notes.find((item) => item.tieu_chuan_id === standard.id);

          return (
            <fieldset className="surface-card grid gap-3 p-4" key={standard.id}>
              <legend className="px-2 text-sm font-semibold text-[var(--color-ink-navy)]">
                Tiêu chuẩn {standard.so_thu_tu}: {standard.ten}
              </legend>
              <label className="text-sm font-medium">
                Điểm mạnh nổi bật
                <textarea
                  className="form-control mt-2 min-h-20"
                  value={note?.diem_manh_noi_bat ?? ""}
                  onChange={(event) => props.onUpdate(standard.id, "diem_manh_noi_bat", event.target.value)}
                />
              </label>
              <label className="text-sm font-medium">
                Điểm hạn chế trọng tâm và nguyên nhân cốt lõi
                <textarea
                  className="form-control mt-2 min-h-20"
                  value={note?.han_che_trong_tam ?? ""}
                  onChange={(event) => props.onUpdate(standard.id, "han_che_trong_tam", event.target.value)}
                />
              </label>
              <label className="text-sm font-medium">
                Định hướng cải tiến chất lượng
                <textarea
                  className="form-control mt-2 min-h-20"
                  value={note?.dinh_huong_cai_tien ?? ""}
                  onChange={(event) => props.onUpdate(standard.id, "dinh_huong_cai_tien", event.target.value)}
                />
              </label>
            </fieldset>
          );
        })}
      </div>
      <div className="border-t border-[var(--color-border)] px-5 py-4">
        <button className="button-primary" type="button" onClick={props.onSave}>
          Lưu nhận xét Mẫu 1
        </button>
      </div>
    </section>
  );
}

function Message({ text }: { text: string }) {
  return (
    <Alert tone={text.includes("Đã ") ? "success" : "warning"}>{text}</Alert>
  );
}
