import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { controlClass } from "@/components/ui/field";
import { canManage } from "@/lib/admin/guard";
import { listBusinessSchedule, listHolidays } from "@/lib/admin/queries";
import { getBusinessContext } from "@/lib/business";
import { formatDateOnly, minutesToTime, todayKey } from "@/lib/date";
import { cn } from "@/lib/utils";

import {
  addBusinessScheduleAction,
  addHolidayAction,
  removeBusinessScheduleAction,
  removeHolidayAction,
} from "./actions";
import { BusinessForm } from "./business-form";

export const metadata: Metadata = {
  title: "Configuración",
};

const sections = [
  { id: "datos", label: "Datos" },
  { id: "horarios", label: "Horarios" },
  { id: "feriados", label: "Feriados" },
] as const;

type Section = (typeof sections)[number]["id"];

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

const okMessages: Record<string, string> = {
  datos: "Datos del negocio actualizados.",
  "franja-agregada": "Franja agregada al horario de atención.",
  "franja-eliminada": "Franja eliminada del horario de atención.",
  "feriado-agregado": "Feriado agregado.",
  "feriado-eliminado": "Feriado eliminado.",
};

const errorMessages: Record<string, string> = {
  horario: "Revisá el horario: el fin debe ser posterior al inicio.",
  superpuesto: "Esa franja se superpone con otra del mismo día.",
  franja: "Esa franja ya no existe.",
  feriado: "Revisá la fecha y el nombre del feriado.",
  "feriado-duplicado": "Ya hay un feriado cargado en esa fecha.",
  "feriado-inexistente": "Ese feriado ya no existe.",
  permiso: "Tu rol no permite modificar la configuración.",
};

function hoursLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ seccion?: string; ok?: string; error?: string }>;
}) {
  const { membership } = await getBusinessContext();

  if (!membership) return null;

  const { business } = membership;
  const { seccion, ok, error } = await searchParams;

  const current: Section = sections.some((section) => section.id === seccion)
    ? (seccion as Section)
    : "datos";

  const [businessSchedule, holidays] = await Promise.all([
    listBusinessSchedule(business.id),
    listHolidays(business.id),
  ]);

  const manageable = canManage(membership.role);
  const today = todayKey(business.timezone);

  const rangesByDay = new Map<
    number,
    { id: string; startMinute: number; endMinute: number }[]
  >();

  for (const range of businessSchedule) {
    const list = rangesByDay.get(range.dayOfWeek) ?? [];
    list.push(range);
    rangesByDay.set(range.dayOfWeek, list);
  }

  const weeklyMinutes = businessSchedule.reduce(
    (total, range) => total + range.endMinute - range.startMinute,
    0,
  );

  const okMessage = ok ? okMessages[ok] : undefined;
  const errorMessage = error ? errorMessages[error] : undefined;

  const profileItems = [
    { label: "Nombre", value: business.name },
    { label: "Razón social", value: business.legalName },
    { label: "CUIT", value: business.taxId },
    { label: "Email", value: business.email },
    { label: "Teléfono", value: business.phone },
    { label: "WhatsApp", value: business.whatsapp },
    {
      label: "Instagram",
      value: business.instagram
        ? `@${business.instagram.replace(/^@+/, "")}`
        : null,
    },
    { label: "Sitio web", value: business.website },
    { label: "Dirección", value: business.addressLine },
    { label: "Ciudad", value: business.city },
    { label: "Provincia", value: business.province },
    { label: "Código postal", value: business.postalCode },
    { label: "País", value: business.country },
    { label: "Zona horaria", value: business.timezone },
    { label: "Moneda", value: business.currency },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium tracking-[0.2em] text-ink-muted uppercase">
            Negocio
          </p>
          <h1 className="mt-2 font-display text-3xl leading-tight font-semibold tracking-[var(--theme-tracking-display)]">
            Configuración
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink-muted">
            Los datos que ve el cliente, el horario general de atención y los
            días en que el negocio no abre.
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

      <nav
        aria-label="Secciones de configuración"
        className="mt-6 flex gap-1 overflow-x-auto border-b border-line"
      >
        {sections.map((section) => {
          const active = section.id === current;

          return (
            <Link
              key={section.id}
              href={`/admin/configuracion?seccion=${section.id}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 px-3 py-2.5 text-[13px] whitespace-nowrap transition-colors",
                active
                  ? "border-primary font-medium text-primary"
                  : "border-transparent text-ink-muted hover:text-ink",
              )}
            >
              {section.label}
            </Link>
          );
        })}
      </nav>

      {current === "datos" ? (
        <section className="mt-6 rounded-lg border border-line bg-surface p-5 sm:p-6">
          <h2 className="font-display text-lg leading-tight font-semibold tracking-[var(--theme-tracking-display)]">
            Datos del negocio
          </h2>
          <p className="mt-1 text-[12px] text-ink-muted">
            Estos datos aparecen en la página pública de reservas.
          </p>
          {manageable ? (
            <BusinessForm business={business} />
          ) : (
            <dl className="mt-5 grid gap-x-6 gap-y-4 text-[13px] sm:grid-cols-2">
              {profileItems.map((item) => (
                <div key={item.label}>
                  <dt className="text-[11px] tracking-wide text-ink-muted uppercase">
                    {item.label}
                  </dt>
                  <dd className="mt-0.5 text-ink">{item.value || "—"}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      ) : null}

      {current === "horarios" ? (
        <section className="mt-6 rounded-lg border border-line bg-surface">
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-display text-lg leading-tight font-semibold tracking-[var(--theme-tracking-display)]">
              Horario de atención
            </h2>
            <p className="mt-0.5 text-[12px] text-ink-muted">
              Franjas generales del negocio, en la zona {business.timezone}. Los
              horarios de cada profesional se cargan en{" "}
              <Link
                href="/admin/horarios"
                className="text-ink underline decoration-line underline-offset-4"
              >
                Horarios
              </Link>
              .
            </p>
          </div>

          <div className="flex items-center justify-between px-5 pt-4">
            <p className="text-[11px] font-medium tracking-[0.18em] text-ink-muted uppercase">
              Semana
            </p>
            <p className="text-[12px] text-ink-muted tabular-nums">
              {hoursLabel(weeklyMinutes)} por semana
            </p>
          </div>

          <div className="mt-3 divide-y divide-line border-t border-line">
            {week.map((day) => {
              const ranges = rangesByDay.get(day) ?? [];
              const dayMinutes = ranges.reduce(
                (total, range) => total + range.endMinute - range.startMinute,
                0,
              );

              return (
                <div
                  key={day}
                  className="flex flex-wrap items-start gap-x-4 gap-y-3 px-5 py-3"
                >
                  <div className="w-28 shrink-0">
                    <p className="text-[13px] font-medium text-ink">
                      {dayNames[day]}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-muted tabular-nums">
                      {ranges.length === 0 ? "Cerrado" : hoursLabel(dayMinutes)}
                    </p>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    {ranges.length === 0 ? (
                      <span className="text-[12px] text-ink-muted">
                        Sin atención
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
                            <form action={removeBusinessScheduleAction}>
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
                      action={addBusinessScheduleAction}
                      className="flex w-full flex-wrap items-center gap-2 sm:w-auto"
                    >
                      <input type="hidden" name="dayOfWeek" value={day} />
                      <label className="sr-only" htmlFor={`business-start-${day}`}>
                        Hora de apertura del {dayNames[day]}
                      </label>
                      <input
                        id={`business-start-${day}`}
                        name="start"
                        type="time"
                        required
                        defaultValue="09:00"
                        className={cn(controlClass, "h-9 w-28 px-2")}
                      />
                      <span aria-hidden="true" className="text-ink-muted">
                        –
                      </span>
                      <label className="sr-only" htmlFor={`business-end-${day}`}>
                        Hora de cierre del {dayNames[day]}
                      </label>
                      <input
                        id={`business-end-${day}`}
                        name="end"
                        type="time"
                        required
                        defaultValue="18:00"
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
        </section>
      ) : null}

      {current === "feriados" ? (
        <section className="mt-6 overflow-hidden rounded-lg border border-line bg-surface">
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-display text-lg leading-tight font-semibold tracking-[var(--theme-tracking-display)]">
              Feriados y cierres
            </h2>
            <p className="mt-0.5 text-[12px] text-ink-muted">
              Días puntuales en que el negocio no abre. No cancela turnos ya
              agendados.
            </p>
          </div>

          {manageable ? (
            <form
              action={addHolidayAction}
              className="grid gap-3 border-b border-line bg-background/40 px-5 py-5 sm:grid-cols-2 lg:grid-cols-[10rem_1fr_auto]"
            >
              <div className="space-y-1.5">
                <label
                  htmlFor="holiday-date"
                  className="block text-[12px] font-medium text-ink"
                >
                  Fecha
                </label>
                <input
                  id="holiday-date"
                  name="date"
                  type="date"
                  required
                  min={today}
                  className={cn(controlClass, "h-10")}
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="holiday-name"
                  className="block text-[12px] font-medium text-ink"
                >
                  Nombre
                </label>
                <input
                  id="holiday-name"
                  name="name"
                  required
                  maxLength={80}
                  className={cn(controlClass, "h-10")}
                  placeholder="Feriado nacional"
                />
              </div>

              <div className="flex items-end">
                <Button type="submit" size="sm" className="h-10">
                  Agregar
                </Button>
              </div>

              <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                <label
                  htmlFor="holiday-notes"
                  className="block text-[12px] font-medium text-ink"
                >
                  Detalle (opcional)
                </label>
                <input
                  id="holiday-notes"
                  name="notes"
                  maxLength={300}
                  className={cn(controlClass, "h-10")}
                  placeholder="Cierre por refacción, feriado trasladable…"
                />
              </div>

              <label className="flex items-center gap-2 text-[13px] text-ink sm:col-span-2 lg:col-span-3">
                <input
                  type="checkbox"
                  name="isClosed"
                  defaultChecked
                  className="size-4 accent-primary"
                />
                El negocio permanece cerrado
              </label>
            </form>
          ) : null}

          {holidays.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="font-display text-lg font-semibold tracking-[var(--theme-tracking-display)]">
                Sin feriados cargados
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
                Cuando el negocio cierre un día puntual, cargalo acá para que no
                se ofrezcan turnos.
              </p>
            </div>
          ) : (
            <ul>
              {holidays.map((holiday) => (
                <li
                  key={holiday.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-5 py-3.5 last:border-b-0"
                >
                  <div className="w-40 shrink-0">
                    <p className="text-[13px] font-medium text-ink">
                      {formatDateOnly(holiday.date)}
                    </p>
                    <Badge tone={holiday.isClosed ? "danger" : "neutral"} size="sm">
                      {holiday.isClosed ? "Cerrado" : "Abierto"}
                    </Badge>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-ink">
                      {holiday.name}
                    </p>
                    {holiday.notes ? (
                      <p className="mt-0.5 text-[12px] text-ink-muted">
                        {holiday.notes}
                      </p>
                    ) : null}
                  </div>

                  {manageable ? (
                    <form action={removeHolidayAction}>
                      <input type="hidden" name="id" value={holiday.id} />
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
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
