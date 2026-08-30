"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  Euro,
  AlertTriangle,
  CheckCircle2,
  LayoutDashboard,
  ListFilter,
  BarChart3,
  Building2,
  TrendingUp,
  UsersRound,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import {
  crearCobro,
  obtenerCobros,
  eliminarCobro,
  marcarCobroComoDeuda,
} from "@/lib/cobros";

import CobrosTable from "@/components/CobrosTable";
import RegistrarPagoModal from "@/components/RegistrarPagoModal";
import HistorialCobrosModal from "@/components/HistorialCobrosModal";
import { registrarPago } from "@/lib/movimientosCobro";
import { generarCobrosPendientes } from "@/lib/generarCobrosPendientes";

import { Cobro } from "@/types/cobro";
import CrearCobroModal, {
  DatosNuevoCobro,
} from "@/components/CrearCobroModal";
import BalanceGastosViviendas from "@/components/BalanceGastosViviendas";

type Resumen = {
  previstas: number;
  cobradas: number;
  pendientes: number;
  deudas: number;
  habitacionesPendientes: number;
};

const formatoKpiCobro = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function calcularResumen(cobros: Cobro[]): Resumen {
  return {
    previstas: cobros.reduce((suma, cobro) => suma + Number(cobro.total), 0),
    cobradas: cobros.reduce((suma, cobro) => suma + Number(cobro.pagado), 0),
    pendientes: cobros
      .filter((cobro) => cobro.estado !== "DEUDA")
      .reduce((suma, cobro) => suma + Number(cobro.pendiente), 0),
    deudas: cobros
      .filter((cobro) => cobro.estado === "DEUDA")
      .reduce((suma, cobro) => suma + Number(cobro.pendiente), 0),
    habitacionesPendientes: new Set(
      cobros.filter((cobro) => cobro.estado !== "PAGADO" && cobro.estado !== "DEUDA").map((cobro) => cobro.habitacion_id)
    ).size,
  };
}

type Habitacion = {
  id: string;
  codigo: string;
  vivienda_id: string;
  precio: number;
  gastos: number;
  estado: "LIBRE" | "OCUPADA" | "RESERVADA";
};

type Vivienda = {
  id: string;
  nombre: string;
};

type GastoVivienda = { vivienda_id: string; fecha: string; importe: number; estado: string };

type EstanciaResumen = {
  id: string;
  inquilino_id: string;
  habitacion_id: string;
  fecha_entrada: string;
  fecha_salida: string | null;
  precio: number;
  gastos: number;
  created_at: string;
};

type FiltroEstadoCobro = "ABIERTOS" | "" | Cobro["estado"];

type Inquilino = {
  id: string;
  nombre: string;
  apellidos: string;
  telefono: string | null;
  documento: string | null;
  activo: boolean;
  habitacion_id: string;
};

type ResumenViviendaMes = Resumen & {
  viviendaId: string;
  nombre: string;
};

export default function CobrosPage() {
  const [cargando, setCargando] = useState(true);
  const [vistaActiva, setVistaActiva] = useState<"RESUMEN" | "COBROS" | "GASTOS">("RESUMEN");
  const [avisoGeneracion, setAvisoGeneracion] = useState<string | null>(null);

  const ahora = new Date();
  const [periodoResumen, setPeriodoResumen] = useState(`${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}`);
async function eliminarCobroSeleccionado(id: string) {
  const confirmar = window.confirm(
    "¿Deseas eliminar este cobro?"
  );

  if (!confirmar) return;

  try {
    await eliminarCobro(id);

    await cargarDatos();
  } catch (error) {
    console.error(error);

    alert(
      error instanceof Error
        ? error.message
        : "No se pudo eliminar el cobro."
    );
  }
}
  const [cobros, setCobros] = useState<Cobro[]>([]);
  const [filtroVivienda, setFiltroVivienda] = useState("");
  const [filtroHabitacion, setFiltroHabitacion] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstadoCobro>("ABIERTOS");

  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);

  const [viviendas, setViviendas] = useState<Vivienda[]>([]);
  const [gastosVivienda, setGastosVivienda] = useState<GastoVivienda[]>([]);
  const [estancias, setEstancias] = useState<EstanciaResumen[]>([]);

  const [inquilinos, setInquilinos] = useState<Inquilino[]>([]);
  const [modalPagoAbierto, setModalPagoAbierto] =
  useState(false);

