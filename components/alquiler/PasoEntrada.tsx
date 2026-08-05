"use client";

import { NuevoAlquiler } from "@/types/nuevoAlquiler";
import PlanFianza from "./PlanFianza";

interface Props { datos: NuevoAlquiler; setDatos: React.Dispatch<React.SetStateAction<NuevoAlquiler>>; }

export default function PasoEntrada({ datos, setDatos }: Props) {
  const actualizar = (campo: keyof NuevoAlquiler, valor: string | number) => setDatos((prev) => ({ ...prev, [campo]: valor }));
  const campo = (titulo: string, clave: keyof NuevoAlquiler, tipo = "text") => <div><label className="mb-1 block text-sm font-medium">{titulo}</label><input type={tipo} value={String(datos[clave] ?? "")} onChange={(event) => actualizar(clave, tipo === "number" ? Number(event.target.value) : event.target.value)} className="w-full rounded-lg border p-2" /></div>;
  return <div className="space-y-8"><div><h2 className="text-2xl font-bold">Entrada directa</h2><p className="text-gray-500">El inquilino entra hoy sin una reserva previa.</p></div><div className="grid gap-5 md:grid-cols-2">{campo("Fecha de entrada", "fechaEntrada", "date")}{campo("Alquiler mensual (€)", "alquiler", "number")}{campo("Gastos por persona (€)", "gastos", "number")}{campo("Fianza total (€)", "fianza", "number")}<PlanFianza datos={datos} setDatos={setDatos} /></div><div><label className="mb-1 block text-sm font-medium">Método de pago</label><select value={datos.metodoPago} onChange={(event) => actualizar("metodoPago", event.target.value)} className="w-full rounded-lg border p-2"><option value="">Seleccionar</option><option value="EFECTIVO">Efectivo</option><option value="BIZUM">Bizum</option><option value="TRANSFERENCIA">Transferencia</option><option value="TARJETA">Tarjeta</option></select></div><div><label className="mb-1 block text-sm font-medium">Observaciones</label><textarea rows={5} value={datos.observaciones} onChange={(event) => actualizar("observaciones", event.target.value)} className="w-full rounded-lg border p-3" /></div></div>;
}
