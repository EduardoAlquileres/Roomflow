"use client";

import { useEffect, useMemo, useState } from "react";
import { Euro } from "lucide-react";

import { Gasto } from "@/types/gasto";
import { Vivienda } from "@/types/vivienda";
import { Habitacion } from "@/types/habitacion";
import type {
  FormularioGasto as FormularioGastoData,
} from "@/types/formularioGasto";

import {
  CATEGORIAS_GASTO,
  METODOS_PAGO,
} from "@/constants/gastos";

import {
  label,
  input,
  textarea,
  select,
  checkboxContainer,
  row,
  column,
} from "@/styles/formStyles";

interface Props {
  gasto?: Gasto;

  viviendas: Vivienda[];

  habitaciones: Habitacion[];

  loading?: boolean;

  onGuardar: (
    datos: FormularioGastoData
  ) => Promise<void>;

  onCancelar: () => void;
}

const PERIODICIDADES = [
  "MENSUAL",
  "TRIMESTRAL",
  "ANUAL",
] as const;

const ESTADOS = [
  "PENDIENTE",
  "PAGADO",
  "ANULADO",
] as const;

const FORMULARIO_INICIAL: FormularioGastoData = {
  fecha: new Date()
    .toISOString()
    .substring(0, 10),

  vivienda_id: "",

  habitacion_id: null,

  categoria: CATEGORIAS_GASTO[0],

  concepto: "",

  proveedor: "",

  importe: 0,

  metodo_pago: null,

  es_recurrente: false,

  periodicidad: null,

  estado: "PENDIENTE",

  fecha_pago: null,

  origen: "MANUAL",

  observaciones: "",

  documento: null,
};

