"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Props = {
  inquilinoId: string;
  habitacionId: string;
  nombre: string;
  telefono: string | null;
};

type Destinatario = {
  id: string;
  nombre: string;
  apellidos: string;
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

export default function WhatsAppPendientesButton({ inquilinoId, habitacionId, nombre, telefono }: Props) {
  const [preparando, setPreparando] = useState(false);
  const [destinatarios, setDestinatarios] = useState<Destinatario[]>([]);
  const [detalleMensaje, setDetalleMensaje] = useState<string[]>([]);

  async function prepararMensajes() {
    if (preparando) return;

    setPreparando(true);
    try {
      const [respuestaCobros, respuestaFianzas, respuestaInquilinos] = await Promise.all([
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
        supabase
          .from("inquilinos")
          .select("id, nombre, apellidos, telefono")
          .eq("habitacion_id", habitacionId)
          .eq("activo", true)
          .order("created_at"),
      ]);

      const error = respuestaCobros.error ?? respuestaFianzas.error ?? respuestaInquilinos.error;
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
      const detalle = [
        "Mensaje automático generado por la aplicación.",
        "",
        "Te informamos de los importes que figuran pendientes en la aplicación:",
        "",
        ...lineasCobros,
        ...(pendienteFianza > 0.005 ? [`• Fianza pendiente: ${moneda.format(pendienteFianza)}`] : []),
        "",
        `Total pendiente: ${moneda.format(totalPendiente)}`,
        "",
        "Recuerda que los pagos deben efectuarse entre los días 1 y 5 de cada mes.",
        "",
        "Si ya has realizado algún pago, por favor envíanos el justificante para actualizarlo. Gracias.",
      ];
      const titulares = (respuestaInquilinos.data ?? []) as Destinatario[];
      setDestinatarios(titulares.length ? titulares : [{ id: inquilinoId, nombre, apellidos: "", telefono }]);
      setDetalleMensaje(detalle);
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo preparar el mensaje de WhatsApp.");
    } finally {
      setPreparando(false);
    }
  }

  function abrirDestinatario(destinatario: Destinatario) {
    if (!destinatario.telefono?.trim()) {
      alert(`No hay un teléfono registrado para ${destinatario.nombre} ${destinatario.apellidos}.`);
      return;
    }
    const numero = telefonoWhatsApp(destinatario.telefono);
    if (numero.length < 10) {
      alert(`El teléfono registrado para ${destinatario.nombre} ${destinatario.apellidos} no parece válido.`);
      return;
    }
    const mensaje = [`Hola ${destinatario.nombre},`, "", ...detalleMensaje].join("\n");
    const ventana = window.open(
      `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`,
      "_blank",
      "noopener,noreferrer"
    );
    if (!ventana) {
      alert("El navegador ha bloqueado la nueva pestaña de WhatsApp. Permite abrir enlaces en otra pestaña e inténtalo de nuevo.");
    }
  }

  return (
    <>
    <button
      type="button"
      onClick={prepararMensajes}
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
    {destinatarios.length > 0 && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Enviar aviso por WhatsApp</h2>
              <p className="mt-1 text-sm text-slate-500">Abre el mensaje de cada titular y confirma el envío en WhatsApp.</p>
            </div>
            <button type="button" onClick={() => setDestinatarios([])} className="text-sm font-semibold text-slate-600">Cerrar</button>
          </div>
          <div className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-200">
            {destinatarios.map((destinatario) => (
              <div key={destinatario.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{destinatario.nombre} {destinatario.apellidos}</p>
                  <p className="mt-1 text-sm text-slate-500">{destinatario.telefono || "Sin teléfono registrado"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => abrirDestinatario(destinatario)}
                  className="shrink-0 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  Abrir WhatsApp
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
