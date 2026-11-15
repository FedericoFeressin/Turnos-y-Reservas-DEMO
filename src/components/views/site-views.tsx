import Link from "next/link";
import { ArrowRight, Clock, MapPin, Star } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Media, Section, SectionHead } from "@/components/site/layout-primitives";
import { ServiceCard, StaffCard } from "@/components/site/cards";
import { Hero } from "@/components/site/hero";
import { SiteFooter, SiteHeader } from "@/components/site/site-chrome";
import type { Concept } from "@/lib/concepts";
import { business, services, staff } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

function TrustStrip({ concept }: { concept: Concept }) {
  const items = [
    `${business.rating} ★ · ${business.reviews} reseñas`,
    "+4.200 clientes desde 2012",
    "Confirmación inmediata",
    "Cancelación sin costo",
  ];

  return (
    <div className="border-y border-line bg-surface/60">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-2 px-5 py-3.5 text-[11px] tracking-wide text-ink-muted sm:px-8">
        {items.map((item) => (
          <span key={item} className={cn("inline-flex items-center gap-1.5", concept.dark && "text-ink-muted")}>
            <span className="size-1 rounded-full bg-primary" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function BookingBand({ concept }: { concept: Concept }) {
  const base = `/lab/${concept.id}`;
  const plain = concept.id === "papel";
  const pill = concept.layout.shape === "pill";

  return (
    <Section>
      <div
        className={cn(
          "relative overflow-hidden rounded-lg px-6 py-12 sm:px-12 sm:py-16",
          plain
            ? "border border-line bg-surface-2/50"
            : "bg-primary text-primary-fg",
        )}
      >
        {!plain ? (
          <div
            className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full opacity-20"
            style={{
              backgroundImage: "radial-gradient(circle, currentColor 0%, transparent 65%)",
            }}
            aria-hidden
          />
        ) : null}

        <div className="relative flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-end">
          <div className="max-w-lg">
            <p
              className={cn(
                "text-[11px] font-medium tracking-[0.2em] uppercase",
                plain ? "text-ink-muted" : "text-primary-fg",
              )}
            >
              Sin llamadas, sin espera
            </p>
            <h2 className="mt-3 font-display text-3xl leading-tight font-semibold tracking-[var(--theme-tracking-display)] sm:text-4xl">
              Elegí tu horario ahora.
              <br />
              Nosotros ponemos la tijera.
            </h2>
            <p
              className={cn(
                "mt-3 max-w-md text-sm leading-relaxed",
                plain ? "text-ink-muted" : "text-primary-fg",
              )}
            >
              El turno queda confirmado al instante y podés moverlo hasta 24 horas
              antes.
            </p>
          </div>

          <Link
            href={`${base}/reservar`}
            className={buttonVariants({
              size: "lg",
              shape: pill ? "pill" : "default",
              variant: plain ? "primary" : "dark",
            })}
          >
            Reservar turno
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </Section>
  );
}

function VisitBlock({ concept }: { concept: Concept }) {
  return (
    <Section id="visitanos">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHead
            index="03 — Visitanos"
            title="Estamos a cinco cuadras de Cabildo y Juramento."
            description="Llegá cinco minutos antes. Si venís en auto, hay estacionamiento sobre Virrey del Pino."
          />
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="flex items-center gap-2 text-[11px] font-medium tracking-[0.16em] text-ink-muted uppercase">
                <MapPin className="size-3.5" /> Dirección
              </p>
              <p className="mt-2 text-sm">{business.address}</p>
              <p className="mt-1 text-sm text-ink-muted">{business.phone}</p>
            </div>
            <div>
              <p className="flex items-center gap-2 text-[11px] font-medium tracking-[0.16em] text-ink-muted uppercase">
                <Clock className="size-3.5" /> Horarios
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {business.hours.map((h) => (
                  <li key={h.label} className="flex flex-col">
                    <span className="text-ink-muted">{h.label}</span>
                    <span>{h.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <Media ratio="16/9" label="fachada" className={concept.layout.shape === "pill" ? "rounded-xl" : "rounded-md"} />
      </div>
    </Section>
  );
}

export function HomeView({ concept }: { concept: Concept }) {
  const base = `/lab/${concept.id}`;
  const asRow = concept.id === "papel" || concept.id === "pulso";

  return (
    <>
      <SiteHeader concept={concept} />

      <main id="contenido">
        <Hero concept={concept} />
        <TrustStrip concept={concept} />

        <Section id="servicios">
          <SectionHead
            index="01 — Servicios"
            title="Precios claros, duración real."
            description="Cada servicio incluye lo que dice incluir. El tiempo de limpieza entre turnos ya está contemplado."
            action={
              <Link
                href={`${base}/servicios`}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline"
              >
                Ver todos
                <ArrowRight className="size-3.5" />
              </Link>
            }
          />

          {asRow ? (
            <div className="max-w-3xl">
              {services.slice(0, 4).map((service, index) => (
                <ServiceCard
                  key={service.id}
                  concept={concept}
                  service={service}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.slice(0, 4).map((service, index) => (
                <ServiceCard
                  key={service.id}
                  concept={concept}
                  service={service}
                  index={index}
                />
              ))}
            </div>
          )}
        </Section>

        <div className="border-y border-line bg-surface">
          <Section id="equipo">
            <SectionHead
              index="02 — Equipo"
              title="Elegí con quién sentarte."
              description="Tres formas distintas de entender el mismo oficio. Todos trabajan con turno."
              action={
                <Link
                  href={`${base}/equipo`}
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline"
                >
                  Conocer al equipo
                  <ArrowRight className="size-3.5" />
                </Link>
              }
            />
            <div className="grid gap-6 sm:grid-cols-3">
              {staff.map((person, index) => (
                <StaffCard
                  key={person.id}
                  concept={concept}
                  person={person}
                  index={index}
                />
              ))}
            </div>
          </Section>
        </div>

        <BookingBand concept={concept} />
        <VisitBlock concept={concept} />
      </main>

      <SiteFooter concept={concept} />
    </>
  );
}

export function ServicesView({ concept }: { concept: Concept }) {
  const base = `/lab/${concept.id}`;
  const asRow = concept.id === "papel" || concept.id === "pulso";

  return (
    <>
      <SiteHeader concept={concept} />

      <main id="contenido">
        <Section className="pb-6 sm:pb-10">
          <div className="max-w-2xl">
            <Badge tone="outline">Carta de servicios</Badge>
            <h1 className="mt-4 font-display text-4xl leading-tight font-semibold tracking-[var(--theme-tracking-display)] sm:text-5xl">
              Todo lo que hacemos,
              <br />
              con precio y duración.
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
              Los valores incluyen lavado y producto. El tiempo indicado es el que
              vas a estar en la silla, no el que figura en el sistema.
            </p>
          </div>
        </Section>

        <Section className="pt-0">
          {asRow ? (
            <div className="max-w-3xl">
              {services.map((service, index) => (
                <ServiceCard
                  key={service.id}
                  concept={concept}
                  service={service}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service, index) => (
                <ServiceCard
                  key={service.id}
                  concept={concept}
                  service={service}
                  index={index}
                />
              ))}
            </div>
          )}

          <div className="mt-10 grid gap-4 rounded-md border border-line bg-surface p-5 sm:grid-cols-3">
            {[
              { t: "Anticipación mínima", d: "2 horas antes del horario." },
              { t: "Cómo reservar", d: "Online, en menos de un minuto." },
              { t: "Cancelación", d: "Sin costo hasta 24 h antes." },
            ].map((item) => (
              <div key={item.t}>
                <p className="text-[12px] font-semibold">{item.t}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">{item.d}</p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Link
              href={`${base}/reservar`}
              className={buttonVariants({
                size: "lg",
                shape: concept.layout.shape === "pill" ? "pill" : "default",
              })}
            >
              Reservar un turno
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </Section>
      </main>

      <SiteFooter concept={concept} />
    </>
  );
}

export function TeamView({ concept }: { concept: Concept }) {
  const base = `/lab/${concept.id}`;

  return (
    <>
      <SiteHeader concept={concept} />

      <main id="contenido">
        <Section className="pb-6 sm:pb-10">
          <div className="max-w-2xl">
            <Badge tone="outline">El equipo</Badge>
            <h1 className="mt-4 font-display text-4xl leading-tight font-semibold tracking-[var(--theme-tracking-display)] sm:text-5xl">
              Tres personas.
              <br />
              Ninguna hace lo mismo.
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
              Podés elegir profesional al reservar, o dejar que el sistema te
              asigne el primero disponible.
            </p>
          </div>
        </Section>

        <Section className="pt-0">
          <div className="grid gap-8 sm:grid-cols-3">
            {staff.map((person, index) => (
              <StaffCard
                key={person.id}
                concept={concept}
                person={person}
                index={index}
              />
            ))}
          </div>

          <div className="mt-12 grid gap-6 border-t border-line pt-8 sm:grid-cols-3">
            {staff.map((person) => (
              <div key={person.id}>
                <p className="text-[12px] font-semibold">{person.name}</p>
                <p className="mt-1 text-[12px] text-ink-muted">
                  {person.years} años de experiencia · {person.specialties.join(" · ")}
                </p>
                <p className="mt-2 text-[12px] text-ink-muted">
                  Lun a vie · 09:00 a 20:00
                  {person.id === "sofia" ? " · Mié libre" : ""}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href={`${base}/reservar`}
              className={buttonVariants({
                size: "lg",
                shape: concept.layout.shape === "pill" ? "pill" : "default",
              })}
            >
              Reservar con un profesional
            </Link>
            <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted">
              <Star className="size-3.5 fill-primary text-primary" />
              {business.rating} de 5 · {business.reviews} reseñas verificadas
            </span>
          </div>
        </Section>
      </main>

      <SiteFooter concept={concept} />
    </>
  );
}
