import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { supabase } from "@/lib/supabase";

const MICROSOFT = "https://login.microsoftonline.com/common/oauth2/v2.0";
const GRAPH = "https://graph.microsoft.com/v1.0";
const ID_INTEGRACION = "principal";

type Tokens = { access_token: string; refresh_token: string; expires_in: number };
type Registro = { access_token_cifrado: string; refresh_token_cifrado: string; expira_en: string };

function configuracion() {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const clave = process.env.ONEDRIVE_TOKEN_ENCRYPTION_KEY || process.env.ROOMFLOW_ACCESS_PASSWORD;
  if (!clientId || !clientSecret || !clave) throw new Error("La conexión con OneDrive todavía no está configurada.");
  return { clientId, clientSecret, clave };
}

function cifrar(valor: string, secreto: string) {
  const clave = createHash("sha256").update(secreto).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", clave, iv);
  const contenido = Buffer.concat([cipher.update(valor, "utf8"), cipher.final()]);
  return [iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), contenido.toString("base64url")].join(".");
}

function descifrar(valor: string, secreto: string) {
  const [ivTexto, tagTexto, contenidoTexto] = valor.split(".");
  if (!ivTexto || !tagTexto || !contenidoTexto) throw new Error("La credencial de OneDrive no es válida.");
  const clave = createHash("sha256").update(secreto).digest();
  const decipher = createDecipheriv("aes-256-gcm", clave, Buffer.from(ivTexto, "base64url"));
  decipher.setAuthTag(Buffer.from(tagTexto, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(contenidoTexto, "base64url")), decipher.final()]).toString("utf8");
}

export function urlRetornoOneDrive(origen: string) { return `${origen}/api/onedrive/callback`; }

async function guardarTokens(tokens: Tokens) {
  const { clave } = configuracion();
  const { error } = await supabase.from("integracion_onedrive").upsert({
    id: ID_INTEGRACION,
    access_token_cifrado: cifrar(tokens.access_token, clave),
    refresh_token_cifrado: cifrar(tokens.refresh_token, clave),
    expira_en: new Date(Date.now() + Math.max(tokens.expires_in - 120, 60) * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" });
  if (error) throw error;
}

export async function conectarOneDrive(codigo: string, retorno: string) {
  const { clientId, clientSecret } = configuracion();
  const datos = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, code: codigo, redirect_uri: retorno, grant_type: "authorization_code" });
  const respuesta = await fetch(`${MICROSOFT}/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: datos });
  const tokens = await respuesta.json() as Partial<Tokens> & { error_description?: string };
  if (!respuesta.ok || !tokens.access_token || !tokens.refresh_token || !tokens.expires_in) throw new Error(tokens.error_description || "No se pudo autorizar OneDrive.");
  await guardarTokens(tokens as Tokens);
}

async function tokenAcceso() {
  const { data, error } = await supabase.from("integracion_onedrive").select("access_token_cifrado, refresh_token_cifrado, expira_en").eq("id", ID_INTEGRACION).maybeSingle<Registro>();
  if (error) throw error;
  if (!data) throw new Error("Conecta OneDrive antes de adjuntar documentos.");
  const { clientId, clientSecret, clave } = configuracion();
  if (new Date(data.expira_en).getTime() > Date.now()) return descifrar(data.access_token_cifrado, clave);

  const datos = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: descifrar(data.refresh_token_cifrado, clave), grant_type: "refresh_token" });
  const respuesta = await fetch(`${MICROSOFT}/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: datos });
  const renovado = await respuesta.json() as Partial<Tokens> & { error_description?: string };
  if (!respuesta.ok || !renovado.access_token || !renovado.expires_in) throw new Error(renovado.error_description || "La autorización de OneDrive ha caducado.");
  await guardarTokens({ access_token: renovado.access_token, refresh_token: renovado.refresh_token || descifrar(data.refresh_token_cifrado, clave), expires_in: renovado.expires_in });
  return renovado.access_token;
}

async function graph(ruta: string, opciones: RequestInit = {}) {
  const respuesta = await fetch(`${GRAPH}${ruta}`, { ...opciones, headers: { Authorization: `Bearer ${await tokenAcceso()}`, "Content-Type": "application/json", ...opciones.headers } });
  if (respuesta.status === 204) return null;
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(datos?.error?.message || "No se pudo comunicar con OneDrive.");
  return datos;
}

async function carpetaRoomFlow() {
  const nombre = "RoomFlow - Documentos";
  const existente = await graph(`/me/drive/root:/${encodeURIComponent(nombre)}`).catch((error: Error) => error.message.includes("item") || error.message.includes("found") ? null : Promise.reject(error));
  if (existente?.id) return existente.id as string;
  const creada = await graph("/me/drive/root/children", { method: "POST", body: JSON.stringify({ name: nombre, folder: {}, "@microsoft.graph.conflictBehavior": "fail" }) });
  return creada.id as string;
}

export async function crearSesionSubidaOneDrive(nombreArchivo: string) {
  const carpetaId = await carpetaRoomFlow();
  const respuesta = await graph(`/me/drive/items/${encodeURIComponent(carpetaId)}:/${encodeURIComponent(nombreArchivo)}:/createUploadSession`, { method: "POST", body: JSON.stringify({ item: { "@microsoft.graph.conflictBehavior": "rename" } }) });
  return respuesta.uploadUrl as string;
}

export async function abrirDocumentoOneDrive(itemId: string) {
  const datos = await graph(`/me/drive/items/${encodeURIComponent(itemId)}?$select=name,webUrl,@microsoft.graph.downloadUrl`);
  return datos["@microsoft.graph.downloadUrl"] || datos.webUrl;
}

export async function eliminarDocumentoOneDrive(itemId: string) {
  await graph(`/me/drive/items/${encodeURIComponent(itemId)}`, { method: "DELETE" });
}
