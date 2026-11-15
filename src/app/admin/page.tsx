import type { Metadata } from "next";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { signOutAction } from "./actions";

export const metadata: Metadata = {
  title: "Panel",
  robots: { index: false, follow: false },
};

const roleLabels = {
  OWNER: "Dueño",
  ADMIN: "Administrador",
  STAFF: "Personal",
} as const;

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/ingresar?next=/admin");
  }

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id, isActive: true },
    include: { business: true },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background px-5 py-12">
        <div className="w-full max-w-md text-center">
          <h1 className="font-display text-2xl font-semibold tracking-[var(--theme-tracking-display)]">
            Tu cuenta no tiene un negocio asignado
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Pedile a un administrador que te invite o volvé a ingresar con otra
            cuenta.
          </p>
          <form action={signOutAction} className="mt-6">
            <Button type="submit" variant="outline">
              Cerrar sesión
            </Button>
          </form>
        </div>
      </main>
    );
  }

  const { business } = membership;
  const todayKey = formatInTimeZone(new Date(), business.timezone, "yyyy-MM-dd");
  const dayStart = fromZonedTime(`${todayKey}T00:00:00`, business.timezone);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const [total, confirmed, pending] = await Promise.all([
    prisma.appointment.count({
      where: { businessId: business.id, startsAt: { gte: dayStart, lt: dayEnd } },
    }),
    prisma.appointment.count({
      where: {
        businessId: business.id,
        status: "CONFIRMED",
        startsAt: { gte: dayStart, lt: dayEnd },
      },
    }),
    prisma.appointment.count({
      where: {
        businessId: business.id,
        status: "PENDING",
        startsAt: { gte: dayStart, lt: dayEnd },
      },
    }),
  ]);

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-line">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div>
            <p className="text-[11px] font-medium tracking-[0.2em] text-ink-muted uppercase">
              Panel
            </p>
            <p className="font-display text-lg leading-tight font-semibold tracking-[var(--theme-tracking-display)]">
              {business.name}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[13px] font-medium text-ink">{session.user.name}</p>
              <p className="text-[11px] text-ink-muted">{roleLabels[membership.role]}</p>
            </div>
            <form action={signOutAction}>
              <Button type="submit" variant="outline" size="sm">
                Salir
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl leading-tight font-semibold tracking-[var(--theme-tracking-display)]">
              Hoy en {business.name}
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              {formatInTimeZone(new Date(), business.timezone, "EEEE d 'de' MMMM")}
            </p>
          </div>
          <Badge tone="success">Sesión activa</Badge>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Turnos de hoy", value: total, hint: "Agenda completa" },
            { label: "Confirmados", value: confirmed, hint: "Con asistencia prevista" },
            { label: "Pendientes", value: pending, hint: "Falta confirmar" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-line bg-surface p-5"
            >
              <p className="text-[11px] font-medium tracking-[0.18em] text-ink-muted uppercase">
                {item.label}
              </p>
              <p className="mt-3 font-display text-4xl leading-none font-semibold">
                {item.value}
              </p>
              <p className="mt-2 text-[12px] text-ink-muted">{item.hint}</p>
            </div>
          ))}
        </section>

        <section className="mt-10 rounded-lg border border-line bg-surface p-6">
          <h2 className="font-display text-xl font-semibold tracking-[var(--theme-tracking-display)]">
            Siguiente paso
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">
            La autenticación ya protege este panel y los datos salen de
            PostgreSQL. La agenda real, el CRUD de servicios y el equipo llegan
            en las próximas iteraciones.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button disabled>Agenda</Button>
            <Button variant="outline" disabled>
              Servicios
            </Button>
            <Button variant="outline" disabled>
              Equipo
            </Button>
          </div>
          <p className="mt-6 text-[12px] text-ink-muted">
            Volver al{" "}
            <Link
              href="/lab/papel/admin"
              className="text-ink underline decoration-line underline-offset-4"
            >
              laboratorio visual
            </Link>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
