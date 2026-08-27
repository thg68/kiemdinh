import { describe, expect, it } from "vitest";
import {
  assessmentLabel,
  evidenceCodes,
  formatDateRange,
  sanitizeFileName,
  storageOrLink,
} from "./format";

describe("chuẩn hóa dữ liệu xuất file", () => {
  it("loại ký tự nguy hiểm nhưng giữ tên tiếng Việt dễ đọc", () => {
    expect(sanitizeFileName("  Báo cáo: Mẫu/1?.docx  ")).toBe("Bao cao Mau 1 .docx");
    expect(sanitizeFileName("a".repeat(200))).toHaveLength(160);
  });

  it("định dạng danh sách mã minh chứng", () => {
    expect(evidenceCodes(["MC.1.1.01", "MC.1.1.02"])).toBe("(MC.1.1.01, MC.1.1.02)");
    expect(evidenceCodes([])).toBe("");
  });

  it("định dạng đủ các trường hợp khoảng thời gian", () => {
    expect(formatDateRange("2026-08-01", "2027-05-31")).toBe("2026-08-01 - 2027-05-31");
    expect(formatDateRange("2026-08-01", null)).toBe("2026-08-01");
    expect(formatDateRange(null, "2027-05-31")).toBe("2027-05-31");
    expect(formatDateRange()).toBe("");
  });

  it("trả nhãn tiếng Việt cho ba mức", () => {
    expect(assessmentLabel(0)).toBe("Không đạt Mức 1");
    expect(assessmentLabel(1)).toBe("Đạt Mức 1");
    expect(assessmentLabel(2)).toBe("Đạt Mức 2");
  });

  it("ưu tiên liên kết điện tử, sau đó Storage", () => {
    expect(storageOrLink({ duong_dan: "https://example.test", storage_path: "school/file.pdf" })).toBe("https://example.test");
    expect(storageOrLink({ duong_dan: null, storage_path: "school/file.pdf" })).toBe("school/file.pdf");
    expect(storageOrLink({})).toBe("");
  });
});
