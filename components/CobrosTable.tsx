"use client";

import {
  Pencil,
  Trash2,
  Euro,
  History,
} from "lucide-react";
import { Cobro } from "@/types/cobro";
import ReciboCobroButton from "@/components/ReciboCobroButton";

type Habitacion = {
  id: string;
  codigo: string;
  vivienda_id: string;
};

type Vivienda = {
  id: string;
  nombre: string;
};

type Inquilino = {
  id: string;
  nombre: string;
  apellidos: string;
};
type Props = {
  cobros: Cobro[];
  habitaciones: Habitacion[];
  viviendas: Vivienda[];
  inquilinos: Inquilino[];

  onRegistrarPago?: (cobro: Cobro) => void;

  onVerHistorial?: (cobro: Cobro) => void;

  onEditar?: (cobro: Cobro) => void;

  onEliminar?: (id: string) => void;
};

const formatoMoneda = (importe: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(importe);

export default function CobrosTable({
  cobros,
  habitaciones,
  viviendas,
  inquilinos,
 onRegistrarPago,
 onVerHistorial,
 onEditar,
 onEliminar,
}: Props) {
      function obtenerHabitacion(id: string) {
    return (
      habitaciones.find(
        (habitacion) => habitacion.id === id
      ) ?? null
    );
  }

  function obtenerVivienda(idHabitacion: string) {
    const habitacion = obtenerHabitacion(idHabitacion);

    if (!habitacion) return null;

    return (
      viviendas.find(
        (vivienda) =>
          vivienda.id === habitacion.vivienda_id
      ) ?? null
    );
  }

  function obtenerInquilino(id: string) {
    return (
      inquilinos.find(
        (inquilino) => inquilino.id === id
      ) ?? null
    );
  }

  function colorEstado(estado: Cobro["estado"]) {
    switch (estado) {
      case "PAGADO":
        return "#22c55e";

      case "PARCIAL":
        return "#f59e0b";

      default:
        return "#ef4444";
    }
  }

  function nombreEstado(estado: Cobro["estado"]) {
    switch (estado) {
      case "PAGADO":
        return "Pagado";

      case "PARCIAL":
        return "Parcial";

      default:
        return "Pendiente";
    }
  }

  function nombreMes(mes: number) {
    return [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ][mes - 1];
  }

  return (
  <div
    style={{
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      overflow: "hidden",
    }}
  >
    <table
  style={{
    width: "100%",
    borderCollapse: "collapse",
  }}
>
  <thead
    style={{
      background: "#f8fafc",
    }}
  >
    <tr>
      <th style={th}>Periodo</th>
      <th style={th}>Vivienda</th>
      <th style={th}>Habitación</th>
      <th style={th}>Inquilino</th>
      <th style={th}>Alquiler</th>
      <th style={th}>Gastos</th>
      <th style={th}>Total</th>
      <th style={th}>Pagado</th>
      <th style={th}>Pendiente</th>
      <th style={th}>Estado</th>
      <th style={th}>Acciones</th>
    </tr>
  </thead>

          <tbody>
          {cobros.length === 0 && (
            <tr>
              <td
                colSpan={11}
                style={{
                  padding: 30,
                  textAlign: "center",
                  color: "#94a3b8",
                }}
              >
                No existen cobros.
              </td>
            </tr>
          )}

          {cobros.map((cobro) => {
            const habitacion = obtenerHabitacion(
              cobro.habitacion_id
            );

            const vivienda = obtenerVivienda(
              cobro.habitacion_id
            );

            const inquilino = obtenerInquilino(
              cobro.inquilino_id
            );

            return (
              <tr key={cobro.id}>
                <td style={td}>
                  {nombreMes(cobro.periodo_mes)} {cobro.periodo_anio}
                </td>

                <td style={td}>
                  {vivienda?.nombre ?? "-"}
                </td>

                <td style={td}>
                  {habitacion?.codigo ?? "-"}
                </td>

                <td style={td}>
                  {inquilino
                    ? `${inquilino.nombre} ${inquilino.apellidos}`
                    : "-"}
                </td>

                <td style={td}>
                  {formatoMoneda(Number(cobro.alquiler))}
                </td>

                <td style={td}>
                  {formatoMoneda(Number(cobro.gastos))}
                </td>

                <td style={td}>
                  {Number(cobro.total).toFixed(2)} €
                </td>

                <td style={td}>
                  {Number(cobro.pagado).toFixed(2)} €
                </td>

                <td style={td}>
                  {Number(cobro.pendiente).toFixed(2)} €
                </td>

                <td style={td}>
                  <span
                    style={{
                      background: colorEstado(cobro.estado),
                      color: "#fff",
                      padding: "4px 12px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {nombreEstado(cobro.estado)}
                  </span>
                </td>

                <td style={td}>
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                    }}
                  >
                   <button
  style={boton}
  title="Registrar pago"
  onClick={() =>
    onRegistrarPago?.(cobro)
  }
>
  <Euro size={18} />
</button>

<button
  style={boton}
  title="Historial"
  onClick={() =>
    onVerHistorial?.(cobro)
  }
>
  <History size={18} />
</button>

<ReciboCobroButton cobro={cobro} vivienda={vivienda} habitacion={habitacion} inquilino={inquilino} />

<button
  style={boton}
  title="Editar cobro"
  onClick={() =>
    onEditar?.(cobro)
  }
>
  <Pencil size={18} />
</button>

<button
  style={boton}
  title="Eliminar cobro"
  onClick={() =>
    onEliminar?.(cobro.id)
  }
>
  <Trash2 size={18} />
</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
         </div>
  );
}

const th: React.CSSProperties = {
  padding: "14px",
  textAlign: "left",
  borderBottom: "1px solid #e5e7eb",
  background: "#f8fafc",
  fontWeight: 600,
  fontSize: 14,
  color: "#334155",
};

const td: React.CSSProperties = {
  padding: "14px",
  borderBottom: "1px solid #f1f5f9",
  fontSize: 14,
  color: "#334155",
};

const boton: React.CSSProperties = {
  width: 34,
  height: 34,
  border: "none",
  borderRadius: 6,
  background: "#f8fafc",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "0.2s",
}; 
