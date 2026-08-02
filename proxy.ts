import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "roomflow_access";

function firmar(valor: string, secreto: string) {
  return createHmac("sha256", secreto).update(valor).digest("base64url");
}

function sesionValida(cookie: string | undefined, secreto: string) {
  if (!cookie) return false;

  const [caduca, firma] = cookie.split(".");
  if (!caduca || !firma || Number(caduca) < Date.now()) return false;

  const esperada = firmar(caduca, secreto);
  const recibida = Buffer.from(firma);
  const prevista = Buffer.from(esperada);

  return recibida.length === prevista.length && timingSafeEqual(recibida, prevista);
}

export function proxy(request: NextRequest) {
  const password = process.env.ROOMFLOW_ACCESS_PASSWORD;

  // En local el programa sigue funcionando sin obligar a crear una clave.
  if (!password) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (pathname === "/acceso" || pathname.startsWith("/api/acceso")) {
    return NextResponse.next();
  }

  if (sesionValida(request.cookies.get(COOKIE_NAME)?.value, password)) {
    return NextResponse.next();
  }

  const acceso = new URL("/acceso", request.url);
  acceso.searchParams.set("volver", `${pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(acceso);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|ico)$).*)"],
};
