"use client";

import { useRouter } from "next/navigation";
import { firstSchoolRouteForRoles } from "@/lib/auth/navigation";

type WorkspaceSwitcherProps = {
  current: "admin" | "school";
  roleCodes: string[];
};

export function canSwitchWorkspace(roleCodes: string[]) {
  const uniqueRoleCodes = new Set(roleCodes);

  return (
    uniqueRoleCodes.size >= 2 &&
    uniqueRoleCodes.has("SYSTEM_ADMIN") &&
    Array.from(uniqueRoleCodes).some((roleCode) => roleCode !== "SYSTEM_ADMIN")
  );
}

export function WorkspaceSwitcher({ current, roleCodes }: WorkspaceSwitcherProps) {
  const router = useRouter();
  const uniqueRoleCodes = Array.from(new Set(roleCodes));
  const schoolRoleCodes = uniqueRoleCodes.filter((roleCode) => roleCode !== "SYSTEM_ADMIN");

  if (!canSwitchWorkspace(uniqueRoleCodes)) {
    return null;
  }

  return (
    <label className="workspace-switcher">
      <span>Vai trò đang sử dụng</span>
      <select
        aria-label="Vai trò đang sử dụng"
        value={current}
        onChange={(event) => {
          if (event.target.value === "admin") {
            router.push("/quan-tri");
            return;
          }

          router.push(firstSchoolRouteForRoles(schoolRoleCodes));
        }}
      >
        <option value="admin">Quản trị hệ thống</option>
        <option value="school">Nghiệp vụ nhà trường</option>
      </select>
    </label>
  );
}
