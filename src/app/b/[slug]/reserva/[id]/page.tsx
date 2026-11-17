import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarPlus, CalendarX, Check, Clock3, Phone, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { appointmentStatusMeta } from "@/lib/appointments";
import type { AppointmentEventType } from "@/generated/prisma/enums";
import { canCancelAppointment, cancellationDeadline } from "@/lib/booking/cancellation";
import {
  bookingCode,
  getPublicAppointment,
  getPublicBusiness,
} from "@/lib/booking/public";
import { createCancellationToken } from "@/lib/booking/token";
import {
  dateKeyInZone,
  formatDurationMinutes,
  formatHistoryDate,
  formatLongDate,
  formatPrice,
  formatTime,
} from "@/lib/date";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Turno reservado",
};

const eventLabels: Record<AppointmentEventType, string> = {
  CREATED: "Turno creado",
  CONFIRMED: "Turno confirmado",
  RESCHEDULED: "Turno reprogramado",
  STATUS_CHANGED: "Estado actualizado",
  CANCELLED: "Turno cancelado",
  COMPLETED: "Turno completado",
  NO_SHOW: "Cliente ausente",
  NOTE_ADDED: "Nota agregada",
};

function googleCalendarUrl({
  title,
  details,
  start,
  end,
}: {
  title: string;
  details: string;
  start: Date;
  end: Date;
}): string {
  const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${stamp(start)}/${stamp(end)}`,
    details,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default async function BookingConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<{ cancelado?: string }>;
}) {
  const { slug, id } = await params;
  const { cancelado } = await searchParams;
  const business = await getPublicBusiness(slug);

  if (!business) notFound();

  const appointment = await getPublicAppointment(business.id, id);

  if (!appointment || appointment.business.slug !== slug) notFound();

  const timezone = business.timezone;
  const startsAt = appointment.startsAt;
  const endsAt = appointment.endsAt;
  const code = bookingCode({
    id: appointment.id,
    startsAt,
  });
  const statusMeta = appointmentStatusMeta[appointment.status];
  const isPending = appointment.status === "PENDING";
  const isCancelled = appointment.status === "CANCELLED";
  const isActive =
    appointment.status === "PENDING" || appointment.status === "CONFIRMED";
  const employeeName =
    appointment.employee.displayName ??
    [appointment.employee.firstName, appointment.employee.lastName]
      .filter(Boolean)
      .join(" ");
  const dateLabel = formatLongDate(dateKeyInZone(startsAt, timezone), timezone);
  const timeLabel = formatTime(startsAt, timezone);
  const calendarUrl = googleCalendarUrl({
    title: `${appointment.service.name} · ${business.name}`,
    details: `${code} · ${employeeName}`,
    start: startsAt,
    end: endsAt,
  });
  const windowMinutes = business.settings?.cancellationWindowMinutes ?? 1440;
  const canCancel = canCancelAppointment({
    status: appointment.status,
    startsAt,
    windowMinutes,
  });
  const deadline = cancellationDeadline(startsAt, windowMinutes);
  const token = createCancellationToken({
    appointmentId: appointment.id,
    businessId: business.id,
    startsAt,
  });

  const headline = isCancelled
    ? {
        eyebrow: "Reserva cancelada",
        title: "El turno fue cancelado",
        description:
          "La cancelación quedó registrada. Si querés volver a reservar, elegí otro horario.",
      }
    : isPending
      ? {
          eyebrow: "Reserva solicitada",
          title: "Tu turno está en revisión",
          description:
            "El negocio va a confirmarlo a la brevedad. Guardá el código para consultarlo.",
        }
      : {
          eyebrow: "Reserva confirmada",
          title: "¡Tu turno está reservado!",
          description: `Te esperamos en ${business.name}. Guardá el código para consultarlo.`,
        };

  return (
    <div className="mx-auto max-w-2xl">
      {cancelado === "1" && isCancelled ? (
        <p
          role="status"
          className="mb-6 rounded-md border border-success/30 bg-success/5 px-3 py-2 text-[13px] text-success"
        >
          El turno fue cancelado. La confirmación quedó registrada en el historial.
        </p>
      ) : null}

      <div className="text-center">
        <span
          aria-hidden="true"
          className={cn(
            "mx-auto grid size-12 place-items-center rounded-full",
            isCancelled
              ? "bg-danger/10 text-danger"
              : isPending
                ? "bg-warning/10 text-warning"
                : "bg-success/10 text-success",
          )}
        >
          {isCancelled ? (
            <CalendarX className="size-6" strokeWidth={1.75} />
          ) : isPending ? (
            <Clock3 className="size-6" strokeWidth={2} />
          ) : (
            <Check className="size-6" strokeWidth={2} />
          )}
        </span>
        <p className="mt-5 text-[11px] font-medium tracking-[0.2em] text-ink-muted uppercase">
          {headline.eyebrow}
        </p>
        <h1 className="mt-2 font-display text-4xl leading-tight font-semibold tracking-[var(--theme-tracking-display)] sm:text-5xl">
          {headline.title}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-muted">
          {headline.description}
        </p>
      </div>

      <section
        aria-labelledby="detalle-title"
        className="mt-9 overflow-hidden rounded-lg border border-line bg-surface"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <p className="text-[11px] tracking-[0.18em] text-ink-muted uppercase">
              Código de reserva
            </p>
            <p className="mt-1 font-display text-2xl font-semibold tracking-[0.12em]">
              {code}
            </p>
          </div>
          <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
        </div>

        <dl className="divide-y divide-line px-5">
          <DetailRow label="Servicio" value={appointment.service.name} />
          <DetailRow
            label="Profesional"
            value={employeeName}
            icon={<UserRound className="size-4" strokeWidth={1.75} />}
          />
          <DetailRow
            label="Cuándo"
            value={`${dateLabel} · ${timeLabel} hs`}
            icon={<Clock3 className="size-4" strokeWidth={1.75} />}
          />
          <DetailRow
            label="Duración"
            value={formatDurationMinutes(appointment.durationMinutes)}
          />
          <DetailRow
            label="Precio"
            value={formatPrice(
              appointment.priceCents,
              appointment.currency,
              business.locale,
            )}
          />
          <DetailRow
            label="A nombre de"
            value={`${appointment.customer.firstName} ${appointment.customer.lastName ?? ""}`.trim()}
          />
          {appointment.customerNotes ? (
            <DetailRow label="Notas" value={appointment.customerNotes} />
          ) : null}
          {isCancelled && appointment.cancellationReason ? (
            <DetailRow
              label="Motivo"
              value={appointment.cancellationReason}
            />
          ) : null}
        </dl>
      </section>

      {appointment.events.length > 0 ? (
        <section
          aria-labelledby="historial-title"
          className="mt-6 overflow-hidden rounded-lg border border-line bg-surface"
        >
          <div className="border-b border-line px-5 py-4">
            <h2
              id="historial-title"
              className="font-display text-lg font-semibold tracking-[var(--theme-tracking-display)]"
            >
              Historial del turno
            </h2>
          </div>
          <ol className="divide-y divide-line px-5">
            {appointment.events.map((event) => (
              <li key={event.id} className="py-3.5 text-[13px]">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <span className="font-medium">{eventLabels[event.type]}</span>
                  <time
                    dateTime={event.createdAt.toISOString()}
                    className="text-[11px] text-ink-muted"
                  >
                    {formatHistoryDate(event.createdAt, timezone)} ·{" "}
                    {formatTime(event.createdAt, timezone)}
                  </time>
                </div>
                {event.note ? (
                  <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">
                    {event.note}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {appointment.business.settings?.cancellationPolicyText ? (
        <p className="mt-5 rounded-md border border-line bg-surface-2 px-4 py-3 text-[12px] leading-relaxed text-ink-muted">
          {appointment.business.settings.cancellationPolicyText}
        </p>
      ) : null}

      {canCancel ? (
        <div className="mt-5 rounded-md border border-danger/20 bg-danger/5 px-4 py-3 text-[12px] leading-relaxed text-ink-muted">
          <p>
            Podés cancelar hasta el{" "}
            <strong className="font-medium text-ink">
              {formatLongDate(dateKeyInZone(deadline, timezone), timezone)} a las{" "}
              {formatTime(deadline, timezone)} hs
            </strong>
            .
          </p>
          <Link
            href={`/b/${slug}/cancelar/${token}`}
            className="mt-2 inline-flex text-[13px] font-medium text-danger underline underline-offset-4 hover:no-underline"
          >
            Cancelar este turno
          </Link>
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={`/b/${business.slug}`} className={cn(buttonVariants())}>
          Reservar otro turno
        </Link>
        {isActive ? (
          <a
            href={calendarUrl}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <CalendarPlus className="size-4" strokeWidth={1.75} />
            Agregar al calendario
          </a>
        ) : null}
        {business.phone ? (
          <a
            href={`tel:${business.phone.replace(/\s/g, "")}`}
            className={cn(buttonVariants({ variant: "ghost" }))}
          >
            <Phone className="size-4" strokeWidth={1.75} />
            Llamar
          </a>
        ) : null}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5 text-[13px]">
      <dt className="inline-flex items-center gap-2 text-ink-muted">
        {icon}
        {label}
      </dt>
      <dd className="max-w-[65%] text-right font-medium text-ink">{value}</dd>
    </div>
  );
}
