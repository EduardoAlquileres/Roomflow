"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { eliminarFianzaErronea } from "@/lib/fianzas";

export default function EliminarFianzaErroneaButton({ fianzaId, nombre }: { fianzaId: string; nombre: string }) {
  const router = useRouter();
  const [eliminando, setEliminando] = useState(false);

  async function eliminar() {
    if (!confirm(`¿Eliminar la fianza finalizada de ${nombre}? Úsalo solo si se creó por error. También se eliminarán sus cuotas.`)) return;
    setEliminando(true);
    try {
      await eliminarFianzaErronea(fianzaId);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo eliminar la fianza.");
    } finally {
      setEliminando(false);
    }
  }

  return <button type="button" disabled={eliminando} onClick={eliminar} title="Eliminar fianza creada por error" className="mt-2 inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"><Trash2 size={14} /> {eliminando ? "Eliminando..." : "Eliminar error"}</button>;
}
