import { NextRequest, NextResponse } from "next/server";
import {
  REQUEST_ID_HEADER,
  createRequestId,
} from "@/lib/observability/request-context";

export default function middleware(request: NextRequest) {
  // The application creates a fresh request ID and never trusts a client value.
  const requestId = createRequestId();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set(REQUEST_ID_HEADER, requestId);

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
