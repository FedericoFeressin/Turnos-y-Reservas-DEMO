import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { AdminShell } from "@/components/admin/admin-shell";
import type { Concept } from "@/lib/concepts";
import {
  adminMetrics,
  calendarAppointments,
  calendarTimes,
  currency,
  staff,
  todayAppointments,
  weekColumns,
  type AppointmentStatus,
} from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const statusMeta: Record<
  AppointmentStatus,
  { label: string; tone: "success" | "warning" | "danger" | "neutral" | "primary" }
> = {
  CONFIRMED: { label: "Confirmado", tone: "success" },
  PENDING: { label: "Pendiente", tone: "warning" },
  CANCELLED: { label: "Cancelado", tone: "danger" },
  COMPLETED: { label: "Completado", tone: "neutral" },
  NO_SHOW: { label: "Ausente", tone: "danger" },
};

const employeeColors = [
  "var(--theme-primary)",
  "var(--theme-accent)",
  "color-mix(in oklab, var(--theme-primary) 55%, var(--theme-ink))",
];

export function AdminDashboardView({ concept }: { concept: Concept }) {
  return (
    <AdminShell
      concept={concept}
      active="dashboard"
      title="Jueves 13 de noviembre"
      description={`${todayAppointments.length} turnos agendados · 3 pendientes de confirmar`}
      action={
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line px-3 text-[12px] text-ink-muted"
          >
            <Filter className="size-3.5" /> Filtros
          </button>
          <span className="inline-flex h-9 items-center gap-1.5 rounded-md bg-surface-2 px-3 text-[12px] text-ink-muted">
            <CalendarDays className="size-3.5" /> Hoy
          </span>
        </div>
      }
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {adminMetrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-lg border border-line bg-surface p-4 shadow-card"
          >
            <p className="text-[11px] font-medium tracking-[0.1em] text-ink-muted uppercase">
              {metric.label}
            </p>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <p className="font-display text-2xl leading-none font-semibold">
                {metric.value}
              </p>
              {metric.trend ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 text-[11px] font-medium",
                    metric.trend.startsWith("+") ? "text-success" : "text-danger",
                  )}
                >
                  {metric.trend.startsWith("+") ? (
                    <ArrowUpRight className="size-3" />
                  ) : (
                    <ArrowDownRight className="size-3" />
                  )}
                  {metric.trend}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-[11px] text-ink-muted">{metric.detail}</p>
          </div>
        ))}
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_320px]">
        <section className="overflow-hidden rounded-lg border border-line bg-surface shadow-card">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-[13px] font-semibold">Turnos de hoy</h2>
            <span className="text-[11px] text-ink-muted">Ver todos</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line text-[10px] tracking-[0.12em] text-ink-muted uppercase">
                  <th className="px-4 py-2.5 font-medium">Hora</th>
                  <th className="px-4 py-2.5 font-medium">Cliente</th>
                  <th className="px-4 py-2.5 font-medium">Servicio</th>
                  <th className="px-4 py-2.5 font-medium">Prof.</th>
                  <th className="px-4 py-2.5 font-medium">Estado</th>
                  <th className="px-4 py-2.5 text-right font-medium">Importe</th>
                </tr>
              </thead>
              <tbody>
                {todayAppointments.map((appointment, index) => {
                  const meta = statusMeta[appointment.status];
                  return (
                    <tr
                      key={`${appointment.time}-${appointment.customer}`}
                      className={cn(
                        "border-b border-line/70 text-[12.5px] last:border-0",
                        index < 2 && "text-ink-muted",
                      )}
                    >
                      <td className="px-4 py-2.5 font-mono text-[11.5px]">
                        {appointment.time}
                      </td>
                      <td className="px-4 py-2.5 font-medium">{appointment.customer}</td>
                      <td className="px-4 py-2.5 text-ink-muted">{appointment.service}</td>
                      <td className="px-4 py-2.5 text-ink-muted">{appointment.employee}</td>
                      <td className="px-4 py-2.5">
                        <Badge tone={meta.tone} size="sm">
                          {meta.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-right">{currency.format(appointment.price)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-4">
          <section className="rounded-lg border border-line bg-surface p-4 shadow-card">
            <h2 className="text-[13px] font-semibold">Ocupación por profesional</h2>
            <ul className="mt-4 space-y-3.5">
              {[
                { name: staff[0]?.name, value: 82, color: employeeColors[0] },
                { name: staff[1]?.name, value: 74, color: employeeColors[1] },
                { name: staff[2]?.name, value: 61, color: employeeColors[2] },
              ].map((row) => (
                <li key={row.name}>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-ink-muted">{row.name?.split(" ")[0]}</span>
                    <span className="font-medium">{row.value}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${row.value}%`, backgroundColor: row.color }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-line bg-surface p-4 shadow-card">
            <h2 className="text-[13px] font-semibold">Estado de la agenda</h2>
            <ul className="mt-3 space-y-2">
              {[
                { label: "Confirmados", value: 9, tone: "bg-success" },
                { label: "Pendientes", value: 3, tone: "bg-warning" },
                { label: "Completados", value: 2, tone: "bg-ink/40" },
                { label: "Cancelados", value: 1, tone: "bg-danger" },
              ].map((row) => (
                <li key={row.label} className="flex items-center gap-2 text-[12px]">
                  <span className={cn("size-1.5 rounded-full", row.tone)} />
                  <span className="flex-1 text-ink-muted">{row.label}</span>
                  <span className="font-medium">{row.value}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 flex items-start gap-1.5 rounded-md bg-surface-2 p-2.5 text-[11px] leading-relaxed text-ink-muted">
              <Clock className="mt-0.5 size-3 shrink-0" />
              Próximo turno en 25 minutos: Ignacio Sosa, perfilado de barba.
            </p>
          </section>
        </div>
      </div>
    </AdminShell>
  );
}

const ROW_HEIGHT = 44;

export function AdminCalendarView({ concept }: { concept: Concept }) {
  return (
    <AdminShell
      concept={concept}
      active="turnos"
      title="Agenda"
      description="Semana del 10 al 15 de noviembre · 6 días · 3 profesionales"
      action={
        <div className="flex items-center gap-2">
          <div className="flex h-9 items-center rounded-md border border-line text-[12px]">
            <span className="px-2.5 text-ink-muted">Día</span>
            <span className="rounded-sm bg-primary px-2.5 py-1.5 font-medium text-primary-fg">
              Semana
            </span>
            <span className="px-2.5 text-ink-muted">Mes</span>
          </div>
          <div className="flex h-9 items-center rounded-md border border-line">
            <button type="button" aria-label="Semana anterior" className="grid size-8 place-items-center text-ink-muted">
              <ChevronLeft className="size-3.5" />
            </button>
            <span className="border-x border-line px-2.5 text-[12px]">Hoy</span>
            <button type="button" aria-label="Semana siguiente" className="grid size-8 place-items-center text-ink-muted">
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      }
    >
      {/* Desktop: grilla semanal */}
      <section className="hidden overflow-hidden rounded-lg border border-line bg-surface shadow-card md:block">
        <div className="overflow-x-auto">
          <div className="min-w-[780px]">
            <div className="flex border-b border-line">
              <div className="w-16 shrink-0" />
              {weekColumns.map((day, index) => {
                const isToday = index === 2;
                return (
                  <div
                    key={day}
                    className={cn(
                      "flex-1 border-l border-line px-2 py-2.5 text-center",
                      isToday && "bg-primary/5",
                    )}
                  >
                    <p
                      className={cn(
                        "text-[11px]",
                        isToday ? "font-semibold text-primary" : "text-ink-muted",
                      )}
                    >
                      {day}
                    </p>
                    <p className="mt-0.5 text-[10px] text-ink-muted">
                      {calendarAppointments.filter((a) => a.day === index).length} turnos
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="flex">
              <div className="w-16 shrink-0">
                {calendarTimes.map((time) => (
                  <div key={time} style={{ height: ROW_HEIGHT }} className="relative">
                    <span className="absolute -top-1.5 right-2 font-mono text-[9.5px] text-ink-muted">
                      {time}
                    </span>
                  </div>
                ))}
              </div>

              {weekColumns.map((day, dayIndex) => (
                <div
                  key={day}
                  className="relative flex-1 border-l border-line"
                  style={{
                    height: calendarTimes.length * ROW_HEIGHT,
                    backgroundImage: `repeating-linear-gradient(to bottom, var(--theme-line) 0 1px, transparent 1px ${ROW_HEIGHT}px)`,
                  }}
                >
                  {calendarAppointments
                    .filter((a) => a.day === dayIndex)
                    .map((appointment, i) => {
                      const rowIndex = calendarTimes.indexOf(appointment.time);
                      const span = Math.max(1, Math.ceil(appointment.duration / 30));
                      const canceled = appointment.status === "CANCELLED";
                      const noShow = appointment.status === "NO_SHOW";
                      return (
                        <div
                          key={`${appointment.time}-${appointment.customer}-${i}`}
                          className={cn(
                            "absolute inset-x-1 overflow-hidden rounded-sm border-l-[3px] px-1.5 py-1 text-[10px] leading-tight",
                            (canceled || noShow) && "opacity-45",
                          )}
                          style={{
                            top: rowIndex * ROW_HEIGHT + 2,
                            height: span * ROW_HEIGHT - 4,
                            borderLeftColor: employeeColors[appointment.employee] ?? employeeColors[0],
                            backgroundColor: `color-mix(in oklab, ${employeeColors[appointment.employee] ?? employeeColors[0]} 12%, var(--theme-surface))`,
                          }}
                        >
                          <p className="font-mono text-[9px] opacity-70">{appointment.time}</p>
                          <p className={cn("truncate font-medium", canceled && "line-through")}>
                            {appointment.customer}
                          </p>
                          <p className="truncate opacity-70">{appointment.service}</p>
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 border-t border-line px-4 py-2.5 text-[10px] text-ink-muted">
          {staff.map((person, index) => (
            <span key={person.id} className="inline-flex items-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: employeeColors[index] }}
              />
              {person.name}
            </span>
          ))}
          <span className="ml-auto inline-flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-sm border border-dashed border-ink-muted" />
            Pendiente
          </span>
        </div>
      </section>

      {/* Mobile: agenda */}
      <section className="space-y-4 md:hidden">
        {weekColumns.map((day, dayIndex) => {
          const items = calendarAppointments.filter((a) => a.day === dayIndex);
          if (items.length === 0) return null;
          return (
            <div key={day} className="rounded-lg border border-line bg-surface">
              <div className="border-b border-line px-4 py-2.5">
                <p className="text-[12px] font-semibold">{day}</p>
                <p className="text-[10px] text-ink-muted">{items.length} turnos</p>
              </div>
              <ul className="divide-y divide-line/70">
                {items.map((appointment, i) => {
                  const meta = statusMeta[appointment.status];
                  return (
                    <li
                      key={`${appointment.time}-${appointment.customer}-${i}`}
                      className="flex items-center gap-3 px-4 py-2.5"
                    >
                      <span className="font-mono text-[11px] text-ink-muted">
                        {appointment.time}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-medium">
                          {appointment.customer}
                        </p>
                        <p className="truncate text-[11px] text-ink-muted">
                          {appointment.service} · {staff[appointment.employee]?.name.split(" ")[0]}
                        </p>
                      </div>
                      <Badge tone={meta.tone} size="sm">
                        {meta.label}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </section>
    </AdminShell>
  );
}
