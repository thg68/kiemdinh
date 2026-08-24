"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { CapHoc } from "@/lib/assessment/level-engine";
import { getTT57StandardReference } from "@/lib/tt57/reference-data";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";

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
  loai_hinh_ap_dung: string;
  tieu_chuan?: Standard | Standard[] | null;
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
};

const capHocLabels: Record<CapHoc, string> = {
  mam_non: "Mầm non",
  tieu_hoc: "Tiểu học",
  thcs: "THCS",
  thpt: "THPT",
  gdtx: "GDTX",
  khac: "Khác",
};

const exports = [
  { endpoint: "mau-1", label: "Mẫu 1 - Báo cáo tự đánh giá (.docx)", reportType: "mau_1_tu_danh_gia" },
  { endpoint: "mau-2", label: "Mẫu 2 - Kế hoạch cải tiến (.docx)", reportType: "mau_2_ke_hoach_cai_tien" },
  { endpoint: "danh-muc-minh-chung", label: "Danh mục minh chứng (.xlsx)", reportType: "danh_muc_minh_chung" },
  { endpoint: "goi-minh-chung", label: "Gói minh chứng (.zip)", reportType: "goi_minh_chung" },
  { endpoint: "export-json", label: "Dữ liệu đầy đủ năm học (.json)", reportType: "du_lieu_nam_hoc_json" },
];

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
      return;
    }

    setLoading(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      router.replace("/login");
      return;
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
        .select("loai_hinh_ap_dung, tieu_chuan:tieu_chuan_id(id, so_thu_tu, ten)")
        .order("ma", { ascending: true }),
    ]);

    const loadedSchool = schoolData as School | null;
    const loadedYears = (yearData ?? []) as SchoolYear[];
    const activeYear = loadedYears.find((year) => year.trang_thai === "dang_hoat_dong") ?? loadedYears[0];
    const standardsById = new Map<string, Standard>();

    for (const criterion of (criterionData ?? []) as CriterionWithStandard[]) {
      if (criterion.loai_hinh_ap_dung !== (loadedSchool?.loai_hinh ?? "mam_non")) {
        continue;
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
      .select("id, loai_bao_cao, trang_thai, ngay_phe_duyet")
      .eq("co_so_id", profile.co_so_id)
      .eq("nam_hoc_id", selectedYearId)
      .eq("version", 1);

    if (error) {
      setMessage(error.message);
      return;
    }

    setReportRecords((data ?? []) as ReportRecord[]);
  }, [profile, selectedYearId, supabase]);

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

  async function download(endpoint: string) {
    if (!supabase || !selectedYearId || !selectedCapHoc) {
      setMessage("Hãy chọn năm học và cấp học trước khi xuất.");
      return;
    }

    setDownloading(endpoint);
    setMessage("");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      setDownloading("");
      router.replace("/login");
      return;
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
      setDownloading("");
      return;
    }

    const blob = await response.blob();
    const disposition = response.headers.get("content-disposition") ?? "";
    const fileName = decodeURIComponent(
      disposition.match(/filename\*=UTF-8''([^;]+)/)?.[1] ?? `${endpoint}`,
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);

    setDownloading("");
    setMessage("Đã tạo file. Nếu Mẫu 1 còn cảnh báo đỏ, chưa được coi là báo cáo xuất bản chính thức.");
  }

  async function updateReportStatus(reportType: string, status: "nhap" | "cho_duyet" | "da_phe_duyet" | "tra_lai") {
    if (!supabase || !selectedYearId) {
      setMessage("Hãy chọn năm học trước khi cập nhật trạng thái báo cáo.");
      return;
    }

    const { error } = await supabase.rpc("fn_luu_trang_thai_bao_cao", {
      p_nam_hoc_id: selectedYearId,
      p_loai_bao_cao: reportType,
      p_trang_thai: status,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

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

      {message ? <Message text={message} /> : null}

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
  return (
    <article className="surface-card grid gap-3 p-4">
      <div>
        <p className="text-sm font-semibold text-[var(--color-ink-navy)]">{props.item.label}</p>
        <p className="mt-2 inline-flex rounded-full bg-[var(--color-lavender-mist)] px-3 py-1 text-xs font-semibold text-[var(--color-ink-navy)]">
          Trạng thái: {props.currentStatus}
        </p>
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
        <button className="button-secondary" type="button" onClick={() => props.onUpdateStatus(props.item.reportType, "nhap")}>
          Bản nháp
        </button>
        <button className="button-secondary" type="button" onClick={() => props.onUpdateStatus(props.item.reportType, "cho_duyet")}>
          Gửi duyệt
        </button>
        <button className="button-secondary" type="button" onClick={() => props.onUpdateStatus(props.item.reportType, "da_phe_duyet")}>
          Phê duyệt
        </button>
      </div>
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
