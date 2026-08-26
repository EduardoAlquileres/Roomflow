"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { actualizarEstadoHabitacion } from "@/lib/habitaciones";

type Props = {
  habitacionId: string;
};

export default function ConvertirReservaButton({ habitacionId }: Props) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function convertir() {
    if (guardando) return;

    setGuardando(true);
    setError("");

    try {
      await actualizarEstadoHabitacion(habitacionId, "OCUPADA");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo convertir la reserva en Check-In."
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={convertir}
        disabled={guardando}
        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
      >
        {guardando ? "Convirtiendo..." : "Convertir reserva en Check-In"}
      </button>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
