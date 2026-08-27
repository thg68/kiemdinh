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

    const source = Readable.from(
      (async function* streamSignedFile() {
        const response = await fetch(signed.signedUrl);
        if (!response.ok || !response.body) {
          throw new Error(`Không tải được tệp minh chứng ${item.ma}: HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          yield Buffer.from(value);
        }
      })(),
    );
    archive.append(source, { name: `minh-chung/${fileName}` });
  }

  void archive.finalize();
  return Readable.toWeb(archive) as ReadableStream<Uint8Array>;
}