export default function FormularioGasto({
  gasto,
  viviendas,
  habitaciones,
  loading = false,
  onGuardar,
  onCancelar,
}: Props) {
 const [form, setForm] =
  useState<FormularioGastoData>(
      FORMULARIO_INICIAL
    );

  useEffect(() => {
    if (!gasto) {
      setForm(FORMULARIO_INICIAL);
      return;
    }

    setForm({
      fecha: gasto.fecha,

      vivienda_id: gasto.vivienda_id,

      habitacion_id:
        gasto.habitacion_id,

      categoria: gasto.categoria,

      concepto: gasto.concepto,

      proveedor:
        gasto.proveedor ?? "",

      importe: gasto.importe,

      metodo_pago:
        gasto.metodo_pago,

      es_recurrente:
        gasto.es_recurrente,

      periodicidad:
        gasto.periodicidad,

      estado: gasto.estado,

      fecha_pago:
        gasto.fecha_pago,

      origen: gasto.origen,

      observaciones:
        gasto.observaciones ?? "",

      documento:
        gasto.documento,
    });
  }, [gasto]);

  const habitacionesDisponibles =
    useMemo(() => {
      return habitaciones.filter(
        (h) =>
          h.vivienda_id ===
          form.vivienda_id
      );
    }, [
      habitaciones,
      form.vivienda_id,
    ]);

  function actualizarCampo<
  K extends keyof FormularioGastoData
>(
  campo: K,
  valor: FormularioGastoData[K]
) {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  function cambiarVivienda(
    vivienda: string
  ) {
    setForm((prev) => ({
      ...prev,
      vivienda_id: vivienda,
      habitacion_id: null,
    }));
  }

  function validarFormulario() {
    if (!form.fecha) {
      alert("Seleccione la fecha.");
      return false;
    }

    if (!form.vivienda_id) {
      alert(
        "Seleccione la vivienda."
      );
      return false;
    }

    if (!form.categoria) {
      alert(
        "Seleccione la categoría."
      );
      return false;
    }

    if (
      form.concepto.trim() === ""
    ) {
      alert(
        "Introduzca el concepto."
      );
      return false;
    }

    if (
      Number(form.importe) <= 0
    ) {
      alert(
        "El importe debe ser mayor que cero."
      );
      return false;
    }

    if (
      form.es_recurrente &&
      !form.periodicidad
    ) {
      alert(
        "Seleccione la periodicidad."
      );
      return false;
    }

    if (
      form.estado === "PAGADO" &&
      !form.fecha_pago
    ) {
      alert(
        "Indique la fecha de pago."
      );
      return false;
    }

    return true;
  }

  async function guardar() {
    if (!validarFormulario())
      return;

    await onGuardar(form);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      <div style={row}>
        <div style={column}>
          <label style={label}>
            Fecha
          </label>

          <input
            type="date"
            value={form.fecha}
            onChange={(e) =>
              actualizarCampo(
                "fecha",
                e.target.value
              )
            }
            style={input}
          />
        </div>

        <div style={column}>
          <label style={label}>
            Vivienda
          </label>

          <select
            value={form.vivienda_id}
            onChange={(e) =>
              cambiarVivienda(
                e.target.value
              )
            }
            style={select}
          >
            <option value="">
              Seleccionar...
            </option>

            {viviendas.map(
              (vivienda) => (
                <option
                  key={vivienda.id}
                  value={vivienda.id}
                >
                  {vivienda.nombre}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      <div style={row}>
        <div style={column}>
          <label style={label}>
            Habitación
          </label>

          <select
            value={
              form.habitacion_id ??
              ""
            }
            onChange={(e) =>
              actualizarCampo(
                "habitacion_id",
                e.target.value || null
              )
            }
            style={select}
          >
            <option value="">
              Gasto general
            </option>

            {habitacionesDisponibles.map(
              (habitacion) => (
                <option
                  key={
                    habitacion.id
                  }
                  value={
                    habitacion.id
                  }
                >
                  {
                    habitacion.codigo
                  }
                </option>
              )
            )}
          </select>
        </div>

        <div style={column}>
          <label style={label}>
            Categoría
          </label>

          <select
            value={form.categoria}
            onChange={(e) =>
              actualizarCampo(
                "categoria",
                e.target.value as any
              )
            }
            style={select}
          >
            {CATEGORIAS_GASTO.map(
              (
                categoria
              ) => (
                <option
                  key={
                    categoria
                  }
                  value={
                    categoria
                  }
                >
                  {
                    categoria
                  }
                </option>
              )
            )}
          </select>
        </div>
      </div>
            <div>
        <label style={label}>
          Concepto
        </label>

        <input
          type="text"
          value={form.concepto}
          onChange={(e) =>
            actualizarCampo(
              "concepto",
              e.target.value
            )
          }
          style={input}
        />
      </div>

      <div style={row}>
        <div style={column}>
          <label style={label}>
            Proveedor
          </label>

          <input
            type="text"
            value={form.proveedor}
            onChange={(e) =>
              actualizarCampo(
                "proveedor",
                e.target.value
              )
            }
            style={input}
          />
        </div>

        <div style={column}>
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
              value={form.importe}
              onChange={(e) =>
                actualizarCampo(
                  "importe",
                  Number(
                    e.target.value
                  )
                )
              }
              style={{
                ...input,
                paddingLeft: 38,
              }}
            />
          </div>
        </div>
      </div>

      <div style={row}>
        <div style={column}>
          <label style={label}>
            Método de pago
          </label>

          <select
            value={
              form.metodo_pago ?? ""
            }
            onChange={(e) =>
             actualizarCampo(
  "metodo_pago",
  (e.target.value || null) as FormularioGastoData["metodo_pago"]
)
            }
            style={select}
          >
            <option value="">
              Sin indicar
            </option>

            {METODOS_PAGO.map(
              (metodo) => (
                <option
                  key={metodo}
                  value={metodo}
                >
                  {metodo}
                </option>
              )
            )}
          </select>
        </div>

        <div style={column}>
          <label style={label}>
            Estado
          </label>

          <select
            value={form.estado}
            onChange={(e) =>
              actualizarCampo(
                "estado",
                e.target.value as any
              )
            }
            style={select}
          >
            {ESTADOS.map(
              (estado) => (
                <option
                  key={estado}
                  value={estado}
                >
                  {estado}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      <div style={checkboxContainer}>
        <input
          type="checkbox"
          checked={form.es_recurrente}
          onChange={(e) =>
            actualizarCampo(
              "es_recurrente",
              e.target.checked
            )
          }
        />

        <span>
          Gasto recurrente
        </span>
      </div>

      {form.es_recurrente && (
        <div>
          <label style={label}>
            Periodicidad
          </label>

          <select
            value={
              form.periodicidad ??
              ""
            }
            onChange={(e) =>
              actualizarCampo(
                "periodicidad",
                e.target.value as any
              )
            }
            style={select}
          >
            <option value="">
              Seleccionar...
            </option>

            {PERIODICIDADES.map(
              (
                periodicidad
              ) => (
                <option
                  key={
                    periodicidad
                  }
                  value={
                    periodicidad
                  }
                >
                  {
                    periodicidad
                  }
                </option>
              )
            )}
          </select>
        </div>
      )}

      {form.estado ===
        "PAGADO" && (
        <div>
          <label style={label}>
            Fecha de pago
          </label>

          <input
            type="date"
            value={
              form.fecha_pago ??
              ""
            }
            onChange={(e) =>
              actualizarCampo(
                "fecha_pago",
                e.target.value
              )
            }
            style={input}
          />
        </div>
      )}

      <div>
        <label style={label}>
          Documento
        </label>

        <input
          type="text"
          placeholder="Ruta o nombre del documento"
          value={
            form.documento ??
            ""
          }
          onChange={(e) =>
            actualizarCampo(
              "documento",
              e.target.value ||
                null
            )
          }
          style={input}
        />
      </div>

      <div>
        <label style={label}>
          Observaciones
        </label>

        <textarea
          rows={5}
          value={
            form.observaciones
          }
          onChange={(e) =>
            actualizarCampo(
              "observaciones",
              e.target.value
            )
          }
          style={textarea}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent:
            "flex-end",
          gap: 12,
          marginTop: 12,
        }}
      >
        <button
          type="button"
          onClick={
            onCancelar
          }
          style={{
            padding:
              "10px 18px",
            borderRadius: 8,
            border:
              "1px solid #d1d5db",
            background:
              "#ffffff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Cancelar
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={guardar}
          style={{
            padding:
              "10px 18px",
            borderRadius: 8,
            border: "none",
            background:
              "#2563eb",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {loading
            ? "Guardando..."
            : gasto
            ? "Guardar cambios"
            : "Crear gasto"}
        </button>
      </div>
    </div>
  );
}