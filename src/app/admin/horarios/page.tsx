import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { controlClass } from "@/components/ui/field";
import type { TimeOffType } from "@/generated/prisma/enums";
import { canManage } from "@/lib/admin/guard";
import { listScheduleBoard, listTimeOff } from "@/lib/admin/queries";
import { getBusinessContext } from "@/lib/business";
import {
  dateKeyInZone,
  formatHistoryDate,
  minutesToTime,
  todayKey,
} from "@/lib/date";
import { cn } from "@/lib/utils";

import {
  addScheduleAction,
  addTimeOffAction,
  removeScheduleAction,
  removeTimeOffAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Horarios",
};

const dayNames = [
  "",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
] as const;

const week = [1, 2, 3, 4, 5, 6, 7] as const;

const timeOffTypeMeta: Record<
  TimeOffType,
  { label: string; tone: "primary" | "warning" | "neutral" | "accent" | "danger" }
> = {
  VACATION: { label: "Vacaciones", tone: "primary" },
  SICK: { label: "Licencia médica", tone: "warning" },
  PERSONAL: { label: "Personal", tone: "neutral" },
  TRAINING: { label: "Capacitación", tone: "accent" },
  CLOSURE: { label: "Cierre", tone: "danger" },
};

const timeOffTypes: TimeOffType[] = [
  "PERSONAL",
  "VACATION",
  "SICK",
  "TRAINING",
  "CLOSURE",
];

const okMessages: Record<string, string> = {
  "franja-agregada": "Franja agregada al horario.",
  "franja-eliminada": "Franja eliminada del horario.",
  "ausencia-creada": "Ausencia registrada.",
  "ausencia-eliminada": "Ausencia eliminada.",
};

const errorMessages: Record<string, string> = {
  horario: "Revisá el horario: el fin debe ser posterior al inicio.",
  superpuesto: "Esa franja se superpone con otra del mismo día.",
  profesional: "Ese profesional ya no existe.",
  fechas: "Revisá las fechas: el fin no puede ser anterior al inicio.",
  franja: "Esa franja ya no existe.",
  ausencia: "Esa ausencia ya no existe.",
  permiso: "Tu rol no permite modificar horarios ni ausencias.",
};

function hoursLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

