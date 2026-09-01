import { classifyError } from "@/lib/errors/user-message";

export const OPERATIONAL_ALERT_TYPES = [
  "LOGIN_FAILURE",
  "REPORT_EXPORT_FAILURE",
  "STORAGE_FAILURE",
] as const;

export type OperationalAlertType = (typeof OPERATIONAL_ALERT_TYPES)[number];

export type SafeLogContext = {
  operation?: string;
  reason?: string;
  requestId?: string;
  resourceId?: string;
  route?: string;
  status?: number;
};

const SAFE_CODE_PATTERN = /^[A-Za-z0-9_.:-]{1,160}$/;
const SAFE_ERROR_TYPES = new Set([
  "AbortError",
  "AggregateError",
  "Error",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
  "TimeoutError",
  "TypeError",
]);

function safeCode(value: unknown) {
  return typeof value === "string" && SAFE_CODE_PATTERN.test(value)
    ? value
    : undefined;
}

function safeRoute(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/")) {
    return undefined;
  }

  try {
    return new URL(value, "https://internal.invalid").pathname.slice(0, 200);
  } catch {
    return undefined;
  }
}

function safeContext(context: SafeLogContext) {
  const result: SafeLogContext = {};
  const operation = safeCode(context.operation);
  const reason = safeCode(context.reason);
  const requestId = safeCode(context.requestId);
  const resourceId = safeCode(context.resourceId);
  const route = safeRoute(context.route);

  if (operation) result.operation = operation;
  if (reason) result.reason = reason;
  if (requestId) result.requestId = requestId;
  if (resourceId) result.resourceId = resourceId;
  if (route) result.route = route;
  if (
    typeof context.status === "number"
    && Number.isInteger(context.status)
    && context.status >= 100
    && context.status <= 599
  ) {
    result.status = context.status;
  }

  return result;
}

function safeEventName(event: string) {
  return safeCode(event) ?? "invalid_event";
}

function safeErrorType(error: unknown) {
  if (!(error instanceof Error)) {
    return typeof error;
  }

  return SAFE_ERROR_TYPES.has(error.name) ? error.name : "Error";
}

function errorMetadata(error: unknown) {
  return {
    category: classifyError(error),
    errorType: safeErrorType(error),
  };
}

export function logServerError(
  event: string,
  error: unknown,
  context: SafeLogContext = {},
) {
  // Chỉ ghi mã phân loại và metadata cho phép; không ghi message, stack,
  // request headers, JWT, signed URL hoặc nội dung nghiệp vụ.
  console.error({
    level: "error",
    event: safeEventName(event),
    ...errorMetadata(error),
    ...safeContext(context),
    timestamp: new Date().toISOString(),
  });
}

export function logOperationalAlert(
  alertType: OperationalAlertType,
  event: string,
  error: unknown,
  context: SafeLogContext = {},
) {
  console.error({
    level: "error",
    severity: alertType === "LOGIN_FAILURE" ? "warning" : "critical",
    alertType,
    event: safeEventName(event),
    ...errorMetadata(error),
    ...safeContext(context),
    timestamp: new Date().toISOString(),
  });
}

export function logClientException(digest?: string) {
  console.error({
    level: "error",
    event: "client_render_exception",
    digest: safeCode(digest),
    timestamp: new Date().toISOString(),
  });
}
