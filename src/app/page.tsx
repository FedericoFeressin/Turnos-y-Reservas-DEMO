import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  Check,
  LayoutDashboard,
  Scissors,
  Settings2,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Container, Section } from "@/components/site/layout-primitives";

export const metadata: Metadata = {
  title: "Turnos y reservas para negocios de servicios",
  description:
    "Plantilla de turnos y reservas con reserva pública, agenda real, roles por membresía, historial de turnos y notificaciones.",
};

const modules: {
  index: string;
  title: string;
  description: string;
  href: string;
  action: string;
  icon: LucideIcon;
}[] = [
  {
    index: "01",
    title: "Reserva pública",
    description:
      "Servicio, profesional, día y hora sin crear cuenta. Identidad por teléfono, idempotencia y cancelación con enlace firmado.",
    href: "/b/estudio-norte",
    action: "Probar la reserva",
    icon: CalendarCheck,
  },
  {
    index: "02",
    title: "Panel de administración",
    description:
      "Ingreso con Better Auth, memberships por negocio y permisos reales según el rol de cada usuario.",
    href: "/ingresar",
    action: "Ingresar",
    icon: LayoutDashboard,
  },
  {
    index: "03",
    title: "Agenda de turnos",
    description:
      "Vistas día y semana, KPIs, alta manual y cambios de estado con transiciones válidas y evento en el historial.",
    href: "/ingresar?next=/admin/turnos",
    action: "Ver la agenda",
    icon: CalendarDays,
  },
  {
    index: "04",
    title: "Servicios y equipo",
    description:
      "Alta, edición y activación de servicios y profesionales, con duración, precio y disponibilidad por persona.",
    href: "/ingresar?next=/admin/servicios",
    action: "Gestionar catálogo",
    icon: Scissors,
  },
  {
    index: "05",
    title: "Clientes y horarios",
    description:
      "Historial por cliente, franjas semanales, ausencias y feriados que se reflejan en la disponibilidad pública.",
    href: "/ingresar?next=/admin/clientes",
    action: "Ver clientes",
    icon: Users,
  },
  {
    index: "06",
    title: "Configuración",
    description:
      "Datos del negocio, zona horaria, anticipación mínima, políticas de cancelación y tema visual.",
    href: "/ingresar?next=/admin/configuracion",
    action: "Configurar",
    icon: Settings2,
  },
];

const highlights = [
  "Sin cuentas de cliente",
  "Disponibilidad real",
  "Cancelación con enlace firmado",
  "Datos separados por negocio",
] as const;

const previewSlots = [
  { time: "09:00", service: "Corte clásico" },
  { time: "11:30", service: "Color y lavado" },
  { time: "16:00", service: "Barba y afeitado" },
] as const;

const demoSteps = [
  "Elegí servicio, profesional y horario.",
  "Confirmá el turno y miralo desde el panel.",
  "Cancelalo con el enlace firmado.",
] as const;

const navLinkClass =
  "rounded-lg px-2 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary max-[359px]:px-1 max-[359px]:text-xs sm:px-3";

const heroButtonClass =
  "inline-flex h-12 items-center justify-center gap-2 rounded-lg px-6 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-hero-focus)]";

