"use client";

import { AlertCircle } from "lucide-react";

import type { CustomerErrors, CustomerInput } from "@/lib/booking/schema";

type Simulation = { conflict: boolean; network: boolean };

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={id}
          className="font-mono text-[10px] tracking-[0.16em] text-ink-muted uppercase"
        >
          {label}
        </label>
        {hint ? <span className="text-[10px] text-ink-muted/70">{hint}</span> : null}
      </div>
      <div className="mt-1">{children}</div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 flex items-start gap-1 text-[11.5px] text-danger">
          <AlertCircle className="mt-px size-3 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-none border-0 border-b border-line bg-transparent px-0 text-[15px] text-ink transition-colors placeholder:text-ink-muted/45 focus:border-ink focus:outline-none";

export function StepDetails({
  customer,
  errors,
  onChange,
  simulation,
  onSimulation,
  disabled,
}: {
  customer: CustomerInput;
  errors: CustomerErrors;
  onChange: (patch: Partial<CustomerInput>) => void;
  simulation: Simulation;
  onSimulation: (patch: Partial<Simulation>) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="name" label="Nombre y apellido" error={errors.name}>
          <input
            id="name"
            name="name"
            autoComplete="name"
            value={customer.name}
            onChange={(event) => onChange({ name: event.target.value })}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            placeholder="Martín Paz"
            className={inputClass}
          />
        </Field>

        <Field id="email" label="Email" hint="Te llega la confirmación" error={errors.email}>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={customer.email}
            onChange={(event) => onChange({ email: event.target.value })}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            placeholder="martin@ejemplo.com"
            className={inputClass}
          />
        </Field>

        <Field id="phone" label="Teléfono" hint="Opcional" error={errors.phone}>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={customer.phone}
            onChange={(event) => onChange({ phone: event.target.value })}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            placeholder="+54 11 5555 5555"
            className={inputClass}
          />
        </Field>

        <Field id="notes" label="Comentario" hint="Opcional" error={errors.notes}>
          <input
            id="notes"
            name="notes"
            value={customer.notes}
            onChange={(event) => onChange({ notes: event.target.value })}
            aria-invalid={Boolean(errors.notes)}
            aria-describedby={errors.notes ? "notes-error" : undefined}
            placeholder="Tenés alguna referencia o alergia?"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="border-t border-line pt-5">
        <label
          htmlFor="acceptPolicy"
          className="group flex cursor-pointer items-start gap-3 text-[12.5px] leading-relaxed"
        >
          <span className="relative mt-0.5 grid size-4 shrink-0 place-items-center border border-line transition-colors group-has-[:checked]:border-primary group-has-[:checked]:bg-primary">
            <input
              id="acceptPolicy"
              name="acceptPolicy"
              type="checkbox"
              checked={customer.acceptPolicy}
              onChange={(event) => onChange({ acceptPolicy: event.target.checked })}
              aria-invalid={Boolean(errors.acceptPolicy)}
              aria-describedby={errors.acceptPolicy ? "acceptPolicy-error" : undefined}
              className="peer sr-only"
            />
            <svg viewBox="0 0 10 10" aria-hidden className="size-2.5 text-primary-fg opacity-0 peer-checked:opacity-100">
              <path d="M1 5.5 3.5 8 9 2" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </span>
          <span className="text-ink-muted">
            Acepto la política de cancelación: sin costo hasta 24 horas antes. Después
            se cobra el 50% del servicio.
          </span>
        </label>
        {errors.acceptPolicy ? (
          <p role="alert" className="mt-2 flex items-start gap-1 text-[11.5px] text-danger">
            <AlertCircle className="mt-px size-3 shrink-0" />
            {errors.acceptPolicy}
          </p>
        ) : null}
      </div>

      <div className="flex items-start gap-2 border border-line bg-surface-2/50 p-3.5 text-[11.5px] leading-relaxed text-ink-muted">
        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
        No se pide pago ni tarjeta. El turno queda reservado con tu nombre y el email
        de confirmación.
      </div>

      <details className="border-t border-line pt-4" open={simulation.conflict || simulation.network}>
        <summary className="cursor-pointer font-mono text-[10px] tracking-[0.16em] text-ink-muted uppercase select-none">
          Opciones de demo
        </summary>
        <div className="mt-3 space-y-2.5">
          <label className="flex items-center gap-2.5 text-[12px] text-ink-muted">
            <input
              type="checkbox"
              checked={simulation.conflict}
              onChange={(event) => onSimulation({ conflict: event.target.checked })}
              disabled={disabled}
              className="size-3.5 accent-[var(--theme-primary)]"
            />
            Simular que otro cliente tomó el turno
          </label>
          <label className="flex items-center gap-2.5 text-[12px] text-ink-muted">
            <input
              type="checkbox"
              checked={simulation.network}
              onChange={(event) => onSimulation({ network: event.target.checked })}
              disabled={disabled}
              className="size-3.5 accent-[var(--theme-primary)]"
            />
            Simular error de red al confirmar
          </label>
        </div>
      </details>
    </div>
  );
}
