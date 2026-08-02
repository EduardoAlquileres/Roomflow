import { NextResponse } from "next/server";
import { conectarOneDrive, urlRetornoOneDrive } from "@/lib/onedriveServidor";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const esperado = request.headers.get("cookie")?.match(/roomflow_onedrive_state=([^;]+)/)?.[1];
  const destino = new URL("/gastos", request.url);
  try {
    if (!code || !state || !esperado || state !== esperado) throw new Error("La autorización no es válida. Vuelve a conectar OneDrive.");
    await conectarOneDrive(code, urlRetornoOneDrive(url.origin));
    destino.searchParams.set("onedrive", "conectado");
  } catch (causa) {
    destino.searchParams.set("onedrive", "error");
    destino.searchParams.set("detalle", causa instanceof Error ? causa.message : "No se pudo conectar OneDrive.");
  }
  const respuesta = NextResponse.redirect(destino);
  respuesta.cookies.set({ name: "roomflow_onedrive_state", value: "", path: "/", maxAge: 0 });
  return respuesta;
}
