"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  ActorType,
  AppointmentEventType,
  AppointmentStatus,
  Prisma,
} from "@/generated/prisma/client";
import {
  manualBookingFieldErrors,
  manualBookingSchema,
  manualBookingSettings,
  readManualBookingForm,
  type ManualBookingFormState,
} from "@/lib/admin/manual-booking";
import { getManualBookingCatalog } from "@/lib/admin/queries";
import { normalizePhone } from "@/lib/admin/schemas";
import { requireManagerContext } from "@/lib/admin/guard";
import { isSlotAvailable, zonedDateTime } from "@/lib/booking/availability";
import { getAvailabilitySource } from "@/lib/booking/public";
import { dateKeyInZone } from "@/lib/date";
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

/**
 * Alta manual de turnos desde el panel.
 *
 * Reutiliza la disponibilidad pública (horarios, franjas propias, ausencias,
 * feriados y solapamientos) con dos diferencias: no exige anticipación mínima
 * y el turno nace confirmado. Vuelve a validar todo en servidor antes de crear.
 */
export async function createManualAppointmentAction(
  _state: ManualBookingFormState,
  formData: FormData,
): Promise<ManualBookingFormState> {
  const { membership, session } = await requireManagerContext();
  const { business } = membership;
  const values = readManualBookingForm(formData);
  const parsed = manualBookingSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: "Revisá los datos marcados.",
      fieldErrors: manualBookingFieldErrors(parsed.error),
      values,
    };
  }

  const input = parsed.data;

  // Doble submit: devolvemos siempre el mismo turno.
  const previous = await prisma.appointment.findFirst({
    where: {
      businessId: business.id,
      clientRequestId: input.clientRequestId,
    },
    select: { startsAt: true },
  });

  if (previous) {
    redirect(
      `/admin/turnos?fecha=${dateKeyInZone(previous.startsAt, business.timezone)}&ok=creado`,
    );
  }

  const catalog = await getManualBookingCatalog(business.id);
  const service = catalog.services.find((item) => item.id === input.serviceId);
  const employee = catalog.employees.find((item) => item.id === input.employeeId);

  if (!service || !employee || !service.employeeIds.includes(employee.id)) {
    return {
      error: "Ese servicio o profesional ya no están disponibles.",
      fieldErrors: {},
      values,
    };
  }

  let customerId: string;

  if (input.customerMode === "existing") {
    const customer = await prisma.customer.findFirst({
      where: { id: input.customerId, businessId: business.id, deletedAt: null },
      select: { id: true, isBlocked: true },
    });

    if (!customer || customer.isBlocked) {
      return {
        error: "Ese cliente no está disponible para agendar.",
        fieldErrors: { customerId: "Elegí otro cliente." },
        values,
      };
    }

    customerId = customer.id;
  } else {
    const phoneNormalized = normalizePhone(input.phone);
    const customer = await prisma.customer.upsert({
      where: {
        businessId_phoneNormalized: {
          businessId: business.id,
          phoneNormalized,
        },
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
      select: { id: true, isBlocked: true },
    });

    if (customer.isBlocked) {
      return {
        error: "Ese cliente está bloqueado. No se puede agendar un turno.",
        fieldErrors: {},
        values,
      };
    }

    customerId = customer.id;
  }

  const source = await getAvailabilitySource({
    businessId: business.id,
    employeeIds: [employee.id],
    fromKey: input.dateKey,
    days: 1,
    timezone: business.timezone,
    settings: manualBookingSettings(catalog.settings),
  });

  if (!isSlotAvailable(source, input.dateKey, service, employee.id, input.time)) {
    return {
      error: "Ese horario ya no está disponible. Elegí otro.",
      fieldErrors: {},
      values,
    };
  }

  const startsAt = zonedDateTime(input.dateKey, input.time, business.timezone);

  if (!startsAt) {
    return {
      error: "Ese horario no es válido en la zona del negocio.",
      fieldErrors: {},
      values,
    };
  }

  const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60_000);
  const blockedUntil = new Date(
    endsAt.getTime() + service.bufferAfterMinutes * 60_000,
  );
  const now = new Date();

  try {
    const appointment = await prisma.$transaction(async (tx) => {
      const created = await tx.appointment.create({
        data: {
          businessId: business.id,
          customerId,
          employeeId: employee.id,
          serviceId: service.id,
          startsAt,
          endsAt,
          blockedUntil,
          status: AppointmentStatus.CONFIRMED,
          source: input.source,
          priceCents: service.priceCents,
          currency: business.currency,
          durationMinutes: service.durationMinutes,
          bufferAfterMinutes: service.bufferAfterMinutes,
          customerNotes: input.notes || null,
          clientRequestId: input.clientRequestId,
          confirmedAt: now,
        },
        select: { id: true, startsAt: true },
      });

      await tx.appointmentEvent.create({
        data: {
          businessId: business.id,
          appointmentId: created.id,
          type: AppointmentEventType.CREATED,
          actorType: ActorType.STAFF,
          actorUserId: session.user.id,
          toStatus: AppointmentStatus.CONFIRMED,
          note: `Turno creado desde el panel (${input.source})`,
        },
      });

      return created;
    });

    revalidatePath("/admin");
    revalidatePath("/admin/turnos");
    redirect(
      `/admin/turnos?fecha=${dateKeyInZone(appointment.startsAt, business.timezone)}&ok=creado`,
    );
  } catch (error) {
    if (isDuplicateRequest(error)) {
      const repeated = await prisma.appointment.findFirst({
        where: {
          businessId: business.id,
          clientRequestId: input.clientRequestId,
        },
        select: { startsAt: true },
      });
      if (repeated) {
        redirect(
          `/admin/turnos?fecha=${dateKeyInZone(repeated.startsAt, business.timezone)}&ok=creado`,
        );
      }
    }

    if (isExclusionViolation(error)) {
      return {
        error: "Ese horario recién se ocupó. Elegí otro.",
        fieldErrors: {},
        values,
      };
    }

    throw error;
  }
}
