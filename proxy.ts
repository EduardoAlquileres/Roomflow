import { COOKIE_NAME, origenValido, sesionValida } from "@/lib/sesion";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const password = process.env.ROOMFLOW_ACCESS_PASSWORD;

  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/") && !["GET", "HEAD"].includes(request.method) && !origenValido(request)) {
    return NextResponse.json({ error: "Origen no autorizado." }, { status: 403 });
  }
  // The scheduled endpoint verifies its own CRON_SECRET before querying data.
  if (pathname === "/acceso" || pathname === "/api/acceso" || pathname === "/api/cobros/generar") {
    return NextResponse.next();
  }

  if (sesionValida(request.cookies.get(COOKIE_NAME)?.value, password)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const acceso = new URL("/acceso", request.url);
  acceso.searchParams.set("volver", `${pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(acceso);
}

export const config = {
  matcher: ["/api/:path*", "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|ico)$).*)"],
};