const [cobroSeleccionado, setCobroSeleccionado] =
  useState<Cobro | null>(null);

const [guardandoPago, setGuardandoPago] =
  useState(false);
  const [modalNuevoCobroAbierto, setModalNuevoCobroAbierto] = useState(false);
  const [guardandoNuevoCobro, setGuardandoNuevoCobro] = useState(false);

  const [historialAbierto, setHistorialAbierto] =
  useState(false);

const [cobroHistorial, setCobroHistorial] =
  useState<Cobro | null>(null);
  const habitacionesDisponibles = filtroVivienda
    ? habitaciones.filter((habitacion) => habitacion.vivienda_id === filtroVivienda)
    : habitaciones;
  const cobrosFiltrados = cobros.filter((cobro) => {
    const habitacion = habitaciones.find((item) => item.id === cobro.habitacion_id);

    if (filtroVivienda && habitacion?.vivienda_id !== filtroVivienda) return false;
    if (filtroHabitacion && cobro.habitacion_id !== filtroHabitacion) return false;
    if (filtroEstado === "ABIERTOS" && (cobro.estado === "PAGADO" || cobro.estado === "DEUDA")) return false;
    if (filtroEstado && filtroEstado !== "ABIERTOS" && cobro.estado !== filtroEstado) return false;

    return true;
  });
  const periodosConCobros = useMemo(() => [...new Set(cobros.map((cobro) => `${cobro.periodo_anio}-${String(cobro.periodo_mes).padStart(2, "0")}`))].sort().reverse(), [cobros]);
  const periodoSeleccionado = periodosConCobros.includes(periodoResumen) ? periodoResumen : periodosConCobros[0] ?? periodoResumen;
  const [anioSeleccionado, mesSeleccionado] = periodoSeleccionado.split("-").map(Number);
  const cobrosDelMes = cobros.filter((cobro) => cobro.periodo_anio === anioSeleccionado && cobro.periodo_mes === mesSeleccionado);
  const resumen = calcularResumen(cobrosDelMes);
  const anioActual = anioSeleccionado;
  const cobrosDelAnio = cobros.filter(
    (cobro) => cobro.periodo_anio === anioActual
  );
  const resumenAnual = calcularResumen(cobrosDelAnio);
  const resumenViviendasMes = useMemo(() => {
    return viviendas.map((vivienda) => {
      const habitacionesVivienda = new Set(
        habitaciones
          .filter((habitacion) => habitacion.vivienda_id === vivienda.id)
          .map((habitacion) => habitacion.id)
      );
      const cobrosVivienda = cobrosDelMes.filter(
        (cobro) =>
          habitacionesVivienda.has(cobro.habitacion_id)
      );

      return {
        viviendaId: vivienda.id,
        nombre: vivienda.nombre,
        ...calcularResumen(cobrosVivienda),
      };
    });
  }, [cobrosDelMes, habitaciones, viviendas]);
  const mesesConCobrosEnAnio = new Set(cobrosDelAnio.map((cobro) => cobro.periodo_mes)).size;
  const mediaMensualCobrada = resumenAnual.cobradas / Math.max(1, mesesConCobrosEnAnio);
  const cobradoPorMes = cobrosDelAnio.reduce<Record<number, number>>(
    (acumulado, cobro) => ({
      ...acumulado,
      [cobro.periodo_mes]: (acumulado[cobro.periodo_mes] ?? 0) + Number(cobro.pagado),
    }),
    {}
  );
  const mejorMesCobrado = Math.max(0, ...Object.values(cobradoPorMes));
  const cobrosConPago = cobrosDelAnio.filter((cobro) => Number(cobro.pagado) > 0).length;
  useEffect(() => {
    cargarDatos();
  }, []);
