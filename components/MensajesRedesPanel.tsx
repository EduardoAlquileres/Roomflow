"use client";

import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, Clipboard, Edit3, ExternalLink, MessageCircle, Plus, Send, Trash2 } from "lucide-react";
import { CanalMensajeRed, EstadoMensajeRed, Habitacion, MensajeRed, Vivienda } from "@/types";
import { actualizarMensajeRed, crearMensajeRed, eliminarMensajeRed } from "@/lib/mensajesRedes";

type Props = { iniciales: MensajeRed[]; viviendas: Vivienda[]; habitaciones: Habitacion[] };
type Formulario = {
  id: string | null;
  canal: CanalMensajeRed;
  tipo: MensajeRed["tipo"];
  estado: EstadoMensajeRed;
  asunto: string;
  contenido: string;
  viviendaId: string;
  habitacionId: string;
  fechaProgramada: string;
  enlace: string;
};

const canales: Record<CanalMensajeRed, string> = { FACEBOOK: "Facebook", INSTAGRAM: "Instagram", WHATSAPP: "WhatsApp", TIKTOK: "TikTok", OTRO: "Otra red" };
const estados: Record<EstadoMensajeRed, string> = { BORRADOR: "Borrador", LISTO: "Listo para publicar", PUBLICADO: "Publicado", ARCHIVADO: "Archivado" };
const fecha = (valor: string | null) => valor ? new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(valor)) : "Sin programar";
const vacio = (): Formulario => ({ id: null, canal: "FACEBOOK", tipo: "ANUNCIO", estado: "BORRADOR", asunto: "", contenido: "", viviendaId: "", habitacionId: "", fechaProgramada: "", enlace: "" });

