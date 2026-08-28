import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const publicAppUrl = process.env.NEXT_PUBLIC_APP_URL;
function buildBrowserClient(url: string, anonKey: string) {
  return createClient(url, anonKey);
}

type BrowserSupabaseClient = ReturnType<typeof buildBrowserClient>;
let browserClient: BrowserSupabaseClient | undefined;

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function createBrowserSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY trong biến môi trường.",
    );
  }

  // Trình duyệt chỉ dùng một Auth client để tránh nhiều tiến trình cùng làm mới phiên đăng nhập.
  browserClient ??= buildBrowserClient(supabaseUrl, supabaseAnonKey);
  return browserClient;
}

export function getPublicAppUrl() {
  if (publicAppUrl) {
    return publicAppUrl.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "http://localhost:3000";
}
