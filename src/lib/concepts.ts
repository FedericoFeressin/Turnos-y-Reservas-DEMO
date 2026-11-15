export type ConceptId = "papel" | "noche" | "orbita" | "brisa" | "pulso";

export type HeroVariant = "editorial" | "cinematic" | "split" | "card" | "clinical";
export type NavVariant = "line" | "floating";
export type Density = "airy" | "compact";
export type Shape = "square" | "rounded" | "pill";
export type SlotVariant = "grid" | "chips" | "list";

export type Concept = {
  id: ConceptId;
  name: string;
  label: string;
  tagline: string;
  description: string;
  verticals: string;
  dark: boolean;
  fonts: { display: string; body: string };
  palette: { name: string; hex: string }[];
  layout: {
    hero: HeroVariant;
    nav: NavVariant;
    density: Density;
    shape: Shape;
    slots: SlotVariant;
  };
};

export const concepts = {
  papel: {
    id: "papel",
    name: "Papel",
    label: "Minimalista editorial",
    tagline: "El oficio se muestra, no se explica.",
    description:
      "Blanco cálido, tipografía con voz y cero decoración. La foto y el espacio hacen el trabajo. Transmite criterio y oficio.",
    verticals: "Barbería premium · Arquitectura · Consultorio particular",
    dark: false,
    fonts: { display: "Instrument Serif", body: "Inter" },
    palette: [
      { name: "Fondo", hex: "#FAF8F3" },
      { name: "Tinta", hex: "#14140F" },
      { name: "Primario", hex: "#2F5D50" },
      { name: "Acento", hex: "#B8763F" },
    ],
    layout: { hero: "editorial", nav: "line", density: "airy", shape: "square", slots: "grid" },
  },
  noche: {
    id: "noche",
    name: "Noche",
    label: "Premium oscuro",
    tagline: "Pocas cosas, muy bien hechas.",
    description:
      "Negro profundo, hairlines y oro usado con cuentagotas. Se siente caro antes de leer el precio. El más memorable y el más exigente.",
    verticals: "Barbería de alta gama · Spa · Restaurante · Tattoo",
    dark: true,
    fonts: { display: "Cormorant Garamond", body: "Manrope" },
    palette: [
      { name: "Fondo", hex: "#0A0A0B" },
      { name: "Superficie", hex: "#141416" },
      { name: "Oro", hex: "#C9A227" },
      { name: "Tinta", hex: "#F4F1EA" },
    ],
    layout: { hero: "cinematic", nav: "floating", density: "airy", shape: "square", slots: "chips" },
  },
  orbita: {
    id: "orbita",
    name: "Órbita",
    label: "SaaS moderno",
    tagline: "Todo el día, en una pantalla.",
    description:
      "Denso pero respirable. Navegación lateral, jerarquía por peso y color. El mejor panel de los cinco; como sitio público, el más correcto y el menos sorprendente.",
    verticals: "Cualquiera · Ideal para el panel de todos los clientes",
    dark: false,
    fonts: { display: "Space Grotesk", body: "Inter" },
    palette: [
      { name: "Fondo", hex: "#F5F6F8" },
      { name: "Superficie", hex: "#FFFFFF" },
      { name: "Primario", hex: "#4338CA" },
      { name: "Acento", hex: "#0E7490" },
    ],
    layout: { hero: "split", nav: "line", density: "compact", shape: "rounded", slots: "grid" },
  },
  brisa: {
    id: "brisa",
    name: "Brisa",
    label: "Creativo y comercial",
    tagline: "Reservar en el tiempo de un café.",
    description:
      "Formas suaves, color cálido y micro-animaciones. Pensado para convertir desde el celular. El que mejor aguanta el rubro más amplio.",
    verticals: "Peluquería · Estética · Gastronomía · Gym",
    dark: false,
    fonts: { display: "Bricolage Grotesque", body: "DM Sans" },
    palette: [
      { name: "Fondo", hex: "#FFFCF5" },
      { name: "Tinta", hex: "#1C1917" },
      { name: "Primario", hex: "#C2410C" },
      { name: "Acento", hex: "#0F766E" },
    ],
    layout: { hero: "card", nav: "floating", density: "airy", shape: "pill", slots: "chips" },
  },
  pulso: {
    id: "pulso",
    name: "Pulso",
    label: "Clínico y confiable",
    tagline: "Claridad antes que todo.",
    description:
      "Petróleo, serif en titulares y señales de confianza visibles. No busca impactar: busca que alguien se anime a reservar un turno médico.",
    verticals: "Consultorio · Odontología · Kinesiología · Nutrición",
    dark: false,
    fonts: { display: "Lora", body: "Source Sans 3" },
    palette: [
      { name: "Fondo", hex: "#F6FAFB" },
      { name: "Tinta", hex: "#0C2A33" },
      { name: "Primario", hex: "#0E7490" },
      { name: "Acento", hex: "#0D9488" },
    ],
    layout: { hero: "clinical", nav: "line", density: "compact", shape: "rounded", slots: "list" },
  },
} satisfies Record<ConceptId, Concept>;

export const conceptList = Object.values(concepts);

export function isConceptId(value: string): value is ConceptId {
  return value in concepts;
}

export function getConcept(id: string): Concept {
  if (!isConceptId(id)) throw new Error(`Concepto desconocido: ${id}`);
  return concepts[id];
}
