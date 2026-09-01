import { afterEach, describe, expect, it, vi } from "vitest";
import { logOperationalAlert, logServerError } from "./logger";

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

    const output = spy.mock.calls[0]?.[0] as Record<string, unknown>;
    const serialized = JSON.stringify(output);

    expect(output).toMatchObject({
      event: "report_failed",
      level: "error",
      resourceId: "year-1",
    });
    expect(serialized).not.toContain("JWT secret");
    expect(serialized).not.toContain("password");
    expect(serialized).not.toContain("sensitive stack");
    expect(serialized).not.toContain("khong-duoc-ghi");
  });

  it("chỉ ghi alert type hợp lệ và loại URL có chữ ký khỏi metadata", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const unsafeError = new Error("https://storage.test/file?token=secret");
    unsafeError.name = "Bearer_secret-token";

    logOperationalAlert(
      "STORAGE_FAILURE",
      "signed_url_failed",
      new Error("https://storage.test/file?token=secret"),
      {
        operation: "create_signed_url",
        requestId: "123e4567-e89b-42d3-a456-426614174000",
        route: "/api/minh-chung/id/signed-url?token=secret",
        signedUrl: "https://storage.test/file?token=secret",
      } as never,
    );

    logOperationalAlert("STORAGE_FAILURE", "unsafe_error_name", unsafeError);
    const unsafeSerialized = JSON.stringify(spy.mock.calls.at(-1)?.[0]);
    expect(unsafeSerialized).not.toContain("secret-token");

    const output = spy.mock.calls[0]?.[0] as Record<string, unknown>;
    const serialized = JSON.stringify(output);

    expect(output).toMatchObject({
      alertType: "STORAGE_FAILURE",
      event: "signed_url_failed",
      requestId: "123e4567-e89b-42d3-a456-426614174000",
      route: "/api/minh-chung/id/signed-url",
    });
    expect(serialized).not.toContain("storage.test");
    expect(serialized).not.toContain("token=secret");
  });
});
