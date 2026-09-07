import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { assertReportScope } from "./data";

describe("phạm vi cấp học khi xuất báo cáo", () => {
  it.each(["mam_non", "tieu_hoc", "thcs", "thpt", "gdtx"] as const)(
    "chấp nhận cấp học %s khi thuộc đơn vị",
    (capHoc) => {
      expect(() => assertReportScope({ cap_hoc: [capHoc] }, capHoc)).not.toThrow();
    },
  );

  it("trả lỗi 422 có mã ổn định khi enum hợp lệ nhưng ngoài phạm vi đơn vị", () => {
    try {
      assertReportScope({ cap_hoc: ["mam_non"] }, "thpt");
      throw new Error("Expected assertReportScope to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({
        status: 422,
        code: "UNPROCESSABLE_ENTITY",
        details: { field: "capHoc", code: "SCHOOL_LEVEL_OUT_OF_SCOPE" },
      });
    }
  });
});
