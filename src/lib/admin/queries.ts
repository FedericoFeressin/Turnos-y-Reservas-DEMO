import { prisma } from "@/lib/prisma";

/** Consultas del panel. Todas filtran por `businessId`: frontera del tenant. */

export async function listServices(businessId: string) {
  return prisma.service.findMany({
    where: { businessId, deletedAt: null },
    select: {
      id: true,
      name: true,
      category: true,
      description: true,
      priceCents: true,
      durationMinutes: true,
      bufferAfterMinutes: true,
      isActive: true,
      isPublic: true,
      sortOrder: true,
      _count: { select: { employees: true, appointments: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function listEmployees(businessId: string) {
  return prisma.employee.findMany({
    where: { businessId, deletedAt: null },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      displayName: true,
      title: true,
      email: true,
      phone: true,
      color: true,
      isActive: true,
      isBookable: true,
      sortOrder: true,
      services: { select: { serviceId: true } },
      _count: { select: { appointments: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { firstName: "asc" }],
  });
}

/**
 * Clientes del negocio con búsqueda opcional por nombre, apellido, email o
 * teléfono. El teléfono se busca por sus dígitos, así `11 5555-1234` encuentra
 * al mismo cliente que `+5491155551234`.
 */
export async function listCustomers(businessId: string, search = "") {
  const term = search.trim();
  const digits = term.replace(/\D/g, "");

  const filters = term
    ? [
        { firstName: { contains: term, mode: "insensitive" as const } },
        { lastName: { contains: term, mode: "insensitive" as const } },
        { email: { contains: term, mode: "insensitive" as const } },
        { phone: { contains: term } },
        ...(digits.length > 0
          ? [{ phoneNormalized: { contains: digits } }]
          : []),
      ]
    : [];

  return prisma.customer.findMany({
    where: {
      businessId,
      deletedAt: null,
      ...(filters.length > 0 ? { OR: filters } : {}),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      birthDate: true,
      notes: true,
      tags: true,
      marketingOptIn: true,
      isBlocked: true,
      createdAt: true,
      _count: { select: { appointments: true } },
      appointments: {
        select: { startsAt: true, status: true },
        orderBy: { startsAt: "desc" },
        take: 1,
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

/** Ficha de un cliente con su historial completo de turnos, del más nuevo al más viejo. */
export async function getCustomer(businessId: string, id: string) {
  return prisma.customer.findFirst({
    where: { id, businessId, deletedAt: null },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      phoneNormalized: true,
      birthDate: true,
      notes: true,
      tags: true,
      marketingOptIn: true,
      isBlocked: true,
      createdAt: true,
      updatedAt: true,
      appointments: {
        select: {
          id: true,
          startsAt: true,
          endsAt: true,
          status: true,
          priceCents: true,
          currency: true,
          durationMinutes: true,
          service: { select: { name: true } },
          employee: {
            select: {
              firstName: true,
              lastName: true,
              displayName: true,
              color: true,
            },
          },
        },
        orderBy: { startsAt: "desc" },
      },
    },
  });
}

export type ServiceRow = Awaited<ReturnType<typeof listServices>>[number];
export type EmployeeRow = Awaited<ReturnType<typeof listEmployees>>[number];
export type CustomerRow = Awaited<ReturnType<typeof listCustomers>>[number];
export type CustomerDetail = NonNullable<Awaited<ReturnType<typeof getCustomer>>>;

/** Profesionales con su horario semanal, para la pantalla de horarios. */
export async function listScheduleBoard(businessId: string) {
  return prisma.employee.findMany({
    where: { businessId, deletedAt: null },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      displayName: true,
      color: true,
      isActive: true,
      isBookable: true,
      sortOrder: true,
      schedules: {
        select: {
          id: true,
          dayOfWeek: true,
          startMinute: true,
          endMinute: true,
        },
        orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
      },
    },
    orderBy: [{ sortOrder: "asc" }, { firstName: "asc" }],
  });
}

/** Ausencias del negocio, de la más próxima/antigua a la más lejana. */
export async function listTimeOff(businessId: string) {
  return prisma.timeOff.findMany({
    where: { businessId },
    select: {
      id: true,
      type: true,
      startsAt: true,
      endsAt: true,
      reason: true,
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          displayName: true,
          color: true,
        },
      },
    },
    orderBy: { startsAt: "asc" },
    take: 100,
  });
}

export type ScheduleEmployee = Awaited<
  ReturnType<typeof listScheduleBoard>
>[number];
export type TimeOffRow = Awaited<ReturnType<typeof listTimeOff>>[number];

/** Horario general de atención del negocio, ordenado por día y hora. */
export async function listBusinessSchedule(businessId: string) {
  return prisma.businessSchedule.findMany({
    where: { businessId },
    select: {
      id: true,
      dayOfWeek: true,
      startMinute: true,
      endMinute: true,
    },
    orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
  });
}

/** Feriados y cierres del negocio, del más próximo al más lejano. */
export async function listHolidays(businessId: string) {
  return prisma.holiday.findMany({
    where: { businessId },
    select: {
      id: true,
      date: true,
      name: true,
      isClosed: true,
      notes: true,
    },
    orderBy: { date: "asc" },
  });
}

export type BusinessScheduleRow = Awaited<
  ReturnType<typeof listBusinessSchedule>
>[number];
export type HolidayRow = Awaited<ReturnType<typeof listHolidays>>[number];

/**
 * Catálogo para el alta manual. Incluye servicios no públicos (el panel puede
 * agendar cualquier servicio activo) y clientes no bloqueados.
 */
export async function getManualBookingCatalog(businessId: string) {
  const [services, employees, customers, settings] = await Promise.all([
    prisma.service.findMany({
      where: { businessId, isActive: true, deletedAt: null },
      select: {
        id: true,
        name: true,
        priceCents: true,
        durationMinutes: true,
        bufferAfterMinutes: true,
        sortOrder: true,
        employees: { select: { employeeId: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.employee.findMany({
      where: { businessId, isActive: true, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        displayName: true,
        color: true,
        sortOrder: true,
        services: { select: { serviceId: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { firstName: "asc" }],
    }),
    prisma.customer.findMany({
      where: { businessId, deletedAt: null, isBlocked: false },
      select: { id: true, firstName: true, lastName: true, phone: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.businessSettings.findUnique({
      where: { businessId },
      select: {
        slotGranularityMinutes: true,
        maxAdvanceDays: true,
        allowChooseAnyStaff: true,
        showStaffSelection: true,
        showPrices: true,
        requireManualConfirmation: true,
        bookingPolicyText: true,
        cancellationPolicyText: true,
      },
    }),
  ]);

  return {
    services: services.map((service) => ({
      id: service.id,
      name: service.name,
      priceCents: service.priceCents,
      durationMinutes: service.durationMinutes,
      bufferAfterMinutes: service.bufferAfterMinutes,
      employeeIds: service.employees.map((link) => link.employeeId),
    })),
    employees: employees.map((employee) => ({
      id: employee.id,
      name: employee.displayName ?? `${employee.firstName} ${employee.lastName}`,
      color: employee.color,
      serviceIds: employee.services.map((link) => link.serviceId),
    })),
    customers,
    settings,
  };
}

export type ManualBookingCatalog = Awaited<
  ReturnType<typeof getManualBookingCatalog>
>;
