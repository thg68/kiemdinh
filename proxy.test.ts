import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "./proxy";
import { isRequestId } from "./lib/observability/request-context";

describe("API request ID proxy", () => {
  it("tạo request ID mới và không tin header do client tự gửi", () => {
    const request = new NextRequest("https://app.test/api/health", {
      headers: { "x-request-id": "attacker-controlled-id" },
    });

    const response = proxy(request);
    const requestId = response.headers.get("x-request-id");

    expect(requestId).not.toBe("attacker-controlled-id");
    expect(isRequestId(requestId)).toBe(true);
  });
});
