import { NextResponse } from "next/server";
import { abrirDocumentoOneDrive, crearSesionSubidaOneDrive, eliminarDocumentoOneDrive } from "@/lib/onedriveServidor";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const PREFIJO_ONEDRIVE = "onedrive:";

function nombreSeguro(nombre: string) {
  return nombre.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "documento";
}

export async function POST(request: Request) {
  const { inquilinoId, nombre } = await request.json().catch(() => ({}));
  if (typeof inquilinoId !== "string" || typeof nombre !== "string") return NextResponse.json({ error: "Datos de documento no válidos." }, { status: 400 });
  try {
    return NextResponse.json({ uploadUrl: await crearSesionSubidaOneDrive(`Inquilino_${inquilinoId}_${Date.now()}_${nombreSeguro(nombre)}`) });
  } catch (causa) {
    return NextResponse.json({ error: causa instanceof Error ? causa.message : "No se pudo preparar OneDrive." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { inquilinoId, itemId, nombre, tipoArchivo, tamano } = await request.json().catch(() => ({}));
  if (typeof inquilinoId !== "string" || typeof itemId !== "string" || typeof nombre !== "string") return NextResponse.json({ error: "Documento no válido." }, { status: 400 });
  const { data, error } = await supabase.from("inquilino_documentos").insert({ inquilino_id: inquilinoId, nombre, ruta_archivo: `${PREFIJO_ONEDRIVE}${itemId}`, tipo_archivo: typeof tipoArchivo === "string" ? tipoArchivo : null, tamano: typeof tamano === "number" ? tamano : null }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function GET(request: Request) {
  const documentoId = new URL(request.url).searchParams.get("id");
  if (!documentoId) return NextResponse.json({ error: "Documento no válido." }, { status: 400 });
  const { data, error } = await supabase.from("inquilino_documentos").select("ruta_archivo").eq("id", documentoId).maybeSingle();
  if (error || !data?.ruta_archivo.startsWith(PREFIJO_ONEDRIVE)) return NextResponse.json({ error: "El documento no está en OneDrive." }, { status: 400 });
  try {
    return NextResponse.json({ url: await abrirDocumentoOneDrive(data.ruta_archivo.slice(PREFIJO_ONEDRIVE.length)) });
  } catch (causa) {
    return NextResponse.json({ error: causa instanceof Error ? causa.message : "No se pudo abrir el documento." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { documentoId } = await request.json().catch(() => ({}));
  if (typeof documentoId !== "string") return NextResponse.json({ error: "Documento no válido." }, { status: 400 });
  const { data, error: errorLectura } = await supabase.from("inquilino_documentos").select("ruta_archivo").eq("id", documentoId).maybeSingle();
  if (errorLectura || !data) return NextResponse.json({ error: errorLectura?.message || "No se encontró el documento." }, { status: 404 });
  try {
    if (data.ruta_archivo.startsWith(PREFIJO_ONEDRIVE)) await eliminarDocumentoOneDrive(data.ruta_archivo.slice(PREFIJO_ONEDRIVE.length));
    const { error } = await supabase.from("inquilino_documentos").delete().eq("id", documentoId);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (causa) {
    return NextResponse.json({ error: causa instanceof Error ? causa.message : "No se pudo eliminar el documento." }, { status: 500 });
  }
}
