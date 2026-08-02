"use client";

import {
  Home,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";

import IconButton from "@/components/IconButton";
import { useRouter } from "next/navigation";

type Vivienda = {
  id: string;
  nombre: string;
  direccion: string | null;
  activa: boolean;
};

type Habitacion = {
  id: string;
  vivienda_id: string;
  estado: string;
};

type Props = {
  viviendas: Vivienda[];
  habitaciones: Habitacion[];
  onEditar: (vivienda: Vivienda) => void;
  onEliminar: (id: string) => void;
};

export default function ViviendaTable({
  viviendas,
  habitaciones,
  onEditar,
  onEliminar,
}: Props) {
  const router = useRouter();

  return (
    <div className="rf-table-shell">
      <table className="rf-data-table">
        <thead
          style={{
            background: "#f8fafc",
          }}
        >
          <tr>
            <th style={thLeft}>Vivienda</th>
            <th style={th}>Habitaciones</th>
            <th style={th}>Libres</th>
            <th style={th}>Ocupadas</th>
            <th style={th}>Estado</th>
            <th style={th}>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {viviendas.map((vivienda) => {
            const lista = habitaciones.filter(
              (h) => h.vivienda_id === vivienda.id
            );

            const libres = lista.filter(
              (h) => h.estado === "LIBRE"
            ).length;

            const ocupadas = lista.filter(
              (h) => h.estado === "OCUPADA"
            ).length;

            return (
              <tr
                key={vivienda.id}
                role="link"
                tabIndex={0}
                aria-label={`Ver habitaciones de ${vivienda.nombre}`}
                onClick={() => router.push(`/viviendas/${vivienda.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(`/viviendas/${vivienda.id}`);
                  }
                }}
                style={{
                  borderTop: "1px solid #e5e7eb",
                  cursor: "pointer",
                }}
              >
                <td style={tdLeft}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 10,
                        background: "#dbeafe",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Home
                        size={20}
                        color="#2563eb"
                      />
                    </div>

                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 15,
                        }}
                      >
                        {vivienda.nombre}
                      </div>

                      <div
                        style={{
                          fontSize: 13,
                          color: "#6b7280",
                        }}
                      >
                        {vivienda.direccion || "Sin dirección"}
                      </div>
                    </div>
                  </div>
                </td>

                <td style={tdCenter}>
                  {lista.length}
                </td>

                <td
                  style={{
                    ...tdCenter,
                    color: "#16a34a",
                    fontWeight: 700,
                  }}
                >
                  {libres}
                </td>

                <td
                  style={{
                    ...tdCenter,
                    color: "#dc2626",
                    fontWeight: 700,
                  }}
                >
                  {ocupadas}
                </td>

                <td style={tdCenter}>
                  {vivienda.activa ? (
                    <CheckCircle
                      size={22}
                      color="#16a34a"
                    />
                  ) : (
                    <XCircle
                      size={22}
                      color="#dc2626"
                    />
                  )}
                </td>

                <td onClick={(event) => event.stopPropagation()}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: 10,
                    }}
                  >
                    <IconButton
                      title="Editar"
                      color="#2563eb"
                      icon={<Pencil size={18} />}
                      onClick={() =>
                        onEditar(vivienda)
                      }
                    />

                    <IconButton
                      title="Eliminar"
                      color="#dc2626"
                      icon={<Trash2 size={18} />}
                      onClick={() => {
                        if (
                          confirm(
                            `¿Eliminar la vivienda "${vivienda.nombre}"?`
                          )
                        ) {
                          onEliminar(vivienda.id);
                        }
                      }}
                    />
                  </div>
                </td>
              </tr>
            );
          })}

          {viviendas.length === 0 && (
            <tr>
              <td
                colSpan={6}
                style={{
                  padding: 40,
                  textAlign: "center",
                  color: "#6b7280",
                }}
              >
                No hay viviendas registradas.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const th = {
  padding: "18px",
  textAlign: "center" as const,
  fontWeight: 600,
  fontSize: 14,
};

const thLeft = {
  ...th,
  textAlign: "left" as const,
};

const tdLeft = {
  padding: "18px",
};

const tdCenter = {
  padding: "18px",
  textAlign: "center" as const,
};
