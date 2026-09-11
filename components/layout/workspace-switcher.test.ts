import { describe, expect, it } from "vitest";
import { canSwitchWorkspace } from "./workspace-switcher";

describe("canSwitchWorkspace", () => {
  it("cho phép tài khoản có vai trò quản trị và vai trò nhà trường chuyển workspace", () => {
    expect(canSwitchWorkspace(["SYSTEM_ADMIN", "PRINCIPAL"])).toBe(true);
  });

  it("ẩn bộ chuyển với tài khoản chỉ có vai trò quản trị", () => {
    expect(canSwitchWorkspace(["SYSTEM_ADMIN"])).toBe(false);
  });

  it("ẩn bộ chuyển với tài khoản không có vai trò quản trị", () => {
    expect(canSwitchWorkspace(["PRINCIPAL", "TEACHER"])).toBe(false);
  });

  it("không tính vai trò bị lặp thành hai vai trò", () => {
    expect(canSwitchWorkspace(["SYSTEM_ADMIN", "SYSTEM_ADMIN"])).toBe(false);
  });
});
