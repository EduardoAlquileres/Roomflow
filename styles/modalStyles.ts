import React from "react";

export const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,.45)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};

export const modal: React.CSSProperties = {
  width: 700,
  maxWidth: "95%",
  background: "#fff",
  borderRadius: 12,
  overflow: "hidden",
  boxShadow: "0 15px 40px rgba(0,0,0,.25)",
};

export const header: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: 20,
  borderBottom: "1px solid #e5e7eb",
};

export const body: React.CSSProperties = {
  padding: 24,
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

export const footer: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
  marginTop: 12,
};

export const titulo: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: "#0f172a",
};

export const subtitulo: React.CSSProperties = {
  marginTop: 4,
  fontSize: 14,
  color: "#64748b",
};

export const botonCerrar: React.CSSProperties = {
  width: 36,
  height: 36,
  border: "none",
  borderRadius: 8,
  background: "#f8fafc",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

export const botonCancelar: React.CSSProperties = {
  padding: "10px 18px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  background: "#fff",
  color: "#334155",
  cursor: "pointer",
  fontWeight: 600,
};

export const botonGuardar: React.CSSProperties = {
  padding: "10px 18px",
  borderRadius: 8,
  border: "none",
  background: "#2563eb",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 600,
};