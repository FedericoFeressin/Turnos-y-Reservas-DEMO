"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, Check, ChevronLeft, User } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Concept } from "@/lib/concepts";
import { business, currency, demoSlots, services, staff, weekDays } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const steps = ["Servicio", "Profesional", "Fecha y hora", "Tus datos"];

export function BookingPicker({ concept }: { concept: Concept }) {
  const [serviceId, setServiceId] = useState(services[1]?.id ?? services[0]?.id ?? "");
  const [staffId, setStaffId] = useState(staff[0]?.id ?? "");
  const [dayIndex, setDayIndex] = useState(1);
  const [time, setTime] = useState<string | null>("17:00");
  const [emptyState, setEmptyState] = useState(false);

  const service = services.find((s) => s.id === serviceId) ?? services[0];
  const person = staff.find((s) => s.id === staffId) ?? staff[0];
  const day = weekDays[dayIndex];
  const base = `/lab/${concept.id}`;
  const pill = concept.layout.shape === "pill";
  const variant = concept.layout.slots;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_360px] lg:py-14">
      <div>
        <Link
          href={`${base}/servicios`}
          className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted hover:text-ink"
        >
          <ChevronLeft className="size-3.5" /> Volver a servicios
        </Link>

        <h1 className="mt-4 font-display text-3xl leading-tight font-semibold tracking-[var(--theme-tracking-display)] sm:text-4xl">
          Elegí fecha y horario
        </h1>

        <ol className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-3 text-[12px]">
          {steps.map((step, i) => {
            const state = i < 2 ? "done" : i === 2 ? "current" : "todo";
            return (
              <li key={step} className="flex items-center gap-2">
                <span
                  className={cn(
                    "grid size-6 place-items-center rounded-full border text-[10px] font-medium",
                    state === "done" && "border-primary/30 bg-primary/10 text-primary",
                    state === "current" && "border-primary bg-primary text-primary-fg",
                    state === "todo" && "border-line text-ink-muted",
                  )}
                >
                  {state === "done" ? <Check className="size-3" /> : i + 1}
                </span>
                <span className={state === "current" ? "font-medium" : "text-ink-muted"}>
                  {step}
                </span>
                {i < steps.length - 1 ? (
                  <span className="mx-1 hidden h-px w-5 bg-line sm:block" />
                ) : null}
              </li>
            );
          })}
        </ol>

        {/* Servicio + profesional */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-[11px] font-medium tracking-[0.12em] text-ink-muted uppercase">
              Servicio
            </span>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-md border border-line bg-surface px-3 text-sm"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.duration} min · {currency.format(s.price)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[11px] font-medium tracking-[0.12em] text-ink-muted uppercase">
              Profesional
            </span>
            <select
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-md border border-line bg-surface px-3 text-sm"
            >
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.role}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Fecha */}
        <section className="mt-8" aria-labelledby="fecha-label">
          <div className="flex items-center justify-between">
            <h2 id="fecha-label" className="flex items-center gap-2 text-sm font-medium">
              <CalendarDays className="size-4 text-ink-muted" /> Fecha
            </h2>
            <span className="text-[12px] text-ink-muted">Noviembre 2026</span>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
            {weekDays.map((d, i) => {
              const selected = i === dayIndex;
              return (
                <button
                  key={d.day}
                  type="button"
                  onClick={() => setDayIndex(i)}
                  disabled={!d.available}
                  aria-pressed={selected}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 border py-2.5 transition-colors",
                    pill ? "rounded-lg" : "rounded-md",
                    selected
                      ? "border-primary bg-primary text-primary-fg"
                      : "border-line bg-surface hover:bg-surface-2",
                    !d.available && "cursor-not-allowed opacity-40 hover:bg-surface",
                  )}
                >
                  <span className="text-[10px] tracking-[0.1em] uppercase opacity-80">
                    {d.weekday}
                  </span>
                  <span className="font-display text-lg leading-none font-semibold">
                    {d.day}
                  </span>
                  <span className="text-[9px] opacity-70">{d.available ? "libre" : "cerrado"}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Horarios */}
        <section className="mt-8" aria-labelledby="horario-label">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="horario-label" className="text-sm font-medium">
              Horarios disponibles
            </h2>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEmptyState((v) => !v)}
                className="text-[11px] text-ink-muted underline decoration-line underline-offset-4 hover:text-ink"
              >
                {emptyState ? "Ver horarios libres" : "Probar sin disponibilidad"}
              </button>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-muted">
                <span className="size-2 rounded-full bg-primary" /> elegido
              </span>
            </div>
          </div>

          {emptyState ? (
            <div className="mt-4 rounded-md border border-dashed border-line bg-surface px-6 py-12 text-center">
              <p className="font-display text-lg font-semibold">No quedan horarios ese día</p>
              <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-ink-muted">
                Probá con otra fecha o con otro profesional. La agenda se actualiza
                en tiempo real.
              </p>
              <button
                type="button"
                onClick={() => setDayIndex((dayIndex + 1) % weekDays.length)}
                className={cn(buttonVariants({ variant: "outline", size: "sm", shape: pill ? "pill" : "default" }), "mt-5")}
              >
                Ver día siguiente
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-6">
              {demoSlots.map((group) => (
                <div key={group.label}>
                  <p className="mb-2 text-[11px] font-medium tracking-[0.16em] text-ink-muted uppercase">
                    {group.label}
                  </p>

                  {variant === "list" ? (
                    <ul className="divide-y divide-line overflow-hidden rounded-md border border-line bg-surface">
                      {group.slots.map((slot) => {
                        const selected = time === slot.time;
                        const taken = slot.status === "taken";
                        return (
                          <li key={slot.time}>
                            <button
                              type="button"
                              disabled={taken}
                              onClick={() => setTime(slot.time)}
                              aria-pressed={selected}
                              className={cn(
                                "flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors",
                                selected && "bg-primary/8 text-primary",
                                !selected && !taken && "hover:bg-surface-2",
                                taken && "cursor-not-allowed text-ink-muted/60",
                              )}
                            >
                              <span className="font-medium">{slot.time}</span>
                              <span className="text-[12px]">
                                {taken ? "Ocupado" : selected ? "Seleccionado" : "Disponible"}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : variant === "chips" ? (
                    <div className="flex flex-wrap gap-2">
                      {group.slots.map((slot) => {
                        const selected = time === slot.time;
                        const taken = slot.status === "taken";
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={taken}
                            onClick={() => setTime(slot.time)}
                            aria-pressed={selected}
                            className={cn(
                              "h-10 min-w-[72px] border px-3 text-[13px] font-medium transition-colors",
                              pill ? "rounded-full" : "rounded-md",
                              selected && "border-primary bg-primary text-primary-fg",
                              !selected &&
                                !taken &&
                                "border-line bg-surface hover:border-primary/40 hover:text-primary",
                              taken &&
                                "cursor-not-allowed border-transparent bg-surface-2 text-ink-muted/45 line-through",
                            )}
                          >
                            {slot.time}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                      {group.slots.map((slot) => {
                        const selected = time === slot.time;
                        const taken = slot.status === "taken";
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={taken}
                            onClick={() => setTime(slot.time)}
                            aria-pressed={selected}
                            className={cn(
                              "flex h-10 items-center justify-center rounded-md border text-[13px] font-medium transition-colors",
                              selected && "border-primary bg-primary text-primary-fg",
                              !selected &&
                                !taken &&
                                "border-line bg-surface hover:border-primary/50 hover:bg-primary/5",
                              taken &&
                                "cursor-not-allowed border-dashed border-line bg-transparent text-ink-muted/40",
                            )}
                          >
                            {slot.time}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <p className="mt-4 text-[11px] leading-relaxed text-ink-muted">
            Turnos cada 15 minutos. Reserva mínima con 2 h de anticipación y hasta
            60 días. Los horarios ocupados no se pueden seleccionar.
          </p>
        </section>
      </div>

      {/* Resumen */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-lg border border-line bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between">
            <p className="font-display text-base font-semibold">Tu reserva</p>
            <Badge tone="outline">Paso 3 de 4</Badge>
          </div>

          <dl className="mt-5 space-y-3 text-[13px]">
            <div className="flex items-start justify-between gap-3">
              <dt className="text-ink-muted">Servicio</dt>
              <dd className="text-right font-medium">{service?.name}</dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-ink-muted">Duración</dt>
              <dd className="text-right">{service?.duration} min</dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-ink-muted">Profesional</dt>
              <dd className="inline-flex items-center gap-1.5 text-right">
                <User className="size-3.5 text-ink-muted" />
                {person?.name.split(" ")[0]}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-ink-muted">Fecha</dt>
              <dd className="text-right">
                {day?.weekday} {day?.day} de {day?.month}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-ink-muted">Hora</dt>
              <dd className="text-right font-medium">{time ?? "Elegí un horario"}</dd>
            </div>
          </dl>

          <div className="mt-5 flex items-end justify-between border-t border-line pt-4">
            <span className="text-[13px] text-ink-muted">Total</span>
            <span className="font-display text-2xl font-semibold">
              {service ? currency.format(service.price) : "—"}
            </span>
          </div>

          <Link
            href={`${base}/confirmacion`}
            aria-disabled={!time}
            className={cn(
              buttonVariants({ shape: pill ? "pill" : "default", full: true }),
              "mt-5",
              !time && "pointer-events-none opacity-50",
            )}
          >
            Continuar
          </Link>

          <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-muted">
            No se pide pago. Podés cancelar sin costo hasta 24 h antes.
          </p>
        </div>

        <div className="mt-4 rounded-lg border border-line bg-surface-2/60 p-4">
          <p className="text-[11px] font-medium tracking-[0.12em] text-ink-muted uppercase">
            Dónde
          </p>
          <p className="mt-1.5 text-[13px]">{business.address}</p>
          <p className="mt-3 text-[11px] font-medium tracking-[0.12em] text-ink-muted uppercase">
            Horarios del día
          </p>
          <p className="mt-1.5 text-[13px]">{business.hours[0]?.value}</p>
        </div>
      </aside>
    </div>
  );
}
