"use client";

import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";

type Props = { children: ReactNode };

export default function AppLayout({ children }: Props) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const pathname = usePathname();

  if (pathname === "/acceso") return <>{children}</>;

  return (
    <div className="rf-shell">
      <Sidebar abierto={menuAbierto} alNavegar={() => setMenuAbierto(false)} />
      {menuAbierto && <button aria-label="Cerrar menú" className="rf-sidebar-overlay" onClick={() => setMenuAbierto(false)} />}
      <div className="rf-content">
        <Header alAbrirMenu={() => setMenuAbierto(true)} />
        <main className="rf-main"><div className="rf-main-inner">{children}</div></main>
      </div>
    </div>
  );
}
