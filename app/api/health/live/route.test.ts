import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("GET /api/health/live", () => {
  it("chỉ kiểm tra tiến trình ứng dụng và không gọi dịch vụ phụ thuộc", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const response = await GET(new NextRequest("https://app.test/api/health/live"));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      status: "ok",
      checks: { application: "ok" },
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