export default function Home() {
  return (
    <div
      data-theme="actual"
      className="flex min-h-dvh flex-col bg-background text-ink"
    >
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-background"
      >
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
        <Container className="flex h-16 items-center justify-between gap-2 sm:gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:gap-3"
          >
            <span
              aria-hidden="true"
              className="grid size-8 place-items-center rounded-lg bg-primary text-primary-fg sm:size-9"
            >
              <Scissors className="size-5" strokeWidth={1.9} />
            </span>
            <span className="text-sm leading-tight font-semibold tracking-tight max-[359px]:text-[13px] sm:text-base">
              Booking System
              <span className="mt-0.5 hidden text-[11px] font-medium text-ink-muted sm:block">
                Turnos y reservas
              </span>
            </span>
          </Link>

          <nav
            aria-label="Navegación principal"
            className="flex items-center gap-0.5 sm:gap-1"
          >
            <Link href="#modulos" className={navLinkClass}>
              Módulos
            </Link>
            <Link href="/b/estudio-norte" className={navLinkClass}>
              Demo
            </Link>
            <Link
              href="/ingresar"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-line px-3 text-sm font-medium text-ink transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary max-[359px]:px-2 max-[359px]:text-xs sm:px-4"
            >
              Panel
            </Link>
          </nav>
        </Container>
      </header>

      <main id="contenido" className="flex-1">
        <section className="home-glow relative overflow-hidden bg-[var(--theme-hero-bg)] text-[var(--theme-hero-ink)]">
          <Container className="grid gap-14 py-20 sm:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--theme-hero-line)] bg-[var(--theme-hero-tint)] px-3 py-1.5 text-xs font-semibold">
                <span
                  className="size-2 rounded-full bg-[var(--theme-hero-accent)]"
                  aria-hidden="true"
                />
                Plataforma lista para usar · Etapas 0–6
              </span>

              <h1 className="mt-7 max-w-3xl text-4xl leading-[1.08] font-semibold tracking-[-0.045em] sm:text-5xl lg:text-[4rem]">
                Reservas simples,{" "}
                <span className="text-[var(--theme-hero-accent)]">
                  agenda impecable.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--theme-hero-muted)] sm:text-lg">
                Tus clientes reservan sin crear cuentas, vos ves la
                disponibilidad real y cada turno queda registrado. Sin vueltas,
                sin planillas.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/b/estudio-norte"
                  className={`${heroButtonClass} bg-background text-ink hover:bg-surface-2`}
                >
                  Ver la reserva en vivo
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="#modulos"
                  className={`${heroButtonClass} border border-[var(--theme-hero-line)] text-[var(--theme-hero-ink)] hover:bg-[var(--theme-hero-tint)]`}
                >
                  Explorar módulos
                </Link>
              </div>

              <dl className="mt-14 grid max-w-xl grid-cols-2 gap-x-6 gap-y-6 border-t border-[var(--theme-hero-line)] pt-7 sm:grid-cols-4">
                {[
                  { label: "Módulos listos", value: "06" },
                  { label: "Pruebas E2E", value: "10" },
                  { label: "Temas visuales", value: "05" },
                  { label: "Cuentas de cliente", value: "00" },
                ].map((item) => (
                  <div key={item.label}>
                    <dd className="text-2xl font-semibold tracking-tight">
                      {item.value}
                    </dd>
                    <dt className="mt-1 text-[11px] font-medium tracking-wider text-[var(--theme-hero-muted)] uppercase">
                      {item.label}
                    </dt>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-xl border border-[var(--theme-hero-line)] bg-[var(--theme-hero-surface)] p-5 shadow-raised sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--theme-hero-muted)] uppercase">
                    Vista previa
                  </p>
                  <p className="mt-1 text-lg font-semibold">Agenda de hoy</p>
                </div>
                <span className="rounded-full bg-[var(--theme-hero-tint)] px-3 py-1 text-xs font-semibold text-[var(--theme-hero-accent)]">
                  3 turnos
                </span>
              </div>

              <ul className="mt-5 space-y-3">
                {previewSlots.map((slot) => (
                  <li
                    key={slot.time}
                    className="flex items-center gap-3 rounded-lg border border-[var(--theme-hero-line)] bg-[var(--theme-hero-row)] px-4 py-3"
                  >
                    <span className="text-sm font-semibold tabular-nums">
                      {slot.time}
                    </span>
                    <span className="flex-1 text-sm text-[var(--theme-hero-muted)]">
                      {slot.service}
                    </span>
                    <span
                      className="size-2 rounded-full bg-[var(--theme-hero-accent)]"
                      aria-hidden="true"
                    />
                  </li>
                ))}
              </ul>

              <p className="mt-5 border-t border-[var(--theme-hero-line)] pt-4 text-sm leading-relaxed text-[var(--theme-hero-muted)]">
                Disponibilidad calculada con feriados, ausencias y franjas de
                cada profesional.
              </p>
            </div>
          </Container>
        </section>

        <div className="border-b border-line bg-surface">
          <Container className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-5 sm:justify-between">
            {highlights.map((item) => (
              <p
                key={item}
                className="flex items-center gap-2 text-xs font-medium text-ink-muted sm:text-sm"
              >
                <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />
                {item}
              </p>
            ))}
          </Container>
        </div>

        <Section id="modulos">
          <div className="mb-12 max-w-2xl">
            <p className="text-sm font-semibold text-primary">La plataforma</p>
            <h2 className="mt-3 text-3xl leading-tight font-semibold tracking-[-0.035em] text-ink sm:text-4xl">
              Todo listo para gestionar tus turnos.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-muted sm:text-lg">
              Módulos conectados a la misma base, con permisos por rol y una
              reserva pública que funciona desde el primer día.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => {
              const Icon = module.icon;

              return (
                <article
                  key={module.index}
                  className="flex flex-col rounded-xl border border-line bg-surface p-6 shadow-card transition duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-raised"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid size-11 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" strokeWidth={1.9} aria-hidden="true" />
                    </span>
                    <span className="text-xs font-semibold text-ink-muted">
                      {module.index}
                    </span>
                  </div>

                  <h3 className="mt-6 text-lg leading-snug font-semibold text-ink">
                    {module.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-7 text-ink-muted">
                    {module.description}
                  </p>

                  <Link
                    href={module.href}
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    {module.action}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </article>
              );
            })}
          </div>
        </Section>

        <section className="home-glow relative overflow-hidden bg-[var(--theme-hero-bg)] py-[var(--theme-section-y)] text-[var(--theme-hero-ink)]">
          <Container className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-16">
            <div>
              <p className="text-sm font-semibold text-[var(--theme-hero-accent)]">
                Demo en vivo
              </p>
              <h2 className="mt-3 max-w-xl text-3xl leading-tight font-semibold tracking-[-0.035em] sm:text-4xl">
                Probá Estudio Norte de punta a punta.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--theme-hero-muted)] sm:text-lg">
                Los datos vuelven a su estado original después de cada prueba.
                Podés recorrer el flujo completo sin pedir permiso a nadie.
              </p>
            </div>

            <div className="rounded-xl border border-[var(--theme-hero-line)] bg-[var(--theme-hero-surface)] p-6">
              <ol className="space-y-4">
                {demoSteps.map((step, index) => (
                  <li
                    key={step}
                    className="flex items-start gap-3 text-sm leading-relaxed text-[var(--theme-hero-ink)]"
                  >
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--theme-hero-tint)] text-xs font-semibold text-[var(--theme-hero-accent)]">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>

              <Link
                href="/b/estudio-norte"
                className={`${heroButtonClass} mt-7 w-full bg-background text-ink hover:bg-surface-2`}
              >
                Abrir la demo
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </Container>
        </section>
      </main>

      <footer className="bg-[var(--theme-hero-bg)] text-[var(--theme-hero-muted)]">
        <Container className="flex flex-col gap-8 py-12 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--theme-hero-ink)]">
              Booking System
            </p>
            <p className="mt-1 text-xs">
              Plantilla de turnos y reservas · Etapas 0–6 completas
            </p>
          </div>

          <nav aria-label="Navegación del pie" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium">
            <Link
              href="#modulos"
              className="rounded-sm transition-colors hover:text-[var(--theme-hero-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-hero-focus)]"
            >
              Módulos
            </Link>
            <Link
              href="/b/estudio-norte"
              className="rounded-sm transition-colors hover:text-[var(--theme-hero-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-hero-focus)]"
            >
              Demo
            </Link>
            <Link
              href="/ingresar"
              className="rounded-sm transition-colors hover:text-[var(--theme-hero-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-hero-focus)]"
            >
              Panel
            </Link>
            <Link
              href="#contenido"
              className="rounded-sm transition-colors hover:text-[var(--theme-hero-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-hero-focus)]"
            >
              Volver arriba
            </Link>
          </nav>

          <p className="text-xs">
            Demo:{" "}
            <span className="font-semibold text-[var(--theme-hero-ink)]">
              tomas@estudionorte.com.ar
            </span>{" "}
            ·{" "}
            <span className="font-semibold text-[var(--theme-hero-ink)]">
              estudio-norte
            </span>
          </p>
        </Container>
      </footer>
    </div>
  );
}
