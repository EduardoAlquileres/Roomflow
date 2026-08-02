import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { urlRetornoOneDrive } from "@/lib/onedriveServidor";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "Falta configurar MICROSOFT_CLIENT_ID en Vercel." }, { status: 503 });
  const state = randomUUID();
  const retorno = urlRetornoOneDrive(new URL(request.url).origin);
  const destino = new URL("https://login.microsoftonline.com/common/oauth2/v2.0/authorize");
  destino.search = new URLSearchParams({ client_id: clientId, response_type: "code", redirect_uri: retorno, response_mode: "query", scope: "offline_access Files.ReadWrite", state, prompt: "consent" }).toString();
  const respuesta = NextResponse.redirect(destino);
  respuesta.cookies.set({ name: "roomflow_onedrive_state", value: state, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 600 });
  return respuesta;
}
