import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

describe("POST /api/observability/storage-failure", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("chỉ ghi mã thao tác Storage trong danh sách cho phép", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = await POST(new NextRequest(
      "https://app.test/api/observability/storage-failure",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://app.test",
          "x-request-id": "123e4567-e89b-42d3-a456-426614174000",
        },
        body: JSON.stringify({ operation: "evidence_upload" }),
      },
    ));

    expect(response.status).toBe(204);
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      alertType: "STORAGE_FAILURE",
      event: "client_storage_failed",
      operation: "evidence_upload",
    }));
  });

  it("từ chối payload có đường dẫn hoặc signed URL", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = await POST(new NextRequest(
      "https://app.test/api/observability/storage-failure",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://app.test",
        },
        body: JSON.stringify({
          operation: "evidence_upload",
          signedUrl: "https://storage.test/file?token=secret",
        }),
      },
    ));

    expect(response.status).toBe(422);
    expect(spy).not.toHaveBeenCalled();
  });
});
