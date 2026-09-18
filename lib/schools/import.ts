import ExcelJS from "exceljs";
import { provinces as provincesFromCatalog } from "@/lib/localities/provinces";

export const SCHOOL_IMPORT_MAX_ROWS = 2000;
export const SCHOOL_IMPORT_MAX_BYTES = 5 * 1024 * 1024;

export type SchoolImportRecord = {
  ma_truong: string;
  ten: string;
  tinh_thanh: string;
  phuong_xa: string | null;
  loai_hinh: "mam_non" | "pho_thong" | "gdtx";
  cap_hoc: ("mam_non" | "tieu_hoc" | "thcs" | "thpt" | "gdtx")[];
  dia_chi: string | null;
  cong_lap: boolean | null;
};

export type SchoolImportRow = SchoolImportRecord & {
  row: number;
  status: "new" | "duplicate" | "error";
  message: string | null;
};

type SchoolImportField = keyof SchoolImportRecord;

const HEADERS: { key: SchoolImportField; title: string; required: boolean }[] = [
  { key: "ma_truong", title: "Mã trường", required: true },
  { key: "ten", title: "Tên trường", required: true },
  { key: "tinh_thanh", title: "Tỉnh/Thành", required: true },
  { key: "phuong_xa", title: "Phường/Xã", required: false },
  { key: "loai_hinh", title: "Loại hình", required: true },
  { key: "cap_hoc", title: "Cấp học", required: true },
  { key: "dia_chi", title: "Địa chỉ", required: false },
  { key: "cong_lap", title: "Công lập", required: false },
];

const HEADER_KEYS: Record<string, SchoolImportField> = {
  ma_truong: "ma_truong",
  ma_co_so: "ma_truong",
  ten: "ten",
  ten_truong: "ten",
  ten_co_so: "ten",
  ten_co_so_giao_duc: "ten",
  tinh_thanh: "tinh_thanh",
  tinh_thanh_pho: "tinh_thanh",
  tinh: "tinh_thanh",
  phuong_xa: "phuong_xa",
  xa_phuong: "phuong_xa",
  loai_hinh: "loai_hinh",
  loai_hinh_co_so: "loai_hinh",
  cap_hoc: "cap_hoc",
  dia_chi: "dia_chi",
  cong_lap: "cong_lap",
};

export class SchoolImportFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SchoolImportFileError";
  }
}

function keyOf(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function provinceKey(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9]+/g, " ")
    .trim().replace(/^(?:tinh|thanh pho|tp)\s+/, "");
}

function cellText(cell: ExcelJS.Cell): { text: string; error: string | null } {
  const value = cell.value;
  if (value === null || value === undefined) return { text: "", error: null };
  if (cell.type === ExcelJS.ValueType.Formula) {
    return { text: "", error: "Ô chứa công thức; hãy dán giá trị văn bản trước khi nhập." };
  }
  if (value instanceof Date) return { text: "", error: "Ô ngày tháng không hợp lệ cho cột này." };
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return { text: String(value).trim(), error: null };
  }
  if (typeof value === "object" && "richText" in value && Array.isArray(value.richText)) {
    return { text: value.richText.map((part) => part.text).join("").trim(), error: null };
  }
  if (typeof value === "object" && "text" in value && typeof value.text === "string") {
    return { text: value.text.trim(), error: null };
  }
  return { text: "", error: "Ô có kiểu dữ liệu không được hỗ trợ." };
}

function schoolType(value: string): SchoolImportRecord["loai_hinh"] | null {
  const key = keyOf(value);
  if (["mam_non", "mau_giao"].includes(key)) return "mam_non";
  if (["pho_thong", "truong_pho_thong"].includes(key)) return "pho_thong";
  if (["gdtx", "giao_duc_thuong_xuyen"].includes(key)) return "gdtx";
  return null;
}

function schoolLevels(value: string): SchoolImportRecord["cap_hoc"] | null {
  const parts = value.split(/[,;|\n]+/).map((part) => keyOf(part.trim())).filter(Boolean);
  const aliases: Record<string, SchoolImportRecord["cap_hoc"][number]> = {
    mam_non: "mam_non",
    mau_giao: "mam_non",
    tieu_hoc: "tieu_hoc",
    thcs: "thcs",
    trung_hoc_co_so: "thcs",
    thpt: "thpt",
    trung_hoc_pho_thong: "thpt",
    gdtx: "gdtx",
    giao_duc_thuong_xuyen: "gdtx",
  };
  const levels = parts.map((part) => aliases[part]);
  if (levels.length === 0 || levels.some((level) => !level) || new Set(levels).size !== levels.length) return null;
  return levels;
}

