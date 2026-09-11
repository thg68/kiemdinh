import { describe, expect, it } from "vitest";
import {
  firstRouteForRoles,
  firstSchoolRouteForRoles,
  navigationForRoles,
} from "./navigation";

describe("navigationForRoles", () => {
  it("giáo viên chỉ thấy công việc, tiêu chuẩn và minh chứng", () => {
    expect(navigationForRoles(["TEACHER"]).map((item) => item.key)).toEqual([
      "work",
      "standards",
      "evidence",
    ]);
  });

  it("khách đi thẳng tới báo cáo đã phê duyệt", () => {
    expect(navigationForRoles(["VIEWER"])).toEqual([
      expect.objectContaining({
        key: "reports",
        href: "/bao-cao/da-phe-duyet",
      }),
    ]);
  });

  it("hiệu trưởng thấy toàn bộ khu vực của đơn vị", () => {
    const keys = navigationForRoles(["PRINCIPAL"]).map((item) => item.key);
    expect(keys).toContain("audit");
    expect(keys).toContain("settings");
    expect(keys).toContain("reports");
  });

  it("gộp quyền khi người dùng có nhiều vai trò mà không lặp menu", () => {
    const keys = navigationForRoles(["TEACHER", "SECRETARY"]).map((item) => item.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain("reports");
  });

  it("chuyển giáo viên tới việc của tôi sau khi đăng nhập", () => {
    expect(firstRouteForRoles(["TEACHER"])).toBe("/viec-cua-toi");
  });

  it("chuyển khách tới báo cáo đã phê duyệt sau khi đăng nhập", () => {
    expect(firstRouteForRoles(["VIEWER"])).toBe("/bao-cao/da-phe-duyet");
  });

  it("đưa tài khoản chưa có vai trò tới bước chọn trường", () => {
    expect(firstRouteForRoles([])).toBe("/thiet-lap");
  });

  it("đưa quản trị hệ thống vào đúng workspace sau khi đăng nhập", () => {
    expect(firstRouteForRoles(["SYSTEM_ADMIN"])).toBe("/quan-tri");
    expect(firstRouteForRoles(["SYSTEM_ADMIN", "PRINCIPAL"])).toBe("/quan-tri");
  });

  it("tìm đúng điểm vào nghiệp vụ cho tài khoản kiêm nhiệm", () => {
    expect(firstSchoolRouteForRoles(["SYSTEM_ADMIN", "PRINCIPAL"])).toBe("/dashboard");
    expect(firstSchoolRouteForRoles(["SYSTEM_ADMIN", "TEACHER"])).toBe("/viec-cua-toi");
  });
});
