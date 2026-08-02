import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

const COOKIE_NAME = "roomflow_access";
const DURACION_SESION = 1000 * 60 * 60 * 24 * 30;

function coinciden(valor: string, esperado: string) {
  const recibido = Buffer.from(valor);
  const referencia = Buffer.from(esperado);
  return recibido.length === referencia.length && timingSafeEqual(recibido, referencia);
}

function crearSesion(secreto: string) {
  const caduca = String(Date.now() + DURACION_SESION);
  const firma = createHmac("sha256", secreto).update(caduca).digest("base64url");
  return `${caduca}.${firma}`;
}

export async function POST(request: Request) {
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

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({ name: COOKIE_NAME, value: "", path: "/", maxAge: 0 });
  return response;
}
