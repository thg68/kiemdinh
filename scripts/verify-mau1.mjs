import JSZip from "jszip";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).map((item) => {
    const [key, ...parts] = item.replace(/^--/, "").split("=");
    return [key, parts.join("=") || "true"];
  }),
);

function requiredFile(name) {
  const value = args[name];
  if (!value) throw new Error(`Thiếu --${name}=đường-dẫn-tệp.`);
  const path = resolve(process.cwd(), value);
  if (!existsSync(path)) throw new Error(`Không tìm thấy tệp ${path}.`);
  return path;
}

function normalize(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function decodeXml(value) {
  return value
    .replace(/<w:tab\/>/g, " ")
    .replace(/<w:br\/>/g, " ")
    .replace(/<\/w:p>/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

const docxPath = requiredFile("docx");
const jsonPath = requiredFile("json");
const source = JSON.parse(readFileSync(jsonPath, "utf8"));
const zip = await JSZip.loadAsync(readFileSync(docxPath));
const xml = await zip.file("word/document.xml")?.async("text");
if (!xml) throw new Error("DOCX không có word/document.xml.");
const reportText = normalize(decodeXml(xml));

const errors = [];
if (reportText.includes("[DEMO]")) errors.push("Mẫu 1 vẫn chứa nhãn [DEMO].");

const criteria = source.tieu_chi ?? [];
const assessments = new Map((source.tu_danh_gia ?? []).map((item) => [item.tieu_chi_id, item]));
for (const criterion of criteria) {
  if (!reportText.includes(normalize(criterion.ma))) errors.push(`Thiếu mã tiêu chí ${criterion.ma}.`);
  if (!reportText.includes(normalize(criterion.ten))) errors.push(`Thiếu tên tiêu chí ${criterion.ma}.`);
  const assessment = assessments.get(criterion.id);
  for (const description of [assessment?.mo_ta_muc_1, assessment?.mo_ta_muc_2]) {
    if (normalize(description) && !reportText.includes(normalize(description))) {
      errors.push(`Mô tả của tiêu chí ${criterion.ma} không khớp dữ liệu nguồn.`);
    }
  }
}

for (const evidence of source.minh_chung ?? []) {
  if (evidence.ma && !reportText.includes(normalize(evidence.ma))) {
    errors.push(`Thiếu mã minh chứng ${evidence.ma}.`);
  }
}

const result = {
  valid: errors.length === 0,
  criteria_checked: criteria.length,
  evidence_checked: (source.minh_chung ?? []).length,
  errors,
};
console.log(JSON.stringify(result, null, 2));
if (!result.valid) process.exitCode = 2;