function publicSchool(value: string): boolean | null | undefined {
  if (!value) return null;
  const key = keyOf(value);
  if (["co", "cong_lap", "true", "1", "yes"].includes(key)) return true;
  if (["khong", "tu_thuc", "ngoai_cong_lap", "false", "0", "no"].includes(key)) return false;
  return undefined;
}

function textIssue(value: string, title: string, maxLength: number, required: boolean) {
  if (required && !value) return `${title} không được để trống.`;
  if (value.length > maxLength) return `${title} vượt quá ${maxLength} ký tự.`;
  if (/[\u0000-\u001f\u007f]/.test(value)) return `${title} chứa ký tự điều khiển.`;
  return null;
}

function validLevels(type: SchoolImportRecord["loai_hinh"], levels: SchoolImportRecord["cap_hoc"]) {
  if (type === "mam_non") return levels.length === 1 && levels[0] === "mam_non";
  if (type === "gdtx") return levels.length === 1 && levels[0] === "gdtx";
  return levels.length > 0 && levels.every((level) => ["tieu_hoc", "thcs", "thpt"].includes(level));
}

export async function parseSchoolImportWorkbook(bytes: Uint8Array): Promise<SchoolImportRow[]> {
  let workbook: ExcelJS.Workbook;
  try {
    workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(bytes) as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  } catch {
    throw new SchoolImportFileError("Tệp Excel không đọc được. Hãy dùng mẫu .xlsx được tải từ hệ thống.");
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new SchoolImportFileError("Tệp Excel không có trang dữ liệu.");
  const headerRow = sheet.getRow(1);
  const columns = new Map<SchoolImportField, number>();
  for (let column = 1; column <= Math.min(headerRow.cellCount, 50); column += 1) {
    const heading = cellText(headerRow.getCell(column));
    if (heading.error) throw new SchoolImportFileError(`Tiêu đề cột ${column} không hợp lệ.`);
    const field = HEADER_KEYS[keyOf(heading.text)];
    if (!field) continue;
    if (columns.has(field)) throw new SchoolImportFileError(`Cột “${heading.text}” xuất hiện nhiều lần.`);
    columns.set(field, column);
  }
  const missing = HEADERS.filter((header) => header.required && !columns.has(header.key)).map((header) => header.title);
  if (missing.length) throw new SchoolImportFileError(`Thiếu cột bắt buộc: ${missing.join(", ")}.`);

  const rows: SchoolImportRow[] = [];
  const seen = new Set<string>();
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const source = sheet.getRow(rowNumber);
    const values = {} as Record<SchoolImportField, string>;
    const issues: string[] = [];
    let hasContent = false;
    for (const header of HEADERS) {
      const column = columns.get(header.key);
      if (!column) {
        values[header.key] = "";
        continue;
      }
      const cell = source.getCell(column);
      if (cell.value !== null && cell.value !== undefined) hasContent = true;
      const result = cellText(cell);
      values[header.key] = result.text;
      if (result.error) issues.push(`${header.title}: ${result.error}`);
      if (header.key === "ma_truong" && typeof cell.value === "number") {
        issues.push("Mã trường phải được định dạng văn bản để giữ số 0 ở đầu.");
      }
    }
    if (!hasContent) continue;
    if (rows.length >= SCHOOL_IMPORT_MAX_ROWS) {
      throw new SchoolImportFileError(`Mỗi tệp chỉ được có tối đa ${SCHOOL_IMPORT_MAX_ROWS} trường.`);
    }

    for (const [field, title, length, required] of [
      ["ma_truong", "Mã trường", 100, true],
      ["ten", "Tên trường", 255, true],
      ["tinh_thanh", "Tỉnh/Thành", 100, true],
      ["phuong_xa", "Phường/Xã", 150, false],
      ["dia_chi", "Địa chỉ", 500, false],
    ] as const) {
      const issue = textIssue(values[field], title, length, required);
      if (issue) issues.push(issue);
    }
    const type = schoolType(values.loai_hinh);
    if (!type) issues.push("Loại hình phải là Mầm non, Phổ thông hoặc GDTX.");
    const levels = schoolLevels(values.cap_hoc);
    if (!levels) issues.push("Cấp học không hợp lệ; phân cách nhiều cấp bằng dấu phẩy.");
    if (type && levels && !validLevels(type, levels)) issues.push("Cấp học không phù hợp với loại hình.");
    const isPublic = publicSchool(values.cong_lap);
    if (isPublic === undefined) issues.push("Công lập phải là Có, Không hoặc để trống.");
    const normalizedCode = values.ma_truong.toLowerCase();
    if (values.ma_truong && seen.has(normalizedCode)) issues.push("Mã trường lặp lại trong tệp.");
    if (values.ma_truong) seen.add(normalizedCode);

    rows.push({
      row: rowNumber,
      ma_truong: values.ma_truong,
      ten: values.ten,
      tinh_thanh: values.tinh_thanh,
      phuong_xa: values.phuong_xa || null,
      loai_hinh: type ?? "mam_non",
      cap_hoc: levels ?? [],
      dia_chi: values.dia_chi || null,
      cong_lap: isPublic ?? null,
      status: issues.length ? "error" : "new",
      message: issues.length ? issues.join(" ") : null,
    });
  }
  if (!rows.length) throw new SchoolImportFileError("Tệp Excel chưa có dòng dữ liệu trường.");
  return rows;
}

