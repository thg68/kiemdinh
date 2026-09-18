"use client";

import { toUserMessage } from "@/lib/errors/user-message";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { Alert } from "@/components/ui/alert";
import { AiSessionSettings } from "@/components/ai/ai-session-settings";
import { SchoolPicker } from "@/components/auth/school-picker";
import { LoadingState } from "@/components/ui/loading-state";
import { DEFAULT_PAGE_SIZE, Pagination } from "@/components/ui/pagination";
import {
  type CapHocValue,
} from "@/lib/domain/school-metadata";
import type { RegistrationSchool } from "@/lib/schools/directory";

type Profile = {
  id: string;
  co_so_id: string;
  ho_ten: string;
};

type School = {
  id: string;
  ten: string;
  loai_hinh: string;
  cap_hoc: CapHocValue[];
  ma_truong?: string | null;
};

type SchoolYear = {
  id: string;
  ten: string;
  ngay_bat_dau: string;
  ngay_ket_thuc: string;
  trang_thai: string;
};

type Role = {
  id: string;
  ma: string;
  ten: string;
};

type Criterion = {
  id: string;
  ma: string;
  ten: string;
  loai_hinh_ap_dung: string;
};

type Assignment = {
  id: string;
  nam_hoc_id: string;
  nguoi_dung_id: string;
  tieu_chi_id: string;
  cap_hoc: CapHocValue | null;
  vai_tro_trong_tieu_chi: string | null;
};

type UserRole = {
  vai_tro?: Role | Role[] | null;
};

type ManagedUser = {
  id: string;
  ho_ten: string;
  email: string | null;
  trang_thai: string;
  nguoi_dung_vai_tro?: UserRole[];
  total_count?: number;
};

type PendingInvitation = {
  id: string;
  co_so_id: string;
  ten_co_so: string;
  ten_vai_tro: string;
  het_han_luc: string;
};

type ManagedInvitation = {
  id: string;
  email: string;
  ho_ten: string | null;
  ma_vai_tro: string;
  ten_vai_tro: string;
  trang_thai: string;
  het_han_luc: string;
  created_at: string;
};

const assignableRoleCodes = [
  "SELF_ASSESSMENT_CHAIR",
  "SECRETARY",
  "MEMBER",
  "TEACHER",
  "VIEWER",
];

const rolePriority: Record<string, number> = {
  SYSTEM_ADMIN: 0,
  PRINCIPAL: 1,
  SELF_ASSESSMENT_CHAIR: 2,
  SECRETARY: 3,
  MEMBER: 4,
  TEACHER: 5,
  VIEWER: 6,
};

function highestRolePriority(roles: Role[]) {
  return roles.reduce(
    (priority, role) => Math.min(priority, rolePriority[role.ma] ?? Number.MAX_SAFE_INTEGER),
    Number.MAX_SAFE_INTEGER,
  );
}