export default function MensajesRedesPanel({ iniciales, viviendas, habitaciones }: Props) {
  const [mensajes, setMensajes] = useState(iniciales);
  const [formulario, setFormulario] = useState<Formulario | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const habitacionesDisponibles = useMemo(
    () => formulario?.viviendaId ? habitaciones.filter((habitacion) => habitacion.vivienda_id === formulario.viviendaId) : habitaciones,
    [habitaciones, formulario?.viviendaId]
  );
  const resumen = {
    borradores: mensajes.filter((mensaje) => mensaje.estado === "BORRADOR").length,
    listos: mensajes.filter((mensaje) => mensaje.estado === "LISTO").length,
    publicados: mensajes.filter((mensaje) => mensaje.estado === "PUBLICADO").length,
  };

  function editar(mensaje: MensajeRed) {
    setError("");
    setFormulario({
      id: mensaje.id,
      canal: mensaje.canal,
      tipo: mensaje.tipo,
      estado: mensaje.estado,
      asunto: mensaje.asunto,
      contenido: mensaje.contenido,
      viviendaId: mensaje.vivienda_id ?? "",
      habitacionId: mensaje.habitacion_id ?? "",
      fechaProgramada: mensaje.fecha_programada?.slice(0, 16) ?? "",
      enlace: mensaje.enlace_publicacion ?? "",
    });
  }

  function cambiarVivienda(viviendaId: string) {
    setFormulario((actual) => actual ? { ...actual, viviendaId, habitacionId: "" } : actual);
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    if (!formulario || !formulario.asunto.trim() || !formulario.contenido.trim()) {
      setError("Escribe un t\u00edtulo y el mensaje.");
      return;
    }

    setGuardando(true);
    setError("");
    const valores = {
      canal: formulario.canal,
      tipo: formulario.tipo,
      estado: formulario.estado,
      asunto: formulario.asunto.trim(),
      contenido: formulario.contenido.trim(),
      vivienda_id: formulario.viviendaId || null,
      habitacion_id: formulario.habitacionId || null,
      fecha_programada: formulario.fechaProgramada ? new Date(formulario.fechaProgramada).toISOString() : null,
      publicado_en: formulario.estado === "PUBLICADO" ? new Date().toISOString() : null,
      enlace_publicacion: formulario.enlace.trim() || null,
    };

    try {
      const mensaje = formulario.id ? await actualizarMensajeRed(formulario.id, valores) : await crearMensajeRed(valores);
      setMensajes((actuales) => formulario.id ? actuales.map((actual) => actual.id === mensaje.id ? mensaje : actual) : [mensaje, ...actuales]);
      setFormulario(null);
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : "No se pudo guardar el mensaje.");
    } finally {
      setGuardando(false);
    }
  }

  async function copiar(mensaje: MensajeRed, aviso = true) {
    try {
      await navigator.clipboard.writeText(`${mensaje.asunto}\n\n${mensaje.contenido}`);
      if (aviso) alert("T\u00edtulo y mensaje copiados. Ya puedes pegarlos en la red social.");
    } catch {
      if (aviso) alert("No se pudo copiar autom\u00e1ticamente. Selecciona el texto del mensaje y c\u00f3pialo.");
    }
  }

  function abrirMarketplace(mensaje: MensajeRed) {
    const ventana = window.open("https://www.facebook.com/marketplace/create/item", "_blank", "noopener,noreferrer");
    void copiar(mensaje, false);
    if (!ventana) {
      alert("No se pudo abrir Marketplace. Permite las ventanas emergentes e int\u00e9ntalo otra vez.");
      return;
    }
    alert("Marketplace se ha abierto y el t\u00edtulo con el mensaje se han copiado. P\u00e9galos al crear el anuncio.");
  }

  async function publicar(mensaje: MensajeRed) {
    try {
      const actualizado = await actualizarMensajeRed(mensaje.id, { estado: "PUBLICADO", publicado_en: new Date().toISOString() });
      setMensajes((actuales) => actuales.map((actual) => actual.id === actualizado.id ? actualizado : actual));
    } catch (causa) {
      alert(causa instanceof Error ? causa.message : "No se pudo marcar como publicado.");
    }
  }

  async function eliminar(mensaje: MensajeRed) {
    if (!confirm(`\u00bfBorrar el mensaje \"${mensaje.asunto}\"?`)) return;
    try {
      await eliminarMensajeRed(mensaje.id);
      setMensajes((actuales) => actuales.filter((actual) => actual.id !== mensaje.id));
    } catch (causa) {
      alert(causa instanceof Error ? causa.message : "No se pudo borrar el mensaje.");
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mensajes de redes</h1>
          <p className="mt-2 text-slate-500">Prepara, programa y registra publicaciones de tus viviendas. La publicaci\u00f3n se realiza despu\u00e9s desde cada red social.</p>
        </div>
        <button onClick={() => { setError(""); setFormulario(vacio()); }} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700"><Plus size={18} /> Nuevo mensaje</button>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <Resumen texto="Borradores" valor={resumen.borradores} color="bg-slate-100 text-slate-700" />
        <Resumen texto="Listos para publicar" valor={resumen.listos} color="bg-amber-50 text-amber-700" />
        <Resumen texto="Publicados" valor={resumen.publicados} color="bg-green-50 text-green-700" />
      </div>

      <section className="mt-7 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-200 p-5"><h2 className="font-bold text-slate-900">Publicaciones y respuestas</h2><p className="mt-1 text-sm text-slate-500">Copia el texto cuando vayas a usarlo y marca la publicaci\u00f3n al terminar.</p></div>
        {mensajes.length ? <div className="divide-y divide-slate-100">{mensajes.map((mensaje) => {
          const vivienda = viviendas.find((item) => item.id === mensaje.vivienda_id);
          const habitacion = habitaciones.find((item) => item.id === mensaje.habitacion_id);
          const claseEstado = mensaje.estado === "PUBLICADO" ? "bg-green-50 text-green-700" : mensaje.estado === "LISTO" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600";

          return <article key={mensaje.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{canales[mensaje.canal]}</span><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${claseEstado}`}>{estados[mensaje.estado]}</span></div><h3 className="mt-3 text-lg font-bold text-slate-900">{mensaje.asunto}</h3><p className="mt-1 text-sm text-slate-500">{vivienda?.nombre ?? "Sin vivienda"}{habitacion ? ` · ${habitacion.codigo}` : ""} · {fecha(mensaje.fecha_programada)}</p></div>
              <div className="flex flex-wrap gap-2"><button onClick={() => copiar(mensaje)} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"><Clipboard size={16} /> Copiar</button>{mensaje.canal === "FACEBOOK" && <button onClick={() => abrirMarketplace(mensaje)} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"><ExternalLink size={16} /> Marketplace</button>}{mensaje.estado !== "PUBLICADO" && <button onClick={() => publicar(mensaje)} className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"><CheckCircle2 size={16} /> Marcar publicado</button>}<button onClick={() => editar(mensaje)} title="Editar" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"><Edit3 size={18} /></button><button onClick={() => eliminar(mensaje)} title="Borrar" className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 size={18} /></button></div>
            </div>
            <p className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{mensaje.contenido}</p>
            {mensaje.enlace_publicacion && <a href={mensaje.enlace_publicacion} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:underline"><ExternalLink size={15} /> Abrir publicaci\u00f3n</a>}
          </article>;
        })}</div> : <div className="p-12 text-center"><MessageCircle className="mx-auto text-blue-500" size={32} /><p className="mt-3 font-semibold text-slate-800">A\u00fan no hay mensajes</p><p className="mt-1 text-sm text-slate-500">Crea el primer anuncio o una respuesta preparada.</p></div>}
      </section>

      {formulario && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"><form onSubmit={guardar} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold text-slate-900">{formulario.id ? "Editar mensaje" : "Nuevo mensaje"}</h2><p className="mt-1 text-sm text-slate-500">Puedes dejarlo como borrador hasta que est\u00e9 listo.</p></div><button type="button" onClick={() => setFormulario(null)} className="text-sm font-semibold text-slate-600">Cancelar</button></div><div className="mt-6 grid gap-4 sm:grid-cols-3"><Campo etiqueta={"T\u00edtulo"} ancho><input value={formulario.asunto} onChange={(event) => setFormulario({ ...formulario, asunto: event.target.value })} placeholder={"Ej.: Habitaci\u00f3n disponible en Inca"} /></Campo><Campo etiqueta="Red social"><select value={formulario.canal} onChange={(event) => setFormulario({ ...formulario, canal: event.target.value as CanalMensajeRed })}>{Object.entries(canales).map(([clave, texto]) => <option value={clave} key={clave}>{texto}</option>)}</select></Campo><Campo etiqueta="Tipo"><select value={formulario.tipo} onChange={(event) => setFormulario({ ...formulario, tipo: event.target.value as MensajeRed["tipo"] })}><option value="ANUNCIO">Anuncio</option><option value="RESPUESTA">Respuesta</option><option value="SEGUIMIENTO">Seguimiento</option></select></Campo><Campo etiqueta="Estado"><select value={formulario.estado} onChange={(event) => setFormulario({ ...formulario, estado: event.target.value as EstadoMensajeRed })}>{Object.entries(estados).map(([clave, texto]) => <option value={clave} key={clave}>{texto}</option>)}</select></Campo><Campo etiqueta="Vivienda"><select value={formulario.viviendaId} onChange={(event) => cambiarVivienda(event.target.value)}><option value="">Sin asociar</option>{viviendas.map((vivienda) => <option key={vivienda.id} value={vivienda.id}>{vivienda.nombre}</option>)}</select></Campo><Campo etiqueta={"Habitaci\u00f3n"}><select value={formulario.habitacionId} onChange={(event) => setFormulario({ ...formulario, habitacionId: event.target.value })}><option value="">Sin asociar</option>{habitacionesDisponibles.map((habitacion) => <option key={habitacion.id} value={habitacion.id}>{habitacion.codigo}</option>)}</select></Campo><Campo etiqueta="Fecha prevista"><input type="datetime-local" value={formulario.fechaProgramada} onChange={(event) => setFormulario({ ...formulario, fechaProgramada: event.target.value })} /></Campo><Campo etiqueta="Enlace publicado" ancho><input type="url" value={formulario.enlace} onChange={(event) => setFormulario({ ...formulario, enlace: event.target.value })} placeholder="https://..." /></Campo><Campo etiqueta="Mensaje" ancho><textarea rows={9} value={formulario.contenido} onChange={(event) => setFormulario({ ...formulario, contenido: event.target.value })} placeholder="Escribe el texto que quieres publicar..." /></Campo></div>{error && <p className="mt-4 text-sm text-red-600">{error}</p>}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setFormulario(null)} className="rounded-lg border px-4 py-2 font-semibold text-slate-700">Cancelar</button><button disabled={guardando} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-60"><Send size={17} /> {guardando ? "Guardando..." : "Guardar mensaje"}</button></div></form></div>}
    </div>
  );
}

function Resumen({ texto, valor, color }: { texto: string; valor: number; color: string }) {
  return <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">{texto}</p><span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xl font-bold ${color}`}>{valor}</span></div>;
}

function Campo({ etiqueta, ancho, children }: { etiqueta: string; ancho?: boolean; children: React.ReactNode }) {
  return <label className={`block text-sm font-medium text-slate-700 ${ancho ? "sm:col-span-3" : ""}`}>{etiqueta}<div className="mt-1.5 [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-slate-300 [&_input]:px-3 [&_input]:py-2 [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-slate-300 [&_select]:bg-white [&_select]:px-3 [&_select]:py-2 [&_textarea]:w-full [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-slate-300 [&_textarea]:px-3 [&_textarea]:py-2">{children}</div></label>;
}
