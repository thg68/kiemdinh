"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { CapHoc } from "@/lib/assessment/level-engine";

type Profile = {
  id: string;
  co_so_id: string;
  ho_ten: string;
};

type School = {
  id: string;
  ten: string;
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

const capHocLabels: Record<CapHoc, string> = {
  mam_non: "Mầm non",
  tieu_hoc: "Tiểu học",
  thcs: "THCS",
  thpt: "THPT",
  gdtx: "GDTX",
  khac: "Khác",
};

const exports = [
  { endpoint: "mau-1", label: "Mẫu 1 - Báo cáo tự đánh giá (.docx)" },
  { endpoint: "mau-2", label: "Mẫu 2 - Kế hoạch cải tiến (.docx)" },
  { endpoint: "danh-muc-minh-chung", label: "Danh mục minh chứng (.xlsx)" },
  { endpoint: "goi-minh-chung", label: "Gói minh chứng (.zip)" },
  { endpoint: "export-json", label: "Dữ liệu đầy đủ năm học (.json)" },
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
  const [selectedYearId, setSelectedYearId] = useState("");
  const [selectedCapHoc, setSelectedCapHoc] = useState<CapHoc>("mam_non");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [downloading, setDownloading] = useState("");
  const [creatingDemo, setCreatingDemo] = useState(false);

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

    const [{ data: schoolData }, { data: yearData }, { data: standardData }] = await Promise.all([
      supabase
        .from("co_so_giao_duc")
        .select("id, ten, cap_hoc")
        .eq("id", profileData.co_so_id)
        .maybeSingle(),
      supabase
        .from("nam_hoc")
        .select("id, ten, trang_thai")
        .eq("co_so_id", profileData.co_so_id)
        .order("ngay_bat_dau", { ascending: false }),
      supabase.from("tieu_chuan").select("id, so_thu_tu, ten").order("so_thu_tu"),
    ]);

    const loadedSchool = schoolData as School | null;
    const loadedYears = (yearData ?? []) as SchoolYear[];
    const activeYear = loadedYears.find((year) => year.trang_thai === "dang_hoat_dong") ?? loadedYears[0];

    setSchool(loadedSchool);
    setYears(loadedYears);
    setStandards((standardData ?? []) as Standard[]);
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

  async function createDemoData() {
    if (!supabase) {
      setMessage("Chưa cấu hình Supabase.");
      return;
    }

    setCreatingDemo(true);
    setMessage("");

    const { data, error } = await supabase.rpc("fn_tao_du_lieu_demo_sprint4");

    setCreatingDemo(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setSelectedYearId(String(data?.nam_hoc_id ?? selectedYearId));
    setSelectedCapHoc((data?.cap_hoc ?? selectedCapHoc) as CapHoc);
    setMessage(
      `Đã tạo dữ liệu DEMO cho Sprint 4: ${data?.so_tu_danh_gia ?? 0} tự đánh giá, ${data?.so_minh_chung_moi ?? 0} minh chứng mới.`,
    );
    await loadStandardNotes();
  }

  if (loading) {
    return <p className="text-sm text-[#52606d]">Đang tải dữ liệu xuất báo cáo...</p>;
  }

  if (!profile || years.length === 0) {
    return (
      <div className="border border-[#d8d6c9] bg-white p-5">
        <p className="text-sm text-[#52606d]">Chưa có đơn vị hoặc năm học để xuất báo cáo.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 border border-[#d8d6c9] bg-white p-5 lg:grid-cols-2">
        <label className="text-sm font-medium">
          Năm học
          <select
            className="mt-2 w-full border border-[#c9c6b8] px-3 py-2 outline-none focus:border-[#17324d]"
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
            className="mt-2 w-full border border-[#c9c6b8] px-3 py-2 outline-none focus:border-[#17324d]"
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

      <section className="border border-[#d8d6c9] bg-white p-5">
        <h2 className="text-lg font-semibold text-[#17324d]">Dữ liệu demo</h2>
        <p className="mt-1 text-sm leading-6 text-[#52606d]">
          Tạo dữ liệu có nhãn [DEMO] cho đơn vị hiện tại để thử xuất file. Dữ liệu này không thay thế minh chứng thật của nhà trường.
        </p>
        <button
          className="mt-4 border border-[#7a3f18] px-4 py-2.5 text-sm font-semibold text-[#7a3f18] disabled:border-[#c9c6b8] disabled:text-[#8da0b2]"
          disabled={creatingDemo}
          type="button"
          onClick={createDemoData}
        >
          {creatingDemo ? "Đang tạo dữ liệu demo..." : "Tạo dữ liệu demo Sprint 4"}
        </button>
      </section>

      <StandardNotesForm
        notes={standardNotes}
        onSave={saveStandardNotes}
        onUpdate={updateNote}
        standards={standards}
      />

      <section className="border border-[#d8d6c9] bg-white">
        <div className="border-b border-[#d8d6c9] px-5 py-4">
          <h2 className="text-lg font-semibold text-[#17324d]">Xuất dữ liệu</h2>
          <p className="mt-1 text-sm leading-6 text-[#52606d]">
            Mẫu 1 là checkpoint Sprint 4: báo cáo chỉ hoàn chỉnh khi dữ liệu thật đã đủ mô tả hiện trạng và mã minh chứng.
          </p>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          {exports.map((item) => (
            <button
              className="border border-[#17324d] px-4 py-3 text-left text-sm font-semibold text-[#17324d] disabled:border-[#8da0b2] disabled:text-[#8da0b2]"
              disabled={Boolean(downloading)}
              key={item.endpoint}
              type="button"
              onClick={() => download(item.endpoint)}
            >
              {downloading === item.endpoint ? "Đang tạo file..." : item.label}
            </button>
          ))}
        </div>
      </section>
    </div>
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
    <section className="border border-[#d8d6c9] bg-white">
      <div className="border-b border-[#d8d6c9] px-5 py-4">
        <h2 className="text-lg font-semibold text-[#17324d]">Nhận xét theo tiêu chuẩn cho Mẫu 1</h2>
        <p className="mt-1 text-sm leading-6 text-[#52606d]">
          Các ô này đi thẳng vào phần Điểm mạnh, Hạn chế và Định hướng cải tiến. Để trống thì file Mẫu 1 sẽ cảnh báo đỏ.
        </p>
      </div>
      <div className="grid gap-5 p-5">
        {props.standards.map((standard) => {
          const note = props.notes.find((item) => item.tieu_chuan_id === standard.id);

          return (
            <fieldset className="grid gap-3 border border-[#e4e1d5] p-4" key={standard.id}>
              <legend className="px-2 text-sm font-semibold text-[#17324d]">
                Tiêu chuẩn {standard.so_thu_tu}: {standard.ten}
              </legend>
              <label className="text-sm font-medium">
                Điểm mạnh nổi bật
                <textarea
                  className="mt-2 min-h-20 w-full border border-[#c9c6b8] px-3 py-2 outline-none focus:border-[#17324d]"
                  value={note?.diem_manh_noi_bat ?? ""}
                  onChange={(event) => props.onUpdate(standard.id, "diem_manh_noi_bat", event.target.value)}
                />
              </label>
              <label className="text-sm font-medium">
                Điểm hạn chế trọng tâm và nguyên nhân cốt lõi
                <textarea
                  className="mt-2 min-h-20 w-full border border-[#c9c6b8] px-3 py-2 outline-none focus:border-[#17324d]"
                  value={note?.han_che_trong_tam ?? ""}
                  onChange={(event) => props.onUpdate(standard.id, "han_che_trong_tam", event.target.value)}
                />
              </label>
              <label className="text-sm font-medium">
                Định hướng cải tiến chất lượng
                <textarea
                  className="mt-2 min-h-20 w-full border border-[#c9c6b8] px-3 py-2 outline-none focus:border-[#17324d]"
                  value={note?.dinh_huong_cai_tien ?? ""}
                  onChange={(event) => props.onUpdate(standard.id, "dinh_huong_cai_tien", event.target.value)}
                />
              </label>
            </fieldset>
          );
        })}
      </div>
      <div className="border-t border-[#d8d6c9] px-5 py-4">
        <button className="bg-[#17324d] px-4 py-2.5 text-sm font-semibold text-white" type="button" onClick={props.onSave}>
          Lưu nhận xét Mẫu 1
        </button>
      </div>
    </section>
  );
}

function Message({ text }: { text: string }) {
  return (
    <p className="border border-[#d8d6c9] bg-[#f7f7f2] px-3 py-2 text-sm text-[#52606d]">
      {text}
    </p>
  );
}
