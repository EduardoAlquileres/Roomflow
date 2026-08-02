import { DocumentoInquilino } from "@/types";
import { supabase } from "./supabase";

const MAX_TAMANO = 25 * 1024 * 1024;
const PREFIJO_ONEDRIVE = "onedrive:";
const BUCKET_DOCUMENTOS = "documentos-inquilinos";

function validarArchivo(archivo: File) {
  if (!archivo.type.startsWith("image/") && archivo.type !== "application/pdf") throw new Error("Adjunta una imagen o un PDF.");
  if (archivo.size > MAX_TAMANO) throw new Error("El documento no puede superar 25 MB.");
}

async function respuestaJson(respuesta: Response) {
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(datos.error || "No se pudo gestionar el documento.");
  return datos;
}

export async function obtenerDocumentosInquilino(inquilinoId: string): Promise<DocumentoInquilino[]> {
  const { data, error } = await supabase.from("inquilino_documentos").select("*").eq("inquilino_id", inquilinoId).order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function subirDocumentoInquilino(inquilinoId: string, archivo: File): Promise<DocumentoInquilino> {
  validarArchivo(archivo);
  const inicio = await respuestaJson(await fetch("/api/documentos-inquilinos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inquilinoId, nombre: archivo.name }) }));
  const tamanoBloque = 5 * 320 * 1024;
  let ultimo: { id?: string } = {};
  for (let desde = 0; desde < archivo.size; desde += tamanoBloque) {
    const hasta = Math.min(desde + tamanoBloque, archivo.size);
    ultimo = await respuestaJson(await fetch(inicio.uploadUrl, { method: "PUT", headers: { "Content-Range": `bytes ${desde}-${hasta - 1}/${archivo.size}` }, body: archivo.slice(desde, hasta) }));
  }
  if (!ultimo.id) throw new Error("OneDrive no confirmó la subida del documento.");
  return respuestaJson(await fetch("/api/documentos-inquilinos", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inquilinoId, itemId: ultimo.id, nombre: archivo.name, tipoArchivo: archivo.type, tamano: archivo.size }) }));
}

export async function abrirDocumentoInquilino(documento: DocumentoInquilino): Promise<string> {
  if (documento.ruta_archivo.startsWith(PREFIJO_ONEDRIVE)) return (await respuestaJson(await fetch(`/api/documentos-inquilinos?id=${encodeURIComponent(documento.id)}`))).url;
  const { data, error } = await supabase.storage.from(BUCKET_DOCUMENTOS).createSignedUrl(documento.ruta_archivo, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}

export async function eliminarDocumentoInquilino(documento: DocumentoInquilino): Promise<void> {
  if (documento.ruta_archivo.startsWith(PREFIJO_ONEDRIVE)) {
    await respuestaJson(await fetch("/api/documentos-inquilinos", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ documentoId: documento.id }) }));
    return;
  }
  const { error } = await supabase.from("inquilino_documentos").delete().eq("id", documento.id);
  if (error) throw error;
  const { error: errorArchivo } = await supabase.storage.from(BUCKET_DOCUMENTOS).remove([documento.ruta_archivo]);
  if (errorArchivo) throw errorArchivo;
}

export async function eliminarDocumentosInquilino(inquilinoId: string): Promise<void> {
  const documentos = await obtenerDocumentosInquilino(inquilinoId);
  await Promise.all(documentos.map(eliminarDocumentoInquilino));
}
