export type Profile = {
  id: string;
  co_so_id: string;
  ho_ten: string;
};

export type SchoolYear = {
  id: string;
  ten: string;
  trang_thai: string;
};

export type Criterion = {
  id: string;
  ma: string;
  ten: string;
  la_bat_buoc: boolean;
  loai_hinh_ap_dung?: string;
  tieu_chuan_id: string;
  tieu_chuan?: {
    so_thu_tu: number;
    ten: string;
  };
};

export type Evidence = {
  id: string;
  co_so_id: string;
  nam_hoc_id: string;
  ma: string;
  ten: string;
  loai_tep: string | null;
  duong_dan: string | null;
  storage_path: string | null;
  hash_tep: string | null;
  kich_thuoc: number | null;
  ngay_ban_hanh: string | null;
  ngay_het_gia_tri: string | null;
  trang_thai_xac_minh: string;
  nguoi_tai_len: string | null;
  created_at: string;
};

export type EvidenceCriterionLink = {
  minh_chung_id: string;
  tieu_chi_id: string;
  la_tieu_chi_goc: boolean;
  tieu_chi?: Criterion;
};

export const MAX_EVIDENCE_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export const EVIDENCE_MIME_BY_EXTENSION: Readonly<Record<string, string>> = {
  csv: "text/csv",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  pdf: "application/pdf",
  png: "image/png",
  txt: "text/plain",
  webp: "image/webp",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export const ALLOWED_EVIDENCE_MIME_TYPES = Object.freeze(
  [...new Set(Object.values(EVIDENCE_MIME_BY_EXTENSION))],
);

const MIME_ALIASES_BY_EXTENSION: Readonly<Record<string, readonly string[]>> = {
  csv: ["text/csv", "application/csv"],
  jpeg: ["image/jpeg", "image/jpg"],
  jpg: ["image/jpeg", "image/jpg"],
};

export function evidenceFileExtension(fileName: string) {
  const normalizedName = fileName.trim();
  const dotIndex = normalizedName.lastIndexOf(".");

  return dotIndex > 0 ? normalizedName.slice(dotIndex + 1).toLowerCase() : "";
}

export function evidenceMimeTypeForFileName(fileName: string) {
  return EVIDENCE_MIME_BY_EXTENSION[evidenceFileExtension(fileName)] ?? null;
}

export function validateEvidenceFileName(fileName: string) {
  if (
    fileName !== fileName.trim() ||
    fileName.length === 0 ||
    fileName.length > 180 ||
    fileName.includes("/") ||
    fileName.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(fileName)
  ) {
    return "Tên tệp không hợp lệ. Hãy bỏ đường dẫn, ký tự điều khiển và giữ tên dưới 180 ký tự.";
  }

  if (!evidenceMimeTypeForFileName(fileName)) {
    return "Định dạng tệp chưa được hỗ trợ. Hệ thống nhận PDF, Word, Excel, CSV, TXT và ảnh JPG/PNG/WebP.";
  }

  return null;
}

export function canonicalEvidenceMimeType(file: Pick<File, "name" | "type">) {
  const extension = evidenceFileExtension(file.name);
  const canonicalMime = EVIDENCE_MIME_BY_EXTENSION[extension];

  if (!canonicalMime) {
    return null;
  }

  const declaredMime = file.type.trim().toLowerCase();
  const acceptedMimes = MIME_ALIASES_BY_EXTENSION[extension] ?? [canonicalMime];

  if (declaredMime && !acceptedMimes.includes(declaredMime)) {
    return null;
  }

  return canonicalMime;
}

export function validateEvidenceFile(file: File) {
  const fileNameError = validateEvidenceFileName(file.name);

  if (fileNameError) {
    return fileNameError;
  }

  if (file.size <= 0) {
    return "Tệp minh chứng đang rỗng. Hãy chọn một tệp có nội dung.";
  }

  if (file.size > MAX_EVIDENCE_FILE_SIZE_BYTES) {
    return "Tệp minh chứng vượt quá 25 MB. Hãy nén hoặc tách tệp trước khi tải lên.";
  }

  if (!canonicalEvidenceMimeType(file)) {
    return "Loại nội dung của tệp không khớp với phần mở rộng. Hãy chọn lại đúng tệp gốc.";
  }

  return null;
}

export async function sha256File(file: File) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function storagePathForEvidence(coSoId: string, namHocId: string, file: File) {
  const extension = evidenceFileExtension(file.name);

  return `${coSoId}/${namHocId}/${crypto.randomUUID()}.${extension}`;
}

export function formatEvidenceStatus(status: string) {
  const labels: Record<string, string> = {
    cho_xac_minh: "Chờ xác minh",
    da_xac_minh: "Đã xác minh",
    tu_choi: "Từ chối",
    het_hieu_luc: "Hết hiệu lực",
  };

  return labels[status] ?? status;
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}
