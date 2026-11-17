import { z } from "zod";

import type { AppointmentStatus } from "@/generated/prisma/enums";

/**
 * Reglas compartidas entre la pantalla pública de cancelación y su action.
 *
 * Ocultar el botón nunca reemplaza la validación en servidor: las dos usan
 * `canCancelAppointment` con la ventana configurada del negocio.
 */

export const cancellationSchema = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{2,60}$/, "Negocio no válido."),
  token: z.string().trim().min(20, "El enlace de cancelación no es válido."),
  reason: z.string().trim().max(200, "Máximo 200 caracteres."),
});

export type CancellationInput = z.output<typeof cancellationSchema>;

export type CancellationFormState = {
  error: string | null;
};

export const emptyCancellationState: CancellationFormState = { error: null };

export function readCancellationForm(formData: FormData): z.input<typeof cancellationSchema> {
  return {
    slug: String(formData.get("slug") ?? ""),
    token: String(formData.get("token") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  };
}

/** Último momento en que el cliente puede cancelar desde el enlace. */
export function cancellationDeadline(
  startsAt: Date,
  windowMinutes: number,
): Date {
  const minutes = Math.max(0, windowMinutes);
  return new Date(startsAt.getTime() - minutes * 60_000);
}

export function canCancelAppointment({
  status,
  startsAt,
  windowMinutes,
  now = new Date(),
}: {
  status: AppointmentStatus;
  startsAt: Date;
  windowMinutes: number;
  now?: Date;
}): boolean {
  if (status !== "PENDING" && status !== "CONFIRMED") return false;

  const deadline = cancellationDeadline(startsAt, windowMinutes);
  return now.getTime() < deadline.getTime() && now.getTime() < startsAt.getTime();
}
