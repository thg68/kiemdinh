import { describe, expect, it } from "vitest";
import {
  formatApprovedAt,
  formatFileSize,
  reportOwnerLabel,
  reportTypeLabel,
  schoolLevelLabel,
} from "./approved-report";

describe("approved report presentation", () => {
  it("hiển thị tên nghiệp vụ thay cho mã trong cơ sở dữ liệu", () => {
    expect(reportTypeLabel("mau_1_tu_danh_gia")).toBe("Mẫu 1 – Báo cáo tự đánh giá");
    expect(schoolLevelLabel("mam_non")).toBe("Mầm non");
  });

  it("ưu tiên họ tên và dùng email khi chưa có họ tên", () => {
    expect(reportOwnerLabel({ ho_ten: "Nguyễn An", email: "an@example.test" })).toBe("Nguyễn An");
    expect(reportOwnerLabel({ ho_ten: null, email: "an@example.test" })).toBe("an@example.test");
  });

  it("định dạng dung lượng tệp và xử lý dữ liệu rỗng", () => {
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(null)).toBe("Chưa xác định");
    expect(formatApprovedAt(null)).toBe("Chưa có thời điểm phê duyệt");
  });
});
