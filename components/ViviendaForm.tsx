"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AppButton from "@/components/AppButton";
import { Home, MapPin, Save, X } from "lucide-react";

type Vivienda = {
  id: string;
  nombre: string;
  direccion: string | null;
  activa: boolean;
};

type Props = {
  abierto: boolean;
  vivienda?: Vivienda | null;
  onClose: () => void;
  onGuardado: () => void;
};

export default function ViviendaForm({
  abierto,
  vivienda,
  onClose,
  onGuardado,
}: Props) {
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [activa, setActiva] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (abierto) {
      if (vivienda) {
        setNombre(vivienda.nombre);
        setDireccion(vivienda.direccion ?? "");
        setActiva(vivienda.activa);
      } else {
        setNombre("");
        setDireccion("");
        setActiva(true);
      }
    }
  }, [abierto, vivienda]);

  if (!abierto) return null;

  async function guardar() {
    if (!nombre.trim()) {
      alert("Debe indicar el nombre de la vivienda.");
      return;
    }

    setGuardando(true);

    let error;

    if (vivienda) {
      ({ error } = await supabase
        .from("viviendas")
        .update({
          nombre,
          direccion,
          activa,
        })
        .eq("id", vivienda.id));
    } else {
      ({ error } = await supabase
        .from("viviendas")
        .insert({
          nombre,
          direccion,
          activa,
        }));
    }

    setGuardando(false);

    if (error) {
      alert(error.message);
      return;
    }

    onGuardado();
    onClose();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,.45)",
        display: "flex",
        justifyContent: "flex-end",
        zIndex: 999,
      }}
    >
      <div
        style={{
          width: 460,
          background: "#fff",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 30px rgba(0,0,0,.15)",
        }}
      >
        <div
          style={{
            padding: 24,
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 24,
            }}
          >
            {vivienda ? "Editar vivienda" : "Nueva vivienda"}
          </h2>

          <p
            style={{
              marginTop: 6,
              color: "#6b7280",
              fontSize: 14,
            }}
          >
            Complete la información de la vivienda.
          </p>
        </div>

        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: 24,
          }}
        >
          <label style={label}>Nombre</label>

          <div style={inputContainer}>
            <Home size={18} color="#6b7280" />

            <input
              style={input}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Inca Centro"
            />
          </div>

          <label style={label}>Dirección</label>

          <div style={inputContainer}>
            <MapPin size={18} color="#6b7280" />

            <input
              style={input}
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Dirección completa"
            />
          </div>

          <div
            style={{
              marginTop: 25,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <input
              type="checkbox"
              checked={activa}
              onChange={(e) => setActiva(e.target.checked)}
            />

            <span>Vivienda activa</span>
          </div>
        </div>

        <div
          style={{
            padding: 24,
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <AppButton variant="secondary" onClick={onClose}>
            <X size={18} />
            Cancelar
          </AppButton>

          <AppButton onClick={guardar} disabled={guardando}>
            <Save size={18} />
            {guardando
              ? "Guardando..."
              : vivienda
              ? "Actualizar"
              : "Guardar"}
          </AppButton>
        </div>
      </div>
    </div>
  );
}

const label = {
  display: "block",
  marginBottom: 8,
  marginTop: 18,
  fontWeight: 600,
};

const inputContainer = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  border: "1px solid #d1d5db",
  borderRadius: 10,
  padding: "12px 14px",
};

const input = {
  border: "none",
  outline: "none",
  width: "100%",
  fontSize: 15,
};