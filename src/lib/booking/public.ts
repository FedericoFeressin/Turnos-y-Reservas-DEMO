import { cache } from "react";

import { AppointmentStatus } from "@/generated/prisma/client";
import {
  dateKeyToUtcDate,
  dateToDateKey,
  dayBounds,
  shiftDateKey,
  todayKey,
} from "@/lib/date";
import { prisma } from "@/lib/prisma";

import type { AvailabilitySource, BookingSettings } from "./availability";

/**
 * Lecturas de la página pública.
 *
 * Todo se filtra por `businessId` y por filas activas; nunca se expone un
 * servicio oculto, un profesional dado de baja ni un negocio inactivo.
 */
export const getPublicBusiness = cache(async (slug: string) => {
  return prisma.business.findFirst({
    where: { slug, isActive: true, deletedAt: null },
    select: {
      id: true,
      slug: true,
      name: true,
      email: true,
      phone: true,
      whatsapp: true,
      instagram: true,
      website: true,
      addressLine: true,
      city: true,
      province: true,
      country: true,
      timezone: true,
      currency: true,
      locale: true,
      settings: {
        select: {
          slotGranularityMinutes: true,
          minAdvanceMinutes: true,
          maxAdvanceDays: true,
          allowGuestBooking: true,
          allowChooseAnyStaff: true,
          showStaffSelection: true,
          showPrices: true,
          requireManualConfirmation: true,
          bookingPolicyText: true,
          cancellationPolicyText: true,
        },
      },
    },
  });
});

export type PublicBusiness = NonNullable<
  Awaited<ReturnType<typeof getPublicBusiness>>
>;

export const getPublicCatalog = cache(async (businessId: string) => {
  const [services, employees] = await Promise.all([
    prisma.service.findMany({
      where: {
        businessId,
        isActive: true,
        isPublic: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        category: true,
        priceCents: true,
        durationMinutes: true,
        bufferAfterMinutes: true,
        sortOrder: true,
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.employee.findMany({
      where: {
        businessId,
        isActive: true,
        isBookable: true,
        deletedAt: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        displayName: true,
        title: true,
        bio: true,
        color: true,
        sortOrder: true,
        services: {
          select: { serviceId: true },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { firstName: "asc" }],
    }),
  ]);

  return {
    services,
    employees: employees.map((employee) => ({
      ...employee,
      serviceIds: employee.services.map((link) => link.serviceId),
    })),
  };
});

export type PublicService = Awaited<
  ReturnType<typeof getPublicCatalog>
>["services"][number];

export type PublicEmployee = Awaited<
  ReturnType<typeof getPublicCatalog>
>["employees"][number];

/**
 * Datos crudos que alimentan la disponibilidad de un rango de fechas.
 *
 * Se hacen cinco consultas para todo el rango, en vez de una por día. La
 * disponibilidad se calcula después en memoria con `availability.ts`.
 */
export async function getAvailabilitySource({
  businessId,
  employeeIds,
  fromKey,
  days,
  timezone,
  settings,
}: {
  businessId: string;
  employeeIds: string[];
  fromKey: string;
  days: number;
  timezone: string;
  settings: BookingSettings;
}): Promise<AvailabilitySource> {
  const windowStart = dayBounds(fromKey, timezone).start;
  const windowEnd = dayBounds(shiftDateKey(fromKey, days), timezone).start;
  const holidayFrom = dateKeyToUtcDate(fromKey);
  const holidayTo = dateKeyToUtcDate(shiftDateKey(fromKey, days));

  const [businessRanges, employeeRows, timeOff, holidays, appointments] =
    await Promise.all([
      prisma.businessSchedule.findMany({
        where: { businessId },
        select: { dayOfWeek: true, startMinute: true, endMinute: true },
      }),
      prisma.employeeSchedule.findMany({
        where: { employeeId: { in: employeeIds } },
        select: {
          employeeId: true,
          dayOfWeek: true,
          startMinute: true,
          endMinute: true,
        },
      }),
      prisma.timeOff.findMany({
        where: {
          businessId,
          startsAt: { lt: windowEnd },
          endsAt: { gt: windowStart },
          OR: [{ employeeId: null }, { employeeId: { in: employeeIds } }],
        },
        select: { employeeId: true, startsAt: true, endsAt: true },
      }),
      prisma.holiday.findMany({
        where: {
          businessId,
          date: { gte: holidayFrom, lt: holidayTo },
        },
        select: { date: true, name: true, isClosed: true },
      }),
      prisma.appointment.findMany({
        where: {
          businessId,
          employeeId: { in: employeeIds },
          status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
          startsAt: { lt: windowEnd },
          blockedUntil: { gt: windowStart },
        },
        select: { employeeId: true, startsAt: true, blockedUntil: true },
      }),
    ]);

  return {
    now: new Date(),
    todayKey: todayKey(timezone),
    timezone,
    settings,
    businessRanges,
    employeeRanges: employeeRows,
    employeesWithOwnSchedule: [...new Set(employeeRows.map((row) => row.employeeId))],
    timeOff,
    holidays: holidays.map((holiday) => ({
      dateKey: dateToDateKey(holiday.date),
      name: holiday.name,
      isClosed: holiday.isClosed,
    })),
    appointments,
  };
}

/** Detalle del turno para la pantalla de confirmación. */
export async function getPublicAppointment(businessId: string, id: string) {
  return prisma.appointment.findFirst({
    where: { id, businessId },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      status: true,
      priceCents: true,
      currency: true,
      durationMinutes: true,
      customerNotes: true,
      service: { select: { name: true } },
      employee: {
        select: { displayName: true, firstName: true, lastName: true },
      },
      customer: {
        select: { firstName: true, lastName: true, phone: true },
      },
      business: {
        select: {
          slug: true,
          name: true,
          settings: {
            select: {
              requireManualConfirmation: true,
              cancellationPolicyText: true,
            },
          },
        },
      },
    },
  });
}

/** Código corto y estable para identificar el turno por teléfono o email. */
export function bookingCode(appointment: {
  id: string;
  startsAt: Date;
  serviceId?: string;
}): string {
  const input = `${appointment.startsAt.toISOString()}|${appointment.id}`;
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const value = (hash >>> 0) % 36 ** 4;
  return `EN-${value.toString(36).toUpperCase().padStart(4, "0")}`;
}
