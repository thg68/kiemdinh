import { describe, expect, it } from "vitest";
import { getAssessmentApprovalBlockers } from "@/lib/assessment/approval-readiness";

describe("getAssessmentApprovalBlockers", () => {
  it("allows a failed criterion without evidence to be finalized", () => {
    expect(getAssessmentApprovalBlockers(
      { la_du_lieu_demo: false, muc_dat: 0 },
      [],
      "2026-09-08",
    )).toEqual([]);
  });

  it("requires evidence for an achieved level", () => {
    expect(getAssessmentApprovalBlockers(
      { la_du_lieu_demo: false, muc_dat: 1 },
      [],
      "2026-09-08",
    )).toContain("Tiêu chí đạt mức nhưng chưa gắn minh chứng.");
  });

  it("reports demo, unverified and expired data separately", () => {
    expect(getAssessmentApprovalBlockers(
      { la_du_lieu_demo: true, muc_dat: 1 },
      [{
        la_du_lieu_demo: true,
        ngay_het_gia_tri: "2026-09-07",
        trang_thai_xac_minh: "cho_xac_minh",
      }],
      "2026-09-08",
    )).toEqual([
      "Bản tự đánh giá còn chứa dữ liệu thử.",
      "Có minh chứng dữ liệu thử.",
      "Có minh chứng chưa được xác minh.",
      "Có minh chứng đã hết hiệu lực.",
    ]);
  });
});
