import { addMinutes, format } from "date-fns";

import { ConfirmationCard, type ConfirmationData } from "@/components/booking/confirmation-card";
import { BookingWizard } from "@/components/booking/wizard/booking-wizard";
import { SiteFooter, SiteHeader } from "@/components/site/site-chrome";
import type { Concept } from "@/lib/concepts";
import { parseDateKey, type BookingQuery } from "@/lib/booking/schema";
import { formatLongDate } from "@/lib/booking/schedule";
import { business, services, staff } from "@/lib/demo-data";

export function BookingView({ concept }: { concept: Concept }) {
  return (
    <>
      <SiteHeader concept={concept} />
      <main id="contenido">
        <BookingWizard concept={concept} />
      </main>
      <SiteFooter concept={concept} />
    </>
  );
}

/** Reserva de ejemplo para cuando se entra a /confirmacion sin parámetros. */
const DEMO_BOOKING: BookingQuery = {
  code: "EN-4F2A",
  service: "corte-barba",
  staff: "tomas",
  date: "2026-11-19",
  time: "17:00",
};

function googleCalendarUrl(
  title: string,
  details: string,
  location: string,
  date: Date,
  time: string,
  duration: number,
): string {
  const [hours, minutes] = time.split(":").map(Number);
  const start = new Date(date);
  start.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  const end = addMinutes(start, duration);
  const stamp = (value: Date) => format(value, "yyyyMMdd'T'HHmmss");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details,
    location,
    dates: `${stamp(start)}/${stamp(end)}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function ConfirmationView({
  concept,
  booking,
}: {
  concept: Concept;
  booking: BookingQuery | null;
}) {
  const base = `/lab/${concept.id}`;
  const resolved = booking ?? DEMO_BOOKING;

  const service = services.find((item) => item.id === resolved.service) ?? services[0];
  const person = staff.find((item) => item.id === resolved.staff);
  const date = parseDateKey(resolved.date);

  if (!service) {
    throw new Error("La demo necesita al menos un servicio configurado.");
  }

  const data: ConfirmationData = {
    code: resolved.code,
    serviceName: service.name,
    duration: service.duration,
    price: service.price,
    staffName: person?.name ?? "El primero disponible",
    dateLabel: formatLongDate(date),
    time: resolved.time,
    calendarUrl: googleCalendarUrl(
      `${service.name} · Estudio Norte`,
      `Reserva ${resolved.code}. Cancelación sin costo hasta 24 h antes.`,
      business.address,
      date,
      resolved.time,
      service.duration,
    ),
  };

  return (
    <>
      <SiteHeader concept={concept} />
      <main id="contenido">
        <ConfirmationCard base={base} pill={concept.layout.shape === "pill"} data={data} />
      </main>
      <SiteFooter concept={concept} />
    </>
  );
}
