"use client";

import { FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Props = { habitacionId: string };

const moneda = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const fecha = (valor: string) => new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(`${valor}T12:00:00`));
const escapar = (valor: string) => valor.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export default function DocumentoReservaButton({ habitacionId }: Props) {
  async function generar() {
    const ventana = window.open("", "_blank");
    if (!ventana) { alert("Permite las ventanas emergentes para generar el documento."); return; }

    try {
      const { data: habitacion, error: errorHabitacion } = await supabase.from("habitaciones").select("*").eq("id", habitacionId).single();
      if (errorHabitacion) throw errorHabitacion;
      const { data: vivienda, error: errorVivienda } = await supabase.from("viviendas").select("*").eq("id", habitacion.vivienda_id).single();
      if (errorVivienda) throw errorVivienda;
      const { data: inquilinos, error: errorInquilinos } = await supabase.from("inquilinos").select("*").eq("habitacion_id", habitacionId).eq("activo", true).order("created_at");
      if (errorInquilinos) throw errorInquilinos;
      const ids = (inquilinos ?? []).map((inquilino) => inquilino.id);
      const { data: titulares, error: errorTitulares } = await supabase.from("vivienda_propietarios").select("propietario_id, porcentaje").eq("vivienda_id", vivienda.id);
      if (errorTitulares) throw errorTitulares;
      const { data: propietarios, error: errorPropietarios } = (titulares ?? []).length ? await supabase.from("propietarios").select("id, nombre_completo, documento").in("id", titulares!.map((titular) => titular.propietario_id)) : { data: [], error: null };
      if (errorPropietarios) throw errorPropietarios;
      const { data: fianzas, error: errorFianzas } = ids.length ? await supabase.from("fianzas").select("*").in("inquilino_id", ids).eq("habitacion_id", habitacionId).eq("estado", "COBRADA").order("created_at", { ascending: false }).limit(1) : { data: [], error: null };
      if (errorFianzas) throw errorFianzas;

      const { data: cobrosReserva, error: errorCobrosReserva } = ids.length ? await supabase.from("cobros").select("id, pagado").eq("habitacion_id", habitacionId).in("inquilino_id", ids) : { data: [], error: null };
      if (errorCobrosReserva) throw errorCobrosReserva;
      const cobroIds = (cobrosReserva ?? []).map((cobro) => cobro.id);
      const { data: pagosReserva, error: errorPagosReserva } = cobroIds.length ? await supabase.from("movimientos_cobro").select("importe").in("cobro_id", cobroIds).eq("observaciones", "Importe de reserva") : { data: [], error: null };
      if (errorPagosReserva) throw errorPagosReserva;

      const fianza = fianzas?.[0];
      const listaPropietarios = (propietarios ?? []).map((propietario) => `${propietario.nombre_completo}, DNI ${propietario.documento}`).join(" · ") || "Propietario pendiente de asignar";
      const listaInquilinos = (inquilinos ?? []).map((inquilino) => `<li><strong>${escapar(`${inquilino.nombre} ${inquilino.apellidos}`)}</strong>, ${escapar(inquilino.documento)}${inquilino.telefono ? ` · Tel. ${escapar(inquilino.telefono)}` : ""}</li>`).join("");
      const numeroInquilinos = Math.max(ids.length, 1);
      const gastosTotales = Number(habitacion.gastos) * numeroInquilinos;
      const fianzaTotal = Math.max(Number(fianza?.importe ?? 0), Number(habitacion.precio) * Number(habitacion.fianza_meses));
      const reservaAnterior = (pagosReserva ?? []).reduce((suma, pago) => suma + Number(pago.importe), 0);
      const importeMarcadoEnCobro = (cobrosReserva ?? []).reduce((suma, cobro) => suma + Number(cobro.pagado), 0);
      const importeEntregado = Math.max(Number(fianza?.importe_entregado ?? 0), reservaAnterior, importeMarcadoEnCobro);
      const fechaReserva = fianza?.fecha_cobro || new Date().toISOString().slice(0, 10);

      ventana.document.write(`<!doctype html><html lang="es"><head><title>Reserva ${escapar(vivienda.nombre)} - ${escapar(habitacion.codigo)}</title><style>body{font-family:Arial,sans-serif;color:#172033;line-height:1.35;max-width:760px;margin:auto;padding:30px;font-size:13px}.titulo{text-align:center;border-bottom:3px solid #2563eb;padding-bottom:12px}.titulo h1{font-size:22px;margin:0}.titulo p{margin:5px 0 0;color:#526078}.seccion{margin-top:16px}.seccion h2{font-size:14px;text-transform:uppercase;color:#1d4ed8;letter-spacing:.04em;margin:0 0 7px}.caja{border:1px solid #cbd5e1;border-radius:8px;padding:11px}.caja p{margin:5px 0}.caja ul{margin:5px 0;padding-left:20px}.fila{display:flex;justify-content:space-between;gap:24px;padding:7px 0;border-bottom:1px solid #e2e8f0}.fila:last-child{border:0}@media print{body{padding:18px}}</style></head><body><div class="titulo"><h1>DOCUMENTO DE RESERVA DE HABITACIÓN</h1><p>${escapar(vivienda.nombre)} · Habitación ${escapar(habitacion.codigo)}</p></div><section class="seccion"><h2>Partes</h2><div class="caja"><p><strong>Propietario(s):</strong> ${escapar(listaPropietarios)}</p><p><strong>Reservatario(s), responsables solidarios:</strong></p><ul>${listaInquilinos}</ul></div></section><section class="seccion"><h2>Objeto de la reserva</h2><div class="caja"><p>Se reserva la habitación <strong>${escapar(habitacion.codigo)}</strong> de la vivienda situada en <strong>${escapar(vivienda.direccion || vivienda.nombre)}</strong>${vivienda.municipio ? `, ${escapar(vivienda.municipio)}` : ""}, para la entrada prevista el <strong>${fecha(inquilinos?.[0]?.fecha_entrada ?? fechaReserva)}</strong>.</p><p>Los reservatarios asumirán solidariamente las obligaciones derivadas del contrato de alquiler que se formalizará para esta habitación.</p></div></section><section class="seccion"><h2>Condiciones económicas</h2><div class="caja"><div class="fila"><span>Alquiler mensual de la habitación</span><strong>${moneda.format(Number(habitacion.precio))}</strong></div><div class="fila"><span>Gastos por persona (${numeroInquilinos} ${numeroInquilinos === 1 ? "persona" : "personas"})</span><strong>${moneda.format(gastosTotales)}</strong></div><div class="fila"><span>Fianza total pactada (${habitacion.fianza_meses} meses)</span><strong>${moneda.format(fianzaTotal)}</strong></div><div class="fila"><span>Pago a cuenta de la fianza recibido con la reserva</span><strong>${moneda.format(importeEntregado)}</strong></div><div class="fila"><span>Fianza pendiente de entregar</span><strong>${moneda.format(Math.max(fianzaTotal - importeEntregado, 0))}</strong></div></div></section><section class="seccion"><h2>Acuerdo</h2><div class="caja"><p>La cantidad entregada como reserva se imputa exclusivamente a la fianza y no constituye renta ni pago de gastos. El resto de condiciones se concretará en el contrato de alquiler de habitación.</p><p>El envío de este documento acredita la información y los importes que en él se exponen.</p><p>Documento emitido el ${fecha(fechaReserva)}.</p></div></section><script>window.opener=null;window.onload=()=>window.print()<\/script></body></html>`);
      ventana.document.close();
    } catch (error) {
      ventana.close();
      const mensaje = typeof error === "object" && error && "message" in error && typeof error.message === "string" ? error.message : "No se pudo generar el documento de reserva.";
      alert(mensaje);
    }
  }

  return <button type="button" onClick={generar} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"><FileText size={17} />Generar documento de reserva</button>;
}
