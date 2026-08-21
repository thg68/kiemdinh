"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

type Profile = {
  id: string;
  co_so_id: string;
  ho_ten: string;
};

type School = {
  id: string;
  ten: string;
  loai_hinh: string;
};

type SchoolYear = {
  id: string;
  ten: string;
  ngay_bat_dau: string;
  ngay_ket_thuc: string;
  trang_thai: string;
};

const capHocOptions = [
  { value: "mam_non", label: "Mầm non" },
  { value: "tieu_hoc", label: "Tiểu học" },
  { value: "thcs", label: "THCS" },
  { value: "thpt", label: "THPT" },
  { value: "gdtx", label: "GDTX" },
];

export function SchoolYearSetup() {
  const router = useRouter();
  const supabase = useMemo(() => {
    if (!isSupabaseConfigured()) {
      return null;
    }

    return createBrowserSupabaseClient();
  }, []);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [years, setYears] = useState<SchoolYear[]>([]);

  const [tenCoSo, setTenCoSo] = useState("");
  const [maTruong, setMaTruong] = useState("");
  const [loaiHinh, setLoaiHinh] = useState("mam_non");
  const [capHoc, setCapHoc] = useState<string[]>(["mam_non"]);
  const [hoTen, setHoTen] = useState("");
  const [tenNamHoc, setTenNamHoc] = useState("2026-2027");
  const [ngayBatDau, setNgayBatDau] = useState("2026-09-01");
  const [ngayKetThuc, setNgayKetThuc] = useState("2027-05-31");

  const loadData = useCallback(async () => {
    if (!supabase) {
      setMessage("Chưa cấu hình Supabase trong .env.local.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessage("");

    const { data: sessionData } = await supabase.auth.getUser();

    if (!sessionData.user) {
      router.replace("/login");
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("nguoi_dung")
      .select("id, co_so_id, ho_ten")
      .eq("auth_user_id", sessionData.user.id)
      .maybeSingle();

    if (profileError) {
      setMessage(profileError.message);
      setLoading(false);
      return;
    }

    if (!profileData) {
      setHoTen(
        String(sessionData.user.user_metadata?.ho_ten ?? "") ||
          String(sessionData.user.email ?? ""),
      );
      setLoading(false);
      return;
    }

    setProfile(profileData);

    const [{ data: schoolData }, { data: yearData }] = await Promise.all([
      supabase
        .from("co_so_giao_duc")
        .select("id, ten, loai_hinh")
        .eq("id", profileData.co_so_id)
        .maybeSingle(),
      supabase
        .from("nam_hoc")
        .select("id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai")
        .eq("co_so_id", profileData.co_so_id)
        .order("ngay_bat_dau", { ascending: false }),
    ]);

    setSchool(schoolData ?? null);
    setYears(yearData ?? []);
    setLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData]);

  async function handleCreateSchool(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setMessage("Chưa cấu hình Supabase trong .env.local.");
      return;
    }

    setMessage("");

    const { error } = await supabase.rpc("fn_khoi_tao_co_so_va_nam_hoc", {
      p_ten_co_so: tenCoSo,
      p_ma_truong: maTruong,
      p_loai_hinh: loaiHinh,
      p_cap_hoc: capHoc,
      p_nam_hoc_ten: tenNamHoc,
      p_ngay_bat_dau: ngayBatDau,
      p_ngay_ket_thuc: ngayKetThuc,
      p_ho_ten: hoTen,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Đã tạo cơ sở giáo dục và năm học đang hoạt động.");
    await loadData();
  }

  async function activateYear(yearId: string) {
    if (!supabase || !profile) {
      return;
    }

    setMessage("");

    await supabase
      .from("nam_hoc")
      .update({ trang_thai: "chuan_bi" })
      .eq("co_so_id", profile.co_so_id)
      .eq("trang_thai", "dang_hoat_dong");

    const { error } = await supabase
      .from("nam_hoc")
      .update({ trang_thai: "dang_hoat_dong" })
      .eq("id", yearId)
      .eq("co_so_id", profile.co_so_id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await loadData();
  }

  async function handleCreateYear(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !profile) {
      return;
    }

    setMessage("");

    const { data, error } = await supabase.rpc("fn_tao_nam_hoc_ke_thua", {
      p_ten: tenNamHoc,
      p_ngay_bat_dau: ngayBatDau,
      p_ngay_ket_thuc: ngayKetThuc,
      p_ke_thua_tu_nam_hoc_id: null,
      p_dat_lam_dang_hoat_dong: true,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    const inheritedCount = data?.[0]?.so_tu_danh_gia_ke_thua ?? 0;
    setMessage(
      `Đã tạo năm học mới và kế thừa ${inheritedCount} bản ghi tự đánh giá ở trạng thái chờ cập nhật.`,
    );
    await loadData();
  }

  function toggleCapHoc(value: string) {
    setCapHoc((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  if (loading) {
    return <p className="text-sm text-[#52606d]">Đang tải dữ liệu...</p>;
  }

  if (!profile) {
    return (
      <form
        className="grid gap-4 border border-[#d8d6c9] bg-white p-6"
        onSubmit={handleCreateSchool}
      >
        <h2 className="text-xl font-semibold text-[#17324d]">
          Thiết lập cơ sở giáo dục
        </h2>

        <label className="text-sm font-medium">
          Tên cơ sở giáo dục
          <input
            className="mt-2 w-full border border-[#c9c6b8] px-3 py-2 outline-none focus:border-[#17324d]"
            value={tenCoSo}
            onChange={(event) => setTenCoSo(event.target.value)}
            required
          />
        </label>

        <label className="text-sm font-medium">
          Mã trường
          <input
            className="mt-2 w-full border border-[#c9c6b8] px-3 py-2 outline-none focus:border-[#17324d]"
            value={maTruong}
            onChange={(event) => setMaTruong(event.target.value)}
          />
        </label>

        <label className="text-sm font-medium">
          Loại hình
          <select
            className="mt-2 w-full border border-[#c9c6b8] px-3 py-2 outline-none focus:border-[#17324d]"
            value={loaiHinh}
            onChange={(event) => setLoaiHinh(event.target.value)}
          >
            <option value="mam_non">Mầm non</option>
            <option value="pho_thong">Phổ thông</option>
            <option value="gdtx">GDTX</option>
          </select>
        </label>

        <fieldset className="grid gap-2 text-sm font-medium">
          <legend>Cấp học</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {capHocOptions.map((option) => (
              <label
                className="flex items-center gap-2 border border-[#d8d6c9] px-3 py-2"
                key={option.value}
              >
                <input
                  type="checkbox"
                  checked={capHoc.includes(option.value)}
                  onChange={() => toggleCapHoc(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="text-sm font-medium">
          Họ tên người phụ trách
          <input
            className="mt-2 w-full border border-[#c9c6b8] px-3 py-2 outline-none focus:border-[#17324d]"
            value={hoTen}
            onChange={(event) => setHoTen(event.target.value)}
            required
          />
        </label>

        <YearFields
          tenNamHoc={tenNamHoc}
          ngayBatDau={ngayBatDau}
          ngayKetThuc={ngayKetThuc}
          setTenNamHoc={setTenNamHoc}
          setNgayBatDau={setNgayBatDau}
          setNgayKetThuc={setNgayKetThuc}
        />

        <button className="bg-[#17324d] px-4 py-2.5 text-sm font-semibold text-white">
          Tạo đơn vị và năm học
        </button>

        {message ? <Message text={message} /> : null}
      </form>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="border border-[#d8d6c9] bg-white p-6">
        <p className="text-sm text-[#52606d]">Cơ sở giáo dục</p>
        <h2 className="mt-1 text-xl font-semibold text-[#17324d]">
          {school?.ten ?? "Chưa tải được tên đơn vị"}
        </h2>
        <p className="mt-2 text-sm text-[#52606d]">
          Người dùng: {profile.ho_ten}
        </p>
      </section>

      <section className="border border-[#d8d6c9] bg-white p-6">
        <h2 className="text-xl font-semibold text-[#17324d]">Năm học</h2>
        <div className="mt-4 grid gap-3">
          {years.length === 0 ? (
            <p className="text-sm text-[#52606d]">Chưa có năm học.</p>
          ) : (
            years.map((year) => (
              <div
                className="grid gap-3 border border-[#d8d6c9] p-3 sm:grid-cols-[1fr_auto]"
                key={year.id}
              >
                <div>
                  <p className="font-medium text-[#17324d]">{year.ten}</p>
                  <p className="text-sm text-[#52606d]">
                    {year.ngay_bat_dau} đến {year.ngay_ket_thuc}
                  </p>
                </div>
                <button
                  className="border border-[#17324d] px-3 py-2 text-sm font-semibold text-[#17324d] disabled:border-[#c9c6b8] disabled:text-[#8da0b2]"
                  disabled={year.trang_thai === "dang_hoat_dong"}
                  onClick={() => activateYear(year.id)}
                >
                  {year.trang_thai === "dang_hoat_dong"
                    ? "Đang hoạt động"
                    : "Chọn năm học"}
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <form
        className="grid gap-4 border border-[#d8d6c9] bg-white p-6"
        onSubmit={handleCreateYear}
      >
        <h2 className="text-xl font-semibold text-[#17324d]">
          Tạo năm học mới
        </h2>
        <YearFields
          tenNamHoc={tenNamHoc}
          ngayBatDau={ngayBatDau}
          ngayKetThuc={ngayKetThuc}
          setTenNamHoc={setTenNamHoc}
          setNgayBatDau={setNgayBatDau}
          setNgayKetThuc={setNgayKetThuc}
        />
        <button className="bg-[#17324d] px-4 py-2.5 text-sm font-semibold text-white">
          Tạo và chọn năm học
        </button>
      </form>

      {message ? <Message text={message} /> : null}
    </div>
  );
}

function YearFields(props: {
  tenNamHoc: string;
  ngayBatDau: string;
  ngayKetThuc: string;
  setTenNamHoc: (value: string) => void;
  setNgayBatDau: (value: string) => void;
  setNgayKetThuc: (value: string) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <label className="text-sm font-medium">
        Năm học
        <input
          className="mt-2 w-full border border-[#c9c6b8] px-3 py-2 outline-none focus:border-[#17324d]"
          value={props.tenNamHoc}
          onChange={(event) => props.setTenNamHoc(event.target.value)}
          required
        />
      </label>
      <label className="text-sm font-medium">
        Ngày bắt đầu
        <input
          className="mt-2 w-full border border-[#c9c6b8] px-3 py-2 outline-none focus:border-[#17324d]"
          type="date"
          value={props.ngayBatDau}
          onChange={(event) => props.setNgayBatDau(event.target.value)}
          required
        />
      </label>
      <label className="text-sm font-medium">
        Ngày kết thúc
        <input
          className="mt-2 w-full border border-[#c9c6b8] px-3 py-2 outline-none focus:border-[#17324d]"
          type="date"
          value={props.ngayKetThuc}
          onChange={(event) => props.setNgayKetThuc(event.target.value)}
          required
        />
      </label>
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
