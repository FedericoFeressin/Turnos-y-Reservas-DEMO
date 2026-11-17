import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarPlus, Check, Clock3, Phone, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  bookingCode,
  getPublicAppointment,
  getPublicBusiness,
} from "@/lib/booking/public";
import {
  dateKeyInZone,
  formatDurationMinutes,
  formatLongDate,
  formatPrice,
  formatTime,
} from "@/lib/date";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Turno reservado",
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
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
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
  const isPending = appointment.status === "PENDING";
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

  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-center">
        <span
          aria-hidden="true"
          className={cn(
            "mx-auto grid size-12 place-items-center rounded-full",
            isPending ? "bg-warning/10 text-warning" : "bg-success/10 text-success",
          )}
        >
          <Check className="size-6" strokeWidth={2} />
        </span>
        <p className="mt-5 text-[11px] font-medium tracking-[0.2em] text-ink-muted uppercase">
          {isPending ? "Reserva solicitada" : "Reserva confirmada"}
        </p>
        <h1 className="mt-2 font-display text-4xl leading-tight font-semibold tracking-[var(--theme-tracking-display)] sm:text-5xl">
          {isPending ? "Tu turno está en revisión" : "¡Tu turno está reservado!"}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-muted">
          {isPending
            ? "El negocio va a confirmarlo a la brevedad. Guardá el código para consultarlo."
            : `Te esperamos en ${business.name}. Guardá el código para consultarlo.`}
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
          <Badge tone={isPending ? "warning" : "success"}>
            {isPending ? "Pendiente" : "Confirmado"}
          </Badge>
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
        </dl>
      </section>

      {appointment.business.settings?.cancellationPolicyText ? (
        <p className="mt-5 rounded-md border border-line bg-surface-2 px-4 py-3 text-[12px] leading-relaxed text-ink-muted">
          {appointment.business.settings.cancellationPolicyText}
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={`/b/${business.slug}`} className={cn(buttonVariants()) }>
          Reservar otro turno
        </Link>
        <a
          href={calendarUrl}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          <CalendarPlus className="size-4" strokeWidth={1.75} />
          Agregar al calendario
        </a>
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
