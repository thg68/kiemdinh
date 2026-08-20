import { NextRequest } from "next/server";
import { buildSchoolYearJson } from "@/lib/reports/export";
import { downloadResponse, withReportData } from "@/lib/reports/routes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return withReportData(request, async ({ data }) => {
    const json = JSON.stringify(buildSchoolYearJson(data), null, 2);

    return downloadResponse(
      json,
      `Du-lieu-nam-hoc-${data.school.ten}-${data.year.ten}.json`,
      "application/json; charset=utf-8",
    );
  });
}
