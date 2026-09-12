import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input, init) => {
      const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
      return fetch(`/api/datos${url.pathname}${url.search}`, { ...init, credentials: "same-origin", cache: "no-store" });
    } },
    db: {
      schema: "public",
    },
  }
);
