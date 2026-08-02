"use client";

import Link from "next/link";
import { Pencil, Trash2, Users } from "lucide-react";

type Habitacion = {
  id: string;
  vivienda_id: string;
  codigo: string;
  tipo: "INDIVIDUAL" | "PAREJA";
  precio: number;
  gastos: number;
  fianza_meses: number;
  estado: "LIBRE" | "OCUPADA" | "RESERVADA";
  disponible_desde: string | null;
  observaciones: string | null;
};

type Vivienda = {
  id: string;
  nombre: string;
};

type OcupanteResumen = {
  habitacion_id: string;
};

type Props = {
  habitaciones: Habitacion[];
  viviendas: Vivienda[];
  ocupantes?: OcupanteResumen[];
  onEditar?: (habitacion: Habitacion) => void;
  onEliminar?: (id: string) => void;
};

export default function HabitacionTable({
  habitaciones,
  viviendas,
  ocupantes = [],
  onEditar,
  onEliminar,
}: Props) {
  function obtenerNombreVivienda(id: string) {
    return (
      viviendas.find((v) => v.id === id)?.nombre ??
      "Sin vivienda"
    );
  }

  function colorEstado(estado: string) {
    switch (estado) {
      case "LIBRE":
        return "#22c55e";

      case "OCUPADA":
        return "#ef4444";

      case "RESERVADA":
        return "#f59e0b";

      default:
        return "#6b7280";
    }
  }

  function cantidadOcupantes(idHabitacion: string) {
    return ocupantes.filter(
      (ocupante) => ocupante.habitacion_id === idHabitacion
    ).length;
  }

  return (
    <div className="rf-table-shell">
      <table className="rf-data-table">
        <thead
          style={{
            background: "#f8fafc",
          }}
        >
          <tr>
            <th style={th}>Código</th>
            <th style={th}>Vivienda</th>
            <th style={th}>Tipo</th>
            <th style={th}>Precio</th>
            <th style={th}>Gastos</th>
            <th style={th}>Estado</th>
            <th style={th}>Ocupantes</th>
            <th style={th}>Gestionar</th>
            <th style={th}>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {habitaciones.length === 0 && (
            <tr>
              <td
                colSpan={9}
                style={{
                  padding: 30,
                  textAlign: "center",
                  color: "#999",
                }}
              >
                No hay habitaciones registradas.
              </td>
            </tr>
          )}

          {habitaciones.map((habitacion) => (
            <tr key={habitacion.id}>
              <td style={td}>
                <strong>{habitacion.codigo}</strong>
              </td>

              <td style={td}>
                {obtenerNombreVivienda(
                  habitacion.vivienda_id
                )}
              </td>

              <td style={td}>
                {habitacion.tipo}
              </td>

              <td style={td}>
                {habitacion.precio.toFixed(2)} €
              </td>

              <td style={td}>
                {habitacion.gastos.toFixed(2)} €
              </td>

              <td style={td}>
                <span
                  style={{
                    background: colorEstado(
                      habitacion.estado
                    ),
                    color: "#fff",
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {habitacion.estado}
                </span>
              </td>

              <td style={td}>
                {cantidadOcupantes(habitacion.id)} / {habitacion.tipo === "PAREJA" ? 2 : 1}
              </td>

              <td style={td}>
                <Link href={`/habitaciones/${habitacion.id}`} title="Gestionar ocupantes" style={botonLink}>
                  <Users size={18} />
                </Link>
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
    onClick={() => onEditar?.(habitacion)}
>
    <Pencil size={18}/>
</button>

<button
    style={boton}
    onClick={() => onEliminar?.(habitacion.id)}
>
    <Trash2 size={18}/>
</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th: React.CSSProperties = {
  padding: 15,
  textAlign: "left",
  borderBottom: "1px solid #e5e7eb",
  fontWeight: 600,
};

const td: React.CSSProperties = {
  padding: 15,
  borderBottom: "1px solid #f1f5f9",
};

const boton: React.CSSProperties = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const botonLink: React.CSSProperties = {
  ...boton,
  color: "#2563eb",
  textDecoration: "none",
};
