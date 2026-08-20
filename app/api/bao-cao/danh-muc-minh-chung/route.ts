import { NextRequest } from "next/server";
import { downloadResponse, logReportExport, withReportData } from "@/lib/reports/routes";
import { buildEvidenceCatalogXlsx } from "@/lib/reports/xlsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return withReportData(request, async (context) => {
    const { data } = context;
    const buffer = await buildEvidenceCatalogXlsx(data);
    await logReportExport(context, "danh_muc_minh_chung");

    return downloadResponse(
      buffer,
      `Danh-muc-minh-chung-${data.school.ten}-${data.year.ten}.xlsx`,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
  });
}
