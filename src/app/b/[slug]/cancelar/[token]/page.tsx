import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarX, Clock3, Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { appointmentStatusMeta } from "@/lib/appointments";
import {
  canCancelAppointment,
  cancellationDeadline,
} from "@/lib/booking/cancellation";
import {
  bookingCode,
  getPublicAppointment,
  getPublicBusiness,
} from "@/lib/booking/public";
import { verifyCancellationToken } from "@/lib/booking/token";
import {
  dateKeyInZone,
  formatDurationMinutes,
  formatLongDate,
  formatPrice,
  formatTime,
} from "@/lib/date";
import { cn } from "@/lib/utils";

import { CancelBookingForm } from "./cancel-booking-form";

export const metadata: Metadata = {
  title: "Cancelar turno",
};

export default async function CancelBookingPage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>;
}) {
  const { slug, token } = await params;
  const verified = verifyCancellationToken(token);
  const business = await getPublicBusiness(slug);

  if (!business) notFound();

  if (!verified || verified.businessId !== business.id) {
    return <InvalidLink slug={business.slug} phone={business.phone} />;
  }

  const appointment = await getPublicAppointment(
    business.id,
    verified.appointmentId,
  );

  if (!appointment || appointment.business.slug !== slug) {
    return <InvalidLink slug={business.slug} phone={business.phone} />;
  }

  const timezone = business.timezone;
  const statusMeta = appointmentStatusMeta[appointment.status];
  const code = bookingCode({ id: appointment.id, startsAt: appointment.startsAt });
  const employeeName =
    appointment.employee.displayName ??
    [appointment.employee.firstName, appointment.employee.lastName]
      .filter(Boolean)
      .join(" ");
  const dateLabel = formatLongDate(
    dateKeyInZone(appointment.startsAt, timezone),
    timezone,
  );
  const windowMinutes = business.settings?.cancellationWindowMinutes ?? 1440;
  const deadline = cancellationDeadline(appointment.startsAt, windowMinutes);
  const deadlineLabel = `${formatLongDate(
    dateKeyInZone(deadline, timezone),
    timezone,
  )} a las ${formatTime(deadline, timezone)} hs`;
  const canCancel = canCancelAppointment({
    status: appointment.status,
    startsAt: appointment.startsAt,
    windowMinutes,
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-center">
        <span
          aria-hidden="true"
          className="mx-auto grid size-12 place-items-center rounded-full bg-danger/10 text-danger"
        >
          <CalendarX className="size-6" strokeWidth={1.75} />
        </span>
        <p className="mt-5 text-[11px] font-medium tracking-[0.2em] text-ink-muted uppercase">
          Gestión de reservas
        </p>
        <h1 className="mt-2 font-display text-4xl leading-tight font-semibold tracking-[var(--theme-tracking-display)] sm:text-5xl">
          Cancelar turno
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-muted">
          Revisá los datos antes de confirmar. Esta acción no se puede deshacer
          desde este enlace.
        </p>
      </div>

      <section
        aria-labelledby="cancel-detail-title"
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
          <DetailRow label="Profesional" value={employeeName} />
          <DetailRow
            label="Cuándo"
            value={`${dateLabel} · ${formatTime(appointment.startsAt, timezone)} hs`}
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
        </dl>
      </section>

      {appointment.status === "CANCELLED" ? (
        <Notice title="Este turno ya fue cancelado">
          No tenés que hacer nada. Si necesitás reservar de nuevo, elegí otro
          horario.
        </Notice>
      ) : !canCancel ? (
        <Notice title="Ya no se puede cancelar desde acá">
          El tiempo límite era el {deadlineLabel}. Comunicate con {business.name}
          {business.phone ? ` al ${business.phone}` : ""} para ver opciones.
        </Notice>
      ) : (
        <>
          <p className="mt-5 rounded-md border border-line bg-surface-2 px-4 py-3 text-[12px] leading-relaxed text-ink-muted">
            Podés cancelar hasta el <strong className="font-medium text-ink">{deadlineLabel}</strong>.
            {appointment.business.settings?.cancellationPolicyText
              ? ` ${appointment.business.settings.cancellationPolicyText}`
              : ""}
          </p>

          <CancelBookingForm slug={slug} token={token} />
        </>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href={`/b/${slug}/reserva/${appointment.id}`}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Volver a la confirmación
        </Link>
        {business.phone ? (
          <a
            href={`tel:${business.phone.replace(/\s/g, "")}`}
            className={cn(buttonVariants({ variant: "ghost" }))}
          >
            <Phone className="size-4" strokeWidth={1.75} />
            Llamar al negocio
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

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      role="status"
      className="mt-6 rounded-md border border-line bg-surface-2 px-4 py-4 text-[13px] leading-relaxed text-ink-muted"
    >
      <p className="font-medium text-ink">{title}</p>
      <p className="mt-1">{children}</p>
    </div>
  );
}

function InvalidLink({ slug, phone }: { slug: string; phone: string | null }) {
  return (
    <div className="mx-auto max-w-lg text-center">
      <span
        aria-hidden="true"
        className="mx-auto grid size-12 place-items-center rounded-full bg-warning/10 text-warning"
      >
        <CalendarX className="size-6" strokeWidth={1.75} />
      </span>
      <h1 className="mt-5 font-display text-3xl font-semibold tracking-[var(--theme-tracking-display)]">
        Este enlace no está disponible
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-muted">
        Puede haber vencido o no corresponder a un turno activo. Si necesitás
        cancelar, contactá al negocio.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href={`/b/${slug}`} className={cn(buttonVariants())}>
          Ver horarios
        </Link>
        {phone ? (
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <Phone className="size-4" strokeWidth={1.75} />
            Llamar
          </a>
        ) : null}
      </div>
    </div>
  );
}
