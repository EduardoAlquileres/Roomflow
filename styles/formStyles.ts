import React from "react";

export const label: React.CSSProperties = {
  display: "block",
  marginBottom: 8,
  fontSize: 14,
  fontWeight: 600,
  color: "#334155",
};

export const input: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

export const textarea: React.CSSProperties = {
  ...input,
  resize: "vertical",
  minHeight: 90,
};

export const select: React.CSSProperties = {
  ...input,
};

export const checkboxContainer: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

export const row: React.CSSProperties = {
  display: "flex",
  gap: 16,
};

export const column: React.CSSProperties = {
  flex: 1,
};