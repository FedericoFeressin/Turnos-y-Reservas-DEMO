import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  LayoutDashboard,
  Scissors,
  Settings2,
  Users,
  type LucideIcon,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
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

const navLinkClass =
  "rounded-md px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-ink">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-background"
      >
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
        <Container className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            <span
              aria-hidden="true"
              className="grid size-9 place-items-center rounded-md bg-primary text-primary-fg"
            >
              <Scissors className="size-5" strokeWidth={1.75} />
            </span>
            <span className="text-base leading-tight font-semibold tracking-tight">
              Booking System
              <span className="block text-[11px] font-medium text-ink-muted">
                Turnos y reservas
              </span>
            </span>
          </Link>

          <nav aria-label="Navegación principal" className="flex items-center gap-1">
            <Link href="#modulos" className={navLinkClass}>
              Módulos
            </Link>
            <Link href="/b/estudio-norte" className={navLinkClass}>
              Demo
            </Link>
            <Link
              href="/ingresar"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Panel
            </Link>
          </nav>
        </Container>
      </header>

      <main id="contenido" className="flex-1">
        <section className="border-b border-line bg-surface-2/40">
          <Container className="py-20 sm:py-28">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink">
              <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
              Etapas 0–6 completas
            </span>

            <h1 className="mt-7 max-w-4xl font-sans text-4xl leading-[1.08] font-semibold tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Turnos que se reservan solos. Negocios que no pierden tiempo.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink sm:text-xl">
              Plantilla de turnos y reservas con flujo público sin cuentas,
              disponibilidad real, panel por roles e historial de cada turno.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/b/estudio-norte" className={buttonVariants({ size: "lg" })}>
                Ver la reserva en vivo
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link href="/ingresar" className={buttonVariants({ variant: "outline", size: "lg" })}>
                Abrir el panel
              </Link>
            </div>

            <dl className="mt-16 grid max-w-3xl grid-cols-2 gap-x-6 gap-y-6 border-t border-line pt-7 sm:grid-cols-4">
              {[
                { label: "Módulos listos", value: "06" },
                { label: "Pruebas E2E", value: "10" },
                { label: "Temas visuales", value: "05" },
                { label: "Cuentas de cliente", value: "00" },
              ].map((item) => (
                <div key={item.label}>
                  <dd className="font-sans text-3xl font-semibold tracking-tight text-ink">
                    {item.value}
                  </dd>
                  <dt className="mt-1 text-xs font-medium tracking-wide text-ink-muted uppercase">
                    {item.label}
                  </dt>
                </div>
              ))}
            </dl>
          </Container>
        </section>

        <Section id="modulos">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-semibold text-primary">Producto</p>
            <h2 className="mt-2 font-sans text-3xl leading-tight font-semibold tracking-[-0.03em] text-ink sm:text-4xl">
              Todo lo que ya funciona.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink">
              Cada pantalla usa la misma base y respeta el negocio y el rol de
              quien la abre.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => {
              const Icon = module.icon;

              return (
                <article
                  key={module.index}
                  className="flex flex-col rounded-xl border border-line bg-surface p-6 shadow-card transition-colors hover:border-primary"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid size-11 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" strokeWidth={1.9} aria-hidden="true" />
                    </span>
                    <span className="text-xs font-semibold text-ink-muted">
                      {module.index}
                    </span>
                  </div>

                  <h3 className="mt-6 font-sans text-lg leading-snug font-semibold text-ink">
                    {module.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-7 text-ink">
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

        <div className="border-y border-line bg-surface-2/60">
          <Section>
            <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold text-primary">Demo en vivo</p>
                <h2 className="mt-2 font-sans text-3xl leading-tight font-semibold tracking-[-0.03em] text-ink sm:text-4xl">
                  Estudio Norte, de punta a punta.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-ink">
                  Elegí un turno como cliente, confirmalo desde el panel y
                  cancelalo con el enlace firmado. Los datos vuelven a su estado
                  original después de cada prueba.
                </p>
              </div>
              <Link href="/b/estudio-norte" className={buttonVariants({ size: "lg" })}>
                Abrir la demo
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </Section>
        </div>
      </main>

      <footer className="border-t border-line bg-surface">
        <Container className="flex flex-col gap-3 py-7 text-sm text-ink sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium">Booking System · plantilla de turnos y reservas</p>
          <p>
            Panel de demo:{" "}
            <span className="font-semibold">tomas@estudionorte.com.ar</span> ·{" "}
            <span className="font-semibold">estudio-norte</span>
          </p>
        </Container>
      </footer>
    </div>
  );
}
