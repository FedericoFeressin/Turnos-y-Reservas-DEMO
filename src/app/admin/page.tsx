import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { appointmentStatusMeta } from "@/lib/appointments";
import { listEmployees } from "@/lib/admin/queries";
import { getBusinessContext } from "@/lib/business";
import { getDayAgenda, getUpcomingAppointments } from "@/lib/booking/queries";
import {
  dateKeyInZone,
  formatPrice,
  formatShortDate,
  formatShortDay,
  formatTime,
  isValidDateKey,
  shiftDateKey,
  todayKey,
  weekBounds,
} from "@/lib/date";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Resumen",
};

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string; error?: string }>;
}) {
  const { membership } = await getBusinessContext();

  // El layout resuelve el estado "cuenta sin negocio"; acá solo se tipa.
  if (!membership) return null;

  const { business } = membership;
  const { fecha, error } = await searchParams;
  const timezone = business.timezone;
  const currentKey = todayKey(timezone);
  const referenceKey = fecha && isValidDateKey(fecha) ? fecha : currentKey;
  const { startKey, endKeyInclusive, start, end } = weekBounds(
    referenceKey,
    timezone,
  );

  const [weekAppointments, upcoming, employees] = await Promise.all([
    getDayAgenda(business.id, start, end),
    getUpcomingAppointments(business.id, new Date()),
    listEmployees(business.id),
  ]);

  const count = (status: (typeof weekAppointments)[number]["status"]) =>
    weekAppointments.filter((item) => item.status === status).length;

  const activeWeek = weekAppointments.filter(
    (item) => item.status !== "CANCELLED",
  );
  const pending = count("PENDING");
  const confirmed = count("CONFIRMED");
  const cancelled = count("CANCELLED");
  const estimated = activeWeek
    .filter((item) => item.status !== "NO_SHOW")
    .reduce((total, item) => total + item.priceCents, 0);

  const byEmployee = new Map<string, number>();
  for (const item of activeWeek) {
    byEmployee.set(item.employeeId, (byEmployee.get(item.employeeId) ?? 0) + 1);
  }

  const workload = employees
    .filter((employee) => employee.isActive)
    .map((employee) => ({
      id: employee.id,
      name: employee.displayName ?? `${employee.firstName} ${employee.lastName}`,
      color: employee.color,
      count: byEmployee.get(employee.id) ?? 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const maxCount = Math.max(1, ...workload.map((row) => row.count));

  const statusRows = [
    { label: "Confirmados", value: confirmed, dot: "bg-success" },
    { label: "Pendientes", value: pending, dot: "bg-warning" },
    { label: "Completados", value: count("COMPLETED"), dot: "bg-ink/40" },
    { label: "Cancelados", value: cancelled, dot: "bg-danger" },
    { label: "Ausentes", value: count("NO_SHOW"), dot: "bg-danger/60" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium tracking-[0.2em] text-ink-muted uppercase">
            Panel
          </p>
          <h1 className="mt-2 font-display text-3xl leading-tight font-semibold tracking-[var(--theme-tracking-display)]">
            Resumen de la semana
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Semana del {formatShortDate(startKey, timezone)} al{" "}
            {formatShortDate(endKeyInclusive, timezone)} · {activeWeek.length}{" "}
            {activeWeek.length === 1 ? "turno activo" : "turnos activos"}
          </p>
        </div>

        <nav aria-label="Cambiar de semana" className="flex items-center gap-2">
          <Link
            href={`/admin?fecha=${shiftDateKey(startKey, -7)}`}
            aria-label="Semana anterior"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "px-2.5")}
          >
            <ChevronLeft className="size-4" />
          </Link>

          {referenceKey !== currentKey ? (
            <Link
              href="/admin"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Esta semana
            </Link>
          ) : null}

          <Link
            href={`/admin?fecha=${shiftDateKey(startKey, 7)}`}
            aria-label="Semana siguiente"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "px-2.5")}
          >
            <ChevronRight className="size-4" />
          </Link>

          <Link href="/admin/turnos" className={buttonVariants({ size: "sm" })}>
            Agenda
          </Link>
        </nav>
      </div>

      {error === "permiso" ? (
        <p
          role="alert"
          className="mt-6 rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-[13px] text-danger"
        >
          Tu rol no permite modificar el catálogo ni los turnos.
        </p>
      ) : null}

      <section aria-label="Resumen de la semana" className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Turnos", value: String(activeWeek.length), hint: "Sin cancelados" },
          { label: "Pendientes", value: String(pending), hint: "Falta confirmar" },
          { label: "Confirmados", value: String(confirmed), hint: "Asistencia prevista" },
          {
            label: "Estimado",
            value: formatPrice(estimated, business.currency, business.locale),
            hint: "Facturación de la semana",
          },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-line bg-surface p-5 shadow-card">
            <p className="text-[11px] font-medium tracking-[0.18em] text-ink-muted uppercase">
              {item.label}
            </p>
            <p className="mt-3 font-display text-3xl leading-none font-semibold tabular-nums">
              {item.value}
            </p>
            <p className="mt-2 text-[12px] text-ink-muted">{item.hint}</p>
          </div>
        ))}
      </section>

      <div className="mt-8 grid gap-4 xl:grid-cols-[1fr_320px]">
        <section className="overflow-hidden rounded-lg border border-line bg-surface shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <h2 className="font-display text-lg leading-tight font-semibold tracking-[var(--theme-tracking-display)]">
                Próximos turnos
              </h2>
              <p className="mt-0.5 text-[12px] text-ink-muted">
                {upcoming.length === 0
                  ? "No hay turnos confirmados hacia adelante"
                  : `Los ${upcoming.length} próximos con horario ocupado`}
              </p>
            </div>
            <Link
              href="/admin/turnos"
              className="text-[12px] font-medium text-primary hover:underline"
            >
              Ver agenda →
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <p className="font-display text-xl font-semibold tracking-[var(--theme-tracking-display)]">
                Agenda despejada
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
                No hay turnos pendientes ni confirmados a partir de ahora. Las
                reservas nuevas van a aparecer acá.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line text-[10px] tracking-[0.12em] text-ink-muted uppercase">
                    <th scope="col" className="px-4 py-2.5 font-medium">Fecha</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Cliente</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Servicio</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Profesional</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Estado</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((appointment) => {
                    const meta = appointmentStatusMeta[appointment.status];
                    const dayKey = dateKeyInZone(appointment.startsAt, timezone);
                    const employee =
                      appointment.employee.displayName ??
                      `${appointment.employee.firstName} ${appointment.employee.lastName}`;

                    return (
                      <tr
                        key={appointment.id}
                        className="border-b border-line/70 text-[12.5px] last:border-0"
                      >
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <Link
                            href={`/admin/turnos?fecha=${dayKey}`}
                            className="font-medium hover:underline"
                          >
                            {formatShortDay(appointment.startsAt, timezone)}
                          </Link>
                          <span className="ml-1.5 font-mono text-[11.5px] text-ink-muted tabular-nums">
                            {formatTime(appointment.startsAt, timezone)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-medium">
                          {appointment.customer.firstName} {appointment.customer.lastName}
                        </td>
                        <td className="px-4 py-2.5 text-ink-muted">
                          {appointment.service.name}
                        </td>
                        <td className="px-4 py-2.5 text-ink-muted">
                          <span className="mr-1.5 inline-block size-1.5 rounded-full align-middle" style={{ backgroundColor: appointment.employee.color }} />
                          {employee}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge tone={meta.tone} size="sm">
                            {meta.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {formatPrice(appointment.priceCents, appointment.currency, business.locale)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="space-y-4">
          <section className="rounded-lg border border-line bg-surface p-5 shadow-card">
            <h2 className="font-display text-lg leading-tight font-semibold tracking-[var(--theme-tracking-display)]">
              Carga por profesional
            </h2>
            <p className="mt-0.5 text-[12px] text-ink-muted">
              Turnos activos de la semana
            </p>

            {workload.every((row) => row.count === 0) ? (
              <p className="mt-4 text-[12px] leading-relaxed text-ink-muted">
                No hay turnos activos esta semana.
              </p>
            ) : (
              <ul className="mt-4 space-y-3.5">
                {workload.filter((row) => row.count > 0).map((row) => (
                  <li key={row.id}>
                    <div className="flex items-center justify-between gap-2 text-[12px]">
                      <span className="truncate text-ink-muted">{row.name}</span>
                      <span className="font-medium tabular-nums">{row.count}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(row.count / maxCount) * 100}%`,
                          backgroundColor: row.color,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-line bg-surface p-5 shadow-card">
            <h2 className="font-display text-lg leading-tight font-semibold tracking-[var(--theme-tracking-display)]">
              Estado de la agenda
            </h2>
            <ul className="mt-4 space-y-2">
              {statusRows.map((row) => (
                <li key={row.label} className="flex items-center gap-2 text-[12px]">
                  <span aria-hidden="true" className={cn("size-1.5 rounded-full", row.dot)} />
                  <span className="flex-1 text-ink-muted">{row.label}</span>
                  <span className="font-medium tabular-nums">{row.value}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[11px] leading-relaxed text-ink-muted">
              Los totales corresponden a la semana elegida, del {formatShortDate(startKey, timezone)} al {formatShortDate(endKeyInclusive, timezone)}.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
