import { z } from "zod";

/**
 * Esquemas de los formularios del panel.
 *
 * Los campos de texto llegan siempre como `string` desde `FormData`; los
 * numéricos se validan como texto y se transforman, así un campo vacío no se
 * convierte silenciosamente en `0`. El resultado (`z.output`) ya es el tipo que
 * consume Prisma y la entrada (`z.input`) es lo que se conserva en pantalla si
 * hay errores.
 */

const phonePattern = /^[0-9+()\s-]{6,24}$/;

function minutesField(label: string, min: number, max: number) {
  return z
    .string()
    .trim()
    .min(1, `Ingresá ${label}.`)
    .regex(/^\d+$/, "Usá minutos enteros.")
    .transform(Number)
    .pipe(
      z
        .number()
        .int()
        .min(min, `El mínimo es ${min} minutos.`)
        .max(max, `El máximo es ${max} minutos.`),
    );
}

export const serviceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre es obligatorio.")
    .max(80, "Máximo 80 caracteres."),
  category: z.string().trim().max(60, "Máximo 60 caracteres."),
  description: z.string().trim().max(600, "Máximo 600 caracteres."),
  price: z
    .string()
    .trim()
    .min(1, "Ingresá un precio.")
    .regex(/^\d+(?:[.,]\d{1,2})?$/, "Usá un número, por ejemplo 9500.")
    .transform((value) => Number(value.replace(",", ".")))
    .pipe(
      z
        .number()
        .min(0, "El precio no puede ser negativo.")
        .max(10_000_000, "El precio es demasiado alto."),
    ),
  durationMinutes: minutesField("la duración", 5, 600),
  bufferAfterMinutes: minutesField("el margen", 0, 240),
  isActive: z.boolean(),
  isPublic: z.boolean(),
});

export const employeeSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio.")
    .max(60, "Máximo 60 caracteres."),
  lastName: z
    .string()
    .trim()
    .min(1, "El apellido es obligatorio.")
    .max(60, "Máximo 60 caracteres."),
  displayName: z.string().trim().max(80, "Máximo 80 caracteres."),
  title: z.string().trim().max(80, "Máximo 80 caracteres."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(120, "Máximo 120 caracteres.")
    .refine(
      (value) => value === "" || z.email().safeParse(value).success,
      "Revisá el email.",
    ),
  phone: z
    .string()
    .trim()
    .max(24, "Máximo 24 caracteres.")
    .refine(
      (value) => value === "" || phonePattern.test(value),
      "Solo números, espacios, paréntesis y +.",
    ),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Elegí un color válido.")
    .transform((value) => value.toLowerCase()),
  isBookable: z.boolean(),
  isActive: z.boolean(),
  serviceIds: z.array(z.string().min(1)),
});

function isValidDateInput(value: string): boolean {
  if (value === "") return true;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value &&
    date <= new Date()
  );
}

export const customerSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio.")
    .max(60, "Máximo 60 caracteres."),
  lastName: z.string().trim().max(60, "Máximo 60 caracteres."),
  phone: z
    .string()
    .trim()
    .min(6, "Ingresá un teléfono.")
    .max(24, "Máximo 24 caracteres.")
    .regex(/^[0-9+()\s-]+$/, "Solo números, espacios, paréntesis y +.")
    .refine(
      (value) => value.replace(/\D/g, "").length >= 6,
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
  birthDate: z
    .string()
    .trim()
    .regex(/^$|^\d{4}-\d{2}-\d{2}$/, "Usá el formato aaaa-mm-dd.")
    .refine(isValidDateInput, "Esa fecha no es válida."),
  notes: z.string().trim().max(600, "Máximo 600 caracteres."),
  tags: z
    .string()
    .trim()
    .max(200, "Máximo 200 caracteres.")
    .refine(
      (value) =>
        value
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
          .every((tag) => tag.length <= 24),
      "Cada etiqueta puede tener hasta 24 caracteres.",
    ),
  marketingOptIn: z.boolean(),
  isBlocked: z.boolean(),
});

/** Teléfono comparable: solo dígitos con prefijo `+`. */
export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

const dateKeyPattern = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateKeyInput(value: string): boolean {
  if (!dateKeyPattern.test(value)) return false;
  return !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
}

/** Una franja del horario semanal de un profesional. */
export const scheduleSchema = z
  .object({
    employeeId: z.string().trim().min(1, "Elegí un profesional."),
    dayOfWeek: z
      .string()
      .regex(/^[1-7]$/, "Elegí un día de la semana.")
      .transform(Number),
    start: z.string().trim().regex(timePattern, "Usá un horario válido (HH:mm)."),
    end: z.string().trim().regex(timePattern, "Usá un horario válido (HH:mm)."),
  })
  .refine((value) => timeToMinutes(value.end) > timeToMinutes(value.start), {
    message: "El horario de fin debe ser posterior al de inicio.",
    path: ["end"],
  });

