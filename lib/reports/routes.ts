import { NextRequest, NextResponse } from "next/server";
import { CapHoc } from "@/lib/assessment/level-engine";
import { collectReportData, createRequestSupabaseClient } from "./data";
import { sanitizeFileName } from "./format";

export type ReportRouteContext = {
  data: Awaited<ReturnType<typeof collectReportData>>;
  supabase: ReturnType<typeof createRequestSupabaseClient>;
};

export async function logReportExport(
  context: ReportRouteContext,
  reportType: string,
) {
  await context.supabase.rpc("fn_log_audit", {
    p_hanh_dong: "REPORT_EXPORTED",
    p_doi_tuong: "bao_cao",
    p_doi_tuong_id: context.data.year.id,
    p_du_lieu_cu: null,
    p_du_lieu_moi: {
      loai_bao_cao: reportType,
      nam_hoc_id: context.data.year.id,
      cap_hoc: context.data.capHoc,
    },
  });
}

export async function withReportData(
  request: NextRequest,
  handler: (context: ReportRouteContext) => Promise<Response>,
) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization) {
      return NextResponse.json({ error: "Bạn cần đăng nhập để xuất báo cáo." }, { status: 401 });
    }

    const namHocId = request.nextUrl.searchParams.get("namHocId");
    const capHoc = request.nextUrl.searchParams.get("capHoc") as CapHoc | null;

    if (!namHocId || !capHoc) {
      return NextResponse.json({ error: "Thiếu năm học hoặc cấp học cần xuất." }, { status: 400 });
    }

    const supabase = createRequestSupabaseClient(authorization);
    const data = await collectReportData(supabase, namHocId, capHoc);

    return handler({ data, supabase });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không xuất được báo cáo." },
      { status: 500 },
    );
  }
}

export function downloadResponse(body: BodyInit | ArrayBuffer | Uint8Array, fileName: string, contentType: string) {
  const responseBody: BodyInit | ArrayBuffer = body instanceof Uint8Array ? new ArrayBuffer(body.byteLength) : body;

  if (body instanceof Uint8Array && responseBody instanceof ArrayBuffer) {
    new Uint8Array(responseBody).set(body);
  }

  return new Response(responseBody, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(sanitizeFileName(fileName))}`,
      "Cache-Control": "no-store",
    },
  });
}
