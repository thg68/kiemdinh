import { NextRequest } from "next/server";
import { buildSelfAssessmentDocx } from "@/lib/reports/docx";
import { downloadResponse, withReportData } from "@/lib/reports/routes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return withReportData(request, async (context) => {
    const { data } = context;
    const buffer = await buildSelfAssessmentDocx(data);
    return downloadResponse(
      buffer,
      `Mau-1-Bao-cao-tu-danh-gia-${data.school.ten}-${data.year.ten}.docx`,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
  }, { reportType: "mau_1_tu_danh_gia" });
}
