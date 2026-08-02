"use client";

import { useEffect, useState } from "react";
import { X, Euro } from "lucide-react";
import { Cobro } from "@/types/cobro";

type Props = {
  abierto: boolean;
  cobro: Cobro | null;
  cargando?: boolean;

  onCerrar: () => void;

  onGuardar: (datos: {
    importe: number;
    fecha: string;
    metodo: string;
    observaciones: string;
  }) => Promise<void>;
};

const METODOS = [
  "Efectivo",
  "Transferencia",
  "Bizum",
  "Tarjeta",
];

export default function RegistrarPagoModal({
  abierto,
  cobro,
  cargando = false,
  onCerrar,
  onGuardar,
}: Props) {
  const [importe, setImporte] = useState("");
  const [fecha, setFecha] = useState("");
  const [metodo, setMetodo] = useState("Transferencia");
  const [observaciones, setObservaciones] = useState("");

  useEffect(() => {
    if (!abierto || !cobro) return;

    setImporte(
      Number(cobro.pendiente).toFixed(2)
    );

    setFecha(
      new Date().toISOString().substring(0, 10)
    );

    setMetodo("Transferencia");

    setObservaciones("");
  }, [abierto, cobro]);

  if (!abierto || !cobro) {
    return null;
  }

  async function guardar() {
  if (!cobro) return;

  const valor = Number(
    importe.replace(",", ".")
  );

    if (
      Number.isNaN(valor) ||
      valor <= 0
    ) {
      alert("Introduce un importe válido.");
      return;
    }

    if (valor > Number(cobro.pendiente)) {
      alert(
        "El importe supera el pendiente."
      );
      return;
    }

    await onGuardar({
      importe: valor,
      fecha,
      metodo,
      observaciones,
    });
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.45)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: 520,
          maxWidth: "95%",
          background: "#fff",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow:
            "0 15px 40px rgba(0,0,0,.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 20,
            borderBottom:
              "1px solid #e5e7eb",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              Registrar pago
            </div>

            <div
              style={{
                marginTop: 4,
                color: "#64748b",
                fontSize: 14,
              }}
            >
              Cobro del periodo{" "}
              {cobro.periodo_mes}/
              {cobro.periodo_anio}
            </div>
          </div>

          <button
            onClick={onCerrar}
            style={botonCerrar}
          >
            <X size={20} />
          </button>
        </div>

        <div
  style={{
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 18,
  }}
>
                  <div>
            <label style={label}>
              Importe (€)
            </label>

            <div
              style={{
                position: "relative",
              }}
            >
              <Euro
                size={18}
                style={{
                  position: "absolute",
                  left: 12,
                  top: 13,
                  color: "#64748b",
                }}
              />

              <input
                type="number"
                step="0.01"
                value={importe}
                onChange={(e) =>
                  setImporte(e.target.value)
                }
                style={{
                  ...input,
                  paddingLeft: 38,
                }}
              />
            </div>

            <div
              style={{
                marginTop: 6,
                color: "#64748b",
                fontSize: 13,
              }}
            >
              Pendiente:
              {" "}
              {Number(cobro.pendiente).toFixed(2)}
              {" "}€
            </div>
          </div>

          <div>
            <label style={label}>
              Fecha
            </label>

            <input
              type="date"
              value={fecha}
              onChange={(e) =>
                setFecha(e.target.value)
              }
              style={input}
            />
          </div>

          <div>
            <label style={label}>
              Método de pago
            </label>

            <select
              value={metodo}
              onChange={(e) =>
                setMetodo(e.target.value)
              }
              style={input}
            >
              {METODOS.map((m) => (
                <option
                  key={m}
                  value={m}
                >
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={label}>
              Observaciones
            </label>

            <textarea
              rows={4}
              value={observaciones}
              onChange={(e) =>
                setObservaciones(
                  e.target.value
                )
              }
              style={{
                ...input,
                resize: "vertical",
                minHeight: 90,
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              marginTop: 10,
            }}
          >
            <button
              type="button"
              onClick={onCerrar}
              style={botonCancelar}
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={cargando}
              onClick={guardar}
              style={botonGuardar}
            >
              {cargando
                ? "Guardando..."
                : "Guardar pago"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
const label: React.CSSProperties = {
  display: "block",
  marginBottom: 8,
  fontSize: 14,
  fontWeight: 600,
  color: "#334155",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const botonCerrar: React.CSSProperties = {
  width: 36,
  height: 36,
  border: "none",
  borderRadius: 8,
  background: "#f8fafc",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const botonCancelar: React.CSSProperties = {
  padding: "10px 18px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  background: "#ffffff",
  color: "#334155",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
};

const botonGuardar: React.CSSProperties = {
  padding: "10px 18px",
  borderRadius: 8,
  border: "none",
  background: "#2563eb",
  color: "#ffffff",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
};