export type ApprovalEvidence = {
  la_du_lieu_demo: boolean;
  ngay_het_gia_tri: string | null;
  trang_thai_xac_minh: string;
};

export type ApprovalAssessment = {
  la_du_lieu_demo: boolean;
  muc_dat: number;
};

export function getAssessmentApprovalBlockers(
  assessment: ApprovalAssessment,
  evidence: ApprovalEvidence[],
  validityCutoff = new Date().toISOString().slice(0, 10),
) {
  const blockers: string[] = [];

  if (assessment.la_du_lieu_demo) {
    blockers.push("Bản tự đánh giá còn chứa dữ liệu thử.");
  }

  if (assessment.muc_dat > 0 && evidence.length === 0) {
    blockers.push("Tiêu chí đạt mức nhưng chưa gắn minh chứng.");
  }

  if (evidence.some((item) => item.la_du_lieu_demo)) {
    blockers.push("Có minh chứng dữ liệu thử.");
  }

  if (evidence.some((item) => item.trang_thai_xac_minh !== "da_xac_minh")) {
    blockers.push("Có minh chứng chưa được xác minh.");
  }

  if (evidence.some((item) => item.ngay_het_gia_tri && item.ngay_het_gia_tri < validityCutoff)) {
    blockers.push("Có minh chứng đã hết hiệu lực.");
  }

  return blockers;
}
