"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ActorType } from "@/generated/prisma/enums";
import {
  allowedTransitions,
  appointmentActionSchema,
  intentOutcome,
  readAppointmentActionForm,
} from "@/lib/admin/appointments";
import { requireManagerContext } from "@/lib/admin/guard";
import { dateKeyInZone } from "@/lib/date";
import { prisma } from "@/lib/prisma";

/**
 * Cambia el estado de un turno del panel.
 *
 * Todo se resuelve en servidor: la transición permitida, el negocio del turno,
 * el rol del usuario y el evento que queda en el historial. Un formulario
 * manipulado no puede mover un turno de otro negocio ni saltarse un estado.
 */
export async function changeAppointmentStatusAction(formData: FormData) {
  const { membership, session } = await requireManagerContext();
  const values = readAppointmentActionForm(formData);
  const parsed = appointmentActionSchema.safeParse(values);

  if (!parsed.success) {
    redirect("/admin?error=accion");
  }

  const { id, intent, reason } = parsed.data;
  const appointment = await prisma.appointment.findFirst({
    where: { id, businessId: membership.businessId },
    select: {
      id: true,
      status: true,
      startsAt: true,
      cancellationReason: true,
    },
  });

  if (!appointment) {
    redirect("/admin?error=turno");
  }

  if (!allowedTransitions[appointment.status].includes(intent)) {
    redirect("/admin?error=transicion");
  }

  const outcome = intentOutcome[intent];
  const now = new Date();

  const data = {
    status: outcome.status,
    ...(intent === "confirm" ? { confirmedAt: now } : {}),
    ...(intent === "cancel"
      ? {
          cancelledAt: now,
          cancellationReason:
            reason || appointment.cancellationReason || "Cancelado desde el panel",
        }
      : {}),
    ...(intent === "complete" ? { completedAt: now } : {}),
  };

  await prisma.$transaction([
    prisma.appointment.update({ where: { id: appointment.id }, data }),
    prisma.appointmentEvent.create({
      data: {
        businessId: membership.businessId,
        appointmentId: appointment.id,
        type: outcome.event,
        actorType: ActorType.STAFF,
        actorUserId: session.user.id,
        fromStatus: appointment.status,
        toStatus: outcome.status,
        note: intent === "cancel" ? reason || null : null,
      },
    }),
  ]);

  const dateKey = dateKeyInZone(appointment.startsAt, membership.business.timezone);

  revalidatePath("/admin");
  redirect(`/admin?fecha=${dateKey}&ok=${outcome.ok}`);
}
