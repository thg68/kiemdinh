import { NextRequest } from "next/server";
import { buildImprovementPlanDocx } from "@/lib/reports/docx";
import { downloadResponse, logReportExport, withReportData } from "@/lib/reports/routes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return withReportData(request, async (context) => {
    const { data } = context;
    const buffer = await buildImprovementPlanDocx(data);
    await logReportExport(context, "mau_2_ke_hoach_cai_tien");

    return downloadResponse(
      buffer,
      `Mau-2-Ke-hoach-cai-tien-${data.school.ten}-${data.year.ten}.docx`,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
  });
}
