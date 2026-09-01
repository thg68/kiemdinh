import { describe, expect, it } from "vitest";
import {
  SchemaValidationError,
  capHocSchema,
  loaiHinhSchema,
  namHocSchema,
  paginationSchema,
  uuidSchema,
} from "./validation";

describe("schema validation dùng chung", () => {
  it("chấp nhận UUID hợp lệ và loại khoảng trắng", () => {
    expect(uuidSchema.parse(" 8f6f40d1-e3fe-4eb0-a576-801367e1d9b1 ")).toBe(
      "8f6f40d1-e3fe-4eb0-a576-801367e1d9b1",
    );
  });

  it("từ chối UUID sai định dạng với lỗi có cấu trúc", () => {
    expect(() => uuidSchema.parse("year-1", "namHocId")).toThrow(SchemaValidationError);

    try {
      uuidSchema.parse("year-1", "namHocId");
    } catch (error) {
      expect(error).toMatchObject({
        issues: [{ field: "namHocId", code: "invalid_uuid" }],
      });
    }
  });

  it("chỉ chấp nhận năm học liên tiếp theo dạng YYYY-YYYY", () => {
    expect(namHocSchema.parse("2026-2027")).toBe("2026-2027");
    expect(() => namHocSchema.parse("2026-2028")).toThrow(SchemaValidationError);
    expect(() => namHocSchema.parse("26-27")).toThrow(SchemaValidationError);
  });

  it("dùng enum chung cho loại hình và cấp học", () => {
    expect(loaiHinhSchema.parse("pho_thong")).toBe("pho_thong");
    expect(capHocSchema.parse("thpt")).toBe("thpt");
    expect(() => capHocSchema.parse("trung_hoc")).toThrow(SchemaValidationError);
  });

  it("phân trang mặc định 25 dòng và không cho vượt 100", () => {
    expect(paginationSchema.parse(new URLSearchParams())).toEqual({
      page: 1,
      pageSize: 25,
      from: 0,
      to: 24,
    });
    expect(
      paginationSchema.parse(new URLSearchParams("page=3&pageSize=100")),
    ).toEqual({ page: 3, pageSize: 100, from: 200, to: 299 });
    expect(() =>
      paginationSchema.parse(new URLSearchParams("page=0&pageSize=101")),
    ).toThrow(SchemaValidationError);
  });
});
