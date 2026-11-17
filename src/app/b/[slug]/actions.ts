"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  AppointmentSource,
  AppointmentStatus,
  Prisma,
} from "@/generated/prisma/client";
import { ANY_STAFF, isSlotAvailable, zonedDateTime } from "@/lib/booking/availability";
import {
  getAvailabilitySource,
  getPublicBusiness,
} from "@/lib/booking/public";
import {
  bookingFieldErrors,
  publicBookingSchema,
  readPublicBookingForm,
  type PublicBookingFormState,
} from "@/lib/booking/public-schema";
import { normalizePhone } from "@/lib/admin/schemas";
import { prisma } from "@/lib/prisma";

function isExclusionViolation(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  const meta = error.meta as Record<string, unknown> | undefined;

  return (
    meta?.code === "23P01" ||
    String(meta?.constraint ?? "").includes("appointments_no_overlap") ||
    error.message.includes("appointments_no_overlap")
  );
}

function isDuplicateRequest(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code !== "P2002") return false;

  const meta = error.meta as Record<string, unknown> | undefined;
  return String(meta?.target ?? "").includes("client_request_id");
}

export async function createPublicBookingAction(
  _state: PublicBookingFormState,
  formData: FormData,
): Promise<PublicBookingFormState> {
  const values = readPublicBookingForm(formData);
  const parsed = publicBookingSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: "Revisá los datos marcados.",
      fieldErrors: bookingFieldErrors(parsed.error),
      values,
    };
  }

  const input = parsed.data;
  const business = await getPublicBusiness(input.slug);

  if (!business || !business.settings?.allowGuestBooking) {
    return { error: "La reserva online no está disponible.", fieldErrors: {}, values };
  }

  const settings = business.settings;

  // Doble submit: la misma petición devuelve siempre el mismo turno.
  const previous = await prisma.appointment.findFirst({
    where: { businessId: business.id, clientRequestId: input.clientRequestId },
    select: { id: true, business: { select: { slug: true } } },
  });

  if (previous) {
    redirect(`/b/${previous.business.slug}/reserva/${previous.id}`);
  }

  const service = await prisma.service.findFirst({
    where: {
      id: input.serviceId,
      businessId: business.id,
      isActive: true,
      isPublic: true,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      priceCents: true,
      durationMinutes: true,
      bufferAfterMinutes: true,
    },
  });

  if (!service) {
    return { error: "Ese servicio ya no está disponible.", fieldErrors: {}, values };
  }

  const eligible = await prisma.employee.findMany({
    where: {
      businessId: business.id,
      isActive: true,
      isBookable: true,
      deletedAt: null,
      services: { some: { serviceId: service.id } },
    },
    select: { id: true, sortOrder: true, firstName: true },
    orderBy: [{ sortOrder: "asc" }, { firstName: "asc" }],
  });

  if (eligible.length === 0) {
    return { error: "No hay profesionales para ese servicio.", fieldErrors: {}, values };
  }

  const wantsAny = input.employeeId === ANY_STAFF;

  if (wantsAny && !settings.allowChooseAnyStaff) {
    return { error: "Elegí un profesional para continuar.", fieldErrors: {}, values };
  }

  if (!wantsAny && !eligible.some((person) => person.id === input.employeeId)) {
    return { error: "Ese profesional no atiende ese servicio.", fieldErrors: {}, values };
  }

  const source = await getAvailabilitySource({
    businessId: business.id,
    employeeIds: eligible.map((person) => person.id),
    fromKey: input.dateKey,
    days: 1,
    timezone: business.timezone,
    settings,
  });

  // Orden de preferencia: el elegido, o los profesionales del catálogo si el
  // cliente dejó "cualquiera". Se valida todo otra vez contra la base.
  const candidateIds = wantsAny
    ? eligible.map((person) => person.id)
    : [input.employeeId];

  const freeIds = candidateIds.filter((employeeId) =>
    isSlotAvailable(source, input.dateKey, service, employeeId, input.time),
  );

  if (freeIds.length === 0) {
    return {
      error: "Ese horario ya no está disponible. Elegí otro.",
      fieldErrors: {},
      values,
    };
  }

  const startsAt = zonedDateTime(input.dateKey, input.time, business.timezone);

  if (!startsAt) {
    return { error: "Ese horario no es válido en la zona del negocio.", fieldErrors: {}, values };
  }

  const phoneNormalized = normalizePhone(input.phone);
  const existingCustomer = await prisma.customer.findUnique({
    where: {
      businessId_phoneNormalized: {
        businessId: business.id,
        phoneNormalized,
      },
    },
    select: { isBlocked: true },
  });

  if (existingCustomer?.isBlocked) {
    return {
      error: "No pudimos completar la reserva. Comunicate con el negocio.",
      fieldErrors: {},
      values,
    };
  }

  const customer = await prisma.customer.upsert({
    where: {
      businessId_phoneNormalized: { businessId: business.id, phoneNormalized },
    },
    update: {
      firstName: input.firstName,
      lastName: input.lastName || null,
      email: input.email || null,
    },
    create: {
      businessId: business.id,
      firstName: input.firstName,
      lastName: input.lastName || null,
      email: input.email || null,
      phone: input.phone,
      phoneNormalized,
    },
    select: { id: true },
  });

  const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60_000);
  const blockedUntil = new Date(
    endsAt.getTime() + service.bufferAfterMinutes * 60_000,
  );
  const status = settings.requireManualConfirmation
    ? AppointmentStatus.PENDING
    : AppointmentStatus.CONFIRMED;

  let createdId: string | null = null;

  for (const employeeId of freeIds) {
    try {
      const appointment = await prisma.appointment.create({
        data: {
          businessId: business.id,
          customerId: customer.id,
          employeeId,
          serviceId: service.id,
          startsAt,
          endsAt,
          blockedUntil,
          status,
          source: AppointmentSource.PUBLIC,
          priceCents: service.priceCents,
          currency: business.currency,
          durationMinutes: service.durationMinutes,
          bufferAfterMinutes: service.bufferAfterMinutes,
          customerNotes: input.notes || null,
          clientRequestId: input.clientRequestId,
          confirmedAt:
            status === AppointmentStatus.CONFIRMED ? new Date() : null,
        },
        select: { id: true },
      });
      createdId = appointment.id;
      break;
    } catch (error) {
      if (isDuplicateRequest(error)) {
        const repeated = await prisma.appointment.findFirst({
          where: { businessId: business.id, clientRequestId: input.clientRequestId },
          select: { id: true },
        });
        if (repeated) {
          redirect(`/b/${business.slug}/reserva/${repeated.id}`);
        }
      }

      // Otra reserva ganó la carrera por ese profesional: probamos el siguiente.
      if (isExclusionViolation(error)) continue;

      throw error;
    }
  }

  if (!createdId) {
    return {
      error: "Ese horario recién se ocupó. Elegí otro.",
      fieldErrors: {},
      values,
    };
  }

  revalidatePath(`/b/${business.slug}`);
  revalidatePath("/admin");
  redirect(`/b/${business.slug}/reserva/${createdId}`);
}
