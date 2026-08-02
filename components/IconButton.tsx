"use client";

import { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  title: string;
  color: string;
  onClick: () => void;
};

export default function IconButton({
  icon,
  title,
  color,
  onClick,
}: Props) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 38,
        height: 38,
        border: "none",
        borderRadius: 10,
        background: color,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "0.2s",
      }}
    >
      {icon}
    </button>
  );
}