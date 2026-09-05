"use client";

import { FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Props = {
  fianzaId: string;
  cuota: {
    numero: number;
    fecha_prevista: string;
    fecha_pago: string | null;
    importe: number;
    importe_pagado: number;
  };
};

const moneda = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const formatoFecha = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "long", year: "numeric" });
const escapar = (texto: string) => texto.replace(/[&<>'"]/g, (caracter) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[caracter] ?? caracter);

export default function ReciboCuotaFianzaButton({ fianzaId, cuota }: Props) {
  async function generar() {
    const ventana = window.open("", "_blank");
    if (!ventana) {
      alert("Permite las ventanas emergentes para generar el recibo.");
      return;
    }
    ventana.document.write("<title>Generando recibo</title><p style='font-family:Arial;padding:24px'>Generando recibo de fianza...</p>");

    try {
      const { data: fianza, error: errorFianza } = await supabase
        .from("fianzas")
        .select("habitacion_id, estancia_id, inquilino_id, importe")
        .eq("id", fianzaId)
        .single();
      if (errorFianza) throw errorFianza;

      const { data: estancia, error: errorEstancia } = await supabase
        .from("estancias")
        .select("habitacion_id, fecha_entrada")
        .eq("id", fianza.estancia_id)
        .single();
      if (errorEstancia) throw errorEstancia;

      const { data: estanciasGrupo, error: errorGrupo } = await supabase
        .from("estancias")
        .select("inquilino_id")
        .eq("habitacion_id", estancia.habitacion_id)
        .eq("fecha_entrada", estancia.fecha_entrada);
      if (errorGrupo) throw errorGrupo;
      const idsTitulares = [...new Set((estanciasGrupo ?? []).map((item) => item.inquilino_id).concat(fianza.inquilino_id))];
      const { data: titulares, error: errorTitulares } = await supabase
        .from("inquilinos")
        .select("nombre, apellidos, documento")
        .in("id", idsTitulares);
      if (errorTitulares) throw errorTitulares;

      const { data: habitacion, error: errorHabitacion } = await supabase
        .from("habitaciones")
        .select("codigo, vivienda_id")
        .eq("id", fianza.habitacion_id)
        .single();
      if (errorHabitacion) throw errorHabitacion;
      const { data: vivienda, error: errorVivienda } = await supabase
        .from("viviendas")
        .select("id, nombre, direccion, municipio")
        .eq("id", habitacion.vivienda_id)
        .single();
      if (errorVivienda) throw errorVivienda;

      const { data: enlaces, error: errorEnlaces } = await supabase
        .from("vivienda_propietarios")
        .select("propietario_id")
        .eq("vivienda_id", vivienda.id);
      if (errorEnlaces) throw errorEnlaces;
      const propietariosIds = (enlaces ?? []).map((enlace) => enlace.propietario_id);
      const { data: propietarios, error: errorPropietarios } = propietariosIds.length
        ? await supabase.from("propietarios").select("nombre_completo, documento").in("id", propietariosIds)
        : { data: [], error: null };
      if (errorPropietarios) throw errorPropietarios;

      const propietariosTexto = (propietarios ?? []).map((propietario) => `${propietario.nombre_completo} (${propietario.documento})`).join(" · ") || "Propietario pendiente de asignar";
      const titularesTexto = (titulares ?? []).map((titular) => `${titular.nombre} ${titular.apellidos} (${titular.documento || "Sin documento"})`).join(" · ") || "Inquilino pendiente de identificar";
      const fechaPago = cuota.fecha_pago || cuota.fecha_prevista;
      const importeRecibido = Number(cuota.importe_pagado);
      const importePendienteCuota = Math.max(Number(cuota.importe) - importeRecibido, 0);
      const direccion = [vivienda.direccion, vivienda.municipio].filter(Boolean).join(", ");
      const documento = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Recibo de fianza - ${escapar(vivienda.nombre)} ${escapar(habitacion.codigo)}</title><style>body{font-family:Arial,sans-serif;color:#172033;padding:42px;max-width:720px;margin:auto}.acciones{position:sticky;top:0;display:flex;justify-content:flex-end;gap:10px;margin:-24px -24px 24px;padding:12px 24px;background:rgba(255,255,255,.96);border-bottom:1px solid #e2e8f0}.acciones button{border:1px solid #cbd5e1;border-radius:9px;background:#fff;padding:10px 14px;font-size:14px;font-weight:700}.acciones .imprimir{border-color:#2563eb;background:#2563eb;color:#fff}.cabecera{display:flex;justify-content:space-between;gap:20px;border-bottom:3px solid #2563eb;padding-bottom:18px}.titulo{font-size:25px;font-weight:700}.meta{color:#5b677c;text-align:right}.bloque{margin-top:26px}.etiqueta{font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.05em}.valor{font-size:16px;margin-top:5px}.fila{display:flex;justify-content:space-between;gap:20px;padding:13px 0;border-bottom:1px solid #e2e8f0}.total{font-size:20px;font-weight:700;border-top:2px solid #172033;padding-top:16px;margin-top:10px}.nota{margin-top:25px;border:1px solid #bfdbfe;background:#eff6ff;border-radius:10px;padding:14px 16px;color:#1e3a8a}@media(max-width:600px){body{padding:18px}.acciones{margin:-8px -8px 20px;padding:10px 8px}.cabecera{display:block}.meta{text-align:left;margin-top:10px}}@media print{body{padding:24px}.acciones{display:none}}</style></head><body><div class="acciones"><button type="button" onclick="history.back()">Volver</button><button type="button" class="imprimir" onclick="window.print()">Imprimir o guardar</button></div><div class="cabecera"><div><div class="titulo">RECIBO DE FIANZA</div><div class="meta" style="text-align:left">Justificante de entrega de depósito</div></div><div class="meta">Fecha de pago: ${escapar(formatoFecha.format(new Date(`${fechaPago}T12:00:00`)))}</div></div><div class="bloque"><div class="etiqueta">Propietario(s)</div><div class="valor">${escapar(propietariosTexto)}</div></div><div class="bloque"><div class="etiqueta">Inquilino(s) titular(es)</div><div class="valor">${escapar(titularesTexto)}</div></div><div class="bloque"><div class="etiqueta">Vivienda y habitación</div><div class="valor">${escapar(vivienda.nombre)}${direccion ? ` · ${escapar(direccion)}` : ""}<br>Habitación: ${escapar(habitacion.codigo)}</div></div><div class="bloque"><div class="etiqueta">Detalle de la entrega</div><div class="fila"><span>Cuota de fianza nº ${cuota.numero}</span><strong>${moneda.format(Number(cuota.importe))}</strong></div><div class="fila total"><span>Importe recibido</span><strong>${moneda.format(importeRecibido)}</strong></div><div class="fila"><span>Pendiente de esta cuota</span><strong>${moneda.format(importePendienteCuota)}</strong></div><div class="fila"><span>Fianza total pactada</span><strong>${moneda.format(Number(fianza.importe))}</strong></div></div><p class="nota">Se deja constancia de la cantidad recibida como entrega a cuenta de la fianza de la habitación indicada. Este recibo no constituye renta ni pago de suministros.</p></body></html>`;
      ventana.document.open();
      ventana.document.write(documento);
      ventana.document.close();
    } catch (error) {
      ventana.close();
      alert(error instanceof Error ? error.message : "No se pudo generar el recibo de fianza.");
    }
  }

  return <button type="button" onClick={generar} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700"><FileText size={16} /> Recibo</button>;
}
