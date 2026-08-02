"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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

type Props = {
  abierto: boolean;
  habitacion: Habitacion | null;
  viviendas: Vivienda[];
  onClose: () => void;
  onGuardado: () => void;
};

export default function HabitacionForm({
  abierto,
  habitacion,
  viviendas,
  onClose,
  onGuardado,
}: Props) {
  const [viviendaId, setViviendaId] = useState("");
  const [codigo, setCodigo] = useState("");
  const [tipo, setTipo] = useState<"INDIVIDUAL" | "PAREJA">("INDIVIDUAL");
  const [precio, setPrecio] = useState(0);
  const [gastos, setGastos] = useState(0);
  const [fianza, setFianza] = useState(2);
  const [estado, setEstado] =
    useState<"LIBRE" | "OCUPADA" | "RESERVADA">("LIBRE");
  const [observaciones, setObservaciones] = useState("");

  useEffect(() => {
    if (habitacion) {
      setViviendaId(habitacion.vivienda_id);
      setCodigo(habitacion.codigo);
      setTipo(habitacion.tipo);
      setPrecio(habitacion.precio);
      setGastos(habitacion.gastos);
      setFianza(habitacion.fianza_meses);
      setEstado(habitacion.estado);
      setObservaciones(habitacion.observaciones ?? "");
    } else {
      setViviendaId("");
      setCodigo("");
      setTipo("INDIVIDUAL");
      setPrecio(0);
      setGastos(0);
      setFianza(2);
      setEstado("LIBRE");
      setObservaciones("");
    }
  }, [habitacion]);

  async function guardar() {
    if (!viviendaId) {
      alert("Seleccione una vivienda");
      return;
    }

    if (!codigo.trim()) {
      alert("Introduzca un código");
      return;
    }

    const datos = {
      vivienda_id: viviendaId,
      codigo,
      tipo,
      precio,
      gastos,
      fianza_meses: fianza,
      estado,
      observaciones,
    };

    let error;

    if (habitacion) {
      ({ error } = await supabase
        .from("habitaciones")
        .update(datos)
        .eq("id", habitacion.id));
    } else {
      ({ error } = await supabase
        .from("habitaciones")
        .insert(datos));
    }

    if (error) {
      alert(error.message);
      return;
    }

    onGuardado();
  }

  if (!abierto) return null;

  return (
    <div style={overlay}>
      <div style={panel}>
        <h2>
          {habitacion
            ? "Editar habitación"
            : "Nueva habitación"}
        </h2>

        <label>Vivienda</label>

        <select
          value={viviendaId}
          onChange={(e) => setViviendaId(e.target.value)}
        >
          <option value="">Seleccione...</option>

          {viviendas.map((v) => (
            <option key={v.id} value={v.id}>
              {v.nombre}
            </option>
          ))}
        </select>

        <label>Código</label>

        <input
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
        />

        <label>Tipo</label>

        <select
          value={tipo}
          onChange={(e) =>
            setTipo(
              e.target.value as
                | "INDIVIDUAL"
                | "PAREJA"
            )
          }
        >
          <option value="INDIVIDUAL">
            INDIVIDUAL
          </option>

          <option value="PAREJA">
            PAREJA
          </option>
        </select>

        <label>Precio</label>

        <input
          type="number"
          value={precio}
          onChange={(e) =>
            setPrecio(Number(e.target.value))
          }
        />

        <label>Gastos</label>

        <input
          type="number"
          value={gastos}
          onChange={(e) =>
            setGastos(Number(e.target.value))
          }
        />

        <label>Fianza (meses)</label>

        <input
          type="number"
          value={fianza}
          onChange={(e) =>
            setFianza(Number(e.target.value))
          }
        />

        <label>Estado</label>

        <select
          value={estado}
          onChange={(e) =>
            setEstado(
              e.target.value as
                | "LIBRE"
                | "OCUPADA"
                | "RESERVADA"
            )
          }
        >
          <option value="LIBRE">LIBRE</option>
          <option value="OCUPADA">OCUPADA</option>
          <option value="RESERVADA">
            RESERVADA
          </option>
        </select>

        <label>Observaciones</label>

        <textarea
          rows={4}
          value={observaciones}
          onChange={(e) =>
            setObservaciones(e.target.value)
          }
        />

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 20,
          }}
        >
          <button onClick={onClose}>
            Cancelar
          </button>

          <button onClick={guardar}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,.35)",
  display: "flex",
  justifyContent: "flex-end",
};

const panel: React.CSSProperties = {
  width: 420,
  background: "#fff",
  padding: 25,
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: 10,
};