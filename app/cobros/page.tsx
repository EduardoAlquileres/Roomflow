"use client";

import { useEffect, useState } from "react";
import {
  Wallet,
  Euro,
  AlertTriangle,
  CheckCircle2,
  LayoutDashboard,
  ListFilter,
  BarChart3,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import {
  crearCobro,
  obtenerCobros,
  eliminarCobro,
} from "@/lib/cobros";

import CobrosTable from "@/components/CobrosTable";
import RegistrarPagoModal from "@/components/RegistrarPagoModal";
import HistorialCobrosModal from "@/components/HistorialCobrosModal";
import { registrarPago } from "@/lib/movimientosCobro";
import { generarCobrosPendientes } from "@/lib/generarCobrosPendientes";
import { sincronizarCobrosHistoricos } from "@/lib/sincronizarCobrosHistoricos";

import { Cobro } from "@/types/cobro";
import CrearCobroModal, {
  DatosNuevoCobro,
} from "@/components/CrearCobroModal";
import BalanceGastosViviendas from "@/components/BalanceGastosViviendas";

type Resumen = {
  previstas: number;
  cobradas: number;
  pendientes: number;
  habitacionesPendientes: number;
};

function calcularResumen(cobros: Cobro[]): Resumen {
  return {
    previstas: cobros.reduce((suma, cobro) => suma + Number(cobro.total), 0),
    cobradas: cobros.reduce((suma, cobro) => suma + Number(cobro.pagado), 0),
    pendientes: cobros.reduce((suma, cobro) => suma + Number(cobro.pendiente), 0),
    habitacionesPendientes: new Set(
      cobros.filter((cobro) => cobro.estado !== "PAGADO").map((cobro) => cobro.habitacion_id)
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

type Inquilino = {
  id: string;
  nombre: string;
  apellidos: string;
  activo: boolean;
  habitacion_id: string;
};

export default function CobrosPage() {
  const [cargando, setCargando] = useState(true);
  const [vistaActiva, setVistaActiva] = useState<"RESUMEN" | "COBROS" | "GASTOS">("RESUMEN");
  const [avisoGeneracion, setAvisoGeneracion] = useState<string | null>(null);

  const [resumen, setResumen] = useState<Resumen>({
    previstas: 0,
    cobradas: 0,
    pendientes: 0,
    habitacionesPendientes: 0,
  });
  const [resumenAnual, setResumenAnual] = useState<Resumen>({
    previstas: 0,
    cobradas: 0,
    pendientes: 0,
    habitacionesPendientes: 0,
  });
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
  const [filtroEstado, setFiltroEstado] = useState<"" | Cobro["estado"]>("");

  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);

  const [viviendas, setViviendas] = useState<Vivienda[]>([]);
  const [gastosVivienda, setGastosVivienda] = useState<GastoVivienda[]>([]);

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
    if (filtroEstado && cobro.estado !== filtroEstado) return false;

    return true;
  });
  const fechaActual = new Date();
  const anioActual = fechaActual.getFullYear();
  const cobrosDelAnio = cobros.filter(
    (cobro) => cobro.periodo_anio === anioActual
  );
  const mediaMensualCobrada = resumenAnual.cobradas / (fechaActual.getMonth() + 1);
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
    try {
      const resultado = await sincronizarCobrosHistoricos();
      if (resultado.actualizados) avisos.push(`Se han ajustado ${resultado.actualizados} cobro${resultado.actualizados === 1 ? "" : "s"} a su estancia histórica.`);
    } catch (error) {
      console.error("No se pudieron sincronizar los cobros históricos", error);
      avisos.push("No se han podido ajustar los cobros históricos.");
    }
    setAvisoGeneracion(avisos.length ? avisos.join(" ") : null);

    const listaCobros = await obtenerCobros();

    setCobros(listaCobros);

    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth() + 1;
    const anioActual = fechaActual.getFullYear();
    const cobrosMes = listaCobros.filter(
      (cobro) => cobro.periodo_mes === mesActual && cobro.periodo_anio === anioActual
    );
    const cobrosAnuales = listaCobros.filter(
      (cobro) => cobro.periodo_anio === anioActual
    );

    setResumen(calcularResumen(cobrosMes));
    setResumenAnual(calcularResumen(cobrosAnuales));

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

    setHabitaciones((habitacionesData ?? []) as Habitacion[]);
    setViviendas((viviendasData ?? []) as Vivienda[]);
    setInquilinos((inquilinosData ?? []) as Inquilino[]);
    setGastosVivienda((gastosData ?? []) as GastoVivienda[]);

    setCargando(false);
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 30,
        }}
      >
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
          style={{
            marginLeft: "auto",
            padding: "10px 16px",
            border: "none",
            borderRadius: 8,
            background: "#2563eb",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          + Nuevo cobro
        </button>
      </div>

       {cargando ? (
  <p>Cargando...</p>
) : (
  <>
    <div className="mb-6 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
      <BotonVista activa={vistaActiva === "RESUMEN"} onClick={() => setVistaActiva("RESUMEN")} icono={<LayoutDashboard size={17} />} texto="Resumen" />
      <BotonVista activa={vistaActiva === "COBROS"} onClick={() => setVistaActiva("COBROS")} icono={<ListFilter size={17} />} texto="Listado de cobros" />
      <BotonVista activa={vistaActiva === "GASTOS"} onClick={() => setVistaActiva("GASTOS")} icono={<BarChart3 size={17} />} texto="Balance de gastos" />
    </div>
    {avisoGeneracion && <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900">{avisoGeneracion}</div>}
    {vistaActiva === "RESUMEN" && (
    <>
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ margin: 0, fontSize: 20 }}>Mes en curso · {new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(new Date())}</h2>
      <p style={{ margin: "6px 0 0", color: "#64748b" }}>Situación de los cobros emitidos este mes.</p>
    </div>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4,minmax(0,1fr))",
        gap: 20,
        marginBottom: 30,
      }}
    >
      <Tarjeta
        titulo="Previsto de cobro"
        valor={`${resumen.previstas.toFixed(2)} €`}
        icono={<Euro size={28} color="#2563eb" />}
      />

      <Tarjeta
        titulo="Cobrado"
        valor={`${resumen.cobradas.toFixed(2)} €`}
        icono={<CheckCircle2 size={28} color="green" />}
      />

      <Tarjeta
        titulo="Pendiente"
        valor={`${resumen.pendientes.toFixed(2)} €`}
        icono={<AlertTriangle size={28} color="#dc2626" />}
      />

      <Tarjeta
        titulo="Habitaciones con pendiente"
        valor={String(resumen.habitacionesPendientes)}
        icono={<Wallet size={28} color="#ea580c" />}
      />
    </div>

    <div style={{ margin: "38px 0 16px" }}>
      <h2 style={{ margin: 0, fontSize: 20 }}>Cobro real del año · {anioActual}</h2>
      <p style={{ margin: "6px 0 0", color: "#64748b" }}>Solo dinero ya cobrado, sin previsiones ni importes pendientes.</p>
    </div>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4,minmax(0,1fr))",
        gap: 20,
        marginBottom: 30,
      }}
    >
      <Tarjeta
  titulo="Cobrado acumulado"
  valor={new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(resumenAnual.cobradas)}
  icono={<Euro size={28} color="#2563eb" />}
