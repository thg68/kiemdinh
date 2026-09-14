import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, apiErrors, ApiError } from "@/lib/api/errors";
import { enforceRateLimit, type RateLimitClient } from "@/lib/api/rate-limit";
import {
  createRequestSupabaseClient,
  collectReportData,
} from "@/lib/reports/data";
import {
  buildAiDraftContext,
  parseAiDraftRequest,
  parseAiDraftResponse,
} from "@/lib/ai/server";
import {
  buildProviderDraftRequest,
  extractProviderOutputText,
  providerApiError,
} from "@/lib/ai/provider-server";
import {
  getRequestContext,
  isSameOriginRequest,
  REQUEST_ID_HEADER,
} from "@/lib/observability/request-context";
import { logServerError } from "@/lib/observability/logger";

const MAX_BODY_BYTES = 48 * 1024;
const AI_TIMEOUT_MS = 30_000;

export async function POST(request: NextRequest) {
  const context = getRequestContext(request);

  try {
    const origin = request.headers.get("origin");
    if (origin && !isSameOriginRequest(request)) {
      throw apiErrors.forbidden("Nguồn gửi yêu cầu không hợp lệ.");
    }

    const authorization = request.headers.get("authorization");
    if (!authorization) throw apiErrors.unauthorized();

    const apiKey = request.headers.get("x-user-ai-key")?.trim() ?? "";
    if (apiKey.length < 8 || apiKey.length > 512) {
      throw apiErrors.unprocessable("API key AI không hợp lệ.");
    }

    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      throw apiErrors.unprocessable("Dữ liệu gửi tới trợ lý AI quá lớn.");
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      throw apiErrors.badRequest("Nội dung JSON gửi lên không hợp lệ.");
    }
    if (JSON.stringify(rawBody).length > MAX_BODY_BYTES) {
      throw apiErrors.unprocessable("Dữ liệu gửi tới trợ lý AI quá lớn.");
    }

    const body = parseAiDraftRequest(rawBody);
    const supabase = createRequestSupabaseClient(authorization);
    await enforceRateLimit(supabase as unknown as RateLimitClient, "ai_generate");
    const reportData = await collectReportData(supabase, body.namHocId, body.capHoc);
    const aiContext = buildAiDraftContext(reportData, body);
    const providerRequest = buildProviderDraftRequest(body, aiContext, apiKey);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
    let providerResponse: Response;

    try {
      providerResponse = await fetch(providerRequest.url, {
        ...providerRequest.init,
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw apiErrors.internal("Dịch vụ AI phản hồi quá lâu. Vui lòng thử lại.");
      }
      throw apiErrors.internal("Không kết nối được tới dịch vụ AI.");
    } finally {
      clearTimeout(timeout);
    }

    if (!providerResponse.ok) throw providerApiError(body.provider, providerResponse.status);

    const providerBody = await providerResponse.json() as unknown;
    const outputText = extractProviderOutputText(body.provider, providerBody);
    if (!outputText) throw apiErrors.internal("AI không trả về nội dung bản nháp.");

    const response = NextResponse.json(parseAiDraftResponse(body.kind, outputText));
    response.headers.set(REQUEST_ID_HEADER, context.requestId);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    const normalized = error instanceof ApiError
      ? error
      : apiErrors.internal("Không tạo được bản nháp AI. Vui lòng thử lại.");

    logServerError("ai_draft_request_failed", normalized, {
      operation: "ai_draft",
      requestId: context.requestId,
      route: context.route,
      status: normalized.status,
    });

    const response = apiErrorResponse(normalized);
    response.headers.set(REQUEST_ID_HEADER, context.requestId);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}
