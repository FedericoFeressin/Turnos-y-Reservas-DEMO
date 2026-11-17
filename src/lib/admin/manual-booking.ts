import { z } from "zod";

import { AppointmentSource } from "@/generated/prisma/enums";
import { fieldErrors, normalizePhone } from "@/lib/admin/schemas";
import type { BookingSettings } from "@/lib/booking/availability";
import { isValidDateKey } from "@/lib/date";

/**
 * Esquema del alta manual de turnos.
 *
 * Un turno creado por el panel siempre nace confirmado: quien lo carga es
 * personal del negocio. La fuente queda registrada para saber si llegó por
 * teléfono, WhatsApp o mostrador.
 */
export const manualBookingSchema = z
  .object({
    serviceId: z.string().trim().min(1, "Elegí un servicio."),
    employeeId: z.string().trim().min(1, "Elegí un profesional."),
    dateKey: z.string().trim().refine(isValidDateKey, "Elegí una fecha válida."),
    time: z
      .string()
      .trim()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Elegí un horario válido."),
    customerMode: z.enum(["existing", "new"]),
    customerId: z.string().trim(),
    firstName: z.string().trim().max(60, "Máximo 60 caracteres."),
    lastName: z.string().trim().max(60, "Máximo 60 caracteres."),
    phone: z
      .string()
      .trim()
      .max(24, "Máximo 24 caracteres.")
      .regex(/^[0-9+()\s-]*$/, "Solo números, espacios, paréntesis y +."),
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
    source: z.nativeEnum(AppointmentSource).refine(
      (value) =>
        value === AppointmentSource.ADMIN ||
        value === AppointmentSource.PHONE ||
        value === AppointmentSource.WHATSAPP ||
        value === AppointmentSource.WALK_IN,
      "Elegí un origen válido.",
    ),
    clientRequestId: z
      .string()
      .trim()
      .min(16, "Recargá la página e intentá de nuevo.")
      .max(80),
  })
  .superRefine((value, ctx) => {
    if (value.customerMode === "existing" && !value.customerId) {
      ctx.addIssue({
        code: "custom",
        path: ["customerId"],
        message: "Elegí un cliente.",
      });
    }

    if (value.customerMode === "new") {
      if (value.firstName.length < 2) {
        ctx.addIssue({
          code: "custom",
          path: ["firstName"],
          message: "Escribí el nombre del cliente.",
        });
      }
      if (normalizePhone(value.phone).replace(/\D/g, "").length < 6) {
        ctx.addIssue({
          code: "custom",
          path: ["phone"],
          message: "Ingresá un teléfono con al menos 6 dígitos.",
        });
      }
    }
  });

export type ManualBookingInput = z.output<typeof manualBookingSchema>;
export type ManualBookingFormValues = z.input<typeof manualBookingSchema>;

export type ManualBookingFormState = {
  error: string | null;
  fieldErrors: Partial<Record<keyof ManualBookingFormValues, string>>;
  values: ManualBookingFormValues | null;
};

export const emptyManualBookingState: ManualBookingFormState = {
  error: null,
  fieldErrors: {},
  values: null,
};

export function readManualBookingForm(
  formData: FormData,
): ManualBookingFormValues {
  const text = (key: string) => String(formData.get(key) ?? "");

  return {
    serviceId: text("serviceId"),
    employeeId: text("employeeId"),
    dateKey: text("dateKey"),
    time: text("time"),
    customerMode: text("customerMode") as ManualBookingFormValues["customerMode"],
    customerId: text("customerId"),
    firstName: text("firstName"),
    lastName: text("lastName"),
    phone: text("phone"),
    email: text("email"),
    notes: text("notes"),
    source: text("source") as ManualBookingFormValues["source"],
    clientRequestId: text("clientRequestId"),
  };
}

export function manualBookingFieldErrors(error: z.ZodError) {
  return fieldErrors<ManualBookingFormValues>(error);
}

type RawSettings = {
  slotGranularityMinutes: number;
  maxAdvanceDays: number;
  allowChooseAnyStaff: boolean;
  showStaffSelection: boolean;
  showPrices: boolean;
  requireManualConfirmation: boolean;
  bookingPolicyText: string | null;
  cancellationPolicyText: string | null;
};

/**
 * La disponibilidad pública aplica anticipación mínima y confirmación manual.
 * El panel necesita las mismas reglas de horario, feriados, ausencias y
 * solapamiento, pero puede agendar para hoy mismo y siempre confirma el turno.
 */
export function manualBookingSettings(settings: RawSettings | null): BookingSettings {
  return {
    slotGranularityMinutes: settings?.slotGranularityMinutes ?? 15,
    minAdvanceMinutes: 0,
    maxAdvanceDays: settings?.maxAdvanceDays ?? 60,
    allowChooseAnyStaff: settings?.allowChooseAnyStaff ?? true,
    showStaffSelection: settings?.showStaffSelection ?? true,
    showPrices: settings?.showPrices ?? true,
    requireManualConfirmation: false,
    bookingPolicyText: settings?.bookingPolicyText ?? null,
    cancellationPolicyText: settings?.cancellationPolicyText ?? null,
  };
}
