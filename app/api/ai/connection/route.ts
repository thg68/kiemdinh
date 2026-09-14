import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, apiErrors, ApiError } from "@/lib/api/errors";
import { enforceRateLimit, type RateLimitClient } from "@/lib/api/rate-limit";
import {
  buildProviderConnectionRequest,
  extractProviderOutputText,
  providerApiError,
} from "@/lib/ai/provider-server";
import { parseAiConnectionRequest } from "@/lib/ai/server";
import { createRequestSupabaseClient } from "@/lib/reports/data";
import {
  getRequestContext,
  isSameOriginRequest,
  REQUEST_ID_HEADER,
} from "@/lib/observability/request-context";
import { logServerError } from "@/lib/observability/logger";

const MAX_BODY_BYTES = 8 * 1024;
const CONNECTION_TIMEOUT_MS = 20_000;

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
      throw apiErrors.unprocessable("Dữ liệu kiểm tra kết nối quá lớn.");
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      throw apiErrors.badRequest("Nội dung JSON gửi lên không hợp lệ.");
    }
    if (JSON.stringify(rawBody).length > MAX_BODY_BYTES) {
      throw apiErrors.unprocessable("Dữ liệu kiểm tra kết nối quá lớn.");
    }

    const body = parseAiConnectionRequest(rawBody);
    const supabase = createRequestSupabaseClient(authorization);
    await enforceRateLimit(supabase as unknown as RateLimitClient, "ai_generate");

    const providerRequest = buildProviderConnectionRequest(body, apiKey);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT_MS);
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

    if (!providerResponse.ok) {
      throw providerApiError(body.provider, providerResponse.status);
    }

    let providerBody: unknown;
    try {
      providerBody = await providerResponse.json();
    } catch {
      throw apiErrors.internal("Dịch vụ AI trả về phản hồi không hợp lệ.");
    }

    if (!extractProviderOutputText(body.provider, providerBody).trim()) {
      throw apiErrors.internal("Dịch vụ AI không trả về nội dung kiểm tra.");
    }

    const response = NextResponse.json({ ok: true, ...body });
    response.headers.set(REQUEST_ID_HEADER, context.requestId);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    const normalized = error instanceof ApiError
      ? error
      : apiErrors.internal("Không kiểm tra được kết nối AI. Vui lòng thử lại.");

    logServerError("ai_connection_test_failed", normalized, {
      operation: "ai_connection_test",
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
