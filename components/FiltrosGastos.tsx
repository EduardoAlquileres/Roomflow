import { CATEGORIAS_GASTO } from "@/constants/gastos";
import type { FiltrosGastos as Valores } from "@/lib/filtrosGastos";

const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

type Props = {
  valores: Valores;
  viviendas: { id: string; nombre: string }[];
  anios: string[];
  cambiar: (valores: Valores) => void;
  limpiar: () => void;
  cantidad: number;
  total: number;
};

export default function FiltrosGastos({ valores, viviendas, anios, cambiar, limpiar, cantidad, total }: Props) {
  const campos = [
    { campo: "viviendaId", etiqueta: "Vivienda", todos: "Todas las viviendas", opciones: viviendas.map((v) => ({ valor: v.id, texto: v.nombre })) },
    { campo: "categoria", etiqueta: "Tipo de gasto (categoría)", todos: "Todas las categorías", opciones: CATEGORIAS_GASTO.map((c) => ({ valor: c, texto: c })) },
    { campo: "tipo", etiqueta: "Reparto", todos: "Todos los gastos", opciones: [{ valor: "propio", texto: "Propio" }, { valor: "prorrateado", texto: "Prorrateado" }] },
    { campo: "mes", etiqueta: "Mes del gasto", todos: "Todos los meses", opciones: meses.map((m, i) => ({ valor: String(i + 1).padStart(2, "0"), texto: m })) },
    { campo: "anio", etiqueta: "Año del gasto", todos: "Todos los años", opciones: anios.map((a) => ({ valor: a, texto: a })) },
  ] as const;

  return <div className="border-b border-slate-200 bg-slate-50 p-4">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {campos.map(({ campo, etiqueta, todos, opciones }) => <label key={campo} className="text-sm font-medium text-slate-700">{etiqueta}
        <select value={valores[campo]} onChange={(e) => cambiar({ ...valores, [campo]: e.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900">
          <option value="">{todos}</option>
          {opciones.map((o) => <option key={o.valor} value={o.valor}>{o.texto}</option>)}
        </select>
      </label>)}

    </div>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
      <p className="text-slate-500" aria-live="polite">{cantidad} de {total} gastos</p>
      <button type="button" onClick={limpiar} className="font-semibold text-blue-700 hover:underline">Limpiar filtros</button>
    </div>
  </div>;
}
