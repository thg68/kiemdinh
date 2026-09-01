import { describe, expect, it } from "vitest";
import { getRequestContext, isRequestId } from "./request-context";

describe("request context", () => {
  it("dùng request ID hợp lệ do proxy chuyển vào", () => {
    const requestId = "123e4567-e89b-42d3-a456-426614174000";
    const request = new Request("https://app.test/api/health?secret=hidden", {
      headers: { "x-request-id": requestId },
    });

    expect(getRequestContext(request)).toEqual({
      requestId,
      route: "/api/health",
    });
  });

  it("tạo UUID mới khi header bị thiếu hoặc không hợp lệ", () => {
    const request = new Request("https://app.test/api/health", {
      headers: { "x-request-id": "javascript:token=secret" },
    });
    const context = getRequestContext(request);

    expect(isRequestId(context.requestId)).toBe(true);
    expect(context.requestId).not.toBe("javascript:token=secret");
  });
});
