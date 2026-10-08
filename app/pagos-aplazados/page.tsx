"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { CalendarDays, CheckCircle2, History, Plus, Wallet, X } from "lucide-react";
import { supabase } from "#roomflow-supabase";
import type { Cobro } from "@/types/cobro";
import { crearAplazamiento, editarAplazamiento, registrarEntrega, resumenAplazamiento, type PagoAplazado } from "@/lib/pagosAplazados";
import { obtenerMovimientos, type MovimientoCobro } from "@/lib/movimientosCobro";
import { cuadroAmortizacion, fechaMensual, pagosAmortizados } from "@/lib/amortizacion";
import ReciboCobroButton from "@/components/ReciboCobroButton";

type Inquilino = { id: string; nombre: string; apellidos: string };
type Habitacion = { id: string; codigo: string; vivienda_id: string };
type Vivienda = { id: string; nombre: string };
type Datos = { acuerdos: PagoAplazado[]; cobros: Cobro[]; inquilinos: Inquilino[]; habitaciones: Habitacion[]; viviendas: Vivienda[] };
type FormularioAcuerdo = { id?: string; inquilinoId: string; cobroId: string; fecha: string; cuota: string; proximaFecha: string; notas: string };
type FormularioPago = { acuerdo: PagoAplazado; movimientoId: string; fecha: string; importe: string; metodo: string; notas: string; proximaFecha: string };
const euros = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const fechaLocal = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const fechaTexto = (fecha: string) => new Intl.DateTimeFormat("es-ES").format(new Date(`${fecha.slice(0, 10)}T12:00:00`));
const periodo = (cobro: Cobro) => new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(new Date(cobro.periodo_anio, cobro.periodo_mes - 1, 1));
const input = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal";
const boton = "inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50";
const secundario = "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50";
const errorTexto = (error: unknown) => error && typeof error === "object" && "message" in error ? String(error.message) : "No se pudo completar la operación. Inténtalo de nuevo.";

