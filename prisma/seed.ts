/**
 * Seed de desarrollo.
 *
 * Reproduce el negocio de la demo (Estudio Norte) con datos relativos a la
 * semana actual, así el panel siempre tiene actividad reciente. Es idempotente:
 * borra y vuelve a crear el catálogo y los turnos del negocio, sin tocar otros
 * negocios ni usuarios.
 *
 * Uso: pnpm db:seed  (o pnpm exec prisma db seed)
 */
import { config } from "dotenv";

import { addDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { hashPassword } from "better-auth/crypto";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import {
  ActorType,
  AppointmentSource,
  AppointmentStatus,
  MembershipRole,
  type AppointmentEventType,
} from "../src/generated/prisma/enums";

// La CLI de Prisma ya carga .env.local, pero el seed también se puede correr
// directo con tsx.
config({ path: [".env.local", ".env"], quiet: true });

const TZ = "America/Argentina/Buenos_Aires";
const SLUG = "estudio-norte";

const databaseUrl = process.env["DATABASE_URL"];
if (!databaseUrl) {
  throw new Error("Falta DATABASE_URL. Copiá .env.example a .env.local.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const now = new Date();
const todayKey = formatInTimeZone(now, TZ, "yyyy-MM-dd");
const todayNoon = fromZonedTime(`${todayKey}T12:00:00`, TZ);

// La agenda de la demo siempre arranca en un lunes con actividad por delante:
// si el seed corre un domingo, se usa la semana siguiente.
const isoDay = Number(formatInTimeZone(now, TZ, "i"));
const offsetToMonday = isoDay === 7 ? 1 : 1 - isoDay;
const weekStart = fromZonedTime(
  `${formatInTimeZone(addDays(todayNoon, offsetToMonday), TZ, "yyyy-MM-dd")}T12:00:00`,
  TZ,
);

function localDate(dayOffset: number, time: string): Date {
  const day = formatInTimeZone(addDays(weekStart, dayOffset), TZ, "yyyy-MM-dd");
  return fromZonedTime(`${day}T${time}:00`, TZ);
}

function dateOnly(dayOffset: number): Date {
  return fromZonedTime(`${formatInTimeZone(addDays(weekStart, dayOffset), TZ, "yyyy-MM-dd")}T00:00:00`, TZ);
}

/* ─────────────────────────────── Catálogo ─────────────────────────────── */

const services = [
  { id: "srv_corte", slug: "corte-clasico", name: "Corte clásico", description: "Tijera y máquina, lavado y peinado. La base de todo.", category: "Corte", price: 9000, duration: 30, buffer: 5 },
  { id: "srv_corte_barba", slug: "corte-barba", name: "Corte + barba", description: "El combo completo, con toalla caliente y navaja.", category: "Combo", price: 14000, duration: 50, buffer: 10 },
  { id: "srv_barba", slug: "perfilado-barba", name: "Perfilado de barba", description: "Contorno, textura y aceite para terminar.", category: "Barba", price: 6500, duration: 20, buffer: 5 },
  { id: "srv_color", slug: "color", name: "Color", description: "Cobertura de canas o cambio de tono. Incluye diagnóstico.", category: "Color", price: 26000, duration: 90, buffer: 15 },
  { id: "srv_nino", slug: "corte-ninos", name: "Corte para niños", description: "Hasta 12 años. Paciencia incluida, sin cargo.", category: "Corte", price: 7000, duration: 25, buffer: 5 },
  { id: "srv_tratamiento", slug: "tratamiento-capilar", name: "Tratamiento capilar", description: "Hidratación profunda con masaje de cuero cabelludo.", category: "Tratamiento", price: 12000, duration: 40, buffer: 10 },
] as const;

type StaffMember = {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  bio: string;
  color: string;
  sortOrder: number;
  /** Días ISO (1 = lunes … 7 = domingo) en los que no trabaja. */
  daysOff: number[];
};

const staff: StaffMember[] = [
  { id: "emp_tomas", firstName: "Tomás", lastName: "Herrera", title: "Barbero · Fundador", bio: "Cortes clásicos y fades. Si no sabés qué pedir, dejalo en sus manos.", color: "#2f5d50", sortOrder: 0, daysOff: [] },
  { id: "emp_julian", firstName: "Julián", lastName: "Márquez", title: "Barbero · Color", bio: "Le gusta el color y las texturas difíciles. Puntual como un reloj.", color: "#9a5a27", sortOrder: 1, daysOff: [] },
  { id: "emp_sofia", firstName: "Sofía", lastName: "Rivas", title: "Estilista", bio: "Cortes con movimiento y tratamientos. Especialista en cabello largo.", color: "#6b655b", sortOrder: 2, daysOff: [3] },
];

const businessHours: Record<number, [number, number][]> = {
  1: [[9 * 60, 13 * 60], [15 * 60, 20 * 60]],
  2: [[9 * 60, 13 * 60], [15 * 60, 20 * 60]],
  3: [[9 * 60, 13 * 60], [15 * 60, 20 * 60]],
  4: [[9 * 60, 13 * 60], [15 * 60, 20 * 60]],
  5: [[9 * 60, 13 * 60], [15 * 60, 20 * 60]],
  6: [[9 * 60, 14 * 60]],
};

/* ─────────────────────────────── Turnos ──────────────────────────────── */

type SeedAppointment = {
  day: number;
  time: string;
  customer: string;
  employee: 0 | 1 | 2;
  service: keyof typeof serviceByDemoName;
  status: AppointmentStatus;
};

const serviceByDemoName = {
  "Corte clásico": "srv_corte",
  "Corte + barba": "srv_corte_barba",
  "Perfilado de barba": "srv_barba",
  Color: "srv_color",
  "Corte para niños": "srv_nino",
  "Tratamiento capilar": "srv_tratamiento",
  Corte: "srv_corte",
  Barba: "srv_barba",
  Niños: "srv_nino",
  Tratamiento: "srv_tratamiento",
} as const;

// Lunes de la semana en curso: la agenda de la demo del laboratorio.
const appointments: SeedAppointment[] = [
  { day: 0, time: "09:00", customer: "Martín Paz", employee: 0, service: "Corte clásico", status: AppointmentStatus.COMPLETED },
  { day: 0, time: "09:30", customer: "Lucas Ferreyra", employee: 1, service: "Corte + barba", status: AppointmentStatus.CONFIRMED },
  { day: 0, time: "10:00", customer: "Ignacio Sosa", employee: 0, service: "Perfilado de barba", status: AppointmentStatus.CONFIRMED },
  { day: 0, time: "10:30", customer: "Ramiro Díaz", employee: 2, service: "Corte clásico", status: AppointmentStatus.CONFIRMED },
  { day: 0, time: "11:00", customer: "Federico Lynch", employee: 1, service: "Color", status: AppointmentStatus.CONFIRMED },
  { day: 0, time: "12:00", customer: "Juan Cruz Vidal", employee: 2, service: "Corte para niños", status: AppointmentStatus.CONFIRMED },
  { day: 0, time: "15:00", customer: "Emiliano Rojas", employee: 2, service: "Tratamiento capilar", status: AppointmentStatus.CANCELLED },
  { day: 0, time: "16:30", customer: "Nicolás Bustos", employee: 0, service: "Corte + barba", status: AppointmentStatus.CONFIRMED },
  { day: 0, time: "17:00", customer: "Santiago Vera", employee: 1, service: "Corte clásico", status: AppointmentStatus.PENDING },

  { day: 1, time: "09:30", customer: "Nicolás Bustos", employee: 0, service: "Corte + barba", status: AppointmentStatus.CONFIRMED },
  { day: 1, time: "11:00", customer: "Federico Lynch", employee: 1, service: "Color", status: AppointmentStatus.CONFIRMED },
  { day: 1, time: "15:00", customer: "Ignacio Sosa", employee: 2, service: "Corte clásico", status: AppointmentStatus.NO_SHOW },

  { day: 2, time: "10:00", customer: "Santiago Vera", employee: 0, service: "Corte clásico", status: AppointmentStatus.PENDING },
  { day: 2, time: "15:30", customer: "Juan Cruz Vidal", employee: 1, service: "Corte + barba", status: AppointmentStatus.CONFIRMED },
  { day: 2, time: "16:30", customer: "Emiliano Rojas", employee: 0, service: "Tratamiento capilar", status: AppointmentStatus.CONFIRMED },

  { day: 3, time: "09:00", customer: "Ana Gómez", employee: 0, service: "Corte clásico", status: AppointmentStatus.CONFIRMED },
  { day: 3, time: "10:30", customer: "Paula Ruiz", employee: 1, service: "Perfilado de barba", status: AppointmentStatus.CONFIRMED },
  { day: 3, time: "16:00", customer: "Carla Molina", employee: 2, service: "Color", status: AppointmentStatus.PENDING },

  { day: 4, time: "11:30", customer: "Diego Acosta", employee: 0, service: "Corte + barba", status: AppointmentStatus.CONFIRMED },
  { day: 4, time: "17:30", customer: "Tomás Benítez", employee: 1, service: "Corte clásico", status: AppointmentStatus.CONFIRMED },

  { day: 5, time: "09:00", customer: "Malena Ledesma", employee: 0, service: "Corte clásico", status: AppointmentStatus.CONFIRMED },
  { day: 5, time: "10:00", customer: "Bruno Sarmiento", employee: 1, service: "Corte para niños", status: AppointmentStatus.CONFIRMED },
  { day: 5, time: "11:00", customer: "Valeria Correa", employee: 2, service: "Tratamiento capilar", status: AppointmentStatus.CONFIRMED },
];

const phoneBase = 11_4000_0000;

function normalizePhone(index: number): string {
  return `+549${phoneBase + index}`;
}

/* ─────────────────────────────── Seed ────────────────────────────────── */

async function main() {
  console.log(`Sembrando ${SLUG} — semana del ${formatInTimeZone(weekStart, TZ, "d/M/yyyy")}`);

  const business = await prisma.business.upsert({
    where: { slug: SLUG },
    update: {
      name: "Estudio Norte",
      email: "hola@estudionorte.com.ar",
      phone: "+54 11 4783-9021",
      whatsapp: "+54 11 4783-9021",
      instagram: "estudionorte",
      addressLine: "Av. Cabildo 2450",
      city: "CABA",
      province: "Ciudad Autónoma de Buenos Aires",
      postalCode: "1428",
      timezone: TZ,
      currency: "ARS",
      locale: "es-AR",
    },
    create: {
      id: "biz_estudio_norte",
      slug: SLUG,
      name: "Estudio Norte",
      legalName: "Estudio Norte S.R.L.",
      taxId: "30-71234567-8",
      email: "hola@estudionorte.com.ar",
      phone: "+54 11 4783-9021",
      whatsapp: "+54 11 4783-9021",
      instagram: "estudionorte",
      addressLine: "Av. Cabildo 2450",
      city: "CABA",
      province: "Ciudad Autónoma de Buenos Aires",
      country: "AR",
      postalCode: "1428",
      timezone: TZ,
      currency: "ARS",
      locale: "es-AR",
    },
  });

  const businessId = business.id;

  await prisma.businessSettings.upsert({
    where: { businessId },
    update: {},
    create: {
      businessId,
      slotGranularityMinutes: 15,
      minAdvanceMinutes: 120,
      maxAdvanceDays: 60,
      cancellationWindowMinutes: 1440,
      requireManualConfirmation: false,
      allowGuestBooking: true,
      allowChooseAnyStaff: true,
      showPrices: true,
      showStaffSelection: true,
      enabledModules: ["booking", "team", "services"],
      bookingPolicyText:
        "Los turnos se reservan hasta 60 días adelante y con 2 horas de anticipación.",
      cancellationPolicyText:
        "Podés cancelar o reprogramar sin costo hasta 24 horas antes del turno. Después de ese plazo se cobra el 50% del servicio.",
    },
  });

  await prisma.businessTheme.upsert({
    where: { businessId },
    update: { preset: "papel" },
    create: { businessId, preset: "papel", density: "comfortable" },
  });

  // Reset del catálogo y la agenda de este negocio.
  await prisma.appointment.deleteMany({ where: { businessId } });
  await prisma.customer.deleteMany({ where: { businessId } });
  await prisma.employee.deleteMany({ where: { businessId } });
  await prisma.service.deleteMany({ where: { businessId } });
  await prisma.businessSchedule.deleteMany({ where: { businessId } });
  await prisma.holiday.deleteMany({ where: { businessId } });

  await prisma.businessSchedule.createMany({
    data: Object.entries(businessHours).flatMap(([day, ranges]) =>
      ranges.map(([startMinute, endMinute]) => ({
        businessId,
        dayOfWeek: Number(day),
        startMinute,
        endMinute,
      })),
    ),
  });

  const owner = await prisma.user.upsert({
    where: { email: "tomas@estudionorte.com.ar" },
    update: { name: "Tomás Herrera" },
    create: {
      id: "usr_tomas",
      name: "Tomás Herrera",
      email: "tomas@estudionorte.com.ar",
      emailVerified: true,
    },
  });

  await prisma.membership.upsert({
    where: { businessId_userId: { businessId, userId: owner.id } },
    update: { role: MembershipRole.OWNER, isActive: true },
    create: {
      businessId,
      userId: owner.id,
      role: MembershipRole.OWNER,
    },
  });

  // Cuenta de acceso de la demo. Better Auth guarda la contraseña en `Account`
  // con providerId "credential" y accountId = id del usuario.
  const ownerPassword = process.env.SEED_OWNER_PASSWORD ?? "estudio-norte";
  await prisma.account.deleteMany({
    where: { userId: owner.id, providerId: "credential" },
  });
  await prisma.account.create({
    data: {
      id: `acc_${owner.id}_credential`,
      accountId: owner.id,
      providerId: "credential",
      userId: owner.id,
      password: await hashPassword(ownerPassword),
    },
  });

  await prisma.employee.createMany({
    data: staff.map((person) => ({
      id: person.id,
      businessId,
      userId: person.id === "emp_tomas" ? owner.id : null,
      firstName: person.firstName,
      lastName: person.lastName,
      displayName: `${person.firstName} ${person.lastName}`,
      title: person.title,
      bio: person.bio,
      email: person.id === "emp_tomas" ? "tomas@estudionorte.com.ar" : null,
      color: person.color,
      sortOrder: person.sortOrder,
      isBookable: true,
      isActive: true,
    })),
  });

  await prisma.service.createMany({
    data: services.map((service, index) => ({
      id: service.id,
      businessId,
      name: service.name,
      slug: service.slug,
      description: service.description,
      category: service.category,
      priceCents: service.price * 100,
      durationMinutes: service.duration,
      bufferAfterMinutes: service.buffer,
      sortOrder: index,
    })),
  });

  await prisma.employeeService.createMany({
    data: staff.flatMap((person) =>
      services.map((service) => ({ employeeId: person.id, serviceId: service.id })),
    ),
  });

  // Sofía no trabaja los miércoles: horario propio para el resto de los días.
  await prisma.employeeSchedule.createMany({
    data: staff
      .filter((person) => person.daysOff.length > 0)
      .flatMap((person) =>
        Object.entries(businessHours)
          .filter(([day]) => !person.daysOff.includes(Number(day)))
          .flatMap(([day, ranges]) =>
            ranges.map(([startMinute, endMinute]) => ({
              employeeId: person.id,
              dayOfWeek: Number(day),
              startMinute,
              endMinute,
            })),
          ),
      ),
  });

  await prisma.holiday.create({
    data: {
      businessId,
      date: dateOnly(7),
      name: "Feriado municipal (demo)",
      isClosed: true,
      notes: "Día sin atención. Se usa para probar el calendario.",
    },
  });

  const customerNames = [...new Set(appointments.map((item) => item.customer))];
  await prisma.customer.createMany({
    data: customerNames.map((fullName, index) => {
      const [firstName, ...rest] = fullName.split(" ");
      return {
        businessId,
        firstName,
        lastName: rest.join(" ") || null,
        email: `${firstName.toLowerCase()}.${String(rest[0] ?? index).toLowerCase()}@ejemplo.com`
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, ""),
        phone: normalizePhone(index),
        phoneNormalized: normalizePhone(index),
      };
    }),
  });

  const [employees, createdServices, customers] = await Promise.all([
    prisma.employee.findMany({ where: { businessId } }),
    prisma.service.findMany({ where: { businessId } }),
    prisma.customer.findMany({ where: { businessId } }),
  ]);

  const employeeById = new Map(employees.map((employee) => [employee.id, employee]));
  const serviceById = new Map(createdServices.map((service) => [service.id, service]));
  const customerByName = new Map(
    customers.map((customer) => [
      `${customer.firstName} ${customer.lastName ?? ""}`.trim(),
      customer,
    ]),
  );

  let created = 0;
  for (const item of appointments) {
    const employee = employeeById.get(staff[item.employee]!.id);
    const serviceId = serviceByDemoName[item.service];
    const service = serviceById.get(serviceId);
    const customer = customerByName.get(item.customer);

    if (!employee || !service || !customer) {
      throw new Error(`Datos incompletos para el turno de ${item.customer}.`);
    }

    const startsAt = localDate(item.day, item.time);
    const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60_000);
    const blockedUntil = new Date(endsAt.getTime() + service.bufferAfterMinutes * 60_000);

    // Los turnos que ya pasaron se muestran como completados, salvo los que
    // explícitamente se cancelaron o el cliente no asistió.
    const isPast = endsAt.getTime() < now.getTime();
    const status =
      isPast && (item.status === AppointmentStatus.CONFIRMED || item.status === AppointmentStatus.PENDING)
        ? AppointmentStatus.COMPLETED
        : item.status;

    const appointment = await prisma.appointment.create({
      data: {
        businessId,
        customerId: customer.id,
        employeeId: employee.id,
        serviceId: service.id,
        startsAt,
        endsAt,
        blockedUntil,
        status,
        source: AppointmentSource.PUBLIC,
        priceCents: service.priceCents,
        currency: "ARS",
        durationMinutes: service.durationMinutes,
        bufferAfterMinutes: service.bufferAfterMinutes,
        confirmedAt:
          status === AppointmentStatus.CONFIRMED ? new Date(startsAt.getTime() - 86_400_000) : null,
        completedAt: status === AppointmentStatus.COMPLETED ? endsAt : null,
        cancelledAt: status === AppointmentStatus.CANCELLED ? new Date(startsAt.getTime() - 3_600_000) : null,
        cancellationReason: status === AppointmentStatus.CANCELLED ? "Cancelado por el cliente" : null,
      },
    });

    await prisma.appointmentEvent.create({
      data: {
        businessId,
        appointmentId: appointment.id,
        type: "CREATED" satisfies AppointmentEventType,
        actorType: ActorType.CUSTOMER,
        toStatus: status,
        note: "Reserva creada desde el sitio público (seed).",
      },
    });

    created += 1;
  }

  console.log(`Listo: ${created} turnos, ${services.length} servicios, ${staff.length} profesionales.`);
  console.log(`Owner: ${owner.email} (${owner.id})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
