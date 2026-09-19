import { describe, expect, it } from "vitest";
import {
  buildEmailVerificationRedirectUrl,
  isEmailNotConfirmedError,
  normalizeEmail,
  readResendCooldown,
  remainingResendCooldown,
  rememberResend,
} from "./email-verification";

describe("email verification helpers", () => {
  it("tạo callback xác thực trên đúng domain", () => {
    expect(buildEmailVerificationRedirectUrl("https://kdclgd.io.vn/"))
      .toBe("https://kdclgd.io.vn/xac-thuc-email");
  });

  it("nhận diện lỗi email chưa xác thực bằng code hoặc message", () => {
    expect(isEmailNotConfirmedError({ code: "email_not_confirmed" })).toBe(true);
    expect(isEmailNotConfirmedError("Email not confirmed")).toBe(true);
    expect(isEmailNotConfirmedError("Invalid login credentials")).toBe(false);
  });

  it("chuẩn hóa email và tính cooldown không âm", () => {
    expect(normalizeEmail(" Teacher@Example.VN ")).toBe("teacher@example.vn");
    expect(remainingResendCooldown(10_000, 39_999)).toBe(31);
    expect(remainingResendCooldown(10_000, 80_000)).toBe(0);
  });

  it("chỉ khôi phục cooldown cho đúng email", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };

    rememberResend(storage, "Teacher@example.vn", 10_000);
    expect(readResendCooldown(storage, "teacher@example.vn", 40_000)).toBe(30);
    expect(readResendCooldown(storage, "other@example.vn", 40_000)).toBe(0);
  });
});
