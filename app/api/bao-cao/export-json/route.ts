import { NextRequest } from "next/server";
import { buildSchoolYearJson } from "@/lib/reports/export";
import { downloadResponse, logReportExport, withReportData } from "@/lib/reports/routes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return withReportData(request, async (context) => {
    const { data } = context;
    const json = JSON.stringify(buildSchoolYearJson(data), null, 2);
    await logReportExport(context, "du_lieu_nam_hoc_json");

    return downloadResponse(
      json,
      `Du-lieu-nam-hoc-${data.school.ten}-${data.year.ten}.json`,
      "application/json; charset=utf-8",
    );
  });
}
