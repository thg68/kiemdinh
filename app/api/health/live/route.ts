import { NextRequest } from "next/server";
import {
  REQUEST_ID_HEADER,
  getRequestContext,
} from "@/lib/observability/request-context";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { requestId } = getRequestContext(request);

  return Response.json(
    {
      status: "ok",
      requestId,
      checks: { application: "ok" },
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
        [REQUEST_ID_HEADER]: requestId,
      },
    },
  );
}