async function guardarPago(datos: {
  importe: number;
  fecha: string;
  metodo: string;
  observaciones: string;
}) {

  if (!cobroSeleccionado) return;

  try {
  setGuardandoPago(true);

  console.log("Cobro seleccionado:", cobroSeleccionado);

  await registrarPago({
    cobroId: cobroSeleccionado.id,
    importe: datos.importe,
    fecha: datos.fecha,
    metodo: datos.metodo,
    observaciones: datos.observaciones,
  });

  console.log("Pago registrado");

  setModalPagoAbierto(false);
  setCobroSeleccionado(null);

  await cargarDatos();
} catch (error) {
  console.error(error);
  alert(JSON.stringify(error));
} finally {
  setGuardandoPago(false);
}
}
  async function guardarNuevoCobro(datos: DatosNuevoCobro) {
    const yaExiste = cobros.some(
      (cobro) => cobro.habitacion_id === datos.habitacionId && cobro.periodo_mes === datos.periodoMes && cobro.periodo_anio === datos.periodoAnio
    );

    if (yaExiste) {
      alert("Ya existe un cobro para esta habitación y este periodo.");
      return;
    }

    try {
      setGuardandoNuevoCobro(true);
      const total = datos.alquiler + datos.gastos;
      await crearCobro({
        habitacion_id: datos.habitacionId,
        inquilino_id: datos.inquilinoId,
        periodo_mes: datos.periodoMes,
        periodo_anio: datos.periodoAnio,
        alquiler: datos.alquiler,
        gastos: datos.gastos,
        total,
        pagado: 0,
        pendiente: total,
        estado: "PENDIENTE",
        fecha_vencimiento: datos.fechaVencimiento || null,
        observaciones: datos.observaciones.trim() || null,
      });
      setModalNuevoCobroAbierto(false);
      await cargarDatos();
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo crear el cobro.");
    } finally {
      setGuardandoNuevoCobro(false);
    }
  }

  async function convertirEnDeuda(cobro: Cobro) {
    const confirmar = window.confirm(
      `¿Marcar los ${formatoKpiCobro.format(Number(cobro.pendiente))} pendientes como deuda? No se contará como cobrado y quedará en el historial de deudas.`
    );
    if (!confirmar) return;

    try {
      await marcarCobroComoDeuda(cobro.id);
      await cargarDatos();
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo marcar el cobro como deuda.");
    }
  }

  async function cargarDatos() {
    setCargando(true);

    const avisos: string[] = [];
    try {
      const resultado = await generarCobrosPendientes();
      if (resultado.creados) avisos.push(`Se han generado ${resultado.creados} cobro${resultado.creados === 1 ? "" : "s"} pendiente${resultado.creados === 1 ? "" : "s"} hasta el mes actual.`);
    } catch (error) {
      console.error("No se pudieron generar los cobros mensuales", error);
      avisos.push("No se han podido generar los cobros automáticos.");
    }
    setAvisoGeneracion(avisos.length ? avisos.join(" ") : null);

    const listaCobros = await obtenerCobros();

    setCobros(listaCobros);

    const { data: habitacionesData } = await supabase
      .from("habitaciones")
      .select("*")
      .order("codigo");

    const { data: viviendasData } = await supabase
      .from("viviendas")
      .select("*")
      .order("nombre");

    const { data: inquilinosData } = await supabase
      .from("inquilinos")
      .select("*")
      .eq("activo", true)
      .order("nombre");

    const { data: gastosData } = await supabase
      .from("gastos")
      .select("vivienda_id, fecha, importe, estado");

    const { data: estanciasData } = await supabase
      .from("estancias")
      .select("id, inquilino_id, habitacion_id, fecha_entrada, fecha_salida, precio, gastos, created_at");

    setHabitaciones((habitacionesData ?? []) as Habitacion[]);
    setViviendas((viviendasData ?? []) as Vivienda[]);
    setInquilinos((inquilinosData ?? []) as Inquilino[]);
    setGastosVivienda((gastosData ?? []) as GastoVivienda[]);
    setEstancias((estanciasData ?? []) as EstanciaResumen[]);

    setCargando(false);
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:gap-4">
        <Wallet size={34} color="#2563eb" />

        <div>
          <h1 style={{ margin: 0 }}>Cobros</h1>

          <p
            style={{
              marginTop: 6,
              color: "#64748b",
            }}
          >
            Control mensual de alquileres y pagos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalNuevoCobroAbierto(true)}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white sm:ml-auto sm:w-auto"
        >
          + Nuevo cobro
        </button>
      </div>

       {cargando ? (
  <p>Cargando...</p>
) : (
  <>
    <div className="mb-6 flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
      <BotonVista activa={vistaActiva === "RESUMEN"} onClick={() => setVistaActiva("RESUMEN")} icono={<LayoutDashboard size={17} />} texto="Resumen" />
      <BotonVista activa={vistaActiva === "COBROS"} onClick={() => setVistaActiva("COBROS")} icono={<ListFilter size={17} />} texto="Listado de cobros" />
      <BotonVista activa={vistaActiva === "GASTOS"} onClick={() => setVistaActiva("GASTOS")} icono={<BarChart3 size={17} />} texto="Balance de gastos" />
    </div>
    {avisoGeneracion && <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900">{avisoGeneracion}</div>}
    {vistaActiva === "RESUMEN" && (
    <>
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 style={{ margin: 0, fontSize: 20 }}>Resumen mensual · {new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(anioSeleccionado, mesSeleccionado - 1, 1)))}</h2>
        <p style={{ margin: "6px 0 0", color: "#64748b" }}>Situación de los cobros emitidos en el periodo seleccionado.</p>
      </div>
      <label className="text-sm font-semibold text-slate-700">Mes con cobros
        <select value={periodoSeleccionado} onChange={(event) => setPeriodoResumen(event.target.value)} className="mt-1 block min-w-52 rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900">
          {periodosConCobros.map((periodo) => {
            const [anio, mes] = periodo.split("-").map(Number);
            return <option key={periodo} value={periodo}>{new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(anio, mes - 1, 1)))}</option>;
          })}
        </select>
      </label>
    </div>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
        gap: 12,
        marginBottom: 22,
      }}
    >
      <Tarjeta
        titulo="Previsto de cobro"
        valor={formatoKpiCobro.format(resumen.previstas)}
        icono={<Euro size={22} color="#2563eb" />}
      />

      <Tarjeta
        titulo="Cobrado"
        valor={formatoKpiCobro.format(resumen.cobradas)}
        icono={<CheckCircle2 size={22} color="green" />}
      />

      <Tarjeta
        titulo="Pendiente"
        valor={formatoKpiCobro.format(resumen.pendientes)}
        icono={<AlertTriangle size={22} color="#dc2626" />}
      />

      <Tarjeta
        titulo="Deuda no cobrada"
        valor={formatoKpiCobro.format(resumen.deudas)}
        icono={<AlertTriangle size={22} color="#7c3aed" />}
      />

      <Tarjeta
        titulo="Habitaciones con pendiente"
        valor={String(resumen.habitacionesPendientes)}
        icono={<Wallet size={22} color="#ea580c" />}
      />
    </div>

    <PanelCobrosPorVivienda viviendas={resumenViviendasMes} />

    <div style={{ margin: "38px 0 16px" }}>
      <h2 style={{ margin: 0, fontSize: 20 }}>Cobro real del año · {anioSeleccionado}</h2>
      <p style={{ margin: "6px 0 0", color: "#64748b" }}>Solo dinero ya cobrado, sin previsiones ni importes pendientes.</p>
    </div>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
        gap: 12,
        marginBottom: 22,
      }}
    >
      <Tarjeta
  titulo="Cobrado acumulado"
  valor={formatoKpiCobro.format(resumenAnual.cobradas)}
  icono={<Euro size={22} color="#2563eb" />}
