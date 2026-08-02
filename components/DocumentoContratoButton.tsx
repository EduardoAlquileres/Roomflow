"use client";

import { FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Props = { habitacionId: string };

const moneda = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const fecha = (valor: string) => new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(`${valor}T12:00:00`));
const escapar = (valor: string) => valor.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const sumarMeses = (valor: string, meses: number) => { const fechaBase = new Date(`${valor}T12:00:00`); fechaBase.setMonth(fechaBase.getMonth() + meses); return fechaBase.toISOString().slice(0, 10); };

export default function DocumentoContratoButton({ habitacionId }: Props) {
  async function generar() {
    const ventana = window.open("", "_blank");
    if (!ventana) { alert("Permite las ventanas emergentes para generar el contrato."); return; }

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
      const { data: propietarios, error: errorPropietarios } = (titulares ?? []).length ? await supabase.from("propietarios").select("id, nombre_completo, documento").in("id", titulares!.map((titular) => titular.propietario_id)) : { data: [], error: null };
      if (errorPropietarios) throw errorPropietarios;
      const ids = (inquilinos ?? []).map((inquilino) => inquilino.id);
      const { data: fianzas, error: errorFianzas } = ids.length ? await supabase.from("fianzas").select("importe, importe_entregado").in("inquilino_id", ids).eq("habitacion_id", habitacionId).order("created_at", { ascending: false }).limit(1) : { data: [], error: null };
      if (errorFianzas) throw errorFianzas;
      const { data: clausulas, error: errorClausulas } = await supabase.from("clausulas_contrato").select("titulo, contenido").eq("activa", true).in("tipo_documento", ["CONTRATO", "AMBOS"]).order("orden").order("created_at");
      if (errorClausulas) throw errorClausulas;

      const inicio = inquilinos![0].fecha_entrada;
      const fin = sumarMeses(inicio, 6);
      const numeroInquilinos = inquilinos!.length;
      const renta = Number(habitacion.precio);
      const gastosPersona = Number(habitacion.gastos);
      const fianza = Math.max(Number(fianzas?.[0]?.importe ?? 0), renta * Number(habitacion.fianza_meses));
      const entregado = Number(fianzas?.[0]?.importe_entregado ?? 0);
      const propietariosTexto = (propietarios ?? []).map((propietario) => `${propietario.nombre_completo}, DNI ${propietario.documento}`).join("; ") || "Propietario pendiente de asignar";
      const inquilinosHtml = inquilinos!.map((inquilino) => `<li><strong>${escapar(`${inquilino.nombre} ${inquilino.apellidos}`)}</strong>, ${escapar(inquilino.documento)}${inquilino.nacionalidad ? `, nacionalidad ${escapar(inquilino.nacionalidad)}` : ""}</li>`).join("");
      const direccion = [vivienda.direccion || vivienda.nombre, vivienda.municipio].filter(Boolean).join(", ");
      const arrendadores = (propietarios ?? []).length > 1 ? "los ARRENDADORES" : "el ARRENDADOR";
      const arrendatarios = numeroInquilinos > 1 ? "los ARRENDATARIOS, responsables solidarios" : "el ARRENDATARIO";
      const clausulasAdicionales = (clausulas ?? []).map((clausula, indice) => `<section class="bloque"><h2>Cláusula adicional ${indice + 1}: ${escapar(clausula.titulo)}</h2><div class="caja"><p>${escapar(clausula.contenido).replace(/\n/g, "<br>")}</p></div></section>`).join("");

      ventana.document.write(`<!doctype html><html lang="es"><head><title>Contrato ${escapar(vivienda.nombre)} - ${escapar(habitacion.codigo)}</title><style>body{font-family:Arial,sans-serif;color:#172033;line-height:1.48;max-width:820px;margin:auto;padding:38px;font-size:12.5px}.titulo{text-align:center;border-bottom:3px solid #2563eb;padding-bottom:14px}.titulo h1{font-size:22px;margin:0}.sub{margin:6px 0 0;color:#526078}.bloque{margin-top:18px}.bloque h2{font-size:14px;text-transform:uppercase;color:#1d4ed8;letter-spacing:.04em;margin:0 0 8px}.caja{border:1px solid #cbd5e1;border-radius:8px;padding:12px}.caja p{margin:7px 0}.caja ul{margin:6px 0;padding-left:21px}.clausula{margin:13px 0}.clausula h3{font-size:13px;margin:0 0 4px}.fila{display:flex;justify-content:space-between;gap:24px;padding:7px 0;border-bottom:1px solid #e2e8f0}.fila:last-child{border:0}.nota{margin-top:18px;padding:12px;border-radius:8px;background:#eff6ff;color:#1e3a8a}@media print{body{padding:20px}}</style></head><body><div class="titulo"><h1>CONTRATO DE ARRENDAMIENTO DE HABITACIÓN</h1><p class="sub">${escapar(vivienda.nombre)} · Habitación ${escapar(habitacion.codigo)}</p></div><section class="bloque"><h2>Reunidos</h2><div class="caja"><p><strong>De una parte:</strong> ${escapar(propietariosTexto)}, en adelante, ${arrendadores}.</p><p><strong>De otra parte:</strong></p><ul>${inquilinosHtml}</ul><p>En adelante, ${arrendatarios}. Todos los titulares responden solidariamente de las obligaciones del presente contrato.</p></div></section><section class="bloque"><h2>Exponen</h2><div class="caja"><p>I. Los arrendadores son titulares de la vivienda situada en <strong>${escapar(direccion)}</strong>${vivienda.referencia_catastral ? `, con referencia catastral ${escapar(vivienda.referencia_catastral)}` : ""}.</p><p>II. Se arrienda exclusivamente la habitación <strong>${escapar(habitacion.codigo)}</strong>, amueblada, con derecho de uso compartido de cocina, baño y demás zonas comunes.</p><p>III. El contrato tiene naturaleza de arrendamiento de habitación en vivienda compartida y se rige por la voluntad de las partes y, supletoriamente, por los artículos 1542 y siguientes del Código Civil.</p></div></section><section class="bloque"><h2>Cláusulas</h2><div class="caja"><div class="clausula"><h3>PRIMERA. Objeto y limitaciones de uso</h3><p>La habitación se destina exclusivamente al alojamiento personal de los arrendatarios. Queda prohibido subarrendar o ceder el contrato, realizar actividades molestas, insalubres, peligrosas o ilícitas, fumar en la vivienda, instalar aparatos sin autorización, alojar o permitir la permanencia de terceros y tener animales o mascotas. No se permiten visitas en la habitación ni en las zonas comunes. El incumplimiento grave facultará la resolución del contrato, sin perjuicio de daños y perjuicios.</p></div><div class="clausula"><h3>SEGUNDA. Duración</h3><p>Duración inicial de seis meses, desde el <strong>${fecha(inicio)}</strong> hasta el <strong>${fecha(fin)}</strong>. Se prorrogará mensualmente de forma tácita salvo preaviso escrito con quince días de antelación. No cabrá desistimiento antes del cumplimiento del plazo mínimo pactado.</p></div><div class="clausula"><h3>TERCERA. Renta</h3><div class="fila"><span>Renta mensual de la habitación</span><strong>${moneda.format(renta)}</strong></div><p>Se abonará por adelantado dentro de los cinco primeros días de cada mes mediante transferencia${vivienda.entidad_bancaria ? ` a ${escapar(vivienda.entidad_bancaria)}` : ""}${vivienda.iban_cobro ? `, IBAN ${escapar(vivienda.iban_cobro)}` : ""}. El impago de una mensualidad será causa de resolución. La renta podrá actualizarse anualmente conforme al IPC interanual publicado por el INE.</p></div><div class="clausula"><h3>CUARTA. Gastos y suministros</h3><div class="fila"><span>Gastos mensuales por persona (${numeroInquilinos} ${numeroInquilinos === 1 ? "persona" : "personas"})</span><strong>${moneda.format(gastosPersona * numeroInquilinos)}</strong></div><p>Se facturan separadamente de la renta como cuota por persona para ${escapar(vivienda.suministros_contrato || "agua, luz, gas e internet")}. Podrá realizarse regularización por consumos superiores a lo razonable, previa justificación. Estos gastos no forman parte de la renta de alquiler.</p></div><div class="clausula"><h3>QUINTA. Fianza</h3><div class="fila"><span>Fianza pactada (${habitacion.fianza_meses} meses)</span><strong>${moneda.format(fianza)}</strong></div><div class="fila"><span>Entregado a cuenta de fianza</span><strong>${moneda.format(entregado)}</strong></div><div class="fila"><span>Pendiente de entregar</span><strong>${moneda.format(Math.max(fianza - entregado, 0))}</strong></div><p>La fianza responde de daños, impagos y obligaciones contractuales y no podrá aplicarse unilateralmente al pago de rentas.</p></div><div class="clausula"><h3>SEXTA. Conservación, reparaciones y obras</h3><p>Los arrendadores realizarán las reparaciones necesarias para conservar la habitabilidad. Los arrendatarios asumirán las pequeñas reparaciones derivadas del uso ordinario y responderán de daños causados por dolo o negligencia. Quedan prohibidas las obras sin autorización escrita.</p></div><div class="clausula"><h3>SÉPTIMA. Acceso</h3><p>Los arrendadores podrán acceder a las zonas comunes en cualquier momento y a la habitación previa comunicación, salvo urgencia.</p></div><div class="clausula"><h3>OCTAVA. Resolución y permanencia indebida</h3><p>Serán causas de resolución el impago, el incumplimiento de las prohibiciones anteriores, el subarriendo o cesión, los daños graves y las actividades ilícitas o molestas. En caso de permanencia tras la finalización, se abonará una indemnización diaria equivalente al doble de la renta diaria vigente.</p></div><div class="clausula"><h3>NOVENA. Jurisdicción</h3><p>Las partes se someten a los Juzgados y Tribunales del partido judicial donde radica el inmueble.</p></div></div></section><p class="nota">Documento emitido el ${fecha(new Date().toISOString().slice(0, 10))}. El envío de este documento acredita la información y los importes que en él se exponen.</p><script>window.opener=null;window.onload=()=>window.print()<\/script></body></html>`);
      if (clausulasAdicionales) ventana.document.write(clausulasAdicionales);
      ventana.document.close();
    } catch (error) {
      ventana.close();
      alert(error instanceof Error ? error.message : "No se pudo generar el contrato.");
    }
  }

  return <button type="button" onClick={generar} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"><FileText size={17} />Generar contrato de alquiler</button>;
}
