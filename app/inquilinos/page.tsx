import InquilinosListado from "@/components/InquilinosListado";
import { obtenerHabitaciones } from "@/lib/habitaciones";
import { obtenerInquilinos } from "@/lib/inquilinos";
import { obtenerViviendas } from "@/lib/viviendas";

export const dynamic = "force-dynamic";

export default async function InquilinosPage() {
  const [inquilinos, habitaciones, viviendas] = await Promise.all([obtenerInquilinos(), obtenerHabitaciones(), obtenerViviendas()]);
  const activos = inquilinos.filter((inquilino) => inquilino.activo).length;
  return <div><div className="flex items-start justify-between gap-6"><div><h1 className="text-3xl font-bold text-slate-900">Inquilinos</h1><p className="mt-2 text-slate-500">Consulta las estancias activas y el historial de tus inquilinos.</p></div><div className="rounded-xl bg-blue-50 px-4 py-3 text-right text-blue-700"><div className="text-2xl font-bold">{activos}</div><div className="text-sm font-medium">activos</div></div></div><InquilinosListado inquilinos={inquilinos} habitaciones={habitaciones} viviendas={viviendas} /></div>;
}
