import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).map((item) => {
    const [key, ...parts] = item.replace(/^--/, "").split("=");
    return [key, parts.join("=") || "true"];
  }),
);

function loadEnv(pathValue = ".env.local") {
  const path = resolve(process.cwd(), pathValue);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const value = line.trim();
    if (!value || value.startsWith("#") || !value.includes("=")) continue;
    const [key, ...parts] = value.split("=");
    process.env[key] ||= parts.join("=").replace(/^["']|["']$/g, "");
  }
}

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Thiếu biến môi trường ${name}.`);
  return value;
}

loadEnv(args.env);
const supabase = createClient(
  required("NEXT_PUBLIC_SUPABASE_URL"),
  required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const email = required("PILOT_AUDIT_EMAIL");
const password = required("PILOT_AUDIT_PASSWORD");
const capHoc = args["cap-hoc"];
if (!["mam_non", "tieu_hoc", "thcs", "thpt", "gdtx", "khac"].includes(capHoc)) {
  throw new Error("Cần truyền --cap-hoc=mam_non|tieu_hoc|thcs|thpt|gdtx|khac.");
}

const { data: auth, error: authError } = await supabase.auth.signInWithPassword({ email, password });
if (authError || !auth.user) {
  throw new Error("Không đăng nhập được tài khoản kiểm tra thí điểm.");
}

let yearId = args.year;
if (!yearId || yearId === "active") {
  const { data: profile, error: profileError } = await supabase
    .from("nguoi_dung")
    .select("co_so_id")
    .eq("auth_user_id", auth.user.id)
    .single();
  if (profileError || !profile) throw new Error("Tài khoản chưa thuộc đơn vị.");

  const { data: year, error: yearError } = await supabase
    .from("nam_hoc")
    .select("id")
    .eq("co_so_id", profile.co_so_id)
    .eq("trang_thai", "dang_hoat_dong")
    .single();
  if (yearError || !year) throw new Error("Không tìm thấy năm học đang hoạt động.");
  yearId = year.id;
}

const { data, error } = await supabase.rpc("fn_kiem_tra_du_lieu_thi_diem", {
  p_nam_hoc_id: yearId,
  p_cap_hoc: capHoc,
});
if (error) throw new Error("Không kiểm tra được dữ liệu thí điểm qua RLS.");

console.log(JSON.stringify({ nam_hoc_id: yearId, cap_hoc: capHoc, ...data }, null, 2));
if (!data?.ready) process.exitCode = 2;
