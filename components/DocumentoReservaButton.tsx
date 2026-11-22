"use client";

import { renderizarReserva } from "@/lib/modelosDocumentos";
import { FileText } from "lucide-react";
import { supabase } from "#roomflow-supabase";

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
      const { data: clausulas, error: errorClausulas } = await supabase.from("clausulas_contrato").select("titulo, contenido").eq("activa", true).in("tipo_documento", ["RESERVA", "AMBOS"]).order("orden").order("created_at");
      if (errorClausulas) throw errorClausulas;

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
      const clausulasAdicionales = (clausulas ?? []).map((clausula, indice) => `<section class="seccion"><h2>Cláusula adicional ${indice + 1}: ${escapar(clausula.titulo)}</h2><div class="caja"><p>${escapar(clausula.contenido).replace(/\n/g, "<br>")}</p></div></section>`).join("");

      ventana.document.write(renderizarReserva({
        vivienda: escapar(vivienda.nombre),
        habitacion: escapar(habitacion.codigo),
        propietarios: escapar(listaPropietarios),
        titularesHtml: listaInquilinos,
        direccion: escapar(vivienda.direccion || vivienda.nombre),
        municipioHtml: vivienda.municipio ? `, ${escapar(vivienda.municipio)}` : "",
        inicio: fecha(inquilinos?.[0]?.fecha_entrada ?? fechaReserva),
        renta: moneda.format(Number(habitacion.precio)),
        numeroPersonas: numeroInquilinos,
        personasEtiqueta: numeroInquilinos === 1 ? "persona" : "personas",
        gastos: moneda.format(gastosTotales),
        mesesFianza: habitacion.fianza_meses,
        fianza: moneda.format(fianzaTotal),
        entregado: moneda.format(importeEntregado),
        pendiente: moneda.format(Math.max(fianzaTotal - importeEntregado, 0)),
        fechaEmision: fecha(fechaReserva),
        clausulasHtml: clausulasAdicionales,
      }));
      ventana.document.close();
    } catch (error) {
      ventana.close();
      const mensaje = typeof error === "object" && error && "message" in error && typeof error.message === "string" ? error.message : "No se pudo generar el documento de reserva.";
      alert(mensaje);
    }
  }

  return <button type="button" onClick={generar} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"><FileText size={17} />Generar documento de reserva</button>;
}
