import { supabase } from "@/lib/supabase";

const BUCKET_DOCUMENTOS_GASTO = "documentos-gastos";
const MAX_TAMANO = 10 * 1024 * 1024;

function validarArchivo(archivo: File) {
  const esImagen = archivo.type.startsWith("image/");
  const esPdf = archivo.type === "application/pdf";
  if (!esImagen && !esPdf) throw new Error("Adjunta una imagen o un PDF.");
  if (archivo.size > MAX_TAMANO) throw new Error("El documento no puede superar 10 MB.");
}

export async function subirDocumentoGasto(gastoId: string, archivo: File): Promise<string> {
  validarArchivo(archivo);
  const nombreSeguro = archivo.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const ruta = `${gastoId}/${crypto.randomUUID()}-${nombreSeguro}`;

  const { error: errorSubida } = await supabase.storage
    .from(BUCKET_DOCUMENTOS_GASTO)
    .upload(ruta, archivo, { contentType: archivo.type, upsert: false });
  if (errorSubida) throw errorSubida;

  const { error: errorGasto } = await supabase.from("gastos").update({ documento: ruta }).eq("id", gastoId);
  if (errorGasto) {
    await supabase.storage.from(BUCKET_DOCUMENTOS_GASTO).remove([ruta]);
    throw errorGasto;
  }

  return ruta;
}

export async function abrirDocumentoGasto(ruta: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_DOCUMENTOS_GASTO)
    .createSignedUrl(ruta, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}

export async function eliminarDocumentoGasto(ruta: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET_DOCUMENTOS_GASTO).remove([ruta]);
  if (error) throw error;
}
