import MensajesRedesPanel from "@/components/MensajesRedesPanel";
import { obtenerHabitaciones } from "@/lib/habitaciones";
import { obtenerMensajesRedes } from "@/lib/mensajesRedes";
import { obtenerViviendas } from "@/lib/viviendas";

export const dynamic = "force-dynamic";

export default async function Mensajes() {
  const [mensajes, viviendas, habitaciones] = await Promise.all([
    obtenerMensajesRedes(),
    obtenerViviendas(),
    obtenerHabitaciones(),
  ]);
  return <MensajesRedesPanel iniciales={mensajes} viviendas={viviendas} habitaciones={habitaciones} />;
}
