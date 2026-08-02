"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type Ocupante = {
  id: string;
  habitacion_id: string;
  nombre: string;
  apellidos: string | null;
  documento: string | null;
  telefono: string | null;
  email: string | null;
  fecha_nacimiento: string | null;
  nacionalidad: string | null;
  profesion: string | null;
  empresa: string | null;
  fecha_entrada: string;
  fecha_salida: string | null;
  activo: boolean;
  observaciones: string | null;
};

type Props = {
  abierto: boolean;
  habitacionId: string;
  ocupante: Ocupante | null;
  onClose: () => void;
  onGuardado: () => void;
};

export default function OcupanteForm({ abierto, habitacionId, ocupante, onClose, onGuardado }: Props) {
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [documento, setDocumento] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [fechaEntrada, setFechaEntrada] = useState("");
  const [nacionalidad, setNacionalidad] = useState("");
  const [profesion, setProfesion] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    if (ocupante) {
      setNombre(ocupante.nombre); setApellidos(ocupante.apellidos ?? ""); setDocumento(ocupante.documento ?? "");
      setTelefono(ocupante.telefono ?? ""); setEmail(ocupante.email ?? ""); setFechaEntrada(ocupante.fecha_entrada ?? "");
      setNacionalidad(ocupante.nacionalidad ?? ""); setProfesion(ocupante.profesion ?? ""); setEmpresa(ocupante.empresa ?? ""); setObservaciones(ocupante.observaciones ?? "");
    } else {
      setNombre(""); setApellidos(""); setDocumento(""); setTelefono(""); setEmail(""); setFechaEntrada(new Date().toISOString().slice(0, 10));
      setNacionalidad(""); setProfesion(""); setEmpresa(""); setObservaciones("");
    }
  }, [abierto, ocupante]);

  if (!abierto) return null;

  async function guardar() {
    if (!nombre.trim() || !fechaEntrada) { alert("Indica el nombre y la fecha de entrada."); return; }
    setGuardando(true);
    const datos = { habitacion_id: habitacionId, nombre: nombre.trim(), apellidos: apellidos.trim() || null, documento: documento.trim() || null, telefono: telefono.trim() || null, email: email.trim() || null, fecha_entrada: fechaEntrada, nacionalidad: nacionalidad.trim() || null, profesion: profesion.trim() || null, empresa: empresa.trim() || null, observaciones: observaciones.trim() || null, activo: true };
    const { error } = ocupante ? await supabase.from("inquilinos").update(datos).eq("id", ocupante.id) : await supabase.from("inquilinos").insert(datos);
    setGuardando(false);
    if (error) { alert(error.message); return; }
    onGuardado();
  }

  return <div style={overlay}><div style={panel}>
    <div style={cabecera}><div><h2 style={{ margin: 0 }}>{ocupante ? "Editar ocupante" : "Añadir ocupante"}</h2><p style={{ margin: "6px 0 0", color: "#64748b" }}>Datos de la persona que ocupa la habitación.</p></div><button onClick={onClose} style={cerrar}>×</button></div>
    <div style={contenido}>
      <Campo etiqueta="Nombre *" valor={nombre} cambiar={setNombre} />
      <Campo etiqueta="Apellidos" valor={apellidos} cambiar={setApellidos} />
      <Campo etiqueta="DNI / NIE / Pasaporte" valor={documento} cambiar={setDocumento} />
      <Campo etiqueta="Teléfono" valor={telefono} cambiar={setTelefono} type="tel" />
      <Campo etiqueta="Email" valor={email} cambiar={setEmail} type="email" />
      <Campo etiqueta="Fecha de entrada *" valor={fechaEntrada} cambiar={setFechaEntrada} type="date" />
      <Campo etiqueta="Nacionalidad" valor={nacionalidad} cambiar={setNacionalidad} />
      <Campo etiqueta="Profesión" valor={profesion} cambiar={setProfesion} />
      <Campo etiqueta="Empresa" valor={empresa} cambiar={setEmpresa} />
      <label style={label}>Observaciones</label><textarea value={observaciones} onChange={(event) => setObservaciones(event.target.value)} rows={4} style={textarea} />
    </div>
    <div style={pie}><button onClick={onClose} style={secundario}>Cancelar</button><button onClick={guardar} disabled={guardando} style={primario}>{guardando ? "Guardando..." : ocupante ? "Actualizar" : "Guardar"}</button></div>
  </div></div>;
}

function Campo({ etiqueta, valor, cambiar, type = "text" }: { etiqueta: string; valor: string; cambiar: (valor: string) => void; type?: string }) {
  return <><label style={label}>{etiqueta}</label><input type={type} value={valor} onChange={(event) => cambiar(event.target.value)} style={input} /></>;
}

const overlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", display: "flex", justifyContent: "flex-end", zIndex: 50 };
const panel: React.CSSProperties = { width: 460, maxWidth: "100%", height: "100%", background: "#fff", display: "flex", flexDirection: "column", boxShadow: "-8px 0 30px rgba(0,0,0,.18)" };
const cabecera: React.CSSProperties = { padding: 24, display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0" };
const cerrar: React.CSSProperties = { border: "none", background: "#f1f5f9", borderRadius: 8, width: 34, height: 34, cursor: "pointer", fontSize: 24, lineHeight: 1 };
const contenido: React.CSSProperties = { flex: 1, overflowY: "auto", padding: 24 };
const pie: React.CSSProperties = { padding: 24, display: "flex", justifyContent: "flex-end", gap: 10, borderTop: "1px solid #e2e8f0" };
const label: React.CSSProperties = { display: "block", fontSize: 14, fontWeight: 600, marginBottom: 7, marginTop: 16, color: "#334155" };
const input: React.CSSProperties = { boxSizing: "border-box", width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 15 };
const textarea: React.CSSProperties = { ...input, resize: "vertical", fontFamily: "inherit" };
const secundario: React.CSSProperties = { padding: "10px 16px", border: "1px solid #cbd5e1", borderRadius: 8, background: "#fff", cursor: "pointer", fontWeight: 600 };
const primario: React.CSSProperties = { padding: "10px 16px", border: "none", borderRadius: 8, background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 600 };
