import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ApiError, apiErrorResponse, apiErrors } from "@/lib/api/errors";
import {
  STORAGE_FAILURE_OPERATIONS,
  StorageFailureOperation,
} from "@/lib/observability/client-alerts";
import { logOperationalAlert } from "@/lib/observability/logger";
import { isOperationalAlertAllowed } from "@/lib/observability/edge-rate-limit";
import {
  REQUEST_ID_HEADER,
  getRequestContext,
  isSameOriginRequest,
} from "@/lib/observability/request-context";

export const dynamic = "force-dynamic";

function isStorageFailureOperation(
  value: unknown,
): value is StorageFailureOperation {
  return STORAGE_FAILURE_OPERATIONS.includes(value as StorageFailureOperation);
}

function createRequestClient(authorization: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw apiErrors.internal("Hệ thống giám sát chưa được cấu hình.");
  }

  return createClient(url, key, {
    global: { headers: { Authorization: authorization } },
  });
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return apiErrorResponse(apiErrors.forbidden());
  }

  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return apiErrorResponse(apiErrors.unauthorized());
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
    || !isStorageFailureOperation(
      (body as { operation?: unknown }).operation,
    )
  ) {
    return apiErrorResponse(
      apiErrors.unprocessable("Mã thao tác Storage không hợp lệ."),
    );
  }

  const operation = (body as { operation: StorageFailureOperation }).operation;
  const requestContext = getRequestContext(request);
  let authResult;

  try {
    authResult = await createRequestClient(authorization).auth.getUser();
  } catch {
    return apiErrorResponse(
      apiErrors.internal("Hệ thống giám sát chưa được cấu hình."),
    );
  }

  const { data, error } = authResult;

  if (error || !data.user) {
    return apiErrorResponse(apiErrors.unauthorized());
  }

  const isAllowed = await isOperationalAlertAllowed(
    `storage-failure:${data.user.id}`,
  );

  if (!isAllowed) {
    return apiErrorResponse(
      new ApiError(
        429,
        "RATE_LIMITED",
        "Bạn thao tác quá nhanh. Vui lòng thử lại sau.",
        undefined,
        {
          "Retry-After": "60",
          [REQUEST_ID_HEADER]: requestContext.requestId,
        },
      ),
    );
  }

  logOperationalAlert(
    "STORAGE_FAILURE",
    "client_storage_failed",
    undefined,
    {
      operation,
      ...requestContext,
      status: 500,
    },
  );

  return new Response(null, {
    status: 204,
    headers: { [REQUEST_ID_HEADER]: requestContext.requestId },
  });
}
