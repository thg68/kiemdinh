import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isRequestId } from "@/lib/observability/request-context";
import { GET } from "./route";

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

describe("GET /api/health", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.test";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "secret-publishable-key";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
  });

  it("trả readiness đạt và không lộ URL hoặc API key", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response('{"name":"GoTrue"}', { status: 200 }),
    );
    const requestId = "123e4567-e89b-42d3-a456-426614174000";
    const response = await GET(new NextRequest("https://app.test/api/health", {
      headers: { "x-request-id": requestId },
    }));
    const payload = await response.json() as {
      checks: Record<string, string>;
      requestId: string;
      status: string;
    };
    const responseRequestId = response.headers.get("x-request-id");
    const serialized = JSON.stringify(payload);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(isRequestId(responseRequestId)).toBe(true);
    expect(responseRequestId).not.toBe(requestId);
    expect(payload.requestId).toBe(responseRequestId);
    expect(payload).toMatchObject({
      status: "ok",
      checks: {
        application: "ok",
        database: "ok",
        storage: "ok",
        supabaseAuth: "ok",
      },
    });
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(serialized).not.toContain("project.supabase.test");
    expect(serialized).not.toContain("secret-publishable-key");
  });

  it("trả 503 khi Supabase không sẵn sàng", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));

    const response = await GET(new NextRequest("https://app.test/api/health"));
    const payload = await response.json() as {
      checks: Record<string, string>;
      status: string;
    };

    expect(response.status).toBe(503);
    expect(payload.status).toBe("degraded");
    expect(payload.checks).toMatchObject({
      database: "unavailable",
      storage: "ok",
      supabaseAuth: "ok",
    });
  });
});
