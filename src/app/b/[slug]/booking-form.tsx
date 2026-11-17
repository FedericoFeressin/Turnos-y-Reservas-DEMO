"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, controlClass } from "@/components/ui/field";
import type { PublicBookingFormState } from "@/lib/booking/public-schema";
import { cn } from "@/lib/utils";

import { createPublicBookingAction } from "./actions";

export type BookingSummary = {
  slug: string;
  serviceId: string;
  employeeId: string;
  employeeLabel: string;
  dateKey: string;
  time: string;
  clientRequestId: string;
  serviceName: string;
  durationLabel: string;
  priceLabel: string | null;
  dateLabel: string;
  cancellationPolicy: string;
};

const initialState: PublicBookingFormState = {
  error: null,
  fieldErrors: {},
  values: null,
};

export function BookingForm({ summary }: { summary: BookingSummary }) {
  const [state, formAction, pending] = useActionState(
    createPublicBookingAction,
    initialState,
  );

  const values = state.values;
  const errors = state.fieldErrors;

  return (
    <section
      aria-labelledby="datos-title"
      className="rounded-lg border border-line bg-surface p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium tracking-[0.18em] text-ink-muted uppercase">
            Paso 4 de 4
          </p>
          <h2
            id="datos-title"
            className="mt-1 font-display text-2xl leading-tight font-semibold tracking-[var(--theme-tracking-display)]"
          >
            Tus datos
          </h2>
        </div>
        <Link
          href={`/b/${summary.slug}?servicio=${summary.serviceId}&profesional=${summary.employeeId}&fecha=${summary.dateKey}`}
          className="rounded-md px-2 py-1 text-[13px] text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Cambiar horario
        </Link>
      </div>

      <dl className="mt-5 grid gap-3 rounded-md bg-surface-2 p-4 text-[13px] sm:grid-cols-2">
        <div>
          <dt className="text-[11px] tracking-wide text-ink-muted uppercase">Servicio</dt>
          <dd className="mt-0.5 font-medium text-ink">{summary.serviceName}</dd>
        </div>
        <div>
          <dt className="text-[11px] tracking-wide text-ink-muted uppercase">Profesional</dt>
          <dd className="mt-0.5 font-medium text-ink">{summary.employeeLabel}</dd>
        </div>
        <div>
          <dt className="text-[11px] tracking-wide text-ink-muted uppercase">Fecha</dt>
          <dd className="mt-0.5 font-medium text-ink">{summary.dateLabel}</dd>
        </div>
        <div>
          <dt className="text-[11px] tracking-wide text-ink-muted uppercase">Hora</dt>
          <dd className="mt-0.5 font-medium text-ink tabular-nums">{summary.time}</dd>
        </div>
        <div>
          <dt className="text-[11px] tracking-wide text-ink-muted uppercase">Duración</dt>
          <dd className="mt-0.5 font-medium text-ink">{summary.durationLabel}</dd>
        </div>
        {summary.priceLabel ? (
          <div>
            <dt className="text-[11px] tracking-wide text-ink-muted uppercase">Precio</dt>
            <dd className="mt-0.5 font-medium text-ink tabular-nums">
              {summary.priceLabel}
            </dd>
          </div>
        ) : null}
      </dl>

      <form action={formAction} className="mt-6 space-y-5" noValidate>
        <input type="hidden" name="slug" value={summary.slug} />
        <input type="hidden" name="serviceId" value={summary.serviceId} />
        <input type="hidden" name="employeeId" value={summary.employeeId} />
        <input type="hidden" name="dateKey" value={summary.dateKey} />
        <input type="hidden" name="time" value={summary.time} />
        <input type="hidden" name="clientRequestId" value={summary.clientRequestId} />

        {state.error ? (
          <p
            role="alert"
            className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-[13px] text-danger"
          >
            {state.error}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" htmlFor="booking-first-name" error={errors.firstName}>
            <input
              id="booking-first-name"
              name="firstName"
              required
              autoComplete="given-name"
              defaultValue={values?.firstName ?? ""}
              aria-invalid={errors.firstName ? true : undefined}
              className={cn(controlClass, "h-11")}
              placeholder="Tu nombre"
            />
          </Field>

          <Field label="Apellido" htmlFor="booking-last-name" error={errors.lastName}>
            <input
              id="booking-last-name"
              name="lastName"
              autoComplete="family-name"
              defaultValue={values?.lastName ?? ""}
              aria-invalid={errors.lastName ? true : undefined}
              className={cn(controlClass, "h-11")}
              placeholder="Opcional"
            />
          </Field>

          <Field
            label="Teléfono"
            htmlFor="booking-phone"
            error={errors.phone}
            hint="Te identificamos por este número."
          >
            <input
              id="booking-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              required
              autoComplete="tel"
              defaultValue={values?.phone ?? ""}
              aria-invalid={errors.phone ? true : undefined}
              className={cn(controlClass, "h-11")}
              placeholder="+54 11 5555-5555"
            />
          </Field>

          <Field
            label="Email"
            htmlFor="booking-email"
            error={errors.email}
            hint="Opcional, para tener un comprobante."
          >
            <input
              id="booking-email"
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={values?.email ?? ""}
              aria-invalid={errors.email ? true : undefined}
              className={cn(controlClass, "h-11")}
              placeholder="tu@email.com"
            />
          </Field>
        </div>

        <Field
          label="¿Algo que debamos saber?"
          htmlFor="booking-notes"
          error={errors.notes}
        >
          <textarea
            id="booking-notes"
            name="notes"
            rows={3}
            maxLength={280}
            defaultValue={values?.notes ?? ""}
            aria-invalid={errors.notes ? true : undefined}
            className={cn(controlClass, "py-2 leading-relaxed")}
            placeholder="Opcional"
          />
        </Field>

        <div className="space-y-1.5">
          <label className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink">
            <input
              type="checkbox"
              name="acceptPolicy"
              defaultChecked={values?.acceptPolicy ?? false}
              aria-invalid={errors.acceptPolicy ? true : undefined}
              className="mt-0.5 size-4 shrink-0 accent-primary"
            />
            <span>Acepto la política de cancelación del negocio.</span>
          </label>
          <p className="pl-[26px] text-[11px] leading-relaxed text-ink-muted">
            {summary.cancellationPolicy}
          </p>
          {errors.acceptPolicy ? (
            <p className="pl-[26px] text-[11px] text-danger">{errors.acceptPolicy}</p>
          ) : null}
        </div>

        <Button type="submit" size="lg" full disabled={pending}>
          {pending ? "Reservando…" : "Confirmar reserva"}
        </Button>
      </form>
    </section>
  );
}
