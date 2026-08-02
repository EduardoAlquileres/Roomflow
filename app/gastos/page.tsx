import GastosPanel from "@/components/GastosPanel";
import { obtenerGastos } from "@/lib/gastos";
import { obtenerViviendas } from "@/lib/viviendas";

export const dynamic = "force-dynamic";

export default async function GastosPage() {
  const [gastos, viviendas] = await Promise.all([obtenerGastos(), obtenerViviendas()]);
  return <GastosPanel gastosIniciales={gastos} viviendas={viviendas} />;
}
