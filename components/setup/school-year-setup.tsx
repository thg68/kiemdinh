"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { Alert } from "@/components/ui/alert";
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
};

const assignableRoleCodes = [
  "SELF_ASSESSMENT_CHAIR",
  "SECRETARY",
  "MEMBER",
  "TEACHER",
  "VIEWER",
];

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
  const [roles, setRoles] = useState<Role[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [canManageUsers, setCanManageUsers] = useState(false);
  const [canManageAssignments, setCanManageAssignments] = useState(false);
  const [setupPanel, setSetupPanel] = useState<"assignments" | "school" | "users">("school");

  const [tenCoSo, setTenCoSo] = useState("");
  const [maTruong, setMaTruong] = useState("");
  const [loaiHinh, setLoaiHinh] = useState("mam_non");
  const [capHoc, setCapHoc] = useState<string[]>(["mam_non"]);
  const [hoTen, setHoTen] = useState("");
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

    const [
      { data: schoolData },
      { data: yearData },
      { data: userData },
      { data: roleData },
      { data: canManage },
      { data: canManageAssignment },
    ] = await Promise.all([
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
      supabase
        .from("nguoi_dung")
        .select("id, ho_ten, email, trang_thai, nguoi_dung_vai_tro(vai_tro:vai_tro_id(id, ma, ten))")
        .eq("co_so_id", profileData.co_so_id)
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
    ]);

    setSchool(schoolData ?? null);
    setYears(yearData ?? []);
    setUsers((userData ?? []) as unknown as ManagedUser[]);
    setRoles((roleData ?? []) as Role[]);
    setCanManageUsers(Boolean(canManage));
    setCanManageAssignments(Boolean(canManageAssignment));

    const loadedYears = (yearData ?? []) as SchoolYear[];
    const loadedActiveYear = loadedYears.find((year) => year.trang_thai === "dang_hoat_dong") ?? loadedYears[0];

    if (loadedActiveYear) {
      const [{ data: assignmentData }, { data: criterionData }] = await Promise.all([
        supabase
          .from("phan_cong_tieu_chi")
          .select("id, nam_hoc_id, nguoi_dung_id, tieu_chi_id, vai_tro_trong_tieu_chi")
          .eq("co_so_id", profileData.co_so_id)
          .eq("nam_hoc_id", loadedActiveYear.id),
        supabase
          .from("v_tieu_chi_nam_hoc")
          .select("id, ma, ten, loai_hinh_ap_dung")
          .eq("co_so_id", profileData.co_so_id)
          .eq("nam_hoc_id", loadedActiveYear.id)
          .order("ma", { ascending: true }),
      ]);

      setAssignments((assignmentData ?? []) as Assignment[]);
      setCriteria((criterionData ?? []) as Criterion[]);
    } else {
      setAssignments([]);
      setCriteria([]);
    }

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

  function userRoles(user: ManagedUser) {
    return (user.nguoi_dung_vai_tro ?? [])
      .map((item) => (Array.isArray(item.vai_tro) ? item.vai_tro[0] : item.vai_tro))
      .filter(Boolean) as Role[];
  }

  if (loading) {
    return <LoadingState label="Đang tải dữ liệu thiết lập..." />;
  }

  if (!profile) {
    return (
      <form
        className="surface-card grid gap-5 p-6"
        onSubmit={handleCreateSchool}
      >
        <h2 className="section-title text-xl">
          Thiết lập cơ sở giáo dục
        </h2>

        <label className="text-sm font-medium">
          Tên cơ sở giáo dục
          <input
            className="form-control mt-2"
            value={tenCoSo}
            onChange={(event) => setTenCoSo(event.target.value)}
            required
          />
        </label>

        <label className="text-sm font-medium">
          Mã trường
          <input
            className="form-control mt-2"
            value={maTruong}
            onChange={(event) => setMaTruong(event.target.value)}
          />
        </label>

        <label className="text-sm font-medium">
          Loại hình
          <select
            className="form-control mt-2"
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
                className="surface-card flex items-center gap-2 px-3 py-3"
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
            className="form-control mt-2"
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

        <button className="button-primary">
          Tạo đơn vị và năm học
        </button>

        {message ? <Message text={message} /> : null}
      </form>
    );
  }

  return (
    <div className="grid gap-6">
      <SetupTabs activePanel={setupPanel} onChange={setSetupPanel} />
      {message ? <Message text={message} /> : null}
      <section className={`featured-card ${setupPanel === "school" ? "" : "hidden"}`}>
        <p className="text-sm text-white/70">Cơ sở giáo dục</p>
        <h2 className="mt-1 text-2xl font-semibold text-white">
          {school?.ten ?? "Chưa tải được tên đơn vị"}
        </h2>
        <p className="mt-2 text-sm text-white/70">
          Người dùng: {profile.ho_ten}
        </p>
      </section>

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
        roles={roles}
        supabase={supabase}
        users={users}
        userRoles={userRoles}
        onChanged={loadData}
        onMessage={setMessage}
      />
      ) : null}

      {setupPanel === "assignments" ? (
      <AssignmentManager
        activeYear={activeYear ?? null}
        assignments={assignments}
        canManageAssignments={canManageAssignments}
        criteria={criteria}
        supabase={supabase}
        users={users}
        onChanged={loadData}
        onMessage={setMessage}
      />
      ) : null}

    </div>
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
  roles: Role[];
  supabase: ReturnType<typeof createBrowserSupabaseClient> | null;
  users: ManagedUser[];
  userRoles: (user: ManagedUser) => Role[];
  onChanged: () => Promise<void>;
  onMessage: (message: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [hoTen, setHoTen] = useState("");
  const [roleCode, setRoleCode] = useState("TEACHER");
  const [saving, setSaving] = useState("");

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
      props.onMessage(error.message);
      return;
    }

    setEmail("");
    setHoTen("");
    setRoleCode("TEACHER");
    props.onMessage("Đã thêm người dùng vào đơn vị và gán vai trò.");
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
      props.onMessage(error.message);
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
          Người dùng cần tạo tài khoản ở trang đăng nhập trước. Sau đó Hiệu trưởng nhập email ở đây để đưa vào đơn vị và gán vai trò.
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
              {saving === "invite" ? "Đang thêm..." : "Thêm người"}
            </button>
          </div>
        </form>
      ) : (
        <p className="border-b border-[var(--color-border)] px-5 py-4 text-sm text-[var(--color-graphite)]/70">
          Bạn đang xem danh sách vai trò. Chỉ Hiệu trưởng mới được thêm người hoặc cập nhật phân quyền.
        </p>
      )}

      <div className="divide-y divide-[var(--color-border)]">
        {props.users.length === 0 ? (
          <p className="px-5 py-6 text-sm text-[var(--color-graphite)]/70">
            Chưa có người dùng trong đơn vị.
          </p>
        ) : (
          props.users.map((user) => (
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
    props.userRoles.map((role) => role.ma),
  );

  function toggleRole(roleCode: string) {
    setSelectedRoleCodes((current) =>
      current.includes(roleCode)
        ? current.filter((item) => item !== roleCode)
        : [...current, roleCode],
    );
  }

  const isCurrentUser = props.user.id === props.currentUserId;
  const canEditRow = props.canManageUsers && !isCurrentUser;

  return (
    <article className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(220px,1fr)_2fr_auto]">
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

      <div className="grid gap-2 sm:grid-cols-2">
        {props.roles.map((role) => (
          <label
            className={`surface-card flex items-start gap-2 p-3 text-sm ${!canEditRow ? "opacity-70" : ""}`}
            key={role.ma}
          >
            <input
              checked={selectedRoleCodes.includes(role.ma)}
              disabled={!canEditRow}
              type="checkbox"
              onChange={() => toggleRole(role.ma)}
            />
            <span>
              <span className="block font-semibold text-[var(--color-ink-navy)]">{role.ten}</span>
              <span className="text-xs text-[var(--color-graphite)]/60">{role.ma}</span>
            </span>
          </label>
        ))}
      </div>

      <div className="flex items-start lg:justify-end">
        <button
          className="button-secondary disabled:text-[var(--color-stone)]"
          disabled={!canEditRow || props.isSaving}
          type="button"
          onClick={() => props.onSave(selectedRoleCodes)}
        >
          {props.isSaving ? "Đang lưu..." : "Lưu vai trò"}
        </button>
      </div>
    </article>
  );
}

function AssignmentManager(props: {
  activeYear: SchoolYear | null;
  assignments: Assignment[];
  canManageAssignments: boolean;
  criteria: Criterion[];
  supabase: ReturnType<typeof createBrowserSupabaseClient> | null;
  users: ManagedUser[];
  onChanged: () => Promise<void>;
  onMessage: (message: string) => void;
}) {
  const assignableUsers = useMemo(
    () => props.users.filter((user) => user.trang_thai === "active"),
    [props.users],
  );
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedCriterionIds, setSelectedCriterionIds] = useState<string[]>([]);
  const [assignmentRole, setAssignmentRole] = useState("phu_trach_nhap_lieu");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const userId = selectedUserId || assignableUsers[0]?.id || "";
      const userAssignments = props.assignments.filter((item) => item.nguoi_dung_id === userId);

      setSelectedUserId(userId);
      setSelectedCriterionIds(userAssignments.map((item) => item.tieu_chi_id));
      setAssignmentRole(userAssignments[0]?.vai_tro_trong_tieu_chi ?? "phu_trach_nhap_lieu");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [assignableUsers, props.assignments, selectedUserId]);

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
      p_nguoi_dung_id: selectedUserId,
      p_tieu_chi_ids: selectedCriterionIds,
      p_vai_tro_trong_tieu_chi: assignmentRole,
    });

    setSaving(false);

    if (error) {
      props.onMessage(error.message);
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
          <div className="grid gap-4 lg:grid-cols-[1fr_260px_auto]">
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
                {saving ? "Đang lưu..." : "Lưu phân công"}
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
