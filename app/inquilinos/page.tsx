import Link from "next/link";
import { CalendarDays, ChevronRight, DoorOpen, Home, Users } from "lucide-react";

import { obtenerHabitaciones } from "@/lib/habitaciones";
import { obtenerInquilinos } from "@/lib/inquilinos";
import { obtenerViviendas } from "@/lib/viviendas";

export const dynamic = "force-dynamic";

function fechaLocal(fecha: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${fecha}T00:00:00`));
}

function duracionEstancia(entrada: string, salida: string | null) {
  const inicio = new Date(`${entrada}T00:00:00`);
  const fin = salida ? new Date(`${salida}T00:00:00`) : new Date();
  const dias = Math.max(0, Math.floor((fin.getTime() - inicio.getTime()) / 86_400_000));
  const meses = Math.floor(dias / 30);

  if (meses === 0) return `${dias} ${dias === 1 ? "día" : "días"}`;
  const diasRestantes = dias % 30;
  return diasRestantes === 0
    ? `${meses} ${meses === 1 ? "mes" : "meses"}`
    : `${meses} ${meses === 1 ? "mes" : "meses"} y ${diasRestantes} días`;
}

export default async function InquilinosPage() {
  const [inquilinos, habitaciones, viviendas] = await Promise.all([
    obtenerInquilinos(),
    obtenerHabitaciones(),
    obtenerViviendas(),
  ]);

  const activos = inquilinos.filter((inquilino) => inquilino.activo).length;

  return (
    <div>
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Inquilinos</h1>
          <p className="mt-2 text-slate-500">Consulta las estancias activas y el historial de tus inquilinos.</p>
        </div>
        <div className="rounded-xl bg-blue-50 px-4 py-3 text-right text-blue-700">
          <div className="text-2xl font-bold">{activos}</div>
          <div className="text-sm font-medium">activos</div>
        </div>
      </div>

      <section className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center gap-3 border-b border-slate-200 p-5">
          <div className="rounded-lg bg-blue-100 p-2 text-blue-600"><Users size={21} /></div>
          <div><h2 className="font-bold text-slate-900">Todos los inquilinos</h2><p className="text-sm text-slate-500">{inquilinos.length} registros</p></div>
        </div>

        {inquilinos.length === 0 ? (
          <div className="p-10 text-center text-slate-500"><Users className="mx-auto mb-3 text-slate-300" size={36} />Todavía no hay inquilinos registrados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-slate-50 text-sm text-slate-600"><tr><th className="px-5 py-4 font-semibold">Inquilino</th><th className="px-5 py-4 font-semibold">Vivienda</th><th className="px-5 py-4 font-semibold">Habitación</th><th className="px-5 py-4 font-semibold">Entrada</th><th className="px-5 py-4 font-semibold">Tiempo en habitación</th><th className="px-5 py-4 font-semibold">Estado</th></tr></thead>
              <tbody>
                {inquilinos.map((inquilino) => {
                  const habitacion = habitaciones.find((item) => item.id === inquilino.habitacion_id);
                  const vivienda = habitacion ? viviendas.find((item) => item.id === habitacion.vivienda_id) : undefined;
                  return <tr key={inquilino.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-4"><div className="font-semibold text-slate-900">{inquilino.nombre} {inquilino.apellidos}</div><div className="mt-1 text-sm text-slate-500">{inquilino.telefono || inquilino.email || "Sin contacto"}</div></td>
                    <td className="px-5 py-4 text-slate-600"><span className="inline-flex items-center gap-2"><Home size={16} className="text-slate-400" />{vivienda?.nombre ?? "—"}</span></td>
                    <td className="px-5 py-4 text-slate-600"><span className="inline-flex items-center gap-2"><DoorOpen size={16} className="text-slate-400" />{habitacion?.codigo ?? "—"}</span></td>
                    <td className="px-5 py-4 text-slate-600"><span className="inline-flex items-center gap-2"><CalendarDays size={16} className="text-slate-400" />{fechaLocal(inquilino.fecha_entrada)}</span></td>
                    <td className="px-5 py-4 font-medium text-slate-700">{duracionEstancia(inquilino.fecha_entrada, inquilino.fecha_salida)}</td>
                    <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${inquilino.activo ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"}`}>{inquilino.activo ? "Activo" : "Finalizado"}</span></td>
                    <td className="px-5 py-4 text-right"><Link href={`/inquilinos/${inquilino.id}`} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50">Ver ficha <ChevronRight size={16} /></Link></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
