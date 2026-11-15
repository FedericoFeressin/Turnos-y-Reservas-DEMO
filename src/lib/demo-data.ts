export const business = {
  name: "Estudio Norte",
  shortName: "Norte",
  tagline: "Barbería & estilismo",
  description:
    "Somos tres personas, seis tijeras y una idea simple: que salir de acá sea lo mejor del día.",
  address: "Av. Cabildo 2450, CABA",
  phone: "+54 11 4783-9021",
  instagram: "@estudionorte",
  since: 2012,
  rating: 4.9,
  reviews: 318,
  hours: [
    { label: "Lunes a viernes", value: "09:00 – 13:00 · 15:00 – 20:00" },
    { label: "Sábados", value: "09:00 – 14:00" },
    { label: "Domingos", value: "Cerrado" },
  ],
} as const;

export type DemoService = {
  id: string;
  name: string;
  description: string;
  duration: number;
  /** Minutos de limpieza/preparación que también quedan bloqueados. */
  buffer: number;
  price: number;
  icon: "scissors" | "razor" | "sparkles" | "palette" | "baby" | "droplet";
  popular?: boolean;
};

export const services: DemoService[] = [
  {
    id: "corte",
    name: "Corte clásico",
    description: "Tijera y máquina, lavado y peinado. La base de todo.",
    duration: 30,
    buffer: 5,
    price: 9000,
    icon: "scissors",
    popular: true,
  },
  {
    id: "corte-barba",
    name: "Corte + barba",
    description: "El combo completo, con toalla caliente y navaja.",
    duration: 50,
    buffer: 10,
    price: 14000,
    icon: "razor",
    popular: true,
  },
  {
    id: "barba",
    name: "Perfilado de barba",
    description: "Contorno, textura y aceite para terminar.",
    duration: 20,
    buffer: 5,
    price: 6500,
    icon: "razor",
  },
  {
    id: "color",
    name: "Color",
    description: "Cobertura de canas o cambio de tono. Incluye diagnóstico.",
    duration: 90,
    buffer: 15,
    price: 26000,
    icon: "palette",
  },
  {
    id: "nino",
    name: "Corte para niños",
    description: "Hasta 12 años. Paciencia incluida, sin cargo.",
    duration: 25,
    buffer: 5,
    price: 7000,
    icon: "baby",
  },
  {
    id: "tratamiento",
    name: "Tratamiento capilar",
    description: "Hidratación profunda con masaje de cuero cabelludo.",
    duration: 40,
    buffer: 10,
    price: 12000,
    icon: "droplet",
  },
];

export type DemoStaff = {
  id: string;
  name: string;
  role: string;
  years: number;
  /** Días de la semana que no trabaja (0 = domingo). */
  daysOff: number[];
  bio: string;
  specialties: string[];
};

export const staff: DemoStaff[] = [
  {
    id: "tomas",
    name: "Tomás Herrera",
    role: "Barbero · Fundador",
    years: 14,
    daysOff: [],
    bio: "Cortes clásicos y fades. Si no sabés qué pedir, dejalo en sus manos.",
    specialties: ["Clásico", "Fade", "Barba"],
  },
  {
    id: "julian",
    name: "Julián Márquez",
    role: "Barbero · Color",
    years: 8,
    daysOff: [],
    bio: "Le gusta el color y las texturas difíciles. Puntual como un reloj.",
    specialties: ["Color", "Textura", "Barba"],
  },
  {
    id: "sofia",
    name: "Sofía Rivas",
    role: "Estilista",
    years: 6,
    daysOff: [3],
    bio: "Cortes con movimiento y tratamientos. Especialista en cabello largo.",
    specialties: ["Largo", "Tratamientos", "Peinados"],
  },
];

export type DemoSlot = { time: string; status: "free" | "taken" };

export const demoSlots: { label: string; slots: DemoSlot[] }[] = [
  {
    label: "Mañana",
    slots: [
      { time: "09:00", status: "free" },
      { time: "09:30", status: "taken" },
      { time: "10:00", status: "free" },
      { time: "10:30", status: "free" },
      { time: "11:00", status: "taken" },
      { time: "11:30", status: "free" },
      { time: "12:00", status: "free" },
      { time: "12:30", status: "free" },
    ],
  },
  {
    label: "Tarde",
    slots: [
      { time: "15:00", status: "free" },
      { time: "15:30", status: "free" },
      { time: "16:00", status: "taken" },
      { time: "16:30", status: "free" },
      { time: "17:00", status: "free" },
      { time: "17:30", status: "free" },
      { time: "18:00", status: "free" },
      { time: "18:30", status: "taken" },
      { time: "19:00", status: "free" },
      { time: "19:30", status: "free" },
    ],
  },
];

export const weekDays = [
  { weekday: "Lun", day: "16", month: "nov", available: true },
  { weekday: "Mar", day: "17", month: "nov", available: true },
  { weekday: "Mié", day: "18", month: "nov", available: true },
  { weekday: "Jue", day: "19", month: "nov", available: true },
  { weekday: "Vie", day: "20", month: "nov", available: true },
  { weekday: "Sáb", day: "21", month: "nov", available: true },
  { weekday: "Dom", day: "22", month: "nov", available: false },
];