/>

<Tarjeta
  titulo="Media mensual cobrada"
  valor={formatoKpiCobro.format(mediaMensualCobrada)}
  icono={<CheckCircle2 size={22} color="green" />}
/>

<Tarjeta
  titulo="Mejor mes cobrado"
  valor={formatoKpiCobro.format(mejorMesCobrado)}
  icono={<Wallet size={22} color="#7c3aed" />}
/>

<Tarjeta
  titulo="Cobros con pago"
  valor={String(cobrosConPago)}
  icono={<CheckCircle2 size={22} color="#16a34a" />}
/>
    </div>

    <PanelAnaliticaOcupacion estancias={estancias} habitaciones={habitaciones} viviendas={viviendas} anio={anioSeleccionado} />

    </>
    )}

   {vistaActiva === "COBROS" && <>
   <div style={{ marginBottom: 16 }}>
     <h2 style={{ margin: 0, fontSize: 20 }}>Listado de cobros</h2>
     <p style={{ margin: "6px 0 0", color: "#64748b" }}>{filtroVivienda || filtroHabitacion ? "Historial de la selección: incluye también los cobros pagados." : "Vista de trabajo: solo pendientes y parciales. Selecciona una vivienda o habitación para consultar su historial."}</p>
   </div>
   <div className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
     <label className="flex min-w-52 flex-1 flex-col gap-1 text-sm font-medium text-slate-700 max-sm:min-w-0 max-sm:flex-none max-sm:w-full">
       Vivienda
       <select
         className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-base font-normal text-slate-900 outline-none focus:border-blue-500"
         value={filtroVivienda}
         onChange={(event) => {
           setFiltroVivienda(event.target.value);
           setFiltroHabitacion("");
           setFiltroEstado("");
         }}
       >
         <option value="">Todas las viviendas</option>
         {viviendas.map((vivienda) => (
           <option key={vivienda.id} value={vivienda.id}>{vivienda.nombre}</option>
         ))}
       </select>
     </label>
     <label className="flex min-w-44 flex-1 flex-col gap-1 text-sm font-medium text-slate-700 max-sm:min-w-0 max-sm:flex-none max-sm:w-full">
       Habitaci{"\u00f3"}n
       <select
         className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-base font-normal text-slate-900 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
         value={filtroHabitacion}
         onChange={(event) => {
           setFiltroHabitacion(event.target.value);
           if (event.target.value) setFiltroEstado("");
         }}
         disabled={habitacionesDisponibles.length === 0}
       >
         <option value="">Todas las habitaciones</option>
         {habitacionesDisponibles.map((habitacion) => (
           <option key={habitacion.id} value={habitacion.id}>{habitacion.codigo}</option>
         ))}
       </select>
     </label>
     <label className="flex min-w-44 flex-1 flex-col gap-1 text-sm font-medium text-slate-700 max-sm:min-w-0 max-sm:flex-none max-sm:w-full">
       Estado
       <select
         className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-base font-normal text-slate-900 outline-none focus:border-blue-500"
         value={filtroEstado}
         onChange={(event) => setFiltroEstado(event.target.value as FiltroEstadoCobro)}
       >
         <option value="ABIERTOS">Pendientes y parciales</option>
         <option value="">Todos los estados (historial)</option>
         <option value="PENDIENTE">Pendiente</option>
         <option value="PARCIAL">Parcial</option>
         <option value="PAGADO">Pagado</option>
         <option value="DEUDA">Deuda pendiente</option>
       </select>
     </label>
     <div className="flex w-full items-center gap-3 pb-1 text-sm text-slate-500 sm:w-auto">
       <span>{cobrosFiltrados.length} {cobrosFiltrados.length === 1 ? "cobro" : "cobros"}</span>
       {(filtroVivienda || filtroHabitacion || filtroEstado) && (
         <button
           type="button"
           className="font-medium text-blue-600 hover:text-blue-800"
           onClick={() => {
             setFiltroVivienda("");
             setFiltroHabitacion("");
             setFiltroEstado("ABIERTOS");
           }}
         >
           Limpiar filtros
         </button>
       )}
     </div>
   </div>
   <CobrosTable
  cobros={cobrosFiltrados}
  habitaciones={habitaciones}
  viviendas={viviendas}
  inquilinos={inquilinos}
  onRegistrarPago={(cobro) => {
    setCobroSeleccionado(cobro);
    setModalPagoAbierto(true);
  }}
  onVerHistorial={(cobro) => {
    setCobroHistorial(cobro);
    setHistorialAbierto(true);
  }}
  onEditar={(cobro) => {
    setCobroHistorial(cobro);
    setHistorialAbierto(true);
  }}
  onEliminar={eliminarCobroSeleccionado}
  onMarcarDeuda={convertirEnDeuda}
/>
   </>}
   {vistaActiva === "GASTOS" && <BalanceGastosViviendas cobros={cobros} gastos={gastosVivienda} habitaciones={habitaciones} viviendas={viviendas} />}
  </>
)}

