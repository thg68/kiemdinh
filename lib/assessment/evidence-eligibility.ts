export type EvidenceEligibilityInput = {
  la_du_lieu_demo: boolean;
  ngay_het_gia_tri: string | null;
  trang_thai_xac_minh: string;
};

export type EvidenceEligibility = {
  eligible: boolean;
  reason: string | null;
};

function earlierDate(left: string, right: string) {
  return left < right ? left : right;
}

export function evaluateEvidenceEligibility(
  evidence: EvidenceEligibilityInput,
  schoolYearEnd: string,
  today = new Date().toISOString().slice(0, 10),
): EvidenceEligibility {
  if (evidence.la_du_lieu_demo) {
    return { eligible: false, reason: "Dữ liệu thử không được dùng để chốt kết quả." };
  }

  if (evidence.trang_thai_xac_minh !== "da_xac_minh") {
    return { eligible: false, reason: "Minh chứng chưa được xác minh." };
  }

  const validityCutoff = earlierDate(today, schoolYearEnd);
  if (evidence.ngay_het_gia_tri && evidence.ngay_het_gia_tri < validityCutoff) {
    return { eligible: false, reason: "Minh chứng đã hết hiệu lực." };
  }

  return { eligible: true, reason: null };
}
