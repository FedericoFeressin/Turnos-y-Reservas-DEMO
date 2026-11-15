"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Field, controlClass, textareaClass } from "@/components/ui/field";
import type { CustomerFormState, CustomerFormValues } from "@/lib/admin/schemas";
import { dateToDateKey } from "@/lib/date";
import { cn } from "@/lib/utils";

import { saveCustomerAction } from "./actions";

export type EditableCustomer = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string;
  birthDate: Date | null;
  notes: string | null;
  tags: string[];
  marketingOptIn: boolean;
  isBlocked: boolean;
};

const initialState: CustomerFormState = {
  error: null,
  fieldErrors: {},
  values: null,
};

function toValues(customer: EditableCustomer | null): CustomerFormValues {
  return {
    firstName: customer?.firstName ?? "",
    lastName: customer?.lastName ?? "",
    phone: customer?.phone ?? "",
    email: customer?.email ?? "",
    birthDate: customer?.birthDate ? dateToDateKey(customer.birthDate) : "",
    notes: customer?.notes ?? "",
    tags: customer?.tags.join(", ") ?? "",
    marketingOptIn: customer?.marketingOptIn ?? false,
    isBlocked: customer?.isBlocked ?? false,
  };
}

export function CustomerForm({
  customer,
}: {
  customer: EditableCustomer | null;
}) {
  const [state, formAction, pending] = useActionState(
    saveCustomerAction,
    initialState,
  );
  const values = state.values ?? toValues(customer);
  const errors = state.fieldErrors;

  return (
    <form action={formAction} className="mt-5 space-y-5" noValidate>
      {customer ? <input type="hidden" name="id" value={customer.id} /> : null}

      {state.error ? (
        <p
          role="alert"
          className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-[13px] text-danger"
        >
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" htmlFor="customer-first-name" error={errors.firstName}>
          <input
            id="customer-first-name"
            name="firstName"
            required
            defaultValue={values.firstName}
            aria-invalid={errors.firstName ? true : undefined}
            className={cn(controlClass, "h-10")}
            placeholder="Martín"
          />
        </Field>

        <Field label="Apellido" htmlFor="customer-last-name" error={errors.lastName}>
          <input
            id="customer-last-name"
            name="lastName"
            defaultValue={values.lastName}
            aria-invalid={errors.lastName ? true : undefined}
            className={cn(controlClass, "h-10")}
            placeholder="Paz"
          />
        </Field>

        <Field
          label="Teléfono"
          htmlFor="customer-phone"
          error={errors.phone}
          hint="Es el identificador del cliente: no puede repetirse en el negocio."
        >
          <input
            id="customer-phone"
            name="phone"
            required
            inputMode="tel"
            defaultValue={values.phone}
            aria-invalid={errors.phone ? true : undefined}
            className={cn(controlClass, "h-10")}
            placeholder="+54 11 5555 1234"
          />
        </Field>

        <Field label="Email" htmlFor="customer-email" error={errors.email}>
          <input
            id="customer-email"
            name="email"
            type="email"
            defaultValue={values.email}
            aria-invalid={errors.email ? true : undefined}
            className={cn(controlClass, "h-10")}
            placeholder="martin@example.com"
          />
        </Field>

        <Field
          label="Fecha de nacimiento"
          htmlFor="customer-birth-date"
          error={errors.birthDate}
          hint="Opcional. Se usa para saludos y promociones."
        >
          <input
            id="customer-birth-date"
            name="birthDate"
            type="date"
            defaultValue={values.birthDate}
            aria-invalid={errors.birthDate ? true : undefined}
            className={cn(controlClass, "h-10")}
          />
        </Field>

        <Field
          label="Etiquetas"
          htmlFor="customer-tags"
          error={errors.tags}
          hint="Separadas por comas: VIP, color, frecuente…"
        >
          <input
            id="customer-tags"
            name="tags"
            defaultValue={values.tags}
            aria-invalid={errors.tags ? true : undefined}
            className={cn(controlClass, "h-10")}
            placeholder="VIP, frecuente"
          />
        </Field>

        <Field
          label="Notas internas"
          htmlFor="customer-notes"
          error={errors.notes}
          className="sm:col-span-2"
        >
          <textarea
            id="customer-notes"
            name="notes"
            defaultValue={values.notes}
            aria-invalid={errors.notes ? true : undefined}
            className={textareaClass}
            placeholder="Preferencias, alergias, historial…"
          />
        </Field>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <label className="flex items-center gap-2 text-[13px] text-ink">
          <input
            type="checkbox"
            name="marketingOptIn"
            defaultChecked={values.marketingOptIn}
            className="size-4 accent-primary"
          />
          Acepta recibir promociones
        </label>
        <label className="flex items-center gap-2 text-[13px] text-ink">
          <input
            type="checkbox"
            name="isBlocked"
            defaultChecked={values.isBlocked}
            className="size-4 accent-primary"
          />
          Bloqueado para reservar
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Guardando…"
            : customer
              ? "Guardar cambios"
              : "Crear cliente"}
        </Button>
        <Link
          href="/admin/clientes"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
