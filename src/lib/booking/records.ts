import type { Prisma } from "@/generated/prisma/client";
import {
  ActorType,
  AppointmentEventType,
  NotificationChannel,
  NotificationStatus,
  type AppointmentStatus,
} from "@/generated/prisma/enums";

/**
 * Historial y outbox del motor de reservas.
 *
 * Todas las funciones reciben el cliente de una transacción: el turno, su
 * evento y la intención de notificación se escriben juntos o no se escriben.
 * No hay proveedor de email/SMS cableado: `Notification` es la persistencia de
 * la intención, lista para que un worker la consuma después.
 */

type Tx = Prisma.TransactionClient;

type NotificationInput = {
  businessId: string;
  appointmentId: string;
  template: string;
  email: string | null;
  phone: string | null;
  payload: Prisma.InputJsonValue;
};

function notificationTarget(email: string | null, phone: string | null) {
  if (email) {
    return { channel: NotificationChannel.EMAIL, recipient: email };
  }
  if (phone) {
    return { channel: NotificationChannel.SMS, recipient: phone };
  }
  return null;
}

async function enqueueNotification(
  tx: Tx,
  { businessId, appointmentId, template, email, phone, payload }: NotificationInput,
): Promise<void> {
  const target = notificationTarget(email, phone);
  if (!target) return;

  await tx.notification.create({
    data: {
      businessId,
      appointmentId,
      channel: target.channel,
      template,
      recipient: target.recipient,
      status: NotificationStatus.QUEUED,
      payload,
    },
  });
}

type NotificationTargetInput = Omit<NotificationInput, "template">;

type CreatedInput = NotificationTargetInput & {
  status: AppointmentStatus;
  note: string | null;
};

/** Evento `CREATED` y confirmación encolada al crear desde el sitio público. */
export async function recordBookingCreated(
  tx: Tx,
  { status, note, ...notification }: CreatedInput,
): Promise<void> {
  await tx.appointmentEvent.create({
    data: {
      businessId: notification.businessId,
      appointmentId: notification.appointmentId,
      type: AppointmentEventType.CREATED,
      actorType: ActorType.CUSTOMER,
      fromStatus: null,
      toStatus: status,
      note,
      metadata: { channel: "public" },
    },
  });

  await enqueueNotification(tx, {
    ...notification,
    template:
      status === "PENDING" ? "booking.requested" : "booking.confirmed",
  });
}

type CancelledInput = NotificationTargetInput & {
  fromStatus: AppointmentStatus;
  note: string | null;
};

/**
 * Evento `CANCELLED`, baja de las intenciones pendientes y aviso de baja.
 *
 * Las notificaciones `QUEUED` anteriores se cancelan para que un worker no
 * envíe "tu turno está confirmado" después de la cancelación.
 */
export async function recordBookingCancelled(
  tx: Tx,
  { fromStatus, note, ...notification }: CancelledInput,
): Promise<void> {
  await tx.appointmentEvent.create({
    data: {
      businessId: notification.businessId,
      appointmentId: notification.appointmentId,
      type: AppointmentEventType.CANCELLED,
      actorType: ActorType.CUSTOMER,
      fromStatus,
      toStatus: "CANCELLED",
      note: note || null,
      metadata: { channel: "public-link" },
    },
  });

  await tx.notification.updateMany({
    where: {
      businessId: notification.businessId,
      appointmentId: notification.appointmentId,
      status: NotificationStatus.QUEUED,
    },
    data: { status: NotificationStatus.CANCELLED },
  });

  await enqueueNotification(tx, {
    ...notification,
    template: "booking.cancelled",
  });
}
