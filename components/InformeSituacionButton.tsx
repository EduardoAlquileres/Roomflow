"use client";

import { FileDown } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Vivienda = {
  id: string;
  nombre: string;
};

type Habitacion = {
  id: string;
  vivienda_id: string;
  estado: string;
  codigo: string;
  precio: number;
  gastos: number;
};

type Inquilino = {
  id: string;
  habitacion_id: string | null;
  nombre: string;
  apellidos: string;
  activo: boolean;
};

type Fianza = {
  habitacion_id: string;
  inquilino_id: string;
  importe: number;
  importe_entregado: number;
  estado: string;
};

type CobroPendiente = {
  habitacion_id: string;
  inquilino_id: string;
  pendiente: number;
  periodo_anio: number;
  periodo_mes: number;
};

const moneda = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const fecha = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "long", year: "numeric" });
const escapar = (texto: string) => texto.replace(/[&<>'"]/g, (caracter) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[caracter] ?? caracter);

export default function InformeSituacionButton() {
  async function generarInforme() {
    const ventana = window.open("", "_blank");
    if (!ventana) {
      alert("Permite las ventanas emergentes para abrir el informe.");
      return;
    }
    ventana.document.write("<title>Generando informe</title><p style='font-family:Arial;padding:24px'>Generando informe de situación...</p>");

    try {
      const [respuestaViviendas, respuestaHabitaciones, respuestaInquilinos, respuestaFianzas, respuestaCobros, respuestaDeudas] = await Promise.all([
        supabase.from("viviendas").select("id, nombre").order("nombre"),
        supabase.from("habitaciones").select("id, vivienda_id, estado, codigo, precio, gastos").order("codigo"),
        supabase.from("inquilinos").select("id, habitacion_id, nombre, apellidos, activo"),
        supabase.from("fianzas").select("habitacion_id, inquilino_id, importe, importe_entregado, estado").in("estado", ["COBRADA", "PENDIENTE_REVISION"]),
        supabase.from("cobros").select("habitacion_id, inquilino_id, pendiente, periodo_anio, periodo_mes").in("estado", ["PENDIENTE", "PARCIAL"]).gt("pendiente", 0),
        supabase.from("cobros").select("habitacion_id, inquilino_id, pendiente, periodo_anio, periodo_mes").eq("estado", "DEUDA").gt("pendiente", 0),
      ]);
      const error = respuestaViviendas.error ?? respuestaHabitaciones.error ?? respuestaInquilinos.error ?? respuestaFianzas.error ?? respuestaCobros.error ?? respuestaDeudas.error;
      if (error) throw error;

      const viviendas = (respuestaViviendas.data ?? []) as Vivienda[];
      const habitaciones = (respuestaHabitaciones.data ?? []) as Habitacion[];
      const inquilinos = (respuestaInquilinos.data ?? []) as Inquilino[];
      const fianzas = (respuestaFianzas.data ?? []) as Fianza[];
      const cobrosPendientes = (respuestaCobros.data ?? []) as CobroPendiente[];
      const deudasHistoricas = (respuestaDeudas.data ?? []) as CobroPendiente[];
      const libres = habitaciones.filter((habitacion) => habitacion.estado === "LIBRE");
      const ocupadas = habitaciones.filter((habitacion) => habitacion.estado === "OCUPADA");
      const ocupacion = habitaciones.length ? Math.round((ocupadas.length / habitaciones.length) * 100) : 0;
      const nombreVivienda = new Map(viviendas.map((vivienda) => [vivienda.id, vivienda.nombre]));
      const filasVivienda = viviendas.map((vivienda) => {
        const habitacionesVivienda = habitaciones.filter((habitacion) => habitacion.vivienda_id === vivienda.id);
        const ocupadasVivienda = habitacionesVivienda.filter((habitacion) => habitacion.estado === "OCUPADA").length;
        const libresVivienda = habitacionesVivienda.filter((habitacion) => habitacion.estado === "LIBRE").length;
        const porcentaje = habitacionesVivienda.length ? Math.round((ocupadasVivienda / habitacionesVivienda.length) * 100) : 0;
        return `<tr><td>${escapar(vivienda.nombre)}</td><td>${habitacionesVivienda.length}</td><td>${ocupadasVivienda}</td><td>${libresVivienda}</td><td><span class="porcentaje">${porcentaje}%</span></td></tr>`;
      }).join("") || '<tr><td colspan="5" class="vacio">No hay viviendas registradas.</td></tr>';
      const filasLibres = libres.map((habitacion) => `<tr><td>${escapar(nombreVivienda.get(habitacion.vivienda_id) ?? "Vivienda")}</td><td>${escapar(habitacion.codigo)}</td><td>${moneda.format(Number(habitacion.precio))}</td><td>${moneda.format(Number(habitacion.gastos))} por persona</td></tr>`).join("") || '<tr><td colspan="4" class="vacio">No hay habitaciones libres en este momento.</td></tr>';
      const pendientesPorHabitacion = new Map<string, { fianza: number; cobros: number; inquilinos: Set<string> }>();
      const asegurarPendiente = (habitacionId: string) => {
        const existente = pendientesPorHabitacion.get(habitacionId);
        if (existente) return existente;
        const creado = { fianza: 0, cobros: 0, inquilinos: new Set<string>() };
        pendientesPorHabitacion.set(habitacionId, creado);
        return creado;
      };
      const nombreInquilino = (id: string) => {
        const inquilino = inquilinos.find((item) => item.id === id);
        return inquilino ? `${inquilino.nombre} ${inquilino.apellidos}`.trim() : "";
      };
      fianzas.forEach((fianza) => {
        const pendiente = Math.max(Number(fianza.importe) - Number(fianza.importe_entregado), 0);
        if (pendiente <= 0.005) return;
        const registro = asegurarPendiente(fianza.habitacion_id);
        registro.fianza += pendiente;
        const nombre = nombreInquilino(fianza.inquilino_id);
        if (nombre) registro.inquilinos.add(nombre);
      });
      cobrosPendientes.forEach((cobro) => {
        const registro = asegurarPendiente(cobro.habitacion_id);
        registro.cobros += Number(cobro.pendiente);
        const nombre = nombreInquilino(cobro.inquilino_id);
        if (nombre) registro.inquilinos.add(nombre);
      });
      const totalFianzaPendiente = [...pendientesPorHabitacion.values()].reduce((suma, pendiente) => suma + pendiente.fianza, 0);
      const totalCobrosPendientes = [...pendientesPorHabitacion.values()].reduce((suma, pendiente) => suma + pendiente.cobros, 0);
      const totalDeudaPendiente = totalFianzaPendiente + totalCobrosPendientes;
      const filasPendientes = [...pendientesPorHabitacion.entries()]
        .map(([habitacionId, pendiente]) => {
          const habitacion = habitaciones.find((item) => item.id === habitacionId);
          const titularesActivos = inquilinos.filter((item) => item.habitacion_id === habitacionId && item.activo).map((item) => `${item.nombre} ${item.apellidos}`.trim());
          const titulares = titularesActivos.length ? titularesActivos : [...pendiente.inquilinos];
          return { habitacion, pendiente, titulares };
        })
        .sort((a, b) => `${nombreVivienda.get(a.habitacion?.vivienda_id ?? "") ?? ""} ${a.habitacion?.codigo ?? ""}`.localeCompare(`${nombreVivienda.get(b.habitacion?.vivienda_id ?? "") ?? ""} ${b.habitacion?.codigo ?? ""}`, "es"))
        .map(({ habitacion, pendiente, titulares }) => `<tr><td>${escapar(nombreVivienda.get(habitacion?.vivienda_id ?? "") ?? "Vivienda")}</td><td>${escapar(habitacion?.codigo ?? "-")}</td><td>${escapar(titulares.join(" · ") || "Sin inquilino activo")}</td><td>${moneda.format(pendiente.fianza)}</td><td>${moneda.format(pendiente.cobros)}</td><td><strong>${moneda.format(pendiente.fianza + pendiente.cobros)}</strong></td></tr>`)
        .join("") || '<tr><td colspan="6" class="vacio">No hay fianzas ni cobros pendientes de pago.</td></tr>';
      const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
      const totalDeudasHistoricas = deudasHistoricas.reduce((suma, deuda) => suma + Number(deuda.pendiente), 0);
      const filasDeudasHistoricas = deudasHistoricas
        .sort((a, b) => `${nombreVivienda.get(habitaciones.find((item) => item.id === a.habitacion_id)?.vivienda_id ?? "") ?? ""}`.localeCompare(`${nombreVivienda.get(habitaciones.find((item) => item.id === b.habitacion_id)?.vivienda_id ?? "") ?? ""}`, "es"))
        .map((deuda) => {
          const habitacion = habitaciones.find((item) => item.id === deuda.habitacion_id);
          return `<tr><td>${escapar(nombreVivienda.get(habitacion?.vivienda_id ?? "") ?? "Vivienda")}</td><td>${escapar(habitacion?.codigo ?? "-")}</td><td>${escapar(nombreInquilino(deuda.inquilino_id) || "Inquilino anterior")}</td><td>${escapar(`${meses[deuda.periodo_mes - 1]} de ${deuda.periodo_anio}`)}</td><td><strong>${moneda.format(Number(deuda.pendiente))}</strong></td></tr>`;
        })
        .join("") || '<tr><td colspan="5" class="vacio">No hay deudas históricas no cobradas.</td></tr>';
      const hoy = fecha.format(new Date());
      const documento = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Informe de situación - RoomFlow</title><style>body{font-family:Arial,sans-serif;color:#172033;padding:42px;max-width:900px;margin:auto;background:#fff}.acciones{position:sticky;top:0;display:flex;justify-content:flex-end;gap:10px;margin:-24px -24px 24px;padding:12px 24px;background:rgba(255,255,255,.96);border-bottom:1px solid #e2e8f0}.acciones button{border:1px solid #cbd5e1;border-radius:9px;background:#fff;padding:10px 14px;font-size:14px;font-weight:700}.acciones .imprimir{border-color:#2563eb;background:#2563eb;color:#fff}.cabecera{display:flex;justify-content:space-between;gap:20px;border-bottom:3px solid #2563eb;padding-bottom:18px}.marca{font-size:25px;font-weight:700}.subtitulo,.fecha{color:#5b677c;margin-top:5px}.fecha{text-align:right}.seccion{margin-top:30px}.seccion h2{margin:0;font-size:19px}.seccion p{color:#5b677c;margin:6px 0 16px}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.kpi{border:1px solid #dbe4f0;border-radius:12px;padding:16px;background:#f8fafc}.kpi span{display:block;color:#64748b;font-size:13px}.kpi strong{display:block;font-size:28px;margin-top:8px}table{width:100%;border-collapse:collapse;border:1px solid #dbe4f0;border-radius:10px;overflow:hidden}th,td{text-align:left;padding:12px;border-bottom:1px solid #e2e8f0;vertical-align:top}th{background:#f8fafc;color:#475569;font-size:13px}tr:last-child td{border-bottom:0}tfoot td{background:#eff6ff;border-top:2px solid #93c5fd;font-weight:700}.porcentaje{color:#047857;font-weight:700}.vacio{color:#64748b;text-align:center;padding:20px}.nota{margin-top:25px;border:1px solid #bfdbfe;background:#eff6ff;border-radius:10px;padding:14px 16px;color:#1e3a8a}@media(max-width:650px){body{padding:18px}.acciones{margin:-8px -8px 20px;padding:10px 8px}.cabecera{display:block}.fecha{text-align:left}.kpis{grid-template-columns:repeat(2,1fr)}th,td{padding:9px;font-size:13px}}@media print{body{padding:24px}.acciones{display:none}}</style></head><body><div class="acciones"><button type="button" onclick="history.back()">Volver</button><button type="button" class="imprimir" onclick="window.print()">Imprimir o guardar PDF</button></div><div class="cabecera"><div><div class="marca">ROOMFLOW</div><div class="subtitulo">Informe de situación resumida</div></div><div class="fecha">Emitido el ${escapar(hoy)}</div></div><section class="seccion"><h2>Resumen general</h2><p>Estado actual de las viviendas y habitaciones gestionadas.</p><div class="kpis"><article class="kpi"><span>Viviendas</span><strong>${viviendas.length}</strong></article><article class="kpi"><span>Habitaciones</span><strong>${habitaciones.length}</strong></article><article class="kpi"><span>Ocupadas</span><strong>${ocupadas.length}</strong></article><article class="kpi"><span>Ocupación</span><strong>${ocupacion}%</strong></article></div></section><section class="seccion"><h2>Pendientes de pago actuales</h2><p>Relación de habitaciones con fianza o cobros todavía pendientes. No incluye pagos completados ni deudas de inquilinos anteriores.</p><table><thead><tr><th>Vivienda</th><th>Habitación</th><th>Inquilino(s)</th><th>Fianza pendiente</th><th>Cobros pendientes</th><th>Total pendiente</th></tr></thead><tbody>${filasPendientes}</tbody><tfoot><tr><td colspan="3">Total pendiente actual</td><td>${moneda.format(totalFianzaPendiente)}</td><td>${moneda.format(totalCobrosPendientes)}</td><td>${moneda.format(totalDeudaPendiente)}</td></tr></tfoot></table></section><section class="seccion"><h2>Deudas históricas no cobradas</h2><p>Se mantienen separadas de la habitación actual y se atribuyen al inquilino que las generó.</p><table><thead><tr><th>Vivienda</th><th>Habitación</th><th>Inquilino responsable</th><th>Periodo</th><th>Importe no cobrado</th></tr></thead><tbody>${filasDeudasHistoricas}</tbody><tfoot><tr><td colspan="4">Total de deuda histórica</td><td>${moneda.format(totalDeudasHistoricas)}</td></tr></tfoot></table></section><section class="seccion"><h2>Situación por vivienda</h2><p>Ocupación actual y disponibilidad de cada vivienda.</p><table><thead><tr><th>Vivienda</th><th>Habitaciones</th><th>Ocupadas</th><th>Libres</th><th>Ocupación</th></tr></thead><tbody>${filasVivienda}</tbody></table></section><section class="seccion"><h2>Habitaciones disponibles</h2><p>Habitaciones que se pueden anunciar o preparar para una nueva entrada.</p><table><thead><tr><th>Vivienda</th><th>Habitación</th><th>Alquiler mensual</th><th>Gastos</th></tr></thead><tbody>${filasLibres}</tbody></table></section><p class="nota">Este informe refleja la situación de ocupación y los importes pendientes en la fecha indicada.</p></body></html>`;
      ventana.document.open();
      ventana.document.write(documento);
      ventana.document.close();
    } catch (error) {
      ventana.close();
      alert(error instanceof Error ? error.message : "No se pudo generar el informe de situación.");
    }
  }

  return <button type="button" onClick={generarInforme} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"><FileDown size={17} /> Informe de situación</button>;
}
