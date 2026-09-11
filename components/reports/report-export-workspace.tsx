"use client";

import { toUserMessage } from "@/lib/errors/user-message";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { reportStorageFailure } from "@/lib/observability/client-alerts";
import { CapHoc } from "@/lib/assessment/level-engine";
import { Alert } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { ReadinessChecklist, ReadinessItem } from "@/components/ui/readiness-checklist";
import { StatusBadge } from "@/components/ui/status-badge";
import { useScopedRequest } from "@/components/shared/use-scoped-request";
import { ReportSubnav } from "@/components/reports/report-subnav";
import { hasCapability } from "@/lib/auth/capabilities";

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
  cap_hoc: CapHoc | null;
  version: number;
  trang_thai: string;
  source_digest: string | null;
  ten_tep_goc: string | null;
  mime_type: string | null;
  kich_thuoc: number | null;
  sha256: string | null;
  export_metadata: Record<string, unknown> | null;
  ngay_phe_duyet: string | null;
  storage_path: string | null;
  ly_do_tra_lai: string | null;
};

type ReportReadiness = {
  ready: boolean;
  missing_criteria: string[];
  missing_descriptions: string[];
  missing_evidence: string[];
  unverified_evidence: string[];
  missing_council: boolean;
  other_blockers: string[];
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
  approvalWorkflow: boolean;
  endpoint: string;
  label: string;
  reportType: string;
};

const exports: ExportItem[] = [
  { approvalWorkflow: true, endpoint: "mau-1", label: "Mẫu 1 - Báo cáo tự đánh giá (.docx)", reportType: "mau_1_tu_danh_gia" },
  { approvalWorkflow: true, endpoint: "mau-2", label: "Mẫu 2 - Kế hoạch cải tiến (.docx)", reportType: "mau_2_ke_hoach_cai_tien" },
  { approvalWorkflow: false, endpoint: "danh-muc-minh-chung", label: "Danh mục minh chứng (.xlsx)", reportType: "danh_muc_minh_chung" },
  { approvalWorkflow: false, endpoint: "goi-minh-chung", label: "Gói minh chứng (.zip)", reportType: "goi_minh_chung" },
  { approvalWorkflow: false, endpoint: "export-json", label: "Dữ liệu đầy đủ năm học (.json)", reportType: "du_lieu_nam_hoc_json" },
];

