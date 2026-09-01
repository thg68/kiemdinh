import { NextRequest } from "next/server";
import { apiErrorResponse, apiErrors } from "@/lib/api/errors";
import {
  LOGIN_FAILURE_REASONS,
  LoginFailureReason,
} from "@/lib/observability/auth-events";
import { logOperationalAlert } from "@/lib/observability/logger";
import {
  getRequestContext,
  isSameOriginRequest,
} from "@/lib/observability/request-context";

export const dynamic = "force-dynamic";

function isLoginFailureReason(value: unknown): value is LoginFailureReason {
  return LOGIN_FAILURE_REASONS.includes(value as LoginFailureReason);
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return apiErrorResponse(apiErrors.forbidden());
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiErrorResponse(apiErrors.badRequest("Nội dung JSON không hợp lệ."));
  }

  if (
    !body
    || typeof body !== "object"
    || Array.isArray(body)
    || Object.keys(body).length !== 1
    || !isLoginFailureReason((body as { reason?: unknown }).reason)
  ) {
    return apiErrorResponse(
      apiErrors.unprocessable("Mã nguyên nhân đăng nhập không hợp lệ."),
    );
  }

  const reason = (body as { reason: LoginFailureReason }).reason;
  const requestContext = getRequestContext(request);
  logOperationalAlert(
    "LOGIN_FAILURE",
    "login_failed",
    undefined,
    {
      operation: "authenticate_user",
      reason,
      ...requestContext,
      status: 401,
    },
  );

  return new Response(null, { status: 204 });
}
