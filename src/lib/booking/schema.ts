import { z } from "zod";

/**
 * Validación del paso 4. Mismas reglas que aplicará el Server Action en la
 * Etapa 3: si el formulario y el servidor no comparten esquema, aparecen dos
 * verdades distintas sobre qué es un email válido.
 */
export const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Escribí tu nombre.")
    .max(80, "Máximo 80 caracteres."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "El email es obligatorio.")
    .pipe(z.email("Revisá el email: falta el @ o el dominio.")),
  phone: z
    .string()
    .trim()
    .max(24, "Máximo 24 caracteres.")
    .refine(
      (value) => value === "" || /^[0-9+()\s-]{6,24}$/.test(value),
      "Solo números, espacios, paréntesis y +.",
    ),
  notes: z.string().trim().max(280, "Máximo 280 caracteres."),
  acceptPolicy: z
    .boolean()
    .refine((value) => value === true, "Necesitamos que aceptes la política de cancelación."),
});

export type CustomerInput = z.infer<typeof customerSchema>;

export type CustomerErrors = Partial<Record<keyof CustomerInput, string>>;

export const emptyCustomer: CustomerInput = {
  name: "",
  email: "",
  phone: "",
  notes: "",
  acceptPolicy: false,
};

export function validateCustomer(input: CustomerInput): {
  errors: CustomerErrors;
  data?: CustomerInput;
} {
  const result = customerSchema.safeParse(input);
  if (result.success) return { errors: {}, data: result.data };

  const errors: CustomerErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in errors)) {
      errors[field as keyof CustomerInput] = issue.message;
    }
  }
  return { errors };
}

/* ------------------------------------------------------------- confirmación */

export const bookingQuerySchema = z.object({
  code: z.string().regex(/^EN-[A-Z0-9]{4}$/),
  service: z.string().min(1),
  staff: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
});

export type BookingQuery = z.infer<typeof bookingQuerySchema>;

export function parseBookingQuery(
  params: Record<string, string | string[] | undefined>,
): BookingQuery | null {
  const raw = {
    code: params.code,
    service: params.service,
    staff: params.staff,
    date: params.date,
    time: params.time,
  };
  const result = bookingQuerySchema.safeParse(raw);
  return result.success ? result.data : null;
}

/** Fecha local a partir de `yyyy-MM-dd`, sin corrimiento por UTC. */
export function parseDateKey(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year ?? 2026, (month ?? 1) - 1, day ?? 1);
}
