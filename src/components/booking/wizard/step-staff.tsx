"use client";

import { Check, Users } from "lucide-react";

import { staff } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("");
}

export function StepStaff({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const options = [
    {
      id: "any",
      name: "El primero disponible",
      role: "Te asignamos al profesional con más margen ese día.",
      initials: null,
      note: "Recomendado si no tenés preferencia.",
    },
    ...staff.map((person) => ({
      id: person.id,
      name: person.name,
      role: person.role,
      initials: initials(person.name),
      note:
        person.daysOff.length > 0
          ? `No trabaja los ${person.daysOff.map((d) => WEEKDAYS[d]).join(" ni los ")}.`
          : `${person.years} años de oficio · ${person.specialties.join(" · ")}`,
    })),
  ];

  return (
    <fieldset>
      <legend className="sr-only">Elegí un profesional</legend>

      <div className="border-t border-line">
        {options.map((option) => {
          const checked = option.id === value;
          return (
            <label
              key={option.id}
              className={cn(
                "group flex cursor-pointer items-center gap-4 border-b border-line py-4 transition-colors",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-primary",
                checked ? "bg-surface-2/50" : "hover:bg-surface-2/25",
              )}
            >
              <input
                type="radio"
                name="staff"
                value={option.id}
                checked={checked}
                onChange={() => onChange(option.id)}
                className="sr-only"
              />

              <span
                className={cn(
                  "grid size-11 shrink-0 place-items-center border font-mono text-[12px]",
                  checked
                    ? "border-primary bg-primary text-primary-fg"
                    : "border-line bg-surface text-ink-muted",
                )}
              >
                {option.initials ?? <Users className="size-4" strokeWidth={1.6} />}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block font-display text-[17px] leading-tight font-semibold">
                  {option.name}
                </span>
                <span className="mt-0.5 block text-[12px] text-ink-muted">{option.role}</span>
                <span className="mt-1 block text-[11px] text-ink-muted/80">{option.note}</span>
              </span>

              <span className="grid size-4 shrink-0 place-items-center rounded-full border border-line transition-colors group-has-[:checked]:border-primary group-has-[:checked]:bg-primary">
                <Check
                  className="size-2.5 text-primary-fg opacity-0 transition-opacity group-has-[:checked]:opacity-100"
                  strokeWidth={3}
                />
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
