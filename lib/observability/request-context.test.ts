import { describe, expect, it } from "vitest";
import {
  getRequestContext,
  isRequestId,
  withRequestId,
} from "./request-context";

describe("request context", () => {
  it("không tin request ID hợp lệ do client gửi vào", () => {
    const requestId = "123e4567-e89b-42d3-a456-426614174000";
    const request = new Request("https://app.test/api/health?secret=hidden", {
      headers: { "x-request-id": requestId },
    });

    const context = getRequestContext(request);

    expect(context.route).toBe("/api/health");
    expect(isRequestId(context.requestId)).toBe(true);
    expect(context.requestId).not.toBe(requestId);
  });

  it("tạo UUID mới khi header không hợp lệ", () => {
    const request = new Request("https://app.test/api/health", {
      headers: { "x-request-id": "javascript:token=secret" },
    });
    const context = getRequestContext(request);

    expect(isRequestId(context.requestId)).toBe(true);
    expect(context.requestId).not.toBe("javascript:token=secret");
  });

  it("gắn request ID của server vào response", () => {
    const requestId = crypto.randomUUID();
    const response = withRequestId(new Response("ok"), requestId);

    expect(response.headers.get("x-request-id")).toBe(requestId);
  });
});
