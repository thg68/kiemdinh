import { NextRequest } from "next/server";
import { buildEvidenceZip } from "@/lib/reports/export";
import { downloadResponse, logReportExport, withReportData } from "@/lib/reports/routes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return withReportData(request, async (context) => {
    const { data, supabase } = context;
    const stream = await buildEvidenceZip(data, supabase);
    await logReportExport(context, "goi_minh_chung");

    return downloadResponse(
      stream,
      `Goi-minh-chung-${data.school.ten}-${data.year.ten}.zip`,
      "application/zip",
    );
  }, { rateLimitAction: "evidence_zip" });
}
