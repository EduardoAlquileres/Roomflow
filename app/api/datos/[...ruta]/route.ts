import { NextRequest } from "next/server";
import { COOKIE_NAME, origenValido, sesionValida } from "@/lib/sesion";

export const dynamic = "force-dynamic";
const tablas = new Set(["viviendas", "habitaciones", "inquilinos", "estancias", "cobros", "movimientos_cobro", "fianzas", "fianza_cuotas", "gastos", "propietarios", "vivienda_propietarios", "inquilino_documentos", "clausulas_contrato", "mensajes_redes"]);
const funciones = new Set(["roomflow_eliminar_cobro", "roomflow_eliminar_fianza_erronea"]);

async function atender(request: NextRequest, context: { params: Promise<{ ruta: string[] }> }) {
  if (!sesionValida(request.cookies.get(COOKIE_NAME)?.value, process.env.ROOMFLOW_ACCESS_PASSWORD)) {
    return Response.json({ message: "Inicia sesión para acceder a RoomFlow." }, { status: 401 });
  }
  if (!origenValido(request)) return Response.json({ message: "Origen no autorizado." }, { status: 403 });
  const { ruta } = await context.params;
  const rest = ruta.length === 3 && ruta[0] === "rest" && ruta[1] === "v1" && tablas.has(ruta[2]);
  const rpc = ruta.length === 4 && ruta[0] === "rest" && ruta[1] === "v1" && ruta[2] === "rpc" && funciones.has(ruta[3]) && request.method === "POST";
  const storage = ruta[0] === "storage" && ruta[1] === "v1" && ruta[2] === "object" && (
    (ruta[3] === "sign" && ruta[4] === "documentos-inquilinos" && ruta.length > 5 && request.method === "POST") ||
    (ruta[3] === "documentos-inquilinos" && ruta.length === 4 && request.method === "DELETE")
  );
  if ((!rest && !rpc && !storage) || ruta.some(p => !p || p === "." || p === ".." || /[\\/%?#]/.test(p))) {
    return Response.json({ message: "Operación no permitida." }, { status: 403 });
  }
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return Response.json({ message: "Falta configurar el acceso seguro a los datos." }, { status: 503 });
  const url = new URL(`/${ruta.map(encodeURIComponent).join("/")}`, base);
  url.search = request.nextUrl.search;
  const headers = new Headers({ apikey: key, authorization: `Bearer ${key}` });
  for (const name of ["accept", "content-type", "prefer", "range", "range-unit"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  // Do not accept schema overrides or credentials supplied by the browser.
  headers.set("accept-profile", "public");
  headers.set("content-profile", "public");
  try {
    const response = await fetch(url, {
      method: request.method, headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
      cache: "no-store", redirect: "error",
    });
    const outputHeaders = new Headers({ "cache-control": "private, no-store", "vary": "Cookie" });
    for (const name of ["content-type", "content-range", "range-unit", "preference-applied"]) {
      const value = response.headers.get(name);
      if (value) outputHeaders.set(name, value);
    }
    return new Response(response.body, { status: response.status, headers: outputHeaders });
  } catch {
    return Response.json({ message: "No se pudo conectar con la base de datos." }, { status: 502 });
  }
}

export { atender as GET, atender as HEAD, atender as POST, atender as PATCH, atender as DELETE };