/>

<Tarjeta
  titulo="Media mensual cobrada"
  valor={new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(mediaMensualCobrada)}
  icono={<CheckCircle2 size={28} color="green" />}
/>

<Tarjeta
  titulo="Mejor mes cobrado"
  valor={new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(mejorMesCobrado)}
  icono={<Wallet size={28} color="#7c3aed" />}
/>

<Tarjeta
  titulo="Cobros con pago"
  valor={String(cobrosConPago)}
  icono={<CheckCircle2 size={28} color="#16a34a" />}
/>
    </div>

    </>
    )}

   {vistaActiva === "COBROS" && <>
   <div style={{ marginBottom: 16 }}>
     <h2 style={{ margin: 0, fontSize: 20 }}>Listado de cobros</h2>
     <p style={{ margin: "6px 0 0", color: "#64748b" }}>Gestiona pagos, recibos, historial y correcciones de cada habitación.</p>
   </div>
   <div className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
     <label className="flex min-w-52 flex-1 flex-col gap-1 text-sm font-medium text-slate-700">
       Vivienda
       <select
         className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-base font-normal text-slate-900 outline-none focus:border-blue-500"
         value={filtroVivienda}
         onChange={(event) => {
           setFiltroVivienda(event.target.value);
           setFiltroHabitacion("");
         }}
       >
         <option value="">Todas las viviendas</option>
         {viviendas.map((vivienda) => (
           <option key={vivienda.id} value={vivienda.id}>{vivienda.nombre}</option>
         ))}
       </select>
     </label>
     <label className="flex min-w-44 flex-1 flex-col gap-1 text-sm font-medium text-slate-700">
       Habitaci{"\u00f3"}n
       <select
         className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-base font-normal text-slate-900 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
         value={filtroHabitacion}
         onChange={(event) => setFiltroHabitacion(event.target.value)}
         disabled={habitacionesDisponibles.length === 0}
       >
         <option value="">Todas las habitaciones</option>
         {habitacionesDisponibles.map((habitacion) => (
           <option key={habitacion.id} value={habitacion.id}>{habitacion.codigo}</option>
         ))}
       </select>
     </label>
     <label className="flex min-w-44 flex-1 flex-col gap-1 text-sm font-medium text-slate-700">
       Estado
       <select
         className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-base font-normal text-slate-900 outline-none focus:border-blue-500"
         value={filtroEstado}
         onChange={(event) => setFiltroEstado(event.target.value as "" | Cobro["estado"])}
       >
         <option value="">Todos los estados</option>
         <option value="PENDIENTE">Pendiente</option>
         <option value="PARCIAL">Parcial</option>
         <option value="PAGADO">Pagado</option>
       </select>
     </label>
     <div className="flex items-center gap-3 pb-1 text-sm text-slate-500">
       <span>{cobrosFiltrados.length} {cobrosFiltrados.length === 1 ? "cobro" : "cobros"}</span>
       {(filtroVivienda || filtroHabitacion || filtroEstado) && (
         <button
           type="button"
           className="font-medium text-blue-600 hover:text-blue-800"
           onClick={() => {
             setFiltroVivienda("");
             setFiltroHabitacion("");
             setFiltroEstado("");
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
    console.log("Editar cobro", cobro);
  }}
  onEliminar={eliminarCobroSeleccionado}
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
        padding: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
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
          fontSize: 30,
          fontWeight: 700,
          marginTop: 8,
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
