import { COOKIE_NAME, DURACION_SESION, coinciden, crearSesion, origenValido } from "@/lib/sesion";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!origenValido(request)) return NextResponse.json({ error: "Origen no autorizado." }, { status: 403 });
  const passwordConfigurada = process.env.ROOMFLOW_ACCESS_PASSWORD;
  if (!passwordConfigurada) {
    return NextResponse.json({ error: "El acceso privado todavía no está configurado." }, { status: 503 });
  }

  const { password } = await request.json().catch(() => ({ password: "" }));
  if (typeof password !== "string" || !coinciden(password, passwordConfigurada)) {
    return NextResponse.json({ error: "La contraseña no es correcta." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: COOKIE_NAME,
    value: crearSesion(passwordConfigurada),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_SESION / 1000,
  });
  return response;
}

export async function DELETE(request: Request) {
  if (!origenValido(request)) return NextResponse.json({ error: "Origen no autorizado." }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set({ name: COOKIE_NAME, value: "", path: "/", maxAge: 0 });
  return response;
}
