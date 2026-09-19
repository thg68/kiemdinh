"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

type ConfirmationState = "checking" | "ready" | "working" | "invalid" | "confirmed";

function readConfirmationRequest() {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return {
    hasError: search.has("error") || search.has("error_code") || hash.has("error") || hash.has("error_code"),
    hasSession: hash.has("access_token") || hash.has("refresh_token"),
    tokenHash: search.get("type") === "email" ? search.get("token_hash") : null,
  };
}

export function EmailConfirmation() {
  const router = useRouter();
  const supabase = useMemo(() => isSupabaseConfigured() ? createBrowserSupabaseClient() : null, []);
  const [state, setState] = useState<ConfirmationState>("checking");
  const [message, setMessage] = useState("");
  const [tokenHash, setTokenHash] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setState("invalid");
      setMessage("Hệ thống xác thực chưa được cấu hình.");
      return;
    }

    const request = readConfirmationRequest();
    if (request.hasError) {
      setState("invalid");
      setMessage("Liên kết xác thực không hợp lệ, đã hết hạn hoặc đã được sử dụng.");
      window.history.replaceState({}, "", "/xac-thuc-email");
      return;
    }

    setTokenHash(request.tokenHash);
    if (request.tokenHash) {
      setState("ready");
    }
    if (!request.tokenHash && !request.hasSession) {
      setState("invalid");
      setMessage("Không tìm thấy mã xác thực trong liên kết này.");
      return;
    }

    if (request.hasSession) {
      setState("ready");
      setMessage("Email đã được xác thực. Bấm tiếp tục để đóng phiên xác thực và đến trang đăng nhập.");
    }
  }, [supabase]);

  async function confirmEmail() {
    if (!supabase) return;
    setState("working");
    setMessage("");

    if (tokenHash) {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
      if (error) {
        setState("invalid");
        setMessage("Liên kết xác thực không hợp lệ, đã hết hạn hoặc đã được sử dụng.");
        window.history.replaceState({}, "", "/xac-thuc-email");
        return;
      }
    }

    await supabase.auth.signOut({ scope: "local" });
    window.history.replaceState({}, "", "/xac-thuc-email");
    setState("confirmed");
    setMessage("Email đã được xác thực. Đang chuyển đến trang đăng nhập…");
    router.replace("/login?xac_nhan_email=1");
  }

  return (
    <div className="surface-card w-full max-w-md p-6">
      <h2 className="section-title text-2xl">Xác thực tài khoản</h2>
      <p className="muted mt-3 text-sm leading-6">
        Bấm nút bên dưới để hoàn tất xác thực. Mã chỉ được sử dụng khi bạn chủ động xác nhận trên trang này.
      </p>

      {message ? (
        <Alert className="mt-5" tone={state === "invalid" ? "danger" : "success"}>{message}</Alert>
      ) : null}

      {state === "checking" ? (
        <p className="muted mt-5 text-sm" role="status">Đang kiểm tra liên kết xác thực…</p>
      ) : null}

      <div className="mt-6 grid gap-3">
        {state === "ready" || state === "working" ? (
          <button
            aria-busy={state === "working" || undefined}
            className="button-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            disabled={state === "working"}
            type="button"
            onClick={confirmEmail}
          >
            {state === "working" ? "Đang xác thực…" : "Xác thực tài khoản"}
          </button>
        ) : null}
        <Link className="button-secondary w-full justify-center" href="/login">
          {state === "invalid" ? "Đến đăng nhập để gửi lại email" : "Đến trang đăng nhập"}
        </Link>
      </div>
    </div>
  );
}
