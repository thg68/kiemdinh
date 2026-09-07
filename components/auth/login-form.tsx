"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createBrowserSupabaseClient,
  getPublicAppUrl,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { classifyLoginFailure } from "@/lib/observability/auth-events";
import { Alert } from "@/components/ui/alert";
import { firstRouteForRoles } from "@/lib/auth/navigation";

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
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<MessageTone>("info");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);

    if (search.has("xac_nhan_email")) {
      const timer = window.setTimeout(() => {
        setMessage("Email đã được xác nhận. Bạn có thể đăng nhập vào hệ thống thật.");
        setMessageTone("success");
        setMode("dang_nhap");
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setMessage("Chưa cấu hình Supabase trong .env.local.");
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
              emailRedirectTo: `${getPublicAppUrl()}/login?xac_nhan_email=1`,
              data: {
                ho_ten: hoTen,
              },
            },
          });

    setIsSubmitting(false);

    if (result.error) {
      setMessage(authErrorMessage(result.error.message));
      setMessageTone("danger");
      void reportLoginFailure(result.error.message);
      return;
    }

    if (mode === "dang_nhap") {
      const { data: roleData, error: roleError } = await supabase.rpc("fn_user_role_labels");
      const roleCodes = roleError
        ? []
        : ((roleData ?? []) as Array<{ ma: string }>).map((role) => role.ma);

      router.replace(firstRouteForRoles(roleCodes));
      return;
    }

    setMessage("Tài khoản đã được tạo. Hãy xác nhận email rồi đăng nhập để nhận lời mời tham gia đơn vị.");
    setMessageTone("success");
    setMode("dang_nhap");
  }

  return (
    <div className="surface-card w-full max-w-md p-6">
      <div>
        <h2 className="section-title text-2xl">Tài khoản</h2>
        <p className="muted mt-2 text-sm">
          Dùng email công việc của bạn để đăng nhập hoặc tạo tài khoản tham gia đơn vị.
        </p>
      </div>

      {mode === "dang_ky" ? (
        <Alert className="mt-4" tone="info">
          Đăng ký chỉ tạo tài khoản đăng nhập, không tự cấp vai trò. Đơn vị sẽ gửi lời mời đến email này và phân công vai trò phù hợp.
        </Alert>
      ) : null}

      <div className="segmented-control grid-cols-2 text-sm font-medium">
        <button
          type="button"
          aria-pressed={mode === "dang_nhap"}
          className={`segmented-option ${mode === "dang_nhap" ? "segmented-option-active" : "text-[var(--color-graphite)]"}`}
          onClick={() => setMode("dang_nhap")}
        >
          Đăng nhập
        </button>
        <button
          type="button"
          aria-pressed={mode === "dang_ky"}
          className={`segmented-option ${mode === "dang_ky" ? "segmented-option-active" : "text-[var(--color-graphite)]"}`}
          onClick={() => setMode("dang_ky")}
        >
          Tạo tài khoản
        </button>
      </div>

      <form aria-describedby={message ? "login-status" : undefined} className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {mode === "dang_ky" ? (
          <label className="block text-sm font-medium text-[var(--color-charcoal)]">
            Họ và tên
            <input
              className="form-control mt-2"
              value={hoTen}
              onChange={(event) => setHoTen(event.target.value)}
              required
            />
          </label>
        ) : null}

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
          className="button-primary w-full disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Đang xử lý…"
            : mode === "dang_nhap"
              ? "Đăng nhập"
              : "Tạo tài khoản"}
        </button>
      </form>

      {message ? <Alert className="mt-4" id="login-status" tone={messageTone}>{message}</Alert> : null}
    </div>
  );
}
