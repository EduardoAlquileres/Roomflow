"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Calendar,
  Euro,
  CreditCard,
  Trash2,
  Pencil,
} from "lucide-react";

import { Cobro } from "@/types/cobro";

import {
  MovimientoCobro,
  obtenerMovimientos,
  eliminarMovimiento,
  actualizarMovimiento,
  actualizarCobroDesdeMovimientos,
} from "@/lib/movimientosCobro";

type Props = {
  abierto: boolean;
  cobro: Cobro | null;

  onCerrar: () => void;

  onActualizado: () => Promise<void>;
};

export default function HistorialCobrosModal({
  abierto,
  cobro,
  onCerrar,
  onActualizado,
}: Props) {
  const [cargando, setCargando] = useState(false);

  const [movimientos, setMovimientos] = useState<
    MovimientoCobro[]
  >([]);
  const [editando, setEditando] = useState<MovimientoCobro | null>(null);
  const [importeEdicion, setImporteEdicion] = useState("");
  const [fechaEdicion, setFechaEdicion] = useState("");
  const [metodoEdicion, setMetodoEdicion] = useState("");
  const [observacionesEdicion, setObservacionesEdicion] = useState("");
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [errorEdicion, setErrorEdicion] = useState("");

  async function cargar() {
    if (!cobro) return;

    setCargando(true);

    try {
      const datos = await obtenerMovimientos(
        cobro.id
      );

      setMovimientos(datos);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    if (abierto && cobro) {
      cargar();
    }
  }, [abierto, cobro]);

  if (!abierto || !cobro) {
    return null;
  }

  async function borrar(
    movimiento: MovimientoCobro
  ) {
    const confirmar = confirm(
      "¿Desea eliminar este pago?"
    );

    if (!confirmar) return;

    await eliminarMovimiento(
      movimiento.id
    );

    if (!cobro) return;

await actualizarCobroDesdeMovimientos(
  cobro.id
);

    await cargar();

    await onActualizado();
  }

  function abrirEdicion(movimiento: MovimientoCobro) {
    setEditando(movimiento);
    setImporteEdicion(String(movimiento.importe));
    setFechaEdicion(movimiento.fecha.slice(0, 10));
    setMetodoEdicion(movimiento.metodo);
    setObservacionesEdicion(movimiento.observaciones ?? "");
    setErrorEdicion("");
  }

  async function guardarEdicion() {
    if (!editando || !cobro) return;
    const importe = Number(importeEdicion.replace(",", "."));
    if (!fechaEdicion || !metodoEdicion || !Number.isFinite(importe) || importe <= 0) {
      setErrorEdicion("Indica una fecha, método e importe válido.");
      return;
    }
    setGuardandoEdicion(true);
    setErrorEdicion("");
    try {
      await actualizarMovimiento(editando.id, { fecha: fechaEdicion, importe, metodo: metodoEdicion, observaciones: observacionesEdicion.trim() || null });
      await actualizarCobroDesdeMovimientos(cobro.id);
      await cargar();
      await onActualizado();
      setEditando(null);
    } catch (error) {
      setErrorEdicion(error instanceof Error ? error.message : "No se pudo modificar el pago.");
    } finally {
      setGuardandoEdicion(false);
    }
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
          width: 720,
          maxWidth: "95%",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#ffffff",
          borderRadius: 14,
          boxShadow:
            "0 20px 50px rgba(0,0,0,.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 22,
            borderBottom:
              "1px solid #e5e7eb",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              Historial de pagos
            </div>

            <div
              style={{
                marginTop: 4,
                color: "#64748b",
                fontSize: 14,
              }}
            >
              Periodo {cobro.periodo_mes}/
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
  }}
