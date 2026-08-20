import ExcelJS from "exceljs";
import JSZip from "jszip";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { extname, isAbsolute, resolve } from "node:path";

const REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_IMPORT_EMAIL",
  "SUPABASE_IMPORT_PASSWORD",
];

const args = Object.fromEntries(
  process.argv.slice(2).map((item) => {
    const [key, ...value] = item.replace(/^--/, "").split("=");
    return [key, value.join("=") || "true"];
  }),
);

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Thiếu biến môi trường ${name}.`);
  }

  return value;
}

function loadEnvFile(filePath) {
  const fullPath = resolveInputPath(filePath);

  if (!existsSync(fullPath)) {
    return;
  }

  const lines = readFileSync(fullPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...value] = trimmed.split("=");
    process.env[key] ||= value.join("=").replace(/^["']|["']$/g, "");
  }
}

function resolveInputPath(pathValue) {
  if (!pathValue) {
    return "";
  }

  return isAbsolute(pathValue) ? pathValue : resolve(process.cwd(), pathValue);
}

function bool(value) {
  return ["1", "true", "yes", "co", "có", "dat", "đạt", "x"].includes(String(value ?? "").trim().toLowerCase());
}

function clean(value) {
  return String(value ?? "").trim();
}

function parseDate(value) {
  const text = clean(value);
  return text || null;
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function extractDocxText(pathValue) {
  if (!pathValue) {
    return "";
  }

  const filePath = resolveInputPath(pathValue);

  if (!existsSync(filePath)) {
    throw new Error(`Không tìm thấy file Word: ${filePath}`);
  }

  const zip = await JSZip.loadAsync(readFileSync(filePath));
  const xml = await zip.file("word/document.xml")?.async("text");

  if (!xml) {
    return "";
  }

  return xml
    .replace(/<w:tab\/>/g, "\t")
    .replace(/<w:br\/>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function readManifest(filePath) {
  const fullPath = resolveInputPath(filePath);

  if (!existsSync(fullPath)) {
    throw new Error(`Không tìm thấy manifest: ${fullPath}`);
  }

  const workbook = new ExcelJS.Workbook();
  const extension = extname(fullPath).toLowerCase();

  if (extension === ".csv") {
    const worksheet = await workbook.csv.readFile(fullPath);
    return worksheetToRows(worksheet);
  }

  await workbook.xlsx.readFile(fullPath);
  return worksheetToRows(workbook.worksheets[0]);
}

function worksheetToRows(worksheet) {
  const headers = [];
  const rows = [];

  worksheet.getRow(1).eachCell((cell, index) => {
    headers[index] = clean(cell.value).toLowerCase();
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const item = {};
    let hasValue = false;

    row.eachCell({ includeEmpty: true }, (cell, index) => {
      const key = headers[index];
      if (!key) {
        return;
      }

      const value = cell.value?.text ?? cell.value?.result ?? cell.value ?? "";
      item[key] = clean(value);
      hasValue ||= clean(value).length > 0;
    });

    if (hasValue) {
      rows.push(item);
    }
  });

  return rows;
}

async function main() {
  const manifest = args.manifest;
  const dryRun = args["dry-run"] === "true";

  if (!manifest) {
    throw new Error("Cần truyền --manifest=duong_dan_file.xlsx hoặc --manifest=duong_dan_file.csv.");
  }

  const rows = await readManifest(manifest);

  if (dryRun) {
    const stats = rows.reduce(
      (result, row) => {
        const type = clean(row.loai_dong || row.type || "evidence").toLowerCase();
        result[type] = (result[type] ?? 0) + 1;
        return result;
      },
      { evidence: 0, assessment: 0, standard_note: 0, plan: 0 },
    );
    console.log("Dry-run manifest:", stats);
    return;
  }

  loadEnvFile(".env.local");

  for (const name of REQUIRED_ENV) {
    requireEnv(name);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: process.env.SUPABASE_IMPORT_EMAIL,
    password: process.env.SUPABASE_IMPORT_PASSWORD,
  });

  if (signInError || !signInData.user) {
    throw new Error(signInError?.message ?? "Không đăng nhập được tài khoản import.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("nguoi_dung")
    .select("id, co_so_id, ho_ten")
    .eq("auth_user_id", signInData.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error(profileError?.message ?? "Tài khoản import chưa thuộc cơ sở giáo dục nào.");
  }

  const { data: activeYear, error: yearError } = await supabase
    .from("nam_hoc")
    .select("id, ten")
    .eq("co_so_id", profile.co_so_id)
    .eq("trang_thai", "dang_hoat_dong")
    .maybeSingle();

  if (yearError || !activeYear) {
    throw new Error(yearError?.message ?? "Chưa có năm học đang hoạt động.");
  }

  const { data: school, error: schoolError } = await supabase
    .from("co_so_giao_duc")
    .select("loai_hinh")
    .eq("id", profile.co_so_id)
    .maybeSingle();

  if (schoolError || !school) {
    throw new Error(schoolError?.message ?? "Không tìm thấy loại hình của cơ sở giáo dục.");
  }

  const [{ data: criteria }, { data: standards }] = await Promise.all([
    supabase
      .from("tieu_chi")
      .select("id, ma, tieu_chuan_id")
      .eq("loai_hinh_ap_dung", school.loai_hinh)
      .order("ma"),
    supabase.from("tieu_chuan").select("id, so_thu_tu").order("so_thu_tu"),
  ]);
  const criterionByCode = new Map((criteria ?? []).map((item) => [item.ma, item]));
  const standardByNumber = new Map((standards ?? []).map((item) => [String(item.so_thu_tu), item]));
  const stats = {
    evidence: 0,
    assessment: 0,
    standard_note: 0,
    plan: 0,
    skipped: 0,
  };

  console.log(`Import vào cơ sở ${profile.co_so_id}, năm học ${activeYear.ten}${dryRun ? " (dry-run)" : ""}.`);

  for (const [index, row] of rows.entries()) {
    const type = clean(row.loai_dong || row.type || "evidence").toLowerCase();

    if (dryRun) {
      stats[type] = (stats[type] ?? 0) + 1;
      continue;
    }

    if (type === "evidence") {
      await importEvidence({ supabase, profile, year: activeYear, criterionByCode, row });
      stats.evidence += 1;
    } else if (type === "assessment") {
      await importAssessment({ supabase, profile, year: activeYear, criterionByCode, row });
      stats.assessment += 1;
    } else if (type === "standard_note") {
      await importStandardNote({ supabase, profile, year: activeYear, standardByNumber, row });
      stats.standard_note += 1;
    } else if (type === "plan") {
      await importPlan({ supabase, profile, year: activeYear, criterionByCode, standardByNumber, row });
      stats.plan += 1;
    } else {
      stats.skipped += 1;
      console.warn(`Bỏ qua dòng ${index + 2}: loai_dong không hỗ trợ (${type}).`);
    }
  }

  console.log("Kết quả import:", stats);
}

async function importEvidence({ supabase, profile, year, criterionByCode, row }) {
  const criterionCodes = clean(row.ma_tieu_chi)
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const criteria = criterionCodes.map((code) => criterionByCode.get(code));

  if (criteria.some((item) => !item)) {
    throw new Error(`Không tìm thấy tiêu chí ở dòng minh chứng: ${row.ma_tieu_chi}`);
  }

  const filePath = resolveInputPath(row.file_path);
  let storagePath = "";
  let hash = "";
  let size = null;
  let type = row.loai_tep || null;

  if (filePath) {
    if (!existsSync(filePath)) {
      throw new Error(`Không tìm thấy tệp minh chứng: ${filePath}`);
    }

    const buffer = readFileSync(filePath);
    hash = sha256(buffer);
    size = buffer.length;
    type ||= "application/octet-stream";
    storagePath = `${profile.co_so_id}/${year.id}/import/${Date.now()}-${filePath.split(/[\\/]/).pop()}`;

    const { error: uploadError } = await supabase.storage.from("evidence").upload(storagePath, buffer, {
      contentType: type,
      upsert: false,
    });

    if (uploadError) {
      throw new Error(uploadError.message);
    }
  }

  const rootCriterionId = criteria[0].id;
  const { error } = await supabase.rpc("fn_tao_minh_chung", {
    p_nam_hoc_id: year.id,
    p_tieu_chi_ids: criteria.map((item) => item.id),
    p_tieu_chi_goc_id: rootCriterionId,
    p_ten: row.ten_minh_chung || row.ten || `Minh chứng ${row.ma_tieu_chi}`,
    p_loai_tep: type,
    p_duong_dan: row.duong_dan || "",
    p_storage_path: storagePath,
    p_hash_tep: hash,
    p_kich_thuoc: size,
    p_ngay_ban_hanh: parseDate(row.ngay_ban_hanh),
    p_ngay_het_gia_tri: parseDate(row.ngay_het_gia_tri),
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function importAssessment({ supabase, profile, year, criterionByCode, row }) {
  const criterion = criterionByCode.get(clean(row.ma_tieu_chi));

  if (!criterion) {
    throw new Error(`Không tìm thấy tiêu chí tự đánh giá: ${row.ma_tieu_chi}`);
  }

  const wordText = await extractDocxText(row.word_path);
  const moTaMuc1 = row.mo_ta_muc_1 || wordText;
  const moTaMuc2 = row.mo_ta_muc_2 || "";
  const datMuc1 = bool(row.dat_muc_1);
  const datMuc2 = bool(row.dat_muc_2);

  const { error } = await supabase.from("tu_danh_gia").upsert(
    {
      co_so_id: profile.co_so_id,
      nam_hoc_id: year.id,
      tieu_chi_id: criterion.id,
      cap_hoc: row.cap_hoc || "mam_non",
      mo_ta_muc_1: moTaMuc1,
      dat_muc_1: datMuc1,
      mo_ta_muc_2: moTaMuc2,
      dat_muc_2: datMuc2,
      muc_dat: datMuc2 ? 2 : datMuc1 ? 1 : 0,
      nguoi_nhap: profile.id,
    },
    { onConflict: "co_so_id,nam_hoc_id,tieu_chi_id,cap_hoc" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function importStandardNote({ supabase, profile, year, standardByNumber, row }) {
  const standard = standardByNumber.get(clean(row.tieu_chuan_so));

  if (!standard) {
    throw new Error(`Không tìm thấy tiêu chuẩn: ${row.tieu_chuan_so}`);
  }

  const { error } = await supabase.from("nhan_xet_tieu_chuan").upsert(
    {
      co_so_id: profile.co_so_id,
      nam_hoc_id: year.id,
      tieu_chuan_id: standard.id,
      cap_hoc: row.cap_hoc || "mam_non",
      diem_manh_noi_bat: row.diem_manh_noi_bat || "",
      han_che_trong_tam: row.han_che_trong_tam || "",
      dinh_huong_cai_tien: row.dinh_huong_cai_tien || "",
      nguoi_cap_nhat: profile.id,
    },
    { onConflict: "co_so_id,nam_hoc_id,tieu_chuan_id,cap_hoc" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function importPlan({ supabase, profile, year, criterionByCode, standardByNumber, row }) {
  const criterion = criterionByCode.get(clean(row.ma_tieu_chi));
  const standard = standardByNumber.get(clean(row.tieu_chuan_so)) ?? (criterion ? { id: criterion.tieu_chuan_id } : null);

  const { error } = await supabase.from("ke_hoach_cai_tien").insert({
    co_so_id: profile.co_so_id,
    nam_hoc_id: year.id,
    tieu_chuan_id: standard?.id ?? null,
    tieu_chi_id: criterion?.id ?? null,
    noi_dung: row.noi_dung || "",
    muc_tieu: row.muc_tieu || "",
    hoat_dong: row.hoat_dong || "",
    chi_so_ket_qua: row.chi_so_ket_qua || "",
    thoi_gian_bat_dau: parseDate(row.thoi_gian_bat_dau),
    thoi_gian_ket_thuc: parseDate(row.thoi_gian_ket_thuc),
    phu_trach_id: profile.id,
    nguon_luc: row.nguon_luc || "",
    minh_chung_du_kien: row.minh_chung_du_kien || "",
    muc_do_thuc_hien: row.muc_do_thuc_hien || "chua_thuc_hien",
    ghi_chu: row.ghi_chu || "",
  });

  if (error) {
    throw new Error(error.message);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
