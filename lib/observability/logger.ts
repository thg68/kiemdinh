import { classifyError } from "@/lib/errors/user-message";

type SafeLogContext = {
  operation?: string;
  requestId?: string;
  resourceId?: string;
  route?: string;
  status?: number;
};

function safeContext(context: SafeLogContext) {
  const allowedKeys: (keyof SafeLogContext)[] = [
    "operation",
    "requestId",
    "resourceId",
    "route",
    "status",
  ];

  return Object.fromEntries(
    allowedKeys
      .map((key) => [key, context[key]] as const)
      .filter(([, value]) => typeof value === "number" || typeof value === "string")
      .map(([key, value]) => [key, typeof value === "string" ? value.slice(0, 160) : value]),
  );
}

export function logServerError(event: string, error: unknown, context: SafeLogContext = {}) {
  // Không ghi message/stack/request headers để tránh JWT, secret và dữ liệu cá nhân lọt vào Workers Logs.
  console.error(JSON.stringify({
    level: "error",
    event,
    category: classifyError(error),
    errorType: error instanceof Error ? error.name : typeof error,
    ...safeContext(context),
    timestamp: new Date().toISOString(),
  }));
}

export function logClientException(digest?: string) {
  console.error(JSON.stringify({
    level: "error",
    event: "client_render_exception",
    digest: digest?.slice(0, 120),
    timestamp: new Date().toISOString(),
  }));
}
