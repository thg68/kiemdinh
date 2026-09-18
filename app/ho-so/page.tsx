import type { Metadata } from "next";
import { ApplicationShell } from "@/components/layout/application-shell";
import { ProfileSettings } from "@/components/profile/profile-settings";

export const metadata: Metadata = {
  title: "Hồ sơ của tôi | PDT Quality",
  description: "Xem và cập nhật thông tin cá nhân, đổi mật khẩu tài khoản.",
};

export default function ProfilePage() {
  return (
    <ApplicationShell
      active="profile"
      title="Hồ sơ của tôi"
      description="Cập nhật thông tin cá nhân và bảo vệ tài khoản của bạn."
    >
      <ProfileSettings />
    </ApplicationShell>
  );
}
