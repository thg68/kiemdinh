import { describe, expect, it } from "vitest";
import { evaluateEvidenceEligibility } from "@/lib/assessment/evidence-eligibility";

const validEvidence = {
  la_du_lieu_demo: false,
  ngay_het_gia_tri: null,
  trang_thai_xac_minh: "da_xac_minh",
};

describe("evaluateEvidenceEligibility", () => {
  it("accepts verified non-demo evidence without an expiry", () => {
    expect(evaluateEvidenceEligibility(validEvidence, "2027-05-31", "2026-09-08"))
      .toEqual({ eligible: true, reason: null });
  });

  it("rejects demo evidence even when it is verified", () => {
    expect(evaluateEvidenceEligibility(
      { ...validEvidence, la_du_lieu_demo: true },
      "2027-05-31",
      "2026-09-08",
    ).reason).toMatch(/Dữ liệu thử/);
  });

  it("rejects evidence that has not been verified", () => {
    expect(evaluateEvidenceEligibility(
      { ...validEvidence, trang_thai_xac_minh: "cho_xac_minh" },
      "2027-05-31",
      "2026-09-08",
    ).reason).toMatch(/chưa được xác minh/);
  });

  it("uses the earlier of today and the school-year end as the validity cutoff", () => {
    expect(evaluateEvidenceEligibility(
      { ...validEvidence, ngay_het_gia_tri: "2026-09-07" },
      "2027-05-31",
      "2026-09-08",
    ).eligible).toBe(false);

    expect(evaluateEvidenceEligibility(
      { ...validEvidence, ngay_het_gia_tri: "2026-06-01" },
      "2026-05-31",
      "2026-09-08",
    ).eligible).toBe(true);
  });
});
