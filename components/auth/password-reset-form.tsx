"use client";

import { toUserMessage } from "@/lib/errors/user-message";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createBrowserSupabaseClient,
  getPublicAppUrl,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { Alert } from "@/components/ui/alert";

type ResetStep = "checking" | "invalid" | "request" | "update";
type MessageTone = "danger" | "info" | "success" | "warning";

function recoveryLinkHasError() {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return search.has("error") || search.has("error_code")
    || hash.has("error") || hash.has("error_code");
}

function hasAuthCallbackParameters() {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return search.has("code") || search.has("token_hash")
    || hash.has("access_token") || hash.has("refresh_token");
}

function recoveryTokenHash() {
  const search = new URLSearchParams(window.location.search);
  if (search.get("type") !== "recovery") return null;
  return search.get("token_hash");
}

type PasswordResetFormProps = {
  initialRecoveryError?: boolean;
};

export function PasswordResetForm({ initialRecoveryError = false }: PasswordResetFormProps) {
  const supabase = useMemo(() => {
    if (!isSupabaseConfigured()) {
      return null;
    }

    return createBrowserSupabaseClient();
  }, []);
  const [step, setStep] = useState<ResetStep>(() => (
    isSupabaseConfigured() ? "checking" : "request"
  ));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<MessageTone>("info");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialRecoveryError || recoveryLinkHasError()) {
      const invalidTimer = window.setTimeout(() => {
        setStep("invalid");
        setMessage("Liên kết khôi phục không hợp lệ, đã hết hạn hoặc đã được sử dụng.");
        setMessageTone("danger");
        window.history.replaceState({}, "", "/quen-mat-khau");
      }, 0);
      return () => window.clearTimeout(invalidTimer);
    }

    if (!supabase) {
      return;
    }

    const tokenHash = recoveryTokenHash();
    if (tokenHash) {
      let cancelled = false;

      void supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" })
        .then(({ data, error }) => {
          if (cancelled) return;

          window.history.replaceState({}, "", "/quen-mat-khau");
          if (error || !data.session?.user) {
            setStep("invalid");
            setMessage("Liên kết khôi phục không hợp lệ, đã hết hạn hoặc đã được sử dụng.");
            setMessageTone("danger");
            return;
          }

          setStep("update");
          setMessage("");
        });

      return () => {
        cancelled = true;
      };
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "PASSWORD_RECOVERY") return;

      if (!session?.user) {
        setStep("invalid");
        setMessage("Liên kết khôi phục không còn hiệu lực. Hãy yêu cầu một liên kết mới.");
        setMessageTone("danger");
        return;
      }

      setStep("update");
      setMessage("");
      window.history.replaceState({}, "", "/quen-mat-khau");
    });

    const initialTimer = !hasAuthCallbackParameters()
      ? window.setTimeout(() => setStep("request"), 0)
      : null;

    const fallback = window.setTimeout(() => {
      setStep((current) => current === "checking" ? "request" : current);
    }, 1_500);

    return () => {
      if (initialTimer !== null) window.clearTimeout(initialTimer);
      window.clearTimeout(fallback);
      listener.subscription.unsubscribe();
    };
  }, [initialRecoveryError, supabase]);

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setMessage("Chưa cấu hình Supabase trong .env.local.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    const redirectTo = `${getPublicAppUrl()}/quen-mat-khau`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    setIsSubmitting(false);

    if (error) {
      setMessage(toUserMessage(error));
      setMessageTone("danger");
      return;
    }

    setMessage(
      "Nếu email tồn tại trong hệ thống, Supabase sẽ gửi liên kết đặt lại mật khẩu. Hãy mở hộp thư và làm theo hướng dẫn.",
    );
    setMessageTone("success");
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setMessage("Chưa cấu hình Supabase trong .env.local.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session?.user) {
      setIsSubmitting(false);
      setStep("invalid");
      setMessage("Phiên khôi phục đã hết hạn. Hãy yêu cầu một liên kết mới.");
      setMessageTone("danger");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    setIsSubmitting(false);

    if (error) {
      setMessage(
        "Chưa thể cập nhật mật khẩu. Hãy mở đúng liên kết khôi phục mới nhất trong email rồi thử lại.",
      );
      setMessageTone("danger");
      return;
    }

    const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });

    if (signOutError) {
      setMessage("Mật khẩu đã được cập nhật nhưng chưa thể đóng phiên hiện tại. Hãy đóng trình duyệt trước khi đăng nhập lại.");
      setMessageTone("warning");
      return;
    }

    setPassword("");
    setMessage("Mật khẩu đã được cập nhật. Bạn có thể đăng nhập lại.");
    setMessageTone("success");
    setStep("request");
  }

  return (
    <div className="surface-card w-full max-w-md p-6">
      <h2 className="section-title text-2xl">
        {step === "update" ? "Đặt mật khẩu mới" : "Quên mật khẩu"}
      </h2>
      <p className="muted mt-2 text-sm leading-6">
        {step === "update"
          ? "Nhập mật khẩu mới sau khi mở liên kết khôi phục từ email."
          : "Nhập email tài khoản để nhận liên kết đặt lại mật khẩu qua Supabase Auth."}
      </p>

      {step === "checking" ? (
        <p className="muted mt-6 text-sm" role="status">Đang kiểm tra liên kết khôi phục…</p>
      ) : step === "update" ? (
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
      ) : (
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
      )}

      {message ? <Alert className="mt-4" id="password-reset-status" tone={messageTone}>{message}</Alert> : null}

      <Link
        className="mt-5 inline-flex text-sm font-semibold text-[var(--color-electric-cobalt)]"
        href="/login"
      >
        Quay lại đăng nhập
      </Link>
    </div>
  );
}
