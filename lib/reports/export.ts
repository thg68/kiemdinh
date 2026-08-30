import archiver from "archiver";
import { Readable } from "node:stream";
import { ReportData, ReportSupabaseClient } from "./data";
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

async function fetchEvidenceFile(url: string, evidenceCode: string, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok && response.body) return response;

      const canRetry = response.status >= 500 && attempt < maxAttempts;
      if (!canRetry) {
        throw new Error(`Không tải được tệp minh chứng ${evidenceCode}: HTTP ${response.status}`);
      }
    } catch (error) {
      if (attempt >= maxAttempts || (error instanceof Error && error.message.includes("HTTP 4"))) {
        throw new Error(`Không tải được tệp minh chứng ${evidenceCode} sau ${attempt} lần thử.`);
      }
    }
  }

  throw new Error(`Không tải được tệp minh chứng ${evidenceCode}.`);
}
export async function buildEvidenceZip(data: ReportData, supabase: ReportSupabaseClient) {
  const archive = archiver("zip", { zlib: { level: 6 } });
  const catalog = await buildEvidenceCatalogXlsx(data);
  archive.append(Readable.from([new Uint8Array(catalog)]), { name: "danh-muc-minh-chung.xlsx" });

  for (const item of data.evidence) {
    if (!item.storage_path) {
      const note = `Minh chứng ${item.ma} không có tệp trong Storage. Vị trí/URL: ${storageOrLink(item) || "chưa có"}`;
      archive.append(note, { name: `minh-chung/${sanitizeFileName(item.ma)} - khong-co-tep.txt` });
      continue;
    }

    const storagePath = item.storage_path;
    const fileName = `${sanitizeFileName(item.ma)} - ${sanitizeFileName(item.ten)}${extensionFromStoragePath(storagePath)}`;
    const { data: signed, error: signedUrlError } = await supabase.storage.from("evidence").createSignedUrl(storagePath, 300);
    if (signedUrlError || !signed?.signedUrl) {
      throw new Error(`Không tạo được liên kết tạm cho minh chứng ${item.ma}: ${signedUrlError?.message ?? "không rõ lỗi"}`);
    }

    // Xac nhan signed URL truoc khi gan stream vao archive de loi tai tep
    // duoc tra ve cho request thay vi tro thanh loi ngam trong pipeline ZIP.
    const response = await fetchEvidenceFile(signed.signedUrl, item.ma);
    const source = Readable.fromWeb(response.body! as never);
    archive.append(source, { name: `minh-chung/${fileName}` });
  }

  void archive.finalize();
  return Readable.toWeb(archive) as ReadableStream<Uint8Array>;
}
