"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, controlClass, textareaClass } from "@/components/ui/field";
import type { ManualBookingFormState } from "@/lib/admin/manual-booking";
import type { Slot } from "@/lib/booking/availability";
import { cn } from "@/lib/utils";

import { createManualAppointmentAction } from "./actions";

const initialState: ManualBookingFormState = {
  error: null,
  fieldErrors: {},
  values: null,
};

type Props = {
  serviceId: string;
  employeeId: string;
  dateKey: string;
  clientRequestId: string;
  slotGroups: { label: string; slots: Slot[] }[];
  customers: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  }[];
};

export function ManualBookingForm({
  serviceId,
  employeeId,
  dateKey,
  clientRequestId,
  slotGroups,
  customers,
}: Props) {
  const [state, formAction, pending] = useActionState(
    createManualAppointmentAction,
    initialState,
  );
  const values = state.values;
  // El estado local se mantiene entre envíos: si el action devuelve errores,
  // la opción elegida por el usuario sigue siendo la misma.
  const [mode, setMode] = useState<"existing" | "new">("existing");

  return (
    <form action={formAction} className="pt-5">
      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="employeeId" value={employeeId} />
      <input type="hidden" name="dateKey" value={dateKey} />
      <input type="hidden" name="clientRequestId" value={clientRequestId} />

      <fieldset>
        <legend className="text-[13px] font-medium">Horario</legend>
        {slotGroups.map((group) => (
          <div key={group.label} className="mt-3">
            <p className="text-[11px] font-medium tracking-[0.14em] text-ink-muted uppercase">
              {group.label}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {group.slots.map((slot) => (
                <label key={slot.time} className="cursor-pointer">
                  <input
                    type="radio"
                    name="time"
                    value={slot.time}
                    defaultChecked={values?.time === slot.time}
                    className="peer sr-only"
                  />
                  <span className="inline-flex h-9 items-center rounded-md border border-line px-3 text-[12px] tabular-nums transition-colors peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary">
                    {slot.time}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
        {state.fieldErrors.time ? (
          <p className="mt-2 text-[11px] text-danger">{state.fieldErrors.time}</p>
        ) : null}
      </fieldset>

      <fieldset className="mt-6 border-t border-line pt-5">
        <legend className="text-[13px] font-medium">Cliente</legend>
        <div className="mt-3 flex flex-wrap gap-5">
          <label className="flex items-center gap-2 text-[12px]">
            <input
              type="radio"
              name="customerMode"
              value="existing"
              checked={mode === "existing"}
              onChange={() => setMode("existing")}
              className="accent-primary"
            />
            Cliente existente
          </label>
          <label className="flex items-center gap-2 text-[12px]">
            <input
              type="radio"
              name="customerMode"
              value="new"
              checked={mode === "new"}
              onChange={() => setMode("new")}
              className="accent-primary"
            />
            Nuevo cliente
          </label>
        </div>

        {mode === "existing" ? (
          <Field
            label="Cliente"
            htmlFor="customerId"
            error={state.fieldErrors.customerId}
            className="mt-4"
          >
            <select
              id="customerId"
              name="customerId"
              defaultValue={values?.customerId ?? ""}
              className={cn(controlClass, "h-10")}
            >
              <option value="">Elegí un cliente…</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.firstName} {customer.lastName} · {customer.phone}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" htmlFor="firstName" error={state.fieldErrors.firstName}>
              <input
                id="firstName"
                name="firstName"
                defaultValue={values?.firstName ?? ""}
                className={cn(controlClass, "h-10")}
              />
            </Field>
            <Field label="Apellido" htmlFor="lastName" error={state.fieldErrors.lastName}>
              <input
                id="lastName"
                name="lastName"
                defaultValue={values?.lastName ?? ""}
                className={cn(controlClass, "h-10")}
              />
            </Field>
            <Field label="Teléfono" htmlFor="phone" error={state.fieldErrors.phone}>
              <input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={values?.phone ?? ""}
                className={cn(controlClass, "h-10")}
              />
            </Field>
            <Field label="Email" htmlFor="email" error={state.fieldErrors.email}>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue={values?.email ?? ""}
                className={cn(controlClass, "h-10")}
              />
            </Field>
          </div>
        )}
      </fieldset>

      <div className="mt-6 grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
        <Field label="Origen" htmlFor="source" error={state.fieldErrors.source}>
          <select
            id="source"
            name="source"
            defaultValue={values?.source ?? "ADMIN"}
            className={cn(controlClass, "h-10")}
          >
            <option value="ADMIN">Panel</option>
            <option value="PHONE">Teléfono</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="WALK_IN">Mostrador</option>
          </select>
        </Field>
        <Field label="Notas internas" htmlFor="notes" error={state.fieldErrors.notes}>
          <textarea
            id="notes"
            name="notes"
            defaultValue={values?.notes ?? ""}
            className={textareaClass}
            placeholder="Datos útiles para el equipo"
          />
        </Field>
      </div>

      {state.error ? (
        <p
          role="alert"
          className="mt-5 rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-[13px] text-danger"
        >
          {state.error}
        </p>
      ) : null}

      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Creando…" : "Crear turno"}
        </Button>
      </div>
    </form>
  );
}
