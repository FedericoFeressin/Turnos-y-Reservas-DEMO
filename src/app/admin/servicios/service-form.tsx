"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Field, controlClass, textareaClass } from "@/components/ui/field";
import type { ServiceFormState, ServiceFormValues } from "@/lib/admin/schemas";
import { cn } from "@/lib/utils";

import { saveServiceAction } from "./actions";

type EditableService = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  priceCents: number;
  durationMinutes: number;
  bufferAfterMinutes: number;
  isActive: boolean;
  isPublic: boolean;
};

const initialState: ServiceFormState = {
  error: null,
  fieldErrors: {},
  values: null,
};

function toValues(service: EditableService | null): ServiceFormValues {
  return {
    name: service?.name ?? "",
    category: service?.category ?? "",
    description: service?.description ?? "",
    price: service ? String(service.priceCents / 100) : "",
    durationMinutes: service ? String(service.durationMinutes) : "30",
    bufferAfterMinutes: service ? String(service.bufferAfterMinutes) : "5",
    isActive: service?.isActive ?? true,
    isPublic: service?.isPublic ?? true,
  };
}

export function ServiceForm({ service }: { service: EditableService | null }) {
  const [state, formAction, pending] = useActionState(
    saveServiceAction,
    initialState,
  );
  const values = state.values ?? toValues(service);
  const errors = state.fieldErrors;

  return (
    <form action={formAction} className="mt-5 space-y-5" noValidate>
      {service ? <input type="hidden" name="id" value={service.id} /> : null}

      {state.error ? (
        <p
          role="alert"
          className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-[13px] text-danger"
        >
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Nombre"
          htmlFor="service-name"
          error={errors.name}
          className="sm:col-span-2"
        >
          <input
            id="service-name"
            name="name"
            required
            defaultValue={values.name}
            aria-invalid={errors.name ? true : undefined}
            className={cn(controlClass, "h-10")}
            placeholder="Corte + barba"
          />
        </Field>

        <Field label="Categoría" htmlFor="service-category" error={errors.category}>
          <input
            id="service-category"
            name="category"
            defaultValue={values.category}
            aria-invalid={errors.category ? true : undefined}
            className={cn(controlClass, "h-10")}
            placeholder="Corte, color, barba…"
          />
        </Field>

        <Field
          label="Precio (ARS)"
          htmlFor="service-price"
          error={errors.price}
          hint="Se guarda en centavos; podés usar decimales."
        >
          <input
            id="service-price"
            name="price"
            required
            inputMode="decimal"
            defaultValue={values.price}
            aria-invalid={errors.price ? true : undefined}
            className={cn(controlClass, "h-10")}
            placeholder="9500"
          />
        </Field>

        <Field
          label="Duración (min)"
          htmlFor="service-duration"
          error={errors.durationMinutes}
        >
          <input
            id="service-duration"
            name="durationMinutes"
            required
            inputMode="numeric"
            defaultValue={values.durationMinutes}
            aria-invalid={errors.durationMinutes ? true : undefined}
            className={cn(controlClass, "h-10")}
            placeholder="30"
          />
        </Field>

        <Field
          label="Margen después (min)"
          htmlFor="service-buffer"
          error={errors.bufferAfterMinutes}
          hint="Limpieza o preparación que también se bloquea."
        >
          <input
            id="service-buffer"
            name="bufferAfterMinutes"
            required
            inputMode="numeric"
            defaultValue={values.bufferAfterMinutes}
            aria-invalid={errors.bufferAfterMinutes ? true : undefined}
            className={cn(controlClass, "h-10")}
            placeholder="5"
          />
        </Field>

        <Field
          label="Descripción"
          htmlFor="service-description"
          error={errors.description}
          className="sm:col-span-2"
        >
          <textarea
            id="service-description"
            name="description"
            defaultValue={values.description}
            aria-invalid={errors.description ? true : undefined}
            className={textareaClass}
            placeholder="Qué incluye el servicio."
          />
        </Field>
      </div>

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
            name="isPublic"
            defaultChecked={values.isPublic}
            className="size-4 accent-primary"
          />
          Visible en la reserva pública
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Guardando…"
            : service
              ? "Guardar cambios"
              : "Crear servicio"}
        </Button>
        <Link
          href="/admin/servicios"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
