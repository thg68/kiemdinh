export const CANH_BAO_THIEU_DU_LIEU = "[CHƯA CÓ DỮ LIỆU - không xuất bản chính thức]";

export function sanitizeFileName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

export function evidenceCodes(codes: string[]) {
  return codes.length > 0 ? `(${codes.join(", ")})` : "";
}

export function formatDateRange(start?: string | null, end?: string | null) {
  if (start && end) {
    return `${start} - ${end}`;
  }

  return start ?? end ?? "";
}

export function assessmentLabel(level: 0 | 1 | 2) {
  if (level === 2) {
    return "Đạt Mức 2";
  }

  if (level === 1) {
    return "Đạt Mức 1";
  }

  return "Không đạt Mức 1";
}

export function storageOrLink(item: { duong_dan?: string | null; storage_path?: string | null }) {
  return item.duong_dan || item.storage_path || "";
}
