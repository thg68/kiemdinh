import { describe, expect, it } from "vitest";
import {
  AUDIT_ACTION_LABELS,
  LEGACY_NON_MUTATION_AUDIT_ACTIONS,
  auditActionLabel,
  auditObjectLabel,
} from "./catalog";

describe("danh mục nhật ký", () => {
  it("không đưa hành động đọc hoặc xuất vào danh mục hiển thị", () => {
    for (const action of LEGACY_NON_MUTATION_AUDIT_ACTIONS) {
      expect(AUDIT_ACTION_LABELS[action]).toBeUndefined();
    }
  });

  it("không biến mã lạ trong CSDL thành chữ hiển thị cho người dùng", () => {
    expect(auditActionLabel("UNTRUSTED_DATABASE_CODE")).toBe("Thao tác hệ thống");
    expect(auditObjectLabel("unknown_table")).toBe("Dữ liệu hệ thống");
  });

  it("hiển thị nhãn tiếng Việt cho các thao tác minh chứng chính", () => {
    expect(auditActionLabel("EVIDENCE_CREATED")).toBe("Tạo minh chứng");
    expect(auditActionLabel("EVIDENCE_STATUS_UPDATED")).toBe("Xác minh minh chứng");
  });
});
