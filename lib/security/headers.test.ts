import { describe, expect, it } from "vitest";
import { buildSecurityHeaders } from "./headers";

describe("security headers", () => {
  it("cau hinh day du header bat buoc cho production", () => {
    const headers = new Map(buildSecurityHeaders(true).map((header) => [header.key, header.value]));

    expect(headers.get("Content-Security-Policy")).toContain("frame-ancestors 'none'");
    expect(headers.get("Content-Security-Policy")).toContain("https://*.supabase.co");
    expect(headers.get("Content-Security-Policy")).not.toContain("'unsafe-eval'");
    expect(headers.get("Strict-Transport-Security")).toBe("max-age=31536000; includeSubDomains");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("chi cho phep unsafe-eval trong moi truong development", () => {
    const headers = new Map(buildSecurityHeaders(false).map((header) => [header.key, header.value]));

    expect(headers.get("Content-Security-Policy")).toContain("'unsafe-eval'");
    expect(headers.get("Content-Security-Policy")).toContain("http://127.0.0.1:*");
    expect(headers.has("Strict-Transport-Security")).toBe(false);
  });

  it("khong mo dia chi Supabase local tren production", () => {
    const headers = new Map(buildSecurityHeaders(true).map((header) => [header.key, header.value]));

    expect(headers.get("Content-Security-Policy")).not.toContain("http://127.0.0.1:*");
    expect(headers.get("Content-Security-Policy")).not.toContain("http://localhost:*");
  });
});
