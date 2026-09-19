"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createBrowserSupabaseClient,
  getPublicAppUrl,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { classifyLoginFailure } from "@/lib/observability/auth-events";
import { Alert } from "@/components/ui/alert";
import { SchoolPicker } from "@/components/auth/school-picker";
import { firstRouteForRoles } from "@/lib/auth/navigation";
import { toUserMessage } from "@/lib/errors/user-message";
import type { RegistrationSchool } from "@/lib/schools/directory";
import { EmailVerificationDialog } from "@/components/auth/email-verification-dialog";
import {
  buildEmailVerificationRedirectUrl,
  EMAIL_VERIFICATION_COOLDOWN_SECONDS,
  isEmailNotConfirmedError,
  normalizeEmail,
  readResendCooldown,
  rememberResend,
} from "@/lib/auth/email-verification";

type AuthMode = "dang_nhap" | "dang_ky";
type MessageTone = "danger" | "info" | "success" | "warning";

function authErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login") || normalized.includes("invalid credentials")) {
    return "Email hoặc mật khẩu chưa đúng. Vui lòng kiểm tra lại thông tin đăng nhập.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Tài khoản chưa xác nhận email. Hãy mở email xác nhận trước khi đăng nhập.";
  }

  if (normalized.includes("already registered") || normalized.includes("user already registered")) {
    return "Email này đã có tài khoản. Hãy chuyển sang tab Đăng nhập.";
  }

  if (normalized.includes("password")) {
    return "Mật khẩu chưa hợp lệ. Vui lòng dùng mật khẩu tối thiểu 6 ký tự.";
  }

  return "Không xử lý được yêu cầu. Vui lòng thử lại hoặc liên hệ quản trị hệ thống.";
}

async function reportLoginFailure(message: string) {
  try {
    await fetch("/api/observability/auth-failure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: classifyLoginFailure(message) }),
      keepalive: true,
    });
  } catch {
    // Quan sát vận hành không được làm gián đoạn thông báo đăng nhập cho người dùng.
  }
}

