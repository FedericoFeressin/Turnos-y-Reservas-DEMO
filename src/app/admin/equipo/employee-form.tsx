"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Field, controlClass } from "@/components/ui/field";
import type { EmployeeFormState, EmployeeFormValues } from "@/lib/admin/schemas";
import { cn } from "@/lib/utils";

import { saveEmployeeAction } from "./actions";

type EditableEmployee = {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  color: string;
  isActive: boolean;
  isBookable: boolean;
  services: { serviceId: string }[];
};

type ServiceOption = {
  id: string;
  name: string;
  isActive: boolean;
};

const initialState: EmployeeFormState = {
  error: null,
  fieldErrors: {},
  values: null,
};

function toValues(employee: EditableEmployee | null): EmployeeFormValues {
  return {
    firstName: employee?.firstName ?? "",
    lastName: employee?.lastName ?? "",
    displayName: employee?.displayName ?? "",
    title: employee?.title ?? "",
    email: employee?.email ?? "",
    phone: employee?.phone ?? "",
    color: employee?.color ?? "#2F5D50",
    isBookable: employee?.isBookable ?? true,
    isActive: employee?.isActive ?? true,
    serviceIds: employee?.services.map((item) => item.serviceId) ?? [],
  };
}

export function EmployeeForm({
  employee,
  services,
}: {
  employee: EditableEmployee | null;
  services: ServiceOption[];
}) {
  const [state, formAction, pending] = useActionState(
    saveEmployeeAction,
    initialState,
  );
  const values = state.values ?? toValues(employee);
  const errors = state.fieldErrors;
  const selected = new Set(values.serviceIds);

  return (
    <form action={formAction} className="mt-5 space-y-5" noValidate>
      {employee ? <input type="hidden" name="id" value={employee.id} /> : null}

      {state.error ? (
        <p
          role="alert"
          className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-[13px] text-danger"
        >
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" htmlFor="employee-first-name" error={errors.firstName}>
          <input
            id="employee-first-name"
            name="firstName"
            required
            defaultValue={values.firstName}
            aria-invalid={errors.firstName ? true : undefined}
            className={cn(controlClass, "h-10")}
            placeholder="Sofía"
          />
        </Field>

        <Field label="Apellido" htmlFor="employee-last-name" error={errors.lastName}>
          <input
            id="employee-last-name"
            name="lastName"
            required
            defaultValue={values.lastName}
            aria-invalid={errors.lastName ? true : undefined}
            className={cn(controlClass, "h-10")}
            placeholder="Ríos"
          />
        </Field>

        <Field
          label="Nombre visible"
          htmlFor="employee-display-name"
          error={errors.displayName}
          hint="Cómo aparece en la reserva. Si lo dejás vacío se usa nombre y apellido."
        >
          <input
            id="employee-display-name"
            name="displayName"
            defaultValue={values.displayName}
            aria-invalid={errors.displayName ? true : undefined}
            className={cn(controlClass, "h-10")}
            placeholder="Sofía Ríos"
          />
        </Field>

        <Field label="Puesto" htmlFor="employee-title" error={errors.title}>
          <input
            id="employee-title"
            name="title"
            defaultValue={values.title}
            aria-invalid={errors.title ? true : undefined}
            className={cn(controlClass, "h-10")}
            placeholder="Barbera · Color"
          />
        </Field>

        <Field label="Email" htmlFor="employee-email" error={errors.email}>
          <input
            id="employee-email"
            name="email"
            type="email"
            defaultValue={values.email}
            aria-invalid={errors.email ? true : undefined}
            className={cn(controlClass, "h-10")}
            placeholder="sofia@estudionorte.com.ar"
          />
        </Field>

        <Field label="Teléfono" htmlFor="employee-phone" error={errors.phone}>
          <input
            id="employee-phone"
            name="phone"
            defaultValue={values.phone}
            aria-invalid={errors.phone ? true : undefined}
            className={cn(controlClass, "h-10")}
            placeholder="+54 11 5555 5555"
          />
        </Field>

        <Field
          label="Color en la agenda"
          htmlFor="employee-color"
          error={errors.color}
          hint="Identifica al profesional en el calendario."
        >
          <div className="flex items-center gap-2">
            <input
              id="employee-color"
              name="color"
              type="color"
              defaultValue={values.color}
              aria-invalid={errors.color ? true : undefined}
              className="h-10 w-14 cursor-pointer rounded-md border border-line bg-surface p-1"
            />
            <span className="font-mono text-[12px] text-ink-muted">{values.color}</span>
          </div>
        </Field>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-[13px] font-medium text-ink">
          Servicios que puede realizar
        </legend>
        {services.length === 0 ? (
          <p className="text-[12px] text-ink-muted">
            Todavía no hay servicios. Creá uno en{" "}
            <Link
              href="/admin/servicios?editar=nuevo"
              className="text-ink underline decoration-line underline-offset-4"
            >
              Servicios
            </Link>
            .
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {services.map((service) => (
              <label
                key={service.id}
                className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-[13px] text-ink"
              >
                <input
                  type="checkbox"
                  name="serviceIds"
                  value={service.id}
                  defaultChecked={selected.has(service.id)}
                  className="size-4 accent-primary"
                />
                {service.name}
                {!service.isActive ? (
                  <span className="text-[11px] text-ink-muted">(inactivo)</span>
                ) : null}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <label className="flex items-center gap-2 text-[13px] text-ink">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={values.isActive}
            className="size-4 accent-primary"
          />
          Activo
        </label>
        <label className="flex items-center gap-2 text-[13px] text-ink">
          <input
            type="checkbox"
            name="isBookable"
            defaultChecked={values.isBookable}
            className="size-4 accent-primary"
          />
          Recibe turnos
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Guardando…"
            : employee
              ? "Guardar cambios"
              : "Agregar profesional"}
        </Button>
        <Link
          href="/admin/equipo"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
