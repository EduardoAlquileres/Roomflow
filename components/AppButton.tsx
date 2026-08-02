"use client";

import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
};

export default function AppButton({
  children,
  onClick,
  type = "button",
  disabled = false,
  variant = "primary",
}: Props) {
  const colors = {
    primary: {
      background: "#2563eb",
      color: "#fff",
    },
    secondary: {
      background: "#f3f4f6",
      color: "#111827",
    },
    danger: {
      background: "#dc2626",
      color: "#fff",
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "10px 18px",
        borderRadius: 10,
        border: "none",
        cursor: disabled ? "default" : "pointer",
        fontWeight: 600,
        fontSize: 14,
        transition: "0.2s",
        opacity: disabled ? 0.6 : 1,
        ...colors[variant],
      }}
    >
      {children}
    </button>
  );
}