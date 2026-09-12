import "server-only";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { COOKIE_NAME, sesionValida } from "@/lib/sesion";

export function clienteServidor() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Falta configurar el acceso seguro a los datos en el servidor.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

// Every query checks the session, including calls made outside Proxy.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input, init) => {
      if (!sesionValida((await cookies()).get(COOKIE_NAME)?.value, process.env.ROOMFLOW_ACCESS_PASSWORD)) {
        return Response.json({ message: "No autorizado" }, { status: 401 });
      }
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!key) return Response.json({ message: "Falta configurar el acceso seguro a los datos." }, { status: 503 });
      const headers = new Headers(init?.headers);
      headers.set("apikey", key);
      headers.set("authorization", `Bearer ${key}`);
      return fetch(input, { ...init, headers, cache: "no-store", redirect: "error" });
    } },
  },
);
