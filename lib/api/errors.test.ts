import { describe, expect, it } from "vitest";
import { SchemaValidationError } from "./validation";
import {
  ApiError,
  apiErrorResponse,
  databaseApiError,
} from "./errors";

describe("phản hồi lỗi API chuẩn", () => {
  it("giữ status, code và thông báo ổn định", async () => {
    const response = apiErrorResponse(
      new ApiError(403, "FORBIDDEN", "Bạn không có quyền thực hiện thao tác này."),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      code: "FORBIDDEN",
      error: "Bạn không có quyền thực hiện thao tác này.",
    });
  });

  it("trả 422 cho dữ liệu không qua schema", async () => {
    const response = apiErrorResponse(
      new SchemaValidationError([
        { code: "invalid_uuid", field: "id", message: "ID không hợp lệ." },
      ]),
    );

    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({
      code: "VALIDATION_ERROR",
      details: { issues: [{ field: "id", code: "invalid_uuid" }] },
    });
  });

  it("ánh xạ lỗi PostgreSQL bằng SQLSTATE thay vì nội dung tiếng Việt", () => {
    expect(databaseApiError({ code: "23505", message: "duplicate" }, "Lỗi lưu dữ liệu"))
      .toMatchObject({ status: 409, code: "CONFLICT" });
    expect(databaseApiError({ code: "23514", message: "check" }, "Lỗi lưu dữ liệu"))
      .toMatchObject({ status: 422, code: "UNPROCESSABLE_ENTITY" });
    expect(databaseApiError({ code: "42501", message: "permission" }, "Lỗi lưu dữ liệu"))
      .toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(databaseApiError({ code: "PGRST301", message: "invalid JWT" }, "Lỗi lưu dữ liệu"))
      .toMatchObject({ status: 401, code: "UNAUTHORIZED" });
  });

  it("không suy luận quyền từ câu tiếng Việt trong lỗi không có mã", () => {
    expect(
      databaseApiError(
        { code: "P0001", message: "Bạn không có quyền thực hiện thao tác này." },
        "Không thể hoàn thành thao tác.",
      ),
    ).toMatchObject({ status: 500, code: "INTERNAL_ERROR" });
  });

  it("trả Retry-After cho lỗi rate limit", () => {
    const response = apiErrorResponse(
      new ApiError(
        429,
        "RATE_LIMITED",
        "Bạn thao tác quá nhanh. Vui lòng thử lại sau.",
        undefined,
        { "Retry-After": "37" },
      ),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("37");
  });
});
