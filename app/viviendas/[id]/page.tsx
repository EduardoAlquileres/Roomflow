import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, DoorOpen, Users } from "lucide-react";

import { obtenerHabitacionesPorVivienda } from "@/lib/habitaciones";
import { obtenerInquilinos } from "@/lib/inquilinos";
import { obtenerVivienda } from "@/lib/viviendas";
import { obtenerPropietarios, obtenerTitularesVivienda } from "@/lib/propietarios";
import PropietariosVivienda from "@/components/PropietariosVivienda";

export const dynamic = "force-dynamic";
import DatosContratoVivienda from "@/components/DatosContratoVivienda";

type Props = {
  params: Promise<{ id: string }>;
};

function colorEstado(estado: string) {
  if (estado === "OCUPADA") return { fondo: "#fef2f2", color: "#dc2626", texto: "Ocupada" };
  if (estado === "RESERVADA") return { fondo: "#fffbeb", color: "#d97706", texto: "Reservada" };
  return { fondo: "#f0fdf4", color: "#16a34a", texto: "Libre" };
}

export default async function ViviendaDetallePage({ params }: Props) {
  const { id } = await params;
  const [vivienda, habitaciones, inquilinos, propietarios, titulares] = await Promise.all([
    obtenerVivienda(id),
    obtenerHabitacionesPorVivienda(id),
    obtenerInquilinos(),
    obtenerPropietarios(),
    obtenerTitularesVivienda(id),
  ]);

  if (!vivienda) notFound();

  return (
    <div>
      <Link href="/viviendas" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800">
        <ArrowLeft size={17} /> Volver a viviendas
      </Link>

      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{vivienda.nombre}</h1>
          <p className="mt-1 text-slate-500">{vivienda.direccion || "Sin dirección"}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${vivienda.activa ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {vivienda.activa ? "Activa" : "Inactiva"}
        </span>
      </div>

      <section className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center gap-3 border-b border-slate-200 p-5">
          <div className="rounded-lg bg-blue-100 p-2 text-blue-600"><DoorOpen size={21} /></div>
          <div><h2 className="font-bold text-slate-900">Habitaciones</h2><p className="text-sm text-slate-500">{habitaciones.length} registradas en esta vivienda</p></div>
        </div>

        {habitaciones.length === 0 ? (
          <p className="p-8 text-center text-slate-500">Esta vivienda todavía no tiene habitaciones.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead className="bg-slate-50 text-sm text-slate-600"><tr><th className="px-5 py-4 font-semibold">Habitación</th><th className="px-5 py-4 font-semibold">Tipo</th><th className="px-5 py-4 font-semibold">Precio</th><th className="px-5 py-4 font-semibold">Gastos</th><th className="px-5 py-4 font-semibold">Ocupante</th><th className="px-5 py-4 font-semibold">Estado</th></tr></thead>
              <tbody>
                {habitaciones.map((habitacion) => {
                  const inquilino = inquilinos.find((item) => item.activo && item.habitacion_id === habitacion.id);
                  const estado = colorEstado(habitacion.estado);
                  return <tr key={habitacion.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-slate-900"><Link href={`/habitaciones/${habitacion.id}`} className="hover:text-blue-600">{habitacion.codigo}</Link></td>
                    <td className="px-5 py-4 text-slate-600">{habitacion.tipo === "PAREJA" ? "Pareja" : "Individual"}</td>
                    <td className="px-5 py-4 text-slate-600">{Number(habitacion.precio).toFixed(2)} €</td>
                    <td className="px-5 py-4 text-slate-600">{Number(habitacion.gastos).toFixed(2)} €</td>
                    <td className="px-5 py-4 text-slate-600">{inquilino ? <span className="inline-flex items-center gap-2"><Users size={16} />{inquilino.nombre} {inquilino.apellidos}</span> : "—"}</td>
                    <td className="px-5 py-4"><span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: estado.fondo, color: estado.color }}>{estado.texto}</span></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <PropietariosVivienda viviendaId={id} propietarios={propietarios} titularesIniciales={titulares} />
      <DatosContratoVivienda vivienda={vivienda} />
    </div>
  );
}
