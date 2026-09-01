import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

describe("POST /api/observability/auth-failure", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("chỉ ghi mã nguyên nhân chuẩn hóa, không ghi email hay mật khẩu", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = await POST(new NextRequest(
      "https://app.test/api/observability/auth-failure",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://app.test",
          "x-request-id": "123e4567-e89b-42d3-a456-426614174000",
        },
        body: JSON.stringify({ reason: "invalid_credentials" }),
      },
    ));

    expect(response.status).toBe(204);
    const output = spy.mock.calls[0]?.[0] as Record<string, unknown>;
    const serialized = JSON.stringify(output);
    expect(output).toMatchObject({
      alertType: "LOGIN_FAILURE",
      event: "login_failed",
      reason: "invalid_credentials",
    });
    expect(serialized).not.toContain("@");
    expect(serialized).not.toContain("password");
  });

  it("từ chối origin khác và payload có trường ngoài danh sách", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = await POST(new NextRequest(
      "https://app.test/api/observability/auth-failure",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://evil.test",
        },
        body: JSON.stringify({
          email: "teacher@example.test",
          reason: "invalid_credentials",
        }),
      },
    ));

    expect(response.status).toBe(403);
    expect(spy).not.toHaveBeenCalled();
  });
});
