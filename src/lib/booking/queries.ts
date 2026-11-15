import { prisma } from "@/lib/prisma";

/**
 * Agenda de un día para un negocio.
 *
 * Siempre filtra por `businessId`: es la frontera del tenant. Los datos de
 * cliente, profesional y servicio se traen con `select` acotado, y el precio y
 * la duración salen del snapshot del turno, no del catálogo actual.
 */
export async function getDayAgenda(
  businessId: string,
  start: Date,
  end: Date,
) {
  return prisma.appointment.findMany({
    where: {
      businessId,
      startsAt: { gte: start, lt: end },
    },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      status: true,
      priceCents: true,
      currency: true,
      durationMinutes: true,
      customer: {
        select: { firstName: true, lastName: true, phone: true },
      },
      employee: {
        select: {
          firstName: true,
          lastName: true,
          displayName: true,
          color: true,
        },
      },
      service: {
        select: { name: true },
      },
    },
    orderBy: [{ startsAt: "asc" }, { createdAt: "asc" }],
  });
}

export async function getHoliday(businessId: string, date: Date) {
  return prisma.holiday.findUnique({
    where: { businessId_date: { businessId, date } },
    select: { name: true, isClosed: true },
  });
}

export async function getBusinessSchedule(businessId: string, dayOfWeek: number) {
  return prisma.businessSchedule.findMany({
    where: { businessId, dayOfWeek },
    select: { startMinute: true, endMinute: true },
    orderBy: { startMinute: "asc" },
  });
}

export type DayAppointment = Awaited<ReturnType<typeof getDayAgenda>>[number];