<RegistrarPagoModal
  abierto={modalPagoAbierto}
  cobro={cobroSeleccionado}
  cargando={guardandoPago}
  onCerrar={() => {
    setModalPagoAbierto(false);
    setCobroSeleccionado(null);
  }}
  onGuardar={guardarPago}
/>

<HistorialCobrosModal
  abierto={historialAbierto}
  cobro={cobroHistorial}
  onCerrar={() => {
    setHistorialAbierto(false);
    setCobroHistorial(null);
  }}
  onActualizado={async () => {
    await cargarDatos();
  }}
/>

{modalNuevoCobroAbierto && (
  <CrearCobroModal
    habitaciones={habitaciones}
    viviendas={viviendas}
    inquilinos={inquilinos}
    estancias={estancias}
    guardando={guardandoNuevoCobro}
    onCerrar={() => setModalNuevoCobroAbierto(false)}
    onGuardar={guardarNuevoCobro}
  />
)}
</>
);
}
type TarjetaProps = {
  titulo: string;
  valor: string;
  icono: React.ReactNode;
};

function Tarjeta({
  titulo,
  valor,
  icono,
}: TarjetaProps) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #e2e8f0",
        padding: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        {icono}
      </div>

      <div
        style={{
          color: "#64748b",
          fontSize: 14,
        }}
      >
        {titulo}
      </div>

      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
          marginTop: 6,
        }}
      >
        {valor}
      </div>
    </div>
  );
}

