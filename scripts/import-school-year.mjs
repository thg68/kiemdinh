import ExcelJS from "exceljs";
import JSZip from "jszip";
import { createClient } from "@supabase/supabase-js";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { basename, extname, isAbsolute, resolve } from "node:path";

const REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_IMPORT_EMAIL",
  "SUPABASE_IMPORT_PASSWORD",
];
const SUPPORTED_TYPES = new Set(["evidence", "assessment", "standard_note", "plan"]);
const EVIDENCE_MIME_BY_EXTENSION = new Map([
  [".csv", "text/csv"],
  [".doc", "application/msword"],
  [".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".pdf", "application/pdf"],
  [".png", "image/png"],
  [".txt", "text/plain"],
  [".webp", "image/webp"],
  [".xls", "application/vnd.ms-excel"],
  [".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
]);
const MAX_EVIDENCE_FILE_SIZE_BYTES = 25 * 1024 * 1024;

const args = Object.fromEntries(
  process.argv.slice(2).map((item) => {
    const [key, ...value] = item.replace(/^--/, "").split("=");
    return [key, value.join("=") || "true"];
  }),
);

function resolveInputPath(value) {
  if (!value) return "";
  return isAbsolute(value) ? value : resolve(process.cwd(), value);
}

function loadEnvFile(filePath) {
  const fullPath = resolveInputPath(filePath);
  if (!existsSync(fullPath)) return;

  for (const line of readFileSync(fullPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...value] = trimmed.split("=");
    process.env[key] ||= value.join("=").replace(/^["']|["']$/g, "");
  }
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Thiếu biến môi trường ${name}.`);
  return value;
}

function clean(value) {
  return String(value ?? "").trim();
}

function truthy(value) {
  return ["1", "true", "yes", "co", "có", "dat", "đạt", "x"].includes(clean(value).toLowerCase());
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function safeName(value) {
  return basename(value).replace(/[^a-zA-Z0-9._-]/g, "-");
}

function inspectImportEvidenceFile(filePath, buffer) {
  const originalName = basename(filePath);
  const extension = extname(originalName).toLowerCase();
  const mimeType = EVIDENCE_MIME_BY_EXTENSION.get(extension);

  if (
    !originalName ||
    originalName.length > 180 ||
    /[\u0000-\u001f\u007f]/.test(originalName)
  ) {
    throw new Error("Tên tệp minh chứng không hợp lệ hoặc dài quá 180 ký tự.");
  }

  if (!mimeType) {
    throw new Error(`Định dạng tệp minh chứng ${extension || "(trống)"} chưa được hỗ trợ.`);
  }

  if (buffer.length <= 0 || buffer.length > MAX_EVIDENCE_FILE_SIZE_BYTES) {
    throw new Error("Tệp minh chứng phải có dung lượng từ 1 byte đến 25 MB.");
  }

  return { extension, mimeType, originalName };
}

async function extractDocxText(pathValue) {
  if (!pathValue) return "";
  const filePath = resolveInputPath(pathValue);
  if (!existsSync(filePath)) throw new Error(`Không tìm thấy file Word: ${filePath}`);
  const zip = await JSZip.loadAsync(readFileSync(filePath));
  const xml = await zip.file("word/document.xml")?.async("text");
  if (!xml) return "";
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

function worksheetToRows(worksheet) {
  const headers = [];
  const rows = [];
  worksheet.getRow(1).eachCell((cell, index) => {
    headers[index] = clean(cell.value).toLowerCase();
  });
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const item = {};
    let hasValue = false;
    row.eachCell({ includeEmpty: true }, (cell, index) => {
      const key = headers[index];
      if (!key) return;
      const value = cell.value?.text ?? cell.value?.result ?? cell.value ?? "";
      item[key] = clean(value);
      hasValue ||= item[key].length > 0;
    });
    if (hasValue) rows.push({ rowNumber, value: item });
  });
  return rows;
}

async function readManifest(filePath) {
  const fullPath = resolveInputPath(filePath);
  if (!existsSync(fullPath)) throw new Error(`Không tìm thấy manifest: ${fullPath}`);
  const workbook = new ExcelJS.Workbook();
  if (extname(fullPath).toLowerCase() === ".csv") {
    return worksheetToRows(await workbook.csv.readFile(fullPath));
  }
  await workbook.xlsx.readFile(fullPath);
  return worksheetToRows(workbook.worksheets[0]);
}

async function normalizeRow(item, criterionCodes, standardNumbers) {
  const row = item.value;
  const type = clean(row.loai_dong || row.type || "evidence").toLowerCase();
  const errors = [];
  if (!SUPPORTED_TYPES.has(type)) errors.push(`Loại dòng không hỗ trợ: ${type || "trống"}.`);

  const criterionList = clean(row.ma_tieu_chi)
    .split(/[;,]/)
    .map((value) => value.trim())
    .filter(Boolean);
  if (["evidence", "assessment", "plan"].includes(type) && criterionList.length === 0) {
    errors.push("Thiếu mã tiêu chí.");
  }
  if (["assessment", "plan"].includes(type) && criterionList.length > 1) {
    errors.push("Dòng tự đánh giá hoặc kế hoạch chỉ được tham chiếu một tiêu chí.");
  }
  for (const code of criterionList) {
    if (!criterionCodes.has(code)) errors.push(`Không tìm thấy tiêu chí ${code} trong năm học.`);
  }
  if (type === "standard_note" && !standardNumbers.has(clean(row.tieu_chuan_so))) {
    errors.push(`Không tìm thấy tiêu chuẩn ${clean(row.tieu_chuan_so) || "trống"}.`);
  }

  const data = { ...row, ma_tieu_chi: criterionList.join(",") };
  if (type === "assessment") {
    try {
      data.mo_ta_muc_1 = clean(row.mo_ta_muc_1) || (await extractDocxText(row.word_path));
    } catch (error) {
      errors.push(error.message);
    }
    data.mo_ta_muc_2 = clean(row.mo_ta_muc_2);
    data.muc_dat = truthy(row.dat_muc_2) ? "2" : truthy(row.dat_muc_1) ? "1" : "0";
    if (data.muc_dat === "2" && !data.mo_ta_muc_1) errors.push("Đạt Mức 2 nhưng mô tả Mức 1 đang trống.");
  }
  if (type === "evidence") {
    if (!clean(row.ten_minh_chung || row.ten)) errors.push("Thiếu tên minh chứng.");
    const filePath = resolveInputPath(row.file_path);
    if (!filePath && !clean(row.duong_dan)) errors.push("Minh chứng phải có tệp hoặc liên kết điện tử.");
    if (filePath && !existsSync(filePath)) errors.push(`Không tìm thấy tệp: ${filePath}`);
    data.file_path = filePath;
  }
  return { rowNumber: item.rowNumber, type: SUPPORTED_TYPES.has(type) ? type : "unknown", data, errors };
}

async function main() {
  const manifestPath = resolveInputPath(args.manifest);
  if (!manifestPath) {
    throw new Error("Cần truyền --manifest=duong_dan_file.xlsx hoặc --manifest=duong_dan_file.csv.");
  }
  const sourceBuffer = readFileSync(manifestPath);
  const sourceHash = sha256(sourceBuffer);
  const rows = await readManifest(manifestPath);

  if (args["dry-run"] === "true") {
    console.log({ file: manifestPath, hash: sourceHash, rows: rows.length });
    return;
  }

  loadEnvFile(args.env || ".env.local");
  REQUIRED_ENV.forEach(requireEnv);
  const supabase = createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"));
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email: requireEnv("SUPABASE_IMPORT_EMAIL"),
    password: requireEnv("SUPABASE_IMPORT_PASSWORD"),
  });
  if (authError || !auth.user) throw new Error(authError?.message ?? "Không đăng nhập được tài khoản import.");

  const { data: profile, error: profileError } = await supabase
    .from("nguoi_dung")
    .select("id, co_so_id")
    .eq("auth_user_id", auth.user.id)
    .single();
  if (profileError || !profile) throw new Error(profileError?.message ?? "Tài khoản import chưa thuộc đơn vị.");

  const { data: year, error: yearError } = await supabase
    .from("nam_hoc")
    .select("id, ten")
    .eq("co_so_id", profile.co_so_id)
    .eq("trang_thai", "dang_hoat_dong")
    .single();
  if (yearError || !year) throw new Error(yearError?.message ?? "Chưa có năm học đang hoạt động.");

  const { data: criteria, error: criteriaError } = await supabase
    .from("v_tieu_chi_nam_hoc")
    .select("ma, tieu_chuan_so_thu_tu")
    .eq("co_so_id", profile.co_so_id)
    .eq("nam_hoc_id", year.id);
  if (criteriaError) throw new Error(criteriaError.message);
  const criterionCodes = new Set((criteria ?? []).map((item) => item.ma));
  const standardNumbers = new Set((criteria ?? []).map((item) => String(item.tieu_chuan_so_thu_tu)));
  const normalized = [];
  for (const item of rows) normalized.push(await normalizeRow(item, criterionCodes, standardNumbers));

  const sourceStoragePath = `${profile.co_so_id}/${year.id}/sources/${sourceHash}-${safeName(manifestPath)}`;
  const { data: batchId, error: batchError } = await supabase.rpc("fn_tao_dot_import", {
    p_nam_hoc_id: year.id,
    p_ten_tep_goc: basename(manifestPath),
    p_hash_tep: sourceHash,
    p_storage_path: sourceStoragePath,
  });
  if (batchError) throw new Error(batchError.message);

  const { data: existingBatch, error: existingError } = await supabase
    .from("dot_import")
    .select("trang_thai, tong_so_dong")
    .eq("id", batchId)
    .single();
  if (existingError) throw new Error(existingError.message);
  if (existingBatch.trang_thai === "committed") {
    console.log(`Tệp này đã được nhập trước đó (${existingBatch.tong_so_dong} dòng). Không tạo dữ liệu trùng.`);
    return;
  }

  const { error: sourceUploadError } = await supabase.storage
    .from("imports")
    .upload(sourceStoragePath, sourceBuffer, { contentType: "application/octet-stream", upsert: true });
  if (sourceUploadError) throw new Error(sourceUploadError.message);

  for (const item of normalized) {
    if (item.type === "evidence" && item.data.file_path && item.errors.length === 0) {
      const buffer = readFileSync(item.data.file_path);
      let inspectedFile = null;

      try {
        inspectedFile = inspectImportEvidenceFile(item.data.file_path, buffer);
      } catch (error) {
        item.errors.push(error.message);
      }

      if (inspectedFile) {
        item.data.hash_tep = sha256(buffer);
        item.data.kich_thuoc = String(buffer.length);
        item.data.loai_tep = inspectedFile.mimeType;
        item.data.storage_path = `${profile.co_so_id}/${year.id}/${randomUUID()}${inspectedFile.extension}`;
        const { error: uploadError } = await supabase.storage.from("evidence").upload(item.data.storage_path, buffer, {
          contentType: item.data.loai_tep,
          metadata: {
            original_name: inspectedFile.originalName,
            sha256: item.data.hash_tep,
          },
          upsert: false,
        });
        if (uploadError) item.errors.push(uploadError.message);
      }
    }
    delete item.data.file_path;
    const { error } = await supabase.rpc("fn_ghi_dong_import", {
      p_dot_import_id: batchId,
      p_so_dong: item.rowNumber,
      p_loai_dong: item.type,
      p_du_lieu: item.data,
      p_loi: item.errors,
    });
    if (error) throw new Error(`Dòng ${item.rowNumber}: ${error.message}`);
  }

  const { data: validation, error: validationError } = await supabase.rpc("fn_hoan_tat_staging_import", {
    p_dot_import_id: batchId,
  });
  if (validationError) throw new Error(validationError.message);
  console.log("Kết quả kiểm tra lô:", validation);
  if (!validation.ready) {
    console.log("Lô chưa được commit. Sửa các dòng lỗi trong nguồn rồi chạy lại.");
    process.exitCode = 2;
    return;
  }
  if (args.commit !== "true") {
    console.log(`Lô đã hợp lệ. Chạy lại với --commit=true để ghi ${validation.valid} dòng vào dữ liệu nghiệp vụ.`);
    return;
  }

  const { data: result, error: commitError } = await supabase.rpc("fn_commit_dot_import", { p_dot_import_id: batchId });
  if (commitError) throw new Error(commitError.message);
  console.log("Đã commit lô import:", result);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
