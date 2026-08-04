import { BanknoteArrowDown, CircleDollarSign, ShieldCheck, ShieldX } from "lucide-react";
import { ReactNode } from "react";
import { obtenerFianzas } from "@/lib/fianzas";
import { obtenerHabitaciones } from "@/lib/habitaciones";
import { obtenerInquilinos } from "@/lib/inquilinos";
import { obtenerViviendas } from "@/lib/viviendas";

export const dynamic = "force-dynamic";

const moneda = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

const fecha = (valor: string | null) =>
  valor
    ? new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(
        new Date(`${valor.slice(0, 10)}T00:00:00`)
      )
    : "-";

function Tarjeta({ titulo, importe, detalle, icono, color }: { titulo: string; importe: number; detalle: string; icono: ReactNode; color: string }) {
  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className={`flex items-center gap-3 ${color}`}>
        {icono}
        <span className="text-sm font-medium text-slate-600">{titulo}</span>
      </div>
      <p className="mt-4 text-3xl font-bold text-slate-900">{moneda.format(importe)}</p>
      <p className="mt-1 text-sm text-slate-500">{detalle}</p>
    </article>
  );
}

export default async function FianzasPage() {
  const [fianzas, inquilinos, habitaciones, viviendas] = await Promise.all([
    obtenerFianzas(),
    obtenerInquilinos(),
    obtenerHabitaciones(),
    obtenerViviendas(),
  ]);

  const filtrar = (estado: string) => fianzas.filter((fianza) => fianza.estado === estado);
  const enDeposito = filtrar("COBRADA");
  const porRevisar = filtrar("PENDIENTE_REVISION");
  const devueltas = filtrar("DEVUELTA");
  const retenidas = filtrar("RETENIDA");
  const fianzasPendientes = [...enDeposito, ...porRevisar];
  const total = (items: typeof fianzas, campo: "importe" | "importe_devuelto" | "importe_retenido" = "importe") =>
    items.reduce((suma, item) => suma + Number(item[campo]), 0);
  const totalEntregado = (items: typeof fianzas) =>
    items.reduce((suma, item) => suma + Number(item.importe_entregado), 0);

  const textoEstado = (valor: string) => {
    if (valor === "COBRADA") return ["En dep\u00f3sito", "bg-blue-50 text-blue-700"];
    if (valor === "DEVUELTA") return ["Devuelta", "bg-green-50 text-green-700"];
    if (valor === "RETENIDA") return ["Retenida", "bg-amber-50 text-amber-700"];
    return ["Revisar", "bg-violet-50 text-violet-700"];
  };

  const fianzasPorVivienda = viviendas
    .map((vivienda) => {
      const fianzasVivienda = fianzasPendientes.filter(
        (fianza) => habitaciones.find((habitacion) => habitacion.id === fianza.habitacion_id)?.vivienda_id === vivienda.id
      );
      const enDepositoVivienda = fianzasVivienda.filter((fianza) => fianza.estado === "COBRADA");
      const porRevisarVivienda = fianzasVivienda.filter((fianza) => fianza.estado === "PENDIENTE_REVISION");

      return {
        id: vivienda.id,
        nombre: vivienda.nombre,
        enDeposito: totalEntregado(enDepositoVivienda),
        porRevisar: totalEntregado(porRevisarVivienda),
        total: totalEntregado(fianzasVivienda),
      };
    })
    .filter((vivienda) => vivienda.total > 0);

  return (
    <div>
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Fianzas</h1>
          <p className="mt-2 text-slate-500">Control de dep{"\u00f3"}sitos, devoluciones y retenciones. Las fianzas no se contabilizan como ingresos de alquiler.</p>
        </div>
        <div className="rounded-xl bg-blue-50 px-4 py-3 text-right text-blue-700">
          <div className="text-2xl font-bold">{fianzas.length}</div>
          <div className="text-sm font-medium">fianzas registradas</div>
        </div>
      </div>

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Tarjeta titulo={"En dep\u00f3sito"} importe={totalEntregado(enDeposito)} detalle={`${enDeposito.length} fianza${enDeposito.length === 1 ? "" : "s"} con importe entregado`} icono={<ShieldCheck size={22} />} color="text-blue-600" />
        <Tarjeta titulo={"Hist\u00f3ricas por revisar"} importe={totalEntregado(porRevisar)} detalle={`${porRevisar.length} estancia${porRevisar.length === 1 ? "" : "s"} finalizada${porRevisar.length === 1 ? "" : "s"}`} icono={<CircleDollarSign size={22} />} color="text-violet-600" />
        <Tarjeta titulo="Devuelto" importe={total(devueltas, "importe_devuelto")} detalle={`${devueltas.length} devoluci\u00f3n${devueltas.length === 1 ? "" : "es"} realizada${devueltas.length === 1 ? "" : "s"}`} icono={<BanknoteArrowDown size={22} />} color="text-green-600" />
        <Tarjeta titulo="Retenido para gastos" importe={total(retenidas, "importe_retenido")} detalle={`${retenidas.length} retenci\u00f3n${retenidas.length === 1 ? "" : "es"}; no es renta`} icono={<ShieldX size={22} />} color="text-amber-600" />
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center gap-3 border-b border-slate-200 p-5">
          <div className="rounded-lg bg-blue-100 p-2 text-blue-600"><CircleDollarSign size={21} /></div>
          <div>
            <h2 className="font-bold text-slate-900">Fianzas pendientes por vivienda</h2>
            <p className="text-sm text-slate-500">Incluye las fianzas en dep{"\u00f3"}sito y las hist{"\u00f3"}ricas pendientes de revisar; excluye devueltas y retenidas.</p>
          </div>
        </div>
        {fianzasPorVivienda.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No hay fianzas pendientes actualmente.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead className="bg-slate-50 text-sm text-slate-600">
                <tr>
                  <th className="px-5 py-4 font-semibold">Vivienda</th>
                  <th className="px-5 py-4 text-right font-semibold">En dep{"\u00f3"}sito</th>
                  <th className="px-5 py-4 text-right font-semibold">Por revisar</th>
                  <th className="px-5 py-4 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {fianzasPorVivienda.map((vivienda) => (
                  <tr key={vivienda.id} className="border-t border-slate-100">
                    <td className="px-5 py-4 font-semibold text-slate-900">{vivienda.nombre}</td>
                    <td className="px-5 py-4 text-right text-slate-700">{moneda.format(vivienda.enDeposito)}</td>
                    <td className="px-5 py-4 text-right text-violet-700">{moneda.format(vivienda.porRevisar)}</td>
                    <td className="px-5 py-4 text-right font-bold text-slate-900">{moneda.format(vivienda.total)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-blue-100 bg-blue-50">
                  <td className="px-5 py-4 font-bold text-slate-900">Total general</td>
                  <td className="px-5 py-4 text-right font-bold text-blue-700">{moneda.format(totalEntregado(enDeposito))}</td>
                  <td className="px-5 py-4 text-right font-bold text-violet-700">{moneda.format(totalEntregado(porRevisar))}</td>
                  <td className="px-5 py-4 text-right text-lg font-bold text-blue-700">{moneda.format(totalEntregado(fianzasPendientes))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center gap-3 border-b border-slate-200 p-5">
          <div className="rounded-lg bg-blue-100 p-2 text-blue-600"><CircleDollarSign size={21} /></div>
          <div>
            <h2 className="font-bold text-slate-900">Registro de fianzas</h2>
            <p className="text-sm text-slate-500">Las fianzas hist{"\u00f3"}ricas finalizadas se marcan para revisar, sin inventar una devoluci{"\u00f3"}n ni un ingreso.</p>
          </div>
        </div>
        {fianzas.length === 0 ? (
          <p className="p-10 text-center text-slate-500">No hay fianzas registradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-slate-50 text-sm text-slate-600">
                <tr><th className="px-5 py-4 font-semibold">Inquilino</th><th className="px-5 py-4 font-semibold">Vivienda / habitaci{"\u00f3"}n</th><th className="px-5 py-4 font-semibold">Cobro</th><th className="px-5 py-4 font-semibold">Importe</th><th className="px-5 py-4 font-semibold">Resoluci{"\u00f3"}n</th><th className="px-5 py-4 font-semibold">Estado</th></tr>
              </thead>
              <tbody>
                {fianzas.map((fianza) => {
                  const inquilino = inquilinos.find((item) => item.id === fianza.inquilino_id);
                  const habitacion = habitaciones.find((item) => item.id === fianza.habitacion_id);
                  const vivienda = habitacion && viviendas.find((item) => item.id === habitacion.vivienda_id);
                  const [nombreEstado, estiloEstado] = textoEstado(fianza.estado);

                  return (
                    <tr key={fianza.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-5 py-4"><p className="font-semibold text-slate-900">{inquilino ? `${inquilino.nombre} ${inquilino.apellidos}` : "Inquilino eliminado"}</p><p className="mt-1 text-sm text-slate-500">{inquilino?.documento || "Sin documento"}</p></td>
                      <td className="px-5 py-4 text-slate-700">{vivienda?.nombre ?? "-"} / {habitacion?.codigo ?? "-"}</td>
                      <td className="px-5 py-4 text-slate-600">{fecha(fianza.fecha_cobro)}</td>
                      <td className="px-5 py-4 font-semibold text-slate-900">{moneda.format(Number(fianza.importe))}</td>
                      <td className="px-5 py-4 text-slate-600">{fianza.estado === "COBRADA" ? "Pendiente" : fianza.estado === "PENDIENTE_REVISION" ? "Revisar historial" : <><p>{fecha(fianza.fecha_resolucion)}</p>{fianza.motivo_retencion && <p className="mt-1 max-w-xs text-xs text-slate-500">{fianza.motivo_retencion}</p>}</>}</td>
                      <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${estiloEstado}`}>{nombreEstado}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