export function classifySchoolImportRows(rows: SchoolImportRow[], provinces: readonly string[], existingCodes: readonly string[]) {
  const provinceSet = new Set(provinces);
  const provinceByName = new Map(provinces.map((name) => [provinceKey(name), name]));
  const provinceByCode = new Map<string, string>(
    provincesFromCatalog
      .filter((province) => provinceSet.has(province.name))
      .map((province) => [province.code, province.name]),
  );
  const existingSet = new Set(existingCodes.map((code) => code.toLowerCase()));
  return rows.map((row): SchoolImportRow => {
    const canonicalProvince = provinceByName.get(provinceKey(row.tinh_thanh))
      ?? provinceByCode.get(row.tinh_thanh.padStart(2, "0"));
    const issue = !canonicalProvince
      ? `Tỉnh/Thành “${row.tinh_thanh}” không có trong danh mục hiện hành.`
      : null;
    if (row.status === "error" || !canonicalProvince) {
      return { ...row, status: "error", message: [row.message, issue].filter(Boolean).join(" ") };
    }
    if (existingSet.has(row.ma_truong.toLowerCase())) {
      return { ...row, tinh_thanh: canonicalProvince, status: "duplicate", message: "Mã trường đã có; dòng này sẽ được bỏ qua." };
    }
    return { ...row, tinh_thanh: canonicalProvince };
  });
}

export function schoolImportSummary(rows: readonly SchoolImportRow[]) {
  return {
    total: rows.length,
    new: rows.filter((row) => row.status === "new").length,
    duplicate: rows.filter((row) => row.status === "duplicate").length,
    error: rows.filter((row) => row.status === "error").length,
  };
}

export function schoolImportRecords(rows: readonly SchoolImportRow[]): SchoolImportRecord[] {
  return rows.map((item) => ({
    ma_truong: item.ma_truong,
    ten: item.ten,
    tinh_thanh: item.tinh_thanh,
    phuong_xa: item.phuong_xa,
    loai_hinh: item.loai_hinh,
    cap_hoc: item.cap_hoc,
    dia_chi: item.dia_chi,
    cong_lap: item.cong_lap,
  }));
}

export async function buildSchoolImportTemplate() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Danh mục trường");
  sheet.columns = HEADERS.map((header) => ({
    header: header.title,
    key: header.key,
    width: header.key === "ten" || header.key === "dia_chi" ? 38 : 21,
  }));
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A615A" } };
  sheet.getColumn(1).numFmt = "@";
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const guide = workbook.addWorksheet("Hướng dẫn");
  guide.getColumn(1).width = 25;
  guide.getColumn(2).width = 75;
  guide.addRow(["Trường", "Cách nhập"]);
  guide.addRow(["Mã trường", "Bắt buộc; định dạng văn bản; mã trùng hệ thống sẽ được bỏ qua."]);
  guide.addRow(["Tỉnh/Thành", "Bắt buộc; dùng tên trong danh mục, tên có tiền tố Tỉnh/Thành phố/TP. hoặc mã tỉnh 2 chữ số."]);
  guide.addRow(["Loại hình", "Mầm non, Phổ thông hoặc GDTX."]);
  guide.addRow(["Cấp học", "Mầm non; Tiểu học, THCS, THPT; hoặc GDTX. Nhiều cấp cách nhau bằng dấu phẩy."]);
  guide.addRow(["Công lập", "Có, Không hoặc để trống."]);
  guide.addRow(["Sau nhập", "Trường mới ở trạng thái tạm ngừng, chưa cho tự đăng ký, chưa có năm học."]);
  guide.getRow(1).font = { bold: true };
  guide.getCell("D1").value = "Mã tỉnh";
  guide.getCell("E1").value = "Tên tỉnh/thành hợp lệ";
  guide.getColumn(4).width = 14;
  guide.getColumn(5).width = 28;
  for (const [index, province] of provincesFromCatalog.entries()) {
    guide.getCell(index + 2, 4).value = province.code;
    guide.getCell(index + 2, 5).value = province.name;
  }
  return new Uint8Array(await workbook.xlsx.writeBuffer());
}
