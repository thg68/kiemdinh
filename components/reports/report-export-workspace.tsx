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

    const [{ data: schoolData }, { data: yearData }] = await Promise.all([
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
    ]);

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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData]);

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

function Message({ text }: { text: string }) {
  return (
    <p className="border border-[#d8d6c9] bg-[#f7f7f2] px-3 py-2 text-sm text-[#52606d]">
      {text}
    </p>
  );
}
