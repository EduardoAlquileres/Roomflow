import { DocumentoInquilino } from "@/types";
import { supabase } from "./supabase";

const BUCKET_DOCUMENTOS = "documentos-inquilinos";

export async function obtenerDocumentosInquilino(inquilinoId: string): Promise<DocumentoInquilino[]> {
  const { data, error } = await supabase
    .from("inquilino_documentos")
    .select("*")
    .eq("inquilino_id", inquilinoId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function subirDocumentoInquilino(inquilinoId: string, archivo: File): Promise<DocumentoInquilino> {
  const nombreSeguro = archivo.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const rutaArchivo = `${inquilinoId}/${crypto.randomUUID()}-${nombreSeguro}`;
  const { error: errorSubida } = await supabase.storage
    .from(BUCKET_DOCUMENTOS)
    .upload(rutaArchivo, archivo, { contentType: archivo.type || undefined, upsert: false });

  if (errorSubida) throw errorSubida;

  const { data, error } = await supabase
    .from("inquilino_documentos")
    .insert({
      inquilino_id: inquilinoId,
      nombre: archivo.name,
      ruta_archivo: rutaArchivo,
      tipo_archivo: archivo.type || null,
      tamano: archivo.size,
    })
    .select()
    .single();

  if (error) {
    await supabase.storage.from(BUCKET_DOCUMENTOS).remove([rutaArchivo]);
    throw error;
  }

  return data;
}

export async function abrirDocumentoInquilino(documento: DocumentoInquilino): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_DOCUMENTOS)
    .createSignedUrl(documento.ruta_archivo, 60 * 10);

  if (error) throw error;
  return data.signedUrl;
}

export async function eliminarDocumentoInquilino(documento: DocumentoInquilino): Promise<void> {
  const { error } = await supabase.from("inquilino_documentos").delete().eq("id", documento.id);
  if (error) throw error;

  const { error: errorArchivo } = await supabase.storage
    .from(BUCKET_DOCUMENTOS)
    .remove([documento.ruta_archivo]);
  if (errorArchivo) throw errorArchivo;
}

export async function eliminarDocumentosInquilino(inquilinoId: string): Promise<void> {
  const documentos = await obtenerDocumentosInquilino(inquilinoId);
  if (!documentos.length) return;

  const { error } = await supabase.storage
    .from(BUCKET_DOCUMENTOS)
    .remove(documentos.map((documento) => documento.ruta_archivo));
  if (error) throw error;
}
