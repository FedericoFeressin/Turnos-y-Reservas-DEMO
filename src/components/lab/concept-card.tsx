import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { concepts, type Concept } from "@/lib/concepts";
import { currency, services } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export function ConceptCard({ concept }: { concept: Concept }) {
  const sample = services[1];

  return (
    <article className="rounded-xl bg-white p-1.5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)]">
      <div
        data-theme={concept.id}
        className="flex h-full flex-col rounded-lg bg-background p-5 text-ink"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium tracking-[0.2em] text-ink-muted uppercase">
              Concepto {Object.keys(concepts).indexOf(concept.id) + 1} · {concept.label}
            </p>
            <h2 className="mt-1.5 font-display text-2xl leading-none font-semibold tracking-[var(--theme-tracking-display)]">
              {concept.name}
            </h2>
          </div>
          <Badge tone="outline">{concept.dark ? "Oscuro" : "Claro"}</Badge>
        </div>

        <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
          {concept.tagline}
        </p>

        <div className="mt-5 rounded-md border border-line bg-surface p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-[15px] leading-tight font-semibold">
                {sample?.name}
              </p>
              <p className="mt-0.5 text-[11px] text-ink-muted">
                {sample?.duration} min · {sample ? currency.format(sample.price) : ""}
              </p>
            </div>
            <span className="rounded-sm bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">
              Más pedido
            </span>
          </div>
          <div className="mt-3 flex gap-1.5">
            {["17:00", "17:30", "18:00"].map((time, i) => (
              <span
                key={time}
                className={cn(
                  "flex h-8 flex-1 items-center justify-center border text-[11px]",
                  i === 1
                    ? "border-primary bg-primary text-primary-fg"
                    : "border-line text-ink-muted",
                  concept.layout.shape === "pill" ? "rounded-full" : "rounded-sm",
                )}
              >
                {time}
              </span>
            ))}
          </div>
          <div
            className={cn(
              buttonVariants({
                shape: concept.layout.shape === "pill" ? "pill" : "default",
                full: true,
              }),
              "mt-3 h-9 text-[12px]",
            )}
          >
            Reservar
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {concept.palette.map((color) => (
            <span key={color.name} className="flex items-center gap-1.5">
              <span
                className="size-4 rounded-full ring-1 ring-black/10"
                style={{ backgroundColor: color.hex }}
              />
              <span className="font-mono text-[9px] text-ink-muted">{color.hex}</span>
            </span>
          ))}
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
          <div className="flex justify-between gap-2">
            <dt className="text-ink-muted">Display</dt>
            <dd className="truncate font-medium">{concept.fonts.display}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-ink-muted">Texto</dt>
            <dd className="truncate font-medium">{concept.fonts.body}</dd>
          </div>
        </dl>

        <p className="mt-4 text-[11px] leading-relaxed text-ink-muted">
          {concept.verticals}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-[12px]">
          <Link href={`/lab/${concept.id}`} className="font-medium text-primary hover:underline">
            Abrir sitio
          </Link>
          <Link href={`/lab/${concept.id}/reservar`} className="text-ink-muted hover:text-ink">
            Reserva
          </Link>
          <Link
            href={`/lab/${concept.id}/admin`}
            className="text-ink-muted hover:text-ink"
          >
            Panel
          </Link>
          <Link
            href={`/lab/${concept.id}/admin/calendario`}
            className="ml-auto inline-flex items-center gap-1 text-ink-muted hover:text-ink"
          >
            Calendario <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>
    </article>
  );
}
