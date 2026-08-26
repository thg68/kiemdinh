"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createBrowserSupabaseClient,
  getPublicAppUrl,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { Alert } from "@/components/ui/alert";

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
      return;
    }

    if (mode === "dang_nhap") {
      router.push("/thiet-lap");
      return;
    }

    setMessage("Tài khoản đã được tạo. Hãy đăng nhập để thiết lập đơn vị.");
    setMessageTone("success");
    setMode("dang_nhap");
  }

  return (
    <div className="surface-card w-full max-w-md p-6">
      <div>
        <h2 className="section-title text-2xl">Tài khoản</h2>
        <p className="muted mt-2 text-sm">
          Dùng email được cấp cho nhà trường hoặc tạo tài khoản thiết lập ban đầu.
        </p>
      </div>

      {mode === "dang_ky" ? (
        <Alert className="mt-4" tone="info">
          Đăng ký chỉ tạo tài khoản đăng nhập. Vai trò như Hiệu trưởng, Thư ký hoặc Giáo viên sẽ do tài khoản có quyền quản lý phân công sau.
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
          Tạo tài khoản đơn vị
        </button>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
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
            ? "Đang xử lý..."
            : mode === "dang_nhap"
              ? "Đăng nhập"
              : "Tạo tài khoản đơn vị"}
        </button>
      </form>

      {message ? <Alert className="mt-4" tone={messageTone}>{message}</Alert> : null}
    </div>
  );
}
