import { NextRequest, NextResponse } from "next/server";
import { CapHoc } from "@/lib/assessment/level-engine";
import { toUserMessage } from "@/lib/errors/user-message";
import { logServerError } from "@/lib/observability/logger";
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
  const { error } = await context.supabase.rpc("fn_log_user_access", {
    p_hanh_dong: "REPORT_EXPORTED",
    p_doi_tuong_id: context.data.year.id,
    p_du_lieu_moi: {
      loai_bao_cao: reportType,
      nam_hoc_id: context.data.year.id,
      cap_hoc: context.data.capHoc,
    },
  });

  if (error) {
    throw new Error("Không ghi được nhật ký xuất báo cáo.");
  }
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
    const normalized = error instanceof Error ? error.message.toLocaleLowerCase("vi") : "";
    const status = normalized.includes("cần đăng nhập")
      ? 401
      : normalized.includes("chưa có quyền") || normalized.includes("không có quyền")
        ? 403
        : 500;
    const message = status === 401
      ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại rồi thử lại."
      : status === 403
        ? "Bạn không có quyền xuất báo cáo này. Hãy kiểm tra vai trò hoặc phạm vi đơn vị."
        : toUserMessage(error, "Không xuất được báo cáo. Vui lòng thử lại.");

    logServerError("report_api_error", error, {
      operation: "export_report",
      route: request.nextUrl.pathname,
      status,
    });

    return NextResponse.json({ error: message }, { status });
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