function storagePathForReport(coSoId: string, namHocId: string, reportType: string, fileName: string) {
  const safeFileName = fileName.replace(/[\\/:*?"<>|]+/g, "-");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  return `${coSoId}/${namHocId}/${reportType}/snapshots/${timestamp}-${safeFileName}`;
}

async function sha256Blob(blob: Blob) {
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
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
  const [standards, setStandards] = useState<Standard[]>([]);
  const [standardNotes, setStandardNotes] = useState<StandardNote[]>([]);
  const [reportRecords, setReportRecords] = useState<ReportRecord[]>([]);
  const [readinessItems, setReadinessItems] = useState<ReadinessItem[]>([]);
  const [selectedYearId, setSelectedYearId] = useState("");
  const [selectedCapHoc, setSelectedCapHoc] = useState<CapHoc>("mam_non");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [downloading, setDownloading] = useState("");
  const [roleCodes, setRoleCodes] = useState<string[]>([]);

  const capHocList = school?.cap_hoc?.length ? school.cap_hoc : [selectedCapHoc];
  const reportScopeKey = `${profile?.co_so_id ?? ""}:${selectedYearId}:${selectedCapHoc}`;
  const reportRequest = useScopedRequest(reportScopeKey);

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

    const [
      { data: profileData, error: profileError },
      { data: roleData, error: roleError },
    ] = await Promise.all([
      supabase
        .from("nguoi_dung")
        .select("id, co_so_id, ho_ten")
        .eq("auth_user_id", userData.user.id)
        .maybeSingle(),
      supabase.rpc("fn_user_role_labels"),
    ]);

    if (profileError || roleError || !profileData) {
      setMessage(toUserMessage(profileError ?? roleError, "Bạn cần thiết lập cơ sở giáo dục và quyền truy cập trước."));
      setLoading(false);
      return;
    }

    setProfile(profileData as Profile);
    setRoleCodes(((roleData ?? []) as Array<{ ma: string }>).map((role) => role.ma));

    const [
      { data: schoolData, error: schoolError },
      { data: yearData, error: yearError },
    ] = await Promise.all([
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
    ]);

    const setupError = schoolError ?? yearError;

    if (setupError) {
      setMessage(
        toUserMessage(
          setupError,
          "Không tải được thông tin đơn vị hoặc năm học. Vui lòng thử lại.",
        ),
      );
      setLoading(false);
      return;
    }

    const loadedSchool = schoolData as School | null;
    const loadedYears = (yearData ?? []) as SchoolYear[];
    const activeYear = loadedYears.find((year) => year.trang_thai === "dang_hoat_dong") ?? loadedYears[0];
    setSchool(loadedSchool);
    setYears(loadedYears);
    setSelectedYearId((current) => current || activeYear?.id || "");

    if (loadedSchool?.cap_hoc?.[0]) {
      setSelectedCapHoc(loadedSchool.cap_hoc[0]);
    }

    setLoading(false);
  }, [router, supabase]);

  const loadBoundStandard = useCallback(async () => {
    if (!supabase || !profile || !selectedYearId) return;

    setStandards([]);
    const request = reportRequest.begin("standards");

    const { data, error } = await supabase
      .from("v_tieu_chi_nam_hoc")
      .select("id, ma, ten, tieu_chuan_id, tieu_chuan_so_thu_tu, tieu_chuan_ten")
      .eq("co_so_id", profile.co_so_id)
      .eq("nam_hoc_id", selectedYearId)
      .order("ma", { ascending: true });

    if (!reportRequest.isCurrent(request)) return;

    if (error) {
      setMessage(toUserMessage(error));
      return;
    }

    const standardsById = new Map<string, Standard>();
    ((data ?? []) as {
      id: string;
      ma: string;
      ten: string;
      tieu_chuan_id: string;
      tieu_chuan_so_thu_tu: number;
      tieu_chuan_ten: string;
    }[]).forEach((criterion) => {
      standardsById.set(criterion.tieu_chuan_id, {
        id: criterion.tieu_chuan_id,
        so_thu_tu: criterion.tieu_chuan_so_thu_tu,
        ten: criterion.tieu_chuan_ten,
      });
    });

    setStandards([...standardsById.values()].sort((a, b) => a.so_thu_tu - b.so_thu_tu));
  }, [profile, reportRequest, selectedYearId, supabase]);

  const loadStandardNotes = useCallback(async () => {
    if (!supabase || !profile || !selectedYearId || !selectedCapHoc) {
      return;
    }

    setStandardNotes([]);
    const request = reportRequest.begin("standard-notes");

    const { data, error } = await supabase
      .from("nhan_xet_tieu_chuan")
      .select("id, tieu_chuan_id, diem_manh_noi_bat, han_che_trong_tam, dinh_huong_cai_tien")
      .eq("co_so_id", profile.co_so_id)
      .eq("nam_hoc_id", selectedYearId)
      .eq("cap_hoc", selectedCapHoc);

    if (!reportRequest.isCurrent(request)) return;

    if (error) {
      setMessage(toUserMessage(error));
      return;
    }

    setStandardNotes((data ?? []) as StandardNote[]);
  }, [profile, reportRequest, selectedCapHoc, selectedYearId, supabase]);

  const loadReportRecords = useCallback(async () => {
    if (!supabase || !profile || !selectedYearId) {
      return;
    }

    setReportRecords([]);
    const request = reportRequest.begin("report-records");

    const { data, error } = await supabase
      .from("bao_cao")
      .select("id, loai_bao_cao, cap_hoc, version, trang_thai, source_digest, ten_tep_goc, mime_type, kich_thuoc, sha256, export_metadata, ngay_phe_duyet, storage_path, ly_do_tra_lai")
      .eq("co_so_id", profile.co_so_id)
      .eq("nam_hoc_id", selectedYearId)
      .order("version", { ascending: false });

    if (!reportRequest.isCurrent(request)) return;

    if (error) {
      setMessage(toUserMessage(error));
      return;
    }

    setReportRecords((data ?? []) as ReportRecord[]);
  }, [profile, reportRequest, selectedYearId, supabase]);

  const loadReadiness = useCallback(async () => {
    if (!supabase || !selectedYearId || !selectedCapHoc) {
      setReadinessItems([]);
      return;
    }

    setReadinessItems([]);
    const request = reportRequest.begin("readiness");

    const { data, error } = await supabase.rpc("fn_kiem_tra_san_sang_bao_cao", {
      p_nam_hoc_id: selectedYearId,
      p_cap_hoc: selectedCapHoc,
      p_loai_bao_cao: "mau_1_tu_danh_gia",
    });

    if (!reportRequest.isCurrent(request)) return;

    if (error || !data) {
      setReadinessItems([{
        id: "readiness-error",
        label: "Không kiểm tra được mức sẵn sàng",
        detail: toUserMessage(error, "Cơ sở dữ liệu không trả về kết quả. Vui lòng thử lại."),
        status: "warning",
      }]);
      return;
    }

    const readiness = data as ReportReadiness;
    const items: ReadinessItem[] = [
      {
        id: "overall",
        label: "Trạng thái phê duyệt",
        detail: readiness.ready ? "Báo cáo đã đủ điều kiện nghiệp vụ để phê duyệt." : "Báo cáo chưa đủ điều kiện phê duyệt.",
        status: readiness.ready ? "ready" : "blocked",
      },
      {
        id: "assessment-count",
        label: "Tự đánh giá đủ 15 tiêu chí",
        detail: readiness.missing_criteria.length === 0 ? "Tất cả tiêu chí đã có bản ghi." : `Còn thiếu: ${readiness.missing_criteria.join(", ")}.`,
        status: readiness.missing_criteria.length === 0 ? "ready" : "blocked",
      },
      {
        id: "assessment-description",
        label: "Mô tả hiện trạng",
        detail: readiness.missing_descriptions.length === 0 ? "Các tiêu chí đã có mô tả cần thiết." : `Cần bổ sung: ${readiness.missing_descriptions.join(", ")}.`,
        status: readiness.missing_descriptions.length === 0 ? "ready" : "blocked",
      },
      {
        id: "assessment-evidence",
        label: "Minh chứng hợp lệ",
        detail: readiness.missing_evidence.length === 0 ? "Tất cả tiêu chí đều có minh chứng đã xác minh, còn hiệu lực." : `Còn thiếu: ${readiness.missing_evidence.join(", ")}.`,
        status: readiness.missing_evidence.length === 0 ? "ready" : "blocked",
      },
      {
        id: "unverified-evidence",
        label: "Minh chứng chưa hoàn tất xác minh",
        detail: readiness.unverified_evidence.length === 0 ? "Không có minh chứng chờ xác minh hoặc bị từ chối." : `Cần xử lý: ${readiness.unverified_evidence.join(", ")}.`,
        status: readiness.unverified_evidence.length === 0 ? "ready" : "blocked",
      },
      {
        id: "council",
        label: "Hội đồng tự đánh giá",
        detail: readiness.missing_council ? "Chưa có thành viên hội đồng cho năm học này." : "Hội đồng đã có thành viên.",
        status: readiness.missing_council ? "blocked" : "ready",
      },
      ...readiness.other_blockers.map<ReadinessItem>((blocker, index) => ({
        id: `other-${index}`,
        label: "Điều kiện nghiệp vụ khác",
        detail: blocker,
        status: "blocked",
      })),
    ];

    setReadinessItems(items);
  }, [reportRequest, selectedCapHoc, selectedYearId, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadBoundStandard();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadBoundStandard]);

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

    const request = reportRequest.begin("save-standard-notes");

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

    if (!reportRequest.isCurrent(request)) return;

    if (error) {
      setMessage(toUserMessage(error));
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
    const sourceDigest = response.headers.get("x-report-source-digest");

    if (!sourceDigest || !/^[0-9a-f]{64}$/.test(sourceDigest)) {
      setMessage("Khong xac dinh duoc phien ban du lieu nguon cua file. Vui long xuat lai.");
      return null;
    }

    return { blob, fileName, sourceDigest };
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

  async function updateReportStatus(
    reportType: string,
    status: "nhap" | "cho_duyet" | "da_phe_duyet" | "tra_lai",
    returnReason?: string,
  ) {
    if (!supabase || !profile || !selectedYearId) {
      setMessage("Hãy chọn năm học trước khi cập nhật trạng thái báo cáo.");
      return false;
    }

    const currentReport = reportRecords.find(
      (record) => record.loai_bao_cao === reportType && record.cap_hoc === selectedCapHoc,
    );
    const isApprovalAction = status === "da_phe_duyet" || status === "tra_lai";

    if (isApprovalAction && !hasCapability(roleCodes, "action.report.approve")) {
      setMessage("Bạn không có quyền xử lý báo cáo chờ duyệt.");
      return false;
    }

    if (isApprovalAction && currentReport?.trang_thai !== "cho_duyet") {
      setMessage("Chỉ báo cáo đang ở trạng thái chờ duyệt mới được phê duyệt hoặc trả lại.");
      return false;
    }

    if (status === "tra_lai" && (returnReason?.trim().length ?? 0) < 5) {
      setMessage("Hãy nhập lý do trả lại ít nhất 5 ký tự.");
      return false;
    }

    setDownloading(`${reportType}:${status}`);
    setMessage("");

    let storagePath: string | null = null;
    let originalFileName: string | null = null;
    let mimeType: string | null = null;
    let fileSize: number | null = null;
    let fileHash: string | null = null;
    const reportId: string | null = currentReport?.trang_thai === "da_phe_duyet"
      ? null
      : currentReport?.id ?? null;
    let sourceDigest: string | null = null;
    let uploadedPath: string | null = null;

    if (status === "cho_duyet") {
      const item = exports.find((exportItem) => exportItem.reportType === reportType);

      if (!item) {
        setDownloading("");
        setMessage("Không xác định được loại báo cáo cần phê duyệt.");
        return false;
      }

      const { data: readinessData, error: readinessError } = await supabase.rpc(
        "fn_kiem_tra_san_sang_bao_cao",
        {
          p_nam_hoc_id: selectedYearId,
          p_cap_hoc: selectedCapHoc,
          p_loai_bao_cao: reportType,
        },
      );
      const readiness = readinessData as ReportReadiness | null;

      if (readinessError || !readiness?.ready) {
        setDownloading("");
        setMessage(toUserMessage(
          readinessError,
          "Báo cáo chưa đáp ứng đầy đủ checklist nên chưa thể gửi duyệt.",
        ));
        return false;
      }

      const reportFile = await fetchReportFile(item.endpoint);

      if (!reportFile) {
        setDownloading("");
        return false;
      }

      storagePath = storagePathForReport(profile.co_so_id, selectedYearId, reportType, reportFile.fileName);
      originalFileName = reportFile.fileName;
      mimeType = reportFile.blob.type || "application/octet-stream";
      fileSize = reportFile.blob.size;
      fileHash = await sha256Blob(reportFile.blob);
      sourceDigest = reportFile.sourceDigest;

      const { error: uploadError } = await supabase.storage
        .from("reports")
        .upload(storagePath, reportFile.blob, {
          contentType: mimeType,
          upsert: false,
        });

      if (uploadError) {
        void reportStorageFailure("report_upload");
        setDownloading("");
        setMessage(toUserMessage(uploadError, "Không lưu được tệp gửi duyệt. Vui lòng thử lại."));
        return false;
      }

      uploadedPath = storagePath;
    } else if (status === "da_phe_duyet") {
      storagePath = currentReport?.storage_path ?? null;
      originalFileName = currentReport?.ten_tep_goc ?? null;
      mimeType = currentReport?.mime_type ?? null;
      fileSize = currentReport?.kich_thuoc ?? null;
      fileHash = currentReport?.sha256 ?? null;
      sourceDigest = currentReport?.source_digest ?? null;

      if (!storagePath || !originalFileName || !fileHash || !sourceDigest) {
        setDownloading("");
        setMessage("Bản gửi duyệt chưa có tệp niêm phong. Hãy tạo lại bản gửi duyệt trước khi phê duyệt.");
        return false;
      }
    }

    const { error } = await supabase.rpc("fn_luu_trang_thai_bao_cao", {
      p_nam_hoc_id: selectedYearId,
      p_cap_hoc: selectedCapHoc,
      p_loai_bao_cao: reportType,
      p_trang_thai: status,
      p_storage_path: storagePath,
      p_ten_tep_goc: originalFileName,
      p_mime_type: mimeType,
      p_kich_thuoc: fileSize,
      p_sha256: fileHash,
      p_export_metadata: {
        nam_hoc_id: selectedYearId,
        cap_hoc: selectedCapHoc,
        ...(currentReport?.export_metadata ?? {}),
        updated_at: new Date().toISOString(),
      },
      p_bao_cao_id: reportId,
      p_source_digest: sourceDigest,
      p_ly_do_tra_lai: status === "tra_lai" ? returnReason?.trim() : null,
    });

    if (error) {
      if (uploadedPath) {
        const { error: cleanupError } = await supabase.storage
          .from("reports")
          .remove([uploadedPath]);

        if (cleanupError) {
          void reportStorageFailure("report_cleanup");
        }
      }

      setDownloading("");
      setMessage(toUserMessage(
        error,
        status === "da_phe_duyet"
          ? "Không thể phê duyệt: dữ liệu nguồn đã thay đổi hoặc checklist chưa đạt. Hãy trả lại để đơn vị gửi lại bản mới."
          : status === "cho_duyet"
            ? "Không thể gửi duyệt báo cáo. Hãy kiểm tra checklist và thử lại."
            : "Không thể cập nhật trạng thái báo cáo.",
      ));
      return false;
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
    return true;
  }

  if (loading) {
    return <LoadingState label="Đang tải dữ liệu xuất báo cáo…" />;
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
      <ReportSubnav
        active="compose"
        canApprove={hasCapability(roleCodes, "action.report.approve")}
      />
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
          {exports.map((item) => {
            const currentReport = reportRecords.find(
              (record) => record.loai_bao_cao === item.reportType && record.cap_hoc === selectedCapHoc,
            );

            return (
              <ReportExportCard
              currentReport={currentReport}
              isDownloading={downloading === item.endpoint}
              isLocked={Boolean(downloading)}
              item={item}
              key={item.endpoint}
              canApprove={hasCapability(roleCodes, "action.report.approve")}
              onDownload={() => download(item.endpoint)}
              onUpdateStatus={updateReportStatus}
            />
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ReportExportCard(props: {
  canApprove: boolean;
  currentReport?: ReportRecord;
  isDownloading: boolean;
  isLocked: boolean;
  item: (typeof exports)[number];
  onDownload: () => void;
  onUpdateStatus: (
    reportType: string,
    status: "nhap" | "cho_duyet" | "da_phe_duyet" | "tra_lai",
    returnReason?: string,
  ) => Promise<boolean>;
}) {
  const [pendingStatus, setPendingStatus] = useState<"nhap" | "cho_duyet" | "da_phe_duyet" | "tra_lai" | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [dialogError, setDialogError] = useState("");
  const currentStatus = props.currentReport?.trang_thai ?? "chua_tao";
  const hasSealedFile = Boolean(
    props.currentReport?.storage_path
      && props.currentReport?.source_digest
      && props.currentReport?.sha256,
  );
  const statusCopy = {
    da_phe_duyet: {
      confirmLabel: "Phê duyệt báo cáo",
      description: "Hệ thống sẽ kiểm tra lại dữ liệu nguồn và checklist trước khi khóa bản gửi duyệt thành báo cáo chính thức.",
      title: "Phê duyệt báo cáo này?",
      tone: "danger" as const,
    },
    cho_duyet: {
      confirmLabel: "Tạo bản gửi duyệt",
      description: "Hệ thống sẽ tạo file từ dữ liệu hiện tại, niêm phong phiên bản nguồn và chuyển đúng file này sang hàng đợi chờ duyệt.",
      title: "Tạo và gửi bản báo cáo để duyệt?",
      tone: "primary" as const,
    },
    nhap: {
      confirmLabel: "Tạo phiên bản mới",
      description: "Hệ thống sẽ tạo một bản nháp mới; báo cáo đã phê duyệt trước đó vẫn được giữ nguyên trong kho.",
      title: "Tạo phiên bản báo cáo mới?",
      tone: "warning" as const,
    },
    tra_lai: {
      confirmLabel: "Trả lại báo cáo",
      description: "Nêu rõ nội dung cần chỉnh để người lập báo cáo biết phải xử lý trước khi gửi lại.",
      title: "Trả báo cáo về để chỉnh sửa?",
      tone: "warning" as const,
    },
  };
  const pendingCopy = pendingStatus ? statusCopy[pendingStatus] : null;

  async function handleConfirmStatus() {
    if (!pendingStatus) return;

    if (pendingStatus === "tra_lai" && returnReason.trim().length < 5) {
      setDialogError("Lý do trả lại cần có ít nhất 5 ký tự.");
      return;
    }

    const success = await props.onUpdateStatus(
      props.item.reportType,
      pendingStatus,
      pendingStatus === "tra_lai" ? returnReason : undefined,
    );

    if (success) {
      setPendingStatus(null);
      setReturnReason("");
      setDialogError("");
    }
  }

  function openStatusDialog(status: NonNullable<typeof pendingStatus>) {
    setDialogError("");
    setPendingStatus(status);
  }

  return (
    <article className="surface-card grid gap-3 p-4">
      <div>
        <p className="text-sm font-semibold text-[var(--color-ink-navy)]">{props.item.label}</p>
        {props.item.approvalWorkflow ? (
          <div className="mt-2"><StatusBadge status={currentStatus} /></div>
        ) : (
          <p className="mt-2 text-xs text-[var(--color-graphite)]/70">
            Tệp xuất bổ trợ, không thuộc quy trình phê duyệt.
          </p>
        )}
      </div>

      <button
        aria-busy={props.isDownloading}
        className="button-primary"
        disabled={props.isLocked}
        type="button"
        onClick={props.onDownload}
      >
        {props.isDownloading ? "Đang tạo file…" : "Xuất file"}
      </button>

      {props.item.approvalWorkflow ? (
        <div className="grid gap-2">
          {props.currentReport?.ly_do_tra_lai ? (
            <p className="rounded-[6px] bg-[var(--color-danger-soft)] px-3 py-2 text-xs leading-5 text-[var(--color-danger)]">
              Lý do trả lại: {props.currentReport.ly_do_tra_lai}
            </p>
          ) : null}

          {["chua_tao", "nhap", "tra_lai"].includes(currentStatus) ? (
            <button className="button-secondary" disabled={props.isLocked} type="button" onClick={() => openStatusDialog("cho_duyet")}>
              {currentStatus === "tra_lai" ? "Gửi duyệt lại" : "Gửi duyệt"}
            </button>
          ) : null}

          {currentStatus === "cho_duyet" && !hasSealedFile ? (
            <>
              <p className="text-xs leading-5 text-[var(--color-danger)]">
                Bản chờ duyệt cũ chưa có tệp niêm phong. Hãy tạo lại trước khi xử lý.
              </p>
              <button className="button-secondary" disabled={props.isLocked} type="button" onClick={() => openStatusDialog("cho_duyet")}>
                Tạo lại bản gửi duyệt
              </button>
            </>
          ) : null}

          {currentStatus === "cho_duyet" && hasSealedFile && props.canApprove ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <button className="button-secondary" disabled={props.isLocked} type="button" onClick={() => openStatusDialog("tra_lai")}>
                Trả lại
              </button>
              <button className="button-danger" disabled={props.isLocked} type="button" onClick={() => openStatusDialog("da_phe_duyet")}>
                Phê duyệt
              </button>
            </div>
          ) : null}

          {currentStatus === "cho_duyet" && hasSealedFile && !props.canApprove ? (
            <p className="text-xs leading-5 text-[var(--color-graphite)]/70">
              Bản đã được niêm phong và đang chờ người có thẩm quyền xử lý.
            </p>
          ) : null}

          {currentStatus === "da_phe_duyet" ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <Link className="button-secondary" href="/bao-cao/da-phe-duyet">Xem bản đã duyệt</Link>
              <button className="button-secondary" disabled={props.isLocked} type="button" onClick={() => openStatusDialog("nhap")}>
                Tạo phiên bản mới
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <ConfirmDialog
        confirmLabel={pendingCopy?.confirmLabel}
        description={pendingStatus === "tra_lai" ? (
          <label className="block font-medium text-[var(--color-ink-navy)]">
            Lý do trả lại
            <textarea
              className="form-control mt-2 min-h-28 font-normal"
              maxLength={1000}
              placeholder="Ví dụ: Bổ sung nhận xét Tiêu chuẩn 2 và thay minh chứng đã hết hiệu lực."
              value={returnReason}
              onChange={(event) => {
                setReturnReason(event.target.value);
                setDialogError("");
              }}
            />
            {dialogError ? <span className="mt-2 block text-xs text-[var(--color-danger)]">{dialogError}</span> : null}
          </label>
        ) : pendingCopy?.description ?? ""}
        isOpen={Boolean(pendingCopy)}
        isWorking={props.isLocked}
        title={pendingCopy?.title ?? ""}
        tone={pendingCopy?.tone}
        onCancel={() => {
          setPendingStatus(null);
          setDialogError("");
        }}
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
