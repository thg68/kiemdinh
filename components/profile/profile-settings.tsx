"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { toUserMessage } from "@/lib/errors/user-message";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

type Profile = {
  nguoi_dung_id: string;
  ho_ten: string;
  email: string | null;
  dien_thoai: string | null;
  ngay_sinh: string | null;
};

type Status = { tone: "danger" | "success" | "warning"; text: string } | null;

const getLocalToday = () => {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

export function ProfileSettings() {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const supabase = useMemo(
    () => (configured ? createBrowserSupabaseClient() : null),
    [configured],
  );
  const [isLoading, setIsLoading] = useState(configured);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileId, setProfileId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const todayDate = getLocalToday();
  const [profileStatus, setProfileStatus] = useState<Status>(null);
  const [passwordStatus, setPasswordStatus] = useState<Status>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let isActive = true;

    async function loadProfile() {
      const { data: authData, error: authError } = await client.auth.getUser();
      if (!isActive) return;

      if (authError || !authData.user) {
        router.replace("/login?next=%2Fho-so");
        return;
      }

      const { data, error } = await client.rpc("fn_ho_so_cua_toi");
      if (!isActive) return;

      if (error) {
        setProfileStatus({
          tone: "danger",
          text: toUserMessage(error, "Không tải được hồ sơ. Vui lòng tải lại trang."),
        });
      } else {
        const profile = (data as Profile[] | null)?.[0];
        if (!profile) {
          setProfileStatus({
            tone: "warning",
            text: "Tài khoản chưa tham gia cơ sở giáo dục hoặc hồ sơ chưa hoạt động. Bạn vẫn có thể đổi mật khẩu tại đây.",
          });
        } else {
          setProfileId(profile.nguoi_dung_id);
          setName(profile.ho_ten);
          setEmail(authData.user.email ?? profile.email ?? "");
          setPhone(profile.dien_thoai ?? "");
          setBirthDate(profile.ngay_sinh ?? "");
        }
      }
      setIsLoading(false);
    }

    void loadProfile();
    return () => {
      isActive = false;
    };
  }, [router, supabase]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !profileId || isSaving) return;

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (trimmedName.length < 2 || trimmedName.length > 255) {
      setProfileStatus({ tone: "danger", text: "Họ tên cần có từ 2 đến 255 ký tự." });
      return;
    }
    if (trimmedPhone.length > 30) {
      setProfileStatus({ tone: "danger", text: "Số điện thoại không được quá 30 ký tự." });
      return;
    }
    if (birthDate && (birthDate < "1900-01-01" || birthDate > getLocalToday())) {
      setProfileStatus({ tone: "danger", text: "Ngày sinh không hợp lệ." });
      return;
    }

    setIsSaving(true);
    setProfileStatus(null);
    const { error } = await supabase.rpc("fn_cap_nhat_ho_so_cua_toi", {
      p_ho_ten: trimmedName,
      p_dien_thoai: trimmedPhone || null,
      p_ngay_sinh: birthDate || null,
    });
    setIsSaving(false);

    if (error) {
      setProfileStatus({
        tone: "danger",
        text: toUserMessage(error, "Không thể lưu hồ sơ. Vui lòng thử lại."),
      });
      return;
    }

    setName(trimmedName);
    setPhone(trimmedPhone);
    setProfileStatus({ tone: "success", text: "Đã cập nhật hồ sơ của bạn." });
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || isChangingPassword) return;

    if (newPassword.length < 8) {
      setPasswordStatus({ tone: "danger", text: "Mật khẩu mới cần ít nhất 8 ký tự." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ tone: "danger", text: "Mật khẩu xác nhận chưa khớp." });
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordStatus({ tone: "danger", text: "Mật khẩu mới cần khác mật khẩu hiện tại." });
      return;
    }

    setIsChangingPassword(true);
    setPasswordStatus(null);

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setIsChangingPassword(false);
      setPasswordStatus({
        tone: "danger",
        text: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại rồi thử tiếp.",
      });
      return;
    }
    if (!authData.user.email) {
      setIsChangingPassword(false);
      setPasswordStatus({
        tone: "danger",
        text: "Tài khoản chưa có email đăng nhập để xác nhận mật khẩu hiện tại.",
      });
      return;
    }

    const { error: verificationError } = await supabase.auth.signInWithPassword({
      email: authData.user.email,
      password: currentPassword,
    });
    if (verificationError) {
      setIsChangingPassword(false);
      setPasswordStatus({
        tone: "danger",
        text: /invalid login credentials/i.test(verificationError.message)
          ? "Mật khẩu hiện tại không đúng. Vui lòng kiểm tra lại."
          : toUserMessage(verificationError, "Chưa thể xác nhận mật khẩu hiện tại. Vui lòng thử lại."),
      });
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setIsChangingPassword(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    if (updateError) {
      setPasswordStatus({
        tone: "danger",
        text: toUserMessage(updateError, "Chưa thể đổi mật khẩu. Vui lòng thử lại hoặc dùng chức năng quên mật khẩu."),
      });
      return;
    }

    setPasswordStatus({ tone: "success", text: "Đã đổi mật khẩu. Hãy dùng mật khẩu mới cho lần đăng nhập sau." });
  }

  if (!configured) {
    return <Alert tone="warning">Chưa cấu hình kết nối hệ thống.</Alert>;
  }

  if (isLoading) {
    return <LoadingState label="Đang tải hồ sơ của bạn…" />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="surface-card p-6" aria-labelledby="profile-details-heading">
        <h2 className="section-title text-2xl" id="profile-details-heading">Thông tin cá nhân</h2>
        <p className="muted mt-2 text-sm leading-6">
          Họ tên và số điện thoại có thể hiển thị cho người cùng cơ sở khi phối hợp công việc.
          Ngày sinh chỉ bạn được xem và sửa.
        </p>

        {profileId ? (
          <form className="mt-6 space-y-4" onSubmit={saveProfile}>
            <label className="block text-sm font-medium text-[var(--color-charcoal)]">
              Họ và tên
              <input
                autoComplete="name"
                className="form-control mt-2"
                maxLength={255}
                minLength={2}
                onChange={(event) => setName(event.target.value)}
                required
                type="text"
                value={name}
              />
            </label>
            <div className="block text-sm font-medium text-[var(--color-charcoal)]">
              Email đăng nhập
              <p className="form-control mt-2 select-text text-[var(--color-graphite)]" aria-label="Email đăng nhập">
                {email || "Chưa có email"}
              </p>
            </div>
            <label className="block text-sm font-medium text-[var(--color-charcoal)]">
              Số điện thoại
              <input
                autoComplete="tel"
                className="form-control mt-2"
                maxLength={30}
                onChange={(event) => setPhone(event.target.value)}
                type="tel"
                value={phone}
              />
            </label>
            <label className="block text-sm font-medium text-[var(--color-charcoal)]">
              Ngày sinh
              <input
                autoComplete="bday"
                className="form-control mt-2"
                max={todayDate || undefined}
                min="1900-01-01"
                onChange={(event) => setBirthDate(event.target.value)}
                type="date"
                value={birthDate}
              />
            </label>
            <Button isLoading={isSaving} type="submit">
              {isSaving ? "Đang lưu…" : "Lưu thông tin"}
            </Button>
          </form>
        ) : null}
        {profileStatus ? <Alert className="mt-4" tone={profileStatus.tone}>{profileStatus.text}</Alert> : null}
        {!profileId ? (
          <Link className="mt-4 inline-flex text-sm font-semibold text-[var(--color-electric-cobalt)]" href="/thiet-lap">
            Xem đăng ký vào cơ sở giáo dục
          </Link>
        ) : null}
      </section>

      <section className="surface-card p-6" aria-labelledby="profile-password-heading">
        <h2 className="section-title text-2xl" id="profile-password-heading">Đổi mật khẩu</h2>
        <p className="muted mt-2 text-sm leading-6">
          Xác nhận mật khẩu hiện tại trước khi đặt mật khẩu mới.
        </p>
        <form className="mt-6 space-y-4" onSubmit={changePassword}>
          <label className="block text-sm font-medium text-[var(--color-charcoal)]">
            Mật khẩu hiện tại
            <input
              autoComplete="current-password"
              className="form-control mt-2"
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
              type="password"
              value={currentPassword}
            />
          </label>
          <label className="block text-sm font-medium text-[var(--color-charcoal)]">
            Mật khẩu mới
            <input
              autoComplete="new-password"
              className="form-control mt-2"
              minLength={8}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              type="password"
              value={newPassword}
            />
          </label>
          <label className="block text-sm font-medium text-[var(--color-charcoal)]">
            Xác nhận mật khẩu mới
            <input
              autoComplete="new-password"
              className="form-control mt-2"
              minLength={8}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              type="password"
              value={confirmPassword}
            />
          </label>
          <Button isLoading={isChangingPassword} type="submit">
            {isChangingPassword ? "Đang đổi…" : "Đổi mật khẩu"}
          </Button>
        </form>
        {passwordStatus ? <Alert className="mt-4" tone={passwordStatus.tone}>{passwordStatus.text}</Alert> : null}
        <Link className="mt-5 inline-flex text-sm font-semibold text-[var(--color-electric-cobalt)]" href="/quen-mat-khau">
          Quên mật khẩu hiện tại?
        </Link>
      </section>
    </div>
  );
}
