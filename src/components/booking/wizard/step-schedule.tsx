"use client";

import { useState } from "react";
import { addMonths, isSameMonth, startOfMonth } from "date-fns";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import type { DemoService } from "@/lib/demo-data";
import {
  DEMO_NOW,
  MAX_ADVANCE_DAYS,
  dateKey,
  formatLongDate,
  formatMonth,
  formatShortDay,
  groupSlots,
  monthGrid,
  nextAvailableDate,
  slotsFor,
  timeToMinutes,
} from "@/lib/booking/schedule";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function StepSchedule({
  service,
  employeeId,
  date,
  time,
  onDate,
  onTime,
}: {
  service: DemoService;
  employeeId: string;
  date: Date;
  time: string | null;
  onDate: (date: Date) => void;
  onTime: (time: string | null) => void;
}) {
  const [month, setMonth] = useState(() => startOfMonth(date));

  const lastMonth = startOfMonth(new Date(DEMO_NOW.getTime() + MAX_ADVANCE_DAYS * 86_400_000));
  const canGoBack = !isSameMonth(month, startOfMonth(DEMO_NOW));
  const canGoForward = !isSameMonth(month, lastMonth);

  const cells = monthGrid(month, service, employeeId);
  const slots = slotsFor(date, service, employeeId);
  const groups = groupSlots(slots);
  const hasAvailability = slots.some((slot) => slot.available);
  const next = hasAvailability ? null : nextAvailableDate(service, employeeId, date);

  const selectedTime = time ? timeToMinutes(time) : null;

  return (
    <div className="grid gap-8 sm:grid-cols-2 sm:gap-10">
      {/* Calendario */}
      <div>
        <div className="flex items-center justify-between gap-2 border-b border-line pb-3">
          <p className="font-display text-lg leading-none font-semibold">{formatMonth(month)}</p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMonth((current) => addMonths(current, -1))}
              disabled={!canGoBack}
              aria-label="Mes anterior"
              className="grid size-7 place-items-center border border-line text-ink-muted transition-colors hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-35"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setMonth((current) => addMonths(current, 1))}
              disabled={!canGoForward}
              aria-label="Mes siguiente"
              className="grid size-7 place-items-center border border-line text-ink-muted transition-colors hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-35"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-y-1">
          {WEEKDAY_LABELS.map((label) => (
            <span
              key={label}
              className="pb-1 text-center font-mono text-[9px] tracking-[0.1em] text-ink-muted uppercase"
              aria-hidden
            >
              {label}
            </span>
          ))}

          {cells.map((cell) => {
            const selected = dateKey(cell.date) === dateKey(date);
            const today = dateKey(cell.date) === dateKey(DEMO_NOW);
            const dayNumber = cell.date.getDate();

            return (
              <button
                key={cell.date.toISOString()}
                type="button"
                disabled={!cell.selectable}
                onClick={() => onDate(cell.date)}
                aria-pressed={selected}
                aria-current={today ? "date" : undefined}
                aria-label={`${formatLongDate(cell.date)}${
                  cell.selectable
                    ? cell.available
                      ? `, ${cell.count} horarios libres`
                      : ", sin horarios libres"
                    : ", cerrado"
                }`}
                className={cn(
                  "relative mx-auto flex size-9 flex-col items-center justify-center rounded-sm text-[13px] tabular-nums transition-colors",
                  !cell.inMonth && "opacity-35",
                  cell.selectable &&
                    !selected &&
                    "text-ink hover:bg-surface-2 hover:ring-1 hover:ring-line",
                  cell.selectable && today && !selected && "ring-1 ring-primary/35",
                  !cell.selectable && "cursor-not-allowed text-ink-muted/35",
                  selected && "bg-ink font-semibold text-background",
                )}
              >
                {dayNumber}
                {cell.available ? (
                  <span
                    className={cn(
                      "absolute bottom-0.5 size-[3px] rounded-full",
                      selected ? "bg-primary-fg/80" : "bg-primary",
                    )}
                    aria-hidden
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-primary" /> con horarios
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full border border-line" /> sin horarios
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-ink" /> elegido
          </span>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-ink-muted">
          Abrimos de lunes a sábado. Reservás hasta 60 días adelante y con 2 horas
          de anticipación.
        </p>
      </div>

      {/* Horarios */}
      <div>
        <div className="flex items-baseline justify-between gap-3 border-b border-line pb-3">
          <p className="font-display text-lg leading-none font-semibold">
            {formatShortDay(date)}
          </p>
          <span className="font-mono text-[10px] tracking-[0.12em] text-ink-muted uppercase">
            {hasAvailability
              ? `${slots.filter((slot) => slot.available).length} libres`
              : "sin lugar"}
          </span>
        </div>

        {hasAvailability ? (
          <div className="mt-4 space-y-5">
            {groups.map((group) => (
              <div key={group.label}>
                <p className="font-mono text-[9px] tracking-[0.18em] text-ink-muted uppercase">
                  {group.label}
                </p>
                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {group.slots.map((slot) => {
                    const selected = selectedTime === slot.minutes;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => onTime(slot.time)}
                        aria-pressed={selected}
                        aria-label={
                          slot.available ? `${slot.time} disponible` : `${slot.time} ocupado`
                        }
                        className={cn(
                          "h-9 rounded-sm border font-mono text-[12px] transition-colors",
                          selected && "border-ink bg-ink font-semibold text-background",
                          !selected &&
                            slot.available &&
                            "border-line bg-surface text-ink hover:border-ink/60 hover:bg-surface-2",
                          !slot.available &&
                            "cursor-not-allowed border-transparent bg-surface-2/60 text-ink-muted/40 line-through",
                        )}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 border border-dashed border-line bg-surface p-5">
            <p className="font-display text-[17px] leading-tight font-semibold">
              No quedan horarios ese día
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-ink-muted">
              {employeeId === "any"
                ? "La agenda está completa. Probá con otra fecha."
                : "Este profesional no tiene lugar. Probá con otra fecha o con el primero disponible."}
            </p>
            {next ? (
              <button
                type="button"
                onClick={() => {
                  setMonth(startOfMonth(next));
                  onDate(next);
                  onTime(null);
                }}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}
              >
                Ver el {formatShortDay(next)}
                <ArrowRight className="size-3.5" />
              </button>
            ) : null}
          </div>
        )}

        {time ? (
          <p className="mt-4 border-t border-line pt-3 text-[12px] text-ink-muted">
            Elegiste las{" "}
            <span className="font-mono text-[12px] font-medium text-ink">{time}</span> del{" "}
            {formatLongDate(date).toLowerCase()}. El turno dura {service.duration} minutos.
          </p>
        ) : (
          <p className="mt-4 border-t border-line pt-3 text-[12px] text-ink-muted">
            Elegí un horario para continuar. Los ocupados aparecen tachados.
          </p>
        )}

        <p className="mt-2 text-[11px] leading-relaxed text-ink-muted/80">
          {employeeId === "any"
            ? "Mostramos solo horarios realmente disponibles para algún profesional."
            : "La grilla avanza cada 15 minutos y ya descuenta la preparación entre turnos."}
        </p>
      </div>
    </div>
  );
}
