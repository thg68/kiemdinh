import { appendFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const roles = [
  ["SYSTEM_ADMIN", "Quản trị hệ thống"],
  ["PRINCIPAL", "Hiệu trưởng"],
  ["SELF_ASSESSMENT_CHAIR", "Chủ tịch Hội đồng TĐG"],
  ["SECRETARY", "Thư ký Hội đồng"],
  ["MEMBER", "Ủy viên / Tổ trưởng"],
  ["TEACHER", "Giáo viên"],
  ["VIEWER", "Khách chỉ đọc"],
];

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Thiếu biến môi trường ${name}.`);
  return value;
}

function assertStagingOnly(url) {
  if (process.env.E2E_ALLOW_STAGING_PROVISION !== "true") {
    throw new Error("Chỉ được provision khi E2E_ALLOW_STAGING_PROVISION=true.");
  }

  const productionUrl = process.env.PRODUCTION_SUPABASE_URL?.trim();
  if (productionUrl && new URL(url).origin === new URL(productionUrl).origin) {
    throw new Error("Từ chối provision tài khoản E2E vào Supabase production.");
  }
}

async function findAuthUserByEmail(admin, email) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const found = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < 100) return null;
  }
  throw new Error("Không thể tìm tài khoản Auth sau 2.000 bản ghi.");
}

async function ensureAuthUser(admin, roleCode) {
  const email = required(`E2E_${roleCode}_EMAIL`).toLowerCase();
  const password = required(`E2E_${roleCode}_PASSWORD`);
  const existing = await findAuthUserByEmail(admin, email);

  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { e2e_fixture: true, role_code: roleCode },
    });
    if (error) throw error;
    return { user: data.user, email };
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { e2e_fixture: true, role_code: roleCode },
  });
  if (error) throw error;
  return { user: data.user, email };
}

const supabaseUrl = required("STAGING_SUPABASE_URL");
assertStagingOnly(supabaseUrl);
const admin = createClient(supabaseUrl, required("STAGING_SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: standardSet, error: standardError } = await admin
  .from("bo_tieu_chuan")
  .select("id")
  .eq("loai_hinh", "mam_non")
  .eq("trang_thai", "dang_ap_dung")
  .order("version", { ascending: false })
  .limit(1)
  .single();
if (standardError) throw standardError;

const { data: school, error: schoolError } = await admin
  .from("co_so_giao_duc")
  .upsert({
    ma_truong: "UAT-STAGING-01",
    ten: "Đơn vị kiểm thử UAT staging",
    loai_hinh: "mam_non",
    cap_hoc: ["mam_non"],
    cong_lap: true,
  }, { onConflict: "ma_truong" })
  .select("id")
  .single();
if (schoolError) throw schoolError;

const { error: archiveFixtureYearError } = await admin
  .from("nam_hoc")
  .update({ trang_thai: "luu_tru" })
  .eq("co_so_id", school.id)
  .eq("trang_thai", "dang_hoat_dong")
  .neq("ten", "2098-2099");
if (archiveFixtureYearError) throw archiveFixtureYearError;

const { data: schoolYear, error: yearError } = await admin
  .from("nam_hoc")
  .upsert({
    co_so_id: school.id,
    ten: "2098-2099",
    ngay_bat_dau: "2098-08-01",
    ngay_ket_thuc: "2099-07-31",
    trang_thai: "dang_hoat_dong",
    bo_tieu_chuan_id: standardSet.id,
  }, { onConflict: "co_so_id,ten" })
  .select("id")
  .single();
if (yearError) throw yearError;

const { data: roleRows, error: roleError } = await admin
  .from("vai_tro")
  .select("id, ma")
  .in("ma", roles.map(([code]) => code));
if (roleError) throw roleError;
const roleIdByCode = new Map(roleRows.map((role) => [role.ma, role.id]));

const profiles = [];
for (const [roleCode, roleLabel] of roles) {
  const { user, email } = await ensureAuthUser(admin, roleCode);
  const roleId = roleIdByCode.get(roleCode);
  if (!roleId) throw new Error(`Không tìm thấy vai trò ${roleCode} trong DB staging.`);

  const { data: profile, error: profileError } = await admin
    .from("nguoi_dung")
    .upsert({
      auth_user_id: user.id,
      co_so_id: school.id,
      ho_ten: `UAT ${roleLabel}`,
      email,
      trang_thai: "active",
    }, { onConflict: "auth_user_id" })
    .select("id")
    .single();
  if (profileError) throw profileError;

  profiles.push({ id: profile.id, roleCode, roleId });
}

const profileIds = profiles.map((profile) => profile.id);
const { error: clearRoleError } = await admin
  .from("nguoi_dung_vai_tro")
  .delete()
  .in("nguoi_dung_id", profileIds)
  .eq("co_so_id", school.id);
if (clearRoleError) throw clearRoleError;

const { error: roleLinkError } = await admin.from("nguoi_dung_vai_tro").insert(
  profiles.map((profile) => ({
    nguoi_dung_id: profile.id,
    vai_tro_id: profile.roleId,
    co_so_id: school.id,
  })),
);
if (roleLinkError) throw roleLinkError;

const { data: criteria, error: criterionError } = await admin
  .from("v_tieu_chi_nam_hoc")
  .select("id, ma")
  .eq("co_so_id", school.id)
  .eq("nam_hoc_id", schoolYear.id)
  .in("ma", ["1.1", "1.2"]);
if (criterionError) throw criterionError;

const assignments = [
  ["TEACHER", "1.1"],
  ["MEMBER", "1.2"],
].map(([roleCode, criterionCode]) => ({
  co_so_id: school.id,
  nam_hoc_id: schoolYear.id,
  cap_hoc: "mam_non",
  nguoi_dung_id: profiles.find((profile) => profile.roleCode === roleCode)?.id,
  tieu_chi_id: criteria.find((criterion) => criterion.ma === criterionCode)?.id,
  vai_tro_trong_tieu_chi: "phu_trach_nhap_lieu",
  vai_tro_phan_cong: "phu_trach_nhap_lieu",
}));

if (assignments.some((row) => !row.nguoi_dung_id || !row.tieu_chi_id)) {
  throw new Error("Không tạo được phạm vi phân công cho MEMBER/TEACHER.");
}

const { error: assignmentError } = await admin
  .from("phan_cong_tieu_chi")
  .upsert(assignments, {
    onConflict: "nam_hoc_id,nguoi_dung_id,tieu_chi_id,cap_hoc",
  });
if (assignmentError) throw assignmentError;

if (process.env.GITHUB_OUTPUT) {
  await appendFile(process.env.GITHUB_OUTPUT, `year_id=${schoolYear.id}\ncap_hoc=mam_non\n`, "utf8");
}

console.log(`Đã provision 7 vai trò trong tenant UAT staging; năm học ${schoolYear.id}.`);
