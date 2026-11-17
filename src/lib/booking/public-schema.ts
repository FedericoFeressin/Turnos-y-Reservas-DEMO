import { z } from "zod";

import { isValidDateKey } from "@/lib/date";
import { fieldErrors, normalizePhone } from "@/lib/admin/schemas";

/**
 * Esquema compartido por el formulario y el Server Action de reserva pública.
 * El cliente no crea cuenta: el teléfono normalizado es su identidad.
 */
export const publicBookingSchema = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{2,60}$/, "Negocio no válido."),
  serviceId: z.string().trim().min(1, "Elegí un servicio."),
  employeeId: z.string().trim().min(1, "Elegí un profesional."),
  dateKey: z.string().trim().refine(isValidDateKey, "Elegí una fecha válida."),
  time: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Elegí un horario válido."),
  clientRequestId: z
    .string()
    .trim()
    .min(16, "Recargá la página e intentá de nuevo.")
    .max(80),
  firstName: z
    .string()
    .trim()
    .min(2, "Escribí tu nombre.")
    .max(60, "Máximo 60 caracteres."),
  lastName: z.string().trim().max(60, "Máximo 60 caracteres."),
  phone: z
    .string()
    .trim()
    .min(6, "Ingresá tu teléfono.")
    .max(24, "Máximo 24 caracteres.")
    .regex(/^[0-9+()\s-]+$/, "Solo números, espacios, paréntesis y +.")
    .refine(
      (value) => normalizePhone(value).replace(/\D/g, "").length >= 6,
      "El teléfono debe tener al menos 6 dígitos.",
    ),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(120, "Máximo 120 caracteres.")
    .refine(
      (value) => value === "" || z.email().safeParse(value).success,
      "Revisá el email.",
    ),
  notes: z.string().trim().max(280, "Máximo 280 caracteres."),
  acceptPolicy: z
    .boolean()
    .refine((value) => value === true, "Necesitamos que aceptes la política de cancelación."),
});

export type PublicBookingInput = z.output<typeof publicBookingSchema>;
export type PublicBookingFormValues = z.input<typeof publicBookingSchema>;

export type PublicBookingFormState = {
  error: string | null;
  fieldErrors: Partial<Record<keyof PublicBookingFormValues, string>>;
  values: PublicBookingFormValues | null;
};

export const emptyBookingState: PublicBookingFormState = {
  error: null,
  fieldErrors: {},
  values: null,
};

export function readPublicBookingForm(formData: FormData): PublicBookingFormValues {
  const text = (key: string) => String(formData.get(key) ?? "");

  return {
    slug: text("slug"),
    serviceId: text("serviceId"),
    employeeId: text("employeeId"),
    dateKey: text("dateKey"),
    time: text("time"),
    clientRequestId: text("clientRequestId"),
    firstName: text("firstName"),
    lastName: text("lastName"),
    phone: text("phone"),
    email: text("email"),
    notes: text("notes"),
    acceptPolicy: formData.get("acceptPolicy") === "on",
  };
}

export function bookingFieldErrors(error: z.ZodError) {
  return fieldErrors<PublicBookingFormValues>(error);
}
