import { NextRequest } from "next/server";
import { CapHoc } from "@/lib/assessment/level-engine";
import { ApiError, apiErrorResponse, apiErrors, databaseApiError } from "@/lib/api/errors";
import { RateLimitAction, RateLimitClient, enforceRateLimit } from "@/lib/api/rate-limit";
import { SchemaValidationError, capHocSchema, uuidSchema } from "@/lib/api/validation";
import {
  logOperationalAlert,
  logServerError,
} from "@/lib/observability/logger";
import {
  REQUEST_ID_HEADER,
  getRequestContext,
} from "@/lib/observability/request-context";
import { collectReportData, createRequestSupabaseClient } from "./data";
import { EvidenceZipStorageError } from "./errors";
import { sanitizeFileName } from "./format";

export type ReportRouteContext = {
  data: Awaited<ReturnType<typeof collectReportData>>;
  supabase: ReturnType<typeof createRequestSupabaseClient>;
};

type ReportRouteOptions = {
  rateLimitAction?: RateLimitAction;
  reportType?: string;
};

type ReportSourceSeal = {
  digest: string;
  manifest: Record<string, unknown>;
};

async function getReportSourceSeal(
  supabase: ReportRouteContext["supabase"],
  namHocId: string,
  capHoc: CapHoc,
  reportType: string,
) {
  const { data, error } = await supabase.rpc("fn_lay_niem_phong_nguon_bao_cao", {
    p_nam_hoc_id: namHocId,
    p_cap_hoc: capHoc,
    p_loai_bao_cao: reportType,
  });

  if (error) {
    throw databaseApiError(error, "Không tạo được niêm phong dữ liệu nguồn của báo cáo.");
  }

  if (!data || typeof data !== "object" || !("digest" in data)) {
    throw apiErrors.internal("Khong tao duoc niem phong du lieu nguon cua bao cao.");
  }

  return data as unknown as ReportSourceSeal;
}

function errorStatus(error: unknown) {
  if (error instanceof ApiError) return error.status;
  if (error instanceof SchemaValidationError) return 422;
  return 500;
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
    const sourceSealBefore = options.reportType
      ? await getReportSourceSeal(supabase, parsedNamHocId, parsedCapHoc, options.reportType)
      : null;
    const data = await collectReportData(supabase, parsedNamHocId, parsedCapHoc);
    const response = await handler({ data, supabase });

    if (options.reportType && sourceSealBefore) {
      const sourceSealAfter = await getReportSourceSeal(
        supabase,
        parsedNamHocId,
        parsedCapHoc,
        options.reportType,
      );

      if (sourceSealBefore.digest !== sourceSealAfter.digest) {
        throw apiErrors.conflict(
          "Du lieu nguon da thay doi trong luc tao file. Vui long xuat lai bao cao.",
        );
      }

      response.headers.set("X-Report-Source-Digest", sourceSealAfter.digest);
    }

    response.headers.set(REQUEST_ID_HEADER, requestContext.requestId);
    return response;
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

    const response = apiErrorResponse(error, "Không xuất được báo cáo. Vui lòng thử lại.");
    response.headers.set(REQUEST_ID_HEADER, requestContext.requestId);
    return response;
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
