"use client";

import { FileText } from "lucide-react";
import { Cobro } from "@/types/cobro";
import { supabase } from "@/lib/supabase";

type Props = { cobro: Cobro; vivienda: { id: string; nombre: string; direccion?: string | null } | null; habitacion: { codigo: string } | null; inquilino: { nombre: string; apellidos: string } | null };
const moneda = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const escapar = (texto: string) => texto.replace(/[&<>'"]/g, (caracter) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[caracter] ?? caracter);

export default function ReciboCobroButton({ cobro, vivienda, habitacion, inquilino }: Props) {
  async function generar() {
    if (!vivienda) { alert("No se ha encontrado la vivienda de este cobro."); return; }
    const { data: titulares, error: errorTitulares } = await supabase.from("vivienda_propietarios").select("propietario_id, porcentaje").eq("vivienda_id", vivienda.id);
    if (errorTitulares) { alert(errorTitulares.message); return; }
    const ids = (titulares ?? []).map((titular) => titular.propietario_id);
    const { data: propietarios, error: errorPropietarios } = ids.length ? await supabase.from("propietarios").select("id, nombre_completo, documento").in("id", ids) : { data: [], error: null };
    if (errorPropietarios) { alert(errorPropietarios.message); return; }
    const listaPropietarios = (propietarios ?? []).map((propietario) => `${propietario.nombre_completo} (${propietario.documento})`).join(" · ") || "Propietario pendiente de asignar";
    const mes = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(new Date(cobro.periodo_anio, cobro.periodo_mes - 1, 1));
    const ventana = window.open("", "_blank", "width=800,height=900");
    if (!ventana) { alert("El navegador ha bloqueado la ventana del recibo. Permite las ventanas emergentes e inténtalo de nuevo."); return; }
    const fecha = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date());
    ventana.document.write(`<!doctype html><html lang="es"><head><title>Recibo ${cobro.periodo_mes}-${cobro.periodo_anio}</title><style>body{font-family:Arial,sans-serif;color:#172033;padding:42px;max-width:720px;margin:auto}.cabecera{display:flex;justify-content:space-between;border-bottom:3px solid #2563eb;padding-bottom:18px}.titulo{font-size:26px;font-weight:700}.meta{color:#5b677c;text-align:right}.bloque{margin-top:28px}.etiqueta{font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.05em}.valor{font-size:16px;margin-top:5px}.fila{display:flex;justify-content:space-between;padding:13px 0;border-bottom:1px solid #e2e8f0}.total{font-size:21px;font-weight:700;border-top:2px solid #172033;padding-top:16px;margin-top:10px}.nota{margin-top:28px;padding:14px;background:#f8fafc;color:#475569;font-size:13px}.firma{display:flex;justify-content:space-between;margin-top:80px;text-align:center;gap:70px}.linea{border-top:1px solid #475569;padding-top:8px;width:45%}@media print{body{padding:24px}}</style></head><body><div class="cabecera"><div><div class="titulo">RECIBO DE PAGO</div><div class="meta" style="text-align:left">RoomFlow · Recibo mensual de habitación</div></div><div class="meta">Fecha de emisión: ${fecha}<br>Periodo: ${escapar(mes)}</div></div><div class="bloque"><div class="etiqueta">Propietario(s)</div><div class="valor">${escapar(listaPropietarios)}</div></div><div class="bloque"><div class="etiqueta">Inquilino</div><div class="valor">${escapar(inquilino ? `${inquilino.nombre} ${inquilino.apellidos}` : "Inquilino no disponible")}</div></div><div class="bloque"><div class="etiqueta">Vivienda y habitación</div><div class="valor">${escapar(vivienda.nombre)}${vivienda.direccion ? ` · ${escapar(vivienda.direccion)}` : ""}<br>Habitación: ${escapar(habitacion?.codigo ?? "-")}</div></div><div class="bloque"><div class="etiqueta">Desglose correspondiente a ${escapar(mes)}</div><div class="fila"><span>Alquiler de habitación</span><strong>${moneda.format(Number(cobro.alquiler))}</strong></div><div class="fila"><span>Gastos por persona</span><strong>${moneda.format(Number(cobro.gastos))}</strong></div><div class="fila total"><span>Total mensual</span><span>${moneda.format(Number(cobro.total))}</span></div><div class="fila"><span>Importe recibido</span><strong>${moneda.format(Number(cobro.pagado))}</strong></div><div class="fila"><span>Importe pendiente</span><strong>${moneda.format(Number(cobro.pendiente))}</strong></div></div><div class="nota">Este recibo detalla por separado la renta de la habitación y los gastos facturados por persona. Los gastos no forman parte del ingreso por alquiler.</div><div class="firma"><div class="linea">Propietario(s)</div><div class="linea">Inquilino</div></div><script>window.opener=null;window.onload=()=>window.print()<\/script></body></html>`);
    ventana.document.head.insertAdjacentHTML("beforeend", "<style>.nota{display:none}.firma{justify-content:flex-start}.firma .linea:last-child{display:none}</style>");
    ventana.document.close();
  }
  return <button style={{ width: 34, height: 34, border: "none", borderRadius: 6, background: "#eff6ff", color: "#2563eb", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Generar recibo" onClick={generar}><FileText size={18} /></button>;
}