export function LoginForm() {
  const router = useRouter();
  const supabase = useMemo(() => {
    if (!isSupabaseConfigured()) {
      return null;
    }

    return createBrowserSupabaseClient();
  }, []);
  const [mode, setMode] = useState<AuthMode>("dang_nhap");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hoTen, setHoTen] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<RegistrationSchool | null>(null);
  const selectedSchoolId = selectedSchool?.id ?? "";
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<MessageTone>("info");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);

    if (search.has("xac_nhan_email")) {
      const timer = window.setTimeout(() => {
        setMessage("Email đã được xác nhận. Hãy đăng nhập để hoàn tất việc tham gia trường.");
        setMessageTone("success");
        setMode("dang_nhap");
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!verificationEmail) return;
    const updateCooldown = () => setResendCooldown(readResendCooldown(sessionStorage, verificationEmail));
    updateCooldown();
    const timer = window.setInterval(updateCooldown, 1_000);
    return () => window.clearInterval(timer);
  }, [verificationEmail]);

  const closeVerificationDialog = useCallback(() => {
    setVerificationDialogOpen(false);
    setMode("dang_nhap");
  }, []);

  async function resendVerification(targetEmail = verificationEmail || email) {
    if (!supabase) return;

    const normalizedEmail = normalizeEmail(targetEmail);
    if (!normalizedEmail) {
      setMessage("Hãy nhập email đã dùng để đăng ký.");
      setMessageTone("warning");
      return;
    }

    const currentCooldown = readResendCooldown(sessionStorage, normalizedEmail);
    if (currentCooldown > 0) {
      setResendCooldown(currentCooldown);
      return;
    }

    setIsResending(true);
    setResendMessage("");
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: normalizedEmail,
      options: { emailRedirectTo: buildEmailVerificationRedirectUrl(getPublicAppUrl()) },
    });
    setIsResending(false);

    if (error) {
      const rateLimited = error.status === 429 || error.message.toLowerCase().includes("rate");
      const errorMessage = rateLimited
        ? "Bạn đã gửi quá nhiều yêu cầu. Vui lòng chờ một lúc rồi thử lại."
        : "Chưa thể gửi lại email xác thực. Vui lòng thử lại sau.";
      setResendMessage(errorMessage);
      setMessage(errorMessage);
      setMessageTone("danger");
      return;
    }

    rememberResend(sessionStorage, normalizedEmail);
    setVerificationEmail(normalizedEmail);
    setResendCooldown(EMAIL_VERIFICATION_COOLDOWN_SECONDS);
    setResendMessage("Đã gửi lại email xác thực. Hãy kiểm tra hộp thư và thư rác.");
    setMessage("Đã gửi lại email xác thực. Hãy kiểm tra hộp thư và thư rác.");
    setMessageTone("success");
  }

  async function finishSchoolRegistration(schoolId: string) {
    if (!supabase || !schoolId) return null;

    const { error } = await supabase.rpc("fn_tu_dang_ky_vao_co_so", {
      p_co_so_id: schoolId,
    });
    return error;
  }

  async function routeAuthenticatedUser() {
    if (!supabase) return;

    const { data: roleData, error: roleError } = await supabase.rpc("fn_user_role_labels");
    const roleCodes = roleError
      ? []
      : ((roleData ?? []) as Array<{ ma: string }>).map((role) => role.ma);

    const requestedPath = new URLSearchParams(window.location.search).get("next");
    if (requestedPath?.startsWith("/") && !requestedPath.startsWith("//") && !requestedPath.includes("\\")) {
      const target = new URL(requestedPath, window.location.origin);
      if (target.origin === window.location.origin) {
        router.replace(`${target.pathname}${target.search}${target.hash}`);
        return;
      }
    }

    router.replace(firstRouteForRoles(roleCodes));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setMessage("Chưa cấu hình Supabase trong .env.local.");
      setMessageTone("warning");
      return;
    }

    if (mode === "dang_ky" && !selectedSchoolId) {
      setMessage("Hãy chọn trường đang công tác trước khi tạo tài khoản.");
      setMessageTone("warning");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    const result =
      mode === "dang_nhap"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: buildEmailVerificationRedirectUrl(getPublicAppUrl()),
              data: {
                ho_ten: hoTen.trim(),
                co_so_id: selectedSchoolId,
                ma_truong: selectedSchool?.ma_truong,
              },
            },
          });

    if (result.error) {
      setIsSubmitting(false);
      const emailNotConfirmed = mode === "dang_nhap" && isEmailNotConfirmedError(result.error);
      if (emailNotConfirmed) {
        setVerificationEmail(normalizeEmail(email));
      } else {
        setVerificationEmail("");
      }
      setMessage(emailNotConfirmed
        ? "Tài khoản chưa xác thực email. Hãy mở email xác thực hoặc yêu cầu gửi lại trước khi đăng nhập."
        : authErrorMessage(result.error.message));
      setMessageTone("danger");
      void reportLoginFailure(result.error.message);
      return;
    }

    if (mode === "dang_nhap") {
      const schoolId = result.data.user?.user_metadata?.co_so_id;
      if (typeof schoolId === "string" && schoolId) {
        const joinError = await finishSchoolRegistration(schoolId);
        if (joinError) {
          setIsSubmitting(false);
          setMessage(
            toUserMessage(
              joinError,
              "Không thể hoàn tất việc tham gia trường đã chọn. Vui lòng kiểm tra lại với quản trị hệ thống.",
            ),
          );
          setMessageTone("danger");
          return;
        }
      }

      await routeAuthenticatedUser();
      setIsSubmitting(false);
      return;
    }

    if (result.data.session) {
      const joinError = await finishSchoolRegistration(selectedSchoolId);
      if (joinError) {
        setIsSubmitting(false);
        setMessage(toUserMessage(joinError));
        setMessageTone("danger");
        return;
      }

      await routeAuthenticatedUser();
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    const registeredEmail = normalizeEmail(email);
    rememberResend(sessionStorage, registeredEmail);
    setVerificationEmail(registeredEmail);
    setResendCooldown(EMAIL_VERIFICATION_COOLDOWN_SECONDS);
    setResendMessage("");
    setVerificationDialogOpen(true);
    setMessage("");
    setMode("dang_nhap");
  }

  return (
    <div className="surface-card w-full max-w-xl p-6">
      <div>
        <h2 className="section-title text-2xl">Tài khoản</h2>
        <p className="muted mt-2 text-sm">
          Dùng email công việc để đăng nhập hoặc tạo tài khoản trong đơn vị của bạn.
        </p>
      </div>

      {mode === "dang_ky" ? (
        <Alert className="mt-4" tone="info">
          Chọn đúng trường để được tạo hồ sơ Giáo viên sau khi xác nhận email. Các vai trò nghiệp vụ khác do người có thẩm quyền của đơn vị phân công.
        </Alert>
      ) : null}

      <div className="segmented-control grid-cols-2 text-sm font-medium">
        <button
          type="button"
          aria-pressed={mode === "dang_nhap"}
          className={`segmented-option ${mode === "dang_nhap" ? "segmented-option-active" : "text-[var(--color-graphite)]"}`}
          onClick={() => {
            setMode("dang_nhap");
            setMessage("");
          }}
        >
          Đăng nhập
        </button>
        <button
          type="button"
          aria-pressed={mode === "dang_ky"}
          className={`segmented-option ${mode === "dang_ky" ? "segmented-option-active" : "text-[var(--color-graphite)]"}`}
          onClick={() => {
            setMode("dang_ky");
            setMessage("");
          }}
        >
          Tạo tài khoản
        </button>
      </div>

      <form aria-describedby={message ? "login-status" : undefined} className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {mode === "dang_ky" ? (
          <>
            <label className="block text-sm font-medium text-[var(--color-charcoal)]">
              Họ và tên
              <input
                autoComplete="name"
                className="form-control mt-2"
                value={hoTen}
                onChange={(event) => setHoTen(event.target.value)}
                required
              />
            </label>
            <SchoolPicker
              disabled={isSubmitting}
              selectedSchool={selectedSchool}
              onSelect={setSelectedSchool}
            />
          </>
        ) : null}

        <label className="block text-sm font-medium text-[var(--color-charcoal)]">
          Email
          <input
            autoComplete="email"
            className="form-control mt-2"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="block text-sm font-medium text-[var(--color-charcoal)]">
          <span className="flex items-center justify-between gap-4">
            <span>Mật khẩu</span>
            <Link
              className="text-xs font-semibold text-[var(--color-electric-cobalt)]"
              href="/quen-mat-khau"
            >
              Quên mật khẩu?
            </Link>
          </span>
          <input
            autoComplete={mode === "dang_nhap" ? "current-password" : "new-password"}
            className="form-control mt-2"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
          />
        </label>

        <button
          type="submit"
          className="button-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting || (mode === "dang_ky" && !selectedSchoolId)}
        >
          {isSubmitting
            ? "Đang xử lý…"
            : mode === "dang_nhap"
              ? "Đăng nhập"
              : "Tạo tài khoản"}
        </button>
      </form>

      {message ? (
        <Alert className="mt-4" id="login-status" tone={messageTone}>
          <span>{message}</span>
          {mode === "dang_nhap" && verificationEmail && messageTone === "danger" ? (
            <button
              className="ml-2 font-semibold underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isResending || resendCooldown > 0}
              type="button"
              onClick={() => void resendVerification()}
            >
              {isResending
                ? "Đang gửi…"
                : resendCooldown > 0
                  ? `Gửi lại sau ${resendCooldown} giây`
                  : "Gửi lại email xác thực"}
            </button>
          ) : null}
        </Alert>
      ) : null}

      <EmailVerificationDialog
        cooldown={resendCooldown}
        email={verificationEmail}
        isOpen={verificationDialogOpen}
        isSending={isResending}
        message={resendMessage}
        onContinue={closeVerificationDialog}
        onResend={() => void resendVerification()}
      />
    </div>
  );
}
