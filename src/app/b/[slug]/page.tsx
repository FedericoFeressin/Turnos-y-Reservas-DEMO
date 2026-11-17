import { randomUUID } from "node:crypto";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Clock3, Scissors, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  ANY_STAFF,
  availabilityStrip,
  groupSlots,
  slotsForDate,
  type AvailabilitySource,
  type Slot,
} from "@/lib/booking/availability";
import {
  getAvailabilitySource,
  getPublicBusiness,
  getPublicCatalog,
} from "@/lib/booking/public";
import {
  formatDurationMinutes,
  formatLongDate,
  formatPrice,
  isoDayOfWeek,
  isValidDateKey,
  todayKey,
} from "@/lib/date";
import { cn } from "@/lib/utils";

import { BookingForm } from "./booking-form";

const DATE_DAYS = 21;
const weekdayShort = ["", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const steps = [
  { id: 1, label: "Servicio" },
  { id: 2, label: "Profesional" },
  { id: 3, label: "Fecha y hora" },
  { id: 4, label: "Tus datos" },
] as const;

export default async function PublicBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    servicio?: string;
    profesional?: string;
    fecha?: string;
    hora?: string;
  }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const business = await getPublicBusiness(slug);

  if (!business) notFound();

  const settings = business.settings;
  const businessSlug = business.slug;
  const { services, employees } = await getPublicCatalog(business.id);

  function href(selection: {
    servicio?: string;
    profesional?: string;
    fecha?: string;
    hora?: string;
  }): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(selection)) {
      if (value) params.set(key, value);
    }
    const suffix = params.toString();
    return `/b/${businessSlug}${suffix ? `?${suffix}` : ""}`;
  }

  if (!settings?.allowGuestBooking || services.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-lg border border-line bg-surface px-6 py-14 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-[var(--theme-tracking-display)]">
          Reservas no disponibles
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          {!settings?.allowGuestBooking
            ? "Por ahora las reservas se hacen por teléfono."
            : "Todavía no hay servicios publicados. Volvé en otro momento."}
        </p>
        {business.phone ? (
          <a
            href={`tel:${business.phone.replace(/\s/g, "")}`}
            className="mt-6 inline-flex rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-fg"
          >
            Llamar a {business.phone}
          </a>
        ) : null}
      </div>
    );
  }

  const serviceId = query.servicio ?? "";
  const service = services.find((item) => item.id === serviceId) ?? null;
  const eligible = service
    ? employees.filter((person) => person.serviceIds.includes(service.id))
    : [];

  const staffVisible = settings.showStaffSelection && eligible.length > 1;
  const requestedStaff = query.profesional ?? ANY_STAFF;

  let employeeId: string;
  if (!staffVisible) {
    employeeId =
      settings.allowChooseAnyStaff || eligible.length === 0
        ? ANY_STAFF
        : eligible[0].id;
  } else if (requestedStaff === ANY_STAFF && settings.allowChooseAnyStaff) {
    employeeId = ANY_STAFF;
  } else if (eligible.some((person) => person.id === requestedStaff)) {
    employeeId = requestedStaff;
  } else {
    employeeId = settings.allowChooseAnyStaff ? ANY_STAFF : eligible[0]?.id ?? ANY_STAFF;
  }

  const selectedEmployee = eligible.find((person) => person.id === employeeId);
  const employeeLabel =
    employeeId === ANY_STAFF
      ? "Cualquier profesional disponible"
      : (selectedEmployee?.displayName ??
        [selectedEmployee?.firstName, selectedEmployee?.lastName]
          .filter(Boolean)
          .join(" "));

  const dateParam = query.fecha ?? "";
  const timeParam = query.hora ?? "";
  const dateKey = isValidDateKey(dateParam) ? dateParam : "";

  let source: AvailabilitySource | null = null;
  let strip: ReturnType<typeof availabilityStrip> = [];
  let slots: Slot[] = [];

  if (service && eligible.length > 0) {
    source = await getAvailabilitySource({
      businessId: business.id,
      employeeIds: eligible.map((person) => person.id),
      fromKey: todayKey(business.timezone),
      days: DATE_DAYS,
      timezone: business.timezone,
      settings,
    });

    const ids = employeeId === ANY_STAFF ? eligible.map((person) => person.id) : [employeeId];
    strip = availabilityStrip(source, service, ids, DATE_DAYS);

    if (dateKey && strip.some((day) => day.dateKey === dateKey && day.selectable)) {
      if (employeeId === ANY_STAFF) {
        const times = new Map<number, string>();
        for (const id of ids) {
          for (const slot of slotsForDate(source, dateKey, service, id)) {
            times.set(slot.minutes, slot.time);
          }
        }
        slots = [...times.entries()]
          .sort((a, b) => a[0] - b[0])
          .map(([minutes, time]) => ({ minutes, time }));
      } else {
        slots = slotsForDate(source, dateKey, service, employeeId);
      }
    }
  }

  const selectedSlot = slots.find((slot) => slot.time === timeParam) ?? null;
  const invalidDate = Boolean(dateParam) && !dateKey;
  const closedDate = Boolean(dateKey) && !strip.some((day) => day.dateKey === dateKey && day.selectable);
  const activeStep = !service ? 1 : !employeeId || (staffVisible && !query.profesional) ? 2 : !dateKey ? 3 : !selectedSlot ? 3 : 4;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-xl">
          <p className="text-[11px] font-medium tracking-[0.2em] text-ink-muted uppercase">
            {business.name}
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight font-semibold tracking-[var(--theme-tracking-display)] sm:text-5xl">
            Reservá tu turno
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Elegí el servicio, quién te atiende y el horario que mejor te quede.
            No hace falta crear una cuenta.
          </p>
        </div>

        <ol className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-muted">
          {steps.map((step) => {
            const done = step.id < activeStep;
            const current = step.id === activeStep;
            return (
              <li
                key={step.id}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "inline-flex items-center gap-1.5",
                  current && "font-medium text-primary",
                  done && "text-ink",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-5 place-items-center rounded-full border text-[10px] tabular-nums",
                    current
                      ? "border-primary bg-primary text-primary-fg"
                      : done
                        ? "border-primary text-primary"
                        : "border-line",
                  )}
                >
                  {done ? <Check className="size-3" strokeWidth={2.5} /> : step.id}
                </span>
                {step.label}
              </li>
            );
          })}
        </ol>
      </div>

      {!service ? (
        <section aria-labelledby="servicios-title">
          <div className="flex items-center gap-2">
            <Scissors className="size-4 text-ink-muted" strokeWidth={1.75} />
            <h2 id="servicios-title" className="font-display text-2xl font-semibold tracking-[var(--theme-tracking-display)]">
              ¿Qué necesitás?
            </h2>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {services.map((item) => (
              <Link
                key={item.id}
                href={href({ servicio: item.id })}
                className="group flex flex-col justify-between rounded-lg border border-line bg-surface p-5 transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-lg leading-tight font-semibold tracking-[var(--theme-tracking-display)]">
                      {item.name}
                    </h3>
                    {settings.showPrices ? (
                      <span className="shrink-0 text-sm font-medium text-ink tabular-nums">
                        {formatPrice(item.priceCents, business.currency, business.locale)}
                      </span>
                    ) : null}
                  </div>
                  {item.description ? (
                    <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
                      {item.description}
                    </p>
                  ) : null}
                </div>
                <p className="mt-4 inline-flex items-center gap-1.5 text-[11px] tracking-wide text-ink-muted uppercase">
                  <Clock3 className="size-3.5" strokeWidth={1.75} />
                  {formatDurationMinutes(item.durationMinutes)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <>
          <section aria-label="Selección actual" className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-surface px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
              <span className="font-medium text-ink">{service.name}</span>
              <span aria-hidden="true" className="text-line">·</span>
              <span className="text-ink-muted">{employeeLabel}</span>
              {dateKey ? (
                <>
                  <span aria-hidden="true" className="text-line">·</span>
                  <span className="text-ink-muted">{formatLongDate(dateKey, business.timezone)}</span>
                </>
              ) : null}
            </div>
            <Link
              href={href({})}
              className="inline-flex items-center gap-1 text-[13px] text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <ArrowLeft className="size-3.5" strokeWidth={1.75} />
              Otro servicio
            </Link>
          </section>

          {staffVisible ? (
            <section aria-labelledby="profesional-title">
              <div className="flex items-center gap-2">
                <UserRound className="size-4 text-ink-muted" strokeWidth={1.75} />
                <h2 id="profesional-title" className="font-display text-2xl font-semibold tracking-[var(--theme-tracking-display)]">
                  ¿Quién te atiende?
                </h2>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {settings.allowChooseAnyStaff ? (
                  <StaffCard
                    active={employeeId === ANY_STAFF}
                    color="var(--theme-primary)"
                    name="Cualquiera"
                    detail="Elegimos quién esté libre"
                    href={href({ servicio: service.id, profesional: ANY_STAFF })}
                  />
                ) : null}
                {eligible.map((person) => (
                  <StaffCard
                    key={person.id}
                    active={employeeId === person.id}
                    color={person.color}
                    name={person.displayName ?? `${person.firstName} ${person.lastName}`}
                    detail={person.title ?? "Profesional"}
                    href={href({ servicio: service.id, profesional: person.id })}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section aria-labelledby="fecha-title">
            <h2 id="fecha-title" className="font-display text-2xl font-semibold tracking-[var(--theme-tracking-display)]">
              Elegí el día
            </h2>
            <p className="mt-1 text-[12px] text-ink-muted">
              Mostramos los próximos {DATE_DAYS} días. Los turnos necesitan{" "}
              {formatDurationMinutes(settings.minAdvanceMinutes)} de anticipación.
            </p>

            {invalidDate || closedDate ? (
              <p role="alert" className="mt-4 rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-[13px] text-warning">
                Esa fecha no está disponible. Elegí otro día.
              </p>
            ) : null}

            <div className="mt-5 -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
              {strip.map((day) => {
                const selected = day.dateKey === dateKey;
                const disabled = !day.selectable || day.count === 0;
                const weekday = weekdayShort[isoDayOfWeek(day.dateKey)];
                const dayNumber = Number(day.dateKey.slice(8));
                const month = Number(day.dateKey.slice(5, 7));
                // Sin `aria-label`: el nombre accesible surge del contenido,
                // así coincide con el texto visible (axe lo exige). El detalle
                // extra va en `sr-only` dentro del enlace posicionado.
                const visibleAvailability = day.closed
                  ? "Cerrado"
                  : day.count === 0
                    ? "—"
                    : `${day.count} libres`;
                const announcedDetail = day.closed
                  ? "cerrado"
                  : day.count === 0
                    ? "sin horarios"
                    : `${day.count} horarios libres`;

                return (
                  <Link
                    key={day.dateKey}
                    href={disabled ? href({}) : href({ servicio: service.id, profesional: employeeId, fecha: day.dateKey })}
                    aria-disabled={disabled || undefined}
                    aria-current={selected ? "date" : undefined}
                    className={cn(
                      "relative flex w-16 shrink-0 flex-col items-center rounded-md border px-2 py-3 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                      selected
                        ? "border-primary bg-primary text-primary-fg"
                        : disabled
                          ? "cursor-not-allowed border-line bg-surface text-ink-muted/50"
                          : "border-line bg-surface text-ink hover:border-primary",
                    )}
                  >
                    <span className="text-[10px] tracking-wide uppercase opacity-80">
                      {weekday}
                    </span>
                    <span className="mt-1 text-lg leading-none font-semibold tabular-nums">
                      {dayNumber}
                    </span>
                    <span className={cn("mt-1.5 text-[9px]", selected ? "opacity-80" : "text-ink-muted")}>
                      {visibleAvailability}
                    </span>
                    <span className="sr-only">
                      {`de ${month}: ${announcedDetail}`}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          {dateKey && !closedDate ? (
            <section aria-labelledby="hora-title">
              <h2 id="hora-title" className="font-display text-2xl font-semibold tracking-[var(--theme-tracking-display)]">
                Elegí la hora
              </h2>
              <p className="mt-1 text-[12px] text-ink-muted">
                {formatLongDate(dateKey, business.timezone)} · hora de {business.name}
              </p>

              {slots.length === 0 ? (
                <div className="mt-5 rounded-lg border border-dashed border-line bg-surface px-5 py-10 text-center">
                  <p className="font-display text-lg font-semibold tracking-[var(--theme-tracking-display)]">
                    No hay horarios libres
                  </p>
                  <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-ink-muted">
                    Probá con otro día o con otro profesional.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-5">
                  {groupSlots(slots).map((group) => (
                    <div key={group.label}>
                      <p className="text-[11px] font-medium tracking-[0.18em] text-ink-muted uppercase">
                        {group.label}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {group.slots.map((slot) => {
                          const selected = slot.time === timeParam;
                          return (
                            <Link
                              key={slot.time}
                              href={href({ servicio: service.id, profesional: employeeId, fecha: dateKey, hora: slot.time })}
                              aria-current={selected ? "true" : undefined}
                              className={cn(
                                "min-w-20 rounded-md border px-3 py-2 text-center text-[13px] tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                                selected
                                  ? "border-primary bg-primary text-primary-fg"
                                  : "border-line bg-surface text-ink hover:border-primary",
                              )}
                            >
                              {slot.time}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {selectedSlot ? (
            <BookingForm
              summary={{
                slug: business.slug,
                serviceId: service.id,
                employeeId,
                employeeLabel,
                dateKey,
                time: selectedSlot.time,
                clientRequestId: randomUUID(),
                serviceName: service.name,
                durationLabel: formatDurationMinutes(service.durationMinutes),
                priceLabel: settings.showPrices
                  ? formatPrice(service.priceCents, business.currency, business.locale)
                  : null,
                dateLabel: formatLongDate(dateKey, business.timezone),
                cancellationPolicy:
                  settings.cancellationPolicyText ??
                  "Cancelá con al menos 24 horas de anticipación.",
              }}
            />
          ) : null}
        </>
      )}

      {settings.bookingPolicyText ? (
        <p className="border-t border-line pt-6 text-center text-[12px] text-ink-muted">
          {settings.bookingPolicyText}
        </p>
      ) : null}
    </div>
  );
}

function StaffCard({
  active,
  color,
  name,
  detail,
  href,
}: {
  active: boolean;
  color: string;
  name: string;
  detail: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-surface p-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        active ? "border-primary" : "border-line hover:border-primary",
      )}
    >
      <span
        aria-hidden="true"
        className="grid size-10 shrink-0 place-items-center rounded-full text-[13px] font-medium text-white"
        style={{ backgroundColor: color }}
      >
        {name.charAt(0)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium text-ink">{name}</span>
        <span className="mt-0.5 block truncate text-[11px] text-ink-muted">{detail}</span>
      </span>
      {active ? <Badge tone="neutral" size="sm" className="ml-auto">Elegido</Badge> : null}
    </Link>
  );
}
