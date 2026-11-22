import { renderizarContrato, renderizarReserva } from "./modelosDocumentos";
import type { ClausulaContrato } from "@/types";

export const plantillasContrato = [
  { id: "general", nombre: "Contrato de alquiler · General", tipo: "Contrato", descripcion: "Modelo para las viviendas distintas de Montuïri. Duración inicial de seis meses.", detalle: "6 meses · uno o varios titulares" },
  { id: "montuiri", nombre: "Contrato de arrendamiento · Montuïri", tipo: "Contrato", descripcion: "Modelo utilizado para las habitaciones de Montuïri. Duración inicial de diez meses.", detalle: "10 meses · uno o varios titulares" },
  { id: "reserva", nombre: "Reserva de habitación", tipo: "Reserva", descripcion: "Identificación de las partes, entrada prevista y pago a cuenta de la fianza.", detalle: "Todas las viviendas" },
  { id: "finalizacion", nombre: "Finalización del contrato", tipo: "Finalización", descripcion: "Fin de la estancia, entrega de llaves, fianza y liquidación de alquiler y gastos.", detalle: "Todas las viviendas · PDF" },
] as const;
export type PlantillaId = typeof plantillasContrato[number]["id"];
const escapar = (valor: string) => valor.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function vistaPreviaPlantilla(id: Exclude<PlantillaId, "finalizacion">, clausulas: ClausulaContrato[], variosTitulares = false) {
  const tipo = id === "reserva" ? "RESERVA" : "CONTRATO";
  const clausulasHtml = clausulas.filter(c => c.activa && (c.tipo_documento === tipo || c.tipo_documento === "AMBOS"))
    .slice().sort((a, b) => a.orden - b.orden || a.created_at.localeCompare(b.created_at))
    .map((c, i) => `<section class="bloque seccion"><h2>Cláusula adicional ${i + 1}: ${escapar(c.titulo)}</h2><div class="caja"><p>${escapar(c.contenido).replace(/\n/g, "<br>")}</p></div></section>`).join("");
  const comunes = {
    vivienda: "[VIVIENDA]", habitacion: "[HABITACIÓN]", propietarios: "[NOMBRE Y DOCUMENTO DE LA PARTE ARRENDADORA]",
    direccion: "[DIRECCIÓN]", inicio: "[FECHA DE ENTRADA]", renta: "[RENTA MENSUAL]",
    numeroPersonas: variosTitulares ? 2 : 1, personasEtiqueta: variosTitulares ? "personas" : "persona",
    gastos: "[GASTOS POR PERSONA × N.º DE TITULARES]", fianza: "[FIANZA PACTADA]", entregado: "[IMPORTE ENTREGADO]",
    pendiente: "[FIANZA PENDIENTE]", fechaEmision: "[FECHA DE EMISIÓN]", clausulasHtml,
  };
  const titulares = Array.from({ length: comunes.numeroPersonas }, (_, i) =>
    `D./Dña. <strong>[NOMBRE DEL TITULAR ${i + 1}]</strong>, mayor de edad, con documento [DOCUMENTO]`);
  const html = id === "reserva" ? renderizarReserva({
    ...comunes, titularesHtml: titulares.map(t => `<li>${t}</li>`).join(""), municipioHtml: ", [MUNICIPIO]", mesesFianza: "[N.º DE MESES]",
  }, false) : renderizarContrato({
    ...comunes, vivienda: id === "montuiri" ? "Montuïri" : "[VIVIENDA]",
    titulo: id === "montuiri" ? "CONTRATO DE ARRENDAMIENTO DE HABITACIÓN" : "CONTRATO DE ALQUILER DE HABITACIÓN",
    municipio: "[MUNICIPIO]", referenciaCatastralHtml: ", con referencia catastral [REFERENCIA CATASTRAL]",
    duracion: id === "montuiri" ? "diez meses" : "seis meses", fin: "[FECHA DE FINALIZACIÓN]",
    bancoHtml: " a [ENTIDAD BANCARIA]", ibanHtml: ", IBAN [IBAN DE COBRO]", suministros: "[SUMINISTROS INCLUIDOS]",
    titularesHtml: variosTitulares
      ? `<p><strong>Y, de otra parte, las siguientes personas:</strong></p><ol>${titulares.map(t => `<li>${t}.</li>`).join("")}</ol><p>En adelante, las <strong>PARTES ARRENDATARIAS</strong>, que responden solidariamente de todas las obligaciones de este contrato.</p>`
      : `<p><strong>Y, de otra parte,</strong> ${titulares[0]} (en adelante, la <strong>PARTE ARRENDATARIA</strong>).</p>`,
    firmantesSufijo: variosTitulares ? " / partes arrendatarias" : "",
  }, false);
  return html.replace("<body>", '<body><p style="border:2px solid #64748b;padding:12px;font-weight:bold">PLANTILLA · Los campos entre corchetes se completan desde la habitación.</p>');
}
