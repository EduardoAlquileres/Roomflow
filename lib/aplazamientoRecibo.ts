import type { Cobro } from "@/types/cobro";
import type { PagoAplazado } from "@/lib/pagosAplazados";

const moneda = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const escapar = (texto: string) => texto.replace(/[&<>'"]/g, caracter => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[caracter] ?? caracter);
const fecha = (valor: string) => new Intl.DateTimeFormat("es-ES").format(new Date(`${valor}T12:00:00`));

/** El acuerdo pertenece al recibo exacto, nunca a todos los recibos del inquilino. */
export function referenciaAplazamientoRecibo(acuerdo: PagoAplazado | null, cobro: Cobro) {
  if (!acuerdo || acuerdo.cobro_id !== cobro.id) return "";
  const pendiente = Math.max(Number(cobro.pendiente), 0);
  const devuelto = Math.max(Math.round((Number(cobro.pagado) - Number(acuerdo.pagado_inicial)) * 100) / 100, 0);
  const liquidado = pendiente < 0.005;
  return `<div class="bloque aplazamiento"><div class="etiqueta">Pago aplazado de este recibo</div><div class="valor">Acuerdo de ${escapar(fecha(acuerdo.fecha_acuerdo))} · ${liquidado ? "Liquidado" : "Pendiente de devolución"}</div><div class="fila"><span>Importe aplazado inicialmente</span><strong>${moneda.format(Number(acuerdo.importe_inicial))}</strong></div><div class="fila"><span>Devuelto desde el acuerdo</span><strong>${moneda.format(devuelto)}</strong></div><div class="fila"><span>Saldo pendiente del aplazamiento</span><strong>${moneda.format(pendiente)}</strong></div>${!liquidado ? `<div class="nota">${acuerdo.cuota_orientativa == null ? "Entregas de importe variable, según lo pactado." : `Cuota mensual orientativa: ${moneda.format(Number(acuerdo.cuota_orientativa))}. Cada entrega puede tener un importe distinto.`}</div>${acuerdo.proxima_fecha ? `<div class="nota">Próximo pago o revisión: ${escapar(fecha(acuerdo.proxima_fecha))}.</div>` : ""}` : ""}${acuerdo.notas.trim() ? `<div class="etiqueta">Condiciones pactadas</div><div class="valor">${escapar(acuerdo.notas).replace(/\r?\n/g, "<br>")}</div>` : ""}<div class="nota">Estos importes corresponden al saldo de este recibo y no se suman de nuevo al total mensual.</div></div>`;
}
