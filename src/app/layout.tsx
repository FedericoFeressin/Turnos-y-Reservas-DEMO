import type { Metadata, Viewport } from "next";
import {
  Bricolage_Grotesque,
  Cormorant_Garamond,
  DM_Sans,
  Inter,
  Instrument_Serif,
  Lora,
  Manrope,
  Source_Sans_3,
  Space_Grotesk,
} from "next/font/google";

import "./globals.css";
import "@/styles/themes/papel.css";
import "@/styles/themes/noche.css";
import "@/styles/themes/orbita.css";
import "@/styles/themes/brisa.css";
import "@/styles/themes/pulso.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-cormorant-garamond",
  display: "swap",
});
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-space-grotesk",
  display: "swap",
});
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-bricolage-grotesque",
  display: "swap",
});
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const lora = Lora({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-lora",
  display: "swap",
});
const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-source-sans",
  display: "swap",
});

const fontVariables = [
  inter.variable,
  instrumentSerif.variable,
  cormorant.variable,
  manrope.variable,
  spaceGrotesk.variable,
  bricolage.variable,
  dmSans.variable,
  lora.variable,
  sourceSans.variable,
].join(" ");

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
    <html lang="es-AR" className={fontVariables}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
