"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const supabase = useMemo(() => {
    if (!isSupabaseConfigured()) {
      return null;
    }

    return createBrowserSupabaseClient();
  }, []);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout() {
    setIsSigningOut(true);

    if (supabase) {
      await supabase.auth.signOut();
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      className="button-secondary min-h-10 px-4 py-2 text-sm disabled:cursor-not-allowed"
      disabled={isSigningOut}
      onClick={handleLogout}
      type="button"
    >
      {isSigningOut ? "Đang đăng xuất..." : "Đăng xuất"}
    </button>
  );
}