function sameRoleCodes(left: string[], right: string[]) {
  if (left.length !== right.length) return false;

  const sortedLeft = [...left].sort();
  const sortedRight = [...right].sort();

  return sortedLeft.every((roleCode, index) => roleCode === sortedRight[index]);
}

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
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [assignmentUsers, setAssignmentUsers] = useState<ManagedUser[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [roles, setRoles] = useState<Role[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [canManageUsers, setCanManageUsers] = useState(false);
  const [canManageAssignments, setCanManageAssignments] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [selectedRegistrationSchool, setSelectedRegistrationSchool] = useState<RegistrationSchool | null>(null);
  const selectedRegistrationSchoolId = selectedRegistrationSchool?.id ?? "";
  const [isJoiningSchool, setIsJoiningSchool] = useState(false);
  const [managedInvitations, setManagedInvitations] = useState<ManagedInvitation[]>([]);
  const [setupPanel, setSetupPanel] = useState<"assignments" | "school" | "users">("school");

  const [tenNamHoc, setTenNamHoc] = useState("2026-2027");
  const [ngayBatDau, setNgayBatDau] = useState("2026-09-01");
  const [ngayKetThuc, setNgayKetThuc] = useState("2027-05-31");
  const activeYear = years.find((year) => year.trang_thai === "dang_hoat_dong") ?? years[0];

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
      setMessage(toUserMessage(profileError, "Không tải được hồ sơ người dùng. Vui lòng thử lại."));
      setLoading(false);
      return;
    }

    if (!profileData) {
      const { data: invitationData, error: invitationError } = await supabase.rpc("fn_danh_sach_loi_moi_cua_toi");
      setPendingInvitations((invitationData ?? []) as PendingInvitation[]);
      if (invitationError) {
        setMessage(
          toUserMessage(
            invitationError,
            "Không tải được lời mời. Vui lòng tải lại trang.",
          ),
        );
      }
      setLoading(false);
      return;
    }

    setProfile(profileData);

    const [
      { data: schoolData, error: schoolError },
      { data: yearData, error: yearError },
      { data: userData, error: userError },
      { data: assignmentUserData, error: assignmentUserError },
      { data: roleData, error: roleError },
      { data: canManage, error: canManageError },
      { data: canManageAssignment, error: canManageAssignmentError },
      { data: managedInvitationData, error: managedInvitationError },
    ] = await Promise.all([
      supabase
        .from("co_so_giao_duc")
        .select("id, ten, loai_hinh, cap_hoc, ma_truong")
        .eq("id", profileData.co_so_id)
        .maybeSingle(),
      supabase
        .from("nam_hoc")
        .select("id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai")
        .eq("co_so_id", profileData.co_so_id)
        .order("ngay_bat_dau", { ascending: false }),
      supabase.rpc("fn_danh_sach_thanh_vien", {
        p_limit: DEFAULT_PAGE_SIZE,
        p_offset: (userPage - 1) * DEFAULT_PAGE_SIZE,
      }),
      supabase
        .from("nguoi_dung")
        .select("id, ho_ten, email, trang_thai, nguoi_dung_vai_tro!nguoi_dung_vai_tro_nguoi_dung_id_co_so_id_fkey(vai_tro:vai_tro_id(id, ma, ten))")
        .eq("co_so_id", profileData.co_so_id)
        .eq("trang_thai", "active")
        .order("ho_ten", { ascending: true }),
      supabase
        .from("vai_tro")
        .select("id, ma, ten")
        .in("ma", assignableRoleCodes)
        .order("ten", { ascending: true }),
      supabase.rpc("fn_can_manage_users", {
        p_co_so_id: profileData.co_so_id,
      }),
      supabase.rpc("fn_can_manage_assignment", {
        p_co_so_id: profileData.co_so_id,
      }),
      supabase.rpc("fn_danh_sach_loi_moi_cua_co_so"),
    ]);

    const loadError =
      schoolError ??
      yearError ??
      userError ??
      assignmentUserError ??
      roleError ??
      canManageError ??
      canManageAssignmentError ??
      managedInvitationError;

    if (loadError) {
      setMessage(
        toUserMessage(
          loadError,
          "Không tải được dữ liệu người dùng và phân quyền. Vui lòng tải lại trang.",
        ),
      );
      setLoading(false);
      return;
    }

    setSchool(schoolData ?? null);
    setYears(yearData ?? []);
    const loadedUsers = (userData ?? []) as unknown as ManagedUser[];
    setUsers(loadedUsers);
    setAssignmentUsers((assignmentUserData ?? []) as ManagedUser[]);
    setUserCount(Number(loadedUsers[0]?.total_count ?? 0));
    setRoles((roleData ?? []) as Role[]);
    setCanManageUsers(Boolean(canManage));
    setCanManageAssignments(Boolean(canManageAssignment));
    setManagedInvitations((managedInvitationData ?? []) as ManagedInvitation[]);

    const loadedYears = (yearData ?? []) as SchoolYear[];
    const loadedActiveYear = loadedYears.find((year) => year.trang_thai === "dang_hoat_dong") ?? loadedYears[0];

    if (loadedActiveYear) {
      const [
        { data: assignmentData, error: assignmentError },
        { data: criterionData, error: criterionError },
      ] = await Promise.all([
        supabase
          .from("phan_cong_tieu_chi")
          .select("id, nam_hoc_id, nguoi_dung_id, tieu_chi_id, cap_hoc, vai_tro_trong_tieu_chi")
          .eq("co_so_id", profileData.co_so_id)
          .eq("nam_hoc_id", loadedActiveYear.id),
        supabase
          .from("v_tieu_chi_nam_hoc")
          .select("id, ma, ten, loai_hinh_ap_dung")
          .eq("co_so_id", profileData.co_so_id)
          .eq("nam_hoc_id", loadedActiveYear.id)
          .order("ma", { ascending: true }),
      ]);

      const assignmentLoadError = assignmentError ?? criterionError;

      if (assignmentLoadError) {
        setMessage(
          toUserMessage(
            assignmentLoadError,
            "Không tải được dữ liệu phân công tiêu chí. Vui lòng tải lại trang.",
          ),
        );
        setLoading(false);
        return;
      }

      setAssignments((assignmentData ?? []) as Assignment[]);
      setCriteria((criterionData ?? []) as Criterion[]);
    } else {
      setAssignments([]);
      setCriteria([]);
    }

    setLoading(false);
  }, [router, supabase, userPage]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData]);

  async function respondToInvitation(invitationId: string, accept: boolean) {
    if (!supabase) return;
    setMessage("");
    const { error } = await supabase.rpc(
      accept ? "fn_chap_nhan_loi_moi" : "fn_tu_choi_loi_moi",
      { p_loi_moi_id: invitationId },
    );
    if (error) {
      setMessage(toUserMessage(error));
      return;
    }
    setMessage(accept ? "Đã tham gia đơn vị." : "Đã từ chối lời mời.");
    await loadData();
  }

  async function joinSelectedSchool() {
    if (!supabase || !selectedRegistrationSchoolId) return;

    setIsJoiningSchool(true);
    setMessage("");
    const { error } = await supabase.rpc("fn_tu_dang_ky_vao_co_so", {
      p_co_so_id: selectedRegistrationSchoolId,
    });

    if (error) {
      setMessage(
        toUserMessage(
          error,
          "Không thể tham gia trường đã chọn. Vui lòng tải lại trang hoặc liên hệ quản trị hệ thống.",
        ),
      );
      setIsJoiningSchool(false);
      return;
    }

    router.replace("/viec-cua-toi");
    router.refresh();
  }

  async function activateYear(yearId: string) {
    if (!supabase || !profile) {
      return;
    }

    setMessage("");

    // RPC giữ thao tác hạ năm cũ và kích hoạt năm mới trong cùng transaction.
    const { error } = await supabase.rpc("fn_dat_nam_hoc_dang_hoat_dong", {
      p_nam_hoc_id: yearId,
    });

    if (error) {
      setMessage(toUserMessage(error));
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
      setMessage(toUserMessage(error));
      return;
    }

    const inheritedCount = data?.[0]?.so_tu_danh_gia_ke_thua ?? 0;
    setMessage(
      `Đã tạo năm học mới và kế thừa ${inheritedCount} bản ghi tự đánh giá ở trạng thái chờ cập nhật.`,
    );
    await loadData();
  }

  function userRoles(user: ManagedUser) {
    return (user.nguoi_dung_vai_tro ?? [])
      .map((item) => (Array.isArray(item.vai_tro) ? item.vai_tro[0] : item.vai_tro))
      .filter(Boolean) as Role[];
  }

  if (loading) {
    return <LoadingState label="Đang tải dữ liệu thiết lập…" />;
  }

  if (!profile) {
    return (
      <SchoolRegistrationPanel
        invitations={pendingInvitations}
        isJoining={isJoiningSchool}
        message={message}
        selectedSchool={selectedRegistrationSchool}
        onJoin={joinSelectedSchool}
        onRespond={respondToInvitation}
        onSelectSchool={setSelectedRegistrationSchool}
      />
    );
  }

  return (
    <div className="grid gap-6">
      <SetupTabs activePanel={setupPanel} onChange={setSetupPanel} />
      {message ? <Message text={message} /> : null}
      <section className={`featured-card ${setupPanel === "school" ? "" : "hidden"}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
              Cơ sở giáo dục
            </span>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
              {school?.ten ?? "Chưa tải được tên đơn vị"}
            </h2>
          </div>

          {school?.ma_truong ? (
            <div className="inline-flex items-center gap-2 self-start rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-md border border-white/20 shadow-sm sm:self-auto">
              <svg className="h-3.5 w-3.5 text-white/80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span className="text-white/70">Mã trường:</span>
              <code className="rounded bg-white/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-white">
                {school.ma_truong}
              </code>
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-4 text-xs text-white/75">
          <div className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-white/60" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <span>Tài khoản: <strong className="font-semibold text-white">{profile.ho_ten}</strong></span>
          </div>
          {school?.loai_hinh ? (
            <div className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-white/40" />
              <span>Loại hình: <strong className="font-semibold text-white">{school.loai_hinh === "mam_non" ? "Mầm non" : school.loai_hinh === "pho_thong" ? "Phổ thông" : "GDTX"}</strong></span>
            </div>
          ) : null}
        </div>
      </section>

      <div className={setupPanel === "school" ? "" : "hidden"}>
        <AiSessionSettings />
      </div>

      <section className={`surface-card surface-card-pad ${setupPanel === "school" ? "" : "hidden"}`}>
        <h2 className="section-title text-xl">Năm học</h2>
        <div className="mt-4 grid gap-3">
          {years.length === 0 ? (
            <p className="text-sm text-[var(--color-graphite)]/70">Chưa có năm học.</p>
          ) : (
            years.map((year) => (
              <div
                className="surface-card grid gap-3 p-4 sm:grid-cols-[1fr_auto]"
                key={year.id}
              >
                <div>
                  <p className="font-medium text-[var(--color-ink-navy)]">{year.ten}</p>
                  <p className="text-sm text-[var(--color-graphite)]/70">
                    {year.ngay_bat_dau} đến {year.ngay_ket_thuc}
                  </p>
                </div>
                <button
                  className="button-secondary disabled:text-[var(--color-stone)]"
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
        className={`surface-card grid gap-5 p-6 ${setupPanel === "school" ? "" : "hidden"}`}
        onSubmit={handleCreateYear}
      >
        <h2 className="section-title text-xl">
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
        <button className="button-primary">
          Tạo và chọn năm học
        </button>
      </form>

      {setupPanel === "users" ? (
      <UserRoleManager
        canManageUsers={canManageUsers}
        currentUserId={profile.id}
        invitations={managedInvitations}
        roles={roles}
        supabase={supabase}
        users={users}
        page={userPage}
        total={userCount}
        userRoles={userRoles}
        onPageChange={setUserPage}
        onChanged={loadData}
        onMessage={setMessage}
      />
      ) : null}

      {setupPanel === "assignments" ? (
      <AssignmentManager
        activeYear={activeYear ?? null}
        assignments={assignments}
        canManageAssignments={canManageAssignments}
        capHocList={school?.cap_hoc ?? []}
        criteria={criteria}
        supabase={supabase}
        users={assignmentUsers}
        onChanged={loadData}
        onMessage={setMessage}
      />
      ) : null}

    </div>
  );
}

function SchoolRegistrationPanel({
  invitations,
  isJoining,
  message,
  selectedSchool,
  onJoin,
  onRespond,
  onSelectSchool,
}: {
  invitations: PendingInvitation[];
  isJoining: boolean;
  message: string;
  selectedSchool: RegistrationSchool | null;
  onJoin: () => Promise<void>;
  onRespond: (invitationId: string, accept: boolean) => Promise<void>;
  onSelectSchool: (school: RegistrationSchool | null) => void;
}) {
  return (
    <section className="surface-card overflow-hidden">
      <div className="border-b border-[var(--color-border)] p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-electric-cobalt)]">Hoàn tất hồ sơ</p>
        <h2 className="section-title mt-2 text-2xl">Chọn trường đang công tác</h2>
        <p className="muted mt-2 max-w-2xl text-sm leading-6">
          Chọn tỉnh/thành phố rồi tìm trường đang công tác. Hệ thống sẽ tạo hồ sơ Giáo viên và đưa bạn vào đúng đơn vị sau khi xác nhận.
        </p>
      </div>
      <div className="grid gap-4 p-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <SchoolPicker
          disabled={isJoining}
          selectedSchool={selectedSchool}
          onSelect={onSelectSchool}
        />
        <button
          className="button-primary min-h-12 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!selectedSchool || isJoining}
          type="button"
          onClick={() => void onJoin()}
        >
          {isJoining ? "Đang tham gia…" : "Tham gia trường"}
        </button>
      </div>
      {invitations.length > 0 ? (
        <div className="border-t border-[var(--color-border)]">
          <div className="px-6 py-4">
            <h3 className="font-semibold text-[var(--color-ink-navy)]">Lời mời vai trò đang chờ</h3>
            <p className="muted mt-1 text-sm">Bạn cũng có thể nhận lời mời đã được đơn vị gửi trước đó.</p>
          </div>
        <div className="divide-y divide-[var(--color-border)]">
          {invitations.map((invitation) => (
            <div className="grid gap-4 p-6 sm:grid-cols-[1fr_auto] sm:items-center" key={invitation.id}>
              <div>
                <h3 className="font-semibold text-[var(--color-ink-navy)]">{invitation.ten_co_so}</h3>
                <p className="muted mt-1 text-sm">Vai trò được mời: {invitation.ten_vai_tro}</p>
                <p className="muted mt-1 text-xs">Có hiệu lực đến {new Date(invitation.het_han_luc).toLocaleDateString("vi-VN")}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="button-primary" type="button" onClick={() => void onRespond(invitation.id, true)}>Tham gia đơn vị</button>
                <button className="button-secondary" type="button" onClick={() => void onRespond(invitation.id, false)}>Từ chối</button>
              </div>
            </div>
          ))}
        </div>
        </div>
      ) : null}
      {message ? <div className="border-t border-[var(--color-border)] p-6"><Message text={message} /></div> : null}
    </section>
  );
}


function SetupTabs({
  activePanel,
  onChange,
}: {
  activePanel: "assignments" | "school" | "users";
  onChange: (panel: "assignments" | "school" | "users") => void;
}) {
  const tabs = [
    { id: "school" as const, label: "Đơn vị và năm học" },
    { id: "users" as const, label: "Người dùng và vai trò" },
    { id: "assignments" as const, label: "Phân công tiêu chí" },
  ];

  return (
    <div className="surface-card p-2">
      <div className="segmented-control grid-cols-1 text-sm font-semibold md:grid-cols-3" role="tablist" aria-label="Khu vực thiết lập">
        {tabs.map((tab) => (
          <button
            aria-selected={activePanel === tab.id}
            className={`segmented-option ${activePanel === tab.id ? "segmented-option-active" : "text-[var(--color-graphite)]"}`}
            key={tab.id}
            role="tab"
            type="button"
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function UserRoleManager(props: {
  canManageUsers: boolean;
  currentUserId: string;
  invitations: ManagedInvitation[];
  roles: Role[];
  supabase: ReturnType<typeof createBrowserSupabaseClient> | null;
  users: ManagedUser[];
  page: number;
  total: number;
  userRoles: (user: ManagedUser) => Role[];
  onPageChange: (page: number) => void;
  onChanged: () => Promise<void>;
  onMessage: (message: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [hoTen, setHoTen] = useState("");
  const [roleCode, setRoleCode] = useState("TEACHER");
  const [saving, setSaving] = useState("");
  const sortedUsers = [...props.users].sort((left, right) => {
    const priorityDifference = highestRolePriority(props.userRoles(left))
      - highestRolePriority(props.userRoles(right));

    return priorityDifference || left.ho_ten.localeCompare(right.ho_ten, "vi");
  });

  async function inviteUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!props.supabase) {
      props.onMessage("Chưa cấu hình Supabase.");
      return;
    }

    setSaving("invite");
    props.onMessage("");

    const { error } = await props.supabase.rpc("fn_moi_nguoi_dung_vao_co_so", {
      p_email: email,
      p_ho_ten: hoTen,
      p_vai_tro_ma: roleCode,
    });

    setSaving("");

    if (error) {
      props.onMessage(toUserMessage(error));
      return;
    }

    setEmail("");
    setHoTen("");
    setRoleCode("TEACHER");
    props.onMessage("Đã gửi lời mời tham gia đơn vị.");
    await props.onChanged();
  }

  async function cancelInvitation(invitationId: string) {
    if (!props.supabase) {
      props.onMessage("Chưa cấu hình Supabase.");
      return;
    }

    setSaving(`invitation:${invitationId}`);
    props.onMessage("");

    const { error } = await props.supabase.rpc("fn_huy_loi_moi_thanh_vien", {
      p_loi_moi_id: invitationId,
    });

    setSaving("");

    if (error) {
      props.onMessage(toUserMessage(error));
      return;
    }

    props.onMessage("Đã hủy lời mời.");
    await props.onChanged();
  }

  async function updateUserRoles(userId: string, selectedRoleCodes: string[]) {
    if (!props.supabase) {
      props.onMessage("Chưa cấu hình Supabase.");
      return;
    }

    setSaving(userId);
    props.onMessage("");

    const { error } = await props.supabase.rpc("fn_cap_nhat_vai_tro_nguoi_dung", {
      p_nguoi_dung_id: userId,
      p_vai_tro_mas: selectedRoleCodes,
    });

    setSaving("");

    if (error) {
      props.onMessage(toUserMessage(error));
      return;
    }

    props.onMessage("Đã cập nhật vai trò người dùng.");
    await props.onChanged();
  }

  return (
    <section className="surface-card overflow-hidden">
      <div className="border-b border-[var(--color-border)] px-5 py-4">
        <h2 className="section-title text-xl">Người dùng và phân quyền</h2>
        <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">
          Nhập email người nhận và chọn vai trò. Người nhận có thể tạo tài khoản sau; lời mời sẽ chờ họ xác nhận tham gia đơn vị.
        </p>
      </div>

      {props.canManageUsers ? (
        <form className="grid gap-4 border-b border-[var(--color-border)] p-5 lg:grid-cols-[1fr_1fr_220px_auto]" onSubmit={inviteUser}>
          <label className="text-sm font-medium">
            Email tài khoản
            <input
              className="form-control mt-2"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="text-sm font-medium">
            Họ và tên
            <input
              className="form-control mt-2"
              value={hoTen}
              onChange={(event) => setHoTen(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium">
            Vai trò ban đầu
            <select
              className="form-control mt-2"
              value={roleCode}
              onChange={(event) => setRoleCode(event.target.value)}
            >
              {props.roles.map((role) => (
                <option key={role.ma} value={role.ma}>
                  {role.ten}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button className="button-primary w-full" disabled={saving === "invite"}>
              {saving === "invite" ? "Đang gửi…" : "Gửi lời mời"}
            </button>
          </div>
        </form>
      ) : (
        <p className="border-b border-[var(--color-border)] px-5 py-4 text-sm text-[var(--color-graphite)]/70">
          Bạn đang xem danh sách vai trò. Chỉ Hiệu trưởng mới được thêm người hoặc cập nhật phân quyền.
        </p>
      )}

      {props.canManageUsers ? (
        <div className="border-b border-[var(--color-border)] px-5 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-[var(--color-ink-navy)]">
                Lời mời đang chờ
              </h3>
              <p className="mt-1 text-sm text-[var(--color-graphite)]/70">
                Người nhận sẽ xuất hiện trong danh sách thành viên sau khi chấp nhận lời mời.
              </p>
            </div>
            <span className="rounded-full bg-[var(--color-lavender-mist)] px-3 py-1 text-sm font-semibold text-[var(--color-ink-navy)]">
              {props.invitations.length} lời mời
            </span>
          </div>

          {props.invitations.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--color-graphite)]/70">
              Hiện không có lời mời nào đang chờ.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-[var(--color-border)] rounded-[var(--radius-card)] border border-[var(--color-border)]">
              {props.invitations.map((invitation) => (
                <article
                  className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  key={invitation.id}
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[var(--color-ink-navy)]">
                      {invitation.ho_ten || invitation.email}
                    </p>
                    <p className="mt-1 break-all text-sm text-[var(--color-graphite)]/70">
                      {invitation.email}
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-graphite)]/70">
                      {invitation.ten_vai_tro} · Hết hạn ngày{" "}
                      {new Intl.DateTimeFormat("vi-VN").format(new Date(invitation.het_han_luc))}
                    </p>
                  </div>
                  <button
                    className="button-secondary"
                    disabled={saving === `invitation:${invitation.id}`}
                    type="button"
                    onClick={() => cancelInvitation(invitation.id)}
                  >
                    {saving === `invitation:${invitation.id}` ? "Đang hủy…" : "Hủy lời mời"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      ) : null}

      <div className="border-b border-[var(--color-border)] px-5 py-4">
        <h3 className="text-lg font-semibold text-[var(--color-ink-navy)]">
          Danh sách thành viên
        </h3>
        <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">
          Thành viên được sắp xếp theo vai trò có mức ưu tiên cao nhất.
        </p>
      </div>

      <div className="divide-y divide-[var(--color-border)]">
        {props.users.length === 0 ? (
          <p className="px-5 py-6 text-sm text-[var(--color-graphite)]/70">
            Chưa có người dùng trong đơn vị.
          </p>
        ) : (
          sortedUsers.map((user) => (
            <UserRoleRow
              canManageUsers={props.canManageUsers}
              currentUserId={props.currentUserId}
              isSaving={saving === user.id}
              key={`${user.id}-${props.userRoles(user).map((role) => role.ma).join("-")}`}
              roles={props.roles}
              user={user}
              userRoles={props.userRoles(user)}
              onSave={(roleCodes) => updateUserRoles(user.id, roleCodes)}
            />
          ))
        )}
      </div>
      <Pagination
        page={props.page}
        total={props.total}
        onPageChange={props.onPageChange}
      />
    </section>
  );
}

function UserRoleRow(props: {
  canManageUsers: boolean;
  currentUserId: string;
  isSaving: boolean;
  roles: Role[];
  user: ManagedUser;
  userRoles: Role[];
  onSave: (roleCodes: string[]) => Promise<void>;
}) {
  const [selectedRoleCodes, setSelectedRoleCodes] = useState<string[]>(
    props.userRoles
      .map((role) => role.ma)
      .filter((roleCode) => assignableRoleCodes.includes(roleCode)),
  );
  const [rolePickerOpen, setRolePickerOpen] = useState(false);

  const originalRoleCodes = props.userRoles
    .map((role) => role.ma)
    .filter((roleCode) => assignableRoleCodes.includes(roleCode));
  const fixedRoles = props.userRoles.filter((role) => !assignableRoleCodes.includes(role.ma));
  const orderedRoles = [...props.roles].sort(
    (left, right) => (rolePriority[left.ma] ?? 99) - (rolePriority[right.ma] ?? 99),
  );
  const selectedRoles = orderedRoles.filter((role) => selectedRoleCodes.includes(role.ma));
  const roleSummary = [...fixedRoles, ...selectedRoles]
    .sort((left, right) => (rolePriority[left.ma] ?? 99) - (rolePriority[right.ma] ?? 99))
    .map((role) => role.ten)
    .join(", ");

  function toggleRole(roleCode: string) {
    setSelectedRoleCodes((current) =>
      current.includes(roleCode)
        ? current.filter((item) => item !== roleCode)
        : [...current, roleCode],
    );
  }

  const isCurrentUser = props.user.id === props.currentUserId;
  const canEditRow = props.canManageUsers && !isCurrentUser;
  const hasChanges = !sameRoleCodes(selectedRoleCodes, originalRoleCodes);

  return (
    <article className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(220px,1fr)_minmax(320px,1.5fr)_auto] lg:items-start">
      <div>
        <p className="font-semibold text-[var(--color-ink-navy)]">{props.user.ho_ten}</p>
        <p className="mt-1 text-sm text-[var(--color-graphite)]/70">
          {props.user.email ?? "Chưa có email"}
        </p>
        {isCurrentUser ? (
          <p className="mt-2 text-xs font-semibold text-[var(--color-electric-cobalt)]">
            Tài khoản đang đăng nhập
          </p>
        ) : null}
      </div>

      <div>
        <button
          aria-controls={`role-options-${props.user.id}`}
          aria-expanded={rolePickerOpen}
          className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-[6px] border px-4 py-3 text-left text-sm transition-colors ${
            rolePickerOpen
              ? "border-[var(--color-electric-cobalt)] bg-[var(--color-lavender-mist)]/45"
              : "border-[var(--color-border)] bg-white"
          } ${canEditRow ? "hover:border-[var(--color-electric-cobalt)]" : "cursor-default opacity-75"}`}
          disabled={!canEditRow}
          type="button"
          onClick={() => setRolePickerOpen((open) => !open)}
        >
          <span className={roleSummary ? "font-semibold text-[var(--color-ink-navy)]" : "text-[var(--color-graphite)]/70"}>
            {roleSummary || "Chưa gán vai trò"}
          </span>
          {canEditRow ? (
            <span
              aria-hidden="true"
              className={`shrink-0 text-lg leading-none transition-transform ${rolePickerOpen ? "rotate-180" : ""}`}
            >
              ⌄
            </span>
          ) : null}
        </button>

        {rolePickerOpen && canEditRow ? (
          <fieldset
            className="mt-2 grid gap-1 rounded-[6px] border border-[var(--color-border)] bg-white p-2 sm:grid-cols-2"
            id={`role-options-${props.user.id}`}
          >
            <legend className="sr-only">Chọn vai trò cho {props.user.ho_ten}</legend>
            {orderedRoles.map((role) => (
              <label
                className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-[6px] px-3 py-2 text-sm transition-colors hover:bg-[var(--color-lavender-mist)]/45 ${
                  selectedRoleCodes.includes(role.ma) ? "font-semibold text-[var(--color-ink-navy)]" : ""
                }`}
                key={role.ma}
              >
                <input
                  checked={selectedRoleCodes.includes(role.ma)}
                  type="checkbox"
                  onChange={() => toggleRole(role.ma)}
                />
                <span>{role.ten}</span>
              </label>
            ))}
          </fieldset>
        ) : null}
      </div>

      {hasChanges && canEditRow ? (
        <div className="flex items-start lg:justify-end">
          <button
            className="button-primary"
            disabled={props.isSaving}
            type="button"
            onClick={() => props.onSave(selectedRoleCodes)}
          >
            {props.isSaving ? "Đang lưu…" : "Lưu vai trò"}
          </button>
        </div>
      ) : null}
    </article>
  );
}

function AssignmentManager(props: {
  activeYear: SchoolYear | null;
  assignments: Assignment[];
  canManageAssignments: boolean;
  capHocList: CapHocValue[];
  criteria: Criterion[];
  supabase: ReturnType<typeof createBrowserSupabaseClient> | null;
  users: ManagedUser[];
  onChanged: () => Promise<void>;
  onMessage: (message: string) => void;
}) {
  const assignableUsers = useMemo(
    () => props.users.filter((user) => {
      const roleCodes = (user.nguoi_dung_vai_tro ?? [])
        .map((item) => Array.isArray(item.vai_tro) ? item.vai_tro[0]?.ma : item.vai_tro?.ma)
        .filter(Boolean);
      return user.trang_thai === "active" && roleCodes.some((role) => role === "MEMBER" || role === "TEACHER");
    }),
    [props.users],
  );
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedCapHoc, setSelectedCapHoc] = useState<CapHocValue>(props.capHocList[0] ?? "mam_non");
  const [selectedCriterionIds, setSelectedCriterionIds] = useState<string[]>([]);
  const [assignmentRole, setAssignmentRole] = useState("phu_trach_nhap_lieu");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const userId = selectedUserId || assignableUsers[0]?.id || "";
      const userAssignments = props.assignments.filter(
        (item) => item.nguoi_dung_id === userId && item.cap_hoc === selectedCapHoc,
      );

      setSelectedUserId(userId);
      setSelectedCriterionIds(userAssignments.map((item) => item.tieu_chi_id));
      setAssignmentRole(userAssignments[0]?.vai_tro_trong_tieu_chi ?? "phu_trach_nhap_lieu");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [assignableUsers, props.assignments, selectedCapHoc, selectedUserId]);

  function toggleCriterion(id: string) {
    setSelectedCriterionIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  async function saveAssignments() {
    if (!props.supabase || !props.activeYear || !selectedUserId) {
      props.onMessage("Chưa đủ thông tin để lưu phân công.");
      return;
    }

    setSaving(true);
    props.onMessage("");

    const { error } = await props.supabase.rpc("fn_phan_cong_tieu_chi_cho_nguoi_dung", {
      p_nam_hoc_id: props.activeYear.id,
      p_cap_hoc: selectedCapHoc,
      p_nguoi_dung_id: selectedUserId,
      p_tieu_chi_ids: selectedCriterionIds,
      p_vai_tro_trong_tieu_chi: assignmentRole,
    });

    setSaving(false);

    if (error) {
      props.onMessage(toUserMessage(error));
      return;
    }

    props.onMessage("Đã cập nhật phạm vi tiêu chí được phân công.");
    await props.onChanged();
  }

  return (
    <section className="surface-card overflow-hidden">
      <div className="border-b border-[var(--color-border)] px-5 py-4">
        <h2 className="section-title text-xl">Phân công phạm vi tiêu chí</h2>
        <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">
          Giáo viên, ủy viên và tổ trưởng chỉ thao tác trong các tiêu chí được phân công.
        </p>
      </div>

      {!props.activeYear ? (
        <p className="px-5 py-5 text-sm text-[var(--color-graphite)]/70">
          Chưa có năm học để phân công.
        </p>
      ) : (
        <div className="grid gap-4 p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_180px_240px_auto]">
            <label className="text-sm font-medium">
              Người được phân công
              <select
                className="form-control mt-2"
                disabled={!props.canManageAssignments}
                value={selectedUserId}
                onChange={(event) => setSelectedUserId(event.target.value)}
              >
                {assignableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.ho_ten} {user.email ? `- ${user.email}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Cấp học
              <select
                className="form-control mt-2"
                disabled={!props.canManageAssignments}
                value={selectedCapHoc}
                onChange={(event) => setSelectedCapHoc(event.target.value as CapHocValue)}
              >
                {props.capHocList.map((cap) => (
                  <option key={cap} value={cap}>
                    {capHocOptions.find((option) => option.value === cap)?.label ?? cap}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Vai trò trong phân công
              <select
                className="form-control mt-2"
                disabled={!props.canManageAssignments}
                value={assignmentRole}
                onChange={(event) => setAssignmentRole(event.target.value)}
              >
                <option value="phu_trach_nhap_lieu">Phụ trách nhập liệu</option>
                <option value="ra_soat">Rà soát nội dung</option>
                <option value="tong_hop">Tổng hợp tiêu chuẩn</option>
              </select>
            </label>
            <div className="flex items-end">
              <button
                className="button-primary w-full"
                disabled={!props.canManageAssignments || saving || !selectedUserId}
                type="button"
                onClick={saveAssignments}
              >
                {saving ? "Đang lưu…" : "Lưu phân công"}
              </button>
            </div>
          </div>

          {!props.canManageAssignments ? (
            <Alert tone="info">
              Bạn chỉ có thể xem phân công. Chỉ Hiệu trưởng hoặc Chủ tịch Hội đồng tự đánh giá được chỉnh phần này.
            </Alert>
          ) : null}

          <div className="grid max-h-96 gap-2 overflow-auto rounded-[var(--radius-card)] border border-[var(--color-border)] p-3 sm:grid-cols-2 lg:grid-cols-3">
            {props.criteria.map((criterion) => (
              <label className="surface-card flex items-start gap-2 p-3 text-sm" key={criterion.id}>
                <input
                  checked={selectedCriterionIds.includes(criterion.id)}
                  disabled={!props.canManageAssignments}
                  type="checkbox"
                  onChange={() => toggleCriterion(criterion.id)}
                />
                <span>
                  <strong className="text-[var(--color-ink-navy)]">{criterion.ma}</strong>{" "}
                  {criterion.ten}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </section>
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
          className="form-control mt-2"
          value={props.tenNamHoc}
          onChange={(event) => props.setTenNamHoc(event.target.value)}
          required
        />
      </label>
      <label className="text-sm font-medium">
        Ngày bắt đầu
        <input
          className="form-control mt-2"
          type="date"
          value={props.ngayBatDau}
          onChange={(event) => props.setNgayBatDau(event.target.value)}
          required
        />
      </label>
      <label className="text-sm font-medium">
        Ngày kết thúc
        <input
          className="form-control mt-2"
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
    <Alert tone={text.includes("Đã ") ? "success" : "warning"}>{text}</Alert>
  );
}
