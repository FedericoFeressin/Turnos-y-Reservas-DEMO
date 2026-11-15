import Link from "next/link";
import { Clock, MapPin, Star } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Media } from "@/components/site/layout-primitives";
import type { Concept } from "@/lib/concepts";
import { business, weekDays } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export function Hero({ concept }: { concept: Concept }) {
  const base = `/lab/${concept.id}`;
  const shape = concept.layout.shape === "pill" ? "pill" : "default";

  if (concept.layout.hero === "cinematic") {
    return (
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Media ratio="16/9" className="h-full w-full rounded-none opacity-55" label="" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/40 to-background" />
        </div>

        <div className="relative mx-auto flex min-h-[78vh] w-full max-w-4xl flex-col items-center justify-center px-6 py-28 text-center">
          <p className="text-[10px] font-medium tracking-[0.38em] text-primary uppercase">
            Estudio Norte · Desde {business.since}
          </p>
          <h1 className="mt-6 font-display text-5xl leading-[1.02] font-medium tracking-[var(--theme-tracking-display)] sm:text-7xl">
            El oficio de siempre,
            <br />
            <em className="text-primary not-italic">hecho a tu medida.</em>
          </h1>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-ink-muted">
            {business.description}
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href={`${base}/reservar`} className={buttonVariants({ size: "lg", shape })}>
              Reservar turno
            </Link>
            <Link
              href={`${base}/servicios`}
              className={buttonVariants({ variant: "outline", size: "lg", shape })}
            >
              Ver servicios
            </Link>
          </div>

          <dl className="mt-16 grid w-full max-w-xl grid-cols-3 divide-x divide-line border-y border-line py-5">
            {[
              { k: "Reseñas", v: `${business.rating} ★` },
              { k: "Clientes", v: "+4.200" },
              { k: "Años", v: `${new Date().getFullYear() - business.since}` },
            ].map((item) => (
              <div key={item.k} className="px-4">
                <dt className="text-[10px] tracking-[0.2em] text-ink-muted uppercase">{item.k}</dt>
                <dd className="mt-1 font-display text-2xl">{item.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    );
  }

  if (concept.layout.hero === "split") {
    return (
      <section className="border-b border-line bg-surface">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div>
            <Badge tone="primary" shape="pill" className="mb-5">
              <span className="size-1.5 rounded-full bg-primary" />
              Turnos disponibles hoy
            </Badge>
            <h1 className="font-display text-4xl leading-[1.06] font-semibold tracking-[var(--theme-tracking-display)] sm:text-5xl">
              Tu agenda ordenada.
              <br />
              Tus clientes, contentos.
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-muted">
              {business.description} Reservá en menos de un minuto y recibí la
              confirmación al instante.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href={`${base}/reservar`} className={buttonVariants({ size: "lg", shape })}>
                Reservar turno
              </Link>
              <Link
                href={`${base}/servicios`}
                className={buttonVariants({ variant: "outline", size: "lg", shape })}
              >
                Ver servicios
              </Link>
            </div>

            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-line pt-6">
              {[
                { k: "Ocupación", v: "78%" },
                { k: "Reseñas", v: `${business.rating} ★` },
                { k: "Respuesta", v: "< 1 h" },
              ].map((item) => (
                <div key={item.k}>
                  <dd className="font-display text-xl font-semibold">{item.v}</dd>
                  <dt className="mt-0.5 text-[11px] text-ink-muted">{item.k}</dt>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-xl border border-line bg-background p-5 shadow-raised sm:p-6">
            <div className="flex items-center justify-between">
              <p className="font-display text-base font-semibold">Reserva rápida</p>
              <Badge tone="success" shape="pill">
                Hoy
              </Badge>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-[11px] tracking-wide text-ink-muted uppercase">Servicio</p>
                <div className="mt-1.5 flex h-11 items-center justify-between rounded-md border border-line px-3 text-sm">
                  Corte + barba
                  <span className="text-ink-muted">50 min</span>
                </div>
              </div>
              <div>
                <p className="text-[11px] tracking-wide text-ink-muted uppercase">Profesional</p>
                <div className="mt-1.5 flex gap-2">
                  {["Tomás", "Julián", "Sofía"].map((name, i) => (
                    <span
                      key={name}
                      className={cn(
                        "flex h-9 items-center rounded-md border px-3 text-[13px]",
                        i === 0
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-line text-ink-muted",
                      )}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] tracking-wide text-ink-muted uppercase">Próximos horarios</p>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {["16:30", "17:00", "18:30", "19:00", "19:30"].map((time, i) => (
                    <span
                      key={time}
                      className={cn(
                        "flex h-9 items-center justify-center rounded-md border text-[13px]",
                        i === 1
                          ? "border-primary bg-primary text-primary-fg"
                          : "border-line text-ink-muted",
                      )}
                    >
                      {time}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <Link
              href={`${base}/reservar`}
              className={cn(buttonVariants({ shape }), "mt-5 w-full")}
            >
              Continuar
            </Link>
            <p className="mt-3 text-center text-[11px] text-ink-muted">
              Sin pago adelantado · Cancelación gratuita hasta 24 h antes
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (concept.layout.hero === "card") {
    return (
      <section className="relative overflow-hidden">
        <div className="blob absolute -top-24 right-0 size-[420px] rounded-full" aria-hidden />
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 pt-14 pb-20 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:pt-20">
          <div className="relative">
            <Badge tone="accent" shape="pill" className="mb-5">
              Nuevo · Reserva online 24/7
            </Badge>
            <h1 className="font-display text-[2.75rem] leading-[1.02] font-bold tracking-[var(--theme-tracking-display)] sm:text-6xl">
              Salí de acá
              <br />
              sintiéndote
              <span className="text-primary"> otro</span>.
            </h1>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-ink-muted">
              {business.description}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href={`${base}/reservar`} className={buttonVariants({ size: "lg", shape: "pill" })}>
                Reservar ahora
              </Link>
              <Link
                href={`${base}/equipo`}
                className={buttonVariants({ variant: "ghost", size: "lg", shape: "pill" })}
              >
                Conocer al equipo
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] text-ink-muted">
              <span className="inline-flex items-center gap-1.5">
                <Star className="size-4 fill-primary text-primary" />
                {business.rating} · {business.reviews} reseñas
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" />
                {business.address}
              </span>
            </div>
          </div>

          <div className="relative">
            <Media ratio="4/5" className="rounded-xl shadow-raised" label="retrato" />
            <div className="absolute -bottom-6 -left-4 w-[78%] rounded-lg border border-line bg-surface p-4 shadow-raised sm:-left-8">
              <p className="text-[10px] font-medium tracking-[0.18em] text-ink-muted uppercase">
                Próximo turno libre
              </p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div>
                  <p className="font-display text-2xl font-bold">Hoy 18:30</p>
                  <p className="text-[12px] text-ink-muted">Corte + barba · 50 min</p>
                </div>
                <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-medium text-accent">
                  $14.000
                </span>
              </div>
              <div className="mt-3 flex gap-1.5">
                {weekDays.slice(0, 7).map((d, i) => (
                  <span
                    key={d.day}
                    className={cn(
                      "flex h-9 flex-1 flex-col items-center justify-center rounded-full text-[10px]",
                      i === 2 ? "bg-primary text-primary-fg" : "bg-surface-2 text-ink-muted",
                      !d.available && "opacity-40",
                    )}
                  >
                    <span>{d.weekday}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (concept.layout.hero === "clinical") {
    return (
      <section className="border-b border-line bg-surface">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.24em] text-primary uppercase">
              {business.tagline}
            </p>
            <h1 className="mt-4 font-display text-4xl leading-[1.12] font-medium tracking-[var(--theme-tracking-display)] sm:text-5xl">
              Un turno claro,
              <br />
              sin llamadas ni esperas.
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-muted">
              Elegí profesional, día y horario. Te confirmamos por email y te
              recordamos 24 horas antes.
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              {["14 años de experiencia", "3 profesionales", "Cancelación sin costo"].map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-md border border-line bg-background px-3 py-1.5 text-[12px] text-ink-muted"
                  >
                    {item}
                  </span>
                ),
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`${base}/reservar`} className={buttonVariants({ size: "lg" })}>
                Pedir turno
              </Link>
              <Link
                href={`${base}/servicios`}
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                Ver prestaciones
              </Link>
            </div>

            <div className="mt-9 space-y-2 border-t border-line pt-5 text-[13px] text-ink-muted">
              <p className="inline-flex items-center gap-2">
                <Clock className="size-4" /> {business.hours[0]?.value}
              </p>
              <p className="inline-flex items-center gap-2">
                <MapPin className="size-4" /> {business.address}
              </p>
            </div>
          </div>

          <div className="relative">
            <Media ratio="4/5" label="profesional" />
            <div className="absolute right-4 bottom-4 left-4 rounded-md border border-line bg-surface/95 p-4 backdrop-blur">
              <p className="text-[10px] font-semibold tracking-[0.18em] text-ink-muted uppercase">
                Próxima disponibilidad
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="font-display text-lg">Hoy · 18:30</p>
                <Link
                  href={`${base}/reservar`}
                  className={buttonVariants({ size: "sm" })}
                >
                  Reservar
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // editorial (Papel)
  return (
    <section className="relative">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 pt-14 pb-16 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:pt-20">
        <div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] tracking-[0.22em] text-ink-muted uppercase">
              Est. {business.since}
            </span>
            <span className="h-px flex-1 bg-line" />
            <span className="font-mono text-[10px] tracking-[0.22em] text-ink-muted uppercase">
              Palermo · CABA
            </span>
          </div>

          <h1 className="mt-8 font-display text-[3.1rem] leading-[0.98] font-normal tracking-[var(--theme-tracking-display)] sm:text-[4.4rem]">
            Cortes con criterio.
            <br />
            Turnos sin espera.
          </h1>

          <p className="mt-7 max-w-md text-[15px] leading-[1.75] text-ink-muted">
            {business.description} Reservá online y elegí con quién sentarte.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={`${base}/reservar`} className={buttonVariants({ size: "lg" })}>
              Reservar turno
            </Link>
            <Link
              href={`${base}/servicios`}
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Ver servicios y precios
            </Link>
          </div>

          <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-line pt-6">
            {[
              { k: "Reseñas", v: `${business.rating} ★` },
              { k: "Clientes", v: "+4.200" },
              { k: "Profesionales", v: "3" },
            ].map((item) => (
              <div key={item.k}>
                <dd className="font-display text-xl">{item.v}</dd>
                <dt className="mt-0.5 text-[11px] tracking-[0.14em] text-ink-muted uppercase">
                  {item.k}
                </dt>
              </div>
            ))}
          </dl>
        </div>

        <figure className="lg:pb-2">
          <Media ratio="4/5" label="retrato" className="rounded-sm" />
          <figcaption className="mt-3 flex items-start justify-between gap-4 text-[11px] text-ink-muted">
            <span className="max-w-[22ch] leading-relaxed">
              Tomás Herrera, barbero. {business.address}.
            </span>
            <span className="font-mono tracking-[0.14em]">01</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
