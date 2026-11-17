import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { appointmentStatusMeta } from "@/lib/appointments";
import { listEmployees } from "@/lib/admin/queries";
import {
  getDayAgenda,
  getHolidaysInRange,
  type DayAppointment,
} from "@/lib/booking/queries";
import {
  dateKeyInZone,
  dateToDateKey,
  formatPrice,
  formatShortDate,
  formatTime,
  formatWeekdayShort,
  shiftDateKey,
  weekBounds,
} from "@/lib/date";
import { cn } from "@/lib/utils";

type Business = {
  id: string;
  timezone: string;
  currency: string;
  locale: string;
};

type Group = {
  id: string;
  name: string;
  color: string | null;
  byDay: Map<string, DayAppointment[]>;
};

const statusTextClass: Record<string, string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  neutral: "text-ink-muted",
  primary: "text-primary",
  accent: "text-accent",
  outline: "text-ink-muted",
};

const statusDotClass: Record<string, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-ink/40",
  primary: "bg-primary",
  accent: "bg-accent",
  outline: "bg-ink-muted",
};

/**
 * Agenda semanal del panel: siete columnas por profesional.
 *
 * Consulta el mismo rango `[lunes, lunes siguiente)` que el dashboard y
 * agrupa con los datos del snapshot del turno. Los feriados se traen en una
 * sola consulta para marcar la cabecera de cada día.
 */
