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
import { Container, Section, SectionHead } from "@/components/site/layout-primitives";

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
      "Acceso con Better Auth, memberships por negocio y lectura o escritura según el rol de cada usuario.",
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
  "rounded-sm px-2 py-1.5 text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-ink">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-[13px] focus:text-background"
      >
        Saltar al contenido
      </a>

      <header className="border-b border-line bg-surface">
        <Container className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            <span
              aria-hidden="true"
              className="grid size-9 place-items-center rounded-md bg-primary text-primary-fg"
            >
              <Scissors className="size-[18px]" strokeWidth={1.75} />
            </span>
            <span>
              <span className="block font-display text-lg leading-none font-semibold tracking-[var(--theme-tracking-display)]">
                Booking System
              </span>
              <span className="mt-1 block text-[10px] font-medium tracking-[0.18em] text-ink-muted uppercase">
                Turnos y reservas
              </span>
            </span>
          </Link>

          <nav aria-label="Navegación principal" className="flex items-center gap-1 text-[13px]">
            <Link href="/b/estudio-norte" className={navLinkClass}>
              Demo
            </Link>
            <Link href="/ingresar" className={navLinkClass}>
              Panel
            </Link>
            <Link href="/lab" className={navLinkClass}>
              Laboratorio
            </Link>
          </nav>
        </Container>
      </header>

      <main id="contenido" className="flex-1">
        <section className="border-b border-line">
          <Container className="py-16 sm:py-24">
            <p className="font-mono text-[11px] tracking-[0.22em] text-ink-muted uppercase">
              Etapas 0–6 completas · tema Papel
            </p>

            <h1 className="mt-6 max-w-3xl font-display text-[3rem] leading-[1.02] font-normal tracking-[var(--theme-tracking-display)] sm:text-6xl">
              Reservas claras, agenda ordenada, clientes que vuelven.
            </h1>

            <p className="mt-6 max-w-xl text-[15px] leading-[1.75] text-ink-muted sm:text-base">
              Plantilla comercializable para negocios de servicios. La reserva
              online funciona sin cuentas de cliente, con disponibilidad real,
              panel por roles, historial de turnos y notificaciones encoladas.
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

            <dl className="mt-14 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-6 sm:grid-cols-4">
              {[
                { label: "Módulos", value: "06" },
                { label: "Pruebas E2E", value: "10" },
                { label: "Temas visuales", value: "05" },
                { label: "Cuentas de cliente", value: "00" },
              ].map((item) => (
                <div key={item.label}>
                  <dd className="font-display text-2xl">{item.value}</dd>
                  <dt className="mt-0.5 text-[11px] tracking-[0.14em] text-ink-muted uppercase">
                    {item.label}
                  </dt>
                </div>
              ))}
            </dl>
          </Container>
        </section>

        <Section id="modulos">
          <SectionHead
            index="01 — Producto"
            title="Lo que ya funciona."
            description="Cada módulo está conectado a la misma base y respeta el negocio y el rol de quien lo usa."
          />

          <div className="grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => {
              const Icon = module.icon;

              return (
                <article key={module.index} className="flex flex-col bg-surface p-6">
                  <div className="flex items-start justify-between">
                    <span className="grid size-10 place-items-center rounded-md bg-surface-2 text-primary">
                      <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
                    </span>
                    <span className="font-mono text-[11px] text-ink-muted">{module.index}</span>
                  </div>

                  <h3 className="mt-5 font-display text-[19px] leading-snug font-semibold">
                    {module.title}
                  </h3>
                  <p className="mt-2 flex-1 text-[13px] leading-relaxed text-ink-muted">
                    {module.description}
                  </p>

                  <Link
                    href={module.href}
                    className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    {module.action}
                    <ArrowRight className="size-3.5" aria-hidden="true" />
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
                <p className="text-[11px] font-medium tracking-[0.2em] text-ink-muted uppercase">
                  Demo en vivo
                </p>
                <h2 className="mt-3 font-display text-3xl leading-[1.15] font-semibold tracking-[var(--theme-tracking-display)] sm:text-4xl">
                  Estudio Norte, de punta a punta.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted sm:text-[15px]">
                  Elegí un turno como cliente, confirmalo desde el panel y
                  cancelalo con el enlace firmado. Los datos vuelven a su estado
                  original después de cada prueba.
                </p>
              </div>
              <Link
                href="/b/estudio-norte"
                className={buttonVariants({ size: "lg" })}
              >
                Abrir la demo
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </Section>
        </div>

        <Section id="diseno">
          <SectionHead
            index="02 — Diseño"
            title="Papel es la identidad del producto."
            description="Los otros cuatro conceptos quedan como presets del mismo sistema de tokens. Podés recorrerlos en el laboratorio visual."
          />
          <Link
            href="/lab"
            className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-5 py-3 text-[13px] font-medium transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Ver el laboratorio visual
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Section>
      </main>

      <footer className="border-t border-line bg-surface">
        <Container className="flex flex-col gap-3 py-6 text-[12px] text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>Booking System · plantilla de turnos y reservas</p>
          <p>
            Panel de demo: tomas@estudionorte.com.ar · estudio-norte
          </p>
        </Container>
      </footer>
    </div>
  );
}
