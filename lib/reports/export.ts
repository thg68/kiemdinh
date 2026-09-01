import archiver from "archiver";
import { Readable } from "node:stream";
import { ReportData, ReportSupabaseClient } from "./data";
import { EvidenceZipStorageError } from "./errors";
import { sanitizeFileName, storageOrLink } from "./format";
import { buildEvidenceCatalogXlsx } from "./xlsx";

export function buildSchoolYearJson(data: ReportData) {
  return {
    schema_version: "1.0",
    exported_at: new Date().toISOString(),
    export_metadata: {
      bo_tieu_chuan_id: data.year.bo_tieu_chuan_id,
      nam_hoc_id: data.year.id,
      cap_hoc: data.capHoc,
    },
    co_so_giao_duc: data.school,
    nam_hoc: data.year,
    cap_hoc: data.capHoc,
    ket_qua_tu_danh_gia: data.giaiTrinh,
    tieu_chuan: data.standards,
    tieu_chi: data.criteria,
    tu_danh_gia: data.assessments,
    minh_chung: data.evidence,
    ke_hoach_cai_tien: data.plans,
    noi_dung_mau_2: data.improvementReportSections,
    hoi_dong_tu_danh_gia: data.councilMembers,
    nhan_xet_tieu_chuan: data.standardNotes,
    lich_su_snapshot_bao_cao: data.reportSnapshots,
  };
}

function extensionFromStoragePath(path: string | null) {
  if (!path?.includes(".")) return "";
  return `.${path.split(".").pop()}`;
}

type EvidenceZipOptions = {
  downloadTimeoutMs?: number;
  maxAttempts?: number;
  maxConcurrentDownloads?: number;
};

const DEFAULT_DOWNLOAD_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_MAX_CONCURRENT_DOWNLOADS = 2;

async function fetchEvidenceFile(
  url: string,
  evidenceCode: string,
  options: Required<Pick<EvidenceZipOptions, "downloadTimeoutMs" | "maxAttempts">>,
) {
  const { downloadTimeoutMs, maxAttempts } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), downloadTimeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (response.ok && response.body) {
        return new Uint8Array(await response.arrayBuffer());
      }

      const canRetry = response.status >= 500 && attempt < maxAttempts;
      if (!canRetry) {
          throw new EvidenceZipStorageError(
            `Không tải được tệp minh chứng ${evidenceCode}: HTTP ${response.status}`,
          );
      }
    } catch (error) {
      if (controller.signal.aborted) {
        if (attempt >= maxAttempts) {
          throw new EvidenceZipStorageError(
            `Tải tệp minh chứng ${evidenceCode} quá thời gian sau ${attempt} lần thử.`,
          );
        }

        continue;
      }

      if (attempt >= maxAttempts || (error instanceof Error && error.message.includes("HTTP 4"))) {
        throw new EvidenceZipStorageError(
          `Không tải được tệp minh chứng ${evidenceCode} sau ${attempt} lần thử.`,
        );
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new EvidenceZipStorageError(
    `Không tải được tệp minh chứng ${evidenceCode}.`,
  );
}

function normalizedPositiveInteger(value: number | undefined, fallback: number, maximum: number) {
  if (!Number.isInteger(value) || !value || value < 1) {
    return fallback;
  }

  return Math.min(value, maximum);
}

export async function buildEvidenceZip(
  data: ReportData,
  supabase: ReportSupabaseClient,
  options: EvidenceZipOptions = {},
) {
  const archive = archiver("zip", { zlib: { level: 6 } });
  const catalog = await buildEvidenceCatalogXlsx(data);
  const downloadTimeoutMs = normalizedPositiveInteger(
    options.downloadTimeoutMs,
    DEFAULT_DOWNLOAD_TIMEOUT_MS,
    120_000,
  );
  const maxAttempts = normalizedPositiveInteger(
    options.maxAttempts,
    DEFAULT_MAX_ATTEMPTS,
    5,
  );
  const maxConcurrentDownloads = normalizedPositiveInteger(
    options.maxConcurrentDownloads,
    DEFAULT_MAX_CONCURRENT_DOWNLOADS,
    2,
  );
  archive.append(Readable.from([new Uint8Array(catalog)]), { name: "danh-muc-minh-chung.xlsx" });

  const downloadableEvidence = [];

  for (const item of data.evidence) {
    if (!item.storage_path) {
      const note = `Minh chứng ${item.ma} không có tệp trong Storage. Vị trí/URL: ${storageOrLink(item) || "chưa có"}`;
      archive.append(note, { name: `minh-chung/${sanitizeFileName(item.ma)} - khong-co-tep.txt` });
      continue;
    }

    downloadableEvidence.push(item);
  }

  // Mỗi đợt chỉ giữ tối đa một nhóm tệp trong bộ nhớ. Điều này giới hạn tải
  // song song và ngăn một năm học lớn mở quá nhiều kết nối Storage cùng lúc.
  for (let index = 0; index < downloadableEvidence.length; index += maxConcurrentDownloads) {
    const batch = downloadableEvidence.slice(index, index + maxConcurrentDownloads);
    const downloaded = await Promise.all(
      batch.map(async (item) => {
        const storagePath = item.storage_path!;
        const fileName = `${sanitizeFileName(item.ma)} - ${sanitizeFileName(item.ten)}${extensionFromStoragePath(storagePath)}`;
        const { data: signed, error: signedUrlError } = await supabase.storage
          .from("evidence")
          .createSignedUrl(storagePath, 300);

        if (signedUrlError || !signed?.signedUrl) {
          throw new EvidenceZipStorageError(
            `Không tạo được liên kết tạm cho minh chứng ${item.ma}: ${signedUrlError?.message ?? "không rõ lỗi"}`,
          );
        }

        const content = await fetchEvidenceFile(signed.signedUrl, item.ma, {
          downloadTimeoutMs,
          maxAttempts,
        });
        return { content, fileName };
      }),
    );

    for (const item of downloaded) {
      archive.append(Readable.from([item.content]), {
        name: `minh-chung/${item.fileName}`,
      });
    }
  }

  void archive.finalize();
  return Readable.toWeb(archive) as ReadableStream<Uint8Array>;
}
