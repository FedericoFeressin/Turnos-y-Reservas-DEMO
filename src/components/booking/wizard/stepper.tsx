"use client";

import { cn } from "@/lib/utils";

const steps = ["Servicio", "Profesional", "Fecha y hora", "Tus datos"];

export function Stepper({
  current,
  onJump,
}: {
  current: number;
  onJump: (index: number) => void;
}) {
  return (
    <nav aria-label="Pasos de la reserva">
      <ol className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {steps.map((label, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <li key={label} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => done && onJump(index)}
                disabled={!done}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "inline-flex items-baseline gap-2 text-[10.5px] tracking-[0.14em] uppercase transition-colors",
                  active && "text-ink",
                  done && "cursor-pointer text-ink-muted hover:text-ink",
                  !active && !done && "cursor-default text-ink-muted/50",
                )}
              >
                <span className="font-mono">{String(index + 1).padStart(2, "0")}</span>
                <span
                  className={cn(
                    "border-b pb-0.5",
                    active ? "border-primary" : "border-transparent",
                    done && "border-line",
                  )}
                >
                  {label}
                </span>
              </button>
              {index < steps.length - 1 ? (
                <span className="h-px w-4 bg-line sm:w-7" aria-hidden />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
