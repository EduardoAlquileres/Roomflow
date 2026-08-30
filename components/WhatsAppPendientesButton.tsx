"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Props = {
  inquilinoId: string;
  nombre: string;
  telefono: string | null;
};

type CobroPendiente = {
  periodo_anio: number;
  periodo_mes: number;
  pendiente: number;
};

type FianzaPendiente = {
  importe: number;
  importe_entregado: number;
};

const moneda = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function telefonoWhatsApp(telefono: string) {
  let numero = telefono.replace(/\D/g, "");
  if (numero.startsWith("00")) numero = numero.slice(2);
  if (numero.length === 9) numero = `34${numero}`;
  return numero;
}

export default function WhatsAppPendientesButton({ inquilinoId, nombre, telefono }: Props) {
  const [preparando, setPreparando] = useState(false);

  async function abrirWhatsApp() {
    if (preparando) return;
    if (!telefono?.trim()) {
      alert(`No hay un teléfono registrado para ${nombre}.`);
      return;
    }

    const numero = telefonoWhatsApp(telefono);
    if (numero.length < 10) {
      alert(`El teléfono registrado para ${nombre} no parece válido.`);
      return;
    }

    setPreparando(true);
    try {
      const [respuestaCobros, respuestaFianzas] = await Promise.all([
        supabase
          .from("cobros")
          .select("periodo_anio, periodo_mes, pendiente")
          .eq("inquilino_id", inquilinoId)
          .in("estado", ["PENDIENTE", "PARCIAL", "DEUDA"])
          .gt("pendiente", 0)
          .order("periodo_anio")
          .order("periodo_mes"),
        supabase
          .from("fianzas")
          .select("importe, importe_entregado")
          .eq("inquilino_id", inquilinoId)
          .in("estado", ["COBRADA", "PENDIENTE_REVISION"]),
      ]);

      const error = respuestaCobros.error ?? respuestaFianzas.error;
      if (error) throw error;

      const cobros = (respuestaCobros.data ?? []) as CobroPendiente[];
      const fianzas = (respuestaFianzas.data ?? []) as FianzaPendiente[];
      const pendienteCobros = cobros.reduce((total, cobro) => total + Number(cobro.pendiente), 0);
      const pendienteFianza = fianzas.reduce(
        (total, fianza) => total + Math.max(Number(fianza.importe) - Number(fianza.importe_entregado), 0),
        0
      );
      const totalPendiente = pendienteCobros + pendienteFianza;

      if (totalPendiente <= 0.005) {
        alert(`${nombre} no tiene importes pendientes.`);
        return;
      }

      const lineasCobros = cobros.map(
        (cobro) => `• Recibo de ${meses[cobro.periodo_mes - 1]} de ${cobro.periodo_anio}: ${moneda.format(Number(cobro.pendiente))}`
      );
      const lineas = [
        `Hola ${nombre},`,
        "",
        "Te informamos de los importes que figuran pendientes en RoomFlow:",
        "",
        ...lineasCobros,
        ...(pendienteFianza > 0.005 ? [`• Fianza pendiente: ${moneda.format(pendienteFianza)}`] : []),
        "",
        `Total pendiente: ${moneda.format(totalPendiente)}`,
        "",
        "Si ya has realizado algún pago, por favor envíanos el justificante para actualizarlo. Gracias.",
      ];

      window.location.assign(`https://wa.me/${numero}?text=${encodeURIComponent(lineas.join("\n"))}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo preparar el mensaje de WhatsApp.");
    } finally {
      setPreparando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={abrirWhatsApp}
      disabled={preparando}
      title="Enviar pendientes por WhatsApp"
      aria-label="Preparar mensaje de WhatsApp con importes pendientes"
      style={{
        width: 34,
        height: 34,
        border: "none",
        borderRadius: 6,
        background: "#ecfdf5",
        color: "#16a34a",
        cursor: preparando ? "wait" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: preparando ? 0.6 : 1,
      }}
    >
      <MessageCircle size={18} />
    </button>
  );
}
