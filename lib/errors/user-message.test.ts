import { describe, expect, it } from "vitest";
import { classifyError, toUserMessage } from "./user-message";

describe("toUserMessage", () => {
  it("không làm lộ lỗi PostgreSQL chưa biết", () => {
    const message = toUserMessage({ code: "XX000", message: "SQLSTATE stack trace secret" });
    expect(message).not.toContain("SQLSTATE");
    expect(message).not.toContain("secret");
    expect(classifyError({ code: "XX000" })).toBe("unexpected");
  });

  it("hướng dẫn đăng nhập lại khi JWT hết hạn", () => {
    expect(toUserMessage({ message: "JWT expired", status: 401 })).toContain("đăng nhập lại");
  });

  it("giải thích lỗi phân quyền bằng tiếng Việt", () => {
    expect(toUserMessage({ code: "42501", message: "permission denied" })).toContain("không có quyền");
  });

  it("cho phép màn hình cung cấp lời nhắn dự phòng theo ngữ cảnh", () => {
    expect(toUserMessage(new Error("internal"), "Không tải được danh sách minh chứng. Vui lòng thử lại."))
      .toBe("Không tải được danh sách minh chứng. Vui lòng thử lại.");
  });
});