export async function WeekAgenda({
  business,
  referenceKey,
  currentKey,
}: {
  business: Business;
  referenceKey: string;
  currentKey: string;
}) {
  const week = weekBounds(referenceKey, business.timezone);
  const [appointments, employees, holidays] = await Promise.all([
    getDayAgenda(business.id, week.start, week.end),
    listEmployees(business.id),
    getHolidaysInRange(business.id, week.startKey, week.endKey),
  ]);

  const days = Array.from({ length: 7 }, (_, index) =>
    shiftDateKey(week.startKey, index),
  );
  const holidayMap = new Map(
    holidays.map((holiday) => [dateToDateKey(holiday.date), holiday]),
  );

  const roster = employees
    .filter((employee) => employee.isActive)
    .map((employee) => ({
      id: employee.id,
      name:
        employee.displayName ??
        `${employee.firstName} ${employee.lastName}`.trim(),
      color: employee.color,
    }));

  // Un turno puede pertenecer a un profesional dado de baja. Se muestra en un
  // grupo adicional para que no desaparezca de la agenda histórica.
  const extra = new Map<string, Group>();
  for (const appointment of appointments) {
    if (
      roster.some((person) => person.id === appointment.employeeId) ||
      extra.has(appointment.employeeId)
    ) {
      continue;
    }

    extra.set(appointment.employeeId, {
      id: appointment.employeeId,
      name:
        appointment.employee.displayName ??
        `${appointment.employee.firstName} ${appointment.employee.lastName}`.trim(),
      color: appointment.employee.color,
      byDay: new Map(days.map((day) => [day, []])),
    });
  }

  const groups: Group[] = [...roster, ...extra.values()].map((person) => ({
    ...person,
    byDay: new Map(days.map((day) => [day, []])),
  }));
  const groupById = new Map(groups.map((group) => [group.id, group]));

  for (const appointment of appointments) {
    const dayKey = dateKeyInZone(appointment.startsAt, business.timezone);
    groupById.get(appointment.employeeId)?.byDay.get(dayKey)?.push(appointment);
  }

  const active = appointments.filter(
    (appointment) => appointment.status !== "CANCELLED",
  );
  const pending = appointments.filter(
    (appointment) => appointment.status === "PENDING",
  ).length;
  const confirmed = appointments.filter(
    (appointment) => appointment.status === "CONFIRMED",
  ).length;
  const estimated = active
    .filter((appointment) => appointment.status !== "NO_SHOW")
    .reduce((total, appointment) => total + appointment.priceCents, 0);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium tracking-[0.2em] text-ink-muted uppercase">
            Agenda · Semana
          </p>
          <h1 className="mt-2 font-display text-3xl leading-tight font-semibold tracking-[var(--theme-tracking-display)]">
            Semana del {formatShortDate(week.startKey, business.timezone)} al{" "}
            {formatShortDate(week.endKeyInclusive, business.timezone)}
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            {appointments.length === 0
              ? "Sin movimientos en esta semana"
              : `${active.length} ${active.length === 1 ? "turno activo" : "turnos activos"} · ${pending} pendientes`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            className="inline-flex h-9 items-center rounded-md border border-line bg-surface-2 p-0.5 text-[12px]"
            role="group"
            aria-label="Vista de la agenda"
          >
            <Link
              href={`/admin/turnos?vista=dia&fecha=${referenceKey}`}
              aria-current={undefined}
              className="rounded px-2.5 py-1 text-ink-muted hover:text-ink"
            >
              Día
            </Link>
            <Link
              href={`/admin/turnos?vista=semana&fecha=${referenceKey}`}
              aria-current="page"
              className="rounded bg-surface px-2.5 py-1 font-medium text-ink shadow-sm"
            >
              Semana
            </Link>
          </div>

          <Link
            href="/admin/turnos/nuevo"
            className={buttonVariants({ size: "sm" })}
          >
            Nuevo turno
          </Link>

          <nav aria-label="Cambiar de semana" className="flex items-center gap-2">
            <Link
              href={`/admin/turnos?vista=semana&fecha=${shiftDateKey(week.startKey, -7)}`}
              aria-label="Semana anterior"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "px-2.5",
              )}
            >
              <ChevronLeft className="size-4" />
            </Link>

            {referenceKey !== currentKey ? (
              <Link
                href="/admin/turnos?vista=semana"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Hoy
              </Link>
            ) : null}

            <Link
              href={`/admin/turnos?vista=semana&fecha=${shiftDateKey(week.startKey, 7)}`}
              aria-label="Semana siguiente"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "px-2.5",
              )}
            >
              <ChevronRight className="size-4" />
            </Link>
          </nav>
        </div>
      </div>

      <section
        aria-label="Resumen de la semana"
        className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        {[
          { label: "Turnos", value: String(active.length), hint: "Sin cancelados" },
          { label: "Confirmados", value: String(confirmed), hint: "Asistencia prevista" },
          { label: "Pendientes", value: String(pending), hint: "Falta confirmar" },
          {
            label: "Estimado",
            value: formatPrice(estimated, business.currency, business.locale),
            hint: "Facturación de la semana",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-line bg-surface p-5"
          >
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

      {appointments.length === 0 ? (
        <p
          role="status"
          className="mt-6 rounded-md border border-line bg-surface px-4 py-3 text-[13px] text-ink-muted"
        >
          No hay turnos en esta semana. Probá con otra fecha desde la navegación
          o cargá uno con «Nuevo turno».
        </p>
      ) : null}

      <section
        aria-label="Agenda semanal por profesional"
        className="mt-6 space-y-4"
      >
        {groups.map((group) => {
          const count = days.reduce(
            (total, day) => total + (group.byDay.get(day)?.length ?? 0),
            0,
          );

          return (
            <section
              key={group.id}
              aria-labelledby={`profesional-${group.id}`}
              className="overflow-hidden rounded-lg border border-line bg-surface shadow-card"
            >
              <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
                <h2
                  id={`profesional-${group.id}`}
                  className="flex items-center gap-2 text-[13px] font-semibold"
                >
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-full"
                    style={{
                      backgroundColor: group.color ?? "var(--theme-primary)",
                    }}
                  />
                  {group.name}
                </h2>
                <span className="text-[11px] text-ink-muted">
                  {count} {count === 1 ? "turno" : "turnos"}
                </span>
              </div>

              <div className="grid grid-cols-1 divide-y divide-line md:grid-cols-7 md:divide-x md:divide-y-0">
                {days.map((day) => {
                  const items = group.byDay.get(day) ?? [];
                  const holiday = holidayMap.get(day);
                  const isToday = day === currentKey;

                  return (
                    <div
                      key={day}
                      className={cn("min-w-0 p-2.5", isToday && "bg-primary/5")}
                    >
                      <div className="flex items-start justify-between gap-1 border-b border-line/70 pb-2">
                        <Link
                          href={`/admin/turnos?vista=dia&fecha=${day}`}
                          className="group/day"
                        >
                          <span className="block text-[9px] font-medium tracking-[0.12em] text-ink-muted uppercase">
                            {formatWeekdayShort(day, business.timezone)}
                          </span>
                          <span
                            className={cn(
                              "font-display text-base leading-tight font-semibold tabular-nums group-hover/day:text-primary",
                              isToday && "text-primary",
                            )}
                          >
                            {Number(day.slice(8))}
                          </span>
                        </Link>

                        {holiday?.isClosed ? (
                          <Badge tone="warning" size="sm" shape="pill">
                            Feriado
                          </Badge>
                        ) : null}
                      </div>

                      {items.length === 0 ? (
                        <p className="py-3 text-center text-[10px] text-ink-muted/60">
                          —
                        </p>
                      ) : (
                        <ol className="mt-2 space-y-1.5">
                          {items.map((appointment) => {
                            const meta = appointmentStatusMeta[appointment.status];
                            const isCancelled =
                              appointment.status === "CANCELLED";
                            const customer =
                              `${appointment.customer.firstName} ${appointment.customer.lastName}`.trim();

                            return (
                              <li key={appointment.id}>
                                <Link
                                  href={`/admin/turnos?vista=dia&fecha=${day}`}
                                  className={cn(
                                    "block rounded-sm border border-line bg-surface-2/50 px-2 py-1.5 transition-colors hover:border-primary",
                                    isCancelled && "opacity-50",
                                  )}
                                >
                                  <span className="flex items-center justify-between gap-1">
                                    <time
                                      dateTime={appointment.startsAt.toISOString()}
                                      className="font-mono text-[10px] tabular-nums text-ink-muted"
                                    >
                                      {formatTime(appointment.startsAt, business.timezone)}
                                    </time>
                                    <span
                                      className={cn(
                                        "text-[9px] font-medium",
                                        statusTextClass[meta.tone],
                                      )}
                                    >
                                      {meta.label}
                                    </span>
                                  </span>
                                  <span
                                    className={cn(
                                      "mt-0.5 block truncate text-[11px] font-medium",
                                      isCancelled && "line-through",
                                    )}
                                    title={customer}
                                  >
                                    {customer}
                                  </span>
                                  <span
                                    className="block truncate text-[10px] text-ink-muted"
                                    title={appointment.service.name}
                                  >
                                    {appointment.service.name}
                                  </span>
                                </Link>
                              </li>
                            );
                          })}
                        </ol>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </section>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4 text-[10px] text-ink-muted">
        <span className="font-medium text-ink">Estados</span>
        {(["CONFIRMED", "PENDING", "COMPLETED", "CANCELLED", "NO_SHOW"] as const).map(
          (status) => (
            <span key={status} className="inline-flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className={cn(
                  "size-1.5 rounded-full",
                  statusDotClass[appointmentStatusMeta[status].tone],
                )}
              />
              {appointmentStatusMeta[status].label}
            </span>
          ),
        )}
        <span className="ml-auto">
          Los turnos cancelados se atenúan y no cuentan como activos.
        </span>
      </div>
    </div>
  );
}
