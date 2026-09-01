export const REQUEST_ID_HEADER = "x-request-id";

const REQUEST_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isRequestId(value: unknown): value is string {
  return typeof value === "string" && REQUEST_ID_PATTERN.test(value);
}

export function createRequestId() {
  return crypto.randomUUID();
}

export function getRequestContext(request: Pick<Request, "headers" | "url">) {
  const incomingRequestId = request.headers.get(REQUEST_ID_HEADER);

  return {
    requestId: isRequestId(incomingRequestId)
      ? incomingRequestId
      : createRequestId(),
    route: new URL(request.url).pathname,
  };
}

export function isSameOriginRequest(
  request: Pick<Request, "headers" | "url">,
) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return false;
  }

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
