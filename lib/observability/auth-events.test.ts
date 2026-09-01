import { describe, expect, it } from "vitest";
import { classifyLoginFailure } from "./auth-events";

describe("classifyLoginFailure", () => {
  it("chỉ trả mã nguyên nhân ổn định, không trả nội dung lỗi gốc", () => {
    expect(classifyLoginFailure("Invalid login credentials for user@example.test"))
      .toBe("invalid_credentials");
    expect(classifyLoginFailure("Email not confirmed")).toBe("email_not_confirmed");
    expect(classifyLoginFailure("Too many requests: rate limit")).toBe("rate_limited");
    expect(classifyLoginFailure("Network fetch failed")).toBe("service_unavailable");
    expect(classifyLoginFailure("Unexpected password payload")).toBe("unknown");
  });
});
