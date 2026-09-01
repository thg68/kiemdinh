import { NextRequest } from "next/server";
import { logServerError } from "@/lib/observability/logger";
import {
  REQUEST_ID_HEADER,
  getRequestContext,
} from "@/lib/observability/request-context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HEALTH_TIMEOUT_MS = 2_500;

async function checkSupabaseAuth() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("supabase_health_configuration_missing");
  }

  const response = await fetch(
    new URL("/auth/v1/health", supabaseUrl),
    {
      cache: "no-store",
      headers: { apikey: supabaseKey },
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
    },
  );

  if (!response.ok) {
    throw new Error("supabase_auth_health_unavailable");
  }
}

export async function GET(request: NextRequest) {
  const requestContext = getRequestContext(request);
  let status = 200;
  let supabaseAuth: "ok" | "unavailable" = "ok";

  try {
    await checkSupabaseAuth();
  } catch (error) {
    status = 503;
    supabaseAuth = "unavailable";
    logServerError("health_check_failed", error, {
      operation: "check_supabase_auth",
      ...requestContext,
      status,
    });
  }

  return Response.json(
    {
      status: status === 200 ? "ok" : "degraded",
      requestId: requestContext.requestId,
      checks: {
        application: "ok",
        supabaseAuth,
      },
      timestamp: new Date().toISOString(),
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        [REQUEST_ID_HEADER]: requestContext.requestId,
      },
    },
  );
}
