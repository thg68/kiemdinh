import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const publicAppUrl = process.env.NEXT_PUBLIC_APP_URL;
const fallbackProductionAppUrl = "https://kiemdinh-app.thang-nh.workers.dev";

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function createBrowserSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY trong biến môi trường.",
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export function getPublicAppUrl() {
  if (publicAppUrl) {
    return publicAppUrl.replace(/\/$/, "");
  }

  if (typeof window !== "undefined" && !window.location.hostname.includes("localhost")) {
    return window.location.origin;
  }

  return fallbackProductionAppUrl;
}
