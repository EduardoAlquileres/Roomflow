import { notFound } from "next/navigation";
import InquilinoPerfil from "@/components/InquilinoPerfil";

export const dynamic = "force-dynamic";
import { obtenerDocumentosInquilino } from "@/lib/documentosInquilino";
import { obtenerHistorialInquilino } from "@/lib/estancias";
import { obtenerHabitaciones } from "@/lib/habitaciones";
import { obtenerInquilino } from "@/lib/inquilinos";
import { obtenerViviendas } from "@/lib/viviendas";
type Props = { params: Promise<{ id: string }> };
export default async function InquilinoDetallePage({ params }: Props) { const { id } = await params; const inquilino = await obtenerInquilino(id); if (!inquilino) notFound(); const [estancias, habitaciones, viviendas, documentos] = await Promise.all([obtenerHistorialInquilino(id), obtenerHabitaciones(), obtenerViviendas(), obtenerDocumentosInquilino(id)]); return <InquilinoPerfil inquilino={inquilino} estancias={estancias} habitaciones={habitaciones} viviendas={viviendas} documentosIniciales={documentos} />; }
