import { z } from "zod";

import {
  AppointmentEventType,
  AppointmentStatus,
} from "@/generated/prisma/enums";

/**
 * Reglas de las acciones de turno del panel.
 *
 * Las transiciones están acá, cerca de los esquemas, para que la UI y el
 * Server Action usen exactamente la misma lista. La UI solo muestra lo que la
 * acción acepta; omitir un botón nunca reemplaza la validación en servidor.
 */
export const appointmentIntents = [
  "confirm",
  "cancel",
  "complete",
  "no_show",
] as const;

export type AppointmentIntent = (typeof appointmentIntents)[number];

export const allowedTransitions: Record<AppointmentStatus, AppointmentIntent[]> = {
  PENDING: ["confirm", "cancel"],
  CONFIRMED: ["complete", "cancel", "no_show"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

type Outcome = {
  status: AppointmentStatus;
  event: AppointmentEventType;
  ok: string;
};

export const intentOutcome: Record<AppointmentIntent, Outcome> = {
  confirm: {
    status: AppointmentStatus.CONFIRMED,
    event: AppointmentEventType.CONFIRMED,
    ok: "confirmado",
  },
  cancel: {
    status: AppointmentStatus.CANCELLED,
    event: AppointmentEventType.CANCELLED,
    ok: "cancelado",
  },
  complete: {
    status: AppointmentStatus.COMPLETED,
    event: AppointmentEventType.COMPLETED,
    ok: "completado",
  },
  no_show: {
    status: AppointmentStatus.NO_SHOW,
    event: AppointmentEventType.NO_SHOW,
    ok: "ausente",
  },
};

export const appointmentActionSchema = z.object({
  id: z.string().trim().min(1),
  intent: z.enum(appointmentIntents),
  reason: z.string().trim().max(200, "Máximo 200 caracteres."),
});

export type AppointmentActionInput = z.output<typeof appointmentActionSchema>;

export function readAppointmentActionForm(
  formData: FormData,
): z.input<typeof appointmentActionSchema> {
  // El valor llega como texto; el cast solo tipa la entrada. Zod sigue siendo
  // quien decide si el intent es válido.
  const intent = String(formData.get("intent") ?? "") as z.input<
    typeof appointmentActionSchema
  >["intent"];

  return {
    id: String(formData.get("id") ?? ""),
    intent,
    reason: String(formData.get("reason") ?? ""),
  };
}
