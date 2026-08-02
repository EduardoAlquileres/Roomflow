"use client";

import { useState } from "react";
import { realizarCheckIn } from "@/lib/checkin";
import { useRouter } from "next/navigation";

interface Props {
  habitacionId: string;

  onSuccess?: () => void;

  onCancel?: () => void;
}

export default function CheckInForm({
  habitacionId,
  onSuccess,
  onCancel,
}: Props) {
  const [loading, setLoading] = useState(false);

  const [nombre, setNombre] = useState("");

  const [apellidos, setApellidos] = useState("");

  const [documento, setDocumento] = useState("");

  const [telefono, setTelefono] = useState("");

  const [email, setEmail] = useState("");

  const [nacionalidad, setNacionalidad] = useState("");

  const [profesion, setProfesion] = useState("");

  const [empresa, setEmpresa] = useState("");

  const [fechaEntrada, setFechaEntrada] = useState(
    new Date().toISOString().substring(0, 10)
  );

  const router = useRouter();

  const [fianza, setFianza] = useState(0);

  const [observaciones, setObservaciones] = useState("");

  async function guardar() {
    try {
      setLoading(true);

      await realizarCheckIn({
        habitacionId,

        fechaEntrada,

        fianza,

        observaciones,

        inquilino: {
          nombre,

          apellidos,

          documento,

          telefono,

          email,

          fecha_nacimiento: null,

          nacionalidad,

          profesion,

          empresa,

        },
      });

      alert("Check-In realizado correctamente");

      router.refresh();

      onSuccess?.();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 rounded-xl border bg-white p-6">
      <h2 className="text-xl font-semibold">
        Nuevo Check-In
      </h2>      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

        <div>
          <label className="mb-1 block text-sm font-medium">
            Nombre
          </label>

          <input
            className="w-full rounded-lg border p-2"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Apellidos
          </label>

          <input
            className="w-full rounded-lg border p-2"
            value={apellidos}
            onChange={(e) => setApellidos(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Documento
          </label>

          <input
            className="w-full rounded-lg border p-2"
            value={documento}
            onChange={(e) => setDocumento(e.target.value.toUpperCase())}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Teléfono
          </label>

          <input
            className="w-full rounded-lg border p-2"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Email
          </label>

          <input
            type="email"
            className="w-full rounded-lg border p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Nacionalidad
          </label>

          <input
            className="w-full rounded-lg border p-2"
            value={nacionalidad}
            onChange={(e) => setNacionalidad(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Profesión
          </label>

          <input
            className="w-full rounded-lg border p-2"
            value={profesion}
            onChange={(e) => setProfesion(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Empresa
          </label>

          <input
            className="w-full rounded-lg border p-2"
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Fecha de entrada
          </label>

          <input
            type="date"
            className="w-full rounded-lg border p-2"
            value={fechaEntrada}
            onChange={(e) => setFechaEntrada(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Fianza (€)
          </label>

          <input
            type="number"
            className="w-full rounded-lg border p-2"
            value={fianza}
            onChange={(e) => setFianza(Number(e.target.value))}
          />
        </div>

      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Observaciones
        </label>

        <textarea
          rows={4}
          className="w-full rounded-lg border p-2"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-3">

        <button
          type="button"
          className="rounded-lg border px-4 py-2"
          onClick={onCancel}
        >
          Cancelar
        </button>

        <button
          type="button"
          disabled={
            loading ||
            !nombre ||
            !apellidos ||
            !documento
          }
          onClick={guardar}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Realizar Check-In"}
        </button>

      </div>

    </div>
  );
}