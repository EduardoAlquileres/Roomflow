"use client";

import { useState } from "react";
import HabitacionForm from "./HabitacionForm";

type Vivienda = {
  id: string;
  nombre: string;
};

interface Props {
  viviendas: Vivienda[];
}

export default function HabitacionesToolbar({
  viviendas,
}: Props) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Nueva habitación
      </button>

      <HabitacionForm
        abierto={abierto}
        habitacion={null}
        viviendas={viviendas}
        onClose={() => setAbierto(false)}
        onGuardado={() => {
          setAbierto(false);
          window.location.reload();
        }}
      />
    </>
  );
}