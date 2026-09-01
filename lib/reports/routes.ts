import { NextRequest } from "next/server";
import { CapHoc } from "@/lib/assessment/level-engine";
import { ApiError, apiErrorResponse, apiErrors } from "@/lib/api/errors";
import { RateLimitAction, RateLimitClient, enforceRateLimit } from "@/lib/api/rate-limit";
import { SchemaValidationError, capHocSchema, uuidSchema } from "@/lib/api/validation";
import {
  logOperationalAlert,
  logServerError,
} from "@/lib/observability/logger";
import { getRequestContext } from "@/lib/observability/request-context";
import { collectReportData, createRequestSupabaseClient } from "./data";
import { EvidenceZipStorageError } from "./errors";
import { sanitizeFileName } from "./format";

export type ReportRouteContext = {
  data: Awaited<ReturnType<typeof collectReportData>>;
  supabase: ReturnType<typeof createRequestSupabaseClient>;
};

type ReportRouteOptions = {
  rateLimitAction?: RateLimitAction;
};

function errorStatus(error: unknown) {
  if (error instanceof ApiError) return error.status;
  if (error instanceof SchemaValidationError) return 422;
  return 500;
}

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
  options: ReportRouteOptions = {},
) {
  const requestContext = getRequestContext(request);

  try {
    const authorization = request.headers.get("authorization");

    if (!authorization) {
      throw apiErrors.unauthorized("Bạn cần đăng nhập để xuất báo cáo.");
    }

    const namHocId = request.nextUrl.searchParams.get("namHocId");
    const capHoc = request.nextUrl.searchParams.get("capHoc") as CapHoc | null;

    if (!namHocId || !capHoc) {
      throw apiErrors.badRequest("Thiếu năm học hoặc cấp học cần xuất.");
    }

    const parsedNamHocId = uuidSchema.parse(namHocId, "namHocId");
    const parsedCapHoc = capHocSchema.parse(capHoc, "capHoc") as CapHoc;
    const supabase = createRequestSupabaseClient(authorization);
    await enforceRateLimit(
      supabase as unknown as RateLimitClient,
      options.rateLimitAction ?? "report_export",
    );
    const data = await collectReportData(supabase, parsedNamHocId, parsedCapHoc);

    return await handler({ data, supabase });
  } catch (error) {
    const status = errorStatus(error);
    const logContext = {
      operation: "export_report",
      ...requestContext,
      status,
    };

    if (status >= 500) {
      logOperationalAlert(
        "REPORT_EXPORT_FAILURE",
        "report_export_failed",
        error,
        logContext,
      );

      if (error instanceof EvidenceZipStorageError) {
        logOperationalAlert(
          "STORAGE_FAILURE",
          "evidence_zip_storage_failed",
          error,
          logContext,
        );
      }
    } else {
      logServerError("report_api_rejected", error, logContext);
    }

    return apiErrorResponse(error, "Không xuất được báo cáo. Vui lòng thử lại.");
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
