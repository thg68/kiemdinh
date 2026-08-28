import { afterEach, describe, expect, it, vi } from "vitest";
import { logServerError } from "./logger";

describe("logServerError", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("ghi log có cấu trúc nhưng không ghi message, stack hoặc metadata ngoài danh sách cho phép", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const error = new Error("JWT secret password học sinh");
    error.stack = "sensitive stack";

    logServerError("report_failed", error, {
      operation: "export",
      route: "/api/bao-cao",
      resourceId: "year-1",
      token: "khong-duoc-ghi",
    } as never);

    const output = String(spy.mock.calls[0]?.[0]);
    expect(output).toContain('"event":"report_failed"');
    expect(output).toContain('"resourceId":"year-1"');
    expect(output).not.toContain("JWT secret");
    expect(output).not.toContain("password");
    expect(output).not.toContain("sensitive stack");
    expect(output).not.toContain("khong-duoc-ghi");
  });
});
