import { NextResponse } from "next/server";
import { SchemaValidationError } from "./validation";

export type ApiErrorStatus = 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500;

export class ApiError extends Error {
  readonly code: string;
  readonly details: unknown;
  readonly headers: Record<string, string>;
  readonly status: ApiErrorStatus;

  constructor(
    status: ApiErrorStatus,
    code: string,
    message: string,
    details?: unknown,
    headers: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.headers = headers;
  }
}

type DatabaseErrorLike = {
  code?: unknown;
};

export function databaseApiError(error: unknown, fallbackMessage: string) {
  const code =
    error && typeof error === "object" && typeof (error as DatabaseErrorLike).code === "string"
      ? (error as DatabaseErrorLike).code as string
      : "";

  if (code === "23505") {
    return new ApiError(409, "CONFLICT", "Dữ liệu này đã tồn tại.");
  }

  if (["22007", "22023", "22P02", "23503", "23514"].includes(code)) {
    return new ApiError(422, "UNPROCESSABLE_ENTITY", "Dữ liệu không đáp ứng ràng buộc hệ thống.");
  }

  if (code === "42501") {
    return new ApiError(403, "FORBIDDEN", "Bạn không có quyền thực hiện thao tác này.");
  }

  if (["PGRST301", "PGRST302"].includes(code)) {
    return new ApiError(
      401,
      "UNAUTHORIZED",
      "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.",
    );
  }

  if (code === "PGRST116") {
    return new ApiError(404, "NOT_FOUND", "Không tìm thấy dữ liệu yêu cầu.");
  }

  return new ApiError(500, "INTERNAL_ERROR", fallbackMessage);
}

export function apiErrorResponse(
  error: unknown,
  fallbackMessage = "Không thể hoàn thành thao tác lúc này. Vui lòng thử lại.",
) {
  const normalized =
    error instanceof ApiError
      ? error
      : error instanceof SchemaValidationError
        ? new ApiError(
            422,
            "VALIDATION_ERROR",
            "Dữ liệu gửi lên không hợp lệ.",
            { issues: error.issues },
          )
        : new ApiError(500, "INTERNAL_ERROR", fallbackMessage);
  const body: {
    code: string;
    details?: unknown;
    error: string;
  } = {
    code: normalized.code,
    error: normalized.message,
  };

  if (normalized.details !== undefined) {
    body.details = normalized.details;
  }

  return NextResponse.json(body, {
    status: normalized.status,
    headers: normalized.headers,
  });
}

export const apiErrors = {
  badRequest: (message: string) => new ApiError(400, "BAD_REQUEST", message),
  unauthorized: (message = "Bạn cần đăng nhập để thực hiện thao tác này.") =>
    new ApiError(401, "UNAUTHORIZED", message),
  forbidden: (message = "Bạn không có quyền thực hiện thao tác này.") =>
    new ApiError(403, "FORBIDDEN", message),
  notFound: (message = "Không tìm thấy dữ liệu yêu cầu.") =>
    new ApiError(404, "NOT_FOUND", message),
  conflict: (message: string) => new ApiError(409, "CONFLICT", message),
  unprocessable: (message: string, details?: unknown) =>
    new ApiError(422, "UNPROCESSABLE_ENTITY", message, details),
  internal: (message: string) => new ApiError(500, "INTERNAL_ERROR", message),
};
