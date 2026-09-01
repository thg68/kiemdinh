import { NextRequest } from "next/server";
import { apiErrorResponse, apiErrors } from "@/lib/api/errors";
import {
  STORAGE_FAILURE_OPERATIONS,
  StorageFailureOperation,
} from "@/lib/observability/client-alerts";
import { logOperationalAlert } from "@/lib/observability/logger";
import {
  getRequestContext,
  isSameOriginRequest,
} from "@/lib/observability/request-context";

export const dynamic = "force-dynamic";

function isStorageFailureOperation(
  value: unknown,
): value is StorageFailureOperation {
  return STORAGE_FAILURE_OPERATIONS.includes(value as StorageFailureOperation);
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

  return new Response(null, { status: 204 });
}
