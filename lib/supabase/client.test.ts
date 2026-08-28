import { beforeEach, describe, expect, it, vi } from "vitest";

const createClient = vi.fn(() => ({ auth: {} }));

vi.mock("@supabase/supabase-js", () => ({ createClient }));

describe("browser Supabase client", () => {
  beforeEach(() => {
    vi.resetModules();
    createClient.mockClear();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://staging.example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-staging");
  });

  it("dùng lại đúng một client trong trình duyệt", async () => {
    const { createBrowserSupabaseClient } = await import("./client");
    expect(createBrowserSupabaseClient()).toBe(createBrowserSupabaseClient());
    expect(createClient).toHaveBeenCalledTimes(1);
  });
});