function employeeName(employee: {
  firstName: string;
  lastName: string | null;
  displayName: string | null;
}): string {
  return (
    employee.displayName ??
    `${employee.firstName} ${employee.lastName ?? ""}`.trim()
  );
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ empleado?: string; ok?: string; error?: string }>;
}) {
  const { membership } = await getBusinessContext();

  if (!membership) return null;

  const { business } = membership;
  const { empleado, ok, error } = await searchParams;

  const [employees, timeOff] = await Promise.all([
    listScheduleBoard(business.id),
    listTimeOff(business.id),
  ]);

  const manageable = canManage(membership.role);
  const today = todayKey(business.timezone);
  const now = new Date();

  const selected =
    employees.find((employee) => employee.id === empleado) ??
    employees.find((employee) => employee.isActive && employee.isBookable) ??
    employees[0] ??
    null;

  const rangesByDay = new Map<number, { id: string; startMinute: number; endMinute: number }[]>();

  for (const range of selected?.schedules ?? []) {
    const list = rangesByDay.get(range.dayOfWeek) ?? [];
    list.push(range);
    rangesByDay.set(range.dayOfWeek, list);
  }

  const weeklyMinutes = (selected?.schedules ?? []).reduce(
    (total, range) => total + range.endMinute - range.startMinute,
    0,
  );

  const upcomingTimeOff = timeOff.filter((item) => item.endsAt > now);
  const pastTimeOff = timeOff
    .filter((item) => item.endsAt <= now)
    .reverse();

  const okMessage = ok ? okMessages[ok] : undefined;
  const errorMessage = error ? errorMessages[error] : undefined;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium tracking-[0.2em] text-ink-muted uppercase">
            Disponibilidad
          </p>
          <h1 className="mt-2 font-display text-3xl leading-tight font-semibold tracking-[var(--theme-tracking-display)]">
            Horarios y ausencias
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink-muted">
            Cuándo atiende cada profesional y qué días no está disponible. Los
            turnos ya agendados no se mueven al cambiar el horario.
          </p>
        </div>

        {!manageable ? (
          <Badge tone="neutral" size="sm">
            Solo lectura
          </Badge>
        ) : null}
      </div>

      {okMessage ? (
        <p
          role="status"
          className="mt-6 rounded-md border border-success/30 bg-success/5 px-3 py-2 text-[13px] text-success"
        >
          {okMessage}
        </p>
      ) : null}

      {errorMessage ? (
        <p
          role="alert"
          className="mt-6 rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-[13px] text-danger"
        >
          {errorMessage}
        </p>
      ) : null}

      {employees.length === 0 ? (
        <section className="mt-6 rounded-lg border border-line bg-surface px-5 py-14 text-center">
          <p className="font-display text-xl font-semibold tracking-[var(--theme-tracking-display)]">
            Todavía no hay profesionales
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
            Cargá el equipo en{" "}
            <Link
              href="/admin/equipo?editar=nuevo"
              className="text-ink underline decoration-line underline-offset-4"
            >
              Equipo
            </Link>{" "}
            para poder definir sus horarios.
          </p>
        </section>
      ) : (
        <>
          <section className="mt-6 rounded-lg border border-line bg-surface">
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-display text-lg leading-tight font-semibold tracking-[var(--theme-tracking-display)]">
                Horario semanal
              </h2>
              <p className="mt-0.5 text-[12px] text-ink-muted">
                Horas en la zona del negocio: {business.timezone}
              </p>
            </div>

            <div className="flex gap-1 overflow-x-auto border-b border-line px-3 py-2">
              {employees.map((employee) => {
                const active = employee.id === selected?.id;
                const minutes = employee.schedules.reduce(
                  (total, range) => total + range.endMinute - range.startMinute,
                  0,
                );

                return (
                  <Link
                    key={employee.id}
                    href={`/admin/horarios?empleado=${employee.id}`}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-[13px] whitespace-nowrap transition-colors",
                      active
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-ink-muted hover:bg-surface-2 hover:text-ink",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="size-2 rounded-full"
                      style={{ backgroundColor: employee.color }}
                    />
                    {employeeName(employee)}
                    <span className="text-[11px] text-ink-muted">
                      {hoursLabel(minutes)}
                    </span>
                  </Link>
                );
              })}
            </div>

            {selected ? (
              <div className="px-5 py-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-ink">
                    {employeeName(selected)}
                    {selected.isActive ? null : (
                      <span className="ml-2 text-[11px] font-normal text-ink-muted">
                        (inactivo)
                      </span>
                    )}
                  </p>
                  <p className="text-[12px] text-ink-muted tabular-nums">
                    {hoursLabel(weeklyMinutes)} por semana
                  </p>
                </div>

                <div className="mt-4 divide-y divide-line rounded-md border border-line">
                  {week.map((day) => {
                    const ranges = rangesByDay.get(day) ?? [];
                    const dayMinutes = ranges.reduce(
                      (total, range) => total + range.endMinute - range.startMinute,
                      0,
                    );

                    return (
                      <div
                        key={day}
                        className="flex flex-wrap items-start gap-x-4 gap-y-3 px-4 py-3"
                      >
                        <div className="w-28 shrink-0">
                          <p className="text-[13px] font-medium text-ink">
                            {dayNames[day]}
                          </p>
                          <p className="mt-0.5 text-[11px] text-ink-muted tabular-nums">
                            {ranges.length === 0 ? "Sin atención" : hoursLabel(dayMinutes)}
                          </p>
                        </div>

                        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                          {ranges.length === 0 ? (
                            <span className="text-[12px] text-ink-muted">
                              Libre todo el día
                            </span>
                          ) : (
                            ranges.map((range) => (
                              <span
                                key={range.id}
                                className="inline-flex items-center gap-1 rounded-sm bg-surface-2 py-1 pr-1 pl-2 text-[12px] text-ink tabular-nums"
                              >
                                {minutesToTime(range.startMinute)}–
                                {minutesToTime(range.endMinute)}
                                {manageable ? (
                                  <form action={removeScheduleAction}>
                                    <input type="hidden" name="id" value={range.id} />
                                    <button
                                      type="submit"
                                      aria-label={`Quitar ${dayNames[day]} de ${minutesToTime(range.startMinute)} a ${minutesToTime(range.endMinute)}`}
                                      className="grid size-5 place-items-center rounded-sm text-ink-muted transition-colors hover:bg-danger/10 hover:text-danger"
                                    >
                                      ×
                                    </button>
                                  </form>
                                ) : null}
                              </span>
                            ))
                          )}
                        </div>

                        {manageable ? (
                          <form
                            action={addScheduleAction}
                            className="flex w-full flex-wrap items-center gap-2 sm:w-auto"
                          >
                            <input type="hidden" name="employeeId" value={selected.id} />
                            <input type="hidden" name="dayOfWeek" value={day} />
                            <label className="sr-only" htmlFor={`start-${day}`}>
                              Hora de inicio del {dayNames[day]}
                            </label>
                            <input
                              id={`start-${day}`}
                              name="start"
                              type="time"
                              required
                              defaultValue="09:00"
                              className={cn(controlClass, "h-9 w-28 px-2")}
                            />
                            <span aria-hidden="true" className="text-ink-muted">
                              –
                            </span>
                            <label className="sr-only" htmlFor={`end-${day}`}>
                              Hora de fin del {dayNames[day]}
                            </label>
                            <input
                              id={`end-${day}`}
                              name="end"
                              type="time"
                              required
                              defaultValue="13:00"
                              className={cn(controlClass, "h-9 w-28 px-2")}
                            />
                            <Button type="submit" variant="outline" size="sm">
                              Agregar
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </section>

          <section
            id="ausencias"
            className="mt-8 overflow-hidden rounded-lg border border-line bg-surface"
          >
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-display text-lg leading-tight font-semibold tracking-[var(--theme-tracking-display)]">
                Ausencias y cierres
              </h2>
              <p className="mt-0.5 text-[12px] text-ink-muted">
                Días completos sin atención. No cancela turnos ya agendados:
                revisá la agenda antes de cargar una ausencia.
              </p>
            </div>

            {manageable ? (
              <form
                action={addTimeOffAction}
                className="grid gap-3 border-b border-line bg-background/40 px-5 py-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_10rem_10rem_auto]"
              >
                <div className="space-y-1.5">
                  <label
                    htmlFor="time-off-employee"
                    className="block text-[12px] font-medium text-ink"
                  >
                    Alcance
                  </label>
                  <select
                    id="time-off-employee"
                    name="employeeId"
                    defaultValue=""
                    className={cn(controlClass, "h-10")}
                  >
                    <option value="">Todo el negocio</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employeeName(employee)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="time-off-type"
                    className="block text-[12px] font-medium text-ink"
                  >
                    Motivo
                  </label>
                  <select
                    id="time-off-type"
                    name="type"
                    defaultValue="PERSONAL"
                    className={cn(controlClass, "h-10")}
                  >
                    {timeOffTypes.map((type) => (
                      <option key={type} value={type}>
                        {timeOffTypeMeta[type].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="time-off-start"
                    className="block text-[12px] font-medium text-ink"
                  >
                    Desde
                  </label>
                  <input
                    id="time-off-start"
                    name="startDate"
                    type="date"
                    required
                    defaultValue={today}
                    className={cn(controlClass, "h-10")}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="time-off-end"
                    className="block text-[12px] font-medium text-ink"
                  >
                    Hasta
                  </label>
                  <input
                    id="time-off-end"
                    name="endDate"
                    type="date"
                    required
                    defaultValue={today}
                    className={cn(controlClass, "h-10")}
                  />
                </div>

                <div className="flex items-end">
                  <Button type="submit" size="sm" className="h-10">
                    Registrar
                  </Button>
                </div>

                <div className="space-y-1.5 sm:col-span-2 lg:col-span-5">
                  <label
                    htmlFor="time-off-reason"
                    className="block text-[12px] font-medium text-ink"
                  >
                    Detalle (opcional)
                  </label>
                  <input
                    id="time-off-reason"
                    name="reason"
                    maxLength={300}
                    className={cn(controlClass, "h-10")}
                    placeholder="Vacaciones, congreso, cierre por refacción…"
                  />
                </div>
              </form>
            ) : null}

            {timeOff.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="font-display text-lg font-semibold tracking-[var(--theme-tracking-display)]">
                  Sin ausencias registradas
                </p>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
                  Cuando alguien se tome vacaciones o el negocio cierre, cargalo
                  acá para que no se ofrezcan turnos.
                </p>
              </div>
            ) : (
              <div>
                {upcomingTimeOff.length > 0 ? (
                  <TimeOffList
                    title="Próximas"
                    items={upcomingTimeOff}
                    timezone={business.timezone}
                    manageable={manageable}
                  />
                ) : null}
                {pastTimeOff.length > 0 ? (
                  <TimeOffList
                    title="Pasadas"
                    items={pastTimeOff}
                    timezone={business.timezone}
                    manageable={manageable}
                  />
                ) : null}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function TimeOffList({
  title,
  items,
  timezone,
  manageable,
}: {
  title: string;
  items: Awaited<ReturnType<typeof listTimeOff>>;
  timezone: string;
  manageable: boolean;
}) {
  const now = new Date();

  return (
    <div className="border-b border-line last:border-b-0">
      <p className="bg-background/40 px-5 py-2 text-[11px] font-medium tracking-[0.18em] text-ink-muted uppercase">
        {title}
      </p>
      <ul>
        {items.map((item) => {
          const meta = timeOffTypeMeta[item.type];
          const endInclusive = new Date(item.endsAt.getTime() - 1);
          const sameDay =
            dateKeyInZone(item.startsAt, timezone) ===
            dateKeyInZone(endInclusive, timezone);

          const range = sameDay
            ? formatHistoryDate(item.startsAt, timezone)
            : `${formatHistoryDate(item.startsAt, timezone)} → ${formatHistoryDate(
                endInclusive,
                timezone,
              )}`;

          const status =
            item.endsAt <= now
              ? { label: "Finalizada", tone: "neutral" as const }
              : item.startsAt <= now
                ? { label: "En curso", tone: "warning" as const }
                : { label: "Próxima", tone: "primary" as const };

          return (
            <li
              key={item.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-5 py-3.5 last:border-b-0"
            >
              <Badge tone={meta.tone} size="sm">
                {meta.label}
              </Badge>

              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-ink">{range}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-ink-muted">
                  {item.employee ? (
                    <>
                      <span
                        aria-hidden="true"
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: item.employee.color }}
                      />
                      {employeeName(item.employee)}
                    </>
                  ) : (
                    "Todo el negocio"
                  )}
                  {item.reason ? ` · ${item.reason}` : null}
                </p>
              </div>

              <Badge tone={status.tone} size="sm">
                {status.label}
              </Badge>

              {manageable ? (
                <form action={removeTimeOffAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="text-ink-muted"
                  >
                    Eliminar
                  </Button>
                </form>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
