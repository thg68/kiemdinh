"use client";

import { toUserMessage } from "@/lib/errors/user-message";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import {
  createBrowserSupabaseClient,
  getPublicAppUrl,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { Alert } from "@/components/ui/alert";

type ResetStep = "request" | "update";

export function PasswordResetForm() {
  const supabase = useMemo(() => {
    if (!isSupabaseConfigured()) {
      return null;
    }

    return createBrowserSupabaseClient();
  }, []);
  const [step] = useState<ResetStep>(() => {
    if (typeof window === "undefined") {
      return "request";
    }

    const search = new URLSearchParams(window.location.search);
    const hasRecoveryToken =
      window.location.hash.includes("access_token") ||
      window.location.hash.includes("refresh_token") ||
      search.has("code") ||
      search.has("dat-lai");

    return hasRecoveryToken ? "update" : "request";
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setMessage("Chưa cấu hình Supabase trong .env.local.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    const redirectTo = `${getPublicAppUrl()}/quen-mat-khau?dat-lai=1`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    setIsSubmitting(false);

    if (error) {
      setMessage(toUserMessage(error));
      return;
    }

    setMessage(
      "Nếu email tồn tại trong hệ thống, Supabase sẽ gửi liên kết đặt lại mật khẩu. Hãy mở hộp thư và làm theo hướng dẫn.",
    );
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setMessage("Chưa cấu hình Supabase trong .env.local.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({ password });

    setIsSubmitting(false);

    if (error) {
      setMessage(
        "Chưa thể cập nhật mật khẩu. Hãy mở đúng liên kết khôi phục mới nhất trong email rồi thử lại.",
      );
      return;
    }

    setPassword("");
    setMessage("Mật khẩu đã được cập nhật. Bạn có thể đăng nhập lại.");
  }

  return (
    <div className="surface-card w-full max-w-md p-6">
      <h2 className="section-title text-2xl">
        {step === "request" ? "Quên mật khẩu" : "Đặt mật khẩu mới"}
      </h2>
      <p className="muted mt-2 text-sm leading-6">
        {step === "request"
          ? "Nhập email tài khoản để nhận liên kết đặt lại mật khẩu qua Supabase Auth."
          : "Nhập mật khẩu mới sau khi mở liên kết khôi phục từ email."}
      </p>

      {step === "request" ? (
        <form aria-describedby={message ? "password-reset-status" : undefined} className="mt-6 space-y-4" onSubmit={requestReset}>
          <label className="block text-sm font-medium text-[var(--color-charcoal)]">
            Email
            <input
              className="form-control mt-2"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <button
            className="button-primary w-full disabled:cursor-not-allowed"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Đang gửi…" : "Gửi liên kết đặt lại"}
          </button>
        </form>
      ) : (
        <form aria-describedby={message ? "password-reset-status" : undefined} className="mt-6 space-y-4" onSubmit={updatePassword}>
          <label className="block text-sm font-medium text-[var(--color-charcoal)]">
            Mật khẩu mới
            <input
              className="form-control mt-2"
              minLength={6}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <button
            className="button-primary w-full disabled:cursor-not-allowed"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Đang cập nhật…" : "Cập nhật mật khẩu"}
          </button>
        </form>
      )}

      {message ? <Alert className="mt-4" id="password-reset-status" tone={message.includes("đã") || message.includes("Đã") ? "success" : "warning"}>{message}</Alert> : null}

      <Link
        className="mt-5 inline-flex text-sm font-semibold text-[var(--color-electric-cobalt)]"
        href="/login"
      >
        Quay lại đăng nhập
      </Link>
    </div>
  );
}
