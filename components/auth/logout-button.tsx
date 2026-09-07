"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { Alert } from "@/components/ui/alert";

export function LogoutButton() {
  const router = useRouter();
  const supabase = useMemo(() => {
    if (!isSupabaseConfigured()) {
      return null;
    }

    return createBrowserSupabaseClient();
  }, []);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogout() {
    setIsSigningOut(true);
    setMessage("");

    if (supabase) {
      const { error } = await supabase.auth.signOut({ scope: "local" });

      if (error) {
        setIsSigningOut(false);
        setMessage("Chưa thể đăng xuất an toàn. Vui lòng kiểm tra kết nối và thử lại.");
        return;
      }
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="grid gap-3">
      <button
        aria-describedby={message ? "logout-error" : undefined}
        className="button-secondary min-h-10 px-4 py-2 text-sm disabled:cursor-not-allowed"
        disabled={isSigningOut}
        onClick={handleLogout}
        type="button"
      >
        {isSigningOut ? "Đang đăng xuất…" : "Đăng xuất"}
      </button>
      {message ? <Alert id="logout-error" tone="danger">{message}</Alert> : null}
    </div>
  );
}
