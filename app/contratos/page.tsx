import ClausulasContratoPanel from "@/components/ClausulasContratoPanel";
import { obtenerClausulasContrato } from "@/lib/clausulasContrato";

export const dynamic = "force-dynamic";

export default async function ContratosPage() {
  return <ClausulasContratoPanel iniciales={await obtenerClausulasContrato()} />;
}