>
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 16,
      marginBottom: 24,
    }}
  >
            <Tarjeta
              titulo="Total"
              valor={Number(cobro.total).toFixed(2)}
            />

            <Tarjeta
              titulo="Pagado"
              valor={Number(cobro.pagado).toFixed(2)}
            />

            <Tarjeta
              titulo="Pendiente"
              valor={Number(cobro.pendiente).toFixed(2)}
            />
          </div>

          {cargando ? (
            <p>Cargando historial...</p>
          ) : movimientos.length === 0 ? (
            <div
              style={{
                padding: 30,
                textAlign: "center",
                color: "#64748b",
                border: "1px dashed #cbd5e1",
                borderRadius: 10,
              }}
            >
              No existen pagos registrados.
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {movimientos.map((movimiento) => (
                <div
                  key={movimiento.id}
                  style={fila}
                >
                  <div
                    style={{
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 10,
                        color: "#475569",
                        fontSize: 14,
                      }}
                    >
                      <Calendar size={16} />

                      <strong>
                        {movimiento.fecha}
                      </strong>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 10,
                      }}
                    >
                      <Euro size={16} />

                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 18,
                          color: "#16a34a",
                        }}
                      >
                        {Number(
                          movimiento.importe
                        ).toFixed(2)}{" "}
                        €
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom:
                          movimiento.observaciones
                            ? 10
                            : 0,
                        color: "#475569",
                      }}
                    >
                      <CreditCard size={16} />

                      <span>
                        {movimiento.metodo}
                      </span>
                    </div>

                    {movimiento.observaciones && (
                      <div
                        style={{
                          color: "#64748b",
                          fontSize: 14,
                          whiteSpace:
                            "pre-wrap",
                        }}
                      >
                        {
                          movimiento.observaciones
                        }
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <button
                      style={botonEditar}
                      title="Editar pago"
                      onClick={() => abrirEdicion(movimiento)}
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      style={botonEliminar}
                      title="Eliminar pago"
                      onClick={() =>
                        borrar(
                          movimiento
                        )
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
                  </div>
        {editando && <div style={overlayEdicion}>
          <div style={modalEdicion}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}><div><h3 style={{ margin: 0, fontSize: 20 }}>Modificar pago</h3><p style={{ margin: "5px 0 0", color: "#64748b", fontSize: 14 }}>El total del cobro se recalculará automáticamente.</p></div><button onClick={() => setEditando(null)} style={botonCerrar}><X size={20} /></button></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 20 }}>
              <label style={labelEdicion}>Fecha<input type="date" value={fechaEdicion} onChange={(event) => setFechaEdicion(event.target.value)} style={inputEdicion} /></label>
              <label style={labelEdicion}>Importe (€)<input inputMode="decimal" value={importeEdicion} onChange={(event) => setImporteEdicion(event.target.value)} style={inputEdicion} /></label>
              <label style={labelEdicion}>Método<select value={metodoEdicion} onChange={(event) => setMetodoEdicion(event.target.value)} style={inputEdicion}><option value="EFECTIVO">Efectivo</option><option value="BIZUM">Bizum</option><option value="TRANSFERENCIA">Transferencia</option><option value="TARJETA">Tarjeta</option></select></label>
              <label style={{ ...labelEdicion, gridColumn: "1 / -1" }}>Observaciones<textarea rows={3} value={observacionesEdicion} onChange={(event) => setObservacionesEdicion(event.target.value)} style={inputEdicion} /></label>
            </div>
            {errorEdicion && <p style={{ color: "#b91c1c", fontSize: 14 }}>{errorEdicion}</p>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}><button onClick={() => setEditando(null)} style={botonEditar}>Cancelar</button><button onClick={guardarEdicion} disabled={guardandoEdicion} style={botonGuardar}>{guardandoEdicion ? "Guardando..." : "Guardar cambios"}</button></div>
          </div>
        </div>}
      </div>
    </div>
  );
}

type TarjetaProps = {
  titulo: string;
  valor: string;
};

function Tarjeta({
  titulo,
  valor,
}: TarjetaProps) {
  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        padding: 16,
        background: "#f8fafc",
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: "#64748b",
          marginBottom: 8,
        }}
      >
        {titulo}
      </div>

      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: "#0f172a",
        }}
      >
        {valor} €
      </div>
    </div>
  );
}
const fila: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 20,
  padding: 18,
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  background: "#ffffff",
};

const botonCerrar: React.CSSProperties = {
  width: 38,
  height: 38,
  border: "none",
  borderRadius: 8,
  background: "#f8fafc",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const botonEditar: React.CSSProperties = {
  width: 36,
  height: 36,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  background: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const botonEliminar: React.CSSProperties = {
  width: 36,
  height: 36,
  border: "none",
  borderRadius: 8,
  background: "#dc2626",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const overlayEdicion: React.CSSProperties = { position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(15,23,42,.5)" };
const modalEdicion: React.CSSProperties = { width: 520, maxWidth: "100%", borderRadius: 14, padding: 22, background: "#fff", boxShadow: "0 20px 50px rgba(0,0,0,.25)" };
const labelEdicion: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6, fontSize: 14, fontWeight: 600, color: "#334155" };
const inputEdicion: React.CSSProperties = { boxSizing: "border-box", width: "100%", border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px", font: "inherit", fontWeight: 400 };
const botonGuardar: React.CSSProperties = { border: "none", borderRadius: 8, padding: "10px 16px", background: "#2563eb", color: "#fff", fontWeight: 700, cursor: "pointer" };