export default function PagosAplazados() {
  const [datos, setDatos] = useState<Datos>({ acuerdos: [], cobros: [], inquilinos: [], habitaciones: [], viviendas: [] });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("PENDIENTES");
  const [acuerdoForm, setAcuerdoForm] = useState<FormularioAcuerdo | null>(null);
  const [pagoForm, setPagoForm] = useState<FormularioPago | null>(null);
  const [historial, setHistorial] = useState<{ acuerdo: PagoAplazado; movimientos: MovimientoCobro[] } | null>(null);
  const [amortizacion, setAmortizacion] = useState<{ acuerdo: PagoAplazado; cobro: Cobro; movimientos: MovimientoCobro[] } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");
  const [cargandoHistorial, setCargandoHistorial] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const resultados = await Promise.all([
      supabase.from("pagos_aplazados").select("*").order("created_at", { ascending: false }),
      supabase.from("cobros").select("*").order("periodo_anio", { ascending: false }).order("periodo_mes", { ascending: false }),
      supabase.from("inquilinos").select("id,nombre,apellidos").order("nombre"),
      supabase.from("habitaciones").select("id,codigo,vivienda_id"),
      supabase.from("viviendas").select("id,nombre"),
    ]);
    const fallo = resultados.find(resultado => resultado.error)?.error;
    if (fallo) throw fallo;
    setDatos({ acuerdos: resultados[0].data ?? [], cobros: resultados[1].data ?? [], inquilinos: resultados[2].data ?? [], habitaciones: resultados[3].data ?? [], viviendas: resultados[4].data ?? [] });
    setError("");
  }, []);

  useEffect(() => {
    Promise.resolve().then(cargar).catch(fallo => setError(errorTexto(fallo))).finally(() => setCargando(false));
  }, [cargar]);

  const nombre = (id: string) => {
    const persona = datos.inquilinos.find(item => item.id === id);
    return persona ? `${persona.nombre} ${persona.apellidos}`.trim() : "Inquilino no disponible";
  };
  const ubicacion = (cobro: Cobro) => {
    const habitacion = datos.habitaciones.find(item => item.id === cobro.habitacion_id);
    return `${datos.viviendas.find(item => item.id === habitacion?.vivienda_id)?.nombre ?? "Vivienda"} · Habitación ${habitacion?.codigo ?? "—"}`;
  };
  const filas = datos.acuerdos.flatMap(acuerdo => {
    const cobro = datos.cobros.find(item => item.id === acuerdo.cobro_id);
    return cobro ? [{ acuerdo, cobro, ...resumenAplazamiento(acuerdo, cobro) }] : [];
  });
  const pendientes = filas.filter(fila => !fila.liquidado);
  const disponibles = datos.cobros.filter(cobro => Number(cobro.pendiente) > 0 && !datos.acuerdos.some(acuerdo => acuerdo.cobro_id === cobro.id));
  const visibles = filas.filter(fila => (filtro === "TODOS" || (filtro === "LIQUIDADOS" ? fila.liquidado : !fila.liquidado)) && `${nombre(fila.cobro.inquilino_id)} ${ubicacion(fila.cobro)} ${periodo(fila.cobro)}`.toLocaleLowerCase("es").includes(busqueda.toLocaleLowerCase("es")));

  function nuevoAcuerdo() {
    setErrorForm("");
    setAcuerdoForm({ inquilinoId: "", cobroId: "", fecha: fechaLocal(), cuota: "", proximaFecha: "", notas: "" });
  }
  function abrirEdicion(acuerdo: PagoAplazado, cobro: Cobro) {
    setErrorForm("");
    setAcuerdoForm({ id: acuerdo.id, inquilinoId: cobro.inquilino_id, cobroId: cobro.id, fecha: acuerdo.fecha_acuerdo, cuota: acuerdo.cuota_orientativa == null ? "" : String(acuerdo.cuota_orientativa), proximaFecha: acuerdo.proxima_fecha ?? "", notas: acuerdo.notas });
  }
  async function guardarAcuerdo(evento: FormEvent) {
    evento.preventDefault();
    if (!acuerdoForm || guardando) return;
    const cuota = acuerdoForm.cuota.trim() ? Number(acuerdoForm.cuota.replace(",", ".")) : null;
    if (!acuerdoForm.cobroId || !acuerdoForm.fecha || (cuota !== null && (!Number.isFinite(cuota) || cuota <= 0))) {
      setErrorForm("Selecciona un recibo, una fecha y una cuota válida si quieres indicarla."); return;
    }
    setGuardando(true); setErrorForm("");
    try {
      const condiciones = { fecha_acuerdo: acuerdoForm.fecha, cuota_orientativa: cuota, proxima_fecha: acuerdoForm.proximaFecha || null, notas: acuerdoForm.notas };
      if (acuerdoForm.id) await editarAplazamiento(acuerdoForm.id, condiciones);
      else await crearAplazamiento(acuerdoForm.cobroId, condiciones);
      setAcuerdoForm(null);
      await cargar().catch(fallo => setError(`Acuerdo guardado. No se pudo actualizar la lista: ${errorTexto(fallo)}`));
    } catch (fallo) { setErrorForm(errorTexto(fallo)); }
    finally { setGuardando(false); }
  }
  async function guardarPago(evento: FormEvent) {
    evento.preventDefault();
    if (!pagoForm || guardando) return;
    const cobro = datos.cobros.find(item => item.id === pagoForm.acuerdo.cobro_id);
    if (!cobro) return;
    setGuardando(true); setErrorForm("");
    try {
      await registrarEntrega({ acuerdoId: pagoForm.acuerdo.id, movimientoId: pagoForm.movimientoId, fecha: pagoForm.fecha, importe: Number(pagoForm.importe.replace(",", ".")), metodo: pagoForm.metodo, observaciones: pagoForm.notas, proximaFecha: pagoForm.proximaFecha || null }, Number(cobro.pendiente));
      setPagoForm(null);
      await cargar().catch(fallo => setError(`Pago guardado. No se pudo actualizar la lista: ${errorTexto(fallo)}`));
    } catch (fallo) { setErrorForm(errorTexto(fallo)); }
    finally { setGuardando(false); }
  }
  async function verHistorial(acuerdo: PagoAplazado, cuadro = false) {
    setCargandoHistorial(acuerdo.id);
    try {
      const movimientos = await obtenerMovimientos(acuerdo.cobro_id);
      const cobro = datos.cobros.find(item => item.id === acuerdo.cobro_id);
      if (cuadro && cobro) setAmortizacion({ acuerdo, cobro, movimientos });
      else setHistorial({ acuerdo, movimientos });
    }
    catch (fallo) { setError(errorTexto(fallo)); }
    finally { setCargandoHistorial(null); }
  }

  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-2xl font-bold text-slate-900">Pagos aplazados</h1><p className="mt-2 max-w-2xl text-sm text-slate-500">Alquileres que se devuelven poco a poco. Registra cada entrega, aunque el importe cambie de un mes a otro.</p></div>
      <button type="button" onClick={nuevoAcuerdo} disabled={cargando || Boolean(error)} className={boton}><Plus size={18} /> Nuevo aplazamiento</button>
    </div>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}<button type="button" className="ml-3 underline" onClick={() => { setCargando(true); cargar().catch(fallo => setError(errorTexto(fallo))).finally(() => setCargando(false)); }}>Volver a cargar</button></div>}
    <div className="grid gap-4 sm:grid-cols-3">
      {[{ titulo: "Acuerdos pendientes", valor: String(pendientes.length), icono: CalendarDays }, { titulo: "Saldo por devolver", valor: euros.format(pendientes.reduce((suma, fila) => suma + fila.pendiente, 0)), icono: Wallet }, { titulo: "Devuelto desde los acuerdos", valor: euros.format(filas.reduce((suma, fila) => suma + fila.devuelto, 0)), icono: CheckCircle2 }].map(tarjeta => <div key={tarjeta.titulo} className="rounded-xl border border-slate-200 bg-white p-5"><tarjeta.icono size={20} className="text-blue-600" /><p className="mt-3 text-sm text-slate-500">{tarjeta.titulo}</p><p className="mt-1 text-2xl font-bold text-slate-900">{cargando ? "…" : tarjeta.valor}</p></div>)}
    </div>
    <div className="flex flex-wrap gap-3">
      <input aria-label="Buscar inquilino, vivienda o periodo" placeholder="Buscar inquilino, vivienda o periodo…" value={busqueda} onChange={evento => setBusqueda(evento.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2" />
      <select aria-label="Estado de los aplazamientos" value={filtro} onChange={evento => setFiltro(evento.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="PENDIENTES">Pendientes</option><option value="LIQUIDADOS">Liquidados</option><option value="TODOS">Todos</option></select>
    </div>
    {cargando ? <p role="status" className="py-8 text-center text-slate-500">Cargando pagos aplazados…</p> : !error && visibles.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center"><CalendarDays className="mx-auto text-blue-600" size={30} /><h2 className="mt-3 font-semibold text-slate-900">{datos.acuerdos.length ? "No hay acuerdos con estos filtros" : "Todavía no hay alquileres aplazados"}</h2><p className="mt-2 text-sm text-slate-500">Selecciona el recibo que se aplaza y después anota cada pago recibido. El alquiler de los meses siguientes se gestiona en Cobros.</p></div> : <div className="grid gap-4 xl:grid-cols-2">
      {visibles.map(({ acuerdo, cobro, pendiente, devuelto, liquidado }) => <article key={acuerdo.id} className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-900">{nombre(cobro.inquilino_id)}</h2><p className="mt-1 text-sm text-slate-500">{ubicacion(cobro)}</p><p className="mt-1 text-sm font-semibold text-slate-700">Alquiler de {periodo(cobro)}</p></div><span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${liquidado ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-800"}`}>{liquidado ? "Liquidado" : "Pendiente"}</span></div>
        <div className="mt-4 grid grid-cols-3 gap-3 rounded-lg bg-slate-50 p-3">{[{ titulo: "Aplazado", valor: Number(acuerdo.importe_inicial) }, { titulo: "Devuelto", valor: devuelto }, { titulo: "Pendiente", valor: pendiente }].map(importe => <div key={importe.titulo}><p className="text-xs text-slate-500">{importe.titulo}</p><p className="mt-1 font-bold text-slate-900">{euros.format(importe.valor)}</p></div>)}</div>
        <div className="mt-4 space-y-1 text-sm text-slate-600"><p>Acuerdo: {fechaTexto(acuerdo.fecha_acuerdo)}</p><p>Cuota orientativa: {acuerdo.cuota_orientativa ? `${euros.format(Number(acuerdo.cuota_orientativa))} al mes · importe flexible` : "Variable, según cada entrega"}</p>{!liquidado && acuerdo.proxima_fecha && <p className={acuerdo.proxima_fecha < fechaLocal() ? "font-semibold text-amber-700" : ""}>Próximo pago / revisión: {fechaTexto(acuerdo.proxima_fecha)}{acuerdo.proxima_fecha < fechaLocal() ? " · Revisar acuerdo" : ""}</p>}{acuerdo.notas && <p className="whitespace-pre-wrap pt-2">{acuerdo.notas}</p>}</div>
        <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-700"><ReciboCobroButton cobro={cobro} habitacion={datos.habitaciones.find(item => item.id === cobro.habitacion_id) ?? null} vivienda={datos.viviendas.find(item => item.id === datos.habitaciones.find(habitacion => habitacion.id === cobro.habitacion_id)?.vivienda_id) ?? null} inquilino={datos.inquilinos.find(item => item.id === cobro.inquilino_id) ?? null} /><span>Recibo del alquiler aplazado</span></div>
        <div className="mt-5 flex flex-wrap gap-2">{!liquidado && <button type="button" className={boton} onClick={() => { setErrorForm(""); setPagoForm({ acuerdo, movimientoId: crypto.randomUUID(), fecha: fechaLocal(), importe: "", metodo: "Transferencia", notas: "", proximaFecha: "" }); }}><Plus size={16} /> Registrar entrega</button>}<button type="button" disabled={cargandoHistorial === acuerdo.id} className={secundario} onClick={() => verHistorial(acuerdo, true)}><CalendarDays size={16} /> Cuadro de amortización</button><button type="button" disabled={cargandoHistorial === acuerdo.id} className={secundario} onClick={() => verHistorial(acuerdo)}><History size={16} /> {cargandoHistorial === acuerdo.id ? "Cargando…" : "Historial"}</button><button type="button" className={secundario} onClick={() => abrirEdicion(acuerdo, cobro)}>Editar acuerdo</button></div>
      </article>)}
    </div>}

    {acuerdoForm && <Modal titulo={acuerdoForm.id ? "Editar acuerdo" : "Nuevo aplazamiento"} cerrar={() => setAcuerdoForm(null)} ocupado={guardando}>
      <form onSubmit={guardarAcuerdo} className="space-y-4">
        {acuerdoForm.id ? <p className="text-sm text-slate-600">{nombre(acuerdoForm.inquilinoId)} · {periodo(datos.cobros.find(cobro => cobro.id === acuerdoForm.cobroId)!)}</p> : <>
          <label className="block text-sm font-semibold">Inquilino<select required value={acuerdoForm.inquilinoId} onChange={evento => setAcuerdoForm({ ...acuerdoForm, inquilinoId: evento.target.value, cobroId: "" })} className={input}><option value="">Selecciona un inquilino</option>{datos.inquilinos.filter(persona => disponibles.some(cobro => cobro.inquilino_id === persona.id)).map(persona => <option key={persona.id} value={persona.id}>{nombre(persona.id)}</option>)}</select></label>
          <label className="block text-sm font-semibold">Recibo que se aplaza<select required disabled={!acuerdoForm.inquilinoId} value={acuerdoForm.cobroId} onChange={evento => setAcuerdoForm({ ...acuerdoForm, cobroId: evento.target.value })} className={input}><option value="">Selecciona un recibo pendiente</option>{disponibles.filter(cobro => cobro.inquilino_id === acuerdoForm.inquilinoId).map(cobro => <option key={cobro.id} value={cobro.id}>{periodo(cobro)} · {ubicacion(cobro)} · {euros.format(Number(cobro.pendiente))}</option>)}</select></label>
          <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">Se aplaza el saldo pendiente de este recibo. No se registra un pago hasta que recibas el dinero.</p>
          {disponibles.length === 0 && <p className="text-sm text-amber-700">No hay recibos pendientes disponibles. Si falta el alquiler, créalo primero en Cobros.</p>}
        </>}
        <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">Fecha del acuerdo<input required type="date" value={acuerdoForm.fecha} onChange={evento => setAcuerdoForm({ ...acuerdoForm, fecha: evento.target.value })} className={input} /></label><label className="block text-sm font-semibold">Cuota orientativa (€ / mes)<input type="number" min="0.01" step="0.01" placeholder="Opcional, p. ej. 50" value={acuerdoForm.cuota} onChange={evento => setAcuerdoForm({ ...acuerdoForm, cuota: evento.target.value })} className={input} /></label></div>
        <label className="block text-sm font-semibold">Próximo pago o revisión (opcional)<input type="date" value={acuerdoForm.proximaFecha} onChange={evento => setAcuerdoForm({ ...acuerdoForm, proximaFecha: evento.target.value })} className={input} /></label>
        <label className="block text-sm font-semibold">Negociación y condiciones pactadas<textarea rows={4} placeholder="Por ejemplo: solicita aplazar el alquiler de octubre. Acordamos devolver unos 50 € al mes y más cuando pueda, sin intereses. Revisaremos el acuerdo cada mes." value={acuerdoForm.notas} onChange={evento => setAcuerdoForm({ ...acuerdoForm, notas: evento.target.value })} className={input} /></label>
        <p className="text-sm text-slate-500">La cuota orientativa permite crear el cuadro de amortización sin intereses. Cada entrega puede tener otro importe y actualizará la previsión.</p>
        {errorForm && <p role="alert" className="text-sm text-red-700">{errorForm}</p>}<div className="flex justify-end gap-2"><button type="button" disabled={guardando} onClick={() => setAcuerdoForm(null)} className={secundario}>Cancelar</button><button disabled={guardando || (!acuerdoForm.id && !acuerdoForm.cobroId)} className={boton}>{guardando ? "Guardando…" : "Guardar acuerdo"}</button></div>
      </form>
    </Modal>}
    {pagoForm && <Modal titulo="Registrar entrega" cerrar={() => setPagoForm(null)} ocupado={guardando}>
      <form onSubmit={guardarPago} className="space-y-4">
        <p className="text-sm text-slate-600">Registra solo el dinero recibido para devolver el alquiler aplazado. Esta entrega no paga el alquiler del mes actual.</p>
        <p className="font-semibold">Pendiente: {euros.format(Number(datos.cobros.find(cobro => cobro.id === pagoForm.acuerdo.cobro_id)?.pendiente ?? 0))}</p>
        <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">Importe recibido (€)<input autoFocus required type="number" min="0.01" step="0.01" max={Number(datos.cobros.find(cobro => cobro.id === pagoForm.acuerdo.cobro_id)?.pendiente ?? 0)} value={pagoForm.importe} onChange={evento => setPagoForm({ ...pagoForm, importe: evento.target.value })} className={input} /></label><label className="block text-sm font-semibold">Fecha del pago<input required type="date" value={pagoForm.fecha} onChange={evento => setPagoForm({ ...pagoForm, fecha: evento.target.value })} className={input} /></label></div>
        <label className="block text-sm font-semibold">Método de pago<select value={pagoForm.metodo} onChange={evento => setPagoForm({ ...pagoForm, metodo: evento.target.value })} className={input}>{["Transferencia", "Efectivo", "Bizum", "Tarjeta", "Otro"].map(metodo => <option key={metodo}>{metodo}</option>)}</select></label>
        <label className="block text-sm font-semibold">Siguiente pago o revisión (opcional)<input type="date" value={pagoForm.proximaFecha} onChange={evento => setPagoForm({ ...pagoForm, proximaFecha: evento.target.value })} className={input} /></label>
        <label className="block text-sm font-semibold">Observaciones<textarea rows={2} value={pagoForm.notas} onChange={evento => setPagoForm({ ...pagoForm, notas: evento.target.value })} className={input} /></label>
        {errorForm && <p role="alert" className="text-sm text-red-700">{errorForm}</p>}<div className="flex justify-end gap-2"><button type="button" disabled={guardando} onClick={() => setPagoForm(null)} className={secundario}>Cancelar</button><button disabled={guardando} className={boton}>{guardando ? "Guardando…" : "Guardar entrega"}</button></div>
      </form>
    </Modal>}
    {historial && <Modal titulo="Historial del recibo aplazado" cerrar={() => setHistorial(null)}>
      <p className="mb-4 text-sm text-slate-500">Todos los pagos del recibo original, incluidos los anteriores al acuerdo. Las correcciones se realizan en el historial de Cobros.</p>
      {historial.movimientos.length === 0 ? <p className="py-6 text-center text-slate-500">Todavía no hay pagos registrados.</p> : <div className="divide-y divide-slate-200">{historial.movimientos.map(movimiento => <div key={movimiento.id} className="py-3"><div className="flex justify-between gap-3"><p className="font-semibold">{fechaTexto(movimiento.fecha)}</p><p className="font-bold text-green-700">{euros.format(Number(movimiento.importe))}</p></div><p className="mt-1 text-sm text-slate-500">{movimiento.metodo}{movimiento.created_at < historial.acuerdo.created_at ? " · Registrado antes del acuerdo" : ""}</p>{movimiento.observaciones && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{movimiento.observaciones}</p>}</div>)}</div>}
    </Modal>}
    {amortizacion && <Modal titulo="Cuadro de amortización" cerrar={() => setAmortizacion(null)}>
      <Cuadro acuerdo={amortizacion.acuerdo} cobro={amortizacion.cobro} movimientos={amortizacion.movimientos} nombre={nombre(amortizacion.cobro.inquilino_id)} />
    </Modal>}
  </div>;
}

function Cuadro({ acuerdo, cobro, movimientos, nombre }: { acuerdo: PagoAplazado; cobro: Cobro; movimientos: MovimientoCobro[]; nombre: string }) {
  const primeraFecha = acuerdo.proxima_fecha ?? fechaMensual(fechaLocal(), 1);
  const { filas, pendienteSinPlan } = cuadroAmortizacion(Number(cobro.pendiente), acuerdo.cuota_orientativa == null ? null : Number(acuerdo.cuota_orientativa), primeraFecha);
  const pagos = movimientos.filter(movimiento => movimiento.created_at >= acuerdo.created_at);
  // Reconstruye el saldo desde el saldo vivo para reflejar también las correcciones del recibo.
  const reales = pagosAmortizados(Number(cobro.pendiente), pagos);
  return <div className="space-y-4">
    <div><p className="font-semibold text-slate-900">{nombre} · {periodo(cobro)}</p><p className="mt-1 text-sm text-slate-500">Deuda aplazada inicialmente: {euros.format(Number(acuerdo.importe_inicial))}. Sin intereses.</p></div>
    <div className="rounded-lg bg-slate-50 p-3"><h3 className="text-sm font-semibold">Negociación y condiciones pactadas</h3><p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{acuerdo.notas || "No se han anotado condiciones adicionales."}</p></div>
    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-100 text-slate-600"><tr><th className="p-2">Fecha</th><th className="p-2">Estado</th><th className="p-2 text-right">Saldo inicial</th><th className="p-2 text-right">Cuota</th><th className="p-2 text-right">Saldo restante</th></tr></thead><tbody>
      {reales.map(fila => <tr key={fila.id} className="border-b border-slate-100"><td className="whitespace-nowrap p-2">{fechaTexto(fila.fecha)}</td><td className="p-2 font-semibold text-green-700">Recibido</td><td className="p-2 text-right">{euros.format(fila.saldoInicial)}</td><td className="p-2 text-right">{euros.format(fila.cuota)}</td><td className="p-2 text-right">{euros.format(fila.saldoFinal)}</td></tr>)}
      {filas.map(fila => <tr key={`previsto-${fila.numero}`} className="border-b border-slate-100"><td className="whitespace-nowrap p-2">{fechaTexto(fila.fecha)}</td><td className="p-2 text-blue-700">Previsto</td><td className="p-2 text-right">{euros.format(fila.saldoInicial)}</td><td className="p-2 text-right">{euros.format(fila.cuota)}</td><td className="p-2 text-right">{euros.format(fila.saldoFinal)}</td></tr>)}
    </tbody></table></div>
    {Number(cobro.pendiente) > 0 && filas.length === 0 && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Indica una cuota orientativa en «Editar acuerdo» para generar la previsión mensual. El saldo pendiente es {euros.format(Number(cobro.pendiente))}.</p>}
    {filas.length > 0 && <p className="text-sm text-slate-600">{filas.length} cuotas previstas{pendienteSinPlan === 0 ? ` · Finalización estimada: ${fechaTexto(filas[filas.length - 1].fecha)}` : ` mostradas (máximo 600); quedan ${euros.format(pendienteSinPlan)} fuera de esta previsión`}.</p>}
    {Number(cobro.pendiente) <= 0 && <p className="font-semibold text-green-700">Deuda liquidada.</p>}
    <p className="text-xs text-slate-500">La previsión parte del saldo pendiente actual y cambia con cada entrega. Las cuotas previstas no son pagos cobrados. {acuerdo.proxima_fecha ? "La primera fecha es el próximo pago o revisión del acuerdo." : "Sin fecha pactada, la previsión empieza el próximo mes."} Las correcciones en Cobros también se reflejan en los saldos.</p>
  </div>;
}

function Modal({ titulo, cerrar, ocupado = false, children }: { titulo: string; cerrar: () => void; ocupado?: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} aria-label={titulo} onCancel={evento => { evento.preventDefault(); if (!ocupado) cerrar(); }} className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl bg-white p-6 text-slate-900 shadow-xl backdrop:bg-slate-950/45"><div className="mb-5 flex items-start justify-between gap-4"><h2 className="text-xl font-bold text-slate-900">{titulo}</h2><button type="button" aria-label="Cerrar" disabled={ocupado} onClick={cerrar} className="rounded-lg p-1 text-slate-500 disabled:opacity-50"><X size={22} /></button></div>{children}</dialog>;
}
