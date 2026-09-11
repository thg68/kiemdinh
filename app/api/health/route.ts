import { NextRequest } from "next/server";
import { logServerError } from "@/lib/observability/logger";
import {
  REQUEST_ID_HEADER,
  getRequestContext,
} from "@/lib/observability/request-context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HEALTH_TIMEOUT_MS = 2_500;

type ReadinessCheck = "database" | "storage" | "supabaseAuth";

type CheckStatus = "ok" | "unavailable";

function supabaseConfiguration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("supabase_health_configuration_missing");
  }

  return { supabaseKey, supabaseUrl };
}

async function probe(path: string) {
  const { supabaseKey, supabaseUrl } = supabaseConfiguration();

  const response = await fetch(
    new URL(path, supabaseUrl),
    {
      cache: "no-store",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
    },
  );

  if (!response.ok) {
    throw new Error("supabase_component_unavailable");
  }
}

const READINESS_PROBES: Record<ReadinessCheck, string> = {
  supabaseAuth: "/auth/v1/health",
  database: "/rest/v1/rpc/fn_health_database",
  storage: "/storage/v1/status",
};

export async function GET(request: NextRequest) {
  const requestContext = getRequestContext(request);
  const entries = Object.entries(READINESS_PROBES) as Array<
    [ReadinessCheck, string]
  >;
  const results = await Promise.allSettled(
    entries.map(([, path]) => probe(path)),
  );
  const checks = entries.reduce<Record<ReadinessCheck, CheckStatus>>(
    (accumulator, [name], index) => {
      const result = results[index];
      accumulator[name] = result.status === "fulfilled" ? "ok" : "unavailable";

      if (result.status === "rejected") {
        logServerError("readiness_check_failed", result.reason, {
          operation: `check_${name}`,
          ...requestContext,
          status: 503,
        });
      }

      return accumulator;
    },
    { database: "ok", storage: "ok", supabaseAuth: "ok" },
  );
  const status = Object.values(checks).every((value) => value === "ok")
    ? 200
    : 503;

  return Response.json(
    {
      status: status === 200 ? "ok" : "degraded",
      requestId: requestContext.requestId,
      checks: {
        application: "ok",
        ...checks,
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