/** Ausencia puntual o cierre; `employeeId` vacío = todo el negocio. */
export const timeOffSchema = z
  .object({
    employeeId: z.string().trim(),
    type: z.enum(["VACATION", "SICK", "PERSONAL", "TRAINING", "CLOSURE"]),
    startDate: z
      .string()
      .trim()
      .refine(isValidDateKeyInput, "Elegí una fecha de inicio válida."),
    endDate: z
      .string()
      .trim()
      .refine(isValidDateKeyInput, "Elegí una fecha de fin válida."),
    reason: z.string().trim().max(300, "Máximo 300 caracteres."),
  })
  .refine((value) => value.endDate >= value.startDate, {
    message: "La fecha de fin no puede ser anterior a la de inicio.",
    path: ["endDate"],
  });

export type ScheduleInput = z.output<typeof scheduleSchema>;
export type ScheduleFormValues = z.input<typeof scheduleSchema>;
export type TimeOffInput = z.output<typeof timeOffSchema>;
export type TimeOffFormValues = z.input<typeof timeOffSchema>;

export type ServiceInput = z.output<typeof serviceSchema>;
export type ServiceFormValues = z.input<typeof serviceSchema>;
export type EmployeeInput = z.output<typeof employeeSchema>;
export type EmployeeFormValues = z.input<typeof employeeSchema>;
export type CustomerInput = z.output<typeof customerSchema>;
export type CustomerFormValues = z.input<typeof customerSchema>;

export type ServiceFieldErrors = Partial<Record<keyof ServiceFormValues, string>>;
export type EmployeeFieldErrors = Partial<Record<keyof EmployeeFormValues, string>>;
export type CustomerFieldErrors = Partial<Record<keyof CustomerFormValues, string>>;

export type ServiceFormState = {
  error: string | null;
  fieldErrors: ServiceFieldErrors;
  values: ServiceFormValues | null;
};

export type EmployeeFormState = {
  error: string | null;
  fieldErrors: EmployeeFieldErrors;
  values: EmployeeFormValues | null;
};

export type CustomerFormState = {
  error: string | null;
  fieldErrors: CustomerFieldErrors;
  values: CustomerFormValues | null;
};

/** Conserva el primer error por campo, que es el que se muestra. */
export function fieldErrors<TValues>(
  error: z.ZodError,
): Partial<Record<keyof TValues & string, string>> {
  const errors: Partial<Record<keyof TValues & string, string>> = {};

  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in errors)) {
      errors[key as keyof TValues & string] = issue.message;
    }
  }

  return errors;
}

/* --------------------------------------------------------------- lectura */

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "");
}

function checked(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

export function readServiceForm(formData: FormData): ServiceFormValues {
  return {
    name: text(formData, "name"),
    category: text(formData, "category"),
    description: text(formData, "description"),
    price: text(formData, "price"),
    durationMinutes: text(formData, "durationMinutes"),
    bufferAfterMinutes: text(formData, "bufferAfterMinutes"),
    isActive: checked(formData, "isActive"),
    isPublic: checked(formData, "isPublic"),
  };
}

export function readEmployeeForm(formData: FormData): EmployeeFormValues {
  return {
    firstName: text(formData, "firstName"),
    lastName: text(formData, "lastName"),
    displayName: text(formData, "displayName"),
    title: text(formData, "title"),
    email: text(formData, "email"),
    phone: text(formData, "phone"),
    color: text(formData, "color") || "#64748B",
    isBookable: checked(formData, "isBookable"),
    isActive: checked(formData, "isActive"),
    serviceIds: formData
      .getAll("serviceIds")
      .map((value) => String(value))
      .filter(Boolean),
  };
}

export function readCustomerForm(formData: FormData): CustomerFormValues {
  return {
    firstName: text(formData, "firstName"),
    lastName: text(formData, "lastName"),
    phone: text(formData, "phone"),
    email: text(formData, "email"),
    birthDate: text(formData, "birthDate"),
    notes: text(formData, "notes"),
    tags: text(formData, "tags"),
    marketingOptIn: checked(formData, "marketingOptIn"),
    isBlocked: checked(formData, "isBlocked"),
  };
}

export function readScheduleForm(formData: FormData): ScheduleFormValues {
  return {
    employeeId: text(formData, "employeeId"),
    dayOfWeek: text(formData, "dayOfWeek"),
    start: text(formData, "start"),
    end: text(formData, "end"),
  };
}

export function readTimeOffForm(formData: FormData): TimeOffFormValues {
  return {
    employeeId: text(formData, "employeeId"),
    type: text(formData, "type") as TimeOffFormValues["type"],
    startDate: text(formData, "startDate"),
    endDate: text(formData, "endDate"),
    reason: text(formData, "reason"),
  };
}

/* ------------------------------------------------------- configuración */

function optionalPhone(label: string) {
  return z
    .string()
    .trim()
    .refine(
      (value) => value === "" || phonePattern.test(value),
      `Revisá ${label}.`,
    );
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/** Datos públicos y operativos del negocio. */
export const businessProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre es obligatorio.")
    .max(80, "Máximo 80 caracteres."),
  legalName: z.string().trim().max(120, "Máximo 120 caracteres."),
  taxId: z.string().trim().max(30, "Máximo 30 caracteres."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(120, "Máximo 120 caracteres.")
    .refine(
      (value) => value === "" || z.email().safeParse(value).success,
      "Revisá el email.",
    ),
  phone: optionalPhone("el teléfono"),
  whatsapp: optionalPhone("el WhatsApp"),
  instagram: z
    .string()
    .trim()
    .max(60, "Máximo 60 caracteres.")
    .transform((value) => value.replace(/^@+/, "").trim())
    .refine(
      (value) => value === "" || /^[A-Za-z0-9._]{1,30}$/.test(value),
      "Usá solo letras, números, puntos y guiones bajos.",
    ),
  website: z
    .string()
    .trim()
    .max(200, "Máximo 200 caracteres.")
    .transform((value) =>
      value && !/^https?:\/\//i.test(value) ? `https://${value}` : value,
    )
    .refine(
      (value) => value === "" || isValidUrl(value),
      "Revisá la dirección web.",
    ),
  addressLine: z.string().trim().max(120, "Máximo 120 caracteres."),
  city: z.string().trim().max(80, "Máximo 80 caracteres."),
  province: z.string().trim().max(80, "Máximo 80 caracteres."),
  postalCode: z.string().trim().max(12, "Máximo 12 caracteres."),
  country: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, "Usá el código de dos letras del país."),
  timezone: z
    .string()
    .trim()
    .min(1, "Elegí una zona horaria.")
    .refine(isValidTimezone, "Esa zona horaria no es válida."),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Usá el código de tres letras de la moneda."),
});

