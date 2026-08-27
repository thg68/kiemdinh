"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

export type AppProfile = {
  id: string;
  co_so_id: string;
  ho_ten: string | null;
  email?: string | null;
};

export type AppSchool = {
  id: string;
  ten: string;
  loai_hinh: string;
  cap_hoc: string[] | null;
};

export type AppSchoolYear = {
  id: string;
  ten: string;
  trang_thai: string;
  bo_tieu_chuan_id: string;
};

export function useAppContext() {
  const router = useRouter();
  const supabase = useMemo(() => {
    if (!isSupabaseConfigured()) {
      return null;
    }

    return createBrowserSupabaseClient();
  }, []);
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [school, setSchool] = useState<AppSchool | null>(null);
  const [years, setYears] = useState<AppSchoolYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const activeYear = years.find((year) => year.trang_thai === "dang_hoat_dong") ?? years[0];

  const loadContext = useCallback(async () => {
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
      .select("id, co_so_id, ho_ten, email")
      .eq("auth_user_id", userData.user.id)
      .maybeSingle();

    if (profileError || !profileData) {
      setMessage(profileError?.message ?? "Bạn cần thuộc một cơ sở giáo dục trước khi dùng chức năng này.");
      setLoading(false);
      return;
    }

    const [{ data: schoolData, error: schoolError }, { data: yearData, error: yearError }] =
      await Promise.all([
        supabase
          .from("co_so_giao_duc")
          .select("id, ten, loai_hinh, cap_hoc")
          .eq("id", profileData.co_so_id)
          .maybeSingle(),
        supabase
          .from("nam_hoc")
          .select("id, ten, trang_thai, bo_tieu_chuan_id")
          .eq("co_so_id", profileData.co_so_id)
          .order("ngay_bat_dau", { ascending: false }),
      ]);

    if (schoolError || yearError) {
      setMessage(schoolError?.message ?? yearError?.message ?? "Không tải được thông tin đơn vị.");
      setLoading(false);
      return;
    }

    setProfile(profileData as AppProfile);
    setSchool(schoolData as AppSchool | null);
    setYears((yearData ?? []) as AppSchoolYear[]);
    setLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadContext();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadContext]);

  return {
    activeYear,
    loading,
    loadContext,
    message,
    profile,
    school,
    setMessage,
    supabase,
    years,
  };
}
