"use client";

import { renderizarContrato } from "@/lib/modelosDocumentos";
import { FileText } from "lucide-react";
import { supabase } from "#roomflow-supabase";

type Props = { habitacionId: string };

const moneda = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const fecha = (valor: string) => new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(`${valor}T12:00:00`));
const escapar = (valor: string) => valor.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const sumarMeses = (valor: string, meses: number) => {
  const fechaBase = new Date(`${valor}T12:00:00`);
  fechaBase.setMonth(fechaBase.getMonth() + meses);
  return fechaBase.toISOString().slice(0, 10);
};
const normalizar = (valor: string) => valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default function DocumentoContratoButton({ habitacionId }: Props) {
  async function generar() {
    const ventana = window.open("", "_blank");
    if (!ventana) {
      alert("Permite las ventanas emergentes para generar el contrato.");
      return;
    }

    try {
      const { data: habitacion, error: errorHabitacion } = await supabase.from("habitaciones").select("*").eq("id", habitacionId).single();
      if (errorHabitacion) throw errorHabitacion;
      const { data: vivienda, error: errorVivienda } = await supabase.from("viviendas").select("*").eq("id", habitacion.vivienda_id).single();
      if (errorVivienda) throw errorVivienda;
      const { data: inquilinos, error: errorInquilinos } = await supabase.from("inquilinos").select("*").eq("habitacion_id", habitacionId).eq("activo", true).order("created_at");
      if (errorInquilinos) throw errorInquilinos;
      if (!(inquilinos ?? []).length) throw new Error("No hay titulares activos para generar el contrato.");

      const { data: titulares, error: errorTitulares } = await supabase.from("vivienda_propietarios").select("propietario_id").eq("vivienda_id", vivienda.id);
      if (errorTitulares) throw errorTitulares;
      const { data: propietarios, error: errorPropietarios } = (titulares ?? []).length
        ? await supabase.from("propietarios").select("id, nombre_completo, documento").in("id", titulares!.map((titular) => titular.propietario_id))
        : { data: [], error: null };
      if (errorPropietarios) throw errorPropietarios;

      const ids = inquilinos!.map((inquilino) => inquilino.id);
      const { data: fianzas, error: errorFianzas } = ids.length
        ? await supabase.from("fianzas").select("importe, importe_entregado").in("inquilino_id", ids).eq("habitacion_id", habitacionId).order("created_at", { ascending: false }).limit(1)
        : { data: [], error: null };
      if (errorFianzas) throw errorFianzas;
      const { data: clausulas, error: errorClausulas } = await supabase.from("clausulas_contrato").select("titulo, contenido").eq("activa", true).in("tipo_documento", ["CONTRATO", "AMBOS"]).order("orden").order("created_at");
      if (errorClausulas) throw errorClausulas;

      const inicio = inquilinos![0].fecha_entrada;
      const esMontuiri = normalizar(vivienda.nombre).includes("montuiri");
      const fin = sumarMeses(inicio, esMontuiri ? 10 : 6);
      const numeroInquilinos = inquilinos!.length;
      const renta = Number(habitacion.precio);
      const gastosPersona = Number(habitacion.gastos);
      const fianza = Math.max(Number(fianzas?.[0]?.importe ?? 0), renta * Number(habitacion.fianza_meses));
      const entregado = Number(fianzas?.[0]?.importe_entregado ?? 0);
      const propietariosTexto = (propietarios ?? []).map((propietario) => `${propietario.nombre_completo}, DNI ${propietario.documento}`).join("; ") || "Propietario pendiente de asignar";
      const direccion = [vivienda.direccion || vivienda.nombre, vivienda.municipio].filter(Boolean).join(", ");
      const clausulasAdicionales = (clausulas ?? []).map((clausula, indice) => `<section class="bloque adicional"><h2>Cláusula adicional ${indice + 1}: ${escapar(clausula.titulo)}</h2><div class="caja"><p>${escapar(clausula.contenido).replace(/\n/g, "<br>")}</p></div></section>`).join("");
      const titularesContrato = inquilinos!.map((inquilino) => {
        const nombre = escapar(`${inquilino.nombre} ${inquilino.apellidos}`.trim());
        const documento = escapar(inquilino.documento || "Documento pendiente");
        const nacionalidad = inquilino.nacionalidad ? `, de nacionalidad ${escapar(inquilino.nacionalidad)}` : "";
        return `D./Dña. <strong>${nombre}</strong>, mayor de edad, con documento ${documento}${nacionalidad}`;
      });
      const bloqueTitulares = numeroInquilinos === 1
        ? `<p><strong>Y, de otra parte,</strong> ${titularesContrato[0]} (en adelante, la <strong>PARTE ARRENDATARIA</strong>).</p>`
        : `<p><strong>Y, de otra parte, las siguientes personas:</strong></p><ol>${titularesContrato.map((titular) => `<li>${titular}.</li>`).join("")}</ol><p>En adelante, las <strong>PARTES ARRENDATARIAS</strong>, que responden solidariamente de todas las obligaciones de este contrato.</p>`;

      const titulo = esMontuiri ? "CONTRATO DE ARRENDAMIENTO DE HABITACIÓN" : "CONTRATO DE ALQUILER DE HABITACIÓN";
      const duracion = esMontuiri ? "diez meses" : "seis meses";
      const documento = renderizarContrato({
        vivienda: escapar(vivienda.nombre),
        habitacion: escapar(habitacion.codigo),
        titulo: titulo,
        municipio: escapar(vivienda.municipio || vivienda.nombre),
        fechaEmision: fecha(new Date().toISOString().slice(0, 10)),
        propietarios: escapar(propietariosTexto),
        titularesHtml: bloqueTitulares,
        direccion: escapar(direccion),
        referenciaCatastralHtml: vivienda.referencia_catastral ? `, con referencia catastral ${escapar(vivienda.referencia_catastral)}` : "",
        duracion: duracion,
        inicio: fecha(inicio),
        fin: fecha(fin),
        renta: moneda.format(renta),
        bancoHtml: vivienda.entidad_bancaria ? ` a ${escapar(vivienda.entidad_bancaria)}` : "",
        ibanHtml: vivienda.iban_cobro ? `, IBAN ${escapar(vivienda.iban_cobro)}` : "",
        numeroPersonas: numeroInquilinos,
        personasEtiqueta: numeroInquilinos === 1 ? "persona" : "personas",
        gastos: moneda.format(gastosPersona * numeroInquilinos),
        suministros: escapar(vivienda.suministros_contrato || "agua, luz, gas e internet"),
        fianza: moneda.format(fianza),
        entregado: moneda.format(entregado),
        pendiente: moneda.format(Math.max(fianza - entregado, 0)),
        clausulasHtml: clausulasAdicionales,
        firmantesSufijo: numeroInquilinos > 1 ? " / partes arrendatarias" : "",
      });

      ventana.document.write(documento);
      ventana.document.close();
    } catch (error) {
      ventana.close();
      alert(error instanceof Error ? error.message : "No se pudo generar el contrato.");
    }
  }

  return <button type="button" onClick={generar} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"><FileText size={17} />Generar contrato de alquiler</button>;
}
