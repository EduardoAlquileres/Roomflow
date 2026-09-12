import { createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE_NAME = "roomflow_access";
export const DURACION_SESION = 1000 * 60 * 60 * 24 * 30;

export function coinciden(valor: string, esperado: string) {
  const a = Buffer.from(valor);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function crearSesion(secreto: string) {
  const caduca = String(Date.now() + DURACION_SESION);
  return `${caduca}.${createHmac("sha256", secreto).update(caduca).digest("base64url")}`;
}

export function sesionValida(cookie: string | undefined, secreto: string | undefined) {
  if (!cookie || !secreto) return false;
  const partes = cookie.split(".");
  if (partes.length !== 2) return false;
  const [caduca, firma] = partes;
  if (!/^\d+$/.test(caduca) || !Number.isSafeInteger(Number(caduca)) || Number(caduca) <= Date.now()) return false;
  return coinciden(firma, createHmac("sha256", secreto).update(caduca).digest("base64url"));
}

export function origenValido(request: Request) {
  const origen = request.headers.get("origin");
  return request.headers.get("sec-fetch-site") !== "cross-site" && (!origen || origen === new URL(request.url).origin);
}
