import { NextResponse } from "next/server";
import { abrirDocumentoOneDrive, crearSesionSubidaOneDrive, eliminarDocumentoOneDrive } from "@/lib/onedriveServidor";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function nombreSeguro(nombre: string) { return nombre.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "documento"; }
function documentoOneDrive(documento: string) { return documento.startsWith("onedrive:") ? documento.slice(9) : null; }

export async function POST(request: Request) {
  const { gastoId, nombre } = await request.json().catch(() => ({}));
  if (typeof gastoId !== "string" || typeof nombre !== "string") return NextResponse.json({ error: "Datos de documento no válidos." }, { status: 400 });
  const ruta = `Gasto_${gastoId}_${Date.now()}_${nombreSeguro(nombre)}`;
  try { return NextResponse.json({ uploadUrl: await crearSesionSubidaOneDrive(ruta) }); } catch (causa) { return NextResponse.json({ error: causa instanceof Error ? causa.message : "No se pudo preparar OneDrive." }, { status: 500 }); }
}

export async function PUT(request: Request) {
  const { gastoId, itemId } = await request.json().catch(() => ({}));
  if (typeof gastoId !== "string" || typeof itemId !== "string") return NextResponse.json({ error: "Documento no válido." }, { status: 400 });
  const documento = `onedrive:${itemId}`;
  const { error } = await supabase.from("gastos").update({ documento }).eq("id", gastoId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ documento });
}

export async function GET(request: Request) {
  const documento = new URL(request.url).searchParams.get("documento");
  const itemId = documento ? documentoOneDrive(documento) : null;
  if (!itemId) return NextResponse.json({ error: "El documento no pertenece a OneDrive." }, { status: 400 });
  try { return NextResponse.json({ url: await abrirDocumentoOneDrive(itemId) }); } catch (causa) { return NextResponse.json({ error: causa instanceof Error ? causa.message : "No se pudo abrir el documento." }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  const { documento } = await request.json().catch(() => ({}));
  const itemId = typeof documento === "string" ? documentoOneDrive(documento) : null;
  if (!itemId) return NextResponse.json({ ok: true });
  try { await eliminarDocumentoOneDrive(itemId); return NextResponse.json({ ok: true }); } catch (causa) { return NextResponse.json({ error: causa instanceof Error ? causa.message : "No se pudo eliminar el documento." }, { status: 500 }); }
}
