"use client";

import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { currency, services } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export function StepService({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <fieldset>
      <legend className="sr-only">Elegí un servicio</legend>

      <div className="border-t border-line">
        {services.map((service, index) => {
          const checked = service.id === value;
          return (
            <label
              key={service.id}
              className={cn(
                "group grid cursor-pointer grid-cols-[1.75rem_1fr_auto] items-start gap-x-3 border-b border-line py-5 transition-colors sm:gap-x-5",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-primary",
                checked ? "bg-surface-2/50" : "hover:bg-surface-2/25",
              )}
            >
              <input
                type="radio"
                name="service"
                value={service.id}
                checked={checked}
                onChange={() => onChange(service.id)}
                className="sr-only"
              />

              <span className="mt-1 font-mono text-[11px] text-ink-muted tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>

              <span className="min-w-0">
                <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-display text-[19px] leading-tight font-semibold">
                    {service.name}
                  </span>
                  {service.popular ? (
                    <Badge tone="accent" size="sm">
                      Más pedido
                    </Badge>
                  ) : null}
                </span>
                <span className="mt-1 block text-[13px] leading-relaxed text-ink-muted">
                  {service.description}
                </span>
                <span className="mt-2 block font-mono text-[10px] tracking-[0.14em] text-ink-muted uppercase">
                  {service.duration} min en la silla · {service.buffer} min de preparación
                </span>
              </span>

              <span className="flex flex-col items-end gap-2">
                <span className="font-display text-[17px] font-semibold tabular-nums">
                  {currency.format(service.price)}
                </span>
                <span className="grid size-4 place-items-center rounded-full border border-line transition-colors group-has-[:checked]:border-primary group-has-[:checked]:bg-primary">
                  <Check
                    className="size-2.5 text-primary-fg opacity-0 transition-opacity group-has-[:checked]:opacity-100"
                    strokeWidth={3}
                  />
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
