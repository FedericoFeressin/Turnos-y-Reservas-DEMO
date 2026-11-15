import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { appointmentStatusMeta } from "@/lib/appointments";
import { getBusinessContext } from "@/lib/business";
import {
  getBusinessSchedule,
  getDayAgenda,
  getHoliday,
} from "@/lib/booking/queries";
import {
  dateKeyToUtcDate,
  dayBounds,
  formatLongDate,
  formatPrice,
  formatTime,
  isValidDateKey,
  isoDayOfWeek,
  minutesToTime,
  shiftDateKey,
  todayKey,
} from "@/lib/date";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Agenda",
};

export default async function AdminAgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string; error?: string }>;
}) {
  const { membership } = await getBusinessContext();

  // El layout resuelve el estado "cuenta sin negocio"; acá solo se tipa.
  if (!membership) return null;

  const { business } = membership;
  const { fecha, error } = await searchParams;

  const currentKey = todayKey(business.timezone);
  const dateKey = fecha && isValidDateKey(fecha) ? fecha : currentKey;
  const { start, end } = dayBounds(dateKey, business.timezone);

  const [appointments, holiday, schedule] = await Promise.all([
    getDayAgenda(business.id, start, end),
    getHoliday(business.id, dateKeyToUtcDate(dateKey)),
    getBusinessSchedule(business.id, isoDayOfWeek(dateKey)),
  ]);

  const isHoliday = holiday?.isClosed === true;
  const isClosed = isHoliday || schedule.length === 0;

  const active = appointments.filter((item) => item.status !== "CANCELLED");
  const confirmed = appointments.filter((item) => item.status === "CONFIRMED").length;
  const pending = appointments.filter((item) => item.status === "PENDING").length;
  const estimated = active
    .filter((item) => item.status !== "NO_SHOW")
    .reduce((total, item) => total + item.priceCents, 0);

  const scheduleLabel = schedule
    .map((range) => `${minutesToTime(range.startMinute)}–${minutesToTime(range.endMinute)}`)
    .join(" · ");

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium tracking-[0.2em] text-ink-muted uppercase">
            Agenda{dateKey === currentKey ? " · Hoy" : null}
          </p>
          <h1 className="mt-2 font-display text-3xl leading-tight font-semibold tracking-[var(--theme-tracking-display)]">
            {formatLongDate(dateKey, business.timezone)}
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            {isClosed ? "Cerrado" : `Atiende ${scheduleLabel}`}
          </p>
        </div>

        <nav aria-label="Cambiar de día" className="flex items-center gap-2">
          <Link
            href={`/admin?fecha=${shiftDateKey(dateKey, -1)}`}
            aria-label="Día anterior"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "px-2.5")}
          >
            <ChevronLeft className="size-4" />
          </Link>

          {dateKey !== currentKey ? (
            <Link
              href="/admin"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Hoy
            </Link>
          ) : null}

          <Link
            href={`/admin?fecha=${shiftDateKey(dateKey, 1)}`}
            aria-label="Día siguiente"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "px-2.5")}
          >
            <ChevronRight className="size-4" />
          </Link>
        </nav>
      </div>

      {error === "permiso" ? (
        <p
          role="alert"
          className="mt-6 rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-[13px] text-danger"
        >
          Tu rol no permite modificar el catálogo ni el equipo.
        </p>
      ) : null}

      <section aria-label="Resumen del día" className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Turnos", value: String(active.length), hint: "Sin cancelados" },
          { label: "Confirmados", value: String(confirmed), hint: "Asistencia prevista" },
          { label: "Pendientes", value: String(pending), hint: "Falta confirmar" },
          {
            label: "Estimado",
            value: formatPrice(estimated, business.currency, business.locale),
            hint: "Turnos no cancelados",
          },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-line bg-surface p-5">
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

      <section className="mt-8 overflow-hidden rounded-lg border border-line bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="font-display text-lg leading-tight font-semibold tracking-[var(--theme-tracking-display)]">
              Turnos del día
            </h2>
            <p className="mt-0.5 text-[12px] text-ink-muted">
              {appointments.length === 0
                ? "Sin movimientos registrados"
                : `${appointments.length} en agenda`}
            </p>
          </div>

          {isHoliday ? (
            <Badge tone="warning" size="sm">
              Feriado
            </Badge>
          ) : isClosed ? (
            <Badge tone="neutral" size="sm">
              Cerrado
            </Badge>
          ) : null}
        </div>

        {isHoliday ? (
          <DayMessage
            title="El negocio no atiende"
            description={`${holiday?.name ?? "Feriado"}. No se ofrecen turnos este día; podés elegir otra fecha desde la navegación.`}
          />
        ) : isClosed ? (
          <DayMessage
            title="Día cerrado"
            description="No hay horario de atención cargado para este día. Revisá los horarios del negocio o elegí otra fecha."
          />
        ) : appointments.length === 0 ? (
          <DayMessage
            title="Sin turnos agendados"
            description="La agenda del día está libre. Cuando se carguen reservas van a aparecer acá."
          />
        ) : (
          <ol>
            {appointments.map((appointment) => {
              const meta = appointmentStatusMeta[appointment.status];
              const isCancelled = appointment.status === "CANCELLED";
              const customer = `${appointment.customer.firstName} ${appointment.customer.lastName}`;
              const employee =
                appointment.employee.displayName ??
                `${appointment.employee.firstName} ${appointment.employee.lastName}`;

              return (
                <li
                  key={appointment.id}
                  className={cn(
                    "flex flex-wrap items-start gap-x-4 gap-y-3 border-b border-line px-5 py-4 last:border-b-0",
                    isCancelled && "opacity-55",
                  )}
                >
                  <div className="w-16 shrink-0">
                    <p className="font-display text-base leading-none font-semibold tabular-nums">
                      {formatTime(appointment.startsAt, business.timezone)}
                    </p>
                    <p className="mt-1.5 text-[11px] text-ink-muted tabular-nums">
                      {formatTime(appointment.endsAt, business.timezone)}
                    </p>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{customer}</p>
                    <p className="mt-0.5 text-[12px] text-ink-muted">
                      {appointment.service.name} · {appointment.durationMinutes} min
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-muted">
                      <span
                        aria-hidden="true"
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: appointment.employee.color }}
                      />
                      {employee}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[12px] text-ink-muted tabular-nums">
                      {formatPrice(
                        appointment.priceCents,
                        appointment.currency,
                        business.locale,
                      )}
                    </span>
                    <Badge tone={meta.tone} size="sm">
                      {meta.label}
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}

function DayMessage({ title, description }: { title: string; description: string }) {
  return (
    <div className="px-5 py-14 text-center">
      <p className="font-display text-xl font-semibold tracking-[var(--theme-tracking-display)]">
        {title}
      </p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
        {description}
      </p>
    </div>
  );
}