/** Horario general de atención: franja semanal del negocio. */
export const businessScheduleSchema = z
  .object({
    dayOfWeek: z
      .string()
      .regex(/^[1-7]$/, "Elegí un día de la semana.")
      .transform(Number),
    start: z.string().trim().regex(timePattern, "Usá un horario válido (HH:mm)."),
    end: z.string().trim().regex(timePattern, "Usá un horario válido (HH:mm)."),
  })
  .refine((value) => timeToMinutes(value.end) > timeToMinutes(value.start), {
    message: "El horario de fin debe ser posterior al de inicio.",
    path: ["end"],
  });

/** Feriado o cierre puntual del negocio. */
export const holidaySchema = z.object({
  date: z
    .string()
    .trim()
    .refine(isValidDateKeyInput, "Elegí una fecha válida."),
  name: z
    .string()
    .trim()
    .min(2, "El nombre es obligatorio.")
    .max(80, "Máximo 80 caracteres."),
  isClosed: z.boolean(),
  notes: z.string().trim().max(300, "Máximo 300 caracteres."),
});

export type BusinessProfileInput = z.output<typeof businessProfileSchema>;
export type BusinessProfileFormValues = z.input<typeof businessProfileSchema>;
export type BusinessScheduleFormValues = z.input<typeof businessScheduleSchema>;
export type HolidayFormValues = z.input<typeof holidaySchema>;

export type BusinessProfileFieldErrors = Partial<
  Record<keyof BusinessProfileFormValues, string>
>;

export type BusinessProfileFormState = {
  error: string | null;
  fieldErrors: BusinessProfileFieldErrors;
  values: BusinessProfileFormValues | null;
};

export function readBusinessForm(formData: FormData): BusinessProfileFormValues {
  return {
    name: text(formData, "name"),
    legalName: text(formData, "legalName"),
    taxId: text(formData, "taxId"),
    email: text(formData, "email"),
    phone: text(formData, "phone"),
    whatsapp: text(formData, "whatsapp"),
    instagram: text(formData, "instagram"),
    website: text(formData, "website"),
    addressLine: text(formData, "addressLine"),
    city: text(formData, "city"),
    province: text(formData, "province"),
    postalCode: text(formData, "postalCode"),
    country: text(formData, "country"),
    timezone: text(formData, "timezone"),
    currency: text(formData, "currency"),
  };
}

export function readBusinessScheduleForm(
  formData: FormData,
): BusinessScheduleFormValues {
  return {
    dayOfWeek: text(formData, "dayOfWeek"),
    start: text(formData, "start"),
    end: text(formData, "end"),
  };
}

export function readHolidayForm(formData: FormData): HolidayFormValues {
  return {
    date: text(formData, "date"),
    name: text(formData, "name"),
    isClosed: checked(formData, "isClosed"),
    notes: text(formData, "notes"),
  };
}
