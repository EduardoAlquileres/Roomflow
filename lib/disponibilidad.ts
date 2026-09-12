type Disponibilidad = { estado: string; disponible_desde: string | null; codigo: string };

export function habitacionesDisponibles<T extends Disponibilidad>(habitaciones: T[]) {
  return habitaciones.filter(h => h.estado === "LIBRE" || (h.estado === "OCUPADA" && h.disponible_desde))
    .sort((a, b) => {
      if (a.estado === "LIBRE" && b.estado !== "LIBRE") return -1;
      if (b.estado === "LIBRE" && a.estado !== "LIBRE") return 1;
      return (a.disponible_desde ?? "").localeCompare(b.disponible_desde ?? "") || a.codigo.localeCompare(b.codigo, "es", { numeric: true });
    });
}

export function textoDisponibilidad(habitacion: Disponibilidad, hoy: string) {
  if (habitacion.estado === "LIBRE") return "Libre ahora";
  const fecha = habitacion.disponible_desde!.slice(0, 10);
  const texto = new Date(`${fecha}T12:00:00`).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  if (fecha < hoy) return `Salida prevista para el ${texto} · pendiente de confirmar`;
  if (fecha === hoy) return "Salida prevista hoy · pendiente de confirmar";
  return `Disponible desde el ${texto} (previsto)`;
}
