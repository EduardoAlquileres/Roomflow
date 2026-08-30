"use client";

import { Euro, History, Landmark, Pencil, Trash2 } from "lucide-react";
import { Cobro } from "@/types/cobro";
import ReciboCobroButton from "@/components/ReciboCobroButton";
import WhatsAppPendientesButton from "@/components/WhatsAppPendientesButton";

type Habitacion = { id: string; codigo: string; vivienda_id: string };
type Vivienda = { id: string; nombre: string };
type Inquilino = { id: string; nombre: string; apellidos: string; telefono: string | null; documento?: string | null };

type Props = {
  cobros: Cobro[];
  habitaciones: Habitacion[];
  viviendas: Vivienda[];
  inquilinos: Inquilino[];
  onRegistrarPago?: (cobro: Cobro) => void;
  onVerHistorial?: (cobro: Cobro) => void;
  onEditar?: (cobro: Cobro) => void;
  onEliminar?: (id: string) => void;
  onMarcarDeuda?: (cobro: Cobro) => void;
};

const formatoMoneda = (importe: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(importe);

export default function CobrosTable({ cobros, habitaciones, viviendas, inquilinos, onRegistrarPago, onVerHistorial, onEditar, onEliminar, onMarcarDeuda }: Props) {
  const obtenerHabitacion = (id: string) => habitaciones.find((habitacion) => habitacion.id === id) ?? null;
  const obtenerVivienda = (idHabitacion: string) => {
    const habitacion = obtenerHabitacion(idHabitacion);
    return habitacion ? viviendas.find((vivienda) => vivienda.id === habitacion.vivienda_id) ?? null : null;
  };
  const obtenerInquilino = (id: string) => inquilinos.find((inquilino) => inquilino.id === id) ?? null;
  const nombreEstado = (estado: Cobro["estado"]) => estado === "PAGADO" ? "Pagado" : estado === "PARCIAL" ? "Parcial" : estado === "DEUDA" ? "Deuda" : "Pendiente";
  const nombreMes = (mes: number) => ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"][mes - 1];

  function acciones(cobro: Cobro, vivienda: Vivienda | null, habitacion: Habitacion | null, inquilino: Inquilino | null) {
    return (
      <div className="flex flex-wrap gap-2">
        <button style={boton} title="Registrar pago" aria-label="Registrar pago" onClick={() => onRegistrarPago?.(cobro)}><Euro size={18} /></button>
        <button style={boton} title="Historial" aria-label="Ver historial" onClick={() => onVerHistorial?.(cobro)}><History size={18} /></button>
        <ReciboCobroButton cobro={cobro} vivienda={vivienda} habitacion={habitacion} inquilino={inquilino} />
        {inquilino && cobro.estado !== "PAGADO" && (
          <WhatsAppPendientesButton
            inquilinoId={inquilino.id}
            nombre={`${inquilino.nombre} ${inquilino.apellidos}`.trim()}
            telefono={inquilino.telefono}
          />
        )}
        <button style={boton} title="Editar cobro" aria-label="Editar cobro" onClick={() => onEditar?.(cobro)}><Pencil size={18} /></button>
        {cobro.estado !== "PAGADO" && cobro.estado !== "DEUDA" && <button style={boton} title="Marcar saldo como deuda" aria-label="Marcar saldo como deuda" onClick={() => onMarcarDeuda?.(cobro)}><Landmark size={18} /></button>}
        <button style={boton} title="Eliminar cobro" aria-label="Eliminar cobro" onClick={() => onEliminar?.(cobro.id)}><Trash2 size={18} /></button>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
      <div className="hidden overflow-x-auto lg:block">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f8fafc" }}>
            <tr>
              <th style={th}>Periodo</th><th style={th}>Vivienda</th><th style={th}>Habitación</th><th style={th}>Inquilino</th><th style={th}>Alquiler</th><th style={th}>Gastos</th><th style={th}>Total</th><th style={th}>Pagado</th><th style={th}>Pendiente</th><th style={th}>Estado</th><th style={th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cobros.length === 0 && <tr><td colSpan={11} style={{ padding: 30, textAlign: "center", color: "#94a3b8" }}>No existen cobros.</td></tr>}
            {cobros.map((cobro) => {
              const habitacion = obtenerHabitacion(cobro.habitacion_id);
              const vivienda = obtenerVivienda(cobro.habitacion_id);
              const inquilino = obtenerInquilino(cobro.inquilino_id);
              return <tr
                key={cobro.id}
                style={cobro.estado === "PARCIAL" ? { background: "#eff6ff", boxShadow: "inset 4px 0 0 #2563eb" } : cobro.estado === "DEUDA" ? { background: "#faf5ff", boxShadow: "inset 4px 0 0 #7c3aed" } : undefined}
              >
                <td style={td}>{nombreMes(cobro.periodo_mes)} {cobro.periodo_anio}</td>
                <td style={td}>{vivienda?.nombre ?? "-"}</td>
                <td style={td}>{habitacion?.codigo ?? "-"}</td>
                <td style={td}>{inquilino ? `${inquilino.nombre} ${inquilino.apellidos}` : "-"}</td>
                <td style={td}>{formatoMoneda(Number(cobro.alquiler))}</td>
                <td style={td}>{formatoMoneda(Number(cobro.gastos))}</td>
                <td style={td}>{formatoMoneda(Number(cobro.total))}</td>
                <td style={td}>{formatoMoneda(Number(cobro.pagado))}</td>
                <td style={td}>{formatoMoneda(Number(cobro.pendiente))}</td>
                <td style={td}><span style={estadoBadge(cobro.estado)}>{nombreEstado(cobro.estado)}</span></td>
                <td style={td}>{acciones(cobro, vivienda, habitacion, inquilino)}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-100 lg:hidden">
        {cobros.length === 0 ? <p className="px-5 py-8 text-center text-sm text-slate-400">No existen cobros.</p> : cobros.map((cobro) => {
          const habitacion = obtenerHabitacion(cobro.habitacion_id);
          const vivienda = obtenerVivienda(cobro.habitacion_id);
          const inquilino = obtenerInquilino(cobro.inquilino_id);
          return (
            <article key={cobro.id} className={`p-4 ${cobro.estado === "PARCIAL" ? "border-l-4 border-blue-600 bg-blue-50" : cobro.estado === "DEUDA" ? "border-l-4 border-violet-600 bg-violet-50" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{nombreMes(cobro.periodo_mes)} {cobro.periodo_anio}</p>
                  <p className="mt-1 text-sm text-slate-500">{vivienda?.nombre ?? "-"} · Habitación {habitacion?.codigo ?? "-"}</p>
                  <p className="mt-1 text-sm text-slate-700">{inquilino ? `${inquilino.nombre} ${inquilino.apellidos}` : "Sin inquilino"}</p>
                </div>
                <span style={estadoBadge(cobro.estado)}>{nombreEstado(cobro.estado)}</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-3 text-sm">
                <Importe titulo="Alquiler" valor={formatoMoneda(Number(cobro.alquiler))} />
                <Importe titulo="Gastos" valor={formatoMoneda(Number(cobro.gastos))} />
                <Importe titulo="Total" valor={formatoMoneda(Number(cobro.total))} />
                <Importe titulo="Pagado" valor={formatoMoneda(Number(cobro.pagado))} color="text-emerald-700" />
                <div className="col-span-2"><Importe titulo="Pendiente" valor={formatoMoneda(Number(cobro.pendiente))} color="text-rose-600" /></div>
              </div>
              <div className="mt-4 border-t border-slate-100 pt-3">{acciones(cobro, vivienda, habitacion, inquilino)}</div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Importe({ titulo, valor, color = "text-slate-900" }: { titulo: string; valor: string; color?: string }) {
  return <div><p className="text-slate-500">{titulo}</p><p className={`mt-1 font-semibold ${color}`}>{valor}</p></div>;
}

const estadoBadge = (estado: Cobro["estado"]): React.CSSProperties => ({ background: estado === "PAGADO" ? "#22c55e" : estado === "PARCIAL" ? "#f59e0b" : estado === "DEUDA" ? "#7c3aed" : "#ef4444", color: "#fff", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" });
const th: React.CSSProperties = { padding: "14px", textAlign: "left", borderBottom: "1px solid #e5e7eb", background: "#f8fafc", fontWeight: 600, fontSize: 14, color: "#334155" };
const td: React.CSSProperties = { padding: "14px", borderBottom: "1px solid #f1f5f9", fontSize: 14, color: "#334155" };
const boton: React.CSSProperties = { width: 34, height: 34, border: "none", borderRadius: 6, background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "0.2s" };
