import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Booking System",
    template: "%s · Booking System",
  },
  description:
    "Plataforma de gestión de turnos y reservas para negocios de servicios.",
};

export const viewport: Viewport = {
  themeColor: "#f5f6f8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