function BotonVista({ activa, onClick, icono, texto }: { activa: boolean; onClick: () => void; icono: React.ReactNode; texto: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${activa ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
    >
      {icono}
      {texto}
    </button>
  );
}

function PanelCobrosPorVivienda({ viviendas }: { viviendas: ResumenViviendaMes[] }) {
  return (
    <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-blue-100 p-2 text-blue-700"><Building2 size={20} /></div>
        <div>
          <h2 className="font-bold text-slate-900">Cobros del mes por vivienda</h2>
          <p className="text-sm text-slate-500">Previsto, recibido, pendiente y deuda no cobrada en cada vivienda.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {viviendas.map((vivienda) => (
          <article key={vivienda.viviendaId} className="rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900">{vivienda.nombre}</h3>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3"><span className="text-slate-500">Previsto</span><strong className="text-slate-900">{formatoKpiCobro.format(vivienda.previstas)}</strong></div>
              <div className="flex items-center justify-between gap-3"><span className="text-slate-500">Cobrado</span><strong className="text-green-700">{formatoKpiCobro.format(vivienda.cobradas)}</strong></div>
              <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-2"><span className="font-medium text-slate-600">Pendiente</span><strong className={vivienda.pendientes > 0 ? "text-red-600" : "text-slate-900"}>{formatoKpiCobro.format(vivienda.pendientes)}</strong></div>
              <div className="flex items-center justify-between gap-3"><span className="font-medium text-slate-600">Deuda no cobrada</span><strong className={vivienda.deudas > 0 ? "text-violet-700" : "text-slate-900"}>{formatoKpiCobro.format(vivienda.deudas)}</strong></div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function fechaIso(anio: number, mes: number, dia: number) {
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function diasEntre(inicio: string, fin: string) {
  const desde = new Date(`${inicio.slice(0, 10)}T12:00:00`).getTime();
  const hasta = new Date(`${fin.slice(0, 10)}T12:00:00`).getTime();
  return Math.max(1, Math.round((hasta - desde) / 86_400_000) + 1);
}

function formatoEstancia(dias: number) {
  if (dias < 31) return `${dias} días`;
  const meses = Math.floor(dias / 30);
  const resto = dias % 30;
  return `${meses} mes${meses === 1 ? "" : "es"}${resto ? ` y ${resto} días` : ""}`;
}

function PanelAnaliticaOcupacion({ estancias, habitaciones, viviendas, anio }: { estancias: EstanciaResumen[]; habitaciones: Habitacion[]; viviendas: Vivienda[]; anio: number }) {
  const hoy = new Date();
  const hoyIso = fechaIso(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate());
  const porInquilino = new Map<string, { inicio: string; fin: string }>();
  for (const estancia of estancias) {
    const actual = porInquilino.get(estancia.inquilino_id);
    const fin = estancia.fecha_salida ?? hoyIso;
    porInquilino.set(estancia.inquilino_id, {
      inicio: !actual || estancia.fecha_entrada < actual.inicio ? estancia.fecha_entrada : actual.inicio,
      fin: !actual || fin > actual.fin ? fin : actual.fin,
    });
  }
  const duraciones = [...porInquilino.values()].map(({ inicio, fin }) => diasEntre(inicio, fin));
  const mediaDias = duraciones.length ? Math.round(duraciones.reduce((suma, dias) => suma + dias, 0) / duraciones.length) : 0;
  const mesActual = hoy.getFullYear() === anio ? hoy.getMonth() + 1 : 12;
  const meses = Array.from({ length: mesActual }, (_, indice) => indice + 1);
  const etiquetaMes = (mes: number) => new Intl.DateTimeFormat("es-ES", { month: "short" }).format(new Date(anio, mes - 1, 1)).replace(".", "");

  return <section className="mt-6 grid gap-5 xl:grid-cols-[280px_1fr]">
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center gap-3"><div className="rounded-lg bg-blue-100 p-2 text-blue-700"><UsersRound size={20} /></div><div><h2 className="font-bold text-slate-900">Estancia media</h2><p className="text-sm text-slate-500">Por inquilino, según su trayectoria.</p></div></div>
      <p className="mt-5 text-3xl font-bold text-slate-900">{formatoEstancia(mediaDias)}</p>
      <p className="mt-2 text-sm text-slate-500">Calculada sobre {duraciones.length} inquilino{duraciones.length === 1 ? "" : "s"} con estancia registrada.</p>
    </article>
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-center gap-3"><div className="rounded-lg bg-violet-100 p-2 text-violet-700"><TrendingUp size={20} /></div><div><h2 className="font-bold text-slate-900">Evolución de ocupación por vivienda</h2><p className="text-sm text-slate-500">Habitaciones ocupadas cada mes de {anio}.</p></div></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Enero a {etiquetaMes(mesActual)}</span></div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {viviendas.map((vivienda) => {
          const habitacionesVivienda = habitaciones.filter((habitacion) => habitacion.vivienda_id === vivienda.id);
          if (!habitacionesVivienda.length) return null;
          const puntos = meses.map((mes) => {
            const ultimoDia = new Date(anio, mes, 0).getDate();
            const inicio = fechaIso(anio, mes, 1);
            const fin = fechaIso(anio, mes, ultimoDia);
            const ocupadas = habitacionesVivienda.filter((habitacion) => estancias.some((estancia) => estancia.habitacion_id === habitacion.id && estancia.fecha_entrada <= fin && (!estancia.fecha_salida || estancia.fecha_salida >= inicio))).length;
            return { mes, ocupadas, porcentaje: Math.round((ocupadas / habitacionesVivienda.length) * 100) };
          });
          const ultimo = puntos[puntos.length - 1];
          return <div key={vivienda.id} className="rounded-xl border border-slate-100 p-4"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 font-semibold text-slate-900"><Building2 size={17} className="text-blue-600" />{vivienda.nombre}</div><span className="text-sm font-semibold text-slate-600">{ultimo.ocupadas}/{habitacionesVivienda.length} hoy</span></div><div className="mt-4 flex h-28 items-end gap-1.5 border-b border-slate-200 pb-1">{puntos.map((punto) => <div key={punto.mes} className="flex h-full min-w-0 flex-1 flex-col justify-end"><div title={`${etiquetaMes(punto.mes)}: ${punto.ocupadas}/${habitacionesVivienda.length} (${punto.porcentaje}%)`} className="rounded-t bg-blue-500 transition-all" style={{ height: `${Math.max(punto.porcentaje, punto.ocupadas ? 8 : 0)}%` }} /></div>)}</div><div className="mt-2 flex gap-1.5 text-center text-[10px] font-medium text-slate-400">{puntos.map((punto) => <span key={punto.mes} className="min-w-0 flex-1 truncate">{etiquetaMes(punto.mes)}</span>)}</div></div>;
        })}
      </div>
    </article>
  </section>;
}
