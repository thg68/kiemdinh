import JSZip from "jszip";
import { ReportData, ReportSupabaseClient } from "./data";
import { sanitizeFileName, storageOrLink } from "./format";
import { buildEvidenceCatalogXlsx } from "./xlsx";

export function buildSchoolYearJson(data: ReportData) {
  return {
    exported_at: new Date().toISOString(),
    co_so_giao_duc: data.school,
    nam_hoc: data.year,
    cap_hoc: data.capHoc,
    ket_qua_tu_danh_gia: data.giaiTrinh,
    tieu_chuan: data.standards,
    tieu_chi: data.criteria,
    tu_danh_gia: data.assessments,
    minh_chung: data.evidence,
    ke_hoach_cai_tien: data.plans,
    hoi_dong_tu_danh_gia: data.councilMembers,
  };
}

function extensionFromStoragePath(path: string | null) {
  if (!path?.includes(".")) {
    return "";
  }

  return `.${path.split(".").pop()}`;
}

export async function buildEvidenceZip(data: ReportData, supabase: ReportSupabaseClient) {
  const zip = new JSZip();
  const catalog = await buildEvidenceCatalogXlsx(data);
  zip.file("danh-muc-minh-chung.xlsx", catalog);

  const folder = zip.folder("minh-chung");

  for (const item of data.evidence) {
    if (!item.storage_path) {
      const note = `Minh chứng ${item.ma} không có tệp trong Storage. Vị trí/URL: ${storageOrLink(item) || "chưa có"}`;
      folder?.file(`${sanitizeFileName(item.ma)} - khong-co-tep.txt`, note);
      continue;
    }

    const { data: fileData, error } = await supabase.storage.from("evidence").download(item.storage_path);

    if (error || !fileData) {
      const note = `Không tải được tệp minh chứng ${item.ma}: ${error?.message ?? "không rõ lỗi"}`;
      folder?.file(`${sanitizeFileName(item.ma)} - loi-tai-tep.txt`, note);
      continue;
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const fileName = `${sanitizeFileName(item.ma)} - ${sanitizeFileName(item.ten)}${extensionFromStoragePath(item.storage_path)}`;
    folder?.file(fileName, arrayBuffer);
  }

  return zip.generateAsync({ type: "nodebuffer" });
}
