import type { Metadata } from "next";
import "./globals.css";

import AppLayout from "@/components/AppLayout";

export const metadata: Metadata = {
  title: "RoomFlow",
  description: "Gestión de alquiler de habitaciones",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" translate="no">
      <body>
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}