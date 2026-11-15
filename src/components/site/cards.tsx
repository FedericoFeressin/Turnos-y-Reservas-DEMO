import Link from "next/link";
import {
  ArrowUpRight,
  Baby,
  Droplets,
  Palette,
  Scissors,
  Sparkles,
  Wind,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Media } from "@/components/site/layout-primitives";
import type { Concept } from "@/lib/concepts";
import { currency, type DemoService, type DemoStaff } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const icons: Record<DemoService["icon"], LucideIcon> = {
  scissors: Scissors,
  razor: Wind,
  sparkles: Sparkles,
  palette: Palette,
  baby: Baby,
  droplet: Droplets,
};

export function ServiceCard({
  concept,
  service,
  index,
}: {
  concept: Concept;
  service: DemoService;
  index: number;
}) {
  const base = `/lab/${concept.id}`;
  const Icon = icons[service.icon];
  const asRow = concept.id === "papel" || concept.id === "pulso";
  const pill = concept.layout.shape === "pill";

  if (asRow) {
    return (
      <div className="group flex items-start justify-between gap-6 border-b border-line py-5 first:pt-0">
        <div className="flex gap-4">
          <span className="mt-0.5 font-mono text-[11px] text-ink-muted">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-[17px] leading-snug font-semibold">
                {service.name}
              </h3>
              {service.popular ? (
                <Badge tone="accent" shape={pill ? "pill" : "default"}>
                  Más pedido
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 max-w-md text-[13px] leading-relaxed text-ink-muted">
              {service.description}
            </p>
            <p className="mt-2 text-[11px] tracking-[0.14em] text-ink-muted uppercase">
              {service.duration} min
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-display text-[17px] font-semibold">
            {currency.format(service.price)}
          </p>
          <Link
            href={`${base}/reservar`}
            className="mt-1 inline-block text-[12px] text-ink-muted underline decoration-line underline-offset-4 transition-colors hover:text-ink"
          >
            Reservar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <article className="group flex h-full flex-col rounded-lg border border-line bg-surface p-5 shadow-card transition-transform duration-200 hover:-translate-y-0.5 sm:p-6">
      <div className="flex items-start justify-between">
        <span className="grid size-10 place-items-center rounded-md bg-primary/8 text-primary">
          <Icon className="size-[18px]" strokeWidth={1.75} />
        </span>
        {service.popular ? (
          <Badge tone="accent" shape={pill ? "pill" : "default"}>
            Más pedido
          </Badge>
        ) : null}
      </div>

      <h3 className="mt-5 font-display text-[17px] leading-snug font-semibold">
        {service.name}
      </h3>
      <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-ink-muted">
        {service.description}
      </p>

      <div className="mt-5 flex items-end justify-between border-t border-line pt-4">
        <div>
          <p className="font-display text-lg font-semibold">
            {currency.format(service.price)}
          </p>
          <p className="text-[11px] text-ink-muted">{service.duration} min</p>
        </div>
        <Link
          href={`${base}/reservar`}
          aria-label={`Reservar ${service.name}`}
          className="grid size-9 place-items-center rounded-full border border-line text-ink-muted transition-colors group-hover:border-primary group-hover:text-primary"
        >
          <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}

export function StaffCard({
  concept,
  person,
  index,
}: {
  concept: Concept;
  person: DemoStaff;
  index: number;
}) {
  const base = `/lab/${concept.id}`;

  return (
    <article className="group">
      <Media
        ratio="4/5"
        label={`${person.name.split(" ")[0].toLowerCase()}`}
        tone={index === 1 ? "accent" : "primary"}
        className={cn(
          "transition-transform duration-300 group-hover:-translate-y-1",
          concept.layout.shape === "pill" ? "rounded-xl" : "rounded-md",
        )}
      />
      <div className="mt-4">
        <h3 className="font-display text-lg leading-tight font-semibold">{person.name}</h3>
        <p className="mt-0.5 text-[12px] tracking-[0.1em] text-ink-muted uppercase">
          {person.role}
        </p>
        <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">{person.bio}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {person.specialties.map((s) => (
            <span
              key={s}
              className="rounded-sm bg-surface-2 px-2 py-1 text-[11px] text-ink-muted"
            >
              {s}
            </span>
          ))}
        </div>
        <Link
          href={`${base}/reservar`}
          className="mt-4 inline-block text-[12px] font-medium text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary"
        >
          Reservar con {person.name.split(" ")[0]}
        </Link>
      </div>
    </article>
  );
}
