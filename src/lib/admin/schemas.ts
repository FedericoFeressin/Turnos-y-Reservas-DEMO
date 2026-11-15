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

export type ServiceInput = z.output<typeof serviceSchema>;
export type ServiceFormValues = z.input<typeof serviceSchema>;
export type EmployeeInput = z.output<typeof employeeSchema>;
export type EmployeeFormValues = z.input<typeof employeeSchema>;

export type ServiceFieldErrors = Partial<Record<keyof ServiceFormValues, string>>;
export type EmployeeFieldErrors = Partial<Record<keyof EmployeeFormValues, string>>;

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
