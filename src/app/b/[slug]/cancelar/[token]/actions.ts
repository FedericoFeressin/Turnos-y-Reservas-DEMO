"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { AppointmentStatus } from "@/generated/prisma/enums";
import {
  canCancelAppointment,
  cancellationSchema,
  readCancellationForm,
  type CancellationFormState,
} from "@/lib/booking/cancellation";
import { bookingCode, getPublicBusiness } from "@/lib/booking/public";
import { recordBookingCancelled } from "@/lib/booking/records";
import { verifyCancellationToken } from "@/lib/booking/token";
import { prisma } from "@/lib/prisma";

/**
 * Cancela un turno sin cuenta de cliente.
 *
 * El token dice qué turno y qué negocio, pero no autoriza por sí solo: acá se
 * repiten el slug, el estado, la ventana de cancelación y la pertenencia al
 * negocio. El `updateMany` con filtro de estado hace la operación idempotente
 * aunque lleguen dos peticiones al mismo tiempo.
 */
export async function cancelPublicBookingAction(
  _state: CancellationFormState,
  formData: FormData,
): Promise<CancellationFormState> {
  const parsed = cancellationSchema.safeParse(readCancellationForm(formData));

  if (!parsed.success) {
    return { error: "El enlace de cancelación no es válido." };
  }

  const { slug, token, reason } = parsed.data;
  const verified = verifyCancellationToken(token);

  if (!verified) {
    return {
      error: "El enlace venció o no es válido. Pedí uno nuevo al negocio.",
    };
  }

  const business = await getPublicBusiness(slug);

  if (!business || business.id !== verified.businessId) {
    return { error: "El enlace no corresponde a este negocio." };
  }

  const appointment = await prisma.appointment.findFirst({
    where: { id: verified.appointmentId, businessId: business.id },
    select: {
      id: true,
      status: true,
      startsAt: true,
      customer: { select: { email: true, phoneNormalized: true } },
      service: { select: { name: true } },
    },
  });

  if (!appointment) {
    return { error: "No encontramos ese turno." };
  }

  if (appointment.status === AppointmentStatus.CANCELLED) {
    redirect(`/b/${slug}/reserva/${appointment.id}?cancelado=1`);
  }

  const windowMinutes = business.settings?.cancellationWindowMinutes ?? 1440;

  if (
    !canCancelAppointment({
      status: appointment.status,
      startsAt: appointment.startsAt,
      windowMinutes,
    })
  ) {
    return {
      error:
        "Ya no se puede cancelar desde este enlace. Comunicate con el negocio.",
    };
  }

  await prisma.$transaction(async (tx) => {
    const updated = await tx.appointment.updateMany({
      where: {
        id: appointment.id,
        businessId: business.id,
        status: {
          in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
        },
      },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason:
          reason || "Cancelado por el cliente desde el enlace",
      },
    });

    // Otra petición ganó la carrera y ya canceló el turno. No hay evento ni
    // notificación nueva que agregar.
    if (updated.count !== 1) return;

    await recordBookingCancelled(tx, {
      businessId: business.id,
      appointmentId: appointment.id,
      fromStatus: appointment.status,
      note: reason || null,
      email: appointment.customer.email,
      phone: appointment.customer.phoneNormalized,
      payload: {
        appointmentId: appointment.id,
        code: bookingCode({ id: appointment.id, startsAt: appointment.startsAt }),
        startsAt: appointment.startsAt.toISOString(),
        serviceName: appointment.service.name,
        businessName: business.name,
        ...(reason ? { reason } : {}),
      },
    });
  });

  revalidatePath(`/b/${slug}`);
  revalidatePath(`/b/${slug}/reserva/${appointment.id}`);
  revalidatePath(`/b/${slug}/cancelar/${token}`);
  revalidatePath("/admin");
  revalidatePath("/admin/turnos");

  redirect(`/b/${slug}/reserva/${appointment.id}?cancelado=1`);
}
