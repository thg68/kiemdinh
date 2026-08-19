"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

type AuthMode = "dang_nhap" | "dang_ky";

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setMessage("Chưa cấu hình Supabase trong .env.local.");
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
              data: {
                ho_ten: hoTen,
              },
            },
          });

    setIsSubmitting(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (mode === "dang_nhap") {
      router.push("/thiet-lap");
      return;
    }

    setMessage("Tài khoản đã được tạo. Hãy đăng nhập để thiết lập đơn vị.");
    setMode("dang_nhap");
  }

  return (
    <div className="w-full max-w-md border border-[#d8d6c9] bg-white p-6">
      <div className="grid grid-cols-2 border border-[#d8d6c9] text-sm font-medium">
        <button
          type="button"
          className={`px-3 py-2 ${mode === "dang_nhap" ? "bg-[#17324d] text-white" : "bg-white text-[#17324d]"}`}
          onClick={() => setMode("dang_nhap")}
        >
          Đăng nhập
        </button>
        <button
          type="button"
          className={`px-3 py-2 ${mode === "dang_ky" ? "bg-[#17324d] text-white" : "bg-white text-[#17324d]"}`}
          onClick={() => setMode("dang_ky")}
        >
          Tạo tài khoản
        </button>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {mode === "dang_ky" ? (
          <label className="block text-sm font-medium text-[#1f2933]">
            Họ và tên
            <input
              className="mt-2 w-full border border-[#c9c6b8] px-3 py-2 outline-none focus:border-[#17324d]"
              value={hoTen}
              onChange={(event) => setHoTen(event.target.value)}
              required
            />
          </label>
        ) : null}

        <label className="block text-sm font-medium text-[#1f2933]">
          Email
          <input
            className="mt-2 w-full border border-[#c9c6b8] px-3 py-2 outline-none focus:border-[#17324d]"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="block text-sm font-medium text-[#1f2933]">
          Mật khẩu
          <input
            className="mt-2 w-full border border-[#c9c6b8] px-3 py-2 outline-none focus:border-[#17324d]"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
          />
        </label>

        <button
          type="submit"
          className="w-full bg-[#17324d] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#8da0b2]"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Đang xử lý..."
            : mode === "dang_nhap"
              ? "Đăng nhập"
              : "Tạo tài khoản"}
        </button>
      </form>

      {message ? (
        <p className="mt-4 border border-[#d8d6c9] bg-[#f7f7f2] px-3 py-2 text-sm text-[#52606d]">
          {message}
        </p>
      ) : null}
    </div>
  );
}
