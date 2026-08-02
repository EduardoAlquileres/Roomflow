"use client";

import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "lucide-react";

function FormularioAcceso() {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function entrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEnviando(true);
    setError("");

    try {
      const respuesta = await fetch("/api/acceso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const resultado = await respuesta.json();
      if (!respuesta.ok) throw new Error(resultado.error || "No se pudo iniciar sesión.");

      const volver = searchParams.get("volver");
      window.location.assign(volver?.startsWith("/") ? volver : "/dashboard");
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : "No se pudo iniciar sesión.");
      setEnviando(false);
    }
  }

  return (
    <main className="rf-access-page">
      <section className="rf-access-card">
        <div className="rf-access-icon"><ShieldCheck size={30} /></div>
        <p className="rf-access-kicker">ROOMFLOW</p>
        <h1>Acceso privado</h1>
        <p className="rf-access-copy">Introduce la contraseña de administración para acceder a la gestión de viviendas.</p>

        <form onSubmit={entrar} className="rf-access-form">
          <label htmlFor="password">Contraseña</label>
          <div className="rf-access-input"><LockKeyhole size={18} /><input id="password" type="password" autoComplete="current-password" value={password} onChange={(evento) => setPassword(evento.target.value)} required autoFocus /></div>
          {error && <p className="rf-access-error" role="alert">{error}</p>}
          <button type="submit" disabled={enviando}>{enviando ? "Comprobando…" : "Entrar en RoomFlow"}</button>
        </form>

        <p className="rf-access-foot">Acceso reservado a las personas autorizadas.</p>
      </section>
    </main>
  );
}

export default function AccesoPage() {
  return <Suspense fallback={<main className="rf-access-page"><section className="rf-access-card"><p className="rf-access-kicker">ROOMFLOW</p><h1>Preparando acceso…</h1></section></main>}><FormularioAcceso /></Suspense>;
}
