"use client";

import { NuevoAlquiler } from "@/types/nuevoAlquiler";

interface Props {
  datos: NuevoAlquiler;
  setDatos: React.Dispatch<React.SetStateAction<NuevoAlquiler>>;
}

export default function PasoInquilinos({
  datos,
  setDatos,
}: Props) {

  function actualizarInquilino1(
    campo: keyof typeof datos.inquilino1,
    valor: string
  ) {
    setDatos((prev) => ({
      ...prev,
      inquilino1: {
        ...prev.inquilino1,
        [campo]: valor,
      },
    }));
  }

  function actualizarInquilino2(
    campo: keyof NonNullable<typeof datos.inquilino2>,
    valor: string
  ) {
    if (!datos.inquilino2) return;

    setDatos((prev) => ({
      ...prev,
      inquilino2: {
        ...prev.inquilino2!,
        [campo]: valor,
      },
    }));
  }

  function activarPareja() {
    setDatos((prev) => ({
      ...prev,
      esPareja: true,
      inquilino2: {
        nombre: "",
        apellidos: "",
        tipoDocumento: "DNI",
        dni: "",
        telefono: "",
        email: "",
      },
    }));
  }

  function quitarPareja() {
    setDatos((prev) => ({
      ...prev,
      esPareja: false,
      inquilino2: null,
    }));
  }

  function Input(
    titulo: string,
    valor: string,
    onChange: (valor: string) => void
  ) {
    return (
      <div>
        <label className="block text-sm font-medium mb-1">
          {titulo}
        </label>

        <input
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border rounded-lg p-2"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">

      <div>
        <h2 className="text-2xl font-bold">
          Datos del inquilino
        </h2>

        <p className="text-gray-500">
          Introduce los datos de la persona que ocupará la habitación.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">

        {Input(
          "Nombre",
          datos.inquilino1.nombre,
          (v) => actualizarInquilino1("nombre", v)
        )}

        {Input(
          "Apellidos",
          datos.inquilino1.apellidos,
          (v) => actualizarInquilino1("apellidos", v)
        )}

        <div><label className="block text-sm font-medium mb-1">Tipo de documento</label><select value={datos.inquilino1.tipoDocumento} onChange={(event) => actualizarInquilino1("tipoDocumento", event.target.value)} className="w-full border rounded-lg p-2"><option value="DNI">DNI</option><option value="NIE">NIE</option><option value="PASAPORTE">Pasaporte</option></select></div>

        {Input(datos.inquilino1.tipoDocumento, datos.inquilino1.dni, (v) => actualizarInquilino1("dni", v))}

        {Input(
          "Teléfono",
          datos.inquilino1.telefono,
          (v) => actualizarInquilino1("telefono", v)
        )}

        {Input(
          "Email",
          datos.inquilino1.email,
          (v) => actualizarInquilino1("email", v)
        )}

      </div>

      {!datos.esPareja && (
        <button
          type="button"
          onClick={activarPareja}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white"
        >
          Añadir segundo inquilino
        </button>
      )}

      {datos.esPareja && datos.inquilino2 && (

        <div className="border rounded-xl p-6 space-y-4">

          <div className="flex justify-between items-center">

            <h3 className="font-semibold text-lg">
              Segundo inquilino
            </h3>

            <button
              type="button"
              onClick={quitarPareja}
              className="text-red-600"
            >
              Eliminar
            </button>

          </div>

          <div className="grid md:grid-cols-2 gap-4">

            {Input(
              "Nombre",
              datos.inquilino2.nombre,
              (v) => actualizarInquilino2("nombre", v)
            )}

            {Input(
              "Apellidos",
              datos.inquilino2.apellidos,
              (v) => actualizarInquilino2("apellidos", v)
            )}

            <div><label className="block text-sm font-medium mb-1">Tipo de documento</label><select value={datos.inquilino2.tipoDocumento} onChange={(event) => actualizarInquilino2("tipoDocumento", event.target.value)} className="w-full border rounded-lg p-2"><option value="DNI">DNI</option><option value="NIE">NIE</option><option value="PASAPORTE">Pasaporte</option></select></div>

            {Input(datos.inquilino2.tipoDocumento, datos.inquilino2.dni, (v) => actualizarInquilino2("dni", v))}

            {Input(
              "Teléfono",
              datos.inquilino2.telefono,
              (v) => actualizarInquilino2("telefono", v)
            )}

            {Input(
              "Email",
              datos.inquilino2.email,
              (v) => actualizarInquilino2("email", v)
            )}

          </div>

        </div>

      )}

    </div>
  );
}
