import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import {
  SchoolImportFileError,
  buildSchoolImportTemplate,
  classifySchoolImportRows,
  parseSchoolImportWorkbook,
  schoolImportSummary,
} from "./import";

async function workbookBytes(rows: unknown[][]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Danh mục trường");
  rows.forEach((row) => sheet.addRow(row));
  return new Uint8Array(await workbook.xlsx.writeBuffer());
}

const headers = ["Mã trường", "Tên trường", "Tỉnh/Thành", "Phường/Xã", "Loại hình", "Cấp học", "Địa chỉ", "Công lập"];

describe("school directory Excel import", () => {
  it("reads a valid template, normalizes school metadata and classifies existing codes", async () => {
    const bytes = await workbookBytes([
      headers,
      ["0001", "Trường A", "Quảng Ninh", "Hạ Long", "Phổ thông", "Tiểu học, THCS", "Đường 1", "Có"],
      ["0002", "Trường B", "Hà Nội", "", "Mầm non", "Mầm non", "", "Không"],
    ]);
    const parsed = await parseSchoolImportWorkbook(bytes);
    expect(parsed[0]).toMatchObject({
      row: 2,
      ma_truong: "0001",
      loai_hinh: "pho_thong",
      cap_hoc: ["tieu_hoc", "thcs"],
      cong_lap: true,
      status: "new",
    });
    const classified = classifySchoolImportRows(parsed, ["Quảng Ninh", "Hà Nội"], ["0001"]);
    expect(schoolImportSummary(classified)).toEqual({ total: 2, new: 1, duplicate: 1, error: 0 });
    expect(classified[0].message).toContain("đã có");
  });

  it("reports duplicate codes, invalid provinces, formulas and numeric codes by row", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Danh mục trường");
    sheet.addRow(headers);
    sheet.addRow(["A01", "Trường A", "Quảng Ninh", "", "Mầm non", "Mầm non"]);
    sheet.addRow(["a01", "Trường B", "Sai tỉnh", "", "Mầm non", "Mầm non"]);
    sheet.addRow([42, "Trường C", "Hà Nội", "", "Mầm non", "Mầm non"]);
    const formulaRow = sheet.addRow(["A04", "Trường D", "Hà Nội", "", "Mầm non", "Mầm non"]);
    formulaRow.getCell(2).value = { formula: "1+1", result: "Trường D" };
    const parsed = await parseSchoolImportWorkbook(new Uint8Array(await workbook.xlsx.writeBuffer()));
    const classified = classifySchoolImportRows(parsed, ["Quảng Ninh", "Hà Nội"], []);
    expect(schoolImportSummary(classified)).toEqual({ total: 4, new: 1, duplicate: 0, error: 3 });
    expect(classified[1].message).toContain("lặp lại");
    expect(classified[1].message).toContain("Tỉnh/Thành");
    expect(classified[2].message).toContain("định dạng văn bản");
    expect(classified[3].message).toContain("công thức");
  });

  it("accepts official province prefixes, common abbreviations and province codes", async () => {
    const bytes = await workbookBytes([
      headers,
      ["HN01", "Trường Hà Nội", "Thành phố Hà Nội", "", "Mầm non", "Mầm non"],
      ["HCM01", "Trường TP.HCM", "TP. Hồ Chí Minh", "", "Mầm non", "Mầm non"],
      ["QN01", "Trường Quảng Ninh", "22", "", "Mầm non", "Mầm non"],
    ]);
    const rows = classifySchoolImportRows(
      await parseSchoolImportWorkbook(bytes),
      ["Hà Nội", "Hồ Chí Minh", "Quảng Ninh"],
      [],
    );
    expect(schoolImportSummary(rows)).toEqual({ total: 3, new: 3, duplicate: 0, error: 0 });
    expect(rows.map((row) => row.tinh_thanh)).toEqual(["Hà Nội", "Hồ Chí Minh", "Quảng Ninh"]);
  });

  it("rejects missing required headers", async () => {
    const bytes = await workbookBytes([["Mã trường", "Tên trường"]]);
    await expect(parseSchoolImportWorkbook(bytes)).rejects.toBeInstanceOf(SchoolImportFileError);
  });

  it("generates a readable workbook with the required headers", async () => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(
      Buffer.from(await buildSchoolImportTemplate()) as unknown as Parameters<typeof workbook.xlsx.load>[0],
    );
    expect(workbook.worksheets[0].getRow(1).values).toEqual([undefined, ...headers]);
    expect(workbook.worksheets[1].name).toBe("Hướng dẫn");
  });
});