export type AppointmentStatus = "CONFIRMED" | "PENDING" | "CANCELLED" | "COMPLETED" | "NO_SHOW";

export type DemoAppointment = {
  customer: string;
  service: string;
  employee: string;
  time: string;
  price: number;
  status: AppointmentStatus;
};

export const todayAppointments: DemoAppointment[] = [
  { customer: "Martín Paz", service: "Corte clásico", employee: "Tomás", time: "09:00", price: 9000, status: "COMPLETED" },
  { customer: "Lucas Ferreyra", service: "Corte + barba", employee: "Julián", time: "09:30", price: 14000, status: "CONFIRMED" },
  { customer: "Ignacio Sosa", service: "Perfilado de barba", employee: "Tomás", time: "10:00", price: 6500, status: "CONFIRMED" },
  { customer: "Ramiro Díaz", service: "Corte clásico", employee: "Sofía", time: "10:30", price: 9000, status: "CONFIRMED" },
  { customer: "Federico Lynch", service: "Color", employee: "Julián", time: "11:00", price: 26000, status: "PENDING" },
  { customer: "Juan Cruz Vidal", service: "Corte para niños", employee: "Sofía", time: "12:00", price: 7000, status: "CONFIRMED" },
  { customer: "Emiliano Rojas", service: "Tratamiento capilar", employee: "Sofía", time: "15:00", price: 12000, status: "CANCELLED" },
  { customer: "Nicolás Bustos", service: "Corte + barba", employee: "Tomás", time: "16:30", price: 14000, status: "CONFIRMED" },
  { customer: "Santiago Vera", service: "Corte clásico", employee: "Julián", time: "17:00", price: 9000, status: "PENDING" },
];

export const adminMetrics = [
  { label: "Turnos hoy", value: "14", detail: "de 18 disponibles", trend: "+2" },
  { label: "Confirmados", value: "9", detail: "64% del total" },
  { label: "Pendientes", value: "3", detail: "requieren atención" },
  { label: "Ingresos est.", value: "$ 142.000", detail: "hasta ahora", trend: "+12%" },
];

export const weekColumns = ["Lun 16", "Mar 17", "Mié 18", "Jue 19", "Vie 20", "Sáb 21"];

export const calendarAppointments = [
  { day: 0, employee: 0, time: "09:00", duration: 30, customer: "M. Paz", service: "Corte", status: "COMPLETED" as AppointmentStatus },
  { day: 0, employee: 1, time: "10:00", duration: 50, customer: "L. Ferreyra", service: "Corte + barba", status: "CONFIRMED" as AppointmentStatus },
  { day: 0, employee: 2, time: "16:00", duration: 40, customer: "R. Díaz", service: "Tratamiento", status: "CONFIRMED" as AppointmentStatus },
  { day: 1, employee: 0, time: "09:30", duration: 50, customer: "N. Bustos", service: "Corte + barba", status: "CONFIRMED" as AppointmentStatus },
  { day: 1, employee: 1, time: "11:00", duration: 90, customer: "F. Lynch", service: "Color", status: "CONFIRMED" as AppointmentStatus },
  { day: 1, employee: 2, time: "15:00", duration: 30, customer: "I. Sosa", service: "Corte", status: "NO_SHOW" as AppointmentStatus },
  { day: 2, employee: 0, time: "10:00", duration: 30, customer: "S. Vera", service: "Corte", status: "PENDING" as AppointmentStatus },
  { day: 2, employee: 1, time: "15:30", duration: 50, customer: "J. Vidal", service: "Corte + barba", status: "CONFIRMED" as AppointmentStatus },
  { day: 2, employee: 0, time: "16:30", duration: 40, customer: "E. Rojas", service: "Tratamiento", status: "CONFIRMED" as AppointmentStatus },
  { day: 3, employee: 0, time: "09:00", duration: 30, customer: "A. Gómez", service: "Corte", status: "CONFIRMED" as AppointmentStatus },
  { day: 3, employee: 1, time: "10:30", duration: 20, customer: "P. Ruiz", service: "Barba", status: "CONFIRMED" as AppointmentStatus },
  { day: 3, employee: 2, time: "16:00", duration: 90, customer: "C. Molina", service: "Color", status: "PENDING" as AppointmentStatus },
  { day: 4, employee: 0, time: "11:30", duration: 50, customer: "D. Acosta", service: "Corte + barba", status: "CONFIRMED" as AppointmentStatus },
  { day: 4, employee: 1, time: "17:30", duration: 30, customer: "T. Benítez", service: "Corte", status: "CONFIRMED" as AppointmentStatus },
  { day: 5, employee: 0, time: "09:00", duration: 30, customer: "M. Ledesma", service: "Corte", status: "CONFIRMED" as AppointmentStatus },
  { day: 5, employee: 1, time: "10:00", duration: 25, customer: "B. Sarmiento", service: "Niños", status: "CONFIRMED" as AppointmentStatus },
  { day: 5, employee: 2, time: "11:00", duration: 40, customer: "V. Correa", service: "Tratamiento", status: "CONFIRMED" as AppointmentStatus },
];

export const calendarTimes = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
];

export const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});
