import { NextRequest } from "next/server";
import { buildEvidenceZip } from "@/lib/reports/export";
import { downloadResponse, withReportData } from "@/lib/reports/routes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return withReportData(request, async ({ data, supabase }) => {
    const buffer = await buildEvidenceZip(data, supabase);

    return downloadResponse(
      buffer,
      `Goi-minh-chung-${data.school.ten}-${data.year.ten}.zip`,
      "application/zip",
    );
  });
}
